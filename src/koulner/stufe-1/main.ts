import '../fonts.css';
import '../basis/leuchttisch.css';
import './style.css';
import { start } from '../basis/page';
import { stufen } from '../stufen';

start(stufen['stufe-1']);

// Fettstift-Kreis zeichnet sich per CSS, sobald Einstieg oder Bogen zu sehen ist (ruhige Fassung: style.css zeigt ihn sofort).
const seen = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-seen'), seen.unobserve(e.target))),
  { threshold: 0.25 },
);
document.querySelectorAll('.hero, .bogen').forEach((s) => seen.observe(s));
