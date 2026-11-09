# Eiche & Form · Bildbriefing für KI-Motive

Für ein Bildwerkzeug, das Referenzbilder annimmt (zum Beispiel das bei Raumgut verwendete ImageGen). Im Piloten selbst stand keins zur Verfügung; deshalb wurde hiervon noch nichts erzeugt oder geprüft.

**Referenzbild:** `strecke/bilder/fall14-render.webp` immer mitgeben. Es hält Aufbau und Proportionen fest; das Bildwerkzeug soll nur Material, Licht und Glaubwürdigkeit verbessern.

## Motiv 1: Einstieg

```text
Use the attached image as a strict composition and geometry reference. Keep the camera position, the straight verticals and every proportion of the furniture exactly as shown.

Photorealistic architectural photograph of a fictional built-in hallway wardrobe in a German apartment building from 1908. Solid oiled European oak with quiet straight grain. Set into a wall niche, flush between old plaster walls: two doors above; an open centre section with a horizontal rail holding five small black hooks; a removable vertical oak panel on the right of the open section; a bench with two drawers below, each with a narrow recessed black pull. Slightly tapered scribed oak strips between cabinet and wall on both sides, narrow at the top and wider at the bottom. Old limewashed plaster with subtle unevenness, painted skirting board, wide worn floorboards. Soft late-afternoon sunlight from a mullioned window out of frame on the left casts long window-bar shadows across the wall and furniture.

Quiet, precise, unstyled. Two folded wool blankets on the bench, nothing else. No people, no text, no logos, no watermark, no plants, no vases, no designer chairs. Not a 3D render.
```

## Motiv 2: Detail Passleiste

Referenz: `strecke/bilder/fall14-detail.webp`, falls erzeugt, sonst Motiv 1.

```text
Photorealistic close-up architectural detail, same oak and plaster as the reference. The lower right corner of a built-in oak cabinet meeting an old, slightly uneven plaster wall. Between cabinet and wall runs a hand-scribed oak strip about 28 mm wide whose edge follows the small bumps of the plaster exactly, with no gap and no silicone. Painted skirting board below. Raking daylight from the left shows the texture. Shallow depth of field. No people, no text, no logos, no watermark.
```

## Motiv 3: Im Gebrauch, nur wenn Motiv 1 überzeugt

```text
Same wardrobe, same camera and same light as the attached reference. Now in use: a dark wool coat and a canvas bag on the hooks, a pair of worn leather shoes under the bench. Nothing else changes. No people, no text, no logos, no watermark.
```

## Abnahme jedes Motivs

Ein Motiv wird verworfen, wenn eines davon nicht stimmt:

- [ ] Zwei Türen oben, offener Mittelteil, Bank, zwei Schubkästen, wie in `strecke/drawings.mjs`
- [ ] Genau fünf Haken auf einer durchgehenden Leiste
- [ ] Senkrechte bleiben senkrecht, die Tür-Mittelfuge liegt mittig
- [ ] Griffe, Fugen und Maserung sind beim Heranzoomen plausibel
- [ ] Holz, Putz und Licht passen zu den anderen Motiven
- [ ] Keine erkennbaren Designklassiker, Marken, Texte oder Personen

## Kennzeichnung und Nachweis

- Auf der Seite als „KI-Visualisierung, kein echtes Projekt“ ausweisen. Die Demo-Hinweise ergänzen.
- Modell, Datum und Prompt in `strecke/bilder/QUELLEN.md` festhalten, wie bei `src/reference-demos/raumgut/ASSETS.md`.
- Nur fiktive Inhalte verwenden. Keine Kundenfotos oder Grundrisse echter Wohnungen in das Werkzeug laden.

## Einbau

Datei als `strecke/bilder/fall14-render.webp` ablegen (900 × 1125 px, sonst `width` und `height` in `build.mjs` anpassen) und den Hinweistext „Entwurfsvisualisierung“ durch „KI-Visualisierung“ ersetzen. Das Original des Renderings vorher umbenennen. Das Bild erscheint dann im Einstieg und in der letzten Fallstufe.
