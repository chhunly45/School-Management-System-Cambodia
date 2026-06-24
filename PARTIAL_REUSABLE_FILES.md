# Partially Reusable Files Report

Files with **reusable architectural patterns** that can be adapted for different domains. These have solid frameworks that work across projects but require domain-specific modifications.

**Total Count:** ~90 files  
**Effort to Reuse:** Adapt patterns (20-80% modification needed)

---

## Authentication & Authorization System

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/auth.service.js` | Service | **85% reusable** | Keep JWT, password hashing patterns; adapt User model references; add school-specific roles (Admin, Teacher, Student) |
| `server/controllers/auth.controller.js` | Controller | **80% reusable** | Keep registration/login flow; update validation for school context; adapt email/SMS triggers |
| `client/src/services/auth.api.ts` | Service | **90% reusable** | Keep API structure; just rename endpoints if needed |
| `server/routes/auth.routes.js` | Routes | **85% reusable** | Keep route structure; adapt endpoints for school context |
| `client/src/hooks/useAuth.tsx` | Hook | **95% reusable** | No changes needed; works for any role-based system |
| `server/models/User.js` | Model | **40% reusable** | Pattern reusable; completely redesign fields (role: student/teacher/admin, enrollment, courses) |
| `client/src/pages/LoginPage.tsx` | Page | **70% reusable** | Keep login form structure; update styling/branding |
| `client/src/pages/RegisterPage.tsx` | Page | **70% reusable** | Keep registration form; adapt for school registration workflow |
| `client/src/__tests__/auth.api.test.ts` | Test | **75% reusable** | Keep test structure; update test cases for school auth |
| `client/src/__tests__/auth.api.functions.test.ts` | Test | **75% reusable** | Keep test patterns; adapt for school auth functions |
| `client/src/__tests__/auth.api.branches.test.ts` | Test | **75% reusable** | Keep test structure; update test branches |

### Adaptation Strategy
**Phase 1:** Copy the auth pattern  
**Phase 2:** Replace User model with school-specific fields  
**Phase 3:** Adapt role system (marketplace roles → school roles)  
**Phase 4:** Update registration/login flows for school context  

---

## Admin System

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/admin.service.js` | Service | **85% reusable** | Keep admin query patterns; replace marketplace features with school admin features |
| `server/controllers/admin.controller.js` | Controller | **80% reusable** | Keep controller structure; adapt endpoints for school context |
| `client/src/services/admin.api.ts` | Service | **90% reusable** | Keep API structure; update endpoint names |
| `server/routes/admin.routes.js` | Routes | **85% reusable** | Keep route pattern; replace endpoints with school admin functions |
| `server/models/Admin.js` | Model | **70% reusable** | Keep admin schema pattern; add school-specific permissions/audit fields |
| `server/models/AuditLog.js` | Model | **95% reusable** | Fully reusable audit log pattern; just update entity references |
| `client/src/components/layout/AdminLayout.tsx` | Component | **80% reusable** | Keep layout structure; replace marketplace admin menu with school admin menu |
| `client/src/__tests__/admin.api.test.tsx` | Test | **70% reusable** | Keep test structure; adapt for school admin features |
| `client/src/__tests__/AdminLayout.test.tsx` | Test | **75% reusable** | Keep component test pattern; update for school layout |
| `client/src/__tests__/AdminDashboardPage.test.tsx` | Test | **70% reusable** | Keep test structure; adapt for school dashboard |

### Adaptation Strategy
**Phase 1:** Copy admin service/controller pattern  
**Phase 2:** Redefine admin permissions for school  
**Phase 3:** Update Admin model with school-specific fields  
**Phase 4:** Redesign admin dashboard for school management  

---

## Notification System

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/notification.service.js` | Service | **90% reusable** | Keep queue/delivery pattern; replace notification types (product alerts → class announcements, assignment alerts) |
| `server/controllers/notification.controller.js` | Controller | **85% reusable** | Keep CRUD structure; adapt for school notifications |
| `client/src/services/notification.api.ts` | Service | **95% reusable** | Fully reusable API client |
| `server/routes/notification.routes.js` | Routes | **90% reusable** | Keep route structure; update endpoints if needed |
| `client/src/__tests__/notification.api.test.ts` | Test | **80% reusable** | Keep test structure; adapt test cases |

### Notification Type Transformation
**Marketplace:** Product alerts, seller messages, order updates  
**School:** Assignment notifications, grade alerts, class announcements, attendance alerts

---

## User Management

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/controllers/user.controller.js` | Controller | **60% reusable** | Keep profile update pattern; adapt for school user types |
| `server/routes/user.routes.js` | Routes | **70% reusable** | Keep route structure; add school-specific endpoints |
| `client/src/services/user.api.ts` | Service | **80% reusable** | Keep API structure; adapt endpoints |
| `client/src/pages/ProfilePage.tsx` | Page | **50% reusable** | Keep form structure; completely redesign for teacher/student profiles |
| `client/src/__tests__/user.api.test.ts` | Test | **70% reusable** | Keep test pattern; adapt test cases |

### Adaptation Strategy
**Phase 1:** Extend User model for school roles  
**Phase 2:** Create teacher/student-specific profile pages  
**Phase 3:** Add school-specific profile fields (department, subject, enrollment)  

---

## Upload & File Management

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/upload.service.js` | Service | **95% reusable** | Change upload types: products → course materials, assignments, documents |
| `server/controllers/upload.controller.js` | Controller | **95% reusable** | Keep controller pattern; adapt validation rules |
| `client/src/services/upload.api.ts` | Service | **95% reusable** | Keep API structure; no changes needed |
| `server/routes/upload.routes.js` | Routes | **95% reusable** | Keep route structure; possibly add new endpoints |
| `client/src/__tests__/upload.api.test.ts` | Test | **90% reusable** | Keep test structure; adapt for school file types |

### Adaptation Strategy
**File Types to Support:**
- Course materials (PDF, DOCX, PPTX)
- Student assignments (submissions)
- Student photos (profile pictures)
- Grade documents
- Achievement certificates

---

## Analytics & Reporting

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/seller-analytics.service.js` | Service | **70% reusable** | Pattern excellent; replace seller metrics with teacher metrics (class engagement, student performance) |
| `server/services/traffic-analytics.service.js` | Service | **80% reusable** | Keep analytics pattern; track school engagement (login frequency, page views by role) |
| `client/src/services/seller-analytics.api.ts` | Service | **90% reusable** | Keep API structure; change endpoint names |
| `client/src/services/traffic-analytics.api.ts` | Service | **90% reusable** | Keep API structure |
| `server/services/revenue.service.js` | Service | **20% reusable** | Keep calculation pattern only; marketplace revenue tracking doesn't apply to school |
| `client/src/services/revenue.api.ts` | Service | **20% reusable** | Reuse if school has paid features (donations, premiums) |
| `client/src/__tests__/seller-analytics.api.test.ts` | Test | **80% reusable** | Keep test structure; adapt metrics |
| `client/src/__tests__/traffic-analytics.api.test.ts` | Test | **85% reusable** | Keep test structure |
| `server/scripts/run-seller-verification-tests.js` | Script | **40% reusable** | Pattern reusable; replace with teacher/course verification |

### Adaptation Strategy
**Metric Transformations:**
- Seller views → Teacher class views
- Product sales → Course enrollments
- Revenue → Course performance/engagement metrics
- Seller ratings → Teacher ratings

---

## Email & SMS Communication

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/email.service.js` | Service | **95% reusable** | Architecture excellent; change email templates (password reset → account activation, grade notifications, class announcements) |
| `server/services/sms.service.js` | Service | **95% reusable** | Keep SMS pattern; adapt templates for school alerts |
| `server/__tests__/phone.util.test.js` | Test | **90% reusable** | Keep phone validation pattern; no changes needed |
| `server/__tests__/verification.integration.test.js` | Test | **80% reusable** | Keep integration test pattern; adapt for school verification |

### Adaptation Strategy
**Email Templates:**
- Account setup → Class enrollment
- Order confirmation → Course registration
- Seller alerts → Teacher notifications
- Review notifications → Grade notifications

---

## Verification System

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/verification.service.js` | Service | **80% reusable** | Pattern reusable; change verification logic (seller verification → teacher/admin verification) |
| `server/controllers/verification.controller.js` | Controller | **85% reusable** | Keep controller pattern; adapt for school verification flow |
| `client/src/services/api.ts` (verification endpoints) | Service | **90% reusable** | Keep structure |
| `server/routes/verification.routes.js` | Routes | **85% reusable** | Keep route pattern; adapt endpoints |
| `server/models/SellerVerification.js` | Model | **50% reusable** | Pattern reusable; replace with teacher verification model |
| `client/src/pages/VerificationRequestPage.tsx` | Page | **60% reusable** | Keep form pattern; adapt for teacher verification |
| `client/src/pages/VerifyEmailPage.tsx` | Page | **70% reusable** | Keep email verification flow; reusable for school |

### Adaptation Strategy
**Verification Types:**
- Marketplace: Seller verification (document upload, review)
- School: Teacher verification (credentials, qualifications), Email verification, Phone verification

---

## Report/Issue Management

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/services/report.service.js` | Service | **85% reusable** | Keep issue tracking pattern; change report types (product reports → student behavior reports, grievances) |
| `server/controllers/report.controller.js` | Controller | **85% reusable** | Keep pattern; adapt for school reporting |
| `client/src/services/report.api.ts` | Service | **90% reusable** | Keep API structure |
| `server/routes/report.routes.js` | Routes | **85% reusable** | Keep pattern; update endpoints if needed |
| `client/src/__tests__/report.api.test.ts` | Test | **80% reusable** | Keep test pattern |

### Adaptation Strategy
**Report Types:**
- Marketplace: Product quality issues, seller behavior
- School: Student behavior issues, course grievances, academic concerns

---

## Location & Geographic Services

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/controllers/location.controller.js` | Controller | **80% reusable** | Keep location pattern; may need to adapt for school campus locations |
| `server/routes/location.routes.js` | Routes | **85% reusable** | Keep pattern |
| `client/src/services/location.api.ts` | Service | **85% reusable** | Keep API structure |
| `client/src/__tests__/location.api.test.ts` | Test | **85% reusable** | Keep test pattern |
| `client/src/__mocks__/location.api.ts` | Mock | **90% reusable** | Keep mock structure |

### Adaptation Strategy
**Use Cases:**
- Marketplace: Geographic location for products
- School: School locations, campus buildings, classroom locations

---

## Layout & Common Components

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `client/src/components/layout/Header.tsx` | Component | **70% reusable** | Keep layout structure; replace marketplace logo/nav with school branding |
| `client/src/components/layout/Footer.tsx` | Component | **75% reusable** | Keep footer pattern; update school information |
| `client/src/components/layout/AppShell.tsx` | Component | **85% reusable** | Keep app shell structure; adapt for school navigation |
| `client/src/components/ErrorBoundary.tsx` | Component | **95% reusable** | Fully reusable error handling |
| `client/src/components/SEO.tsx` | Component | **90% reusable** | Keep SEO pattern; update metadata for school site |
| `client/src/__tests__/Header.test.tsx` | Test | **75% reusable** | Keep test pattern; adapt for school header |
| `client/src/__tests__/layout.test.tsx` | Test | **80% reusable** | Keep test pattern |
| `client/src/__tests__/SEO.test.tsx` | Test | **85% reusable** | Keep test pattern |

### Adaptation Strategy
**Navigation Changes:**
- Marketplace nav (Browse, Sell, My Products) → School nav (Courses, Dashboard, Announcements)
- Product search → Course search
- Seller link → Teacher link

---

## Routes & Navigation

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `client/src/routes/AppRoutes.tsx` | Routes | **70% reusable** | Keep routing pattern; replace marketplace routes with school routes |
| `client/src/routes/AdminRoute.tsx` | Routes | **90% reusable** | Keep admin protection pattern; no changes needed for role names |

### Adaptation Strategy
**Route Changes:**
- `/products` → `/courses`
- `/seller-dashboard` → `/teacher-dashboard`
- `/admin/promotions` → `/admin/announcements`

---

## Hooks & Context

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `client/src/hooks/useSocket.ts` | Hook | **95% reusable** | Fully reusable WebSocket pattern; no changes needed |

---

## Utilities & Helpers

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `client/src/utils/views.ts` | Utility | **100% reusable** | No changes needed; generic view formatting |
| `server/utils/cloudinary-validator.js` | Utility | **95% reusable** | No changes needed; image validation is generic |
| `server/utils/phone.js` | Utility | **90% reusable** | Keep Cambodian phone validation; minor adaptation if needed |

---

## Build & Deployment Scripts

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `server/scripts/start-with-memory.js` | Script | **90% reusable** | Keep server startup pattern; no changes needed |
| `server/scripts/test-auth-header.js` | Script | **85% reusable** | Keep test pattern; no changes needed |
| `server/scripts/run-integration-tests.js` | Script | **85% reusable** | Keep test runner; adapt test cases |

---

## Configuration Files (Partially Reusable)

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `vite.config.ts` | Config | **90% reusable** | Keep Vite structure; just update project name |
| `vercel.json` (client) | Config | **80% reusable** | Keep deployment pattern; update routes if needed |

---

## Testing Infrastructure

| File | Type | Reusability | Adaptation Needed |
|------|------|-------------|-------------------|
| `client/src/__tests__/api.test.ts` | Test | **85% reusable** | Keep test structure; adapt for school API |
| `server/__tests__/csrf.fallback.test.js` | Test | **95% reusable** | Keep CSRF test pattern; fully reusable |

---

## Summary by Category

### Highly Adaptable (80-95% reusable)
- **Email/SMS Services** (95%)
- **Upload Services** (95%)
- **Notification Pattern** (90%)
- **Auth API/Hooks** (90-95%)
- **Admin Layout** (80-85%)
- **Error Handling** (95%)
- **WebSocket Hooks** (95%)

### Moderately Adaptable (60-80% reusable)
- **Auth Service/Controller** (80-85%)
- **User Management** (60-80%)
- **Verification System** (80%)
- **Report System** (85%)
- **Analytics Services** (70-80%)
- **Layout Components** (70-85%)

### Pattern-Based (40-60% reusable)
- **User Model** (40%)
- **Revenue Service** (20%)
- **Profile Pages** (50-70%)
- **Navigation/Routes** (70%)

### Total Partially Reusable: ~90 files

---

## Recommended Adaptation Roadmap

### Phase 1: Core Infrastructure (Week 1)
- Copy auth pattern, adapt for school roles
- Copy admin system, adapt permissions
- Copy email/SMS services (mostly reusable)
- Copy notification pattern

### Phase 2: Data Models & Services (Week 2-3)
- Redesign User model for school context
- Create Course, Class, Assignment models
- Adapt analytics services for school metrics
- Adapt verification system for teachers

### Phase 3: Frontend & UI (Week 3-4)
- Update layouts with school branding
- Adapt routes for school navigation
- Redesign pages for school context
- Update components for school features

### Phase 4: Testing & Verification (Week 4-5)
- Adapt test cases to school domain
- Update integration tests
- Verify all adapted services work together

### Estimated Effort
- **Copy & Paste:** 40-50% saved (auth, email, notifications, upload)
- **Adapt:** 30-40% reduced effort (analytics, verification, reports)
- **New Development:** 20-30% (school-specific features)

**Overall Time Savings: 35-45% faster development compared to building from scratch**
