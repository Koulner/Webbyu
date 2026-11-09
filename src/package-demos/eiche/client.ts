import { de, nische, solve } from './drawings';

const NAMEN: Record<string, string> = { top: 'Breite oben', bottom: 'Breite unten', left: 'Höhe links', right: 'Höhe rechts' };

/** Verhalten der Business-Demo: Bildschalter, Bühne für Fall 14 und Live-Zeichnung beim Messen. */
export function mountEiche(root: HTMLElement, signal: AbortSignal): () => void {
  const cleanups: (() => void)[] = [];

  const umschalten = root.querySelector<HTMLButtonElement>('[data-umschalten]');
  const bild = root.querySelector<HTMLElement>('[data-ansicht="render"]');
  const plan = root.querySelector<HTMLElement>('[data-ansicht="plan"]');
  const feld = root.querySelector<HTMLElement>('[data-darstellung]');
  if (umschalten && bild && plan && feld) {
    umschalten.addEventListener('click', () => {
      const zeigtPlan = bild.hidden;
      bild.hidden = !zeigtPlan;
      plan.hidden = zeigtPlan;
      umschalten.textContent = zeigtPlan ? 'Als Zeichnung zeigen' : 'Als Visualisierung zeigen';
      umschalten.setAttribute('aria-pressed', String(!zeigtPlan));
      feld.textContent = zeigtPlan ? 'Entwurfsvisualisierung, kein Foto' : 'Abweichungen 5-fach überhöht';
    }, { signal });
  }

  // Die Bühne steht schon im HTML; hier wird nur die aktive Stufe umgeschaltet.
  const stufen = [...root.querySelectorAll<HTMLElement>('.ef-stufe')];
  const bilder = [...root.querySelectorAll<HTMLElement>('.ef-buehne figure')];
  if (stufen.length && bilder.length === stufen.length && typeof IntersectionObserver !== 'undefined') {
    const aktiv = (i: number) => stufen.forEach((s, n) => { s.classList.toggle('an', n === i); bilder[n].classList.toggle('an', n === i); });
    const beobachter = new IntersectionObserver(eintraege => {
      for (const e of eintraege) if (e.isIntersecting) aktiv(stufen.indexOf(e.target as HTMLElement));
    }, { rootMargin: '-45% 0px -45% 0px' });
    stufen.forEach(s => beobachter.observe(s));
    cleanups.push(() => beobachter.disconnect());
  }

  const form = root.querySelector<HTMLFormElement>('.ef-messen-form');
  const messbild = root.querySelector<HTMLElement>('[data-messbild]');
  const ergebnis = root.querySelector<HTMLElement>('[data-ergebnis]');
  if (form && messbild && ergebnis) {
    const felder = [...form.querySelectorAll<HTMLInputElement>('[data-mass]')];
    const startBild = messbild.innerHTML;
    const startText = ergebnis.innerHTML;
    const absatz = (cls: string, text: string) => `<p class="${cls}">${text}</p>`;
    const aktualisieren = () => {
      const werte: Record<string, number> = {};
      let leer = 0;
      let falsch: HTMLInputElement | null = null;
      for (const f of felder) {
        const roh = f.value.trim();
        if (!roh) { leer++; continue; }
        const n = Number(roh.replace(',', '.'));
        if (Number.isFinite(n) && n >= 300 && n <= 6000) werte[f.name] = n;
        else falsch ??= f;
      }
      if (falsch) {
        const n = Number(falsch.value.replace(',', '.'));
        const zentimeter = n >= 30 && n < 300;
        ergebnis.innerHTML = absatz('ef-ergebnis-satz', zentimeter ? 'Das sieht nach Zentimetern aus.' : 'Dieses Maß können wir nicht zeichnen.')
          + absatz('ef-ergebnis-klein', `${NAMEN[falsch.name]}: Bitte in Millimetern eintragen, zwischen 300 und 6.000. Aus 120 cm werden 1200.`);
        return;
      }
      if (leer === felder.length) { messbild.innerHTML = startBild; ergebnis.innerHTML = startText; return; }
      if (leer) { ergebnis.innerHTML = absatz('ef-ergebnis-satz', `Noch ${leer === 1 ? 'ein Maß' : `${leer} Maße`}, dann zeichnen wir.`); return; }
      const s = { top: werte.top, bottom: werte.bottom, left: werte.left, right: werte.right };
      const g = solve(s);
      messbild.innerHTML = nische(s);
      const dw = s.bottom - s.top, dh = s.left - s.right;
      const breite = dw === 0 ? 'Oben und unten sind gleich breit.' : `${dw > 0 ? 'Oben' : 'Unten'} ist Ihre Nische ${de(Math.abs(dw))} mm schmaler als ${dw > 0 ? 'unten' : 'oben'}.`;
      const hoehe = dh === 0 ? 'Links und rechts sind gleich hoch.' : `${dh > 0 ? 'Links' : 'Rechts'} ist sie ${de(Math.abs(dh))} mm höher.`;
      const viel = Math.abs(dw) > 80 || Math.abs(dh) > 80;
      ergebnis.innerHTML = absatz('ef-ergebnis-satz', `${breite} ${hoehe}`)
        + `<dl class="ef-ergebnis-werte"><div><dt>Korpus, Richtwert</dt><dd>${de(g.width)} mm breit</dd></div><div><dt>Leiste links</dt><dd>${de(g.leftTop)} bis ${de(g.leftBottom)} mm</dd></div><div><dt>Leiste rechts</dt><dd>${de(g.rightTop)} bis ${de(g.rightBottom)} mm</dd></div></dl>`
        + absatz('ef-ergebnis-klein', viel ? 'Das ist ungewöhnlich viel. Messen Sie bitte noch einmal nach, oder wir sehen es uns vor Ort an.' : 'Wir teilen die Schiefe hier gleichmäßig auf beide Wände auf. Welche Wand es wirklich ist, klärt das Aufmaß.');
    };
    felder.forEach(f => f.addEventListener('input', aktualisieren, { signal }));
    form.addEventListener('reset', () => setTimeout(aktualisieren), { signal });
  }

  return () => cleanups.forEach(c => c());
}
