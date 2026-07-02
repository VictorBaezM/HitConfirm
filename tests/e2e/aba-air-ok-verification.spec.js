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

test('verify ABA Bonding and Dissolving AIR OK badge and capture screenshot', async ({ page }) => {
  test.setTimeout(45000);
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
