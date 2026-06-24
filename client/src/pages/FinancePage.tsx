import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';

interface FinanceMetrics {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyIncome: number;
}

interface Transaction {
  _id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  reference?: string;
}

const FinancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<FinanceMetrics>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    monthlyIncome: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeChart, setActiveChart] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      // const metricsData = await getFinanceMetrics();
      // const transactionsData = await getTransactions();

      setMetrics({
        totalIncome: 650000,
        totalExpense: 150000,
        netBalance: 500000,
        monthlyIncome: 150000
      });

      setTransactions([
        {
          _id: '1',
          date: new Date('2024-06-20'),
          type: 'income',
          category: 'Student Fees',
          amount: 50000,
          description: 'June tuition fees - Class 10A',
          reference: 'INV2024061'
        },
        {
          _id: '2',
          date: new Date('2024-06-19'),
          type: 'expense',
          category: 'Salaries',
          amount: 100000,
          description: 'Staff salaries - June',
          reference: 'PAY2024061'
        },
        {
          _id: '3',
          date: new Date('2024-06-18'),
          type: 'income',
          category: 'Donations',
          amount: 25000,
          description: 'Corporate donation',
          reference: 'DON2024062'
        },
        {
          _id: '4',
          date: new Date('2024-06-17'),
          type: 'expense',
          category: 'Utilities',
          amount: 15000,
          description: 'Electricity and water',
          reference: 'UTL2024063'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load financial data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    (!startDate || new Date(t.date) >= new Date(startDate)) &&
    (!endDate || new Date(t.date) <= new Date(endDate))
  );

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    income: [35000, 40000, 38000, 42000],
    expense: [30000, 32000, 28000, 35000]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Finance</h1>
        <p className="text-text-secondary">School financial management and analytics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Balance</p>
              <p className="text-2xl font-bold text-text-primary">
                {(metrics.netBalance / 1000).toFixed(0)}K
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {(metrics.totalIncome / 1000).toFixed(0)}K
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Expense</p>
              <p className="text-2xl font-bold text-red-600">
                {(metrics.totalExpense / 1000).toFixed(0)}K
              </p>
            </div>
            <ArrowDownLeft className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">This Month</p>
              <p className="text-2xl font-bold text-primary">
                {(metrics.monthlyIncome / 1000).toFixed(0)}K
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-20" />
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

      {/* Chart Section */}
      <div className="rounded-lg border border-muted bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Financial Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChart('daily')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                activeChart === 'daily'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-muted'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveChart('weekly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                activeChart === 'weekly'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-muted'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveChart('monthly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                activeChart === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-muted'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-64 flex items-end justify-around gap-4 p-4 bg-background rounded-lg">
          {chartData.income.map((income, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2">
              <div className="relative w-full">
                <div
                  className="bg-green-500 rounded-t-lg mx-auto"
                  style={{ height: `${(income / 50000) * 200}px`, width: '60%' }}
                  title={`Income: ${income}`}
                />
              </div>
              <div className="text-xs text-text-secondary">{chartData.labels[idx]}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded-full" />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full" />
            <span>Expense</span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex gap-4 mb-4 flex-wrap items-end">
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
        </div>

        <div className="overflow-x-auto rounded-lg border border-muted">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
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
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(transaction => (
                  <tr key={transaction._id} className="border-t border-muted hover:bg-background transition">
                    <td className="px-4 py-3 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{transaction.category}</td>
                    <td className="px-4 py-3 text-sm">{transaction.description}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'} {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{transaction.reference}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
