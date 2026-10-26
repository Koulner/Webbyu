# Webbyu – Betriebsbereitschaft

Stand: 26.10.2026. Dieser Auftrag wurde vom Betreiber ausdrücklich zur Umsetzung einschließlich separater Arbeitschats und abschließender Veröffentlichung freigegeben.

## Verbindliche Entscheidungen

- Geschäftskontakt, fester SMTP-Absender und Anfrageempfänger: `lukas.wagner@webbyu.de`.
- Alle öffentlichen Pakete: **Angebot auf Anfrage**. Keine internen Preisentwürfe oder unbestätigten Mengen und Lieferfristen veröffentlichen.
- Vier Konzeptbeispiele bleiben gekennzeichnete lokale Demos; kein echter Shop, keine Buchungen, kein neues Design oder Brillen-Onepager.
- Bestehende Gestaltung, Reise und IONOS-Hosting erhalten. Keine kostenpflichtigen Zusatzdienste.
- Arbeiten seriell im lokalen Projekt auf `dev`; jeder Arbeitsschritt bekommt einen eigenen neuen Projektchat. Keine zusätzlichen Subagenten. Nur AP08 veröffentlicht gesammelt nach bestandener AP07-Abnahme.
- Koordinationschat: `01a17599-eea1-72c2-be90-81d692f03346`. Der Koordinator liest Ergebnisse und setzt den nächsten Chat auf. Die Arbeitschats müssen keine Nachrichten an andere Chats senden.
- Jeder Arbeitschat liest zuerst dieses Dokument, relevante aktuelle Übergaben und den tatsächlichen Code; historische Aussagen in README/WORK_PACKAGES/RECHTLICHES nicht mit aktuellen Befunden verwechseln.
- Jeder Arbeitschat dokumentiert unten Ergebnis, Prüfungen, Einschränkungen und einen lokalen Commit seiner eigenen Änderungen. Kein pauschales Staging, kein Push, kein Branchwechsel, kein Reset.

## Geschützter Ausgangsstand

Bereits vor Beginn geändert/unversioniert: `.gitignore`, `RECHTLICHES.md`, `WORK_PACKAGES.md`, `BRILLEN_ONEPAGER.md`, `IDEEN_UND_ROADMAP.md`, `notizen_Produkt Owner.txt`, `rechtliches/CHAT-UEBERGABE-IONOS.md`, `rechtliches/IONOS-PRUEFUNG.md`, `rechtliches/IONOS-SUPPORTANFRAGE.md` und `site/`. Diese fremden Änderungen nicht überschreiben oder versehentlich mit committen. AP05 darf notwendige Ergänzungen zu Rechtsdokumentation nur gezielt und unter Erhalt des Bestands vornehmen.

Ausgangsprüfung in diesem Chat: 124 Website-Tests, fünf Deployment-Tests, TypeScript-Prüfung und Produktionsbuild bestanden. Bekannte Warnungen: Schriftpfade und Größe des 3D-Chunks. Kein vollständiger neuer Live-Abnahmenachweis. Aktuelle Rechtsübergabe: Datenschutz bereits mit vorhandenen IONOS-Angaben fertiggestellt und veröffentlicht; nicht erneut von Supportauskunft oder GMX-Zugriff abhängig machen. Steuerhinweis im Impressum erhalten.

## Arbeitspakete und Chats

| Paket | Eigener Chat | Status | Abhängigkeit | Ergebnis / Abnahme |
| --- | --- | --- | --- | --- |
| AP01 Geschäftspostfach und Versandgrundlage | 01a175a3-f38f-72e0-a796-77af4618d0af | Live-Zugriff blockiert; Quellenvertrag geliefert | keine | Firefox automatisch abgelehnt; Postfach/SMTP/PHP/privater Pfad nicht bestätigt |
| AP02 Sicherer Anfrageversand | 01a175a6-b3e2-77e1-af0c-93e94b0d307a | lokal umgesetzt; Live-Voraussetzungen offen | produktive AP01-Konfiguration vor AP08 | PHP-API/PHPMailer-Lock, Schutzdaten, AP03-Vertrag, Backend-/HTTP-/Deploymenttests und Betriebsanleitung fertig; Apache-CI und Live-Mail offen |
| AP03 Projektfinder anschließen | ausstehend | wartet | AP02-Vertrag | Vorschau, ausdrücklicher Versand, Lade-/Erfolgs-/Fehlerzustände, Eingabenerhalt, Kopieren/Bearbeiten |
| AP04 Angebot und Geschäftsinhalte | ausstehend | bereit | unabhängig | Angebot auf Anfrage, bestätigte Leistungsbeschreibungen, Geschäftskontakt, Prototyptexte bereinigen |
| AP05 Datenschutz und Kontaktangaben | ausstehend | wartet | AP01–AP04 | Texte an tatsächlichen Versand und technische Schutzdaten anpassen; Betreiber-/Steuerangaben erhalten |
| AP06 Bedienung und technische Qualität | ausstehend | wartet | AP03/AP04 | responsive/tastaturbedienbare Besucherwege, Medien/Fallbacks, SEO/Sitemap/Fehlerseite, relevante Fehler beheben |
| AP07 Unabhängige Gesamtabnahme | ausstehend | wartet | AP02–AP06 | vollständiger Kandidat mit eindeutigem Commit; Fehler an Koordinator melden, nicht selbst verdeckt ändern |
| AP08 Veröffentlichung und Betriebsübergabe | ausstehend | wartet | bestandene AP07 + echte Betriebszugänge | dev/prod, Live- und Mail-Eingangsprüfung, Rückkehr zur Vorgängerversion, Betriebsdokumentation |

Bei einem Zugangsblocker unabhängige Arbeiten vorziehen; maximal ein Arbeitschat bearbeitet den lokalen Projektstand gleichzeitig. Ungelöste Voraussetzungen verhindern die vollständige Betriebsfreigabe, nicht die unabhängige Umsetzung.

## Technischer Vertrag

- Bestehender Vite/TypeScript-Auftritt plus `POST /api/inquiry.php` mit JSON. Vorhandene Finder-Angaben sowie eine Anfragekennung übertragen. AP02 legt den konkreten gemeinsamen Request-/Response-Vertrag dokumentiert fest, AP03 verwendet ihn unverändert.
- Erfolg ausschließlich bei bestätigter SMTP-Annahme. Ungültige Angaben, Missbrauchslimit und vorübergehende Versandprobleme unterscheiden. Keine vorgetäuschte Zustellung an das Postfach.
- Fest konfigurierte Empfänger-/Absenderadresse `lukas.wagner@webbyu.de`; validierte Besucheradresse nur Reply-To. Keine vom Client steuerbaren Empfänger, Header oder Mailvorlagen.
- PHPMailer mit Composer-Lock und verschlüsseltem authentifiziertem IONOS SMTP (dokumentierter Standard `smtp.ionos.de:465`, implizites TLS). Keine eigene SMTP-Implementierung.
- Geheimnisse getrennt vom öffentlichen Build und Repository; keine Zugangsdaten in Chat, Kommandoargumente, Logs oder hochgeladene Buildartefakte schreiben. Fehlende produktive Konfiguration führt zu einem ehrlichen temporären Fehler.
- Serverseitige Eingabe-/Größen-/Methoden-/Originprüfung, Honeypot, Rate-Limit und begrenzter Duplikatschutz. Projektinhalte werden nicht zusätzlich in einer neuen Datenbank gespeichert; technische Schutzdaten bleiben kurzlebig. Exakte tatsächliche Speicherfristen in AP02 dokumentieren und AP05 übernehmen.
- Keine Anhänge, automatischen Besucher-E-Mails, zusätzlichen externen Formulardienste oder automatischer erneuter Versand bei unklarem Ausgang/Timeout.
- Formularangaben bleiben im Fehlerfall erhalten. Kopieren und Bearbeiten bleiben möglich. Die Beispiele versenden weiterhin nichts.

## Verbindliche Abnahme

- Anfrage: vollständig, Pflichtfelder, ungültige E-Mail, Sonderzeichen, Manipulation, Größe, Doppelklick, Spam, Netzwerkfehler, SMTP-Fehler und unklarer Versandausgang.
- Bedienung: 360/390/768/1024/1440 Pixel, mobile Navigation, Tastatur/Fokus, Wechsel Reise/Demo/Finder, reduzierte Bewegung, fehlendes WebGL, Medienfehler.
- Veröffentlichung: Website-/Deployment-/Backendtests, Produktionsbuild, öffentliche Seiten und Assets, nicht öffentlich abrufbare Konfiguration, tatsächlich eingegangene gekennzeichnete Testanfrage an das eigene Geschäftspostfach.
- Keine Zusage einer rechtlichen Gesamtzertifizierung; vorhandene Rechtstexte werden an den belegten tatsächlichen Betrieb angepasst. Keine erneute breite Rechts-/Hostingrecherche ohne konkrete neue Änderung.

## Übergaben

Die Arbeitschats ergänzen hier pro Paket: Änderungen, lokale Prüfungen, tatsächliche Live-Prüfungen, Commit und offene Voraussetzungen. Status nur nach belegtem Ergebnis aktualisieren. Fehlende Inbox-/SMTP-/Serverprüfung stets ausdrücklich benennen.

### AP01 – Quellenvertrag, Live-Voraussetzungen offen

Chat `01a175a3-f38f-72e0-a796-77af4618d0af` hat ausschließlich lesend gearbeitet; keine Kontoänderungen oder neuen Zugangsdaten, kein eigener Commit. Die automatische Freigabeprüfung verweigerte Firefox mit „Computer Use was not approved to use Firefox“ ohne nähere Begründung. Kein Ausweichen auf andere private Kontozugriffe. Öffentlich belegt: `smtp.ionos.de:465`, implizites TLS, Anmeldung mit vollständiger Postfachadresse, aktive Zertifikats-/Hostnamenprüfung, kein unverschlüsselter Fallback.

Noch nicht bestätigt: Existenz/Status von `lukas.wagner@webbyu.de`, Empfang, authentifizierter Versand, Mail-DNS, aktive PHP-Version/-Funktionen, absoluter privater Konfigurationspfad und dessen PHP-Lesbarkeit. Keine dieser Prüfungen gilt als bestanden. AP02 darf mit Testtransport und ehrlichem Konfigurationsfehler unabhängig fortfahren. Bevorzugte Geheimnisablage außerhalb sämtlicher öffentlicher Domainziele im Webspace; Pfad niemals aus Requestdaten übernehmen. Fehlende Anmeldung/Secret-Eingabe und Live-Nachweise sind spätestens vor AP08 nachzuholen.

### AP02 – Anfrage-Backend lokal umgesetzt

Chat `01a175a6-b3e2-77e1-af0c-93e94b0d307a`. Lokaler Paketcommit mit Titel `feat: add protected IONOS inquiry backend` (Hash im Chatabschluss; diese Übergabe gehört zum selben Commit). Keine Veröffentlichung, kein Push, kein Branchwechsel oder Unteragent. Fremde Ausgangsänderungen erhalten und nicht gestaged; die kleine AP01-Koordinationsänderung in diesem Dokument wurde ausdrücklich zur Mitnahme autorisiert.

- `POST /api/inquiry.php`: JSON mit vorhandenen `BriefState`-Feldern plus UUID-v4-`requestId` und leerem Honeypot `website`. Verbindliche gemeinsame Typen: [src/inquiry-contract.ts](src/inquiry-contract.ts), vollständige HTTP-/Feldregeln und AP03-Verhalten in [backend/README.md](backend/README.md). 200 `success` nur nach SMTP-DATA-Annahme bzw. belegtem früherem Erfolg; `invalid`, `rate_limit`, `temporary` mit `not_sent`/`unknown` getrennt. Bei Netzwerk-/Timeoutfehler keine automatischen Wiederholungen; Kennung für unveränderte Angaben behalten.
- Composer-Lock mit PHPMailer 7.1.1; authentifiziertes `smtp.ionos.de:465` mit implizitem TLS, aktiver Zertifikatsprüfung, festen From/Envelope/To-Adressen `lukas.wagner@webbyu.de`, Besucher nur Reply-To. Plaintext, keine clientgesteuerten Header/Empfänger, Anhänge oder Automails.
- Methode, genauer Origin/Host, Inhaltstyp, Payload bis 32 KiB, Pflichtfelder/Enums/Längen und Steuerzeichen geprüft. Honeypot, rollende Limits (5/IP, 3/E-Mail, 30 insgesamt je Stunde), gemeinsame Dateisperre bis SMTP-Abschluss und 24-Stunden-Duplikatsperre. Unklarer/unterbrochener Status bleibt gesperrt. Schutzbestand ohne Projektinhalte oder Klartext-IP/E-Mail; HMAC-Daten, UUID, Status und Zeiten serverprivat.
- Konfiguration und Zustand außerhalb sämtlicher Domainziele; Standard als privates Geschwisterverzeichnis des Webroots, optional nur serverseitig über `WEBBYU_INQUIRY_CONFIG`. Fehlende Konfiguration liefert ehrlich 503. Keine produktiven Zugangsdaten gelesen, erzeugt, gespeichert oder ausgegeben. Keine eigenen Anfrage-/SMTP-/Fehlerlogs; Hostinglogs bleiben nach tatsächlichem IONOS-Befund zu beurteilen.
- AP05: wirksame TTL 1 Stunde für Limits, 24 Stunden für Duplikate; Entfernung beim nächsten gültigen API-/Health-/CLI-Zugriff. CLI-Cleanup alle 15 Minuten vorgesehen, **noch nicht live eingerichtet**. Erst mit Nachweis betragen physische Höchstfristen 1 h 15 min bzw. 24 h 15 min. Ohne weiteren Zugriff/Cleanup keine garantierte physische Löschfrist; Mailbox-Aufbewahrung separat. Details und tatsächliche Loggrenzen stehen in der Backend-Anleitung.
- Auslieferung erweitert: geschützte versionierte PHP-/Composer-Abhängigkeiten in `dist`, keine private Konfiguration/Backendtests im Artefakt. SFTP veröffentlicht Schutzregeln vor Quellen und vollständige Abhängigkeiten vor API. Dev-/IONOS-Workflows prüfen PHP/Composer und das Apache/PHP-Produktionspaket. Öffentliche Nachprüfung erkennt fehlenden PHP-Handler, falschen Release, fehlende Readiness oder offene Schutzpfade und sendet dabei keine gültige Anfrage.

**Lokal bestanden:** 146 PHP-Prüfungen einschließlich echter PHPMailer-MIME-/SMTP-Ablaufprüfung mit Testtransport, Sperrprüfung mit zwei unabhängigen PHP-Prozessen, HTTP-Prüfungen mit temporärem PHP 8.4.27 und zusätzlich aus dem fertigen Produktionspaket (Ready mit künstlicher Konfiguration, danach ehrlicher 503 ohne Konfiguration), 124 Website-Tests, neun Deployment-Tests, TypeScript und Produktionsbuild. Composer-Validierung/Plattformprüfung, Lockinstallation im Produktionsmodus und Sicherheitsabfrage ohne gemeldete Advisories bestanden; Workflow-YAML syntaktisch geprüft. PHP/Composer temporär aus offiziellen Quellen mit Prüfsummenabgleich in ignorierten lokalen Werkzeugdateien eingerichtet. Bekannte Schriftpfad-/3D-Chunk-Warnungen bestehen fort.

**Nicht durchgeführt/offen:** lokaler Docker-Dienst läuft nicht; die echte Apache-Integration ist für beide CI-Workflows vorbereitet, aber noch nicht gelaufen. Keine neue Konto-, Server-, SMTP- oder Inboxprüfung. AP08 benötigt das tatsächlich eingerichtete Geschäftspostfach samt direkt privat hinterlegtem Passwort, HMAC-Schlüssel, absoluten privaten Pfaden/Rechten, bestätigtem PHP/OpenSSL/Apache-/`open_basedir`-Betrieb, funktionierendem Cleanup sowie bestandener CI-/AP07-Abnahme. Danach einmalig gekennzeichnete eigene Testanfrage und tatsächlichen Geschäftspostfach-Eingang mit Reply-To nachweisen. [Konkrete Betriebs- und Rückkehrschritte](backend/README.md) einschließlich Warnung, dass ein alter statischer Build neue API-Dateien nicht automatisch entfernt.
