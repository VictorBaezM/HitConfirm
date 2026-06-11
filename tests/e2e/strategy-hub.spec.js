const { test, expect } = require('@playwright/test');

test.describe('HitConfirm Strategy Hub E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log console errors to standard error
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`PAGE CONSOLE ERROR: ${msg.text()}`);
      }
    });
    // Go to home page
    await page.goto('/');
  });

  test('should navigate to Strategy Hub, search characters, and load frame data', async ({ page }) => {
    // 1. Click the "Strategy Hub" tab in the navbar
    const hubLink = page.locator('.nav-link[data-page="hub"]');
    await expect(hubLink).toBeVisible();
    await hubLink.click();

    // 2. Verify Strategy Hub page content
    await expect(page.locator('h1.hub-title')).toHaveText('Strategy Hub');
    await expect(page.locator('#strategy-hub-mount')).toBeVisible();

    // 3. Verify game sections exist (e.g., Guilty Gear -Strive-)
    const ggstSection = page.locator('#section-ggst');
    await expect(ggstSection).toBeVisible();
    await expect(ggstSection.locator('.game-section-title')).toHaveText('Guilty Gear -Strive-');

    // 4. Verify search character filtering
    const searchInput = page.locator('#hub-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Sol');

    // Only Sol Badguy card should be visible in GGST, and other game sections should be hidden
    await expect(page.locator('.character-card:has-text("Sol Badguy")')).toBeVisible();
    await expect(page.locator('.character-card:has-text("Ky Kiske")')).not.toBeVisible();
    await expect(page.locator('#section-dbfz')).not.toBeVisible();

    // 5. Navigate to character details page by clicking card
    await page.click('.character-card:has-text("Sol Badguy")');

    // Verify character page header and portrait
    await expect(page.locator('.character-header h1')).toHaveText('Sol Badguy');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    // Wait for frame data table to load
    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();

    // Check table headers
    const headers = frameTable.locator('.frame-data-th');
    await expect(headers.first()).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Command")')).toBeVisible();

    // Check advantage color coding (positive/negative advantage badges)
    const positiveBadge = frameTable.locator('.adv-badge.adv-plus');
    const negativeBadge = frameTable.locator('.adv-badge.adv-minus');
    // Ensure we have some frame data advantage tags loaded and rendered
    if (await positiveBadge.count() > 0) {
      await expect(positiveBadge.first()).toBeVisible();
    }
    if (await negativeBadge.count() > 0) {
      await expect(negativeBadge.first()).toBeVisible();
    }

    // 6. Search for specific moves inside character frame table
    const tableSearch = page.locator('#table-search');
    await expect(tableSearch).toBeVisible();
    await tableSearch.fill('Fafnir');

    // Verify row filtering
    await expect(frameTable.locator('.frame-data-td:has-text("Fafnir")')).toBeVisible();
    await expect(frameTable.locator('.frame-data-td:has-text("Bandit Revolver")')).not.toBeVisible();

    // 7. Test sorting by clicking a column header (e.g. Command)
    const commandHeader = frameTable.locator('.frame-data-th:has-text("Command")');
    await commandHeader.click();
    await expect(commandHeader).toHaveClass(/sorted-asc/);
    
    await commandHeader.click();
    await expect(commandHeader).toHaveClass(/sorted-desc/);

    // 8. Go back to Strategy Hub
    const backBtn = page.locator('#btn-back');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify we are back on the Strategy Hub main page
    await expect(page.locator('h1.hub-title')).toHaveText('Strategy Hub');
  });

  test('should display grace notice for Phase 2 unsupported titles', async ({ page }) => {
    // 1. Go to Strategy Hub
    await page.click('.nav-link[data-page="hub"]');

    // 2. Click a Street Fighter 6 character card (e.g., Ryu)
    // First clear search and filter to SF6
    const searchInput = page.locator('#hub-search');
    await searchInput.fill('Ryu');
    
    const ryuCard = page.locator('#section-sf6 .character-card:has-text("Ryu")');
    await expect(ryuCard).toBeVisible();
    await ryuCard.click();

    // 3. Verify the unsupported notice is rendered (Phase 2 degradation notice)
    await expect(page.locator('.unsupported-notice h3')).toHaveText('Phase 2 Expansion');
    await expect(page.locator('.unsupported-notice')).toContainText('coming in Phase 2');
  });
});
