import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getPaymentTrackingReport } from '../services/finance.api';

interface TrackingRow {
  rowNumber: number;
  studentId: string;
  fullName: string;
  englishName: string;
  khmerName: string;
  route: string;
  vehicle: string;
  monthlyRouteFee: number;
  transportCharge: number;
  gender: string;
  phone: string;
  paymentStartDate: string;
  paymentDurationMonths: number;
  dueDate: string;
  tuitionAmount: number;
  discount: number;
  totalAmount: number;
  daysLeft: number;
  status: 'Paid' | 'Warning' | 'Expired';
  statusCode: 'paid' | 'warning' | 'expired';
  room: string;
  session: string;
  className: string;
  academicYear: string;
  paymentPlan: string;
  remainingBalance: number;
  note: string;
}

interface TrackingMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TrackingSummary {
  totalStudents: number;
  paid: number;
  warning: number;
  expired: number;
  sessions: Record<string, number>;
  rooms: Record<string, number>;
  totalTuition: number;
  totalDiscount: number;
  totalPaid: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const statusStyles: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  Expired: 'bg-rose-100 text-rose-700 border border-rose-200'
};

const PaymentTrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [meta, setMeta] = useState<TrackingMeta>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<TrackingSummary>({
    totalStudents: 0,
    paid: 0,
    warning: 0,
    expired: 0,
    sessions: {},
    rooms: {},
    totalTuition: 0,
    totalDiscount: 0,
    totalPaid: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    session: 'All',
    room: '',
    plan: 'All',
    status: 'All',
    from: '',
    to: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/admin');
      return;
    }

    void loadReport(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadReport = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getPaymentTrackingReport({
        search: filters.search || undefined,
        session: filters.session && filters.session !== 'All' ? filters.session : undefined,
        room: filters.room || undefined,
        plan: filters.plan && filters.plan !== 'All' ? filters.plan : undefined,
        status: filters.status && filters.status !== 'All' ? filters.status.toLowerCase() : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        perPage: 25
      });

      const data = response?.data || { items: [], meta: { page: 1, limit: 25, total: 0, totalPages: 1 }, summary: {
        totalStudents: 0,
        paid: 0,
        warning: 0,
        expired: 0,
        sessions: {},
        rooms: {},
        totalTuition: 0,
        totalDiscount: 0,
        totalPaid: 0
      } };
      setRows(data.items || []);
      setMeta(data.meta || { page: 1, limit: 25, total: 0, totalPages: 1 });
      setSummary(data.summary || { totalStudents: 0, paid: 0, warning: 0, expired: 0, sessions: {}, rooms: {}, totalTuition: 0, totalDiscount: 0, totalPaid: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleApply = (event?: React.FormEvent) => {
    event?.preventDefault();
    void loadReport(1);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      session: 'All',
      room: '',
      plan: 'All',
      status: 'All',
      from: '',
      to: ''
    });
    setTimeout(() => void loadReport(1), 0);
  };

  const statusCounts = useMemo(() => ({
    paid: summary.paid || 0,
    warning: summary.warning || 0,
    expired: summary.expired || 0
  }), [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Payment Tracking</h1>
        <p className="text-text-secondary">Read-only student payment tracking based on current Students and Payments data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Total Students</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{statusCounts.paid}</p>
        </div>
        <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Warning</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{statusCounts.warning}</p>
        </div>
        <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Expired</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{statusCounts.expired}</p>
        </div>
        <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Total Tuition</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(summary.totalTuition)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={handleApply}>
          <label className="flex flex-col text-sm font-medium text-text-secondary">
            Search
            <input value={filters.search} onChange={(event) => handleChange('search', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm" placeholder="Student ID / Name / Phone" />
          </label>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            Session
            <select value={filters.session} onChange={(event) => handleChange('session', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm">
              <option>All</option>
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            Room/Class
            <input value={filters.room} onChange={(event) => handleChange('room', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm" placeholder="Room" />
          </label>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            Payment Plan
            <select value={filters.plan} onChange={(event) => handleChange('plan', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm">
              <option>All</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Semi-Annual</option>
              <option>Yearly</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            Status
            <select value={filters.status} onChange={(event) => handleChange('status', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm">
              <option>All</option>
              <option>Paid</option>
              <option>Warning</option>
              <option>Expired</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Apply</button>
            <button type="button" onClick={handleReset} className="rounded-xl border border-muted bg-background px-4 py-2 text-sm font-semibold text-text-primary">Reset</button>
          </div>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            From
            <input type="date" value={filters.from} onChange={(event) => handleChange('from', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm" />
          </label>

          <label className="flex flex-col text-sm font-medium text-text-secondary">
            To
            <input type="date" value={filters.to} onChange={(event) => handleChange('to', event.target.value)} className="mt-1 rounded-xl border border-muted bg-background px-3 py-2 text-sm" />
          </label>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-muted bg-white shadow-sm">
        <table className="min-w-[1600px] w-full text-left text-sm">
          <thead className="bg-muted/40 text-text-secondary">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Student ID</th>
              <th className="px-3 py-3">Student Name</th>
              <th className="px-3 py-3">English Name</th>
              <th className="px-3 py-3">Khmer Name</th>
              <th className="px-3 py-3">Gender</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Route</th>
              <th className="px-3 py-3">Vehicle/Car</th>
              <th className="px-3 py-3">Monthly Route Fee</th>
              <th className="px-3 py-3">Transport Charge</th>
              <th className="px-3 py-3">Start Date</th>
              <th className="px-3 py-3">Months</th>
              <th className="px-3 py-3">Expiry Date</th>
              <th className="px-3 py-3">Tuition</th>
              <th className="px-3 py-3">Discount</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3">Days Left</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Room</th>
              <th className="px-3 py-3">Session</th>
              <th className="px-3 py-3">Class</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={22} className="px-3 py-4 text-center text-text-secondary">Loading tracking data…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={22} className="px-3 py-4 text-center text-text-secondary">No tracking rows found.</td></tr>
            ) : rows.map((row) => (
              <tr key={`${row.studentId}-${row.rowNumber}`} className="border-t border-muted hover:bg-background/70">
                <td className="px-3 py-3">{row.rowNumber}</td>
                <td className="px-3 py-3 text-text-secondary">{row.studentId || '—'}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-text-primary">{row.fullName || '—'}</div>
                </td>
                <td className="px-3 py-3">{row.englishName || '—'}</td>
                <td className="px-3 py-3">{row.khmerName || '—'}</td>
                <td className="px-3 py-3 capitalize">{row.gender || '—'}</td>
                <td className="px-3 py-3">{row.phone || '—'}</td>
                <td className="px-3 py-3">{row.route || '—'}</td>
                <td className="px-3 py-3">{row.vehicle || '—'}</td>
                <td className="px-3 py-3">{formatCurrency(row.monthlyRouteFee)}</td>
                <td className="px-3 py-3">{formatCurrency(row.transportCharge)}</td>
                <td className="px-3 py-3">{formatDate(row.paymentStartDate)}</td>
                <td className="px-3 py-3">{row.paymentDurationMonths}</td>
                <td className="px-3 py-3">{formatDate(row.dueDate)}</td>
                <td className="px-3 py-3">{formatCurrency(row.tuitionAmount)}</td>
                <td className="px-3 py-3">{formatCurrency(row.discount)}</td>
                <td className="px-3 py-3">{formatCurrency(row.totalAmount)}</td>
                <td className={`px-3 py-3 font-medium ${row.daysLeft <= 5 ? 'text-amber-700' : 'text-text-primary'}`}>{row.daysLeft}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[row.status] || statusStyles.Paid}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-3">{row.room || '—'}</td>
                <td className="px-3 py-3">{row.session || '—'}</td>
                <td className="px-3 py-3">{row.className || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Page {meta.page} of {Math.max(1, meta.totalPages)} · {meta.total} records</p>
        <div className="flex gap-2">
          <button type="button" disabled={meta.page <= 1} onClick={() => void loadReport(meta.page - 1)} className="rounded-xl border border-muted bg-white px-3 py-2 text-sm font-medium disabled:opacity-40">Previous</button>
          <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => void loadReport(meta.page + 1)} className="rounded-xl border border-muted bg-white px-3 py-2 text-sm font-medium disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentTrackingPage;
