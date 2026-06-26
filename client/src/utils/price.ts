export const USD_TO_KHR_RATE = 4000;

const parsePrice = (price: number | string): number => {
  if (typeof price === 'number') return price;
  if (typeof price !== 'string') return 0;
  const trimmed = price.trim();
  if (trimmed.toUpperCase().startsWith('KHR') || trimmed.startsWith('៛')) {
    const cleaned = trimmed.replace(/[^0-9.-]/g, '');
    const value = Number(cleaned);
    return Number.isFinite(value) ? value / USD_TO_KHR_RATE : 0;
  }
  const cleaned = trimmed.replace(/[^0-9.-]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
};

export const formatPriceUSD = (price: number | string): string => {
  const amount = parsePrice(price);
  return `$${amount.toFixed(2)}`;
};

export const formatPriceKHR = (price: number | string): string => {
  const amount = parsePrice(price);
  const converted = amount * USD_TO_KHR_RATE;
  return `≈ KHR ${Math.round(converted).toLocaleString()}`;
};

export const getCurrencyFormatter = (currencyCode = 'USD', decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: currencyCode === 'KHR' ? 'code' : 'symbol',
    minimumFractionDigits: currencyCode === 'KHR' ? 0 : decimals,
    maximumFractionDigits: currencyCode === 'KHR' ? 0 : decimals
  });

export const formatAmount = (value: number | string, currencyCode = 'USD', decimals = 2): string => {
  const amount = typeof value === 'number' ? value : Number(value || 0);
  return getCurrencyFormatter(currencyCode, decimals).format(Number.isFinite(amount) ? amount : 0);
};
