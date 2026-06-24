const productService = require('../services/product.service');

const listProducts = async (req, res, next) => {
  try {
    const filters = req.query;
    const products = await productService.listProducts(filters);
    try {
      const sample = (products.items && products.items[0]) ? products.items[0].images : [];
      console.info('List products response images (first item):', JSON.stringify(sample, null, 2));
    } catch (e) {
      console.info('List products logging failed', e && e.message);
    }
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    try {
      console.info('Get product response images:', JSON.stringify(product.images, null, 2));
    } catch (e) {
      console.info('Get product logging failed', e && e.message);
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const addProductView = async (req, res, next) => {
  try {
    const product = await productService.incrementProductViews(req.params.id);
    res.json({ success: true, data: { viewsCount: product.viewsCount } });
  } catch (error) {
    next(error);
  }
};

const listFeaturedProducts = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const payload = req.body;
    console.info('Create product payload:', payload);
    const product = await productService.createProduct(req.user.id, payload);
    console.info('Product saved response:', product);
    res.status(201).json({ success: true, data: product });
    // Clear sitemap cache if available
    try {
      const sitemapRoutes = require('../routes/sitemap.routes');
      if (sitemapRoutes && typeof sitemapRoutes.clearCache === 'function') sitemapRoutes.clearCache();
    } catch (e) {
      // ignore
    }
  } catch (error) {
    console.error('Create product error:', error);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.user, req.body);
    res.json({ success: true, data: product });
    try {
      const sitemapRoutes = require('../routes/sitemap.routes');
      if (sitemapRoutes && typeof sitemapRoutes.clearCache === 'function') sitemapRoutes.clearCache();
    } catch (e) {
      // ignore
    }
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id, req.user);
    res.json({ success: true, message: 'Product deleted' });
    try {
      const sitemapRoutes = require('../routes/sitemap.routes');
      if (sitemapRoutes && typeof sitemapRoutes.clearCache === 'function') sitemapRoutes.clearCache();
    } catch (e) {
      // ignore
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProduct,
  getProductBySlug,
  addProductView,
  listFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
