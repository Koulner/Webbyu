// Einfahrt ins bewegte Bild (aus Studie B): eine Achse, keine Rotation. Die markierten Bilder stehen im Raum,
// die Kamera fährt an ihnen vorbei in den ersten Clip, bis er den Bildschirm füllt. Dort übernimmt ein HTML-Video
// mit derselben Datei und demselben Ausschnitt (`object-fit: cover`, Mitte) – pixelgleich am Poster.
import * as THREE from 'three';
import { video } from '../shared/content';
import { media, type StockMedia } from '../shared/media';

const TARGET = 'momente-video-konzert-01';
const SIDES = ['menschen-familie-02', 'business-video-werkstatt-01', 'kreativ-kostuem-01', 'momente-konzert-01'];
const GROUND = 0x10131b;
const FOCAL = 35; // mm, Kleinbild: halbe Bildhöhe 12 mm
const FOV = (2 * Math.atan(12 / FOCAL) * 180) / Math.PI;
const Z_START = 15;
const HANDOVER = 0.8; // Anteil der Strecke, ab dem das HTML-Video übernimmt

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const byId = (id: string) => {
  const m = media.find((x) => x.id === id);
  if (!m) throw new Error(`Koulner: Medium ${id} fehlt in media.json`);
  return m;
};
const still = (m: StockMedia) => (m.kind === 'video' ? m.poster! : (m.small ?? m.src));

/** Abstand, bei dem eine Ebene der Höhe 1 und Breite `ar` den Bildschirm wie `object-fit: cover` füllt. */
export function coverDistance(ar: number, viewAspect: number) {
  return Math.min(1, ar / viewAspect) / (2 * Math.tan((FOV * Math.PI) / 360));
}
// Selbstprüfung: quadratische Ebene, quadratischer Schirm → sichtbare Höhe genau 1.
if (Math.abs(2 * coverDistance(1, 1) * Math.tan((FOV * Math.PI) / 360) - 1) > 1e-9) throw new Error('Koulner: Einfahrt falsch berechnet');

/** Fügt die Einfahrt vor dem Video-Abschnitt ein. Gibt false zurück, wenn WebGL fehlt. */
export function initEinfahrt(): boolean {
  const target = byId(TARGET);
  const sec = document.createElement('section');
  sec.className = 'einfahrt';
  sec.setAttribute('aria-hidden', 'true');
  sec.innerHTML = `<div class="ef-stage">
    <canvas></canvas>
    <video class="ef-full" muted playsinline loop preload="none" poster="${target.poster}"><source src="${target.src}" type="video/mp4"></video>
    <p class="ef-focal">Perspektivwechsel · 04 → 05<br>${FOCAL} mm</p>
    <p class="ef-title">${video.title}</p>
  </div>`;
  const canvas = sec.querySelector('canvas')!;
  const full = sec.querySelector('video')!;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return false;
  }
  document.getElementById('video')!.before(sec);
  renderer.setClearColor(GROUND);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(GROUND, 6, 20);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
  const loader = new THREE.TextureLoader();

  const plane = (m: StockMedia, url: string, x: number, y: number, z: number, h: number) => {
    const ar = m.width / m.height;
    const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ar * h, h), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      Object.assign(mat, { map: tex, color: new THREE.Color(0xffffff) });
      mat.needsUpdate = true;
      draw();
    });
    return ar;
  };
  const ar = plane(target, target.poster!, 0, 0, 0, 1);
  SIDES.forEach((id, i) => {
    const side = i % 2 ? 1 : -1;
    plane(byId(id), still(byId(id)), side * (1.05 + i * 0.12), (i % 3) * 0.12 - 0.12, 3 + i * 3, 0.8);
  });

  let p = 0;
  function draw() {
    const view = innerWidth / innerHeight;
    const end = coverDistance(ar, view);
    camera.aspect = view;
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, Z_START + (end - Z_START) * smooth(clamp01(p / HANDOVER)));
    renderer.render(scene, camera);
  }
  function size() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    draw();
  }

  const paused = () => !!document.querySelector('[data-clip-toggle][aria-pressed="true"]');
  let near = false;
  let queued = false;
  function frame() {
    queued = false;
    const r = sec.getBoundingClientRect();
    p = clamp01(-r.top / (r.height - innerHeight));
    const inn = p >= HANDOVER;
    sec.classList.toggle('is-in', inn);
    if (inn && near && !paused()) full.play().catch(() => {});
    else full.pause();
    if (!inn) draw();
  }
  const tick = () => {
    if (near && !queued) {
      queued = true;
      requestAnimationFrame(frame);
    }
  };
  new IntersectionObserver(([e]) => {
    near = e.isIntersecting;
    if (!near) full.pause();
    tick();
  }, { rootMargin: '50% 0px' }).observe(sec);
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', () => {
    size();
    tick();
  });
  size();
  return true;
}
