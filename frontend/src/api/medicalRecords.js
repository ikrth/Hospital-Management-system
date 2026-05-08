import apiClient from './apiClient';

export const getRecords = (params) => apiClient.get('/medical-records', { params });
export const getRecordById = (id) => apiClient.get(`/medical-records/${id}`);
export const createRecord = (data) => apiClient.post('/medical-records', data);
export const updateRecord = (id, data) => apiClient.patch(`/medical-records/${id}`, data);
export const deleteRecord = (id) => apiClient.delete(`/medical-records/${id}`);
export const generateAISummary = (id) => apiClient.post(`/medical-records/${id}/generate-ai-summary`);
