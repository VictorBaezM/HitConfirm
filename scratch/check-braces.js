import fs from 'fs';

const content = fs.readFileSync('src/js/pages/profile.js', 'utf8');
let openBraces = 0;
const lines = content.split('\n');

lines.forEach((line, index) => {
  const lineNum = index + 1;
  for (let char of line) {
    if (char === '{') {
      openBraces++;
      console.log(`${lineNum}: Open brace (${openBraces})`);
    } else if (char === '}') {
      openBraces--;
      console.log(`${lineNum}: Close brace (${openBraces})`);
    }
  }
});
