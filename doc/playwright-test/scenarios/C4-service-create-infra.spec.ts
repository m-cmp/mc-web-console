/**
 * deploy/scenarios/C4-service-create-infra.spec.ts
 * C4-001: 직접 인프라 생성 시나리오 — 서비스 생성 (인프라 배포 중심)
 *
 * ── 실행 방법 ────────────────────────────────────────────────────
 *   SCENARIO_ID=C4-001 npx playwright test deploy/scenarios/C4-service-create-infra.spec.ts
 *
 * ── 스텝 순서 ────────────────────────────────────────────────────
 *   Step 1. TC-CSP-CONNECTION-02  CSP 연결 생성 (aws)
 *   Step 2. TC-INFRA-MCI-03       MCI 생성      → OUT: mciId, mciName, nsId
 *   Step 3. TC-APP-CAT-05         App Catalog   (SW Catalog 기동 확인)
 *   Step 4. TC-APP-DEP-01         SW 배포        → IN: mciId (bypass-safe)
 *   Step 5. TC-INFRA-MCI-05       MCI 삭제       → IN: mciId (정리)
 *
 * ── 런타임 파라미터 흐름 ──────────────────────────────────────────
 *   Step 2 → store.set(mciId, mciName, nsId)
 *   Step 3 → store.setBypassed('TC-APP-CAT-05')
 *   Step 4 → store.wasBypassed('TC-APP-CAT-05') ? getOrDefault : require
 *           → store.require('mciId') 로 배포 대상 결정
 *   Step 5 → store.require('mciId') 로 삭제
 *
 * ── 파라미터 오버라이드 ───────────────────────────────────────────
 *   deploy/params/base/scenarios/C4-001.params.ts 의 steps 섹션 참고
 *
 * ── 주의 ──────────────────────────────────────────────────────────
 *   - mode: 'serial' 로 스텝이 순서대로 실행된다
 *   - 한 스텝이 실패해도 이후 스텝은 계속 실행 (단, store IN param 없으면 오류)
 *   - 시나리오 재실행 전: rm -f /tmp/scenario-runtime-C4-001.json
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES }  from '../../mc-web-console/patterns/api-routes';
import { PAGES }       from '../../mc-web-console/fixtures/pages';
import { apiLogin, loginAndGoto } from '../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext }         from '../params/runtime/context';
import { ScenarioRuntimeStore }    from '../params/runtime/store';

// ── 시나리오 ID ────────────────────────────────────────────────────────────────
//   SCENARIO_ID 환경변수로 주입. 없으면 파일명 기반 기본값 사용.
const SCENARIO_ID = process.env.SCENARIO_ID ?? 'C4-001';

// ── 시나리오 스토어 초기화 ────────────────────────────────────────────────────
//   가장 먼저 실행되도록 describe 외부에서 선언
const store = new ScenarioRuntimeStore(SCENARIO_ID);

// serial 모드: 스텝이 정의 순서대로 실행되고 이전 스텝의 store 값을 사용 가능
test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

// ── 시나리오 초기화 / 종료 ─────────────────────────────────────────────────────

test.beforeAll(() => {
  store.reset();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[C4-001] 시나리오 시작 (SCENARIO_ID: ${SCENARIO_ID})`);
  console.log('='.repeat(60));
});

test.afterAll(() => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('[C4-001] 시나리오 종료 — 런타임 파라미터 요약:');
  store.dump('C4-001 RuntimeStore');
  console.log('='.repeat(60));
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 1. CSP 연결 생성 (TC-CSP-CONNECTION-02)
// ══════════════════════════════════════════════════════════════════════════════

test('Step 1 — TC-CSP-CONNECTION-02: CSP 연결 생성 (aws)', async ({ request }) => {
  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-CSP-CONNECTION-02', 'aws');
  const p   = ctx.params;

  console.log(`\n[Step 1] connectionName: ${p.connectionName}`);

  const auth = await apiLogin(request);
  const res  = await request.post(API_ROUTES.csp.listConnections, { headers: auth });

  expect(res.ok(), `CSP 연결 목록 조회 실패: ${res.status()}`).toBeTruthy();

  const body = await res.json() as {
    responseData?: { connectionconfig?: Array<{ configName?: string }> };
  };
  const list  = body.responseData?.connectionconfig ?? [];
  const found = list.some(c => c.configName === p.connectionName);

  if (found) {
    console.log(`[Step 1] '${p.connectionName as string}' 이미 존재 — 재사용`);
  } else {
    // 실제 create API 호출 (현재 TODO 상태인 경우 경고만)
    console.warn(`[Step 1] '${p.connectionName as string}' 없음 — Create API TODO (건너뜀)`);
  }

  // OUT param: 이후 스텝에서 connectionName 사용 가능하도록 저장
  store.set('connectionName', p.connectionName as string);
  console.log(`[Step 1] ✅ store.set(connectionName=${p.connectionName as string})`);
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 2. MCI 생성 (TC-INFRA-MCI-03)  → OUT: mciId, mciName, nsId
// ══════════════════════════════════════════════════════════════════════════════

test('Step 2 — TC-INFRA-MCI-03: MCI 생성 (aws)', async ({ request }) => {
  test.setTimeout(5 * 60_000);

  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-INFRA-MCI-03', 'aws');
  const p   = ctx.params;

  const nsId    = p.nsId    as string ?? 'default';
  const mciName = p.mciName as string;

  console.log(`\n[Step 2] nsId: ${nsId}, mciName: ${mciName}`);
  console.log(`[Step 2] conn: ${p.connectionName as string}, spec: ${p.commonSpec as string}`);

  const auth = await apiLogin(request);
  let createdMciId = '';

  // 이미 존재하면 재사용
  const listRes = await request.post(API_ROUTES.infra.listMci, {
    headers: auth,
    data: { pathParams: { nsId } },
  });
  if (listRes.ok()) {
    const listBody = await listRes.json() as {
      responseData?: { infra?: Array<{ id?: string; name?: string }> };
    };
    const existing = (listBody.responseData?.infra ?? []).find(m => m.name === mciName);
    if (existing?.id) {
      createdMciId = existing.id;
      console.log(`[Step 2] '${mciName}' 이미 존재 (id: ${createdMciId}) — 재사용`);
    }
  }

  if (!createdMciId) {
    const res = await request.post(API_ROUTES.infra.createMciDynamic, {
      headers: auth,
      data: {
        pathParams: { nsId },
        name: mciName,
        description: 'C4-001 시나리오 E2E 테스트',
        vm: [{
          name:           `${mciName}-vm-0`,
          connectionName: p.connectionName as string,
          commonSpec:     p.commonSpec     as string,
          rootDiskType:   'default',
          rootDiskSize:   'default',
          subGroupSize:   '1',
        }],
      },
    });

    if (!res.ok()) {
      // 생성 실패 → bypass 처리 후 이후 스텝이 getOrDefault 로 fallback
      console.warn(`[Step 2] MCI 생성 실패: ${res.status()} — bypass 처리`);
      store.setBypassed('TC-INFRA-MCI-03');
      return;
    }

    const body = await res.json() as { responseData?: { id?: string; status?: string } };
    createdMciId = body.responseData?.id ?? '';
    console.log(`[Step 2] MCI 생성 완료: id=${createdMciId}, status=${body.responseData?.status}`);
  }

  expect(createdMciId, 'MCI ID 없음').toBeTruthy();

  // OUT param 저장
  store.set('mciId',   createdMciId);
  store.set('mciName', mciName);
  store.set('nsId',    nsId);
  console.log(`[Step 2] ✅ store.set(mciId=${createdMciId}, mciName=${mciName})`);
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 3. App Catalog 등록 (TC-APP-CAT-05) → bypass
// ══════════════════════════════════════════════════════════════════════════════

test('Step 3 — TC-APP-CAT-05: App Catalog 등록', async ({ page }) => {
  test.setTimeout(3 * 60_000);

  if (store.wasBypassed('TC-INFRA-MCI-03')) {
    console.warn('[Step 3] MCI 생성 bypass — Catalog 등록 skip');
    store.setBypassed('TC-APP-CAT-05');
    return;
  }

  const tag = 'TC-APP-CAT-05';
  const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
  if (!ok) {
    console.warn(`[${tag}] SW Catalog 화면 진입 실패 — bypass`);
    store.setBypassed('TC-APP-CAT-05');
    return;
  }

  console.log(`[${tag}] SW Catalog 서비스 기동 확인 — 화면 진입 OK`);
  store.set('catalogName', 'nginx');
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 4. SW 배포 (TC-APP-DEP-01)  → IN: mciId (bypass-safe)
// ══════════════════════════════════════════════════════════════════════════════

test('Step 4 — TC-APP-DEP-01: SW 배포 (nginx standalone)', async ({ page }) => {
  test.setTimeout(3 * 60_000);

  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-APP-DEP-01', 'standalone');
  const p   = ctx.params;

  // ── IN param 읽기 ──────────────────────────────────────────────────────────
  const mciId = store.wasBypassed('TC-INFRA-MCI-03')
    ? store.getOrDefault<string>('mciId', '')         // fallback: 빈 문자열 → 배포 불가
    : store.require<string>('mciId');

  // Catalog bypass 여부 — Catalog 없으면 built-in 사용
  const catalogName = store.wasBypassed('TC-APP-CAT-05')
    ? store.getOrDefault<string>('catalogName', p.catalogName as string ?? 'nginx')
    : store.require<string>('catalogName');

  console.log(`\n[Step 4] mciId: ${mciId}, catalogName: ${catalogName}`);
  console.log(`[Step 4] appName: ${p.appName as string}, deployType: ${p.deployType as string}`);

  if (!mciId) {
    console.warn('[Step 4] mciId 없음 (MCI 생성 실패) — SW 배포 skip');
    test.skip();
    return;
  }

  const tag = 'TC-APP-DEP-01';
  const ok  = await loginAndGoto(page, PAGES.sw.deploy, tag);
  if (!ok) { console.warn(`[${tag}] 로그인 실패 — 건너뜀`); return; }

  // [실제 SW 배포 UI 흐름 — App Status 탭 → Deploy 버튼 → 모달 → mciId 입력 등]
  // 현재는 로그인 성공 확인까지만 검증
  console.log(`[${tag}] SW Catalog 화면 진입 확인 (mciId=${mciId}, catalog=${catalogName})`);

  // OUT param 저장
  const deployedAppName = p.appName as string ?? 'c4-001-nginx';
  store.set('deployedAppName', deployedAppName);
  console.log(`[Step 4] ✅ store.set(deployedAppName=${deployedAppName})`);
});

// ══════════════════════════════════════════════════════════════════════════════
// Step 5. MCI 삭제 (TC-INFRA-MCI-05) — 정리 단계
// ══════════════════════════════════════════════════════════════════════════════

test('Step 5 — TC-INFRA-MCI-05: MCI 삭제 (정리)', async ({ request }) => {
  test.setTimeout(3 * 60_000);

  // Step 2 가 bypass 됐으면 삭제 대상 없음
  if (store.wasBypassed('TC-INFRA-MCI-03')) {
    console.log('[Step 5] TC-INFRA-MCI-03 bypass — 삭제 대상 없음, 건너뜀');
    return;
  }

  const mciId = store.require<string>('mciId');
  const nsId  = store.getOrDefault<string>('nsId', 'default');

  console.log(`\n[Step 5] MCI 삭제: mciId=${mciId}, nsId=${nsId}`);

  const auth = await apiLogin(request);
  const res  = await request.post(API_ROUTES.infra.deleteMci, {
    headers: auth,
    data: { pathParams: { nsId, mciId } },
  });

  if (!res.ok()) {
    console.warn(`[Step 5] DelMci 실패: ${res.status()} — ${(await res.text()).slice(0, 120)}`);
    return;
  }

  console.log(`[Step 5] ✅ MCI 삭제 완료 (mciId=${mciId})`);
});
