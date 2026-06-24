const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const connectDatabase = require('../config/database');
const app = require('../app');
const http = require('http');
(async () => {
  try {
    await connectDatabase();
    const server = app.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}/sitemap.xml`;
      http.get(url, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log('STATUS', res.statusCode);
          console.log('CONTENT_TYPE', res.headers['content-type']);
          console.log('BODY');
          console.log(body);
          server.close(() => process.exit(0));
        });
      }).on('error', err => {
        console.error('REQUEST_ERROR', err.message);
        server.close(() => process.exit(1));
      });
    });
  } catch (err) {
    console.error('START_ERROR', err.message);
    process.exit(1);
  }
})();
