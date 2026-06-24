import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  studentName: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

const AttendancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 42,
    absent: 3,
    late: 2,
    excused: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('10A');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return;
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate, selectedClass]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await getAttendance(selectedDate, selectedClass);

      setAttendance([
        {
          _id: '1',
          studentName: 'Sokha Minh',
          studentId: 'S001',
          date: new Date(selectedDate),
          status: 'present',
          notes: ''
        },
        {
          _id: '2',
          studentName: 'Srey Nit',
          studentId: 'S002',
          date: new Date(selectedDate),
          status: 'present',
          notes: ''
        },
        {
          _id: '3',
          studentName: 'Pheap Dev',
          studentId: 'S003',
          date: new Date(selectedDate),
          status: 'absent',
          notes: 'Sick'
        },
        {
          _id: '4',
          studentName: 'Chan Rith',
          studentId: 'S004',
          date: new Date(selectedDate),
          status: 'late',
          notes: 'Traffic'
        }
      ]);
    } catch (err) {
      setMessage('Unable to load attendance data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      // TODO: Add API call to update status
      setAttendance(prev =>
        prev.map(record =>
          record._id === recordId ? { ...record, status: newStatus as any } : record
        )
      );
      setMessage('Attendance updated.');
    } catch (err) {
      setMessage('Failed to update attendance.');
    }
  };

  const handleMarkAll = async (status: 'present' | 'absent' | 'late') => {
    try {
      // TODO: Add API call to mark all
      setAttendance(prev => prev.map(record => ({ ...record, status })));
      setMessage(`All marked as ${status}.`);
    } catch (err) {
      setMessage('Failed to mark attendance.');
    }
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      // TODO: Add API call to save all attendance
      setMessage('Attendance saved successfully.');
    } catch (err) {
      setMessage('Failed to save attendance.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Attendance</h1>
        <p className="text-text-secondary">Track student attendance and generate reports</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Excused</p>
              <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 opacity-20" />
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

      {/* Date and Class Selection */}
      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-lg border border-muted px-4 py-2 outline-none focus:border-primary"
          >
            <option value="10A">10A</option>
            <option value="10B">10B</option>
            <option value="9A">9A</option>
            <option value="9B">9B</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAll('present')}
            className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-medium hover:opacity-90 transition"
            disabled={loading}
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="rounded-lg bg-red-600 px-4 py-2 text-white text-sm font-medium hover:opacity-90 transition"
            disabled={loading}
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-lg border border-muted">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : attendance.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  No attendance records found
                </td>
              </tr>
            ) : (
              attendance.map(record => (
                <tr key={record._id} className="border-t border-muted hover:bg-background transition">
                  <td className="px-4 py-3 font-medium">{record.studentName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{record.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record._id, e.target.value)}
                      className="rounded-lg border border-muted px-2 py-1 text-sm outline-none focus:border-primary"
                      disabled={loading}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAttendance}
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

export default AttendancePage;
