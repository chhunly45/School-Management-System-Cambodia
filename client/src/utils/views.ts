export type ViewsCount = number | null | undefined;

// formatViewsCount: human-friendly compact formatting for view counts
// Examples: 999 -> "999", 1200 -> "1.2K", 15400 -> "15.4K", 1200000 -> "1.2M"
export const formatViewsCount = (count: ViewsCount): string => {
  const n = Number(count) || 0;
  if (n < 1000) return String(n);
  const abs = Math.abs(n);
  let value: number;
  let suffix = '';
  if (abs >= 1_000_000) {
    value = n / 1_000_000;
    suffix = 'M';
  } else {
    value = n / 1_000;
    suffix = 'K';
  }
  const rounded = Math.round(value * 10) / 10; // one decimal
  const text = String(rounded);
  const formatted = text.replace(/\.0$/, '');
  return `${formatted}${suffix}`;
};

export default formatViewsCount;
