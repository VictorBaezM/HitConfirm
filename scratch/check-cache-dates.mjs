const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?select=game_id,updated_at`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`Error fetching cache metadata:`, response.statusText);
      return;
    }

    const json = await response.json();
    console.log('Cache status for all games:');
    json.forEach(row => {
      console.log(`- Game: ${row.game_id}, Last Updated: ${row.updated_at}`);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
