import { concepts, type DemoGoal } from './data';
import type { CatalogueController, CatalogueOptions, CatalogueState, SceneMode } from './contracts';
import { createDemo, mountDemoDialog } from './demos';
import './catalogue.css';

const goalLabels: Record<DemoGoal, string> = {
  inquiries: 'Anfragen', bookings: 'Buchungen', sales: 'Verkäufe',
};
const modes: SceneMode[] = ['presentation', 'layers', 'interactive'];

/** Owns the live demo sessions. The scene only receives the persistent slot. */
export function mountCatalogue(options: CatalogueOptions): CatalogueController {
  const { container, demoSlot, onStateChange, onProjectRequest } = options;
  let state: CatalogueState = { goal: 'inquiries', mode: 'presentation' };
  let disposed = false;
  const cache = new Map<DemoGoal, HTMLElement>();
  const syncLayout = () => {
    for (const demo of demoSlot.querySelectorAll<HTMLElement>(':scope > .demo')) {
      demo.classList.toggle('demo--responsive', demoSlot.classList.contains('demo--responsive'));
    }
  };
  const dialog = mountDemoDialog({ onRestore: syncLayout });

  container.classList.add('catalogue');
  container.innerHTML = `
    <div class="catalogue-concepts" role="group" aria-label="Konzept auswählen">
      ${concepts.map(concept => `<button type="button" class="catalogue-concept" data-catalogue-goal="${concept.goal}" aria-pressed="${concept.goal === state.goal}"><span class="catalogue-position">${concept.number} / 03</span><strong>${concept.name}</strong><span>${goalLabels[concept.goal]}</span></button>`).join('')}
    </div>
    <div class="catalogue-modes" role="group" aria-label="Ansicht der Konzeptdemo">
      <button type="button" data-scene-mode="presentation" aria-pressed="true">Präsentation</button>
      <button type="button" data-scene-mode="layers" aria-pressed="false">Aufbau ansehen</button>
      <button type="button" data-scene-mode="interactive" aria-pressed="false">Demo ausprobieren</button>
    </div>
    <div class="catalogue-actions">
      <button type="button" data-open-current>Groß öffnen <span aria-hidden="true">↗</span></button>
      <button type="button" data-project-request>So etwas für mein Projekt <span aria-hidden="true">↗</span></button>
    </div>
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
    const name = concepts.find(concept => concept.goal === state.goal)!.name;
    const label = state.mode === 'interactive' ? 'Direkt ausprobieren.' : state.mode === 'layers' ? 'Aufbau ansehen.' : 'Präsentation.';
    container.querySelector('.catalogue-status')!.textContent = `${name} · ${goalLabels[state.goal]} · ${label}`;
  }

  function notify(): void {
    renderState();
    onStateChange({ ...state });
  }

  function selectGoal(goal: DemoGoal): void {
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
      selectGoal(goal as DemoGoal);
    } else if (modes.includes(target.dataset.sceneMode as SceneMode)) {
      const mode = target.dataset.sceneMode as SceneMode;
      if (mode !== state.mode) {
        state = { ...state, mode };
        notify();
      }
    } else if (target.hasAttribute('data-open-current')) {
      open();
    } else if (target.hasAttribute('data-project-request')) {
      onProjectRequest(state.goal);
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
      for (const demo of cache.values()) demo.remove();
      cache.clear();
      container.replaceChildren();
      container.classList.remove('catalogue');
    },
  };
}
