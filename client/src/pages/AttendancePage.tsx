import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { listAttendance, createAttendance, updateAttendance, deleteAttendance } from '../services/attendance.api';

interface AttendanceRecord {
  _id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  academicYear?: string;
  semester?: 1 | 2;
}

const emptyRecord: AttendanceRecord = {
  _id: '',
  studentId: '',
  studentName: '',
  className: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'present',
  remarks: '',
  academicYear: '',
  semester: 1
};

const AttendancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('10A');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [formValues, setFormValues] = useState<AttendanceRecord>(emptyRecord);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadAttendance();
  }, [user, selectedDate, selectedClass]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await listAttendance({ date: selectedDate, className: selectedClass, search: searchTerm, perPage: 200 });
      const items = res.data?.items || [];
      setAttendance(
        items.map((item: any) => ({
          ...item,
          date: item.date ? new Date(item.date).toISOString().slice(0, 10) : selectedDate
        }))
      );
    } catch (err) {
      setMessage('Unable to load attendance records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadAttendance();
  };

  const handleInputChange = (key: keyof AttendanceRecord, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const startCreate = () => {
    setEditingRecord(null);
    setFormValues({ ...emptyRecord, date: selectedDate, className: selectedClass });
    setMessage('');
  };

  const startEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormValues(record);
    setMessage('');
  };

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingRecord) {
        await updateAttendance(editingRecord._id, formValues);
        setMessage('Attendance updated successfully.');
      } else {
        await createAttendance(formValues);
        setMessage('Attendance created successfully.');
      }
      setEditingRecord(null);
      setFormValues({ ...emptyRecord, date: selectedDate, className: selectedClass });
      await loadAttendance();
    } catch (err: any) {
      const text = err?.response?.data?.message || 'Failed to save attendance.';
      setMessage(text);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeRecord = async (id: string) => {
    if (!window.confirm('Delete this attendance record?')) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteAttendance(id);
      setMessage('Attendance record deleted.');
      await loadAttendance();
    } catch (err: any) {
      const text = err?.response?.data?.message || 'Failed to delete record.';
      setMessage(text);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bulkMark = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance((prev) => prev.map((record) => ({ ...record, status })));
    setMessage(`Marked all as ${status}.`);
  };

  const statusClass = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Attendance Management</h1>
            <p className="text-sm text-gray-600">Record, search, edit, and delete attendance per student and class.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            New Attendance
          </button>
        </div>

        {message && (
          <div className={`rounded-lg p-4 ${message.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mark Attendance</h2>
            <form onSubmit={saveRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  value={formValues.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                <input
                  type="text"
                  value={formValues.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  value={formValues.className}
                  onChange={(e) => handleInputChange('className', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formValues.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <input
                    type="text"
                    value={formValues.academicYear || ''}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    value={formValues.semester}
                    onChange={(e) => handleInputChange('semester', Number(e.target.value) as any)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  value={formValues.remarks || ''}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </button>
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search & Filters</h2>
              <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Student, class, remarks"
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <input
                    type="text"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bulk Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => bulkMark('present')}
                  className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => bulkMark('absent')}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={() => bulkMark('late')}
                  className="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                >
                  Mark All Late
                </button>
                <button
                  type="button"
                  onClick={() => bulkMark('excused')}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Mark All Excused
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Attendance Records</h2>
            <p className="text-sm text-gray-500">Showing {attendance.length} records for {selectedClass} on {selectedDate}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Remarks</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No records found.</td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{record.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.className}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.remarks || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(record)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecord(record._id)}
                          className="text-red-600 hover:text-red-800"
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

export default AttendancePage;
