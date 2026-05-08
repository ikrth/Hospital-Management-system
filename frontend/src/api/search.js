import apiClient from './apiClient';

export const globalSearch = async (query) => {
  return apiClient.get('/search', { params: { q: query } });
};
