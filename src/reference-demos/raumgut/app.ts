import type { ReferenceHelpers, ReferenceScope } from '../runtime';
import { cartTotal, categories, findProducts, getProduct, money, products, setQuantity, type CartLine, type Filters, type Product } from './products';

const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const initialFilters = (): Filters => ({ query: '', category: 'Alle', max: 200000, available: false, offers: false, fresh: false, sort: 'curated' });
type Address = { name: string; street: string; zip: string; city: string; email: string; delivery: string; payment: string };

export function mount(scope: ReferenceScope, helpers: ReferenceHelpers, signal: AbortSignal): void {
  const $ = <T extends Element = HTMLElement>(selector: string) => scope.querySelector(selector) as T;
  const all = <T extends Element = HTMLElement>(selector: string) => Array.from(scope.querySelectorAll(selector)) as T[];
  const esc = helpers.escape;
  let filters = initialFilters(), cart: CartLine[] = [], saved = new Set<string>();
  let activeProduct = products[0], variantIndex = 0, toastTimer = 0, receipt = '';
  let address: Address = { name: '', street: '', zip: '', city: '', email: '', delivery: 'standard', payment: 'invoice' };
  const img = (product: Product) => helpers.asset(`raumgut/${product.image}.jpg`);
  const fee = () => address.delivery === 'room' ? 4900 : 0;
  const deliveryLabel = () => address.delivery === 'room' ? 'Lieferung bis in den Raum' : 'Standardlieferung';
  const paymentLabel = () => address.payment === 'card' ? 'Karte (simuliert)' : 'Rechnung (simuliert)';
  const tell = (text: string) => {
    const toast = $('#rg-toast'); toast.textContent = text; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4000);
  };
  signal.addEventListener('abort', () => clearTimeout(toastTimer), { once: true });
  const focusTitle = (selector: string) => { const title = $(selector); title.tabIndex = -1; title.focus(); };
  const open = (selector: string) => { const dialog = $<HTMLDialogElement>(selector); if (!dialog.open) helpers.open(dialog); };
  const closeAll = () => all<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  const sync = () => {
    $('#rg-cart-count').textContent = String(cart.reduce((sum, line) => sum + line.quantity, 0));
    $('#rg-saved-count').textContent = String(saved.size);
    all<HTMLButtonElement>('[data-save]').forEach(button => {
      const selected = saved.has(button.dataset.save!);
      button.setAttribute('aria-pressed', String(selected));
      button.title = selected ? 'Aus Merkliste entfernen' : 'Auf die Merkliste';
    });
  };
  function card(product: Product): string {
    return `<article class="rg-card" data-product-card="${product.id}"><div class="rg-card-image"><button class="rg-image-link" data-product="${product.id}" aria-label="${product.name} ${product.kind} ansehen"><img src="${img(product)}" alt="${product.kind} ${product.name} aus ${product.material}" loading="lazy" width="1254" height="1254"></button>${product.previous ? '<span class="rg-badge">SALE</span>' : product.fresh ? '<span class="rg-badge rg-new">NEU</span>' : ''}<button class="rg-save" data-save="${product.id}" aria-label="${product.name} merken" aria-pressed="${saved.has(product.id)}">${heart}</button><button class="rg-quick" data-product="${product.id}">Entdecken <span>↗</span></button></div><div class="rg-card-meta"><button data-product="${product.id}"><span>${product.kind} · ${product.material}</span><h3>${product.name}</h3></button><div>${product.previous ? `<del>${money(product.previous)}</del>` : ''}<strong>${product.variants.length > 1 ? 'ab ' : ''}${money(product.variants[0].price)}</strong></div></div><p class="rg-card-stock">● Verfügbar${product.variants.length > 1 ? ` · ${product.variants.length} Größen` : ''}</p></article>`;
  }
  function renderProducts(): void {
    const results = findProducts(filters);
    $('#rg-result-count').textContent = `${results.length} ${results.length === 1 ? 'Lieblingsstück' : 'Lieblingsstücke'}`;
    $('#rg-grid').innerHTML = results.length ? results.map(card).join('') : '<div class="rg-empty"><h3>Ihr Lieblingsstück ist noch nicht dabei.</h3><p>Probieren Sie einen anderen Suchbegriff oder erweitern Sie die Filter.</p><button class="rg-button" data-action="reset">Alle Möbel ansehen ↗</button></div>';
    const note = $('#rg-search-note'); note.hidden = !filters.query;
    note.textContent = `Suchergebnisse für „${filters.query}“`;
    $<HTMLSelectElement>('#rg-category').value = filters.category;
    $<HTMLSelectElement>('#rg-price').value = String(filters.max);
    $<HTMLSelectElement>('#rg-sort').value = filters.sort;
    $<HTMLInputElement>('#rg-query').value = filters.query;
    for (const name of ['available', 'offers', 'fresh'] as const) $<HTMLInputElement>(`#rg-${name}`).checked = filters[name];
    all('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === filters.category)));
    sync();
  }
  const toProducts = () => { $('#rg-products').scrollIntoView({ block: 'start', behavior: 'instant' }); focusTitle('#rg-shop-title'); };
  function browse(category = 'Alle', mode?: 'offers' | 'fresh'): void {
    filters = initialFilters(); filters.category = category;
    if (mode) filters[mode] = true;
    closeAll(); renderProducts(); toProducts();
  }
  function renderProduct(): void {
    const product = activeProduct, variant = product.variants[variantIndex];
    const already = cart.find(line => line.id === product.id && line.variant === variantIndex)?.quantity ?? 0;
    const remaining = variant.stock - already;
    $('#rg-product-detail').innerHTML = `<div class="rg-detail-grid"><div><button class="rg-product-photo" data-action="zoom" aria-label="Produktbild vergrößern" aria-pressed="false"><img src="${img(product)}" alt="${product.name} · ${product.material}" width="1254" height="1254"></button><p class="rg-fine" id="rg-photo-hint">Bild anklicken für einen Detailausschnitt · KI-generiertes Beispielbild</p></div><div class="rg-detail-copy"><p class="rg-kicker">${product.category} / ${product.material}</p><h2 id="rg-product-title">${product.name}</h2><p class="rg-product-kind">${product.kind}</p><p>${product.description}</p><p class="rg-detail-price">${variantIndex === 0 && product.previous ? `<del>${money(product.previous)}</del>` : ''}<strong>${money(variant.price)}</strong></p><p class="rg-fine">Beispielpreis inkl. MwSt. · Standardlieferung 0 €</p><form id="rg-add-form"><label>Ausführung<select id="rg-variant" name="variant">${product.variants.map((choice, index) => `<option value="${index}" ${index === variantIndex ? 'selected' : ''}>${choice.label}${!choice.stock ? ' · derzeit ausverkauft' : ''}</option>`).join('')}</select></label><p class="rg-stock ${variant.stock ? '' : 'rg-unavailable'}">${variant.stock ? `● ${variant.stock} im Demo-Bestand · Lieferzeit 3–7 Werktage` : '○ Diese Größe ist derzeit ausverkauft'}</p><div class="rg-add-row"><label>Menge<input id="rg-quantity" type="number" name="quantity" value="1" min="1" max="${Math.max(1, remaining)}" step="1" required ${remaining <= 0 ? 'disabled' : ''}></label><button class="rg-button" type="submit" ${remaining <= 0 ? 'disabled' : ''}>${!variant.stock ? 'Nicht verfügbar' : remaining <= 0 ? 'Bestand im Warenkorb' : 'In den Warenkorb'} <span>↗</span></button></div><p class="rg-fine" id="rg-add-status" role="status">${already ? `${already} dieser Ausführung bereits im Warenkorb.` : ''}</p></form><button class="rg-text-link rg-save-text" data-save="${product.id}" aria-pressed="${saved.has(product.id)}">${heart} Auf der Merkliste vormerken</button><details open><summary>Maße & Material</summary><dl><div><dt>Maße (B × T × H)</dt><dd>${variant.size}</dd></div><div><dt>Material</dt><dd>${product.material}</dd></div><div><dt>Ausführung</dt><dd>${variant.label}</dd></div><div><dt>Demo-Artikelnummer</dt><dd>RG-${product.id.toUpperCase()}-${variantIndex + 1}</dd></div></dl></details><details><summary>Pflege & Hinweise</summary><p>${product.care}</p><p class="rg-fine">Die Bilder zeigen die Form beispielhaft. Verbindlich für diese Demo sind die Maße der gewählten Ausführung.</p></details><details><summary>Lieferung & Rückgabe</summary><p>Im Shopkonzept: Standardlieferung kostenlos, Wunschlieferung bis in den Raum für 49 €. Beispiel-Lieferzeit 3–7 Werktage. Rückgaben lassen sich über den Servicebereich nachvollziehen.</p><p>Diese Demo löst weder Lieferung noch Kaufvertrag aus.</p></details><button class="rg-text-link" data-action="cart">Zum Warenkorb →</button></div></div>`;
    sync();
  }
  function showProduct(id: string, choice = 0): void {
    activeProduct = getProduct(id); variantIndex = choice;
    ($<HTMLDialogElement>('#rg-product-dialog') as HTMLDialogElement & { returnTarget?: HTMLElement }).returnTarget = undefined;
    renderProduct(); open('#rg-product-dialog');
  }
  function refreshProductParent(): void {
    const productDialog = $<HTMLDialogElement>('#rg-product-dialog') as HTMLDialogElement & { returnTarget?: HTMLElement };
    if (!productDialog.open) return;
    if ($<HTMLDialogElement>('#rg-bag-dialog').open) {
      renderCart();
      productDialog.returnTarget = $<HTMLElement>(`#rg-bag-content [data-product="${activeProduct.id}"]`) ?? $<HTMLElement>('#rg-bag-dialog [data-close]');
    }
    if ($<HTMLDialogElement>('#rg-saved-dialog').open) {
      renderSaved();
      productDialog.returnTarget = $<HTMLElement>(`#rg-saved-content [data-product="${activeProduct.id}"]`) ?? $<HTMLElement>('#rg-saved-dialog [data-close]');
    }
  }
  function renderSaved(): void {
    $('#rg-saved-content').innerHTML = saved.size ? `<div class="rg-saved-list">${[...saved].map(id => {
      const product = getProduct(id); return `<div class="rg-list-item"><img src="${img(product)}" alt="${product.kind} ${product.name}" width="90" height="90"><div><button class="rg-text-link" data-product="${id}">${product.name} ↗</button><p>${product.kind} · ab ${money(product.variants[0].price)}</p></div><button data-save="${id}" aria-label="${product.name} merken" aria-pressed="true">${heart}</button></div>`;
    }).join('')}</div><button data-action="save-list" class="rg-button">Merkliste herunterladen ↓</button>` : '<div class="rg-empty"><h3>Platz für Ihre Favoriten.</h3><p>Mit dem Herz am Produkt sammeln Sie Ihre Lieblingsstücke.</p><button data-category="Alle" class="rg-button">Lieblingsstück finden ↗</button></div>';
  }
  function totals(): string {
    return `<dl class="rg-totals"><div><dt>Warenwert</dt><dd>${money(cartTotal(cart))}</dd></div><div><dt>${deliveryLabel()}</dt><dd>${money(fee())}</dd></div><div class="rg-total"><dt>Gesamt inkl. MwSt.</dt><dd>${money(cartTotal(cart) + fee())}</dd></div></dl>`;
  }
  function renderCart(): void {
    $('#rg-bag-content').innerHTML = `<p class="rg-kicker">GUT AUSGEWÄHLT.</p><h2 id="rg-bag-title">Ihr Warenkorb.</h2>${cart.length ? `<div class="rg-cart-lines">${cart.map(line => {
      const product = getProduct(line.id), variant = product.variants[line.variant];
      return `<article class="rg-list-item"><img src="${img(product)}" alt="${product.kind} ${product.name}" width="90" height="90"><div><button class="rg-text-link" data-product="${line.id}" data-choice="${line.variant}">${product.name} ↗</button><p>${product.kind} · ${variant.label}</p><span>${money(variant.price)} / Stück</span><div class="rg-line-controls"><button data-line="${line.id}" data-variant="${line.variant}" data-delta="-1" aria-label="${product.name} Menge verringern">−</button><output aria-label="Menge ${product.name}">${line.quantity}</output><button data-line="${line.id}" data-variant="${line.variant}" data-delta="1" ${line.quantity >= variant.stock ? 'disabled' : ''} aria-label="${product.name} Menge erhöhen">+</button><button class="rg-remove" data-line="${line.id}" data-variant="${line.variant}" data-delta="remove" aria-label="${product.name} entfernen">Entfernen</button></div></div><strong>${money(variant.price * line.quantity)}</strong></article>`;
    }).join('')}</div>${totals()}<button class="rg-button rg-full" data-action="checkout">Zur Bestellvorschau <span>→</span></button><p class="rg-fine">Nur ausprobieren: Keine Zahlung, keine Datenübertragung, keine Bestellung.</p>` : '<div class="rg-empty"><h3>Ein guter Anfang braucht ein Lieblingsstück.</h3><p>Ihr Warenkorb ist noch leer.</p><button class="rg-button" data-category="Alle">Kollektion entdecken ↗</button></div>'}<button class="rg-text-link" data-action="continue">Weiter entdecken</button>`;
  }
  function readAddress(): void {
    const form = $<HTMLFormElement>('#rg-checkout-form'); if (!form) return;
    const data = new FormData(form);
    for (const key of Object.keys(address) as (keyof Address)[]) address[key] = String(data.get(key) ?? address[key]);
  }
  function renderCheckout(): void {
    $('#rg-bag-content').innerHTML = `<p class="rg-kicker">01 / LIEFERUNG & ZAHLUNG</p><h2 id="rg-bag-title">Fast bei Ihnen.</h2><p>Testen Sie den Ablauf mit Beispieldaten. Alle Eingaben bleiben nur in dieser geöffneten Demo.</p><button class="rg-text-link" data-action="example">Fiktive Beispieldaten einsetzen ↗</button><form id="rg-checkout-form"><div class="rg-form-grid"><label class="rg-wide">Name<input name="name" required maxlength="100" autocomplete="off" value="${esc(address.name)}"></label><label class="rg-wide">Straße & Hausnummer<input name="street" required maxlength="150" autocomplete="off" value="${esc(address.street)}"></label><label>Postleitzahl<input name="zip" required pattern="[0-9]{5}" inputmode="numeric" maxlength="5" title="Fünf Ziffern" autocomplete="off" value="${esc(address.zip)}"></label><label>Ort<input name="city" required maxlength="100" autocomplete="off" value="${esc(address.city)}"></label><label class="rg-wide">E-Mail<input name="email" type="email" required maxlength="160" autocomplete="off" value="${esc(address.email)}"></label></div><fieldset><legend>Lieferung innerhalb Deutschlands</legend><label class="rg-radio"><input type="radio" name="delivery" value="standard" ${address.delivery === 'standard' ? 'checked' : ''}> <span>Standardlieferung<small>3–7 Werktage · bis Bordsteinkante bei Möbeln</small></span><b>0 €</b></label><label class="rg-radio"><input type="radio" name="delivery" value="room" ${address.delivery === 'room' ? 'checked' : ''}> <span>Bis in Ihren Raum<small>Wunschtermin im simulierten Ablauf</small></span><b>49 €</b></label></fieldset><fieldset><legend>Zahlungsart ausprobieren</legend><label class="rg-radio"><input type="radio" name="payment" value="invoice" ${address.payment === 'invoice' ? 'checked' : ''}> Rechnung (simuliert)</label><label class="rg-radio"><input type="radio" name="payment" value="card" ${address.payment === 'card' ? 'checked' : ''}> Karte (simuliert, keine Kartendaten)</label></fieldset><div id="rg-checkout-totals">${totals()}</div><p class="rg-error" id="rg-checkout-error" role="alert"></p><button type="submit" class="rg-button rg-full">Auswahl prüfen <span>→</span></button><button type="button" class="rg-text-link" data-action="back-cart">← Zurück zum Warenkorb</button></form>`;
  }
  function renderReview(): void {
    $('#rg-bag-content').innerHTML = `<p class="rg-kicker">02 / ALLES AUF EINEN BLICK</p><h2 id="rg-bag-title">Passt alles?</h2><div class="rg-review"><section><h3>Ihre Auswahl</h3>${cart.map(line => `<p>${line.quantity} × ${getProduct(line.id).name} · ${getProduct(line.id).variants[line.variant].label}<strong>${money(getProduct(line.id).variants[line.variant].price * line.quantity)}</strong></p>`).join('')}<button class="rg-text-link" data-action="back-cart">Warenkorb bearbeiten</button></section><section><h3>Lieferung & Zahlung</h3><p>${esc(address.name)}<br>${esc(address.street)}<br>${esc(address.zip)} ${esc(address.city)}<br>${esc(address.email)}</p><p>${deliveryLabel()}<br>${paymentLabel()}</p><button class="rg-text-link" data-action="edit-checkout">Angaben bearbeiten</button></section></div>${totals()}<p class="rg-local-note">Mit dem nächsten Schritt wird ausschließlich eine lokale Bestellvorschau erstellt. Es entsteht kein Kaufvertrag und es wird nichts bezahlt oder verschickt.</p><button class="rg-button rg-full" data-action="finish">Demo-Bestellung abschließen <span>✓</span></button>`;
    focusTitle('#rg-bag-title');
  }
  function finish(): void {
    if (!cart.length) return;
    receipt = `RAUMGUT — DEMO-BESTELLVORSCHAU\nKeine Bestellung, keine Zahlung, keine Datenübertragung.\n\n${cart.map(line => `${line.quantity} × ${getProduct(line.id).name} | ${getProduct(line.id).variants[line.variant].label} | ${money(getProduct(line.id).variants[line.variant].price * line.quantity)}`).join('\n')}\n\n${deliveryLabel()}: ${money(fee())}\nGesamt inkl. MwSt.: ${money(cartTotal(cart) + fee())}\n\nBEISPIEL-LIEFERADRESSE\n${address.name}\n${address.street}\n${address.zip} ${address.city}\n${address.email}\n${paymentLabel()}\n\nFiktive Marke und Produkte. Es wurde nichts bestellt.\n`;
    $('#rg-bag-content').innerHTML = `<div class="rg-success-mark" aria-hidden="true">✓</div><p class="rg-kicker">03 / DEMO ABGESCHLOSSEN</p><h2 id="rg-bag-title">Ein gutes Gefühl.</h2><p>Sie haben den gesamten Einkaufsweg ausprobiert. Ihre Vorschau ist bereit – es wurde nichts bestellt.</p><pre class="rg-receipt"></pre><button class="rg-button rg-full" data-action="receipt">Bestellvorschau herunterladen ↓</button><button class="rg-text-link" data-action="continue">Weiter stöbern →</button>`;
    $('.rg-receipt').textContent = receipt;
    cart = []; address = { name: '', street: '', zip: '', city: '', email: '', delivery: 'standard', payment: 'invoice' }; sync(); focusTitle('#rg-bag-title');
  }
  function info(kind: string): void {
    const content: Record<string, [string, string]> = {
      delivery: ['Gut bei Ihnen ankommen.', '<h3>Lieferung im Shopkonzept</h3><p>Für die Demo gilt: Standardlieferung innerhalb Deutschlands 0 €. Möbel kommen bis zur Bordsteinkante; kleinere Stücke per Paket. Die Beispiel-Lieferzeit beträgt 3–7 Werktage. Für 49 € lässt sich die Lieferung bis in den Raum auswählen.</p><h3>Zahlung in Ruhe testen</h3><p>Rechnung und Karte lassen sich im Bestellablauf auswählen. Es werden weder Bank- noch Kartendaten erhoben. Ein Zahlungsdienst ist nicht angeschlossen.</p><h3>Rückgabe im echten Shop</h3><p>Ein realer Händler würde hier Fristen, Zuständigkeiten und einen Rückgabeweg erläutern. Da hier kein Kauf stattfindet, ist auch keine Rücksendung erforderlich.</p>'],
      materials: ['Material mit Charakter.', '<h3>Holz</h3><p>Eiche und Walnuss bringen lebendige Maserungen mit. Untersetzer, ein weiches Tuch und ein gleichmäßiges Raumklima helfen im Alltag.</p><h3>Textilien</h3><p>Bouclé lebt von seiner Schlingenstruktur. Sanftes Absaugen und vorsichtiges Abtupfen sind ein guter Anfang. Beachten Sie bei echten Produkten immer die Pflegehinweise des Herstellers.</p><h3>Glas & Keramik</h3><p>Mit weichen Tüchern pflegen, aggressive Scheuermittel vermeiden. Die konkrete Nutzung steht in den jeweiligen Produktdetails.</p><button class="rg-button" data-category="Alle">Materialien im Sortiment entdecken ↗</button>'],
      journal: ['Wärme braucht nicht viel.', '<p class="rg-lead">Drei Gedanken für einen ruhigen Wohnraum.</p><h3>01 · Eine gemeinsame Basis</h3><p>Beginnen Sie mit warmen Naturtönen. Ein dunkles Holz schafft Tiefe, cremefarbene Textilien gleichen sie aus.</p><h3>02 · Kontraste, die sich ergänzen</h3><p>Runde Formen nehmen klaren Linien die Strenge. Setzen Sie einen weichen Sessel zu einer geradlinigen Kommode.</p><h3>03 · Licht in verschiedenen Höhen</h3><p>Eine Tischleuchte schafft eine kleine Insel. Sie gibt dem Raum am Abend einen anderen Rhythmus.</p><button class="rg-button" data-product="luma">LUMA entdecken ↗</button>'],
      help: ['Wie können wir weiterhelfen?', '<details open><summary>Kann ich hier wirklich bestellen?</summary><p>Nein. Alle Funktionen gehören zu einer interaktiven Designstudie. Sie können den Einkauf vollständig testen und die Vorschau lokal herunterladen.</p></details><details><summary>Wie finde ich die richtige Größe?</summary><p>Öffnen Sie ein Produkt und wählen Sie eine Ausführung. Maße, Preis und Verfügbarkeit passen sich an. Prüfen Sie in einem echten Shop zusätzlich Zugangswege, Türen und Stellfläche.</p></details><details><summary>Wo bleiben meine Favoriten?</summary><p>Merkliste und Warenkorb bleiben beim Wechsel zwischen den Demos erhalten. Beim Neuladen der Seite werden sie gelöscht. Ihre Merkliste können Sie als Textdatei mitnehmen.</p></details><details><summary>Wie funktioniert eine Rückgabe?</summary><p>In dieser Demo wird kein Kauf ausgelöst. Es gibt deshalb weder eine Rechnung noch eine Rücksendung. Ein echter Händler würde hier einen konkreten Rückgabeprozess anbieten.</p></details><button class="rg-button" data-action="favorites">Zur Merkliste ↗</button>'],
      demo: ['Ein Shop zum Ausprobieren.', '<p>Raumgut ist eine fiktive Möbelmarke und eine Webbyu-Designstudie. Produkte, Preise, Bestände und Lieferzeiten sind Beispieldaten. Die Bilder wurden eigens mit KI erzeugt.</p><p>Suche, Filter, Merkliste, Produktvarianten, Warenkorb und Bestellvorschau funktionieren lokal. Formulare übermitteln nichts. Es gibt keine realen Unternehmensdaten, Benutzerkonten, Zahlungsdienste oder externen Shopverbindungen.</p><p>Ihre Angaben werden nicht dauerhaft gespeichert. Beim Neuladen wird die Sitzung verworfen.</p>'],
    };
    const [title, body] = content[kind] ?? content.demo;
    $('#rg-info-content').innerHTML = `<p class="rg-kicker">RAUMGUT / GUT ZU WISSEN</p><h2 id="rg-info-title">${title}</h2>${body}`; open('#rg-info-dialog');
  }

  scope.addEventListener('click', ((event: Event) => {
    const button = (event.target as Element).closest<HTMLElement>('button'); if (!button) return;
    const { action, product, save, category, info: infoKind, line, delta } = button.dataset;
    if (product) { showProduct(product, Number(button.dataset.choice ?? 0)); return; }
    if (save) {
      saved.has(save) ? saved.delete(save) : saved.add(save); sync();
      if ($<HTMLDialogElement>('#rg-product-dialog').open) refreshProductParent();
      else if ($<HTMLDialogElement>('#rg-saved-dialog').open) {
        renderSaved();
        const next = $('#rg-saved-content [data-save]');
        if (next) next.focus(); else focusTitle('#rg-saved-title');
      }
      tell(saved.has(save) ? `${getProduct(save).name} ist auf Ihrer Merkliste.` : `${getProduct(save).name} wurde entfernt.`); return;
    }
    if (category && categories.includes(category)) { browse(category); return; }
    if (infoKind) { info(infoKind); return; }
    if (line) {
      const variant = Number(button.dataset.variant), current = cart.find(item => item.id === line && item.variant === variant);
      cart = setQuantity(cart, line, variant, delta === 'remove' ? 0 : (current?.quantity ?? 0) + Number(delta));
      renderCart(); sync();
      const next = $<HTMLButtonElement>(`[data-line="${line}"][data-variant="${variant}"][data-delta="${delta}"]`);
      if (next && !next.disabled) next.focus(); else focusTitle('#rg-bag-title'); return;
    }
    switch (action) {
      case 'offers': case 'fresh': browse('Alle', action); break;
      case 'reset': filters = initialFilters(); renderProducts(); focusTitle('#rg-shop-title'); break;
      case 'favorites': renderSaved(); open('#rg-saved-dialog'); break;
      case 'cart': closeAll(); renderCart(); open('#rg-bag-dialog'); break;
      case 'checkout': if (cart.length) { renderCheckout(); focusTitle('#rg-bag-title'); } break;
      case 'edit-checkout': renderCheckout(); focusTitle('#rg-bag-title'); break;
      case 'back-cart': readAddress(); renderCart(); focusTitle('#rg-bag-title'); break;
      case 'example': address = { ...address, name: 'Alex Beispiel', street: 'Beispielweg 12', zip: '12345', city: 'Musterstadt', email: 'alex@example.test' }; renderCheckout(); $<HTMLInputElement>('[name="name"]').focus(); break;
      case 'finish': finish(); break;
      case 'receipt': if (receipt) helpers.download('raumgut-bestellvorschau.txt', receipt); break;
      case 'continue': closeAll(); toProducts(); break;
      case 'save-list': helpers.download('raumgut-merkliste.txt', `RAUMGUT — MERKLISTE\nFiktive Produkte und Beispielpreise.\n\n${[...saved].map(id => { const item = getProduct(id); return `${item.name} · ${item.kind} · ab ${money(item.variants[0].price)}`; }).join('\n')}`); break;
      case 'zoom': { const expanded = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(expanded)); $('#rg-photo-hint').textContent = expanded ? 'Detailausschnitt · Erneut anklicken für die Gesamtansicht' : 'Bild anklicken für einen Detailausschnitt · KI-generiertes Beispielbild'; break; }
    }
  }) as EventListener);
  scope.addEventListener('input', ((event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.id === 'rg-query') { filters.query = input.value; renderProducts(); }
    if (input.closest('#rg-checkout-form')) readAddress();
  }) as EventListener);
  scope.addEventListener('change', ((event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.id === 'rg-variant') { variantIndex = Number(input.value); renderProduct(); $('#rg-variant').focus(); return; }
    if (input.id === 'rg-category') filters.category = input.value;
    if (input.id === 'rg-price') filters.max = Number(input.value);
    if (input.id === 'rg-sort') filters.sort = input.value;
    for (const name of ['available', 'offers', 'fresh'] as const) if (input.id === `rg-${name}`) filters[name] = input.checked;
    if (input.closest('.rg-filters, .rg-filter-options')) renderProducts();
    if (input.closest('#rg-checkout-form')) { readAddress(); $('#rg-checkout-totals').innerHTML = totals(); }
  }) as EventListener);
  scope.addEventListener('submit', ((event: Event) => {
    const form = event.target as HTMLFormElement; event.preventDefault();
    if (form.id === 'rg-search') { filters.query = $<HTMLInputElement>('#rg-query').value; renderProducts(); toProducts(); }
    if (form.id === 'rg-add-form') {
      const quantity = Number($<HTMLInputElement>('#rg-quantity').value), variant = activeProduct.variants[variantIndex];
      const current = cart.find(line => line.id === activeProduct.id && line.variant === variantIndex)?.quantity ?? 0;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity + current > variant.stock) return;
      cart = setQuantity(cart, activeProduct.id, variantIndex, current + quantity); sync(); refreshProductParent(); renderProduct();
      $('#rg-add-status').textContent = `${quantity} × ${activeProduct.name} im Warenkorb ergänzt.`;
      $('#rg-product-detail [data-action="cart"]').focus();
    }
    if (form.id === 'rg-checkout-form') {
      readAddress();
      if (['name', 'street', 'city'].some(key => !address[key as keyof Address].trim())) { $('#rg-checkout-error').textContent = 'Bitte füllen Sie Name, Straße und Ort aus. Leerzeichen genügen nicht.'; return; }
      if (cart.length) renderReview();
    }
  }) as EventListener);
  renderProducts();
}
