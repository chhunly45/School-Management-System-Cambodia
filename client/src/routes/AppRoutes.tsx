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
import AcademicPage from '../pages/AcademicPage';
import CertificatesPage from '../pages/CertificatesPage';
import FinancePage from '../pages/FinancePage';
import TransportPage from '../pages/TransportPage';
import TeachersPage from '../pages/TeachersPage';

const AppRoutes = () => (
  <Routes>
    {/* Root route renders the new Konpuk homepage component */}
    <Route path="/" element={<HomePage />} />
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
        <Route path="academic" element={<AcademicPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="teachers" element={<TeachersPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
