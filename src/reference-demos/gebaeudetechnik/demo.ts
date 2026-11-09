import body from './body.html?raw';
import css from './style.css?raw';
import { mount as mountApp } from './app.js';
import { mountReferenceDemo } from '../runtime';

export function mount(root: HTMLElement, _id: string, signal: AbortSignal): void {
  mountReferenceDemo(root, { body, css, mount: mountApp }, signal);
}
