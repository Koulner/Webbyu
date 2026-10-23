// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSaffronJourney, saffronFramePair, saffronJourneyMarkup } from './saffron-journey';

let root: HTMLElement;
let controller: AbortController;
let intersect: (entries: { isIntersecting: boolean }[]) => void;
let resize: () => void;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let clock: number;
let bitmaps: { width: number; height: number; close: ReturnType<typeof vi.fn> }[];
let media: EventTarget & { matches: boolean };
let fetchFrame: ReturnType<typeof vi.fn>;
const disconnect = vi.fn();
const drawImage = vi.fn();

function mount() {
  root = document.createElement('div');
  root.innerHTML = saffronJourneyMarkup('test');
  document.body.append(root);
  mountSaffronJourney(root, controller.signal);
  return root.querySelector<HTMLElement>('[data-saffron-journey]')!;
}

function click(selector: string) { root.querySelector<HTMLButtonElement>(selector)!.click(); }
function seek(value: number) {
  const slider = root.querySelector<HTMLInputElement>('[data-saffron-progress]')!;
  slider.value = String(value);
  slider.dispatchEvent(new Event('input'));
}
async function tick(count = 1) {
  for (let n = 0; n < count; n++) {
    const callbacks = [...frames.values()];
    frames.clear();
    clock += 16;
    callbacks.forEach(callback => callback(clock));
    // Flush fetch, blob, decode, finally and any observer callbacks.
    for (let i = 0; i < 12; i++) await Promise.resolve();
  }
}

beforeEach(() => {
  controller = new AbortController();
  frames = new Map(); nextFrame = 0; clock = 0; bitmaps = [];
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() {} disconnect = disconnect;
  });
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {} disconnect = disconnect;
  });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback); return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('createImageBitmap', vi.fn(async () => {
    const bitmap = { width: 960, height: 540, close: vi.fn() };
    bitmaps.push(bitmap); return bitmap;
  }));
  fetchFrame = vi.fn(async () => ({ ok: true, blob: async () => new Blob() }));
  vi.stubGlobal('fetch', fetchFrame);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  controller.abort();
  document.body.replaceChildren();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks();
});

describe('anonymous saffron camera session', () => {
  it('keeps interpolated frames in the unbranded excerpt', () => {
    expect(saffronFramePair(-1)).toEqual({ a: 0, b: 2, mix: 0 });
    expect(saffronFramePair(NaN)).toEqual({ a: 0, b: 2, mix: 0 });
    expect(saffronFramePair(.4025)).toEqual({ a: 160, b: 162, mix: .5 });
    expect(saffronFramePair(2)).toEqual({ a: 400, b: 400, mix: 0 });
  });

  it('loads only when visible, renders a requested position and becomes idle', async () => {
    const section = mount(); resize(); await tick();
    expect(fetchFrame).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true }]); await tick(8);
    expect(section.dataset.frame).toBe('0');
    expect(frames.size).toBe(0);
    seek(720); await tick(8);
    expect(section.dataset.frame).toBe('288');
    expect(root.querySelector('[data-ingredient="1"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(drawImage).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(fetchFrame.mock.calls.every(([url]) => /journey\/\d{4}\.webp$/.test(url))).toBe(true);
  });

  it('plays, pauses offscreen and retains position across reparenting', async () => {
    const section = mount(); intersect([{ isIntersecting: true }]); await tick(8);
    click('[data-saffron-play]'); await tick(80);
    expect(Number(section.dataset.frame)).toBeGreaterThan(20);
    intersect([{ isIntersecting: false }]);
    expect(frames.size).toBe(0);
    expect(root.querySelector('[data-saffron-play]')?.getAttribute('aria-pressed')).toBe('false');
    const position = root.querySelector<HTMLInputElement>('[data-saffron-progress]')!.value;
    const dialog = document.createElement('div'); document.body.append(dialog); dialog.append(root);
    intersect([{ isIntersecting: true }]); await tick(80);
    expect(root.querySelector<HTMLInputElement>('[data-saffron-progress]')!.value).toBe(position);
  });

  it.each(['reduced', 'save-data', 'unsupported'])('keeps chapter navigation without loading frames for %s', async mode => {
    if (mode === 'reduced') media.matches = true;
    if (mode === 'save-data') vi.stubGlobal('navigator', { connection: { saveData: true } });
    if (mode === 'unsupported') vi.stubGlobal('createImageBitmap', undefined);
    mount();
    if (mode !== 'unsupported') { intersect([{ isIntersecting: true }]); resize(); }
    click('[data-ingredient="2"]'); await tick();
    expect(fetchFrame).not.toHaveBeenCalled();
    expect(root.querySelector<HTMLElement>('.saffron-motion-controls')!.hidden).toBe(true);
    expect(root.querySelector('img')!.alt).toContain('Getrocknete');
  });

  it('aborts downloads and closes late decoded images on disposal', async () => {
    const resolves: ((bitmap: object) => void)[] = [];
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(() => new Promise(done => { resolves.push(done); })));
    mount(); intersect([{ isIntersecting: true }]); await tick();
    const signals = fetchFrame.mock.calls.map(([, options]) => options.signal as AbortSignal);
    controller.abort(); resolves.forEach(resolve => resolve({ width: 960, height: 540, close })); await tick();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every(signal => signal.aborted)).toBe(true);
    expect(close).toHaveBeenCalledTimes(resolves.length);
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });

  it('bounds decoded memory and closes the cache on disposal', async () => {
    mount(); intersect([{ isIntersecting: true }]); await tick(8);
    for (const value of [200, 400, 600, 800, 1000]) { seek(value); await tick(8); }
    expect(bitmaps.length).toBeGreaterThan(14);
    expect(bitmaps.filter(bitmap => !bitmap.close.mock.calls.length).length).toBeLessThanOrEqual(14);
    controller.abort();
    expect(bitmaps.every(bitmap => bitmap.close.mock.calls.length === 1)).toBe(true);
  });

  it('stops playback when the tab is hidden or reduced motion is enabled', async () => {
    mount(); intersect([{ isIntersecting: true }]); await tick(8);
    click('[data-saffron-play]'); await tick(4);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    expect(root.querySelector('[data-saffron-play]')?.getAttribute('aria-pressed')).toBe('false');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    media.matches = true; media.dispatchEvent(new Event('change'));
    expect(root.querySelector<HTMLElement>('.saffron-motion-controls')!.hidden).toBe(true);
    expect(root.querySelector('.has-frames')).toBeNull();
  });

  it('fits the gallery scroll surface without adding the outside page header', () => {
    const section = mount();
    const header = document.createElement('header'); header.className = 'site-header';
    Object.defineProperty(header, 'offsetHeight', { value: 88 }); document.body.prepend(header);
    const port = document.createElement('div'); port.style.overflowY = 'auto';
    Object.defineProperties(port, { clientHeight: { value: 509 }, scrollHeight: { value: 2000 } });
    document.body.append(port); port.append(root);
    const stage = root.querySelector<HTMLElement>('.saffron-stage')!;
    const picture = root.querySelector<HTMLElement>('.saffron-picture')!;
    const height = () => parseFloat(stage.style.getPropertyValue('--saffron-media-height')) || 160;
    Object.defineProperty(picture, 'offsetHeight', { get: height });
    Object.defineProperty(stage, 'offsetHeight', { get: () => height() + 266 });
    resize();
    expect(root.style.getPropertyValue('--saffron-nav-top')).toBe('0px');
    expect(stage.offsetHeight + 76).toBeLessThan(port.clientHeight);
    expect(section.classList.contains('is-scrollable')).toBe(true);
  });

  it('falls back after unavailable frames without retrying indefinitely', async () => {
    fetchFrame.mockResolvedValue({ ok: false });
    mount(); intersect([{ isIntersecting: true }]); await tick(10);
    expect(root.querySelector<HTMLElement>('.saffron-motion-controls')!.hidden).toBe(true);
    expect(frames.size).toBe(0);
    expect(fetchFrame.mock.calls.length).toBeLessThanOrEqual(4);
    click('[data-ingredient="1"]');
    expect(root.querySelector('img')!.alt).toContain('Narbenast');
  });
});
