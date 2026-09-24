import api from './axios';

export const getDailyLogs = async (params = {}) => {
  const response = await api.get('/dailylogs/', { params });
  return response.data;
};

export const createDailyLog = async (data) => {
  const response = await api.post('/dailylogs/', data);
  return response.data;
};

export const updateDailyLog = async (id, data) => {
  const response = await api.put(`/dailylogs/${id}/`, data);
  return response.data;
};

export const getDailyLogDetails = async (id) => {
  const response = await api.get(`/dailylogs/${id}/`);
  return response.data;
};

export const getDailyLogAnalytics = async (params = {}) => {
  const response = await api.get('/dailylogs/analytics/', { params });
  return response.data;
};

export const getAutoFetchProjectData = async (projectId) => {
  const response = await api.get('/dailylogs/auto-fetch/', {
    params: { project_id: projectId }
  });
  return response.data;
};
