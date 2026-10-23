import { concepts, type DemoId } from './data';
import type { CatalogueController, CatalogueOptions, CatalogueState, SceneMode } from './contracts';
import { createDemo, disposeDemo, mountDemoDialog } from './demos';
import './catalogue.css';

const modes: SceneMode[] = ['presentation', 'layers', 'interactive'];

/** Owns the live demo sessions. The scene only receives the persistent slot. */
export function mountCatalogue(options: CatalogueOptions): CatalogueController {
  const { container, demoSlot, onStateChange, onProjectRequest } = options;
  let state: CatalogueState = { goal: 'meisterwerk', mode: 'presentation' };
  let disposed = false;
  const cache = new Map<DemoId, HTMLElement>();
  const syncLayout = () => {
    for (const demo of demoSlot.querySelectorAll<HTMLElement>(':scope > .demo')) {
      demo.classList.toggle('demo--responsive', demoSlot.classList.contains('demo--responsive'));
    }
  };
  const dialog = mountDemoDialog({ onRestore: syncLayout });

  container.classList.add('catalogue');
  container.innerHTML = `
    <div class="catalogue-concepts" role="group" aria-label="Konzept auswählen">
      ${concepts.map(concept => `<button type="button" class="catalogue-concept" data-catalogue-goal="${concept.goal}" aria-pressed="${concept.goal === state.goal}"><span class="catalogue-position">${concept.number} / ${String(concepts.length).padStart(2, '0')}</span><strong>${concept.name}</strong><span class="catalogue-goal">${concept.tags[0]}</span><span class="catalogue-description">${concept.solution}</span><span class="catalogue-selection-mark" aria-hidden="true">↗</span></button>`).join('')}
    </div>
    <div class="catalogue-toolbar">
    <div class="catalogue-modes" role="group" aria-label="Ansicht der Konzeptdemo">
      <button type="button" data-scene-mode="interactive" aria-pressed="false">Demo ausprobieren</button>
      <button type="button" data-scene-mode="layers" aria-pressed="false">Aufbau ansehen</button>
      <button type="button" data-scene-mode="presentation" aria-pressed="true">Präsentation</button>
    </div>
    <div class="catalogue-actions">
      <button type="button" data-open-current>Groß öffnen <span aria-hidden="true">↗</span></button>
      <button type="button" data-project-request>So etwas für mein Projekt <span aria-hidden="true">↗</span></button>
    </div>
    </div>
    <div class="catalogue-context" aria-live="polite"></div>
    <p class="catalogue-status" role="status" aria-live="polite"></p>
  `;

  function currentDemo(): HTMLElement {
    let demo = cache.get(state.goal);
    if (!demo) {
      demo = createDemo(state.goal);
      cache.set(state.goal, demo);
    }
    return demo;
  }

  function renderState(): void {
    container.querySelectorAll<HTMLButtonElement>('[data-catalogue-goal]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.catalogueGoal === state.goal));
    });
    container.querySelectorAll<HTMLButtonElement>('[data-scene-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.sceneMode === state.mode));
    });
    const concept = concepts.find(concept => concept.goal === state.goal)!;
    const name = concept.name;
    container.querySelector('.catalogue-context')!.innerHTML = `<p><span>Die Aufgabe</span>${concept.problem}</p><p><span>Die Lösung</span>${concept.solution}</p>`;
    const label = state.mode === 'interactive' ? 'Direkt ausprobieren. Ihre Eingaben bleiben beim Konzeptwechsel erhalten.' : state.mode === 'layers' ? 'Aufbau ansehen. Zum Bedienen „Demo ausprobieren“ wählen.' : 'Präsentation. Mit „Demo ausprobieren“ starten Sie die lokale Simulation.';
    container.querySelector('.catalogue-status')!.textContent = `${name} · ${label}`;
  }

  function notify(): void {
    renderState();
    onStateChange({ ...state });
  }

  function selectGoal(goal: DemoId): void {
    if (disposed || state.goal === goal) return;
    dialog.close();
    state = { ...state, goal };
    demoSlot.replaceChildren(currentDemo());
    syncLayout();
    notify();
  }

  function open(goal = state.goal): void {
    if (disposed) return;
    selectGoal(goal);
    dialog.open(state.goal, currentDemo());
  }

  function onClick(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || !container.contains(target) || disposed) return;
    const goal = target.dataset.catalogueGoal;
    if (concepts.some(concept => concept.goal === goal)) {
      selectGoal(goal as DemoId);
    } else if (modes.includes(target.dataset.sceneMode as SceneMode)) {
      const mode = target.dataset.sceneMode as SceneMode;
      if (mode !== state.mode) {
        state = { ...state, mode };
        notify();
      }
    } else if (target.hasAttribute('data-open-current')) {
      open();
    } else if (target.hasAttribute('data-project-request')) {
      onProjectRequest(concepts.find(concept => concept.goal === state.goal)!.projectGoal);
    }
  }

  container.addEventListener('click', onClick);
  demoSlot.replaceChildren(currentDemo());
  syncLayout();
  notify();

  return {
    getState: () => ({ ...state }),
    selectGoal,
    open,
    dispose() {
      if (disposed) return;
      disposed = true;
      container.removeEventListener('click', onClick);
      dialog.dispose();
      for (const demo of cache.values()) disposeDemo(demo);
      cache.clear();
      container.replaceChildren();
      container.classList.remove('catalogue');
    },
  };
}
