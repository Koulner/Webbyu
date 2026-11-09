// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderContentPage } from './content';
import { packageDemoPages } from '../../package-demo-pages.mjs';

const contentPaths = [
  '/websites-fuer-unternehmen/',
  '/anfrageformulare-auswahlhilfen/',
  '/ueber-mich/',
  '/ratgeber/',
  '/ratgeber/website-kosten/',
  '/ratgeber/website-planen-checkliste/',
];
const sitePaths = new Set([...contentPaths, ...packageDemoPages.map(page => page.path), '/', '/reise/', '/impressum/', '/datenschutz/']);

function render(path: string, base = '/') {
  const root = document.createElement('div');
  root.innerHTML = renderContentPage(path, base);
  return root;
}

describe('static content page contracts', () => {
  it.each(contentPaths)('provides readable landmarks and valid in-page navigation for %s without client rendering', path => {
    const root = render(path);
    expect(root.querySelectorAll('main')).toHaveLength(1);
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    expect(root.querySelector('main')!.textContent!.trim().length).toBeGreaterThan(800);
    expect(root.querySelector('script, iframe, form')).toBeNull();

    const ids = [...root.querySelectorAll('[id]')].map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
      expect(root.querySelector(anchor.hash), `${path}: ${anchor.hash}`).not.toBeNull();
    });
    root.querySelectorAll('[aria-labelledby]').forEach(element => {
      element.getAttribute('aria-labelledby')!.split(/\s+/).forEach(id => {
        expect(root.querySelector(`[id="${id}"]`)?.textContent?.trim(), `${path}: ${id}`).toBeTruthy();
      });
    });
    expect(root.querySelector('[data-privacy-open]')?.hasAttribute('hidden')).toBe(true);
  });

  it.each(['/', '/Webbyu/'])('keeps the full link graph inside the deployed base %s', base => {
    for (const path of contentPaths) {
      const root = render(path, base);
      root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href')!;
        if (/^(?:#|mailto:|tel:)/.test(href)) return;
        expect(href.startsWith(base), `${path}: ${href}`).toBe(true);
        const target = `/${href.slice(base.length).split('#')[0]}`;
        expect(sitePaths.has(target), `${path}: unknown target ${target}`).toBe(true);
      });
      expect(root.querySelector(`a[href="${base}#projektfinder"]`)).not.toBeNull();
      expect(root.querySelector('a[href="mailto:lukas.wagner@webbyu.de"]')).not.toBeNull();
      expect(root.querySelector('a[href="tel:+4917642090983"]')).not.toBeNull();
    }
  });

  it('identifies the author and meaningful article navigation on both guides', () => {
    for (const path of contentPaths.filter(path => path.startsWith('/ratgeber/') && path !== '/ratgeber/')) {
      const root = render(path);
      const author = root.querySelector<HTMLAnchorElement>('a[rel="author"]');
      expect(author?.textContent).toBe('Lukas Wagner');
      expect(author?.getAttribute('href')).toBe('/ueber-mich/');
      expect(root.querySelectorAll('.content-toc a').length).toBeGreaterThanOrEqual(5);
      expect(root.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-31');
      expect(root.querySelector('.content-breadcrumbs a[href="/ratgeber/"]')).not.toBeNull();
    }
  });

  it('keeps unknown pages from silently becoming an indexable duplicate', () => {
    expect(() => renderContentPage('/nicht-vorhanden/', '/')).toThrow('Unknown content page');
    expect(renderContentPage('ueber-mich', '/Webbyu')).toBe(renderContentPage('/ueber-mich/', '/Webbyu/'));
  });
});
