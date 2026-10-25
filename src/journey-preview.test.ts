// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderPage } from './shell';
import { mountJourneyPreview } from './journey-preview';

let preview: HTMLElement;
let controller: ReturnType<typeof mountJourneyPreview>;
let fullscreen: Element | null;
const button = () => preview.querySelector<HTMLButtonElement>('[data-journey-fullscreen]')!;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  preview = renderPage(document.querySelector('#app')!).journeyPreview;
  fullscreen = null;
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  preview.requestFullscreen = vi.fn(async () => { fullscreen = preview; document.dispatchEvent(new Event('fullscreenchange')); });
  document.exitFullscreen = vi.fn(async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')); });
  controller = mountJourneyPreview(preview);
});
afterEach(() => {
  controller?.dispose();
  for (const name of ['fullscreenElement', 'fullscreenEnabled', 'exitFullscreen']) Reflect.deleteProperty(document, name);
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('journey fullscreen preview', () => {
  it('expands the same iframe and restores focus after Escape or exit', async () => {
    const frame = preview.querySelector('iframe');
    button().click();
    await vi.waitFor(() => expect(preview.requestFullscreen).toHaveBeenCalledOnce());
    expect(button().textContent).toContain('Vollbild beenden');
    expect(button().getAttribute('aria-pressed')).toBe('true');
    await document.exitFullscreen();
    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(document.activeElement).toBe(button());
    expect(preview.querySelector('iframe')).toBe(frame);
  });

  it('provides a usable full page link when fullscreen is denied', async () => {
    vi.mocked(preview.requestFullscreen).mockRejectedValue(new Error('Denied'));
    button().click();
    await vi.waitFor(() => expect(preview.querySelector<HTMLElement>('[role="status"]')!.hidden).toBe(false));
    expect(document.activeElement).toBe(preview.querySelector('[data-journey-page]'));
  });

  it('accepts position updates only from its own same-origin frame', () => {
    const link = preview.querySelector<HTMLAnchorElement>('[data-journey-page]')!;
    const source = preview.querySelector('iframe')!.contentWindow!;
    const data = { type: 'webbyu:journey-position', hash: '#raumgut' };
    window.dispatchEvent(new MessageEvent('message', { source, origin: 'https://other.example', data }));
    window.dispatchEvent(new MessageEvent('message', { source: window, origin: location.origin, data }));
    expect(link.hash).toBe('');
    window.dispatchEvent(new MessageEvent('message', { source, origin: location.origin, data }));
    expect(link.hash).toBe('#raumgut');
  });
});
