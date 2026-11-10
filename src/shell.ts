import { packageDemos } from './package-demos/catalogue';
import { businessNotice, concepts, extensions, packages, packageQuestions, scopeNotice, services, situations } from './data';
import type { PageMounts } from './contracts';
import { wordmarkImg } from './wordmark';

const arrow = '<span aria-hidden="true">↗</span>';

/** Rückseiten der fiktiven Paketbeispiele, entnommen aus ihren Nachweisblättern unter pilot/. */
const sides = {
  eiche: { path: 'demos/business/', name: 'Eiche &amp; Form', caption: 'Eiche &amp; Form · fiktive Tischlerei · Paket Business',
    notes: [['Kundenfrage', '„Geht das bei meinem schiefen Raum überhaupt?“'], ['Leitidee', 'Die Schiefe ist der Anfang. Eine keilförmige Passleiste nimmt sie auf.'], ['Verworfen', '„Die Werkakte“: spricht nur Menschen mit genau diesem Raum an.'], ['Zielhandlung', 'Vier Maße eintragen, dann anfragen.']],
    sketch: `<svg class="sketch" viewBox="0 0 400 260" role="img" aria-label="Skizze der schiefen Nische: oben 1.184, unten 1.207 Millimeter, rechts die keilförmige Passleiste."><path pathLength="1" class="thin" d="M110 30 V236 M276 30 V236"/><path pathLength="1" d="M122 44 L262 44 L276 222 L110 222 Z"/><path pathLength="1" class="fill" d="M262 44 L276 222 L262 222 Z"/><path pathLength="1" class="thin" d="M122 22 H262 M110 246 H276"/><text x="192" y="16">1.184 oben</text><text x="193" y="258">1.207 unten</text><text x="300" y="140" class="left">Passleiste</text><path pathLength="1" class="thin" d="M296 136 L272 136"/></svg>` },
  klarblick: { path: 'demos/start/', name: 'Klarblick', caption: 'Klarblick · fiktive Fensterreinigung · Paket Start',
    notes: [['Kundenfrage', '„Kommt ihr an mein schwieriges Fenster überhaupt dran?“'], ['Leitidee', 'Die Seite ist eine Hausfront. Jeder Fenstertyp ist ein eigener Abschnitt.'], ['Verworfen', '„Die Fensterliste“: zu wenig zum Erinnern, zu nah an Eiche &amp; Form.'], ['Zielhandlung', 'Das eigene Haus ankreuzen.']],
    sketch: `<svg class="sketch" viewBox="0 0 400 260" role="img" aria-label="Skizze eines Giebels mit rundem Fenster in 7,40 Metern Höhe, erreichbar mit der Reinwasser-Stange."><path pathLength="1" d="M60 236 V120 L200 34 L340 120 V236"/><path pathLength="1" d="M200 79 a26 26 0 1 0 0.01 0 M200 79 V131 M174 105 H226"/><path pathLength="1" class="thin" d="M372 236 V105 M364 105 H380 M364 236 H380"/><text x="372" y="96">7,40 m</text><path pathLength="1" class="thin" d="M150 236 L188 126"/><text x="96" y="252" class="left">Reinwasser-Stange, 10 m</text></svg>` },
  hof: { path: 'demos/complete/', name: 'Hof &amp; Flamme', caption: 'Hof &amp; Flamme · fiktives Restaurant · Paket Complete',
    notes: [['Kundenfrage', '„Was bekomme ich, was kostet es, ist etwas frei?“'], ['Leitidee', 'Die Karte folgt einem Feuer, das kälter wird.'], ['Verworfen', '„Die lange Tafel“: zu nah an Klarblicks Hausfront.'], ['Zielhandlung', 'In zwei Sätzen einen Platz anfragen.']],
    sketch: `<svg class="sketch" viewBox="0 0 400 260" role="img" aria-label="Skizze der fallenden Herdtemperatur: 430 Grad um 18:30, 260 um 19:45, 164 um 21:00, 110 um 22:15."><path pathLength="1" class="thin" d="M40 24 V226 H384"/><path pathLength="1" d="M52 40 C 120 120, 180 160, 250 186 S 350 210, 372 212"/><path pathLength="1" class="thin" d="M52 40 v6 M150 128 v6 M250 186 v6 M352 208 v6"/><text x="58" y="34" class="left">18:30 · 430 °C</text><text x="156" y="120" class="left">19:45 · 260 °C</text><text x="252" y="176" class="left">21:00 · 164 °C</text><text x="384" y="246">22:15 · 110 °C</text></svg>` },
};
type Side = typeof sides[keyof typeof sides];

const flip = (caption: string) => `<figcaption><span>${caption}</span><button class="flip" type="button" aria-pressed="false">Rückseite zeigen</button></figcaption>`;
const panel = (side: Side, base: string, hero = false) => `
  <figure class="panel${hero ? ' panel--hero' : ''}" data-panel${hero ? ' data-hero' : ''}>
    <div class="card">
      <div class="face front"><div class="viewport" inert><iframe src="${base}${side.path}" title="${side.name}, fiktive Beispielwebsite" tabindex="-1" loading="lazy"></iframe></div><span class="face-tag">Vorderseite</span></div>
      <div class="face back"><div class="back-notes"><p class="face-tag face-tag--back">Rückseite</p><dl>${side.notes.map(([term, text]) => `<dt>${term}</dt><dd>${text}</dd>`).join('')}</dl></div>${side.sketch}</div>
      <span class="sheen" aria-hidden="true"></span>
    </div>
    ${flip(side.caption)}
  </figure>`;

/** Shared by the build and the browser fallback; no DOM access during rendering. */
export function renderPageHtml(base: string): string {
  return `
    <a class="skip-link" href="#main">Zum Inhalt springen</a>
    <header class="site-header">
      <a class="wordmark" href="#" aria-label="Webbyu – Startseite">${wordmarkImg(base, '(max-width: 600px) 128px, 145px')}</a>
      <nav aria-label="Hauptnavigation">
        <a href="#arbeiten">Beispiele <span>${String(2 + packageDemos.length).padStart(2, '0')}</span></a>
        <a href="#ansatz">Ansatz</a>
        <a href="#leistungen">Leistungen</a>
        <a href="#pakete">Pakete</a>
        <a href="#ueber-uns">Über mich</a>
        <a href="${base}reise/">Die Reise</a>
      </nav>
      <a class="header-cta" href="#projektfinder">Projekt besprechen ${arrow}</a>
      <button type="button" class="mobile-menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menü öffnen"><span></span><span></span></button>
    </header>
    <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile Navigation" hidden>
      <a href="#arbeiten">Beispiele <span>01</span></a>
      <a href="#ansatz">Ansatz <span>02</span></a>
      <a href="#leistungen">Leistungen <span>03</span></a>
      <a href="#pakete">Pakete <span>04</span></a>
      <a href="#ueber-uns">Über mich <span>05</span></a>
      <a href="${base}reise/">Die Reise ${arrow}</a>
      <a href="#projektfinder">Kontakt & Projekt ${arrow}</a>
    </nav>
    <main id="main" tabindex="-1">
      <section id="hero-story" class="hero-story section-shell" aria-labelledby="hero-title">
        <canvas class="room-light" aria-hidden="true"></canvas>
        <div class="hero-layout">
          <div class="hero-copy">
            <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Lukas Wagner · Webdesign aus Bad Oldesloe</p>
            <h1 id="hero-title">Jede Website hat eine <em>Rückseite.</em></h1>
            <p class="hero-description">Ihre Kunden sehen die Vorderseite: Angebot, Bilder, Kontakt. Dahinter stehen die Fragen, die Ihr Unternehmen ausmachen, und die Entscheidungen, die daraus folgen. Ich gestalte beides, für jedes Unternehmen neu.</p>
            <div class="hero-actions">
              <a class="button button--primary" href="#projektfinder">Ihr Vorhaben durchdenken ${arrow}</a>
              <a class="text-link" href="#arbeiten">Rückseiten ansehen <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          ${panel(sides.eiche, base, true)}
        </div>
        <div class="hero-bottom"><p><span class="status-dot" aria-hidden="true"></span> Lukas Wagner · Konzept, Gestaltung & Entwicklung</p><button type="button" class="motion-control" aria-pressed="false" hidden><span aria-hidden="true">◉</span><span data-motion-label>Bewegung reduzieren</span></button><span>Bad Oldesloe · Stormarn · Hamburg <span aria-hidden="true">↘</span></span></div>
      </section>

      <section id="arbeiten" class="work-section" aria-labelledby="work-title" aria-describedby="gallery-disclaimer">
        <div class="section-shell">
          <div class="section-kicker"><span>01 / DREI BEISPIELE</span><span>Erfundene Unternehmen. Echte Arbeitsweise.</span></div>
          <div class="section-heading gallery-heading">
            <h2 id="work-title">Drei Unternehmen.<br><em>Drei Rückseiten.</em></h2>
            <p>Auf jeder Rückseite steht, von welcher Kundenfrage die Gestaltung ausgeht und welche Richtung dafür verworfen wurde.</p>
          </div>
          <article class="side-row">${panel(sides.klarblick, base)}<div class="side-copy"><h3>Ein Haus voller Fenster.</h3><p><b>Vorne</b> sehen Besucher ihr eigenes Haus wieder: das runde Fenster im Giebel, das über der Treppe.</p><p><b>Hinten</b> steht, warum: Die Höhe ist das eigentliche Problem, und eine Seite wird von oben nach unten gelesen.</p><a class="text-link" href="${base}demos/start/">Klarblick ansehen ${arrow}</a></div></article>
          <article class="side-row side-row--flip">${panel(sides.hof, base)}<div class="side-copy"><h3>Ein Abend am Feuer.</h3><p><b>Vorne</b> läuft die Karte in der Reihenfolge, in der der Herd abkühlt.</p><p><b>Hinten</b> ordnet eine einzige Kurve Gänge, Schriftgröße und Papierfarbe.</p><a class="text-link" href="${base}demos/complete/">Hof &amp; Flamme ansehen ${arrow}</a></div></article>
          <article class="side-row"><figure class="panel panel--yours" data-panel><div class="card"><div class="face front"><div class="blank" aria-hidden="true"><i></i><i></i><i></i><b></b><b></b><b></b></div><span class="face-tag">Ihre Vorderseite</span></div><div class="face back"><div class="back-notes"><p class="face-tag face-tag--back">Ihre Rückseite</p><dl><dt>Kundenfrage</dt><dd>Noch offen.</dd><dt>Leitidee</dt><dd>Entsteht aus Ihrem Unternehmen.</dd><dt>Zielhandlung</dt><dd>Beginnt mit Ihrer ersten Antwort.</dd></dl></div></div><span class="sheen" aria-hidden="true"></span></div>${flip('Ihr Unternehmen')}</figure><div class="side-copy"><h3>Und Ihre?</h3><p>Eine Vorlage hätte vorne schon alles fertig. Bei Ihnen beginnt die Arbeit hinten: mit dem, was Ihre Kunden fragen, und dem, was nach dem Klick bei Ihnen passiert.</p><a class="text-link" href="#projektfinder">Mit Ihrer Rückseite beginnen <span aria-hidden="true">↓</span></a></div></article>
          <details class="studio-lab"><summary><span><span class="lab-label">DAS WEBBYU LABOR</span><strong>Was kann eine Website noch?</strong><span class="lab-description">Auswahlhilfen, Shops und räumliche Erlebnisse ausprobieren.</span></span><span class="lab-toggle" aria-hidden="true">+</span></summary><div class="studio-lab-content"><p>Die Reise verbindet die drei Paketbeispiele mit zwei zusätzlichen Funktionsstudien für Shops und besondere Interaktionen. Diese Erweiterungen werden gesondert angeboten.</p>
          <div id="journey-preview" class="journey-embed" role="region" aria-label="Die Reise – interaktive Vorschau">
            <div class="journey-embed-bar">
              <div class="journey-embed-title"><span class="journey-embed-dot" aria-hidden="true"></span><strong>Die Reise</strong><span>Von der Idee zum Erlebnis.</span></div>
              <div class="journey-embed-actions">
                <a href="${base}reise/" data-journey-page>Reise öffnen ${arrow}</a>
                <button type="button" data-journey-fullscreen aria-label="Die Reise im Vollbild ansehen" aria-pressed="false" hidden><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span data-fullscreen-label>Vollbild</span></button>
              </div>
            </div>
            <iframe class="journey-embed-frame" src="${base}reise/?embed=1" title="Die Reise von Webbyu – acht Stationen und fünf Beispiele" loading="lazy" allow="fullscreen" allowfullscreen></iframe>
            <p class="journey-embed-status" role="status" hidden></p>
          </div>
          <div class="gallery-footer">
            <div class="gallery-shortcuts" role="group" aria-label="Konzept direkt groß öffnen">
              <span>Direkt groß öffnen</span>
              ${concepts.filter(c => c.goal === 'sales' || c.goal === 'raumgut').map(c => `<button type="button" data-demo="${c.goal}" aria-label="${c.name}: Konzeptdemo groß öffnen">${c.name} ${arrow}</button>`).join('')}
            </div>
          </div>
          </div></details>
          <p id="gallery-disclaimer" class="studio-disclaimer">Beispiele für fiktive Marken, keine Kundenreferenzen. Sie können die Abläufe ausprobieren; Anfragen und Käufe sind lokale Simulationen. KI-generierte Bilder sind direkt am Bild gekennzeichnet; eine Übersicht steht im <a href="${base}impressum/#ki-kennzeichnung">Impressum</a>.</p>
        </div>
      </section>

      <section id="ansatz" class="approach-section section-shell" aria-labelledby="approach-title">
        <div class="section-kicker"><span>02 / DER ANSATZ</span><span>Ihr Unternehmen ist der Ausgangspunkt.</span></div>
        <div class="section-heading">
          <h2 id="approach-title">Gute Gestaltung beginnt<br><em>mit einer guten Frage.</em></h2>
          <p>Was soll für Ihre Kunden leichter werden? Eine Website erklärt Ihr Angebot, beantwortet Fragen und bereitet Entscheidungen vor. Deshalb beginnt meine Arbeit mit Ihrem Unternehmen.</p>
        </div>
        <div class="approach-intro"><p>Vielleicht finden Kunden nicht die passende Leistung. Vielleicht fehlen bei Anfragen immer dieselben Angaben. Oder Sie übertragen Informationen mehrmals von Hand.</p><p>Ich kläre mit Ihnen, wo es hakt. Daraus entsteht ein Auftritt mit den Funktionen, die für Ihre Aufgabe sinnvoll sind — vom verständlichen Unternehmensauftritt bis zum angebundenen Shop.</p></div>
        <div class="layers">
          <div class="stack-wrap" aria-hidden="true"><div class="stack">
            <div class="layer" style="--i:3"><span class="layer-tag">04 Betrieb</span><div class="l-run"><b>ihre-firma.de</b><i>Domain: auf Ihren Namen</i><i>Hosting: Ihr Vertrag</i><i>Übergabe: Dateien &amp; Zugänge</i></div></div>
            <div class="layer" style="--i:2"><span class="layer-tag">03 Funktion</span><div class="l-func"><i></i><i></i><i class="short"></i><b>Anfrage vorbereiten</b></div></div>
            <div class="layer" style="--i:1"><span class="layer-tag">02 Gestaltung</span><div class="l-look"><b></b><i></i><i></i><i></i></div></div>
            <div class="layer" style="--i:0"><span class="layer-tag">01 Inhalt</span><div class="l-text"><b></b><i></i><i></i><i class="short"></i><i></i><i class="short"></i></div></div>
          </div></div>
          <ol class="layer-list">
            <li><span>01 Inhalt</span><p>Was fragen Ihre Kunden, bevor sie anrufen?</p></li>
            <li><span>02 Gestaltung</span><p>Woran erkennt man Sie, wenn Ihr Logo fehlt?</p></li>
            <li><span>03 Funktion</span><p>Welche Angabe fehlt Ihnen bei Anfragen immer wieder?</p></li>
            <li><span>04 Betrieb</span><p>Wem gehört die Domain? <b>Ihnen.</b></p></li>
          </ol>
        </div>
        <div class="situation-heading"><span>KENNEN SIE DAS?</span><p>Drei typische Ausgangspunkte — und was daraus werden kann.</p></div>
        <div class="situation-list">${situations.map((situation, index) => `
          <details class="situation" ${index === 0 ? 'open' : ''}>
            <summary><span class="situation-number">0${index + 1}</span><span class="situation-title">${situation.title}</span><span class="situation-toggle" aria-hidden="true">+</span></summary>
            <div class="situation-body"><div><span>Im Alltag</span><p>${situation.context}</p></div><div><span>Ein möglicher Weg</span><p>${situation.approach}</p><p class="situation-example">${situation.example}</p></div><div class="situation-result"><span>Das Ziel</span><p>${situation.result}</p></div></div>
          </details>`).join('')}</div>
        <a class="text-link approach-link" href="#arbeiten">In den Beispielen ausprobieren <span aria-hidden="true">↓</span></a>
      </section>

      <section id="leistungen" class="services-section section-shell" aria-labelledby="services-title">
        <div class="section-kicker"><span>03 / WAS ICH FÜR SIE ENTWICKLE</span><span>Die passende Tiefe für Ihre Aufgabe.</span></div>
        <div class="section-heading">
          <h2 id="services-title">Verständlich nach außen.<br><em>Durchdacht dahinter.</em></h2>
          <p>Manchmal genügt eine klar aufgebaute Website. Manchmal braucht es eine Auswahlhilfe, einen Shop oder die Verbindung zu einem vorhandenen Dienst. Das klären wir vor der Umsetzung.</p>
        </div>
        <div class="services-grid">${services.map((service, index) => `<article><span class="service-number">0${index + 1}</span><h3>${service.name}</h3><p>${service.description}</p><ul>${service.examples.map(example => `<li>${example}</li>`).join('')}</ul><p class="service-outcome">${service.outcome}</p></article>`).join('')}</div>
        <nav class="service-page-links" aria-label="Leistungen im Detail"><a href="${base}websites-fuer-unternehmen/">Ihre Unternehmenswebsite planen ${arrow}</a><a href="${base}anfrageformulare-auswahlhilfen/">Anfrageformulare & Auswahlhilfen ${arrow}</a></nav>
        <div class="service-footnote"><p><strong>Auch die Inhalte gehören zur Lösung.</strong> Texte, eigene Fotos, Videos oder eine interaktive Produktgeschichte können erklären, was Ihr Unternehmen besonders macht. Produktion und technische Anbindungen planen wir passend zum Projekt.</p><a class="text-link" href="#projektfinder">Ihre Aufgabe beschreiben ${arrow}</a></div>
        <div class="development-note"><span>INDIVIDUELL ENTWICKELT</span><p>Gestaltung und Funktionen richten sich nach Ihrem Unternehmen. Wenn ein vorhandener Shop- oder Buchungsdienst gut passt, kann er angebunden werden. Wie Sie Inhalte später pflegen und was im laufenden Betrieb nötig ist, legen wir gemeinsam fest.</p></div>
      </section>

      <section id="pakete" class="packages-section section-shell" aria-labelledby="packages-title" aria-describedby="package-offer-note">
        <div class="section-kicker"><span>04 / PAKETE & INDIVIDUELLE VORHABEN</span><span>Ein klarer Rahmen für Ihren Einstieg.</span></div>
        <div class="section-heading">
          <h2 id="packages-title">Ein passender Einstieg.<br><em>Ein geklärter Umfang.</em></h2>
          <p>Die Pakete geben Orientierung für Unternehmenswebsites und passende Inhalte. Besondere Funktionen und angebundene Dienste planen wir als eigenes Vorhaben.</p>
        </div>
        <p id="package-offer-note" class="offer-note"><strong>Alle Pakete: Angebot auf Anfrage.</strong> Wir klären Ihre Anforderungen und halten Inhalte, Funktionen und Ablauf in einem individuellen Angebot fest.</p>
        <div class="package-list">${packages.map(p => `
          <article class="package-row">
            <span class="package-number">${p.number}</span>
            <div class="package-intro"><h3>${p.name}</h3><p>${p.description}</p><details class="package-details"><summary>Ablauf & Umfang</summary>${p.details.map(detail => `<p>${detail}</p>`).join('')}</details></div>
            <ul>${p.features.map(f => `<li><span aria-hidden="true">↗</span>${f}</li>`).join('')}</ul>
            <div class="package-action"><a class="text-link" href="${base}demos/${p.id}/">Paket-Demo ansehen ↗</a><div><strong class="package-price">${p.price}</strong><span class="package-price-note">Umfang individuell vereinbart</span></div><button type="button" data-package="${p.id}" class="round-arrow" aria-label="Paket ${p.name} vormerken">${arrow}</button></div>
          </article>`).join('')}
        </div>
        <div class="package-included"><span>GEMEINSAM KLÄREN</span><ul><li>Gestaltung & Besucherführung</li><li>Darstellung auf Handy und Computer</li><li>Inhalte & benötigte Funktionen</li><li>Prüfung, Übergabe & Betrieb</li></ul></div>
        <p class="package-scope-note">${businessNotice} ${scopeNotice}</p>
        <div class="package-faq"><h3>Vor dem Start<br><em>gut zu wissen.</em></h3><div>${packageQuestions.map(item => `<details><summary>${item.question}<span aria-hidden="true">+</span></summary><p>${item.answer}</p></details>`).join('')}</div></div>
        <div class="extensions-heading"><h3>Raum für mehr.</h3><p>Erweiterungen, die zu Ihrem Alltag passen.</p></div>
        <div class="extensions-grid">${extensions.map((e, i) => `
          <details class="extension"><summary><span class="extension-index">0${i + 1}</span><span>${e.short}</span><span class="extension-toggle" aria-hidden="true">+</span></summary>
            <div><h4>${e.name}</h4><p>${e.description}</p><button type="button" class="extension-add" data-extension="${e.id}" aria-pressed="false">Für mein Projekt vormerken ${arrow}</button></div>
          </details>`).join('')}
        </div>
      </section>

      <section id="zusammenarbeit" class="about-section" aria-labelledby="about-title">
        <div class="section-shell">
          <div class="section-kicker"><span>05 / ZUSAMMENARBEIT</span><span>Ein Ansprechpartner. Ein gemeinsamer Weg.</span></div>
          <div class="about-layout">
            <div class="about-copy" id="ueber-uns" tabindex="-1">
              <h2 id="about-title">Sie kennen Ihr Geschäft.<br><em>Wir entwickeln den<br>passenden Weg.</em></h2>
              <p>Hinter Webbyu stehe ich als einzelner Gründer. Sie sprechen direkt mit der Person, die Ihr Vorhaben plant, gestaltet und entwickelt. Mein Ausgangspunkt ist Ihr Unternehmen: Ihre Kunden, Ihre Leistungen und die Arbeit dahinter.</p>
              <p>Sie müssen keine fertige technische Lösung mitbringen. Beschreiben Sie, was heute schwierig ist oder was Sie ermöglichen möchten. Ich übersetze das mit Ihnen in einen verständlichen, umsetzbaren Plan.</p>
              <p>Domain und Hosting bleiben in Ihrer Hand. Sie erhalten die vereinbarten Dateien und Zugänge – ohne verpflichtenden laufenden Betreuungsvertrag.</p>
              <a class="text-link" href="${base}ueber-mich/">Lukas Wagner kennenlernen ${arrow}</a>
            </div>
            <ol class="process-list">
              <li><span>01</span><div><h3>Gemeinsam verstehen.</h3><p>Was möchten Sie erreichen? Welche Fragen haben Ihre Kunden? Wir halten fest, wo die Website helfen soll.</p></div></li>
              <li><span>02</span><div><h3>Den Weg festlegen.</h3><p>Sie sehen, welche Inhalte und Funktionen vorgeschlagen werden und warum. Umfang, Kosten und offene Fragen werden besprochen.</p></div></li>
              <li><span>03</span><div><h3>Gestalten & entwickeln.</h3><p>Sie können Entwürfe und wichtige Abläufe früh ausprobieren. Ihre Rückmeldung fließt in die vereinbarten Überarbeitungen ein.</p></div></li>
              <li><span>04</span><div><h3>Prüfen & übergeben.</h3><p>Wir gehen die fertige Lösung gemeinsam durch. Sie erhalten die vereinbarten Dateien, Zugänge und eine Einführung. Betrieb und spätere Änderungen sind geklärt.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section class="seo-guide-section section-shell" aria-labelledby="guide-title">
        <div class="section-kicker"><span>VOR DEM ERSTEN GESPRÄCH</span><a href="${base}ratgeber/">Alle Ratgeber ${arrow}</a></div>
        <div class="section-heading"><h2 id="guide-title">Gut vorbereitet.<br><em>Klar entschieden.</em></h2><p>Welche Angaben braucht ein Angebot? Welche Kosten entstehen später? Zwei praktische Hilfen für Ihre Unternehmenswebsite.</p></div>
        <div class="service-page-links"><a href="${base}ratgeber/website-kosten/">Was kostet eine Unternehmenswebsite? ${arrow}</a><a href="${base}ratgeber/website-planen-checkliste/">Website planen: Ihre Checkliste ${arrow}</a></div>
      </section>
      <section id="projektfinder" class="finder-section" aria-labelledby="finder-title">
        <div class="section-shell">
          <div class="section-kicker"><span>06 / IHR VORHABEN</span><span>Eine konkrete Aufgabe ist ein guter Anfang.</span></div>
          <div class="finder-layout">
            <div class="finder-intro">
              <span class="finder-spark" aria-hidden="true">↗</span>
              <h2 id="finder-title">Was haben<br>Sie <em>vor?</em></h2>
              <p>Was sollen Ihre Kunden besser verstehen oder leichter erledigen können? Was kostet Sie im Alltag unnötig Zeit? Ein paar Fragen helfen, Ihr Vorhaben zu ordnen.</p>
              <p class="finder-assurance">Sie brauchen dafür kein technisches Vorwissen.</p>
              <p class="finder-assurance">${businessNotice}</p>
              <p class="finder-local-note">Der Projektfinder hilft Ihnen, Ihre Wünsche zusammenzustellen. Sie können die Zusammenfassung kopieren und mich direkt kontaktieren.</p>
              <p class="finder-contact-note">Bad Oldesloe, Stormarn & Hamburg.<br>Persönliche Gespräche bei Ihnen nach Vereinbarung.<br>Direkt Kontakt aufnehmen:<br><a href="mailto:lukas.wagner@webbyu.de">lukas.wagner@webbyu.de</a><br><a href="tel:+4917642090983">+49 176 42090983</a></p>
            <div class="finder-back"><p class="face-tag face-tag--back">Ihre Rückseite · Notizen</p><ol class="brief-notes" data-brief-notes><li class="is-empty">Noch leer. Ihre Antworten im Projektberater erscheinen hier als Notizen.</li></ol><p class="brief-local">Ihre Angaben bleiben auf Ihrem Gerät, bis Sie sie selbst weitergeben.</p></div>
            </div>
            <div id="finder-mount"></div>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer section-shell">
      <div class="footer-top"><a class="wordmark" href="#" aria-label="Webbyu – zurück nach oben">${wordmarkImg(base, '(max-width: 600px) 245px, clamp(180px, 30vw, 410px)')}</a><p>Ihr Angebot klarer.<br>Ihr Alltag einfacher.</p><a class="back-to-top" href="#">Zurück nach oben <span aria-hidden="true">↑</span></a></div>
      <nav class="footer-nav" aria-label="Weitere Navigation"><a href="#ansatz">Ansatz</a><a href="#arbeiten">Beispiele</a><a href="#leistungen">Leistungen</a><a href="#pakete">Pakete</a><a href="#ueber-uns">Über mich</a><a href="#projektfinder">Kontakt</a><a href="${base}impressum/">Impressum</a><a href="${base}datenschutz/">Datenschutz</a><button class="privacy-settings" type="button" data-privacy-open>Cookie-Einstellungen</button></nav>
      <div class="legal-notes">
        <details id="impressum"><summary>Impressum</summary><p>Betreiber: Lukas Wagner · Webbyu. Anschrift und Kontakt finden Sie im <a href="${base}impressum/">Impressum</a>.</p></details>
        <details id="datenschutz"><summary>Datenschutz</summary><p>Informationen zum Hosting, zur Kontaktaufnahme und zu Ihrer Cookie-Auswahl finden Sie in der <a href="${base}datenschutz/">Datenschutzerklärung</a>. Der Projektfinder hält Ihre Angaben im Speicher der geöffneten Seite. Kopieren und Bearbeiten übertragen keine Anfrage.</p></details>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Webbyu</span><span>Hamburg · Bad Oldesloe · Umgebung</span><span>Individuelle Websites & Funktionen</span></div>
    </footer>
    <div class="toast" role="status" aria-live="polite"></div>
  `;

}

/** Attach to build-rendered content without replacing nodes or their state. */
export function renderPage(root: HTMLElement): PageMounts {
  if (root.dataset.prerendered !== 'true' || !root.querySelector('#finder-mount')) {
    root.innerHTML = renderPageHtml(import.meta.env.BASE_URL);
    root.dataset.prerendered = 'true';
  }
  return {
    story: root.querySelector<HTMLElement>('#hero-story')!,
    journeyPreview: root.querySelector<HTMLElement>('#journey-preview')!,
    finder: root.querySelector<HTMLElement>('#finder-mount')!,
  };
}
