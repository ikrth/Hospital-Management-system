import apiClient from './apiClient';

export const getUsers = (params) => apiClient.get('/users', { params });
export const updateUser = (id, data) => apiClient.patch(`/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`);
