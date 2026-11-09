// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { AI_LABEL, aiBadge, isAiMedia } from './ai-media';
import { renderPageHtml } from './shell';
import { renderPackageDemo } from './package-demos/page';
import { saffronJourneyMarkup } from './saffron-journey';
import { packageDemoPages } from '../package-demo-pages.mjs';
import raumgutBody from './reference-demos/raumgut/body.html?raw';
import handwerkBody from './reference-demos/handwerk/body.html?raw';
import imprint from '../impressum/index.html?raw';

const brandMark = /webbyu-(?:wortmarke|w-icon|symbol)/;

/** An AI image counts as labelled when its own container shows the badge or a visible "KI-" caption. */
function unlabelledAiImages(html: string): string[] {
  const root = document.createElement('div');
  root.innerHTML = html;
  return [...root.querySelectorAll<HTMLImageElement>('img')]
    .filter(img => isAiMedia(img.getAttribute('src') ?? '') && !brandMark.test(img.getAttribute('src')!))
    .filter(img => {
      const container = img.closest('figure') ?? img.parentElement!;
      return !container.querySelector('.ai-badge') && !/KI-(?:generiert|Illustration|ILLUSTRATION)/.test(container.textContent ?? '');
    })
    .map(img => img.getAttribute('src')!);
}

describe('AI media disclosure', () => {
  it('recognises AI files and keeps licensed or self-rendered media unlabelled', () => {
    for (const src of ['/package-demos/klarblick-concept.webp', '/package-demos/hof-800.webp', '/reference-assets/raumgut/chair.jpg', '/reference-assets/materials-960.webp', '/src/assets/demos/saffron/flower.webp', '/webbyu-wortmarke.png', '/webbyu-wortmarke-405.webp', '/webbyu-w-icon.png']) expect(isAiMedia(src), src).toBe(true);
    for (const src of ['/package-demos/wood-kitchen.webp', '/package-demos/food-dish.webp', '/package-demos/eiche-fall14.webp', '/package-demos/eiche-holz.webp', '/social/webbyu.jpg']) expect(isAiMedia(src), src).toBe(false);
    expect(aiBadge()).toContain(AI_LABEL);
  });

  it('labels every AI image on the homepage', () => {
    expect(unlabelledAiImages(renderPageHtml('/'))).toEqual([]);
  });

  it('labels every AI image on all package demo pages', () => {
    for (const page of packageDemoPages) expect(unlabelledAiImages(renderPackageDemo(page.path, '/')), page.path).toEqual([]);
  });

  it('labels the saffron study and the reference studies', () => {
    expect(unlabelledAiImages(saffronJourneyMarkup('test'))).toEqual([]);
    for (const [demo, body] of [['raumgut', raumgutBody], ['handwerk', handwerkBody]]) expect(body, demo).toMatch(/KI-generiert/);
  });

  it('declares all AI media centrally in the Impressum', () => {
    expect(imprint).toContain('id="ki-kennzeichnung"');
    for (const name of ['Wortmarke', 'Klarblick', 'Hof &amp; Flamme', 'Raumgut', 'Handwerk', 'Safran']) expect(imprint).toContain(name);
  });
});
