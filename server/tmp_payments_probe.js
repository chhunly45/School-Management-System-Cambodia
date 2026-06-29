const axios = require('axios');
const base = 'http://localhost:5000/api';
const client = axios.create({ baseURL: base, validateStatus: () => true, withCredentials: true });

(async () => {
  const csrfResp = await client.get('/csrf-token', { headers: { Origin: 'http://localhost:5173' } });
  console.log('csrf', csrfResp.status, csrfResp.data);
  const csrfToken = csrfResp.data?.csrfToken;
  const loginResp = await client.post('/auth/login', { identifier: 'admin@local.test', password: 'AdminPass1!' }, {
    headers: { Origin: 'http://localhost:5173', 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
  });
  console.log('login', loginResp.status, loginResp.data);
  const token = loginResp.data?.data?.accessToken;
  if (!token) process.exit(1);
  const studentsResp = await client.get('/students', {
    headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': csrfToken },
    params: { perPage: 10 }
  });
  console.log('students', studentsResp.status, JSON.stringify(studentsResp.data).slice(0, 4000));
})();
