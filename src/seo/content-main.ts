import '../fonts.css';
import '../tokens.css';
import './content.css';
import { mountPrivacy } from '../privacy';

// Content is already present in HTML. Only the existing privacy control needs JavaScript.
mountPrivacy();
document.querySelectorAll<HTMLButtonElement>('[data-privacy-open]').forEach(button => {
  button.hidden = false;
});
