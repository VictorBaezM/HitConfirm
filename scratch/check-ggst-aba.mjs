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
      console.log(`Searching in ${data.length} GGST moves...`);
      const matches = data.filter(m => {
        const name = String(m.name || '').toLowerCase();
        const input = String(m.input || '').toLowerCase();
        return name.includes('shin') || name.includes('fujin') || name.includes('ishi') || name.includes('shiki') ||
               input.includes('shin') || input.includes('fujin') || input.includes('ishi') || input.includes('shiki');
      });
      matches.forEach(m => {
        console.log(`Char: "${m.chara || m.character || m.Character}", Name: "${m.name}", Input: "${m.input}", keys: ${Object.keys(m).filter(k => m[k]).join(', ')}`);
        for (const k of Object.keys(m)) {
          if (m[k] && typeof m[k] === 'string' && m[k].length > 0 && !['chara', 'character', 'Character', 'images', 'hitboxes', 'name', 'input'].includes(k)) {
            console.log(`  ${k}: "${m[k]}"`);
          }
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
