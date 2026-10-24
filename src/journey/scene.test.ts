// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { initLandscape } from './scene';
import { renderJourney } from './page';
import { stations } from './data';
import { landscapeSvg, mapProjection } from './map';

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
  vi.stubGlobal('ResizeObserver',class {observe(){} disconnect(){}});
  vi.stubGlobal('IntersectionObserver',class {constructor(callback:typeof intersect){intersect=callback;}observe(){}disconnect(){}});
});
afterEach(()=>{controller?.dispose();controller=undefined;document.body.replaceChildren();vi.restoreAllMocks();vi.unstubAllGlobals();});
const flush=()=>{elapsed+=16;const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(elapsed));};
const renderedScene=()=>gpu.render.mock.calls.at(-1)![0] as THREE.Scene;
const renderedCamera=()=>gpu.render.mock.calls.at(-1)![1] as THREE.PerspectiveCamera;

describe('journey visual lifecycle',()=>{
  it.each([[1265,712],[1365,862],[800,480],[390,422],[320,400]])('fits all overview stations at %i × %i, including reduced motion',(width,height)=>{
    Object.defineProperty(map,'clientWidth',{configurable:true,value:width});
    Object.defineProperty(map,'clientHeight',{configurable:true,value:height});
    controller=initLandscape(map);flush();
    const verify=()=>map.querySelectorAll<HTMLElement>('[data-pin]').forEach(pin=>{
      expect(pin.style.visibility).not.toBe('hidden');
      const x=parseFloat(pin.style.left)/width,y=parseFloat(pin.style.top)/height;
      expect(x).toBeGreaterThan(width<760?.08:.46);
      expect(x).toBeLessThan(width<760?.92:.93);
      expect(y).toBeGreaterThan(.15);expect(y).toBeLessThan(.82);
    });
    verify();media.matches=true;controller.setProgress(5,true);flush();verify();
  });

  it('projects accessible pins safely and disposes geometry, shaders and the canvas once',()=>{
    const pin=map.querySelector<HTMLElement>('[data-pin]')!;
    const originalStyle=pin.getAttribute('style');
    controller=initLandscape(map);flush();
    expect(map.dataset.render).toBe('webgl');
    expect(map.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    const scene=renderedScene();
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    scene.traverse(object=>{
      if(object instanceof THREE.Mesh){
        geometries.add(object.geometry);
        (Array.isArray(object.material)?object.material:[object.material]).forEach(value=>materials.add(value));
      }
    });
    const geometryDisposals=[...geometries].map(value=>vi.spyOn(value,'dispose'));
    const materialDisposals=[...materials].map(value=>vi.spyOn(value,'dispose'));
    map.querySelectorAll<HTMLElement>('[data-pin]').forEach(projected=>{
      const x=parseFloat(projected.style.left),y=parseFloat(projected.style.top);
      expect(Number.isFinite(x)&&Number.isFinite(y)).toBe(true);
      if(projected.style.visibility!=='hidden'){
        expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(800);
        expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(480);
      }
    });
    controller.dispose();controller.dispose();
    [...geometryDisposals,...materialDisposals].forEach(dispose=>expect(dispose).toHaveBeenCalledOnce());
    expect(gpu.dispose).toHaveBeenCalledOnce();expect(gpu.lose).toHaveBeenCalledOnce();
    expect(map.querySelector('canvas')).toBeNull();expect(pin.getAttribute('style')).toBe(originalStyle);
    expect(frames.size).toBe(0);
  });

  it('reveals the approached project, grows its connections and clears transition mist when settled',()=>{
    controller=initLandscape(map);flush();
    const scene=renderedScene();
    const worlds=stations.map(station=>scene.getObjectByName(`world-${station.id}`)!);
    expect(worlds.every(world=>!world.visible)).toBe(true);
    const network=scene.getObjectByName('connection-network')!;
    const traced=network.children.filter((object):object is THREE.Mesh=>object instanceof THREE.Mesh&&object.name.startsWith('connection-'));
    const drawn=()=>traced.reduce((sum,mesh)=>sum+mesh.geometry.drawRange.count,0);
    expect(drawn()).toBe(0);
    controller.setProgress(2,true);flush();
    expect(worlds[2].visible).toBe(true);
    expect(worlds.filter(world=>world.visible)).toHaveLength(1);
    const earlyDrawn=drawn();expect(earlyDrawn).toBeGreaterThan(0);
    controller.setProgress(2.5,true);flush();
    const mist=scene.getObjectByName('transition-mist-1') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
    expect(mist.visible).toBe(true);expect(mist.material.uniforms.uOpacity.value).toBeGreaterThan(0);
    controller.setProgress(6,true);flush();
    expect(drawn()).toBeGreaterThan(earlyDrawn);
    traced.forEach(mesh=>expect(mesh.geometry.drawRange.count).toBe(mesh.geometry.index!.count));
    expect(mist.visible).toBe(false);expect(frames.size).toBe(0);
    expect(worlds[6].visible).toBe(true);
  });

  it('stops work when disabled, offscreen or hidden, and reduced motion preserves the overview',()=>{
    controller=initLandscape(map);flush();
    const overview=renderedCamera().position.clone();gpu.render.mockClear();
    controller.setEnabled(false);controller.setProgress(3);flush();expect(gpu.render).not.toHaveBeenCalled();
    controller.setEnabled(true);intersect([{isIntersecting:false}]);flush();expect(gpu.render).not.toHaveBeenCalled();
    media.matches=true;intersect([{isIntersecting:true}]);flush();
    expect(gpu.render).toHaveBeenCalledOnce();expect(frames.size).toBe(0);
    expect(renderedCamera()).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(renderedCamera().position.equals(overview)).toBe(true);
    controller.setProgress(5.5,true);flush();
    expect(renderedCamera().position.equals(overview)).toBe(true);
    expect(renderedScene().getObjectByName('transition-mist-1')?.visible).toBe(false);
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));controller.setProgress(5);flush();
    expect(gpu.render).toHaveBeenCalledTimes(2);
  });

  it('settles an animated movement without an endless render loop and accepts finite bounded input',()=>{
    controller=initLandscape(map);flush();controller.setProgress(2);
    let steps=0;while(frames.size&&steps++<150)flush();
    expect(steps).toBeGreaterThan(1);expect(steps).toBeLessThan(150);expect(frames.size).toBe(0);
    controller.setProgress(Number.NaN,true);flush();
    expect(renderedCamera().position.toArray().every(Number.isFinite)).toBe(true);
    controller.setProgress(100,true);flush();
    expect(renderedScene().getObjectByName(`world-${stations.at(-1)!.id}`)?.visible).toBe(true);
  });

  it('returns to the vector overview after context loss and cleans a failed initialization',()=>{
    controller=initLandscape(map);flush();
    const notice=vi.fn();map.addEventListener('landscape-fallback',notice);
    const event=new Event('webglcontextlost',{cancelable:true});map.querySelector('canvas')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);expect(map.dataset.render).toBe('static');
    expect(notice).toHaveBeenCalledOnce();expect(map.querySelector('svg')).not.toBeNull();
    controller.setProgress(3);flush();expect(frames.size).toBe(0);
    gpu.fail=true;
    expect(()=>initLandscape(map)).toThrow('GPU unavailable');
    expect(map.querySelector('canvas')).toBeNull();expect(frames.size).toBe(0);
  });
});

describe('journey vector fallback',()=>{
  it('keeps every station in the overview and isolates gradient references for repeated embeds',()=>{
    const first=document.createElement('div'),second=document.createElement('div');
    first.innerHTML=landscapeSvg();second.innerHTML=landscapeSvg();
    expect(first.querySelectorAll('[data-field]')).toHaveLength(stations.length);
    const firstIds=[...first.querySelectorAll('[id]')].map(element=>element.id);
    second.querySelectorAll('[id]').forEach(element=>expect(firstIds).not.toContain(element.id));
    first.querySelectorAll('[fill^="url("]').forEach(element=>{
      const id=element.getAttribute('fill')!.slice(5,-1);
      expect(first.querySelector(`#${id}`)).not.toBeNull();
    });
    stations.forEach(station=>{
      const [x,y]=mapProjection(...station.position);
      expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(1000);
      expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(580);
    });
  });
});
