import { setTimeout } from 'node:timers/promises';

import { verifySite, verifyRedirects } from './verify-site.mjs';
import { SITE_ORIGIN } from '../site.config.mjs';

const site = new URL(process.env.IONOS_SITE_URL || 'https://webbyu.de');
if (site.protocol !== 'https:' || !['webbyu.de', 'www.webbyu.de'].includes(site.hostname) || site.port || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('IONOS_SITE_URL must be https://webbyu.de or https://www.webbyu.de.');
}
// An older environment may still name www; check the canonical destination and
// verify www separately as an explicit permanent redirect.
site.hostname = new URL(SITE_ORIGIN).hostname;
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

await verifySite(site);
await verifyRedirects(site);
