const path = require('path');
const mongoose = require('mongoose');
const { User } = require('../models');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email
    .trim()
    .replace(/^\[+/, '')
    .replace(/\]+$/, '')
    .toLowerCase();
};

const printUsage = () => {
  console.log('Usage: npm run make:admin -- user@example.com');
};

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is required. Set it before running make:admin.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const run = async () => {
  const emailArg = process.argv[2];
  const email = normalizeEmail(emailArg);

  if (!email) {
    printUsage();
    process.exit(1);
  }

  await connectDatabase();

  const user = await User.findOne({ email }).select('email role');
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`User ${user.email} is already an admin.`);
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();

  console.log(`Success: promoted ${user.email} to admin.`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to promote user to admin:', error.message);
  process.exit(1);
});
