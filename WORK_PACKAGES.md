# Webbyu – Redesign delivery protocol

## Accepted objective

German local-only studio prototype: a light editorial page with a dark interactive 3D demo gallery. Instrument Sans for UI/body and Instrument Serif for large headings and genuine italic accents, locally served with licenses. Palette: ivory #F5F1EA, ink #241D26, aubergine #513448, gallery #151419, champagne #C7B29A. Body text >=16px, functional labels >=12px. Use a compact typographic introduction, generous dark gallery, clear services/process/finder, restrained contours and considered lighting.

Three fictional concepts remain: Klarraum (inquiries), Studio Still (bookings), Forma (sales). They are interactive local simulations, not real transactions. No backend, deployment, accounts or style configurator in this release.

## Delivery state

- Baseline: `693826b` (original prototype, initial Git commit).
- Integration branch: `codex/webbyu-redesign`.
- Baseline verification: TypeScript, 32 tests and production build pass. Lazy 3D chunk about 646 kB / 183 kB gzip; known Vite warning.
- Source checkout is the integration workspace. `master` preserves the original baseline until full acceptance.

| Package | Owner | State | Base/result |
| --- | --- | --- | --- |
| AP0 baseline and protocol | Coordinator | accepted | 693826b |
| AP1 foundation | Foundation chat | pending | — |
| AP2 editorial page | Editorial chat | pending | accepted AP1 |
| AP3 catalogue and demos | Catalogue chat | pending | accepted AP1 |
| AP4 3D gallery | Scene chat | pending | accepted AP1 |
| AP5 independent QA | QA chat + coordinator | pending | integrated AP2–AP4 |

## Workflow and ownership

One separate Codex chat/worktree per AP1–AP4 and a fifth separate QA chat. AP1 runs first. AP2/AP3/AP4 start from the identical accepted foundation commit and run in parallel. Coordinator integrates AP3, AP4, AP2 in that order, then QA reviews the exact candidate. No package merges itself into the integration branch. All code changes must be committed before handoff, with SHA, test results and known limits.

Atomicity: accept or reject a whole package commit set. Consistency: shared contracts, targeted checks, full test/build checks on integration. Isolation: separate worktrees and exclusive file ownership. Durability: Git commits and this handoff record. Failed candidates stay isolated. Reverts operate on complete packages, never destructive resets of others' work.

After AP1:
- AP2 owns shell markup, page CSS, finder CSS and shell-specific tests/assets.
- AP3 owns catalogue implementation/CSS/tests, demos implementation/CSS/tests and demo assets.
- AP4 owns scene implementation/CSS/tests and scene assets.
- Coordinator owns main wiring/integration tests, shared contracts/data/state/finder logic, dependency manifests and this protocol. Changes to these need coordinator integration, not concurrent editing.
- Shared dependencies/tokens are frozen after AP1; report required changes to the coordinator in the handoff.

## Foundation and contracts

AP1 extracts markup into `renderPage(root): PageMounts`, installs/serves Instrument fonts and license files, creates shared tokens and shared types, and adapts existing code into working initial implementations. Do not hand off unimplemented stubs. Keep all original functional tests or justified equivalents passing.

`PageMounts` contains `story`, `scene`, `demoSlot`, `catalogue`, `finder` DOM nodes. The catalogue mount contains the controls; the persistent demoSlot is the DOM surface passed to the scene. No dependency of the scene on shell selectors or catalogue controls.

`SceneMode = 'presentation' | 'layers' | 'interactive'`.

`CatalogueState = { goal: DemoGoal; mode: SceneMode }`.

`initScene({ container, demoElement }): Promise<SceneController>`; controller has `setGoal(goal)`, `setMode(mode)`, `dispose()`.

`mountCatalogue({ container, demoSlot, onStateChange, onProjectRequest }): CatalogueController`; controller has `getState()`, `selectGoal(goal)`, `open(goal?)`, `dispose()`.

Preserve `createDemo(goal, { interactive? }): HTMLElement`. Cache a single live demo per goal and reparent it between stage and dialog. Scene projects/manages the persistent slot, not the individual demo lifetime. Dialog must restore the live demo and layout class after close. Noninteractive decorative previews must not become alternative live sessions.

Initial state is inquiries/presentation. Selection preserves mode. Main replays latest getState() after asynchronous scene loading. Only onProjectRequest updates the project brief goal and clears selectedPackage; other answers remain. Catalogue exploration never mutates the brief.

## Required experience

- Labelled concept entries show name, goal and position, immediately selectable.
- “Demo ausprobieren” sets interactive mode: front-facing, HTML enabled and never disabled by scrolling.
- “Aufbau ansehen” sets layers mode explicitly. Remove mandatory 250svh scroll progression; no scroll hijacking.
- “Groß öffnen” opens the same session in a dialog, with focus/scroll restoration.
- “So etwas für mein Projekt” explicitly hands the selected goal to the finder.
- Distinct, deep inquiry validation, booking selection and product variant/cart experiences.
- Responsive HTML retains full functionality on mobile, reduced motion and WebGL failure/context loss. Keep sensible fallback even if the scene import fails.
- Pause scene rendering offscreen/in hidden tabs and retain lazy loading. No autoplay catalogue cycling.

## Acceptance

Run typecheck, targeted tests and production build for packages; coordinator runs full suite on each integration. QA checks 360/390/768/1024/1440 widths, readable typography, contrast, touch targets, no horizontal overflow and accurate CSS3D alignment.

Verify immediate try; cached form/booking/cart state across selection, dialog and resize; no brief mutations from browsing; explicit goal handoff preserves other answers; Escape inner-panel-first then dialog; focus restore; reduced motion; unavailable WebGL and context loss; import failure; no duplicate listeners/renderers on disposal; no console errors. Record bundle size/warnings honestly. Browser screenshots belong in ignored artifacts, not Git.

## Handoffs and verification history

- 2026-10-20: AP0 baseline created. Previous approval attempt had not executed due to a usage-limit review failure; retry succeeded. No source changes before baseline.
