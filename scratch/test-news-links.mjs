import fs from 'fs';
import path from 'path';

// Target file path: src/js/pages/feed.js
const FEED_JS_PATH = path.resolve('src/js/pages/feed.js');

function runTest() {
  console.log('--- START SIDEBAR WIDGET SECURE LINK TEST ---');
  
  if (!fs.existsSync(FEED_JS_PATH)) {
    console.error(`❌ TEST FAILED: feed.js not found at ${FEED_JS_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(FEED_JS_PATH, 'utf8');

  // Extract the news widget block
  const widgetStartIndex = content.indexOf('id="feed-news-resources-widget"');
  if (widgetStartIndex === -1) {
    console.error('❌ TEST FAILED: #feed-news-resources-widget not found in feed.js');
    process.exit(1);
  }

  // Find the closing boundary
  const widgetContent = content.substring(widgetStartIndex);

  // Use a regex to find all anchor tags in the widget content
  const anchorRegex = /<a\s+([^>]+)>/gi;
  let match;
  const anchors = [];

  while ((match = anchorRegex.exec(widgetContent)) !== null) {
    anchors.push(match[1]);
  }

  console.log(`Extracted ${anchors.length} links inside the widget.`);

  if (anchors.length === 0) {
    console.error('❌ TEST FAILED: No anchor links found in the widget.');
    process.exit(1);
  }

  let failed = false;

  anchors.forEach((attrStr, index) => {
    // Extract href, target, and rel values
    const hrefMatch = /href="([^"]+)"/i.exec(attrStr);
    const targetMatch = /target="([^"]+)"/i.exec(attrStr);
    const relMatch = /rel="([^"]+)"/i.exec(attrStr);

    const href = hrefMatch ? hrefMatch[1] : null;
    const target = targetMatch ? targetMatch[1] : null;
    const rel = relMatch ? relMatch[1] : null;

    console.log(`Checking link ${index + 1}: href="${href}"`);

    // 1. Verify HTTPS
    if (!href || !href.startsWith('https://')) {
      console.error(`❌ LINK ERROR: Href is invalid or not using secure HTTPS: "${href}"`);
      failed = true;
    }

    // 2. Verify Target="_blank"
    if (target !== '_blank') {
      console.error(`❌ SECURITY ERROR: Link missing target="_blank" (got "${target}")`);
      failed = true;
    }

    // 3. Verify rel="noopener noreferrer"
    if (rel !== 'noopener noreferrer') {
      console.error(`❌ SECURITY ERROR: Link missing rel="noopener noreferrer" (got "${rel}") to prevent reverse tab-nabbing.`);
      failed = true;
    }
  });

  if (failed) {
    console.error('❌ TEST FAIL: One or more security link audits failed!');
    process.exit(1);
  } else {
    console.log('✅ TEST PASS: All links are secure HTTPS and protect against reverse tab-nabbing!');
    console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
  }
}

runTest();
