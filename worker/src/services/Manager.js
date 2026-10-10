import config from '../../config/config.js';
import logger from '../../config/logger.js';

class Manager {
  static buildRequest(path, method, body = null) {
    const requestUrl = `${config.manager.url}/worker/${config.app.id}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.manager.apiKey}`,
      },
      // Without a timeout a stalled manager makes requests pile up here forever.
      signal: AbortSignal.timeout(config.manager.timeout),
    };

    if (body) options.body = JSON.stringify(body);

    return { requestUrl, options };
  }

  static async getInstances() {
    try {
      const { requestUrl, options } = Manager.buildRequest('/instances', 'GET');

      const result = await fetch(requestUrl, options);

      if (!result.ok) {
        throw new Error(`Manager answered ${result.status} to the instance list request`);
      }

      const data = await result.json();

      if (!Array.isArray(data?.instances)) {
        throw new Error('Manager answered the instance list without a valid instances array');
      }

      return data.instances;
    } catch (err) {
      logger.error({ err }, 'Error to request instance to Manager');

      throw err;
    }
  }

  static async sendInstanceDetails(instanceId, info) {
    try {
      const { requestUrl, options } = Manager.buildRequest(`/instances/${instanceId}`, 'PUT', info);

      const result = await fetch(requestUrl, options);

      await result.body?.cancel();

      if (!result.ok) {
        throw new Error(`Manager answered ${result.status} to the instance details report`);
      }

      return true;
    } catch (err) {
      logger.error({ err }, 'Error to send instance details to Manager');

      return false;
    }
  }

  static async reportBackupResult(instanceId, result) {
    try {
      const { requestUrl, options } = Manager.buildRequest(`/instances/${instanceId}/backup`, 'PUT', result);

      const response = await fetch(requestUrl, options);

      await response.body?.cancel();
    } catch (err) {
      logger.error({ err }, 'Error to report backup result to Manager');
    }
  }

  static async getConsoleAccess(instanceId, token) {
    const { requestUrl, options } = Manager.buildRequest(`/instances/${instanceId}/console-access`, 'POST', { token });

    const response = await fetch(requestUrl, options);
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Manager answered ${response.status} to the console access check`);
    }

    const access = await response.json();
    if (typeof access?.canRead !== 'boolean' || typeof access?.canWrite !== 'boolean') {
      throw new Error('Manager answered the console access check without valid permissions');
    }

    return access;
  }
}

export default Manager;
