import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageDemoPages } from '../package-demo-pages.mjs';
import { verifyHtmlPage } from './verify-site.mjs';
const dir = process.argv[2] || 'dist';
const base = process.argv[3] || '/';
for (const page of packageDemoPages) {
  const html = readFileSync(resolve(dir, page.file), 'utf8');
  verifyHtmlPage(page, html);
  assert(!readFileSync(resolve(dir, 'sitemap.xml'), 'utf8').includes(page.path));
  for (const [,url] of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
    if (/^(?:https?:|#|data:)/.test(url)) continue;
    assert(url.startsWith(base), `${page.path}: incorrect base ${url}`);
    let path=url.slice(base.length).split(/[?#]/)[0];
    if (!path || path.endsWith('/')) path+='index.html';
    assert(existsSync(resolve(dir,path)), `${page.path}: missing ${url}`);
  }
}
console.log(`Verified ${packageDemoPages.length} demo pages, assets, noindex and sitemap exclusion at ${base}`);
