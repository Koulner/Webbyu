import { afterEach, describe, expect, it, vi } from 'vitest';
import { LINE_IDS } from './pricing-catalog';
import { createBriefStore, type BriefState } from './state';
import type { InquiryRequest, InquiryResponse } from './inquiry-contract';
import { createInquiryId, INQUIRY_TIMEOUT_MS, inquiryFingerprint, inquiryFits, invalidInquiryFields, isInquiryResponse, postInquiry } from './inquiry-client';

const id = '12345678-1234-4123-8123-123456789abc';
const originalId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const brief = () => ({ ...createBriefStore().get(), name: 'Ada Beispiel', email: 'ada+projekt@example.com' });
const request = (): InquiryRequest => ({ ...brief(), requestId: id, website: '' });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('inquiry response contract at runtime', () => {
  it.each<[number, InquiryResponse]>([
    [200, { status: 'success', requestId: id, duplicate: false }],
    [200, { status: 'success', requestId: originalId, duplicate: true }],
    [422, { status: 'invalid', fields: ['email', 'requestId'] }],
    [403, { status: 'invalid', fields: [] }],
    [429, { status: 'rate_limit', retryAfter: 3600 }],
    [503, { status: 'temporary', outcome: 'not_sent' }],
    [503, { status: 'temporary', outcome: 'not_sent', retryAfter: 5 }],
    [503, { status: 'temporary', outcome: 'unknown' }],
  ])('accepts the specified %s response %j', (http, value) => {
    expect(isInquiryResponse(value, http, id)).toBe(true);
  });

  it.each([
    [200, null], [200, []], [200, '<html>OK</html>'], [200, {}],
    [200, { status: 'success', requestId: id }],
    [200, { status: 'success', requestId: id, duplicate: 'false' }],
    [200, { status: 'success', requestId: originalId, duplicate: false }],
    [200, { status: 'success', requestId: 'anything', duplicate: true }],
    [503, { status: 'success', requestId: id, duplicate: false }],
    [200, { status: 'invalid', fields: [] }],
    [422, { status: 'invalid', fields: ['unknown-field'] }],
    [422, { status: 'invalid', fields: 'email' }],
    [429, { status: 'rate_limit', retryAfter: 0 }],
    [429, { status: 'rate_limit', retryAfter: -1 }],
    [429, { status: 'rate_limit', retryAfter: '60' }],
    [429, { status: 'rate_limit', retryAfter: 1.5 }],
    [429, { status: 'rate_limit', retryAfter: Number.MAX_SAFE_INTEGER + 1 }],
    [503, { status: 'temporary', outcome: 'delivered' }],
    [503, { status: 'temporary', outcome: 'not_sent', retryAfter: null }],
    [500, { status: 'temporary', outcome: 'unknown' }],
    [200, { status: 'success', requestId: id, duplicate: false, delivered: true }],
  ])('rejects unexpected HTTP/schema combination %s %j', (http, value) => {
    expect(isInquiryResponse(value, http as number, id)).toBe(false);
  });
});

describe('local inquiry safeguards', () => {
  it('uses only a valid secure platform UUID, including honest failure', () => {
    const randomUUID = vi.fn().mockReturnValue(id);
    vi.stubGlobal('crypto', { randomUUID });
    expect(createInquiryId()).toBe(id);
    randomUUID.mockReturnValue('insecure');
    expect(createInquiryId()).toBeNull();
    randomUUID.mockImplementation(() => { throw new Error('Unavailable'); });
    expect(createInquiryId()).toBeNull();
    vi.stubGlobal('crypto', {});
    expect(createInquiryId()).toBeNull();
  });

  it('compares stable contents, including reordered extensions, whitespace and genuine changes', () => {
    const state = { ...brief(), description: '  Idee\r\nText  ', extensions: ['language', 'cms'], mediaUse: ['website', 'ads'], removedLines: ['text_notes', 'migration'] };
    const key = inquiryFingerprint(state, '');
    expect(inquiryFingerprint({ ...state, description: 'Idee\nText', email: 'ADA+PROJEKT@example.com', extensions: ['cms', 'language'], mediaUse: ['ads', 'website'], removedLines: ['migration', 'text_notes'] }, '')).toBe(key);
    for (const patch of [
      { goal: 'sales' as const }, { description: 'andere Idee' }, { name: 'Berta' }, { email: 'berta@example.com' }, { timing: 'soon' }, { projectType: 'existing' as const }, { selectedPackage: 'start' as const }, { extensions: ['wizard'] },
      { scope: 'compact' as const }, { texts: 'missing' as const }, { images: 'ready' as const }, { imageSource: 'licensed' as const }, { video: 'clip' as const }, { zone: 'outside' as const },
      { mediaChoice: 'clip' as const }, { mediaUse: ['social'] }, { sites: 'multipleSites' as const }, { drone: true }, { removedLines: ['migration'] }, { catalogVersion: '2026-12-a' },
      { shownLines: [{ id: 'base_start', status: 'fixed' as const, min: 1190, max: 1190 }] },
    ]) {
      expect(inquiryFingerprint({ ...state, ...patch }, '')).not.toBe(key);
    }
    // PHP trim does not remove non-breaking spaces; do not reuse a conflicting ID.
    expect(inquiryFingerprint({ ...state, name: '\u00a0Ada Beispiel' }, '')).not.toBe(key);
  });

  it('enforces the existing field limits, Unicode counts, ASCII mailbox and control-character rules', () => {
    expect(invalidInquiryFields(brief())).toEqual([]);
    expect(invalidInquiryFields({ ...brief(), name: '😀'.repeat(120), description: '😀'.repeat(5000) })).toEqual([]);
    expect(invalidInquiryFields({ ...brief(), name: 'n'.repeat(121), description: 'd'.repeat(5001), email: 'e'.repeat(255) })).toEqual(['description', 'name', 'email']);
    expect(invalidInquiryFields({ ...brief(), name: '  ', description: '\u0000', email: 'ä@example.com' })).toEqual(['description', 'name', 'email']);
    expect(invalidInquiryFields({ ...brief(), name: 'Ada\nB', email: 'ada@example.com\n' })).toEqual(['name', 'email']);
    expect(invalidInquiryFields({ ...brief(), extensions: ['unsure', 'cms'], projectType: 'broken' as never, timing: 'broken' })).toEqual(['extensions', 'projectType', 'timing']);
    expect(inquiryFits(request())).toBe(true);
    expect(inquiryFits({ ...request(), description: '😀'.repeat(10_000) })).toBe(false);
  });
});

describe('Projektberater fields', () => {
  const line = (id: string, status = 'fixed', min = 0, max = min) => ({ id, status, min, max }) as BriefState['shownLines'][number];

  it('accepts every documented value and rejects unknown identifiers, also for the retired extensions', () => {
    expect(invalidInquiryFields({ ...brief(), goal: 'media', projectType: 'media', mediaChoice: 'photo_clip', mediaUse: ['website', 'social', 'ads', 'third_party'], sites: 'multipleSites', drone: true })).toEqual([]);
    expect(invalidInquiryFields({ ...brief(), projectType: 'advice' })).toEqual([]);
    expect(invalidInquiryFields({ ...brief(), extensions: ['wizard', 'booking_embed', 'booking_custom', 'language', 'cms', 'integration', '3d'] })).toEqual([]);
    for (const retired of ['photos', 'videos', 'seo', 'maps', 'booking']) expect(invalidInquiryFields({ ...brief(), extensions: [retired] })).toEqual(['extensions']);
    const bad = 'unbekannt' as never;
    expect(invalidInquiryFields({ ...brief(), goal: bad, scope: bad, texts: bad, images: bad, imageSource: bad, video: bad, zone: bad, mediaChoice: bad, sites: bad })).toEqual(['goal', 'scope', 'texts', 'images', 'imageSource', 'video', 'zone', 'mediaChoice', 'sites']);
    expect(invalidInquiryFields({ ...brief(), mediaUse: ['bad'], drone: 'yes' as never, removedLines: ['base_start'], catalogVersion: 'latest' })).toEqual(['mediaUse', 'drone', 'removedLines', 'catalogVersion']);
    expect(invalidInquiryFields({ ...brief(), mediaUse: ['ads', 'ads'], removedLines: ['migration', 'migration'], catalogVersion: '2026-11-A' })).toEqual(['mediaUse', 'removedLines', 'catalogVersion']);
  });

  it('limits the shown positions to 30 unique, known entries with whole-euro amounts', () => {
    expect(invalidInquiryFields({ ...brief(), shownLines: [line('base_start', 'fixed', 990), line('hosting', 'external'), line('3d', 'open')] })).toEqual([]);
    const ids = LINE_IDS.slice(0, 31);
    expect(invalidInquiryFields({ ...brief(), shownLines: ids.slice(0, 30).map(id => line(id, 'open')) })).toEqual([]);
    for (const shownLines of [
      ids.map(id => line(id, 'open')), [line('unbekannt')], [line('base_start', 'gratis')], [line('base_start', 'fixed', 990), line('base_start', 'fixed', 990)],
      [line('base_start', 'fixed', -1, 5)], [line('base_start', 'fixed', 9, 5)], [line('base_start', 'fixed', 100_001)], [line('base_start', 'fixed', 1.5, 2)],
      [{ ...line('base_start'), min: '990' as never }], 'x' as never, [null as never],
    ]) expect(invalidInquiryFields({ ...brief(), shownLines })).toEqual(['shownLines']);
  });

  it('keeps shown positions in the duplicate fingerprint in their displayed order', () => {
    const first = [line('base_start', 'fixed', 990), line('wizard', 'fixed', 490)];
    const key = inquiryFingerprint({ ...brief(), shownLines: first }, '');
    expect(inquiryFingerprint({ ...brief(), shownLines: [...first].reverse() }, '')).not.toBe(key);
    expect(inquiryFingerprint({ ...brief(), shownLines: first.map(item => ({ ...item })) }, '')).toBe(key);
  });
});

describe('mocked inquiry transport', () => {
  it('makes one same-origin JSON POST and accepts a duplicate with the original different ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success', requestId: originalId, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(postInquiry(request())).resolves.toEqual({ status: 'success', requestId: originalId, duplicate: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/inquiry.php', expect.objectContaining({ method: 'POST', credentials: 'same-origin', redirect: 'error', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request()) }));
  });

  it.each([
    ['HTML', new Response('<html>OK</html>', { headers: { 'Content-Type': 'text/html' } })],
    ['invalid JSON', new Response('{', { headers: { 'Content-Type': 'application/json' } })],
    ['wrong HTTP', new Response(JSON.stringify({ status: 'success', requestId: id, duplicate: false }), { status: 502, headers: { 'Content-Type': 'application/json' } })],
  ])('treats %s as an uncertain result without retrying', async (_, response) => {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    await expect(postInquiry(request())).rejects.toMatchObject({ reason: 'response' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats connection failure as uncertain without retrying', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network failed'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(postInquiry(request())).rejects.toMatchObject({ reason: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('times out a stalled response body, aborts waiting and ignores late success', async () => {
    vi.useFakeTimers();
    let resolveBody!: (body: unknown) => void;
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, headers: new Headers({ 'Content-Type': 'application/json' }), json: () => new Promise(resolve => { resolveBody = resolve; }) });
    vi.stubGlobal('fetch', fetchMock);
    const pending = expect(postInquiry(request())).rejects.toMatchObject({ reason: 'timeout' });
    await vi.advanceTimersByTimeAsync(INQUIRY_TIMEOUT_MS);
    await pending;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    resolveBody({ status: 'success', requestId: id, duplicate: false });
    await vi.advanceTimersByTimeAsync(INQUIRY_TIMEOUT_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
