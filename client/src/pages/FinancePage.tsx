import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Clock3, AlertTriangle, TrendingUp } from 'lucide-react';
import { getFinanceSummary, getFinancePaymentsReport } from '../services/finance.api';

interface PendingOverdue {
  count: number;
  total: number;
}

interface IncomeByMonthItem {
  month: string;
  total: number;
}

interface IncomeByClassItem {
  className: string;
  total: number;
  count: number;
}

interface FinanceSummary {
  totalIncome: number;
  monthlyIncome: number;
  pendingPayments: PendingOverdue;
  overduePayments: PendingOverdue;
  incomeByMonth: IncomeByMonthItem[];
  incomeByClass: IncomeByClassItem[];
}

interface PaymentRecord {
  _id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'mobile_money';
  academicYear?: string;
  semester?: number;
  status: 'paid' | 'pending' | 'overdue';
  remarks?: string;
}

interface PaymentsMeta {
  page: number;
  limit: number;
  total: number;
}

const defaultSummary: FinanceSummary = {
  totalIncome: 0,
  monthlyIncome: 0,
  pendingPayments: { count: 0, total: 0 },
  overduePayments: { count: 0, total: 0 },
  incomeByMonth: [],
  incomeByClass: []
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const FinancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<FinanceSummary>(defaultSummary);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [meta, setMeta] = useState<PaymentsMeta>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    academicYear: '',
    semester: '',
    className: '',
    status: '',
    page: 1,
    perPage: 20
  });

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;

    loadSummary();
    loadPaymentsReport(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await getFinanceSummary();
      setSummary(response.data || defaultSummary);
      setMessage('');
    } catch (err) {
      setMessage('Unable to load finance summary.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsReport = async (page = filters.page) => {
    setReportLoading(true);
    try {
      const response = await getFinancePaymentsReport({
        academicYear: filters.academicYear || undefined,
        semester: filters.semester ? Number(filters.semester) : undefined,
        className: filters.className || undefined,
        status: (filters.status || undefined) as 'paid' | 'pending' | 'overdue' | undefined,
        page,
        perPage: filters.perPage
      });

      const data = response.data || { items: [], meta: { page: 1, limit: 20, total: 0 } };
      setPayments(data.items || []);
      setMeta(data.meta || { page: 1, limit: 20, total: 0 });
      setFilters((prev) => ({ ...prev, page }));
      setMessage('');
    } catch (err) {
      setMessage('Unable to load payments report.');
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20)));

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadPaymentsReport(1);
  };

  const handleResetFilters = () => {
    const reset = {
      academicYear: '',
      semester: '',
      className: '',
      status: '',
      page: 1,
      perPage: 20
    };
    setFilters(reset);

    setTimeout(() => {
      loadPaymentsReport(1);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Finance</h1>
        <p className="text-text-secondary">School finance reports and payment analytics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Income</p>
              <p className="text-2xl font-bold text-text-primary">{currency.format(summary.totalIncome)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">{currency.format(summary.monthlyIncome)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Pending Payments</p>
              <p className="text-lg font-bold text-amber-600">
                {summary.pendingPayments.count} / {currency.format(summary.pendingPayments.total)}
              </p>
            </div>
            <Clock3 className="h-8 w-8 text-amber-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Overdue Payments</p>
              <p className="text-lg font-bold text-red-600">
                {summary.overduePayments.count} / {currency.format(summary.overduePayments.total)}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${message.includes('Unable') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-muted bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Monthly Income (Last 12 Months)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Income</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-text-secondary">
                      Loading...
                    </td>
                  </tr>
                ) : summary.incomeByMonth.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-text-secondary">
                      No monthly income data.
                    </td>
                  </tr>
                ) : (
                  summary.incomeByMonth.map((item) => (
                    <tr key={item.month} className="border-t border-muted hover:bg-background transition">
                      <td className="px-4 py-3 text-sm">{item.month}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{currency.format(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Income By Class</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Payments</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Income</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                      Loading...
                    </td>
                  </tr>
                ) : summary.incomeByClass.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                      No class income data.
                    </td>
                  </tr>
                ) : (
                  summary.incomeByClass.map((item) => (
                    <tr key={item.className} className="border-t border-muted hover:bg-background transition">
                      <td className="px-4 py-3 text-sm">{item.className}</td>
                      <td className="px-4 py-3 text-sm">{item.count}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{currency.format(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Payments Report</h3>

        <form onSubmit={handleApplyFilters} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-muted bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Academic Year</label>
            <input
              type="text"
              value={filters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              placeholder="e.g. 2025-2026"
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Semester</label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            >
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Class</label>
            <input
              type="text"
              value={filters.className}
              onChange={(e) => handleFilterChange('className', e.target.value)}
              placeholder="e.g. Grade 10-A"
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:opacity-90">
              Apply
            </button>
          </div>

          <div className="flex items-end">
            <button type="button" onClick={handleResetFilters} className="w-full rounded-lg border border-muted px-4 py-2 text-text-primary hover:bg-background">
              Reset
            </button>
          </div>
        </form>

        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Receipt</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Year/Sem</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {reportLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    Loading...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 text-sm">{payment.receiptNumber}</td>
                    <td className="px-4 py-3 text-sm">{payment.studentName}</td>
                    <td className="px-4 py-3 text-sm">{payment.className}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{currency.format(payment.amount)}</td>
                    <td className="px-4 py-3 text-sm">{payment.academicYear || '-'} / {payment.semester || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Page {meta.page} of {totalPages} • Total records: {meta.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadPaymentsReport(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1 || reportLoading}
              className="rounded-lg border border-muted px-4 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => loadPaymentsReport(Math.min(totalPages, meta.page + 1))}
              disabled={meta.page >= totalPages || reportLoading}
              className="rounded-lg border border-muted px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
