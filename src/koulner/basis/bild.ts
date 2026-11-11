// Bild-Bausteine für Seite und Anfrage.
import type { StockMedia } from '../shared/media';

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const still = (m: StockMedia) => (m.kind === 'video' ? m.poster! : (m.small ?? m.src));
export const thumb = (m: StockMedia, eager = false) =>
  `<img src="${still(m)}" width="${m.width}" height="${m.height}" alt="${esc(m.motif)}" decoding="async"${eager ? '' : ' loading="lazy"'}>`;
