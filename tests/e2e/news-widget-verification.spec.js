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

test('verify game news widget on feed page', async ({ page }) => {
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
  await page.goto('http://localhost:5000/');
  
  // 1. Verify Dojo Challenge widget is NOT present
  await expect(page.locator('#sidebar-go-builder')).not.toBeVisible();
  
  // 2. Verify Game News widget is present
  const newsCard = page.locator('#sidebar-game-news-card');
  await expect(newsCard).toBeVisible();
  
  // Wait for news items to load (dynamic or fallback)
  const newsList = page.locator('#sidebar-game-news-list');
  await expect(newsList).toBeVisible();
  
  // Wait for the loader to disappear/news items to populate
  await page.waitForSelector('.wiki-news-game-item', { timeout: 10000 });
  
  // 3. Verify specific games are present in the list
  const sf6Item = page.locator('.wiki-news-game-item:has-text("Street Fighter 6")');
  await expect(sf6Item).toBeVisible();
  
  const t8Item = page.locator('.wiki-news-game-item:has-text("Tekken 8")');
  await expect(t8Item).toBeVisible();
  
  const ssbuItem = page.locator('.wiki-news-game-item:has-text("Super Smash Bros. Ultimate")');
  await expect(ssbuItem).toBeVisible();
  
  // 4. Verify that dbfzce (Dragon Ball FighterZ Community Edition) is NOT present
  const dbfzceItem = page.locator('.wiki-news-game-item:has-text("Dragon Ball FighterZ (CE)")');
  await expect(dbfzceItem).not.toBeVisible();
  
  // 5. Verify that links are secure (target="_blank" and rel="noopener noreferrer")
  const firstLink = page.locator('.wiki-news-article a').first();
  await expect(firstLink).toHaveAttribute('target', '_blank');
  await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
  const href = await firstLink.getAttribute('href');
  expect(href).toMatch(/^https:\/\//); // Secure HTTPS link
  
  // 6. Capture a screenshot of the news widget for visual verification
  const screenshotsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', 'c6a9b5c4-7b23-4696-9577-526face9a2f1');
  await newsCard.screenshot({ path: path.join(screenshotsDir, 'news_widget.png') });
  console.log('Successfully captured news_widget.png');
});
