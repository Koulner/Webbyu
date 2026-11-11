import '../fonts.css';
import '../basis/leuchttisch.css';
import { start } from '../basis/page';
import { stufen } from '../stufen';

start({ ...stufen['stufe-2'], motion: () => import('../basis/motion').then((m) => m.initMotion()) });
