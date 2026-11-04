/** A finite, optional motion layer. Content and navigation work without it. */
export function mountHomeMotion(root: HTMLElement) {
  const events = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const stage = root.querySelector<HTMLElement>('.studio-stage');
  const pieces = Array.from(root.querySelectorAll<HTMLElement>('.stage-piece'));
  const control = root.querySelector<HTMLButtonElement>('.motion-control');
  const process = root.querySelector<HTMLElement>('.process-list');
  const steps = Array.from(process?.querySelectorAll<HTMLElement>('li') ?? []);
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.site-header nav a[href^="#"]'));
  const destinations = links.map(link => root.querySelector<HTMLElement>(link.hash));
  const activeAnimations = new Map<Animation, HTMLElement>();
  const seen = new WeakSet<Element>();
  let observer: IntersectionObserver | undefined;
  let quiet = false;
  let disposed = false;
  let scrollFrame = 0;
  let pointerFrame = 0;
  let lastTime = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  const allowed = () => !disposed && !quiet && !reduced.matches && !document.hidden;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  function cancelAnimations() {
    for (const animation of activeAnimations.keys()) animation.cancel();
    activeAnimations.clear();
  }

  function reveal(element: HTMLElement, delay = 0) {
    if (seen.has(element) || !allowed() || typeof element.animate !== 'function') return;
    seen.add(element);
    // Nothing is hidden while waiting for JavaScript. Focus skips the entrance.
    if (element.contains(document.activeElement)) return;
    const image = element.classList.contains('package-demo-preview');
    const animation = element.animate([
      { opacity: .12, translate: `0 ${image ? 32 : 20}px`, ...(image ? { scale: '.975' } : {}) },
      { opacity: 1, translate: '0 0', ...(image ? { scale: '1' } : {}) },
    ], { duration: image ? 850 : 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    activeAnimations.set(animation, element);
    animation.onfinish = animation.oncancel = () => activeAnimations.delete(animation);
  }

  function observeEntrances() {
    observer?.disconnect();
    if (!allowed() || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target as HTMLElement, Math.min(order++ * 65, 195));
        observer?.unobserve(entry.target);
      }
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    root.querySelectorAll<HTMLElement>('.section-heading, .package-demo-preview, .services-grid article, .package-row, .about-copy, .process-list li, .finder-intro').forEach(element => {
      if (!seen.has(element)) observer!.observe(element);
    });
  }

  function paintPointer() {
    if (!stage) return;
    stage.style.setProperty('--stage-x', `${pointerX.toFixed(3)}`);
    stage.style.setProperty('--stage-y', `${pointerY.toFixed(3)}`);
    stage.style.setProperty('--light-x', `${50 + pointerX * 32}%`);
    stage.style.setProperty('--light-y', `${50 + pointerY * 32}%`);
  }

  function settlePointer(time: number) {
    pointerFrame = 0;
    if (!allowed() || !finePointer.matches) { resetPointer(); return; }
    const delta = lastTime ? Math.min(time - lastTime, 50) : 16;
    lastTime = time;
    const amount = 1 - Math.exp(-delta / 90);
    pointerX += (targetX - pointerX) * amount;
    pointerY += (targetY - pointerY) * amount;
    if (Math.abs(targetX - pointerX) + Math.abs(targetY - pointerY) < .002) {
      pointerX = targetX;
      pointerY = targetY;
      lastTime = 0;
    } else pointerFrame = requestAnimationFrame(settlePointer);
    paintPointer();
  }

  function resetPointer() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    lastTime = 0;
    pointerX = pointerY = targetX = targetY = 0;
    stage?.classList.remove('is-pointer-active');
    paintPointer();
  }

  function movePointer(event: PointerEvent) {
    if (!allowed() || !finePointer.matches || event.pointerType === 'touch' || !stage) return;
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    targetX = clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1);
    targetY = clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1);
    stage.classList.add('is-pointer-active');
    if (!pointerFrame) pointerFrame = requestAnimationFrame(settlePointer);
  }

  function leavePointer() {
    targetX = targetY = 0;
    stage?.classList.remove('is-pointer-active');
    if (allowed() && !pointerFrame) pointerFrame = requestAnimationFrame(settlePointer);
  }

  function updateScroll() {
    scrollFrame = 0;
    if (disposed || document.hidden) return;
    const marker = innerHeight * .42;
    let current = -1;
    destinations.forEach((element, index) => {
      if (element && element.getBoundingClientRect().top <= marker) current = index;
    });
    if (current >= 0) {
      const element = destinations[current]!;
      const section = element.closest('section') ?? element;
      if (section.getBoundingClientRect().bottom < 100) current = -1;
    }
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (process && steps.length) {
      const bounds = process.getBoundingClientRect();
      const progress = clamp((marker - bounds.top) / Math.max(1, bounds.height), 0, 1);
      process.style.setProperty('--process-progress', String(progress));
      let activeStep = -1;
      steps.forEach((step, index) => {
        const reached = step.getBoundingClientRect().top < marker;
        step.classList.toggle('is-reached', reached);
        if (reached) activeStep = index;
      });
      steps.forEach((step, index) => step.classList.toggle('is-current', index === activeStep));
    }
    if (stage) {
      const box = stage.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) resetPointer();
    }
  }

  function requestScrollUpdate() {
    if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(updateScroll);
  }

  function syncPreference() {
    if (disposed) return;
    const enabled = !quiet && !reduced.matches;
    root.dataset.motion = enabled ? 'full' : 'quiet';
    if (control) {
      control.hidden = false;
      control.disabled = reduced.matches;
      control.setAttribute('aria-pressed', String(!enabled));
      const label = reduced.matches ? 'Bewegung systemseitig reduziert' : quiet ? 'Bewegung aktivieren' : 'Bewegung reduzieren';
      control.querySelector('[data-motion-label]')!.textContent = label;
    }
    cancelAnimations();
    resetPointer();
    observeEntrances();
  }

  control?.addEventListener('click', () => { quiet = !quiet; syncPreference(); }, { signal: events.signal });
  stage?.addEventListener('pointermove', movePointer, { signal: events.signal, passive: true });
  stage?.addEventListener('pointerleave', leavePointer, { signal: events.signal });
  stage?.addEventListener('pointercancel', resetPointer, { signal: events.signal });
  root.addEventListener('focusin', event => {
    for (const [animation, element] of activeAnimations) {
      if (element.contains(event.target as Node)) { animation.cancel(); activeAnimations.delete(animation); }
    }
    resetPointer();
  }, { signal: events.signal });
  window.addEventListener('scroll', requestScrollUpdate, { signal: events.signal, passive: true });
  window.addEventListener('resize', requestScrollUpdate, { signal: events.signal, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimations();
      resetPointer();
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    } else { observeEntrances(); updateScroll(); }
  }, { signal: events.signal });
  reduced.addEventListener?.('change', syncPreference);
  finePointer.addEventListener?.('change', resetPointer);
  syncPreference();
  updateScroll();
  root.querySelectorAll<HTMLElement>('.hero-copy h1, .hero-description, .hero-actions').forEach((element, index) => reveal(element, index * 80));
  pieces.forEach((element, index) => reveal(element, 100 + index * 90));

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      events.abort();
      observer?.disconnect();
      reduced.removeEventListener?.('change', syncPreference);
      finePointer.removeEventListener?.('change', resetPointer);
      cancelAnimations();
      resetPointer();
      cancelAnimationFrame(scrollFrame);
      delete root.dataset.motion;
      links.forEach(link => link.removeAttribute('aria-current'));
      steps.forEach(step => step.classList.remove('is-reached', 'is-current'));
      process?.style.removeProperty('--process-progress');
      if (control) control.hidden = true;
    },
  };
}
