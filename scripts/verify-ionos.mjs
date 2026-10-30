import { setTimeout } from 'node:timers/promises';
import { verifySeo } from './verify-seo.mjs';

const site = new URL(process.env.IONOS_SITE_URL || 'https://webbyu.de');
if (site.protocol !== 'https:' || !['webbyu.de', 'www.webbyu.de'].includes(site.hostname) || site.port || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('IONOS_SITE_URL must be https://webbyu.de or https://www.webbyu.de.');
}
const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Invalid release ID.');
let verified = false;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await fetch(new URL(`webbyu-release.json?release=${commit}`, site), {
      signal: AbortSignal.timeout(10000), redirect: 'error', headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok && (await response.json()).commit === commit) { verified = true; break; }
  } catch { /* A DNS/TLS/cache delay may clear during the next attempt. */ }
  if (attempt < 2) await setTimeout(5000);
}
if (!verified) throw new Error('Upload finished, but this release is not visible at the production URL. Check domain destination, HTTPS, canonical www redirect and CDN cache.');
await Promise.all(['', 'reise/', 'impressum/', 'datenschutz/'].map(async route => {
  const response = await fetch(new URL(route, site), { signal: AbortSignal.timeout(10000), redirect: 'error' });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Published page check failed: /${route}`);
  console.log(`Published page OK: /${route}`);
}));
const plainUrl = new URL('reise/?https-check=1', site);
plainUrl.protocol = 'http:';
const redirect = await fetch(plainUrl, { signal: AbortSignal.timeout(10000), redirect: 'manual' });
const location = redirect.headers.get('location');
const target = location ? new URL(location, plainUrl) : null;
if (redirect.status !== 301 || target?.protocol !== 'https:' || !['webbyu.de', 'www.webbyu.de'].includes(target.hostname) || target.pathname !== plainUrl.pathname || target.search !== plainUrl.search) {
  throw new Error('The HTTP-to-HTTPS redirect is missing or does not preserve the requested page.');
}
console.log('HTTP redirects permanently to HTTPS and preserves path and query.');
await verifySeo(site);
