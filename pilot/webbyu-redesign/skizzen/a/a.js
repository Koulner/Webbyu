// Richtung A · Skizze. Native Scrollbewegung dreht die Flächen; WebGL liefert nur das Raumlicht.
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector4, WebGLRenderer } from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const FRONT = -12, BACK = 192;

const panels = [...document.querySelectorAll('[data-panel]')].map(el => ({
  el, card: el.querySelector('.card'), btn: el.querySelector('.flip'),
  hero: el.hasAttribute('data-hero'), forced: null, angle: FRONT, back: false,
}));

// Echte Demo-Seiten skaliert in die Fläche setzen; schmale Flächen zeigen die mobile Ansicht.
const fit = new ResizeObserver(entries => entries.forEach(({ target }) => {
  const frame = target.querySelector('iframe');
  if (!frame) return;
  const w = target.clientWidth, h = target.clientHeight;
  const virtual = w < 520 ? 390 : 1280;
  const s = w / virtual;
  Object.assign(frame.style, { width: `${virtual}px`, height: `${h / s}px`, transform: `scale(${s})` });
}));
document.querySelectorAll('.viewport').forEach(v => fit.observe(v));

panels.forEach(p => p.btn.addEventListener('click', () => {
  p.forced = p.back ? 'front' : 'back';
  if (reduced) p.el.scrollIntoView({ block: 'center' });
}));

function autoTarget(p) {
  if (p.hero && innerWidth > 900) return smooth(innerHeight * .04, innerHeight * .3, scrollY);
  const r = p.el.getBoundingClientRect();
  return smooth(.7, .4, (r.top + r.height / 2) / innerHeight);
}

let px = 0, py = 0, tx = 0, ty = 0;
if (finePointer && !reduced) addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });

const stack = document.querySelector('.stack-wrap');
function updateDom() {
  px += (tx - px) * .08; py += (ty - py) * .08;
  for (const p of panels) {
    const r = p.el.getBoundingClientRect();
    if (p.forced && (r.bottom < 0 || r.top > innerHeight)) p.forced = null;
    const t = p.forced ? (p.forced === 'back' ? 1 : 0) : autoTarget(p);
    const target = FRONT + (BACK - FRONT) * t;
    p.angle += (target - p.angle) * (p.forced ? .1 : .16);
    const k = (p.angle - FRONT) / (BACK - FRONT);
    p.card.style.setProperty('--ry', `${(p.angle + px * 6).toFixed(2)}deg`);
    p.card.style.setProperty('--rx', `${(5 - py * 5).toFixed(2)}deg`);
    p.card.style.setProperty('--sheen', `${(120 - k * 140).toFixed(1)}%`);
    p.card.style.setProperty('--sheen-o', Math.sin(clamp(k) * Math.PI).toFixed(3));
    p.el.style.setProperty('--draw', smooth(.55, .95, k).toFixed(3));
    const back = p.angle > 90;
    if (back !== p.back) {
      p.back = back;
      p.btn.setAttribute('aria-pressed', String(back));
      p.btn.textContent = back ? 'Vorderseite zeigen' : 'Rückseite zeigen';
    }
  }
  if (stack) {
    const r = stack.getBoundingClientRect();
    const dist = Math.abs((r.top + r.height / 2) / innerHeight - .5);
    stack.style.setProperty('--explode', (1 - smooth(.12, .55, dist)).toFixed(3));
  }
}

// Projektberater: Antworten werden zu Notizen auf der Rückseite. Nichts verlässt die Seite.
const notes = document.querySelector('.notes');
const chips = [...document.querySelectorAll('.chips button')];
chips.forEach(chip => chip.addEventListener('click', () => {
  chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
  const active = chips.filter(c => c.getAttribute('aria-pressed') === 'true');
  notes.replaceChildren(...(active.length ? active.map(c => {
    const [goal, next] = c.dataset.note.split('|');
    const li = document.createElement('li');
    li.textContent = goal;
    const span = document.createElement('span');
    span.textContent = next;
    li.append(span);
    return li;
  }) : [Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Noch leer. Wählen Sie links, was Ihre Website leisten soll.' })]));
}));

// Raumlicht: ein Vollbild-Shader. Lichtinseln und Schatten folgen den Flächen; der Schatten wird beim Drehen schmal.
const canvas = document.querySelector('.room');
let gl;
try {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const MAX = 5;
  const uniforms = {
    uRes: { value: new Vector2() }, uTime: { value: 0 }, uScroll: { value: 0 },
    uRect: { value: Array.from({ length: MAX }, () => new Vector4()) },
    uOpen: { value: new Array(MAX).fill(1) },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      uniform vec2 uRes; uniform float uTime; uniform float uScroll;
      uniform vec4 uRect[${MAX}]; uniform float uOpen[${MAX}];
      varying vec2 vUv;
      float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 px = vUv * uRes;
        vec3 col = mix(vec3(.868, .868, .848), vec3(.918, .918, .9), smoothstep(0., 1., vUv.y));
        // Fensterlicht: zwei weiche Diagonalbahnen, die mit dem Scrollen wandern
        float d = (px.x * .55 + px.y) / uRes.y + uScroll * .00012 + uTime * .004;
        col += vec3(1., .985, .95) * (.035 * smoothstep(.35, 0., abs(fract(d) - .5)) + .02 * smoothstep(.22, 0., abs(fract(d * 1.7 + .3) - .5)));
        float shade = 0.;
        for (int i = 0; i < ${MAX}; i++) {
          vec4 r = uRect[i];
          if (r.z < 1.) continue;
          vec2 c = r.xy + r.zw * .5;
          vec2 q = (px - c) / (r.zw * vec2(.95, 1.1));
          col += vec3(1., .99, .96) * exp(-dot(q, q) * 1.5) * .09;
          vec2 sc = c + vec2(r.z * .03, -r.w * .09);
          float sd = box(px - sc, vec2(r.z * .5 * max(uOpen[i], .05), r.w * .47), 18.);
          shade += (1. - smoothstep(-r.w * .06, r.w * .2, sd)) * .13;
        }
        col -= shade * vec3(.5, .52, .56);
        col += (hash(px + fract(uTime)) - .5) * .016;
        gl_FragColor = vec4(col, 1.);
      }`,
    depthTest: false,
  });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera();
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); uniforms.uRes.value.set(innerWidth, innerHeight); };
  addEventListener('resize', resize);
  resize();
  const lightTargets = [...panels.map(p => p.card), document.querySelector('.b-front')].filter(Boolean).slice(0, MAX);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); canvas.remove(); gl = undefined; });
  gl = time => {
    uniforms.uTime.value = reduced ? 0 : time / 1000;
    uniforms.uScroll.value = scrollY;
    lightTargets.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const visible = r.bottom > -200 && r.top < innerHeight + 200;
      uniforms.uRect.value[i].set(r.left, innerHeight - r.bottom, visible ? r.width : 0, r.height);
      const p = panels[i];
      uniforms.uOpen.value[i] = p ? Math.abs(Math.cos((p.angle * Math.PI) / 180)) : 1;
    });
    renderer.render(scene, camera);
  };
} catch {
  canvas.remove();
}

function frame(time) {
  if (!reduced) updateDom();
  gl?.(time);
  if (!document.hidden) requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
if (reduced) { stack?.style.setProperty('--explode', '1'); addEventListener('scroll', () => gl?.(0), { passive: true }); gl?.(0); }
else requestAnimationFrame(frame);
