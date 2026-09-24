import api from './axios';

export const getProjects = async (params = {}) => {
  const response = await api.get('/projects/', { params });
  return response.data;
};

export const getProjectDetails = async (id) => {
  const response = await api.get(`/projects/${id}/`);
  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects/', data);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}/`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}/`);
  return response.data;
};

export const archiveProject = async (id) => {
  const response = await api.post(`/projects/${id}/archive/`);
  return response.data;
};

export const restoreProject = async (id) => {
  const response = await api.post(`/projects/${id}/restore/`);
  return response.data;
};

export const getAvailableManagers = async () => {
  const response = await api.get('/projects/available-managers/');
  return response.data;
};

export const getAvailableEngineers = async () => {
  const response = await api.get('/projects/available-engineers/');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/auth/create/', userData);
  return response.data;
};
