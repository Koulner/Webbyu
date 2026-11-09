import { describe, expect, it } from 'vitest';
import { CATALOG_VERSION } from './pricing-catalog';
import { createBriefStore, recommendPackage, type BriefState } from './state';

const brief = (patch: Partial<BriefState> = {}): BriefState => ({ ...createBriefStore().get(), ...patch });

describe('recommendation by the first matching rule', () => {
  it('starts with Start and the chosen modules when nothing speaks for more', () => {
    expect(recommendPackage(brief())).toBe('start');
    expect(recommendPackage(brief({ goal: 'presence' }))).toBe('start');
    expect(recommendPackage(brief({ goal: 'bookings', extensions: ['booking_embed', 'cms', 'language', 'wizard', '3d'] }))).toBe('start');
    expect(recommendPackage(brief({ images: 'partly', imageSource: 'photo_compact', texts: 'missing', video: 'clip' }))).toBe('start');
  });

  it('does not let the goal choose a package any more', () => {
    for (const goal of ['presence', 'inquiries', 'bookings'] as const) expect(recommendPackage(brief({ goal }))).toBe('start');
  });

  it('recommends Business for standard photos and Complete when texts and a clip come with them', () => {
    const photos = { images: 'missing', imageSource: 'photo_standard' } as const;
    expect(recommendPackage(brief(photos))).toBe('business');
    expect(recommendPackage(brief({ ...photos, video: 'clip' }))).toBe('business');
    expect(recommendPackage(brief({ ...photos, texts: 'missing' }))).toBe('business');
    expect(recommendPackage(brief({ ...photos, texts: 'missing', video: 'clip' }))).toBe('complete');
    expect(recommendPackage(brief({ ...photos, texts: 'notes', video: 'clip' }))).toBe('complete');
    expect(recommendPackage(brief({ ...photos, texts: 'ready', video: 'clip' }))).toBe('business');
    expect(recommendPackage(brief({ ...photos, texts: 'unknown', video: 'clip' }))).toBe('business');
  });

  it('ignores a standard photo choice that is no longer asked because the images are ready', () => {
    expect(recommendPackage(brief({ images: 'ready', imageSource: 'photo_standard', texts: 'missing', video: 'clip' }))).toBe('start');
  });

  it.each([
    [{ scope: 'large' }], [{ goal: 'sales' }], [{ extensions: ['booking_custom'] }], [{ extensions: ['integration', 'cms'] }],
  ] as const)('sends %j to an individual clarification before any package rule, even with photos, texts and a clip', patch => {
    expect(recommendPackage(brief({ ...patch, images: 'missing', imageSource: 'photo_standard', texts: 'missing', video: 'clip' } as Partial<BriefState>))).toBe('custom');
  });

  it('leaves the other additional functions to the package rules', () => {
    for (const extension of ['wizard', 'booking_embed', 'language', 'cms', '3d', 'unsure']) {
      expect(recommendPackage(brief({ extensions: [extension] }))).toBe('start');
    }
  });

  it('offers no website package on the media route or when the visitor wants to talk first', () => {
    for (const projectType of ['media', 'advice'] as const) {
      expect(recommendPackage(brief({ projectType, images: 'missing', imageSource: 'photo_standard', texts: 'missing', video: 'clip' }))).toBe('custom');
    }
  });
});

describe('project brief state', () => {
  it('starts with honest, unanswered defaults and the current catalog version', () => {
    expect(createBriefStore().get()).toEqual({
      goal: 'inquiries', extensions: [], projectType: 'new', timing: 'flexible', description: '', name: '', email: '', selectedPackage: null,
      scope: 'unknown', texts: 'unknown', images: 'unknown', imageSource: null, video: 'unknown', zone: 'unknown',
      mediaChoice: null, mediaUse: [], sites: 'oneSite', drone: false, removedLines: [], catalogVersion: CATALOG_VERSION, shownLines: [],
    });
    expect(CATALOG_VERSION).toBe('2026-11-a');
  });

  it('preserves project and contact inputs when the goal changes', () => {
    const store = createBriefStore();
    store.update({ extensions: ['cms', '3d'], projectType: 'existing', timing: 'later', description: 'Ein eigener Shop', name: 'Ada', email: 'ada@example.com', selectedPackage: 'business', scope: 'extended', texts: 'notes' });
    const before = store.get();
    store.update({ goal: 'sales' });
    expect(store.get()).toEqual({ ...before, goal: 'sales' });
  });

  it('isolates every list from the stored brief and from each subscriber snapshot', () => {
    const store = createBriefStore();
    const extensions = ['cms'];
    const removedLines = ['migration'];
    const shownLines = [{ id: 'base_start', status: 'fixed' as const, min: 990, max: 990 }];
    let received: BriefState | undefined;
    store.subscribe(snapshot => { snapshot.extensions.push('unexpected'); snapshot.mediaUse.push('unexpected'); snapshot.shownLines.forEach(line => { line.min = 1; }); snapshot.name = 'changed'; });
    const unsubscribe = store.subscribe(snapshot => { received = snapshot; });
    store.update({ extensions, removedLines, shownLines, mediaUse: ['ads'], name: 'Ada' });
    extensions.push('external');
    removedLines.push('external');
    shownLines[0].max = 5;
    const snapshot = store.get();
    snapshot.extensions.push('also external');
    snapshot.shownLines.push({ id: 'cms', status: 'open', min: 0, max: 0 });
    expect(received?.extensions).toEqual(['cms']);
    expect(received?.shownLines).toEqual([{ id: 'base_start', status: 'fixed', min: 990, max: 990 }]);
    expect(store.get().extensions).toEqual(['cms']);
    expect(store.get().removedLines).toEqual(['migration']);
    expect(store.get().mediaUse).toEqual(['ads']);
    expect(store.get().shownLines).toEqual([{ id: 'base_start', status: 'fixed', min: 990, max: 990 }]);
    expect(store.get().name).toBe('Ada');
    unsubscribe();
    store.update({ extensions: ['language'] });
    expect(received?.extensions).toEqual(['cms']);
  });
});
