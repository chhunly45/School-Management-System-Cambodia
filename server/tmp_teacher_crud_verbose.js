const axios = require('axios');
const base = 'http://localhost:5000/api';
(async () => {
  const origin = 'http://localhost:5173';
  const csrfResp = await axios.get(base + '/csrf-token', {
    headers: { Origin: origin },
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('csrf', csrfResp.data);
  const loginResp = await axios.post(base + '/auth/login', {
    identifier: 'admin@local.test',
    password: 'AdminPass1!'
  }, {
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfResp.data.csrfToken
    },
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('login status', loginResp.status);
  console.log('login body', loginResp.data);
  const accessToken = loginResp.data?.data?.accessToken;
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
      Authorization: `Bearer ${accessToken}`,
      Origin: origin,
      'X-CSRF-Token': csrfResp.data.csrfToken,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('create status', createResp.status);
  console.log('create body', createResp.data);
})();
