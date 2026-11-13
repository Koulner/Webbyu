// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DemoId } from '../data';
import { mountDemoDialog } from '../demos';
import { stations, stationIndex, terrainHeight } from './data';
import { mountJourney, type LandscapeController } from './controller';
import { renderJourney } from './page';

let app: ReturnType<typeof mountJourney> | undefined;
let root: HTMLElement;
let scene: LandscapeController;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const deferred = <T>() => {
  let resolve!: (value:T)=>void;
  const promise=new Promise<T>(done=>{resolve=done;});
  return {promise,resolve};
};

beforeEach(()=>{
  document.body.innerHTML='<div id="test-journey"></div>';
  root=document.querySelector('#test-journey')!;
  history.replaceState(null,'','/reise/');
  frames=new Map();nextFrame=0;
  scene={setProgress:vi.fn(),setEnabled:vi.fn(),dispose:vi.fn()};
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
  vi.stubGlobal('ResizeObserver',class {observe(){} disconnect(){}});
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
  Object.defineProperty(window,'scrollY',{configurable:true,value:0,writable:true});
  Object.defineProperty(window,'innerHeight',{configurable:true,value:900,writable:true});
  Object.defineProperty(document.documentElement,'scrollHeight',{configurable:true,value:6400});
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){
    const index=this.hasAttribute('data-chapter')?Number(this.getAttribute('data-chapter'))+1:0;
    const top=300+index*700-window.scrollY;
    return {top,bottom:top+700,left:0,right:700,width:700,height:700,x:0,y:top,toJSON(){}};
  });
  Element.prototype.scrollIntoView=vi.fn(function(this:Element){
    window.scrollY=this.getBoundingClientRect().top+window.scrollY-140;
    window.dispatchEvent(new Event('scroll'));
  });
  Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.open=true;}});
  Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.open=false;this.dispatchEvent(new Event('close'));}});
});
afterEach(()=>{app?.dispose();app=undefined;document.body.replaceChildren();document.body.style.overflow='';vi.restoreAllMocks();vi.unstubAllGlobals();});
function flush(){const batch=[...frames.values()];frames.clear();batch.forEach(callback=>callback(16));}
function mockDemos() {
  return {
    prepareDemo:vi.fn(async()=>{}),
    createDemo:vi.fn((id:DemoId)=>{
      const demo=document.createElement('div');
      demo.className='demo';
      demo.dataset.demoId=id;
      demo.innerHTML='<input aria-label="Auswahl" />';
      return demo;
    }),
    disposeDemo:vi.fn((demo:HTMLElement)=>demo.remove()),
    mountDemoDialog,
  };
}
it('shows no counters, chapter numbers or all-caps labels, and the footer carries no second home link',()=>{
  renderJourney(root);mount();
  for(const gone of ['[data-scene-index]','[data-step-count]','.journey-chapter-number','.journey-facts']) expect(root.querySelector(gone)).toBeNull();
  expect(root.textContent).not.toMatch(/\d\d ?\/ ?\d\d|VERBUNDENE|VORSCHAU ÖFFNEN|DER WEG VON|MEINE ARBEITSWEISE/);
  expect(root.querySelector('.journey-footer a[href="/"]')).toBeNull();
  expect([...root.querySelectorAll('.journey-footer a')].map(a=>a.textContent)).toEqual(['Impressum','Datenschutz']);
});
function mount(extra:Parameters<typeof mountJourney>[1]={}) {
  const demos=mockDemos();
  app=mountJourney(root,{loadScene:async()=>({initLandscape:()=>scene}),loadDemos:async()=>demos,...extra});
  return app;
}
function selectStation(id:string) {
  root.querySelector<HTMLAnchorElement>(`.journey-chapters a[href="#${id}"]`)!.click();
  flush();
}

describe('journey content and navigation',()=>{
  it('waits for the scene viewport to become visible before loading 3D', async () => {
    let intersect!: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { intersect = callback; }
      observe() {}
      disconnect = disconnect;
    });
    const loadScene = vi.fn(async () => ({ initLandscape: () => scene }));
    mount({ loadScene });
    flush();
    expect(loadScene).not.toHaveBeenCalled();
    intersect([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(loadScene).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await app!.sceneReady;
    expect(loadScene).toHaveBeenCalledOnce();
    app!.dispose();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('keeps the static illustration and functional chapters without loading 3D for reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const loadScene = vi.fn(async () => ({ initLandscape: () => scene }));
    mount({ loadScene });
    await app!.sceneReady; flush();
    selectStation('die-idee');
    expect(loadScene).not.toHaveBeenCalled();
    expect(root.querySelector('[data-map]')?.getAttribute('data-render')).toBe('static');
    expect(app!.getActive()).toBe(0);
  });

  it('honors data saving without automatic scene or demo downloads and allows explicit demo loading', async () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    const demos = mockDemos();
    const loadDemos = vi.fn(async () => demos);
    const loadScene = vi.fn(async () => ({ initLandscape: () => scene }));
    mount({ loadDemos, loadScene });
    await app!.sceneReady; flush();
    selectStation('raumgut');
    expect(loadScene).not.toHaveBeenCalled();
    expect(loadDemos).not.toHaveBeenCalled();
    expect(root.querySelector('[data-preview-loading]')?.textContent).toContain('Datensparmodus');
    root.querySelector<HTMLButtonElement>('[data-preview-open]')!.click();
    await vi.waitFor(() => expect(document.querySelector('dialog')?.open).toBe(true));
    expect(demos.prepareDemo).toHaveBeenCalledExactlyOnceWith('raumgut');
    expect(loadScene).not.toHaveBeenCalled();
  });

  it('keeps the chosen station across a responsive width change', async () => {
    mount(); await app!.sceneReady; flush();
    selectStation('safran-atelier');
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth - 100 });
    window.dispatchEvent(new Event('resize'));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce();
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.instances[0]).toBe(root.querySelector('#safran-atelier'));
    expect(app!.getActive()).toBe(stationIndex('#safran-atelier'));
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });
  it('has unique linked stations, notes and the selected examples, without dated claims',()=>{
    renderJourney(root);
    expect(new Set(stations.map(s=>s.id)).size).toBe(9);
    expect(stations.flatMap(s=>s.pages?.map(([,path])=>path)??[])).toEqual(['demos/safran-atelier/','demos/koulner/stufe-1/','demos/koulner/stufe-2/','demos/koulner/stufe-3/']);
    expect(stations.filter(s=>s.note)).toHaveLength(2);
    expect(stations.flatMap(s=>s.demoId?[s.demoId]:[])).toEqual(['raumgut']);
    expect(stations.flatMap(s=>s.packageId?[s.packageId]:[])).toEqual(['start','business','complete']);
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>expect(root.querySelector(link.hash)).not.toBeNull());
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.textContent).toContain('keine Kundenreferenzen');
    // Safran Atelier links to its demo page; only Raumgut still opens the dialog demo.
    expect(root.querySelectorAll('[data-journey-demo]')).toHaveLength(1);
    expect(stationIndex('#raumgut')).toBe(6);
    expect(stationIndex('#unknown')).toBe(-1);
    expect(terrainHeight(2,3)).toBe(terrainHeight(2,3));
    for(const station of stations) expect(Number.isFinite(terrainHeight(...station.position))).toBe(true);
  });

  it('synchronizes explicit selection, native scrolling, history and the camera',async()=>{
    mount();await app!.sceneReady;flush();
    root.querySelector<HTMLAnchorElement>('.journey-chapters a[href="#raumgut"]')!.click();flush();
    expect(app!.getActive()).toBe(6);
    expect(location.hash).toBe('#raumgut');
    expect(root.querySelector('[data-pin="6"]')?.getAttribute('aria-current')).toBe('step');
    expect(root.querySelector('[data-map-title]')?.textContent).toBe('Raumgut');
    expect(document.activeElement?.id).toBe('raumgut-title');
    expect(scene.setProgress).toHaveBeenLastCalledWith(expect.any(Number),false);
    window.scrollY=1100;window.dispatchEvent(new Event('scroll'));flush();
    expect(app!.getActive()).toBe(0);
    expect(location.hash).toBe('#die-idee');
    history.replaceState(null,'','#eiche-und-form');window.dispatchEvent(new PopStateEvent('popstate'));flush();
    expect(app!.getActive()).toBe(3);
    expect(location.hash).toBe('#eiche-und-form');
  });

  it('restores a deep link and keeps content functional after a renderer import failure',async()=>{
    history.replaceState(null,'','#safran-atelier');
    mount({loadScene:async()=>{throw Error('unavailable');}});
    await app!.sceneReady;flush();flush();
    expect(app!.getActive()).toBe(5);
    expect(root.querySelector('[data-map]')?.getAttribute('data-render')).toBe('static');
    root.querySelector<HTMLAnchorElement>('a.journey-overview')!.click();flush();
    expect(app!.getActive()).toBe(-1);
    // Safran Atelier links to its demo page; only Raumgut still opens the dialog demo.
    expect(root.querySelectorAll('[data-journey-demo]')).toHaveLength(1);
  });

  it('traverses every station with the corner controls and exposes the correct endpoints and labels',async()=>{
    mount();await app!.sceneReady;flush();
    const back=root.querySelector<HTMLAnchorElement>('[data-travel-back]')!;
    const next=root.querySelector<HTMLAnchorElement>('[data-travel-next]')!;
    const home=import.meta.env.BASE_URL;
    expect(back.getAttribute('href')).toBe(home);
    expect(back.getAttribute('aria-label')).toBe('Zur Startseite');
    expect(next.getAttribute('aria-label')).toBe('Reise beginnen: Die Idee');
    expect(next.textContent).toContain('Reise beginnen');

    for(let index=0;index<stations.length;index++) {
      next.click();flush();
      const station=stations[index];
      const last=index===stations.length-1;
      expect(app!.getActive()).toBe(index);
      expect(location.hash).toBe(`#${station.id}`);
      expect(root.querySelector('.journey-chapters [aria-current="step"]')?.getAttribute('href')).toBe(`#${station.id}`);
      expect(document.activeElement?.id).toBe(`${station.id}-title`);
      expect(back.getAttribute('href')).toBe(index===0?'#landschaft':`#${stations[index-1].id}`);
      expect(back.getAttribute('aria-label')).toBe(index===0?'Zurück zur Übersicht':`Zurück: ${stations[index-1].label}`);
      expect(next.getAttribute('href')).toBe(last?`${home}#projektfinder`:`#${stations[index+1].id}`);
      expect(next.getAttribute('aria-label')).toBe(last?'Projekt besprechen':`Weiter: ${stations[index+1].label}`);
      expect(next.textContent).toContain(last?'Projekt besprechen':'Weiter');
    }

    for(let index=stations.length-2;index>=-1;index--) {
      back.click();flush();
      expect(app!.getActive()).toBe(index);
      expect(location.hash).toBe(index<0?'#landschaft':`#${stations[index].id}`);
      expect(root.querySelector('.journey-chapters [aria-current="step"]')?.getAttribute('href')).toBe(location.hash);
      expect(next.getAttribute('href')).toBe(`#${stations[index+1].id}`);
      expect(back.getAttribute('href')).toBe(index<0?home:index===0?'#landschaft':`#${stations[index-1].id}`);
      expect(back.getAttribute('aria-label')).toBe(index<0?'Zur Startseite':index===0?'Zurück zur Übersicht':`Zurück: ${stations[index-1].label}`);
    }
    expect(next.textContent).toContain('Reise beginnen');
  });

  it('discards a late scene load after disposal',async()=>{
    const loading=deferred<{initLandscape:()=>LandscapeController}>();
    const initLandscape=vi.fn(()=>scene);
    mount({loadScene:()=>loading.promise});app!.dispose();
    loading.resolve({initLandscape});await app!.sceneReady;
    expect(initLandscape).not.toHaveBeenCalled();
  });
});

describe('journey demo lifecycle',()=>{
  it.each(stations.filter(station=>station.packageId))('links $label to its complete package website', async(station)=>{
    mount(); await app!.sceneReady; flush();
    selectStation(station.id);
    const expected=`${import.meta.env.BASE_URL}demos/${station.packageId}/`;
    expect(root.querySelector<HTMLAnchorElement>(`#${station.id} .journey-action`)?.getAttribute('href')).toBe(expected);
    expect(root.querySelector<HTMLAnchorElement>('[data-preview-link]')?.getAttribute('href')).toBe(expected);
    expect(root.querySelector<HTMLElement>('[data-preview-link]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLImageElement>('.journey-package-image')?.getAttribute('src')).toContain(station.image);
  });

  it.each(stations.filter(station=>station.demoId))('automatically shows the $label website as an inert preview',async(station)=>{
    const demos=mockDemos();
    mount({loadDemos:async()=>demos});await app!.sceneReady;flush();
    selectStation(station.id);
    const preview=root.querySelector<HTMLElement>('[data-scene-preview]')!;
    const slot=root.querySelector<HTMLElement>('[data-preview-slot]')!;
    await vi.waitFor(()=>expect(slot.querySelector<HTMLElement>('.demo')?.dataset.demoId).toBe(station.demoId));
    expect(preview.hidden).toBe(false);
    expect(preview.hasAttribute('aria-busy')).toBe(false);
    expect(slot.hasAttribute('inert')).toBe(true);
    expect(slot.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[data-preview-open]')?.getAttribute('aria-label')).toContain(station.label);
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith(station.demoId);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('keeps the same preview session and input through fullscreen, chapter changes and revisits',async()=>{
    const demos=mockDemos();
    mount({loadDemos:async()=>demos});await app!.sceneReady;flush();
    selectStation('raumgut');
    const slot=root.querySelector<HTMLElement>('[data-preview-slot]')!;
    const previewOpen=root.querySelector<HTMLButtonElement>('[data-preview-open]')!;
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).not.toBeNull());
    const demo=slot.querySelector<HTMLElement>('.demo')!;
    const input=demo.querySelector('input')!;
    const scrollPosition=window.scrollY;
    previewOpen.click();
    await vi.waitFor(()=>expect(document.querySelector('dialog')?.open).toBe(true));
    const dialog=document.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.querySelector('.demo')).toBe(demo);
    expect(demo.closest('[inert]')).toBeNull();
    input.value='Eiche, 180 cm';input.dispatchEvent(new Event('input',{bubbles:true}));
    expect(scene.setEnabled).toHaveBeenLastCalledWith(false);
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).toBe(demo));
    expect(document.activeElement).toBe(previewOpen);
    expect(window.scrollY).toBe(scrollPosition);
    expect(scene.setEnabled).toHaveBeenLastCalledWith(true);
    expect(demo.querySelector('input')).toBe(input);
    expect(input.value).toBe('Eiche, 180 cm');

    selectStation('raumgut');
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).toBe(demo));
    expect(input.value).toBe('Eiche, 180 cm');
    previewOpen.click();await vi.waitFor(()=>expect(dialog.open).toBe(true));
    expect(dialog.querySelector('input')).toBe(input);
    expect(input.value).toBe('Eiche, 180 cm');
    dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).toBe(demo));
    expect(document.activeElement).toBe(previewOpen);
    expect(demos.createDemo.mock.calls.map(([id])=>id)).toEqual(['raumgut']);
    app!.dispose();
    expect(demos.disposeDemo).toHaveBeenCalledTimes(1);
    expect(demos.disposeDemo).toHaveBeenCalledWith(demo);
  });

  it('shows only the current station when its shared preview import resolves late',async()=>{
    const demos=mockDemos();
    const loading=deferred<typeof demos>();
    const loadDemos=vi.fn(()=>loading.promise);
    mount({loadDemos});await app!.sceneReady;flush();
    selectStation('koulner');
    selectStation('raumgut');
    loading.resolve(demos);
    const slot=root.querySelector('[data-preview-slot]')!;
    await vi.waitFor(()=>expect(slot.querySelector<HTMLElement>('.demo')?.dataset.demoId).toBe('raumgut'));
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith('raumgut');
    expect(loadDemos).toHaveBeenCalledOnce();
    expect(root.querySelector('[data-preview-name]')?.textContent).toBe('Raumgut');
  });

  it.each(['leave','dispose'] as const)('does not attach a late preview after %s',async(action)=>{
    const demos=mockDemos();
    const loading=deferred<typeof demos>();
    mount({loadDemos:()=>loading.promise});await app!.sceneReady;flush();
    selectStation('raumgut');
    if(action==='leave') selectStation('landschaft');
    else app!.dispose();
    loading.resolve(demos);
    await loading.promise;
    // Settle the module loader and preview continuations without advancing animation frames.
    await Promise.resolve();await Promise.resolve();
    expect(demos.createDemo).not.toHaveBeenCalled();
    expect(root.querySelector('[data-preview-slot] .demo')).toBeNull();
    expect(document.querySelector('dialog')).toBeNull();
    if(action==='leave') expect(root.querySelector<HTMLElement>('[data-scene-preview]')!.hidden).toBe(true);
  });

  it('allows the visible preview to retry a failed automatic load and restores it after fullscreen',async()=>{
    const demos=mockDemos();
    const loadDemos=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(demos);
    mount({loadDemos});await app!.sceneReady;flush();
    selectStation('raumgut');
    await vi.waitFor(()=>expect(root.querySelector('[data-preview-loading]')?.textContent).toContain('erneuten Laden'));
    const trigger=root.querySelector<HTMLButtonElement>('[data-preview-open]')!;
    expect(trigger.disabled).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-scene-preview]')!.hidden).toBe(false);
    trigger.click();
    await vi.waitFor(()=>expect(document.querySelector('dialog')?.open).toBe(true));
    const dialog=document.querySelector<HTMLDialogElement>('dialog')!;
    const demo=dialog.querySelector('.demo');
    expect(loadDemos).toHaveBeenCalledTimes(2);
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith('raumgut');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    await vi.waitFor(()=>expect(root.querySelector('[data-preview-slot] .demo')).toBe(demo));
    expect(root.querySelector<HTMLElement>('[data-preview-loading]')!.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('reuses each live session and restores chapter focus and map rendering on close',async()=>{
    const createDemo=vi.fn(()=>{const demo=document.createElement('div');demo.className='demo';demo.innerHTML='<input aria-label="Auswahl" />';return demo;});
    const disposeDemo=vi.fn();
    mount({loadDemos:async()=>({prepareDemo:async()=>{},createDemo,disposeDemo,mountDemoDialog})});await app!.sceneReady;flush();
    const trigger=root.querySelector<HTMLButtonElement>('[data-journey-demo="raumgut"]')!;
    trigger.click();await vi.waitFor(()=>expect(document.querySelector('dialog')?.open).toBe(true));
    const dialog=document.querySelector<HTMLDialogElement>('dialog')!;
    const input=dialog.querySelector('input')!;input.value='Meine Auswahl';
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    expect(document.activeElement).toBe(trigger);
    expect(scene.setEnabled).toHaveBeenLastCalledWith(true);
    trigger.click();await vi.waitFor(()=>expect(dialog.open).toBe(true));
    expect(dialog.querySelector('input')).toBe(input);
    expect(input.value).toBe('Meine Auswahl');expect(createDemo).toHaveBeenCalledTimes(1);
    expect(scene.setEnabled).toHaveBeenLastCalledWith(false);
    dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
    expect(dialog.open).toBe(false);expect(document.activeElement).toBe(trigger);
    app!.dispose();expect(disposeDemo).toHaveBeenCalledOnce();expect(scene.dispose).toHaveBeenCalledOnce();
  });

  it('offers a retry after a failed demo import and ignores a load after disposal',async()=>{
    const loading=deferred<never>();
    const loadDemos=vi.fn().mockRejectedValueOnce(Error('offline')).mockImplementationOnce(()=>loading.promise);
    mount({loadDemos});await app!.sceneReady;
    const trigger=root.querySelector<HTMLButtonElement>('[data-journey-demo]')!;
    trigger.click();await vi.waitFor(()=>expect(root.querySelector('.journey-status')?.textContent).toContain('erneut'));
    expect(trigger.disabled).toBe(false);
    trigger.click();app!.dispose();loading.resolve(undefined as never);
    await Promise.resolve();await Promise.resolve();
    expect(document.querySelector('dialog')).toBeNull();
    expect(loadDemos).toHaveBeenCalledTimes(2);
  });
});
