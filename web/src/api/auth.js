import {
  api, setAccessToken, clearTokens, restoreSession, ApiError,
} from './client.js';

export const authApi = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password }, { skipAuthRefresh: true });
    if (data.accessToken) setAccessToken(data.accessToken);
    return data;
  },

  async refresh() {
    if (!(await restoreSession())) {
      throw new ApiError(401, 'Session could not be renewed', 'UNATHORIZED');
    }
    return { success: true };
  },

  async logout() {
    try {
      await api.post('/auth/logout', undefined, { skipAuthRefresh: true });
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
    return api.post('/auth/reset', { token, password }, { skipAuthRefresh: true });
  },
};
