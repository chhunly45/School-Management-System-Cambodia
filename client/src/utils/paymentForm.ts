import type { PaymentPlan, PaymentStatus } from '../services/payment.api';

export const getLivePaymentSummary = (
  tuitionAmount: number,
  discount: number,
  paidAmount: number,
  paymentPlan: PaymentPlan,
  paymentDate: string
) => {
  const safeTuitionAmount = Number(tuitionAmount || 0);
  const safeDiscount = Number(discount || 0);
  const safePaidAmount = Number(paidAmount || 0);

  const netAmount = Math.max(0, safePaidAmount - safeDiscount);
  const remainingBalance = Math.max(0, safeTuitionAmount - safeDiscount - safePaidAmount);

  const status: PaymentStatus = remainingBalance <= 0 ? 'paid' : 'pending';

  return {
    netAmount,
    remainingBalance,
    status,
    nextDueDate: getNextDueDate(paymentDate, paymentPlan)
  };
};

export const getNextDueDate = (paymentDate: string, paymentPlan: PaymentPlan) => {
  if (!paymentDate) return '';

  const parsedDate = new Date(`${paymentDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const nextDate = new Date(parsedDate);
  if (paymentPlan === 'quarterly') {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (paymentPlan === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
