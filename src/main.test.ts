// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './main';
import { createBriefStore } from './state';
import { mountDemoDialog } from './demos';

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');
let showModal: ReturnType<typeof vi.fn>;
let app: ReturnType<typeof mountApp>;
let store: ReturnType<typeof createBriefStore>;
let root: HTMLElement;
const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
function mount(options: Parameters<typeof mountApp>[1] = {}) {
  app = mountApp(root, { store, ...options });
  return app;
}
const opened = async () => {
  // Vite may still be transforming the selected concept and its local image imports.
  await vi.dynamicImportSettled();
  await vi.waitFor(() => expect(document.querySelector<HTMLDialogElement>('.concept-dialog')?.open).toBe(true));
};
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
function mockDemos() {
  return {
    prepareDemo: vi.fn(async (_id: Parameters<typeof import('./demos').prepareDemo>[0]) => {}),
    createDemo: vi.fn((id: Parameters<typeof import('./demos').createDemo>[0]) => {
      const demo = document.createElement('div');
      demo.className = 'demo';
      demo.dataset.demo = id;
      return demo;
    }),
    disposeDemo: vi.fn((demo: HTMLElement) => demo.remove()),
    mountDemoDialog,
  };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.querySelector('#app')!;
  store = createBriefStore();
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

describe('homepage integration', () => {
  it('loads no demo module before a click and retries an import failure', async () => {
    const demos = mockDemos();
    const loadDemos = vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(demos);
    mount({ loadDemos });
    expect(loadDemos).not.toHaveBeenCalled();
    const launch = button('[data-demo="sales"]');
    launch.click();
    await vi.waitFor(() => expect(root.querySelector('.gallery-demo-status')?.textContent).toContain('erneut'));
    expect(launch.hasAttribute('aria-busy')).toBe(false);
    launch.click();
    await opened();
    expect(loadDemos).toHaveBeenCalledTimes(2);
    expect(demos.prepareDemo).toHaveBeenCalledExactlyOnceWith('sales');
    button('.concept-dialog-close').click();
    expect(document.activeElement).toBe(launch);
  });

  it('opens only the latest selected concept when per-concept code resolves out of order', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const demos = mockDemos();
    demos.prepareDemo.mockImplementation(id => id === 'sales' ? first.promise : second.promise);
    const loadDemos = vi.fn(async () => demos);
    mount({ loadDemos });
    button('[data-demo="sales"]').click();
    await vi.waitFor(() => expect(demos.prepareDemo).toHaveBeenCalledWith('sales'));
    const latest = button('[data-demo="raumgut"]');
    latest.click();
    await vi.waitFor(() => expect(demos.prepareDemo).toHaveBeenCalledWith('raumgut'));
    first.resolve();
    await first.promise; await Promise.resolve();
    expect(demos.createDemo).not.toHaveBeenCalled();
    second.resolve();
    await opened();
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith('raumgut');
    expect(loadDemos).toHaveBeenCalledOnce();
    button('.concept-dialog-close').click();
    expect(document.activeElement).toBe(latest);
  });

  it.each(['module', 'concept'] as const)('ignores a delayed %s load after disposal', async stage => {
    const demos = mockDemos();
    const module = deferred<typeof demos>();
    const concept = deferred<void>();
    demos.prepareDemo.mockImplementation(() => concept.promise);
    mount({ loadDemos: () => stage === 'module' ? module.promise : Promise.resolve(demos) });
    button('[data-demo="sales"]').click();
    if (stage === 'concept') await vi.waitFor(() => expect(demos.prepareDemo).toHaveBeenCalledOnce());
    app.dispose();
    module.resolve(demos); concept.resolve();
    await module.promise; await concept.promise; await Promise.resolve();
    expect(demos.createDemo).not.toHaveBeenCalled();
    expect(document.querySelector('.concept-dialog')).toBeNull();
  });

  it('opens concepts on demand, preserves inputs, and restores focus', async () => {
    mount();
    expect(document.querySelector('.demo')).toBeNull();
    const launch = button('[data-demo="raumgut"]');
    launch.focus();
    launch.click();
    await opened();
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const demo = dialog.querySelector<HTMLElement>('.demo')!;
    const name = demo.shadowRoot!.querySelector<HTMLInputElement>('#rg-query')!;
    name.value = 'Bleibt erhalten';
    expect(dialog.open).toBe(true);
    button('.concept-dialog-close').click();
    expect(document.activeElement).toBe(launch);
    button('[data-demo="raumgut"]').click();
    await opened();
    button('.concept-dialog-close').click();
    launch.click();
    await opened();
    expect(dialog.querySelector('.demo')).toBe(demo);
    expect(name.value).toBe('Bleibt erhalten');
    expect(document.querySelector('#scene')).toBeNull();
  }, 20000);

  it('keeps exploring concepts separate from the project brief', async () => {
    mount();
    store.update({ goal: 'presence', selectedPackage: 'start', name: 'Ada' });
    const before = store.get();
    button('[data-demo="sales"]').click();
    await opened();
    button('.concept-dialog-close').click();
    expect(store.get()).toEqual(before);
  });

  it('disposes sessions and global listeners once', async () => {
    mount();
    button('[data-demo="sales"]').click();
    await opened();
    app.dispose();
    app.dispose();
    expect(document.querySelector('.concept-dialog')).toBeNull();
    expect(document.querySelector('.demo')).toBeNull();
    button('.mobile-menu-button').click();
    expect(button('.mobile-menu-button').getAttribute('aria-expanded')).toBe('false');
    root.replaceChildren();
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow();
  });

  it('keeps the brief goal on package selection and preserves the Finder step through navigation', () => {
    mount();
    store.update({ goal: 'sales', description: 'Ein kleiner Shop', name: 'Ada', extensions: ['cms'] });
    button('[data-package="complete"]').click();
    expect(store.get()).toMatchObject({ goal: 'sales', selectedPackage: 'complete', description: 'Ein kleiner Shop', extensions: ['cms'] });
    for (let i = 0; i < 4; i++) button('.finder-next').click();
    const field = document.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    field.value = 'Ein kleiner Shop mit Fotoproduktion';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLAnchorElement>('.site-header a[href="#leistungen"]')!.click();
    document.querySelector<HTMLAnchorElement>('.header-cta')!.click();
    expect(document.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe(field.value);
    expect(document.querySelector('.finder-progress [aria-current="step"]')!.textContent).toContain('Orientierung');
    expect(document.activeElement).toBe(document.querySelector('.finder-heading'));
    expect(store.get().goal).toBe('sales');
  });

  it('keeps the preview, send status and request ID through embedded journey and demo navigation', async () => {
    const id = '12345678-1234-4123-8123-123456789abc';
    let finish!: (value: Response) => void;
    const fetchMock = vi.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue(id) });
    mount({ sendEnabled: true });
    store.update({ name: 'Ada', email: 'ada@example.com', description: 'Bleibt über Navigation erhalten' });
    for (let i = 0; i < 5; i++) root.querySelector('form.finder-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const preview = root.querySelector('[data-summary]')!.textContent;
    button('[data-action="send"]').click();
    const launch = button('[data-demo="sales"]');
    launch.focus(); launch.click();
    await opened();
    const focusedInDemo = document.activeElement;
    finish(new Response(JSON.stringify({ status: 'temporary', outcome: 'unknown' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
    for (let i = 0; i < 15; i++) await Promise.resolve();
    expect(document.activeElement).toBe(focusedInDemo);
    expect(document.querySelector<HTMLDialogElement>('.concept-dialog')!.open).toBe(true);
    button('.concept-dialog-close').click();
    expect(document.activeElement).toBe(launch);
    const frame = root.querySelector<HTMLIFrameElement>('#journey-preview iframe');
    expect(frame).not.toBeNull();
    window.dispatchEvent(new MessageEvent('message', { origin: new URL(frame!.src).origin, source: frame!.contentWindow, data: { type: 'webbyu:journey-home', hash: '#projektfinder' } }));
    expect(document.activeElement).toBe(root.querySelector('.finder-heading'));
    expect(root.querySelector('[data-summary]')!.textContent).toBe(preview);
    expect(root.querySelector('.finder-status')!.textContent).toContain('Versandausgang unklar');
    expect(root.querySelector('.finder-request-id')!.textContent).toContain(id);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'temporary', outcome: 'not_sent' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
    button('[data-action="send"]').click();
    for (let i = 0; i < 15; i++) await Promise.resolve();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).requestId).toBe(id);
    expect(root.querySelector('.finder-status')!.textContent).toContain('früheren Versuchs bleibt unklar');
    expect(store.get().description).toBe('Bleibt über Navigation erhalten');
  });

  it('closes mobile navigation with Escape or destination selection and reveals legal placeholders', () => {
    mount();
    const menu = button('.mobile-menu-button');
    menu.click();
    expect(document.querySelector<HTMLElement>('#mobile-nav')!.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menu);
    menu.click();
    document.querySelector<HTMLAnchorElement>('#mobile-nav a[href="#ueber-uns"]')!.click();
    expect(document.querySelector<HTMLElement>('#mobile-nav')!.hidden).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('#about-title'));
    expect(document.querySelector<HTMLAnchorElement>(`.footer-nav a[href="${import.meta.env.BASE_URL}datenschutz/"]`)).not.toBeNull();
    location.hash = '#datenschutz';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.querySelector<HTMLDetailsElement>('#datenschutz')!.open).toBe(true);
  });

  it('keeps extension buttons synchronized with Finder selection, removal, and unsure', () => {
    mount();
    const cms = button('[data-extension="cms"]');
    const wizard = button('[data-extension="wizard"]');
    const expectSelected = (element: HTMLButtonElement, selected: boolean) => {
      expect(element.getAttribute('aria-pressed')).toBe(String(selected));
      expect(element.textContent).toContain(selected ? 'Für Ihr Projekt vorgemerkt' : 'Für mein Projekt vormerken');
    };
    const checkbox = (id: string) => document.querySelector<HTMLInputElement>(`input[name="finder-extension"][value="${id}"]`)!;
    expectSelected(cms, false);
    expectSelected(wizard, false);
    cms.click();
    expectSelected(cms, true);
    button('.finder-next').click();
    button('.finder-next').click();
    expect(checkbox('cms').checked).toBe(true);
    checkbox('cms').click();
    expectSelected(cms, false);
    checkbox('wizard').click();
    expectSelected(wizard, true);
    checkbox('cms').click();
    expectSelected(cms, true);
    checkbox('unsure').click();
    expectSelected(cms, false);
    expectSelected(wizard, false);
    cms.click();
    expectSelected(cms, true);
    expect(checkbox('cms').checked).toBe(true);
    expect(checkbox('unsure').checked).toBe(false);
    cms.click();
    expectSelected(cms, false);
    expect(checkbox('cms').checked).toBe(false);
  });
});
