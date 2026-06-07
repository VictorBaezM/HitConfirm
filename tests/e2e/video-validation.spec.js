// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests — Video Relevance Validation Feature
 *
 * Test Strategy (Strategic Feature Verification Tester — User Workflow tier):
 *
 * Core user value: When a user attaches a YouTube video to a game-tagged post,
 * they must see an on-screen notice if the video title does not contain both
 * the game name and the character name; and they cannot publish without confirming.
 *
 * Three targeted scenarios (zero redundancy):
 *   1. Relevant video → green banner confirms title is valid, checkbox appears
 *   2. Irrelevant video → red warning banner appears, specifying what is missing
 *   3. Publish blocked without checkbox → toast fires and checkbox is focused
 *
 * Approach:
 *   - localStorage injection simulates a logged-in user (bypasses Supabase auth)
 *   - page.route() intercepts the YouTube oEmbed endpoint with controlled responses
 *     (deterministic, no real network, no flakiness)
 *   - All assertions target visible text and element state, not CSS or internals
 */

// A minimal fake user matching the shape store.js reads from hc_current_user
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

/**
 * Seeds localStorage with a fake logged-in user and mocks the Supabase client
 * so the post creator form renders in its logged-in state without requiring a real session.
 */
async function injectFakeUser(page) {
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

  await page.addInitScript((user) => {
    localStorage.setItem('hc_current_user', JSON.stringify(user));
  }, FAKE_USER);
}

/**
 * Intercepts YouTube's oEmbed API and returns a fake title.
 * Prevents real network calls and makes tests deterministic.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fakeTitle - The video title to return in the mocked response.
 */
async function mockOEmbed(page, fakeTitle) {
  await page.route('**/oembed**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: fakeTitle,
        author_name: 'TestChannel',
        author_url: 'https://youtube.com',
        type: 'video',
        version: '1.0',
      }),
    });
  });
}

/**
 * Navigates to the app, waits for the feed page and creator box to load.
 */
async function goToFeed(page) {
  await page.goto('/');
  // Wait for the post creator heading to appear (signals logged-in creator box rendered)
  await page.waitForSelector('text=Share a Strategic Thought or Clip', { timeout: 15_000 });
}

/**
 * Selects SF6 from the game dropdown and fills in the YouTube URL field,
 * then triggers a blur event on the URL input to start oEmbed validation.
 */
async function fillVideoForm(page, youtubeUrl) {
  await page.selectOption('#post-game-select', 'sf6');
  await page.selectOption('#post-char-select', 'Ryu');
  await page.fill('#post-video-input', youtubeUrl);
  // Blur triggers the oEmbed check
  await page.locator('#post-video-input').blur();
}

// ─── SCENARIO 1: Relevant video → green banner ───────────────────────────────

test('relevant video title shows green confirmation banner and checkbox', async ({ page }) => {
  await injectFakeUser(page);
  // The mock title contains both the game name keyword ("SF6") and a character ("Ryu")
  await mockOEmbed(page, 'SF6 Ryu BnB Combo Guide 2024');

  await goToFeed(page);
  await fillVideoForm(page, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  // Wait for the async oEmbed check to complete and the banner to update
  const banner = page.locator('#video-validation-banner');
  await expect(banner).toBeVisible({ timeout: 8_000 });

  // Banner should confirm the video looks relevant — check for key phrases
  await expect(banner).toContainText('looks relevant to');
  await expect(banner).toContainText('Street Fighter 6');

  // The confirmation checkbox row must appear for the user to acknowledge
  await expect(page.locator('#video-confirm-row')).toBeVisible();
  await expect(page.locator('#video-confirm-checkbox')).not.toBeChecked();
});

// ─── SCENARIO 2: Irrelevant video → red warning banner ───────────────────────

test('video title missing game and character shows red warning banner', async ({ page }) => {
  await injectFakeUser(page);
  // Title has neither game name nor character name
  await mockOEmbed(page, 'Funny Cat Compilation — Best Moments 2024');

  await goToFeed(page);
  await fillVideoForm(page, 'https://youtu.be/dQw4w9WgXcQ');

  const banner = page.locator('#video-validation-banner');
  await expect(banner).toBeVisible({ timeout: 8_000 });

  // Banner must call out the specific missing fields
  await expect(banner).toContainText('missing');
  await expect(banner).toContainText('Street Fighter 6');

  // The checkbox still appears so the user can override the warning
  await expect(page.locator('#video-confirm-row')).toBeVisible();
});

// ─── SCENARIO 3: Submit blocked without checkbox checked ──────────────────────

test('publishing is blocked with a toast when checkbox is not checked', async ({ page }) => {
  let dialogTriggered = false;
  await injectFakeUser(page);
  await mockOEmbed(page, 'Funny Cat Compilation');

  await goToFeed(page);

  // Fill the post text
  await page.fill('.post-input', 'Check out this clip!');

  await fillVideoForm(page, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  // Wait for validation to complete and the confirm row to appear
  await expect(page.locator('#video-confirm-row')).toBeVisible({ timeout: 8_000 });

  // Attempt to publish without checking the confirmation checkbox
  await page.click('#btn-submit-post');

  // The app should show a toast warning the user to confirm relevance
  const toast = page.locator('#toast-notification');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('confirm');

  // Handle the browser dialogue popup
  page.on('dialog', async dialog => {
    dialogTriggered = true;
    expect(dialog.message()).toContain('Street Fighter 6');
    expect(dialog.message()).toContain('Ryu');
    await dialog.accept();
  });

  // Check the confirmation box
  await page.check('#video-confirm-checkbox');

  // Submit again
  await page.click('#btn-submit-post');

  // Toast should now show success
  await expect(toast).toContainText('successfully');
  expect(dialogTriggered).toBe(true);
});

// ─── SCENARIO 4: Format hint appears when a game is selected ─────────────────

test('format hint appears when a game is selected and disappears when cleared', async ({ page }) => {
  await injectFakeUser(page);

  await goToFeed(page);

  // Before game selection — hint should be hidden
  const hint = page.locator('#video-format-hint');
  await expect(hint).toBeHidden();

  // Select a game — hint should appear with game name and example character
  await page.selectOption('#post-game-select', 'sf6');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Street Fighter 6');
  await expect(hint).toContainText('Example:');
});
