// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderPage } from './shell';
import { concepts, extensions, packages } from './data';

describe('page shell contract', () => {
  it('returns distinct feature mounts belonging to the supplied root', () => {
    const root = document.createElement('div');
    const mounts = renderPage(root);
    expect(Object.keys(mounts).sort()).toEqual(['finder', 'journeyPreview', 'story']);
    expect(new Set(Object.values(mounts)).size).toBe(3);
    for (const mount of Object.values(mounts)) expect(root.contains(mount)).toBe(true);
    expect(mounts.journeyPreview.querySelector('iframe')?.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}reise/?embed=1`);
    expect(mounts.journeyPreview.querySelector('iframe')?.getAttribute('title')).toContain('Die Reise');
    expect(mounts.journeyPreview.querySelector('[data-journey-fullscreen]')).not.toBeNull();
    expect(mounts.finder.children).toHaveLength(0);
    const gallery = root.querySelector('#arbeiten')!;
    for (const mount of [mounts.journeyPreview]) {
      expect(gallery.contains(mount)).toBe(true);
      expect(mounts.story.contains(mount)).toBe(false);
    }
  });

  it('preserves native navigation targets and the main message', () => {
    const root = document.createElement('div');
    renderPage(root);
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
      if (link.hash) expect(root.querySelector(link.hash)).not.toBeNull();
    });
    expect(root.querySelector('h1 em')?.textContent).toBe('Ihr Alltag einfacher.');
    // The gallery is now the single collection, not duplicated as decorative demos.
    expect(root.querySelector('[data-preview]')).toBeNull();
    expect(root.querySelector('#main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('keeps all main-owned entry points and the mobile navigation contract', () => {
    const root = document.createElement('div');
    renderPage(root);
    for (const concept of concepts) {
      expect(root.querySelectorAll(`button[data-demo="${concept.goal}"]`)).toHaveLength(1);
    }
    for (const pkg of packages) {
      expect(root.querySelectorAll(`button[data-package="${pkg.id}"]`)).toHaveLength(1);
    }
    for (const extension of extensions) {
      expect(root.querySelectorAll(`button[data-extension="${extension.id}"]`)).toHaveLength(1);
    }
    const menu = root.querySelector('.mobile-menu-button')!;
    const nav = root.querySelector<HTMLElement>(`#${menu.getAttribute('aria-controls')}`)!;
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(nav.hidden).toBe(true);
    expect(root.querySelector('.site-header')).not.toBeNull();
    expect(root.querySelector('.toast[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('labels every page section and explains the local simulations at the gallery', () => {
    const root = document.createElement('div');
    renderPage(root);
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    root.querySelectorAll('main section').forEach(section => {
      const heading = root.querySelector(`#${section.getAttribute('aria-labelledby')}`);
      expect(heading?.textContent?.trim()).toBeTruthy();
    });
    const gallery = root.querySelector('#arbeiten')!;
    const description = root.querySelector(`#${gallery.getAttribute('aria-describedby')}`)!;
    expect(description.textContent).toContain('fiktive Marken');
    expect(description.textContent).toContain('Simulationen');
  });

  it('links the separate journey from both navigation surfaces without a duplicate about teaser', () => {
    const root = document.createElement('div');
    renderPage(root);
    const destination = `${import.meta.env.BASE_URL}reise/`;
    expect(root.querySelector('.site-header nav')?.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    expect(root.querySelector('.mobile-nav')?.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    expect(root.querySelector('.about-section .journey-teaser')).toBeNull();
  });
});
