// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountBackside } from './backside';

function fixture() {
  const root = document.createElement('div');
  root.innerHTML = `<canvas class="room-light"></canvas>
    <figure class="panel" data-panel><div class="card"><div class="face front"></div><div class="face back"></div></div><button class="flip" type="button">Rückseite zeigen</button></figure>
    <div class="stack-wrap"></div>`;
  document.body.append(root);
  return root;
}
const media = (reduce: boolean) => vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }));

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

describe('Vorder- und Rückseite', () => {
  it('dreht nur bei erlaubter Bewegung und schaltet die Seite per Schaltfläche sofort um', () => {
    media(false);
    const root = fixture();
    const light = { render: vi.fn(), dispose: vi.fn() };
    const loadLight = vi.fn(async () => ({ mountRoomLight: () => light }));
    const backside = mountBackside(root, loadLight);
    const button = root.querySelector('button')!;
    expect(root.classList.contains('is-3d')).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toBe('Vorderseite zeigen');
    expect(root.querySelector<HTMLElement>('[data-panel]')!.dataset.side).toBe('back');
    backside.dispose();
    expect(root.classList.contains('is-3d')).toBe(false);
  });

  it('bleibt bei reduzierter Bewegung oder „Bewegung reduzieren“ ruhig und lädt kein Raumlicht', async () => {
    media(true);
    const root = fixture();
    const loadLight = vi.fn();
    const backside = mountBackside(root, loadLight);
    expect(root.classList.contains('is-3d')).toBe(false);
    expect(root.querySelector<HTMLElement>('.stack-wrap')!.style.getPropertyValue('--explode')).toBe('1');
    await new Promise(resolve => setTimeout(resolve, 1300));
    expect(loadLight).not.toHaveBeenCalled();
    backside.dispose();

    media(false);
    const quietRoot = fixture();
    quietRoot.dataset.motion = 'quiet';
    mountBackside(quietRoot, vi.fn()).dispose();
    expect(quietRoot.classList.contains('is-3d')).toBe(false);
  });
});
