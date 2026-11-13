import { renderPackageDemo } from './src/package-demos/page';
import { defineConfig } from 'vitest/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pages } from './site.config.mjs';
import { applyMetadata, robotsTxt, sitemapXml } from './scripts/seo-html.mjs';
import { renderPageHtml } from './src/shell';
import { renderJourneyHtml } from './src/journey/page';
import { renderContentPage } from './src/seo/content';
import { koulnerHtml } from './src/koulner/basis/page';

// GitHub Pages serves project repositories below /<repository>/ while local
// development and user pages are rooted at /. Keep the same build portable in
// both contexts without hard-coding the repository name.
// GitHub Pages paths are case-sensitive. Preserve the repository's exact
// casing so `/Webbyu/` assets are not emitted as `/webbyu/`.
const repository = process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const defaultBase = process.env.GITHUB_ACTIONS === 'true' && repository && !repository.endsWith('.github.io')
  ? `/${repository}/`
  : '/';
// Production on IONOS is served at the domain root, including inside Actions.
const base = process.env.SITE_BASE_PATH ?? defaultBase;
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
  throw new Error('SITE_BASE_PATH must be / or a slash-delimited site path.');
}

// The prebuilt Safran Atelier demo (public/demos/safran-atelier/) is plain HTML per folder. Apache serves
// folder/index.html (DirectoryIndex); the Vite dev and preview servers would fall back to the home page.
function staticDemoIndex(request: { url?: string }) {
  const [path, query] = (request.url ?? '').split('?');
  if (path.startsWith(`${base}demos/safran-atelier/`) && path.endsWith('/')) request.url = `${path}index.html${query ? `?${query}` : ''}`;
}

export default defineConfig({
  base,
  // Archived checkouts are not part of the application test suite.
  test: { include: ['src/**/*.test.ts'] },
  plugins: [{
    name: 'webbyu-static-pages',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        response.setHeader('X-Robots-Tag', 'noindex, nofollow');
        const path = request.url?.split('?')[0];
        if (path === `${base}robots.txt` || path === `${base}sitemap.xml`) {
          response.setHeader('Content-Type', path.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8');
          response.end(path.endsWith('.xml') ? sitemapXml() : robotsTxt(true));
          return;
        }
        staticDemoIndex(request);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => { staticDemoIndex(request); next(); });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const page = pages.find(page => resolve(page.file) === resolve(context.filename));
        if (!page) return html;
        const noindex = process.env.NODE_ENV === 'development' || process.env.SITE_NOINDEX === 'true';
        const renderers = { 'package-demo': () => renderPackageDemo(page.path, base), home: () => renderPageHtml(base), journey: () => renderJourneyHtml(base), content: () => renderContentPage(page.path, base), koulner: () => koulnerHtml(page.path, base) };
        const renderer = renderers[page.kind as keyof typeof renderers];
        if (renderer) {
          const id = page.kind === 'package-demo' ? 'package-demo-app' : page.kind === 'home' ? 'app' : page.kind === 'journey' ? 'journey-app' : page.kind === 'koulner' ? 'koulner-app' : 'content-app';
          html = html.replace(`<div id="${id}"></div>`, `<div id="${id}" data-prerendered="true">${renderer()}</div>`);
        }
        return applyMetadata(html, page, { noindex });
      },
    },
    writeBundle(output) {
      const directory = output.dir ?? 'dist';
      writeFileSync(resolve(directory, 'robots.txt'), robotsTxt(process.env.SITE_NOINDEX === 'true'));
      writeFileSync(resolve(directory, 'sitemap.xml'), sitemapXml());
    },
  }],
  // QA screenshots and alternate builds are not application source. Watching
  // files while they are copied can terminate the Windows development server.
  server: { watch: { ignored: ['**/artifacts/**', '**/dist*/**'] } },
  build: {
    rollupOptions: { input: Object.fromEntries(pages.map(page => [page.id, page.file])) },
  },
});
