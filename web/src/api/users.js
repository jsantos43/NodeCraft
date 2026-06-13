import { api } from './client.js';

export const usersApi = {
  me: () => api.get('/user'),
  list: () => api.get('/user/all'),
  get: (id) => api.get(`/user/${id}`),
  create: (body) => api.post('/user', body),
  update: (body) => api.put('/user', body),
  updateOther: (id, body) => api.put(`/user/${id}`, body),
  delete: () => api.delete('/user'),
  deleteOther: (id) => api.delete(`/user/${id}`),
};
