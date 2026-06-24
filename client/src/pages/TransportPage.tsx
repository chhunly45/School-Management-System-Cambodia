import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  listTransport,
  createTransport,
  updateTransport,
  deleteTransport
} from '../services/transport.api';
import { listStudents } from '../services/student.api';

interface TransportRecord {
  _id: string;
  studentId: string;
  studentName: string;
  className: string;
  routeName: string;
  pickupPoint: string;
  dropoffPoint?: string;
  driverName?: string;
  vehicleNumber?: string;
  monthlyFee: number;
  status: 'active' | 'inactive';
  academicYear?: string;
  remarks?: string;
}

interface StudentOption {
  _id: string;
  studentId: string;
  fullName: string;
  className: string;
}

const emptyRecord: TransportRecord = {
  _id: '',
  studentId: '',
  studentName: '',
  className: '',
  routeName: '',
  pickupPoint: '',
  dropoffPoint: '',
  driverName: '',
  vehicleNumber: '',
  monthlyFee: 0,
  status: 'active',
  academicYear: '',
  remarks: ''
};

const TransportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<TransportRecord[]>([]);
  const [formValues, setFormValues] = useState<TransportRecord>(emptyRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadRecords();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadStudents = async () => {
    try {
      const response = await listStudents({ perPage: 500 });
      const items = response.data?.items || [];
      setStudents(
        items.map((item: any) => ({
          _id: item._id,
          studentId: item.studentId,
          fullName: item.fullName,
          className: item.className
        }))
      );
    } catch (err) {
      console.error(err);
      setMessage('Unable to load students.');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await listTransport({ search: searchTerm, perPage: 200 });
      const items = response.data?.items || [];
      setRecords(
        items.map((item: any) => ({
          ...item,
          studentId: typeof item.studentId === 'string' ? item.studentId : item.studentId?._id,
          monthlyFee: Number(item.monthlyFee || 0)
        }))
      );
    } catch (err) {
      setMessage('Unable to load transport records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof TransportRecord, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleStudentSelect = (selectedStudentId: string) => {
    const selectedStudent = students.find((student) => student._id === selectedStudentId);

    if (!selectedStudent) {
      setFormValues((prev) => ({ ...prev, studentId: '', studentName: '', className: '' }));
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      studentId: selectedStudent._id,
      studentName: selectedStudent.fullName,
      className: selectedStudent.className
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      studentId: formValues.studentId,
      studentName: formValues.studentName,
      className: formValues.className,
      routeName: formValues.routeName,
      pickupPoint: formValues.pickupPoint,
      dropoffPoint: formValues.dropoffPoint,
      driverName: formValues.driverName,
      vehicleNumber: formValues.vehicleNumber,
      monthlyFee: Number(formValues.monthlyFee || 0),
      status: formValues.status,
      academicYear: formValues.academicYear,
      remarks: formValues.remarks
    };

    try {
      if (editingId) {
        await updateTransport(editingId, payload);
        setMessage('Transport record updated successfully.');
      } else {
        await createTransport(payload);
        setMessage('Transport record created successfully.');
      }
      setEditingId(null);
      setFormValues(emptyRecord);
      await loadRecords();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save transport record.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: TransportRecord) => {
    setEditingId(record._id);
    setFormValues(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transport record?')) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteTransport(id);
      setMessage('Transport record deleted successfully.');
      await loadRecords();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete transport record.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadRecords();
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Transport Management</h1>
        <p className="text-text-secondary">Manage student transport records, routes, and assignments.</p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.toLowerCase().includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-muted bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={formValues.studentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="">-- Select Student --</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.fullName} ({student.studentId})
              </option>
            ))}
          </select>
          <input
            value={formValues.studentName}
            placeholder="Student Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled
          />
          <input
            value={formValues.className}
            placeholder="Class Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.routeName}
            onChange={(e) => handleInputChange('routeName', e.target.value)}
            placeholder="Route Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <input
            value={formValues.pickupPoint}
            onChange={(e) => handleInputChange('pickupPoint', e.target.value)}
            placeholder="Pickup Point"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          />
          <input
            value={formValues.dropoffPoint}
            onChange={(e) => handleInputChange('dropoffPoint', e.target.value)}
            placeholder="Dropoff Point"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            value={formValues.driverName}
            onChange={(e) => handleInputChange('driverName', e.target.value)}
            placeholder="Driver Name"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
          <input
            value={formValues.vehicleNumber}
            onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
            placeholder="Vehicle Number"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
          <input
            type="number"
            min={0}
            value={formValues.monthlyFee}
            onChange={(e) => handleInputChange('monthlyFee', Number(e.target.value))}
            placeholder="Monthly Fee"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={formValues.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            required
            disabled={loading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            value={formValues.academicYear}
            onChange={(e) => handleInputChange('academicYear', e.target.value)}
            placeholder="Academic Year"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
          <input
            value={formValues.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            placeholder="Remarks"
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {editingId ? 'Update Record' : 'Create Record'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyRecord);
            }}
            className="rounded-lg border border-muted px-6 py-2 hover:bg-background transition"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student, route, vehicle, or year..."
          className="flex-1 rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          disabled={loading}
        />
        <button
          type="submit"
          className="rounded-lg bg-secondary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          disabled={loading}
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-muted bg-white">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Route</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Pickup</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Fee</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-text-secondary">
                  No transport records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{record.studentName}</td>
                  <td className="px-4 py-3">{record.className}</td>
                  <td className="px-4 py-3">{record.routeName}</td>
                  <td className="px-4 py-3">{record.pickupPoint}</td>
                  <td className="px-4 py-3">{record.dropoffPoint || '-'}</td>
                  <td className="px-4 py-3">{record.driverName || '-'}</td>
                  <td className="px-4 py-3">{record.vehicleNumber || '-'}</td>
                  <td className="px-4 py-3">{record.monthlyFee}</td>
                  <td className="px-4 py-3">{record.academicYear || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-primary hover:underline text-sm font-medium"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="text-red-600 hover:underline text-sm font-medium"
                      disabled={loading}
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

export default TransportPage;
