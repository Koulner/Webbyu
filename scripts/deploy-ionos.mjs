import { createHash } from 'node:crypto';
import { readdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, posix } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// IONOS's published ED25519 host fingerprint, checked 2026-10-25:
// https://www.ionos.de/hilfe/hosting/ssh-zugaenge-einrichten-und-verwalten/uebersicht-der-ssh-fingerabdruecke-im-ionos-webhosting/
export const IONOS_FINGERPRINT = 'SHA256:1gx2w8Rtv3wCgi7Jh8myf/KVd72cRQbow03UP8P095Q';

export function configuration(env) {
  for (const key of ['IONOS_SFTP_HOST', 'IONOS_SFTP_USER', 'IONOS_SFTP_PASSWORD', 'IONOS_REMOTE_DIR']) {
    if (!env[key]) throw new Error(`Missing GitHub environment secret: ${key}`);
  }
  const host = env.IONOS_SFTP_HOST;
  const user = env.IONOS_SFTP_USER;
  const remote = env.IONOS_REMOTE_DIR;
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) throw new Error('Invalid SFTP host.');
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(user)) throw new Error('Invalid SFTP username.');
  if (!/^\/(?:[a-z0-9_.-]+\/)*[a-z0-9_.-]+\/?$/i.test(remote) || remote.split('/').some(p => p === '.' || p === '..')) {
    throw new Error('IONOS_REMOTE_DIR must be a dedicated absolute directory such as /webbyu, never /.');
  }
  const fingerprint = env.IONOS_SSH_FINGERPRINT || IONOS_FINGERPRINT;
  if (!/^SHA256:[A-Za-z0-9+/]{43}$/.test(fingerprint)) throw new Error('Invalid SSH fingerprint.');
  return { host, user, password: env.IONOS_SFTP_PASSWORD, remote: remote.replace(/\/$/, ''), fingerprint };
}

export function verifiedHostKey(output, expected) {
  for (const line of output.trim().split(/\r?\n/)) {
    const [, type, key] = line.trim().split(/\s+/);
    if (type !== 'ssh-ed25519' || !key || !/^[A-Za-z0-9+/]+={0,2}$/.test(key)) continue;
    const actual = 'SHA256:' + createHash('sha256').update(Buffer.from(key, 'base64')).digest('base64').replace(/=+$/, '');
    if (actual === expected) return line + '\n';
  }
  throw new Error('SSH host fingerprint does not match. No credentials were sent. Check the official IONOS fingerprint.');
}

export function listFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = prefix + entry.name;
    if (!/^[A-Za-z0-9_./-]+$/.test(file) || file.split('/').some(p => p === '..' || p === '.')) {
      throw new Error('Unsupported deployment filename.');
    }
    if (entry.isSymbolicLink()) throw new Error('Symlinks cannot be deployed.');
    if (entry.isDirectory()) return listFiles(join(directory, entry.name), `${file}/`);
    if (!entry.isFile()) throw new Error('Only regular files can be deployed.');
    return [file];
  }).sort();
}

export function batchPlan(files, remote, id) {
  if (!/^[a-f0-9]{40}$/.test(id)) throw new Error('Invalid release ID.');
  const quote = value => `"${value}"`;
  const directories = new Set();
  for (const file of files) {
    const parts = file.split('/').slice(0, -1);
    for (let i = 1; i <= parts.length; i++) directories.add(parts.slice(0, i).join('/'));
  }
  // Target must already exist: do not create a misspelled target elsewhere.
  const lines = [`cd ${quote(remote)}`];
  for (const dir of [...directories].sort()) lines.push(`-mkdir ${quote(dir)}`);
  // Upload every file before replacing any live file. Failures here preserve all live files.
  const temporary = file => posix.join(posix.dirname(file), `.webbyu-upload-${id}-${posix.basename(file)}`);
  for (const file of files) lines.push(`put ${quote(file)} ${quote(temporary(file))}`);
  const priority = file => file === 'webbyu-release.json' ? 4 : file === 'index.html' ? 3 : file.endsWith('.html') ? 2 : file === '.htaccess' ? 1 : 0;
  for (const file of [...files].sort((a, b) => priority(a) - priority(b) || a.localeCompare(b))) {
    lines.push(`rename ${quote(temporary(file))} ${quote(file)}`);
  }
  return lines.join('\n') + '\n';
}

export function deploy(env = process.env, run = spawnSync) {
  const config = configuration(env);
  const root = resolve('dist');
  const files = listFiles(root);
  for (const required of ['index.html', 'reise/index.html', 'impressum/index.html', 'datenschutz/index.html', '.htaccess', 'webbyu-release.json']) {
    if (!files.includes(required)) throw new Error('Incomplete production build.');
  }
  const { commit } = JSON.parse(readFileSync(join(root, 'webbyu-release.json'), 'utf8'));
  if (commit !== env.GITHUB_SHA) throw new Error('Build does not match the checked-out commit.');
  const batch = batchPlan(files, config.remote, commit);
  const directory = mkdtempSync(join(tmpdir(), 'webbyu-sftp-'));
  try {
    // Scan the public key, then compare to an independently trusted fingerprint.
    const scan = run('ssh-keyscan', ['-T', '15', '-p', '22', '-t', 'ed25519', config.host], { encoding: 'utf8', timeout: 20000 });
    if (scan.status !== 0) throw new Error('Cannot read the SFTP server host key.');
    const knownHosts = join(directory, 'known_hosts');
    writeFileSync(knownHosts, verifiedHostKey(scan.stdout, config.fingerprint), { mode: 0o600 });
    const batchFile = join(directory, 'upload.sftp');
    writeFileSync(batchFile, batch, { mode: 0o600 });
    const result = run('sshpass', ['-e', 'sftp', '-q', '-b', batchFile, '-P', '22',
      '-oBatchMode=no', '-oStrictHostKeyChecking=yes', `-oUserKnownHostsFile=${knownHosts}`,
      '-oConnectTimeout=30', '-oNumberOfPasswordPrompts=1', '-oPreferredAuthentications=password,keyboard-interactive',
      '-oPubkeyAuthentication=no', `${config.user}@${config.host}`], {
      cwd: root, env: { ...env, SSHPASS: config.password }, encoding: 'utf8', timeout: 10 * 60 * 1000, maxBuffer: 8 * 1024 * 1024,
    });
    // Never print raw client output: it can contain private account details.
    if (result.status !== 0) throw new Error(`SFTP upload failed (exit ${result.status ?? 'timeout'}). Check credentials, existing destination, permissions and available space.`);
    console.log(`Published ${files.length} files. Existing files outside this build were preserved.`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { deploy(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
