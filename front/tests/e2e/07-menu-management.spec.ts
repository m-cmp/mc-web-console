import { test, expect, Page } from '@playwright/test';
import { login, goToMenusPage } from './helpers/auth';

// Unique suffix to avoid collisions across test runs
const SUFFIX = Date.now();

// ─── Mock responses ────────────────────────────────────────────────────────
const MOCK_CREATE_SUCCESS = { responseData: { id: `e2e-mock-${SUFFIX}` }, status: { code: 200, message: 'OK' } };
const MOCK_UPDATE_SUCCESS = { responseData: {}, status: { code: 200, message: 'OK' } };
const MOCK_DELETE_SUCCESS = { responseData: {}, status: { code: 200, message: 'OK' } };

// ─── helpers ───────────────────────────────────────────────────────────────

/** Wait for jstree to finish loading and rendering nodes */
async function waitForTree(page: Page) {
  await page.waitForSelector('#menu-tree .jstree-node', { timeout: 15_000 });
}

/**
 * Click the first visible jstree anchor and return the node ID
 * from the detail panel after it appears.
 */
async function selectFirstNode(page: Page): Promise<string> {
  const firstAnchor = page.locator('#menu-tree .jstree-anchor').first();
  await firstAnchor.click();

  await page.waitForFunction(() => {
    const panel = document.getElementById('menu-detail-panel');
    return panel && !panel.classList.contains('d-none');
  }, { timeout: 5_000 });

  const nodeId = await page.locator('#detail-menu-id').textContent();
  if (!nodeId || nodeId === '-') throw new Error('Could not get node ID from detail panel');
  return nodeId.trim();
}

// ─── test setup ────────────────────────────────────────────────────────────

test.describe('FR-007 Menu Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToMenusPage(page);
  });

  // TC-001 ─────────────────────────────────────────────────────────────────
  test('TC-001: 메뉴 트리 조회 - jstree가 렌더링되고 노드가 존재한다', async ({ page }) => {
    await expect(page.locator('#menu-tree')).toBeVisible();
    await waitForTree(page);

    const nodeCount = await page.locator('#menu-tree .jstree-node').count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  // TC-002 ─────────────────────────────────────────────────────────────────
  test('TC-002: 메뉴 상세 조회 - 노드 클릭 시 상세 패널이 표시된다', async ({ page }) => {
    await waitForTree(page);

    // Detail panel should be hidden initially
    await expect(page.locator('#menu-detail-panel')).toHaveClass(/d-none/);

    await selectFirstNode(page);

    await expect(page.locator('#menu-detail-panel')).not.toHaveClass(/d-none/);

    // All 6 detail fields should be present and non-empty
    for (const id of [
      '#detail-menu-id',
      '#detail-menu-displayname',
      '#detail-menu-parentid',
      '#detail-menu-isaction',
      '#detail-menu-priority',
      '#detail-menu-menunumber',
    ]) {
      await expect(page.locator(id)).toBeVisible();
      const text = await page.locator(id).textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  // TC-003 ─────────────────────────────────────────────────────────────────
  test('TC-003: 루트 메뉴 생성 - Add Root Menu 클릭 시 모달이 열리고 저장된다', async ({ page }) => {
    // Mock the create API (backend endpoint not yet implemented)
    await page.route('**/api/mc-iam-manager/Createmenu', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CREATE_SUCCESS) });
    });

    await waitForTree(page);

    // Open create root modal
    await page.click('button[onclick="openCreateRootMenuModal()"]');
    await expect(page.locator('#create-menu-modal')).toBeVisible({ timeout: 5_000 });

    // parentid should be empty (root)
    const parentVal = await page.locator('#create-menu-parentid').inputValue();
    expect(parentVal).toBe('');

    // Fill form
    await page.fill('#create-menu-id', `e2e-root-${SUFFIX}`);
    await page.fill('#create-menu-displayname', `E2E Root ${SUFFIX}`);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('Createmenu'),
      { timeout: 10_000 }
    );

    await page.click('button[onclick="saveCreateMenu()"]');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Modal should close
    await expect(page.locator('#create-menu-modal')).not.toBeVisible({ timeout: 5_000 });
  });

  // TC-004 ─────────────────────────────────────────────────────────────────
  test('TC-004: 자식 메뉴 생성 - Add Child 클릭 시 parentId가 자동으로 설정된다', async ({ page }) => {
    await page.route('**/api/mc-iam-manager/Createmenu', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CREATE_SUCCESS) });
    });

    await waitForTree(page);

    // Select a node to be the parent
    const parentId = await selectFirstNode(page);

    // Click Add Child
    await page.click('button[onclick="openCreateChildMenuModal()"]');
    await expect(page.locator('#create-menu-modal')).toBeVisible({ timeout: 5_000 });

    // parentid select should have the selected node's ID as its value
    const parentVal = await page.locator('#create-menu-parentid').inputValue();
    expect(parentVal).toBe(parentId);

    // Fill form
    await page.fill('#create-menu-id', `e2e-child-${SUFFIX}`);
    await page.fill('#create-menu-displayname', `E2E Child ${SUFFIX}`);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('Createmenu'),
      { timeout: 10_000 }
    );

    await page.click('button[onclick="saveCreateMenu()"]');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page.locator('#create-menu-modal')).not.toBeVisible({ timeout: 5_000 });
  });

  // TC-005 ─────────────────────────────────────────────────────────────────
  test('TC-005: 메뉴 수정 - Edit 모달에 현재 값이 채워지고 저장된다', async ({ page }) => {
    await page.route('**/api/mc-iam-manager/Updatemenu', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_UPDATE_SUCCESS) });
    });

    await waitForTree(page);
    await selectFirstNode(page);

    // Get current display name from detail panel
    const originalName = (await page.locator('#detail-menu-displayname').textContent()) || '';

    // Click Edit
    await page.click('button[onclick="openEditMenuModal()"]');
    await expect(page.locator('#edit-menu-modal')).toBeVisible({ timeout: 5_000 });

    // Menu ID should be readonly
    const isReadonly = await page.locator('#edit-menu-id').getAttribute('readonly');
    expect(isReadonly).not.toBeNull();

    // Form should be pre-filled with current display name
    const formDisplayName = await page.locator('#edit-menu-displayname').inputValue();
    expect(formDisplayName).toBe(originalName.trim());

    // Update display name
    await page.fill('#edit-menu-displayname', `${originalName.trim()} (edited)`);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('Updatemenu'),
      { timeout: 10_000 }
    );

    await page.click('button[onclick="saveEditMenu()"]');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Modal should close
    await expect(page.locator('#edit-menu-modal')).not.toBeVisible({ timeout: 5_000 });
  });

  // TC-006 ─────────────────────────────────────────────────────────────────
  test('TC-006: 메뉴 삭제 - Delete 모달에 메뉴 ID가 표시되고 삭제 후 패널이 숨겨진다', async ({ page }) => {
    await page.route('**/api/mc-iam-manager/Deletemenu', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DELETE_SUCCESS) });
    });

    await waitForTree(page);

    // Select a node
    const selectedId = await selectFirstNode(page);

    // Click Delete
    await page.click('button[onclick="openDeleteMenuModal()"]');
    await expect(page.locator('#delete-menu-modal')).toBeVisible({ timeout: 5_000 });

    // Menu ID should be shown in the modal
    const displayedId = await page.locator('#delete-menu-id-display').textContent();
    expect(displayedId?.trim()).toBe(selectedId);

    const deleteResp = page.waitForResponse(
      (r) => r.url().includes('Deletemenu'),
      { timeout: 10_000 }
    );

    await page.click('button[onclick="confirmDeleteMenu()"]');
    const delResponse = await deleteResp;
    expect(delResponse.status()).toBe(200);

    // Detail panel should be hidden after deletion
    await page.waitForFunction(() => {
      const panel = document.getElementById('menu-detail-panel');
      return panel && panel.classList.contains('d-none');
    }, { timeout: 10_000 });

    await expect(page.locator('#menu-detail-panel')).toHaveClass(/d-none/);
  });

  // TC-007 ─────────────────────────────────────────────────────────────────
  test('TC-007: 에러 처리 - API 오류 시 alert 또는 에러 메시지가 표시된다', async ({ page }) => {
    // Intercept the menu list API and return 500 before page loads
    await page.route('**/api/mc-iam-manager/Getmenuresources', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Listen for dialog (alert)
    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    // Navigate to the page to trigger loadTree()
    await page.goto('http://localhost:3001/webconsole/settings/accountnaccess/organizations/menus');

    // Wait for error to surface
    await page.waitForTimeout(3_000);

    // Either a dialog appeared or an error element is shown
    const hasErrorElement = await page.locator('.toast, .alert-danger, .text-danger').count() > 0;
    expect(dialogAppeared || hasErrorElement).toBe(true);
  });
});
