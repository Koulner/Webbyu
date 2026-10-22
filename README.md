# Webbyu

Lokaler, deutschsprachiger Website-Prototyp für ein unabhängiges Webdesign-Atelier. Vite, TypeScript, Three.js und GSAP; ohne Backend oder externe Laufzeit-APIs.

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

## Geprüfter Stand · 19. Oktober 2026

- TypeScript-Prüfung und Produktionsbuild erfolgreich; 32 Tests in 5 Dateien bestanden.
- Desktop-Scrollgeschichte mit Ebenen, interaktiver HTML-Demo, Rückwärtsscrollen und Zielerhalt geprüft. Ab 999 px Breite abwärts wechselt der Hero in ein statisches, bedienbares Layout.
- Browserprüfung bei 360, 390, 768, 1024 und 1440 px Breite: responsive Darstellung, Zielübergabe, Paketwahl und Finder; kein horizontaler Seitenüberlauf in den geprüften Zuständen.
- Drei Konzeptdemos einschließlich Formularvalidierung, Terminwahl, Varianten, Warenkorbmengen, Fokus, Escape und mobilem Dialog-Scrollreset geprüft.
- Finder einschließlich exklusiver „Unsicher“-Auswahl, Rücknavigation mit Eingabeerhalt, manueller Paketwahl und lokaler Zusammenfassung geprüft.
- Reduced Motion, WebGL-Initialisierungsfehler und Kontextverlust sind automatisiert geprüft; diese Fehlerzustände wurden nicht im echten Browser erzwungen. Die Browserprüfung verwendet simulierte Bildschirmgrößen, keine realen Mobilgeräte.
- Die Browserkonsole zeigte bei der abschließenden Produktionsvorschau keine Fehler oder Warnungen.

Vite meldet für das separat nachgeladene 3D-Modul eine Größenwarnung (ca. 646 kB, komprimiert ca. 183 kB). Der Build ist erfolgreich; die Größenwarnung bleibt als bekannte Grenze bestehen.

Prüfbilder liegen lokal in `artifacts/` und werden nicht von Git erfasst.

## Inhalte und Grenzen

- `src/data.ts`: Ziele, Pakete, Erweiterungen und Konzeptbeschreibungen.
- `src/state.ts`: gemeinsamer, flüchtiger Projektzustand und Paketempfehlungen.
- `src/scene.ts`: 3D-Rahmen, Scrollgeschichte und Ersatzdarstellungen.
- `src/demos.ts`: drei fiktive, lokal bedienbare Konzeptarbeiten.
- `src/finder.ts`: Projektfinder und sichtbare Anfragezusammenfassung.

Alle Konzeptmarken sind fiktive Designstudien. Es werden keine Anfragen verschickt, Termine gebucht oder Bestellungen ausgeführt. Angaben im Projektfinder bleiben ausschließlich im Arbeitsspeicher des geöffneten Browsers und werden beim Neuladen verworfen. Schriften werden lokal ausgeliefert.

Vor einer öffentlichen Veröffentlichung müssen Kontaktversand, endgültige Leistungsumfänge und Preise, geschäftliche Angaben sowie rechtliche Inhalte separat ergänzt werden. Der Pages-Workflow veröffentlicht weiterhin nur den lokalen Prototyp ohne Backend.
