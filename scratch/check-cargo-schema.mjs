async function run() {
  const url = 'https://www.dustloop.com/wiki/api.php?action=query&list=cargotables&cttable=MoveData_GGST&format=json';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error:`, response.statusText);
      return;
    }
    const json = await response.json();
    console.log(`Cargo tables query response:`, JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
