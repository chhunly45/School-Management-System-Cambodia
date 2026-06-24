const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const config = require('../config');

const run = async () => {
  try {
    await require('../config/database')();
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    console.log('Dropping old email index if it exists...');
    try {
      await collection.dropIndex('email_1');
      console.log('Dropped email_1 index');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('email_1 index not found, skipping drop');
      } else {
        throw err;
      }
    }

    console.log('Creating sparse unique email index...');
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('Created sparse unique email index');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
