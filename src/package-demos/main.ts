import './style.css';
import './identities.css';
import './eiche/eiche.css';
import './hof/hof.css';
import { mountHof } from './hof/client';
import { mountEiche } from './eiche/client';
import { mountKlarblick } from './klarblick-client';
import './klarblick.css';
import '../ai-badge.css';
export function mountPackageDemo(root: HTMLElement) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const menu = root.querySelector<HTMLButtonElement>('.pd-menu-toggle')!;
  const nav = root.querySelector<HTMLElement>('#pd-nav')!;
  const mobile = matchMedia('(max-width: 650px)');
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.toggle('pd-nav-closed', mobile.matches); };
  const resize = () => { menu.hidden = !mobile.matches; closeMenu(); };
  resize(); nav.dataset.ready = 'true'; mobile.addEventListener('change', resize, options);
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('pd-nav-closed', !open); }, options);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu, options));
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } }, options);
  const form = root.querySelector<HTMLFormElement>('[data-demo-form]');
  if (form) {
    form.querySelector('fieldset')!.disabled = false;
    const review = root.querySelector<HTMLElement>('[data-form-review]')!;
    const success = root.querySelector<HTMLElement>('[data-form-success]')!;
    form.addEventListener('submit', event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const dl = review.querySelector('dl')!; dl.replaceChildren();
      const data = new FormData(form);
      const rows: [string, string][] = [['Name', String(data.get('name') ?? '')], ['E-Mail', String(data.get('email') ?? '')]];
      // Optionale Zusatzfelder einer Demo, etwa Maße, erscheinen nur mit Inhalt.
      form.querySelectorAll<HTMLInputElement>('[data-review]').forEach(input => { if (input.value.trim()) rows.push([input.dataset.review!, `${input.value.trim()}${input.dataset.einheit ?? ' mm'}`]); });
      rows.push(['Ihr Anliegen', String(data.get('message') ?? '')]);
      for (const [title, value] of rows) {
        const dt = document.createElement('dt'); dt.textContent = title;
        const dd = document.createElement('dd'); dd.textContent = value;
        dl.append(dt, dd);
      }
      form.hidden = true; review.hidden = false; review.focus();
    }, options);
    root.querySelector('[data-edit]')!.addEventListener('click', () => { review.hidden = true; form.hidden = false; form.querySelector('input')!.focus(); }, options);
    root.querySelector('[data-confirm]')!.addEventListener('click', () => { review.hidden = true; review.querySelector('dl')!.replaceChildren(); form.reset(); success.hidden = false; success.focus(); }, options);
    root.querySelector('[data-reset]')!.addEventListener('click', () => { success.hidden = true; form.hidden = false; form.querySelector('input')!.focus(); }, options);
  }
  const dialog = root.querySelector<HTMLDialogElement>('.pd-lightbox')!;
  let source: HTMLElement | null = null;
  root.querySelectorAll<HTMLButtonElement>('[data-gallery]').forEach(button => button.addEventListener('click', () => {
    const img = button.querySelector('img')!; const large = dialog.querySelector('img')!;
    large.src = img.src; large.alt = img.alt; dialog.querySelector('p')!.textContent = img.alt; source = button; dialog.showModal();
  }, options));
  root.querySelector('[data-gallery-close]')!.addEventListener('click', () => dialog.close(), options);
  dialog.addEventListener('close', () => source?.focus(), options);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } }, options);
  const video = root.querySelector('video');
  video?.querySelector('source')?.addEventListener('error', () => { root.querySelector<HTMLElement>('[data-video-error]')!.hidden = false; }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video?.pause(); }, options);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', event => { if (reduce.matches || event.pointerType !== 'mouse') return; const r=el.getBoundingClientRect(); el.style.setProperty('--rx', `${((event.clientY-r.top)/r.height-.5)*-3}deg`); el.style.setProperty('--ry', `${((event.clientX-r.left)/r.width-.5)*3}deg`); }, options);
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }, options);
  });
  const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) { if (!reduce.matches) entry.target.classList.add('pd-reveal'); observer?.unobserve(entry.target); } }); }, {threshold:.12}) : null;
  root.querySelectorAll('.pd-card,.pd-copy,.pd-gallery figure').forEach(el => observer?.observe(el));
  const disposeEiche = root.querySelector('.pd-business') ? mountEiche(root, abort.signal) : () => {};
  if (root.querySelector('.pd-start')) mountKlarblick(root, abort.signal);
  if (root.querySelector('.pd-complete')) mountHof(root, abort.signal);
  return () => { abort.abort(); observer?.disconnect(); video?.pause(); disposeEiche(); };
}
const root = document.querySelector<HTMLElement>('#package-demo-app');
if (root) mountPackageDemo(root);

