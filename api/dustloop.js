const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { gameId } = req.query;
  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId parameter' });
  }

  // Set Cache-Control headers for Vercel Edge caching (24 hours cache)
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600');

  try {
    const { data, error } = await supabase
      .from('dustloop_cache')
      .select('data')
      .eq('game_id', gameId)
      .single();

    if (error) {
      throw error;
    }

    if (data && data.data) {
      return res.status(200).json(data.data);
    }

    throw new Error('No cached data found in database');
  } catch (err) {
    console.warn(`Serverless dustloop DB fetch failed for ${gameId}, reading local fallback:`, err.message);
    try {
      const fallbackFile = path.join(process.cwd(), 'src', 'data', `${gameId}_cached.json`);
      if (fs.existsSync(fallbackFile)) {
        const fileContent = fs.readFileSync(fallbackFile, 'utf8');
        return res.status(200).json(JSON.parse(fileContent));
      }
    } catch (fallbackErr) {
      console.error(`Local fallback read failed for ${gameId}:`, fallbackErr.message);
    }
    return res.status(500).json({ error: err.message });
  }
};
