import '../fonts.css';
import '../basis/leuchttisch.css';
import './style.css';
import { start } from '../basis/page';
import { stufen } from '../stufen';

// Einfahrt nur auf großen Schirmen mit Bewegung; muss stehen, bevor die Pins gemessen werden.
// shortcut: Wechsel unter 960 px zur Laufzeit baut die Einfahrt nicht ab, bei Bedarf über matchMedia-Listener lösen.
const wide = matchMedia('(min-width: 960px)').matches;
start({
  ...stufen['stufe-3'],
  motion: () =>
    Promise.all([wide ? import('./einfahrt') : null, import('../basis/motion')]).then(([e, m]) => {
      e?.initEinfahrt();
      m.initMotion();
    }),
});
