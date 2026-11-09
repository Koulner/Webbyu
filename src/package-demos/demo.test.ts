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
  it('counts windows, draws them and lists them in the local Klarblick review', () => {
    vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener:vi.fn()}));
    const root=document.createElement('div'); root.innerHTML=renderPackageDemo('/demos/start/', '/'); document.body.append(root);
    const dispose=mountPackageDemo(root);
    const form=root.querySelector('form')!;
    const plus=(art: string) => form.querySelector<HTMLButtonElement>(`[data-art=${art}] [data-mehr]`)!.click();
    expect(root.querySelector('[data-summe]')!.textContent).toBe('Noch steht kein Fenster.');
    plus('rund'); plus('sprossen'); plus('sprossen');
    expect(root.querySelector('[data-summe]')!.textContent).toBe('Macht 3 Fenster.');
    expect(root.querySelector('[data-mein-haus] svg')!.getAttribute('aria-label')).toBe('Ihr Haus mit 3 Fenstern.');
    expect(root.querySelector('[data-wagen]')!.textContent).toContain('Eckenpinsel');
    const set=(name: string, value: string) => { (form.elements.namedItem(name) as HTMLInputElement).value=value; };
    set('name','Beispiel'); set('email','demo@example.test'); set('message','Reinfeld, Einfahrt schmal');
    form.dispatchEvent(new Event('submit',{cancelable:true}));
    expect(root.querySelector('[data-form-review] dl')!.textContent).toContain('Ihre Fenster1 × Rund im Giebel, 2 × Sprossen');
    root.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
    root.querySelector<HTMLButtonElement>('[data-reset]')!.click();
    expect((form.elements.namedItem('fensterliste') as HTMLInputElement).value).toBe('');
    dispose();
  });
  it('derives the Hof menu from one fire and keeps the seat request local', () => {
    vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener:vi.fn()}));
    const karte=document.createElement('div'); karte.innerHTML=renderPackageDemo('/demos/complete/speisekarte/', '/'); document.body.append(karte);
    const disposeKarte=mountPackageDemo(karte);
    const haken=karte.querySelector<HTMLInputElement>('[data-ohne-fleisch]')!;
    expect(karte.querySelector('[data-schalter]')!.hasAttribute('hidden')).toBe(false);
    haken.checked=true; haken.dispatchEvent(new Event('change'));
    expect(karte.querySelector('[data-karte]')!.hasAttribute('data-ohne')).toBe(true);
    expect(karte.querySelectorAll('.hf-gangband > ul > li')).toHaveLength(7);
    disposeKarte(); karte.remove();
    const root=document.createElement('div'); root.innerHTML=renderPackageDemo('/demos/complete/kontakt/', '/'); document.body.append(root);
    const dispose=mountPackageDemo(root);
    const form=root.querySelector('form')!;
    const sonntag=root.querySelector<HTMLButtonElement>('[data-abend-wahl^="Sonntag"]')!; sonntag.click();
    expect((form.elements.namedItem('abend') as HTMLSelectElement).value).toBe('Sonntag, 12:30 Uhr');
    expect(sonntag.getAttribute('aria-pressed')).toBe('true');
    const set=(name: string, value: string) => { (form.elements.namedItem(name) as HTMLInputElement).value=value; };
    set('name','Beispiel'); set('email','demo@example.test'); set('message','Eine Person isst kein Fleisch.');
    form.dispatchEvent(new Event('submit',{cancelable:true}));
    const review=root.querySelector('[data-form-review] dl')!.textContent!;
    expect(review).toContain('Personenzwei Personen'); expect(review).toContain('AbendSonntag, 12:30 Uhr'); expect(review).not.toContain('mm');
    root.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
    dispose();
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
