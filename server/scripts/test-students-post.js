const axios = require('axios');
const path = require('path');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    // 1) get csrf token and cookie
    const csrfResp = await axios.get(base + '/csrf-token', { headers: { Origin: 'http://localhost:5174' }, withCredentials: true });
    console.log('GET /csrf-token status', csrfResp.status);
    const csrfToken = csrfResp.data && csrfResp.data.csrfToken;
    const setCookie = (csrfResp.headers['set-cookie'] || []).join('; ');
    console.log('csrfToken:', csrfToken);
    console.log('set-cookie:', setCookie);

    // 2) login
    const loginResp = await axios.post(base + '/auth/login', { identifier: 'admin@local.test', password: 'AdminPass1!' }, { headers: { Origin: 'http://localhost:5174', 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json', Cookie: setCookie }, withCredentials: true, validateStatus: null });
    console.log('/auth/login status', loginResp.status);
    console.log('login body', loginResp.data);
    if (!(loginResp.data && loginResp.data.data && loginResp.data.data.accessToken)) {
      console.error('Login did not return accessToken, aborting');
      process.exit(1);
    }
    const token = loginResp.data.data.accessToken;

    // 3) POST /students
    const studentPayload = {
      studentId: 'S-1001',
      fullName: 'Automated Test Student',
      gender: 'other',
      dateOfBirth: '2010-05-12',
      phone: '+85570000001',
      address: 'Test Address',
      guardianName: 'Parent Test',
      guardianPhone: '+85570000002',
      className: '10A',
      status: 'active'
    };

    const createResp = await axios.post(base + '/students', studentPayload, { headers: { Origin: 'http://localhost:5174', 'X-CSRF-Token': csrfToken, Cookie: setCookie, Authorization: `Bearer ${token}` }, withCredentials: true, validateStatus: null });
    console.log('/students POST status', createResp.status);
    console.log('create body', JSON.stringify(createResp.data));

    process.exit(0);
  } catch (e) {
    console.error('Test failed', e && e.response ? e.response.status : e.message);
    if (e && e.response && e.response.data) console.error('body', e.response.data);
    process.exit(1);
  }
})();
