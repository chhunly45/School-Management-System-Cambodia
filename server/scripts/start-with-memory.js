const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';
  console.log('Using in-memory MongoDB at', process.env.MONGODB_URI);

  // Require the server (it will call startServer())
  require(path.join(__dirname, '..', 'server.js'));

  // Keep process running until manually killed
  process.on('SIGINT', async () => {
    console.log('Shutting down memory server');
    await mongod.stop();
    process.exit(0);
  });
})();
