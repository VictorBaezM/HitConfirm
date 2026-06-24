const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function run() {
  const games = ['ggst', 'dbfz', 'dbfzce', 'gbvsr', 'dnfd', 'sf6', 't8', 'ssbu'];
  
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
        console.error(`Error fetching cache for ${gameId}:`, response.statusText);
        continue;
      }

      const json = await response.json();
      if (!json || json.length === 0) {
        console.log(`No cache row for ${gameId}`);
        continue;
      }
      
      const moves = json[0].data;
      if (!moves || moves._unsupported || !Array.isArray(moves)) {
        console.log(`Game ${gameId} has placeholder or unsupported cache`);
        continue;
      }

      console.log(`\n=== Game: ${gameId} (Total moves: ${moves.length}) ===`);

      // Find inputs with parentheses
      const inputsWithParentheses = moves.filter(m => m.input && m.input.includes('('));
      console.log(`Inputs with parentheses (count: ${inputsWithParentheses.length}):`);
      inputsWithParentheses.slice(0, 20).forEach(m => {
        console.log(`- Chara: ${m.chara}, Name: ${m.name}, Input: "${m.input}"`);
      });

      // Find names or inputs containing "Air OK" or "Hold OK"
      const airHoldOk = moves.filter(m => {
        const inputLower = String(m.input || '').toLowerCase();
        const nameLower = String(m.name || '').toLowerCase();
        return inputLower.includes('air') || inputLower.includes('hold') || nameLower.includes('air') || nameLower.includes('hold');
      });
      console.log(`Inputs/Names containing 'air' or 'hold' (count: ${airHoldOk.length}):`);
      airHoldOk.slice(0, 10).forEach(m => {
        console.log(`- Chara: ${m.chara}, Name: ${m.name}, Input: "${m.input}"`);
      });

    } catch (err) {
      console.error(`Error querying ${gameId}:`, err);
    }
  }
}

run();
