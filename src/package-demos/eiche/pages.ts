// Inhalte der Business-Demo Eiche & Form nach dem Pilot vom 4. November 2026 (pilot/eiche-form).
// Kopf, Demo-Leiste und Fuß kommen weiter aus page.ts; hier entsteht nur der Hauptinhalt.
import { FALL14, FALL22, FALL9, aufmass, buecherwand, de, defs, detail, eingebaut, entwurf, fall22Leisten, kuechenplan, leisten, nische, situation, solve } from './drawings';

type Ctx = { base: string; link: (slug?: string) => string; pkg: { name: string; description: string; features: string[] } };

const g = solve(FALL14);
const RENDER_ALT = 'Entwurfsvisualisierung, kein Foto: Garderobe aus Eiche in einer Altbaunische, Sonnenlicht fällt von links durch ein Sprossenfenster.';
const render = (base: string, loading: 'eager' | 'lazy' = 'lazy') => `<img class="ef-render" src="${base}package-demos/eiche-fall14.webp" width="900" height="1125" loading="${loading}"${loading === 'eager' ? ' fetchpriority="high"' : ''} alt="${RENDER_ALT}">`;
const knopf = (href: string, text: string) => `<a class="ef-knopf" href="${href}">${text}</a>`;
const textlink = (href: string, text: string) => `<a class="ef-textlink" href="${href}">${text}</a>`;
const kopf = (titel: string, vorspann: string, h = 'h1') => `<header class="ef-seitenkopf"><${h}>${titel}</${h}><p class="ef-vorspann">${vorspann}</p></header>`;
const schriftfeld = (felder: [string, string][], extra = '') => `<div class="ef-schriftfeld"><dl>${felder.map(([k, v]) => `<div><dt>${k}</dt><dd${k === 'Darstellung' ? ' data-darstellung' : ''}>${v}</dd></div>`).join('')}</dl>${extra}</div>`;

const stufen: [string, string, string, string][] = [
  ['ef-stufe-aufmass', 'Zuerst wird gemessen.', `<p>Unten ist die Nische ${de(FALL14.bottom)} mm breit, oben nur noch ${de(FALL14.top)}. Links ${de(FALL14.left)} mm hoch, rechts ${de(FALL14.right)}. Beide Wände neigen sich nach innen, der Boden fällt nach links, und in der rechten Ecke läuft eine Steigleitung.</p><p>Das ist für ein Haus dieses Alters nichts Besonderes. Besonders wäre es, wenn es niemand misst.</p>`, 'Aufmaß. Abweichungen 5-fach überhöht, das Lot gestrichelt.'],
  ['ef-stufe-entwurf', 'Der Korpus bleibt gerade.', `<p>Türen und Schubkästen laufen nur in einem rechtwinkligen Korpus sauber. Wir richten ihn deshalb nach der engsten Stelle: ${de(g.width)} mm breit, oben ${de(g.leftTop)} mm Luft auf jeder Seite.</p><p>Nach unten wird die Luft größer. Das sieht zunächst nach einem Fehler aus und ist der Plan.</p>`, 'Entwurf. Die rot markierte Fläche ist die Luft zur Wand.'],
  ['ef-stufe-leiste', 'Die Schiefe kommt in eine Leiste.', `<p>Beim Einbau reißen wir die Wand auf eine Eichenleiste an und passen sie von Hand ein. Rechts wird sie von ${de(g.rightTop)} mm oben auf ${de(g.rightBottom)} mm unten breiter, links von ${de(g.leftTop)} auf ${de(g.leftBottom)} mm. Sie folgt auch jeder Delle im Putz.</p><p>Es sind die einzigen Teile im Möbel, die nicht rechtwinklig sind. Silikon kommt nicht zum Einsatz.</p>`, 'Einbau. Passleisten in Eiche, Korpus unverändert.'],
  ['ef-stufe-fertig', 'Von vorn sieht man nichts mehr davon.', '', 'Fertig. Entwurfsvisualisierung aus denselben Maßen, kein Foto.'],
];

function fall({ base, link }: Ctx) {
  const bilder = [aufmass(FALL14, 5), entwurf(FALL14, 5), leisten(FALL14, 5), render(base)];
  const fertigText = `<p>Dieselbe Nische, jetzt als Visualisierung in echtem Maßstab. Oben Türen für das, was niemand sehen soll, in der Mitte fünf Haken, unten eine Bank mit zwei Schubkästen. Eine Blende nimmt die Steigleitung auf und lässt sich abnehmen.</p><p>${textlink(link('projekte'), 'Alle Maße und die Holzliste von Fall 14')}</p>`;
  const buehne = bilder.map((b, i) => `<figure class="${i === 0 ? 'an' : ''}">${b}<figcaption>${stufen[i][3]}</figcaption></figure>`).join('');
  const artikel = stufen.map(([id, titel, text, cap], i) => `<article class="ef-stufe${i === 0 ? ' an' : ''}" id="${id}"><figure class="ef-stufe-bild">${bilder[i]}<figcaption>${cap}</figcaption></figure><div class="ef-stufe-text"><h3>${titel}</h3>${i === 3 ? fertigText : text}${i === 2 ? `<figure class="ef-detailbild">${detail(FALL14)}<figcaption>Schnitt durch die rechte Wand, Maßstab vergrößert.</figcaption></figure>` : ''}</div></article>`).join('');
  return `<section class="ef-fall" id="fall" aria-labelledby="ef-fall-titel"><header class="ef-abschnittkopf"><h2 id="ef-fall-titel">Eine Garderobe für einen Flur von 1908.</h2><p>Dieselbe Nische in drei Zeichnungen und einer Visualisierung. Fall 14 ist erfunden, die Arbeitsweise nicht.</p></header><div class="ef-fall-stufen"><div class="ef-buehne">${buehne}</div>${artikel}</div></section>`;
}

const SITUATIONEN: ['schraege' | 'erker' | 'heizung' | 'tuer', string, string][] = [
  ['schraege', 'Unter der Schräge', 'Ab welcher Höhe lohnt sich noch eine Tür? Wir zeichnen die nutzbare Tiefe, bevor wir über Fronten reden.'],
  ['erker', 'Im Erker', 'Kein Winkel hat 90 Grad, und die Bank soll trotzdem dicht an den Wänden liegen. Die Winkel nehmen wir mit einer Schablone ab.'],
  ['heizung', 'Vor dem Heizkörper', 'Die Wärme muss heraus, das Thermostat erreichbar bleiben. Die Verkleidung richtet sich danach, nicht umgekehrt.'],
  ['tuer', 'Um die Tür herum', 'Die Bücherwand läuft um die Öffnung. Die Zarge ist selten so gerade wie das Regal, das an sie anschließt.'],
];
const situationen = (titel: string, h = 'h2') => `<section class="ef-situationen" aria-label="${titel}"><header class="ef-abschnittkopf"><${h}>${titel}</${h}></header><ul>${SITUATIONEN.map(([k, t, p]) => `<li>${situation(k)}<div><h3>${t}</h3><p>${p}</p></div></li>`).join('')}</ul></section>`;

const NICHT = `<h3>Was wir nicht machen</h3><ul><li>Keine Möbel ohne Aufmaß.</li><li>Kein Preis nach Foto. Ein Foto und vier Maße reichen für eine erste Einschätzung, nicht für ein Angebot.</li><li>Keine Silikonfuge, wo eine Leiste hingehört.</li></ul>`;

function home(ctx: Ctx) {
  const { base, link } = ctx;
  return `<section class="ef-einstieg"><div class="ef-einstieg-text"><h1>Gerade Möbel für <span class="ef-schief">schiefe</span> Häuser.</h1><p class="ef-vorspann">Wir sind eine Tischlerei für Altbauten und ausgebaute Dachgeschosse in Lübeck und Umgebung. Kein Korpus, den wir bauen, ist schief. Fast keine Wand, an die er kommt, ist gerade.</p><p class="ef-aktionen">${knopf(link('kontakt'), 'Ihre Nische messen')}${textlink('#fall', 'So sah das bei Fall 14 aus')}</p></div>`
    + `<figure class="ef-einstieg-bild"><div class="ef-umschalt" data-ansicht="render">${render(base, 'eager')}</div><div class="ef-umschalt" data-ansicht="plan" hidden>${eingebaut(FALL14, 5, true)}</div><figcaption>${schriftfeld([['Objekt', 'Fall 14, Garderobe, Flur von 1908'], ['Maße', 'Millimeter, wie vor Ort gemessen'], ['Darstellung', 'Entwurfsvisualisierung, kein Foto'], ['Status', 'Fiktives Beispiel']], '<button type="button" class="ef-textknopf" data-umschalten aria-pressed="false">Als Zeichnung zeigen</button>')}</figcaption></figure></section>`
    + fall(ctx)
    + situationen('Das gibt es nicht nur im Flur.')
    + `<section class="ef-band"><div><h2>Messen Sie Ihre Nische.</h2><p>Zwei Breiten, zwei Höhen, ein Zollstock. Die Seite zeichnet daraus Ihre Nische und die Leisten, die sie bräuchte.</p>${knopf(link('kontakt'), 'Zum Messen')}</div><div class="ef-band-bild">${nische(FALL14, 'Beispiel Fall 14, Abweichungen überhöht gezeichnet.')}</div></section>`
    + `<section class="ef-werkstatt"><h2>Zum Aufmaß kommt, wer später einbaut.</h2><div class="ef-spalten"><div><p>Zwei Tischler, eine Werkstatt, ein Transporter. Wer Ihre Wand gemessen hat, reißt sie auch an.</p><p>${textlink(link('ueber-uns'), 'Die Werkstatt kennenlernen')}</p></div><div>${NICHT}</div></div></section>`;
}

function leistungen({ link }: Ctx) {
  const schritte: [string, string][] = [
    ['Aufmaß', 'Wir kommen vorbei, messen an mehreren Höhen und notieren, was im Weg ist: Leitungen, Schalter, Fußleisten. Danach wissen Sie, was möglich ist.'],
    ['Zeichnung', 'Sie bekommen eine Werkzeichnung mit allen Maßen, Fronten und dem Holz. Erst wenn sie stimmt, schneiden wir zu.'],
    ['Werkstatt', 'Korpus, Fronten und Leisten entstehen bei uns. Die Leisten bleiben bewusst etwas zu breit.'],
    ['Einbau', 'Vor Ort reißen wir die Wand auf die Leisten an und passen sie von Hand ein. Dafür planen wir mehr Zeit ein als fürs Aufstellen.'],
  ];
  return kopf('Was wir bauen', 'Einbaumöbel und Küchen für Räume, in denen kein Winkel stimmt. Alles nach Aufmaß, alles mit Zeichnung.')
    + `<section class="ef-zwei"><a class="ef-karte" href="${link('leistungen/moebel')}">${situation('schraege')}<h2>Einbaumöbel nach Aufmaß</h2><p>Garderoben, Schränke unter der Schräge, Bänke im Erker, Regale um Türen.</p></a><a class="ef-karte" href="${link('leistungen/kuechen')}">${kuechenplan(12)}<h2>Küchen in alten Mauern</h2><p>Zeilen und Arbeitsplatten für Wände, die sich wölben, und Decken, die fallen.</p></a></section>`
    + `<section class="ef-ablauf" aria-labelledby="ef-ablauf-titel"><h2 id="ef-ablauf-titel">So läuft es ab.</h2><ol>${schritte.map(([t, p]) => `<li><h3>${t}</h3><p>${p}</p></li>`).join('')}</ol></section>`
    + `<section class="ef-werkstatt ef-werkstatt--hell"><div class="ef-spalten"><div><h2>Angebot nach dem Aufmaß.</h2><p>Preise nennen wir auf Anfrage und erst, wenn wir den Raum gesehen haben. Für eine erste Einschätzung reichen vier Maße.</p>${knopf(link('kontakt'), 'Ihre Nische messen')}</div><div>${NICHT}</div></div></section>`;
}

function moebel({ base, link }: Ctx) {
  return kopf('Einbaumöbel nach Aufmaß', 'Ein Einbaumöbel nutzt jeden Zentimeter, den ein Raum hergibt. In einem alten Haus heißt das: auch die Zentimeter, die schief sind.')
    + `<section class="ef-geteilt"><figure>${render(base)}<figcaption>Fall 14, Entwurfsvisualisierung, kein Foto.</figcaption></figure><div><h2>Was wir oft bauen</h2><ul class="ef-liste"><li><strong>Garderoben in Flurnischen</strong> mit Bank, Haken und geschlossenen Fächern.</li><li><strong>Schränke unter der Schräge</strong>, vorn hoch, hinten mit Schubkästen statt Türen.</li><li><strong>Sitzbänke im Erker</strong>, deren Kanten den Wänden folgen.</li><li><strong>Bücherwände um Türen</strong>, mit einer Leiste an der Zarge.</li><li><strong>Heizkörperverkleidungen</strong>, die Luft durchlassen und das Ventil frei lassen.</li></ul>${textlink(link('projekte'), 'Fall 14 im Detail')}</div></section>`
    + situationen('Vier typische Stellen')
    + `<section class="ef-geteilt ef-geteilt--text"><div><h2>Holz und Oberfläche</h2><p>Meist Eiche, massiv für Fronten und Leisten, furniert für große Rückwände. Geölt, damit Kratzer sich ausbessern lassen. Andere Hölzer und lackierte Fronten sind möglich; Muster bringen wir zum Aufmaß mit.</p></div><div><h2>Was das Aufmaß klärt</h2><p>Wie schief es wirklich ist, wo Leitungen laufen, was an der Fußleiste passiert und ob das Möbel durchs Treppenhaus passt. Gerade das Letzte wird gern vergessen.</p>${knopf(link('kontakt'), 'Ihre Nische messen')}</div></section>`;
}

function kuechen({ link }: Ctx) {
  return kopf('Küchen in alten Mauern', 'Eine Küchenzeile ist eine lange gerade Linie. Altbauwände sind das selten. Wir bauen die Korpusse selbst und planen Geräte und Spüle nach Ihrer Wahl ein.')
    + `<section class="ef-breitbild"><figure>${kuechenplan(12)}<figcaption>Fall 9 im Grundriss, Abweichung 12-fach überhöht. Rot: der Teil der Platte, der hinter den Schränken an die Wand angerissen wird.</figcaption></figure></section>`
    + `<section class="ef-geteilt ef-geteilt--text"><div><h2>Die Platte folgt der Wand</h2><p>Unterschränke stehen gerade, sonst klemmen Schubkästen. Die Arbeitsplatte wird hinten an die Wand angerissen und angepasst. So bleibt keine Fuge, in die Krümel fallen, und die Vorderkante ist trotzdem gerade.</p></div><div><h2>Oben wird es eng</h2><p>Fällt die Decke, bekommen Oberschränke eine keilförmige Blende bis an die Decke. Die Türen bleiben gleich hoch, nur die Blende ändert sich.</p></div></section>`
    + `<section class="ef-werkstatt ef-werkstatt--hell"><div class="ef-spalten"><div><h2>Was wir nicht liefern</h2><p>Elektrogeräte kaufen Sie selbst oder über Ihren Händler. Wir planen sie mit ein und bauen sie ein. Wasser- und Elektroanschlüsse übernimmt ein Fachbetrieb.</p></div><div><h2>Fall 9</h2><p>Eine Küchenzeile von ${de(FALL9.laenge)} mm an einer Wand, die sich in der Mitte ${FALL9.bauch} mm vorwölbt.</p>${textlink(link('projekte/kueche'), 'Fall 9 ansehen')}</div></div></section>`;
}

function holzliste() {
  const W = g.width, H = g.height, innen = W - 48, tuer = W / 2;
  const zeilen: [string, string, number, number, number | string, number, string][] = [
    ['01', 'Seite', 2, H, 340, 24, 'Eiche massiv'], ['02', 'Deckel und Boden', 2, innen, 340, 24, 'Eiche massiv'],
    ['03', 'Boden über Haken', 1, innen, 320, 24, 'Eiche massiv'], ['04', 'Rückwand', 1, H - 40, innen + 16, 8, 'Eiche furniert'],
    ['05', 'Tür oben', 2, 556, tuer - 3, 19, 'Eiche massiv'], ['06', 'Bankplatte', 1, W, 340, 44, 'Eiche massiv'],
    ['07', 'Schubkastenfront', 2, 382, tuer - 3, 19, 'Eiche massiv'], ['08', 'Hakenleiste', 1, W - 120, 76, 22, 'Eiche massiv'],
    ['09', 'Blende Steigleitung', 1, H - 1060, 120, 19, 'Eiche massiv, abnehmbar'],
    ['10', 'Passleiste links', 1, g.minH, `${g.leftTop} bis ${g.leftBottom}`, 30, 'Eiche massiv, angerissen'],
    ['11', 'Passleiste rechts', 1, g.minH, `${g.rightTop} bis ${g.rightBottom}`, 30, 'Eiche massiv, angerissen'],
    ['12', 'Bodenleiste', 1, W, `${g.plinthRight} bis ${g.plinthLeft}`, 19, 'Eiche massiv, angerissen'],
  ];
  return `<table class="ef-holzliste"><caption class="pd-sr">Holzliste Fall 14</caption><thead><tr><th scope="col">Pos.</th><th scope="col">Teil</th><th scope="col">Stück</th><th scope="col">Länge</th><th scope="col">Breite</th><th scope="col">Stärke</th><th scope="col">Material</th></tr></thead><tbody>${zeilen.map(r => `<tr${typeof r[4] === 'string' ? ' class="ef-keil"' : ''}><td data-t="Pos.">${r[0]}</td><th scope="row">${r[1]}</th><td data-t="Stück">${r[2]}</td><td data-t="Länge">${de(r[3])}</td><td data-t="Breite">${typeof r[4] === 'string' ? r[4] : de(r[4])}</td><td data-t="Stärke">${r[5]}</td><td data-t="Material">${r[6]}</td></tr>`).join('')}</tbody></table>`;
}

function projekte({ base, link }: Ctx) {
  return `<header class="ef-seitenkopf ef-akte-kopf"><p class="ef-dachzeile">Fall 14</p><h1>Garderobe für einen Flur von 1908</h1><p class="ef-vorspann">Vier Personen, zu wenig Platz und eine Steigleitung, die dort bleiben muss, wo sie ist.</p>${schriftfeld([['Objekt', 'Flurnische, Baujahr 1908'], ['Möbel', 'Einbau-Garderobe, Eiche'], ['Korpus', `${de(g.width)} × ${de(g.height)} × 340 mm`], ['Status', 'Fiktives Beispiel']])}</header>`
    + `<section class="ef-akte-vergleich" aria-labelledby="ef-vergleich"><h2 id="ef-vergleich">Die Nische, wie sie ist, und das Möbel darin.</h2><p class="ef-absatz">${de(FALL14.bottom - FALL14.top)} mm Unterschied in der Breite und ${de(FALL14.left - FALL14.right)} mm in der Höhe sind in einer maßstäblichen Zeichnung kaum zu sehen. Am Möbel würden Sie sie sofort sehen: an einer Tür, die nicht schließt, oder einer Fuge, die nach unten immer breiter wird.</p><div class="ef-paar"><figure>${aufmass(FALL14, 1)}<figcaption>Vorher: die Nische, wie sie ist.</figcaption></figure><figure>${render(base)}<figcaption>Nachher: Entwurfsvisualisierung aus denselben Maßen, kein Foto.</figcaption></figure></div></section>`
    + `<section class="ef-akte-liste" aria-labelledby="ef-liste"><h2 id="ef-liste">Holzliste</h2><p class="ef-absatz">Drei Positionen sind nicht rechtwinklig. Alles andere könnte in jeder Werkstatt entstehen. Diese drei entstehen erst vor Ort.</p>${holzliste()}<p class="ef-klein">Maße in Millimetern. Erfundenes Beispiel, keine Bauanleitung.</p></section>`
    + `<section class="ef-geteilt" aria-labelledby="ef-detail"><div><h2 id="ef-detail">Warum nicht einfach eine gerade Leiste?</h2><p class="ef-absatz">Weil dann oben ${de(g.rightTop)} mm und unten ${de(g.rightBottom)} mm offen blieben, und weil Putz nie eben ist. Die Leiste wird an die Wand gehalten, die Kontur mit dem Zirkel übertragen und von Hand bis an den Riss gehobelt.</p></div><figure class="ef-detailbild">${detail(FALL14)}<figcaption>Schnitt durch die rechte Wand, oben und unten. Maßstab vergrößert.</figcaption></figure></section>`
    + `<section class="ef-weitere" aria-labelledby="ef-weitere"><h2 id="ef-weitere">Zwei weitere Fälle</h2><div class="ef-zwei"><a class="ef-karte" href="${link('projekte/wohnraum')}">${situation('tuer')}<h3>Fall 22: Bücherwand um eine Tür</h3><p>Die Decke fällt, die Zarge steht schief, die Regalböden sollen trotzdem waagerecht sein.</p></a><a class="ef-karte" href="${link('projekte/kueche')}">${kuechenplan(12)}<h3>Fall 9: Küchenzeile an einer gewölbten Wand</h3><p>Gerade Schränke, eine angerissene Arbeitsplatte und keine Krümelfuge.</p></a></div></section>`;
}

function fall22({ link }: Ctx) {
  const l = fall22Leisten(), f = FALL22;
  return `<header class="ef-seitenkopf ef-akte-kopf"><p class="ef-dachzeile">Fall 22</p><h1>Bücherwand um eine Tür</h1><p class="ef-vorspann">Ein Wohnzimmer mit 3,40 m Wand, einer Tür fast in der Mitte und dem Wunsch, dass die Bücher sie einrahmen.</p>${schriftfeld([['Objekt', 'Wohnzimmer, Baujahr um 1900'], ['Möbel', 'Regalwand, Eiche'], ['Wand', `${de(f.breite)} mm breit`], ['Status', 'Fiktives Beispiel']])}</header>`
    + `<section class="ef-breitbild"><figure>${buecherwand(5)}<figcaption>Ansicht. Abweichungen 5-fach überhöht, das Lot gestrichelt.</figcaption></figure></section>`
    + `<section class="ef-geteilt ef-geteilt--text"><div><h2>Die Aufgabe</h2><p>Die Decke fällt von links nach rechts um ${de(f.hoeheL - f.hoeheR)} mm. Die linke Türzarge steht ${f.zarge} mm außer Lot. Über der Tür sollen Regalböden durchlaufen, ohne dass man das eine oder das andere sieht.</p></div><div><h2>Die Lösung</h2><p>Die Regalkorpusse stehen im Lot und waagerecht. Oben schließt eine Deckenleiste an, die von ${l.decke[0]} auf ${l.decke[1]} mm breiter wird. An der Zarge sitzt eine Leiste von ${l.zarge[0]} bis ${l.zarge[1]} mm. Beide werden vor Ort angerissen.</p></div></section>`
    + `<section class="ef-werkstatt ef-werkstatt--hell"><div class="ef-spalten"><div><h2>Ähnliche Wand bei Ihnen?</h2><p>Messen Sie die Wandbreite, die Höhe an beiden Enden und die Tür. Den Rest klären wir beim Aufmaß.</p>${knopf(link('kontakt'), 'Ihre Maße schicken')}</div><div><p>${textlink(link('projekte'), 'Zurück zu Fall 14')}</p><p>${textlink(link('projekte/kueche'), 'Fall 9: Küchenzeile')}</p></div></div></section>`;
}

function fall9({ link }: Ctx) {
  const f = FALL9;
  return `<header class="ef-seitenkopf ef-akte-kopf"><p class="ef-dachzeile">Fall 9</p><h1>Küchenzeile an einer gewölbten Wand</h1><p class="ef-vorspann">Eine Küche in einem Haus mit dicken Mauern. Die Wand ist nicht schief, sie hat einen Bauch.</p>${schriftfeld([['Objekt', 'Küche, Erdgeschoss, Bruchsteinwand'], ['Möbel', 'Küchenzeile, Eiche'], ['Länge', `${de(f.laenge)} mm`], ['Status', 'Fiktives Beispiel']])}</header>`
    + `<section class="ef-breitbild"><figure>${kuechenplan(12)}<figcaption>Grundriss, Abweichung 12-fach überhöht. Rot gestrichelt: die Rückseite der geraden Schränke. Rot gefüllt: der angerissene Teil der Platte.</figcaption></figure></section>`
    + `<section class="ef-geteilt ef-geteilt--text"><div><h2>Die Aufgabe</h2><p>In der Mitte wölbt sich die Wand ${f.bauch} mm in den Raum. Eine gerade Arbeitsplatte würde an den Enden ${f.bauch} mm Luft lassen, eine gebogene Zeile würde Schubkästen verklemmen.</p></div><div><h2>Die Lösung</h2><p>Die Unterschränke stehen gerade und berühren die Wand nur in der Mitte. Die Arbeitsplatte ist an den Enden ${de(f.tiefe + f.bauch)} mm tief, in der Mitte ${de(f.tiefe)}, und folgt hinten der Wand. Vorn ist sie gerade.</p></div></section>`
    + `<section class="ef-werkstatt ef-werkstatt--hell"><div class="ef-spalten"><div><h2>Eine Küche in Planung?</h2><p>Für eine erste Einschätzung reichen die Länge der Wand und ein Foto. Die Wölbung messen wir selbst.</p>${knopf(link('kontakt'), 'Anfrage beginnen')}</div><div><p>${textlink(link('leistungen/kuechen'), 'Küchen in alten Mauern')}</p><p>${textlink(link('projekte/wohnraum'), 'Fall 22: Bücherwand')}</p></div></div></section>`;
}

function werkstatt({ link }: Ctx) {
  return kopf('Zum Aufmaß kommt, wer einbaut.', 'Zwei Tischler, eine Werkstatt in Lübeck, ein Transporter. Dazwischen gibt es niemanden, dem wir etwas erklären müssten.')
    + `<section class="ef-geteilt"><div><h2>Warum dieselben Leute?</h2><p class="ef-absatz">Beim Aufmaß fällt auf, was keine Zeichnung zeigt: ein Rohr hinter dem Putz, eine Fußleiste, die nicht wegkann, ein Treppenhaus, durch das kein Schrank am Stück passt. Wer das gesehen hat, plant anders und baut anders ein.</p><p class="ef-absatz">Deshalb macht bei uns dieselbe Person Aufmaß, Zeichnung und Einbau.</p></div><figure class="ef-detailbild">${detail(FALL14)}<figcaption>Die Leiste folgt der Putzkante. Angerissen wird vor Ort.</figcaption></figure></section>`
    + `<section class="ef-ablauf" aria-labelledby="ef-tag"><h2 id="ef-tag">Ein Einbautag</h2><ol><li><h3>Morgens</h3><p>Korpus stellen, ins Lot bringen, an der Wand befestigen. Bis hier ist es wie überall.</p></li><li><h3>Mittags</h3><p>Leisten anhalten, die Wand mit dem Zirkel übertragen, hobeln, wieder anhalten. Meist dreimal pro Leiste.</p></li><li><h3>Nachmittags</h3><p>Fronten einhängen und einstellen, Griffe, Böden, Haken. Zum Schluss wird gesaugt.</p></li></ol></section>`
    + `<section class="ef-werkstatt"><div class="ef-spalten"><div><h2>Werkstatt in Lübeck</h2><p>Hier entstehen Korpusse, Fronten und Leisten. Besuch nach Absprache, Muster liegen bereit.</p>${knopf(link('kontakt'), 'Ihre Nische messen')}</div><div>${NICHT}</div></div></section>`;
}

const eingabe = (name: string, label: string, fall: number) => `<label class="ef-mass ef-mass--${name}"><span>${label}</span><span class="ef-mass-feld"><input name="${name}" inputmode="numeric" pattern="[0-9]{3,4}" maxlength="4" autocomplete="off" placeholder="${fall}" title="In Millimetern, zum Beispiel ${fall}" aria-describedby="ef-messen-hilfe" data-review="${label}" data-mass><i aria-hidden="true">mm</i></span></label>`;

function kontakt() {
  return `<section class="ef-messen" id="messen" aria-labelledby="ef-messen-titel"><header class="ef-messen-kopf"><h1 id="ef-messen-titel">Messen Sie Ihre Nische.</h1><p id="ef-messen-hilfe">Ein Zollstock reicht: zwei Breiten, zwei Höhen, jeweils direkt an Wand, Boden und Decke. Ungenau ist nicht schlimm, wir messen beim Termin ohnehin selbst nach. Die Maße sind freiwillig.</p></header>`
    + `<form class="ef-messen-form" data-demo-form><fieldset disabled><legend class="pd-sr">Maße und Anfrage</legend><div class="ef-messfeld">${eingabe('top', 'Breite oben', FALL14.top)}${eingabe('left', 'Höhe links', FALL14.left)}<div class="ef-messbild" data-messbild>${nische(FALL14, 'Beispiel Fall 14, Abweichungen überhöht gezeichnet.')}</div>${eingabe('right', 'Höhe rechts', FALL14.right)}${eingabe('bottom', 'Breite unten', FALL14.bottom)}</div>`
    + `<div class="ef-ergebnis" aria-live="polite" data-ergebnis><p class="ef-ergebnis-satz">Die Zeichnung zeigt noch Fall 14. Sobald Sie vier Maße eintragen, zeichnet sie Ihre Nische.</p></div>`
    + `<div class="ef-kontakt"><label>Ihr Name<input name="name" required maxlength="100" autocomplete="off"></label><label>E-Mail<input name="email" type="email" required maxlength="160" autocomplete="off"></label><label class="ef-breit">Was soll dort hinein?<textarea name="message" required minlength="10" maxlength="3000" rows="3" placeholder="Zum Beispiel: Garderobe für vier Personen, Schuhe sollen hinter eine Tür."></textarea></label><p class="ef-kontakt-fuss"><button class="ef-knopf" type="submit">Anfrage prüfen</button><span>Zum Ausprobieren: nur Beispieldaten verwenden. Es wird nichts versendet.</span></p></div></fieldset></form>`
    + `<noscript><p class="ef-noscript">Für die Live-Zeichnung und die Demo-Anfrage aktivieren Sie bitte JavaScript. Alle anderen Inhalte bleiben lesbar.</p></noscript>`
    + `<div class="ef-pruefung" data-form-review hidden tabindex="-1"><h2>Ihre Anfrage im Überblick</h2><dl></dl><p>Diese Vorschau gibt es nur in dieser geöffneten Seite.</p><p class="ef-aktionen"><button class="ef-knopf" type="button" data-confirm>Demo-Anfrage abschließen</button><button class="ef-textknopf" type="button" data-edit>Angaben korrigieren</button></p></div>`
    + `<div class="ef-pruefung" data-form-success hidden tabindex="-1"><h2>Demo abgeschlossen.</h2><p>So könnte eine Bestätigung aussehen: „Danke, wir melden uns mit einem Terminvorschlag fürs Aufmaß.“ Ihre Anfrage wurde nicht versendet.</p><p class="ef-aktionen"><button class="ef-textknopf" type="button" data-reset>Erneut ausprobieren</button></p></div></section>`;
}

function hinweise({ base, pkg }: Ctx) {
  return kopf('Hinweise zur Demo', `Eiche & Form ist eine fiktive Tischlerei. Diese Website zeigt eine mögliche Ausgestaltung von ${pkg.name}.`)
    + `<div class="ef-prosa"><h2>Was dieses Beispiel zeigt</h2><p>${pkg.description} Seitenzahl, Inhalte und Funktionen sind nur ein Beispiel. Was ein echtes Projekt umfasst und kostet, steht in dessen eigenem Angebot. Angebot auf Anfrage.</p>`
    + `<h2>Zeichnungen und Visualisierungen</h2><p>Alle Zeichnungen entstehen programmatisch aus erfundenen Maßen. Die Visualisierung von Fall 14 wurde aus denselben Maßen berechnet; sie ist kein Foto und zeigt kein gebautes Möbel. Auch die Holzstruktur ist erzeugt. Es gibt keine Fotos, weil es keine Projekte gibt. Schriften: Besley und Barlow unter der SIL Open Font License, lokal ausgeliefert.</p><p><a href="${base}package-demos/sources.json">Bildnachweise</a></p>`
    + `<h2>Demo-Anfragen und Datenschutz</h2><p>Das Formular überträgt nichts. Maße und Angaben werden nur im Arbeitsspeicher dieser Seite gehalten, nicht in Cookies oder im lokalen Browserspeicher. Ein Neuladen verwirft sie. Der Wechsel zur echten Webbyu-Anfrage übernimmt ausschließlich den Paketwunsch. Hosting-Zugriffe unterliegen den tatsächlichen Webbyu-Datenschutzhinweisen.</p>`
    + `<h2>Fiktive Angaben</h2><p>Fälle, Maße, Holzlisten, Standort und Arbeitsweise illustrieren das Konzept. Die Holzlisten sind keine Bauanleitung. Es gibt hier keinen realen Betrieb, keine Termine und keine Kundenbewertungen.</p><p><a href="${base}impressum/">Impressum von Webbyu</a> · <a href="${base}datenschutz/">Datenschutzerklärung von Webbyu</a></p></div>`;
}

/** Hauptinhalt einer Business-Route, inklusive der gemeinsamen SVG-Definitionen. */
export function businessBody(slug: string, ctx: Ctx): string {
  const seiten: Record<string, (c: Ctx) => string> = {
    '': home, leistungen, 'leistungen/moebel': moebel, 'leistungen/kuechen': kuechen,
    projekte, 'projekte/wohnraum': fall22, 'projekte/kueche': fall9,
    'ueber-uns': werkstatt, kontakt, hinweise,
  };
  const seite = seiten[slug];
  if (!seite) throw new Error(`Unbekannte Business-Route: ${slug}`);
  return defs(`${ctx.base}package-demos/eiche-holz.webp`) + seite(ctx);
}
