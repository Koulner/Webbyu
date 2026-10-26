import './privacy.css';

const storageKey = 'webbyu-privacy';
const maxAge = 180 * 24 * 60 * 60 * 1000;
type Choice = { version: 1; optional: false; savedAt: number };

function isCurrent(value: unknown): value is Choice {
  if (!value || typeof value !== 'object') return false;
  const choice = value as Partial<Choice>;
  return choice.version === 1 && choice.optional === false && typeof choice.savedAt === 'number'
    && choice.savedAt <= Date.now() && Date.now() - choice.savedAt < maxAge;
}

/** There are no optional services configured. Never infer consent from a visit. */
export function mountPrivacy() {
  // The journey preview uses the top-level page's notice and preference.
  if (window.parent !== window) return { dispose() {} };
  const events = new AbortController();
  const panel = document.createElement('aside');
  panel.className = 'privacy-notice';
  panel.setAttribute('aria-labelledby', 'privacy-title');
  panel.setAttribute('aria-label', 'Datenschutz und Cookies');
  panel.innerHTML = `
    <button class="privacy-close" type="button" aria-label="Hinweis schließen – alles Optionale ablehnen">×</button>
    <p class="privacy-eyebrow">Ihre Privatsphäre</p>
    <h2 id="privacy-title">Sie entscheiden.</h2>
    <p class="privacy-copy">Wir setzen keine optionalen Cookies. IONOS stellt beim Hosting Besuchsstatistiken bereit; diese lassen sich hier nicht abschalten. Ihre Auswahl merken wir uns nur in diesem Browser.</p>
    <div class="privacy-actions">
      <button class="privacy-reject" type="button">Alles ablehnen</button>
      <details class="privacy-details"><summary>Details</summary>
        <p>Wir binden keinen Analyse-Pixel und keine Werbedienste ein. Auch ohne Auswahl bleibt die Website vollständig nutzbar. Angaben zu IONOS WebAnalytics finden Sie in der Datenschutzerklärung.</p>
        <p>Mit „Alles ablehnen“ oder dem Schließen speichern wir nur „keine optionalen Dienste“ und den Zeitpunkt für bis zu 180 Tage im lokalen Browserspeicher. Keine Nutzerkennung, keine Übermittlung dieser Auswahl an uns.</p>
        <p>Die technisch erforderliche Auslieferung der Website und Server-Protokolle lassen sich hier nicht abschalten. Über „Cookie-Einstellungen“ im Footer können Sie diesen Hinweis jederzeit erneut öffnen.</p>
      </details>
    </div>
    <nav class="privacy-links" aria-label="Rechtliche Informationen im Cookie-Hinweis">
      <a href="${import.meta.env.BASE_URL}datenschutz/">Datenschutz</a>
      <a href="${import.meta.env.BASE_URL}impressum/">Impressum</a>
    </nav>`;
  let choice: unknown;
  try {
    const stored = window.localStorage.getItem(storageKey);
    choice = JSON.parse(stored ?? 'null');
    if (stored !== null && !isCurrent(choice)) window.localStorage.removeItem(storageKey);
  } catch {
    try { window.localStorage.removeItem(storageKey); } catch { /* Storage may be blocked. */ }
  }
  panel.hidden = isCurrent(choice);
  document.body.append(panel);
  let opener: HTMLElement | undefined;

  function reject() {
    const decision: Choice = { version: 1, optional: false, savedAt: Date.now() };
    try { window.localStorage.setItem(storageKey, JSON.stringify(decision)); } catch { /* Keep the page usable without storage. */ }
    const restoreFocus = panel.contains(document.activeElement);
    panel.hidden = true;
    panel.querySelector('details')!.open = false;
    if (restoreFocus) (opener?.isConnected ? opener : document.querySelector<HTMLElement>('[data-privacy-open]'))?.focus();
  }

  panel.querySelector('.privacy-reject')!.addEventListener('click', reject, { signal: events.signal });
  panel.querySelector('.privacy-close')!.addEventListener('click', reject, { signal: events.signal });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); reject(); }
  }, { signal: events.signal });
  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-privacy-open]') : null;
    if (!trigger) return;
    event.preventDefault();
    opener = trigger;
    panel.hidden = false;
    panel.querySelector<HTMLButtonElement>('.privacy-reject')!.focus();
  }, { signal: events.signal });

  return { dispose() { events.abort(); panel.remove(); } };
}
