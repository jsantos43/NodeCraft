import { ServiceUnavailable, PayloadTooLarge, Internal } from '../errors/index.js';
import getWorkerContext from './getWorkerContext.js';
import config from '../../config/config.js';

const workerTimeout = config.worker.timeout;

// Native fetch cancellation also applies while its response body is being read.
async function proxyFetch(route, { streaming = false, signal, ...options } = {}) {
  try {
    const timeout = streaming ? null : AbortSignal.timeout(workerTimeout);
    const requestSignal = signal && timeout
      ? AbortSignal.any([signal, timeout]) : signal || timeout;
    return await fetch(route, { ...options, signal: requestSignal });
  } catch {
    throw new ServiceUnavailable(
      'Worker communication failed or timed out. The operation may have been accepted; check its status before retrying.',
    );
  }
}

async function discardWorkerResponse(response) {
  await response.body?.cancel();
}

async function proxyToWorker(id, {
  route,
  method = 'GET',
  body,
  headers,
  streaming = false,
}) {
  const { worker } = await getWorkerContext(id);

  const options = {
    method,
    streaming,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      Authorization: `Bearer ${worker.secret}`,
    },
  };

  if (typeof body?.pipe === 'function') {
    options.body = body;
    options.duplex = 'half';
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  return proxyFetch(`${worker.url}/server/${id}${route}`, options);
}

async function readWorkerJson(response) {
  let body;
  try {
    body = await response.text();
  } catch {
    throw new ServiceUnavailable(
      'Worker communication failed or timed out. The operation may have been accepted; check its status before retrying.',
    );
  }
  try {
    return JSON.parse(body);
  } catch {
    if (response.status === 413) throw new PayloadTooLarge('The worker refused the file size');
    if (response.ok) throw new Internal('Worker answered an unreadable response!');
    throw new ServiceUnavailable(`Worker answered ${response.status} with an unreadable body`);
  }
}

async function sendWorkerJson(res, response, successStatus = 200) {
  const result = await readWorkerJson(response);
  return res.status(response.ok ? successStatus : response.status).json(result);
}

export {
  readWorkerJson, proxyToWorker, sendWorkerJson, discardWorkerResponse,
};
export default proxyFetch;
