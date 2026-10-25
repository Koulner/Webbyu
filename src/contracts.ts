import type { DemoId, Goal } from './data';

/** Stable DOM surfaces shared by the shell and independently owned features. */
export interface PageMounts {
  story: HTMLElement;
  journeyPreview: HTMLElement;
  finder: HTMLElement;
}

export type SceneMode = 'presentation' | 'layers' | 'interactive';

export interface CatalogueState {
  goal: DemoId;
  mode: SceneMode;
}

export interface SceneOptions {
  container: HTMLElement;
  demoElement: HTMLElement;
}

export interface SceneController {
  setGoal(goal: DemoId): void;
  setMode(mode: SceneMode): void;
  dispose(): void;
}

export interface CatalogueOptions {
  container: HTMLElement;
  demoSlot: HTMLElement;
  onStateChange(state: CatalogueState): void;
  onProjectRequest(goal: Goal): void;
}

export interface CatalogueController {
  getState(): CatalogueState;
  selectGoal(goal: DemoId): void;
  open(goal?: DemoId): void;
  dispose(): void;
}
