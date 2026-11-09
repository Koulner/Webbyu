# Pilot Eiche & Form

Eigenständiger Gestaltungsversuch nach [UNIKAT_STANDARD.md](../../UNIKAT_STANDARD.md). Nicht in `site.config.mjs` eingetragen und damit nicht Teil des Builds. Ergebnis und Bewertung: [NACHWEISBLATT.md](NACHWEISBLATT.md).

| Ordner | Inhalt |
|---|---|
| `artefakte/` | Briefing, Markenprofil und drei Thesen als CDE-01-Artefakte |
| `skizzen/` | Drei Richtungen zum Vergleich |
| `strecke/` | Gestaltungsstrecke: Startseite und Unterseite Fall 14 |
| `nachweis/` | Aufnahmen und Vergleichsansichten |

## Ansehen

```bash
npm run dev
```

Dann die Übersicht <http://localhost:5173/pilot/eiche-form/> öffnen. Zur Bildentscheidung: [FOTOFRAGE.md](FOTOFRAGE.md).

## Neu bauen

`index.html` und `fall-14/index.html` werden erzeugt. Änderungen gehören in `strecke/build.mjs`, `strecke/drawings.mjs` und `strecke/style.css`.

```bash
node pilot/eiche-form/strecke/build.mjs
```

```bash
node pilot/eiche-form/skizzen/build.mjs
```

Das Rendering wird mit `strecke/tools/render.py` erzeugt. Es braucht NumPy und Pillow, die bewusst keine Projektabhängigkeit sind.

Alle Zeichnungen entstehen aus `FALL14` in `strecke/drawings.mjs`. Ändert sich dort ein Maß, ändern sich Zeichnungen, Texte und Holzliste mit.
