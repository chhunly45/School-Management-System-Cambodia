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
    throw new Error('Login failed');
  }
  const headers = { Authorization: `Bearer ${token}`, Origin: 'http://localhost:5173', 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' };

  const receipt = `RT-VERIFY-${Date.now()}`;
  const payload = {
    receiptNumber: receipt,
    studentId: 'API-VERIFY-1',
    studentName: 'API Verify Student',
    className: 'Runtime Class UI',
    academicYearId: '6a40e0841bd17d516c4a4dd6',
    gradeId: '6a40df061bd17d516c4a4d9a',
    classId: '6a40faddc809ca831470433b',
    paymentType: 'monthly',
    paymentPlan: 'monthly',
    tuitionAmount: 120,
    amount: 50,
    discount: 10,
    remainingBalance: 60,
    monthlyDueDay: 15,
    quarterlyDueDates: ['01-15', '04-15', '07-15', '10-15'],
    yearlyDueDate: '08-31',
    gracePeriodDays: 7,
    cashier: 'Admin',
    paymentDate: '2026-06-28',
    paymentMethod: 'cash',
    academicYear: 'RUNAY-4255',
    semester: 1,
    status: 'pending',
    remarks: 'Runtime verification'
  };

  const listResp = await client.get('/payments', { headers, params: { includeRelations: true, perPage: 100 } });
  if (listResp.status !== 200) throw new Error(`List failed: ${listResp.status}`);

  const createResp = await client.post('/payments', payload, { headers });
  if (createResp.status !== 201) throw new Error(`Create failed: ${createResp.status}`);
  const createdId = createResp.data?.data?._id;
  if (!createdId) throw new Error('Create did not return an id');

  const editResp = await client.put(`/payments/${createdId}`, { ...payload, amount: 75, remainingBalance: 35, status: 'paid' }, { headers });
  if (editResp.status !== 200) throw new Error(`Edit failed: ${editResp.status}`);

  const searchResp = await client.get('/payments', { headers, params: { search: receipt, includeRelations: true, perPage: 100 } });
  if (searchResp.status !== 200 || !searchResp.data?.data?.items?.some((item) => item.receiptNumber === receipt)) {
    throw new Error('Search failed');
  }

  const refreshResp = await client.get('/payments', { headers, params: { includeRelations: true, perPage: 100 } });
  if (refreshResp.status !== 200 || !refreshResp.data?.data?.items?.some((item) => item.receiptNumber === receipt)) {
    throw new Error('Refresh failed');
  }

  const deleteResp = await client.delete(`/payments/${createdId}`, { headers });
  if (deleteResp.status !== 200) throw new Error(`Delete failed: ${deleteResp.status}`);

  console.log(JSON.stringify({ receipt, list: true, create: true, edit: true, search: true, refresh: true, delete: true }, null, 2));
})();
