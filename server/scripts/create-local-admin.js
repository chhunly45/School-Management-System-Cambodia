const path = require('path');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    const connectDatabase = require('../config/database');
    await connectDatabase();
    const { User } = require('../models');
    const email = 'admin@local.test';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
      process.exit(0);
    }
    const passwordHash = await bcrypt.hash('AdminPass1!', 12);
    const user = await User.create({
      email,
      passwordHash,
      displayName: 'Local Admin',
      role: 'admin',
      emailVerified: true
    });
    console.log('Created admin user:', user.email);
    process.exit(0);
  } catch (e) {
    console.error('Create admin failed', e);
    process.exit(1);
  }
})();
