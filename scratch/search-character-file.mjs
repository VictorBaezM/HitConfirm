import fs from 'fs';

const filePath = './src/js/store.js';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const start = 1170;
const end = 1250;
for (let i = start; i < end; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
