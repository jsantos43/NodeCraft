import { api, setAccessToken, clearTokens } from './client.js';

export const authApi = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data.accessToken) setAccessToken(data.accessToken);
    return data;
  },

  async refresh() {
    const data = await api.post('/auth/refresh');
    if (data.accessToken) setAccessToken(data.accessToken);
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async verifyEmail() {
    return api.post('/auth/verify');
  },

  async validateAccount(token) {
    return api.post('/auth/validate', { token });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot', { email });
  },

  async resetPassword(token, password) {
    return api.post('/auth/reset', { token, password });
  },
};
