import { describe, expect, it } from 'vitest';
import { euro, INDIVIDUAL_LABEL, lineAmount, orientation, requestBrief, sumText } from './finder-pricing';
import { catalogLineMap, catalogPackages, CATALOG_VERSION, LINE_IDS, REMOVABLE_LINE_IDS } from './pricing-catalog';
import { createBriefStore, EXTENSION_IDS, IMAGE_SOURCES, IMAGE_STATES, SCOPES, TEXT_STATES, VIDEO_STATES, ZONES, type BriefState } from './state';
import { invalidInquiryFields } from './inquiry-client';

const brief = (patch: Partial<BriefState> = {}): BriefState => ({ ...createBriefStore().get(), name: 'Ada', email: 'ada@example.com', ...patch });
const settled = { scope: 'compact', texts: 'ready', images: 'ready', video: 'none' } as const;
const ids = (state: BriefState) => orientation(state).lines.map(line => line.id);
const line = (state: BriefState, id: string) => orientation(state).lines.find(item => item.id === id);
const sum = (state: BriefState) => sumText(orientation(state).sum);

describe('price catalog', () => {
  it('is one versioned data set', () => {
    expect(CATALOG_VERSION).toBe('2026-11-a');
    expect(Object.keys(catalogLineMap)).toEqual(LINE_IDS);
  });

  it('prices only what can be priced and never a necessary service at 0 €', () => {
    for (const [id, entry] of Object.entries(catalogLineMap)) {
      if (entry.fixed !== undefined) expect(entry.fixed, id).toBeGreaterThan(0);
      if (entry.range) expect(entry.range[0], id).toBeLessThanOrEqual(entry.range[1]);
    }
    // Only a position that can really fall away has a lower bound of 0 €: the extended scope.
    expect(Object.entries(catalogLineMap).filter(([, entry]) => entry.range?.[0] === 0).map(([id]) => id)).toEqual(['scope_extended']);
  });

  it('explains the consequence of every position the visitor may deselect', () => {
    expect(REMOVABLE_LINE_IDS).toEqual(['migration', 'text_notes', 'text_interview']);
    for (const id of REMOVABLE_LINE_IDS) expect(catalogLineMap[id].consequence, id).toBeTruthy();
    expect(catalogLineMap.text_notes.consequence).toBe('Texte liefern Sie selbst. Der Projektstart setzt fertige Texte voraus.');
  });

  it('defines the three packages as module lists from the specification', () => {
    expect(catalogPackages).toEqual({
      start: { text: null, photo: null, clip: null },
      business: { text: null, photo: 'photo_standard_site', clip: null },
      complete: { text: 'text_interview', photo: 'photo_standard_site', clip: 'clip_addon' },
    });
    expect(catalogLineMap.base_start.fixed! + catalogLineMap.photo_standard_site.fixed!).toBe(1510);
    expect(catalogLineMap.base_start.fixed! + catalogLineMap.text_interview.fixed! + catalogLineMap.photo_standard_site.fixed!).toBe(1900);
  });
});

describe('website route: positions, groups and sums', () => {
  it('shows the base, the included services and the external costs for a fully settled project', () => {
    const o = orientation(brief(settled));
    expect(o.lines.map(item => [item.id, item.status])).toEqual([
      ['base_start', 'fixed'], ['concept', 'included'], ['correction', 'included'], ['golive', 'included'], ['handover', 'included'],
      ['hosting', 'external'], ['legal', 'external'],
    ]);
    expect(o.creation.map(item => item.id)).toEqual(['base_start', 'concept', 'correction', 'golive', 'handover']);
    expect(o.open).toEqual([]);
    expect(o.external.map(item => lineAmount(item))).toEqual(['ca. 5–15 € pro Monat', 'je nach Anbieter']);
    expect(sum(brief(settled))).toBe('990 €');
    expect(o.label).toBe('Webbyu Start');
  });

  it('adds up fixed and range positions and names the open ones, never giving a lone sum', () => {
    // Specification example: 990 € + 190–390 € for the texts, two positions still open.
    expect(sum(brief({ ...settled, texts: 'unknown', images: 'unknown', video: 'unknown' }))).toBe('1.180–1.380 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.');
    expect(sum(brief({ ...settled, texts: 'unknown' }))).toBe('1.180–1.380 €');
    expect(sum(brief({ ...settled, video: 'unknown' }))).toBe('990 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(sum(brief({ ...settled, texts: 'notes', scope: 'extended' }))).toBe('1.930 €');
    expect(sum(brief())).toBe('1.180–2.130 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.');
  });

  it('keeps open and external positions out of every sum', () => {
    const state = brief({ ...settled, scope: 'large', goal: 'sales', extensions: ['cms', 'booking_custom', 'integration', '3d'] });
    const o = orientation(state);
    expect(o.open.map(item => item.id)).toEqual(['scope_large', 'booking_custom', 'cms', 'integration', '3d', 'shop']);
    expect(o.sum).toMatchObject({ min: 990, max: 990, open: 6 });
    expect(sumText(o.sum)).toBe('990 € + 6 offene Positionen. Kein vollständiger Gesamtpreis.');
    expect(lineAmount(line(state, 'scope_large')!)).toBe('offen, ab etwa 1.500 €');
  });

  it('prices the scope by status: nothing, fixed, open or a range that can fall away', () => {
    expect(line(brief({ ...settled, scope: 'compact' }), 'scope_extended')).toBeUndefined();
    expect(line(brief({ ...settled, scope: 'extended' }), 'scope_extended')).toMatchObject({ status: 'fixed', min: 750, max: 750 });
    expect(line(brief({ ...settled, scope: 'large' }), 'scope_large')).toMatchObject({ status: 'open', min: 0, max: 0 });
    expect(line(brief({ ...settled, scope: 'unknown' }), 'scope_extended')).toMatchObject({ status: 'range', min: 0, max: 750 });
  });

  it('prices a renewal with its migration and the three text cases', () => {
    expect(line(brief({ ...settled, projectType: 'existing' }), 'migration')).toMatchObject({ status: 'fixed', min: 190, removable: true });
    expect(line(brief(settled), 'migration')).toBeUndefined();
    expect(line(brief({ ...settled, texts: 'notes' }), 'text_notes')).toMatchObject({ status: 'fixed', min: 190, removable: true });
    expect(line(brief({ ...settled, texts: 'missing' }), 'text_interview')).toMatchObject({ status: 'fixed', min: 390, removable: true });
    expect(line(brief({ ...settled, texts: 'unknown' }), 'text_unknown')).toMatchObject({ status: 'range', min: 190, max: 390, removable: false });
    expect(ids(brief(settled)).filter(id => id.startsWith('text_'))).toEqual([]);
  });

  it('prices the functions: three fixed, five open, and an open shop for the sales goal', () => {
    const state = brief({ ...settled, extensions: ['wizard', 'booking_embed', 'language'] });
    expect(['wizard', 'embed', 'language'].map(id => line(state, id))).toMatchObject([
      { status: 'fixed', min: 490 }, { status: 'fixed', min: 150 }, { status: 'fixed', min: 290 },
    ]);
    expect(sum(state)).toBe('1.920 €');
    for (const id of ['booking_custom', 'cms', 'integration', '3d'] as const) expect(line(brief({ ...settled, extensions: [id] }), id)).toMatchObject({ status: 'open', min: 0, max: 0 });
    expect(line(brief({ ...settled, extensions: ['unsure'] }), 'unsure')).toMatchObject({ status: 'open' });
    expect(line(brief({ ...settled, goal: 'sales' }), 'shop')).toMatchObject({ status: 'open' });
    expect(line(brief({ ...settled, goal: 'bookings' }), 'shop')).toBeUndefined();
  });
});

describe('images, video and place', () => {
  it('prices each image source exactly once and leaves a licensed source with external license costs', () => {
    const source = (imageSource: BriefState['imageSource']) => brief({ ...settled, images: 'partly', imageSource });
    expect(ids(source('photo_compact'))).toContain('photo_compact_site');
    expect(line(source('photo_compact'), 'photo_compact_site')).toMatchObject({ status: 'fixed', min: 299 });
    expect(line(source('photo_standard'), 'photo_standard_site')).toMatchObject({ status: 'fixed', min: 520 });
    expect(line(source('licensed'), 'image_licensed')).toMatchObject({ status: 'fixed', min: 90 });
    expect(line(source('licensed'), 'license_cost')).toMatchObject({ status: 'external' });
    expect(sum(source('licensed'))).toBe('1.080 €');
    expect(line(source('open'), 'image_open')).toMatchObject({ status: 'open' });
  });

  it('turns missing photo choices into an open position, never into an appointment', () => {
    for (const images of ['partly', 'missing', 'unknown'] as const) {
      expect(line(brief({ ...settled, images, imageSource: null }), 'image_open'), images).toMatchObject({ status: 'open' });
    }
    for (const imageSource of ['customer_later', 'no_photos'] as const) {
      const o = orientation(brief({ ...settled, images: 'missing', imageSource }));
      expect(o.lines.map(item => item.id).filter(id => /photo|image|travel|clip/.test(id)), imageSource).toEqual([]);
      expect(o.needsZone).toBe(false);
      expect(o.notes.join(' ')).toContain('keine Fototermin-Position');
      expect(sumText(o.sum)).toBe('990 €');
    }
    expect(orientation(brief({ ...settled, images: 'missing', imageSource: 'no_photos' })).notes.join(' ')).toContain('Schrift, Farbe und Fläche');
    expect(orientation(brief({ ...settled, images: 'missing', imageSource: 'customer_later' })).notes.join(' ')).toContain('Sie liefern die Bilder später');
  });

  it('does not ask for a source, and ignores an old one, when the images are ready', () => {
    const state = brief({ ...settled, images: 'ready', imageSource: 'photo_standard' });
    expect(ids(state).filter(id => /photo|image/.test(id))).toEqual([]);
    expect(requestBrief(state).imageSource).toBeNull();
    expect(requestBrief({ ...state, images: 'partly', imageSource: null }).imageSource).toBe('open');
  });

  it('prices a clip as open with its orientation, with or without Webbyu photos', () => {
    const withPhoto = brief({ ...settled, video: 'clip', images: 'missing', imageSource: 'photo_compact' });
    expect(line(withPhoto, 'clip_addon')).toMatchObject({ status: 'open', min: 0, max: 0 });
    expect(line(withPhoto, 'clip_solo')).toBeUndefined();
    expect(lineAmount(line(withPhoto, 'clip_addon')!)).toBe('offen, Richtwert 390–490 €, kein Festpreis');
    const alone = brief({ ...settled, video: 'clip' });
    expect(lineAmount(line(alone, 'clip_solo')!)).toBe('offen, Richtwert 590–790 €, kein Festpreis');
    const licensed = brief({ ...settled, video: 'clip', images: 'partly', imageSource: 'licensed' });
    expect(line(licensed, 'clip_solo')).toBeDefined();
    expect(line(brief({ ...settled, video: 'unknown' }), 'clip_unknown')).toMatchObject({ status: 'open' });
    expect(ids(brief({ ...settled, video: 'none' })).filter(id => id.startsWith('clip'))).toEqual([]);
    expect(sum(alone)).toBe('990 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.'); // clip and a trip that is still open
    expect(sum({ ...alone, zone: 'region' })).toBe('990 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
  });

  it('includes the trip inside the region and opens it outside, once, for photos and a clip together', () => {
    const shoot = (zone: BriefState['zone']) => brief({ ...settled, video: 'clip', images: 'missing', imageSource: 'photo_standard', zone });
    expect(line(shoot('region'), 'travel_included')).toMatchObject({ status: 'included', min: 0 });
    expect(line(shoot('region'), 'travel_open')).toBeUndefined();
    for (const zone of ['outside', 'unknown'] as const) {
      expect(ids(shoot(zone)).filter(id => id.startsWith('travel'))).toEqual(['travel_open']);
      expect(line(shoot(zone), 'travel_open')).toMatchObject({ status: 'open' });
    }
    expect(ids(brief(settled)).some(id => id.startsWith('travel'))).toBe(false);
  });

  it('asks for the place only with Webbyu photos or a clip', () => {
    expect(orientation(brief({ ...settled, images: 'missing', imageSource: 'photo_compact' })).zoneAsked).toBe(true);
    expect(orientation(brief({ ...settled, video: 'clip' })).zoneAsked).toBe(true);
    expect(orientation(brief({ ...settled, images: 'missing', imageSource: 'licensed' })).zoneAsked).toBe(false);
    expect(orientation(brief({ ...settled, video: 'unknown' })).zoneAsked).toBe(false);
  });
});

describe('package choice replaces the groups text, photo and clip', () => {
  const answers = brief({ ...settled, texts: 'notes', images: 'partly', imageSource: 'photo_standard', video: 'clip', zone: 'region' });

  it('keeps the answers when the recommendation is automatic and names the matching package', () => {
    const o = orientation({ ...answers, texts: 'missing' });
    expect(o.recommended).toBe('complete');
    expect(o.choice).toBe('complete');
    expect(o.label).toBe('Webbyu Complete');
    expect(o.lines.map(item => item.id)).toEqual(['base_start', 'concept', 'correction', 'golive', 'handover', 'text_interview', 'photo_standard_site', 'clip_addon', 'travel_included', 'hosting', 'legal']);
    expect(sumText(o.sum)).toBe('1.900 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(orientation(answers).label).toBe('Webbyu Complete');
  });

  it('prices Business as the base plus the standard photos, once', () => {
    const state = brief({ ...settled, selectedPackage: 'business', zone: 'region' });
    expect(ids(state).filter(id => id.startsWith('photo'))).toEqual(['photo_standard_site']);
    expect(sum(state)).toBe('1.510 €');
    expect(orientation(state).label).toBe('Webbyu Business');
    // Without an answer about the place, the trip stays open instead of being free.
    expect(line({ ...state, zone: 'unknown' }, 'travel_open')).toMatchObject({ status: 'open' });
    expect(sum({ ...state, zone: 'unknown' })).toBe('1.510 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    // The same photos from the answers are not added a second time.
    const both = brief({ ...settled, images: 'missing', imageSource: 'photo_standard', selectedPackage: 'business', zone: 'region' });
    expect(ids(both).filter(id => id.startsWith('photo'))).toEqual(['photo_standard_site']);
    expect(sum(both)).toBe('1.510 €');
  });

  it('replaces differing answers instead of adding the package on top', () => {
    const state = brief({ ...settled, texts: 'notes', images: 'partly', imageSource: 'licensed', video: 'unknown', selectedPackage: 'complete', zone: 'region' });
    const o = orientation(state);
    expect(o.lines.map(item => item.id)).toEqual(expect.arrayContaining(['text_interview', 'photo_standard_site', 'clip_addon']));
    for (const gone of ['text_notes', 'image_licensed', 'license_cost', 'clip_unknown']) expect(ids(state)).not.toContain(gone);
    expect(o.lines.filter(item => item.group).map(item => item.group).sort()).toEqual(['base', 'clip', 'photo', 'text']);
    expect(sumText(o.sum)).toBe('1.900 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(o.notes).toEqual([]);
  });

  it('says what a smaller package leaves out instead of dropping it silently', () => {
    const state = { ...answers, texts: 'missing' as const, selectedPackage: 'start' as const };
    const o = orientation(state);
    expect(ids(state)).toEqual(['base_start', 'concept', 'correction', 'golive', 'handover', 'hosting', 'legal']);
    expect(o.label).toBe('Webbyu Start');
    expect(o.notes.join(' ')).toContain('Im gewählten Paket nicht enthalten und im Gespräch zu klären: Texte aus einem Interview, Fotos Standard im Websiteprojekt, Kurzclip beim Fototermin.');
    expect(sumText(o.sum)).toBe('990 €');
    expect(o.needsZone).toBe(false);
  });

  it('turns Complete into an individual composition when a module is deselected', () => {
    const state = brief({ ...settled, selectedPackage: 'complete', removedLines: ['text_interview'], zone: 'region' });
    const o = orientation(state);
    expect(o.label).toBe(INDIVIDUAL_LABEL);
    expect(o.choice).toBe('complete');
    expect(o.removed.map(item => item.id)).toEqual(['text_interview']);
    expect(ids(state)).not.toContain('text_interview');
    expect(sumText(o.sum)).toBe('1.510 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(orientation({ ...state, removedLines: [] }).label).toBe('Webbyu Complete');
  });

  it('keeps the known positions visible and says so when the answers lie outside the packages', () => {
    const state = brief({ ...settled, goal: 'sales', scope: 'large', selectedPackage: 'business' });
    const o = orientation(state);
    expect(o.recommended).toBe('custom');
    expect(o.triggers).toEqual(['großer Umfang', 'Shop']);
    expect(o.notes.join(' ')).toContain('Außerhalb der drei Pakete liegt: großer Umfang, Shop.');
    expect(o.open.map(item => item.id)).toEqual(expect.arrayContaining(['scope_large', 'shop']));
    const automatic = orientation({ ...state, selectedPackage: null });
    expect(automatic.choice).toBe('custom');
    expect(automatic.label).toBe('Individuell klären');
    expect(automatic.lines.map(item => item.id)).toContain('base_start');
    expect(orientation({ ...state, selectedPackage: 'custom' }).label).toBe('Individuell klären');
  });
});

describe('deselecting positions', () => {
  it('removes the position from the sum and shows its consequence', () => {
    const state = brief({ ...settled, texts: 'notes', projectType: 'existing', removedLines: ['text_notes'] });
    const o = orientation(state);
    expect(ids(state)).not.toContain('text_notes');
    expect(o.removed.map(item => item.id)).toEqual(['text_notes']);
    expect(sumText(o.sum)).toBe('1.180 €');
    expect(orientation({ ...state, removedLines: ['text_notes', 'migration'] }).sum).toMatchObject({ min: 990, max: 990 });
  });

  it('ignores a removal for a position that is not part of the result or may not be removed', () => {
    const state = brief({ ...settled, removedLines: ['text_notes', 'base_start', 'unbekannt'] });
    expect(orientation(state).removed).toEqual([]);
    expect(ids(state)).toContain('base_start');
    expect(requestBrief(state).removedLines).toEqual([]);
  });

  it('sends only effective removals and the positions actually shown', () => {
    const state = brief({ ...settled, texts: 'notes', projectType: 'existing', removedLines: ['text_notes', 'migration', 'text_interview'] });
    const request = requestBrief(state);
    expect(request.removedLines).toEqual(['migration', 'text_notes']);
    expect(request.shownLines.map(item => item.id)).not.toContain('text_notes');
    expect(request.catalogVersion).toBe(CATALOG_VERSION);
  });
});

describe('media route', () => {
  const media = (patch: Partial<BriefState> = {}) => brief({ projectType: 'media', goal: 'media', mediaChoice: 'photo_compact', zone: 'region', ...patch });

  it('prices photos alone without website positions, base or hosting', () => {
    expect(ids(media())).toEqual(['photo_compact_solo', 'travel_included']);
    expect(ids(media({ mediaChoice: 'photo_standard' }))).toEqual(['photo_standard_solo', 'travel_included']);
    expect(line(media(), 'photo_compact_solo')).toMatchObject({ status: 'fixed', min: 349 });
    expect(line(media({ mediaChoice: 'photo_standard' }), 'photo_standard_solo')).toMatchObject({ status: 'fixed', min: 590 });
    expect(orientation(media()).label).toBe('Foto- und Videoprojekt');
    expect(orientation(media()).recommended).toBe('custom');
  });

  it('adds the clip as an open position and includes the trip only in the region', () => {
    expect(ids(media({ mediaChoice: 'photo_clip', zone: 'region' }))).toEqual(['photo_standard_solo', 'clip_addon', 'travel_included']);
    expect(ids(media({ mediaChoice: 'clip', zone: 'outside' }))).toEqual(['clip_solo', 'travel_open']);
    expect(sum(media({ mediaChoice: 'photo_clip', zone: 'region' }))).toBe('590 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(sum(media({ zone: 'region' }))).toBe('349 €');
  });

  it('keeps drone requests, several sites and third-party use open', () => {
    expect(ids(media({ drone: true }))).toEqual(['photo_compact_solo', 'travel_included', 'drone']);
    expect(ids(media({ drone: true, zone: 'unknown' }))).toEqual(['photo_compact_solo', 'travel_open', 'drone']);
    expect(ids(media({ sites: 'multipleSites' }))).toContain('media_custom');
    expect(ids(media({ mediaUse: ['website', 'third_party'] }))).toContain('media_custom');
    expect(ids(media({ mediaUse: ['website', 'social', 'ads'] }))).not.toContain('media_custom');
    expect(ids(media({ drone: true, sites: 'multipleSites', mediaUse: ['third_party'] })).filter(id => id === 'media_custom')).toHaveLength(1);
    expect(sum(media({ drone: true, zone: 'region' }))).toBe('349 € + 1 offene Position. Kein vollständiger Gesamtpreis.');
  });

  it('gives an open medium and no lone sum when the visitor does not know yet', () => {
    expect(ids(media({ mediaChoice: 'unknown' }))).toEqual(['media_open']);
    expect(sum(media({ mediaChoice: 'unknown' }))).toBe('Noch keine Summe möglich: 1 offene Position. Kein vollständiger Gesamtpreis.');
    expect(ids(media({ mediaChoice: null }))).toEqual(['media_open']);
  });
});

describe('what belongs to the request', () => {
  it('drops website answers on the media route and media answers on the website route', () => {
    const media = requestBrief(brief({ projectType: 'media', goal: 'media', mediaChoice: 'clip', mediaUse: ['social', 'ads'], drone: true, sites: 'multipleSites', zone: 'outside', extensions: ['cms'], scope: 'large', texts: 'missing', images: 'missing', imageSource: 'photo_standard', video: 'clip', selectedPackage: 'complete', removedLines: ['migration'] }));
    expect(media).toMatchObject({ goal: 'media', extensions: [], scope: 'unknown', texts: 'unknown', images: 'unknown', imageSource: null, video: 'unknown', selectedPackage: null, removedLines: [], mediaChoice: 'clip', mediaUse: ['ads', 'social'], drone: true, sites: 'multipleSites', zone: 'outside' });
    const website = requestBrief(brief({ ...settled, mediaChoice: 'clip', mediaUse: ['social'], drone: true, sites: 'multipleSites', zone: 'outside', extensions: ['wizard', 'cms'] }));
    expect(website).toMatchObject({ mediaChoice: null, mediaUse: [], drone: false, sites: 'oneSite', zone: 'unknown', extensions: ['cms', 'wizard'] });
    expect(requestBrief(brief({ ...settled, video: 'clip', zone: 'outside' })).zone).toBe('outside');
  });

  it('sends nothing priced when the visitor only wants to talk first', () => {
    const advice = requestBrief(brief({ projectType: 'advice', extensions: ['cms'], scope: 'large', selectedPackage: 'business', removedLines: ['migration'] }));
    expect(advice).toMatchObject({ projectType: 'advice', extensions: [], scope: 'unknown', selectedPackage: null, shownLines: [], removedLines: [], mediaChoice: null });
    expect(orientation(brief({ projectType: 'advice' })).lines).toEqual([]);
  });

  it('always produces a valid request body for every route', () => {
    for (const patch of [{}, { projectType: 'existing' as const }, { projectType: 'media' as const, goal: 'media' as const }, { projectType: 'advice' as const }]) {
      expect(invalidInquiryFields(requestBrief(brief(patch))), JSON.stringify(patch)).toEqual([]);
    }
  });
});

describe('formatting', () => {
  it('writes German amounts and spans', () => {
    expect(euro(990)).toBe('990 €');
    expect(euro(1180)).toBe('1.180 €');
    expect(euro(12_345)).toBe('12.345 €');
    expect(lineAmount(line(brief(), 'scope_extended')!)).toBe('0–750 €');
    expect(lineAmount(line(brief(), 'text_unknown')!)).toBe('190–390 €');
    expect(lineAmount(line(brief(settled), 'concept')!)).toBe('enthalten');
    expect(lineAmount(line(brief({ ...settled, extensions: ['cms'] }), 'cms')!)).toBe('offen');
  });
});

describe('over every combination of answers', () => {
  const packages = [null, 'start', 'business', 'complete', 'custom'] as const;
  const variants: Partial<BriefState>[] = [
    { goal: 'inquiries', extensions: [], projectType: 'new', removedLines: [] },
    { goal: 'sales', extensions: ['wizard', 'booking_embed', 'language', 'cms', 'booking_custom', 'integration', '3d'], projectType: 'existing', removedLines: ['text_notes', 'text_interview', 'migration'] },
  ];

  it('never doubles a group, a position or a trip, and sums only fixed and range positions', () => {
    const failures: string[] = [];
    let checked = 0;
    for (const scope of SCOPES) for (const texts of TEXT_STATES) for (const images of IMAGE_STATES) for (const imageSource of [null, ...IMAGE_SOURCES])
      for (const video of VIDEO_STATES) for (const zone of ZONES) for (const selectedPackage of packages) for (const variant of variants) {
        const state = brief({ scope, texts, images, imageSource, video, zone, selectedPackage, ...variant });
        const o = orientation(state);
        const where = `${scope}/${texts}/${images}/${imageSource}/${video}/${zone}/${selectedPackage}/${variant.goal}`;
        const ensure = (ok: boolean, what: string) => { if (!ok && failures.length < 20) failures.push(`${where}: ${what}`); };
        const groups = o.lines.map(item => item.group).filter(Boolean);
        ensure(new Set(groups).size === groups.length, 'group twice');
        ensure(new Set(o.lines.map(item => item.id)).size === o.lines.length, 'position twice');
        ensure(o.lines.filter(item => item.id.startsWith('travel')).length <= 1, 'trip twice');
        ensure(o.lines.some(item => item.id === 'license_cost') === o.lines.some(item => item.id === 'image_licensed'), 'license costs without licensed images');
        const counted = o.lines.filter(item => item.status === 'fixed' || item.status === 'range');
        ensure(o.sum.min === counted.reduce((total, item) => total + item.min, 0) && o.sum.max === counted.reduce((total, item) => total + item.max, 0)
          && o.sum.amounts === counted.length && o.sum.open === o.lines.filter(item => item.status === 'open').length, 'sum rule');
        for (const item of o.lines) {
          if (item.status === 'fixed') ensure(item.min === item.max, `${item.id} fixed range`);
          if (item.status === 'fixed' || item.status === 'range') ensure(item.max > 0, `${item.id} priced at 0`);
          if (item.status === 'included' || item.status === 'open') ensure(item.min === 0 && item.max === 0, `${item.id} carries an amount`);
          if (item.status === 'range' && item.min === 0) ensure(item.id === 'scope_extended', `${item.id} starts at 0`);
        }
        ensure(o.removed.every(item => item.removable), 'removed a fixed position');
        const text = sumText(o.sum);
        ensure(o.sum.open > 0 ? /offene Position(?:en)?\. Kein vollständiger Gesamtpreis\.$/.test(text) : !text.includes('Gesamtpreis'), 'sum wording');
        ensure(invalidInquiryFields(requestBrief(state)).length === 0, 'invalid request');
        ensure(o.lines.length <= 30, 'more than 30 positions');
        checked += 1;
      }
    expect(failures).toEqual([]);
    expect(checked).toBe(4 * 4 * 4 * 7 * 3 * 3 * 5 * 2);
    expect(EXTENSION_IDS).toHaveLength(8);
  }, 60_000);
});
