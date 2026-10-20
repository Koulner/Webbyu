// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./scene', () => ({
  initScene: vi.fn(async () => ({ setGoal: vi.fn(), dispose: vi.fn() })),
}));

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');
let showModal: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '<div id="app"></div>';
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
  Object.defineProperty(dialogPrototype, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(dialogPrototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
  await import('./main');
  await vi.dynamicImportSettled();
});

afterEach(() => {
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
  it('opens only the inline panel for a hero interaction and opens the modal from a concept button', async () => {
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const heroDemo = document.querySelector<HTMLElement>('#hero-demo-slot .demo')!;
    const inlinePanel = heroDemo.querySelector<HTMLElement>('.demo-panel')!;
    expect(inlinePanel.hidden).toBe(true);
    expect(dialog.open).toBe(false);

    // Both the hero root and launch buttons carry data-demo; only buttons launch the modal.
    heroDemo.querySelector<HTMLButtonElement>('[data-panel-open]')!.click();
    expect(inlinePanel.hidden).toBe(false);
    expect(dialog.open).toBe(false);
    expect(showModal).not.toHaveBeenCalled();

    heroDemo.querySelector<HTMLButtonElement>('[data-panel-close]')!.click();
    expect(inlinePanel.hidden).toBe(true);
    expect(dialog.open).toBe(false);

    const launchButton = document.querySelector<HTMLButtonElement>('button[data-demo="bookings"]')!;
    launchButton.focus();
    launchButton.click();
    expect(dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.querySelector('[data-dialog-title]')!.textContent).toBe('Studio Still');
    expect(dialog.querySelector('.demo')!.getAttribute('data-demo')).toBe('bookings');

    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(launchButton);
  });

  it('keeps extension buttons synchronized with Finder selection, removal, and unsure', () => {
    const cms = document.querySelector<HTMLButtonElement>('[data-extension="cms"]')!;
    const seo = document.querySelector<HTMLButtonElement>('[data-extension="seo"]')!;
    const expectSelected = (button: HTMLButtonElement, selected: boolean) => {
      expect(button.getAttribute('aria-pressed')).toBe(String(selected));
      expect(button.textContent).toContain(selected ? 'Für Ihr Projekt vorgemerkt' : 'Für mein Projekt vormerken');
    };
    const checkbox = (id: string) => document.querySelector<HTMLInputElement>(`input[name="finder-extension"][value="${id}"]`)!;

    expectSelected(cms, false);
    expectSelected(seo, false);
    cms.click();
    expectSelected(cms, true);

    document.querySelector<HTMLButtonElement>('.finder-next')!.click();
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
