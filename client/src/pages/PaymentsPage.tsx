import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { listPayments, createPayment, updatePayment, deletePayment } from '../services/payment.api';

interface Payment {
  _id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'mobile_money';
  academicYear: string;
  semester: 1 | 2;
  status: 'paid' | 'pending' | 'overdue';
  remarks: string;
}

const emptyPaymentForm: Payment = {
  _id: '',
  receiptNumber: '',
  studentId: '',
  studentName: '',
  className: '',
  amount: 0,
  paymentDate: '',
  paymentMethod: 'cash',
  academicYear: '',
  semester: 1,
  status: 'pending',
  remarks: ''
};

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formValues, setFormValues] = useState<Payment>(emptyPaymentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setAccessDenied(true);
      return;
    }
    loadPayments();
  }, [user, navigate]);

  const loadPayments = async (search = '', status = '') => {
    setLoading(true);
    try {
      const response = await listPayments({ search, status: status || undefined, perPage: 200 });
      const items = response.data?.items || [];
      setPayments(
        items.map((item: any) => ({
          ...item,
          paymentDate: item.paymentDate ? new Date(item.paymentDate).toISOString().slice(0, 10) : ''
        }))
      );
    } catch (err) {
      setMessage('Unable to load payments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadPayments(searchTerm, statusFilter);
  };

  const handleChange = (key: keyof Payment, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormValues(emptyPaymentForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (payment: Payment) => {
    setEditingId(payment._id);
    setFormValues(payment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      receiptNumber: formValues.receiptNumber,
      studentId: formValues.studentId,
      studentName: formValues.studentName,
      className: formValues.className,
      amount: parseFloat(formValues.amount.toString()),
      paymentDate: formValues.paymentDate,
      paymentMethod: formValues.paymentMethod,
      academicYear: formValues.academicYear,
      semester: parseInt(formValues.semester.toString()),
      status: formValues.status,
      remarks: formValues.remarks
    };

    try {
      if (editingId) {
        await updatePayment(editingId, payload);
        setMessage('Payment updated successfully.');
      } else {
        await createPayment(payload);
        setMessage('Payment created successfully.');
      }
      setFormValues(emptyPaymentForm);
      setEditingId(null);
      await loadPayments(searchTerm, statusFilter);
    } catch (err) {
      setMessage('Error saving payment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    setLoading(true);
    try {
      await deletePayment(id);
      setMessage('Payment deleted successfully.');
      await loadPayments(searchTerm, statusFilter);
    } catch (err) {
      setMessage('Error deleting payment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Payment Management</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">{editingId ? 'Edit Payment' : 'Add New Payment'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <input
              type="text"
              placeholder="Receipt Number *"
              value={formValues.receiptNumber}
              onChange={(e) => handleChange('receiptNumber', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <input
              type="text"
              placeholder="Student ID *"
              value={formValues.studentId}
              onChange={(e) => handleChange('studentId', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <input
              type="text"
              placeholder="Student Name *"
              value={formValues.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <input
              type="text"
              placeholder="Class Name *"
              value={formValues.className}
              onChange={(e) => handleChange('className', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <input
              type="number"
              placeholder="Amount *"
              step="0.01"
              min="0"
              value={formValues.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <input
              type="date"
              value={formValues.paymentDate}
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
            <select
              value={formValues.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value as any)}
              className="border border-gray-300 rounded px-4 py-2"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
            <input
              type="text"
              placeholder="Academic Year"
              value={formValues.academicYear}
              onChange={(e) => handleChange('academicYear', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
            />
            <select
              value={formValues.semester}
              onChange={(e) => handleChange('semester', parseInt(e.target.value))}
              className="border border-gray-300 rounded px-4 py-2"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
            <select
              value={formValues.status}
              onChange={(e) => handleChange('status', e.target.value as any)}
              className="border border-gray-300 rounded px-4 py-2"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <textarea
              placeholder="Remarks"
              value={formValues.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 md:col-span-2 lg:col-span-2"
            />
            <div className="md:col-span-2 lg:col-span-1 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by receipt, student ID, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-4 py-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleAdd}
            className="m-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            + Add Payment
          </button>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Receipt #</th>
                  <th className="text-left px-6 py-3 font-semibold">Student</th>
                  <th className="text-left px-6 py-3 font-semibold">Class</th>
                  <th className="text-right px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 font-semibold">Method</th>
                  <th className="text-left px-6 py-3 font-semibold">Year</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-center px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center px-6 py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center px-6 py-8 text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono">{payment.receiptNumber}</td>
                      <td className="px-6 py-3">{payment.studentName}</td>
                      <td className="px-6 py-3">{payment.className}</td>
                      <td className="px-6 py-3 text-right font-semibold">${payment.amount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">{payment.paymentDate}</td>
                      <td className="px-6 py-3 text-sm capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-6 py-3 text-sm">{payment.academicYear}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(payment._id)}
                          className="text-red-600 hover:text-red-900"
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
      </div>
    </div>
  );
};

export default PaymentsPage;
