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
      const abaMoves = data.filter(m => {
        const char = m.chara || m.character || m.Character || '';
        return char.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'aba';
      });

      const getBaseInput = (inp) => {
        return String(inp || '')
          .replace(/^(en\.|jr\s+|j\.|cr\.|st\.|bt)/i, '')
          .trim();
      };

      const findParentMove = (row, allMoves) => {
        const input = String(row.input || '');
        
        // 1. Check for "during" or "after" in input
        const duringAfterMatch = input.match(/(?:during|after)\s+([a-zA-Z0-9().+\-[\]/| ]+)/i);
        if (duringAfterMatch) {
          const candidate = duringAfterMatch[1].trim();
          const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const normCandidate = norm(candidate);
          
          let parent = allMoves.find(m => m !== row && norm(m.name) === normCandidate);
          if (parent) return parent;
          
          parent = allMoves.find(m => m !== row && norm(m.input) === normCandidate);
          if (parent) return parent;
        }

        // 2. Check for tilde "~" or space " " separated inputs
        const delimiters = ['~', ' '];
        for (const delim of delimiters) {
          if (input.includes(delim)) {
            const parentInputPrefix = input.split(delim)[0].trim();
            let parent = allMoves.find(m => m !== row && String(m.input || '').trim() === parentInputPrefix);
            if (parent) return parent;
          }

          const baseInput = getBaseInput(input);
          if (baseInput.includes(delim)) {
            const parentBaseInput = baseInput.split(delim)[0].trim();
            let parent = allMoves.find(m => {
              if (m === row) return false;
              const mBase = getBaseInput(m.input);
              return mBase === parentBaseInput;
            });
            if (parent) return parent;
          }
        }
        return null;
      };

      console.log(`=== Grouping A.B.A Moves ===`);
      abaMoves.forEach(m => {
        const parent = findParentMove(m, abaMoves);
        if (parent) {
          console.log(`CHILD: "${m.name}" (Input: "${m.input}") -> PARENT: "${parent.name}" (Input: "${parent.input}")`);
        } else {
          console.log(`ROOT:  "${m.name}" (Input: "${m.input}")`);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
