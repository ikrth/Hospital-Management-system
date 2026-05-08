import apiClient from './apiClient';

export const getAdminStats = () => apiClient.get('/analytics/admin');
export const getDoctorStats = () => apiClient.get('/analytics/doctor');
export const globalSearch = (q) => apiClient.get('/search', { params: { q } });
