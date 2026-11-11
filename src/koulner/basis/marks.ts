// Fettstift-Zeichen als SVG (Kreis, Oval, Strich, Rahmen).
const MARKS = {
  circle: ['M22 16C40 4 76 6 90 24C101 40 99 70 84 86C68 100 30 100 14 84C0 68 2 34 16 20C26 10 44 6 58 8', 'M80 14C92 22 98 34 97 46'],
  oval: ['M40 18C110 2 250 4 286 30C306 50 290 84 220 94C150 102 40 98 14 72C-4 52 14 26 70 14C110 6 160 6 190 10'],
  line: ['M2 6C30 2 70 2 98 5'],
  cross: ['M18 16C38 38 60 62 84 86', 'M82 14C64 36 40 62 16 84'],
  rect: [],
};
// viewBox passend zum üblichen Seitenverhältnis: ohne non-scaling-stroke bleibt pathLength verlässlich.
const VIEW = { circle: '0 0 100 100', oval: '0 0 300 100', line: '0 0 100 10', cross: '0 0 100 100', rect: '0 0 100 100' };
export const mark = (kind: keyof typeof MARKS, cls = '') =>
  `<svg class="mark mark-${kind} ${cls}" viewBox="${VIEW[kind]}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${MARKS[kind]
    .map((d) => `<path d="${d}" pathLength="1"/>`)
    .join('')}</svg>`;
