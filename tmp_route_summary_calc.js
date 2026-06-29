const fs = require('fs');
const path = require('path');
const root = process.cwd();
const routesDir = path.join(root, 'server', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).sort();
const fileInfo = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const info = { auth: false, admin: false, seller: false, roleOnly: false };
  for (const line of text.split(/\r?\n/)) {
    if (/router\.use\(authMiddleware\)/.test(line)) info.auth = true;
    if (/router\.use\(roleMiddleware\(\['.*admin.*'\]\)\)/.test(line)) info.admin = true;
    if (/router\.use\(authMiddleware,\s*roleMiddleware\(\['.*admin.*'\]\)\)/.test(line)) { info.auth = true; info.admin = true; }
    if (/router\.use\(authMiddleware,\s*roleMiddleware\(\['.*seller.*'\]\)\)/.test(line)) { info.auth = true; info.seller = true; }
    if (/router\.use\(roleMiddleware\(\['.*seller.*'\]\)\)/.test(line)) info.seller = true;
    if (/\badminOnly\b/.test(line)) info.admin = true;
  }
  fileInfo[file] = info;
}
const data = JSON.parse(fs.readFileSync(path.join(root, 'tmp_route_parser_output.json'), 'utf8'));
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
function classifyGroup(path) {
  if (!path) return 'Other';
  for (const group of groups) {
    if (path === group.prefix || path.startsWith(group.prefix + '/')) return group.name;
  }
  return 'Other';
}
function classifyAuth(item) {
  const fileAuth = fileInfo[item.file] || {};
  const text = item.middleware.join(' ');
  if (/\badminOnly\b/.test(text) || /roleMiddleware\(\s*\['.*admin.*'\]\)/.test(text) || fileAuth.admin) return 'admin';
  if (/roleMiddleware\(\s*\['.*seller.*'\]\)/.test(text) || fileAuth.seller) return 'seller';
  if (/authMiddleware/.test(text) || fileAuth.auth) return 'auth';
  return 'public';
}
const summary = { total: 0, public: 0, auth: 0, admin: 0, seller: 0, other: 0, byGroup: {}, byFile: {} };
for (const item of data) {
  if (!['GET','POST','PUT','PATCH','DELETE'].includes(item.method)) continue;
  const prefix = item.prefix || '/';
  const routePath = item.routePath === '/' ? '' : item.routePath;
  const fullPath = (prefix + routePath).replace(/\/+/g, '/');
  const authType = classifyAuth(item);
  summary.total += 1;
  summary[authType] = (summary[authType] || 0) + 1;
  const group = classifyGroup(fullPath);
  summary.byGroup[group] = (summary.byGroup[group] || 0) + 1;
  summary.byFile[item.file] = (summary.byFile[item.file] || 0) + 1;
}
fs.writeFileSync(path.join(root, 'tmp_route_summary_counts.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
