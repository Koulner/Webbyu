import { mountPrivacy } from './privacy';

const privacy = mountPrivacy();
if (import.meta.hot) import.meta.hot.dispose(() => privacy.dispose());
