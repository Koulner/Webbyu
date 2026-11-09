// Drei Richtungen als knappe, sichtbare Skizzen (UNIKAT_STANDARD, Schritt 2).
// Bewusst grob: Sie vergleichen Leitidee, Inhaltsführung und Komposition, nicht Details.
import { writeFileSync } from 'node:fs';
import { aufmass, eingebaut, defs } from '../strecke/drawings.mjs';

const frame = (kind, label, inner) => `<figure class="f f--${kind}"><div class="f-box"><div class="f-in">${inner}</div></div><figcaption>${label}</figcaption></figure>`;

// A: Werkakte
const aHero = `<div class="a"><div class="a-tabs"><b>Akte 14</b><span>Nachricht</span><span>Aufmaß</span><span>Zeichnung</span><span>Holzliste</span><span>Einbau</span></div>
<div class="a-sheet"><p class="a-date">Eingang, Dienstag</p><h1>„Bei uns passt kein Schrank in den Flur.“</h1><p class="a-body">So beginnt fast jede Akte. Hier ist eine vollständig: vom ersten Satz bis zum letzten Handgriff.</p><div class="a-stamp">Fiktive Akte</div></div></div>`;
const aMid = `<div class="a"><div class="a-tabs"><span>Nachricht</span><b>Aufmaß</b><span>Zeichnung</span><span>Holzliste</span><span>Einbau</span></div>
<div class="a-sheet a-sheet--row"><div><p class="a-date">Termin vor Ort</p><h2>Vier Maße, zwei Überraschungen.</h2><ul><li>09:10 Boden fällt nach links</li><li>09:25 Steigleitung hinter dem Putz</li><li>09:40 Foto für die Akte</li></ul></div><div class="a-mini">${aufmass(undefined, 5)}</div></div></div>`;
const aMob = `<div class="a a--m"><div class="a-tabs"><b>Akte 14</b><span>2/5</span></div><div class="a-sheet"><p class="a-date">Eingang</p><h1>„Bei uns passt kein Schrank in den Flur.“</h1><p class="a-body">Eine Akte, vom ersten Satz bis zum Einbau.</p></div><div class="a-sheet a-sheet--2"><p class="a-date">Termin vor Ort</p><h2>Vier Maße.</h2></div></div>`;

// B: Passleiste
const bHero = `<div class="b"><div class="b-wall"></div><div class="b-copy"><h1>Gerade Möbel für schiefe Häuser.</h1><p>Wo Wände fallen und Böden laufen, bauen wir nach Aufmaß.</p><span class="b-btn">Ihre Nische messen</span></div><div class="b-draw">${aufmass(undefined, 5)}</div></div>`;
const bMid = `<div class="b b--mid"><div class="b-wall"></div><div class="b-draw b-draw--l">${eingebaut()}</div><div class="b-copy b-copy--r"><h2>Die Schiefe kommt in eine Leiste.</h2><p>14 mm oben, 28 mm unten. Der Rest des Möbels bleibt rechtwinklig.</p><div class="b-form"><i>unten 1207</i><i>oben 1184</i><i>links 2412</i><i>rechts 2401</i></div></div></div>`;
const bMob = `<div class="b b--m"><div class="b-wall"></div><div class="b-copy"><h1>Gerade Möbel für schiefe Häuser.</h1><span class="b-btn">Ihre Nische messen</span></div><div class="b-draw">${aufmass(undefined, 5)}</div></div>`;

// C: Stückliste
const rows = [['01', 'Seite links', '2.375 × 340 × 24', 'Eiche'], ['02', 'Seite rechts', '2.375 × 340 × 24', 'Eiche'], ['03', 'Boden', '1.108 × 340 × 24', 'Eiche'], ['07', 'Passleiste rechts', '14 → 28 mm', 'angerissen'], ['12', 'Ihr Raum', '? × ? × ?', 'fehlt noch']];
const table = list => `<table>${list.map((r, i) => `<tr class="${r[0] === '07' ? 'hot' : r[0] === '12' ? 'you' : ''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>`;
const cHero = `<div class="c"><p class="c-top">Eiche &amp; Form · Holzliste Garderobe</p><h1>Pos. 12<br>fehlt noch.</h1>${table(rows)}</div>`;
const cMid = `<div class="c c--mid"><p class="c-top">Pos. 07</p><h2>Passleiste rechts</h2><p class="c-long">Die einzige Position, die nicht rechtwinklig ist. Sie wird vor Ort an die Wand angerissen und von Hand angepasst. Ohne sie steht jedes Möbel in einem Altbau schief oder hat Lücken.</p>${table(rows.slice(3))}</div>`;
const cMob = `<div class="c c--m"><p class="c-top">Holzliste</p><h1>Pos. 12 fehlt noch.</h1>${table(rows)}</div>`;

const dir = (id, title, type, idea, weak, frames) => `<section class="dir" id="${id}"><header><p class="tag">${type}</p><h2>${title}</h2><p class="idea">${idea}</p><p class="weak"><b>Mögliche Schwäche:</b> ${weak}</p></header><div class="frames">${frames}</div></section>`;

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Eiche &amp; Form · Drei Richtungen</title><link rel="stylesheet" href="skizzen.css"></head><body>
${defs('../strecke/')}
<main><header class="top"><h1>Eiche &amp; Form: drei Richtungen</h1><p>Arbeitsskizzen zum Vergleich von Leitidee, Inhaltsführung und Komposition. Fiktives Unternehmen. Alle drei beruhen auf demselben Briefing.</p></header>
${dir('a', 'A · Die Werkakte', 'Nah am Briefing', 'Die Website ist die Akte eines einzigen Falls, von der ersten Nachricht bis zum Einbau. Besucher lesen sich wie in einer Mappe durch.', 'Sie erzählt nur einen Fall. Wer einen anderen Raum hat, fühlt sich nicht angesprochen, und die Aktenoptik wirkt schnell bürokratisch.', frame('d', 'Einstieg', aHero) + frame('d', 'Mittelteil', aMid) + frame('m', 'Mobil', aMob))}
${dir('b', 'B · Die Passleiste', 'Mutiger', 'Die Schiefe des Hauses ist der Anfang, nicht das Problem. Eine keilförmige Eichenleiste nimmt sie auf und zieht sich als Motiv durch die ganze Seite. Am Ende messen Besucher ihre eigene Nische.', 'Technische Zeichnungen wirken ohne Foto kühler als eine Wohnwelt. Die Fachsprache muss stimmen und gegengelesen werden.', frame('d', 'Einstieg', bHero) + frame('d', 'Mittelteil', bMid) + frame('m', 'Mobil', bMob))}
${dir('c', 'C · Die Stückliste', 'Bewusst kontrastierend', 'Keine Bilder, keine Versprechen: Die Seite besteht aus den Positionen, aus denen ein Möbel gebaut wird. Die letzte Position ist der Raum des Besuchers.', 'Privatkunden sehen kein Ergebnis und können sich ihr Möbel nicht vorstellen. Die Idee kann selbstgefällig wirken.', frame('d', 'Einstieg', cHero) + frame('d', 'Mittelteil', cMid) + frame('m', 'Mobil', cMob))}
</main></body></html>`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('skizzen/index.html', html.length);
