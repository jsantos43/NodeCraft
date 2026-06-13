import { api } from './client.js';

export const instancesApi = {
  list: () => api.get('/instance'),
  get: (id) => api.get(`/instance/${id}`),
  create: (body) => api.post('/instance', body),
  update: (id, body) => api.put(`/instance/${id}`, body),
  delete: (id) => api.delete(`/instance/${id}`),

  run: (id) => api.post(`/instance/${id}/run`),
  stop: (id) => api.post(`/instance/${id}/stop`),
  restart: (id) => api.post(`/instance/${id}/restart`),
  backup: (id) => api.post(`/instance/${id}/backup`),
  remapPort: (id) => api.put(`/instance/${id}/remap`),

  listFiles: (id, path) => api.get(`/${id}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  createFile: (id, body) => api.post(`/${id}/files/create`, body),
  updateFile: (id, content, path) => api.put(`/${id}/files/edit?path=${encodeURIComponent(path)}`, { content }),
  deleteFile: (id, path) => api.delete(`/${id}/files/delete?path=${encodeURIComponent(path)}`),
  uploadFile: (id, formData, destiny) => {
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/${id}/files/upload${destiny ? `?destiny=${encodeURIComponent(destiny)}` : ''}`;
    return fetch(url, { method: 'POST', body: formData, credentials: 'include' }).then(r => r.json());
  },

  listLinks: (id) => api.get(`/${id}/link`),
  createLink: (id, body) => api.post(`/${id}/link`, body),
  updateLink: (id, linkId, body) => api.put(`/${id}/link/${linkId}`, body),
  deleteLink: (id, linkId) => api.delete(`/${id}/link/${linkId}`),
};
