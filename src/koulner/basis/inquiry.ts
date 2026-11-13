import { areas, inquiry, packages, video } from '../shared/content';
import { media } from '../shared/media';
import { thumb } from './bild';
import type { MarksDetail } from './hand';

// Anfrage als leerer Bogen: jedes Feld ein Bildfeld. Kein Versand, nichts verlässt den Browser.
interface FieldCfg {
  type?: string;
  auto: string;
  max: number;
  hint?: string;
  missing?: string;
}

const cfg: Record<string, FieldCfg> = {
  anlass: { auto: 'off', max: 120, hint: 'z. B. Bewerbung, Familie, Produktfotos', missing: 'Bitte nenn kurz den Anlass, zum Beispiel Bewerbung oder Familie.' },
  termin: { auto: 'off', max: 80, hint: 'gern auch ein Zeitraum' },
  ort: { auto: 'address-level2', max: 80, hint: 'Stadt oder Treffpunkt' },
  name: { auto: 'name', max: 80, missing: 'Bitte gib deinen Namen an.' },
  email: { type: 'email', auto: 'email', max: 160, missing: 'Bitte gib deine E-Mail-Adresse an.' },
  nachricht: { auto: 'off', max: 1200, hint: 'optional, ein paar Sätze reichen' },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const check = (name: string, value: string, required: boolean) => {
  const v = value.trim();
  if (required && !v) return cfg[name].missing ?? 'Bitte ausfüllen.';
  if (name === 'email' && v && !EMAIL.test(v)) return 'Diese E-Mail-Adresse sieht unvollständig aus, zum Beispiel name@beispiel.de.';
  if (v.length > cfg[name].max) return `Bitte höchstens ${cfg[name].max} Zeichen.`;
  return '';
};

export function inquiryMarkup(doneMark: string, no: number) {
  const suggestions = [...new Set([...areas.flatMap((a) => a.offers), video.title, ...packages.map((p) => p.title)])];
  const required = inquiry.fields.filter((f) => f.required).length;
  return `<section class="anfrage" id="anfrage" aria-labelledby="h-anfrage">
    <header class="copy">
      <p class="kicker">Bogen 0${no} · noch leer</p>
      <h2 id="h-anfrage">Dein Bild</h2>
      <p class="short">Der nächste Bogen ist noch leer. ${inquiry.fields.length} Felder, ${required} davon brauchst du.</p>
      <p class="notice"><span aria-hidden="true">[</span>${inquiry.prototypeNotice}<span aria-hidden="true">]</span></p>
      <div class="auswahl" hidden>
        <p class="kicker">Deine Auswahl</p>
        <div class="auswahl-group" data-list="likes" hidden><p class="auswahl-hint" id="auswahl-likes">Gefällt dir</p><ol class="auswahl-row" aria-labelledby="auswahl-likes"></ol></div>
        <div class="auswahl-group" data-list="nopes" hidden><p class="auswahl-hint" id="auswahl-nopes">Nicht dein Stil</p><ol class="auswahl-row" aria-labelledby="auswahl-nopes"></ol></div>
      </div>
    </header>
    <div class="leerbogen">
      <p class="sheet-head" aria-hidden="true"><span>Koulner · Bogen 0${no}</span><span>Dein Bild</span></p>
      <form class="form" novalidate>
        <ol class="fields">
          ${inquiry.fields
            .map((f, i) => {
              const c = cfg[f.name];
              const id = `f-${f.name}`;
              const desc = [c.hint ? `${id}-hint` : '', `${id}-err`].filter(Boolean).join(' ');
              const attrs = `id="${id}" name="${f.name}" autocomplete="${c.auto}" maxlength="${c.max}" aria-describedby="${desc}"${f.required ? ' required aria-required="true"' : ''}`;
              const control =
                f.name === 'nachricht'
                  ? `<textarea ${attrs} rows="3"></textarea>`
                  : `<input ${attrs} type="${c.type ?? 'text'}"${f.name === 'anlass' ? ' list="anlass-list"' : ''}${c.type === 'email' ? ' inputmode="email" spellcheck="false"' : ''}>`;
              return `<li class="field f-${f.name}">
                <label for="${id}"><span class="no">0${i + 1}</span>${f.label}${f.required ? '<span class="req">Pflicht</span>' : '<span class="opt">optional</span>'}</label>
                ${control}
                ${c.hint ? `<span class="hint" id="${id}-hint">${c.hint}</span>` : ''}
                <span class="err" id="${id}-err"></span>
              </li>`;
            })
            .join('')}
        </ol>
        <datalist id="anlass-list">${suggestions.map((s) => `<option value="${s}"></option>`).join('')}</datalist>
        <div class="submit-row">
          <button class="btn btn-ink" type="submit">Shooting anfragen</button>
          <p class="status" role="status" aria-live="polite"></p>
        </div>
      </form>
      <div class="done" tabindex="-1" hidden>
        <p class="kicker">Bogen 0${no} · markiert</p>
        <h3>Markiert. Deine Anfrage ist vorbereitet.</h3>
        <p class="notice">${inquiry.prototypeNotice} Nichts hat diesen Browser verlassen und nichts wurde gespeichert.</p>
        <dl class="summary"></dl>
        <p class="done-acts">
          <button class="btn btn-line" type="button" data-edit>Angaben ändern</button>
          <button class="btn btn-line" type="button" data-reset>Neu beginnen</button>
        </p>
      </div>
      ${doneMark}
    </div>
  </section>`;
}

// Fettstift-Rahmen in Pixelkoordinaten des Bogens, damit die Strichstärke überall gleich bleibt.
function drawFrame(svg: SVGSVGElement) {
  const { width: w, height: h } = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = [`M6 14L${w - 4} 8`, `M${w - 10} 3L${w - 7} ${h - 4}`, `M${w - 2} ${h - 12}L8 ${h - 6}`, `M13 ${h - 2}L5 4`]
    .map((d) => `<path d="${d}" pathLength="1"/>`)
    .join('');
  return svg.querySelectorAll('path');
}

export function initInquiry(reduce: boolean) {
  const sheet = document.querySelector<HTMLElement>('.leerbogen')!;
  const form = sheet.querySelector<HTMLFormElement>('form')!;
  const done = sheet.querySelector<HTMLElement>('.done')!;
  const status = form.querySelector<HTMLElement>('.status')!;
  const summary = done.querySelector<HTMLElement>('.summary')!;
  const frame = sheet.querySelector<SVGSVGElement>('.done-mark')!;
  const ctl = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
  let tried = false;

  // Deine Auswahl: die markierten Abzüge selbst, Kreise und Kreuze getrennt. Keine Deutung, der Fotograf sieht die Bilder.
  let marked: MarksDetail = { likes: [], nopes: [] };
  const box = document.querySelector<HTMLElement>('.auswahl')!;
  const motif = (id: string) => media.find((x) => x.id === id);
  document.addEventListener('marks', (e) => {
    marked = (e as CustomEvent<MarksDetail>).detail;
    box.hidden = !marked.likes.length && !marked.nopes.length;
    box.querySelectorAll<HTMLElement>('[data-list]').forEach((group) => {
      const list = marked[group.dataset.list as keyof MarksDetail];
      group.hidden = !list.length;
      group.querySelector('ol')!.innerHTML = list
        .map((m) => {
          const md = motif(m.id);
          return md ? `<li>${thumb(md)}<span class="no">${m.no}</span></li>` : '';
        })
        .join('');
    });
  });

  const show = (name: string, required: boolean) => {
    const el = ctl(name);
    const msg = check(name, el.value, required);
    const li = el.closest('.field')!;
    li.classList.toggle('is-invalid', !!msg);
    li.classList.toggle('is-filled', !!el.value.trim());
    el.setAttribute('aria-invalid', String(!!msg));
    li.querySelector('.err')!.textContent = msg;
    return msg;
  };

  for (const f of inquiry.fields) {
    const el = ctl(f.name);
    el.addEventListener('input', () => {
      el.closest('.field')!.classList.toggle('is-filled', !!el.value.trim());
      if (tried || el.getAttribute('aria-invalid') === 'true') show(f.name, f.required);
    });
    el.addEventListener('blur', () => el.value.trim() && show(f.name, f.required));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tried = true;
    const bad = inquiry.fields.filter((f) => show(f.name, f.required));
    if (bad.length) {
      status.textContent = bad.length === 1 ? 'Ein Feld braucht noch eine Angabe.' : `${bad.length} Felder brauchen noch eine Angabe.`;
      ctl(bad[0].name).focus();
      return;
    }
    status.textContent = '';
    summary.replaceChildren(
      ...inquiry.fields.flatMap((f) => {
        const v = ctl(f.name).value.trim();
        if (!v) return [];
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = f.label;
        dd.textContent = v;
        return [dt, dd];
      }),
    );
    // Im Bogen markierte Bilder (hand.ts) gehören zur Anfrage, mit Motiv, damit die Zeile ohne Bogen lesbar ist.
    const nos = (list: MarksDetail['likes']) => list.map((m) => `Nr. ${m.no} · ${motif(m.id)?.motif ?? ''}`).join(', ');
    for (const [label, value] of [
      ['Gefällt dir', nos(marked.likes)],
      ['Nicht dein Stil', nos(marked.nopes)],
    ]) {
      if (!value) continue;
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      summary.append(dt, dd);
    }
    form.hidden = true;
    done.hidden = false;
    sheet.classList.add('is-done');
    const strokes = drawFrame(frame);
    // Ohne GSAP, damit Stufe 1 keine Bewegungsbibliothek lädt.
    strokes.forEach((el, i) => {
      el.style.strokeDashoffset = '0';
      if (!reduce) el.animate([{ strokeDashoffset: 1.02 }, { strokeDashoffset: 0 }], { duration: 320, delay: 150 + i * 220, easing: 'ease-in-out', fill: 'backwards' });
    });
    done.focus();
  });

  const reopen = () => {
    done.hidden = true;
    form.hidden = false;
    sheet.classList.remove('is-done');
  };
  done.querySelector('[data-edit]')!.addEventListener('click', () => {
    reopen();
    ctl('anlass').focus();
  });
  done.querySelector('[data-reset]')!.addEventListener('click', () => {
    form.reset();
    tried = false;
    inquiry.fields.forEach((f) => {
      const el = ctl(f.name);
      el.removeAttribute('aria-invalid');
      const li = el.closest('.field')!;
      li.classList.remove('is-invalid', 'is-filled');
      li.querySelector('.err')!.textContent = '';
    });
    reopen();
    ctl('anlass').focus();
  });

  // Anlass aus dem Kontext vorbelegen (markierter Abzug, Paket).
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-anlass]');
    if (!a) return;
    if (!done.hidden) reopen();
    const el = ctl('anlass');
    el.value = a.dataset.anlass!;
    show('anlass', true);
    requestAnimationFrame(() => el.focus({ preventScroll: true }));
  });
}
