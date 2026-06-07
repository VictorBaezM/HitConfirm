// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests — Combo Builder Video Relevance Validation Feature
 *
 * Test Strategy (Strategic Feature Verification Tester — User Workflow tier):
 * Follows the same pattern as feed video-validation.spec.js:
 *   - localStorage injection simulates a logged-in user.
 *   - page.route() intercepts Twitch & YouTube oEmbed endpoints with controlled responses.
 *   - Intercepts Supabase responses for saving combos.
 */

const FAKE_USER = {
  id: 'test-user-e2e',
  username: 'TestPlayer',
  email: 'test@hitconfirm.test',
  avatarColor: '#3b82f6',
  mainGame: 'sf6',
  mainChar: 'Ryu',
  rank: 'Gold',
  following: [],
  followers: [],
  bio: '',
};

async function injectFakeUserAndMockSupabase(page) {
  // Mock the supabase JS module to return fake session and prevent remote queries
  await page.route('**/src/js/supabase.js', route => {
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        export const supabase = {
          auth: {
            getSession: async () => ({
              data: {
                session: {
                  user: { id: 'test-user-e2e', email: 'test@hitconfirm.test' }
                }
              },
              error: null
            }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          },
          from: (table) => {
            const builder = {
              select: () => builder,
              order: () => builder,
              eq: () => builder,
              update: () => builder,
              insert: () => builder,
              then: (resolve) => {
                let data = [];
                if (table === 'users') {
                  data = [{
                    id: 'test-user-e2e',
                    username: 'TestPlayer',
                    avatar_color: '#3b82f6',
                    main_game: 'sf6',
                    main_char: 'Ryu',
                    rank: 'Gold',
                    saved_combos: [],
                    played_games: [],
                    game_characters: {},
                    following: []
                  }];
                } else if (table === 'games') {
                  data = [
                    {
                      id: 'sf6',
                      name: 'Street Fighter 6',
                      characters: ['A.K.I.', 'Akuma', 'Blanka', 'Cammy', 'Chun-Li', 'Dee Jay', 'Dhalsim', 'E. Honda', 'Ed', 'Elena', 'Guile', 'Jamie', 'JP', 'Juri', 'Ken', 'Kimberly', 'Lily', 'Luke', 'M. Bison', 'Mai', 'Marisa', 'Rashid', 'Ryu', 'Terry', 'Zangief'],
                      notation_type: 'sf'
                    },
                    {
                      id: 't8',
                      name: 'Tekken 8',
                      characters: ['Alisa', 'Asuka', 'Azucena', 'Claudio', 'Devil Jin', 'Dragunov', 'Eddy', 'Feng', 'Heihachi', 'Hwoarang', 'Jack-8', 'Jin', 'Jun', 'Kazuya', 'King', 'Kuma', 'Lars', 'Law', 'Lee', 'Leo', 'Leroy', 'Lidia', 'Lili', 'Nina', 'Panda', 'Paul', 'Raven', 'Reina', 'Shaheen', 'Steve', 'Victor', 'Xiaoyu', 'Yoshimitsu', 'Zafina'],
                      notation_type: 'tekken'
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

  // Mock combo saving store layer
  await page.route('**/src/js/store.js', async (route) => {
    await route.continue();
  });

  await page.addInitScript((user) => {
    localStorage.setItem('hc_current_user', JSON.stringify(user));
  }, FAKE_USER);
}

/**
 * Intercepts Twitch oEmbed API and returns a fake title.
 */
async function mockTwitchOEmbed(page, fakeTitle) {
  await page.route('**/api.twitch.tv/v5/oembed**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: fakeTitle,
        type: 'video',
        version: '1.0',
      }),
    });
  });
}

/**
 * Intercepts YouTube oEmbed API.
 */
async function mockYouTubeOEmbed(page, fakeTitle) {
  await page.route('**/oembed**', async (route) => {
    if (route.request().url().includes('twitch.tv')) {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: fakeTitle,
        type: 'video',
        version: '1.0',
      }),
    });
  });
}

/**
 * Navigates to the app and switches to the builder page.
 */
async function goToBuilder(page) {
  await page.goto('/');
  await page.click('text=Combo Builder');
  await page.waitForSelector('#builder-game-select', { timeout: 10_000 });
}

// ─── SCENARIO 1: Format Hint ───────────────────────────────────────────────

test('format hint appears on game and character selection', async ({ page }) => {
  await injectFakeUserAndMockSupabase(page);
  await goToBuilder(page);

  const hint = page.locator('#video-format-hint');
  const hintText = page.locator('#video-format-hint-text');

  // Initially hidden
  await expect(hint).toBeHidden();

  // Select game SF6
  await page.selectOption('#builder-game-select', 'sf6');
  await expect(hint).toBeVisible();
  await expect(hintText).toContainText('Street Fighter 6');
  await expect(hintText).toContainText('A.K.I.');

  // Change character to Cammy
  await page.selectOption('#builder-char-select', 'Cammy');
  await expect(hintText).toContainText('Cammy');

  // If game is cleared
  await page.selectOption('#builder-game-select', '');
  await expect(hint).toBeHidden();
});

// ─── SCENARIO 2: Relevant Twitch VOD Validation ─────────────────────────────

test('relevant Twitch video shows green confirmation banner and checkbox', async ({ page }) => {
  await injectFakeUserAndMockSupabase(page);
  await mockTwitchOEmbed(page, 'SF6 Ryu Insane BnB Combo Guide');

  await goToBuilder(page);

  // Select game and character
  await page.selectOption('#builder-game-select', 'sf6');
  await page.selectOption('#builder-char-select', 'Ryu');

  // Fill video input with a Twitch URL
  await page.fill('#combo-video', 'https://www.twitch.tv/videos/12345678');
  await page.locator('#combo-video').blur();

  const banner = page.locator('#video-validation-banner');
  await expect(banner).toBeVisible({ timeout: 8_000 });

  await expect(banner).toContainText('looks relevant to');
  await expect(banner).toContainText('Street Fighter 6');

  await expect(page.locator('#video-confirm-row')).toBeVisible();
  await expect(page.locator('#video-confirm-checkbox')).not.toBeChecked();
});

// ─── SCENARIO 3: Mismatched YouTube Video Validation ─────────────────────────

test('mismatched YouTube video shows red warning banner with missing items', async ({ page }) => {
  await injectFakeUserAndMockSupabase(page);
  await mockYouTubeOEmbed(page, 'Funny Dog Videos Compilation 2024');

  await goToBuilder(page);

  // Select game and character
  await page.selectOption('#builder-game-select', 'sf6');
  await page.selectOption('#builder-char-select', 'Ryu');

  // Fill video input with a YouTube URL
  await page.fill('#combo-video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.locator('#combo-video').blur();

  const banner = page.locator('#video-validation-banner');
  await expect(banner).toBeVisible({ timeout: 8_000 });

  await expect(banner).toContainText('missing the game name ("Street Fighter 6") and the character name');
  await expect(page.locator('#video-confirm-row')).toBeVisible();
});

// ─── SCENARIO 4: Save Combo Interception ─────────────────────────────────────

test('publishing combo blocks and toasts if video is present but confirm is unchecked', async ({ page }) => {
  let dialogTriggered = false;
  await injectFakeUserAndMockSupabase(page);
  await mockYouTubeOEmbed(page, 'Funny Dog Videos Compilation 2024');

  await goToBuilder(page);

  // Fill required fields
  await page.selectOption('#builder-game-select', 'sf6');
  await page.selectOption('#builder-char-select', 'Ryu');
  await page.fill('#combo-title', 'My Awesomest Combo');
  
  // Fill manual notation
  await page.fill('#builder-manual-input', '236P > 5P');
  await page.locator('#builder-manual-input').dispatchEvent('input');

  // Fill video input
  await page.fill('#combo-video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.locator('#combo-video').blur();

  // Wait for confirm row
  await expect(page.locator('#video-confirm-row')).toBeVisible({ timeout: 8_000 });

  // Click Publish
  await page.click('#btn-publish-combo');

  // Toast should block submission
  const toast = page.locator('#toast-notification');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('confirm');

  // Listen for confirm dialog
  page.on('dialog', async dialog => {
    dialogTriggered = true;
    expect(dialog.message()).toContain('Street Fighter 6');
    expect(dialog.message()).toContain('Ryu');
    await dialog.accept();
  });

  // Check the checkbox
  await page.check('#video-confirm-checkbox');

  // Submit again
  await page.click('#btn-publish-combo');

  // Success toast or navigation
  await expect(toast).toContainText('published');
  expect(dialogTriggered).toBe(true);
});
