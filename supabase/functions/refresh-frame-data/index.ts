// Supabase Edge Function – Hourly Dustloop cache refresh
// ---------------------------------------------------------------
// Fetches frame data from the Dustloop Wiki Cargo API for supported
// games and upserts the JSON into the `dustloop_cache` table.
//
// Dustloop only covers Arc System Works titles. For non-ASW games
// (SF6, T8, SSBU) this function stores a placeholder entry so the
// UI can degrade gracefully.
// ---------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ----------------------------------------------------------------
// Dustloop Cargo API configuration per game.
// Each entry maps our internal game ID → the Cargo table + fields.
// ----------------------------------------------------------------
const DUSTLOOP_BASE = "https://www.dustloop.com/wiki/api.php";

interface GameConfig {
  cargoTable: string;
  fields: string;
  maxRows: number;
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
};

// Games that Dustloop does NOT cover (non-ASW titles).
// We store a marker so the UI knows the data isn't available.
const UNSUPPORTED_GAMES = ["sf6", "t8", "ssbu"];

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
  return `${DUSTLOOP_BASE}?${params.toString()}`;
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
    if (!res.ok) throw new Error(`Dustloop HTTP ${res.status}`);

    const json = await res.json();
    const rows = json?.cargoquery ?? [];
    if (rows.length === 0) break;

    // Each row is wrapped as { title: { ...fields } }
    for (const row of rows) {
      allRows.push(row.title);
    }

    // If we got fewer than the limit, we've reached the last page.
    if (rows.length < cfg.maxRows) break;
    offset += cfg.maxRows;
  }

  return allRows;
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
