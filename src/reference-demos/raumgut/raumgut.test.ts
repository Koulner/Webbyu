// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemo, disposeDemo } from '../../demos';
import { cartTotal, findProducts, setQuantity, type Filters } from './products';

let host: HTMLElement;
let root: ShadowRoot;
const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector(selector) as T;
const click = (selector: string) => $(selector).click();
const change = (selector: string, value: string, type = 'change') => {
  const input = $<HTMLInputElement>(selector); input.value = value;
  input.dispatchEvent(new Event(type, { bubbles: true }));
};
const submit = (selector: string) => $(selector).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const normalized = (selector: string) => $(selector).textContent!.replace(/\s/g, ' ');
const defaults: Filters = { query: '', category: 'Alle', max: 200000, available: false, offers: false, fresh: false, sort: 'curated' };
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } });
  HTMLElement.prototype.scrollIntoView = vi.fn();
  host = createDemo('raumgut'); document.body.append(host); root = host.shadowRoot!;
});
afterEach(() => {
  if (host) disposeDemo(host); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

describe('Raumgut retailer demo', () => {
  it('combines category, material search, budget, availability and sorting, and recovers from no results', () => {
    expect(findProducts({ ...defaults, query: 'walnuss', max: 50000, available: true }).map(p => p.id)).toEqual(['nori']);
    expect(findProducts({ ...defaults, category: 'Accessoires', sort: 'desc' }).map(p => p.id)).toEqual(['sora', 'terra']);
    change('#rg-query', 'walnuss', 'input');
    expect(root.querySelectorAll('[data-product-card]')).toHaveLength(2);
    change('#rg-price', '50000');
    expect(root.querySelectorAll('[data-product-card]')).toHaveLength(1);
    change('#rg-query', '<img src=x>', 'input');
    expect($('#rg-grid').textContent).toContain('anderen Suchbegriff');
    expect($('#rg-search-note').textContent).toContain('<img src=x>');
    expect($('#rg-search-note img')).toBeNull();
    click('#rg-grid [data-action="reset"]');
    expect(root.querySelectorAll('[data-product-card]')).toHaveLength(6);
    click('[data-action="offers"]');
    expect(root.querySelectorAll('[data-product-card]')).toHaveLength(3);
    click('[data-action="fresh"]');
    expect(root.querySelectorAll('[data-product-card]')).toHaveLength(3);
    expect($<HTMLInputElement>('#rg-offers').checked).toBe(false);
  });

  it('validates quantities, distinguishes sizes and respects stock across repeated additions', () => {
    click('[data-product="nori"]');
    for (const quantity of ['0', '-1', '1.5', '99', '']) {
      change('#rg-quantity', quantity, 'input'); submit('#rg-add-form');
      expect($('#rg-cart-count').textContent).toBe('0');
    }
    change('#rg-quantity', '2', 'input'); submit('#rg-add-form');
    change('#rg-variant', '1');
    expect(normalized('.rg-detail-price')).toContain('429,00 €');
    change('#rg-quantity', '3', 'input'); submit('#rg-add-form');
    expect($<HTMLButtonElement>('#rg-add-form button').disabled).toBe(true);
    click('#rg-product-detail [data-action="cart"]');
    expect(root.querySelectorAll('.rg-cart-lines .rg-list-item')).toHaveLength(2);
    expect(normalized('.rg-total')).toContain('1.945,00 €');
    expect($<HTMLButtonElement>('[data-line="nori"][data-variant="1"][data-delta="1"]').disabled).toBe(true);
    click('[data-line="nori"][data-variant="0"][data-delta="-1"]');
    expect(normalized('.rg-total')).toContain('1.616,00 €');
    click('[data-line="nori"][data-variant="0"][data-delta="remove"]');
    expect(root.querySelectorAll('.rg-cart-lines .rg-list-item')).toHaveLength(1);
    click('#rg-bag-dialog [data-close]'); click('[data-product="faro"]'); change('#rg-variant', '1');
    expect($('.rg-stock').textContent).toContain('ausverkauft');
    expect($<HTMLButtonElement>('#rg-add-form button').disabled).toBe(true);
    submit('#rg-add-form');
    expect($('#rg-cart-count').textContent).toBe('3');
  });

  it('caps a line at available stock and removes it at zero without mutating previous snapshots', () => {
    const original = setQuantity([], 'nori', 1, 2);
    expect(cartTotal(original)).toBe(85800);
    expect(setQuantity(original, 'nori', 1, 99)[0].quantity).toBe(3);
    expect(original[0].quantity).toBe(2);
    expect(setQuantity(original, 'nori', 1, 0)).toEqual([]);
    expect(setQuantity([], 'faro', 1, 1)).toEqual([]);
    expect(setQuantity(original, 'missing', 0, 2)).toBe(original);
    expect(setQuantity(original, 'nori', 1, NaN)).toBe(original);
  });

  it('completes and edits a validated local order without network or persistent storage', () => {
    const fetch = vi.fn(), xhr = vi.spyOn(XMLHttpRequest.prototype, 'send'), storage = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetch);
    click('[data-product="luma"]'); submit('#rg-add-form'); click('#rg-product-detail [data-action="cart"]');
    click('[data-action="checkout"]'); submit('#rg-checkout-form');
    expect($('#rg-checkout-form')).not.toBeNull();
    click('[data-action="example"]');
    change('[name="name"]', '   ', 'input'); submit('#rg-checkout-form');
    expect($('#rg-checkout-error').textContent).toContain('Leerzeichen');
    change('[name="name"]', '<img src=x> Alex', 'input'); click('[name="delivery"][value="room"]'); click('[name="payment"][value="card"]');
    expect(normalized('#rg-checkout-totals')).toContain('178,00 €');
    submit('#rg-checkout-form');
    expect($('.rg-review').textContent).toContain('<img src=x> Alex');
    expect($('.rg-review img')).toBeNull();
    expect($('.rg-review').textContent).toContain('Karte (simuliert)');
    click('[data-action="edit-checkout"]');
    expect($<HTMLInputElement>('[name="name"]').value).toBe('<img src=x> Alex');
    click('[name="delivery"][value="standard"]'); submit('#rg-checkout-form');
    click('[data-action="back-cart"]'); click('[data-line="luma"][data-delta="1"]'); click('[data-action="checkout"]'); submit('#rg-checkout-form');
    expect(normalized('.rg-total')).toContain('258,00 €');
    click('[data-action="finish"]');
    expect($('.rg-receipt').textContent).toContain('2 × LUMA');
    expect(normalized('.rg-receipt')).toContain('258,00 €');
    expect($('#rg-cart-count').textContent).toBe('0');
    expect(fetch).not.toHaveBeenCalled(); expect(xhr).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
  });

  it('keeps favorites and exports the actual selection as a local text download', () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:test');
    vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = vi.fn(); });
    const anchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    click('#rg-grid [data-save="lino"]'); click('#rg-grid [data-save="nori"]');
    click('[data-action="favorites"]');
    expect(root.querySelectorAll('.rg-saved-list .rg-list-item')).toHaveLength(2);
    click('[data-action="save-list"]');
    expect(create).toHaveBeenCalledOnce(); expect(anchor).toHaveBeenCalledOnce();
    click('#rg-saved-content [data-save="lino"]');
    expect($('#rg-saved-count').textContent).toBe('1');
    expect(root.activeElement).toBe($('#rg-saved-content [data-save="nori"]'));
    click('#rg-saved-content [data-save="nori"]');
    expect($('#rg-saved-content').textContent).toContain('Platz für Ihre Favoriten');
    expect(root.activeElement).toBe($('#rg-saved-title'));
  });

  it('retains a checkout draft when closing and reopening the cart', () => {
    click('[data-product="terra"]'); submit('#rg-add-form'); click('#rg-product-detail [data-action="cart"]');
    click('[data-action="checkout"]'); click('[data-action="example"]'); change('[name="city"]', 'Demostadt', 'input');
    click('#rg-bag-dialog [data-close]'); click('[data-action="cart"]'); click('[data-action="checkout"]');
    expect($<HTMLInputElement>('[name="city"]').value).toBe('Demostadt');
  });

  it('refreshes the parent cart after adding from product details and restores focus to the live row', () => {
    click('[data-product="nori"]'); change('#rg-variant', '1'); submit('#rg-add-form'); click('#rg-product-detail [data-action="cart"]');
    click('#rg-bag-content [data-product="nori"]');
    expect($<HTMLSelectElement>('#rg-variant').value).toBe('1');
    submit('#rg-add-form'); click('#rg-product-dialog [data-close]');
    expect(normalized('.rg-total')).toContain('858,00 €');
    expect(root.activeElement).toBe($('#rg-bag-content [data-product="nori"]'));
  });
});
