# Hof & Flamme · Nachweisblatt

Nachweisblatt nach dem Unikat-Standard (`UNIKAT_STANDARD.md`, nur lokal im Haupt-Checkout). Die Bewertungen sind ein **Vorschlag von Claude**, keine Freigabe.

```text
Projekt / real oder fiktiv:  Hof & Flamme, Restaurant, fiktiv
Stand / Datum / Version:     9. November 2026, Branch claude/track-b-hof-flamme-fa8c1b auf Basis 7ff4d65 (dev)
```

**Ansehen** (bei laufendem `npm run dev`):

- Demo: <http://localhost:5173/demos/complete/>
- Repräsentative Unterseiten: `/demos/complete/speisekarte/`, `/demos/complete/kueche/`, `/demos/complete/kontakt/`
- Skizzen der Richtungen: <http://localhost:5173/pilot/hof-flamme/skizzen/>

## Briefing und belegbare Besonderheiten

Vollständig in [BRIEFING.md](BRIEFING.md). Kurz: Fiktives Restaurant mit einem Herd und einem Tisch für 22. Der Herd wird einmal am Tag geheizt und danach nicht mehr nachgelegt; die Karte folgt der fallenden Hitze.

## Besucheraufgabe und Zielhandlung

Fragen: Was bekomme ich, was kostet es, geht das für uns, ist etwas frei? Zielhandlung: Für einen bestimmten Abend einen Platz anfragen, in zwei Sätzen.

## Richtungen

Skizzen: [skizzen/index.html](skizzen/index.html).

| Richtung | Leitidee | Einstieg, Mittelteil, mobil | Mögliche Schwäche |
|---|---|---|---|
| **A · Das Feuer fällt** | Die Karte folgt einem Feuer, das kälter wird. Eine Kurve erzeugt Reihenfolge, Schrift und Farbe. | Plakat mit fallendem Hügel; vier Papierfarben mit fallender Schrift; mobil dieselbe Folge untereinander | Laut; fachliche Annahmen über den Herd tragen viel |
| B · Die lange Tafel | Die Seite ist der Tisch von oben, Gang für Gang wird gedeckt. | Tisch im Hochformat; Teller erscheinen beim Scrollen; mobil ein schmaler langer Tisch | Wieder „die Seite ist ein Ding von oben nach unten" wie Klarblick; braucht gezeichnetes Essen |
| C · Der Wochenzettel | Die Seite ist der Zettel, den die Gastgeber jede Woche schreiben. | Datum, Brieftext, Liste; mobil unverändert | Wenig zum Erinnern, nah an der Werkakte von Eiche & Form; Daten veralten |

## Gewählte Richtung und Begründung

**A.** Nur hier wird der Name zu einer Arbeitsweise: Die Flamme bestimmt, was wann auf den Tisch kommt. Aus einer einzigen Zahl entstehen Kartenfolge, Schriftgröße, Schriftstärke und Papierfarbe. Die übrigen Webbyu-Demos haben diese Mechanik nicht.

- **Gegen B:** Zeigt das Teilen, aber keinen Grund, warum dieses Restaurant anders kocht. Zu nah an Klarblicks Hausfront. Übernommen: der Tischplan mit Zonen.
- **Gegen C:** Trägt die Stimme, aber kein Bild. Übernommen: der Gastgeberton und die Liste „Diese Woche".

## Leitidee und sichtbare Konsequenzen

„Wir kochen, bis das Feuer aus ist."

| Entscheidung | Wo sichtbar | Begründung im Briefing |
|---|---|---|
| Überschrift wird von Zeile zu Zeile kleiner und dünner | Einstieg | Das Feuer lässt nach |
| Eine berechnete Kurve (Newtonsches Abkühlen, `hof/feuer.ts`) | Hügel im Einstieg, Karte, Feuerbuch, Startseitenkacheln | Dieselbe Geometrie überall |
| Schriftgröße und -stärke aus `--t` | Hitzenamen, Gerichte, Seitenköpfe, Karte | Hitze als Typografie |
| Papier läuft Gelb, Rot, Grau, Knochen, Kalt (Fuß) | Ganze Seite | Farben eines Feuers, nicht eines dunklen Lokals |
| Karte nach Uhrzeit und Hitze statt nach Gängen | Speisekarte | Die eigentliche Besonderheit |
| Mitlaufende Zeile mit Uhrzeit und Grad | Startseite, nur mit Script | Beim Scrollen läuft der Abend ab |
| Feuerbuch vom Ausfegen bis zum Schluss | Der Herd | Konkrete Arbeitsweise |
| Tischplan mit Tür, Mitte, Herd; dieselben Plätze im Formular | Startseite, Kontakt | Der gemeinsame Tisch |
| Grundriss des Hallenhauses | Das Haus | Warum „Hof", und warum der Herd hinten steht |
| Anfrage als Satz | Kontakt | Der Ton: zwei Sätze reichen |
| Bilder als einfarbiger Rasterdruck | Überall | Hält fremdes Material zusammen, ohne Fotos zu behaupten |

## Individuell entwickelte Bestandteile / wiederverwendete Grundlagen

- **Neu:** Konzept, Texte, Kurvenmodell, Karte, Pläne, Rasterdrucke, Styles, Formularidee. Alte Startseite (`homes.ts`) und `hof-pages.css` sind entfernt, die Hof-Regeln aus `identities.css` ebenfalls.
- **Übernommen:** Lokaler Formularablauf und Bildvergrößerung aus `main.ts`, Demoleiste, Menü, Instrument Sans aus dem Bestand.
- **Außerhalb der eigenen Dateien geändert:** `src/ai-media.ts` (eine Zeile, damit die neuen KI-Ableitungen als KI erkannt werden) und `scripts/create-package-demo-entries.mjs` (Vorladen der Schrift).

## Gestaltungsstrecke

Einstieg, vier Hitzen, Tisch, Fragen und Anfrage sowie die Unterseiten Karte, Herd, Bilder, Haus, Kontakt und Hinweise, im tatsächlichen Stand. Desktop und Mobil. Screenshots wurden im Browser-Fenster angesehen, aber nicht als Dateien abgelegt.

## Bild- und Inhaltsquellen / fehlendes Material

| Material | Herkunft | Rechte |
|---|---|---|
| `hof-ki-*.webp` | Ausschnitte aus `hof-concept.webp` (OpenAI ImageGen, 3.11.2026), [tools/druck.py](tools/druck.py) | KI-generiert, auf der Seite gekennzeichnet |
| `hof-foto-rost.webp`, `hof-foto-reichen*.webp` | Unsplash-Stock aus dem früheren Stand, bearbeitet | Unsplash-Lizenz; Fotografen sind weiterhin nicht zuverlässig ermittelt |
| `hof-film.mp4`, `hof-film.webp` | Pexels, Rene Terp, Ausschnitt, einfarbig | Pexels-Lizenz |
| Kurven, Tisch, Grundriss, Zeichen, Kachelbild | Programmatisch in `hof/feuer.ts` | Eigene Arbeit für diese Demo |
| Instrument Sans | Bestand | SIL OFL |

**Fehlt:** Eine zusammenhängende eigene Bildserie. Die Bilder stammen aus drei Quellen und zeigen nicht denselben Tisch. Ein Bildgenerator stand nicht zur Verfügung, und ein Download neuer Motive war nicht abgesprochen. Für ein echtes Projekt braucht es Aufnahmen vom Herd und vom Tisch.

## Verglichene Projekte und Ansichten

Raumgut (`artifacts/raumgut/raumgut-desktop.png`, `raumgut-mobile-sortiment.png`). Eiche & Form und Klarblick nur als Kacheln auf der Webbyu-Startseite bei 1440 px sowie im Quelltext; deren Seitenverlauf wurde nicht neu durchgesehen. Vom alten Hof-Stand nur Quelltext und Einstiegsbild.

**Gemeinsame Muster:** Keine gemeinsame tragende Komposition erkennbar. Geteilt werden die Webbyu-Demoleiste, der lokale Formularablauf und das Prinzip, dass eine Eingabe in der Zielhandlung etwas bewirkt; Hof zeichnet dabei bewusst nichts, die Anfrage bleibt ein Satz. Wie Klarblick ist die Seite laut und flächig, aber ohne Metapher eines Gegenstandes.

## Direkter Vergleich mit Raumgut

| Merkmal | Raumgut | Hof & Flamme | Einschätzung |
|---|---|---|---|
| Bildkohärenz | Einheitliche fotografische Motive | Einheitlicher Druck aus uneinheitlichen Quellen | Formal stimmig, inhaltlich schwächer |
| Proportionen | Ruhig, kompakte Handelsnavigation | Plakativ, sehr große Schrift, die zur Ruhe kommt | Andere Spannung, weniger ruhig |
| Hierarchie | Sehr klar | Klar; Zeit, Temperatur, Gericht, Menge wiederholen sich | Vergleichbar |
| Konkrete Inhalte | Produkt, Material, Preis | Gericht, Uhrzeit, Grad, Menge, Preis, freie Plätze | Vergleichbar |
| Details | Ausgearbeiteter Shop-Ablauf | Kurve, Feuerbuch, Grundriss, Satzformular | Bei den Abläufen hinter Raumgut |
| **Unmittelbare Wirkung** | Man möchte dort wohnen | Man erinnert sich an den Satz | **Andere Wirkung, weniger wertig, dafür sehr eigen** |

**Eigene Identität:** Von Raumgut ist nichts übernommen. Ob der Entwurf „nicht nach KI aussieht", kann nur die verantwortliche Person beurteilen.

## Prüfkriterien (Vorschlag)

```text
Bezug zum Unternehmen:      bestanden. Jede prägende Entscheidung führt auf den einmal geheizten Herd zurück.
Austausch in der Branche:   bestanden. Ohne die fallende Hitze entfallen Überschrift, Karte, Kurve, Schriftlogik
                            und Feuerbuch. Ein anderes Holzfeuer-Restaurant könnte die Idee nur mit derselben
                            Arbeitsweise übernehmen; das Merkmal ist fiktiv.
Portfoliovergleich:         offen. Eiche & Form und Klarblick wurden nicht im Seitenverlauf neu verglichen.
                            Die Wirkung neben Raumgut muss die verantwortliche Person beurteilen.
Tragfähigkeit der Idee:     bestanden. Kurve und Hitzelogik tragen Karte, Herd und Kacheln; mobil dieselbe Folge.
                            Kontakt und Hinweise bleiben einfacher.
Bildregie und Inhalt:       überarbeiten. Der Druck hält die Bilder zusammen, aber sie erzählen keinen Abend:
                            Der Tisch wechselt, das Rost-Bild zeigt Spieße statt Kohl und Lamm, der Film zeigt
                            eine Gasflamme, obwohl das Haus keine hat (auf der Seite offengelegt).
                            Fachangaben zu Temperaturen sind nicht von einer Fachkraft geprüft.
Ausarbeitung und Bedienung: offen. Siehe Prüfstand; kein Screenreader-Test, keine vollständige Tastaturrunde.
```

## Technischer Prüfstand und Grenzen (separat)

**Ausgeführt:**

- `npm run typecheck`, `npm test` (240 Tests in 21 Dateien), `npm run build`, `node scripts/verify-package-demos.mjs dist /` („Verified 19 demo pages, assets, noindex and sitemap exclusion at /"). Abschlussstand siehe Commit.

**Geprüft im Browser (Chromium im Browser-Fenster, Vite-Entwicklungsserver, Port 5175):**

- Kein horizontaler Überlauf auf allen sieben Hof-Routen bei 360, 390, 768 und 1440 px, gemessen per Skript (`scrollWidth` gegen `clientWidth`, plus Elemente außerhalb des Fensters). Die eine Auffälligkeit bei 360 px im Feuerbuch ist behoben.
- Angesehen bei 1440 px: Einstieg, Flamme, Glut, Asche, Restwärme, Tisch, Fragen, Karte, Herd, Haus, Kontakt, Bilder, Webbyu-Startseite. Bei 390 px: Einstieg, Hitzen, Tisch, Karte, Herd, Bilder, Haus, Kontakt, Hinweise. Bei 768 px: Einstieg.
- Anfrage per Skript bei 1440 px: Abend wählen, Prüfen mit Abend, Personen und Platz, Fokus auf die Prüfung, Abschließen; keine neuen Netzwerkanfragen. Nicht von Hand getippt.
- Bildvergrößerung per Skript geöffnet und geschlossen, Fokus zurück auf das Bild. Film lädt (406 × 500, 8 s). Fleisch-Schalter tauscht das Lamm gegen den Kürbis. Vier KI-Kennzeichnungen in der Bildreihe.
- Keine Fehler in der Browserkonsole.
- Kontrast rechnerisch: Text auf Rot 4,9 : 1, auf Gelb und Grau deutlich höher.

**Nicht geprüft:** Screenreader, Safari und Firefox, vollständige Tastaturrunde, Anzeige ohne JavaScript im Browser, Medienausfall. LCP, INP und CLS wurden nicht gemessen; Feldwerte gibt es nicht. Reduzierte Bewegung: Die Seite hat keine Animation, nur die mitlaufende Zeile.

## Offene Mängel / nächste Überarbeitung

1. Bildserie: ein Tisch, ein Herd, eine Folge. Das ist der größte Abstand zu Raumgut.
2. Die Wirkung neben Raumgut beurteilen: Trägt ein so lauter Einstieg für ein Restaurant?
3. Temperaturen und Abläufe von jemandem gegenlesen lassen, der am Holzfeuer kocht.
4. Tastaturrunde und Screenreader prüfen.
5. `src/journey/data.ts` und der Abschnitt zu Hof & Flamme in `PACKAGE_DEMOS.md` beschreiben noch die alte Fassung.
6. Fotografen der Unsplash-Bilder vor einer realen Veröffentlichung nachtragen.

```text
Gestalterische Schlussfreigabe:           ausstehend
Freigegebener Stand / Person / Datum:     –
Vereinbarte Kundenfreigabe:               entfällt, fiktives Unternehmen
```

## Aufwand

Laufzeit eines KI-Agenten am 9. November 2026, **kein Stundenwert für ein Angebot**. Abschnitte sind nicht getrennt erfasst, Tokens und Kosten nicht erfasst.
