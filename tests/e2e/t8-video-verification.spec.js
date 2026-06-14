const { test, expect } = require('@playwright/test');

test.describe('Tekken 8 Video E2E Verification', () => {
  test('should load wavu.wiki videos and canvas frame for Kazuya', async ({ page }) => {
    // Go to home page
    await page.goto('/');

    // Navigate to Strategy Hub
    const hubLink = page.locator('.nav-link[data-page="hub"]');
    await expect(hubLink).toBeVisible();
    await hubLink.click();

    // Click on Kazuya card under Tekken 8
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
    
    const t8Chip = page.locator('.btn-chip[data-filter="t8"]');
    await expect(t8Chip).toBeVisible();
    await t8Chip.click();
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    const kazuyaCard = page.locator('.character-card:has-text("Kazuya")');
    await expect(kazuyaCard).toBeVisible();
    await kazuyaCard.click();

    // Verify character page header
    await expect(page.locator('.character-header h1')).toHaveText('Kazuya');

    // Wait for frame data table to load
    const frameTable = page.locator('#data-table-el');
    await expect(frameTable).toBeVisible();

    // Expand the first move row
    const firstMoveRow = frameTable.locator('.clickable-row').first();
    await expect(firstMoveRow).toBeVisible();
    await firstMoveRow.click();
    await expect(firstMoveRow).toHaveClass(/expanded/);

    // Get the expanded details row
    const detailsRow = frameTable.locator('.frame-details-tr').first();
    await expect(detailsRow).toBeVisible();

    // Under Hitbox / Hurtbox, we expect a video element
    const hitboxVideo = detailsRow.locator('.title-hitbox + .move-image-wrapper video');
    await expect(hitboxVideo).toBeVisible({ timeout: 5000 });

    const hitboxSrc = await hitboxVideo.getAttribute('src');
    console.log('Hitbox Video Src:', hitboxSrc);
    expect(hitboxSrc).toContain('.mp4');

    // Under Action Frame, we expect either a canvas or a fallback video/image
    const actionWrapper = detailsRow.locator('#action-video-container-0'); // wait, the ID is action-video-container-${index}
    await expect(actionWrapper).toBeVisible();

    // Give it a moment to run the canvas extraction or fallback
    await page.waitForTimeout(2000);

    const canvas = actionWrapper.locator('canvas');
    const video = actionWrapper.locator('video');
    const img = actionWrapper.locator('img');

    // Assert that at least one of these is rendered inside the wrapper
    const hasCanvas = await canvas.count() > 0;
    const hasVideo = await video.count() > 0;
    const hasImg = await img.count() > 0;

    console.log(`Action frame elements status -> Canvas: ${hasCanvas}, Video: ${hasVideo}, Img: ${hasImg}`);
    expect(hasCanvas || hasVideo || hasImg).toBe(true);
  });
});
