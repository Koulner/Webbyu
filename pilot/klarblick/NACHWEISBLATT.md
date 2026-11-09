# Klarblick · Nachweisblatt

Nachweisblatt nach [UNIKAT_STANDARD.md](../../UNIKAT_STANDARD.md). Die Bewertungen sind ein **Vorschlag von Claude**, keine Freigabe.

```text
Projekt / real oder fiktiv:  Klarblick, Fensterreinigung, fiktiv
Stand / Datum / Version:     9. November 2026, Branch dev auf Basis 2832a9d, nicht committet
```

**Ansehen** (bei laufendem `npm run dev`):

- Demo: <http://localhost:5173/demos/start/>
- Hinweise: <http://localhost:5173/demos/start/hinweise/>
- Skizzen: <http://localhost:5173/pilot/klarblick/skizzen/>

Aufnahmen liegen in [nachweis/](nachweis/). Die Desktop-Aufnahmen sind per CSS verkleinert, damit bei 1440 px Layoutbreite mehr aufs Bild passt.

## Briefing und belegbare Besonderheiten

Vollständig in [BRIEFING.md](BRIEFING.md). Kurz: Fiktive Fensterreinigung in Stormarn. Besonderheit: **Beim ersten Mal kommen sie ohne Eimer.** Vor dem ersten Termin gehen sie einmal ums Haus und schreiben eine Fensterliste mit Art, Zugang und Ausrüstung. Alles ist erfunden und auf der Seite als fiktiv gekennzeichnet.

## Besucheraufgabe und Zielhandlung

Frage des Besuchers: „Kommt ihr an mein schwieriges Fenster überhaupt dran?“ Zielhandlung: das eigene Haus grob ankreuzen und eine Anfrage stellen, in der schon steht, um welche Fenster es geht.

## Richtungen

Skizzen: [skizzen/index.html](skizzen/index.html).

| Richtung | Leitidee | Mögliche Schwäche |
|---|---|---|
| **A · Von oben nach unten** | Die Seite ist eine Hausfront. Jeder Fenstertyp ist ein eigenes Inhaltsmodul. | Kann ins Niedliche oder Kulissenhafte kippen |
| B · Die Wagenladung | Die Seite ist die Ladefläche, Ihre Fenster entscheiden, was eingeladen wird | Zeigt Werkzeug statt Haus, Mittelteil wird Kartenraster |
| C · Die Fensterliste | Die Seite ist das Dokument, das der Betrieb schreibt | Kühl, nah an der Werkakte von Eiche & Form |

## Gewählte Richtung und Begründung

**A.** Die Höhe ist bei Fenstern das eigentliche Problem, und eine Seite wird von oben nach unten gelesen. Nur in A fallen Fensterform, Zugang und Layout zusammen.

- **Gegen B:** Besucher denken an ihr Fenster, nicht an Leitern. Übernommen: „Das käme auf den Wagen“ als Rückmeldung im Formular.
- **Gegen C:** Zu wenig zum Erinnern und zu nah an Eiche & Form. Übernommen: die Fensterliste als Abschluss des Hauses.

## Leitidee und sichtbare Konsequenzen

| Entscheidung | Wo sichtbar | Begründung im Briefing |
|---|---|---|
| „Jedes Haus hat dieses eine Fenster.“ | Einstieg | Kundensituation, das unerreichbare Fenster |
| Ein gelbes Rundfenster im Klinkergiebel, sonst bleibt nichts gelb erleuchtet | Einstieg, Startseitenkachel, Logo | Dasselbe Fenster als einziges Bild, an das man sich erinnert |
| Die Seite läuft vom Himmel über Giebel, Schiefer, Wand, Hecke und Sockel bis zum Gehweg | Ganze Seite, Desktop und Mobil | Höhe als eigentliches Problem |
| Fenstertyp = Inhaltsmodul: sechs Felder bei Sprossen, Rundbogen und Hochformat an der Treppe, zwei versetzte Rahmen beim Kastenfenster, die Hecke verdeckt ihr Fenster | Mittelteil | Vorschlag des Standards: grafisches System aus Fenstertypen, Rahmen und Zugang |
| Jedes Fenster nennt „Zugang“ und „Auf den Wagen“ | Alle Module, Liste | Vorbereitung je Fenstersituation |
| Dieselben Fensterzeichen in Liste, Formular und gezeichnetem Haus | `zeichenformen` in `klarblick.ts` | Eine gemeinsame Geometrie |
| Fensterliste mit zwölf Fenstern aus genau diesen Modulen | Abschnitt „Macht zwölf Fenster.“ | Das tatsächliche Arbeitsergebnis des Rundgangs |
| Oberlicht trägt die drei Schritte, die Doppeltür das Formular | Eingang | „Beim ersten Mal kommen wir ohne Eimer“: Der Weg endet an der Tür |
| Formular zählt Fenster, zeichnet das Haus und listet, was auf den Wagen käme | Tür | Zielhandlung ist ein kleiner Rundgang |
| Barlow in schweren Schnitten wie auf Schildern, Emailleschild, Ortstafeln, Hausnummer | Überschriften, Kleinigkeiten | Region und Trockenheit des Tons |
| Keine schmale Serife, keine ↗ in der Marke, keine nummerierten Augenbrauen, keine Animation | Ganze Seite | Vorgaben; die Idee trägt ohne Bewegung |

## Individuell entwickelte Bestandteile / wiederverwendete Grundlagen

- **Neu:** Konzept, Texte, Fensterzeichen, Fassade, Materialien (Klinker, Schiefer, Hecke, Gehweg), Formularidee, Styles. Das frühere Layout und das KI-Einstiegsbild sind aus der Demo entfernt.
- **Übernommen:** lokaler Formularablauf aus `main.ts` (`data-demo-form`, Prüfen, Korrigieren, Abschließen), Demoleiste, mobiles Menü, Barlow als Schrift aus dem Bestand. Dafür ist `main.ts` minimal erweitert: Die Prüfansicht kann jetzt auch Angaben ohne die Einheit mm zeigen.

## Gestaltungsstrecke

Einstieg, Mittelteil, Zielhandlung und Hinweisseite, im tatsächlichen Stand der Demo. Desktop und Mobil. Klarblick ist ein Onepager, es gibt keine weiteren Unterseitentypen.

## Bild- und Inhaltsquellen / fehlendes Material

| Material | Herkunft | Rechte |
|---|---|---|
| Fassade, Fensterzeichen, Rundfenster, Katze | Programmatisch in `klarblick.ts` und `klarblick.css` | Eigene Arbeit für diese Demo |
| `klarblick-klinker/-schiefer/-hecke/-gehweg/-giebel.svg` | [tools/texturen.mjs](tools/texturen.mjs), fester Zufallsstart | Eigene Arbeit für diese Demo |
| Barlow 700, 800 | `@fontsource/barlow@5.3.0`, aus dem lokalen npm-Cache, kein neuer Download | SIL OFL, `public/fonts/Barlow-OFL.txt` |

**Fehlt:** Es gibt keine Fotografie, und hier stand kein Bildgenerator zur Verfügung. Die Zeichnungen tragen die Idee, ersetzen aber keinen Eindruck vom echten Betrieb. Echte Kundenprojekte brauchen echte Aufnahmen. `klarblick-concept.webp` wird von der Demo und der Kachel nicht mehr verwendet, liegt aber noch für die Reise (`src/journey/data.ts`) bereit.

## Verglichene Projekte und Ansichten

Raumgut (`artifacts/raumgut/raumgut-desktop.png`, `raumgut-mobile-sortiment.png`), Eiche & Form Einstieg bei 1440 px, Hof & Flamme Einstieg bei 1440 px. Die vorherige Klarblick-Fassung bei 1440 px. Aufnahmen: `nachweis/vergleich-*.jpg`. Der Seitenverlauf von Eiche & Form und Hof & Flamme wurde nicht neu durchgesehen.

**Gemeinsame Muster:** Keine gemeinsame tragende Komposition. Eiche & Form ist ein Werkplan in Tusche und Rot, Hof & Flamme ein dunkler Fotoabend, Klarblick eine flächige Hausfront. Geteilt werden die Webbyu-Demoleiste und mit Eiche & Form die Schrift Barlow, dort als Grundtext, hier in schweren Schnitten als Überschrift. Rückmeldung im Formular haben beide; die eigene Eingabe zeichnet in beiden Fällen ein Bild. Das ist eine bewusste Verwandtschaft der Zielhandlung, sollte aber nicht zur Schablone werden.

## Direkter Vergleich mit Raumgut

| Merkmal | Raumgut | Klarblick | Einschätzung |
|---|---|---|---|
| Bildkohärenz | Einheitliche fotografische Motive | Alle Bildelemente aus einem Zeichensystem, Klinker und Fenster durchgehend | Vergleichbar, anders gelagert |
| Proportionen | Ruhig, kompakte Handelsnavigation | Große Überschrift, dichte Fassade, lange Seite | Vergleichbar, deutlich lauter |
| Hierarchie | Sehr klar | Klar; jedes Fenster nennt dieselben zwei Angaben | Vergleichbar |
| Konkrete Inhalte | Produkt, Material, Preis | Maße, Zugang, Ausrüstung, Liste; kein Preis | Vergleichbar |
| Details | Ausgearbeiteter Shop-Ablauf | Rollschichten, Fensterbänke, Markise, Hausnummer, Ortstafeln, Katze | Bei den Details der Bildwelt gleichwertig, bei Abläufen hinter Raumgut |
| **Unmittelbare Wirkung** | Fotografischer Raum, man möchte dort wohnen | Illustration, man erkennt sein Haus und schmunzelt | **Andere Wirkung. Weniger wertig, dafür eigener** |

**Eigene Identität:** Von Raumgut ist nichts übernommen. Ob der Entwurf „nicht nach KI aussieht“, kann nur die verantwortliche Person beurteilen.

## Prüfkriterien

```text
Bezug zum Unternehmen:      bestanden. Jede prägende Entscheidung führt auf das Briefing zurück (Tabelle oben).
Austausch in der Branche:   bestanden. Ohne Rundgang und Fensterliste entfallen H1-Logik, Liste, Oberlicht und Formular.
                            Ein anderer Betrieb mit derselben Arbeitsweise könnte die Idee übernehmen; das Merkmal ist fiktiv.
Portfoliovergleich:         offen. Keine gemeinsame Komposition mit den Demos. Die Wirkung neben Raumgut
                            muss die verantwortliche Person beurteilen.
Tragfähigkeit der Idee:     bestanden. Die Hausfront läuft bis zum Gehweg und wird mobil zum schmalen hohen Haus. Hinweisseite
                            bleibt einfacher, verwendet aber dieselben Materialien.
Bildregie und Inhalt:       überarbeiten. Bildregie stimmig, aber rein gezeichnet; die Gläser bleiben bis auf die Katze leer.
                            Risiko des Niedlichen ist nicht ausgeräumt. Fachaussagen sind nicht von einer Fachkraft geprüft.
Ausarbeitung und Bedienung: offen. Siehe Prüfstand; kein Screenreader-Test, Tastatur nur teilweise.
```

## Technischer Prüfstand und Grenzen (separat)

**Ausgeführt:**

- `npx tsc --noEmit`: fehlerfrei.
- `npx vitest run`: 239 Tests in 21 Dateien bestanden, darunter ein neuer Test für den Klarblick-Ablauf.
- `npx vite build --outDir <Ordner außerhalb von dist>`: erfolgreich.
- `node scripts/verify-package-demos.mjs <Ordner> /`: „Verified 19 demo pages, assets, noindex and sitemap exclusion at /“.

**Geprüft im Browser (Chromium im Browser-Fenster, Vite-Entwicklungsserver):**

- Kein horizontaler Überlauf bei 360, 390, 768 und 1440 px: Ohne Skrollleiste ist `scrollWidth` gleich `innerWidth`.
- Angesehen: Einstieg, Fassade, Liste, Laden, Tür bei 1440 px; dieselben bei 390 px; Einstieg, Fassade, Tür bei 768 px; Liste bei 360 px; Hinweisseite bei 1440 px; Startseitenkachel bei 1440 px.
- Formular per Skript: Leer blockiert, ungültige E-Mail blockiert, Prüfen mit Fensterliste, Korrigieren mit Fokus zurück, Abschließen, Neustart mit geleertem Zustand, Limit bei 19 Fenstern mit Fokus auf dem Gegenknopf. Keine Netzwerkanfrage. Nicht von Hand getippt.
- Kontrast rechnerisch: Text auf Himmel 11,4, auf Glas 12,7, auf Tür 10,2; kleiner Text auf Tür 8,3; Gold auf Ladenscheibe 6,6; Platzhalter 5,6.
- Stepper-Knöpfe mindestens 40 px hoch (mobil), 42 px (Desktop).
- Seite enthält keine CSS-Animationen.

**Labormessung, nur grobe Orientierung:** CLS 0,0564 bei 1440 px auf dem Entwicklungsserver. Vermutlich der Schriftwechsel, Ursache nicht geprüft. LCP wurde dort nicht gemeldet, INP nicht gemessen. Feldwerte gibt es nicht.

**Nicht geprüft:** Screenreader, Safari und Firefox, komplette Tastaturrunde (nur die Fokusreihenfolge per Skript ausgelesen), reduzierte Bewegung im Browser (es gibt keine Bewegung), Anzeige ohne JavaScript im Browser (statisches H1 und Inhalt prüft `verify-package-demos`), Medienausfall der SVG-Texturen.

## Offene Mängel / nächste Überarbeitung

1. Die Wirkung neben Raumgut beurteilen: Trägt eine gezeichnete Bildwelt für die Start-Demo?
2. Glasflächen lebendiger machen, falls gewünscht. Bisher nur eine Katze, Reflexe wirken stellenweise noch wie Flächen in einem Webraster.
3. Eine schmale Schrift im Stil der DIN-Engschrift wäre für große Überschriften noch eigenständiger. Das braucht einen Download und wurde daher nicht gemacht.
4. Fachsprache, Maße und Zeitangaben von einer Fachkraft gegenlesen lassen.
5. `src/journey/data.ts` und der Abschnitt zu Klarblick in `PACKAGE_DEMOS.md` beschreiben noch die alte Fassung.
6. CLS durch Vorladen der beiden Barlow-Schnitte senken, falls es im Feld auffällt.

```text
Gestalterische Schlussfreigabe:           ausstehend
Freigegebener Stand / Person / Datum:     –
Vereinbarte Kundenfreigabe:               entfällt, fiktives Unternehmen
```

## Aufwand

Laufzeit eines KI-Agenten am 9. November 2026, **kein Stundenwert für ein Angebot**. Rund 25 Minuten von der ersten Sichtung bis zur Schlussprüfung; Abschnitte sind nicht getrennt erfasst. Tokens und Kosten sind nicht erfasst.
