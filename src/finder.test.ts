// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountFinder } from './finder';
import { requestBrief } from './finder-pricing';
import { createBriefStore, type BriefState } from './state';
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
    finder = mountFinder(container, store, { sendEnabled: true });
  });
  afterEach(() => { finder.dispose(); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  function next() { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  /** Website route: Vorhaben, Ziel, Umfang und Inhalte liegen hinter uns, die Orientierung ist offen. */
  function toResult() { next(); next(); next(); next(); }
  function choose(name: string, value: string) { container.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.click(); }
  function change(name: string, value: string) {
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  }
  function preview() { store.update({ name: 'Ada Beispiel', email: 'ada+projekt@example.com', description: 'Unsere Idee' }); toResult(); next(); }
  function action(name: string) { return container.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!; }
  function posted(index = 0): InquiryRequest { return JSON.parse(fetchMock.mock.calls[index][1].body); }
  const text = (selector: string) => container.querySelector(selector)?.textContent ?? '';
  const hasInput = (name: string, value?: string) => container.querySelector(`input[name="${name}"]${value ? `[value="${value}"]` : ''}`) !== null;
  const lineTexts = () => [...container.querySelectorAll('.finder-line-copy strong')].map(item => item.textContent);
  const summary = () => container.querySelector('[data-summary]')!.textContent!;

  it('defaults to a local summary without mandatory contact data or any sending path', async () => {
    finder.dispose();
    finder = mountFinder(container, store);
    next(); next(); next(); next();
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.required).toBe(false);
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.required).toBe(false);
    next();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    expect(container.querySelector('[data-action="send"]')).toBeNull();
    expect(container.textContent).toContain('Der Projektfinder versendet derzeit nichts.');
    const injected = document.createElement('button');
    injected.dataset.action = 'send';
    container.append(injected);
    injected.click();
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('walks the website route and retains all choices and text when revisiting steps', () => {
    expect(container.querySelectorAll('.finder-progress li')).toHaveLength(5);
    expect(text('.finder-heading')).toContain('Worum geht');
    expect(container.querySelectorAll('input[name="finder-purpose"]')).toHaveLength(4);
    choose('finder-purpose', 'existing');
    next();
    choose('finder-goal', 'bookings');
    next();
    choose('finder-scope', 'extended');
    choose('finder-extension', 'cms');
    choose('finder-extension', 'unsure');
    expect(store.get().extensions).toEqual(['unsure']);
    choose('finder-extension', 'language');
    expect(store.get().extensions).toEqual(['language']);
    choose('finder-extension', 'cms');
    next();
    choose('finder-texts', 'notes');
    choose('finder-images', 'missing');
    choose('finder-image-source', 'photo_standard');
    choose('finder-video', 'clip');
    choose('finder-zone', 'region');
    next();
    change('timing', 'later');
    change('description', 'Ein Atelier mit Terminbuchung.');
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    change('selectedPackage', 'complete');
    action('back').click();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-zone"][value="region"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    finder.openAtStart();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-purpose"][value="existing"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-goal"][value="bookings"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-scope"][value="extended"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="finder-extension"][value="cms"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="finder-extension"][value="language"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-texts"][value="notes"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="finder-image-source"][value="photo_standard"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="finder-video"][value="clip"]')!.checked).toBe(true);
    next();
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toBe('Ein Atelier mit Terminbuchung.');
    expect(container.querySelector<HTMLSelectElement>('[name="timing"]')!.value).toBe('later');
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe('Ada Beispiel');
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('ada@example.com');
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('complete');
  });

  it('reflects external goal and package choices without erasing inputs', () => {
    store.update({ goal: 'sales', selectedPackage: 'complete', description: 'Unsere Idee' });
    next();
    expect(container.querySelector<HTMLInputElement>('input[name="finder-goal"][value="sales"]')!.checked).toBe(true);
    next(); next(); next();
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('complete');
    store.update({ selectedPackage: null });
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('auto');
    expect(store.get().description).toBe('Unsere Idee');
  });

  it('does not let the goal choose or reset a package', () => {
    store.update({ selectedPackage: 'business' });
    next();
    choose('finder-goal', 'sales');
    expect(store.get().selectedPackage).toBe('business');
    choose('finder-goal', 'presence');
    expect(store.get()).toMatchObject({ goal: 'presence', selectedPackage: 'business' });
  });

  it.each<[string, Partial<BriefState>, string]>([
    ['nothing special', {}, 'Webbyu Start'],
    ['standard photos', { images: 'missing', imageSource: 'photo_standard' }, 'Webbyu Business'],
    ['standard photos, texts and a clip', { images: 'missing', imageSource: 'photo_standard', texts: 'missing', video: 'clip' }, 'Webbyu Complete'],
    ['a shop', { goal: 'sales' }, 'Individuell klären'],
    ['a large scope', { scope: 'large' }, 'Individuell klären'],
    ['a custom booking', { extensions: ['booking_custom'] }, 'Individuell klären'],
    ['a system integration', { extensions: ['integration'], images: 'missing', imageSource: 'photo_standard' }, 'Individuell klären'],
  ])('recommends for %s and allows a manual choice that can be given up again', (_, patch, label) => {
    store.update(patch);
    toResult();
    expect(text('.finder-recommendation h4')).toBe(label);
    expect(text('.finder-recommendation-label')).toBe('Meine erste Orientierung');
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('auto');
    change('selectedPackage', label === 'Webbyu Business' ? 'start' : 'business');
    expect(text('.finder-recommendation-label')).toBe('Ihre Paketauswahl');
    change('selectedPackage', 'auto');
    expect(text('.finder-recommendation-label')).toBe('Meine erste Orientierung');
    expect(text('.finder-recommendation h4')).toBe(label);
  });

  it('shows the orientation in three blocks with the sum, the notice and the tax text before the contact fields', () => {
    toResult();
    expect([...container.querySelectorAll('.finder-block h4')].map(item => item.textContent)).toEqual(['Einmalige Erstellung', 'Noch zu klären', 'Laufende Kosten bei Ihren Anbietern']);
    expect(text('.finder-sum')).toBe('Summe1.180–2.130 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.');
    expect(text('.finder-fineprint')).toBe('Unverbindliche Orientierung. Verbindlich ist das schriftliche Angebot. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');
    expect(lineTexts()).toEqual(expect.arrayContaining(['Grundlage Ihrer Website', 'Konzept', 'Korrektur', 'Livegang', 'Übergabe', 'Erweiterte Umsetzung', 'Texte, Umfang noch offen', 'Bildquelle noch offen', 'Video, Umfang noch offen', 'Domain und Hosting', 'Rechtstexte']));
    const html = container.innerHTML;
    expect(html.indexOf('finder-blocks')).toBeLessThan(html.indexOf('name="timing"'));
    expect(html.indexOf('name="timing"')).toBeLessThan(html.indexOf('name="description"'));
    expect(html.indexOf('name="description"')).toBeLessThan(html.indexOf('name="name"'));
    expect(html.indexOf('name="name"')).toBeLessThan(html.indexOf('name="email"'));
    expect(container.querySelectorAll('[name="timing"]')).toHaveLength(1);
    // Timing and description moved here from the scope step.
    action('back').click(); action('back').click();
    expect(container.querySelector('[name="timing"], [name="description"]')).toBeNull();
  });

  it('lets the visitor deselect a position, shows the consequence and takes it back', () => {
    store.update({ projectType: 'existing', texts: 'notes', scope: 'compact', images: 'ready', video: 'none' });
    toResult();
    expect(text('.finder-sum')).toContain('1.370 €');
    expect(container.querySelector('[data-line="text_notes"][data-action="remove-line"]')).not.toBeNull();
    expect(container.querySelector('[data-line="base_start"]')).toBeNull();
    container.querySelector<HTMLButtonElement>('[data-line="text_notes"]')!.click();
    expect(text('.finder-sum')).toContain('1.180 €');
    expect(text('.finder-removed')).toContain('Texte aus Ihren Stichpunkten');
    expect(text('.finder-removed')).toContain('Texte liefern Sie selbst. Der Projektstart setzt fertige Texte voraus.');
    expect(store.get().removedLines).toEqual(['text_notes']);
    expect(document.activeElement).toBe(container.querySelector('[data-action="restore-line"][data-line="text_notes"]'));
    container.querySelector<HTMLButtonElement>('[data-action="restore-line"]')!.click();
    expect(text('.finder-sum')).toContain('1.370 €');
    expect(container.querySelector('.finder-removed')).toBeNull();
    expect(store.get().removedLines).toEqual([]);
    expect(document.activeElement).toBe(container.querySelector('[data-action="remove-line"][data-line="text_notes"]'));
  });

  it('turns Complete into an individual composition when a module is deselected', () => {
    store.update({ selectedPackage: 'complete', zone: 'region', scope: 'compact' });
    toResult();
    expect(text('.finder-recommendation h4')).toBe('Webbyu Complete');
    expect(text('.finder-sum')).toContain('1.900 € + 1 offene Position');
    container.querySelector<HTMLButtonElement>('[data-line="text_interview"]')!.click();
    expect(text('.finder-recommendation h4')).toBe('Individuelle Zusammenstellung');
    expect(text('.finder-sum')).toContain('1.510 € + 1 offene Position');
    expect(container.querySelector<HTMLSelectElement>('[name="selectedPackage"]')!.value).toBe('complete');
  });

  it('asks for the place only when photos or a clip belong to the project', () => {
    next(); next(); next();
    expect(hasInput('finder-zone')).toBe(false);
    expect(hasInput('finder-image-source')).toBe(true);
    choose('finder-video', 'clip');
    expect(hasInput('finder-zone')).toBe(true);
    choose('finder-video', 'none');
    expect(hasInput('finder-zone')).toBe(false);
    choose('finder-image-source', 'licensed');
    expect(hasInput('finder-zone')).toBe(false);
    choose('finder-image-source', 'photo_compact');
    expect(hasInput('finder-zone')).toBe(true);
    choose('finder-images', 'ready');
    expect(hasInput('finder-image-source')).toBe(false);
    expect(hasInput('finder-zone')).toBe(false);
  });

  it('never turns missing photos into an appointment and explains the consequence for the design', () => {
    next(); next(); next();
    choose('finder-images', 'missing');
    choose('finder-video', 'none');
    choose('finder-texts', 'ready');
    next();
    expect(lineTexts()).toContain('Bildquelle noch offen');
    action('back').click();
    choose('finder-image-source', 'customer_later');
    expect(hasInput('finder-zone')).toBe(false);
    next();
    expect(lineTexts().filter(item => /Foto|Anfahrt|Bildquelle/.test(item ?? ''))).toEqual([]);
    expect(text('.finder-hints')).toContain('Sie liefern die Bilder später');
    action('back').click();
    choose('finder-image-source', 'no_photos');
    next();
    expect(text('.finder-hints')).toContain('Schrift, Farbe und Fläche');
    expect(lineTexts().filter(item => /Foto|Anfahrt/.test(item ?? ''))).toEqual([]);
  });

  it('asks for the place on the orientation step when a chosen package brings photos along', () => {
    store.update({ selectedPackage: 'business' });
    toResult();
    expect(hasInput('finder-zone')).toBe(true);
    expect(lineTexts()).toContain('Anfahrt außerhalb der Region');
    choose('finder-zone', 'region');
    expect(lineTexts()).toContain('Anfahrt in Ihrer Region');
    expect(lineTexts()).not.toContain('Anfahrt außerhalb der Region');
  });

  it('suggests the selection aid for the inquiry goal and adds it on request', () => {
    toResult();
    expect(text('.finder-suggestion')).toContain('Auswahlhilfe');
    expect(text('.finder-suggestion')).toContain('490 €');
    action('add-wizard').click();
    expect(store.get().extensions).toEqual(['wizard']);
    expect(container.querySelector('.finder-suggestion')).toBeNull();
    expect(lineTexts()).toContain('Auswahlhilfe');
    store.update({ goal: 'presence', extensions: [] });
    expect(container.querySelector('.finder-suggestion')).toBeNull();
  });

  it('walks the media route without a goal question, website positions or hosting', () => {
    choose('finder-purpose', 'media');
    expect(store.get()).toMatchObject({ projectType: 'media', goal: 'media', mediaChoice: 'unknown' });
    expect(container.querySelectorAll('.finder-progress li')).toHaveLength(4);
    next();
    expect(hasInput('finder-media-choice', 'photo_clip')).toBe(true);
    choose('finder-media-choice', 'photo_clip');
    choose('finder-media-use', 'website');
    choose('finder-media-use', 'third_party');
    next();
    choose('finder-zone', 'outside');
    choose('finder-sites', 'multipleSites');
    choose('finder-drone', 'drone');
    next();
    expect(text('.finder-recommendation h4')).toBe('Foto- und Videoprojekt');
    expect(container.querySelector('[name="selectedPackage"]')).toBeNull();
    expect(lineTexts()).toEqual(['Fotos Standard', 'Kurzclip beim Fototermin', 'Anfahrt außerhalb der Region', 'Drohnenaufnahmen', 'Mehrere Standorte oder Weitergabe an Dritte']);
    expect(text('.finder-sum')).toContain('590 € + 4 offene Positionen. Kein vollständiger Gesamtpreis.');
    expect(container.querySelector('.finder-block h4')!.textContent).toBe('Einmalige Erstellung');
    expect(container.textContent).not.toContain('Domain und Hosting');
    expect(container.textContent).not.toContain('Grundlage Ihrer Website');
    expect(text('.finder-fineprint')).toContain('Gemäß § 19 UStG');
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    next();
    expect(summary()).toContain('Fotos und Kurzclip');
    expect(summary()).toContain('Website, Weitergabe an Dritte');
    expect(summary()).toContain('Gewünscht, wird gesondert geklärt');
    expect(summary()).toContain('Einmalige Erstellung');
    expect(summary()).not.toMatch(/Funktionen|Texte|Bildquelle|Erweiterte Umsetzung|Domain und Hosting/);
    action('edit').click();
    choose('finder-purpose', 'new');
    expect(store.get().goal).toBe('inquiries');
    expect(container.querySelectorAll('.finder-progress li')).toHaveLength(5);
  });

  it('sends the media route with its own answers and without website answers', async () => {
    fetchMock.mockResolvedValue(response({ status: 'success', requestId: id, duplicate: false }));
    store.update({ extensions: ['cms'], scope: 'large', texts: 'missing', selectedPackage: 'complete', name: 'Ada Beispiel', email: 'ada@example.com' });
    choose('finder-purpose', 'media');
    next();
    choose('finder-media-choice', 'photo_compact');
    next();
    choose('finder-zone', 'region');
    next();
    next();
    action('send').click();
    await settle();
    expect(posted()).toMatchObject({
      goal: 'media', projectType: 'media', extensions: [], scope: 'unknown', texts: 'unknown', selectedPackage: null, mediaChoice: 'photo_compact', zone: 'region',
      catalogVersion: '2026-11-a', shownLines: [{ id: 'photo_compact_solo', status: 'fixed', min: 349, max: 349 }, { id: 'travel_included', status: 'included', min: 0, max: 0 }],
    });
  });

  it('takes the advice route straight to the contact without any price', async () => {
    fetchMock.mockResolvedValue(response({ status: 'success', requestId: id, duplicate: false }));
    choose('finder-purpose', 'advice');
    expect(container.querySelectorAll('.finder-progress li')).toHaveLength(2);
    next();
    expect(text('.finder-heading')).toContain('erreiche');
    expect(container.querySelector('.finder-blocks')).toBeNull();
    expect(container.querySelector('[name="selectedPackage"]')).toBeNull();
    change('description', 'Ich weiß noch nicht, was ich brauche.');
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    next();
    expect(summary()).toContain('Noch unklar');
    expect(summary()).toContain('Ich weiß noch nicht, was ich brauche.');
    expect(summary()).not.toMatch(/€|Preisorientierung|Ihr Ziel/);
    action('send').click();
    await settle();
    expect(posted()).toMatchObject({ projectType: 'advice', shownLines: [], removedLines: [], extensions: [], selectedPackage: null, catalogVersion: '2026-11-a' });
  });

  it('requires valid contact data and safely displays the complete local summary without a request', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetchSpy);
    store.update({ goal: 'sales', extensions: ['cms', '3d'], projectType: 'existing', timing: 'soon', description: '<img src=x onerror="alert(1)">', selectedPackage: 'complete', scope: 'extended', texts: 'notes', zone: 'region' });
    toResult();
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', '  ');
    change('email', 'keine-adresse');
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    change('name', 'Ada Beispiel');
    change('email', 'ada@example.com');
    next();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    expect(summary()).toContain('Produkte verkaufen');
    expect(summary()).toContain('Webbyu Complete');
    expect(summary()).toContain('Inhalte selbst pflegen');
    expect(summary()).toContain('Etwas Besonderes erleben');
    expect(summary()).toContain('Eine bestehende Website erneuern');
    expect(summary()).toContain('Möglichst bald');
    expect(summary()).toContain('<img src=x onerror="alert(1)">');
    expect(container.querySelector('[data-summary] img')).toBeNull();
    expect(summary()).toContain('Ada Beispiel');
    expect(summary()).toContain('ada@example.com');
    expect(container.textContent).toContain('Nichts versendet');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    action('edit').click();
    expect(store.get().name).toBe('Ada Beispiel');
  });

  it('shows the same three blocks in the preview as the mail will, with the catalog version', () => {
    store.update({ projectType: 'existing', texts: 'notes', scope: 'extended', images: 'missing', imageSource: 'photo_standard', video: 'clip', zone: 'region', extensions: ['wizard', 'cms'], removedLines: ['migration'] });
    preview();
    const entries = Object.fromEntries([...container.querySelectorAll('[data-summary] dl > div')].map(row => [row.querySelector('dt')!.textContent, row.querySelector('dd')!.textContent]));
    expect(Object.keys(entries)).toEqual(expect.arrayContaining(['Einmalige Erstellung', 'Noch zu klären', 'Laufende Kosten bei Ihren Anbietern', 'Summe Erstellung', 'Abgewählt', 'Preisorientierung']));
    expect(entries['Einmalige Erstellung']).toContain('Grundlage Ihrer Website: 990 €');
    expect(entries['Einmalige Erstellung']).toContain('Erweiterte Umsetzung: 750 €');
    expect(entries['Einmalige Erstellung']).toContain('Fotos Standard im Websiteprojekt: 520 €');
    expect(entries['Einmalige Erstellung']).toContain('Anfahrt in Ihrer Region: enthalten');
    expect(entries['Noch zu klären']).toContain('Kurzclip beim Fototermin: offen, Richtwert 390–490 €, kein Festpreis');
    expect(entries['Noch zu klären']).toContain('Inhalte selbst pflegen: offen');
    expect(entries['Laufende Kosten bei Ihren Anbietern']).toContain('Domain und Hosting: ca. 5–15 € pro Monat');
    expect(entries['Summe Erstellung']).toBe('2.940 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.');
    expect(entries['Abgewählt']).toContain('Bestehende Website übernehmen');
    expect(entries['Preisorientierung']).toBe('Unverbindliche Orientierung. Verbindlich ist das schriftliche Angebot. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Katalog 2026-11-a.');
    expect(entries['Zusammenstellung']).toBe('Automatische Empfehlung: Webbyu Complete');
    expect(entries['Ort']).toBe('In der Region');
  });

  it('keeps unknown identifiers from the store out of the request and names the step to correct', () => {
    store.update({ extensions: ['photos'], name: 'Ada', email: 'ada@example.com' });
    next(); next();
    next();
    expect(container.textContent).toContain('Bitte prüfen Sie Ihre Angaben');
    expect(container.querySelector('[data-action="fix"][data-field="extensions"]')!.textContent).toBe('Funktionen prüfen');
    expect(container.querySelector('[data-summary]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(text('.finder-progress [aria-current="step"]')).toContain('Umfang');
    store.update({ extensions: ['cms'], scope: 'huge' as never });
    next();
    expect(container.querySelector('[data-action="fix"][data-field="scope"]')).not.toBeNull();
  });

  it('posts the prices exactly as seen, with the catalog version, and only answers that apply', async () => {
    fetchMock.mockResolvedValue(response({ status: 'success', requestId: id, duplicate: false }));
    store.update({ mediaChoice: 'clip', mediaUse: ['social'], drone: true, sites: 'multipleSites', images: 'ready', imageSource: 'photo_standard', texts: 'notes', scope: 'extended', removedLines: ['text_notes', 'migration'] });
    preview();
    action('send').click();
    await settle();
    const request = posted();
    expect(request).toEqual(JSON.parse(JSON.stringify({ ...requestBrief(store.get()), requestId: id, website: '' })));
    expect(request).toMatchObject({ catalogVersion: '2026-11-a', mediaChoice: null, mediaUse: [], drone: false, sites: 'oneSite', imageSource: null, removedLines: ['text_notes'], zone: 'unknown' });
    expect(request.shownLines.map(item => item.id)).toEqual(['base_start', 'concept', 'correction', 'golive', 'handover', 'scope_extended', 'clip_unknown', 'hosting', 'legal']);
    expect(request.shownLines).toHaveLength(9); // the deselected text position is not among the shown ones
    expect(request.shownLines[0]).toEqual({ id: 'base_start', status: 'fixed', min: 990, max: 990 });
    expect(store.get().shownLines).toEqual(request.shownLines);
    expect(store.get().catalogVersion).toBe('2026-11-a');
  });

  it.each(['start', 'business', 'complete', 'custom'] as const)('copies the %s briefing with prices and the notice on request only after the copy button is pressed', async selectedPackage => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    store.update({ selectedPackage, name: 'Ada Beispiel', email: 'ada@example.com', description: 'Ein neuer Auftritt.' });
    toResult(); next();
    expect(writeText).not.toHaveBeenCalled();
    action('copy').click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('Ihre Idee: Ein neuer Auftritt.');
    expect(copied).toContain('Einmalige Erstellung: ');
    expect(copied).toContain('Noch zu klären: ');
    expect(copied).toContain('Laufende Kosten bei Ihren Anbietern: ');
    expect(copied).toContain('Unverbindliche Orientierung. Verbindlich ist das schriftliche Angebot.');
    expect(copied).toContain('Katalog 2026-11-a');
    expect(copied).toContain('Vorschau – nichts versendet.');
    expect(container.querySelector('.finder-copy-status')!.textContent).toContain('wurde kopiert');
  });

  it('retains a sales goal and the scope notice when Complete is manually requested and copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    store.update({ goal: 'sales', extensions: ['cms'], name: 'Ada', email: 'ada@example.com' });
    toResult();
    expect(text('.finder-recommendation h4')).toBe('Individuell klären');
    expect(text('.finder-recommendation')).toContain('Dafür gibt es keinen Pauschalumfang: Shop.');
    expect(text('.finder-recommendation')).toContain('in keinem der drei Website-Pakete');
    change('selectedPackage', 'complete');
    expect(store.get().goal).toBe('sales');
    expect(text('.finder-hints')).toContain('Shops, komplexe Buchungen und individuelle Integrationen benötigen einen gesonderten Umfang und ein eigenes Angebot.');
    expect(text('.finder-hints')).toContain('Außerhalb der drei Pakete liegt: Shop.');
    expect(lineTexts()).toEqual(expect.arrayContaining(['Shop', 'Inhalte selbst pflegen']));
    next();
    action('copy').click();
    await Promise.resolve();
    expect(writeText.mock.calls[0][0]).toContain('Zusammenstellung: Webbyu Complete');
    expect(writeText.mock.calls[0][0]).toContain('Shops, komplexe Buchungen');
    expect(writeText.mock.calls[0][0]).toContain('Produkte verkaufen');
    expect(writeText.mock.calls[0][0]).toContain('Shop: offen');
  });

  it('keeps the briefing available when clipboard access is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
    store.update({ name: 'Ada Beispiel', email: 'ada@example.com' });
    toResult(); next();
    action('copy').click();
    await Promise.resolve();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
    const fallback = container.querySelector<HTMLTextAreaElement>('[data-focus="copy-fallback"]')!;
    expect(fallback.value).toContain('ada@example.com');
    expect(fallback.value).toContain('Summe Erstellung: ');
    expect(fallback.value).toContain('Unverbindliche Orientierung.');
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
    expect(posted()).toEqual(JSON.parse(JSON.stringify({ ...requestBrief(store.get()), requestId: id, website: '' })));
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
    action('edit').click(); toResult();
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
    action('edit').click(); toResult(); next();
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
    action('edit').click(); toResult();
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
    toResult();
    const description = container.querySelector<HTMLTextAreaElement>('[name="description"]')!;
    expect(description.maxLength).toBe(5000);
    expect(description.value).toHaveLength(5001);
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.maxLength).toBe(120);
    expect(container.querySelector<HTMLInputElement>('[name="email"]')!.maxLength).toBe(254);
    next();
    expect(container.querySelector('[data-summary]')).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('[name="description"]'));
    expect(container.textContent).toContain('höchstens 5.000 Zeichen');
    expect(container.querySelector<HTMLTextAreaElement>('[name="description"]')!.value).toHaveLength(5001);
    expect(fetchMock).not.toHaveBeenCalled();
    change('description', 'Korrigiert'); next();
    expect(container.querySelector('[data-summary]')).not.toBeNull();
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
