import { concepts, extensions, packages, packageQuestions, priceDraftNotice, scopeNotice, services, situations } from './data';
import type { PageMounts } from './contracts';
import { landscapeSvg } from './journey/map';

const arrow = '<span aria-hidden="true">↗</span>';

/** Page composition only. Each feature owns its mount contents and listeners. */
export function renderPage(root: HTMLElement): PageMounts {
  root.innerHTML = `
    <a class="skip-link" href="#main">Zum Inhalt springen</a>
    <header class="site-header">
      <a class="wordmark" href="#" aria-label="Webbyu – Startseite">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a>
      <nav aria-label="Hauptnavigation">
        <a href="#ansatz">Ansatz</a>
        <a href="#arbeiten">Beispiele <span>${String(concepts.length).padStart(2, '0')}</span></a>
        <a href="${import.meta.env.BASE_URL}reise/">Die Reise</a>
        <a href="#leistungen">Leistungen</a>
        <a href="#pakete">Pakete</a>
        <a href="#ueber-uns">Über mich</a>
      </nav>
      <a class="header-cta" href="#projektfinder">Projekt besprechen ${arrow}</a>
      <button type="button" class="mobile-menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menü öffnen"><span></span><span></span></button>
    </header>
    <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile Navigation" hidden>
      <a href="#ansatz">Ansatz <span>01</span></a>
      <a href="#arbeiten">Beispiele <span>02</span></a>
      <a href="${import.meta.env.BASE_URL}reise/">Die Reise <span>03</span></a>
      <a href="#leistungen">Leistungen <span>04</span></a>
      <a href="#pakete">Pakete <span>05</span></a>
      <a href="#ueber-uns">Über mich <span>06</span></a>
      <a href="#projektfinder">Kontakt & Projekt ${arrow}</a>
    </nav>
    <main id="main" tabindex="-1">
      <section id="hero-story" class="hero-story section-shell" aria-labelledby="hero-title">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Individuelle Websites & hilfreiche Funktionen</p>
        <div class="hero-layout">
          <div class="hero-copy">
            <h1 id="hero-title">Ihr Angebot klarer.<br><em>Ihr Alltag einfacher.</em></h1>
            <p class="hero-description">Ich entwickle Websites, die erklären, was Sie anbieten, Kunden bei der Auswahl helfen und Arbeit im Hintergrund erleichtern. Gemeinsam finden wir heraus, was Ihr Unternehmen dafür wirklich braucht.</p>
            <div class="hero-actions">
              <a class="button button--primary" href="#projektfinder">Über Ihr Vorhaben sprechen ${arrow}</a>
              <a class="text-link" href="#ansatz">Den Ansatz kennenlernen <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <aside class="hero-working-note" aria-label="Wie ich an ein Projekt herangehe">
            <div class="working-note-heading"><span>VON DER AUFGABE ZUR LÖSUNG</span><span aria-hidden="true">↗</span></div>
            <div class="working-note-row"><span>01 / Verstehen</span><h2>Was soll<br>leichter werden?</h2><p>Für Ihre Kunden. Für Sie. Für die Menschen, die damit arbeiten.</p></div>
            <div class="working-note-row"><span>02 / Gestalten</span><h2>Klar im Auftritt.</h2><p>Inhalte, Gestaltung und Funktionen, die zusammenpassen.</p></div>
            <div class="working-note-result"><span>03 / Umsetzen</span><strong>Nützlich im Alltag.</strong><p>Individuell entwickelt und passend zu Ihren Abläufen.</p></div>
          </aside>
        </div>
        <div class="hero-bottom"><p>Webbyu · Ein Gründer, ein direkter Ansprechpartner.</p><span>Hamburg · Bad Oldesloe · Umgebung</span></div>
      </section>

      <section id="ansatz" class="approach-section section-shell" aria-labelledby="approach-title">
        <div class="section-kicker"><span>01 / DER ANSATZ</span><span>Ihr Unternehmen ist der Ausgangspunkt.</span></div>
        <div class="section-heading">
          <h2 id="approach-title">Eine Website ist ein Teil<br><em>Ihrer täglichen Arbeit.</em></h2>
          <p>Sie erklärt Ihr Angebot, beantwortet Fragen und bereitet Entscheidungen vor. Deshalb schaue ich auch auf das, was vor und nach einem Besuch passiert.</p>
        </div>
        <div class="approach-intro"><p>Vielleicht finden Kunden nicht die passende Leistung. Vielleicht fehlen bei Anfragen immer dieselben Angaben. Oder Sie übertragen Informationen mehrmals von Hand.</p><p>Ich kläre mit Ihnen, wo es hakt. Daraus entsteht ein Auftritt mit den Funktionen, die für Ihre Aufgabe sinnvoll sind — vom verständlichen Unternehmensauftritt bis zum angebundenen Shop.</p></div>
        <div class="situation-heading"><span>KENNEN SIE DAS?</span><p>Drei typische Ausgangspunkte — und was daraus werden kann.</p></div>
        <div class="situation-list">${situations.map((situation, index) => `
          <details class="situation" ${index === 0 ? 'open' : ''}>
            <summary><span class="situation-number">0${index + 1}</span><span class="situation-title">${situation.title}</span><span class="situation-toggle" aria-hidden="true">+</span></summary>
            <div class="situation-body"><div><span>Im Alltag</span><p>${situation.context}</p></div><div><span>Ein möglicher Weg</span><p>${situation.approach}</p><p class="situation-example">${situation.example}</p></div><div class="situation-result"><span>Das Ziel</span><p>${situation.result}</p></div></div>
          </details>`).join('')}</div>
        <a class="text-link approach-link" href="#arbeiten">In den Beispielen ausprobieren <span aria-hidden="true">↓</span></a>
      </section>

      <section id="arbeiten" class="work-section" aria-labelledby="work-title" aria-describedby="gallery-disclaimer">
        <div class="section-shell">
          <div class="section-kicker"><span>02 / BEISPIELE ZUM AUSPROBIEREN</span><span>Vier Aufgaben. Vier eigene Wege.</span></div>
          <div class="section-heading gallery-heading">
            <h2 id="work-title">So kann sich eine<br><em>gute Lösung anfühlen.</em></h2>
            <p>Wünsche für einen Raum sammeln, ein technisches Anliegen einordnen oder das passende Produkt finden: Probieren Sie aus, wie die Website bei einer konkreten Aufgabe helfen kann.</p>
          </div>
          <div class="gallery-workspace">
            <div class="gallery-controls"><div id="catalogue-mount"></div></div>
            <div class="gallery-stage">
              <div class="gallery-stage-label" aria-hidden="true"><span>WEBBYU / FUNKTIONIERENDE BEISPIELE</span><span>AUSWÄHLEN · AUSPROBIEREN · VERSTEHEN</span></div>
              <div id="scene" class="scene-host" aria-label="Interaktive Bühne für die ausgewählte Konzeptdemo"><div id="hero-demo-slot" class="demo--responsive"></div></div>
            </div>
          </div>
          <div class="gallery-footer">
            <p id="gallery-disclaimer">Beispiele für fiktive Marken, keine Kundenreferenzen. Sie können die Abläufe ausprobieren; Anfragen und Käufe sind lokale Simulationen. Bildmaterial ist KI-generiert.</p>
            <div class="gallery-shortcuts" role="group" aria-label="Konzept direkt groß öffnen">
              <span>Direkt groß öffnen</span>
              ${concepts.map(c => `<button type="button" data-demo="${c.goal}" aria-label="${c.name}: Konzeptdemo groß öffnen">${c.name} ${arrow}</button>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section id="leistungen" class="services-section section-shell" aria-labelledby="services-title">
        <div class="section-kicker"><span>03 / WAS ICH FÜR SIE ENTWICKLE</span><span>Die passende Tiefe für Ihre Aufgabe.</span></div>
        <div class="section-heading">
          <h2 id="services-title">Verständlich nach außen.<br><em>Durchdacht dahinter.</em></h2>
          <p>Manchmal genügt eine klar aufgebaute Website. Manchmal braucht es eine Auswahlhilfe, einen Shop oder die Verbindung zu einem vorhandenen Dienst. Das klären wir vor der Umsetzung.</p>
        </div>
        <div class="services-grid">${services.map((service, index) => `<article><span class="service-number">0${index + 1}</span><h3>${service.name}</h3><p>${service.description}</p><ul>${service.examples.map(example => `<li>${example}</li>`).join('')}</ul><p class="service-outcome">${service.outcome}</p></article>`).join('')}</div>
        <div class="service-footnote"><p><strong>Auch die Inhalte gehören zur Lösung.</strong> Texte, eigene Fotos, Videos oder eine interaktive Produktgeschichte können erklären, was Ihr Unternehmen besonders macht. Produktion und technische Anbindungen planen wir passend zum Projekt.</p><a class="text-link" href="#projektfinder">Ihre Aufgabe beschreiben ${arrow}</a></div>
        <div class="development-note"><span>INDIVIDUELL ENTWICKELT</span><p>Gestaltung und Funktionen richten sich nach Ihrem Unternehmen. Wenn ein vorhandener Shop- oder Buchungsdienst gut passt, kann er angebunden werden. Wie Sie Inhalte später pflegen und was im laufenden Betrieb nötig ist, legen wir gemeinsam fest.</p></div>
      </section>

      <section id="pakete" class="packages-section section-shell" aria-labelledby="packages-title" aria-describedby="price-draft-note">
        <div class="section-kicker"><span>04 / PAKETE & INDIVIDUELLE VORHABEN</span><span>Ein klarer Rahmen für Ihren Einstieg.</span></div>
        <div class="section-heading">
          <h2 id="packages-title">Ein passender Einstieg.<br><em>Ein geklärter Umfang.</em></h2>
          <p>Die Pakete geben Orientierung für Unternehmenswebsites und passende Inhalte. Besondere Funktionen und angebundene Dienste planen wir als eigenes Vorhaben.</p>
        </div>
        <p id="price-draft-note" class="draft-note"><strong>Die Preise sind interne Entwürfe.</strong> Steuerbasis und endgültiger Leistungsumfang sind noch offen. Ein verbindliches Angebot entsteht erst nach Abstimmung.</p>
        <div class="package-list">${packages.map(p => `
          <article class="package-row">
            <span class="package-number">${p.number}</span>
            <div class="package-intro"><h3>${p.name}</h3><p>${p.description}</p><details class="package-details"><summary>Ablauf & Umfang</summary>${p.details.map(detail => `<p>${detail}</p>`).join('')}</details></div>
            <ul>${p.features.map(f => `<li><span aria-hidden="true">↗</span>${f}</li>`).join('')}</ul>
            <div class="package-action"><div><strong class="package-price">${p.price}</strong><span class="package-price-note">${priceDraftNotice}</span></div><button type="button" data-package="${p.id}" class="round-arrow" aria-label="Paket ${p.name} vormerken">${arrow}</button></div>
          </article>`).join('')}
        </div>
        <div class="package-included"><span>IMMER MIT DABEI</span><ul><li>Individuelle Gestaltung</li><li>Für Handy und Computer entwickelt</li><li>Technische Grundlagen für Suchmaschinen</li><li>Prüfung & vollständige Übergabe</li></ul></div>
        <p class="package-scope-note">${scopeNotice} Seitenzählung und Zusatzseitenpreise werden vor Angebotsfreigabe bestätigt.</p>
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
              <a class="text-link" href="#projektfinder">Erzählen Sie von Ihrer Idee ${arrow}</a>
            </div>
            <ol class="process-list">
              <li><span>01</span><div><h3>Gemeinsam verstehen.</h3><p>Was möchten Sie erreichen? Welche Fragen haben Ihre Kunden? Wir halten fest, wo die Website helfen soll.</p></div></li>
              <li><span>02</span><div><h3>Den Weg festlegen.</h3><p>Sie sehen, welche Inhalte und Funktionen vorgeschlagen werden und warum. Umfang, Kosten und offene Fragen werden besprochen.</p></div></li>
              <li><span>03</span><div><h3>Gestalten & entwickeln.</h3><p>Sie können Entwürfe und wichtige Abläufe früh ausprobieren. Ihre Rückmeldung fließt in die vereinbarten Überarbeitungen ein.</p></div></li>
              <li><span>04</span><div><h3>Prüfen & übergeben.</h3><p>Wir gehen die fertige Lösung gemeinsam durch. Sie erhalten die vereinbarten Dateien, Zugänge und eine Einführung. Betrieb und spätere Änderungen sind geklärt.</p></div></li>
            </ol>
          </div>
          <a class="journey-teaser" href="${import.meta.env.BASE_URL}reise/">
            <div class="journey-teaser-landscape">${landscapeSvg()}</div>
            <div><span>DIE REISE / WEBBYU</span><h3>Eine Idee nimmt<br>Form an.</h3><p>Vom ersten Gedanken zu vier erlebbaren Konzeptstudien. Entdecken Sie verbundene Erlebnisräume, in denen Inhalt, Gestaltung und Funktion zusammenfinden.</p><span class="journey-teaser-link">Die Reise entdecken ${arrow}</span></div>
          </a>
        </div>
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
              <p class="finder-local-note">Sie können Ihre Zusammenfassung am Ende kopieren. In diesem Prototyp wird nichts versendet.</p>
              <p class="finder-contact-note">Hamburg, Bad Oldesloe & Umgebung.<br>Geschäftliche E-Mail und Telefonnummer werden noch bestätigt.</p>
            </div>
            <div id="finder-mount"></div>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer section-shell">
      <div class="footer-top"><a class="wordmark" href="#" aria-label="Webbyu – zurück nach oben">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a><p>Ihr Angebot klarer.<br>Ihr Alltag einfacher.</p><a class="back-to-top" href="#">Zurück nach oben <span aria-hidden="true">↑</span></a></div>
      <nav class="footer-nav" aria-label="Weitere Navigation"><a href="#ansatz">Ansatz</a><a href="#arbeiten">Beispiele</a><a href="#leistungen">Leistungen</a><a href="#pakete">Pakete</a><a href="#ueber-uns">Über mich</a><a href="#projektfinder">Kontakt</a><a href="#impressum">Impressum</a><a href="#datenschutz">Datenschutz</a></nav>
      <div class="legal-notes">
        <details id="impressum"><summary>Impressum · noch zu ergänzen</summary><p>Interner Platzhalter. Betreiber, Rechtsform, ladungsfähige Anschrift und geschäftliche Kontaktdaten sind noch zu bestätigen. Eine freigegebene Anbieterkennzeichnung liegt noch nicht vor.</p></details>
        <details id="datenschutz"><summary>Datenschutz · noch zu ergänzen</summary><p>Interner Platzhalter. Die endgültige Erklärung muss Hosting und die tatsächlich eingesetzten Dienste berücksichtigen. Der Projektfinder speichert Angaben nur im Arbeitsspeicher dieses Tabs und versendet sie nicht. Erst der Kopierknopf überträgt die Zusammenfassung in Ihre Zwischenablage. Dieser Hinweis ersetzt keine vollständige Datenschutzerklärung.</p></details>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Webbyu</span><span>Hamburg · Bad Oldesloe · Umgebung</span><span>Designprototyp · Angaben noch in Abstimmung</span></div>
    </footer>
    <div class="toast" role="status" aria-live="polite"></div>
  `;

  return {
    story: root.querySelector<HTMLElement>('#hero-story')!,
    scene: root.querySelector<HTMLElement>('#scene')!,
    demoSlot: root.querySelector<HTMLElement>('#hero-demo-slot')!,
    catalogue: root.querySelector<HTMLElement>('#catalogue-mount')!,
    finder: root.querySelector<HTMLElement>('#finder-mount')!,
  };
}
