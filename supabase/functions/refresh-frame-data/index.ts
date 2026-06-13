// Supabase Edge Function – Hourly Dustloop cache refresh
// ---------------------------------------------------------------
// Fetches frame data from the Dustloop Wiki Cargo API for supported
// games and upserts the JSON into the `dustloop_cache` table.
//
// Now supports SF6, Tekken 8, and Smash Ultimate.
// ---------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DUSTLOOP_BASE = "https://www.dustloop.com/wiki/api.php";

interface GameConfig {
  cargoTable: string;
  fields: string;
  maxRows: number;
  apiBase?: string;
  isWavu?: boolean;
}

const SUPPORTED_GAMES: Record<string, GameConfig> = {
  ggst: {
    cargoTable: "MoveData_GGST",
    fields: "chara,input,name,damage,guard,startup,active,recovery,onBlock,onHit,images,hitboxes",
    maxRows: 500,
  },
  dbfz: {
    cargoTable: "MoveData_DBFZ",
    fields: "chara,input,name,damage,guard,startup,active,recovery,onBlock,images,hitboxes",
    maxRows: 500,
  },
  dbfzce: {
    cargoTable: "MoveData_DBFZCE",
    fields: "chara,input,name,damage,guard,startup,active,recovery,onBlock,images,hitboxes",
    maxRows: 500,
  },
  gbvsr: {
    cargoTable: "MoveData_GBVSR",
    fields: "chara,input,name,damage,guard,startup,active,recovery,onBlock,onHit,images,hitboxes",
    maxRows: 500,
  },
  dnfd: {
    cargoTable: "MoveData_DNFD",
    fields: "chara,input,name,damage,guard,startup,active,recovery,onBlock,onHit,images,hitboxes",
    maxRows: 500,
  },
  sf6: {
    cargoTable: "SF6_FrameData",
    fields: "chara,input,name,damage,guard,startup,active,recovery,hitAdv,blockAdv,images,hitboxes",
    maxRows: 500,
    apiBase: "https://wiki.supercombo.gg/api.php",
  },
  t8: {
    cargoTable: "Move",
    fields: "_pageName=page,input,name,damage,startup,image=images,block=onBlock,hit=onHit,ch",
    maxRows: 500,
    apiBase: "https://wavu.wiki/w/api.php",
    isWavu: true,
  }
};

const UNSUPPORTED_GAMES: string[] = [];

// ----------------------------------------------------------------
// Build the Cargo query URL for a given game.
// ----------------------------------------------------------------
function buildCargoUrl(cfg: GameConfig, offset = 0): string {
  const params = new URLSearchParams({
    action: "cargoquery",
    tables: cfg.cargoTable,
    fields: cfg.fields,
    limit: String(cfg.maxRows),
    offset: String(offset),
    format: "json",
  });
  const apiBase = cfg.apiBase ?? DUSTLOOP_BASE;
  return `${apiBase}?${params.toString()}`;
}

// ----------------------------------------------------------------
// Fetch all pages of Cargo data (handles pagination).
// ----------------------------------------------------------------
async function fetchAllPages(cfg: GameConfig): Promise<unknown[]> {
  const allRows: unknown[] = [];
  let offset = 0;

  while (true) {
    const url = buildCargoUrl(cfg, offset);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const rows = json?.cargoquery ?? [];
    if (rows.length === 0) break;

    const cleanWavuVal = (val: string) => (val && val.startsWith(',') ? val.slice(1) : (val || ''));

    for (const row of rows) {
      if (row.title) {
        if (cfg.isWavu) {
          const pageMatch = String(row.title.page || '').match(/^(.+?)\s+movelist$/i);
          allRows.push({
            chara: pageMatch ? pageMatch[1] : (row.title.page || ''),
            input: row.title.input || '',
            name: row.title.name || '',
            damage: cleanWavuVal(row.title.damage),
            guard: '--',
            startup: cleanWavuVal(row.title.startup),
            active: '--',
            recovery: '--',
            onBlock: row.title.onBlock || '',
            onHit: row.title.onHit || '',
            images: '',
            hitboxes: row.title.images || ''
          });
        } else if (cfg.cargoTable === 'SF6_FrameData') {
          allRows.push({
            chara: row.title.chara || '',
            input: row.title.input || '',
            name: row.title.name || '',
            damage: row.title.damage || '',
            guard: row.title.guard || '',
            startup: row.title.startup || '',
            active: row.title.active || '',
            recovery: row.title.recovery || '',
            onBlock: row.title.blockAdv || '',
            onHit: row.title.hitAdv || '',
            images: row.title.images || '',
            hitboxes: row.title.hitboxes || ''
          });
        } else {
          allRows.push(row.title);
        }
      }
    }

    if (rows.length < cfg.maxRows) break;
    offset += cfg.maxRows;
  }

  return allRows;
}

// ----------------------------------------------------------------
// Resolve Smash Ultimate character slugs on ultimateframedata.com
// ----------------------------------------------------------------
function getSsbuSlug(name: string): string {
  const slug = name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '_')
    .replace(/[./-]/g, '')
    .replace(/[^a-z0-9_]/g, '');
  
  const overrides: Record<string, string> = {
    'ice_climancers': 'ice_climbers',
    'ice_climbers': 'ice_climbers',
    'rosalina_and_luma': 'rosalina_and_luma',
    'pacman': 'pac_man',
    'banjo_and_kazooie': 'banjo_and_kazooie',
    'min_min': 'min_min',
    'minmin': 'min_min',
    'pyra_mythra': 'pyra',
    'mii_fighter': 'mii_brawler'
  };
  
  if (overrides[slug]) return overrides[slug];
  return slug;
}

// ----------------------------------------------------------------
// Scrape and parse SSBU frame data from ultimateframedata.com
// ----------------------------------------------------------------
async function scrapeSsbuFrameData(): Promise<unknown[]> {
  const allMoves: unknown[] = [];
  const characters = [
    'Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus', 'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Luigi', 
    'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy', 'Bowser', 'Ice Climancers', 'Sheik', 'Zelda', 
    'Dr. Mario', 'Pichu', 'Falco', 'Marth', 'Lucina', 'Young Link', 'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 
    'Mr. Game & Watch', 'Meta Knight', 'Pit', 'Dark Pit', 'Zero Suit Samus', 'Wario', 'Snake', 'Ike', 
    'Squirtle', 'Ivysaur', 'Charizard', 'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede', 'Olimar', 'Lucario', 
    'R.O.B.', 'Toon Link', 'Wolf', 'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac', 
    'Greninja', 'Palutena', 'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt', 'Ryu', 'Ken', 'Cloud', 
    'Corrin', 'Bayonetta', 'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool', 'Isabelle', 'Incineroar', 
    'Piranha Plant', 'Joker', 'Hero', 'Banjo & Kazooie', 'Terry', 'Byleth', 'Min Min', 'Steve', 'Sephiroth', 
    'Pyra', 'Mythra', 'Kazuya', 'Sora', 'Mii Brawler', 'Mii Swordfighter', 'Mii Gunner'
  ];

  for (const charName of characters) {
    try {
      const slug = getSsbuSlug(charName);
      const url = `https://ultimateframedata.com/${slug}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`Failed to fetch SSBU character ${charName} (${url}): ${res.status}`);
        continue;
      }
      const html = await res.text();
      
      const moveRegex = /<div class="movecontainer">([\s\S]*?)(?=<div class="movecontainer"|$)/g;
      let match;
      while ((match = moveRegex.exec(html)) !== null) {
        const moveHtml = match[1];
        
        const nameMatch = moveHtml.match(/<div class="movename">([\s\S]*?)<\/div>/);
        if (!nameMatch) continue;
        const name = nameMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        
        const startupMatch = moveHtml.match(/<div class="startup">([\s\S]*?)<\/div>/);
        const startup = startupMatch ? startupMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        const activeMatch = moveHtml.match(/<div class="activeframes">([\s\S]*?)<\/div>/);
        const active = activeMatch ? activeMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        const endlagMatch = moveHtml.match(/<div class="endlag">([\s\S]*?)<\/div>/);
        const recovery = endlagMatch ? endlagMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        const damageMatch = moveHtml.match(/<div class="basedamage">([\s\S]*?)<\/div>/);
        const damage = damageMatch ? damageMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        const advMatch = moveHtml.match(/<div class="advantage">([\s\S]*?)<\/div>/);
        const onBlock = advMatch ? advMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        
        const imgMatch = moveHtml.match(/<img[^>]*data-src="([^"]+)"[^>]*>/) || moveHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/);
        let hitboxes = '';
        if (imgMatch) {
          const imgPath = imgMatch[1].trim();
          hitboxes = imgPath.startsWith('http') ? imgPath : `https://ultimateframedata.com/${imgPath}`;
        }
        
        allMoves.push({
          chara: charName,
          input: name,
          name: name,
          damage,
          guard: '--',
          startup,
          active,
          recovery,
          onBlock,
          onHit: '--',
          images: '',
          hitboxes
        });
      }
    } catch (e) {
      console.error(`Error scraping SSBU character ${charName}:`, e);
    }
  }
  return allMoves;
}

// ================================================================
// Entry point
// ================================================================
Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results: Array<{ gameId: string; status: string; rows?: number; reason?: string }> = [];

    // ------ Supported games (fetch real data) ------
    for (const [gameId, cfg] of Object.entries(SUPPORTED_GAMES)) {
      try {
        const rows = await fetchAllPages(cfg);

        const { error } = await supabase.from("dustloop_cache").upsert(
          {
            game_id: gameId,
            data: rows,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "game_id" }
        );

        if (error) {
          results.push({ gameId, status: "error", reason: error.message });
        } else {
          results.push({ gameId, status: "ok", rows: rows.length });
        }
      } catch (err) {
        results.push({ gameId, status: "error", reason: String(err) });
      }
    }

    // ------ Smash Ultimate Scraping ------
    try {
      const rows = await scrapeSsbuFrameData();
      const { error } = await supabase.from("dustloop_cache").upsert(
        {
          game_id: "ssbu",
          data: rows,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "game_id" }
      );
      if (error) {
        results.push({ gameId: "ssbu", status: "error", reason: error.message });
      } else {
        results.push({ gameId: "ssbu", status: "ok", rows: rows.length });
      }
    } catch (err) {
      results.push({ gameId: "ssbu", status: "error", reason: String(err) });
    }

    // ------ Unsupported games (store placeholder) ------
    for (const gameId of UNSUPPORTED_GAMES) {
      try {
        const { error } = await supabase.from("dustloop_cache").upsert(
          {
            game_id: gameId,
            data: { _unsupported: true, source: "dustloop", note: "Dustloop does not cover this title." },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "game_id" }
        );

        if (error) {
          results.push({ gameId, status: "error", reason: error.message });
        } else {
          results.push({ gameId, status: "placeholder" });
        }
      } catch (err) {
        results.push({ gameId, status: "error", reason: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
