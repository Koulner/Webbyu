import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { batchPlan } from '../deploy-ionos.mjs';
import { prepare, assertPublicBuild } from '../prepare-ionos.mjs';
import { verifyInquiry } from '../verify-inquiry.mjs';
import { pages } from '../../site.config.mjs';

const commit = 'a'.repeat(40);
function fixture(callback) {
  const directory = mkdtempSync(join(tmpdir(), 'webbyu-package-test-'));
  const original = process.cwd();
  const files = {
    ...Object.fromEntries(pages.map(page => [`dist/${page.file}`, 'fixture'])),
    'deploy/ionos.htaccess': 'guard', 'deploy/inquiry.htaccess': 'Require all denied',
    'backend/composer.lock': JSON.stringify({ packages: [{ name: 'phpmailer/phpmailer', version: 'v7.1.1', source: { reference: 'test' } }] }),
    'backend/vendor/composer/installed.json': JSON.stringify({ dev: false, packages: [{ name: 'phpmailer/phpmailer', version: 'v7.1.1', source: { reference: 'test' } }] }),
    'backend/vendor/autoload.php': '<?php', 'backend/vendor/phpmailer/phpmailer/src/PHPMailer.php': '<?php',
    'backend/src/Application.php': '<?php', 'backend/bin/cleanup.php': '<?php',
    'backend/public/inquiry.php': '<?php // __WEBBYU_RELEASE__', 'backend/public/health.php': '<?php // __WEBBYU_RELEASE__',
    'backend/private-config.example.php': 'must not be copied', 'backend/tests/no-deploy.php': 'must not be copied',
  };
  try {
    for (const [file, value] of Object.entries(files)) { mkdirSync(dirname(join(directory, file)), { recursive: true }); writeFileSync(join(directory, file), value); }
    process.chdir(directory); callback(directory);
  } finally { process.chdir(original); assert.equal(dirname(resolve(directory)), resolve(tmpdir())); rmSync(directory, { recursive: true, force: true }); }
}

test('production package contains versioned locked dependencies and excludes config/tests', () => fixture(() => {
  prepare({ GITHUB_SHA: commit });
  const files = assertPublicBuild('dist', commit);
  assert(!files.some(file => file.includes('private-config') || file.includes('tests/')));
  assert(readFileSync('dist/api/inquiry.php', 'utf8').includes(commit));
  assert(!readFileSync('dist/api/inquiry.php', 'utf8').includes('__WEBBYU_RELEASE__'));
  writeFileSync('dist/.env', 'fixture');
  assert.throws(() => assertPublicBuild('dist', commit), /Private/);
}));

test('missing dependencies and a wrong installed package fail preparation', () => fixture(() => {
  writeFileSync('backend/vendor/composer/installed.json', JSON.stringify({ dev: false, packages: [] }));
  assert.throws(() => prepare({ GITHUB_SHA: commit }), /does not match/);
  rmSync('backend/vendor/autoload.php');
  assert.throws(() => prepare({ GITHUB_SHA: commit }), /Install locked/);
}));

test('guards are published before sources, and versioned sources before PHP entry points', () => {
  const files = ['api/inquiry.php', `.webbyu-upload-${commit}-inquiry.php`, '_inquiry/.htaccess', '.htaccess', `_inquiry/releases/${commit}/vendor/autoload.php`, 'index.html', 'webbyu-release.json'];
  const publishes = batchPlan(files, '/webbyu', commit).split('\n').filter(line => line.startsWith('rename '));
  assert(publishes[0].endsWith('".htaccess"')); assert(publishes[1].endsWith('"_inquiry/.htaccess"'));
  assert(publishes.findIndex(line => line.endsWith('"api/inquiry.php"')) > publishes.findIndex(line => line.endsWith('/vendor/autoload.php"')));
  assert(publishes.at(-1).endsWith('"webbyu-release.json"'));
});

function mockFetch(mode) {
  return async (url, options) => {
    if (url.pathname === '/api/health.php') {
      if (mode === 'source') return new Response('<?php sensitive code', { headers: { 'Content-Type': 'text/plain' } });
      return Response.json({ status: mode === 'unavailable' ? 'unavailable' : 'ready', execution: 'php', contract: 1, release: commit }, { status: mode === 'unavailable' ? 503 : 200 });
    }
    if (url.pathname === '/api/inquiry.php') {
      assert(!options.body || options.body === '{}', 'Verifier must never send a valid inquiry');
      const status = options.method === 'POST' ? (options.headers.Origin === 'https://webbyu.de' ? 422 : 403) : 405;
      return Response.json({ status: 'invalid', fields: [] }, { status, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
    }
    return new Response('', { status: mode === 'exposed' ? 200 : 403 });
  };
}
test('published backend probes detect PHP source delivery, missing config and exposed dependencies without sending mail', async () => {
  await verifyInquiry(new URL('https://webbyu.de'), commit, mockFetch('ready'));
  for (const mode of ['source', 'unavailable', 'exposed']) await assert.rejects(verifyInquiry(new URL('https://webbyu.de'), commit, mockFetch(mode)));
});
