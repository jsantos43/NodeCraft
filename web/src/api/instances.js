import { api } from './client.js';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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

  listFiles: (id, path) => api.get(`/instance/${id}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  createFile: (id, body, destiny) => api.post(`/instance/${id}/files/create?destiny=${encodeURIComponent(destiny || '')}`, body),
  updateFile: (id, content, path) => api.put(`/instance/${id}/files/edit?path=${encodeURIComponent(path)}`, { content }),
  deleteFile: (id, path) => api.delete(`/instance/${id}/files/delete?path=${encodeURIComponent(path)}`),
  uploadFile: (id, formData, destiny) => {
    const url = `${BASE_URL}/instance/${id}/files/upload${destiny ? `?destiny=${encodeURIComponent(destiny)}` : ''}`;
    return fetch(url, { method: 'POST', body: formData, credentials: 'include' }).then(r => r.json());
  },
  downloadUrl: (id, path) => `${BASE_URL}/instance/${id}/files?path=${encodeURIComponent(path)}&download=true`,

  listLinks: (id) => api.get(`/instance/${id}/link`),
  createLink: (id, body) => api.post(`/instance/${id}/link`, body),
  updateLink: (id, linkId, body) => api.put(`/instance/${id}/link/${linkId}`, body),
  deleteLink: (id, linkId) => api.delete(`/instance/${id}/link/${linkId}`),
};
