// Das Formular ist ein kleiner Rundgang: Wer Fenster zählt, sieht sein Haus entstehen und
// erfährt, was auf den Wagen käme. Läuft nur lokal; die Angaben landen in einem versteckten Feld,
// das die Prüfansicht aus main.ts mit anzeigt.
import { fensterarten, zeichenInhalt, type Fensterart } from './klarblick';

/* Vier Reihen mit fünf Plätzen, die Mitte der untersten gehört der Tür. */
const SPALTEN = 5, REIHEN = 4, TUER_PLATZ = 17;
const PLAETZE = SPALTEN * REIHEN - 1;

function hausBild(fenster: Fensterart[]): string {
  const breite = 300, wandOben = 92, reihe = 58, hoehe = wandOben + reihe * REIHEN + 8;
  const liste = [...fenster];
  const rundImGiebel = liste[0] === 'rund' ? liste.shift() : undefined;
  const platz = (i: number): [number, number] => [24 + (i % SPALTEN) * 52, wandOben + 7 + Math.floor(i / SPALTEN) * reihe];
  let i = 0;
  const zeichen = liste.map(art => {
    if (i === TUER_PLATZ) i++;
    const [x, y] = platz(i++);
    return `<svg x="${x}" y="${y}" width="36" height="47" viewBox="0 0 40 52" class="kb-z kb-z-haus">${zeichenInhalt(art)}</svg>`;
  }).join('');
  const [tx, ty] = platz(TUER_PLATZ);
  const label = fenster.length ? `Ihr Haus mit ${fenster.length} ${fenster.length === 1 ? 'Fenster' : 'Fenstern'}.` : 'Ihr Haus, noch ohne Fenster.';
  return `<svg viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="${label}">
    <path d="M150 4 296 ${wandOben}V${hoehe - 2}H4V${wandOben}Z" class="kb-haus-wand"/>
    ${rundImGiebel ? `<circle cx="150" cy="58" r="23" class="kb-haus-rund"/><path d="M150 35v46M127 58h46" class="kb-haus-kreuz"/>` : ''}
    ${zeichen}
    <rect x="${tx + 2}" y="${ty - 1}" width="32" height="${hoehe - 2 - ty + 1}" class="kb-haus-tuer"/>
  </svg>`;
}

export function mountKlarblick(root: HTMLElement, signal: AbortSignal): void {
  const form = root.querySelector<HTMLFormElement>('[data-demo-form]');
  if (!form) return;
  const haus = form.querySelector<HTMLElement>('[data-mein-haus]')!;
  const summe = form.querySelector<HTMLElement>('[data-summe]')!;
  const wagen = form.querySelector<HTMLElement>('[data-wagen]')!;
  const feld = form.querySelector<HTMLInputElement>('[name="fensterliste"]')!;
  const zeilen = [...form.querySelectorAll<HTMLElement>('.kb-zaehler')];
  const anzahl = new Map<Fensterart, number>();

  const zeichnen = () => {
    const fenster = fensterarten.flatMap(({ art }) => Array<Fensterart>(anzahl.get(art) ?? 0).fill(art));
    const gesamt = fenster.length;
    for (const zeile of zeilen) {
      const art = zeile.dataset.art as Fensterart, wert = anzahl.get(art) ?? 0;
      zeile.querySelector('output')!.textContent = String(wert);
      zeile.classList.toggle('kb-aktiv', wert > 0);
      zeile.querySelector<HTMLButtonElement>('[data-weniger]')!.disabled = wert === 0;
      zeile.querySelector<HTMLButtonElement>('[data-mehr]')!.disabled = gesamt >= PLAETZE;
    }
    haus.innerHTML = hausBild(fenster);
    summe.textContent = gesamt === 0 ? 'Noch steht kein Fenster.' : gesamt >= PLAETZE ? `Macht ${gesamt} Fenster. Größere Häuser klären wir beim Rundgang.` : `Macht ${gesamt} Fenster.`;
    const dinge = new Set(['Abzieher, Einwascher, Eimer']);
    for (const { art, wagen: zubehoer } of fensterarten) if (anzahl.get(art)) zubehoer.forEach(ding => dinge.add(ding));
    wagen.replaceChildren(...[...dinge].map(ding => { const li = document.createElement('li'); li.textContent = ding; return li; }));
    feld.value = fensterarten.filter(({ art }) => anzahl.get(art)).map(({ art, name }) => `${anzahl.get(art)} × ${name}`).join(', ');
  };

  form.addEventListener('click', event => {
    const knopf = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mehr],[data-weniger]');
    if (!knopf) return;
    const art = knopf.closest<HTMLElement>('.kb-zaehler')!.dataset.art as Fensterart;
    anzahl.set(art, Math.max(0, (anzahl.get(art) ?? 0) + (knopf.hasAttribute('data-mehr') ? 1 : -1)));
    zeichnen();
    /* Bei Null oder am Limit wird der gedrückte Knopf deaktiviert; der Fokus darf nicht verloren gehen. */
    if (knopf.disabled) knopf.closest('.kb-stepper')!.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
  }, { signal });

  form.addEventListener('reset', () => { anzahl.clear(); zeichnen(); }, { signal });
  zeichnen();
}
