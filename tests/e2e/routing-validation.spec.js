const { test, expect } = require('@playwright/test');

test.describe('HitConfirm SPA Page Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`PAGE CONSOLE ERROR: ${msg.text()}`);
      }
    });
  });

  test('can navigate to all pages', async ({ page }) => {
    // 1. Visit root page (Feed)
    await page.goto('/');
    await expect(page.locator('#timeline-list')).toBeVisible();

    // 2. Click Dojo link
    await page.click('.nav-link[data-page="combos"]');
    await expect(page.locator('#dojo-game-filter')).toBeVisible();
    await expect(page.locator('h1:has-text("Dojo")')).toBeVisible();

    // 3. Click Builder link
    await page.click('.nav-link[data-page="builder"]');
    await expect(page.locator('#builder-game-select')).toBeVisible();

    // 4. Click Strategy Hub link
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('h1.hub-title:has-text("Strategy Hub")')).toBeVisible();

    // 5. Click My Dojo link (without login should show locker room page)
    await page.click('.nav-link[data-page="profile"]');
    await expect(page.locator('h2:has-text("Dojo Locker Room")')).toBeVisible();
  });

  test('should support collapsing and expanding the left navigation sidebar', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.locator('.wiki-left-nav');
    const appContainer = page.locator('#app-container');
    const toggleBtn = page.locator('#nav-toggle-sidebar');
    
    // Initial state: expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(appContainer).not.toHaveClass(/sidebar-collapsed/);
    
    // Click toggle button to collapse
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);
    await expect(appContainer).toHaveClass(/sidebar-collapsed/);
    
    // Click toggle button again to expand
    await toggleBtn.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(appContainer).not.toHaveClass(/sidebar-collapsed/);
  });
});
