import fs from 'fs';

const files = [
  { path: './src/data/sf6_cached.json', name: 'SF6' },
  { path: './src/data/t8_cached.json', name: 'Tekken 8' }
];

files.forEach(file => {
  if (!fs.existsSync(file.path)) {
    console.log(`${file.name} local cache file not found.`);
    return;
  }

  const moves = JSON.parse(fs.readFileSync(file.path, 'utf8'));
  console.log(`\n=== Game: ${file.name} (Total moves: ${moves.length}) ===`);

  const inputsWithParentheses = moves.filter(m => m.input && m.input.includes('('));
  console.log(`Inputs with parentheses (count: ${inputsWithParentheses.length}):`);
  inputsWithParentheses.slice(0, 20).forEach(m => {
    console.log(`- Chara: ${m.chara}, Name: ${m.name}, Input: "${m.input}"`);
  });

  const airHoldOk = moves.filter(m => {
    const inputLower = String(m.input || '').toLowerCase();
    const nameLower = String(m.name || '').toLowerCase();
    return inputLower.includes('air') || inputLower.includes('hold') || nameLower.includes('air') || nameLower.includes('hold');
  });
  console.log(`Inputs/Names containing 'air' or 'hold' (count: ${airHoldOk.length}):`);
  airHoldOk.slice(0, 10).forEach(m => {
    console.log(`- Chara: ${m.chara}, Name: ${m.name}, Input: "${m.input}"`);
  });
});
