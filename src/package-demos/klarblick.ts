type StartParts = {
  photo: (file: string, alt: string, eager?: boolean, disclosed?: boolean) => string;
  button: (text: string) => string;
  form: () => string;
};

export const klarblickMark = '<span class="kb-mark" aria-hidden="true"></span>';

export function startHome({ photo, button, form }: StartParts): string {
  return `<section class="kb-opening">
    <div class="kb-opening-copy">
      <p class="kb-tag"><span></span> Fensterreinigung in Stormarn</p>
      <h1>Einmal klar,<br><em>bitte.</em></h1>
      <p>Fenster innen und außen, Rahmen und Fensterbänke. Für Ihr Zuhause, Ihr Büro oder das Schaufenster an der Straße.</p>
      ${button('Fensterreinigung anfragen')}
    </div>
    <figure class="kb-opening-photo">
      ${photo('klarblick-concept', 'KI-Illustration: Sonnenlicht fällt durch eine große Fensterscheibe, rechts setzt ein Abzieher an.', true, true)}
      <figcaption>KI-Illustration</figcaption>
    </figure>
    <div class="kb-opening-index"><span>Glas · Rahmen · Fensterbank</span><a href="#leistungen">Was wir reinigen <span aria-hidden="true">↓</span></a></div>
  </section>

  <section class="kb-services-section kb-wrap" id="leistungen" aria-labelledby="kb-services-title">
    <div>
      <p class="kb-tag"><span>01</span> Leistungen</p>
      <h2 id="kb-services-title">Von der Scheibe<br>bis zum Rahmen.</h2>
      <p>Einmalig oder regelmäßig. Was dazugehört und wie wir an die Fenster kommen, klären wir vor dem Termin.</p>
    </div>
    <dl class="kb-service-table">
      <div><dt>Fenster zu Hause</dt><dd>Glas innen und außen, Rahmen und Fensterbänke. Sagen Sie uns, wenn einzelne Fenster nur schwer erreichbar sind.</dd></div>
      <div><dt>Büro &amp; Praxis</dt><dd>Fenster und verglaste Türen. Das Zeitfenster stimmen wir mit Ihrem Betrieb ab.</dd></div>
      <div><dt>Schaufenster</dt><dd>Glas zur Straße und verglaste Eingänge. Wir klären, wann die Flächen frei zugänglich sind.</dd></div>
    </dl>
  </section>

  <section class="kb-visit" id="ablauf" aria-labelledby="kb-visit-title">
    <figure>
      ${photo('clear-office', 'Ein Büroflur mit raumhohen Glaswänden und schwarzen Rahmen.')}
      <figcaption>Unsplash · Symbolfoto</figcaption>
    </figure>
    <div class="kb-visit-copy">
      <p class="kb-tag"><span>02</span> Ablauf</p>
      <h2 id="kb-visit-title">Was wir vor dem<br>Termin klären.</h2>
      <ol>
        <li><strong>Fenster beschreiben.</strong> Ort, ungefähre Anzahl und Zugang reichen für den Einstieg.</li>
        <li><strong>Umfang abstimmen.</strong> Wir klären Flächen, Erreichbarkeit und einen passenden Termin.</li>
        <li><strong>Glas und Rahmen ansehen.</strong> Nach der Reinigung gehen wir das Ergebnis gemeinsam durch.</li>
      </ol>
      <a href="#kontakt">Fenster beschreiben <span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <section class="kb-region" id="gebiet" aria-labelledby="kb-region-title">
    <div class="kb-wrap">
      <p class="kb-tag"><span>03</span> Einsatzgebiet</p>
      <h2 id="kb-region-title">In Stormarn<br>unterwegs.</h2>
      <ul><li>Bad Oldesloe</li><li>Reinfeld</li><li>Bargteheide</li></ul>
      <p>Liegt Ihr Ort in der Umgebung? Geben Sie ihn in der Anfrage an. So lässt sich die Anfahrt direkt mitklären.</p>
    </div>
  </section>

  <section class="kb-questions kb-wrap" aria-labelledby="kb-questions-title">
    <div><p class="kb-tag"><span>04</span> Häufige Fragen</p><h2 id="kb-questions-title">Gut zu wissen.</h2></div>
    <div>
      <details><summary>Was muss ich vorbereiten?</summary><p>Räumen Sie die Fensterbänke frei und machen Sie den Weg zu den Fenstern zugänglich. Bei hohen oder schwer erreichbaren Scheiben klären wir den Zugang vorab.</p></details>
      <details><summary>Wovon hängt der Preis ab?</summary><p>Von der Größe und Anzahl der Flächen, ihrer Erreichbarkeit und der Verschmutzung. Angebot auf Anfrage.</p></details>
      <details><summary>Geht das auch regelmäßig?</summary><p>Ja. Für Schaufenster, Praxen, Büros und Wohnräume lässt sich ein passender Rhythmus besprechen.</p></details>
    </div>
  </section>
  ${form()}`;
}

export function klarblickNotes(base: string, home: string, packageDescription: string): string {
  return `<section class="kb-notes kb-wrap">
    <p class="kb-tag"><span></span> Klarblick · Webbyu Start</p>
    <h1>Zur Demo.</h1>
    <p class="kb-notes-lead">Klarblick ist eine fiktive Fensterreinigung in Stormarn. Die Website zeigt eine mögliche Ausgestaltung des Start-Pakets.</p>
    <div class="kb-notes-grid">
      <section><h2>Beispielumfang</h2><p>${packageDescription} Die gezeigten Inhalte und Funktionen illustrieren den Umfang. Angebot auf Anfrage. Individuelle 3D-Produktion wird separat kalkuliert.</p></section>
      <section><h2>Bilder</h2><p>Das Fenstermotiv wurde mit OpenAI ImageGen erstellt. Der Arbeitsraum im Abschnitt „Ablauf“ ist ein Symbolfoto von Unsplash. Beide Motive dienen der Illustration.</p><p><a href="${base}package-demos/sources.json">Bildnachweise</a> · <a href="https://unsplash.com/license">Unsplash-Lizenz</a></p></section>
      <section><h2>Anfrage &amp; Datenschutz</h2><p>Die Demo verarbeitet Beispieldaten lokal im Arbeitsspeicher der geöffneten Seite. Beim Neuladen werden sie verworfen. Der Link zur echten Webbyu-Anfrage übernimmt ausschließlich die Paketwahl.</p><p><a href="${base}impressum/">Impressum Webbyu</a> · <a href="${base}datenschutz/">Datenschutz Webbyu</a></p></section>
    </div>
    <a class="pd-button" href="${home}">Zurück zu Klarblick <span aria-hidden="true">↗</span></a>
  </section>`;
}
