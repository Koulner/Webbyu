import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import type { DemoGoal } from './data';
import type { SceneController, SceneMode, SceneOptions } from './contracts';
import './scene.css';

const GOAL_ANGLE: Record<DemoGoal, number> = { inquiries: -.72, bookings: 0, sales: .72 };
const GOAL_ACCENT: Record<DemoGoal, string> = {
  inquiries: '#2558ee', bookings: '#7a8764', sales: '#ac6344',
};
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

/** A physical, open aluminium frame around a real, accessible HTML example. */
export async function initScene(options: SceneOptions): Promise<SceneController> {
  const { container, demoElement } = options;
  const originalParent = demoElement.parentNode;
  const originalNextSibling = demoElement.nextSibling;
  const originalStyle = demoElement.getAttribute('style');
  const originallyResponsive = demoElement.classList.contains('demo--responsive');
  const originalInert = demoElement.inert;
  const responsiveClasses = new Map<HTMLElement, boolean>();
  const mobileMedia = window.matchMedia('(max-width: 999px)');
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentGoal: DemoGoal = 'inquiries';
  let currentMode: SceneMode = 'presentation';
  let modeCleanup: (() => void) | undefined;
  let responsiveMode = false;
  let webglUnavailable = false;
  let disposed = false;

  container.classList.add('precision-scene');
  container.dataset.goal = currentGoal;
  container.dataset.mode = currentMode;

  // Callers may supply either the demo itself or a persistent slot whose child
  // changes with the chosen goal. Both need the same layout mode immediately.
  const syncDemoLayout = () => {
    const demos = demoElement.matches('.demo') ? [demoElement] : [...demoElement.querySelectorAll<HTMLElement>(':scope > .demo')];
    for (const demo of responsiveClasses.keys()) if (!demos.includes(demo)) responsiveClasses.delete(demo);
    for (const demo of demos) {
      if (!responsiveClasses.has(demo)) responsiveClasses.set(demo, demo.classList.contains('demo--responsive'));
      demo.classList.toggle('demo--responsive', responsiveMode);
    }
    demoElement.classList.toggle('demo--responsive', responsiveMode);
  };

  const setDemoInteractive = (interactive: boolean) => {
    demoElement.inert = !interactive;
    demoElement.style.pointerEvents = interactive ? 'auto' : 'none';
    container.classList.toggle('precision-scene--interactive', interactive);
  };

  // The fallback is also the mobile presentation. It keeps the full HTML and
  // permits real reflow instead of shrinking controls into an unreadable image.
  const createStatic = (mobile: boolean) => {
    container.classList.add('precision-scene--static');
    container.classList.toggle('precision-scene--mobile', mobile);
    const frame = document.createElement('div');
    frame.className = 'precision-static-frame';
    const trim = document.createElement('div');
    trim.className = 'precision-static-trim';
    trim.setAttribute('aria-hidden', 'true');
    const dial = document.createElement('span');
    dial.className = 'precision-static-dial';
    dial.setAttribute('aria-hidden', 'true');
    const surface = document.createElement('div');
    surface.className = 'precision-static-surface';
    responsiveMode = true;
    syncDemoLayout();
    demoElement.style.width = '100%';
    demoElement.style.height = 'auto';
    demoElement.style.transform = '';
    surface.append(demoElement);
    frame.append(trim, surface, dial);
    const legend = document.createElement('p');
    legend.className = 'precision-static-legend';
    legend.textContent = '01 Gestaltung · 02 Inhalt · 03 Funktion';
    frame.append(legend);
    container.append(frame);
    setDemoInteractive(true);
    return () => frame.remove();
  };

  let updateGoal: ((goal: DemoGoal) => void) | undefined;
  let updateMode: ((mode: SceneMode) => void) | undefined;

  const createWebGL = () => {
    const cleanupTasks: (() => void)[] = [];
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      for (const task of cleanupTasks.reverse()) task();
      updateGoal = undefined;
      updateMode = undefined;
    };
    // Register partial cleanup before WebGL creation: a context/environment
    // failure partway through initialization must not leave a second renderer.
    modeCleanup = cleanup;
    const scene = new THREE.Scene();
    const htmlScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(0, .08, 17.7);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    cleanupTasks.push(() => renderer.dispose());
    cleanupTasks.push(() => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
          geometries.add(node.geometry);
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.domElement.className = 'precision-webgl';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.domElement.className = 'precision-css3d';
    container.append(renderer.domElement, cssRenderer.domElement);
    cleanupTasks.push(() => { renderer.domElement.remove(); cssRenderer.domElement.remove(); });

    const layerLegend = document.createElement('div');
    layerLegend.className = 'precision-layers';
    layerLegend.setAttribute('aria-hidden', 'true');
    layerLegend.innerHTML = '<span><i>01</i> Gestaltung</span><span><i>02</i> Inhalt</span><span><i>03</i> Funktion</span>';
    container.append(layerLegend);
    cleanupTasks.push(() => layerLegend.remove());

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let environmentTarget: THREE.WebGLRenderTarget;
    // Keep the initial blur within PMREM's 20-sample kernel at its default size.
    try { environmentTarget = pmrem.fromScene(environment, .035); }
    finally { environment.dispose(); pmrem.dispose(); }
    cleanupTasks.push(() => environmentTarget.dispose());
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 1.05;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbab9b1, 1.15));
    const key = new THREE.DirectionalLight(0xfffcf3, 2.5);
    key.position.set(-5, 8, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe5ecff, 1.3);
    rim.position.set(7, 2, -2);
    scene.add(rim);

    const object = new THREE.Group();
    const htmlObject = new THREE.Group();
    scene.add(object);
    htmlScene.add(htmlObject);
    const front = new THREE.Group();
    object.add(front);

    const metal = new THREE.MeshStandardMaterial({ color: 0xbfc4c2, metalness: .82, roughness: .43 });
    const paleMetal = new THREE.MeshStandardMaterial({ color: 0xcdd1cd, metalness: .72, roughness: .5 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x626b70, metalness: .72, roughness: .45 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xf8f7f1, metalness: .08, roughness: .86 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x153cdb, metalness: .08, roughness: .43 });
    const marking = new THREE.MeshStandardMaterial({ color: 0x868b89, metalness: .25, roughness: .65 });
    const accent = new THREE.MeshStandardMaterial({ color: GOAL_ACCENT[currentGoal], metalness: .12, roughness: .5 });

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

    // 8.2 × 6.56 outer proportions are precisely 5:4. The opening is shifted
    // up/right so that the lower and left borders have deliberate visual weight.
    const shape = new THREE.Shape();
    roundedRect(shape, -4.1, -3.28, 8.2, 6.56, .12);
    const hole = new THREE.Path();
    roundedRect(hole, -3.5, -2.8, 7.24, 5.8, .055);
    shape.holes.push(hole);
    const frameGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: .24, bevelEnabled: true, bevelThickness: .035,
      bevelSize: .035, bevelSegments: 3, steps: 1, curveSegments: 10,
    });
    const frame = new THREE.Mesh(frameGeometry, metal);
    frame.position.z = .1;
    front.add(frame);

    const makeBox = (w: number, h: number, d: number, mat: THREE.Material, radius = .04) =>
      new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat);

    const backPlate = makeBox(8.02, 6.4, .15, paleMetal, .07);
    backPlate.position.z = -.3;
    object.add(backPlate);
    const middlePlate = makeBox(8.08, 6.46, .1, darkMetal, .035);
    middlePlate.position.z = -.1;
    object.add(middlePlate);
    const faceBacking = makeBox(7.26, 5.82, .08, paper, .05);
    faceBacking.position.set(.12, .1, .275);
    front.add(faceBacking);

    // Fine physical details: the register scale, screw heads and one enamel bar.
    for (let i = 0; i < 31; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(.009, i % 5 === 0 ? .09 : .042, .007), marking);
      tick.position.set(-3.25 + i * .105, -3.063, .378);
      front.add(tick);
    }
    const enamel = makeBox(.56, .038, .015, accent, .006);
    enamel.position.set(2.82, -3.063, .383);
    front.add(enamel);
    for (const [x, y] of [[-3.85, 3.03], [-3.85, -3.03], [3.86, 3.03], [3.86, -3.03]]) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(.039, .039, .01, 16), marking);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, .378);
      front.add(screw);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(.039, .005, .004), paleMetal);
      slot.rotation.z = .4;
      slot.position.set(x, y, .385);
      front.add(slot);
    }

    const dialMount = new THREE.Mesh(new THREE.CylinderGeometry(.43, .43, .09, 64), darkMetal);
    dialMount.rotation.x = Math.PI / 2;
    dialMount.position.set(4.095, -1.96, .22);
    front.add(dialMount);
    const dial = new THREE.Group();
    dial.position.set(4.095, -1.96, .32);
    front.add(dial);
    const dialBody = new THREE.Mesh(new THREE.CylinderGeometry(.365, .385, .22, 80), blue);
    dialBody.rotation.x = Math.PI / 2;
    dial.add(dialBody);
    const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, .043, .17), blue, 56);
    const tooth = new THREE.Object3D();
    for (let i = 0; i < 56; i++) {
      const a = i / 56 * Math.PI * 2;
      tooth.position.set(Math.sin(a) * .372, Math.cos(a) * .372, 0);
      tooth.rotation.z = -a;
      tooth.updateMatrix();
      teeth.setMatrixAt(i, tooth.matrix);
    }
    dial.add(teeth);
    const dialInset = new THREE.Mesh(new THREE.CylinderGeometry(.278, .278, .009, 64), blue);
    dialInset.rotation.x = Math.PI / 2;
    dialInset.position.z = .117;
    dial.add(dialInset);
    const dialMarker = makeBox(.028, .09, .009, paper, .007);
    dialMarker.position.set(0, .21, .126);
    dial.add(dialMarker);

    // Hand-drawn maker's mark, placed on the substantial left edge.
    const makerPoints = [new THREE.Vector3(-3.98, .15, .38), new THREE.Vector3(-3.91, -.14, .38),
      new THREE.Vector3(-3.83, .04, .38), new THREE.Vector3(-3.75, -.14, .38), new THREE.Vector3(-3.68, .15, .38)];
    const maker = new THREE.Line(new THREE.BufferGeometry().setFromPoints(makerPoints),
      new THREE.LineBasicMaterial({ color: 0x777e7d, transparent: true, opacity: .8 }));
    front.add(maker);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const context = shadowCanvas.getContext('2d');
    let shadowTexture: THREE.CanvasTexture | undefined;
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 125);
      gradient.addColorStop(0, 'rgba(60,58,48,.32)');
      gradient.addColorStop(.35, 'rgba(60,58,48,.15)');
      gradient.addColorStop(1, 'rgba(60,58,48,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
      shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      cleanupTasks.push(() => shadowTexture?.dispose());
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(11, 5),
        new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .65 }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(.2, -3.65, -.4);
      scene.add(shadow);
    }

    const surface = document.createElement('div');
    surface.className = 'precision-css-surface';
    surface.style.width = '720px';
    surface.style.height = '576px';
    responsiveMode = false;
    syncDemoLayout();
    demoElement.style.width = '720px';
    demoElement.style.height = '576px';
    surface.append(demoElement);
    const cssObject = new CSS3DObject(surface);
    cssObject.scale.setScalar(.01);
    cssObject.position.set(.12, .1, .382);
    htmlObject.add(cssObject);

    let frameRequest = 0;
    let visible = true;
    let hidden = document.hidden;
    let alive = true;
    const knobState = { angle: GOAL_ANGLE[currentGoal] };
    cleanupTasks.push(() => {
      alive = false;
      if (frameRequest) cancelAnimationFrame(frameRequest);
      gsap.killTweensOf(knobState);
    });

    const render = () => {
      frameRequest = 0;
      if (!alive || !visible || hidden) return;
      renderer.render(scene, camera);
      cssRenderer.render(htmlScene, camera);
    };
    const requestRender = () => {
      if (alive && visible && !hidden && !frameRequest) frameRequest = window.requestAnimationFrame(render);
    };
    updateMode = (mode) => {
      // Explicit poses share the original geometry and HTML projection. No
      // scroll position can change the user's chosen interaction mode.
      const progress = mode === 'interactive' ? 1 : mode === 'layers' ? .5 : 0;
      const opening = Math.sin(Math.PI * ease(progress)) ** 2;
      const ending = ease((progress - .56) / .35);
      object.rotation.set(
        THREE.MathUtils.lerp(.035 + opening * .055, 0, ending),
        THREE.MathUtils.lerp(-.25 - opening * .4, 0, ending),
        THREE.MathUtils.lerp(-.024, 0, ending),
      );
      object.position.set(-.08 * (1 - ending), .06 + opening * .06, 0);
      object.scale.setScalar(1 - opening * .025);
      // Positive lateral offsets reinforce the projection of the negative
      // depth: each layer reveals a broad face to the right, away from the copy.
      backPlate.position.set(opening * .72, opening * .12, -.3 - opening * 1.65);
      middlePlate.position.set(opening * .36, opening * .06, -.1 - opening * .82);
      front.position.z = opening * .09;
      htmlObject.position.copy(object.position);
      htmlObject.rotation.copy(object.rotation);
      htmlObject.scale.copy(object.scale);
      cssObject.position.z = .382 + front.position.z;
      layerLegend.style.opacity = String(ease((progress - .19) / .13) * (1 - ease((progress - .66) / .14)));
      layerLegend.style.transform = `translateY(${(1 - opening) * 6}px)`;
      setDemoInteractive(mode === 'interactive');
      requestRender();
    };

    updateGoal = (goal) => {
      accent.color.set(GOAL_ACCENT[goal]);
      gsap.killTweensOf(knobState);
      gsap.to(knobState, {
        angle: GOAL_ANGLE[goal], duration: .65, ease: 'power2.out',
        onUpdate: () => { dial.rotation.z = knobState.angle; requestRender(); },
      });
    };
    dial.rotation.z = knobState.angle;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      // Fit both dimensions, with breathing room for the prominent side dial.
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const fitHeight = 7.65 / (2 * Math.tan(halfFov));
      const fitWidth = 9.7 / (2 * Math.tan(halfFov) * camera.aspect);
      camera.position.z = Math.max(fitHeight, fitWidth);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      cssRenderer.setSize(width, height);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(resize);
    cleanupTasks.push(() => resizeObserver.disconnect());
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) requestRender();
      else if (frameRequest) { cancelAnimationFrame(frameRequest); frameRequest = 0; }
    }, { rootMargin: '180px' });
    cleanupTasks.push(() => intersectionObserver.disconnect());
    intersectionObserver.observe(container);
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden && frameRequest) { cancelAnimationFrame(frameRequest); frameRequest = 0; }
      else requestRender();
    };
    document.addEventListener('visibilitychange', onVisibility);
    cleanupTasks.push(() => document.removeEventListener('visibilitychange', onVisibility));

    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (alive && !disposed) {
        webglUnavailable = true;
        switchMode();
      }
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    cleanupTasks.push(() => renderer.domElement.removeEventListener('webglcontextlost', onContextLost));
    resize();
    updateMode(currentMode);

    return cleanup;
  };

  const switchMode = () => {
    modeCleanup?.();
    modeCleanup = undefined;
    updateGoal = undefined;
    updateMode = undefined;
    container.classList.remove('precision-scene--static', 'precision-scene--mobile');
    if (webglUnavailable || mobileMedia.matches || motionMedia.matches) {
      modeCleanup = createStatic(mobileMedia.matches);
    } else {
      try {
        modeCleanup = createWebGL();
      } catch (error) {
        // No part of the demo is dependent on WebGL availability.
        modeCleanup?.();
        webglUnavailable = true;
        container.querySelectorAll('.precision-webgl, .precision-css3d').forEach((element) => element.remove());
        modeCleanup = createStatic(false);
        console.info('Webbyu: using the accessible static frame.', error);
      }
    }
    container.style.setProperty('--scene-goal-accent', GOAL_ACCENT[currentGoal]);
    container.style.setProperty('--scene-dial-angle', `${GOAL_ANGLE[currentGoal]}rad`);
  };
  const onModeChange = () => { if (!disposed) switchMode(); };
  mobileMedia.addEventListener('change', onModeChange);
  motionMedia.addEventListener('change', onModeChange);
  switchMode();

  return {
    setGoal(goal) {
      if (disposed) return;
      currentGoal = goal;
      container.dataset.goal = goal;
      container.style.setProperty('--scene-goal-accent', GOAL_ACCENT[goal]);
      container.style.setProperty('--scene-dial-angle', `${GOAL_ANGLE[goal]}rad`);
      syncDemoLayout();
      updateGoal?.(goal);
    },
    setMode(mode) {
      if (disposed) return;
      currentMode = mode;
      container.dataset.mode = mode;
      syncDemoLayout();
      updateMode?.(mode);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      modeCleanup?.();
      mobileMedia.removeEventListener('change', onModeChange);
      motionMedia.removeEventListener('change', onModeChange);
      container.classList.remove('precision-scene', 'precision-scene--static', 'precision-scene--mobile', 'precision-scene--interactive');
      container.style.removeProperty('--scene-goal-accent');
      container.style.removeProperty('--scene-dial-angle');
      delete container.dataset.goal;
      delete container.dataset.mode;
      for (const [demo, wasResponsive] of responsiveClasses) demo.classList.toggle('demo--responsive', wasResponsive);
      responsiveClasses.clear();
      demoElement.classList.toggle('demo--responsive', originallyResponsive);
      demoElement.inert = originalInert;
      if (originalStyle === null) demoElement.removeAttribute('style');
      else demoElement.setAttribute('style', originalStyle);
      if (originalParent) {
        if (originalNextSibling?.parentNode === originalParent) originalParent.insertBefore(demoElement, originalNextSibling);
        else originalParent.appendChild(demoElement);
      } else demoElement.remove();
    },
  };
}
