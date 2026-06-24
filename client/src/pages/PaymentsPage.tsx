import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Check, Clock, X } from 'lucide-react';

interface PaymentMetrics {
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  failedAmount: number;
}

interface Payment {
  _id: string;
  studentName: string;
  studentId: string;
  amount: number;
  paymentDate: Date;
  status: 'pending' | 'received' | 'failed' | 'cancelled';
  paymentMethod: 'cash' | 'bank' | 'online';
  reference: string;
}

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    failedAmount: 0
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'failed'>('all');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const metricsData = await getPaymentMetrics();
      // const paymentsData = await getPayments();

      setMetrics({
        totalAmount: 500000,
        receivedAmount: 450000,
        pendingAmount: 40000,
        failedAmount: 10000
      });

      setPayments([
        {
          _id: '1',
          studentName: 'Sokha Minh',
          studentId: 'S001',
          amount: 50000,
          paymentDate: new Date('2024-06-20'),
          status: 'received',
          paymentMethod: 'online',
          reference: 'TXN20240620001'
        },
        {
          _id: '2',
          studentName: 'Srey Nit',
          studentId: 'S002',
          amount: 50000,
          paymentDate: new Date('2024-06-21'),
          status: 'pending',
          paymentMethod: 'bank',
          reference: 'TXN20240621001'
        },
        {
          _id: '3',
          studentName: 'Pheap Dev',
          studentId: 'S003',
          amount: 50000,
          paymentDate: new Date('2024-06-19'),
          status: 'received',
          paymentMethod: 'cash',
          reference: 'TXN20240619001'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load payment data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    (!startDate || new Date(p.paymentDate) >= new Date(startDate)) &&
    (!endDate || new Date(p.paymentDate) <= new Date(endDate))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Payments</h1>
        <p className="text-text-secondary">Track and manage student fee payments</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Amount</p>
              <p className="text-2xl font-bold text-text-primary">
                {(metrics.totalAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Received</p>
              <p className="text-2xl font-bold text-green-600">
                {(metrics.receivedAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <Check className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(metrics.pendingAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {(metrics.failedAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <X className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto rounded-lg border border-muted">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map(payment => (
                <tr key={payment._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{payment.studentName}</td>
                  <td className="px-4 py-3 font-semibold">{payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'received'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{payment.reference}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
