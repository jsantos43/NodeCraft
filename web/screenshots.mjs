import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3030'; // override: BASE=... node screenshots.mjs
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const ADMIN = {
  id: 'usr_demo', name: 'Admin Demo', email: 'admin@nodecraft.dev',
  admin: true, verified: true, username: 'admin',
  maxInstances: 5, maxCpu: 8, maxMemory: 16384, maxDisk: 51200,
  allowedGames: ['minecraft', 'terraria', 'kerbal'], allowedWorkers: ['w1abc123'],
};
const WORKER = { id: 'w1abc123', name: 'worker-eu-1', url: 'http://10.0.0.2:9184', healthy: true, cpuUsage: 34, memorieUsed: 6000, memorieTotal: 16000, diskAvailable: 40000, lastSeenAt: Date.now() };
const USERS = [ADMIN, { id: 'u2', name: 'Jane Player', email: 'jane@example.dev', admin: false }];
const INSTANCE = {
  id: 'i1', name: 'survival-smp', type: 'minecraft', status: 'running',
  port: 5621, memory: 4096, cpu: 2, maxPlayers: 20, owner: 'usr_demo',
  workerId: 'w1abc123', worker: WORKER,
  lastBackupAt: Date.now() - 3600_000, lastBackupStatus: 'success', diskUsage: 2400,
  minecraft: { software: 'paper', version: '1.20.4', bedrock: true, difficulty: 'normal', gamemode: 'survival', motd: 'Welcome to survival-smp', pvp: true, onlineMode: true, viewDistance: 10 },
};
const INSTANCES = [INSTANCE, { id: 'i2', name: 'creative-flat', type: 'minecraft', status: 'stopped', port: 5622, workerId: 'w1abc123', owner: 'usr_demo', memory: 2048 }];
const LINKS = [{ id: 'l1', userId: 'u2', user: USERS[1], gamertags: ['JaneMC', 'Jane_PE'], permissions: ['instance:read', 'instance:console:read', 'instance:files:read'], access: 'always', privileges: false }];
const FILES = { content: [
  { name: 'world', type: 'directory' }, { name: 'plugins', type: 'directory' },
  { name: 'server.properties', type: 'file' }, { name: 'ops.json', type: 'file' },
  { name: 'server-icon-really-long-filename-to-test-wrapping.png', type: 'file' },
] };
const PERMS_OWNER = { permissions: ['instance:read','instance:edit','instance:execute','instance:backup','instance:console:read','instance:console:write','instance:files:read','instance:files:write','instance:files:edit','instance:owner'] };

// glob -> body. Specific routes registered AFTER the catch-all so they win.
const routes = [
  ['**/auth/refresh',                { accessToken: 'fake.jwt.token' }],
  ['**/user',                        { user: ADMIN }],
  ['**/user/all',                    { users: USERS }],
  ['**/user/u2',                     { user: { ...USERS[1], maxInstances: 2, maxCpu: 2, maxMemory: 2048, maxDisk: 10240, allowedGames: ['minecraft'], allowedWorkers: [] } }],
  ['**/worker/all',                  { workers: [WORKER] }],
  ['**/worker',                      { workers: [WORKER] }],
  ['**/worker/w1abc123',             { worker: WORKER }],
  ['**/worker/w1abc123/**',          { instances: [INSTANCE] }],
  ['**/instance',                    { instances: INSTANCES }],
  ['**/instance/i1',                 { instance: INSTANCE }],
  ['**/instance/i1/permissions',     PERMS_OWNER],
  ['**/instance/i1/link',            { links: LINKS }],
  ['**/instance/i1/files**',         FILES],
];

const browser = await chromium.launch();

async function newMobile(width = 375) {
  const ctx = await browser.newContext({ viewport: { width, height: 812 }, deviceScaleFactor: 2 });
  await ctx.route('**/*', r => (['xhr', 'fetch'].includes(r.request().resourceType()))
    ? r.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    : r.continue());
  for (const [glob, body] of routes) {
    await ctx.route(glob, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }));
  }
  return ctx;
}

const shot = async (page, name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); };

// ── Pass 1: every top-level screen at 375px ──
{
  const ctx = await newMobile(375);
  const page = await ctx.newPage();
  const PAGES = ['/', '/login', '/register', '/forgot', '/reset', '/dashboard', '/servers', '/workers', '/users', '/settings', '/servers/create', '/workers/w1abc123', '/users/u2'];
  for (const p of PAGES) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await shot(page, 'm' + (p === '/' ? '_landing' : p.replace(/\//g, '_')));
  }
  // Drawer open
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await page.click('.topbar-menu-btn'); await shot(page, 'm_drawer-open');
  await ctx.close();
}

// ── Pass 2: ServerDetails, each tab, at 375px ──
{
  const ctx = await newMobile(375);
  const page = await ctx.newPage();
  await page.goto(BASE + '/servers/i1', { waitUntil: 'networkidle' });
  await shot(page, 'm_detail_overview');
  for (const label of ['Console', 'Files', 'Backups', 'Variables', 'Connect', 'Players', 'Admin']) {
    const tab = page.locator('.server-tab', { hasText: label });
    if (await tab.count()) { await tab.first().click(); await shot(page, 'm_detail_' + label.toLowerCase()); }
  }
  await ctx.close();
}

// ── Pass 3: 320px stress on the richest screens ──
{
  const ctx = await newMobile(320);
  const page = await ctx.newPage();
  for (const [p, name] of [['/servers/create', 's_create'], ['/servers/i1', 's_detail'], ['/dashboard', 's_dashboard']]) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await shot(page, '320_' + name);
  }
  await ctx.close();
}

await browser.close();
console.log(`Done -> ${OUT}/`);
