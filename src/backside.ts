/**
 * Vorder- und Rückseite: Flächen drehen sich mit der nativen Scrollposition um.
 * Ohne JavaScript, bei reduzierter Bewegung oder „Bewegung reduzieren“ stehen beide Seiten nebeneinander.
 */
type Light = { render(time: number): void; dispose(): void };
type LightModule = { mountRoomLight(canvas: HTMLCanvasElement, targets: HTMLElement[], angles: () => number[]): Light };

const FRONT = -12;
const BACK = 192;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (from: number, to: number, x: number) => { const t = clamp((x - from) / (to - from)); return t * t * (3 - 2 * t); };

export function mountBackside(root: HTMLElement, loadLight: () => Promise<LightModule> = () => import('./backside-light')) {
  const events = new AbortController();
  const signal = events.signal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'), el => ({
    el,
    card: el.querySelector<HTMLElement>('.card')!,
    button: el.querySelector<HTMLButtonElement>('.flip')!,
    hero: el.hasAttribute('data-hero'),
    forced: null as 'front' | 'back' | null,
    angle: FRONT,
    back: false,
  }));
  const stack = root.querySelector<HTMLElement>('.stack-wrap');
  const canvas = root.querySelector<HTMLCanvasElement>('.room-light');
  let frame = 0;
  let light: Light | undefined;
  let lightRequested = false;
  let disposed = false;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;

  const moving = () => !reduced.matches && root.dataset.motion !== 'quiet';

  function setSide(panel: typeof panels[number], back: boolean) {
    if (panel.back === back && panel.el.dataset.side) return;
    panel.back = back;
    panel.el.dataset.side = back ? 'back' : 'front';
    panel.button.setAttribute('aria-pressed', String(back));
    panel.button.textContent = back ? 'Vorderseite zeigen' : 'Rückseite zeigen';
  }

  // Echte Demo-Seiten skaliert einsetzen; schmale Flächen zeigen die mobile Ansicht der Demo.
  const fit = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(({ target }) => {
    const frameElement = target.querySelector('iframe');
    if (!frameElement) return;
    const virtual = target.clientWidth < 520 ? 390 : 1280;
    const scale = target.clientWidth / virtual;
    Object.assign(frameElement.style, { width: `${virtual}px`, height: `${target.clientHeight / scale}px`, transform: `scale(${scale})` });
  })) : undefined;
  root.querySelectorAll('.viewport').forEach(viewport => fit?.observe(viewport));

  panels.forEach(panel => {
    setSide(panel, false);
    panel.button.addEventListener('click', () => {
      panel.forced = panel.back ? 'front' : 'back';
      setSide(panel, panel.forced === 'back');
    }, { signal });
  });

  function target(panel: typeof panels[number]) {
    if (panel.forced) return panel.forced === 'back' ? 1 : 0;
    if (panel.hero && innerWidth > 900) return smooth(innerHeight * .04, innerHeight * .3, scrollY);
    const rect = panel.el.getBoundingClientRect();
    return smooth(.7, .4, (rect.top + rect.height / 2) / innerHeight);
  }

  function update(time: number) {
    frame = 0;
    if (disposed || !moving() || document.hidden) return;
    pointerX += (targetX - pointerX) * .08;
    pointerY += (targetY - pointerY) * .08;
    for (const panel of panels) {
      const rect = panel.el.getBoundingClientRect();
      if (panel.forced && (rect.bottom < 0 || rect.top > innerHeight)) panel.forced = null;
      const goal = FRONT + (BACK - FRONT) * target(panel);
      panel.angle += (goal - panel.angle) * (panel.forced ? .1 : .16);
      const progress = (panel.angle - FRONT) / (BACK - FRONT);
      const renderedAngle = Number((panel.angle + pointerX * 6).toFixed(2));
      panel.card.style.setProperty('--ry', `${renderedAngle}deg`);
      panel.card.dataset.facing = renderedAngle >= 90 ? 'back' : 'front';
      panel.card.style.setProperty('--rx', `${(5 - pointerY * 5).toFixed(2)}deg`);
      panel.card.style.setProperty('--sheen', `${(120 - progress * 140).toFixed(1)}%`);
      panel.card.style.setProperty('--sheen-o', Math.sin(clamp(progress) * Math.PI).toFixed(3));
      panel.el.style.setProperty('--draw', smooth(.55, .95, progress).toFixed(3));
      if (!panel.forced) setSide(panel, panel.angle > 90);
    }
    if (stack) {
      const rect = stack.getBoundingClientRect();
      stack.style.setProperty('--explode', (1 - smooth(.12, .55, Math.abs((rect.top + rect.height / 2) / innerHeight - .5))).toFixed(3));
    }
    light?.render(time);
    frame = requestAnimationFrame(update);
  }

  function requestLight() {
    if (lightRequested || !canvas) return;
    lightRequested = true;
    loadLight().then(module => {
      if (disposed) return;
      light = module.mountRoomLight(canvas, panels.map(panel => panel.card), () => panels.map(panel => panel.angle));
    }).catch(() => canvas.remove());
  }

  function sync() {
    const active = moving();
    root.classList.toggle('is-3d', active);
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
      stack?.style.setProperty('--explode', '1');
      panels.forEach(panel => { panel.forced = null; panel.el.style.setProperty('--draw', '1'); });
      return;
    }
    // Raumlicht erst nach dem ersten Bild laden; es ist Gestaltung, kein Inhalt.
    if ('requestIdleCallback' in window) requestIdleCallback(requestLight, { timeout: 2500 });
    else setTimeout(requestLight, 1200);
    if (!frame) frame = requestAnimationFrame(update);
  }

  if (finePointer) addEventListener('pointermove', event => {
    targetX = event.clientX / innerWidth - .5;
    targetY = event.clientY / innerHeight - .5;
  }, { passive: true, signal });
  reduced.addEventListener?.('change', sync, { signal });
  document.addEventListener('visibilitychange', sync, { signal });
  const quiet = new MutationObserver(sync);
  quiet.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  sync();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      events.abort();
      quiet.disconnect();
      fit?.disconnect();
      cancelAnimationFrame(frame);
      light?.dispose();
      root.classList.remove('is-3d');
    },
  };
}
