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
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Eye,
  Search,
  TrendingUp,
  Download,
  AlertCircle,
  Activity,
  UserCheck
} from 'lucide-react';
import * as trafficAnalyticsAPI from '../services/traffic-analytics.api';

interface TrafficMetrics {
  totalVisits: number;
  uniqueVisitors: number;
  returningVisitors: number;
  newVisitors: number;
  totalSearches: number;
  pageViewsByType: Record<string, number>;
  bounceRate: number;
  avgSessionDuration: number;
}

interface SearchAnalytics {
  mostSearchedKeywords: Array<{ keyword: string; searches: number; avgResults: number }>;
  noResultsSearches: Array<{ keyword: string; count: number }>;
  categorySearchTrends: Array<{ category: string | { name?: string; labelKh?: string }; searches: number }>;
}

interface TopContent {
  mostViewedProducts: Array<{ _id: string; title: string; views: number }>;
  mostViewedCategories: Array<{ _id: string; name: string; views: number }>;
  mostViewedSellers: Array<{ _id: string; displayName: string; views: number }>;
  mostActiveSellers: Array<{ _id: string; displayName: string; productViews: number }>;
}

interface ChartData {
  date: string;
  pageViews?: number;
  uniqueVisitors?: number;
  searches?: number;
  noResults?: number;
  totalVisitors?: number;
  returning?: number;
  new?: number;
}

interface Insight {
  type: string;
  title: string;
  description: string;
}

const TrafficAnalyticsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [topContent, setTopContent] = useState<TopContent | null>(null);
  const [trafficTrends, setTrafficTrends] = useState<ChartData[]>([]);
  const [searchGrowth, setSearchGrowth] = useState<ChartData[]>([]);
  const [visitorGrowth, setVisitorGrowth] = useState<ChartData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadCharts();
  }, [chartPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const [metricsRes, searchRes, contentRes, insightsRes] = await Promise.all([
        trafficAnalyticsAPI.getTrafficMetrics(),
        trafficAnalyticsAPI.getSearchAnalytics(),
        trafficAnalyticsAPI.getTopContent(),
        trafficAnalyticsAPI.getTrafficInsights()
      ]);

      setMetrics(metricsRes || null);
      setSearchAnalytics(searchRes || null);
      setTopContent(contentRes || null);
      setInsights(insightsRes || []);

      await loadCharts();
    } catch (err) {
      // If traffic analytics are not available, show empty states instead of error banner
      setMetrics(null);
      setSearchAnalytics(null);
      setTopContent(null);
      setInsights([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async () => {
    try {
      const [trendsRes, searchRes, visitorRes] = await Promise.all([
        trafficAnalyticsAPI.getTrafficTrends(chartPeriod),
        trafficAnalyticsAPI.getSearchGrowth(chartPeriod),
        trafficAnalyticsAPI.getVisitorGrowth(chartPeriod)
      ]);

      setTrafficTrends(trendsRes || []);
      setSearchGrowth(searchRes || []);
      setVisitorGrowth(visitorRes || []);
    } catch (err) {
      // On failure, show empty chart data instead of error message
      setTrafficTrends([]);
      setSearchGrowth([]);
      setVisitorGrowth([]);
      console.error('Failed to load charts', err);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const exportToCSV = () => {
    if (!metrics) return;

    let csv = 'Traffic Analytics Report\n';
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    csv += 'Traffic Metrics\n';
    csv += `Total Visits,${metrics.totalVisits}\n`;
    csv += `Unique Visitors,${metrics.uniqueVisitors}\n`;
    csv += `Returning Visitors,${metrics.returningVisitors}\n`;
    csv += `New Visitors,${metrics.newVisitors}\n`;
    csv += `Total Searches,${metrics.totalSearches}\n`;
    csv += `Bounce Rate,${metrics.bounceRate}%\n`;
    csv += `Avg Session Duration,${metrics.avgSessionDuration}s\n\n`;

    csv += 'Page Views by Type\n';
    Object.entries(metrics.pageViewsByType).forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });
    csv += '\n';

    if (searchAnalytics) {
      csv += 'Top Searches\n';
      csv += 'Keyword,Searches,Avg Results\n';
      searchAnalytics.mostSearchedKeywords.forEach((item) => {
        csv += `"${item.keyword}",${item.searches},${item.avgResults}\n`;
      });
      csv += '\n';
    }

    if (topContent) {
      csv += 'Most Viewed Products\n';
      csv += 'Product,Views\n';
      topContent.mostViewedProducts.forEach((p) => {
        csv += `"${p.title}",${p.views}\n`;
      });
      csv += '\n';

      csv += 'Most Viewed Categories\n';
      csv += 'Category,Views\n';
      topContent.mostViewedCategories.forEach((c) => {
        csv += `${c.name},${c.views}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-analytics-${new Date().toISOString().split('T')[0]}.csv`;
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
          <p className="mt-4 text-gray-600">Loading traffic analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 bg-background rounded-lg border border-muted text-center">
            <p className="text-text-secondary text-lg">No traffic data available yet.</p>
            <p className="text-muted mt-2">Traffic analytics will appear here as users browse the platform.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Traffic Analytics</h1>
            <p className="text-gray-600">Monitor your platform's traffic, searches, and user behavior</p>
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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<Activity className="text-primary" size={24} />}
            label="Total Visits"
            value={metrics.totalVisits}
          />
          <MetricCard
            icon={<Users className="text-green-600" size={24} />}
            label="Unique Visitors"
            value={metrics.uniqueVisitors}
          />
          <MetricCard
            icon={<UserCheck className="text-purple-600" size={24} />}
            label="Returning Visitors"
            value={metrics.returningVisitors}
          />
          <MetricCard
            icon={<TrendingUp className="text-warning" size={24} />}
            label="New Visitors"
            value={metrics.newVisitors}
          />
          <MetricCard
            icon={<Search className="text-red-600" size={24} />}
            label="Total Searches"
            value={metrics.totalSearches}
          />
          <MetricCard
            icon={<Eye className="text-indigo-600" size={24} />}
            label="Bounce Rate"
            value={`${metrics.bounceRate}%`}
            isPercentage
          />
          <MetricCard
            icon={<Activity className="text-cyan-600" size={24} />}
            label="Avg Session"
            value={`${metrics.avgSessionDuration}s`}
            isTime
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Traffic Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Traffic Trends</h3>
            <div className="flex gap-2 mb-4">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 rounded text-sm transition capitalize ${
                    chartPeriod === period
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pageViews" fill="#0369a1" name="Page Views" radius={[8, 8, 0, 0]} />
                <Bar dataKey="uniqueVisitors" fill="#16a34a" name="Unique Visitors" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visitor Growth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Visitor Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitorGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalVisitors" stroke="#0369a1" name="Total" dot={false} />
                <Line type="monotone" dataKey="returning" stroke="#16a34a" name="Returning" dot={false} />
                <Line type="monotone" dataKey="new" stroke="#dc2626" name="New" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search Analytics */}
        {searchAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Most Searched Keywords */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Searches</h3>
              <div className="space-y-3">
                {searchAnalytics.mostSearchedKeywords.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{item.keyword}</p>
                      <p className="text-sm text-gray-500">{item.avgResults} avg results</p>
                    </div>
                    <span className="text-lg font-bold text-primary">{item.searches}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* No Results Searches */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">No Results</h3>
              <div className="space-y-3">
                {searchAnalytics.noResultsSearches.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <p className="font-medium text-gray-900 truncate text-sm">{item.keyword}</p>
                    <span className="text-lg font-bold text-red-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Search Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Categories Searched</h3>
              <div className="space-y-3">
                {searchAnalytics.categorySearchTrends.slice(0, 5).map((item, idx) => {
                  const categoryLabel = typeof item.category === 'string' ? item.category : (item.category as any)?.labelKh || (item.category as any)?.name || 'Unknown';
                  return (
                    <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900 text-sm">{categoryLabel}</p>
                      <span className="text-lg font-bold text-primary">{item.searches}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Content */}
        {topContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Most Viewed Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Products</h3>
              <div className="space-y-2">
                {topContent.mostViewedProducts.slice(0, 5).map((product, idx) => (
                  <div key={product._id} className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-gray-500 w-6">{idx + 1}</span>
                      <span className="font-medium text-gray-900 truncate">{product.title}</span>
                    </span>
                    <span className="text-sm font-semibold text-primary">{product.views}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Sellers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Sellers</h3>
              <div className="space-y-2">
                {topContent.mostActiveSellers.slice(0, 5).map((seller, idx) => (
                  <div key={seller._id} className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-gray-500 w-6">{idx + 1}</span>
                      <span className="font-medium text-gray-900 truncate">{seller.displayName}</span>
                    </span>
                    <span className="text-sm font-semibold text-green-600">{seller.productViews}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-amber-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-background to-background border border-primary/30 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">{insight.title}</p>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              ))}
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
  value: number | string;
  isPercentage?: boolean;
  isTime?: boolean;
}

const MetricCard = ({ icon, label, value, isPercentage, isTime }: MetricCardProps) => (
  <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold text-gray-900">
      {typeof value === 'number' && !isPercentage && !isTime ? new Intl.NumberFormat('en-US').format(value) : value}
    </p>
  </div>
);

export default TrafficAnalyticsPage;


