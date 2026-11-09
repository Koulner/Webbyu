const widths = [270, 405, 580, 820];

/** Wortmarke als WebP-Breitenleiter (erzeugt mit scripts/make-wordmark.py). `sizes` ist die CSS-Anzeigebreite am Einsatzort. */
export const wordmarkImg = (base: string, sizes: string): string =>
  `<img src="${base}webbyu-wortmarke-405.webp" srcset="${widths.map(width => `${base}webbyu-wortmarke-${width}.webp ${width}w`).join(', ')}" sizes="${sizes}" alt="" width="2172" height="724" />`;
