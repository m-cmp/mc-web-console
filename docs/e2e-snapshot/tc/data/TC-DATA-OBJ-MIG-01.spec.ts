/**
 * deploy/tc/data/TC-DATA-OBJ-MIG-01.spec.ts
 * TC-DATA-OBJ-MIG-01: Object Storage 마이그레이션 조회 (mc-data-manager)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/data/TC-DATA-OBJ-MIG-01.spec.ts
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { assertDataManagerIframe } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-OBJ-MIG-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-OBJ-MIG-01: Object Storage 마이그레이션 조회', () => {

  test('API: 전체 태스크 목록 조회 (/tasks)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.allTasks);
    expect(res.ok(), `GET /tasks → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }>;
    expect(Array.isArray(body)).toBe(true);
    const objMig = body.filter(t => t.meta?.serviceType === 'objectstorage');
    console.log(`[${TC_ID}] 전체 태스크: ${body.length}건, objectstorage: ${objMig.length}건`);
  });

  test('API: Object Storage 마이그레이션 목록 조회 (/migrate)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.migrateList);
    expect(res.ok(), `GET /migrate → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ meta?: { serviceType?: string; taskType?: string } }>;
    if (Array.isArray(body)) {
      const objTasks = body.filter(t => t.meta?.serviceType === 'objectstorage' || t.meta?.taskType === 'migrate');
      console.log(`[${TC_ID}] migrate 목록: ${body.length}건, objectstorage/migrate: ${objTasks.length}건`);
    }
  });

  test('API: Credentials 목록 조회 (/credentials)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.credentialList);
    expect(res.ok(), `GET /credentials → ${res.status()}`).toBeTruthy();
    const body = await res.json() as Array<{ configName?: string; providerName?: string }>;
    expect(Array.isArray(body)).toBe(true);
    console.log(`[${TC_ID}] credentials: ${body.length}건`);
  });

  test('API: Health check (/readyZ)', async ({ request }) => {
    const res = await request.get(API_ROUTES.data.healthcheck);
    const body = await res.json() as { Result?: string; Error?: string };
    console.log(`[${TC_ID}] healthcheck status=${res.status()}: ${JSON.stringify(body).slice(0, 100)}`);
  });

  test('UI: Object Storage 화면 진입 및 iframe 로드 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, TC_ID);
    if (!ok) return;

    const iframeOk = await assertDataManagerIframe(page, TC_ID);
    if (iframeOk) {
      expect(page.url()).toMatch(/\/webconsole\//);
      console.log(`[${TC_ID}] Object Storage 화면 진입 완료 (baseUrl=${p.dataManagerBaseUrl})`);
    }
  });
});
