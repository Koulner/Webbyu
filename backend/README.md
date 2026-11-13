# Anfrage-Backend – Vertrag und Betrieb (AP02, 26.10.2026)

Implementiert, lokal mit PHP 8.4.27 geprüft, noch nicht veröffentlicht. **Kein Nachweis für ein vorhandenes Produktivpostfach, SMTP-Anmeldung oder Mail-Eingang.** AP01 konnte das Konto nicht prüfen. AP03 bearbeitet den Finder; AP04 die Geschäftsinhalte. Diese API veröffentlicht keine Preise oder Leistungszusagen.

## Gemeinsamer Vertrag für AP03

Die verbindlichen TypeScript-Typen stehen in [`src/inquiry-contract.ts`](../src/inquiry-contract.ts). Aufruf ausschließlich nach ausdrücklichem Versandklick, am selben HTTPS-Origin:

```ts
const request: InquiryRequest = {
  ...briefStore.get(),
  requestId: crypto.randomUUID(),
  website: '',
};
// Keine automatische Wiederholung, auch nicht bei Netzwerkfehler/Timeout.
const response = await fetch(INQUIRY_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
});
```

`Origin` setzt der Browser selbst. Produktions-Origins: `https://webbyu.de` und `https://www.webbyu.de`, jeweils nur zum identischen Host. Keine CORS-Freigabe, kein Empfang aus Pages-Vorschauen. Lokale Frontendtests verwenden einen Mock; keine localhost-Freigabe im Produktivcode ergänzen.

Alle 23 Schlüssel müssen vorhanden sein; zusätzliche Schlüssel sind ungültig. Die ersten zehn gehören zum Vertrag von AP02, die weiteren stammen aus dem Projektberater (Katalogversion `2026-11-a`):

| Feld | Gültiger Inhalt |
| --- | --- |
| `requestId` | kleingeschriebene UUID v4 aus `crypto.randomUUID()` |
| `website` | leerer String, Honeypot; für Menschen verborgen, nicht erforderlich/ausfüllbar machen |
| `goal` | `presence`, `inquiries`, `bookings`, `sales`, `media` (Medien-Weg) |
| `extensions` | eindeutige Liste aus `wizard`, `booking_embed`, `booking_custom`, `language`, `cms`, `integration`, `3d`, `unsure`; `unsure` nur allein; leere Liste erlaubt |
| `projectType` | `new`, `existing`, `media` oder `advice` |
| `timing` | `flexible`, `soon`, `later` |
| `description` | String, optional leer, maximal 5.000 Unicode-Codepoints; Zeilenumbrüche erlaubt |
| `name` | nach Entfernen äußerer Leerzeichen nicht leer; maximal 120 Unicode-Codepoints, keine Steuerzeichen/Zeilenumbrüche |
| `email` | gültige ASCII-Mailboxadresse, maximal 254 Zeichen, keine Steuerzeichen/Zeilenumbrüche; Plus-Adressen erlaubt; internationale Postfach-/Domain-Schreibweise muss vorher als ASCII vorliegen |
| `selectedPackage` | `null`, `start`, `business`, `complete`, `custom` |
| `scope` | `compact`, `extended`, `large`, `unknown` |
| `texts` | `ready`, `notes`, `missing`, `unknown` |
| `images` | `ready`, `partly`, `missing`, `unknown` |
| `imageSource` | `null`, `customer_later`, `photo_compact`, `photo_standard`, `licensed`, `no_photos`, `open` |
| `video` | `none`, `clip`, `unknown` |
| `zone` | `region`, `outside`, `unknown` |
| `mediaChoice` | `null`, `photo_compact`, `photo_standard`, `clip`, `photo_clip`, `unknown` |
| `mediaUse` | eindeutige Liste aus `website`, `social`, `ads`, `third_party`; leer erlaubt |
| `sites` | `oneSite` oder `multipleSites` |
| `drone` | Wahrheitswert (kein String, keine Zahl) |
| `removedLines` | eindeutige Liste abwählbarer Positionen: `migration`, `text_notes`, `text_interview`; leer erlaubt |
| `catalogVersion` | Jahr-Monat-Buchstabe, z. B. `2026-11-a` |
| `shownLines` | Liste mit höchstens 30 Einträgen `{ id, status, min, max }`: bekannte, nicht doppelte `id` aus `Input::LINES`; `status` ist `included`, `fixed`, `range`, `open` oder `external`; `min` und `max` sind ganze Euro von 0 bis 100000, `min` ≤ `max`; offene und enthaltene Positionen stehen bei 0; leere Liste erlaubt |

**Preisangaben sind nicht verbindlich.** `shownLines` und `catalogVersion` zeigen, was der Besucher im Browser gesehen hat. Der Server rechnet nicht neu und prüft nur Form, bekannte Kennungen und Grenzen. Die E-Mail stellt Antworten, Positionen, offene Punkte und Katalogversion dar und nennt den Preis „vom Besucher gesehen“. Die Summe in der Mail folgt derselben Regel wie im Finder: nur `fixed` und `range`, nie `open` oder `external`; bei offenen Positionen steht nie eine alleinige Summe. Neue Positionen müssen in `src/pricing-catalog.ts` und in `Input::LINES` stehen. Ein Test (`src/inquiry-contract.test.ts`) vergleicht beide Listen.

Gesamter UTF-8-JSON-Body höchstens **32.768 Bytes**. Kein Datei-Upload, keine Anhänge, keine Header-, Absender-, Betreff- oder Empfängerfelder. HTML-Sonderzeichen und Tags in Namen/Beschreibungen werden als reiner Text übermittelt, nie als HTML-Mail. Name, E-Mail und Beschreibung werden außen getrimmt; Beschreibungsumbrüche vereinheitlicht; Erweiterungen sortiert. Grenzen gelten vor dem Trimmen. Browser-`maxlength` zählt UTF-16-Einheiten und kann bei Emoji früher begrenzen.

| HTTP | JSON (`InquiryResponse`) | Bedeutung und UI-Verhalten |
| --- | --- | --- |
| 200 | `{ "status": "success", "requestId": "…", "duplicate": false }` | SMTP hat die Nachricht nach DATA bestätigt. Text etwa „Ihre Anfrage wurde zum Versand angenommen“. Kein garantierter Inbox-Eingang. |
| 200 | dieselbe Form mit `duplicate: true` | dieselbe Kennung oder identischer normalisierter Inhalt bereits angenommen; kein erneuter Versand. `requestId` ist die ursprüngliche Mailkennung und darf vom neu gesendeten Wert abweichen. |
| 400/403/405/413/415/422 | `{ "status": "invalid", "fields": ["email"] }` | fehlerhaftes JSON/Origin/Methode/Größe/Inhaltstyp/Angaben. `fields` kann leer sein. 405 zusätzlich `Allow: POST`. Feldfehler korrigieren; generische Ablehnungen verständlich anzeigen. |
| 429 | `{ "status": "rate_limit", "retryAfter": 3600 }` | Schutzlimit erreicht; positive Wartezeit in Sekunden, auch als `Retry-After`-Header. Kein automatischer Versand nach Ablauf. |
| 503 | `{ "status": "temporary", "outcome": "not_sent" }` | dieser Versuch hat nichts übertragen: z. B. fehlende private Konfiguration oder SMTP-Fehler vor DATA. Manuelle Wiederholung derselben unveränderten Anfragekennung erlaubt. |
| 503 | `{ "status": "temporary", "outcome": "not_sent", "retryAfter": 5 }` | anderer Versand hält die gemeinsame Dateisperre. Angaben erhalten, später ausdrücklichen erneuten Versuch ermöglichen. |
| 503 | `{ "status": "temporary", "outcome": "unknown" }` | DATA wurde begonnen, Antwort ging verloren oder ein früherer Versuch blieb unterbrochen. Keine automatische Wiederholung, keine neue Kennung für unveränderte Daten erzeugen. Hinweis auf unklaren Ausgang und Geschäftskontakt anbieten. |

Netzwerkabbruch, Timeout, unerwartetes HTML oder unlesbare Antwort sind im Frontend ebenfalls **unbekannter Ausgang**. Angaben, Kopieren und Bearbeiten immer erhalten. Eine Kennung beim erstmaligen Versand erstellen und für dieselben Angaben behalten, auch nach fehlgeschlagener Antwort. Bei tatsächlichen Änderungen eine neue Kennung anlegen. Gleiche Kennung mit anderem Inhalt ergibt 422 für `requestId`. Nicht bei jedem Klick eine neue UUID erzeugen. Ein laufender Button wird gesperrt. Nur ein vom Nutzer ausdrücklich gestarteter weiterer Versuch darf wieder einen POST auslösen.

Duplikatschutz gilt 24 Stunden. Auch ein wiederholter POST mit unbekanntem/unterbrochenem Status löst währenddessen **keinen** weiteren Versand aus. Nach Ablauf besteht kein unbegrenzter Genau-einmal-Nachweis. Kein Polling über gültige POSTs implementieren. `GET /api/health.php` ist eine Betriebsprüfung und kein Anfrage-Statusdienst.

## SMTP und private Einrichtung für AP08

Benötigt wird gepflegtes PHP **ab 8.3**, OpenSSL mit CA-Vertrauensspeicher, JSON/Filter/ctype/hash, HTTPS, Apache-Rewrite/Require sowie ein lokales Dateisystem mit `flock`, `fflush` und `fsync`. Keine Projektdatenbank. PHPMailer **7.1.1** ist mit Composer-Lock gesperrt. Host, Port, TLS und Mailadressen sind Codekonstanten:

- `smtp.ionos.de:465`, implizites TLS (SMTPS), SMTP-Authentifizierung.
- Zertifikats- und Hostnamenprüfung aktiv; TLS 1.2/1.3; keine selbst signierten Zertifikate, kein Klartext-/587-/`mail()`-Fallback.
- Benutzer, From, Envelope-Sender und alleiniger To: `lukas.wagner@webbyu.de`.
- Besucheradresse ausschließlich Reply-To. Keine CC/BCC oder Besucher-Automail.
- Fester Betreff mit validierter UUID; feste Message-ID; UTF-8, Base64, `text/plain`.
- Verbindungs-/Lesewartezeit 10 Sekunden; SMTP-Antwortlimit 10 Sekunden (PHPMailer verdoppelt es beim DATA-Abschluss). PHP-Zeitlimit 60 Sekunden ist keine garantierte Gesamtfrist für blockierende I/O; der Webserver muss einen ausreichend langen eigenen Request-Timeout erlauben. Ein beendeter Prozess hinterlässt `pending`, das Wiederholungen sperrt. Der Code wiederholt keinen SMTP-Versuch.

**Private Eingaben vom Betreiber, ausschließlich direkt am Server:** das Passwort dieses Geschäftspostfachs, ein zufälliger eigener HMAC-Schlüssel und bestätigte absolute Pfade. Keine Geheimnisse an Chat, Repository, Kommandoargumente, GitHub-Secrets des Builds oder CI-Artefakte übermitteln. SFTP-Zugangsdaten bleiben wie bisher nur im Deployment-Environment; sie sind keine SMTP-Zugangsdaten.

1. Einen privaten Ordner **außerhalb sämtlicher öffentlicher Domainverzeichnisse** im Webspace bestätigen/anlegen. Der Standard ist `webbyu-private` als Geschwister des tatsächlichen Website-Roots, nicht innerhalb von `/webbyu`. SFTP-Pfad und absoluter PHP-Dateisystempfad können abweichen; ihre Zuordnung muss der Betreiber bestätigen. Bestehende weitere Domains beachten.
2. [`private-config.example.php`](private-config.example.php) außerhalb des Checkouts privat als `inquiry.php` anlegen und dort ausfüllen. `smtp_username` muss exakt die feste Geschäftsadresse bleiben. `smtp_password` direkt privat eintragen. `hmac_key` ist 64 Zeichen Hex, privat z. B. mit `bin2hex(random_bytes(32))` erzeugt. Den erzeugten Wert nicht protokollieren. `state_directory` ist ein vorhandener privater, durch PHP beschreibbarer absoluter Pfad.
3. Konfigurationsdatei mit Rechten **0600**, Zustandsordner **0700**, nur für den PHP-Betriebsbenutzer. Unter Unix werden weitergehende Rechte abgelehnt. Private Verzeichniszugriffe und Backups ebenfalls beschränken. Unter Windows sind die ACLs vom Betreiber zu prüfen.
4. Standardladepfad: `dirname(realpath(Website-Root))/webbyu-private/inquiry.php`. Bei anderem Pfad ausschließlich die serverseitige Umgebungsvariable `WEBBYU_INQUIRY_CONFIG` setzen. Kein Requestparameter und kein `VITE_*`-Wert. Der Code lehnt Konfiguration und Zustand innerhalb des eigenen öffentlichen Roots ab; weitere Domainziele kann er nicht selbst erkennen. `open_basedir` muss privaten Zugriff erlauben. Kein privates Verzeichnis in `dist` verlinken.
5. Private Bereinigung alle **15 Minuten** einrichten, mit Server-CLI-PHP: `php /ABSOLUTER-WEBSITE-ROOT/_inquiry/releases/COMMIT/bin/cleanup.php /ABSOLUTER-WEBSITE-ROOT`. Nur Pfade, keine Secrets als Argumente. Bei alternativem Konfigurationspfad die gleiche serverprivate Umgebungsvariable setzen. Zeitplan und PHP-CLI-Pfad sind bei diesem IONOS-Vertrag noch unbestätigt. Ohne nachgewiesene Bereinigung keine feste physische Höchstfrist versprechen; AP08 muss dies vor Betriebsfreigabe klären. Den Cleanup-Pfad beim Releasewechsel aktualisieren oder einen bewahrten geprüften Release verwenden. CLI-Ausgabe enthält nur Erfolg oder generischen Fehler.
6. Vor Veröffentlichung unter einer geeigneten privaten Betriebsprüfung PHP-Version, Zertifikatsspeicher, Konfigurationslesbarkeit, Zustandsrechte, Sperre, freien Speicher und Cleanup prüfen. Keine öffentliche `phpinfo()`-/Konfigurationsausgabe anlegen. Fehlkonfiguration ergibt 503 ohne Pfad, SMTP-Antwort oder Secret.

Die private Konfiguration wird **nie** vom SFTP-Build hochgeladen oder überschrieben. Bei Passwortwechsel privat ersetzen; danach Readiness und einen ausdrücklich gekennzeichneten eigenen Live-Test prüfen. HMAC-Schlüssel stabil halten: Rotation macht vorhandene Schutzschlüssel unbrauchbar und kann Doppelversand ermöglichen. Nicht zur Fehlerbehebung zurücksetzen.

## Schutzdaten und tatsächliche Logs – Übergabe für AP05

Eine Datei `inquiry-state.json` im privaten Zustandsordner, Modus 0600, wird unter einer exklusiven `flock`-Sperre auf `inquiry-state.lock` gelesen und geschrieben. Die Sperre bleibt bis nach der SMTP-Antwort und deren Statusspeicherung bestehen. Ist sie belegt, versucht der Server es bis zu 1 Sekunde erneut. So stören kurze Zugriffe durch Health-Check oder Cleanup keine Anfrage. Läuft danach noch ein anderer Versand, gibt es 503 und keine zweite SMTP-Verbindung. Jede Speicherung schreibt erst `inquiry-state.json.tmp` (mit `fflush`/`fsync`) und ersetzt dann die Datei per `rename`. Ein Abbruch hinterlässt so nie halbes JSON. Vor DATA wird `pending` dauerhaft gespeichert. Beim Releasewechsel den Cleanup-Pfad sofort auf den neuen Release umstellen, weil ältere Releases noch direkt auf `inquiry-state.json` sperren. Schreibfehler verhindern den Versand. Unlesbarer, beschädigter oder zu großer Zustand führt zu 503; der Code setzt ihn nicht automatisch zurück.

| Daten | Zweck | Wirksame Frist / Entfernung |
| --- | --- | --- |
| HMAC-SHA256 von direkter Verbindungs-IP (bei IPv6 das /64-Netz) und normalisierter E-Mail, Versuchzeitpunkte, globale Zeitpunkte | 5 Versuche je IP, 3 je E-Mail und 30 insgesamt in einem rollenden Stundenfenster; ein Versuch mit sicherem Ergebnis `not_sent` wird zurückgebucht | Nach 3.600 Sekunden bei nächstem gültigen API-/Health-/Cleanup-Zugriff entfernt; mit verifiziertem 15-Minuten-Cleanup spätestens nach 1 h 15 min. |
| Anfrage-UUID, HMAC des normalisierten Inhalts, `pending`/`accepted`, Ablaufzeit | Duplikatsperre und ehrlicher unklarer Ausgang | Nach 86.400 Sekunden bei nächstem Zugriff entfernt; mit verifiziertem Cleanup spätestens nach 24 h 15 min. |

Keine Klartext-IP, E-Mail, Namen, Beschreibung oder Nachricht im Schutzbestand. HMAC ist Pseudonymisierung, keine Behauptung anonymer Daten. Kein Tracking-Cookie, kein LocalStorage durch das Backend. Die direkte `REMOTE_ADDR` wird verwendet; `X-Forwarded-For` wird bewusst nicht vertraut. Ein Proxy/CDN kann dadurch mehrere Besucher unter einem Limit bündeln. Aktuelles IONOS-CDN laut Vorübergabe ungenutzt; abweichende Live-Topologie vor Freigabe prüfen.

Abgelehnte ungültige Angaben/Honeypots werden nicht gespeichert; gültige neue Versandversuche zählen auch bei SMTP-Fehlern. Bereits bekannte Duplikate erhöhen die Zähler nicht. Zustandsdatei maximal 2 MB, bei den global begrenzten Versuchen deutlich kleiner; kein unbegrenztes Verzeichnis je Besucher. Abgelaufene Einträge bleiben ohne weitere Zugriffe oder eingerichteten Cleanup physisch liegen. **Ein Zeitplan ist bislang nicht live eingerichtet oder nachgewiesen.** Private Backups der Zustandsdatei ausschließen, damit dort keine längeren Schutzdatenbestände entstehen.

Die Anwendung schreibt **keine eigenen Anfrage-, SMTP- oder Fehlerlogs**. `SMTPDebug=0`; Exceptions und SMTP-Servertexte werden nicht ausgegeben/protokolliert. Die beiden öffentlichen Einstiegspunkte deaktivieren PHP-`display_errors` und `log_errors` für ihre Laufzeit. Hosting-Zugriffslogs, vorgeschaltete Sicherheitslogs und PHP-/Webserver-Startfehler können außerhalb dieser Laufzeit entstehen; deren tatsächliche Konfiguration/Fristen sind nicht hier bestätigt und bleiben nach IONOS-Befunden zu beschreiben. Keine Requestbodys in Hosting-Debuglogs aktivieren. Mailinhalt und Kontaktdaten liegen nach Annahme im IONOS-Mailbetrieb/Geschäftspostfach; hierfür gilt **nicht** die 24-Stunden-Schutzdatenfrist. Die geschäftliche Aufbewahrung muss AP05 separat beschreiben.

Originprüfung und Honeypot sind kein Schutz gegen Bots, die Browserheader nachbilden. Ratenlimit und globale Serialisierung begrenzen den Versand; ein gemeinsames Dateisystem ist Voraussetzung. Kein Betrieb mit voneinander unabhängigen Serverzuständen. Es gibt keinen unbegrenzten oder verteilten DDoS-Schutz.

## Build, Auslieferung und Betriebsnachweis

```text
composer validate --strict --working-dir=backend
composer install --working-dir=backend --no-dev --prefer-dist --no-scripts --no-plugins --no-interaction --classmap-authoritative
composer audit --working-dir=backend --locked --no-dev
npm run test:backend
npm run test:deploy
# Produktionsbuild mit SITE_BASE_PATH=/, dann GITHUB_SHA=<40-stelliger Commit>:
npm run build
node scripts/prepare-ionos.mjs
npm run test:backend:package
```

`PHP_BIN` kann bei lokalen Tests auf eine temporäre PHP-Binärdatei zeigen. `prepare-ionos.mjs` prüft installierte Pakete gegen Composer-Lock und kopiert nur `backend/src`, `vendor` und CLI-Bereinigung in `dist/_inquiry/releases/COMMIT/`. Private Beispieldatei, Backendtests, Composer-Rootdateien und lokale Werkzeuge werden nicht kopiert. Unter `dist/api/` liegen nur `inquiry.php` und `health.php`, jeweils fest an diesen Release gebunden. Die Abhängigkeiten sind ausschließlich für serverseitige Includes; Apache verweigert HTTP-Zugriff auf `_inquiry` durch Root-Regel und eigene `.htaccess`.

Der SFTP-Plan lädt alle Dateien unter gesperrten temporären Namen hoch. Beim Umbenennen erscheinen erst die Root-/Unterordner-Schutzregeln, dann versionierte Abhängigkeiten, dann API, danach HTML und zuletzt der Release-Marker. Neue API-Dateien finden so einen vollständigen Release. Der Wechsel der gesamten Website bleibt wie bisher nicht atomar. Frühere Releases und nicht zum Build gehörende Dateien bleiben erhalten. Freien Webspace prüfen; alte Releases erst nach Rückkehrfrist/Prüfung gezielt entfernen. Private Zustände beim Rücksetzen erhalten.

Dev- und IONOS-Workflows installieren PHP/Composer, prüfen echte PHP- und HTTP-Tests und erstellen ein Apache/PHP-Testabbild aus **ausschließlich `dist`**. Im Testabbild liegen nur ausdrücklich künstliche Zugangswerte; kein produktiver SMTP-Versuch. `scripts/test-apache.mjs` prüft den tatsächlichen PHP-/Apache-Paketbetrieb und die Zugriffssperren. Das Abbild wird nicht hochgeladen. Nur der Produktionsworkflow archiviert `dist`; kein SMTP-Secret ist Teil des Builds.

Nach der Veröffentlichung prüft `verify-ionos.mjs` zusätzlich:

- `GET /api/health.php`: ausgeführtes PHP, richtige Releasekennung/Vertragsversion, geladene private Konfiguration, abhängige Klassen und schreib-/sperrbarer Zustand. Nur `ready` besteht; `unavailable`/`busy` ist 503. Keine privaten Detaildaten. **Kein SMTP-/Postfachnachweis.**
- `GET /api/inquiry.php`: 405 mit JSON und `Allow: POST`, `no-store`.
- leeres ungültiges JSON: 422 am eigenen Origin; 403 von fremdem Origin, ohne CORS-Freigabe.
- Bibliothek/Quellen, private Pfadnamen, `.env`, Composer-Lock und temporäre Uploadnamen: 403/404.

Diese Probes übermitteln **nie gültige Anfrageangaben** und versenden keine E-Mail. Fehlender PHP-Handler, ausgelieferter Quelltext, fehlende Konfiguration oder öffentliche Quellen lassen die Abnahme fehlschlagen. Falls PHP ganz deaktiviert ist, kann PHP selbst keinen 503 erzeugen; die Prüfung erkennt die falsche Antwort. Da öffentliche PHP-Dateien keine Secrets enthalten und die echte Konfiguration außerhalb aller Domainziele liegen muss, gelangen dabei keine produktiven Zugangsdaten aus dem Build nach außen.

Ein fehlgeschlagener öffentlicher Nachweis führt nicht automatisch zu einem vollständigen Rollback bereits übertragener Dateien. AP08 muss privaten Fehler beheben oder den letzten **Backend-fähigen** geprüften Release mit derselben privaten Zustandsablage zurückspielen. Ein reiner alter statischer Build entfernt die neue API nicht; ein solcher Rückbau braucht gezieltes Abschalten/Entfernen beider API-Einstiegspunkte. Nie einfach Zustandsdatei löschen: bei unklarem Versandstatus zuerst Geschäftspostfach mit UUID prüfen, mindestens die 24-Stunden-Sperrfrist respektieren und keine erneute Übermittlung behaupten.

## Konkrete offene Live-Voraussetzungen (AP08)

1. Existenz, Anmeldung und Empfang für `lukas.wagner@webbyu.de`; Mail-DNS/SPF/DKIM/DMARC anhand des tatsächlichen Kontos prüfen.
2. Passwort direkt privat hinterlegen; erfolgreiche SMTP-Authentifizierung und Zertifikats-/CA-Prüfung aus dem Hosting nachweisen.
3. PHP-Version/Module und Apache-Regeln beim tatsächlichen Domainziel bestätigen; `open_basedir`, absolute private Pfade, PHP-Benutzerrechte und gemeinsame lokale Sperre nachweisen.
4. Privaten HMAC-Schlüssel, Konfigurationsdatei und Zustandsordner einrichten; sicherstellen, dass keine andere Domain diese Pfade ausliefert. Nichts davon ist gegenwärtig eingerichtet oder bestätigt.
5. Cleanup-Zeitplan und dessen erfolgreiche Ausführung belegen; erst dann die bedingten physischen Speicherfristen in Besuchertexten zusagen. Geschäfts-Mailaufbewahrung separat klären.
6. Den neuen CI-Lauf einschließlich Apache/PHP bestehen lassen. Lokaler Docker-Dienst läuft nicht; die Apache-Integration wurde hier konfiguriert, **noch nicht ausgeführt**.
7. Nach AP03/AP05 und AP07-Abnahme gemeinsam veröffentlichen. Öffentliche Readiness/Schutzpfade prüfen. Anschließend **einmalig** ausdrücklich gekennzeichnete eigene Testanfrage mit neuer UUID senden, SMTP-Annahme dokumentieren und tatsächlichen Inbox-Eingang samt Reply-To/Textdarstellung prüfen. Keine automatische Testwiederholung bei Timeout. Diese Live-Prüfung ist noch offen.

## Offizielle Quellen (26.10.2026 geprüft)

- [IONOS: SMTP für Webanwendungen, Host/465/Authentifizierung und implizites TLS](https://www.ionos.de/hilfe/e-mail/problemloesungen-mail-basicmail-business/e-mails-senden-mit-wordpress-problemloesungen-fuer-smtp/)
- [IONOS: TLS 1.2 oder höher](https://www.ionos.de/hilfe/e-mail/ssl-verschluesselung-fuer-e-mail/verschluesselung-ssltls-in-einem-e-mail-programm-aktivieren/)
- [PHPMailer: Composer-Installation und SMTP-Beispiel](https://github.com/PHPMailer/PHPMailer), [Release 7.1.1](https://github.com/PHPMailer/PHPMailer/releases/tag/v7.1.1)
- [PHP: unterstützte Versionen](https://www.php.net/supported-versions.php), [`flock`](https://www.php.net/manual/en/function.flock.php), [`fsync`](https://www.php.net/manual/en/function.fsync.php)
- [Composer: überprüfbare Installation](https://getcomposer.org/download/), [offizielles PHP-Docker-Abbild](https://hub.docker.com/_/php), [PHP-Setup für CI](https://github.com/shivammathur/setup-php)

Die Standardwerte belegen keinen individuell erfolgreich eingerichteten IONOS-Vertrag. Keine zusätzliche breite Hosting-/Rechtsrecherche und keine Kontozugriffsumgehung vorgenommen.
