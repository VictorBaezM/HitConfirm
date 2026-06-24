const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?game_id=eq.ggst&select=data`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const json = await response.json();
    const data = json[0].data;
    const chippMoves = data.filter(m => {
      const c = m.chara || m.character || m.Character || '';
      return c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'chippzanuff';
    });
    const escape = chippMoves.find(m => m.name === 'Escape');
    console.log('Escape move:', JSON.stringify(escape, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
