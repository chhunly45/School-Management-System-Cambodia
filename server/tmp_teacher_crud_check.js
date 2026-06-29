const axios = require('axios');
const base = 'http://localhost:5000/api';
const access = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTQwZDU0NGQ3ZDA1NmY0YjYzNDFmNGMiLCJpYXQiOjE3ODI2NTY0ODQsImV4cCI6MTc4MjY2MDA4NH0.LiSurStQn9UlXrRJqlyuXYDx3anrm1Gfb9rPkL2Wbug';
const headers = { Authorization: `Bearer ${access}` };
(async () => {
  const teacherId = 'AUTOCRM' + Date.now();
  const payload = {
    teacherId,
    fullName: 'Runtime Verify Teacher',
    gender: 'male',
    qualification: 'Bachelor',
    experienceYears: 3,
    status: 'active'
  };

  const createResp = await axios.post(base + '/teachers', payload, { headers, validateStatus: () => true });
  console.log('CREATE', JSON.stringify({ status: createResp.status, body: createResp.data }, null, 2));
  const created = createResp.data?.data;
  if (!created?._id) process.exit(1);

  const editResp = await axios.put(base + '/teachers/' + created._id, { ...payload, fullName: 'Runtime Verify Teacher Edited' }, { headers, validateStatus: () => true });
  console.log('EDIT', JSON.stringify({ status: editResp.status, body: editResp.data }, null, 2));

  const deleteResp = await axios.delete(base + '/teachers/' + created._id, { headers, validateStatus: () => true });
  console.log('DELETE', JSON.stringify({ status: deleteResp.status, body: deleteResp.data }, null, 2));
})();
