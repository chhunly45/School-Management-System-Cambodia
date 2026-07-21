const mongoose = require('mongoose');
const config = require('../config');

const maskMongoUri = (value) => {
  if (!value) return '(empty)';
  try {
    const parsed = new URL(value);
    const username = parsed.username ? '***' : '';
    const password = parsed.password ? '***' : '';
    const auth = username || password ? `${username}:${password}@` : '';
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return value.replace(/(:\/\/)([^:@/]+)(:[^@/]+)?@/, '$1***:***@');
  }
};

const connectDatabase = async () => {
  try {
    console.log('[DEBUG] database.js config.mongoUri exists =', Boolean(config.mongoUri));
    console.log('[DEBUG] database.js config.mongoUri =', maskMongoUri(config.mongoUri));
    console.log('[DEBUG] database.js config.mongoUri === process.env.MONGODB_URI =', config.mongoUri === process.env.MONGODB_URI);
    console.log('[DEBUG] database.js config.mongoUri === process.env.MONGO_URI =', config.mongoUri === process.env.MONGO_URI);

    const uri = config.mongoUri;
    let databaseName = '(none)';
    let clusterHost = '(none)';

    try {
      const parsedUri = new URL(uri);
      databaseName = parsedUri.pathname.replace(/^\//, '') || '(none)';
      clusterHost = parsedUri.host || '(none)';
    } catch (parseError) {
      const fallbackMatch = uri.match(/mongodb(?:\+srv)?:\/\/(?:[^:@/]+(?::[^@/]+)?@)?([^/?#]+)(?:\/([^?#]+))?/i);
      if (fallbackMatch) {
        clusterHost = fallbackMatch[1] || '(none)';
        databaseName = fallbackMatch[2] || '(none)';
      }
    }

    console.log('[DEBUG] database.js database name =', databaseName);
    console.log('[DEBUG] database.js cluster host =', clusterHost);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('[DEBUG] database.js full Mongo error object:');
    console.dir(error, { depth: null });
    process.exit(1);
  }
};

module.exports = connectDatabase;
