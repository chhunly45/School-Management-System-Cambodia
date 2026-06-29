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
    if (imports[varName]) prefixMap[imports[varName]] = prefix;
  }
}
const data = JSON.parse(fs.readFileSync(path.join(root, 'tmp_route_parser_output.json'), 'utf8'));
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).sort();
const globalInfo = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const info = { authMiddleware: false, roleMiddleware: [], usesAuthRole: false, usesAuth: false, usesAdminOnly: false, usesSellerOnly: false };
  for (const line of lines) {
    if (/router\.use\(authMiddleware\)/.test(line)) info.usesAuth = true;
    if (/router\.use\(authMiddleware,\s*roleMiddleware\(\['([^']*)'\]\)\)/.test(line)) {
      info.usesAuth = true;
      const roles = [...line.matchAll(/roleMiddleware\(\['([^']*)'\]\)/g)].map(m => m[1]);
      for (const r of roles) info.roleMiddleware.push(r);
      info.usesAuthRole = true;
    }
    if (/\badminOnly\b/.test(line)) info.usesAdminOnly = true;
    if (/router\.use\(roleMiddleware\(\['seller'\]\)\)/.test(line) || /router\.use\(authMiddleware,\s*roleMiddleware\(\['seller'\]\)\)/.test(line)) info.usesSellerOnly = true;
  }
  globalInfo[file] = info;
}
function authTypeForRoute(item) {
  const fileInfo = globalInfo[item.file] || {};
  const m = item.middleware.join(' ');
  if (/\badminOnly\b/.test(m) || /roleMiddleware\(\['.*admin.*'\]\)/.test(m) || /roleMiddleware\(\[.*admin.*\]\)/.test(m)) return 'admin';
  if (/roleMiddleware\(\['seller'\]\)/.test(m)) return 'seller';
  if (/authMiddleware/.test(m)) {
    if (/roleMiddleware\(\['.*seller.*'\]\)/.test(m)) return 'seller';
    if (/roleMiddleware\(\['.*admin.*'\]\)/.test(m)) return 'admin';
    return 'auth';
  }
  if (fileInfo.usesAuthRole && fileInfo.roleMiddleware.includes('admin')) return 'admin';
  if (fileInfo.usesAuthRole && fileInfo.roleMiddleware.includes('seller')) return 'seller';
  if (fileInfo.usesAuth) return 'auth';
  return 'public';
}
const routes = data.map(item => {
  const prefix = prefixMap[item.file] || '';
  const routePath = item.routePath === '/' ? '' : item.routePath;
  const fullPath = (`${prefix}${routePath}`).replace(/\/+/g, '/');
  return { ...item, prefix, fullPath: fullPath || prefix, authType: authTypeForRoute(item) };
});
fs.writeFileSync(path.join(root, 'tmp_route_inventory_full.json'), JSON.stringify(routes, null, 2), 'utf8');
const counts = { total: 0, public: 0, auth: 0, admin: 0, seller: 0, other: 0 };
for (const r of routes) {
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method)) continue;
  counts.total += 1;
  if (counts[r.authType] !== undefined) counts[r.authType] += 1;
  else counts.other += 1;
}
const byGroup = {};
for (const r of routes) {
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method)) continue;
  const group = (() => {
    if (r.prefix.startsWith('/students')) return 'Students';
    if (r.prefix.startsWith('/teachers')) return 'Teachers';
    if (r.prefix.startsWith('/attendances')) return 'Attendance';
    if (r.prefix.startsWith('/payments')) return 'Payments';
    if (r.prefix.startsWith('/finance')) return 'Finance';
    if (r.prefix.startsWith('/certificates')) return 'Certificates';
    if (r.prefix.startsWith('/transport') && !r.prefix.startsWith('/transport-assignments')) return 'Transport';
    if (r.prefix.startsWith('/fuel-records')) return 'Fuel';
    if (r.prefix.startsWith('/expenses')) return 'Expenses';
    if (r.prefix.startsWith('/school-dashboard')) return 'Dashboard';
    if (r.prefix.startsWith('/auth') || r.prefix.startsWith('/users') || r.prefix.startsWith('/verification')) return 'Authentication / Users';
    if (r.prefix.startsWith('/categories') || r.prefix.startsWith('/products') || r.prefix.startsWith('/favorites') || r.prefix.startsWith('/upload') || r.prefix.startsWith('/banners') || r.prefix.startsWith('/chats') || r.prefix.startsWith('/seller-analytics') || r.prefix.startsWith('/traffic-analytics') || r.prefix.startsWith('/promotions') || r.prefix.startsWith('/reviews') || r.prefix.startsWith('/notifications') || r.prefix.startsWith('/locations') || r.prefix.startsWith('/reports')) return 'Legacy Marketplace';
    if (r.prefix.startsWith('/admin')) return 'Admin';
    if (r.prefix.startsWith('/academic-records') || r.prefix.startsWith('/academic-years') || r.prefix.startsWith('/grades') || r.prefix.startsWith('/subjects') || r.prefix.startsWith('/classes') || r.prefix.startsWith('/employee-attendances') || r.prefix.startsWith('/vehicles') || r.prefix.startsWith('/routes') || r.prefix.startsWith('/transport-assignments') || r.prefix.startsWith('/school-settings')) return 'School Admin';
    return 'Other';
  })();
  if (!byGroup[group]) byGroup[group] = [];
  byGroup[group].push(r);
}
fs.writeFileSync(path.join(root, 'tmp_route_inventory_summary.json'), JSON.stringify({ counts, groups: byGroup }, null, 2), 'utf8');
console.log(JSON.stringify({ counts, groups: Object.keys(byGroup).sort() }, null, 2));
