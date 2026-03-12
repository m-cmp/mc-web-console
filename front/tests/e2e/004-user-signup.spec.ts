import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3104';

// 매 테스트 실행마다 고유한 이메일 생성 (중복 가입 방지)
const UNIQUE_EMAIL = `e2e-test-${Date.now()}@example.com`;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────

async function gotoSignup(page: Page) {
  await page.goto(`${BASE_URL}/auth/signup`);
  await page.waitForSelector('#signupbtn', { timeout: 10_000 });
}

async function fillForm(page: Page, opts: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
}) {
  if (opts.email !== undefined)       await page.fill('#email', opts.email);
  if (opts.password !== undefined)    await page.fill('#password', opts.password);
  if (opts.firstName !== undefined)   await page.fill('#firstName', opts.firstName);
  if (opts.lastName !== undefined)    await page.fill('#lastName', opts.lastName);
  if (opts.organization !== undefined) await page.fill('#organization', opts.organization);
}

async function submitForm(page: Page) {
  await page.click('#signupbtn');
}

// ─── 테스트 ────────────────────────────────────────────────────────────────

test.describe('FR-004 회원가입 폼', () => {

  // TC-001: 공개 라우트 접근
  test('TC-001: /auth/signup 페이지에 인증 없이 접근할 수 있다', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signup`);

    // 로그인 페이지로 리다이렉트되지 않아야 함
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).not.toHaveURL(/\/auth\/unauthorized/);

    // 회원가입 폼이 표시되어야 함
    await expect(page.locator('#signupbtn')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#organization')).toBeVisible();
  });

  // TC-002: 페이지 UI 요소 확인
  test('TC-002: 회원가입 폼에 필수 UI 요소가 모두 존재한다', async ({ page }) => {
    await gotoSignup(page);

    // 헤더
    await expect(page.locator('h2')).toContainText('Create your account');

    // 필드
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#organization')).toBeVisible();

    // 제출 버튼
    await expect(page.locator('#signupbtn')).toBeVisible();
    await expect(page.locator('#signupbtn')).toHaveText('Sign Up');

    // 로그인 링크
    await expect(page.locator('a[href="/auth/login"]')).toBeVisible();

    // 성공 메시지는 초기에 숨겨져 있어야 함
    await expect(page.locator('#success-message')).toBeHidden();
  });

  // TC-003: 이메일 형식 유효성 검사
  test('TC-003: 이메일 형식이 잘못되면 오류 메시지가 표시되고 제출이 차단된다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: 'notanemail',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });
    await submitForm(page);

    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#email-error')).toContainText('유효한 이메일 주소를 입력해 주세요.');

    // 성공 메시지는 표시되지 않아야 함
    await expect(page.locator('#success-message')).toBeHidden();
  });

  // TC-004: 비밀번호 8자 미만 유효성 검사
  test('TC-004: 비밀번호가 8자 미만이면 오류 메시지가 표시된다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: 'test@example.com',
      password: 'short',
      firstName: 'Test',
      lastName: 'User',
    });
    await submitForm(page);

    await expect(page.locator('#password-error')).toBeVisible();
    await expect(page.locator('#password-error')).toContainText('비밀번호는 8자 이상이어야 합니다.');
  });

  // TC-005: firstName 필수 검사
  test('TC-005: firstName이 비어 있으면 오류 메시지가 표시된다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
      firstName: '',
      lastName: 'User',
    });
    await submitForm(page);

    await expect(page.locator('#firstName-error')).toBeVisible();
    await expect(page.locator('#firstName-error')).toContainText('이름을 입력해 주세요.');
  });

  // TC-006: lastName 필수 검사
  test('TC-006: lastName이 비어 있으면 오류 메시지가 표시된다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: '',
    });
    await submitForm(page);

    await expect(page.locator('#lastName-error')).toBeVisible();
    await expect(page.locator('#lastName-error')).toContainText('성을 입력해 주세요.');
  });

  // TC-007: organization은 선택 필드 (비워도 오류 없음)
  test('TC-007: organization이 비어 있어도 오류가 표시되지 않는다 (선택 필드)', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: 'org-skip@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      organization: '',
    });
    await submitForm(page);

    // organization 오류 없음 (다른 오류도 없어야 함)
    // organization-error div는 없으므로 firstName/lastName/email/password 오류 없어야 함
    await expect(page.locator('#email-error')).toBeHidden();
    await expect(page.locator('#password-error')).toBeHidden();
    await expect(page.locator('#firstName-error')).toBeHidden();
    await expect(page.locator('#lastName-error')).toBeHidden();
  });

  // TC-008: 모든 필드 비움 시 복수 오류 표시
  test('TC-008: 모든 필드가 비어 있으면 여러 오류 메시지가 동시에 표시된다', async ({ page }) => {
    await gotoSignup(page);

    await submitForm(page);

    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
    await expect(page.locator('#firstName-error')).toBeVisible();
    await expect(page.locator('#lastName-error')).toBeVisible();
  });

  // TC-009: 정상 가입 성공 플로우
  test('TC-009: 올바른 정보로 가입하면 성공 메시지가 표시되고 폼이 사라진다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: UNIQUE_EMAIL,
      password: 'TestPassword123!',
      firstName: 'E2E',
      lastName: 'Test',
      organization: 'TestOrg',
    });
    await submitForm(page);

    // 성공 메시지 대기 (API 응답 시간 고려)
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#success-message')).toContainText('가입 신청이 완료되었습니다.');
    await expect(page.locator('#success-message')).toContainText('관리자 승인 후 로그인하실 수 있습니다.');

    // 폼은 숨겨져야 함
    await expect(page.locator('#signup-form')).toBeHidden();

    // 로그인 이동 버튼 표시
    await expect(page.locator('#go-login-btn')).toBeVisible();
  });

  // TC-010: 성공 후 로그인 페이지 이동
  test('TC-010: 성공 화면의 [로그인 페이지로 이동] 버튼 클릭 시 /auth/login으로 이동한다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: `btn-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Btn',
      lastName: 'Test',
    });
    await submitForm(page);

    await expect(page.locator('#go-login-btn')).toBeVisible({ timeout: 15_000 });
    await page.click('#go-login-btn');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

  // TC-011: 로그인 페이지의 회원가입 링크
  test('TC-011: 로그인 페이지의 [회원가입] 링크 클릭 시 /auth/signup으로 이동한다', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForSelector('#loginbtn', { timeout: 10_000 });

    await page.click('a[href="/auth/signup"]');

    await expect(page).toHaveURL(/\/auth\/signup/, { timeout: 10_000 });
    await expect(page.locator('#signupbtn')).toBeVisible();
  });

  // TC-012: 회원가입 페이지의 로그인 링크
  test('TC-012: 회원가입 페이지의 [로그인] 링크 클릭 시 /auth/login으로 이동한다', async ({ page }) => {
    await gotoSignup(page);

    await page.click('a[href="/auth/login"]');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page.locator('#loginbtn')).toBeVisible();
  });

  // TC-013: Enter 키로 폼 제출
  test('TC-013: password 필드에서 Enter 키를 누르면 폼이 제출된다', async ({ page }) => {
    await gotoSignup(page);

    await fillForm(page, {
      email: UNIQUE_EMAIL + '.enter',
      password: '',  // 일부러 비워 오류 유발
      firstName: 'Enter',
      lastName: 'Test',
    });

    // Enter 키 입력
    await page.press('#password', 'Enter');

    // 유효성 검사 오류 발생 확인 (제출은 시도됨)
    await expect(page.locator('#password-error')).toBeVisible({ timeout: 5_000 });
  });

  // TC-014: 오류 후 재입력 시 오류 초기화
  test('TC-014: 오류 표시 후 [Sign Up] 재클릭 시 이전 오류 메시지가 초기화된다', async ({ page }) => {
    await gotoSignup(page);

    // 첫 번째 제출 - 오류 발생
    await submitForm(page);
    await expect(page.locator('#email-error')).toBeVisible();

    // 올바른 값 입력 후 재제출
    await fillForm(page, {
      email: `retry-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Retry',
      lastName: 'Test',
    });
    await submitForm(page);

    // 이전 오류들이 사라져야 함
    await expect(page.locator('#email-error')).toBeHidden();
    await expect(page.locator('#password-error')).toBeHidden();
    await expect(page.locator('#firstName-error')).toBeHidden();
    await expect(page.locator('#lastName-error')).toBeHidden();
  });
});
