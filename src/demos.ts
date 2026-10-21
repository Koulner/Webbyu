import type { DemoGoal } from './data';
import './demos.css';

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

function lamp(id: string): string {
  return `<svg viewBox="0 0 350 390" role="img" aria-label="Skulpturale Tischlampe Luma mit pilzförmigem Schirm" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#fff" stop-opacity=".6"/><stop offset=".33" stop-color="#fff" stop-opacity=".1"/><stop offset=".75" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient><linearGradient id="${id}-stem" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient><filter id="${id}-shadow"><feGaussianBlur stdDeviation="7"/></filter></defs>
    <ellipse cx="191" cy="334" rx="96" ry="15" fill="#5c549a" opacity=".18" filter="url(#${id}-shadow)"/>
    <path d="M180 321c37 3 49 8 65 3 18-6 11-21 30-27 12-4 23-1 35 1" stroke="#666077" stroke-width="2" fill="none"/>
    <path d="M157 176h42l10 143c1 13-61 13-60 0Z" fill="var(--lamp-color)"/><path d="M157 176h42l10 143c1 13-61 13-60 0Z" fill="url(#${id}-stem)"/>
    <ellipse cx="179" cy="318" rx="30" ry="9" fill="var(--lamp-color)"/>
    <path d="M68 185c0-65 43-112 111-112s111 47 111 112Z" fill="var(--lamp-color)"/><path d="M68 185c0-65 43-112 111-112s111 47 111 112Z" fill="url(#${id}-shade)"/>
    <ellipse cx="179" cy="185" rx="111" ry="15" fill="var(--lamp-color)"/><ellipse cx="179" cy="185" rx="107" ry="11" fill="#433020" opacity=".22"/><ellipse cx="179" cy="183" rx="88" ry="7" fill="#fff1c8" opacity=".92"/>
    <path d="M91 154c10-35 40-59 72-64" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function panelFrame(title: string, content: string): string {
  return `<section class="demo-panel" hidden aria-label="${title}"><div class="demo-panel-heading"><h3>${title}</h3><button class="demo-icon-button" type="button" data-panel-close aria-label="Zurück zur Konzeptdemo">×</button></div>${content}</section>`;
}

function bindPanel(root: HTMLElement): { open: () => void; close: () => void } {
  const panel = root.querySelector<HTMLElement>('.demo-panel')!;
  const main = root.querySelector<HTMLElement>('.demo-main')!;
  let previousFocus: HTMLElement | null = null;
  const close = () => {
    panel.hidden = true;
    main.inert = false;
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
  const open = () => {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    panel.scrollTop = 0;
    main.inert = true;
    panel.querySelector<HTMLElement>('[data-panel-close]')?.focus({ preventScroll: true });
    const dialog = root.closest('dialog');
    if (dialog) dialog.scrollTop = 0;
    else if (root.classList.contains('demo--responsive')) {
      root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  };
  root.querySelectorAll('[data-panel-open]').forEach((button) => button.addEventListener('click', open));
  panel.querySelector('[data-panel-close]')!.addEventListener('click', close);
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  });
  return { open, close };
}

function inquiryDemo(root: HTMLElement, id: string): void {
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Klarraum Konzeptnavigation"><span class="demo-logo">klarraum<span class="demo-logo-dot" aria-hidden="true">•</span></span><span class="demo-nav-note">Beratung, die weiterdenkt.</span><button class="demo-nav-link" data-panel-open type="button">Sprechen wir ${arrow}</button></nav>
    <div class="demo-editorial"><div class="demo-editorial-copy"><p class="demo-eyebrow">Perspektive verändert alles.</p><h2>Raum für<br>das nächste<br><em>Kapitel.</em></h2><p>Neue Perspektiven. Klare Entscheidungen.<br>Für Unternehmen, die etwas bewegen.</p><button class="demo-cta" data-panel-open type="button">Ins Gespräch kommen ${arrow}</button><span class="demo-caption">Strategie · Positionierung · Entwicklung</span></div><div class="demo-architecture">${architecture(id)}<span class="demo-art-caption">Neue Wege beginnen mit einem Blickwechsel.</span></div></div>
    <footer class="demo-footer"><span>Weniger Komplexität. Mehr Klarheit.</span><span>Konzeptdemo · keine echte Anfrage</span></footer>
    </div>${panelFrame('Ein guter Anfang: ein Gespräch.', `<p class="demo-panel-intro">Worum geht es bei Ihnen? Probieren Sie den Anfrageweg aus.</p><form class="demo-inquiry-form"><div class="demo-form-pair"><label>Ihr Name<input name="name" autocomplete="name" required placeholder="Name" maxlength="100"></label><label>E-Mail<input name="email" type="email" autocomplete="email" required placeholder="name@unternehmen.de" maxlength="200"></label></div><label>Ihr Vorhaben <span>(optional)</span><textarea name="project" rows="2" placeholder="Was möchten Sie bewegen?" maxlength="1000"></textarea></label><button class="demo-cta" type="submit">Demo-Anfrage ansehen ${arrow}</button><p class="demo-privacy-note">Dies ist eine Konzeptdemo. Ihre Eingaben bleiben in dieser Ansicht. Es wird nichts versendet.</p><p class="demo-result" role="status" aria-live="polite"></p></form>`)} `;
  bindPanel(root);
  const form = root.querySelector<HTMLFormElement>('form')!;
  const nameInput = form.elements.namedItem('name') as HTMLInputElement;
  nameInput.addEventListener('input', () => {
    nameInput.setCustomValidity(nameInput.value && !nameInput.value.trim() ? 'Bitte geben Sie Ihren Namen ein.' : '');
    root.querySelector('.demo-result')!.textContent = '';
  });
  form.addEventListener('input', () => { root.querySelector('.demo-result')!.textContent = ''; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    nameInput.setCustomValidity(!nameInput.value.trim() ? 'Bitte geben Sie Ihren Namen ein.' : '');
    if (!form.reportValidity()) return;
    const name = nameInput.value.trim();
    const result = root.querySelector<HTMLElement>('.demo-result')!;
    result.textContent = `${name}, so könnte der erste Schritt aussehen. Demo abgeschlossen – Ihre Anfrage wurde nicht versendet.`;
  });
}

function bookingDemo(root: HTMLElement, id: string): void {
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Studio Still Konzeptnavigation"><span class="demo-logo">still<span class="demo-studio-mark">✳</span><small>STUDIO FÜR BEWEGUNG</small></span><span class="demo-nav-note">Ein guter Ort für Sie.</span><button class="demo-nav-link" data-panel-open type="button">Kurs finden ${arrow}</button></nav>
    <div class="demo-studio-hero"><div class="demo-studio-copy"><p class="demo-eyebrow">Weniger müssen. Mehr spüren.</p><h2>Ganz bei<br><em>sich.</em></h2><p>Bewegung, die gut tut.<br>Raum, der Ihnen gehört.</p><button class="demo-cta" data-panel-open type="button">Ihren Moment finden ${arrow}</button><span class="demo-caption">Pilates & Yoga · Kleine Gruppen</span></div><div class="demo-studio-art">${studio(id)}<span class="demo-studio-seal">RAUM<br>FÜR SIE<span aria-hidden="true">↗</span></span></div></div>
    <footer class="demo-footer"><span>Einatmen. Ankommen. Aufblühen.</span><span>Konzeptdemo · keine echte Buchung</span></footer>
    </div>${panelFrame('Ein Moment, nur für Sie.', `<p class="demo-panel-intro">Entdecken Sie die Terminwahl. Alle Termine sind Beispiele.</p><form class="demo-booking-form"><label>Ihre Bewegung<select name="service"><option value="Pilates">Pilates · 60 Minuten</option><option value="Yoga Flow">Yoga Flow · 60 Minuten</option><option value="Slow Stretch">Slow Stretch · 45 Minuten</option></select></label><fieldset><legend>Ihr Tag <span>· Beispielwoche im Oktober 2026</span></legend><div class="demo-day-options"><button type="button" data-day="Montag, 19. Oktober" aria-pressed="true"><small>MO</small><strong>19</strong></button><button type="button" data-day="Dienstag, 20. Oktober" aria-pressed="false"><small>DI</small><strong>20</strong></button><button type="button" data-day="Mittwoch, 21. Oktober" aria-pressed="false"><small>MI</small><strong>21</strong></button><button type="button" data-day="Donnerstag, 22. Oktober" aria-pressed="false"><small>DO</small><strong>22</strong></button></div></fieldset><fieldset><legend>Ihre Zeit</legend><div class="demo-time-options"><button type="button" data-time="09:00" aria-pressed="true">09:00</button><button type="button" data-time="12:30" aria-pressed="false">12:30</button><button type="button" data-time="18:00" aria-pressed="false">18:00</button></div></fieldset><button class="demo-cta" type="submit">Demo-Termin auswählen ${arrow}</button><p class="demo-result" role="status" aria-live="polite"></p><p class="demo-privacy-note">Nur eine Demonstration. Es wird kein echter Termin gebucht.</p></form>`)} `;
  bindPanel(root);
  let day = 'Montag, 19. Oktober';
  let time = '09:00';
  const result = root.querySelector<HTMLElement>('.demo-result')!;
  for (const kind of ['day', 'time'] as const) {
    root.querySelectorAll<HTMLButtonElement>(`[data-${kind}]`).forEach((button) => {
      button.addEventListener('click', () => {
        root.querySelectorAll(`[data-${kind}]`).forEach((item) => item.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
        if (kind === 'day') day = button.dataset.day!;
        else time = button.dataset.time!;
        result.textContent = '';
      });
    });
  }
  const form = root.querySelector<HTMLFormElement>('form')!;
  form.addEventListener('change', () => { result.textContent = ''; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const service = (form.elements.namedItem('service') as HTMLSelectElement).value;
    result.textContent = `Ihre Demo-Auswahl: ${service} am ${day} um ${time} Uhr. Kein echter Termin wurde gebucht.`;
  });
}

function salesDemo(root: HTMLElement, id: string): void {
  const variants = [{ name: 'Terrakotta', color: '#c67550' }, { name: 'Kreide', color: '#e9e1ce' }, { name: 'Kobalt', color: '#4658b5' }];
  let variant = 0;
  const cart = new Map<number, number>();
  root.style.setProperty('--lamp-color', variants[0].color);
  root.innerHTML = `<div class="demo-main">
    <nav class="demo-nav" aria-label="Forma Konzeptnavigation"><span class="demo-logo">forma<span aria-hidden="true">↗</span></span><span class="demo-nav-note">OBJECTS FOR EVERY DAY.</span><button class="demo-nav-link" data-panel-open type="button">Tasche <span data-cart-count>(0)</span> ${arrow}</button></nav>
    <div class="demo-product-hero"><div class="demo-product-copy"><p class="demo-eyebrow">Kleine Dinge. Große Wirkung.</p><h2>Gutes Licht.<br><em>Gute Dinge.</em></h2><p>Ein Objekt. Ein neuer Lieblingsplatz.<br>Lernen Sie Luma kennen.</p><div class="demo-product-spec"><span>Luma — Tischleuchte</span><strong>129 € <small>Demopreis</small></strong></div><fieldset class="demo-variants"><legend>Farbe: <span data-variant-name>Terrakotta</span></legend><div>${variants.map((item, index) => `<button type="button" data-variant="${index}" style="--swatch:${item.color}" aria-pressed="${index === 0}" aria-label="Farbe ${item.name}"><span></span></button>`).join('')}</div></fieldset><button class="demo-cta" type="button" data-add-cart>In die Demo-Tasche ${arrow}</button><p class="demo-shop-status" role="status" aria-live="polite"></p></div><div class="demo-product-art"><span class="demo-product-index">OBJECT<br>NO. 01</span>${lamp(id)}<span class="demo-product-tag">Eine runde<br>Sache.</span><span class="demo-product-dimension">H 28 CM · Ø 22 CM</span></div></div>
    <footer class="demo-footer"><span>Mit Bedacht gestaltet. Für jeden Tag.</span><span>Konzeptdemo · kein echter Kauf</span></footer>
    </div>${panelFrame('Ihre Demo-Tasche.', '<p class="demo-panel-intro">Ein kleiner Einblick in einen möglichen Shopablauf.</p><div class="demo-cart-items"></div><div class="demo-cart-total"><span>Demobetrag</span><strong data-cart-total>0 €</strong></div><p class="demo-privacy-note">Lokale Demonstration. Es gibt keine Bestellung und keine Zahlung.</p><p class="demo-cart-status" role="status" aria-live="polite"></p>')} `;
  bindPanel(root);
  const currency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const focusCartControl = (key: number, selector: string) => {
    const target = root.querySelector<HTMLElement>(`[data-cart-variant="${key}"] ${selector}`)
      ?? root.querySelector<HTMLElement>(`.demo-cart-line ${selector}`)
      ?? root.querySelector<HTMLElement>('[data-panel-close]');
    target?.focus({ preventScroll: true });
  };
  const updateCart = () => {
    const amount = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
    root.querySelector('[data-cart-count]')!.textContent = `(${amount})`;
    root.querySelector('[data-cart-total]')!.textContent = currency(amount * 129);
    const items = root.querySelector<HTMLElement>('.demo-cart-items')!;
    items.replaceChildren();
    if (!amount) {
      const empty = document.createElement('p');
      empty.className = 'demo-cart-empty';
      empty.textContent = 'Ihre Tasche ist noch leer. Vielleicht braucht Ihr Lieblingsplatz etwas Licht?';
      items.append(empty);
    }
    for (const [key, quantity] of cart) {
      const line = document.createElement('div');
      line.className = 'demo-cart-line';
      line.dataset.cartVariant = String(key);
      line.innerHTML = `<span class="demo-cart-swatch" style="--swatch:${variants[key].color}"></span><div class="demo-cart-title"><strong>Luma</strong><small>${variants[key].name} · ${currency(129)}</small></div><div class="demo-cart-quantity"><button type="button" data-less aria-label="Eine Luma in ${variants[key].name} weniger">−</button><span aria-label="Menge">${quantity}</span><button type="button" data-more aria-label="Eine Luma in ${variants[key].name} mehr">+</button></div><button class="demo-cart-remove" type="button" aria-label="Luma in ${variants[key].name} entfernen">Entfernen</button>`;
      line.querySelector('[data-less]')!.addEventListener('click', () => {
        if (quantity === 1) cart.delete(key); else cart.set(key, quantity - 1);
        updateCart();
        focusCartControl(key, '[data-less]');
      });
      line.querySelector('[data-more]')!.addEventListener('click', () => {
        cart.set(key, Math.min(99, quantity + 1));
        updateCart();
        focusCartControl(key, '[data-more]');
        if (quantity >= 99) root.querySelector('.demo-cart-status')!.textContent = 'Maximal 99 Stück je Farbe in dieser Demo.';
      });
      line.querySelector('.demo-cart-remove')!.addEventListener('click', () => {
        cart.delete(key);
        updateCart();
        focusCartControl(key, '.demo-cart-remove');
      });
      items.append(line);
    }
    root.querySelector('.demo-cart-status')!.textContent = `${amount} ${amount === 1 ? 'Objekt' : 'Objekte'} in Ihrer Demo-Tasche.`;
  };
  root.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      variant = Number(button.dataset.variant);
      root.style.setProperty('--lamp-color', variants[variant].color);
      root.querySelector('[data-variant-name]')!.textContent = variants[variant].name;
      root.querySelectorAll('[data-variant]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      root.querySelector('.demo-shop-status')!.textContent = '';
    });
  });
  root.querySelector('[data-add-cart]')!.addEventListener('click', () => {
    const current = cart.get(variant) ?? 0;
    cart.set(variant, Math.min(99, current + 1));
    updateCart();
    root.querySelector('.demo-shop-status')!.textContent = current >= 99 ? 'Maximal 99 Stück je Farbe in dieser Demo.' : `Luma in ${variants[variant].name} liegt in Ihrer Demo-Tasche.`;
  });
  updateCart();
}

/** A self-contained concept site. Default dimensions match the hero's 5:4 display. */
export function createDemo(goal: DemoGoal, options: { interactive?: boolean } = {}): HTMLElement {
  const root = document.createElement('div');
  const id = `concept-${++instance}`;
  root.className = `demo demo--${goal}`;
  root.dataset.demo = goal;
  if (goal === 'inquiries') inquiryDemo(root, id);
  else if (goal === 'bookings') bookingDemo(root, id);
  else salesDemo(root, id);
  if (options.interactive === false) {
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    root.classList.add('demo--preview');
  }
  return root;
}

/** Presents an existing live session; creation and caching belong to the catalogue. */
export function mountDemoDialog(options: { onRestore?: () => void } = {}): {
  open(goal: DemoGoal, demoElement: HTMLElement): void;
  close(): void;
  dispose(): void;
} {
  const names: Record<DemoGoal, string> = { inquiries: 'Klarraum', bookings: 'Studio Still', sales: 'Forma' };
  const dialog = document.createElement('dialog');
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
  dialog.querySelector('.concept-dialog-close')!.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    const panelClose = dialog.querySelector<HTMLButtonElement>('.demo-panel:not([hidden]) [data-panel-close]');
    if (panelClose) panelClose.click();
    else close();
  });
  dialog.addEventListener('close', () => {
    // Ignore an earlier queued close event if a new session is already open.
    if (!dialog.open) restore();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
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
      dialog.remove();
    },
  };
}
