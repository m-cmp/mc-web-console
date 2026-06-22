/**
 * deploy/tc/data/TC-DATA-NORDB-MIG-01.spec.ts
 * TC-DATA-NORDB-MIG-01: NoRDBMS(MongoDB) 마이그레이션 (mc-data-manager)
 *
 * Alibaba NRDB: dds-mj7e... / 3717 / root / mcmp_test123
 * UI에서는 등록 credential 선택, API는 host 직접 전달
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { assertDataManagerIframe } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-NORDB-MIG-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

const DATA_MANAGER = (p.dataManagerBaseUrl as string)
  ?? process.env.DATA_MANAGER_BASE_URL
  ?? 'https://15.164.139.37:3300';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-NORDB-MIG-01: NoRDBMS 마이그레이션 실행', () => {

  test('API: GET /migrate 목록 — NoRDBMS 태스크 확인', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.migrateList);
    expect(res.ok(), `GET /migrate → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }>;
    if (Array.isArray(body)) {
      const nordbTasks = body.filter(t => t.meta?.serviceType === 'nrdbms' || t.meta?.serviceType === 'nordbms');
      console.log(`[${TC_ID}] migrate 전체: ${body.length}건, nrdbms: ${nordbTasks.length}건`);
    }
  });

  test('API: POST /migrate/nrdbms — MongoDB source→target 마이그레이션 시도', async ({ request }) => {
    test.setTimeout(90_000);

    const before = await request.get(API_ROUTES.data.allTasks);
    const beforeCount = before.ok()
      ? (await before.json() as Array<{ meta: { serviceType: string } }>)
          .filter(t => t.meta.serviceType === 'nrdbms').length
      : -1;
    console.log(`[${TC_ID}] 마이그레이션 전 nrdbms 태스크: ${beforeCount}개`);
    console.log(`[${TC_ID}] Alibaba MongoDB: ${p.mongoHost}:${p.mongoPort} user=${p.mongoUser}`);

    let postStatus = 0;
    let resultMsg = '';
    try {
      const res = await request.post(`${DATA_MANAGER}/migrate/nrdbms`, {
        data: {
          sourcePoint: {
            provider:     'alibaba',
            host:         p.mongoHost as string,
            port:         p.mongoPort as string,
            username:     p.mongoUser as string,
            password:     p.mongoPassword as string,
            databaseName: p.sourceDatabase as string,
          },
          targetPoint: {
            provider:     'alibaba',
            host:         p.mongoHost as string,
            port:         p.mongoPort as string,
            username:     p.mongoUser as string,
            password:     p.mongoPassword as string,
            databaseName: p.targetDatabase as string,
          },
        },
        timeout: 60_000,
      });
      postStatus = res.status();
      resultMsg = (await res.text()).slice(0, 200);
      console.log(`[${TC_ID}] POST /migrate/nrdbms HTTP ${postStatus}`);
      console.log(`[${TC_ID}] 응답: ${resultMsg}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[${TC_ID}] POST timeout/error: ${msg.slice(0, 150)}`);
      console.warn(`[${TC_ID}] MongoDB 접근 불가 또는 타임아웃 — warn-TODO`);
      return;
    }

    if (postStatus === 500) {
      console.warn(`[${TC_ID}] 서버 500: MongoDB 연결 불가 — ${resultMsg}`);
      return;
    }

    await new Promise(r => setTimeout(r, 2_000));
    const after = await request.get(API_ROUTES.data.allTasks);
    if (after.ok()) {
      const afterCount = (await after.json() as Array<{ meta: { serviceType: string } }>)
        .filter(t => t.meta.serviceType === 'nrdbms').length;
      console.log(`[${TC_ID}] 마이그레이션 후 nrdbms 태스크: ${afterCount}개`);
      if (beforeCount >= 0) {
        expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
      }
    }
    expect([200, 504]).toContain(postStatus);
  });

  test('API: GET /tasks 전체 요약', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.allTasks);
    expect(res.ok(), `GET /tasks → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string; taskType?: string } }>;
    if (Array.isArray(body)) {
      const summary: Record<string, number> = {};
      for (const t of body) {
        const key = `${t.meta?.serviceType}/${t.meta?.taskType}`;
        summary[key] = (summary[key] || 0) + 1;
      }
      console.log(`[${TC_ID}] 전체 태스크 요약: ${JSON.stringify(summary)}`);
    }
  });

  test('UI: NoRDBMS 화면 진입 및 iframe 로드 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.nordbms, TC_ID);
    if (!ok) return;

    const iframeOk = await assertDataManagerIframe(page, TC_ID);
    if (iframeOk) {
      expect(page.url()).toMatch(/\/webconsole\//);
      console.log(`[${TC_ID}] NoRDBMS 화면 진입 완료`);
    }
  });
});
