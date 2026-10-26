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
| AP01 Geschäftspostfach und Versandgrundlage | ausstehend | bereit | keine | Postfach, Empfang, SMTP, PHP und sichere Konfiguration prüfen/einrichten; fehlende Anmeldung oder Secrets konkret benennen |
| AP02 Sicherer Anfrageversand | ausstehend | wartet | AP01-Konfiguration; mit Testtransport unabhängig umsetzbar | PHP-API, Validierung, Spam-/Duplikatschutz, Composer/PHPMailer, Backendtests, Deployment-Erweiterung |
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
