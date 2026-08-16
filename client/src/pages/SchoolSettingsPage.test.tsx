import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SchoolSettingsPage from './SchoolSettingsPage';

const getSchoolSettingsMock = jest.fn();
const createSchoolSettingsMock = jest.fn();
const updateSchoolSettingsMock = jest.fn();
const deleteSchoolSettingsMock = jest.fn();
const listAcademicYearsMock = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'admin' }
  })
}));

jest.mock('../services/academicYear.api', () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYearsMock(...args)
}));

jest.mock('../services/schoolSettings.api', () => ({
  getSchoolSettings: () => getSchoolSettingsMock(),
  createSchoolSettings: (payload: unknown) => createSchoolSettingsMock(payload),
  updateSchoolSettings: (payload: unknown) => updateSchoolSettingsMock(payload),
  deleteSchoolSettings: () => deleteSchoolSettingsMock()
}));

const persistedSettings = {
  _id: 'settings-1',
  schoolName: 'Pilot School',
  logo: '',
  address: '',
  phone: '',
  email: '',
  currentAcademicYearId: null,
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'KHR'],
  exchangeRateUsdToKhr: 0,
  receiptPrefix: 'RCPT',
  nextReceiptNumber: 1,
  monthlyDueDay: 1,
  gracePeriodDays: 0,
  employeeRoles: ['teacher'],
  footerText: '',
  principalName: '',
  qrCodeEnabled: true,
  attendanceEnabled: true,
  attendanceQrEnabled: false,
  attendanceGpsEnabled: true,
  attendanceSchoolLatitude: 11.5564,
  attendanceSchoolLongitude: 104.9282,
  attendanceAllowedRadius: 120,
  attendanceStart: '06:30',
  attendanceEnd: '17:30'
};

const renderPage = () => render(
  <MemoryRouter>
    <SchoolSettingsPage />
  </MemoryRouter>
);

describe('SchoolSettingsPage attendance settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listAcademicYearsMock.mockResolvedValue({ data: { items: [] } });
    getSchoolSettingsMock.mockResolvedValue({ data: persistedSettings });
    updateSchoolSettingsMock.mockResolvedValue({ data: persistedSettings });
    createSchoolSettingsMock.mockResolvedValue({ data: persistedSettings });
  });

  it('loads persisted attendance settings into the form', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Attendance Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance Enabled')).toBeChecked();
    expect(screen.getByLabelText('Attendance QR Enabled')).not.toBeChecked();
    expect(screen.getByLabelText('Attendance GPS Enabled')).toBeChecked();
    expect(screen.getByLabelText(/School Latitude/)).toHaveValue(11.5564);
    expect(screen.getByLabelText(/School Longitude/)).toHaveValue(104.9282);
    expect(screen.getByLabelText(/Allowed Radius \(meters\)/)).toHaveValue(120);
    expect(screen.getByLabelText(/Attendance Start/)).toHaveValue('06:30');
    expect(screen.getByLabelText(/Attendance End/)).toHaveValue('17:30');
  });

  it('saves attendance settings in the existing settings payload', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Attendance Settings' });
    await waitFor(() => expect(screen.getByLabelText(/Allowed Radius \(meters\)/)).toHaveValue(120));

    fireEvent.click(screen.getByLabelText('Attendance Enabled'));
    fireEvent.change(screen.getByLabelText(/Allowed Radius \(meters\)/), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Attendance Start/), { target: { value: '07:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Settings' }));

    await waitFor(() => expect(updateSchoolSettingsMock).toHaveBeenCalled());
    const payload = updateSchoolSettingsMock.mock.calls[0][0];
    expect(payload.attendanceEnabled).toBe(false);
    expect(payload.attendanceQrEnabled).toBe(false);
    expect(payload.attendanceGpsEnabled).toBe(true);
    expect(payload.attendanceSchoolLatitude).toBe(11.5564);
    expect(payload.attendanceSchoolLongitude).toBe(104.9282);
    expect(payload.attendanceAllowedRadius).toBe(150);
    expect(payload.attendanceStart).toBe('07:00');
    expect(payload.attendanceEnd).toBe('17:30');
  });

  it('rejects an invalid time value before saving', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Attendance Settings' });
    await waitFor(() => expect(screen.getByLabelText(/Allowed Radius \(meters\)/)).toHaveValue(120));

    fireEvent.change(screen.getByLabelText(/Attendance Start/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Settings' }));

    expect(await screen.findByText('Use 24-hour HH:mm format.')).toBeInTheDocument();
    expect(updateSchoolSettingsMock).not.toHaveBeenCalled();
  });
});
