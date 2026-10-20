// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemo, mountDemoDialog } from './demos';
import type { DemoGoal } from './data';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
let scrollIntoView: ReturnType<typeof vi.fn>;
let dialogs: ReturnType<typeof mountDemoDialog>[];

beforeEach(() => {
  dialogs = [];
  scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
});

afterEach(() => {
  dialogs.forEach((dialog) => dialog.dispose());
  for (const [prototype, name, descriptor] of [
    [HTMLDialogElement.prototype, 'showModal', originalShowModal],
    [HTMLDialogElement.prototype, 'close', originalClose],
    [HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView],
  ] as const) {
    if (descriptor) Object.defineProperty(prototype, name, descriptor);
    else Reflect.deleteProperty(prototype, name);
  }
  document.body.replaceChildren();
  document.body.style.overflow = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function demo(goal: DemoGoal): HTMLElement {
  const root = createDemo(goal);
  document.body.append(root);
  return root;
}

function button(root: ParentNode, selector: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(selector)!;
}

function openPanel(root: HTMLElement): HTMLButtonElement {
  const trigger = button(root, '[data-panel-open]');
  trigger.focus();
  trigger.click();
  return trigger;
}

function change(root: HTMLElement, name: string, value: string): void {
  const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
  field.value = value;
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

function submit(root: HTMLElement): void {
  root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function mountDialog(): ReturnType<typeof mountDemoDialog> {
  const controller = mountDemoDialog();
  dialogs.push(controller);
  return controller;
}

describe('interactive concept demos', () => {
  it('validates inquiry fields and renders a local, safe result that clears on editing', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    const root = demo('inquiries');
    const result = root.querySelector<HTMLElement>('.demo-result')!;
    openPanel(root);
    submit(root);
    expect(result.textContent).toBe('');
    change(root, 'name', '  ');
    change(root, 'email', 'ada@example.com');
    submit(root);
    expect(result.textContent).toBe('');
    expect(root.querySelector<HTMLInputElement>('[name="name"]')!.validity.customError).toBe(true);
    change(root, 'name', '<img src=x onerror="alert(1)">');
    change(root, 'email', 'keine-adresse');
    submit(root);
    expect(result.textContent).toBe('');
    change(root, 'email', 'ada@example.com');
    submit(root);
    expect(result.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(result.querySelector('img')).toBeNull();
    expect(result.textContent).toContain('Ihre Anfrage wurde nicht versendet');
    change(root, 'project', 'Ein neuer Auftritt.');
    expect(result.textContent).toBe('');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('uses the selected course, day, and time and preserves them after closing the panel', () => {
    const root = demo('bookings');
    const trigger = openPanel(root);
    const result = root.querySelector<HTMLElement>('.demo-result')!;
    submit(root);
    expect(result.textContent).toContain('Pilates am Montag, 19. Oktober um 09:00 Uhr');
    change(root, 'service', 'Slow Stretch');
    expect(result.textContent).toBe('');
    button(root, '[data-day="Donnerstag, 22. Oktober"]').click();
    button(root, '[data-time="18:00"]').click();
    expect(root.querySelectorAll('[data-day][aria-pressed="true"]')).toHaveLength(1);
    expect(root.querySelectorAll('[data-time][aria-pressed="true"]')).toHaveLength(1);
    submit(root);
    expect(result.textContent).toContain('Slow Stretch am Donnerstag, 22. Oktober um 18:00 Uhr');
    expect(result.textContent).toContain('Kein echter Termin wurde gebucht');
    button(root, '[data-panel-close]').click();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    expect(root.querySelector<HTMLSelectElement>('[name="service"]')!.value).toBe('Slow Stretch');
    expect(button(root, '[data-day="Donnerstag, 22. Oktober"]').getAttribute('aria-pressed')).toBe('true');
    expect(button(root, '[data-time="18:00"]').getAttribute('aria-pressed')).toBe('true');
    button(root, '[data-time="12:30"]').click();
    expect(result.textContent).toBe('');
  });

  it('keeps separate cart variants, updates amounts, and restores focus after quantity changes or removal', () => {
    const root = demo('sales');
    button(root, '[data-add-cart]').click();
    button(root, '[data-add-cart]').click();
    button(root, '[data-variant="1"]').click();
    expect(root.querySelector('[data-variant-name]')!.textContent).toBe('Kreide');
    expect(root.querySelectorAll('[data-variant][aria-pressed="true"]')).toHaveLength(1);
    button(root, '[data-add-cart]').click();
    openPanel(root);
    expect(root.querySelectorAll('.demo-cart-line')).toHaveLength(2);
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(3)');
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('387 €');
    button(root, '[data-cart-variant="0"] [data-less]').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('258 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="0"] [data-less]'));
    button(root, '[data-cart-variant="0"] [data-more]').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('387 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="0"] [data-more]'));
    button(root, '[data-cart-variant="0"] .demo-cart-remove').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('129 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="1"] .demo-cart-remove'));
    button(root, '[data-cart-variant="1"] [data-less]').click();
    expect(root.querySelectorAll('.demo-cart-line')).toHaveLength(0);
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(0)');
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('0 €');
    expect(root.querySelector('.demo-cart-empty')).not.toBeNull();
    expect(document.activeElement).toBe(button(root, '[data-panel-close]'));
  });

  it('closes the inner panel on the first Escape and the modal on the next, restoring focus and page scrolling', () => {
    const launch = document.createElement('button');
    document.body.append(launch);
    document.body.style.overflow = 'clip';
    launch.focus();
    const controller = mountDialog();
    controller.open('bookings');
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const root = dialog.querySelector<HTMLElement>('.demo')!;
    const trigger = openPanel(root);
    const panel = root.querySelector<HTMLElement>('.demo-panel')!;
    const modalKeydown = vi.fn();
    dialog.addEventListener('keydown', modalKeydown);
    const firstEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    button(root, '[data-panel-close]').dispatchEvent(firstEscape);
    expect(firstEscape.defaultPrevented).toBe(true);
    expect(modalKeydown).not.toHaveBeenCalled();
    expect(panel.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('.demo-main')!.inert).toBe(false);
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(trigger);
    const secondEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    trigger.dispatchEvent(secondEscape);
    expect(secondEscape.defaultPrevented).toBe(false);
    // jsdom has no native dialog Escape default action; dispatch its cancel event explicitly.
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(launch);
    expect(document.body.style.overflow).toBe('clip');
  });

  it('resets modal and panel scrolling when opening from a lower CTA and when reopening a cached concept', () => {
    const controller = mountDialog();
    controller.open('bookings');
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    const root = dialog.querySelector<HTMLElement>('.demo')!;
    const panel = root.querySelector<HTMLElement>('.demo-panel')!;
    dialog.scrollTop = 420;
    panel.scrollTop = 180;
    button(root, '.demo-studio-copy [data-panel-open]').click();
    expect(panel.hidden).toBe(false);
    expect(panel.scrollTop).toBe(0);
    expect(dialog.scrollTop).toBe(0);
    expect(scrollIntoView).not.toHaveBeenCalled();
    change(root, 'service', 'Yoga Flow');
    button(root, '[data-panel-close]').click();
    dialog.scrollTop = 350;
    controller.close();
    controller.open('bookings');
    expect(dialog.scrollTop).toBe(0);
    expect(dialog.querySelector('.demo')).toBe(root);
    expect(root.querySelector<HTMLSelectElement>('[name="service"]')!.value).toBe('Yoga Flow');
    dialog.scrollTop = 260;
    controller.open('sales');
    expect(dialog.scrollTop).toBe(0);
  });

  it.each([false, true])('scrolls only a responsive inline demo into view (responsive: %s)', (responsive) => {
    const root = demo('inquiries');
    root.classList.toggle('demo--responsive', responsive);
    const panel = root.querySelector<HTMLElement>('.demo-panel')!;
    panel.scrollTop = 190;
    const trigger = openPanel(root);
    expect(panel.scrollTop).toBe(0);
    expect(root.querySelector<HTMLElement>('.demo-main')!.inert).toBe(true);
    expect(document.activeElement).toBe(button(root, '[data-panel-close]'));
    if (responsive) {
      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'start', behavior: 'instant' });
      expect(scrollIntoView.mock.contexts[0]).toBe(root);
    } else {
      expect(scrollIntoView).not.toHaveBeenCalled();
    }
    button(root, '[data-panel-close]').click();
    expect(document.activeElement).toBe(trigger);
  });
});
