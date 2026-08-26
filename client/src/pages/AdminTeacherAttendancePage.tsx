import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getAdminTeacherAttendance, type AdminTeacherAttendanceResponse } from '../services/teacherAttendanceAdmin.api';
import type { AttendanceSessionType, AttendanceStatus } from '../services/teacherAttendance.api';
import AttendanceStatusBadge from '../components/attendance/AttendanceStatusBadge';
import { formatDateTimeForDisplay } from '../utils/date';

const sessions: Array<{ value: '' | AttendanceSessionType; label: string }> = [
  { value: '', label: 'All sessions' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' }
];

const AdminTeacherAttendancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminTeacherAttendanceResponse | null>(null);
  const [search, setSearch] = useState('');
  const [sessionType, setSessionType] = useState<'' | AttendanceSessionType>('');
  const [status, setStatus] = useState<'' | AttendanceStatus>('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const response = await getAdminTeacherAttendance({
        search: search || undefined,
        sessionType: sessionType || undefined,
        status: status || undefined,
        perPage: 100
      });
      setData(response.data);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to load teacher attendance.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/admin');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0F766E]">Teacher Attendance</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">Session Attendance</h1>
        <p className="mt-2 text-sm text-text-secondary">Review teacher attendance by session, check-in, check-out, and status.</p>
      </header>

      {message && <p role="status" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</p>}

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher" className="rounded-xl border border-muted px-4 py-3 text-text-primary" />
          <select value={sessionType} onChange={(event) => setSessionType(event.target.value as '' | AttendanceSessionType)} className="rounded-xl border border-muted px-4 py-3 text-text-primary">
            {sessions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as '' | AttendanceStatus)} className="rounded-xl border border-muted px-4 py-3 text-text-primary">
            <option value="">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="LEAVE">Early Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
          <button type="submit" className="rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white">Apply</button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead><tr className="border-b border-muted text-left text-text-secondary"><th className="py-3 pr-4">Teacher</th><th className="py-3 pr-4">Session</th><th className="py-3 pr-4">Check-in</th><th className="py-3 pr-4">Check-out</th><th className="py-3 pr-4">Status</th></tr></thead>
          <tbody>
            {(data?.items || []).map((item) => (
              <tr key={item._id} className="border-b border-muted/70 text-text-primary">
                <td className="py-3 pr-4">{typeof item.teacherId === 'string' ? item.teacherId : item.teacherId?.fullName || '-'}</td>
                <td className="py-3 pr-4">{item.sessionType ? item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1) : 'Legacy'}</td>
                <td className="py-3 pr-4">{formatDateTimeForDisplay(item.checkInTime)}</td>
                <td className="py-3 pr-4">{formatDateTimeForDisplay(item.checkOutTime)}</td>
                <td className="py-3 pr-4"><AttendanceStatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.items?.length && <p className="py-6 text-sm text-text-secondary">No teacher attendance records found.</p>}
      </section>
    </div>
  );
};

export default AdminTeacherAttendancePage;
