const axios = require('axios');
const base = 'http://localhost:5000/api';
const client = axios.create({ baseURL: base, validateStatus: () => true, withCredentials: true });

(async () => {
  const csrfResp = await client.get('/csrf-token', { headers: { Origin: 'http://localhost:5173' } });
  const csrfToken = csrfResp.data?.csrfToken;
  const loginResp = await client.post('/auth/login', { identifier: 'admin@local.test', password: 'AdminPass1!' }, {
    headers: { Origin: 'http://localhost:5173', 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
  });

  const token = loginResp.data?.data?.accessToken;
  if (!token) {
    throw new Error('Failed to authenticate admin');
  }

  const headers = { Authorization: `Bearer ${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': csrfToken };

  const searchResp = await client.get('/payments', {
    headers,
    params: { search: 'RT-TEST-1', perPage: 10, includeRelations: true }
  });
  console.log('search status', searchResp.status);
  console.log('search items', searchResp.data?.data?.items?.length || 0);

  const summaryResp = await client.get('/payments/summary/monthly', {
    headers,
    params: { year: 2026, month: 6 }
  });
  console.log('summary status', summaryResp.status);
  console.log('summary totals', summaryResp.data?.data?.totals);
})();
