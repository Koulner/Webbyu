import { packageDemoPages } from '../package-demo-pages.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
for (const page of packageDemoPages) {
  mkdirSync(dirname(page.file), { recursive: true });
  const completeHead = page.packageId === 'complete' ? '<script>document.documentElement.classList.add("hf-js");setTimeout(function(){document.documentElement.classList.remove("hf-js")},8000)</script><link rel="preload" href="/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>' : '';
  writeFileSync(page.file, `<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${completeHead}<title>Webbyu Demo</title></head><body><div id="package-demo-app"></div><script type="module" src="/src/package-demos/main.ts"></script></body></html>\n`);
}
