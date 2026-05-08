import apiClient from './apiClient';

export const triageSymptoms     = (data)  => apiClient.post('/ai/triage', data);
export const therapistChat      = (data)  => apiClient.post('/ai/therapist', data);
export const getTherapySessions = ()      => apiClient.get('/ai/therapy/sessions');
export const getTherapySessionById = (id) => apiClient.get(`/ai/therapy/sessions/${id}`);
export const analyzeMood        = (conversationHistory) => apiClient.post('/ai/analyze-mood', { conversationHistory });
export const suggestFollowUps   = (data)  => apiClient.post('/ai/suggest-followups', data);
export const saveTherapySession = (data)  => apiClient.post('/ai/save-therapy-session', data);
export const checkAIHealth      = ()      => apiClient.get('/ai/health');

// Legacy alias kept so any existing component using checkOllamaHealth still works
export const checkOllamaHealth  = checkAIHealth;
