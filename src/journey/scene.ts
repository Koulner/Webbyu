import { IcosahedronGeometry, Mesh, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { stations } from './data';
import type { LandscapeController } from './controller';

/**
 * Eine graue, formlose Masse, die sich mit jeder Station verwandelt. Ein einziges Netz: Der Vertex-Shader bildet die
 * Kugelrichtung auf Gestalt A und B ab und mischt beide entlang einer Front, die aus dem Inhalt der Zielstation kommt
 * (Abzieher von oben, Hobel von links, Wärme von unten …). An der Front wird jede Gestalt kurz wieder graue, flüssige
 * Masse, erst dahinter nimmt sie Form und Material der Zielstation an. Alles Bewegte ist eine Funktion des gedämpften
 * Fortschritts; zwischen den Stationen ruht das Bild und es wird nicht gerendert.
 */
/** Gestalt je Station; 0 ist die formlose Masse der Übersicht. */
export const FORMS: Record<string, number> = {
  'die-idee': 1, 'das-fundament': 2, klarblick: 3, 'eiche-und-form': 4,
  'hof-und-flamme': 5, 'safran-atelier': 6, raumgut: 7, 'der-naechste-abschnitt': 8,
};
/** Kamera je Position (Übersicht, dann Stationen): Azimut und Höhe in Grad, Abstand relativ. */
const POSES: [number, number, number][] = [
  [28, 14, 1.1], [20, 6, 1.05], [24, 30, 1.05],
  [6, 3, 1], [36, 24, 1.02], [-18, -6, 1.1],
  [28, 44, 1], [-22, 14, 1], [0, 4, .82],
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

const vertex = `
  uniform float uT; uniform int uFormA; uniform int uFormB; uniform float uSeedA; uniform float uSeedB;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vAuxA; varying float vAuxB;
  ${noise}
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
  // Das Fundament: drei gestaffelte, gegeneinander gedrehte Schichten. Abstand entlang des Strahls per Bisektion.
  float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
  vec3 turn(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
  float layers(vec3 p){
    float a = box(turn(p - vec3(0., -.44, 0.), .2), vec3(1.05, .23, .78), .06);
    float b = box(turn(p - vec3(.04, 0., 0.), -.32), vec3(.9, .23, .66), .06);
    float c = box(turn(p - vec3(-.03, .44, 0.), .52), vec3(.74, .23, .54), .06);
    return min(min(a, b), c);
  }
  vec3 foundation(vec3 d){
    // Mittelpunkt in der unteren Schicht, damit fast jeder Strahl die Schichten genau einmal verlässt.
    const vec3 o = vec3(0., -.42, 0.);
    float lo = 0., hi = 1.7;
    for (int i = 0; i < 18; i++) { float m = (lo + hi) * .5; if (layers(o + d * m) < 0.) lo = m; else hi = m; }
    return o + d * (lo + hi) * .5;
  }
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
  // Raumgut: Lage im Raster der Vorderseite (Spalte, Zeile) und Fachmaske (0 Steg, 1 Fach).
  vec3 rackCell(vec2 q){
    vec2 g = vec2((q.x + .88) / .44, (.6 - q.y) / .4), l = fract(g) - .5;
    float inside = step(0., g.x) * step(g.x, 4.) * step(0., g.y) * step(g.y, 3.);
    return vec3(floor(g), inside * (1. - smoothstep(.2, .43, max(abs(l.x), abs(l.y)))));
  }
  // Raumgut: ein Regal aus Fächern; ein Fach tritt nach vorn. w: Fach (-1) oder vortretendes Fach (1).
  vec4 rack(vec3 d){
    vec3 p = slab(d, vec2(1.22, .9), .24, .4), cell = rackCell(p.xy);
    float face = step(0., d.z) * step(.4, abs(asin(clamp(d.z, -1., 1.)))) * cell.z;
    float pick = step(abs(cell.x - 2.), .1) * step(abs(cell.y - 1.), .1);
    p.z += face * mix(-.13, .32, pick);
    return vec4(p, face * (pick > .5 ? 1. : -1.));
  }
  // Ihr Projekt: wieder formlose Masse, aber offen, mit einer Mulde zur Kamera; w ist die Tiefe der Mulde.
  vec4 open(vec3 d, float seed){
    vec4 m = mass(d, seed);
    float bowl = smoothstep(.42, 1., d.z), lip = smoothstep(.25, .42, d.z) * (1. - smoothstep(.42, .6, d.z));
    float r = (1. + m.w * (1. - bowl)) * (1. - .88 * bowl) + .07 * lip;
    return vec4(d * r * vec3(1.06, .95, 1.), bowl);
  }
  vec4 form(int id, vec3 d, float seed){
    vec4 r = vec4(0.);
    if (id == 1) r = vec4(drop(d, seed), 0.);
    else if (id == 2) r = vec4(foundation(d), 0.);
    else if (id == 3) r = vec4(slab(d, vec2(1.22, .86), .07, .38), 0.);
    else if (id == 4) r = vec4(cabinet(d), 0.);
    else if (id == 5) r = vec4(flame(d), 0.);
    else if (id == 6) r = crocus(d);
    else if (id == 7) r = rack(d);
    else if (id == 8) r = open(d, seed);
    else r = mass(d, seed);
    return r;
  }
  // Wann sich diese Stelle verwandelt (x, 0 bis 1) und wie weich die Front ist (y). Die Front gehört zur Gestalt B.
  vec2 front(vec3 d){
    vec2 f = vec2(.5 + .32 * snoise(d * .8 + uSeedB * 1.7), .6);
    // Idee: weich von unten nach oben, der Tropfen hebt sich zuletzt.
    if (uFormB == 1) f = vec2((d.y + 1.) * .5, .35);
    // Fundament: Schicht für Schicht von unten.
    else if (uFormB == 2) f = vec2((smoothstep(-.36, -.26, d.y) + smoothstep(.24, .34, d.y)) / 2.6 + (d.y + 1.) * .08, .08);
    // Klarblick: ein gerader Abzieherzug von oben, scharf.
    else if (uFormB == 3) f = vec2((1. - d.y) * .5, .045);
    // Eiche & Form: ein Hobelzug von links, scharf.
    else if (uFormB == 4) f = vec2((d.x + 1.) * .5 + d.y * .05, .035);
    // Hof & Flamme: Wärme steigt von unten, weich und unruhig.
    else if (uFormB == 5) f = vec2((d.y + 1.) * .5 + .12 * snoise(d * 2.3 + 11.), .3);
    // Safran Atelier: die Blüte öffnet sich von oben.
    else if (uFormB == 6) f = vec2((1. - d.y) * .5 + .05 * snoise(d * 3. + 5.), .3);
    // Raumgut: Fach für Fach in Leserichtung, die Stege dazwischen gleiten mit.
    else if (uFormB == 7) {
      vec3 p = slab(d, vec2(1.22, .9), .24, .4), cell = rackCell(p.xy);
      float order = clamp((.6 - p.y) / 1.2, 0., 1.) * .8 + clamp((p.x + .88) / 1.76, 0., 1.) * .2;
      float inFace = step(0., d.z) * step(.4, abs(asin(clamp(d.z, -1., 1.)))) * cell.z;
      f = vec2(mix(order, (cell.y * 4. + cell.x) / 12. * .92, inFace), .12);
    }
    // Ihr Projekt: die Mulde öffnet sich zur Kamera hin.
    else if (uFormB == 8) f = vec2((1. - d.z) * .5, .4);
    return f;
  }
  vec3 surface(vec3 d, out float w, out float act, out vec2 aux){
    vec2 f = front(d);
    f.x = clamp(f.x, 0., 1.);
    float x = (uT * (1. + f.y) - f.x) / f.y, travel = sin(PI * uT);
    w = smoothstep(0., 1., x);
    act = 4. * w * (1. - w);
    vec4 a = uT < 1. ? form(uFormA, d, uSeedA) : vec4(0.), b = uT > 0. ? form(uFormB, d, uSeedB) : vec4(0.);
    aux = vec2(a.w, b.w);
    vec3 p = mix(a.xyz, b.xyz, w);
    if (travel < .001) return p;
    // An der Front wird die Gestalt kurz wieder Masse und flüssig; wo die Front vorbei ist, setzt sie sich.
    p = mix(p, mass(d, uSeedB).xyz, act * .4);
    p += d * (.06 * travel * (1. - w) + .07 * act) * snoise(d * 1.7 + vec3(0., -uT * 2.6, uT * 1.2) + uSeedB);
    // Abstand vor der Front, in Einheiten der Frontkoordinate.
    float ahead = f.x - (uT * (1. + f.y) - f.y * .5), pile = (ahead - .05) / .045, chip = (ahead + .02) / .03;
    // Klarblick: vor dem Abzieher staut sich die Masse wie Wasser.
    if (uFormB == 3) p += d * .2 * travel * exp(-pile * pile);
    // Eiche & Form: hinter dem Hobel hebt sich ein Span.
    if (uFormB == 4) p += vec3(-.3, 1., 0.) * .16 * travel * exp(-chip * chip) * smoothstep(.1, .7, d.y);
    // Hof & Flamme: die Wärme dehnt die Masse und hebt sie an.
    if (uFormB == 5) p += (d * .08 + vec3(0., .14, 0.)) * act;
    return p;
  }
  void main(){
    vec3 d = normalize(position);
    vec3 t1 = normalize(cross(d, abs(d.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), t2 = cross(d, t1);
    float w, act, w1, a1;
    vec2 aux, x1;
    vec3 p = surface(d, w, act, aux);
    vec3 p1 = surface(normalize(d + t1 * .006), w1, a1, x1), p2 = surface(normalize(d + t2 * .006), w1, a1, x1);
    vNormal = normalize(cross(p1 - p, p2 - p));
    vPos = p; vW = w; vAct = act; vAuxA = aux.x; vAuxB = aux.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;

const fragment = `
  uniform int uFormA; uniform int uFormB;
  varying vec3 vPos; varying vec3 vNormal; varying float vW; varying float vAct; varying float vAuxA; varying float vAuxB;
  ${noise}
  const vec3 KEY = vec3(-.5, .72, .48);
  vec3 N, V, R; float NL, NV, FR;
  // Studio ohne Bild: dunkler Petrolboden, heller Himmel, ein weiches Lichtfeld oben links.
  vec3 env(vec3 r){
    vec3 c = mix(vec3(.012, .03, .035), vec3(.3, .38, .38), smoothstep(-.25, .7, r.y));
    return c + vec3(2.2, 2.1, 1.9) * smoothstep(.82, .97, dot(r, normalize(vec3(-.5, .72, .48))));
  }
  float spec(float power){ return pow(max(dot(N, normalize(normalize(KEY) + V)), 0.), power); }
  vec3 shade(int id, float aux){
    vec3 key = vec3(1.25, 1.18, 1.05) * max(NL, 0.), sky = mix(vec3(.04, .08, .085), vec3(.3, .36, .36), N.y * .5 + .5), c = vec3(0.);
    if (id == 3) {
      // Glas: fast nur Spiegelung, zwei schräge Glanzstreifen, die mit dem Blick wandern; grünliche Kante.
      float band = vPos.x * .55 + vPos.y * .7 + R.x * .9;
      float streak = (1. - smoothstep(0., .12, abs(band - .3))) * .55 + (1. - smoothstep(0., .035, abs(band - .52))) * .8;
      float sheen = .05 * smoothstep(1.2, -1., band);
      c = vec3(.012, .03, .034) + env(R) * mix(.05, 1., FR) + vec3(streak + sheen) + vec3(.3, .48, .34) * pow(1. - NV, 3.) + vec3(1.6) * spec(220.);
    } else if (id == 4) {
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
    } else if (id == 5) {
      // Glut: dunkle, glänzende Haut, innen warm glühend; am Grund und in der Mitte am hellsten, nach oben kühler.
      float h = clamp((vPos.y + 1.2) / 2.6, 0., 1.);
      float inner = (pow(NV, 2.8) * (1. - .55 * h) + .25 * (1. - h) * (1. - h)) * (.85 + .3 * snoise(vPos * vec3(2.2, 1.4, 2.2) + vec3(0., -1.5, 0.)));
      vec3 glow = mix(vec3(.45, .05, .01), vec3(1., .36, .06), smoothstep(.15, .6, inner));
      glow = mix(glow, vec3(1.25, .8, .38), smoothstep(.6, 1., inner));
      c = vec3(.05, .025, .015) * (key + sky) + glow * inner * .95 + env(R) * FR * .45 + vec3(.55, .45, .35) * spec(70.);
    } else if (id == 6) {
      // Krokus: gedämpftes Violett mit feinen Adern, durchscheinend im Gegenlicht; die Fäden safranrot.
      float vein = .5 + .5 * snoise(vPos * vec3(10., 2.5, 10.));
      vec3 petal = mix(vec3(.24, .17, .32), vec3(.44, .38, .53), smoothstep(-.25, .75, vPos.y)) * (.85 + .15 * vein);
      vec3 albedo = mix(petal, vec3(.55, .06, .025), aux);
      float through = pow(max(-NL, 0.), 1.5) * (1. - aux);
      c = albedo * (key * .95 + sky * .8 + vec3(.5, .4, .55) * through) + vec3(.1) * spec(30.) * (1. - aux) + env(R) * FR * .2 + vec3(.45, .07, .02) * aux * .3;
    } else if (id == 7) {
      // Raumgut: hell und naturmatt; Fächer innen im Schatten, das vortretende Fach etwas heller.
      vec3 albedo = vec3(.4, .47, .37) * (1. + .2 * max(aux, 0.));
      c = albedo * (key * 1.05 + sky * .75) * (1. - .5 * max(-aux, 0.)) + vec3(.05) * spec(16.) + env(R) * FR * .12;
    } else {
      // Masse und ihre grauen Gestalten: Idee mit hellerer Spitze, Fundament mit drei gedämpften Tönen, Ihr Projekt offen.
      vec3 albedo = vec3(.19, .2, .2);
      float ao = id == 0 ? mix(.55, 1., smoothstep(-.2, .16, aux)) : 1., gloss = .2;
      if (id == 1) { float tip = smoothstep(.35, 1.15, vPos.y); albedo = mix(albedo, vec3(.5, .5, .47), tip); gloss += .25 * tip; }
      if (id == 2) {
        // Inhalt, Gestaltung, Funktion von unten nach oben, stark entsättigt; die Fugen liegen im Schatten.
        float layer = step(-.22, vPos.y) + step(.22, vPos.y);
        vec3 tone = layer < .5 ? vec3(.48, .62, .42) : layer < 1.5 ? vec3(.48, .54, .63) : vec3(.67, .8, .33);
        albedo = mix(albedo, tone * .4, .32);
        ao = mix(.62, 1., smoothstep(0., .08, abs(abs(vPos.y) - .22)));
      }
      float wrap = max((NL + .2) / 1.2, 0.);
      c = albedo * (vec3(1.3, 1.22, 1.08) * wrap * wrap + sky * .8) * ao + vec3(gloss) * spec(28.) + env(R) * (.05 + FR * .3) * ao;
      // Ihr Projekt: feiner Rand im Akzent um die Mulde, innen ein leises Licht.
      if (id == 8) c += vec3(.68, .84, .29) * .4 * smoothstep(0., .002, aux) * (1. - smoothstep(.004, .012, aux)) + vec3(.06, .075, .05) * smoothstep(.3, 1., aux);
    }
    return c;
  }
  void main(){
    N = normalize(vNormal); V = normalize(cameraPosition - vPos); R = reflect(-V, N);
    NL = dot(N, normalize(KEY)); NV = max(dot(N, V), 0.); FR = pow(1. - NV, 4.);
    vec3 c = vW < .999 ? shade(uFormA, vAuxA) : vec3(0.);
    if (vW > .001) c = mix(c, shade(uFormB, vAuxB), vW);
    // An der Front wird jedes Material kurz wieder zur grauen Masse, erst dahinter nimmt es das neue an.
    float liquid = vAct * .85;
    if (liquid > .01) c = mix(c, shade(0, 0.), liquid);
    // Kühles Gegenlicht am Rand im Akzentton.
    c += vec3(.84, .93, .57) * .22 * FR * smoothstep(-.3, .5, dot(N, normalize(vec3(.65, .3, -.7))));
    c = (c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14);
    // Glas lässt den Seitengrund durchscheinen, Spiegelungen und Kanten bleiben deckend.
    float glass = ((uFormA == 3 ? 1. - vW : 0.) + (uFormB == 3 ? vW : 0.)) * (1. - liquid);
    gl_FragColor = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)), mix(1., clamp(.3 + .7 * FR + dot(c, vec3(.9)), 0., 1.), glass));
  }`;

export function initLandscape(container: HTMLElement): LandscapeController {
  const host = container.querySelector<HTMLElement>('.journey-webgl')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // shortcut: Netzfeinheit wird beim Start festgelegt; ein späterer Wechsel über 760 px behält sie bis zum Neuladen.
  const geometry = new IcosahedronGeometry(1, container.clientWidth < 760 ? 28 : 48);
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  const sphere = mergeVertices(geometry);
  geometry.dispose();
  const ratio = Math.min(devicePixelRatio, 1.5);
  const disposers: (() => void)[] = [];
  let renderer: WebGLRenderer | undefined;
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, current = -1, target = -1, t = 0, distance = 6;
  // Ein Sprung über mehrere Stationen verwandelt nur einmal: von der sichtbaren Gestalt (leap) direkt zur Zielgestalt.
  let leap: number | undefined, leapAt = 0, leapForward = true;

  const clamp = (index: number) => Math.max(-1, Math.min(index, stations.length - 1));
  const formAt = (index: number) => index < 0 ? 0 : FORMS[stations[clamp(index)].id] ?? 0;
  const uniforms = { uT: { value: 0 }, uFormA: { value: 0 }, uFormB: { value: 0 }, uSeedA: { value: 0 }, uSeedB: { value: 0 } };
  const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true });
  const piece = new Mesh(sphere, material);
  // Der Shader verformt die Kugel über ihre Grenzen hinaus.
  piece.frustumCulled = false;

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const dispose of disposers.reverse()) dispose();
    sphere.dispose();
    material.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
    delete container.dataset.render;
  }
  function fallback() {
    cleanup();
    container.dataset.render = 'static';
  }

  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(ratio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.append(renderer.domElement);
  } catch {
    fallback();
    return { setProgress() {}, setEnabled() {}, dispose: cleanup };
  }
  const gpu = renderer;
  const contextLost = (event: Event) => { event.preventDefault(); fallback(); };
  gpu.domElement.addEventListener('webglcontextlost', contextLost);
  disposers.push(() => gpu.domElement.removeEventListener('webglcontextlost', contextLost));

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, .1, 60);
  scene.add(piece);
  container.dataset.render = 'material';

  /** Die beiden Stationen des laufenden Übergangs. Rückwärts läuft der Übergang der Station, die man verlässt. */
  function ends(from: number): [number, number] {
    if (leap !== undefined && from !== leapAt) leap = undefined;
    if (leap === undefined) return [from, clamp(from + 1)];
    return leapForward ? [leap, clamp(from + 1)] : [from, leap];
  }
  const visibleStation = () => leap !== undefined && (t < .5) === leapForward ? leap : Math.round(current);

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    const compact = width < 760;
    gpu.setSize(width, height, false);
    camera.aspect = width / height;
    // Freie Fläche für die Gestalt: Desktop rechts neben dem Text (34 %) unter der Bildzeile, mobil unter Kopf und Bildzeile bis zum Textbeginn.
    const [left, right, top, bottom] = compact
      ? [16, width - 16, 112, Math.min(520, Math.max(330, height * .53))]
      : [width * .42, width * .97, 175, height - 150];
    const radius = Math.max(60, Math.min(right - left, bottom - top) / 2 * .92);
    distance = EXTENT * height / (2 * radius * Math.tan((camera.fov * Math.PI) / 360));
    camera.setViewOffset(width, height, width / 2 - (left + right) / 2, height / 2 - (top + bottom) / 2, width, height);
    invalidate();
  }

  function place(a: number, b: number) {
    const e = t * t * (3 - 2 * t), pa = POSES[a + 1], pb = POSES[b + 1];
    const azimuth = (pa[0] + (pb[0] - pa[0]) * e) * Math.PI / 180, elevation = (pa[1] + (pb[1] - pa[1]) * e) * Math.PI / 180;
    // Unterwegs fährt die Kamera kurz zurück und wieder heran.
    const r = distance * (pa[2] + (pb[2] - pa[2]) * e) * (1 + .1 * Math.sin(Math.PI * t));
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * r, Math.sin(elevation) * r, Math.cos(azimuth) * Math.cos(elevation) * r);
    camera.lookAt(0, 0, 0);
  }

  function render(time: number) {
    frame = 0;
    if (disposed || !enabled || !visible || document.hidden) return;
    const step = lastTime ? Math.min(.05, (time - lastTime) / 1000) : .016;
    lastTime = time;
    current = reduced.matches ? target : current + (target - current) * Math.min(1, step * 2.6);
    if (Math.abs(target - current) < .002) { current = target; leap = undefined; }
    const from = Math.floor(current);
    t = current - from;
    const [a, b] = ends(from);
    uniforms.uT.value = t;
    uniforms.uFormA.value = formAt(a); uniforms.uFormB.value = formAt(b);
    uniforms.uSeedA.value = a + 2; uniforms.uSeedB.value = b + 2;
    place(a, b);
    try { gpu.render(scene, camera); } catch { fallback(); return; }
    if (current !== target) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function invalidate() {
    if (!frame && !disposed && enabled && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  disposers.push(() => resizeObserver.disconnect());
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); invalidate(); });
  visibilityObserver.observe(container);
  disposers.push(() => visibilityObserver.disconnect());
  document.addEventListener('visibilitychange', invalidate);
  disposers.push(() => document.removeEventListener('visibilitychange', invalidate));
  reduced.addEventListener?.('change', invalidate);
  disposers.push(() => reduced.removeEventListener?.('change', invalidate));
  resize();

  return {
    setProgress(value, immediate = false) {
      target = clamp(Number.isFinite(value) ? value : -1);
      if (immediate) { current = target; leap = undefined; }
      else if (Math.abs(target - current) > 1) {
        leap = visibleStation();
        leapForward = target > current;
        leapAt = leapForward ? Math.floor(target) - 1 : Math.ceil(target);
        current = leapForward ? leapAt : leapAt + .999;
      }
      invalidate();
    },
    setEnabled(value) {
      enabled = value;
      if (!enabled) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTime = 0; invalidate(); }
    },
    dispose: cleanup,
  };
}
