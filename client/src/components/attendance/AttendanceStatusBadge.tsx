import type { AttendanceStatus } from '../../services/teacherAttendance.api';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus | 'NOT_CHECKED_IN';
}

const baseClassName = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide';

const getStatusClassName = (status: AttendanceStatus | 'NOT_CHECKED_IN') => {
  if (status === 'PRESENT') return `${baseClassName} bg-emerald-100 text-emerald-800`;
  if (status === 'LATE') return `${baseClassName} bg-amber-100 text-amber-800`;
  if (status === 'ABSENT') return `${baseClassName} bg-rose-100 text-rose-800`;
  if (status === 'LEAVE') return `${baseClassName} bg-rose-100 text-rose-800`;
  return `${baseClassName} bg-slate-100 text-slate-700`;
};

const getStatusLabel = (status: AttendanceStatus | 'NOT_CHECKED_IN') => {
  if (status === 'NOT_CHECKED_IN') return 'Not Checked In';
  if (status === 'LEAVE') return 'Early Leave';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const AttendanceStatusBadge = ({ status }: AttendanceStatusBadgeProps) => {
  return <span className={getStatusClassName(status)}>{getStatusLabel(status)}</span>;
};

export default AttendanceStatusBadge;
