import type { Goal, PackageChoice } from './data';
import { CATALOG_VERSION, type LineStatus } from './pricing-catalog';

export const PROJECT_TYPES = ['new', 'existing', 'media', 'advice'] as const;
export const SCOPES = ['compact', 'extended', 'large', 'unknown'] as const;
export const TEXT_STATES = ['ready', 'notes', 'missing', 'unknown'] as const;
export const IMAGE_STATES = ['ready', 'partly', 'missing', 'unknown'] as const;
export const IMAGE_SOURCES = ['customer_later', 'photo_compact', 'photo_standard', 'licensed', 'no_photos', 'open'] as const;
export const VIDEO_STATES = ['none', 'clip', 'unknown'] as const;
export const ZONES = ['region', 'outside', 'unknown'] as const;
export const MEDIA_CHOICES = ['photo_compact', 'photo_standard', 'clip', 'photo_clip', 'unknown'] as const;
export const MEDIA_USES = ['website', 'social', 'ads', 'third_party'] as const;
export const MEDIA_SITES = ['oneSite', 'multipleSites'] as const;
export const EXTENSION_IDS = ['wizard', 'booking_embed', 'booking_custom', 'language', 'cms', 'integration', '3d', 'unsure'] as const;
export const GOAL_IDS = ['presence', 'inquiries', 'bookings', 'sales', 'media'] as const;
export const PACKAGE_CHOICES = ['start', 'business', 'complete', 'custom'] as const;

export type ProjectType = typeof PROJECT_TYPES[number];
export type Scope = typeof SCOPES[number];
export type TextState = typeof TEXT_STATES[number];
export type ImageState = typeof IMAGE_STATES[number];
export type ImageSource = typeof IMAGE_SOURCES[number];
export type VideoState = typeof VIDEO_STATES[number];
export type Zone = typeof ZONES[number];
export type MediaChoice = typeof MEDIA_CHOICES[number];
export type MediaSites = typeof MEDIA_SITES[number];

/** Eine Position, wie der Besucher sie gesehen hat. Beträge in ganzen Euro; offene Positionen stehen bei 0. */
export interface ShownLine { id: string; status: LineStatus; min: number; max: number }

export interface BriefState {
  goal: Goal;
  /** Funktionen des Website-Wegs: `EXTENSION_IDS`. */
  extensions: string[];
  projectType: ProjectType;
  timing: string;
  description: string;
  name: string;
  email: string;
  selectedPackage: PackageChoice | null;
  scope: Scope;
  texts: TextState;
  images: ImageState;
  /** Nur gefragt, wenn die Bilder nicht fertig vorliegen; `null` wird wie `open` behandelt. */
  imageSource: ImageSource | null;
  video: VideoState;
  zone: Zone;
  /** Medien-Weg. */
  mediaChoice: MediaChoice | null;
  mediaUse: string[];
  sites: MediaSites;
  drone: boolean;
  /** Vom Besucher abgewählte Positionen (nur `removable`). */
  removedLines: string[];
  /** Katalogversion, nach der die angezeigten Positionen berechnet wurden. */
  catalogVersion: string;
  /** Positionen, wie sie im Browser angezeigt wurden. Keine Tatsache, nur „vom Besucher gesehen“. */
  shownLines: ShownLine[];
}

/**
 * Empfehlung nach der ersten zutreffenden Regel:
 * 1. großer Umfang, Shop, eigene Buchungslösung oder Anbindung: individuell klären,
 * 2. Foto Standard mit Texten und Clip: Complete,
 * 3. Foto Standard: Business,
 * 4. sonst Start mit den gewählten Modulen.
 * Das Ziel wählt kein Paket. Medien-Weg und „noch unklar“ haben kein Website-Paket (`custom`).
 */
export function recommendPackage(brief: Pick<BriefState, 'goal' | 'extensions' | 'projectType' | 'scope' | 'texts' | 'images' | 'imageSource' | 'video'>): PackageChoice {
  if (brief.projectType === 'media' || brief.projectType === 'advice') return 'custom';
  if (brief.scope === 'large' || brief.goal === 'sales' || brief.extensions.includes('booking_custom') || brief.extensions.includes('integration')) return 'custom';
  const standardPhotos = brief.images !== 'ready' && brief.imageSource === 'photo_standard';
  if (standardPhotos && (brief.texts === 'notes' || brief.texts === 'missing') && brief.video === 'clip') return 'complete';
  if (standardPhotos) return 'business';
  return 'start';
}

function snapshot(state: BriefState): BriefState {
  return {
    ...state,
    extensions: [...state.extensions], mediaUse: [...state.mediaUse], removedLines: [...state.removedLines],
    shownLines: state.shownLines.map(line => ({ ...line })),
  };
}

export function createBriefStore() {
  let state: BriefState = {
    goal: 'inquiries', extensions: [], projectType: 'new', timing: 'flexible', description: '', name: '', email: '', selectedPackage: null,
    scope: 'unknown', texts: 'unknown', images: 'unknown', imageSource: null, video: 'unknown', zone: 'unknown',
    mediaChoice: null, mediaUse: [], sites: 'oneSite', drone: false,
    removedLines: [], catalogVersion: CATALOG_VERSION, shownLines: [],
  };
  const listeners = new Set<(state: BriefState) => void>();
  return {
    get: () => snapshot(state),
    update: (patch: Partial<BriefState>) => {
      state = snapshot({ ...state, ...patch });
      listeners.forEach(listener => listener(snapshot(state)));
    },
    subscribe: (listener: (state: BriefState) => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export type BriefStore = ReturnType<typeof createBriefStore>;
export const briefStore = createBriefStore();
