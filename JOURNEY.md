# Webbyu – Die Reise

## Aktualisierung 10. November 2026 (Redesign, Branch `redesign/unikat-2026`)

Nutzerentscheidungen vom 9. und 10. November 2026 ersetzen die räumliche Landschaft und gehen den älteren Punkten unten vor:

- **Prototyp „verwandelnde Masse“** (Nutzeridee 10. November 2026, ersetzt das wachsende Bild in `src/journey/scene.ts`): Im Zentrum steht eine graue, formlose Masse, die sich beim Scrollen verwandelt. Ein einziges Netz (Ikosaeder-Kugel, ein Draw-Call); der Vertex-Shader bildet die Kugelrichtung auf Gestalt A und B ab und mischt beide entlang einer Front, die aus dem Inhalt der Zielstation kommt. Die Kamera fährt über alle neun Positionen (Übersicht und acht Stationen), gedämpft und ohne Schnitt. Gestalt, Material und Front sind ein Vorschlag, die gestalterische Freigabe gibt der Nutzer:
  - Übersicht: graue, weiche, leicht asymmetrische Masse, seidenmatt.
  - Klarblick: ein gerader Abzieherzug von oben zieht die Masse zur ebenen, klaren Scheibe; vor der Kante staut sie sich wie Wasser. Glas mit Spiegelstreifen, lässt den Seitengrund durchscheinen. Kamera fast frontal.
  - Eiche & Form: ein Hobelzug von links schneidet einen exakten Korpus, dessen Oberkante einer schiefen Linie folgt; Eichenmaserung aus Rauschen im Objektraum, Tür- und Sockelfuge, matt. Kamera schräg von oben.
  - Hof & Flamme: Wärme steigt von unten durch die Masse; sie streckt sich zu einer Flamme mit drei aufsteigenden Zungen, innen warm glühend. Kamera auf Tischhöhe, leicht von unten.
  - Die Idee, Das Fundament, Safran Atelier, Raumgut und Der nächste Abschnitt zeigen im Prototyp die formlose Masse mit eigenem Rauschen. Eigene Gestalten für sie sind vorgeschlagen und folgen erst nach Freigabe.
  Unterwegs wird die Masse kurz flüssig, am stärksten an der Front; wo die Front vorbei ist, setzt sie sich. Rückwärts läuft die Verwandlung der verlassenen Station umgekehrt. Ohne WebGL zeigt die Vektordarstellung die Stationen ohne Übergang.
- **Jede Station hat ihre eigene Verwandlung** (Nutzerentscheidung 10. November 2026: „jedes mal dieselbe transformation für ganz unterschiedliche dinge … trifft nicht unser kernkonzept“). Abgelehnt und entfernt: Wischen, Unschärfe und Linien als Übergang, die große Wolke heller Funken, dieselbe Transformation für alle Stationen.
- **Netzwerkkarte, Stationsmarker und Bildkarte** sind im WebGL-Betrieb ausgeblendet. Stationen bleiben über die untere Navigation, Zurück/Weiter und die Textspalte erreichbar. Live-Demos laden erst über „Konzept ausprobieren“.
- **Ruhe zwischen den Stationen** (Nutzerentscheidung 10. November 2026, die Reise wirkte überreizt): Es bewegt sich nur der Übergang beim Weiterreisen, gebunden an Scrollen oder Stationswechsel, eine Bewegung zur Zeit. Keine Dauerschleife, kein Pulsieren, keine losen Funken, keine selbstlaufende Zeit im Shader; alles Bewegte ist eine Funktion des Fortschritts, und die Darstellungsschleife endet, sobald eine Station erreicht ist. Ein Sprung über mehrere Stationen verwandelt einmal von der sichtbaren Gestalt direkt zur Zielgestalt, auch die Kamera.
- **Die Animation ist immer sichtbar:** Text liegt mit transparentem oder halbtransparentem Hintergrund davor, auch mobil.
- Keine Blume des Lebens und keine anderen esoterischen Bilder oder Begriffe (Nutzerkorrektur 10. November 2026).

## Aktualisierung 4. November 2026

Die Reise zeigt acht Stationen: Klarblick (Start), Eiche & Form (Business) und Hof & Flamme (Complete) ersetzen Meisterwerk und Nordlicht. Safran Atelier und Raumgut bleiben als Funktionsstudien. Die Paketstationen zeigen ein Bild und verlinken auf die eigenständigen Demo-Websites; die Funktionsstudien behalten ihre interaktive Großansicht. Auch die sichtbaren Direktzugriffe und Verweise auf der Informationsseite wurden angepasst. Die bisherigen Demo-Quelldateien bleiben im Projekt erhalten. Keine Veröffentlichung; visuelle Prüfung und Freigabe stehen noch aus.

Stand: 24. Oktober 2026. Lokale Weiterentwicklung der Reise zu verbundenen Erlebnisräumen. Die aktuelle Abnahme ist unten getrennt vom historischen Prüfstand dokumentiert.

## Bestätigte Entscheidungen

- Eigene Erlebnis-Seite `/reise/`; Einstieg von Navigation und „Über mich“.
- Die bisherige Geländescholle wird durch ein abstraktes räumliches Universum ersetzt: weiche, unregelmäßige Lichtfelder, räumlich gestaffelter Nebel und ein entlang der Reise wachsendes Netzwerk. Die bestehende Palette aus Petrol, hellen Naturtönen und zurückhaltenden gelbgrünen Akzenten bleibt erhalten.
- Sieben Stationen: Die Idee, Das Fundament, Meisterwerk, Nordlicht, Safran Atelier, Raumgut, Der nächste Abschnitt.
- Jede Station folgt dem Rhythmus Orientierung → Übergang durch Nebel → Freilegung der Projektwelt → ruhige Betrachtung. Die Kamera bewegt sich durch Scrollen oder bewusste Navigation, nicht dauerhaft während der Betrachtung.
- Die vier tatsächlichen Demoseiten erscheinen beim Erreichen ihrer Station automatisch als skalierte Website-Flächen in der räumlichen Bühne. Es sind die vorhandenen DOM-Seiten, nicht nur Stellvertreter aus 3D-Objekten. Ein Klick auf die sichtbare Seite oder „Konzept ausprobieren“ öffnet dieselbe Live-Sitzung in der bedienbaren Großansicht.
- Webbyus Arbeitsweise und Entwicklung stehen im Vordergrund. Die Konzeptreihenfolge ist eine redaktionelle Erzählung, keine Behauptung historischer Projektdaten. Es werden keine Gründungsdaten oder Kundenreferenzen erfunden.
- Die Konzepttexte erklären Aufgabe, Ansatz und Nutzen. Alle vier Marken bleiben als fiktive Konzeptstudien beziehungsweise lokale Simulationen gekennzeichnet. Die sichtbare Sprache ist fachlich und konkret; keine esoterischen Begriffe oder Phönixdarstellung.
- Drei persönliche Notizen stehen direkt im Kapiteltext. Sie öffnen sich nicht automatisch als darüberliegende Boxen; keine Hover-Abhängigkeit.
- Letzte Nutzerkorrektur: Die geplante Änderung des Webbyu-Schriftzugs ist zurückgenommen. Die ursprüngliche Wortmarke bleibt in Kopf- und Fußbereich von Startseite und Reise erhalten; kein neuer SVG-Schriftzug.
- Verbindliches Layoutziel: Texte, Website-Flächen und Navigation dürfen sich nicht überschneiden oder relevante Inhalte verdecken. Auf kleinen Bildschirmen stehen Bühne und Kapitelinhalt untereinander.

## Stationen und Inszenierung

| Stabile Kapitel-ID | Inhalt und räumliche Inszenierung |
| --- | --- |
| `die-idee` | Die Kundenaufgabe gibt die Richtung vor; einzelne Linien und Flächen finden zusammen. |
| `das-fundament` | Inhalt, Gestaltung und Funktion werden als zusammengehörige Struktur sichtbar. |
| `meisterwerk` | Raumfragment mit Materialflächen und die echte Meisterwerk-Demoseite; vom Veränderungswunsch zum Projektbriefing. |
| `nordlicht` | Technische Module, Verzweigungen und die echte Nordlicht-Demoseite; vom Anliegen zu passenden Folgefragen. |
| `safran-atelier` | Botanische Nahwelt und die echte Safran-Atelier-Demoseite; von Blüte und Faden zur Produktgeschichte. |
| `raumgut` | Möbel, Materialien und die echte Raumgut-Demoseite; vom Sortiment zur persönlichen Auswahl. |
| `der-naechste-abschnitt` | Die Verbindungen bilden einen offenen Gestaltungsraum; der Projektfinder sammelt das nächste Vorhaben. |

## Bedienung und technische Grenzen

- Native Seitenscrollbewegung führt die Kamera; Anker, Kapitel, Stationsmarker und Zurück/Weiter bleiben normale Links. Direkte Stationswahl erzeugt einen Verlaufseintrag; Scrollen aktualisiert den aktuellen Eintrag. Die sichtbare Bezeichnung lautet „Übersicht“; die bisherige Adresse `#landschaft` bleibt erreichbar.
- Zurück liegt fest unten links, Weiter unten rechts, jeweils mit Pfeil, Text und mindestens 48 Pixel hoher Bedienfläche. In der Übersicht führen die Eckschaltflächen zur Startseite beziehungsweise zur ersten Station, am Ende zum Projektfinder. Kapitelstand und Übersicht stehen dazwischen, auf kleinen Bildschirmen oberhalb der Eckschaltflächen. Geöffnete Demos verwenden ihre eigene Bedienung.
- Kapitel und DOM-Navigation funktionieren unabhängig vom nachgeladenen 3D-Modul. Die Vektorübersicht verwendet dieselben Stationsfarben, Positionen und Netzwerkverbindungen wie die 3D-Szene und dient zugleich als aktualisierte Homepage-Vorschau.
- Bei `prefers-reduced-motion` bleibt die Kamera in der Gesamtansicht. Importfehler, Initialisierungsfehler und Kontextverlust wechseln zur Vektordarstellung. Der Fall ohne JavaScript erhält eine kurze HTML-Erläuterung mit Rückweg zur Startseite.
- Ein Renderer pro Reise; begrenzte Pixeldichte, keine dauerhafte Animationsschleife bei ruhender Kamera, Pause bei Unsichtbarkeit/Hintergrundtab/geöffneter Demo; explizite Freigabe aller erworbenen Ressourcen. Wenige transparente Nebelflächen erzeugen Tiefe; der Nebel gehört zur Bildwelt und liegt nicht über Texten oder Bedienelementen.
- Bestehende Demos und Dialogverwaltung werden wiederverwendet. Die jeweilige Demo wird beim Erreichen ihrer Station geladen und als echte, für direkte Eingaben gesperrte DOM-Fläche in der Bühne angezeigt. Ein Klick öffnet sie in der Großansicht; danach wird dasselbe Element wieder in der Bühne angezeigt. Jede Konzeptdemo hat eine eigene zwischengespeicherte Live-Sitzung. Schließen stellt Fokus und Reiseposition wieder her. Neuladen oder Verlassen der Seite beendet die flüchtigen Sitzungen wie bisher.
- Echte statische Mehrseitenausgabe statt serverabhängiger Routen. Links nutzen `BASE_URL`; die vorhandene Groß-/Kleinschreibung des Repositorypfads bleibt erhalten.
- Keine neuen Abhängigkeiten, kein neuer Hostingdienst, keine Veröffentlichung und keine externen Karten-APIs. Kontaktversand und echte Bestellungen behalten den bisherigen Prototypstatus.

## Erweiterung

Stationen werden in `src/journey/data.ts` gepflegt: stabile ID, Texte, Position, räumliche Inszenierung, Lichtfarbe und Szenenbeschreibung, optional Aufgabe/Ansatz/Nutzen, vorhandene Demo-ID und persönliche Notiz. Dort liegen auch die gemeinsamen Verbindungen für Inhalt, Gestaltung und Funktion. Projekttitel und Beschreibung stammen aus dem bestehenden Konzeptkatalog. Eine weitere Arbeit bekommt einen Eintrag, eine Kameraposition, passende Inszenierung und begründete Verbindungen. Echte Referenzen erst mit bestätigten Angaben und klarer Kennzeichnung ergänzen.

## Aktuelle Abnahme – noch ausstehend

Die folgenden Punkte betreffen die neue räumliche Gestaltung einschließlich sichtbarer Demoseiten und zurückgenommener Schriftzugänderung. Die bisherigen Prüfergebnisse im nächsten Abschnitt belegen diesen neuen Stand nicht. Tatsächlich ausgeführte Prüfungen und verbleibende Grenzen werden nach Abschluss hier ergänzt.

- [ ] TypeScript, vollständige automatisierte Tests und Produktionsbuild; abweichende frühere Kamera-/Markererwartungen gegen das beabsichtigte Verhalten prüfen.
- [ ] Desktop, Tablet, Smartphone und niedrige Fensterhöhen: keine Überlagerungen von Text, Vorschau oder Navigation, keine verdeckten relevanten Inhalte und kein horizontaler Seitenüberlauf.
- [ ] Alle sieben Stationen über Scrollen, Direktwahl und Ecknavigation; Anfang/Ende, Direktaufruf, Neuladen, Browser-Zurück/-Vorwärts und Tastaturfokus.
- [ ] Alle vier echten Demoseiten bereits in der räumlichen Bühne sichtbar; Öffnen derselben Sitzung, Eingaben, Schließen, wieder sichtbare Vorschau, Reiseposition und Fokus.
- [ ] Lichtfelder, Nebelübergänge, unterscheidbare Projektwelten und Netzwerkaufbau; keine esoterische Gestaltung oder Sprache.
- [ ] Reduzierte Bewegung, WebGL-Ausfall, Ladefehler und pausierte Darstellung bei geöffnetem Dialog beziehungsweise in Hintergrundtabs.
- [ ] Ursprüngliche Wortmarke auf Startseite und Reise; aktualisierte Homepage-Vorschau; Prüfung des Repository-Unterpfads.

## Historischer Prüfstand – vorherige Landschaftsversion

Die folgenden Nachweise wurden für die frühere Geländescholle dokumentiert und bleiben als Ausgangsstand erhalten. Die genannten Bilder und Testzahlen sind keine Abnahme der aktuellen Weiterentwicklung.

- Neue Integrationstests: gültige Kapitelziele und Konzeptzuordnung, gemeinsame Auswahl von Verlauf/Scrollen/Markern/Kamera, Direktlinks, Renderer-Ladefehler, verspätete Importe nach Entsorgung, Demo-Wiederverwendung, Fokuswiederherstellung und erneuter Ladeversuch.
- Neue Szenentests mit echten Three-Geometrien und ersetztem GPU-Aufruf: nach oben gerichtete Wege, sofort korrekte Markerprojektion, vollständige Ressourcenfreigabe, Pause bei Unsichtbarkeit/Deaktivierung/Hintergrundtab, bewegungslose Übersicht bei reduzierter Bewegung und Kontextverlust.
- Browserprüfung: 360/390/768/1024/1440 Pixel, kein horizontaler Seitenüberlauf und keine überlappenden Stationsnummern. Desktop und Smartphone visuell geprüft.
- Alle vier Demos aus den Reise-Stationen geöffnet und geschlossen. Raumgut-Suche nach „NORI“ ausgeführt; Suchwert und Ergebnis bleiben beim erneuten Öffnen erhalten. Reiseposition und Fokus werden wiederhergestellt.
- Browser-Zurück/-Vorwärts sowie Stationssprung auf Raumgut geprüft. Die mobile Scrollreserve berücksichtigt die angeheftete Landschaft, auch beim automatischen Anspringen von Bedienelementen.
- Gesamtprüfung: 95 Tests in 12 Dateien bestanden; nach der abschließenden Datenmodell-Anbindung die 14 betroffenen Reise-/Shell-Tests erneut erfolgreich geprüft. TypeScript ohne Fehler und aktueller Produktionsbuild erfolgreich.
- Zusätzlicher Build mit `/Webbyu/` als Basis: HTTP 200 für `/Webbyu/reise/`; Direktaufruf und Neuladen von `#raumgut` öffnen die richtige Station samt WebGL. Rücklinks und mobiler Navigationseinstieg behalten den Repository-Unterpfad. Keine Browserfehler im Produktionsaufruf.
- Der Entwicklungsserver ignoriert `artifacts/`, damit parallele Prüfdateien unter Windows keine Dateiwächter-Fehler auslösen. Vorschau nach der Reparatur erneut erreichbar.
- Bestehende Buildhinweise zu relativen Schriftpfaden aus den importierten Demos und zur separat geladenen Three.js-Bündelgröße bleiben bestehen. Der geprüfte Produktionsaufruf lädt die Landschaft ohne Browserfehler. Kein vollständiger neuer Audit der älteren Demos.
- Desktop- und Mobilaufnahmen: `artifacts/journey/desktop.jpg` und `artifacts/journey/mobile.jpg`; Prüfausgaben und der alternative Build bleiben lokal und werden nicht eingecheckt.

## Weiterarbeit

> Lies JOURNEY.md und die aktuellen Design-Tokens. Entwickle die verbundenen Erlebnisräume unter /reise/ weiter. Erhalte die ursprüngliche Webbyu-Wortmarke, native Navigation mit festen Eckschaltflächen, die vier bereits in der Bühne sichtbaren echten Demoseiten samt wiederverwendeten Live-Sitzungen, mobile Bedienbarkeit und die Ersatzdarstellung. Texte, Website-Flächen und Navigation dürfen sich nicht überlagern oder relevante Inhalte verdecken. Bestätigte neue Inhalte in das gemeinsame Stationsmodell übernehmen; fachliche Sprache verwenden und keine Kundendaten oder historischen Meilensteine erfinden. Nach Änderungen passende Prüfungen ausführen und den tatsächlichen aktuellen Stand sowie IDEE-06 fortschreiben; historische Abnahmen nicht als aktuelle ausgeben.
