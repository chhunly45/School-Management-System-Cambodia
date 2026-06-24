const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';

  const connectDatabase = require('../config/database');
  await connectDatabase();

  const { User } = require('../models');
  const app = require('../app');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;

  try {
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: 'auth-header-test@example.com',
      passwordHash,
      displayName: 'Auth Header Test',
      role: 'user',
      emailVerified: true
    });

    // sign token manually
    const config = require('../config');
    const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });

    // Test with 'Bearer'
    const resp1 = await axios.get(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Bearer status', resp1.status);

    // Test with 'bearer' lowercase
    const resp2 = await axios.get(`${base}/auth/me`, { headers: { Authorization: `bearer ${token}` } });
    console.log('bearer status', resp2.status);

    // Exit success
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
    console.log('Test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    try { await mongoose.disconnect(); await mongod.stop(); } catch (e) {}
    server.close();
    process.exit(2);
  }
})();
