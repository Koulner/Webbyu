// Baut die statische Gestaltungsstrecke. Alle Texte sind auch ohne JavaScript vollständig.
import { mkdirSync, writeFileSync } from 'node:fs';
import { FALL14, aufmass, defs, de, detail, eingebaut, entwurf, leisten, nische, situation, solve } from './drawings.mjs';

const g = solve(FALL14);
const mark = `<svg class="marke" viewBox="0 0 30 34" aria-hidden="true"><rect x="1.5" y="1.5" width="19" height="31" fill="none" stroke="currentColor" stroke-width="3"/><polygon points="23,0 26,0 30,34 23,34" fill="#b98f5c"/></svg>`;

const head = (title, description, prefix) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><meta name="description" content="${description}"><link rel="preload" href="${prefix}fonts/besley-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="${prefix}fonts/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${prefix}style.css"><script>document.documentElement.classList.add('js')</script></head><body>`;

const bar = `<p class="demo-bar"><span>Fiktive Beispielwebsite von Webbyu. Pilotentwurf, nicht freigegeben.</span></p>`;

const header = (home, prefix) => `<a class="skip" href="#inhalt">Zum Inhalt</a>${bar}<header class="kopf"><a class="logo" href="${home}">${mark}<span>Eiche &amp; Form</span></a><nav aria-label="Hauptnavigation"><a href="${prefix}fall-14/">Fall 14</a><a href="${home}#situationen">Wo es vorkommt</a><a href="${home}#werkstatt">Werkstatt</a></nav><a class="knopf knopf--klein" href="${home}#messen">Nische messen</a></header>`;

const footer = (prefix) => `<footer class="fuss"><div>${mark}<p><strong>Eiche &amp; Form</strong><br>Tischlerei für schiefe Häuser, Lübeck</p></div><p class="fuss-hinweis">Dieses Unternehmen gibt es nicht. Fall 14, alle Maße und die Holzliste sind erfunden und keine Bauanleitung. Zeichnungen, Visualisierungen und Holzstruktur sind programmatisch erzeugt; es gibt keine Fotos, weil es keine Projekte gibt.</p></footer>`;

const wall = `<div class="wandrand" aria-hidden="true"><i class="wandrand-leiste"></i><i class="wandrand-mauer"></i></div>`;

const renderBild = (loading = 'lazy') => `<img class="render" src="bilder/fall14-render.webp" width="900" height="1125" loading="${loading}" alt="Entwurfsvisualisierung, kein Foto: Garderobe aus Eiche in einer Altbaunische, Sonnenlicht fällt von links durch ein Sprossenfenster.">`;

const stufe = (id, n, titel, text, bild, extra = '') => `<article class="stufe${n === 1 ? ' an' : ''}" data-stufe="${n}" id="${id}"><figure class="stufe-bild">${bild}<figcaption>${extra}</figcaption></figure><div class="stufe-text"><h3>${titel}</h3>${text}</div></article>`;
const buehne = [[aufmass(FALL14, 5), 'Aufmaß. Abweichungen 5-fach überhöht, das Lot gestrichelt.'], [entwurf(FALL14, 5), 'Entwurf. Die rot markierte Fläche ist die Luft zur Wand.'], [leisten(FALL14, 5), 'Einbau. Passleisten in Eiche, Korpus unverändert.'], [`${renderBild()}`, 'Fertig. Entwurfsvisualisierung aus denselben Maßen, kein Foto.']]
  .map(([bild, text], i) => `<figure class="${i === 0 ? 'an' : ''}">${bild}<figcaption>${text}</figcaption></figure>`).join('');


const sit = (kind, titel, text) => `<li>${situation(kind)}<div><h3>${titel}</h3><p>${text}</p></div></li>`;

const eingabe = (name, label, fall) => `<label class="mass mass--${name}"><span>${label}</span><span class="mass-feld"><input name="${name}" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" placeholder="${FALL14[fall]}" aria-describedby="messen-hilfe"><i aria-hidden="true">mm</i></span></label>`;

const index = head('Gerade Möbel für schiefe Häuser | Eiche &amp; Form · Webbyu Demo', 'Fiktive Tischlerei für Altbauten: Einbaumöbel nach Aufmaß, die Schiefe nimmt eine angerissene Passleiste auf.', '') + defs('') + `<div class="seite">${wall}
${header('./', '')}
<main id="inhalt">
<section class="einstieg">
  <div class="einstieg-text">
    <h1>Gerade Möbel für <span class="schief">schiefe</span> Häuser.</h1>
    <p class="vorspann">Wir sind eine Tischlerei für Altbauten und ausgebaute Dachgeschosse in Lübeck und Umgebung. Kein Korpus, den wir bauen, ist schief. Fast keine Wand, an die er kommt, ist gerade.</p>
    <p class="aktionen"><a class="knopf" href="#messen">Ihre Nische messen</a><a class="textlink" href="#fall">So sah das bei Fall 14 aus</a></p>
  </div>
  <figure class="einstieg-bild">
    <div class="umschalt-bild" data-ansicht="render">${renderBild('eager')}</div>
    <div class="umschalt-bild" data-ansicht="ueberhoeht" hidden>${eingebaut(FALL14, 5, true)}</div>
    <figcaption class="schriftfeld">
      <dl><div><dt>Objekt</dt><dd>Fall 14, Garderobe, Flur von 1908</dd></div><div><dt>Maße</dt><dd>Millimeter, wie vor Ort gemessen</dd></div><div><dt>Darstellung</dt><dd data-darstellung>Entwurfsvisualisierung, kein Foto</dd></div><div><dt>Status</dt><dd>Fiktives Beispiel</dd></div></dl>
      <button type="button" class="textknopf" data-umschalten aria-pressed="false">Als Zeichnung zeigen</button>
    </figcaption>
  </figure>
</section>

<section class="fall" id="fall" aria-labelledby="fall-titel">
  <header class="abschnitt-kopf"><h2 id="fall-titel">Eine Garderobe für einen Flur von 1908.</h2><p>Dieselbe Nische in drei Zeichnungen und einer Visualisierung. Fall 14 ist erfunden, die Arbeitsweise nicht.</p></header>
  <div class="fall-stufen">
  <div class="buehne">${buehne}</div>
  ${stufe('stufe-aufmass', 1, 'Zuerst wird gemessen.', `<p>Unten ist die Nische ${de(FALL14.bottom)} mm breit, oben nur noch ${de(FALL14.top)}. Links ${de(FALL14.left)} mm hoch, rechts ${de(FALL14.right)}. Beide Wände neigen sich nach innen, der Boden fällt nach links, und in der rechten Ecke läuft eine Steigleitung.</p><p>Das ist für ein Haus dieses Alters nichts Besonderes. Besonders wäre es, wenn es niemand misst.</p>`, aufmass(FALL14, 5), 'Aufmaß. Abweichungen 5-fach überhöht, das Lot gestrichelt.')}
  ${stufe('stufe-entwurf', 2, 'Der Korpus bleibt gerade.', `<p>Türen und Schubkästen laufen nur in einem rechtwinkligen Korpus sauber. Wir richten ihn deshalb nach der engsten Stelle: ${de(g.width)} mm breit, oben ${de(g.leftTop)} mm Luft auf jeder Seite.</p><p>Nach unten wird die Luft größer. Das sieht zunächst nach einem Fehler aus und ist der Plan.</p>`, entwurf(FALL14, 5), 'Entwurf. Die rot markierte Fläche ist die Luft zur Wand.')}
  ${stufe('stufe-leiste', 3, 'Die Schiefe kommt in eine Leiste.', `<p>Beim Einbau reißen wir die Wand auf eine Eichenleiste an und passen sie von Hand ein. Rechts wird sie von ${de(g.rightTop)} mm oben auf ${de(g.rightBottom)} mm unten breiter, links von ${de(g.leftTop)} auf ${de(g.leftBottom)} mm. Sie folgt auch jeder Delle im Putz.</p><p>Es sind die einzigen Teile im Möbel, die nicht rechtwinklig sind. Silikon kommt nicht zum Einsatz.</p><figure class="detailbild">${detail(FALL14)}<figcaption>Schnitt durch die rechte Wand, Maßstab vergrößert.</figcaption></figure>`, leisten(FALL14, 5), 'Einbau. Passleisten in Eiche, Korpus unverändert.')}
  ${stufe('stufe-fertig', 4, 'Von vorn sieht man nichts mehr davon.', `<p>Dieselbe Nische, jetzt als Visualisierung in echtem Maßstab. Oben Türen für das, was niemand sehen soll, in der Mitte fünf Haken, unten eine Bank mit zwei Schubkästen. Eine Blende nimmt die Steigleitung auf und lässt sich abnehmen.</p><p><a class="textlink" href="fall-14/">Alle Maße und die Holzliste von Fall 14</a></p>`, `${renderBild()}`, 'Fertig. Entwurfsvisualisierung aus denselben Maßen, kein Foto.')}
  </div>
</section>

<section class="situationen" id="situationen" aria-labelledby="situationen-titel">
  <header class="abschnitt-kopf"><h2 id="situationen-titel">Das gibt es nicht nur im Flur.</h2></header>
  <ul>
    ${sit('schraege', 'Unter der Schräge', 'Ab welcher Höhe lohnt sich noch eine Tür? Wir zeichnen die nutzbare Tiefe, bevor wir über Fronten reden.')}
    ${sit('erker', 'Im Erker', 'Kein Winkel hat 90 Grad, und die Bank soll trotzdem dicht an den Wänden liegen. Die Winkel nehmen wir mit einer Schablone ab.')}
    ${sit('heizung', 'Vor dem Heizkörper', 'Die Wärme muss heraus, das Thermostat erreichbar bleiben. Die Verkleidung richtet sich danach, nicht umgekehrt.')}
    ${sit('tuer', 'Um die Tür herum', 'Die Bücherwand läuft um die Öffnung. Die Zarge ist selten so gerade wie das Regal, das an sie anschließt.')}
  </ul>
</section>

<section class="messen" id="messen" aria-labelledby="messen-titel">
  <header class="messen-kopf">
    <h2 id="messen-titel">Messen Sie Ihre Nische.</h2>
    <p id="messen-hilfe">Ein Zollstock reicht: zwei Breiten, zwei Höhen, jeweils direkt an Wand, Boden und Decke. Ungenau ist nicht schlimm, wir messen beim Termin ohnehin selbst nach.</p>
  </header>
  <form class="messen-form" data-messen novalidate>
    <fieldset disabled>
      <legend class="nur-sr">Maße Ihrer Nische</legend>
      <div class="messfeld">
        ${eingabe('top', 'Breite oben', 'top')}
        ${eingabe('left', 'Höhe links', 'left')}
        <div class="messbild" data-messbild data-beispiel="true">${nische(FALL14, 'Beispiel Fall 14, Abweichungen überhöht gezeichnet.')}</div>
        ${eingabe('right', 'Höhe rechts', 'right')}
        ${eingabe('bottom', 'Breite unten', 'bottom')}
      </div>
      <div class="messen-ergebnis" aria-live="polite" data-ergebnis>
        <p class="ergebnis-satz">Die Zeichnung zeigt noch Fall 14. Sobald Sie vier Maße eintragen, zeichnet sie Ihre Nische.</p>
      </div>
      <div class="kontakt">
        <label>Ihr Name<input name="name" required maxlength="100" autocomplete="off"></label>
        <label>E-Mail<input name="email" type="email" required maxlength="160" autocomplete="off"></label>
        <label class="kontakt-breit">Was soll dort hinein?<textarea name="message" required minlength="10" maxlength="3000" rows="3" placeholder="Zum Beispiel: Garderobe für vier Personen, Schuhe sollen hinter eine Tür."></textarea></label>
        <p class="kontakt-fehler" data-fehler role="alert" hidden></p>
        <p class="kontakt-fuss"><button class="knopf" type="submit">Anfrage prüfen</button><span>Zum Ausprobieren: Nur Beispieldaten verwenden. Es wird nichts versendet.</span></p>
      </div>
    </fieldset>
    <noscript><p class="kontakt-noscript">Für die Live-Zeichnung und die Demo-Anfrage aktivieren Sie bitte JavaScript. Alle anderen Inhalte bleiben lesbar.</p></noscript>
  </form>
  <div class="messen-pruefung" data-pruefung hidden tabindex="-1"><h3>Ihre Anfrage im Überblick</h3><dl></dl><p>Diese Vorschau bleibt ausschließlich in dieser geöffneten Seite.</p><p class="aktionen"><button class="knopf" type="button" data-bestaetigen>Demo-Anfrage abschließen</button><button class="textknopf" type="button" data-korrigieren>Angaben korrigieren</button></p></div>
  <div class="messen-pruefung" data-erfolg hidden tabindex="-1"><h3>Demo abgeschlossen.</h3><p>So könnte eine Bestätigung aussehen: „Danke, wir melden uns mit einem Terminvorschlag fürs Aufmaß.“ Ihre Anfrage wurde nicht versendet.</p><p class="aktionen"><button class="textknopf" type="button" data-neu>Erneut ausprobieren</button></p></div>
</section>

<section class="werkstatt" id="werkstatt" aria-labelledby="werkstatt-titel">
  <h2 id="werkstatt-titel">Zum Aufmaß kommt, wer später einbaut.</h2>
  <div class="werkstatt-spalten">
    <div><p>Zwei Tischler, eine Werkstatt, ein Transporter. Dazwischen gibt es niemanden, dem wir etwas erklären müssten. Wer Ihre Wand gemessen hat, reißt sie auch an.</p><p>Preise nennen wir auf Anfrage und erst nach dem Aufmaß.</p></div>
    <div><h3>Was wir nicht machen</h3><ul><li>Keine Möbel ohne Aufmaß.</li><li>Kein Preis nach Foto. Ein Foto und vier Maße reichen für eine erste Einschätzung, nicht für ein Angebot.</li><li>Keine Silikonfuge, wo eine Leiste hingehört.</li></ul></div>
  </div>
</section>
</main>
${footer('')}
</div><script type="module" src="app.js"></script></body></html>`;

// Holzliste aus derselben Geometrie
const W = g.width, H = g.height, innen = W - 48, tuer = W / 2;
const holz = [
  ['01', 'Seite', 2, H, 340, 24, 'Eiche massiv'],
  ['02', 'Deckel und Boden', 2, innen, 340, 24, 'Eiche massiv'],
  ['03', 'Boden über Haken', 1, innen, 320, 24, 'Eiche massiv'],
  ['04', 'Rückwand', 1, H - 40, innen + 16, 8, 'Eiche furniert'],
  ['05', 'Tür oben', 2, 556, tuer - 3, 19, 'Eiche massiv'],
  ['06', 'Bankplatte', 1, W, 340, 44, 'Eiche massiv'],
  ['07', 'Schubkastenfront', 2, 382, tuer - 3, 19, 'Eiche massiv'],
  ['08', 'Hakenleiste', 1, W - 120, 76, 22, 'Eiche massiv'],
  ['09', 'Blende Steigleitung', 1, H - 1060, 120, 19, 'Eiche massiv, abnehmbar'],
  ['10', 'Passleiste links', 1, g.minH, `${g.leftTop} bis ${g.leftBottom}`, 30, 'Eiche massiv, angerissen'],
  ['11', 'Passleiste rechts', 1, g.minH, `${g.rightTop} bis ${g.rightBottom}`, 30, 'Eiche massiv, angerissen'],
  ['12', 'Bodenleiste', 1, W, `${g.plinthRight} bis ${g.plinthLeft}`, 19, 'Eiche massiv, angerissen'],
];
const istKeil = r => typeof r[4] === 'string';
const fall = head('Fall 14: Garderobe für einen Flur von 1908 | Eiche &amp; Form · Webbyu Demo', 'Fiktiver Raumfall einer Tischlerei: Aufmaß, Zeichnung und Holzliste einer Garderobe in einer schiefen Altbaunische.', '../') + defs('../') + `<div class="seite">${wall}
${header('../', '../')}
<main id="inhalt" class="akte">
<header class="akte-kopf">
  <p class="akte-zurueck"><a class="textlink" href="../#fall">Zurück zur Übersicht</a></p>
  <h1>Fall 14</h1>
  <p class="vorspann">Eine Garderobe für einen Flur von 1908: vier Personen, zu wenig Platz und eine Steigleitung, die dort bleiben muss, wo sie ist.</p>
  <dl class="schriftfeld schriftfeld--breit"><div><dt>Objekt</dt><dd>Flurnische, Baujahr 1908</dd></div><div><dt>Möbel</dt><dd>Einbau-Garderobe, Eiche</dd></div><div><dt>Korpus</dt><dd>${de(g.width)} × ${de(g.height)} × 340 mm</dd></div><div><dt>Status</dt><dd>Fiktives Beispiel</dd></div></dl>
</header>
<section class="akte-vergleich" aria-labelledby="vergleich-titel">
  <h2 id="vergleich-titel">Beide Zeichnungen maßstäblich.</h2>
  <p class="akte-absatz">${de(FALL14.bottom - FALL14.top)} mm Unterschied in der Breite und ${de(FALL14.left - FALL14.right)} mm in der Höhe sind in einer maßstäblichen Zeichnung kaum zu sehen. Am Möbel würden Sie sie sofort sehen: an einer Tür, die nicht schließt, oder einer Fuge, die nach unten immer breiter wird.</p>
  <div class="akte-paar">
    <figure>${aufmass(FALL14, 1)}<figcaption>Vorher: die Nische, wie sie ist.</figcaption></figure>
    <figure>${eingebaut(FALL14)}<figcaption>Nachher: die Garderobe, wie sie aussehen soll.</figcaption></figure>
  </div>
</section>
<section class="akte-liste" aria-labelledby="liste-titel">
  <h2 id="liste-titel">Holzliste</h2>
  <p class="akte-absatz">Drei Positionen sind nicht rechtwinklig. Alles andere könnte in jeder Werkstatt entstehen. Diese drei entstehen erst vor Ort.</p>
  <table>
    <thead><tr><th scope="col">Pos.</th><th scope="col">Teil</th><th scope="col">Stück</th><th scope="col">Länge</th><th scope="col">Breite</th><th scope="col">Stärke</th><th scope="col">Material</th></tr></thead>
    <tbody>${holz.map(r => `<tr${istKeil(r) ? ' class="keil"' : ''}><td data-t="Pos.">${r[0]}</td><th scope="row">${r[1]}</th><td data-t="Stück">${r[2]}</td><td data-t="Länge">${de(r[3])}</td><td data-t="Breite">${typeof r[4] === 'string' ? r[4] : de(r[4])}</td><td data-t="Stärke">${r[5]}</td><td data-t="Material">${r[6]}</td></tr>`).join('')}</tbody>
  </table>
  <p class="akte-klein">Maße in Millimetern. Erfundenes Beispiel, keine Bauanleitung.</p>
</section>
<section class="akte-detail" aria-labelledby="detail-titel">
  <div><h2 id="detail-titel">Warum nicht einfach eine gerade Leiste?</h2><p class="akte-absatz">Weil dann oben ${de(g.rightTop)} mm und unten ${de(g.rightBottom)} mm offen blieben, und weil Putz nie eben ist. Die Leiste wird an die Wand gehalten, die Kontur mit dem Zirkel übertragen und von Hand bis an den Riss gehobelt. Das dauert, und es ist der Grund, warum der Einbau bei uns länger dauert als das Aufstellen.</p></div>
  <figure class="detailbild">${detail(FALL14)}<figcaption>Schnitt durch die rechte Wand, oben und unten. Maßstab vergrößert.</figcaption></figure>
</section>
<section class="akte-weiter"><h2>Und bei Ihnen?</h2><p class="akte-absatz">Vier Maße genügen für eine erste Einschätzung.</p><a class="knopf" href="../#messen">Ihre Nische messen</a></section>
</main>
${footer('../')}
</div></body></html>`;

const here = new URL('./', import.meta.url);
writeFileSync(new URL('index.html', here), index);
mkdirSync(new URL('fall-14/', here), { recursive: true });
writeFileSync(new URL('fall-14/index.html', here), fall);
console.log('gebaut', index.length, fall.length);
