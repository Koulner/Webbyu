import { IcosahedronGeometry, Mesh, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { stations } from './data';
import type { LandscapeController } from './controller';

/**
 * Eine graue, formlose Masse, die sich mit jeder Station verwandelt. Ein einziges Netz: Der Vertex-Shader bildet die
 * Kugelrichtung auf Gestalt A und B ab und mischt beide entlang einer Front, die aus dem Inhalt der Zielstation kommt
 * (Abzieher von oben, Hobel von links, Wärme von unten). Unterwegs wird die Masse kurz flüssig. Alles Bewegte ist eine
 * Funktion des gedämpften Fortschritts; zwischen den Stationen ruht das Bild und es wird nicht gerendert.
 */
/** Gestalt je Station. Fehlt eine Station, bleibt sie die formlose Masse (0). */
export const FORMS: Record<string, number> = { klarblick: 1, 'eiche-und-form': 2, 'hof-und-flamme': 3 };
/** Kamera je Position (Übersicht, dann Stationen): Azimut und Höhe in Grad, Abstand relativ. */
const POSES: [number, number, number][] = [
  [28, 14, 1.1], [52, 22, 1.05], [14, 34, 1.08],
  [6, 3, 1], [38, 27, 1.02], [-18, -7, 1.12],
  [40, 30, 1.1], [-30, 40, 1.1], [0, 8, .98],
];
/** Größter Radius der Gestalten, danach richtet sich der Kameraabstand. */
const EXTENT = 1.35;

const noise = `
  // Simplex-Rauschen 3D, Stefan Gustavson / Ashima Arts (MIT).
  vec3 mod289(vec3 x){ return x - floor(x * (1. / 289.)) * 289.; }
  vec4 mod289(vec4 x){ return x - floor(x * (1. / 289.)) * 289.; }
  vec4 permute(vec4 x){ return mod289(((x * 34.) + 10.) * x); }
  float snoise(vec3 v){
    const vec2 C = vec2(1. / 6., 1. / 3.);
    vec3 i = floor(v + dot(v, C.yyy)), x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz), l = 1. - g, i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - .5;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0., i1.z, i2.z, 1.)) + i.y + vec4(0., i1.y, i2.y, 1.)) + i.x + vec4(0., i1.x, i2.x, 1.));
    vec4 j = p - 49. * floor(p * (1. / 49.));
    vec4 x_ = floor(j * (1. / 7.)), y_ = floor(j - 7. * x_);
    vec4 x = (x_ * 2. + .5) / 7. - 1., y = (y_ * 2. + .5) / 7. - 1., h = 1. - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw), s0 = floor(b0) * 2. + 1., s1 = floor(b1) * 2. + 1., sh = -step(h, vec4(0.));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
    vec4 norm = 1.79284291400159 - .85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.);
    m = m * m;
    return 105. * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }`;

const vertex = `
  uniform float uT; uniform int uFormA; uniform int uFormB; uniform float uSeedA; uniform float uSeedB;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vCav;
  ${noise}
  float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
  // Klarblick: eine ebene, klare Scheibe mit gerundeten Ecken. Ein Band um den Äquator wird zur runden Kante,
  // damit die Kante genug Punkte bekommt; der Rest der Kugel wird zur exakt ebenen Fläche.
  vec3 pane(vec3 d){
    const float c = .07, band = .38, quarter = 1.5707963;
    float rho = length(d.xy), lat = abs(asin(clamp(d.z, -1., 1.)));
    vec2 u = d.xy / max(rho, 1e-5), a = abs(u) / vec2(1.22, .86) + 1e-5;
    float edge = pow(pow(a.x, 14.) + pow(a.y, 14.), -1. / 14.), rim = min(lat / band, 1.) * quarter;
    float radial = lat > band ? (edge - c) * (1. - (lat - band) / (quarter - band)) : edge - c + c * cos(rim);
    return vec3(u * radial, sign(d.z) * c * sin(rim));
  }
  // Eiche & Form: ein exakter Korpus, die Oberkante folgt einer schiefen Linie.
  vec3 cabinet(vec3 d){
    vec3 a = abs(d) / vec3(1., .86, .48) + 1e-5;
    float r = pow(pow(a.x, 16.) + pow(a.y, 16.) + pow(a.z, 16.), -1. / 16.);
    float slope = d.y + .46 * d.x;
    if (slope > 0.) r = smin(r, .6 / slope, .02);
    return d * r;
  }
  // Hof & Flamme: ein Tropfen, der nach oben in drei gedrehte Zungen ausläuft und leicht zur Seite schwingt.
  vec3 flame(vec3 d){
    float c = d.y, s = sqrt(max(0., (1. - c) * .5)), k = smoothstep(-.4, 1., c);
    vec2 e = d.xz / max(length(d.xz), 1e-4);
    float a = c * 1.7 + .5, c3 = 4. * e.x * e.x * e.x - 3. * e.x, s3 = 3. * e.y - 4. * e.y * e.y * e.y;
    float tongue = c3 * cos(a) - s3 * sin(a);
    vec2 xz = d.xz * 1.02 * pow(s, 1.8) * (1. + .85 * k * tongue);
    xz.x += .12 * k * k * sin(c * 2.4 + 1.);
    float y = c * 1.25 - .05 + .5 * k * k * tongue * smoothstep(0., .22, s) + .05 * snoise(d * 2.1 + 3.);
    return vec3(xz.x, y, xz.y);
  }
  // xyz Lage auf der Gestalt, w Mulde (nur Masse) für die Schattierung.
  vec4 form(int id, vec3 d, float seed){
    vec4 r = vec4(0.);
    if (id == 1) r = vec4(pane(d), 0.);
    else if (id == 2) r = vec4(cabinet(d), 0.);
    else if (id == 3) r = vec4(flame(d), 0.);
    else {
      float n = .24 * snoise(d * .62 + seed * vec3(7.13, 3.71, 5.29)) + .045 * snoise(d * 1.3 - seed * vec3(2.9, 6.1, 4.3));
      r = vec4(d * (1. + n) * vec3(1.06, .95, 1.), n);
    }
    return r;
  }
  // Wann sich diese Stelle verwandelt (x, 0 bis 1) und wie weich die Front ist (y). Die Front gehört zur Gestalt B.
  vec2 front(vec3 d){
    if (uFormB == 1) return vec2((1. - d.y) * .5, .045);
    if (uFormB == 2) return vec2((d.x + 1.) * .5 + d.y * .05, .035);
    if (uFormB == 3) return vec2((d.y + 1.) * .5 + .12 * snoise(d * 2.3 + 11.), .3);
    // Formlose Masse: sanft in großen Flecken, jede Station mit eigenem Rauschen.
    return vec2(.5 + .32 * snoise(d * .8 + uSeedB * 1.7), .6);
  }
  vec3 surface(vec3 d, out float w, out float act, out float cav){
    vec2 f = front(d);
    f.x = clamp(f.x, 0., 1.);
    float x = (uT * (1. + f.y) - f.x) / f.y, travel = sin(3.14159265 * uT);
    w = smoothstep(0., 1., x);
    act = 4. * w * (1. - w);
    vec4 a = uT < 1. ? form(uFormA, d, uSeedA) : vec4(0.), b = uT > 0. ? form(uFormB, d, uSeedB) : vec4(0.);
    vec4 s = mix(a, b, w);
    cav = s.w;
    if (travel < .001) return s.xyz;
    // Unterwegs wird die Masse flüssig, am stärksten an der Front; wo die Front vorbei ist, setzt sie sich.
    float flow = (.06 * travel * (1. - w) + .07 * act) * snoise(d * 1.7 + vec3(0., -uT * 2.6, uT * 1.2) + uSeedB);
    // Abstand vor der Front, in Einheiten der Frontkoordinate.
    float ahead = f.x - (uT * (1. + f.y) - f.y * .5), pile = (ahead - .05) / .045, chip = (ahead + .02) / .03;
    vec3 p = s.xyz + d * flow;
    // Klarblick: vor dem Abzieher staut sich die Masse wie Wasser.
    if (uFormB == 1) p += d * .2 * travel * exp(-pile * pile);
    // Eiche & Form: hinter dem Hobel hebt sich ein Span.
    if (uFormB == 2) p += vec3(-.3, 1., 0.) * .16 * travel * exp(-chip * chip) * smoothstep(.1, .7, d.y);
    // Hof & Flamme: die Wärme dehnt die Masse und hebt sie an.
    if (uFormB == 3) p += (d * .08 + vec3(0., .14, 0.)) * act;
    return p;
  }
  void main(){
    vec3 d = normalize(position);
    vec3 t1 = normalize(cross(d, abs(d.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), t2 = cross(d, t1);
    float w, act, cav, w1, a1, c1;
    vec3 p = surface(d, w, act, cav);
    vec3 p1 = surface(normalize(d + t1 * .006), w1, a1, c1), p2 = surface(normalize(d + t2 * .006), w1, a1, c1);
    vNormal = normalize(cross(p1 - p, p2 - p));
    vPos = p; vW = w; vAct = act; vCav = cav;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;

const fragment = `
  uniform int uFormA; uniform int uFormB;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vCav;
  ${noise}
  const vec3 KEY = vec3(-.5, .72, .48);
  vec3 N, V, R; float NL, NV, FR;
  // Studio ohne Bild: dunkler Petrolboden, heller Himmel, ein weiches Lichtfeld oben links.
  vec3 env(vec3 r){
    vec3 c = mix(vec3(.012, .03, .035), vec3(.3, .38, .38), smoothstep(-.25, .7, r.y));
    return c + vec3(2.2, 2.1, 1.9) * smoothstep(.82, .97, dot(r, normalize(vec3(-.5, .72, .48))));
  }
  float spec(float power){ return pow(max(dot(N, normalize(normalize(KEY) + V)), 0.), power); }
  vec3 shade(int id){
    vec3 key = vec3(1.25, 1.18, 1.05) * max(NL, 0.), sky = mix(vec3(.04, .08, .085), vec3(.3, .36, .36), N.y * .5 + .5), c = vec3(0.);
    if (id == 1) {
      // Glas: fast nur Spiegelung, zwei schräge Glanzstreifen, die mit dem Blick wandern; grünliche Kante.
      float band = vPos.x * .55 + vPos.y * .7 + R.x * .9;
      float streak = (1. - smoothstep(0., .12, abs(band - .3))) * .55 + (1. - smoothstep(0., .035, abs(band - .52))) * .8;
      float sheen = .05 * smoothstep(1.2, -1., band);
      c = vec3(.012, .03, .034) + env(R) * mix(.05, 1., FR) + vec3(streak + sheen) + vec3(.3, .48, .34) * pow(1. - NV, 3.) + vec3(1.6) * spec(220.) + vec3(.2) * vAct;
    } else if (id == 2) {
      // Eiche: Jahresringe um eine Achse entlang x, verzogen durch Rauschen im Objektraum; matt.
      vec3 q = vPos * vec3(.5, 1., 1.5) + vec3(0., 1.6, -.9);
      float warp = .1 * snoise(vPos * vec3(.35, 1.6, 1.6)) + .015 * snoise(vPos * vec3(.5, 8., 8.));
      float ring = fract((length(q.yz) + warp) * 12.);
      float late = smoothstep(.62, .86, ring) * (1. - smoothstep(.88, 1., ring));
      float pores = smoothstep(.2, .9, snoise(vPos * vec3(1.5, 55., 55.)));
      // Fugen: eine Tür und ein Sockel machen aus dem Block einen Korpus.
      float front = smoothstep(.44, .47, vPos.z);
      float joint = front * max(1. - smoothstep(.006, .014, abs(vPos.x + .12)), 1. - smoothstep(.006, .014, abs(vPos.y + .7)));
      vec3 albedo = mix(vec3(.36, .25, .155), vec3(.2, .13, .075), late * .7 + pores * .25) * (1. + .5 * vAct) * (1. - .75 * joint);
      c = albedo * (key * 1.1 + sky * .7) + vec3(.06) * spec(18.) + env(R) * FR * .1;
    } else if (id == 3) {
      // Glut: dunkle, glänzende Haut, innen warm glühend; am Grund und in der Mitte am hellsten, nach oben kühler.
      float h = clamp((vPos.y + 1.2) / 2.6, 0., 1.);
      float inner = (pow(NV, 2.8) * (1. - .55 * h) + .25 * (1. - h) * (1. - h)) * (.85 + .3 * snoise(vPos * vec3(2.2, 1.4, 2.2) + vec3(0., -1.5, 0.)));
      vec3 glow = mix(vec3(.45, .05, .01), vec3(1., .36, .06), smoothstep(.15, .6, inner));
      glow = mix(glow, vec3(1.25, .8, .38), smoothstep(.6, 1., inner));
      c = vec3(.05, .025, .015) * (key + sky) + glow * inner * .95 + env(R) * FR * .45 + vec3(.55, .45, .35) * spec(70.) + vec3(1., .45, .12) * vAct * .8;
    } else {
      // Masse: graues, seidenmattes Material; Mulden etwas dunkler.
      float ao = mix(.55, 1., smoothstep(-.2, .16, vCav)), wrap = max((NL + .2) / 1.2, 0.);
      c = vec3(.19, .2, .2) * (vec3(1.3, 1.22, 1.08) * wrap * wrap + sky * .8) * ao + vec3(.2) * spec(28.) + env(R) * (.05 + FR * .3) * ao;
    }
    return c;
  }
  void main(){
    N = normalize(vNormal); V = normalize(cameraPosition - vPos); R = reflect(-V, N);
    NL = dot(N, normalize(KEY)); NV = max(dot(N, V), 0.); FR = pow(1. - NV, 4.);
    vec3 c = vW < .999 ? shade(uFormA) : vec3(0.);
    if (vW > .001) c = mix(c, shade(uFormB), vW);
    // Kühles Gegenlicht am Rand im Akzentton.
    c += vec3(.84, .93, .57) * .22 * FR * smoothstep(-.3, .5, dot(N, normalize(vec3(.65, .3, -.7))));
    c = (c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14);
    // Glas lässt den Seitengrund durchscheinen, Spiegelungen und Kanten bleiben deckend.
    float glass = (uFormA == 1 ? 1. - vW : 0.) + (uFormB == 1 ? vW : 0.);
    gl_FragColor = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)), mix(1., clamp(.3 + .7 * FR + dot(c, vec3(.9)), 0., 1.), glass));
  }`;

export function initLandscape(container: HTMLElement): LandscapeController {
  const host = container.querySelector<HTMLElement>('.journey-webgl')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // shortcut: Netzfeinheit wird beim Start festgelegt; ein späterer Wechsel über 760 px behält sie bis zum Neuladen.
  const geometry = new IcosahedronGeometry(1, container.clientWidth < 760 ? 28 : 48);
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const sphere = mergeVertices(geometry);
  geometry.dispose();
  const ratio = Math.min(devicePixelRatio, 1.5);
  const disposers: (() => void)[] = [];
  let renderer: WebGLRenderer | undefined;
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, current = -1, target = -1, t = 0, distance = 6;
  // Ein Sprung über mehrere Stationen verwandelt nur einmal: von der sichtbaren Gestalt (leap) direkt zur Zielgestalt.
  let leap: number | undefined, leapAt = 0, leapForward = true;

  const clamp = (index: number) => Math.max(-1, Math.min(index, stations.length - 1));
  const formAt = (index: number) => index < 0 ? 0 : FORMS[stations[clamp(index)].id] ?? 0;
  const uniforms = { uT: { value: 0 }, uFormA: { value: 0 }, uFormB: { value: 0 }, uSeedA: { value: 0 }, uSeedB: { value: 0 } };
  const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true });
  const piece = new Mesh(sphere, material);
  // Der Shader verformt die Kugel über ihre Grenzen hinaus.
  piece.frustumCulled = false;

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const dispose of disposers.reverse()) dispose();
    sphere.dispose();
    material.dispose();
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
  const camera = new PerspectiveCamera(30, 1, .1, 60);
  scene.add(piece);
  container.dataset.render = 'material';

  /** Die beiden Stationen des laufenden Übergangs. Rückwärts läuft der Übergang der Station, die man verlässt. */
  function ends(from: number): [number, number] {
    if (leap !== undefined && from !== leapAt) leap = undefined;
    if (leap === undefined) return [from, clamp(from + 1)];
    return leapForward ? [leap, clamp(from + 1)] : [from, leap];
  }
  const visibleStation = () => leap !== undefined && (t < .5) === leapForward ? leap : Math.round(current);

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    const compact = width < 760;
    gpu.setSize(width, height, false);
    camera.aspect = width / height;
    // Freie Fläche für die Gestalt: Desktop rechts neben dem Text (34 %) unter der Bildzeile, mobil unter Kopf und Bildzeile bis zum Textbeginn.
    const [left, right, top, bottom] = compact
      ? [16, width - 16, 112, Math.min(520, Math.max(330, height * .53))]
      : [width * .42, width * .97, 175, height - 150];
    const radius = Math.max(60, Math.min(right - left, bottom - top) / 2 * .92);
    distance = EXTENT * height / (2 * radius * Math.tan((camera.fov * Math.PI) / 360));
    camera.setViewOffset(width, height, width / 2 - (left + right) / 2, height / 2 - (top + bottom) / 2, width, height);
    invalidate();
  }

  function place(a: number, b: number) {
    const e = t * t * (3 - 2 * t), pa = POSES[a + 1], pb = POSES[b + 1];
    const azimuth = (pa[0] + (pb[0] - pa[0]) * e) * Math.PI / 180, elevation = (pa[1] + (pb[1] - pa[1]) * e) * Math.PI / 180;
    // Unterwegs fährt die Kamera kurz zurück und wieder heran.
    const r = distance * (pa[2] + (pb[2] - pa[2]) * e) * (1 + .1 * Math.sin(Math.PI * t));
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * r, Math.sin(elevation) * r, Math.cos(azimuth) * Math.cos(elevation) * r);
    camera.lookAt(0, 0, 0);
  }

  function render(time: number) {
    frame = 0;
    if (disposed || !enabled || !visible || document.hidden) return;
    const step = lastTime ? Math.min(.05, (time - lastTime) / 1000) : .016;
    lastTime = time;
    current = reduced.matches ? target : current + (target - current) * Math.min(1, step * 2.6);
    if (Math.abs(target - current) < .002) { current = target; leap = undefined; }
    const from = Math.floor(current);
    t = current - from;
    const [a, b] = ends(from);
    uniforms.uT.value = t;
    uniforms.uFormA.value = formAt(a); uniforms.uFormB.value = formAt(b);
    uniforms.uSeedA.value = a + 2; uniforms.uSeedB.value = b + 2;
    place(a, b);
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
      target = clamp(Number.isFinite(value) ? value : -1);
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
