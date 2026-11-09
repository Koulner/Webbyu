"""Erzeugt die prozedurale Eichenstruktur oak.webp (kein Foto, keine Fremdquelle).

Vorbild ist Rifteiche: fast gerade Faser, ruhiger Ton, feine dunkle Poren.
"""
import sys
import numpy as np
from PIL import Image

W, H = 1000, 2000
rng = np.random.default_rng(14)


def noise(cell_x, cell_y):
    """Glattes Wertrauschen durch hochskaliertes Zufallsgitter."""
    gx, gy = max(2, W // cell_x + 2), max(2, H // cell_y + 2)
    grid = rng.random((gy, gx)).astype(np.float32)
    img = Image.fromarray((grid * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255


x = np.tile(np.arange(W, dtype=np.float32), (H, 1))
# Nur leichte Drift: Jahresringe laufen fast gerade.
drift = noise(500, 1100) * 40 + noise(120, 900) * 2.5
spacing = noise(700, 2000) * 9
rings = .5 + .5 * np.sin((x + drift) * (.16 + spacing * .012))
rings = rings ** 2.4
broad = noise(220, 1400)
fine = noise(4, 120)
pores = np.clip((noise(2, 34) - .66) * 6, 0, 1)
v = .34 * rings + .34 * broad + .32 * fine
v = np.clip(v - pores * .30, 0, 1)[..., None]
light = np.array([204, 172, 128], dtype=np.float32)
dark = np.array([158, 121, 80], dtype=np.float32)
rgb = dark + (light - dark) * v
Image.fromarray(rgb.astype(np.uint8)).save(sys.argv[1], 'WEBP', quality=74, method=6)
print('saved', sys.argv[1])
