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
      console.log(`GGST move count:`, data.length);
      
      // Let's find all unique fields across all moves
      const fields = new Set();
      data.forEach(m => Object.keys(m).forEach(k => fields.add(k)));
      console.log(`All unique fields:`, Array.from(fields));

      // Let's search for "after" or "during" in any field (case-insensitive)
      const matches = [];
      data.forEach(m => {
        const found = [];
        for (const k of Object.keys(m)) {
          const val = String(m[k]);
          if (/\b(after|during)\b/i.test(val)) {
            found.push({ field: k, value: val });
          }
        }
        if (found.length > 0) {
          matches.push({ move: m, matches: found });
        }
      });

      console.log(`Found ${matches.length} moves containing 'after' or 'during' in their fields.`);
      matches.slice(0, 30).forEach(entry => {
        const m = entry.move;
        console.log(`\nChar: "${m.chara || m.character}", Name: "${m.name || 'N/A'}", Input: "${m.input}"`);
        entry.matches.forEach(match => {
          console.log(`  [${match.field}]: "${match.value}"`);
        });
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
