import { normalizeDecodedToken } from './qrTokenPayload';

describe('normalizeDecodedToken', () => {
  it('accepts the admin QR JSON payload format', () => {
    expect(normalizeDecodedToken('{"token":"attqr_test_token_123"}')).toBe('attqr_test_token_123');
  });

  it('accepts a raw token string', () => {
    expect(normalizeDecodedToken('attqr_raw_token_123')).toBe('attqr_raw_token_123');
  });

  it('accepts a URL payload with a token query param', () => {
    expect(normalizeDecodedToken('https://sms-cam.test/attendance?token=attqr_url_token_123')).toBe('attqr_url_token_123');
  });

  it('rejects incompatible payload text', () => {
    expect(normalizeDecodedToken('@@@')).toBeNull();
  });
});