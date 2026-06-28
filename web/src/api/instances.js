import { api, getAccessToken } from './client.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  // Uses XHR (not fetch) so we can report upload progress. Same endpoint/auth
  // as the rest of the client: cookie credentials + optional bearer token.
  // onProgress receives (percent, loaded, total).
  uploadFile: (id, formData, destiny, onProgress) => {
    const url = `${BASE_URL}/instance/${id}/files/upload${destiny ? `?destiny=${encodeURIComponent(destiny)}` : ''}`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.withCredentials = true;
      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (typeof onProgress === 'function') {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total);
          }
        };
      }

      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.message || data?.error || 'Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.send(formData);
    });
  },
  downloadUrl: (id, path) => `${BASE_URL}/instance/${id}/files?path=${encodeURIComponent(path)}&download=true`,
  transferFile: (id, path, destiny, action) => api.post(`/instance/${id}/files/transfer?path=${encodeURIComponent(path)}&destiny=${encodeURIComponent(destiny)}&actions=${encodeURIComponent(action)}`),
  unzipFile: (id, path, destiny) => api.post(`/instance/${id}/files/unzip?path=${encodeURIComponent(path)}&destiny=${encodeURIComponent(destiny)}`),

  consoleToken: (id) => api.post(`/instance/${id}/console`),

  listLinks: (id) => api.get(`/instance/${id}/link`),
  createLink: (id, body) => api.post(`/instance/${id}/link`, body),
  updateLink: (id, linkId, body) => api.put(`/instance/${id}/link/${linkId}`, body),
  deleteLink: (id, linkId) => api.delete(`/instance/${id}/link/${linkId}`),
};
