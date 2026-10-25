# Webbyu auf IONOS Webhosting Plus

## Ziel und aktueller Stand

- `dev` veröffentlicht ausschließlich die GitHub-Pages-Vorschau. Alle vier HTML-Seiten erhalten in diesem Build `noindex`. Die Vorschau ist trotzdem öffentlich erreichbar; vertrauliche Inhalte gehören dort nicht hinein.
- `prod` veröffentlicht ausschließlich bei IONOS. Tests und Build müssen erfolgreich sein, bevor das separate Deployment mit Zugangsdaten beginnt. Ein Push auf `main` veröffentlicht nichts mehr, sobald der neue Workflow dort ebenfalls übernommen wurde. Alte Branch-Versionen behalten ihre alten Workflows, bis sie aktualisiert werden.
- GitHub bleibt die Codeverwaltung. Bei IONOS landen nur die gebauten Dateien aus `dist`, einschließlich der IONOS-spezifischen `.htaccess` und einer Versionsdatei.
- Die Verbindung ist noch nicht eingerichtet. Keine Zugangsdaten wurden angefordert oder gespeichert; sie werden ausschließlich vom Betreiber direkt bei GitHub hinterlegt. Kein Zugriff auf das IONOS-Konto, keine DNS- oder CDN-Änderung und keine Übertragung nach IONOS erfolgt durch das bloße Hinzufügen dieser Dateien.
- Der Screenshot bestätigt Webhosting Plus und die Domains `webbyu.de` und `utilicious.com`. Für Webbyu wird ein eigenes Verzeichnis verwendet. Der Screenshot belegt nicht, dass das enthaltene Cloudflare-CDN für eine bestimmte Domain bereits aktiv ist.

## Einmalig selbst bei IONOS einrichten

1. Unter **Hosting → Webspace** ein eigenes, zunächst leeres Verzeichnis für Webbyu anlegen, zum Beispiel `/webbyu`. Nicht das Verzeichnis von `utilicious.com` verwenden. Falls dort bereits eine Website liegt, vorher deren Dateien sichern. Gleichnamige Dateien des Builds werden beim Deployment ersetzt.
2. Unter **Hosting → SFTP & SSH → Verwalten** einen geeigneten SFTP-Zugang auswählen oder anlegen. Die Verbindung läuft über SFTP auf Port 22; ein SSH-Shellzugang ist für die Veröffentlichung nicht erforderlich. Host, Benutzername und Passwort ausschließlich selbst verwenden.
3. Als Zielpfad wird das Verzeichnis benötigt, das dieser SFTP-Benutzer sieht. Bei einem Benutzer mit Zugriff auf den ganzen Webspace wäre das beispielsweise `/webbyu`. Ein auf `/webbyu` eingeschränkter Zugang sieht unter Umständen nur `/`; dann innerhalb dieses Zugangs einen Unterordner wie `/live` anlegen und die Domain auf dessen tatsächlichen Webspace-Pfad zeigen lassen. Das Skript verweigert `/` und Pfade mit `..`, damit nicht versehentlich der gemeinsame Webspace als Ziel dient.
4. Unter **Domains & SSL → webbyu.de → Verwendungsart anpassen → Mit Webspace verbinden** später genau das Produktionsverzeichnis zuweisen. Die erste Übertragung kann vor dieser Umschaltung stattfinden. HTTPS/SSL für die verwendete Domain aktivieren bzw. prüfen. Die Bestätigung der veröffentlichten Website gelingt erst nach passender Domainzuordnung und gültigem Zertifikat.
5. Das enthaltene Cloudflare-CDN nicht automatisch aktivieren. Falls es schon aktiv ist, seinen tatsächlichen Einsatz im Datenschutztext berücksichtigen und die Cache-Aktualisierung nach dem ersten Deployment prüfen. Es wird von diesem Workflow weder ein- noch ausgeschaltet.

Offizielle Anleitungen: [SFTP-Verbindungsdaten](https://www.ionos.de/hilfe/hosting/ftp-zugaenge-einrichten-und-verwalten/anmeldedaten-fuer-ihr-ftpsftp-programm/), [Domain mit Verzeichnis verbinden](https://www.ionos.de/hilfe/domains/mit-webspace-verbinden/domain-mit-einem-webspace-verzeichnis-verbinden/), [IONOS CDN](https://www.ionos.de/hilfe/hosting/content-delivery-network-cdn/cdn-im-ionos-kundenkonto-aktivieren/).

## Zugangsdaten selbst bei GitHub hinterlegen

Im Repository **Settings → Environments → New environment** das Environment **`ionos-production`** anlegen. Dort unter **Environment secrets → Add environment secret** diese vier Werte eintragen:

| Name | Wert, den nur der Betreiber einträgt |
| --- | --- |
| `IONOS_SFTP_HOST` | Serveradresse aus IONOS, ohne `sftp://` und ohne Pfad |
| `IONOS_SFTP_USER` | SFTP-Benutzername |
| `IONOS_SFTP_PASSWORD` | Passwort dieses SFTP-Zugangs |
| `IONOS_REMOTE_DIR` | Bereits vorhandenes, eigenes Zielverzeichnis aus Sicht des SFTP-Benutzers, z. B. `/webbyu` |

Die Werte gehören weder in den Chat noch in Dateien oder Commits. Die Skripte geben rohe SFTP-Ausgaben mit Kontodaten nicht aus. Der Deployment-Job erhält die Secrets; der Build-Job benötigt keine IONOS-Zugangsdaten.

Das Skript prüft den ED25519-Hostschlüssel vor der Anmeldung gegen den am 25.10.2026 von IONOS veröffentlichten Fingerabdruck. Ein abweichender Schlüssel stoppt die Verbindung, bevor ein Passwort gesendet wird. Nur falls IONOS für den konkreten Server nachweislich einen anderen Schlüssel dokumentiert, zusätzlich `IONOS_SSH_FINGERPRINT` als Secret mit dem bestätigten `SHA256:…`-Wert setzen. Niemals die Hostprüfung abschalten. [Offizielle IONOS-Fingerabdrücke](https://www.ionos.de/hilfe/hosting/ssh-zugaenge-einrichten-und-verwalten/uebersicht-der-ssh-fingerabdruecke-im-ionos-webhosting/)

Optional unter **Environment variables** `IONOS_SITE_URL` auf `https://www.webbyu.de` setzen, falls dies die endgültige Hauptadresse ist. Ohne diese Variable wird `https://webbyu.de` geprüft. Die Prüfung folgt absichtlich keinen Umleitungen; der gewählte Host muss die Website direkt ausliefern.

Für den automatischen Betrieb das Environment auf **Selected branches → prod** beschränken, soweit im GitHub-Tarif verfügbar. Änderungen an `prod` nur aus geprüftem `dev` übernehmen. Wer Code für diesen Branch freigibt, kann auch den Deployment-Code ändern; der Zugriff auf `prod` sollte deshalb entsprechend begrenzt sein. Für jeden Push automatisch veröffentlichen: keine zusätzliche manuelle Reviewer-Freigabe konfigurieren.

## Erste Veröffentlichung und spätere Updates

Nach dem Hinterlegen der Secrets den Branch **`prod`** aus dem geprüften Stand von `dev` erstellen und auf GitHub pushen. Dadurch startet **Actions → Deploy prod to IONOS**. Bei fehlenden Secrets bricht der Lauf vor einer Verbindung mit einer verständlichen Fehlermeldung ab.

Der Ablauf ist: Abhängigkeiten installieren → TypeScript-Prüfung → Website-Tests und Deployment-Tests → Produktionsbuild mit `SITE_BASE_PATH=/` → Builddateien archivieren → Serveridentität prüfen → SFTP-Übertragung → öffentliche Version und vier Seiten über HTTPS prüfen.

Alle Dateien werden zunächst unter temporären Namen übertragen. Erst wenn alle Uploads erfolgreich sind, werden sie auf ihre endgültigen Namen umbenannt: Assets zuerst, HTML danach, Hauptseite und Versionsnachweis zuletzt. Ein Fehler während des Uploads lässt die bisherigen Live-Dateien stehen. Das anschließende Umbenennen ist pro Datei, nicht für die gesamte Website atomar; ein Verbindungsabbruch in dieser Phase kann einen teilweise veröffentlichten Stand hinterlassen. Der Lauf schlägt dann fehl und muss wiederholt bzw. zurückgesetzt werden. Temporäre Restdateien können nach einem Abbruch verbleiben.

Bereits vorhandene, vom Build nicht belegte Dateien werden nicht gelöscht. Dadurch bleiben auch frühere Asset-Versionen erhalten, damit geöffnete Seiten während eines Updates funktionieren. Das ist keine automatische Bereinigung: ausdrücklich entfernte Seiten müssen gezielt vom Betreiber entfernt werden, und der Speicherverbrauch ist gelegentlich zu kontrollieren. Die Website benötigt ein eigenes Zielverzeichnis.

Nach erfolgreichem Upload prüft GitHub `webbyu-release.json` auf den erwarteten Commit sowie Startseite, Reise, Impressum und Datenschutz. Schlägt nur diese Prüfung fehl, können Domain, SSL, www-Weiterleitung oder CDN noch nicht zum Ziel passen; das bedeutet nicht automatisch, dass der Upload fehlgeschlagen ist. Nach Korrektur den fehlgeschlagenen Lauf erneut starten.

Später Änderungen auf `dev` prüfen und nach `prod` übernehmen. Fehlerhafte Änderungen über einen Revert auf `prod` zurücknehmen; der nächste Push veröffentlicht den zurückgesetzten Code erneut. Alternativ kann der Workflow manuell für den Branch `prod` gestartet werden. Ein manueller Start auf einem anderen Branch veröffentlicht nichts.

## Vorschau, Pfade und Freigabe

`SITE_BASE_PATH=/` überschreibt im IONOS-Build den sonst automatisch erkannten Pages-Pfad `/Webbyu/`. Der Pages-Build behält seinen Repository-Pfad. `SITE_NOINDEX=true` wird nur für die Pages-Vorschau gesetzt; vorhandene `noindex`-Angaben der rechtlichen Entwürfe bleiben auch im Produktionsbuild erhalten.

Die Umstellung des Hostings vervollständigt keine Betreiberangaben, Rechtstexte, Preise oder Kontaktfunktionen. Diese Punkte bleiben vor dem geschäftlichen Start zu erledigen. Die bisherige eRecht24-API-Anbindung bleibt zurückgestellt; ein möglicher IONOS-Abmahnschutz wurde noch nicht beauftragt oder integriert.

## Geprüft am 25.10.2026

TypeScript-Prüfung, alle 113 Website-Tests und fünf Deployment-Tests erfolgreich. IONOS- und Pages-Build separat erzeugt; lokale Links und Assets aller vier Einstiegsseiten für beide Basispfade geprüft. Die Vorschau enthält genau eine `noindex`-Angabe je Seite; im Produktionsbuild bleiben nur die vorhandenen rechtlichen Entwürfe damit markiert. Der IONOS-Build enthält 242 übertragbare Dateien, einschließlich Apache-Konfiguration und Versionsdatei. Fehlerhafte Zielpfade, fehlende Secrets, eine abweichende Serveridentität, ein falscher Build-Commit und SFTP-Fehler wurden ohne echte Kontodaten getestet. Die tatsächliche Verbindung, Serverunterstützung für das Ersetzen per SFTP-Rename und die öffentliche IONOS-Website können erst nach der privaten Einrichtung geprüft werden.
