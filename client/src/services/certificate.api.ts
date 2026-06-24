import api from './api';

export const listCertificates = (query: {
  search?: string;
  status?: 'draft' | 'issued' | 'revoked';
  certificateType?: 'graduation' | 'achievement' | 'attendance' | 'honor';
  academicYear?: string;
  studentId?: string;
  page?: number;
  perPage?: number;
} = {}) => api.get('/certificates', { params: query }).then((r) => r.data);

export const getCertificate = (id: string) => api.get(`/certificates/${id}`).then((r) => r.data);

export const createCertificate = (payload: any) => api.post('/certificates', payload).then((r) => r.data);

export const updateCertificate = (id: string, payload: any) => api.put(`/certificates/${id}`, payload).then((r) => r.data);

export const deleteCertificate = (id: string) => api.delete(`/certificates/${id}`).then((r) => r.data);
