import type { DemoGoal } from './data';

/** Stable DOM surfaces shared by the shell and independently owned features. */
export interface PageMounts {
  story: HTMLElement;
  scene: HTMLElement;
  demoSlot: HTMLElement;
  catalogue: HTMLElement;
  finder: HTMLElement;
}

export type SceneMode = 'presentation' | 'layers' | 'interactive';

export interface CatalogueState {
  goal: DemoGoal;
  mode: SceneMode;
}

export interface SceneOptions {
  container: HTMLElement;
  demoElement: HTMLElement;
}

export interface SceneController {
  setGoal(goal: DemoGoal): void;
  setMode(mode: SceneMode): void;
  dispose(): void;
}

export interface CatalogueOptions {
  container: HTMLElement;
  demoSlot: HTMLElement;
  onStateChange(state: CatalogueState): void;
  onProjectRequest(goal: DemoGoal): void;
}

export interface CatalogueController {
  getState(): CatalogueState;
  selectGoal(goal: DemoGoal): void;
  open(goal?: DemoGoal): void;
  dispose(): void;
}
