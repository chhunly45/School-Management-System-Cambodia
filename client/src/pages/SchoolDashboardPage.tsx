import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getSchoolDashboardStats } from '../services/schoolDashboard.api';
import { getSchoolSettings, type SchoolSettings } from '../services/schoolSettings.api';
import { formatAmount, getCurrencyFormatter } from '../utils/price';

interface RecentPayment {
  _id: string;
  receiptNumber: string;
  studentName: string;
  className: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
}

interface RecentStudent {
  _id: string;
  studentId: string;
  fullName: string;
  className: string;
  status: string;
  createdAt: string;
}

interface SchoolDashboardStats {
  studentsPresentToday: number;
  studentsAbsentToday: number;
  teachersPresentToday: number | null;
  todaysIncome: number;
  monthlyIncome: number;
  outstandingTuition: number;
  dueSoonPayments: number;
  gracePeriodPayments: number;
  overduePayments: number;
  totalCertificates: number;
  totalTransport: number;
}

const defaultStats: SchoolDashboardStats = {
  studentsPresentToday: 0,
  studentsAbsentToday: 0,
  teachersPresentToday: 0,
  todaysIncome: 0,
  monthlyIncome: 0,
  outstandingTuition: 0,
  dueSoonPayments: 0,
  gracePeriodPayments: 0,
  overduePayments: 0,
  totalCertificates: 0,
  totalTransport: 0
};

const defaultSchoolSettings: Pick<SchoolSettings, 'schoolName' | 'logo' | 'defaultCurrency' | 'exchangeRateUsdToKhr'> = {
  schoolName: 'School Dashboard',
  logo: '',
  defaultCurrency: 'USD',
  exchangeRateUsdToKhr: 0
};

const SchoolDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SchoolDashboardStats>(defaultStats);
  const [schoolSettings, setSchoolSettings] = useState(defaultSchoolSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(schoolSettings.defaultCurrency || 'USD', schoolSettings.defaultCurrency === 'KHR' ? 0 : 2),
    [schoolSettings.defaultCurrency]
  );

  const formatSummaryCurrency = (amount: number) => {
    const value = Number(amount || 0);

    if (schoolSettings.defaultCurrency === 'KHR' && schoolSettings.exchangeRateUsdToKhr > 0) {
      return formatAmount(value * schoolSettings.exchangeRateUsdToKhr, 'KHR', 0);
    }

    return currencyFormatter.format(value);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      return;
    }

    void Promise.all([loadSettings(), loadStats()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await getSchoolSettings();
      const data = response.data || defaultSchoolSettings;
      setSchoolSettings({
        schoolName: data.schoolName || defaultSchoolSettings.schoolName,
        logo: data.logo || '',
        defaultCurrency: data.defaultCurrency || 'USD',
        exchangeRateUsdToKhr: Number(data.exchangeRateUsdToKhr || 0)
      });
    } catch (error) {
      console.error(error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await getSchoolDashboardStats();
      setStats(response.data || defaultStats);
      setMessage('');
    } catch (error) {
      console.error(error);
      setMessage('Unable to load school dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-background ring-1 ring-border">
              {schoolSettings.logo ? (
                <img src={schoolSettings.logo} alt="School logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold uppercase text-muted">Logo</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-text-primary">{schoolSettings.schoolName}</h1>
              <p className="mt-2 text-sm text-muted">Overview of students, teachers, finance, attendance, and recent activities.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-secondary ring-1 ring-border">
            <div>Currency: {schoolSettings.defaultCurrency}</div>
            <div>Exchange rate: {schoolSettings.exchangeRateUsdToKhr || 0}</div>
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">{message}</div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Students Present Today</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.studentsPresentToday}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Students Absent Today</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.studentsAbsentToday}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Teachers Present Today</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">
            {stats.teachersPresentToday === null ? 'Not Available' : stats.teachersPresentToday}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Today's Income</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{formatSummaryCurrency(stats.todaysIncome)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Monthly Income</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{formatSummaryCurrency(stats.monthlyIncome)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Outstanding Tuition</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{formatSummaryCurrency(stats.outstandingTuition)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Due Soon Payments</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.dueSoonPayments}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Grace Period Payments</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.gracePeriodPayments}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Overdue Payments</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.overduePayments}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Issued Certificates</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.totalCertificates}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Active Transport</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.totalTransport}</p>
        </article>
      </section>
    </div>
  );
};

export default SchoolDashboardPage;
