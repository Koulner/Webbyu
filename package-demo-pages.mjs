export const demoBrands = { start: 'Klarblick', business: 'Eiche & Form', complete: 'Hof & Flamme' };
const definitions = {
  start: [['', 'Jedes Haus hat dieses eine Fenster'], ['hinweise', 'Hinweise zur Demo']],
  business: [['', 'Gerade Möbel für schiefe Häuser'], ['leistungen', 'Was wir bauen'], ['leistungen/moebel', 'Einbaumöbel nach Aufmaß'], ['leistungen/kuechen', 'Küchen in alten Mauern'], ['projekte', 'Fall 14: Garderobe für einen Flur von 1908'], ['projekte/wohnraum', 'Fall 22: Bücherwand um eine Tür'], ['projekte/kueche', 'Fall 9: Küchenzeile an einer gewölbten Wand'], ['ueber-uns', 'Zum Aufmaß kommt, wer einbaut'], ['kontakt', 'Messen Sie Ihre Nische'], ['hinweise', 'Hinweise zur Demo']],
  complete: [['', 'Wir kochen, bis das Feuer aus ist'], ['kueche', 'Angezündet wird einmal am Tag'], ['speisekarte', 'Was der Herd gerade kann'], ['einblicke', 'Von halb sieben bis elf'], ['ueber-uns', 'Ein Haus, das um sein Feuer gebaut ist'], ['kontakt', 'Platz anfragen'], ['hinweise', 'Hinweise zur Demo']],
};
export const packageDemoPages = Object.entries(definitions).flatMap(([packageId, entries]) => entries.map(([slug, heading]) => {
  const path = `/demos/${packageId}/${slug ? slug + '/' : ''}`;
  return { id: `demo-${packageId}-${slug.replaceAll('/', '-') || 'home'}`, path, file: path.slice(1) + 'index.html', kind: 'package-demo', indexable: false, packageId, slug, heading, title: `${heading} | ${demoBrands[packageId]} · Webbyu Demo`, description: `Vollständige Beispielwebsite für Webbyu ${packageId}. ${heading}. Fiktives Unternehmen, lokal bedienbare Demo.` };
}));
