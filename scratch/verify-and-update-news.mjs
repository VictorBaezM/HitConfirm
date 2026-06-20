import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';
const LOCAL_JSON_PATH = 'c:/Users/Omen/Desktop/GitHub/HitConfirm/src/data/game_news.json';

const PC_GAMES = {
  sf6: { name: 'Street Fighter 6', appid: 1364780 },
  t8: { name: 'Tekken 8', appid: 1778820 },
  ggst: { name: 'Guilty Gear -Strive-', appid: 1384160 },
  dbfz: { name: 'Dragon Ball FighterZ', appid: 678950 },
  gbvsr: { name: 'Granblue Fantasy Versus: Rising', appid: 2157560 },
  dnfd: { name: 'DNF Duel', appid: 1216060 }
};

const SSBU_NEWS = {
  game_id: 'ssbu',
  title: 'Super Smash Bros. Ultimate active development has concluded. Version 13.0.3 is live.',
  date: 'January 25, 2026',
  url: 'https://www.nintendo.com/whatsnew/detail/2024/super-smash-bros-ultimate-software-update-13-0-3-patch-notes/'
};

// Fallbacks in case Steam API or verify fails
const FALLBACKS = {
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
  }
};

/**
 * Validates whether a URL is actually live and accessible (HTTP 200).
 * Uses a GET request with a timeout.
 */
async function verifyUrl(url) {
  if (!url || url === '#') return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    console.log(`Verification failed for ${url}:`, e.message);
    return false;
  }
}

async function fetchLatestSteamNewsItem(gameId, appid) {
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=4`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = data.appnews?.newsitems || [];
    
    // Iterate to find a valid English news item
    for (const item of items) {
      if (item.title && !/[а-яА-Я]/.test(item.title)) {
        const isLive = await verifyUrl(item.url);
        if (isLive) {
          return {
            title: item.title,
            date: new Date(item.date * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            url: item.url
          };
        }
      }
    }
  } catch (e) {
    console.warn(`Failed fetching steam news for ${gameId}:`, e.message);
  }
  return null;
}

async function main() {
  console.log('--- STARTING NEWS VERIFICATION & CACHE UPDATE ---');
  const payload = [];

  // 1. Process PC Games
  for (const [gameId, game] of Object.entries(PC_GAMES)) {
    console.log(`Processing ${game.name}...`);
    let verifiedNews = await fetchLatestSteamNewsItem(gameId, game.appid);
    
    if (verifiedNews) {
      console.log(`✅ Found live news: "${verifiedNews.title}"`);
    } else {
      console.log(`⚠️ No live news found from Steam API. Checking fallback...`);
      const fallback = FALLBACKS[gameId];
      const isFallbackLive = await verifyUrl(fallback.url);
      if (isFallbackLive) {
        console.log(`✅ Fallback link is live: "${fallback.title}"`);
        verifiedNews = fallback;
      } else {
        console.error(`❌ Fallback link failed validation for ${gameId}. Using stub url.`);
        verifiedNews = {
          title: fallback.title,
          date: fallback.date,
          url: 'https://store.steampowered.com'
        };
      }
    }

    payload.push({
      game_id: gameId,
      title: verifiedNews.title,
      date: verifiedNews.date,
      url: verifiedNews.url
    });
  }

  // 2. Process SSBU
  console.log('Processing Super Smash Bros. Ultimate...');
  const isSsbuLive = await verifyUrl(SSBU_NEWS.url);
  if (isSsbuLive) {
    console.log('✅ SSBU link is live.');
    payload.push(SSBU_NEWS);
  } else {
    console.error('❌ SSBU link failed validation. Using fallback Switch site.');
    payload.push({
      ...SSBU_NEWS,
      url: 'https://www.nintendo.com'
    });
  }

  // 3. Write local JSON file
  fs.writeFileSync(LOCAL_JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved local JSON file at ${LOCAL_JSON_PATH}`);

  // 4. Upsert to Supabase
  console.log('Upserting verified news items to Supabase...');
  const dbUrl = `${SUPABASE_URL}/rest/v1/game_news`;
  
  const res = await fetch(dbUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    console.log('✅ Successfully upserted news items to Supabase!');
  } else {
    console.error('❌ Failed upserting to Supabase:', res.status, await res.text());
  }

  console.log('--- NEWS VERIFICATION & CACHE UPDATE COMPLETE ---');
}

main().catch(console.error);
