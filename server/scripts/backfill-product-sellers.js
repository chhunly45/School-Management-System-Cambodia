require('dotenv').config();
const connectDatabase = require('../config/database');
const { Product, User, Image } = require('../models');

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

const run = async () => {
  await connectDatabase();

  const products = await Product.find({ $or: [{ seller: { $exists: false } }, { seller: null }] }).lean();
  console.log(`Found ${products.length} products with missing seller field.`);

  let fixedCount = 0;
  let failedCount = 0;

  for (const productData of products) {
    try {
      const fallbackSeller = await findFallbackSeller(productData);
      if (!fallbackSeller) {
        console.warn(`No fallback seller found for product ${productData._id}`);
        failedCount += 1;
        continue;
      }

      const product = await Product.findById(productData._id);
      if (!product) {
        failedCount += 1;
        continue;
      }

      product.seller = fallbackSeller._id;
      await product.save();
      fixedCount += 1;
      console.log(`Backfilled seller for product ${product._id}: ${fallbackSeller._id}`);
    } catch (error) {
      console.error(`Error backfilling product ${productData._id}:`, error.message);
      failedCount += 1;
    }
  }

  console.log(`Backfill complete. Fixed: ${fixedCount}. Failed: ${failedCount}.`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Backfill script failed:', error);
  process.exit(1);
});
