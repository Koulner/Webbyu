// Erzeugt die gezeichneten Materialien der Klarblick-Demo als SVG. Aufruf:
//   node pilot/klarblick/tools/texturen.mjs
// Kein Foto, keine fremden Vorlagen. Der Zufall ist fest geseedet, das Ergebnis also reproduzierbar.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ziel = fileURLToPath(new URL('../../../public/package-demos/', import.meta.url));
function zufall(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const svg = (w, h, inhalt) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inhalt}</svg>\n`;
const wahl = (r, liste) => liste[Math.floor(r() * liste.length)];

// Klinker im Läuferverband. Die Reihen laufen über die Kachelkante hinweg, damit keine Naht entsteht.
export function klinker() {
  const r = zufall(1936), S = 66, H = 21, F = 3, ZS = 12, ZR = 16;
  const W = S * ZS, HH = H * ZR;
  const toene = ['#7b3629', '#7b3629', '#76342a', '#7f392b', '#73322a', '#843e2d', '#783427', '#7b3629', '#6c2e25', '#8a4331', '#783427', '#612b22'];
  let s = `<rect width="${W}" height="${HH}" fill="#8a7566"/>`;
  for (let y = 0; y < ZR; y++) {
    const vers = y % 2 ? S / 2 : 0;
    for (let x = -1; x < ZS; x++) {
      const t = wahl(r, toene), px = x * S + vers;
      const stein = (ox) => `<rect x="${ox + F / 2}" y="${y * H + F / 2}" width="${S - F}" height="${H - F}" rx="1" fill="${t}"/>`;
      s += stein(px);
      if (px < 0) s += stein(px + W);
    }
  }
  return svg(W, HH, s);
}

// Schiefer in versetzten Reihen.
export function schiefer() {
  const r = zufall(77), S = 40, H = 26, ZS = 8, ZR = 8, W = S * ZS, HH = H * ZR;
  const toene = ['#3d4951', '#434f58', '#37424a', '#3f4c55', '#333e46'];
  let s = `<rect width="${W}" height="${HH}" fill="#272f36"/>`;
  for (let y = 0; y < ZR; y++) {
    const vers = y % 2 ? S / 2 : 0;
    for (let x = -1; x < ZS; x++) {
      const t = wahl(r, toene), px = x * S + vers;
      const platte = (ox) => `<path d="M${ox + 1} ${y * H + 1}h${S - 2}v${H - 8}q0 5-5 6h-${S - 12}q-5-1-5-6Z" fill="${t}"/>`;
      s += platte(px);
      if (px < 0) s += platte(px + W);
    }
  }
  return svg(W, HH, s);
}

// Heckenkante, oben unregelmäßig, unten geschlossen. Die Blätter laufen über die Kachelkante.
export function hecke() {
  const r = zufall(1990), W = 520, H = 210;
  let s = '';
  const klumpen = [];
  for (let x = 0; x < W; x += 30) klumpen.push([x + r() * 14, 54 + r() * 18, 22 + r() * 19]);
  const dunkel = klumpen.map(([x, y, g]) => [[x, y, g], [x - W, y, g], [x + W, y, g]]).flat().map(([x, y, g]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${g.toFixed(1)}"/>`).join('');
  s += `<g fill="#23452f">${dunkel}<rect y="66" width="${W}" height="${H - 66}"/></g>`;
  const farben = ['#2f5a3c', '#376644', '#2a5136', '#3f7049'];
  for (let i = 0; i < 440; i++) {
    const x = r() * W, y = 44 + r() * (H - 46), f = wahl(r, farben), a = r() * 180;
    const blatt = (ox) => `<ellipse cx="${ox.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.5" ry="3" fill="${f}" transform="rotate(${a.toFixed(0)} ${ox.toFixed(1)} ${y.toFixed(1)})"/>`;
    s += blatt(x);
    if (x < 8) s += blatt(x + W);
    if (x > W - 8) s += blatt(x - W);
  }
  return svg(W, H, s);
}

// Gehwegplatten, Fugen versetzt.
export function gehweg() {
  const r = zufall(23), S = 96, ZS = 5, ZR = 4, W = S * ZS, H = S * ZR;
  const toene = ['#a8a79e', '#a2a198', '#adaca3', '#9d9c93'];
  let s = `<rect width="${W}" height="${H}" fill="#7e7d75"/>`;
  for (let y = 0; y < ZR; y++) {
    const vers = y % 2 ? S / 2 : 0;
    for (let x = -1; x < ZS; x++) {
      const t = wahl(r, toene), px = x * S + vers;
      const platte = (ox) => `<rect x="${ox + 1.5}" y="${y * S + 1.5}" width="${S - 3}" height="${S - 3}" fill="${t}"/>`;
      s += platte(px);
      if (px < 0) s += platte(px + W);
    }
  }
  return svg(W, H, s);
}

// Motiv für die Kachel auf der Webbyu-Startseite: derselbe Giebel, derselbe Klinker.
export function giebel() {
  const W = 1600, H = 1000;
  const k = klinker().replace(/<svg[^>]*>/, '').replace('</svg>\n', '');
  const cx = 1120, cy = 560, R = 210;
  return svg(W, H, `<defs><pattern id="k" width="792" height="336" patternUnits="userSpaceOnUse" patternTransform="scale(1.35)">${k}</pattern><clipPath id="g"><polygon points="${cx},60 1600,1000 640,1000"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="#dbe3e2"/>
<rect x="430" y="470" width="110" height="220" fill="url(#k)"/><rect x="418" y="455" width="134" height="20" fill="#b9b4a8"/>
<polygon points="0,1000 640,1000 860,620 0,620" fill="#3b464f"/>
<polygon points="${cx},20 1660,1000 580,1000" fill="#f7f2e7"/>
<g clip-path="url(#g)"><rect width="${W}" height="${H}" fill="url(#k)"/></g>
<circle cx="${cx}" cy="${cy}" r="${R + 40}" fill="none" stroke="#54261d" stroke-width="64"/>
<circle cx="${cx}" cy="${cy}" r="${R + 40}" fill="none" stroke="#8a4533" stroke-width="58" pathLength="32" stroke-dasharray=".9 .1"/>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="#f7f2e7"/><circle cx="${cx}" cy="${cy}" r="${R - 26}" fill="#f2c230"/>
<rect x="${cx - 13}" y="${cy - R + 10}" width="26" height="${2 * R - 20}" fill="#f7f2e7"/><rect x="${cx - R + 10}" y="${cy - 13}" width="${2 * R - 20}" height="26" fill="#f7f2e7"/>`);
}

for (const [name, inhalt] of Object.entries({ klinker: klinker(), schiefer: schiefer(), hecke: hecke(), gehweg: gehweg(), giebel: giebel() })) {
  writeFileSync(`${ziel}klarblick-${name}.svg`, inhalt);
  console.log(name, inhalt.length);
}
