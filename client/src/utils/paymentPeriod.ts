export type StudyShift = 'morning' | 'afternoon' | 'evening';

export const STUDY_SHIFT_OPTIONS: Array<{ value: StudyShift; label: string }> = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' }
];

export const formatStudyShiftLabel = (value?: string | null) => {
  if (!value) return 'Morning';
  const normalized = String(value).toLowerCase();
  const option = STUDY_SHIFT_OPTIONS.find((item) => item.value === normalized);
  return option?.label || normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const derivePaymentPeriodLabel = (plan: string, year: number, month: number) => {
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long' });
  if (!plan || plan === 'monthly') return `${monthName} ${year}`;
  if (plan === 'quarterly') return `${monthName} ${year}`;
  if (plan === 'semi-annual') return `${monthName} ${year}`;
  if (plan === 'yearly') return `${year}`;
  return `${monthName} ${year}`;
};
