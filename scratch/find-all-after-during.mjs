import fs from 'fs';

const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

const games = ['ggst', 'dbfz', 'dbfzce', 'gbvsr', 'dnfd', 'sf6', 't8', 'ssbu'];

async function fetchGameData(gameId) {
  if (gameId === 'sf6' || gameId === 't8') {
    try {
      const content = fs.readFileSync(`src/data/${gameId}_cached.json`, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.warn(`Local file failed for ${gameId}, fetching from supabase...`);
    }
  }
  const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?game_id=eq.${gameId}&select=data`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) return [];
  const json = await response.json();
  return json.length > 0 ? json[0].data : [];
}

async function run() {
  for (const gameId of games) {
    const data = await fetchGameData(gameId);
    if (!data || data.length === 0) continue;

    console.log(`\n=== Game: ${gameId} (${data.length} moves) ===`);

    const matches = [];
    data.forEach(m => {
      const name = String(m.name || '');
      const input = String(m.input || '');
      const hasAfterDuring = /\b(after|during)\b/i.test(name) || /\b(after|during)\b/i.test(input);
      if (hasAfterDuring) {
        matches.push(m);
      }
    });

    if (matches.length > 0) {
      console.log(`Found ${matches.length} moves with after/during in name or input:`);
      matches.forEach(m => {
        console.log(`- Char: "${m.chara || m.character}", Name: "${m.name}", Input: "${m.input}"`);
      });
    }
  }
}

run();
