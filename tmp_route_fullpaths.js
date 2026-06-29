const fs = require('fs');
const path = require('path');
const root = process.cwd();
const routesDir = path.join(root, 'server', 'routes');
const indexText = fs.readFileSync(path.join(routesDir, 'index.js'), 'utf8');
const imports = {};
for (const line of indexText.split(/\r?\n/)) {
  const m = line.match(/^const\s+(\w+)\s*=\s*require\(['\"](\.\/.*?\.routes)['\"]\);/);
  if (m) imports[m[1]] = path.basename(m[2]);
}
const prefixMap = {};
for (const line of indexText.split(/\r?\n/)) {
  const m = line.match(/router\.use\(['\"](.*?)['\"],\s*(\w+)\);/);
  if (m) {
    const prefix = m[1];
    const varName = m[2];
    const fileName = imports[varName];
    if (fileName) prefixMap[fileName] = prefix;
  }
}
const data = JSON.parse(fs.readFileSync(path.join(root, 'tmp_route_parser_output.json'), 'utf8'));
const routes = data.map(item => {
  const prefix = prefixMap[item.file] || '';
  const fullPath = prefix + (item.routePath === '/' ? '' : item.routePath);
  const authType = item.middleware.some(m => m === 'adminOnly' || /roleMiddleware\(\[.*admin.*\]/.test(m) || item.middleware.some(m => m.includes('roleMiddleware([') && m.includes('admin'))) ? 'admin' : item.middleware.some(m => m.includes('authMiddleware') || m === 'adminOnly') ? 'auth' : 'public';
  return {...item, prefix, fullPath: fullPath.replace(/\/+/g, '/'), authType};
});
fs.writeFileSync(path.join(root, 'tmp_route_fullpaths_output.json'), JSON.stringify(routes, null, 2), 'utf8');
console.log('done', routes.length);
