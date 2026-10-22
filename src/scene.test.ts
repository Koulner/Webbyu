// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { initScene } from './scene';

type Renderer = {
  domElement: HTMLCanvasElement;
  dispose: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
};
const mocks = vi.hoisted(() => ({
  failRenderer: false,
  failEnvironment: false,
  failGenerator: false,
  renderers: [] as Renderer[],
  environmentDispose: vi.fn(),
}));

// Keep Three's geometry and CSS3D projection real; substitute only GPU work.
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement('canvas');
      dispose = vi.fn();
      forceContextLoss = vi.fn();
      setSize = vi.fn();
      render = vi.fn();
      setClearColor = vi.fn();
      setPixelRatio = vi.fn();
      constructor() {
        if (mocks.failRenderer) throw new Error('WebGL unavailable');
        mocks.renderers.push(this);
      }
    },
    PMREMGenerator: class {
      dispose = vi.fn();
      constructor() { if (mocks.failGenerator) throw new Error('Generator unavailable'); }
      fromScene() {
        if (mocks.failEnvironment) throw new Error('Environment unavailable');
        return { texture: new actual.Texture(), dispose: mocks.environmentDispose };
      }
    },
  };
});

type Media = ReturnType<typeof createMedia>;
function createMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  return {
    matches: initial,
    addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    change(value: boolean) {
      this.matches = value;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

let mobile: Media;
let reduced: Media;
let nextFrame: number;
let frames: Map<number, FrameRequestCallback>;
let controllers: Awaited<ReturnType<typeof initScene>>[];
let resizeObservers: { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[];
let intersectionObservers: { callback: (entries: { isIntersecting: boolean }[]) => void; disconnect: ReturnType<typeof vi.fn> }[];

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(0));
}

async function mount(visible = true) {
  document.body.innerHTML = '<div id="scene"></div><div id="original"><div id="slot" style="color: red"><div class="demo"><input value="Erhalten"></div></div><span id="after"></span></div>';
  const container = document.querySelector<HTMLElement>('#scene')!;
  const slot = document.querySelector<HTMLElement>('#slot')!;
  const input = slot.querySelector<HTMLInputElement>('input')!;
  slot.inert = false;
  Object.defineProperties(container, {
    clientWidth: { configurable: true, value: 800 },
    clientHeight: { configurable: true, value: 600 },
  });
  const controller = await initScene({ container, demoElement: slot });
  controllers.push(controller);
  if (visible) intersectionObservers.at(-1)?.callback([{ isIntersecting: true }]);
  flushFrames();
  return { container, slot, input, controller };
}

beforeEach(() => {
  mocks.failRenderer = false;
  mocks.failEnvironment = false;
  mocks.failGenerator = false;
  mocks.renderers.length = 0;
  mocks.environmentDispose.mockClear();
  mobile = createMedia(false);
  reduced = createMedia(false);
  frames = new Map();
  nextFrame = 0;
  controllers = [];
  resizeObservers = [];
  intersectionObservers = [];
  vi.stubGlobal('matchMedia', vi.fn((query: string) => query.includes('max-width') ? mobile : reduced));
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn();
    observe = vi.fn();
    constructor(public callback: () => void) { resizeObservers.push(this); }
  });
  vi.stubGlobal('IntersectionObserver', class {
    disconnect = vi.fn();
    observe = vi.fn();
    constructor(public callback: (entries: { isIntersecting: boolean }[]) => void) { intersectionObservers.push(this); }
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  controllers.forEach((controller) => controller.dispose());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('scene modes and lifecycle', () => {
  it('reflows mobile demos and replacement goals while retaining live form state', async () => {
    mobile.matches = true;
    const { container, slot, input, controller } = await mount();
    expect(container.classList.contains('precision-scene--mobile')).toBe(true);
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(true);
    expect(slot.inert).toBe(false);
    expect(mocks.renderers).toHaveLength(0);
    input.value = 'Meine Eingabe';
    controller.setMode('layers');
    controller.setMode('interactive');
    window.dispatchEvent(new Event('scroll'));
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Meine Eingabe');
    expect(slot.inert).toBe(false);

    const replacement = document.createElement('div');
    replacement.className = 'demo';
    slot.replaceChildren(replacement);
    controller.setGoal('bookings');
    expect(replacement.classList.contains('demo--responsive')).toBe(true);
    expect(container.dataset.goal).toBe('bookings');
    expect(container.dataset.mode).toBe('interactive');
    expect(container.style.getPropertyValue('--scene-dial-angle')).toBe('0rad');
  });

  it('provides an immediately usable static presentation for reduced motion', async () => {
    reduced.matches = true;
    const { container, slot, controller } = await mount();
    expect(container.querySelector('.precision-static-frame')).not.toBeNull();
    expect(slot.inert).toBe(false);
    expect(slot.style.pointerEvents).toBe('auto');
    expect(container.dataset.mode).toBe('presentation');
    controller.setMode('layers');
    expect(container.dataset.mode).toBe('layers');
    expect(slot.inert).toBe(false);
    expect(mocks.renderers).toHaveLength(0);
    expect(frames.size).toBe(0);
  });

  it('stays usable after WebGL creation fails, including viewport and motion changes', async () => {
    mocks.failRenderer = true;
    const { container, slot, input, controller } = await mount();
    controller.setGoal('sales');
    controller.setMode('interactive');
    input.value = 'Bleibt bestehen';
    // Do not repeatedly retry a failed context after environmental changes.
    mocks.failRenderer = false;
    mobile.change(true);
    reduced.change(true);
    mobile.change(false);
    reduced.change(false);
    flushFrames();
    expect(mocks.renderers).toHaveLength(0);
    expect(container.querySelectorAll('.precision-static-frame')).toHaveLength(1);
    expect(container.dataset.goal).toBe('sales');
    expect(container.dataset.mode).toBe('interactive');
    expect(slot.inert).toBe(false);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Bleibt bestehen');
  });

  it('cleans partial initialization before providing the static fallback', async () => {
    mocks.failEnvironment = true;
    const { container, slot } = await mount();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(container.querySelector('.precision-css3d')).toBeNull();
    expect(container.querySelector<HTMLElement>('.precision-layers')!.hidden).toBe(true);
    expect(container.querySelectorAll('.precision-static-frame')).toHaveLength(1);
    expect(container.contains(slot)).toBe(true);
    expect(slot.inert).toBe(false);
  });

  it('releases the room even if the environment generator constructor fails', async () => {
    const roomDispose = vi.spyOn(RoomEnvironment.prototype, 'dispose');
    mocks.failGenerator = true;
    const { container, slot } = await mount();
    expect(roomDispose).toHaveBeenCalledTimes(1);
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(slot.inert).toBe(false);
    expect(container.contains(slot)).toBe(true);
  });

  it('recovers from a later drawing failure and cancels queued GPU work', async () => {
    const { container, slot, input, controller } = await mount();
    const renderer = mocks.renderers[0];
    input.value = 'Auch nach Zeichenfehler';
    renderer.render.mockImplementationOnce(() => { throw new Error('Draw failed'); });
    controller.setMode('layers');
    flushFrames();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(container.querySelectorAll('.precision-static-frame')).toHaveLength(1);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Auch nach Zeichenfehler');
    expect(slot.inert).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('does not draw until the stage enters the viewport, including after resizing', async () => {
    const { container, slot, controller } = await mount(false);
    const renderer = mocks.renderers[0];
    expect(container.contains(slot)).toBe(true);
    for (let i = 0; i < 4; i++) {
      controller.setGoal(i % 2 ? 'sales' : 'bookings');
      resizeObservers[0].callback();
    }
    expect(frames.size).toBe(0);
    expect(renderer.render).not.toHaveBeenCalled();
    intersectionObservers[0].callback([{ isIntersecting: true }]);
    expect(frames.size).toBe(1);
    flushFrames();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(mocks.renderers).toHaveLength(1);
  });

  it.each(['presentation', 'layers'] as const)('aligns all four HTML corners with the physical opening in %s', async mode => {
    const { container, controller } = await mount();
    controller.setMode(mode);
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 1280 });
    resizeObservers[0].callback();
    flushFrames();
    const [scene, camera] = mocks.renderers[0].render.mock.calls.at(-1)! as [THREE.Scene, THREE.PerspectiveCamera];
    scene.updateMatrixWorld(true);
    const frame = scene.getObjectByName('gallery-frame')!;
    const front = frame.children[0];
    const surface = container.querySelector<HTMLElement>('.precision-css-surface')!;
    const cssValues = surface.style.transform.match(/matrix3d\(([^)]+)\)/)![1].split(',').map(Number);
    // Undo CSS's downward Y axis to compare with the physical world matrix.
    for (let i = 4; i < 8; i++) cssValues[i] *= -1;
    const cssWorld = new THREE.Matrix4().fromArray(cssValues);
    for (const x of [-360, 360]) for (const y of [-288, 288]) {
      const html = new THREE.Vector3(x, y, 0).applyMatrix4(cssWorld).project(camera);
      const physical = new THREE.Vector3(.12 + x * .01, .1 + y * .01, .382)
        .applyMatrix4(front.matrixWorld).project(camera);
      expect(html.distanceTo(physical)).toBeLessThan(1e-10);
    }
    expect(container.querySelector<HTMLElement>('.precision-css3d')!.style.width).toBe('1280px');
    expect(mocks.renderers[0].setSize).toHaveBeenLastCalledWith(1280, 600);
  });

  it('preserves native scroll and input focus through notifications, mode and media changes', async () => {
    const { container, slot, input, controller } = await mount();
    controller.setMode('interactive');
    const native = container.querySelector<HTMLElement>('.precision-static-surface')!;
    native.scrollTop = 320;
    input.focus();
    controller.setGoal('inquiries');
    controller.setMode('interactive');
    expect(native.scrollTop).toBe(320);
    expect(document.activeElement).toBe(input);
    controller.setMode('layers');
    controller.setMode('interactive');
    expect(native.scrollTop).toBe(320);
    mobile.change(true);
    expect(native.scrollTop).toBe(320);
    expect(slot.parentElement).toBe(native);
    controller.setGoal('bookings');
    expect(native.scrollTop).toBe(0);
  });

  it('updates restored slot children without modifying a session while it is in a dialog', async () => {
    const { slot, controller } = await mount();
    const demo = slot.querySelector<HTMLElement>('.demo')!;
    const dialog = document.createElement('div');
    document.body.append(dialog);
    dialog.append(demo);
    demo.classList.add('demo--responsive');
    await Promise.resolve();
    controller.setMode('layers');
    expect(demo.classList.contains('demo--responsive')).toBe(true);
    slot.append(demo);
    await Promise.resolve();
    expect(demo.classList.contains('demo--responsive')).toBe(false);
    controller.setMode('interactive');
    expect(demo.classList.contains('demo--responsive')).toBe(true);
    expect(slot.querySelector('.demo')).toBe(demo);
  });

  it('switches explicit desktop poses and keeps interaction enabled while scrolling', async () => {
    const { container, slot, input, controller } = await mount();
    expect(mocks.renderers).toHaveLength(1);
    expect(slot.classList.contains('demo--responsive')).toBe(false);
    expect(slot.inert).toBe(true);
    expect(container.dataset.mode).toBe('presentation');
    controller.setMode('layers');
    flushFrames();
    const surface = container.querySelector<HTMLElement>('.precision-css-surface')!;
    const layersTransform = surface.style.transform;
    const legend = container.querySelector<HTMLElement>('.precision-layers')!;
    expect(layersTransform).toContain('matrix3d');
    expect(legend.hidden).toBe(false);
    controller.setMode('interactive');
    flushFrames();
    expect(slot.inert).toBe(false);
    expect(slot.style.pointerEvents).toBe('auto');
    expect(slot.parentElement!.className).toBe('precision-static-surface');
    expect(slot.style.transform).toBe('');
    expect(slot.style.width).toBe('100%');
    expect(slot.classList.contains('demo--responsive')).toBe(true);
    expect(legend.hidden).toBe(true);
    expect(container.querySelector<HTMLElement>('.precision-webgl')!.hidden).toBe(true);
    const drawCount = mocks.renderers[0].render.mock.calls.length;
    input.value = 'Nicht neu erzeugen';
    window.dispatchEvent(new Event('scroll'));
    controller.setGoal('sales');
    flushFrames();
    expect(slot.inert).toBe(false);
    expect(mocks.renderers[0].render).toHaveBeenCalledTimes(drawCount);
    expect(container.dataset.mode).toBe('interactive');
    controller.setMode('layers');
    flushFrames();
    expect(slot.inert).toBe(true);
    expect(surface.style.transform).toBe(layersTransform);
    expect(slot.parentElement).toBe(surface);
    expect(mocks.renderers).toHaveLength(1);
    expect(input.value).toBe('Nicht neu erzeugen');
  });

  it('preserves goal, mode and DOM through desktop, mobile and reduced-motion changes', async () => {
    const { container, slot, input, controller } = await mount();
    controller.setGoal('sales');
    controller.setMode('interactive');
    input.value = 'Auswahl bleibt';
    const firstRenderer = mocks.renderers[0];
    mobile.change(true);
    expect(firstRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(true);
    reduced.change(true);
    mobile.change(false);
    expect(mocks.renderers).toHaveLength(1);
    reduced.change(false);
    intersectionObservers.at(-1)!.callback([{ isIntersecting: true }]);
    flushFrames();
    expect(mocks.renderers).toHaveLength(2);
    expect(container.querySelectorAll('.precision-webgl')).toHaveLength(1);
    expect(container.querySelectorAll('.precision-css3d')).toHaveLength(1);
    expect(container.querySelector<HTMLElement>('.precision-static-frame')!.hidden).toBe(false);
    expect(container.dataset.goal).toBe('sales');
    expect(container.dataset.mode).toBe('interactive');
    expect(slot.inert).toBe(false);
    expect(container.style.getPropertyValue('--scene-dial-angle')).toBe('0.72rad');
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(true);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Auswahl bleibt');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 1100 });
    resizeObservers.at(-1)!.callback();
    controller.setMode('presentation');
    flushFrames();
    expect(mocks.renderers.at(-1)!.setSize).toHaveBeenLastCalledWith(1100, 600);
    const camera = mocks.renderers.at(-1)!.render.mock.calls.at(-1)![1] as THREE.PerspectiveCamera;
    expect(camera.aspect).toBeCloseTo(1100 / 600);
  });

  it('switches permanently to accessible HTML on context loss without losing state', async () => {
    const { container, slot, input, controller } = await mount();
    controller.setGoal('bookings');
    controller.setMode('presentation');
    input.value = 'Wieder verfügbar';
    const renderer = mocks.renderers[0];
    const lost = new Event('webglcontextlost', { cancelable: true });
    renderer.domElement.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(container.querySelector('.precision-static-frame')).not.toBeNull();
    expect(slot.inert).toBe(false);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Wieder verfügbar');
    expect(container.dataset.goal).toBe('bookings');
    expect(container.dataset.mode).toBe('presentation');
    mobile.change(true);
    mobile.change(false);
    expect(mocks.renderers).toHaveLength(1);
  });

  it('pauses drawing offscreen and in hidden tabs, then renders the latest pose', async () => {
    const { container, controller } = await mount();
    const renderer = mocks.renderers[0];
    renderer.render.mockClear();
    intersectionObservers[0].callback([{ isIntersecting: false }]);
    controller.setGoal('sales');
    controller.setMode('layers');
    flushFrames();
    expect(renderer.render).not.toHaveBeenCalled();
    intersectionObservers[0].callback([{ isIntersecting: true }]);
    flushFrames();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(container.dataset.mode).toBe('layers');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    controller.setMode('presentation');
    flushFrames();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    flushFrames();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(container.dataset.mode).toBe('presentation');
    expect(frames.size).toBe(0);
  });

  it('disposes resources/listeners once and restores original HTML position and styles', async () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.Material.prototype, 'dispose');
    const { container, slot, controller } = await mount();
    const renderer = mocks.renderers[0];
    controller.dispose();
    controller.dispose();
    flushFrames();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.environmentDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalled();
    expect(materialDispose).toHaveBeenCalled();
    expect(resizeObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(intersectionObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(mobile.listenerCount()).toBe(0);
    expect(reduced.listenerCount()).toBe(0);
    expect(frames.size).toBe(0);
    expect(slot.parentElement!.id).toBe('original');
    expect(slot.nextElementSibling!.id).toBe('after');
    expect(slot.getAttribute('style')).toBe('color: red');
    expect(slot.inert).toBe(false);
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(false);
    expect(container.children).toHaveLength(0);
    expect(container.classList.contains('precision-scene')).toBe(false);
    controller.setGoal('sales');
    controller.setMode('interactive');
    mobile.change(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(container.dataset.goal).toBeUndefined();
    expect(container.dataset.mode).toBeUndefined();
    expect(container.children).toHaveLength(0);
    expect(frames.size).toBe(0);
  });
});
