import { businessBody } from './eiche/pages';
import { completeBody } from './hof/pages';
import { hofMarke } from './hof/feuer';
import { startHome, klarblickMark, klarblickNotes } from './klarblick';
import { packageDemoPages, demoBrands } from '../../package-demo-pages.mjs';
import { packages } from '../data';

const efMark = '<svg class="ef-marke" viewBox="0 0 30 34" aria-hidden="true"><rect x="1.5" y="1.5" width="19" height="31" fill="none" stroke="currentColor" stroke-width="3"/><polygon points="23,0 26,0 30,34 23,34" fill="#b98f5c"/></svg>';
const efWall = '<div class="ef-wandrand" aria-hidden="true"><i class="ef-wandrand-leiste"></i><i class="ef-wandrand-mauer"></i></div>';

export function renderPackageDemo(path: string, base: string): string {
  const page = packageDemoPages.find(item => item.path === path);
  if (!page) throw new Error(`Unknown package demo: ${path}`);
  const id = page.packageId;
  const brand = demoBrands[id];
  const pkg = packages.find(p => p.id === id)!;
  const link = (slug = '') => `${base}demos/${id}/${slug ? slug + '/' : ''}`;
  const navItems: [string, string][] = id === 'start' ? [['#fenster', 'Das Beispielhaus'], ['#rundgang', 'Rundgang'], ['#gebiet', 'Wo wir fahren'], ['#kontakt', 'Haus ankreuzen']] : id === 'business' ? [['projekte', 'Fall 14'], ['leistungen', 'Was wir bauen'], ['ueber-uns', 'Werkstatt'], ['kontakt', 'Nische messen']] : [['speisekarte', 'Karte'], ['kueche', 'Der Herd'], ['einblicke', 'Bilder'], ['ueber-uns', 'Das Haus'], ['kontakt', 'Platz anfragen']];
  const navHref = (slug: string) => slug.startsWith('#') ? link() + slug : link(slug);
  const ctx = { base, link, pkg };
  const body = id === 'start'
    ? (page.slug === 'hinweise' ? klarblickNotes(base, link(), pkg.description) : startHome())
    : id === 'business' ? businessBody(page.slug, ctx) : completeBody(page.slug, ctx);
  return `<div class="pd-site pd-${id}">${id === 'business' ? "<script>document.documentElement.classList.add('ef-js')</script>" + efWall : ''}<a class="pd-skip" href="#pd-main">Zum Inhalt</a><aside class="pd-demo-bar" aria-label="Webbyu Demo"><a href="${base}#arbeiten">← Webbyu</a><span>${pkg.name} · Fiktive Beispielwebsite</span><details><summary>Zum Paket</summary><div><strong>${pkg.name}</strong><p>${pkg.description}</p><p>${pkg.features.join(' · ')}</p><p>Beispielumfang, keine feste Zusage zu Seitenzahl oder Medienmenge. Angebot auf Anfrage.</p><a href="${link('hinweise')}">Demo & Bildnachweise</a></div></details><a href="${base}?paket=${id}#projektfinder">Dieses Paket anfragen ↗</a></aside><header class="pd-header"><a class="pd-brand" href="${link()}">${id === 'start' ? klarblickMark : id === 'business' ? efMark : hofMarke}${id === 'business' ? `<b>${brand}<span>TISCHLEREI FÜR SCHIEFE HÄUSER</span></b>` : brand}${id==='start'?'<span>FENSTERREINIGUNG</span>':''}</a><button class="pd-menu-toggle" type="button" aria-expanded="false" aria-controls="pd-nav" hidden>Menü <span>☰</span></button>${id === 'start' ? '<noscript class="kb-no-script"><span hidden></span></noscript>' : ''}<nav id="pd-nav" aria-label="Hauptnavigation"${id === 'start' ? ' class="pd-nav-closed"' : ''}>${navItems.map(([slug,label])=>`<a href="${navHref(slug)}" ${page.slug===slug?'aria-current="page"':''}>${label}</a>`).join('')}</nav></header><main id="pd-main" tabindex="-1">${body}</main><footer class="pd-footer"><a class="pd-brand" href="${link()}">${id === 'start' ? klarblickMark : id === 'business' ? efMark : hofMarke}${brand}</a><p>${id==='start'?'Fensterreinigung in Stormarn. Eine fiktive Firma an einem erfundenen Haus.':id==='business'?'Gerade Möbel für schiefe Häuser. Eine fiktive Tischlerei in Lübeck.':'Ein Tisch, ein Herd, 22 Plätze. Ein fiktives Restaurant in einem erfundenen Hallenhaus.'}</p><nav aria-label="Fußnavigation"><a href="${link('hinweise')}">Demo & Datenschutz</a><a href="${base}impressum/">Impressum Webbyu</a><a href="${base}datenschutz/">Datenschutz Webbyu</a><a href="${base}?paket=${id}#projektfinder">So eine Website anfragen ↗</a></nav><p class="pd-small">Fiktive Designstudie von Webbyu. ${id === 'start' ? 'Fassade und Fensterzeichen sind programmatisch gezeichnet, keine Fotos.' : id === 'business' ? 'Zeichnungen, Visualisierungen und Holzstruktur sind programmatisch erzeugt, keine Fotos.' : 'Bilder: Rasterdrucke aus KI-Illustration und Stockfotos, kein realer Betrieb. Kurven und Pläne sind programmatisch gezeichnet.'}</p></footer><dialog class="pd-lightbox" aria-label="Bild vergrößert"><button type="button" data-gallery-close aria-label="Bild schließen">Schließen ×</button><img alt=""><p></p></dialog></div>`;
}
