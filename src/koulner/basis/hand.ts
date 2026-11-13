// Selbst Hand anlegen: Bilder mit dem Fettstift markieren (Kreis oder Kreuz) (alle Stufen) und die Lupe mit der Maus führen (Stufe 2 und 3).
// Ohne Bewegungsbibliothek, damit Stufe 1 leicht bleibt.
import { mark } from './marks';

export type Mark = 'like' | 'nope';
type Marked = { id: string; no: string };
/** Inhalt des Events `marks` nach jeder Änderung, in Markierungsreihenfolge. */
export interface MarksDetail {
  likes: Marked[];
  nopes: Marked[];
}

const mine = new Map<string, Mark>();
const NEXT: Record<'none' | Mark, 'none' | Mark> = { none: 'like', like: 'nope', nope: 'none' };
const SAY = { none: 'nicht markiert', like: 'gefällt mir', nope: 'nicht mein Stil' };

/** Klick, Tippen, Enter oder Leertaste auf ein Bildfeld: leer → Kreis (gefällt mir) → Kreuz (nicht mein Stil) → leer. */
function marks() {
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);
  const noOf = (id: string) => document.querySelector(`.bogen .grid .cell[data-id="${id}"]:not(.lens-view .cell) .no`)?.textContent ?? '';

  const sync = (id: string, state: 'none' | Mark) => {
    // Alle Vorkommen des Bilds: Gesamtbogen im Einstieg, Bogen und dessen Kopien in den Lupen.
    document.querySelectorAll<HTMLElement>(`.cell[data-id="${id}"]`).forEach((cell) => {
      const frame = cell.querySelector<HTMLElement>('.frame')!;
      if (!frame.querySelector('.mark.mine')) {
        frame.insertAdjacentHTML('beforeend', mark('circle', 'mine') + mark('cross', 'nope'));
        void frame.offsetWidth; // erst einsetzen, dann zeichnen: sonst springt der Strich ohne Übergang
      }
      cell.classList.toggle('is-mine', state === 'like');
      cell.classList.toggle('is-nope', state === 'nope');
      if (frame.dataset.label) frame.setAttribute('aria-label', `${frame.dataset.label}: ${SAY[state]}`);
    });
    live.textContent = `Nr. ${noOf(id)}: ${SAY[state]}`;
    const pick = (m: Mark) => [...mine].filter(([, v]) => v === m).map(([k]) => ({ id: k, no: noOf(k) }));
    document.dispatchEvent(new CustomEvent<MarksDetail>('marks', { detail: { likes: pick('like'), nopes: pick('nope') } }));
  };

  document.querySelectorAll<HTMLElement>('.bogen .grid:not(.lens-view .grid)').forEach((grid) => {
    const btns = [...grid.querySelectorAll<HTMLButtonElement>('button.frame')];
    btns.forEach((b, i) => (b.tabIndex = i ? -1 : 0));
    grid.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button.frame');
      if (!b) return;
      const id = b.closest<HTMLElement>('.cell')!.dataset.id!;
      const state = NEXT[mine.get(id) ?? 'none'];
      mine.delete(id); // neu einreihen: Reihenfolge der Auswahl folgt dem letzten Markieren
      if (state !== 'none') mine.set(id, state);
      sync(id, state);
    });
    // Ein Tab-Halt je Bogen, Pfeiltasten wandern durch die Bildfelder.
    grid.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: btns.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = Math.max(0, Math.min(btns.length - 1, to));
      btns[i].tabIndex = -1;
      btns[n].tabIndex = 0;
      btns[n].focus({ preventScroll: true });
    });
  });
}

/** Zweite Lupe, die dem Mauszeiger folgt. Solange sie auf dem Bogen liegt, ruht die Lupe der Scroll-Zeitachse. */
function handLens(sheet: HTMLElement, reduce: boolean) {
  const auto = sheet.querySelector<HTMLElement>('.lens:not(.hand)');
  if (!auto) return;
  const lens = auto.cloneNode(true) as HTMLElement;
  lens.removeAttribute('style');
  lens.classList.add('hand');
  sheet.append(lens);
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;
  let on = false;
  const set = () => {
    lens.style.setProperty('--lx', x.toFixed(1));
    lens.style.setProperty('--ly', y.toFixed(1));
  };
  // Nachlauf nur in der bewegten Fassung; ruhig folgt die Lupe direkt.
  const step = () => {
    const a = reduce ? 1 : 0.3;
    x += (tx - x) * a;
    y += (ty - y) * a;
    set();
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.2 ? requestAnimationFrame(step) : 0;
  };
  sheet.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = sheet.getBoundingClientRect();
    const k = r.width / sheet.offsetWidth; // Bogen kann während der Fahrt skaliert sein
    tx = (e.clientX - r.left) / k - sheet.clientLeft;
    ty = (e.clientY - r.top) / k - sheet.clientTop;
    if (!on) {
      on = true;
      const cw = sheet.querySelector<HTMLElement>('.grid .frame')!.offsetWidth;
      lens.style.setProperty('--d', `${Math.min(cw * 1.7, sheet.offsetWidth * 0.46)}px`);
      lens.style.setProperty('--sw', `${sheet.clientWidth}px`);
      lens.style.setProperty('--k', '2.1');
      x = tx;
      y = ty;
      set();
      sheet.classList.add('is-hand');
    }
    if (!raf) raf = requestAnimationFrame(step);
  });
  // Nach dem Markieren hebt sich die Lupe kurz ab, damit der Kreis zu sehen ist (er ist größer als ihr Glas).
  let lift = 0;
  sheet.addEventListener('click', () => {
    sheet.classList.add('is-drawing');
    clearTimeout(lift);
    lift = window.setTimeout(() => sheet.classList.remove('is-drawing'), 900);
  });
  sheet.addEventListener('pointerleave', () => {
    on = false;
    sheet.classList.remove('is-hand');
  });
}

export function initHand(lens: boolean, reduce: boolean) {
  marks();
  if (lens && matchMedia('(hover: hover) and (pointer: fine)').matches) document.querySelectorAll<HTMLElement>('.bogen .sheet').forEach((s) => handLens(s, reduce));
}
