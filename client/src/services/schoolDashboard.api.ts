import api from './api';

export const getSchoolDashboardStats = () => api.get('/school-dashboard/stats').then((r) => r.data);
