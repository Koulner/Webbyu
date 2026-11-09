# AP05 – Datenschutz für den Anfrageversand

Stand: 26.10.2026. Arbeitschat `01a175d2-1ec5-7ec3-8625-4677a1eba846`, lokaler Ausgangscommit `f23e69eabc5a644ac8f2bfde7610ebc6584b18aa` auf `dev`. Diese Ergänzung dokumentiert den implementierten AP02-/AP03-Datenfluss und die dazu angepassten Besuchertexte. Sie ist keine rechtliche Gesamtzertifizierung und kein produktiver Betriebsnachweis.

## Maßgeblicher Bestand

Die neuesten Abschlüsse oben in [CHAT-UEBERGABE-IONOS.md](CHAT-UEBERGABE-IONOS.md) und [RECHTLICHES.md](../RECHTLICHES.md) gelten weiter. IONOS-Hosting, WebAnalytics, AVV, ungenutztes CDN und veröffentlichte Anbieterfristen werden durch AP05 weder neu bewertet noch von Supportauskunft oder GMX-Zugriff abhängig gemacht. Die älteren Prüfvorbehalte darunter sind historisch.

Die fremden Änderungen an `RECHTLICHES.md`, `WORK_PACKAGES.md` und den weiteren in [GO_LIVE.md](../GO_LIVE.md) genannten Dateien bleiben erhalten und außerhalb dieses Commits. Das gelieferte [Generator-Original](datenschutz-erecht24-original.txt) und beide öffentlichen eRecht24-Quellenangaben bleiben unverändert. Betreiber, Geschäftsanschrift, Telefon und bestehender Steuerhinweis im Impressum bleiben erhalten. Nur die öffentliche Geschäftsadresse wird dort und im Datenschutz auf `lukas.wagner@webbyu.de` umgestellt. Keine Generator-API, kein zusätzlicher Dienst und kein Kontozugriff.

## Datenfluss und Speichergrenzen

Verbindlicher technischer Beleg: [Backend-Vertrag und Betrieb](../backend/README.md), [Request-/Response-Typen](../src/inquiry-contract.ts), [Finder](../src/finder.ts), [StateStore](../backend/src/StateStore.php), [Anwendung](../backend/src/Application.php) und [IONOS-Transport](../backend/src/IonosTransport.php).

| Bestand | Tatsächlicher Ablauf und Zweck | Frist und Grenze |
| --- | --- | --- |
| Finder vor dem Versand | Eingaben, Vorschau, Kennungen und Status im Speicher der geöffneten Seite; Bearbeiten, Navigation und Kopieren senden nichts | Neuladen verwirft den Seitenzustand. Kein Cookie oder dauerhafter Browserspeicher für diese Angaben. Die bestehende Datenschutzauswahl ist davon getrennt. |
| Ausdrücklich versendete Anfrage | Projektziel, Erweiterungen, Ausgangssituation, Zeitrahmen, Paketwunsch, optionale Beschreibung, Name, E-Mail und UUID per HTTPS an die eigene API; danach verschlüsseltes authentifiziertes IONOS-SMTP an das eigene Geschäftspostfach | Fester Absender und Empfänger `lukas.wagner@webbyu.de`, validierte Besucheradresse nur Reply-To. SMTP-Annahme ist der Erfolgsnachweis. Keine Besucher-Automails, Anhänge oder zusätzliche Projektdatenbank. |
| Technische Ratenbegrenzung | HMAC-SHA256 der direkten Verbindungs-IP und normalisierten E-Mail; Versuchzeitpunkte einschließlich globaler Zeitpunkte | Rollendes Fenster von 3.600 Sekunden. Alte Zeitpunkte und anschließend ungenutzte Schlüssel werden beim nächsten erfolgreichen Zugriff auf den Schutzbestand entfernt. |
| Technischer Duplikatschutz | Anfrage-UUID, HMAC des normalisierten Inhalts, Status `pending`/`accepted`, Ablaufzeit; auch Anfrage-ID-Schlüssel als HMAC | 86.400 Sekunden. Auch unklarer/unterbrochener Status sperrt Wiederholungen. Entfernung abgelaufener Einträge beim nächsten erfolgreichen Zugriff auf den Schutzbestand. |
| Schutzdatei insgesamt | Privat außerhalb öffentlicher Domainziele; pseudonymisierte personenbezogene Daten, keine Anonymitätsbehauptung | Keine Klartext-IP/-E-Mail, Namen, Projektbeschreibung oder Mailinhalte. Keine eigenen Anfrage-/SMTP-/Fehlerlogs; externe Hostinglogs bleiben nach dem bisherigen IONOS-Befund zu beurteilen. Kein zusätzlicher Tracking-Cookie. |
| Geschäftspostfach | Bearbeitung, Antwort, Vorbereitung und Durchführung einer möglichen Geschäftsbeziehung | Zweckgebundene Aufbewahrung; danach Löschung, soweit kein rechtlich zulässiger Grund oder eine anwendbare gesetzliche Pflicht fortbesteht. **Nicht** die 24-Stunden-Frist des technischen Schutzbestands. Keine individuelle automatische Lösch-, Sicherungs- oder Archivierungskonfiguration behauptet. |
| Vier Konzeptdemos | Lokale Simulationen ohne echten Anfrage-, Bestell-, Buchungs- oder Zahlungsversand | Eingaben und Zustand in der geöffneten Website, beim Neuladen verworfen. Unverändert. |

Physische Löschung ist von der logischen Wirksamkeit der Stunden-/Tagesfenster zu unterscheiden. `StateStore` bereinigt bei erfolgreichem Öffnen durch gültige Anfrage-API-Aufrufe, `GET /api/health.php` oder den CLI-Cleanup. Fehlgeschlagene, abgewiesene oder gesperrte Zugriffe sind kein Löschbeleg. Ohne weiteren erfolgreichen Zugriff bleiben abgelaufene Einträge liegen.

## Eng begrenzte rechtliche Einordnung

Anfragebearbeitung: Art. 6 Abs. 1 lit. b DSGVO bei Vertragsbezug, sonst lit. f. Schutzdaten: lit. f für Missbrauchsabwehr und begrenzten Duplikatschutz. Aufbewahrungspflichtige Korrespondenz: lit. c; erforderliche Rechtsverfolgung: lit. f. Das Formular verlangt keine zusätzliche Einwilligung.

Abwägung für Schutzdaten: Versandlimit und Duplikaterkennung schützen Verfügbarkeit und verhindern unbeabsichtigte Mehrfachnachrichten. Originprüfung und Honeypot allein leisten dies nicht. Ein eigener HMAC-Bestand mit Stunden-/Tagesfenstern begrenzt den Eingriff gegenüber Klartextprotokollen. Keine Profilbildung oder Werbenutzung. Gegeninteressen sind Zuordenbarkeit über Kennungen und mögliche Ablehnung legitimer Wiederholungen; Vorschau, sichtbare Statusmeldungen, Kopieren, direkter Kontakt und Widerspruchshinweis bleiben verfügbar. Die Begrenzung setzt nachgewiesene Bereinigung und privaten Betrieb voraus.

Aktuelle primäre Quellen, am 26.10.2026 gezielt abgeglichen:

- [DSGVO bei EUR-Lex](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679), Art. 4 Nr. 5, Art. 5, 6, 13 und 21. Abrufbare amtliche Suchauszüge stützen Zweck-/Speicherbegrenzung, Rechtsgrundlagen und Informationspflichten; der direkte HTML-Abruf verlangte teilweise eine JavaScript-Prüfung. Keine daraus erfundene individuelle Speicherfrist.
- [IONOS: Serverinformationen für IMAP, POP3 und SMTP](https://www.ionos.de/hilfe/e-mail/allgemeine-themen/serverinformationen-fuer-imap-pop3-und-smtp/): `smtp.ionos.de:465`, SSL/TLS, vollständige Postfachadresse zur Anmeldung. Dies bestätigt den Anbieterstandard, nicht Existenz oder Betriebsbereitschaft dieses Postfachs.

Die vorhandenen Hosting-/AVV-/WebAnalytics-Quellen und deren bestehende Einordnung bleiben maßgeblich. Keine erneute breite Hostingrecherche.

## Verbindliche Betriebsgrenze für AP08

**Der vorgesehene 15-Minuten-Cleanup ist noch nicht produktiv eingerichtet oder verifiziert. AP05 erteilt keine Betriebsfreigabe.** In den öffentlichen Texten steht deshalb kein Versprechen einer maximalen physischen Löschfrist. Auch eine erfolgreiche lokale TTL-Prüfung ersetzt den Zeitplannachweis nicht.

Vor der gemeinsamen Veröffentlichung sind nach [GO_LIVE.md](../GO_LIVE.md) und [Backend-Anleitung](../backend/README.md) zu belegen:

1. Private Konfiguration und Schutzdatei außerhalb sämtlicher Domainziele, passende Rechte, funktionierender HMAC-Schlüssel und gemeinsame Dateisperre. Schutzdatei aus eigenen Backups ausschließen; keine Requestbodys in Debuglogs aktivieren.
2. Den 15-Minuten-Cleanup mit tatsächlichem CLI-PHP und aktuellem Releasepfad einrichten; erfolgreiche Ausführung, Ausfallkontrolle und Entfernung abgelaufener künstlicher Einträge nachweisen. Keine produktive Zustandsdatei für einen Test löschen oder zurücksetzen. Erst dann können nach belegtem Intervall physische Obergrenzen abgeleitet und die entsprechenden Besuchertexte aktualisiert werden.
3. Geschäftspostfach, Empfang, SMTP/TLS, PHP/Apache und private Pfade sowie Apache-CI nachweisen; Aufbewahrung und Löschablauf der Geschäftskorrespondenz gesondert betrieblich festlegen. Keine Postfach-/Archivierungsfunktion als aktiviert voraussetzen. Abgeschlossene IONOS-Hosting-/AVV-/CDN-Prüfungen dadurch nicht wieder eröffnen.
4. AP06-Browserprüfung und AP07-Gesamtabnahme des vollständigen Kandidaten; AP08 anschließend mit gekennzeichneter eigener Testanfrage und tatsächlich geprüftem Postfacheingang samt Reply-To. Keine automatische Wiederholung bei unklarem Ausgang.

Lokale Prüfungen, Commit und weitere Übergabe stehen im AP05-Abschnitt von [GO_LIVE.md](../GO_LIVE.md). Keine Konto-/Live-Mail-/Serverprüfung, kein Push oder Deploy in AP05.
