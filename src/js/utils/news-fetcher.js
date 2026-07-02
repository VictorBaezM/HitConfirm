/**
 * Game News Fetcher Utility
 * Fetches verified recent news and updates for official games.
 */

// Static/offline fallback news payload
const STATIC_FALLBACK_NEWS = [
  {
    gameId: 'sf6',
    title: 'Check out gameplay for the first Year 4 character, Yasmine!',
    date: 'Jun 18, 2026',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835871199303153'
  },
  {
    gameId: 't8',
    title: 'Kunimitsu is available',
    date: 'Jun 2, 2026',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530900260'
  },
  {
    gameId: 'ggst',
    title: 'Ranked Match Phase 4 is LIVE!',
    date: 'Jun 1, 2026',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530899308'
  },
  {
    gameId: 'dbfz',
    title: 'WILD POWER AWAKENS',
    date: 'Apr 20, 2026',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1830163047266250'
  },
  {
    gameId: 'gbvsr',
    title: 'Deluxe Character Passes Are on Sale Now!',
    date: 'Jun 11, 2026',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835236783562335'
  },
  {
    gameId: 'dnfd',
    title: '📣Spring Sale 2025 is LIVE! DNF Duel & Season Pass 70% OFF NOW📣',
    date: 'Mar 12, 2025',
    url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1794014851381295'
  },
  {
    gameId: 'ssbu',
    title: 'Super Smash Bros. Ultimate active development has concluded. Version 13.0.3 is live.',
    date: 'January 25, 2026',
    url: 'https://www.nintendo.com'
  }
];

/**
 * Fetches recent news updates for supported games.
 * Fetches from the Vercel Serverless API `/api/news` which is Edge CDN cached.
 * Falls back to static news in-memory if the API fails.
 * @param {Array<string>} supportedGameIds - Array of active game IDs to fetch.
 * @returns {Promise<Array<Object>>} List of news entries for supported games.
 */
export async function fetchGameNews(supportedGameIds) {
  const activeIds = supportedGameIds.filter(function (id) {
    return id !== 'dbfzce';
  });

  try {
    const response = await fetch('/api/news');
    if (response.ok) {
      const data = await response.json();
      return data.filter(function (item) {
        return activeIds.includes(item.gameId);
      });
    }
  } catch (err) {
    console.warn('[News Fetcher] Failed to load news from API, using static fallback:', err.message);
  }

  // Fallback to static news if API call fails
  return STATIC_FALLBACK_NEWS.filter(function (item) {
    return activeIds.includes(item.gameId);
  });
}
