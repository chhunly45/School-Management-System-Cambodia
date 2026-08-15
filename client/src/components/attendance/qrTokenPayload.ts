export const normalizeDecodedToken = (rawValue: string): string | null => {
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
      return next || null;
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
      return next || null;
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

  return trimmed;
};