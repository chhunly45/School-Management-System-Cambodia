import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  PackageOpen,
  CheckCircle,
  Download,
  AlertCircle,
  Zap
} from 'lucide-react';
import * as sellerAnalyticsAPI from '../services/seller-analytics.api';

interface Metrics {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalProductViews: number;
  favoritesCount: number;
  messagesReceived: number;
  responseRate: number;
  avgListingPerformance: number;
}

interface ViewData {
  _id: string;
  views: number;
  count?: number;
  cumulative?: number;
}

interface Product {
  _id: string;
  title: string;
  views: number;
  status: string;
}

interface Insights {
  bestCategory: string;
  bestCategoryPercent: number;
  bestProduct: Product | null;
  worstProduct: Product | null;
  suggestedActions: string[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const SellerAnalyticsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [sellerTier, setSellerTier] = useState('');
  const [dailyData, setDailyData] = useState<ViewData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ViewData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ViewData[]>([]);
  const [growthData, setGrowthData] = useState<ViewData[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [sortBy, setSortBy] = useState<'views' | 'favorites' | 'messages'>('views');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (metrics) {
      loadTopProducts();
    }
  }, [sortBy]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const [analyticsRes, dailyRes, weeklyRes, monthlyRes, growthRes, insightsRes] = await Promise.all([
        sellerAnalyticsAPI.getSellerAnalytics(),
        sellerAnalyticsAPI.getDailyViewData(),
        sellerAnalyticsAPI.getWeeklyViewData(),
        sellerAnalyticsAPI.getMonthlyViewData(),
        sellerAnalyticsAPI.getListingGrowthData(),
        sellerAnalyticsAPI.getSellerInsights()
      ]);

      setMetrics(analyticsRes.metrics);
      setPerformanceScore(analyticsRes.performanceScore);
      setSellerTier(analyticsRes.sellerTier);
      setDailyData(dailyRes);
      setWeeklyData(weeklyRes);
      setMonthlyData(monthlyRes);
      setGrowthData(growthRes);
      setInsights(insightsRes);

      await loadTopProducts();
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopProducts = async () => {
    try {
      const products = await sellerAnalyticsAPI.getTopProducts(sortBy);
      setTopProducts(products);
    } catch (err) {
      console.error('Failed to load top products', err);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Top Seller':
        return 'from-purple-600 to-pink-600';
      case 'Gold Seller':
        return 'from-warning to-accent-hover';
      case 'Silver Seller':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-accent-hover to-accent';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'Top Seller':
        return '👑';
      case 'Gold Seller':
        return '🏆';
      case 'Silver Seller':
        return '⭐';
      default:
        return '🌟';
    }
  };

  const getChartData = () => {
    if (chartType === 'daily') return dailyData;
    if (chartType === 'weekly') return weeklyData;
    return monthlyData;
  };

  const exportToCSV = () => {
    if (!metrics) return;

    let csv = 'Seller Analytics Report\n';
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    csv += 'Metrics\n';
    csv += `Total Listings,${metrics.totalListings}\n`;
    csv += `Active Listings,${metrics.activeListings}\n`;
    csv += `Sold Listings,${metrics.soldListings}\n`;
    csv += `Total Views,${metrics.totalProductViews}\n`;
    csv += `Favorites,${metrics.favoritesCount}\n`;
    csv += `Messages,${metrics.messagesReceived}\n`;
    csv += `Response Rate,${metrics.responseRate}%\n`;
    csv += `Avg Performance,${metrics.avgListingPerformance}\n\n`;
    csv += `Performance Score,${performanceScore}/100\n`;
    csv += `Seller Tier,${sellerTier}\n\n`;

    csv += 'Top Products\n';
    csv += 'Product Title,Views,Status\n';
    topProducts.forEach((p) => {
      csv += `"${p.title}",${p.views},${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">Failed to load analytics.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Seller Analytics</h1>
            <p className="text-gray-600">Track your sales performance and growth metrics</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Performance Score Card */}
        <div className={`mb-8 p-6 rounded-2xl bg-gradient-to-r ${getTierColor(sellerTier)} text-white shadow-lg`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white text-opacity-90 mb-2">Your Performance</p>
              <h2 className="text-5xl font-bold mb-2">{performanceScore}/100</h2>
              <p className="text-white text-opacity-90 text-lg">{getTierEmoji(sellerTier)} {sellerTier}</p>
            </div>
            <div className="text-6xl">{getTierEmoji(sellerTier)}</div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<PackageOpen className="text-primary" size={24} />}
            label="Active Listings"
            value={metrics.activeListings}
            total={metrics.totalListings}
          />
          <MetricCard
            icon={<Eye className="text-purple-600" size={24} />}
            label="Total Views"
            value={metrics.totalProductViews}
            subtext="All listings"
          />
          <MetricCard
            icon={<Heart className="text-red-600" size={24} />}
            label="Favorites"
            value={metrics.favoritesCount}
          />
          <MetricCard
            icon={<MessageSquare className="text-green-600" size={24} />}
            label="Messages"
            value={metrics.messagesReceived}
            subtext={`${metrics.responseRate}% response rate`}
          />
          <MetricCard
            icon={<CheckCircle className="text-emerald-600" size={24} />}
            label="Sold Items"
            value={metrics.soldListings}
          />
          <MetricCard
            icon={<TrendingUp className="text-primary" size={24} />}
            label="Avg Performance"
            value={metrics.avgListingPerformance}
            subtext="Views per listing"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Views Over Time</h3>
            <div className="flex gap-2 mb-4">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 rounded transition capitalize ${
                    chartType === type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#0369a1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Listing Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#ef4444" name="New Listings" dot={false} />
                <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" name="Cumulative" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Top Products</h3>
            <div className="flex gap-2">
              {(['views', 'favorites', 'messages'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSortBy(type)}
                  className={`px-3 py-1 rounded text-sm transition capitalize ${
                    sortBy === type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  By {type}
                </button>
              ))}
            </div>
          </div>

          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      {sortBy === 'views' ? 'Views' : sortBy === 'favorites' ? 'Favorites' : 'Messages'}
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, idx) => (
                    <tr key={product._id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 text-gray-900">{product.title}</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">{product.views}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            product.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products yet</p>
          )}
        </div>

        {/* Insights Section */}
        {insights && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-amber-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">Insights & Recommendations</h3>
            </div>

            {insights.bestProduct && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-900">
                  ✨ Your best-performing product is <strong>{insights.bestProduct.title}</strong> with{' '}
                  {insights.bestProduct.views} views.
                </p>
              </div>
            )}

            {insights.bestCategory && (
              <div className="mb-4 p-4 bg-background border border-primary/30 rounded-lg">
                <p className="text-text-primary">
                  📊 <strong>{insights.bestCategory}</strong> is your strongest category, accounting for{' '}
                  {insights.bestCategoryPercent}% of your views.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Suggested Actions:</p>
              <ul className="space-y-2">
                {insights.suggestedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <AlertCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number;
  subtext?: string;
}

const MetricCard = ({ icon, label, value, total, subtext }: MetricCardProps) => (
  <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
    {total && <p className="text-xs text-gray-500">of {formatCurrency(total)}</p>}
    {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
  </div>
);

export default SellerAnalyticsPage;


