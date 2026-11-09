// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderPackageDemo } from './page';
import { mountPackageDemo } from './main';
import { packageFromSearch } from './catalogue';
import { packageDemoPages } from '../../package-demo-pages.mjs';

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
describe('complete package websites', () => {
  it('renders every route with working internal destinations at both bases', () => {
    for (const base of ['/', '/Webbyu/']) for (const page of packageDemoPages) {
      const root = document.createElement('div'); root.innerHTML = renderPackageDemo(page.path, base);
      expect(root.querySelectorAll('h1')).toHaveLength(1);
      for (const a of root.querySelectorAll<HTMLAnchorElement>('a')) {
        const href = a.getAttribute('href')!;
        if (href.startsWith(base + 'demos/')) {
          const path = '/' + href.slice(base.length).split('#')[0];
          expect(packageDemoPages.some(p => p.path === path), href).toBe(true);
          if (href.includes('#')) { const target = document.createElement('div'); target.innerHTML=renderPackageDemo(path,base); expect(target.querySelector('#'+href.split('#')[1])).not.toBeNull(); }
        }
      }
    }
  });
  it('accepts only explicitly supported package preferences', () => {
    expect(packageFromSearch('?paket=business')).toBe('business');
    expect(packageFromSearch('?paket=complete')).toBe('complete');
    expect(packageFromSearch('?paket=start')).toBe('start');
    for (const query of ['', '?paket=custom', '?paket=__proto__', '?paket=%3Cscript%3E']) expect(packageFromSearch(query)).toBeNull();
  });
  it.each(['start', 'business', 'complete'])('allows correction and completion without network or persistence: %s', id => {
    vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener:vi.fn()}));
    const network=vi.fn(); vi.stubGlobal('fetch',network);
    const storage=vi.spyOn(Storage.prototype,'setItem');
    const root=document.createElement('div'); root.innerHTML=renderPackageDemo(`/demos/${id}/${id==='start'?'':'kontakt/'}`, '/'); document.body.append(root);
    const dispose=mountPackageDemo(root);
    const form=root.querySelector('form')!;
    const submit=()=>form.dispatchEvent(new Event('submit',{cancelable:true}));
    submit(); expect(form.hidden).toBe(false);
    (form.elements.namedItem('name') as HTMLInputElement).value='Beispiel';
    (form.elements.namedItem('email') as HTMLInputElement).value='demo@example.test';
    (form.elements.namedItem('message') as HTMLInputElement).value='<b>Ein vollständig fiktives Anliegen</b>';
    submit(); expect(form.hidden).toBe(true); expect(root.querySelector('[data-form-review] b')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-edit]')!.click(); expect(form.hidden).toBe(false);
    expect((form.elements.namedItem('name') as HTMLInputElement).value).toBe('Beispiel');
    submit(); root.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
    expect(root.querySelector<HTMLElement>('[data-form-success]')!.hidden).toBe(false);
    expect((form.elements.namedItem('name') as HTMLInputElement).value).toBe('');
    expect(network).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('[data-reset]')!.click(); expect(form.hidden).toBe(false);
    dispose(); storage.mockRestore();
  });
  it('draws the visitor niche from four measures and lists them in the local review', () => {
    vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener:vi.fn()}));
    const root=document.createElement('div'); root.innerHTML=renderPackageDemo('/demos/business/kontakt/', '/'); document.body.append(root);
    const dispose=mountPackageDemo(root);
    const form=root.querySelector('form')!;
    const set=(name: string, value: string) => { const input=form.elements.namedItem(name) as HTMLInputElement; input.value=value; input.dispatchEvent(new Event('input',{bubbles:true})); };
    const result=() => root.querySelector('[data-ergebnis]')!.textContent!;
    set('top','120'); expect(result()).toContain('Zentimetern');
    set('top','1000'); expect(result()).toContain('Noch 3 Maße');
    set('bottom','1040'); set('left','2300'); set('right','2285');
    expect(result()).toContain('Oben ist Ihre Nische 40 mm schmaler als unten.');
    expect(root.querySelector('[data-messbild] svg')!.getAttribute('aria-label')).toBe('Ihre Nische, Abweichungen überhöht gezeichnet.');
    set('name','Beispiel'); set('email','demo@example.test'); set('message','Garderobe für vier Personen');
    form.dispatchEvent(new Event('submit',{cancelable:true}));
    const review=root.querySelector('[data-form-review] dl')!.textContent!;
    expect(review).toContain('Breite oben1000 mm'); expect(review).toContain('Höhe rechts2285 mm');
    root.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
    dispose();
  });
});
