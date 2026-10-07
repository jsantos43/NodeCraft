import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const clientSource = await readFile(new URL('./client.js', import.meta.url), 'utf8');
const authSource = await readFile(new URL('./auth.js', import.meta.url), 'utf8');
const instancesSource = await readFile(new URL('./instances.js', import.meta.url), 'utf8');

async function loadAuthApi() {
  const clientUrl = `data:text/javascript,${encodeURIComponent(
    clientSource.replace('import.meta.env.VITE_API_URL', JSON.stringify('http://localhost:3000')),
  )}`;
  const authUrl = `data:text/javascript,${encodeURIComponent(
    authSource.replace("'./client.js'", JSON.stringify(clientUrl)),
  )}`;
  return import(authUrl);
}

async function loadInstancesApi() {
  const clientUrl = `data:text/javascript,${encodeURIComponent(
    clientSource.replace('import.meta.env.VITE_API_URL', JSON.stringify('http://localhost:3000')),
  )}`;
  const instancesUrl = `data:text/javascript,${encodeURIComponent(
    instancesSource
      .replace('import.meta.env.VITE_API_URL', JSON.stringify('http://localhost:3000'))
      .replace("'./client.js'", JSON.stringify(clientUrl)),
  )}`;
  return import(instancesUrl);
}

test('a rejected login sends no refresh request', async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify({ error: 'UNATHORIZED', message: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const { authApi } = await loadAuthApi();
    await assert.rejects(authApi.login('user@example.com', 'wrong'), {
      status: 401,
      code: 'UNATHORIZED',
    });
    assert.deepEqual(requests, ['http://localhost:3000/auth/login']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a missing session sends only one refresh request', async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify({ error: 'UNATHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const { authApi } = await loadAuthApi();
    await assert.rejects(authApi.refresh(), { status: 401, code: 'UNATHORIZED' });
    assert.deepEqual(requests, ['http://localhost:3000/auth/refresh']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a protected request still refreshes once and retries', async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requests.push(url);
    const firstAttempt = url.endsWith('/auth/verify') && requests.length === 1;
    return new Response(JSON.stringify(firstAttempt
      ? { error: 'UNATHORIZED' }
      : { success: true }), {
      status: firstAttempt ? 401 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const { authApi } = await loadAuthApi();
    assert.equal((await authApi.verifyEmail()).success, true);
    assert.deepEqual(requests, [
      'http://localhost:3000/auth/verify',
      'http://localhost:3000/auth/refresh',
      'http://localhost:3000/auth/verify',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('session bootstrap and a protected request share one refresh', async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requests.push(url);
    if (url.endsWith('/auth/refresh')) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    const attempts = requests.filter((request) => request.endsWith('/auth/verify')).length;
    return new Response(JSON.stringify(attempts === 1
      ? { error: 'UNATHORIZED' }
      : { success: true }), { status: attempts === 1 ? 401 : 200 });
  };

  try {
    const { authApi } = await loadAuthApi();
    const bootstrap = authApi.refresh();
    const protectedRequest = authApi.verifyEmail();
    await Promise.all([bootstrap, protectedRequest]);
    assert.equal(requests.filter((url) => url.endsWith('/auth/refresh')).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upload renews an expired session and retries once', async () => {
  const originalFetch = globalThis.fetch;
  const originalXhr = globalThis.XMLHttpRequest;
  const uploads = [];
  const refreshes = [];

  globalThis.fetch = async (url) => {
    refreshes.push(url);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };
  globalThis.XMLHttpRequest = class {
    upload = {};
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader() {}
    send(body) {
      uploads.push({ method: this.method, url: this.url, body });
      this.status = uploads.length === 1 ? 401 : 201;
      this.responseText = JSON.stringify(uploads.length === 1
        ? { error: 'UNATHORIZED' }
        : { success: true });
      queueMicrotask(() => this.onload());
    }
  };

  try {
    const { instancesApi } = await loadInstancesApi();
    const form = new FormData();
    form.append('file', new Blob(['data']), 'sample.txt');
    assert.equal((await instancesApi.uploadFile('server-id', form, 'sample.txt')).success, true);
    assert.equal(uploads.length, 2);
    assert.equal(uploads[0].body, form);
    assert.equal(uploads[1].body, form);
    assert.deepEqual(refreshes, ['http://localhost:3000/auth/refresh']);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXhr;
  }
});
