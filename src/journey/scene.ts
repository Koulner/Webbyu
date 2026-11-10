import { CanvasTexture, DataTexture, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, WebGLRenderer } from 'three';
import flower from '../assets/demos/saffron/flower.webp';
import { stations } from './data';
import type { LandscapeController } from './controller';

/**
 * Ein einziges Bild, das mit jeder Station weiter wächst: drei Kreise, Skizze, Ebenen, fünf fertige Websites und am Ende
 * alle Projekte zusammen mit einem leeren Rahmen für das nächste. Jede Station bringt ihren eigenen Übergang mit, abgeleitet
 * aus ihrem Inhalt (`TRANSITIONS`, `reveal` im Shader). Bewegung gibt es nur beim Weiterreisen; zwischen den Stationen
 * ruht das Bild.
 */
const IMAGES: Record<string, string> = {
  klarblick: 'package-demos/klarblick-concept.webp',
  'eiche-und-form': 'package-demos/eiche-fall14-breit.webp',
  'hof-und-flamme': 'package-demos/hof-concept.webp',
  raumgut: 'reference-assets/raumgut/hero.jpg',
};
const WIDTH = 3.2, HEIGHT = 2;
/** Position = Nummer des Übergangs im Shader. Eine Station, die hier fehlt, blendet schlicht über. */
export const TRANSITIONS = ['die-idee', 'das-fundament', 'klarblick', 'eiche-und-form', 'hof-und-flamme', 'safran-atelier', 'raumgut', 'der-naechste-abschnitt'];

type Paint = (context: CanvasRenderingContext2D, width: number, height: number) => void;
function drawn(detail: number, paint: Paint): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = detail; canvas.height = Math.round(detail * HEIGHT / WIDTH);
  const context = canvas.getContext('2d');
  if (context) paint(context, canvas.width, canvas.height);
  return new CanvasTexture(canvas);
}
/** Szenenmaße (Mitte 0, y nach oben) in Leinwandpunkte. */
const toCanvas = (width: number, height: number) => [(x: number) => (x / WIDTH + .5) * width, (y: number) => (.5 - y / HEIGHT) * height];

/** Übersicht: Inhalt, Gestaltung und Funktion als drei Kreise, die sich überschneiden. */
const overview: Paint = (context, width, height) => {
  const r = height * .2;
  context.lineWidth = Math.max(2, width * .003);
  ['#b8cead', '#b8c2d0', '#d5e79b'].forEach((color, i) => {
    const angle = Math.PI / 2 + i * Math.PI * 2 / 3;
    context.strokeStyle = color;
    context.beginPath();
    context.arc(width / 2 + Math.cos(angle) * r * .62, height / 2 - Math.sin(angle) * r * .62, r, 0, Math.PI * 2);
    context.stroke();
  });
};

/** Idee: eine Website als Skizze (Rahmen, Kopfzeile, Überschrift, Text, Bildfeld, Knopf). */
const idea: Paint = (context, width, height) => {
  const [px, py] = toCanvas(width, height), w = WIDTH * .46, h = HEIGHT * .45;
  const rect = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
  const lines = [
    ...rect(-w, -h, w, h), [-w, h - .2, w, h - .2],
    [-w + .2, .5, .05, .5], [-w + .2, .44, .05, .44], [-w + .2, .3, -.35, .3], [-w + .2, .24, -.35, .24],
    [-w + .2, .06, -.1, .06], [-w + .2, -.06, -.2, -.06], [-w + .2, -.18, -.15, -.18],
    ...rect(.25, -.6, w - .2, .5), [.25, -.6, w - .2, .5], [.25, .5, w - .2, -.6],
    ...rect(-w + .2, -.62, -.62, -.42),
  ];
  context.strokeStyle = '#d7ec91';
  context.lineWidth = Math.max(2, width * .0025);
  context.lineCap = 'round';
  context.beginPath();
  for (const [x0, y0, x1, y1] of lines) { context.moveTo(px(x0), py(y0)); context.lineTo(px(x1), py(y1)); }
  context.stroke();
};

/** Fundament: drei Ebenen für Inhalt, Gestaltung und Funktion. */
const foundation: Paint = (context, width, height) => {
  const [px, py] = toCanvas(width, height), half = 1.05, depth = .14, skew = .12;
  ['#c7dba8', '#a8c7bd', '#edf2e6'].forEach((color, layer) => {
    const x = (1 - layer) * .15, y = (layer - 1) * .55;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(px(x - half + skew), py(y + depth));
    context.lineTo(px(x + half + skew), py(y + depth));
    context.lineTo(px(x + half - skew), py(y - depth));
    context.lineTo(px(x - half - skew), py(y - depth));
    context.fill();
  });
};

/** Projektbild füllt die Fläche wie `object-fit: cover`. */
const cover = (image: HTMLImageElement): Paint => (context, width, height) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  context.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
};

/** Ende der Reise: alle Projekte nebeneinander und ein leerer Rahmen für das nächste. */
const collage = (images: HTMLImageElement[]): Paint => (context, width, height) => {
  const gap = width * .025, tileWidth = (width - gap * 2) / 3, tileHeight = (height - gap) / 2;
  const tile = (index: number) => [(index % 3) * (tileWidth + gap), Math.floor(index / 3) * (tileHeight + gap)];
  images.forEach((image, index) => {
    const [x, y] = tile(index), scale = Math.max(tileWidth / image.naturalWidth, tileHeight / image.naturalHeight);
    const sw = tileWidth / scale, sh = tileHeight / scale;
    context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, tileWidth, tileHeight);
  });
  const [x, y] = tile(5), line = Math.max(2, width * .003);
  context.strokeStyle = '#d7ec91';
  context.lineWidth = line;
  context.setLineDash([line * 5, line * 4]);
  context.strokeRect(x + line, y + line, tileWidth - line * 2, tileHeight - line * 2);
  context.fillStyle = '#e4eadd';
  context.font = `500 ${Math.round(tileHeight * .14)}px 'Instrument Sans', system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Ihr Projekt', x + tileWidth / 2, y + tileHeight / 2);
};

const vertex = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const fragment = `
  uniform sampler2D uTexA; uniform sampler2D uTexB; uniform float uT; uniform int uMode;
  varying vec2 vUv;
  float hash(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    float n = i.x + i.y * 57.;
    return mix(mix(hash(n), hash(n + 1.), f.x), mix(hash(n + 57.), hash(n + 58.), f.x), f.y);
  }
  // x: Fortschritt (0 bis 1), ab dem diese Stelle die neue Station zeigt. y: Breite der weichen Kante.
  // uv: x von links, y von unten.
  vec2 reveal(vec2 uv){
    // Idee: die Skizze entsteht von oben links, wie mit dem Stift gezogen.
    if (uMode == 0) return vec2((uv.x + 1. - uv.y) * .5, .06);
    // Fundament: Ebene für Ebene von unten nach oben.
    if (uMode == 1) { float band = floor(uv.y * 3.); return vec2((band + fract(uv.y * 3.) * .35) / 2.35, .03); }
    // Klarblick: ein gerader Zug mit dem Abzieher von oben nach unten, die Kante bleibt scharf.
    if (uMode == 2) return vec2((1. - uv.y) * .94 + uv.x * .06, .006);
    // Eiche & Form: ein Hobelzug von links, die Kante folgt der Maserung.
    if (uMode == 3) return vec2(uv.x * .82 + noise(vec2(uv.x * 4., uv.y * 120.)) * .18, .03);
    // Hof & Flamme: das Bild breitet sich von einer Flamme unten in der Mitte aus.
    if (uMode == 4) return vec2(distance(uv * vec2(1.6, 1.), vec2(.8, .1)) / 1.2, .1);
    // Safran Atelier: Faden für Faden von oben.
    if (uMode == 5) return vec2((1. - uv.y) * .72 + hash(floor(uv.x * 48.)) * .28, .08);
    // Der nächste Abschnitt: ein Projekt nach dem anderen, zuletzt der leere Rahmen.
    if (uMode == 7) return vec2((floor(uv.x * 3.) + (uv.y > .5 ? 0. : 3.)) / 6., .05);
    // Raumgut und alle übrigen: das ganze Bild zugleich.
    return vec2(.5, .5);
  }
  vec4 blurred(vec2 uv, float radius){
    vec4 sum = texture2D(uTexB, uv) * .2;
    for (int i = 0; i < 8; i++) { float a = float(i) * .785398; sum += texture2D(uTexB, uv + vec2(cos(a), sin(a) * 1.6) * radius) * .1; }
    return sum;
  }
  void main(){
    vec2 m = reveal(vUv);
    float k = smoothstep(m.x - m.y, m.x + m.y, uT * (1. + 2. * m.y) - m.y);
    vec4 a = texture2D(uTexA, vUv);
    // Raumgut: aus dem unscharfen Sortiment wird die eigene Auswahl scharf.
    vec4 b = uMode == 6 ? blurred(vUv, (1. - k) * .025) : texture2D(uTexB, vUv);
    float alpha = mix(a.a, b.a, k);
    if (alpha < .01) discard;
    vec3 color = (a.rgb * a.a * (1. - k) + b.rgb * b.a * k) / alpha;
    // Hof & Flamme: am Rand des Lichts ein warmer Schein.
    if (uMode == 4) color = mix(color, vec3(1., .66, .34), (1. - abs(k * 2. - 1.)) * .45);
    gl_FragColor = vec4(color, alpha);
  }`;

export function initLandscape(container: HTMLElement): LandscapeController {
  const host = container.querySelector<HTMLElement>('.journey-webgl')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // shortcut: Bildauflösung wird beim Start festgelegt; ein späterer Wechsel über 760 px behält sie bis zum Neuladen.
  const compact = container.clientWidth < 760;
  const detail = compact ? 900 : 1600;
  const ratio = Math.min(devicePixelRatio, 1.5);
  const disposers: (() => void)[] = [];
  let renderer: WebGLRenderer | undefined;
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, current = -1, target = -1, halfWidth = 4, halfHeight = 2.2;
  // Ein Sprung über mehrere Stationen wechselt nur einmal: von der sichtbaren Station (leap) direkt zur Zielstation.
  let pairA: Texture | undefined, pairB: Texture | undefined, leap: number | undefined, leapAt = 0, leapForward = true;

  const start = drawn(detail, overview);
  // Projektbilder kommen nach dem Laden hinzu; bis dahin bleibt ihre Station leer.
  const shapes: (Texture | undefined)[] = stations.map(station => station.id === 'die-idee' ? drawn(detail, idea) : station.id === 'das-fundament' ? drawn(detail, foundation) : undefined);
  const shapeAt = (index: number) => index < 0 ? start : shapes[Math.min(index, shapes.length - 1)];
  const modeAt = (index: number) => TRANSITIONS.indexOf(stations[Math.max(0, Math.min(index, stations.length - 1))].id);
  const blank = new DataTexture(new Uint8Array(4), 1, 1);
  blank.needsUpdate = true;

  const progress = { value: 0 };
  const uniforms = { uT: progress, uTexA: { value: blank as Texture }, uTexB: { value: blank as Texture }, uMode: { value: 0 } };
  const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false });
  const planeGeometry = new PlaneGeometry(WIDTH, HEIGHT);
  const piece = new Mesh(planeGeometry, material);

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const dispose of disposers.reverse()) dispose();
    for (const value of [planeGeometry, material, blank, start]) value.dispose();
    shapes.forEach(shape => shape?.dispose());
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

  const loaded = new Map<number, HTMLImageElement>();
  const sources = stations.map(station => station.id === 'safran-atelier' ? flower : IMAGES[station.id] && `${import.meta.env.BASE_URL}${IMAGES[station.id]}`);
  const expected = sources.filter(Boolean).length;
  sources.forEach((source, i) => {
    if (!source) return;
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      shapes[i] = drawn(detail, cover(image));
      loaded.set(i, image);
      if (loaded.size === expected) shapes[stations.length - 1] = drawn(detail, collage([...loaded.keys()].sort((a, b) => a - b).map(key => loaded.get(key)!)));
      invalidate();
    };
    image.src = source;
  });

  function setPair(from: number) {
    if (leap !== undefined && from !== leapAt) leap = undefined;
    const back = leap !== undefined && !leapForward;
    const a = leap !== undefined && leapForward ? shapeAt(leap) : shapeAt(from), b = back ? shapeAt(leap!) : shapeAt(from + 1);
    // Rückwärts läuft der Übergang der Station, die man verlässt.
    uniforms.uMode.value = modeAt(back ? leap! : from + 1);
    if (a === pairA && b === pairB) return;
    pairA = a; pairB = b;
    uniforms.uTexA.value = a ?? blank;
    uniforms.uTexB.value = b ?? blank;
  }
  const visibleStation = () => leap !== undefined && (progress.value < .5) === leapForward ? leap : Math.round(current);

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    gpu.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfWidth = halfHeight * camera.aspect;
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
    piece.scale.setScalar(compact ? Math.min(1, (halfWidth * 1.8) / WIDTH) : 1);
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
      else if (Math.abs(target - current) > 1) {
        leap = visibleStation();
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
