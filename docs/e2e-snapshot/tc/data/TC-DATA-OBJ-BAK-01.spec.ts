/**
 * deploy/tc/data/TC-DATA-OBJ-BAK-01.spec.ts
 * TC-DATA-OBJ-BAK-01: Object Storage 백업/복원 조회 (mc-data-manager)
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { assertDataManagerIframe } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-OBJ-BAK-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-OBJ-BAK-01: Object Storage 백업/복원 조회', () => {

  test('API: 백업 태스크 목록 조회 (/backup)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.backupList);
    const body = await res.json() as Array<unknown> | { Error?: string };
    if (Array.isArray(body)) {
      console.log(`[${TC_ID}] backup 목록: ${body.length}건`);
    } else {
      console.warn(`[${TC_ID}] backup 목록 응답: ${JSON.stringify(body).slice(0, 100)}`);
    }
    expect(res.status()).toBeLessThan(500);
  });

  test('API: Restore 태스크 목록 조회 (/restore)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.restoreList);
    const body = await res.json() as Array<unknown> | { Error?: string };
    if (Array.isArray(body)) {
      console.log(`[${TC_ID}] restore 목록: ${body.length}건`);
    }
    expect(res.status()).toBeLessThan(500);
  });

  test('API: Generate 목록 — objectstorage 생성 태스크 확인', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.generateList);
    expect(res.ok(), `GET /generate → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }>;
    if (Array.isArray(body)) {
      const objGen = body.filter(t => t.meta?.serviceType === 'objectstorage');
      console.log(`[${TC_ID}] generate: ${body.length}건, objectstorage: ${objGen.length}건`);
    }
  });

  test('UI: Object Storage 화면 진입 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, TC_ID);
    if (!ok) return;

    await assertDataManagerIframe(page, TC_ID);
    expect(page.url()).toMatch(/\/webconsole\//);
  });
});
