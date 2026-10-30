import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { verifySeoBuild } from './verify-seo.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A valid GITHUB_SHA is required.');
for (const page of ['index.html', 'reise/index.html', 'impressum/index.html', 'datenschutz/index.html']) {
  const html = readFileSync(`dist/${page}`, 'utf8');
  if (html.includes('/Webbyu/') || html.includes('%BASE_URL%')) {
    throw new Error(`Incorrect production base path in ${page}. Build with SITE_BASE_PATH=/.`);
  }
}
verifySeoBuild();
copyFileSync('deploy/ionos.htaccess', 'dist/.htaccess');
writeFileSync('dist/webbyu-release.json', JSON.stringify({ commit, builtAt: new Date().toISOString() }) + '\n');
console.log('IONOS build prepared.');
