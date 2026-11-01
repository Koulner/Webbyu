import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { verifySeoBuild } from './verify-seo.mjs';
import { pages } from '../site.config.mjs';
import { listFiles } from './deploy-ionos.mjs';
import { assertStaticFiles } from './static-release.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A valid GITHUB_SHA is required.');
for (const page of pages) {
  const html = readFileSync(`dist/${page.file}`, 'utf8');
  if (html.includes('/Webbyu/') || html.includes('%BASE_URL%')) {
    throw new Error(`Incorrect production base path in ${page}. Build with SITE_BASE_PATH=/.`);
  }
}
await verifySeoBuild();
copyFileSync('deploy/ionos.htaccess', 'dist/.htaccess');
writeFileSync('dist/webbyu-release.json', JSON.stringify({ commit, builtAt: new Date().toISOString(), mode: 'static', inquiryEnabled: false }) + '\n');
assertStaticFiles(listFiles('dist'));
console.log('IONOS build prepared.');
