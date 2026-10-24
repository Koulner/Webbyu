import { concepts, type DemoId } from '../data';

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
  note?: string;
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
  project('meisterwerk', {
    id: 'meisterwerk', position: [-7.2, 3.2], landmark: 'room',
    visual: { color: '#c9c7ab', caption: 'Aus einer Vorstellung wird eine Gesprächsgrundlage.' },
    detail: 'Raumideen, Materialien und ein Bildvergleich machen Wünsche greifbar.',
    story: { task: 'Ein Raum soll sich verändern. Die Vorstellung ist noch nicht konkret.', approach: 'Raumbeispiele, Materialauswahl und Bildvergleich machen Möglichkeiten sichtbar.', benefit: 'Aus einzelnen Wünschen entsteht ein nachvollziehbares Projektbriefing.' },
  }),
  project('nordlicht', {
    id: 'nordlicht', position: [0, -3.6], landmark: 'technical',
    visual: { color: '#9ec9ca', caption: 'Die passende Frage führt zum nächsten Schritt.' },
    detail: 'Beratung, Wartung oder Störung: Die Antworten bestimmen, welche Frage als Nächstes sinnvoll ist.',
    story: { task: 'Ein technisches Anliegen braucht zuerst eine verständliche Einordnung.', approach: 'Ein Bedarfscheck unterscheidet Beratung, Wartung und Störung mit passenden Folgefragen.', benefit: 'Der Kontakt beginnt mit den Angaben, die für das Anliegen relevant sind.' },
    note: 'Ich plane die Funktion zusammen mit dem Auftritt. Beides soll dieselbe Aufgabe lösen.',
  }),
  project('sales', {
    id: 'safran-atelier', position: [6.4, 3.6], landmark: 'garden',
    visual: { color: '#beb1cb', caption: 'Ein Produktdetail wird zur verständlichen Geschichte.' },
    detail: 'Von der Blüte zum Safranfaden: Die Kamerafahrt macht ein kleines Produktdetail zum Ausgangspunkt einer ganzen Geschichte.',
    story: { task: 'Ein besonderes Produkt braucht mehr als ein Produktfoto.', approach: 'Botanische Nahaufnahmen führen von der Blüte zum Faden und weiter zur Produktauswahl.', benefit: 'Entdeckung, Produktinformation und Einkauf bilden einen zusammenhängenden Weg.' },
  }),
  project('raumgut', {
    id: 'raumgut', position: [13, -2.4], landmark: 'furniture',
    visual: { color: '#bacab4', caption: 'Ein Sortiment wird zu einer persönlichen Auswahl.' },
    detail: 'Suche, Filter, Varianten und Merkliste führen durch ein Sortiment.',
    story: { task: 'Viele Möbel, Materialien und Maße sollen übersichtlich bleiben.', approach: 'Suche, Filter und Varianten führen vom Sortiment zur eigenen Merkliste.', benefit: 'Die Auswahl lässt sich bis zur vollständigen lokalen Bestellvorschau erproben.' },
  }),
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
