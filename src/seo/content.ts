type PageContext = { link: (path: string) => string };

type ContentPage = {
  label: string;
  eyebrow: string;
  title: string;
  introduction: string;
  article?: boolean;
  body: (context: PageContext) => string;
};

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const pages: Record<string, ContentPage> = {
  '/websites-fuer-unternehmen/': {
    label: 'Websites für Unternehmen',
    eyebrow: 'Individuelle Websites · Bad Oldesloe & Stormarn',
    title: 'Eine Website, die zu Ihrem Unternehmen passt.',
    introduction: 'Ihr Angebot soll verständlich sein. Ihre Kunden sollen erkennen, ob Sie der richtige Ansprechpartner sind. Ich plane und entwickle Websites für kleine Unternehmen und Selbstständige – mit Ihnen, aus Bad Oldesloe.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="aufgabe">
        <div class="content-section-label">01 / Die Aufgabe</div>
        <div class="content-section-body">
          <h2 id="aufgabe">Was soll Ihre Website für Sie tun?</h2>
          <p>Vielleicht beginnt Ihr Unternehmen gerade. Vielleicht erklärt die bisherige Seite nicht mehr, was Sie heute anbieten. Oder Interessenten melden sich, ohne die Angaben mitzubringen, die Sie für ein erstes Gespräch brauchen.</p>
          <p>Wir beginnen bei diesen Situationen. Daraus ergibt sich, welche Inhalte, Seiten und Funktionen sinnvoll sind. Eine übersichtliche Unternehmenswebsite kann genügen. Eine besondere Auswahlhilfe, Buchung oder ein Shop braucht eine eigene Planung.</p>
          <div class="content-card-grid">
            <article class="content-card"><span class="content-card-number">01</span><h3>Ihr Angebot zeigen</h3><p>Leistungen, Einsatzgebiet und Arbeitsweise so ordnen, dass Besucher die für sie wichtigen Antworten finden.</p></article>
            <article class="content-card"><span class="content-card-number">02</span><h3>Vertrauen aufbauen</h3><p>Mit nachvollziehbaren Informationen über Ihr Unternehmen, eigenen Bildern und belegbaren Arbeitsbeispielen.</p></article>
            <article class="content-card"><span class="content-card-number">03</span><h3>Kontakt vorbereiten</h3><p>Einen passenden nächsten Schritt anbieten: direkt Kontakt aufnehmen oder ein Anliegen mit wenigen Fragen genauer beschreiben.</p></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="umfang">
        <div class="content-section-label">02 / Der Umfang</div>
        <div class="content-section-body">
          <h2 id="umfang">Erst die Aufgabe. Dann die passenden Bestandteile.</h2>
          <p>Ich verbinde Planung, Gestaltung und Entwicklung. Im individuellen Angebot halten wir fest, welche Leistungen Sie beauftragen und welches Material Sie mitbringen.</p>
          <dl class="content-definition-list">
            <div><dt>Inhalte und Struktur</dt><dd>Welche Fragen beantworten die Startseite und weitere Seiten? Was braucht einen eigenen Platz, was lässt sich verständlich zusammenfassen?</dd></div>
            <div><dt>Gestaltung und Entwicklung</dt><dd>Ein individueller Auftritt, der zu Ihrem Unternehmen passt und sich auf kleinen wie großen Bildschirmen bedienen lässt.</dd></div>
            <div><dt>Kontakt und Anfragen</dt><dd>Ein sinnvoller Kontaktweg. Umfangreichere Abfragen und Verbindungen zu vorhandenen Diensten werden gesondert geplant.</dd></div>
            <div><dt>Foto, Video und Text</dt><dd>Vorhandene, freigegebene Materialien können eingebunden werden. Eigene Produktion, Bearbeitung und Nutzungsrechte vereinbaren wir passend zum Projekt.</dd></div>
            <div><dt>Auffindbarkeit</dt><dd>Verständliche Seiten, aussagekräftige Seitentitel und eine technisch zugängliche Grundlage. Zusätzliche SEO-Arbeit wird gesondert vereinbart; eine bestimmte Suchposition lässt sich nicht versprechen.</dd></div>
          </dl>
          <p>Shops, komplexe Buchungen und individuelle Integrationen sind keine automatisch enthaltenen Paketleistungen. Dass Sie eine Funktion in einer Konzeptdemo ausprobieren können, bedeutet noch nicht, dass sie zu jedem Auftrag gehört.</p>
          <a class="content-text-link" href="${link('/anfrageformulare-auswahlhilfen/')}">Wie Auswahlhilfen und strukturierte Anfragen funktionieren <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="zusammenarbeit">
        <div class="content-section-label">03 / Die Zusammenarbeit</div>
        <div class="content-section-body">
          <h2 id="zusammenarbeit">Ein direkter Ansprechpartner. Ein nachvollziehbarer Ablauf.</h2>
          <ol class="content-step-list">
            <li><h3>Vorhaben klären</h3><p>Sie beschreiben Ihr Unternehmen, die wichtigsten Leistungen und die Aufgabe der Website. Wir sehen uns an, was bereits vorhanden ist und was noch fehlt.</p></li>
            <li><h3>Umfang vereinbaren</h3><p>Das Angebot benennt Seiten, Funktionen, Materialien, Abstimmungen, Freigaben und Zuständigkeiten. Zeitrahmen und laufende Fremdkosten werden vor dem Auftrag geklärt.</p></li>
            <li><h3>Gestalten und entwickeln</h3><p>Aus der vereinbarten Struktur entsteht der Auftritt. Rückmeldungen werden gebündelt; zusätzliche Wünsche besprechen wir vor ihrer Umsetzung.</p></li>
            <li><h3>Prüfen und übergeben</h3><p>Inhalte, Links, Bedienung und Kontaktweg werden geprüft. Sie erhalten die vereinbarten Dateien und Zugänge sowie eine Einführung in die für Sie vorgesehenen Möglichkeiten.</p></li>
          </ol>
          <p>Webbyu hat seinen Sitz in Bad Oldesloe. Ich arbeite mit kleinen Unternehmen in Stormarn und betreue auch Vorhaben aus Hamburg und Umgebung. Nach Vereinbarung besuche ich Sie auch persönlich in Ihrem Unternehmen. Gesprächstermine sind nach Vereinbarung am Wochenende möglich.</p>
        </div>
      </section>
      <section class="content-section" aria-labelledby="vor-der-anfrage">
        <div class="content-section-label">04 / Vor Ihrer Anfrage</div>
        <div class="content-section-body">
          <h2 id="vor-der-anfrage">Was Sie vorab wissen sollten.</h2>
          <div class="content-faq">
            <details><summary>Was kostet die Website?</summary><p>Sie erhalten ein Angebot auf Anfrage. Maßgeblich sind unter anderem Seitenstruktur, vorhandene Inhalte, Gestaltung und Funktionen. Einen konkreten Preis nenne ich nach der Umfangsklärung. Der <a href="${link('/ratgeber/website-kosten/')}">Ratgeber zu Websitekosten</a> hilft Ihnen, Angebote und laufende Kosten einzuordnen.</p></details>
            <details><summary>Muss ich schon fertige Texte und Bilder haben?</summary><p>Nein. Für den Einstieg hilft eine Übersicht darüber, was vorhanden ist. Wir klären, was Sie liefern können und ob Unterstützung bei Texten, Fotografie oder Video benötigt wird. Produktion und Nutzungsrechte sind Teil der Umfangsvereinbarung.</p></details>
            <details><summary>Kann ich später Inhalte selbst ändern?</summary><p>Wenn Sie Inhalte selbst pflegen möchten, planen wir eine passende Möglichkeit dafür. Nicht jede Website benötigt dieselben Pflegefunktionen. Entscheidend ist, welche Änderungen bei Ihnen tatsächlich anfallen und wer sie übernehmen soll.</p></details>
            <details><summary>Bin ich an einen laufenden Betreuungsvertrag gebunden?</summary><p>Ein monatlicher Betreuungsvertrag mit Webbyu ist nicht verpflichtend. Domain und Hosting laufen auf Ihren Namen. Wir legen fest, wer sich nach der Übergabe um Pflege, technische Aktualisierungen und weitere Änderungen kümmert. Hosting und mögliche Fremdlizenzen können laufende Kosten verursachen.</p></details>
            <details><summary>Sind die gezeigten Beispiele Kundenprojekte?</summary><p>Die gezeigten Beispiele sind fiktive Konzeptstudien. Sie zeigen Gestaltung und mögliche Funktionen. Anfragen und Käufe darin sind lokale Simulationen; die Studien sind keine Kundenreferenzen.</p></details>
          </div>
          <a class="content-text-link" href="${link('/ratgeber/website-planen-checkliste/')}">Mit der Website-Checkliste vorbereiten <span aria-hidden="true">↗</span></a>
        </div>
      </section>`,
  },
  '/anfrageformulare-auswahlhilfen/': {
    label: 'Anfrageformulare & Auswahlhilfen',
    eyebrow: 'Wenn vor dem Gespräch noch Fragen offen sind',
    title: 'Aus einer ersten Frage wird ein klareres Anliegen.',
    introduction: 'Ein freies Nachrichtenfeld passt nicht zu jeder Aufgabe. Ich entwickle Anfragewege und Auswahlhilfen, die relevante Angaben Schritt für Schritt zusammenbringen – verständlich für Ihre Kunden und passend zu Ihrer Arbeit.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="sinnvoll">
        <div class="content-section-label">01 / Der Bedarf</div>
        <div class="content-section-body">
          <h2 id="sinnvoll">Wann helfen zusätzliche Fragen?</h2>
          <p>Wenn Sie nach einer Anfrage regelmäßig dieselben Angaben nachfordern, lohnt sich ein Blick auf den Weg dorthin. Bei einer Raumgestaltung sind beispielsweise Nutzung und Wünsche wichtig. Bei einem technischen Anliegen muss zunächst klar sein, ob es um Beratung, Wartung oder eine Störung geht.</p>
          <p>Eine gute Abfrage sammelt nur, was für den nächsten Schritt gebraucht wird. Sie erklärt ungewohnte Begriffe und zeigt Folgefragen erst dann, wenn sie zum Anliegen passen. Für eine einfache Rückrufbitte kann ein kurzer Kontaktweg völlig genügen.</p>
          <div class="content-note"><h3>Die Entscheidung bleibt nachvollziehbar.</h3><p>Eine Auswahlhilfe kann Möglichkeiten erklären und ein Gespräch vorbereiten. Sie ersetzt keine fachliche Prüfung, verbindliche Kalkulation oder persönliche Beratung, wenn diese für Ihr Angebot erforderlich sind.</p></div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="beispiele">
        <div class="content-section-label">02 / Eigene Arbeitsbeispiele</div>
        <div class="content-section-body">
          <h2 id="beispiele">Zwei Aufgaben. Zwei unterschiedliche Wege.</h2>
          <p>Diese Beispiele stammen aus meinen fiktiven Konzeptstudien. Sie sind keine Kundenaufträge. Die darin erfassten Angaben bleiben in der jeweiligen Demo; es wird keine echte Anfrage versendet.</p>
          <div class="content-example-grid">
            <article class="content-example"><p class="content-eyebrow">Paketbeispiel / Klarblick</p><h3>Eine Anfrage einfach vorbereiten.</h3><p><strong>Die Ausgangslage:</strong> Für eine Fensterreinigung helfen Angaben zu Ort, Fensterzahl und Zugang.</p><p><strong>Der Ansatz:</strong> Ein übersichtliches Formular sammelt die Informationen für den nächsten Schritt.</p><p><strong>Die Grenze:</strong> Das Formular ist eine lokale Simulation und sendet keine Anfrage.</p><a class="content-text-link" href="${link('/demos/start/')}">Klarblick ansehen <span aria-hidden="true">↗</span></a></article>
            <article class="content-example"><p class="content-eyebrow">Paketbeispiel / Eiche &amp; Form</p><h3>Eine Nische messen.</h3><p><strong>Die Ausgangslage:</strong> Ob ein Einbaumöbel in eine schiefe Altbaunische passt, lässt sich ohne Maße kaum sagen.</p><p><strong>Der Ansatz:</strong> Das Formular fragt vier Maße ab und zeichnet daraus sofort die Nische mit den nötigen Passleisten.</p><p><strong>Die Grenze:</strong> Die Demo verschickt keine Angaben und erstellt kein Angebot.</p><a class="content-text-link" href="${link('/demos/business/kontakt/')}">Eiche &amp; Form ansehen <span aria-hidden="true">↗</span></a></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="planung">
        <div class="content-section-label">03 / Die Planung</div>
        <div class="content-section-body">
          <h2 id="planung">Was nach dem Absenden passiert, gehört zur Aufgabe.</h2>
          <p>Ein Formular ist erst dann sinnvoll geplant, wenn auch der weitere Ablauf klar ist. Wer bekommt die Nachricht? In welcher Form werden die Angaben benötigt? Was sieht der Besucher bei einem Fehler? Diese Fragen klären wir vor der Entwicklung.</p>
          <ol class="content-step-list">
            <li><h3>Die wiederkehrenden Rückfragen sammeln</h3><p>Wir betrachten typische Anliegen, ohne unnötig personenbezogene Kundendaten zu übernehmen. Daraus entsteht eine kleine Auswahl tatsächlich relevanter Fragen.</p></li>
            <li><h3>Wege und Grenzen festlegen</h3><p>Wir unterscheiden notwendige und freiwillige Angaben, definieren passende Folgefragen und erklären, wann eine persönliche Rückfrage sinnvoller ist.</p></li>
            <li><h3>Empfang und Übergabe vereinbaren</h3><p>Eine E-Mail, eine Zusammenfassung oder eine Anbindung an einen vorhandenen Dienst sind unterschiedliche Umfänge. Der tatsächliche Weg wird im Angebot beschrieben.</p></li>
            <li><h3>Die ganze Strecke prüfen</h3><p>Wir prüfen verständliche Fragen, Bedienung auf kleinen Bildschirmen, Tastatur, Fehlermeldungen und den vereinbarten Empfangsweg. Eine Meldung im Browser allein ist noch kein Nachweis dafür, dass die zuständige Person die Nachricht erhalten hat.</p></li>
          </ol>
        </div>
      </section>
      <section class="content-section" aria-labelledby="grenzen">
        <div class="content-section-label">04 / Der vereinbarte Umfang</div>
        <div class="content-section-body">
          <h2 id="grenzen">So viel Funktion wie Ihre Aufgabe braucht.</h2>
          <p>Eine kurze Abfrage lässt sich in einen Unternehmensauftritt einplanen. Komplexe Buchungen, Shops, individuelle Berechnungen und Verbindungen zu anderen Systemen benötigen einen gesonderten Umfang und ein eigenes Angebot.</p>
          <p>Bringen Sie für das erste Gespräch am besten drei wiederkehrende Rückfragen und eine Beschreibung des heutigen Ablaufs mit. Echte Kundennamen oder vertrauliche Nachrichten werden dafür nicht benötigt.</p>
          <a class="content-text-link" href="${link('/websites-fuer-unternehmen/')}">Zur Planung Ihrer Unternehmenswebsite <span aria-hidden="true">↗</span></a>
        </div>
      </section>`,
  },
  '/ueber-mich/': {
    label: 'Über mich',
    eyebrow: 'Lukas Wagner · Webbyu · Bad Oldesloe',
    title: 'Ich plane, gestalte und entwickle Ihren Auftritt.',
    introduction: 'Hinter Webbyu stehe ich als einzelner Gründer. Sie sprechen mit der Person, die sich mit Ihrem Angebot beschäftigt und Ihre Website entwickelt. Mein Ausgangspunkt ist Ihr Unternehmen – und die Menschen, die mit der Website etwas tun möchten.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="arbeitsweise">
        <div class="content-section-label">01 / Meine Arbeitsweise</div>
        <div class="content-section-body">
          <h2 id="arbeitsweise">Verstehen, bevor etwas entsteht.</h2>
          <p>Welche Fragen stellen Ihre Kunden? Was ist an Ihrem Angebot erklärungsbedürftig? Und welche Arbeit entsteht bei Ihnen nach einer Anfrage? Aus den Antworten leite ich eine passende Struktur, Gestaltung und die nötigen Funktionen ab.</p>
          <p>Manchmal ist eine übersichtliche Website die passende Lösung. Manchmal hilft eine Auswahl zwischen Leistungen oder eine Abfrage, die wichtige Angaben vorbereitet. Eine aufwendige Funktion ist für mich dann sinnvoll, wenn sie eine konkrete Aufgabe erfüllt.</p>
          <p>Ich entwickle Websites individuell. Wenn ein vorhandener Shop- oder Buchungsdienst gut zum Vorhaben passt, kann eine Anbindung Teil des vereinbarten Umfangs sein. Wie Sie Inhalte später ändern und wer den laufenden Betrieb übernimmt, klären wir ebenfalls vor dem Auftrag.</p>
          <a class="content-text-link" href="${link('/websites-fuer-unternehmen/')}">Was zu einem Websiteprojekt gehören kann <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="klarheit">
        <div class="content-section-label">02 / Was mir wichtig ist</div>
        <div class="content-section-body">
          <h2 id="klarheit">Klare Absprachen gehören zur Gestaltung.</h2>
          <div class="content-card-grid">
            <article class="content-card"><h3>Verständliche Entscheidungen</h3><p>Sie brauchen kein technisches Vorwissen. Ich erkläre Möglichkeiten und ihre Folgen für Ihr Vorhaben, damit Sie Umfang und Aufwand einordnen können.</p></article>
            <article class="content-card"><h3>Ein vereinbarter Rahmen</h3><p>Seiten, Funktionen, Inhalte, Freigaben und Termine werden vorab beschrieben. Neue Wünsche klären wir, bevor daraus zusätzliche Arbeit entsteht.</p></article>
            <article class="content-card"><h3>Eine geklärte Übergabe</h3><p>Sie erhalten die vereinbarten Dateien und Zugänge. Domain und Hosting laufen auf Ihren Namen; ein monatlicher Betreuungsvertrag mit Webbyu ist nicht verpflichtend.</p></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="arbeitsproben">
        <div class="content-section-label">03 / Meine Arbeitsproben</div>
        <div class="content-section-body">
          <h2 id="arbeitsproben">Ausprobieren, was mit einer Website möglich ist.</h2>
          <p>Meisterwerk, Nordlicht, Safran Atelier und Raumgut sind eigene Konzeptstudien für fiktive Marken. Sie verbinden unterschiedliche Gestaltungsaufgaben mit Abläufen: von der Beschreibung eines Raumwunschs bis zum lokalen Einkaufsweg eines Möbelshops.</p>
          <p>Die Studien zeigen Gestaltung und mögliche Funktionen. Sie sind keine Kundenreferenzen und kein Nachweis für Geschäftsergebnisse. Anfragen und Käufe sind lokale Simulationen; das Bildmaterial ist KI-generiert.</p>
          <a class="content-text-link" href="${link('/reise/')}">Die interaktiven Konzeptstudien entdecken <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="region">
        <div class="content-section-label">04 / Der Kontakt</div>
        <div class="content-section-body">
          <h2 id="region">Aus Bad Oldesloe. Für kleine Unternehmen.</h2>
          <p>Mein regionaler Schwerpunkt liegt in Bad Oldesloe und Stormarn. Auch Vorhaben aus Hamburg und Umgebung können wir gemeinsam besprechen. Webbyu richtet sich an Unternehmen und Selbstständige, die für ihre geschäftliche Tätigkeit handeln.</p>
          <p>Schreiben Sie mir kurz, was Ihr Unternehmen anbietet und welche Aufgabe Ihre Website übernehmen soll. Gesprächstermine vereinbaren wir am Wochenende; nach Absprache besuche ich Sie auch persönlich in Ihrem Unternehmen. Einen konkreten Zeitplan für die Umsetzung besprechen wir passend zu Umfang, vorhandenen Inhalten und verfügbarer Kapazität.</p>
          <p>Die geschäftlichen Anbieterangaben finden Sie im <a href="${link('/impressum/')}">Impressum</a>.</p>
        </div>
      </section>`,
  },
  '/ratgeber/': {
    label: 'Ratgeber',
    eyebrow: 'Vor dem Websiteprojekt',
    title: 'Gute Fragen machen den Anfang leichter.',
    introduction: 'Was kostet eine Website? Welche Angaben helfen bei der Planung? Hier finden Sie praktische Orientierung für einen Unternehmensauftritt – ohne technisches Vorwissen.',
    body: ({ link }) => `
      <section class="content-section content-section-full" aria-labelledby="beitraege">
        <h2 id="beitraege" class="content-visually-hidden">Ratgeber für kleine Unternehmen</h2>
        <div class="content-article-grid">
          <article class="content-article-card"><p class="content-eyebrow">01 / Kosten & Umfang</p><h2><a href="${link('/ratgeber/website-kosten/')}">Was kostet eine Website für ein kleines Unternehmen?</a></h2><p>Welche Entscheidungen den Aufwand bestimmen, welche laufenden Kosten hinzukommen können und wie Sie Angebote anhand derselben Aufgabe vergleichen.</p><p class="content-card-author">Von Lukas Wagner · Webbyu</p><a class="content-text-link" href="${link('/ratgeber/website-kosten/')}">Websitekosten einordnen <span aria-hidden="true">↗</span></a></article>
          <article class="content-article-card"><p class="content-eyebrow">02 / Vorbereitung & Zusammenarbeit</p><h2><a href="${link('/ratgeber/website-planen-checkliste/')}">Eine Website planen: die Checkliste für Ihr Unternehmen.</a></h2><p>Von den wichtigsten Kundenfragen bis zur Übergabe: Was Sie sammeln, entscheiden und prüfen können, bevor aus einer Idee ein Auftrag wird.</p><p class="content-card-author">Von Lukas Wagner · Webbyu</p><a class="content-text-link" href="${link('/ratgeber/website-planen-checkliste/')}">Mit der Checkliste beginnen <span aria-hidden="true">↗</span></a></article>
        </div>
      </section>
      <section class="content-section" aria-labelledby="eigener-ausgangspunkt">
        <div class="content-section-label">Ihr Ausgangspunkt</div>
        <div class="content-section-body"><h2 id="eigener-ausgangspunkt">Sie müssen noch nicht jede Antwort kennen.</h2><p>Eine kurze Beschreibung Ihres Unternehmens, eine vorhandene Website und die wichtigste gewünschte Veränderung reichen für den Einstieg. Offene Fragen gehören zur gemeinsamen Planung.</p><p>Die Ratgeber erklären meine Vorgehensweise bei Webbyu. Ein konkretes Angebot benennt anschließend die für Ihr Vorhaben vereinbarten Leistungen. Allgemeine Beispiele sind keine Paket- oder Preiszusagen.</p><a class="content-text-link" href="${link('/ueber-mich/')}">Mehr über meine Arbeitsweise <span aria-hidden="true">↗</span></a></div>
      </section>`,
  },
  '/ratgeber/website-kosten/': {
    label: 'Websitekosten',
    eyebrow: 'Ratgeber / Kosten & Umfang',
    title: 'Was kostet eine Website für ein kleines Unternehmen?',
    introduction: 'Ein brauchbares Angebot beginnt mit einer beschriebenen Aufgabe. Hier erfahren Sie, welche Entscheidungen den Aufwand bestimmen, was später weiter Kosten verursachen kann und wie Sie verschiedene Angebote sinnvoll vergleichen.',
    article: true,
    body: ({ link }) => `
      <nav class="content-toc" aria-label="In diesem Ratgeber"><h2>In diesem Ratgeber</h2><ol><li><a href="#aufwand">Was den Aufwand bestimmt</a></li><li><a href="#beispiel">Zwei unterschiedliche Vorhaben</a></li><li><a href="#laufende-kosten">Einmalige und laufende Kosten</a></li><li><a href="#vergleichen">Angebote vergleichen</a></li><li><a href="#vorbereitung">Ein konkretes Angebot vorbereiten</a></li></ol></nav>
      <div class="content-article-body">
        <section aria-labelledby="aufwand"><h2 id="aufwand">1. Die Seitenzahl ist nur ein Teil des Aufwands.</h2><p>Zwei Websites mit gleich vielen Seiten können sehr unterschiedlich aufwendig sein. Ein Betrieb bringt fertige Texte und nutzbare Bilder mit. Ein anderer muss seine Leistungen zunächst ordnen, Inhalte erarbeiten und eine besondere Anfragefunktion entwickeln lassen.</p><p>Für ein Angebot sollten deshalb mindestens diese Fragen beantwortet sein:</p><dl class="content-definition-list"><div><dt>Welche Aufgabe hat der Auftritt?</dt><dd>Sollen Interessenten Leistungen verstehen und Kontakt aufnehmen? Oder auch Produkte vergleichen, Termine buchen oder etwas kaufen? Diese Ziele führen zu unterschiedlichen Abläufen.</dd></div><div><dt>Welche Inhalte sind vorhanden?</dt><dd>Freigegebene Texte, Logo, passende Bilder und eine klare Leistungsübersicht können die Umsetzung vorbereiten. Konzeption, Textarbeit und eigene Medienproduktion sind zusätzliche Arbeit, wenn sie noch benötigt werden.</dd></div><div><dt>Welche Gestaltung wird benötigt?</dt><dd>Eine kompakte Darstellung mit wenigen wiederkehrenden Elementen ist anders zu planen als umfangreiche individuelle Seiten oder eine interaktive Produktgeschichte.</dd></div><div><dt>Welche Funktionen müssen zusammenarbeiten?</dt><dd>Ein Kontaktlink, ein Formular mit passenden Folgefragen und ein angebundener Buchungsdienst erfüllen unterschiedliche Aufgaben. Einrichtung, Fehlersituationen, laufende Gebühren und Pflege gehören jeweils zur Klärung.</dd></div><div><dt>Wer stimmt ab und gibt frei?</dt><dd>Eine benannte Person und gebündelte Rückmeldungen machen die Zusammenarbeit planbarer. Zusätzliche Seiten oder neue Funktionen nach der Freigabe verändern den Auftrag.</dd></div></dl></section>
        <section aria-labelledby="beispiel"><h2 id="beispiel">2. Zwei Vorhaben, die beide „eine Website“ heißen.</h2><p>Die folgenden Beispiele sind fiktiv. Sie zeigen Unterschiede im Umfang und sind weder Kundenprojekte noch verbindliche Webbyu-Pakete.</p><div class="content-example-grid"><article class="content-example"><h3>Ein übersichtlicher Unternehmensauftritt</h3><p>Ein kleiner Dienstleistungsbetrieb möchte seine Leistungen, sein Einsatzgebiet und seine Arbeitsweise zeigen. Texte und Bilder liegen freigegeben vor. Interessenten sollen direkt Kontakt aufnehmen können.</p><p>Zu klären sind vor allem Struktur, Gestaltung, Einbindung der Inhalte, ein passender Kontaktweg sowie Prüfung und Übergabe.</p></article><article class="content-example"><h3>Ein Auftritt mit zusätzlicher Auswahlhilfe</h3><p>Ein anderes Unternehmen bietet mehrere Varianten einer Leistung an. Eine Abfrage soll Wünsche sammeln und je nach Antwort unterschiedliche Fragen stellen. Texte und Bildmaterial müssen teilweise erst entstehen.</p><p>Zusätzlich werden Inhaltserstellung, Fragenlogik, verständliche Rückmeldungen und die Übergabe der Angaben geplant und geprüft.</p></article></div><p>Eine reine Preisgegenüberstellung wäre hier wenig hilfreich. Erst eine gemeinsame Beschreibung der gewünschten Leistung macht Angebote vergleichbar.</p></section>
        <section aria-labelledby="laufende-kosten"><h2 id="laufende-kosten">3. Welche Kosten bleiben nach der Veröffentlichung?</h2><p>Unterscheiden Sie die einmalige Erstellung von den Ausgaben und Aufgaben im laufenden Betrieb. Nicht jede Position fällt bei jeder Website an. Lassen Sie sich erklären, welche davon für Ihr Vorhaben relevant ist.</p><dl class="content-definition-list"><div><dt>Domain, Hosting und E-Mail</dt><dd>Die Internetadresse, die Auslieferung der Website und Geschäftspostfächer können laufende Anbietergebühren verursachen. Vertragspartner, enthaltene Leistungen und Zuständigkeiten sollten vorab bekannt sein.</dd></div><div><dt>Zusätzliche Dienste und Lizenzen</dt><dd>Buchung, Shop, Inhaltspflege oder andere eingebundene Dienste können eigene Kosten haben. Fragen Sie auch nach Gebühren, die mit Nutzung, Verkäufen oder zusätzlichen Funktionen steigen.</dd></div><div><dt>Technische Pflege</dt><dd>Je nach eingesetzter Lösung müssen Aktualisierungen, Sicherungen und Wiederherstellung organisiert werden. Klären Sie, wer diese Aufgaben übernimmt und was dafür vereinbart wird.</dd></div><div><dt>Inhaltliche Änderungen</dt><dd>Neue Leistungen, Bilder, Mitarbeitende oder Seiten können spätere Arbeit auslösen. Selbstpflege und beauftragte Änderungen benötigen jeweils eine passende Vorbereitung.</dd></div></dl><p>Bei Webbyu laufen Domain und Hosting auf Ihren Namen. Ein monatlicher Betreuungsvertrag mit Webbyu ist nicht verpflichtend. Das bedeutet nicht, dass der Betrieb kostenlos ist oder keine Pflege benötigt: Zuständigkeiten und mögliche Fremdkosten werden vorab geklärt.</p></section>
        <section aria-labelledby="vergleichen"><h2 id="vergleichen">4. Sieben Fragen für den Angebotsvergleich.</h2><ol class="content-check-list"><li><strong>Sind die Seiten und Inhalte konkret benannt?</strong> „Website mit mehreren Seiten“ lässt offen, welche Inhalte und Varianten dazugehören.</li><li><strong>Wer erstellt Texte, Bilder und weitere Medien?</strong> Unterscheiden Sie geliefertes Material, Bearbeitung und neue Produktion.</li><li><strong>Was tut jede vereinbarte Funktion?</strong> Beschreiben Sie bei einem Formular beispielsweise auch Empfänger, Fehlermeldungen und den Weg der Angaben.</li><li><strong>Wie laufen Rückmeldungen und Freigaben?</strong> Fragen Sie, wie Korrekturen gesammelt werden und wie neue Wünsche behandelt werden.</li><li><strong>Welche Kosten fallen später an?</strong> Lassen Sie einmalige Arbeiten, laufende Fremdkosten und optionale Betreuung getrennt darstellen.</li><li><strong>Was erhalten Sie bei der Übergabe?</strong> Dazu gehören die vereinbarten Dateien, Zugänge und Informationen zur Pflege. Bild- und sonstige Nutzungsrechte müssen zum geplanten Einsatz passen.</li><li><strong>Was wird vor dem Start geprüft?</strong> Inhalte, Links, kleine Bildschirme, Tastaturbedienung und der echte Kontaktweg sollten in der Abnahme berücksichtigt sein.</li></ol><p>Ein günstigeres Angebot kann gut passen, wenn es Ihre Aufgabe vollständig abdeckt. Ein umfangreicheres Angebot ist erst dann sinnvoll, wenn die zusätzlichen Bestandteile für Ihr Unternehmen tatsächlich gebraucht werden.</p></section>
        <section aria-labelledby="vorbereitung"><h2 id="vorbereitung">5. So bereiten Sie ein konkretes Angebot vor.</h2><p>Für den ersten Kontakt brauchen Sie kein fertiges Lastenheft. Hilfreich ist eine kurze Beschreibung mit diesen Angaben:</p><ul><li>Was bietet Ihr Unternehmen an, und für wen?</li><li>Welche Website gibt es bereits, falls eine vorhanden ist?</li><li>Was sollen Besucher verstehen oder erledigen können?</li><li>Welche Texte, Bilder und weiteren Materialien liegen vor?</li><li>Welche Funktionen, Termine und Rahmenbedingungen sind Ihnen wichtig?</li></ul><p>Wenn Sie einen Budgetrahmen nennen möchten, kann das helfen, den passenden Umfang zu besprechen. Bei Webbyu gilt <strong>Angebot auf Anfrage</strong>. Seiten, Funktionen, Produktion, Abstimmungen und Termine werden individuell vereinbart.</p><p>Die <a href="${link('/ratgeber/website-planen-checkliste/')}">Checkliste zur Websiteplanung</a> führt Sie durch die Vorbereitung. Unter <a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a> finden Sie meine Leistungen und den Ablauf der Zusammenarbeit.</p></section>
      </div>`,
  },
  '/ratgeber/website-planen-checkliste/': {
    label: 'Website planen: Checkliste',
    eyebrow: 'Ratgeber / Vorbereitung & Zusammenarbeit',
    title: 'Eine Website planen: die Checkliste für Ihr Unternehmen.',
    introduction: 'Sie müssen nicht mit einem fertigen Design beginnen. Ein klares Ziel, geordnete Inhalte und geklärte Zuständigkeiten sind der bessere Ausgangspunkt. Diese Checkliste hilft Ihnen, ein Websiteprojekt Schritt für Schritt vorzubereiten.',
    article: true,
    body: ({ link }) => `
      <nav class="content-toc" aria-label="In diesem Ratgeber"><h2>In diesem Ratgeber</h2><ol><li><a href="#ziel">Ziel und Besucherfragen</a></li><li><a href="#inhalte">Inhalte und Materialien</a></li><li><a href="#funktionen">Funktionen und Kontaktweg</a></li><li><a href="#organisation">Zuständigkeiten und Termine</a></li><li><a href="#abnahme">Prüfung und Übergabe</a></li><li><a href="#kurzbriefing">Ihre Kurzvorlage</a></li></ol></nav>
      <div class="content-article-body">
        <section aria-labelledby="ziel"><h2 id="ziel">1. Legen Sie die wichtigste Aufgabe fest.</h2><p>Formulieren Sie zunächst einen Satz: „Unsere Website soll …“ Ergänzen Sie, was ein Besucher verstehen oder tun soll. Zum Beispiel: „Unsere Website soll erklären, welche Leistungen wir im vereinbarten Gebiet anbieten, und eine passende Anfrage ermöglichen.“</p><p>Das ist konkreter als „modern aussehen“ und hilft später bei der Entscheidung über Seiten und Funktionen.</p><ul class="content-check-list"><li><strong>Die Zielkunden:</strong> Für welche Unternehmen oder Personen ist Ihr Angebot gedacht?</li><li><strong>Die wichtigsten Leistungen:</strong> Welche Angebote sollen zuerst verstanden werden? Was bieten Sie ausdrücklich nicht an?</li><li><strong>Das tatsächliche Gebiet:</strong> Wo arbeiten Sie, und welche Leistungen lassen sich unabhängig vom Standort erbringen?</li><li><strong>Der nächste Schritt:</strong> Sollen Interessenten anrufen, schreiben, einen Termin vereinbaren oder zunächst etwas auswählen?</li></ul><p>Sammeln Sie danach fünf Fragen, die neue Kunden häufig stellen. Diese sind ein guter Ausgangspunkt für die Inhalte Ihrer Seite. Eine umfangreiche Navigation ist noch kein Beleg dafür, dass diese Fragen beantwortet werden.</p></section>
        <section aria-labelledby="inhalte"><h2 id="inhalte">2. Sammeln Sie Material und markieren Sie Lücken.</h2><p>Eine einfache Liste reicht. Kennzeichnen Sie jedes Material mit „vorhanden“, „überarbeiten“ oder „fehlt“. So wird sichtbar, ob im Auftrag lediglich etwas eingebunden oder noch etwas erstellt werden muss.</p><dl class="content-definition-list"><div><dt>Unternehmen und Leistungen</dt><dd>Kurzbeschreibung, Namen und Kontaktdaten, verständliche Leistungsbeschreibungen, Einsatzgebiet und ein nachvollziehbarer Ablauf der Zusammenarbeit.</dd></div><div><dt>Logo und Gestaltung</dt><dd>Vorhandene Logodateien, verwendete Farben und Schriften sowie Beispiele, an denen Sie konkrete Vorlieben erklären können. Fremde Entwürfe dienen der Orientierung und werden nicht einfach übernommen.</dd></div><div><dt>Bilder und Video</dt><dd>Geeignete Originaldateien statt Bilder aus einem Messenger, wenn diese dadurch stark verkleinert wurden. Halten Sie Herkunft, geplante Verwendung und geklärte Nutzungsrechte fest.</dd></div><div><dt>Arbeitsbeispiele und Aussagen</dt><dd>Nur tatsächlich ausgeführte, zur Veröffentlichung geeignete Arbeiten und überprüfbare Angaben sammeln. Fiktive Beispiele müssen als solche erkennbar bleiben.</dd></div><div><dt>Geschäftliche und rechtliche Angaben</dt><dd>Die aktuellen Anbieterangaben und für den tatsächlichen Betrieb passende Rechtstexte bereitstellen. Deren fachliche Prüfung gehört in qualifizierte Hände; ein Websiteentwurf ersetzt sie nicht.</dd></div></dl><p>Wenn Texte, Fotos oder Videos fehlen, klären Sie vor der Beauftragung, wer sie erstellt und freigibt. Produktion, Überarbeitung und technische Einbindung sind unterschiedliche Aufgaben.</p></section>
        <section aria-labelledby="funktionen"><h2 id="funktionen">3. Beschreiben Sie Abläufe, bevor Sie Funktionen bestellen.</h2><p>„Wir brauchen ein Formular“ sagt noch wenig darüber, was anschließend passieren soll. Schreiben Sie den Weg aus Sicht eines Besuchers und Ihres Betriebs auf.</p><div class="content-note"><h3>Fiktives Beispiel: eine erste Projektanfrage</h3><p>Ein Besucher wählt die passende Leistung, beschreibt kurz sein Vorhaben und nennt einen Rückkontakt. Er prüft die Angaben vor dem Absenden. Die zuständige Person erhält die vereinbarten Informationen; der Besucher sieht eine verständliche Rückmeldung und einen alternativen Kontaktweg bei Problemen.</p></div><ul class="content-check-list"><li>Welche Angaben brauchen Sie tatsächlich für den nächsten Schritt?</li><li>Welche Fragen sind nur bei bestimmten Anliegen sinnvoll?</li><li>Wer erhält die Nachricht oder bearbeitet die Buchung?</li><li>Welcher vorhandene Dienst soll eingebunden werden?</li><li>Was soll bei fehlenden Angaben oder technischen Problemen passieren?</li></ul><p>Für eine einfache Kontaktaufnahme kann ein direkter Kontaktlink genügen. Mehrstufige Auswahlhilfen, Buchungen und Shops benötigen zusätzliche Planung. Unter <a href="${link('/anfrageformulare-auswahlhilfen/')}">Anfrageformulare und Auswahlhilfen</a> finden Sie zwei konkrete Konzeptbeispiele.</p></section>
        <section aria-labelledby="organisation"><h2 id="organisation">4. Benennen Sie eine Person für Entscheidungen.</h2><p>Ein Websiteprojekt benötigt Rückmeldungen, auch wenn Sie die Umsetzung abgeben. Klären Sie intern, wer Inhalte zusammenstellt, Fragen bündelt und den Entwurf freigibt.</p><ul class="content-check-list"><li><strong>Verantwortung:</strong> Wer darf verbindlich über Inhalte und Gestaltung entscheiden?</li><li><strong>Material:</strong> Wer liefert welche Texte und Dateien bis zum vereinbarten Termin?</li><li><strong>Rückmeldungen:</strong> Wie werden Kommentare gesammelt, und wann kann Ihr Team sie prüfen?</li><li><strong>Änderungen:</strong> Wie werden neue Wünsche im Umfang, Preis und Zeitplan vereinbart?</li><li><strong>Start:</strong> Gibt es einen tatsächlichen Anlass oder festen Termin für die Veröffentlichung?</li></ul><p>Ein gewünschter Veröffentlichungstermin ist zunächst eine Planungsangabe. Ob er erreichbar ist, hängt unter anderem von Umfang, Material, Freigaben und Kapazität ab. Bei Webbyu werden Ablauf und Termine individuell vereinbart.</p><p>Trennen Sie außerdem das Budget für die Erstellung von laufenden Anbietergebühren und späterer Pflege. Dazu hilft der <a href="${link('/ratgeber/website-kosten/')}">Ratgeber zu Websitekosten</a>.</p></section>
        <section aria-labelledby="abnahme"><h2 id="abnahme">5. Planen Sie die Prüfung und die Zeit nach dem Start.</h2><p>Die fertige Website sollte nicht nur in einer Präsentation betrachtet werden. Gehen Sie typische Besucherwege mit dem tatsächlich vereinbarten Inhalt durch.</p><ul class="content-check-list"><li>Stimmen Leistungen, Kontakte, Namen, Preise und sonstige veröffentlichte Angaben?</li><li>Sind Texte und Bilder auch auf einem kleinen Bildschirm verständlich, ohne seitliches Schieben lesen zu müssen?</li><li>Lassen sich Links, Menüs und Eingaben mit der Tastatur erreichen und bedienen?</li><li>Führen die wichtigen Verweise zum richtigen Ziel?</li><li>Funktioniert der vereinbarte Kontaktweg bis zum Empfang, und sind Fehlermeldungen verständlich?</li><li>Ist klar, wer Domain, Hosting, Postfächer, Pflege und spätere Änderungen betreut?</li><li>Liegen die vereinbarten Dateien, Zugänge und Informationen zur Übergabe vor?</li></ul><p>Ein Durchlauf dieser Liste ist keine vollständige rechtliche, technische oder Barrierefreiheitsprüfung. Er macht konkrete Anforderungen sichtbar, die Sie für Ihre Abnahme vereinbaren können.</p><p>Wenn eine bestehende Website ersetzt wird, gehört zusätzlich eine Übersicht der bisherigen Adressen, Inhalte und genutzten E-Mail-Dienste in die Planung. Wichtige bestehende Verweise sollten beim Wechsel berücksichtigt werden.</p></section>
        <section aria-labelledby="kurzbriefing"><h2 id="kurzbriefing">6. Ihre Kurzvorlage für den ersten Kontakt.</h2><p>Notieren Sie die folgenden Punkte zunächst für sich. Stichworte genügen. Offene Punkte können ausdrücklich offenbleiben; Zugangsdaten und vertrauliche Kundeninformationen gehören nicht in eine allgemeine Anfrage.</p><div class="content-briefing"><dl><div><dt>Unser Unternehmen</dt><dd>Was wir anbieten und für wen.</dd></div><div><dt>Unsere wichtigste Aufgabe</dt><dd>Was Besucher verstehen oder erledigen sollen.</dd></div><div><dt>Unser bisheriger Stand</dt><dd>Vorhandene Website, Texte, Bilder und weitere Materialien.</dd></div><div><dt>Unsere offenen Fragen</dt><dd>Benötigte Unterstützung, Funktionen und unklare Punkte.</dd></div><div><dt>Unser Rahmen</dt><dd>Gewünschter Zeitraum, verantwortliche Person und bekannte Rahmenbedingungen.</dd></div></dl></div><p>Damit lässt sich ein erstes Gespräch führen, ohne bereits jede Seite festzulegen. Bei Webbyu finden Sie unter <a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a> den Ablauf. Der <a href="${link('/#projektfinder')}">Projektfinder</a> hilft Ihnen, ein Vorhaben zu ordnen und anschließend ausdrücklich anzufragen.</p></section>
      </div>`,
  },
};

/** Render at build time; the result remains readable without client JavaScript. */
export function renderContentPage(path: string, base: string): string {
  const cleanPath = `/${path.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '')}/`;
  const page = pages[cleanPath];
  if (!page) throw new Error(`Unknown content page: ${path}`);
  const normalizedBase = `${base.replace(/\/+$/g, '')}/`;
  const link = (destination: string) => escapeAttribute(`${normalizedBase}${destination.replace(/^\/+/, '')}`);
  const nav = [
    ['/websites-fuer-unternehmen/', 'Websites'],
    ['/anfrageformulare-auswahlhilfen/', 'Auswahlhilfen'],
    ['/ueber-mich/', 'Über mich'],
    ['/ratgeber/', 'Ratgeber'],
  ];
  const breadcrumbs = `<li><a href="${link('/')}">Startseite</a></li>${page.article ? `<li><a href="${link('/ratgeber/')}">Ratgeber</a></li>` : ''}<li aria-current="page">${page.label}</li>`;
  return `
    <a class="content-skip" href="#inhalt">Zum Inhalt</a>
    <header class="content-header">
      <a class="content-wordmark" href="${link('/')}" aria-label="Webbyu – Startseite"><img src="${link('/webbyu-wortmarke-entwurf.png')}" alt="" width="2172" height="724" /></a>
      <nav class="content-nav" aria-label="Hauptnavigation">${nav.map(([href, label]) => `<a href="${link(href)}"${href === cleanPath ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<a class="content-nav-contact" href="${link('/#projektfinder')}">Vorhaben besprechen <span aria-hidden="true">↗</span></a></nav>
    </header>
    <main id="inhalt" class="content-main${page.article ? ' content-is-article' : ''}" tabindex="-1">
      <nav class="content-breadcrumbs" aria-label="Brotkrumennavigation"><ol>${breadcrumbs}</ol></nav>
      <header class="content-hero">
        <p class="content-eyebrow">${page.eyebrow}</p>
        <h1>${page.title}</h1>
        <p class="content-introduction">${page.introduction}</p>
        ${page.article ? `<p class="content-author">Von <a href="${link('/ueber-mich/')}" rel="author">Lukas Wagner</a> · Webbyu <span>Stand: <time datetime="2026-10-31">31. Oktober 2026</time></span></p>` : ''}
      </header>
      ${page.body({ link })}
      <aside class="content-contact" aria-labelledby="kontakt-titel"><div><p class="content-eyebrow">Ihr nächster Schritt</p><h2 id="kontakt-titel">Was soll Ihre Website leichter machen?</h2><p>Beschreiben Sie Ihr Unternehmen und Ihre wichtigste Aufgabe. Wir klären gemeinsam, welcher Umfang sinnvoll ist. Angebot auf Anfrage.</p><p class="content-contact-small">Für Unternehmen und Selbstständige · Bad Oldesloe, Stormarn & Umgebung</p></div><div class="content-contact-actions"><a class="content-button" href="${link('/#projektfinder')}">Vorhaben besprechen <span aria-hidden="true">↗</span></a><a href="mailto:lukas.wagner@webbyu.de">lukas.wagner@webbyu.de</a><a href="tel:+4917642090983">+49 176 42090983</a></div></aside>
    </main>
    <footer class="content-footer"><div class="content-footer-top"><a class="content-wordmark" href="${link('/')}" aria-label="Webbyu – Startseite"><img src="${link('/webbyu-wortmarke-entwurf.png')}" alt="" width="2172" height="724" /></a><p>Ihr Angebot klarer.<br>Ihr Alltag einfacher.</p></div><nav aria-label="Weitere Seiten"><a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a><a href="${link('/anfrageformulare-auswahlhilfen/')}">Anfrageformulare & Auswahlhilfen</a><a href="${link('/ueber-mich/')}">Über mich</a><a href="${link('/ratgeber/')}">Ratgeber</a><a href="${link('/reise/')}">Konzeptstudien</a><a href="${link('/impressum/')}">Impressum</a><a href="${link('/datenschutz/')}">Datenschutz</a><button class="content-privacy-open" type="button" data-privacy-open hidden>Cookie-Einstellungen</button></nav><div class="content-footer-bottom"><span>© 2026 Webbyu · Lukas Wagner</span><span>Individuelle Websites & hilfreiche Funktionen</span></div></footer>`;
}
