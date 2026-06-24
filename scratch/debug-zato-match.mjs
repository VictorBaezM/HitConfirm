const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?game_id=eq.ggst&select=data`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const json = await response.json();
  const data = json[0].data;
  const zatoMoves = data.filter(m => {
    const c = m.chara || m.character || m.Character || '';
    return c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'zato1';
  });

  const row = zatoMoves.find(m => m.name === 'Finish Blow');
  const allMoves = zatoMoves;

  const name = String(row.name || '').trim();
  const input = String(row.input || '').trim();
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const fieldsToSearch = ['input', 'name', 'startup', 'recovery'];
  const parentCandidates = allMoves.filter(m => m !== row && (m.name || m.input));
  
  for (const field of fieldsToSearch) {
    const val = String(row[field] || '');
    if (!val) continue;
    
    const match = val.match(/\b(after|during|from|cancel|follow)\b\s+([a-zA-Z0-9().+\-[\]/| '’:]+)/i);
    if (match) {
      const keyword = match[1].toLowerCase();
      const phrase = match[2].trim();
      const normPhrase = norm(phrase);
      
      console.log(`Searching for phrase: "${phrase}" (norm: "${normPhrase}") in Zato moves`);
      
      let parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        const matchName = normName && normPhrase === normName;
        const matchInput = normInput && normPhrase === normInput;
        if (matchName || matchInput) {
          console.log(`  Clause A matched:`, m.name, m.input);
          return true;
        }
        return false;
      });
      if (parent) return;
      
      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        const matchName = normName && normPhrase.startsWith(normName);
        const matchInput = normInput && normPhrase.startsWith(normInput);
        if (matchName || matchInput) {
          console.log(`  Clause B matched:`, m.name, m.input);
          return true;
        }
        return false;
      });
      if (parent) return;

      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        const matchName = normName && normPhrase.includes(normName) && normName.length >= 3;
        const matchInput = normInput && normPhrase.includes(normInput) && normInput.length >= 2;
        if (matchName || matchInput) {
          console.log(`  Clause C matched:`, m.name, m.input, `normName: "${normName}", normInput: "${normInput}"`);
          return true;
        }
        return false;
      });
      if (parent) return;
    }
  }
}

run();
