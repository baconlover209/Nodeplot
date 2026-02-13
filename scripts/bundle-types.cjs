const fs = require('fs');
const path = require('path');

const typesDir = path.resolve(__dirname, '../node_modules/@types/plotly.js');
const outDir = path.resolve(__dirname, '../src/types');
const outFile = path.join(outDir, 'plotly-types.json');

const files = {};

function readDir(dir, relativeOp) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(relativeOp, item).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            readDir(fullPath, relativePath);
        } else if (item.endsWith('.d.ts')) {
            files['file:///node_modules/@types/plotly.js/' + relativePath] = fs.readFileSync(fullPath, 'utf8');
        }
    });
}

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

console.log('Reading types from:', typesDir);
readDir(typesDir, '');

fs.writeFileSync(outFile, JSON.stringify(files, null, 2));
console.log('Bundled types to:', outFile);
console.log('Total files:', Object.keys(files).length);
