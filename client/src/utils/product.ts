export const getProductCoverImageUrl = (product: any, fallback = '/no-image.png'): string => {
  if (!product) return fallback;

  const cover = product.coverImage;
  if (cover?.secureUrl) return cover.secureUrl;
  if (cover?.url) return cover.url;

  const firstImage = product.images?.[0];
  if (firstImage?.secureUrl) return firstImage.secureUrl;
  if (firstImage?.url) return firstImage.url;

  if (typeof product.imageUrl === 'string' && product.imageUrl) return product.imageUrl;

  return fallback;
};

export const getProductCoverImageId = (product: any): string | null => {
  if (!product) return null;
  return product.coverImage?._id || product.coverImage?.id || null;
};
