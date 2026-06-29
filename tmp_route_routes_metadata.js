const fs = require('fs');
const path = require('path');
const root = process.cwd();
const routesDir = path.join(root, 'server', 'routes');
const indexText = fs.readFileSync(path.join(routesDir, 'index.js'), 'utf8');
const prefixMap = {};
for (const match of indexText.matchAll(/router\.use\(['"`](.*?)['"`],\s*([\w\d_]+)\)/g)) {
  const prefix = match[1];
  const varName = match[2];
  const importMatch = new RegExp(`const\\s+${varName}\\s*=\\s*require\\(['\"`](\\./.*?\.routes)['\"`]\\)`);
  const importLine = indexText.match(importMatch);
  if (importLine) {
    const fileName = path.basename(importLine[1]);
    prefixMap[fileName] = prefix;
  }
}

function splitArgs(code) {
  const args = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let quote = '';
  let escaped = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      current += ch;
      escaped = true;
      continue;
    }
    if (inString) {
      current += ch;
      if (ch === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1;
      current += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).sort();
const routes = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const fullText = text;
  let filePrefix = prefixMap[file] || '';
  const routeUsages = [];
  const regex = /router\.(get|post|put|patch|delete|use)\s*\(/g;
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    const method = match[1];
    let start = match.index;
    let pos = regex.lastIndex;
    let depth = 1;
    let inString = false;
    let quote = '';
    let escaped = false;
    while (pos < fullText.length && depth > 0) {
      const ch = fullText[pos];
      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }
      if (ch === '\\' && inString) {
        escaped = true;
        pos++;
        continue;
      }
      if (inString) {
        if (ch === quote) {
          inString = false;
          quote = '';
        }
        pos++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        quote = ch;
        pos++;
        continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      pos++;
    }
    const call = fullText.slice(start, pos);
    const beforeLines = fullText.slice(0, start).split(/\r?\n/);
    const lineNumber = beforeLines.length;
    const callInside = call.replace(/^[^\(]*\(/, '').replace(/\)[^\)]*$/, '');
    const args = splitArgs(callInside);
    const firstArg = args[0] || '';
    const pathMatch = firstArg.match(/^['\"](.*?)['\"]$/);
    const routePath = pathMatch ? pathMatch[1] : firstArg;
    const middleware = args.slice(pathMatch ? 1 : 0).map(arg => arg.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const routePrefix = filePrefix || '';
    const effectivePath = routePath && routePath !== '/' ? `${routePrefix}/${routePath}`.replace(/\/+/g, '/') : `${routePrefix}`.replace(/\/+/g, '/');
    const auth = middleware.some(m => /authMiddleware|adminOnly|roleMiddleware|router\.use\(authMiddleware|router\.use\(.*roleMiddleware/.test(m) || /authMiddleware/.test(m));
    const roleMatch = call.match(/roleMiddleware\(\s*\[([^\]]*)\]/);
    const roles = roleMatch ? roleMatch[1].split(',').map(s => s.trim().replace(/['"\s]/g, '')).filter(Boolean) : [];
    routes.push({ file, method: method.toUpperCase(), path: routePath, prefix: routePrefix, fullPath: effectivePath || routePrefix || routePath, middleware, auth, roles, line: lineNumber, raw: call.trim().replace(/\s+/g, ' ') });
  }
}
console.log(JSON.stringify(routes, null, 2));
