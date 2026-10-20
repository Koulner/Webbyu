import '@fontsource-variable/manrope';
import './styles.css';
import './scene.css';
import { concepts, extensions, packages, type DemoGoal, type PackageId } from './data';
import { briefStore } from './state';
import { createDemo, mountDemoDialog } from './demos';
import { mountFinder } from './finder';

const arrow = '<span aria-hidden="true">↗</span>';
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <a class="skip-link" href="#main">Zum Inhalt springen</a>
  <header class="site-header">
    <a class="wordmark" href="#" aria-label="Webbyu – Startseite">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a>
    <nav aria-label="Hauptnavigation">
      <a href="#arbeiten">Arbeiten<span>03</span></a>
      <a href="#pakete">Leistungen</a>
      <a href="#zusammenarbeit">Über Webbyu</a>
    </nav>
    <a class="header-cta" href="#projektfinder">Lassen Sie uns sprechen ${arrow}</a>
    <button class="mobile-menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menü öffnen"><span></span><span></span></button>
  </header>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile Navigation" hidden>
    <a href="#arbeiten">Arbeiten <span>01</span></a><a href="#pakete">Leistungen <span>02</span></a><a href="#zusammenarbeit">Über Webbyu <span>03</span></a><a href="#projektfinder">Projekt anfragen ${arrow}</a>
  </nav>
  <main id="main">
    <section id="hero-story" class="hero-story" aria-labelledby="hero-title">
      <div class="hero-sticky">
        <div class="hero-layout">
          <div class="hero-copy">
            <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Unabhängiges Webdesign · Für Ihr Business</p>
            <h1 id="hero-title">Ihr Business<br>verdient einen<br><span>eigenen Auftritt.</span></h1>
            <p class="hero-description">Individuelle Websites, die Ihren Charakter zeigen – und Anfragen, Buchungen oder Verkäufe möglich machen.</p>
            <div class="hero-actions"><a class="button button--blue" href="#projektfinder">Projekt anfragen ${arrow}</a><a class="text-link" href="#arbeiten">Möglichkeiten entdecken <span aria-hidden="true">↓</span></a></div>
            <div class="hero-footnote"><span class="mini-frame" aria-hidden="true"></span><span>Persönlich gestaltet.<br>Präzise entwickelt.</span></div>
          </div>
          <div class="hero-visual">
            <div class="object-topline"><span>WEBBYU — DIGITAL ATELIER</span><span>OBJEKT № 001</span></div>
            <div class="object-control">
              <span class="control-label">Was ist Ihr Ziel?</span>
              <div class="goal-switch" role="group" aria-label="Geschäftsziel auswählen">
                <button data-hero-goal="inquiries" aria-pressed="true">Anfragen</button>
                <button data-hero-goal="bookings" aria-pressed="false">Buchungen</button>
                <button data-hero-goal="sales" aria-pressed="false">Verkaufen</button>
              </div>
              <button class="demo-open" data-open-current aria-label="Aktuelle Konzeptdemo groß öffnen">${arrow}</button>
            </div>
            <div id="scene" class="scene-host" aria-label="Interaktiver Gestaltungsrahmen mit Website-Beispiel"><div id="hero-demo-slot"></div></div>
            <p class="object-caption">Ein Rahmen. Ihre Möglichkeiten. <span>Konzeptdemo</span></p>
          </div>
        </div>
        <div class="hero-bottom">
          <a href="#arbeiten" class="scroll-hint"><span class="scroll-icon" aria-hidden="true">↓</span> Scrollen. Und Möglichkeiten entdecken.</a>
          <div class="story-status" aria-hidden="true"><span id="story-number">01</span><span class="story-line"><i></i></span><span id="story-label">Ihr Ziel.</span><span class="story-total">03</span></div>
        </div>
      </div>
    </section>

    <section id="arbeiten" class="work-section section-shell" aria-labelledby="work-title">
      <div class="section-kicker"><span>01 / MÖGLICHKEITEN</span><span>Ideen werden erlebbar.</span></div>
      <div class="section-heading"><h2 id="work-title">So unterschiedlich<br>wie Ihr Business.</h2><p>Keine zwei Unternehmen sind gleich.<br> Hier sind drei Ideen, wie ein eigener<br> digitaler Auftritt aussehen kann.</p></div>
      <div class="concept-grid">${concepts.map(c => `
        <article class="concept-card concept-card--${c.goal}">
          <div class="concept-preview" data-preview="${c.goal}"><div class="preview-canvas" inert aria-hidden="true"></div><span class="concept-badge">KONZEPT ${c.number}</span><button class="preview-open" data-demo="${c.goal}" aria-label="${c.name}: Konzeptdemo öffnen">Konzept entdecken ${arrow}</button></div>
          <div class="concept-info"><div class="concept-titleline"><h3>${c.name}</h3><span>${c.type}</span></div><h4>${c.title}</h4><p>${c.description}</p><div class="tags">${c.tags.map(t=>`<span>${t}</span>`).join('')}</div></div>
        </article>`).join('')}
      </div>
      <p class="concept-disclaimer"><span aria-hidden="true">↳</span> Eigenständige Designstudien für fiktive Marken. Zum Entdecken und Ausprobieren.</p>
    </section>

    <section id="pakete" class="packages-section section-shell" aria-labelledby="packages-title">
      <div class="section-kicker"><span>02 / LEISTUNGEN</span><span>Ein klarer Anfang. Viel Raum für Sie.</span></div>
      <div class="section-heading"><h2 id="packages-title">Der richtige Rahmen.<br>Für Ihr Vorhaben.</h2><p>Ihr Ziel gibt die Richtung vor.<br> Ich stimme Gestaltung, Inhalte und<br> Funktionen auf Ihr Business ab.</p></div>
      <div class="package-list">${packages.map(p=>`
        <article class="package-row"><span class="package-number">${p.number}</span><div class="package-intro"><h3>${p.name}</h3><p>${p.description}</p></div><ul>${p.features.map(f=>`<li><span aria-hidden="true">↗</span>${f}</li>`).join('')}</ul><div class="package-action"><span>Preis nach Briefing</span><button data-package="${p.id}" class="round-arrow" aria-label="Paket ${p.name} anfragen">${arrow}</button></div></article>`).join('')}</div>
      <div class="package-included"><span>IMMER MIT DABEI</span><p>Individuelle Gestaltung <i>·</i> Responsive Umsetzung <i>·</i> Technische SEO-Grundlagen</p></div>
      <div class="extensions-heading"><h3>Und alles, was Sie weiterbringt.</h3><p>Passende Erweiterungen für Ihren Auftritt.</p></div>
      <div class="extensions-grid">${extensions.map((e,i)=>`<details class="extension"><summary><span class="extension-index">0${i+1}</span><span>${e.short}</span><span class="extension-toggle" aria-hidden="true">+</span></summary><div><h4>${e.name}</h4><p>${e.description}</p><button class="extension-add" data-extension="${e.id}">Für mein Projekt vormerken ${arrow}</button></div></details>`).join('')}</div>
    </section>

    <section id="zusammenarbeit" class="about-section section-shell" aria-labelledby="about-title">
      <div class="section-kicker"><span>03 / ZUSAMMENARBEIT</span><span>Direkt. Persönlich. Durchdacht.</span></div>
      <div class="about-layout"><div class="about-copy"><h2 id="about-title">Gute Websites<br>beginnen mit einem<br><span>guten Gespräch.</span></h2><p>Hinter Webbyu stehe ich als Ihr direkter Ansprechpartner. Ich höre zu, denke mit und übersetze das, was Ihr Business ausmacht, in einen eigenständigen digitalen Auftritt.</p><p>Von der ersten Idee bis zur Übergabe bleiben Gestaltung und Entwicklung in einer Hand.</p><div class="atelier-signature"><span class="mini-frame" aria-hidden="true"></span><span>Ihr Business. Mein Handwerk.<small>WEBBYU — DIGITAL ATELIER</small></span></div></div>
        <ol class="process-list"><li><span>01</span><div><h3>Verstehen.</h3><p>Wir sprechen über Ihr Unternehmen, Ihre Kunden und darüber, was Ihre Website erreichen soll.</p></div></li><li><span>02</span><div><h3>Gestalten.</h3><p>Aus Ihrer Richtung entsteht ein eigenständiger Entwurf. Gemeinsam schärfen wir die Details.</p></div></li><li><span>03</span><div><h3>Entwickeln.</h3><p>Design wird zur funktionierenden Website. Durchdacht auf dem großen Bildschirm und in der Hand.</p></div></li><li><span>04</span><div><h3>Übergeben.</h3><p>Wir prüfen Ihren Auftritt gemeinsam. Sie bekommen eine verständliche Einführung und einen klaren nächsten Schritt.</p></div></li></ol>
      </div>
    </section>

    <section id="projektfinder" class="finder-section" aria-labelledby="finder-title"><div class="section-shell"><div class="section-kicker"><span>04 / IHR PROJEKT</span><span>Der erste Schritt ist eine Idee.</span></div><div class="finder-layout"><div class="finder-intro"><span class="finder-spark" aria-hidden="true">✳</span><h2 id="finder-title">Was haben<br>Sie <span>vor?</span></h2><p>Ein paar Fragen. Eine erste Richtung.<br> Gemeinsam finden wir den passenden<br> Rahmen für Ihre Website.</p><div class="finder-assurance"><span aria-hidden="true">↳</span> Unverbindlich. Individuell. Mit Ihnen.</div></div><div id="finder-mount"></div></div></div></section>
  </main>
  <footer class="site-footer section-shell"><div class="footer-top"><a class="wordmark" href="#" aria-label="Webbyu – zurück nach oben">webbyu<span class="wordmark-dot" aria-hidden="true"></span></a><p>Websites mit Charakter.<br>Für Menschen mit Ideen.</p><a class="back-to-top" href="#">Zurück nach oben <span aria-hidden="true">↑</span></a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Webbyu</span><span>Mit Haltung gestaltet. Mit Sorgfalt entwickelt.</span><span>Lokaler Designprototyp</span></div></footer>
  <div class="toast" role="status" aria-live="polite"></div>
`;

const dialog = mountDemoDialog();
const finder = mountFinder(document.querySelector<HTMLElement>('#finder-mount')!, briefStore);
let currentDemo: DemoGoal = 'inquiries';
const demoSlot = document.querySelector<HTMLElement>('#hero-demo-slot')!;
demoSlot.append(createDemo(currentDemo));

const previewObservers: ResizeObserver[] = [];
document.querySelectorAll<HTMLElement>('[data-preview]').forEach(preview => {
  const inner = preview.querySelector<HTMLElement>('.preview-canvas')!;
  inner.append(createDemo(preview.dataset.preview as DemoGoal, { interactive: false }));
  const observer = new ResizeObserver(() => { inner.style.transform = `scale(${preview.clientWidth / 720})`; });
  observer.observe(preview);
  previewObservers.push(observer);
});

let scene: Awaited<ReturnType<typeof import('./scene')['initScene']>> | undefined;
function updateSceneGoal(goal: DemoGoal) {
  if (goal !== currentDemo) {
    currentDemo = goal;
    const nextDemo = createDemo(goal);
    nextDemo.classList.toggle('demo--responsive', demoSlot.classList.contains('demo--responsive'));
    demoSlot.replaceChildren(nextDemo);
  }
  scene?.setGoal(goal);
  document.querySelectorAll<HTMLButtonElement>('[data-hero-goal]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.heroGoal === goal)));
}
const unsubscribeSceneGoal = briefStore.subscribe(state => updateSceneGoal(state.goal === 'presence' ? 'inquiries' : state.goal));

document.querySelectorAll<HTMLButtonElement>('[data-hero-goal]').forEach(button=>button.addEventListener('click',()=> {
  briefStore.update({ goal: button.dataset.heroGoal as DemoGoal, selectedPackage: null });
}));
document.querySelector<HTMLButtonElement>('[data-open-current]')!.addEventListener('click',()=>dialog.open(currentDemo));
document.querySelectorAll<HTMLButtonElement>('button[data-demo]').forEach(button=>button.addEventListener('click',()=>dialog.open(button.dataset.demo as DemoGoal)));

function goToFinder() {
  finder.openAtStart();
  document.querySelector('#projektfinder')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
document.querySelectorAll<HTMLAnchorElement>('a[href="#projektfinder"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  goToFinder();
}));
document.querySelectorAll<HTMLButtonElement>('[data-package]').forEach(button=>button.addEventListener('click',()=> {
  const pkg = packages.find(p=>p.id === button.dataset.package)!;
  briefStore.update({ goal: pkg.goal, selectedPackage: pkg.id as PackageId });
  goToFinder();
}));
let toastTimer = 0;
const extensionButtons = document.querySelectorAll<HTMLButtonElement>('[data-extension]');
function syncExtensionButtons(selectedExtensions: string[]) {
  extensionButtons.forEach(button => {
    const selected = selectedExtensions.includes(button.dataset.extension!);
    button.innerHTML = selected ? 'Für Ihr Projekt vorgemerkt ✓' : `Für mein Projekt vormerken ${arrow}`;
    button.setAttribute('aria-pressed', String(selected));
  });
}
const unsubscribeExtensions = briefStore.subscribe(state => syncExtensionButtons(state.extensions));
syncExtensionButtons(briefStore.get().extensions);
extensionButtons.forEach(button=>button.addEventListener('click',()=> {
  const id = button.dataset.extension!;
  const state = briefStore.get();
  const selected = state.extensions.includes(id);
  briefStore.update({ extensions: selected ? state.extensions.filter(e=>e!==id) : [...state.extensions.filter(e=>e!=='unsure'), id] });
  const toast = document.querySelector<HTMLElement>('.toast')!;
  toast.textContent = selected ? 'Erweiterung entfernt.' : `${extensions.find(e=>e.id===id)!.short} ist für Ihren Projektfinder vorgemerkt.`;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer); toastTimer = window.setTimeout(()=>toast.classList.remove('is-visible'), 3200);
}));

const menuButton = document.querySelector<HTMLButtonElement>('.mobile-menu-button')!;
const mobileNav = document.querySelector<HTMLElement>('.mobile-nav')!;
function closeMenu() { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Menü öffnen'); mobileNav.hidden=true; }
menuButton.addEventListener('click',()=> { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open ? 'Menü schließen' : 'Menü öffnen'); mobileNav.hidden=!open; });
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=> {if(e.key==='Escape' && !mobileNav.hidden) {closeMenu(); menuButton.focus();}});
window.addEventListener('scroll',()=>document.querySelector('.site-header')!.classList.toggle('has-scrolled',window.scrollY>30),{passive:true});

const story = document.querySelector<HTMLElement>('#hero-story')!;
const storyNumber = document.querySelector<HTMLElement>('#story-number')!;
const storyLabel = document.querySelector<HTMLElement>('#story-label')!;
const phaseTitles = ['Ihr Ziel.', 'Alles greift ineinander.', 'Ihr Auftritt wird lebendig.'];

import('./scene').then(async module => {
  scene = await module.initScene({ container: document.querySelector<HTMLElement>('#scene')!, story, demoElement: demoSlot, onProgress: progress => {
    const phase = progress < .30 ? 0 : progress < .77 ? 1 : 2;
    story.dataset.phase = String(phase);
    storyNumber.textContent = `0${phase+1}`;
    storyLabel.textContent = phaseTitles[phase];
    (document.querySelector('.story-line i') as HTMLElement).style.transform = `scaleX(${Math.max(.04,progress)})`;
  }});
  scene.setGoal(currentDemo);
}).catch(error=> {
  console.warn('Die 3D-Ansicht konnte nicht geladen werden. Die HTML-Demo bleibt verfügbar.',error);
  story.classList.add('story--static');
  demoSlot.classList.add('demo--responsive');
  demoSlot.querySelector('.demo')?.classList.add('demo--responsive');
});

if (import.meta.hot) import.meta.hot.dispose(()=> { scene?.dispose(); finder.dispose(); dialog.dispose(); unsubscribeSceneGoal(); unsubscribeExtensions(); clearTimeout(toastTimer); previewObservers.forEach(observer=>observer.disconnect()); });
