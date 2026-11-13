# Webbyu – Die Reise

## Aktualisierung 10. November 2026 (Redesign, Branch `redesign/unikat-2026`)

Nutzerentscheidungen vom 9. und 10. November 2026 ersetzen die räumliche Landschaft und gehen den älteren Punkten unten vor:

- **Verwandelnde Masse** (Nutzeridee 10. November 2026, Richtung vom Nutzer am selben Tag freigegeben; ersetzt das wachsende Bild in `src/journey/scene.ts`): Im Zentrum steht eine graue, formlose Masse, die sich beim Scrollen verwandelt. Ein einziges Netz (Ikosaeder-Kugel, ein Draw-Call); der Vertex-Shader bildet die Kugelrichtung auf Gestalt A und B ab und mischt beide entlang einer Front, die aus dem Inhalt der Zielstation kommt. Zungen und Blütenblätter entstehen aus Sektoren der Kugel, die sich an ihren Grenzen im selben Tal treffen; so bleibt die Fläche geschlossen. Die Kamera fährt über alle zehn Positionen, gedämpft und ohne Schnitt. Jede Gestalt mit Front, Material und Kamera ist ein Vorschlag; die gestalterische Schlussfreigabe gibt der Nutzer:
  - Übersicht: graue, weiche, leicht asymmetrische Masse, seidenmatt.
  - Die Idee: die Masse zieht sich zusammen und hebt einen Tropfen, der nur noch an einem dünnen Faden hängt. Front weich von unten nach oben, grau, die Spitze heller.
  - Das Fundament: ein kompakter Körper aus drei Schichten, deren Fugen als gerundete Mäander in beide Richtungen ineinandergreifen (Nutzerkorrektur 11. November 2026: keine lose gestapelten Platten, keine Zinken). Beim Setzen entsteht jede Schicht über ihrem Platz und schiebt sich mit ihren Zungen in die darunter, von unten nach oben. Grau mit drei stark entsättigten Tönen für Inhalt, Gestaltung und Funktion; die Fugen werden je Bildpunkt gezeichnet und bleiben ohne Zacken.
  - Klarblick: ein gerader Abzieherzug von oben zieht die Masse zur ebenen, klaren Scheibe; vor der Kante staut sie sich wie Wasser. Glas mit Spiegelstreifen, lässt den Seitengrund durchscheinen. Kamera fast frontal.
  - Eiche & Form: ein Hobelzug von links schneidet einen hohen Korpus mit zwei Türen und Sockel, dessen Oberkante einer flachen Schräge folgt; stehende Eichenmaserung aus Rauschen im Objektraum, matt. Kamera schräg von oben.
  - Hof & Flamme: Wärme steigt von unten durch die Masse; aus einem runden Grund steigen drei getrennte, verschieden hohe Zungen, innen warm glühend. Kamera auf Tischhöhe, leicht von unten.
  - Safran Atelier: eine Krokusblüte öffnet sich von oben, sechs Blütenblätter im Wechsel groß und klein in gedämpftem Violett, drei safranrote Fäden in der Mitte. Kamera blickt von oben in die Blüte.
  - Raumgut: ein offenes Regal mit Tiefe und verschieden großen Fächern; in einigen stehen kleine, verschiedene Dinge in gedämpften Naturtönen (das Sortiment), eines tritt aus seinem Fach nach vorn und trägt einen feinen Rand im Akzent (die Auswahl). Hell und naturmatt. Das Regal entsteht in Leserichtung, die Auswahl zuletzt (Nutzerkorrektur 11. November 2026: kein Eiswürfel- oder Schokoladenraster). Entschieden für das Regal statt eines Sockels mit Formen, weil es als Möbel lesbar ist und als Höhenrelief auf einer Fläche des einen Netzes bleibt; einzelne Formen auf einem Sockel ließen sich aus der Kugel nicht ohne Häute zwischen den Formen bilden. Netzpunkte nahe einer Kante rücken genau auf die Kante, Normalen entstehen je Bildpunkt aus der Form; so stehen Wände senkrecht und Kanten bleiben gerade.
  - Koulner (ergänzt 11. November 2026, Station vor dem Ausblick): ein Fotoobjektiv, die Achse zur Kamera. Schwarz eloxierter Tubus, Fokusring mit Rillen, feine helle Entfernungsskala, ein schmaler Ring im Fettstift-Rot von Koulner und eine vergütete Frontlinse mit violett-grünen Reflexen. Die Front läuft von der Frontlinse nach hinten und dabei von einer Seite um die Achse; was sie noch nicht erreicht hat, ist weiter verdreht, so dreht sich das Objektiv ein wie an ein Bajonett. Kamera schräg von vorn rechts.
  - Der nächste Abschnitt („Ihr Projekt“): wieder formlose graue Masse, aber offen, mit einer Mulde zur Kamera und feinem Rand im Akzent; die Kamera fährt nah heran, ohne in die Form einzutauchen. Die Form des nächsten Projekts fehlt noch.
  An der Front wird jede Gestalt kurz wieder graue, flüssige Masse; erst dahinter nimmt sie Form und Material der Zielstation an (so verbrennt beim Wechsel von Eiche & Form zu Hof & Flamme kein Holz, es wird erst Masse und dahinter warm). Rückwärts läuft die Verwandlung der verlassenen Station umgekehrt. Fehlen die Bilder, zeigt die Vektordarstellung die Stationen ohne Übergang.
- **Live mit vorgerendertem Ersatz** (Nutzerentscheidungen 11. November 2026: erst Vorrendern nach dem Muster von Royal Spices, dann „so flüssig wie Koulner Studie E“ mit besserer Kantenglättung): Der Shader mit allen neun Gestalten brauchte unter Windows/Direct3D 80 s zum Übersetzen (gemessen in headless Chrome, AMD Radeon, D3D11) und fror die Reise ein. Jetzt hat jeder Übergang sein eigenes Programm mit nur seinen zwei Gestalten (`FORM_A`/`FORM_B`, rund 2 bis 5 s), das Regal entsteht auf der CPU (`rackPoint` in `src/journey/scene.ts`), und `src/journey/live.ts` übersetzt die Programme im Hintergrund (`compileAsync` mit KHR_parallel_shader_compile, der Übergang am Standort zuerst). Live rendert stufenlos mit Multisampling bei bis zu doppelter Pixeldichte, gemessen 1,5 bis 2,4 ms GPU-Zeit je Bild bei 1440 × 900. Bis ein Programm fertig ist (kalt rund 4 bis 5 s), zeigt die vorgerenderte Bildfolge (`src/journey/frames.ts`, `public/journey/frames/`) denselben Rahmen; ohne WebGL oder parallele Übersetzung bleibt es bei ihr. Die Bildfolge entsteht mit `node scripts/render-journey.mjs` aus demselben Shader; nach jeder Änderung in `scene.ts` neu rendern. Jede ruhende Gestalt wird anhand ihres gemessenen Rahmens (`frames.json`) mittig in die freie Fläche eingepasst (84 %), dazwischen gleiten Größe und Lage mit; dadurch fällt die frühere Nahfahrt bei „Ihr Projekt“ weg. Ein Sprung über mehrere Stationen verwandelt live direkt in die Zielgestalt, sobald das Programm des Paars bereit ist; sonst spielt die Bildfolge die Verwandlung der Zielstation, während die zuvor sichtbare Gestalt ausblendet. Vorschläge, Freigabe offen: Einpassung, Sprungverhalten. Bekannt: Beim ersten Programm steht das Bild einmal bis zu 0,5 s; im Akkubetrieb drosselt Chrome alle Seiten auf 30 fps.
- **Jede Station hat ihre eigene Verwandlung** (Nutzerentscheidung 10. November 2026: „jedes mal dieselbe transformation für ganz unterschiedliche dinge … trifft nicht unser kernkonzept“). Abgelehnt und entfernt: Wischen, Unschärfe und Linien als Übergang, die große Wolke heller Funken, dieselbe Transformation für alle Stationen.
- **Netzwerkkarte, Stationsmarker und Bildkarte** sind ausgeblendet, sobald die Bildfolge zeigt; der aktuelle Stationsmarker schien zuvor durch, das ist mit `cb8d74b` erledigt (Marker per `display: none`). Stationen bleiben über die untere Navigation, Zurück/Weiter und die Textspalte erreichbar. Live-Demos laden erst über „Konzept ausprobieren“.
- **Ruhe zwischen den Stationen** (Nutzerentscheidung 10. November 2026, die Reise wirkte überreizt): Es bewegt sich nur der Übergang beim Weiterreisen, gebunden an Scrollen oder Stationswechsel, eine Bewegung zur Zeit. Keine Dauerschleife, kein Pulsieren, keine losen Funken, keine selbstlaufende Zeit im Shader; alles Bewegte ist eine Funktion des Fortschritts, und die Darstellungsschleife endet, sobald eine Station erreicht ist. Ein Sprung über mehrere Stationen verwandelt einmal von der sichtbaren Gestalt direkt zur Zielgestalt, auch die Kamera.
- **Die Animation ist immer sichtbar:** Text liegt mit transparentem oder halbtransparentem Hintergrund davor, auch mobil.
- Keine Blume des Lebens und keine anderen esoterischen Bilder oder Begriffe (Nutzerkorrektur 10. November 2026).

## Aktualisierung 11. November 2026: Koulner

Neue Station „Koulner“ vor dem Ausblick: ein Eigenprojekt (Foto- und Videoportfolio) in drei Stufen unter `/demos/koulner/stufe-1/` bis `stufe-3/`, übernommen aus `fc83ff1` (Branch `claude/koulner-demos`). Die Station verlinkt die drei Seiten über `pages` in `src/journey/data.ts`. Die Bilder sind Stockmaterial als Platzhalter, nur in 960er-Fassungen versioniert. In der Verwandlung ist Koulner Gestalt 9 (Objektiv, siehe oben); die Bildfolge hat dadurch neun Übergänge.

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
