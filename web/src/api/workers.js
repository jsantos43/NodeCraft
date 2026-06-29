import { api } from './client.js';

export const workersApi = {
  // Admin-only: every registered worker with full fields.
  list: () => api.get('/worker/all'),
  // Workers the current user is allowed to deploy on (safe fields only).
  // Available to non-admins, unlike list() which is admin-only.
  available: () => api.get('/worker'),
  get: (id) => api.get(`/worker/${id}`),
  create: (body) => api.post('/worker', body),
  update: (id, body) => api.put(`/worker/${id}`, body),
  delete: (id) => api.delete(`/worker/${id}`),
  listInstances: (id) => api.get(`/worker/${id}/instances`),
  heartbeats: (id, range) => api.get(`/worker/${id}/heartbeats${range ? `?range=${range}` : ''}`),
};
