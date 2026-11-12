import { wordmarkImg } from '../wordmark';

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
    title: 'Eine Website für Ihren Betrieb, nicht von der Stange.',
    introduction: 'Wer auf Ihre Seite kommt, soll schnell merken, ob er bei Ihnen richtig ist. Ich plane und baue Websites für kleine Unternehmen und Selbstständige, von Bad Oldesloe aus.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="aufgabe">
        <div class="content-section-label">01 / Die Aufgabe</div>
        <div class="content-section-body">
          <h2 id="aufgabe">Was soll Ihre Website für Sie tun?</h2>
          <p>Manche gründen gerade. Bei anderen erklärt die alte Seite nicht mehr, was der Betrieb heute macht. Und manchmal melden sich Interessenten ohne die Angaben, die Sie für ein erstes Gespräch brauchen.</p>
          <p>Von dort aus überlegen wir, welche Seiten und Funktionen es braucht. Oft reicht eine übersichtliche Unternehmenswebsite. Eine Auswahlhilfe, eine Buchung oder ein Shop wird eigens geplant.</p>
          <div class="content-card-grid">
            <article class="content-card"><span class="content-card-number">01</span><h3>Ihr Angebot zeigen</h3><p>Leistungen, Einsatzgebiet und Arbeitsweise so ordnen, dass Besucher ihre Antwort finden, ohne lange zu suchen.</p></article>
            <article class="content-card"><span class="content-card-number">02</span><h3>Vertrauen aufbauen</h3><p>Mit echten Fotos von Ihnen und Ihrer Arbeit, Angaben, die stimmen, und Beispielen, die Sie belegen können.</p></article>
            <article class="content-card"><span class="content-card-number">03</span><h3>Kontakt vorbereiten</h3><p>Einen klaren nächsten Schritt anbieten: anrufen, schreiben oder das Anliegen mit ein paar Fragen genauer beschreiben.</p></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="umfang">
        <div class="content-section-label">02 / Der Umfang</div>
        <div class="content-section-body">
          <h2 id="umfang">Was dazugehört, hängt von der Aufgabe ab.</h2>
          <p>Planung, Gestaltung und Programmierung liegen bei mir. Im Angebot steht, was Sie beauftragen und welches Material Sie selbst mitbringen.</p>
          <dl class="content-definition-list">
            <div><dt>Inhalte und Struktur</dt><dd>Welche Fragen beantwortet die Startseite, welche die Unterseiten? Was braucht eine eigene Seite, was passt in einen Absatz?</dd></div>
            <div><dt>Gestaltung und Entwicklung</dt><dd>Eine eigene Gestaltung statt einer Vorlage. Sie funktioniert auf dem Handy genauso wie am großen Bildschirm.</dd></div>
            <div><dt>Kontakt und Anfragen</dt><dd>Mindestens ein Kontaktweg, der funktioniert. Größere Abfragen und Anbindungen an andere Dienste plane ich gesondert.</dd></div>
            <div><dt>Foto, Video und Text</dt><dd>Was Sie schon haben und verwenden dürfen, baue ich ein. Neue Aufnahmen, Bearbeitung und Nutzungsrechte stehen einzeln im Angebot.</dd></div>
            <div><dt>Auffindbarkeit</dt><dd>Klare Seiten, gute Seitentitel und saubere Technik, damit Suchmaschinen die Seite lesen können. Mehr SEO-Arbeit vereinbaren wir extra. Einen bestimmten Platz bei Google kann niemand seriös versprechen.</dd></div>
          </dl>
          <p>Shops, aufwendige Buchungen und Anbindungen an andere Systeme stecken nicht automatisch in einem Paket. Nur weil Sie etwas in einer Demo ausprobieren können, gehört es nicht zu jedem Auftrag.</p>
          <a class="content-text-link" href="${link('/anfrageformulare-auswahlhilfen/')}">Wie Auswahlhilfen und strukturierte Anfragen funktionieren <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="zusammenarbeit">
        <div class="content-section-label">03 / Die Zusammenarbeit</div>
        <div class="content-section-body">
          <h2 id="zusammenarbeit">Ein Ansprechpartner, vier Schritte.</h2>
          <ol class="content-step-list">
            <li><h3>Vorhaben klären</h3><p>Sie erzählen von Ihrem Betrieb, Ihren wichtigsten Leistungen und davon, was die Website leisten soll. Wir schauen, was es schon gibt und was fehlt.</p></li>
            <li><h3>Umfang vereinbaren</h3><p>Im Angebot stehen Seiten, Funktionen, Material, Abstimmungen, Freigaben und wer wofür zuständig ist. Zeitrahmen und laufende Fremdkosten klären wir, bevor Sie zusagen.</p></li>
            <li><h3>Gestalten und entwickeln</h3><p>Dann baue ich die Seite. Rückmeldungen sammeln Sie am besten gebündelt. Neue Wünsche besprechen wir, bevor ich sie umsetze.</p></li>
            <li><h3>Prüfen und übergeben</h3><p>Ich prüfe Inhalte, Links, Bedienung und Kontaktweg. Sie bekommen die vereinbarten Dateien und Zugänge und eine Einführung in das, was Sie selbst ändern können.</p></li>
          </ol>
          <p>Webbyu sitzt in Bad Oldesloe. Ich arbeite für kleine Unternehmen in Stormarn, Hamburg und Umgebung und komme nach Absprache auch zu Ihnen in den Betrieb. Gesprächstermine gehen auch am Wochenende.</p>
        </div>
      </section>
      <section class="content-section" aria-labelledby="vor-der-anfrage">
        <div class="content-section-label">04 / Vor Ihrer Anfrage</div>
        <div class="content-section-body">
          <h2 id="vor-der-anfrage">Was Sie vorher wissen sollten.</h2>
          <div class="content-faq">
            <details><summary>Was kostet die Website?</summary><p>Das hängt vom Umfang ab, also von den Seiten, den vorhandenen Inhalten, der Gestaltung und den Funktionen. Einen konkreten Preis nenne ich, sobald das klar ist. Der <a href="${link('/ratgeber/website-kosten/')}">Ratgeber zu Websitekosten</a> hilft beim Einordnen von Angeboten und laufenden Kosten.</p></details>
            <details><summary>Muss ich schon fertige Texte und Bilder haben?</summary><p>Nein. Für den Anfang reicht eine Liste, was schon da ist. Dann sehen wir, was Sie selbst liefern und wo Sie Hilfe bei Texten, Fotos oder Video brauchen. Produktion und Nutzungsrechte stehen dann im Angebot.</p></details>
            <details><summary>Kann ich später Inhalte selbst ändern?</summary><p>Ja, wenn Sie das möchten, plane ich es ein. Wie, hängt davon ab, was sich bei Ihnen tatsächlich ändert und wer es ändern soll. Wer nur ab und zu die Öffnungszeiten anpasst, braucht kein großes System.</p></details>
            <details><summary>Bin ich an einen laufenden Betreuungsvertrag gebunden?</summary><p>Nein. Domain und Hosting laufen auf Ihren Namen. Wir legen fest, wer sich nach der Übergabe um Pflege, Updates und Änderungen kümmert. Hosting und eventuelle Lizenzen kosten trotzdem laufend Geld.</p></details>
            <details><summary>Sind die gezeigten Beispiele Kundenprojekte?</summary><p>Nein. Es sind fiktive Konzeptstudien, mit denen ich zeige, wie ich gestalte und was technisch geht. Anfragen und Käufe darin sind nur simuliert, und es sind keine Kundenreferenzen.</p></details>
          </div>
          <a class="content-text-link" href="${link('/ratgeber/website-planen-checkliste/')}">Mit der Website-Checkliste vorbereiten <span aria-hidden="true">↗</span></a>
        </div>
      </section>`,
  },
  '/anfrageformulare-auswahlhilfen/': {
    label: 'Anfrageformulare & Auswahlhilfen',
    eyebrow: 'Wenn vor dem Gespräch noch Fragen offen sind',
    title: 'Damit in der Anfrage steht, was Sie brauchen.',
    introduction: 'Ein leeres Nachrichtenfeld ist nicht immer die beste Lösung. Ich baue Formulare und Auswahlhilfen, die nach dem fragen, was Sie wirklich wissen müssen, und für Ihre Kunden trotzdem kurz bleiben.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="sinnvoll">
        <div class="content-section-label">01 / Der Bedarf</div>
        <div class="content-section-body">
          <h2 id="sinnvoll">Wann helfen zusätzliche Fragen?</h2>
          <p>Wenn Sie nach fast jeder Anfrage dieselben Angaben nachfordern, lohnt sich ein Blick auf das Formular. Bei einer Raumgestaltung geht es zum Beispiel um Nutzung und Wünsche. Bei einem technischen Problem muss erst klar sein: Beratung, Wartung oder Störung?</p>
          <p>Eine gute Abfrage fragt nur, was für den nächsten Schritt nötig ist. Sie erklärt Fachbegriffe und zeigt Folgefragen erst, wenn sie zum Anliegen gehören. Für eine einfache Rückrufbitte reicht ein kurzes Formular völlig.</p>
          <div class="content-note"><h3>Was eine Auswahlhilfe nicht kann</h3><p>Sie kann Möglichkeiten erklären und ein Gespräch vorbereiten. Eine fachliche Prüfung, eine verbindliche Kalkulation oder Ihre persönliche Beratung ersetzt sie nicht.</p></div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="beispiele">
        <div class="content-section-label">02 / Eigene Arbeitsbeispiele</div>
        <div class="content-section-body">
          <h2 id="beispiele">Zwei Beispiele aus meinen Studien.</h2>
          <p>Beide stammen aus fiktiven Konzeptstudien, nicht aus Kundenaufträgen. Was Sie dort eingeben, bleibt in der Demo; es wird nichts verschickt.</p>
          <div class="content-example-grid">
            <article class="content-example"><p class="content-eyebrow">Paketbeispiel / Klarblick</p><h3>Eine Anfrage ohne Rückfragen.</h3><p><strong>Die Ausgangslage:</strong> Für ein Angebot zur Fensterreinigung muss man Ort, Zahl der Fenster und den Zugang kennen.</p><p><strong>Der Ansatz:</strong> Ein kurzes Formular fragt genau das ab.</p><p><strong>Die Grenze:</strong> Das Formular ist nur simuliert und sendet nichts.</p><a class="content-text-link" href="${link('/demos/start/')}">Klarblick ansehen <span aria-hidden="true">↗</span></a></article>
            <article class="content-example"><p class="content-eyebrow">Paketbeispiel / Eiche &amp; Form</p><h3>Eine Nische messen.</h3><p><strong>Die Ausgangslage:</strong> Ob ein Einbaumöbel in eine schiefe Altbaunische passt, lässt sich ohne Maße kaum sagen.</p><p><strong>Der Ansatz:</strong> Das Formular fragt vier Maße ab und zeichnet daraus sofort die Nische mit den nötigen Passleisten.</p><p><strong>Die Grenze:</strong> Die Demo verschickt keine Angaben und erstellt kein Angebot.</p><a class="content-text-link" href="${link('/demos/business/kontakt/')}">Eiche &amp; Form ansehen <span aria-hidden="true">↗</span></a></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="planung">
        <div class="content-section-label">03 / Die Planung</div>
        <div class="content-section-body">
          <h2 id="planung">Genauso wichtig: was nach dem Absenden passiert.</h2>
          <p>Ein Formular ist erst fertig geplant, wenn klar ist, wie es danach weitergeht. Wer bekommt die Nachricht? In welcher Form brauchen Sie die Angaben? Was sieht der Besucher, wenn etwas schiefgeht? Das klären wir, bevor ich anfange.</p>
          <ol class="content-step-list">
            <li><h3>Die wiederkehrenden Rückfragen sammeln</h3><p>Wir sehen uns typische Anfragen an, ohne dafür echte Kundendaten zu brauchen. Übrig bleiben die wenigen Fragen, auf die es ankommt.</p></li>
            <li><h3>Wege und Grenzen festlegen</h3><p>Was ist Pflicht, was freiwillig? Welche Folgefrage kommt wann? Und wann ist ein Anruf einfach besser als jedes Formular?</p></li>
            <li><h3>Empfang und Übergabe vereinbaren</h3><p>Eine E-Mail, eine Zusammenfassung oder die Anbindung an einen Dienst, den Sie schon nutzen: Das sind unterschiedlich große Aufgaben. Welcher Weg es wird, steht im Angebot.</p></li>
            <li><h3>Die ganze Strecke prüfen</h3><p>Ich teste, ob die Fragen verständlich sind, ob alles auf dem Handy und mit der Tastatur funktioniert, was bei Fehlern passiert und ob die Nachricht ankommt. Eine Erfolgsmeldung im Browser heißt noch nicht, dass die Mail bei Ihnen gelandet ist.</p></li>
          </ol>
        </div>
      </section>
      <section class="content-section" aria-labelledby="grenzen">
        <div class="content-section-label">04 / Der vereinbarte Umfang</div>
        <div class="content-section-body">
          <h2 id="grenzen">Nicht mehr Funktion als nötig.</h2>
          <p>Eine kurze Abfrage lässt sich in eine normale Unternehmenswebsite einplanen. Aufwendige Buchungen, Shops, eigene Berechnungen und Anbindungen an andere Systeme bekommen ein eigenes Angebot.</p>
          <p>Für das erste Gespräch reichen drei Rückfragen, die Sie ständig stellen müssen, und ein paar Sätze dazu, wie es heute läuft. Echte Kundennamen oder vertrauliche Nachrichten brauche ich dafür nicht.</p>
          <a class="content-text-link" href="${link('/websites-fuer-unternehmen/')}">Zur Planung Ihrer Unternehmenswebsite <span aria-hidden="true">↗</span></a>
        </div>
      </section>`,
  },
  '/ueber-mich/': {
    label: 'Über mich',
    eyebrow: 'Lukas Wagner · Webbyu · Bad Oldesloe',
    title: 'Ich bin Lukas Wagner und baue Ihre Website selbst.',
    introduction: 'Webbyu bin nur ich. Wer anruft, spricht mit mir, und ich bin auch derjenige, der sich in Ihr Angebot einarbeitet und die Seite baut.',
    body: ({ link }) => `
      <section class="content-section" aria-labelledby="arbeitsweise">
        <div class="content-section-label">01 / Meine Arbeitsweise</div>
        <div class="content-section-body">
          <h2 id="arbeitsweise">Ich fange mit Fragen an.</h2>
          <p>Was fragen Ihre Kunden? Was an Ihrem Angebot muss man erklären? Und welche Arbeit macht Ihnen eine Anfrage hinterher? Aus den Antworten ergibt sich, wie die Seite aufgebaut ist, wie sie aussieht und was sie können muss.</p>
          <p>Oft ist eine übersichtliche Website genau richtig. Manchmal hilft eine Auswahl zwischen Leistungen oder eine Abfrage, die die wichtigen Angaben gleich mitbringt. Eine aufwendige Funktion baue ich nur, wenn sie eine konkrete Aufgabe hat.</p>
          <p>Ich baue Websites selbst, ohne Baukasten. Wenn ein Shop- oder Buchungsdienst, den Sie schon nutzen, gut passt, binde ich ihn ein. Wie Sie später Inhalte ändern und wer den Betrieb übernimmt, klären wir vor dem Auftrag.</p>
          <a class="content-text-link" href="${link('/websites-fuer-unternehmen/')}">Was zu einem Websiteprojekt gehören kann <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="klarheit">
        <div class="content-section-label">02 / Was mir wichtig ist</div>
        <div class="content-section-body">
          <h2 id="klarheit">Worauf Sie sich verlassen können.</h2>
          <div class="content-card-grid">
            <article class="content-card"><h3>Erklärungen ohne Fachchinesisch</h3><p>Technisches Wissen brauchen Sie nicht. Ich erkläre, welche Möglichkeiten es gibt und was sie an Aufwand und Kosten bedeuten.</p></article>
            <article class="content-card"><h3>Kein Rätselraten beim Umfang</h3><p>Seiten, Funktionen, Inhalte, Freigaben und Termine stehen vorher fest. Kommen neue Wünsche dazu, sprechen wir darüber, bevor daraus Mehrarbeit wird.</p></article>
            <article class="content-card"><h3>Keine Abhängigkeit</h3><p>Sie bekommen die vereinbarten Dateien und Zugänge. Domain und Hosting laufen auf Ihren Namen, und einen monatlichen Wartungsvertrag mit mir müssen Sie nicht abschließen.</p></article>
          </div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="arbeitsproben">
        <div class="content-section-label">03 / Meine Arbeitsproben</div>
        <div class="content-section-body">
          <h2 id="arbeitsproben">Meine Studien zum Ausprobieren.</h2>
          <p>Meisterwerk, Nordlicht, Safran Atelier und Raumgut sind Konzeptstudien für erfundene Marken. In jeder steckt eine andere Aufgabe, vom Beschreiben eines Raumwunschs bis zum kompletten Einkauf in einem Möbelshop.</p>
          <p>Die Studien zeigen, wie ich gestalte und was technisch geht. Sie sind keine Kundenreferenzen und belegen keine Geschäftsergebnisse. Anfragen und Käufe sind simuliert, die Bilder KI-generiert.</p>
          <a class="content-text-link" href="${link('/reise/')}">Die Konzeptstudien ansehen <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="content-section" aria-labelledby="region">
        <div class="content-section-label">04 / Der Kontakt</div>
        <div class="content-section-body">
          <h2 id="region">Wo Sie mich finden.</h2>
          <p>Ich sitze in Bad Oldesloe und arbeite vor allem in Stormarn. Projekte aus Hamburg und Umgebung nehme ich auch gern an. Webbyu arbeitet nur für Unternehmen und Selbstständige, die für ihre geschäftliche Tätigkeit handeln.</p>
          <p>Schreiben Sie mir kurz, was Ihr Betrieb macht und was die Website erledigen soll. Gesprächstermine lege ich aufs Wochenende, auf Wunsch komme ich auch zu Ihnen. Wann die Umsetzung starten kann, hängt vom Umfang, von den vorhandenen Inhalten und von meiner freien Zeit ab.</p>
          <p>Die geschäftlichen Anbieterangaben finden Sie im <a href="${link('/impressum/')}">Impressum</a>.</p>
        </div>
      </section>`,
  },
  '/ratgeber/': {
    label: 'Ratgeber',
    eyebrow: 'Vor dem Websiteprojekt',
    title: 'Bevor Sie ein Angebot einholen.',
    introduction: 'Zwei Texte darüber, was eine Website kostet und was Sie vorher klären sollten. Technisches Wissen brauchen Sie dafür nicht.',
    body: ({ link }) => `
      <section class="content-section content-section-full" aria-labelledby="beitraege">
        <h2 id="beitraege" class="content-visually-hidden">Ratgeber für kleine Unternehmen</h2>
        <div class="content-article-grid">
          <article class="content-article-card"><p class="content-eyebrow">01 / Kosten & Umfang</p><h2><a href="${link('/ratgeber/website-kosten/')}">Was kostet eine Website für ein kleines Unternehmen?</a></h2><p>Wovon der Aufwand abhängt, welche laufenden Kosten dazukommen und wie Sie Angebote fair miteinander vergleichen.</p><p class="content-card-author">Von Lukas Wagner · Webbyu</p><a class="content-text-link" href="${link('/ratgeber/website-kosten/')}">Websitekosten einordnen <span aria-hidden="true">↗</span></a></article>
          <article class="content-article-card"><p class="content-eyebrow">02 / Vorbereitung & Zusammenarbeit</p><h2><a href="${link('/ratgeber/website-planen-checkliste/')}">Eine Website planen: die Checkliste für Ihr Unternehmen.</a></h2><p>Von den wichtigsten Kundenfragen bis zur Übergabe: was Sie sammeln, entscheiden und prüfen sollten, bevor Sie jemanden beauftragen.</p><p class="content-card-author">Von Lukas Wagner · Webbyu</p><a class="content-text-link" href="${link('/ratgeber/website-planen-checkliste/')}">Mit der Checkliste beginnen <span aria-hidden="true">↗</span></a></article>
        </div>
      </section>
      <section class="content-section" aria-labelledby="eigener-ausgangspunkt">
        <div class="content-section-label">Ihr Ausgangspunkt</div>
        <div class="content-section-body"><h2 id="eigener-ausgangspunkt">Sie müssen noch nicht jede Antwort kennen.</h2><p>Für den Anfang reichen ein paar Sätze zu Ihrem Betrieb, die alte Website, falls es eine gibt, und das, was sich am dringendsten ändern soll. Den Rest klären wir zusammen.</p><p>Die Ratgeber beschreiben, wie ich bei Webbyu vorgehe. Was Sie konkret bekommen, steht später im Angebot. Die allgemeinen Beispiele sind keine Paket- oder Preiszusagen.</p><a class="content-text-link" href="${link('/ueber-mich/')}">Mehr über meine Arbeitsweise <span aria-hidden="true">↗</span></a></div>
      </section>`,
  },
  '/ratgeber/website-kosten/': {
    label: 'Websitekosten',
    eyebrow: 'Ratgeber / Kosten & Umfang',
    title: 'Was kostet eine Website für ein kleines Unternehmen?',
    introduction: 'Die ehrliche Antwort: Es kommt darauf an. Hier steht, worauf genau, welche Kosten nach dem Start noch kommen und wie Sie zwei Angebote vergleichen, ohne Äpfel mit Birnen zu vergleichen.',
    article: true,
    body: ({ link }) => `
      <nav class="content-toc" aria-label="In diesem Ratgeber"><h2>In diesem Ratgeber</h2><ol><li><a href="#aufwand">Was den Aufwand bestimmt</a></li><li><a href="#beispiel">Zwei unterschiedliche Vorhaben</a></li><li><a href="#laufende-kosten">Einmalige und laufende Kosten</a></li><li><a href="#vergleichen">Angebote vergleichen</a></li><li><a href="#vorbereitung">Ein konkretes Angebot vorbereiten</a></li></ol></nav>
      <div class="content-article-body">
        <section aria-labelledby="aufwand"><h2 id="aufwand">1. Die Seitenzahl ist nur ein Teil des Aufwands.</h2><p>Zwei Websites mit gleich vielen Seiten können sehr unterschiedlich aufwendig sein. Der eine Betrieb bringt fertige Texte und brauchbare Fotos mit. Der andere muss erst seine Leistungen sortieren, Texte schreiben lassen und will dazu noch eine Abfrage mit Folgefragen.</p><p>Für ein Angebot sollten deshalb mindestens diese Fragen geklärt sein:</p><dl class="content-definition-list"><div><dt>Welche Aufgabe hat der Auftritt?</dt><dd>Sollen Interessenten verstehen, was Sie anbieten, und sich melden? Oder auch Produkte vergleichen, Termine buchen oder etwas kaufen? Das sind verschiedene Aufgaben mit verschiedenem Aufwand.</dd></div><div><dt>Welche Inhalte sind vorhanden?</dt><dd>Fertige Texte, ein Logo, brauchbare Bilder und eine klare Liste Ihrer Leistungen sparen Arbeit. Muss das alles erst entstehen, kommen Konzept, Texte und Fotos dazu.</dd></div><div><dt>Wie aufwendig soll die Gestaltung sein?</dt><dd>Wenige Seiten mit immer gleichen Bausteinen sind schneller gemacht als viele einzeln gestaltete Seiten oder eine interaktive Produktgeschichte.</dd></div><div><dt>Welche Funktionen müssen zusammenarbeiten?</dt><dd>Ein Kontaktlink, ein Formular mit Folgefragen und ein angebundener Buchungsdienst sind drei verschiedene Dinge. Bei jedem kommen Einrichtung, Fehlerfälle, laufende Gebühren und Pflege dazu.</dd></div><div><dt>Wer stimmt ab und gibt frei?</dt><dd>Entscheidet eine Person und kommen Rückmeldungen gebündelt, lässt sich das Projekt gut planen. Kommen nach der Freigabe noch Seiten oder Funktionen dazu, ändert das den Auftrag.</dd></div></dl></section>
        <section aria-labelledby="beispiel"><h2 id="beispiel">2. Zwei Vorhaben, die beide „eine Website“ heißen.</h2><p>Beide Beispiele sind erfunden. Sie zeigen, wie weit der Umfang auseinanderliegen kann. Es sind weder Kundenprojekte noch feste Pakete.</p><div class="content-example-grid"><article class="content-example"><h3>Ein übersichtlicher Unternehmensauftritt</h3><p>Ein kleiner Dienstleistungsbetrieb will zeigen, was er macht, wo er arbeitet und wie er vorgeht. Texte und Bilder sind fertig. Interessenten sollen direkt anrufen oder schreiben können.</p><p>Es geht vor allem um Aufbau, Gestaltung, das Einbauen der Inhalte, einen Kontaktweg und die Übergabe.</p></article><article class="content-example"><h3>Ein Auftritt mit zusätzlicher Auswahlhilfe</h3><p>Ein anderes Unternehmen bietet eine Leistung in mehreren Varianten an. Eine Abfrage soll Wünsche sammeln und je nach Antwort andere Fragen stellen. Ein Teil der Texte und Bilder fehlt noch.</p><p>Dazu kommen das Schreiben der Texte, die Logik der Fragen, klare Rückmeldungen im Formular und der Weg der Angaben zu Ihnen.</p></article></div><p>Die Preise dieser beiden nebeneinanderzulegen, bringt wenig. Angebote sind erst vergleichbar, wenn sie dieselbe Leistung beschreiben.</p></section>
        <section aria-labelledby="laufende-kosten"><h2 id="laufende-kosten">3. Welche Kosten bleiben nach der Veröffentlichung?</h2><p>Trennen Sie die einmalige Erstellung von dem, was danach regelmäßig kostet. Nicht jeder Punkt trifft jede Website. Fragen Sie nach, welche für Sie gelten.</p><dl class="content-definition-list"><div><dt>Domain, Hosting und E-Mail</dt><dd>Für die Internetadresse, den Speicherplatz der Website und E-Mail-Postfächer zahlen Sie meist laufend an einen Anbieter. Wer Vertragspartner ist und was enthalten ist, sollten Sie vorher wissen.</dd></div><div><dt>Zusätzliche Dienste und Lizenzen</dt><dd>Buchungstool, Shop oder andere eingebundene Dienste haben oft eigene Gebühren. Fragen Sie auch, ob sie mit der Nutzung oder mit jedem Verkauf steigen.</dd></div><div><dt>Technische Pflege</dt><dd>Je nach Technik braucht die Seite Updates und Sicherungen, und im Notfall muss sich jemand ums Wiederherstellen kümmern. Klären Sie, wer das übernimmt und was es kostet.</dd></div><div><dt>Inhaltliche Änderungen</dt><dd>Neue Leistung, neue Mitarbeiterin, neue Fotos: Das macht später Arbeit. Ob Sie das selbst ändern oder jemanden beauftragen, sollten Sie vorher festlegen.</dd></div></dl><p>Bei Webbyu laufen Domain und Hosting auf Ihren Namen, und einen monatlichen Betreuungsvertrag müssen Sie nicht abschließen. Kostenlos ist der Betrieb deshalb nicht, und Pflege braucht jede Website. Wer was übernimmt und welche Fremdkosten anfallen, klären wir vorher.</p></section>
        <section aria-labelledby="vergleichen"><h2 id="vergleichen">4. Sieben Fragen für den Angebotsvergleich.</h2><ol class="content-check-list"><li><strong>Sind die Seiten und Inhalte konkret benannt?</strong> „Website mit mehreren Seiten“ sagt nicht, welche Seiten und wie viele Varianten gemeint sind.</li><li><strong>Wer erstellt Texte, Bilder und weitere Medien?</strong> Es macht einen Unterschied, ob Sie Material liefern, es bearbeitet wird oder neu entsteht.</li><li><strong>Was tut jede vereinbarte Funktion?</strong> Bei einem Formular sollte etwa feststehen, wer die Nachricht bekommt, was bei Fehlern passiert und wohin die Angaben gehen.</li><li><strong>Wie laufen Rückmeldungen und Freigaben?</strong> Fragen Sie, wie Korrekturen gesammelt werden und was mit neuen Wünschen mitten im Projekt passiert.</li><li><strong>Welche Kosten fallen später an?</strong> Einmalige Arbeit, laufende Fremdkosten und optionale Betreuung sollten getrennt aufgeführt sein.</li><li><strong>Was erhalten Sie bei der Übergabe?</strong> Dazu gehören die vereinbarten Dateien, Zugänge und eine Erklärung, wie Sie die Seite pflegen. Die Nutzungsrechte an Bildern und anderem Material müssen zu Ihrem Einsatz passen.</li><li><strong>Was wird vor dem Start geprüft?</strong> Zur Abnahme gehören Inhalte, Links, das Handy, die Bedienung per Tastatur und ein echter Test des Kontaktwegs.</li></ol><p>Das günstigere Angebot ist völlig in Ordnung, wenn es alles enthält, was Sie brauchen. Das teurere lohnt sich nur, wenn Sie die zusätzlichen Teile auch nutzen.</p></section>
        <section aria-labelledby="vorbereitung"><h2 id="vorbereitung">5. So bereiten Sie ein konkretes Angebot vor.</h2><p>Für den ersten Kontakt brauchen Sie kein Lastenheft. Ein paar Stichpunkte reichen:</p><ul><li>Was bietet Ihr Unternehmen an, und für wen?</li><li>Welche Website gibt es bereits, falls eine vorhanden ist?</li><li>Was sollen Besucher verstehen oder erledigen können?</li><li>Welche Texte, Bilder und weiteren Materialien liegen vor?</li><li>Welche Funktionen und Termine sind Ihnen wichtig?</li></ul><p>Wenn Sie ein Budget nennen mögen, hilft das, den Umfang abzustecken. Bei Webbyu gilt <strong>Angebot auf Anfrage</strong>: Seiten, Funktionen, Material, Abstimmungen und Termine stehen einzeln im Angebot.</p><p>Die <a href="${link('/ratgeber/website-planen-checkliste/')}">Checkliste zur Websiteplanung</a> hilft bei der Vorbereitung. Was ich anbiete und wie die Zusammenarbeit abläuft, steht unter <a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a>.</p></section>
      </div>`,
  },
  '/ratgeber/website-planen-checkliste/': {
    label: 'Website planen: Checkliste',
    eyebrow: 'Ratgeber / Vorbereitung & Zusammenarbeit',
    title: 'Eine Website planen: die Checkliste für Ihr Unternehmen.',
    introduction: 'Mit einem fertigen Design anzufangen, bringt meistens wenig. Besser sind ein klares Ziel, sortiertes Material und eine Person, die entscheidet. Diese Liste geht es der Reihe nach durch.',
    article: true,
    body: ({ link }) => `
      <nav class="content-toc" aria-label="In diesem Ratgeber"><h2>In diesem Ratgeber</h2><ol><li><a href="#ziel">Ziel und Besucherfragen</a></li><li><a href="#inhalte">Inhalte und Materialien</a></li><li><a href="#funktionen">Funktionen und Kontaktweg</a></li><li><a href="#organisation">Zuständigkeiten und Termine</a></li><li><a href="#abnahme">Prüfung und Übergabe</a></li><li><a href="#kurzbriefing">Ihre Kurzvorlage</a></li></ol></nav>
      <div class="content-article-body">
        <section aria-labelledby="ziel"><h2 id="ziel">1. Legen Sie die wichtigste Aufgabe fest.</h2><p>Schreiben Sie einen Satz auf: „Unsere Website soll …“ Was soll ein Besucher danach verstanden oder getan haben? Zum Beispiel: „Unsere Website soll erklären, welche Leistungen wir in der Region anbieten, und eine Anfrage möglich machen.“</p><p>Das ist konkreter als „modern aussehen“ und hilft später bei jeder Entscheidung über Seiten und Funktionen.</p><ul class="content-check-list"><li><strong>Die Zielkunden:</strong> Für wen ist Ihr Angebot gedacht?</li><li><strong>Die wichtigsten Leistungen:</strong> Was soll jeder sofort verstehen? Was machen Sie ausdrücklich nicht?</li><li><strong>Das Gebiet:</strong> Wo arbeiten Sie wirklich, und was können Sie auch von weiter weg erledigen?</li><li><strong>Der nächste Schritt:</strong> Sollen Interessenten anrufen, schreiben, einen Termin ausmachen oder erst etwas auswählen?</li></ul><p>Schreiben Sie danach fünf Fragen auf, die neue Kunden immer wieder stellen. Daraus ergeben sich die Inhalte Ihrer Seite. Ein großes Menü beantwortet diese Fragen noch nicht.</p></section>
        <section aria-labelledby="inhalte"><h2 id="inhalte">2. Sammeln Sie Material und markieren Sie Lücken.</h2><p>Eine einfache Liste reicht. Markieren Sie jedes Material mit „vorhanden“, „überarbeiten“ oder „fehlt“. So sehen Sie, was nur eingebaut und was erst noch erstellt werden muss.</p><dl class="content-definition-list"><div><dt>Unternehmen und Leistungen</dt><dd>Eine Kurzbeschreibung, Namen und Kontaktdaten, Ihre Leistungen in eigenen Worten, das Einsatzgebiet und wie eine Zusammenarbeit mit Ihnen abläuft.</dd></div><div><dt>Logo und Gestaltung</dt><dd>Logodateien, Ihre Farben und Schriften und ein paar Seiten, die Ihnen gefallen. An fremden Seiten orientiere ich mich nur, kopiert wird nichts.</dd></div><div><dt>Bilder und Video</dt><dd>Am besten die Originaldateien, nicht die kleinen Versionen aus dem Messenger. Notieren Sie, woher ein Bild stammt, wofür es genutzt werden darf und wer die Rechte hat.</dd></div><div><dt>Arbeitsbeispiele und Aussagen</dt><dd>Nur Arbeiten, die Sie wirklich gemacht haben und zeigen dürfen, und Angaben, die sich belegen lassen. Erfundene Beispiele müssen als solche erkennbar sein.</dd></div><div><dt>Geschäftliche und rechtliche Angaben</dt><dd>Halten Sie Ihre aktuellen Anbieterangaben bereit. Impressum und Datenschutzerklärung müssen zu Ihrem Betrieb passen, und das sollte jemand vom Fach prüfen. Ein Websiteentwurf ersetzt das nicht.</dd></div></dl><p>Fehlen Texte, Fotos oder Videos, klären Sie vor dem Auftrag, wer sie macht und freigibt. Neu erstellen, überarbeiten und einbauen sind drei verschiedene Aufgaben.</p></section>
        <section aria-labelledby="funktionen"><h2 id="funktionen">3. Beschreiben Sie Abläufe, bevor Sie Funktionen bestellen.</h2><p>„Wir brauchen ein Formular“ sagt nicht, was danach passieren soll. Schreiben Sie den Weg auf, einmal aus Sicht des Besuchers und einmal aus Ihrer.</p><div class="content-note"><h3>Erfundenes Beispiel: eine erste Projektanfrage</h3><p>Ein Besucher wählt die passende Leistung, beschreibt sein Vorhaben in ein, zwei Sätzen und gibt an, wie er erreichbar ist. Vor dem Absenden sieht er seine Angaben noch einmal. Bei Ihnen kommt genau das an, was Sie vereinbart haben. Geht etwas schief, sagt ihm die Seite das und nennt einen anderen Weg, Sie zu erreichen.</p></div><ul class="content-check-list"><li>Welche Angaben brauchen Sie wirklich für den nächsten Schritt?</li><li>Welche Fragen betreffen nur bestimmte Anliegen?</li><li>Wer bekommt die Nachricht oder kümmert sich um die Buchung?</li><li>Welcher vorhandene Dienst soll eingebunden werden?</li><li>Was soll passieren, wenn Angaben fehlen oder etwas nicht funktioniert?</li></ul><p>Für eine einfache Kontaktaufnahme genügt oft ein Link zu Mail oder Telefon. Mehrstufige Auswahlhilfen, Buchungen und Shops brauchen mehr Planung. Zwei Beispiele dafür stehen unter <a href="${link('/anfrageformulare-auswahlhilfen/')}">Anfrageformulare und Auswahlhilfen</a>.</p></section>
        <section aria-labelledby="organisation"><h2 id="organisation">4. Benennen Sie eine Person für Entscheidungen.</h2><p>Auch wenn jemand anderes die Seite baut: Ohne Ihre Rückmeldungen geht es nicht. Klären Sie bei sich, wer Inhalte zusammenträgt, Fragen sammelt und den Entwurf freigibt.</p><ul class="content-check-list"><li><strong>Entscheidung:</strong> Wer hat bei Inhalten und Gestaltung das letzte Wort?</li><li><strong>Material:</strong> Wer liefert welche Texte und Dateien bis wann?</li><li><strong>Rückmeldungen:</strong> Wie sammeln Sie Kommentare, und wann hat Ihr Team Zeit dafür?</li><li><strong>Änderungen:</strong> Was passiert mit neuen Wünschen: Wie wirken sie sich auf Umfang, Preis und Zeitplan aus?</li><li><strong>Start:</strong> Gibt es einen echten Anlass oder Termin, bis zu dem die Seite online sein muss?</li></ul><p>Ein Wunschtermin ist erst einmal nur ein Wunsch. Ob er klappt, hängt von Umfang, Material, Freigaben und meiner freien Zeit ab. Termine sprechen wir ab, bevor Sie zusagen.</p><p>Rechnen Sie die Erstellung getrennt von laufenden Gebühren und späterer Pflege. Wie das geht, steht im <a href="${link('/ratgeber/website-kosten/')}">Ratgeber zu Websitekosten</a>.</p></section>
        <section aria-labelledby="abnahme"><h2 id="abnahme">5. Planen Sie die Prüfung und die Zeit nach dem Start.</h2><p>Sehen Sie sich die fertige Website nicht nur in einer Präsentation an. Klicken Sie die typischen Wege selbst durch, mit echten Inhalten.</p><ul class="content-check-list"><li>Stimmen Leistungen, Kontaktdaten, Namen, Preise und alle anderen Angaben?</li><li>Lässt sich alles auf dem Handy lesen, ohne zur Seite zu wischen?</li><li>Kommt man mit der Tastatur an alle Links, Menüs und Eingabefelder?</li><li>Führen die wichtigen Links an die richtige Stelle?</li><li>Kommt eine Nachricht über den Kontaktweg bei Ihnen an, und sind die Fehlermeldungen verständlich?</li><li>Ist klar, wer sich um Domain, Hosting, Postfächer, Pflege und spätere Änderungen kümmert?</li><li>Haben Sie die vereinbarten Dateien und Zugänge bekommen?</li></ul><p>Eine rechtliche, technische oder Barrierefreiheitsprüfung ersetzt diese Liste nicht. Sie zeigt aber, was Sie für die Abnahme vereinbaren können.</p><p>Ersetzt die neue Seite eine alte, schreiben Sie auf, welche Adressen, Inhalte und E-Mail-Dienste es bisher gibt. Wichtige Adressen sollten nach dem Wechsel weiter funktionieren.</p></section>
        <section aria-labelledby="kurzbriefing"><h2 id="kurzbriefing">6. Ihre Kurzvorlage für den ersten Kontakt.</h2><p>Notieren Sie die Punkte erst einmal für sich. Stichworte genügen, und offene Punkte dürfen offen bleiben. Zugangsdaten und vertrauliche Kundendaten gehören nicht in eine Anfrage.</p><div class="content-briefing"><dl><div><dt>Unser Unternehmen</dt><dd>Was wir anbieten und für wen.</dd></div><div><dt>Unsere wichtigste Aufgabe</dt><dd>Was Besucher verstehen oder erledigen sollen.</dd></div><div><dt>Unser bisheriger Stand</dt><dd>Vorhandene Website, Texte, Bilder und weitere Materialien.</dd></div><div><dt>Unsere offenen Fragen</dt><dd>Benötigte Unterstützung, Funktionen und unklare Punkte.</dd></div><div><dt>Unser Rahmen</dt><dd>Gewünschter Zeitraum, verantwortliche Person und bekannte Rahmenbedingungen.</dd></div></dl></div><p>Damit können wir ein erstes Gespräch führen, ohne schon jede Seite festzulegen. Wie ich vorgehe, steht unter <a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a>. Mit dem <a href="${link('/#projektfinder')}">Projektfinder</a> können Sie Ihr Vorhaben vorab sortieren. Ob Sie danach anfragen, entscheiden Sie.</p></section>
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
      <a class="content-wordmark" href="${link('/')}" aria-label="Webbyu – Startseite">${wordmarkImg(link('/'), '(max-width: 600px) 135px, 154px')}</a>
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
      <aside class="content-contact" aria-labelledby="kontakt-titel"><div><p class="content-eyebrow">Ihr nächster Schritt</p><h2 id="kontakt-titel">Was soll Ihre Website leichter machen?</h2><p>Schreiben Sie mir ein paar Sätze zu Ihrem Betrieb und dazu, was die Website erledigen soll. Den Umfang klären wir dann zusammen. Angebot auf Anfrage.</p><p class="content-contact-small">Für Unternehmen und Selbstständige · Bad Oldesloe, Stormarn & Umgebung</p></div><div class="content-contact-actions"><a class="content-button" href="${link('/#projektfinder')}">Vorhaben besprechen <span aria-hidden="true">↗</span></a><a href="mailto:lukas.wagner@webbyu.de">lukas.wagner@webbyu.de</a><a href="tel:+4917642090983">+49 176 42090983</a></div></aside>
    </main>
    <footer class="content-footer"><div class="content-footer-top"><a class="content-wordmark" href="${link('/')}" aria-label="Webbyu – Startseite">${wordmarkImg(link('/'), '(max-width: 600px) 135px, 154px')}</a><p>Websites aus Bad Oldesloe,<br>ohne Baukasten.</p></div><nav aria-label="Weitere Seiten"><a href="${link('/websites-fuer-unternehmen/')}">Websites für Unternehmen</a><a href="${link('/anfrageformulare-auswahlhilfen/')}">Anfrageformulare & Auswahlhilfen</a><a href="${link('/ueber-mich/')}">Über mich</a><a href="${link('/ratgeber/')}">Ratgeber</a><a href="${link('/reise/')}">Konzeptstudien</a><a href="${link('/impressum/')}">Impressum</a><a href="${link('/datenschutz/')}">Datenschutz</a><button class="content-privacy-open" type="button" data-privacy-open hidden>Cookie-Einstellungen</button></nav><div class="content-footer-bottom"><span>© 2026 Webbyu · Lukas Wagner</span><span>Websites, selbst gebaut</span></div></footer>`;
}
