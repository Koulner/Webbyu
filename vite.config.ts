import { defineConfig } from 'vite';

// GitHub Pages serves project repositories below /<repository>/ while local
// development and user pages are rooted at /. Keep the same build portable in
// both contexts without hard-coding the repository name.
// GitHub Pages paths are case-sensitive. Preserve the repository's exact
// casing so `/Webbyu/` assets are not emitted as `/webbyu/`.
const repository = process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const base = process.env.GITHUB_ACTIONS === 'true' && repository && !repository.endsWith('.github.io')
  ? `/${repository}/`
  : '/';

export default defineConfig({
  base,
  // QA screenshots and alternate builds are not application source. Watching
  // files while they are copied can terminate the Windows development server.
  server: { watch: { ignored: ['**/artifacts/**'] } },
  build: {
    rollupOptions: { input: { main: 'index.html', journey: 'reise/index.html', imprint: 'impressum/index.html', privacy: 'datenschutz/index.html' } },
  },
});
