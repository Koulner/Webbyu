export type Goal = 'presence' | 'inquiries' | 'bookings' | 'sales';
export type DemoGoal = Exclude<Goal, 'presence'>;
export type PackageId = 'presence' | 'business' | 'shop';

export const goals: { id: Goal; label: string; description: string }[] = [
  { id: 'presence', label: 'Sichtbar werden', description: 'Ein Auftritt, der zeigt, wer Sie sind.' },
  { id: 'inquiries', label: 'Anfragen gewinnen', description: 'Aus Interesse ein Gespräch machen.' },
  { id: 'bookings', label: 'Buchungen ermöglichen', description: 'Den Weg zum Termin einfacher machen.' },
  { id: 'sales', label: 'Produkte verkaufen', description: 'Ihre Produkte verdienen eine eigene Bühne.' },
];

export const packages: { id: PackageId; number: string; name: string; description: string; features: string[]; goal: Goal }[] = [
  { id: 'presence', number: '01', name: 'Präsenz', description: 'Ein klarer erster Eindruck. Und ein Auftritt, der ganz nach Ihnen aussieht.', features: ['Individuelles Webdesign', 'Unternehmen & Leistungen', 'Kontakt & Besucherführung'], goal: 'presence' },
  { id: 'business', number: '02', name: 'Anfragen & Buchungen', description: 'Eine Website, die mitarbeitet. Vom ersten Interesse bis zum nächsten Termin.', features: ['Alles aus Präsenz', 'Gezielte Anfragewege', 'Passende Buchungsintegration'], goal: 'inquiries' },
  { id: 'shop', number: '03', name: 'Shop & Produkte', description: 'Für Produkte mit Charakter. Und ein Einkaufserlebnis, das dazu passt.', features: ['Individuelle Produktinszenierung', 'Shopify-Auftritt', 'Sortiment & Kaufablauf'], goal: 'sales' },
];

export const extensions = [
  { id: 'cms', name: 'Inhalte selbst pflegen', short: 'CMS', description: 'Texte, Bilder und neue Inhalte bearbeiten, ohne jedes Mal die Entwicklung zu brauchen.' },
  { id: 'booking', name: 'Termine einfacher buchen', short: 'Buchung', description: 'Leistungen und verfügbare Zeiten in einen passenden Buchungsablauf einbinden.' },
  { id: 'seo', name: 'Besser gefunden werden', short: 'SEO', description: 'Suchintention, Seitenstruktur und Inhalte gezielt auf Ihr Angebot abstimmen.' },
  { id: 'maps', name: 'Den Weg zu Ihnen zeigen', short: 'Maps', description: 'Standort, Anfahrt und Ihre lokale Präsenz verständlich zusammenbringen.' },
  { id: 'wizard', name: 'Zur richtigen Wahl führen', short: 'Projektfinder', description: 'Mit wenigen Fragen zum passenden Produkt, Paket oder Angebot führen.' },
  { id: '3d', name: 'Etwas Besonderes erleben', short: 'Interaktives 3D', description: 'Produkte und Geschichten mit räumlicher Gestaltung und gezielter Bewegung erlebbar machen.' },
];

export const concepts: { goal: DemoGoal; number: string; name: string; type: string; title: string; description: string; tags: string[] }[] = [
  { goal: 'inquiries', number: '01', name: 'Klarraum', type: 'Beratung & Strategie', title: 'Klarheit, die Vertrauen schafft.', description: 'Ruhige Typografie und eine klare Haltung geben einer Beratung Profil. Ein direkter Anfrageweg macht den nächsten Schritt leicht.', tags: ['Markenauftritt', 'Anfragen', 'CMS'] },
  { goal: 'bookings', number: '02', name: 'Studio Still', type: 'Bewegung & Balance', title: 'Ankommen. Schon vor dem Termin.', description: 'Eine warme Bildsprache und viel Raum übersetzen die Atmosphäre eines Studios ins Digitale. Die Terminwahl bleibt direkt erreichbar.', tags: ['Webdesign', 'Buchung', 'Lokale Präsenz'] },
  { goal: 'sales', number: '03', name: 'Safran Atelier', type: 'Genuss & Botanik', title: 'Von der Blüte zum Genuss.', description: 'Eine anonymisierte Designstudie mit botanischen Nahaufnahmen, einer interaktiven Produktgeschichte und einem vollständig lokalen Einkaufsweg.', tags: ['Anonymisierte Demo', 'Produkte', 'Interaktion'] },
];
