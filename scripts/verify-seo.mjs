import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { SITE_ORIGIN, pages } from '../site.config.mjs';
import { verifySite } from './verify-site.mjs';

export async function verifySeoBuild(directory = 'dist', { noindex = false } = {}) {
  const root = resolve(directory);
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  const builtFetch = async url => {
    const page = pages.find(item => item.path === url.pathname);
    const file = resolve(root, page?.file ?? decodeURIComponent(url.pathname.slice(1)));
    assert(file.startsWith(root + sep), 'Build fetch must stay within dist');
    if (!existsSync(file)) return new Response(readFileSync(resolve(root, '404.html')), { status: 404, headers: { 'Content-Type': 'text/html' } });
    return new Response(readFileSync(file), { headers: { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' } });
  };
  await verifySite(new URL(SITE_ORIGIN), builtFetch, { noindex });
}

export const verifySeo = verifySite;
