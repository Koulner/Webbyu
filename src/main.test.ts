// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './main';
import { createBriefStore } from './state';

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');
let showModal: ReturnType<typeof vi.fn>;
let app: ReturnType<typeof mountApp>;
let store: ReturnType<typeof createBriefStore>;
let root: HTMLElement;
const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
function mount() {
  app = mountApp(root, { store });
  return app;
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
  it('opens concepts on demand, preserves inputs, and restores focus', () => {
    mount();
    expect(document.querySelector('.demo')).toBeNull();
    const launch = button('[data-demo="meisterwerk"]');
    launch.focus();
    launch.click();
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const demo = dialog.querySelector<HTMLElement>('.demo')!;
    const name = demo.shadowRoot!.querySelector<HTMLInputElement>('[name="name"]')!;
    name.value = 'Bleibt erhalten';
    expect(dialog.open).toBe(true);
    button('.concept-dialog-close').click();
    expect(document.activeElement).toBe(launch);
    button('[data-demo="sales"]').click();
    button('.concept-dialog-close').click();
    launch.click();
    expect(dialog.querySelector('.demo')).toBe(demo);
    expect(name.value).toBe('Bleibt erhalten');
    expect(document.querySelector('#scene')).toBeNull();
  });

  it('keeps exploring concepts separate from the project brief', () => {
    mount();
    store.update({ goal: 'presence', selectedPackage: 'start', name: 'Ada' });
    const before = store.get();
    button('[data-demo="sales"]').click();
    button('.concept-dialog-close').click();
    expect(store.get()).toEqual(before);
  });

  it('disposes sessions and global listeners once', () => {
    mount();
    button('[data-demo="sales"]').click();
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
    store.update({ goal: 'sales', description: 'Ein kleiner Shop', name: 'Ada', extensions: ['photos'] });
    button('[data-package="complete"]').click();
    expect(store.get()).toMatchObject({ goal: 'sales', selectedPackage: 'complete', description: 'Ein kleiner Shop', extensions: ['photos'] });
    button('.finder-next').click();
    button('.finder-next').click();
    const field = document.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    field.value = 'Ein kleiner Shop mit Fotoproduktion';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLAnchorElement>('.site-header a[href="#leistungen"]')!.click();
    document.querySelector<HTMLAnchorElement>('.header-cta')!.click();
    expect(document.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe(field.value);
    expect(document.querySelector('.finder-progress [aria-current="step"]')!.textContent).toContain('Ihr Projekt');
    expect(document.activeElement).toBe(document.querySelector('.finder-heading'));
    expect(store.get().goal).toBe('sales');
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
    document.querySelector<HTMLAnchorElement>('.footer-nav a[href="#datenschutz"]')!.click();
    expect(document.querySelector<HTMLDetailsElement>('#datenschutz')!.open).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('#datenschutz summary'));
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
