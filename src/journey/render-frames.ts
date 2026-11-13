import { createFrameRenderer } from './scene';

/** Einstieg der Render-Seite `scripts/journey-render/index.html`; nicht Teil der ausgelieferten Website. */
let current: { size: number; renderer: ReturnType<typeof createFrameRenderer> } | undefined;

async function renderJourneyFrame(a: number, b: number, t: number, size: number, quality: number) {
  if (current?.size !== size) {
    current?.renderer.dispose();
    current = { size, renderer: createFrameRenderer(size) };
  }
  current.renderer.render(a, b, t);
  return current.renderer.canvas.toDataURL('image/webp', quality);
}

/** Sichtbarer Rahmen des zuletzt gerenderten Bildes als Anteil der Kantenlänge (x0, y0, x1, y1). */
function measureJourneyFrame() {
  const side = 512, probe = document.createElement('canvas');
  probe.width = probe.height = side;
  const paint = probe.getContext('2d', { willReadFrequently: true })!;
  paint.drawImage(current!.renderer.canvas, 0, 0, side, side);
  const { data } = paint.getImageData(0, 0, side, side);
  let x0 = side, y0 = side, x1 = 0, y1 = 0;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    if (data[(y * side + x) * 4 + 3] < 13) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
  }
  return [x0, y0, x1, y1].map(value => Math.round(value / side * 1000) / 1000);
}

Object.assign(window, { renderJourneyFrame, measureJourneyFrame });
