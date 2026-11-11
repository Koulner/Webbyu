// Gemeinsame Seite aller drei Stufen (aus Variante E). Die Stufen unterscheiden sich in Stil und Bewegung, nicht im Inhalt.
import { areas, brand, packages, PRICE_NOTICE, video } from '../shared/content';
import { media, setMediaBase, STOCK_NOTICE, type AreaId, type StockMedia } from '../shared/media';
import { initInquiry, inquiryMarkup } from './inquiry';
import { initVideos } from './video';
import { initHand } from './hand';
import { mark } from './marks';
import { esc, still, thumb } from './bild';
import { stufen } from '../stufen';

export { mark };

// Ein Bogen je Bereich: Reihenfolge der Bilder, Weg der Lupe, markiertes Bild, Begleitbilder.
interface Bogen {
  area: AreaId;
  order: string[];
  path: [string, string];
  pick: string;
  with: string[];
  line: string;
}

const boegen: Bogen[] = [
  {
    area: 'menschen',
    order: ['menschen-portraet-01', 'menschen-bewerbung-01', 'menschen-portraet-02', 'menschen-paar-01', 'menschen-familie-02', 'menschen-familie-01', 'menschen-hund-01', 'menschen-katze-01', 'menschen-video-portraet-01'],
    path: ['menschen-portraet-02', 'menschen-hund-01'],
    pick: 'menschen-familie-02',
    with: ['menschen-familie-01'],
    line: 'Mit Abstand – und ganz nah.',
  },
  {
    area: 'momente',
    order: ['momente-publikum-01', 'momente-feier-01', 'momente-konzert-01', 'momente-detail-02', 'momente-feier-02', 'momente-detail-01', 'momente-video-konzert-01'],
    path: ['momente-feier-01', 'momente-detail-01'],
    pick: 'momente-konzert-01',
    with: ['momente-publikum-01', 'momente-feier-02', 'momente-detail-01'],
    line: 'So kann ein Abend erzählt werden: vier Bilder, eine Folge.',
  },
  {
    area: 'business',
    order: ['business-team-01', 'business-portraet-01', 'business-video-werkstatt-01', 'business-werkstatt-01', 'business-produkt-01', 'business-portraet-02', 'business-produkt-02'],
    path: ['business-portraet-01', 'business-produkt-01'],
    pick: 'business-video-werkstatt-01',
    with: ['business-produkt-01', 'business-produkt-02'],
    line: 'Vom Ton zum Becher: Video und Foto erzählen zusammen.',
  },
  {
    area: 'kreativ',
    order: ['kreativ-maske-01', 'kreativ-licht-01', 'kreativ-kostuem-01', 'kreativ-cosplay-01', 'kreativ-licht-02', 'kreativ-kostuem-02'],
    path: ['kreativ-cosplay-01', 'kreativ-licht-02'],
    pick: 'kreativ-kostuem-01',
    with: ['kreativ-licht-01', 'kreativ-licht-02'],
    line: 'Laub, rotes Licht, Neon: Jede Idee bekommt ihr eigenes Material.',
  },
];

const clips = ['momente-video-konzert-01', 'menschen-video-portraet-01', 'business-video-werkstatt-01'];

// Paket → passendes Platzhalterbild (Vorschlag, keine Arbeitsprobe).
const packageImage: Record<string, string> = {
  'Bewerbung / Kurzporträt': 'menschen-bewerbung-01',
  'Porträt / Kreativ': 'kreativ-licht-01',
  'Paare / Familie / Haustiere': 'menschen-hund-01',
  Businessporträts: 'business-portraet-02',
  Eventbegleitung: 'momente-feier-01',
  'Produktfotos / Video': 'business-produkt-02',
};

const byId = new Map(media.map((m) => [m.id, m]));
const get = (id: string): StockMedia => {
  const m = byId.get(id);
  if (!m) throw new Error(`Koulner: Medium ${id} fehlt in media.json`);
  return m;
};

// Selbstprüfung: jedes Bild genau einmal auf dem Gesamtbogen, Lupe und Begleitbilder liegen im eigenen Bogen.
const all = boegen.flatMap((b) => b.order);
if (new Set(all).size !== media.length || all.length !== media.length) throw new Error('Koulner: Bögen decken media.json nicht genau ab');
for (const b of boegen) for (const id of [...b.path, b.pick, ...b.with]) if (!b.order.includes(id)) throw new Error(`Koulner: ${id} liegt nicht in Bogen ${b.area}`);

const nr = new Map(all.map((id, i) => [id, String(i + 1).padStart(2, '0')]));
const areaOf = (id: AreaId) => areas.find((a) => a.id === id)!;
const range = (b: Bogen) => `Nr. ${nr.get(b.order[0])}–${nr.get(b.order.at(-1)!)}`;

// Vorgezeichneter Kreis am gewählten Bild, je Szene höchstens einer (Stufe.ring). Sonst nur Kreise des Nutzers.
let ring = false;
const said = () => (ring ? 'Markiert' : 'Ausgewählt');

// Im Bogen ist jedes Bildfeld ein Knopf: leer → Kreis → Kreuz → leer (hand.ts). Im Gesamtbogen nur Anzeige.
const cell = (id: string, pick: boolean, eager = false, circle = ring) => {
  const m = get(id);
  const tag = eager ? 'span' : 'button';
  const btn = eager ? '' : ` type="button" data-label="Nr. ${nr.get(id)} · ${esc(m.motif)}" aria-label="Nr. ${nr.get(id)} · ${esc(m.motif)}: nicht markiert"`;
  return `<li class="cell${pick ? ' is-pick' : ''}" data-id="${id}"><${tag} class="frame"${btn}>${thumb(m, eager)}${m.kind === 'video' ? '<span class="badge">Video</span>' : ''}${pick && circle ? mark('circle') : ''}</${tag}><span class="no">${nr.get(id)}</span></li>`;
};

// Webbyu liefert nur die 960er-Fassungen aus (öffentliches Repo), daher ohne srcset.
function face(m: StockMedia) {
  if (m.kind === 'video')
    return `<video data-clip="${m.id}" muted playsinline loop preload="none" poster="${m.poster}" width="${m.width}" height="${m.height}" aria-label="${esc(m.alt)}"><source src="${m.src}" type="video/mp4"></video>`;
  return `<img src="${m.small}" width="${m.width}" height="${m.height}" alt="${esc(m.alt)}" loading="lazy" decoding="async">`;
}

const back = (m: StockMedia) => `
  <div class="face back" aria-hidden="true" inert>
    <p class="b-no">Nr. ${nr.get(m.id)} · ${m.kind === 'video' ? 'Video' : 'Foto'}</p>
    <p class="b-motif">${esc(m.motif)}</p>
    <p class="b-alt">${esc(m.alt)}</p>
    <p class="b-stock">${STOCK_NOTICE}<br>${m.kind === 'video' ? 'Video' : 'Foto'}: ${esc(m.photographer)} · ${esc(m.license)}<br><a href="${m.sourceUrl}" target="_blank" rel="noopener noreferrer">Quelle öffnen ↗</a></p>
  </div>`;

const print = (id: string, cls: string, seq = '') => {
  const m = get(id);
  return `<figure class="print ${cls}" data-id="${id}" style="--ar:${(m.width / m.height).toFixed(4)}">
    <div class="print-inner">
      <div class="face front">${face(m)}<span class="pnr">${seq || `Nr. ${nr.get(id)}`}</span></div>
      ${cls.includes('main') ? back(m) : ''}
    </div>
  </figure>`;
};

const strip = (b: Bogen, i: number) => {
  const a = areaOf(b.area);
  return `<li class="strip">
    <a class="strip-label" href="#${b.area}"><span class="n">0${i + 1}</span> ${esc(a.title)} <span class="r">${range(b)}</span></a>
    <ol class="strip-cells">${b.order.map((id) => cell(id, id === b.pick, true, ring && i === 0)).join('')}</ol>
  </li>`;
};

function bogenSection(b: Bogen, i: number) {
  const a = areaOf(b.area);
  const pm = get(b.pick);
  const seqOf = (id: string) => (b.area === 'momente' ? `${['momente-publikum-01', 'momente-konzert-01', 'momente-feier-02', 'momente-detail-01'].indexOf(id) + 1}/4 · Nr. ${nr.get(id)}` : '');
  const cols = Math.ceil(b.order.length / 2);
  const colsS = b.order.length % 3 === 0 ? 3 : 4;
  return `<section class="bogen" id="${b.area}" data-area="${b.area}" data-pick="${b.pick}" data-path="${b.path.join(' ')}" aria-labelledby="h-${b.area}">
    <div class="stage">
      <header class="copy">
        <p class="kicker">Bogen 0${i + 1} / 04 · ${range(b)}</p>
        <h2 id="h-${b.area}">${esc(a.title)}</h2>
        <p class="short">${esc(a.short)}</p>
        <ul class="offers">${a.offers.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </header>
      <div class="sheet-slot">
        <div class="sheet" style="--cols:${cols};--cols-s:${colsS}">
          <p class="sheet-head" aria-hidden="true"><span>Koulner · Bogen 0${i + 1}</span><span>${range(b)}</span></p>
          <ol class="grid" aria-label="Kontaktbogen ${esc(a.title)}">${b.order.map((id) => cell(id, id === b.pick)).join('')}</ol>
          <div class="lens" aria-hidden="true"><div class="lens-view"></div></div>
        </div>
      </div>
      <div class="story" data-n="${b.with.length}">
        ${print(b.pick, 'main', seqOf(b.pick))}
        ${b.with.map((id, k) => print(id, `c c${k + 1}`, seqOf(id))).join('')}
      </div>
      <ol class="log" aria-hidden="true">
        ${[...b.path, b.pick]
          .map((id, k) => `<li><span class="m">Lupe · Nr. ${nr.get(id)}</span> ${esc(get(id).motif)}${k === 2 ? ` <span class="is-mark">${said().toLowerCase()}</span>` : ''}</li>`)
          .join('')}
      </ol>
      <div class="caption">
        <p class="line">${esc(b.line)}</p>
        <p class="meta">${said()}: Nr. ${nr.get(b.pick)} · ${esc(pm.motif)}</p>
        <p class="acts">
          <button class="turn" type="button" aria-pressed="false">Rückseite ansehen</button>
          ${pm.kind === 'video' ? '<button class="clip-toggle" type="button" data-clip-toggle aria-pressed="false">Clips anhalten</button>' : ''}
          <a class="ask" href="#anfrage" data-anlass="${esc(a.title)}">Mit diesem Anlass anfragen</a>
        </p>
      </div>
    </div>
  </section>`;
}

export interface Stufe {
  /** Zeile im Fuß, z. B. „Stufe 2 · Leuchttisch“ */
  study: string;
  /** Bewegte Fassung vorhanden, Link zur ruhigen Fassung im Fuß (Stufe 2 und 3) */
  moving?: boolean;
  /** Bewegung laden (fehlt in Stufe 1) */
  motion?: () => Promise<unknown>;
  /** Lupe folgt der Maus (Stufe 2 und 3) */
  lens?: boolean;
  /** Ein vorgezeichneter Kreis je Szene: im Gesamtbogen Streifen 01, in jedem Bogen das gewählte Bild (Stufe 2 und 3) */
  ring?: boolean;
}

/** Ganze Seite als HTML. Läuft im Browser und beim Vorrendern in vite.config.ts, deshalb ohne DOM. */
export function pageHtml(stufe: Stufe, reduce: boolean, base: string) {
  ring = !!stufe.ring;
  const motionLink = !stufe.moving ? '' : reduce ? '<a href="./">Bewegte Fassung</a>' : '<a href="?motion=reduce">Ruhige Fassung</a>';

  return `
  <a class="skip" href="#anfrage">Direkt zur Anfrage</a>
  <header class="bar">
    <a class="wm" href="#top" aria-label="${brand.name}, zum Anfang">${brand.name}</a>
    <nav class="index" aria-label="Bögen">
      <ol>
        ${boegen.map((b, i) => `<li><a href="#${b.area}"><span class="n">0${i + 1}</span><span class="t">${esc(areaOf(b.area).title.split(' ')[0])}</span>${mark('line')}</a></li>`).join('')}
        <li><a href="#video"><span class="n">05</span><span class="t">Video</span>${mark('line')}</a></li>
        <li><a href="#pakete"><span class="t t-keep">Pakete</span>${mark('line')}</a></li>
      </ol>
    </nav>
    <a class="bar-works" href="#menschen">Arbeiten</a>
    <a class="btn btn-ink bar-cta" href="#anfrage"><span class="l-long">${brand.primaryAction}</span><span class="l-short">Anfragen</span>${mark('oval')}</a>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="h-hero">
      <div class="sleeve">
        <p class="kicker">Fotografie &amp; Video · ${esc(brand.region)}</p>
        <h1 id="h-hero"><span class="wordmark">${brand.name}</span><span class="claim">${esc(brand.claim)}</span></h1>
        <p class="intro">${esc(brand.intro)}</p>
        <p class="actions">
          <a class="btn btn-ink" href="#anfrage">${brand.primaryAction}${mark('oval')}</a>
          <a class="btn btn-line" href="#menschen">${brand.secondaryAction} <span aria-hidden="true">↓</span></a>
        </p>
        <p class="sleeve-note">${STOCK_NOTICE}${motionLink ? ` · ${motionLink}` : ''}</p>
      </div>
      <div class="hero-sheet">
        <p class="sheet-head" aria-hidden="true"><span>Koulner · Gesamtbogen</span><span>Nr. 01–${String(all.length).padStart(2, '0')}</span></p>
        <ol class="strips" aria-label="Gesamtbogen: vier Bereiche">${boegen.map(strip).join('')}</ol>
      </div>
      <p class="hero-hint" aria-hidden="true">Vier Bögen, in jedem ein markiertes Bild. Scroll weiter – die Lupe geht sie durch.</p>
    </section>

    ${boegen.map(bogenSection).join('')}

    <section class="laufbild" id="video" aria-labelledby="h-video">
      <header class="copy">
        <p class="kicker">Bogen 05 · Bewegtes Bild · ${clips.map((id) => `Nr. ${nr.get(id)}`).join(', ')}</p>
        <h2 id="h-video">${video.title}</h2>
        <p class="short">${esc(video.short)}</p>
        <p class="note">Die Clips laufen stumm und nur, solange sie zu sehen sind.</p>
        <button class="clip-toggle btn btn-line" type="button" data-clip-toggle aria-pressed="false">Clips anhalten</button>
      </header>
      <div class="reel">
        ${clips
          .map((id, k) => {
            const m = get(id);
            return `<figure class="vprint v${k + 1}" style="--ar:${(m.width / m.height).toFixed(4)}">
              <div class="face front">${face(m)}</div>
              <figcaption><span>Nr. ${nr.get(id)} · ${esc(m.motif)}</span><span class="tc" data-tc="${id}">stumm</span></figcaption>
            </figure>`;
          })
          .join('')}
      </div>
    </section>

    <section class="pakete" id="pakete" aria-labelledby="h-pakete">
      <header class="copy">
        <p class="kicker">Preisliste · ${packages.length} Einstiege</p>
        <h2 id="h-pakete">Pakete</h2>
        <p class="notice"><span aria-hidden="true">[</span>${PRICE_NOTICE}<span aria-hidden="true">]</span></p>
        <p class="short">Wähl einen Einstieg. Die Anfrage übernimmt ihn als Anlass.</p>
      </header>
      <ol class="list">
        ${packages
          .map((p, k) => {
            const m = get(packageImage[p.title]);
            return `<li class="pk">
              <span class="pk-no">P${k + 1}</span>
              <span class="pk-img"><img src="${still(m)}" width="${m.width}" height="${m.height}" alt="" loading="lazy" decoding="async"></span>
              <h3 class="pk-title">${esc(p.title)}</h3>
              <p class="pk-scope">${esc(p.scope)}</p>
              <p class="pk-price">${esc(p.price)}</p>
              <a class="pk-ask" href="#anfrage" data-anlass="${esc(p.title)}" aria-label="${esc(p.title)} anfragen">Anfragen ${mark('line')}</a>
            </li>`;
          })
          .join('')}
      </ol>
    </section>

    ${inquiryMarkup(mark('rect', 'done-mark'), boegen.length + 2)}
  </main>

  <footer class="foot">
    <p class="stock"><span aria-hidden="true">[</span>${STOCK_NOTICE}<span aria-hidden="true">]</span></p>
    <div class="foot-row">
      <p class="wm">${brand.name}</p>
      <p class="foot-claim">${esc(brand.claim)}<br><span class="m">${esc(brand.region)}</span></p>
      <nav class="foot-nav" aria-label="Rechtliches">
        <a href="${base}impressum/">Impressum Webbyu</a>
        <a href="${base}datenschutz/">Datenschutz Webbyu</a>
        ${motionLink}
      </nav>
    </div>
    <details class="credits">
      <summary>Bildnachweis · ${all.length} Platzhalter aus Stockmaterial</summary>
      <ol>${all
        .map((id) => {
          const m = get(id);
          return `<li><span class="m">Nr. ${nr.get(id)}</span> ${esc(m.motif)} · ${esc(m.photographer)} · ${esc(m.license)} · <a href="${m.sourceUrl}" target="_blank" rel="noopener noreferrer">Quelle ↗</a></li>`;
        })
        .join('')}</ol>
    </details>
    <p class="study">${esc(stufe.study)} · Eigenprojekt, Entwurf mit Platzhaltern · <a href="${base}reise/">Zur Webbyu-Reise</a></p>
  </footer>`;
}

/** Vorrendern für Suchmaschinen und Seiten ohne JavaScript (vite.config.ts). */
export function koulnerHtml(path: string, base: string) {
  setMediaBase(base);
  return pageHtml(stufen[path.split('/').at(-2) as keyof typeof stufen], false, base);
}

function render(stufe: Stufe) {
  const reduce = document.documentElement.classList.contains('reduce');
  document.body.innerHTML = pageHtml(stufe, reduce, import.meta.env.BASE_URL);

  // Lupe: Kopie des Bogens ohne Markierung, vergrößert im Glas.
  document.querySelectorAll<HTMLElement>('.sheet').forEach((sheet) => {
    const view = sheet.querySelector<HTMLElement>('.lens-view')!;
    view.append(sheet.querySelector('.sheet-head')!.cloneNode(true), sheet.querySelector('.grid')!.cloneNode(true));
    view.querySelectorAll('.mark').forEach((n) => n.remove());
    view.querySelectorAll('img').forEach((n) => n.removeAttribute('loading'));
    view.querySelector('.grid')!.removeAttribute('aria-label');
    view.inert = true; // Kopie der Knöpfe: weder fokussierbar noch klickbar
  });

  return reduce;
}

function turnPrints() {
  document.querySelectorAll<HTMLButtonElement>('.turn').forEach((btn) => {
    const sec = btn.closest('.bogen')!;
    const p = sec.querySelector<HTMLElement>('.print.main')!;
    const front = p.querySelector<HTMLElement>('.face.front')!;
    const backFace = p.querySelector<HTMLElement>('.face.back')!;
    btn.addEventListener('click', () => {
      const on = !p.classList.contains('is-turned');
      p.classList.toggle('is-turned', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'Vorderseite ansehen' : 'Rückseite ansehen';
      backFace.inert = !on;
      backFace.setAttribute('aria-hidden', String(!on));
      front.setAttribute('aria-hidden', String(on));
    });
  });
}

function activeIndex() {
  const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.index a')].map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => (id === e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  document.querySelectorAll('main > section').forEach((s) => io.observe(s));
}

export function start(stufe: Stufe) {
  const reduce = render(stufe);
  turnPrints();
  activeIndex();
  initInquiry(reduce);
  initVideos(reduce);
  initHand(!!stufe.lens, reduce);
  if (!reduce) stufe.motion?.();
  return reduce;
}
