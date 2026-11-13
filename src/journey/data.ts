import { concepts, type DemoId, type PackageId } from '../data';

export interface JourneyStation {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  position: readonly [number, number];
  landmark: 'clearing' | 'atelier' | 'room' | 'technical' | 'garden' | 'furniture' | 'future';
  visual: { color: string; caption: string };
  story?: { task: string; approach: string; benefit: string };
  demoId?: DemoId;
  packageId?: PackageId;
  image?: string;
  note?: string;
  /** Eigene Seiten außerhalb der Paket- und Konzeptdemos: [Linktext, Pfad unter der Website-Basis]. */
  pages?: readonly (readonly [string, string])[];
  /** Hinweis unter den Seitenlinks; ohne Angabe der Eigenprojekt-Hinweis. */
  pagesNote?: string;
}

function project(demoId: DemoId, extra: Pick<JourneyStation, 'id' | 'position' | 'landmark' | 'detail' | 'note' | 'visual' | 'story'>): JourneyStation {
  const concept = concepts.find(item => item.goal === demoId)!;
  return { ...extra, label: concept.name, eyebrow: `Konzeptstudie / ${concept.type}`, title: concept.title, description: concept.description, demoId };
}

/** Editorial order, not a claim about dates or the order in which projects were built. */
export const stations: readonly JourneyStation[] = [
  {
    id: 'die-idee', label: 'Die Idee', eyebrow: 'Der Ausgangspunkt',
    title: 'Was soll leichter werden?',
    description: 'Eine Website beginnt für mich bei den Menschen, die sie benutzen. Was möchten Ihre Kunden wissen? Was brauchen sie für eine Entscheidung? Und welche Arbeit entsteht danach für Sie?',
    detail: 'Diese Fragen geben die Richtung vor. Daraus entstehen Inhalte, Gestaltung und Funktionen, die zu Ihrem Unternehmen passen.',
    position: [-18.8, 3.8], landmark: 'clearing',
    visual: { color: '#c8dba8', caption: 'Eine klare Aufgabe gibt die Richtung vor.' },
    note: 'Ich beginne mit Ihrer Aufgabe. Die passende Technik folgt daraus.',
  },
  {
    id: 'das-fundament', label: 'Das Fundament', eyebrow: 'Der Aufbau',
    title: 'Ein Gedanke wird ein Ganzes.',
    description: 'Hinter Webbyu stehe ich als einzelner Gründer. Ich verbinde Planung, Gestaltung und Entwicklung: mit einem direkten Ansprechpartner vom ersten Gespräch bis zur Übergabe.',
    detail: 'Texte und Bilder erklären das Angebot. Gestaltung gibt Orientierung. Funktionen helfen beim nächsten Schritt. Dieses Zusammenspiel ist das Fundament meiner Arbeit.',
    position: [-13.2, -3.1], landmark: 'atelier',
    visual: { color: '#a8c8bd', caption: 'Inhalt, Gestaltung und Funktion greifen ineinander.' },
  },
  {
    id: 'klarblick', label: 'Klarblick', eyebrow: 'Paketbeispiel / Webbyu Start',
    title: 'Eine klare Seite für den ersten Kontakt.',
    description: 'Ein kompakter Auftritt für eine fiktive Fensterreinigung.',
    detail: 'Leistungen, Einsatzgebiet und Kontakt auf einer Seite.',
    position: [-8, 3.2], landmark: 'room', packageId: 'start', image: 'klarblick-concept.webp',
    visual: { color: '#c9d4bd', caption: 'Ein Angebot auf einen Blick.' },
    story: { task: 'Ein Dienstleistungsbetrieb möchte schnell zeigen, was er anbietet und wo er arbeitet.', approach: 'Ein Onepager bündelt Leistungen, Ablauf, Einsatzgebiet und Kontakt.', benefit: 'Besucher finden die wichtigsten Informationen und einen einfachen Weg zur Anfrage.' },
  },
  {
    id: 'eiche-und-form', label: 'Eiche & Form', eyebrow: 'Paketbeispiel / Webbyu Business',
    title: 'Gerade Möbel für schiefe Häuser.',
    description: 'Ein mehrseitiger Auftritt für eine fiktive Tischlerei in Altbauten.',
    detail: 'Drei Fälle mit Werkzeichnung zeigen, wie die Tischlerei schiefe Wände ausgleicht.',
    position: [-2.5, -3.6], landmark: 'furniture', packageId: 'business', image: 'eiche-fall14-breit.webp',
    visual: { color: '#d9d8d2', caption: 'Aufmaß, Zeichnung und Einbau aus denselben Maßen.' },
    story: { task: 'Eine Tischlerei möchte zeigen, dass sie Möbel für Räume baut, in denen kein Winkel stimmt.', approach: 'Ein durchgehender Fall, Werkzeichnungen und ein Formular, das die eigene Nische zeichnet.', benefit: 'Interessierte sehen, ob ihr Raum in Frage kommt, und schicken gleich vier Maße mit.' },
  },
  {
    id: 'hof-und-flamme', label: 'Hof & Flamme', eyebrow: 'Paketbeispiel / Webbyu Complete',
    title: 'Ein Abend bekommt eine eigene Welt.',
    description: 'Ein mehrseitiger Auftritt für ein fiktives Restaurant.',
    detail: 'Speisekarte, Einblicke und Film erzählen von Küche und Atmosphäre.',
    position: [3, 3.6], landmark: 'garden', packageId: 'complete', image: 'hof-concept.webp',
    visual: { color: '#c8b6a2', caption: 'Küche und Atmosphäre zusammen erzählt.' },
    story: { task: 'Ein Restaurant möchte schon vor dem Besuch einen Eindruck seines Angebots vermitteln.', approach: 'Seiten für Küche und Speisekarte verbinden Fotografie, Film und Informationen.', benefit: 'Gäste entdecken das Restaurant und finden den Weg zum Kontakt.' },
  },
  {
    id: 'safran-atelier', label: 'Safran Atelier', eyebrow: 'Konzeptstudie / Genuss & Botanik',
    title: 'Ein Safranshop, der sagt, wofür ein Glas reicht.',
    description: 'Ein mehrseitiger Shop für eine fiktive Safranmarke.',
    detail: 'Gerenderte Nahaufnahmen von Blüte und Narbe, Produktseiten mit Mengenangaben, Catering, Handel und ein Anfrageweg.',
    position: [8, -3.1], landmark: 'garden',
    visual: { color: '#beb1cb', caption: 'Von der Blüte zum Faden, vom Faden zum Glas.' },
    story: { task: 'Ein kleiner Händler verkauft ein teures Gewürz, das die meisten nur selten kaufen.', approach: 'Renderings von Blüte und Narbe, Produktseiten mit Fadenzahl, Seiten für Catering und Handel und ein Anfrageweg.', benefit: 'Besucher verstehen, was sie kaufen und wofür ein Glas reicht, und finden den passenden Weg zur Anfrage.' },
    pages: [['Demoseite ansehen', 'demos/safran-atelier/']],
    pagesNote: 'Safran Atelier · fiktive Marke · Blüte und Fäden als 3D-Renderings, keine Fotos',
  },
  project('raumgut', {
    id: 'raumgut', position: [13.5, 3.2], landmark: 'furniture',
    visual: { color: '#bacab4', caption: 'Ein Sortiment wird zu einer persönlichen Auswahl.' },
    detail: 'Suche, Filter, Varianten und Merkliste führen durch ein Sortiment.',
    story: { task: 'Viele Möbel, Materialien und Maße sollen übersichtlich bleiben.', approach: 'Suche, Filter und Varianten führen vom Sortiment zur eigenen Merkliste.', benefit: 'Die Auswahl lässt sich bis zur vollständigen lokalen Bestellvorschau erproben.' },
  }),
  {
    id: 'koulner', label: 'Koulner', eyebrow: 'Eigenprojekt / Foto & Video',
    title: 'Ein Portfolio in drei Stufen.',
    description: 'Ein Foto- und Videoportfolio für die Marke Koulner, umgesetzt als Eigenprojekt in drei Ausbaustufen.',
    detail: 'Dieselben Inhalte als Mappe, als Leuchttisch mit Lupe und als Fahrt im Licht der Bilder.',
    position: [16.5, -3.2], landmark: 'atelier',
    visual: { color: '#d8c3b4', caption: 'Kontaktbögen, Fettstift und eine Anfrage, die die Auswahl mitnimmt.' },
    story: { task: 'Ein Portfolio soll Bilder zeigen und schnell zu einer Shooting-Anfrage führen.', approach: 'Nummerierte Kontaktbögen, ein Fettstift für Kreis und Kreuz und eine Anfrage, die die markierten Bilder mitnimmt.', benefit: 'Interessierte zeigen vor dem ersten Gespräch, welche Bilder ihnen gefallen und welche nicht.' },
    pages: [['Stufe 1 · Mappe', 'demos/koulner/stufe-1/'], ['Stufe 2 · Leuchttisch', 'demos/koulner/stufe-2/'], ['Stufe 3 · Im Licht der Bilder', 'demos/koulner/stufe-3/']],
  },
  {
    id: 'der-naechste-abschnitt', label: 'Der nächste Abschnitt', eyebrow: 'Der Weg bleibt offen',
    title: 'Was möchten Sie möglich machen?',
    description: 'Aus jeder Aufgabe entsteht eine eigene Lösung. Vielleicht soll Ihr Angebot verständlicher werden. Vielleicht soll eine Auswahl leichter fallen. Oder ein Ablauf braucht heute noch zu viele Rückfragen.',
    detail: 'Erzählen Sie mir von Ihrem Vorhaben. Im Projektfinder können Sie Ihre Wünsche sammeln und eine Gesprächsgrundlage zusammenstellen.',
    position: [19, 3], landmark: 'future',
    visual: { color: '#d5e7b3', caption: 'Der nächste Zusammenhang beginnt mit Ihrer Aufgabe.' },
    note: 'Sie müssen noch keine fertige Lösung mitbringen. Ihre Idee genügt als Anfang.',
  },
];

/** Editorial relationships, shared by the 3D scene and vector overview. */
export const networkConnections: readonly { from: number; to: number; strand: 'content' | 'design' | 'function' }[] = [
  { from: 0, to: 1, strand: 'content' },
  { from: 1, to: 2, strand: 'design' },
  { from: 2, to: 3, strand: 'function' },
  { from: 3, to: 4, strand: 'content' },
  { from: 4, to: 5, strand: 'design' },
  { from: 5, to: 6, strand: 'function' },
  { from: 6, to: 7, strand: 'content' },
  { from: 7, to: 8, strand: 'design' },
  { from: 1, to: 4, strand: 'content' },
  { from: 2, to: 5, strand: 'design' },
  { from: 3, to: 5, strand: 'function' },
];

export function stationIndex(hash: string): number {
  return stations.findIndex(station => `#${station.id}` === hash);
}

export function terrainHeight(x: number, z: number): number {
  let height = .22 + .66 * Math.exp(-((x + 1) ** 2 / 75 + (z + 1) ** 2 / 16))
    + .75 * Math.exp(-((x - 8) ** 2 / 18 + (z + 3.5) ** 2 / 7))
    + .34 * Math.sin(x * .46 + z * .3) * Math.cos(z * .43);
  for (const station of stations) {
    const distance = (x - station.position[0]) ** 2 + (z - station.position[1]) ** 2;
    height = height * (1 - .65 * Math.exp(-distance / 2.2)) + .23 * .65 * Math.exp(-distance / 2.2);
  }
  return height;
}

export function boundary(angle: number, radius = 1): readonly [number, number] {
  const edge = 1 + .045 * Math.sin(angle * 5) + .025 * Math.cos(angle * 7);
  return [Math.cos(angle) * 26 * radius * edge, Math.sin(angle) * 11 * radius * edge];
}
