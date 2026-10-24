import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DemoId } from './data';
import type { SceneController, SceneMode, SceneOptions } from './contracts';
import './scene.css';

const GOAL_ANGLE: Record<DemoId, number> = { meisterwerk: -.72, nordlicht: 0, sales: .72, raumgut: 1.15 };
const GOAL_ACCENT: Record<DemoId, string> = {
  meisterwerk: '#c7b29a', nordlicht: '#9bb8d8', sales: '#cfa477', raumgut: '#a3b090',
};
const SCREEN = { width: 720, height: 576, scale: .01, x: .12, y: .1, z: .382 };

/** Projects one caller-owned slot. The catalogue alone owns the live demos. */
export async function initScene({ container, demoElement }: SceneOptions): Promise<SceneController> {
  const originalParent = demoElement.parentNode;
  const originalNextSibling = demoElement.nextSibling;
  const originalStyle = demoElement.getAttribute('style');
  const originalInert = demoElement.inert;
  const originalResponsive = demoElement.classList.contains('demo--responsive');
  const originalSlotClass = demoElement.classList.contains('precision-demo-slot');
  const originalGoal = container.getAttribute('data-goal');
  const originalMode = container.getAttribute('data-mode');
  const originalAccent = container.style.getPropertyValue('--scene-goal-accent');
  const originalAngle = container.style.getPropertyValue('--scene-dial-angle');
  const responsiveClasses = new Map<HTMLElement, boolean>();
  const mobileMedia = window.matchMedia('(max-width: 999px)');
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentGoal: DemoId = 'meisterwerk';
  let currentMode: SceneMode = 'presentation';
  let responsiveMode = false;
  let unavailable = false;
  let disposed = false;
  let nativeScroll = 0;
  let cleanupProjection: (() => void) | undefined;
  let projection: {
    surface: HTMLElement;
    setPose: (mode: SceneMode) => void;
    setGoal: (goal: DemoId) => void;
    setEnabled: (enabled: boolean) => void;
  } | undefined;

  container.classList.add('precision-scene');
  demoElement.classList.add('precision-demo-slot');

  // Native HTML is also the desktop interaction surface: no perspective or
  // downscaled type, and long panels remain reachable through normal scrolling.
  const nativeFrame = document.createElement('div');
  nativeFrame.className = 'precision-static-frame';
  const nativeSurface = document.createElement('div');
  nativeSurface.className = 'precision-static-surface';
  const trim = document.createElement('div');
  trim.className = 'precision-static-trim';
  trim.setAttribute('aria-hidden', 'true');
  const dial = document.createElement('span');
  dial.className = 'precision-static-dial';
  dial.setAttribute('aria-hidden', 'true');
  const legend = document.createElement('div');
  legend.className = 'precision-layers';
  legend.innerHTML = '<span><i>01</i> Gestaltung</span><span><i>02</i> Inhalt</span><span><i>03</i> Funktion</span>';
  nativeFrame.append(nativeSurface, trim, dial);
  container.append(nativeFrame, legend);

  const syncDemoLayout = () => {
    const demos = demoElement.matches('.demo') ? [demoElement] : [...demoElement.querySelectorAll<HTMLElement>(':scope > .demo')];
    // Do not retain or mutate sessions that the catalogue moved to its dialog/cache.
    for (const demo of responsiveClasses.keys()) if (!demos.includes(demo)) responsiveClasses.delete(demo);
    for (const demo of demos) {
      if (!responsiveClasses.has(demo)) responsiveClasses.set(demo, demo.classList.contains('demo--responsive'));
      demo.classList.toggle('demo--responsive', responsiveMode);
    }
    demoElement.classList.toggle('demo--responsive', responsiveMode);
  };

  const moveSlot = (parent: HTMLElement) => {
    if (demoElement.parentElement === parent) return;
    const focus = demoElement.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    parent.append(demoElement);
    if (!demoElement.inert) focus?.focus({ preventScroll: true });
  };

  const failProjection = (error?: unknown) => {
    unavailable = true;
    cleanupProjection?.();
    cleanupProjection = undefined;
    projection = undefined;
    applyMode();
    if (error) console.info('Webbyu: HTML-Galerie ohne WebGL aktiv.', error);
  };

  const createProjection = () => {
    const cleanups: (() => void)[] = [];
    let alive = true;
    let enabled = true;
    let visible = false;
    let frameRequest = 0;
    // Register each resource when acquired, including resources that have not
    // reached the scene graph yet. Partial initialization uses this same path.
    const own = <T extends { dispose(): void }>(resource: T): T => {
      cleanups.push(() => resource.dispose());
      return resource;
    };
    cleanupProjection = () => {
      if (!alive) return;
      alive = false;
      if (frameRequest) cancelAnimationFrame(frameRequest);
      for (const cleanup of cleanups.reverse()) {
        try { cleanup(); } catch (error) { console.info('Webbyu: Szene-Ressource freigeben.', error); }
      }
    };

    const scene = new THREE.Scene();
    const htmlScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    cleanups.push(() => { renderer.dispose(); renderer.forceContextLoss(); });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.className = 'precision-webgl';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.domElement.className = 'precision-css3d';
    container.append(renderer.domElement, cssRenderer.domElement);
    cleanups.push(() => { renderer.domElement.remove(); cssRenderer.domElement.remove(); });

    const environment = new RoomEnvironment();
    let pmrem: THREE.PMREMGenerator | undefined;
    try {
      pmrem = new THREE.PMREMGenerator(renderer);
      const target = own(pmrem.fromScene(environment, .035));
      scene.environment = target.texture;
    } finally { environment.dispose(); pmrem?.dispose(); }
    scene.environmentIntensity = .85;
    scene.add(new THREE.HemisphereLight(0xe9dbcd, 0x241927, 1.6));
    const key = new THREE.DirectionalLight(0xffe2bc, 3.2);
    key.position.set(-5, 8, 10);
    const rim = new THREE.DirectionalLight(0xc9a0bc, 2.4);
    rim.position.set(7, 3, -2);
    scene.add(key, rim);

    const object = new THREE.Group();
    const htmlObject = new THREE.Group();
    object.name = 'gallery-frame';
    scene.add(object);
    htmlScene.add(htmlObject);
    const front = new THREE.Group();
    object.add(front);
    const metal = own(new THREE.MeshStandardMaterial({ color: 0x474249, metalness: .8, roughness: .32 }));
    const edge = own(new THREE.MeshStandardMaterial({ color: 0xa18e7b, metalness: .75, roughness: .38 }));
    const back = own(new THREE.MeshStandardMaterial({ color: 0x3d2938, metalness: .45, roughness: .52 }));
    const dark = own(new THREE.MeshStandardMaterial({ color: 0x242128, metalness: .65, roughness: .4 }));
    const accent = own(new THREE.MeshStandardMaterial({ color: GOAL_ACCENT[currentGoal], metalness: .6, roughness: .35 }));
    const marking = own(new THREE.MeshStandardMaterial({ color: 0x9b8e82, metalness: .55, roughness: .5 }));
    const makeBox = (w: number, h: number, d: number, material: THREE.Material, radius = .035) =>
      new THREE.Mesh(own(new RoundedBoxGeometry(w, h, d, 2, radius)), material);

    const roundedRect = (path: THREE.Shape | THREE.Path, x: number, y: number, w: number, h: number, r: number) => {
      path.moveTo(x + r, y);
      path.lineTo(x + w - r, y);
      path.quadraticCurveTo(x + w, y, x + w, y + r);
      path.lineTo(x + w, y + h - r);
      path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      path.lineTo(x + r, y + h);
      path.quadraticCurveTo(x, y + h, x, y + h - r);
      path.lineTo(x, y + r);
      path.quadraticCurveTo(x, y, x + r, y);
    };
    const frameShape = new THREE.Shape();
    roundedRect(frameShape, -4.1, -3.28, 8.2, 6.56, .12);
    const hole = new THREE.Path();
    roundedRect(hole, -3.5, -2.8, 7.24, 5.8, .055);
    frameShape.holes.push(hole);
    const frame = new THREE.Mesh(own(new THREE.ExtrudeGeometry(frameShape, {
      depth: .24, bevelEnabled: true, bevelThickness: .035,
      bevelSize: .035, bevelSegments: 3, steps: 1, curveSegments: 10,
    })), metal);
    frame.position.z = .1;
    front.add(frame);

    const backPlate = makeBox(8.02, 6.4, .14, back, .065);
    const middlePlate = makeBox(8.08, 6.46, .1, edge);
    const backing = makeBox(7.25, 5.81, .08, dark);
    backing.position.set(SCREEN.x, SCREEN.y, .275);
    object.add(backPlate, middlePlate);
    front.add(backing);
    const tickGeometry = own(new THREE.BoxGeometry(.009, .045, .008));
    for (let i = 0; i < 23; i++) {
      const tick = new THREE.Mesh(tickGeometry, marking);
      tick.scale.y = i % 5 === 0 ? 2 : 1;
      tick.position.set(-3.24 + i * .1, -3.063, .38);
      front.add(tick);
    }
    const enamel = makeBox(.54, .032, .014, accent, .005);
    enamel.position.set(2.82, -3.063, .383);
    front.add(enamel);
    const screwGeometry = own(new THREE.CylinderGeometry(.026, .026, .012, 12));
    for (const [x, y] of [[-3.85, 3.03], [-3.85, -3.03], [3.86, 3.03], [3.86, -3.03]]) {
      const screw = new THREE.Mesh(screwGeometry, marking);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, .38);
      front.add(screw);
    }

    const knob = new THREE.Group();
    knob.position.set(4.09, -1.96, .29);
    front.add(knob);
    const knobBody = new THREE.Mesh(own(new THREE.CylinderGeometry(.29, .32, .22, 48)), back);
    knobBody.rotation.x = Math.PI / 2;
    knob.add(knobBody);
    const knobFace = new THREE.Mesh(own(new THREE.CylinderGeometry(.25, .25, .014, 48)), accent);
    knobFace.rotation.x = Math.PI / 2;
    knobFace.position.z = .118;
    knob.add(knobFace);
    const knobMarker = makeBox(.018, .075, .008, dark, .003);
    knobMarker.position.set(0, .16, .13);
    knob.add(knobMarker);

    const surface = document.createElement('div');
    surface.className = 'precision-css-surface';
    surface.style.width = `${SCREEN.width}px`;
    surface.style.height = `${SCREEN.height}px`;
    // Keep the persistent slot connected even before the first visible render.
    // CSS3DRenderer moves this surface into its camera element when it draws.
    cssRenderer.domElement.append(surface);
    const cssObject = new CSS3DObject(surface);
    cssObject.scale.setScalar(SCREEN.scale);
    cssObject.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
    htmlObject.add(cssObject);

    const cancelRender = () => {
      if (frameRequest) cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    };
    const render = () => {
      frameRequest = 0;
      if (!alive || !enabled || !visible || document.hidden) return;
      try {
        renderer.render(scene, camera);
        cssRenderer.render(htmlScene, camera);
      } catch (error) { failProjection(error); }
    };
    const requestRender = () => {
      if (alive && enabled && visible && !document.hidden && !frameRequest) frameRequest = requestAnimationFrame(render);
    };
    const setPose = (mode: SceneMode) => {
      const layers = mode === 'layers';
      object.rotation.set(layers ? .075 : .055, layers ? -.48 : -.24, layers ? -.025 : -.018);
      object.position.set(layers ? -.38 : -.06, .08, 0);
      backPlate.position.set(layers ? .48 : 0, layers ? .14 : 0, layers ? -1.85 : -.27);
      middlePlate.position.set(layers ? .24 : 0, layers ? .07 : 0, layers ? -.9 : -.08);
      front.position.z = layers ? .1 : 0;
      // A single transform and camera feed both renderers. The HTML sits just
      // inside the beveled opening, in world units (720px = 7.2 units).
      htmlObject.position.copy(object.position);
      htmlObject.quaternion.copy(object.quaternion);
      htmlObject.scale.copy(object.scale);
      cssObject.position.z = SCREEN.z + front.position.z;
      requestRender();
    };
    const setGoal = (goal: DemoId) => {
      accent.color.set(GOAL_ACCENT[goal]);
      knob.rotation.z = GOAL_ANGLE[goal];
      requestRender();
    };
    const resize = () => {
      if (!alive) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      const fov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, 0, Math.max(7.65 / (2 * fov), 10 / (2 * fov * camera.aspect)));
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      cssRenderer.setSize(width, height);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(() => {
      try { resize(); } catch (error) { failProjection(error); }
    });
    cleanups.push(() => resizeObserver.disconnect());
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) requestRender();
      else cancelRender();
    });
    cleanups.push(() => intersectionObserver.disconnect());
    intersectionObserver.observe(container);
    const onVisibility = () => { if (document.hidden) cancelRender(); else requestRender(); };
    document.addEventListener('visibilitychange', onVisibility);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (alive && !disposed) failProjection();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    cleanups.push(() => renderer.domElement.removeEventListener('webglcontextlost', onContextLost));
    resize();
    return {
      surface, setPose, setGoal,
      setEnabled(value: boolean) {
        enabled = value;
        renderer.domElement.hidden = !value;
        cssRenderer.domElement.hidden = !value;
        if (value) requestRender(); else cancelRender();
      },
    };
  };

  function applyMode() {
    if (disposed) return;
    if (demoElement.parentElement === nativeSurface && !nativeFrame.hidden) nativeScroll = nativeSurface.scrollTop;
    const fallback = unavailable || mobileMedia.matches || motionMedia.matches;
    const native = fallback || currentMode === 'interactive';
    if (fallback && projection) {
      cleanupProjection?.();
      cleanupProjection = undefined;
      projection = undefined;
    }
    if (!fallback && !projection) {
      try { projection = createProjection(); }
      catch (error) { failProjection(error); return; }
    }
    container.dataset.goal = currentGoal;
    container.dataset.mode = currentMode;
    container.classList.toggle('precision-scene--static', fallback);
    container.classList.toggle('precision-scene--mobile', mobileMedia.matches);
    container.classList.toggle('precision-scene--native', native);
    container.classList.toggle('precision-scene--interactive', native);
    nativeFrame.hidden = !native;
    legend.hidden = currentMode !== 'layers';
    responsiveMode = native;
    syncDemoLayout();
    demoElement.inert = !native;
    demoElement.style.pointerEvents = native ? 'auto' : 'none';
    demoElement.style.width = native ? '100%' : `${SCREEN.width}px`;
    demoElement.style.height = native ? 'auto' : `${SCREEN.height}px`;
    if (native) {
      moveSlot(nativeSurface);
      nativeSurface.scrollTop = nativeScroll;
    } else {
      moveSlot(projection!.surface);
    }
    projection?.setEnabled(!native);
    projection?.setPose(currentMode);
    projection?.setGoal(currentGoal);
  }

  const updateAccent = () => {
    container.style.setProperty('--scene-goal-accent', GOAL_ACCENT[currentGoal]);
    container.style.setProperty('--scene-dial-angle', `${GOAL_ANGLE[currentGoal]}rad`);
  };
  const onMediaChange = () => applyMode();
  mobileMedia.addEventListener('change', onMediaChange);
  motionMedia.addEventListener('change', onMediaChange);
  // Synchronize slot children restored by the catalogue/dialog, without taking
  // ownership of them or listening to application/shell events.
  const slotObserver = new MutationObserver(syncDemoLayout);
  slotObserver.observe(demoElement, { childList: true });
  updateAccent();
  applyMode();

  return {
    setGoal(goal) {
      if (disposed) return;
      if (currentGoal !== goal) { nativeScroll = 0; nativeSurface.scrollTop = 0; }
      currentGoal = goal;
      container.dataset.goal = goal;
      updateAccent();
      syncDemoLayout();
      projection?.setGoal(goal);
    },
    setMode(mode) {
      if (disposed) return;
      // Repeated catalogue notifications must not reset a long form's scroll.
      if (currentMode === mode) { syncDemoLayout(); return; }
      if (demoElement.parentElement === nativeSurface) nativeScroll = nativeSurface.scrollTop;
      currentMode = mode;
      applyMode();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      slotObserver.disconnect();
      cleanupProjection?.();
      mobileMedia.removeEventListener('change', onMediaChange);
      motionMedia.removeEventListener('change', onMediaChange);
      nativeFrame.remove();
      legend.remove();
      container.classList.remove('precision-scene', 'precision-scene--static', 'precision-scene--mobile', 'precision-scene--native', 'precision-scene--interactive');
      for (const [key, value] of [['data-goal', originalGoal], ['data-mode', originalMode]]) {
        if (value === null) container.removeAttribute(key!); else container.setAttribute(key!, value!);
      }
      for (const [key, value] of [['--scene-goal-accent', originalAccent], ['--scene-dial-angle', originalAngle]]) {
        if (value) container.style.setProperty(key, value); else container.style.removeProperty(key);
      }
      for (const [demo, responsive] of responsiveClasses) demo.classList.toggle('demo--responsive', responsive);
      responsiveClasses.clear();
      demoElement.classList.toggle('demo--responsive', originalResponsive);
      demoElement.classList.toggle('precision-demo-slot', originalSlotClass);
      demoElement.inert = originalInert;
      if (originalStyle === null) demoElement.removeAttribute('style'); else demoElement.setAttribute('style', originalStyle);
      if (originalParent) {
        if (originalNextSibling?.parentNode === originalParent) originalParent.insertBefore(demoElement, originalNextSibling);
        else originalParent.appendChild(demoElement);
      } else demoElement.remove();
    },
  };
}
