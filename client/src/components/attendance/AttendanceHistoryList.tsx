import { formatDateForDisplay, formatDateTimeForDisplay } from '../../utils/date';
import type { TeacherAttendanceRecord } from '../../services/teacherAttendance.api';
import AttendanceStatusBadge from './AttendanceStatusBadge';

interface AttendanceHistoryListProps {
  items: TeacherAttendanceRecord[];
}

const AttendanceHistoryList = ({ items }: AttendanceHistoryListProps) => {
  if (!items.length) {
    return <p className="rounded-2xl bg-background p-4 text-sm text-text-secondary">No attendance records found.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-muted bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">{formatDateForDisplay(item.attendanceDate)}</p>
              <AttendanceStatusBadge status={item.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div>
                <dt className="font-medium text-muted">Session</dt>
                <dd>{item.sessionType ? item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1) : 'Legacy'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Method</dt>
                <dd>{item.attendanceMethod}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Check-in</dt>
                <dd>{formatDateTimeForDisplay(item.checkInTime)}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Check-out</dt>
                <dd>{formatDateTimeForDisplay(item.checkOutTime)}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Distance</dt>
                <dd>{typeof item.distanceFromSchool === 'number' ? `${Math.round(item.distanceFromSchool)} m` : '-'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-muted text-left text-text-secondary">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Session</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Check-in</th>
              <th className="py-2 pr-3">Check-out</th>
              <th className="py-2 pr-3">Distance</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-b border-muted/70 text-text-primary">
                <td className="py-2 pr-3">{formatDateForDisplay(item.attendanceDate)}</td>
                <td className="py-2 pr-3">{item.sessionType ? item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1) : 'Legacy'}</td>
                <td className="py-2 pr-3"><AttendanceStatusBadge status={item.status} /></td>
                <td className="py-2 pr-3">{item.attendanceMethod}</td>
                <td className="py-2 pr-3">{formatDateTimeForDisplay(item.checkInTime)}</td>
                <td className="py-2 pr-3">{formatDateTimeForDisplay(item.checkOutTime)}</td>
                <td className="py-2 pr-3">{typeof item.distanceFromSchool === 'number' ? `${Math.round(item.distanceFromSchool)} m` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistoryList;
