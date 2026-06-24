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
    const index = html.indexOf('id="Shin:_Ichishiki"');
    if (index === -1) {
      console.log('Heading not found.');
      return;
    }
    console.log(`Heading found at index ${index}. Context:`);
    console.log(html.substring(index, index + 2500));
  } catch (e) {
    console.error(e);
  }
}

run();
