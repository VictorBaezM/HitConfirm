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

test.describe('Tekken 8 Video E2E Verification', () => {
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

  test('should load wavu.wiki videos and canvas frame for Kazuya', async ({ page }) => {
    // Go to home page
    await page.goto('/');

    // Navigate to Strategy Hub
    const hubLink = page.locator('.nav-link[data-page="hub"]');
    await expect(hubLink).toBeVisible();
    await hubLink.click();

    // Click on Kazuya card under Tekken 8
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });
    
    const t8Chip = page.locator('#sidebar-game-t8');
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
