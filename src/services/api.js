import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getVendors = async () => {
  const response = await api.get('/vendors');
  return response.data;
};

export const getVendor = async (id) => {
  const response = await api.get(`/vendors/${id}`);
  return response.data;
};

export const createVendor = async (vendor) => {
  const response = await api.post('/vendors', {
    ...vendor,
    createdAt: new Date().toISOString().split('T')[0]
  });
  return response.data;
};

export const updateVendor = async (id, vendor) => {
  const response = await api.put(`/vendors/${id}`, vendor);
  return response.data;
};

export const deleteVendor = async (id) => {
  await api.delete(`/vendors/${id}`);
};

export const getJobs = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const createJob = async (job) => {
  const response = await api.post('/jobs', {
    ...job,
    createdAt: new Date().toISOString(),
  });
  return response.data;
};

export const updateJob = async (id, job) => {
  const response = await api.put(`/jobs/${id}`, job);
  return response.data;
};

export const deleteJob = async (id) => {
  await api.delete(`/jobs/${id}`);
};

export default api;
