const favoriteService = require('../services/favorite.service');

const listFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.getFavorites(req.user.id);
    res.json({ success: true, data: favorites });
  } catch (error) {
    next(error);
  }
};

const getFavoritesCount = async (req, res, next) => {
  try {
    const count = await favoriteService.getFavoritesCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

const checkFavorite = async (req, res, next) => {
  try {
    const isFavorite = await favoriteService.checkFavorite(req.user.id, req.params.productId);
    res.json({ success: true, data: { isFavorite: Boolean(isFavorite) } });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(req.user.id, req.params.productId);
    res.status(201).json({ success: true, data: { productId: favorite.product.toString() } });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user.id, req.params.productId);
    res.json({ success: true, data: { productId: req.params.productId } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFavorites,
  getFavoritesCount,
  checkFavorite,
  addFavorite,
  removeFavorite
};
