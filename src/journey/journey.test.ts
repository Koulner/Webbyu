// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { concepts, type DemoId } from '../data';
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
  it('has unique linked stations, three notes and all existing concepts, without dated claims',()=>{
    renderJourney(root);
    expect(new Set(stations.map(s=>s.id)).size).toBe(7);
    expect(stations.filter(s=>s.note)).toHaveLength(3);
    expect(stations.flatMap(s=>s.demoId?[s.demoId]:[])).toEqual(concepts.map(c=>c.goal));
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>expect(root.querySelector(link.hash)).not.toBeNull());
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.textContent).toContain('keine Kundenreferenzen');
    expect(root.querySelectorAll('[data-journey-demo]')).toHaveLength(4);
    expect(stationIndex('#raumgut')).toBe(5);
    expect(stationIndex('#unknown')).toBe(-1);
    expect(terrainHeight(2,3)).toBe(terrainHeight(2,3));
    for(const station of stations) expect(Number.isFinite(terrainHeight(...station.position))).toBe(true);
  });

  it('synchronizes explicit selection, native scrolling, history and the camera',async()=>{
    mount();await app!.sceneReady;flush();
    root.querySelector<HTMLAnchorElement>('.journey-chapters a[href="#raumgut"]')!.click();flush();
    expect(app!.getActive()).toBe(5);
    expect(location.hash).toBe('#raumgut');
    expect(root.querySelector('[data-pin="5"]')?.getAttribute('aria-current')).toBe('step');
    expect(root.querySelector('[data-map-title]')?.textContent).toBe('Raumgut');
    expect(document.activeElement?.id).toBe('raumgut-title');
    expect(scene.setProgress).toHaveBeenLastCalledWith(expect.any(Number),false);
    window.scrollY=1100;window.dispatchEvent(new Event('scroll'));flush();
    expect(app!.getActive()).toBe(0);
    expect(location.hash).toBe('#die-idee');
    history.replaceState(null,'','#nordlicht');window.dispatchEvent(new PopStateEvent('popstate'));flush();
    expect(app!.getActive()).toBe(3);
    expect(location.hash).toBe('#nordlicht');
  });

  it('restores a deep link and keeps content functional after a renderer import failure',async()=>{
    history.replaceState(null,'','#safran-atelier');
    mount({loadScene:async()=>{throw Error('unavailable');}});
    await app!.sceneReady;flush();flush();
    expect(app!.getActive()).toBe(4);
    expect(root.querySelector('[data-map]')?.getAttribute('data-render')).toBe('static');
    root.querySelector<HTMLAnchorElement>('a.journey-overview')!.click();flush();
    expect(app!.getActive()).toBe(-1);
    expect(root.querySelectorAll('[data-journey-demo]')).toHaveLength(4);
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

    selectStation('nordlicht');
    await vi.waitFor(()=>expect(slot.querySelector<HTMLElement>('.demo')?.dataset.demoId).toBe('nordlicht'));
    expect(demo.closest('[data-demo-parking]')).not.toBeNull();
    selectStation('raumgut');
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).toBe(demo));
    expect(input.value).toBe('Eiche, 180 cm');
    previewOpen.click();await vi.waitFor(()=>expect(dialog.open).toBe(true));
    expect(dialog.querySelector('input')).toBe(input);
    expect(input.value).toBe('Eiche, 180 cm');
    dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
    await vi.waitFor(()=>expect(slot.querySelector('.demo')).toBe(demo));
    expect(document.activeElement).toBe(previewOpen);
    expect(demos.createDemo.mock.calls.map(([id])=>id)).toEqual(['raumgut','nordlicht']);
    app!.dispose();
    expect(demos.disposeDemo).toHaveBeenCalledTimes(2);
    expect(demos.disposeDemo).toHaveBeenCalledWith(demo);
  });

  it('shows only the current station when its shared preview import resolves late',async()=>{
    const demos=mockDemos();
    const loading=deferred<typeof demos>();
    const loadDemos=vi.fn(()=>loading.promise);
    mount({loadDemos});await app!.sceneReady;flush();
    selectStation('meisterwerk');
    selectStation('nordlicht');
    loading.resolve(demos);
    const slot=root.querySelector('[data-preview-slot]')!;
    await vi.waitFor(()=>expect(slot.querySelector<HTMLElement>('.demo')?.dataset.demoId).toBe('nordlicht'));
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith('nordlicht');
    expect(loadDemos).toHaveBeenCalledOnce();
    expect(root.querySelector('[data-preview-name]')?.textContent).toBe('Nordlicht');
  });

  it.each(['leave','dispose'] as const)('does not attach a late preview after %s',async(action)=>{
    const demos=mockDemos();
    const loading=deferred<typeof demos>();
    mount({loadDemos:()=>loading.promise});await app!.sceneReady;flush();
    selectStation('meisterwerk');
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
    selectStation('meisterwerk');
    await vi.waitFor(()=>expect(root.querySelector('[data-preview-loading]')?.textContent).toContain('erneuten Laden'));
    const trigger=root.querySelector<HTMLButtonElement>('[data-preview-open]')!;
    expect(trigger.disabled).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-scene-preview]')!.hidden).toBe(false);
    trigger.click();
    await vi.waitFor(()=>expect(document.querySelector('dialog')?.open).toBe(true));
    const dialog=document.querySelector<HTMLDialogElement>('dialog')!;
    const demo=dialog.querySelector('.demo');
    expect(loadDemos).toHaveBeenCalledTimes(2);
    expect(demos.createDemo).toHaveBeenCalledExactlyOnceWith('meisterwerk');
    dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.click();
    await vi.waitFor(()=>expect(root.querySelector('[data-preview-slot] .demo')).toBe(demo));
    expect(root.querySelector<HTMLElement>('[data-preview-loading]')!.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('reuses each live session and restores chapter focus and map rendering on close',async()=>{
    const createDemo=vi.fn(()=>{const demo=document.createElement('div');demo.className='demo';demo.innerHTML='<input aria-label="Auswahl" />';return demo;});
    const disposeDemo=vi.fn();
    mount({loadDemos:async()=>({createDemo,disposeDemo,mountDemoDialog})});await app!.sceneReady;flush();
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
