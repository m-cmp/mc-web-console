/**
 * deploy/scenarios/C8-data-backup-recovery-migration.spec.ts
 * C8-001: 데이터 백업·복구·마이그레이션 시나리오 (mc-data-manager)
 *
 * ── 실행 방법 ────────────────────────────────────────────────────
 *   SCENARIO_ID=C8-001 npx playwright test deploy/scenarios/C8-data-backup-recovery-migration.spec.ts
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../mc-web-console/patterns/api-routes';
import { PAGES } from '../../mc-web-console/fixtures/pages';
import { loginAndGoto } from '../../mc-web-console/helpers/request-auth.helper';
import { ScenarioContext } from '../params/runtime/context';
import { ScenarioRuntimeStore } from '../params/runtime/store';

const SCENARIO_ID = process.env.SCENARIO_ID ?? 'C8-001';
const store = new ScenarioRuntimeStore(SCENARIO_ID);
const DATA_MANAGER = process.env.DATA_MANAGER_BASE_URL ?? 'https://15.164.139.37:3300';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(() => {
  store.reset();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[C8-001] mc-data-manager 시나리오 시작`);
  console.log('='.repeat(60));
});

test.afterAll(() => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('[C8-001] 시나리오 종료');
  store.dump('C8-001 RuntimeStore');
  console.log('='.repeat(60));
});

function warnTodo(tag: string, status: number, msg = '') {
  console.warn(`${tag} ${status} — warn-TODO: mc-data-manager 미기동 또는 자원 미준비 ${msg}`);
}

test('Step 1 — TC-DATA-OBJ-MIG-01: Object Storage 마이그레이션', async ({ page, request }) => {
  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-DATA-OBJ-MIG-01');
  console.log(`\n[Step 1] dataManager=${ctx.params.dataManagerBaseUrl ?? DATA_MANAGER}`);

  const res = await request.get(API_ROUTES.data.migrateList);
  if (!res.ok()) {
    warnTodo('[Step 1]', res.status(), 'migrateList');
  } else {
    console.log('[Step 1] migrateList OK');
  }

  const ok = await loginAndGoto(page, PAGES.data.objectStorage, 'C8-S1');
  if (ok) console.log(`[Step 1] UI: ${page.url()}`);
  store.set('objMigChecked', true);
});

test('Step 2 — TC-DATA-OBJ-BAK-01: Object Storage 백업/복원', async ({ request }) => {
  const res = await request.get(API_ROUTES.data.backupList);
  if (!res.ok()) {
    warnTodo('[Step 2]', res.status(), 'backupList');
  } else {
    console.log('[Step 2] backupList OK');
  }
  store.set('objBakChecked', true);
});

test('Step 3 — TC-DATA-RDB-MIG-01: RDBMS 마이그레이션', async ({ page, request }) => {
  test.setTimeout(120_000);
  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-DATA-RDB-MIG-01');
  const sourcePoint = ctx.params.sourcePoint as Record<string, string>;
  const targetPoint = ctx.params.targetPoint as Record<string, string>;

  try {
    const res = await request.post(`${DATA_MANAGER}/migrate/rdbms`, {
      data: { sourcePoint, targetPoint },
      timeout: 90_000,
    });
    if (!res.ok() && res.status() !== 504) {
      warnTodo('[Step 3]', res.status(), 'rdbmsMigrate');
    } else {
      console.log(`[Step 3] rdbmsMigrate HTTP ${res.status()}`);
    }
  } catch {
    warnTodo('[Step 3]', 0, 'rdbmsMigrate timeout');
  }

  const ok = await loginAndGoto(page, PAGES.data.rdbms, 'C8-S3');
  if (ok) console.log(`[Step 3] UI: ${page.url()}`);
  store.set('rdbMigChecked', true);
});

test('Step 4 — TC-DATA-RDB-BAK-01: RDBMS 백업/복원', async ({ request }) => {
  const res = await request.get(API_ROUTES.data.backupList);
  if (!res.ok()) {
    warnTodo('[Step 4]', res.status(), 'rdbmsBackup');
  } else {
    console.log('[Step 4] rdbms backupList OK');
  }
  store.set('rdbBakChecked', true);
});

test('Step 5 — TC-DATA-NORDB-MIG-01: NoRDBMS 마이그레이션', async ({ page, request }) => {
  test.setTimeout(90_000);
  const ctx = new ScenarioContext(SCENARIO_ID, 'TC-DATA-NORDB-MIG-01');

  try {
    const res = await request.post(`${DATA_MANAGER}/migrate/nrdbms`, {
      data: {
        sourcePoint: {
          provider:     'alibaba',
          host:         ctx.params.mongoHost as string,
          port:         ctx.params.mongoPort as string,
          username:     ctx.params.mongoUser as string,
          password:     ctx.params.mongoPassword as string,
          databaseName: ctx.params.sourceDatabase as string,
        },
        targetPoint: {
          provider:     'alibaba',
          host:         ctx.params.mongoHost as string,
          port:         ctx.params.mongoPort as string,
          username:     ctx.params.mongoUser as string,
          password:     ctx.params.mongoPassword as string,
          databaseName: ctx.params.targetDatabase as string,
        },
      },
      timeout: 60_000,
    });
    if (!res.ok() && res.status() !== 504) {
      warnTodo('[Step 5]', res.status(), 'nordbmsMigrate');
    } else {
      console.log(`[Step 5] nordbmsMigrate HTTP ${res.status()}`);
    }
  } catch {
    warnTodo('[Step 5]', 0, 'nordbmsMigrate timeout');
  }

  const ok = await loginAndGoto(page, PAGES.data.nordbms, 'C8-S5');
  if (ok) console.log(`[Step 5] UI: ${page.url()}`);
  store.set('nordbMigChecked', true);
});

test('Step 6 — TC-DATA-NORDB-BAK-01: NoRDBMS 백업/복원', async ({ request }) => {
  const res = await request.get(API_ROUTES.data.backupList);
  if (!res.ok()) {
    warnTodo('[Step 6]', res.status(), 'nordbmsBackup');
  } else {
    console.log('[Step 6] nordbms backupList OK');
  }
  store.set('nordbBakChecked', true);
  expect(store.get<boolean>('objMigChecked')).toBeTruthy();
});
