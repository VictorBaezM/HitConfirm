const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function run() {
  const games = ['sf6', 't8', 'ssbu'];
  for (const gameId of games) {
    const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?game_id=eq.${gameId}&select=data`;
    try {
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        console.error(`Error:`, response.statusText);
        continue;
      }
      const json = await response.json();
      console.log(`\n=== Game: ${gameId} ===`);
      if (json.length > 0) {
        console.log(JSON.stringify(json[0].data, null, 2));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

run();
