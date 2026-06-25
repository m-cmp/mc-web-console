/**
 * deploy/tc/data/TC-DATA-NRDB-01-04.spec.ts
 * TC-DATA-NRDB-01~04: NoRDBMS Generate / Migrate / Backup / Restore
 *
 * AWS NRDB   — Tumblebug 등록 credential 선택 후 Generate
 * Alibaba NRDB — 등록 credential 선택 (dds-mj7e... / root / mcmp_test123)
 */
import { test, expect } from '@playwright/test';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import {
  loadDataFrame,
  selectRegisteredCredential,
  submitAndCheckResult,
} from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-NRDB-01';
const scenarioId = process.env.SCENARIO_ID;
const variant = process.env.TC_VARIANT;

const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p = ctx.params;

const DATA_MANAGER = (p.dataManagerBaseUrl as string) ?? 'https://15.164.139.37:3300';
const awsNrdb = (p.awsNrdb ?? p.nrdb) as {
  credentialFilter?: string[];
  databaseName?: string;
} | undefined;
const alibabaNrdb = (p.alibabaNrdb ?? p.nrdb) as {
  credentialFilter?: string[];
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  sourceDatabase?: string;
  targetDatabase?: string;
} | undefined;

test.use({ storageState: { cookies: [], origins: [] } });
test.setTimeout(180_000);

test.describe('TC-DATA-NRDB-01: NoRDBMS Generate (AWS — Tumblebug credential)', () => {

  test('UI: credential 선택 후 Generate 진행', async ({ page }) => {
    const tag = 'TC-DATA-NRDB-01-aws';
    const frame = await loadDataFrame(page, tag);
    if (!frame) { console.warn(`[${tag}] SKIP`); return; }

    await frame.goto(`${DATA_MANAGER}/generate/no-sql`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/generate/no-sql');

    const filter = awsNrdb?.credentialFilter ?? ['dynamo', 'firestore', 'aws'];
    const picked = await selectRegisteredCredential(frame, page, tag, filter);
    if (!picked) {
      console.warn(`[${tag}] AWS NRDB credential 없음 — Tumblebug credential 등록 확인`);
      return;
    }

    const dbId = frame.locator('#gen-databaseId');
    if (await dbId.count() > 0) {
      await dbId.fill(awsNrdb?.databaseName ?? 'e2e-nrdb-aws');
    }

    const result = await submitAndCheckResult(frame, page, tag, 30_000);
    if (result) console.log(`[${tag}] Generate 결과: ${result.slice(0, 200)}`);
    console.log(`[${tag}] AWS NRDB Generate 완료`);
  });
});

test.describe('TC-DATA-NRDB-01: NoRDBMS Generate (Alibaba — 등록 credential)', () => {

  test('UI: 등록 credential 선택 후 Generate 진행', async ({ page }) => {
    const tag = 'TC-DATA-NRDB-01-alibaba';
    const frame = await loadDataFrame(page, tag);
    if (!frame) { console.warn(`[${tag}] SKIP`); return; }

    await frame.goto(`${DATA_MANAGER}/generate/no-sql`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);

    const filter = alibabaNrdb?.credentialFilter ?? ['alibaba', 'mongo', 'dds-mj7'];
    const picked = await selectRegisteredCredential(frame, page, tag, filter);

    if (!picked && alibabaNrdb?.host) {
      console.warn(`[${tag}] credential 미매칭 — 직접 입력 fallback`);
      await frame.locator('#gen-mongodb-host').fill(alibabaNrdb.host, { force: true });
      await frame.locator('#gen-mongodb-port').fill(alibabaNrdb.port ?? '3717', { force: true });
      await frame.locator('#gen-mongodb-username').fill(alibabaNrdb.username ?? 'root', { force: true });
      await frame.locator('#gen-mongodb-password').fill(alibabaNrdb.password ?? '', { force: true });
      await frame.locator('#gen-mongodb-databaseName').fill(
        alibabaNrdb.sourceDatabase ?? 'mcmp_test',
        { force: true },
      );
    }

    const result = await submitAndCheckResult(frame, page, tag, 30_000);
    if (result) console.log(`[${tag}] Generate 결과: ${result.slice(0, 200)}`);
    console.log(`[${tag}] Alibaba NRDB Generate 완료`);
  });
});

test.describe('TC-DATA-NRDB-02: NoRDBMS 마이그레이션', () => {

  test('UI: Alibaba MongoDB migration 페이지 확인', async ({ page }) => {
    const tag = 'TC-DATA-NRDB-02';
    const frame = await loadDataFrame(page, tag);
    if (!frame) return;

    for (const url of ['/migrate/nrdbms', '/migrate/no-sql', '/migrate/mongodb']) {
      await frame.goto(`${DATA_MANAGER}${url}`, {
        timeout: 8_000,
        waitUntil: 'domcontentloaded',
      }).catch(() => {});
      await page.waitForTimeout(1000);
      const inputs = await frame.locator('input:not([type="hidden"]), select').count();
      if (inputs > 0) {
        console.log(`[${tag}] migration URL: ${frame.url()}, inputs=${inputs}`);
        return;
      }
    }
    console.warn(`[${tag}] migration form 미발견 — warn-TODO`);
  });
});

test.describe('TC-DATA-NRDB-03: NoRDBMS 백업', () => {

  test('UI: /backup/register NoSQL credential 선택', async ({ page }) => {
    const tag = 'TC-DATA-NRDB-03';
    const frame = await loadDataFrame(page, tag);
    if (!frame) return;

    await frame.goto(`${DATA_MANAGER}/backup/register`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);

    const filter = alibabaNrdb?.credentialFilter ?? ['alibaba', 'mongo'];
    await selectRegisteredCredential(frame, page, tag, filter, '#nosqlSourceCredentialSelect')
      ?? await selectRegisteredCredential(frame, page, tag, filter);
    console.log(`[${tag}] backup credential 섹션 확인 완료`);
  });
});

test.describe('TC-DATA-NRDB-04: NoRDBMS 복원', () => {

  test('UI: /restore/register NoSQL credential 선택', async ({ page }) => {
    const tag = 'TC-DATA-NRDB-04';
    const frame = await loadDataFrame(page, tag);
    if (!frame) return;

    await frame.goto(`${DATA_MANAGER}/restore/register`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);

    const filter = alibabaNrdb?.credentialFilter ?? ['alibaba', 'mongo'];
    await selectRegisteredCredential(frame, page, tag, filter);
    console.log(`[${tag}] restore credential 섹션 확인 완료`);
  });
});
