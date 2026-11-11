/**
 * Vorgerenderte Verwandlung. Übergang i führt von Position i − 1 nach i (−1 ist die Übersicht, 0 … 8 die Stationen)
 * und besteht aus FRAMES + 1 quadratischen Bildern; Bild 0 und Bild FRAMES sind die ruhenden Gestalten.
 * Wird von `scripts/render-journey.mjs` (Node, ohne Bundler) und von `frames.ts` gelesen, darum ohne Importe.
 */
export const FRAMES = 32;
/** Übersicht → erste Station … vorletzte → letzte Station; entspricht der Zahl der Stationen. */
export const TRANSITIONS = 9;
/** Kantenlänge in Pixeln je Fassung. */
export const VARIANTS = { desktop: 1152, mobile: 672 } as const;
export type Variant = keyof typeof VARIANTS;
/** Anteil des halben Bildes, den die größte Gestalt füllt; der Rand fängt Nahfahrt und Spritzer an der Front auf. */
export const FRAME_FILL = .72;
export const framePath = (variant: Variant, transition: number, frame: number) =>
  `journey/frames/${variant}/${transition}-${String(frame).padStart(2, '0')}.webp`;
/**
 * Beschreibung je Fassung: sichtbarer Rahmen (x0, y0, x1, y1 als Anteil des Bildes) der ruhenden Gestalt an jeder
 * Position, beginnend mit der Übersicht. Die Seite passt damit jede Gestalt in die freie Fläche ein.
 */
export const manifestPath = (variant: Variant) => `journey/frames/${variant}/frames.json`;
export interface FrameManifest { frames: number; size: number; boxes: [number, number, number, number][] }
