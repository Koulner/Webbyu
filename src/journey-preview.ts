import './journey-preview.css';

/** Expand the existing frame so chapter position and demo inputs survive. */
export function mountJourneyPreview(container: HTMLElement) {
  const events = new AbortController();
  const listen = { signal: events.signal };
  const frame = container.querySelector<HTMLIFrameElement>('iframe')!;
  const button = container.querySelector<HTMLButtonElement>('[data-journey-fullscreen]')!;
  const label = container.querySelector<HTMLElement>('[data-fullscreen-label]')!;
  const pageLink = container.querySelector<HTMLAnchorElement>('[data-journey-page]')!;
  const status = container.querySelector<HTMLElement>('[role="status"]')!;
  const destination = new URL(pageLink.href);
  let disposed = false;
  let wasFullscreen = false;

  button.hidden = !document.fullscreenEnabled || !container.requestFullscreen;
  function syncFullscreen() {
    const fullscreen = document.fullscreenElement === container;
    button.setAttribute('aria-pressed', String(fullscreen));
    button.setAttribute('aria-label', fullscreen ? 'Vollbild beenden' : 'Die Reise im Vollbild ansehen');
    label.textContent = fullscreen ? 'Vollbild beenden' : 'Vollbild';
    if (wasFullscreen && !fullscreen) button.focus({ preventScroll: true });
    wasFullscreen = fullscreen;
  }
  button.addEventListener('click', async () => {
    status.hidden = true;
    try {
      if (document.fullscreenElement === container) await document.exitFullscreen();
      else await container.requestFullscreen();
    } catch {
      if (disposed) return;
      status.textContent = 'Vollbild ist hier nicht verfügbar. Über „Reise öffnen“ können Sie die Reise als ganze Seite ansehen.';
      status.hidden = false;
      pageLink.focus({ preventScroll: true });
    }
  }, listen);
  document.addEventListener('fullscreenchange', syncFullscreen, listen);

  // Only the local, embedded journey may update its link or return to the host.
  window.addEventListener('message', async event => {
    if (event.origin !== destination.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'webbyu:journey-position' && typeof event.data.hash === 'string' && /^#[a-z0-9-]+$/.test(event.data.hash)) {
      destination.hash = event.data.hash;
      pageLink.href = destination.href;
    }
    if (event.data?.type === 'webbyu:journey-home' && ['', '#arbeiten', '#ueber-uns', '#projektfinder'].includes(event.data.hash)) {
      if (document.fullscreenElement === container) await document.exitFullscreen().catch(() => {});
      if (disposed) return;
      const hash = event.data.hash || '#arbeiten';
      // Use the main page's existing navigation to retain Finder state and focus.
      const link = document.querySelector<HTMLAnchorElement>(`.site-header a[href="${hash}"]`);
      link?.click();
    }
  }, listen);
  return {
    dispose() {
      disposed = true;
      events.abort();
      if (document.fullscreenElement === container) void document.exitFullscreen().catch(() => {});
    },
  };
}
