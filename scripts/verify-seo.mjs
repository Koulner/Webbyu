import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = 'https://webbyu.de/';
const pages = ['', 'reise/', 'impressum/', 'datenschutz/'];

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
}

function verifyPage(html, path, noindex, titles, header = '') {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  assert(title?.includes('Webbyu') && !titles.has(title), `Distinct title: /${path}`);
  titles.add(title);
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]);
  const robots = meta.filter(tag => /^(robots|googlebot)$/i.test(attribute(tag, 'name') ?? '')).map(tag => attribute(tag, 'content') ?? '').join(',');
  assert.equal(/\bnoindex\b|\bnone\b/i.test(`${robots},${header}`), noindex, `Indexing setting: /${path}`);
  const description = meta.find(tag => attribute(tag, 'name')?.toLowerCase() === 'description');
  assert((attribute(description ?? '', 'content') ?? '').length >= 30, `Description: /${path}`);
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]).filter(tag => attribute(tag, 'rel')?.toLowerCase() === 'canonical');
  assert.equal(canonical.length, 1, `Single canonical: /${path}`);
  assert.equal(attribute(canonical[0], 'href'), new URL(path, origin).href, `Canonical: /${path}`);
}

function verifyDiscovery(robots, sitemap, noindex) {
  assert.match(robots, /^User-agent:\s*\*\s*$/m);
  if (noindex) {
    assert.match(robots, /^Disallow:\s*\/\s*$/m);
  } else {
    assert(!/^Disallow:\s*\S+/m.test(robots), 'Production robots must allow crawling');
    assert.match(robots, /^Sitemap:\s*https:\/\/webbyu\.de\/sitemap\.xml\s*$/m);
  }
  assert.match(sitemap, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.deepEqual([...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1]), pages.map(path => new URL(path, origin).href));
}

export function verifySeoBuild(directory = 'dist', { noindex = false } = {}) {
  const titles = new Set();
  for (const path of pages) verifyPage(readFileSync(join(directory, path, 'index.html'), 'utf8'), path, noindex, titles);
  verifyDiscovery(readFileSync(join(directory, 'robots.txt'), 'utf8'), readFileSync(join(directory, 'sitemap.xml'), 'utf8'), noindex);
  console.log(`SEO build verified (${noindex ? 'preview excluded from indexing' : 'production crawlable'}).`);
}

/** Only public GET requests; does not submit URLs or visitor information. */
export async function verifySeo(site, fetcher = fetch) {
  const get = async path => {
    const response = await fetcher(new URL(path, site), { signal: AbortSignal.timeout(10000), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
    assert.equal(response.status, 200, `Public SEO resource: /${path}`);
    return response;
  };
  const titles = new Set();
  for (const path of pages) {
    const response = await get(path);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
    verifyPage(await response.text(), path, false, titles, response.headers.get('x-robots-tag') ?? '');
  }
  verifyDiscovery(await (await get('robots.txt')).text(), await (await get('sitemap.xml')).text(), false);
  console.log('Public pages, indexing directives, canonical URLs and sitemap verified.');
}
