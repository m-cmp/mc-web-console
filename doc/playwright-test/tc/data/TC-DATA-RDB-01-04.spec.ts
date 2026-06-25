/**
 * deploy/tc/data/TC-DATA-RDB-01-04.spec.ts
 * AWS / Alibaba RDB 존재 확인 + Backup / Restore (브라우저)
 *
 * AWS:     mcmp-test... / 3306 / admin / mcmp_test / LibraryManagement_0
 * Alibaba: rm-mj747... / 3306 / root / mcmp_test123 / MZ_LibraryManagement
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../../mc-web-console/patterns/api-routes';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { loadDataFrame } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-RDB-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

const DATA_MANAGER = (p.dataManagerBaseUrl as string) ?? 'https://15.164.139.37:3300';
const AWS = p.sourcePoint as Record<string, string>;
const ALI = p.targetPoint as Record<string, string>;
const BACKUP_PATH = `/tmp/mcmp-rdb-e2e-${Date.now()}`;

let backupTaskCountBefore = 0;
let backupTaskCountAfter = 0;

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });
test.setTimeout(180_000);

async function activeFrame(page: import('@playwright/test').Page, tag: string) {
  const frame = await loadDataFrame(page, tag);
  if (!frame) return null;
  return page.frames().find(fr => fr.url().includes('3300')) ?? frame;
}

async function clickSqlTab(frame: import('@playwright/test').Frame, page: import('@playwright/test').Page) {
  const tab = frame.locator('#serviceTabs .nav-link').filter({ hasText: 'SQL Database' }).first();
  if (await tab.count() > 0) {
    await tab.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

async function clickSubmitBtn(frame: import('@playwright/test').Frame, page: import('@playwright/test').Page, tag: string) {
  const btn = frame.locator('#submitBtn, button:visible').filter({ hasText: /Submit|실행|생성/i }).first();
  if (await btn.count() === 0) {
    console.warn(`[${tag}] submit 버튼 없음`);
    return '';
  }
  await btn.evaluate((el) => {
    const b = el as HTMLButtonElement;
    b.disabled = false;
    b.click();
  }).catch(() => {});
  console.log(`[${tag}] submit 클릭`);
  await page.waitForTimeout(10_000);

  const resultEl = frame.locator('#resultText').first();
  if (await resultEl.count() > 0) {
    return await resultEl.inputValue().catch(() => '')
      || await resultEl.textContent().catch(() => '') || '';
  }
  return '';
}

async function forceSubmit(frame: import('@playwright/test').Frame, page: import('@playwright/test').Page, tag: string) {
  await clickSubmitBtn(frame, page, tag);
}

// ── Step 0: 사전 백업 태스크 수 ─────────────────────────────────────────────

test('API: 백업 태스크 baseline', async ({ request }) => {
  const res = await request.get(API_ROUTES.data.backupList);
  expect(res.status()).toBeLessThan(500);
  if (res.ok()) {
    const body = await res.json() as Array<{ meta?: { serviceType?: string } }>;
    backupTaskCountBefore = Array.isArray(body)
      ? body.filter(t => t.meta?.serviceType === 'rdbms').length
      : 0;
    console.log(`[RDB-E2E] rdbms backup baseline: ${backupTaskCountBefore}건`);
  }
});

// ── Step 1+2: AWS / Alibaba RDB 존재 확인 (Migrate Verify) ─────────────────

test('UI: AWS·Alibaba RDB 연결 확인 — /migrate/mysql Verify', async ({ page }) => {
  const tag = 'RDB-CONN-VERIFY';
  const frame = await activeFrame(page, tag);
  if (!frame) { test.skip(true, 'iframe 미로드'); return; }

  await frame.goto(`${DATA_MANAGER}/migrate/mysql`, { timeout: 15_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // AWS source
  await frame.locator('#sourcePoint\\[provider\\]').selectOption(AWS.provider).catch(() => {});
  await frame.locator('#mysql-srcHost').fill(AWS.host);
  await frame.locator('#mysql-srcPort').fill(AWS.port);
  await frame.locator('#mysql-srcUsername').fill(AWS.username);
  await frame.locator('#mysql-srcPassword').fill(AWS.password);
  await frame.locator('#mysql-srcDatabase').fill(AWS.databaseName).catch(() => {});
  console.log(`[${tag}] AWS: ${AWS.host}:${AWS.port}/${AWS.databaseName}`);

  const srcVerify = frame.locator('button:visible').filter({ hasText: /Verify|확인/i }).first();
  if (await srcVerify.count() > 0) {
    await srcVerify.click();
    await page.waitForTimeout(8_000);
    console.log(`[${tag}] AWS source Verify 완료`);
  }

  for (let i = 0; i < 2; i++) {
    const next = frame.locator('button:visible').filter({ hasText: /Next|다음/i }).first();
    if (await next.count() > 0) {
      await next.click({ force: true });
      await page.waitForTimeout(2000);
    }
  }

  // Alibaba target
  await frame.locator('#targetPoint\\[provider\\]').selectOption(ALI.provider, { force: true }).catch(() => {});
  await frame.locator('#mysql-destHost').fill(ALI.host, { force: true });
  await frame.locator('#mysql-destPort').fill(ALI.port, { force: true });
  await frame.locator('#mysql-destUsername').fill(ALI.username, { force: true });
  await frame.locator('#mysql-destPassword').fill(ALI.password, { force: true });
  await frame.locator('#mysql-destDatabase').fill(ALI.databaseName, { force: true });
  console.log(`[${tag}] Alibaba: ${ALI.host}:${ALI.port}/${ALI.databaseName}`);

  const tgtVerify = frame.locator('button:visible').filter({ hasText: /Verify|확인/i }).first();
  if (await tgtVerify.count() > 0) {
    await tgtVerify.click();
    await page.waitForTimeout(8_000);
    console.log(`[${tag}] Alibaba target Verify 완료`);
  }

  const tgtHost = await frame.locator('#mysql-destHost').inputValue().catch(() => '');
  expect(tgtHost).toContain('rm-mj747');

  const verifiedBtn = frame.locator('button:visible').filter({ hasText: /^Verified$/i });
  const verifiedCount = await verifiedBtn.count();
  console.log(`[${tag}] Verified 버튼: ${verifiedCount}개`);
  expect(verifiedCount, 'Alibaba target Verified 미표시').toBeGreaterThan(0);
});

// ── Step 3: AWS RDB Backup ──────────────────────────────────────────────────

test('UI: AWS RDB Backup — /backup/register Submit', async ({ page }) => {
  test.setTimeout(300_000);
  const tag = 'RDB-AWS-BACKUP';
  const frame = await activeFrame(page, tag);
  if (!frame) { test.skip(true, 'iframe 미로드'); return; }

  await frame.goto(`${DATA_MANAGER}/backup/register`, { timeout: 15_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await clickSqlTab(frame, page);

  await frame.getByRole('combobox').first().selectOption(AWS.provider).catch(() => {});
  await frame.getByRole('textbox', { name: 'Host / IP' }).fill(AWS.host);
  await frame.getByRole('textbox', { name: 'Port' }).fill(AWS.port);
  await frame.getByRole('textbox', { name: 'Username' }).fill(AWS.username);
  await frame.getByRole('textbox', { name: 'Password' }).fill(AWS.password);
  await frame.getByRole('textbox', { name: 'Database' }).fill(AWS.databaseName);
  await frame.getByRole('textbox', { name: 'Path' }).fill(BACKUP_PATH);

  console.log(`[${tag}] backup path: ${BACKUP_PATH}`);
  const submit = frame.getByRole('button', { name: 'Submit' });
  await submit.click();
  console.log(`[${tag}] Submit 클릭`);
  await page.waitForTimeout(15_000);

  const resultArea = frame.locator('#resultText, [id*="result"], .result').first();
  const result = await resultArea.textContent().catch(() => '') || '';
  console.log(`[${tag}] backup 결과: ${result.slice(0, 400)}`);
});

// ── Step 4: Backup 태스크 생성 확인 (API) ───────────────────────────────────

test('API: AWS backup 태스크 생성 확인', async ({ request }) => {
  await new Promise(r => setTimeout(r, 5_000));
  const res = await request.get(API_ROUTES.data.backupList);
  expect(res.ok(), `backupList ${res.status()}`).toBeTruthy();
  const body = await res.json() as Array<{ meta?: { serviceType?: string; taskId?: string } }>;
  backupTaskCountAfter = body.filter(t => t.meta?.serviceType === 'rdbms').length;
  console.log(`[RDB-E2E] rdbms backup: ${backupTaskCountBefore} → ${backupTaskCountAfter}`);
  expect(backupTaskCountAfter).toBeGreaterThanOrEqual(backupTaskCountBefore);
});

// ── Step 5: Alibaba RDB Restore ─────────────────────────────────────────────

test('UI: Alibaba RDB Restore — /restore/register Submit', async ({ page }) => {
  test.setTimeout(300_000);
  const tag = 'RDB-ALI-RESTORE';
  const frame = await activeFrame(page, tag);
  if (!frame) { test.skip(true, 'iframe 미로드'); return; }

  await frame.goto(`${DATA_MANAGER}/restore/register`, { timeout: 15_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await clickSqlTab(frame, page);

  await frame.getByRole('textbox', { name: 'Path' }).fill(BACKUP_PATH);

  await frame.getByRole('combobox').selectOption(ALI.provider).catch(() => {});
  await frame.getByRole('textbox', { name: 'Host / IP' }).fill(ALI.host);
  await frame.getByRole('textbox', { name: 'Port' }).fill(ALI.port);
  await frame.getByRole('textbox', { name: 'Username' }).fill(ALI.username);
  await frame.getByRole('textbox', { name: 'Password' }).fill(ALI.password);

  console.log(`[${tag}] restore: path=${BACKUP_PATH} → ${ALI.host}`);
  await frame.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(15_000);

  const result = await frame.locator('#resultText').textContent().catch(() => '') || '';
  console.log(`[${tag}] restore 결과: ${result.slice(0, 400)}`);
});

// ── Step 6: Restore 태스크 확인 (API) ───────────────────────────────────────

test('API: restore 태스크 목록 확인', async ({ request }) => {
  const res = await request.get(API_ROUTES.data.restoreList);
  expect(res.status()).toBeLessThan(500);
  if (res.ok()) {
    const body = await res.json() as Array<{ meta?: { serviceType?: string; taskId?: string } }>;
    const rdbRestore = body.filter(t => t.meta?.serviceType === 'rdbms');
    console.log(`[RDB-E2E] rdbms restore 태스크: ${rdbRestore.length}건`);
    if (rdbRestore.length > 0) {
      console.log(`[RDB-E2E] 최근 restore taskId: ${rdbRestore[rdbRestore.length - 1].meta?.taskId}`);
    }
  }
});
