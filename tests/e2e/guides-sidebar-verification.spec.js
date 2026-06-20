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
              update: () => builder,
              insert: () => builder,
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
                      title: 'GGST Sol Guide',
                      author: 'SolManiac',
                      content: 'Sol guide details',
                      upvotes: 10,
                      upvoted_by: [],
                      created_at: '2026-06-01T00:00:00Z'
                    },
                    {
                      id: 's_sf6',
                      game: 'sf6',
                      character: 'Ryu',
                      title: 'SF6 Ryu Guide',
                      author: 'DaigoFan',
                      content: 'Ryu guide details',
                      upvotes: 20,
                      upvoted_by: [],
                      created_at: '2026-06-02T00:00:00Z'
                    },
                    {
                      id: 's_t8',
                      game: 't8',
                      character: 'Kazuya',
                      title: 'T8 Kazuya Guide',
                      author: 'TekkenGod',
                      content: 'Kazuya guide details',
                      upvotes: 30,
                      upvoted_by: [],
                      created_at: '2026-06-03T00:00:00Z'
                    }
                  ];
                }
                resolve({ data, error: null, count: data.length });
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

test.describe('Guides Page Sidebar Integration', () => {
  test('should display left game sidebar and correctly filter guides, without showing horizontal chips', async ({ page }) => {
    // 1. Mock Supabase
    await injectMockSupabase(page);

    // 2. Visit root and navigate to Guides
    await page.goto('/');
    await page.click('.nav-link[data-page="strategy"]');
    
    // 3. Verify Guides page is visible and layout has-game-sidebar is set
    await expect(page.locator('h1:has-text("Guides")')).toBeVisible();
    await expect(page.locator('#content-mount')).toHaveClass(/has-game-sidebar/);
    
    // 4. Verify left game sidebar is visible, and the horizontal chips bar is gone
    await expect(page.locator('#game-sidebar-mount')).toBeVisible();
    await expect(page.locator('#strategy-game-chips')).not.toBeVisible();
    
    // 5. By default (logged out), active game should be GGST (Guilty Gear -Strive-)
    const ggstTab = page.locator('#sidebar-game-ggst');
    await expect(ggstTab).toHaveClass(/active/);
    
    // 6. Verify GGST guide is visible, but others are not
    const ggstBadge = page.locator('.strategy-guide-item .badge-ggst').first();
    await expect(ggstBadge).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("GGST Sol Guide")')).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("SF6 Ryu Guide")')).not.toBeVisible();
    
    // 7. Click on Street Fighter 6 in the sidebar
    const sf6Tab = page.locator('#sidebar-game-sf6');
    await sf6Tab.click();
    
    // 8. Verify SF6 is active and directory displays SF6 guide
    await expect(sf6Tab).toHaveClass(/active/);
    await expect(ggstTab).not.toHaveClass(/active/);
    
    const sf6Badge = page.locator('.strategy-guide-item .badge-sf6').first();
    await expect(sf6Badge).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("SF6 Ryu Guide")')).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("GGST Sol Guide")')).not.toBeVisible();
    
    // 9. Click on Tekken 8 in the sidebar
    const t8Tab = page.locator('#sidebar-game-t8');
    await t8Tab.click();
    
    // 10. Verify T8 is active and directory displays T8 guide
    await expect(t8Tab).toHaveClass(/active/);
    await expect(sf6Tab).not.toHaveClass(/active/);
    
    const newT8Badge = page.locator('.strategy-guide-item .badge-t8').first();
    await expect(newT8Badge).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("T8 Kazuya Guide")')).toBeVisible();
    await expect(page.locator('.strategy-guide-item:has-text("SF6 Ryu Guide")')).not.toBeVisible();
    
    // 11. Capture visual verification screenshot
    const screenshotsDir = 'C:/Users/Omen/.gemini/antigravity/brain/39ffb453-30e3-41fc-a88d-b6453c643059/scratch';
    await page.screenshot({ path: path.join(screenshotsDir, 'guides_sidebar_page.png') });
    console.log('Successfully captured guides_sidebar_page.png');
  });

  test('should default to user main game when logged in', async ({ page }) => {
    // 1. Mock Supabase
    await injectMockSupabase(page);

    // 2. Inject a fake logged-in user whose mainGame is 't8'
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
    
    // 3. Load Guides page
    await page.goto('/');
    await page.click('.nav-link[data-page="strategy"]');
    
    // 4. Verify that Tekken 8 tab is active by default in the sidebar
    const t8Tab = page.locator('#sidebar-game-t8');
    await expect(t8Tab).toHaveClass(/active/);
    
    // Verify GGST is not active by default
    const ggstTab = page.locator('#sidebar-game-ggst');
    await expect(ggstTab).not.toHaveClass(/active/);
  });
});
