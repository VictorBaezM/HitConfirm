const { test, expect } = require('@playwright/test');
const path = require('path');

test('verify ABA Bonding and Dissolving AIR OK badge and capture screenshot', async ({ page }) => {
  test.setTimeout(45000);
  const screenshotsDir = 'C:\\Users\\Omen\\Desktop\\GitHub\\HitConfirm';

  // 1. Open home page
  await page.goto('http://localhost:5000/');
  
  // 2. Click on Strategy Hub link in sidebar
  const hubLink = page.locator('.nav-link[data-page="hub"]');
  await expect(hubLink).toBeVisible();
  await hubLink.click();
  
  // 3. Wait for Strategy Hub loading overlay to hide
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

  // 4. Click on A.B.A character card
  const abaCard = page.locator('.character-card:has-text("A.B.A")').first();
  await expect(abaCard).toBeVisible();
  await abaCard.click();
  
  // 5. Wait for A.B.A frame data table to load
  const table = page.locator('#data-table-el');
  await expect(table).toBeVisible({ timeout: 20000 });

  // 6. Find the row for "Bonding and Dissolving"
  const row = table.locator('tr.frame-data-tr', { hasText: 'Bonding and Dissolving' }).first();
  await expect(row).toBeVisible();

  // 7. Assert that it contains the "AIR OK" badge
  const badge = row.locator('.combo-descriptor', { hasText: 'AIR OK' }).first();
  await expect(badge).toBeVisible();

  // 8. Capture a screenshot of the specific row and save it in the workspace
  await row.screenshot({ path: path.join(screenshotsDir, 'aba_air_ok_verification.png') });
  console.log('Successfully captured aba_air_ok_verification.png');
});
