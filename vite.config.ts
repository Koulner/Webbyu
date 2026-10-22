import { defineConfig } from 'vite';

// GitHub Pages serves project repositories below /<repository>/ while local
// development and user pages are rooted at /. Keep the same build portable in
// both contexts without hard-coding the repository name.
const repository = process.env.GITHUB_REPOSITORY?.split('/').at(-1)?.toLowerCase();
const base = process.env.GITHUB_ACTIONS === 'true' && repository && !repository.endsWith('.github.io')
  ? `/${repository}/`
  : '/';

export default defineConfig({ base });
