import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getSchoolDashboardStats } from '../services/schoolDashboard.api';

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
  totalStudents: number;
  totalTeachers: number;
  totalPayments: number;
  attendanceRate: number;
  totalCertificates: number;
  totalTransport: number;
  recentPayments: RecentPayment[];
  recentStudents: RecentStudent[];
}

const defaultStats: SchoolDashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalPayments: 0,
  attendanceRate: 0,
  totalCertificates: 0,
  totalTransport: 0,
  recentPayments: [],
  recentStudents: []
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const SchoolDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SchoolDashboardStats>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      return;
    }

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        <h1 className="text-3xl font-semibold text-text-primary">School Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Overview of students, teachers, finance, attendance, and recent activities.</p>
      </header>

      {message && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">{message}</div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Active Students</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.totalStudents}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Active Teachers</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.totalTeachers}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Paid This Month</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{currency.format(stats.totalPayments)}</p>
        </article>
        <article className="rounded-3xl bg-white p-6 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Weekly Attendance</p>
          <p className="mt-2 text-3xl font-semibold text-text-primary">{stats.attendanceRate.toFixed(2)}%</p>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent Payments</h2>
            {loading && <span className="text-sm text-muted">Loading...</span>}
          </div>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted">No recent paid payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-muted text-left text-text-secondary">
                    <th className="py-2 pr-3">Receipt</th>
                    <th className="py-2 pr-3">Student</th>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment._id} className="border-b border-muted/70 text-text-primary">
                      <td className="py-2 pr-3">{payment.receiptNumber}</td>
                      <td className="py-2 pr-3">{payment.studentName}</td>
                      <td className="py-2 pr-3">{payment.className}</td>
                      <td className="py-2 pr-3">{currency.format(payment.amount)}</td>
                      <td className="py-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent Students</h2>
            {loading && <span className="text-sm text-muted">Loading...</span>}
          </div>
          {stats.recentStudents.length === 0 ? (
            <p className="text-sm text-muted">No recently registered students.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-muted text-left text-text-secondary">
                    <th className="py-2 pr-3">Student ID</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentStudents.map((student) => (
                    <tr key={student._id} className="border-b border-muted/70 text-text-primary">
                      <td className="py-2 pr-3">{student.studentId}</td>
                      <td className="py-2 pr-3">{student.fullName}</td>
                      <td className="py-2 pr-3">{student.className}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-2">{new Date(student.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SchoolDashboardPage;
