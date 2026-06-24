import { useEffect, useState } from 'react';
import {
  getRevenueMetrics,
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getRevenueBySeller
} from '../services/revenue.api';

interface RevenueMetrics {
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
}

interface ChartData {
  _id: string;
  revenue: number;
  count: number;
  date?: Date;
}

interface SellerRevenue {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  revenue: number;
  transactionCount: number;
}

const AdminRevenuePage = () => {
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    yearRevenue: 0
  });
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [sellerData, setSellerData] = useState<SellerRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeChart, setActiveChart] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const loadMetrics = async () => {
    try {
      const data = await getRevenueMetrics();
      setMetrics(data);
    } catch {
      // If metrics are not available yet, default to zeroes and avoid showing an error banner
      setMetrics({ totalRevenue: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0, yearRevenue: 0 });
    }
  };

  const loadCharts = async () => {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [daily, weekly, monthly] = await Promise.all([
        getDailyRevenue({ ...params, limit: 30 }),
        getWeeklyRevenue({ ...params, limit: 12 }),
        getMonthlyRevenue({ ...params, limit: 12 })
      ]);

      setDailyData(daily);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch {
      // On failure (or no data), show empty chart data instead of an error banner
      setDailyData([]);
      setWeeklyData([]);
      setMonthlyData([]);
    }
  };

  const loadSellerData = async () => {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getRevenueBySeller(params);
      setSellerData(data);
    } catch {
      // If seller revenue is not available yet, default to empty list and avoid an error banner
      setSellerData([]);
    }
  };

  const handleFilterChange = async () => {
    setLoading(true);
    try {
      await loadCharts();
      await loadSellerData();
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Revenue', 'Transaction Count'];
    const data = (activeChart === 'daily' ? dailyData : activeChart === 'weekly' ? weeklyData : monthlyData)
      .map((item) => [item._id, item.revenue.toFixed(2), item.count]);

    const csv = [headers, ...data].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${activeChart}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToXLSX = () => {
    const rows = [
      ['Date', 'Revenue', 'Transaction Count'],
      ...((activeChart === 'daily' ? dailyData : activeChart === 'weekly' ? weeklyData : monthlyData).map((item) => [item._id, item.revenue.toFixed(2), item.count]))
    ];

    const xmlContent = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n  <Worksheet ss:Name="Revenue">\n    <Table>\n${rows
      .map(
        (row) =>
          `      <Row>${row
            .map(
              (cell) =>
                `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`
            )
            .join('')}</Row>`
      )
      .join('\n')}
    </Table>\n  </Worksheet>\n</Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${activeChart}-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  };

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      metrics,
      chartType: activeChart,
      data: activeChart === 'daily' ? dailyData : activeChart === 'weekly' ? weeklyData : monthlyData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${activeChart}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  useEffect(() => {
    loadMetrics();
    loadCharts();
    loadSellerData();
  }, []);

  const chartData = activeChart === 'daily' ? dailyData : activeChart === 'weekly' ? weeklyData : monthlyData;
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Revenue dashboard</h1>
            <p className="mt-2 text-sm text-muted">Track platform revenue, analyze trends, and monitor seller performance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="rounded-full px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-hover transition"
            >
              CSV Export
            </button>
            <button
              type="button"
              onClick={exportToXLSX}
              className="rounded-full px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              XLSX Export
            </button>
            <button
              type="button"
              onClick={exportToJSON}
              className="rounded-full px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
            >
              JSON Export
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-warning/30 bg-background p-4 text-sm text-warning">{message}</div>
      )}

      {/* Revenue Metrics Cards */}
      <section className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">Total Revenue</p>
          <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(metrics.totalRevenue)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">Today</p>
          <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(metrics.todayRevenue)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">This Week</p>
          <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(metrics.weekRevenue)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">This Month</p>
          <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(metrics.monthRevenue)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">This Year</p>
          <p className="mt-4 text-2xl font-semibold text-text-primary">{formatCurrency(metrics.yearRevenue)}</p>
        </article>
      </section>

      {/* Date Range Filter */}
      <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <h2 className="text-xl font-semibold text-text-primary">Filter</h2>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-muted px-4 py-2 text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-muted px-4 py-2 text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleFilterChange}
              disabled={loading}
              className="rounded-full px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-hover transition disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      {/* Revenue Charts */}
      <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Revenue Trend</h2>
          <div className="flex flex-wrap gap-2">
            {['daily', 'weekly', 'monthly'].map((chart) => (
              <button
                key={chart}
                type="button"
                onClick={() => setActiveChart(chart as any)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeChart === chart
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background text-text-secondary hover:bg-background'
                }`}
              >
                {chart.charAt(0).toUpperCase() + chart.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mt-8 space-y-4">
          {chartData.length > 0 ? (
            chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-right text-xs font-medium text-text-secondary">{item._id}</div>
                <div className="flex-1">
                  <div className="relative h-8 rounded-full bg-background">
                    <div
                      className="flex items-center justify-end rounded-full bg-gradient-to-r from-primary/100 to-primary pr-4 text-xs font-semibold text-white transition-all"
                      style={{ width: `${Math.max((item.revenue / maxRevenue) * 100, 5)}%` }}
                    >
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-xs text-text-secondary">{item.count} txns</div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-8">No data available for the selected period.</div>
          )}
        </div>
      </section>

      {/* Top Sellers */}
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
          <h2 className="text-xl font-semibold text-text-primary">Top Sellers</h2>
          <p className="mt-2 text-sm text-muted">Highest revenue generating sellers in the selected period.</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-background text-text-secondary">
              <tr>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Seller</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Email</th>
                <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.2em]">Revenue</th>
                <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.2em]">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sellerData.length > 0 ? (
                sellerData.map((seller) => (
                  <tr key={seller.sellerId}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{seller.sellerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-secondary">{seller.sellerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-text-primary">{formatCurrency(seller.revenue)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-text-secondary">{seller.transactionCount}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted">
                    No seller data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminRevenuePage;


