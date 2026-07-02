const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STATIC_FALLBACK_NEWS = [
  { gameId: 'sf6', title: 'Check out gameplay for the first Year 4 character, Yasmine!', date: 'Jun 18, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835871199303153' },
  { gameId: 't8', title: 'Kunimitsu is available', date: 'Jun 2, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530900260' },
  { gameId: 'ggst', title: 'Ranked Match Phase 4 is LIVE!', date: 'Jun 1, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530899308' },
  { gameId: 'dbfz', title: 'WILD POWER AWAKENS', date: 'Apr 20, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1830163047266250' },
  { gameId: 'gbvsr', title: 'Deluxe Character Passes Are on Sale Now!', date: 'Jun 11, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835236783562335' },
  { gameId: 'dnfd', title: '📣Spring Sale 2025 is LIVE! DNF Duel & Season Pass 70% OFF NOW📣', date: 'Mar 12, 2025', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1794014851381295' },
  { gameId: 'ssbu', title: 'Super Smash Bros. Ultimate active development has concluded. Version 13.0.3 is live.', date: 'January 25, 2026', url: 'https://www.nintendo.com' }
];

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Set Cache-Control headers for Vercel Edge caching
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600');

  try {
    const { data, error } = await supabase
      .from('game_news')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'Empty news data');
    }

    const newsItems = data.map(item => ({
      gameId: item.game_id,
      title: item.title,
      date: item.date,
      url: item.url
    }));

    return res.status(200).json(newsItems);
  } catch (err) {
    console.error('Serverless news fetch failed, serving static fallback:', err.message);
    return res.status(200).json(STATIC_FALLBACK_NEWS);
  }
};
