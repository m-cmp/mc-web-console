/**
 * deploy/tc/data/TC-DATA-NORDB-BAK-01.spec.ts
 * TC-DATA-NORDB-BAK-01: NoRDBMS 백업/복원 조회 (mc-data-manager)
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { assertDataManagerIframe } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-NORDB-BAK-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-NORDB-BAK-01: NoRDBMS 백업/복원 조회', () => {

  test('API: 백업 태스크 목록 조회 (/backup)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.backupList);
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }> | { Error?: string };
    if (Array.isArray(body)) {
      const nordbBak = body.filter(t => t.meta?.serviceType === 'nrdbms' || t.meta?.serviceType === 'nordbms');
      console.log(`[${TC_ID}] backup 전체: ${body.length}건, nrdbms: ${nordbBak.length}건`);
    }
    expect(res.status()).toBeLessThan(500);
  });

  test('API: Restore 목록 조회 (/restore)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.restoreList);
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }> | { Error?: string };
    if (Array.isArray(body)) {
      const nordbRes = body.filter(t => t.meta?.serviceType === 'nrdbms' || t.meta?.serviceType === 'nordbms');
      console.log(`[${TC_ID}] restore 전체: ${body.length}건, nrdbms: ${nordbRes.length}건`);
    }
    expect(res.status()).toBeLessThan(500);
  });

  test('UI: NoRDBMS 화면 진입 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.nordbms, TC_ID);
    if (!ok) return;

    await assertDataManagerIframe(page, TC_ID);
    expect(page.url()).toMatch(/\/webconsole\//);
  });
});
