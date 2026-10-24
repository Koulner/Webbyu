import { stations } from './data';
import { landscapeSvg, mapProjection } from './map';

const arrow = '<span aria-hidden="true">↗</span>';
export function renderJourney(root: HTMLElement): void {
  const home = import.meta.env.BASE_URL;
  root.innerHTML = `
    <a class="journey-skip" href="#reise-kapitel">Zu den Kapiteln springen</a>
    <header class="journey-header">
      <a class="journey-wordmark" href="${home}" aria-label="Webbyu – Startseite">webbyu<span>.</span></a>
      <nav aria-label="Hauptnavigation"><a href="${home}#arbeiten">Die Arbeiten</a><a href="#landschaft" aria-current="page">Die Reise <i aria-hidden="true"></i></a><a href="${home}#ueber-uns">Über mich</a></nav>
      <a class="journey-contact" href="${home}#projektfinder" aria-label="Projekt besprechen">Projekt besprechen ${arrow}</a>
    </header>
    <main class="journey-layout">
      <div class="journey-stage-wrap">
        <div class="journey-stage" role="region" aria-label="Verbundene Erlebnisräume mit sieben Stationen">
          <div class="journey-viewport" data-map>
            <div class="journey-vector">${landscapeSvg()}</div>
            <div class="journey-webgl" aria-hidden="true"></div>
            <div class="journey-atmosphere" aria-hidden="true"></div>
            <div class="journey-markers">${stations.map((station, i) => {
              const [x, y] = mapProjection(...station.position);
              return `<a href="#${station.id}" class="journey-pin" data-pin="${i}" style="left:${x / 10}%;top:${y / 5.8}%" aria-label="${String(i + 1).padStart(2, '0')} – ${station.label}"><span aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><b aria-hidden="true">${station.label}</b></a>`;
            }).join('')}</div>
          </div>
          <div class="journey-preview" data-scene-preview hidden>
            <div class="journey-preview-heading"><span data-preview-name></span><span>VORSCHAU ÖFFNEN ↗</span></div>
            <div class="journey-preview-frame">
              <div class="journey-preview-slot" data-preview-slot aria-hidden="true" inert></div>
              <button class="journey-preview-open" data-preview-open type="button"><span class="journey-sr">Website in Großansicht ausprobieren</span></button>
              <p class="journey-preview-loading" data-preview-loading hidden>Website-Vorschau wird geladen …</p>
            </div>
          </div>
          <div class="journey-scene-label" aria-hidden="true"><span data-scene-index>WEBBYU / VERBUNDENE ERLEBNISRÄUME</span><span data-scene-caption>Jede Idee eröffnet einen neuen Zusammenhang.</span></div>
          <div class="journey-network-key" aria-hidden="true"><span>Inhalt</span><span>Gestaltung</span><span>Funktion</span></div>
        </div>
      </div>
      <div class="journey-story" id="reise-kapitel" tabindex="-1">
        <section class="journey-chapter journey-welcome" id="landschaft" aria-labelledby="landschaft-title" data-chapter="-1">
          <div class="journey-copy">
            <p class="journey-eyebrow"><i aria-hidden="true"></i> DER WEG VON WEBBYU</p>
            <h1>Aus Ideen<br>wird ein <em>Ganzes.</em></h1>
            <h2 id="landschaft-title" class="journey-sr">Übersicht der Reise</h2>
            <p class="journey-lead">Inhalt. Gestaltung. Funktion.</p>
            <p>Eine gute Website verbindet, was zusammengehört. Entdecken Sie, wie aus einer Aufgabe ein eigener digitaler Auftritt entsteht.</p>
            <div class="journey-facts" aria-label="Sieben Stationen, vier Konzeptstudien"><span><b>07</b> Stationen</span><span><b>04</b> eigene Erlebnisräume</span></div>
            <a class="journey-action journey-start" href="#die-idee">Die Reise entdecken <span aria-hidden="true">→</span></a>
            <p class="journey-scroll-cue"><span aria-hidden="true">↕</span> Scrollen oder mit Weiter die Station wechseln.</p>
            <p class="journey-disclaimer">Die vier Arbeiten sind Konzeptstudien für fiktive Marken, keine Kundenreferenzen. Die Reihenfolge beschreibt meine Arbeitsweise.</p>
          </div>
        </section>
        ${stations.map((station, i) => `<section class="journey-chapter" id="${station.id}" aria-labelledby="${station.id}-title" data-chapter="${i}">
          <div class="journey-copy">
            <div class="journey-chapter-heading"><span class="journey-chapter-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p class="journey-eyebrow">${station.eyebrow}</p></div>
            <h2 id="${station.id}-title">${station.title}</h2>
            ${station.story ? `<dl class="journey-project-story"><div><dt>Die Aufgabe</dt><dd>${station.story.task}</dd></div><div><dt>Der Ansatz</dt><dd>${station.story.approach}</dd></div><div><dt>Der Nutzen</dt><dd>${station.story.benefit}</dd></div></dl>` : `<p>${station.description}</p><p class="journey-detail">${station.detail}</p>`}
            ${station.demoId ? `<button class="journey-action" type="button" data-journey-demo="${station.demoId}">Konzept ausprobieren ${arrow}</button><p class="journey-simulation">${station.label} · Fiktive Marke · lokale Simulation</p>` : i === stations.length - 1 ? `<a class="journey-action" href="${home}#projektfinder">Ihr Vorhaben besprechen ${arrow}</a>` : `<a class="journey-action" href="#${stations[i + 1].id}">${i === 0 ? 'Das Fundament entdecken' : 'Die Arbeiten entdecken'} ${arrow}</a>`}
            ${station.note ? `<p class="journey-inline-note"><span>Meine Arbeitsweise</span>„${station.note}“</p>` : ''}
          </div>
        </section>`).join('')}
      </div>
    </main>
    <aside id="weg-dialog" class="journey-guide" data-guide hidden role="dialog" aria-modal="false" aria-label="Einblick in meine Arbeitsweise">
      <div class="journey-guide-bubble">
        <div class="journey-guide-heading"><span>WEBBYU · MEINE ARBEITSWEISE</span><button type="button" data-guide-dismiss aria-label="Randbemerkung schließen">×</button></div>
        <p data-guide-question></p><p data-guide-text></p>
        <button class="journey-guide-reply" type="button" data-guide-dismiss>Zurück zur Reise <span aria-hidden="true">↗</span></button>
      </div>
    </aside>
    <div class="journey-dock">
      <a class="journey-travel journey-travel-back" data-travel-back href="${home}"><span aria-hidden="true">←</span><span data-back-label>Zur Startseite</span></a>
      <div class="journey-dock-center">
        <div class="journey-position"><span data-step-count>00 / 07</span><span data-map-title>Übersicht</span><a class="journey-overview" href="#landschaft"><span aria-hidden="true">⤢</span> Übersicht</a></div>
        <nav class="journey-chapters" aria-label="Kapitel der Reise"><a href="#landschaft" aria-label="Übersicht" aria-current="step"><span>00</span><b>Übersicht</b></a>${stations.map((station, i) => `<a href="#${station.id}" aria-label="${String(i + 1).padStart(2, '0')} ${station.label}"><span>${String(i + 1).padStart(2, '0')}</span><b>${station.label}</b></a>`).join('')}</nav>
      </div>
      <a class="journey-travel journey-travel-next" data-travel-next href="#die-idee"><span data-next-label>Reise beginnen</span><span aria-hidden="true">→</span></a>
      <button class="journey-guide-open" data-guide-open hidden type="button" aria-controls="weg-dialog">Meine Arbeitsweise ${arrow}</button>
      <div class="journey-progress" aria-hidden="true"><span></span></div>
    </div>
    <p class="journey-map-hint" data-map-hint>Scrollen führt Sie durch die Erlebnisräume. Alle Stationen sind auch direkt anwählbar.</p>
    <footer class="journey-footer"><a class="journey-wordmark" href="${home}" aria-label="Webbyu – Startseite">webbyu<span>.</span></a><p>Ein Gründer. Ein direkter Ansprechpartner.<br>Hamburg · Bad Oldesloe · Umgebung</p><a href="${home}">Zur Startseite ${arrow}</a></footer>
    <div class="journey-status" role="status" aria-live="polite"></div><div data-demo-parking hidden></div>`;
}
