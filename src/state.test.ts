import { describe, expect, it } from 'vitest';
import { createBriefStore, recommendPackage } from './state';

describe('project brief state', () => {
  it.each([
    ['presence', 'presence'],
    ['inquiries', 'business'],
    ['bookings', 'business'],
    ['sales', 'shop'],
  ] as const)('recommends %s → %s', (goal, expected) => {
    expect(recommendPackage(goal)).toBe(expected);
  });

  it('preserves project and contact inputs when the hero changes its goal', () => {
    const store = createBriefStore();
    store.update({ extensions: ['cms', '3d'], projectType: 'existing', timing: 'later', description: 'Ein eigener Shop', name: 'Ada', email: 'ada@example.com', selectedPackage: 'business' });
    store.update({ goal: 'sales', selectedPackage: null });
    expect(store.get()).toEqual({ goal: 'sales', extensions: ['cms', '3d'], projectType: 'existing', timing: 'later', description: 'Ein eigener Shop', name: 'Ada', email: 'ada@example.com', selectedPackage: null });
  });

  it('isolates input arrays and each subscriber snapshot from the stored brief', () => {
    const store = createBriefStore();
    const extensions = ['cms'];
    let received: string[] = [];
    store.subscribe(snapshot => { snapshot.extensions.push('unexpected'); snapshot.name = 'changed'; });
    const unsubscribe = store.subscribe(snapshot => { received = snapshot.extensions; });
    store.update({ extensions, name: 'Ada' });
    extensions.push('external');
    const snapshot = store.get();
    snapshot.extensions.push('also external');
    expect(received).toEqual(['cms']);
    expect(store.get().extensions).toEqual(['cms']);
    expect(store.get().name).toBe('Ada');
    unsubscribe();
    store.update({ extensions: ['maps'] });
    expect(received).toEqual(['cms']);
  });
});
