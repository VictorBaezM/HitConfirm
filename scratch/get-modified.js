const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = ['node_modules', '.git', '.agents'];

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                results = results.concat(getFiles(filePath));
            }
        } else {
            results.push({ path: filePath, mtime: stat.mtimeMs });
        }
    });
    return results;
}

try {
    const rootDir = process.cwd();
    const files = getFiles(rootDir);
    files.sort((a, b) => b.mtime - a.mtime);
    const top5 = files.slice(0, 5);
    console.log(JSON.stringify(top5, null, 2));
} catch (e) {
    console.error(e);
}
