// Inhalte der Complete-Demo Hof & Flamme. Kopf, Demo-Leiste und Fuß kommen aus page.ts.
import { aiBadge } from '../../ai-media';
import { ENDE, STUFEN, hitze, haus, huegel, kurve, tafel, tageskurve, temperatur, uhr, type Gericht, type Stufe } from './feuer';

type Ctx = { base: string; link: (slug?: string) => string; pkg: { name: string; description: string; features: string[] } };

const BILDER: Record<string, [number, number, boolean, boolean]> = {
  // Breite, Höhe, KI-Herkunft, schmale Fassung vorhanden
  'hof-ki-tafel': [1600, 1067, true, true],
  'hof-ki-wurzeln': [1400, 836, true, true],
  'hof-ki-brot': [900, 617, true, false],
  'hof-ki-kerze': [720, 567, true, false],
  'hof-foto-rost': [1000, 1363, false, false],
  'hof-foto-reichen': [1600, 1024, false, true],
};
const istKi = (name: string) => BILDER[name][2];

function bild(base: string, name: string, alt: string, sizes: string, eager = false): string {
  const [w, h, , klein] = BILDER[name];
  const srcset = klein ? ` srcset="${base}package-demos/${name}-800.webp 800w, ${base}package-demos/${name}.webp ${w}w" sizes="${sizes}"` : '';
  return `<img src="${base}package-demos/${name}.webp"${srcset} alt="${alt}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
const quelle = (name: string) => (istKi(name) ? 'KI-Illustration als Rasterdruck' : 'Stockfoto als Rasterdruck');
const druck = (base: string, name: string, alt: string, sizes: string, unterschrift = '', klasse = '') =>
  `<figure class="hf-druck ${klasse}">${bild(base, name, alt, sizes)}${istKi(name) ? aiBadge() : ''}<figcaption>${unterschrift ? unterschrift + ' ' : ''}${quelle(name)}.</figcaption></figure>`;

const knopf = (href: string, text: string) => `<a class="hf-knopf" href="${href}">${text}</a>`;
const verweis = (href: string, text: string) => `<a class="hf-verweis" href="${href}">${text}</a>`;
const hitzeStil = (h: number) => `--t:${hitze(h).toFixed(2)}`;

function gerichte(s: Stufe): string {
  return `<ul class="hf-gerichte">${s.gerichte.map(g => `<li style="${hitzeStil(g.h)}"><h3>${g.name}</h3><p>${g.text}</p><p class="hf-mitte">${g.mitte}</p></li>`).join('')}</ul>`;
}

function kopfzeile(s: Stufe): string {
  return `<p class="hf-stand"><span>${uhr(s.h)} Uhr</span><span>${temperatur(s.h)} °C am Stein</span></p>`;
}

const FRAGEN: [string, string][] = [
  ['Ich esse kein Fleisch und keinen Fisch.', 'Für jedes Fleischgericht machen wir eine eigene Schüssel ohne. Schreiben Sie uns bei der Anfrage, wie viele von Ihnen das betrifft.'],
  ['Und bei Allergien?', 'Schreiben Sie uns genau, was es ist. Am offenen Herd können wir Spuren von Gluten und Nüssen nicht ausschließen, das sagen wir lieber vorher.'],
  ['Müssen wir uns mit Fremden unterhalten?', 'Nein. Die Schüssel weiterreichen reicht völlig.'],
  ['Wir kommen vielleicht etwas später.', 'Die ersten Fladen kommen um 18:40, und die warten nicht. Bis 18:45 halten wir Ihren Platz frei.'],
  ['Dürfen Kinder mit?', 'Gern, bis zwölf Jahre für 28 Euro. Auf der Diele ist Platz zum Rennen, und sie dürfen beim Aufbrechen der Bete helfen.'],
  ['Wann ist Schluss?', 'Wenn der Herd unter hundert Grad ist. Meistens gegen elf.'],
];

const ABENDE: [string, string, string, string][] = [
  ['Donnerstag', '18:30', 'Noch 9 Plätze', 'Donnerstag, 18:30 Uhr'],
  ['Freitag', '18:30', 'Ausgebucht, Warteliste', 'Freitag, 18:30 Uhr (Warteliste)'],
  ['Samstag', '18:30', 'Noch 3 Plätze', 'Samstag, 18:30 Uhr'],
  ['Sonntag', '12:30', 'Noch 14 Plätze', 'Sonntag, 12:30 Uhr'],
];

function home({ base, link }: Ctx): string {
  const [flamme, glut, asche, rest] = STUFEN;
  const achse = STUFEN.map(s => `<li><a href="#${s.id}"><b>${s.name}</b><span>${uhr(s.h)} Uhr</span><span>${temperatur(s.h)} °C</span></a></li>`).join('');
  return `<section class="hf-einstieg"><div class="hf-poster">${huegel()}<h1 class="hf-titel"><span style="--z:1">Wir kochen,</span> <span style="--z:.68">bis das</span> <span style="--z:.42">Feuer</span> <span style="--z:.2">aus ist.</span></h1></div>`
    + `<ol class="hf-achse" aria-label="Der Abend in vier Hitzen">${achse}</ol>`
    + `<div class="hf-fakten"><p>Ein Hallenhaus in Holstein, ein gemauerter Herd und ein Tisch für 22. Die Karte läuft in der Reihenfolge, in der das Feuer nachlässt.</p><dl><div><dt>Wann</dt><dd>Do bis Sa 18:30<br>So 12:30</dd></div><div><dt>Was</dt><dd>Ein Menü<br>für alle</dd></div><div><dt>Preis</dt><dd>64 Euro<br>ohne Getränke</dd></div></dl>${knopf(link('kontakt'), 'Platz anfragen')}</div></section>`
    + `<div class="hf-abend" data-abend><div class="hf-fieber" data-fieber hidden aria-hidden="true"><i data-fieber-balken></i><span data-fieber-uhr>18:30</span><span data-fieber-grad>430 °C</span><a href="${link('kontakt')}" tabindex="-1">Platz anfragen</a></div>`
    + `<section class="hf-hitze hf-hitze--flamme" id="flamme" data-h="${flamme.h}" style="${hitzeStil(flamme.h)}"><h2>Flamme</h2>${kopfzeile(flamme)}<div class="hf-hitze-text"><p class="hf-satz">Um zwei machen wir Feuer. Um sechs kommt das letzte Scheit drauf. Ab dann wird der Herd jede Stunde kälter, und wir kochen, was er gerade noch kann.</p><p>Jetzt ist der Stein so heiß, dass ein Fladen in neunzig Sekunden fertig ist. Viel mehr kann man mit dieser Hitze nicht anfangen. Außer Lauch verbrennen, das machen wir auch.</p>${gerichte(flamme)}</div>${druck(base, 'hof-ki-tafel', 'Rasterdruck: gedeckter Holztisch mit Brot, Kerzen und einem Teller Ofengemüse, hinten brennt ein Feuer.', '(max-width: 760px) 100vw, 58vw', '', 'hf-druck--tafel')}</section>`
    + `<section class="hf-hitze hf-hitze--glut" id="glut" data-h="${glut.h}" style="${hitzeStil(glut.h)}">${druck(base, 'hof-foto-rost', 'Rasterdruck von oben: gegrillte Paprika, Aubergine und Fleisch auf einem großen Brett.', '(max-width: 760px) 100vw, 36vw', '', 'hf-druck--rost')}<div class="hf-hitze-text"><h2>Glut</h2>${kopfzeile(glut)}<p>Die Flammen sind weg, die Glut liegt gleichmäßig. Jetzt kommt der Rost, und man kann zusehen, wie etwas braun wird. Das Lamm liegt seit Mittag am Rand und wird in der Mitte des Tisches gezupft.</p>${gerichte(glut)}</div></section>`
    + `<section class="hf-hitze hf-hitze--asche" id="asche" data-h="${asche.h}" style="${hitzeStil(asche.h)}"><div class="hf-hitze-kopf"><h2>Asche</h2>${kopfzeile(asche)}<p>Oben liegt nur noch Grau, darunter ist es heiß genug für alles, was dauert. Die Bete haben wir um sechs eingegraben. Rechnen Sie mit schwarzen Fingern.</p></div>${druck(base, 'hof-ki-wurzeln', 'Rasterdruck: geröstete Wurzeln, Bete und Rosenkohl auf einem Steingutteller.', '(max-width: 760px) 100vw, 42vw', '', 'hf-druck--wurzeln')}${gerichte(asche)}</section>`
    + `<section class="hf-hitze hf-hitze--rest" id="rest" data-h="${rest.h}" style="${hitzeStil(rest.h)}"><div><h2>Restwärme</h2>${kopfzeile(rest)}<p>Der Apfel liegt seit dem Lamm auf dem Stein. Mehr passiert jetzt nicht mehr.</p>${gerichte(rest)}<p class="hf-morgen">Am nächsten Morgen ist der Herd noch handwarm. Die Asche kommt unter die Apfelbäume.</p></div>${druck(base, 'hof-ki-kerze', 'Rasterdruck: eine Kerze in einem geriffelten Glas.', '30vw', '', 'hf-druck--kerze')}</section></div>`
    + `<section class="hf-mittig"><div class="hf-mittig-text"><h2>Bestellen müssen Sie nichts.</h2><p>Alles kommt in großen Schüsseln auf den Tisch und geht von Hand zu Hand. Nachschlag gibt es, solange etwas da ist. Spätestens bei der zweiten Schüssel kennen Sie die Namen Ihrer Nachbarn.</p></div>${druck(base, 'hof-foto-reichen', 'Rasterdruck: Eine Hand reicht einen Teller über den Tisch.', '(max-width: 760px) 100vw, 50vw', '', 'hf-druck--reichen')}<figure class="hf-tafelplan">${tafel(true)}${tafel(false)}<figcaption><ul class="hf-zonen"><li><i class="hf-z-tuer"></i><b>An der Tür.</b> Frische Luft. Bringen Sie eine Strickjacke mit.</li><li><i class="hf-z-mitte"></i><b>In der Mitte.</b> Die Schüsseln kommen hier zuerst an.</li><li><i class="hf-z-herd"></i><b>Am Herd.</b> Warm, zum Lauch hin auch heiß.</li></ul></figcaption></figure></section>`
    + `<section class="hf-fragen" aria-labelledby="hf-fragen-titel"><h2 id="hf-fragen-titel">Was Sie uns am Telefon fragen würden.</h2><dl>${FRAGEN.map(([f, a]) => `<div><dt>${f}</dt><dd>${a}</dd></div>`).join('')}</dl></section>`
    + `<section class="hf-woche" aria-labelledby="hf-woche-titel"><div><h2 id="hf-woche-titel">Diese Woche</h2><p>${verweis(link('speisekarte'), 'Die ganze Karte')}</p></div><ul>${ABENDE.map(([tag, zeit, frei]) => `<li><a href="${link('kontakt')}#anfrage"><b>${tag}</b><span>${zeit} Uhr</span><span>${frei}</span></a></li>`).join('')}</ul></section>`;
}

function karteZeile(g: Gericht): string {
  const fleisch = g.ohne ? ' data-mit-ersatz' : '';
  const ersatz = g.ohne ? `<div class="hf-ersatz"><h3>${g.ohne[0]}</h3><p>${g.ohne[1]}</p></div><p class="hf-ersatz-hinweis"><b>Ohne Fleisch:</b> ${g.ohne[0]}. ${g.ohne[1]}</p>` : '';
  return `<li style="${hitzeStil(g.h)}"${fleisch}><time>${uhr(g.h)}</time><div class="hf-haupt"><h3>${g.name}</h3><p>${g.text}</p></div>${ersatz}<p class="hf-mitte">${g.mitte}</p></li>`;
}

function speisekarte({ link }: Ctx): string {
  return `<header class="hf-kopf hf-kopf--flamme" style="--t:1"><h1>Was der Herd gerade kann</h1><p class="hf-kopf-text">Sieben Gänge, einer nach dem anderen, so wie das Feuer sie zulässt. 64 Euro pro Person, Kinder bis zwölf 28 Euro. Alles zusammen, nichts einzeln.</p></header>`
    + `<div class="hf-kurvenband">${kurve('Temperatur des Herds von 18:30 bis 23 Uhr, von 430 auf unter 100 Grad fallend.')}</div>`
    + `<div class="hf-karte" data-karte><div class="hf-karte-schalter"><label class="hf-schalter" hidden data-schalter><input type="checkbox" data-ohne-fleisch> Karte ohne Fleisch und Fisch zeigen</label></div>`
    + STUFEN.map(s => `<section class="hf-gangband hf-gangband--${s.id}" aria-labelledby="hf-gang-${s.id}" style="${hitzeStil(s.h)}"><h2 id="hf-gang-${s.id}">${s.name}</h2><ul>${s.gerichte.map(karteZeile).join('')}</ul></section>`).join('')
    + `</div><section class="hf-getraenke"><h2>Zu trinken</h2><ul><li><b>Apfelwein</b> vom Nachbarn, 0,2 l, 5 Euro</li><li><b>Helles</b> aus Plön, 0,3 l, 5 Euro</li><li><b>Wasser</b> in der Karaffe, 3 Euro</li><li><b>Wein</b>: drei rote, drei weiße, steht auf der Tafel</li></ul><p class="hf-klein">Fiktive Gerichte und Preise, kein Verkauf. Die Zutaten sind keine verbindliche Allergeninformation.</p><p>${knopf(link('kontakt'), 'Platz anfragen')}</p></section>`;
}

function kueche({ base, link }: Ctx): string {
  const buch: { h: number; zeit: string; was: string; grad: string; marke?: string }[] = [
    { h: 7.5, zeit: '07:30', was: 'Die Asche von gestern kommt raus und unter die Apfelbäume.', grad: 'handwarm' },
    { h: 11, zeit: '11:00', was: 'Anheizen mit Birkenrinde, dann Buche. Etwa 40 Kilo bis zum Nachmittag.', grad: '55 °C', marke: 'Anheizen' },
    { h: 14, zeit: '14:00', was: 'Der Stein hat seine volle Hitze. Ab jetzt halten wir nur noch.', grad: '480 °C', marke: 'Volle Hitze' },
    { h: 16, zeit: '16:00', was: 'Das Lamm kommt an den Rand. Bis 20 Uhr fasst es niemand an.', grad: '475 °C' },
    { h: 18, zeit: '18:00', was: 'Das letzte Scheit, Apfelholz wegen des Geruchs. Die Bete wird eingegraben.', grad: '450 °C', marke: 'Letztes Scheit' },
    { h: 18.5, zeit: '18:30', was: 'Tür zu. Die ersten Fladen auf den Stein.', grad: '430 °C' },
    { h: 19.75, zeit: '19:45', was: 'Die Flammen sind weg. Der Rost kommt über die Glut.', grad: `${temperatur(19.75)} °C` },
    { h: 21, zeit: '21:00', was: 'Die Bete wird ausgegraben.', grad: `${temperatur(21)} °C` },
    { h: 22.25, zeit: '22:15', was: 'Äpfel vom Stein, dann Kaffee.', grad: `${temperatur(22.25)} °C` },
    { h: ENDE, zeit: '23:00', was: 'Die letzten gehen. Die Tür vom Herd bleibt zu.', grad: `${temperatur(ENDE)} °C`, marke: 'Schluss' },
  ];
  return `<header class="hf-kopf hf-kopf--flamme" style="--t:.9"><h1>Angezündet wird einmal am Tag</h1><p class="hf-kopf-text">Der Herd steht am Ende der Diele, gemauert aus Schamotte und altem Klinker, 2,40 Meter breit. Gas haben wir keins, und einen zweiten Herd auch nicht.</p></header>`
    + `<section class="hf-buch" aria-labelledby="hf-buch-titel"><h2 id="hf-buch-titel">Das Feuerbuch von gestern</h2>${tageskurve(buch)}<table><thead><tr><th scope="col">Uhr</th><th scope="col">Am Herd</th><th scope="col">Am Stein</th></tr></thead><tbody>${buch.map(z => `<tr style="${hitzeStil(Math.max(z.h, 18.5))}"><td><time>${z.zeit}</time></td><td>${z.was}</td><td>${z.grad}</td></tr>`).join('')}</tbody></table></section>`
    + `<section class="hf-regeln"><div><h2>Was der Herd nicht kann</h2><ul><li><b>Etwas schnell noch mal warm machen.</b> Was zu spät kommt, kommt in die nächste Hitze.</li><li><b>Durchgebraten auf Wunsch.</b> Die Lage auf dem Rost entscheidet, und die entscheiden wir.</li><li><b>Fritteuse.</b> Gibt es nicht, also auch keine Pommes für die Kinder.</li></ul></div><div class="hf-holz"><h2>Drei Hölzer</h2><dl><div><dt>Birke</dt><dd>Die Rinde zum Anzünden. Brennt schnell und riecht nach Wald.</dd></div><div><dt>Buche</dt><dd>Für die Hitze. Vom Forst nebenan, zwei Jahre getrocknet.</dd></div><div><dt>Apfel</dt><dd>Nur das letzte Scheit, wegen des Geruchs auf der Diele.</dd></div></dl></div>${druck(base, 'hof-ki-brot', 'Rasterdruck: aufgebrochenes Brot auf einem Teller.', '30vw', '', 'hf-druck--brot')}</section>`
    + `<div class="hf-weiter"><p>Daraus ergibt sich die Reihenfolge.</p>${knopf(link('speisekarte'), 'Zur Karte')}</div>`;
}

function einblicke({ base, link }: Ctx): string {
  const reihe: [string, string, string][] = [
    ['hof-ki-tafel', '18:30', 'Der gedeckte Tisch mit Brot und Kerzen, hinten das Feuer.'],
    ['hof-ki-brot', '18:40', 'Brot zum Anfang.'],
    ['hof-foto-rost', '19:45', 'Gegrilltes auf einem großen Brett, von oben.'],
    ['hof-ki-wurzeln', '21:00', 'Geröstete Wurzeln auf Steingut.'],
    ['hof-foto-reichen', '21:30', 'Eine Hand reicht einen Teller weiter.'],
    ['hof-ki-kerze', '22:15', 'Eine Kerze im geriffelten Glas.'],
  ];
  return `<header class="hf-kopf hf-kopf--glut" style="--t:.72"><h1>Von halb sieben bis elf</h1><p class="hf-kopf-text">Sechs Bilder und ein Film, geordnet nach der Uhr. Für die Bilder gilt: Beispielmaterial, gedruckt in einer Farbe, damit es zusammengehört. Es zeigt nicht Hof &amp; Flamme.</p></header>`
    + `<section class="hf-reihe"><ol>${reihe.map(([name, zeit, alt]) => `<li><figure><button type="button" data-gallery aria-label="${alt} Vergrößern.">${bild(base, name, `Rasterdruck: ${alt}`, '(max-width: 760px) 100vw, 40vw')}</button>${istKi(name) ? aiBadge() : ''}<figcaption><time>${zeit}</time> ${quelle(name)}.</figcaption></figure></li>`).join('')}</ol></section>`
    + `<section class="hf-film"><div><h2>Ein Film</h2><p>Acht Sekunden am Tisch. So würde bewegtes Bild hier eingebunden, gedreht am echten Herd eines echten Betriebs. Dieser Ausschnitt ist lizenziertes Beispielmaterial von Rene Terp über Pexels, ohne Ton, einfarbig nachbearbeitet. Personen und Ort gehören nicht zu Hof &amp; Flamme.</p>${verweis(link('speisekarte'), 'Was auf den Tisch kommt')}</div><div><video controls playsinline preload="none" poster="${base}package-demos/hof-film.webp" width="406" height="500" aria-label="Beispielfilm: Jemand bereitet neben gedeckten Tischen etwas in einer Pfanne zu."><source src="${base}package-demos/hof-film.mp4" type="video/mp4"></video><p data-video-error hidden>Der Film kann gerade nicht abgespielt werden. Die Bilder darüber bleiben verfügbar.</p></div></section>`;
}

function ueberUns({ link }: Ctx): string {
  return `<header class="hf-kopf hf-kopf--asche" style="--t:.5"><h1>Ein Haus, das um sein Feuer gebaut ist</h1><p class="hf-kopf-text">Ein Hallenhaus von 1794. Vorn die große Tür für den Erntewagen, links und rechts die Ställe, hinten das Flett mit dem Herd. Der Rauch zog früher einfach durchs Dach.</p></header>`
    + `<section class="hf-grundriss"><figure>${haus(true)}${haus(false)}<figcaption>Grundriss, ungefähr. Haus und Maße sind erfunden, den Bautyp gibt es wirklich.</figcaption></figure></section>`
    + `<section class="hf-kreis"><div><h2>Wir sind zu zweit.</h2><p>Eine Person am Herd, eine am Tisch, und im Winter wird getauscht. Freitags und samstags kommt jemand zum Spülen dazu. Mehr brauchen 22 Plätze nicht, wenn alle dasselbe essen.</p><p>Einen Reservierungsdienst haben wir nicht. Wer anfragt, bekommt von einem von uns beiden eine Antwort.</p></div><div><h2>Was vom Feuer übrig bleibt</h2><ol class="hf-kette"><li><b>Asche</b> kommt unter die Apfelbäume.</li><li><b>Äpfel</b> kommen auf den Stein, der Rest in den Apfelwein vom Nachbarn.</li><li><b>Altes Holz</b> vom Baumschnitt wird das letzte Scheit.</li></ol></div></section>`
    + `<div class="hf-weiter"><p>Hof &amp; Flamme ist erfunden. Haus, Herd und Abläufe sind eine Designstudie.</p>${verweis(link('hinweise'), 'Hinweise zur Demo')}</div>`;
}

const AUSWAHL = (name: string, label: string, optionen: string[], review: string, standard = 0) => `<label class="hf-wahl"><span class="pd-sr">${label}</span><select name="${name}" data-review="${review}" data-einheit="">${optionen.map((o, i) => `<option${i === standard ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;

function kontakt(): string {
  const personen = ['eine Person', 'zwei Personen', 'drei Personen', 'vier Personen', 'fünf Personen', 'sechs Personen'];
  const plaetze = ['in der Mitte', 'am Herd', 'an der Tür', 'egal wo'];
  return `<header class="hf-kopf hf-kopf--rest" style="--t:.3"><h1>Platz anfragen</h1><p class="hf-kopf-text">Zwei Sätze reichen. Wir antworten am selben Tag, und erst dann ist der Platz Ihrer.</p></header>`
    + `<section class="hf-anfrage" id="anfrage"><div class="hf-abende"><h2>Diese Woche</h2><ul>${ABENDE.map(([tag, zeit, frei, wert]) => `<li><button type="button" data-abend-wahl="${wert}"><b>${tag}</b><span>${zeit} Uhr</span><span>${frei}</span></button></li>`).join('')}</ul><p class="hf-klein">Beispielwoche, die freien Plätze sind erfunden.</p></div>`
    + `<div class="hf-brief"><form data-demo-form><fieldset disabled><legend class="pd-sr">Platz anfragen</legend><p class="hf-satzformular">Wir kommen zu ${AUSWAHL('personen', 'Wie viele Personen', personen, 'Personen', 1)} am ${AUSWAHL('abend', 'Welcher Abend', ABENDE.map(a => a[3]), 'Abend', 2)} und sitzen am liebsten ${AUSWAHL('platz', 'Wo am Tisch', plaetze, 'Platz')}.</p>`
    + `<div class="hf-felder"><label class="hf-breit">Was wir sonst wissen sollten<textarea name="message" required minlength="10" maxlength="3000" rows="3" placeholder="Zum Beispiel: Eine Person isst kein Fleisch, eine Nussallergie, wir kommen mit dem Rad."></textarea></label><label>Ihr Name<input name="name" required maxlength="100" autocomplete="off"></label><label>E-Mail für die Antwort<input name="email" type="email" required maxlength="160" autocomplete="off"></label></div><p class="hf-formfuss"><button class="hf-knopf" type="submit">Anfrage prüfen</button><span>Zum Ausprobieren: nur Beispieldaten verwenden. Es wird nichts versendet und kein Platz reserviert.</span></p></fieldset></form>`
    + `<noscript><p class="hf-klein">Für die lokale Demo-Anfrage aktivieren Sie bitte JavaScript. Alle anderen Inhalte bleiben lesbar.</p></noscript>`
    + `<div class="hf-pruefung" data-form-review hidden tabindex="-1"><h2>Ihre Anfrage im Überblick</h2><dl></dl><p>Diese Vorschau gibt es nur in dieser geöffneten Seite.</p><p class="hf-formfuss"><button class="hf-knopf" type="button" data-confirm>Demo-Anfrage abschließen</button><button class="hf-textknopf" type="button" data-edit>Angaben korrigieren</button></p></div>`
    + `<div class="hf-pruefung" data-form-success hidden tabindex="-1"><h2>Demo abgeschlossen.</h2><p>So könnte die Antwort aussehen: „Danke, das passt. Bis Samstag, und bringen Sie eine Strickjacke mit.“ Ihre Anfrage wurde nicht versendet, es ist kein Platz reserviert.</p><p class="hf-formfuss"><button class="hf-textknopf" type="button" data-reset>Erneut ausprobieren</button></p></div></div></section>`
    + `<section class="hf-anfahrt"><div><h2>Anfahrt</h2><p>Hof &amp; Flamme hat keine Adresse, weil es das Haus nicht gibt. Bei einem echten Betrieb stünden hier die Einfahrt, der letzte Bus und wo das Auto bleiben kann.</p></div><div><h2>Zeiten</h2><p>Donnerstag bis Samstag um 18:30, sonntags um 12:30. Montag bis Mittwoch ist der Herd kalt.</p></div></section>`;
}

function hinweise({ base, pkg }: Ctx): string {
  return `<header class="hf-kopf hf-kopf--rest" style="--t:.3"><h1>Hinweise zur Demo</h1><p class="hf-kopf-text">Hof &amp; Flamme ist ein fiktives Restaurant. Diese Website zeigt eine mögliche Ausgestaltung von ${pkg.name}.</p></header>`
    + `<div class="hf-prosa"><h2>Was dieses Beispiel zeigt</h2><p>${pkg.description} Seitenzahl, Inhalte und Funktionen sind nur ein Beispiel. Was ein echtes Projekt umfasst und kostet, steht in dessen eigenem Angebot. Angebot auf Anfrage.</p>`
    + `<h2>Bilder und Film</h2><p>Die Bilder sind einfarbige Rasterdrucke aus vorhandenem Material. Vier stammen aus einer KI-generierten Illustration und tragen auf der Seite die Kennzeichnung „KI-generiert“. Zwei gehen auf Stockfotos von Unsplash zurück. Der Film ist ein bearbeiteter Ausschnitt von Rene Terp über Pexels. Kein Motiv zeigt einen realen Betrieb, reale Gäste oder Gerichte von Hof &amp; Flamme. Kurven, Pläne und der Grundriss sind programmatisch gezeichnet.</p><p>Echte Aufnahmen vom eigenen Haus würden diese Bilder bei einem wirklichen Projekt ersetzen; die Webbyu-Produktion wird dafür gesondert vereinbart.</p><p><a href="https://unsplash.com/license">Unsplash-Lizenz</a> · <a href="https://www.pexels.com/video/chef-cooking-in-front-of-customer-1858094/">Filmquelle und Urheber</a> · <a href="${base}package-demos/sources.json">Bildnachweise</a></p>`
    + `<h2>Demo-Anfragen und Datenschutz</h2><p>Das Formular überträgt nichts. Eingaben werden nur im Arbeitsspeicher dieser Seite gehalten, nicht in Cookies oder im lokalen Browserspeicher. Ein Neuladen verwirft sie. Der Wechsel zur echten Webbyu-Anfrage übernimmt ausschließlich den Paketwunsch. Hosting-Zugriffe unterliegen den tatsächlichen Webbyu-Datenschutzhinweisen.</p>`
    + `<h2>Fiktive Angaben</h2><p>Gerichte, Preise, Plätze, Temperaturen, Öffnungszeiten, das Haus und die Region illustrieren das Konzept. Temperaturangaben folgen einer gerechneten Beispielkurve. Es gibt hier keinen realen Betrieb, keine Reservierung, keinen Verkauf und keine Kundenbewertungen.</p><p><a href="${base}impressum/">Impressum von Webbyu</a> · <a href="${base}datenschutz/">Datenschutzerklärung von Webbyu</a></p></div>`;
}

/** Hauptinhalt einer Complete-Route. */
export function completeBody(slug: string, ctx: Ctx): string {
  const seiten: Record<string, (c: Ctx) => string> = { '': home, speisekarte, kueche, einblicke, 'ueber-uns': ueberUns, kontakt, hinweise };
  const seite = seiten[slug];
  if (!seite) throw new Error(`Unbekannte Complete-Route: ${slug}`);
  return seite(ctx);
}
