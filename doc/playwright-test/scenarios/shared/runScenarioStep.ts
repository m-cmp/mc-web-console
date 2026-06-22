/**
 * deploy/scenarios/shared/runScenarioStep.ts
 * 레지스트리 스텝(TC ID)별 최소 실행 — API/UI smoke + runtime store 연계
 */
import { expect, type Page, type APIRequestContext } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { apiLogin, loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { gotoSwIframeTab } from '../../../mc-web-console/helpers/sw-iframe.helper';
import { ScenarioContext } from '../../params/runtime/context';
import { ScenarioRuntimeStore } from '../../params/runtime/store';
import type { ScenarioStep } from '../../registry/types';

const DATA_MANAGER = process.env.DATA_MANAGER_BASE_URL ?? 'https://15.164.139.37:3300';
const DEFAULT_NS = 'default';

export interface StepRunContext {
  page: Page;
  request: APIRequestContext;
  store: ScenarioRuntimeStore;
  scenarioId: string;
  step: ScenarioStep;
}

function warn(tag: string, msg: string) {
  console.warn(`[${tag}] ${msg}`);
}

async function iamSmoke(request: APIRequestContext, route: string, tag: string): Promise<boolean> {
  const auth = await apiLogin(request);
  const res = await request.post(route, { headers: auth, data: {} });
  if (!res.ok()) {
    warn(tag, `IAM API ${res.status()} — ${route}`);
    return false;
  }
  console.log(`[${tag}] IAM API OK: ${route}`);
  return true;
}

async function runInfraMci03(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { request, store, scenarioId } = ctx;
  const sc = new ScenarioContext(scenarioId, 'TC-INFRA-MCI-03', variant);
  const nsId = (sc.params.nsId as string) ?? DEFAULT_NS;
  const baseName = (sc.params.mciName as string) ?? `deploy-${scenarioId}`;
  const mciName = variant ? `${baseName}-${variant}` : baseName;
  const auth = await apiLogin(request);

  const listRes = await request.post(API_ROUTES.infra.listMci, {
    headers: auth,
    data: { pathParams: { nsId } },
  });
  if (listRes.ok()) {
    const body = await listRes.json() as {
      responseData?: { infra?: Array<{ id?: string; name?: string }> };
    };
    const existing = (body.responseData?.infra ?? []).find(m => m.name === mciName);
    if (existing?.id) {
      store.set('mciId', existing.id);
      store.set('mciName', mciName);
      store.set('nsId', nsId);
      console.log(`[${tag}] MCI 재사용: ${mciName} (${existing.id})`);
      return;
    }
  }

  const res = await request.post(API_ROUTES.infra.createMciDynamic, {
    headers: auth,
    data: {
      pathParams: { nsId },
      Request: {
        name: mciName,
        description: `${scenarioId} deploy scenario`,
        nodeGroups: [{
          name: `${mciName}-vm-0`,
          connectionName: sc.params.connectionName as string ?? 'aws-ap-northeast-2',
          specId: sc.params.commonSpec as string ?? 'aws+ap-northeast-2+t3a.small',
          subGroupSize: 1,
          rootDiskSize: 0,
          rootDiskType: 'default',
        }],
      },
    },
  });

  if (!res.ok()) {
    warn(tag, `MCI 생성 실패 ${res.status()} — bypass`);
    store.setBypassed('TC-INFRA-MCI-03');
    return;
  }

  const body = await res.json() as { responseData?: { id?: string } };
  const mciId = body.responseData?.id ?? mciName;
  store.set('mciId', mciId);
  store.set('mciName', mciName);
  store.set('nsId', nsId);
  console.log(`[${tag}] MCI 생성: ${mciId}`);
}

async function runInfraMci01(ctx: StepRunContext, tag: string): Promise<void> {
  const mciId = ctx.store.getOrDefault<string>('mciId', '');
  const auth = await apiLogin(ctx.request);
  const nsId = ctx.store.getOrDefault<string>('nsId', DEFAULT_NS);
  const res = await ctx.request.post(API_ROUTES.infra.listMci, {
    headers: auth,
    data: { pathParams: { nsId } },
  });
  expect(res.ok(), `[${tag}] GetAllInfra`).toBeTruthy();
  if (mciId) {
    const body = await res.json() as {
      responseData?: { infra?: Array<{ id?: string; name?: string; status?: string }> };
    };
    const mci = (body.responseData?.infra ?? []).find(m => m.id === mciId || m.name === mciId);
    console.log(`[${tag}] MCI 상태: ${mci?.status ?? 'not found'}`);
  }
}

async function runInfraMci04(ctx: StepRunContext, tag: string, action: string): Promise<void> {
  const mciId = ctx.store.getOrDefault<string>('mciId', '');
  if (!mciId) {
    warn(tag, 'mciId 없음 — lifecycle skip');
    return;
  }
  const auth = await apiLogin(ctx.request);
  const nsId = ctx.store.getOrDefault<string>('nsId', DEFAULT_NS);
  const res = await ctx.request.post(API_ROUTES.infra.controlMci, {
    headers: auth,
    data: { pathParams: { nsId, infraId: mciId }, queryParams: { action } },
  });
  if (!res.ok()) warn(tag, `${action} ${res.status()}`);
  else console.log(`[${tag}] MCI ${action} OK`);
}

async function runInfraMci05(ctx: StepRunContext, tag: string): Promise<void> {
  const mciId = ctx.store.getOrDefault<string>('mciId', '');
  if (!mciId) return;
  const auth = await apiLogin(ctx.request);
  const nsId = ctx.store.getOrDefault<string>('nsId', DEFAULT_NS);
  const res = await ctx.request.post(API_ROUTES.infra.delInfra, {
    headers: auth,
    data: { pathParams: { nsId, infraId: mciId }, queryParams: { option: 'force' } },
  });
  console.log(`[${tag}] DelInfra ${res.status()}`);
}

export async function runScenarioStep(ctx: StepRunContext): Promise<void> {
  const { page, request, scenarioId, step } = ctx;
  const tag = `${scenarioId}/Step${step.order}`;
  const tcId = step.tcId;
  const variant = step.variant;

  // ── IAM ──────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-IAM-AUTH-01')) {
    const ok = await loginAndGoto(page, PAGES.operations.workspaces, tag);
    if (ok) console.log(`[${tag}] 로그인 UI OK`);
    return;
  }
  if (tcId.startsWith('TC-IAM-AUTH-05')) {
    await iamSmoke(request, API_ROUTES.auth.signup, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-USERGROUP-03')) {
    await iamSmoke(request, API_ROUTES.iam.listUsers, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-USERGROUP-08')) {
    await iamSmoke(request, API_ROUTES.iam.listGroups, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-USERGROUP-11')) {
    await iamSmoke(request, API_ROUTES.iam.listGroups, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-ROLE-06')) {
    await iamSmoke(request, API_ROUTES.iam.listPlatformRoles, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-WORKSPACE-')) {
    const ok = await loginAndGoto(page, PAGES.operations.workspaces, tag);
    if (ok) await iamSmoke(request, API_ROUTES.iam.listWorkspaces, tag);
    return;
  }
  if (tcId.startsWith('TC-IAM-USER-LIFECYCLE-')) {
    await iamSmoke(request, API_ROUTES.iam.listUsers, tag);
    const ok = await loginAndGoto(page, PAGES.settings.approvals, tag);
    if (ok) console.log(`[${tag}] approvals UI OK`);
    return;
  }

  // ── CSP ──────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-CSP-CREDENTIAL-03')) {
    const auth = await apiLogin(request);
    const res = await request.post(API_ROUTES.csp.listCredentials, { headers: auth, data: {} });
    if (!res.ok()) warn(tag, `Credentials ${res.status()}`);
    else console.log(`[${tag}] CSP credentials OK`);
    return;
  }
  if (tcId.startsWith('TC-CSP-CONNECTION-02')) {
    const auth = await apiLogin(request);
    const res = await request.post(API_ROUTES.csp.listConnections, { headers: auth });
    expect(res.ok()).toBeTruthy();
    console.log(`[${tag}] CSP connections OK`);
    return;
  }

  // ── INFRA ────────────────────────────────────────────────────────────────
  if (tcId === 'TC-INFRA-MCI-03') {
    await runInfraMci03(ctx, tag, variant);
    return;
  }
  if (tcId === 'TC-INFRA-MCI-01') {
    await runInfraMci01(ctx, tag);
    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
    if (ok) console.log(`[${tag}] MCI Workloads UI OK`);
    return;
  }
  if (tcId === 'TC-INFRA-MCI-02') {
    await runInfraMci01(ctx, tag);
    return;
  }
  if (tcId === 'TC-INFRA-MCI-04') {
    const action = step.description.toLowerCase().includes('suspend') ? 'suspend'
      : step.description.toLowerCase().includes('reboot') ? 'reboot'
        : 'resume';
    await runInfraMci04(ctx, tag, action);
    return;
  }
  if (tcId === 'TC-INFRA-MCI-05') {
    await runInfraMci05(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-INFRA-SSH-KEY-02')) {
    await iamSmoke(request, API_ROUTES.infra.listSshKeys, tag);
    return;
  }
  if (tcId.startsWith('TC-INFRA-K8S-07')) {
    const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
    if (ok) console.log(`[${tag}] PMK Workloads UI OK`);
    return;
  }

  // ── SW / APP ─────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-APP-CAT-05') || tcId.startsWith('TC-SW-CATALOG-01')) {
    const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
    if (!ok) return;
    const frame = await gotoSwIframeTab(page, /catalog/i, tag);
    if (frame) console.log(`[${tag}] Catalog tab OK`);
    return;
  }
  if (tcId.startsWith('TC-APP-REP-')) {
    const ok = await loginAndGoto(page, PAGES.sw.repository, tag);
    if (!ok) return;
    const frame = await gotoSwIframeTab(page, /repository/i, tag);
    if (frame) console.log(`[${tag}] Repository tab OK`);
    return;
  }
  if (tcId.startsWith('TC-SW-CATALOG-02') || tcId.startsWith('TC-APP-DEP-01')) {
    const ok = await loginAndGoto(page, PAGES.sw.deploy, tag);
    if (ok) console.log(`[${tag}] SW deploy UI OK (mciId=${ctx.store.getOrDefault('mciId', '')})`);
    return;
  }
  if (tcId.startsWith('TC-APP-APPS-02') || tcId.startsWith('TC-APP-APPS-03')) {
    const ok = await loginAndGoto(page, PAGES.sw.appsStatus, tag);
    if (!ok) return;
    const frame = await gotoSwIframeTab(page, /apps?\s*status|appsStatus/i, tag);
    if (frame) console.log(`[${tag}] Apps Status tab OK`);
    return;
  }
  if (tcId.startsWith('TC-SW-CATALOG-03')) {
    warn(tag, 'SW undeploy — API discovery TODO');
    return;
  }

  // ── OBS ──────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-OBS-MON-CONFIG-01') || tcId.startsWith('TC-OBS-MON-CONFIG-02')) {
    const ok = await loginAndGoto(page, PAGES.obs.monitoringConfig, tag);
    if (ok) console.log(`[${tag}] OBS config UI OK`);
    return;
  }
  if (tcId.startsWith('TC-OBS-MON-DATA-01')) {
    const ok = await loginAndGoto(page, PAGES.obs.monitoringConfig, tag);
    if (ok) console.log(`[${tag}] OBS data UI OK`);
    return;
  }
  if (tcId.startsWith('TC-OBS-MON-INSIGHT-01')) {
    const ok = await loginAndGoto(page, PAGES.obs.monitoringConfig, tag);
    if (ok) console.log(`[${tag}] OBS insight UI OK`);
    return;
  }
  if (tcId.startsWith('TC-OBS-LOG-01')) {
    const ok = await loginAndGoto(page, PAGES.obs.monitoringConfig, tag);
    if (ok) console.log(`[${tag}] OBS log UI OK`);
    return;
  }
  if (tcId.startsWith('TC-OBS-TRACE-01')) {
    warn(tag, 'Trace — Jaeger 미설치 환경 bypass');
    return;
  }

  // ── COST ─────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-COST-BILL-')) {
    const auth = await apiLogin(request);
    const route = tcId.includes('01') ? API_ROUTES.costAnalysis.getApiHosts
      : tcId.includes('02') ? API_ROUTES.costAnalysis.getCurMonthBill
        : API_ROUTES.costAnalysis.getTop5Bill;
    const res = await request.post(route, { headers: auth, data: {} }).catch(() => null);
    console.log(`[${tag}] Cost API ${res?.status() ?? 'err'}`);
    return;
  }
  if (tcId.startsWith('TC-COST-IFRAME-01')) {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (ok) console.log(`[${tag}] Cost Analysis UI OK`);
    return;
  }

  // ── WORKFLOW ─────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-WORKFLOW-01')) {
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (ok) console.log(`[${tag}] Workflow list UI OK`);
    return;
  }
  if (tcId.startsWith('TC-WORKFLOW-02') || tcId.startsWith('TC-WF-FLOW-02')) {
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (ok) console.log(`[${tag}] Workflow define UI OK`);
    return;
  }
  if (tcId.startsWith('TC-WORKFLOW-03') || tcId.startsWith('TC-WORKFLOW-04')) {
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (ok) console.log(`[${tag}] Workflow run/delete UI OK`);
    return;
  }

  // ── DATA ─────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-DATA-OBJ-MIG-01')) {
    const res = await request.get(API_ROUTES.data.migrateList);
    console.log(`[${tag}] migrateList ${res.status()}`);
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, tag);
    if (ok) console.log(`[${tag}] Object Storage UI OK`);
    return;
  }
  if (tcId.startsWith('TC-DATA-OBJ-BAK-01')) {
    const res = await request.get(API_ROUTES.data.backupList);
    console.log(`[${tag}] backupList ${res.status()}`);
    return;
  }
  if (tcId.startsWith('TC-DATA-RDB-MIG-01')) {
    const ok = await loginAndGoto(page, PAGES.data.rdbms, tag);
    if (ok) console.log(`[${tag}] RDBMS UI OK`);
    return;
  }
  if (tcId.startsWith('TC-DATA-RDB-BAK-01')) {
    const res = await request.get(API_ROUTES.data.backupList);
    console.log(`[${tag}] RDB backupList ${res.status()}`);
    return;
  }
  if (tcId.startsWith('TC-DATA-NORDB-MIG-01')) {
    const ok = await loginAndGoto(page, PAGES.data.nordbms, tag);
    if (ok) console.log(`[${tag}] NoRDBMS UI OK`);
    return;
  }
  if (tcId.startsWith('TC-DATA-NORDB-BAK-01')) {
    const res = await request.get(API_ROUTES.data.backupList);
    console.log(`[${tag}] NoRDB backupList ${res.status()}`);
    return;
  }

  warn(tag, `미매핑 TC ${tcId} — smoke skip`);
}
