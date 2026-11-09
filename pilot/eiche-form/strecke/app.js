import { de, nische, solve } from './drawings.mjs';

// Einstieg: Visualisierung oder überhöhte Zeichnung derselben Maße
const umschalten = document.querySelector('[data-umschalten]');
if (umschalten) {
  const [render, plan] = ['render', 'ueberhoeht'].map(a => document.querySelector(`[data-ansicht="${a}"]`));
  const feld = document.querySelector('[data-darstellung]');
  umschalten.addEventListener('click', () => {
    const zeigtPlan = render.hidden;
    render.hidden = !zeigtPlan;
    plan.hidden = zeigtPlan;
    umschalten.textContent = zeigtPlan ? 'Als Zeichnung zeigen' : 'Als Visualisierung zeigen';
    umschalten.setAttribute('aria-pressed', String(!zeigtPlan));
    feld.textContent = zeigtPlan ? 'Entwurfsvisualisierung, kein Foto' : 'Abweichungen 5-fach überhöht';
  });
}

// Fall 14: Die Bühne steht schon im HTML; hier wird nur die aktive Stufe umgeschaltet.
const stufen = [...document.querySelectorAll('.stufe')];
const bilder = [...document.querySelectorAll('.buehne figure')];
if (stufen.length) {
  const aktiv = i => {
    stufen.forEach((s, n) => { s.classList.toggle('an', n === i); bilder[n].classList.toggle('an', n === i); });
  };
  const beobachter = new IntersectionObserver(eintraege => {
    for (const e of eintraege) if (e.isIntersecting) aktiv(stufen.indexOf(e.target));
  }, { rootMargin: '-45% 0px -45% 0px' });
  stufen.forEach(s => beobachter.observe(s));
}

// Messen und lokale Demo-Anfrage
const form = document.querySelector('[data-messen]');
if (form) {
  const fieldset = form.querySelector('fieldset');
  fieldset.disabled = false;
  const bild = form.querySelector('[data-messbild]');
  const ergebnis = form.querySelector('[data-ergebnis]');
  const fehler = form.querySelector('[data-fehler]');
  const pruefung = document.querySelector('[data-pruefung]');
  const erfolg = document.querySelector('[data-erfolg]');
  const felder = ['top', 'bottom', 'left', 'right'].map(n => form.elements[n]);
  const namen = { top: 'Breite oben', bottom: 'Breite unten', left: 'Höhe links', right: 'Höhe rechts' };
  const startText = ergebnis.innerHTML;
  const startBild = bild.innerHTML;

  const lesen = () => {
    const werte = {};
    const falsch = [];
    let leer = 0;
    for (const f of felder) {
      const roh = f.value.trim();
      if (!roh) { leer++; f.removeAttribute('aria-invalid'); continue; }
      const n = Number(roh.replace(',', '.'));
      const ok = Number.isFinite(n) && n >= 300 && n <= 6000;
      if (ok) { werte[f.name] = n; f.removeAttribute('aria-invalid'); } else { falsch.push(f); f.setAttribute('aria-invalid', 'true'); }
    }
    return { werte, leer, falsch };
  };

  const aktualisieren = () => {
    const { werte, leer, falsch } = lesen();
    if (falsch.length) {
      const wert = Number(falsch[0].value.replace(',', '.'));
      const zentimeter = wert >= 30 && wert < 300;
      ergebnis.innerHTML = `<p class="ergebnis-satz">${zentimeter ? 'Das sieht nach Zentimetern aus.' : 'Dieses Maß können wir nicht zeichnen.'}</p><p class="ergebnis-klein">${namen[falsch[0].name]}: Bitte in Millimetern eintragen, zwischen 300 und 6.000. Aus 120 cm werden 1200.</p>`;
      return;
    }
    if (leer === 4) { bild.innerHTML = startBild; bild.dataset.beispiel = 'true'; ergebnis.innerHTML = startText; return; }
    if (leer > 0) {
      ergebnis.innerHTML = `<p class="ergebnis-satz">Noch ${leer === 1 ? 'ein Maß' : `${leer} Maße`}, dann zeichnen wir.</p>`;
      return;
    }
    const s = { top: werte.top, bottom: werte.bottom, left: werte.left, right: werte.right };
    const g = solve(s);
    bild.dataset.beispiel = 'false';
    bild.innerHTML = nische(s);
    const dw = s.bottom - s.top, dh = s.left - s.right;
    const breite = dw === 0 ? 'Oben und unten sind gleich breit.' : `${dw > 0 ? 'Oben' : 'Unten'} ist Ihre Nische ${de(Math.abs(dw))} mm schmaler als ${dw > 0 ? 'unten' : 'oben'}.`;
    const hoehe = dh === 0 ? 'Links und rechts sind gleich hoch.' : `${dh > 0 ? 'Links' : 'Rechts'} ist sie ${de(Math.abs(dh))} mm höher.`;
    const viel = Math.abs(dw) > 80 || Math.abs(dh) > 80;
    ergebnis.innerHTML = `<p class="ergebnis-satz">${breite} ${hoehe}</p>
      <dl class="ergebnis-werte"><div><dt>Korpus, Richtwert</dt><dd>${de(g.width)} mm breit</dd></div><div><dt>Leiste links</dt><dd>${de(g.leftTop)} bis ${de(g.leftBottom)} mm</dd></div><div><dt>Leiste rechts</dt><dd>${de(g.rightTop)} bis ${de(g.rightBottom)} mm</dd></div></dl>
      <p class="ergebnis-klein">${viel ? 'Das ist ungewöhnlich viel. Messen Sie bitte noch einmal nach, oder wir sehen es uns vor Ort an.' : 'Wir teilen die Schiefe hier gleichmäßig auf beide Wände auf. Welche Wand es wirklich ist, klärt das Aufmaß.'}</p>`;
  };
  felder.forEach(f => f.addEventListener('input', aktualisieren));

  const zeigen = ansicht => {
    form.hidden = ansicht !== 'form';
    pruefung.hidden = ansicht !== 'pruefung';
    erfolg.hidden = ansicht !== 'erfolg';
    const ziel = ansicht === 'pruefung' ? pruefung : ansicht === 'erfolg' ? erfolg : null;
    if (ziel) ziel.focus();
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const { werte, leer, falsch } = lesen();
    const pflicht = [form.elements.name, form.elements.email, form.elements.message];
    pflicht.forEach(f => f.toggleAttribute('aria-invalid', !f.checkValidity()));
    const fehlend = pflicht.find(f => !f.checkValidity());
    let meldung = '';
    if (falsch.length) meldung = 'Bitte prüfen Sie die Maße: in Millimetern, zwischen 300 und 6.000.';
    else if (fehlend) meldung = fehlend.name === 'email' ? 'Bitte geben Sie eine gültige E-Mail-Adresse an.' : fehlend.name === 'name' ? 'Bitte nennen Sie Ihren Namen.' : 'Bitte beschreiben Sie in ein paar Worten, was dort hinein soll.';
    fehler.textContent = meldung;
    fehler.hidden = !meldung;
    if (meldung) { (falsch[0] ?? fehlend).focus(); return; }
    const masse = leer === 4 ? 'Noch nicht gemessen' : felder.filter(f => werte[f.name]).map(f => `${namen[f.name]} ${de(werte[f.name])} mm`).join(', ');
    const zeilen = [['Name', form.elements.name.value], ['E-Mail', form.elements.email.value], ['Maße', masse], ['Vorhaben', form.elements.message.value]];
    const dl = pruefung.querySelector('dl');
    dl.replaceChildren(...zeilen.flatMap(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      return [dt, dd];
    }));
    zeigen('pruefung');
  });
  pruefung.querySelector('[data-korrigieren]').addEventListener('click', () => { zeigen('form'); form.elements.message.focus(); });
  pruefung.querySelector('[data-bestaetigen]').addEventListener('click', () => zeigen('erfolg'));
  erfolg.querySelector('[data-neu]').addEventListener('click', () => { form.reset(); fehler.hidden = true; aktualisieren(); zeigen('form'); form.elements.top.focus(); });
}
