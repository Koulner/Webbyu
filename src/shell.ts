import { concepts, extensions, packages, packageQuestions, priceDraftNotice, scopeNotice, services } from './data';
import type { PageMounts } from './contracts';

const arrow = '<span aria-hidden="true">↗</span>';

/** Page composition only. Each feature owns its mount contents and listeners. */
export function renderPage(root: HTMLElement): PageMounts {
  root.innerHTML = `
    <a class="skip-link" href="#main">Zum Inhalt springen</a>
    <header class="site-header">
      <a class="wordmark" href="#" aria-label="Webbyu – Startseite">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a>
      <nav aria-label="Hauptnavigation">
        <a href="#arbeiten">Arbeiten <span>${String(concepts.length).padStart(2, '0')}</span></a>
        <a href="#leistungen">Leistungen</a>
        <a href="#pakete">Pakete</a>
        <a href="#ueber-uns">Über uns</a>
      </nav>
      <a class="header-cta" href="#projektfinder">Kontakt & Projekt ${arrow}</a>
      <button type="button" class="mobile-menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menü öffnen"><span></span><span></span></button>
    </header>
    <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile Navigation" hidden>
      <a href="#arbeiten">Arbeiten <span>01</span></a>
      <a href="#leistungen">Leistungen <span>02</span></a>
      <a href="#pakete">Pakete <span>03</span></a>
      <a href="#ueber-uns">Über uns <span>04</span></a>
      <a href="#projektfinder">Kontakt & Projekt ${arrow}</a>
    </nav>
    <main id="main" tabindex="-1">
      <section id="hero-story" class="hero-story section-shell" aria-labelledby="hero-title">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Webdesign & digitale Werkzeuge · Hamburg / Bad Oldesloe</p>
        <div class="hero-layout">
          <h1 id="hero-title">Ihr Business.<br><em>Digital weitergedacht.</em></h1>
          <div class="hero-copy">
            <p class="hero-description">Wir entwickeln Websites und digitale Werkzeuge, die Ihr Angebot verständlich machen, Anfragen vorbereiten und Abläufe vereinfachen. Für Unternehmen in Hamburg, Bad Oldesloe und Umgebung.</p>
            <div class="hero-actions">
              <a class="button button--primary" href="#projektfinder">Projekt skizzieren ${arrow}</a>
              <a class="text-link" href="#arbeiten">Arbeiten entdecken <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>
        <div class="hero-bottom"><p>Zwei Gründer. Von der ersten Idee bis zur Übergabe.</p><span>Individuell gestaltet. Klar vereinbart. In Ihrer Hand.</span></div>
      </section>

      <section id="arbeiten" class="work-section" aria-labelledby="work-title" aria-describedby="gallery-disclaimer">
        <div class="section-shell">
          <div class="section-kicker"><span>01 / AUS DEM ATELIER</span><span>Vier Aufgaben. Vier Lösungen.</span></div>
          <div class="section-heading gallery-heading">
            <h2 id="work-title">Ein Rahmen.<br><em>Ihre Möglichkeiten.</em></h2>
            <p>Ein Raumwunsch, eine technische Frage, ein besonderes Genussprodukt oder ein Möbelshop: Vier Konzepte zeigen, wie aus einer Geschäftsaufgabe ein nutzbarer digitaler Weg wird.</p>
          </div>
          <div class="gallery-workspace">
            <div class="gallery-controls"><div id="catalogue-mount"></div></div>
            <div class="gallery-stage">
              <div class="gallery-stage-label" aria-hidden="true"><span>WEBBYU / KONZEPTSTUDIEN</span><span>GESTALTUNG IN BEWEGUNG</span></div>
              <div id="scene" class="scene-host" aria-label="Interaktive Bühne für die ausgewählte Konzeptdemo"><div id="hero-demo-slot" class="demo--responsive"></div></div>
            </div>
          </div>
          <div class="gallery-footer">
            <p id="gallery-disclaimer">Designstudien für fiktive Marken, keine Kundenreferenzen. Alle Anfragen und Käufe sind lokale Simulationen. Bildmaterial ist KI-generiert.</p>
            <div class="gallery-shortcuts" role="group" aria-label="Konzept direkt groß öffnen">
              <span>Direkt groß öffnen</span>
              ${concepts.map(c => `<button type="button" data-demo="${c.goal}" aria-label="${c.name}: Konzeptdemo groß öffnen">${c.name} ${arrow}</button>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section id="leistungen" class="services-section section-shell" aria-labelledby="services-title">
        <div class="section-kicker"><span>02 / LEISTUNGEN</span><span>Ihr Ziel gibt die Richtung vor.</span></div>
        <div class="section-heading">
          <h2 id="services-title">Erst die Aufgabe.<br><em>Dann die Lösung.</em></h2>
          <p>Was sollen Ihre Kunden verstehen, entscheiden oder tun können? Daraus entwickeln wir Struktur, Gestaltung und die passende Technik.</p>
        </div>
        <div class="services-grid">${services.map((service, index) => `<article><span class="service-number">0${index + 1}</span><h3>${service.name}</h3><p>${service.description}</p></article>`).join('')}</div>
        <div class="service-footnote"><p><strong>Auch besondere Vorhaben beginnen mit einem Gespräch.</strong> Drohne und 360°, Automatisierungen und individuelle Schnittstellen prüfen wir auf Machbarkeit. Umfang, Betrieb und spätere Pflege werden vorher geklärt.</p><a class="text-link" href="#projektfinder">Vorhaben skizzieren ${arrow}</a></div>
      </section>

      <section id="pakete" class="packages-section section-shell" aria-labelledby="packages-title" aria-describedby="price-draft-note">
        <div class="section-kicker"><span>03 / PAKETE</span><span>Ein klarer Rahmen für Ihren Einstieg.</span></div>
        <div class="section-heading">
          <h2 id="packages-title">So viel Website,<br><em>wie Sie brauchen.</em></h2>
          <p>Vom kompakten Auftritt bis zur eigenen Content-Produktion. Drei Paketentwürfe als Grundlage für unser Gespräch.</p>
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
        <div class="package-included"><span>IMMER MIT DABEI</span><ul><li>Individuelle Gestaltung</li><li>Responsive Umsetzung</li><li>Technische SEO-Grundlagen</li><li>Prüfung & vollständige Übergabe</li></ul></div>
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
          <div class="section-kicker"><span>04 / ÜBER UNS</span><span>Ein gemeinsamer Weg.</span></div>
          <div class="about-layout">
            <div class="about-copy" id="ueber-uns" tabindex="-1">
              <h2 id="about-title">Zwei Gründer.<br><em>Eine gemeinsame<br>Arbeitsweise.</em></h2>
              <p>Wir bauen Webbyu als Digitalagentur auf. Unser Schwerpunkt sind verständliche Websites, digitale Werkzeuge und passende Inhalte für Unternehmen in Hamburg, Bad Oldesloe und Umgebung.</p>
              <p>Wir beginnen mit Ihrem Geschäft, Ihren Kunden und den Abläufen dahinter. Gestaltung und Technik folgen der Aufgabe – vom klaren Auftritt bis zum passenden digitalen Werkzeug.</p>
              <p>Domain und Hosting bleiben in Ihrer Hand. Sie erhalten die vereinbarten Dateien und Zugänge – ohne verpflichtenden laufenden Betreuungsvertrag.</p>
              <a class="text-link" href="#projektfinder">Erzählen Sie von Ihrer Idee ${arrow}</a>
            </div>
            <ol class="process-list">
              <li><span>01</span><div><h3>Verstehen.</h3><p>Wir klären Geschäft, Nutzer, Inhalte und Engpässe. Was muss verständlicher oder einfacher werden?</p></div></li>
              <li><span>02</span><div><h3>Strukturieren.</h3><p>Wir ordnen Informationen, priorisieren Funktionen und planen den Weg von der ersten Frage zur nächsten Handlung.</p></div></li>
              <li><span>03</span><div><h3>Gestalten & entwickeln.</h3><p>Aus der Struktur wird eine eigenständige, funktionierende Oberfläche – auf dem großen Bildschirm und in der Hand.</p></div></li>
              <li><span>04</span><div><h3>Übergeben.</h3><p>Wir prüfen Ihren Auftritt gemeinsam. Sie bekommen eine verständliche Einführung und einen klaren nächsten Schritt.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section id="projektfinder" class="finder-section" aria-labelledby="finder-title">
        <div class="section-shell">
          <div class="section-kicker"><span>05 / KONTAKT & PROJEKT</span><span>Aus einer Idee wird eine Richtung.</span></div>
          <div class="finder-layout">
            <div class="finder-intro">
              <span class="finder-spark" aria-hidden="true">✳</span>
              <h2 id="finder-title">Was haben<br>Sie <em>vor?</em></h2>
              <p>Ein paar Fragen zu Ihrem Vorhaben. Daraus entsteht eine erste Empfehlung – und Ihr persönliches Projektbriefing.</p>
              <p class="finder-assurance">Zum Weiterdenken, ganz unverbindlich.</p>
              <p class="finder-local-note">Sie können Ihre Zusammenfassung am Ende kopieren. In diesem Prototyp wird nichts versendet.</p>
              <p class="finder-contact-note">Hamburg, Bad Oldesloe & Umgebung.<br>Geschäftliche E-Mail und Telefonnummer werden noch bestätigt.</p>
            </div>
            <div id="finder-mount"></div>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer section-shell">
      <div class="footer-top"><a class="wordmark" href="#" aria-label="Webbyu – zurück nach oben">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a><p>Websites mit Charakter.<br>Für Menschen mit Ideen.</p><a class="back-to-top" href="#">Zurück nach oben <span aria-hidden="true">↑</span></a></div>
      <nav class="footer-nav" aria-label="Weitere Navigation"><a href="#leistungen">Leistungen</a><a href="#pakete">Pakete</a><a href="#ueber-uns">Über uns</a><a href="#projektfinder">Kontakt</a><a href="#impressum">Impressum</a><a href="#datenschutz">Datenschutz</a></nav>
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
