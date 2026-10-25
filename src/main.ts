import './fonts.css';
import './tokens.css';
import './styles.css';
import './content.css';
import { extensions, packages, type DemoId, type PackageId } from './data';
import { briefStore, type BriefStore } from './state';
import { createDemo, disposeDemo, mountDemoDialog } from './demos';
import { mountJourneyPreview } from './journey-preview';
import { mountFinder } from './finder';
import { renderPage } from './shell';
import { mountPrivacy } from './privacy';

const arrow = '<span aria-hidden="true">↗</span>';
interface AppOptions {
  store?: BriefStore;
}

/** Main owns cross-feature wiring; feature modules only consume their contracts. */
export function mountApp(root: HTMLElement, options: AppOptions = {}) {
  const store = options.store ?? briefStore;
  const mounts = renderPage(root);
  const privacy = mountPrivacy();
  const events = new AbortController();
  const listenerOptions = { signal: events.signal };
  const finder = mountFinder(mounts.finder, store);
  let disposed = false;
  let toastTimer = 0;

  function goToFinder(restart = true) {
    if (location.hash !== '#projektfinder') history.pushState(null, '', '#projektfinder');
    if (restart) finder.openAtStart();
    else finder.focus();
    mounts.finder.closest('section')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  const journeyPreview = mountJourneyPreview(mounts.journeyPreview);
  const demoSessions = new Map<DemoId, HTMLElement>();
  const demoParking = document.createElement('div');
  demoParking.hidden = true;
  root.append(demoParking);
  const demoDialog = mountDemoDialog();
  root.querySelectorAll<HTMLButtonElement>('button[data-demo]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.demo as DemoId;
      let demo = demoSessions.get(id);
      if (!demo) {
        demo = createDemo(id);
        demoParking.append(demo);
        demoSessions.set(id, demo);
      }
      demoDialog.open(id, demo);
    }, listenerOptions);
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

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      events.abort();
      privacy.dispose();
      journeyPreview.dispose();
      demoDialog.dispose();
      demoSessions.forEach(disposeDemo);
      demoSessions.clear();
      demoParking.remove();
      finder.dispose();
      unsubscribeExtensions();
      clearTimeout(toastTimer);
    },
  };
}

const root = document.querySelector<HTMLElement>('#app');
export const application = root ? mountApp(root) : undefined;
if (import.meta.hot) import.meta.hot.dispose(() => application?.dispose());
