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
    if (!response.ok) {
      console.error(`Error:`, response.statusText);
      return;
    }
    const json = await response.json();
    if (json.length > 0) {
      const data = json[0].data;
      const zatoMoves = data.filter(m => {
        const char = m.chara || m.character || m.Character || '';
        return char.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'zato1';
      });
      console.log(`Zato-1 Moves:`, zatoMoves.length);
      zatoMoves.forEach(m => {
        if (m.input.includes('214K') || m.name.includes('Eddie') || m.input.includes('22')) {
          console.log(`- Name: "${m.name}", Input: "${m.input}"`);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
