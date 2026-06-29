import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ProductListPage from '../pages/ProductListPage';
import PostProductPage from '../pages/PostProductPage';
import ProfilePage from '../pages/ProfilePage';
import AccountSettingsPage from '../pages/AccountSettingsPage';
import FavoritesPage from '../pages/FavoritesPage';
import ChatPage from '../pages/ChatPage';
import DashboardPage from '../pages/DashboardPage';
import SellerAnalyticsPage from '../pages/SellerAnalyticsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminBannersPage from '../pages/AdminBannersPage';
import AdminRevenuePage from '../pages/AdminRevenuePage';
import AdminTrafficAnalyticsPage from '../pages/AdminTrafficAnalyticsPage';
import AdminPromotionsPage from '../pages/AdminPromotionsPage';
import SellerPromotionsPage from '../pages/SellerPromotionsPage';
import AdminLayout from '../components/layout/AdminLayout';
import AdminRoute from './AdminRoute';
import NotificationsPage from '../pages/NotificationsPage';
import NotFoundPage from '../pages/NotFoundPage';
import VerificationRequestPage from '../pages/VerificationRequestPage';
import AdminVerificationReviewPage from '../pages/AdminVerificationReviewPage';
import AboutPage from '../pages/AboutPage';
import GuidePage from '../pages/GuidePage';
import HelpPage from '../pages/HelpPage';
import StudentsPage from '../pages/StudentsPage';
import PaymentsPage from '../pages/PaymentsPage';
import AttendancePage from '../pages/AttendancePage';
import EmployeeAttendancePage from '../pages/EmployeeAttendancePage';
import AcademicPage from '../pages/AcademicPage';
import AcademicYearPage from '../pages/AcademicYearPage';
import GradePage from '../pages/GradePage';
import SubjectPage from '../pages/SubjectPage';
import CertificatesPage from '../pages/CertificatesPage';
import ClassPage from '../pages/ClassPage';
import TransportPage from '../pages/TransportPage';
import TeachersPage from '../pages/TeachersPage';
import VehiclesPage from '../pages/VehiclesPage';
import RoutesPage from '../pages/RoutesPage';
import TransportAssignmentsPage from '../pages/TransportAssignmentsPage';
import FuelPage from '../pages/FuelPage';
import ExpensesPage from '../pages/ExpensesPage';
import SchoolDashboardPage from '../pages/SchoolDashboardPage';
import SchoolSettingsPage from '../pages/SchoolSettingsPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate replace to="/login" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/products" element={<ProductListPage />} />
    <Route path="/products/:slug" element={<ProductDetailPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/guide" element={<GuidePage />} />
    <Route path="/help" element={<HelpPage />} />
    <Route path="/post-product" element={<PostProductPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/profile/:id" element={<ProfilePage />} />
    <Route path="/account-settings" element={<AccountSettingsPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/favorites" element={<FavoritesPage />} />
    <Route path="/chat" element={<Navigate replace to="/messages" />} />
    <Route path="/messages" element={<ChatPage />} />
    <Route path="/messages/:id" element={<ChatPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/seller/analytics" element={<SellerAnalyticsPage />} />
    <Route path="/seller/promotions" element={<SellerPromotionsPage />} />
    <Route path="/verification/request" element={<VerificationRequestPage />} />
    <Route path="/admin" element={<AdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminDashboardPage />} />
        <Route path="sellers" element={<AdminDashboardPage />} />
        <Route path="verification" element={<AdminVerificationReviewPage />} />
        <Route path="products" element={<AdminDashboardPage />} />
        <Route path="reports" element={<AdminDashboardPage />} />
        <Route path="revenue" element={<AdminRevenuePage />} />
        <Route path="traffic" element={<AdminTrafficAnalyticsPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="analytics" element={<AdminDashboardPage />} />
        <Route path="audit" element={<AdminDashboardPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="employee-attendance" element={<EmployeeAttendancePage />} />
        <Route path="academic" element={<AcademicPage />} />
        <Route path="academic-years" element={<AcademicYearPage />} />
        <Route path="grades" element={<GradePage />} />
        <Route path="subjects" element={<SubjectPage />} />
        <Route path="classes" element={<ClassPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="finance" element={<PaymentsPage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="transport-assignments" element={<TransportAssignmentsPage />} />
        <Route path="fuel" element={<FuelPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="school-dashboard" element={<SchoolDashboardPage />} />
        <Route path="school-settings" element={<SchoolSettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
