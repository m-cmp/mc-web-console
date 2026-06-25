/**
 * deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 * TC-INFRA-MCI-05: MCI 삭제 (정리 단계)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 *   # 단독 실행 시 삭제 대상: params 의 mciName 과 일치하는 MCI 를 목록에서 찾아 삭제
 *
 * ── 시나리오 실행 (런타임 store IN param 사용) ─────────────────────
 *   SCENARIO_ID=C4-001 npx playwright test deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 *   # TC-INFRA-MCI-03 이 저장한 mciId 를 store 에서 읽어 삭제
 *
 * ── 런타임 IN params ──────────────────────────────────────────────
 *   store.require('mciId')   — TC-INFRA-MCI-03 OUT
 *   store.require('nsId')    — TC-INFRA-MCI-03 OUT
 *
 * ── bypass 안전 처리 ──────────────────────────────────────────────
 *   TC-INFRA-MCI-03 가 bypass 되었다면 mciId 가 없으므로
 *   store.wasBypassed() + getOrDefault() 로 fallback 처리한다
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { apiLogin }   from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

// ── 컨텍스트 결정 ─────────────────────────────────────────────────────────────
const TC_ID      = 'TC-INFRA-MCI-05';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

// ── TC-INFRA-MCI-05 ───────────────────────────────────────────────────────────

test.describe('TC-INFRA-MCI-05: MCI 삭제', () => {

  test('API: 대상 MCI 삭제', async ({ request }) => {
    test.setTimeout(3 * 60_000);

    const auth = await apiLogin(request);

    // ── IN param 읽기 ──────────────────────────────────────────────────────────
    //   시나리오 모드: TC-INFRA-MCI-03 이 저장한 값 사용
    //   단독 실행:    params.mciName 으로 목록에서 검색
    let targetMciId   = '';
    let targetMciName = '';
    let nsId          = p.nsId as string ?? 'default';

    if (store) {
      if (store.wasBypassed('TC-INFRA-MCI-03')) {
        // 앞 단계 bypass → 삭제할 MCI 없음, 안전하게 종료
        const fallbackName = store.getOrDefault<string>('mciName', p.mciName as string ?? '');
        console.log(`[TC-INFRA-MCI-05] TC-INFRA-MCI-03 가 bypass 됨 — 삭제 대상 없음 (mciName fallback: '${fallbackName}')`);
        store.setBypassed(TC_ID);
        return;
      }
      targetMciId   = store.require<string>('mciId');
      targetMciName = store.getOrDefault<string>('mciName', '');
      nsId          = store.getOrDefault<string>('nsId', nsId);
      console.log(`[TC-INFRA-MCI-05] store IN: mciId=${targetMciId}, mciName=${targetMciName}, nsId=${nsId}`);
    } else {
      // 단독 실행: mciName 으로 목록에서 id 검색
      const searchName = p.mciName as string ?? 'tc-mci-temp';
      console.log(`[TC-INFRA-MCI-05] 단독 실행 — '${searchName}' 검색 (nsId: ${nsId})`);

      const listRes = await request.post(API_ROUTES.infra.listMci, {
        headers: auth,
        data: { pathParams: { nsId } },
      });
      if (!listRes.ok()) {
        console.warn(`[TC-INFRA-MCI-05] MCI 목록 조회 실패: ${listRes.status()} — 건너뜀`);
        return;
      }
      const listBody = await listRes.json() as {
        responseData?: { infra?: Array<{ id?: string; name?: string }> };
      };
      const found = (listBody.responseData?.infra ?? []).find(m => m.name === searchName);
      if (!found?.id) {
        console.warn(`[TC-INFRA-MCI-05] '${searchName}' 없음 — 건너뜀`);
        return;
      }
      targetMciId   = found.id;
      targetMciName = searchName;
    }

    // ── 삭제 실행 ──────────────────────────────────────────────────────────────
    console.log(`[TC-INFRA-MCI-05] MCI 삭제 시작: id=${targetMciId}, name=${targetMciName}`);

    const res = await request.post(API_ROUTES.infra.deleteMci, {
      headers: auth,
      data: { pathParams: { nsId, mciId: targetMciId } },
    });

    if (!res.ok()) {
      // 삭제 실패는 경고로 처리 (자원이 이미 없거나 진행 중인 경우 가능)
      console.warn(`[TC-INFRA-MCI-05] DelMci 실패: ${res.status()} — ${(await res.text()).slice(0, 120)}`);
      return;
    }

    console.log(`[TC-INFRA-MCI-05] MCI '${targetMciName}' 삭제 완료`);

    // 삭제 확인: 목록에서 제거되었는지 검증
    const verifyRes = await request.post(API_ROUTES.infra.listMci, {
      headers: auth,
      data: { pathParams: { nsId } },
    });
    if (verifyRes.ok()) {
      const verifyBody = await verifyRes.json() as {
        responseData?: { infra?: Array<{ id?: string }> };
      };
      const stillExists = (verifyBody.responseData?.infra ?? []).some(m => m.id === targetMciId);
      expect(stillExists, `MCI '${targetMciName}' 가 삭제 후에도 목록에 남아있음`).toBeFalsy();
      console.log(`[TC-INFRA-MCI-05] 삭제 검증 완료 ✅`);
    }
  });

});
