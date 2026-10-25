# Webbyu – Vorbereitung der Rechtstexte

Stand: 25.10.2026. Rechtsform vom Betreiber bestätigt: Einzelunternehmen.

## Bearbeitungsstand

Die kostenlosen eRecht24-Generatoren für Impressum und Datenschutzerklärung wurden mit der Mustertext-Funktion durchlaufen. Der Betreiber hat die Haftungsausschlüsse sowie die kostenlose Anforderung mit Zugang und Rechts-Updates/Angebots-E-Mails ausdrücklich freigegeben.

- **Impressum:** Originaltext vom Betreiber aus dem eRecht24-Download geliefert. Als statische Unterseite `impressum/index.html` mit markierten Datenfeldern eingebaut. Name, Anschrift, Telefon, E-Mail und gegebenenfalls USt-ID sind nachzupflegen; Musterpersonen und Musterkontaktdaten werden nicht als tatsächliche Angaben ausgegeben. Der Quellenlink bleibt erhalten.
- **Datenschutz:** Originaltext vom Betreiber aus dem eRecht24-Download geliefert. Unveränderte Lieferdatei unter `rechtliches/datenschutz-erecht24-original.txt` gesichert. Statische Unterseite `datenschutz/index.html` enthält alle drei Hauptabschnitte, den Quellenlink und markierte Betreiberfelder. PDF-Seitenzahlen und Begleittexte entfernt, über Seitenumbrüche getrennte Absätze verbunden und erkennbare Umbruchfehler wie „ITSysteme“ korrigiert.
- **Einbindung:** Beide Rechtstexte umgesetzt, von Startseite und Reise verlinkt und untereinander erreichbar. Alte Startseitenanker `#impressum` und `#datenschutz` bleiben erreichbar. Der Projektfinder verlinkt die Datenschutzerklärung bei den Eingabefeldern. Beide Rechtstexte sind ohne JavaScript lesbar; Startseite und Reise enthalten auch ohne JavaScript die rechtlichen Links. Am 25.10.2026 als Entwürfe auf ausdrücklichen Auftrag gepusht und über GitHub Pages veröffentlicht; beide Unterseiten anschließend mit HTTP 200 bestätigt.
- **Daten nachpflegen:** In `impressum/index.html` alle Felder in eckigen Klammern ersetzen. Ohne zugeteilte USt-ID den gesamten entsprechend kommentierten Abschnitt entfernen. Fax und Adresszusatz nur ergänzen, falls zutreffend. Die Aussage zur Verbraucherschlichtung bestätigen. Weitere tatsächlich zutreffende Unternehmensangaben anhand der obigen Liste prüfen. Erst danach Entwurfshinweis und das nur auf dieser Unterseite gesetzte `noindex` entfernen; keine automatische Freigabe allein durch Dateneingabe.
- **Datenschutz nachpflegen:** Betreibername, Anschrift, Telefon und E-Mail in `datenschutz/index.html` mit dem Impressum abgleichen. Im Liefertext fehlt ein konkreter Hosting-Abschnitt. Anbieter und Anschrift, Speicherfristen, tatsächliche Protokolldaten, Empfänger, gegebenenfalls Drittlandübermittlung und Vertragsgrundlage im Generator abgleichen und den passenden Hosting-Abschnitt ergänzen. Dafür wurde ein sichtbarer Platzhalter im Entwurfshinweis gesetzt; keine erfundene Anbieter- oder Vertragsangabe eingefügt. Entwurfshinweis und `noindex` erst nach Vervollständigung und Freigabe entfernen.
- **Technische Ergänzung:** Abschnitt 4 beschreibt Projektfinder, Demo-Eingaben, die ausdrücklich ausgelöste Zwischenablagefunktion sowie lokal ausgelieferte Medien. Diese Ergänzung ist im HTML vom Generator-Original abgegrenzt. Die allgemeinen, bedingten Formulierungen des Generator-Originals zu Kontaktformularen und Analyse bleiben erhalten; Abschnitt 4 erklärt die tatsächlich implementierten lokalen Abläufe ohne Tracking oder Versand.

[Gespeichertes eRecht24-Datenschutzprojekt öffnen](https://app.e-recht24.de/tools/projekt-manager-fuer-webseiten#view=ec6300f2-ee91-4dde-b389-b6cc5dcac24a)

**Nutzerentscheidung vom 25.10.2026:** API-Anbindung vorerst zurückstellen, da der aktuelle kostenlose eRecht24-Tarif sie nicht freischaltet. Automatisierter Abruf ist für die nahe Zukunft gewünscht; kein konkreter Termin vereinbart. Kein kostenpflichtiges Upgrade und keine laufende Automatisierung beauftragt. Beide Originaltexte sind mittlerweile manuell geliefert und lokal eingebaut. Die private Anforderungsadresse wird nicht automatisch als öffentlicher Geschäftskontakt verwendet.

## Datenschutz-Download und Cookie-Banner

**Hosting-Entscheidung vom 25.10.2026:** Der Betreiber möchte die Produktion auf seinem bestehenden IONOS Webhosting Plus unter webbyu.de betreiben. Die technische Vorbereitung ist in `DEPLOYMENT.md` beschrieben; die IONOS-Verbindung und Domainzuordnung sind noch nicht abgeschlossen. Im Vertrag ist ein IONOS CDN powered by Cloudflare enthalten. Ob es für webbyu.de aktiv ist, wurde nicht bestätigt. Bei tatsächlicher Nutzung sind auch dieser Dienst und seine Datenverarbeitung im Rechtstext zu berücksichtigen. Die bisherige GitHub-Pages-Darstellung beschreibt bis zur Umstellung die Vorschau. Ein IONOS-Abmahnschutz wurde nur besprochen, nicht beauftragt; keine automatische Rechtstext-Anbindung eingerichtet.

Im oben verlinkten Datenschutzprojekt unter „Tools & Rechtstexte“ in der Kachel „Datenschutzerklärung für Webseite“ auf „PDF“ klicken. Der Impressum-Durchlauf ist getrennt; deshalb kann die Impressum-Projektansicht ohne gespeicherten Datenschutztext erscheinen.

Die erneute Quellcodeprüfung findet keine Cookies, localStorage/sessionStorage oder Analyse-/Werbedienste. Das Reise-iframe lädt die eigene Unterseite; die Animation lädt eigene Bilddateien. Für diesen geprüften Stand ist kein Anlass für ein Einwilligungsbanner erkennbar. Das ist keine Prüfung des tatsächlichen Live-Hostings. Vor dem Start Hosting-Antworten und Netzwerkverkehr kontrollieren. Bei späteren einwilligungsbedürftigen Technologien muss deren Aktivierung bis zur wirksamen Einwilligung blockiert werden. Kein dekoratives Banner ohne entsprechende Funktionen eingebaut.

Unabhängig davon bleibt eine vollständige Datenschutzerklärung nötig, einschließlich des tatsächlichen Hostings und der Verarbeitung beim Projektfinder. [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) regelt Speicherung/Zugriff am Endgerät und die Ausnahme für unbedingt erforderliche Vorgänge.

## Geplante API-Automatisierung

Im zentralen Tracker als **IDEE-07** erfasst. Bei Wiederaufnahme zunächst Tarif und API-Voraussetzungen erneut prüfen.

- Voraussetzung: geeigneter eRecht24-Tarif, fertige und dem richtigen Projekt zugeordnete Texte sowie Projekt-API-Schlüssel. Für eine eigene Anbindung verlangt die offizielle Dokumentation außerdem einen verifizierten Entwicklerschlüssel und besondere API-Nutzungsbedingungen.
- Geplanter Ablauf: Impressum und Datenschutzerklärung während des Website-Builds abrufen und als getrennte statische HTML-Seiten ausgeben. Besucher müssen keine Verbindung zur eRecht24-API aufbauen.
- Schlüssel ausschließlich als geschützte Zugangsdaten im Build hinterlegen; weder im Browsercode noch im Repository veröffentlichen.
- Fehlerfall: Keine leeren oder unvollständigen Texte veröffentlichen. Bei fehlgeschlagenem Abruf die Veröffentlichung stoppen und die zuletzt veröffentlichte Website bestehen lassen.
- Vor Veröffentlichung auf leere Texte und verbliebene Musterangaben prüfen. Änderungen an Hosting, Kontaktweg oder sonstigen Diensten weiterhin im eRecht24-Projekt nachpflegen; der Abruf allein erfasst solche Änderungen nicht automatisch.
- Offen: Abruf nur bei Website-Änderungen oder zusätzlich regelmäßig; Benachrichtigung bei Fehlern und Textänderungen. Noch keinen Zeitplan, Hintergrundauftrag oder automatisches Veröffentlichen eingerichtet.

[Offizielle API-Dokumentation](https://api-docs.e-recht24.de/). Die kostenpflichtige Voraussetzung wurde am 25.10.2026 zusätzlich im API-Dialog des kostenlosen Kontos angezeigt.

## Später zu ergänzende Betreiberangaben

- Vollständiger Vor- und Nachname des Einzelunternehmers; Geschäftsbezeichnung Webbyu.
- Ladungsfähige Geschäftsanschrift einschließlich Straße, Hausnummer, Postleitzahl und Ort.
- Geschäftliche E-Mail-Adresse und Telefonnummer. Die für den Generator genannte E-Mail-Adresse wird nicht automatisch als öffentlicher Kontakt übernommen.
- Umsatzsteuer-ID und Wirtschafts-ID, soweit zugeteilt; keine persönliche Steuernummer veröffentlichen.
- Registergericht und Registernummer nur bei tatsächlicher Eintragung.
- Berufshaftpflichtversicherung, falls vorhanden: Versicherer, Anschrift und räumlicher Geltungsbereich.
- Tatsächliche Entscheidung zur Teilnahme an Verbraucherschlichtung; Generator-Voreinstellung ist Nichtteilnahme und muss vor Veröffentlichung bestätigt werden.

## Technischer Befund am Quellcode

- Statische Vite-Website; GitHub-Pages-Veröffentlichung in `.github/workflows/deploy-pages.yml` vorbereitet.
- Keine Analyse- oder Werbeskripte im geprüften Anwendungscode gefunden.
- Schriften, Bilder und Safran-Animation werden lokal bereitgestellt.
- Kein Zugriff auf Cookies, localStorage oder sessionStorage im geprüften Anwendungscode gefunden.
- Projektfinder und Konzeptdemos halten Eingaben im Arbeitsspeicher. Kein Versand, keine echte Bestellung, Buchung, Registrierung oder Zahlung.
- Der Kopierknopf des Projektfinders schreibt die Zusammenfassung nach Betätigung in die Zwischenablage.
- Kein externer Karten-, Video-, Newsletter-, Chatbot- oder Zahlungsdienst eingebunden.

Dies ist eine Quellcodeprüfung, kein vollständiger Netzwerktest des späteren Live-Hostings.

## Einstellungen im eRecht24-Datenschutz-Generator

- Einzelunternehmer, eigene Unternehmenswebsite; kein echter Online-Shop.
- Allgemeine Pflichtinformationen und Musterdaten für die verantwortliche Stelle.
- Sonstiger Hosting-Anbieter mit deutlich gekennzeichnetem Platzhalter für Name und Anschrift. Endgültigen Produktionshost vor Veröffentlichung bestätigen.
- Kein bestehender Auftragsverarbeitungsvertrag behauptet.
- SSL/TLS für die vorgesehene HTTPS-Veröffentlichung ausgewählt.
- Unter 20 regelmäßig personenbezogene Daten verarbeitende Mitarbeiter auf Basis des dokumentierten einzelnen Gründers; kein Datenschutzbeauftragter angegeben. Bei abweichenden tatsächlichen Verhältnissen neu auswählen.
- Server-Log-Files für die vorbereitete GitHub-Pages-Veröffentlichung ausgewählt: GitHub dokumentiert die Speicherung der Besucher-IP zu Sicherheitszwecken. Konkrete Datentypen und Speicherfristen des späteren Hosts abgleichen.
- Cookies, Tracking, soziale Plugins, Newsletter, externe Medien, Shops, Zahlungen, Konferenzen und weitere nicht belegte Dienste nicht ausgewählt.
- Kein Kontaktformularversand und kein direkter Kontaktpassus behauptet. Nach Ergänzung öffentlicher E-Mail/Telefonnummer und Einrichtung des tatsächlichen Anfragewegs erneut prüfen und passenden Kontaktpassus ergänzen.

## Einbindung und verbleibende Freigabe

1. Erledigt: Beide Originaltexte vom Betreiber erhalten und Quellenangaben in den Unterseiten beibehalten.
2. Alle Musterangaben ersetzen oder nicht zutreffende optionale Abschnitte entfernen. Nicht nur Name und Anschrift, auch Hosting und tatsächliche Abläufe bestätigen.
3. Erledigt: Getrennte HTML-Unterseiten von Startseite und Reise unmittelbar verlinkt; bestehende Ankeradressen führen zu Hinweisen mit Direktlinks.
4. Erledigt: Technischen Zusatz zu lokalem Projektfinder, Demo-Eingaben und Zwischenablage als eigenen Abschnitt eingebaut und im HTML als Ergänzung gekennzeichnet.
5. Erledigt: Produktionsbuild sowie Links und Assets für den GitHub-Pages-Pfad `/Webbyu/` geprüft. Beide Rechtstexte enthalten keine Skripte. Die visuelle Browserprüfung und Prüfung des Live-Hostings bleiben offen.

Die Preis- und Steuerentwürfe sowie der fehlende echte Kontaktweg bleiben eigenständige offene Punkte der Veröffentlichung. Die vorbereiteten Generatoren bestätigen keine vollständige rechtliche Freigabe der Website.

## Prüfung des Impressum-Einbaus

TypeScript-Prüfung und Produktionsbuild erfolgreich. Die vorhandenen Tests für Startseitenstruktur, Integration und Reise laufen durch (27 Tests). Die gebaute Impressum-Datei enthält die Überschrift und den Quellenlink, ersetzt den Basispfad und benötigt kein JavaScript. Eine visuelle Browserprüfung war wegen der gesperrten lokalen Verbindung nicht möglich. Vorhandene Build-Warnungen zu Schriftpfaden und Chunkgröße bestehen weiterhin.

## Abschlussprüfung beider Rechtstexte · 25.10.2026

Der Betreiber hat den Push nach Integration ausdrücklich beauftragt. Die Entwurfskennzeichnung bleibt dabei bestehen; der Push ist keine rechtliche Freigabe.

- TypeScript-Prüfung erfolgreich; alle 113 Tests in 13 Testdateien bestanden.
- Produktionsbuild sowohl mit lokalem Basispfad als auch mit den GitHub-Pages-Einstellungen `Koulner/Webbyu` erfolgreich.
- In allen vier gebauten HTML-Einstiegen lokale Links, Sprungziele und verknüpfte Assets auf vorhandene Dateien geprüft. Der Pages-Build verwendet durchgehend `/Webbyu/`; keine nicht ersetzten Basispfad-Platzhalter.
- Impressum und Datenschutz enthalten je eine Hauptüberschrift, sichtbare Entwurfshinweise und `noindex`, jedoch keine Skripte. Die Beispieldaten des gelieferten Datenschutztexts werden nicht als Betreiberangaben ausgegeben.
- Visuelle Browserprüfung wegen Zeitüberschreitung beim Zugriff auf die lokale Vorschau weiterhin nicht möglich. Bestehende Build-Warnungen zu Schriftpfaden und Chunkgröße bleiben unverändert.

## Quellen und Nachweise

- [eRecht24 Impressum-Generator](https://www.e-recht24.de/impressum-generator.html)
- [eRecht24 Datenschutz-Generator](https://www.e-recht24.de/muster-datenschutzerklaerung.html)
- [GitHub Pages: Datenerhebung beim Besuch](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)

Browser-Nachweise liegen lokal unter `artifacts/legal/` und werden nicht mit veröffentlicht.
