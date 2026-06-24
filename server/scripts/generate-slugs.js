#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
console.log('URI starts with:', process.env.MONGODB_URI?.substring(0, 20));
const connectDatabase = require('../config/database');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const normalizeSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return baseSlug || `product-${Date.now()}`;
};

const run = async () => {
  await connectDatabase();
  console.log('Connected to DB');

  const products = await Product.find({}).select('title titleEn titleKh slug').lean();
  for (const p of products) {
    try {
      if (p.slug && p.slug.trim()) continue;
      const title = (p.titleEn && p.titleEn.trim()) ? p.titleEn : (p.titleKh && p.titleKh.trim()) ? p.titleKh : p.title || '';
      let slug = normalizeSlug(title || `product-${p._id}`);
      // ensure uniqueness
      const exists = await Product.findOne({ slug }).select('_id').lean();
      if (exists) {
        slug = `${slug}-${String(p._id).slice(-6)}`;
      }
      await Product.updateOne({ _id: p._id }, { $set: { slug } });
      console.log(`Updated product ${p._id} -> slug: ${slug}`);
    } catch (err) {
      console.error('Error updating product', p._id, err && err.message);
    }
  }

  console.log('Slug generation complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed', err);
  process.exit(1);
});
