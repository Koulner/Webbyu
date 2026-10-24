import { extensions, goals, packages, priceDraftNotice, scopeNotice, type Goal, type PackageChoice } from './data';
import { recommendPackage, type BriefState, type BriefStore } from './state';
import './finder.css';

const stepNames = ['Ihr Ziel', 'Funktionen', 'Ihr Projekt', 'Ihre Empfehlung'];
const projectNames: Record<string, string> = { new: 'Eine neue Website', existing: 'Eine bestehende Website erneuern' };
const timingNames: Record<string, string> = { flexible: 'Zeitlich flexibel', soon: 'Möglichst bald', later: 'In den nächsten Monaten' };
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
    ['Ihr Ziel', goals.find(item => item.id === state.goal)!.label],
    ['Paketwunsch', chosen?.name ?? 'Individuellen Umfang klären'],
    ['Preisrahmen', chosen ? `${chosen.price} – ${priceDraftNotice}` : 'Eigenes Angebot nach Abstimmung'],
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

  function update(patch: Partial<BriefState>) {
    localUpdate = true;
    store.update(patch);
    localUpdate = false;
  }

  function render(focusHeading = false) {
    const state = store.get();
    const active = container.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    const focusedName = active?.dataset.focus;
    let body = '';

    if (completed) {
      body = `
        <div class="finder-complete-mark" aria-hidden="true">↗</div>
        <p class="finder-eyebrow">Ihr Projekt auf einen Blick</p>
        <h3 class="finder-heading" tabindex="-1">Ein guter Anfang.<br>Ihre Idee nimmt Form an.</h3>
        <p class="finder-step-intro">Hier ist die Zusammenfassung Ihres Vorhabens. Sie können sie kopieren oder Ihre Angaben noch einmal bearbeiten.</p>
        <div class="finder-notice" role="status"><strong>Zusammenfassung erstellt. Nichts versendet.</strong> Dies ist ein lokaler Prototyp. Ihre Angaben bleiben nur im Speicher dieser Seite und werden beim Neuladen gelöscht.</div>
        <div class="finder-summary" data-summary><dl>${summaryEntries(state).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><p>Ein Angebot entsteht nach dem Gespräch. Den endgültigen Umfang stimmen wir gemeinsam ab.</p></div>
        <div class="finder-actions finder-actions-summary"><button class="finder-back" type="button" data-action="edit">← Angaben bearbeiten</button><button class="finder-next" type="button" data-action="copy">Zusammenfassung kopieren <span aria-hidden="true">↗</span></button></div>
        <p class="finder-copy-status" role="status" aria-live="polite"></p>`;
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
          <div class="finder-recommendation"><span class="finder-recommendation-label">${isRecommended ? 'Meine erste Orientierung' : 'Ihre Paketauswahl'}</span><h4>${chosen?.name ?? 'Individuellen Umfang klären'}</h4><p>${reason}</p><span class="finder-price">${chosen ? `${chosen.price} · ${priceDraftNotice}` : 'Eigenes Angebot nach Abstimmung'}</span></div>
          <label class="finder-field finder-package-field">Paketwunsch selbst wählen<select name="selectedPackage" data-focus="selectedPackage"><option value="custom" ${choice === 'custom' ? 'selected' : ''}>Individuellen Umfang klären</option>${packages.map(item => `<option value="${item.id}" ${choice === item.id ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
          <p class="finder-scope-note">${scopeNotes(state)}</p>
          <p class="finder-chosen-extras"><strong>Ihre Erweiterungen</strong><span>${escape(extensionNames(state))}</span></p>
          <div class="finder-fields finder-contact"><label class="finder-field">Ihr Name <span class="finder-required">*</span><input type="text" name="name" data-focus="name" autocomplete="name" required maxlength="120" value="${escape(state.name)}" placeholder="Vor- und Nachname"></label><label class="finder-field">Ihre E-Mail <span class="finder-required">*</span><input type="email" name="email" data-focus="email" autocomplete="email" required maxlength="254" value="${escape(state.email)}" placeholder="hallo@ihr-unternehmen.de"></label></div>
          <p class="finder-privacy">* Erforderlich für Ihre Zusammenfassung. Dieser lokale Prototyp versendet keine Daten. Ihre Angaben bleiben nur bis zum Neuladen in dieser Seite.</p>`;
      }

      body += `<div class="finder-actions">${step > 0 ? '<button class="finder-back" type="button" data-action="back">← Zurück</button>' : '<span class="finder-time">Etwa 2 Minuten. Ganz unverbindlich.</span>'}<button class="finder-next" type="submit">${step === 3 ? 'Zusammenfassung erstellen' : 'Weiter'} <span aria-hidden="true">↗</span></button></div>`;
    }

    container.innerHTML = `<div class="finder"><div class="finder-topline"><span>Ihr Projektfinder</span><span>${completed ? 'Bereit zum Weiterdenken' : `${String(step + 1).padStart(2, '0')} — 04`}</span></div><ol class="finder-progress" aria-label="Fortschritt">${stepNames.map((name, index) => `<li class="${index <= step || completed ? 'is-active' : ''}" ${!completed && index === step ? 'aria-current="step"' : ''}><span class="finder-progress-number">${index < step || completed ? '✓' : `0${index + 1}`}</span><span>${name}</span></li>`).join('')}</ol><form class="finder-form">${body}</form></div>`;

    if (focusHeading) container.querySelector<HTMLElement>('.finder-heading')?.focus();
    else if (focusedName) container.querySelector<HTMLElement>(`[data-focus="${focusedName}"]`)?.focus({ preventScroll: true });
  }

  function onInput(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (target.name === 'name' || target.name === 'email' || target.name === 'description') {
      target.setCustomValidity('');
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
    if (step < 3) {
      step += 1;
      render(true);
      return;
    }
    const form = container.querySelector<HTMLFormElement>('form')!;
    const name = form.elements.namedItem('name') as HTMLInputElement;
    const email = form.elements.namedItem('email') as HTMLInputElement;
    if (!name.value.trim()) name.setCustomValidity('Bitte geben Sie Ihren Namen ein.');
    if (!email.value.trim()) email.setCustomValidity('Bitte geben Sie Ihre E-Mail-Adresse ein.');
    else if (!email.validity.valid) email.setCustomValidity('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
    if (!form.reportValidity()) return;
    update({ name: name.value.trim(), email: email.value.trim() });
    completed = true;
    render(true);
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
    } else if (action === 'copy') {
      const text = `Webbyu – mein Vorhaben\n\n${summaryEntries(store.get()).map(([label, value]) => `${label}: ${value}`).join('\n\n')}\n\nEin Angebot entsteht nach dem Gespräch. Lokaler Prototyp – nichts versendet.`;
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        const status = container.querySelector('.finder-copy-status');
        if (!disposed && status) status.textContent = 'Ihre Zusammenfassung wurde kopiert.';
      } catch {
        if (disposed) return;
        const summary = container.querySelector('[data-summary]');
        if (summary) {
          const range = document.createRange();
          range.selectNodeContents(summary);
          window.getSelection()?.removeAllRanges();
          window.getSelection()?.addRange(range);
        }
        const status = container.querySelector('.finder-copy-status');
        if (status) status.textContent = 'Ihre Zusammenfassung ist markiert. Kopieren Sie sie mit Strg+C oder der Kopierfunktion Ihres Geräts.';
      }
    }
  }

  container.addEventListener('input', onInput);
  container.addEventListener('change', onChange);
  container.addEventListener('submit', onSubmit);
  container.addEventListener('click', onClick);
  const unsubscribe = store.subscribe(() => { if (!localUpdate) render(); });
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
