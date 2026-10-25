import { stations, stationIndex } from './data';
import type { DemoId } from '../data';
import { renderJourney } from './page';
import { mapProjection } from './map';

export interface LandscapeController {
  setProgress(progress: number, immediate?: boolean): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}
type DemoModule = Pick<typeof import('../demos'), 'createDemo' | 'disposeDemo' | 'mountDemoDialog'>;
interface JourneyOptions {
  embedded?: boolean;
  loadScene?: () => Promise<{ initLandscape(container: HTMLElement): LandscapeController }>;
  loadDemos?: () => Promise<DemoModule>;
}

export function mountJourney(root: HTMLElement, options: JourneyOptions = {}) {
  renderJourney(root);
  root.classList.toggle('journey-embedded', Boolean(options.embedded));
  const events = new AbortController();
  const listen = { signal: events.signal };
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 760px)');
  const sections = [...root.querySelectorAll<HTMLElement>('[data-chapter]')];
  const map = root.querySelector<HTMLElement>('[data-map]')!;
  const links = [...root.querySelectorAll<HTMLAnchorElement>('.journey-chapters a')];
  const pins = [...root.querySelectorAll<HTMLAnchorElement>('[data-pin]')];
  const status = root.querySelector<HTMLElement>('.journey-status')!;
  const guide = root.querySelector<HTMLElement>('[data-guide]')!;
  const guideOpen = root.querySelector<HTMLButtonElement>('[data-guide-open]')!;
  const back = root.querySelector<HTMLAnchorElement>('[data-travel-back]')!;
  const next = root.querySelector<HTMLAnchorElement>('[data-travel-next]')!;
  const preview = root.querySelector<HTMLElement>('[data-scene-preview]')!;
  const previewSlot = root.querySelector<HTMLElement>('[data-preview-slot]')!;
  const previewOpen = root.querySelector<HTMLButtonElement>('[data-preview-open]')!;
  const previewLoading = root.querySelector<HTMLElement>('[data-preview-loading]')!;
  const parking = root.querySelector<HTMLElement>('[data-demo-parking]')!;
  const questions: Record<number,string> = {0:'Die Aufgabe verstehen.',3:'Gestaltung und Funktion verbinden.',6:'Das nächste Vorhaben klären.'};
  let disposed = false;
  let active = -2;
  let progress = -1;
  let frame = 0;
  let travelling: { index: number; until: number } | undefined;
  let scene: LandscapeController | undefined;
  let demoModule: DemoModule | undefined;
  let demosLoading: Promise<DemoModule> | undefined;
  let dialog: ReturnType<DemoModule['mountDemoDialog']> | undefined;
  let request = 0;
  let previewRequest = 0;
  const sessions = new Map<DemoId, HTMLElement>();

  function loadDemoModule() {
    demosLoading ??= (options.loadDemos??(()=>import('../demos')))().catch(error=>{demosLoading=undefined;throw error;});
    return demosLoading;
  }

  function getSession(module: DemoModule, id: DemoId) {
    let demo=sessions.get(id);
    if(!demo) {
      demo=module.createDemo(id);
      parking.append(demo);
      sessions.set(id,demo);
    }
    return demo;
  }

  function sizePreview() {
    // A real concept DOM at desktop proportions, scaled into the spatial surface.
    // Inert on this surface; the same live session becomes interactive in the dialog.
    previewSlot.style.setProperty('--preview-scale',String(previewSlot.clientWidth/960));
  }

  async function showPreview(index: number) {
    const ticket=++previewRequest;
    const station=stations[index];
    const id=station?.demoId;
    for(const demo of previewSlot.querySelectorAll<HTMLElement>(':scope > .demo')) parking.append(demo);
    preview.hidden=!id;
    delete previewOpen.dataset.previewDemo;
    if(!id) return;
    previewOpen.dataset.previewDemo=id;
    previewOpen.setAttribute('aria-label',`${station.label}: sichtbare Website in Großansicht ausprobieren`);
    root.querySelector('[data-preview-name]')!.textContent=station.label;
    previewLoading.hidden=false;
    previewLoading.textContent='Website-Vorschau wird geladen …';
    preview.setAttribute('aria-busy','true');
    sizePreview();
    try {
      const module=await loadDemoModule();
      if(disposed||ticket!==previewRequest) return;
      demoModule=module;
      const demo=getSession(module,id);
      if(!demo.closest('dialog')) previewSlot.append(demo);
      sizePreview();
      previewLoading.hidden=true;
    } catch {
      if(!disposed&&ticket===previewRequest) previewLoading.textContent='Vorschau nicht geladen. Zum erneuten Laden öffnen.';
    } finally {
      if(!disposed&&ticket===previewRequest) preview.removeAttribute('aria-busy');
    }
  }

  function positionFallbackPins() {
    if(map.dataset.render==='webgl') return;
    const width=map.clientWidth,height=map.clientHeight;
    const left=compact.matches?0:width*.34;
    const top=compact.matches?72:80;
    const bottom=compact.matches?20:80;
    const scale=Math.max(0,Math.min((width-left)/1000,(height-top-bottom)/580));
    pins.forEach((pin,i)=>{
      const [x,y]=mapProjection(...stations[i].position);
      pin.style.left=`${left+(width-left-1000*scale)/2+x*scale}px`;
      pin.style.top=`${top+(height-top-bottom-580*scale)/2+y*scale}px`;
    });
  }

  function activate(index: number) {
    if (active === index) return;
    active = index;
    void showPreview(index);
    map.dataset.view=index<0?'overview':'travel';
    map.dataset.project=String(Boolean(stations[index]?.demoId));
    sections.forEach((section,i)=>section.classList.toggle('is-current',i===index+1));
    root.querySelector('[data-scene-caption]')!.textContent=index<0?'Jede Idee eröffnet einen neuen Zusammenhang.':stations[index].visual.caption;
    root.querySelector('[data-scene-index]')!.textContent=index<0?'WEBBYU / VERBUNDENE ERLEBNISRÄUME':`${String(index+1).padStart(2,'0')} / ${stations[index].label.toUpperCase()}`;
    const note=stations[index]?.note;
    // Notes remain readable in the chapter; the optional detail never opens over it automatically.
    guide.hidden=true;
    guideOpen.hidden=!note;
    if(note) {
      root.querySelector('[data-guide-question]')!.textContent=questions[index];
      root.querySelector('[data-guide-text]')!.textContent=note;
    }
    links.forEach((link,i) => i===index+1 ? link.setAttribute('aria-current','step') : link.removeAttribute('aria-current'));
    pins.forEach((pin,i) => i===index ? pin.setAttribute('aria-current','step') : pin.removeAttribute('aria-current'));
    root.querySelector('[data-map-title]')!.textContent = index<0?'Übersicht':stations[index].label;
    root.querySelector('[data-step-count]')!.textContent = `${String(index+1).padStart(2,'0')} / ${String(stations.length).padStart(2,'0')}`;
    back.setAttribute('href',index<0?import.meta.env.BASE_URL:index===0?'#landschaft':`#${stations[index-1].id}`);
    next.setAttribute('href',index===stations.length-1?`${import.meta.env.BASE_URL}#projektfinder`:`#${stations[index+1].id}`);
    root.querySelector('[data-back-label]')!.textContent=index<0?'Zur Startseite':'Zurück';
    root.querySelector('[data-next-label]')!.textContent=index<0?'Reise beginnen':index===stations.length-1?'Projekt besprechen':'Weiter';
    back.setAttribute('aria-label',index<0?'Zur Startseite':index===0?'Zurück zur Übersicht':`Zurück: ${stations[index-1].label}`);
    next.setAttribute('aria-label',index<0?'Reise beginnen: Die Idee':index===stations.length-1?'Projekt besprechen':`Weiter: ${stations[index+1].label}`);
    root.querySelector<HTMLElement>('.journey-progress span')!.style.width = `${Math.max(0,index+1)/stations.length*100}%`;
    // Scrolling updates the current entry; explicit chapter choices create history.
    const hash = index<0?'#landschaft':`#${stations[index].id}`;
    if (!travelling && location.hash !== hash) history.replaceState(null,'',hash);
    if (options.embedded) window.parent.postMessage({ type: 'webbyu:journey-position', hash }, location.origin);
  }

  function update() {
    frame = 0;
    if (disposed) return;
    const line = compact.matches ? 90 : window.innerHeight*.17;
    const rects = sections.map(section=>section.getBoundingClientRect());
    let index = -1;
    for(let i=1;i<rects.length;i++) if(rects[i].top<=line) index=i-1;
    if (window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4 && window.scrollY>0) index=stations.length-1;
    if (travelling && (Date.now()>travelling.until || index===travelling.index)) travelling=undefined;
    activate(travelling?.index??index);
    const rectIndex=index+1;
    const current=rects[rectIndex];
    const next=rects[rectIndex+1];
    const blend=next?Math.max(0,Math.min(1,(line-current.top)/Math.max(1,next.top-current.top))):0;
    // Pause at each scene while its text is read, then travel during the last part of the chapter.
    progress=index+Math.max(0,Math.min(1,(blend-.48)/.52));
    scene?.setProgress(progress,media.matches);
    preview.style.setProperty('--preview-reveal',String(media.matches?1:Math.max(0,1-Math.abs(progress-active)*2)));
    sizePreview();
    positionFallbackPins();
  }

  function schedule() { if(!frame&&!disposed) frame=requestAnimationFrame(update); }

  function go(index: number, push: boolean, focus: boolean) {
    const section=sections[index+1];
    if(!section) return;
    const hash=index<0?'#landschaft':`#${stations[index].id}`;
    travelling={index,until:Date.now()+2200};
    if(push&&location.hash!==hash) history.pushState(null,'',hash);
    // Direct choices place the matching story immediately; the 3D camera owns
    // the transition. Scrolling past unrelated chapters would obscure the target.
    section.scrollIntoView({behavior:'instant',block:'start'});
    if(focus) {
      const heading=section.querySelector<HTMLElement>('h2')!;
      heading.tabIndex=-1;
      heading.focus({preventScroll:true});
    }
    activate(index);
    schedule();
  }

  async function openDemo(id: DemoId, trigger: HTMLButtonElement) {
    const ticket=++request;
    trigger.disabled=true;
    trigger.setAttribute('aria-busy','true');
    status.textContent='Die Konzeptdemo wird geladen.';
    try {
      const module=await loadDemoModule();
      if(disposed||ticket!==request) return;
      demoModule=module;
      dialog ??= module.mountDemoDialog({onRestore(){ if(!disposed) { scene?.setEnabled(true);root.classList.remove('has-open-demo');void showPreview(active); } }});
      const demo=getSession(module,id);
      trigger.disabled=false;
      trigger.focus({preventScroll:true});
      dialog.open(id,demo);
      root.classList.add('has-open-demo');
      scene?.setEnabled(false);
      status.textContent='';
    } catch {
      if(!disposed&&ticket===request) status.textContent='Die Demo konnte nicht geladen werden. Bitte versuchen Sie es über „Konzept ausprobieren“ erneut.';
    } finally {
      trigger.disabled=false;
      trigger.removeAttribute('aria-busy');
    }
  }

  root.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    const homeLink = target?.closest<HTMLAnchorElement>('a');
    if (options.embedded && homeLink && homeLink.origin === location.origin && homeLink.pathname === import.meta.env.BASE_URL) {
      event.preventDefault();
      window.parent.postMessage({ type: 'webbyu:journey-home', hash: homeLink.hash }, location.origin);
      return;
    }
    if(target?.closest('[data-guide-dismiss]')) {
      guide.hidden=true;guideOpen.hidden=false;
      guideOpen.focus({preventScroll:true});return;
    }
    if(target?.closest('[data-guide-open]')) {
      guide.hidden=false;guideOpen.hidden=true;
      guide.querySelector<HTMLButtonElement>('[data-guide-dismiss]')!.focus({preventScroll:true});return;
    }
    const demo=target?.closest<HTMLButtonElement>('[data-journey-demo]');
    if(demo) { void openDemo(demo.dataset.journeyDemo as DemoId,demo); return; }
    const previewButton=target?.closest<HTMLButtonElement>('[data-preview-open]');
    if(previewButton?.dataset.previewDemo) { void openDemo(previewButton.dataset.previewDemo as DemoId,previewButton); return; }
    const link=target?.closest<HTMLAnchorElement>('a[href^="#"]');
    if(!link || (event instanceof MouseEvent && (event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0))) return;
    if(link.hash==='#reise-kapitel') return;
    const index=stationIndex(link.hash);
    if(index<0&&link.hash!=='#landschaft') return;
    event.preventDefault();
    go(index,true,true);
  },listen);
  guide.addEventListener('keydown',event=>{
    if(event.key==='Escape') {
      guide.hidden=true;guideOpen.hidden=false;guideOpen.focus({preventScroll:true});
    }
  },listen);
  root.addEventListener('landscape-fallback',()=>{
    root.querySelector('[data-map-hint]')!.textContent='Die Erlebnisräume werden als Illustration gezeigt. Alle Stationen und Demos sind erreichbar.';
    positionFallbackPins();
  },listen);
  window.addEventListener('scroll',schedule,{...listen,passive:true});
  window.addEventListener('resize',()=>{
    // Fullscreen changes the chapter heights. Keep the chosen station in view.
    if (options.embedded && active >= -1) go(active, false, false);
    else schedule();
  },listen);
  const fromHistory=()=>go(stationIndex(location.hash),false,false);
  window.addEventListener('popstate',fromHistory,listen);
  window.addEventListener('hashchange',fromHistory,listen);
  media.addEventListener('change',schedule);
  const resize=new ResizeObserver(schedule);
  resize.observe(root);
  resize.observe(previewSlot);

  const sceneReady=(options.loadScene??(()=>import('./scene')))().then(module=>{
    if(disposed) return;
    scene=module.initLandscape(map);
    scene.setProgress(progress,true);
    if(dialog) scene.setEnabled(!document.querySelector('.concept-dialog[open]'));
  }).catch(()=>{
    if(disposed) return;
    map.dataset.render='static';
    root.querySelector('[data-map-hint]')!.textContent='Die Erlebnisräume werden als Illustration gezeigt. Alle Stationen und Demos sind erreichbar.';
    positionFallbackPins();
  });
  if(location.hash&&stationIndex(location.hash)>=0) requestAnimationFrame(()=>{ if(!disposed) go(stationIndex(location.hash),false,false); });
  schedule();

  return {
    sceneReady,
    getActive:()=>active,
    dispose(){
      if(disposed) return;
      disposed=true;
      events.abort();
      media.removeEventListener('change',schedule);
      resize.disconnect();
      if(frame) cancelAnimationFrame(frame);
      dialog?.dispose();
      for(const demo of sessions.values()) demoModule?.disposeDemo(demo);
      sessions.clear();
      root.classList.remove('has-open-demo');
      scene?.dispose();
    },
  };
}
