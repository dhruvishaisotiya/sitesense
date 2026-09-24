import api from './axios';

export const getMaterialCatalog = async (params = {}) => {
  const response = await api.get('/materials/catalog/', { params });
  return response.data;
};

export const createCatalogItem = async (data) => {
  const response = await api.post('/materials/catalog/', data);
  return response.data;
};

export const updateCatalogItem = async (id, data) => {
  const response = await api.put(`/materials/catalog/${id}/`, data);
  return response.data;
};

export const getMaterialPurchases = async (params = {}) => {
  const response = await api.get('/materials/purchases/', { params });
  return response.data;
};

export const purchaseMaterial = async (data) => {
  const response = await api.post('/materials/purchases/', data);
  return response.data;
};

export const getExpenses = async (params = {}) => {
  const response = await api.get('/materials/expenses/', { params });
  return response.data;
};

export const getBudgetSummary = async (params = {}) => {
  const response = await api.get('/materials/purchases/budget-summary/', { params });
  return response.data;
};
