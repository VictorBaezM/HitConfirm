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
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

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

    // 7.5. Test inline row expansion (accordion)
    await tableSearch.fill(''); // clear search
    const firstMoveRow = frameTable.locator('.clickable-row').first();
    await expect(firstMoveRow).toBeVisible();
    
    // Click to expand row
    await firstMoveRow.click();
    await expect(firstMoveRow).toHaveClass(/expanded/);
    
    // Verify detail row is visible
    const detailsRow = frameTable.locator('.frame-details-tr').first();
    await expect(detailsRow).not.toHaveClass(/hidden/);

    // Click again to collapse
    await firstMoveRow.click();
    await expect(firstMoveRow).not.toHaveClass(/expanded/);


    // 8. Go back to Strategy Hub
    const backBtn = page.locator('#btn-back');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify we are back on the Strategy Hub main page
    await expect(page.locator('h1.hub-title')).toHaveText('Strategy Hub');
  });

  test('should load Street Fighter 6 character frame data successfully', async ({ page }) => {
    // 1. Go to Strategy Hub
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // 2. Click SF6 game chip filter
    const sf6Chip = page.locator('.btn-chip[data-filter="sf6"]');
    await expect(sf6Chip).toBeVisible();
    await sf6Chip.click();

    // Wait for the loading overlay to hide
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // 3. Click a Street Fighter 6 character card (e.g., Ryu)
    const searchInput = page.locator('#hub-search');
    await searchInput.fill('Ryu');
    
    const ryuCard = page.locator('#section-sf6 .character-card:has-text("Ryu")');
    await expect(ryuCard).toBeVisible();
    await ryuCard.click();

    // 4. Verify character page header
    await expect(page.locator('.character-header h1')).toHaveText('Ryu');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    // 5. Wait for frame data table to load
    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible({ timeout: 20000 });
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
  });

  test('should load DNF Duel character frame data successfully', async ({ page }) => {
    // 1. Go to Strategy Hub
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // 2. Click DNF Duel game chip filter
    const dnfdChip = page.locator('.btn-chip[data-filter="dnfd"]');
    await expect(dnfdChip).toBeVisible();
    await dnfdChip.click();

    // Wait for the loading overlay to hide
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // 3. Search for DNF Duel character Grappler
    const searchInput = page.locator('#hub-search');
    await searchInput.fill('Grappler');

    const card = page.locator('#section-dnfd .character-card:has-text("Grappler")');
    await expect(card).toBeVisible();
    await card.click();

    // 4. Verify character page header
    await expect(page.locator('.character-header h1')).toHaveText('Grappler');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    // 5. Wait for frame data table to load
    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
  });

  test('should load Dragon Ball FighterZ character frame data successfully', async ({ page }) => {
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const dbfzChip = page.locator('.btn-chip[data-filter="dbfz"]');
    await expect(dbfzChip).toBeVisible();
    await dbfzChip.click();

    // Wait for the loading overlay to hide
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const searchInput = page.locator('#hub-search');
    await searchInput.fill('Goku (Super Saiyan)');

    const card = page.locator('#section-dbfz .character-card:has-text("Goku (Super Saiyan)")');
    await expect(card).toBeVisible();
    await card.click();

    await expect(page.locator('.character-header h1')).toHaveText('Goku (Super Saiyan)');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
  });

  test('should load DBFZ CE character frame data successfully', async ({ page }) => {
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const dbfzceChip = page.locator('.btn-chip[data-filter="dbfzce"]');
    await expect(dbfzceChip).toBeVisible();
    await dbfzceChip.click();

    // Wait for the loading overlay to hide
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const searchInput = page.locator('#hub-search');
    await searchInput.fill('SS Goku');

    const card = page.locator('#section-dbfzce .character-card:has-text("SS Goku")');
    await expect(card).toBeVisible();
    await card.click();

    await expect(page.locator('.character-header h1')).toHaveText('SS Goku');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
  });

  test('should load GBVSR character frame data successfully', async ({ page }) => {
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const gbvsrChip = page.locator('.btn-chip[data-filter="gbvsr"]');
    await expect(gbvsrChip).toBeVisible();
    await gbvsrChip.click();

    // Wait for the loading overlay to hide
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const searchInput = page.locator('#hub-search');
    await searchInput.fill('Anila');

    const card = page.locator('#section-gbvsr .character-card:has-text("Anila")');
    await expect(card).toBeVisible();
    await card.click();

    await expect(page.locator('.character-header h1')).toHaveText('Anila');
    await expect(page.locator('.character-portrait-large')).toBeVisible();

    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();
    await expect(frameTable.locator('.frame-data-th:has-text("Move")')).toBeVisible();
  });
});
