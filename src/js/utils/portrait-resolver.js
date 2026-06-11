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

// Compact MD5 implementation for MediaWiki filename hashing path calculation
function md5(str) {
  var k = [], i = 0;
  for (; i < 64; ) k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
  var s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
  var words = [];
  var strLen = str.length;
  for (i = 0; i < strLen; i++) words[i >> 2] |= (str.charCodeAt(i) & 0xff) << ((i % 4) * 8);
  words[strLen >> 2] |= 0x80 << ((strLen % 4) * 8);
  var wordsLen = ((strLen + 8) >> 6) * 16 + 14;
  words[wordsLen] = strLen * 8;
  for (var j = 0; j < wordsLen; j += 16) {
    var a = h[0], b = h[1], c = h[2], d = h[3];
    for (i = 0; i < 64; i++) {
      var f, g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      var temp = d;
      d = c;
      c = b;
      b = b + RotateLeft(a + f + k[i] + (words[j + g] || 0), s[(i >> 4) * 4 + (i % 4)]);
      a = temp;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
  }
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  var res = "";
  for (i = 0; i < 4; i++) {
    for (var n = 0; n < 4; n++) {
      var val = (h[i] >> (n * 8)) & 0xff;
      res += (val < 16 ? "0" : "") + val.toString(16);
    }
  }
  return res;
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

  const isSuperCombo = (gameId === 'sf6');
  const baseImgUrl = isSuperCombo 
    ? 'https://wiki.supercombo.gg/images' 
    : 'https://www.dustloop.com/wiki/images';
  const baseApiUrl = isSuperCombo 
    ? 'https://wiki.supercombo.gg/api.php' 
    : 'https://www.dustloop.com/wiki/api.php';

  const result = {};

  // 1. Generate direct MD5 CDN URL fallbacks for all files
  cleanNames.forEach(f => {
    let wikiName = f.replace(/\s+/g, '_');
    if (wikiName.length > 0) {
      wikiName = wikiName.charAt(0).toUpperCase() + wikiName.slice(1);
    }
    const hash = md5(wikiName);
    const c1 = hash.charAt(0);
    const c2 = hash.substring(0, 2);
    const titleKey = f.toLowerCase().replace(/[\s_]/g, '');
    result[titleKey] = `${baseImgUrl}/${c1}/${c2}/${wikiName}`;
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

