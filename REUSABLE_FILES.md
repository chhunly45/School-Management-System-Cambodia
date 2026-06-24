# Reusable Files Report

Files that can be **copied directly** to other projects with minimal or no modifications. These are generic, infrastructure-level components not tied to the marketplace domain.

**Total Count:** ~45 files  
**Effort to Reuse:** Copy as-is (0-5% adaptation needed)

---

## Configuration & Build Files

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `tsconfig.json` (root) | Config | TypeScript root configuration | Direct copy, adjust paths as needed |
| `tsconfig.json` (client) | Config | Client TypeScript setup | Full reuse, no changes needed |
| `tsconfig.json` (server) | Config | Server TypeScript setup | Full reuse, no changes needed |
| `tsconfig.node.json` (client) | Config | Node TypeScript for build tools | Direct copy |
| `vite.config.ts` | Config | Vite bundler configuration | 90% reusable; update project name only |
| `jest.config.cjs` | Config | Jest testing setup | Fully reusable for React/Node projects |
| `postcss.config.js` | Config | PostCSS processor config | Direct copy |
| `tailwind.config.js` | Config | Tailwind CSS configuration | Direct copy; customize color theme |
| `package.json` (root) | Config | Root workspace dependencies | 50% reusable; keep structure, update deps |
| `package.json` (client) | Config | Frontend dependencies | 60% reusable; keep structure, add/remove as needed |
| `package.json` (server) | Config | Backend dependencies | 60% reusable; keep structure, add/remove as needed |
| `vercel.json` | Config | Vercel deployment configuration | Direct copy; update project name |
| `render.yaml` | Config | Render platform deployment | 80% reusable; update services/environment |
| `railway.json` | Config | Railway platform configuration | 80% reusable; update service configs |
| `render.env.example` | Config | Environment variables template | 40% reusable; update for new domain |

---

## Middleware & Core Infrastructure

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `server/middleware/auth.middleware.js` | Middleware | JWT authentication verification | **Highly reusable!** Pattern perfect for any Auth system; just replace User model ref |
| `server/middleware/error.middleware.js` | Middleware | Global error handler | Direct copy; excellent error patterns |
| `server/middleware/validation.middleware.js` | Middleware | Request validation | Direct copy for validation patterns |
| `server/middleware/upload.middleware.js` | Middleware | File upload handler | 85% reusable; adjust upload path/size limits |
| `server/middleware/role.middleware.js` | Middleware | Role-based access control | 90% reusable; update role names for new domain |
| `server/middleware/security/password.validator.js` | Middleware | Password validation rules | Fully reusable; password rules are domain-independent |

---

## Database & Connection

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `server/config/database.js` | Config | MongoDB connection setup | Fully reusable; just update connection string |

---

## API Infrastructure

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `client/src/services/api.ts` | Service | Axios API client base | 95% reusable; just update baseURL |
| `client/src/services/socket.ts` | Service | WebSocket connection logic | 95% reusable; fully generic Socket.io pattern |

---

## Testing & Development

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `client/src/setupTests.ts` | Test | Jest test environment setup | Direct copy; fully reusable |
| `client/coverage/` | Build Artifact | Test coverage reports | Not needed; regenerated |
| `client/index.html` | HTML | Vite entry point | 90% reusable; update title/meta only |
| `server/__tests__/` | Tests | Test infrastructure pattern | 80% reusable; keep structure for new tests |

---

## Build & Utility Scripts

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `bundle-check.js` | Script | Build bundle verification | Fully reusable; generic file size checking |
| `verify-build-strings.js` | Script | Build output validation | Fully reusable; string verification pattern |
| `remote_asset.js` | Script | Remote asset checker | Fully reusable for CDN/asset validation |
| `.gitignore` | Config | Git ignore rules | 95% reusable; standard Node/React/TypeScript patterns |

---

## Utilities & Helpers

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `server/utils/cloudinary-validator.js` | Utility | Image validation for Cloudinary | Direct copy; no domain dependencies |
| `client/src/utils/password.ts` | Utility | Password strength checking | Fully reusable; generic validation |
| `client/src/utils/price.ts` | Utility | Price formatting & calculations | 90% reusable; currency-agnostic |
| `client/src/utils/views.ts` | Utility | View count formatting | Fully reusable; generic number formatting |

---

## Documentation

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `docs/README.md` | Doc | Documentation structure | Template reusable; update content |
| `README.md` (root) | Doc | Project overview | 10% reusable; mostly content-specific |

---

## Environment Files

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `vercel.env.json` | Config | Vercel environment setup | 40% reusable; structure is reusable, values are specific |

---

## HTML Templates

| File | Type | Purpose | Reusability Notes |
|------|------|---------|-------------------|
| `konpuk_home.html` | HTML | Home page template | 30% reusable; only HTML structure useful |
| `prod_homepage.html` | HTML | Production homepage | 30% reusable; only structure useful |
| `prod_homepage_direct.html` | HTML | Alternative homepage | 30% reusable; only structure useful |

---

## Summary

### Direct Copy (100% reusable)
- All TypeScript configs
- All middleware patterns
- Database connection setup
- Build scripts
- Socket.io service pattern
- Password validation
- Error handling middleware
- Test setup

### High Reusability (80-95%)
- API client setup (change baseURL)
- Upload middleware (adjust limits)
- Role middleware (update role names)
- Deployment configs (minimal updates)

### Why These Files Are Reusable
1. **No domain logic** - Pure infrastructure code
2. **Generic patterns** - Work for any project type
3. **No marketplace-specific dependencies** - Don't reference products, sellers, etc.
4. **Standard libraries** - JWT, axios, express, mongoose basic patterns
5. **Configuration structure** - Can be adapted to new environment without code changes
