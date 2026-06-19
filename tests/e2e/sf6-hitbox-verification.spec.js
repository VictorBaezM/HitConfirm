const { test, expect } = require('@playwright/test');

test.describe('Street Fighter 6 Hitbox E2E Verification', () => {
  test('should load ultimateframedata.com hitbox GIFs for Ryu', async ({ page }) => {
    // Go to home page
    await page.goto('/');

    // Navigate to Strategy Hub
    const hubLink = page.locator('.nav-link[data-page="hub"]');
    await expect(hubLink).toBeVisible();
    await hubLink.click();

    // Click on Ryu card under Street Fighter 6
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
    
    const sf6Chip = page.locator('#sidebar-game-sf6');
    await expect(sf6Chip).toBeVisible();
    await sf6Chip.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const ryuCard = page.locator('.character-card:has-text("Ryu")');
    await expect(ryuCard).toBeVisible();
    await ryuCard.click();

    // Verify character page header
    await expect(page.locator('.character-header h1')).toHaveText('Ryu');

    // Wait for frame data table to load
    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();

    // Search for "Standing Light Punch"
    const tableSearch = page.locator('#table-search');
    await expect(tableSearch).toBeVisible();
    await tableSearch.fill('Standing Light Punch');

    // Expand the Standing Light Punch row
    const row = frameTable.locator('.clickable-row:has-text("Standing Light Punch")');
    await expect(row).toBeVisible();
    await row.click();
    await expect(row).toHaveClass(/expanded/);

    // Get the expanded details row
    const detailsRow = frameTable.locator('.frame-details-tr').first();
    await expect(detailsRow).toBeVisible();

    // Check that the action frame and hitbox images are loaded
    const actionImg = detailsRow.locator('.title-action + .move-image-wrapper img');
    const hitboxImg = detailsRow.locator('.title-hitbox + .move-image-wrapper img');

    await expect(actionImg).toBeVisible();
    await expect(hitboxImg).toBeVisible();

    // Verify image sources point to ultimateframedata.com gifs
    const actionSrc = await actionImg.getAttribute('src');
    const hitboxSrc = await hitboxImg.getAttribute('src');

    console.log('Action Frame Src:', actionSrc);
    console.log('Hitbox Frame Src:', hitboxSrc);

    expect(actionSrc).toContain('ultimateframedata.com/sf6/hitboxes/');
    expect(actionSrc).toContain('.gif');

    expect(hitboxSrc).toContain('ultimateframedata.com/sf6/hitboxes/');
    expect(hitboxSrc).toContain('.gif');
  });
});
