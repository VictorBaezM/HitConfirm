import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(filepath, filelist);
      }
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const files = walk('./src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('parseStrategyHubNotationToHtml')) {
    console.log(`Found call in: ${file}`);
  }
});
