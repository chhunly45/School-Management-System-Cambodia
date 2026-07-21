import { describe, expect, it } from '@jest/globals';
import {
  createLegacyPaymentPayload,
  getPaymentEntrySections,
  getPaymentSummaryItems,
  type PaymentFeeEntry
} from '../utils/paymentFeeExtensions';

describe('payment fee extension helpers', () => {
  it('creates a backward-compatible payload from fee entries', () => {
    const entries: PaymentFeeEntry[] = [
      { id: 'tuition', label: 'Tuition', amount: 500, type: 'tuition' },
      { id: 'transport', label: 'Transport', amount: 50, type: 'transport' }
    ];

    const payload = createLegacyPaymentPayload({
      studentId: 'ST-001',
      studentName: 'Samnang',
      amount: 550,
      discount: 20,
      paymentDate: '2026-07-15',
      paymentMethod: 'cash',
      remarks: 'Mixed fees',
      feeEntries: entries
    });

    expect(payload).toMatchObject({
      studentId: 'ST-001',
      studentName: 'Samnang',
      amount: 550,
      discount: 20,
      paymentDate: '2026-07-15',
      paymentMethod: 'cash',
      remarks: 'Mixed fees',
      feeEntries: entries
    });
    expect(payload.paymentPlan).toBe('monthly');
    expect(payload.status).toBe('pending');
  });

  it('builds section metadata and summary items for future fee types', () => {
    const sections = getPaymentEntrySections();
    const summaryItems = getPaymentSummaryItems(500, 20, 480);

    expect(sections.some((section) => section.key === 'tuition')).toBe(true);
    expect(sections.some((section) => section.key === 'transport')).toBe(true);
    expect(summaryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Net Amount', value: '$480.00' }),
        expect.objectContaining({ label: 'Outstanding Balance', value: '$500.00' })
      ])
    );
  });
});
