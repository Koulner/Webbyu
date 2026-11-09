import { ENDE, hitze, temperatur, uhr } from './feuer';

/** Verhalten der Complete-Demo: Fieberzeile beim Scrollen, Karte ohne Fleisch, Abend wählen. */
export function mountHof(root: HTMLElement, signal: AbortSignal): void {
  const fieber = root.querySelector<HTMLElement>('[data-fieber]');
  const baender = [...root.querySelectorAll<HTMLElement>('.hf-hitze')];
  if (fieber && baender.length) {
    const uhrFeld = fieber.querySelector<HTMLElement>('[data-fieber-uhr]')!;
    const gradFeld = fieber.querySelector<HTMLElement>('[data-fieber-grad]')!;
    const balken = fieber.querySelector<HTMLElement>('[data-fieber-balken]')!;
    const stunden = baender.map(b => Number(b.dataset.h));
    let wartet = false;
    const zeichnen = () => {
      wartet = false;
      const mitte = innerHeight * 0.4;
      let stunde = stunden[0];
      for (let i = 0; i < baender.length; i++) {
        const r = baender[i].getBoundingClientRect();
        if (r.top <= mitte) {
          const naechste = stunden[i + 1] ?? ENDE;
          stunde = stunden[i] + (naechste - stunden[i]) * Math.min(1, (mitte - r.top) / r.height);
        }
      }
      uhrFeld.textContent = uhr(Math.round(stunde * 12) / 12);
      gradFeld.textContent = `${temperatur(stunde)} °C`;
      balken.style.transform = `scaleX(${Math.max(0.04, hitze(stunde)).toFixed(3)})`;
    };
    const anfordern = () => { if (!wartet) { wartet = true; requestAnimationFrame(zeichnen); } };
    fieber.hidden = false;
    addEventListener('scroll', anfordern, { passive: true, signal });
    addEventListener('resize', anfordern, { passive: true, signal });
    zeichnen();
  }

  const karte = root.querySelector<HTMLElement>('[data-karte]');
  const schalter = root.querySelector<HTMLElement>('[data-schalter]');
  const haken = root.querySelector<HTMLInputElement>('[data-ohne-fleisch]');
  if (karte && schalter && haken) {
    schalter.hidden = false;
    haken.addEventListener('change', () => karte.toggleAttribute('data-ohne', haken.checked), { signal });
  }

  const abend = root.querySelector<HTMLSelectElement>('select[name="abend"]');
  if (abend) {
    const knoepfe = [...root.querySelectorAll<HTMLButtonElement>('[data-abend-wahl]')];
    const markieren = () => knoepfe.forEach(k => k.setAttribute('aria-pressed', String(k.dataset.abendWahl === abend.value)));
    knoepfe.forEach(k => k.addEventListener('click', () => { abend.value = k.dataset.abendWahl!; markieren(); }, { signal }));
    abend.addEventListener('change', markieren, { signal });
    abend.form?.addEventListener('reset', () => setTimeout(markieren), { signal });
    markieren();
  }
}
