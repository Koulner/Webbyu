export type Goal = 'presence' | 'inquiries' | 'bookings' | 'sales';
export type DemoGoal = Exclude<Goal, 'presence'>;
export type PackageId = 'start' | 'business' | 'complete';
export type PackageChoice = PackageId | 'custom';

export const priceDraftNotice = 'Interner Preisentwurf · Steuerbasis noch offen · kein verbindliches Angebot';
export const scopeNotice = 'Shops, komplexe Buchungen und individuelle Integrationen benötigen einen gesonderten Umfang und ein eigenes Angebot.';

export const goals: { id: Goal; label: string; description: string }[] = [
  { id: 'presence', label: 'Sichtbar werden', description: 'Ein Auftritt, der zeigt, wer Sie sind.' },
  { id: 'inquiries', label: 'Anfragen gewinnen', description: 'Aus Interesse ein Gespräch machen.' },
  { id: 'bookings', label: 'Buchungen ermöglichen', description: 'Den Weg zum Termin einfacher machen.' },
  { id: 'sales', label: 'Produkte verkaufen', description: 'Ihre Produkte verdienen eine eigene Bühne.' },
];

export const packages: { id: PackageId; number: string; name: string; price: string; description: string; features: string[]; details: string[] }[] = [
  { id: 'start', number: '01', name: 'Webbyu Start', price: '599 €', description: 'Ein kompakter Auftritt. Individuell gestaltet, mit den Texten und Bildern, die Sie mitbringen.', features: ['Bis zu drei Unterseiten', 'Ihre Texte und Bilder integriert', 'Kontaktmöglichkeit & klare Besucherführung'], details: ['Drei Termine: Planung, Entwurfsbesprechung und Übergabe.', 'Eine gebündelte Änderungsrunde innerhalb der vereinbarten Gestaltungsrichtung.', 'Planungsentwurf: regulär 14 Kalendertage, sobald Umfang, Inhalte und Freigaben vorliegen. Der konkrete Termin wird vereinbart.'] },
  { id: 'business', number: '02', name: 'Webbyu Business', price: '1.099 €', description: 'Mehr Raum für Ihr Unternehmen. Mit einer durchdachten Inhaltsstruktur und eigenen Aufnahmen.', features: ['Sechs Unterseiten', 'Vor-Ort-Fotografie & 15 bearbeitete Fotos', 'Kontakt- und Anfragewege im vereinbarten Umfang'], details: ['Persönliche Beratung und individuelle Gestaltung.', 'Zwei gebündelte Korrekturrunden.', 'Planungsentwurf: regulär 21 Kalendertage bei rechtzeitiger Zuarbeit. Produktionsumfang und Nutzungsrechte stimmen wir vorher ab.'] },
  { id: 'complete', number: '03', name: 'Webbyu Complete', price: '2.499 €', description: 'Website und Inhalte aus einem Guss. Mit eigener Foto-, Video- und Textproduktion.', features: ['30 professionell bearbeitete Fotos', 'Zwei Kurzvideos mit jeweils bis zu 30 Sekunden', 'Konzeption & professionelle Texterstellung'], details: ['Seitenzahl, Produktionsumfang, Korrekturrunden und Liefertermin werden individuell geklärt.', 'Drohnen- und 360°-Aufnahmen nach Abstimmung und nur, soweit rechtlich und praktisch durchführbar.', 'Nutzungsrechte, Ausspielung und technische Einbindung werden vor Beauftragung festgelegt. Ein Shop ist keine Inklusivleistung.'] },
];

export const services = [
  { name: 'Websites', description: 'Eine klare Struktur, eigenständige Gestaltung und Technik, die zu Ihrem Unternehmen passt. Vom kompakten Einstieg bis zum umfangreicheren Auftritt.' },
  { name: 'Foto & Video', description: 'Menschen, Räume und Produkte aus Ihrem Unternehmen. Wir planen Motive, Produktion und Nutzungsrechte passend zum vereinbarten Paket.' },
  { name: 'Marke & digitale Inhalte', description: 'Farben, Typografie und Inhalte für Ihre Kanäle. Branding, Social-Media-Content und weiterführende SEO vereinbaren wir passend zum Bedarf.' },
];

export const packageQuestions = [
  { question: 'Wie werden die Seiten gezählt?', answer: 'Start sieht bis zu drei, Business sechs Unterseiten vor. Ob Startseite und Rechtstextseiten zusätzlich zählen, ist noch offen und wird vor Angebotsfreigabe festgelegt. Für Complete sind Seitenzahl und Liefertermin individuell zu vereinbaren. Zusätzliche Standardseiten sind möglich; ein Einzelpreis ist noch nicht bestätigt.' },
  { question: 'Was bringen Sie mit, was übernehmen wir?', answer: 'Für Start liefern Sie Texte, Bilder und Kontaktdaten. Business ergänzt eigene Fotografien; Complete enthält zusätzlich Text- und Videoproduktion im vereinbarten Umfang. Material, Freigaben, Nutzungsrechte und freigegebene Rechtstexte stimmen wir vor Projektbeginn ab.' },
  { question: 'Was passiert nach der Übergabe?', answer: 'Sie erhalten die vereinbarten Dateien und Zugänge. Domain und Hosting laufen auf Ihren Namen. Ein monatlicher Betreuungsvertrag mit Webbyu ist nicht verpflichtend. Hostingkosten und mögliche Fremdlizenzen klären wir vorher; spätere Änderungen können Sie separat beauftragen.' },
  { question: 'Sind Shops und Buchungssysteme enthalten?', answer: scopeNotice + ' Die interaktiven Konzeptdemos zeigen Möglichkeiten und sind keine Zusage einer enthaltenen Paketleistung.' },
  { question: 'Welche Ergänzungen sind vorgesehen?', answer: 'Für Business ist ein Video-Zusatzpaket mit drei Kurzvideos von jeweils bis zu 30 Sekunden vorgesehen: 349 € als interner Preisentwurf. Für Start ist eine ausdrücklich neu beauftragte Gestaltungsrichtung mit 199 € angesetzt. Vereinbarte Korrekturen bleiben davon getrennt. Steuerbasis, Aufnahmezeit, Korrekturgrenzen und genaue Bedingungen sind noch zu bestätigen.' },
];

export const extensions = [
  { id: 'photos', name: 'Eigene Fotos produzieren', short: 'Fotografie', description: 'Im Paketentwurf: 15 bearbeitete Fotos bei Business, 30 bei Complete. Motive, Aufnahmeumfang und Nutzungsrechte stimmen wir vorher ab.' },
  { id: 'videos', name: 'Foto, Video & Text verbinden', short: 'Content', description: 'Complete sieht zwei Kurzvideos bis je 30 Sekunden und Texterstellung vor. Produktion, Formate und Nutzungsrechte werden individuell vereinbart.' },
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
