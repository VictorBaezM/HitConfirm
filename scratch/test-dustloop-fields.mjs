async function run() {
  const fields = [
    'chara', 'name', 'input', 'damage', 'guard', 'startup', 'active', 
    'recovery', 'onBlock', 'onHit', 'level', 'counter', 'notes', 'type', 
    'cancel', 'caption'
  ];
  
  const url = `https://www.dustloop.com/wiki/api.php?action=cargoquery&tables=MoveData_GGST&fields=${fields.join(',')}&where=chara='A.B.A'%20AND%20name%20LIKE%20'%25Bonding%25'&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log('Cargo Query Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error querying Dustloop Cargo:', err);
  }
}

run();
