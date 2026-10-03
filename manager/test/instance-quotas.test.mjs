// Run: node --experimental-vm-modules test/instance-quotas.test.mjs
// Load production modules with in-memory persistence and worker transport doubles.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import * as errors from '../src/errors/index.js';
import * as instanceViews from '../src/utils/instanceView.js';

function moduleStub(exports) {
  return new SyntheticModule(Object.keys(exports), function initialize() {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  });
}

async function load(path, imports) {
  const module = new SourceTextModule(await readFile(new URL(path, import.meta.url), 'utf8'));
  await module.link((name) => {
    assert.ok(name in imports, `Unexpected dependency: ${name}`);
    return moduleStub(imports[name]);
  });
  await module.evaluate();
  return module.namespace.default;
}

async function fixture(overrides = {}) {
  const user = {
    id: 'owner', maxMemory: 4096, maxCpu: 4, maxDisk: 100,
    maxInstances: 5, allowedGames: ['minecraft'], allowedWorkers: ['worker'],
    ...overrides,
  };
  const instance = {
    id: 'target', ownerId: user.id, status: 'stopped', memory: 2048, cpu: 2,
    diskUsage: 20, name: 'Original',
    async update(data) { Object.assign(this, data); },
  };
  const rows = [instance];
  const calls = { worker: 0, transactions: 0, gameWrites: 0 };
  const models = {
    Instance: {
      async findAll({ where, attributes }) {
        assert.equal(where.ownerId, user.id);
        return rows.filter(row => row.ownerId === where.ownerId)
          .map(row => Object.fromEntries(attributes.map(key => [key, row[key]])));
      },
      async findByPk() { return instance; },
      build(data) { return { memory: 1024, cpu: 2, ...data }; },
    },
    db: { async transaction(fn) { calls.transactions++; return fn({}); } },
    gameModels: {}, instanceInclude: [],
  };
  const User = { async readOne(id) { assert.equal(id, user.id); return user; } };
  const Limit = await load('../src/services/Limit.js', {
    '../models/index.js': models, './User.js': { default: User }, '../errors/index.js': errors,
  });
  const Service = await load('../src/services/Instance.js', {
    sequelize: { Op: {} }, '../models/index.js': models, '../errors/index.js': errors,
    './Link.js': { default: {} }, './User.js': { default: User },
    './Worker.js': { default: {} }, '../../config/config.js': { default: {} },
    './Limit.js': { default: Limit },
    '../utils/instanceView.js': instanceViews,
  });
  const Controller = await load('../src/controllers/Instance.js', {
    jsonwebtoken: { default: {} }, '../errors/index.js': errors,
    '../services/Instance.js': { default: Service }, '../services/Auth.js': { default: { async permissionsForInstance() { return ['instance:read']; } } },
    '../utils/instanceView.js': instanceViews,
    '../services/Limit.js': { default: Limit },
    '../utils/getWorkerContext.js': {
      default: async () => ({ instance, worker: { url: 'http://worker.test', secret: 'test' } }),
    },
    '../utils/proxyFetch.js': { discardWorkerResponse: async () => {},
      default: async () => { calls.worker++; return { ok: true }; },
    },
  });
  async function control(action) {
    let error;
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await Controller[action]({ params: { id: instance.id }, user: { id: 'collaborator' } }, res,
      err => { error = err; });
    return { error, res };
  }
  return { user, instance, rows, calls, Limit, Service, control };
}

function isForbidden(error) {
  assert.equal(error.status, 403);
  assert.equal(error.code, 'FORBIDDEN');
  return true;
}

for (const action of ['run', 'restart']) {
  for (const resource of ['memory', 'cpu', 'disk']) {
    test(`${action}: refuses excess ${resource} before contacting worker`, async () => {
      const f = await fixture();
      if (resource === 'memory') f.instance.memory = 4097;
      if (resource === 'cpu') f.instance.cpu = 5;
      if (resource === 'disk') f.instance.diskUsage = 101;
      isForbidden((await f.control(action)).error);
      assert.equal(f.calls.worker, 0);
    });
  }
  test(`${action}: accepts exact owner quotas for a stopped instance`, async () => {
    const f = await fixture({ maxMemory: 2048, maxCpu: 2, maxDisk: 20 });
    const { error, res } = await f.control(action);
    assert.equal(error, undefined);
    assert.equal(res.code, 200);
    assert.equal(f.calls.worker, 1);
  });
}

test('restart: counts running target once and preserves ordinary usage totals', async () => {
  const f = await fixture({ maxMemory: 2048, maxCpu: 2 });
  f.instance.status = 'running';
  assert.equal((await f.control('restart')).error, undefined);
  assert.equal(f.calls.worker, 1);
  const { usage } = await f.Limit.readUsage(f.user.id);
  assert.equal(usage.memory, 2048);
  assert.equal(usage.cpu, 2);
  assert.equal(usage.count, 1);
  assert.equal(usage.disk, 20);
});

for (const resource of ['memory', 'cpu', 'disk']) {
  test(`restart: includes other instances' ${resource} usage and target disk`, async () => {
    const f = await fixture();
    f.instance.status = 'running';
    f.rows.push({
      id: 'other', ownerId: f.user.id, status: 'running', memory: 2048, cpu: 2,
      diskUsage: 80,
      ...(resource === 'memory' ? { memory: 2049 } : {}),
      ...(resource === 'cpu' ? { cpu: 3 } : {}),
      ...(resource === 'disk' ? { diskUsage: 81 } : {}),
    });
    isForbidden((await f.control('restart')).error);
    assert.equal(f.calls.worker, 0);
  });
}

for (const changes of [{ memory: 4097 }, { cpu: 5 }]) {
  test(`update: refuses ${JSON.stringify(changes)} without persisting any fields`, async () => {
    const f = await fixture();
    f.instance.type = 'minecraft';
    f.instance.minecraft = { async update() { f.calls.gameWrites++; } };
    await assert.rejects(f.Service.update('target', { ...changes, name: 'Changed' }, { seed: 'new' }), isForbidden);
    assert.equal(f.instance.name, 'Original');
    assert.equal(f.instance.memory, 2048);
    assert.equal(f.instance.cpu, 2);
    assert.equal(f.calls.transactions, 0);
    assert.equal(f.calls.gameWrites, 0);
  });
}

test('update: allows exact individual quotas despite other running instances', async () => {
  const f = await fixture();
  f.rows.push({ id: 'other', ownerId: f.user.id, status: 'running', memory: 4096, cpu: 4, diskUsage: 0 });
  await f.Service.update('target', { memory: 4096, cpu: 4 });
  assert.equal(f.instance.memory, 4096);
  assert.equal(f.instance.cpu, 4);
  isForbidden((await f.control('run')).error);
});

test('update: checks retained resource values on partial resource edits', async () => {
  const f = await fixture();
  f.instance.cpu = 5;
  await assert.rejects(f.Service.update('target', { memory: 1024 }), isForbidden);
  await f.Service.update('target', { cpu: 4 });
  assert.equal(f.instance.cpu, 4);
});

test('update: unrelated edits remain possible after quota reduction', async () => {
  const f = await fixture({ maxMemory: 1024 });
  await f.Service.update('target', { name: 'Renamed' });
  assert.equal(f.instance.name, 'Renamed');
});

test('create: preserves default resource validation', async () => {
  const f = await fixture({ maxMemory: 1024, maxCpu: 2 });
  const data = { type: 'minecraft', workerId: 'worker' };
  await f.Limit.verifyCanCreate(f.user.id, data);
  await assert.rejects(f.Limit.verifyCanCreate(f.user.id, { ...data, memory: 2048 }), isForbidden);
  await assert.rejects(f.Limit.verifyCanCreate(f.user.id, { ...data, cpu: 3 }), isForbidden);
});
