import api from './axios';

export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks/', { params });
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post('/tasks/', data);
  return response.data;
};

export const getTaskDetails = async (id) => {
  const response = await api.get(`/tasks/${id}/`);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}/`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}/`);
  return response.data;
};

export const updateTaskProgress = async (id, data) => {
  const response = await api.post(`/tasks/${id}/update-progress/`, data);
  return response.data;
};

export const markTaskComplete = async (id) => {
  const response = await api.post(`/tasks/${id}/mark-complete/`);
  return response.data;
};

export const approveTask = async (id, data = {}) => {
  const response = await api.post(`/tasks/${id}/approve/`, data);
  return response.data;
};

export const rejectTask = async (id, data = {}) => {
  const response = await api.post(`/tasks/${id}/reject/`, data);
  return response.data;
};

export const getTaskAnalytics = async (params = {}) => {
  const response = await api.get('/tasks/analytics/', { params });
  return response.data;
};

export const getAvailableEngineers = async () => {
  const response = await api.get('/tasks/available-engineers/');
  return response.data;
};
