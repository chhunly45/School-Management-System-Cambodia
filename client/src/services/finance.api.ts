import api from './api';

export interface FinanceReportQuery {
  academicYear?: string;
  semester?: number;
  className?: string;
  status?: 'paid' | 'pending' | 'overdue';
  page?: number;
  perPage?: number;
}

export interface PaymentTrackingQuery {
  search?: string;
  session?: string;
  room?: string;
  plan?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export const getFinanceSummary = () => api.get('/finance/summary').then((r) => r.data);
export const getFinancePaymentsReport = (query: FinanceReportQuery = {}) =>
  api.get('/finance/payments-report', { params: query }).then((r) => r.data);
export const getPaymentTrackingReport = (query: PaymentTrackingQuery = {}) =>
  api.get('/finance/payment-tracking', { params: query }).then((r) => r.data);
