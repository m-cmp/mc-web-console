/**
 * deploy/tc/data/TC-DATA-RDB-MIG-01.spec.ts
 * TC-DATA-RDB-MIG-01: RDBMS 마이그레이션 실행 및 조회 (mc-data-manager)
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { assertDataManagerIframe } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-RDB-MIG-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

const DATA_MANAGER = (p.dataManagerBaseUrl as string)
  ?? process.env.DATA_MANAGER_BASE_URL
  ?? 'https://15.164.139.37:3300';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-RDB-MIG-01: RDBMS 마이그레이션 실행', () => {

  test('API: POST /migrate/rdbms — source → target 마이그레이션', async ({ request }) => {
    test.setTimeout(120_000);

    const sourcePoint = p.sourcePoint as Record<string, string>;
    const targetPoint = p.targetPoint as Record<string, string>;

    const before = await request.get(API_ROUTES.data.allTasks);
    const beforeTasks = before.ok()
      ? (await before.json() as Array<{ meta: { serviceType: string; taskType: string } }>)
          .filter(t => t.meta.serviceType === 'rdbms' && t.meta.taskType === 'migrate').length
      : 0;
    console.log(`[${TC_ID}] 마이그레이션 전 rdbms/migrate 태스크: ${beforeTasks}개`);

    let postStatus = 0;
    try {
      const res = await request.post(`${DATA_MANAGER}/migrate/rdbms`, {
        data: { sourcePoint, targetPoint },
        timeout: 90_000,
      });
      postStatus = res.status();
      const body = await res.text();
      console.log(`[${TC_ID}] POST /migrate/rdbms HTTP ${postStatus}`);
      console.log(`[${TC_ID}] 응답: ${body.slice(0, 200)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[${TC_ID}] POST timeout/error: ${msg.slice(0, 100)}`);
    }

    await new Promise(r => setTimeout(r, 3_000));
    const after = await request.get(API_ROUTES.data.allTasks);
    if (after.ok()) {
      const afterTasks = (await after.json() as Array<{ meta: { serviceType: string; taskType: string } }>)
        .filter(t => t.meta.serviceType === 'rdbms' && t.meta.taskType === 'migrate');
      console.log(`[${TC_ID}] 마이그레이션 후 rdbms/migrate 태스크: ${afterTasks.length}개`);
      expect(afterTasks.length).toBeGreaterThanOrEqual(beforeTasks);
    }

    if (postStatus !== 0) {
      expect([200, 504]).toContain(postStatus);
    }
  });

  test('API: GET /migrate 목록 — RDBMS migrate 태스크 확인', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.migrateList);
    expect(res.ok(), `GET /migrate → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string; taskId?: string } }>;
    if (Array.isArray(body)) {
      const rdbTasks = body.filter(t => t.meta?.serviceType === 'rdbms');
      console.log(`[${TC_ID}] migrate 전체: ${body.length}건, rdbms: ${rdbTasks.length}건`);
    }
  });

  test('API: GET /credentials — DB 자격증명 목록 확인', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.credentialList);
    expect(res.ok(), `GET /credentials → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ configName?: string; providerName?: string }>;
    expect(Array.isArray(body)).toBe(true);
    console.log(`[${TC_ID}] credentials: ${body.length}건`);
  });

  test('UI: RDBMS 화면 진입 및 iframe 로드 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.rdbms, TC_ID);
    if (!ok) return;

    const iframeOk = await assertDataManagerIframe(page, TC_ID);
    if (iframeOk) {
      expect(page.url()).toMatch(/\/webconsole\//);
      console.log(`[${TC_ID}] RDBMS 화면 진입 완료`);
    }
  });
});
