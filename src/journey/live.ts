import { WebGLRenderer } from 'three';
import type { LandscapeController } from './controller';
import { initLandscape as initFrames, type LiveLayer } from './frames';
import { createStage } from './scene';
import { stations } from './data';

/**
 * Die Verwandlung der Reise: live gerendert, stufenlos und mit Multisampling geglättet. Jeder Übergang hat sein eigenes
 * Shaderprogramm, das im Hintergrund übersetzt wird (KHR_parallel_shader_compile, unter Direct3D rund 2 bis 5 s je
 * Programm). Bis es fertig ist, zeigt die vorgerenderte Bildfolge (`frames.ts`) denselben Rahmen; ohne parallele
 * Übersetzung oder ohne WebGL bleibt es bei der Bildfolge.
 */
export function initLandscape(container: HTMLElement): LandscapeController {
  return initFrames(container, createLive(container));
}

function createLive(container: HTMLElement): LiveLayer | undefined {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return undefined;
  }
  // Ohne parallele Übersetzung hielte jedes Programm die Seite für Sekunden an.
  if (!renderer.getContext().getExtension('KHR_parallel_shader_compile')) {
    renderer.dispose();
    renderer.forceContextLoss();
    return undefined;
  }
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.visibility = 'hidden';
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  container.querySelector<HTMLElement>('.journey-webgl')!.append(canvas);
  // shortcut: Netzfeinheit wird beim Start festgelegt; ein späterer Wechsel über 760 px behält sie bis zum Neuladen.
  const stage = createStage(container.clientWidth < 760 ? 28 : 64);
  const ready = new Set<string>();
  // Alle Übergänge in Leserichtung; prepare zieht den gebrauchten nach vorn.
  const queue: [number, number][] = stations.map((_, i) => [i - 1, i]);
  let busy = false, lost = false, width = 0, height = 0;

  async function pump() {
    if (busy || lost) return;
    const next = queue.shift();
    if (!next) return;
    const [a, b] = next, key = stage.key(a, b);
    if (ready.has(key)) { void pump(); return; }
    busy = true;
    try {
      await stage.prepare(a, b);
      if (lost) return;
      // compileAsync sammelt die Programme sofort ein; danach darf das Netz wieder sein bisheriges Material tragen.
      const previous = stage.mesh.material;
      stage.mesh.material = stage.material(a, b);
      const compiling = renderer.compileAsync(stage.scene, stage.camera);
      stage.mesh.material = previous;
      await compiling;
      if (lost) return;
      ready.add(key);
      layer.onReady?.();
    } catch {
      lost = true;
    } finally {
      busy = false;
    }
    void pump();
  }
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; ready.clear(); canvas.style.visibility = 'hidden'; layer.onReady?.(); };
  canvas.addEventListener('webglcontextlost', contextLost);

  const layer: LiveLayer = {
    ready: (a, b) => !lost && ready.has(stage.key(a, b)),
    prepare(a, b) {
      if (lost || ready.has(stage.key(a, b))) return;
      queue.unshift([a, b]);
      void pump();
    },
    draw(a, b, t, at, nextWidth, nextHeight) {
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth; height = nextHeight;
        renderer.setSize(width, height, false);
      }
      stage.set(a, b, t);
      // Die Kamera sieht genau den quadratischen Rahmen der Bildfolge, verschoben an seine Lage im Canvas.
      stage.camera.aspect = 1;
      stage.camera.setViewOffset(at.size, at.size, -at.x, -at.y, width, height);
      stage.camera.updateProjectionMatrix();
      try { renderer.render(stage.scene, stage.camera); } catch { lost = true; }
    },
    show(visible) { canvas.style.visibility = visible && !lost ? '' : 'hidden'; },
    dispose() {
      lost = true;
      canvas.removeEventListener('webglcontextlost', contextLost);
      stage.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
  // Erst nach dem ersten setProgress, damit der gerade gebrauchte Übergang vorne steht.
  setTimeout(() => void pump(), 0);
  return layer;
}
