const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('HitConfirm Console Audit', () => {
  const warnings = [];
  const errors = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      const entry = {
        type,
        text,
        url: location.url,
        lineNumber: location.lineNumber,
        columnNumber: location.columnNumber
      };
      if (type === 'warning' || type === 'error') {
        if (type === 'error') {
          errors.push(entry);
        } else {
          warnings.push(entry);
        }
      }
    });
  });

  test.afterAll(async () => {
    const reportPath = path.join('C:', 'Users', 'Omen', '.gemini', 'antigravity', 'brain', '39ffb453-30e3-41fc-a88d-b6453c643059', 'console_audit_results.json');
    fs.writeFileSync(reportPath, JSON.stringify({ warnings, errors }, null, 2));
    console.log(`\nAudit completed: Saved ${warnings.length} warnings and ${errors.length} errors to ${reportPath}\n`);
  });

  test('audit console messages across application flows', async ({ page }) => {
    // 1. Visit Feed Page
    console.log('Auditing Feed page...');
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click Login/Register to trigger auth modal
    console.log('Auditing Auth modal...');
    const registerBtn = page.locator('.btn-profile-signup, #btn-toggle-auth-reg, .auth-toggle-link').first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForTimeout(1000);
      const cancelBtn = page.locator('#btn-auth-cancel').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }

    // 2. Visit Dojo Page
    console.log('Auditing Dojo page...');
    await page.click('.nav-link[data-page="combos"]');
    await page.waitForTimeout(2000);

    // 3. Visit Builder Page
    console.log('Auditing Builder page...');
    await page.click('.nav-link[data-page="builder"]');
    await page.waitForTimeout(2000);

    // 4. Visit Strategy Hub Page
    console.log('Auditing Strategy Hub...');
    await page.click('.nav-link[data-page="hub"]');
    await page.waitForTimeout(2000);

    // Search and select Ryu in SF6
    console.log('Auditing Character Details (Ryu)...');
    const sf6Chip = page.locator('.game-chip[data-game="sf6"]').first();
    if (await sf6Chip.isVisible()) {
      await sf6Chip.click();
      await page.waitForTimeout(1000);
      const ryuCard = page.locator('.character-card:has-text("Ryu")').first();
      if (await ryuCard.isVisible()) {
        await ryuCard.click();
        await page.waitForTimeout(3000);
        // Expand a move
        const moveRow = page.locator('.move-row-header').first();
        if (await moveRow.isVisible()) {
          await moveRow.click();
          await page.waitForTimeout(1000);
        }
        // Go to Guides tab
        const guidesTab = page.locator('.character-tab[data-tab="guides"]').first();
        if (await guidesTab.isVisible()) {
          await guidesTab.click();
          await page.waitForTimeout(1000);
          // Click "Post Guide" to open the creation modal
          const postGuideBtn = page.locator('#btn-create-guide-modal').first();
          if (await postGuideBtn.isVisible()) {
            await postGuideBtn.click();
            await page.waitForTimeout(1000);
            const cancelGuideBtn = page.locator('#modal-guide-cancel').first();
            if (await cancelGuideBtn.isVisible()) {
              await cancelGuideBtn.click();
            }
          }
        }
      }
    }

    // 5. Visit Profile Page
    console.log('Auditing Profile Locker Room...');
    await page.click('.nav-link[data-page="profile"]');
    await page.waitForTimeout(2000);
  });
});
