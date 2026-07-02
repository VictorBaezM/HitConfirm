const { test, expect } = require('@playwright/test');
const path = require('path');

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

test.describe('HitConfirm SPA Page Routing', () => {
  test.beforeEach(async ({ page }) => {
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

    // Collect console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`PAGE CONSOLE ERROR: ${msg.text()}`);
      }
    });
  });

  test('can navigate to all pages', async ({ page }) => {
    // 1. Visit root page (Feed)
    await page.goto('/');
    await expect(page.locator('#timeline-list')).toBeVisible();

    // 2. Click Dojo link
    await page.click('.nav-link[data-page="combos"]');
    await expect(page.locator('#dojo-game-filter')).toBeVisible();
    await expect(page.locator('h1:has-text("Dojo")')).toBeVisible();

    // 3. Click Builder link
    await page.click('.nav-link[data-page="builder"]');
    await expect(page.locator('#builder-game-select')).toBeVisible();

    // 4. Click Strategy Hub link
    await page.click('.nav-link[data-page="hub"]');
    await expect(page.locator('h1.hub-title:has-text("Strategy Hub")')).toBeVisible();

    // 5. Click My Dojo link (without login should show locker room page)
    await page.click('.nav-link[data-page="profile"]');
    await expect(page.locator('h2:has-text("Dojo Locker Room")')).toBeVisible();
  });

  test('should support collapsing and expanding the left navigation sidebar', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.locator('.wiki-left-nav');
    const appContainer = page.locator('#app-container');
    const toggleBtn = page.locator('#nav-toggle-sidebar');
    
    // Initial state: expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(appContainer).not.toHaveClass(/sidebar-collapsed/);
    
    // Click toggle button to collapse
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);
    await expect(appContainer).toHaveClass(/sidebar-collapsed/);
    
    // Click toggle button again to expand
    await toggleBtn.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(appContainer).not.toHaveClass(/sidebar-collapsed/);
  });

  test('should display FGC-themed 404 page on invalid route and support back navigation', async ({ page }) => {
    // 1. Navigate to an invalid path
    await page.goto('/invalid-route-name');
    
    // 2. Expect 404 page header
    await expect(page.locator('h1:has-text("Round Lost")')).toBeVisible();
    await expect(page.locator('h2:has-text("404 - Page Not Found")')).toBeVisible();
    
    // 3. Click back to Feed button
    const btn = page.locator('#btn-404-home');
    await expect(btn).toBeVisible();
    await btn.click();
    
    // 4. Expect to be back on the Feed page
    await expect(page.locator('#timeline-list')).toBeVisible();
    expect(page.url()).toContain('/feed');
  });
});
