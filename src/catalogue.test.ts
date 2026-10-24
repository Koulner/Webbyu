// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountCatalogue } from './catalogue';
import type { CatalogueController } from './contracts';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
let controllers: CatalogueController[];

beforeEach(() => {
  controllers = [];
  document.body.innerHTML = '<div id="controls"></div><div id="slot"></div>';
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); },
  });
});

afterEach(() => {
  controllers.forEach(controller => controller.dispose());
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
  document.body.replaceChildren();
  document.body.style.overflow = '';
  vi.restoreAllMocks();
});

function setup() {
  const container = document.querySelector<HTMLElement>('#controls')!;
  const demoSlot = document.querySelector<HTMLElement>('#slot')!;
  const onStateChange = vi.fn();
  const onProjectRequest = vi.fn();
  const controller = mountCatalogue({ container, demoSlot, onStateChange, onProjectRequest });
  controllers.push(controller);
  const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
  const click = (selector: string) => container.querySelector<HTMLButtonElement>(selector)!.click();
  return { controller, container, demoSlot, dialog, onStateChange, onProjectRequest, click };
}

describe('catalogue sessions and explicit controls', () => {
  it('starts in presentation and preserves explicit mode while selecting labelled concepts', () => {
    const { controller, container, click, onStateChange, onProjectRequest } = setup();
    expect(controller.getState()).toEqual({ goal: 'meisterwerk', mode: 'presentation' });
    expect(container.querySelector('[data-catalogue-goal="meisterwerk"]')!.textContent).toContain('01 / 04MeisterwerkRaumideen');
    expect(container.querySelector('[data-catalogue-goal="nordlicht"]')!.textContent).toContain('02 / 04NordlichtBedarfscheck');
    expect(container.querySelector('[data-catalogue-goal="sales"]')!.textContent).toContain('03 / 04Safran AtelierAnonymisierte Demo');
    click('[data-scene-mode="interactive"]');
    click('[data-catalogue-goal="nordlicht"]');
    expect(controller.getState()).toEqual({ goal: 'nordlicht', mode: 'interactive' });
    expect(onStateChange).toHaveBeenLastCalledWith({ goal: 'nordlicht', mode: 'interactive' });
    click('[data-scene-mode="layers"]');
    controller.selectGoal('sales');
    expect(controller.getState()).toEqual({ goal: 'sales', mode: 'layers' });
    expect(container.querySelectorAll('[data-catalogue-goal][aria-pressed="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-scene-mode][aria-pressed="true"]')).toHaveLength(1);
    expect(onProjectRequest).not.toHaveBeenCalled();
    click('[data-project-request]');
    expect(onProjectRequest).toHaveBeenCalledExactlyOnceWith('sales');
    const snapshot = controller.getState();
    snapshot.goal = 'meisterwerk';
    expect(controller.getState().goal).toBe('sales');
  });

  it('retains briefing, assistant and cart state in one live node per goal across selection and dialog', () => {
    const { controller, demoSlot, dialog } = setup();
    const inquiry = demoSlot.firstElementChild as HTMLElement;
    const name = inquiry.shadowRoot!.querySelector<HTMLInputElement>('[name="name"]')!;
    name.value = 'Ada';
    controller.selectGoal('nordlicht');
    const booking = demoSlot.firstElementChild as HTMLElement;
    const north = booking.shadowRoot!;
    north.querySelector<HTMLInputElement>('[value="existing"]')!.click();
    north.querySelector<HTMLButtonElement>('#next')!.click();
    controller.selectGoal('sales');
    const sales = demoSlot.firstElementChild as HTMLElement;
    sales.querySelector<HTMLButtonElement>('[data-variant="2"]')!.click();
    sales.querySelector<HTMLButtonElement>('[data-add-cart]')!.click();
    controller.selectGoal('meisterwerk');
    expect(demoSlot.firstElementChild).toBe(inquiry);
    expect(name.value).toBe('Ada');
    controller.open('nordlicht');
    expect(dialog.querySelector('.demo')).toBe(booking);
    expect(demoSlot.querySelector('.demo')).toBeNull();
    expect(north.querySelector('#progress')!.textContent).toBe('02 / 03');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(demoSlot.firstElementChild).toBe(booking);
    expect(booking.classList.contains('demo--responsive')).toBe(false);
    controller.open('sales');
    expect(dialog.querySelector('.demo')).toBe(sales);
    expect(sales.querySelector('[data-variant-name]')!.textContent).toBe('3 × 1 g');
    expect(sales.querySelector('[data-cart-count]')!.textContent).toBe('(1)');
    controller.selectGoal('meisterwerk');
    expect(dialog.open).toBe(false);
    expect(demoSlot.firstElementChild).toBe(inquiry);
    controller.selectGoal('sales');
    expect(demoSlot.firstElementChild).toBe(sales);
    expect(sales.querySelector('[data-cart-count]')!.textContent).toBe('(1)');
  });

  it('uses current slot layout after viewport changes during a modal and on later selections', () => {
    const { controller, demoSlot, dialog } = setup();
    const inquiry = demoSlot.firstElementChild as HTMLElement;
    controller.open();
    expect(inquiry.classList.contains('demo--responsive')).toBe(true);
    demoSlot.classList.add('demo--responsive');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(inquiry.classList.contains('demo--responsive')).toBe(true);
    controller.selectGoal('nordlicht');
    expect(demoSlot.firstElementChild!.classList.contains('demo--responsive')).toBe(true);
    controller.open();
    demoSlot.classList.remove('demo--responsive');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(demoSlot.firstElementChild!.classList.contains('demo--responsive')).toBe(false);
    controller.selectGoal('meisterwerk');
    expect(demoSlot.firstElementChild).toBe(inquiry);
    expect(inquiry.classList.contains('demo--responsive')).toBe(false);
  });

  it('restores launcher focus and overflow and ignores queued close events from an earlier opening', () => {
    const { controller, container, dialog, demoSlot } = setup();
    document.body.style.overflow = 'clip';
    const launcher = container.querySelector<HTMLButtonElement>('[data-open-current]')!;
    launcher.focus();
    launcher.click();
    expect(document.body.style.overflow).toBe('hidden');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(document.activeElement).toBe(launcher);
    expect(document.body.style.overflow).toBe('clip');
    controller.open('sales');
    dialog.dispatchEvent(new Event('close'));
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('.demo')!.getAttribute('data-demo')).toBe('sales');
    expect(demoSlot.querySelector('.demo')).toBeNull();
  });

  it('disposes the modal, controls and sessions once and permits a clean remount', () => {
    const { controller, container, demoSlot, onStateChange, onProjectRequest } = setup();
    controller.open('sales');
    const disposedDemo = document.querySelector<HTMLElement>('.concept-dialog .demo')!;
    const staleAdd = disposedDemo.querySelector<HTMLButtonElement>('[data-add-cart]')!;
    controller.dispose();
    controller.dispose();
    controller.selectGoal('nordlicht');
    controller.open();
    expect(document.querySelector('.concept-dialog')).toBeNull();
    expect(container.childElementCount).toBe(0);
    expect(demoSlot.childElementCount).toBe(0);
    expect(document.body.style.overflow).toBe('');
    staleAdd.click();
    expect(disposedDemo.querySelector('[data-cart-count]')!.textContent).toBe('(0)');
    const stateCalls = onStateChange.mock.calls.length;
    const next = mountCatalogue({ container, demoSlot, onStateChange, onProjectRequest });
    controllers.push(next);
    container.querySelector<HTMLButtonElement>('[data-catalogue-goal="nordlicht"]')!.click();
    expect(onStateChange).toHaveBeenCalledTimes(stateCalls + 2);
    expect(document.querySelectorAll('.concept-dialog')).toHaveLength(1);
    expect(demoSlot.querySelectorAll('.demo')).toHaveLength(1);
  });

  it('retains a reviewed order and partly completed briefing across dialog reparenting, selection and resize', () => {
    const { controller, demoSlot, dialog } = setup();
    const inquiry = demoSlot.firstElementChild as HTMLElement;
    inquiry.shadowRoot!.querySelector<HTMLInputElement>('[name="name"]')!.value = 'Ada';
    inquiry.shadowRoot!.querySelector<HTMLInputElement>('[name="email"]')!.value = 'ada@example.test';
    const wish = inquiry.shadowRoot!.querySelector<HTMLTextAreaElement>('[name="wish"]')!;
    wish.value = 'Mehr Stauraum';
    inquiry.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    controller.selectGoal('sales');
    const sales = demoSlot.firstElementChild as HTMLElement;
    sales.querySelector<HTMLButtonElement>('[data-add-cart]')!.click();
    sales.querySelector<HTMLButtonElement>('[data-checkout]')!.click();
    controller.open();
    expect(dialog.querySelector('.demo')).toBe(sales);
    expect(sales.querySelector<HTMLElement>('[data-step="review"]')!.hidden).toBe(false);
    expect(sales.querySelector('[data-order-items]')!.textContent).toContain('1 × Safran · 0,5 g');
    demoSlot.classList.add('demo--responsive');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(sales.classList.contains('demo--responsive')).toBe(true);
    controller.selectGoal('meisterwerk');
    expect(demoSlot.firstElementChild).toBe(inquiry);
    expect(inquiry.shadowRoot!.querySelector('#form-step')!.textContent).toBe('02 / 03');
    expect(wish.value).toBe('Mehr Stauraum');
    controller.selectGoal('sales');
    expect(demoSlot.firstElementChild).toBe(sales);
    expect(sales.querySelector<HTMLElement>('[data-step="review"]')!.hidden).toBe(false);
  });
});
