# Phase 1 Code Preview - File Templates

This document shows the EXACT code structure for each file that will be generated.

---

## 📝 FILE STRUCTURE TEMPLATES

### StudentsPage.tsx (PATTERN: Data Management)

```typescript
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gradeLevel: string;
  enrollmentStatus: 'active' | 'inactive' | 'graduated';
  dateEnrolled: Date;
  parentName?: string;
  parentPhone?: string;
}

const StudentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await getStudents();
      // setStudents(res.data || []);
      
      // Mock data for now
      setStudents([
        {
          _id: '1',
          name: 'Sokha Minh',
          email: 'sokha@school.edu',
          phone: '855123456789',
          gradeLevel: '10',
          enrollmentStatus: 'active',
          dateEnrolled: new Date('2024-01-15'),
          parentName: 'Sokha Panha',
          parentPhone: '855987654321'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load students.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // TODO: Add API call for save/update
      setEditing(null);
      await loadStudents();
      setMessage('Student saved successfully.');
    } catch (err) {
      setMessage('Failed to save student.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student record?')) return;
    setLoading(true);
    try {
      // TODO: Add API call for delete
      await loadStudents();
      setMessage('Student deleted successfully.');
    } catch (err) {
      setMessage('Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Students</h1>
        <p className="text-text-secondary">Manage student records and enrollment</p>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${message.includes('success') ? 'bg-green-50' : 'bg-red-50'}`}>
          {message}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-muted px-4 py-2"
        />
        <button
          onClick={() => setEditing({} as Student)}
          className="rounded-lg bg-primary px-6 py-2 text-white font-medium"
        >
          Add Student
        </button>
      </div>

      {/* Form for adding/editing */}
      {editing && (
        <form onSubmit={handleSave} className="rounded-lg border border-muted bg-white p-6">
          <h3 className="text-xl font-semibold mb-4">
            {editing._id ? 'Edit Student' : 'Add New Student'}
          </h3>
          {/* Form fields will be added here */}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-muted px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Students Table */}
      <div className="overflow-x-auto rounded-lg border border-muted">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No students found</td></tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student._id} className="border-t border-muted">
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">Grade {student.gradeLevel}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.enrollmentStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(student)}
                      className="text-primary hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsPage;
```

**Size: ~350 lines | Pattern: List + Form | Reusable: 70% from AdminBannersPage**

---

### PaymentsPage.tsx (PATTERN: Metrics + List)

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Check, Clock } from 'lucide-react';

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
          paymentDate: new Date(),
          status: 'received',
          paymentMethod: 'online',
          reference: 'TXN20240101'
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
        <div className="rounded-lg border border-muted bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Amount</p>
              <p className="text-2xl font-bold text-text-primary">{metrics.totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Received</p>
              <p className="text-2xl font-bold text-green-600">{metrics.receivedAmount.toLocaleString()}</p>
            </div>
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics.pendingAmount.toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Failed</p>
              <p className="text-2xl font-bold text-red-600">{metrics.failedAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${message.includes('success') ? 'bg-green-50' : 'bg-red-50'}`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-muted px-4 py-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-muted px-4 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-muted px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="failed">Failed</option>
        </select>
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
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">Loading...</td></tr>
            ) : filteredPayments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No payments found</td></tr>
            ) : (
              filteredPayments.map(payment => (
                <tr key={payment._id} className="border-t border-muted">
                  <td className="px-4 py-3">{payment.studentName}</td>
                  <td className="px-4 py-3">{payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payment.status === 'received' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-primary hover:underline">View</button>
                  </td>
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
```

**Size: ~350 lines | Pattern: Metrics + List | Reusable: 65% from AdminRevenuePage**

---

### AttendancePage.tsx (PATTERN: Calendar-based)

**Similar structure with:**
- Date picker and class selector
- Attendance stats (Present/Absent/Late)
- Daily attendance marking table
- Bulk operations

**Size: ~320 lines | Pattern: Calendar-based | Reusable: 60%**

---

### AcademicPage.tsx (PATTERN: Tabs + Multiple Views)

**Structure:**
- Tab navigation (Programs / Subjects / Schedules)
- Per-tab content with forms and lists
- Add/Edit/Delete operations per section

**Size: ~380 lines | Pattern: Tabs | Reusable: 65% from AdminDashboardPage**

---

### CertificatesPage.tsx (PATTERN: Form + List)

**Structure:**
- Certificate generation form at top
- Certificate template selector
- List of issued certificates below
- Download/Print/Delete actions

**Size: ~330 lines | Pattern: Form + List | Reusable: 70% from AdminBannersPage**

---

### FinancePage.tsx (PATTERN: Metrics + Charts)

**Structure:**
- Financial metrics cards (Total, Income, Expense, Balance)
- Chart selector (Daily/Weekly/Monthly)
- Chart visualization
- Transaction list table below

**Size: ~400 lines | Pattern: Metrics + Charts | Reusable: 65% from AdminRevenuePage**

---

### TransportPage.tsx (PATTERN: Tabs + List)

**Structure:**
- Tab navigation (Routes / Vehicles / Assignments)
- Route creation and management form
- Vehicle list and management
- Student assignment to routes

**Size: ~360 lines | Pattern: Tabs | Reusable: 60%**

---

## 🔧 Modified Files

### AdminLayout.tsx - Changes

**BEFORE:**
```typescript
const navItems = [
  { label: 'Dashboard', to: '/admin', icon: Home },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Sellers', to: '/admin/sellers', icon: Users },
  { label: 'Products', to: '/admin/products', icon: ShoppingBag },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Verifications', to: '/admin/verification', icon: ShieldCheck },
  { label: 'Revenue', to: '/admin/revenue', icon: TrendingUp },
  { label: 'Traffic', to: '/admin/traffic', icon: Activity },
  { label: 'Promotions', to: '/admin/promotions', icon: TrendingUp },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Audit', to: '/admin/audit', icon: ShieldCheck }
];
```

**AFTER:**
```typescript
import { BookOpen, Bus, Award } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: Home },
  { label: 'Students', to: '/admin/students', icon: Users },
  { label: 'Payments', to: '/admin/payments', icon: ShoppingBag },
  { label: 'Attendance', to: '/admin/attendance', icon: CheckCircle },
  { label: 'Academic', to: '/admin/academic', icon: BookOpen },
  { label: 'Certificates', to: '/admin/certificates', icon: Award },
  { label: 'Finance', to: '/admin/finance', icon: TrendingUp },
  { label: 'Transport', to: '/admin/transport', icon: Bus }
];
```

**Header Changes:**
```typescript
// Line 1 - section title
<p className="text-sm font-semibold uppercase tracking-[0.35em] text-text-secondary">School Admin</p>

// Line 2 - heading
<h2 className="mt-3 text-2xl font-semibold text-text-primary">Manage School</h2>
```

**Changes Summary:**
- Import 3 new icons (BookOpen, Bus, Award, CheckCircle)
- Replace 11 nav items with 8 school-focused items
- Update 2 text labels
- Keep all styling, logic, and layout identical

**Total Changes: ~10 lines | Impact: Navigation only**

---

### AppRoutes.tsx - Changes

**IMPORTS to add:**
```typescript
import StudentsPage from '../pages/StudentsPage';
import PaymentsPage from '../pages/PaymentsPage';
import AttendancePage from '../pages/AttendancePage';
import AcademicPage from '../pages/AcademicPage';
import CertificatesPage from '../pages/CertificatesPage';
import FinancePage from '../pages/FinancePage';
import TransportPage from '../pages/TransportPage';
```

**ROUTES to add (inside AdminLayout):**
```typescript
<Route path="students" element={<StudentsPage />} />
<Route path="payments" element={<PaymentsPage />} />
<Route path="attendance" element={<AttendancePage />} />
<Route path="academic" element={<AcademicPage />} />
<Route path="certificates" element={<CertificatesPage />} />
<Route path="finance" element={<FinancePage />} />
<Route path="transport" element={<TransportPage />} />
```

**Total Changes: ~35 lines | Impact: Routing only**

---

## 📊 Summary

| File | Lines | Type | % Reuse |
|------|-------|------|---------|
| StudentsPage.tsx | 350 | NEW | 70% |
| PaymentsPage.tsx | 350 | NEW | 65% |
| AttendancePage.tsx | 320 | NEW | 60% |
| AcademicPage.tsx | 380 | NEW | 65% |
| CertificatesPage.tsx | 330 | NEW | 70% |
| FinancePage.tsx | 400 | NEW | 65% |
| TransportPage.tsx | 360 | NEW | 60% |
| AdminLayout.tsx | 10 | MODIFY | 99% |
| AppRoutes.tsx | 35 | MODIFY | 98% |
| **TOTAL** | **2,535 lines** | — | **~66% avg** |

---

## ✅ Code Quality Standards

✓ TypeScript throughout (not JavaScript)
✓ React hooks (useState, useEffect)
✓ Error handling with try/catch
✓ Loading states
✓ User feedback messages
✓ Authentication checks
✓ Consistent styling with Tailwind
✓ lucide-react icons
✓ Mock data for testing
✓ Comments for TODO API integration
✓ Responsive design (md breakpoints)
✓ Accessible HTML structure

---

**Ready to generate all code!** 🚀
