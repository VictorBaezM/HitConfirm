// src/js/utils/portrait-resolver.js
// Utility to dynamically fetch character portraits from Dustloop/Fandom Wiki.
import { md5 } from './md5.js';

export const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200" width="150" height="200"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1e24" /><stop offset="100%" stop-color="%23121214" /></linearGradient><linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ff6b00" /><stop offset="100%" stop-color="%2300cbd6" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)" rx="8" /><rect width="100%" height="100%" fill="none" stroke="url(%23accent)" stroke-width="2" rx="8" opacity="0.3" /><path d="M45,90 C35,90 25,98 25,115 C25,130 35,145 50,145 C58,145 65,138 75,138 C85,138 92,145 100,145 C115,145 125,130 125,115 C125,98 115,90 105,90 L45,90 Z" fill="%232d2d38" /><circle cx="48" cy="115" r="5" fill="%234a4a5a" /><circle cx="62" cy="115" r="5" fill="%234a4a5a" /><circle cx="102" cy="110" r="4" fill="%23ff6b00" /><circle cx="92" cy="120" r="4" fill="%2300cbd6" /><circle cx="102" cy="120" r="4" fill="%23ffd200" /><text x="75" y="65" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="%234a4a5a" text-anchor="middle" letter-spacing="1">HITCONFIRM</text><text x="75" y="170" font-family="sans-serif" font-size="10" font-weight="bold" fill="%236a6a7a" text-anchor="middle">NO IMAGE</text></svg>';

export const WIKI_CONFIG = {
  ggst: { primary: 'https://www.dustloop.com/wiki', fallbacks: ['https://wiki.supercombo.gg', 'https://wiki.gbl.gg'] },
  sf6: { primary: 'https://wiki.supercombo.gg', fallbacks: ['https://www.dustloop.com/wiki', 'https://wiki.gbl.gg'] },
  dbfz: { primary: 'https://www.dustloop.com/wiki', fallbacks: ['https://wiki.gbl.gg'] },
  dbfzce: { primary: 'https://www.dustloop.com/wiki', fallbacks: ['https://wiki.gbl.gg'] },
  gbvsr: { primary: 'https://www.dustloop.com/wiki', fallbacks: ['https://wiki.gbl.gg'] },
  dnfd: { primary: 'https://www.dustloop.com/wiki', fallbacks: ['https://wiki.gbl.gg'] },
  ssbu: { primary: 'https://www.ssbwiki.com', fallbacks: ['https://www.dustloop.com/wiki'] },
  t8: { primary: 'https://wavu.wiki', fallbacks: ['https://www.dustloop.com/wiki'] }
};

const IMAGE_CACHE_KEY = 'hitconfirm_resolved_image_cache';
let resolvedImageCache = {};
try {
  const cached = localStorage.getItem(IMAGE_CACHE_KEY);
  if (cached) {
    resolvedImageCache = JSON.parse(cached);
  }
} catch (e) {
  console.warn('Failed to load resolved image cache:', e);
}

export function saveResolvedImageUrl(originalKey, resolvedUrl) {
  resolvedImageCache[originalKey] = resolvedUrl;
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(resolvedImageCache));
  } catch (e) {}
}

export function getResolvedImageUrl(originalKey) {
  return resolvedImageCache[originalKey] || null;
}

export function deleteResolvedImageUrl(originalKey) {
  delete resolvedImageCache[originalKey];
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(resolvedImageCache));
  } catch (e) {}
}

export function deleteCachedPortraitUrl(gameId, charName) {
  const cacheKey = `${gameId}:${charName}`;
  delete urlCache[cacheKey];
  try {
    localStorage.setItem(PORTRAIT_CACHE_KEY, JSON.stringify(urlCache));
  } catch (e) {}
}

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

export const KNOWN_LOCAL_PORTRAITS = {
  ggst: ['Sol_Badguy'],
  sf6: ['Ryu'],
  ssbu: ['Mario'],
  t8: ['Kazuya']
};

export function getLocalPortraitUrl(gameId, charName) {
  const sanitized = charName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const list = KNOWN_LOCAL_PORTRAITS[gameId];
  if (list && list.includes(sanitized)) {
    return `src/images/characters/${gameId}/${sanitized}.png`;
  }
  return null;
}

/**
 * Synchronously retrieves a cached portrait URL if it exists in the URL cache.
 * @param {string} gameId
 * @param {string} charName
 * @returns {string|null}
 */
export function getCachedPortraitUrl(gameId, charName) {
  const cacheKey = `${gameId}:${charName}`;
  return urlCache[cacheKey] || null;
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
      'Android 21 (Lab Coat)': 'Android_21_(Lab_Coat)',
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
    },
    dbfzce: {
      'Adult Gohan': 'Gohan_(Adult)',
      'Teen Gohan': 'Gohan_(Teen)',
      'DBS Broly': 'Broly_(DBS)',
      'GT Goku': 'Goku_(GT)',
      'SS Goku': 'Goku_(Super_Saiyan)',
      'SS Vegeta': 'Vegeta_(Super_Saiyan)',
      'SS4 Gogeta': 'Gogeta_(SS4)',
      'SSB Gogeta': 'Gogeta_(SSGSS)',
      'SSB Goku': 'Goku_(SSGSS)',
      'SSB Vegeta': 'Vegeta_(SSGSS)',
      'SSB Vegito': 'Vegito_(SSGSS)',
      'UI Goku': 'Goku_(Ultra_Instinct)',
      'Fused Zamasu': 'Zamasu_(Fused)',
      'Android 16': 'Android_16',
      'Android 17': 'Android_17',
      'Android 18': 'Android_18',
      'Android 21': 'Android_21'
    },
    gbvsr: {
      'Djeeta (EX)': 'Djeeta',
      'Gran (EX)': 'Gran',
      'Narmaya (EX)': 'Narmaya'
    },
    ssbu: {
      'Ice Climancers': 'Ice_Climbers',
      'Mr. Game & Watch': 'Mr._Game_&_Watch',
      'Rosalina & Luma': 'Rosalina_&_Luma',
      'Banjo & Kazooie': 'Banjo_&_Kazooie'
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
    case 'sf6':
      return `SF6_${cleanName}_Portrait.png`;
    case 't8':
      return `${cleanName}_portrait.png`;
    case 'ssbu':
      return `${cleanName}_SSBU.png`;
    default:
      return `${cleanName}_Portrait.png`;
  }
}

/**
 * Resolves the MediaWiki API URL for the given game.
 * @param {string} gameId
 * @returns {string}
 */
export function getWikiApiUrl(gameId) {
  const config = WIKI_CONFIG[gameId];
  if (!config) return 'https://www.dustloop.com/wiki/api.php';
  const primary = config.primary;
  if (primary.includes('wavu.wiki')) {
    return 'https://wavu.wiki/w/api.php';
  }
  return `${primary}/api.php`;
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
  const apiUrl = getWikiApiUrl(gameId);

  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*' // Allow cross-origin requests
    });

    const res = await fetch(`${apiUrl}?${params.toString()}`);
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
  return PLACEHOLDER_SVG;
}



/**
 * Constructs the direct MediaWiki MD5-hashed CDN URL for a given filename.
 * @param {string} filename The file name on the wiki.
 * @param {string} gameId The active game ID.
 * @returns {string} The constructed CDN URL.
 */
export function constructCdnUrl(filename, gameId = 'ggst', customBaseUrl = null) {
  if (!filename) return '';
  let baseImgUrl;
  if (customBaseUrl) {
    baseImgUrl = customBaseUrl.endsWith('/images') ? customBaseUrl : `${customBaseUrl}/images`;
  } else {
    const isSuperCombo = (gameId === 'sf6');
    const isSmash = (gameId === 'ssbu');
    const isTekken = (gameId === 't8');
    
    if (isSuperCombo) {
      baseImgUrl = 'https://wiki.supercombo.gg/images';
    } else if (isSmash) {
      baseImgUrl = 'https://ssb.wiki.gallery/images';
    } else if (isTekken) {
      baseImgUrl = 'https://wavu.wiki/w/images';
    } else {
      baseImgUrl = 'https://www.dustloop.com/wiki/images';
    }
  }

  let wikiName = filename.replace(/\s+/g, '_');
  if (wikiName.length > 0) {
    wikiName = wikiName.charAt(0).toUpperCase() + wikiName.slice(1);
  }
  const hash = md5(wikiName);
  const c1 = hash.charAt(0);
  const c2 = hash.substring(0, 2);
  return `${baseImgUrl}/${c1}/${c2}/${wikiName}`;
}

/**
 * Resolves direct URLs for multiple Wiki file names in a single query.
 * Falls back to direct MD5 CDN URL construction if the MediaWiki API fails.
 * @param {string[]} filenames Semicolon-separated file names.
 * @param {string} gameId The active game ID.
 * @returns {Promise<Record<string, string>>} Mapping of lowercased stripped filenames to direct URLs.
 */
export async function resolveFileUrls(filenames, gameId = 'ggst') {
  if (!filenames || filenames.length === 0) return {};
  
  const cleanNames = filenames.filter(Boolean).map(f => f.trim());
  if (cleanNames.length === 0) return {};

  const baseApiUrl = getWikiApiUrl(gameId);
  const result = {};

  // 1. Generate direct MD5 CDN URL fallbacks for all files
  cleanNames.forEach(f => {
    const titleKey = f.toLowerCase().replace(/[\s_]/g, '');
    result[titleKey] = constructCdnUrl(f, gameId);
  });

  // 2. Attempt to resolve official URLs from the MediaWiki API
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

    const res = await fetch(`${baseApiUrl}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const pages = json?.query?.pages || {};

      for (const pageId in pages) {
        const page = pages[pageId];
        if (page.imageinfo && page.imageinfo[0]) {
          const titleKey = page.title.replace(/^File:/i, '').toLowerCase().replace(/[\s_]/g, '');
          result[titleKey] = page.imageinfo[0].url;
        }
      }
    }
  } catch (e) {
    console.warn(`MediaWiki API resolve failed for ${gameId}, using direct CDN fallbacks:`, e);
  }
  
  return result;
}

