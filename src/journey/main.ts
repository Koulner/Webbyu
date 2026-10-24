import '../fonts.css';
import '../tokens.css';
import '../demos.css';
import './style.css';
import { mountJourney } from './controller';

const root=document.querySelector<HTMLElement>('#journey-app');
const journey=root?mountJourney(root):undefined;
if(import.meta.hot) import.meta.hot.dispose(()=>journey?.dispose());
