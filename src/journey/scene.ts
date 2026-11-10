import { BufferAttribute, BufferGeometry, CanvasTexture, DataTexture, Group, Mesh, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial, Texture, WebGLRenderer } from 'three';
import flower from '../assets/demos/saffron/flower.webp';
import { stations } from './data';
import type { LandscapeController } from './controller';

/**
 * Ein einziges Element, das mit jeder Station weiter wächst: Glutball, Skizze, Ebenen, fünf fertige Websites und
 * am Ende alle Projekte zusammen mit einem leeren Rahmen für das nächste. Beim Weiterreisen verglüht es von unten nach
 * oben zu Funken und setzt sich zur nächsten Form zusammen. Bewegung gibt es nur beim Weiterreisen; zwischen den Stationen
 * ruht das Element.
 */
const IMAGES: Record<string, string> = {
  klarblick: 'package-demos/klarblick-concept.webp',
  'eiche-und-form': 'package-demos/eiche-fall14-breit.webp',
  'hof-und-flamme': 'package-demos/hof-concept.webp',
  raumgut: 'reference-assets/raumgut/hero.jpg',
};
const WIDTH = 3.2, HEIGHT = 2;
/** `soft`: die Form besteht in Ruhe aus Funken (Glutball, Ebenen); sonst zeigt eine scharfe Bildfläche das Projekt. */
type Shape = { position: Float32Array; color: Float32Array; soft: number; texture?: Texture };

/** Glutball: dichter, heißer Kern, nach außen dünner und röter. */
function emberBall(count: number): Shape {
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), r = Math.pow(Math.random(), 2.2) * .8;
    position.set([Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r, Math.sin(b) * Math.sin(a) * r], i * 3);
    const heat = 1 - r / .8;
    color.set([1, .4 + heat * .5, .1 + heat * .6], i * 3);
  }
  return { position, color, soft: 1 };
}

/** Idee: eine Website als Skizze aus Funkenlinien (Rahmen, Kopfzeile, Überschrift, Text, Bildfeld, Knopf). */
function sketch(count: number): Shape {
  const w = WIDTH * .46, h = HEIGHT * .45;
  const rect = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
  const lines = [
    ...rect(-w, -h, w, h), [-w, h - .2, w, h - .2],
    [-w + .2, .5, .05, .5], [-w + .2, .44, .05, .44], [-w + .2, .3, -.35, .3], [-w + .2, .24, -.35, .24],
    [-w + .2, .06, -.1, .06], [-w + .2, -.06, -.2, -.06], [-w + .2, -.18, -.15, -.18],
    ...rect(.25, -.6, w - .2, .5), [.25, -.6, w - .2, .5], [.25, .5, w - .2, -.6],
    ...rect(-w + .2, -.62, -.62, -.42),
  ];
  const lengths = lines.map(([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let pick = Math.random() * total, k = 0;
    while (pick > lengths[k] && k < lines.length - 1) pick -= lengths[k++];
    const [x0, y0, x1, y1] = lines[k], t = pick / lengths[k], jitter = () => (Math.random() - .5) * .012;
    position.set([x0 + (x1 - x0) * t + jitter(), y0 + (y1 - y0) * t + jitter(), jitter()], i * 3);
    const warm = Math.random();
    color.set([1, .62 + warm * .25, .28 + warm * .3], i * 3);
  }
  return { position, color, soft: 1 };
}

/** Fundament: drei Ebenen für Inhalt, Gestaltung und Funktion. */
function layers(count: number): Shape {
  const position = new Float32Array(count * 3), color = new Float32Array(count * 3);
  const tones = [[.78, .86, .66], [.66, .78, .74], [.93, .95, .9]];
  for (let i = 0; i < count; i++) {
    const layer = i % 3, x = (Math.random() - .5) * WIDTH * .8, z = (Math.random() - .5) * 1.2;
    position.set([x - layer * .18, (layer - 1) * .55, z], i * 3);
    color.set(tones[layer], i * 3);
  }
  return { position, color, soft: 1 };
}

/** Bild: scharfe Textur für die Ruhe, ein Punktraster derselben Ansicht für das Verglühen. */
function picture(image: HTMLImageElement | HTMLCanvasElement, cols: number, rows: number, detail: number): Shape {
  const sourceWidth = 'naturalWidth' in image ? image.naturalWidth : image.width, sourceHeight = 'naturalHeight' in image ? image.naturalHeight : image.height;
  const sharp = document.createElement('canvas');
  sharp.width = detail; sharp.height = Math.round(detail * HEIGHT / WIDTH);
  const scale = Math.max(sharp.width / sourceWidth, sharp.height / sourceHeight);
  sharp.getContext('2d')!.drawImage(image, (sharp.width - sourceWidth * scale) / 2, (sharp.height - sourceHeight * scale) / 2, sourceWidth * scale, sourceHeight * scale);
  const small = document.createElement('canvas');
  small.width = cols; small.height = rows;
  const context = small.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(sharp, 0, 0, cols, rows);
  const pixels = context.getImageData(0, 0, cols, rows).data;
  const position = new Float32Array(cols * rows * 3), color = new Float32Array(cols * rows * 3);
  for (let i = 0; i < cols * rows; i++) {
    const x = i % cols, y = Math.floor(i / cols);
    // Durchsichtige Stellen (Lücken der Collage) verglühen als schwache Glut statt als schwarze Punkte.
    const alpha = pixels[i * 4 + 3] / 255;
    const r = pixels[i * 4] / 255 * alpha + (1 - alpha) * .5, g = pixels[i * 4 + 1] / 255 * alpha + (1 - alpha) * .22, b = pixels[i * 4 + 2] / 255 * alpha + (1 - alpha) * .08;
    position.set([(x / (cols - 1) - .5) * WIDTH, (.5 - y / (rows - 1)) * HEIGHT, 0], i * 3);
    color.set([r, g, b], i * 3);
  }
  return { position, color, soft: 0, texture: new CanvasTexture(sharp) };
}

/** Ende der Reise: alle Projekte nebeneinander und ein glimmender leerer Rahmen für das nächste. */
function collage(images: HTMLImageElement[], detail: number) {
  const canvas = document.createElement('canvas');
  canvas.width = detail; canvas.height = Math.round(detail * HEIGHT / WIDTH);
  const context = canvas.getContext('2d')!;
  const gap = canvas.width * .025, tileWidth = (canvas.width - gap * 2) / 3, tileHeight = (canvas.height - gap) / 2;
  const tile = (index: number) => [(index % 3) * (tileWidth + gap), Math.floor(index / 3) * (tileHeight + gap)];
  images.forEach((image, index) => {
    const [x, y] = tile(index), scale = Math.max(tileWidth / image.naturalWidth, tileHeight / image.naturalHeight);
    const sw = tileWidth / scale, sh = tileHeight / scale;
    context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, tileWidth, tileHeight);
  });
  const [x, y] = tile(5), line = Math.max(2, canvas.width * .003);
  context.strokeStyle = '#ffb35c';
  context.lineWidth = line;
  context.setLineDash([line * 5, line * 4]);
  context.strokeRect(x + line, y + line, tileWidth - line * 2, tileHeight - line * 2);
  context.fillStyle = '#ffd59a';
  context.font = `500 ${Math.round(tileHeight * .14)}px 'Instrument Sans', system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Ihr Projekt', x + tileWidth / 2, y + tileHeight / 2);
  return canvas;
}

// Verzögerung je Rasterzelle: Funken und Bildfläche verglühen an derselben Stelle zur selben Zeit.
const burnTiming = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float burnAt(vec2 cell, vec2 grid, float progress){
    float y = (.5 - cell.y / (grid.y - 1.)) * ${HEIGHT.toFixed(1)};
    float delay = clamp((y + 1.) * .25, 0., .45) + hash(cell) * .15;
    return clamp((progress - delay) / .4, 0., 1.);
  }`;

const emberVertex = `
  attribute vec3 positionB; attribute vec3 colorA; attribute vec3 colorB; attribute vec2 cell;
  uniform float uT; uniform float uSize; uniform float uSoftA; uniform float uSoftB; uniform vec2 uGrid;
  varying vec3 vColor; varying float vBurn; varying float vSoft; varying float vVisible;
  ${burnTiming}
  void main(){
    float seed = hash(cell);
    float t = burnAt(cell, uGrid, uT);
    float burn = sin(t * 3.14159);
    // Die Flugbahn hängt nur vom Fortschritt ab: Zurückscrollen zeigt dasselbe Bild.
    vec3 drift = vec3(sin(seed * 41. + position.y * 3.), 1.6 + seed, cos(seed * 23.)) * burn * (.35 + seed * .5);
    vec3 p = mix(position, positionB, t * t * (3. - 2. * t)) + drift;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    vSoft = t < .5 ? uSoftA : uSoftB;
    gl_PointSize = uSize * (1. + burn * 1.6) * (1. + vSoft * .8) * (7.5 / -mv.z);
    // Funken leuchten in den Farben der jeweiligen Vorschau, mit einem Rest warmer Glut.
    vec3 base = mix(colorA, colorB, t);
    vec3 glow = mix(base / max(max(base.r, base.g), max(base.b, .2)), vec3(1., .55 + seed * .2, .2), .22);
    vColor = mix(base, glow, pow(burn, .7));
    vBurn = burn;
    // In Ruhe zeigt bei Bildern die scharfe Fläche das Projekt; die Funken sind dann unsichtbar.
    vVisible = t <= 0. ? uSoftA : (t >= 1. ? uSoftB : 1.);
  }`;
const emberFragment = `
  varying vec3 vColor; varying float vBurn; varying float vSoft; varying float vVisible;
  void main(){
    if (vVisible < .01) discard;
    float alpha = mix(1., smoothstep(.5, .0, length(gl_PointCoord - .5)), max(vBurn, vSoft)) * vVisible;
    if (alpha < .02) discard;
    gl_FragColor = vec4(vColor * (1. + vBurn * .6), alpha);
  }`;

const pictureVertex = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const pictureFragment = `
  uniform sampler2D uTexA; uniform sampler2D uTexB; uniform float uHasA; uniform float uHasB; uniform float uT; uniform vec2 uGrid;
  varying vec2 vUv;
  ${burnTiming}
  void main(){
    vec2 cell = min(floor(vec2(vUv.x, 1. - vUv.y) * uGrid), uGrid - 1.);
    float t = burnAt(cell, uGrid, uT);
    vec4 color;
    if (t <= 0.) color = texture2D(uTexA, vUv) * uHasA;
    else if (t >= 1.) color = texture2D(uTexB, vUv) * uHasB;
    else discard;
    // Kurz bevor eine Stelle verglüht, glimmt sie auf.
    float ember = t <= 0. ? clamp(1. - (burnAt(cell, uGrid, uT + .05) * 8.), 0., 1.) : 1.;
    color.rgb = mix(color.rgb, vec3(1., .6, .25), (1. - ember) * .85 * step(.0001, uT));
    if (color.a < .01) discard;
    gl_FragColor = color;
  }`;


export function initLandscape(container: HTMLElement): LandscapeController {
  const host = container.querySelector<HTMLElement>('.journey-webgl')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // shortcut: Punktzahl wird beim Start festgelegt; ein späterer Wechsel über 760 px behält sie bis zum Neuladen.
  const compact = container.clientWidth < 760;
  const cols = compact ? 160 : 256, rows = Math.round(cols * HEIGHT / WIDTH), count = cols * rows;
  const ratio = Math.min(devicePixelRatio, 1.5);
  const disposers: (() => void)[] = [];
  let renderer: WebGLRenderer | undefined;
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, current = -1, target = -1, halfWidth = 4, halfHeight = 2.2, pixelsPerUnit = 200;
  // Ein Sprung über mehrere Stationen verglüht nur einmal: von der sichtbaren Form (leap) direkt zur Zielform.
  let pairA: Shape | undefined, pairB: Shape | undefined, leap: Shape | undefined, leapAt = 0, leapForward = true;

  const ball = emberBall(count), idea = sketch(count), base = layers(count);
  const shapes: Shape[] = stations.map(station => station.id === 'die-idee' ? idea : station.id === 'das-fundament' ? base : ball);
  const shapeAt = (index: number) => index < 0 ? ball : shapes[Math.min(index, shapes.length - 1)];
  const blank = new DataTexture(new Uint8Array(4), 1, 1);
  blank.needsUpdate = true;

  const geometry = new BufferGeometry();
  const cells = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) cells.set([i % cols, Math.floor(i / cols)], i * 2);
  geometry.setAttribute('position', new BufferAttribute(ball.position.slice(), 3));
  geometry.setAttribute('positionB', new BufferAttribute(ball.position.slice(), 3));
  geometry.setAttribute('colorA', new BufferAttribute(ball.color.slice(), 3));
  geometry.setAttribute('colorB', new BufferAttribute(ball.color.slice(), 3));
  geometry.setAttribute('cell', new BufferAttribute(cells, 2));
  const grid = { value: [cols, rows] };
  const progress = { value: 0 };
  const uniforms = { uT: progress, uGrid: grid, uSize: { value: 4 }, uSoftA: { value: 1 }, uSoftB: { value: 1 } };
  const material = new ShaderMaterial({ uniforms, vertexShader: emberVertex, fragmentShader: emberFragment, transparent: true, depthWrite: false });
  const embers = new Points(geometry, material);
  embers.renderOrder = 1;
  const planeGeometry = new PlaneGeometry(WIDTH, HEIGHT);
  const pictureUniforms = { uT: progress, uGrid: grid, uTexA: { value: blank as Texture }, uTexB: { value: blank as Texture }, uHasA: { value: 0 }, uHasB: { value: 0 } };
  const pictureMaterial = new ShaderMaterial({ uniforms: pictureUniforms, vertexShader: pictureVertex, fragmentShader: pictureFragment, transparent: true, depthWrite: false });
  const plane = new Mesh(planeGeometry, pictureMaterial);
  const piece = new Group();
  piece.add(plane, embers);

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const dispose of disposers.reverse()) dispose();
    for (const value of [geometry, material, planeGeometry, pictureMaterial, blank]) value.dispose();
    shapes.forEach(shape => shape.texture?.dispose());
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
    delete container.dataset.render;
  }
  function fallback() {
    cleanup();
    container.dataset.render = 'static';
  }

  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(ratio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.append(renderer.domElement);
  } catch {
    fallback();
    return { setProgress() {}, setEnabled() {}, dispose: cleanup };
  }
  const gpu = renderer;
  const contextLost = (event: Event) => { event.preventDefault(); fallback(); };
  gpu.domElement.addEventListener('webglcontextlost', contextLost);
  disposers.push(() => gpu.domElement.removeEventListener('webglcontextlost', contextLost));

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, 0, 7.5);
  scene.add(piece);
  container.dataset.render = 'material';

  // Bilder der Projekte nachladen; bis dahin zeigt die Station den Glutball. Sind alle da, entsteht die Collage für das Ende.
  const detail = compact ? 900 : 1600;
  const loaded = new Map<number, HTMLImageElement>();
  const sources = stations.map(station => station.id === 'safran-atelier' ? flower : IMAGES[station.id] && `${import.meta.env.BASE_URL}${IMAGES[station.id]}`);
  const expected = sources.filter(Boolean).length;
  sources.forEach((source, i) => {
    if (!source) return;
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      shapes[i] = picture(image, cols, rows, detail);
      loaded.set(i, image);
      if (loaded.size === expected) shapes[stations.length - 1] = picture(collage([...loaded.keys()].sort((a, b) => a - b).map(key => loaded.get(key)!), detail), cols, rows, detail);
      invalidate();
    };
    image.src = source;
  });

  function setPair(from: number) {
    if (leap && from !== leapAt) leap = undefined;
    const a = leap && leapForward ? leap : shapeAt(from), b = leap && !leapForward ? leap : shapeAt(from + 1);
    if (a === pairA && b === pairB) return;
    pairA = a; pairB = b;
    for (const [name, data] of [['position', a.position], ['positionB', b.position], ['colorA', a.color], ['colorB', b.color]] as const) {
      const attribute = geometry.getAttribute(name) as BufferAttribute;
      (attribute.array as Float32Array).set(data);
      attribute.needsUpdate = true;
    }
    uniforms.uSoftA.value = a.soft;
    uniforms.uSoftB.value = b.soft;
    pictureUniforms.uTexA.value = a.texture ?? blank;
    pictureUniforms.uTexB.value = b.texture ?? blank;
    pictureUniforms.uHasA.value = a.texture ? 1 : 0;
    pictureUniforms.uHasB.value = b.texture ? 1 : 0;
  }

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    gpu.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfWidth = halfHeight * camera.aspect;
    pixelsPerUnit = height / (halfHeight * 2);
    invalidate();
  }

  function render(time: number) {
    frame = 0;
    if (disposed || !enabled || !visible || document.hidden) return;
    const step = lastTime ? Math.min(.05, (time - lastTime) / 1000) : .016;
    lastTime = time;
    current = reduced.matches ? target : current + (target - current) * Math.min(1, step * 2.6);
    if (Math.abs(target - current) < .002) { current = target; leap = undefined; }
    const from = Math.floor(current);
    setPair(from);
    progress.value = current - from;
    const scale = compact ? Math.min(1, (halfWidth * 1.8) / WIDTH) : 1;
    uniforms.uSize.value = Math.max(2 * ratio, (WIDTH / cols) * pixelsPerUnit * scale * ratio * 1.15);
    piece.scale.setScalar(scale);
    piece.position.set(compact ? 0 : halfWidth * .28, compact ? halfHeight * .34 : 0, 0);
    piece.rotation.set(-.08, compact ? 0 : -.22, 0);
    try { gpu.render(scene, camera); } catch { fallback(); return; }
    if (current !== target) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function invalidate() {
    if (!frame && !disposed && enabled && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  disposers.push(() => resizeObserver.disconnect());
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); invalidate(); });
  visibilityObserver.observe(container);
  disposers.push(() => visibilityObserver.disconnect());
  document.addEventListener('visibilitychange', invalidate);
  disposers.push(() => document.removeEventListener('visibilitychange', invalidate));
  reduced.addEventListener?.('change', invalidate);
  disposers.push(() => reduced.removeEventListener?.('change', invalidate));
  resize();

  return {
    setProgress(value, immediate = false) {
      target = Math.min(stations.length - 1, Math.max(-1, Number.isFinite(value) ? value : -1));
      if (immediate) { current = target; leap = undefined; }
      else if (pairA && pairB && Math.abs(target - current) > 1) {
        leap = progress.value < .5 ? pairA : pairB;
        leapForward = target > current;
        leapAt = leapForward ? Math.floor(target) - 1 : Math.ceil(target);
        current = leapForward ? leapAt : leapAt + .999;
      }
      invalidate();
    },
    setEnabled(value) {
      enabled = value;
      if (!enabled) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTime = 0; invalidate(); }
    },
    dispose: cleanup,
  };
}
