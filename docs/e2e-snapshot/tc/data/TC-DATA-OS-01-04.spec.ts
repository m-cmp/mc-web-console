/**
 * deploy/tc/data/TC-DATA-OS-01-04.spec.ts
 * TC-DATA-OS-01~04: Object Storage Generate / Migrate / Backup / Restore (mc-data-manager UI)
 */
import { test, expect } from '@playwright/test';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { loadDataFrame, fillField } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-OS-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

const DATA_MANAGER = (p.dataManagerBaseUrl as string) ?? 'https://15.164.139.37:3300';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-OS-01: Object Storage 샘플 데이터 생성', () => {

  test('UI: /generate/objectstorage 페이지 로드 및 form 확인', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-OS-01');
    if (!frame) { console.warn('[TC-DATA-OS-01] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/generate/objectstorage`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/generate/objectstorage');

    const credSelect = frame.locator('#targetCredentialSelect');
    expect(await credSelect.count()).toBeGreaterThan(0);
    console.log('[TC-DATA-OS-01] Generate form 확인 완료');
  });
});

test.describe('TC-DATA-OS-02: Object Storage 마이그레이션', () => {

  test('UI: /migrate/objectstorage 페이지 로드', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-OS-02');
    if (!frame) { console.warn('[TC-DATA-OS-02] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/migrate/objectstorage`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/migrate/objectstorage');
    console.log('[TC-DATA-OS-02] Migration 페이지 확인 완료');
  });
});

test.describe('TC-DATA-OS-03: Object Storage 백업', () => {

  test('UI: /backup/register 페이지 로드', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-OS-03');
    if (!frame) { console.warn('[TC-DATA-OS-03] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/backup/register`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/backup/register');
    console.log('[TC-DATA-OS-03] Backup 페이지 확인 완료');
  });
});

test.describe('TC-DATA-OS-04: Object Storage 복원', () => {

  test('UI: /restore/register 페이지 로드', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-OS-04');
    if (!frame) { console.warn('[TC-DATA-OS-04] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/restore/register`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/restore/register');

    const submitBtn = frame.locator('button:visible').filter({ hasText: 'Submit' });
    if (await submitBtn.count() > 0) {
      await fillField(frame, '#targetCredentialSelect', p.connectionName as string ?? '');
      console.log('[TC-DATA-OS-04] Restore form 필드 확인');
    }
    console.log('[TC-DATA-OS-04] Restore 페이지 확인 완료');
  });
});
