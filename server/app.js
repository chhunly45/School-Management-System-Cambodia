const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const config = require('./config');

const app = express();

// Hide technology stack
app.disable('x-powered-by');

app.set('trust proxy', 1);

const corsOptions = {
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 204
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      blockAllMixedContent: [],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cookieParser());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());
app.use(morgan('combined'));

const authLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests, please try again later.' }
});

// A lighter limiter for non-sensitive auth endpoints (optional).
const authMeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // allow more requests for /auth/me
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Exclude the public "me" endpoint from the strict auth limiter to avoid
// accidental 429s from frequent client-side profile checks. We still apply
// a lighter limiter for GET /api/auth/me to protect from abuse.
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/me' && req.method === 'GET') {
    return authMeLimiter(req, res, next);
  }
  return authLimiter(req, res, next);
});
app.use(apiLimiter);

const authCsrfExceptionPaths = new Set(['/api/auth/login', '/api/auth/login/verify']);
const isProduction = String(config.nodeEnv).toLowerCase() === 'production';
const csrfCookieOptions = {
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax'
};
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    ...csrfCookieOptions
  }
});

const isAllowedOriginOrReferer = (req) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  return (
    (typeof origin === 'string' && config.allowedOrigins.includes(origin)) ||
    (typeof referer === 'string' && config.allowedOrigins.some((allowedOrigin) => referer.startsWith(allowedOrigin)))
  );
};

const authCsrfFallback = (req) => {
  const tokenHeader = req.headers['x-csrf-token'];
  const tokenCookie = req.cookies ? req.cookies['XSRF-TOKEN'] : undefined;
  const allowedSource = isAllowedOriginOrReferer(req);

  if (!allowedSource || !tokenHeader) {
    return false;
  }

  if (tokenCookie && tokenHeader !== tokenCookie) {
    return false;
  }

  return true;
};

app.use(csrfProtection);
app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN' && req.method === 'POST' && authCsrfExceptionPaths.has(req.path)) {
    if (authCsrfFallback(req)) {
      return next();
    }
  }
  next(err);
});

app.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    const token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      ...csrfCookieOptions
    });
  }
  next();
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ success: true, csrfToken: req.csrfToken() });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', routes);

const Product = require('./models/Product');
const SITE_URL = process.env.SITE_URL || 'https://konpuk.com';

// Redirect old product ID URLs to new slug-based URLs (302)
app.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('Not found');
    const product = await Product.findById(id).select('slug');
    if (!product || !product.slug) return res.status(404).send('Not found');
    return res.redirect(302, `${SITE_URL.replace(/\/$/, '')}/products/${product.slug}`);
  } catch (err) {
    console.warn('Redirect error', err && err.message);
    return res.status(500).send('Server error');
  }
});

// Sitemap and robots
try {
  const sitemapRoutes = require('./routes/sitemap.routes');
  app.use('/', sitemapRoutes);
} catch (err) {
  console.warn('Sitemap routes not mounted:', err && err.message);
}

app.get('/robots.txt', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://konpuk.com';
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /dashboard',
    `Sitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`
  ];
  res.type('text/plain').send(lines.join('\n'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use(errorHandler);

module.exports = app;
