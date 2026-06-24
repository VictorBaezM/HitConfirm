async function run() {
  const url = 'https://www.dustloop.com/wiki/api.php?action=cargoquery&tables=MoveData_GGST&limit=1&format=json';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error:`, response.statusText);
      return;
    }
    const json = await response.json();
    console.log(`Cargo query sample response:`, JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
