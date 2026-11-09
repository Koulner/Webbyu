"""Erzeugt die WebP-Breiten der Wortmarke aus public/webbyu-wortmarke.png (Pillow, wie refine-package-media.py).

Aufruf: python scripts/make-wordmark.py
Breiten passen zu srcset/sizes in shell.ts, journey/page.ts, seo/content.ts, 404.html, impressum/index.html:
Anzeige 128-154 px (Kopf) und 170-410 px (Fuß), je mit 1x bis 3x Pixeldichte.
"""
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / 'public'
WIDTHS = (270, 405, 580, 820)

src = Image.open(PUBLIC / 'webbyu-wortmarke.png')
for w in WIDTHS:
    out = PUBLIC / f'webbyu-wortmarke-{w}.webp'
    src.resize((w, round(w * src.height / src.width)), Image.LANCZOS).save(out, quality=92, alpha_quality=100, method=6)
    print(out.name, out.stat().st_size)
