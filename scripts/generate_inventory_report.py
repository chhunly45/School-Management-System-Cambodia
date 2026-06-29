import os
import re
from pathlib import Path

root = Path(r'd:\School Management System Cambodia (SMS-CAM)')

sections = {
    'Client Pages': ['client/src/pages'],
    'Client Components': ['client/src/components'],
    'Client Services': ['client/src/services'],
    'Client Utilities': ['client/src/utils'],
    'Server Routes': ['server/routes'],
    'Server Controllers': ['server/controllers'],
    'Server Services': ['server/services'],
    'Server Models': ['server/models'],
    'Server Middleware': ['server/middleware'],
    'Configuration': ['client', 'server/config', 'server', 'client/src'],
}

exclude_dirs = {'node_modules', '__tests__', '__mocks__', 'coverage', 'dist', 'uploads', 'dev-emails', 'scripts', 'public'}
code_exts = {'.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts'}

import_re = re.compile(r'''(?:from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))''')


def is_code_file(path: Path) -> bool:
    return path.suffix.lower() in code_exts


def list_section_files(section: str):
    files = []
    for d in sections[section]:
        p = root / d
        if not p.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(p):
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
            for filename in filenames:
                path = Path(dirpath) / filename
                if not is_code_file(path):
                    continue
                rel = path.relative_to(root).as_posix()
                if rel.startswith('client/src/__tests__') or rel.startswith('server/__tests__'):
                    continue
                if rel.startswith('client/src/__mocks__') or rel.startswith('server/__mocks__'):
                    continue
                if rel.startswith('client/src/setupTests.ts') or rel.endswith('.test.ts') or rel.endswith('.test.tsx') or rel.endswith('.test.js') or rel.endswith('.test.jsx'):
                    continue
                if rel.startswith('server/scripts/') or rel.startswith('scripts/') or rel.startswith('docs/') or rel.startswith('client/public/'):
                    continue
                files.append(path)
    uniq = []
    seen = set()
    for p in sorted(files):
        rel = p.relative_to(root).as_posix()
        if rel not in seen:
            seen.add(rel)
            uniq.append(p)
    return uniq

runtime_files = {}
for section in sections:
    for p in list_section_files(section):
        rel = p.relative_to(root).as_posix()
        runtime_files[rel] = p

importers = {rel: [] for rel in runtime_files}
dependencies = {rel: [] for rel in runtime_files}
for rel, path in runtime_files.items():
    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        continue
    deps = []
    for match in import_re.finditer(text):
        spec = match.group(1) or match.group(2)
        if not spec or not spec.startswith('.'):
            continue
        target = (path.parent / spec).resolve()
        candidates = []
        if target.suffix:
            candidates.append(target)
        else:
            candidates.extend([
                target.with_suffix('.ts'), target.with_suffix('.tsx'), target.with_suffix('.js'), target.with_suffix('.jsx'),
                target / 'index.ts', target / 'index.tsx', target / 'index.js', target / 'index.jsx'
            ])
        for cand in candidates:
            try:
                if cand.exists():
                    cand_rel = cand.relative_to(root).as_posix()
                    if cand_rel in runtime_files:
                        deps.append(cand_rel)
                        break
            except Exception:
                pass
    deps = sorted(set(deps))
    dependencies[rel] = deps
    for dep in deps:
        if dep in importers:
            importers[dep].append(rel)
for rel in importers:
    importers[rel] = sorted(set(importers[rel]))

server_index = runtime_files.get('server/routes/index.js')
if server_index:
    text = server_index.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r"require\('./([^']+)'\)", text):
        dep = f"server/routes/{m.group(1)}"
        if dep in runtime_files:
            dependencies['server/routes/index.js'].append(dep)
            importers.setdefault(dep, []).append('server/routes/index.js')
    dependencies['server/routes/index.js'] = sorted(set(dependencies['server/routes/index.js']))
    importers['server/routes/index.js'] = sorted(set(importers['server/routes/index.js']))

app_js = runtime_files.get('server/app.js')
if app_js:
    text = app_js.read_text(encoding='utf-8', errors='ignore')
    if "require('./routes')" in text:
        dependencies['server/app.js'].append('server/routes/index.js')
        importers['server/routes/index.js'].append('server/app.js')
    dependencies['server/app.js'] = sorted(set(dependencies['server/app.js']))
    importers['server/app.js'] = sorted(set(importers['server/app.js']))


def infer_module(rel: str) -> str:
    lower = rel.lower()
    if 'marketplace' in lower or 'product' in lower or 'seller' in lower or 'promotion' in lower or 'chat' in lower or 'review' in lower or 'banner' in lower or 'category' in lower:
        return 'Legacy Marketplace'
    if 'auth' in lower:
        return 'Auth'
    if 'student' in lower:
        return 'Student'
    if 'teacher' in lower:
        return 'Teacher'
    if 'attendance' in lower or 'employeeattendance' in lower:
        return 'Attendance'
    if 'finance' in lower or 'payment' in lower or 'revenue' in lower or 'expense' in lower:
        return 'Finance'
    if 'transport' in lower or 'vehicle' in lower or 'route' in lower or 'fuel' in lower:
        return 'Transport'
    if 'academic' in lower or 'grade' in lower or 'subject' in lower or 'certificate' in lower or 'class' in lower:
        return 'Academics'
    if 'school' in lower:
        return 'School Settings'
    if 'admin' in lower or 'dashboard' in lower or 'traffic' in lower or 'notification' in lower:
        return 'Admin/Operations'
    if rel.startswith('client/src/routes/') or rel.startswith('server/routes/'):
        return 'Routing'
    if rel.startswith('client/src/components/') or rel.startswith('client/src/pages/'):
        return 'UI'
    if rel.startswith('server/middleware/'):
        return 'Security/Validation'
    if rel.startswith('server/config/') or rel.startswith('client/vite.config.ts') or rel.startswith('client/tailwind.config.js') or rel.startswith('client/postcss.config.js') or rel.startswith('client/tsconfig') or rel.startswith('server/tsconfig.json') or rel.startswith('package.json'):
        return 'Infrastructure'
    return 'Shared'


def infer_purpose(rel: str) -> str:
    name = Path(rel).name
    if rel.startswith('client/src/pages/'):
        return f"Client page for {name.replace('.tsx','').replace('.ts','')}"
    if rel.startswith('client/src/components/'):
        return f"Reusable UI component for {name.replace('.tsx','').replace('.ts','')}"
    if rel.startswith('client/src/services/'):
        return f"Client API helper for {name.replace('.api.ts','').replace('.api.js','')}"
    if rel.startswith('client/src/utils/'):
        return f"Utility helper for {name.replace('.ts','').replace('.js','')}"
    if rel.startswith('server/routes/'):
        return f"Server route module for {name.replace('.js','')}"
    if rel.startswith('server/controllers/'):
        return f"Controller handling {name.replace('.controller.js','')}"
    if rel.startswith('server/services/'):
        return f"Server service for {name.replace('.service.js','')}"
    if rel.startswith('server/models/'):
        return f"Database model for {name.replace('.js','')}"
    if rel.startswith('server/middleware/'):
        return f"Middleware for {name.replace('.js','')}"
    if rel.startswith('server/config/'):
        return f"Configuration for {name.replace('.js','')}"
    if rel == 'client/src/vite-env.d.ts':
        return 'Type declarations for Vite environment variables'
    if rel == 'client/src/routes/AppRoutes.tsx':
        return 'Client route configuration for the application'
    if rel == 'client/src/App.tsx':
        return 'Root React application shell and provider setup'
    if rel == 'client/src/main.tsx':
        return 'Client application entrypoint'
    if rel == 'server/app.js':
        return 'Server application entrypoint'
    if rel == 'server/routes/index.js':
        return 'Central route aggregator for the API'
    if rel == 'client/package.json':
        return 'Client package manifest and scripts'
    if rel == 'package.json':
        return 'Repository root package manifest'
    return 'Project source file'


def is_used(rel: str) -> bool:
    return bool(importers.get(rel))


def rec_for(rel: str) -> str:
    if rel in {'client/src/routes/AppRoutes.tsx', 'server/routes/index.js', 'server/app.js', 'client/src/main.tsx', 'client/src/App.tsx'}:
        return 'KEEP'
    if rel.startswith('client/src/components/marketplace/') or rel.startswith('client/src/pages/HomePage.tsx') or rel.startswith('client/src/pages/ProductListPage.tsx') or rel.startswith('client/src/pages/ProductDetailPage.tsx') or rel.startswith('client/src/pages/PostProductPage.tsx') or rel.startswith('client/src/pages/FavoritesPage.tsx') or rel.startswith('client/src/pages/ProfilePage.tsx') or rel.startswith('client/src/pages/ChatPage.tsx') or rel.startswith('client/src/pages/DashboardPage.tsx') or rel.startswith('client/src/pages/SellerAnalyticsPage.tsx') or rel.startswith('client/src/pages/SellerPromotionsPage.tsx') or rel.startswith('client/src/pages/AdminPromotionsPage.tsx') or rel.startswith('client/src/pages/AdminBannersPage.tsx') or rel.startswith('client/src/pages/AdminVerificationReviewPage.tsx'):
        return 'REFACTOR'
    if rel.startswith('client/src/pages/AcademicRecordPage.tsx') or rel.startswith('client/src/components/marketplace/CategoriesGrid.tsx') or rel.startswith('client/src/components/marketplace/FeaturedSection.tsx'):
        return 'REMOVE'
    if not is_used(rel):
        return 'REMOVE'
    return 'KEEP'


def risk_for(rel: str) -> str:
    if rel in {'client/src/routes/AppRoutes.tsx', 'server/routes/index.js', 'server/app.js', 'client/src/main.tsx', 'client/src/App.tsx'}:
        return 'HIGH'
    if rel.startswith('server/controllers/') or rel.startswith('server/services/') or rel.startswith('client/src/services/') or rel.startswith('client/src/pages/'):
        return 'MEDIUM' if is_used(rel) else 'LOW'
    return 'LOW'

out_lines = []
out_lines.append('# SMS-CAM Architecture Inventory')
out_lines.append('')
out_lines.append(f'- Generated: {Path(__file__).stat().st_mtime_ns}')
out_lines.append(f'- Total discovered source files: {len(runtime_files)}')
out_lines.append('')
out_lines.append('This report is based on the current repository structure and direct route wiring in the client and server entrypoints. It is intended as a read-only planning artifact and does not change runtime behavior.')
out_lines.append('')

for section in sections:
    files = list_section_files(section)
    out_lines.append(f'## {section}')
    out_lines.append('')
    out_lines.append('| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |')
    out_lines.append('|---|---|---|---|---|---|---|---|')
    for p in files:
        rel = p.relative_to(root).as_posix()
        used = 'YES' if is_used(rel) else 'NO'
        imported_by = ', '.join(importers.get(rel, [])[:8]) if importers.get(rel) else '—'
        deps = ', '.join(dependencies.get(rel, [])[:8]) if dependencies.get(rel) else '—'
        out_lines.append(f'| [{rel}]({rel}) | {infer_purpose(rel)} | {used} | {imported_by} | {deps} | {infer_module(rel)} | {rec_for(rel)} | {risk_for(rel)} |')
    out_lines.append('')

out_lines.append('## Summary')
out_lines.append('')
out_lines.append('- The client application still mounts several legacy Marketplace routes and pages, including product, chat, favorites, seller, promotion, banner, and verification flows.')
out_lines.append('- The server still exposes a marketplace-oriented route tree through [server/routes/index.js](server/routes/index.js) and [server/app.js](server/app.js).')
out_lines.append('- The active school-management modules are wired through [client/src/routes/AppRoutes.tsx](client/src/routes/AppRoutes.tsx) and the domain-specific route modules under [server/routes](server/routes).')
out_lines.append('- Recommended action: keep the core school-management modules, refactor the legacy marketplace UI and route surface, and remove or isolate clearly unused items after a feature-flag review.')
out_lines.append('')
out_lines.append('## Recommended Next Steps')
out_lines.append('')
out_lines.append('1. Keep the school-management page/service/model set intact and continue using the shared date helper for these flows.')
out_lines.append('2. Refactor the marketplace pages and components into a clearly isolated module or a future-facing feature pack.')
out_lines.append('3. Review unused legacy files after the current routing and dependency map is finalized, then remove only the files that have no incoming imports and no active runtime path.')

out_path = root / 'PROJECT_INVENTORY_REPORT.md'
out_path.write_text('\n'.join(out_lines), encoding='utf-8')
print(out_path)
