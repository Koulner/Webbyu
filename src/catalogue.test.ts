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
    expect(controller.getState()).toEqual({ goal: 'inquiries', mode: 'presentation' });
    expect(container.querySelector('[data-catalogue-goal="inquiries"]')!.textContent).toContain('01 / 03KlarraumAnfragen');
    expect(container.querySelector('[data-catalogue-goal="bookings"]')!.textContent).toContain('02 / 03Studio StillBuchungen');
    expect(container.querySelector('[data-catalogue-goal="sales"]')!.textContent).toContain('03 / 03FormaVerkäufe');
    click('[data-scene-mode="interactive"]');
    click('[data-catalogue-goal="bookings"]');
    expect(controller.getState()).toEqual({ goal: 'bookings', mode: 'interactive' });
    expect(onStateChange).toHaveBeenLastCalledWith({ goal: 'bookings', mode: 'interactive' });
    click('[data-scene-mode="layers"]');
    controller.selectGoal('sales');
    expect(controller.getState()).toEqual({ goal: 'sales', mode: 'layers' });
    expect(container.querySelectorAll('[data-catalogue-goal][aria-pressed="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-scene-mode][aria-pressed="true"]')).toHaveLength(1);
    expect(onProjectRequest).not.toHaveBeenCalled();
    click('[data-project-request]');
    expect(onProjectRequest).toHaveBeenCalledExactlyOnceWith('sales');
    const snapshot = controller.getState();
    snapshot.goal = 'inquiries';
    expect(controller.getState().goal).toBe('sales');
  });

  it('retains form, booking and cart state in one live node per goal across selection and dialog', () => {
    const { controller, demoSlot, dialog } = setup();
    const inquiry = demoSlot.firstElementChild as HTMLElement;
    const name = inquiry.querySelector<HTMLInputElement>('[name="name"]')!;
    name.value = 'Ada';
    controller.selectGoal('bookings');
    const booking = demoSlot.firstElementChild as HTMLElement;
    const service = booking.querySelector<HTMLSelectElement>('[name="service"]')!;
    service.value = 'Yoga Flow';
    booking.querySelector<HTMLButtonElement>('[data-time="18:00"]')!.click();
    controller.selectGoal('sales');
    const sales = demoSlot.firstElementChild as HTMLElement;
    sales.querySelector<HTMLButtonElement>('[data-variant="2"]')!.click();
    sales.querySelector<HTMLButtonElement>('[data-add-cart]')!.click();
    controller.selectGoal('inquiries');
    expect(demoSlot.firstElementChild).toBe(inquiry);
    expect(name.value).toBe('Ada');
    controller.open('bookings');
    expect(dialog.querySelector('.demo')).toBe(booking);
    expect(demoSlot.querySelector('.demo')).toBeNull();
    expect(service.value).toBe('Yoga Flow');
    expect(booking.querySelector('[data-time="18:00"]')!.getAttribute('aria-pressed')).toBe('true');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(demoSlot.firstElementChild).toBe(booking);
    expect(booking.classList.contains('demo--responsive')).toBe(false);
    controller.open('sales');
    expect(dialog.querySelector('.demo')).toBe(sales);
    expect(sales.querySelector('[data-variant-name]')!.textContent).toBe('Kobalt');
    expect(sales.querySelector('[data-cart-count]')!.textContent).toBe('(1)');
    controller.selectGoal('inquiries');
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
    controller.selectGoal('bookings');
    expect(demoSlot.firstElementChild!.classList.contains('demo--responsive')).toBe(true);
    controller.open();
    demoSlot.classList.remove('demo--responsive');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(demoSlot.firstElementChild!.classList.contains('demo--responsive')).toBe(false);
    controller.selectGoal('inquiries');
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
    controller.dispose();
    controller.dispose();
    controller.selectGoal('bookings');
    controller.open();
    expect(document.querySelector('.concept-dialog')).toBeNull();
    expect(container.childElementCount).toBe(0);
    expect(demoSlot.childElementCount).toBe(0);
    expect(document.body.style.overflow).toBe('');
    const stateCalls = onStateChange.mock.calls.length;
    const next = mountCatalogue({ container, demoSlot, onStateChange, onProjectRequest });
    controllers.push(next);
    container.querySelector<HTMLButtonElement>('[data-catalogue-goal="bookings"]')!.click();
    expect(onStateChange).toHaveBeenCalledTimes(stateCalls + 2);
    expect(document.querySelectorAll('.concept-dialog')).toHaveLength(1);
    expect(demoSlot.querySelectorAll('.demo')).toHaveLength(1);
  });
});
