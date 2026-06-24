const { Favorite, Product } = require('../models');
const notificationService = require('./notification.service');

const getFavorites = async (userId) => {
  const favorites = await Favorite.find({ user: userId })
    .populate({
      path: 'product',
      populate: [
        { path: 'seller', select: 'displayName profileImageUrl location verified' },
        { path: 'category', select: 'name labelKh' },
        { path: 'images' }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

  return favorites.map((favorite) => favorite.product).filter(Boolean);
};

const getFavoriteIds = async (userId) => {
  const favorites = await Favorite.find({ user: userId }).select('product').lean();
  return favorites.map((favorite) => favorite.product.toString());
};

const getFavoritesCount = async (userId) => {
  return Favorite.countDocuments({ user: userId });
};

const checkFavorite = async (userId, productId) => {
  return Favorite.exists({ user: userId, product: productId });
};

const addFavorite = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'published') {
    const error = new Error('Product not available');
    error.statusCode = 404;
    throw error;
  }

  const already = await Favorite.findOne({ user: userId, product: productId });
  if (already) {
    return already;
  }

  const favorite = await Favorite.create({ user: userId, product: productId });

  if (product.seller && product.seller.toString() !== userId.toString()) {
    await notificationService.addNotification(product.seller, {
      type: 'favorite',
      title: 'New favorite',
      message: `Your listing ${product.title} was saved by a user.`,
      link: `/products/${product.slug}`
    });
  }

  return favorite;
};

const removeFavorite = async (userId, productId) => {
  await Favorite.deleteOne({ user: userId, product: productId });
};

module.exports = {
  getFavorites,
  getFavoriteIds,
  getFavoritesCount,
  checkFavorite,
  addFavorite,
  removeFavorite
};
