/**
 * FR-004 역할별 회원가입 → 관리자 승인 → 로그인 E2E 테스트
 *
 * 사전 정의 역할 5종:
 *   admin / operator / viewer / billadmin / billviewer
 *
 * 흐름:
 *   1. 회원가입 폼 UI로 가입
 *   2. admin이 API로 승인(enable) + platform role 할당
 *   3. 해당 유저로 로그인
 */

import { test, expect, Page, APIRequestContext, request } from '@playwright/test';

// ─── 설정 ──────────────────────────────────────────────────────────────────

const FRONT_URL   = 'http://localhost:3104';
const IAM_URL     = 'http://52.79.163.111:5006';
const ADMIN_ID    = 'mcmp';
const ADMIN_PW    = 'mcmp_password';
const TEST_PW     = 'TestPassword123!';
const SUFFIX      = Date.now();

// 사전 정의 역할 목록 (id, name 은 mc-iam-manager /api/roles/list 기준)
const ROLES = [
  { id: '1', name: 'admin' },
  { id: '2', name: 'operator' },
  { id: '3', name: 'viewer' },
  { id: '4', name: 'billadmin' },
  { id: '5', name: 'billviewer' },
] as const;

type Role = typeof ROLES[number];

// 역할별 테스트 유저 정의
function userFor(role: Role) {
  const username = `fr004-${role.name}-${SUFFIX}`;
  return {
    email:        `${username}@test.com`,
    password:     TEST_PW,
    firstName:    role.name.charAt(0).toUpperCase() + role.name.slice(1),
    lastName:     'TestUser',
    organization: `FR004-${role.name.toUpperCase()}`,
    username,       // mc-iam-manager username = email prefix
  };
}

// ─── IAM Admin API 헬퍼 ────────────────────────────────────────────────────

async function getAdminToken(apiCtx: APIRequestContext): Promise<string> {
  const res = await apiCtx.post(`${IAM_URL}/api/auth/login`, {
    data: { id: ADMIN_ID, password: ADMIN_PW },
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`Admin login failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

/** userId 조회 (username으로 검색) */
async function getUserIdByUsername(
  apiCtx: APIRequestContext,
  token: string,
  username: string,
): Promise<number | null> {
  const res = await apiCtx.post(`${IAM_URL}/api/users/list`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {},
  });
  const users: any[] = await res.json();
  const found = users.find((u: any) => u.username === username);
  return found ? found.id : null;
}

/** 승인 (enabled=true) + 역할 할당 */
async function approveAndAssignRole(
  apiCtx: APIRequestContext,
  token: string,
  userId: number,
  user: ReturnType<typeof userFor>,
  role: Role,
): Promise<void> {
  // 1. 승인 (enabled=true)
  const approveRes = await apiCtx.put(`${IAM_URL}/api/users/id/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      username:  user.username,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      enabled:   true,
    },
  });
  if (!approveRes.ok()) {
    throw new Error(`Approve failed for ${user.username}: ${approveRes.status()} ${await approveRes.text()}`);
  }

  // 2. platform role 할당
  const assignRes = await apiCtx.post(`${IAM_URL}/api/roles/assign/platform-role`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      userId:   String(userId),
      roleId:   role.id,
      roleName: role.name,
      roleType: 'platform',
    },
  });
  const assignBody = await assignRes.json();
  // 이미 할당된 경우도 OK
  if (!assignRes.ok() && !assignBody?.error?.includes('이미 할당')) {
    throw new Error(`Role assign failed for ${user.username}: ${assignRes.status()} ${JSON.stringify(assignBody)}`);
  }
}

// ─── UI 헬퍼 ───────────────────────────────────────────────────────────────

async function signupViaUI(page: Page, user: ReturnType<typeof userFor>): Promise<void> {
  await page.goto(`${FRONT_URL}/auth/signup`);
  await page.waitForSelector('#signupbtn', { timeout: 10_000 });

  await page.fill('#email',        user.email);
  await page.fill('#password',     user.password);
  await page.fill('#firstName',    user.firstName);
  await page.fill('#lastName',     user.lastName);
  await page.fill('#organization', user.organization);

  await page.click('#signupbtn');

  // 성공 메시지 대기
  await expect(page.locator('#success-message')).toBeVisible({ timeout: 15_000 });
}

async function loginViaUI(page: Page, user: ReturnType<typeof userFor>): Promise<void> {
  await page.goto(`${FRONT_URL}/auth/login`);
  await page.waitForSelector('#loginbtn', { timeout: 10_000 });

  await page.fill('#id',       user.username);
  await page.fill('#password', user.password);
  await page.click('#loginbtn');
}

// ─── 테스트 ────────────────────────────────────────────────────────────────

test.describe('FR-004 역할별 가입 → 승인 → 로그인', () => {

  let apiCtx: APIRequestContext;
  let adminToken: string;

  test.beforeAll(async () => {
    apiCtx     = await request.newContext();
    adminToken = await getAdminToken(apiCtx);
  });

  test.afterAll(async () => {
    await apiCtx.dispose();
  });

  // 역할별로 독립 테스트 실행
  for (const role of ROLES) {
    const user = userFor(role);

    test(`[${role.name}] 가입 → 관리자 승인 → 로그인`, async ({ page }) => {

      // ── STEP 1: 회원가입 폼 UI로 가입 ──────────────────────────────────

      await test.step('1. 회원가입 폼 제출', async () => {
        await signupViaUI(page, user);
        await expect(page.locator('#success-message')).toContainText('가입 신청이 완료되었습니다.');
        await expect(page.locator('#success-message')).toContainText('관리자 승인 후 로그인하실 수 있습니다.');
        await expect(page.locator('#signup-form')).toBeHidden();
      });

      // ── STEP 2: 미승인 상태 로그인 차단 확인 ───────────────────────────

      await test.step('2. 미승인 상태에서 로그인 시도 → 차단', async () => {
        await loginViaUI(page, user);

        // 로그인 성공(홈 리다이렉트)이 일어나지 않아야 함
        // 짧은 시간 대기 후 여전히 login 페이지 또는 에러 상태
        await page.waitForTimeout(3_000);
        const url = page.url();
        // /auth/login 에 머무르거나 unauthorized 페이지여야 함
        const isBlocked = url.includes('/auth/login') || url.includes('/auth/unauthorized') || url.includes('/auth/signup');
        expect(isBlocked, `미승인 유저 ${user.username}가 로그인에 성공함`).toBe(true);
      });

      // ── STEP 3: 관리자 승인 + 역할 할당 ───────────────────────────────

      await test.step('3. 관리자 승인 + platform role 할당', async () => {
        // 유저 id 조회
        const userId = await getUserIdByUsername(apiCtx, adminToken, user.username);
        expect(userId, `${user.username} 유저 DB 미존재`).not.toBeNull();

        // 승인 + 역할 할당
        await approveAndAssignRole(apiCtx, adminToken, userId!, user, role);

        // 승인 확인
        const checkRes = await apiCtx.get(`${IAM_URL}/api/users/id/${userId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const checkBody = await checkRes.json();
        expect(checkBody.enabled).toBe(true);
        expect(checkBody.platform_roles?.some((r: any) => r.name === role.name)).toBe(true);
      });

      // ── STEP 4: 승인 후 로그인 성공 ────────────────────────────────────

      await test.step('4. 승인 후 로그인 성공', async () => {
        await loginViaUI(page, user);

        // 홈 페이지로 리다이렉트 확인
        await page.waitForURL(
          (url) => !url.pathname.includes('/auth/login') && !url.pathname.includes('/auth/signup'),
          { timeout: 15_000 },
        );

        const finalUrl = page.url();
        expect(finalUrl).not.toContain('/auth/login');
        expect(finalUrl).not.toContain('/auth/unauthorized');
      });
    });
  }

  // ─── 추가: admin 계정으로 전체 유저 목록 확인 ──────────────────────────

  test('admin으로 로그인 후 신규 가입 유저들이 목록에 존재한다', async ({ page }) => {
    // admin 로그인 (mcmp)
    await page.goto(`${FRONT_URL}/auth/login`);
    await page.waitForSelector('#loginbtn', { timeout: 10_000 });
    await page.fill('#id',       ADMIN_ID);
    await page.fill('#password', ADMIN_PW);
    await page.click('#loginbtn');

    await page.waitForURL(
      (url) => !url.pathname.includes('/auth/login'),
      { timeout: 15_000 },
    );

    // 생성된 유저들이 API에 존재하는지 확인
    const usersRes = await apiCtx.post(`${IAM_URL}/api/users/list`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {},
    });
    const users: any[] = await usersRes.json();

    for (const role of ROLES) {
      const user     = userFor(role);
      const found    = users.find((u: any) => u.username === user.username);
      expect(found, `${role.name} 유저(${user.username})가 목록에 없음`).toBeTruthy();
      expect(found.enabled).toBe(true);
    }
  });
});
