import api from './api';

export type ExpenseCategory =
  | 'salary'
  | 'fuel'
  | 'utilities'
  | 'maintenance'
  | 'office_supplies'
  | 'teaching_materials'
  | 'other';

export type ExpensePaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card'
  | 'mobile_payment'
  | 'check'
  | 'other';

export interface Expense {
  _id: string;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: ExpensePaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

export interface ExpensePayload {
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: ExpensePaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

export interface ExpenseListQuery {
  search?: string;
  category?: ExpenseCategory;
  paymentMethod?: ExpensePaymentMethod;
  currency?: string;
  expenseDate?: string;
  page?: number;
  perPage?: number;
}

export interface ExpenseListData {
  items: Expense[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const listExpenses = (query: ExpenseListQuery = {}) =>
  api.get<ApiResponse<ExpenseListData>>('/expenses', { params: query }).then((r) => r.data);

export const getExpense = (id: string) => api.get<ApiResponse<Expense>>(`/expenses/${id}`).then((r) => r.data);

export const createExpense = (payload: ExpensePayload) =>
  api.post<ApiResponse<Expense>>('/expenses', payload).then((r) => r.data);

export const updateExpense = (id: string, payload: ExpensePayload) =>
  api.put<ApiResponse<Expense>>(`/expenses/${id}`, payload).then((r) => r.data);

export const deleteExpense = (id: string) =>
  api.delete<ApiResponse<null>>(`/expenses/${id}`).then((r) => r.data);