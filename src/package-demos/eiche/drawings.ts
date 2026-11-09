// Zeichnungen der Business-Demo Eiche & Form. Alle Darstellungen eines Falls entstehen aus
// derselben Geometrie: Aufmaß, Entwurf, Leisten, fertiges Möbel und Holzliste.
// Ursprung: pilot/eiche-form/strecke/drawings.mjs (Pilot vom 4. November 2026).

export type Nische = { bottom: number; top: number; left: number; right: number; lean?: number };
type P = [number, number];

/** Fall 14, erfunden. Millimeter. */
export const FALL14: Required<Nische> = { bottom: 1207, top: 1184, left: 2412, right: 2401, lean: 9 };
const GAP = 14;

export const de = (n: number) => Math.round(n).toLocaleString('de-DE');

/** Leitet aus vier (oder fünf) Maßen den rechtwinkligen Korpus und die Passleisten ab. */
export function solve(s: Nische) {
  const lean = s.lean ?? (s.bottom - s.top) / 2;
  const leanRight = s.bottom - s.top - lean;
  const width = Math.min(s.top, s.bottom) - 2 * GAP;
  const x0 = Math.max(0, lean) + GAP;
  const x1 = x0 + width;
  const minH = Math.min(s.left, s.right);
  return {
    lean, leanRight, width, x0, x1, minH,
    height: minH - 18 - 8,
    leftTop: x0 - lean, leftBottom: x0,
    rightTop: s.bottom - leanRight - x1, rightBottom: s.bottom - x1,
    plinthLeft: s.left - minH + 8, plinthRight: s.right - minH + 8,
  };
}

const F = (n: number) => +n.toFixed(1);
const poly = (pts: P[], attrs = '') => `<polygon points="${pts.map(p => `${F(p[0])},${F(p[1])}`).join(' ')}" ${attrs}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, cls = 'l-ink') => `<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" class="${cls}"/>`;
const rect = (x: number, y: number, w: number, h: number, attrs = '') => `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" ${attrs}/>`;
const text = (x: number, y: number, value: string, cls = 'dim', extra = '') => `<text x="${F(x)}" y="${F(y)}" class="${cls}" ${extra}>${value}</text>`;
const tick = (x: number, y: number, c: string) => `<line x1="${F(x - 22)}" y1="${F(y + 22)}" x2="${F(x + 22)}" y2="${F(y - 22)}" class="${c}"/>`;

function dimH(x1: number, x2: number, y: number, label: string, c = 'l-dim', tc = 'dim dim--rot') {
  return line(x1, y, x2, y, c) + tick(x1, y, c) + tick(x2, y, c) + text((x1 + x2) / 2, y - 34, label, tc, 'text-anchor="middle"');
}
function dimV(x: number, y1: number, y2: number, label: string, c = 'l-dim', tc = 'dim dim--rot', side = -1) {
  const tx = x + side * 34, ty = (y1 + y2) / 2;
  const hang = side > 0 ? 'dominant-baseline="hanging" ' : '';
  return line(x, y1, x, y2, c) + tick(x, y1, c) + tick(x, y2, c) + text(tx, ty, label, tc, `${hang}text-anchor="middle" transform="rotate(-90 ${F(tx)} ${F(ty)})"`);
}

type Ctx = { g: ReturnType<typeof solve>; s: Nische; k: number; ox: number; oy: number; tl: P; tr: P; floorL: number; floorR: number };

function shell(s: Nische, k: number, title: string, body: (c: Ctx) => string, opts: { tight?: boolean; lot?: boolean } = {}) {
  const g = solve(s);
  const ox = opts.tight ? 300 : 640, oy = opts.tight ? 200 : 430;
  const W = ox * 2 + s.bottom, H = oy * 2 + Math.max(s.left, s.right);
  const floorL = oy + g.minH + k * (s.left - g.minH);
  const floorR = oy + g.minH + k * (s.right - g.minH);
  const tl: P = [ox + k * g.lean, oy];
  const tr: P = [ox + s.bottom - k * g.leanRight, oy];
  const outline: P[] = [tl, tr, [ox + s.bottom, floorR], [ox, floorL]];
  const walls = rect(ox - 300, oy - 200, s.bottom + 600, Math.max(floorL, floorR) - oy + 400, 'fill="url(#ef-hatch)"');
  const lot = opts.lot === false ? '' : line(ox, oy, ox, floorL, 'l-lot') + line(ox + s.bottom, oy, ox + s.bottom, floorR, 'l-lot');
  const content = body({ g, s, k, ox, oy, tl, tr, floorL, floorR });
  return `<svg class="zeichnung" viewBox="0 0 ${W} ${F(H)}" role="img" aria-label="${title}">${walls}${poly(outline, 'class="nische"')}${lot}${content}${poly(outline, 'class="wand"')}</svg>`;
}

function measures({ s, ox, oy, tl, tr, floorL, floorR, k }: Ctx) {
  const by = Math.max(floorL, floorR) + 300;
  const leftX = ox - 410, rightX = ox + s.bottom + 410;
  const wedges = k > 1
    ? poly([[ox, oy], tl, [ox, floorL]], 'class="schiefe"') + poly([[ox + s.bottom, oy], tr, [ox + s.bottom, floorR]], 'class="schiefe"')
    : '';
  return wedges
    + dimH(tl[0], tr[0], oy - 300, `${de(s.top)} oben`)
    + dimH(ox, ox + s.bottom, by, `${de(s.bottom)} unten`)
    + dimV(leftX, oy, floorL, `${de(s.left)} links`)
    + dimV(rightX, oy, floorR, `${de(s.right)} rechts`, 'l-dim', 'dim dim--rot', 1)
    + line(tl[0], oy - 300, tl[0], oy - 40, 'l-hilf') + line(tr[0], oy - 300, tr[0], oy - 40, 'l-hilf')
    + line(ox, floorL + 40, ox, by, 'l-hilf') + line(ox + s.bottom, floorR + 40, ox + s.bottom, by, 'l-hilf')
    + line(leftX, oy, ox - 40, oy, 'l-hilf') + line(leftX, floorL, ox - 40, floorL, 'l-hilf')
    + line(rightX, oy, ox + s.bottom + 40, oy, 'l-hilf') + line(rightX, floorR, ox + s.bottom + 40, floorR, 'l-hilf');
}

const riser = (c: Ctx) => rect(c.ox + c.s.bottom - 190, c.oy, 34, Math.min(c.floorL, c.floorR) - c.oy, 'class="rohr"');

function carcassBox(c: Ctx) {
  const x0 = Math.max(c.tl[0], c.ox) + 14;
  const x1 = Math.min(c.tr[0], c.ox + c.s.bottom) - 14;
  return { x0, x1, y0: c.oy + 18, y1: c.oy + c.g.minH - 8, ok: x1 > x0 };
}

const wedgesOak = (c: Ctx, x0: number, x1: number) =>
  poly([c.tl, [x0, c.oy], [x0, c.floorL], [c.ox, c.floorL]], 'fill="url(#ef-oak-a)" class="leiste"')
  + poly([c.tr, [x1, c.oy], [x1, c.floorR], [c.ox + c.s.bottom, c.floorR]], 'fill="url(#ef-oak-b)" class="leiste"');

/** Die leere Nische, wie sie aufgemessen wurde. */
export function aufmass(s: Nische = FALL14, k = 5) {
  const label = k > 1 ? '5-fach überhöht gezeichnete Nische' : 'Maßstäblich gezeichnete Nische';
  return shell(s, k, `${label}: unten ${de(s.bottom)}, oben ${de(s.top)}, links ${de(s.left)}, rechts ${de(s.right)} Millimeter.`, c => riser(c) + measures(c));
}

/** Live-Zeichnung im Formular. Die Maße stehen in den Eingabefeldern. */
export function nische(s: Nische, label = 'Ihre Nische, Abweichungen überhöht gezeichnet.') {
  const g = solve(s);
  const dev = Math.max(Math.abs(g.lean), Math.abs(g.leanRight), Math.abs(s.left - s.right), 1);
  const k = Math.min(5, (s.bottom * .22) / dev);
  return shell(s, k, label, c => {
    const b = carcassBox(c);
    return b.ok ? wedgesOak(c, b.x0, b.x1) + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"') : '';
  }, { tight: true });
}

/** Rechtwinkliger Korpus in der überhöhten Nische, die Luft ist markiert. */
export function entwurf(s: Nische = FALL14, k = 5) {
  const g = solve(s);
  return shell(s, k, `Rechtwinkliger Korpus, ${de(g.width)} Millimeter breit, in der schiefen Nische. Die Luft zu den Wänden ist rot markiert.`, c => {
    const b = carcassBox(c);
    const gaps = poly([c.tl, [b.x0, c.oy], [b.x0, c.floorL], [c.ox, c.floorL]], 'class="luft"')
      + poly([c.tr, [b.x1, c.oy], [b.x1, c.floorR], [c.ox + c.s.bottom, c.floorR]], 'class="luft"');
    const mid = (b.x0 + b.x1) / 2;
    return riser(c) + gaps + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"')
      + line(b.x0, b.y0 + 560, b.x1, b.y0 + 560) + line(b.x0, b.y1 - 500, b.x1, b.y1 - 500)
      + line(mid, b.y0, mid, b.y0 + 560) + line(mid, b.y1 - 460, mid, b.y1)
      + dimH(b.x0, b.x1, c.oy + 1180, `${de(g.width)} Korpus`, 'l-dim-ink', 'dim')
      + dimH(c.tl[0], c.tr[0], c.oy - 300, `${de(s.top)} oben`);
  });
}

/** Die Leisten eingesetzt, der Korpus als Umriss. */
export function leisten(s: Nische = FALL14, k = 5) {
  const g = solve(s);
  return shell(s, k, `Eichenleisten zwischen Korpus und Wand. Links ${de(g.leftTop)} bis ${de(g.leftBottom)}, rechts ${de(g.rightTop)} bis ${de(g.rightBottom)} Millimeter.`, c => {
    const b = carcassBox(c);
    return riser(c) + wedgesOak(c, b.x0, b.x1) + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"')
      + text(b.x0 + 70, c.oy + 760, 'Der Korpus bleibt') + text(b.x0 + 70, c.oy + 860, 'rechtwinklig.')
      + dimH(c.ox, b.x0, c.floorL + 150, de(g.leftBottom)) + dimH(b.x1, c.ox + s.bottom, c.floorR + 150, de(g.rightBottom))
      + dimH(c.tl[0], b.x0, c.oy - 120, de(g.leftTop)) + dimH(b.x1, c.tr[0], c.oy - 120, de(g.rightTop));
  });
}

/** Das fertige Möbel. Von vorn ist die Schiefe nur noch in den Leisten. */
export function eingebaut(s: Nische = FALL14, k = 1, mitMassen = false) {
  const art = k > 1 ? 'mit 5-fach überhöhten Abweichungen, sodass die keilförmigen Passleisten sichtbar werden' : 'maßstäblich gezeichnet';
  return shell(s, k, `Fertige Garderobe aus Eiche in der Nische, ${art}: oben zwei Türen, Mitte offen mit Haken, unten Sitzbank mit zwei Schubkästen.`, c => {
    const { x0, x1, y0, y1 } = carcassBox(c);
    const w = x1 - x0, mid = x0 + w / 2;
    const upper = 560, bench = 500, seat = 44, sockel = 70, bw = 120;
    const yU = y0 + upper, yB = y1 - bench, hy = yU + 340;
    const out = [
      poly([c.tl, [x0, c.oy], [x0, c.floorL], [c.ox, c.floorL]], 'fill="url(#ef-oak-a)"'),
      poly([c.tr, [x1, c.oy], [x1, c.floorR], [c.ox + s.bottom, c.floorR]], 'fill="url(#ef-oak-b)"'),
      poly([[x0, c.oy], [x1, c.oy], [x1, y0], [x0, y0]], 'fill="url(#ef-oak-h)"'),
      poly([[x0, y1], [x1, y1], [x1, c.floorR], [x0, c.floorL]], 'fill="url(#ef-oak-h)"'),
      rect(x0, yU, w, yB - yU, 'fill="url(#ef-oak-d)"'), rect(x0, yU, w, yB - yU, 'class="ruecken"'), rect(x0, yU, w, 230, 'fill="url(#ef-shade)"'),
      rect(x1 - bw, yU, bw, yB - yU, 'fill="url(#ef-oak-b)"'), line(x1 - bw, yU, x1 - bw, yB, 'l-fuge'),
      rect(x0, hy - 38, w - bw, 76, 'fill="url(#ef-oak-h)"'), line(x0, hy + 38, x1 - bw, hy + 38, 'l-fuge'),
      ...Array.from({ length: 5 }, (_, i) => `<circle cx="${F(x0 + (w - bw) * (i + .5) / 5)}" cy="${F(hy)}" r="17" class="haken"/>`),
      rect(x0, y0, w / 2, upper, 'fill="url(#ef-oak-a)"'), rect(mid, y0, w / 2, upper, 'fill="url(#ef-oak-c)"'),
      line(mid, y0, mid, yU, 'l-fuge'), rect(mid - 16, yU - 150, 32, 110, 'class="griff"'), line(x0, yU, x1, yU, 'l-fuge'),
      rect(x0, yB, w, seat, 'fill="url(#ef-oak-h)"'), line(x0, yB + seat, x1, yB + seat, 'l-fuge'),
      rect(x0, yB + seat, w / 2, bench - seat - sockel, 'fill="url(#ef-oak-c)"'), rect(mid, yB + seat, w / 2, bench - seat - sockel, 'fill="url(#ef-oak-a)"'),
      line(mid, yB + seat, mid, y1 - sockel, 'l-fuge'),
      rect(x0 + w / 4 - 60, yB + seat + 44, 120, 26, 'class="griff"'), rect(mid + w / 4 - 60, yB + seat + 44, 120, 26, 'class="griff"'),
      rect(x0, y1 - sockel, w, sockel, 'class="sockel"'), rect(x0, y0, w, y1 - y0, 'class="kontur"'),
    ];
    if (mitMassen) out.push(measures(c));
    return out.join('');
  }, { lot: k > 1 });
}

/** Horizontalschnitt durch Wand, Passleiste und Korpus, oben und unten. */
export function detail(s: Nische = FALL14) {
  const g = solve(s);
  const part = (ox: number, gap: number, title: string) => {
    const wallX = ox + 96, carcass = wallX + gap + 2;
    const edge = `M${wallX} 40 C${wallX + 2.5} 62 ${wallX - 3} 76 ${wallX + 1.5} 96 S${wallX - 2.5} 132 ${wallX + 2} 150 L${wallX + 1} 176`;
    return `<path d="${edge} L${ox} 176 L${ox} 40 Z" fill="url(#ef-hatch-fine)"/><path d="${edge}" class="wand" fill="none"/>`
      + `<path d="${edge} L${carcass} 176 L${carcass} 40 Z" fill="url(#ef-oak-fine)" class="leiste"/>`
      + rect(carcass, 40, 24, 136, 'fill="url(#ef-oak-fine)" class="schnitt"')
      + rect(carcass + 24, 40, 56, 22, 'class="front" fill="url(#ef-oak-fine-h)"')
      + line(carcass + 24, 62, carcass + 24, 176, 'l-fuge-fine')
      + `<text x="${ox}" y="26" class="dim-klein dim-klein--stark">${title}</text>`
      + line(wallX, 192, carcass, 192, 'l-dim-fine') + line(wallX, 186, wallX, 198, 'l-dim-fine') + line(carcass, 186, carcass, 198, 'l-dim-fine')
      + `<text x="${(wallX + carcass) / 2}" y="212" class="dim-klein dim-klein--rot" text-anchor="middle">${de(gap)} mm</text>`;
  };
  return `<svg class="zeichnung zeichnung--detail" viewBox="0 0 420 224" role="img" aria-label="Horizontalschnitt durch die rechte Wand: Oben ist die Passleiste ${de(g.rightTop)} Millimeter breit, unten ${de(g.rightBottom)} Millimeter. Die Leiste folgt der unruhigen Putzkante, der Korpus bleibt gerade.">${part(4, g.rightTop, 'Rechte Seite, oben')}${part(214, g.rightBottom, 'Rechte Seite, unten')}</svg>`;
}

/** Fall 22, erfunden: Bücherwand um eine Tür. Decke fällt nach rechts, linke Zarge steht schief. */
export const FALL22 = { breite: 3400, hoeheL: 2985, hoeheR: 2969, tuerX: 1258, tuerB: 885, tuerH: 2040, zarge: 7 };

export function fall22Leisten() {
  const f = FALL22;
  return { decke: [8, 8 + f.hoeheL - f.hoeheR] as const, zarge: [6, 6 + f.zarge] as const };
}

export function buecherwand(k = 5) {
  const f = FALL22, ox = 360, oy = 520;
  const W = f.breite + 720, H = f.hoeheL + 1000;
  const yC = (x: number) => oy + (k * (f.hoeheL - f.hoeheR) * x) / f.breite; // Decke fällt nach rechts
  const floor = oy + f.hoeheL;
  const dx = f.tuerX, dy = floor - f.tuerH;
  const lean = k * f.zarge;
  const [dL, dR] = fall22Leisten().decke;
  const topBand = Math.max(dL, dR) * k + 16;
  const out: string[] = [];
  out.push(rect(ox - 300, oy - 260, f.breite + 600, f.hoeheL + 420, 'fill="url(#ef-hatch)"'));
  out.push(poly([[ox, yC(0)], [ox + f.breite, yC(f.breite)], [ox + f.breite, floor], [ox, floor]], 'class="nische"'));
  // Regalkorpus: unterhalb des tiefsten Deckenpunkts, links und rechts der Tür, Brücke darüber
  const top = oy + k * (f.hoeheL - f.hoeheR) + topBand;
  const fill = (x: number, w: number, y: number, h: number, p: string) => rect(ox + x, y, w, h, `fill="url(#${p})" class="kontur-mittel"`);
  const doorL = dx - 30, doorR = dx + f.tuerB + 30;
  out.push(fill(0, doorL, top, floor - top, 'ef-oak-a'));
  out.push(fill(doorR, f.breite - doorR, top, floor - top, 'ef-oak-c'));
  out.push(fill(doorL, doorR - doorL, top, dy - top - 60, 'ef-oak-h'));
  for (let y = top + 380; y < floor - 200; y += 380) {
    out.push(line(ox, y, ox + doorL, y, 'l-fach'), line(ox + doorR, y, ox + f.breite, y, 'l-fach'));
  }
  for (const x of [doorL / 2, doorR + (f.breite - doorR) / 2]) out.push(line(ox + x, top, ox + x, floor, 'l-fach'));
  out.push(line(ox + doorL, dy - 60 - 190, ox + doorR, dy - 60 - 190, 'l-fach'));
  // Tür mit schiefer linker Zarge
  out.push(poly([[ox + dx + lean, dy], [ox + dx + f.tuerB, dy], [ox + dx + f.tuerB, floor], [ox + dx, floor]], 'class="tuer"'));
  out.push(poly([[ox + doorL, dy - 60], [ox + dx + lean, dy - 60], [ox + dx, floor], [ox + doorL, floor]], 'fill="url(#ef-oak-b)" class="leiste"'));
  // Deckenleiste als Keil
  out.push(poly([[ox, yC(0)], [ox + f.breite, yC(f.breite)], [ox + f.breite, top], [ox, top]], 'fill="url(#ef-oak-h)" class="leiste"'));
  out.push(poly([[ox, yC(0)], [ox + f.breite, yC(f.breite)], [ox + f.breite, floor], [ox, floor]], 'class="wand-fein"'));
  out.push(line(ox, oy, ox + f.breite, oy, 'l-lot'));
  out.push(dimH(ox, ox + f.breite, oy - 140, `${de(f.breite)} Wand`));
  out.push(dimV(ox - 160, oy, floor, `${de(f.hoeheL)} links`));
  out.push(dimV(ox + f.breite + 160, yC(f.breite), floor, `${de(f.hoeheR)} rechts`, 'l-dim', 'dim dim--rot', 1));
  out.push(dimH(ox + dx, ox + dx + f.tuerB, floor + 190, `${de(f.tuerB)} Tür`, 'l-dim-ink', 'dim'));
  out.push(text(ox + dx + lean + 40, dy + 520, `Zarge ${f.zarge} mm`, 'dim dim--rot'));
  out.push(text(ox + dx + lean + 40, dy + 620, 'außer Lot', 'dim dim--rot'));
  out.push(text(ox + f.breite - 40, top - 70, `Deckenleiste ${dL} bis ${dR} mm`, 'dim dim--rot', 'text-anchor="end"'));
  return `<svg class="zeichnung zeichnung--breit" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ansicht einer Bücherwand um eine Tür, Abweichungen 5-fach überhöht: Die Decke fällt auf ${de(f.breite)} Millimetern um ${de(f.hoeheL - f.hoeheR)} Millimeter, die linke Türzarge steht ${f.zarge} Millimeter außer Lot. Eine keilförmige Deckenleiste und eine Leiste an der Zarge gleichen das aus.">${out.join('')}</svg>`;
}

/** Fall 9, erfunden: Küchenzeile vor einer Wand, die sich in der Mitte vorwölbt. Grundriss. */
export const FALL9 = { laenge: 3100, bauch: 12, tiefe: 620 };

export function kuechenplan(k = 12) {
  const f = FALL9, ox = 260, oy = 300;
  const W = f.laenge + 520, H = 1420;
  const wallY = (x: number) => oy + k * f.bauch * Math.sin(Math.PI * x / f.laenge); // Wand wölbt sich in den Raum
  const pts: P[] = Array.from({ length: 41 }, (_, i) => { const x = f.laenge * i / 40; return [ox + x, wallY(x)]; });
  const front = oy + k * f.bauch + f.tiefe;
  const out: string[] = [];
  out.push(`<path d="M${ox - 200} ${oy - 220} H${ox + f.laenge + 200} V${oy} H${ox + f.laenge} ${pts.slice().reverse().map(p => `L${F(p[0])} ${F(p[1])}`).join(' ')} H${ox - 200} Z" fill="url(#ef-hatch)"/>`);
  // Arbeitsplatte: hinten an der Wand angerissen, vorn gerade
  out.push(`<path d="M${ox} ${oy} ${pts.map(p => `L${F(p[0])} ${F(p[1])}`).join(' ')} L${ox + f.laenge} ${front} L${ox} ${front} Z" fill="url(#ef-oak-h)" class="leiste"/>`);
  // Unterschränke, gerade und bündig mit der Wandmitte
  const back = oy + k * f.bauch;
  for (let x = 0; x < f.laenge; x += 600) out.push(rect(ox + x + 4, back + 12, Math.min(600, f.laenge - x) - 8, f.tiefe - 40, 'class="unterschrank"'));
  out.push(rect(ox + 760, back + 120, 520, 380, 'class="spuele"'), rect(ox + 1960, back + 100, 580, 420, 'class="kochfeld"'));
  // Rot: der Teil der Platte, der hinter den Schränken an die Wand angerissen wird
  out.push(`<path d="M${ox} ${back} L${pts.map(p => `${F(p[0])} ${F(p[1])}`).join(' L')} L${ox + f.laenge} ${back} Z" class="luft"/>`);
  out.push(line(ox, back, ox + f.laenge, back, 'l-rueckseite'));
  out.push(`<path d="M${pts.map(p => `${F(p[0])} ${F(p[1])}`).join(' L')}" class="wand"/>`);
  out.push(line(ox, oy, ox + f.laenge, oy, 'l-lot'));
  out.push(dimH(ox, ox + f.laenge, front + 200, `${de(f.laenge)} Zeile`, 'l-dim-ink', 'dim'));
  out.push(dimV(ox + f.laenge / 2 + 60, oy, back, `${f.bauch} mm`, 'l-dim', 'dim dim--rot', 1));
  return `<svg class="zeichnung zeichnung--breit zeichnung--plan" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grundriss einer Küchenzeile, Abweichung 12-fach überhöht: Die Wand wölbt sich in der Mitte ${f.bauch} Millimeter in den Raum. Die Unterschränke stehen gerade, die Arbeitsplatte ist hinten an die Wand angerissen.">${out.join('')}</svg>`;
}

/** Vier kleine Situationen in derselben Strichsprache. */
export function situation(kind: 'schraege' | 'erker' | 'heizung' | 'tuer') {
  const open = (label: string, inner: string) => `<svg class="zeichnung zeichnung--klein" viewBox="0 0 320 240" role="img" aria-label="${label}">${inner}</svg>`;
  if (kind === 'schraege') return open('Schnitt durch eine Dachschräge mit Schrank darunter', `<path d="M24 205 V132 L280 28 V205 Z" fill="url(#ef-oak-a)" class="kontur-klein"/><path d="M0 141.8 L320 12" class="wand-klein"/><path d="M0 205 H320" class="wand-klein"/><path d="M152 205 V80" class="l-klein"/><path d="M24 205 H280" class="l-klein"/><text x="44" y="108" class="dim-s dim-s--rot" transform="rotate(-22 44 108)">38°</text>`);
  if (kind === 'erker') return open('Grundriss eines Erkers mit Sitzbank, die den Wänden folgt', `<path d="M0 40 H72 L112 170 H208 L248 40 H320" class="wand-klein"/><path d="M0 26 H62 L102 184 H218 L258 26 H320" class="l-klein"/><polygon points="72,40 112,170 208,170 248,40 212,40 186,128 134,128 108,40" fill="url(#ef-oak-a)" class="kontur-klein"/><text x="60" y="118" class="dim-s dim-s--rot" text-anchor="end">107°</text><text x="260" y="118" class="dim-s dim-s--rot">104°</text>`);
  if (kind === 'heizung') return open('Ansicht einer Heizkörpernische mit Verkleidung und Luftschlitzen', `<path d="M40 220 V24 H280 V220" class="wand-klein"/><path d="M0 220 H320" class="wand-klein"/><rect x="62" y="120" width="196" height="100" fill="url(#ef-oak-c)" class="kontur-klein"/><rect x="62" y="110" width="196" height="10" fill="url(#ef-oak-h)" class="kontur-klein"/>${Array.from({ length: 13 }, (_, i) => `<rect x="${78 + i * 13}" y="136" width="5" height="62" class="schlitz"/>`).join('')}<path d="M100 96 C96 80 106 72 100 56 M160 96 C156 80 166 72 160 56 M220 96 C216 80 226 72 220 56" class="l-rot"/>`);
  return open('Ansicht einer Bücherwand, die um eine Tür herum gebaut ist', `<path d="M0 226 H320" class="wand-klein"/><path d="M18 226 V14 H302 V226 H204 V92 H116 V226 Z" fill="url(#ef-oak-a)" class="kontur-klein"/><path d="M18 62 H302 M18 110 H116 M204 110 H302 M18 158 H116 M204 158 H302 M18 204 H116 M204 204 H302 M67 14 V226 M253 14 V226 M160 14 V62" class="l-klein"/><rect x="116" y="92" width="88" height="134" class="tuer"/><text x="160" y="164" class="dim-s dim-s--rot" text-anchor="middle">Türmaß</text>`);
}

/** Gemeinsame Definitionen. Einmal je Seite; holz ist die vollständige URL der Holzstruktur. */
export function defs(holz: string) {
  const oak = (id: string, x: number, y: number, rotate = false) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="1000" height="2000" patternTransform="translate(${x} ${y})${rotate ? ' rotate(90)' : ''}"><image href="${holz}" width="1000" height="2000"/></pattern>`;
  return `<svg class="ef-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>`
    + `<pattern id="ef-hatch" patternUnits="userSpaceOnUse" width="46" height="46" patternTransform="rotate(45)"><rect width="46" height="46" fill="var(--wand)"/><line x1="0" y1="0" x2="0" y2="46" stroke="var(--tusche)" stroke-width="5"/></pattern>`
    + `<pattern id="ef-hatch-fine" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--wand)"/><line x1="0" y1="0" x2="0" y2="7" stroke="var(--tusche)" stroke-width=".7"/></pattern>`
    + oak('ef-oak-a', 0, 0) + oak('ef-oak-b', 310, 700) + oak('ef-oak-c', 640, 240) + oak('ef-oak-d', 150, 1120) + oak('ef-oak-h', 0, 30, true)
    + `<pattern id="ef-oak-fine" patternUnits="userSpaceOnUse" width="180" height="360"><image href="${holz}" width="180" height="360"/></pattern>`
    + `<pattern id="ef-oak-fine-h" patternUnits="userSpaceOnUse" width="180" height="360" patternTransform="rotate(90)"><image href="${holz}" width="180" height="360"/></pattern>`
    + `<linearGradient id="ef-shade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#15120e" stop-opacity=".55"/><stop offset="1" stop-color="#15120e" stop-opacity="0"/></linearGradient>`
    + `</defs></svg>`;
}
