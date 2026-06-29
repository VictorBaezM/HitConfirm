/**
 * Game News Fetcher Utility
 * Fetches verified recent news and updates for official games.
 */
import { supabase } from '../supabase.js';

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
 * Fetches locally from game_news.json first (instant load),
 * then fetches the remote game_news table from Supabase.
 * @param {Array<string>} supportedGameIds - Array of active game IDs to fetch.
 * @returns {Promise<Array<Object>>} List of news entries for supported games.
 */
export async function fetchGameNews(supportedGameIds) {
  const activeIds = supportedGameIds.filter(id => id !== 'dbfzce');
  
  // 1. Try to load from local game_news.json for instant load
  let cachedNews = [];
  try {
    const response = await fetch('/src/data/game_news.json');
    if (response.ok) {
      const data = await response.json();
      cachedNews = data.map(item => ({
        gameId: item.game_id,
        title: item.title,
        date: item.date,
        url: item.url
      }));
    }
  } catch (err) {
    // Ignore error and use static fallbacks
  }

  if (cachedNews.length === 0) {
    cachedNews = STATIC_FALLBACK_NEWS;
  }

  const filteredCached = cachedNews.filter(item => activeIds.includes(item.gameId));

  // 2. Fetch the latest live news from the Supabase game_news table
  const dbPromise = (async () => {
    const { data, error } = await supabase
      .from('game_news')
      .select('*')
      .order('id', { ascending: true });
    
    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'Empty data');
    }
    
    return data
      .map(item => ({
        gameId: item.game_id,
        title: item.title,
        date: item.date,
        url: item.url
      }))
      .filter(item => activeIds.includes(item.gameId));
  })();

  // Race the database request against a 1.2-second timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 1200)
  );

  try {
    const freshNews = await Promise.race([dbPromise, timeoutPromise]);
    return freshNews;
  } catch (err) {
    console.log('[News Fetcher] Loading fallback news (DB slow or offline):', err.message);
    return filteredCached;
  }
}
