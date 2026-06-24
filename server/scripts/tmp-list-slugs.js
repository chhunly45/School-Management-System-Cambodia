const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const products = await Product.find({}).select('title titleEn titleKh slug').lean();
    console.log('PRODUCT_COUNT', products.length);
    if (products.length > 200) {
      console.log('NOTE: More than 200 products found. Showing first 200 only.');
    }
    products.slice(0, 200).forEach(p => {
      const name = (p.titleEn || p.titleKh || p.title || '<no title>').trim();
      console.log(`${name} -> ${p.slug}`);
    });
    const slugCounts = products.reduce((acc, p) => {
      acc[p.slug] = (acc[p.slug] || 0) + 1;
      return acc;
    }, {});
    const dups = Object.entries(slugCounts).filter(([, count]) => count > 1);
    console.log('---');
    console.log('UNIQUE_SLUGS', Object.keys(slugCounts).length);
    console.log('DUPLICATE_SLUG_COUNT', dups.length);
    if (dups.length > 0) {
      console.log('DUPLICATES', JSON.stringify(dups, null, 2));
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
