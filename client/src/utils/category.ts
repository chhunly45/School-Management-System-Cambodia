export type ProductCategory = string | { name?: string | number; labelKh?: string | number } | null | undefined;

const normalizeCategoryValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
};

export const getCategoryLabel = (category?: ProductCategory, fallback = 'General'): string => {
  if (typeof category === 'string') {
    return category;
  }

  if (category && typeof category === 'object') {
    const label = normalizeCategoryValue((category as any).labelKh) || normalizeCategoryValue((category as any).name);
    if (label) {
      return label;
    }
  }

  return fallback;
};

export const getAbsoluteAssetUrl = (assetPath: string, fallbackOrigin = 'https://konpuk.com'): string => {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : fallbackOrigin;
  return `${origin}${assetPath}`;
};
