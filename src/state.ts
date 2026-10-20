import type { Goal, PackageId } from './data';

export interface BriefState {
  goal: Goal;
  extensions: string[];
  projectType: string;
  timing: string;
  description: string;
  name: string;
  email: string;
  selectedPackage: PackageId | null;
}

export function recommendPackage(goal: Goal): PackageId {
  return goal === 'sales' ? 'shop' : goal === 'presence' ? 'presence' : 'business';
}

export function createBriefStore() {
  let state: BriefState = { goal: 'inquiries', extensions: [], projectType: 'new', timing: 'flexible', description: '', name: '', email: '', selectedPackage: null };
  const listeners = new Set<(state: BriefState) => void>();
  return {
    get: () => ({ ...state, extensions: [...state.extensions] }),
    update: (patch: Partial<BriefState>) => {
      state = { ...state, ...patch, extensions: patch.extensions ? [...patch.extensions] : state.extensions };
      listeners.forEach(listener => listener({ ...state, extensions: [...state.extensions] }));
    },
    subscribe: (listener: (state: BriefState) => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export type BriefStore = ReturnType<typeof createBriefStore>;
export const briefStore = createBriefStore();
