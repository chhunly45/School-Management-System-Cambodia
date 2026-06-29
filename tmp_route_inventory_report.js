const fs = require('fs');
const path = require('path');
const root = process.cwd();
const routesDir = path.join(root, 'server', 'routes');
const indexPath = path.join(routesDir, 'index.js');
const indexText = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
const imports = {};
for (const line of indexText.split(/\r?\n/)) {
  const m = line.match(/^const\s+(\w+)\s*=\s*require\(['\"](\.\/.*?\.routes)['\"]\);/);
  if (m) {
    let fileName = path.basename(m[2]);
    if (!fileName.endsWith('.js')) fileName += '.js';
    imports[m[1]] = fileName;
  }
}
const prefixMap = {};
for (const line of indexText.split(/\r?\n/)) {
  const m = line.match(/router\.use\(['\"](.*?)['\"],\s*(\w+)\);/);
  if (m) {
    const prefix = m[1];
    const varName = m[2];
    const fileName = imports[varName];
    if (fileName) {
      if (!prefixMap[fileName]) prefixMap[fileName] = [];
      if (!prefixMap[fileName].includes(prefix)) prefixMap[fileName].push(prefix);
    }
  }
}
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).sort();
const entries = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*router\.(get|post|put|patch|delete|use)\s*\(/i);
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
    let depth2 = 0;
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
      if (ch === '"' || ch === '\'' || ch === '`') { inString = true; quote = ch; buff += ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') { depth2++; buff += ch; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { depth2--; buff += ch; continue; }
      if (ch === ',' && depth2 === 0) { args.push(buff.trim()); buff = ''; continue; }
      buff += ch;
    }
    if (buff.trim()) args.push(buff.trim());
    const first = args[0] || '';
    const pathMatch = first.match(/^['\"](.*)['\"]$/);
    const routePath = pathMatch ? pathMatch[1] : first;
    const middleware = args.slice(pathMatch ? 1 : 0).map(a => a.trim()).filter(Boolean);
    entries.push({ file, line: i + 1, method, routePath, middleware, raw: block.trim().replace(/\s+/g, ' ') });
    i = j;
  }
}
const appMount = '/api';
function normalizePrefix(prefix) {
  if (!prefix) return '';
  if (!prefix.startsWith('/')) prefix = '/' + prefix;
  return prefix.replace(/\/+/g, '/').replace(/\/$/, '');
}
function normalizePath(routePath) {
  if (!routePath || routePath === '/') return '';
  if (!routePath.startsWith('/')) routePath = '/' + routePath;
  return routePath.replace(/\/+/g, '/');
}
const filePolicies = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const policy = { auth: false, admin: false, seller: false };
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/router\.use\(/.test(trimmed)) {
      if (/authMiddleware/.test(trimmed)) policy.auth = true;
      if (/roleMiddleware\(\s*\['[^\]]*admin[^\]]*'\]\)/.test(trimmed)) {
        policy.auth = true;
        policy.admin = true;
      }
      if (/roleMiddleware\(\s*\['[^\]]*seller[^\]]*'\]\)/.test(trimmed)) {
        policy.auth = true;
        policy.seller = true;
      }
      if (/router\.use\(\s*roleMiddleware\(\s*\['[^\]]*admin[^\]]*'\]\)\s*\)/.test(trimmed)) {
        policy.auth = true;
        policy.admin = true;
      }
      if (/router\.use\(\s*roleMiddleware\(\s*\['[^\]]*seller[^\]]*'\]\)\s*\)/.test(trimmed)) {
        policy.auth = true;
        policy.seller = true;
      }
    }
  }
  filePolicies[file] = policy;
}

function authTypeFor(entry) {
  const text = entry.middleware.join(' ');
  if (/\badminOnly\b/.test(text) || /roleMiddleware\(\s*\['[^\]]*admin[^\]]*'\]\)/.test(text) || /router\.use\(authMiddleware,\s*roleMiddleware\(\['[^\]]*admin[^\]]*'\]\)\)/.test(entry.raw) || /router\.use\(\s*roleMiddleware\(\s*\['[^\]]*admin[^\]]*'\]\)\s*\)/.test(entry.raw)) return 'admin';
  if (/roleMiddleware\(\s*\['[^\]]*seller[^\]]*'\]\)/.test(text) || /router\.use\(authMiddleware,\s*roleMiddleware\(\['[^\]]*seller[^\]]*'\]\)\)/.test(entry.raw) || /router\.use\(\s*roleMiddleware\(\s*\['[^\]]*seller[^\]]*'\]\)\s*\)/.test(entry.raw)) return 'seller';
  if (/authMiddleware/.test(text) || /router\.use\(authMiddleware\)/.test(entry.raw)) return 'auth';
  const filePolicy = filePolicies[entry.file] || { auth: false, admin: false, seller: false };
  if (filePolicy.admin) return 'admin';
  if (filePolicy.seller) return 'seller';
  if (filePolicy.auth) return 'auth';
  return 'public';
}

function classifyGroup(fullPath) {
  const groups = [
    { name: 'Auth / Users', prefixes: ['/api/auth', '/api/users', '/api/verification'] },
    { name: 'Legacy Marketplace', prefixes: ['/api/categories', '/api/products', '/api/favorites', '/api/upload', '/api/banners', '/api/chats', '/api/conversations', '/api/reports', '/api/notifications', '/api/reviews', '/api/locations', '/api/seller-analytics', '/api/traffic-analytics', '/api/promotions'] },
    { name: 'Admin', prefixes: ['/api/admin'] },
    { name: 'Students', prefixes: ['/api/students'] },
    { name: 'Teachers', prefixes: ['/api/teachers'] },
    { name: 'Attendance', prefixes: ['/api/attendances'] },
    { name: 'Payments', prefixes: ['/api/payments'] },
    { name: 'Finance', prefixes: ['/api/finance'] },
    { name: 'Certificates', prefixes: ['/api/certificates'] },
    { name: 'Transport', prefixes: ['/api/transport'] },
    { name: 'Fuel', prefixes: ['/api/fuel-records'] },
    { name: 'Expenses', prefixes: ['/api/expenses'] },
    { name: 'Dashboard', prefixes: ['/api/school-dashboard'] },
    { name: 'School Settings', prefixes: ['/api/school-settings'] },
    { name: 'Academic Records', prefixes: ['/api/academic-records'] },
    { name: 'Academic Years', prefixes: ['/api/academic-years'] },
    { name: 'Grades', prefixes: ['/api/grades'] },
    { name: 'Subjects', prefixes: ['/api/subjects'] },
    { name: 'Classes', prefixes: ['/api/classes'] },
    { name: 'Employee Attendance', prefixes: ['/api/employee-attendances'] },
    { name: 'Vehicles', prefixes: ['/api/vehicles'] },
    { name: 'Routes', prefixes: ['/api/routes'] },
    { name: 'Transport Assignments', prefixes: ['/api/transport-assignments'] }
  ];
  for (const group of groups) {
    if (group.prefixes.some(prefix => fullPath === prefix || fullPath.startsWith(prefix + '/'))) return group.name;
  }
  if (fullPath === '/sitemap.xml' || fullPath.startsWith('/sitemap.xml')) return 'Sitemap';
  if (fullPath === '/robots.txt') return 'Sitemap';
  return 'Other';
}
const routes = [];
for (const entry of entries) {
  const mountPrefixes = prefixMap[entry.file] || [];
  if (entry.file === 'sitemap.routes.js') {
    // sitemap mounted at root in app.js
    mountPrefixes.push('');
  }
  if (entry.file === 'index.js') continue;
  if (mountPrefixes.length === 0) mountPrefixes.push('');
  for (const mountPrefix of mountPrefixes) {
    const prefix = normalizePrefix(mountPrefix);
    const routePath = normalizePath(entry.routePath);
    const full = (prefix + routePath).replace(/\/+/g, '/');
    const fullPath = full === '' ? '/' : full;
    if (entry.method === 'USE') {
      routes.push({ file: entry.file, line: entry.line, method: entry.method, routePath: entry.routePath, middleware: entry.middleware, raw: entry.raw, prefix, fullPath, authType: authTypeFor(entry) });
    } else {
      routes.push({ file: entry.file, line: entry.line, method: entry.method, routePath: entry.routePath, middleware: entry.middleware, raw: entry.raw, prefix, fullPath, authType: authTypeFor(entry), group: classifyGroup(appMount + fullPath) });
    }
  }
}
const enabledRoutes = routes.filter(r => ['GET','POST','PUT','PATCH','DELETE'].includes(r.method));
const summary = { total: 0, public: 0, auth: 0, admin: 0, seller: 0, other: 0, byGroup: {}, byFile: {}, byPrefix: {} };
for (const r of enabledRoutes) {
  summary.total += 1;
  if (summary[r.authType] === undefined) summary.other += 1;
  else summary[r.authType] += 1;
  const group = r.group;
  summary.byGroup[group] = (summary.byGroup[group] || 0) + 1;
  summary.byFile[r.file] = (summary.byFile[r.file] || 0) + 1;
  summary.byPrefix[r.prefix || '/'] = (summary.byPrefix[r.prefix || '/'] || 0) + 1;
}
fs.writeFileSync(path.join(root, 'tmp_route_inventory_report.json'), JSON.stringify({ summary, routes }, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
