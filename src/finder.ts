import { businessNotice, extensions, goals, packages, scopeNotice, type Goal, type PackageChoice } from './data';
import type { BriefState, BriefStore, ImageSource, ImageState, MediaChoice, MediaSites, ProjectType, Scope, TextState, VideoState, Zone } from './state';
import type { InquiryField, InquiryRequest, InquiryResponse } from './inquiry-contract';
import { createInquiryId, INQUIRY_CONTACT, inquiryFingerprint, inquiryFits, InquiryUncertain, invalidInquiryFields, postInquiry } from './inquiry-client';
import { BLOCK_TITLES, euro, INDIVIDUAL_LABEL, lineAmount, orientation, ORIENTATION_NOTICE, packageName, requestBrief, routeOf, sumText, TAX_NOTICE, type Line, type Orientation, type Route } from './finder-pricing';
import { CATALOG_VERSION, catalogLineMap } from './pricing-catalog';
import './finder.css';

type Kind = 'purpose' | 'goal' | 'scope' | 'content' | 'media' | 'place' | 'result' | 'contact';
const flows: Record<Route, Kind[]> = {
  website: ['purpose', 'goal', 'scope', 'content', 'result'],
  media: ['purpose', 'media', 'place', 'result'],
  advice: ['purpose', 'contact'],
};
const stepNames: Record<Route, string[]> = {
  website: ['Vorhaben', 'Ziel', 'Umfang', 'Inhalte', 'Orientierung'],
  media: ['Vorhaben', 'Medien', 'Ort', 'Orientierung'],
  advice: ['Vorhaben', 'Kontakt'],
};
type Choice<T extends string> = [value: T, label: string, description: string];
const projectChoices: Choice<ProjectType>[] = [
  ['new', 'Eine neue Website', 'Ihr Unternehmen bekommt eine neue, individuell gestaltete Website.'],
  ['existing', 'Eine bestehende Website erneuern', 'Sie haben eine Website und möchten sie neu aufbauen.'],
  ['media', 'Nur Foto oder Video', 'Aufnahmen für Ihr Unternehmen, auch ohne neue Website.'],
  ['advice', 'Noch unklar', 'Wir sprechen zuerst. Sie gelangen direkt zum Kontakt.'],
];
const scopeChoices: Choice<Scope>[] = [
  ['compact', 'Kompakt', 'Ein Onepager oder etwa 2 bis 5 Seiten.'],
  ['extended', 'Erweitert', 'Mehrere verschiedene Seitentypen oder etwa 6 bis 12 Seiten.'],
  ['large', 'Groß', 'Mehr als etwa 12 Seiten oder viele verschiedene Inhaltsarten.'],
  ['unknown', 'Weiß ich noch nicht', 'Das klären wir gemeinsam.'],
];
const textChoices: Choice<TextState>[] = [
  ['ready', 'Die Texte sind fertig', 'Sie liefern sie zum Projektstart.'],
  ['notes', 'Ich habe Stichpunkte', 'Daraus entstehen die Texte.'],
  ['missing', 'Es gibt noch keine Texte', 'Wir erarbeiten sie in einem Interview.'],
  ['unknown', 'Weiß ich noch nicht', 'Das klären wir gemeinsam.'],
];
const imageChoices: Choice<ImageState>[] = [
  ['ready', 'Die Bilder sind fertig', 'Sie liefern sie zum Projektstart.'],
  ['partly', 'Teilweise vorhanden', 'Einige Bilder gibt es, andere fehlen.'],
  ['missing', 'Es gibt keine Bilder', 'Dann klären wir, woher sie kommen.'],
  ['unknown', 'Weiß ich noch nicht', 'Das klären wir gemeinsam.'],
];
const imageSourceChoices: Choice<ImageSource>[] = [
  ['customer_later', 'Ich liefere Bilder später', 'Ohne Termin und ohne Position für Aufnahmen.'],
  ['photo_compact', 'Fotos von Webbyu, kompakt', '1 Standort, bis 60 Minuten, 8 Bilder.'],
  ['photo_standard', 'Fotos von Webbyu, Standard', '1 Standort, bis 2 Stunden, 15 Bilder.'],
  ['licensed', 'Bilder aus Lizenzquellen', 'Auswahl und Einbindung durch Webbyu, Lizenzkosten tragen Sie.'],
  ['no_photos', 'Ohne Fotos', 'Die Gestaltung entsteht aus Schrift, Farbe und Fläche.'],
  ['open', 'Noch offen', 'Das klären wir im Gespräch.'],
];
const videoChoices: Choice<VideoState>[] = [
  ['none', 'Kein Video', 'Die Website kommt ohne Film aus.'],
  ['clip', 'Ein Kurzclip', 'Ein Thema, ein Format, 15 bis 30 Sekunden.'],
  ['unknown', 'Weiß ich noch nicht', 'Das klären wir gemeinsam.'],
];
const zoneChoices: Choice<Zone>[] = [
  ['region', 'In der Region', 'Bad Oldesloe, Stormarn, Hamburg und Umland.'],
  ['outside', 'Außerhalb der Region', 'Die Anfahrt klären wir gesondert.'],
  ['unknown', 'Weiß ich noch nicht', 'Die Anfahrt klären wir gesondert.'],
];
const mediaChoices: Choice<MediaChoice>[] = [
  ['photo_compact', 'Fotos kompakt', '1 Standort, bis 60 Minuten, 8 Bilder.'],
  ['photo_standard', 'Fotos Standard', '1 Standort, bis 2 Stunden, 15 Bilder.'],
  ['clip', 'Ein Kurzclip', 'Ein Thema, ein Format, 15 bis 30 Sekunden.'],
  ['photo_clip', 'Fotos und Kurzclip', 'Beide beim selben Termin.'],
  ['unknown', 'Weiß ich noch nicht', 'Das klären wir gemeinsam.'],
];
const mediaUseChoices: [string, string][] = [['website', 'Website'], ['social', 'Social Media'], ['ads', 'Eigene Werbung'], ['third_party', 'Weitergabe an Dritte']];
const siteChoices: Choice<MediaSites>[] = [
  ['oneSite', 'Ein Standort', 'Alle Aufnahmen an einem Ort.'],
  ['multipleSites', 'Mehrere Standorte', 'Der Umfang wird individuell geklärt.'],
];
const labelOf = <T extends string>(choices: Choice<T>[], value: T | null) => choices.find(choice => choice[0] === value)?.[1] ?? '';
const timingNames: Record<string, string> = { flexible: 'Zeitlich flexibel', soon: 'Möglichst bald', later: 'In den nächsten Monaten' };
const fieldNames: Record<InquiryField, string> = {
  goal: 'Ziel', extensions: 'Funktionen', projectType: 'Vorhaben', timing: 'Gewünschter Start',
  description: 'Projektbeschreibung (höchstens 5.000 Zeichen)', name: 'Name (höchstens 120 Zeichen)',
  email: 'Gültige E-Mail-Adresse (höchstens 254 Zeichen, ASCII-Schreibweise)', selectedPackage: 'Paketwunsch',
  scope: 'Umfang', texts: 'Texte', images: 'Bilder', imageSource: 'Bildquelle', video: 'Video', zone: 'Ort', mediaChoice: 'Medienwunsch',
  mediaUse: 'Verwendung', sites: 'Standorte', drone: 'Drohnenwunsch', removedLines: 'Abgewählte Positionen', catalogVersion: 'Preisstand',
  shownLines: 'Angezeigte Positionen', requestId: 'Anfragekennung', website: 'Formularprüfung',
};
function fieldKind(field: InquiryField, route: Route): Kind | undefined {
  switch (field) {
    case 'requestId': case 'website': return undefined;
    case 'projectType': return 'purpose';
    case 'goal': return route === 'website' ? 'goal' : 'purpose';
    case 'extensions': case 'scope': return route === 'website' ? 'scope' : 'purpose';
    case 'texts': case 'images': case 'imageSource': case 'video': return route === 'website' ? 'content' : 'purpose';
    case 'zone': return route === 'website' ? 'content' : route === 'media' ? 'place' : 'purpose';
    case 'mediaChoice': case 'mediaUse': return route === 'media' ? 'media' : 'purpose';
    case 'sites': case 'drone': return route === 'media' ? 'place' : 'purpose';
    default: return flows[route].at(-1);
  }
}
function fieldStep(field: InquiryField, route: Route): number | undefined {
  const kind = fieldKind(field, route);
  return kind === undefined ? undefined : Math.max(0, flows[route].indexOf(kind));
}
const fieldSelectors: Partial<Record<InquiryField, string>> = {
  goal: '[name="finder-goal"]', extensions: '[name="finder-extension"]', projectType: '[name="finder-purpose"]', scope: '[name="finder-scope"]',
  texts: '[name="finder-texts"]', images: '[name="finder-images"]', imageSource: '[name="finder-image-source"]', video: '[name="finder-video"]',
  zone: '[name="finder-zone"]', mediaChoice: '[name="finder-media-choice"]', mediaUse: '[name="finder-media-use"]', sites: '[name="finder-sites"]', drone: '[name="finder-drone"]',
};
const radioFields: Record<string, keyof BriefState> = {
  'finder-scope': 'scope', 'finder-texts': 'texts', 'finder-images': 'images', 'finder-image-source': 'imageSource', 'finder-video': 'video',
  'finder-zone': 'zone', 'finder-media-choice': 'mediaChoice', 'finder-sites': 'sites',
};
type Attempt = {
  key: string;
  requestId: string;
  result: 'sending' | InquiryResponse | InquiryUncertain;
  retryAt: number;
  hadUnknown: boolean;
};
let finderSequence = 0;
const reasons: Record<Goal, string> = {
  presence: 'Sie möchten sichtbar werden. Ein präziser Unternehmensauftritt stellt Ihr Angebot vor und macht den Kontakt einfach.',
  inquiries: 'Sie möchten aus Interesse konkrete Anfragen machen. Klare Besucherführung und passende Anfragewege unterstützen dieses Ziel.',
  bookings: 'Sie möchten den Weg zum Termin erleichtern. Ein vorhandener Buchungsdienst lässt sich einbinden; für eine eigene Buchungslösung kläre ich mit Ihnen den Ablauf und erstelle ein gesondertes Angebot.',
  sales: 'Sie möchten Produkte verkaufen. Sortiment, Kaufablauf und technische Anbindung bestimmen den Umfang. Ein Shop ist in keinem der drei Website-Pakete pauschal enthalten.',
  media: 'Sie möchten Aufnahmen für Ihr Unternehmen, unabhängig von einer neuen Website. Umfang, Orte und Nutzung stimmen wir vor dem Termin ab.',
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

function listText(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} und ${items.at(-1)}`;
}

function extensionNames(state: BriefState): string {
  if (state.extensions.includes('unsure')) return 'Noch unsicher – gemeinsam klären';
  return extensions.filter(item => state.extensions.includes(item.id)).map(item => item.name).join(', ') || 'Noch keine festgelegt';
}

const consequenceOf = (line: Line) => catalogLineMap[line.id as keyof typeof catalogLineMap].consequence ?? '';
const linesText = (lines: Line[], empty: string) => lines.map(line => `${line.label}: ${lineAmount(line)}`).join('\n') || empty;

function summaryEntries(state: BriefState): [string, string][] {
  const o = orientation(state);
  const goal = goals.find(item => item.id === state.goal)?.label ?? (state.goal === 'media' ? 'Fotos und Videos für mein Unternehmen' : state.goal);
  const closing: [string, string][] = [
    ['Gewünschter Start', timingNames[state.timing] ?? state.timing],
    ['Ihre Idee', state.description.trim() || 'Noch keine Beschreibung'],
    ['Name', state.name.trim()],
    ['E-Mail', state.email.trim()],
  ];
  if (o.route === 'advice') return [['Vorhaben', labelOf(projectChoices, state.projectType)], ...closing];
  const blocks: [string, string][] = [
    [BLOCK_TITLES.creation, linesText(o.creation, 'Keine')],
    [BLOCK_TITLES.open, linesText(o.open, 'Keine offenen Positionen')],
    ...(o.external.length ? [[BLOCK_TITLES.external, linesText(o.external, '')] as [string, string]] : []),
    ['Summe Erstellung', sumText(o.sum)],
    ...(o.removed.length ? [['Abgewählt', o.removed.map(line => `${line.label}: ${consequenceOf(line)}`).join('\n')] as [string, string]] : []),
    ['Preisorientierung', `${ORIENTATION_NOTICE} ${TAX_NOTICE} Katalog ${CATALOG_VERSION}.`],
  ];
  if (o.route === 'media') {
    return [
      ['Vorhaben', labelOf(projectChoices, state.projectType)],
      ['Medienwunsch', labelOf(mediaChoices, state.mediaChoice ?? 'unknown')],
      ['Verwendung', mediaUseChoices.filter(([id]) => state.mediaUse.includes(id)).map(([, label]) => label).join(', ') || 'Noch keine genannt'],
      ['Ort', labelOf(zoneChoices, state.zone)],
      ['Standorte', labelOf(siteChoices, state.sites)],
      ['Drohne', state.drone ? 'Gewünscht, wird gesondert geklärt' : 'Nicht gewünscht'],
      ...blocks, ...closing,
    ];
  }
  const answers: [string, string][] = [
    ['Umfang', labelOf(scopeChoices, state.scope)],
    ['Funktionen', extensionNames(state)],
    ['Texte', labelOf(textChoices, state.texts)],
    ['Bilder', labelOf(imageChoices, state.images)],
    ...(state.images !== 'ready' ? [['Bildquelle', labelOf(imageSourceChoices, state.imageSource ?? 'open')] as [string, string]] : []),
    ['Video', labelOf(videoChoices, state.video)],
    ...(o.needsZone ? [['Ort', labelOf(zoneChoices, state.zone)] as [string, string]] : []),
  ];
  return [
    ['Vorhaben', labelOf(projectChoices, state.projectType)],
    ['Ihr Ziel', goal],
    ['Zusammenstellung', `${state.selectedPackage === null ? 'Automatische Empfehlung: ' : ''}${o.label}`],
    ...answers, ...blocks,
    ['Leistungsabgrenzung', [scopeNotice, ...o.notes].join(' ')],
    ...closing,
  ];
}

export function mountFinder(container: HTMLElement, store: BriefStore, options: { sendEnabled?: boolean } = {}): { openAtStart(): void; focus(): void; dispose(): void } {
  const sendEnabled = options.sendEnabled === true;
  let step = 0;
  let completed = false;
  let localUpdate = false;
  let disposed = false;
  let website = '';
  let localIssue: 'uuid' | 'size' | 'invalid' | null = null;
  let fieldErrors: InquiryField[] = [];
  let copyFeedback = '';
  let copyFallback = '';
  const attempts = new Map<string, Attempt>();
  let lastAttempt: Attempt | undefined;
  let inFlight: Attempt | undefined;
  const statusId = `finder-status-${++finderSequence}`;

  /** Die Anfrage enthält nur Antworten, die für den gewählten Weg gelten, dazu Katalogversion und angezeigte Positionen. */
  function currentKey() { return inquiryFingerprint(requestBrief(store.get()), website); }
  function route(): Route { return routeOf(store.get()); }

  function sendLabel(attempt: Attempt | undefined): string {
    if (inFlight) return 'Wird übermittelt …';
    if (!attempt) return 'Anfrage jetzt senden';
    const result = attempt.result;
    if (result !== 'sending' && !(result instanceof InquiryUncertain) && result.status === 'success') return 'Annahme bestätigt';
    if (attempt.hadUnknown) return 'Bewusst erneut versuchen';
    return 'Später erneut versuchen';
  }

  function statusCopy(attempt: Attempt): [string, string] {
    const result = attempt.result;
    if (result === 'sending') return ['Ihre Anfrage wird übermittelt.', 'Bitte warten Sie auf die Antwort. Ein weiterer Versand ist währenddessen gesperrt. Sie können Ihre Angaben weiterhin kopieren oder bearbeiten.'];
    if (result instanceof InquiryUncertain || (result.status === 'temporary' && result.outcome === 'unknown')) {
      const reason = result instanceof InquiryUncertain
        ? { timeout: 'Die Wartezeit ist abgelaufen.', network: 'Die Verbindung wurde unterbrochen.', response: 'Die Serverantwort war nicht auswertbar.' }[result.reason]
        : 'Der Mailserver konnte die Annahme nicht eindeutig bestätigen.';
      return ['Versandausgang unklar.', `${reason} Die Anfrage kann bereits angenommen worden sein. Es erfolgt keine automatische Wiederholung. Klären Sie den Eingang bitte mit ${INQUIRY_CONTACT} unter Angabe der Anfragekennung. Ein bewusst gewählter weiterer Versuch verwendet für unveränderte Angaben dieselbe Kennung. Der serverseitige Duplikatschutz ist auf 24 Stunden begrenzt; laden Sie die Seite bei ungeklärtem Ausgang bitte nicht neu, um die Kennung zu behalten.`];
    }
    if (result.status === 'success') return [
      result.duplicate ? 'Ihre Anfrage wurde bereits zum Versand angenommen.' : 'Ihre Anfrage wurde zum Versand angenommen.',
      `${result.duplicate ? 'Der Server hat eine frühere Annahme durch den Mailserver bestätigt und keine weitere E-Mail versendet. ' : 'Der Mailserver hat die Annahme Ihrer Nachricht bestätigt. '}Das bestätigt keinen Eingang im Postfach. Sie erhalten keine automatische Bestätigungs-E-Mail.`,
    ];
    const prior = attempt.hadUnknown ? ' Der Ausgang eines früheren Versuchs bleibt unklar. Bitte klären Sie den Eingang unter Angabe der Anfragekennung mit ' + INQUIRY_CONTACT + '.' : '';
    if (result.status === 'invalid') return ['Bitte prüfen Sie Ihre Anfrage.', `Der Server hat diesen Versuch wegen ungültiger Angaben oder einer Formularprüfung abgelehnt. ${result.fields.length ? 'Prüfen Sie die unten genannten Felder.' : 'Ihre Angaben sind erhalten. Bei wiederholter Ablehnung kontaktieren Sie mich bitte direkt.'}${prior}`];
    if (result.status === 'rate_limit') return ['Bitte warten Sie vor einem weiteren Versuch.', `Das Schutzlimit wurde erreicht. Dieser Versuch wurde nicht versendet. Bitte warten Sie ab dieser Antwort mindestens ${result.retryAfter} Sekunden und lösen Sie danach selbst einen weiteren Versuch aus. Es gibt keinen automatischen Versand.${prior}`];
    return ['Dieser Versuch wurde sicher nicht versendet.', `Der Versand ist vorübergehend nicht verfügbar. Ihre Angaben bleiben erhalten. ${result.retryAfter ? `Bitte warten Sie ab dieser Antwort mindestens ${result.retryAfter} Sekunden. ` : ''}Sie können später ausdrücklich erneut versuchen, dieselbe Anfrage zu senden. Es gibt keine automatische Wiederholung.${prior}`];
  }

  function errorLinks(errors: InquiryField[]) {
    const current = route();
    return errors.length ? `<ul class="finder-field-errors">${errors.map(field => `<li>${fieldStep(field, current) === undefined ? escape(fieldNames[field]) : `<button type="button" data-action="fix" data-field="${field}" data-focus="fix-${field}">${escape(fieldNames[field])} prüfen</button>`}</li>`).join('')}</ul>` : '';
  }

  function statusMarkup(key: string) {
    let content = '';
    if (localIssue) {
      const messages = {
        uuid: ['Versand in diesem Browser nicht verfügbar.', `Eine sichere Anfragekennung konnte nicht erstellt werden. Dieser Klick hat nichts versendet. Ihre Angaben bleiben erhalten; kopieren Sie die Zusammenfassung und kontaktieren Sie ${INQUIRY_CONTACT}.`],
        size: ['Ihre Anfrage ist zu groß.', 'Dieser Klick hat nichts versendet. Bitte kürzen Sie Ihre Beschreibung. Der vollständige Datensatz darf höchstens 32 KiB umfassen. Ihre Angaben bleiben erhalten.'],
        invalid: ['Bitte prüfen Sie Ihre Angaben.', 'Dieser Klick hat nichts versendet. Bitte korrigieren Sie die genannten Felder. Ihre Angaben bleiben erhalten.'],
      };
      const [title, detail] = messages[localIssue];
      content += `<div class="finder-notice finder-notice-error"><strong>${title}</strong>${escape(detail)}${errorLinks(fieldErrors)}</div>`;
    }
    const attempt = inFlight ?? attempts.get(key) ?? lastAttempt;
    if (attempt) {
      const [title, detail] = statusCopy(attempt);
      const result = attempt.result;
      const success = result !== 'sending' && !(result instanceof InquiryUncertain) && result.status === 'success';
      const id = success ? result.requestId : attempt.requestId;
      content += `<div class="finder-notice ${success ? 'finder-notice-success' : ''}">${attempt.key !== key ? '<p class="finder-previous">Status der vorherigen Angaben. Die aktuellen Angaben wurden mit diesem Versuch nicht versendet.</p>' : ''}<strong>${escape(title)}</strong>${escape(detail)}<p class="finder-request-id">Anfragekennung: <span>${escape(id)}</span></p>${result !== 'sending' && !(result instanceof InquiryUncertain) && result.status === 'invalid' && attempt.key === key ? errorLinks(result.fields) : ''}<a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a></div>`;
    }
    return `<div id="${statusId}" class="finder-status" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" data-focus="status">${content}</div>`;
  }

  function update(patch: Partial<BriefState>) {
    localIssue = null;
    fieldErrors = [];
    copyFeedback = copyFallback = '';
    localUpdate = true;
    store.update(patch);
    localUpdate = false;
    // Refresh only the notice while typing; keep the live input and caret intact.
    const status = container.querySelector('.finder-status');
    if (status) status.outerHTML = statusMarkup(currentKey());
  }

  function copyMarkup() {
    return `${escape(copyFeedback)}${copyFallback ? `<label class="finder-copy-label">Kopierfassung vom letzten Kopierklick<textarea readonly rows="8" data-focus="copy-fallback" aria-label="Vollständige Anfrage zum Kopieren">${escape(copyFallback)}</textarea></label>` : ''}`;
  }

  function choiceMarkup<T extends string>(name: string, legend: string, choices: Choice<T>[], current: T | null, { numbered = false, grid = '' } = {}) {
    return `<fieldset class="finder-options ${grid}"><legend class="finder-sr-only">${escape(legend)}</legend>${choices.map(([value, label, description], index) => `
      <label class="finder-option ${current === value ? 'is-selected' : ''}"><input type="radio" name="${name}" value="${value}" data-focus="${name}-${value}" ${current === value ? 'checked' : ''}>${numbered ? `<span class="finder-option-number">0${index + 1}</span>` : ''}<span class="finder-option-copy"><strong>${escape(label)}</strong><span>${escape(description)}</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}</fieldset>`;
  }

  function questionMarkup(title: string, markup: string) {
    return `<div class="finder-question"><h4 class="finder-question-title">${escape(title)}</h4>${markup}</div>`;
  }

  function stepHead(number: number, eyebrow: string, heading: string, intro: string) {
    return `<p class="finder-eyebrow">${String(number).padStart(2, '0')} / ${escape(eyebrow)}</p><h3 class="finder-heading" tabindex="-1">${heading}</h3>${intro ? `<p class="finder-step-intro">${escape(intro)}</p>` : ''}`;
  }

  function lineMarkup(line: Line) {
    const remove = line.removable ? `<button type="button" class="finder-line-action" data-action="remove-line" data-line="${line.id}" data-focus="remove-${line.id}" aria-label="${escape(line.label)} abwählen">Abwählen</button>` : '';
    return `<li class="finder-line finder-line-${line.status}"><span class="finder-line-copy"><strong>${escape(line.label)}</strong>${line.detail ? `<span>${escape(line.detail)}</span>` : ''}</span><span class="finder-line-amount">${escape(lineAmount(line))}</span>${remove}</li>`;
  }

  function blocksMarkup(o: Orientation) {
    const list = (lines: Line[], empty: string) => lines.length ? `<ul class="finder-lines">${lines.map(lineMarkup).join('')}</ul>` : `<p class="finder-lines-empty">${empty}</p>`;
    const removed = o.removed.length ? `<section class="finder-block finder-removed" aria-labelledby="${statusId}-removed"><h4 id="${statusId}-removed">Abgewählt</h4><ul class="finder-lines">${o.removed.map(line => `<li class="finder-line"><span class="finder-line-copy"><strong>${escape(line.label)}</strong><span>${escape(consequenceOf(line))}</span></span><button type="button" class="finder-line-action" data-action="restore-line" data-line="${line.id}" data-focus="restore-${line.id}" aria-label="${escape(line.label)} wieder aufnehmen">Wieder aufnehmen</button></li>`).join('')}</ul></section>` : '';
    return `<div class="finder-blocks">
      <section class="finder-block" aria-labelledby="${statusId}-creation"><h4 id="${statusId}-creation">${BLOCK_TITLES.creation}</h4>${list(o.creation, 'Keine Positionen.')}<p class="finder-sum"><span>Summe</span><strong>${escape(sumText(o.sum))}</strong></p></section>
      <section class="finder-block" aria-labelledby="${statusId}-open"><h4 id="${statusId}-open">${BLOCK_TITLES.open}</h4>${list(o.open, 'Keine offenen Positionen.')}</section>
      ${o.external.length ? `<section class="finder-block" aria-labelledby="${statusId}-external"><h4 id="${statusId}-external">${BLOCK_TITLES.external}</h4>${list(o.external, '')}<p class="finder-lines-empty">Diese Kosten zahlen Sie direkt an Ihre Anbieter, nicht an Webbyu.</p></section>` : ''}
      ${removed}
    </div><p class="finder-fineprint">${ORIENTATION_NOTICE} ${TAX_NOTICE}</p>`;
  }

  function projectFieldsMarkup(state: BriefState) {
    return `<div class="finder-fields finder-project">
      <label class="finder-field">Wann möchten Sie starten?<select name="timing" data-focus="timing">${Object.entries(timingNames).map(([value, label]) => `<option value="${value}" ${state.timing === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <label class="finder-field finder-field-wide">Was haben Sie vor? <span class="finder-optional">Optional</span><textarea name="description" data-focus="description" rows="5" maxlength="5000" placeholder="Ihr Unternehmen, Ihre Idee oder was im Alltag einfacher werden soll …">${escape(state.description)}</textarea></label>
    </div>`;
  }

  function contactMarkup(state: BriefState) {
    return `<div class="finder-fields finder-contact"><label class="finder-field">Ihr Name <span class="finder-required">${sendEnabled ? '*' : '(optional)'}</span><input type="text" name="name" data-focus="name" autocomplete="name" ${sendEnabled ? 'required' : ''} maxlength="120" value="${escape(state.name)}" placeholder="Vor- und Nachname"></label><label class="finder-field">Ihre E-Mail <span class="finder-required">${sendEnabled ? '*' : '(optional)'}</span><input type="email" name="email" data-focus="email" autocomplete="email" ${sendEnabled ? 'required' : ''} maxlength="254" value="${escape(state.email)}" placeholder="hallo@ihr-unternehmen.de"></label></div>
      ${sendEnabled ? `<p class="finder-privacy">* Erforderlich für Ihre Anfrage. Bis zum ausdrücklichen Versand bleiben Ihre Eingaben nur im Speicher dieser Seite. Als Nächstes prüfen Sie eine Vorschau; erst danach können Sie die Anfrage über IONOS per E-Mail an <a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a> senden. Beim Neuladen gehen die Eingaben verloren. <a href="${import.meta.env.BASE_URL}datenschutz/#projektfinder">Datenschutz zu Versand und Schutzdaten</a></p>` : '<p class="finder-privacy">Name und E-Mail sind für Ihre lokale Zusammenfassung optional. Diese Seite versendet nichts. Kopieren Sie Ihre Angaben und kontaktieren Sie mich direkt. Beim Neuladen werden Ihre Eingaben verworfen.</p>'}`;
  }

  function resultMarkup(state: BriefState, o: Orientation, number: number) {
    const auto = state.selectedPackage === null;
    const media = o.route === 'media';
    const lead = media ? reasons.media : reasons[state.goal];
    const rule = media ? 'Die einzelnen Positionen und was noch offen ist, sehen Sie unten.'
      : o.choice === 'custom'
        ? (o.triggers.length ? `Dafür gibt es keinen Pauschalumfang: ${listText(o.triggers)}. Die bekannten Positionen sehen Sie unten, den Rest klären wir im Gespräch.` : 'Ich kläre mit Ihnen Funktionen, Inhalte und technische Anbindungen und stelle daraus einen individuellen Umfang zusammen.')
        : o.label === INDIVIDUAL_LABEL ? 'Sie haben die Zusammenstellung verändert. Die Positionen unten gelten so, wie Sie sie gewählt haben.'
          : `${packages.find(item => item.id === o.choice)!.description}${o.choice === 'start' ? ' Dazu kommen die Module, die Sie gewählt haben.' : ''}`;
    const suggestWizard = !media && state.goal === 'inquiries' && !state.extensions.includes('wizard') && !state.extensions.includes('unsure');
    const zone = o.needsZone && !o.zoneAsked
      ? questionMarkup('Wo sollen die Aufnahmen stattfinden?', choiceMarkup('finder-zone', 'Ort der Aufnahmen', zoneChoices, state.zone, { grid: 'finder-choices' }))
      : '';
    const hints = media ? o.notes : [scopeNotice, ...o.notes];
    return `${stepHead(number, 'Ein Vorschlag für Ihr Vorhaben.', 'Ein erster Rahmen<br>für Ihr Vorhaben.', '')}
      <div class="finder-recommendation"><span class="finder-recommendation-label">${media || auto ? 'Meine erste Orientierung' : 'Ihre Paketauswahl'}</span><h4>${escape(o.label)}</h4><p>${escape(lead)}</p><p>${escape(rule)}</p>${suggestWizard ? `<p class="finder-suggestion">Dazu passt eine Auswahlhilfe: wenige Fragen auf Ihrer Website, deren Antworten Sie als geordnete Anfrage erreichen (${euro(catalogLineMap.wizard.fixed ?? 0)}). <button type="button" class="finder-inline" data-action="add-wizard" data-focus="add-wizard">Auswahlhilfe vormerken</button></p>` : ''}</div>
      ${zone}${blocksMarkup(o)}
      ${hints.length ? `<ul class="finder-hints">${hints.map(hint => `<li>${escape(hint)}</li>`).join('')}</ul>` : ''}
      ${media ? '' : `<label class="finder-field finder-package-field">Paket selbst wählen<select name="selectedPackage" data-focus="selectedPackage"><option value="auto" ${auto ? 'selected' : ''}>Meine Empfehlung: ${escape(packageName(o.recommended))}</option>${packages.map(item => `<option value="${item.id}" ${state.selectedPackage === item.id ? 'selected' : ''}>${item.name}</option>`).join('')}<option value="custom" ${state.selectedPackage === 'custom' ? 'selected' : ''}>Individuell klären</option></select></label>`}
      ${projectFieldsMarkup(state)}${contactMarkup(state)}`;
  }

  function stepMarkup(kind: Kind, state: BriefState, o: Orientation, number: number): string {
    switch (kind) {
      case 'purpose':
        return `${stepHead(number, 'Womit fangen wir an?', 'Worum geht<br>es Ihnen?', 'Wählen Sie, was am besten passt. Alles Weitere stimme ich darauf ab.')}${choiceMarkup('finder-purpose', 'Ihr Vorhaben', projectChoices, state.projectType, { numbered: true, grid: 'finder-goals' })}`;
      case 'goal':
        return `${stepHead(number, 'Erst das Ziel. Dann die Website.', 'Was möchten Sie<br>möglich machen?', 'Wählen Sie das wichtigste Ziel für Ihr Unternehmen. Alles Weitere stimme ich darauf ab.')}<fieldset class="finder-options finder-goals"><legend class="finder-sr-only">Das wichtigste Ziel Ihrer Website</legend>${goals.map((goal, index) => `
          <label class="finder-option ${state.goal === goal.id ? 'is-selected' : ''}"><input type="radio" name="finder-goal" value="${goal.id}" data-focus="goal-${goal.id}" ${state.goal === goal.id ? 'checked' : ''}><span class="finder-option-number">0${index + 1}</span><span class="finder-option-copy"><strong>${goal.label}</strong><span>${goal.description}</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}</fieldset>`;
      case 'scope':
        return `${stepHead(number, 'So viel, wie Ihr Unternehmen braucht.', 'Wie viel soll Ihre<br>Website tragen?', 'Eine grobe Einschätzung genügt. Mehrere Funktionen sind möglich, und noch ist nichts festgelegt.')}
          ${choiceMarkup('finder-scope', 'Umfang der Website', scopeChoices, state.scope, { grid: 'finder-choices' })}
          ${questionMarkup('Welche Funktionen wären hilfreich?', `<fieldset class="finder-options finder-extensions"><legend class="finder-sr-only">Gewünschte Funktionen</legend>${extensions.map(item => `
            <label class="finder-option finder-extension ${state.extensions.includes(item.id) ? 'is-selected' : ''}"><input type="checkbox" name="finder-extension" value="${item.id}" data-focus="extension-${item.id}" ${state.extensions.includes(item.id) ? 'checked' : ''}><span class="finder-option-copy"><span class="finder-extension-tag">${item.short}</span><strong>${item.name}</strong></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}
            <label class="finder-option finder-unsure ${state.extensions.includes('unsure') ? 'is-selected' : ''}"><input type="checkbox" name="finder-extension" value="unsure" data-focus="extension-unsure" ${state.extensions.includes('unsure') ? 'checked' : ''}><span class="finder-option-copy"><strong>Noch unsicher</strong><span>Finden wir gemeinsam heraus.</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label>
          </fieldset>`)}`;
      case 'content':
        return `${stepHead(number, 'Was bringen Sie mit?', 'Welche Inhalte<br>gibt es schon?', 'Fehlende Inhalte sind kein Problem. Sie bestimmen nur, was noch zu tun ist.')}
          ${questionMarkup('Wie steht es um die Texte?', choiceMarkup('finder-texts', 'Texte', textChoices, state.texts, { grid: 'finder-choices' }))}
          ${questionMarkup('Wie steht es um die Bilder?', choiceMarkup('finder-images', 'Bilder', imageChoices, state.images, { grid: 'finder-choices' }))}
          ${state.images !== 'ready' ? questionMarkup('Woher sollen die Bilder kommen?', choiceMarkup('finder-image-source', 'Bildquelle', imageSourceChoices, state.imageSource ?? 'open', { grid: 'finder-choices' })) : ''}
          ${questionMarkup('Soll ein Video dazugehören?', choiceMarkup('finder-video', 'Video', videoChoices, state.video, { grid: 'finder-choices' }))}
          ${o.zoneAsked ? questionMarkup('Wo sollen die Aufnahmen stattfinden?', choiceMarkup('finder-zone', 'Ort der Aufnahmen', zoneChoices, state.zone, { grid: 'finder-choices' })) : ''}`;
      case 'media':
        return `${stepHead(number, 'Bilder, die für Sie arbeiten.', 'Was brauchen<br>Sie?', 'Eine Website setze ich nicht voraus. Wählen Sie, was am besten passt.')}
          ${choiceMarkup('finder-media-choice', 'Medienwunsch', mediaChoices, state.mediaChoice ?? 'unknown', { grid: 'finder-choices' })}
          ${questionMarkup('Wofür verwenden Sie die Aufnahmen?', `<fieldset class="finder-options finder-choices"><legend class="finder-sr-only">Verwendung, mehrere Antworten möglich</legend>${mediaUseChoices.map(([id, label]) => `
            <label class="finder-option finder-extension ${state.mediaUse.includes(id) ? 'is-selected' : ''}"><input type="checkbox" name="finder-media-use" value="${id}" data-focus="media-use-${id}" ${state.mediaUse.includes(id) ? 'checked' : ''}><span class="finder-option-copy"><strong>${label}</strong></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}</fieldset>`)}`;
      case 'place':
        return `${stepHead(number, 'Wo und wofür?', 'Wo soll aufgenommen<br>werden?', 'Ort und Umfang bestimmen, wie viel Aufwand entsteht.')}
          ${questionMarkup('Wo findet der Termin statt?', choiceMarkup('finder-zone', 'Ort der Aufnahmen', zoneChoices, state.zone, { grid: 'finder-choices' }))}
          ${questionMarkup('An wie vielen Orten?', choiceMarkup('finder-sites', 'Standorte', siteChoices, state.sites, { grid: 'finder-choices' }))}
          ${questionMarkup('Möchten Sie Drohnenaufnahmen?', `<fieldset class="finder-options finder-choices"><legend class="finder-sr-only">Drohnenwunsch</legend><label class="finder-option finder-extension ${state.drone ? 'is-selected' : ''}"><input type="checkbox" name="finder-drone" value="drone" data-focus="drone" ${state.drone ? 'checked' : ''}><span class="finder-option-copy"><strong>Ja, bitte prüfen</strong><span>Drohnenaufnahmen hängen von Ort, Wetter und Vorbereitung ab und werden gesondert geklärt.</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label></fieldset>`)}`;
      case 'result':
        return resultMarkup(state, o, number);
      default:
        return `${stepHead(number, 'Sprechen wir darüber.', 'Wie erreiche<br>ich Sie?', 'Dann klären wir zuerst im Gespräch, was Sie brauchen. Eine Preisorientierung gibt es danach.')}${projectFieldsMarkup(state)}${contactMarkup(state)}`;
    }
  }

  function render(focusHeading: boolean | 'status' = false) {
    const state = store.get();
    const brief = requestBrief(state);
    const current = routeOf(state);
    step = Math.min(step, flows[current].length - 1);
    // Die angezeigten Positionen und der Preisstand gehören zur Anfrage; die Antworten bleiben unverändert.
    if (brief.catalogVersion !== state.catalogVersion || JSON.stringify(brief.shownLines) !== JSON.stringify(state.shownLines)) {
      localUpdate = true;
      store.update({ catalogVersion: brief.catalogVersion, shownLines: brief.shownLines });
      localUpdate = false;
    }
    const key = currentKey();
    const attempt = attempts.get(key);
    const active = container.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    const focusedName = active?.dataset.focus;
    const focusedHref = active instanceof HTMLAnchorElement ? active.getAttribute('href') : null;
    const selection = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      ? { start: active.selectionStart, end: active.selectionEnd, direction: active.selectionDirection } : null;
    const names = stepNames[current];
    const last = flows[current].length - 1;
    let body = '';

    if (completed) {
      body = `
        <div class="finder-complete-mark" aria-hidden="true">↗</div>
        <p class="finder-eyebrow">Ihr Projekt auf einen Blick</p>
        <h3 class="finder-heading" tabindex="-1">Ihre Anfrage.<br>In Ruhe prüfen.</h3>
        <p class="finder-step-intro">${sendEnabled ? 'Prüfen Sie die vollständige Anfrage. Sie können sie kopieren oder Ihre Angaben bearbeiten. Erst ein Klick auf „Anfrage jetzt senden“ übermittelt sie an Webbyu.' : 'Ihre Zusammenfassung ist fertig. Kopieren Sie sie und kontaktieren Sie mich per E-Mail oder Telefon. Der Projektfinder versendet derzeit nichts.'}</p>
        <p class="finder-privacy">${businessNotice}</p>
        ${!attempt ? '<div class="finder-notice"><strong>Vorschau erstellt. Nichts versendet.</strong> Diese Angaben bleiben bis zum Versand nur im Speicher dieser Seite. Beim Neuladen gehen Eingaben und Anfragekennungen verloren.</div>' : ''}
        <div class="finder-summary" data-summary><dl>${summaryEntries(state).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><p>Ein Angebot entsteht nach dem Gespräch. Den endgültigen Umfang stimmen wir gemeinsam ab.</p></div>
        ${sendEnabled ? `<p class="finder-privacy">Beim ausdrücklichen Versand werden die oben gezeigten Projekt- und Kontaktdaten sowie eine Anfragekennung an den Webbyu-Server übertragen und über IONOS verschlüsselt per E-Mail an <a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a> gesendet. Ihre E-Mail-Adresse dient als Antwortadresse (Reply-To). Zur Missbrauchsabwehr und gegen Doppelversand verarbeitet der Server pseudonymisierte Schutzdaten. Es gibt keine automatische Besucher-E-Mail und keine Anhänge. <a href="${import.meta.env.BASE_URL}datenschutz/#projektfinder">Datenschutz zu Versand und Schutzdaten</a></p>` : `<p class="finder-privacy">Die Zusammenfassung bleibt nur in dieser Seite und wird beim Neuladen gelöscht. Es wird nichts übertragen. Kontakt: <a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a> oder <a href="tel:+4917642090983">+49 176 42090983</a>.</p>`}
        <div class="finder-actions finder-actions-summary"><button class="finder-back" type="button" data-action="edit" data-focus="edit">← Angaben bearbeiten</button><button class="finder-back" type="button" data-action="copy" data-focus="copy">Zusammenfassung kopieren</button>${sendEnabled ? `<button class="finder-next" type="button" data-action="send" data-focus="send" ${inFlight || (attempt?.result !== undefined && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'success') ? 'disabled' : ''}>${sendLabel(attempt)} <span aria-hidden="true">↗</span></button>` : `<a class="finder-next" href="mailto:${INQUIRY_CONTACT}">E-Mail schreiben <span aria-hidden="true">↗</span></a>`}</div>
        <div class="finder-copy-status" role="status" aria-live="polite">${copyMarkup()}</div>`;
    } else {
      body = stepMarkup(flows[current][step], state, orientation(state), step + 1);
      body += `<div class="finder-actions">${step > 0 ? '<button class="finder-back" type="button" data-action="back" data-focus="back">← Zurück</button>' : '<span class="finder-time">Nur ein paar Fragen. Gesendet wird erst, wenn Sie es wollen.</span>'}<button class="finder-next" type="submit" data-focus="next">${step === last ? 'Anfrage prüfen' : 'Weiter'} <span aria-hidden="true">↗</span></button></div>`;
    }

    container.innerHTML = `<div class="finder"><div class="finder-topline"><span>Ihr Projektfinder</span><span>${completed ? 'Ihre Anfrage prüfen' : `${String(step + 1).padStart(2, '0')} — ${String(names.length).padStart(2, '0')}`}</span></div><ol class="finder-progress finder-progress-${names.length}" aria-label="Fortschritt">${names.map((name, index) => `<li class="${index <= step || completed ? 'is-active' : ''}" ${!completed && index === step ? 'aria-current="step"' : ''}><span class="finder-progress-number">${index < step || completed ? '✓' : `0${index + 1}`}</span><span>${name}</span></li>`).join('')}</ol><form class="finder-form" aria-busy="${Boolean(inFlight)}">${statusMarkup(key)}${body}<div hidden aria-hidden="true"><label>Dieses Feld bitte leer lassen<input type="text" name="website" tabindex="-1" autocomplete="off" value="${escape(website)}"></label></div></form></div>`;
    container.querySelector<HTMLElement>('.finder-heading')!.dataset.focus = 'heading';

    const errors = [...fieldErrors, ...(attempt?.result !== undefined && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'invalid' ? attempt.result.fields : [])];
    errors.forEach(field => {
      const selector = fieldSelectors[field] ?? `[name="${field}"]`;
      container.querySelectorAll(selector).forEach(input => { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', statusId); });
    });

    if (focusHeading === 'status') container.querySelector<HTMLElement>('.finder-status')?.focus();
    else if (focusHeading) container.querySelector<HTMLElement>('.finder-heading')?.focus();
    else if (focusedName) {
      const replacement = container.querySelector<HTMLElement>(`[data-focus="${focusedName}"]`);
      replacement?.focus({ preventScroll: true });
      if (selection?.start !== null && selection?.start !== undefined && (replacement instanceof HTMLInputElement || replacement instanceof HTMLTextAreaElement)) replacement.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
    } else if (focusedHref) Array.from(container.querySelectorAll('a')).find(link => link.getAttribute('href') === focusedHref)?.focus({ preventScroll: true });
  }

  function onInput(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (target.name === 'website') { website = target.value; return; }
    if (target.name === 'name' || target.name === 'email' || target.name === 'description') {
      target.setCustomValidity('');
      target.removeAttribute('aria-invalid');
      target.removeAttribute('aria-describedby');
      update({ [target.name]: target.value });
    }
  }

  function onChange(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    const state = store.get();
    if (target.name === 'finder-purpose') {
      const projectType = target.value as ProjectType;
      const patch: Partial<BriefState> = { projectType };
      // Der Medien-Weg kennt kein Website-Ziel: `media` ersetzt es und kehrt beim Verlassen zum Standardziel zurück.
      if (projectType === 'media') { patch.goal = 'media'; patch.mediaChoice = state.mediaChoice ?? 'unknown'; }
      else if (state.goal === 'media') patch.goal = 'inquiries';
      update(patch);
      render();
    } else if (target.name === 'finder-goal') {
      update({ goal: target.value as Goal });
      render();
    } else if (target.name === 'finder-extension' && target instanceof HTMLInputElement) {
      const previous = state.extensions;
      const chosen = target.value === 'unsure'
        ? (target.checked ? ['unsure'] : [])
        : target.checked
          ? [...previous.filter(id => id !== 'unsure' && id !== target.value), target.value]
          : previous.filter(id => id !== target.value);
      update({ extensions: chosen });
      render();
    } else if (target.name in radioFields) {
      update({ [radioFields[target.name]]: target.value } as Partial<BriefState>);
      render();
    } else if (target.name === 'finder-media-use' && target instanceof HTMLInputElement) {
      update({ mediaUse: target.checked ? [...state.mediaUse.filter(id => id !== target.value), target.value] : state.mediaUse.filter(id => id !== target.value) });
      render();
    } else if (target.name === 'finder-drone' && target instanceof HTMLInputElement) {
      update({ drone: target.checked });
      render();
    } else if (target.name === 'timing') {
      update({ timing: target.value });
    } else if (target.name === 'selectedPackage') {
      update({ selectedPackage: target.value === 'auto' ? null : target.value as PackageChoice });
      render();
    }
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (completed) return;
    website = container.querySelector<HTMLInputElement>('[name="website"]')?.value ?? website;
    const current = route();
    const last = flows[current].length - 1;
    const invalid = invalidInquiryFields(requestBrief(store.get())).filter(field =>
      (sendEnabled || !['name', 'email'].includes(field)) && (step === last || fieldStep(field, current) === step));
    if (invalid.length) { showInvalid(invalid); return; }
    if (step < last) {
      step += 1;
      render(true);
      return;
    }
    const form = container.querySelector<HTMLFormElement>('form')!;
    if (!form.reportValidity()) return;
    localIssue = null;
    fieldErrors = [];
    completed = true;
    render(true);
  }

  function focusField(field: InquiryField) {
    const selector = field === 'goal' ? '[name="finder-goal"]:checked' : fieldSelectors[field] ?? `[name="${field}"]`;
    container.querySelector<HTMLElement>(selector)?.focus();
  }

  function showInvalid(errors: InquiryField[]) {
    fieldErrors = errors;
    localIssue = 'invalid';
    completed = false;
    step = fieldStep(errors[0], route()) ?? step;
    render();
    focusField(errors[0]);
  }

  async function send() {
    if (!sendEnabled || !completed || inFlight || disposed) return;
    website = container.querySelector<HTMLInputElement>('[name="website"]')?.value ?? website;
    const brief = requestBrief(store.get());
    const invalid = invalidInquiryFields(brief);
    if (invalid.length) { showInvalid(invalid); return; }
    const key = currentKey();
    let attempt = attempts.get(key);
    if (attempt && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'success') return;
    if (attempt && Date.now() < attempt.retryAt) { render('status'); return; }
    const requestId = attempt?.requestId ?? createInquiryId();
    if (!requestId) { localIssue = 'uuid'; render('status'); return; }
    const request: InquiryRequest = { ...brief, requestId, website };
    if (!inquiryFits(request)) { localIssue = 'size'; render('status'); return; }
    attempt ??= { key, requestId, result: 'sending', retryAt: 0, hadUnknown: false };
    attempt.result = 'sending';
    attempts.set(key, attempt);
    lastAttempt = inFlight = attempt;
    localIssue = null;
    render('status');
    try {
      const response = await postInquiry(request);
      attempt.result = response;
      if (response.status === 'temporary' && response.outcome === 'unknown') attempt.hadUnknown = true;
      attempt.retryAt = 'retryAfter' in response && response.retryAfter ? Date.now() + response.retryAfter * 1000 : 0;
    } catch (error) {
      attempt.result = error instanceof InquiryUncertain ? error : new InquiryUncertain('network');
      attempt.hadUnknown = true;
      attempt.retryAt = 0;
    } finally {
      inFlight = undefined;
      if (!disposed) {
        const focusResult = container.contains(document.activeElement) && document.activeElement?.getAttribute('data-focus') === 'status';
        render(focusResult ? 'status' : false);
      }
    }
  }

  async function onClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const action = target.closest<HTMLButtonElement>('[data-action]')?.dataset.action;
    if (action === 'back') {
      step = Math.max(0, step - 1);
      render(true);
    } else if (action === 'edit') {
      completed = false;
      step = 0;
      render(true);
    } else if (action === 'send') {
      await send();
    } else if (action === 'remove-line' || action === 'restore-line') {
      const id = target.closest<HTMLButtonElement>('[data-line]')?.dataset.line;
      if (!id) return;
      const kept = store.get().removedLines.filter(item => item !== id);
      update({ removedLines: action === 'remove-line' ? [...kept, id] : kept });
      render();
      container.querySelector<HTMLElement>(`[data-focus="${action === 'remove-line' ? 'restore' : 'remove'}-${id}"]`)?.focus({ preventScroll: true });
    } else if (action === 'add-wizard') {
      update({ extensions: [...store.get().extensions.filter(id => id !== 'unsure' && id !== 'wizard'), 'wizard'] });
      render();
    } else if (action === 'fix') {
      const field = target.closest<HTMLButtonElement>('[data-field]')?.dataset.field as InquiryField;
      const fixStep = fieldStep(field, route());
      if (fixStep === undefined) return;
      completed = false;
      step = fixStep;
      render();
      focusField(field);
    } else if (action === 'copy') {
      const attempt = attempts.get(currentKey());
      const id = attempt?.result !== undefined && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'success' ? attempt.result.requestId : attempt?.requestId;
      const status = attempt ? statusCopy(attempt).join(' ') : 'Vorschau – nichts versendet.';
      const text = `Webbyu – mein Vorhaben\n\n${summaryEntries(store.get()).map(([label, value]) => `${label}: ${value}`).join('\n\n')}\n\n${status}${id ? `\nAnfragekennung: ${id}` : ''}\n\nEin Angebot entsteht nach dem Gespräch.`;
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        if (disposed) return;
        copyFeedback = 'Ihre Zusammenfassung wurde kopiert.';
        copyFallback = '';
        const status = container.querySelector('.finder-copy-status');
        if (status) status.innerHTML = copyMarkup();
      } catch {
        if (disposed) return;
        copyFeedback = 'Kopieren Sie die markierte Anfrage mit Strg+C oder der Kopierfunktion Ihres Geräts. Die Fassung enthält auch den Versandstatus und eine vorhandene Anfragekennung.';
        copyFallback = text;
        const status = container.querySelector('.finder-copy-status');
        if (status) {
          status.innerHTML = copyMarkup();
          const fallback = status.querySelector('textarea');
          fallback?.focus({ preventScroll: true });
          fallback?.select();
        }
      }
    }
  }

  container.addEventListener('input', onInput);
  container.addEventListener('change', onChange);
  container.addEventListener('submit', onSubmit);
  container.addEventListener('click', onClick);
  const unsubscribe = store.subscribe(() => {
    if (!localUpdate) { localIssue = null; fieldErrors = []; copyFeedback = copyFallback = ''; render(); }
  });
  render();

  return {
    focus() {
      container.querySelector<HTMLElement>('.finder-heading')?.focus({ preventScroll: true });
    },
    openAtStart() {
      completed = false;
      step = 0;
      render();
      container.querySelector<HTMLElement>('.finder-heading')?.focus({ preventScroll: true });
    },
    dispose() {
      disposed = true;
      unsubscribe();
      container.removeEventListener('input', onInput);
      container.removeEventListener('change', onChange);
      container.removeEventListener('submit', onSubmit);
      container.removeEventListener('click', onClick);
    },
  };
}
