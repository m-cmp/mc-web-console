import { Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const TEST_USER = process.env.TEST_USER || 'mcmp';
const TEST_PW = process.env.TEST_PW || 'mcmp_password';

/**
 * Login as Platform Admin and wait for redirect to home page.
 */
export async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForSelector('#loginbtn', { timeout: 10_000 });

  await page.fill('#id', TEST_USER);
  await page.fill('#password', TEST_PW);
  await page.click('#loginbtn');

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

/**
 * Navigate to the menus management page.
 */
export async function goToMenusPage(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/webconsole/settings/accountnaccess/organizations/menus`);
  // Wait for jstree to render
  await page.waitForSelector('#menu-tree', { timeout: 15_000 });
}
