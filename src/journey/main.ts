import '../fonts.css';
import '../tokens.css';
import '../demos.css';
import './style.css';
import { mountJourney } from './controller';

const root=document.querySelector<HTMLElement>('#journey-app');
const embedded = window.parent !== window && new URLSearchParams(location.search).get('embed') === '1';
const journey=root?mountJourney(root, { embedded }):undefined;
if(import.meta.hot) import.meta.hot.dispose(()=>journey?.dispose());
