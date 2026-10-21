// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemo, disposeDemo, mountDemoDialog } from './demos';
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
  it('validates inquiry fields, reviews escaped text and confirms locally with an editable draft', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    const root = demo('inquiries');
    const result = root.querySelector<HTMLElement>('.demo-result')!;
    openPanel(root);
    submit(root);
    expect(result.textContent).toBe('');
    expect(root.querySelector('.demo-validation')!.textContent).toContain('markierten Felder');
    expect(document.activeElement).toBe(root.querySelector('[name="name"]'));
    expect(root.querySelector('[name="email"]')!.getAttribute('aria-invalid')).toBe('true');
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
    const review = root.querySelector<HTMLElement>('[data-step="review"]')!;
    expect(review.hidden).toBe(false);
    expect(review.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(review.querySelector('img')).toBeNull();
    expect(result.textContent).toBe('');
    expect(document.activeElement).toBe(root.querySelector('[data-review-title]'));
    button(root, '[data-confirm]').click();
    expect(result.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(result.querySelector('img')).toBeNull();
    expect(result.textContent).toContain('Ihre Anfrage wurde nicht versendet');
    button(root, '[data-step="complete"] [data-edit]').click();
    expect(root.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    change(root, 'project', 'Ein neuer Auftritt.');
    expect(result.textContent).toBe('');
    submit(root);
    expect(review.textContent).toContain('Ein neuer Auftritt.');
    button(root, '[data-step="review"] [data-edit]').click();
    expect(document.activeElement).toBe(root.querySelector('[name="name"]'));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('uses the selected course, day, and time and preserves them after closing the panel', () => {
    const root = demo('bookings');
    const trigger = openPanel(root);
    const result = root.querySelector<HTMLElement>('.demo-result')!;
    submit(root);
    expect(root.querySelector('[data-step="review"]')!.textContent).toContain('Pilates · 60 Minuten');
    button(root, '[data-confirm]').click();
    expect(result.textContent).toContain('Pilates am Montag, 19. Oktober um 09:00 Uhr');
    button(root, '[data-step="complete"] [data-edit]').click();
    change(root, 'service', 'Slow Stretch');
    expect(result.textContent).toBe('');
    button(root, '[data-day="Donnerstag, 22. Oktober"]').click();
    button(root, '[data-time="18:00"]').click();
    expect(root.querySelectorAll('[data-day][aria-pressed="true"]')).toHaveLength(1);
    expect(root.querySelectorAll('[data-time][aria-pressed="true"]')).toHaveLength(1);
    submit(root);
    button(root, '[data-confirm]').click();
    expect(result.textContent).toContain('Slow Stretch am Donnerstag, 22. Oktober um 18:00 Uhr');
    expect(result.textContent).toContain('Kein echter Termin wurde gebucht');
    button(root, '[data-panel-close]').click();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    expect(root.querySelector<HTMLSelectElement>('[name="service"]')!.value).toBe('Slow Stretch');
    expect(button(root, '[data-day="Donnerstag, 22. Oktober"]').getAttribute('aria-pressed')).toBe('true');
    expect(button(root, '[data-time="18:00"]').getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector<HTMLElement>('[data-step="complete"]')!.hidden).toBe(false);
    button(root, '[data-step="complete"] [data-edit]').click();
    button(root, '[data-time="12:30"]').click();
    expect(result.textContent).toBe('');
  });

  it('reconciles time availability with course and day, including days without appointments', () => {
    const root = demo('bookings');
    openPanel(root);
    change(root, 'service', 'Slow Stretch');
    expect(root.querySelectorAll('[data-time][aria-pressed="true"]')).toHaveLength(0);
    expect(button(root, '[data-time="09:00"]').disabled).toBe(true);
    submit(root);
    expect(root.querySelector<HTMLElement>('[data-step="review"]')!.hidden).toBe(true);
    expect(document.activeElement).toBe(button(root, '[data-time="12:30"]'));
    button(root, '[data-day="Mittwoch, 21. Oktober"]').click();
    expect(root.querySelectorAll('[data-time]:disabled')).toHaveLength(3);
    expect(root.querySelector('.demo-availability')!.textContent).toContain('keinen Beispieltermin');
    submit(root);
    expect(root.querySelector('.demo-validation')!.textContent).toContain('verfügbarem Termin');
    button(root, '[data-day="Donnerstag, 22. Oktober"]').click();
    button(root, '[data-time="18:00"]').click();
    change(root, 'service', 'Yoga Flow');
    expect(button(root, '[data-time="18:00"]').getAttribute('aria-pressed')).toBe('true');
    submit(root);
    const review = root.querySelector('[data-step="review"]')!;
    expect(review.textContent).toContain('Yoga Flow · 60 Minuten');
    expect(review.textContent).toContain('20');
    expect(review.textContent).toContain('Donnerstag, 22. Oktober 2026');
  });

  it('keeps separate cart variants, updates amounts, and restores focus after quantity changes or removal', () => {
    const root = demo('sales');
    button(root, '[data-add-cart]').click();
    button(root, '[data-add-cart]').click();
    button(root, '[data-variant="1"]').click();
    expect(root.querySelector('[data-variant-name]')!.textContent).toBe('1 g');
    expect(root.querySelectorAll('[data-variant][aria-pressed="true"]')).toHaveLength(1);
    button(root, '[data-add-cart]').click();
    openPanel(root);
    expect(root.querySelectorAll('.demo-cart-line')).toHaveLength(2);
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(3)');
    expect(root.querySelector<HTMLElement>('[data-cart-open-inline]')!.hidden).toBe(false);
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('34 €');
    button(root, '[data-cart-variant="0"] [data-less]').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('25 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="0"] [data-less]'));
    button(root, '[data-cart-variant="0"] [data-more]').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('34 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="0"] [data-more]'));
    button(root, '[data-cart-variant="0"] .demo-cart-remove').click();
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('16 €');
    expect(document.activeElement).toBe(button(root, '[data-cart-variant="1"] .demo-cart-remove'));
    button(root, '[data-cart-variant="1"] [data-less]').click();
    expect(root.querySelectorAll('.demo-cart-line')).toHaveLength(0);
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(0)');
    expect(root.querySelector('[data-cart-total]')!.textContent!.replace(/\s/g, ' ')).toBe('0 €');
    expect(root.querySelector('.demo-cart-empty')).not.toBeNull();
    expect(root.querySelector<HTMLElement>('[data-cart-open-inline]')!.hidden).toBe(true);
    expect(document.activeElement).toBe(button(root, '[data-panel-close]'));
    expect(button(root, '[data-checkout]').disabled).toBe(true);
  });

  it('validates product quantities and calculates an editable local order including delivery', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    const root = demo('sales');
    for (const value of ['', '0', '-1', '1.5', '100']) {
      change(root, 'quantity', value);
      button(root, '[data-add-cart]').click();
      expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(0)');
      expect(root.querySelector('.demo-shop-status')!.textContent).toContain('ganze Menge');
    }
    change(root, 'quantity', '2');
    button(root, '[data-variant="2"]').click();
    button(root, '[data-add-cart]').click();
    openPanel(root);
    button(root, '[data-checkout]').click();
    expect(root.querySelector('[data-order-items]')!.textContent).toContain('2 × Safran · 3 × 1 g');
    expect(root.querySelector('[data-order-totals]')!.textContent!.replace(/\s/g, ' ')).toContain('88 €');
    change(root, 'shipping', 'pickup');
    expect(root.querySelector('[data-order-totals]')!.textContent!.replace(/\s/g, ' ')).toContain('84 €');
    button(root, '[data-order-confirm]').click();
    expect(root.querySelector<HTMLElement>('[data-step="complete"]')!.hidden).toBe(false);
    expect(root.querySelector('.demo-result')!.textContent).toContain('Abholung');
    button(root, '[data-step="complete"] [data-cart-edit]').click();
    button(root, '[data-more]').click();
    button(root, '[data-checkout]').click();
    button(root, '[data-order-confirm]').click();
    expect(root.querySelector('[data-order-receipt]')!.textContent!.replace(/\s/g, ' ')).toContain('126 €');
    expect(root.querySelector('.demo-result')!.textContent).toContain('3 Packungen');
    button(root, '[data-panel-close]').click();
    change(root, 'quantity', '99');
    button(root, '[data-add-cart]').click();
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(99)');
    expect(root.querySelector('.demo-shop-status')!.textContent).toContain('96 hinzugefügt');
    openPanel(root);
    expect(root.querySelector<HTMLElement>('[data-step="edit"]')!.hidden).toBe(false);
    button(root, '[data-more]').click();
    expect(root.querySelector('[data-cart-count]')!.textContent).toBe('(99)');
    expect(root.querySelector('.demo-cart-status')!.textContent).toContain('Maximal 99');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it.each(['inquiries', 'bookings', 'sales'] as const)('keeps %s previews inert and disposes live handlers', goal => {
    const preview = createDemo(goal, { interactive: false });
    document.body.append(preview);
    expect(preview.inert).toBe(true);
    expect(preview.getAttribute('aria-hidden')).toBe('true');
    button(preview, '[data-panel-open]').click();
    expect(preview.querySelector<HTMLElement>('.demo-panel')!.hidden).toBe(true);
    const root = demo(goal);
    const launcher = button(root, '[data-panel-open]');
    disposeDemo(root);
    disposeDemo(root);
    launcher.click();
    expect(root.querySelector<HTMLElement>('.demo-panel')!.hidden).toBe(true);
    expect(root.isConnected).toBe(false);
    disposeDemo(preview);
  });

  it('presents an anonymous botanical shop with local assets and independent chapter and package choices', () => {
    const root = demo('sales');
    expect(root.textContent).toContain('Fiktive Marke');
    expect(root.outerHTML).not.toMatch(/royal|herat|afghanistan|shopify|mailto:|tel:/i);
    for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
      expect(new URL(image.src).origin).toBe(window.location.origin);
      expect(new URL(image.src).pathname).toContain('/assets/demos/saffron/');
    }
    expect(root.querySelector('form[action], a[href]')).toBeNull();
    const image = root.querySelector<HTMLImageElement>('[data-ingredient-image]')!;
    expect(image.alt).toContain('Safranblüte');
    button(root, '[data-ingredient="1"]').click();
    expect(image.alt).toContain('Narbenast');
    expect(root.querySelector('[data-ingredient-caption]')!.textContent).toContain('Nahaufnahme');
    button(root, '[data-ingredient="2"]').click();
    expect(image.src).toContain('threads.webp');
    expect(root.querySelectorAll('[data-ingredient][aria-pressed="true"]')).toHaveLength(1);
    button(root, '[data-variant="2"]').click();
    expect(root.querySelector('[data-product-price]')!.textContent!.replace(/\s/g, ' ')).toBe('42 €');
    expect(root.querySelector('[data-unit-price]')!.textContent!.replace(/\s/g, ' ')).toContain('14 € / g');
    button(root, '[data-add-cart]').click();
    openPanel(root);
    button(root, '[data-checkout]').click();
    expect(root.querySelector('[data-order-items]')!.textContent).toContain('1 × Safran · 3 × 1 g');
    button(root, '[data-panel-close]').click();
    expect(root.querySelector('[data-ingredient="2"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-variant="2"]')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('closes the inner panel on the first Escape and the modal on the next, restoring focus and page scrolling', () => {
    const launch = document.createElement('button');
    document.body.append(launch);
    document.body.style.overflow = 'clip';
    launch.focus();
    const controller = mountDialog();
    const liveDemo = demo('bookings');
    controller.open('bookings', liveDemo);
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
    expect(liveDemo.parentElement).toBe(document.body);
    expect(liveDemo.classList.contains('demo--responsive')).toBe(false);
    expect(document.activeElement).toBe(launch);
    expect(document.body.style.overflow).toBe('clip');
  });

  it('resets modal and panel scrolling when opening from a lower CTA and when reopening a cached concept', () => {
    const controller = mountDialog();
    const liveDemo = demo('bookings');
    controller.open('bookings', liveDemo);
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
    expect(dialog.scrollTop).toBe(420);
    dialog.scrollTop = 350;
    controller.close();
    controller.open('bookings', liveDemo);
    expect(dialog.scrollTop).toBe(0);
    expect(dialog.querySelector('.demo')).toBe(root);
    expect(root.querySelector<HTMLSelectElement>('[name="service"]')!.value).toBe('Yoga Flow');
    dialog.scrollTop = 260;
    controller.open('sales', demo('sales'));
    expect(dialog.scrollTop).toBe(0);
    expect(liveDemo.parentElement).toBe(document.body);
  });

  it('closes an already open inner panel first even when Escape originates from the modal bar', () => {
    const liveDemo = demo('inquiries');
    openPanel(liveDemo);
    const controller = mountDialog();
    controller.open('inquiries', liveDemo);
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(liveDemo.querySelector<HTMLElement>('.demo-panel')!.hidden).toBe(true);
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(false);
  });

  it('restores the same node, original sibling position and responsive class on disposal', () => {
    const liveDemo = demo('inquiries');
    liveDemo.classList.add('demo--responsive');
    const sibling = document.createElement('span');
    liveDemo.after(sibling);
    const controller = mountDialog();
    controller.open('inquiries', liveDemo);
    controller.dispose();
    controller.dispose();
    expect(liveDemo.nextSibling).toBe(sibling);
    expect(liveDemo.classList.contains('demo--responsive')).toBe(true);
    expect(document.querySelector('.concept-dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
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
