import { useEffect, useState } from 'react';
import { getProfile } from '../services/auth.api';

const DashboardPage = () => {
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        console.error(err);
        setMessage('Unable to load your dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Seller dashboard</h1>
            <p className="mt-2 text-sm text-muted">Marketplace seller tools are currently paused while the UI remains under freeze.</p>
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">{message}</div>
      )}

      {loading ? (
        <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
          <div className="rounded-3xl border border-muted bg-background p-8 text-center text-text-secondary">
            <span className="text-sm text-muted">Loading...</span>
          </div>
        </section>
      ) : (
        <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
          <div className="rounded-3xl border border-muted bg-background p-8 text-center text-text-secondary">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0F766E]">Marketplace freeze</p>
            <h2 className="mt-3 text-2xl font-semibold text-text-primary">Seller listing tools are temporarily unavailable.</h2>
            <p className="mt-3 text-sm sm:text-base">
              {user
                ? 'Your account and school-management workflows remain available while the marketplace interface stays hidden.'
                : 'You are not signed in or there is no dashboard data. Sign in to view your dashboard, or contact an administrator if your account should have access.'}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
