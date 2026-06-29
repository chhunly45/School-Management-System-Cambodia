import { useEffect, useState } from 'react';
import { getAdminOverview } from '../services/admin.api';

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState<Record<string, any>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await getAdminOverview();
        setOverview(data);
      } catch {
        setMessage('Unable to load overview right now.');
      }
    };

    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Admin dashboard</h1>
            <p className="mt-2 text-sm text-muted">Marketplace administration views are currently hidden while the UI remains under freeze.</p>
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-warning/30 bg-background p-4 text-sm text-warning">{message}</div>
      )}

      <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="rounded-3xl border border-muted bg-background p-8 text-center text-text-secondary">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0F766E]">Marketplace freeze</p>
          <h2 className="mt-3 text-2xl font-semibold text-text-primary">Administrative marketplace controls are temporarily unavailable.</h2>
          <p className="mt-3 text-sm sm:text-base">
            {overview.totalProducts ?? 0} marketplace products are currently hidden while the freeze is active.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
