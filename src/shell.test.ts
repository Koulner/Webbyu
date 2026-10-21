// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderPage } from './shell';

describe('page shell contract', () => {
  it('returns distinct feature mounts belonging to the supplied root', () => {
    const root = document.createElement('div');
    const mounts = renderPage(root);
    expect(Object.keys(mounts).sort()).toEqual(['catalogue', 'demoSlot', 'finder', 'scene', 'story']);
    expect(new Set(Object.values(mounts)).size).toBe(5);
    for (const mount of Object.values(mounts)) expect(root.contains(mount)).toBe(true);
    expect(mounts.scene.contains(mounts.demoSlot)).toBe(true);
    expect(mounts.scene.contains(mounts.catalogue)).toBe(false);
    expect(mounts.demoSlot.children).toHaveLength(0);
    expect(mounts.catalogue.children).toHaveLength(0);
    expect(mounts.finder.children).toHaveLength(0);
  });

  it('preserves native navigation targets and genuine italic accents', () => {
    const root = document.createElement('div');
    renderPage(root);
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
      if (link.hash) expect(root.querySelector(link.hash)).not.toBeNull();
    });
    expect(root.querySelector('h1 em')?.textContent).toBe('eigenen Auftritt.');
    expect(root.querySelectorAll('.preview-canvas[inert][aria-hidden="true"]')).toHaveLength(3);
  });
});
