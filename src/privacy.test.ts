// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPrivacy } from './privacy';

let notice: ReturnType<typeof mountPrivacy> | undefined;
const key = 'webbyu-privacy';
// Recent Node versions expose an unconfigured localStorage getter over Vitest's window.
// Use jsdom's same-origin Storage implementation for this browser fixture.
const localStorage = window.sessionStorage;
const panel = () => document.querySelector<HTMLElement>('.privacy-notice')!;
const reject = () => document.querySelector<HTMLButtonElement>('.privacy-reject')!;
const reopen = () => document.querySelector<HTMLButtonElement>('[data-privacy-open]')!;

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorage);
  localStorage.clear();
  document.body.innerHTML = '<main><a href="#content">Weiterlesen</a></main><footer><button data-privacy-open>Cookie-Einstellungen</button></footer>';
});
afterEach(() => {
  notice?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.body.replaceChildren();
});

describe('privacy choice', () => {
  it('does not store a choice or load a service before an explicit action', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const write = vi.spyOn(Storage.prototype, 'setItem');
    notice = mountPrivacy();
    expect(panel().hidden).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(xhr).not.toHaveBeenCalled();
    expect(panel().querySelector('script, iframe, img, input')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(panel().querySelector(`a[href="${import.meta.env.BASE_URL}impressum/"]`)).not.toBeNull();
    expect(panel().querySelector(`a[href="${import.meta.env.BASE_URL}datenschutz/"]`)).not.toBeNull();
  });

  it('rejects with one click, remembers only the choice, and stays dismissed after navigation', () => {
    notice = mountPrivacy();
    reject().click();
    expect(panel().hidden).toBe(true);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, optional: false, savedAt: expect.any(Number) });
    expect(localStorage.length).toBe(1);
    notice.dispose();
    notice = mountPrivacy();
    expect(panel().hidden).toBe(true);
  });

  it('reopens from the footer and restores keyboard focus after rejection', () => {
    notice = mountPrivacy();
    reject().click();
    reopen().focus();
    reopen().click();
    expect(panel().hidden).toBe(false);
    expect(document.activeElement).toBe(reject());
    reject().click();
    expect(document.activeElement).toBe(reopen());
  });

  it('keeps the reading position when rejecting the notice that opened by itself', () => {
    document.querySelector('main')!.tabIndex = -1;
    notice = mountPrivacy();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    reject().focus();
    focus.mockClear();
    reject().click();
    expect(document.activeElement).toBe(document.querySelector('main'));
    expect(document.activeElement).not.toBe(reopen());
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('does not scroll when focus returns to the footer button that reopened the notice', () => {
    notice = mountPrivacy();
    reopen().click();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    reject().click();
    expect(document.activeElement).toBe(reopen());
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('treats closing and Escape as rejection without granting permission', () => {
    notice = mountPrivacy();
    document.querySelector<HTMLButtonElement>('.privacy-close')!.click();
    expect(JSON.parse(localStorage.getItem(key)!).optional).toBe(false);
    reopen().click();
    reject().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel().hidden).toBe(true);
    expect(JSON.parse(localStorage.getItem(key)!).optional).toBe(false);
  });

  it.each([
    'invalid-json',
    JSON.stringify({version:1,optional:true,savedAt:Date.now()}),
    JSON.stringify({version:2,optional:false,savedAt:Date.now()}),
    JSON.stringify({version:1,optional:false,savedAt:Date.now()+86400000}),
    JSON.stringify({version:1,optional:false,savedAt:Date.now()-181*86400000}),
  ])('removes invalid or expired decisions and never infers consent: %s', stored => {
    localStorage.setItem(key, stored);
    notice = mountPrivacy();
    expect(panel().hidden).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('remains dismissible when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    notice = mountPrivacy();
    expect(() => reject().click()).not.toThrow();
    expect(panel().hidden).toBe(true);
    reopen().click();
    expect(panel().hidden).toBe(false);
  });

  it('sets no cookie before or after the reaction', () => {
    notice = mountPrivacy();
    expect(document.cookie).toBe('');
    reject().click();
    expect(document.cookie).toBe('');
  });

  it('keeps cookies, browser storage and third-party embeds out of the code that runs before the reaction', () => {
    const sources = import.meta.glob<string>(['./**/*.{ts,html}', '!./**/*.test.ts', '!./privacy.ts'], { query: '?raw', import: 'default', eager: true });
    const unguarded = /document\.cookie|cookieStore\.|(?:local|session)Storage\.setItem|<(?:iframe|script)\b[^>]*\bsrc=["']https?:/i;
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(Object.keys(sources).filter(path => unguarded.test(sources[path]!))).toEqual([]);
  });

  it('removes its elements and listeners on dispose', () => {
    notice = mountPrivacy();
    notice.dispose();
    expect(document.querySelector('.privacy-notice')).toBeNull();
    reopen().click();
    expect(document.querySelector('.privacy-notice')).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
