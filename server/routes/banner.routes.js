const express = require('express');
const { body, param, query } = require('express-validator');
const bannerController = require('../controllers/banner.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

// Public endpoint to fetch active banners
router.get('/active',
  query('position').optional().isIn(['top','inline','sidebar']),
  validate,
  bannerController.getActiveBanners
);

// Admin endpoints - protected
router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/', bannerController.listBanners);

router.post('/',
  body('title').isString().notEmpty(),
  body('position').optional().isIn(['top','inline','sidebar']),
  body('enabled').optional().isBoolean(),
  validate,
  bannerController.createBanner
);

router.post('/upload', upload.single('image'), bannerController.uploadImage);

router.patch('/:id', param('id').isMongoId(), validate, bannerController.updateBanner);

router.delete('/:id', param('id').isMongoId(), validate, bannerController.deleteBanner);

module.exports = router;
