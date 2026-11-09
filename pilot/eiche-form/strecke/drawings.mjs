// Einzige Quelle aller Zeichnungen. Wird beim Bau in Node und für die Live-Zeichnung
// im Browser verwendet, damit Aufmaß, Entwurf, Detail und Einbau dieselbe Geometrie teilen.

/** Fiktiver Raumfall. Alle Maße in Millimetern, erfunden. */
export const FALL14 = { bottom: 1207, top: 1184, left: 2412, right: 2401, lean: 9 };
const GAP = 14;

export const de = n => Math.round(n).toLocaleString('de-DE');

/** Leitet aus vier (oder fünf) Maßen den rechtwinkligen Korpus und die Passleisten ab. */
export function solve(s) {
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

const F = n => +n.toFixed(1);
const poly = (pts, attrs = '') => `<polygon points="${pts.map(p => `${F(p[0])},${F(p[1])}`).join(' ')}" ${attrs}/>`;
const line = (x1, y1, x2, y2, cls = 'l-ink') => `<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" class="${cls}"/>`;
const rect = (x, y, w, h, attrs = '') => `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" ${attrs}/>`;
const text = (x, y, value, cls = 'dim', extra = '') => `<text x="${F(x)}" y="${F(y)}" class="${cls}" ${extra}>${value}</text>`;

const tick = (x, y, c) => `<line x1="${F(x - 22)}" y1="${F(y + 22)}" x2="${F(x + 22)}" y2="${F(y - 22)}" class="${c}"/>`;

function dimH(x1, x2, y, label, c = 'l-dim', tc = 'dim dim--rot') {
  const off = 34;
  return line(x1, y, x2, y, c) + tick(x1, y, c) + tick(x2, y, c) + text((x1 + x2) / 2, y - off, label, tc, 'text-anchor="middle"');
}
function dimV(x, y1, y2, label, c = 'l-dim', tc = 'dim dim--rot', side = -1) {
  const tx = x + side * 34, ty = (y1 + y2) / 2;
  const hang = side > 0 ? 'dominant-baseline="hanging" ' : '';
  return line(x, y1, x, y2, c) + tick(x, y1, c) + tick(x, y2, c) + text(tx, ty, label, tc, `${hang}text-anchor="middle" transform="rotate(-90 ${F(tx)} ${F(ty)})"`);
}

function frameFor(s, tight = false) {
  const ox = tight ? 300 : 640, oy = tight ? 200 : 430;
  return { ox, oy, W: ox * 2 + s.bottom, H: oy * 2 + Math.max(s.left, s.right) };
}

/** Grundgerüst: Mauerschnitt, Nische und Lot. k überhöht nur die Abweichungen. */
function shell(s, k, title, body, opts = {}) {
  const g = solve(s);
  const { ox, oy, W, H } = frameFor(s, opts.tight);
  const min = g.minH;
  const floorL = oy + min + k * (s.left - min);
  const floorR = oy + min + k * (s.right - min);
  const tl = [ox + k * g.lean, oy];
  const tr = [ox + s.bottom - k * g.leanRight, oy];
  const br = [ox + s.bottom, floorR];
  const bl = [ox, floorL];
  const pad = 300;
  const walls = rect(ox - pad, oy - 200, s.bottom + 2 * pad, Math.max(floorL, floorR) - oy + 400, 'fill="url(#ef-hatch)"');
  const niche = poly([tl, tr, br, bl], 'class="nische"');
  const lot = opts.lot === false ? '' : line(ox, oy, ox, floorL, 'l-lot') + line(ox + s.bottom, oy, ox + s.bottom, floorR, 'l-lot');
  const ctx = { g, s, k, ox, oy, tl, tr, br, bl, floorL, floorR, W, H };
  const content = body(ctx);
  return `<svg class="zeichnung" viewBox="0 0 ${W} ${F(H)}" role="img" aria-label="${title}">${walls}${niche}${lot}${content}${poly([tl, tr, br, bl], 'class="wand"')}</svg>`;
}

function measures({ s, ox, oy, tl, tr, floorL, floorR, k, g }) {
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

const riser = ctx => {
  const x = ctx.ox + ctx.s.bottom - 190;
  return rect(x, ctx.oy, 34, Math.min(ctx.floorL, ctx.floorR) - ctx.oy, 'class="rohr"');
};

/** Die leere Nische, wie sie aufgemessen wurde. */
export function aufmass(s = FALL14, k = 5, withRiser = true) {
  const label = k > 1 ? `5-fach überhöht gezeichnete Nische` : 'Maßstäblich gezeichnete Nische';
  return shell(s, k, `${label}: unten ${de(s.bottom)}, oben ${de(s.top)}, links ${de(s.left)}, rechts ${de(s.right)} Millimeter.`,
    ctx => (withRiser ? riser(ctx) : '') + measures(ctx));
}

function carcassBox(ctx) {
  const { g, s, k, ox, oy, tl, tr, floorL, floorR } = ctx;
  // Bei Überhöhung bleibt der Korpus rechtwinklig und wird in die engste Stelle gesetzt.
  const inset = 14;
  const x0 = Math.max(tl[0], ox) + inset;
  const x1 = Math.min(tr[0], ox + s.bottom) - inset;
  const y0 = oy + 18;
  const y1 = oy + g.minH - 8;
  return { x0, x1, y0, y1, floorL, floorR, ok: x1 > x0 };
}

/** Live-Zeichnung im Formular: Nische mit Korpus und Leisten, Maße stehen in den Eingabefeldern. */
export function nische(s, label = 'Ihre Nische, Abweichungen überhöht gezeichnet.') {
  const g = solve(s);
  const dev = Math.max(Math.abs(g.lean), Math.abs(g.leanRight), Math.abs(s.left - s.right), 1);
  const k = Math.min(5, (s.bottom * .22) / dev);
  return shell(s, k, label, ctx => {
    const b = carcassBox(ctx);
    const { tl, tr, ox, s: sp, floorL, floorR, oy } = ctx;
    const a = b.ok ? poly([tl, [b.x0, oy], [b.x0, floorL], [ox, floorL]], 'fill="url(#ef-oak-a)" class="leiste"')
      + poly([tr, [b.x1, oy], [b.x1, floorR], [ox + sp.bottom, floorR]], 'fill="url(#ef-oak-b)" class="leiste"')
      + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"') : '';
    return a;
  }, { tight: true });
}

/** Rechtwinkliger Korpus in der (überhöhten) Nische, die Luft ist markiert. */
export function entwurf(s = FALL14, k = 5) {
  const g = solve(s);
  return shell(s, k, `Rechtwinkliger Korpus, ${de(g.width)} Millimeter breit, in der schiefen Nische. Die Luft zu den Wänden ist rot markiert.`, ctx => {
    const b = carcassBox(ctx);
    const { tl, tr, ox, s: sp, floorL, floorR, oy } = ctx;
    const gaps = poly([tl, [b.x0, oy], [b.x0, floorL], [ox, floorL]], 'class="luft"')
      + poly([tr, [b.x1, oy], [b.x1, floorR], [ox + sp.bottom, floorR]], 'class="luft"');
    return riser(ctx) + gaps
      + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"')
      + line(b.x0, b.y0 + 560, b.x1, b.y0 + 560) + line(b.x0, b.y1 - 500, b.x1, b.y1 - 500)
      + line((b.x0 + b.x1) / 2, b.y0, (b.x0 + b.x1) / 2, b.y0 + 560)
      + line((b.x0 + b.x1) / 2, b.y1 - 460, (b.x0 + b.x1) / 2, b.y1)
      + dimH(b.x0, b.x1, oy + 1180, `${de(g.width)} Korpus`, 'l-dim-ink', 'dim')
      + dimH(tl[0], tr[0], oy - 300, `${de(sp.top)} oben`);
  });
}

/** Die Leisten eingesetzt, Korpus noch als Linie. */
export function leisten(s = FALL14, k = 5) {
  const g = solve(s);
  return shell(s, k, `Eichenleisten zwischen Korpus und Wand. Links ${de(g.leftTop)} bis ${de(g.leftBottom)}, rechts ${de(g.rightTop)} bis ${de(g.rightBottom)} Millimeter.`, ctx => {
    const b = carcassBox(ctx);
    const { tl, tr, ox, s: sp, floorL, floorR, oy } = ctx;
    return riser(ctx)
      + poly([tl, [b.x0, oy], [b.x0, floorL], [ox, floorL]], 'fill="url(#ef-oak-a)" class="leiste"')
      + poly([tr, [b.x1, oy], [b.x1, floorR], [ox + sp.bottom, floorR]], 'fill="url(#ef-oak-b)" class="leiste"')
      + rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'class="korpus"')
      + text(b.x0 + 70, oy + 760, 'Der Korpus bleibt', 'dim')
      + text(b.x0 + 70, oy + 860, 'rechtwinklig.', 'dim')
      + dimH(ox, b.x0, floorL + 150, `${de(g.leftBottom)}`, 'l-dim', 'dim dim--rot')
      + dimH(b.x1, ox + sp.bottom, floorR + 150, `${de(g.rightBottom)}`, 'l-dim', 'dim dim--rot')
      + dimH(tl[0], b.x0, oy - 120, `${de(g.leftTop)}`, 'l-dim', 'dim dim--rot')
      + dimH(b.x1, tr[0], oy - 120, `${de(g.rightTop)}`, 'l-dim', 'dim dim--rot');
  });
}

/** Das fertige Möbel, maßstäblich. Von vorn ist die Schiefe nur noch in den Leisten. */
export function eingebaut(s = FALL14, k = 1, mitMassen = false) {
  const art = k > 1 ? 'mit 5-fach überhöhten Abweichungen, sodass die keilförmigen Passleisten sichtbar werden' : 'maßstäblich gezeichnet';
  return shell(s, k, `Fertige Garderobe aus Eiche in der Nische, ${art}: oben zwei Türen, Mitte offen mit Haken, unten Sitzbank mit zwei Schubkästen.`, ctx => {
    const { ox, oy, tl, tr, s: sp, floorL, floorR } = ctx;
    const box = carcassBox(ctx);
    const x0 = box.x0, x1 = box.x1;
    const y0 = box.y0, y1 = box.y1;
    const w = x1 - x0, mid = x0 + w / 2;
    const upper = 560, bench = 500, seat = 44;
    const yU = y0 + upper, yB = y1 - bench;
    const sockel = 70;
    const out = [];
    // Passleisten, oberer Abschluss, Bodenleiste
    out.push(poly([tl, [x0, oy], [x0, floorL], [ox, floorL]], 'fill="url(#ef-oak-a)"'));
    out.push(poly([tr, [x1, oy], [x1, floorR], [ox + sp.bottom, floorR]], 'fill="url(#ef-oak-b)"'));
    out.push(poly([[x0, oy], [x1, oy], [x1, y0], [x0, y0]], 'fill="url(#ef-oak-h)"'));
    out.push(poly([[x0, y1], [x1, y1], [x1, floorR], [x0, floorL]], 'fill="url(#ef-oak-h)"'));
    // Rückwand mit Licht von oben
    out.push(rect(x0, yU, w, yB - yU, 'fill="url(#ef-oak-d)"'));
    out.push(rect(x0, yU, w, yB - yU, 'class="ruecken"'));
    out.push(rect(x0, yU, w, 230, 'fill="url(#ef-shade)"'));
    // Blende vor der Steigleitung
    const bw = 120;
    out.push(rect(x1 - bw, yU, bw, yB - yU, 'fill="url(#ef-oak-b)"'));
    out.push(line(x1 - bw, yU, x1 - bw, yB, 'l-fuge'));
    // Hakenleiste
    const hy = yU + 340;
    out.push(rect(x0, hy - 38, w - bw, 76, 'fill="url(#ef-oak-h)"'));
    out.push(line(x0, hy + 38, x1 - bw, hy + 38, 'l-fuge'));
    for (let i = 0; i < 5; i++) {
      const hx = x0 + (w - bw) * (i + .5) / 5;
      out.push(`<circle cx="${F(hx)}" cy="${F(hy)}" r="17" class="haken"/>`);
    }
    // Obere Türen
    out.push(rect(x0, y0, w / 2, upper, 'fill="url(#ef-oak-a)"'));
    out.push(rect(mid, y0, w / 2, upper, 'fill="url(#ef-oak-c)"'));
    out.push(line(mid, y0, mid, yU, 'l-fuge'));
    out.push(rect(mid - 16, yU - 150, 32, 110, 'class="griff"'));
    out.push(line(x0, yU, x1, yU, 'l-fuge'));
    // Sitzbank und Schubkästen
    out.push(rect(x0, yB, w, seat, 'fill="url(#ef-oak-h)"'));
    out.push(line(x0, yB + seat, x1, yB + seat, 'l-fuge'));
    out.push(rect(x0, yB + seat, w / 2, bench - seat - sockel, 'fill="url(#ef-oak-c)"'));
    out.push(rect(mid, yB + seat, w / 2, bench - seat - sockel, 'fill="url(#ef-oak-a)"'));
    out.push(line(mid, yB + seat, mid, y1 - sockel, 'l-fuge'));
    out.push(rect(x0 + w / 4 - 60, yB + seat + 44, 120, 26, 'class="griff"'));
    out.push(rect(mid + w / 4 - 60, yB + seat + 44, 120, 26, 'class="griff"'));
    out.push(rect(x0, y1 - sockel, w, sockel, 'class="sockel"'));
    out.push(rect(x0, y0, w, y1 - y0, 'class="kontur"'));
    if (mitMassen) out.push(measures(ctx));
    return out.join('');
  }, { lot: k > 1 });
}

/** Detail: Schnitt durch Wand, Passleiste und Korpus, oben und unten. Maßstab 1:1 in mm. */
export function detail(s = FALL14) {
  const g = solve(s);
  const part = (ox, gap, title) => {
    const wallX = ox + 96;
    const carcass = wallX + gap + 2;
    // Unruhige Putzkante: genau deshalb wird angerissen.
    const edge = `M${wallX} 40 C${wallX + 2.5} 62 ${wallX - 3} 76 ${wallX + 1.5} 96 S${wallX - 2.5} 132 ${wallX + 2} 150 L${wallX + 1} 176`;
    const wall = `${edge} L${ox} 176 L${ox} 40 Z`;
    const leiste = `${edge} L${carcass} 176 L${carcass} 40 Z`;
    return `<path d="${wall}" fill="url(#ef-hatch-fine)"/><path d="${edge}" class="wand" fill="none"/>`
      + `<path d="${leiste}" fill="url(#ef-oak-fine)" class="leiste"/>`
      + rect(carcass, 40, 24, 136, 'fill="url(#ef-oak-fine)" class="schnitt"')
      + rect(carcass + 24, 40, 56, 22, 'class="front" fill="url(#ef-oak-fine-h)"')
      + line(carcass + 24, 62, carcass + 24, 176, 'l-fuge-fine')
      + `<text x="${ox}" y="26" class="dim-klein dim-klein--stark">${title}</text>`
      + line(wallX, 192, carcass, 192, 'l-dim-fine')
      + line(wallX, 186, wallX, 198, 'l-dim-fine') + line(carcass, 186, carcass, 198, 'l-dim-fine')
      + `<text x="${(wallX + carcass) / 2}" y="212" class="dim-klein dim-klein--rot" text-anchor="middle">${de(gap)} mm</text>`;
  };
  return `<svg class="zeichnung zeichnung--detail" viewBox="0 0 420 224" role="img" aria-label="Horizontalschnitt durch die rechte Wand: Oben ist die Passleiste ${de(g.rightTop)} Millimeter breit, unten ${de(g.rightBottom)} Millimeter. Die Leiste folgt der unruhigen Putzkante, der Korpus bleibt gerade.">${part(4, g.rightTop, 'Rechte Seite, oben')}${part(214, g.rightBottom, 'Rechte Seite, unten')}</svg>`;
}

/** Vier kleine Situationen in derselben Strichsprache. */
export function situation(kind) {
  const open = (label, inner) => `<svg class="zeichnung zeichnung--klein" viewBox="0 0 320 240" role="img" aria-label="${label}">${inner}</svg>`;
  if (kind === 'schraege') {
    return open('Schnitt durch eine Dachschräge mit Schrank darunter', `
      <path d="M24 205 V132 L280 28 V205 Z" fill="url(#ef-oak-a)" class="kontur-klein"/>
      <path d="M0 141.8 L320 12" class="wand-klein"/><path d="M0 205 H320" class="wand-klein"/>
      <path d="M152 205 V80" class="l-klein"/><path d="M24 205 H280" class="l-klein"/>
      <text x="44" y="108" class="dim-s dim-s--rot" transform="rotate(-22 44 108)">38°</text>`);
  }
  if (kind === 'erker') {
    return open('Grundriss eines Erkers mit Sitzbank, die den Wänden folgt', `
      <path d="M0 40 H72 L112 170 H208 L248 40 H320" class="wand-klein"/>
      <path d="M0 26 H62 L102 184 H218 L258 26 H320" class="l-klein"/>
      <polygon points="72,40 112,170 208,170 248,40 212,40 186,128 134,128 108,40" fill="url(#ef-oak-a)" class="kontur-klein"/>
      <text x="60" y="118" class="dim-s dim-s--rot" text-anchor="end">107°</text>
      <text x="260" y="118" class="dim-s dim-s--rot">104°</text>`);
  }
  if (kind === 'heizung') {
    return open('Ansicht einer Heizkörpernische mit Verkleidung und Luftschlitzen', `
      <path d="M40 220 V24 H280 V220" class="wand-klein"/><path d="M0 220 H320" class="wand-klein"/>
      <rect x="62" y="120" width="196" height="100" fill="url(#ef-oak-c)" class="kontur-klein"/>
      <rect x="62" y="110" width="196" height="10" fill="url(#ef-oak-h)" class="kontur-klein"/>
      ${Array.from({ length: 13 }, (_, i) => `<rect x="${78 + i * 13}" y="136" width="5" height="62" class="schlitz"/>`).join('')}
      <path d="M100 96 C96 80 106 72 100 56 M160 96 C156 80 166 72 160 56 M220 96 C216 80 226 72 220 56" class="l-rot"/>`);
  }
  return open('Ansicht einer Bücherwand, die um eine Tür herum gebaut ist', `
    <path d="M0 226 H320" class="wand-klein"/>
    <path d="M18 226 V14 H302 V226 H204 V92 H116 V226 Z" fill="url(#ef-oak-a)" class="kontur-klein"/>
    <path d="M18 62 H302 M18 110 H116 M204 110 H302 M18 158 H116 M204 158 H302 M18 204 H116 M204 204 H302 M67 14 V226 M253 14 V226 M160 14 V62" class="l-klein"/>
    <rect x="116" y="92" width="88" height="134" class="tuer"/>
    <text x="160" y="164" class="dim-s dim-s--rot" text-anchor="middle">Türmaß</text>`);
}

/** Gemeinsame Definitionen. Einmal je Seite einbinden; assets ist der relative Pfad zu oak.webp. */
export function defs(assets = '') {
  const oak = (id, x, y, rotate = false) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="1000" height="2000" patternTransform="translate(${x} ${y})${rotate ? ' rotate(90)' : ''}"><image href="${assets}oak.webp" width="1000" height="2000"/></pattern>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <pattern id="ef-hatch" patternUnits="userSpaceOnUse" width="46" height="46" patternTransform="rotate(45)"><rect width="46" height="46" fill="var(--wand)"/><line x1="0" y1="0" x2="0" y2="46" stroke="var(--tusche)" stroke-width="5"/></pattern>
    <pattern id="ef-hatch-fine" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--wand)"/><line x1="0" y1="0" x2="0" y2="7" stroke="var(--tusche)" stroke-width=".7"/></pattern>
    ${oak('ef-oak-a', 0, 0)}${oak('ef-oak-b', 310, 700)}${oak('ef-oak-c', 640, 240)}${oak('ef-oak-d', 150, 1120)}${oak('ef-oak-h', 0, 30, true)}
    <pattern id="ef-oak-fine" patternUnits="userSpaceOnUse" width="180" height="360"><image href="${assets}oak.webp" width="180" height="360"/></pattern>
    <pattern id="ef-oak-fine-h" patternUnits="userSpaceOnUse" width="180" height="360" patternTransform="rotate(90)"><image href="${assets}oak.webp" width="180" height="360"/></pattern>
    <linearGradient id="ef-shade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#15120e" stop-opacity=".55"/><stop offset="1" stop-color="#15120e" stop-opacity="0"/></linearGradient>
  </defs></svg>`;
}
