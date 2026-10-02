import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Users, ShoppingBag, CheckCircle, TrendingUp, BookOpen, Award, Bus, GraduationCap, CalendarRange, Layers, Building2, Settings2, QrCode, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: Home },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Students', to: '/admin/students', icon: Users },
  { label: 'Teachers', to: '/admin/teachers', icon: GraduationCap },
  { label: 'Payments', to: '/admin/payments', icon: ShoppingBag },
  { label: 'Attendance', to: '/admin/attendance', icon: CheckCircle },
  { label: 'Teacher Attendance', to: '/admin/teacher-attendance', icon: CheckCircle },
  { label: 'Attendance QR', to: '/admin/attendance/qr', icon: QrCode },
  { label: 'Employee Attendance', to: '/admin/employee-attendance', icon: Users },
  { label: 'Academic', to: '/admin/academic', icon: BookOpen },
  { label: 'Academic Years', to: '/admin/academic-years', icon: CalendarRange },
  { label: 'Grades', to: '/admin/grades', icon: Layers },
  { label: 'Subjects', to: '/admin/subjects', icon: BookOpen },
  { label: 'Classes', to: '/admin/classes', icon: Building2 },
  { label: 'Certificates', to: '/admin/certificates', icon: Award },
  { label: 'Finance', to: '/admin/finance', icon: TrendingUp },
  { label: 'Payment Tracking', to: '/admin/finance/payment-tracking', icon: TrendingUp },
  { label: 'Transport', to: '/admin/transport', icon: Bus },
  { label: 'Vehicles', to: '/admin/vehicles', icon: Bus },
  { label: 'Routes', to: '/admin/routes', icon: Bus },
  { label: 'Transport Assignments', to: '/admin/transport-assignments', icon: Bus },
  { label: 'Fuel Management', to: '/admin/fuel', icon: Bus },
  { label: 'Expense Management', to: '/admin/expenses', icon: TrendingUp },
  { label: 'School Settings', to: '/admin/school-settings', icon: Settings2 }
];

const AdminLayout = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLimitedUser = user?.role === 'LIMITED_STUDENT_PAYMENT';
  const visibleNavItems = isLimitedUser
    ? navItems.filter((item) => ['/admin/students', '/admin/payments'].includes(item.to))
    : navItems;

  const renderNavItems = (onNavigate?: () => void) => visibleNavItems.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/admin'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-3xl px-4 py-3.5 text-base font-medium transition lg:py-3 lg:text-sm ${
            isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-background'
          }`
        }
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-text-secondary">
          <Icon className="h-5 w-5" />
        </span>
        <span>{item.label}</span>
      </NavLink>
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="mb-1 flex items-center justify-between rounded-3xl border border-muted bg-white px-4 py-3 shadow-sm lg:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">{isLimitedUser ? 'Student & Payment' : 'School Admin'}</p>
              <p className="mt-1 text-lg font-semibold text-text-primary">{isLimitedUser ? 'Workspace' : 'Admin Menu'}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-muted bg-white text-text-primary shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={mobileMenuOpen ? 'Close admin navigation' : 'Open admin navigation'}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/40"
                aria-label="Close admin navigation"
              />
              <aside id="admin-mobile-navigation" className="absolute inset-x-3 bottom-3 top-20 overflow-y-auto rounded-3xl border border-muted bg-white p-4 shadow-2xl sm:left-auto sm:w-[min(22rem,calc(100vw-1.5rem))]">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-muted pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">{isLimitedUser ? 'Student & Payment' : 'School Admin'}</p>
                    <p className="mt-1 text-lg font-semibold text-text-primary">{isLimitedUser ? 'Workspace' : 'Navigation'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-muted text-text-primary"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="space-y-2" aria-label="Admin navigation">
                  {renderNavItems(() => setMobileMenuOpen(false))}
                </nav>
              </aside>
            </div>
          )}

          <aside className="hidden rounded-[2rem] border border-muted bg-white p-6 shadow-xl ring-1 ring-muted lg:block">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-text-secondary">{isLimitedUser ? 'Student & Payment' : 'School Admin'}</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">{isLimitedUser ? 'Workspace' : 'Manage School'}</h2>
            </div>
            <nav className="space-y-2">
              {renderNavItems()}
            </nav>
          </aside>

          <main className="max-w-full min-w-0 space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
