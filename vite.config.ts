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

export default defineConfig({ base });
