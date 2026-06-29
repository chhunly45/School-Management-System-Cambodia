const fs = require('fs');
const path = require('path');
const util = require('util');
const dir = path.join(process.cwd(), 'server', 'routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const routeRegex = /(router\.(get|post|put|patch|delete|use)\s*\([^\)]*\))/g;
const out = [];
for (const file of files) {
  const filePath = path.join(dir, file);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/router\.(get|post|put|patch|delete|use)\s*\(/.test(line)) {
      out.push({file, line: i + 1, text: line.trim()});
    }
  }
}
console.log(JSON.stringify(out, null, 2));
