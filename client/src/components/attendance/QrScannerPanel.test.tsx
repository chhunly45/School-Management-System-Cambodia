import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QrScannerPanel from './QrScannerPanel';
import { normalizeDecodedPayload, normalizeDecodedToken } from './qrTokenPayload';

const mockScanners: any[] = [];
let mockStartImplementation = async () => undefined;

jest.mock('qr-scanner', () => {
  class MockQrScanner {
    static WORKER_PATH = '';
    decodeHandler: (result: { data: string }) => Promise<void>;
    errorHandler: (error: unknown) => void;
    start = jest.fn(() => mockStartImplementation());
    stop = jest.fn().mockResolvedValue(undefined);
    destroy = jest.fn();

    constructor(_video: HTMLVideoElement, decodeHandler: (result: { data: string }) => Promise<void>, options: { onDecodeError: (error: unknown) => void }) {
      this.decodeHandler = decodeHandler;
      this.errorHandler = options.onDecodeError;
      mockScanners.push(this);
    }

    emitDecode(data: string) {
      return this.decodeHandler({ data });
    }

    emitError(error: unknown) {
      this.errorHandler(error);
    }
  }

  return { __esModule: true, default: MockQrScanner };
});

describe('normalizeDecodedToken', () => {
  it('accepts the admin QR JSON payload format', () => {
    expect(normalizeDecodedToken('{"token":"attqr_test_token_123"}')).toBe('attqr_test_token_123');
  });

  it('preserves session metadata from the admin QR JSON payload', () => {
    expect(normalizeDecodedPayload('{"token":"attqr_test_token_123","sessionType":"afternoon"}')).toEqual({
      token: 'attqr_test_token_123',
      sessionType: 'afternoon'
    });
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

describe('QrScannerPanel', () => {
  beforeEach(() => {
    mockScanners.length = 0;
    mockStartImplementation = async () => undefined;
  });

  it('starts scanning and reports ready status', async () => {
    const onStatusChange = jest.fn();
    const user = userEvent.setup();

    render(<QrScannerPanel onDecodedToken={jest.fn()} onStatusChange={onStatusChange} />);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start Camera Scan' }));
    });

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('Ready'));
    expect(screen.getByText(/Camera active/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scanning...' })).toBeDisabled();
  });

  it('reports permission failure when camera start is denied', async () => {
    const onStatusChange = jest.fn();
    const user = userEvent.setup();

    render(<QrScannerPanel onDecodedToken={jest.fn()} onStatusChange={onStatusChange} />);
    mockStartImplementation = async () => { throw new Error('Permission denied'); };
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start Camera Scan' }));
    });
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('Permission Required'));
    expect(screen.getByText(/Camera access is unavailable/i)).toBeInTheDocument();
  });

  it('handles invalid and valid decoded payloads', async () => {
    const onDecodedToken = jest.fn();
    const user = userEvent.setup();

    render(<QrScannerPanel onDecodedToken={onDecodedToken} />);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start Camera Scan' }));
    });

    await act(async () => {
      await mockScanners[0].emitDecode('@@@');
    });
    expect(screen.getByText(/token format is invalid/i)).toBeInTheDocument();
    expect(onDecodedToken).not.toHaveBeenCalled();

    await act(async () => {
      await mockScanners[0].emitDecode('{"token":"attqr_test","sessionType":"evening"}');
    });
    await waitFor(() => expect(onDecodedToken).toHaveBeenCalledWith({ token: 'attqr_test', sessionType: 'evening' }));
    expect(mockScanners[0].stop).toHaveBeenCalled();
    expect(mockScanners[0].destroy).toHaveBeenCalled();
  });

  it('reports scanner errors by error category', async () => {
    const onStatusChange = jest.fn();
    const user = userEvent.setup();

    render(<QrScannerPanel onDecodedToken={jest.fn()} onStatusChange={onStatusChange} />);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start Camera Scan' }));
    });
    await act(async () => {
      mockScanners[0].emitError(new Error('NotAllowedError'));
    });

    expect(onStatusChange).toHaveBeenCalledWith('Permission Required');
    await act(async () => {
      mockScanners[0].emitError(new Error('Camera disconnected'));
    });
    expect(onStatusChange).toHaveBeenCalledWith('Unavailable');
  });
});