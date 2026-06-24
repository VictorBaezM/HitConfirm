async function run() {
  const url = 'https://www.dustloop.com/w/GGST/A.B.A';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      console.error(`Error:`, response.statusText);
      return;
    }
    const html = await response.text();
    console.log(`HTML fetched, size:`, html.length);
    
    // Let's find occurrences of "after" or "during" in the HTML.
    // Especially looking for input-badge elements or bold text in paragraph tags below headings.
    const regex = /id="([^"]+)"[\s\S]*?<p>([\s\S]*?)<\/p>/g;
    let match;
    console.log(`\n=== Checking headings and first paragraph ===`);
    while ((match = regex.exec(html)) !== null) {
      const headingId = match[1];
      const paragraph = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (/\b(after|during)\b/i.test(paragraph)) {
        console.log(`Heading ID: "${headingId}"`);
        console.log(`  Paragraph: "${paragraph}"`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
