import manifest from './media.json';

export type AreaId = 'menschen' | 'momente' | 'business' | 'kreativ';

export interface StockMedia {
  id: string;
  kind: 'photo' | 'video';
  area: AreaId;
  motif: string; // z. B. "Bewerbungsporträt", "Hund im Park"
  src: string; // /media/stock/<id>.jpg|.mp4, große Fassung
  small?: string; // ca. 960 px breit (Fotos)
  poster?: string; // Standbild (Videos)
  width: number;
  height: number;
  alt: string;
  photographer: string;
  sourceUrl: string;
  license: string;
}

// Pfade in media.json sind relativ zur Website-Basis (IONOS „/“, GitHub Pages „/Webbyu/“).
const raw = manifest as StockMedia[];
export const media: StockMedia[] = raw.map((m) => ({ ...m }));
/** Setzt die Basis vor dem Rendern. Im Browser aus Vite, beim Vorrendern aus vite.config.ts (dort fehlt import.meta.env). */
export function setMediaBase(base: string) {
  raw.forEach((r, i) => Object.assign(media[i], { src: base + r.src, small: r.small && base + r.small, poster: r.poster && base + r.poster }));
}
setMediaBase(import.meta.env?.BASE_URL ?? '/');
export const byArea = (area: AreaId) => media.filter((m) => m.area === area);

// Pflichthinweis, solange Stockmaterial gezeigt wird.
export const STOCK_NOTICE = 'Platzhalter: Stockmaterial, keine Arbeiten von Koulner';
