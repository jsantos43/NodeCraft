import { api } from './client.js';

export const workersApi = {
  list: () => api.get('/worker'),
  get: (id) => api.get(`/worker/${id}`),
  create: (body) => api.post('/worker', body),
  update: (id, body) => api.put(`/worker/${id}`, body),
  delete: (id) => api.delete(`/worker/${id}`),
  listInstances: (id) => api.get(`/worker/${id}/instances`),
};
