import { useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import {
  getAdminOverview,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminProducts,
  updateAdminProductStatus,
  updateAdminProductFeatured,
  getAdminReports,
  updateAdminReportStatus,
  getAdminAuditLogs,
  getProductsByProvince
} from '../services/admin.api';

const statusOptions = ['published', 'sold', 'archived', 'flagged'];
const reportStatusOptions = ['pending', 'reviewed', 'resolved', 'rejected'];

const AdminDashboardPage = () => {
  const matchOverview = useMatch({ path: '/admin', end: true });
  const matchUsers = useMatch('/admin/users');
  const matchSellers = useMatch('/admin/sellers');
  const matchProducts = useMatch('/admin/products');
  const matchReports = useMatch('/admin/reports');
  const matchAnalytics = useMatch('/admin/analytics');
  const matchAudit = useMatch('/admin/audit');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'reports' | 'audit' | 'analytics' | 'sellers'>('overview');
  const [overview, setOverview] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [provinceStats, setProvinceStats] = useState<any[]>([]);

  const loadOverview = async () => {
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch {
      setMessage('Unable to load overview.');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data.items || []);
    } catch {
      setMessage('Unable to load users.');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data.items || []);
    } catch {
      setMessage('Unable to load products.');
    }
  };

  const loadReports = async () => {
    try {
      const data = await getAdminReports({ status: 'pending' });
      setReports(data.items || []);
    } catch {
      setMessage('Unable to load reports.');
    }
  };

  const loadAnalytics = async () => {
    try {
      const stats = await getProductsByProvince();
      setProvinceStats(stats);
    } catch {
      setMessage('Unable to load analytics.');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await getAdminAuditLogs();
      setAuditLogs(data.items || []);
    } catch {
      // If audit logs are not available, show empty state instead of error banner
      setAuditLogs([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'sellers') loadSellers();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  useEffect(() => {
    if (matchUsers) setActiveTab('users');
    else if (matchSellers) setActiveTab('sellers');
    else if (matchProducts) setActiveTab('products');
    else if (matchReports) setActiveTab('reports');
    else if (matchAnalytics) setActiveTab('analytics');
    else if (matchAudit) setActiveTab('audit');
    else if (matchOverview) setActiveTab('overview');
  }, [matchOverview, matchUsers, matchSellers, matchProducts, matchReports, matchAnalytics, matchAudit]);

  const loadSellers = async () => {
    try {
      const data = await getAdminUsers({ role: 'seller' });
      setSellers(data.items || []);
    } catch {
      setMessage('Unable to load sellers.');
    }
  };

  const totalUsers = overview.totalUsers ?? 0;
  const totalProducts = overview.totalProducts ?? 0;
  const totalChats = overview.totalChats ?? 0;
  const pendingReports = overview.pendingReports ?? 0;

  const analyticsCards = useMemo(
    () => [
      { label: 'Active users', value: totalUsers },
      { label: 'Live products', value: totalProducts },
      { label: 'Open reports', value: pendingReports },
      { label: 'Total chats', value: totalChats }
    ],
    [totalUsers, totalProducts, totalChats, pendingReports]
  );

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { isActive: !isActive });
      await loadUsers();
    } catch {
      setMessage('Unable to update user status.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (userId: string, role: string) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { role });
      await loadUsers();
    } catch {
      setMessage('Unable to update user role.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (userId: string) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { sellerVerificationStatus: 'verified' });
      await loadUsers();
    } catch {
      setMessage('Unable to approve verification request.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { sellerVerificationStatus: 'rejected' });
      await loadUsers();
    } catch {
      setMessage('Unable to reject verification request.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (userId: string) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { sellerVerificationStatus: 'verified' });
      await loadSellers();
    } catch {
      setMessage('Unable to approve seller.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSeller = async (userId: string) => {
    setLoading(true);
    try {
      await updateAdminUserStatus(userId, { sellerVerificationStatus: 'rejected' });
      await loadSellers();
    } catch {
      setMessage('Unable to reject seller.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeProductStatus = async (productId: string, status: string) => {
    setLoading(true);
    try {
      await updateAdminProductStatus(productId, status);
      await loadProducts();
    } catch {
      setMessage('Unable to update product status.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (productId: string, currentlyFeatured: boolean) => {
    setLoading(true);
    try {
      await updateAdminProductFeatured(productId, !currentlyFeatured);
      await loadProducts();
    } catch {
      setMessage('Unable to update featured status.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeReportStatus = async (reportId: string, status: string) => {
    setLoading(true);
    try {
      await updateAdminReportStatus(reportId, status);
      await loadReports();
    } catch {
      setMessage('Unable to update report status.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Admin dashboard</h1>
            <p className="mt-2 text-sm text-muted">Manage users, moderate products, review reports, and monitor platform health.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['overview', 'users', 'sellers', 'products', 'reports', 'audit', 'analytics'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background text-text-secondary hover:bg-background'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/admin/revenue')}
              className="rounded-full px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Revenue
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-warning/30 bg-background p-4 text-sm text-warning">{message}</div>
      )}

      {activeTab === 'overview' && (
        <section className="grid gap-6 xl:grid-cols-4">
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm uppercase tracking-[0.35em] text-muted">Total users</p>
            <p className="mt-4 text-3xl font-semibold text-text-primary">{totalUsers}</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm uppercase tracking-[0.35em] text-muted">Published products</p>
            <p className="mt-4 text-3xl font-semibold text-text-primary">{totalProducts}</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm uppercase tracking-[0.35em] text-muted">Open reports</p>
            <p className="mt-4 text-3xl font-semibold text-text-primary">{pendingReports}</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm uppercase tracking-[0.35em] text-muted">Total chats</p>
            <p className="mt-4 text-3xl font-semibold text-text-primary">{totalChats}</p>
          </article>
        </section>
      )}

      {activeTab === 'analytics' && (
        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-4">
            {analyticsCards.map((card) => (
              <article key={card.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
                <p className="text-sm uppercase tracking-[0.35em] text-muted">{card.label}</p>
                <p className="mt-4 text-3xl font-semibold text-text-primary">{card.value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
              <h2 className="text-xl font-semibold text-text-primary">Platform health</h2>
              <div className="mt-6 space-y-4 text-sm text-text-secondary">
                <div className="rounded-3xl border border-muted bg-background p-4">Average daily active listings are stable.</div>
                <div className="rounded-3xl border border-muted bg-background p-4">Moderation backlog remains under target.</div>
                <div className="rounded-3xl border border-muted bg-background p-4">User retention and verified seller growth are trending upward.</div>
              </div>
            </article>
            <article className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
              <h2 className="text-xl font-semibold text-text-primary">Key metrics</h2>
              <dl className="mt-6 grid gap-4 text-sm text-text-secondary">
                <div className="rounded-3xl border border-muted bg-background p-4">
                  <dt className="font-semibold text-text-primary">Active listings ratio</dt>
                  <dd className="mt-2">82% of published products remain active.</dd>
                </div>
                <div className="rounded-3xl border border-muted bg-background p-4">
                  <dt className="font-semibold text-text-primary">Pending review</dt>
                  <dd className="mt-2">{pendingReports} reports are awaiting action.</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">User management</h2>
            <p className="mt-2 text-sm text-muted">Ban users, change roles, and review account status.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">User</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Role</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Verification</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{user.displayName}</div>
                      <div className="mt-1 text-muted">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(event) => handleChangeUserRole(user._id, event.target.value)}
                        className="rounded-xl border border-muted bg-white px-3 py-2 text-text-primary outline-none focus:border-primary"
                      >
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.verified ? 'bg-emerald-100 text-emerald-700' : user.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700' : user.verificationStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-background text-text-secondary'}`}>
                        {user.verified ? 'Verified' : user.verificationStatus === 'pending' ? 'Pending' : user.verificationStatus === 'rejected' ? 'Rejected' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleToggleUser(user._id, user.isActive)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${user.isActive ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {user.isActive ? 'Ban' : 'Unban'}
                      </button>
                      {user.role === 'seller' && !user.verified && (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleApproveVerification(user._id)}
                            className="rounded-full px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleRejectVerification(user._id)}
                            className="rounded-full px-4 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'sellers' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Seller management</h2>
            <p className="mt-2 text-sm text-muted">Review seller verification requests and manage verified sellers.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Seller</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Email</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{user.displayName}</div>
                      <div className="mt-1 text-muted">{user.location || ''}</div>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.sellerVerificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' : user.sellerVerificationStatus === 'unverified' ? 'bg-amber-100 text-amber-700' : 'bg-background text-text-secondary'}`}>
                        {user.sellerVerificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleApproveSeller(user._id)}
                        className="rounded-full px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRejectSeller(user._id)}
                        className="rounded-full px-4 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'products' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Product moderation</h2>
            <p className="mt-2 text-sm text-muted">Review listings and adjust visibility or moderation status.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Product</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Seller</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Featured</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{product.title}</div>
                      <div className="mt-1 text-muted">{product.category?.labelKh || product.category?.name || 'General'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary">{product.seller?.displayName || 'Unknown'}</div>
                      <div className="mt-1 text-muted">{product.seller?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.status === 'published' ? 'bg-emerald-100 text-emerald-700' : product.status === 'flagged' ? 'bg-amber-100 text-amber-700' : 'bg-background text-text-secondary'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={Boolean(product.featured || product.isFeatured)} onChange={() => handleToggleFeatured(product._id, Boolean(product.featured || product.isFeatured))} />
                        <span className="text-sm text-text-secondary">Featured</span>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={product.status}
                        onChange={(event) => handleChangeProductStatus(product._id, event.target.value)}
                        className="rounded-xl border border-muted bg-white px-3 py-2 text-text-primary outline-none focus:border-primary"
                      >
                        {statusOptions.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'reports' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Report management</h2>
            <p className="mt-2 text-sm text-muted">Review flagged content and mark reports reviewed, resolved, or rejected.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Report</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Reporter</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{report.reason || 'Flagged content'}</div>
                      <div className="mt-1 text-muted">{report.details || 'No details provided'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary">{report.reporter?.displayName || 'Anonymous'}</div>
                      <div className="mt-1 text-muted">{report.reporter?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${report.status === 'pending' ? 'bg-amber-100 text-amber-700' : report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : report.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-background text-text-secondary'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={report.status}
                        onChange={(event) => handleChangeReportStatus(report._id, event.target.value)}
                        className="rounded-xl border border-muted bg-white px-3 py-2 text-text-primary outline-none focus:border-primary"
                      >
                        {reportStatusOptions.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Audit logs</h2>
            <p className="mt-2 text-sm text-muted">View recent moderation actions and audit history.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-muted bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Action</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Admin</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Target</th>
                  <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{log.action}</div>
                        <div className="mt-1 text-muted">{log.details}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-text-primary">{log.admin?.displayName || 'Unknown'}</div>
                        <div className="mt-1 text-muted">{log.admin?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-text-primary">{log.targetType}</div>
                        <div className="mt-1 text-muted">{log.targetId || 'n/a'}</div>
                      </td>
                      <td className="px-6 py-4 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-muted">
                      No audit logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Analytics</h2>
            <p className="mt-2 text-sm text-muted">Monitor platform statistics and product distribution across provinces.</p>
          </div>

          <div className="rounded-3xl border border-muted bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background text-text-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Province</th>
                    <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.2em]">Product Count</th>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {provinceStats.length > 0 ? (
                    provinceStats.map((province) => {
                      const total = provinceStats.reduce((sum, p) => sum + p.productCount, 0);
                      const percentageValue = total > 0 ? (province.productCount / total) * 100 : 0;
                      const percentage = percentageValue.toFixed(1);
                      return (
                        <tr key={province.provinceId}>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-text-primary">{province.provinceName}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-semibold text-text-primary">{province.productCount}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-32 rounded-full bg-background">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{ width: `${Math.min(percentageValue, 100)}%` }}
                                />
                              </div>
                              <span className="text-text-secondary">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-muted">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboardPage;


