// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountHomeMotion } from './home-motion';

let root: HTMLElement;
let motion: ReturnType<typeof mountHomeMotion> | undefined;
let reduced: MediaQueryList;
let fine: MediaQueryList;
let frameId: number;
let frames: Map<number, FrameRequestCallback>;
let animations: { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null; oncancel: (() => void) | null }[];
let observers: { callback: IntersectionObserverCallback; observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[];
const oldAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
const rectangle = (top = 0) => ({ x: 0, y: top, top, left: 0, right: 500, bottom: top + 400, width: 500, height: 400, toJSON() {} });
const query = (matches: boolean) => Object.assign(new EventTarget(), { matches }) as unknown as MediaQueryList;
function setReduced(matches: boolean) {
  Object.assign(reduced, { matches });
  reduced.dispatchEvent(new Event('change'));
}
function pointer(type = 'mouse') {
  const event = new MouseEvent('pointermove', { clientX: 490, clientY: 390 });
  Object.defineProperty(event, 'pointerType', { value: type });
  root.querySelector('.studio-stage')!.dispatchEvent(event);
}
function flushFrames() {
  let count = 0;
  while (frames.size && count++ < 200) {
    const batch = [...frames];
    frames.clear();
    batch.forEach(([, callback]) => callback(count * 16));
  }
  expect(count).toBeLessThan(200);
}
beforeEach(() => {
  document.body.innerHTML = `<div id="app"><header class="site-header"><nav><a href="#work">Arbeiten</a></nav></header>
    <div class="hero-copy"><h1>Website</h1><p class="hero-description">Beschreibung</p></div>
    <div class="studio-stage"><a class="stage-piece" href="#work">Beispiel</a></div>
    <button class="motion-control" hidden><span data-motion-label></span></button>
    <section id="work"><div class="section-heading"><h2>Arbeiten</h2><a href="#work">Kontakt</a></div></section>
    <ol class="process-list"><li><span>01</span>Verstehen</li><li><span>02</span>Gestalten</li></ol></div>`;
  root = document.querySelector('#app')!;
  reduced = query(false);
  fine = query(true);
  vi.stubGlobal('matchMedia', (value: string) => value.includes('reduced-motion') ? reduced : fine);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  frameId = 0;
  frames = new Map();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  animations = [];
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: vi.fn(() => {
    const animation = { cancel: vi.fn(), onfinish: null, oncancel: null };
    animations.push(animation);
    return animation;
  }) });
  observers = [];
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
    constructor(public callback: IntersectionObserverCallback) { observers.push(this); }
  });
  vi.spyOn(root.querySelector('.studio-stage')!, 'getBoundingClientRect').mockReturnValue(rectangle());
});
afterEach(() => {
  motion?.dispose();
  motion = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (oldAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', oldAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  document.body.replaceChildren();
});

describe('homepage motion accessibility and lifecycle', () => {
  it('keeps content visible with no animation API or observer', () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    vi.stubGlobal('IntersectionObserver', undefined);
    motion = mountHomeMotion(root);
    expect(root.querySelector('h1')!.hidden).toBe(false);
    expect(root.querySelector('.section-heading')!.getAttribute('style')).toBeNull();
    expect(root.querySelector('a[href="#work"]')).not.toBeNull();
  });

  it('respects reduced motion at startup and live preference changes', () => {
    setReduced(true);
    motion = mountHomeMotion(root);
    pointer();
    expect(animations).toHaveLength(0);
    expect(frames.size).toBe(0);
    expect(root.dataset.motion).toBe('quiet');
    expect(root.querySelector<HTMLButtonElement>('.motion-control')!.disabled).toBe(true);
    setReduced(false);
    pointer();
    expect(frames.size).toBe(1);
    setReduced(true);
    expect(frames.size).toBe(0);
    expect(root.querySelector<HTMLElement>('.studio-stage')!.style.getPropertyValue('--stage-x')).toBe('0.000');
  });

  it('settles pointer motion to idle and ignores touch input', () => {
    motion = mountHomeMotion(root);
    pointer('touch');
    expect(frames.size).toBe(0);
    pointer();
    flushFrames();
    expect(Number(root.querySelector<HTMLElement>('.studio-stage')!.style.getPropertyValue('--stage-x'))).toBeGreaterThan(.8);
    expect(frames.size).toBe(0);
    root.querySelector('.studio-stage')!.dispatchEvent(new Event('pointerleave'));
    flushFrames();
    expect(root.querySelector<HTMLElement>('.studio-stage')!.style.getPropertyValue('--stage-x')).toBe('0.000');
  });

  it('the quiet toggle cancels running motion and leaves links usable', () => {
    motion = mountHomeMotion(root);
    pointer();
    root.querySelector<HTMLButtonElement>('.motion-control')!.click();
    expect(root.dataset.motion).toBe('quiet');
    expect(animations.every(animation => animation.cancel.mock.calls.length > 0)).toBe(true);
    expect(frames.size).toBe(0);
    pointer();
    expect(frames.size).toBe(0);
    expect(root.querySelector('.stage-piece')!.getAttribute('href')).toBe('#work');
  });

  it('reveals a section once and cancels its entrance on keyboard focus', () => {
    motion = mountHomeMotion(root);
    const section = root.querySelector<HTMLElement>('.section-heading')!;
    const observer = observers[0];
    const entries = [{ target: section, isIntersecting: true }] as unknown as IntersectionObserverEntry[];
    observer.callback(entries, observer as unknown as IntersectionObserver);
    const count = animations.length;
    section.querySelector<HTMLElement>('a')!.focus();
    expect(animations.at(-1)!.cancel).toHaveBeenCalled();
    observer.callback(entries, observer as unknown as IntersectionObserver);
    expect(animations).toHaveLength(count);
  });

  it('stops work in background tabs and disposes every listener and frame', () => {
    motion = mountHomeMotion(root);
    pointer();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    expect(animations.every(animation => animation.cancel.mock.calls.length > 0)).toBe(true);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    pointer();
    motion.dispose();
    expect(frames.size).toBe(0);
    expect(root.dataset.motion).toBeUndefined();
    pointer();
    window.dispatchEvent(new Event('scroll'));
    setReduced(true);
    expect(frames.size).toBe(0);
    expect(root.dataset.motion).toBeUndefined();
    expect(observers.every(observer => observer.disconnect.mock.calls.length > 0)).toBe(true);
  });
});
