/** Keep the concept usable when an illustration fails, including dynamic product images. */
export function mountMediaFallback(scope: HTMLElement | ShadowRoot, signal: AbortSignal) {
  const page = scope instanceof ShadowRoot ? scope.querySelector<HTMLElement>('.reference-page')! : scope.querySelector<HTMLElement>('.demo-main')!;
  const status = document.createElement('p');
  status.className = 'demo-media-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  page.prepend(status);
  const failed = new Set<HTMLImageElement>();
  let backgroundFailed = false;
  function update() {
    for (const image of failed) if (!scope.contains(image)) failed.delete(image);
    status.hidden = !failed.size && !backgroundFailed;
    status.textContent = status.hidden ? '' : 'Einige Bilder sind gerade nicht verfügbar. Bildbeschreibungen, Texte und die lokale Demo bleiben zugänglich.';
  }
  scope.addEventListener('error', event => {
    if (!(event.target instanceof HTMLImageElement)) return;
    failed.add(event.target);
    update();
  }, { signal, capture: true });
  scope.addEventListener('load', event => {
    if (!(event.target instanceof HTMLImageElement)) return;
    failed.delete(event.target);
    update();
  }, { signal, capture: true });
  // The room comparison uses CSS backgrounds, which have no DOM error event.
  const room = scope.querySelector<HTMLElement>('.image-compare');
  if (room) {
    const probe = new Image();
    probe.addEventListener('error', () => {
      backgroundFailed = true;
      room.hidden = true;
      const controls = scope.querySelector<HTMLElement>('.compare-controls');
      if (controls) controls.hidden = true;
      const explanation = scope.querySelector<HTMLElement>('.compare-heading p');
      if (explanation) explanation.textContent = 'Der Bildvergleich ist gerade nicht verfügbar. Die Raumidee ist im Text beschrieben.';
      update();
    }, { signal });
    probe.src = `${import.meta.env.BASE_URL}reference-assets/room-diptych.png`;
  }
  return status;
}
