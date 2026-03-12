import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('Add Groups menu under organizations', async ({ page }) => {
  await login(page);

  await page.goto('http://localhost:3001/webconsole/settings/accountnaccess/organizations/menus');
  await page.waitForSelector('#menu-tree .jstree-node', { timeout: 15_000 });
  console.log('✅ Menus page loaded');

  // Find and click "organizations" node
  const orgAnchor = page.locator('#menu-tree .jstree-anchor').filter({ hasText: 'organizations' });
  await orgAnchor.click();
  await page.waitForFunction(() => {
    const panel = document.getElementById('menu-detail-panel');
    return panel && !panel.classList.contains('d-none');
  }, { timeout: 5_000 });
  const selectedId = await page.locator('#detail-menu-id').textContent();
  console.log('✅ Selected node:', selectedId?.trim());
  expect(selectedId?.trim()).toBe('organizations');

  // Click Add Child
  await page.click('button[onclick="openCreateChildMenuModal()"]');
  await expect(page.locator('#create-menu-modal')).toBeVisible({ timeout: 5_000 });
  console.log('✅ Create modal opened');

  // Verify parentId is set to organizations
  const parentVal = await page.locator('#create-menu-parentid').inputValue();
  expect(parentVal).toBe('organizations');
  console.log('✅ parentId:', parentVal);

  // Fill form
  await page.fill('#create-menu-id', 'groups');
  await page.fill('#create-menu-displayname', 'Groups');
  const isActionCheckbox = page.locator('#create-menu-isaction');
  if (!(await isActionCheckbox.isChecked())) await isActionCheckbox.check();
  await page.fill('#create-menu-priority', '2');
  await page.fill('#create-menu-menunumber', '1225');

  // Save
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('Createmenu'),
    { timeout: 10_000 }
  );
  await page.click('button[onclick="saveCreateMenu()"]');
  const response = await responsePromise;
  console.log('✅ API response status:', response.status());
  expect([200, 201]).toContain(response.status());

  await expect(page.locator('#create-menu-modal')).not.toBeVisible({ timeout: 5_000 });
  console.log('✅ Modal closed - Groups menu added successfully');
});
