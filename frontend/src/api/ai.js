import api from './axios';

export const getAiProjects = async () => {
  const response = await api.get('/ai/projects/');
  return response.data;
};

export const predictProject = async (projectId, refresh = false) => {
  const response = await api.get(`/ai/predict/${projectId}/`, {
    params: { refresh }
  });
  return response.data;
};
