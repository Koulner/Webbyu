/**
 * Single source for AI-generated media shown on the site.
 * Every image listed here must carry a visible label where it is shown
 * (see `aiBadge`) and is declared centrally in the Impressum.
 */
export const AI_LABEL = 'KI-generiert';

/** Path fragments of AI-generated files below `public/` or `src/assets/`. */
export const aiMediaPatterns: readonly RegExp[] = [
  /package-demos\/(?:klarblick-(?:concept|800)|eiche-concept|hof-(?:concept|800))\.webp/,
  /reference-assets\/raumgut\//,
  /reference-assets\/(?:materials|room-diptych)/,
  /assets\/demos\/saffron\//,
  /webbyu-(?:wortmarke-entwurf|w-icon-entwurf|symbol-db-\d+)\.png/,
];

export const isAiMedia = (src: string): boolean => aiMediaPatterns.some(pattern => pattern.test(src));

/** Visible, screen-reader readable label placed next to an AI image inside a positioned container. */
export const aiBadge = (label = AI_LABEL): string => `<small class="ai-badge">${label}</small>`;
