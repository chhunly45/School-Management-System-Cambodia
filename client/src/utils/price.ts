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
