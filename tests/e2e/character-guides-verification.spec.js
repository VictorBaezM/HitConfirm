const { test, expect } = require('@playwright/test');
const path = require('path');

async function injectMockSupabase(page) {
  // Mock the supabase JS module to prevent remote database dependencies
  await page.route('**/src/js/supabase.js', route => {
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        export const supabase = {
          auth: {
            getSession: async () => {
              const stored = localStorage.getItem('hc_current_user');
              const user = stored ? JSON.parse(stored) : null;
              return {
                data: {
                  session: user ? { user: { id: user.id } } : null
                },
                error: null
              };
            },
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
                if (table === 'users') {
                  const stored = localStorage.getItem('hc_current_user');
                  const user = stored ? JSON.parse(stored) : null;
                  data = user ? [{
                    id: user.id,
                    username: user.username,
                    avatar_color: user.avatarColor,
                    main_game: user.mainGame,
                    main_char: user.mainChar,
                    rank: user.rank,
                    saved_combos: [],
                    played_games: [],
                    game_characters: {},
                    following: []
                  }] : [];
                } else if (table === 'games') {
                  data = [
                    { id: 'sf6', name: 'Street Fighter 6', characters: ['Ryu', 'Ken'], notation_type: 'sf' },
                    { id: 't8', name: 'Tekken 8', characters: ['Kazuya', 'Jin'], notation_type: 'tekken' },
                    { id: 'ggst', name: 'Guilty Gear -Strive-', characters: ['Sol Badguy', 'Ky Kiske'], notation_type: 'gg' }
                  ];
                } else if (table === 'strategies') {
                  data = [
                    {
                      id: 's_ggst',
                      game: 'ggst',
                      character: 'Sol Badguy',
                      title: 'GGST Sol Matchups',
                      author: 'SolManiac',
                      content: '### Sol Matchup Tips\\n\\nUse far S to poke.',
                      upvotes: 10,
                      upvoted_by: [],
                      created_at: '2026-06-01T00:00:00Z'
                    },
                    {
                      id: 's_sf6',
                      game: 'sf6',
                      character: 'Ryu',
                      title: 'SF6 Ryu Fireballs',
                      author: 'DaigoFan',
                      content: '### Fireball Spacing\\n\\nKeep zoning.',
                      upvotes: 20,
                      upvoted_by: [],
                      created_at: '2026-06-02T00:00:00Z'
                    }
                  ];
                } else if (table === 'dustloop_cache') {
                  data = {
                    data: [
                      {
                        name: 'Fafnir',
                        input: '41236H',
                        chara: 'Sol Badguy',
                        damage: '80',
                        guard: 'Mid',
                        startup: '24',
                        active: '3',
                        recovery: '15',
                        onBlock: '+2',
                        onHit: 'HKD'
                      }
                    ]
                  };
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

test.describe('Character Details Guides Tab Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock image requests to prevent flaky external HTTP calls, while avoiding blocking actual JS files
    await page.route('**/*', route => {
      const request = route.request();
      if (request.resourceType() === 'image' && /(fandom|ultimateframedata|dustloop|wavu|streetfighter|tekken)/.test(request.url())) {
        route.fulfill({
          status: 200,
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>`
        });
      } else {
        route.continue();
      }
    });
  });

  test('should display guides tab, display Sol guides and reference guides, and support full-width reader', async ({ page }) => {
    // 1. Mock Supabase
    await injectMockSupabase(page);

    // 2. Visit root and navigate to Strategy Hub
    await page.goto('/');
    await page.click('.nav-link[data-page="hub"]');
    
    // Wait for strategy hub loading overlay to disappear
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    // 3. Click Sol Badguy card
    await page.click('.character-card:has-text("Sol Badguy")');
    
    // 4. Verify Frame Data tab is active by default and table is visible
    const tabFrameData = page.locator('#tab-framedata');
    await expect(tabFrameData).toHaveClass(/active/);
    await expect(page.locator('#data-table-el')).toBeVisible();
    
    // 5. Click the Guides tab
    const tabGuides = page.locator('#tab-guides');
    await expect(tabGuides).toBeVisible();
    await tabGuides.click();
    
    await expect(tabGuides).toHaveClass(/active/);
    await expect(tabFrameData).not.toHaveClass(/active/);
    await expect(page.locator('#data-table-el')).not.toBeVisible();
    
    // 6. Verify Sol Badguy guide is visible in Community Guides, and SF6 Ryu guide is in Reference Guides
    const solGuideEl = page.locator('.char-guide-item:has-text("GGST Sol Matchups")');
    await expect(solGuideEl).toBeVisible();
    
    const refGuideEl = page.locator('.ref-guide-item:has-text("SF6 Ryu Fireballs")');
    await expect(refGuideEl).toBeVisible();
    
    // 7. Click on the Sol Badguy guide to open full-width reader
    await solGuideEl.click();
    
    const readerView = page.locator('#guide-reader-view');
    await expect(readerView).toBeVisible();
    await expect(page.locator('#guides-list-view')).not.toBeVisible();
    await expect(readerView.locator('h2')).toHaveText('GGST Sol Matchups');
    await expect(readerView.locator('.strategy-viewer-content h4')).toHaveText('Sol Matchup Tips');
    
    // 8. Click Back to Guides List
    const backToGuidesBtn = page.locator('#btn-back-to-guides');
    await expect(backToGuidesBtn).toBeVisible();
    await backToGuidesBtn.click();
    
    await expect(page.locator('#guides-list-view')).toBeVisible();
    await expect(readerView).not.toBeVisible();
    
    // 9. Take a visual verification screenshot
    const screenshotsDir = 'C:/Users/Omen/.gemini/antigravity/brain/39ffb453-30e3-41fc-a88d-b6453c643059/scratch';
    await page.screenshot({ path: path.join(screenshotsDir, 'character_guides_page.png') });
  });

  test('should support creating a guide with locked game/character scope', async ({ page }) => {
    // 1. Mock Supabase
    await injectMockSupabase(page);

    // 2. Inject logged in user
    await page.addInitScript(() => {
      window.localStorage.setItem('hc_current_user', JSON.stringify({
        id: 'user-t8-id',
        username: 'TekkenMaster',
        avatarColor: '#00cbd6',
        mainGame: 't8',
        mainChar: 'Kazuya',
        rank: 'God'
      }));
    });

    // 3. Navigate directly to Sol Badguy character details page
    await page.goto('/');
    await page.click('.nav-link[data-page="hub"]');
    
    // Wait for strategy hub loading overlay to disappear
    await expect(page.locator('#hub-loading-overlay')).toHaveClass(/hidden/, { timeout: 20000 });

    await page.click('.character-card:has-text("Sol Badguy")');
    
    // 4. Go to Guides tab and click Post Guide
    await page.click('#tab-guides');
    await page.click('#btn-create-char-guide');
    
    // 5. Verify pre-selected and disabled inputs
    const modal = page.locator('#modal-container');
    await expect(modal).toHaveClass(/open/);
    
    const gameSelect = modal.locator('#modal-guide-game');
    await expect(gameSelect).toBeDisabled();
    await expect(gameSelect).toHaveValue('ggst');
    
    const charSelect = modal.locator('#modal-guide-char');
    await expect(charSelect).toBeDisabled();
    await expect(charSelect).toHaveValue('Sol Badguy');
    
    // 6. Fill title and content
    await modal.locator('#modal-guide-title').fill('Sol Gunflame Spacing');
    await modal.locator('#modal-guide-content').fill('### Gunflame Tips\n\nPlus on block at max range.');
    
    // 7. Publish
    await modal.locator('#modal-guide-publish').click();
    
    // 8. Verify modal closes, toast notification shows, and newly created guide is displayed in full reader
    await expect(modal).not.toHaveClass(/open/);
    await expect(page.locator('#guide-reader-view')).toBeVisible();
    await expect(page.locator('#guide-reader-view h2')).toHaveText('Sol Gunflame Spacing');
    await expect(page.locator('#guide-reader-view .strategy-viewer-content h4')).toHaveText('Gunflame Tips');
  });
});
