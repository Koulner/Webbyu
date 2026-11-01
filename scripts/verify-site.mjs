import assert from 'node:assert/strict';
import { SITE_ORIGIN, pages } from '../site.config.mjs';

// Release verification runs with Node alone, without installed dev packages.
function decode(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, 'gi'))].map(match => attributes(match[1]));
}

function textOnly(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function walk(value, visit) {
  if (Array.isArray(value)) value.forEach(item => walk(item, visit));
  else if (value && typeof value === 'object') {
    visit(value);
    Object.values(value).forEach(item => walk(item, visit));
  }
}

function schemaNodes(html, path) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (attributes(match[1]).type?.toLowerCase() !== 'application/ld+json') continue;
    let data;
    try { data = JSON.parse(match[2]); } catch { assert.fail(`Invalid JSON-LD ${path}`); }
    assert(data && typeof data === 'object', `JSON-LD must contain an object ${path}`);
    walk(data, node => {
      const types = [].concat(node['@type'] ?? []);
      assert(!types.some(type => /^(?:LocalBusiness|ProfessionalService|GeoCoordinates|GeoShape|Place|AggregateRating|Review)$/.test(type)), `Unwanted local/review schema ${path}`);
      assert(!Object.keys(node).some(key => /^(?:geo|hasMap|latitude|longitude|aggregateRating|review|reviewRating)$/.test(key)), `Unwanted location/review property ${path}`);
      if (types.length) nodes.push(node);
    });
  }
  return nodes;
}

/** Validate the actual HTTP source, not a JavaScript-rendered DOM. */
export function verifyHtmlPage(page, html, { noindex = false, xRobotsTag = '' } = {}) {
  assert(!html.includes('%BASE_URL%'), `Unresolved base URL ${page.path}`);
  const title = decode(html.match(/<title\b[^>]*>([^<]+)<\/title\s*>/i)?.[1] ?? '').trim();
  assert.equal(title, page.title, `Page title ${page.path}`);
  const metas = tags(html, 'meta');
  const descriptions = metas.filter(meta => meta.name?.toLowerCase() === 'description');
  assert.equal(descriptions.length, 1, `Single description ${page.path}`);
  assert.equal(descriptions[0].content, page.description, `Page description ${page.path}`);
  const canonicals = tags(html, 'link').filter(link => link.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if (page.kind === 'error') assert.equal(canonicals.length, 0, 'Error page must not claim a canonical content URL');
  else {
    assert.equal(canonicals.length, 1, `Single canonical ${page.path}`);
    assert.equal(canonicals[0].href, new URL(page.path, SITE_ORIGIN).href, `Canonical ${page.path}`);
  }
  const robots = metas.filter(meta => /^(?:robots|googlebot)$/i.test(meta.name ?? '')).map(meta => meta.content ?? '').join(',');
  const directives = `${robots},${xRobotsTag}`;
  assert.equal(/\b(?:noindex|none)\b/i.test(directives), noindex || !page.indexable, `Indexing ${page.path}`);
  if (!noindex && page.indexable) assert(!/\b(?:nofollow|nosnippet|none)\b/i.test(directives), `Search visibility ${page.path}`);

  // A noscript fallback alone must not make an empty client-rendered shell pass.
  const staticHtml = html.replace(/<!--[^]*?-->/g, '').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const main = staticHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1];
  assert(main && textOnly(main).length >= 150, `Substantial static main content ${page.path}`);
  const headings = [...staticHtml.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)];
  assert.equal(headings.length, 1, `Exactly one static H1 ${page.path}`);
  assert(textOnly(headings[0][1]).length > 5, `Meaningful H1 ${page.path}`);
  const links = tags(staticHtml, 'a').filter(link => link.href !== undefined).map(link => link.href);
  assert(links.length > 0, `Static navigation ${page.path}`);
  const ids = new Set([...staticHtml.matchAll(/<[a-z][\w:-]*\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(match => attributes(match[1]).id).filter(Boolean));

  const nodes = schemaNodes(html, page.path);
  const hasType = type => nodes.some(node => [].concat(node['@type']).includes(type));
  if (page.kind === 'home') for (const type of ['Organization', 'WebSite', 'Person']) assert(hasType(type), `${type} schema ${page.path}`);
  if (page.kind === 'content') assert(hasType('BreadcrumbList'), `Breadcrumb schema ${page.path}`);
  if (page.kind === 'content' && /^\/ratgeber\/.+\/$/.test(page.path)) {
    assert(hasType('Article'), `Article schema ${page.path}`);
    const article = nodes.find(node => [].concat(node['@type']).includes('Article'));
    assert(article.headline && article.author, `Article headline and author ${page.path}`);
  }
  const assets = [
    ...tags(html, 'script').map(tag => tag.src),
    ...tags(html, 'link').filter(tag => /\b(?:stylesheet|icon|modulepreload)\b/i.test(tag.rel ?? '')).map(tag => tag.href),
    ...tags(staticHtml, 'img').map(tag => tag.src),
  ].filter(Boolean);
  return { title, links, ids, assets };
}

/** Read-only checks; no valid inquiry or SMTP request is submitted. */
export async function verifySite(site, fetcher = fetch, { noindex = false } = {}) {
  const root = new URL(site);
  const get = path => fetcher(new URL(path, root), { signal: AbortSignal.timeout(10000), redirect: 'error' });
  const checked = new Map();
  const titles = new Set();
  const assets = new Set();
  for (const page of pages.filter(page => page.kind !== 'error')) {
    const response = await get(page.path.slice(1));
    assert.equal(response.status, 200, `Page ${page.path}`);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
    const result = verifyHtmlPage(page, await response.text(), { noindex, xRobotsTag: response.headers.get('x-robots-tag') ?? '' });
    assert(!titles.has(result.title), 'Page titles must be distinct');
    titles.add(result.title);
    checked.set(page.path, result);
    for (const asset of result.assets) assets.add(new URL(asset, new URL(page.path.slice(1), root)).href);
  }
  for (const [path, page] of checked) {
    for (const href of page.links) {
      const target = new URL(href, new URL(path.slice(1), root));
      if (!['http:', 'https:'].includes(target.protocol) || ![root.origin, SITE_ORIGIN].includes(target.origin)) continue;
      const targetPath = root.pathname !== '/' && target.pathname.startsWith(root.pathname) ? `/${target.pathname.slice(root.pathname.length)}` : target.pathname;
      if (/\.[a-z0-9]+$/i.test(targetPath) && targetPath !== '/404.html') { assets.add(target.href); continue; }
      assert(checked.has(targetPath), `Internal page link ${path} → ${href}`);
      if (target.hash.length > 1) assert(checked.get(targetPath).ids.has(decodeURIComponent(target.hash.slice(1))), `Internal fragment ${path} → ${href}`);
    }
  }
  const missing = await get('nicht-vorhanden/seo-pruefung');
  assert.equal(missing.status, 404, 'A missing route must return HTTP 404');
  const errorHtml = await missing.text();
  verifyHtmlPage(pages.find(page => page.kind === 'error'), errorHtml, { xRobotsTag: missing.headers.get('x-robots-tag') ?? '' });
  assert.match(errorHtml, /href=["']mailto:lukas\.wagner@webbyu\.de["']/i);

  const robots = await get('robots.txt');
  assert.equal(robots.status, 200, 'robots.txt');
  const robotsText = await robots.text();
  assert.match(robotsText, /User-agent:\s*\*/i);
  if (noindex) assert.match(robotsText, /Disallow:\s*\/\s*(?:\n|$)/i);
  else {
    assert.match(robotsText, /Sitemap:\s*https:\/\/webbyu\.de\/sitemap\.xml/i);
    assert(!/^\s*Disallow:\s*\/\s*(?:#.*)?$/mi.test(robotsText), 'Production robots must allow crawling');
  }
  const sitemap = await get('sitemap.xml');
  assert.equal(sitemap.status, 200, 'sitemap.xml');
  const xml = await sitemap.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
  assert.equal(locations.length, new Set(locations).size, 'Sitemap must not contain duplicate URLs');
  assert.deepEqual(locations.toSorted(), pages.filter(page => page.indexable).map(page => new URL(page.path, SITE_ORIGIN).href).toSorted(), 'Sitemap must contain exactly the indexable canonical pages');

  const fetchedAssets = new Set();
  for (const href of assets) {
    const url = new URL(href);
    if (![root.origin, SITE_ORIGIN].includes(url.origin) || fetchedAssets.has(href)) continue;
    fetchedAssets.add(href);
    const response = await fetcher(url, { signal: AbortSignal.timeout(10000), redirect: 'error' });
    assert.equal(response.status, 200, `Asset ${url.pathname}`);
    assert(!/text\/html/i.test(response.headers.get('content-type') ?? ''), `Asset is not a fallback HTML page ${url.pathname}`);
    if (url.pathname.endsWith('.css')) {
      const css = await response.text();
      for (const match of css.matchAll(/url\(["']?([^"')]+\.woff2(?:\?[^"')]+)?)["']?\)/g)) {
        const fontUrl = new URL(match[1], url);
        if (![root.origin, SITE_ORIGIN].includes(fontUrl.origin) || fetchedAssets.has(fontUrl.href)) continue;
        fetchedAssets.add(fontUrl.href);
        const font = await fetcher(fontUrl, { signal: AbortSignal.timeout(10000), redirect: 'error' });
        assert.equal(font.status, 200, `Font ${fontUrl.pathname}`);
        assert((await font.arrayBuffer()).byteLength > 1000, 'Font must contain data');
      }
    }
  }
  console.log(`SEO checks passed: ${checked.size} static pages, internal links, metadata, schema, robots/sitemap, HTTP 404 and assets.`);
}

/** Check explicit alternatives separately: canonical page requests reject redirects. */
export async function verifyRedirects(site, fetcher = fetch) {
  const origin = new URL(site);
  assert.equal(origin.origin, SITE_ORIGIN, 'Redirect checks use the canonical production origin');
  for (const method of ['GET', 'HEAD']) {
    for (const page of pages.filter(page => page.kind !== 'error')) {
      const canonical = new URL(page.path, SITE_ORIGIN);
      canonical.search = '?seo-check=1&source=canonical';
      const alternatives = [
        canonical.href.replace('https:', 'http:'),
        canonical.href.replace('https://', 'https://www.'),
        canonical.href.replace('https://', 'http://www.'),
        new URL(`${page.file}?seo-check=1&source=canonical`, SITE_ORIGIN).href,
      ];
      if (page.path !== '/') alternatives.push(new URL(`${page.path.slice(0, -1)}?seo-check=1&source=canonical`, SITE_ORIGIN).href);
      for (const alternative of alternatives) {
        const response = await fetcher(new URL(alternative), { method, signal: AbortSignal.timeout(10000), redirect: 'manual' });
        assert.equal(response.status, 301, `Permanent ${method} redirect ${alternative}`);
        const location = response.headers.get('location');
        assert(location, `Redirect location ${alternative}`);
        assert.equal(new URL(location, alternative).href, canonical.href, `One-hop canonical redirect ${alternative}`);
      }
    }
  }
  const embed = await fetcher(new URL('/reise/?embed=1', SITE_ORIGIN), { redirect: 'manual', signal: AbortSignal.timeout(10000) });
  assert.equal(embed.status, 200, 'Embedded journey must remain directly accessible');
  const fakeIndex = await fetcher(new URL('/nicht-vorhanden/index.html', SITE_ORIGIN), { redirect: 'manual', signal: AbortSignal.timeout(10000) });
  assert.equal(fakeIndex.status, 404, 'Nonexistent index.html must not redirect to a fabricated page');
  console.log('Canonical GET/HEAD redirects, query preservation, embedded journey and missing index.html passed.');
}
