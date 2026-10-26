import { extensions, goals, packages, offerNotice, scopeNotice, type Goal, type PackageChoice } from './data';
import { recommendPackage, type BriefState, type BriefStore } from './state';
import type { InquiryField, InquiryRequest, InquiryResponse } from './inquiry-contract';
import { createInquiryId, INQUIRY_CONTACT, inquiryFingerprint, inquiryFits, InquiryUncertain, invalidInquiryFields, postInquiry } from './inquiry-client';
import './finder.css';

const stepNames = ['Ihr Ziel', 'Funktionen', 'Ihr Projekt', 'Ihre Empfehlung'];
const projectNames: Record<string, string> = { new: 'Eine neue Website', existing: 'Eine bestehende Website erneuern' };
const timingNames: Record<string, string> = { flexible: 'Zeitlich flexibel', soon: 'Möglichst bald', later: 'In den nächsten Monaten' };
const fieldNames: Record<InquiryField, string> = {
  goal: 'Ziel', extensions: 'Erweiterungen', projectType: 'Ausgangspunkt', timing: 'Gewünschter Start',
  description: 'Projektbeschreibung (höchstens 5.000 Zeichen)', name: 'Name (höchstens 120 Zeichen)',
  email: 'Gültige E-Mail-Adresse (höchstens 254 Zeichen, ASCII-Schreibweise)', selectedPackage: 'Paketwunsch',
  requestId: 'Anfragekennung', website: 'Formularprüfung',
};
const fieldSteps: Partial<Record<InquiryField, number>> = { goal: 0, extensions: 1, projectType: 2, timing: 2, description: 2, name: 3, email: 3, selectedPackage: 3 };
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
  bookings: 'Sie möchten den Weg zum Termin erleichtern. Ich kläre mit Ihnen den Buchungsablauf und welche vorhandenen Dienste angebunden werden sollen. Dafür ist ein gesondertes Angebot erforderlich.',
  sales: 'Sie möchten Produkte verkaufen. Sortiment, Kaufablauf und technische Anbindung bestimmen den Umfang. Ein Shop ist in keinem der drei Website-Pakete pauschal enthalten.',
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

function extensionNames(state: BriefState): string {
  if (state.extensions.includes('unsure')) return 'Noch unsicher – gemeinsam klären';
  return extensions.filter(item => state.extensions.includes(item.id)).map(item => item.name).join(', ') || 'Noch keine festgelegt';
}

function selectedPackage(state: BriefState) {
  return packages.find(item => item.id === (state.selectedPackage ?? recommendPackage(state.goal, state.extensions)));
}

function scopeNotes(state: BriefState): string {
  const notes = [scopeNotice];
  const chosen = selectedPackage(state);
  if (state.extensions.includes('videos') && chosen?.id !== 'complete') notes.push('Foto-, Video- und Textproduktion ist für dieses Paket zusätzlich abzustimmen.');
  if (state.extensions.includes('photos') && chosen?.id === 'start') notes.push('Eigene Fotoproduktion ist in Start nicht enthalten.');
  if (state.extensions.some(id => ['cms', 'seo', 'maps', 'wizard', '3d'].includes(id))) notes.push('Vorgemerkte Erweiterungen sind Wünsche; Umfang und mögliche Zusatzkosten werden separat abgestimmt.');
  return notes.join(' ');
}

function summaryEntries(state: BriefState): [string, string][] {
  const chosen = selectedPackage(state);
  return [
    ['Ihr Ziel', goals.find(item => item.id === state.goal)?.label ?? state.goal],
    ['Paketwunsch', `${state.selectedPackage === null ? 'Automatische Empfehlung: ' : ''}${chosen?.name ?? 'Individuellen Umfang klären'}`],
    ['Angebot', chosen?.price ?? offerNotice],
    ['Leistungsabgrenzung', scopeNotes(state)],
    ['Erweiterungen', extensionNames(state)],
    ['Projekt', projectNames[state.projectType] ?? state.projectType],
    ['Gewünschter Start', timingNames[state.timing] ?? state.timing],
    ['Ihre Idee', state.description.trim() || 'Noch keine Beschreibung'],
    ['Name', state.name.trim()],
    ['E-Mail', state.email.trim()],
  ];
}

export function mountFinder(container: HTMLElement, store: BriefStore): { openAtStart(): void; focus(): void; dispose(): void } {
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

  function currentKey() { return inquiryFingerprint(store.get(), website); }

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
    return errors.length ? `<ul class="finder-field-errors">${errors.map(field => `<li>${fieldSteps[field] === undefined ? escape(fieldNames[field]) : `<button type="button" data-action="fix" data-field="${field}" data-focus="fix-${field}">${escape(fieldNames[field])} prüfen</button>`}</li>`).join('')}</ul>` : '';
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

  function render(focusHeading: boolean | 'status' = false) {
    const state = store.get();
    const key = currentKey();
    const attempt = attempts.get(key);
    const active = container.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    const focusedName = active?.dataset.focus;
    const focusedHref = active instanceof HTMLAnchorElement ? active.getAttribute('href') : null;
    const selection = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      ? { start: active.selectionStart, end: active.selectionEnd, direction: active.selectionDirection } : null;
    let body = '';

    if (completed) {
      body = `
        <div class="finder-complete-mark" aria-hidden="true">↗</div>
        <p class="finder-eyebrow">Ihr Projekt auf einen Blick</p>
        <h3 class="finder-heading" tabindex="-1">Ihre Anfrage.<br>In Ruhe prüfen.</h3>
        <p class="finder-step-intro">Prüfen Sie die vollständige Anfrage. Sie können sie kopieren oder Ihre Angaben bearbeiten. Erst ein Klick auf „Anfrage jetzt senden“ übermittelt sie an Webbyu.</p>
        ${!attempt ? '<div class="finder-notice"><strong>Vorschau erstellt. Nichts versendet.</strong> Diese Angaben bleiben bis zum Versand nur im Speicher dieser Seite. Beim Neuladen gehen Eingaben und Anfragekennungen verloren.</div>' : ''}
        <div class="finder-summary" data-summary><dl>${summaryEntries(state).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><p>Ein Angebot entsteht nach dem Gespräch. Den endgültigen Umfang stimmen wir gemeinsam ab.</p></div>
        <p class="finder-privacy">Beim Versand werden die oben gezeigten Projekt- und Kontaktdaten sowie eine Anfragekennung an den Webbyu-Server übertragen und per E-Mail an <a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a> gesendet. Zur Missbrauchsabwehr verarbeitet der Server technische Schutzdaten. Es gibt keine automatische Besucher-E-Mail. <a href="${import.meta.env.BASE_URL}datenschutz/">Datenschutzerklärung</a></p>
        <div class="finder-actions finder-actions-summary"><button class="finder-back" type="button" data-action="edit" data-focus="edit">← Angaben bearbeiten</button><button class="finder-back" type="button" data-action="copy" data-focus="copy">Zusammenfassung kopieren</button><button class="finder-next" type="button" data-action="send" data-focus="send" ${inFlight || (attempt?.result !== undefined && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'success') ? 'disabled' : ''}>${sendLabel(attempt)} <span aria-hidden="true">↗</span></button></div>
        <div class="finder-copy-status" role="status" aria-live="polite">${copyMarkup()}</div>`;
    } else {
      if (step === 0) {
        body = `<p class="finder-eyebrow">01 / Erst das Ziel. Dann die Website.</p>
          <h3 class="finder-heading" tabindex="-1">Was möchten Sie<br>möglich machen?</h3>
          <p class="finder-step-intro">Wählen Sie das wichtigste Ziel für Ihr Unternehmen. Alles Weitere stimme ich darauf ab.</p>
          <fieldset class="finder-options finder-goals"><legend class="finder-sr-only">Das wichtigste Ziel Ihrer Website</legend>${goals.map((goal, index) => `
            <label class="finder-option ${state.goal === goal.id ? 'is-selected' : ''}"><input type="radio" name="finder-goal" value="${goal.id}" data-focus="goal-${goal.id}" ${state.goal === goal.id ? 'checked' : ''}><span class="finder-option-number">0${index + 1}</span><span class="finder-option-copy"><strong>${goal.label}</strong><span>${goal.description}</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}</fieldset>`;
      } else if (step === 1) {
        body = `<p class="finder-eyebrow">02 / So individuell wie Ihr Alltag.</p>
          <h3 class="finder-heading" tabindex="-1">Was soll Ihre<br>Website können?</h3>
          <p class="finder-step-intro">Wählen Sie, was hilfreich wäre. Mehrere Antworten sind möglich – und noch nichts ist festgelegt.</p>
          <fieldset class="finder-options finder-extensions"><legend class="finder-sr-only">Gewünschte Erweiterungen</legend>${extensions.map(item => `
            <label class="finder-option finder-extension ${state.extensions.includes(item.id) ? 'is-selected' : ''}"><input type="checkbox" name="finder-extension" value="${item.id}" data-focus="extension-${item.id}" ${state.extensions.includes(item.id) ? 'checked' : ''}><span class="finder-option-copy"><span class="finder-extension-tag">${item.short}</span><strong>${item.name}</strong></span><span class="finder-selection-mark" aria-hidden="true"></span></label>`).join('')}
            <label class="finder-option finder-unsure ${state.extensions.includes('unsure') ? 'is-selected' : ''}"><input type="checkbox" name="finder-extension" value="unsure" data-focus="extension-unsure" ${state.extensions.includes('unsure') ? 'checked' : ''}><span class="finder-option-copy"><strong>Noch unsicher</strong><span>Finden wir gemeinsam heraus.</span></span><span class="finder-selection-mark" aria-hidden="true"></span></label>
          </fieldset>`;
      } else if (step === 2) {
        body = `<p class="finder-eyebrow">03 / Ein bisschen Kontext.</p>
          <h3 class="finder-heading" tabindex="-1">Wo stehen Sie<br>mit Ihrem Projekt?</h3>
          <p class="finder-step-intro">Ein erster Gedanke reicht. Die Details entstehen im Gespräch.</p>
          <div class="finder-fields">
            <label class="finder-field">Ihr Ausgangspunkt<select name="projectType" data-focus="projectType">${Object.entries(projectNames).map(([value, label]) => `<option value="${value}" ${state.projectType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            <label class="finder-field">Wann möchten Sie starten?<select name="timing" data-focus="timing">${Object.entries(timingNames).map(([value, label]) => `<option value="${value}" ${state.timing === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            <label class="finder-field finder-field-wide">Was haben Sie vor? <span class="finder-optional">Optional</span><textarea name="description" data-focus="description" rows="5" maxlength="5000" placeholder="Ihr Unternehmen, Ihre Idee oder was im Alltag einfacher werden soll …">${escape(state.description)}</textarea></label>
          </div>`;
      } else {
        const chosen = selectedPackage(state);
        const choice = state.selectedPackage ?? recommendPackage(state.goal, state.extensions);
        const isRecommended = state.selectedPackage === null;
        const reason = choice === 'custom'
          ? (state.goal === 'sales' || state.goal === 'bookings' ? reasons[state.goal] : 'Ich kläre mit Ihnen Funktionen, Inhalte und technische Anbindungen und stelle daraus einen individuellen Umfang zusammen.')
          : chosen!.description;
        body = `<p class="finder-eyebrow">04 / Ein Vorschlag für Ihren Auftritt.</p>
          <h3 class="finder-heading" tabindex="-1">Ein erster Rahmen<br>für Ihr Vorhaben.</h3>
          <div class="finder-recommendation"><span class="finder-recommendation-label">${isRecommended ? 'Meine erste Orientierung' : 'Ihre Paketauswahl'}</span><h4>${chosen?.name ?? 'Individuellen Umfang klären'}</h4><p>${reason}</p><span class="finder-price">${chosen?.price ?? offerNotice}</span></div>
          <label class="finder-field finder-package-field">Paketwunsch selbst wählen<select name="selectedPackage" data-focus="selectedPackage"><option value="custom" ${choice === 'custom' ? 'selected' : ''}>Individuellen Umfang klären</option>${packages.map(item => `<option value="${item.id}" ${choice === item.id ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
          <p class="finder-scope-note">${scopeNotes(state)}</p>
          <p class="finder-chosen-extras"><strong>Ihre Erweiterungen</strong><span>${escape(extensionNames(state))}</span></p>
          <div class="finder-fields finder-contact"><label class="finder-field">Ihr Name <span class="finder-required">*</span><input type="text" name="name" data-focus="name" autocomplete="name" required maxlength="120" value="${escape(state.name)}" placeholder="Vor- und Nachname"></label><label class="finder-field">Ihre E-Mail <span class="finder-required">*</span><input type="email" name="email" data-focus="email" autocomplete="email" required maxlength="254" value="${escape(state.email)}" placeholder="hallo@ihr-unternehmen.de"></label></div>
          <p class="finder-privacy">* Erforderlich für Ihre Anfrage. Bis zum ausdrücklichen Versand bleiben Ihre Eingaben nur im Speicher dieser Seite. Als Nächstes prüfen Sie eine Vorschau; erst danach können Sie die Anfrage an <a href="mailto:${INQUIRY_CONTACT}">${INQUIRY_CONTACT}</a> senden. Beim Neuladen gehen die Eingaben verloren. <a href="${import.meta.env.BASE_URL}datenschutz/">Datenschutzerklärung</a></p>`;
      }

      body += `<div class="finder-actions">${step > 0 ? '<button class="finder-back" type="button" data-action="back" data-focus="back">← Zurück</button>' : '<span class="finder-time">Schritt für Schritt. Ganz unverbindlich.</span>'}<button class="finder-next" type="submit" data-focus="next">${step === 3 ? 'Anfrage prüfen' : 'Weiter'} <span aria-hidden="true">↗</span></button></div>`;
    }

    container.innerHTML = `<div class="finder"><div class="finder-topline"><span>Ihr Projektfinder</span><span>${completed ? 'Ihre Anfrage prüfen' : `${String(step + 1).padStart(2, '0')} — 04`}</span></div><ol class="finder-progress" aria-label="Fortschritt">${stepNames.map((name, index) => `<li class="${index <= step || completed ? 'is-active' : ''}" ${!completed && index === step ? 'aria-current="step"' : ''}><span class="finder-progress-number">${index < step || completed ? '✓' : `0${index + 1}`}</span><span>${name}</span></li>`).join('')}</ol><form class="finder-form" aria-busy="${Boolean(inFlight)}">${statusMarkup(key)}${body}<div hidden aria-hidden="true"><label>Dieses Feld bitte leer lassen<input type="text" name="website" tabindex="-1" autocomplete="off" value="${escape(website)}"></label></div></form></div>`;
    container.querySelector<HTMLElement>('.finder-heading')!.dataset.focus = 'heading';

    const errors = [...fieldErrors, ...(attempt?.result !== undefined && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'invalid' ? attempt.result.fields : [])];
    errors.forEach(field => {
      const selector = field === 'goal' ? '[name="finder-goal"]' : field === 'extensions' ? '[name="finder-extension"]' : `[name="${field}"]`;
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
    if (target.name === 'finder-goal') {
      update({ goal: target.value as Goal, selectedPackage: null });
      render();
    } else if (target.name === 'finder-extension' && target instanceof HTMLInputElement) {
      const previous = store.get().extensions;
      const chosen = target.value === 'unsure'
        ? (target.checked ? ['unsure'] : [])
        : target.checked
          ? [...previous.filter(id => id !== 'unsure' && id !== target.value), target.value]
          : previous.filter(id => id !== target.value);
      update({ extensions: chosen });
      render();
    } else if (target.name === 'projectType' || target.name === 'timing') {
      update({ [target.name]: target.value });
    } else if (target.name === 'selectedPackage') {
      update({ selectedPackage: target.value as PackageChoice });
      render();
    }
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (completed) return;
    website = container.querySelector<HTMLInputElement>('[name="website"]')?.value ?? website;
    const invalid = invalidInquiryFields(store.get()).filter(field => step === 3 || fieldSteps[field] === step);
    if (invalid.length) { showInvalid(invalid); return; }
    if (step < 3) {
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
    const selector = field === 'goal' ? '[name="finder-goal"]:checked' : field === 'extensions' ? '[name="finder-extension"]' : `[name="${field}"]`;
    container.querySelector<HTMLElement>(selector)?.focus();
  }

  function showInvalid(errors: InquiryField[]) {
    fieldErrors = errors;
    localIssue = 'invalid';
    completed = false;
    step = fieldSteps[errors[0]] ?? step;
    render();
    focusField(errors[0]);
  }

  async function send() {
    if (!completed || inFlight || disposed) return;
    website = container.querySelector<HTMLInputElement>('[name="website"]')?.value ?? website;
    const state = store.get();
    const invalid = invalidInquiryFields(state);
    if (invalid.length) { showInvalid(invalid); return; }
    const key = currentKey();
    let attempt = attempts.get(key);
    if (attempt && attempt.result !== 'sending' && !(attempt.result instanceof InquiryUncertain) && attempt.result.status === 'success') return;
    if (attempt && Date.now() < attempt.retryAt) { render('status'); return; }
    const requestId = attempt?.requestId ?? createInquiryId();
    if (!requestId) { localIssue = 'uuid'; render('status'); return; }
    const request: InquiryRequest = { ...state, requestId, website };
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
    } else if (action === 'fix') {
      const field = target.closest<HTMLButtonElement>('[data-field]')?.dataset.field as InquiryField;
      if (fieldSteps[field] === undefined) return;
      completed = false;
      step = fieldSteps[field]!;
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
