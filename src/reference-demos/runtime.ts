import type { DemoId } from '../data';
import handwerkBody from './handwerk/body.html?raw';
import handwerkStyle from './handwerk/style.css?raw';
import nordlichtBody from './gebaeudetechnik/body.html?raw';
import nordlichtStyle from './gebaeudetechnik/style.css?raw';
import raumgutBody from './raumgut/body.html?raw';
import raumgutStyle from './raumgut/style.css?raw';
import { mount as mountHandwerk } from './handwerk/app.js';
import { mount as mountNordlicht } from './gebaeudetechnik/app.js';
import { mount as mountRaumgut } from './raumgut/app';
import './runtime.css';

export interface ReferenceScope {
  host: HTMLElement;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
  addEventListener(type: string, listener: EventListener): void;
}
export interface ReferenceHelpers {
  escape(value: unknown): string;
  download(name: string, text: string): void;
  open(dialog: HTMLDialogElement): void;
  asset(name: string): string;
}

const references = {
  meisterwerk: { body: handwerkBody, css: handwerkStyle, mount: mountHandwerk },
  nordlicht: { body: nordlichtBody, css: nordlichtStyle, mount: mountNordlicht },
  raumgut: { body: raumgutBody, css: raumgutStyle, mount: mountRaumgut },
};

/** Shadow DOM preserves the original designs and live state while the gallery reparents them. */
export function mountReferenceDemo(host: HTMLElement, id: Exclude<DemoId, 'sales'>, signal: AbortSignal): void {
  const source = references[id];
  const shadow = host.attachShadow({ mode: 'open' });
  const assets = `${import.meta.env.BASE_URL}reference-assets`;
  const resolveAssets = (text: string) => text.replaceAll('__REFERENCE_ASSETS__', assets);
  host.classList.add('reference-demo');
  shadow.innerHTML = `<style>${resolveAssets(source.css)}
    :host { container: reference / inline-size; }
    .reference-page { min-height: 100%; overflow: clip; }
    .reference-page :is(input, select, textarea) { font-size: 16px; }
    .reference-page :is([id], h1, h2, h3, h4, legend) { scroll-margin-block-start: 100px; }
    .reference-page button, .reference-page a { min-height: 44px; }
    .reference-page .dialog-open { overflow: hidden; }
    .reference-page :is(.compare-dock, .toast) { position: sticky; margin: 12px auto; left: auto; transform: none; }
    .reference-page .compare-dock { bottom: 12px; }
    .reference-page .toast { bottom: 80px; }
    .reference-page dialog { max-width: calc(100vw - 32px); max-height: 85dvh; }
    @container reference (max-width: 480px) {
      .reference-page .compare-dock { flex-wrap: wrap; gap: 8px; justify-content: center; }
    }
  </style><div class="reference-page">${resolveAssets(source.body)}</div>`;
  const page = shadow.querySelector<HTMLElement>('.reference-page')!;
  const scope: ReferenceScope = {
    host,
    querySelector: selector => shadow.querySelector(selector),
    querySelectorAll: selector => shadow.querySelectorAll(selector),
    addEventListener: (type, listener) => shadow.addEventListener(type, listener, { signal }),
  };
  const returns = new WeakMap<HTMLDialogElement, HTMLElement>();
  const helpers: ReferenceHelpers = {
    escape: value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!),
    asset: name => `${assets}/${name}`,
    download(name, text) {
      const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      page.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    open(dialog) {
      if (shadow.activeElement instanceof HTMLElement) returns.set(dialog, shadow.activeElement);
      dialog.showModal();
    },
  };
  // Local fragment links must scroll this concept, not navigate the containing page.
  shadow.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!target) return;
    event.preventDefault();
    if (target.hash === '#webbyu') {
      document.querySelector<HTMLDialogElement>('.concept-dialog[open]')?.close();
      document.getElementById('arbeiten')?.scrollIntoView({ block: 'start' });
      document.querySelector<HTMLElement>('[data-catalogue-goal][aria-pressed="true"]')?.focus({ preventScroll: true });
      return;
    }
    const section = target.hash ? shadow.querySelector<HTMLElement>(target.hash) : page;
    if (section) {
      section.scrollIntoView({ block: 'start', behavior: 'instant' });
      const focus = section.querySelector<HTMLElement>('h1, h2, h3, input, button') ?? section;
      if (!focus.hasAttribute('tabindex')) focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
    }
  }, { signal });
  shadow.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      const explicitReturn = (dialog as HTMLDialogElement & { returnTarget?: HTMLElement }).returnTarget;
      const target = explicitReturn ?? returns.get(dialog);
      const parentDialog = target?.closest<HTMLDialogElement>('dialog');
      if (target?.isConnected && (!shadow.querySelector('dialog[open]') || parentDialog?.open)) target.focus({ preventScroll: true });
    }, { signal });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      dialog.close();
    }, { signal });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }, { signal });
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close(), { signal }));
  });
  // Native validity must apply even to programmatic submit events. All results stay local.
  shadow.addEventListener('submit', event => {
    const form = event.target;
    if (form instanceof HTMLFormElement && !form.reportValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, { signal, capture: true });
  source.mount(scope, helpers, signal);
  signal.addEventListener('abort', () => {
    shadow.querySelectorAll('dialog[open]').forEach(dialog => (dialog as HTMLDialogElement).close());
    shadow.querySelectorAll<HTMLElement>('*').forEach(element => {
      element.onclick = element.oninput = element.onchange = element.onsubmit = null;
      if (element instanceof HTMLButtonElement) element.disabled = true;
    });
    shadow.replaceChildren();
  }, { once: true });
}
