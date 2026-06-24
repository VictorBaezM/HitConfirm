import fs from 'fs';

const SUPABASE_URL = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

const games = ['ggst', 'dbfz', 'dbfzce', 'gbvsr', 'dnfd', 'sf6', 't8'];

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
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 1. Search for "during", "after", "from", "cancel", "follow" in input, name, startup, recovery
  const fieldsToSearch = ['input', 'name', 'startup', 'recovery'];
  const parentCandidates = allMoves.filter(m => m !== row && (m.name || m.input));
  
  for (const field of fieldsToSearch) {
    const val = String(row[field] || '');
    if (!val) continue;
    
    // Look for keywords followed by a phrase
    const match = val.match(/\b(after|during|from|cancel|follow)\b\s+([a-zA-Z0-9().+\-[\]/| '’:]+)/i);
    if (match) {
      const phrase = match[2].trim();
      const normPhrase = norm(phrase);
      if (!normPhrase) continue;
      
      // A. Exact match name or input
      let parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        return (normName && normPhrase === normName) || (normInput && normPhrase === normInput);
      });
      if (parent) return parent;
      
      // B. Prefix match: candidate starts with parent name/input (length restricted to avoid false positives like single buttons)
      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        const matchName = normName && normName.length >= 3 && normPhrase.startsWith(normName);
        const matchInput = normInput && normInput.length >= 2 && normPhrase.startsWith(normInput);
        return matchName || matchInput;
      });
      if (parent) return parent;

      // C. Substring match: candidate contains parent name/input
      parent = parentCandidates.find(m => {
        const normName = norm(m.name);
        const normInput = norm(m.input);
        const matchName = normName && normName.length >= 3 && normPhrase.includes(normName);
        const matchInput = normInput && normInput.length >= 2 && normPhrase.includes(normInput);
        return matchName || matchInput;
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
  for (const gameId of games) {
    const data = await fetchGameData(gameId);
    if (!data || data.length === 0) continue;

    console.log(`\n============================`);
    console.log(`=== Game: ${gameId} ===`);
    console.log(`============================`);

    // Group by character
    const charMap = {};
    data.forEach(m => {
      const char = m.chara || m.character || m.Character || 'Unknown';
      if (!charMap[char]) charMap[char] = [];
      charMap[char].push(m);
    });

    Object.keys(charMap).forEach(char => {
      const charMoves = charMap[char];
      const childList = [];
      charMoves.forEach(m => {
        const parent = findParentMoveSmart(m, charMoves);
        if (parent) {
          childList.push(`  CHILD: "${m.name}" (Input: "${m.input}") -> PARENT: "${parent.name}" (Input: "${parent.input}")`);
        }
      });
      if (childList.length > 0) {
        console.log(`\nCharacter: ${char}`);
        childList.slice(0, 15).forEach(c => console.log(c));
        if (childList.length > 15) {
          console.log(`  ... and ${childList.length - 15} more`);
        }
      }
    });
  }
}

run();
