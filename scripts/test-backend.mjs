import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { createServer } from 'node:net';
import { request } from 'node:http';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { listFiles } from './deploy-ionos.mjs';

const php = process.env.PHP_BIN || 'php';
const packageTest = process.argv.includes('--package');
function run(args) {
  const r = spawnSync(php, args, { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(r.error?.message || r.stdout + r.stderr);
  return r.stdout;
}
if (!packageTest) {
  for (const file of listFiles('backend').filter(file => file.endsWith('.php') && !file.startsWith('vendor/'))) run(['-l', `backend/${file}`]);
  console.log(run(['backend/tests/run.php']).trim());
}

// Real public PHP entry points: no test transport is packaged or exposed by HTTP.
const fixture = mkdtempSync(join(tmpdir(), 'webbyu-http-'));
const commit = 'a'.repeat(40);
const release = `_inquiry/releases/${commit}`;
const root = packageTest ? resolve('dist') : join(fixture, 'public');
const configPath = join(fixture, 'inquiry.php');
if (packageTest) {
  const state = join(fixture, 'state'); mkdirSync(state, { mode: 0o700 });
  const values = { smtp_username: 'lukas.wagner@webbyu.de', smtp_password: 'test-only-never-send', hmac_key: 'a'.repeat(64), state_directory: state };
  writeFileSync(configPath, `<?php return json_decode(base64_decode('${Buffer.from(JSON.stringify(values)).toString('base64')}'), true);`, { mode: 0o600 });
} else {
  mkdirSync(join(root, 'api'), { recursive: true });
  mkdirSync(join(root, release, 'vendor'), { recursive: true });
  const autoload = resolve('backend/vendor/autoload.php').replaceAll('\\', '/');
  writeFileSync(join(root, release, 'vendor/autoload.php'), `<?php require ${JSON.stringify(autoload)};`);
  for (const file of ['inquiry.php', 'health.php']) writeFileSync(join(root, 'api', file), readFileSync(`backend/public/${file}`, 'utf8').replaceAll('__WEBBYU_RELEASE__', commit));
}
const port = await new Promise(resolve => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(() => resolve(port)); }); });
const child = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', root], { stdio: 'ignore', env: { ...process.env, WEBBYU_INQUIRY_CONFIG: configPath } });
const base = `http://127.0.0.1:${port}`;
function localFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: options.method || 'GET', headers: options.headers, timeout: 3000 }, res => {
      let body = '';
      res.setEncoding('utf8'); res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: new Headers(res.headers), json: async () => JSON.parse(body) }));
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('Local HTTP timeout')));
    req.end(options.body);
  });
}
try {
  for (let i = 0; i < 50; i++) {
    try { await localFetch(base + '/api/health.php'); break; } catch { if (i === 49) throw new Error('PHP HTTP server did not start'); await setTimeout(100); }
  }
  const expectedCommit = packageTest ? JSON.parse(readFileSync('dist/webbyu-release.json', 'utf8')).commit : commit;
  if (packageTest) {
    const ready = await localFetch(base + '/api/health.php');
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: 'ready', execution: 'php', contract: 1, release: expectedCommit });
    rmSync(configPath);
  }
  let r = await localFetch(base + '/api/health.php');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { status: 'unavailable', execution: 'php', contract: 1, release: expectedCommit });
  r = await localFetch(base + '/api/inquiry.php');
  assert.equal(r.status, 405); assert.equal(r.headers.get('allow'), 'POST'); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await r.json(), { status: 'invalid', fields: [] });
  const payload = { requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', website: '', goal: 'inquiries', extensions: [], projectType: 'new', timing: 'flexible', description: '', name: 'Test', email: 'test@example.org', selectedPackage: null };
  const options = { method: 'POST', headers: { Host: 'webbyu.de', Origin: 'https://webbyu.de', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  r = await localFetch(base + '/api/inquiry.php', options);
  assert.equal(r.status, 503); assert.deepEqual(await r.json(), { status: 'temporary', outcome: 'not_sent' });
  r = await localFetch(base + '/api/inquiry.php', { ...options, body: 'x'.repeat(32769) });
  assert.equal(r.status, 413); assert.equal((await r.json()).status, 'invalid');
  r = await localFetch(base + '/api/inquiry.php', { ...options, headers: { ...options.headers, Origin: 'https://evil.example' } });
  assert.equal(r.status, 403); assert.equal(r.headers.get('access-control-allow-origin'), null);
  console.log(`${packageTest ? 'Production package PHP' : 'Backend HTTP'}: execution, missing configuration, method, origin, size and no-cache checks passed.`);
} finally {
  child.kill();
  if (child.exitCode === null) await new Promise(resolve => child.once('exit', resolve));
  assert.equal(dirname(resolve(fixture)), resolve(tmpdir()));
  rmSync(fixture, { recursive: true, force: true });
}
