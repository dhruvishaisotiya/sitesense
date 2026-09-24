import api from './axios';

export const getWorkers = async (params = {}) => {
  const response = await api.get('/workers/', { params });
  return response.data;
};

export const getWorkerDetails = async (id) => {
  const response = await api.get(`/workers/${id}/`);
  return response.data;
};

export const createWorker = async (data) => {
  const response = await api.post('/workers/', data);
  return response.data;
};

export const updateWorker = async (id, data) => {
  const response = await api.put(`/workers/${id}/`, data);
  return response.data;
};

export const deleteWorker = async (id) => {
  const response = await api.delete(`/workers/${id}/`);
  return response.data;
};

export const assignWorker = async (id, projectId) => {
  const response = await api.post(`/workers/${id}/assign/`, { project_id: projectId });
  return response.data;
};

export const removeWorker = async (id) => {
  const response = await api.post(`/workers/${id}/remove/`);
  return response.data;
};

export const getAvailableWorkers = async () => {
  const response = await api.get('/workers/available/');
  return response.data;
};
