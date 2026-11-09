// Klarblick, Webbyu Start. Die Seite ist eine Hausfront, vom Giebel bis zum Gehweg.
// Jeder Fenstertyp ist zugleich ein Inhaltsmodul. Die Zeichen hier sind die einzige Geometrie der
// Fenster: Liste, Zähler und das gezeichnete Haus im Formular verwenden dieselben.

export type Fensterart = 'rund' | 'dach' | 'sprossen' | 'treppe' | 'kasten' | 'hecke' | 'fluegel' | 'keller' | 'laden';

/* Reihenfolge von oben nach unten. Sie bestimmt auch, wo ein Fenster im gezeichneten Haus landet. */
export const fensterarten: { art: Fensterart; name: string; hinweis: string; wagen: string[] }[] = [
  { art: 'rund', name: 'Rund im Giebel', hinweis: 'hoch, meist nicht zu öffnen', wagen: ['Reinwasser-Stange, 10 m'] },
  { art: 'dach', name: 'Dachfenster', hinweis: 'schwingt oder klappt', wagen: ['Bodentuch', 'Überzieher für die Schuhe'] },
  { art: 'sprossen', name: 'Sprossen', hinweis: 'mehrere kleine Scheiben', wagen: ['Kleiner Abzieher', 'Eckenpinsel'] },
  { art: 'treppe', name: 'Über der Treppe', hinweis: 'keine Leiter passt', wagen: ['Stufenpodest'] },
  { art: 'kasten', name: 'Kastenfenster', hinweis: 'zwei hintereinander', wagen: ['Schmale Tücher für den Zwischenraum'] },
  { art: 'fluegel', name: 'Ganz normal', hinweis: 'ein oder zwei Flügel', wagen: [] },
  { art: 'hecke', name: 'Hinter der Hecke', hinweis: 'oder sonst schlecht erreichbar', wagen: ['Zweistufiger Tritt', 'Kurzstange'] },
  { art: 'keller', name: 'Kellerfenster', hinweis: 'Schacht oder Gitter', wagen: ['Handschuhe', 'Laubgreifer'] },
  { art: 'laden', name: 'Schaufenster', hinweis: 'zur Straße, große Fläche', wagen: ['Lange Einwascher', 'Termin vor Ladenöffnung'] },
];

const zeichenformen: Record<Fensterart, string> = {
  fluegel: '<rect x="5" y="5" width="30" height="42"/><path d="M20 5v42"/>',
  sprossen: '<rect x="5" y="5" width="30" height="42"/><path d="M20 5v42M5 19h30M5 33h30"/>',
  rund: '<circle cx="20" cy="26" r="17"/><path d="M20 9v34M3 26h34"/>',
  dach: '<path d="M11 6h27l-8 40H3Z"/><path d="M7 27h27"/>',
  treppe: '<rect x="12" y="4" width="16" height="44"/><path d="M12 22h16M12 34h16"/><path d="M0 48h7v-6h6"/>',
  kasten: '<rect x="4" y="9" width="24" height="38"/><path d="M12 9V3h24v38h-8"/><path d="M16 9v38"/>',
  hecke: '<rect x="6" y="5" width="28" height="42"/><path d="M20 5v18" /><path class="kb-z-voll" d="M1 48V33q4-7 9-3 4-6 9-2 5-5 9-1 5-3 11 4v17Z"/>',
  keller: '<rect x="3" y="20" width="34" height="19"/><path d="M11 20v19M20 20v19M29 20v19"/><path d="M0 44h40"/>',
  laden: '<rect x="1" y="12" width="38" height="31"/><path d="M1 37h38"/><path d="M6 12V7h28v5"/>',
};

export const zeichenInhalt = (art: Fensterart): string => zeichenformen[art];
const zeichen = (art: Fensterart, klasse = ''): string => `<svg class="kb-z ${klasse}" viewBox="0 0 40 52" aria-hidden="true">${zeichenformen[art]}</svg>`;

export const klarblickMark = '<svg class="kb-mark" viewBox="0 0 32 36" aria-hidden="true"><path d="M16 1 31 15v20H1V15Z" fill="#7b3629"/><circle cx="16" cy="19" r="6.5" fill="#f2c230"/></svg>';

const angaben = (zugang: string, wagen: string): string => `<dl class="kb-angaben"><div><dt>Zugang</dt><dd>${zugang}</dd></div><div><dt>Auf den Wagen</dt><dd>${wagen}</dd></div></dl>`;

const rundfenster = `<svg class="kb-rund" viewBox="0 0 240 240" aria-hidden="true">
  <circle cx="120" cy="120" r="108" fill="none" stroke="#4a2118" stroke-width="24"/>
  <circle cx="120" cy="120" r="108" fill="none" stroke="#8a4533" stroke-width="21" pathLength="30" stroke-dasharray=".88 .12"/>
  <circle cx="120" cy="120" r="93" fill="#f7f2e7"/>
  <circle cx="120" cy="120" r="80" fill="#f2c230"/>
  <path d="M120 40a80 80 0 0 0-80 80h14a66 66 0 0 1 66-66Z" fill="#d9a71c"/>
  <rect x="113" y="33" width="14" height="174" fill="#f7f2e7"/>
  <rect x="33" y="113" width="174" height="14" fill="#f7f2e7"/>
</svg>`;

const katze = '<svg class="kb-katze" viewBox="0 0 76 84" aria-hidden="true"><path d="M12 84C5 66 8 48 17 38L13 13l13 10c4-2 10-2 14 0l13-10-4 25c4 5 6 10 7 16 3 8 6 10 9 7 3-2 8 0 6 5-3 8-13 9-16 1 1 8 0 15-2 22Z"/></svg>';

/* Beispielhaus. Dieselben zwölf Fenster wie oben an der Fassade. */
const beispielListe: [Fensterart, string, string, string, string][] = [
  ['rund', '1', 'Rund im Giebel, 7,40 m', 'Von unten, geht nicht auf', 'Reinwasser-Stange, 10 m'],
  ['dach', '2', 'Dachfenster, Bad und Kammer', 'Von innen, schwingt ganz durch', 'Bodentuch, Überzieher'],
  ['sprossen', '4', 'Sprossen, Obergeschoss', 'Von innen, Flügel geöffnet', 'Kleiner Abzieher, Eckenpinsel'],
  ['treppe', '1', 'Über der Treppe, 4,10 m', 'Vom Podest auf den Stufen', 'Stufenpodest'],
  ['kasten', '2', 'Kastenfenster, Wohnzimmer', 'Von innen, beide Flügel auf', 'Schmale Tücher'],
  ['hecke', '1', 'Küche, hinter der Hecke', '40 cm Gang, kurze Stange', 'Zweistufiger Tritt, Kurzstange'],
  ['keller', '1', 'Keller, Lichtschacht', 'Von oben, Gitter ab', 'Handschuhe, Laubgreifer'],
];

function zaehlerZeile(item: (typeof fensterarten)[number]): string {
  return `<li class="kb-zaehler" data-art="${item.art}">
    ${zeichen(item.art)}
    <span class="kb-zaehler-text"><b>${item.name}</b><small>${item.hinweis}</small></span>
    <span class="kb-stepper">
      <button type="button" data-weniger aria-label="${item.name}: eins weniger" disabled>−</button>
      <output aria-live="polite" aria-label="${item.name}, Anzahl">0</output>
      <button type="button" data-mehr aria-label="${item.name}: eins mehr">+</button>
    </span>
  </li>`;
}

function anfrageTuer(): string {
  return `<div class="kb-tuer-rahmen" id="kontakt">
    <div class="kb-oberlicht">
      <div class="kb-sch"><h3>Rundgang</h3><p>Wir klingeln, gehen mit Ihnen einmal ums Haus und machen jedes Fenster einmal auf. Rund zwanzig Minuten.</p></div>
      <div class="kb-sch"><h3>Liste</h3><p>Sie bekommen die Fensterliste und das Angebot auf Papier. Passt es Ihnen nicht, behalten Sie die Liste.</p></div>
      <div class="kb-sch"><h3>Putztag</h3><p>Das Richtige liegt auf dem Wagen. Sie räumen die Fensterbänke frei, sonst nichts. Beim nächsten Mal gilt dieselbe Liste.</p></div>
    </div>
    <div class="kb-tuer">
      <i class="kb-tuerknauf" aria-hidden="true"></i>
      <form data-demo-form>
        <fieldset disabled>
          <legend class="pd-sr">Demo-Anfrage an Klarblick</legend>
          <div class="kb-fluegel kb-fluegel-links">
            <h2 id="kb-anfrage-titel">Kreuzen Sie Ihr Haus an.</h2>
            <p>Ungefähr reicht. Lassen Sie weg, was Sie nicht wissen.</p>
            <ul class="kb-zaehler-liste">${fensterarten.map(zaehlerZeile).join('')}</ul>
          </div>
          <div class="kb-fluegel kb-fluegel-rechts">
            <div class="kb-mein-haus">
              <figure>
                <div data-mein-haus></div>
                <figcaption data-summe>Noch steht kein Fenster.</figcaption>
              </figure>
              <div class="kb-wagen">
                <h3>Das käme auf den Wagen</h3>
                <ul data-wagen><li>Abzieher, Einwascher, Eimer</li></ul>
              </div>
            </div>
            <label>Ort und was wir sonst wissen sollten<textarea name="message" required minlength="10" maxlength="3000" rows="3" placeholder="Reinfeld, Einfahrt schmal, Hund freundlich"></textarea></label>
            <div class="kb-zwei">
              <label>Ihr Name<input name="name" required maxlength="100" autocomplete="off"></label>
              <label>E-Mail<input name="email" type="email" required maxlength="160" autocomplete="off"></label>
            </div>
            <input type="hidden" name="fensterliste" data-review="Ihre Fenster" data-einheit="">
            <button class="kb-klingel" type="submit">Demo-Anfrage prüfen</button>
            <p class="kb-demo-hinweis">Nur zum Ausprobieren: bitte Beispieldaten verwenden. Es wird nichts versendet und kein Termin vereinbart.</p>
          </div>
        </fieldset>
      </form>
      <noscript><p class="kb-noscript">Für die lokale Demo-Anfrage aktivieren Sie JavaScript. Alle Inhalte dieser Seite bleiben lesbar.</p></noscript>
      <div class="kb-zustand" data-form-review hidden tabindex="-1">
        <h3>So würde Ihre Anfrage bei uns ankommen</h3>
        <dl></dl>
        <p>Diese Vorschau bleibt ausschließlich in dieser geöffneten Seite.</p>
        <button class="kb-klingel" data-confirm type="button">Demo-Anfrage abschließen</button>
        <button class="pd-link" data-edit type="button">Angaben korrigieren</button>
      </div>
      <div class="kb-zustand" data-form-success hidden tabindex="-1">
        <h3>Demo abgeschlossen.</h3>
        <p>So könnte eine Bestätigung aussehen. Ihre Anfrage wurde nicht versendet, und niemand kommt ohne Eimer vorbei.</p>
        <button class="kb-klingel" type="button" data-reset>Erneut ausprobieren</button>
      </div>
    </div>
  </div>`;
}

export function startHome(): string {
  return `<div class="kb-oben">
    <section class="kb-himmel" aria-labelledby="kb-titel">
      <p class="kb-ort">Fensterreinigung in Stormarn</p>
      <h1 id="kb-titel">Jedes Haus hat dieses eine Fenster.</h1>
      <p class="kb-vorspann">Das runde im Giebel. Das über der Treppe. Das hinter der Hecke. Klarblick geht vor dem ersten Termin einmal mit Ihnen ums Haus und schreibt jedes Fenster auf. Am Putztag liegt dann das Richtige auf dem Wagen.</p>
      <p class="kb-aktionen"><a class="kb-knopf" href="#kontakt">Mein Haus ankreuzen</a><a class="kb-textlink" href="#fenster">Erst einmal das Beispielhaus ansehen</a></p>
    </section>
    <div class="kb-schornstein" aria-hidden="true"></div>
    <div class="kb-giebel">
      <i class="kb-ortgang"></i><i class="kb-giebelwand"></i>
      ${rundfenster}
    </div>
    <section class="kb-dach" id="fenster" aria-labelledby="kb-oben-titel">
      <div class="kb-dach-text">
        <h2 id="kb-oben-titel">Von oben nach unten.</h2>
        <p>Alle Fenster auf dieser Seite gehören zu einem Haus: Klinker, Baujahr 1936, Reinfeld. Das Haus ist erfunden. Die Fragen, die es stellt, sind es nicht.</p>
      </div>
      <article class="kb-f kb-f-dach">
        <div class="kb-f-rahmen kb-f-rahmen-dunkel">
          <div class="kb-sch">
            <h3>Dachfenster</h3>
            <p>Schwingt es ganz durch, putzen wir es von innen, in Socken. Klemmt es auf halber Strecke, steht das auf der Liste, und wir reden darüber, bevor jemand aufs Dach steigt.</p>
            ${angaben('Von innen', 'Bodentuch, Überzieher')}
          </div>
        </div>
      </article>
    </section>
    <article class="kb-rund-text"><div class="kb-tafel">
      <p class="kb-schild">7,40 m</p>
      <h3>Rund im Giebel</h3>
      <p>Das hier. Geht nicht auf und hängt zu hoch für jede Leiter, die man in einen Vorgarten stellen möchte. Also von unten, mit der Reinwasser-Stange: Bürste oben, gefiltertes Wasser, trocknet ohne Streifen.</p>
      ${angaben('Von unten, vom Rasen', 'Reinwasser-Stange, 10 m')}
    </div></article>
  </div>

  <div class="kb-rinne" aria-hidden="true"></div>

  <div class="kb-wand">
    <article class="kb-f kb-f-sprossen">
      <div class="kb-f-rahmen">
        <div class="kb-sch kb-sch-titel"><h3>Sprossen</h3></div>
        <div class="kb-sch kb-sch-text"><p>Vier Stück im Obergeschoss, je sechs Scheiben. Macht vierundzwanzig Scheiben und sechsundneunzig Ecken.</p></div>
        <div class="kb-sch kb-leer" aria-hidden="true"></div>
        <div class="kb-sch kb-leer" aria-hidden="true">${katze}</div>
        <div class="kb-sch kb-sch-angabe"><dl class="kb-angaben"><div><dt>Zugang</dt><dd>Von innen, Flügel geöffnet</dd></div></dl></div>
        <div class="kb-sch kb-sch-angabe"><dl class="kb-angaben"><div><dt>Auf den Wagen</dt><dd>Kleiner Abzieher, Eckenpinsel</dd></div></dl></div>
      </div>
    </article>

    <article class="kb-f kb-f-treppe">
      <div class="kb-f-rahmen">
        <div class="kb-sch kb-sch-bogen" aria-hidden="true"></div>
        <div class="kb-sch"><h3>Über der Treppe</h3></div>
        <div class="kb-sch"><p>4,10 Meter über den Stufen. Hier passt keine Leiter, und zum Hochgucken steht auch niemand gern darunter.</p></div>
        <div class="kb-sch"><p>Wir bringen ein Podest mit, das auf zwei Stufen steht.</p></div>
        <div class="kb-sch">${angaben('Von innen, vom Podest', 'Stufenpodest')}</div>
      </div>
    </article>

    <article class="kb-f kb-f-kasten">
      <div class="kb-f-hinten" aria-hidden="true"></div>
      <div class="kb-f-rahmen">
        <div class="kb-sch"><h3>Kastenfenster</h3><p>Zwei Fenster hintereinander, also vier Seiten Glas. Der Zwischenraum ist die Stelle, an die seit dem letzten Streichen niemand gedacht hat.</p></div>
        <div class="kb-sch">${angaben('Von innen, beide Flügel auf', 'Schmale Tücher, doppelte Zeit')}</div>
      </div>
    </article>

    <article class="kb-f kb-f-hecke">
      <div class="kb-f-rahmen">
        <div class="kb-sch"><h3>Hinter der Hecke</h3><p>Küchenfenster, Südseite. Die Hecke war 1990 einmal niedrig. Wir schneiden nichts, aber wir sehen nach, wie breit der Gang dahinter ist.</p></div>
        <div class="kb-sch">${angaben('40 cm Gang, kurze Stange', 'Zweistufiger Tritt, Kurzstange')}</div>
      </div>
    </article>
    <p class="kb-hausnummer" aria-hidden="true">9</p>
    <div class="kb-heckenband" aria-hidden="true"></div>
  </div>

  <div class="kb-sockel">
    <article class="kb-f kb-f-keller">
      <div class="kb-f-rahmen">
        <div class="kb-sch"><h3>Kellerfenster</h3></div>
        <div class="kb-sch"><p>Gitter ab, Laub raus, Spinne umsetzen. Dann erst das Glas.</p></div>
        <div class="kb-sch">${angaben('Von oben, im Lichtschacht', 'Handschuhe, Laubgreifer')}</div>
      </div>
    </article>
  </div>

  <section class="kb-liste-band" id="liste" aria-labelledby="kb-liste-titel">
    <div class="kb-blatt">
      <header>
        <h2 id="kb-liste-titel">Macht zwölf Fenster.</h2>
        <p>So sieht die Liste nach dem Rundgang aus. Klinkerhaus, Reinfeld, 1936. Erfunden wie das ganze Haus.</p>
      </header>
      <table>
        <thead><tr><th scope="col"><span class="pd-sr">Zeichen</span></th><th scope="col">Stück</th><th scope="col">Fenster</th><th scope="col">Zugang</th><th scope="col">Auf den Wagen</th></tr></thead>
        <tbody>${beispielListe.map(([art, stueck, name, zugang, wagen]) => `<tr>${`<td>${zeichen(art)}</td><td>${stueck}</td><th scope="row">${name}</th><td>${zugang}</td><td>${wagen}</td>`}</tr>`).join('')}</tbody>
      </table>
      <footer><p><strong>Knapp drei Stunden, zu zweit.</strong> Der Preis kommt nach dem Rundgang schriftlich dazu und hängt von Fläche, Zugang und Verschmutzung ab. Angebot auf Anfrage.</p></footer>
    </div>
  </section>

  <section class="kb-nebenan" aria-labelledby="kb-laden-titel">
    <div class="kb-markise" aria-hidden="true"></div>
    <article class="kb-f kb-f-laden">
      <div class="kb-f-rahmen kb-f-rahmen-dunkel">
        <div class="kb-sch">
          <h2 id="kb-laden-titel">Auch Läden.</h2>
          <p>Gleiche Liste, andere Uhrzeit. Schaufenster und Eingangstüren vor der Öffnung, Praxen und Büros nach Feierabend. Wer einen festen Rhythmus möchte, erklärt das nur einmal.</p>
          ${angaben('Gehweg, vor 9 Uhr', 'Lange Einwascher')}
        </div>
        <div class="kb-ladentuer" aria-hidden="true"><span>Noch geschlossen</span></div>
      </div>
    </article>
  </section>

  <section class="kb-eingang" id="rundgang" aria-labelledby="kb-eimer-titel">
    <h2 id="kb-eimer-titel">Beim ersten Mal kommen wir ohne Eimer.</h2>
    ${anfrageTuer()}
  </section>

  <section class="kb-gehweg" id="gebiet" aria-labelledby="kb-gebiet-titel">
    <div class="kb-gehweg-text">
      <h2 id="kb-gebiet-titel">Wo der Wagen hinfährt.</h2>
      <p>Liegt Ihr Ort daneben? Schreiben Sie ihn in die Anfrage, dann klären wir die Anfahrt gleich mit.</p>
    </div>
    <ul class="kb-orte">
      <li><b>Bad Oldesloe</b><small>Kreis Stormarn</small></li>
      <li><b>Reinfeld</b><small>Kreis Stormarn</small></li>
      <li><b>Bargteheide</b><small>Kreis Stormarn</small></li>
    </ul>
  </section>`;
}

export function klarblickNotes(base: string, home: string, packageDescription: string): string {
  return `<div class="kb-hinweise">
    <header class="kb-hinweise-kopf">
      <h1>An diesem Haus ist alles erfunden.</h1>
      <p>Klarblick ist eine fiktive Fensterreinigung. Die Website zeigt eine mögliche Ausgestaltung des Pakets Webbyu Start.</p>
    </header>
    <div class="kb-hinweise-wand">
      <div class="kb-blatt">
        <section><h2>Beispielumfang</h2><p>${packageDescription} Die gezeigten Inhalte und Funktionen illustrieren den Umfang. Angebot auf Anfrage. Individuelle 3D-Produktion wird separat kalkuliert.</p></section>
        <section><h2>Zeichnungen und Schrift</h2><p>Fassade, Fensterzeichen und Materialien sind für diese Demo programmatisch gezeichnet. Es sind keine Fotos und keine KI-Bilder. Maße, Zeiten und das Beispielhaus sind erfunden und fachlich nicht geprüft. Schrift: Barlow, SIL Open Font License.</p><p><a href="${base}package-demos/sources.json">Bildnachweise der Paket-Demos</a></p></section>
        <section><h2>Anfrage und Datenschutz</h2><p>Die Demo verarbeitet Beispieldaten lokal im Arbeitsspeicher der geöffneten Seite. Beim Neuladen werden sie verworfen. Der Link zur echten Webbyu-Anfrage übernimmt ausschließlich die Paketwahl.</p><p><a href="${base}impressum/">Impressum Webbyu</a> · <a href="${base}datenschutz/">Datenschutz Webbyu</a></p></section>
        <p><a class="kb-knopf" href="${home}">Zurück zum Haus</a></p>
      </div>
    </div>
  </div>`;
}
