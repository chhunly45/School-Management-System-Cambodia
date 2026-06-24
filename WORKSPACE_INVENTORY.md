# SMS-CAM Workspace Complete File Inventory

**Generated**: 2026-06-24  
**Project**: School Management System Cambodia (SMS-CAM) - "Konpuk" Marketplace Platform  
**Stack**: React 18 + TypeScript + Express.js + MongoDB + Tailwind CSS

---

## QUICK STATISTICS

- **Total Source Files** (excluding node_modules): ~290+
- **Frontend Files** (client/src): ~120 TypeScript/TSX files
- **Backend Files** (server/): ~85 JavaScript files
- **Configuration Files**: ~25 files
- **Build Artifacts**: Coverage reports, dist folders, logs
- **Documentation**: PRD, README, deployment guides

---

## CLASSIFICATION BREAKDOWN

### 🟢 REUSABLE (35-45 files)
Files that can be **used directly** in other SMS projects with minimal/no changes:
- `.gitignore` patterns
- Standard Node.js configurations
- Phone number validation utilities (`server/utils/phone.js`)
- Password validation patterns
- Database connection setup patterns
- Deployment configuration examples (Vercel, Railway, Render)

### 🟡 PARTIALLY REUSABLE (80-100 files)
Files with **reusable patterns** requiring SMS-specific customization:
- Authentication system (JWT, tokens, login/register flow)
- API architecture (Express + Controller/Service pattern)
- React component structure and patterns
- Database layer (Mongoose schemas, model patterns)
- Chat/messaging system architecture
- Notification system patterns
- File upload service architecture
- Analytics dashboard patterns
- Testing infrastructure (Jest, test patterns)
- Real-time communication (Socket.io setup)

### 🔴 PROJECT-SPECIFIC (120-150 files)
Files **tightly coupled** to Konpuk marketplace functionality:
- Product catalog system
- Seller verification workflow
- Review & rating system
- Marketplace search/filters
- Category browsing interface
- Promotion & banner management
- Favorites/wishlist feature
- Product analytics
- All UI components specific to marketplace domain

---

## DIRECTORY STRUCTURE

```
d:\School Management System Cambodia (SMS-CAM)\
│
├── client/                              [React Frontend - Vite]
│   ├── public/                          # Static assets (logos, favicon, robots.txt)
│   ├── src/
│   │   ├── components/                  # React components (layout, marketplace, error handling)
│   │   ├── pages/                       # Feature pages (20+ page components)
│   │   ├── services/                    # API client modules (18 service files)
│   │   ├── hooks/                       # Custom React hooks (Auth, WebSocket)
│   │   ├── routes/                      # Router configuration
│   │   ├── utils/                       # Helper functions
│   │   ├── __tests__/                   # Jest test suite (31 test files)
│   │   ├── __mocks__/                   # Jest mocks
│   │   ├── App.tsx                      # Root component
│   │   ├── main.tsx                     # Entry point
│   │   └── index.css                    # Global styles
│   ├── dist/                            # Production build output
│   ├── coverage/                        # Test coverage reports
│   ├── vite.config.ts                   # Vite bundler config
│   ├── jest.config.cjs                  # Jest testing config
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── tsconfig.json                    # TypeScript config
│   ├── package.json                     # Frontend dependencies
│   └── [test/build logs]                # CI/CD and test artifacts
│
├── server/                              [Express Backend - Node.js]
│   ├── config/                          # Configuration modules
│   │   ├── database.js                  # MongoDB setup
│   │   ├── cloudinary.js                # Image service config
│   │   ├── categories.js                # Marketplace categories
│   │   ├── provinces.js                 # Cambodia locations
│   │   └── index.js                     # Config aggregator
│   ├── models/                          # MongoDB Mongoose schemas (17 models)
│   │   ├── User.js                      # User accounts
│   │   ├── Product.js                   # Product listings
│   │   ├── Chat.js, Message.js          # Messaging
│   │   ├── Review.js, Rating.js         # Reviews
│   │   ├── SellerVerification.js        # Seller vetting
│   │   └── [various domain models]
│   ├── controllers/                     # Request handlers (15 controllers)
│   │   ├── auth.controller.js           # Authentication
│   │   ├── user.controller.js           # User management
│   │   ├── product.controller.js        # Product CRUD
│   │   ├── admin.controller.js          # Admin operations
│   │   └── [domain-specific controllers]
│   ├── routes/                          # API endpoints (19 route files)
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   └── [endpoint definitions]
│   ├── services/                        # Business logic (18 service files)
│   │   ├── auth.service.js              # JWT, tokens, passwords
│   │   ├── email.service.js             # Email via Resend
│   │   ├── sms.service.js               # SMS sending
│   │   ├── chat.service.js              # Messaging logic
│   │   ├── upload.service.js            # Cloudinary uploads
│   │   └── [business logic]
│   ├── middleware/                      # Express middleware
│   │   ├── auth.middleware.js           # JWT verification
│   │   ├── role.middleware.js           # Authorization
│   │   ├── error.middleware.js          # Error handling
│   │   ├── upload.middleware.js         # Multer file upload
│   │   ├── validation.middleware.js     # Input validation
│   │   └── security/
│   ├── utils/                           # Helper functions
│   │   ├── phone.js                     # Phone formatting
│   │   └── cloudinary-validator.js
│   ├── scripts/                         # Admin & utility scripts
│   │   ├── make-admin.js                # Create admin user
│   │   ├── normalize-phone-numbers.js   # Data cleanup
│   │   └── [migration & utility scripts]
│   ├── __tests__/                       # Jest test suite (6 test files)
│   │   ├── auth.service.test.js
│   │   ├── chat.service.test.js
│   │   └── [service & integration tests]
│   ├── dev-emails/                      # Development email logs (14 files)
│   ├── uploads/                         # Uploaded file storage
│   ├── server.js                        # Server entry point
│   ├── app.js                           # Express app config
│   ├── tsconfig.json                    # TypeScript config
│   ├── package.json                     # Backend dependencies
│   └── .env.example                     # Environment template
│
├── database/                            # Database scripts/backups
│   └── .gitkeep
│
├── deploy/                              # Deployment configuration
│   └── env-snippets.txt
│
├── docs/                                # Documentation
│   ├── PRD.md                           # Product Requirements Document
│   └── README.md
│
├── scripts/                             # Root-level scripts
│   └── migrate-notifications-to-slugs.js
│
├── dev-emails/                          # Development email artifacts
│
├── screenshots/                         # UI screenshots
│
├── [ROOT CONFIG FILES]
│   ├── package.json                     # Root workspace config
│   ├── README.md                        # Main project README
│   ├── vercel.json                      # Vercel deployment config
│   ├── railway.json                     # Railway deployment config
│   ├── render.yaml                      # Render deployment config
│   ├── .gitignore                       # Git ignore patterns
│   ├── bundle-check.js                  # Build analysis script
│   ├── verify-build-strings.js          # Build verification
│   └── [deployment & config files]
```

---

## KEY FILES BY PURPOSE

### 🔐 AUTHENTICATION & SECURITY (🟡 PARTIALLY REUSABLE)
- `server/services/auth.service.js` - JWT token generation, password hashing
- `server/middleware/auth.middleware.js` - Token verification
- `server/middleware/role.middleware.js` - Role-based access control
- `client/services/auth.api.ts` - Frontend auth endpoints
- `client/hooks/useAuth.tsx` - Auth context hook
- `server/middleware/security/password.validator.js` - Password strength

### 🗄️ DATABASE & MODELS (🟡 PARTIALLY REUSABLE)
- `server/config/database.js` - MongoDB connection
- `server/models/*.js` - All 17 Mongoose schemas (adapt domain models)
- `server/models/User.js` - User account schema
- `server/models/Chat.js`, `Message.js` - Messaging models
- `server/models/index.js` - Model exports

### 🌐 API & ROUTING (🟡 PARTIALLY REUSABLE)
- `server/app.js` - Express setup, middleware configuration
- `server/server.js` - Server entry point
- `server/routes/*.js` - 19 route files (adapt endpoints)
- `server/controllers/*.js` - 15 controller files (adapt logic)
- `server/services/*.js` - 18 service files (business logic)

### 💬 REAL-TIME COMMUNICATION (🟡 PARTIALLY REUSABLE)
- `server/services/chat.service.js` - Chat logic
- `server/models/Chat.js`, `Message.js` - Chat schemas
- `server/routes/chat.routes.js` - Chat endpoints
- `client/services/socket.ts` - Socket.io client
- `client/pages/ChatPage.tsx` - Chat UI

### 📧 NOTIFICATIONS & COMMUNICATION (🟡 PARTIALLY REUSABLE)
- `server/services/email.service.js` - Resend email integration
- `server/services/sms.service.js` - SMS sending service
- `server/services/notification.service.js` - Notification management
- `server/routes/notification.routes.js` - Notification endpoints

### 📁 FILE UPLOAD (🟡 PARTIALLY REUSABLE)
- `server/services/upload.service.js` - Cloudinary integration
- `server/middleware/upload.middleware.js` - Multer configuration
- `server/routes/upload.routes.js` - Upload endpoints
- `server/utils/cloudinary-validator.js` - Upload validation

### 📊 ANALYTICS (🟡 PARTIALLY REUSABLE)
- `server/services/traffic-analytics.service.js` - Site analytics
- `server/services/seller-analytics.service.js` - User-specific analytics
- `server/models/PageView.js`, `Visitor.js` - Analytics schemas
- `client/pages/AdminDashboardPage.tsx` - Admin dashboard
- `client/services/traffic-analytics.api.ts` - Analytics API

### ✅ TESTING (🟡 PARTIALLY REUSABLE)
- `client/jest.config.cjs` - Jest configuration
- `server/__tests__/*.test.js` - 6 backend test files
- `client/src/__tests__/*.test.tsx` - 31 frontend test files
- `client/src/__mocks__/*.ts` - Jest mock files

### ⚙️ BUILD & DEPLOYMENT (🟡 PARTIALLY REUSABLE)
- `client/vite.config.ts` - Vite bundler configuration
- `client/tsconfig.json` - Frontend TypeScript config
- `server/tsconfig.json` - Backend TypeScript config
- `vercel.json`, `railway.json`, `render.yaml` - Deployment configs
- `.env.example`, `.env.production.example` - Environment templates
- `bundle-check.js` - Build analysis

---

## REUSABILITY SCORES BY LAYER

### Frontend (Client)
- **UI Components**: 🔴 20% reusable (patterns only)
- **Services/API**: 🟡 60% reusable (adapt to SMS endpoints)
- **Hooks**: 🟡 70% reusable (especially useAuth, socket patterns)
- **Utilities**: 🟢 80% reusable (general utilities)
- **Configuration**: 🟡 90% reusable (Vite, Jest, TypeScript setup)

### Backend (Server)
- **Controllers/Routes**: 🟡 50% reusable (adapt domain logic)
- **Services**: 🟡 60% reusable (business logic patterns)
- **Models**: 🟡 40% reusable (schema patterns, replace data models)
- **Middleware**: 🟢 85% reusable (auth, error handling, validation)
- **Configuration**: 🟢 95% reusable (database, environment setup)
- **Utilities**: 🟢 90% reusable (phone validation, password checks)

### Infrastructure
- **Deployment**: 🟡 85% reusable (update for SMS-CAM)
- **Environment Management**: 🟢 90% reusable (add SMS-specific vars)
- **Build System**: 🟢 95% reusable (works for any Node.js project)

---

## TOP 10 MOST REUSABLE FILES FOR SMS-CAM

1. ✅ `server/config/database.js` - MongoDB setup (🟢 REUSABLE)
2. ✅ `server/utils/phone.js` - Phone validation (🟢 REUSABLE)
3. ✅ `server/middleware/auth.middleware.js` - JWT verification (🟢 REUSABLE)
4. ✅ `server/middleware/error.middleware.js` - Error handling (🟢 REUSABLE)
5. ✅ `server/app.js` - Express setup pattern (🟡 ADAPTABLE)
6. ✅ `client/vite.config.ts` - Build configuration (🟡 ADAPTABLE)
7. ✅ `server/services/auth.service.js` - Authentication logic (🟡 ADAPTABLE)
8. ✅ `server/middleware/validation.middleware.js` - Input validation (🟡 ADAPTABLE)
9. ✅ `client/hooks/useAuth.tsx` - Auth state management (🟡 ADAPTABLE)
10. ✅ `vercel.json`, `railway.json` - Deployment configs (🟡 ADAPTABLE)

---

## TOP 10 PROJECT-SPECIFIC FILES TO REPLACE FOR SMS-CAM

1. ❌ `server/models/Product.js` → Replace with `Student.js`, `Teacher.js`, `Class.js`
2. ❌ `server/models/SellerVerification.js` → Replace with `TeacherVerification.js`
3. ❌ `server/models/Review.js` → Replace with `AssignmentFeedback.js`, `Grade.js`
4. ❌ `server/models/Favorite.js` → Replace with `BookmarkedResource.js`
5. ❌ `server/models/Promotion.js` → Replace with `Announcement.js`
6. ❌ `client/components/marketplace/*` → Replace with educational UI components
7. ❌ `client/pages/ProductDetailPage.tsx` → Replace with `ClassDetailPage.tsx`, `AssignmentPage.tsx`
8. ❌ `client/pages/PostProductPage.tsx` → Replace with `CreateAssignmentPage.tsx`
9. ❌ `server/controllers/product.controller.js` → Replace with educational domain controllers
10. ❌ `docs/PRD.md` → Update with SMS-CAM Product Requirements

---

## RECOMMENDED MIGRATION PATH FOR SMS-CAM

### Phase 1: Setup Foundation (Use 🟢 REUSABLE & Infrastructure)
- Copy database configuration
- Reuse authentication system
- Copy middleware layer (auth, error handling, validation)
- Copy deployment configurations
- Reuse utility functions

### Phase 2: Build Core Structure (Use 🟡 PARTIALLY REUSABLE Patterns)
- Keep API architecture (controllers, routes, services)
- Adapt middleware for SMS authentication
- Create SMS domain models (Students, Teachers, Classes, Grades, Attendance)
- Build core business logic services

### Phase 3: Develop SMS-Specific Features (Replace 🔴 PROJECT-SPECIFIC)
- Student management system
- Teacher management & verification
- Class & course management
- Gradebook & assessment system
- Attendance tracking
- Assignment management
- Timetable management
- Parent-Teacher communication
- SMS/Email notifications

### Phase 4: Adapt Frontend (Reuse 🟡 Patterns)
- Keep React component patterns
- Reuse hooks architecture (useAuth, custom hooks)
- Adapt layout for educational dashboard
- Build new pages for SMS features
- Reuse styling setup (Tailwind)
- Adapt services for new API endpoints

---

## IMPLEMENTATION EFFORT ESTIMATE

| Component | Effort | Reusability |
|-----------|--------|-------------|
| Backend Core | ⏱️⏱️ | 🟡 60% reusable |
| Database Models | ⏱️⏱️⏱️ | 🟡 40% reusable |
| API Endpoints | ⏱️⏱️⏱️ | 🟡 45% reusable |
| Frontend Layout | ⏱️ | 🟡 70% reusable |
| Feature Pages | ⏱️⏱️⏱️⏱️ | 🔴 10% reusable |
| Business Logic | ⏱️⏱️⏱️⏱️ | 🔴 15% reusable |
| Utilities | ⏱️ | 🟢 85% reusable |
| Infrastructure | ⏱️⏱️ | 🟡 90% reusable |

**Total Effort Reduction**: ~35-40% of development time saved through reuse

---

## CRITICAL FILES TO PRESERVE

✅ **These files MUST be reviewed and kept for SMS-CAM**:
- All authentication & security middleware
- Database connection & configuration
- Error handling patterns
- Express middleware setup
- Testing infrastructure
- Deployment configurations
- Build pipeline setup
- Environment management system
- Phone validation utilities
- API architecture pattern

---

## FILES TO BE CAUTIOUS WITH

⚠️ **These require careful adaptation**:
- Chat/messaging system (adapt domain, keep architecture)
- Notification system (keep patterns, update channels)
- Analytics (keep patterns, update metrics)
- Admin dashboard (keep patterns, update data)
- File upload (keep Cloudinary pattern or replace service)
- Search system (adapt for educational domain)

---

## COMPLETE FILE COUNT SUMMARY

### By Type
- **TypeScript/JavaScript**: ~215 files
- **Configuration**: ~25 files
- **Markdown/Documentation**: ~5 files
- **HTML/CSS**: ~10 files
- **JSON/ENV**: ~20 files
- **Test files**: ~40 files
- **Build artifacts**: ~15 files

### By Reusability
- **🟢 Reusable (35-45)**: ~15%
- **🟡 Partially Reusable (80-100)**: ~35%
- **🔴 Project-Specific (120-150)**: ~50%

### By Location
- **Frontend (client/)**: ~150 files
- **Backend (server/)**: ~100 files  
- **Configuration/Deployment**: ~40 files

---

## CONCLUSION

This SMS-CAM codebase provides an **excellent foundation** for creating a School Management System, with:
- ✅ Modern tech stack (React, Express, MongoDB)
- ✅ Strong architecture patterns (Controllers, Services, Models)
- ✅ Security best practices (JWT, CSRF, rate limiting)
- ✅ Real-time capabilities (Socket.io)
- ✅ File upload infrastructure
- ✅ Testing framework
- ✅ Deployment automation

**SMS-CAM can be built in ~60-65% of the time** by leveraging existing patterns and reusable code from this marketplace platform.

