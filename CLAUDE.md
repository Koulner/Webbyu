# Webbyu

Website von Webbyu (Vite, TypeScript, kein WordPress, kein Baukasten) mit Projektfinder, Paket-Demos, 3D-Reise und PHP-Anfrage-Backend auf IONOS. Sprache in Texten und Kommunikation: Deutsch.

## Harte Regeln

- **Das Repo ist öffentlich.** Interne Preise, Kalkulationen, Übergaben und Geschäftsnotizen nie committen. Sie liegen nur lokal und sind über `.git/info/exclude` ausgeschlossen.
- Kein Push, kein Deploy, kein Live-Versand einer Anfrage ohne ausdrückliche Freigabe im Chat.
- Fremde Arbeitsstände nicht zurücksetzen oder überschreiben. Ein Schreiber pro Dateigruppe.
- Keine erfundenen Referenzen, Kunden, Zahlen oder Erfolgsversprechen. Konzeptstudien, Eigenprojekte und Kundenarbeiten klar trennen.
- In Konzepten Fakt, Nutzerentscheidung, Vorschlag und Annahme getrennt kennzeichnen.
- Privacy by Design, Security by Design, Local First. Berechnungen im Finder laufen lokal; Versand bleibt eine bewusste Handlung.
- Individuelle Gestaltung nach Unikat-Standard, Raumgut ist der einzige bestätigte Qualitätsanker. Keine Selbstabnahme: Die gestalterische Schlussfreigabe gibt der Nutzer.

## Befehle

```bash
npm run typecheck
npm test
npm run build
npm run test:backend
npm run test:deploy
```

Einzelne Tests: `npm test -- src/finder.test.ts`. Demos prüfen nach dem Build: `node scripts/verify-package-demos.mjs dist /` (in Git Bash mit `MSYS_NO_PATHCONV=1` davor, sonst wird `/` zum Windows-Pfad). Neuer Worktree: zuerst `npm ci --silent`. `test:backend` braucht PHP (`PHP_BIN`), das auf diesem Rechner fehlt.

## Dateikarte

| Bereich | Dateien |
|---|---|
| Einstieg und Seitengerüst | `src/main.ts`, `src/shell.ts`, `src/home*` |
| Projektfinder | `src/finder.ts`, `src/state.ts`, `src/data.ts` |
| Anfrage | `src/inquiry-contract.ts`, `src/inquiry-client.ts`, `backend/src/Input.php`, `backend/src/IonosTransport.php` |
| Paket-Demos | `src/package-demos/` (`eiche/` ist das Muster), `package-demo-pages.mjs`, `public/package-demos/sources.json` |
| Referenz-Demos und Reise | `src/reference-demos/`, `src/journey/` |
| SEO | `src/seo/`, `site.config.mjs`, `scripts/seo-html.mjs` |
| Rechtliches | `impressum/`, `datenschutz/`, `src/privacy.ts` |
| Deployment | `deploy/ionos.htaccess`, `scripts/prepare-ionos.mjs`, `scripts/verify-ionos.mjs` |

Der Anfragevertrag ist strikt: Neue Felder müssen in Vertrag, Backend-Prüfung, Mail-Darstellung, Duplikatschutz und Tests zusammenpassen. Browserpreise nie als verbindlich übernehmen.

## Branches

`prod` ist live und enthält seit 9.11.2026 den Stand von `dev` (Merge f479962). Neue Arbeit von `prod` abzweigen. Der Anfrageversand ist live seit 9.11.2026 abgeschaltet (a156e01); wieder einschalten nur mit dem neuen Projektberater und ausdrücklicher Freigabe.

## Lokale Dokumente

Nur im Haupt-Checkout vorhanden. Aus einem Worktree unter `.claude/worktrees/<name>/` erreichbar über `../../../`.

| Thema | Datei |
|---|---|
| Angebot, Preise, Projektberater-Spezifikation (Abschnitt 8) | `ANGEBOT_KALKULATION_V2.md` |
| Gestaltungsstandard | `UNIKAT_STANDARD.md`, `MASTER_PROMPT_WEBDESIGN.md` |
| Demo-Stände | `PACKAGE_DEMOS.md` |
| SEO | `SEO_BETRIEB.md`, `SEO_STATUS_2026-11-03.md` |

Lange Dokumente nur abschnittsweise lesen (`offset`/`limit`), nicht komplett.

## Arbeitsweise

- Während der Arbeit gezielte Tests, die volle Suite nur vor dem Commit, Ausgaben kürzen.
- Browser: `read_page` statt Screenshots. Screenshots verkleinert und nur für Gestaltungsprüfungen.
- Keine Subagents ohne ausdrücklichen Bedarf.
