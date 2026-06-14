const { test, expect } = require('@playwright/test');

test.describe('Graphical Move Notation E2E Verification', () => {
  test('should render visual button notations in Strategy Hub matchup table and Character Frame tables', async ({ page }) => {
    // 1. Visit root page
    await page.goto('/');

    // 2. Navigate to Strategy Hub guides/matchup page
    const strategyLink = page.locator('.nav-link[data-page="strategy"]');
    await expect(strategyLink).toBeVisible();
    await strategyLink.click();

    // Verify Strategy page heading is loaded
    await expect(page.locator('h1:has-text("STRATEGY HUB")')).toBeVisible();

    // Verify that the matchup matrix table is loaded
    const cheatSheetTable = page.locator('#cheat-sheet-tbody');
    await expect(cheatSheetTable).toBeVisible();

    // Assert that the move command column has rendered visual combo sequence buttons
    const moveSequence = cheatSheetTable.locator('.strategy-matrix-td-move .combo-sequence').first();
    await expect(moveSequence).toBeVisible();

    // Assert that the optimal punish column has also rendered visual combo sequence buttons
    const punishSequence = cheatSheetTable.locator('.strategy-matrix-td-punish .combo-sequence').first();
    await expect(punishSequence).toBeVisible();

    // 3. Navigate to Character Select Hub
    const hubLink = page.locator('.nav-link[data-page="hub"]');
    await expect(hubLink).toBeVisible();
    await hubLink.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // Click SF6 chip to render SF6 characters
    const sf6Chip = page.locator('.btn-chip[data-filter="sf6"]');
    await expect(sf6Chip).toBeVisible();
    await sf6Chip.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // Click on Ryu card
    const ryuCard = page.locator('.character-card:has-text("Ryu")');
    await expect(ryuCard).toBeVisible();
    await ryuCard.click();

    // Verify Ryu page loaded
    await expect(page.locator('.character-header h1')).toHaveText('Ryu');

    // Wait for Ryu's frame data table
    const ryuTable = page.locator('#data-table-el');
    await expect(ryuTable).toBeVisible();

    // Expand the Standing Light Punch row
    const ryuSearch = page.locator('#table-search');
    await expect(ryuSearch).toBeVisible();
    await ryuSearch.fill('Standing Light Punch');
    
    const ryuRow = ryuTable.locator('.clickable-row:has-text("Standing Light Punch")');
    await expect(ryuRow).toBeVisible();

    // The 'Command' column should render visual combo sequence buttons (normalized Standing Light Punch -> 5LP)
    const ryuCommandCell = ryuRow.locator('td.frame-data-td .combo-sequence');
    await expect(ryuCommandCell).toBeVisible();
    console.log('Ryu Standing Light Punch renders visual buttons successfully.');

    // 4. Navigate back to Character Select Hub to verify Tekken 8 Kazuya
    await hubLink.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // Click T8 chip to render Tekken 8 characters
    const t8Chip = page.locator('.btn-chip[data-filter="t8"]');
    await expect(t8Chip).toBeVisible();
    await t8Chip.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // Click on Kazuya card
    const kazuyaCard = page.locator('.character-card:has-text("Kazuya")');
    await expect(kazuyaCard).toBeVisible();
    await kazuyaCard.click();

    // Verify Kazuya page loaded
    await expect(page.locator('.character-header h1')).toHaveText('Kazuya');

    // Wait for Kazuya's frame data table
    const kazuyaTable = page.locator('#data-table-el');
    await expect(kazuyaTable).toBeVisible();

    // Expand the first row
    const kazuyaRow = kazuyaTable.locator('.clickable-row').first();
    await expect(kazuyaRow).toBeVisible();

    // The 'Command' column should render visual combo sequence buttons (e.g. 2+3, 1, 1,1, etc.)
    const kazuyaCommandCell = kazuyaRow.locator('td.frame-data-td .combo-sequence');
    await expect(kazuyaCommandCell).toBeVisible();
    console.log('Kazuya first move renders visual buttons successfully.');
  });
});
