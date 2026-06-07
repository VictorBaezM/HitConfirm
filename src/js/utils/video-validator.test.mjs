/**
 * Unit Tests — video-validator.js
 *
 * Test Strategy (Strategic Feature Verification Tester):
 * - Tier: Pure Logic & Utilities → Focused Unit Tests
 * - Core user value: prevent irrelevant videos from being submitted to game-tagged posts
 * - Scope: extractYouTubeVideoId, validateVideoTitle (pure functions, no network)
 * - fetchVideoTitle is NOT unit-tested here (external I/O); it is covered by
 *   manual/integration verification since it wraps a single fetch() call.
 * - Zero redundancy: each edge case appears exactly once.
 *
 * Run with: node --experimental-vm-modules src/js/utils/video-validator.test.mjs
 * (No build step required — uses native ES modules)
 */

import { extractYouTubeVideoId, validateVideoTitle, GAME_VIDEO_KEYWORDS } from './video-validator.js';

// ─── Minimal test harness (no external dependencies) ─────────────────────────

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ ${description}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── extractYouTubeVideoId ────────────────────────────────────────────────────

console.log('\n📦 extractYouTubeVideoId');

// Happy paths
assert(
  'Standard watch URL returns 11-char video ID',
  extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  'dQw4w9WgXcQ'
);
assert(
  'Shortened youtu.be URL returns video ID',
  extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
  'dQw4w9WgXcQ'
);
assert(
  'Embed URL returns video ID',
  extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
  'dQw4w9WgXcQ'
);
assert(
  'Watch URL with extra query params still extracts ID',
  extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLxyz'),
  'dQw4w9WgXcQ'
);

// Security / edge cases
assert(
  'Non-YouTube URL returns null (SSRF prevention)',
  extractYouTubeVideoId('https://evil.com/watch?v=dQw4w9WgXcQ'),
  null
);
assert(
  'Null input returns null',
  extractYouTubeVideoId(null),
  null
);
assert(
  'Empty string returns null',
  extractYouTubeVideoId(''),
  null
);
assert(
  'Plain text (no URL) returns null',
  extractYouTubeVideoId('not a url at all'),
  null
);
assert(
  'URL with no video ID returns null',
  extractYouTubeVideoId('https://www.youtube.com/watch'),
  null
);

// ─── validateVideoTitle ───────────────────────────────────────────────────────

console.log('\n📦 validateVideoTitle — SF6');

assert(
  'Title with game + character → isValid true',
  validateVideoTitle('SF6 Ryu BnB Combo Guide 2024', 'sf6').isValid,
  true
);
assert(
  'Title with full game name + character → isValid true',
  validateVideoTitle('Street Fighter 6 — Cammy Corner Loop Tutorial', 'sf6').isValid,
  true
);
assert(
  'Title missing character keyword → isValid false, hasCharKeyword false',
  (() => { const r = validateVideoTitle('Street Fighter 6 Combo Guide', 'sf6'); return { isValid: r.isValid, hasCharKeyword: r.hasCharKeyword }; })(),
  { isValid: false, hasCharKeyword: false }
);
assert(
  'Title missing game keyword → isValid false, hasGameKeyword false',
  (() => { const r = validateVideoTitle('Ryu BnB Guide', 'sf6'); return { isValid: r.isValid, hasGameKeyword: r.hasGameKeyword }; })(),
  { isValid: false, hasGameKeyword: false }
);
assert(
  'Completely unrelated title → isValid false, both flags false',
  (() => { const r = validateVideoTitle('Funny Cat Compilation', 'sf6'); return { isValid: r.isValid, hasGameKeyword: r.hasGameKeyword, hasCharKeyword: r.hasCharKeyword }; })(),
  { isValid: false, hasGameKeyword: false, hasCharKeyword: false }
);
assert(
  'Case-insensitive matching — uppercase title → isValid true',
  validateVideoTitle('STREET FIGHTER 6 RYU COMBO', 'sf6').isValid,
  true
);

console.log('\n📦 validateVideoTitle — Tekken 8');

assert(
  'Tekken 8 title with character → isValid true',
  validateVideoTitle('Tekken 8 — King Punishment Guide', 't8').isValid,
  true
);
assert(
  'Tekken title with wrong game tag (sf6) → isValid false',
  validateVideoTitle('Tekken 8 — King Combo', 'sf6').isValid,
  false
);

console.log('\n📦 validateVideoTitle — Edge Cases');

assert(
  'Null title → isValid false',
  validateVideoTitle(null, 'sf6').isValid,
  false
);
assert(
  'No game ID → isValid false',
  validateVideoTitle('SF6 Ryu Combo', null).isValid,
  false
);
assert(
  'Unknown game ID → passes through (isValid true — unknown games are not blocked)',
  validateVideoTitle('Some Video', 'unknowngame').isValid,
  true
);

console.log('\n📦 GAME_VIDEO_KEYWORDS structure');

assert(
  'All 4 expected games are present in keyword map',
  Object.keys(GAME_VIDEO_KEYWORDS).sort(),
  ['ggst', 'sf6', 'ssbu', 't8']
);
assert(
  'Each game entry has gameKeywords and characterKeywords arrays',
  Object.values(GAME_VIDEO_KEYWORDS).every(g =>
    Array.isArray(g.gameKeywords) && g.gameKeywords.length > 0 &&
    Array.isArray(g.characterKeywords) && g.characterKeywords.length > 0
  ),
  true
);

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('❌ Test suite FAILED');
  process.exit(1);
} else {
  console.log('✅ All tests passed');
}
