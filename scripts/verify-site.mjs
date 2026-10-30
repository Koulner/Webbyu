import assert from 'node:assert/strict';

/** Read-only checks; no valid inquiry or SMTP request is submitted. */
export async function verifySite(site, fetcher = fetch, { noindex = false } = {}) {
  const get = path => fetcher(new URL(path, site), { signal: AbortSignal.timeout(10000), redirect: 'error' });
  const pages = ['', 'reise/', 'impressum/', 'datenschutz/'];
  const assets = new Set();
  const titles = new Set();
  for (const path of pages) {
    const response = await get(path);
    assert.equal(response.status, 200, `Page /${path}`);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert(title?.includes('Webbyu'), `Page title /${path}`);
    assert(!titles.has(title), 'Page titles must be distinct');
    titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]{30,}"/);
    assert(html.includes(`<link rel="canonical" href="https://webbyu.de/${path}"`), `Canonical /${path}`);
    assert.equal(/<meta name="robots" content="noindex/.test(html), noindex, `Indexing /${path}`);
    for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)) assets.add(match[1]);
  }
  const missing = await get('nicht-vorhanden/ap06-pruefung');
  assert.equal(missing.status, 404, 'A missing route must return HTTP 404');
  const errorHtml = await missing.text();
  assert.match(errorHtml, /Diese Seite fehlt/);
  assert.match(errorHtml, /noindex/);
  assert.match(errorHtml, /href="mailto:lukas\.wagner@webbyu\.de"/);
  const robots = await get('robots.txt');
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), noindex ? /Disallow: \// : /Sitemap: https:\/\/webbyu.de\/sitemap.xml/);
  const sitemap = await get('sitemap.xml');
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.deepEqual([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), pages.map(path => `https://webbyu.de/${path}`));
  for (const path of assets) {
    const response = await get(path);
    assert.equal(response.status, 200, `Asset ${path}`);
    if (path.endsWith('.css')) {
      const css = await response.text();
      for (const match of css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)) {
        const font = await fetcher(new URL(match[1], new URL(path, site)), { signal: AbortSignal.timeout(10000), redirect: 'error' });
        assert.equal(font.status, 200, `Font ${match[1]}`);
        assert((await font.arrayBuffer()).byteLength > 1000, 'Font must contain data');
      }
    }
  }
  console.log('Page metadata, robots/sitemap, real HTTP 404 and entry assets/fonts passed.');
}
