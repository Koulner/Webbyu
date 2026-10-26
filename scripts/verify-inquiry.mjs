/** Readiness and rejection probes only: never sends a valid inquiry or SMTP message. */
export async function verifyInquiry(site, commit, fetcher = fetch) {
  const probe = (path, options = {}) => fetcher(new URL(path, site), {
    signal: AbortSignal.timeout(10000), redirect: 'error', ...options,
    headers: { 'Cache-Control': 'no-cache', ...options.headers },
  });
  const json = async response => {
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Inquiry PHP execution check failed: expected JSON, possible missing PHP handler.');
    const body = await response.text();
    if (body.length > 4096) throw new Error('Unexpected inquiry response.');
    try { return JSON.parse(body); } catch { throw new Error('Inquiry PHP execution check failed: invalid JSON.'); }
  };
  const health = await probe(`api/health.php?release=${commit}`);
  const status = await json(health);
  if (status.execution !== 'php' || status.contract !== 1 || status.release !== commit) throw new Error('Inquiry PHP execution/release check failed.');
  if (health.status !== 200 || status.status !== 'ready') throw new Error('Inquiry backend unavailable: privately verify PHP, configuration, permissions and state. SMTP and inbox are not tested by this probe.');
  const get = await probe('api/inquiry.php');
  if (get.status !== 405 || get.headers.get('allow') !== 'POST' || get.headers.get('cache-control') !== 'no-store' || (await json(get)).status !== 'invalid') throw new Error('Inquiry method/cache guard failed.');
  for (const origin of [site.origin, 'https://invalid.example']) {
    const result = await probe('api/inquiry.php', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' });
    if (result.status !== (origin === site.origin ? 422 : 403) || (await json(result)).status !== 'invalid' || result.headers.has('access-control-allow-origin')) throw new Error('Inquiry input/origin guard failed.');
  }
  for (const path of [`_inquiry/releases/${commit}/vendor/autoload.php`, `_inquiry/releases/${commit}/src/Configuration.php`, '_inquiry/.htaccess', 'webbyu-private/inquiry.php', 'backend/private-config.example.php', '.env', 'composer.lock', `api/.webbyu-upload-${commit}-inquiry.php`]) {
    const response = await probe(path);
    if (![403, 404].includes(response.status)) throw new Error('A protected backend/configuration path is publicly reachable.');
    await response.arrayBuffer();
  }
  console.log('Inquiry PHP, readiness, request guards and protected paths OK; no email sent.');
}
