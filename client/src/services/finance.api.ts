import api from './api';

export interface FinanceReportQuery {
  academicYear?: string;
  semester?: number;
  className?: string;
  status?: 'paid' | 'pending' | 'overdue';
  page?: number;
  perPage?: number;
}

export const getFinanceSummary = () => api.get('/finance/summary').then((r) => r.data);
export const getFinancePaymentsReport = (query: FinanceReportQuery = {}) =>
  api.get('/finance/payments-report', { params: query }).then((r) => r.data);
