// Rendert die Verwandlung der Reise vorab als WebP-Bildfolgen nach public/journey/frames/<fassung>/.
// Startet einen eigenen Vite-Server und ein headless Chrome (Pfad über CHROME_PATH) und steuert es per DevTools-Protokoll.
// Die erste Aufnahme wartet auf die Übersetzung des Shaders (unter Windows/Direct3D über eine Minute).
// Aufruf: node scripts/render-journey.mjs [desktop|mobile] [--quality=0.82]
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { FRAMES, TRANSITIONS, VARIANTS, framePath, manifestPath } from '../src/journey/frame-set.ts';

const args = process.argv.slice(2);
const quality = Number(args.find(arg => arg.startsWith('--quality='))?.split('=')[1] ?? .82);
const variants = args.filter(arg => arg in VARIANTS);
const chosen = variants.length ? variants : Object.keys(VARIANTS);
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root = resolve(import.meta.dirname, '..');

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const pageUrl = new URL('scripts/journey-render/index.html', server.resolvedUrls.local[0]).href;
const profile = await mkdtemp(join(tmpdir(), 'webbyu-render-'));
const chrome = spawn(chromePath, ['--headless=new', '--ignore-gpu-blocklist', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);

try {
  const browserSocket = await new Promise((done, fail) => {
    let text = '';
    chrome.stderr.on('data', chunk => {
      text += chunk;
      const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) done(match[1]);
    });
    chrome.on('exit', code => fail(new Error(`Chrome beendet (${code}): ${text.slice(-400)}`)));
  });
  const port = new URL(browserSocket).port;
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  };
  const evaluate = async expression => {
    const id = ++nextId;
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
    const message = await new Promise(done => pending.set(id, done));
    const failure = message.error?.message ?? message.result?.exceptionDetails?.exception?.description;
    if (failure) throw new Error(failure);
    return message.result.result.value;
  };

  // Vite lädt die Seite nach dem ersten Abhängigkeits-Scan einmal neu; das zerstört den Ausführungskontext.
  for (let attempt = 0; ; attempt++) {
    try {
      await evaluate(`new Promise((done, fail) => { const start = Date.now(); (function wait() {
        if (window.renderJourneyFrame) done(true); else if (Date.now() - start > 30000) fail(new Error('Render-Seite lädt nicht')); else setTimeout(wait, 50);
      })(); })`);
      // Kurz warten, ob noch ein Neuladen folgt.
      await new Promise(done => setTimeout(done, 1500));
      if (await evaluate('Boolean(window.renderJourneyFrame)')) break;
    } catch (error) {
      if (attempt > 4 || !/context|Cannot find/i.test(error.message)) throw error;
      await new Promise(done => setTimeout(done, 1000));
    }
  }
  for (const variant of chosen) {
    const size = VARIANTS[variant];
    const folder = join(root, 'public', 'journey', 'frames', variant);
    await rm(folder, { recursive: true, force: true });
    await mkdir(folder, { recursive: true });
    const started = Date.now();
    let bytes = 0;
    const boxes = [], clipped = [];
    for (let transition = 0; transition < TRANSITIONS; transition++) {
      for (let frame = 0; frame <= FRAMES; frame++) {
        const url = await evaluate(`renderJourneyFrame(${transition - 1}, ${transition}, ${frame / FRAMES}, ${size}, ${quality})`);
        if (!url.startsWith('data:image/webp')) throw new Error('Chrome liefert kein WebP');
        const data = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
        bytes += data.length;
        await writeFile(join(root, 'public', framePath(variant, transition, frame)), data);
        const box = await evaluate('measureJourneyFrame()');
        if (box[0] <= 0 || box[1] <= 0 || box[2] >= 1 || box[3] >= 1) clipped.push(`${transition}-${frame}`);
        // Ruhende Gestalten: Bild 0 jedes Übergangs und das letzte Bild des letzten Übergangs.
        if (frame === 0 || (transition === TRANSITIONS - 1 && frame === FRAMES)) boxes.push(box);
      }
      console.log(`${variant}: Übergang ${transition + 1}/${TRANSITIONS} nach ${Math.round((Date.now() - started) / 1000)} s`);
    }
    await writeFile(join(root, 'public', manifestPath(variant)), JSON.stringify({ frames: FRAMES, size, boxes }));
    console.log(`${variant}: ${TRANSITIONS * (FRAMES + 1)} Bilder, ${(bytes / 1e6).toFixed(1)} MB`);
    if (clipped.length) console.warn(`${variant}: Gestalt berührt den Bildrand in ${clipped.length} Bildern (${clipped.slice(0, 8).join(', ')} …)`);
  }
  socket.close();
} finally {
  chrome.kill();
  await server.close();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
