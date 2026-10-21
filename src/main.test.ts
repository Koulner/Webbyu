// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './main';
import type { SceneController } from './contracts';
import { createBriefStore } from './state';

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');
let showModal: ReturnType<typeof vi.fn>;
let app: ReturnType<typeof mountApp>;
let store: ReturnType<typeof createBriefStore>;
let scene: SceneController;
let root: HTMLElement;
const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
function mount(loadScene = async () => ({ initScene: async () => scene })) {
  app = mountApp(root, { store, loadScene });
  return app;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.querySelector('#app')!;
  store = createBriefStore();
  scene = { setGoal: vi.fn(), setMode: vi.fn(), dispose: vi.fn() };
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  Element.prototype.scrollIntoView = vi.fn();
  showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
  Object.defineProperty(dialogPrototype, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(dialogPrototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
});

afterEach(() => {
  app?.dispose();
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(dialogPrototype, name, descriptor);
    else Reflect.deleteProperty(dialogPrototype, name);
  }
  document.body.replaceChildren();
  document.body.style.overflow = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('concept demo integration', () => {
  it('opens inline panels separately and moves the selected live demo into the modal', async () => {
    mount();
    await app.sceneReady;
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const heroDemo = document.querySelector<HTMLElement>('#hero-demo-slot .demo')!;
    const inlinePanel = heroDemo.querySelector<HTMLElement>('.demo-panel')!;
    expect(inlinePanel.hidden).toBe(true);
    expect(dialog.open).toBe(false);
    button('[data-scene-mode="interactive"]').click();
    heroDemo.querySelector<HTMLButtonElement>('[data-panel-open]')!.click();
    expect(inlinePanel.hidden).toBe(false);
    expect(dialog.open).toBe(false);
    expect(showModal).not.toHaveBeenCalled();
    heroDemo.querySelector<HTMLButtonElement>('[data-panel-close]')!.click();
    expect(inlinePanel.hidden).toBe(true);

    const launchButton = button('button[data-demo="bookings"]');
    launchButton.focus();
    launchButton.click();
    expect(dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.querySelector('[data-dialog-title]')!.textContent).toBe('Studio Still');
    const booking = dialog.querySelector('.demo')!;
    expect(booking.getAttribute('data-demo')).toBe('bookings');
    expect(document.querySelector('#hero-demo-slot .demo')).toBeNull();
    button('.concept-dialog-close').click();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(launchButton);
    expect(document.querySelector('#hero-demo-slot .demo')).toBe(booking);
  });

  it('keeps browsing isolated and transfers only the explicitly requested goal to the Finder', () => {
    mount();
    const answers = {
      goal: 'presence' as const, selectedPackage: 'presence' as const,
      extensions: ['cms'], projectType: 'relaunch', timing: 'soon',
      description: 'Mein Projekt', name: 'Ada', email: 'ada@example.test',
    };
    store.update(answers);
    expect(app.catalogue.getState()).toEqual({ goal: 'inquiries', mode: 'presentation' });
    button('[data-scene-mode="interactive"]').click();
    button('[data-catalogue-goal="sales"]').click();
    button('[data-open-current]').click();
    button('.concept-dialog-close').click();
    expect(app.catalogue.getState()).toEqual({ goal: 'sales', mode: 'interactive' });
    expect(store.get()).toEqual(answers);
    button('[data-project-request]').click();
    expect(store.get()).toEqual({ ...answers, goal: 'sales', selectedPackage: null });
    expect(document.querySelector<HTMLInputElement>('input[name="finder-goal"][value="sales"]')?.checked).toBe(true);
  });

  it('replays the newest goal and mode after both import and asynchronous initialization', async () => {
    const imported = deferred<{ initScene: () => Promise<SceneController> }>();
    const initialized = deferred<SceneController>();
    const initScene = vi.fn(() => initialized.promise);
    mount(() => imported.promise);
    app.catalogue.selectGoal('bookings');
    button('[data-scene-mode="layers"]').click();
    imported.resolve({ initScene });
    await vi.waitFor(() => expect(initScene).toHaveBeenCalledTimes(1));
    app.catalogue.selectGoal('sales');
    button('[data-scene-mode="interactive"]').click();
    initialized.resolve(scene);
    await app.sceneReady;
    expect(scene.setGoal).toHaveBeenLastCalledWith('sales');
    expect(scene.setMode).toHaveBeenLastCalledWith('interactive');
    expect(initScene).toHaveBeenCalledWith({
      container: document.querySelector('#scene'), demoElement: document.querySelector('#hero-demo-slot'),
    });
  });

  it('keeps cached HTML sessions usable when the lazy scene import fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(async () => { throw new Error('Chunk unavailable'); });
    const inquiry = document.querySelector<HTMLElement>('#hero-demo-slot .demo')!;
    const name = inquiry.querySelector<HTMLInputElement>('[name="name"]')!;
    name.value = 'Bleibt erhalten';
    await app.sceneReady;
    app.catalogue.selectGoal('sales');
    button('#hero-demo-slot [data-add-cart]').click();
    app.catalogue.selectGoal('inquiries');
    expect(document.querySelector('#hero-demo-slot .demo')).toBe(inquiry);
    expect(name.value).toBe('Bleibt erhalten');
    expect(inquiry.classList.contains('demo--responsive')).toBe(true);
    expect(document.querySelector<HTMLElement>('#hero-demo-slot')!.inert).toBe(false);
    app.catalogue.open();
    expect(document.querySelector('.concept-dialog .demo')).toBe(inquiry);
    button('.concept-dialog-close').click();
    app.catalogue.selectGoal('sales');
    expect(document.querySelector('#hero-demo-slot [data-cart-count]')!.textContent).toBe('(1)');
  });

  it('does not initialize an imported scene after disposal', async () => {
    const imported = deferred<{ initScene: () => Promise<SceneController> }>();
    const initScene = vi.fn(async () => scene);
    mount(() => imported.promise);
    await Promise.resolve();
    app.dispose();
    imported.resolve({ initScene });
    await app.sceneReady;
    expect(initScene).not.toHaveBeenCalled();
  });

  it('disposes a late initialized scene exactly once and removes global UI listeners', async () => {
    const initialized = deferred<SceneController>();
    const initScene = vi.fn(() => initialized.promise);
    mount(async () => ({ initScene }));
    await vi.waitFor(() => expect(initScene).toHaveBeenCalledTimes(1));
    app.dispose();
    app.dispose();
    initialized.resolve(scene);
    await app.sceneReady;
    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(scene.setGoal).not.toHaveBeenCalled();
    button('.mobile-menu-button').click();
    expect(button('.mobile-menu-button').getAttribute('aria-expanded')).toBe('false');
    root.replaceChildren();
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow();
  });

  it('keeps extension buttons synchronized with Finder selection, removal, and unsure', () => {
    mount();
    const cms = button('[data-extension="cms"]');
    const seo = button('[data-extension="seo"]');
    const expectSelected = (element: HTMLButtonElement, selected: boolean) => {
      expect(element.getAttribute('aria-pressed')).toBe(String(selected));
      expect(element.textContent).toContain(selected ? 'Für Ihr Projekt vorgemerkt' : 'Für mein Projekt vormerken');
    };
    const checkbox = (id: string) => document.querySelector<HTMLInputElement>(`input[name="finder-extension"][value="${id}"]`)!;
    expectSelected(cms, false);
    expectSelected(seo, false);
    cms.click();
    expectSelected(cms, true);
    button('.finder-next').click();
    expect(checkbox('cms').checked).toBe(true);
    checkbox('cms').click();
    expectSelected(cms, false);
    checkbox('seo').click();
    expectSelected(seo, true);
    checkbox('cms').click();
    expectSelected(cms, true);
    checkbox('unsure').click();
    expectSelected(cms, false);
    expectSelected(seo, false);
    cms.click();
    expectSelected(cms, true);
    expect(checkbox('cms').checked).toBe(true);
    expect(checkbox('unsure').checked).toBe(false);
    cms.click();
    expectSelected(cms, false);
    expect(checkbox('cms').checked).toBe(false);
  });
});
