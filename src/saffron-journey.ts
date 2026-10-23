import './saffron-journey.css';

// Original rendered camera move from the user's reference project, frames 0–400.
// The branded jar enters later and is deliberately outside this anonymous excerpt.
export const LAST_SAFFRON_FRAME = 400;
const FRAME_STEP = 2;
export const saffronChapters = [
  { title: 'Die Blüte', frame: 160, image: new URL('./assets/demos/saffron/flower.webp', import.meta.url).href, alt: 'Violette Safranblüte mit roten Narbenästen in Nahaufnahme', text: 'Alles beginnt mit einer Blüte. Zwischen violetten Blütenblättern liegen die feinen roten Narbenäste.' },
  { title: 'Der rote Faden', frame: 288, image: new URL('./assets/demos/saffron/detail.webp', import.meta.url).href, alt: 'Ein roter Narbenast mit trichterförmiger Spitze vor violetten Blütenblättern', text: 'Ein kleines Detail im großen Bild: die rote Narbe. Die Nahaufnahme macht ihre Struktur sichtbar.' },
  { title: 'Das Gewürz', frame: 400, image: new URL('./assets/demos/saffron/threads.webp', import.meta.url).href, alt: 'Getrocknete rote Safranfäden auf hellem Grund', text: 'Getrocknete Fäden, intensive Farbe. In dieser fiktiven Kollektion entdecken Sie Safran in drei Größen.' },
];

export function saffronFramePair(progress: number) {
  const position = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * LAST_SAFFRON_FRAME;
  const a = Math.floor(position / FRAME_STEP) * FRAME_STEP;
  const b = Math.min(LAST_SAFFRON_FRAME, a + FRAME_STEP);
  return { a, b, mix: b === a ? 0 : (position - a) / (b - a) };
}

export function saffronFrameUrl(frame: number) {
  const name = String(frame).padStart(4, '0');
  return new URL(`./assets/demos/saffron/journey/${name}.webp`, import.meta.url).href;
}

export function saffronJourneyMarkup(id: string) {
  return `<section class="demo-botanical-story saffron-journey" data-saffron-journey aria-label="Von der Blüte zum Gewürz">
    <div class="demo-spice-section-heading"><p class="demo-eyebrow">Eine Reise ins Detail</p><h3>Von der Blüte<br><em>zum Gewürz.</em></h3><p>Folgen Sie der Kamera. Oder springen Sie direkt zu einem Kapitel.</p></div>
    <div class="saffron-stage">
      <div class="demo-botanical-controls" role="group" aria-label="Botanisches Kapitel">${saffronChapters.map((chapter, index) => `<button type="button" data-ingredient="${index}" aria-pressed="${index === 0}" aria-controls="${id}-botanical"><span>0${index + 1}</span>${chapter.title}</button>`).join('')}</div>
      <figure id="${id}-botanical" class="demo-botanical-figure"><div class="saffron-picture"><img data-ingredient-image src="${saffronChapters[0].image}" alt="${saffronChapters[0].alt}" width="960" height="540" loading="lazy"><canvas data-saffron-layer aria-hidden="true"></canvas><canvas data-saffron-layer aria-hidden="true"></canvas><span class="saffron-picture-label" aria-hidden="true">SAFRAN ATELIER / BOTANISCHE STUDIE</span></div><figcaption data-ingredient-caption aria-live="polite">${saffronChapters[0].text}</figcaption></figure>
      <div class="saffron-motion-controls" hidden><button type="button" class="demo-secondary" data-saffron-play>Abspielen</button><label for="${id}-camera">Kameraposition<input id="${id}-camera" data-saffron-progress type="range" min="0" max="1000" step="1" value="0" aria-valuetext="Anfang der Kamerafahrt"></label></div>
      <div class="saffron-stage-bottom"><p data-saffron-status role="status">Drei Kapitel zum Entdecken.</p><button class="demo-nav-link" data-product-open type="button">Zur Kollektion <span aria-hidden="true">↗</span></button></div>
    </div>
  </section>`;
}

/** A single session survives catalogue/dialog reparenting and shares its owner's disposal signal. */
export function mountSaffronJourney(root: HTMLElement, signal: AbortSignal) {
  const section = root.querySelector<HTMLElement>('[data-saffron-journey]')!;
  const stage = section.querySelector<HTMLElement>('.saffron-stage')!;
  const poster = section.querySelector<HTMLImageElement>('[data-ingredient-image]')!;
  const caption = section.querySelector<HTMLElement>('[data-ingredient-caption]')!;
  const status = section.querySelector<HTMLElement>('[data-saffron-status]')!;
  const controls = section.querySelector<HTMLElement>('.saffron-motion-controls')!;
  const play = section.querySelector<HTMLButtonElement>('[data-saffron-play]')!;
  const slider = section.querySelector<HTMLInputElement>('[data-saffron-progress]')!;
  const buttons = [...section.querySelectorAll<HTMLButtonElement>('[data-ingredient]')];
  const canvases = [...section.querySelectorAll<HTMLCanvasElement>('[data-saffron-layer]')];
  const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const capable = typeof createImageBitmap === 'function' && typeof IntersectionObserver === 'function' && typeof ResizeObserver === 'function';
  const cache = new Map<number, ImageBitmap>();
  const pending = new Map<number, AbortController>();
  let contexts: (CanvasRenderingContext2D | null)[] | null = null;
  let layerFrames = [-1, -1];
  let visible = false;
  let failed = false;
  let failures = 0;
  let playing = false;
  let target = 0;
  let current = 0;
  let velocity = 0;
  let raf = 0;
  let lastTime = 0;
  let chapter = 0;
  let stickyTop = 76;
  let ignoreScrollUntil = 0;
  const motion = () => capable && !reduced?.matches && !saveData && !failed && !signal.aborted;
  const active = () => motion() && visible && root.isConnected && !document.hidden && !root.closest('[inert]') && !root.classList.contains('demo--panel-open');

  function showChapter(index: number) {
    chapter = index;
    const item = saffronChapters[index];
    if (poster.getAttribute('src') !== item.image) poster.src = item.image;
    poster.alt = item.alt;
    if (caption.textContent !== item.text) caption.textContent = item.text;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }

  function pause() {
    playing = false;
    play.textContent = target >= .999 ? 'Erneut abspielen' : 'Abspielen';
    play.setAttribute('aria-pressed', 'false');
  }

  function suspend() {
    pause();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
    for (const request of pending.values()) request.abort();
    pending.clear();
  }

  function fallback() {
    failed = true;
    suspend();
    section.classList.remove('has-motion', 'is-scrollable', 'has-frames');
    controls.hidden = true;
    status.textContent = 'Die Kamerafahrt ist gerade nicht verfügbar. Alle Kapitel bleiben als Bilder zugänglich.';
  }

  function scrollPort(): HTMLElement | null {
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
    }
    return null;
  }

  function layout() {
    if (signal.aborted || !root.isConnected) return;
    // Resize, scroll anchoring and dialog reparenting must not seek the camera.
    ignoreScrollUntil = performance.now() + 150;
    const port = scrollPort();
    const navHeight = root.querySelector<HTMLElement>('.demo-nav')?.offsetHeight ?? 76;
    const outside = port ? port.querySelector<HTMLElement>('.concept-dialog-bar')?.offsetHeight ?? 0
      : document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    stickyTop = navHeight + outside;
    const available = (port?.clientHeight || innerHeight) - stickyTop - 12;
    root.style.setProperty('--saffron-nav-top', `${outside}px`);
    stage.style.setProperty('--saffron-top', `${stickyTop}px`);
    controls.hidden = !motion();
    const pictureHeight = section.querySelector<HTMLElement>('.saffron-picture')!.offsetHeight;
    const chromeHeight = stage.offsetHeight - pictureHeight;
    stage.style.setProperty('--saffron-media-height', `${Math.max(144, Math.min(420, available - chromeHeight))}px`);
    section.classList.toggle('has-motion', motion());
    const scrollable = motion() && available >= stage.offsetHeight;
    section.classList.toggle('is-scrollable', scrollable);
    section.style.setProperty('--saffron-stage-height', `${stage.offsetHeight}px`);
    if (!motion()) {
      section.classList.remove('has-frames');
      suspend();
      status.textContent = failed ? 'Kamerafahrt nicht verfügbar. Wählen Sie ein Kapitel.' : 'Wählen Sie die Kapitel als Einzelbilder.';
    } else {
      status.textContent = scrollable ? 'Scrollen, abspielen oder die Kamera selbst führen.' : 'Abspielen oder die Kamera selbst führen.';
      requestDraw();
    }
  }

  function requestDraw() {
    if (active() && !raf) raf = requestAnimationFrame(draw);
  }

  function load(frame: number) {
    if (!active() || cache.has(frame) || pending.has(frame) || pending.size >= 4) return;
    const request = new AbortController();
    pending.set(frame, request);
    void fetch(saffronFrameUrl(frame), { signal: request.signal }).then(response => {
      if (!response.ok) throw new Error('Frame unavailable');
      return response.blob();
    }).then(blob => createImageBitmap(blob)).then(bitmap => {
      if (signal.aborted || request.signal.aborted || !motion()) { bitmap.close(); return; }
      cache.set(frame, bitmap);
      const { a, b } = saffronFramePair(current);
      for (const [key, old] of cache) {
        if (cache.size <= 14) break;
        if (key !== a && key !== b && key !== frame) { old.close(); cache.delete(key); }
      }
    }).catch(() => {
      if (!request.signal.aborted && !signal.aborted && ++failures >= 3) fallback();
    }).finally(() => {
      if (pending.get(frame) === request) pending.delete(frame);
      requestDraw();
    });
  }

  function draw(time: number) {
    raf = 0;
    if (!active()) { suspend(); return; }
    const dt = lastTime ? Math.min(.05, (time - lastTime) / 1000) : .016;
    lastTime = time;
    if (playing) target = Math.min(1, target + dt / 14);
    // Same critically damped camera follow as the reference, without global scroll ownership.
    const offset = current - target;
    const decay = Math.exp(-10 * dt);
    const pull = velocity + 10 * offset;
    current = target + (offset + pull * dt) * decay;
    velocity = (velocity - pull * 10 * dt) * decay;
    if (Math.abs(current - target) < .00004 && Math.abs(velocity) < .0004) { current = target; velocity = 0; }
    const { a, b, mix } = saffronFramePair(current);
    load(a); load(b);
    const direction = target >= current ? 1 : -1;
    for (const distance of [2, 3, 4, -1]) load(Math.max(0, Math.min(LAST_SAFFRON_FRAME, a + distance * FRAME_STEP * direction)));
    const first = cache.get(a);
    const second = cache.get(b);
    if (first && second) {
      try {
        contexts ??= canvases.map(canvas => canvas.getContext('2d', { alpha: false }));
        if (contexts.some(context => !context)) { fallback(); return; }
        const frames = [a, b];
        [first, second].forEach((bitmap, index) => {
          if (layerFrames[index] === frames[index]) return;
          canvases[index].width = bitmap.width;
          canvases[index].height = bitmap.height;
          contexts![index]!.drawImage(bitmap, 0, 0);
          layerFrames[index] = frames[index];
        });
        canvases[1].style.opacity = String(mix);
        section.classList.add('has-frames');
        section.dataset.frame = String(Math.round(current * LAST_SAFFRON_FRAME));
      } catch { fallback(); return; }
    }
    const nextChapter = current < .53 ? 0 : current < .85 ? 1 : 2;
    if (nextChapter !== chapter) showChapter(nextChapter);
    slider.value = String(Math.round(target * 1000));
    slider.setAttribute('aria-valuetext', `${saffronChapters[chapter].title}, ${Math.round(target * 100)} Prozent`);
    if (playing && target === 1 && current === 1) pause();
    if (playing || current !== target) requestDraw();
    else lastTime = 0;
  }

  function setPosition(progress: number, immediate = false) {
    target = Math.max(0, Math.min(1, progress));
    pause();
    if (!motion() || immediate) { current = target; velocity = 0; }
    slider.value = String(Math.round(target * 1000));
    requestDraw();
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => {
    setPosition(saffronChapters[index].frame / LAST_SAFFRON_FRAME, true);
    showChapter(index);
  }, { signal }));
  slider.addEventListener('input', () => setPosition(Number(slider.value) / 1000, true), { signal });
  play.addEventListener('click', () => {
    if (playing) { pause(); return; }
    if (target >= .999) { target = 0; current = 0; velocity = 0; }
    playing = true;
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    requestDraw();
  }, { signal });
  root.querySelector('[data-journey-open]')?.addEventListener('click', () => {
    stage.scrollIntoView({ block: 'start', behavior: 'instant' });
    (motion() ? play : buttons[0]).focus({ preventScroll: true });
  }, { signal });

  const intersection = capable ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) { layout(); requestDraw(); } else suspend();
  }) : null;
  intersection?.observe(stage);
  const resize = capable ? new ResizeObserver(() => layout()) : null;
  resize?.observe(root);
  resize?.observe(stage);
  // Only the live demo's own scroll ancestry may move this camera. No wheel/touch interception.
  const onScroll = (event: Event) => {
    if (!active() || performance.now() < ignoreScrollUntil || !section.classList.contains('is-scrollable')) return;
    const port = scrollPort();
    if (event.target !== (port ?? document)) return;
    const rect = section.getBoundingClientRect();
    const top = (port?.getBoundingClientRect().top ?? 0) + stickyTop;
    if (rect.top > top || rect.bottom < top) return;
    const style = getComputedStyle(section);
    const intro = section.querySelector<HTMLElement>('.demo-spice-section-heading')!.offsetHeight + parseFloat(style.paddingTop || '0');
    const travel = section.offsetHeight - intro - stage.offsetHeight - parseFloat(style.paddingBottom || '0');
    setPosition((top - rect.top - intro) / Math.max(1, travel));
  };
  document.addEventListener('scroll', onScroll, { capture: true, passive: true, signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend(); else requestDraw();
  }, { signal });
  reduced?.addEventListener?.('change', layout, { signal });
  const mutation = capable ? new MutationObserver(() => {
    if (root.classList.contains('demo--panel-open') || root.inert) suspend(); else layout();
  }) : null;
  mutation?.observe(root, { attributes: true, attributeFilter: ['class', 'inert'] });
  function dispose() {
    suspend();
    intersection?.disconnect();
    resize?.disconnect();
    mutation?.disconnect();
    for (const bitmap of cache.values()) bitmap.close();
    cache.clear();
    canvases.forEach(canvas => { canvas.width = 0; canvas.height = 0; });
    contexts = null;
    layerFrames = [-1, -1];
  }
  signal.addEventListener('abort', dispose, { once: true });
  if (signal.aborted) dispose();
  controls.hidden = !motion();
  if (!motion()) status.textContent = 'Wählen Sie die Kapitel als Einzelbilder.';
}
