// Hof & Flamme: das eine Feuer, aus dem Karte, Kurve, Schriftgröße und Farbe abgeleitet sind.
// Alles Fiktive steht hier an einer Stelle; pages.ts und client.ts rechnen nur damit.

const T0 = 430;
const UMGEBUNG = 40;
const K = 0.458;
export const BEGINN = 18.5;
export const ENDE = 23;

/** Herdtemperatur in Grad Celsius nach dem letzten Scheit (Newtonsches Abkühlen). */
export const temperatur = (stunde: number): number => Math.round(UMGEBUNG + (T0 - UMGEBUNG) * Math.exp(-K * Math.max(0, stunde - BEGINN)));

/** Hitze von 0 bis 1. Daraus entstehen Schriftgröße und Schriftstärke über die CSS-Variable --t. */
export const hitze = (stunde: number): number => Math.max(0, Math.min(1, (temperatur(stunde) - 90) / (T0 - 90)));

export const uhr = (stunde: number): string => {
  const minuten = Math.round(stunde * 60);
  return `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
};

export type Gericht = { h: number; name: string; text: string; mitte: string; ohne?: [string, string] };
export type Stufe = { id: 'flamme' | 'glut' | 'asche' | 'rest'; name: string; h: number; gerichte: Gericht[] };

export const STUFEN: Stufe[] = [
  { id: 'flamme', name: 'Flamme', h: 18.5, gerichte: [
    { h: 18.67, name: 'Fladen vom Herdstein', text: 'Neunzig Sekunden auf dem Stein. Dazu Butter vom Nachbarhof und Schmalz mit Apfel.', mitte: 'Einer pro Person, dann noch einer', ohne: ['Fladen vom Herdstein', 'Dieselben Fladen, Butter statt Schmalz.'] },
    { h: 19, name: 'Lauch, schwarz', text: 'Außen verkohlt, innen weich, am Tisch aufgeschnitten. Senf, gehacktes Ei.', mitte: 'Eine Stange für zwei' },
  ] },
  { id: 'glut', name: 'Glut', h: 19.75, gerichte: [
    { h: 19.75, name: 'Spitzkohl vom Rost', text: 'Geviertelt, mit Brandkanten. Molkebutter, Dill.', mitte: 'Eine Schüssel für vier' },
    { h: 20.08, name: 'Schulter vom Weidelamm', text: 'Liegt seit Mittag am Rand der Glut und wird am Tisch gezupft. Rote Zwiebeln, Bohnenkraut.', mitte: 'Eine Platte für sechs', ohne: ['Ganzer Kürbis vom Rost', 'Mit derselben Zwiebelsauce, am Tisch aufgebrochen.'] },
  ] },
  { id: 'asche', name: 'Asche', h: 21, gerichte: [
    { h: 21, name: 'Bete aus der Asche', text: 'Drei Stunden eingegraben, schwarz auf den Tisch, aufbrechen müssen Sie selbst. Meerrettich, Apfelessig.', mitte: 'Eine Knolle für zwei' },
    { h: 21.33, name: 'Kartoffeln mit Dickmilch', text: 'Aus der Asche, mit der Schale. Dickmilch, Schnittlauch, grobes Salz.', mitte: 'Ein Korb für vier' },
  ] },
  { id: 'rest', name: 'Restwärme', h: 22.25, gerichte: [
    { h: 22.25, name: 'Apfel vom Stein', text: 'Seit dem Lamm im Herd. Haferstreusel, Sahne, nicht geschlagen.', mitte: 'Ein halber pro Person' },
  ] },
];

const X = (stunde: number, rand = 4) => rand + (stunde - BEGINN) / (ENDE - BEGINN) * (100 - 2 * rand);
const Y = (grad: number) => 100 - (grad - 30) / (560 - 30) * 100;
const zahl = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');

function pfad(rand: number): string {
  const punkte: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const h = BEGINN + (ENDE - BEGINN) * i / 80;
    punkte.push(`${i ? 'L' : 'M'}${zahl(X(h, rand))} ${zahl(Y(UMGEBUNG + (T0 - UMGEBUNG) * Math.exp(-K * (h - BEGINN))))}`);
  }
  return punkte.join('');
}

/** Hügel unter der Kurve. Rand 0 läuft bis an die Bildkante und trägt auf der Startseite die Schrift. */
export function huegel(rand = 0): string {
  return `<svg class="hf-huegel" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="hf-huegel-flaeche" d="M0 100L0 ${zahl(Y(T0))}${pfad(rand).replace('M', 'L')}L100 100Z"/><path class="hf-huegel-linie" d="${pfad(rand)}"/></svg>`;
}

/** Die Kurve als lesbare Grafik: Punkte und Beschriftung sind Text, nur die Linie ist Zeichnung. */
export function kurve(beschreibung: string, rand = 6): string {
  const punkte = STUFEN.map(s => `<li style="left:${zahl(X(s.h, rand))}%;top:${zahl(Y(temperatur(s.h)))}%"><b>${s.name}</b><span>${uhr(s.h)}</span><span>${temperatur(s.h)} °C</span></li>`).join('');
  const achse = [18.5, 19.5, 20.5, 21.5, 22.5].map(h => `<span style="left:${zahl(X(h, rand))}%">${uhr(h)}</span>`).join('');
  return `<figure class="hf-kurve" aria-label="${beschreibung}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="hf-kurve-linie" d="${pfad(rand)}"/></svg><ol>${punkte}</ol><div class="hf-kurve-achse" aria-hidden="true">${achse}</div></figure>`;
}

const TAG: [number, number][] = [[7.5, 45], [11, 55], [14, 480], [16, 475], [18, 450]];
function tagesgrad(h: number): number {
  if (h >= BEGINN) return UMGEBUNG + (T0 - UMGEBUNG) * Math.exp(-K * (h - BEGINN));
  const knoten: [number, number][] = [...TAG, [BEGINN, T0]];
  const i = Math.max(0, knoten.findIndex(([s]) => s > h) - 1);
  const [a, wa] = knoten[i]; const [b, wb] = knoten[i + 1];
  const f = (1 - Math.cos(Math.PI * (h - a) / (b - a))) / 2;
  return wa + (wb - wa) * f;
}

/** Der ganze Tag des Herds, vom Ausfegen bis zum letzten Gast. */
export function tageskurve(eintraege: { h: number; marke?: string }[]): string {
  const a = 7, b = 23.5;
  const x = (h: number) => (h - a) / (b - a) * 100;
  const y = (g: number) => 100 - (g - 20) / (560 - 20) * 100;
  const linie: string[] = [];
  for (let i = 0; i <= 200; i++) { const h = 7.5 + (23 - 7.5) * i / 200; linie.push(`${i ? 'L' : 'M'}${zahl(x(h))} ${zahl(y(tagesgrad(h)))}`); }
  const marken = eintraege.filter(e => e.marke).map(e => `<span style="left:${zahl(x(e.h))}%;top:${zahl(y(tagesgrad(e.h)))}%">${e.marke}</span>`).join('');
  const stunden = [8, 11, 14, 17, 20, 23].map(h => `<span style="left:${zahl(x(h))}%">${h} Uhr</span>`).join('');
  return `<figure class="hf-tageskurve"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="hf-kurve-linie" d="${linie.join('')}"/></svg><div class="hf-tageskurve-marken" aria-hidden="true">${marken}</div><div class="hf-kurve-achse" aria-hidden="true">${stunden}</div><figcaption class="pd-sr">Temperaturverlauf des Herds: Anheizen ab 11 Uhr, gut 480 Grad um 14 Uhr, ab 18 Uhr fallend bis unter 100 Grad um 23 Uhr.</figcaption></figure>`;
}

/** Das Zeichen: ein H, dessen Querstrich fällt wie die Kurve. */
export const hofMarke = '<svg class="hf-marke" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><path d="M3 2v30h6V2zM25 2v30h6V2z" fill="currentColor"/><path d="M9 9C14 18 19 22 25 23.5" fill="none" stroke="currentColor" stroke-width="5"/></svg>';

/** Plakat für Kacheln auf der Webbyu-Startseite. Dieselbe Kurve wie in der Demo. */
export function hofPlakat(): string {
  const px = (h: number) => (h - BEGINN) / (ENDE - BEGINN) * 1600;
  const py = (g: number) => 1000 - (g - 30) / (560 - 30) * 1000;
  const linie: string[] = [];
  for (let i = 0; i <= 80; i++) { const h = BEGINN + (ENDE - BEGINN) * i / 80; linie.push(`${i ? 'L' : 'M'}${Math.round(px(h))} ${Math.round(py(temperatur(h)))}`); }
  return `<svg class="hf-plakat" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="1600" height="1000" fill="#f6b417"/><path d="${linie.join('')}L1600 1000L0 1000Z" fill="#ea4a1c"/><path d="${linie.join('')}" fill="none" stroke="#16100b" stroke-width="10"/></svg>`;
}

type Punkt = (x: number, y: number) => [number, number];
const kreis = (p: Punkt, x: number, y: number, r: number, klasse: string) => { const [a, b] = p(x, y); return `<circle cx="${a}" cy="${b}" r="${r}" class="${klasse}"/>`; };
const rechteck = (p: Punkt, x: number, y: number, w: number, h: number, klasse: string, quer: boolean) => { const [a, b] = p(x, y); return `<rect x="${a}" y="${b}" width="${quer ? w : h}" height="${quer ? h : w}" class="${klasse}"/>`; };
const beschriftung = (p: Punkt, x: number, y: number, text: string) => { const [a, b] = p(x, y); return `<text x="${a}" y="${b}">${text}</text>`; };

/** Der Tisch von oben: 22 Plätze, Schüsseln in der Mitte, die Tür auf der einen, der Herd auf der anderen Seite. */
export function tafel(quer: boolean): string {
  const p: Punkt = quer ? (x, y) => [x, y] : (x, y) => [y, x];
  const b = quer ? 1200 : 330, h = quer ? 330 : 1200;
  const zone = (i: number) => (i < 4 ? 'hf-z-tuer' : i < 8 ? 'hf-z-mitte' : 'hf-z-herd');
  let platz = '';
  for (let i = 0; i < 11; i++) { const x = 190 + i * 82; platz += kreis(p, x, 62, 24, zone(i)) + kreis(p, x, 268, 24, zone(i)); }
  const schuesseln = [232, 396, 560, 724, 888, 1010].map((x, i) => kreis(p, x, 165, i % 2 ? 26 : 34, 'hf-schuessel')).join('');
  const [t1x, t1y] = p(70, 165), [t2x, t2y] = p(1136, 165);
  return `<svg class="hf-plan ${quer ? 'hf-nur-gross' : 'hf-nur-klein'}" viewBox="0 0 ${b} ${h}" role="img" aria-label="Plan des langen Tisches von oben: elf Plätze auf jeder Seite, Schüsseln in der Mitte, die Tür an einem Ende, der Herd am anderen."><title>Der Tisch von oben</title>`
    + rechteck(p, 142, 104, 924, 122, 'hf-tisch', quer) + platz + schuesseln
    + `<g class="hf-plan-text" text-anchor="middle"><text x="${t1x}" y="${t1y + 8}">Tür</text><text x="${t2x}" y="${t2y + 8}">Herd</text></g></svg>`;
}

/** Grundriss des Hallenhauses. Quer für breite, hochkant für schmale Bildschirme. */
export function haus(quer: boolean): string {
  const p: Punkt = quer ? (x, y) => [x, y] : (x, y) => [y, x];
  const b = quer ? 1200 : 560, h = quer ? 560 : 1200;
  const r = (x: number, y: number, w: number, hh: number, k: string) => rechteck(p, x, y, w, hh, k, quer);
  let plaetze = '';
  for (let i = 0; i < 11; i++) { const x = 300 + i * 40; plaetze += kreis(p, x, 244, 9, 'hf-schuessel') + kreis(p, x, 316, 9, 'hf-schuessel'); }
  return `<svg class="hf-plan hf-haus ${quer ? 'hf-nur-gross' : 'hf-nur-klein'}" viewBox="0 0 ${b} ${h}" role="img" aria-label="Grundriss des fiktiven Hallenhauses: Vorn die große Tür, in der Mitte die Diele mit dem langen Tisch, links und rechts die früheren Ställe, hinten das Flett mit dem Herd."><title>Grundriss des Hauses</title>`
    + r(30, 30, 1140, 500, 'hf-wand') + r(30, 30, 790, 120, 'hf-stall') + r(30, 410, 790, 120, 'hf-stall') + r(820, 30, 350, 500, 'hf-flett')
    + r(960, 200, 170, 160, 'hf-herd') + r(275, 258, 490, 44, 'hf-tisch') + plaetze + r(18, 210, 24, 140, 'hf-tuer')
    + `<g class="hf-plan-text">${quer
      ? beschriftung(p, 60, 100, 'Früher Kühe, heute Garderobe') + beschriftung(p, 60, 482, 'Früher Pferde, heute Spüle') + beschriftung(p, 300, 210, 'Diele, 22 Plätze') + beschriftung(p, 60, 345, 'Große Tür') + beschriftung(p, 846, 100, 'Flett') + beschriftung(p, 978, 288, 'Herd')
      : '<text x="100" y="790" transform="rotate(-90 100 790)">Früher Kühe, heute Garderobe</text><text x="480" y="790" transform="rotate(-90 480 790)">Früher Pferde, heute Spüle</text><text x="262" y="95">Tür</text><text x="172" y="245">Diele, 22 Plätze</text><text x="52" y="875">Flett</text><text x="252" y="1052">Herd</text>'}</g></svg>`;
}
