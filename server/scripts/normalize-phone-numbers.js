const mongoose = require('mongoose');
const config = require('../config');
const { User } = require('../models');
const { normalizeCambodiaPhone } = require('../utils/phone');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({ phoneNumber: { $exists: true, $ne: null } });
  let updated = 0;
  for (const user of users) {
    const normalized = normalizeCambodiaPhone(user.phoneNumber);
    if (normalized && normalized !== user.phoneNumber) {
      user.phoneNumber = normalized;
      await user.save();
      updated += 1;
      console.log('Updated', user._id.toString(), '->', normalized);
    }
  }
  console.log('Done. Updated', updated, 'users.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
