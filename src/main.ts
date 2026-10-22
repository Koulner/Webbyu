import './fonts.css';
import './tokens.css';
import './styles.css';
import './scene.css';
import './content.css';
import { extensions, packages, type DemoGoal, type PackageId } from './data';
import type { SceneController, SceneOptions } from './contracts';
import { briefStore, type BriefStore } from './state';
import { createDemo } from './demos';
import { mountCatalogue } from './catalogue';
import { mountFinder } from './finder';
import { renderPage } from './shell';

const arrow = '<span aria-hidden="true">↗</span>';
type SceneModule = { initScene(options: SceneOptions): Promise<SceneController> };
interface AppOptions {
  store?: BriefStore;
  loadScene?: () => Promise<SceneModule>;
}

/** Main owns cross-feature wiring; feature modules only consume their contracts. */
export function mountApp(root: HTMLElement, options: AppOptions = {}) {
  const store = options.store ?? briefStore;
  const mounts = renderPage(root);
  const events = new AbortController();
  const listenerOptions = { signal: events.signal };
  const finder = mountFinder(mounts.finder, store);
  let disposed = false;
  let scene: SceneController | undefined;
  let toastTimer = 0;

  function goToFinder(restart = true) {
    if (location.hash !== '#projektfinder') history.pushState(null, '', '#projektfinder');
    if (restart) finder.openAtStart();
    else finder.focus();
    mounts.finder.closest('section')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  const catalogue = mountCatalogue({
    container: mounts.catalogue,
    demoSlot: mounts.demoSlot,
    onStateChange(state) {
      scene?.setGoal(state.goal);
      scene?.setMode(state.mode);
    },
    onProjectRequest(goal) {
      // Exploring a concept is private to the catalogue. Only this explicit
      // handoff changes the brief; every other Finder answer is retained.
      store.update({ goal, selectedPackage: null });
      goToFinder();
    },
  });

  const previewObservers: ResizeObserver[] = [];
  root.querySelectorAll<HTMLElement>('[data-preview]').forEach(preview => {
    const inner = preview.querySelector<HTMLElement>('.preview-canvas')!;
    inner.append(createDemo(preview.dataset.preview as DemoGoal, { interactive: false }));
    const observer = new ResizeObserver(() => { inner.style.transform = `scale(${preview.clientWidth / 720})`; });
    observer.observe(preview);
    previewObservers.push(observer);
  });
  root.querySelectorAll<HTMLButtonElement>('button[data-demo]').forEach(button => {
    button.addEventListener('click', () => catalogue.open(button.dataset.demo as DemoGoal), listenerOptions);
  });
  root.querySelectorAll<HTMLAnchorElement>('a[href="#projektfinder"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      goToFinder(false);
    }, listenerOptions);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-package]').forEach(button => {
    button.addEventListener('click', () => {
      const pkg = packages.find(item => item.id === button.dataset.package)!;
      // A package is a scope preference, never a replacement for the user's goal.
      store.update({ selectedPackage: pkg.id as PackageId });
      goToFinder();
    }, listenerOptions);
  });

  const extensionButtons = root.querySelectorAll<HTMLButtonElement>('[data-extension]');
  function syncExtensionButtons(selectedExtensions: string[]) {
    extensionButtons.forEach(button => {
      const selected = selectedExtensions.includes(button.dataset.extension!);
      button.innerHTML = selected ? 'Für Ihr Projekt vorgemerkt ✓' : `Für mein Projekt vormerken ${arrow}`;
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  const unsubscribeExtensions = store.subscribe(state => syncExtensionButtons(state.extensions));
  syncExtensionButtons(store.get().extensions);
  extensionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.extension!;
      const state = store.get();
      const selected = state.extensions.includes(id);
      store.update({ extensions: selected ? state.extensions.filter(item => item !== id) : [...state.extensions.filter(item => item !== 'unsure'), id] });
      const toast = root.querySelector<HTMLElement>('.toast')!;
      toast.textContent = selected ? 'Erweiterung entfernt.' : `${extensions.find(item => item.id === id)!.short} ist für Ihren Projektfinder vorgemerkt.`;
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
    }, listenerOptions);
  });

  const menuButton = root.querySelector<HTMLButtonElement>('.mobile-menu-button')!;
  const mobileNav = root.querySelector<HTMLElement>('.mobile-nav')!;
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menü öffnen');
    mobileNav.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    mobileNav.hidden = !open;
  }, listenerOptions);
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu, listenerOptions));
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
    if (link.hash === '#projektfinder') return;
    link.addEventListener('click', () => {
      const target = link.hash ? root.querySelector<HTMLElement>(link.hash) : mounts.story;
      if (!target) return;
      if (target instanceof HTMLDetailsElement) target.open = true;
      const focusTarget = target.querySelector<HTMLElement>('h1, h2, summary') ?? target;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }, listenerOptions);
  });
  const revealHashTarget = () => {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement && root.contains(target)) target.open = true;
  };
  window.addEventListener('hashchange', revealHashTarget, listenerOptions);
  revealHashTarget();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
  }, listenerOptions);
  const updateHeader = () => root.querySelector('.site-header')!.classList.toggle('has-scrolled', window.scrollY > 30);
  window.addEventListener('scroll', updateHeader, { ...listenerOptions, passive: true });
  updateHeader();

  const sceneReady = Promise.resolve().then(() => {
    if (disposed) return;
    return (options.loadScene ?? (() => import('./scene')))();
  }).then(async module => {
    if (!module || disposed) return;
    const controller = await module.initScene({ container: mounts.scene, demoElement: mounts.demoSlot });
    if (disposed) { controller.dispose(); return; }
    scene = controller;
    // Selection and mode may have changed during either import or initialization.
    const latest = catalogue.getState();
    scene.setGoal(latest.goal);
    scene.setMode(latest.mode);
  }).catch(error => {
    if (disposed) return;
    console.warn('Die 3D-Ansicht konnte nicht geladen werden. Die HTML-Demo bleibt verfügbar.', error);
    mounts.scene.classList.add('scene-host--fallback');
    mounts.demoSlot.classList.add('demo--responsive');
    mounts.demoSlot.querySelector('.demo')?.classList.add('demo--responsive');
    mounts.demoSlot.inert = false;
    mounts.demoSlot.style.pointerEvents = 'auto';
  });

  return {
    catalogue,
    sceneReady,
    dispose() {
      if (disposed) return;
      disposed = true;
      events.abort();
      scene?.dispose();
      catalogue.dispose();
      finder.dispose();
      unsubscribeExtensions();
      clearTimeout(toastTimer);
      previewObservers.forEach(observer => observer.disconnect());
    },
  };
}

const root = document.querySelector<HTMLElement>('#app');
export const application = root ? mountApp(root) : undefined;
if (import.meta.hot) import.meta.hot.dispose(() => application?.dispose());
