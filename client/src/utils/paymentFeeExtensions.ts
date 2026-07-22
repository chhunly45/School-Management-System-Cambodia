import type { PaymentMethod, PaymentPlan, PaymentStatus } from '../services/payment.api';

export type FutureFeeType = 'tuition' | 'transport' | 'books' | 'registration' | 'uniform' | 'examination' | 'other';

export interface PaymentFeeEntry {
  id: string;
  label: string;
  amount: number;
  type: FutureFeeType;
  description?: string;
}

export interface LegacyPaymentPayloadLike {
  studentId: string;
  studentName: string;
  className?: string;
  amount: number;
  discount?: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  remarks?: string;
  paymentPlan?: PaymentPlan;
  status?: PaymentStatus;
  studyShift?: 'morning' | 'afternoon' | 'evening';
  feeEntries?: PaymentFeeEntry[];
}

export interface PaymentEntrySection {
  key: FutureFeeType;
  label: string;
  description: string;
}

export interface PaymentSummaryItem {
  label: string;
  value: string;
}

export const PAYMENT_ENTRY_SECTIONS: PaymentEntrySection[] = [
  { key: 'tuition', label: 'Tuition', description: 'Core tuition fee' },
  { key: 'transport', label: 'Transport', description: 'Future transport fee' },
  { key: 'books', label: 'Books', description: 'Future books fee' },
  { key: 'registration', label: 'Registration', description: 'Future registration fee' },
  { key: 'uniform', label: 'Uniform', description: 'Future uniform fee' },
  { key: 'examination', label: 'Examination', description: 'Future examination fee' },
  { key: 'other', label: 'Other', description: 'Additional fee' }
];

export const getPaymentEntrySections = (): PaymentEntrySection[] => PAYMENT_ENTRY_SECTIONS;

export const getPaymentSummaryItems = (tuitionAmount: number, discount: number, paidAmount: number): PaymentSummaryItem[] => {
  const netAmount = Math.max(0, Number(paidAmount || 0));
  const outstandingBalance = Math.max(0, Number(tuitionAmount || 0));

  return [
    { label: 'Net Amount', value: formatCurrency(netAmount) },
    { label: 'Outstanding Balance', value: formatCurrency(outstandingBalance) },
    { label: 'Discount', value: formatCurrency(Number(discount || 0)) }
  ];
};

export const createLegacyPaymentPayload = (input: LegacyPaymentPayloadLike) => ({
  studentId: input.studentId,
  studentName: input.studentName,
  className: input.className || '',
  amount: Number(input.amount || 0),
  discount: Number(input.discount || 0),
  paymentDate: input.paymentDate,
  paymentMethod: input.paymentMethod,
  remarks: input.remarks || '',
  paymentPlan: input.paymentPlan || 'monthly',
  status: input.status || 'pending',
  feeEntries: input.feeEntries || []
});

function formatCurrency(value: number): string {
  return `$${Number(value || 0).toFixed(2)}`;
}
