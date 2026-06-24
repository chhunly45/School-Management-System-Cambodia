const mongoose = require('mongoose');
const config = require('../config');
const { Product } = require('../models');

const repairProductTextIndex = async () => {
  const collection = Product.collection;
  const existingIndexes = await collection.indexes();
  console.log('Existing Product indexes before repair:', JSON.stringify(existingIndexes, null, 2));

  const textIndexes = existingIndexes.filter((idx) => {
    const keys = Object.values(idx.key || {});
    return keys.some((value) => value === 'text');
  });

  for (const index of textIndexes) {
    await collection.dropIndex(index.name);
    console.log(`Dropped Product text index: ${index.name}`);
  }

  await collection.createIndex(
    { title: 'text', description: 'text' },
    { name: 'ProductTextIndex', background: true }
  );
  console.log('Created valid Product text index on title and description.');

  const repairedIndexes = await collection.indexes();
  console.log('Existing Product indexes after repair:', JSON.stringify(repairedIndexes, null, 2));
  console.log('Product text index repaired');
};

const run = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  await repairProductTextIndex();

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error('Failed to repair product text index:', error);
    process.exit(1);
  });
}

module.exports = { repairProductTextIndex };
