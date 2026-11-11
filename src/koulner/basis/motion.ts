import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setGate } from './video';

gsap.registerPlugin(ScrollTrigger);

const q = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Koulner: ${sel} fehlt`);
  return el as T;
};

// Layoutbox relativ zu einem positionierten Vorfahren. Ignoriert Transformationen, darum stabil beim Zurückscrollen.
function box(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  if (n !== root) throw new Error('Koulner: box() ohne gemeinsamen Vorfahren');
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

const narrow = () => innerWidth < 960;

/* ---------- Dolly-Zoom (Mechanik aus Studie B, an Bögen angepasst) ----------
   Der gehaltene Abzug liegt in der Ebene z = 0, die Kamera fährt nur entlang z und ändert die Brennweite:
   Kameradistanz ∝ Brennweite, also bleibt der Abzug exakt gleich groß. Der Bogen liegt DEPTH dahinter
   (in derselben Einheit wie die Brennweite) und erscheint mit f / (f + DEPTH), normiert auf die Ruhebrennweite.
   Weil der Bogen eben und parallel liegt, ist das eine reine Skalierung um die optische Achse (Mitte des Abzugs). */
const F_REST = 135;
const F_WIDE = 16;
const DEPTH = 30; // bei 16 mm erscheint der Bogen mit rund 42 % seiner Ruhegröße, knapp so groß wie der Abzug in der Hand
const IN = 1.5; // Zeitachse: zweite Hälfte des Zooms am Anfang des nächsten Bogens
const OUT = 1.5; // erste Hälfte am Ende des aktuellen Bogens
const HOLD_LIFT = 0.6; // der gehaltene Abzug liegt höher über dem Tisch (Schatten)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** u: 0 → 0,5 aktueller Bogen fällt, 0,5 → 1 nächster Bogen wächst heran. */
export function focal(u: number) {
  const bell = u < 0.5 ? smooth(0, 0.5, u) : smooth(1, 0.5, u);
  // Exponent > 1: der sichtbare Rückzug bekommt den meisten Scrollweg, das leere Extrem nur einen Moment.
  return F_REST * Math.pow(F_WIDE / F_REST, Math.pow(bell, 1.6));
}
const depthScale = (f: number) => (f / (f + DEPTH)) * ((F_REST + DEPTH) / F_REST);
// Naht bei u = 0,5: beide Bögen sind dort unsichtbar, nur der Abzug steht.
const sheetAlpha = (u: number) => (u < 0.5 ? 1 - smooth(0.34, 0.5, u) : smooth(0.5, 0.66, u));

// Selbstprüfung der Kurve: Ruhe = 1, Weitwinkel deutlich kleiner, symmetrisch um die Naht.
if (Math.abs(depthScale(focal(0)) - 1) > 1e-9 || Math.abs(depthScale(focal(1)) - 1) > 1e-9 || depthScale(focal(0.5)) > 0.5 || sheetAlpha(0.5) !== 0)
  throw new Error('Koulner: Dolly-Kurve fehlerhaft');

// Fokusrahmen mit Brennweitenanzeige (aus Studie B): umrahmt das gehaltene Bild, solange eine Fahrt läuft.
const hudEl = document.createElement('div');
hudEl.className = 'hud';
hudEl.setAttribute('aria-hidden', 'true');
hudEl.innerHTML = '<div class="hud-frame"><i></i><i></i><i></i><i></i></div><p class="focal"><span class="hud-way"></span><span class="hud-mm"></span></p>';
const hudFrame = q(hudEl, '.hud-frame');
const hudInfo = q(hudEl, '.focal');
const hudWay = q(hudEl, '.hud-way');
const hudMm = q(hudEl, '.hud-mm');
let hudOwner: unknown = null;
function hud(owner: unknown, u: number, el?: Element, text = '') {
  if (u < 0 || !el) {
    if (hudOwner === owner) {
      hudEl.style.opacity = '0';
      hudOwner = null;
    }
    return;
  }
  const r = el.getBoundingClientRect();
  const pad = 10;
  hudOwner = owner;
  hudWay.textContent = text;
  hudMm.textContent = `${Math.round(focal(u))} mm`;
  Object.assign(hudFrame.style, { width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`, transform: `translate(${r.left - pad}px, ${r.top - pad}px)` });
  hudInfo.style.transform = `translate(${Math.round(r.left - pad)}px, ${Math.round(r.bottom + pad + 10)}px)`;
  hudEl.style.opacity = '1';
}

// Grundton je Bogen aus dem Licht seiner Bilder (Werte aus Studie B). Der Wechsel liegt wie in B um die Naht.
// Grundton und Fokusrahmen nur in Stufe 3 (`<html class="licht">`).
const LICHT = document.documentElement.classList.contains('licht');
const TONE: Record<string, string> = { hero: '#f2f2ee', menschen: '#e8d7bd', momente: '#1d1611', business: '#dcdbd6', kreativ: '#10131b' };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function ground(a: string, b: string, u: number) {
  if (!LICHT) return;
  // Nach dem letzten Bogen liegt wieder neutraler Tisch, auch wenn ein Bogen-Trigger danach noch einmal meldet.
  if (document.getElementById('video')!.getBoundingClientRect().top <= 40) a = b = 'hero';
  const m = smooth(0.38, 0.62, u);
  const A = rgb(TONE[a]);
  const B = rgb(TONE[b]);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * m));
  const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  const root = document.documentElement.style;
  root.setProperty('--ground', `rgb(${c.join(' ')})`);
  // Leuchttischlicht nur auf hellem Grund; auf dunklem Grund bleibt ein Hauch davon.
  root.setProperty('--glow-a', (0.06 + 0.6 * smooth(0.3, 0.75, lum)).toFixed(3));
  hudEl.dataset.ink = lum > 0.45 ? 'dark' : 'light';
  document.documentElement.dataset.ink = hudEl.dataset.ink; // Kopfleiste folgt dem Grund (Stufe 3)
}
if (rgb('#10131b').join() !== '16,19,27') throw new Error('Koulner: Farbumrechnung fehlerhaft');
const two = (n: number) => String(n).padStart(2, '0');

function heroMotion() {
  // Fettstift: die Markierung in Streifen 01 beim Ankommen.
  gsap.fromTo('.hero .cell .mark path', { strokeDashoffset: 1.02 }, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.inOut', stagger: 0.24, delay: 0.5 });

  // Desktop: Die Hülle gleitet weg, du nimmst das markierte Bildfeld aus Streifen 01 auf, der Gesamtbogen fällt
  // in die Tiefe (erste Hälfte des Dolly-Zooms). Bogen 01 wächst danach so heran, dass das Bildfeld genau auf
  // seinem Platz landet. Der Einstieg ist ohne Platzhalter gepinnt: Sein Pin endet, wo der von Bogen 01 beginnt.
  gsap.matchMedia().add('(min-width: 960px)', () => {
    const hero = q(document, '.hero');
    const heroSheet = q(hero, '.hero-sheet');
    const cell = q(hero, '.strip:first-child .cell.is-pick .frame');
    const held = frameHold(cell);
    hero.append(held);
    heroEl = hero;
    const PICK = 0.75;
    const DOLLY = 1.85;
    const target = () => firstEntry!();
    const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true, onUpdate: () => dolly() });
    tl.to('.hero-hint', { opacity: 0, duration: 0.2 }, 0)
      .to('.sleeve', { xPercent: -118, rotation: -2, ease: 'power1.in', duration: 1 }, 0)
      .to(heroSheet, { rotation: 0, duration: 0.7 }, 0)
      .set(q(cell, 'img'), { opacity: 0.14 }, PICK)
      .set(held, { opacity: 1 }, PICK)
      .fromTo(
        held,
        { left: () => box(cell, hero).x, top: () => box(cell, hero).y, width: () => cell.offsetWidth, '--lift': 0 },
        { left: () => target().x, top: () => target().y, width: () => target().w, '--lift': HOLD_LIFT, duration: DOLLY - PICK, ease: 'power2.inOut', immediateRender: false },
        PICK,
      )
      .to({}, { duration: OUT }, DOLLY);

    function dolly() {
      const t = tl.time();
      const u = t > DOLLY ? 0.5 * clamp01((t - DOLLY) / OUT) : -1;
      const shown = !hero.classList.contains('is-off');
      if (u < 0 || !firstEntry) {
        gsap.set(heroSheet, { scale: 1, opacity: 1 });
        hud(hero, -1);
        if (shown) ground('hero', 'hero', 0);
        return;
      }
      if (shown) {
        hud(hero, u, held, 'Perspektivwechsel · Gesamtbogen → 01');
        ground('hero', 'menschen', u);
      }
      const e = target();
      Object.assign(held.style, { left: `${e.x}px`, top: `${e.y}px`, width: `${e.w}px` });
      const hs = box(heroSheet, hero);
      gsap.set(heroSheet, { scale: depthScale(focal(u)), transformOrigin: `${e.x + e.w / 2 - hs.x}px ${e.y + e.w / 2 - hs.y}px`, opacity: sheetAlpha(u) });
    }

    ScrollTrigger.create({
      animation: tl,
      trigger: hero,
      start: 'top top',
      end: () => `+=${hero.offsetHeight}`,
      pin: true,
      pinSpacing: false,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: showOne,
      onRefresh: showOne,
    });
    ScrollTrigger.addEventListener('refresh', dolly);
    redraw.set(hero, dolly);
    return () => {
      redraw.delete(hero);
      ScrollTrigger.removeEventListener('refresh', dolly);
      held.remove();
      heroEl = null;
      hero.classList.remove('is-off');
      showOne();
    };
  });
}

/** Kopie eines Bildfelds aus dem Kontaktbogen, ohne Fettstift. */
function frameHold(frame: HTMLElement) {
  const el = frame.cloneNode(true) as HTMLElement;
  el.querySelector('.mark')?.remove();
  el.classList.add('held-frame');
  el.setAttribute('aria-hidden', 'true');
  el.querySelectorAll('img').forEach((i) => {
    i.removeAttribute('loading');
    i.alt = '';
  });
  return el;
}

interface Geo {
  s0: number;
  x0: number;
  y0: number;
  s: number;
  px: number;
  py: number;
  pts: { x: number; y: number }[];
  /** Abzug in der Hand: Verschiebung und Maßstab gegenüber seinem Platz */
  hand: Hand;
  /** optische Achse relativ zum Bogenplatz: beim Hereinwachsen (Mitte des Gehaltenen), beim Zurückfallen (Mitte des Erzählfelds) */
  ain: string;
  aout: string;
  /** Bildfeld des markierten Bildes im Überblick (Bühnenkoordinaten): hier landet das Bildfeld aus dem Einstieg */
  entry: Rect;
}
interface Rect {
  x: number;
  y: number;
  w: number;
}
let firstEntry: (() => Rect) | null = null;
// Gesetzt, solange der gepinnte Einstieg Bogen 01 überdeckt (Desktop).
let heroEl: HTMLElement | null = null;
interface Hand {
  x: number;
  y: number;
  scale: number;
}
/** Abzug in der Hand: kleiner (gut ein Viertel der Bühnenhöhe), in der Mitte des Erzählfelds.
 *  So bleibt rundherum Bogen sichtbar, der in die Tiefe fallen kann. Reine Messung ohne Zwischenspeicher:
 *  Bogen und Folgebogen rechnen damit dieselben Werte, auch direkt nach einem Größenwechsel. */
function handOf(sec: HTMLElement): Hand {
  const stage = q(sec, '.stage');
  const sa = box(q(sec, '.story'), stage);
  const pr = box(q(sec, '.print.main'), stage);
  return {
    x: sa.x + sa.w / 2 - (pr.x + pr.w / 2),
    y: sa.y + sa.h / 2 - (pr.y + pr.h / 2),
    scale: Math.min((sa.w * 0.5) / pr.w, (stage.clientHeight * (narrow() ? 0.24 : 0.28)) / pr.h, 1),
  };
}
const targets = new Map<string, () => number>();
// Bögen überlappen an der Naht: sichtbar ist genau einer, der letzte, dessen Pin schon begonnen hat (sonst der erste).
const starts: [HTMLElement, () => number][] = [];
function showOne() {
  if (!starts.length) return;
  let k = 0;
  starts.forEach(([, s], i) => scrollY >= s() - 0.5 && (k = i));
  const before = scrollY < starts[0][1]() - 0.5;
  starts.forEach(([sec], i) => sec.classList.toggle('is-off', i !== k || (!!heroEl && before)));
  heroEl?.classList.toggle('is-off', !before);
  redraw.get(heroEl && before ? heroEl : starts[k][0])?.();
  if (document.getElementById('video')!.getBoundingClientRect().top <= 40) ground('hero', 'hero', 0);
}
const redraw = new Map<HTMLElement, () => void>();

/** Ein Bogen. `prev`/`next`: Nachbarbögen, zwischen denen der Dolly-Zoom vermittelt. */
function bogenMotion(sec: HTMLElement, nr: number, prev?: HTMLElement, next?: HTMLElement) {
  const stage = q(sec, '.stage');
  const slot = q(sec, '.sheet-slot');
  const sheet = q(sec, '.sheet');
  const story = q(sec, '.story');
  const lens = q(sec, '.lens');
  const copy = q(sec, '.copy');
  const print = q(story, '.print.main');
  const front = q(print, '.face.front img, .face.front video');
  const comps = [...story.querySelectorAll<HTMLElement>('.print.c')];
  const caption = q(sec, '.caption');
  const turnBtn = q<HTMLButtonElement>(caption, '.turn');
  const log = [...sec.querySelectorAll<HTMLElement>('.log li')];
  const logMark = q(sec, '.log .is-mark');
  const grid = q(sheet, '.grid');
  const pickId = sec.dataset.pick!;
  const area = sec.dataset.area!;
  const ids = [...sec.dataset.path!.split(' '), pickId];
  const img = (id: string) => q(grid, `[data-id="${id}"] img`);
  const pickImg = img(pickId);
  const strokes = sheet.querySelectorAll<SVGPathElement>('.grid .mark path');
  const clip = print.querySelector('video');

  // Gehalten wird der Abzug des vorigen Bogens (Kopie an exakt derselben Bildschirmstelle),
  // in Bogen 01 das markierte Bildfeld aus dem Einstieg (landet auf seinem Platz im Überblick).
  const prevPrint = prev && q(prev, '.print.main');
  const pickFrame = q(grid, `[data-id="${pickId}"] .frame`);
  const [held, syncHeld] = prevPrint ? hold(prevPrint) : [frameHold(pickFrame), () => {}];
  stage.append(held);
  if (prevPrint) gsap.set(held, { '--lift': HOLD_LIFT, transformPerspective: 1100 });

  let cache: Geo | null = null;
  ScrollTrigger.addEventListener('refreshInit', () => (cache = null));
  const g = () => (cache ??= measure());
  if (!prev) firstEntry = () => g().entry;

  function measure(): Geo {
    const sh = box(sheet, stage);
    const sa = box(story, stage);
    // Überblick: Bogen groß im Erzählfeld. Ende: Bogen an seinem Platz, Abzug groß.
    const s0 = Math.min((sa.w * (narrow() ? 0.98 : 0.88)) / sh.w, (sa.h * 0.84) / sh.h, 2.3);
    const x0 = sa.x + sa.w / 2 - (sh.x + (s0 * sh.w) / 2);
    const y0 = sa.y + sa.h / 2 - (sh.y + (s0 * sh.h) / 2);
    const c = (id: string) => {
      const b = box(img(id), sheet);
      return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w };
    };
    const t = c(pickId);
    const pr = box(print, stage);
    const im = box(front, stage);
    const s = (s0 * t.w) / im.w;
    const tcx = sh.x + x0 + s0 * t.x;
    const tcy = sh.y + y0 + s0 * t.y;
    const pcx = pr.x + pr.w / 2;
    const pcy = pr.y + pr.h / 2;
    const cw = q(grid, '.frame').offsetWidth;
    lens.style.setProperty('--d', `${Math.min(cw * 1.7, sh.w * 0.46)}px`);
    lens.style.setProperty('--sw', `${sheet.clientWidth}px`);
    const sl = box(slot, stage);
    const fr = box(pickFrame, sheet);
    const entry = { x: sh.x + x0 + s0 * (sheet.clientLeft + fr.x), y: sh.y + y0 + s0 * (sheet.clientTop + fr.y), w: s0 * parseFloat(getComputedStyle(pickFrame).width) };
    const center = (x: number, y: number) => `${x - sl.x}px ${y - sl.y}px`;
    return {
      s0,
      x0,
      y0,
      s,
      px: tcx - (pcx + s * (im.x + im.w / 2 - pcx)),
      py: tcy - (pcy + s * (im.y + im.h / 2 - pcy)),
      pts: ids.map(c),
      hand: handOf(sec),
      aout: center(sa.x + sa.w / 2, sa.y + sa.h / 2),
      ain: prevPrint ? center(sa.x + sa.w / 2, sa.y + sa.h / 2) : center(entry.x + entry.w / 2, entry.y + entry.w / 2),
      entry,
    };
  }

  const P = (i: number) => ({ '--lx': () => g().pts[i].x, '--ly': () => g().pts[i].y });
  gsap.set(print, { opacity: 0, transformPerspective: 1100, transformOrigin: '50% 50%' });
  gsap.set(lens, { '--k': 2.1, '--ls': 1.12 });

  const t0 = IN + 0.35;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true, onUpdate: () => dolly() });

  // 0 Dolly-Zoom, zweite Hälfte: der gehaltene Abzug steht, dieser Bogen wächst aus der Tiefe heran.
  // Danach legst du den Abzug ab: er sinkt auf den Tisch und gibt den Bogen frei. Das Bildfeld liegt schon auf seinem Platz.
  tl.fromTo(copy, { opacity: 0 }, { opacity: 1, duration: 0.6 }, IN * 0.62);
  if (prevPrint) tl.fromTo(held, { opacity: 1, '--lift': HOLD_LIFT }, { opacity: 0, '--lift': 0, duration: 0.45, ease: 'power1.in' }, IN);
  else tl.fromTo(held, { opacity: 1 }, { opacity: 0, duration: 0.2 }, IN);

  // 1 Lupe wird aufgesetzt und sucht.
  tl.fromTo(lens, { ...P(0), opacity: 0, '--ls': 1.12 }, { ...P(0), opacity: 1, '--ls': 1, duration: 0.5, ease: 'power2.out' }, t0 + 0.15)
    .addLabel('p0')
    .to(lens, { ...P(1), duration: 0.9, ease: 'power1.inOut' }, '+=0.45')
    .addLabel('p1')
    .to(lens, { ...P(2), duration: 0.9, ease: 'power1.inOut' }, '+=0.45')
    .addLabel('p2')
    // 2 Fettstift markiert, Lupe wird abgehoben.
    .addLabel('mark', '+=0.25')
    .fromTo(strokes, { strokeDashoffset: 1.02 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.5, ease: 'power1.inOut' }, 'mark')
    .fromTo(logMark, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 'mark+=0.3')
    .to(lens, { opacity: 0, '--ls': 1.18, duration: 0.5, ease: 'power1.in' }, 'mark+=0.5')
    // 3 Der Abzug hebt sich aus dem Bogen, der Bogen tritt ins Halbdunkel.
    .addLabel('lift', '+=0.15')
    .set(pickImg, { opacity: 0.14 }, 'lift')
    .set(print, { opacity: 1 }, 'lift')
    .fromTo(
      print,
      { x: () => g().px, y: () => g().py, scale: () => g().s, z: 0, rotationX: 0, rotationY: 0, '--lift': 0 },
      { x: () => g().px, y: () => g().py - 18, scale: () => g().s * 1.34, z: 70, rotationX: 24, rotationY: -18, '--lift': 1, duration: 0.9, ease: 'power2.out' },
      'lift',
    )
    .to(grid, { opacity: 0.4, duration: 0.6 }, 'lift')
    // 4 Perspektivwechsel: Bogen tritt zurück, Abzug kommt nah.
    .addLabel('land')
    .to(print, { x: 0, y: 0, scale: 1, z: 0, rotationX: 0, rotationY: 0, '--lift': 0.28, duration: 1.8, ease: 'power2.inOut' }, 'land')
    .to(sheet, { x: 0, y: 0, scale: 1, opacity: () => (narrow() ? 0 : 0.92), duration: 1.8, ease: 'power2.inOut' }, 'land')
    .to(grid, { opacity: 1, duration: 1 }, 'land+=0.8')
    .to(log, { opacity: 0, duration: 0.4 }, 'land+=1.1')
    .fromTo(comps, { opacity: 0, y: 46, '--lift': 0.9 }, { opacity: 1, y: 0, '--lift': 0.22, duration: 0.8, stagger: 0.28, ease: 'power2.out' }, 'land+=1.3')
    .fromTo(caption, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 'land+=1.5')
    .addLabel('settled')
    .to({}, { duration: next ? 0.9 : 1.1 });

  // 5 Du nimmst den Abzug in die Hand: Begleitbilder und Text treten ab, der Bogen schiebt sich darunter.
  //   Dann Dolly-Zoom, erste Hälfte: der Abzug steht, der Bogen fällt in die Tiefe.
  if (next) {
    tl.addLabel('out')
      .to([copy, caption, ...comps], { opacity: 0, duration: 0.4 }, 'out')
      .to(print, { x: () => g().hand.x, y: () => g().hand.y, scale: () => g().hand.scale, '--lift': HOLD_LIFT, duration: 1, ease: 'power2.inOut' }, 'out')
      .to(sheet, { x: () => g().x0, y: () => g().y0, scale: () => g().s0, opacity: 1, duration: 1, ease: 'power2.inOut' }, 'out')
      .to(grid, { opacity: 1, duration: 0.5 }, 'out')
      .addLabel('dolly', 'out+=1')
      .to({}, { duration: OUT }, 'dolly');
  }
  const outAt = next ? tl.labels.dolly : Infinity;

  log.forEach((li, i) => tl.fromTo(li, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, immediateRender: true }, `p${i}`));

  // Bogen hält die Überblicksposition bis zur Landung. Als Tween, damit Größenwechsel neu gemessen werden.
  tl.fromTo(
    sheet,
    { x: () => g().x0, y: () => g().y0, scale: () => g().s0, opacity: 1 },
    { x: () => g().x0, y: () => g().y0, scale: () => g().s0, opacity: 1, duration: tl.labels.land },
    0,
  );

  // Zeit → Kamerastellung. Außerhalb der Fahrten liegt der Bogen in Ruhe (keine Transformation am Bogenplatz).
  function dolly() {
    const t = tl.time();
    const u = t < IN ? 0.5 + (0.5 * t) / IN : t > outAt ? 0.5 * clamp01((t - outAt) / OUT) : -1;
    const shown = !sec.classList.contains('is-off');
    if (u < 0) {
      slot.style.transform = slot.style.opacity = '';
      hud(sec, -1);
      if (shown) ground(area, area, 0);
      return;
    }
    if (shown) {
      if (u < 0.5) ground(area, next!.dataset.area!, u);
      else ground(prev?.dataset.area ?? 'hero', area, u);
    }
    // Gehaltener Abzug je Bild frisch gesetzt: das Original beim Zurückfallen, die Kopie beim Hereinwachsen.
    if (u < 0.5) gsap.set(print, handOf(sec));
    else if (prevPrint) {
      place(held, prevPrint, prev!, handOf(prev!));
      syncHeld();
    }
    else {
      const e = g().entry;
      Object.assign(held.style, { left: `${e.x}px`, top: `${e.y}px`, width: `${e.w}px` });
      held.style.setProperty('--lift', String(HOLD_LIFT * smooth(1, 0.5, u)));
    }
    slot.style.transformOrigin = u < 0.5 ? g().aout : g().ain;
    slot.style.transform = `scale(${depthScale(focal(u)).toFixed(5)})`;
    slot.style.opacity = sheetAlpha(u).toFixed(3);
    if (shown)
      hud(sec, u, u < 0.5 ? print : held, `Perspektivwechsel · ${u < 0.5 ? `${two(nr)} → ${two(nr + 1)}` : nr === 1 ? 'Gesamtbogen → 01' : `${two(nr - 1)} → ${two(nr)}`}`);
    // Wer die Rückseite offen hat, bekommt beim Weitergehen wieder die Vorderseite: die Kopie im nächsten Bogen zeigt sie.
    if (u < 0.5 && print.classList.contains('is-turned')) turnBtn.click();
  }

  const unit = () => (narrow() ? 20.5 : 24); // Scrollweg je Zeiteinheit in % der Fensterhöhe (wie Studie A)
  const st = ScrollTrigger.create({
    animation: tl,
    trigger: sec,
    start: 'top top',
    end: () => `+=${Math.round(tl.duration() * unit())}%`,
    pin: true,
    scrub: 0.45,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: () => {
      if (!clip) return;
      const t = tl.time();
      const out = !!next && t >= tl.labels.out;
      // Beim Aufnehmen hält der Clip an; die Kopie im nächsten Bogen zeigt genau dieses Bild.
      setGate(clip, t >= tl.labels.settled - 0.2 && !out);
    },
    onToggle: () => showOne(),
    onRefresh: () => showOne(),
  });
  // Anker landen hinter der Fahrt, wenn die Lupe aufsetzt. Der Abschnitt selbst taugt nicht als Ziel:
  // nach seinem Pin liegt er am Ende des Platzhalters, also an der nächsten Naht.
  targets.set(sec.id, () => st.start + ((st.end - st.start) * (t0 + 0.6)) / tl.duration());
  starts.push([sec, () => st.start]);
  redraw.set(sec, dolly);
  // Nach dem Refresh (Layout fertig) die Kamerastellung einmal neu setzen.
  ScrollTrigger.addEventListener('refresh', () => {
    cache = null;
    dolly();
  });

  // Tastatur: Wer in die Bildunterschrift springt, sieht sofort den gelandeten Abzug.
  caption.addEventListener('focusin', () => {
    if (tl.time() < tl.labels.settled || (next && tl.time() > tl.labels.out)) scrollTo({ top: st.start + ((st.end - st.start) * tl.labels.settled) / tl.duration() + 2, behavior: 'instant' });
  });
}

/** Kopie eines Hauptabzugs ohne Rückseite. Ein Video wird zur Leinwand mit dem angehaltenen Bild
 *  (bis der Clip einmal lief: das Poster). Rückgabe: Kopie und Abgleich des Bildes. */
function hold(src: HTMLElement): [HTMLElement, () => void] {
  const el = src.cloneNode(true) as HTMLElement;
  el.classList.replace('main', 'held');
  el.classList.remove('is-turned');
  el.removeAttribute('style');
  el.setAttribute('aria-hidden', 'true');
  el.inert = true;
  el.querySelector('.face.back')?.remove();
  el.querySelectorAll('img').forEach((i) => i.removeAttribute('loading'));
  const v = el.querySelector('video');
  const sv = src.querySelector('video');
  if (!v || !sv) return [el, () => {}];
  const c = document.createElement('canvas');
  c.width = v.width;
  c.height = v.height;
  const ctx = c.getContext('2d')!;
  let drawn = -1;
  const poster = new Image();
  poster.onload = () => drawn < 0 && ctx.drawImage(poster, 0, 0, c.width, c.height);
  poster.src = v.poster;
  v.replaceWith(c);
  const sync = () => {
    if (sv.readyState < 2 || sv.currentTime === drawn) return;
    ctx.drawImage(sv, 0, 0, c.width, c.height);
    drawn = sv.currentTime;
  };
  return [el, sync];
}

/** Setzt die Kopie pixelgenau auf die Stelle des Originals in der Hand (gleiche Bühnengröße, beide oben gepinnt). */
function place(el: HTMLElement, src: HTMLElement, srcSec: HTMLElement, hand: Hand) {
  const cs = getComputedStyle(src);
  const so = q(srcSec, '.story').getBoundingClientRect();
  const st = q(srcSec, '.stage').getBoundingClientRect();
  // Mobil steht der Abzug per `margin: 0 auto` in der Mitte: berechnete Ränder mitzählen.
  const x = so.left - st.left + parseFloat(cs.left) + parseFloat(cs.marginLeft);
  const y = so.top - st.top + parseFloat(cs.top) + parseFloat(cs.marginTop);
  const w = parseFloat(cs.width);
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px` });
  // GSAP hat das CSS-`rotate` des Originals in seine Transformation übernommen.
  gsap.set(el, { ...hand, rotation: gsap.getProperty(src, 'rotation'), transformOrigin: '50% 50%' });
}

function laufbildMotion() {
  gsap.utils.toArray<HTMLElement>('.vprint').forEach((el, i) => {
    gsap.fromTo(
      el,
      { y: 90, rotationX: 22, rotationZ: i % 2 ? 1.5 : -1.5, opacity: 0, '--lift': 1, transformPerspective: 1100 },
      { y: 0, rotationX: 0, rotationZ: 0, opacity: 1, '--lift': 0.25, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 55%', scrub: 0.4 } },
    );
  });
}

export function initMotion() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  heroMotion();
  const secs = [...document.querySelectorAll<HTMLElement>('.bogen')];
  // Erst alle Überlappungen setzen, dann messen.
  secs.forEach((s, i) => s.classList.toggle('follows', i > 0));
  secs.forEach((s, i) => bogenMotion(s, i + 1, secs[i - 1], secs[i + 1]));
  document.body.append(hudEl);
  laufbildMotion();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // Bogen-Anker: zur Scrollposition des Bogens statt zum Element; Fokus-Startpunkt wie beim normalen Anker.
  const jump = (id: string, behavior: ScrollBehavior) => {
    const to = targets.get(id);
    if (!to) return false;
    scrollTo({ top: to(), behavior });
    const sec = document.getElementById(id)!;
    sec.tabIndex = -1;
    sec.focus({ preventScroll: true });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!jump(a.hash.slice(1), 'smooth')) return;
    e.preventDefault();
    history.pushState(null, '', a.hash);
  });
  addEventListener('scroll', showOne, { passive: true });
  // Zurück/Vor zu einem Bogen-Anker: dieselbe Position wie beim Klick (der Browser würde zum Element springen).
  addEventListener('popstate', () => requestAnimationFrame(() => jump(location.hash.slice(1), 'instant')));
  // Anker beim Laden (z. B. /#pakete) erst nach dem Aufbau der Pins anspringen.
  if (location.hash) requestAnimationFrame(() => jump(location.hash.slice(1), 'instant') || document.getElementById(location.hash.slice(1))?.scrollIntoView());
}
