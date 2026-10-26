// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountFinder } from './finder';
import { createBriefStore } from './state';
import { INQUIRY_TIMEOUT_MS } from './inquiry-client';
import type { InquiryRequest, InquiryResponse } from './inquiry-contract';

const id = '12345678-1234-4123-8123-123456789abc';
const secondId = '22222222-2222-4222-8222-222222222222';
const originalId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
function response(value: InquiryResponse, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}
async function settle() { for (let i = 0; i < 15; i++) await Promise.resolve(); }

describe('project finder', () => {
  let container: HTMLDivElement;
  let store: ReturnType<typeof createBriefStore>;
  let finder: ReturnType<typeof mountFinder>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let randomUUID: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    store = createBriefStore();
    fetchMock = vi.fn().mockRejectedValue(new Error('Only mocked requests are allowed'));
    randomUUID = vi.fn().mockReturnValueOnce(id).mockReturnValue(secondId);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID });
    finder = mountFinder(container, store);
  });
  afterEach(() => { finder.dispose(); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  function next() { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  function choose(value: string) { container.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click(); }
  function change(name: string, value: string) {
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  }
  function preview() { store.update({ name: 'Ada Beispiel', email: 'ada+projekt@example.com', description: 'Unsere Idee' }); next(); next(); next(); next(); }
  function action(name: string) { return container.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!; }
  function posted(index = 0): InquiryRequest { return JSON.parse(fetchMock.mock.calls[index][1].body); }

  it('treats uncertainty as exclusive and retains all choices and text when revisiting steps', () => {
    choose('bookings');
    next();
    choose('cms');
    choose('unsure');
    expect(store.get().extensions).toEqual(['unsure']);
    choose('seo');
    expect(store.get().extensions).toEqual(['seo']);
    next();
    change('projectType', 'existing');
    change('timing', 'later');
    change('description', 'Ein Atelier mit Terminbuchung.');
    next();
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    change('selectedPackage', 'complete');
    container.querySelector<HTMLButtonElement>('[data-action="back"]')!.click();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    next();
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    finder.openAtStart();
    expect(container.querySelector<HTMLInputElement>('[value="bookings"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLInputElement>('[value="seo"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    expect(container.querySelector<HTMLSelectElement>('[name="projectType"]')!.value).toBe('existing');
    expect(container.querySelector<HTMLSelectElement>('[name="timing"]')!.value).toBe('later');
    next();
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe('Ada Beispiel');
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('complete');
  });

  it('reflects external hero and package choices without erasing inputs', () => {
    store.update({ goal: 'sales', selectedPackage: 'complete', description: 'Unsere Idee' });
    expect(container.querySelector<HTMLInputElement>('[value="sales"]')!.checked).toBe(true);
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('complete');
    store.update({ goal: 'presence', selectedPackage: null });
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('start');
    expect(store.get().description).toBe('Unsere Idee');
  });

  it.each([
    ['presence', 'start'],
    ['inquiries', 'business'],
    ['bookings', 'custom'],
    ['sales', 'custom'],
  ])('takes the %s route to its recommendation and allows a manual choice', (goal, recommendation) => {
    choose(goal);
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe(recommendation);
    expect(container.querySelector('.finder-price')!.textContent).toBe('Angebot auf Anfrage');
    change('selectedPackage', recommendation === 'complete' ? 'start' : 'complete');
    expect(container.querySelector('.finder-recommendation-label')!.textContent).toBe('Ihre Paketauswahl');
    expect(container.querySelector('.finder-price')!.textContent).toBe('Angebot auf Anfrage');
    finder.openAtStart();
    expect(document.activeElement).toBe(container.querySelector('.finder-heading'));
    choose(goal === 'sales' ? 'presence' : 'sales');
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe(goal === 'sales' ? 'start' : 'custom');
    expect(container.querySelector('.finder-recommendation-label')!.textContent).toBe('Meine erste Orientierung');
  });

  it('requires valid contact data and safely displays the complete local summary without a request', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    store.update({ goal: 'sales', extensions: ['cms', '3d'], projectType: 'existing', timing: 'soon', description: '<img src=x onerror="alert(1)">', selectedPackage: 'complete' });
    next(); next(); next();
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', '  ');
    change('email', 'keine-adresse');
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    next();
    const summary = container.querySelector('[data-summary]')!;
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('Produkte verkaufen');
    expect(summary.textContent).toContain('Webbyu Complete');
    expect(summary.textContent).toContain('Angebot auf Anfrage');
    expect(summary.textContent).not.toMatch(/€|\bEUR\b|Preisentw[uü]rf|Steuerbasis|Planungsentwurf/);
    expect(summary.textContent).toContain('Inhalte selbst pflegen');
    expect(summary.textContent).toContain('Etwas Besonderes erleben');
    expect(summary.textContent).toContain('Eine bestehende Website erneuern');
    expect(summary.textContent).toContain('Möglichst bald');
    expect(summary.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(summary.querySelector('img')).toBeNull();
    expect(summary.textContent).toContain('Ada Beispiel');
    expect(summary.textContent).toContain('ada@example.com');
    expect(container.textContent).toContain('Nichts versendet');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    container.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
    expect(store.get().name).toBe('Ada Beispiel');
  });

  it.each(['start', 'business', 'complete', 'custom'] as const)('copies the %s briefing with an offer on request only after the copy button is pressed', async selectedPackage => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    store.update({ selectedPackage, name: 'Ada Beispiel', email: 'ada@example.com', description: 'Ein neuer Auftritt.' });
    next(); next(); next(); next();
    expect(writeText).not.toHaveBeenCalled();
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')!.click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('Ihre Idee: Ein neuer Auftritt.');
    expect(writeText.mock.calls[0][0]).toContain('Angebot: Angebot auf Anfrage');
    expect(writeText.mock.calls[0][0]).not.toMatch(/€|\bEUR\b|Preisentw[uü]rf|Steuerbasis|Planungsentwurf/);
    expect(writeText.mock.calls[0][0]).toContain('Vorschau – nichts versendet.');
    expect(container.querySelector('.finder-copy-status')!.textContent).toContain('wurde kopiert');
  });

  it('retains a sales goal and scope exclusions when Complete is manually requested and copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    store.update({ goal: 'sales', extensions: ['videos'], name: 'Ada', email: 'ada@example.com' });
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('custom');
    expect(container.querySelector('.finder-recommendation')!.textContent).toContain('in keinem der drei Website-Pakete');
    change('selectedPackage', 'complete');
    expect(store.get().goal).toBe('sales');
    expect(container.querySelector('.finder-scope-note')!.textContent).toContain('eigenes Angebot');
    next();
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')!.click();
    await Promise.resolve();
    expect(writeText.mock.calls[0][0]).toContain('Paketwunsch: Webbyu Complete');
    expect(writeText.mock.calls[0][0]).toContain('Angebot: Angebot auf Anfrage');
    expect(writeText.mock.calls[0][0]).toContain('Shops, komplexe Buchungen');
    expect(writeText.mock.calls[0][0]).toContain('Produkte verkaufen');
  });

  it('keeps the briefing available when clipboard access is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
    store.update({ name: 'Ada Beispiel', email: 'ada@example.com' });
    next(); next(); next(); next();
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')!.click();
    await Promise.resolve();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    const fallback = container.querySelector<HTMLTextAreaElement>('[data-focus="copy-fallback"]')!;
    expect(fallback.value).toContain('ada@example.com');
    expect(fallback.value).toContain('Angebot: Angebot auf Anfrage');
    expect(fallback.value).not.toMatch(/€|\bEUR\b|Preisentw[uü]rf|Steuerbasis|Planungsentwurf/);
    expect(fallback.selectionStart).toBe(0);
    expect(fallback.selectionEnd).toBe(fallback.value.length);
    expect(document.activeElement).toBe(fallback);
    expect(container.querySelector('.finder-copy-status')!.textContent).toContain('Kopieren Sie die markierte Anfrage');
  });

  it('waits for the separate send click, hides the honeypot from people, and locks concurrent POSTs', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    preview();
    const honeypot = container.querySelector<HTMLInputElement>('[name="website"]')!;
    expect(honeypot.closest('[hidden][aria-hidden="true"]')).not.toBeNull();
    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.required).toBe(false);
    expect(randomUUID).not.toHaveBeenCalled();
    next(); // Enter/submit on the preview must not send.
    expect(fetchMock).not.toHaveBeenCalled();
    action('send').click();
    action('send').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(posted()).toEqual({ ...store.get(), requestId: id, website: '' });
    expect(action('send').disabled).toBe(true);
    expect(action('copy').disabled).toBe(false);
    expect(action('edit').disabled).toBe(false);
    expect(container.querySelector('form')!.getAttribute('aria-busy')).toBe('true');
    finish(response({ status: 'success', requestId: id, duplicate: false }));
    await settle();
    expect(container.textContent).toContain('Mailserver hat die Annahme Ihrer Nachricht bestätigt');
    expect(container.textContent).toContain('keinen Eingang im Postfach');
    expect(action('send').disabled).toBe(true);
    expect(document.activeElement).toBe(container.querySelector('.finder-status'));
    expect(storage).not.toHaveBeenCalled();
  });

  it('accepts an already accepted duplicate with a different original ID and copies that confirmed ID', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    fetchMock.mockResolvedValue(response({ status: 'success', requestId: originalId, duplicate: true }));
    preview(); action('send').click(); await settle();
    expect(container.textContent).toContain('bereits zum Versand angenommen');
    expect(container.textContent).toContain('keine weitere E-Mail versendet');
    expect(container.querySelector('.finder-request-id')!.textContent).toContain(originalId);
    action('copy').click(); await settle();
    expect(writeText.mock.calls[0][0]).toContain(`Anfragekennung: ${originalId}`);
    expect(writeText.mock.calls[0][0]).not.toContain('nichts versendet');
    action('send').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each<[InquiryResponse, number, string]>([
    [{ status: 'invalid', fields: ['email'] }, 422, 'Bitte prüfen Sie Ihre Anfrage'],
    [{ status: 'invalid', fields: [] }, 403, 'Formularprüfung abgelehnt'],
    [{ status: 'invalid', fields: ['requestId'] }, 422, 'Anfragekennung'],
    [{ status: 'rate_limit', retryAfter: 3600 }, 429, 'Schutzlimit wurde erreicht'],
    [{ status: 'temporary', outcome: 'not_sent' }, 503, 'sicher nicht versendet'],
    [{ status: 'temporary', outcome: 'unknown' }, 503, 'Versandausgang unklar'],
  ])('preserves the entire draft with an honest %j response', async (value, http, message) => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(response(value, http));
    preview();
    const before = store.get();
    action('send').click(); await settle();
    expect(container.textContent).toContain(message);
    expect(container.querySelector('[data-summary]')!.textContent).toContain(before.description);
    expect(store.get()).toEqual(before);
    expect(action('copy').disabled).toBe(false);
    expect(action('edit').disabled).toBe(false);
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    action('edit').click(); next(); next(); next();
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe(before.email);
    expect(container.textContent).toContain(message);
  });

  it.each(['network', 'html', 'json', 'schema', 'http', 'mismatched-id'])('treats %s failure as unknown, with contact and retained copying/editing', async mode => {
    if (mode === 'network') fetchMock.mockRejectedValue(new TypeError('Connection lost'));
    else if (mode === 'html') fetchMock.mockResolvedValue(new Response('<html>proxy error</html>', { headers: { 'Content-Type': 'text/html' } }));
    else if (mode === 'json') fetchMock.mockResolvedValue(new Response('{', { headers: { 'Content-Type': 'application/json' } }));
    else if (mode === 'schema') fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'success' }), { headers: { 'Content-Type': 'application/json' } }));
    else fetchMock.mockResolvedValue(response({ status: 'success', requestId: mode === 'mismatched-id' ? originalId : id, duplicate: false }, mode === 'http' ? 502 : 200));
    preview(); action('send').click(); await settle();
    expect(container.textContent).toContain('Versandausgang unklar');
    expect(container.querySelector('.finder-status a')!.getAttribute('href')).toBe('mailto:lukas.wagner@webbyu.de');
    expect(container.textContent).toContain('24 Stunden');
    expect(container.querySelector('.finder-request-id')!.textContent).toContain(id);
    expect(action('send').textContent).toContain('Bewusst erneut versuchen');
    expect(container.querySelector('[data-summary]')!.textContent).toContain('Unsere Idee');
    action('copy').click(); await settle();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    const fallback = container.querySelector<HTMLTextAreaElement>('[data-focus="copy-fallback"]')!;
    expect(fallback.value).toContain(`Anfragekennung: ${id}`);
    expect(fallback.value).toContain('Versandausgang unklar');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the same ID on manual retry and reverted contents, creates one for changed contents, and preserves uncertainty', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(response({ status: 'temporary', outcome: 'unknown' }, 503)));
    preview(); action('send').click(); await settle();
    action('edit').click(); next(); next(); next(); next();
    action('send').click(); await settle();
    expect(posted(1).requestId).toBe(id);
    store.update({ description: 'Andere Idee' });
    expect(container.textContent).toContain('Status der vorherigen Angaben');
    expect(action('send').textContent).toContain('Anfrage jetzt senden');
    action('send').click(); await settle();
    expect(posted(2).requestId).toBe(secondId);
    store.update({ description: 'Unsere Idee' });
    fetchMock.mockResolvedValue(response({ status: 'temporary', outcome: 'not_sent' }, 503));
    action('send').click(); await settle();
    expect(posted(3).requestId).toBe(id);
    expect(container.textContent).toContain('Ausgang eines früheren Versuchs bleibt unklar');
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  it('keeps rate-limit/temporary wait periods manual and reuses the ID after the wait', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => Promise.resolve(response({ status: 'rate_limit', retryAfter: 60 }, 429)));
    preview(); action('send').click(); await settle();
    action('send').click(); await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockImplementation(() => Promise.resolve(response({ status: 'temporary', outcome: 'not_sent', retryAfter: 5 }, 503)));
    action('send').click(); await settle();
    action('send').click(); await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    action('send').click(); await settle();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map((_, index) => posted(index).requestId)).toEqual([id, id, id]);
    expect(container.textContent).toContain('Dieser Versuch wurde sicher nicht versendet');
  });

  it('does not erase or refocus edited input when the pending response arrives', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    preview(); action('send').click();
    action('edit').click(); next(); next();
    change('description', 'Neue Angaben während der Übermittlung');
    const field = container.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    field.focus(); field.setSelectionRange(5, 12, 'backward');
    finish(response({ status: 'temporary', outcome: 'not_sent' }, 503));
    await settle();
    const retained = container.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    expect(retained.value).toBe('Neue Angaben während der Übermittlung');
    expect(document.activeElement).toBe(retained);
    expect([retained.selectionStart, retained.selectionEnd, retained.selectionDirection]).toEqual([5, 12, 'backward']);
    expect(container.textContent).toContain('Status der vorherigen Angaben');
    expect(posted().description).toBe('Unsere Idee');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps one POST locked even when a new preview is edited during a pending attempt', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    preview(); action('send').click();
    store.update({ description: 'Zweite Idee' });
    action('send').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(action('send').disabled).toBe(true);
    finish(response({ status: 'success', requestId: id, duplicate: false })); await settle();
    expect(action('send').disabled).toBe(false);
    expect(action('send').textContent).toContain('Anfrage jetzt senden');
    expect(container.textContent).toContain('Status der vorherigen Angaben');
  });

  it('retains the selected fallback copy while the pending response changes status', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    preview(); action('send').click(); action('copy').click(); await settle();
    const fallback = container.querySelector<HTMLTextAreaElement>('[data-focus="copy-fallback"]')!;
    expect(fallback.value).toContain(`Anfragekennung: ${id}`);
    const value = fallback.value;
    finish(response({ status: 'success', requestId: id, duplicate: false })); await settle();
    const retained = container.querySelector<HTMLTextAreaElement>('[data-focus="copy-fallback"]')!;
    expect(retained.value).toBe(value);
    expect(document.activeElement).toBe(retained);
    expect([retained.selectionStart, retained.selectionEnd]).toEqual([0, value.length]);
  });

  it('offers a focused field correction after server validation, without clearing other fields', async () => {
    fetchMock.mockResolvedValue(response({ status: 'invalid', fields: ['email'] }, 422));
    preview(); action('send').click(); await settle();
    container.querySelector<HTMLButtonElement>('[data-field="email"]')!.click();
    const email = container.querySelector<HTMLInputElement>('[name="email"]')!;
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    change('email', 'korrigiert@example.com');
    next(); action('send').click(); await settle();
    expect(posted(1).requestId).toBe(secondId);
    expect(posted(1).name).toBe('Ada Beispiel');
    expect(posted(1).description).toBe('Unsere Idee');
  });

  it('shows honest UUID unavailability without a POST, and keeps copy/edit available', () => {
    vi.stubGlobal('crypto', {});
    preview(); action('send').click();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('sichere Anfragekennung konnte nicht erstellt werden');
    expect(container.textContent).toContain('Dieser Klick hat nichts versendet');
    expect(action('copy')).not.toBeNull();
    expect(action('edit')).not.toBeNull();
    expect(store.get().description).toBe('Unsere Idee');
  });

  it('enforces field lengths before preview and retains the oversized draft for correction', () => {
    store.update({ name: 'Ada', email: 'ada@example.com', description: 'x'.repeat(5001) });
    next(); next(); next();
    const description = container.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    expect(description.maxLength).toBe(5000);
    expect(description.value).toHaveLength(5001);
    expect(document.activeElement).toBe(description);
    expect(container.textContent).toContain('höchstens 5.000 Zeichen');
    expect(fetchMock).not.toHaveBeenCalled();
    change('description', 'Korrigiert'); next();
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.maxLength).toBe(120);
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.maxLength).toBe(254);
  });

  it('keeps timeout unknown despite a late success and never schedules a retry', async () => {
    vi.useFakeTimers();
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    preview(); action('send').click();
    await vi.advanceTimersByTimeAsync(INQUIRY_TIMEOUT_MS);
    expect(container.textContent).toContain('Wartezeit ist abgelaufen');
    expect(action('send').textContent).toContain('Bewusst erneut versuchen');
    finish(response({ status: 'success', requestId: id, duplicate: false })); await settle();
    expect(container.textContent).toContain('Versandausgang unklar');
    await vi.advanceTimersByTimeAsync(INQUIRY_TIMEOUT_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not update detached UI or steal focus after disposal', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    preview(); action('send').click();
    finder.dispose();
    const before = container.innerHTML;
    finish(response({ status: 'success', requestId: id, duplicate: false })); await settle();
    expect(container.innerHTML).toBe(before);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
