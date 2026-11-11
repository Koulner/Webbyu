// Gemeinsame Inhalte aller Richtungsstudien. Stand: Entwurf vom 10.11.2026.
// Texte und Preise sind Vorschläge aus dem Konzeptgespräch, keine von Koulner freigegebenen Angaben.

import type { AreaId } from './media';

export const brand = {
  name: 'Koulner',
  claim: 'Fotografie & Video für Menschen, Momente und Ideen.',
  intro: 'Von persönlichen Porträts über kreative Shootings bis zu Events und Bildern für dein Unternehmen.',
  // offen: Stadt und Umkreis sind noch nicht festgelegt. Nicht durch eine erfundene Region ersetzen.
  region: 'Einzugsgebiet folgt',
  primaryAction: 'Shooting anfragen',
  secondaryAction: 'Arbeiten ansehen',
};

export interface Area {
  id: AreaId;
  title: string;
  short: string;
  offers: string[];
}

export const areas: Area[] = [
  {
    id: 'menschen',
    title: 'Menschen & Porträts',
    short: 'Bilder, in denen du dich wiedererkennst.',
    offers: ['Porträts', 'Bewerbungsfotos', 'Paare', 'Familien', 'Haustiere'],
  },
  {
    id: 'momente',
    title: 'Events & Momente',
    short: 'Was passiert, solange niemand posiert.',
    offers: ['Feiern', 'Veranstaltungen', 'Konzerte', 'Eventbegleitung'],
  },
  {
    id: 'business',
    title: 'Business & Produkte',
    short: 'Bilder, die dein Unternehmen zeigen, wie es ist.',
    offers: ['Businessporträts', 'Teamfotos', 'Produkte', 'Räume', 'Inhalte für Websites'],
  },
  {
    id: 'kreativ',
    title: 'Kreative Projekte',
    short: 'Für Ideen, die eine eigene Bühne brauchen.',
    offers: ['Kostüme', 'Cosplay', 'Inszenierte Porträts', 'Individuelle Ideen'],
  },
];

export const video = {
  title: 'Video',
  short: 'Kurze Clips, Eventbegleitung und Einblicke in Unternehmen. Auch als Ergänzung zu einem Fotoshooting.',
};

export interface Package {
  title: string;
  scope: string;
  price: string;
  area: AreaId | 'video';
}

// Beispielpreise zum Testen, keine recherchierten Marktpreise. Überall sichtbar als Entwurf kennzeichnen.
export const PRICE_NOTICE = 'Beispielpreise (Entwurf), noch nicht freigegeben';

export const packages: Package[] = [
  { title: 'Bewerbung / Kurzporträt', scope: 'ca. 20–30 Minuten, 2 bearbeitete Bilder', price: 'ab 79 €', area: 'menschen' },
  { title: 'Porträt / Kreativ', scope: 'ca. 60 Minuten, 5 bearbeitete Bilder', price: 'ab 149 €', area: 'kreativ' },
  { title: 'Paare / Familie / Haustiere', scope: 'ca. 60 Minuten, 8 bearbeitete Bilder', price: 'ab 179 €', area: 'menschen' },
  { title: 'Businessporträts', scope: 'Umfang und Nutzungsrechte nach Bedarf', price: 'ab 199 €', area: 'business' },
  { title: 'Eventbegleitung', scope: 'abhängig von Dauer, Ort und Bildumfang', price: 'individuelles Angebot', area: 'momente' },
  { title: 'Produktfotos / Video', scope: 'abhängig von Aufwand und Nutzung', price: 'individuelles Angebot', area: 'video' },
];

// Anfrage: Prototyp ohne Versand. Daten bleiben im Browser.
export const inquiry = {
  fields: [
    { name: 'anlass', label: 'Anlass', required: true },
    { name: 'termin', label: 'Wunschtermin oder Zeitraum', required: false },
    { name: 'ort', label: 'Ort', required: false },
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'E-Mail', required: true },
    { name: 'nachricht', label: 'Was hast du vor?', required: false },
  ],
  prototypeNotice: 'Prototyp: Diese Anfrage wird nicht gesendet.',
};
