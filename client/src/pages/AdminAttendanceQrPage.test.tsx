import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAttendanceQrPage from './AdminAttendanceQrPage';

const getAttendanceQrStateMock = jest.fn();
const generateAttendanceQrTokenMock = jest.fn();
const rotateAttendanceQrTokenMock = jest.fn();
const revokeAttendanceQrTokenMock = jest.fn();
const toDataUrlMock = jest.fn();
const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin'
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: adminUser
  })
}));

jest.mock('../services/attendanceQrAdmin.api', () => ({
  getAttendanceQrState: (sessionType?: string) => getAttendanceQrStateMock(sessionType),
  generateAttendanceQrToken: (payload: any) => generateAttendanceQrTokenMock(payload),
  rotateAttendanceQrToken: (payload: any) => rotateAttendanceQrTokenMock(payload),
  revokeAttendanceQrToken: () => revokeAttendanceQrTokenMock()
}));

jest.mock('qrcode', () => ({
  toDataURL: (...args: any[]) => toDataUrlMock(...args)
}));

jest.mock('lucide-react', () => ({
  Download: () => <svg aria-label="download-icon" />,
  QrCode: () => <svg aria-label="qr-icon" />,
  RefreshCw: () => <svg aria-label="refresh-icon" />,
  ShieldAlert: () => <svg aria-label="shield-icon" />,
  Printer: () => <svg aria-label="printer-icon" />
}));

const activeToken = {
  id: 'qr-1',
  token: 'attqr_active_token_123',
  rotationNumber: 7,
  createdAt: '2026-08-13T10:00:00.000Z',
  expiresAt: '2026-08-13T10:05:00.000Z',
  isRevoked: false,
  revokedAt: null,
  createdBy: 'admin-1',
  status: 'ACTIVE',
  qrPayloadFormat: 'json-token-v1',
  qrPayload: '{"token":"attqr_active_token_123"}'
};

describe('AdminAttendanceQrPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toDataUrlMock.mockResolvedValue('data:image/png;base64,qr');
    getAttendanceQrStateMock.mockResolvedValue({
      success: true,
      data: {
        current: activeToken,
        recent: [activeToken],
        policy: { defaultExpiresInSeconds: 300 }
      }
    });
    generateAttendanceQrTokenMock.mockResolvedValue({ success: true, data: { current: activeToken, policy: { defaultExpiresInSeconds: 300 } } });
    rotateAttendanceQrTokenMock.mockResolvedValue({ success: true, data: { current: activeToken, policy: { defaultExpiresInSeconds: 300 } } });
    revokeAttendanceQrTokenMock.mockResolvedValue({ success: true, data: { revoked: { ...activeToken, status: 'REVOKED' } } });
  });

  it('loads and renders the current attendance QR', async () => {
    render(
      <MemoryRouter>
        <AdminAttendanceQrPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getAttendanceQrStateMock).toHaveBeenCalled();
    });

    expect(await screen.findByRole('heading', { name: /attendance qr control/i })).toBeInTheDocument();
    expect(await screen.findByAltText(/attendance qr code/i)).toBeInTheDocument();
    expect(screen.getAllByText(/attqr_active_token_123/i)).toHaveLength(2);
    expect(getAttendanceQrStateMock).toHaveBeenCalledWith('morning');
  });

  it('rotates the selected daily attendance session', async () => {
    render(
      <MemoryRouter>
        <AdminAttendanceQrPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: /attendance qr control/i });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rotate qr/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /rotate qr/i }));

    await waitFor(() => {
      expect(rotateAttendanceQrTokenMock).toHaveBeenCalledWith({ sessionType: 'morning' });
    });
  });

  it('exposes the rendered QR as a downloadable PNG', async () => {
    render(
      <MemoryRouter>
        <AdminAttendanceQrPage />
      </MemoryRouter>
    );

    const download = await screen.findByRole('link', { name: /download qr image/i });
    expect(download).toHaveAttribute('download', 'smscam-teacher-attendance-morning-daily.png');
    expect(download).toHaveAttribute('href', 'data:image/png;base64,qr');
  });

  it('ignores a stale current-QR response after a newer QR is generated', async () => {
    let resolveInitialLoad: ((value: any) => void) | undefined;
    let loadCallCount = 0;
    const generatedToken = {
      ...activeToken,
      token: 'attqr_generated_token_456',
      qrPayload: '{"token":"attqr_generated_token_456"}'
    };
    getAttendanceQrStateMock.mockImplementation(() => {
      loadCallCount += 1;
      if (loadCallCount === 1) {
        return new Promise((resolve) => {
        resolveInitialLoad = resolve;
        });
      }
      return Promise.resolve({
        success: true,
        data: {
          current: generatedToken,
          recent: [generatedToken],
          policy: { defaultExpiresInSeconds: 21600 }
        }
      });
    });
    generateAttendanceQrTokenMock.mockResolvedValue({
      success: true,
      data: { current: generatedToken, policy: { defaultExpiresInSeconds: 21600 } }
    });

    render(
      <MemoryRouter>
        <AdminAttendanceQrPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getAttendanceQrStateMock).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));

    expect(await screen.findByAltText(/attendance qr code/i)).toBeInTheDocument();
    expect(screen.getAllByText(/attqr_generated_token_456/i).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(getAttendanceQrStateMock).toHaveBeenCalledTimes(2);
    });

    resolveInitialLoad?.({ success: true, data: { current: null, recent: [], policy: { defaultExpiresInSeconds: 21600 } } });

    await waitFor(() => {
      expect(screen.getAllByText(/attqr_generated_token_456/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/no active attendance qr token yet/i)).not.toBeInTheDocument();
    });
  });
});