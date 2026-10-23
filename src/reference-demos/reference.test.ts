// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemo, disposeDemo } from '../demos';
import { mountCatalogue } from '../catalogue';
import type { DemoId } from '../data';

let cleanups: (() => void)[];
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeEach(() => {
  cleanups = [];
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanups.reverse().forEach(cleanup => cleanup());
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function setup(id: Exclude<DemoId, 'sales'>) {
  const host = createDemo(id);
  document.body.append(host);
  cleanups.push(() => disposeDemo(host));
  const root = host.shadowRoot!;
  const click = (selector: string) => root.querySelector<HTMLElement>(selector)!.click();
  const fill = (name: string, value: string) => {
    const element = root.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const submit = (selector: string) => root.querySelector(selector)!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return { host, root, click, fill, submit };
}

describe('imported business demos', () => {
  it('guides a room wish through a validated, editable local project briefing', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { root, click, fill, submit } = setup('meisterwerk');
    click('[data-case="storage"]');
    expect(root.querySelector<HTMLElement>('#room-comparison')!.hidden).toBe(true);
    expect(root.querySelector<HTMLSelectElement>('[name="room"]')!.value).toBe('Stauraum schaffen');
    click('[data-material="linen"]');
    expect(root.querySelector('#material-detail')!.textContent).toContain('Leinen');
    submit('#project-form');
    expect(root.querySelector('#form-step')!.textContent).toBe('01 / 03');
    fill('wish', '<img src=x onerror=alert(1)> Mehr Stauraum');
    submit('#project-form');
    fill('situation', 'Eigentum, aktuell bewohnt');
    fill('scope', 'Ein Raum / einzelner Einbau');
    fill('time', 'In 3–6 Monaten');
    fill('place', 'Hamburg');
    submit('#project-form');
    fill('name', 'Ada');
    fill('email', 'ada@example.test');
    submit('#project-form');
    expect(root.querySelector<HTMLElement>('#brief-result')!.hidden).toBe(false);
    expect(root.querySelector('#brief-preview')!.textContent).toContain('Stauraum schaffen');
    expect(root.querySelector('#brief-preview')!.textContent).toContain('<img src=x');
    expect(root.querySelector('#brief-preview img')).toBeNull();
    click('#brief-edit');
    expect(root.querySelector<HTMLTextAreaElement>('[name="wish"]')!.value).toContain('Mehr Stauraum');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('branches the building check and invalidates dependent answers when the earlier choice changes', () => {
    const { root, click } = setup('nordlicht');
    click('#next');
    expect(root.querySelector('#choice-error')!.textContent).toContain('wählen');
    click('[value="new"]'); click('#next');
    click('[value="business"]'); click('#next');
    expect(root.querySelector('[value="concept"]')).not.toBeNull();
    click('[value="concept"]'); click('#next');
    expect(root.querySelector('#result-title')!.textContent).toContain('Technikkonzept');
    click('#edit-answers'); click('[value="existing"]'); click('#next');
    expect(root.querySelector('input:checked')).toBeNull();
    click('[value="home"]'); click('#next');
    expect(root.querySelector('[value="concept"]')).toBeNull();
    click('[value="energy"]'); click('#next');
    click('#prepare');
    expect(root.querySelector<HTMLElement>('#contact')!.hidden).toBe(false);
    click('[data-route="maintenance"]');
    expect(root.querySelector<HTMLElement>('#contact')!.hidden).toBe(true);
    click('[data-route="fault"]'); click('[value="unsure"]'); click('#next');
    expect(root.querySelector('#result-title')!.textContent).toContain('realen Hilfeweg');
    expect(root.querySelector<HTMLButtonElement>('#prepare')!.hidden).toBe(true);
  });

  it('compares ingredients, keeps a sample list and produces a safe local request with no storage', () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const { root, click, fill, submit } = setup('solara');
    click('[data-compare="saffron"]'); click('[data-compare="pepper"]');
    click('#show-compare');
    expect(root.querySelector('#comparison')!.textContent).toContain('Schwarzer Pfeffer');
    click('#compare-dialog [data-close]');
    click('#products [data-sample="saffron"]');
    click('[data-blend]');
    fill('application', 'Saucen'); fill('profile', 'Rauchig und frisch');
    submit('#blend-form');
    expect(root.querySelector('#blend-summary')!.textContent).toContain('Rauchig und frisch');
    fill('context', '<img src=x> Eine neue Sauce');
    fill('company', 'Testküche'); fill('email', 'ada@example.test');
    submit('#request-form');
    expect(root.querySelector<HTMLElement>('#request-result')!.hidden).toBe(false);
    expect(root.querySelector('#request-preview')!.textContent).toContain('Safran');
    expect(root.querySelector('#request-preview')!.textContent).toContain('Rauchig und frisch');
    expect(root.querySelector('#request-preview img')).toBeNull();
    expect(storage).not.toHaveBeenCalled();
  });

  it('preserves Solara state across reparenting and closes the inner dialog before the gallery', () => {
    const container = document.createElement('div'), slot = document.createElement('div');
    document.body.append(container, slot);
    const request = vi.fn();
    const catalogue = mountCatalogue({ container, demoSlot: slot, onStateChange: () => {}, onProjectRequest: request });
    cleanups.push(() => catalogue.dispose());
    catalogue.selectGoal('solara');
    const demo = slot.firstElementChild as HTMLElement;
    demo.shadowRoot!.querySelector<HTMLButtonElement>('#products [data-sample="saffron"]')!.click();
    catalogue.selectGoal('sales'); catalogue.open('solara');
    expect(document.querySelector('.concept-dialog .demo')).toBe(demo);
    expect(demo.shadowRoot!.querySelector('#sample-count')!.textContent).toBe('1');
    demo.shadowRoot!.querySelector<HTMLButtonElement>('#open-list')!.click();
    const dialog = document.querySelector<HTMLDialogElement>('.concept-dialog')!;
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(true);
    expect(demo.shadowRoot!.querySelector<HTMLDialogElement>('#list-dialog')!.open).toBe(false);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(slot.firstElementChild).toBe(demo);
    container.querySelector<HTMLButtonElement>('[data-project-request]')!.click();
    expect(request).toHaveBeenCalledExactlyOnceWith('inquiries');
  });
});
