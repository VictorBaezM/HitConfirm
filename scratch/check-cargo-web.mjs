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
    const regex = /<li><strong>([a-zA-Z0-9_]+)<\/strong> - <tt>/g;
    let match;
    const fields = [];
    while ((match = regex.exec(html)) !== null) {
      fields.push(match[1]);
    }
    console.log(`Fields found for MoveData_GGST:`, fields);
  } catch (e) {
    console.error(e);
  }
}

run();
