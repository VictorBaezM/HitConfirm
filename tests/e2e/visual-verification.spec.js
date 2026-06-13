const { test, expect } = require('@playwright/test');
const path = require('path');

test('capture resolved portraits screenshots', async ({ page }) => {
  const screenshotsDir = 'C:\\Users\\Omen\\.gemini\\antigravity\\brain\\39ffb453-30e3-41fc-a88d-b6453c643059';

  // 1. Open home page
  await page.goto('http://localhost:5000/');
  
  // 2. Click on Strategy Hub link in sidebar
  const hubLink = page.locator('.nav-link[data-page="hub"]');
  await expect(hubLink).toBeVisible();
  await hubLink.click();
  
  // Wait for loading overlay to disappear
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  
  // Wait for at least one character card to be visible
  await expect(page.locator('.character-card').first()).toBeVisible({ timeout: 10000 });

  // ----------------------------------------------------
  // Capture Tekken 8 portraits
  // ----------------------------------------------------
  const t8Chip = page.locator('.btn-chip[data-filter="t8"]');
  await expect(t8Chip).toBeVisible();
  await t8Chip.click();
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  
  // Wait a short moment for images to load
  await page.waitForTimeout(2000);
  
  // Take screenshot of the Tekken 8 character select grid
  const t8Grid = page.locator('#section-t8');
  await t8Grid.screenshot({ path: path.join(screenshotsDir, 't8_portraits_resolved.png') });
  console.log('Successfully captured t8_portraits_resolved.png');

  // ----------------------------------------------------
  // Capture Street Fighter 6 portraits
  // ----------------------------------------------------
  const sf6Chip = page.locator('.btn-chip[data-filter="sf6"]');
  await expect(sf6Chip).toBeVisible();
  await sf6Chip.click();
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const sf6Grid = page.locator('#section-sf6');
  await sf6Grid.screenshot({ path: path.join(screenshotsDir, 'sf6_portraits_resolved.png') });
  console.log('Successfully captured sf6_portraits_resolved.png');

  // ----------------------------------------------------
  // Capture Smash Ultimate portraits
  // ----------------------------------------------------
  const ssbuChip = page.locator('.btn-chip[data-filter="ssbu"]');
  await expect(ssbuChip).toBeVisible();
  await ssbuChip.click();
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const ssbuGrid = page.locator('#section-ssbu');
  await ssbuGrid.screenshot({ path: path.join(screenshotsDir, 'ssbu_portraits_resolved.png') });
  console.log('Successfully captured ssbu_portraits_resolved.png');

  // ----------------------------------------------------
  // Capture Guilty Gear Strive portraits
  // ----------------------------------------------------
  const ggstChip = page.locator('.btn-chip[data-filter="ggst"]');
  await expect(ggstChip).toBeVisible();
  await ggstChip.click();
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const ggstGrid = page.locator('#section-ggst');
  await ggstGrid.screenshot({ path: path.join(screenshotsDir, 'ggst_portraits_resolved.png') });
  console.log('Successfully captured ggst_portraits_resolved.png');
});
