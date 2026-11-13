// Clips: stumm, nur im sichtbaren Bereich, gemeinsamer Pause-Schalter. Bei ruhiger Fassung erst nach Klick.
interface ClipState {
  seen: boolean;
  gate: boolean;
}

const state = new Map<HTMLVideoElement, ClipState>();
let paused = false;

const sync = (v: HTMLVideoElement) => {
  const s = state.get(v);
  if (!s) return;
  if (!paused && s.seen && s.gate) v.play().catch(() => {});
  else v.pause();
};

/** Bewegung gibt einen Clip erst frei, wenn sein Abzug gelandet ist. */
export function setGate(v: HTMLVideoElement, on: boolean) {
  const s = state.get(v);
  if (!s || s.gate === on) return;
  s.gate = on;
  sync(v);
}

const fmt = (t: number) => (Number.isFinite(t) ? `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '–:–');

export function initVideos(reduce: boolean) {
  paused = reduce;
  const vids = [...document.querySelectorAll<HTMLVideoElement>('video[data-clip]')];
  const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-clip-toggle]')];
  const label = () =>
    toggles.forEach((b) => {
      b.setAttribute('aria-pressed', String(paused));
      b.textContent = paused ? 'Clips abspielen' : 'Clips anhalten';
    });

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        state.get(v)!.seen = e.isIntersecting;
        sync(v);
      }),
    { threshold: 0.35 },
  );

  for (const v of vids) {
    // Clips in einem Bogen warten auf die Landung, außer in der ruhigen Fassung.
    state.set(v, { seen: false, gate: reduce || !v.closest('.bogen') });
    io.observe(v);
    const tc = document.querySelector<HTMLElement>(`[data-tc="${v.dataset.clip}"]`);
    if (tc) v.addEventListener('timeupdate', () => (tc.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`));
  }

  toggles.forEach((b) =>
    b.addEventListener('click', () => {
      paused = !paused;
      label();
      vids.forEach(sync);
    }),
  );
  label();
}
