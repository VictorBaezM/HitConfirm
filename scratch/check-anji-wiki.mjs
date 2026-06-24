async function run() {
  const url = 'https://www.dustloop.com/w/GGST/Anji_Mito';
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
    
    // Look for occurrences of "Shin: Ichishiki" or "Fujin" or "Fuujin" in the HTML,
    // and grab some context around them.
    const searchTerms = ['Ichishiki', 'Fujin', 'Fuujin'];
    searchTerms.forEach(term => {
      const regex = new RegExp(`([^\\n]{0,100}${term}[^\\n]{0,100})`, 'gi');
      let match;
      console.log(`\n=== Matches for term: ${term} ===`);
      let count = 0;
      while ((match = regex.exec(html)) && count < 10) {
        console.log(`- ${match[1].trim()}`);
        count++;
      }
    });
  } catch (e) {
    console.error(e);
  }
}

run();
