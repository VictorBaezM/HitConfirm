import { parseStrategyHubNotationToHtml } from './combo-parser.js';

console.log('📦 parseStrategyHubNotationToHtml');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper to check if string contains expected HTML snippet
function assertContains(html, snippet, caseId) {
  assert(html.includes(snippet), `[${caseId}] Expected HTML to contain: ${snippet}\nGot: ${html}`);
}

try {
  // Test Case 1: 'or' delimiter
  let html1 = parseStrategyHubNotationToHtml('6D or 4D', 'ggst');
  assertContains(html1, 'class="combo-connector">or<', 'Case 1 - or delimiter');
  assertContains(html1, 'btn-d', 'Case 1 - button D');
  console.log('  ✅ 6D or 4D parses "or" as a connector');

  // Test Case 2: '/' delimiter
  let html2 = parseStrategyHubNotationToHtml('6d/4d', 'ggst');
  assertContains(html2, 'class="combo-connector">/<', 'Case 2 - slash delimiter');
  console.log('  ✅ 6d/4d parses "/" as a connector');

  // Test Case 3: 'CH' adjective (uppercase, no dot)
  let html3 = parseStrategyHubNotationToHtml('CH 6D', 'ggst');
  assertContains(html3, 'class="combo-descriptor-ch">CH<', 'Case 3 - CH adjective');
  console.log('  ✅ CH 6D parses "CH" as a descriptor badge');

  // Test Case 4: 'ch.' prefix (lowercase, with dot)
  let html4 = parseStrategyHubNotationToHtml('ch. 6D', 'ggst');
  assertContains(html4, 'class="combo-descriptor-ch">CH<', 'Case 4 - ch. prefix');
  console.log('  ✅ ch. 6D parses "ch." as a descriptor badge');

  // Test Case 5: 'ws.' prefix
  let html5 = parseStrategyHubNotationToHtml('ws. 236P', 'sf6');
  assertContains(html5, 'class="combo-descriptor">WS<', 'Case 5 - ws. prefix');
  console.log('  ✅ ws. 236P parses "ws." as a descriptor badge');

  // Test Case 6: 'WS' abbreviation
  let html6 = parseStrategyHubNotationToHtml('WS 236P', 'sf6');
  assertContains(html6, 'class="combo-descriptor">WS<', 'Case 6 - WS abbreviation');
  console.log('  ✅ WS 236P parses "WS" as a descriptor badge');

  // Test Case 7: 'FC' stance prefix/abbrev (case-insensitive)
  let html7 = parseStrategyHubNotationToHtml('FC.2', 't8');
  assertContains(html7, 'class="combo-descriptor">FC<', 'Case 7 - FC.2 stance');
  console.log('  ✅ FC.2 parses "FC." as a descriptor badge');

  // Test Case 8: delimiters like '|'
  let html8 = parseStrategyHubNotationToHtml('6D | 4D', 'ggst');
  assertContains(html8, 'class="combo-connector">|<', 'Case 8 - pipe delimiter');
  console.log('  ✅ 6D | 4D parses "|" as a connector');

  // Test Case 9: (air ok) descriptor
  let html9 = parseStrategyHubNotationToHtml('236K (air ok)', 'ggst');
  assertContains(html9, 'class="combo-descriptor">AIR OK<', 'Case 9 - (air ok) attribute');
  console.log('  ✅ 236K (air ok) parses "(air ok)" as a descriptor badge');

  // Test Case 10: air only descriptor (unbracketed)
  let html10 = parseStrategyHubNotationToHtml('air only 236S', 'ggst');
  assertContains(html10, 'class="combo-descriptor">AIR ONLY<', 'Case 10 - air only attribute');
  console.log('  ✅ air only 236S parses "air only" as a descriptor badge');

  // Test Case 11: parenthesized state descriptor (Without Yoyo)
  let html11 = parseStrategyHubNotationToHtml('214K (Without Yoyo)', 'ggst');
  assertContains(html11, 'class="combo-descriptor">WITHOUT YOYO<', 'Case 11 - Without Yoyo');
  console.log('  ✅ 214K (Without Yoyo) parses "(Without Yoyo)" as a descriptor badge');

  // Test Case 12: parenthesized (Hold, OK) descriptor
  let html12 = parseStrategyHubNotationToHtml('236K (Hold, OK)', 'ggst');
  assertContains(html12, 'class="combo-descriptor">HOLD OK<', 'Case 12 - (Hold, OK)');
  console.log('  ✅ 236K (Hold, OK) parses "(Hold, OK)" as "HOLD OK" descriptor badge');

  // Test Case 13: Hold keyword prefix
  let html13 = parseStrategyHubNotationToHtml('Hold HP', 'sf6');
  assertContains(html13, 'class="combo-descriptor">HOLD<', 'Case 13 - Hold keyword');
  console.log('  ✅ Hold HP parses "Hold" as a descriptor badge');

  // Test Case 14: parenthesized (Hold OK)
  let html14 = parseStrategyHubNotationToHtml('236X (Hold OK)', 'ggst');
  assertContains(html14, 'class="combo-descriptor">HOLD OK<', 'Case 14 - (Hold OK)');
  console.log('  ✅ 236X (Hold OK) parses "(Hold OK)" as a descriptor badge');

  console.log('\n──────────────────────────────────────────────────');
  console.log('Results: 14 passed, 0 failed');
  console.log('✅ All tests passed\n');

} catch (err) {
  console.error('❌ Test failed!');
  console.error(err);
  process.exit(1);
}
