import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { request } from 'node:http';
import { verifyInquiry } from './verify-inquiry.mjs';
import { verifySite } from './verify-site.mjs';

const commit = JSON.parse(readFileSync('dist/webbyu-release.json', 'utf8')).commit;
const port = process.env.APACHE_TEST_PORT || '8088';
const fetcher = (url, options = {}) => new Promise((resolve, reject) => {
  const req = request(`http://127.0.0.1:${port}${url.pathname}${url.search}`, {
    method: options.method || 'GET', timeout: 10000,
    headers: { ...options.headers, Host: 'webbyu.de', 'X-Forwarded-Proto': 'https' },
  }, res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })));
  });
  req.on('error', reject); req.on('timeout', () => req.destroy(new Error('Apache test timeout')));
  req.end(options.body);
});
await verifyInquiry(new URL('https://webbyu.de'), commit, fetcher);
await verifySite(new URL('https://webbyu.de'), fetcher, { noindex: /<meta name="robots" content="noindex/.test(readFileSync('dist/index.html', 'utf8')) });
const healthy = await fetcher(new URL('https://webbyu.de/api/health.php'));
assert.equal((await healthy.json()).status, 'ready');
console.log('Apache/PHP production-package integration passed.');
