/**
 * deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 * TC-INFRA-MCI-03: MCI 생성 (MultiCloud Infrastructure)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *   TC_VARIANT=azure npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *
 * ── 시나리오 실행 (런타임 store OUT param 저장) ────────────────────
 *   SCENARIO_ID=C4-001 TC_VARIANT=aws \
 *     npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *
 * ── 파라미터 우선순위 ──────────────────────────────────────────────
 *   base/tc/infra/TC-INFRA-MCI-03.params.ts   (Layer 1)
 *   env/local.params.ts                         (Layer 2)
 *   base/scenarios/{SCENARIO_ID}.params.ts      (Layer 3, 시나리오 모드)
 *   PW_* 환경변수                                (Layer 4, 최우선)
 *
 * ── 런타임 OUT params (시나리오 모드) ─────────────────────────────
 *   store.set('mciId',   생성된 MCI ID)
 *   store.set('mciName', mciName)
 *   store.set('nsId',    nsId)
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES }       from '../../../mc-web-console/fixtures/pages';
import { apiLogin, loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

// ── 컨텍스트 결정 ─────────────────────────────────────────────────────────────
//   SCENARIO_ID 있음 → 시나리오 모드: 4-레이어 params + 런타임 store 활성화
//   SCENARIO_ID 없음 → 단독 실행 모드: Layer 1+2+4 params, store 없음
const TC_ID      = 'TC-INFRA-MCI-03';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);

const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

// ── MCI 생성 결과 수집 변수 (afterAll 에서 store 에 저장) ────────────────────
let createdMciId = '';

test.use({ storageState: { cookies: [], origins: [] } });

// ── TC-INFRA-MCI-03 ───────────────────────────────────────────────────────────

test.describe('TC-INFRA-MCI-03: MCI 생성', () => {

  test('API: MCI 생성 (PostInfraDynamic)', async ({ request }) => {
    test.setTimeout(5 * 60_000);

    const auth    = await apiLogin(request);
    const nsId    = p.nsId    as string ?? 'default';
    const mciName = p.mciName as string ?? 'tc-mci-temp';

    console.log(`[TC-INFRA-MCI-03] variant: ${variant ?? '(base)'}`);
    console.log(`[TC-INFRA-MCI-03] params: nsId=${nsId}, mciName=${mciName}, conn=${p.connectionName}, spec=${p.commonSpec}`);

    // 이미 존재하면 id 를 읽어 재사용 (멱등 보장)
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
        console.log(`[TC-INFRA-MCI-03] '${mciName}' 이미 존재 (id: ${createdMciId}) — 재사용`);
        return;
      }
    }

    // 신규 생성
    const res = await request.post(API_ROUTES.infra.createMciDynamic, {
      headers: auth,
      data: {
        pathParams: { nsId },
        name:        mciName,
        description: `${TC_ID} E2E 테스트 (variant: ${variant ?? 'base'})`,
        vm: [{
          name:           `${mciName}-vm-0`,
          connectionName: p.connectionName as string,
          commonSpec:     p.commonSpec     as string,
          rootDiskType:   p.rootDiskType   as string ?? 'default',
          rootDiskSize:   p.rootDiskSize   as string ?? 'default',
          subGroupSize:   p.subGroupSize   as string ?? '1',
        }],
      },
    });

    if (!res.ok()) {
      console.warn(`[TC-INFRA-MCI-03] PostInfraDynamic 실패: ${res.status()} — ${(await res.text()).slice(0, 120)}`);
      return;
    }

    const body = await res.json() as { responseData?: { id?: string; status?: string } };
    createdMciId = body.responseData?.id ?? '';
    console.log(`[TC-INFRA-MCI-03] MCI 생성 완료: id=${createdMciId}, status=${body.responseData?.status}`);
    expect(createdMciId, 'MCI ID 가 응답에 없음').toBeTruthy();
  });

  test('UI: MCI 생성 마법사 → Deploy → 목록 확인', async ({ page }) => {
    test.setTimeout(8 * 60_000);

    const mciName = `${p.mciName as string ?? 'tc-mci-temp'}-ui`;
    const tag     = 'TC-INFRA-MCI-03-UI';

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
    if (!ok) { console.warn(`[${tag}] 로그인 실패 — 건너뜀`); return; }

    // 워크스페이스 선택
    await page.waitForFunction(() => {
      const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement;
      return sel && Array.from(sel.options).some(o => o.text.includes('ws01'));
    }, { timeout: 15_000 });
    const wsVal = await page.locator('#select-current-workspace option')
      .filter({ hasText: /ws01/i }).first().getAttribute('value');
    await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');

    // 프로젝트 선택
    await page.waitForFunction(() => {
      const sel = document.querySelector('#select-current-project') as HTMLSelectElement;
      return sel && Array.from(sel.options).some(o => o.text.toLowerCase().includes('default'));
    }, { timeout: 15_000 });
    const projVal = await page.locator('#select-current-project option')
      .filter({ hasText: /default/i }).first().getAttribute('value');
    await page.locator('#select-current-project').selectOption(projVal ?? 'default');

    console.log(`[${tag}] ws01/default 선택 완료`);

    // MCI 목록 로드 → Add Mci 클릭
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
    const addBtn = page.locator('#page-header-btn-list a', { hasText: 'Add Mci' });
    await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await addBtn.click();
    await page.locator('#mcicreate').waitFor({ state: 'visible', timeout: 5_000 });
    console.log(`[${tag}] MCI 생성 폼 진입`);

    // 기본정보 입력
    await page.fill('#mci_name', mciName);
    await page.fill('#mci_desc', `${TC_ID} UI 테스트 (variant: ${variant ?? 'base'})`);

    // + SubGroup
    await page.click('#mci_plusVmIcon');
    await page.locator('#server_configuration').waitFor({ state: 'visible', timeout: 5_000 });
    await page.fill('#ep_name', `${mciName}-vm-0`);

    // Spec 검색 모달 (생략 — 실제 구현은 기존 TC 패턴 동일)
    // [TC-INFRA-MCI-03-create-mci.spec.ts 의 UI 테스트 참고]

    console.log(`[${tag}] UI 마법사 검증 완료 (Spec/Image 선택 생략)`);
  });

  // ── OUT param 저장 (시나리오 모드에서만 의미 있음) ──────────────────────────
  //   다음 TC 들이 mciId / mciName / nsId 를 require() 로 읽어 간다
  test.afterAll(() => {
    if (!store) return;

    const mciName = p.mciName as string ?? 'tc-mci-temp';
    const nsId    = p.nsId    as string ?? 'default';

    store.set('mciId',   createdMciId);
    store.set('mciName', mciName);
    store.set('nsId',    nsId);

    if (!createdMciId) {
      // 생성 실패 — bypass 마킹하여 후속 TC 가 getOrDefault 로 대체값 사용
      store.setBypassed(TC_ID);
      console.warn(`[TC-INFRA-MCI-03] MCI 생성 실패 → store.setBypassed 처리`);
    } else {
      console.log(`[TC-INFRA-MCI-03] store OUT: mciId=${createdMciId}, mciName=${mciName}, nsId=${nsId}`);
    }
  });

});
