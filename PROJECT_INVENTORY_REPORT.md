# SMS-CAM Architecture Inventory

- Generated: 1782600996733382600
- Total discovered source files: 287

This report is based on the current repository structure and direct route wiring in the client and server entrypoints. It is intended as a read-only planning artifact and does not change runtime behavior.

## Client Pages

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [client/src/pages/AboutPage.tsx](client/src/pages/AboutPage.tsx) | Client page for AboutPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/AcademicPage.tsx](client/src/pages/AcademicPage.tsx) | Client page for AcademicPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/AcademicRecordPage.tsx](client/src/pages/AcademicRecordPage.tsx) | Client page for AcademicRecordPage | NO | — | client/src/hooks/useAuth.tsx | Academics | REMOVE | LOW |
| [client/src/pages/AcademicYearPage.tsx](client/src/pages/AcademicYearPage.tsx) | Client page for AcademicYearPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Academics | KEEP | MEDIUM |
| [client/src/pages/AccountSettingsPage.tsx](client/src/pages/AccountSettingsPage.tsx) | Client page for AccountSettingsPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/password.ts | UI | KEEP | MEDIUM |
| [client/src/pages/AdminBannersPage.tsx](client/src/pages/AdminBannersPage.tsx) | Client page for AdminBannersPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AdminDashboardPage.tsx](client/src/pages/AdminDashboardPage.tsx) | Client page for AdminDashboardPage | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/AdminPromotionsPage.tsx](client/src/pages/AdminPromotionsPage.tsx) | Client page for AdminPromotionsPage | YES | client/src/routes/AppRoutes.tsx | — | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AdminRevenuePage.tsx](client/src/pages/AdminRevenuePage.tsx) | Client page for AdminRevenuePage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/AdminTrafficAnalyticsPage.tsx](client/src/pages/AdminTrafficAnalyticsPage.tsx) | Client page for AdminTrafficAnalyticsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/AdminVerificationReviewPage.tsx](client/src/pages/AdminVerificationReviewPage.tsx) | Client page for AdminVerificationReviewPage | YES | client/src/routes/AppRoutes.tsx | — | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AttendancePage.tsx](client/src/pages/AttendancePage.tsx) | Client page for AttendancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Attendance | KEEP | MEDIUM |
| [client/src/pages/CertificatesPage.tsx](client/src/pages/CertificatesPage.tsx) | Client page for CertificatesPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Academics | KEEP | MEDIUM |
| [client/src/pages/ChatPage.tsx](client/src/pages/ChatPage.tsx) | Client page for ChatPage | YES | client/src/routes/AppRoutes.tsx | client/src/services/socket.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ClassPage.tsx](client/src/pages/ClassPage.tsx) | Client page for ClassPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/DashboardPage.tsx](client/src/pages/DashboardPage.tsx) | Client page for DashboardPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/price.ts, client/src/utils/views.ts | Admin/Operations | REFACTOR | MEDIUM |
| [client/src/pages/EmployeeAttendancePage.tsx](client/src/pages/EmployeeAttendancePage.tsx) | Client page for EmployeeAttendancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Attendance | KEEP | MEDIUM |
| [client/src/pages/ExpensesPage.tsx](client/src/pages/ExpensesPage.tsx) | Client page for ExpensesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/FavoritesPage.tsx](client/src/pages/FavoritesPage.tsx) | Client page for FavoritesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/FinancePage.tsx](client/src/pages/FinancePage.tsx) | Client page for FinancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/ForgotPasswordPage.tsx](client/src/pages/ForgotPasswordPage.tsx) | Client page for ForgotPasswordPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/password.ts | UI | KEEP | MEDIUM |
| [client/src/pages/FuelPage.tsx](client/src/pages/FuelPage.tsx) | Client page for FuelPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Transport | KEEP | MEDIUM |
| [client/src/pages/GradePage.tsx](client/src/pages/GradePage.tsx) | Client page for GradePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/GuidePage.tsx](client/src/pages/GuidePage.tsx) | Client page for GuidePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/HelpPage.tsx](client/src/pages/HelpPage.tsx) | Client page for HelpPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/HomePage.tsx](client/src/pages/HomePage.tsx) | Client page for HomePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/utils/category.ts, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx) | Client page for LoginPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/viteEnv.ts | UI | KEEP | MEDIUM |
| [client/src/pages/NotFoundPage.tsx](client/src/pages/NotFoundPage.tsx) | Client page for NotFoundPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |
| [client/src/pages/NotificationsPage.tsx](client/src/pages/NotificationsPage.tsx) | Client page for NotificationsPage | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/PaymentsPage.tsx](client/src/pages/PaymentsPage.tsx) | Client page for PaymentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/PostProductPage.tsx](client/src/pages/PostProductPage.tsx) | Client page for PostProductPage | YES | client/src/routes/AppRoutes.tsx | client/src/services/api.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProductDetailPage.tsx](client/src/pages/ProductDetailPage.tsx) | Client page for ProductDetailPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SellerContactCard.tsx, client/src/hooks/useAuth.tsx, client/src/utils/price.ts, client/src/utils/product.ts, client/src/utils/views.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProductListPage.tsx](client/src/pages/ProductListPage.tsx) | Client page for ProductListPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/components/marketplace/TopAdBanner.tsx, client/src/utils/product.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProfilePage.tsx](client/src/pages/ProfilePage.tsx) | Client page for ProfilePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/hooks/useAuth.tsx, client/src/utils/price.ts, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/RegisterPage.tsx](client/src/pages/RegisterPage.tsx) | Client page for RegisterPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/password.ts, client/src/utils/viteEnv.ts | UI | KEEP | MEDIUM |
| [client/src/pages/RoutesPage.tsx](client/src/pages/RoutesPage.tsx) | Client page for RoutesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/SchoolDashboardPage.tsx](client/src/pages/SchoolDashboardPage.tsx) | Client page for SchoolDashboardPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/price.ts | School Settings | KEEP | MEDIUM |
| [client/src/pages/SchoolSettingsPage.tsx](client/src/pages/SchoolSettingsPage.tsx) | Client page for SchoolSettingsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | School Settings | KEEP | MEDIUM |
| [client/src/pages/SellerAnalyticsPage.tsx](client/src/pages/SellerAnalyticsPage.tsx) | Client page for SellerAnalyticsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/SellerPromotionsPage.tsx](client/src/pages/SellerPromotionsPage.tsx) | Client page for SellerPromotionsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/StudentsPage.tsx](client/src/pages/StudentsPage.tsx) | Client page for StudentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Student | KEEP | MEDIUM |
| [client/src/pages/SubjectPage.tsx](client/src/pages/SubjectPage.tsx) | Client page for SubjectPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/TeachersPage.tsx](client/src/pages/TeachersPage.tsx) | Client page for TeachersPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Teacher | KEEP | MEDIUM |
| [client/src/pages/TransportAssignmentsPage.tsx](client/src/pages/TransportAssignmentsPage.tsx) | Client page for TransportAssignmentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Transport | KEEP | MEDIUM |
| [client/src/pages/TransportPage.tsx](client/src/pages/TransportPage.tsx) | Client page for TransportPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/VehiclesPage.tsx](client/src/pages/VehiclesPage.tsx) | Client page for VehiclesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/VerificationRequestPage.tsx](client/src/pages/VerificationRequestPage.tsx) | Client page for VerificationRequestPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |
| [client/src/pages/VerifyEmailPage.tsx](client/src/pages/VerifyEmailPage.tsx) | Client page for VerifyEmailPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |

## Client Components

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [client/src/components/common/DeleteConfirmationModal.tsx](client/src/components/common/DeleteConfirmationModal.tsx) | Reusable UI component for DeleteConfirmationModal | YES | client/src/pages/AcademicYearPage.tsx, client/src/pages/ClassPage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/GradePage.tsx, client/src/pages/RoutesPage.tsx, client/src/pages/SchoolSettingsPage.tsx, client/src/pages/StudentsPage.tsx | — | UI | KEEP | LOW |
| [client/src/components/ErrorBoundary.tsx](client/src/components/ErrorBoundary.tsx) | Reusable UI component for ErrorBoundary | NO | — | — | UI | REMOVE | LOW |
| [client/src/components/layout/AdminLayout.tsx](client/src/components/layout/AdminLayout.tsx) | Reusable UI component for AdminLayout | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | LOW |
| [client/src/components/layout/AppShell.tsx](client/src/components/layout/AppShell.tsx) | Reusable UI component for AppShell | YES | client/src/App.tsx | client/src/components/layout/Footer.tsx, client/src/components/layout/Header.tsx | UI | KEEP | LOW |
| [client/src/components/layout/Footer.tsx](client/src/components/layout/Footer.tsx) | Reusable UI component for Footer | YES | client/src/components/layout/AppShell.tsx | — | UI | KEEP | LOW |
| [client/src/components/layout/Header.tsx](client/src/components/layout/Header.tsx) | Reusable UI component for Header | YES | client/src/components/layout/AppShell.tsx | client/src/hooks/useAuth.tsx, client/src/hooks/useSocket.ts, client/src/services/api.ts | UI | KEEP | LOW |
| [client/src/components/marketplace/CategoriesGrid.tsx](client/src/components/marketplace/CategoriesGrid.tsx) | Reusable UI component for CategoriesGrid | NO | — | client/src/services/api.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/FeaturedSection.tsx](client/src/components/marketplace/FeaturedSection.tsx) | Reusable UI component for FeaturedSection | NO | — | client/src/components/marketplace/ProductCard.tsx, client/src/utils/category.ts, client/src/utils/product.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/ProductCard.tsx](client/src/components/marketplace/ProductCard.tsx) | Reusable UI component for ProductCard | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/pages/FavoritesPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx, client/src/pages/ProductListPage.tsx, client/src/pages/ProfilePage.tsx | client/src/utils/category.ts, client/src/utils/price.ts, client/src/utils/views.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/SearchBar.tsx](client/src/components/marketplace/SearchBar.tsx) | Reusable UI component for SearchBar | YES | client/src/pages/HomePage.tsx, client/src/pages/ProductListPage.tsx | client/src/services/api.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/SellerContactCard.tsx](client/src/components/marketplace/SellerContactCard.tsx) | Reusable UI component for SellerContactCard | YES | client/src/pages/ProductDetailPage.tsx | — | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/TopAdBanner.tsx](client/src/components/marketplace/TopAdBanner.tsx) | Reusable UI component for TopAdBanner | YES | client/src/pages/ProductListPage.tsx | — | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/SEO.tsx](client/src/components/SEO.tsx) | Reusable UI component for SEO | YES | client/src/pages/AboutPage.tsx, client/src/pages/GuidePage.tsx, client/src/pages/HelpPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx | client/src/utils/viteEnv.ts | UI | KEEP | LOW |

## Client Services

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [client/src/services/academicRecord.api.ts](client/src/services/academicRecord.api.ts) | Client API helper for academicRecord | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/academicYear.api.ts](client/src/services/academicYear.api.ts) | Client API helper for academicYear | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/admin.api.ts](client/src/services/admin.api.ts) | Client API helper for admin | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/api.ts](client/src/services/api.ts) | Client API helper for api.ts | YES | client/src/components/layout/Header.tsx, client/src/components/marketplace/CategoriesGrid.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/pages/PostProductPage.tsx, client/src/services/academicRecord.api.ts, client/src/services/academicYear.api.ts, client/src/services/admin.api.ts, client/src/services/attendance.api.ts | client/src/utils/viteEnv.ts | Shared | KEEP | MEDIUM |
| [client/src/services/attendance.api.ts](client/src/services/attendance.api.ts) | Client API helper for attendance | NO | — | client/src/services/api.ts | Attendance | REMOVE | LOW |
| [client/src/services/auth.api.ts](client/src/services/auth.api.ts) | Client API helper for auth | NO | — | client/src/services/api.ts | Auth | REMOVE | LOW |
| [client/src/services/banner.api.ts](client/src/services/banner.api.ts) | Client API helper for banner | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/certificate.api.ts](client/src/services/certificate.api.ts) | Client API helper for certificate | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/chat.api.ts](client/src/services/chat.api.ts) | Client API helper for chat | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/class.api.ts](client/src/services/class.api.ts) | Client API helper for class | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/employeeAttendance.api.ts](client/src/services/employeeAttendance.api.ts) | Client API helper for employeeAttendance | NO | — | client/src/services/api.ts | Attendance | REMOVE | LOW |
| [client/src/services/expense.api.ts](client/src/services/expense.api.ts) | Client API helper for expense | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/favorites.api.ts](client/src/services/favorites.api.ts) | Client API helper for favorites | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/finance.api.ts](client/src/services/finance.api.ts) | Client API helper for finance | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/fuelRecord.api.ts](client/src/services/fuelRecord.api.ts) | Client API helper for fuelRecord | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/grade.api.ts](client/src/services/grade.api.ts) | Client API helper for grade | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/location.api.ts](client/src/services/location.api.ts) | Client API helper for location | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/notification.api.ts](client/src/services/notification.api.ts) | Client API helper for notification | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/payment.api.ts](client/src/services/payment.api.ts) | Client API helper for payment | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/product.api.ts](client/src/services/product.api.ts) | Client API helper for product | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/promotion.api.ts](client/src/services/promotion.api.ts) | Client API helper for promotion | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/report.api.ts](client/src/services/report.api.ts) | Client API helper for report | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/revenue.api.ts](client/src/services/revenue.api.ts) | Client API helper for revenue | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/review.api.ts](client/src/services/review.api.ts) | Client API helper for review | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/route.api.ts](client/src/services/route.api.ts) | Client API helper for route | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/schoolDashboard.api.ts](client/src/services/schoolDashboard.api.ts) | Client API helper for schoolDashboard | NO | — | client/src/services/api.ts | School Settings | REMOVE | LOW |
| [client/src/services/schoolSettings.api.ts](client/src/services/schoolSettings.api.ts) | Client API helper for schoolSettings | NO | — | client/src/services/api.ts | School Settings | REMOVE | LOW |
| [client/src/services/seller-analytics.api.ts](client/src/services/seller-analytics.api.ts) | Client API helper for seller-analytics | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/socket.ts](client/src/services/socket.ts) | Client API helper for socket.ts | YES | client/src/hooks/useSocket.ts, client/src/pages/ChatPage.tsx | client/src/utils/viteEnv.ts | Shared | KEEP | MEDIUM |
| [client/src/services/student.api.ts](client/src/services/student.api.ts) | Client API helper for student | NO | — | client/src/services/api.ts | Student | REMOVE | LOW |
| [client/src/services/subject.api.ts](client/src/services/subject.api.ts) | Client API helper for subject | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/teacher.api.ts](client/src/services/teacher.api.ts) | Client API helper for teacher | NO | — | client/src/services/api.ts | Teacher | REMOVE | LOW |
| [client/src/services/traffic-analytics.api.ts](client/src/services/traffic-analytics.api.ts) | Client API helper for traffic-analytics | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/transport.api.ts](client/src/services/transport.api.ts) | Client API helper for transport | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/transportAssignment.api.ts](client/src/services/transportAssignment.api.ts) | Client API helper for transportAssignment | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/upload.api.ts](client/src/services/upload.api.ts) | Client API helper for upload | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/user.api.ts](client/src/services/user.api.ts) | Client API helper for user | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/vehicle.api.ts](client/src/services/vehicle.api.ts) | Client API helper for vehicle | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |

## Client Utilities

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [client/src/utils/category.ts](client/src/utils/category.ts) | Utility helper for category | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/pages/HomePage.tsx | — | Legacy Marketplace | KEEP | LOW |
| [client/src/utils/date.ts](client/src/utils/date.ts) | Utility helper for date | YES | client/src/pages/AcademicYearPage.tsx, client/src/pages/AttendancePage.tsx, client/src/pages/CertificatesPage.tsx, client/src/pages/EmployeeAttendancePage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/PaymentsPage.tsx, client/src/pages/StudentsPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/password.ts](client/src/utils/password.ts) | Utility helper for password | YES | client/src/pages/AccountSettingsPage.tsx, client/src/pages/ForgotPasswordPage.tsx, client/src/pages/RegisterPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/price.ts](client/src/utils/price.ts) | Utility helper for price | YES | client/src/components/marketplace/ProductCard.tsx, client/src/pages/AdminRevenuePage.tsx, client/src/pages/DashboardPage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FinancePage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/PaymentsPage.tsx, client/src/pages/ProductDetailPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/product.ts](client/src/utils/product.ts) | Utility helper for product | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/pages/FavoritesPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx, client/src/pages/ProductListPage.tsx, client/src/pages/ProfilePage.tsx | — | Legacy Marketplace | KEEP | LOW |
| [client/src/utils/views.ts](client/src/utils/views.ts) | Utility helper for views | YES | client/src/components/marketplace/ProductCard.tsx, client/src/pages/DashboardPage.tsx, client/src/pages/ProductDetailPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/viteEnv.ts](client/src/utils/viteEnv.ts) | Utility helper for viteEnv | YES | client/src/components/SEO.tsx, client/src/pages/LoginPage.tsx, client/src/pages/RegisterPage.tsx, client/src/services/api.ts, client/src/services/socket.ts | — | Shared | KEEP | LOW |

## Server Routes

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [server/routes/academicRecord.routes.js](server/routes/academicRecord.routes.js) | Server route module for academicRecord.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/academicYear.routes.js](server/routes/academicYear.routes.js) | Server route module for academicYear.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/admin.routes.js](server/routes/admin.routes.js) | Server route module for admin.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/attendance.routes.js](server/routes/attendance.routes.js) | Server route module for attendance.routes | NO | — | — | Attendance | REMOVE | LOW |
| [server/routes/auth.routes.js](server/routes/auth.routes.js) | Server route module for auth.routes | NO | — | — | Auth | REMOVE | LOW |
| [server/routes/banner.routes.js](server/routes/banner.routes.js) | Server route module for banner.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/category.routes.js](server/routes/category.routes.js) | Server route module for category.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/certificate.routes.js](server/routes/certificate.routes.js) | Server route module for certificate.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/chat.routes.js](server/routes/chat.routes.js) | Server route module for chat.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/class.routes.js](server/routes/class.routes.js) | Server route module for class.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/employeeAttendance.routes.js](server/routes/employeeAttendance.routes.js) | Server route module for employeeAttendance.routes | NO | — | — | Attendance | REMOVE | LOW |
| [server/routes/expense.routes.js](server/routes/expense.routes.js) | Server route module for expense.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/favorite.routes.js](server/routes/favorite.routes.js) | Server route module for favorite.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/finance.routes.js](server/routes/finance.routes.js) | Server route module for finance.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/fuelRecord.routes.js](server/routes/fuelRecord.routes.js) | Server route module for fuelRecord.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/grade.routes.js](server/routes/grade.routes.js) | Server route module for grade.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/index.js](server/routes/index.js) | Server route module for index | YES | server/app.js, server/app.js | — | Transport | KEEP | HIGH |
| [server/routes/location.routes.js](server/routes/location.routes.js) | Server route module for location.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/notification.routes.js](server/routes/notification.routes.js) | Server route module for notification.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/payment.routes.js](server/routes/payment.routes.js) | Server route module for payment.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/product.routes.js](server/routes/product.routes.js) | Server route module for product.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/promotions.routes.js](server/routes/promotions.routes.js) | Server route module for promotions.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/report.routes.js](server/routes/report.routes.js) | Server route module for report.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/review.routes.js](server/routes/review.routes.js) | Server route module for review.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/route.routes.js](server/routes/route.routes.js) | Server route module for route.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/schoolDashboard.routes.js](server/routes/schoolDashboard.routes.js) | Server route module for schoolDashboard.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/schoolSetting.routes.js](server/routes/schoolSetting.routes.js) | Server route module for schoolSetting.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/seller-analytics.routes.js](server/routes/seller-analytics.routes.js) | Server route module for seller-analytics.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/sitemap.routes.js](server/routes/sitemap.routes.js) | Server route module for sitemap.routes | NO | — | server/models/Category.js, server/models/Product.js | Transport | REMOVE | LOW |
| [server/routes/student.routes.js](server/routes/student.routes.js) | Server route module for student.routes | NO | — | — | Student | REMOVE | LOW |
| [server/routes/subject.routes.js](server/routes/subject.routes.js) | Server route module for subject.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/teacher.routes.js](server/routes/teacher.routes.js) | Server route module for teacher.routes | NO | — | — | Teacher | REMOVE | LOW |
| [server/routes/traffic-analytics.routes.js](server/routes/traffic-analytics.routes.js) | Server route module for traffic-analytics.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/transport.routes.js](server/routes/transport.routes.js) | Server route module for transport.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/transportAssignment.routes.js](server/routes/transportAssignment.routes.js) | Server route module for transportAssignment.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/upload.routes.js](server/routes/upload.routes.js) | Server route module for upload.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/user.routes.js](server/routes/user.routes.js) | Server route module for user.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/vehicle.routes.js](server/routes/vehicle.routes.js) | Server route module for vehicle.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/verification.routes.js](server/routes/verification.routes.js) | Server route module for verification.routes | NO | — | — | Transport | REMOVE | LOW |

## Server Controllers

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [server/controllers/academicRecord.controller.js](server/controllers/academicRecord.controller.js) | Controller handling academicRecord | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/academicYear.controller.js](server/controllers/academicYear.controller.js) | Controller handling academicYear | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/admin.controller.js](server/controllers/admin.controller.js) | Controller handling admin | NO | — | server/config/index.js | Admin/Operations | REMOVE | LOW |
| [server/controllers/attendance.controller.js](server/controllers/attendance.controller.js) | Controller handling attendance | NO | — | — | Attendance | REMOVE | LOW |
| [server/controllers/auth.controller.js](server/controllers/auth.controller.js) | Controller handling auth | NO | — | — | Auth | REMOVE | LOW |
| [server/controllers/banner.controller.js](server/controllers/banner.controller.js) | Controller handling banner | NO | — | server/config/cloudinary.js, server/models/Banner.js | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/category.controller.js](server/controllers/category.controller.js) | Controller handling category | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/certificate.controller.js](server/controllers/certificate.controller.js) | Controller handling certificate | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/chat.controller.js](server/controllers/chat.controller.js) | Controller handling chat | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/class.controller.js](server/controllers/class.controller.js) | Controller handling class | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/employeeAttendance.controller.js](server/controllers/employeeAttendance.controller.js) | Controller handling employeeAttendance | NO | — | — | Attendance | REMOVE | LOW |
| [server/controllers/expense.controller.js](server/controllers/expense.controller.js) | Controller handling expense | NO | — | — | Finance | REMOVE | LOW |
| [server/controllers/favorite.controller.js](server/controllers/favorite.controller.js) | Controller handling favorite | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/finance.controller.js](server/controllers/finance.controller.js) | Controller handling finance | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/controllers/fuelRecord.controller.js](server/controllers/fuelRecord.controller.js) | Controller handling fuelRecord | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/grade.controller.js](server/controllers/grade.controller.js) | Controller handling grade | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/location.controller.js](server/controllers/location.controller.js) | Controller handling location | NO | — | server/config/provinces.js | Shared | REMOVE | LOW |
| [server/controllers/notification.controller.js](server/controllers/notification.controller.js) | Controller handling notification | NO | — | — | Admin/Operations | REMOVE | LOW |
| [server/controllers/payment.controller.js](server/controllers/payment.controller.js) | Controller handling payment | NO | — | — | Finance | REMOVE | LOW |
| [server/controllers/product.controller.js](server/controllers/product.controller.js) | Controller handling product | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/promotion.controller.js](server/controllers/promotion.controller.js) | Controller handling promotion | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/report.controller.js](server/controllers/report.controller.js) | Controller handling report | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/review.controller.js](server/controllers/review.controller.js) | Controller handling review | NO | — | server/models/User.js | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/route.controller.js](server/controllers/route.controller.js) | Controller handling route | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/schoolDashboard.controller.js](server/controllers/schoolDashboard.controller.js) | Controller handling schoolDashboard | NO | — | server/models/index.js | School Settings | REMOVE | LOW |
| [server/controllers/schoolSetting.controller.js](server/controllers/schoolSetting.controller.js) | Controller handling schoolSetting | NO | — | — | School Settings | REMOVE | LOW |
| [server/controllers/seller-analytics.controller.js](server/controllers/seller-analytics.controller.js) | Controller handling seller-analytics | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/student.controller.js](server/controllers/student.controller.js) | Controller handling student | NO | — | — | Student | REMOVE | LOW |
| [server/controllers/subject.controller.js](server/controllers/subject.controller.js) | Controller handling subject | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/teacher.controller.js](server/controllers/teacher.controller.js) | Controller handling teacher | NO | — | — | Teacher | REMOVE | LOW |
| [server/controllers/traffic-analytics.controller.js](server/controllers/traffic-analytics.controller.js) | Controller handling traffic-analytics | NO | — | — | Admin/Operations | REMOVE | LOW |
| [server/controllers/transport.controller.js](server/controllers/transport.controller.js) | Controller handling transport | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/transportAssignment.controller.js](server/controllers/transportAssignment.controller.js) | Controller handling transportAssignment | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/upload.controller.js](server/controllers/upload.controller.js) | Controller handling upload | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/user.controller.js](server/controllers/user.controller.js) | Controller handling user | NO | — | server/models/Favorite.js, server/models/Product.js, server/models/User.js | Shared | REMOVE | LOW |
| [server/controllers/vehicle.controller.js](server/controllers/vehicle.controller.js) | Controller handling vehicle | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/verification.controller.js](server/controllers/verification.controller.js) | Controller handling verification | NO | — | — | Shared | REMOVE | LOW |

## Server Services

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [server/services/academicRecord.service.js](server/services/academicRecord.service.js) | Server service for academicRecord | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/academicYear.service.js](server/services/academicYear.service.js) | Server service for academicYear | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/admin.service.js](server/services/admin.service.js) | Server service for admin | NO | — | server/config/provinces.js, server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/attendance.service.js](server/services/attendance.service.js) | Server service for attendance | NO | — | server/models/index.js | Attendance | REMOVE | LOW |
| [server/services/auth.service.js](server/services/auth.service.js) | Server service for auth | NO | — | server/config/cloudinary.js, server/config/index.js, server/models/index.js, server/utils/phone.js | Auth | REMOVE | LOW |
| [server/services/category.service.js](server/services/category.service.js) | Server service for category | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/certificate.service.js](server/services/certificate.service.js) | Server service for certificate | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/chat.service.js](server/services/chat.service.js) | Server service for chat | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/class.service.js](server/services/class.service.js) | Server service for class | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/email.service.js](server/services/email.service.js) | Server service for email | NO | — | server/config/index.js | Shared | REMOVE | LOW |
| [server/services/employeeAttendance.service.js](server/services/employeeAttendance.service.js) | Server service for employeeAttendance | NO | — | server/models/index.js | Attendance | REMOVE | LOW |
| [server/services/expense.service.js](server/services/expense.service.js) | Server service for expense | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/favorite.service.js](server/services/favorite.service.js) | Server service for favorite | NO | — | server/models/index.js | Shared | REMOVE | LOW |
| [server/services/fuelRecord.service.js](server/services/fuelRecord.service.js) | Server service for fuelRecord | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/grade.service.js](server/services/grade.service.js) | Server service for grade | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/notification.service.js](server/services/notification.service.js) | Server service for notification | NO | — | server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/payment.service.js](server/services/payment.service.js) | Server service for payment | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/product.service.js](server/services/product.service.js) | Server service for product | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/promotion.service.js](server/services/promotion.service.js) | Server service for promotion | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/report.service.js](server/services/report.service.js) | Server service for report | NO | — | server/models/index.js | Shared | REMOVE | LOW |
| [server/services/revenue.service.js](server/services/revenue.service.js) | Server service for revenue | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/review.service.js](server/services/review.service.js) | Server service for review | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/route.service.js](server/services/route.service.js) | Server service for route | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/schoolSetting.service.js](server/services/schoolSetting.service.js) | Server service for schoolSetting | NO | — | server/models/index.js | School Settings | REMOVE | LOW |
| [server/services/seller-analytics.service.js](server/services/seller-analytics.service.js) | Server service for seller-analytics | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/sms.service.js](server/services/sms.service.js) | Server service for sms | NO | — | server/config/index.js | Shared | REMOVE | LOW |
| [server/services/student.service.js](server/services/student.service.js) | Server service for student | NO | — | server/models/index.js | Student | REMOVE | LOW |
| [server/services/subject.service.js](server/services/subject.service.js) | Server service for subject | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/teacher.service.js](server/services/teacher.service.js) | Server service for teacher | NO | — | server/models/index.js | Teacher | REMOVE | LOW |
| [server/services/traffic-analytics.service.js](server/services/traffic-analytics.service.js) | Server service for traffic-analytics | NO | — | server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/transport.service.js](server/services/transport.service.js) | Server service for transport | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/transportAssignment.service.js](server/services/transportAssignment.service.js) | Server service for transportAssignment | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/upload.service.js](server/services/upload.service.js) | Server service for upload | NO | — | server/config/cloudinary.js, server/models/index.js, server/utils/cloudinary-validator.js | Shared | REMOVE | LOW |
| [server/services/vehicle.service.js](server/services/vehicle.service.js) | Server service for vehicle | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/verification.service.js](server/services/verification.service.js) | Server service for verification | NO | — | server/models/index.js | Shared | REMOVE | LOW |

## Server Models

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [server/models/AcademicRecord.js](server/models/AcademicRecord.js) | Database model for AcademicRecord | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/AcademicYear.js](server/models/AcademicYear.js) | Database model for AcademicYear | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Admin.js](server/models/Admin.js) | Database model for Admin | YES | server/models/index.js | — | Admin/Operations | KEEP | LOW |
| [server/models/Attendance.js](server/models/Attendance.js) | Database model for Attendance | YES | server/models/index.js | — | Attendance | KEEP | LOW |
| [server/models/AuditLog.js](server/models/AuditLog.js) | Database model for AuditLog | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Banner.js](server/models/Banner.js) | Database model for Banner | YES | server/controllers/banner.controller.js, server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Category.js](server/models/Category.js) | Database model for Category | YES | server/models/index.js, server/routes/sitemap.routes.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Certificate.js](server/models/Certificate.js) | Database model for Certificate | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Chat.js](server/models/Chat.js) | Database model for Chat | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Class.js](server/models/Class.js) | Database model for Class | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/EmployeeAttendance.js](server/models/EmployeeAttendance.js) | Database model for EmployeeAttendance | YES | server/models/index.js | — | Attendance | KEEP | LOW |
| [server/models/Expense.js](server/models/Expense.js) | Database model for Expense | YES | server/models/index.js | — | Finance | KEEP | LOW |
| [server/models/Favorite.js](server/models/Favorite.js) | Database model for Favorite | YES | server/controllers/user.controller.js, server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/FuelRecord.js](server/models/FuelRecord.js) | Database model for FuelRecord | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/Grade.js](server/models/Grade.js) | Database model for Grade | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Image.js](server/models/Image.js) | Database model for Image | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/index.js](server/models/index.js) | Database model for index | YES | server/controllers/finance.controller.js, server/controllers/schoolDashboard.controller.js, server/middleware/auth.middleware.js, server/server.js, server/services/academicRecord.service.js, server/services/academicYear.service.js, server/services/admin.service.js, server/services/attendance.service.js | server/models/AcademicRecord.js, server/models/AcademicYear.js, server/models/Admin.js, server/models/Attendance.js, server/models/AuditLog.js, server/models/Banner.js, server/models/Category.js, server/models/Certificate.js | Shared | KEEP | LOW |
| [server/models/Message.js](server/models/Message.js) | Database model for Message | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/PageView.js](server/models/PageView.js) | Database model for PageView | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Payment.js](server/models/Payment.js) | Database model for Payment | YES | server/models/index.js | — | Finance | KEEP | LOW |
| [server/models/Product.js](server/models/Product.js) | Database model for Product | YES | server/app.js, server/controllers/user.controller.js, server/models/index.js, server/routes/sitemap.routes.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Promotion.js](server/models/Promotion.js) | Database model for Promotion | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Report.js](server/models/Report.js) | Database model for Report | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Review.js](server/models/Review.js) | Database model for Review | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Route.js](server/models/Route.js) | Database model for Route | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/SchoolSetting.js](server/models/SchoolSetting.js) | Database model for SchoolSetting | YES | server/models/index.js | — | School Settings | KEEP | LOW |
| [server/models/Search.js](server/models/Search.js) | Database model for Search | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/SellerVerification.js](server/models/SellerVerification.js) | Database model for SellerVerification | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Student.js](server/models/Student.js) | Database model for Student | YES | server/models/index.js | — | Student | KEEP | LOW |
| [server/models/Subject.js](server/models/Subject.js) | Database model for Subject | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Teacher.js](server/models/Teacher.js) | Database model for Teacher | YES | server/models/index.js | — | Teacher | KEEP | LOW |
| [server/models/Transaction.js](server/models/Transaction.js) | Database model for Transaction | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Transport.js](server/models/Transport.js) | Database model for Transport | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/TransportAssignment.js](server/models/TransportAssignment.js) | Database model for TransportAssignment | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/User.js](server/models/User.js) | Database model for User | YES | server/controllers/review.controller.js, server/controllers/user.controller.js, server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Vehicle.js](server/models/Vehicle.js) | Database model for Vehicle | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/Visitor.js](server/models/Visitor.js) | Database model for Visitor | YES | server/models/index.js | — | Shared | KEEP | LOW |

## Server Middleware

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [server/middleware/auth.middleware.js](server/middleware/auth.middleware.js) | Middleware for auth.middleware | NO | — | server/config/index.js, server/models/index.js | Auth | REMOVE | LOW |
| [server/middleware/error.middleware.js](server/middleware/error.middleware.js) | Middleware for error.middleware | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/role.middleware.js](server/middleware/role.middleware.js) | Middleware for role.middleware | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/security/password.validator.js](server/middleware/security/password.validator.js) | Middleware for password.validator | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/upload.middleware.js](server/middleware/upload.middleware.js) | Middleware for upload.middleware | NO | — | server/config/index.js | Security/Validation | REMOVE | LOW |
| [server/middleware/validation.middleware.js](server/middleware/validation.middleware.js) | Middleware for validation.middleware | NO | — | — | Security/Validation | REMOVE | LOW |

## Configuration

| File path | Purpose | Used? | Imported by | Depends on | Module | Recommendation | Risk |
|---|---|---|---|---|---|---|---|
| [client/.vercel/project.json](client/.vercel/project.json) | Project source file | NO | — | — | Shared | REMOVE | LOW |
| [client/package-lock.json](client/package-lock.json) | Project source file | NO | — | — | Shared | REMOVE | LOW |
| [client/package.json](client/package.json) | Client package manifest and scripts | NO | — | — | Shared | REMOVE | LOW |
| [client/postcss.config.js](client/postcss.config.js) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [client/src/App.tsx](client/src/App.tsx) | Root React application shell and provider setup | YES | client/src/main.tsx | client/src/components/layout/AppShell.tsx, client/src/routes/AppRoutes.tsx | Shared | KEEP | HIGH |
| [client/src/components/common/DeleteConfirmationModal.tsx](client/src/components/common/DeleteConfirmationModal.tsx) | Reusable UI component for DeleteConfirmationModal | YES | client/src/pages/AcademicYearPage.tsx, client/src/pages/ClassPage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/GradePage.tsx, client/src/pages/RoutesPage.tsx, client/src/pages/SchoolSettingsPage.tsx, client/src/pages/StudentsPage.tsx | — | UI | KEEP | LOW |
| [client/src/components/ErrorBoundary.tsx](client/src/components/ErrorBoundary.tsx) | Reusable UI component for ErrorBoundary | NO | — | — | UI | REMOVE | LOW |
| [client/src/components/layout/AdminLayout.tsx](client/src/components/layout/AdminLayout.tsx) | Reusable UI component for AdminLayout | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | LOW |
| [client/src/components/layout/AppShell.tsx](client/src/components/layout/AppShell.tsx) | Reusable UI component for AppShell | YES | client/src/App.tsx | client/src/components/layout/Footer.tsx, client/src/components/layout/Header.tsx | UI | KEEP | LOW |
| [client/src/components/layout/Footer.tsx](client/src/components/layout/Footer.tsx) | Reusable UI component for Footer | YES | client/src/components/layout/AppShell.tsx | — | UI | KEEP | LOW |
| [client/src/components/layout/Header.tsx](client/src/components/layout/Header.tsx) | Reusable UI component for Header | YES | client/src/components/layout/AppShell.tsx | client/src/hooks/useAuth.tsx, client/src/hooks/useSocket.ts, client/src/services/api.ts | UI | KEEP | LOW |
| [client/src/components/marketplace/CategoriesGrid.tsx](client/src/components/marketplace/CategoriesGrid.tsx) | Reusable UI component for CategoriesGrid | NO | — | client/src/services/api.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/FeaturedSection.tsx](client/src/components/marketplace/FeaturedSection.tsx) | Reusable UI component for FeaturedSection | NO | — | client/src/components/marketplace/ProductCard.tsx, client/src/utils/category.ts, client/src/utils/product.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/ProductCard.tsx](client/src/components/marketplace/ProductCard.tsx) | Reusable UI component for ProductCard | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/pages/FavoritesPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx, client/src/pages/ProductListPage.tsx, client/src/pages/ProfilePage.tsx | client/src/utils/category.ts, client/src/utils/price.ts, client/src/utils/views.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/SearchBar.tsx](client/src/components/marketplace/SearchBar.tsx) | Reusable UI component for SearchBar | YES | client/src/pages/HomePage.tsx, client/src/pages/ProductListPage.tsx | client/src/services/api.ts | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/SellerContactCard.tsx](client/src/components/marketplace/SellerContactCard.tsx) | Reusable UI component for SellerContactCard | YES | client/src/pages/ProductDetailPage.tsx | — | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/marketplace/TopAdBanner.tsx](client/src/components/marketplace/TopAdBanner.tsx) | Reusable UI component for TopAdBanner | YES | client/src/pages/ProductListPage.tsx | — | Legacy Marketplace | REFACTOR | LOW |
| [client/src/components/SEO.tsx](client/src/components/SEO.tsx) | Reusable UI component for SEO | YES | client/src/pages/AboutPage.tsx, client/src/pages/GuidePage.tsx, client/src/pages/HelpPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx | client/src/utils/viteEnv.ts | UI | KEEP | LOW |
| [client/src/hooks/useAuth.tsx](client/src/hooks/useAuth.tsx) | Project source file | YES | client/src/components/layout/Header.tsx, client/src/hooks/useSocket.ts, client/src/main.tsx, client/src/pages/AcademicPage.tsx, client/src/pages/AcademicRecordPage.tsx, client/src/pages/AcademicYearPage.tsx, client/src/pages/AdminBannersPage.tsx, client/src/pages/AdminTrafficAnalyticsPage.tsx | — | Auth | KEEP | LOW |
| [client/src/hooks/useSocket.ts](client/src/hooks/useSocket.ts) | Project source file | YES | client/src/components/layout/Header.tsx | client/src/hooks/useAuth.tsx, client/src/services/socket.ts | Shared | KEEP | LOW |
| [client/src/main.tsx](client/src/main.tsx) | Client application entrypoint | NO | — | client/src/App.tsx, client/src/hooks/useAuth.tsx | Shared | KEEP | HIGH |
| [client/src/pages/AboutPage.tsx](client/src/pages/AboutPage.tsx) | Client page for AboutPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/AcademicPage.tsx](client/src/pages/AcademicPage.tsx) | Client page for AcademicPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/AcademicRecordPage.tsx](client/src/pages/AcademicRecordPage.tsx) | Client page for AcademicRecordPage | NO | — | client/src/hooks/useAuth.tsx | Academics | REMOVE | LOW |
| [client/src/pages/AcademicYearPage.tsx](client/src/pages/AcademicYearPage.tsx) | Client page for AcademicYearPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Academics | KEEP | MEDIUM |
| [client/src/pages/AccountSettingsPage.tsx](client/src/pages/AccountSettingsPage.tsx) | Client page for AccountSettingsPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/password.ts | UI | KEEP | MEDIUM |
| [client/src/pages/AdminBannersPage.tsx](client/src/pages/AdminBannersPage.tsx) | Client page for AdminBannersPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AdminDashboardPage.tsx](client/src/pages/AdminDashboardPage.tsx) | Client page for AdminDashboardPage | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/AdminPromotionsPage.tsx](client/src/pages/AdminPromotionsPage.tsx) | Client page for AdminPromotionsPage | YES | client/src/routes/AppRoutes.tsx | — | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AdminRevenuePage.tsx](client/src/pages/AdminRevenuePage.tsx) | Client page for AdminRevenuePage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/AdminTrafficAnalyticsPage.tsx](client/src/pages/AdminTrafficAnalyticsPage.tsx) | Client page for AdminTrafficAnalyticsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/AdminVerificationReviewPage.tsx](client/src/pages/AdminVerificationReviewPage.tsx) | Client page for AdminVerificationReviewPage | YES | client/src/routes/AppRoutes.tsx | — | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/AttendancePage.tsx](client/src/pages/AttendancePage.tsx) | Client page for AttendancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Attendance | KEEP | MEDIUM |
| [client/src/pages/CertificatesPage.tsx](client/src/pages/CertificatesPage.tsx) | Client page for CertificatesPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Academics | KEEP | MEDIUM |
| [client/src/pages/ChatPage.tsx](client/src/pages/ChatPage.tsx) | Client page for ChatPage | YES | client/src/routes/AppRoutes.tsx | client/src/services/socket.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ClassPage.tsx](client/src/pages/ClassPage.tsx) | Client page for ClassPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/DashboardPage.tsx](client/src/pages/DashboardPage.tsx) | Client page for DashboardPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/price.ts, client/src/utils/views.ts | Admin/Operations | REFACTOR | MEDIUM |
| [client/src/pages/EmployeeAttendancePage.tsx](client/src/pages/EmployeeAttendancePage.tsx) | Client page for EmployeeAttendancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Attendance | KEEP | MEDIUM |
| [client/src/pages/ExpensesPage.tsx](client/src/pages/ExpensesPage.tsx) | Client page for ExpensesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/FavoritesPage.tsx](client/src/pages/FavoritesPage.tsx) | Client page for FavoritesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/FinancePage.tsx](client/src/pages/FinancePage.tsx) | Client page for FinancePage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/ForgotPasswordPage.tsx](client/src/pages/ForgotPasswordPage.tsx) | Client page for ForgotPasswordPage | YES | client/src/routes/AppRoutes.tsx | client/src/utils/password.ts | UI | KEEP | MEDIUM |
| [client/src/pages/FuelPage.tsx](client/src/pages/FuelPage.tsx) | Client page for FuelPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Transport | KEEP | MEDIUM |
| [client/src/pages/GradePage.tsx](client/src/pages/GradePage.tsx) | Client page for GradePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/GuidePage.tsx](client/src/pages/GuidePage.tsx) | Client page for GuidePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/HelpPage.tsx](client/src/pages/HelpPage.tsx) | Client page for HelpPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx | UI | KEEP | MEDIUM |
| [client/src/pages/HomePage.tsx](client/src/pages/HomePage.tsx) | Client page for HomePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/utils/category.ts, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx) | Client page for LoginPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/viteEnv.ts | UI | KEEP | MEDIUM |
| [client/src/pages/NotFoundPage.tsx](client/src/pages/NotFoundPage.tsx) | Client page for NotFoundPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |
| [client/src/pages/NotificationsPage.tsx](client/src/pages/NotificationsPage.tsx) | Client page for NotificationsPage | YES | client/src/routes/AppRoutes.tsx | — | Admin/Operations | KEEP | MEDIUM |
| [client/src/pages/PaymentsPage.tsx](client/src/pages/PaymentsPage.tsx) | Client page for PaymentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/date.ts, client/src/utils/price.ts | Finance | KEEP | MEDIUM |
| [client/src/pages/PostProductPage.tsx](client/src/pages/PostProductPage.tsx) | Client page for PostProductPage | YES | client/src/routes/AppRoutes.tsx | client/src/services/api.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProductDetailPage.tsx](client/src/pages/ProductDetailPage.tsx) | Client page for ProductDetailPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/SEO.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SellerContactCard.tsx, client/src/hooks/useAuth.tsx, client/src/utils/price.ts, client/src/utils/product.ts, client/src/utils/views.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProductListPage.tsx](client/src/pages/ProductListPage.tsx) | Client page for ProductListPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/components/marketplace/TopAdBanner.tsx, client/src/utils/product.ts | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/ProfilePage.tsx](client/src/pages/ProfilePage.tsx) | Client page for ProfilePage | YES | client/src/routes/AppRoutes.tsx | client/src/components/marketplace/ProductCard.tsx, client/src/hooks/useAuth.tsx, client/src/utils/price.ts, client/src/utils/product.ts | UI | REFACTOR | MEDIUM |
| [client/src/pages/RegisterPage.tsx](client/src/pages/RegisterPage.tsx) | Client page for RegisterPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/password.ts, client/src/utils/viteEnv.ts | UI | KEEP | MEDIUM |
| [client/src/pages/RoutesPage.tsx](client/src/pages/RoutesPage.tsx) | Client page for RoutesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/SchoolDashboardPage.tsx](client/src/pages/SchoolDashboardPage.tsx) | Client page for SchoolDashboardPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx, client/src/utils/price.ts | School Settings | KEEP | MEDIUM |
| [client/src/pages/SchoolSettingsPage.tsx](client/src/pages/SchoolSettingsPage.tsx) | Client page for SchoolSettingsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | School Settings | KEEP | MEDIUM |
| [client/src/pages/SellerAnalyticsPage.tsx](client/src/pages/SellerAnalyticsPage.tsx) | Client page for SellerAnalyticsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/SellerPromotionsPage.tsx](client/src/pages/SellerPromotionsPage.tsx) | Client page for SellerPromotionsPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Legacy Marketplace | REFACTOR | MEDIUM |
| [client/src/pages/StudentsPage.tsx](client/src/pages/StudentsPage.tsx) | Client page for StudentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Student | KEEP | MEDIUM |
| [client/src/pages/SubjectPage.tsx](client/src/pages/SubjectPage.tsx) | Client page for SubjectPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Academics | KEEP | MEDIUM |
| [client/src/pages/TeachersPage.tsx](client/src/pages/TeachersPage.tsx) | Client page for TeachersPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Teacher | KEEP | MEDIUM |
| [client/src/pages/TransportAssignmentsPage.tsx](client/src/pages/TransportAssignmentsPage.tsx) | Client page for TransportAssignmentsPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx, client/src/utils/date.ts | Transport | KEEP | MEDIUM |
| [client/src/pages/TransportPage.tsx](client/src/pages/TransportPage.tsx) | Client page for TransportPage | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/VehiclesPage.tsx](client/src/pages/VehiclesPage.tsx) | Client page for VehiclesPage | YES | client/src/routes/AppRoutes.tsx | client/src/components/common/DeleteConfirmationModal.tsx, client/src/hooks/useAuth.tsx | Transport | KEEP | MEDIUM |
| [client/src/pages/VerificationRequestPage.tsx](client/src/pages/VerificationRequestPage.tsx) | Client page for VerificationRequestPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |
| [client/src/pages/VerifyEmailPage.tsx](client/src/pages/VerifyEmailPage.tsx) | Client page for VerifyEmailPage | YES | client/src/routes/AppRoutes.tsx | — | UI | KEEP | MEDIUM |
| [client/src/routes/AdminRoute.tsx](client/src/routes/AdminRoute.tsx) | Project source file | YES | client/src/routes/AppRoutes.tsx | client/src/hooks/useAuth.tsx | Transport | KEEP | LOW |
| [client/src/routes/AppRoutes.tsx](client/src/routes/AppRoutes.tsx) | Client route configuration for the application | YES | client/src/App.tsx | client/src/components/layout/AdminLayout.tsx, client/src/pages/AboutPage.tsx, client/src/pages/AcademicPage.tsx, client/src/pages/AcademicYearPage.tsx, client/src/pages/AccountSettingsPage.tsx, client/src/pages/AdminBannersPage.tsx, client/src/pages/AdminDashboardPage.tsx, client/src/pages/AdminPromotionsPage.tsx | Transport | KEEP | HIGH |
| [client/src/services/academicRecord.api.ts](client/src/services/academicRecord.api.ts) | Client API helper for academicRecord | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/academicYear.api.ts](client/src/services/academicYear.api.ts) | Client API helper for academicYear | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/admin.api.ts](client/src/services/admin.api.ts) | Client API helper for admin | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/api.ts](client/src/services/api.ts) | Client API helper for api.ts | YES | client/src/components/layout/Header.tsx, client/src/components/marketplace/CategoriesGrid.tsx, client/src/components/marketplace/SearchBar.tsx, client/src/pages/PostProductPage.tsx, client/src/services/academicRecord.api.ts, client/src/services/academicYear.api.ts, client/src/services/admin.api.ts, client/src/services/attendance.api.ts | client/src/utils/viteEnv.ts | Shared | KEEP | MEDIUM |
| [client/src/services/attendance.api.ts](client/src/services/attendance.api.ts) | Client API helper for attendance | NO | — | client/src/services/api.ts | Attendance | REMOVE | LOW |
| [client/src/services/auth.api.ts](client/src/services/auth.api.ts) | Client API helper for auth | NO | — | client/src/services/api.ts | Auth | REMOVE | LOW |
| [client/src/services/banner.api.ts](client/src/services/banner.api.ts) | Client API helper for banner | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/certificate.api.ts](client/src/services/certificate.api.ts) | Client API helper for certificate | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/chat.api.ts](client/src/services/chat.api.ts) | Client API helper for chat | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/class.api.ts](client/src/services/class.api.ts) | Client API helper for class | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/employeeAttendance.api.ts](client/src/services/employeeAttendance.api.ts) | Client API helper for employeeAttendance | NO | — | client/src/services/api.ts | Attendance | REMOVE | LOW |
| [client/src/services/expense.api.ts](client/src/services/expense.api.ts) | Client API helper for expense | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/favorites.api.ts](client/src/services/favorites.api.ts) | Client API helper for favorites | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/finance.api.ts](client/src/services/finance.api.ts) | Client API helper for finance | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/fuelRecord.api.ts](client/src/services/fuelRecord.api.ts) | Client API helper for fuelRecord | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/grade.api.ts](client/src/services/grade.api.ts) | Client API helper for grade | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/location.api.ts](client/src/services/location.api.ts) | Client API helper for location | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/notification.api.ts](client/src/services/notification.api.ts) | Client API helper for notification | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/payment.api.ts](client/src/services/payment.api.ts) | Client API helper for payment | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/product.api.ts](client/src/services/product.api.ts) | Client API helper for product | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/promotion.api.ts](client/src/services/promotion.api.ts) | Client API helper for promotion | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/report.api.ts](client/src/services/report.api.ts) | Client API helper for report | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/revenue.api.ts](client/src/services/revenue.api.ts) | Client API helper for revenue | NO | — | client/src/services/api.ts | Finance | REMOVE | LOW |
| [client/src/services/review.api.ts](client/src/services/review.api.ts) | Client API helper for review | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/route.api.ts](client/src/services/route.api.ts) | Client API helper for route | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/schoolDashboard.api.ts](client/src/services/schoolDashboard.api.ts) | Client API helper for schoolDashboard | NO | — | client/src/services/api.ts | School Settings | REMOVE | LOW |
| [client/src/services/schoolSettings.api.ts](client/src/services/schoolSettings.api.ts) | Client API helper for schoolSettings | NO | — | client/src/services/api.ts | School Settings | REMOVE | LOW |
| [client/src/services/seller-analytics.api.ts](client/src/services/seller-analytics.api.ts) | Client API helper for seller-analytics | NO | — | client/src/services/api.ts | Legacy Marketplace | REMOVE | LOW |
| [client/src/services/socket.ts](client/src/services/socket.ts) | Client API helper for socket.ts | YES | client/src/hooks/useSocket.ts, client/src/pages/ChatPage.tsx | client/src/utils/viteEnv.ts | Shared | KEEP | MEDIUM |
| [client/src/services/student.api.ts](client/src/services/student.api.ts) | Client API helper for student | NO | — | client/src/services/api.ts | Student | REMOVE | LOW |
| [client/src/services/subject.api.ts](client/src/services/subject.api.ts) | Client API helper for subject | NO | — | client/src/services/api.ts | Academics | REMOVE | LOW |
| [client/src/services/teacher.api.ts](client/src/services/teacher.api.ts) | Client API helper for teacher | NO | — | client/src/services/api.ts | Teacher | REMOVE | LOW |
| [client/src/services/traffic-analytics.api.ts](client/src/services/traffic-analytics.api.ts) | Client API helper for traffic-analytics | NO | — | client/src/services/api.ts | Admin/Operations | REMOVE | LOW |
| [client/src/services/transport.api.ts](client/src/services/transport.api.ts) | Client API helper for transport | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/transportAssignment.api.ts](client/src/services/transportAssignment.api.ts) | Client API helper for transportAssignment | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/services/upload.api.ts](client/src/services/upload.api.ts) | Client API helper for upload | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/user.api.ts](client/src/services/user.api.ts) | Client API helper for user | NO | — | client/src/services/api.ts | Shared | REMOVE | LOW |
| [client/src/services/vehicle.api.ts](client/src/services/vehicle.api.ts) | Client API helper for vehicle | NO | — | client/src/services/api.ts | Transport | REMOVE | LOW |
| [client/src/utils/category.ts](client/src/utils/category.ts) | Utility helper for category | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/components/marketplace/ProductCard.tsx, client/src/pages/HomePage.tsx | — | Legacy Marketplace | KEEP | LOW |
| [client/src/utils/date.ts](client/src/utils/date.ts) | Utility helper for date | YES | client/src/pages/AcademicYearPage.tsx, client/src/pages/AttendancePage.tsx, client/src/pages/CertificatesPage.tsx, client/src/pages/EmployeeAttendancePage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/PaymentsPage.tsx, client/src/pages/StudentsPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/password.ts](client/src/utils/password.ts) | Utility helper for password | YES | client/src/pages/AccountSettingsPage.tsx, client/src/pages/ForgotPasswordPage.tsx, client/src/pages/RegisterPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/price.ts](client/src/utils/price.ts) | Utility helper for price | YES | client/src/components/marketplace/ProductCard.tsx, client/src/pages/AdminRevenuePage.tsx, client/src/pages/DashboardPage.tsx, client/src/pages/ExpensesPage.tsx, client/src/pages/FinancePage.tsx, client/src/pages/FuelPage.tsx, client/src/pages/PaymentsPage.tsx, client/src/pages/ProductDetailPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/product.ts](client/src/utils/product.ts) | Utility helper for product | YES | client/src/components/marketplace/FeaturedSection.tsx, client/src/pages/FavoritesPage.tsx, client/src/pages/HomePage.tsx, client/src/pages/ProductDetailPage.tsx, client/src/pages/ProductListPage.tsx, client/src/pages/ProfilePage.tsx | — | Legacy Marketplace | KEEP | LOW |
| [client/src/utils/views.ts](client/src/utils/views.ts) | Utility helper for views | YES | client/src/components/marketplace/ProductCard.tsx, client/src/pages/DashboardPage.tsx, client/src/pages/ProductDetailPage.tsx | — | Shared | KEEP | LOW |
| [client/src/utils/viteEnv.ts](client/src/utils/viteEnv.ts) | Utility helper for viteEnv | YES | client/src/components/SEO.tsx, client/src/pages/LoginPage.tsx, client/src/pages/RegisterPage.tsx, client/src/services/api.ts, client/src/services/socket.ts | — | Shared | KEEP | LOW |
| [client/src/vite-env.d.ts](client/src/vite-env.d.ts) | Type declarations for Vite environment variables | NO | — | — | Shared | REMOVE | LOW |
| [client/tailwind.config.js](client/tailwind.config.js) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [client/tsconfig.json](client/tsconfig.json) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [client/tsconfig.node.json](client/tsconfig.node.json) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [client/vite.config.ts](client/vite.config.ts) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [server/app.js](server/app.js) | Server application entrypoint | YES | server/server.js | server/config/index.js, server/models/Product.js, server/routes/index.js | Shared | KEEP | HIGH |
| [server/config/categories.js](server/config/categories.js) | Configuration for categories | YES | server/server.js | — | Infrastructure | KEEP | LOW |
| [server/config/cloudinary.js](server/config/cloudinary.js) | Configuration for cloudinary | YES | server/controllers/banner.controller.js, server/server.js, server/services/auth.service.js, server/services/upload.service.js | server/config/index.js | Infrastructure | KEEP | LOW |
| [server/config/database.js](server/config/database.js) | Configuration for database | YES | server/server.js | server/config/index.js | Infrastructure | KEEP | LOW |
| [server/config/index.js](server/config/index.js) | Configuration for index | YES | server/app.js, server/config/cloudinary.js, server/config/database.js, server/controllers/admin.controller.js, server/middleware/auth.middleware.js, server/middleware/upload.middleware.js, server/server.js, server/services/auth.service.js | — | Infrastructure | KEEP | LOW |
| [server/config/provinces.js](server/config/provinces.js) | Configuration for provinces | YES | server/controllers/location.controller.js, server/services/admin.service.js | — | Infrastructure | KEEP | LOW |
| [server/controllers/academicRecord.controller.js](server/controllers/academicRecord.controller.js) | Controller handling academicRecord | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/academicYear.controller.js](server/controllers/academicYear.controller.js) | Controller handling academicYear | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/admin.controller.js](server/controllers/admin.controller.js) | Controller handling admin | NO | — | server/config/index.js | Admin/Operations | REMOVE | LOW |
| [server/controllers/attendance.controller.js](server/controllers/attendance.controller.js) | Controller handling attendance | NO | — | — | Attendance | REMOVE | LOW |
| [server/controllers/auth.controller.js](server/controllers/auth.controller.js) | Controller handling auth | NO | — | — | Auth | REMOVE | LOW |
| [server/controllers/banner.controller.js](server/controllers/banner.controller.js) | Controller handling banner | NO | — | server/config/cloudinary.js, server/models/Banner.js | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/category.controller.js](server/controllers/category.controller.js) | Controller handling category | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/certificate.controller.js](server/controllers/certificate.controller.js) | Controller handling certificate | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/chat.controller.js](server/controllers/chat.controller.js) | Controller handling chat | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/class.controller.js](server/controllers/class.controller.js) | Controller handling class | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/employeeAttendance.controller.js](server/controllers/employeeAttendance.controller.js) | Controller handling employeeAttendance | NO | — | — | Attendance | REMOVE | LOW |
| [server/controllers/expense.controller.js](server/controllers/expense.controller.js) | Controller handling expense | NO | — | — | Finance | REMOVE | LOW |
| [server/controllers/favorite.controller.js](server/controllers/favorite.controller.js) | Controller handling favorite | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/finance.controller.js](server/controllers/finance.controller.js) | Controller handling finance | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/controllers/fuelRecord.controller.js](server/controllers/fuelRecord.controller.js) | Controller handling fuelRecord | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/grade.controller.js](server/controllers/grade.controller.js) | Controller handling grade | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/location.controller.js](server/controllers/location.controller.js) | Controller handling location | NO | — | server/config/provinces.js | Shared | REMOVE | LOW |
| [server/controllers/notification.controller.js](server/controllers/notification.controller.js) | Controller handling notification | NO | — | — | Admin/Operations | REMOVE | LOW |
| [server/controllers/payment.controller.js](server/controllers/payment.controller.js) | Controller handling payment | NO | — | — | Finance | REMOVE | LOW |
| [server/controllers/product.controller.js](server/controllers/product.controller.js) | Controller handling product | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/promotion.controller.js](server/controllers/promotion.controller.js) | Controller handling promotion | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/report.controller.js](server/controllers/report.controller.js) | Controller handling report | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/review.controller.js](server/controllers/review.controller.js) | Controller handling review | NO | — | server/models/User.js | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/route.controller.js](server/controllers/route.controller.js) | Controller handling route | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/schoolDashboard.controller.js](server/controllers/schoolDashboard.controller.js) | Controller handling schoolDashboard | NO | — | server/models/index.js | School Settings | REMOVE | LOW |
| [server/controllers/schoolSetting.controller.js](server/controllers/schoolSetting.controller.js) | Controller handling schoolSetting | NO | — | — | School Settings | REMOVE | LOW |
| [server/controllers/seller-analytics.controller.js](server/controllers/seller-analytics.controller.js) | Controller handling seller-analytics | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/controllers/student.controller.js](server/controllers/student.controller.js) | Controller handling student | NO | — | — | Student | REMOVE | LOW |
| [server/controllers/subject.controller.js](server/controllers/subject.controller.js) | Controller handling subject | NO | — | — | Academics | REMOVE | LOW |
| [server/controllers/teacher.controller.js](server/controllers/teacher.controller.js) | Controller handling teacher | NO | — | — | Teacher | REMOVE | LOW |
| [server/controllers/traffic-analytics.controller.js](server/controllers/traffic-analytics.controller.js) | Controller handling traffic-analytics | NO | — | — | Admin/Operations | REMOVE | LOW |
| [server/controllers/transport.controller.js](server/controllers/transport.controller.js) | Controller handling transport | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/transportAssignment.controller.js](server/controllers/transportAssignment.controller.js) | Controller handling transportAssignment | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/upload.controller.js](server/controllers/upload.controller.js) | Controller handling upload | NO | — | — | Shared | REMOVE | LOW |
| [server/controllers/user.controller.js](server/controllers/user.controller.js) | Controller handling user | NO | — | server/models/Favorite.js, server/models/Product.js, server/models/User.js | Shared | REMOVE | LOW |
| [server/controllers/vehicle.controller.js](server/controllers/vehicle.controller.js) | Controller handling vehicle | NO | — | — | Transport | REMOVE | LOW |
| [server/controllers/verification.controller.js](server/controllers/verification.controller.js) | Controller handling verification | NO | — | — | Shared | REMOVE | LOW |
| [server/middleware/auth.middleware.js](server/middleware/auth.middleware.js) | Middleware for auth.middleware | NO | — | server/config/index.js, server/models/index.js | Auth | REMOVE | LOW |
| [server/middleware/error.middleware.js](server/middleware/error.middleware.js) | Middleware for error.middleware | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/role.middleware.js](server/middleware/role.middleware.js) | Middleware for role.middleware | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/security/password.validator.js](server/middleware/security/password.validator.js) | Middleware for password.validator | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/middleware/upload.middleware.js](server/middleware/upload.middleware.js) | Middleware for upload.middleware | NO | — | server/config/index.js | Security/Validation | REMOVE | LOW |
| [server/middleware/validation.middleware.js](server/middleware/validation.middleware.js) | Middleware for validation.middleware | NO | — | — | Security/Validation | REMOVE | LOW |
| [server/models/AcademicRecord.js](server/models/AcademicRecord.js) | Database model for AcademicRecord | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/AcademicYear.js](server/models/AcademicYear.js) | Database model for AcademicYear | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Admin.js](server/models/Admin.js) | Database model for Admin | YES | server/models/index.js | — | Admin/Operations | KEEP | LOW |
| [server/models/Attendance.js](server/models/Attendance.js) | Database model for Attendance | YES | server/models/index.js | — | Attendance | KEEP | LOW |
| [server/models/AuditLog.js](server/models/AuditLog.js) | Database model for AuditLog | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Banner.js](server/models/Banner.js) | Database model for Banner | YES | server/controllers/banner.controller.js, server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Category.js](server/models/Category.js) | Database model for Category | YES | server/models/index.js, server/routes/sitemap.routes.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Certificate.js](server/models/Certificate.js) | Database model for Certificate | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Chat.js](server/models/Chat.js) | Database model for Chat | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Class.js](server/models/Class.js) | Database model for Class | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/EmployeeAttendance.js](server/models/EmployeeAttendance.js) | Database model for EmployeeAttendance | YES | server/models/index.js | — | Attendance | KEEP | LOW |
| [server/models/Expense.js](server/models/Expense.js) | Database model for Expense | YES | server/models/index.js | — | Finance | KEEP | LOW |
| [server/models/Favorite.js](server/models/Favorite.js) | Database model for Favorite | YES | server/controllers/user.controller.js, server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/FuelRecord.js](server/models/FuelRecord.js) | Database model for FuelRecord | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/Grade.js](server/models/Grade.js) | Database model for Grade | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Image.js](server/models/Image.js) | Database model for Image | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/index.js](server/models/index.js) | Database model for index | YES | server/controllers/finance.controller.js, server/controllers/schoolDashboard.controller.js, server/middleware/auth.middleware.js, server/server.js, server/services/academicRecord.service.js, server/services/academicYear.service.js, server/services/admin.service.js, server/services/attendance.service.js | server/models/AcademicRecord.js, server/models/AcademicYear.js, server/models/Admin.js, server/models/Attendance.js, server/models/AuditLog.js, server/models/Banner.js, server/models/Category.js, server/models/Certificate.js | Shared | KEEP | LOW |
| [server/models/Message.js](server/models/Message.js) | Database model for Message | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/PageView.js](server/models/PageView.js) | Database model for PageView | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Payment.js](server/models/Payment.js) | Database model for Payment | YES | server/models/index.js | — | Finance | KEEP | LOW |
| [server/models/Product.js](server/models/Product.js) | Database model for Product | YES | server/app.js, server/controllers/user.controller.js, server/models/index.js, server/routes/sitemap.routes.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Promotion.js](server/models/Promotion.js) | Database model for Promotion | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Report.js](server/models/Report.js) | Database model for Report | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Review.js](server/models/Review.js) | Database model for Review | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Route.js](server/models/Route.js) | Database model for Route | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/SchoolSetting.js](server/models/SchoolSetting.js) | Database model for SchoolSetting | YES | server/models/index.js | — | School Settings | KEEP | LOW |
| [server/models/Search.js](server/models/Search.js) | Database model for Search | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/SellerVerification.js](server/models/SellerVerification.js) | Database model for SellerVerification | YES | server/models/index.js | — | Legacy Marketplace | KEEP | LOW |
| [server/models/Student.js](server/models/Student.js) | Database model for Student | YES | server/models/index.js | — | Student | KEEP | LOW |
| [server/models/Subject.js](server/models/Subject.js) | Database model for Subject | YES | server/models/index.js | — | Academics | KEEP | LOW |
| [server/models/Teacher.js](server/models/Teacher.js) | Database model for Teacher | YES | server/models/index.js | — | Teacher | KEEP | LOW |
| [server/models/Transaction.js](server/models/Transaction.js) | Database model for Transaction | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Transport.js](server/models/Transport.js) | Database model for Transport | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/TransportAssignment.js](server/models/TransportAssignment.js) | Database model for TransportAssignment | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/User.js](server/models/User.js) | Database model for User | YES | server/controllers/review.controller.js, server/controllers/user.controller.js, server/models/index.js | — | Shared | KEEP | LOW |
| [server/models/Vehicle.js](server/models/Vehicle.js) | Database model for Vehicle | YES | server/models/index.js | — | Transport | KEEP | LOW |
| [server/models/Visitor.js](server/models/Visitor.js) | Database model for Visitor | YES | server/models/index.js | — | Shared | KEEP | LOW |
| [server/package-lock.json](server/package-lock.json) | Project source file | NO | — | — | Shared | REMOVE | LOW |
| [server/package.json](server/package.json) | Project source file | NO | — | — | Shared | REMOVE | LOW |
| [server/routes/academicRecord.routes.js](server/routes/academicRecord.routes.js) | Server route module for academicRecord.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/academicYear.routes.js](server/routes/academicYear.routes.js) | Server route module for academicYear.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/admin.routes.js](server/routes/admin.routes.js) | Server route module for admin.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/attendance.routes.js](server/routes/attendance.routes.js) | Server route module for attendance.routes | NO | — | — | Attendance | REMOVE | LOW |
| [server/routes/auth.routes.js](server/routes/auth.routes.js) | Server route module for auth.routes | NO | — | — | Auth | REMOVE | LOW |
| [server/routes/banner.routes.js](server/routes/banner.routes.js) | Server route module for banner.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/category.routes.js](server/routes/category.routes.js) | Server route module for category.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/certificate.routes.js](server/routes/certificate.routes.js) | Server route module for certificate.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/chat.routes.js](server/routes/chat.routes.js) | Server route module for chat.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/class.routes.js](server/routes/class.routes.js) | Server route module for class.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/employeeAttendance.routes.js](server/routes/employeeAttendance.routes.js) | Server route module for employeeAttendance.routes | NO | — | — | Attendance | REMOVE | LOW |
| [server/routes/expense.routes.js](server/routes/expense.routes.js) | Server route module for expense.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/favorite.routes.js](server/routes/favorite.routes.js) | Server route module for favorite.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/finance.routes.js](server/routes/finance.routes.js) | Server route module for finance.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/fuelRecord.routes.js](server/routes/fuelRecord.routes.js) | Server route module for fuelRecord.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/grade.routes.js](server/routes/grade.routes.js) | Server route module for grade.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/index.js](server/routes/index.js) | Server route module for index | YES | server/app.js, server/app.js | — | Transport | KEEP | HIGH |
| [server/routes/location.routes.js](server/routes/location.routes.js) | Server route module for location.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/notification.routes.js](server/routes/notification.routes.js) | Server route module for notification.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/payment.routes.js](server/routes/payment.routes.js) | Server route module for payment.routes | NO | — | — | Finance | REMOVE | LOW |
| [server/routes/product.routes.js](server/routes/product.routes.js) | Server route module for product.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/promotions.routes.js](server/routes/promotions.routes.js) | Server route module for promotions.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/report.routes.js](server/routes/report.routes.js) | Server route module for report.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/review.routes.js](server/routes/review.routes.js) | Server route module for review.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/route.routes.js](server/routes/route.routes.js) | Server route module for route.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/schoolDashboard.routes.js](server/routes/schoolDashboard.routes.js) | Server route module for schoolDashboard.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/schoolSetting.routes.js](server/routes/schoolSetting.routes.js) | Server route module for schoolSetting.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/seller-analytics.routes.js](server/routes/seller-analytics.routes.js) | Server route module for seller-analytics.routes | NO | — | — | Legacy Marketplace | REMOVE | LOW |
| [server/routes/sitemap.routes.js](server/routes/sitemap.routes.js) | Server route module for sitemap.routes | NO | — | server/models/Category.js, server/models/Product.js | Transport | REMOVE | LOW |
| [server/routes/student.routes.js](server/routes/student.routes.js) | Server route module for student.routes | NO | — | — | Student | REMOVE | LOW |
| [server/routes/subject.routes.js](server/routes/subject.routes.js) | Server route module for subject.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/teacher.routes.js](server/routes/teacher.routes.js) | Server route module for teacher.routes | NO | — | — | Teacher | REMOVE | LOW |
| [server/routes/traffic-analytics.routes.js](server/routes/traffic-analytics.routes.js) | Server route module for traffic-analytics.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/transport.routes.js](server/routes/transport.routes.js) | Server route module for transport.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/transportAssignment.routes.js](server/routes/transportAssignment.routes.js) | Server route module for transportAssignment.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/upload.routes.js](server/routes/upload.routes.js) | Server route module for upload.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/user.routes.js](server/routes/user.routes.js) | Server route module for user.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/vehicle.routes.js](server/routes/vehicle.routes.js) | Server route module for vehicle.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/routes/verification.routes.js](server/routes/verification.routes.js) | Server route module for verification.routes | NO | — | — | Transport | REMOVE | LOW |
| [server/server.js](server/server.js) | Project source file | NO | — | server/app.js, server/config/categories.js, server/config/cloudinary.js, server/config/database.js, server/config/index.js, server/models/index.js | Shared | REMOVE | LOW |
| [server/services/academicRecord.service.js](server/services/academicRecord.service.js) | Server service for academicRecord | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/academicYear.service.js](server/services/academicYear.service.js) | Server service for academicYear | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/admin.service.js](server/services/admin.service.js) | Server service for admin | NO | — | server/config/provinces.js, server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/attendance.service.js](server/services/attendance.service.js) | Server service for attendance | NO | — | server/models/index.js | Attendance | REMOVE | LOW |
| [server/services/auth.service.js](server/services/auth.service.js) | Server service for auth | NO | — | server/config/cloudinary.js, server/config/index.js, server/models/index.js, server/utils/phone.js | Auth | REMOVE | LOW |
| [server/services/category.service.js](server/services/category.service.js) | Server service for category | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/certificate.service.js](server/services/certificate.service.js) | Server service for certificate | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/chat.service.js](server/services/chat.service.js) | Server service for chat | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/class.service.js](server/services/class.service.js) | Server service for class | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/email.service.js](server/services/email.service.js) | Server service for email | NO | — | server/config/index.js | Shared | REMOVE | LOW |
| [server/services/employeeAttendance.service.js](server/services/employeeAttendance.service.js) | Server service for employeeAttendance | NO | — | server/models/index.js | Attendance | REMOVE | LOW |
| [server/services/expense.service.js](server/services/expense.service.js) | Server service for expense | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/favorite.service.js](server/services/favorite.service.js) | Server service for favorite | NO | — | server/models/index.js | Shared | REMOVE | LOW |
| [server/services/fuelRecord.service.js](server/services/fuelRecord.service.js) | Server service for fuelRecord | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/grade.service.js](server/services/grade.service.js) | Server service for grade | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/notification.service.js](server/services/notification.service.js) | Server service for notification | NO | — | server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/payment.service.js](server/services/payment.service.js) | Server service for payment | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/product.service.js](server/services/product.service.js) | Server service for product | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/promotion.service.js](server/services/promotion.service.js) | Server service for promotion | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/report.service.js](server/services/report.service.js) | Server service for report | NO | — | server/models/index.js | Shared | REMOVE | LOW |
| [server/services/revenue.service.js](server/services/revenue.service.js) | Server service for revenue | NO | — | server/models/index.js | Finance | REMOVE | LOW |
| [server/services/review.service.js](server/services/review.service.js) | Server service for review | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/route.service.js](server/services/route.service.js) | Server service for route | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/schoolSetting.service.js](server/services/schoolSetting.service.js) | Server service for schoolSetting | NO | — | server/models/index.js | School Settings | REMOVE | LOW |
| [server/services/seller-analytics.service.js](server/services/seller-analytics.service.js) | Server service for seller-analytics | NO | — | server/models/index.js | Legacy Marketplace | REMOVE | LOW |
| [server/services/sms.service.js](server/services/sms.service.js) | Server service for sms | NO | — | server/config/index.js | Shared | REMOVE | LOW |
| [server/services/student.service.js](server/services/student.service.js) | Server service for student | NO | — | server/models/index.js | Student | REMOVE | LOW |
| [server/services/subject.service.js](server/services/subject.service.js) | Server service for subject | NO | — | server/models/index.js | Academics | REMOVE | LOW |
| [server/services/teacher.service.js](server/services/teacher.service.js) | Server service for teacher | NO | — | server/models/index.js | Teacher | REMOVE | LOW |
| [server/services/traffic-analytics.service.js](server/services/traffic-analytics.service.js) | Server service for traffic-analytics | NO | — | server/models/index.js | Admin/Operations | REMOVE | LOW |
| [server/services/transport.service.js](server/services/transport.service.js) | Server service for transport | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/transportAssignment.service.js](server/services/transportAssignment.service.js) | Server service for transportAssignment | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/upload.service.js](server/services/upload.service.js) | Server service for upload | NO | — | server/config/cloudinary.js, server/models/index.js, server/utils/cloudinary-validator.js | Shared | REMOVE | LOW |
| [server/services/vehicle.service.js](server/services/vehicle.service.js) | Server service for vehicle | NO | — | server/models/index.js | Transport | REMOVE | LOW |
| [server/services/verification.service.js](server/services/verification.service.js) | Server service for verification | NO | — | server/models/index.js | Shared | REMOVE | LOW |
| [server/tsconfig.json](server/tsconfig.json) | Project source file | NO | — | — | Infrastructure | REMOVE | LOW |
| [server/utils/cloudinary-validator.js](server/utils/cloudinary-validator.js) | Project source file | YES | server/services/upload.service.js | server/config/index.js | Shared | KEEP | LOW |
| [server/utils/phone.js](server/utils/phone.js) | Project source file | YES | server/services/auth.service.js | — | Shared | KEEP | LOW |

## Summary

- The client application still mounts several legacy Marketplace routes and pages, including product, chat, favorites, seller, promotion, banner, and verification flows.
- The server still exposes a marketplace-oriented route tree through [server/routes/index.js](server/routes/index.js) and [server/app.js](server/app.js).
- The active school-management modules are wired through [client/src/routes/AppRoutes.tsx](client/src/routes/AppRoutes.tsx) and the domain-specific route modules under [server/routes](server/routes).
- Recommended action: keep the core school-management modules, refactor the legacy marketplace UI and route surface, and remove or isolate clearly unused items after a feature-flag review.

## Recommended Next Steps

1. Keep the school-management page/service/model set intact and continue using the shared date helper for these flows.
2. Refactor the marketplace pages and components into a clearly isolated module or a future-facing feature pack.
3. Review unused legacy files after the current routing and dependency map is finalized, then remove only the files that have no incoming imports and no active runtime path.