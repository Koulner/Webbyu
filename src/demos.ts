import { concepts, type DemoId } from './data';
import './demos.css';
import './ai-badge.css';

type DemoMount = (root: HTMLElement, id: string, signal: AbortSignal) => void;
const mounts = new Map<DemoId, DemoMount>();
const pending = new Map<DemoId, Promise<void>>();
const loaders: Record<DemoId, () => Promise<{ mount: DemoMount }>> = {
  meisterwerk: () => import('./reference-demos/handwerk/demo'),
  nordlicht: () => import('./reference-demos/gebaeudetechnik/demo'),
  raumgut: () => import('./reference-demos/raumgut/demo'),
  sales: () => import('./demo-sales'),
};

export function isDemoPrepared(goal: DemoId): boolean { return mounts.has(goal); }

/** Load only the selected concept. A failed request can be retried. */
export function prepareDemo(goal: DemoId): Promise<void> {
  if (mounts.has(goal)) return Promise.resolve();
  let loading = pending.get(goal);
  if (!loading) {
    loading = loaders[goal]().then(module => { mounts.set(goal, module.mount); }).catch(error => {
      pending.delete(goal);
      throw error;
    });
    pending.set(goal, loading);
  }
  return loading;
}

let instance = 0;
const sessions = new WeakMap<HTMLElement, AbortController>();

/** A self-contained concept site; fixed dimensions match the scene's 5:4 display. */
export function createDemo(goal: DemoId, options: { interactive?: boolean } = {}): HTMLElement {
  const mount = mounts.get(goal);
  if (!mount) throw new Error(`Prepare the ${goal} concept before creating its session.`);
  const root = document.createElement('div');
  const id = `concept-${++instance}`;
  const controller = new AbortController();
  sessions.set(root, controller);
  root.className = `demo demo--${goal}`;
  root.dataset.demo = goal;
  try {
    mount(root, id, controller.signal);
  } catch (error) {
    controller.abort();
    sessions.delete(root);
    throw error;
  }
  if (options.interactive === false) {
    if (goal === 'sales') controller.abort();
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    root.classList.add('demo--preview');
  }
  return root;
}

/** Releases event handlers even if a caller retains a detached session node. */
export function disposeDemo(root: HTMLElement): void {
  sessions.get(root)?.abort();
  sessions.delete(root);
  root.remove();
}

/** Presents an existing live session; creation and caching belong to the catalogue. */
export function mountDemoDialog(options: { onRestore?: () => void } = {}): {
  open(goal: DemoId, demoElement: HTMLElement): void;
  close(): void;
  dispose(): void;
} {
  const nameOf = (id: DemoId) => concepts.find(concept => concept.goal === id)!.name;
  const dialog = document.createElement('dialog');
  const events = new AbortController();
  dialog.className = 'concept-dialog';
  dialog.innerHTML = '<div class="concept-dialog-bar"><div><span>FIKTIVES KONZEPT VON WEBBYU</span><strong data-dialog-title></strong></div><button type="button" class="concept-dialog-close" aria-label="Konzeptdemo schließen">Schließen <span aria-hidden="true">×</span></button></div><div class="concept-dialog-body"></div>';
  document.body.append(dialog);
  let previousFocus: HTMLElement | null = null;
  let oldOverflow = '';
  let oldScroll = { x: 0, y: 0 };
  let locked = false;
  let disposed = false;
  let active: { demo: HTMLElement; placeholder: Comment; responsive: boolean } | null = null;
  const restore = () => {
    if (active) {
      const { demo, placeholder, responsive } = active;
      active = null;
      demo.classList.toggle('demo--responsive', responsive);
      placeholder.replaceWith(demo);
      options.onRestore?.();
    }
    if (locked) document.body.style.overflow = oldOverflow;
    if (locked) {
      locked = false;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      if (window.scrollX !== oldScroll.x || window.scrollY !== oldScroll.y) {
        window.scrollTo({ left: oldScroll.x, top: oldScroll.y, behavior: 'instant' });
      }
      previousFocus = null;
    }
  };
  const close = () => {
    if (dialog.open) dialog.close();
    // Native close events are queued. Restore now so subsequent selections
    // cannot be overwritten by a delayed return of the previous session.
    restore();
  };
  dialog.querySelector('.concept-dialog-close')!.addEventListener('click', close, { signal: events.signal });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    const innerDialog = active?.demo.shadowRoot?.querySelector<HTMLDialogElement>('dialog[open]');
    if (innerDialog) { innerDialog.close(); return; }
    const panelClose = dialog.querySelector<HTMLButtonElement>('.demo-panel:not([hidden]) [data-panel-close]');
    if (panelClose) panelClose.click();
    else close();
  }, { signal: events.signal });
  dialog.addEventListener('close', () => {
    // Ignore an earlier queued close event if a new session is already open.
    if (!dialog.open) restore();
  }, { signal: events.signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }, { signal: events.signal });
  return {
    open(goal, demoElement) {
      if (disposed) return;
      if (active?.demo !== demoElement) {
        close();
        const placeholder = document.createComment('Live demo returns here after the dialog closes.');
        demoElement.before(placeholder);
        active = { demo: demoElement, placeholder, responsive: demoElement.classList.contains('demo--responsive') };
        demoElement.classList.add('demo--responsive');
        dialog.querySelector('.concept-dialog-body')!.replaceChildren(demoElement);
      }
      dialog.querySelector('[data-dialog-title]')!.textContent = nameOf(goal);
      dialog.setAttribute('aria-label', `Interaktive Konzeptdemo: ${nameOf(goal)}`);
      if (!dialog.open) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        oldOverflow = document.body.style.overflow;
        oldScroll = { x: window.scrollX, y: window.scrollY };
        document.body.style.overflow = 'hidden';
        locked = true;
        try {
          dialog.showModal();
        } catch (error) {
          restore();
          throw error;
        }
      }
      dialog.querySelector<HTMLButtonElement>('.concept-dialog-close')!.focus({ preventScroll: true });
      dialog.scrollTop = 0;
    },
    close,
    dispose() {
      if (disposed) return;
      disposed = true;
      close();
      events.abort();
      dialog.remove();
    },
  };
}
