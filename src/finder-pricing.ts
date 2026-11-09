import { packages, type PackageChoice } from './data';
import { catalogLineMap, CATALOG_VERSION, catalogPackages, LINE_IDS, type CatalogLine, type LineGroup, type LineId, type LineStatus } from './pricing-catalog';
import { EXTENSION_IDS, recommendPackage, type BriefState, type ShownLine } from './state';

export type Route = 'website' | 'media' | 'advice';

export interface Line extends ShownLine {
  label: string;
  detail?: string;
  group?: LineGroup;
  removable: boolean;
  indication?: CatalogLine['indication'];
  unit?: CatalogLine['unit'];
}

export interface Sum { min: number; max: number; /** Anzahl der Positionen mit Betrag (fixed, range). */ amounts: number; open: number }

export interface Orientation {
  route: Route;
  /** Empfehlung nach den Regeln; ohne Website-Paket (Medien-Weg, noch unklar) immer `custom`. */
  recommended: PackageChoice;
  /** Wirksame Wahl: Wunsch des Besuchers oder Empfehlung. */
  choice: PackageChoice;
  label: string;
  /** Sichtbare Positionen, ohne die abgewählten. */
  lines: Line[];
  removed: Line[];
  creation: Line[];
  open: Line[];
  external: Line[];
  sum: Sum;
  notes: string[];
  /** Gründe für „individuell klären“, in Alltagssprache. */
  triggers: string[];
  /** Fotos oder Clip gehören zum Projekt, also ist der Ort relevant. */
  needsZone: boolean;
  /** Der Ort wurde im Schritt „Inhalte“ bereits gefragt. */
  zoneAsked: boolean;
}

export const INDIVIDUAL_LABEL = 'Individuelle Zusammenstellung';
export const CUSTOM_LABEL = 'Individuell klären';
export const MEDIA_LABEL = 'Foto- und Videoprojekt';
const PHOTO_ANSWER_IDS: LineId[] = ['photo_compact_site', 'photo_standard_site'];
const TRAVEL_TRIGGER_IDS: LineId[] = ['photo_compact_site', 'photo_standard_site', 'photo_compact_solo', 'photo_standard_solo', 'clip_addon', 'clip_solo'];

export function routeOf(state: Pick<BriefState, 'projectType'>): Route {
  return state.projectType === 'media' ? 'media' : state.projectType === 'advice' ? 'advice' : 'website';
}

export function packageName(choice: PackageChoice): string {
  return choice === 'custom' ? CUSTOM_LABEL : packages.find(item => item.id === choice)!.name;
}

function make(id: LineId, status: LineStatus): Line {
  const entry = catalogLineMap[id];
  let min = 0;
  let max = 0;
  if (status === 'fixed') min = max = entry.fixed ?? 0;
  else if (status === 'range' || status === 'external') [min, max] = entry.range ?? [0, 0];
  return { id, status, min, max, label: entry.label, detail: entry.detail, group: entry.group, removable: entry.removable === true, indication: entry.indication, unit: entry.unit };
}

/** Ob der Schritt „Inhalte“ nach dem Ort fragt: eigene Fotos oder ein Clip gehören dazu. */
export function asksZoneInContent(state: BriefState): boolean {
  return state.images !== 'ready' && (state.imageSource === 'photo_compact' || state.imageSource === 'photo_standard') || state.video === 'clip';
}

function answerLines(s: BriefState, notes: string[]): Line[] {
  const lines: Line[] = [make('base_start', 'fixed'), ...(['concept', 'correction', 'golive', 'handover'] as const).map(id => make(id, 'included'))];
  if (s.scope === 'extended') lines.push(make('scope_extended', 'fixed'));
  else if (s.scope === 'large') lines.push(make('scope_large', 'open'));
  else if (s.scope === 'unknown') lines.push(make('scope_extended', 'range'));
  if (s.projectType === 'existing') lines.push(make('migration', 'fixed'));
  if (s.texts === 'notes') lines.push(make('text_notes', 'fixed'));
  else if (s.texts === 'missing') lines.push(make('text_interview', 'fixed'));
  else if (s.texts === 'unknown') lines.push(make('text_unknown', 'range'));
  if (s.images !== 'ready') {
    switch (s.imageSource ?? 'open') {
      case 'photo_compact': lines.push(make('photo_compact_site', 'fixed')); break;
      case 'photo_standard': lines.push(make('photo_standard_site', 'fixed')); break;
      case 'licensed': lines.push(make('image_licensed', 'fixed'), make('license_cost', 'external')); break;
      case 'customer_later': notes.push('Sie liefern die Bilder später. Bildwirkung und Seitenaufbau lassen sich erst mit Ihrem Material abschließend festlegen. Es entsteht keine Fototermin-Position.'); break;
      case 'no_photos': notes.push('Ohne Fotos entsteht die Gestaltung aus Schrift, Farbe und Fläche. Das prägt den Eindruck Ihrer Website deutlich. Es entsteht keine Fototermin-Position.'); break;
      default: lines.push(make('image_open', 'open'));
    }
  }
  if (s.video === 'clip') lines.push(make(lines.some(line => PHOTO_ANSWER_IDS.includes(line.id as LineId)) ? 'clip_addon' : 'clip_solo', 'open'));
  else if (s.video === 'unknown') lines.push(make('clip_unknown', 'open'));
  return lines;
}

function mediaLines(s: BriefState): Line[] {
  const lines: Line[] = [];
  switch (s.mediaChoice ?? 'unknown') {
    case 'photo_compact': lines.push(make('photo_compact_solo', 'fixed')); break;
    case 'photo_standard': lines.push(make('photo_standard_solo', 'fixed')); break;
    case 'clip': lines.push(make('clip_solo', 'open')); break;
    case 'photo_clip': lines.push(make('photo_standard_solo', 'fixed'), make('clip_addon', 'open')); break;
    default: lines.push(make('media_open', 'open'));
  }
  if (s.drone) lines.push(make('drone', 'open'));
  if (s.sites === 'multipleSites' || s.mediaUse.includes('third_party')) lines.push(make('media_custom', 'open'));
  return lines;
}

function featureLines(extensions: string[]): Line[] {
  const table: Record<string, [LineId, LineStatus]> = {
    wizard: ['wizard', 'fixed'], booking_embed: ['embed', 'fixed'], language: ['language', 'fixed'],
    booking_custom: ['booking_custom', 'open'], cms: ['cms', 'open'], integration: ['integration', 'open'], '3d': ['3d', 'open'], unsure: ['unsure', 'open'],
  };
  return EXTENSION_IDS.filter(id => extensions.includes(id)).map(id => make(...table[id]));
}

function triggersOf(s: BriefState): string[] {
  return [
    s.scope === 'large' ? 'großer Umfang' : '',
    s.goal === 'sales' ? 'Shop' : '',
    s.extensions.includes('booking_custom') ? 'eigene Buchungslösung' : '',
    s.extensions.includes('integration') ? 'Anbindung von Diensten oder Systemen' : '',
  ].filter(Boolean);
}

export function orientation(state: BriefState): Orientation {
  const route = routeOf(state);
  const notes: string[] = [];
  const recommended = recommendPackage(state);
  const manual = state.selectedPackage;
  const choice: PackageChoice = route === 'website' ? manual ?? recommended : 'custom';
  const triggers = route === 'website' ? triggersOf(state) : [];
  let lines: Line[] = [];

  if (route === 'website') {
    lines = answerLines(state, notes);
    if (manual === 'start' || manual === 'business' || manual === 'complete') {
      // Eine eigene Paketwahl setzt die Modulliste: die Gruppen Text, Foto und Clip kommen aus dem Paket.
      const before = lines;
      const modules = catalogPackages[manual];
      lines = lines.filter(line => line.group !== 'text' && line.group !== 'photo' && line.group !== 'clip' && line.id !== 'license_cost');
      for (const [id, status] of [[modules.text, 'fixed'], [modules.photo, 'fixed'], [modules.clip, 'open']] as const) if (id) lines.push(make(id, status));
      const dropped = before.filter(line => line.group && ['text', 'photo', 'clip'].includes(line.group) && !lines.some(kept => kept.group === line.group));
      if (dropped.length) notes.push(`Im gewählten Paket nicht enthalten und im Gespräch zu klären: ${dropped.map(line => line.label).join(', ')}.`);
      if (triggers.length) notes.push(`Außerhalb der drei Pakete liegt: ${triggers.join(', ')}. Die bekannten Positionen bleiben stehen, der Rest wird individuell geklärt.`);
    }
    lines.push(...featureLines(state.extensions));
    if (state.goal === 'sales') lines.push(make('shop', 'open'));
    lines.push(make('hosting', 'external'), make('legal', 'external'));
  } else if (route === 'media') {
    lines = mediaLines(state);
  }

  const needsZone = lines.some(line => TRAVEL_TRIGGER_IDS.includes(line.id as LineId));
  if (needsZone) lines.push(make(state.zone === 'region' ? 'travel_included' : 'travel_open', state.zone === 'region' ? 'included' : 'open'));
  lines.sort((a, b) => LINE_IDS.indexOf(a.id as LineId) - LINE_IDS.indexOf(b.id as LineId));

  const removedIds = state.removedLines.filter(id => lines.some(line => line.id === id && line.removable));
  const removed = lines.filter(line => removedIds.includes(line.id));
  const visible = lines.filter(line => !removedIds.includes(line.id));

  const sum = visible.reduce<Sum>((total, line) => {
    if (line.status === 'fixed' || line.status === 'range') return { ...total, min: total.min + line.min, max: total.max + line.max, amounts: total.amounts + 1 };
    if (line.status === 'open') return { ...total, open: total.open + 1 };
    return total;
  }, { min: 0, max: 0, amounts: 0, open: 0 });

  let label: string;
  if (route === 'media') label = MEDIA_LABEL;
  else if (route === 'advice' || choice === 'custom') label = CUSTOM_LABEL;
  else {
    const has = (group: LineGroup) => visible.some(line => line.group === group);
    const complete = visible.some(line => line.id === 'photo_standard_site') && has('text') && has('clip');
    const intact = choice === 'start' || (choice === 'business' && visible.some(line => line.id === 'photo_standard_site')) || (choice === 'complete' && complete);
    label = intact ? packageName(choice) : INDIVIDUAL_LABEL;
  }

  return {
    route, recommended, choice, label, lines: visible, removed, sum, notes, triggers, needsZone, zoneAsked: route === 'media' || asksZoneInContent(state),
    creation: visible.filter(line => line.status === 'included' || line.status === 'fixed' || line.status === 'range'),
    open: visible.filter(line => line.status === 'open'),
    external: visible.filter(line => line.status === 'external'),
  };
}

export const shownLinesOf = (o: Orientation): ShownLine[] => o.lines.map(({ id, status, min, max }) => ({ id, status, min, max }));

/**
 * Was tatsächlich zur Anfrage gehört: nur Antworten, die für den gewählten Weg gelten,
 * dazu Katalogversion und die angezeigten Positionen. Versteckte Antworten gehen nicht mit.
 */
export function requestBrief(state: BriefState): BriefState {
  const o = orientation(state);
  const neutral = { scope: 'unknown', texts: 'unknown', images: 'unknown', imageSource: null, video: 'unknown', zone: 'unknown' } as const;
  const none = { mediaChoice: null, mediaUse: [] as string[], sites: 'oneSite', drone: false } as const;
  const derived = { catalogVersion: CATALOG_VERSION, shownLines: shownLinesOf(o), removedLines: o.removed.map(line => line.id).sort() };
  if (o.route === 'media') {
    return { ...state, ...neutral, ...derived, goal: 'media', extensions: [], selectedPackage: null, mediaChoice: state.mediaChoice ?? 'unknown', mediaUse: [...new Set(state.mediaUse)].sort(), sites: state.sites, drone: state.drone, zone: state.zone };
  }
  if (o.route === 'advice') return { ...state, ...neutral, ...none, ...derived, extensions: [], selectedPackage: null, shownLines: [], removedLines: [] };
  return {
    ...state, ...none, ...derived,
    imageSource: state.images === 'ready' ? null : state.imageSource ?? 'open',
    zone: o.needsZone ? state.zone : 'unknown',
    extensions: [...state.extensions].sort(),
  };
}

export const num = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const euro = (value: number) => `${num(value)} €`;
const span = (min: number, max: number) => min === max ? euro(min) : `${num(min)}–${num(max)} €`;

export function lineAmount(line: Line): string {
  switch (line.status) {
    case 'included': return 'enthalten';
    case 'fixed': return euro(line.min);
    case 'range': return span(line.min, line.max);
    case 'external': return line.max > 0 ? `ca. ${span(line.min, line.max)}${line.unit === 'month' ? ' pro Monat' : ''}` : 'je nach Anbieter';
    default: {
      const hint = line.indication;
      if (hint?.from !== undefined) return `offen, ab etwa ${euro(hint.from)}`;
      if (hint?.min !== undefined && hint.max !== undefined) return `offen, Richtwert ${span(hint.min, hint.max)}, kein Festpreis`;
      return 'offen';
    }
  }
}

export function sumText(sum: Sum): string {
  if (sum.open === 0) return sum.amounts ? span(sum.min, sum.max) : 'Keine einmaligen Kosten';
  const open = `${sum.open} ${sum.open === 1 ? 'offene Position' : 'offene Positionen'}`;
  return sum.amounts
    ? `${span(sum.min, sum.max)} + ${open}. Kein vollständiger Gesamtpreis.`
    : `Noch keine Summe möglich: ${open}. Kein vollständiger Gesamtpreis.`;
}

export const ORIENTATION_NOTICE = 'Unverbindliche Orientierung. Verbindlich ist das schriftliche Angebot.';
export const TAX_NOTICE = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
export const BLOCK_TITLES = { creation: 'Einmalige Erstellung', open: 'Noch zu klären', external: 'Laufende Kosten bei Ihren Anbietern' } as const;
