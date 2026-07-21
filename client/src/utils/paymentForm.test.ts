import { describe, expect, it } from '@jest/globals';
import { getTuitionAmountForPlan } from './paymentForm';

describe('getTuitionAmountForPlan', () => {
  it('multiplies a monthly base tuition for each supported payment plan', () => {
    expect(getTuitionAmountForPlan(500, 'monthly')).toBe(500);
    expect(getTuitionAmountForPlan(500, 'quarterly')).toBe(1500);
    expect(getTuitionAmountForPlan(500, 'semi-annual')).toBe(3000);
    expect(getTuitionAmountForPlan(500, 'yearly')).toBe(6000);
  });
});
