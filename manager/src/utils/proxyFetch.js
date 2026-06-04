import { ServiceUnavailable } from '../errors/index.js';

async function proxyFetch(route, options) {
  let response;

  try {
    response = await fetch(route, options);
  } catch {
    throw new ServiceUnavailable('Worker is not responding!');
  }

  return response;
}

export default proxyFetch;
