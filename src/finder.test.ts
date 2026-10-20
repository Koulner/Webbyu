// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountFinder } from './finder';
import { createBriefStore } from './state';

describe('project finder', () => {
  let container: HTMLDivElement;
  let store: ReturnType<typeof createBriefStore>;
  let finder: ReturnType<typeof mountFinder>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    store = createBriefStore();
    finder = mountFinder(container, store);
  });
  afterEach(() => { finder.dispose(); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function next() { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  function choose(value: string) { container.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click(); }
  function change(name: string, value: string) {
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  }

  it('treats uncertainty as exclusive and retains all choices and text when revisiting steps', () => {
    choose('bookings');
    next();
    choose('cms');
    choose('unsure');
    expect(store.get().extensions).toEqual(['unsure']);
    choose('seo');
    expect(store.get().extensions).toEqual(['seo']);
    next();
    change('projectType', 'existing');
    change('timing', 'later');
    change('description', 'Ein Atelier mit Terminbuchung.');
    next();
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    change('selectedPackage', 'shop');
    container.querySelector<HTMLButtonElement>('[data-action="back"]')!.click();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    next();
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    finder.openAtStart();
    expect(container.querySelector<HTMLInputElement>('[value="bookings"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLInputElement>('[value="seo"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    expect(container.querySelector<HTMLSelectElement>('[name="projectType"]')!.value).toBe('existing');
    expect(container.querySelector<HTMLSelectElement>('[name="timing"]')!.value).toBe('later');
    next();
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe('Ada Beispiel');
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('shop');
  });

  it('reflects external hero and package choices without erasing inputs', () => {
    store.update({ goal: 'sales', selectedPackage: 'shop', description: 'Unsere Idee' });
    expect(container.querySelector<HTMLInputElement>('[value="sales"]')!.checked).toBe(true);
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('shop');
    store.update({ goal: 'presence', selectedPackage: null });
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('presence');
    expect(store.get().description).toBe('Unsere Idee');
  });

  it.each([
    ['presence', 'presence'],
    ['inquiries', 'business'],
    ['bookings', 'business'],
    ['sales', 'shop'],
  ])('takes the %s route to its recommendation and allows a manual choice', (goal, recommendation) => {
    choose(goal);
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe(recommendation);
    change('selectedPackage', recommendation === 'shop' ? 'presence' : 'shop');
    expect(container.querySelector('.finder-recommendation-label')!.textContent).toBe('Ihre Paketauswahl');
    finder.openAtStart();
    expect(document.activeElement).toBe(container.querySelector('.finder-heading'));
    choose(goal === 'sales' ? 'presence' : 'sales');
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe(goal === 'sales' ? 'presence' : 'shop');
    expect(container.querySelector('.finder-recommendation-label')!.textContent).toBe('Meine Empfehlung');
  });

  it('requires valid contact data and safely displays the complete local summary without a request', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    store.update({ goal: 'sales', extensions: ['cms', '3d'], projectType: 'existing', timing: 'soon', description: '<img src=x onerror="alert(1)">', selectedPackage: 'shop' });
    next(); next(); next();
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', '  ');
    change('email', 'keine-adresse');
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    next();
    const summary = container.querySelector('[data-summary]')!;
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('Produkte verkaufen');
    expect(summary.textContent).toContain('Shop & Produkte');
    expect(summary.textContent).toContain('Inhalte selbst pflegen');
    expect(summary.textContent).toContain('Etwas Besonderes erleben');
    expect(summary.textContent).toContain('Eine bestehende Website erneuern');
    expect(summary.textContent).toContain('Möglichst bald');
    expect(summary.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(summary.querySelector('img')).toBeNull();
    expect(summary.textContent).toContain('Ada Beispiel');
    expect(summary.textContent).toContain('ada@example.com');
    expect(container.textContent).toContain('Nichts versendet');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    container.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
    expect(store.get().name).toBe('Ada Beispiel');
  });

  it('copies the completed briefing only after the copy button is pressed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    store.update({ name: 'Ada Beispiel', email: 'ada@example.com', description: 'Ein neuer Auftritt.' });
    next(); next(); next(); next();
    expect(writeText).not.toHaveBeenCalled();
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')!.click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('Ihre Idee: Ein neuer Auftritt.');
    expect(writeText.mock.calls[0][0]).toContain('Lokaler Prototyp – nichts versendet.');
    expect(container.querySelector('.finder-copy-status')!.textContent).toContain('wurde kopiert');
  });

  it('keeps the briefing available when clipboard access is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
    store.update({ name: 'Ada Beispiel', email: 'ada@example.com' });
    next(); next(); next(); next();
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')!.click();
    await Promise.resolve();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    expect(window.getSelection()!.toString()).toContain('ada@example.com');
    expect(container.querySelector('.finder-copy-status')!.textContent).toContain('Kopieren Sie sie');
  });
});
