import type { PackageId } from '../data';
import { aiBadge, isAiMedia } from '../ai-media';
import { hofPlakat } from './hof/feuer';
export const packageDemos: { id: PackageId; brand: string; category: string; description: string }[] = [
  { id: 'start', brand: 'Klarblick', category: 'Fensterreinigung', description: 'Eine Fensterreinigung in Stormarn. Der Onepager geht ein Haus vom Giebel bis zur Tür durch; das Formular zeichnet die eigenen Fenster.' },
  { id: 'business', brand: 'Eiche & Form', category: 'Tischlerei', description: 'Eine Tischlerei für Altbauten: drei Fälle mit Werkzeichnung und Holzliste, dazu ein Formular, das die eigene Nische zeichnet.' },
  { id: 'complete', brand: 'Hof & Flamme', category: 'Restaurant', description: 'Ein Restaurant mit einem Herd und einem Tisch für 22: Die Karte folgt dem Feuer, das im Lauf des Abends kälter wird. Mit Bildern, Film und Platzanfrage.' },
];
export function packageFromSearch(search: string): PackageId | null {
  const value = new URLSearchParams(search).get('paket');
  return value === 'start' || value === 'business' || value === 'complete' ? value : null;
}
export function packageDemoCards(base: string): string {
  const images = ['klarblick-giebel.svg', 'eiche-fall14-breit.webp', ''];
  const headlines = ['Jedes Haus hat<br>dieses eine<br>Fenster.', 'Gerade Möbel für<br>schiefe Häuser.', 'Wir kochen,<br>bis das Feuer<br>aus ist.'];
  return `<div class="package-demo-cards">${packageDemos.map((demo, i) => `<article class="package-demo-card"><a class="package-demo-preview package-preview-${demo.id}" href="${base}demos/${demo.id}/" aria-label="${demo.brand}: vollständige Website ansehen">${demo.id === 'complete' ? hofPlakat() : `<img src="${base}package-demos/${images[i]}" alt="" width="1600" height="1000" loading="lazy">${isAiMedia(`package-demos/${images[i]}`) ? aiBadge() : ''}`}<span class="package-preview-brand">${demo.brand}</span>${demo.id === 'complete' ? '<span class="package-preview-moments">18:30 FLAMME / 19:45 GLUT / 21:00 ASCHE / 22:15 RESTWÄRME</span>' : ''}<span class="package-preview-headline">${headlines[i]}</span><span class="package-preview-action">WEBSITE ANSEHEN ↗</span></a><p class="package-demo-label">0${i + 1} / WEBBYU ${demo.id.toUpperCase()} · ${demo.category}</p><h3>${demo.brand}</h3><p>${demo.description}</p><a class="text-link" href="${base}demos/${demo.id}/">Website ansehen ↗</a></article>`).join('')}</div>`;
}
