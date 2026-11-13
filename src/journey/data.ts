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
    description: 'Für mich beginnt eine Website bei den Leuten, die sie benutzen. Was wollen Ihre Kunden wissen? Was brauchen sie, um sich zu entscheiden? Und welche Arbeit kommt danach auf Sie zu?',
    detail: 'Aus den Antworten ergibt sich, was auf die Seite gehört, wie sie aussieht und was sie können muss.',
    position: [-18.8, 3.8], landmark: 'clearing',
    visual: { color: '#c8dba8', caption: 'Erst die Aufgabe, dann alles andere.' },
    note: 'Über Technik reden wir, wenn klar ist, wofür.',
  },
  {
    id: 'das-fundament', label: 'Das Fundament', eyebrow: 'Der Aufbau',
    title: 'Planen, gestalten, programmieren.',
    description: 'Webbyu bin nur ich. Ich plane, gestalte und programmiere, und Sie haben vom ersten Gespräch bis zur Übergabe denselben Ansprechpartner.',
    detail: 'Texte und Bilder erklären, was Sie anbieten. Die Gestaltung zeigt, wo es langgeht. Und die Funktionen erledigen den nächsten Schritt. Wenn eins davon fehlt, merkt man es sofort.',
    position: [-13.2, -3.1], landmark: 'atelier',
    visual: { color: '#a8c8bd', caption: 'Text, Bild und Technik an einem Tisch.' },
  },
  {
    id: 'klarblick', label: 'Klarblick', eyebrow: 'Paketbeispiel / Webbyu Start',
    title: 'Eine klare Seite für den ersten Kontakt.',
    description: 'Ein kompakter Auftritt für eine fiktive Fensterreinigung.',
    detail: 'Leistungen, Einsatzgebiet und Kontakt auf einer Seite.',
    position: [-8, 3.2], landmark: 'room', packageId: 'start', image: 'klarblick-concept.webp',
    visual: { color: '#c9d4bd', caption: 'Ein Angebot auf einen Blick.' },
    story: { task: 'Eine Fensterreinigung will auf einen Blick zeigen, was sie macht und wo sie hinfährt.', approach: 'Eine einzige Seite mit Leistungen, Ablauf, Einsatzgebiet und Kontakt.', benefit: 'Wer sucht, findet das Wichtigste und kann gleich anfragen.' },
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
    title: 'Die Karte folgt dem Feuer.',
    description: 'Ein mehrseitiger Auftritt für ein fiktives Restaurant.',
    detail: 'Speisekarte, Einblicke und Film erzählen von Küche und Atmosphäre.',
    position: [3, 3.6], landmark: 'garden', packageId: 'complete', image: 'hof-concept.webp',
    visual: { color: '#c8b6a2', caption: 'Die Gänge folgen dem abkühlenden Herd.' },
    story: { task: 'Gäste sollen schon vor dem Besuch wissen, worauf sie sich freuen können.', approach: 'Küche und Speisekarte bekommen eigene Seiten mit Fotos, Film und allem, was man vorher wissen will.', benefit: 'Wer Lust bekommen hat, findet direkt den Weg zur Reservierungsanfrage.' },
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
    visual: { color: '#bacab4', caption: 'Vom großen Sortiment zur eigenen Merkliste.' },
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
    title: 'Und was steht bei Ihnen an?',
    description: 'Jedes Projekt fängt bei etwas Konkretem an. Bei Ihnen ist es vielleicht ein Angebot, das keiner auf Anhieb versteht, oder ein Ablauf mit zu vielen Rückfragen.',
    detail: 'Erzählen Sie mir davon. Im Projektfinder können Sie Ihre Wünsche sammeln, dann haben wir für das erste Gespräch schon etwas in der Hand.',
    position: [19, 3], landmark: 'future',
    visual: { color: '#d5e7b3', caption: 'Die nächste Station fehlt noch.' },
    note: 'Eine fertige Lösung brauchen Sie nicht. Eine Idee reicht.',
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
