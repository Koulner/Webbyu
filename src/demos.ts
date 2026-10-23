import type { DemoGoal } from './data';
import './demos.css';
import { saffronChapters, saffronJourneyMarkup, mountSaffronJourney } from './saffron-journey';

let instance = 0;
const arrow = '<span aria-hidden="true">↗</span>';

function architecture(id: string): string {
  return `<svg viewBox="0 0 320 380" role="img" aria-label="Abstrakte Architektur aus warmem Stein: ein Tor, eine Treppe und Sonnenlicht" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}-wall" x2="1" y2="1"><stop stop-color="#e9dfc6"/><stop offset="1" stop-color="#b7b696"/></linearGradient><linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#d4cbb0"/><stop offset="1" stop-color="#e6ddc6"/></linearGradient><linearGradient id="${id}-arch" x2="1" y2="0"><stop stop-color="#4e604e"/><stop offset="1" stop-color="#223c31"/></linearGradient></defs>
    <rect width="320" height="380" fill="url(#${id}-wall)"/><path d="M0 284 320 247V380H0Z" fill="url(#${id}-floor)"/>
    <circle cx="231" cy="83" r="51" fill="#f3ebd8" opacity=".78"/>
    <path d="M75 297V147a73 73 0 0 1 146 0v135Z" fill="#a49d80"/>
    <path d="M92 292V150a57 57 0 0 1 114 0v134Z" fill="url(#${id}-arch)"/>
    <path d="M92 292V150c0-31 25-57 57-57v192Z" fill="#50644f"/>
    <path d="m148 285 58-7 70 63-110 9Z" fill="#7d8363" opacity=".34"/>
    <path d="M92 288h88v14H92ZM77 302h103v15H77ZM62 317h118v15H62ZM47 332h133v15H47Z" fill="#e9dfc4"/>
    <path d="M180 288 220 278v15l-40 9ZM180 302l40-9v15l-40 9ZM180 317l40-9v15l-40 9ZM180 332l40-9v15l-40 9Z" fill="#9b9e7a"/>
    <path d="M47 347h133l40-9 32 20-152 13Z" fill="#7f876e" opacity=".3"/>
    <path d="M276 180V302M263 209l13 15 17-25M258 239l18 12 16-13" stroke="#465f43" stroke-width="3" fill="none"/><ellipse cx="269" cy="207" rx="7" ry="15" transform="rotate(-35 269 207)" fill="#5d7150"/><ellipse cx="288" cy="199" rx="7" ry="17" transform="rotate(31 288 199)" fill="#566a4c"/><ellipse cx="263" cy="238" rx="7" ry="16" transform="rotate(-47 263 238)" fill="#53694c"/>
    <path d="M258 287h35l-5 37h-25Z" fill="#b49772"/><path d="M0 0h320v380H0Z" fill="none" stroke="#fff" stroke-opacity=".1"/>
  </svg>`;
}

function studio(id: string): string {
  return `<svg viewBox="0 0 365 408" role="img" aria-label="Illustration eines ruhigen, sonnigen Bewegungsraums mit Yogamatte und skulpturalen Formen" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}-room" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7b59a"/><stop offset="1" stop-color="#f8dfc3"/></linearGradient><linearGradient id="${id}-ball" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d78b63"/><stop offset=".5" stop-color="#a65740"/><stop offset="1" stop-color="#6c3a31"/></linearGradient><linearGradient id="${id}-block" x1="0" x2="1"><stop stop-color="#f5d9bd"/><stop offset="1" stop-color="#bc8f72"/></linearGradient></defs>
    <rect width="365" height="408" fill="url(#${id}-room)"/>
    <path d="M223 0h142v300L223 246Z" fill="#efc9a8"/><path d="m0 297 223-51 142 54v108H0Z" fill="#c99474"/>
    <path d="M42 225V96a66 66 0 0 1 132 0v146Z" fill="#f9e9cf"/><path d="M56 229V98a52 52 0 0 1 104 0v137Z" fill="#adad8d"/><path d="M60 229V101a48 48 0 0 1 96 0v133Z" fill="#c4c3a4"/>
    <path d="M108 49v183M59 127h98" stroke="#f5e3c7" stroke-width="5"/>
    <path d="m58 229 98 4 161 105-146 31-144-65Z" fill="#ffe3ae" opacity=".61"/>
    <path d="m108 232 83 124M58 159l198 171" stroke="#be997a" stroke-width="5" opacity=".5"/>
    <ellipse cx="237" cy="331" rx="85" ry="17" fill="#734b39" opacity=".17"/>
    <path d="m69 326 129-29 96 45-136 32Z" fill="#704b49"/><path d="m69 326 89 43 136-27v5l-136 32-89-45Z" fill="#503736"/>
    <ellipse cx="232" cy="290" rx="48" ry="47" fill="url(#${id}-ball)"/>
    <path d="M202 267c12-16 38-19 54-8" fill="none" stroke="#e3a481" stroke-width="1.4" opacity=".6"/>
    <path d="M282 187h41v119h-41Z" fill="url(#${id}-block)"/><ellipse cx="302.5" cy="187" rx="20.5" ry="7" fill="#f8dfc0"/>
    <path d="M296 171c-19-16-7-37 7-45 16 16 24 31 6 45Z" fill="#86684f"/><path d="M302 174v-66M301 136c-17-5-24-17-19-29 17 4 24 13 19 29M303 121c16-7 23-19 17-29-13 7-20 16-17 29" stroke="#637052" stroke-width="2" fill="#73815b"/>
    <path d="M12 388h341" stroke="#f2c9a7" stroke-width="1" opacity=".3"/>
  </svg>`;
}

function panelFrame(title: string, content: string): string {
  return `<section class="demo-panel" hidden aria-label="${title}"><div class="demo-panel-heading"><h3>${title}</h3><button class="demo-icon-button" type="button" data-panel-close aria-label="Zurück zur Konzeptdemo">×</button></div>${content}</section>`;
}

const sessions = new WeakMap<HTMLElement, AbortController>();

function bindPanel(root: HTMLElement, signal: AbortSignal): void {
  const panel = root.querySelector<HTMLElement>('.demo-panel')!;
  const main = root.querySelector<HTMLElement>('.demo-main')!;
  let previousFocus: HTMLElement | null = null;
  let previousScroll = 0;
  let scrollOrigin: { dialog: HTMLDialogElement | null; top: number; x: number; y: number } | null = null;
  const close = () => {
    panel.hidden = true;
    main.inert = false;
    root.classList.remove('demo--panel-open');
    main.scrollTop = previousScroll;
    if (previousFocus?.isConnected && root.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
    const dialog = root.closest('dialog');
    if (scrollOrigin?.dialog === dialog) {
      if (dialog) dialog.scrollTop = scrollOrigin.top;
      else if (window.scrollX !== scrollOrigin.x || window.scrollY !== scrollOrigin.y) {
        window.scrollTo({ left: scrollOrigin.x, top: scrollOrigin.y, behavior: 'instant' });
      }
    }
  };
  const open = (event: Event) => {
    previousFocus = event.currentTarget as HTMLElement;
    previousScroll = main.scrollTop;
    const dialog = root.closest('dialog');
    scrollOrigin = { dialog, top: dialog?.scrollTop ?? 0, x: window.scrollX, y: window.scrollY };
    panel.hidden = false;
    panel.scrollTop = 0;
    main.inert = true;
    root.classList.add('demo--panel-open');
    panel.querySelector<HTMLElement>('[data-panel-close]')!.focus({ preventScroll: true });
    if (dialog) dialog.scrollTop = 0;
    else if (root.classList.contains('demo--responsive')) root.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  root.querySelectorAll('[data-panel-open]').forEach(button => button.addEventListener('click', open, { signal }));
  panel.querySelector('[data-panel-close]')!.addEventListener('click', close, { signal });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }, { signal });
}

function scrollToPanelStart(root: HTMLElement): void {
  root.querySelector<HTMLElement>('.demo-panel')!.scrollTop = 0;
  const dialog = root.closest('dialog');
  if (dialog) dialog.scrollTop = 0;
  else if (root.classList.contains('demo--responsive')) root.scrollIntoView({ block: 'start', behavior: 'instant' });
}

type SummaryRow = readonly [string, string];

function renderSummary(target: HTMLElement, rows: SummaryRow[]): void {
  target.replaceChildren();
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    target.append(row);
  }
}

function journeySteps(first: string): string {
  return `<ol class="demo-steps" aria-label="Demoablauf"><li data-step-index="edit" aria-current="step"><span>01</span>${first}</li><li data-step-index="review"><span>02</span>Prüfen</li><li data-step-index="complete"><span>03</span>Bestätigt</li></ol>`;
}

function reviewSteps(reviewTitle: string, editLabel: string): string {
  return `<section data-step="review" hidden><h4 tabindex="-1" data-review-title>${reviewTitle}</h4><dl class="demo-summary" data-summary></dl><p class="demo-privacy-note">Nur eine lokale Simulation. Es wird nichts übermittelt.</p><div class="demo-step-actions"><button class="demo-cta" type="button" data-confirm>Demo bestätigen ${arrow}</button><button class="demo-secondary" type="button" data-edit>${editLabel}</button></div></section>
    <section data-step="complete" hidden><span class="demo-complete-mark" aria-hidden="true">✓</span><h4>In der Demo bestätigt.</h4><p class="demo-result" role="status" aria-live="polite" tabindex="-1"></p><dl class="demo-summary" data-summary></dl><button class="demo-secondary" type="button" data-edit>${editLabel}</button></section>`;
}

/** Keeps the editable form mounted throughout review and confirmation. */
function bindReview(root: HTMLElement, signal: AbortSignal, summarize: () => SummaryRow[] | null, confirmation: () => string): void {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const show = (step: string) => {
    root.querySelectorAll<HTMLElement>('[data-step]').forEach(element => { element.hidden = element.dataset.step !== step; });
    root.querySelectorAll<HTMLElement>('[data-step-index]').forEach(element => {
      if (element.dataset.stepIndex === step) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
    });
    const target = step === 'review' ? root.querySelector<HTMLElement>('[data-review-title]')
      : step === 'complete' ? root.querySelector<HTMLElement>('.demo-result')
      : form.querySelector<HTMLElement>('input, select');
    target?.focus({ preventScroll: true });
    scrollToPanelStart(root);
  };
  const edit = () => {
    root.querySelector('.demo-result')!.textContent = '';
    show('edit');
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const rows = summarize();
    if (!rows) return;
    root.querySelectorAll<HTMLElement>('[data-summary]').forEach(target => renderSummary(target, rows));
    show('review');
  }, { signal });
  root.querySelector('[data-confirm]')!.addEventListener('click', () => {
    root.querySelector('.demo-result')!.textContent = confirmation();
    show('complete');
  }, { signal });
  root.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', edit, { signal }));
}

function inquiryDemo(root: HTMLElement, id: string, signal: AbortSignal): void {
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Klarraum Konzeptnavigation"><span class="demo-logo">klarraum<span class="demo-logo-dot" aria-hidden="true">•</span></span><span class="demo-nav-note">Beratung mit Weitblick.</span><button class="demo-nav-link" data-panel-open type="button">Sprechen wir ${arrow}</button></nav>
    <div class="demo-editorial"><div class="demo-editorial-copy"><p class="demo-eyebrow">Strategie & Entwicklung</p><h2>Raum für<br>das nächste<br><em>Kapitel.</em></h2><p>Neue Perspektiven. Klare Entscheidungen. Für Unternehmen im Wandel.</p><button class="demo-cta" data-panel-open type="button">Ins Gespräch kommen ${arrow}</button><span class="demo-caption">Zuhören. Ordnen. Weiterdenken.</span></div><div class="demo-architecture">${architecture(id)}<span class="demo-art-caption">Ein Blickwechsel schafft Raum.</span></div></div>
    <footer class="demo-footer"><span>Weniger Komplexität. Mehr Klarheit.</span><span>Konzeptdemo · keine echte Anfrage</span></footer>
    </div>${panelFrame('Ein guter Anfang: ein Gespräch.', `<p class="demo-panel-intro">Skizzieren Sie Ihr Anliegen. Prüfen und bearbeiten Sie Ihren Entwurf, bevor Sie ihn in der Demo bestätigen.</p>${journeySteps('Anliegen')}
    <form class="demo-inquiry-form" data-step="edit" novalidate>
      <p class="demo-required-note">Name und E-Mail sind Pflichtfelder. Beispieldaten genügen.</p>
      <div class="demo-form-pair"><label for="${id}-name">Ihr Name<input id="${id}-name" name="name" autocomplete="off" required placeholder="Alex Beispiel" maxlength="100" aria-describedby="${id}-name-error"><span class="demo-field-error" id="${id}-name-error" data-error-for="name"></span></label><label for="${id}-email">E-Mail<input id="${id}-email" name="email" type="email" autocomplete="off" required placeholder="alex@beispiel.de" maxlength="200" aria-describedby="${id}-email-error"><span class="demo-field-error" id="${id}-email-error" data-error-for="email"></span></label></div>
      <label>Was beschäftigt Sie?<select name="topic"><option>Strategie & Orientierung</option><option>Positionierung & Marke</option><option>Veränderung begleiten</option></select></label>
      <label>Ihr Vorhaben (optional)<textarea name="project" rows="3" placeholder="Was soll sich verändern?" maxlength="1000" aria-describedby="${id}-project-error"></textarea><span class="demo-field-error" id="${id}-project-error" data-error-for="project"></span></label>
      <p class="demo-validation" role="alert"></p><button class="demo-cta" type="submit">Anfrageentwurf prüfen ${arrow}</button><p class="demo-privacy-note">Ihre Eingaben bleiben nur in dieser Sitzung. Es wird nichts gespeichert oder versendet.</p>
    </form>${reviewSteps('Ihr Anfrageentwurf', 'Anliegen bearbeiten')}`)}`;
  bindPanel(root, signal);
  const form = root.querySelector<HTMLFormElement>('form')!;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
  const errors = root.querySelector<HTMLElement>('.demo-validation')!;
  const validate = (name: string): boolean => {
    const input = field(name);
    input.setCustomValidity('');
    let message = '';
    if (name === 'name' && !input.value.trim()) message = 'Bitte geben Sie einen Namen ein.';
    if (name === 'email' && (!input.value.trim() || input.validity.typeMismatch)) message = 'Bitte geben Sie eine E-Mail wie alex@beispiel.de ein.';
    if (input.value.length > input.maxLength) message = `Bitte verwenden Sie höchstens ${input.maxLength} Zeichen.`;
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    root.querySelector(`[data-error-for="${name}"]`)!.textContent = message;
    return !message;
  };
  form.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (['name', 'email', 'project'].includes(input.name) && input.hasAttribute('aria-invalid')) validate(input.name);
    errors.textContent = '';
  }, { signal });
  bindReview(root, signal, () => {
    const invalid = ['name', 'email', 'project'].filter(name => !validate(name));
    if (invalid.length) {
      errors.textContent = 'Bitte prüfen Sie die markierten Felder. Ihr Entwurf bleibt erhalten.';
      field(invalid[0]).focus();
      return null;
    }
    return [['Name', field('name').value.trim()], ['E-Mail', field('email').value.trim()], ['Thema', field('topic').value], ['Vorhaben', field('project').value.trim() || 'Noch offen – im Gespräch klären.']];
  }, () => `${field('name').value.trim()}, Ihr Entwurf ist in dieser Sitzung bestätigt. Ihre Anfrage wurde nicht versendet. In einem echten Anfrageweg würden Sie jetzt eine Eingangsbestätigung erhalten.`);
}

const courseDetails = {
  Pilates: { duration: 60, price: 22, description: 'Stabilität & Körpergefühl · mit Lea', slots: [['09:00', '12:30', '18:00'], ['12:30'], ['09:00', '18:00'], []] },
  'Yoga Flow': { duration: 60, price: 20, description: 'Fließende Bewegung · mit Mira', slots: [['09:00', '18:00'], [], ['12:30', '18:00'], ['09:00', '18:00']] },
  'Slow Stretch': { duration: 45, price: 16, description: 'Sanfte Mobilität · mit Noah', slots: [['12:30'], ['09:00', '18:00'], [], ['12:30', '18:00']] },
};
const bookingDays = ['Montag, 19. Oktober', 'Dienstag, 20. Oktober', 'Mittwoch, 21. Oktober', 'Donnerstag, 22. Oktober'];
const currency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

function bookingDemo(root: HTMLElement, id: string, signal: AbortSignal): void {
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Studio Still Konzeptnavigation"><span class="demo-logo">still<span class="demo-studio-mark" aria-hidden="true">✳</span><small>STUDIO FÜR BEWEGUNG</small></span><span class="demo-nav-note">Ein guter Ort für Sie.</span><button class="demo-nav-link" data-panel-open type="button">Kurs finden ${arrow}</button></nav>
    <div class="demo-studio-hero"><div class="demo-studio-copy"><p class="demo-eyebrow">Weniger müssen. Mehr spüren.</p><h2>Ganz bei<br><em>sich.</em></h2><p>Bewegung, die gut tut.<br>Raum, der Ihnen gehört.</p><button class="demo-cta" data-panel-open type="button">Ihren Moment finden ${arrow}</button><span class="demo-caption">Pilates & Yoga · Kleine Gruppen</span></div><div class="demo-studio-art">${studio(id)}<span class="demo-studio-seal">RAUM<br>FÜR SIE<span aria-hidden="true">↗</span></span></div></div>
    <footer class="demo-footer"><span>Einatmen. Ankommen. Aufblühen.</span><span>Konzeptdemo · keine echte Buchung</span></footer>
    </div>${panelFrame('Ein Moment, nur für Sie.', `<p class="demo-panel-intro">Wählen Sie Ihre Bewegung und einen passenden Termin. Die Beispielwoche bleibt in dieser Demo bewusst unverändert.</p>${journeySteps('Termin')}
    <form class="demo-booking-form" data-step="edit" novalidate><label>Ihre Bewegung<select name="service">${Object.entries(courseDetails).map(([name, course]) => `<option value="${name}">${name} · ${course.duration} Minuten</option>`).join('')}</select></label><p class="demo-course-detail" data-course-detail></p>
    <fieldset><legend>Ihr Tag <span>· Beispielwoche, Oktober 2026</span></legend><div class="demo-day-options">${bookingDays.map((day, index) => `<button type="button" data-day="${day}" aria-pressed="${index === 0}" aria-label="${day} 2026"><small>${['MO', 'DI', 'MI', 'DO'][index]}</small><strong>${19 + index}</strong></button>`).join('')}</div></fieldset>
    <fieldset><legend>Ihre Zeit <span>· Ortszeit Berlin</span></legend><div class="demo-time-options">${['09:00', '12:30', '18:00'].map(time => `<button type="button" data-time="${time}" aria-pressed="false">${time}</button>`).join('')}</div><p class="demo-availability" role="status" aria-live="polite"></p></fieldset>
    <p class="demo-validation" role="alert"></p><button class="demo-cta" type="submit">Termin prüfen ${arrow}</button><p class="demo-privacy-note">Beispieltermine und Demopreise. Es wird kein Platz reserviert und nichts bezahlt.</p></form>${reviewSteps('Ihr ausgewählter Moment', 'Termin ändern')}`)}`;
  bindPanel(root, signal);
  const form = root.querySelector<HTMLFormElement>('form')!;
  const service = form.elements.namedItem('service') as HTMLSelectElement;
  let day = 0;
  let time: string | null = '09:00';
  const course = () => courseDetails[service.value as keyof typeof courseDetails];
  const availability = root.querySelector<HTMLElement>('.demo-availability')!;
  const validation = root.querySelector<HTMLElement>('.demo-validation')!;
  const update = () => {
    const current = course();
    const slots = current.slots[day];
    if (time && !slots.includes(time)) time = null;
    root.querySelector('[data-course-detail]')!.textContent = `${current.description} · ${current.duration} Min. · ${currency(current.price)} Demopreis`;
    root.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button => {
      const available = slots.includes(button.dataset.time!);
      button.disabled = !available;
      button.setAttribute('aria-pressed', String(time === button.dataset.time));
      button.setAttribute('aria-label', `${button.dataset.time} Uhr${available ? '' : ' · nicht verfügbar'}`);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-day]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === day)));
    availability.textContent = !slots.length ? 'Für diesen Kurs gibt es an diesem Tag keinen Beispieltermin. Wählen Sie einen anderen Tag.' : time ? `${time} Uhr ausgewählt · ${slots.length} Beispieltermine an diesem Tag.` : 'Bitte wählen Sie eine der verfügbaren Zeiten. Ihre bisherige Zeit passt nicht zu dieser Auswahl.';
    validation.textContent = '';
  };
  service.addEventListener('change', update, { signal });
  root.querySelectorAll<HTMLButtonElement>('[data-day]').forEach((button, index) => button.addEventListener('click', () => { day = index; update(); }, { signal }));
  root.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button => button.addEventListener('click', () => { time = button.dataset.time!; update(); }, { signal }));
  bindReview(root, signal, () => {
    if (!time || !course().slots[day].includes(time)) {
      validation.textContent = 'Wählen Sie einen Tag mit verfügbarem Termin und anschließend eine Uhrzeit.';
      root.querySelector<HTMLElement>('[data-time]:not(:disabled)')?.focus();
      if (!course().slots[day].length) root.querySelector<HTMLElement>('[data-day][aria-pressed="true"]')?.focus();
      return null;
    }
    return [['Kurs', `${service.value} · ${course().duration} Minuten`], ['Tag', `${bookingDays[day]} 2026`], ['Beginn', `${time} Uhr · Berlin`], ['Ort', 'Studio Still · fiktiver Bewegungsraum'], ['Demopreis', `${currency(course().price)} für eine Person`]];
  }, () => `Ihre Demo-Auswahl: ${service.value} am ${bookingDays[day]} um ${time} Uhr. Kein echter Termin wurde gebucht. Sie können den Termin weiter ändern; es entstehen keine Kosten.`);
  update();
}

function salesDemo(root: HTMLElement, id: string, signal: AbortSignal): void {
  const variants = [
    { name: '0,5 g', label: 'Probierglas', price: 9, grams: .5, color: '#b14b3d' },
    { name: '1 g', label: 'Küchenglas', price: 16, grams: 1, color: '#776a4a' },
    { name: '3 × 1 g', label: 'Geschenkset', price: 42, grams: 3, color: '#79648c' },
  ];
  const botanicalScenes = saffronChapters;
  let variant = 0;
  const cart = new Map<number, number>();
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Safran Atelier Konzeptnavigation"><span class="demo-logo">safran<span>ATELIER</span></span><button class="demo-nav-link" data-product-open type="button">Kollektion ${arrow}</button><button class="demo-nav-link" data-panel-open type="button">Tasche <span data-cart-count>(0)</span> ${arrow}</button></nav>
    <div class="demo-spice-hero"><div class="demo-spice-hero-copy"><p class="demo-eyebrow">Botanik trifft Genuss.</p><h2>Ein kleiner Faden.<br><em>Ein großer Moment.</em></h2><p>Entdecken Sie die leise Schönheit einer besonderen Zutat. Von der Blüte bis in Ihre Küche.</p><div class="demo-spice-hero-actions"><button class="demo-cta" data-journey-open type="button">Kamerafahrt entdecken <span aria-hidden="true">↓</span></button><button class="demo-nav-link" data-product-open type="button">Zur Kollektion ${arrow}</button></div><span class="demo-caption">Fiktive Marke · Lokale Shopdemo</span></div></div>
    ${saffronJourneyMarkup(id)}
    <section class="demo-spice-product" aria-label="Safran-Kollektion" tabindex="-1"><div class="demo-spice-product-art"><img src="${botanicalScenes[2].image}" alt="Rote Safranfäden als unmarkierte Produktillustration" width="960" height="628" loading="lazy"><span>Die Kollektion<br>Safran Atelier</span></div><div class="demo-spice-product-copy"><p class="demo-eyebrow">Für kleine Genussmomente</p><h3>Safranfäden.<br><em>Ganz nach Ihrem Maß.</em></h3><p>Ein Probierglas, ein Vorrat für die Küche oder ein Set zum Verschenken. Finden Sie Ihre Größe.</p><div class="demo-product-spec"><strong><span data-product-price>9 €</span> <small>Demopreis / Packung</small></strong><span data-unit-price>18 € / g · fiktiver Grundpreis</span></div><fieldset class="demo-variants"><legend>Größe: <span data-variant-name>0,5 g</span></legend><div>${variants.map((item, index) => `<button type="button" data-variant="${index}" aria-pressed="${index === 0}" aria-label="${item.label}, ${item.name}"><strong>${item.name}</strong><span>${item.label}</span></button>`).join('')}</div></fieldset><div class="demo-product-purchase"><label>Menge<input name="quantity" type="number" min="1" max="99" step="1" value="1" inputmode="numeric" aria-describedby="${id}-quantity-error"></label><button class="demo-cta" type="button" data-add-cart>In die Demo-Tasche ${arrow}</button></div><p id="${id}-quantity-error" class="demo-shop-status" role="status" aria-live="polite"></p><button type="button" class="demo-secondary demo-shop-cart-link" data-panel-open data-cart-open-inline hidden>Demo-Tasche ansehen ${arrow}</button><details class="demo-product-details"><summary>Was zeigt dieses Beispiel?</summary><p>Eine anonymisierte Produktpräsentation mit frei erfundenen Größen und Preisen. Die Bilder zeigen botanische Details. Die Demo enthält keine reale Herkunftszusage, Zertifizierung oder Kaufmöglichkeit.</p></details></div></section>
    <section class="demo-spice-ritual" aria-label="Inspiration für die Küche"><p class="demo-eyebrow">Ein kleines Ritual</p><h3>Ein Hauch von <em>besonders.</em></h3><div><p><span>01 / ENTDECKEN</span>Eine Prise Farbe für Reis, Saucen oder Desserts.</p><p><span>02 / AUSWÄHLEN</span>Die passende Größe für Ihre nächste Küchenidee.</p><p><span>03 / AUSPROBIEREN</span>Den Einkaufsweg hier ganz ohne Bestellung erleben.</p></div></section>
    <footer class="demo-footer"><span>Safran Atelier · Fiktives Konzept</span><span>Anonymisierte Demo · kein echter Kauf</span></footer>
    </div>${panelFrame('Ihre Demo-Tasche.', `<p class="demo-panel-intro">Größen kombinieren, Mengen ändern, Bestellung durchspielen.</p>${journeySteps('Tasche')}<section data-step="edit"><div class="demo-cart-items"></div><div class="demo-cart-total"><span>Zwischensumme</span><strong data-cart-total>0 €</strong></div><p class="demo-privacy-note">Alle Preise sind erfundene Demopreise, einschließlich beispielhafter MwSt. Die Lieferoption wählen Sie im nächsten Schritt.</p><div class="demo-step-actions"><button type="button" class="demo-cta" data-checkout>Bestellübersicht ${arrow}</button></div><p class="demo-cart-status" role="status" aria-live="polite"></p></section>
    <section data-step="review" hidden><h4 tabindex="-1" data-review-title>Ihre Bestellübersicht</h4><dl class="demo-summary" data-order-items></dl><label class="demo-shipping-label">Lieferoption<select name="shipping"><option value="delivery">Standardversand · 4 €</option><option value="pickup">Abholung im Beispielatelier · 0 €</option></select></label><p class="demo-shipping-note"></p><dl class="demo-summary demo-order-totals" data-order-totals></dl><p class="demo-privacy-note">Nur eine Simulation: keine Adress- oder Zahlungsdaten, keine Bestellung.</p><div class="demo-step-actions"><button type="button" class="demo-cta" data-order-confirm>Kauf lokal simulieren ${arrow}</button><button type="button" class="demo-secondary" data-cart-edit>Tasche bearbeiten</button></div></section>
    <section data-step="complete" hidden><span class="demo-complete-mark" aria-hidden="true">✓</span><h4>Ihr Demokauf ist durchgespielt.</h4><p class="demo-result" role="status" aria-live="polite" tabindex="-1"></p><dl class="demo-summary" data-order-receipt></dl><p class="demo-privacy-note">Es wurde nichts bestellt, bezahlt oder versendet. Ihre Tasche bleibt zum Weiterprobieren erhalten.</p><button type="button" class="demo-secondary" data-cart-edit>Tasche weiter bearbeiten</button></section>`)} `;
  bindPanel(root, signal);
  mountSaffronJourney(root, signal);
  root.querySelectorAll('[data-product-open]').forEach(button => button.addEventListener('click', () => {
    const product = root.querySelector<HTMLElement>('.demo-spice-product')!;
    product.focus({ preventScroll: true });
    if (root.classList.contains('demo--responsive')) product.scrollIntoView({ block: 'start', behavior: 'instant' });
    else root.querySelector<HTMLElement>('.demo-main')!.scrollTop = product.offsetTop - 88;
  }, { signal }));
  const quantityInput = root.querySelector<HTMLInputElement>('[name="quantity"]')!;
  const shipping = root.querySelector<HTMLSelectElement>('[name="shipping"]')!;
  const shopStatus = root.querySelector<HTMLElement>('.demo-shop-status')!;
  const cartStatus = root.querySelector<HTMLElement>('.demo-cart-status')!;
  const amount = () => [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = () => [...cart].reduce((sum, [key, quantity]) => sum + variants[key].price * quantity, 0);
  const showStep = (step: string, moveFocus = true) => {
    root.querySelectorAll<HTMLElement>('[data-step]').forEach(element => { element.hidden = element.dataset.step !== step; });
    root.querySelectorAll<HTMLElement>('[data-step-index]').forEach(element => {
      if (element.dataset.stepIndex === step) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
    });
    if (moveFocus) {
      const target = step === 'review' ? '[data-review-title]' : step === 'complete' ? '.demo-result' : '.demo-cart-line button, [data-panel-close]';
      root.querySelector<HTMLElement>(target)?.focus({ preventScroll: true });
      scrollToPanelStart(root);
    }
  };
  const cartRows = (): SummaryRow[] => [...cart].map(([key, quantity]) => [`${quantity} × Safran · ${variants[key].name}`, currency(quantity * variants[key].price)]);
  const totalRows = (): SummaryRow[] => [['Zwischensumme', currency(subtotal())], [shipping.value === 'pickup' ? 'Abholung' : 'Standardversand', currency(shipping.value === 'pickup' ? 0 : 4)], ['Gesamt · Demobetrag', currency(subtotal() + (shipping.value === 'pickup' ? 0 : 4))]];
  const updateOrder = () => {
    renderSummary(root.querySelector('[data-order-items]')!, cartRows());
    renderSummary(root.querySelector('[data-order-totals]')!, totalRows());
    root.querySelector('.demo-shipping-note')!.textContent = shipping.value === 'pickup' ? 'Beispiel: ab dem nächsten Werktag im Beispielatelier abholbereit.' : 'Beispiel: Lieferung in 3–5 Werktagen innerhalb Deutschlands.';
  };
  const focusCartControl = (key: number, selector: string) => {
    const target = root.querySelector<HTMLElement>(`[data-cart-variant="${key}"] ${selector}`)
      ?? root.querySelector<HTMLElement>(`.demo-cart-line ${selector}`)
      ?? root.querySelector<HTMLElement>('[data-panel-close]');
    target?.focus({ preventScroll: true });
  };
  const updateCart = () => {
    root.querySelector('[data-cart-count]')!.textContent = `(${amount()})`;
    root.querySelector('[data-cart-total]')!.textContent = currency(subtotal());
    root.querySelector<HTMLButtonElement>('[data-checkout]')!.disabled = !amount();
    root.querySelector<HTMLElement>('[data-cart-open-inline]')!.hidden = !amount();
    const items = root.querySelector<HTMLElement>('.demo-cart-items')!;
    items.innerHTML = !amount() ? '<p class="demo-cart-empty">Ihre Tasche ist noch leer.</p><p>Zurück zur Kollektion: Größe und Menge wählen, dann in die Demo-Tasche legen.</p>' : '';
    for (const [key, quantity] of cart) {
      const line = document.createElement('div');
      line.className = 'demo-cart-line';
      line.dataset.cartVariant = String(key);
      line.innerHTML = `<span class="demo-cart-swatch" style="--swatch:${variants[key].color}" aria-hidden="true"></span><div class="demo-cart-title"><strong>Safran · ${variants[key].name}</strong><small>${currency(variants[key].price)} / Packung</small></div><div class="demo-cart-quantity"><button type="button" data-less aria-label="Eine Packung ${variants[key].name} weniger">−</button><span aria-label="Menge">${quantity}</span><button type="button" data-more aria-label="Eine Packung ${variants[key].name} mehr">+</button></div><strong class="demo-cart-line-total">${currency(quantity * variants[key].price)}</strong><button class="demo-cart-remove" type="button" aria-label="Safran ${variants[key].name} entfernen">Entfernen</button>`;
      items.append(line);
    }
    cartStatus.textContent = `${amount()} ${amount() === 1 ? 'Packung' : 'Packungen'} in Ihrer Demo-Tasche.`;
  };
  // Delegation keeps cart re-renders free of retained listeners.
  root.querySelector('.demo-cart-items')!.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    const line = button?.closest<HTMLElement>('[data-cart-variant]');
    if (!button || !line) return;
    const key = Number(line.dataset.cartVariant);
    const quantity = cart.get(key)!;
    const selector = button.hasAttribute('data-less') ? '[data-less]' : button.hasAttribute('data-more') ? '[data-more]' : '.demo-cart-remove';
    if (selector === '.demo-cart-remove' || (selector === '[data-less]' && quantity === 1)) cart.delete(key);
    else cart.set(key, Math.min(99, quantity + (selector === '[data-less]' ? -1 : 1)));
    updateCart();
    focusCartControl(key, selector);
    if (selector === '[data-more]' && quantity === 99) cartStatus.textContent = 'Maximal 99 Packungen je Größe in dieser Demo.';
  }, { signal });
  root.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach(button => button.addEventListener('click', () => {
    variant = Number(button.dataset.variant);
    root.querySelector('[data-product-price]')!.textContent = currency(variants[variant].price);
    root.querySelector('[data-unit-price]')!.textContent = `${currency(variants[variant].price / variants[variant].grams)} / g · fiktiver Grundpreis`;
    root.querySelector('[data-variant-name]')!.textContent = variants[variant].name;
    root.querySelectorAll('[data-variant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    shopStatus.textContent = '';
  }, { signal }));
  root.querySelector('[data-add-cart]')!.addEventListener('click', () => {
    const quantity = quantityInput.valueAsNumber;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      quantityInput.setAttribute('aria-invalid', 'true');
      shopStatus.textContent = 'Bitte wählen Sie eine ganze Menge von 1 bis 99.';
      quantityInput.focus();
      return;
    }
    quantityInput.setAttribute('aria-invalid', 'false');
    const current = cart.get(variant) ?? 0;
    const added = Math.min(quantity, 99 - current);
    cart.set(variant, current + added);
    updateCart();
    showStep('edit', false);
    root.querySelector('.demo-result')!.textContent = '';
    shopStatus.textContent = added < quantity ? `${added} hinzugefügt. Maximal 99 Packungen je Größe in dieser Demo.` : `${quantity} × Safran (${variants[variant].name}) liegt in Ihrer Demo-Tasche.`;
  }, { signal });
  root.querySelector('[data-checkout]')!.addEventListener('click', () => { if (amount()) { updateOrder(); showStep('review'); } }, { signal });
  shipping.addEventListener('change', updateOrder, { signal });
  root.querySelector('[data-order-confirm]')!.addEventListener('click', () => {
    if (!amount()) return;
    renderSummary(root.querySelector('[data-order-receipt]')!, [...cartRows(), ...totalRows()]);
    root.querySelector('.demo-result')!.textContent = `${amount()} ${amount() === 1 ? 'Packung' : 'Packungen'} · ${shipping.value === 'pickup' ? 'Abholung' : 'Standardversand'} · ${currency(subtotal() + (shipping.value === 'pickup' ? 0 : 4))} Demobetrag. Lokal simuliert.`;
    showStep('complete');
  }, { signal });
  root.querySelectorAll('[data-cart-edit]').forEach(button => button.addEventListener('click', () => {
    root.querySelector('.demo-result')!.textContent = '';
    showStep('edit');
  }, { signal }));
  updateCart();
}

/** A self-contained concept site; fixed dimensions match the scene's 5:4 display. */
export function createDemo(goal: DemoGoal, options: { interactive?: boolean } = {}): HTMLElement {
  const root = document.createElement('div');
  const id = `concept-${++instance}`;
  const controller = new AbortController();
  sessions.set(root, controller);
  root.className = `demo demo--${goal}`;
  root.dataset.demo = goal;
  if (goal === 'inquiries') inquiryDemo(root, id, controller.signal);
  else if (goal === 'bookings') bookingDemo(root, id, controller.signal);
  else salesDemo(root, id, controller.signal);
  if (options.interactive === false) {
    controller.abort();
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    root.classList.add('demo--preview');
  }
  return root;
}

/** Releases event handlers even if a caller retains a detached session node. */
export function disposeDemo(root: HTMLElement): void {
  sessions.get(root)?.abort();
  sessions.delete(root);
  root.remove();
}

/** Presents an existing live session; creation and caching belong to the catalogue. */
export function mountDemoDialog(options: { onRestore?: () => void } = {}): {
  open(goal: DemoGoal, demoElement: HTMLElement): void;
  close(): void;
  dispose(): void;
} {
  const names: Record<DemoGoal, string> = { inquiries: 'Klarraum', bookings: 'Studio Still', sales: 'Safran Atelier' };
  const dialog = document.createElement('dialog');
  const events = new AbortController();
  dialog.className = 'concept-dialog';
  dialog.innerHTML = '<div class="concept-dialog-bar"><div><span>FIKTIVES KONZEPT VON WEBBYU</span><strong data-dialog-title></strong></div><button type="button" class="concept-dialog-close" aria-label="Konzeptdemo schließen">Schließen <span aria-hidden="true">×</span></button></div><div class="concept-dialog-body"></div>';
  document.body.append(dialog);
  let previousFocus: HTMLElement | null = null;
  let oldOverflow = '';
  let oldScroll = { x: 0, y: 0 };
  let locked = false;
  let disposed = false;
  let active: { demo: HTMLElement; placeholder: Comment; responsive: boolean } | null = null;
  const restore = () => {
    if (active) {
      const { demo, placeholder, responsive } = active;
      active = null;
      demo.classList.toggle('demo--responsive', responsive);
      placeholder.replaceWith(demo);
      options.onRestore?.();
    }
    if (locked) document.body.style.overflow = oldOverflow;
    if (locked) {
      locked = false;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      if (window.scrollX !== oldScroll.x || window.scrollY !== oldScroll.y) {
        window.scrollTo({ left: oldScroll.x, top: oldScroll.y, behavior: 'instant' });
      }
      previousFocus = null;
    }
  };
  const close = () => {
    if (dialog.open) dialog.close();
    // Native close events are queued. Restore now so subsequent selections
    // cannot be overwritten by a delayed return of the previous session.
    restore();
  };
  dialog.querySelector('.concept-dialog-close')!.addEventListener('click', close, { signal: events.signal });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    const panelClose = dialog.querySelector<HTMLButtonElement>('.demo-panel:not([hidden]) [data-panel-close]');
    if (panelClose) panelClose.click();
    else close();
  }, { signal: events.signal });
  dialog.addEventListener('close', () => {
    // Ignore an earlier queued close event if a new session is already open.
    if (!dialog.open) restore();
  }, { signal: events.signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }, { signal: events.signal });
  return {
    open(goal, demoElement) {
      if (disposed) return;
      if (active?.demo !== demoElement) {
        close();
        const placeholder = document.createComment('Live demo returns here after the dialog closes.');
        demoElement.before(placeholder);
        active = { demo: demoElement, placeholder, responsive: demoElement.classList.contains('demo--responsive') };
        demoElement.classList.add('demo--responsive');
        dialog.querySelector('.concept-dialog-body')!.replaceChildren(demoElement);
      }
      dialog.querySelector('[data-dialog-title]')!.textContent = names[goal];
      dialog.setAttribute('aria-label', `Interaktive Konzeptdemo: ${names[goal]}`);
      if (!dialog.open) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        oldOverflow = document.body.style.overflow;
        oldScroll = { x: window.scrollX, y: window.scrollY };
        document.body.style.overflow = 'hidden';
        locked = true;
        try {
          dialog.showModal();
        } catch (error) {
          restore();
          throw error;
        }
      }
      dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.focus({ preventScroll: true });
      dialog.scrollTop = 0;
    },
    close,
    dispose() {
      if (disposed) return;
      disposed = true;
      close();
      events.abort();
      dialog.remove();
    },
  };
}
