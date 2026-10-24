# Webbyu

Lokaler, deutschsprachiger Website-Prototyp für die von zwei Gründern aufgebaute Digitalagentur Webbyu in Hamburg / Bad Oldesloe. Vite, TypeScript, Three.js und GSAP; ohne Backend oder externe Laufzeit-APIs.

## Starten

```sh
npm install
npm run dev
```

Die im Terminal ausgegebene lokale URL im Browser öffnen. Die Abhängigkeiten sind in diesem Arbeitsverzeichnis bereits installiert.

Falls der npm-Wrapper auf diesem Windows-System fehlschlägt, direkt starten:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

Danach `http://127.0.0.1:5173/` öffnen. Den Server mit `Strg+C` beenden.

## GitHub Pages

Der Workflow in `.github/workflows/deploy-pages.yml` baut und veröffentlicht bei jedem Push auf `main` oder `dev`. Beide Branches deployen auf dieselbe GitHub-Pages-Adresse; der zuletzt erfolgreiche Lauf ist dort sichtbar. Für ein Repository unter `https://<konto>.github.io/<repository>/` setzt Vite den Projektpfad automatisch. Bei einem User- oder Organisations-Repository namens `<konto>.github.io` bleibt die Adresse auf Root-Ebene.

Im Repository unter **Settings → Pages → Build and deployment** einmal **Source: GitHub Actions** wählen. Danach reicht ein Push auf `main` oder `dev`; der Workflow führt Typecheck, Tests und Produktionsbuild vor dem Deployment aus. Die Deployments verwenden dafür getrennte Environments (`github-pages-main` und `github-pages-dev`), damit eine bestehende Branch-Regel des Standard-Environments `github-pages` den jeweils erlaubten Branch nicht blockiert.

## Prüfen und bauen

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`dist/` enthält den statischen Produktionsbuild. Die Vorschau benötigt einen HTTP-Server; `index.html` nicht direkt als Datei öffnen.

Die gleichen Befehle ohne npm-Wrapper:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173 --strictPort
```

## Aktueller Stand · 23. Oktober 2026

Die bestehende helle Editorial-Seite und dunkle 3D-Galerie verbinden jetzt das Webbyu-Angebot mit dem Business-Konzept des früheren Projekts: Angebote verständlich machen, Anfragen vorbereiten und Geschäftsabläufe vereinfachen. Die weitere 3D-Story folgt später.

Die Galerie enthält vier interaktive Konzepte: **Meisterwerk** (Raumfallbuch und Projektbriefing) ersetzt Klarraum; **Nordlicht** (verzweigter Bedarfscheck) ersetzt Studio Still; **Safran Atelier** bleibt samt Kamerafahrt erhalten. Seit 24. Oktober ersetzt **Raumgut** die zwischenzeitlich ergänzte Solara-Demo: ein Möbelshop mit eigenen Bildern, Suche, kombinierten Filtern, Produktvarianten, Verfügbarkeit, Merkliste, Warenkorb und vollständiger lokaler Bestellvorschau. Details stehen in `REFERENCE_MIGRATION.md` und `RETAILER_DEMO.md`.

Die Safran-Atelier-Demo enthält jetzt die gerenderte 3D-Kamerafahrt aus dem Referenzprojekt: Blüte → rote Narbe → Safranfäden. Unter „Kamerafahrt entdecken“ lässt sie sich durch Scrollen, Abspielen/Pause, Kapitelwahl oder den Positionsregler steuern. Die echte Markenverpackung ist ausgespart. Bei reduzierter Bewegung, Datensparmodus oder fehlender Browserunterstützung bleiben die Kapitel als Bilder zugänglich. Die 201 lokalen Frames (zusammen 2,94 MB) werden bei Bedarf geladen; die Animation pausiert außerhalb der sichtbaren Demo und in inaktiven Tabs.

- Leistungen, Start / Business / Complete, Team, Zusammenarbeit und Kontakt sind über direkte Abschnittslinks erreichbar. Eingaben und Demo-Sitzungen bleiben beim Navigieren erhalten.
- 599 €, 1.099 € und 2.499 € sind **interne Preisentwürfe mit offener Steuerbasis**. Seitenzählung, Zusatzseitenpreise und mehrere Produktionsdetails bleiben abzustimmen. Ablauf und Grenzen sind in aufklappbaren Details beschrieben.
- Foto- und Content-Wünsche fließen in die Paketorientierung ein. Verkauf und Buchung führen zur individuellen Umfangsklärung. Eine manuelle Paketwahl überschreibt das Geschäftsziel nicht; die kopierbare Zusammenfassung enthält Preisstatus und Leistungsabgrenzung.
- Kontaktadressen, Impressum und Datenschutz sind ausdrücklich Platzhalter. Der Finder erstellt ausschließlich ein lokales Briefing.
- AP5, die unabhängige Gesamt-Abnahme, bleibt offen. Die technischen Prüfbelege für AP6 stehen in `WORK_PACKAGES.md`.

Prüfbilder und der responsive Prüfstand liegen lokal in `artifacts/ap6-preview/` und werden nicht von Git erfasst.

## Inhalte und Grenzen

- `src/shell.ts` / `src/content.css`: Seitenstruktur und Darstellung der AP6-Inhalte.
- `src/data.ts`: Ziele, Paketentwürfe, Leistungen, FAQ, Erweiterungen und Konzeptbeschreibungen.
- `src/state.ts`: gemeinsamer, flüchtiger Projektzustand und Paketempfehlungen.
- `src/scene.ts`: 3D-Galerie, explizite Ansichtsmodi und Ersatzdarstellungen.
- `src/demos.ts`: Safran-Demo, gemeinsame Sitzungsverwaltung und Großansicht.
- `src/reference-demos/`: Meisterwerk, Nordlicht und Raumgut mit isolierter Gestaltung und lokalen Abläufen; Bilder in `public/reference-assets/`.
- `src/saffron-journey.ts` / `.css`: Kamera, Scrollführung und Ersatzdarstellung innerhalb der Safran-Demo; Herkunft der Frames in `src/assets/demos/saffron/journey/README.md`.
- `src/finder.ts`: Projektfinder und sichtbare Anfragezusammenfassung.

Alle Konzeptmarken sind fiktive Designstudien. Es werden keine Anfragen verschickt, Termine gebucht oder Bestellungen ausgeführt. Angaben im Projektfinder bleiben ausschließlich im Arbeitsspeicher des geöffneten Browsers und werden beim Neuladen verworfen. Schriften werden lokal ausgeliefert.

Vor Freigabe als geschäftlicher Auftritt müssen Kontaktversand, endgültige Leistungsumfänge und Preise, geschäftliche Angaben sowie rechtliche Inhalte separat ergänzt werden. Der Pages-Workflow veröffentlicht weiterhin nur den lokalen Prototyp ohne Backend.
