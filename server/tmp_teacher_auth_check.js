const axios = require('axios');
const base = 'http://localhost:5000/api';
(async () => {
  const access = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTQwZDU0NGQ3ZDA1NmY0YjYzNDFmNGMiLCJpYXQiOjE3ODI2NTY0ODQsImV4cCI6MTc4MjY2MDA4NH0.LiSurStQn9UlXrRJqlyuXYDx3anrm1Gfb9rPkL2Wbug';
  const r = await axios.get(base + '/teachers', {
    headers: { Authorization: `Bearer ${access}` },
    validateStatus: () => true
  });
  console.log(JSON.stringify({ status: r.status, body: r.data }, null, 2));
})();
