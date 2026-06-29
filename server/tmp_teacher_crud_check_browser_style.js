const axios = require('axios');
const base = 'http://localhost:5000/api';
(async () => {
  const origin = 'http://localhost:5173';
  const csrfResp = await axios.get(base + '/csrf-token', {
    headers: { Origin: origin },
    validateStatus: () => true,
    withCredentials: true
  });
  const csrfToken = csrfResp.data?.csrfToken;
  const loginResp = await axios.post(base + '/auth/login', {
    identifier: 'admin@local.test',
    password: 'AdminPass1!'
  }, {
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    validateStatus: () => true,
    withCredentials: true
  });
  const accessToken = loginResp.data?.data?.accessToken;
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Origin: origin,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  };

  const createPayload = {
    teacherId: 'AUTOCRM' + Date.now(),
    fullName: 'Runtime Verify Teacher',
    gender: 'male',
    qualification: 'Bachelor',
    experienceYears: 3,
    status: 'active'
  };
  const createResp = await axios.post(base + '/teachers', createPayload, {
    headers: authHeaders,
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('CREATE', JSON.stringify({ status: createResp.status, body: createResp.data }, null, 2));
  const createdId = createResp.data?.data?._id;
  if (!createdId) process.exit(1);

  const editResp = await axios.put(base + '/teachers/' + createdId, { ...createPayload, fullName: 'Runtime Verify Teacher Edited' }, {
    headers: authHeaders,
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('EDIT', JSON.stringify({ status: editResp.status, body: editResp.data }, null, 2));

  const deleteResp = await axios.delete(base + '/teachers/' + createdId, {
    headers: authHeaders,
    validateStatus: () => true,
    withCredentials: true
  });
  console.log('DELETE', JSON.stringify({ status: deleteResp.status, body: deleteResp.data }, null, 2));
})();
