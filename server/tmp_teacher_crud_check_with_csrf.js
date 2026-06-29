const axios = require('axios');
const base = 'http://localhost:5000/api';
const access = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTQwZDU0NGQ3ZDA1NmY0YjYzNDFmNGMiLCJpYXQiOjE3ODI2NTY0ODQsImV4cCI6MTc4MjY2MDA4NH0.LiSurStQn9UlXrRJqlyuXYDx3anrm1Gfb9rPkL2Wbug';
(async () => {
  const csrfResp = await axios.get(base + '/csrf-token', { validateStatus: () => true, withCredentials: true });
  const csrfToken = csrfResp.data?.csrfToken;
  const payload = {
    teacherId: 'AUTOCRM' + Date.now(),
    fullName: 'Runtime Verify Teacher',
    gender: 'male',
    qualification: 'Bachelor',
    experienceYears: 3,
    status: 'active'
  };
  const createResp = await axios.post(base + '/teachers', payload, {
    headers: {
      Authorization: `Bearer ${access}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true,
    withCredentials: true
  });
  console.log(JSON.stringify({ status: createResp.status, body: createResp.data }, null, 2));
})();
