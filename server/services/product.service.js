const { Product, Category, User, Image } = require('../models');
const mongoose = require('mongoose');
const notificationService = require('./notification.service');

const sellerPopulateFields = 'displayName profileImageUrl avatar email phoneNumber sellerVerificationStatus';

const findFallbackSeller = async (product) => {
  const fallbackUserId = product.createdBy || product.user;
  if (fallbackUserId) {
    const fallbackUser = await User.findById(fallbackUserId).select(sellerPopulateFields).lean();
    if (fallbackUser) return fallbackUser;
  }

  const image = await Image.findOne({ product: product._id }).sort({ sortOrder: 1 }).select('uploadedBy').lean();
  if (image?.uploadedBy) {
    const uploader = await User.findById(image.uploadedBy).select(sellerPopulateFields).lean();
    if (uploader) return uploader;
  }

  return null;
};

const listProducts = async (filters) => {
  const query = { status: 'published' };
  const locationFilters = [];

  if (filters.category) {
  if (mongoose.Types.ObjectId.isValid(filters.category)) {
    query.category = filters.category;
  } else {
    const category = await Category.findOne({
      slug: filters.category
    }).select('_id');

    if (category) {
      query.category = category._id;
    }
  }
}
  if (filters.seller) query.seller = filters.seller;
  if (filters.province) query.province = Number(filters.province);
  if (filters.district) query.district = Number(filters.district);
  if (filters.location) locationFilters.push({ location: new RegExp(filters.location, 'i') });
  if (locationFilters.length) query.$and = [...(query.$and || []), ...locationFilters];
  if (filters.minPrice) query.price = { ...query.price, $gte: Number(filters.minPrice) };
  if (filters.maxPrice) query.price = { ...query.price, $lte: Number(filters.maxPrice) };
  if (filters.condition) query.condition = filters.condition;
  const searchTerm = filters.search || filters.q;
  if (searchTerm) query.$text = { $search: searchTerm };

  if (filters.datePosted) {
    const now = new Date();
    let cutoff;
    if (filters.datePosted === '24h') cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (filters.datePosted === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (filters.datePosted === '30d') cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (filters.datePosted === '90d') cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (cutoff) query.createdAt = { ...query.createdAt, $gte: cutoff };
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 20;
  const skip = (page - 1) * limit;

  const sortOptions = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 }
  };
  const sortBy = sortOptions[filters.sort] || sortOptions.newest;

  const [items, total] = await Promise.all([
    Product.find(query)
      .populate('seller', sellerPopulateFields)
      .populate('category', 'name labelKh slug')
      .populate('images')
      .populate('coverImage')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId)
    .populate('seller', sellerPopulateFields)
    .populate('category', 'name labelKh slug')
    .populate('images')
    .populate('coverImage');

  if (!product || product.status === 'archived') {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (!product.seller) {
    const fallbackSeller = await findFallbackSeller(product);
    if (fallbackSeller) {
      product.seller = fallbackSeller;
    }
  }

  return product;
};

const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate('seller', sellerPopulateFields)
    .populate('category', 'name labelKh slug')
    .populate('images')
    .populate('coverImage');

  if (!product || product.status === 'archived') {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (!product.seller) {
    const fallbackSeller = await findFallbackSeller(product);
    if (fallbackSeller) {
      product.seller = fallbackSeller;
    }
  }

  return product;
};

const incrementProductViews = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { viewsCount: 1 } },
    { new: true, runValidators: true }
  ).select('viewsCount status');

  if (!product || product.status === 'archived') {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

const getFeaturedProducts = async (filters = {}) => {
  const featuredQuery = { status: 'published', $or: [{ featured: true }, { isFeatured: true }] };
  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 12;
  const skip = (page - 1) * limit;

  // Check if there are any featured products
  const featuredCount = await Product.countDocuments(featuredQuery);
  
  // If featured products exist, return them; otherwise fall back to recent products
  const query = featuredCount > 0 ? featuredQuery : { status: 'published' };

  const items = await Product.find(query)
    .populate('seller', sellerPopulateFields)
    .populate('category', 'name labelKh slug')
    .populate('images')
    .populate('coverImage')
    .sort(featuredCount > 0 ? { featuredAt: -1, createdAt: -1 } : { createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Product.countDocuments(query);
  return { items, meta: { page, limit, total } };
};

const getProductViews = async (productId) => {
  const product = await Product.findById(productId).select('viewsCount status');

  if (!product || product.status === 'archived') {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

const normalizeSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return baseSlug || `product-${Date.now()}`;
};

const createProduct = async (sellerId, payload) => {
  const categoryId = payload.category?._id || payload.category;
  await Category.findById(categoryId).orFail();

  // Support bilingual titles (Khmer/English)
  const titleKh = payload.titleKh || payload.title || '';
  const titleEn = payload.titleEn || '';
  const fallbackTitle = titleEn || titleKh || payload.title || '';

  // Generate slug preferably from English title, fallback to Khmer
  let slug = payload.slug || normalizeSlug(titleEn || titleKh || payload.title);
  if (!slug) {
    slug = `product-${Date.now()}`;
  }

  const existing = await Product.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const product = await Product.create({
    seller: sellerId,
    title: fallbackTitle, // Legacy field for backward compatibility
    titleKh: titleKh,
    titleEn: titleEn,
    slug,
    description: payload.description,
    price: Number(payload.price),
    currency: payload.currency || 'KHR',
    condition: payload.condition || 'used',
    location: payload.location,
    category: categoryId,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    coverImage: payload.coverImage && mongoose.Types.ObjectId.isValid(payload.coverImage) ? payload.coverImage : null,
    metaTitle: payload.metaTitle || fallbackTitle,
    metaDescription: payload.metaDescription || payload.description,
    extraAttributes: payload.extraAttributes || {}
  });
  return product;
};

const updateProduct = async (productId, user, updates) => {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = product.seller.toString() === user.id.toString();
  const isAdmin = ['admin', 'moderator'].includes(user.role);
  if (!isOwner && !isAdmin) {
    const error = new Error('Permission denied');
    error.statusCode = 403;
    throw error;
  }

  const previousStatus = product.status;

  Object.keys(updates).forEach((key) => {
    if (['title', 'titleKh', 'titleEn', 'description', 'price', 'condition', 'location', 'status', 'category', 'tags', 'metaTitle', 'metaDescription', 'extraAttributes', 'coverImage'].includes(key)) {
      product[key] = updates[key];
    }
  });

  // Update title as fallback if titleKh or titleEn changed
  if (updates.titleKh || updates.titleEn) {
    product.title = updates.titleEn || updates.titleKh || product.title;
  }

  if (updates.category) {
    await Category.findById(updates.category).orFail();
  }

  await product.save();

  if (updates.status === 'sold' && previousStatus !== 'sold' && product.seller) {
    await notificationService.addNotification(product.seller, {
      type: 'sold',
      title: 'Listing sold',
      message: `Your product ${product.title} has been marked as sold.`,
      link: `/products/${product.slug}`
    });
  }

  return product;
};

const deleteProduct = async (productId, user) => {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = product.seller.toString() === user.id.toString();
  const isAdmin = ['admin', 'moderator'].includes(user.role);
  if (!isOwner && !isAdmin) {
    const error = new Error('Permission denied');
    error.statusCode = 403;
    throw error;
  }

  await product.deleteOne();
};

module.exports = {
  listProducts,
  getProductById,
  getProductBySlug,
  incrementProductViews,
  getProductViews,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
