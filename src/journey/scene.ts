import { BufferAttribute, BufferGeometry, IcosahedronGeometry, Mesh, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { stations } from './data';
import { FRAME_FILL } from './frame-set';

/**
 * Eine graue, formlose Masse, die sich mit jeder Station verwandelt. Ein einziges Netz: Der Vertex-Shader bildet die
 * Kugelrichtung auf Gestalt A und B ab und mischt beide entlang einer Front, die aus dem Inhalt der Zielstation kommt
 * (Abzieher von oben, Hobel von links, Wärme von unten …). An der Front wird jede Gestalt kurz wieder graue, flüssige
 * Masse, erst dahinter nimmt sie Form und Material der Zielstation an. Alles Bewegte ist eine Funktion des gedämpften
 * Fortschritts; darum lässt sich jeder Übergang vorab als Bildfolge rendern.
 */
/** Gestalt je Station; 0 ist die formlose Masse der Übersicht. */
export const FORMS: Record<string, number> = {
  'die-idee': 1, 'das-fundament': 2, klarblick: 3, 'eiche-und-form': 4,
  'hof-und-flamme': 5, 'safran-atelier': 6, raumgut: 7, 'der-naechste-abschnitt': 8, koulner: 9,
};
/** Kamera je Position (Übersicht, dann Stationen): Azimut und Höhe in Grad, Abstand relativ. */
const POSES: [number, number, number][] = [
  [28, 14, 1.1], [20, 6, 1.05], [26, 16, 1.05],
  [6, 3, 1], [36, 24, 1.02], [-18, -6, 1.1],
  [28, 44, 1], [-22, 14, 1], [34, 12, 1], [0, 4, .82],
];
/** Größter Radius der Gestalten, danach richtet sich der Kameraabstand. */
const EXTENT = 1.35;

const noise = `
  // Simplex-Rauschen 3D, Stefan Gustavson / Ashima Arts (MIT).
  vec3 mod289(vec3 x){ return x - floor(x * (1. / 289.)) * 289.; }
  vec4 mod289(vec4 x){ return x - floor(x * (1. / 289.)) * 289.; }
  vec4 permute(vec4 x){ return mod289(((x * 34.) + 10.) * x); }
  float snoise(vec3 v){
    const vec2 C = vec2(1. / 6., 1. / 3.);
    vec3 i = floor(v + dot(v, C.yyy)), x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz), l = 1. - g, i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - .5;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0., i1.z, i2.z, 1.)) + i.y + vec4(0., i1.y, i2.y, 1.)) + i.x + vec4(0., i1.x, i2.x, 1.));
    vec4 j = p - 49. * floor(p * (1. / 49.));
    vec4 x_ = floor(j * (1. / 7.)), y_ = floor(j - 7. * x_);
    vec4 x = (x_ * 2. + .5) / 7. - 1., y = (y_ * 2. + .5) / 7. - 1., h = 1. - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw), s0 = floor(b0) * 2. + 1., s1 = floor(b1) * 2. + 1., sh = -step(h, vec4(0.));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
    vec4 norm = 1.79284291400159 - .85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.);
    m = m * m;
    return 105. * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }`;

/** Raumgut: offenes Regal; einmal festgelegt für die Form auf der CPU (`rackPoint`) und das Material im Shader. */
const RACK_FRONT = .26, RACK_BACK = -.12;
// Fächer (Mitte, halbe Größe). Böden und Stege sind .1 stark, also breiter als ein Dreieck des Netzes, auch mobil.
const CELLS = [[-.77, -.35, .35, .47], [-.77, .52, .35, .3], [.02, .6, .34, .22], [.02, .04, .34, .24], [.02, -.56, .34, .26], [.79, .39, .33, .43], [.79, -.48, .33, .34]];
// Kleine Dinge (Mitte, halbe Größe; w = 0 heißt rund mit Radius z).
const THINGS = [[-.82, -.42, .13, .36], [-.56, -.7, .1, 0], [.02, .04, .17, 0], [.02, -.62, .26, .1], [.72, .45, .2, 0], [.99, .2, .07, .15], [.79, -.48, .24, .22]];
// Höhe ab Rückwand; negativ heißt Kuppel (kurzer Sockel, flache Kappe). Das letzte Ding ist die Auswahl und ragt vor das Regal.
const LIFT = [.2, -1, -1, .14, .1, .18, .55];
const glsl = (value: number) => Number.isInteger(value) ? `${value}.` : String(value);
/** Koulner: Profil des Objektivs (Abstand zur Achse, Höhe auf der Achse) von der Frontlinse bis zum Bajonett. */
const LENS = [
  [0, .68], [.12, .675], [.24, .66], [.34, .637], [.42, .605], [.46, .58], [.468, .56], // Frontlinse, gewölbt
  [.47, .56], [.475, .62], [.5, .645], [.7, .65], [.72, .67], // Fassung innen, Namensring
  [.73, .74], [.75, .755], [.78, .75], [.795, .735], [.8, .71], // Filterrand mit Fase
  [.8, .36], [.795, .335], [.775, .325], [.775, .305], // vorderer Tubus, Fuge
  [.835, .3], [.85, .285], [.85, -.095], [.835, -.11], // Fokusring mit Fasen
  [.785, -.115], [.785, -.135], [.795, -.145], [.795, -.4], [.785, -.425], [.7, -.46], [.67, -.47], // Fuge, hinterer Tubus, Schulter
  [.67, -.6], [.655, -.615], [.63, -.62], [.63, -.7], [.6, -.72], [.48, -.725], [.3, -.735], [0, -.74], // Bajonett, Rückdeckel
];
// Lage jedes Profilpunkts entlang der Kugel (0 bis 1), nach Bogenlänge verteilt, damit Kanten genug Netzpunkte bekommen.
const LENS_AT = LENS.map((_, i) => LENS.slice(1, i + 1).reduce((sum, p, k) => sum + Math.hypot(p[0] - LENS[k][0], p[1] - LENS[k][1]), 0));
const lensLength = LENS_AT[LENS_AT.length - 1];

/** Fundament-Fugen und Raumgut-Regal, gebraucht für Form (Vertex) und Material (Fragment). */
const layout = `
  // Das Fundament: zwei Fugen als gerundete Mäander, die in beide Richtungen ineinandergreifen.
  float wave(float t){ return tanh(3.5 * sin(t)) / tanh(3.5); }
  float seam(vec3 p, float i){ return (i < .5 ? -.24 : .24) + .11 * wave(6.3 * p.x + (i < .5 ? .3 : 1.9)) * wave(6.3 * p.z + (i < .5 ? 1.1 : -.6)); }
  // Raumgut: offenes Regal. Fächer (Mitte, halbe Größe) und kleine Dinge darin (Mitte, halbe Größe; w = 0 heißt rund mit Radius z).
  const float RACK_FRONT = ${glsl(RACK_FRONT)}, RACK_BACK = ${glsl(RACK_BACK)};
  const vec4 CELLS[7] = vec4[7](${CELLS.map(c => `vec4(${c.map(glsl).join(', ')})`).join(', ')});
  const vec4 THINGS[7] = vec4[7](${THINGS.map(c => `vec4(${c.map(glsl).join(', ')})`).join(', ')});
  const float LIFT[7] = float[7](${LIFT.map(glsl).join(', ')});
  float boxDist(vec2 q, vec2 c, vec2 h, float r){ vec2 d = abs(q - c) - h + r; return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r; }
  float cellDist(vec2 q, int i){ return boxDist(q, CELLS[i].xy, CELLS[i].zw, 0.); }
  float thingDist(vec2 q, int i){ vec4 o = THINGS[i]; return o.w == 0. ? length(q - o.xy) - o.z : boxDist(q, o.xy, o.zw, .04); }
  // z der Vorderseite an q; cell und thing sagen, worin q liegt (-1: Rahmen beziehungsweise leerer Fachgrund).
  float rackHeight(vec2 q, out int cell, out int thing){
    cell = -1; thing = -1;
    for (int i = 0; i < 7; i++) if (cellDist(q, i) < 0.) cell = i;
    if (cell < 0) return RACK_FRONT;
    float z = RACK_BACK;
    for (int i = 0; i < 7; i++) if (thingDist(q, i) < 0.) {
      vec4 o = THINGS[i];
      thing = i;
      z = RACK_BACK + (LIFT[i] > 0. ? LIFT[i] : .04 + .6 * sqrt(max(o.z * o.z - dot(q - o.xy, q - o.xy), 0.)));
    }
    return z;
  }
  // Kanten 0 bis 6 sind Fächer, 7 bis 13 Dinge.
  float edgeDist(vec2 q, int k){ return k < 7 ? cellDist(q, k) : thingDist(q, k - 7); }
  vec2 edgeNormal(vec2 q, int k){
    return normalize(vec2(edgeDist(q + vec2(.001, 0.), k) - edgeDist(q - vec2(.001, 0.), k), edgeDist(q + vec2(0., .001), k) - edgeDist(q - vec2(0., .001), k)) + 1e-9);
  }`;

const vertex = `
  uniform float uT; uniform int uFormA; uniform int uFormB; uniform float uSeedA; uniform float uSeedB;
  // Raumgut an dieser Stelle und an den zwei Nachbarpunkten für die Normale; auf der CPU berechnet (rackPoint).
  attribute vec3 aRack; attribute vec3 aRack1; attribute vec3 aRack2;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vAuxA; varying float vAuxB;
  ${noise}
  ${layout}
  const float PI = 3.14159265;
  float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
  vec2 bez2(vec2 a, vec2 b, vec2 c, float t){ float s = 1. - t; return s * s * a + 2. * s * t * b + t * t * c; }
  vec2 bez3(vec2 a, vec2 b, vec2 c, vec2 e, float t){ float s = 1. - t; return s * s * s * a + 3. * s * s * t * b + 3. * s * t * t * c + t * t * t * e; }
  // Drehkörper: u läuft auf der Kugel von oben (0) nach unten (1), psi ist der Azimut; m ist (Abstand zur Achse, Höhe).
  float meridian(vec3 d){ return acos(clamp(d.y, -1., 1.)) / PI; }
  float azimuth(vec3 d){ vec2 h = dot(d.xz, d.xz) < 1e-12 ? vec2(1., 0.) : d.xz; return atan(h.y, h.x); }
  vec3 lathe(vec2 m, float psi){ return vec3(m.x * cos(psi), m.y, m.x * sin(psi)); }
  // Sektor für Zungen und Blätter: Mittelwinkel, Lage im Sektor (-1 bis 1) und Nummer. An den Sektorgrenzen treffen
  // sich alle Nachbarn im selben Tal, darum bleibt die Fläche geschlossen, obwohl die Blätter oben frei stehen.
  vec3 sector(float psi, float n){ float D = 2. * PI / n, k = floor(psi / D + .5); return vec3(k * D, (psi - k * D) / (D * .5), mod(k + n, n)); }
  // Ebene Platte mit runder Kante: ein Band um den Äquator wird zur Kante, der Rest der Kugel zu den ebenen Flächen.
  vec3 slab(vec3 d, vec2 size, float c, float band){
    const float quarter = 1.5707963;
    float rho = length(d.xy), lat = abs(asin(clamp(d.z, -1., 1.)));
    vec2 u = d.xy / max(rho, 1e-5), a = abs(u) / size + 1e-5;
    float edge = pow(pow(a.x, 14.) + pow(a.y, 14.), -1. / 14.), rim = min(lat / band, 1.) * quarter;
    float radial = lat > band ? (edge - c) * (1. - (lat - band) / (quarter - band)) : edge - c + c * cos(rim);
    return vec3(u * radial, sign(d.z) * c * sin(rim));
  }

  // Übersicht: graue, weiche, leicht asymmetrische Masse; w ist die Mulde für die Schattierung.
  vec4 mass(vec3 d, float seed){
    float n = .24 * snoise(d * .62 + seed * vec3(7.13, 3.71, 5.29)) + .045 * snoise(d * 1.3 - seed * vec3(2.9, 6.1, 4.3));
    return vec4(d * (1. + n) * vec3(1.06, .95, 1.), n);
  }
  // Die Idee: die Masse zieht sich zusammen und hebt einen Tropfen, der nur noch an einem Faden hängt.
  vec3 drop(vec3 d, float seed){
    float u = meridian(d);
    vec2 m;
    // Tropfen oben rund, unten spitz; Faden; der Grund steigt wie ein Meniskus zum Faden an; runder Grund.
    if (u < .28) { float a = u / .28 * 2.85; m = vec2(.38 * sin(a) * pow(max(cos(a * .5), 0.), .6), .82 + .4 * cos(a)); }
    else if (u < .38) m = bez2(vec2(.0344, .4365), vec2(.03, .32), vec2(.06, .22), (u - .28) / .1);
    else if (u < .6) m = bez3(vec2(.06, .22), vec2(.08, .02), vec2(.53, .08), vec2(.639, -.089), (u - .38) / .22);
    else { float b = mix(1., PI, (u - .6) / .4); m = vec2(.76 * sin(b), -.5 + .76 * cos(b)); }
    m.x *= 1. + .06 * snoise(d * 1.2 + seed);
    vec3 p = lathe(m, azimuth(d));
    p.x += .14 * smoothstep(.3, 1.3, p.y);
    return p;
  }
  // Das Fundament: ein kompakter Körper; seine drei Schichten unterscheiden Fugen und Töne (siehe seam).
  vec3 cube(vec3 d){
    vec3 a = abs(d) / vec3(1., .72, .72) + 1e-5;
    return d * pow(pow(a.x, 9.) + pow(a.y, 9.) + pow(a.z, 9.), -1. / 9.);
  }
  float layerOf(vec3 p){ return smoothstep(-.02, .02, p.y - seam(p, 0.)) + smoothstep(-.02, .02, p.y - seam(p, 1.)); }
  // Eiche & Form: ein Korpus, die Oberkante folgt einer schiefen Linie wie unter einer Dachschräge.
  vec3 cabinet(vec3 d){
    vec3 a = abs(d) / vec3(.8, 1., .46) + 1e-5;
    float r = pow(pow(a.x, 16.) + pow(a.y, 16.) + pow(a.z, 16.), -1. / 16.);
    float slope = d.y + .32 * d.x;
    if (slope > 0.) r = smin(r, .9 / slope, .02);
    return d * r;
  }
  // Hof & Flamme: ein runder Grund, aus dem drei Zungen verschieden hoch und leicht gedreht aufsteigen.
  vec3 flame(vec3 d){
    float u = meridian(d), psi = azimuth(d);
    vec2 m;
    if (u < .5) {
      vec3 s = sector(psi, 3.);
      float t = u / .5, h = 1.05 + .28 * cos(s.z * 2.4 + .7);
      vec2 spine = bez3(vec2(0., .02), vec2(.14, h + 1.45), vec2(.66, .35), vec2(.66, -.5), t);
      vec2 valley = bez3(vec2(0., .02), vec2(.2, .12), vec2(.66, .05), vec2(.66, -.5), t);
      m = mix(spine, valley, abs(s.y));
    } else { float b = mix(1.5707963, PI, (u - .5) / .5); m = vec2(.66 * sin(b), -.5 + .66 * cos(b)); }
    vec3 p = lathe(m, azimuth(d) + .55 * (m.y + .2));
    p.x += .12 * pow(smoothstep(-.2, 1.4, p.y), 2.);
    return p + d * .04 * snoise(d * 2.1 + 3.);
  }
  // Safran Atelier: Krokus mit sechs Blütenblättern im Wechsel groß und klein, drei Fäden in der Mitte; w markiert die Fäden.
  vec4 crocus(vec3 d){
    float u = meridian(d), psi = azimuth(d), thread = 0.;
    const vec2 S = vec2(0., -.22), R = vec2(.08, -.18), B = vec2(.17, -.38);
    vec2 m;
    if (u < .14) {
      vec3 s = sector(psi + .52, 3.);
      float t = u / .14;
      m = mix(bez3(S, vec2(0., .72), vec2(.2, .8), R, t), bez3(S, vec2(.03, -.2), vec2(.06, -.19), R, t), pow(abs(s.y), .9));
      thread = 1. - smoothstep(.75, 1., t);
    } else if (u < .74) {
      vec3 s = sector(psi, 6.);
      float t = (u - .14) / .6, size = mod(s.z, 2.) < .5 ? 1. : .84;
      vec2 tip = vec2(.8, .66) * size;
      vec2 spine = t < .5 ? bez2(R, vec2(.5, -.06) * size, tip, t * 2.) : bez2(tip, vec2(.55, -.1) * size, B, t * 2. - 1.);
      vec2 valley = t < .5 ? bez2(R, vec2(.15, -.17), vec2(.2, -.22), t * 2.) : bez2(vec2(.2, -.22), vec2(.21, -.3), B, t * 2. - 1.);
      m = mix(spine, valley, pow(abs(s.y), 2.4));
    } else {
      float t = (u - .74) / .26;
      m = vec2(B.x * (1. - t * t), mix(B.y, -.98, t));
    }
    return vec4(lathe(m, psi), thread);
  }
  // Raumgut: Korpus mit Tiefe und fast scharfen Kanten; ein Band um den Äquator wird zu den Seitenwänden.
  vec3 shelf(vec3 d){
    const float c = RACK_FRONT, r0 = .035, band = .5, quarter = 1.5707963;
    float rho = length(d.xy), lat = abs(asin(clamp(d.z, -1., 1.)));
    vec2 u = d.xy / max(rho, 1e-5), a = abs(u) / vec2(1.22, .92) + 1e-5;
    float edge = pow(pow(a.x, 14.) + pow(a.y, 14.), -1. / 14.), side = c - r0, L = min(lat / band, 1.) * (side + r0 * quarter);
    vec2 m = lat > band ? vec2((edge - r0) * (1. - (lat - band) / (quarter - band)), c)
      : L < side ? vec2(edge, L) : vec2(edge - r0 + r0 * cos((L - side) / r0), side + r0 * sin((L - side) / r0));
    return vec3(u * m.x, sign(d.z) * m.y);
  }
  // Koulner: ein Objektiv, die Achse zur Kamera; Frontlinse vorn, Fokusring, Bajonett hinten.
  const vec2 LENS[${LENS.length}] = vec2[${LENS.length}](${LENS.map(p => `vec2(${p.map(glsl).join(', ')})`).join(', ')});
  const float LENS_AT[${LENS.length}] = float[${LENS.length}](${LENS_AT.map(v => glsl(Math.round(v / lensLength * 1e4) / 1e4)).join(', ')});
  vec3 lens(vec3 d){
    vec3 q = vec3(d.x, d.z, -d.y);
    float u = meridian(q);
    vec2 m = LENS[${LENS.length - 1}];
    for (int i = 0; i < ${LENS.length - 1}; i++) if (u <= LENS_AT[i + 1]) { m = mix(LENS[i], LENS[i + 1], (u - LENS_AT[i]) / (LENS_AT[i + 1] - LENS_AT[i])); break; }
    vec3 l = lathe(m, azimuth(q));
    return vec3(l.x, -l.z, l.y);
  }
  // Ihr Projekt: wieder formlose Masse, aber offen, mit einer Mulde zur Kamera; w ist die Tiefe der Mulde.
  vec4 open(vec3 d, float seed){
    vec4 m = mass(d, seed);
    float bowl = smoothstep(.42, 1., d.z), lip = smoothstep(.25, .42, d.z) * (1. - smoothstep(.42, .6, d.z));
    float r = (1. + m.w * (1. - bowl)) * (1. - .88 * bowl) + .07 * lip;
    return vec4(d * r * vec3(1.06, .95, 1.), bowl);
  }
  // Jedes Programm enthält nur die beiden Gestalten seines Übergangs (FORM_A, FORM_B): Mit allen neun brauchte die
  // Übersetzung unter Windows/Direct3D 80 s, mit zweien rund 2 s.
  vec4 form(int id, vec3 d, float seed, vec3 rk){
    vec4 r;
#if FORM_A == 1 || FORM_B == 1
    if (id == 1) r = vec4(drop(d, seed), 0.); else
#endif
#if FORM_A == 2 || FORM_B == 2
    if (id == 2) r = vec4(cube(d), 0.); else
#endif
#if FORM_A == 3 || FORM_B == 3
    if (id == 3) r = vec4(slab(d, vec2(1.22, .86), .07, .38), 0.); else
#endif
#if FORM_A == 4 || FORM_B == 4
    if (id == 4) r = vec4(cabinet(d), 0.); else
#endif
#if FORM_A == 5 || FORM_B == 5
    if (id == 5) r = vec4(flame(d), 0.); else
#endif
#if FORM_A == 6 || FORM_B == 6
    if (id == 6) r = crocus(d); else
#endif
#if FORM_A == 7 || FORM_B == 7
    if (id == 7) r = vec4(rk, 0.); else
#endif
#if FORM_A == 8 || FORM_B == 8
    if (id == 8) r = open(d, seed); else
#endif
#if FORM_A == 9 || FORM_B == 9
    if (id == 9) r = vec4(lens(d), 0.); else
#endif
    r = mass(d, seed);
    return r;
  }
  // Wann sich diese Stelle verwandelt (x, 0 bis 1) und wie weich die Front ist (y). Die Front gehört zur Gestalt B.
  vec2 front(vec3 d){
#if FORM_B == 1
    // Idee: weich von unten nach oben, der Tropfen hebt sich zuletzt.
    return vec2((d.y + 1.) * .5, .35);
#elif FORM_B == 2
    // Fundament: Schicht für Schicht von unten, jede Schicht samt ihren Zungen als Ganzes.
    return vec2(layerOf(cube(d)) / 2.6 + (d.y + 1.) * .02, .3);
#elif FORM_B == 3
    // Klarblick: ein gerader Abzieherzug von oben, scharf.
    return vec2((1. - d.y) * .5, .045);
#elif FORM_B == 4
    // Eiche & Form: ein Hobelzug von links, scharf.
    return vec2((d.x + 1.) * .5 + d.y * .05, .035);
#elif FORM_B == 5
    // Hof & Flamme: Wärme steigt von unten, weich und unruhig.
    return vec2((d.y + 1.) * .5 + .12 * snoise(d * 2.3 + 11.), .3);
#elif FORM_B == 6
    // Safran Atelier: die Blüte öffnet sich von oben.
    return vec2((1. - d.y) * .5 + .05 * snoise(d * 3. + 5.), .3);
#elif FORM_B == 7
    // Raumgut: das Regal entsteht in Leserichtung, die Auswahl tritt zuletzt hervor.
    vec3 p = shelf(d);
    float order = clamp((.92 - p.y) / 1.84, 0., 1.) * .62 + clamp((p.x + 1.22) / 2.44, 0., 1.) * .14;
    return vec2(mix(order, .88, (1. - smoothstep(0., .1, thingDist(p.xy, 6))) * smoothstep(0., .3, d.z)), .14);
#elif FORM_B == 8
    // Ihr Projekt: die Mulde öffnet sich zur Kamera hin.
    return vec2((1. - d.z) * .5, .4);
#elif FORM_B == 9
    // Koulner: von der Frontlinse nach hinten, dabei von einer Seite um die Achse, wie beim Ansetzen ans Bajonett.
    float psi = atan(d.y, d.x);
    return vec2((1. - d.z) * .25 + (.5 - .5 * cos(psi)) * .45, .2);
#else
    return vec2(.5 + .32 * snoise(d * .8 + uSeedB * 1.7), .6);
#endif
  }
  vec3 surface(vec3 d, vec3 rk, out float w, out float act, out vec2 aux){
    vec2 f = front(d);
    f.x = clamp(f.x, 0., 1.);
    float x = (uT * (1. + f.y) - f.x) / f.y, travel = sin(PI * uT);
    w = smoothstep(0., 1., x);
    act = 4. * w * (1. - w);
    vec4 a = uT < 1. ? form(uFormA, d, uSeedA, rk) : vec4(0.), b = uT > 0. ? form(uFormB, d, uSeedB, rk) : vec4(0.);
    aux = vec2(a.w, b.w);
    // Fundament: jede Schicht entsteht über ihrem Platz und schiebt sich mit ihren Zungen in die darunter.
    bool settle = uFormB == 2;
    if (settle) b.y += .5 * (1. - w) * (1. - w);
    vec3 p = mix(a.xyz, b.xyz, settle ? smoothstep(0., .4, w) : w);
    if (travel < .001) return p;
    // An der Front wird die Gestalt kurz wieder Masse und flüssig; wo die Front vorbei ist, setzt sie sich.
    if (!settle) p = mix(p, mass(d, uSeedB).xyz, act * .4);
    p += d * (.06 * travel * (1. - w) + .07 * act) * (settle ? .3 : 1.) * snoise(d * 1.7 + vec3(0., -uT * 2.6, uT * 1.2) + uSeedB);
    // Abstand vor der Front, in Einheiten der Frontkoordinate.
    float ahead = f.x - (uT * (1. + f.y) - f.y * .5), pile = (ahead - .05) / .045, chip = (ahead + .02) / .03;
    // Klarblick: vor dem Abzieher staut sich die Masse wie Wasser.
    if (uFormB == 3) p += d * .2 * travel * exp(-pile * pile);
    // Eiche & Form: hinter dem Hobel hebt sich ein Span.
    if (uFormB == 4) p += vec3(-.3, 1., 0.) * .16 * travel * exp(-chip * chip) * smoothstep(.1, .7, d.y);
    // Hof & Flamme: die Wärme dehnt die Masse und hebt sie an.
    if (uFormB == 5) p += (d * .08 + vec3(0., .14, 0.)) * act;
    // Koulner: das Objektiv dreht sich um seine Achse ein; was die Front noch nicht erreicht hat, ist weiter verdreht.
    if (uFormB == 9) { float a = 1.4 * (1. - w) * travel; p.xy = mat2(cos(a), sin(a), -sin(a), cos(a)) * p.xy; }
    return p;
  }
  void main(){
    vec3 d = normalize(position);
    vec3 t1 = normalize(cross(d, abs(d.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), t2 = cross(d, t1);
    float w, act, w1, a1;
    vec2 aux, x1;
    vec3 p = surface(d, aRack, w, act, aux);
    vec3 p1 = surface(normalize(d + t1 * .006), aRack1, w1, a1, x1), p2 = surface(normalize(d + t2 * .006), aRack2, w1, a1, x1);
    // Auf Kanten gezogene Nachbarpunkte können zusammenfallen; dann gilt die Kugelrichtung.
    vec3 n = cross(p1 - p, p2 - p);
    vNormal = dot(n, n) > 1e-14 ? normalize(n) : d;
    vPos = p; vW = w; vAct = act; vAuxA = aux.x; vAuxB = aux.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;

const fragment = `
  uniform int uFormA; uniform int uFormB;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vAuxA; varying float vAuxB;
  ${noise}
  ${layout}
  const vec3 KEY = vec3(-.5, .72, .48);
  vec3 N, V, R; float NL, NV, FR; int wallK;
  // Sortiment in gedämpften Naturtönen; das letzte Ding ist die Auswahl.
  const vec3 TONES[7] = vec3[7](vec3(.36, .42, .36), vec3(.5, .42, .3), vec3(.58, .56, .5), vec3(.46, .34, .28), vec3(.36, .4, .45), vec3(.5, .44, .3), vec3(.6, .58, .52));
  bool rackFront(){ return vPos.z > -.2 && abs(vPos.x) < 1.18 && abs(vPos.y) < .88; }
  // Liegt der Punkt auf einer senkrechten Wand? Dann die Kante (sonst -1) und ihre Normale, zur tieferen Seite gerichtet.
  int rackWall(out vec3 n){
    for (int k = 0; k < 14; k++) {
      if (abs(edgeDist(vPos.xy, k)) > .035) continue;
      float high = k < 7 ? RACK_FRONT : RACK_BACK + max(LIFT[k - 7], .04);
      if (vPos.z < RACK_BACK + .004 || vPos.z > high - .004) continue;
      vec2 g = edgeNormal(vPos.xy, k);
      n = vec3(k < 7 ? -g : g, 0.);
      return k;
    }
    return -1;
  }
  // Studio ohne Bild: dunkler Petrolboden, heller Himmel, ein weiches Lichtfeld oben links.
  vec3 env(vec3 r){
    vec3 c = mix(vec3(.012, .03, .035), vec3(.3, .38, .38), smoothstep(-.25, .7, r.y));
    return c + vec3(2.2, 2.1, 1.9) * smoothstep(.82, .97, dot(r, normalize(vec3(-.5, .72, .48))));
  }
  float spec(float power){ return pow(max(dot(N, normalize(normalize(KEY) + V)), 0.), power); }
#if FORM_A == 9 || FORM_B == 9
  // Koulner: rechteckige Softbox in Richtung des Hauptlichts, gespiegelt in Glas, Chrom und Eloxal.
  float softbox(vec3 r, float size){
    vec3 k = normalize(KEY), u = normalize(cross(vec3(0., 1., 0.), k)), v = cross(k, u);
    vec2 q = abs(vec2(dot(r, u) / 1.5, dot(r, v)));
    return (1. - smoothstep(size * .8, size, q.x)) * (1. - smoothstep(size * .8, size, q.y)) * step(0., dot(r, k));
  }
  // Geisterreflex eines inneren Linsenglieds: kleiner, runder, weicher Lichtfleck.
  float ghost(vec3 r, float size){
    vec3 k = normalize(KEY), u = normalize(cross(vec3(0., 1., 0.), k)), v = cross(k, u);
    return (1. - smoothstep(size * .3, size, length(vec2(dot(r, u), dot(r, v))))) * step(0., dot(r, k));
  }
#endif
  vec3 shade(int id, float aux){
    vec3 key = vec3(1.25, 1.18, 1.05) * max(NL, 0.), sky = mix(vec3(.04, .08, .085), vec3(.3, .36, .36), N.y * .5 + .5), c = vec3(0.);
#if FORM_A == 3 || FORM_B == 3
    if (id == 3) {
      // Glas: fast nur Spiegelung, zwei schräge Glanzstreifen, die mit dem Blick wandern; grünliche Kante.
      float band = vPos.x * .55 + vPos.y * .7 + R.x * .9;
      float streak = (1. - smoothstep(0., .12, abs(band - .3))) * .55 + (1. - smoothstep(0., .035, abs(band - .52))) * .8;
      float sheen = .05 * smoothstep(1.2, -1., band);
      c = vec3(.012, .03, .034) + env(R) * mix(.05, 1., FR) + vec3(streak + sheen) + vec3(.3, .48, .34) * pow(1. - NV, 3.) + vec3(1.6) * spec(220.);
    } else
#endif
#if FORM_A == 4 || FORM_B == 4
    if (id == 4) {
      // Eiche: stehende Bretter, Jahresringe um eine senkrechte Achse, verzogen durch Rauschen im Objektraum; matt.
      vec3 q = vPos * vec3(1.5, .45, 1.5) + vec3(-1.7, 0., -.9);
      float warp = .1 * snoise(vPos * vec3(1.6, .35, 1.6)) + .015 * snoise(vPos * vec3(8., .5, 8.));
      float ring = fract((length(q.xz) + warp) * 12.);
      float late = smoothstep(.62, .86, ring) * (1. - smoothstep(.88, 1., ring));
      float pores = smoothstep(.2, .9, snoise(vPos * vec3(55., 1.5, 55.)));
      // Fugen: zwei Türen und ein Sockel machen aus dem Block einen Korpus.
      float face = smoothstep(.42, .45, vPos.z);
      float joint = face * max(1. - smoothstep(.006, .014, abs(vPos.x)), 1. - smoothstep(.006, .014, abs(vPos.y + .84)));
      vec3 albedo = mix(vec3(.33, .235, .16), vec3(.17, .115, .075), late * .7 + pores * .25) * (1. - .75 * joint);
      c = albedo * (key * 1.1 + sky * .7) + vec3(.06) * spec(18.) + env(R) * FR * .1;
    } else
#endif
#if FORM_A == 5 || FORM_B == 5
    if (id == 5) {
      // Glut: dunkle, glänzende Haut, innen warm glühend; am Grund und in der Mitte am hellsten, nach oben kühler.
      float h = clamp((vPos.y + 1.2) / 2.6, 0., 1.);
      float inner = (pow(NV, 2.8) * (1. - .55 * h) + .25 * (1. - h) * (1. - h)) * (.85 + .3 * snoise(vPos * vec3(2.2, 1.4, 2.2) + vec3(0., -1.5, 0.)));
      vec3 glow = mix(vec3(.45, .05, .01), vec3(1., .36, .06), smoothstep(.15, .6, inner));
      glow = mix(glow, vec3(1.25, .8, .38), smoothstep(.6, 1., inner));
      c = vec3(.05, .025, .015) * (key + sky) + glow * inner * .95 + env(R) * FR * .45 + vec3(.55, .45, .35) * spec(70.);
    } else
#endif
#if FORM_A == 6 || FORM_B == 6
    if (id == 6) {
      // Krokus: gedämpftes Violett mit feinen Adern, durchscheinend im Gegenlicht; die Fäden safranrot.
      float vein = .5 + .5 * snoise(vPos * vec3(10., 2.5, 10.));
      vec3 petal = mix(vec3(.24, .17, .32), vec3(.44, .38, .53), smoothstep(-.25, .75, vPos.y)) * (.85 + .15 * vein);
      vec3 albedo = mix(petal, vec3(.55, .06, .025), aux);
      float through = pow(max(-NL, 0.), 1.5) * (1. - aux);
      c = albedo * (key * .95 + sky * .8 + vec3(.5, .4, .55) * through) + vec3(.1) * spec(30.) * (1. - aux) + env(R) * FR * .2 + vec3(.45, .07, .02) * aux * .3;
    } else
#endif
#if FORM_A == 7 || FORM_B == 7
    if (id == 7) {
      // Raumgut: offenes Regal, hell und naturmatt; Fächer innen im Schatten, darin ein kleines Sortiment.
      vec3 albedo = vec3(.4, .47, .37);
      float ao = 1.;
      if (rackFront()) {
        int cell, thing;
        float top = rackHeight(vPos.xy, cell, thing), depth = smoothstep(RACK_BACK, RACK_FRONT, vPos.z);
        bool wall = wallK >= 0;
        if (wall) thing = wallK >= 7 ? wallK - 7 : -1;
        if (thing >= 0) albedo = TONES[thing];
        else if (wall || cell >= 0) {
          albedo *= .85;
          ao = mix(.42, 1., depth) * (cell >= 0 && !wall ? mix(.6, 1., smoothstep(0., .16, -cellDist(vPos.xy, cell))) : 1.);
        }
      }
      c = albedo * (key * 1.05 + sky * .75) * ao + vec3(.05) * spec(16.) + env(R) * FR * .12;
      // Die Auswahl: ein feiner Rand im Akzent um die Vorderkante des Dings, das nach vorn tritt.
      float e6 = abs(thingDist(vPos.xy, 6));
      c += vec3(.68, .84, .29) * .7 * (1. - smoothstep(.014, .02 + 1.5 * fwidth(e6), e6)) * smoothstep(.36, .4, vPos.z) * float(rackFront());
    } else
#endif
#if FORM_A == 9 || FORM_B == 9
    if (id == 9) {
      // Objektiv in Achsenkoordinaten: h entlang der Achse, r Abstand zur Achse, psi Winkel um die Achse.
      float h = vPos.z, r = length(vPos.xy), psi = atan(vPos.y, vPos.x);
      vec3 L = normalize(KEY), T = vec3(-sin(psi), cos(psi), 0.);
      if (h > .54 && r < .468) {
        // Frontlinse: tiefschwarz, darunter Linsenglieder und Blende mit Parallaxe, Vergütung als Dünnschichtfarbe.
        vec2 look = V.xy / max(V.z, .35);
        vec3 inner = vec3(0.);
        for (int k = 0; k < 3; k++) {
          float e = abs(length(vPos.xy + look * (.1 + .12 * float(k))) - (.41 - .1 * float(k)));
          inner += (1. - smoothstep(0., .003 + 1.5 * fwidth(e), e)) * (.3 - .08 * float(k)) * vec3(.5, .6, .9);
        }
        vec2 a = vPos.xy + look * .32;
        float blade = length(a) * cos(mod(atan(a.y, a.x) + .3, 1.0471976) - .5235988) - .16;
        float iris = smoothstep(0., .004 + 1.5 * fwidth(blade), blade);
        // Innere Linsenglieder spiegeln die Softbox kleiner und farbig, das eine gewölbt, das andere hohl.
        vec3 r2 = reflect(-V, normalize(vec3(vPos.xy * 1.8 + look * .25, 1.))), r3 = reflect(-V, normalize(vec3(-vPos.xy * 1.3 + look * .4, 1.)));
        vec3 film = .5 + .5 * cos(6.2831853 * (vec3(0., .33, .67) + NV * 1.4 + .12));
        c = vec3(.002, .003, .005) + vec3(.012, .013, .016) * iris + inner * .06 + film * vec3(.4, .3, .6) * (.05 + .35 * FR)
          + env(R) * mix(.02, .7, FR) * vec3(.8, .85, 1.) + vec3(1.5) * softbox(R, .3)
          + vec3(.2, .85, .45) * .5 * ghost(r2, .16) + vec3(.85, .3, .8) * .4 * ghost(r3, .12);
      } else {
        // Fokusring: feine Rändelung als Relief der Normale, ausgeblendet, wo sie feiner als ein Bildpunkt würde.
        float grip = r > .838 && h > -.1 && h < .29 ? 1. : 0., ph = psi * 19.098593;
        vec3 n = normalize(N + T * .6 * grip * sin(ph * 6.2831853) * (1. - smoothstep(.2, .45, fwidth(ph))));
        vec3 rr = reflect(-V, n), hv = normalize(L + V);
        float nl = dot(n, L), hn = max(dot(hv, n), .08);
        // Fugen dunkel, Bajonett verchromt, Rückdeckel und Namensring matt.
        float seams = (1. - smoothstep(.006, .016, abs(h - .315))) + (1. - smoothstep(.006, .016, abs(h + .125)));
        float chrome = h < -.465 && h > -.705 && r > .62 ? 1. : 0., matte = (h > .55 && r < .72) || h < -.705 ? 1. : 0.;
        float accent = r > .79 ? 1. - smoothstep(.007, .007 + 1.5 * fwidth(h), abs(h - .41)) : 0.;
        float tick = fract(psi * 9.5492966), up = smoothstep(1.15, 1.2, psi) * (1. - smoothstep(1.95, 2., psi));
        float scale = up * step(.48, h) * step(h, .6) * step(.79, r) * (1. - smoothstep(.07, .07 + 2. * fwidth(tick), abs(tick - .5))) * (fract(psi * 1.9098593) < .5 ? 1. : .6);
        float index = (1. - smoothstep(.004, .004 + 1.5 * fwidth(psi), abs(psi - 1.5708))) * step(.62, h) * step(h, .7) * step(.79, r);
        vec3 albedo = mix(vec3(.04, .042, .046), vec3(.018), grip) * (1. - .8 * min(seams, 1.));
        albedo = mix(albedo, vec3(.6, .06, .045), accent);
        albedo = mix(albedo, vec3(.78), max(scale, index));
        // Gebürstetes Eloxal: der Glanz läuft entlang der Achse, quer zur Bürstrichtung um den Tubus.
        float th = dot(hv, T) / .12, tb = dot(hv, cross(n, T)) / .5;
        float brushed = exp(-(th * th + tb * tb) / (hn * hn)) * max(nl, 0.) * (1. - grip) * (1. - matte) * (1. - accent);
        vec3 key = vec3(1.2, 1.17, 1.12) * max(nl, 0.), sky = mix(vec3(.035), vec3(.26, .27, .28), n.y * .5 + .5);
        c = albedo * (key * 1.15 + sky * .9) + vec3(.45, .45, .48) * brushed + vec3(.07) * pow(max(dot(n, hv), 0.), 24.) * grip
          + env(rr) * pow(1. - max(dot(n, V), 0.), 4.) * (.3 - .2 * matte) + vec3(.5, .2, .15) * pow(max(dot(n, hv), 0.), 80.) * accent
          + vec3(.35) * softbox(rr, .22) * (1. - grip) * (1. - matte) * (.25 + .75 * pow(1. - max(dot(n, V), 0.), 2.));
        c = mix(c, env(rr) * vec3(.8, .82, .85) + vec3(1.8) * softbox(rr, .25), chrome);
      }
    } else
#endif
    {
      // Masse und ihre grauen Gestalten: Idee mit hellerer Spitze, Fundament mit drei gedämpften Tönen, Ihr Projekt offen.
      vec3 albedo = vec3(.19, .2, .2);
      float ao = id == 0 ? mix(.55, 1., smoothstep(-.2, .16, aux)) : 1., gloss = .2;
      if (id == 1) { float tip = smoothstep(.35, 1.15, vPos.y); albedo = mix(albedo, vec3(.5, .5, .47), tip); gloss += .25 * tip; }
#if FORM_A == 2 || FORM_B == 2
      if (id == 2) {
        // Inhalt, Gestaltung, Funktion von unten nach oben, stark entsättigt; die Fugen greifen als Mäander ineinander.
        float s1 = vPos.y - seam(vPos, 0.), s2 = vPos.y - seam(vPos, 1.), layer = step(0., s1) + step(0., s2);
        vec3 tone = layer < .5 ? vec3(.48, .62, .42) : layer < 1.5 ? vec3(.48, .54, .63) : vec3(.67, .8, .33);
        albedo = mix(albedo, tone * .4, .27);
        // Abstand zur Fuge, auf ihre Steigung bezogen, damit die Fuge überall gleich breit und ohne Zacken ist.
        const vec3 ex = vec3(.002, 0., 0.), ez = vec3(0., 0., .002);
        float g1 = abs(s1) / length(vec3(1., (seam(vPos + ex, 0.) - seam(vPos - ex, 0.)) / .004, (seam(vPos + ez, 0.) - seam(vPos - ez, 0.)) / .004));
        float g2 = abs(s2) / length(vec3(1., (seam(vPos + ex, 1.) - seam(vPos - ex, 1.)) / .004, (seam(vPos + ez, 1.) - seam(vPos - ez, 1.)) / .004));
        float g = min(g1, g2);
        ao = 1. - .62 * (1. - smoothstep(.007, .009 + 1.5 * fwidth(g), g));
      }
#endif
      float wrap = max((NL + .2) / 1.2, 0.);
      c = albedo * (vec3(1.3, 1.22, 1.08) * wrap * wrap + sky * .8) * ao + vec3(gloss) * spec(28.) + env(R) * (.05 + FR * .3) * ao;
      // Ihr Projekt: feiner Rand im Akzent um die Mulde, innen ein leises Licht.
      if (id == 8) c += vec3(.68, .84, .29) * .4 * smoothstep(0., .002, aux) * (1. - smoothstep(.004, .012, aux)) + vec3(.06, .075, .05) * smoothstep(.3, 1., aux);
    }
    return c;
  }
  void main(){
    N = normalize(vNormal); V = normalize(cameraPosition - vPos);
    // Raumgut: Normalen je Pixel, Wände aus der Dreiecksfläche, alles andere aus der Höhe der Vorderseite; so bleiben Kanten scharf.
    wallK = -1;
#if FORM_A == 7 || FORM_B == 7
    if ((uFormA == 7 ? 1. - vW : 0.) + (uFormB == 7 ? vW : 0.) > .5 && vAct < .2 && rackFront()) {
      vec3 n;
      wallK = rackWall(n);
      if (wallK >= 0) N = n;
      else {
        int c0, t0;
        const float e = .004;
        float hx = rackHeight(vPos.xy + vec2(e, 0.), c0, t0) - rackHeight(vPos.xy - vec2(e, 0.), c0, t0);
        float hy = rackHeight(vPos.xy + vec2(0., e), c0, t0) - rackHeight(vPos.xy - vec2(0., e), c0, t0);
        // Sprünge an Kanten sind keine Neigung.
        N = normalize(vec3(abs(hx) > .06 ? 0. : -hx, abs(hy) > .06 ? 0. : -hy, 2. * e));
      }
    }
#endif
    R = reflect(-V, N);
    NL = dot(N, normalize(KEY)); NV = max(dot(N, V), 0.); FR = pow(1. - NV, 4.);
    vec3 c = vW < .999 ? shade(uFormA, vAuxA) : vec3(0.);
    if (vW > .001) c = mix(c, shade(uFormB, vAuxB), vW);
    // An der Front wird jedes Material kurz wieder zur grauen Masse, erst dahinter nimmt es das neue an.
    float liquid = vAct * .85;
    if (liquid > .01) c = mix(c, shade(0, 0.), liquid);
    // Kühles Gegenlicht am Rand im Akzentton.
    // Am Koulner-Objektiv bleibt es schwach, sonst färbt es das schwarze Eloxal oliv.
    float lensRim = 1. - .75 * ((uFormA == 9 ? 1. - vW : 0.) + (uFormB == 9 ? vW : 0.));
    c += vec3(.84, .93, .57) * .22 * FR * lensRim * smoothstep(-.3, .5, dot(N, normalize(vec3(.65, .3, -.7))));
    c = (c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14);
    // Glas lässt den Seitengrund durchscheinen, Spiegelungen und Kanten bleiben deckend.
    float glass = ((uFormA == 3 ? 1. - vW : 0.) + (uFormB == 3 ? vW : 0.)) * (1. - liquid);
    gl_FragColor = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)), mix(1., clamp(.3 + .7 * FR + dot(c, vec3(.9)), 0., 1.), glass));
  }`;

// --- Raumgut auf der CPU: die Form ist eine reine Funktion der Kugelrichtung und wird einmal je Netzpunkt berechnet.
// Im Shader kosteten die Kantenschleifen unter Direct3D fast eine Minute Übersetzung.
type Vec = [number, number, number];
function boxDist(qx: number, qy: number, cx: number, cy: number, hx: number, hy: number, r: number) {
  const dx = Math.abs(qx - cx) - hx + r, dy = Math.abs(qy - cy) - hy + r;
  return Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) + Math.min(Math.max(dx, dy), 0) - r;
}
const cellDist = (x: number, y: number, i: number) => { const c = CELLS[i]; return boxDist(x, y, c[0], c[1], c[2], c[3], 0); };
function thingDist(x: number, y: number, i: number) {
  const o = THINGS[i];
  return o[3] === 0 ? Math.sqrt((x - o[0]) ** 2 + (y - o[1]) ** 2) - o[2] : boxDist(x, y, o[0], o[1], o[2], o[3], .04);
}
const edgeDist = (x: number, y: number, k: number) => k < 7 ? cellDist(x, y, k) : thingDist(x, y, k - 7);
function edgeNormal(x: number, y: number, k: number): [number, number] {
  const gx = edgeDist(x + .001, y, k) - edgeDist(x - .001, y, k), gy = edgeDist(x, y + .001, k) - edgeDist(x, y - .001, k);
  const length = Math.sqrt(gx * gx + gy * gy) || 1;
  return [gx / length, gy / length];
}
/** z der Vorderseite an (x, y), wie `rackHeight` im Shader. */
function rackHeight(x: number, y: number) {
  let cell = -1;
  for (let i = 0; i < 7; i++) if (cellDist(x, y, i) < 0) cell = i;
  if (cell < 0) return RACK_FRONT;
  let z = RACK_BACK;
  for (let i = 0; i < 7; i++) if (thingDist(x, y, i) < 0) {
    const o = THINGS[i];
    z = RACK_BACK + (LIFT[i] > 0 ? LIFT[i] : .04 + .6 * Math.sqrt(Math.max(o[2] ** 2 - (x - o[0]) ** 2 - (y - o[1]) ** 2, 0)));
  }
  return z;
}
/** Korpus mit Tiefe und fast scharfen Kanten; ein Band um den Äquator wird zu den Seitenwänden (wie `shelf` im Shader). */
function shelf(d: Vec): Vec {
  const c = RACK_FRONT, r0 = .035, band = .5, quarter = 1.5707963;
  const rho = Math.max(Math.sqrt(d[0] ** 2 + d[1] ** 2), 1e-5), lat = Math.abs(Math.asin(Math.max(-1, Math.min(1, d[2]))));
  const ux = d[0] / rho, uy = d[1] / rho, ax = Math.abs(ux) / 1.22 + 1e-5, ay = Math.abs(uy) / .92 + 1e-5;
  const edge = (ax ** 14 + ay ** 14) ** (-1 / 14), side = c - r0, L = Math.min(lat / band, 1) * (side + r0 * quarter);
  const [mx, my] = lat > band ? [(edge - r0) * (1 - (lat - band) / (quarter - band)), c]
    : L < side ? [edge, L] : [edge - r0 + r0 * Math.cos((L - side) / r0), side + r0 * Math.sin((L - side) / r0)];
  return [ux * mx, uy * mx, Math.sign(d[2]) * my];
}
/**
 * Raumgut an der Kugelrichtung d. Netzpunkte nahe einer Fach- oder Dingkante rücken genau auf die Kante: Wände stehen
 * senkrecht, Kanten bleiben gerade. Zwei Durchgänge: liegt danach noch eine quer verlaufende Kante nahe, rückt der Punkt
 * in die gemeinsame Ecke. Parallele Kanten (die zwei Seiten eines Stegs) bleiben im zweiten Durchgang außen vor.
 * snap ist der Fangradius, gut eine Kantenlänge des Netzes.
 */
export function rackPoint(d: Vec, snap: number): Vec {
  const p = shelf(d);
  if (d[2] <= 0 || Math.asin(Math.min(1, d[2])) <= .5) return p;
  let [x, y] = p, along: [number, number] = [0, 0];
  const z = rackHeight(x, y);
  for (let pass = 0; pass < 2; pass++) {
    let best = snap, pick = -1;
    for (let k = 0; k < 14; k++) {
      const e = Math.abs(edgeDist(x, y, k));
      if (e >= best) continue;
      const n = edgeNormal(x, y, k);
      if (Math.abs(n[0] * along[0] + n[1] * along[1]) < .7) { best = e; pick = k; }
    }
    if (pick < 0) break;
    along = edgeNormal(x, y, pick);
    const e = edgeDist(x, y, pick);
    x -= along[0] * e; y -= along[1] * e;
  }
  return [x, y, z];
}
const normalize = (v: Vec): Vec => { const l = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
/**
 * Hängt die Raumgut-Punkte an das Netz: an jedem Punkt und an den zwei Nachbarn, die der Vertex-Shader für die Normale
 * nimmt. Mit pause rechnet es in Abschnitten und gibt dazwischen den Hauptthread frei (am Stück rund 100 ms).
 */
async function addRack(sphere: BufferGeometry, detail: number, pause?: () => Promise<void>) {
  const position = sphere.getAttribute('position'), count = position.count, snap = 2 / detail;
  const lists = [new Float32Array(count * 3), new Float32Array(count * 3), new Float32Array(count * 3)];
  for (let v = 0; v < count; v++) {
    if (pause && v % 2000 === 1999) await pause();
    const d = normalize([position.getX(v), position.getY(v), position.getZ(v)]);
    // Wie im Shader: t1 = normalize(cross(d, oben oder rechts)), t2 = cross(d, t1).
    const t1 = normalize(Math.abs(d[1]) < .99 ? [-d[2], 0, d[0]] : [0, d[2], -d[1]]);
    const t2: Vec = [d[1] * t1[2] - d[2] * t1[1], d[2] * t1[0] - d[0] * t1[2], d[0] * t1[1] - d[1] * t1[0]];
    const dirs = [d, normalize([d[0] + t1[0] * .006, d[1] + t1[1] * .006, d[2] + t1[2] * .006]), normalize([d[0] + t2[0] * .006, d[1] + t2[1] * .006, d[2] + t2[2] * .006])];
    dirs.forEach((dir, i) => lists[i].set(rackPoint(dir, snap), v * 3));
  }
  sphere.setAttribute('aRack', new BufferAttribute(lists[0], 3));
  sphere.setAttribute('aRack1', new BufferAttribute(lists[1], 3));
  sphere.setAttribute('aRack2', new BufferAttribute(lists[2], 3));
}

/**
 * Netz, Shaderprogramme und Kamera der Verwandlung, gemeinsam für die Seite (`live.ts`) und das Vorrendern
 * (`scripts/render-journey.mjs`). Je Gestaltenpaar ein eigenes Programm. Die Kamera sieht den quadratischen Rahmen der
 * Vorrender-Fassung, in dem die größte Gestalt FRAME_FILL des halben Bildes füllt.
 */
export function createStage(detail: number) {
  const geometry = new IcosahedronGeometry(1, detail);
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const sphere = mergeVertices(geometry);
  geometry.dispose();
  let rack: Promise<void> | undefined;
  const needsRack = (a: number, b: number) => formAt(a) === 7 || formAt(b) === 7;
  const formAt = (index: number) => index < 0 ? 0 : FORMS[stations[Math.min(index, stations.length - 1)].id] ?? 0;
  const uniforms = { uT: { value: 0 }, uFormA: { value: 0 }, uFormB: { value: 0 }, uSeedA: { value: 0 }, uSeedB: { value: 0 } };
  const materials = new Map<string, ShaderMaterial>();
  const mesh = new Mesh(sphere);
  // Der Shader verformt die Kugel über ihre Grenzen hinaus.
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new PerspectiveCamera(30, 1, .1, 60);
  const distance = EXTENT / (FRAME_FILL * Math.tan((camera.fov * Math.PI) / 360));

  /** Programm für den Übergang von Position a nach b (−1 Übersicht, 0 … 8 Stationen). */
  /** Ein Programm je Gestaltenpaar. */
  const key = (a: number, b: number) => `${formAt(a)}-${formAt(b)}`;
  function material(a: number, b: number) {
    const formA = formAt(a), formB = formAt(b);
    let entry = materials.get(key(a, b));
    if (!entry) {
      // Offline ohne vorheriges prepare: am Stück rechnen (ohne pause läuft addRack synchron durch).
      if (!rack && needsRack(a, b)) rack = addRack(sphere, detail);
      entry = new ShaderMaterial({ defines: { FORM_A: formA, FORM_B: formB }, uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true });
      materials.set(key(a, b), entry);
    }
    return entry;
  }
  /** Bereitet den Übergang a nach b vor, ohne den Hauptthread lange zu belegen (das Regal braucht Punkte von der CPU). */
  function prepare(a: number, b: number) {
    if (!rack && needsRack(a, b)) rack = addRack(sphere, detail, () => new Promise(resolve => setTimeout(resolve)));
    return needsRack(a, b) ? rack! : Promise.resolve();
  }
  /** Stellt Netz, Programm und Kamera auf den Übergang a nach b beim Fortschritt t (0 bis 1). */
  function set(a: number, b: number, t: number) {
    mesh.material = material(a, b);
    uniforms.uT.value = t;
    uniforms.uFormA.value = formAt(a); uniforms.uFormB.value = formAt(b);
    uniforms.uSeedA.value = a + 2; uniforms.uSeedB.value = b + 2;
    const e = t * t * (3 - 2 * t), pa = POSES[a + 1], pb = POSES[b + 1];
    const azimuth = (pa[0] + (pb[0] - pa[0]) * e) * Math.PI / 180, elevation = (pa[1] + (pb[1] - pa[1]) * e) * Math.PI / 180;
    // Unterwegs fährt die Kamera kurz zurück und wieder heran.
    const r = distance * (pa[2] + (pb[2] - pa[2]) * e) * (1 + .1 * Math.sin(Math.PI * t));
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * r, Math.sin(elevation) * r, Math.cos(azimuth) * Math.cos(elevation) * r);
    camera.lookAt(0, 0, 0);
  }
  return {
    scene, camera, mesh, key, material, prepare, set,
    dispose() {
      sphere.dispose();
      for (const entry of materials.values()) entry.dispose();
    },
  };
}

/** Rendert die Verwandlung offline in quadratische Einzelbilder (`scripts/render-journey.mjs`). */
export function createFrameRenderer(size: number, detail = 96) {
  const stage = createStage(detail);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  return {
    canvas: renderer.domElement,
    render(a: number, b: number, t: number) {
      stage.set(a, b, t);
      renderer.render(stage.scene, stage.camera);
    },
    dispose() {
      stage.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
