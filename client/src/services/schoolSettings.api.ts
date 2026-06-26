import api from './api';

export interface SchoolSettings {
  _id?: string;
  singletonKey?: string;
  schoolName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  currentAcademicYearId: string | { _id: string; code: string; name: string } | null;
  defaultCurrency: 'USD' | 'KHR';
  supportedCurrencies: Array<'USD' | 'KHR'>;
  exchangeRateUsdToKhr: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  monthlyDueDay: number;
  gracePeriodDays: number;
  employeeRoles: string[];
  footerText: string;
  principalName: string;
  qrCodeEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolSettingsPayload {
  schoolName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  currentAcademicYearId: string | null;
  defaultCurrency: 'USD' | 'KHR';
  supportedCurrencies: Array<'USD' | 'KHR'>;
  exchangeRateUsdToKhr: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  monthlyDueDay: number;
  gracePeriodDays: number;
  employeeRoles: string[];
  footerText: string;
  principalName: string;
  qrCodeEnabled: boolean;
}

export const getSchoolSettings = () => api.get('/school-settings').then((r) => r.data);

export const createSchoolSettings = (payload: SchoolSettingsPayload) => api.post('/school-settings', payload).then((r) => r.data);

export const updateSchoolSettings = (payload: SchoolSettingsPayload) => api.put('/school-settings', payload).then((r) => r.data);

export const deleteSchoolSettings = () => api.delete('/school-settings').then((r) => r.data);