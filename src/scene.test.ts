// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { initScene } from './scene';

type Trigger = {
  progress: number;
  kill: ReturnType<typeof vi.fn>;
  update: (progress: number) => void;
  refresh: () => void;
};
type Renderer = {
  domElement: HTMLCanvasElement;
  dispose: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
};
const mocks = vi.hoisted(() => ({
  failRenderer: false,
  failEnvironment: false,
  renderers: [] as Renderer[],
  triggers: [] as Trigger[],
  environmentDispose: vi.fn(),
  refresh: vi.fn(),
}));

// Keep Three's scene graph, geometry and CSS3D projection real. Only GPU and
// scrolling integration need adapters in jsdom; rendering quality is checked
// separately in the browser.
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement('canvas');
      dispose = vi.fn();
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
      fromScene() {
        if (mocks.failEnvironment) throw new Error('Environment unavailable');
        return { texture: new actual.Texture(), dispose: mocks.environmentDispose };
      }
    },
  };
});

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    killTweensOf: vi.fn(),
    to: vi.fn((target: { angle: number }, options: { angle: number; onUpdate: () => void }) => {
      target.angle = options.angle;
      options.onUpdate();
    }),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: mocks.refresh,
    create(options: { onUpdate?: (self: Trigger) => void; onRefresh?: (self: Trigger) => void }) {
      const trigger: Trigger = {
        progress: 0,
        kill: vi.fn(),
        update(progress) { trigger.progress = progress; options.onUpdate?.(trigger); },
        refresh() { options.onRefresh?.(trigger); },
      };
      mocks.triggers.push(trigger);
      return trigger;
    },
  },
}));

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
let intersectionObservers: { disconnect: ReturnType<typeof vi.fn> }[];

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(0));
}

async function mount() {
  document.body.innerHTML = '<section id="story"><div id="scene"></div><div id="original"><div id="slot" style="color: red"><div class="demo"><input value="Erhalten"></div></div><span id="after"></span></div></section>';
  const container = document.querySelector<HTMLElement>('#scene')!;
  const story = document.querySelector<HTMLElement>('#story')!;
  const slot = document.querySelector<HTMLElement>('#slot')!;
  const input = slot.querySelector<HTMLInputElement>('input')!;
  slot.inert = false;
  Object.defineProperties(container, {
    clientWidth: { configurable: true, value: 800 },
    clientHeight: { configurable: true, value: 600 },
  });
  const progress = vi.fn();
  const controller = await initScene({ container, story, demoElement: slot, onProgress: progress });
  controllers.push(controller);
  flushFrames();
  return { container, story, slot, input, progress, controller };
}

beforeEach(() => {
  mocks.failRenderer = false;
  mocks.failEnvironment = false;
  mocks.renderers.length = 0;
  mocks.triggers.length = 0;
  mocks.environmentDispose.mockClear();
  mocks.refresh.mockClear();
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
    constructor() { intersectionObservers.push(this); }
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
  it('reflows the actual mobile demo and replacement goals while retaining live form state', async () => {
    mobile.matches = true;
    const { container, story, slot, input, progress, controller } = await mount();
    expect(container.classList.contains('precision-scene--mobile')).toBe(true);
    expect(story.classList.contains('story--mobile')).toBe(true);
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(true);
    expect(slot.inert).toBe(false);
    expect(mocks.renderers).toHaveLength(0);
    input.value = 'Meine Eingabe';
    mocks.triggers[0].update(1);
    mocks.triggers[0].update(0);
    expect(progress.mock.calls.map(([p]) => p)).toEqual([0, 1, 0]);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Meine Eingabe');

    const replacement = document.createElement('div');
    replacement.className = 'demo';
    slot.replaceChildren(replacement);
    controller.setGoal('bookings');
    expect(replacement.classList.contains('demo--responsive')).toBe(true);
    expect(container.dataset.goal).toBe('bookings');
    expect(container.style.getPropertyValue('--scene-dial-angle')).toBe('0rad');
  });

  it('provides an immediately usable static presentation for reduced motion', async () => {
    reduced.matches = true;
    const { container, story, slot, progress } = await mount();
    expect(container.querySelector('.precision-static-frame')).not.toBeNull();
    expect(story.classList.contains('story--static')).toBe(true);
    expect(slot.inert).toBe(false);
    expect(slot.style.pointerEvents).toBe('auto');
    expect(progress).toHaveBeenLastCalledWith(1);
    expect(mocks.triggers).toHaveLength(0);
    expect(mocks.renderers).toHaveLength(0);
  });

  it('stays usable after WebGL creation fails, including later viewport and motion changes', async () => {
    mocks.failRenderer = true;
    const { container, slot, input, controller, progress } = await mount();
    controller.setGoal('sales');
    input.value = 'Bleibt bestehen';
    // Recovery of the environment must not repeatedly retry a failed context.
    mocks.failRenderer = false;
    mobile.change(true);
    reduced.change(true);
    mobile.change(false);
    reduced.change(false);
    flushFrames();
    expect(mocks.renderers).toHaveLength(0);
    expect(mocks.triggers).toHaveLength(0);
    expect(container.querySelectorAll('.precision-static-frame')).toHaveLength(1);
    expect(container.dataset.goal).toBe('sales');
    expect(slot.inert).toBe(false);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Bleibt bestehen');
    expect(progress).toHaveBeenLastCalledWith(1);
  });

  it('cleans partial initialization before providing the static fallback', async () => {
    mocks.failEnvironment = true;
    const { container, slot } = await mount();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(container.querySelector('.precision-css3d')).toBeNull();
    expect(container.querySelector('.precision-layers')).toBeNull();
    expect(container.querySelectorAll('.precision-static-frame')).toHaveLength(1);
    expect(container.contains(slot)).toBe(true);
    expect(slot.inert).toBe(false);
  });

  it('reverses the desktop story and HTML projection, only enabling controls at the end', async () => {
    const { container, slot, input, progress } = await mount();
    const trigger = mocks.triggers[0];
    expect(mocks.renderers).toHaveLength(1);
    expect(slot.classList.contains('demo--responsive')).toBe(false);
    expect(slot.inert).toBe(true);
    trigger.update(.4);
    flushFrames();
    const surface = container.querySelector<HTMLElement>('.precision-css-surface')!;
    const earlierTransform = surface.style.transform;
    const earlierLegendOpacity = container.querySelector<HTMLElement>('.precision-layers')!.style.opacity;
    expect(earlierTransform).toContain('matrix3d');
    trigger.update(1);
    flushFrames();
    expect(slot.inert).toBe(false);
    expect(slot.style.pointerEvents).toBe('auto');
    expect(surface.style.transform).not.toBe(earlierTransform);
    input.value = 'Nicht neu erzeugen';
    trigger.update(.4);
    flushFrames();
    expect(slot.inert).toBe(true);
    expect(slot.style.pointerEvents).toBe('none');
    expect(surface.style.transform).toBe(earlierTransform);
    expect(container.querySelector<HTMLElement>('.precision-layers')!.style.opacity).toBe(earlierLegendOpacity);
    expect(input.value).toBe('Nicht neu erzeugen');
    expect(progress).toHaveBeenLastCalledWith(.4);
    trigger.refresh();
    expect(progress).toHaveBeenLastCalledWith(.4);
  });

  it('preserves selection and DOM state through desktop, mobile and reduced-motion changes', async () => {
    const { container, slot, input, controller } = await mount();
    controller.setGoal('sales');
    input.value = 'Auswahl bleibt';
    const firstRenderer = mocks.renderers[0];
    const firstTrigger = mocks.triggers[0];
    mobile.change(true);
    expect(firstRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(firstTrigger.kill).toHaveBeenCalledTimes(1);
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(true);
    reduced.change(true);
    mobile.change(false);
    expect(mocks.renderers).toHaveLength(1);
    reduced.change(false);
    flushFrames();
    expect(mocks.renderers).toHaveLength(2);
    expect(container.querySelectorAll('.precision-webgl')).toHaveLength(1);
    expect(container.querySelectorAll('.precision-css3d')).toHaveLength(1);
    expect(container.querySelector('.precision-static-frame')).toBeNull();
    expect(container.dataset.goal).toBe('sales');
    expect(container.style.getPropertyValue('--scene-dial-angle')).toBe('0.72rad');
    expect(slot.querySelector('.demo')!.classList.contains('demo--responsive')).toBe(false);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Auswahl bleibt');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 1100 });
    resizeObservers.at(-1)!.callback();
    flushFrames();
    expect(mocks.renderers.at(-1)!.setSize).toHaveBeenLastCalledWith(1100, 600);
    const camera = mocks.renderers.at(-1)!.render.mock.calls.at(-1)![1] as THREE.PerspectiveCamera;
    expect(camera.aspect).toBeCloseTo(1100 / 600);
  });

  it('switches permanently to accessible HTML on context loss without losing the goal', async () => {
    const { container, slot, input, controller } = await mount();
    controller.setGoal('bookings');
    input.value = 'Wieder verfügbar';
    const renderer = mocks.renderers[0];
    const lost = new Event('webglcontextlost', { cancelable: true });
    renderer.domElement.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.triggers[0].kill).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.precision-webgl')).toBeNull();
    expect(container.querySelector('.precision-static-frame')).not.toBeNull();
    expect(slot.inert).toBe(false);
    expect(slot.querySelector('input')).toBe(input);
    expect(input.value).toBe('Wieder verfügbar');
    expect(container.dataset.goal).toBe('bookings');
    mobile.change(true);
    mobile.change(false);
    expect(mocks.renderers).toHaveLength(1);
    expect(mocks.triggers).toHaveLength(1);
  });

  it('disposes resources and listeners once and restores the original HTML position and styles', async () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.Material.prototype, 'dispose');
    const { container, story, slot, controller } = await mount();
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
    expect(mocks.triggers[0].kill).toHaveBeenCalledTimes(1);
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
    expect(story.classList.contains('story--static')).toBe(false);
    controller.setGoal('sales');
    mobile.change(true);
    expect(container.dataset.goal).toBeUndefined();
    expect(container.children).toHaveLength(0);
  });
});
