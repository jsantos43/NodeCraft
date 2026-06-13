import config from '../../config/config.js';
import logger from '../../config/logger.js';

class Manager {
  static async getInstances() {
    try {
      const requestUrl = `${config.manager.url}/worker/${config.app.id}/instances`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.manager.apiKey}`,
      };

      const result = await fetch(requestUrl, {
        method: 'GET',
        headers,
      });

      const data = await result.json();

      return data?.instances || [];
    } catch (err) {
      logger.error({ err }, 'Error to request instance to Manager');

      throw err;
    }
  }

  static async sendInstanceDetails(instanceId, info) {
    try {
      const requestUrl = `${config.manager.url}/worker/${config.app.id}/instances/${instanceId}`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.manager.apiKey}`,
      };

      const result = await fetch(requestUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(info),
      });

      await result.json();
    } catch (err) {
      logger.error({ err }, 'Error to send instance details to Manager');
    }
  }

  static async reportBackupResult(instanceId, result) {
    try {
      const requestUrl = `${config.manager.url}/worker/${config.app.id}/instances/${instanceId}/backup`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.manager.apiKey}`,
      };

      await fetch(requestUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(result),
      });
    } catch (err) {
      logger.error({ err }, 'Error to report backup result to Manager');
    }
  }
}

export default Manager;
