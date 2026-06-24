const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/konpuk',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || process.env.FRONTEND || 'http://localhost:5173',
  allowedOrigins: (() => {
    const defaultOrigins = [
      'http://localhost:5173',
      'https://kh-product.vercel.app',
      'https://konpuk.com',
      'https://www.konpuk.com'
    ];
    const envClient = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || process.env.FRONTEND;
    if (envClient && !defaultOrigins.includes(envClient)) defaultOrigins.push(envClient);
    return defaultOrigins;
  })(),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  emailHost: process.env.EMAIL_HOST || '',
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@konpuk.com',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'marketplace'
  }
};
