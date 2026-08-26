import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, RefreshCw, ShieldAlert, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  generateAttendanceQrToken,
  getAttendanceQrState,
  revokeAttendanceQrToken,
  rotateAttendanceQrToken,
  type AttendanceQrAdminState,
  type AttendanceQrTokenView
} from '../services/attendanceQrAdmin.api';
import type { AttendanceSessionType } from '../services/teacherAttendance.api';

const defaultState: AttendanceQrAdminState = {
  current: null,
  recent: [],
  policy: {
    defaultExpiresInSeconds: 30
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const toDurationLabel = (seconds: number) => {
  if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`;
  if (seconds % 60 === 0) return `${seconds / 60} minute${seconds === 60 ? '' : 's'}`;
  return `${seconds} seconds`;
};

const statusClasses: Record<AttendanceQrTokenView['status'], string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REVOKED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-amber-200 bg-amber-50 text-amber-700'
};

const AdminAttendanceQrPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<AttendanceQrAdminState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState('30');
  const [sessionType, setSessionType] = useState<AttendanceSessionType>('morning');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/admin');
      return;
    }

    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const nextDefault = String(state.policy.defaultExpiresInSeconds || 30);
    setExpiresInSeconds((current) => current || nextDefault);
  }, [state.policy.defaultExpiresInSeconds]);

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      if (!state.current?.qrPayload) {
        setQrDataUrl('');
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(state.current.qrPayload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl('');
          setMessage('Unable to render QR image.');
        }
      }
    };

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [state.current?.qrPayload]);

  const durationValue = useMemo(() => {
    const value = Number(expiresInSeconds);
    return Number.isFinite(value) ? value : state.policy.defaultExpiresInSeconds;
  }, [expiresInSeconds, state.policy.defaultExpiresInSeconds]);

  const loadState = async () => {
    setLoading(true);
    try {
      const response = await getAttendanceQrState();
      setState(response.data || defaultState);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to load attendance QR state.');
    } finally {
      setLoading(false);
    }
  };

  const parseExpiryPayload = () => {
    const parsed = Number(expiresInSeconds);
    if (!Number.isInteger(parsed)) {
      return undefined;
    }
    return parsed;
  };

  const runMutation = async (action: 'generate' | 'rotate' | 'revoke') => {
    setSubmitting(true);
    try {
      const payload = { expiresInSeconds: parseExpiryPayload(), sessionType };
      const response =
        action === 'generate'
          ? await generateAttendanceQrToken(payload)
          : action === 'rotate'
            ? await rotateAttendanceQrToken(payload)
            : await revokeAttendanceQrToken();

      if (action === 'revoke') {
        setMessage('Attendance QR token revoked.');
      } else if (action === 'rotate') {
        setMessage('Attendance QR rotated successfully.');
      } else {
        setMessage('Attendance QR generated successfully.');
      }

      if (response?.data) {
        if (action === 'revoke') {
          await loadState();
        } else {
          setState((current) => ({
            current: response.data.current || null,
            recent: current.recent,
            policy: response.data.policy || current.policy
          }));
          await loadState();
        }
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || `Unable to ${action} attendance QR.`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentToken = state.current;

  return (
    <div className="space-y-6 print:space-y-4">
      <header className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border sm:p-8 print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0F766E]">Teacher Attendance QR</p>
            <h1 className="mt-2 text-3xl font-semibold text-text-primary">Attendance QR Control</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Generate, rotate, revoke, and print the live attendance QR used by teachers at the entrance checkpoint.
            </p>
          </div>
          <div className="rounded-3xl bg-background px-5 py-4 ring-1 ring-border">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Default Validity</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{toDurationLabel(state.policy.defaultExpiresInSeconds)}</p>
          </div>
        </div>
      </header>

      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${/successfully|revoked/i.test(message) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {message}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border print:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">Current QR</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">Live Entrance Token</h2>
            </div>
            {currentToken && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[currentToken.status]}`}>
                {currentToken.status}
              </span>
            )}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-muted bg-slate-50 p-5 print:border-slate-300 print:bg-white">
            {currentToken && qrDataUrl ? (
              <div className="space-y-4 text-center">
                <img src={qrDataUrl} alt="Attendance QR code" className="mx-auto w-full max-w-[320px] rounded-2xl bg-white p-3 ring-1 ring-border" />
                <div>
                  <p className="text-lg font-semibold text-text-primary">SMS-CAM Teacher Attendance</p>
                    <p className="mt-1 text-sm font-semibold text-[#0F766E]">Session: {currentToken.sessionType ? currentToken.sessionType.charAt(0).toUpperCase() + currentToken.sessionType.slice(1) : 'Legacy'}</p>
                  <p className="mt-1 text-sm text-text-secondary">Scan this QR, then submit GPS-confirmed check-in.</p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center text-text-secondary">
                <QrCode className="h-10 w-10" />
                <p className="text-sm font-medium">No active attendance QR token yet.</p>
                <p className="max-w-sm text-xs">Generate the first token to show a printable QR for the teacher entrance pilot.</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Created</p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{formatDateTime(currentToken?.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Expires</p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{formatDateTime(currentToken?.expiresAt)}</p>
            </div>
            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Rotation #</p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{currentToken?.rotationNumber ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Payload Format</p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{currentToken?.qrPayloadFormat || 'json-token-v1'}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-left text-xs text-slate-100">
            <p className="font-semibold uppercase tracking-[0.18em] text-slate-300">Raw Token</p>
            <p className="mt-2 break-all font-mono">{currentToken?.token || '—'}</p>
          </div>
        </article>

        <article className="space-y-4 rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border print:hidden">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">Actions</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">Manage Token Lifecycle</h2>
          </div>

          <label className="block space-y-2 text-sm text-text-secondary">
            <span>Validity in seconds</span>
            <input
              type="number"
              min={30}
              max={86400}
              step={30}
              value={expiresInSeconds}
              onChange={(event) => setExpiresInSeconds(event.target.value)}
              className="w-full rounded-2xl border border-muted px-4 py-3 text-text-primary"
            />
            <span className="block text-xs text-text-secondary">Current selection: {toDurationLabel(durationValue)}</span>
          </label>

          <label className="block space-y-2 text-sm text-text-secondary">
            <span>Attendance session</span>
            <select value={sessionType} onChange={(event) => setSessionType(event.target.value as AttendanceSessionType)} className="w-full rounded-2xl border border-muted px-4 py-3 text-text-primary">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={submitting || !!currentToken}
              onClick={() => {
                void runMutation('generate');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              <QrCode className="h-4 w-4" />
              Generate QR
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                void runMutation('rotate');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-muted bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-background disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Rotate QR
            </button>
            <button
              type="button"
              disabled={submitting || !currentToken}
              onClick={() => {
                void runMutation('revoke');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <ShieldAlert className="h-4 w-4" />
              Revoke QR
            </button>
            <button
              type="button"
              disabled={!currentToken || !qrDataUrl}
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-muted bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-background disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Print QR
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-background p-5 ring-1 ring-border">
            <p className="text-sm font-semibold text-text-primary">Operational Notes</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>The QR contains only the attendance token payload used by the existing scanner.</li>
              <li>Teacher GPS validation and attendance policy checks still happen server-side during check-in.</li>
              <li>Rotate to replace the live token immediately. Revoke to disable the current token without replacement.</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] bg-background p-5 ring-1 ring-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Recent Tokens</p>
                <p className="mt-1 text-xs text-text-secondary">Latest generated and revoked entries for quick audit.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {state.recent.length === 0 ? (
                <p className="text-sm text-text-secondary">No QR history yet.</p>
              ) : (
                state.recent.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs text-text-primary">{item.token}</p>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClasses[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
                      <p>Created: {formatDateTime(item.createdAt)}</p>
                      <p>Expires: {formatDateTime(item.expiresAt)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminAttendanceQrPage;