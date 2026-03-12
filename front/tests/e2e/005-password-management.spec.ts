/**
 * FR-005 Password Management E2E Tests
 *
 * TC-001~006: ChangeMyPassword (본인 비밀번호 변경 - navbar)
 * TC-007~011: ResetUserPassword (관리자 비밀번호 재설정 - users page)
 */

import { test, expect, Page, request } from '@playwright/test';

const FRONT_URL = 'http://localhost:3115';
const IAM_URL   = 'http://52.79.163.111:5006';
const ADMIN_ID  = 'mcmp';
const ADMIN_PW  = 'mcmp_password';
const TEST_PW   = 'TestPassword123!';
const NEW_PW    = 'NewPassword456!';
const SUFFIX    = Date.now();

// ─── Helper: 로그인 ────────────────────────────────────────────────────────

async function login(page: Page, username: string, password: string) {
  await page.goto(`${FRONT_URL}/auth/login`);
  await page.waitForSelector('#loginbtn', { timeout: 10_000 });
  await page.fill('#id', username);
  await page.fill('#password', password);
  await page.click('#loginbtn');
  // 로그인 성공 시 "/" 또는 webconsole으로 이동 (IAM 서버 응답 대기)
  await page.waitForURL(/\/(webconsole\/|$)/, { timeout: 30000 });
  // 로그인 후 팝업 모달이 뜰 경우 강제 닫기
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    // 모든 열린 모달 강제 닫기
    document.querySelectorAll('.modal.show').forEach((modal: any) => {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (bsModal) bsModal.hide();
      modal.classList.remove('show');
      modal.style.display = 'none';
      (modal as HTMLElement).setAttribute('aria-hidden', 'true');
    });
    // backdrop 제거
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });
  await page.waitForTimeout(500);
}

async function clearModals(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('.modal.show').forEach((modal: any) => {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (bsModal) bsModal.hide();
      modal.classList.remove('show');
      modal.style.display = 'none';
      (modal as HTMLElement).setAttribute('aria-hidden', 'true');
      (modal as HTMLElement).removeAttribute('aria-modal');
    });
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });
  await page.waitForTimeout(300);
}

async function openChangePasswordModal(page: Page) {
  await page.click('.nav-item.dropdown .nav-link[aria-label="Open user menu"]');
  const userDropdown = page.locator('.dropdown-menu.show:has-text("Change Password")');
  await expect(userDropdown).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Change Password")');
  await expect(page.locator('#change-password-modal')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(500); // 모달 애니메이션 완료 대기
}

// ─── Helper: IAM API 직접 호출 ─────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  const ctx = await request.newContext({ baseURL: IAM_URL });
  const res = await ctx.post('/api/auth/login', {
    data: { id: ADMIN_ID, password: ADMIN_PW }
  });
  if (!res.ok()) throw new Error(`Admin login failed: ${res.status()}`);
  const body = await res.json();
  await ctx.dispose();
  return body.access_token || body.accessToken || body.token;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-001 ~ TC-006: ChangeMyPassword (본인 비밀번호 변경)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-001~006: ChangeMyPassword (본인 비밀번호 변경)', () => {

  test('TC-001: Change Password 모달 UI 표시', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);

    // navbar의 사용자 아이콘 클릭 + 모달 열기
    await openChangePasswordModal(page);

    // 모달 내 필드 존재 확인
    await expect(page.locator('#change-password-current')).toBeVisible();
    await expect(page.locator('#change-password-new')).toBeVisible();
    await expect(page.locator('#change-password-confirm')).toBeVisible();

    console.log('TC-001 PASS: Change Password 모달 UI 표시 확인');
  });

  test('TC-002: 빈 폼 제출 시 유효성 검증 (current password 미입력)', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);

    // 모달 열기
    await openChangePasswordModal(page);

    // 동기적 alert을 처리하기 위해 once 핸들러 사용
    let dialogMsg = '';
    page.once('dialog', async dialog => {
      dialogMsg = dialog.message();
      await dialog.accept();
    });
    await page.click('#change-password-modal .btn-primary');
    await page.waitForTimeout(500);
    expect(dialogMsg).toContain('current password');

    // 모달이 닫히지 않아야 함
    await expect(page.locator('#change-password-modal')).toBeVisible();

    console.log('TC-002 PASS: 빈 폼 유효성 검증 확인');
  });

  test('TC-003: 비밀번호 불일치 시 오류', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);

    // 모달 열기
    await openChangePasswordModal(page);

    // 현재 비밀번호 입력, 새 비밀번호와 확인 불일치
    await page.fill('#change-password-current', ADMIN_PW);
    await page.fill('#change-password-new', NEW_PW);
    await page.fill('#change-password-confirm', 'WrongPassword999!');

    let dialogMsg = '';
    page.once('dialog', async dialog => {
      dialogMsg = dialog.message();
      await dialog.accept();
    });
    await page.click('#change-password-modal .btn-primary');
    await page.waitForTimeout(500);
    expect(dialogMsg.toLowerCase()).toContain('match');

    // 모달이 닫히지 않아야 함
    await expect(page.locator('#change-password-modal')).toBeVisible();

    console.log('TC-003 PASS: 비밀번호 불일치 오류 확인');
  });

  test('TC-004: 잘못된 현재 비밀번호 → 401 오류', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await openChangePasswordModal(page);

    await page.fill('#change-password-current', 'WrongCurrentPW!');
    await page.fill('#change-password-new', NEW_PW);
    await page.fill('#change-password-confirm', NEW_PW);

    const dialogPromise = page.waitForEvent('dialog', { timeout: 30000 });
    await page.click('#change-password-modal .btn-primary');
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toMatch(/incorrect|error|failed/);
    await dialog.accept();

    console.log('TC-004 PASS: 잘못된 현재 비밀번호 오류 확인');
  });

  test('TC-005: 성공적인 비밀번호 변경', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await openChangePasswordModal(page);

    await page.fill('#change-password-current', ADMIN_PW);
    await page.fill('#change-password-new', NEW_PW);
    await page.fill('#change-password-confirm', NEW_PW);

    const dialogPromise = page.waitForEvent('dialog', { timeout: 30000 });
    await page.click('#change-password-modal .btn-primary');
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toContain('success');
    await dialog.accept();

    await page.waitForSelector('#change-password-modal:not(.show)', { state: 'attached', timeout: 3000 });

    console.log('TC-005 PASS: 비밀번호 변경 성공');
  });

  test('TC-006: 변경된 비밀번호로 로그인 성공 후 원복', async ({ page }) => {
    await login(page, ADMIN_ID, NEW_PW);
    await expect(page.url()).toMatch(/\/(webconsole\/|$)/);

    await openChangePasswordModal(page);
    await page.fill('#change-password-current', NEW_PW);
    await page.fill('#change-password-new', ADMIN_PW);
    await page.fill('#change-password-confirm', ADMIN_PW);
    const dialogPromise = page.waitForEvent('dialog', { timeout: 30000 });
    await page.click('#change-password-modal .btn-primary');
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toContain('success');
    await dialog.accept();

    console.log('TC-006 PASS: 변경된 비밀번호로 로그인 및 원복 완료');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// TC-007 ~ TC-011: ResetUserPassword (관리자 비밀번호 재설정)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-007~011: ResetUserPassword (관리자 비밀번호 재설정)', () => {
  const testUsername = `pw-test-${SUFFIX}@test.com`;

  test.beforeAll(async () => {
    // 기존 pw-test 사용자 정리 후 테스트용 사용자 신규 생성
    try {
      const token = await getAdminToken();
      const ctx = await request.newContext({ baseURL: IAM_URL });

      // 기존 pw-test 사용자 일괄 삭제 (테이블 pagination 문제 방지)
      const listRes = await ctx.post('/api/users/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok()) {
        const users = await listRes.json() as any[];
        for (const user of users.filter((u: any) => u.username?.includes('pw-test'))) {
          await ctx.delete(`/api/users/id/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // 신규 테스트 사용자 생성 (password 필드 제외 - IAM /api/users 는 password 수락 안 함)
      const res = await ctx.post('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          username: testUsername,
          email: testUsername,
          firstName: 'PW',
          lastName: 'Test',
          enabled: true
        }
      });
      if (!res.ok()) console.warn('beforeAll: user creation returned', res.status(), await res.text());
      await ctx.dispose();
    } catch (e) {
      console.warn('beforeAll: test user creation skipped:', e);
    }
  });

  test('TC-007: Reset Password 모달 UI 표시 (사용자 선택 후)', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await page.goto(`${FRONT_URL}/webconsole/settings/accountnaccess/organizations/users`);
    await page.waitForLoadState('networkidle');
    await clearModals(page);

    // 첫 번째 사용자 행 클릭
    await page.click('#users-table .tabulator-row:first-child');
    await page.waitForTimeout(1000);

    // view-mode-cards 표시 확인
    await expect(page.locator('#view-mode-cards')).toBeVisible({ timeout: 5000 });

    // Reset Password 버튼 확인
    await expect(page.locator('#view-mode-cards button:has-text("Reset Password")')).toBeVisible();

    // 버튼 클릭 → 모달 열기
    await page.click('#view-mode-cards button:has-text("Reset Password")');
    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 5000 });

    // 필드 확인
    await expect(page.locator('#reset-password-new')).toBeAttached();
    await expect(page.locator('#reset-password-confirm')).toBeAttached();

    console.log('TC-007 PASS: Reset Password 모달 UI 표시 확인');
  });

  test('TC-008: 빈 폼 제출 시 유효성 검증', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await page.goto(`${FRONT_URL}/webconsole/settings/accountnaccess/organizations/users`);
    await page.waitForLoadState('networkidle');
    await clearModals(page);

    await page.click('#users-table .tabulator-row:first-child');
    await page.waitForTimeout(1000);
    await page.click('#view-mode-cards button:has-text("Reset Password")');
    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 5000 });

    // 빈 상태에서 JS 함수 직접 호출 (Bootstrap modal 내 요소는 Playwright visibility 우회)
    // page.evaluate는 await 하지 않음: alert()이 JS를 block하면 deadlock 발생
    const dialogPromise = page.waitForEvent('dialog');
    page.evaluate(() => (window as any).resetUserPassword()); // intentionally not awaited
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toMatch(/password/);
    await dialog.accept();

    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 3000 });

    console.log('TC-008 PASS: 빈 폼 유효성 검증 확인');
  });

  test('TC-009: 비밀번호 불일치 시 오류', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await page.goto(`${FRONT_URL}/webconsole/settings/accountnaccess/organizations/users`);
    await page.waitForLoadState('networkidle');
    await clearModals(page);

    await page.click('#users-table .tabulator-row:first-child');
    await page.waitForTimeout(1000);
    await page.click('#view-mode-cards button:has-text("Reset Password")');
    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 5000 });

    await page.evaluate((pw) => {
      (document.getElementById('reset-password-new') as HTMLInputElement).value = pw;
      (document.getElementById('reset-password-confirm') as HTMLInputElement).value = 'WrongConfirm999!';
    }, NEW_PW);

    const dialogPromise = page.waitForEvent('dialog');
    page.evaluate(() => (window as any).resetUserPassword()); // intentionally not awaited
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toContain('match');
    await dialog.accept();

    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 3000 });

    console.log('TC-009 PASS: 비밀번호 불일치 오류 확인');
  });

  test('TC-010: 성공적인 비밀번호 재설정', async ({ page }) => {
    await login(page, ADMIN_ID, ADMIN_PW);
    await page.goto(`${FRONT_URL}/webconsole/settings/accountnaccess/organizations/users`);
    await page.waitForLoadState('networkidle');
    await clearModals(page);

    // testUsername 사용자 찾기 (pagination 처리: 최대 5 페이지 탐색)
    await page.waitForTimeout(2000);
    let targetRow = null;
    for (let pageIdx = 0; pageIdx < 5 && !targetRow; pageIdx++) {
      if (pageIdx > 0) {
        const nextBtn = page.locator('.tabulator-page[data-page="next"]');
        if (await nextBtn.count() === 0 || await nextBtn.isDisabled()) break;
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
      const rows = page.locator('#users-table .tabulator-row');
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const text = await rows.nth(i).textContent();
        if (text && text.includes('pw-test')) {
          targetRow = rows.nth(i);
          break;
        }
      }
    }

    if (!targetRow) {
      throw new Error('TC-010: testUsername not found in users table');
    }

    await targetRow.click();
    await page.waitForTimeout(1000);
    await page.click('#view-mode-cards button:has-text("Reset Password")');
    await page.waitForSelector('#reset-password-modal.show', { state: 'attached', timeout: 5000 });

    await page.evaluate((pw) => {
      (document.getElementById('reset-password-new') as HTMLInputElement).value = pw;
      (document.getElementById('reset-password-confirm') as HTMLInputElement).value = pw;
    }, NEW_PW);

    const dialogPromise = page.waitForEvent('dialog');
    page.evaluate(() => (window as any).resetUserPassword()); // intentionally not awaited
    const dialog = await dialogPromise;
    expect(dialog.message().toLowerCase()).toMatch(/success|successfully/);
    await dialog.accept();

    await page.waitForSelector('#reset-password-modal:not(.show)', { state: 'attached', timeout: 3000 });

    console.log('TC-010 PASS: 비밀번호 재설정 성공');
  });

  test('TC-011: 재설정된 비밀번호로 로그인', async ({ page }) => {
    // TC-010에서 testUsername의 비밀번호가 NEW_PW로 재설정됨
    await login(page, testUsername, NEW_PW);
    await expect(page.url()).toMatch(/\/(webconsole\/|$)/);

    console.log('TC-011 PASS: 재설정된 비밀번호로 로그인 성공');
  });

});
