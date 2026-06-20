// src/js/utils/portrait-resolver.js
// Utility to dynamically fetch character portraits from Dustloop/Fandom Wiki.
import { md5 } from './md5.js';

export const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMjAwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFlMWUyNCIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxMjEyMTQiIC8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImFjY2VudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjZiMDAiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDBjYmQ2IiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYmcpIiByeD0iOCIgLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjYWNjZW50KSIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iOCIgb3BhY2l0eT0iMC4zIiAvPjxwYXRoIGQ9Ik00NSw5MCBDMzUsOTAgMjUsOTggMjUsMTE1IEMyNSwxMzAgMzUsMTQ1IDUwLDE0NSBDNTgsMTQ1IDY1LDEzOCA3NSwxMzggQzg1LDEzOCA5MiwxNDUgMTAwLDE0NSBDMTE1LDE0NSAxMjUsMTMwIDEyNSwxMTUgQzEyNSw5OCAxMTUsOTAgMTA1LDkwIEw0NSw5MCBaIiBmaWxsPSIjMmQyZDM4IiAvPjxjaXJjbGUgY3g9IjQ4IiBjeT0iMTE1IiByPSI1IiBmaWxsPSIjNGE0YTVhIiAvPjxjaXJjbGUgY3g9IjYyIiBjeT0iMTE1IiByPSI1IiBmaWxsPSIjNGE0YTVhIiAvPjxjaXJjbGUgY3g9IjEwMiIgY3k9IjExMCIgcj0iNCIgZmlsbD0iI2ZmNmIwMCIgLz48Y2lyY2xlIGN4PSI5MiIgY3k9IjEyMCIgcj0iNCIgZmlsbD0iIzAwY2JkNiIgLz48Y2lyY2xlIGN4PSIxMDIiIGN5PSIxMjAiIHI9IjQiIGZpbGw9IiNmZmQyMDAiIC8+PHRleHQgeD0iNzUiIHk9IjY1IiBmb250LWZhbWlseT0ibW9ub3NwYWNlLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzRhNGE1YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjEiPkhJVENPTkZJUk08L3RleHQ+PHRleHQgeD0iNzUiIHk9IjE3MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNmE2YTdhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OTyBJTUFHRTwvdGV4dD48L3N2Zz4=';

export const WIKI_CONFIG = {
  ggst: { primary: 'https://www.dustloop.com/wiki', fallbacks: [] },
  sf6: { primary: 'https://wiki.supercombo.gg', fallbacks: [] },
  dbfz: { primary: 'https://www.dustloop.com/wiki', fallbacks: [] },
  dbfzce: { primary: 'https://www.dustloop.com/wiki', fallbacks: [] },
  gbvsr: { primary: 'https://www.dustloop.com/wiki', fallbacks: [] },
  dnfd: { primary: 'https://www.dustloop.com/wiki', fallbacks: [] },
  ssbu: { primary: 'https://www.ssbwiki.com', fallbacks: [] },
  t8: { primary: 'https://wavu.wiki', fallbacks: [] }
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
  if (!resolvedUrl || resolvedUrl.startsWith('data:image/svg+xml') || resolvedUrl.includes('placeholder')) {
    return;
  }
  resolvedImageCache[originalKey] = resolvedUrl;
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(resolvedImageCache));
  } catch (e) {}
}

export function getResolvedImageUrl(originalKey) {
  const val = resolvedImageCache[originalKey];
  if (val && (val.startsWith('data:image/svg+xml') || val.includes('placeholder'))) {
    deleteResolvedImageUrl(originalKey);
    return null;
  }
  return val || null;
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
  t8: ['Alisa', 'Asuka', 'Azucena', 'Claudio', 'Devil_Jin', 'Dragunov', 'Eddy', 'Feng', 'Heihachi', 'Hwoarang', 'Jack8', 'Jin', 'Jun', 'Kazuya', 'King', 'Kuma', 'Lars', 'Law', 'Lee', 'Leo', 'Leroy', 'Lidia', 'Lili', 'Nina', 'Panda', 'Paul', 'Raven', 'Reina', 'Shaheen', 'Steve', 'Victor', 'Xiaoyu', 'Yoshimitsu', 'Zafina']
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
  const val = urlCache[cacheKey];
  if (val && (val.startsWith('data:image/svg+xml') || val.includes('placeholder'))) {
    deleteCachedPortraitUrl(gameId, charName);
    return null;
  }
  return val || null;
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
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
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

