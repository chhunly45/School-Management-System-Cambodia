#!/bin/bash
# SMS-CAM REUSABILITY QUICK REFERENCE

## 📊 INVENTORY SUMMARY
# ─────────────────────────────────────────────────────────────

TOTAL_FILES=290
REUSABLE=15_percent
PARTIALLY_REUSABLE=35_percent
PROJECT_SPECIFIC=50_percent

FRONTEND_FILES=150
BACKEND_FILES=100
CONFIG_FILES=40

## 🎯 KEY METRICS
# ─────────────────────────────────────────────────────────────

REUSE_PERCENTAGE=35_to_40_percent_of_development_time_saved
ESTIMATED_EFFORT_REDUCTION=60_to_65_percent_faster_development

## 📁 CRITICAL DIRECTORIES TO UNDERSTAND
# ─────────────────────────────────────────────────────────────

# FRONTEND APPLICATION
client/
├── src/components/      # UI components (MOSTLY PROJECT-SPECIFIC)
├── src/pages/          # Feature pages (MOSTLY PROJECT-SPECIFIC)
├── src/services/       # API clients (MOSTLY PARTIALLY-REUSABLE)
├── src/hooks/          # Custom React hooks (MOSTLY REUSABLE PATTERNS)
├── src/utils/          # Utilities (MOSTLY REUSABLE)
└── [config files]      # Vite, Jest, Tailwind (MOSTLY REUSABLE)

# BACKEND APPLICATION
server/
├── controllers/        # Route handlers (50% REUSABLE PATTERNS)
├── services/          # Business logic (60% REUSABLE PATTERNS)
├── models/            # MongoDB schemas (40% REUSABLE PATTERNS)
├── routes/            # API endpoints (50% REUSABLE PATTERNS)
├── middleware/        # Express middleware (85% REUSABLE)
├── config/            # Configuration (95% REUSABLE)
└── utils/             # Helpers (90% REUSABLE)

## 🟢 TOP 15 FILES TO COPY DIRECTLY (NO CHANGES)
# ─────────────────────────────────────────────────────────────

1. server/config/database.js              # MongoDB setup
2. server/utils/phone.js                  # Phone validation (Cambodian format)
3. server/middleware/auth.middleware.js   # JWT verification
4. server/middleware/error.middleware.js  # Error handling
5. server/middleware/role.middleware.js   # Authorization pattern
6. server/middleware/validation.middleware.js  # Input validation pattern
7. client/vite.config.ts                  # Vite build config
8. client/jest.config.cjs                 # Jest test config
9. client/tsconfig.json                   # Frontend TypeScript
10. server/tsconfig.json                  # Backend TypeScript
11. .gitignore                            # Git patterns
12. client/.gitignore                     # Frontend git ignore
13. server/.gitkeep                       # Placeholder
14. server/__tests__/phone.util.test.js   # Phone validation tests
15. server/middleware/security/password.validator.js  # Password validation

## 🟡 TOP 20 FILES TO ADAPT (PATTERNS REUSABLE)
# ─────────────────────────────────────────────────────────────

# ARCHITECTURE & PATTERNS
1. server/app.js                    # Express setup → Adapt middleware for SMS
2. server/server.js                 # Server entry → Keep pattern
3. server/routes/index.js           # Route aggregator → Add SMS routes
4. server/config/index.js           # Config aggregator → Add SMS configs

# AUTHENTICATION
5. server/services/auth.service.js  # JWT/passwords → Adapt for SMS auth flows
6. server/controllers/auth.controller.js  # Auth handlers → Adapt for SMS
7. server/routes/auth.routes.js     # Auth endpoints → Adapt for SMS
8. client/services/auth.api.ts      # Frontend auth → Adapt for SMS
9. client/hooks/useAuth.tsx         # Auth state → Adapt for SMS roles

# USER MANAGEMENT
10. server/models/User.js           # User schema → Add SMS-specific fields
11. server/controllers/user.controller.js  # User handlers → Adapt for SMS
12. server/services/user.service.js # User logic → Adapt for SMS

# REAL-TIME COMMUNICATION
13. server/services/chat.service.js # Chat logic → Adapt for SMS messaging
14. server/models/Chat.js, Message.js  # Chat schemas → Adapt for SMS
15. client/services/socket.ts       # Socket.io → Adapt for SMS events

# NOTIFICATIONS
16. server/services/notification.service.js  # Notify → Adapt for SMS
17. server/services/email.service.js        # Email → Keep, add SMS provider
18. server/services/sms.service.js          # SMS → Adapt for SMS-CAM provider

# FILE UPLOAD
19. server/services/upload.service.js  # File upload → Adapt for documents
20. server/middleware/upload.middleware.js  # Multer config → Keep

## 🔴 TOP 15 FILES TO REPLACE COMPLETELY
# ─────────────────────────────────────────────────────────────

# DATA MODELS - CREATE EDUCATIONAL EQUIVALENTS
1. server/models/Product.js              → Student.js, Teacher.js, Class.js
2. server/models/SellerVerification.js   → TeacherVerification.js
3. server/models/Review.js               → Grade.js, AssignmentFeedback.js
4. server/models/Favorite.js             → BookmarkedResource.js
5. server/models/Promotion.js            → Announcement.js
6. server/models/Category.js             → Subject.js, GradeLevel.js

# BUSINESS LOGIC - CREATE EDUCATIONAL SERVICES
7. server/controllers/product.controller.js  → Assignment, Class, Student controllers
8. server/services/product.service.js        → Educational domain services

# API ROUTES - CREATE EDUCATIONAL ENDPOINTS
9. server/routes/product.routes.js      → Create educational route files
10. server/routes/promotion.routes.js   → Create Announcement routes

# FRONTEND PAGES - CREATE EDUCATIONAL UI
11. client/pages/ProductListPage.tsx        → ClassListPage, StudentListPage
12. client/pages/ProductDetailPage.tsx      → ClassDetailPage, StudentProfilePage
13. client/pages/PostProductPage.tsx        → CreateAssignmentPage, CreateClassPage
14. client/src/components/marketplace/*     → Create educational components
15. client/pages/AdminDashboardPage.tsx     → Create SMS admin dashboard

## 🔑 KEY FILES BY FUNCTION
# ─────────────────────────────────────────────────────────────

# SECURITY (REUSE)
security/password.validator.js      ✅ Use as-is
auth.middleware.js                  ✅ Use as-is
role.middleware.js                  ✅ Keep pattern, adapt roles
auth.service.js                     ✅ Keep pattern, adapt flow

# DATABASE (REUSE)
config/database.js                  ✅ Use as-is
models/User.js                      ⚠️ Adapt for SMS roles
models/AuditLog.js                  ✅ Use as-is

# API LAYER (ADAPT)
app.js                              ⚠️ Keep middleware stack, adapt
routes/index.js                     ⚠️ Keep pattern, add SMS routes
controllers/*.js                    ⚠️ Keep pattern, adapt logic
services/*.js                       ⚠️ Keep pattern, adapt business logic

# FRONTEND (MOSTLY REPLACE)
components/layout/Header.tsx        ⚠️ Adapt for SMS navigation
components/marketplace/*            ❌ Replace with SMS components
hooks/useAuth.tsx                   ⚠️ Adapt for SMS roles
services/api.ts                     ⚠️ Adapt for SMS endpoints

# BUILD & DEPLOYMENT (REUSE)
vite.config.ts                      ✅ Use as-is
jest.config.cjs                     ✅ Use as-is
package.json (backend)              ⚠️ Keep, add SMS packages
vercel.json, railway.json           ⚠️ Adapt for SMS-CAM

## 📋 IMPLEMENTATION CHECKLIST
# ─────────────────────────────────────────────────────────────

### Phase 1: Foundation (Week 1-2)
☐ Copy backend core structure
☐ Copy database configuration
☐ Copy authentication system
☐ Copy middleware stack
☐ Copy utility functions
☐ Setup environment variables
☐ Copy deployment configurations
Estimated: 🟢 40-50 hours

### Phase 2: Core Data Models (Week 2-3)
☐ Create Student, Teacher, Admin, Staff models
☐ Create Class, Subject, GradeLevel models
☐ Create Grade, Attendance, Assignment models
☐ Create User roles and permissions
☐ Adapt authentication for multi-role system
Estimated: 🟡 30-40 hours

### Phase 3: API Endpoints (Week 3-4)
☐ Create student management endpoints
☐ Create teacher management endpoints
☐ Create class management endpoints
☐ Create assignment endpoints
☐ Create gradebook endpoints
☐ Create attendance endpoints
Estimated: 🟡 40-50 hours

### Phase 4: Frontend (Week 4-6)
☐ Create admin dashboard
☐ Create student portal
☐ Create teacher portal
☐ Create parent portal
☐ Build feature pages
☐ Integrate with backend APIs
Estimated: 🟡 50-60 hours

### Phase 5: Real-time Features (Week 6-7)
☐ Implement announcements/notifications
☐ Implement classroom chat
☐ Implement assignment submission
☐ Implement grading live updates
Estimated: 🟡 25-30 hours

### Phase 6: Testing & Deployment (Week 7-8)
☐ Unit tests for services
☐ Integration tests
☐ End-to-end tests
☐ Performance optimization
☐ Deployment to production
Estimated: 🟡 30-40 hours

**TOTAL ESTIMATED TIME**: 8 weeks (vs 12-14 weeks from scratch)
**TIME SAVED**: 4-6 weeks (~30-40%)

## 📊 DETAILED FILE STATISTICS
# ─────────────────────────────────────────────────────────────

FRONTEND STRUCTURE:
  TypeScript/TSX files:    ~80
  Test files:              ~31
  Config files:            ~8
  CSS files:               ~1
  Public assets:           ~5
  Build artifacts:         ~15
  Logs/Coverage:           ~10
  TOTAL:                   ~150 files

BACKEND STRUCTURE:
  Controllers:             ~15
  Services:                ~18
  Models:                  ~17
  Routes:                  ~19
  Middleware:              ~6
  Config:                  ~5
  Utils:                   ~2
  Scripts:                 ~12
  Tests:                   ~6
  Dev artifacts:           ~14
  TOTAL:                   ~100+ files

ROOT LEVEL:
  Config files:            ~10
  Documentation:           ~4
  Deployment configs:      ~6
  Scripts:                 ~4
  Logs/artifacts:          ~15
  TOTAL:                   ~40 files

## 🎓 LEARNING RESOURCES FROM CODEBASE
# ─────────────────────────────────────────────────────────────

1. Express.js best practices
   → See: server/app.js, server/middleware/

2. MongoDB Mongoose patterns
   → See: server/config/database.js, server/models/

3. JWT authentication flow
   → See: server/services/auth.service.js, server/middleware/auth.middleware.js

4. React hooks and context
   → See: client/src/hooks/, client/services/auth.api.ts

5. API client architecture
   → See: client/src/services/

6. Test writing (Jest)
   → See: client/src/__tests__/, server/__tests__/

7. Deployment automation
   → See: vercel.json, railway.json, render.yaml

8. TypeScript in Node.js
   → See: server/tsconfig.json, types usage throughout

9. Real-time communication
   → See: client/services/socket.ts, Socket.io integration

10. Error handling patterns
    → See: server/middleware/error.middleware.js

## 🚀 QUICK START COMMAND REFERENCE
# ─────────────────────────────────────────────────────────────

# Frontend
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview               # Preview production build
npm test                      # Run Jest tests
npm test:watch               # Run tests in watch mode

# Backend
npm run dev                    # Start with nodemon
npm run start                  # Start production server
npm run make:admin -- email    # Create admin user
npm run test:unit             # Run unit tests
npm run test:integration      # Run integration tests

# Root workspace
cd client && npm install      # Install frontend deps
cd ../server && npm install   # Install backend deps

## 📞 CONTACTS & RESOURCES
# ─────────────────────────────────────────────────────────────

Technology Stack:
- React 18.3.1 + React Router 6.17
- Express 4.18.2
- MongoDB 7.7.1 (Mongoose)
- TypeScript 5.5+
- Tailwind CSS 3.4.5
- Vite 5.4.1
- Jest 29.7.0
- Socket.io 4.8.3

Development Dependencies:
- Nodemon (auto-restart)
- Axios (HTTP client)
- Multer (file uploads)
- Cloudinary (image service)
- JWT (authentication)
- Bcryptjs (password hashing)
- Express-validator (validation)

## ✅ FINAL RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────

1. START with backend API structure (highest reuse %)
2. COPY all authentication and middleware code
3. CREATE new data models for educational domain
4. BUILD API endpoints using existing patterns
5. ADAPT frontend using component patterns
6. TEST extensively with new models
7. DEPLOY using existing infrastructure
8. MONITOR with existing analytics patterns

EXPECTED OUTCOME:
- Modern, scalable School Management System
- Built on proven architecture
- 35-40% faster development
- Production-ready infrastructure
- Real-time capabilities
- Multi-role authentication
- Analytics and reporting
