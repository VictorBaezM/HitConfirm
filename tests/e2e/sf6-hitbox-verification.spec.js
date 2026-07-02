const { test, expect } = require('@playwright/test');

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

test.describe('Street Fighter 6 Hitbox E2E Verification', () => {
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
  });

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

    // Search for Ryu to bring him to the first page of paginated results
    const searchInput = page.locator('#hub-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Ryu');

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
