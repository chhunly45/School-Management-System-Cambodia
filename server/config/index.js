const path = require('path');

const getEnvValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: getEnvValue('MONGODB_URI', 'MONGO_URI') || (isProduction ? '' : 'mongodb://localhost:27017/konpuk'),
  jwtSecret: getEnvValue('JWT_SECRET') || (isProduction ? '' : 'dev-jwt-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  clientOrigin: getEnvValue('CLIENT_URL', 'CLIENT_ORIGIN', 'FRONTEND_URL', 'FRONTEND') || (isProduction ? '' : 'http://localhost:5173'),
  allowedOrigins: (() => {
    const defaultOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'https://kh-product.vercel.app',
      'https://school-management-system-cambodia.vercel.app',
      'https://konpuk.com',
      'https://www.konpuk.com'
    ];
    const envClient = getEnvValue('CLIENT_URL', 'CLIENT_ORIGIN', 'FRONTEND_URL', 'FRONTEND');
    if (envClient && !defaultOrigins.includes(envClient)) defaultOrigins.push(envClient);

    const extraOrigins = getEnvValue('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    for (const origin of extraOrigins) {
      if (!defaultOrigins.includes(origin)) defaultOrigins.push(origin);
    }

    return defaultOrigins;
  })(),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  categoryRateLimitWindowMs: Number(process.env.CATEGORY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  categoryRateLimitMax: Number(process.env.CATEGORY_RATE_LIMIT_MAX) || 200,
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  emailHost: process.env.EMAIL_HOST || '',
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  resendApiKey: getEnvValue('RESEND_API_KEY') || '',
  emailFrom: getEnvValue('EMAIL_FROM') || (isProduction ? '' : 'no-reply@localhost'),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  nodeEnv,
  isProduction,
  cloudinary: {
    cloudName: getEnvValue('CLOUDINARY_CLOUD_NAME') || '',
    apiKey: getEnvValue('CLOUDINARY_API_KEY') || '',
    apiSecret: getEnvValue('CLOUDINARY_API_SECRET') || '',
    folder: process.env.CLOUDINARY_FOLDER || 'marketplace'
  }
};

config.validateEnvironment = () => {
  const requiredVars = [
    { key: 'MONGODB_URI', value: config.mongoUri },
    { key: 'JWT_SECRET', value: config.jwtSecret }
  ];

  const optionalVars = [
    { key: 'CLIENT_URL', value: config.clientOrigin },
    { key: 'RESEND_API_KEY', value: config.resendApiKey },
    { key: 'EMAIL_FROM', value: config.emailFrom },
    { key: 'CLOUDINARY_CLOUD_NAME', value: config.cloudinary.cloudName },
    { key: 'CLOUDINARY_API_KEY', value: config.cloudinary.apiKey },
    { key: 'CLOUDINARY_API_SECRET', value: config.cloudinary.apiSecret }
  ];

  const missingRequired = requiredVars.filter(({ value }) => !value).map(({ key }) => key);
  const missingOptional = optionalVars.filter(({ value }) => !value).map(({ key }) => key);

  if (isProduction && missingRequired.length > 0) {
    throw new Error(`Missing required environment variables for production startup: ${missingRequired.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    console.warn(
      `[Config] optional environment variables missing: ${missingOptional.join(', ')}`
    );
  }

  return [...missingRequired, ...missingOptional];
};

const logStartupConfig = () => {
  const envFrontendUrl = getEnvValue('CLIENT_URL', 'CLIENT_ORIGIN', 'FRONTEND_URL', 'FRONTEND');
  console.log('[CONFIG] NODE_ENV =', config.nodeEnv);
  console.log('[CONFIG] resolved allowedOrigins =', JSON.stringify(config.allowedOrigins));
  if (envFrontendUrl) {
    console.log('[CONFIG] CLIENT_URL / FRONTEND_URL =', envFrontendUrl);
  } else {
    console.log('[CONFIG] CLIENT_URL / FRONTEND_URL not set');
  }
};

logStartupConfig();

module.exports = config;
