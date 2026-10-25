import { defineConfig } from 'vite';

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

export default defineConfig({
  base,
  plugins: [{
    name: 'preview-noindex',
    transformIndexHtml(html) {
      if (process.env.SITE_NOINDEX !== 'true' || /<meta\s+name=["']robots["']/i.test(html)) return html;
      return { html, tags: [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head' }] };
    },
  }],
  // QA screenshots and alternate builds are not application source. Watching
  // files while they are copied can terminate the Windows development server.
  server: { watch: { ignored: ['**/artifacts/**'] } },
  build: {
    rollupOptions: { input: { main: 'index.html', journey: 'reise/index.html', imprint: 'impressum/index.html', privacy: 'datenschutz/index.html' } },
  },
});
