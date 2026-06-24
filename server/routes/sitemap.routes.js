const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

const SITE_URL = process.env.SITE_URL || 'https://konpuk.com';

function escapeXml(str) {
  if (!str) return '';
  return String(str).replace(/[<>&'\"]+/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

// Simple in-memory cache for sitemap (stale while revalidate style)
let sitemapCache = null;
let sitemapCacheTime = 0;
const SITEMAP_TTL_MS = 1000 * 60 * 60; // 1 hour

router.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (sitemapCache && (now - sitemapCacheTime) < SITEMAP_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.type('application/xml');
      return res.send(sitemapCache);
    }

    const products = await Product.find({ status: 'published' }).select('updatedAt createdAt slug').lean().limit(50000);
    const categories = await Category.find({}).select('slug updatedAt createdAt').lean();

    const urls = [];

    // Homepage
    urls.push({ loc: `${SITE_URL}/`, priority: '1.0', lastmod: new Date().toISOString() });

    // Categories
    for (const cat of categories) {
      urls.push({ loc: `${SITE_URL}/categories/${encodeURIComponent(cat.slug)}`, priority: '0.8', lastmod: (cat.updatedAt || cat.createdAt || new Date()).toISOString() });
    }

    // Products (use slug)
    for (const p of products) {
      if (p.slug) {
        urls.push({ loc: `${SITE_URL}/products/${encodeURIComponent(p.slug)}`, priority: '0.6', lastmod: (p.updatedAt || p.createdAt || new Date()).toISOString() });
      }
    }

    const xmlParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    for (const u of urls) {
      xmlParts.push('<url>');
      xmlParts.push(`<loc>${escapeXml(u.loc)}</loc>`);
      if (u.lastmod) xmlParts.push(`<lastmod>${u.lastmod}</lastmod>`);
      if (u.priority) xmlParts.push(`<priority>${u.priority}</priority>`);
      xmlParts.push('</url>');
    }

    xmlParts.push('</urlset>');

    const xml = xmlParts.join('\n');
    sitemapCache = xml;
    sitemapCacheTime = now;

    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;

module.exports.clearCache = () => {
  sitemapCache = null;
  sitemapCacheTime = 0;
};
