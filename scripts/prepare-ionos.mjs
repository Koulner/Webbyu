import { copyFileSync, cpSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles } from './deploy-ionos.mjs';

export function prepare(env = process.env) {
  const commit = env.GITHUB_SHA;
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A valid GITHUB_SHA is required.');
  for (const page of ['index.html', 'reise/index.html', 'impressum/index.html', 'datenschutz/index.html', '404.html']) {
    const html = readFileSync(`dist/${page}`, 'utf8');
    if (html.includes('/Webbyu/') || html.includes('%BASE_URL%')) throw new Error(`Incorrect production base path in ${page}. Build with SITE_BASE_PATH=/.`);
  }
  for (const file of ['vendor/autoload.php', 'vendor/phpmailer/phpmailer/src/PHPMailer.php', 'vendor/composer/installed.json', 'composer.lock']) {
    if (!existsSync(`backend/${file}`)) throw new Error('Install locked production Composer dependencies before preparing IONOS.');
  }
  const lock = JSON.parse(readFileSync('backend/composer.lock', 'utf8'));
  const installed = JSON.parse(readFileSync('backend/vendor/composer/installed.json', 'utf8'));
  if (installed['dev'] !== false || installed.packages.length !== lock.packages.length || lock.packages.length !== 1
      || lock.packages[0].name !== 'phpmailer/phpmailer'
      || installed.packages.some(pkg => !lock.packages.some(locked => locked.name === pkg.name && locked.version === pkg.version && locked.source.reference === pkg.source.reference))) {
    throw new Error('Composer vendor does not match the production lock.');
  }
  copyFileSync('deploy/ionos.htaccess', 'dist/.htaccess');
  mkdirSync('dist/api', { recursive: true });
  mkdirSync('dist/_inquiry', { recursive: true });
  copyFileSync('deploy/inquiry.htaccess', 'dist/_inquiry/.htaccess');
  const release = `dist/_inquiry/releases/${commit}`;
  mkdirSync(release, { recursive: true });
  for (const directory of ['src', 'vendor', 'bin']) cpSync(`backend/${directory}`, join(release, directory), { recursive: true, dereference: false });
  for (const file of ['inquiry.php', 'health.php']) {
    writeFileSync(`dist/api/${file}`, readFileSync(`backend/public/${file}`, 'utf8').replaceAll('__WEBBYU_RELEASE__', commit));
  }
  writeFileSync('dist/webbyu-release.json', JSON.stringify({ commit, builtAt: new Date().toISOString(), inquiryContract: 1 }) + '\n');
  assertPublicBuild('dist', commit);
  console.log('IONOS build prepared with locked PHP dependencies; no private configuration included.');
}

export function assertPublicBuild(root, commit) {
  const release = `_inquiry/releases/${commit}/`;
  const files = listFiles(root);
  for (const file of files) {
    if (/(?:^|\/)(?:\.env(?:\..*)?|private-config[^/]*|inquiry-state\.json|auth\.json|php\.ini)$/.test(file)
        || (/(?:^|\/)composer\.(?:json|lock)$/.test(file) && !file.startsWith(release + 'vendor/'))) throw new Error('Private or development file in production build.');
    if (file.startsWith('_inquiry/') && file !== '_inquiry/.htaccess' && !file.startsWith(release)) throw new Error('Unexpected backend release in build.');
    if (file.startsWith(release) && !['src/', 'vendor/', 'bin/'].some(dir => file.startsWith(release + dir))) throw new Error('Unexpected backend file in build.');
    if (file.endsWith('.php') && !file.startsWith(release) && !['api/inquiry.php', 'api/health.php'].includes(file)) throw new Error('Unexpected public PHP entry point.');
  }
  for (const file of ['.htaccess', '_inquiry/.htaccess', 'api/inquiry.php', 'api/health.php', release + 'vendor/autoload.php', release + 'src/Application.php']) {
    if (!files.includes(file)) throw new Error('Incomplete inquiry build.');
  }
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepare();
