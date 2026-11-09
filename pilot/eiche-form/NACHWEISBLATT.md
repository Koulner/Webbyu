# Eiche & Form · Pilot · Nachweisblatt

**5. November 2026:** Auf Wunsch des Nutzers in die Business-Demo `/demos/business/` übertragen (Code in `src/package-demos/eiche/`). Dieser Ordner bleibt als Stand des Piloten erhalten. Die gestalterische Schlussfreigabe steht weiter aus.

Nachweisblatt nach [UNIKAT_STANDARD.md](../../UNIKAT_STANDARD.md). Die Bewertungen sind ein **Vorschlag von Claude**, keine Freigabe. Die bestehende Demo unter `/demos/business/` ist unverändert.

```text
Projekt / real oder fiktiv:  Eiche & Form, fiktiv
Stand / Datum / Version:     Pilot vom 4. November 2026, nicht committet
```

**Ansehen** (bei laufendem `npm run dev`):

- Gestaltungsstrecke: <http://localhost:5173/pilot/eiche-form/strecke/>
- Unterseite: <http://localhost:5173/pilot/eiche-form/strecke/fall-14/>
- Drei Richtungen: <http://localhost:5173/pilot/eiche-form/skizzen/>

## Briefing und belegbare Besonderheiten

Fiktive Tischlerei in Lübeck für Altbauten und ausgebaute Dachgeschosse. Besonderheit: Sie kommt vor dem Entwurf zum Aufmaß, zeigt die Abweichungen offen und baut rechtwinklige Möbel, deren Einpassung an die schiefe Wand allein über angerissene Passleisten läuft. Alles ist erfunden und als fiktiv gekennzeichnet. Vollständig in [artefakte/erzeugen.py](artefakte/erzeugen.py).

## Besucheraufgabe und Zielhandlung

Frage des Besuchers: „Geht das bei meinem schiefen Raum überhaupt?“ Zielhandlung: vier Maße eintragen und eine Anfrage stellen, die schon Substanz hat.

## Richtungen

Skizzen: [skizzen/index.html](skizzen/index.html).

| Richtung | Leitidee | Mögliche Schwäche |
|---|---|---|
| A · Die Werkakte | Die Seite ist die Akte eines Falls | Nur ein Fall, wirkt schnell bürokratisch |
| **B · Die Passleiste** | Die Schiefe ist der Anfang, eine keilförmige Leiste nimmt sie auf | Zeichnungen wirken ohne Foto kühler |
| C · Die Stückliste | Die Seite besteht aus den Positionen eines Möbels | Kein Ergebnis zu sehen, kann selbstgefällig wirken |

## Gewählte Richtung und Begründung

**B.** Sie macht als einzige das Unterscheidungsmerkmal selbst zum Bild und führt zur Zielhandlung: Wer die Schiefe verstanden hat, misst seine eigene Nische.

- **Gegen A:** A erzählt den Ablauf gut, spricht aber nur Menschen mit genau diesem Raum an. Der eine durchgängige Fall wurde übernommen.
- **Gegen C:** C ist die mutigste Form, zeigt aber kein Möbel. Privatkunden müssen sich das Ergebnis vorstellen können. Die Holzliste wurde für die Unterseite übernommen.

## Leitidee und sichtbare Konsequenzen

| Entscheidung | Wo sichtbar | Begründung im Briefing |
|---|---|---|
| Überschrift „Gerade Möbel für schiefe Häuser.“ | Einstieg | Positionierung |
| Die Seite ist selbst ein Korpus: rechts läuft eine Wand, dazwischen wird eine Eichenleiste über die Seitenlänge breiter | Jede Seite, Desktop und Mobil | Passleiste als Kernidee |
| Überhöhte Zeichnung mit Schalter auf maßstäblich | Einstieg | Offenheit über Abweichungen |
| Rote Maße wie mit dem Zimmermannsbleistift | Alle Zeichnungen, Eingaben, Holzliste | Aufmaß zuerst |
| Dieselbe Nische in vier Stufen, aus einer Geometrie erzeugt | Abschnitt Fall 14 | Der Standard verlangt zusammenpassende Darstellungen |
| Formular, das die eigene Nische zeichnet; Felder liegen dort, wo die Maße hingehören | Abschnitt Messen | Anfrage mit vier Maßen statt „Wir brauchen einen Schrank“ |
| Besley, eine Clarendon-Schrift | Überschriften | Handwerks- und Schilderschrift aus der Bauzeit der Häuser |
| Keine Beige-Wohnwelt, keine kursive Serife, keine ↗ | Ganze Seite | Negativliste im Markenprofil |

## Individuell entwickelte Bestandteile / wiederverwendete Grundlagen

- **Neu:** Konzept, Texte, Zeichnungsgeometrie, Seitenaufbau, Formularidee, Holzstruktur, Styles.
- **Übernommen:** nur das Muster des lokalen Demo-Ablaufs (Prüfen, Korrigieren, Abschließen). Kein Code aus `src/package-demos/` und keine bestehende Komposition.

## Gestaltungsstrecke

Einstieg, Mittelteil, Zielhandlung und eine repräsentative Unterseite, jeweils Desktop und Mobil. Aufnahmen in [nachweis/](nachweis/). Nur diese beiden Seiten existieren; die übrigen Routen der Demo sind nicht neu gestaltet.

## Bild- und Inhaltsquellen / fehlendes Material

| Material | Herkunft | Rechte |
|---|---|---|
| Alle Zeichnungen | Programmatisch aus [drawings.mjs](strecke/drawings.mjs) | Eigene Arbeit für diese Demo |
| `oak.webp` | Prozedural aus [gen-oak.py](strecke/tools/gen-oak.py), kein Foto | Eigene Arbeit für diese Demo |
| Besley, Barlow | Fontsource 5.3.0 | SIL OFL, Lizenztexte in `strecke/fonts/` |

**Fehlt:** Es gibt keine Fotografie, und im Piloten stand kein Bildgenerator zur Verfügung. Gekennzeichnete KI-Motive wären nach dem Standard zulässig. **Entschieden am 5. November 2026:** Einstieg und letzte Fallstufe zeigen ein lokal erzeugtes Rendering aus den Maßen von Fall 14, gekennzeichnet als „Entwurfsvisualisierung, kein Foto“. Quellen: [strecke/bilder/QUELLEN.md](strecke/bilder/QUELLEN.md), Abwägung: [FOTOFRAGE.md](FOTOFRAGE.md).

`eiche-concept.webp` wurde bewusst nicht verwendet. Seine Geometrie passt nicht zu Fall 14, und die Stühle erinnern stark an einen bekannten Designklassiker (Wishbone Chair). Das sollte auch für die bestehende Demo geprüft werden.

## Verglichene Projekte und Ansichten

Raumgut (Dialog auf der Startseite), Klarblick und Hof & Flamme jeweils mit dem Einstieg bei 1440 px, die bisherige Eiche & Form bei 1024 px. Aufnahmen `nachweis/vergleich-*.jpg`.

**Gemeinsames Muster der drei Paketdemos:** schmale Serife mit kursivem Akzent, ein großes stimmungsvolles Einstiegsbild, ↗-Pfeile. Der neue Entwurf teilt keines davon. Verglichen wurde nur der Einstieg auf dem Desktop; Seitenverlauf und Mobilansicht dieser Demos stehen noch aus.

## Direkter Vergleich mit Raumgut

| Merkmal | Raumgut | Pilot | Einschätzung |
|---|---|---|---|
| Bildkohärenz | Sieben Motive, einheitlich inszeniert | Alle Darstellungen teilen buchstäblich eine Geometrie | Mindestens gleichwertig |
| Proportionen | Ruhig, kompakte Handelsnavigation | Großer Titel, viel Luft, klare Spalten | Vergleichbar |
| Hierarchie | Sehr klar | Sehr klar | Vergleichbar |
| Konkrete Inhalte | Produkt, Material, Preis | Maße, Technik, Holzliste, klare Absagen | Vergleichbar, anders gelagert |
| Details | Ausgearbeiteter Shop-Ablauf | Schriftfeld, Maßketten, Live-Zeichnung; Holzstruktur sichtbar künstlich | Hinter Raumgut |
| **Unmittelbare Wirkung** | Fotografischer Raum, man möchte dort wohnen | Wirkt wie ein Plan, man will es verstehen | **Klar hinter Raumgut, wenn Wohnlichkeit zählt** |

**Eigene Identität:** Nichts von Raumgut ist übernommen. Die Frage, ob der Entwurf nicht nach KI aussieht, kann nur die verantwortliche Person beantworten.

## Prüfkriterien

```text
Bezug zum Unternehmen:      bestanden. Jede prägende Entscheidung führt auf das Briefing zurück (Tabelle oben).
Austausch in der Branche:   bestanden. Für eine normale Tischlerei entfallen Titel, Leiste, Fall 14, Messformular und
                            Absagen. Eine andere Altbau-Tischlerei könnte die Idee übernehmen; das Merkmal ist fiktiv.
Portfoliovergleich:         offen. Keine gemeinsame Komposition mit den drei Demos; die Wirkung neben Raumgut
                            muss die verantwortliche Person beurteilen.
Tragfähigkeit der Idee:     bestanden für die Strecke. Die Leiste läuft bis in die Fußzeile und die Unterseite, auch mobil.
                            Die übrigen Routen sind nicht geprüft.
Bildregie und Inhalt:       überarbeiten. Bildregie stimmig, aber ohne Fotos und mit künstlicher Holzstruktur.
                            Fachsprache und Holzliste sind nicht von einer Fachperson geprüft.
Ausarbeitung und Bedienung: offen. Siehe Prüfstand; kein Screenreader-Test, keine vollständige Abnahme.
```

## Technischer Prüfstand und Grenzen (separat)

**Geprüft im Browser (Chromium, Vite-Entwicklungsserver):**

- Kein horizontaler Überlauf bei 360, 390, 768, 1000, 1024, 1440 und 1920 px auf beiden Seiten. Nach der letzten Umstellung nur für die Startseite und bis 1440 px wiederholt.
- Angesehen: Einstieg bei 360, 390, 768, 1440 px; Fall-Abschnitt und Situationen bei 1440 und 375 px; Messen bei 375, 768, 1440 px; Unterseite bei 375 und 1440 px.
- Formular: Zentimeter-Hinweis, Teileingabe, volle Eingabe, leere Pflichtfelder, ungültige E-Mail, Prüfen, Korrigieren, Abschließen, Neustart, jeweils mit Fokus. Per Skript ausgelöst, nicht von Hand getippt.
- Ohne JavaScript (Sandbox-iframe bei 390 px): Inhalte vollständig, Formular deaktiviert, kein Überlauf.
- Ohne Holzbild: Zeichnungen bleiben lesbar.
- Tastatur: Sprunglink, Reihenfolge Kopf bis Einstieg, sichtbarer Fokus. Nicht die ganze Seite durchlaufen.
- Kontrast rechnerisch: Rot 5,48 auf Papier und 4,61 auf Wand; Grau mindestens 5,41; Platzhalter 5,12.

**Labormessung, nur grobe Orientierung:** Entwicklungsserver, lokal, keine Netzdrosselung.

| Ansicht | LCP | CLS | INP |
|---|---|---|---|
| Startseite Desktop 1440 px | 316 ms | 0,0015 | nicht gemessen |
| Startseite Mobil 375 px | 180 ms | 0,0007 (vor der letzten Umstellung) | nicht gemessen |

Beim Messen fiel ein echter Fehler auf: CLS 0,17 auf dem Desktop, weil das Skript die Zeichnungen nachträglich verschob. Die Bühne steht jetzt schon im HTML. Feldwerte gibt es nicht.

**Nicht geprüft:** reduzierte Bewegung im Browser (nur im CSS umgesetzt), Screenreader, Safari und Firefox, Produktionsbuild. Der Pilot ist bewusst nicht in `site.config.mjs` eingetragen und wird nicht mit ausgeliefert. `npx tsc --noEmit` läuft weiterhin fehlerfrei; die Vitest-Suite wurde nicht ausgeführt, weil `src/` unverändert ist.

## Offene Mängel / nächste Überarbeitung

1. Bildweg ist entschieden (Rendering). Offen bleibt, ob ein KI-Motiv nach [BILDBRIEFING.md](BILDBRIEFING.md) es später ersetzt.
2. Holzstruktur ersetzen: Sie wirkt in großen Flächen synthetisch, auch im Rendering.
3. Fachsprache, Maße und Holzliste von einer Tischlerin oder einem Tischler gegenlesen lassen.
4. Für die Übertragung auf `/demos/business/`: zehn Routen neu denken. `leistungen/kuechen` passt nicht ohne Weiteres zur neuen Positionierung. Hinzu kommen die Vorschaukachel auf der Startseite und die Demo-Hinweise.
5. Vollständige Abnahme nach Übertragung.

```text
Gestalterische Schlussfreigabe:           ausstehend
Freigegebener Stand / Person / Datum:     –
Vereinbarte Kundenfreigabe:               entfällt, fiktives Unternehmen
```

## Aufwand

Zeitstempel der Sitzung am 4. November 2026, **Laufzeit eines KI-Agenten, kein Stundenwert für ein Angebot**.

| Abschnitt | Von | Bis |
|---|---|---|
| Bestand sichten, Briefing, Artefakte | 10:03 | 10:07 |
| Zeichnungs-Engine und Skizzen | 10:07 | ca. 10:13 |
| Umsetzung der Strecke | ca. 10:13 | 10:16 |
| Prüfung und Korrekturen | 10:16 | ca. 10:23 |

Die Abschnitte überlappen teilweise. Tokens und Kosten sind nicht erfasst. Menschlicher Aufwand bisher: eine Entscheidung (Pilot starten). Fachprüfung und Geschmacksurteil stehen noch aus.

## Was der Pilot über die CDE zeigt

Die Artefakte liegen in [artefakte/workspace/](artefakte/workspace/), alle fünf im Status `reviewed`, keines freigegeben.

| Beobachtung | Folge |
|---|---|
| **Hat geholfen:** getrennter Status der Fakten (`proposed`, `inferred`) und die `unknowns`, weil sie zwangen, Erfundenes als solches zu benennen | Behalten |
| **Hat geholfen:** `negativeReferences` wurde direkt zur Gestaltungsregel; `thesisType` `contrast` lieferte die Holzliste | Behalten |
| **Fehlte:** Risiken mussten in `boundaries` ausweichen, ein Feld für Referenzbedarf und Unsicherheit gibt es nicht | Vor weiterer Nutzung ergänzen |
| **Nicht benutzt:** sieben von zehn Artefakttypen, der Score, die Freigabelogik | Vorerst nicht ausbauen |
| **Bestätigt P15:** Der Agent konnte einen Fakt ohne Hürde als `confirmed` anlegen | Bleibt offen |

**Einschätzung:** Die Qualität entstand nicht durch das Datenmodell. Sie entstand durch ein konkretes Merkmal im Briefing, eine gemeinsame Geometrie und wiederholtes Ansehen im Browser, wobei gerade dort die Fehler auffielen. Die drei Artefakte waren als strukturierte Vorlage nützlich; dasselbe leistet vermutlich auch eine gut gebaute Markdown-Vorlage. Ein einzelner Fall beweist das nicht. Ob überhaupt ein Qualitätsgewinn vorliegt, hängt am Urteil oben.
