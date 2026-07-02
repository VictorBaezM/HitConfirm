const { test, expect } = require('@playwright/test');
const path = require('path');
const os = require('os');

async function injectMockSupabase(page) {
  // Mock the supabase JS module to prevent remote database dependencies
  await page.route('**/src/js/supabase.js', route => {
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        const MOCKED_GAMES = [
          { id: 'sf6', name: 'Street Fighter 6', characters: ['A.K.I.', 'Akuma', 'Blanka', 'Cammy', 'Chun-Li', 'Dee Jay', 'Dhalsim', 'E. Honda', 'Ed', 'Elena', 'Guile', 'Jamie', 'JP', 'Juri', 'Ken', 'Kimberly', 'Lily', 'Luke', 'M. Bison', 'Mai', 'Marisa', 'Rashid', 'Ryu', 'Terry', 'Zangief'], notation_type: 'sf' },
          { id: 't8', name: 'Tekken 8', characters: ['Alisa', 'Asuka', 'Azucena', 'Claudio', 'Devil Jin', 'Dragunov', 'Eddy', 'Feng', 'Heihachi', 'Hwoarang', 'Jack-8', 'Jin', 'Jun', 'Kazuya', 'King', 'Kuma', 'Lars', 'Law', 'Lee', 'Leo', 'Leroy', 'Lidia', 'Lili', 'Nina', 'Panda', 'Paul', 'Raven', 'Reina', 'Shaheen', 'Steve', 'Victor', 'Xiaoyu', 'Yoshimitsu', 'Zafina'], notation_type: 'tekken' },
          { id: 'ggst', name: 'Guilty Gear -Strive-', characters: ['A.B.A', 'Anji Mito', 'Asuka R#', 'Axl Low', 'Baiken', 'Bedman?', 'Bridget', 'Chipp Zanuff', 'Elphelt Valentine', 'Faust', 'Giovanna', 'Goldlewis Dickinson', 'Happy Chaos', 'I-No', 'Jack-O', 'Jam Kuradoberi', 'Johnny', 'Ky Kiske', 'Leo Whitefang', 'Lucy', 'May', 'Millia Rage', 'Nagoriyuki', 'Potemkin', 'Queen Dizzy', 'Ramlethal Valentine', 'Sin Kiske', 'Slayer', 'Sol Badguy', 'Testament', 'Unika', 'Venom', 'Zato-1'], notation_type: 'gg' }
        ];

        export const supabase = {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          },
          from: (table) => {
            const builder = {
              select: () => builder,
              order: () => builder,
              eq: () => builder,
              single: () => builder,
              insert: () => builder,
              update: () => builder,
              upsert: () => builder,
              then: (resolve) => {
                let data = [];
                if (table === 'games') {
                  data = MOCKED_GAMES;
                } else if (table === 'users') {
                  data = [];
                }
                resolve({ data, error: null, count: Array.isArray(data) ? data.length : 1 });
              }
            };
            return builder;
          }
        };
        export default supabase;
      `
    });
  });
}

test('capture resolved portraits screenshots', async ({ page }) => {
  test.setTimeout(60000);
  const screenshotsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', 'c6a9b5c4-7b23-4696-9577-526face9a2f1');

  // Inject mock Supabase
  await injectMockSupabase(page);

  // Mock image requests to prevent external CDN/wiki calls
  await page.route('**/*', function (route) {
    const request = route.request();
    if (request.resourceType() === 'image' && /(fandom|ultimateframedata|dustloop|wavu|streetfighter|tekken|ssbwiki)/.test(request.url())) {
      route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
      });
    } else {
      route.continue();
    }
  });

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
  const t8Chip = page.locator('#sidebar-game-t8');
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
  const sf6Chip = page.locator('#sidebar-game-sf6');
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
  const ssbuChip = page.locator('#sidebar-game-ssbu');
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
  const ggstChip = page.locator('#sidebar-game-ggst');
  await expect(ggstChip).toBeVisible();
  await ggstChip.click();
  await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const ggstGrid = page.locator('#section-ggst');
  await ggstGrid.screenshot({ path: path.join(screenshotsDir, 'ggst_portraits_resolved.png') });
  console.log('Successfully captured ggst_portraits_resolved.png');
});
