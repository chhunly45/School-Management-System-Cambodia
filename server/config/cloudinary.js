const cloudinary = require('cloudinary').v2;
const config = require('./index');

const { cloudName, apiKey, apiSecret } = config.cloudinary;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

const cloudNameLog = cloudName || '<missing>';
const apiKeyLog = apiKey ? 'present' : '<missing>';

console.log(`[Cloudinary] configured with cloud_name=${cloudNameLog} api_key=${apiKeyLog}`);

if (config.isProduction && (!cloudName || !apiKey || !apiSecret)) {
  throw new Error('Missing required Cloudinary environment variables for production startup.');
}

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    '[Cloudinary] missing required environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
  );
}

module.exports = cloudinary;
