const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/',
  query('search').optional().trim().isString(),
query('category').optional().trim().isString(),
  query('seller').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('province').optional().trim().isString(),
  query('condition').optional().isIn(['new', 'used', 'refurbished']),
  query('datePosted').optional().isIn(['24h', '7d', '30d', '90d']),
  query('sort').optional().isIn(['newest', 'priceAsc', 'priceDesc']),
  validate,
  productController.listProducts
);

router.get('/featured', validate, productController.listFeaturedProducts);
router.get('/slug/:slug', validate, productController.getProductBySlug);

// Handle old product ID URLs → redirect to slug-based URLs
router.get('/:id', param('id').isMongoId(), async (req, res, next) => {
  try {
    const product = await require('../models/product.model').findById(req.params.id).select('slug');
    if (product && product.slug) {
      // Redirect old /products/:id URLs to new /products/slug/:slug URLs
      return res.redirect(301, `/products/slug/${product.slug}`);
    }
    // If product not found or no slug, pass to original controller
    next();
  } catch (error) {
    // On error, pass to original controller
    next();
  }
});

router.get('/:id', param('id').isMongoId(), validate, productController.getProduct);
router.post('/:id/views', param('id').isMongoId(), validate, productController.addProductView);

router.post(
  '/',
  authMiddleware,
  body('title').optional().trim().isString(),
  body('titleKh').optional().trim().isString(),
  body('titleEn').optional().trim().isString(),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('coverImage').optional().isMongoId().withMessage('Cover image must be a valid image id'),
  validate,
  productController.createProduct
);

router.put('/:id', authMiddleware, param('id').isMongoId(), body('coverImage').optional().isMongoId().withMessage('Cover image must be a valid image id'), validate, productController.updateProduct);
router.delete('/:id', authMiddleware, param('id').isMongoId(), validate, productController.deleteProduct);

module.exports = router;
