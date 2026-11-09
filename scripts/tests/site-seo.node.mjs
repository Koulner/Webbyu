import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { SITE_ORIGIN, pages } from '../../site.config.mjs';
import { verifyHtmlPage, verifySite, verifyRedirects } from '../verify-site.mjs';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function pageHtml(page, noindex = false) {
  const graph = page.kind === 'home' ? [
    { '@type': 'Organization', name: 'Webbyu', url: SITE_ORIGIN },
    { '@type': 'WebSite', name: 'Webbyu', url: SITE_ORIGIN },
    { '@type': 'Person', name: 'Lukas Wagner' },
  ] : [];
  if (page.kind === 'content') graph.push({ '@type': 'BreadcrumbList', itemListElement: [] });
  if (page.kind === 'content' && /^\/ratgeber\/.+\/$/.test(page.path)) graph.push({ '@type': 'Article', headline: page.title, author: { '@type': 'Person', name: 'Lukas Wagner' } });
  return `<!doctype html><html lang="de"><head><title>${escape(page.title)}</title>
    <meta content="${escape(page.description)}" name="description">
    ${!page.indexable ? '' : `<link href="${SITE_ORIGIN}${page.path}" rel="canonical">`}
    ${noindex || !page.indexable ? '<meta content="noindex, follow" name="robots">' : ''}
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
    <link rel="stylesheet" href="/assets/site-12345678.css"></head><body>
    <main id="main"><h1>${escape(page.title)}</h1><p>Webbyu entwickelt individuelle Websites für Unternehmen. Lukas Wagner begleitet die Planung, erklärt die notwendigen Inhalte und gestaltet einen nachvollziehbaren Weg zur persönlichen Anfrage. Alle Leistungen werden passend zum tatsächlichen Vorhaben vereinbart.</p>
    <a href="/#main">Startseite</a><a href="mailto:lukas.wagner@webbyu.de">Kontakt</a>
    ${page.kind === 'home' ? pages.filter(item => item.indexable).map(item => `<a href="${item.path}">${escape(item.title)}</a>`).join('') : ''}</main></body></html>`;
}

function fakeSite({ noindex = false, mutate = (path, response) => response } = {}) {
  return async url => {
    let response;
    const page = pages.find(item => item.path === url.pathname);
    if (page) response = new Response(pageHtml(page, noindex), { headers: { 'Content-Type': 'text/html' } });
    else if (url.pathname === '/robots.txt') response = new Response(noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
    else if (url.pathname === '/sitemap.xml') response = new Response(`<urlset>${pages.filter(item => item.indexable).map(item => `<url><loc>${SITE_ORIGIN}${item.path}</loc></url>`).join('')}</urlset>`);
    else if (url.pathname === '/assets/site-12345678.css') response = new Response('@font-face{src:url("./font.woff2")}', { headers: { 'Content-Type': 'text/css' } });
    else if (url.pathname === '/assets/font.woff2') response = new Response(new Uint8Array(1500), { headers: { 'Content-Type': 'font/woff2' } });
    else response = new Response(pageHtml(pages.find(item => item.kind === 'error')), { status: 404, headers: { 'Content-Type': 'text/html' } });
    return mutate(url.pathname, response);
  };
}

test('full static site passes source, link, schema, sitemap, asset and 404 checks', async () => {
  await verifySite(new URL(SITE_ORIGIN), fakeSite());
  await verifySite(new URL(SITE_ORIGIN), fakeSite({ noindex: true }), { noindex: true });
});

test('empty JavaScript shells and noscript-only main content fail', () => {
  const page = pages.find(item => item.kind === 'home');
  const html = pageHtml(page);
  const shell = html.replace(/<main[\s\S]*<\/main>/, '<div id="app"></div>');
  assert.throws(() => verifyHtmlPage(page, shell), /static main content/);
  const fallback = html.replace(/(<main[\s\S]*<\/main>)/, '<noscript>$1</noscript><div id="app"></div>');
  assert.throws(() => verifyHtmlPage(page, fallback), /static main content/);
});

test('duplicate or wrong canonicals and hidden indexing directives fail', () => {
  const page = pages.find(item => item.kind === 'home');
  const html = pageHtml(page);
  assert.throws(() => verifyHtmlPage(page, html.replace('rel="canonical"', 'rel="canonical"><link rel="canonical" href="https://webbyu.de/"')), /Single canonical/);
  assert.throws(() => verifyHtmlPage(page, html.replace(`href="${SITE_ORIGIN}/" rel="canonical"`, 'href="https://www.webbyu.de/" rel="canonical"')), /Canonical/);
  assert.throws(() => verifyHtmlPage(page, html, { xRobotsTag: 'googlebot: noindex' }), /Indexing/);
  assert.throws(() => verifyHtmlPage(page, html.replace('</head>', '<meta name="googlebot" content="none"></head>')), /Indexing/);
});

test('malformed schema, missing Article and maps/review markup fail', () => {
  const page = pages.find(item => item.kind === 'home');
  const html = pageHtml(page);
  assert.throws(() => verifyHtmlPage(page, html.replace('"@context":', 'invalid "@context":')), /Invalid JSON-LD/);
  for (const extra of [{ '@type': 'LocalBusiness' }, { geo: { latitude: 53 } }, { aggregateRating: { ratingValue: 5 } }]) {
    assert.throws(() => verifyHtmlPage(page, html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(extra)}</script></head>`)), /Unwanted/);
  }
  const article = pages.find(item => item.path.startsWith('/ratgeber/') && item.path !== '/ratgeber/');
  assert.throws(() => verifyHtmlPage(article, pageHtml(article).replace('"@type":"Article"', '"@type":"WebPage"')), /Article schema/);
});

test('broken static page and fragment links fail even when HTTP metadata passes', async () => {
  for (const href of ['/nicht-im-manifest/', '/#missing-anchor']) {
    await assert.rejects(verifySite(new URL(SITE_ORIGIN), fakeSite({ mutate: async (path, response) => path === '/' ? new Response((await response.text()).replace('href="/#main"', `href="${href}"`), { headers: response.headers }) : response })), /Internal (?:page link|fragment)/);
  }
});

test('sitemap omissions, robots blocks, soft 404s and fallback HTML assets fail', async () => {
  const cases = [
    ['/sitemap.xml', new Response('<urlset></urlset>'), /Sitemap must contain/],
    ['/robots.txt', new Response(`User-agent: *\nDisallow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml`), /allow crawling/],
    ['/nicht-vorhanden/seo-pruefung', new Response(pageHtml(pages[0])), /HTTP 404/],
    ['/assets/site-12345678.css', new Response('<html>Wrong fallback</html>', { headers: { 'Content-Type': 'text/html' } }), /fallback HTML/],
  ];
  for (const [path, replacement, expected] of cases) {
    await assert.rejects(verifySite(new URL(SITE_ORIGIN), fakeSite({ mutate: (requested, response) => requested === path ? replacement.clone() : response })), expected);
  }
});

function fakeRedirects(change = response => response) {
  return async (url, options) => {
    if (url.pathname === '/reise/' && url.searchParams.has('embed')) return new Response('embedded journey');
    if (url.pathname === '/nicht-vorhanden/index.html') return new Response('not found', { status: 404 });
    assert(['GET', 'HEAD'].includes(options.method));
    const page = pages.find(item => item.path === url.pathname || `/${item.file}` === url.pathname || item.path.slice(0, -1) === url.pathname);
    assert(page, `Expected a manifest page: ${url.pathname}`);
    return change(new Response(null, { status: 301, headers: { Location: `${SITE_ORIGIN}${page.path}${url.search}` } }));
  };
}

test('redirect verifier covers GET/HEAD, www, HTTP, index.html, slashes and queries', async () => {
  await verifyRedirects(new URL(SITE_ORIGIN), fakeRedirects());
  await assert.rejects(verifyRedirects(new URL(SITE_ORIGIN), fakeRedirects(response => new Response(null, { status: 302, headers: response.headers }))), /Permanent/);
  await assert.rejects(verifyRedirects(new URL(SITE_ORIGIN), fakeRedirects(response => new Response(null, { status: 301, headers: { Location: response.headers.get('location').split('?')[0] } }))), /One-hop/);
});

// Opt in after `npm run build`: the ordinary deployment unit suite runs before
// the build. This integration reads real output without needing a server.
test('built site passes the same source checks as the published site', { skip: process.env.SEO_BUILD_TEST !== 'true' }, async () => {
  const root = resolve(process.env.SEO_BUILD_DIR || 'dist');
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.png': 'image/png', '.webp': 'image/webp' };
  const builtFetch = async url => {
    const page = pages.find(item => item.path === url.pathname);
    const relative = page?.file ?? decodeURIComponent(url.pathname.slice(1));
    const file = resolve(root, relative);
    assert(file.startsWith(`${root}\\`) || file.startsWith(`${root}/`), 'Build fetch must stay within dist');
    if (!existsSync(file)) return new Response(readFileSync(resolve(root, '404.html')), { status: 404, headers: { 'Content-Type': 'text/html' } });
    return new Response(readFileSync(file), { headers: { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' } });
  };
  const noindex = /<meta\s+name="robots"\s+content="noindex/.test(readFileSync(resolve(root, 'index.html'), 'utf8'));
  await verifySite(new URL(SITE_ORIGIN), builtFetch, { noindex });
});
