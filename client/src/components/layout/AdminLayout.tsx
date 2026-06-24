import { NavLink, Outlet } from 'react-router-dom';
import { Home, Users, ShoppingBag, FileText, TrendingUp, BarChart3, ShieldCheck, Activity } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: Home },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Sellers', to: '/admin/sellers', icon: Users },
  { label: 'Products', to: '/admin/products', icon: ShoppingBag },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Verifications', to: '/admin/verification', icon: ShieldCheck },
  { label: 'Revenue', to: '/admin/revenue', icon: TrendingUp },
  { label: 'Traffic', to: '/admin/traffic', icon: Activity },
  { label: 'Promotions', to: '/admin/promotions', icon: TrendingUp },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Audit', to: '/admin/audit', icon: ShieldCheck }
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[2rem] border border-muted bg-white p-6 shadow-xl ring-1 ring-muted">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-text-secondary">Admin menu</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">Manage platform</h2>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                        isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-background'
                      }`
                    }
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-text-secondary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
