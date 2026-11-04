export const demoBrands = { start: 'Klarblick', business: 'Eiche & Form', complete: 'Hof & Flamme' };
const definitions = {
  start: [['', 'Fenster, die Licht hereinlassen'], ['hinweise', 'Hinweise zur Demo']],
  business: [['', 'Räume mit Persönlichkeit'], ['leistungen', 'Unser Handwerk'], ['leistungen/moebel', 'Möbel nach Maß'], ['leistungen/kuechen', 'Küchen zum Leben'], ['projekte', 'Ausgewählte Räume'], ['projekte/wohnraum', 'Ein Raum zum Ankommen'], ['projekte/kueche', 'Der Mittelpunkt des Hauses'], ['ueber-uns', 'Menschen und Material'], ['kontakt', 'Ein Vorhaben beginnt im Gespräch'], ['hinweise', 'Hinweise zur Demo']],
  complete: [['', 'Ein guter Abend bleibt'], ['kueche', 'Die Küche und ihre Jahreszeiten'], ['speisekarte', 'Was gerade auf den Tisch kommt'], ['einblicke', 'Ein Abend bei uns'], ['ueber-uns', 'Gastgeben aus Überzeugung'], ['kontakt', 'Wir halten einen Platz im Gespräch frei'], ['hinweise', 'Hinweise zur Demo']],
};
export const packageDemoPages = Object.entries(definitions).flatMap(([packageId, entries]) => entries.map(([slug, heading]) => {
  const path = `/demos/${packageId}/${slug ? slug + '/' : ''}`;
  return { id: `demo-${packageId}-${slug.replaceAll('/', '-') || 'home'}`, path, file: path.slice(1) + 'index.html', kind: 'package-demo', indexable: false, packageId, slug, heading, title: `${heading} | ${demoBrands[packageId]} · Webbyu Demo`, description: `Vollständige Beispielwebsite für Webbyu ${packageId}. ${heading}. Fiktives Unternehmen, lokal bedienbare Demo.` };
}));
