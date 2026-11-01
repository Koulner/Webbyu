// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountMediaFallback } from './media-fallback';

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe('concept media failures', () => {
  it('reports dynamic image failures, preserves descriptions and recovers on load', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div class="demo-main"><button>Weiter ausprobieren</button></div>';
    document.body.append(root);
    const status = mountMediaFallback(root, new AbortController().signal);
    const image = document.createElement('img');
    image.alt = 'Rote Safranfäden';
    root.querySelector('.demo-main')!.append(image);
    image.dispatchEvent(new Event('error'));
    expect(status.hidden).toBe(false);
    expect(status.textContent).toContain('Bildbeschreibungen');
    expect(image.alt).toBe('Rote Safranfäden');
    expect(root.querySelector('button')?.disabled).toBe(false);
    image.dispatchEvent(new Event('load'));
    expect(status.hidden).toBe(true);
    expect(status.textContent).toBe('');
  });

  it('replaces an unavailable background comparison with an explanation', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div class="reference-page"><div class="compare-heading"><p>Bildvergleich</p></div><div class="image-compare"></div><div class="compare-controls"><input type="range"></div></div>';
    const probe = document.createElement('img');
    vi.stubGlobal('Image', vi.fn(function () { return probe; }));
    const status = mountMediaFallback(shadow, new AbortController().signal);
    probe.dispatchEvent(new Event('error'));
    expect(status.hidden).toBe(false);
    expect(shadow.querySelector<HTMLElement>('.image-compare')!.hidden).toBe(true);
    expect(shadow.querySelector<HTMLElement>('.compare-controls')!.hidden).toBe(true);
    expect(shadow.querySelector('.compare-heading')!.textContent).toContain('im Text beschrieben');
  });

  it('releases listeners when the demo session is disposed', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div class="demo-main"><img alt="Materialstudie"></div>';
    const controller = new AbortController();
    const status = mountMediaFallback(root, controller.signal);
    controller.abort();
    root.querySelector('img')!.dispatchEvent(new Event('error'));
    expect(status.hidden).toBe(true);
  });
});
