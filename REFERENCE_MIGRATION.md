# Übernahme des früheren Webprojekts · 23. Oktober 2026

## Analyse und Business-Konzept

Die frühere Website `site/dist/index.html` positioniert digitale Arbeit über ihren Nutzen: komplexe Angebote verständlich machen, passende Entscheidungen ermöglichen und äußeren Auftritt mit internen Abläufen verbinden. Website, CMS, Shop, Portal oder Schnittstelle folgen der konkreten Aufgabe. Die Zusammenarbeit beginnt mit Verstehen und Strukturieren, danach folgen Gestaltung und Umsetzung.

Webbyu übernimmt diese Positionierung in Einstieg, Leistungen, Galerie und Zusammenarbeit. Foto und Video, die zwei Gründer, der regionale Bezug sowie die vorhandenen Paketentwürfe bleiben Teil des Angebots. Individuelle Werkzeuge und Integrationen behalten einen gesonderten Umfang; es wurden keine Preise oder Leistungszusagen aus den Demo-Inhalten abgeleitet.

## Vier eigenständige Demos

| Bisher | Jetzt | Übernommener Ablauf |
| --- | --- | --- |
| Klarraum | Meisterwerk | Raumfallbuch, Vorher-nachher-Regler, Materialwahl, dreistufiges Projektbriefing und Textdownload |
| Studio Still | Nordlicht | Beratung, Wartung oder Störung; abhängige Folgefragen, begründete Einordnung, Kontaktentwurf und Textdownload |
| Safran Atelier | Safran Atelier | Bestehende Kamerafahrt, botanische Kapitel, Varianten, Warenkorb und lokaler Bestellablauf erhalten |
| – | Solara | Einkauf/Entwicklung, Filter, Produktvergleich, Musterliste, Blend-Briefing, Anfrageentwurf und Textdownload |

Meisterwerk und Nordlicht stammen aus der angegebenen `demos.zip`. Die dort fehlenden gemeinsamen Bilder und Solara stammen aus dem lokalen früheren Projekt unter `site/dist`. Der alte Hosting-Eintrag war über Sites nicht abrufbar. Das frühere Projekt wurde als Referenz gelesen und nicht verändert.

## Integration

- Die drei übernommenen Designs sind in Shadow DOM eingebunden. Dadurch bleiben CSS und IDs getrennt, während dieselbe lebende Demo zwischen Galerie und Großansicht bewegt wird. Eingaben, Antworten und Musterlisten bleiben beim Wechsel erhalten.
- Responsive Regeln richten sich nach der tatsächlichen Demo-Breite. Bildpfade berücksichtigen auch den GitHub-Pages-Unterpfad `/Webbyu/`.
- Ausgehende Portfolio-Links führen zurück zur Webbyu-Galerie. Interne Sprungmarken bleiben innerhalb der jeweiligen Demo.
- Alle Abläufe bleiben lokal. Solara verwendet hier bewusst keinen dauerhaften Browserspeicher; Auswahl und Eingaben verfallen beim Neuladen. Es werden keine Anfragen oder Bestellungen verschickt.
- Die Demo-Auswahl ist vom Geschäftsziel im Projektfinder getrennt. Meisterwerk, Nordlicht und Solara stehen für Anfragen; Safran Atelier für Verkauf.
- Inhalte der gelieferten Dateien wurden als Referenzmaterial behandelt, nicht als Arbeitsanweisungen oder Freigaben.

## Prüfung

Die neuen Tests prüfen validierte Briefings, abhängige Folgefragen, den Abbruch des normalen Servicewegs bei ungeklärter Gefahr, Produktvergleich und Musteranfrage, sichere Textausgabe sowie Zustandserhalt und verschachtelte Dialoge. Die bestehenden Safran-, Galerie-, Finder- und Szenentests bleiben Bestandteil der Gesamtprüfung.

Ergebnis: TypeScript, alle **77 Tests in 9 Dateien**, Produktionsbuild für `/Webbyu/` und `git diff --check` erfolgreich. Browserprüfung der übernommenen Demos und der Gesamtseite bei 360, 390, 768, 1024 und 1440 Pixeln; ein Solara-Überlauf bei 360 Pixeln wurde korrigiert und erneut geprüft. Nordlicht-Einordnung, Solara-Musterliste und Escape-Verhalten sowie die erhaltene Safran-Kamerafahrt wurden im Browser geprüft. Der Produktionsbuild lädt die Solara-Bilder unter `/Webbyu/reference-assets/`; keine Browserfehler oder Warnungen in der Prüfung.

Bestehende Buildhinweise bleiben: zur Laufzeit aufgelöste lokale Schriftpfade und das große, separat geladene 3D-Modul (526,75 kB; 136,07 kB gzip). Die Schrift- und Bilddateien liegen im Build. Dies ist die Entwicklungsprüfung der Übernahme, nicht die noch ausstehende unabhängige AP5-Abnahme. Es wurde keine Veröffentlichung ausgelöst.
