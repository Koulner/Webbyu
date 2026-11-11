// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initLandscape } from './frames';
import { FORMS } from './scene';
import { FRAMES, TRANSITIONS } from './frame-set';
import { renderJourney } from './page';
import { stations } from './data';

/** Fake bitmaps and blobs carry the frame name, e.g. „3-00“. */
type Fake = { name: string; close: ReturnType<typeof vi.fn> };
let bitmaps: Fake[];
let missing: RegExp | undefined;
let controller: ReturnType<typeof initLandscape> | undefined;
let map: HTMLElement;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let elapsed: number;
let intersect: (entries: { isIntersecting: boolean }[]) => void;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
let paint: { clearRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn>; globalAlpha: number; imageSmoothingQuality: string } | null;
const newPaint = () => ({ clearRect: vi.fn(), drawImage: vi.fn(), globalAlpha: 1, imageSmoothingQuality: 'low' });
beforeEach(() => {
  bitmaps = []; missing = undefined;
  document.body.innerHTML = '<div id="test-scene"></div>';
  renderJourney(document.querySelector('#test-scene')!);
  map = document.querySelector('[data-map]')!;
  Object.defineProperty(map, 'clientWidth', { configurable: true, value: 800 });
  Object.defineProperty(map, 'clientHeight', { configurable: true, value: 480 });
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  frames = new Map(); nextFrame = 0; elapsed = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('ResizeObserver', class { constructor() {} observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof intersect) { intersect = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('fetch', async (url: string) => {
    if (missing?.test(url)) return { ok: false };
    if (url.endsWith('frames.json')) return { ok: true, json: async () => ({ frames: FRAMES, size: 672, boxes: Array(TRANSITIONS + 1).fill([.2, .2, .8, .8]) }) };
    return { ok: true, blob: async () => ({ name: url.match(/(\d+-\d+)\.webp$/)![1] }) };
  });
  vi.stubGlobal('createImageBitmap', async (blob: { name: string }) => { const bitmap = { name: blob.name, close: vi.fn() }; bitmaps.push(bitmap); return bitmap; });
  paint = newPaint();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => paint as unknown as CanvasRenderingContext2D);
});
afterEach(() => { controller?.dispose(); controller = undefined; document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const flush = () => { elapsed += 16; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(elapsed)); };
const settle = () => { for (let i = 0; i < 400 && frames.size; i++) flush(); };
/** Let downloads and decoding finish. */
const loaded = async () => { for (let i = 0; i < 60; i++) await new Promise(resolve => setTimeout(resolve, 0)); };
const drawn = () => paint!.drawImage.mock.calls.map(call => (call[0] as Fake).name);
const decodedNames = () => bitmaps.map(bitmap => bitmap.name);

describe('journey transforming mass, prerendered', () => {
  it('keeps the frame set in step with the stations and their forms', () => {
    expect(TRANSITIONS).toBe(stations.length);
    const forms = stations.map(station => FORMS[station.id]);
    // 0 stays the formless mass of the overview.
    expect(forms.every(form => form > 0)).toBe(true);
    expect(new Set(forms).size).toBe(stations.length);
  });

  it('shows a loader until every frame is downloaded, draws as decoration and disposes once', async () => {
    controller = initLandscape(map);
    const loader = map.querySelector<HTMLElement>('.journey-loading')!;
    expect(map.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(map.dataset.render).toBe('material');
    expect(loader.hidden).toBe(false);
    controller.setProgress(-1, true);
    await loaded(); flush();
    expect(loader.hidden).toBe(true);
    expect(loader.textContent).toContain('100 %');
    expect(drawn().at(-1)).toBe('0-00');
    const all = [...bitmaps];
    controller.dispose(); controller.dispose();
    expect(map.querySelector('canvas')).toBeNull();
    expect(map.querySelector('.journey-loading')).toBeNull();
    expect(map.dataset.render).toBeUndefined();
    expect(all.every(bitmap => bitmap.close.mock.calls.length === 1)).toBe(true);
    expect(frames.size).toBe(0);
  });

  it('falls back to the static map without a 2D context or without the frames', async () => {
    paint = null;
    expect(() => { controller = initLandscape(map); }).not.toThrow();
    expect(map.dataset.render).toBe('static');
    controller!.setProgress(3);
    expect(frames.size).toBe(0);
    controller!.dispose();
    paint = newPaint();
    delete map.dataset.render;
    missing = /frames\.json/;
    controller = initLandscape(map);
    await loaded();
    expect(map.dataset.render).toBe('static');
    expect(map.querySelector('canvas')).toBeNull();
  });

  it('rests between stations, ignores the pointer and moves only while travelling', async () => {
    controller = initLandscape(map); controller.setProgress(-1, true); await loaded(); flush();
    expect(frames.size).toBe(0);
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 100 }));
    expect(frames.size).toBe(0);
    controller.setProgress(1);
    settle();
    expect(frames.size).toBe(0);
    media.matches = true; controller.setProgress(3);
    for (let i = 0; i < 5 && frames.size; i++) flush();
    expect(frames.size).toBe(0);
    controller.setProgress(Number.NaN); flush();
    expect(frames.size).toBe(0);
  });

  it('scrubs the frames of the running transition, decodes only near the target and rests on the target form', async () => {
    controller = initLandscape(map);
    controller.setProgress(1, true); await loaded(); flush();
    // Decoded: the resting forms and the transitions into and out of position 1, nothing further away.
    expect(decodedNames().some(name => /^6-(?!00)/.test(name))).toBe(false);
    paint!.drawImage.mockClear();
    controller.setProgress(2); await loaded();
    settle();
    const names = drawn();
    expect(names.slice(0, -1).every(name => name.startsWith('2-'))).toBe(true);
    expect(new Set(names).size).toBeGreaterThan(5);
    expect(names.at(-1)).toBe('3-00');
    // Backwards the same transition runs in reverse.
    paint!.drawImage.mockClear();
    controller.setProgress(1); await loaded(); settle();
    expect(drawn().slice(0, -1).every(name => name.startsWith('2-'))).toBe(true);
    expect(drawn().at(-1)).toBe('2-00');
    // At the end rests the last frame of the last transition.
    controller.setProgress(stations.length - 1, true); await loaded(); flush();
    expect(drawn().at(-1)).toBe(`${TRANSITIONS - 1}-${FRAMES}`);
  });

  it('shows the own transformation of the target when jumping over several stations', async () => {
    controller = initLandscape(map);
    controller.setProgress(4, true); await loaded(); flush();
    paint!.drawImage.mockClear();
    controller.setProgress(0); await loaded();
    settle();
    const names = new Set(drawn());
    // Only the transition next to the target runs (reversed), while the last visible form (position 4) fades out.
    expect([...names].every(name => name.startsWith('1-') || name === '5-00')).toBe(true);
    expect([...names].filter(name => name.startsWith('1-')).length).toBeGreaterThan(5);
    expect(names.has('5-00')).toBe(true);
    expect(drawn().at(-1)).toBe('1-00');
  });

  it('hands a transition to the live layer once its program is ready, in the same frame position', async () => {
    const ready = new Set(['1,2']);
    const live = { ready: (a: number, b: number) => ready.has(`${a},${b}`), prepare: vi.fn(), draw: vi.fn(), show: vi.fn(), dispose: vi.fn(), onReady: undefined as (() => void) | undefined };
    const fetched: string[] = [];
    const plain = globalThis.fetch;
    vi.stubGlobal('fetch', (url: string) => { fetched.push(url); return plain(url); });
    controller = initLandscape(map, live);
    controller.setProgress(1, true); await loaded(); flush();
    // The programs at the target come first; with a live layer only the frames around the position are fetched.
    expect(live.prepare).toHaveBeenCalledWith(1, 2);
    expect(live.prepare).toHaveBeenCalledWith(0, 1);
    expect(fetched.some(url => /\/6-1\d\.webp$/.test(url))).toBe(false);
    expect(live.draw).toHaveBeenLastCalledWith(1, 2, 0, expect.objectContaining({ size: expect.any(Number) }), expect.any(Number), expect.any(Number));
    expect(live.show).toHaveBeenLastCalledWith(true);
    expect(map.querySelector<HTMLCanvasElement>('canvas')!.style.visibility).toBe('hidden');
    paint!.drawImage.mockClear(); live.draw.mockClear();
    controller.setProgress(2); await loaded(); settle();
    const steps = live.draw.mock.calls.map(call => call[2] as number);
    expect(steps.length).toBeGreaterThan(10);
    expect(steps.every((t, i) => i === 0 || t >= steps[i - 1])).toBe(true);
    // At rest on station 2 the arriving transition (1 → 2) still shows it live, at its end.
    expect(live.show).toHaveBeenLastCalledWith(true);
    expect(live.draw).toHaveBeenLastCalledWith(1, 2, 1, expect.anything(), expect.any(Number), expect.any(Number));
    // Without any ready program the frames take over again.
    ready.clear(); controller.setProgress(2, true); flush();
    expect(live.show).toHaveBeenLastCalledWith(false);
    expect(drawn().at(-1)).toBe('3-00');
    // A program finishing later redraws the resting frame live.
    ready.add('2,3'); live.onReady!(); flush();
    expect(live.draw).toHaveBeenLastCalledWith(2, 3, 0, expect.anything(), expect.any(Number), expect.any(Number));
    controller.dispose();
    expect(live.dispose).toHaveBeenCalledOnce();
  });

  it('stops work when disabled, offscreen or hidden; reduced motion jumps without animation', async () => {
    controller = initLandscape(map); controller.setProgress(-1, true); await loaded(); flush(); paint!.drawImage.mockClear();
    controller.setEnabled(false); controller.setProgress(2); flush(); expect(paint!.drawImage).not.toHaveBeenCalled();
    controller.setEnabled(true); intersect([{ isIntersecting: false }]); flush(); expect(paint!.drawImage).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true }]);
    media.matches = true; controller.setProgress(4); await loaded(); flush();
    expect(drawn().at(-1)).toBe('5-00'); expect(frames.size).toBe(0);
  });
});
