// src/js/utils/portrait-resolver.js
// Utility to dynamically fetch character portraits from Dustloop/Fandom Wiki.

const PORTRAIT_CACHE_KEY = 'hitconfirm_portrait_cache';

// In-memory cache loaded from localStorage if available
let urlCache = {};
try {
  const cached = localStorage.getItem(PORTRAIT_CACHE_KEY);
  if (cached) {
    urlCache = JSON.parse(cached);
  }
} catch (e) {
  console.warn('Failed to load portrait cache from localStorage:', e);
}

/**
 * Normalizes character names to match wiki filename standards.
 * @param {string} gameId
 * @param {string} charName
 * @returns {string}
 */
export function getWikiFilename(gameId, charName) {
  let cleanName = charName;

  // Manual character overrides for special names
  const overrides = {
    ggst: {
      'A.B.A': 'A.B.A',
      'Asuka R#': 'Asuka_R',
      'Bedman?': 'Bedman',
      'Jack-O': 'Jack-O',
      'Ramlethal Valentine': 'Ramlethal_Valentine',
      'Elphelt Valentine': 'Elphelt_Valentine',
      'Zato-1': 'Zato-1'
    },
    dbfz: {
      'Android 16': 'Android_16',
      'Android 17': 'Android_17',
      'Android 18': 'Android_18',
      'Android 21': 'Android_21',
      'Android 21 (Lab Coat)': 'Android_21_Lab_Coat',
      'Broly (DBS)': 'DBS_Broly',
      'Gogeta (SS4)': 'SS4_Gogeta',
      'Gogeta (SSGSS)': 'SSB_Gogeta',
      'Gohan (Adult)': 'Adult_Gohan',
      'Gohan (Teen)': 'Teen_Gohan',
      'Goku (SSGSS)': 'SSB_Goku',
      'Goku (Super Saiyan)': 'SS_Goku',
      'Goku (Ultra Instinct)': 'UI_Goku',
      'Vegeta (SSGSS)': 'SSB_Vegeta',
      'Vegeta (Super Saiyan)': 'SS_Vegeta',
      'Vegito (SSGSS)': 'SSB_Vegito',
      'Zamasu (Fused)': 'Fused_Zamasu'
    }
  };

  // Check if override exists
  if (overrides[gameId] && overrides[gameId][charName]) {
    cleanName = overrides[gameId][charName];
  } else {
    // General sanitization: strip periods, question marks, hashes, and replace spaces/hyphens with underscores
    cleanName = cleanName
      .replace(/[.?#]/g, '')
      .replace(/\s+/g, '_');
  }

  // Prepend game identifier prefix as used on Dustloop
  switch (gameId) {
    case 'ggst':
      return `GGST_${cleanName}_Portrait.png`;
    case 'dbfz':
    case 'dbfzce':
      return `DBFZ_${cleanName}_Portrait.png`;
    case 'gbvsr':
      return `GBVSR_${cleanName}_Portrait.png`;
    case 'dnfd':
      return `DNFD_${cleanName}_Portrait.png`;
    default:
      return `${cleanName}_Portrait.png`;
  }
}

/**
 * Fetch the direct image URL from MediaWiki API.
 * Supports batching in case we want to scale, but works fine per-character.
 * @param {string} gameId
 * @param {string} charName
 * @returns {Promise<string>}
 */
export async function resolvePortraitUrl(gameId, charName) {
  const cacheKey = `${gameId}:${charName}`;
  if (urlCache[cacheKey]) {
    return urlCache[cacheKey];
  }

  const filename = getWikiFilename(gameId, charName);
  const title = `File:${filename}`;

  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*' // Allow cross-origin requests
    });

    const res = await fetch(`https://www.dustloop.com/wiki/api.php?${params.toString()}`);
    if (!res.ok) throw new Error(`MediaWiki status ${res.status}`);

    const json = await res.json();
    const pages = json?.query?.pages || {};
    
    // Find the first page returned
    const pageKey = Object.keys(pages)[0];
    if (pageKey && pages[pageKey].imageinfo && pages[pageKey].imageinfo[0]) {
      const url = pages[pageKey].imageinfo[0].url;
      
      // Save to cache
      urlCache[cacheKey] = url;
      try {
        localStorage.setItem(PORTRAIT_CACHE_KEY, JSON.stringify(urlCache));
      } catch (e) {}
      
      return url;
    }
  } catch (e) {
    console.error(`Failed to resolve portrait for ${charName} on ${gameId}:`, e);
  }

  // Fallback to placeholder if resolution fails
  return '/src/images/placeholder.svg';
}

/**
 * Resolves direct URLs for multiple Wiki file names in a single query.
 * @param {string[]} filenames Semicolon-separated file names.
 * @returns {Promise<Record<string, string>>} Mapping of lowercased stripped filenames to direct URLs.
 */
export async function resolveFileUrls(filenames) {
  if (!filenames || filenames.length === 0) return {};
  
  const cleanNames = filenames.filter(Boolean).map(f => f.trim());
  if (cleanNames.length === 0) return {};

  const titles = cleanNames.map(f => `File:${f}`).join('|');
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: titles,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*'
    });

    const res = await fetch(`https://www.dustloop.com/wiki/api.php?${params.toString()}`);
    if (!res.ok) throw new Error(`MediaWiki status ${res.status}`);

    const json = await res.json();
    const pages = json?.query?.pages || {};
    const result = {};

    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo[0]) {
        const titleKey = page.title.replace(/^File:/i, '').toLowerCase().replace(/[\s_]/g, '');
        result[titleKey] = page.imageinfo[0].url;
      }
    }
    return result;
  } catch (e) {
    console.error('Failed to resolve file URLs:', e);
    return {};
  }
}

