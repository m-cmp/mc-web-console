/**
 * deploy/tc/sw/TC-APP-CAT-05.spec.ts
 * TC-APP-CAT-05: App Catalog 신규 등록
 *
 * status: bypass — Catalog API 불안정 (ISSUE-012)
 *
 * ── bypass 처리 규칙 ──────────────────────────────────────────────
 *   1. test.skip() 으로 모든 테스트를 건너뜀
 *   2. afterAll 에서 store.setBypassed(TC_ID) 호출
 *      → 후속 TC 가 wasBypassed() 로 확인하고 getOrDefault() 처리
 *
 * ── bypass 후 런타임 파라미터 흐름 ───────────────────────────────
 *   이 TC 가 bypass 되면 catalogName OUT param 이 없다.
 *   후속 TC (TC-APP-DEP-01 등) 는 다음 패턴으로 안전하게 처리:
 *
 *     const catalogName = store.wasBypassed('TC-APP-CAT-05')
 *       ? store.getOrDefault('catalogName', ctx.params.catalogName ?? 'nginx')
 *       : store.require('catalogName');
 */
import { test } from '@playwright/test';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-APP-CAT-05';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

// ── TC-APP-CAT-05 (bypass stub) ───────────────────────────────────────────────

test.describe('TC-APP-CAT-05: App Catalog 신규 등록 [bypass]', () => {

  test('Catalog API 미구현 — bypass', async () => {
    test.skip(true, 'TC-APP-CAT-05 bypass: Catalog API 불안정 (ISSUE-012)');
    // 구현 완료 시 아래 본문을 작성하고 test.skip() 제거 후 status 를 ready 로 변경
  });

  // bypass TC 는 afterAll 에서 setBypassed 를 호출해야 후속 TC 가 안전하게 처리된다
  test.afterAll(() => {
    if (!store) return;
    store.setBypassed(TC_ID);
    console.log(`[TC-APP-CAT-05] bypass 처리 → store.setBypassed('${TC_ID}')`);
  });

});
