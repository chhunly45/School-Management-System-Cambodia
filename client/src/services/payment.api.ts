import api from './api';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'mobile_money';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'due_soon' | 'grace_period';
export type PaymentPlan = 'monthly' | 'quarterly' | 'semi-annual' | 'yearly';

export interface PaymentFeeEntryInput {
  id: string;
  label: string;
  amount: number;
  type: string;
  description?: string;
}

export interface PaymentListQuery {
  search?: string;
  studentId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentPlan;
  paymentPlan?: PaymentPlan;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  includeRelations?: boolean;
  academicYear?: string;
  semester?: number;
  page?: number;
  perPage?: number;
}

export interface PaymentPayload {
  receiptNumber?: string;
  studentId: string;
  studentName: string;
  className: string;
  studyShift?: 'morning' | 'afternoon' | 'evening';
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  paymentType?: PaymentPlan;
  paymentPlan?: PaymentPlan;
  tuitionAmount?: number;
  amount: number;
  discount?: number;
  remainingBalance?: number;
  dueDate?: string;
  monthlyDueDay?: number;
  quarterlyDueDates?: string[];
  yearlyDueDate?: string;
  billingPeriod?: string;
  paymentMonth?: number;
  paymentYear?: number;
  paymentPeriod?: string;
  gracePeriodDays?: number;
  cashier?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  academicYear?: string;
  semester?: 1 | 2;
  status: PaymentStatus;
  remarks?: string;
  feeEntries?: PaymentFeeEntryInput[];
}

export interface MonthlyPaymentSummaryQuery {
  year?: number;
  month?: number;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
}

export interface MonthlyPaymentSummary {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  totals: {
    totalPaid: number;
    totalDiscount: number;
    totalRemainingBalance: number;
    totalRecords: number;
  };
  byPlan: Array<{ plan: string; total: number; count: number }>;
  byStatus: Array<{ status: string; total: number; count: number }>;
  lifecycleSummary?: Record<string, number>;
}

export const listPayments = (query: PaymentListQuery = {}) => api.get('/payments', { params: query }).then((r) => r.data);

export const getPayment = (id: string, includeRelations = false) =>
  api.get(`/payments/${id}`, { params: { includeRelations } }).then((r) => r.data);

export const createPayment = (payload: PaymentPayload) => api.post('/payments', payload).then((r) => r.data);

export const updatePayment = (id: string, payload: PaymentPayload) => api.put(`/payments/${id}`, payload).then((r) => r.data);

export const deletePayment = (id: string) => api.delete(`/payments/${id}`).then((r) => r.data);

export const getMonthlyPaymentSummary = (query: MonthlyPaymentSummaryQuery = {}) =>
  api.get('/payments/summary/monthly', { params: query }).then((r) => r.data);
