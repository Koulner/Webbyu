import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { request } from 'node:http';
import { verifyInquiry } from './verify-inquiry.mjs';
import { verifySite, verifyRedirects } from './verify-site.mjs';
import { SITE_ORIGIN, pages } from '../site.config.mjs';

const commit = JSON.parse(readFileSync('dist/webbyu-release.json', 'utf8')).commit;
const port = process.env.APACHE_TEST_PORT || '8088';
const fetcher = (url, options = {}) => new Promise((resolve, reject) => {
  const req = request(`http://127.0.0.1:${port}${url.pathname}${url.search}`, {
    method: options.method || 'GET', timeout: 10000,
    headers: { ...options.headers, Host: url.host, 'X-Forwarded-Proto': url.protocol === 'https:' ? 'https' : 'http' },
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
await verifyRedirects(new URL(SITE_ORIGIN), fetcher);
const healthy = await fetcher(new URL('https://webbyu.de/api/health.php'));
assert.equal((await healthy.json()).status, 'ready');
// Host canonicalization must never turn an inquiry POST into a redirected GET.
for (const hostname of ['webbyu.de', 'www.webbyu.de']) {
  const rejected = await fetcher(new URL(`https://${hostname}/api/inquiry.php`), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE_ORIGIN }, body: '{}',
  });
  assert([403, 422].includes(rejected.status), 'Invalid inquiry must be rejected without redirect or delivery');
  assert.equal(rejected.headers.get('location'), null, 'API must not receive an SEO redirect');
}
const html = readFileSync(`dist/${pages.find(page => page.kind === 'home').file}`, 'utf8');
const hashedAsset = html.match(/(?:src|href)="(\/assets\/[^"/]+-[A-Za-z0-9_-]{8}\.(?:js|css))"/)?.[1];
assert(hashedAsset, 'Build must expose a content-hashed entry asset');
const cachedAsset = await fetcher(new URL(hashedAsset, SITE_ORIGIN));
assert.match(cachedAsset.headers.get('cache-control') ?? '', /max-age=31536000.*immutable/);
const favicon = await fetcher(new URL('/favicon.svg', SITE_ORIGIN));
assert.match(favicon.headers.get('cache-control') ?? '', /max-age=86400/);
assert(!/immutable/.test(favicon.headers.get('cache-control') ?? ''), 'Unhashed files must not be immutable');
const entry = await fetcher(new URL('/', SITE_ORIGIN));
assert.match(entry.headers.get('cache-control') ?? '', /no-cache.*must-revalidate/);
const compressed = await fetcher(new URL('/', SITE_ORIGIN), { headers: { 'Accept-Encoding': 'gzip' } });
assert.equal(compressed.headers.get('content-encoding'), 'gzip', 'Apache must compress HTML when gzip is supported');
for (const response of [entry, healthy, await fetcher(new URL('/does-not-exist/', SITE_ORIGIN))]) {
  assert.match(response.headers.get('strict-transport-security') ?? '', /max-age=31536000/, 'HTTPS must stick in the browser');
  assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self'", 'Foreign sites must not frame webbyu.de');
}
console.log('Apache/PHP production-package integration passed.');
