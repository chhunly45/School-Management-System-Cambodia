const fs = require('fs');
const path = require('path');
const routesDir = path.join(process.cwd(), 'server', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).sort();
const entries = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*router\.(get|post|put|patch|delete|use)\s*\(/);
    if (!match) continue;
    const method = match[1].toUpperCase();
    let block = line;
    let depth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
    let j = i;
    while (depth > 0 && j + 1 < lines.length) {
      j++;
      const next = lines[j];
      block += '\n' + next;
      depth += (next.match(/\(/g) || []).length;
      depth -= (next.match(/\)/g) || []).length;
    }
    const argText = block.slice(block.indexOf('(') + 1, block.lastIndexOf(')'));
    const args = [];
    let buff = '';
    let d = 0;
    let inString = false;
    let quote = '';
    let escaped = false;
    for (let k = 0; k < argText.length; k++) {
      const ch = argText[k];
      if (escaped) { buff += ch; escaped = false; continue; }
      if (ch === '\\' && inString) { buff += ch; escaped = true; continue; }
      if (inString) {
        buff += ch;
        if (ch === quote) { inString = false; quote = ''; }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { inString = true; quote = ch; buff += ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') { d++; buff += ch; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { d--; buff += ch; continue; }
      if (ch === ',' && d === 0) { args.push(buff.trim()); buff = ''; continue; }
      buff += ch;
    }
    if (buff.trim()) args.push(buff.trim());
    const first = args[0] || '';
    const pathMatch = first.match(/^['\"](.*)['\"]$/);
    const routePath = pathMatch ? pathMatch[1] : first;
    const middleware = args.slice(pathMatch ? 1 : 0).map(a => a.trim()).filter(Boolean);
    const lineNumber = i + 1;
    entries.push({ file, line: lineNumber, method, routePath, middleware, raw: block.trim().replace(/\s+/g,' ') });
    i = j;
  }
}
fs.writeFileSync('tmp_route_parser_output.json', JSON.stringify(entries, null, 2), 'utf8');
console.log('done', entries.length);
