// @ts-check
const { test, expect } = require('@playwright/test');

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
  savedCombos: [],
  bio: '',
};

async function injectFakeUser(page) {
  page.on('console', msg => {
    console.log(`[E2E BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[E2E BROWSER ERROR]: ${err.stack || err.message}`);
  });

  await page.route('**/src/js/supabase.js', route => {
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        const db = {
          users: [{
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
          }],
          games: [{
            id: 'sf6',
            name: 'Street Fighter 6',
            characters: ['A.K.I.', 'Akuma', 'Blanka', 'Cammy', 'Chun-Li', 'Dee Jay', 'Dhalsim', 'E. Honda', 'Ed', 'Elena', 'Guile', 'Jamie', 'JP', 'Juri', 'Ken', 'Kimberly', 'Lily', 'Luke', 'M. Bison', 'Mai', 'Marisa', 'Rashid', 'Ryu', 'Terry', 'Zangief'],
            notation_type: 'sf'
          }],
          combos: [],
          posts: []
        };

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
              upsert: () => builder,
              insert: (payload) => {
                if (Array.isArray(payload)) {
                  db[table] = [...payload, ...db[table]];
                } else {
                  db[table].unshift(payload);
                }
                return builder;
              },
              then: (resolve) => {
                let data = db[table] || [];
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

test('submitting post with combo notation renders it visually in timeline', async ({ page }) => {
  await injectFakeUser(page);

  await page.goto('/');
  await page.waitForSelector('text=Share a Strategic Thought or Clip', { timeout: 15_000 });

  // Fill in the post details
  await page.fill('.post-input', 'Lab work on Ryu BnB combos!');
  await page.selectOption('#post-game-select', 'sf6');
  await page.selectOption('#post-char-select', 'Ryu');
  await page.fill('#post-notation-input', '5HP > 236KK > WS');

  // Submit the post
  await page.click('#btn-submit-post');

  // Success toast check
  const toast = page.locator('#toast-notification');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('Post published successfully!');

  // Look for the newly created post card on the feed timeline
  const newPost = page.locator('.wiki-post-panel').first();
  await expect(newPost).toBeVisible();

  // Validate post text content includes user content and auto hashtag
  await expect(newPost.locator('.wiki-post-content')).toContainText('Lab work on Ryu BnB combos!');
  await expect(newPost.locator('.wiki-post-content')).toContainText('#Ryu');

  // Verify that the combo sequence is parsed and rendered visually
  const sequence = newPost.locator('.wiki-combo-sequence');
  await expect(sequence).toBeVisible();
  await expect(sequence).toContainText('•HP');
  await expect(sequence).toContainText('➔');
  await expect(sequence).toContainText('QCFKK');
  await expect(sequence).toContainText('WS');
});

test('sharing a combo from builder page automatically creates feed post with visual notation rendering', async ({ page }) => {
  await injectFakeUser(page);

  await page.goto('/');
  await page.waitForSelector('text=Share a Strategic Thought or Clip', { timeout: 15_000 });

  // Navigate to Builder
  await page.click('.nav-link[data-page="builder"]');
  await page.waitForSelector('#builder-game-select', { timeout: 10_000 });

  // Fill combo details
  await page.selectOption('#builder-game-select', 'sf6');
  await page.selectOption('#builder-char-select', 'Ryu');
  await page.fill('#combo-title', 'Corner Carry From Builder');
  await page.fill('#builder-manual-input', '236P > 5P');
  await page.locator('#builder-manual-input').dispatchEvent('input');

  // Submit combo
  await page.click('#btn-publish-combo');

  // Success toast check
  const toast = page.locator('#toast-notification');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('published');

  // Navigate back to Feed
  await page.click('.nav-link[data-page="feed"]');
  await page.waitForSelector('text=Share a Strategic Thought or Clip', { timeout: 15_000 });

  // Look for the newly created post card on the feed timeline
  const newPost = page.locator('.wiki-post-panel').first();
  await expect(newPost).toBeVisible();

  // Validate post content title & character tags
  await expect(newPost.locator('.wiki-post-content')).toContainText('Corner Carry From Builder');
  await expect(newPost.locator('.wiki-post-content')).toContainText('#Ryu');

  // Verify that the combo sequence is parsed and rendered visually
  const sequence = newPost.locator('.wiki-combo-sequence');
  await expect(sequence).toBeVisible();
  await expect(sequence).toContainText('QCFP');
  await expect(sequence).toContainText('➔');
  await expect(sequence).toContainText('•P');
});

test('feed post with notation displays save and copy buttons and supports toggle bookmark and clipboard copy', async ({ page, context }) => {
  await injectFakeUser(page);

  // Grant clipboard access
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/');
  await page.waitForSelector('text=Share a Strategic Thought or Clip', { timeout: 15_000 });

  // Fill in the post details
  await page.fill('.post-input', 'Test feed actions');
  await page.selectOption('#post-game-select', 'sf6');
  await page.selectOption('#post-char-select', 'Ryu');
  await page.fill('#post-notation-input', '5HP > 236KK > WS');

  // Submit the post
  await page.click('#btn-submit-post');

  // Wait for post panel
  const postCard = page.locator('.wiki-post-panel').first();
  await expect(postCard).toBeVisible();

  // Verify save and copy buttons are present
  const saveBtn = postCard.locator('.btn-save');
  const copyBtn = postCard.locator('.btn-copy');
  await expect(saveBtn).toBeVisible();
  await expect(copyBtn).toBeVisible();

  // Verify save is not active
  await expect(saveBtn).not.toHaveClass(/active/);

  // Click save button (should save combo and bookmark it)
  await saveBtn.click();
  const toast = page.locator('#toast-notification');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('Combo saved to your Dojo.');

  // Verify save button is now active
  await expect(saveBtn).toHaveClass(/active/);

  // Click save button again (should remove bookmark)
  await saveBtn.click();
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('Combo removed from your Dojo.');

  // Verify save is no longer active
  await expect(saveBtn).not.toHaveClass(/active/);

  // Click copy button
  await copyBtn.click();
  await expect(toast).toBeVisible({ timeout: 5_000 });
  await expect(toast).toContainText('Combo notation copied to clipboard.');

  // Read from clipboard and assert it matches the notation
  const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
  expect(clipboardText).toBe('5HP > 236KK > WS');
});

