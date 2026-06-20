/**
 * Game News Fetcher Utility
 * Fetches recent news and updates for official games.
 */

// Steam AppIDs for official supported games
const STEAM_APP_IDS = {
  sf6: { name: 'Street Fighter 6', appid: 1364780 },
  t8: { name: 'Tekken 8', appid: 1778820 },
  ggst: { name: 'Guilty Gear -Strive-', appid: 1384160 },
  dbfz: { name: 'Dragon Ball FighterZ', appid: 678950 },
  gbvsr: { name: 'Granblue Fantasy Versus: Rising', appid: 2157560 },
  dnfd: { name: 'DNF Duel', appid: 1216060 }
};

// Static/offline fallbacks for all games including Nintendo Switch only titles
const FALLBACK_NEWS = {
  sf6: {
    title: 'Check out gameplay for the first Year 4 character, Yasmine!',
    date: 'June 18, 2026',
    url: 'https://store.steampowered.com/news/app/1364780/view/4260927503460492800'
  },
  t8: {
    title: 'DLC Character Kunimitsu II is now available!',
    date: 'June 2, 2026',
    url: 'https://store.steampowered.com/news/app/1778820/view/4158516016147427618'
  },
  ggst: {
    title: 'Ranked Match Phase 4 is LIVE! Server improvements and matchmaking updates.',
    date: 'June 1, 2026',
    url: 'https://store.steampowered.com/news/app/1384160/view/4157393437149021966'
  },
  dbfz: {
    title: 'WILD POWER AWAKENS: Update on server stability and rollback netcode.',
    date: 'April 20, 2026',
    url: 'https://store.steampowered.com/news/app/678950/view/4201372763399478119'
  },
  gbvsr: {
    title: 'Deluxe Character Passes and Character Set sales are now on!',
    date: 'June 11, 2026',
    url: 'https://store.steampowered.com/news/app/2157560/view/4155139016117382710'
  },
  dnfd: {
    title: 'Spring Sale is LIVE! DNF Duel & Season Pass are 70% off.',
    date: 'March 12, 2025',
    url: 'https://store.steampowered.com/news/app/1216060/view/4096627503460392100'
  },
  ssbu: {
    title: 'Super Smash Bros. Ultimate active development has concluded. Version 13.0.3 is live.',
    date: 'January 25, 2026',
    url: 'https://www.nintendo.com/whatsnew/detail/2024/super-smash-bros-ultimate-software-update-13-0-3-patch-notes/'
  }
};

/**
 * Fetches the latest news item for a single PC game from Steam News API via a CORS proxy.
 * @param {string} gameId 
 * @param {number} appid 
 * @returns {Promise<Object>} News item
 */
async function fetchSteamNews(gameId, appid) {
  const steamUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=3`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(steamUrl)}`;

  // Use abort controller to timeout fetch if proxy is slow
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const newsItems = data.appnews?.newsitems || [];
    
    // Find the first relevant news item in English (ignoring non-English if possible)
    let selectedItem = newsItems[0];
    for (const item of newsItems) {
      // Basic check to prefer English titles or steam community posts
      if (item.feedname === 'steam_community_announcements' || !/[а-яА-Я]/.test(item.title)) {
        selectedItem = item;
        break;
      }
    }

    if (selectedItem) {
      return {
        title: selectedItem.title,
        date: new Date(selectedItem.date * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        url: selectedItem.url
      };
    }
  } catch (error) {
    console.warn(`[News Fetcher] Failed fetching news for ${gameId}:`, error.message);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to offline cached entry
  return FALLBACK_NEWS[gameId];
}

/**
 * Fetches recent news updates for all supported games.
 * @param {Array<string>} supportedGameIds - Array of active game IDs to fetch.
 * @returns {Promise<Array<Object>>} List of news entries for supported games.
 */
export async function fetchGameNews(supportedGameIds) {
  const results = [];
  const activeIds = supportedGameIds.filter(id => id !== 'dbfzce');

  for (const gameId of activeIds) {
    let newsData;
    const config = STEAM_APP_IDS[gameId];
    
    if (config) {
      // Fetch from Steam API with fallback
      newsData = await fetchSteamNews(gameId, config.appid);
      // Stagger subsequent requests by 100ms to prevent proxy rate-limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      // Non-PC games (like SSBU) or unsupported fallback directly
      newsData = FALLBACK_NEWS[gameId] || {
        title: 'Check official website for the latest updates and patches.',
        date: 'Recent',
        url: '#'
      };
    }

    results.push({
      gameId,
      title: newsData.title,
      date: newsData.date,
      url: newsData.url
    });
  }

  return results;
}
