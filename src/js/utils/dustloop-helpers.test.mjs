/**
 * Unit Tests — Dustloop Parsing & Advantage Helpers
 *
 * Test Strategy:
 * - Tier: Pure Logic & Utilities -> Focused Unit Tests
 * - Scope: cleanDustloopValue, parseNumericValue, formatAdvantageBadge
 * - Run with: node src/js/utils/dustloop-helpers.test.mjs
 */

import { cleanDustloopValue, parseNumericValue, formatAdvantageBadge } from './dustloop-helpers.js';

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

// ─── cleanDustloopValue ────────────────────────────────────────────────────────

console.log('\n📦 cleanDustloopValue');

assert(
  'Should strip basic HTML tags',
  cleanDustloopValue('<span style="color: #ff0000">12</span>'),
  '12'
);

assert(
  'Should strip MediaWiki quotes (bold)',
  cleanDustloopValue("'''-6'''"),
  '-6'
);

assert(
  'Should strip nested HTML and formatting together',
  cleanDustloopValue(`<span style="color: #c71c1b" >'''-6'''</span> [<span style="color: #4475ff" >'''+6'''</span>]`),
  '-6 [+6]'
);

assert(
  'Should normalize whitespaces and newlines',
  cleanDustloopValue('  +3 \n\n  [+6]  '),
  '+3 [+6]'
);

assert(
  'Should handle empty values gracefully',
  cleanDustloopValue(''),
  ''
);

assert(
  'Should handle null or undefined gracefully',
  cleanDustloopValue(null),
  ''
);

// ─── parseNumericValue ─────────────────────────────────────────────────────────

console.log('\n📦 parseNumericValue');

assert(
  'Should parse simple positive number',
  parseNumericValue('+3'),
  3
);

assert(
  'Should parse simple negative number',
  parseNumericValue('-5'),
  -5
);

assert(
  'Should parse first number from complex string',
  parseNumericValue('-6 [+6]'),
  -6
);

assert(
  'Should parse numbers with trailing letters',
  parseNumericValue('12f'),
  12
);

assert(
  'Should handle KD (Knockdown) value with 1000 placeholder',
  parseNumericValue('KD'),
  1000
);

assert(
  'Should handle knockdown text with 1000 placeholder',
  parseNumericValue('slide knockdown'),
  1000
);

assert(
  'Should return 0 for text without numbers',
  parseNumericValue('unblockable'),
  0
);

// ─── formatAdvantageBadge ──────────────────────────────────────────────────────

console.log('\n📦 formatAdvantageBadge');

assert(
  'Should format positive advantage with adv-plus badge',
  formatAdvantageBadge('+4'),
  '<span class="adv-badge adv-plus">+4</span>'
);

assert(
  'Should format negative advantage with adv-minus badge',
  formatAdvantageBadge('-8'),
  '<span class="adv-badge adv-minus">-8</span>'
);

assert(
  'Should format zero advantage with adv-neutral badge',
  formatAdvantageBadge('0'),
  '<span class="adv-badge adv-neutral">0</span>'
);

assert(
  'Should format neutral plus-zero',
  formatAdvantageBadge('+0'),
  '<span class="adv-badge adv-neutral">+0</span>'
);

assert(
  'Should return raw text for non-numeric states',
  formatAdvantageBadge('KD'),
  'KD'
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n📊 Test Suite Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
