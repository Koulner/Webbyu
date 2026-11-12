import { SITE_ORIGIN, pages } from '../site.config.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

export function structuredData(page, modified) {
  const url = SITE_ORIGIN + page.path;
  const organization = { '@type': 'Organization', '@id': SITE_ORIGIN + '/#organization', name: 'Webbyu', url: SITE_ORIGIN + '/', logo: SITE_ORIGIN + '/brand-mark.svg', email: 'lukas.wagner@webbyu.de', telephone: '+4917642090983', founder: { '@id': SITE_ORIGIN + '/#person' } };
  const person = { '@type': 'Person', '@id': SITE_ORIGIN + '/#person', name: 'Lukas Wagner', url: SITE_ORIGIN + '/ueber-mich/' };
  const website = { '@type': 'WebSite', '@id': SITE_ORIGIN + '/#website', name: 'Webbyu', url: SITE_ORIGIN + '/', inLanguage: 'de-DE', publisher: { '@id': organization['@id'] } };
  if (page.kind === 'home') return { '@context': 'https://schema.org', '@graph': [organization, person, website] };
  if (page.kind !== 'content') return null;
  const article = page.path.startsWith('/ratgeber/') && page.path !== '/ratgeber/';
  const crumbs = [{ name: 'Startseite', item: SITE_ORIGIN + '/' }];
  if (article) crumbs.push({ name: 'Ratgeber', item: SITE_ORIGIN + '/ratgeber/' });
  crumbs.push({ name: page.title.replace(/\s*\| Webbyu$/, ''), item: url });
  const graph = [{ '@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) }];
  if (article) graph.push({ '@type': 'Article', '@id': url + '#article', url, mainEntityOfPage: url, headline: page.title.replace(/\s*\| Webbyu$/, ''), description: page.description, inLanguage: 'de-DE', datePublished: page.published, dateModified: modified ?? page.published, author: person, publisher: organization });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function applyMetadata(html, page, { noindex = false } = {}) {
  // The manifest owns generated metadata; preserve unrelated and legal head content.
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi, '');
  const tags = [`<title>${escapeHtml(page.title)}</title>`, `<meta name="description" content="${escapeHtml(page.description)}" />`];
  if (noindex || !page.indexable) tags.push('<meta name="robots" content="noindex, follow" />');
  if (page.indexable) {
    tags.push(`<link rel="canonical" href="${SITE_ORIGIN + page.path}" />`);
    const social = {
      'og:type': page.path.startsWith('/ratgeber/') && page.path !== '/ratgeber/' ? 'article' : 'website',
      'og:site_name': 'Webbyu', 'og:locale': 'de_DE', 'og:title': page.title, 'og:description': page.description,
      'og:url': SITE_ORIGIN + page.path, 'og:image': SITE_ORIGIN + '/social/webbyu.jpg',
      'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': 'Webbyu – Websites für kleine Unternehmen in Bad Oldesloe und Stormarn',
    };
    for (const [property, content] of Object.entries(social)) tags.push(`<meta property="${property}" content="${escapeHtml(content)}" />`);
    tags.push('<meta name="twitter:card" content="summary_large_image" />');
    // The visible "Stand" date in the article is the single source for dateModified.
    const data = structuredData(page, html.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1]);
    if (data) tags.push(`<script type="application/ld+json">${json(data)}</script>`);
  }
  return html.replace('</head>', `  ${tags.join('\n    ')}\n  </head>`);
}

export function sitemapXml() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.filter(page => page.indexable).map(page => `  <url><loc>${SITE_ORIGIN + page.path}</loc></url>`).join('\n') + '\n</urlset>\n';
}

export function robotsTxt(noindex = false) {
  return noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}
