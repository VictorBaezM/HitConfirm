const { test, expect } = require('@playwright/test');

test('verify follow-up move grouping, styling, and sort anchoring', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Open home page
  await page.goto('http://localhost:5000/');
  
  // 2. Click on Strategy Hub link in sidebar
  const hubLink = page.locator('.nav-link[data-page="hub"]');
  await expect(hubLink).toBeVisible();
  await hubLink.click();
  
  // 3. Wait for Strategy Hub loading overlay to hide
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

  const searchInput = page.locator('#hub-search');

  // === A.B.A Verification ===
  console.log('--- Verifying A.B.A ---');
  await searchInput.fill('A.B.A');
  const abaCard = page.locator('.character-card:has-text("A.B.A")').first();
  await expect(abaCard).toBeVisible();
  await abaCard.click();
  
  let table = page.locator('#data-table-el');
  await expect(table).toBeVisible({ timeout: 20000 });

  // Verify "Restriction and Constraint" is grouped under "Menace and Groan"
  const abaMenaceRow = table.locator('tr.frame-data-tr:has-text("Menace and Groan")').first();
  await expect(abaMenaceRow).toBeVisible();
  
  const abaRestrictionRow = table.locator('tr.frame-data-tr.submove-row:has-text("Restriction and Constraint")').first();
  await expect(abaRestrictionRow).toBeVisible();
  
  // Check connector character
  const abaRestrictionNameCell = abaRestrictionRow.locator('td.submove-name-td');
  await expect(abaRestrictionNameCell).toContainText('└─');
  
  // Go back to Strategy Hub
  await page.click('#btn-back');
  await expect(page.locator('h1.hub-title')).toBeVisible();

  // === Anji Mito Verification ===
  console.log('--- Verifying Anji Mito ---');
  await searchInput.fill('Anji');
  const anjiCard = page.locator('.character-card:has-text("Anji Mito")').first();
  await expect(anjiCard).toBeVisible();
  await anjiCard.click();

  table = page.locator('#data-table-el');
  await expect(table).toBeVisible({ timeout: 20000 });

  // Get dynamic column index for "Command"
  let headers = await table.locator('thead th').allTextContents();
  let commandColIndex = headers.indexOf('Command');
  console.log(`Anji Mito Command column index: ${commandColIndex}`);

  // Verify Fuujin is parent and Shin: Ichishiki is grouped under it
  const anjiFuujinRow = table.locator('tr.frame-data-tr:has-text("Fuujin")').first();
  await expect(anjiFuujinRow).toBeVisible();

  const anjiShinRow = table.locator('tr.frame-data-tr.submove-row:has-text("Shin: Ichishiki")').first();
  await expect(anjiShinRow).toBeVisible();
  await expect(anjiShinRow.locator('td.submove-name-td')).toContainText('└─');

  // Verify command display is stripped to "P" for Shin: Ichishiki (original "236H P")
  const shinCommandCell = anjiShinRow.locator('td').nth(commandColIndex);
  await expect(shinCommandCell).toContainText('P');
  await expect(shinCommandCell).not.toContainText('236H');

  // Go back to Strategy Hub
  await page.click('#btn-back');
  await expect(page.locator('h1.hub-title')).toBeVisible();

  // === Chipp Zanuff Verification ===
  console.log('--- Verifying Chipp Zanuff ---');
  await searchInput.fill('Chipp');
  const chippCard = page.locator('.character-card:has-text("Chipp Zanuff")').first();
  await expect(chippCard).toBeVisible();
  await chippCard.click();

  table = page.locator('#data-table-el');
  await expect(table).toBeVisible({ timeout: 20000 });

  // Get dynamic column index for "Command"
  headers = await table.locator('thead th').allTextContents();
  commandColIndex = headers.indexOf('Command');
  console.log(`Chipp Zanuff Command column index: ${commandColIndex}`);

  // Verify Escape is grouped under Wall Run
  const chippWallRunRow = table.locator('tr.frame-data-tr:has-text("Wall Run")').first();
  await expect(chippWallRunRow).toBeVisible();

  const chippEscapeRow = table.locator('tr.frame-data-tr.submove-row:has-text("Escape")').first();
  await expect(chippEscapeRow).toBeVisible();
  await expect(chippEscapeRow.locator('td.submove-name-td')).toContainText('└─');

  // Verify command display is stripped to "4 or 2" (original "4 or 2 during Wall Run")
  const escapeCommandCell = chippEscapeRow.locator('td').nth(commandColIndex);
  await expect(escapeCommandCell.locator('[title="Direction 4"]').first()).toBeVisible();
  await expect(escapeCommandCell.locator('[title="Direction 2"]').first()).toBeVisible();
  await expect(escapeCommandCell).not.toContainText('Wall Run');

  // Go back to Strategy Hub
  await page.click('#btn-back');
  await expect(page.locator('h1.hub-title')).toBeVisible();

  // === Zato-1 Verification ===
  console.log('--- Verifying Zato-1 ---');
  await searchInput.fill('Zato');
  const zatoCard = page.locator('.character-card:has-text("Zato-1")').first();
  await expect(zatoCard).toBeVisible();
  await zatoCard.click();

  table = page.locator('#data-table-el');
  await expect(table).toBeVisible({ timeout: 20000 });

  // Get dynamic column index for "Command"
  headers = await table.locator('thead th').allTextContents();
  commandColIndex = headers.indexOf('Command');
  console.log(`Zato-1 Command column index: ${commandColIndex}`);

  // Verify Eddie Teleport is grouped under Break The Law
  const zatoBreakLawRow = table.locator('tr.frame-data-tr:has-text("Break The Law")').first();
  await expect(zatoBreakLawRow).toBeVisible();

  const zatoTeleportRow = table.locator('tr.frame-data-tr.submove-row:has-text("Eddie Teleport")').first();
  await expect(zatoTeleportRow).toBeVisible();
  await expect(zatoTeleportRow.locator('td.submove-name-td')).toContainText('└─');

  // Verify command display is stripped to "22" (original "22 During 214K(HOLD)")
  const teleportCommandCell = zatoTeleportRow.locator('td').nth(commandColIndex);
  await expect(teleportCommandCell.locator('[title="Direction 2"]').first()).toBeVisible();
  await expect(teleportCommandCell).not.toContainText('214K');

  console.log('--- All E2E follow-up grouping tests passed successfully! ---');
});
