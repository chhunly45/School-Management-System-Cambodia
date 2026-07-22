import React from 'react';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import PaymentReceipt, { type PrintableReceiptData } from '../components/receipts/PaymentReceipt';

describe('PaymentReceipt', () => {
  const basePayment = {
    receiptNumber: 'R-100',
    paymentDate: '2026-07-15',
    studentId: 'ST-001',
    studentName: 'Samnang',
    paymentPlan: 'monthly',
    billingPeriod: '2026-07',
    paymentPeriod: 'July 2026',
    studyShift: 'morning',
    tuitionAmount: 500,
    discount: 20,
    amount: 480,
    remainingBalance: 0,
    paymentMethod: 'cash'
  } as PrintableReceiptData;

  it('renders the legacy summary when no fee breakdown metadata exists', () => {
    render(<PaymentReceipt payment={basePayment} currencyFormatter={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })} />);

    expect(screen.getByText('Tuition Fee')).toBeInTheDocument();
    expect(screen.getByText('Paid Amount')).toBeInTheDocument();
  });

  it('renders fee breakdown rows when fee metadata exists', () => {
    render(
      <PaymentReceipt
        payment={{
          ...basePayment,
          feeEntries: [
            { id: 'tuition', label: 'Tuition', amount: 500, type: 'tuition' },
            { id: 'transport', label: 'Transport', amount: 50, type: 'transport' }
          ]
        }}
        currencyFormatter={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })}
      />
    );

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Tuition')).toBeInTheDocument();
  });

  it('renders billing period and study shift details when provided', () => {
    render(<PaymentReceipt payment={basePayment} currencyFormatter={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })} />);

    expect(screen.getByText('Billing Period:')).toBeInTheDocument();
    expect(screen.getByText('2026-07')).toBeInTheDocument();
    expect(screen.getByText('Study Shift:')).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Payment Period:')).toBeInTheDocument();
    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });
});
