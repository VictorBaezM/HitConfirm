import fs from 'fs';

const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

async function fetchGameData(gameId) {
  if (gameId === 'sf6' || gameId === 't8') {
    try {
      const content = fs.readFileSync(`src/data/${gameId}_cached.json`, 'utf8');
      return JSON.parse(content);
    } catch (e) {}
  }
  const url = `${SUPABASE_URL}/rest/v1/dustloop_cache?game_id=eq.${gameId}&select=data`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!response.ok) return [];
    const json = await response.json();
    return json.length > 0 ? json[0].data : [];
  } catch (e) {
    return [];
  }
}

const getBaseInput = (inp) => {
  return String(inp || '')
    .replace(/^(en\.|jr\s+|j\.|cr\.|st\.|bt)/i, '')
    .trim();
};

const findParentMoveSmart = (row, allMoves) => {
  const name = String(row.name || '').trim();
  const input = String(row.input || '').trim();
  
  // Normalize helper
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 1. First, search for "during", "after", "from", or "cancel" in any string field of the move
  // Look for: keyword + space + candidate
  const fieldsToSearch = ['input', 'name', 'startup', 'recovery'];
  
  // Get all other moves' names and inputs
  const parentCandidates = allMoves.filter(m => m !== row && (m.name || m.input));
  
  for (const field of fieldsToSearch) {
    const val = String(row[field] || '');
    if (!val) continue;
    
    // Check for "after", "during", "from", "cancel", "follow"
    const match = val.match(/\b(after|during|from|cancel|follow)\b\s+([a-zA-Z0-9().+\-[\]/| '’:]+)/i);
    if (match) {
      const keyword = match[1].toLowerCase();
      const phrase = match[2].trim();
      const normPhrase = norm(phrase);
      
      // A. Try to find a move whose name or input matches the phrase exactly
      let parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        return (normName && normPhrase === normName) || (normInput && normPhrase === normInput);
      });
      if (parent) return parent;
      
      // B. Try to find a parent that matches a prefix/substring of the phrase (e.g. "214K(HOLD)" containing "214K")
      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        return (normName && normPhrase.startsWith(normName)) || (normInput && normPhrase.startsWith(normInput));
      });
      if (parent) return parent;

      // C. Check if the phrase contains any known move name or input
      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        return (normName && normPhrase.includes(normName) && normName.length >= 3) || 
               (normInput && normPhrase.includes(normInput) && normInput.length >= 2);
      });
      if (parent) return parent;
    }
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

async function run() {
  const data = await fetchGameData('ggst');
  if (!data || data.length === 0) return;

  // Let's test for Zato-1 and Anji Mito and A.B.A
  const targetChars = ['A.B.A', 'Anji Mito', 'Zato-1', 'Chipp Zanuff'];
  
  targetChars.forEach(char => {
    const charMoves = data.filter(m => {
      const c = m.chara || m.character || m.Character || '';
      return c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === char.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    });

    console.log(`\n=== Character: ${char} ===`);
    charMoves.forEach(m => {
      const parent = findParentMoveSmart(m, charMoves);
      if (parent) {
        console.log(`CHILD: "${m.name}" (Input: "${m.input}") -> PARENT: "${parent.name}" (Input: "${parent.input}")`);
      }
    });
  });
}

run();
