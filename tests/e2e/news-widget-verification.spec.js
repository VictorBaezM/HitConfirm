const { test, expect } = require('@playwright/test');
const path = require('path');

test('verify game news widget on feed page', async ({ page }) => {
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
  const screenshotsDir = 'C:/Users/Omen/.gemini/antigravity/brain/39ffb453-30e3-41fc-a88d-b6453c643059/scratch';
  await newsCard.screenshot({ path: path.join(screenshotsDir, 'news_widget.png') });
  console.log('Successfully captured news_widget.png');
});
