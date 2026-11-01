// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderPage, renderPageHtml } from './shell';
import { renderJourney, renderJourneyHtml } from './journey/page';

describe('static page enhancement', () => {
  it('keeps existing homepage nodes when attaching browser features', () => {
    const root = document.createElement('div');
    root.innerHTML = renderPageHtml('/Webbyu/');
    root.dataset.prerendered = 'true';
    const heading = root.querySelector('h1');
    const contact = root.querySelector('a[href^="mailto:"]');
    renderPage(root);
    expect(root.querySelector('h1')).toBe(heading);
    expect(root.querySelector('a[href^="mailto:"]')).toBe(contact);
    expect(root.querySelector('a[href="/Webbyu/websites-fuer-unternehmen/"]')).not.toBeNull();
  });

  it('keeps all journey chapters in static HTML and preserves their nodes on mount', () => {
    const root = document.createElement('div');
    root.innerHTML = renderJourneyHtml('/Webbyu/');
    root.dataset.prerendered = 'true';
    const chapters = [...root.querySelectorAll('[data-chapter]')];
    expect(chapters).toHaveLength(8);
    expect(root.textContent).toContain('keine Kundenreferenzen');
    renderJourney(root);
    expect([...root.querySelectorAll('[data-chapter]')]).toEqual(chapters);
    expect(root.querySelector('a[href="/Webbyu/#projektfinder"]')).not.toBeNull();
  });
});
