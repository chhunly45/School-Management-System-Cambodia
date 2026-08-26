import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  getTeacherAttendanceHistory,
  getTodayTeacherAttendance,
  type AttendanceStatus,
  type AttendanceSessionType,
  type TeacherAttendanceRecord,
  type TodayAttendanceState
} from '../services/teacherAttendance.api';
import { formatDateForDisplay, formatDateForInput, formatDateTimeForDisplay } from '../utils/date';
import AttendanceActionCard from '../components/attendance/AttendanceActionCard';
import AttendanceHistoryList from '../components/attendance/AttendanceHistoryList';
import AttendanceStatusBadge from '../components/attendance/AttendanceStatusBadge';
import QrScannerPanel, { type CameraStatus } from '../components/attendance/QrScannerPanel';
import LocationStatusPanel, { type CapturedLocation, type LocationStatus } from '../components/attendance/LocationStatusPanel';

const emptyTodayState: TodayAttendanceState = {
  attendance: null,
  canCheckIn: true,
  canCheckOut: false
};

const MAX_GPS_ACCURACY_METERS = 100;

const TeacherAttendancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayState, setTodayState] = useState<TodayAttendanceState>(emptyTodayState);
  const [historyItems, setHistoryItems] = useState<TeacherAttendanceRecord[]>([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'' | AttendanceStatus>('');
  const [fromDate, setFromDate] = useState(formatDateForInput(new Date()));
  const [toDate, setToDate] = useState(formatDateForInput(new Date()));
  const [qrToken, setQrToken] = useState('');
  const [sessionType, setSessionType] = useState<AttendanceSessionType>('morning');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<CapturedLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<LocationStatus>('Unavailable');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('Unavailable');
  const [remarks, setRemarks] = useState('');
  const [loadingToday, setLoadingToday] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);
  const [processingCheckOut, setProcessingCheckOut] = useState(false);
  const [message, setMessage] = useState('');

  const statusForBadge: AttendanceStatus | 'NOT_CHECKED_IN' = todayState.attendance?.status || 'NOT_CHECKED_IN';

  const attendanceStats = useMemo(() => {
    return historyItems.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === 'PRESENT') acc.present += 1;
        if (item.status === 'LATE') acc.late += 1;
        if (item.status === 'LEAVE') acc.leave += 1;
        if (item.status === 'ABSENT') acc.absent += 1;
        return acc;
      },
      { total: 0, present: 0, late: 0, leave: 0, absent: 0 }
    );
  }, [historyItems]);

  const attendanceSummaryLabel = useMemo(() => {
    if (processingCheckIn) return 'Checking In';
    if (processingCheckOut) return 'Checking Out';
    if (todayState.attendance?.status === 'PRESENT') return 'Present';
    if (todayState.attendance?.status === 'LATE') return 'Late';
    if (todayState.attendance?.checkOutTime) return 'Checked Out';
    if (todayState.attendance) return 'Checked In';
    return 'Not Checked In';
  }, [processingCheckIn, processingCheckOut, todayState.attendance]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    void Promise.all([loadTodayState(), loadHistory(1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const locationAccuracyValid =
    capturedLocation !== null &&
    Number.isFinite(capturedLocation.accuracy) &&
    capturedLocation.accuracy <= MAX_GPS_ACCURACY_METERS;

  const requireValidLocation = (): boolean => {
    if (!capturedLocation) {
      setMessage('Please capture your current location before submitting attendance.');
      return false;
    }

    if (!locationAccuracyValid) {
      setMessage(`GPS accuracy is too low. Please recapture location with <= ${MAX_GPS_ACCURACY_METERS} meters accuracy.`);
      return false;
    }

    return true;
  };

  const buildCommonPayload = () => ({
    latitude: capturedLocation?.latitude,
    longitude: capturedLocation?.longitude,
    gpsAccuracy: capturedLocation?.accuracy,
    remarks: remarks.trim() || undefined,
    device: 'web'
  });

  const loadTodayState = async () => {
    setLoadingToday(true);
    try {
      const response = await getTodayTeacherAttendance();
      setTodayState(response.data || emptyTodayState);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to load today attendance status.');
    } finally {
      setLoadingToday(false);
    }
  };

  const loadHistory = async (page: number) => {
    setLoadingHistory(true);
    try {
      const response = await getTeacherAttendanceHistory({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: historyStatusFilter || undefined,
        sessionType: sessionType,
        page,
        perPage: 10
      });
      const data = response.data;
      setHistoryItems(data?.items || []);
      setHistoryMeta(data?.meta || { page: 1, limit: 10, total: 0 });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to load attendance history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCheckIn = async () => {
    if (!requireValidLocation()) return;

    setProcessingCheckIn(true);
    try {
      await checkInTeacherAttendance({
        ...buildCommonPayload(),
        attendanceMethod: 'QR',
        qrToken: qrToken.trim() || undefined,
        sessionType
      });
      setMessage('Check-in successful.');
      setQrToken('');
      await Promise.all([loadTodayState(), loadHistory(1)]);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Check-in failed.');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!requireValidLocation()) return;

    setProcessingCheckOut(true);
    try {
      await checkOutTeacherAttendance({ ...buildCommonPayload(), sessionType });
      setMessage('Check-out successful.');
      await Promise.all([loadTodayState(), loadHistory(1)]);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Check-out failed.');
    } finally {
      setProcessingCheckOut(false);
    }
  };

  const handleFilterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadHistory(1);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-border sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0F766E]">Teacher Attendance</p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary sm:text-3xl">Today's Attendance</h1>
            <p className="mt-2 text-sm text-text-secondary">Scan your school QR code, confirm your location, and review your attendance history from one simple screen.</p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-secondary ring-1 ring-border">
            <p>Date: {formatDateForDisplay(new Date())}</p>
            <p className="mt-1">Status: <AttendanceStatusBadge status={statusForBadge} /></p>
          </div>
        </div>
      </header>

      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${/success|successful|ready|captured/i.test(message) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`} role="status" aria-live="polite">
          {message}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`rounded-3xl p-4 shadow ring-1 ring-border ${gpsStatus === 'Ready' ? 'bg-emerald-50' : gpsStatus === 'Low Accuracy' ? 'bg-amber-50' : gpsStatus === 'Permission Required' ? 'bg-amber-50' : 'bg-white'}`}>
          <p className="text-sm text-muted">GPS Status</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{gpsStatus}</p>
          <p className="mt-1 text-xs text-text-secondary">Location readiness for attendance check-in</p>
        </article>
        <article className={`rounded-3xl p-4 shadow ring-1 ring-border ${cameraStatus === 'Ready' ? 'bg-emerald-50' : cameraStatus === 'Permission Required' ? 'bg-amber-50' : 'bg-white'}`}>
          <p className="text-sm text-muted">Camera Status</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{cameraStatus}</p>
          <p className="mt-1 text-xs text-text-secondary">Camera access for QR scanning</p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow ring-1 ring-border">
          <p className="text-sm text-muted">Attendance</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{attendanceSummaryLabel}</p>
          <p className="mt-1 text-xs text-text-secondary">Current attendance state</p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow ring-1 ring-border">
          <p className="text-sm text-muted">History</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{attendanceStats.total}</p>
          <p className="mt-1 text-xs text-text-secondary">Records currently in view</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AttendanceActionCard
          title="Check-in Card"
          description="Use QR attendance entry and submit your location details if required by school policy."
          disabled={!todayState.canCheckIn || loadingToday}
          busy={processingCheckIn}
          actionLabel={todayState.canCheckIn ? 'Check In' : 'Already Checked In'}
          onAction={() => {
            void handleCheckIn();
          }}
        >
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setScannerOpen((current) => !current)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-muted bg-white px-4 py-3 text-sm font-semibold text-text-primary hover:bg-background"
              aria-label="Scan QR Code"
            >
              <QrCode className="h-4 w-4" />
              {scannerOpen ? 'Hide QR Scanner' : 'Scan QR Code'}
            </button>

            {scannerOpen && (
              <QrScannerPanel
                onDecodedToken={(payload) => {
                  setQrToken(payload.token);
                  if (payload.sessionType) setSessionType(payload.sessionType);
                  setMessage('QR code captured successfully. Ready for check-in.');
                }}
                onClose={() => setScannerOpen(false)}
                onStatusChange={setCameraStatus}
              />
            )}

            <label className="space-y-1 text-sm text-text-secondary">
              <span>Attendance session</span>
              <select value={sessionType} onChange={(event) => setSessionType(event.target.value as AttendanceSessionType)} className="w-full rounded-xl border border-muted px-4 py-3 text-text-primary">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </label>

            <label className="space-y-1 text-sm text-text-secondary">
              <span>QR Token</span>
              <input
                type="password"
                value={qrToken}
                onChange={(event) => setQrToken(event.target.value)}
                className="w-full rounded-xl border border-muted px-4 py-3 text-text-primary"
                placeholder="Secure QR token"
              />
            </label>
          </div>
        </AttendanceActionCard>

        <AttendanceActionCard
          title="Check-out Card"
          description="Submit check-out once your school day is complete."
          disabled={!todayState.canCheckOut || loadingToday}
          busy={processingCheckOut}
          actionLabel={todayState.canCheckOut ? 'Check Out' : 'Check-in Required'}
          onAction={() => {
            void handleCheckOut();
          }}
        >
          <div className="rounded-2xl bg-background p-4 text-sm text-text-secondary">
            <p>Check-in Time: {formatDateTimeForDisplay(todayState.attendance?.checkInTime)}</p>
            <p className="mt-1">Check-out Time: {formatDateTimeForDisplay(todayState.attendance?.checkOutTime)}</p>
          </div>
        </AttendanceActionCard>
      </section>

      <LocationStatusPanel
        value={capturedLocation}
        onChange={setCapturedLocation}
        maxAccuracyMeters={MAX_GPS_ACCURACY_METERS}
        onStatusChange={setGpsStatus}
        referenceLocation={
          typeof todayState.attendance?.latitude === 'number' && typeof todayState.attendance?.longitude === 'number'
            ? {
                latitude: todayState.attendance.latitude,
                longitude: todayState.attendance.longitude,
                label: 'last attendance point'
              }
            : null
        }
      />

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <h2 className="text-xl font-semibold text-text-primary">Attendance Status</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Current status: <AttendanceStatusBadge status={statusForBadge} />
        </p>
        <p className={`mt-2 text-sm ${locationAccuracyValid ? 'text-emerald-700' : 'text-rose-700'}`}>
          {locationAccuracyValid
            ? `Location accuracy validated (<= ${MAX_GPS_ACCURACY_METERS} m).`
            : `Location accuracy must be <= ${MAX_GPS_ACCURACY_METERS} m before check-in/check-out.`}
        </p>
        <label className="mt-3 block space-y-1 text-sm text-text-secondary">
          <span>Remarks</span>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-muted px-4 py-3 text-text-primary"
            placeholder="Optional remarks"
          />
        </label>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Attendance History</h2>
          {loadingHistory && <span className="text-sm text-muted">Loading history...</span>}
        </div>

        <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleFilterSubmit}>
          <label className="space-y-1 text-sm text-text-secondary">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-muted px-4 py-3 text-text-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-text-secondary">
            <span>To</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-muted px-4 py-3 text-text-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-text-secondary">
            <span>Status</span>
            <select
              value={historyStatusFilter}
              onChange={(event) => setHistoryStatusFilter(event.target.value as '' | AttendanceStatus)}
              className="w-full rounded-xl border border-muted px-4 py-3 text-text-primary"
            >
              <option value="">All</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <AttendanceHistoryList items={historyItems} />

        <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
          <span>
            Showing {historyItems.length} of {historyMeta.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadHistory(Math.max(historyMeta.page - 1, 1));
              }}
              disabled={historyMeta.page <= 1 || loadingHistory}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {historyMeta.page}</span>
            <button
              type="button"
              onClick={() => {
                void loadHistory(Math.min(historyMeta.page + 1, Math.max(1, Math.ceil(historyMeta.total / historyMeta.limit))));
              }}
              disabled={historyMeta.page >= Math.max(1, Math.ceil(historyMeta.total / historyMeta.limit)) || loadingHistory}
              className="rounded-full border border-muted px-3 py-1 font-semibold hover:bg-background disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherAttendancePage;
