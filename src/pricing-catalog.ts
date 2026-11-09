/**
 * Katalog des Projektberaters: die einzige Stelle für Beträge, Bezeichnungen und Paketmodule.
 * Rein als Daten. Wann welche Position erscheint, steht in `finder-pricing.ts`.
 *
 * Status der Preise: Entwurf, noch nicht zur Veröffentlichung freigegeben.
 * Jede inhaltliche Änderung an Beträgen erhöht die Version; der Browser sendet sie mit.
 * Beträge in ganzen Euro, ohne Umsatzsteuer.
 */
export const CATALOG_VERSION = '2026-11-a';

export type LineGroup = 'base' | 'scope' | 'text' | 'photo' | 'clip';
export type LineStatus = 'included' | 'fixed' | 'range' | 'open' | 'external';
export const LINE_STATUSES: readonly LineStatus[] = ['included', 'fixed', 'range', 'open', 'external'];

export interface CatalogLine {
  label: string;
  /** Kurzer Leistungsumfang, wie er neben der Position erscheint. */
  detail?: string;
  /** Gruppen schließen sich aus: je Gruppe höchstens eine Position. */
  group?: LineGroup;
  /** Betrag, wenn die Position als `fixed` erscheint. */
  fixed?: number;
  /** Spanne, wenn die Position als `range` erscheint (oder Richtwert einer externen Position). */
  range?: readonly [number, number];
  /** Orientierung für offene Positionen, nie in der Summe. `from`: „ab etwa“. */
  indication?: { from?: number; min?: number; max?: number };
  /** Externe Position mit Zeiteinheit. */
  unit?: 'month';
  /** Der Besucher darf die Position abwählen. */
  removable?: boolean;
  /** Folge der Abwahl, wird dem Besucher angezeigt. */
  consequence?: string;
}

const catalogLines = {
  // Website-Weg: Grundlage und immer enthaltene Leistungen
  base_start: { label: 'Grundlage Ihrer Website', detail: 'Individuell gestaltet, mit Besucherführung und Kontaktweg', group: 'base', fixed: 990 },
  concept: { label: 'Konzept' },
  correction: { label: 'Korrektur' },
  golive: { label: 'Livegang' },
  handover: { label: 'Übergabe' },
  // Umfang
  scope_extended: { label: 'Erweiterte Umsetzung', detail: 'Mehrere verschiedene Seitentypen oder etwa 6 bis 12 Seiten', group: 'scope', fixed: 750, range: [0, 750] },
  scope_large: { label: 'Großer Umfang', detail: 'Mehr als etwa 12 Seiten oder viele verschiedene Inhaltsarten', group: 'scope', indication: { from: 1500 } },
  migration: {
    label: 'Bestehende Website übernehmen', detail: 'Inhalte übertragen, alte Adressen weiterleiten', fixed: 190, removable: true,
    consequence: 'Die Inhalte Ihrer bestehenden Website übertragen Sie selbst. Alte Adressen werden dann nicht weitergeleitet.',
  },
  // Texte
  text_notes: {
    label: 'Texte aus Ihren Stichpunkten', detail: 'Sie liefern Stichpunkte, die Texte entstehen daraus, eine Korrektur', group: 'text', fixed: 190, removable: true,
    consequence: 'Texte liefern Sie selbst. Der Projektstart setzt fertige Texte voraus.',
  },
  text_interview: {
    label: 'Texte aus einem Interview', detail: '60 Minuten Interview, Onepager oder bis zu 5 Seiten, eine Korrektur', group: 'text', fixed: 390, removable: true,
    consequence: 'Texte liefern Sie selbst. Der Projektstart setzt fertige Texte voraus.',
  },
  text_unknown: { label: 'Texte, Umfang noch offen', detail: 'Je nach Ausgangslage Stichpunkte oder Interview', group: 'text', range: [190, 390] },
  // Bilder
  photo_compact_site: { label: 'Fotos kompakt im Websiteprojekt', detail: '1 Standort, bis 60 Minuten, 8 Bilder', group: 'photo', fixed: 299 },
  photo_standard_site: { label: 'Fotos Standard im Websiteprojekt', detail: '1 Standort, bis 2 Stunden, 15 Bilder', group: 'photo', fixed: 520 },
  image_licensed: { label: 'Bildauswahl aus Lizenzquellen', detail: 'Auswahl und Einbindung; die Lizenzkosten tragen Sie', group: 'photo', fixed: 90 },
  image_open: { label: 'Bildquelle noch offen', group: 'photo' },
  license_cost: { label: 'Lizenzkosten der Bildquelle', detail: 'Je nach Quelle, direkt an den Anbieter' },
  // Medien-Weg: Fotos ohne Website
  photo_compact_solo: { label: 'Fotos kompakt', detail: '1 Standort, bis 60 Minuten, 8 Bilder', group: 'photo', fixed: 349 },
  photo_standard_solo: { label: 'Fotos Standard', detail: '1 Standort, bis 2 Stunden, 15 Bilder', group: 'photo', fixed: 590 },
  media_open: { label: 'Medienumfang noch offen' },
  // Video
  clip_addon: { label: 'Kurzclip beim Fototermin', detail: 'Ein Thema, ein Format, 15 bis 30 Sekunden', group: 'clip', indication: { min: 390, max: 490 } },
  clip_solo: { label: 'Kurzclip', detail: 'Ein Thema, ein Format, 15 bis 30 Sekunden', group: 'clip', indication: { min: 590, max: 790 } },
  clip_unknown: { label: 'Video, Umfang noch offen', group: 'clip' },
  // Anfahrt
  travel_included: { label: 'Anfahrt in Ihrer Region' },
  travel_open: { label: 'Anfahrt außerhalb der Region' },
  // Funktionen
  wizard: { label: 'Auswahlhilfe', detail: 'Bis zu 5 Fragen, das Ergebnis erreicht Sie als geordnete Anfrage', fixed: 490 },
  embed: { label: 'Vorhandenen Dienst einbinden', detail: 'Zum Beispiel eine Terminbuchung, mit Einwilligungslösung', fixed: 150 },
  language: { label: 'Weitere Sprache', detail: 'Übersetzung, Prüfung durch Sie', fixed: 290 },
  booking_custom: { label: 'Eigene Buchungslösung' },
  cms: { label: 'Inhalte selbst pflegen' },
  integration: { label: 'Anbindung von Diensten oder Systemen' },
  '3d': { label: 'Interaktives 3D' },
  unsure: { label: 'Weitere Funktionen noch offen' },
  shop: { label: 'Shop' },
  // Außerhalb der Webbyu-Summe, ohne Zahl: Webbyu hostet nichts, der Anbieter des Kunden bestimmt den Preis.
  hosting: { label: 'Domain und Hosting', detail: 'Laufen auf Ihren Namen, kein Vertrag mit Webbyu' },
  legal: { label: 'Rechtstexte' },
  // Medien-Weg: weitere offene Punkte
  drone: { label: 'Drohnenaufnahmen', detail: 'Abhängig von Ort, Wetter und Vorbereitung' },
  media_custom: { label: 'Mehrere Standorte oder Weitergabe an Dritte' },
} satisfies Record<string, CatalogLine>;

export type LineId = keyof typeof catalogLines;
export const catalogLineMap: Record<LineId, CatalogLine> = catalogLines;
export const LINE_IDS = Object.keys(catalogLines) as LineId[];
/** Positionen, die der Besucher abwählen darf. */
export const REMOVABLE_LINE_IDS = LINE_IDS.filter(id => catalogLineMap[id].removable === true);

/**
 * Module der drei Pakete. Eine eigene Paketwahl ersetzt die Gruppen Text, Foto und Clip
 * durch diese Module, damit nichts doppelt berechnet wird.
 */
export const catalogPackages = {
  start: { text: null, photo: null, clip: null },
  business: { text: null, photo: 'photo_standard_site', clip: null },
  complete: { text: 'text_interview', photo: 'photo_standard_site', clip: 'clip_addon' },
} as const satisfies Record<string, { text: LineId | null; photo: LineId | null; clip: LineId | null }>;

export const catalog = { version: CATALOG_VERSION, lines: catalogLineMap, packages: catalogPackages } as const;
