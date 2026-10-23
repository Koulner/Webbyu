import { concepts, type DemoId } from './data';
import { mountReferenceDemo } from './reference-demos/runtime';
import './demos.css';
import { saffronChapters, saffronJourneyMarkup, mountSaffronJourney } from './saffron-journey';

let instance = 0;
const arrow = '<span aria-hidden="true">↗</span>';

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

const currency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

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
export function createDemo(goal: DemoId, options: { interactive?: boolean } = {}): HTMLElement {
  const root = document.createElement('div');
  const id = `concept-${++instance}`;
  const controller = new AbortController();
  sessions.set(root, controller);
  root.className = `demo demo--${goal}`;
  root.dataset.demo = goal;
  if (goal === 'sales') salesDemo(root, id, controller.signal);
  else mountReferenceDemo(root, goal, controller.signal);
  if (options.interactive === false) {
    if (goal === 'sales') controller.abort();
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
  open(goal: DemoId, demoElement: HTMLElement): void;
  close(): void;
  dispose(): void;
} {
  const nameOf = (id: DemoId) => concepts.find(concept => concept.goal === id)!.name;
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
    const innerDialog = active?.demo.shadowRoot?.querySelector<HTMLDialogElement>('dialog[open]');
    if (innerDialog) { innerDialog.close(); return; }
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
      dialog.querySelector('[data-dialog-title]')!.textContent = nameOf(goal);
      dialog.setAttribute('aria-label', `Interaktive Konzeptdemo: ${nameOf(goal)}`);
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
