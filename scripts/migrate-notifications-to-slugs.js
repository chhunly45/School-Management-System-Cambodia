#!/usr/bin/env node
// One-time migration: replace /products/<objectId> links in user.notifications with /products/<slug>

const path = require('path');
const mongoose = require(path.join(__dirname, '..', 'server', 'node_modules', 'mongoose'));

// Models are located under server/models relative to repo root; this script lives in scripts/
const User = require(path.join(__dirname, '..', 'server', 'models', 'User'));
const Product = require(path.join(__dirname, '..', 'server', 'models', 'Product'));

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply; // default is dry-run

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/konpuk';
  console.log(`Connecting to ${mongoUri} ...`);
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  const idLinkRegex = /^\/products\/([0-9a-fA-F]{24})$/;

  let usersProcessed = 0;
  let notificationsScanned = 0;
  let notificationsUpdated = 0;
  let notificationsSkipped = 0;

  try {
    console.log('Finding users with notifications that reference product ObjectIds...');
    const users = await User.find({ 'notifications.link': idLinkRegex });
    console.log(`Found ${users.length} user(s) with candidate notifications.`);

    for (const user of users) {
      usersProcessed++;
      let modified = false;

      for (let i = 0; i < user.notifications.length; i++) {
        const n = user.notifications[i];
        if (!n || !n.link) continue;
        const m = n.link.match(idLinkRegex);
        if (!m) continue;

        notificationsScanned++;
        const productId = m[1];

        // Lookup product by id
        const product = await Product.findById(productId).lean();
        if (!product) {
          notificationsSkipped++;
          console.log(`SKIP (product not found) - user=${user._id} oldLink=${n.link}`);
          continue;
        }

        if (!product.slug) {
          notificationsSkipped++;
          console.log(`SKIP (no slug) - user=${user._id} productId=${productId} oldLink=${n.link}`);
          continue;
        }

        const newLink = `/products/${product.slug}`;
        if (n.link === newLink) {
          // already correct
          notificationsSkipped++;
          continue;
        }

        // Log planned change
        console.log(`${dryRun ? 'WOULD UPDATE' : 'UPDATE'} - user=${user._id} oldLink=${n.link} newLink=${newLink}`);

        if (apply) {
          user.notifications[i].link = newLink;
          modified = true;
          notificationsUpdated++;
        } else {
          // dry-run counts as would-update
          notificationsUpdated++;
        }
      }

      if (apply && modified) {
        await user.save();
        console.log(`Saved user ${user._id} with updated notifications.`);
      }
    }

    console.log('Migration complete. Summary:');
    console.log(`Users scanned: ${usersProcessed}`);
    console.log(`Notifications scanned (matching /products/<id>): ${notificationsScanned}`);
    console.log(`${dryRun ? 'Would update' : 'Updated'}: ${notificationsUpdated}`);
    console.log(`Skipped: ${notificationsSkipped}`);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}
