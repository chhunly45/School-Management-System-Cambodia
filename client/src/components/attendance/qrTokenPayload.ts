export type AttendanceSessionType = 'morning' | 'afternoon' | 'evening';

export interface DecodedQrAttendancePayload {
  token: string;
  sessionType: AttendanceSessionType | null;
}

export const normalizeDecodedPayload = (rawValue: string): DecodedQrAttendancePayload | null => {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate =
        (typeof parsed.token === 'string' && parsed.token) ||
        (typeof parsed.qrToken === 'string' && parsed.qrToken) ||
        (typeof parsed.code === 'string' && parsed.code) ||
        '';
      const next = String(candidate).trim();
      if (!next) return null;
      const session = String(parsed.sessionType || '').trim().toLowerCase();
      return {
        token: next,
        sessionType: ['morning', 'afternoon', 'evening'].includes(session) ? session as AttendanceSessionType : null
      };
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const candidate =
        url.searchParams.get('token') ||
        url.searchParams.get('qrToken') ||
        url.searchParams.get('code') ||
        '';
      const next = candidate.trim();
      const session = String(url.searchParams.get('sessionType') || '').trim().toLowerCase();
      return next ? {
        token: next,
        sessionType: ['morning', 'afternoon', 'evening'].includes(session) ? session as AttendanceSessionType : null
      } : null;
    } catch {
      return null;
    }
  }

  if (!/^[A-Za-z0-9._\-+/=]+$/.test(trimmed)) {
    return null;
  }

  if (trimmed.length < 6) {
    return null;
  }

  return { token: trimmed, sessionType: null };
};

export const normalizeDecodedToken = (rawValue: string): string | null => normalizeDecodedPayload(rawValue)?.token || null;