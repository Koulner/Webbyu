import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { configuration, verifiedHostKey, batchPlan, deploy, listFiles } from '../deploy-ionos.mjs';

const commit = 'a'.repeat(40);
const env = {
  IONOS_SFTP_HOST: 'example.webspace-data.io', IONOS_SFTP_USER: 'u12345',
  IONOS_SFTP_PASSWORD: 'test-only-password', IONOS_REMOTE_DIR: '/webbyu', GITHUB_SHA: commit,
};
const key = Buffer.from('test-only-public-host-key');
const fingerprint = 'SHA256:' + createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
const hostKey = `example.webspace-data.io ssh-ed25519 ${key.toString('base64')}\n`;

function withBuild(callback) {
  const directory = mkdtempSync(join(tmpdir(), 'webbyu-deploy-test-'));
  const cwd = process.cwd();
  try {
    for (const file of ['index.html', 'reise/index.html', 'impressum/index.html', 'datenschutz/index.html', '.htaccess', 'assets/app-123.js', 'webbyu-release.json']) {
      const path = join(directory, 'dist', file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file === 'webbyu-release.json' ? JSON.stringify({ commit }) : 'fixture');
    }
    process.chdir(directory);
    return callback(directory);
  } finally {
    process.chdir(cwd);
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
}

test('missing secrets and unsafe destinations fail before making a connection', () => {
  assert.throws(() => deploy({}, () => { throw new Error('Network must not run'); }), /Missing GitHub/);
  for (const remote of ['/', '/webbyu/../utilicious', '/webbyu\nrm /', '/webbyu"', 'webbyu', '/webbyu/./site']) {
    assert.throws(() => configuration({ ...env, IONOS_REMOTE_DIR: remote }), /dedicated absolute directory/);
  }
  for (const host of ['-oProxyCommand=bad', 'example.io\nother', 'user@example.io']) {
    assert.throws(() => configuration({ ...env, IONOS_SFTP_HOST: host }), /Invalid SFTP host/);
  }
});

test('only the independently pinned server key is trusted', () => {
  assert.equal(verifiedHostKey('# banner\n' + hostKey, fingerprint), hostKey);
  assert.throws(() => verifiedHostKey(hostKey, 'SHA256:' + 'x'.repeat(43)), /fingerprint does not match/);
  withBuild(() => {
    let calls = 0;
    assert.throws(() => deploy(env, command => {
      calls++;
      assert.equal(command, 'ssh-keyscan');
      return { status: 0, stdout: hostKey };
    }), /fingerprint does not match/);
    assert.equal(calls, 1, 'password client must not run after a mismatched host key');
  });
});

test('complete uploads precede publication; dependencies precede HTML; release marker comes last', () => {
  const files = ['index.html', 'reise/index.html', 'assets/main-abc.js', '.htaccess', 'webbyu-release.json'];
  const lines = batchPlan(files, '/webbyu', commit).trim().split('\n');
  assert.equal(lines[0], 'cd "/webbyu"');
  const lastUpload = lines.findLastIndex(line => line.startsWith('put '));
  const firstRename = lines.findIndex(line => line.startsWith('rename '));
  assert(lastUpload < firstRename);
  const publishes = lines.filter(line => line.startsWith('rename '));
  assert(publishes[0].endsWith('"assets/main-abc.js"'));
  assert(publishes.at(-2).endsWith('"index.html"'));
  assert(publishes.at(-1).endsWith('"webbyu-release.json"'));
  assert(!lines.some(line => /^(?:rm|rmdir|!|get)\b/.test(line)));
  assert.throws(() => batchPlan(files, '/webbyu', 'invalid\n!bad'), /Invalid release ID/);
});

test('verified connection uses strict host checking and keeps password out of arguments and batch file', () => {
  withBuild(() => {
    let calls = 0;
    deploy({ ...env, IONOS_SSH_FINGERPRINT: fingerprint }, (command, args, options) => {
      calls++;
      if (command === 'ssh-keyscan') return { status: 0, stdout: hostKey };
      assert.equal(command, 'sshpass');
      assert(args.includes('-oStrictHostKeyChecking=yes'));
      assert(args.includes('-oBatchMode=no'));
      assert(args.indexOf('-oBatchMode=no') < args.indexOf('-b'), 'password mode must be set before -b implicitly enables BatchMode');
      assert(!args.join(' ').includes(env.IONOS_SFTP_PASSWORD));
      assert.equal(options.env.SSHPASS, env.IONOS_SFTP_PASSWORD);
      const batch = readFileSync(args[args.indexOf('-b') + 1], 'utf8');
      assert(!batch.includes(env.IONOS_SFTP_PASSWORD));
      assert(!batch.includes(env.IONOS_SFTP_HOST));
      return { status: 0 };
    });
    assert.equal(calls, 2);
  });
});

test('wrong artifact or failed SFTP stops deployment without printing private client output', () => {
  withBuild(directory => {
    assert.throws(() => deploy({ ...env, GITHUB_SHA: 'b'.repeat(40) }, () => assert.fail('must not connect')), /does not match/);
    assert.throws(() => deploy({ ...env, IONOS_SSH_FINGERPRINT: fingerprint }, command =>
      command === 'ssh-keyscan' ? { status: 0, stdout: hostKey } : { status: 5, stderr: 'private account details' }
    ), error => /SFTP upload failed/.test(error.message) && !error.message.includes('private account'));
    writeFileSync(join(directory, 'dist', 'bad name'), 'fixture');
    assert.throws(() => listFiles(join(directory, 'dist')), /Unsupported deployment filename/);
  });
});
