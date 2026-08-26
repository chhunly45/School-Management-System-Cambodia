import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAttendanceQrPage from './AdminAttendanceQrPage';

const getAttendanceQrStateMock = jest.fn();
const generateAttendanceQrTokenMock = jest.fn();
const rotateAttendanceQrTokenMock = jest.fn();
const revokeAttendanceQrTokenMock = jest.fn();
const toDataUrlMock = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin'
    }
  })
}));

jest.mock('../services/attendanceQrAdmin.api', () => ({
  getAttendanceQrState: () => getAttendanceQrStateMock(),
  generateAttendanceQrToken: (payload: any) => generateAttendanceQrTokenMock(payload),
  rotateAttendanceQrToken: (payload: any) => rotateAttendanceQrTokenMock(payload),
  revokeAttendanceQrToken: () => revokeAttendanceQrTokenMock()
}));

jest.mock('qrcode', () => ({
  toDataURL: (...args: any[]) => toDataUrlMock(...args)
}));

jest.mock('lucide-react', () => ({
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
  });

  it('rotates the token using the selected validity', async () => {
    render(
      <MemoryRouter>
        <AdminAttendanceQrPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: /attendance qr control/i });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rotate qr/i })).not.toBeDisabled();
    });

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '600' } });
    fireEvent.click(screen.getByRole('button', { name: /rotate qr/i }));

    await waitFor(() => {
      expect(rotateAttendanceQrTokenMock).toHaveBeenCalledWith({ expiresInSeconds: 600, sessionType: 'morning' });
    });
  });
});