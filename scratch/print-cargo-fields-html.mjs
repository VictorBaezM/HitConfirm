async function run() {
  const url = 'https://www.dustloop.com/wiki/index.php?title=Special:CargoTables/MoveData_GGST';
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
    // Look for lists or tables in the HTML
    const index = html.indexOf('Field list:');
    if (index !== -1) {
      console.log(`Found 'Field list:' at index ${index}:`);
      console.log(html.substring(index, index + 2000).replace(/<[^>]*>/g, '').trim());
    } else {
      console.log(`'Field list:' not found. Searching for 'Fields' or 'Table schema'...`);
      const searchTerms = ['table', 'fields', 'columns', 'chara', 'startup', 'onBlock'];
      searchTerms.forEach(term => {
        const regex = new RegExp(`([^\\n]{0,80}${term}[^\\n]{0,80})`, 'gi');
        const match = regex.exec(html);
        if (match) {
          console.log(`Found term '${term}':`, match[0].trim());
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
