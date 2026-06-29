const fs = require('fs');
const path = require('path');
const root = process.cwd();
const routesDir = path.join(root, 'server', 'routes');
const indexText = fs.readFileSync(path.join(routesDir, 'index.js'), 'utf8');
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
    if (fileName) prefixMap[fileName] = prefix;
  }
}
const data = JSON.parse(fs.readFileSync(path.join(root, 'tmp_route_parser_output.json'), 'utf8'));
const summary = { total: 0, public: 0, auth: 0, admin: 0, seller: 0, other: 0, byPrefix: {}, byGroup: {} };
const groups = [
  { name: 'Students', prefix: '/students' },
  { name: 'Teachers', prefix: '/teachers' },
  { name: 'Attendance', prefix: '/attendances' },
  { name: 'Payments', prefix: '/payments' },
  { name: 'Finance', prefix: '/finance' },
  { name: 'Certificates', prefix: '/certificates' },
  { name: 'Transport', prefix: '/transport' },
  { name: 'Fuel', prefix: '/fuel-records' },
  { name: 'Expenses', prefix: '/expenses' },
  { name: 'Dashboard', prefix: '/school-dashboard' },
  { name: 'School Settings', prefix: '/school-settings' },
  { name: 'Academic Records', prefix: '/academic-records' },
  { name: 'Academic Years', prefix: '/academic-years' },
  { name: 'Grades', prefix: '/grades' },
  { name: 'Subjects', prefix: '/subjects' },
  { name: 'Classes', prefix: '/classes' },
  { name: 'Employee Attendance', prefix: '/employee-attendances' },
  { name: 'Vehicles', prefix: '/vehicles' },
  { name: 'Routes', prefix: '/routes' },
  { name: 'Transport Assignments', prefix: '/transport-assignments' },
  { name: 'Auth / Users', prefix: '/auth' },
  { name: 'Auth / Users', prefix: '/users' },
  { name: 'Auth / Users', prefix: '/verification' },
  { name: 'Legacy Marketplace', prefix: '/categories' },
  { name: 'Legacy Marketplace', prefix: '/products' },
  { name: 'Legacy Marketplace', prefix: '/favorites' },
  { name: 'Legacy Marketplace', prefix: '/upload' },
  { name: 'Legacy Marketplace', prefix: '/banners' },
  { name: 'Legacy Marketplace', prefix: '/chats' },
  { name: 'Legacy Marketplace', prefix: '/seller-analytics' },
  { name: 'Legacy Marketplace', prefix: '/traffic-analytics' },
  { name: 'Legacy Marketplace', prefix: '/promotions' },
  { name: 'Legacy Marketplace', prefix: '/reviews' },
  { name: 'Legacy Marketplace', prefix: '/notifications' },
  { name: 'Legacy Marketplace', prefix: '/locations' },
  { name: 'Legacy Marketplace', prefix: '/reports' },
  { name: 'Admin', prefix: '/admin' }
];
function classifyGroup(fullPath) {
  if (!fullPath) return 'Other';
  for (const group of groups) {
    if (fullPath === group.prefix || fullPath.startsWith(group.prefix + '/')) return group.name;
  }
  return 'Other';
}
function classifyAuth(item) {
  const middlewareText = item.middleware.join(' ');
  if (/\badminOnly\b/.test(middlewareText) || /roleMiddleware\(\s*\['[^\]]*admin[^\]]*'\]\)/.test(middlewareText)) return 'admin';
  if (/roleMiddleware\(\s*\['[^\]]*seller[^\]]*'\]\)/.test(middlewareText)) return 'seller';
  if (/authMiddleware/.test(middlewareText)) return 'auth';
  return 'public';
}
for (const item of data) {
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(item.method)) continue;
  const prefix = prefixMap[item.file] || '';
  let fullPath = prefix + (item.routePath === '/' ? '' : item.routePath);
  if (!fullPath) fullPath = prefix || '/';
  if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;
  const authType = classifyAuth(item);
  summary.total += 1;
  if (summary[authType] === undefined) summary.other += 1;
  else summary[authType] += 1;
  summary.byPrefix[prefix || '/'] = (summary.byPrefix[prefix || '/'] || 0) + 1;
  const group = classifyGroup(fullPath);
  summary.byGroup[group] = (summary.byGroup[group] || 0) + 1;
}
fs.writeFileSync(path.join(root, 'tmp_route_inventory_counts.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
