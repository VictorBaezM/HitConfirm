/**
 * Video Validator Utility — video-validator.js
 *
 * Provides YouTube oEmbed title fetching and game-relevance keyword checking
 * for the HitConfirm post creator form.
 *
 * Security note: The oEmbed URL is built only from a validated YouTube video ID,
 * never from raw user input, preventing SSRF or open-redirect via URL injection.
 * All returned strings are treated as untrusted and must be HTML-escaped before rendering.
 */

import { escapeHtml } from './security.js';

/**
 * Per-game keyword dictionary.
 * Keys match the game IDs used in store.getGames().
 * Each entry contains the human-readable game name and an array of lowercase keywords
 * that are expected to appear in a legitimate video title for that game.
 * Both the game name AND at least one character keyword must be present for full validation.
 *
 * @type {Object.<string, {label: string, gameKeywords: string[], characterKeywords: string[]}>}
 */
export const GAME_VIDEO_KEYWORDS = {
  sf6: {
    label: 'Street Fighter 6',
    gameKeywords: ['street fighter', 'sf6', 'sf 6', 'capcom'],
    characterKeywords: [
      'ryu', 'ken', 'chun-li', 'chun li', 'cammy', 'guile', 'blanka', 'dhalsim',
      'e. honda', 'honda', 'zangief', 'manon', 'marisa', 'jp', 'dee jay', 'deejay',
      'lily', 'luke', 'jamie', 'kimberly', 'juri', 'rashid', 'a.k.i', 'aki',
      'ed', 'akuma', 'bison', 'm. bison', 'terry', 'mai', 'elena'
    ]
  },
  t8: {
    label: 'Tekken 8',
    gameKeywords: ['tekken 8', 'tekken8', 'tekken'],
    characterKeywords: [
      'jin', 'kazuya', 'paul', 'law', 'king', 'yoshimitsu', 'nina', 'hwoarang',
      'xiaoyu', 'steve', 'bryan', 'jack', 'asuka', 'lili', 'lee', 'lars',
      'alisa', 'claudio', 'shaheen', 'katarina', 'lucky chloe', 'feng',
      'leo', 'dragunov', 'zafina', 'leroy', 'fahkumram', 'victor', 'reina',
      'azucena', 'raven', 'devil jin', 'jun', 'heihachi', 'eddy'
    ]
  },
  ggst: {
    label: 'Guilty Gear -Strive-',
    gameKeywords: ['guilty gear', 'ggst', 'strive', 'gg strive'],
    characterKeywords: [
      'sol', 'ky', 'may', 'axl', 'chipp', 'potemkin', 'faust', 'millia',
      'zato', 'ramlethal', 'leo', 'nagoriyuki', 'giovanna', 'anji', 'i-no',
      'goldlewis', 'jack-o', 'happy chaos', 'baiken', 'testament', 'bridget',
      'sin', 'bedman', 'asuka', 'johnny', 'elphelt', 'a.b.a', 'slayer', 'dizzy'
    ]
  },
  ssbu: {
    label: 'Super Smash Bros. Ultimate',
    gameKeywords: ['smash bros', 'smash ultimate', 'ssbu', 'super smash'],
    characterKeywords: [
      'mario', 'pikachu', 'link', 'samus', 'kirby', 'fox', 'ness', 'jigglypuff',
      'marth', 'mewtwo', 'roy', 'peach', 'bowser', 'ice climbers', 'sheik',
      'zelda', 'young link', 'ganondorf', 'falco', 'pichu', 'mr. game', 'snake',
      'ike', 'pokemon trainer', 'diddy', 'lucas', 'sonic', 'king dedede', 'olimar',
      'lucario', 'rob', 'meta knight', 'pit', 'zero suit', 'wario', 'wolf',
      'toon link', 'villager', 'mega man', 'wii fit', 'rosalina', 'little mac',
      'greninja', 'mii', 'palutena', 'pac-man', 'robin', 'shulk', 'bowser jr',
      'duck hunt', 'ryu', 'ken', 'cloud', 'corrin', 'bayonetta', 'inkling',
      'ridley', 'simon', 'richter', 'king k. rool', 'isabelle', 'incineroar',
      'joker', 'hero', 'banjo', 'terry', 'byleth', 'min min', 'steve', 'sephiroth',
      'pyra', 'mythra', 'kazuya', 'sora'
    ]
  }
};

/**
 * Extracts the YouTube video ID from a full YouTube URL.
 * Supports standard watch URLs, shortened youtu.be links, and embed URLs.
 * Returns null if the URL does not match a recognized YouTube format.
 *
 * @param {string} url - Raw URL string from the user input field.
 * @returns {string|null} The 11-character video ID, or null if not a valid YouTube URL.
 * @example
 * extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 * // returns 'dQw4w9WgXcQ'
 */
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Allowlist: only accept known YouTube domains
  const ALLOWED_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'];
  let hostname;
  try {
    hostname = new URL(trimmed).hostname;
  } catch {
    return null; // Not a valid URL at all
  }

  if (!ALLOWED_HOSTS.includes(hostname)) return null;

  // Match standard watch URL: ?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Match shortened URL: youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Match embed URL: /embed/ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Fetches the video title from YouTube's oEmbed API using only the validated video ID.
 * The video ID is never passed as raw user input to the fetch — it is validated first.
 * Returns null on any network or parsing error (treated as graceful degradation).
 *
 * @param {string} videoId - A validated 11-character YouTube video ID.
 * @returns {Promise<string|null>} The video title string, or null on failure.
 * @example
 * const title = await fetchVideoTitle('dQw4w9WgXcQ');
 * // returns 'Rick Astley - Never Gonna Give You Up (Official Music Video)'
 */
export async function fetchVideoTitle(videoId) {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;

  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null; // Network failure — degrade gracefully, do not block submission
  }
}

/**
 * Validates whether a video title meets HitConfirm's relevance requirements:
 * the title must contain at least one game-related keyword AND at least one
 * character-related keyword for the selected game.
 *
 * All string comparisons are case-insensitive.
 * Returns a structured result object, never throws.
 *
 * @param {string} title     - The raw video title returned from the oEmbed API.
 * @param {string} gameId    - The game ID selected by the user (e.g. 'sf6', 't8').
 * @returns {{ isValid: boolean, hasGameKeyword: boolean, hasCharKeyword: boolean, label: string }}
 *   - isValid:        true if both game and character keywords were found.
 *   - hasGameKeyword: true if a game name keyword was found in the title.
 *   - hasCharKeyword: true if a character name keyword was found in the title.
 *   - label:          Human-readable game name for display in UI messages.
 * @example
 * validateVideoTitle('SF6 Ryu BnB Combo Guide', 'sf6');
 * // returns { isValid: true, hasGameKeyword: true, hasCharKeyword: true, label: 'Street Fighter 6' }
 */
export function validateVideoTitle(title, gameId) {
  const fallback = { isValid: false, hasGameKeyword: false, hasCharKeyword: false, label: gameId };

  if (!title || !gameId) return fallback;

  const gameData = GAME_VIDEO_KEYWORDS[gameId];
  if (!gameData) return { ...fallback, isValid: true }; // Unknown game — pass through

  const lowerTitle = title.toLowerCase();

  const hasGameKeyword = gameData.gameKeywords.some(kw => lowerTitle.includes(kw));
  const hasCharKeyword = gameData.characterKeywords.some(kw => lowerTitle.includes(kw));

  return {
    isValid: hasGameKeyword && hasCharKeyword,
    hasGameKeyword,
    hasCharKeyword,
    label: gameData.label
  };
}
