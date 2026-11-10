// Richtung B · Skizze. Ein Werkstück, dessen Material dem Kapitel folgt. Native Scrollbewegung, kein Pinning.
import { Color, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector4, WebGLRenderer } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = x => x * x * (3 - 2 * x);
// raw, oak, glass, ember, split
const STATES = { raw: [1, 0, 0, 0, 0], raw2: [1, 0, 0, 0, 0], split: [1, 0, 0, 0, 1], oak: [0, 1, 0, 0, 0], glass: [0, 0, 1, 0, 0], ember: [0, 0, 0, 1, 0], raw3: [1, 0, 0, 0, 0] };
const sections = [...document.querySelectorAll('[data-state]')];

document.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

const vertexShader = `
  varying vec3 vPos; varying vec3 vN; varying vec3 vV;
  void main(){
    vPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const fragmentShader = `
  precision highp float;
  uniform vec4 uW; uniform float uTime;
  varying vec3 vPos; varying vec3 vN; varying vec3 vV;
  float h(vec3 p){ return fract(sin(dot(p, vec3(17.1, 113.3, 71.7))) * 43758.5453); }
  float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= .5; } return s; }
  void main(){
    vec3 n = normalize(vN), v = normalize(vV), l = normalize(vec3(-.5, .8, .7));
    float diff = max(dot(n, l), 0.), fr = pow(1. - max(dot(n, v), 0.), 3.);
    float spec = pow(max(dot(n, normalize(l + v)), 0.), 60.);
    float g = fbm(vPos * 7.);
    vec3 raw = vec3(.56, .54, .5) * (.28 + .72 * diff) * (.9 + g * .2) + spec * .08;
    float rings = sin(length(vPos.yz * vec2(1., 4.)) * 22. + fbm(vPos * vec3(.6, 3., 3.)) * 6.);
    vec3 oak = mix(vec3(.42, .27, .14), vec3(.7, .5, .29), rings * .5 + .5) * (.3 + .75 * diff) * (.92 + n3(vPos * vec3(2., 40., 40.)) * .16) + spec * .2;
    vec3 glass = vec3(.05, .09, .12) + fr * vec3(.62, .82, 1.) + spec * 1.4 + diff * vec3(.03, .05, .07) + smoothstep(.62, .7, fbm(vPos * 2. + vec3(uTime * .02))) * .06;
    float c = abs(fbm(vPos * 3.2 + vec3(0., uTime * .03, 0.)) - .5);
    float crack = 1. - smoothstep(.0, .035, c);
    vec3 ember = vec3(.07, .06, .055) * (.3 + .7 * diff) + vec3(1., .36, .07) * crack * (.85 + .15 * sin(uTime * 2.3)) + spec * .05;
    vec3 col = raw * uW.x + oak * uW.y + glass * uW.z + ember * uW.w;
    gl_FragColor = vec4(pow(col, vec3(.95)), 1.);
  }`;

const canvas = document.querySelector('.stage');
try {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, 0, 7.5);
  const uniforms = { uW: { value: new Vector4(1, 0, 0, 0) }, uTime: { value: 0 } };
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const geometry = new RoundedBoxGeometry(2.3, 1.45, .38, 8, .1);
  const a = new Mesh(geometry, material), b = new Mesh(geometry, material);
  scene.add(a, b);
  const floor = new Mesh(new PlaneGeometry(9, 9), new ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float d = length((vUv - .5) * vec2(1., 1.8)); gl_FragColor = vec4(vec3(0.), smoothstep(.32, 0., d) * .55); }',
  }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  let wide = true;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    wide = innerWidth > 900;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  let tx = 0, ty = 0, px = 0, py = 0;
  if (!reduced) addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  const cur = [1, 0, 0, 0, 0];
  let spin = 0;

  const target = () => {
    const mid = innerHeight * .5;
    let i = 0;
    sections.forEach((s, k) => { if (s.getBoundingClientRect().top < mid) i = k; });
    const r = sections[i].getBoundingClientRect();
    const f = smooth(clamp((mid - r.top) / r.height * 1.6 - .6));
    const A = STATES[sections[i].dataset.state], B = STATES[sections[Math.min(i + 1, sections.length - 1)].dataset.state];
    return A.map((v, k) => v + (B[k] - v) * f);
  };

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.add('no-gl'); });
  const frame = time => {
    const t = target();
    t.forEach((v, k) => { cur[k] += (v - cur[k]) * (reduced ? 1 : .08); });
    uniforms.uW.value.set(cur[0], cur[1], cur[2], cur[3]);
    uniforms.uTime.value = reduced ? 0 : time / 1000;
    px += (tx - px) * .06; py += (ty - py) * .06;
    spin = reduced ? 0 : spin + .0016;
    const base = wide ? [1.45, 0] : [0, .95];
    const split = cur[4];
    [a, b].forEach((m, k) => {
      const side = k === 0 ? -1 : 1;
      m.visible = k === 0 || split > .01;
      m.position.set(base[0] + side * split * 1.05 * (k === 0 && split < .01 ? 0 : 1), base[1] + Math.sin(spin * 3 + k) * .04, 0);
      m.scale.setScalar(1 - split * .32);
      m.rotation.set(.32 + py * .25, -.55 + spin + scrollY * .0009 + px * .5 + side * split * .25, .06);
    });
    floor.position.set(base[0], base[1] - 1.05, 0);
    renderer.render(scene, camera);
    if (!document.hidden) requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
  // Ohne JavaScript-Animation bleibt eine ruhige Ansicht; bei reduzierter Bewegung folgt der Zustand nur dem Scrollen.
  scene.background = null;
  renderer.setClearColor(new Color('#0e0d0c'), 1);
} catch {
  document.documentElement.classList.add('no-gl');
  canvas.remove();
}
