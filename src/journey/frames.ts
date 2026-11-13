import { stations } from './data';
import type { LandscapeController } from './controller';
import { FRAMES, framePath, manifestPath, VARIANTS, type FrameManifest, type Variant } from './frame-set';

type Box = FrameManifest['boxes'][number];
/** Lage des quadratischen Rahmens in Gerätepixeln des Canvas. */
export interface Placement { x: number; y: number; size: number }
/**
 * Live gerenderte Verwandlung über der Bildfolge (`live.ts`). Sie übernimmt einen Übergang erst, wenn sein
 * Shaderprogramm im Hintergrund fertig übersetzt ist; bis dahin zeigt die Bildfolge denselben Rahmen.
 */
export interface LiveLayer {
  ready(a: number, b: number): boolean;
  /** Übersetzt das Programm für den Übergang a nach b vorrangig. */
  prepare(a: number, b: number): void;
  draw(a: number, b: number, t: number, at: Placement, width: number, height: number): void;
  show(visible: boolean): void;
  dispose(): void;
  /** Wird gerufen, wenn ein Programm fertig ist. */
  onReady?: () => void;
}
/** Gleichzeitige Downloads; mehr bringt über HTTP/2 kaum etwas und verzögert die ersten Bilder. */
const PARALLEL = 6;

/**
 * Spielt die vorgerenderte Verwandlung (`scripts/render-journey.mjs`, Gestaltung in `scene.ts`) mit dem Scrollen ab.
 * Kein WebGL zur Laufzeit: Der Shader braucht unter Windows über eine Minute zum Übersetzen.
 * Alle Bilder werden vorab als komprimierte Daten geladen (mit Ladeanzeige); dekodiert werden außerhalb des
 * Hauptthreads nur die ruhenden Gestalten und die beiden Übergänge an der aktuellen Position. Jede ruhende Gestalt
 * wird in die freie Fläche eingepasst; dazwischen gleiten Größe und Lage mit. Zwischen den Stationen ruht das Bild.
 */
export function initLandscape(container: HTMLElement, live?: LiveLayer): LandscapeController {
  const host = container.querySelector<HTMLElement>('.journey-webgl')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const last = stations.length - 1;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  const loader = document.createElement('div');
  loader.className = 'journey-loading';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = '<span>Die Verwandlungen werden geladen</span><i><b></b></i><small>0 %</small>';
  const disposers: (() => void)[] = [];
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, current = -1, target = -1;
  let ratio = 1, area = { x: 0, y: 0, width: 0, height: 0 };
  let variant: Variant | undefined, manifest: FrameManifest | undefined, decodeSize = 0;
  /** Komprimierte Bilder je Übergang; dekodierte Bilder nur im Fenster um die aktuelle Position. */
  let blobs: (Blob | undefined)[][] = [];
  // null: wird gerade dekodiert.
  const decoded = new Map<number, (ImageBitmap | null | undefined)[]>();
  let stills: (ImageBitmap | null | undefined)[] = [];
  const fetching = new Set<number>();
  // Ein Sprung über mehrere Stationen blendet die sichtbare Gestalt (leap) aus, während die Zielstation sich verwandelt.
  let leap: number | undefined, leapAt = 0, leapForward = true, leapLive = false;

  const clamp = (index: number) => Math.max(-1, Math.min(index, last));

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const dispose of disposers.reverse()) dispose();
    for (const list of decoded.values()) list.forEach(bitmap => bitmap?.close());
    stills.forEach(bitmap => bitmap?.close());
    decoded.clear();
    blobs = [];
    canvas.remove();
    loader.remove();
    live?.dispose();
    delete container.dataset.render;
  }
  function fallback() {
    cleanup();
    container.dataset.render = 'static';
  }
  if (!context || typeof createImageBitmap !== 'function') {
    fallback();
    return { setProgress() {}, setEnabled() {}, dispose: cleanup };
  }
  const paint = context;
  if (live) live.onReady = invalidate;
  host.append(canvas, loader);
  container.dataset.render = 'material';

  const decode = (blob: Blob) => createImageBitmap(blob, { resizeWidth: decodeSize, resizeHeight: decodeSize, resizeQuality: 'high' });
  /** Position p als (Übergang, Bild). */
  const stillAt = (p: number): [number, number] => p < last ? [p + 1, 0] : [last, FRAMES];

  async function load(chosen: Variant) {
    const base = import.meta.env.BASE_URL;
    const response = await fetch(`${base}${manifestPath(chosen)}`);
    if (!response.ok) throw Error('Bildfolge fehlt');
    const description = await response.json() as FrameManifest;
    if (disposed || chosen !== variant) return;
    manifest = description;
    blobs = Array.from({ length: last + 1 }, () => Array<Blob | undefined>(FRAMES + 1));
    // Reihenfolge: ruhende Gestalten, dann Übergänge von der aktuellen Position nach außen.
    const queue: [number, number][] = [];
    for (let p = -1; p <= last; p++) queue.push(stillAt(p));
    const here = Math.round(target) + 1;
    const order = [...Array(last + 1).keys()].sort((a, b) => Math.abs(a - here + .5) - Math.abs(b - here + .5));
    // Mit Live-Darstellung überbrücken die Bilder nur die ersten Sekunden: vorab nur die Übergänge am Standort,
    // weitere bei Bedarf (refresh).
    for (const i of live ? order.slice(0, 2) : order) for (let f = 0; f <= FRAMES; f++) queue.push([i, f]);
    const total = queue.length;
    let done = 0;
    const worker = async () => {
      for (let job = queue.shift(); job && !disposed && chosen === variant; job = queue.shift()) {
        const [i, f] = job;
        if (!blobs[i][f]) {
          const answer = await fetch(`${base}${framePath(chosen, i, f)}`);
          if (!answer.ok) throw Error(`Bild ${i}-${f} fehlt`);
          blobs[i][f] = await answer.blob();
        }
        done++;
        loader.style.setProperty('--loaded', String(done / total));
        loader.querySelector('small')!.textContent = `${Math.round(done / total * 100)} %`;
        decodeStills();
        refresh();
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    if (!disposed && chosen === variant) loader.hidden = true;
  }
  function decodeStills() {
    for (let p = -1; p <= last; p++) {
      const [i, f] = stillAt(p), blob = blobs[i]?.[f], slot = p + 1, set = stills;
      if (stills[slot] !== undefined || !blob) continue;
      stills[slot] = null;
      decode(blob).then(bitmap => {
        if (set === stills && !disposed) { stills[slot] = bitmap; invalidate(); } else bitmap.close();
      }, () => { stills[slot] = undefined; });
    }
  }
  /** Lädt einen Übergang nach, wenn er mit Live-Darstellung nicht vorab geladen wurde. */
  function fetchTransition(i: number) {
    if (fetching.has(i) || !blobs[i] || blobs[i].every(Boolean)) return;
    fetching.add(i);
    const chosen = variant!, list = blobs[i];
    (async () => {
      for (let f = 0; f <= FRAMES && !disposed && chosen === variant; f++) {
        if (list[f]) continue;
        const answer = await fetch(`${import.meta.env.BASE_URL}${framePath(chosen, i, f)}`);
        if (!answer.ok) return;
        list[f] = await answer.blob();
      }
      refresh();
    })().catch(() => {});
  }
  /** Dekodiert die Übergänge an der Zielposition und gibt alle anderen frei. */
  function refresh() {
    if (!manifest) return;
    const p = Math.round(target), keep = new Set([p, p + 1, Math.floor(current) + 1].filter(i => i >= 0 && i <= last));
    if (live) keep.forEach(fetchTransition);
    for (const [i, list] of decoded) if (!keep.has(i)) { list.forEach(bitmap => bitmap?.close()); decoded.delete(i); }
    for (const i of keep) {
      if (!decoded.has(i)) decoded.set(i, Array(FRAMES + 1));
      const list = decoded.get(i)!;
      blobs[i]?.forEach((blob, f) => {
        if (!blob || list[f] !== undefined) return;
        list[f] = null;
        decode(blob).then(bitmap => {
          if (decoded.get(i) === list && !disposed) { list[f] = bitmap; invalidate(); } else bitmap.close();
        }, () => { list[f] = undefined; });
      });
    }
  }
  function begin(chosen: Variant) {
    variant = chosen;
    manifest = undefined;
    for (const list of decoded.values()) list.forEach(bitmap => bitmap?.close());
    decoded.clear();
    fetching.clear();
    stills.forEach(bitmap => bitmap?.close());
    stills = [];
    loader.hidden = false;
    loader.style.setProperty('--loaded', '0');
    load(chosen).catch(() => { if (!disposed && chosen === variant) fallback(); });
  }

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    // Live braucht rund 2 ms GPU-Zeit je Bild bei 1440 × 900 (integrierte AMD-Grafik), doppelte Dichte ist tragbar.
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    // Freie Fläche für die Gestalt: Desktop rechts neben dem Text unter der Bildzeile, mobil unter Kopf und Bildzeile bis zum Textbeginn.
    const [left, right, top, bottom] = width < 760
      ? [16, width - 16, 112, Math.min(520, Math.max(330, height * .53))]
      : [width * .42, width * .97, 175, height - 150];
    area = { x: left, y: top, width: right - left, height: Math.max(120, bottom - top) };
    Object.assign(loader.style, { left: `${area.x}px`, top: `${area.y}px`, width: `${area.width}px`, height: `${area.height}px` });
    // Dekodiert wird in der größten nötigen Auflösung: die kleinste Gestalt füllt gut 40 % des Bildes.
    const needed = Math.min(area.width, area.height) * ratio / .42;
    const chosen: Variant = needed > VARIANTS.mobile * 1.1 ? 'desktop' : 'mobile';
    decodeSize = Math.min(VARIANTS[chosen], Math.ceil(needed / 64) * 64);
    if (chosen !== variant) begin(chosen);
    invalidate();
  }

  /** Lage und Kantenlänge des Bildes in Gerätepixeln, damit die ruhende Gestalt mit Rahmen b die freie Fläche füllt. */
  function fit(b: Box) {
    const scale = Math.min(area.width * .84 / (b[2] - b[0]), area.height * .84 / (b[3] - b[1]));
    return { cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, scale };
  }
  function place(a: number, b: number, e: number) {
    const fa = fit(manifest!.boxes[a + 1]), fb = fit(manifest!.boxes[b + 1]);
    const scale = (fa.scale + (fb.scale - fa.scale) * e) * ratio;
    const cx = fa.cx + (fb.cx - fa.cx) * e, cy = fa.cy + (fb.cy - fa.cy) * e;
    return { x: (area.x + area.width / 2) * ratio - cx * scale, y: (area.y + area.height / 2) * ratio - cy * scale, size: scale };
  }
  function draw(bitmap: ImageBitmap | null | undefined, at: { x: number; y: number; size: number }, alpha = 1) {
    if (!bitmap || alpha <= .002) return false;
    paint.globalAlpha = Math.min(1, alpha);
    paint.drawImage(bitmap, at.x, at.y, at.size, at.size);
    return true;
  }
  /** Bild f des Übergangs i; fehlt es noch, das nächste dekodierte desselben Übergangs. */
  function pick(i: number, f: number) {
    const list = decoded.get(i);
    for (let d = 0; list && d <= FRAMES; d++) for (const g of [f - d, f + d]) if (g >= 0 && g <= FRAMES && list[g]) return list[g];
  }

  function render(time: number) {
    frame = 0;
    if (disposed || !enabled || !visible || document.hidden) return;
    const step = lastTime ? Math.min(.05, (time - lastTime) / 1000) : .016;
    lastTime = time;
    current = reduced.matches ? target : current + (target - current) * Math.min(1, step * 2.6);
    if (Math.abs(target - current) < .002) { current = target; leap = undefined; }
    const from = Math.floor(current), t = current - from;
    if (leap !== undefined && from !== leapAt) leap = undefined;
    paint.clearRect(0, 0, canvas.width, canvas.height);
    // Live, sobald das Programm des laufenden Übergangs bereit ist; ein Sprung verwandelt dann direkt von der sichtbaren Gestalt.
    let pair: [number, number] = from >= last ? [last - 1, last]
      : leap !== undefined && leapLive ? (leapForward ? [leap, from + 1] : [from, leap]) : [from, from + 1];
    let u = from >= last ? 1 : t;
    // In Ruhe zeigt auch der Endstand des ankommenden Übergangs die Station; so bleibt es live, solange er bereit ist.
    if (live && t === 0 && from > -1 && from < last && !live.ready(...pair) && live.ready(from - 1, from)) { pair = [from - 1, from]; u = 1; }
    const shown = manifest && live?.ready(pair[0], pair[1]);
    live?.show(Boolean(shown));
    canvas.style.visibility = shown ? 'hidden' : '';
    if (shown) {
      live!.draw(pair[0], pair[1], u, place(pair[0], pair[1], u * u * (3 - 2 * u)), canvas.width, canvas.height);
    } else if (manifest) {
      paint.imageSmoothingQuality = 'high';
      const e = t * t * (3 - 2 * t);
      if (from >= last) draw(stills[last + 1], place(last, last, 0));
      else {
        const i = from + 1, at = place(from, from + 1, e), exact = t * FRAMES, f0 = Math.floor(exact), w = exact - f0;
        // Zwischen zwei gerenderten Bildern blendet das nächste über; so bleibt die Bewegung weich.
        const base = pick(i, f0) ?? (t < .5 ? stills[from + 1] : stills[from + 2]);
        draw(base, at);
        if (w > 0 && decoded.get(i)?.[f0 + 1]) draw(decoded.get(i)![f0 + 1], at, w);
        if (leap !== undefined) {
          // Sprung: Die zuletzt sichtbare Gestalt blendet aus, während die Zielstation ihre eigene Verwandlung zeigt.
          const fade = leapForward ? 1 - smooth(t / .35) : smooth((t - .65) / .35);
          draw(stills[leap + 1], place(leap, leap, 0), fade);
        }
      }
      paint.globalAlpha = 1;
    }
    if (current !== target) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function invalidate() {
    if (!frame && !disposed && enabled && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  disposers.push(() => resizeObserver.disconnect());
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); invalidate(); });
  visibilityObserver.observe(container);
  disposers.push(() => visibilityObserver.disconnect());
  document.addEventListener('visibilitychange', invalidate);
  disposers.push(() => document.removeEventListener('visibilitychange', invalidate));
  reduced.addEventListener?.('change', invalidate);
  disposers.push(() => reduced.removeEventListener?.('change', invalidate));
  resize();

  return {
    setProgress(value, immediate = false) {
      target = clamp(Number.isFinite(value) ? value : -1);
      if (immediate) { current = target; leap = undefined; }
      else if (Math.abs(target - current) > 1) {
        // Nur der letzte Übergang vor dem Ziel läuft; die zuvor sichtbare Gestalt blendet dabei aus.
        leap = Math.round(current);
        leapForward = target > current;
        leapAt = leapForward ? Math.max(-1, Math.floor(target) - 1) : Math.ceil(target);
        current = leapForward ? leapAt : leapAt + .999;
        const pair: [number, number] = leapForward ? [leap, leapAt + 1] : [leapAt, leap];
        leapLive = Boolean(live?.ready(...pair));
        live?.prepare(...pair);
      }
      // Die Programme an der Zielposition zuerst übersetzen.
      const p = Math.round(target);
      if (p < last) live?.prepare(p, p + 1);
      if (p > -1) live?.prepare(p - 1, p);
      refresh();
      invalidate();
    },
    setEnabled(value) {
      enabled = value;
      if (!enabled) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTime = 0; invalidate(); }
    },
    dispose: cleanup,
  };
}

const smooth = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
