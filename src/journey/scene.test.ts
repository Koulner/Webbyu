// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initLandscape, TRANSITIONS } from './scene';
import { renderJourney } from './page';
import { stations } from './data';

const gpu=vi.hoisted(()=>({fail:false,render:vi.fn(),dispose:vi.fn(),lose:vi.fn()}));
vi.mock('three',async importOriginal=>{
  const actual=await importOriginal<typeof import('three')>();
  return {...actual,WebGLRenderer:class {
    domElement=document.createElement('canvas');
    constructor(){if(gpu.fail)throw Error('GPU unavailable');}
    setPixelRatio(){} setClearColor(){} setSize(){}
    render=gpu.render;dispose=gpu.dispose;forceContextLoss=gpu.lose;
  }};
});
let controller:ReturnType<typeof initLandscape>|undefined;
let map:HTMLElement;
let frames:Map<number,FrameRequestCallback>;
let nextFrame:number;
let elapsed:number;
let intersect:(entries:{isIntersecting:boolean}[])=>void;
let media:{matches:boolean;addEventListener:ReturnType<typeof vi.fn>;removeEventListener:ReturnType<typeof vi.fn>};
beforeEach(()=>{
  gpu.fail=false;gpu.render.mockReset();gpu.dispose.mockReset();gpu.lose.mockReset();
  document.body.innerHTML='<div id="test-scene"></div>';
  renderJourney(document.querySelector('#test-scene')!);
  map=document.querySelector('[data-map]')!;
  Object.defineProperty(map,'clientWidth',{configurable:true,value:800});
  Object.defineProperty(map,'clientHeight',{configurable:true,value:480});
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  frames=new Map();nextFrame=0;elapsed=0;
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++nextFrame,callback);return nextFrame;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
  media={matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()};
  vi.stubGlobal('matchMedia',()=>media);
  vi.stubGlobal('ResizeObserver',class {constructor(){} observe(){} disconnect(){}});
  vi.stubGlobal('IntersectionObserver',class {constructor(callback:typeof intersect){intersect=callback;}observe(){}disconnect(){}});
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
});
afterEach(()=>{controller?.dispose();controller=undefined;document.body.replaceChildren();vi.restoreAllMocks();vi.unstubAllGlobals();});
const flush=()=>{elapsed+=16;const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(elapsed));};

describe('journey picture element',()=>{
  it('renders as decoration, replaces the network map and disposes the canvas once',()=>{
    controller=initLandscape(map);
    expect(map.dataset.render).toBe('material');
    expect(map.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    flush();
    expect(gpu.render).toHaveBeenCalledOnce();
    controller.dispose();controller.dispose();
    expect(gpu.dispose).toHaveBeenCalledOnce();expect(gpu.lose).toHaveBeenCalledOnce();
    expect(map.querySelector('canvas')).toBeNull();
    expect(map.dataset.render).toBeUndefined();
    expect(frames.size).toBe(0);
  });

  it('falls back to the static map when no GPU is available',()=>{
    gpu.fail=true;
    expect(()=>{controller=initLandscape(map);}).not.toThrow();
    expect(map.dataset.render).toBe('static');
    controller!.setProgress(3);
    expect(frames.size).toBe(0);
  });

  it('rests between stations, ignores the pointer and moves only while travelling',()=>{
    controller=initLandscape(map);flush();
    expect(frames.size).toBe(0);
    window.dispatchEvent(new MouseEvent('pointermove',{clientX:100,clientY:100}));
    expect(frames.size).toBe(0);
    controller.setProgress(1);
    for(let i=0;i<400&&frames.size;i++) flush();
    expect(frames.size).toBe(0);
    media.matches=true;controller.setProgress(3);
    for(let i=0;i<5&&frames.size;i++) flush();
    expect(frames.size).toBe(0);
    controller.setProgress(Number.NaN);flush();
    expect(frames.size).toBe(0);
  });

  it('gives every station its own transition',()=>{
    const modes=stations.map(station=>TRANSITIONS.indexOf(station.id));
    expect(modes.every(mode=>mode>=0)).toBe(true);
    expect(new Set(modes).size).toBe(stations.length);
  });

  it('changes once from the visible station to the target when jumping over several stations',()=>{
    controller=initLandscape(map);
    const uniforms=()=>((gpu.render.mock.lastCall![0] as import('three').Scene).children[0] as import('three').Mesh<import('three').PlaneGeometry,import('three').ShaderMaterial>).material.uniforms;
    controller.setProgress(1,true);flush();
    const fundament=uniforms().uTexA.value;
    controller.setProgress(6,true);flush();
    controller.setProgress(0);
    const seen=new Set<unknown>(), modes=new Set<number>();
    // At rest uTexB already holds the next station, so only frames of the running transition count.
    for(let i=0;i<400&&frames.size;i++){flush();if(frames.size){seen.add(uniforms().uTexA.value);seen.add(uniforms().uTexB.value);modes.add(uniforms().uMode.value);}}
    expect(frames.size).toBe(0);
    expect(seen.has(fundament)).toBe(false);
    // Backwards the transition of the station being left runs in reverse.
    expect([...modes]).toEqual([TRANSITIONS.indexOf('raumgut')]);
  });

  it('stops work when disabled, offscreen or hidden; reduced motion jumps without animation',()=>{
    controller=initLandscape(map);flush();gpu.render.mockClear();
    controller.setEnabled(false);controller.setProgress(2);flush();expect(gpu.render).not.toHaveBeenCalled();
    controller.setEnabled(true);intersect([{isIntersecting:false}]);flush();expect(gpu.render).not.toHaveBeenCalled();
    intersect([{isIntersecting:true}]);
    media.matches=true;controller.setProgress(4);flush();
    expect(gpu.render).toHaveBeenCalledOnce();expect(frames.size).toBe(0);
  });
});
