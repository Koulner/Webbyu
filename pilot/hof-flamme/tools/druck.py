"""Hof & Flamme: setzt vorhandene Bilder als einfarbigen Rasterdruck.

Eingang sind ausschließlich Dateien aus public/package-demos. Ausgang sind WebP-Dateien mit
einfarbiger Druckfarbe und Alphakanal: Papier ist das, was die Seite dahinter zeigt.
Aufruf aus dem Projektordner: python pilot/hof-flamme/tools/druck.py [zielordner]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

QUELLE = Path('public/package-demos')
ZIEL = Path(sys.argv[1]) if len(sys.argv) > 1 else QUELLE

# name, quelle, ausschnitt (x0, y0, x1, y1), breite, rasterweite in px, tonwert (gamma), druckfarbe
ARBEITEN = [
    ('hof-ki-tafel', 'hof-concept.webp', (0, 0, 1536, 1024), 1600, 9.0, 0.56, '#16100b'),
    ('hof-ki-wurzeln', 'hof-concept.webp', (470, 420, 1190, 850), 1400, 8.0, 0.72, '#16100b'),
    ('hof-ki-brot', 'hof-concept.webp', (0, 250, 350, 490), 900, 7.0, 0.62, '#16100b'),
    ('hof-ki-kerze', 'hof-concept.webp', (425, 205, 755, 465), 720, 6.5, 0.6, '#16100b'),
    ('hof-foto-rost', 'food-dish.webp', (130, 95, 640, 790), 1000, 8.0, 0.74, '#16100b'),
    ('hof-foto-reichen', 'food-table.webp', (620, 440, 1600, 1067), 1600, 9.0, 0.66, '#16100b'),
]
UEBERABTASTUNG = 3


def ton(bild: Image.Image, gamma: float) -> np.ndarray:
    """Graustufen mit lokalem Kontrast. Rückgabe 0 (schwarz) bis 1 (weiß)."""
    grau = ImageOps.autocontrast(bild.convert('L'), cutoff=(1, 1))
    weich = np.asarray(grau.filter(ImageFilter.GaussianBlur(grau.width / 22)), dtype=np.float32) / 255
    wert = np.asarray(grau, dtype=np.float32) / 255
    wert = np.clip(wert + 0.75 * (wert - weich), 0, 1)
    # Auch die tiefsten Schatten behalten kleine Papierpunkte, sonst läuft das Bild zu.
    return 0.13 + 0.87 * wert ** gamma


def raster(wert: np.ndarray, weite: float) -> np.ndarray:
    """Punktraster unter 45 Grad. Rückgabe: Deckung der Druckfarbe, 0 oder 1."""
    h, w = wert.shape
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (x + y) * np.pi / (weite * np.sqrt(2))
    v = (x - y) * np.pi / (weite * np.sqrt(2))
    schwelle = 0.5 + 0.25 * (np.cos(2 * u) + np.cos(2 * v))
    return (wert < schwelle).astype(np.float32)


def drucke(name, datei, ausschnitt, breite, weite, gamma, farbe, nachsatz=''):
    quelle = Image.open(QUELLE / datei).convert('RGB').crop(ausschnitt)
    hoehe = round(breite * quelle.height / quelle.width)
    gross = quelle.resize((breite * UEBERABTASTUNG, hoehe * UEBERABTASTUNG), Image.LANCZOS)
    gross = gross.filter(ImageFilter.GaussianBlur(UEBERABTASTUNG * weite * 0.28))
    deckung = raster(ton(gross, gamma), weite * UEBERABTASTUNG)
    alpha = Image.fromarray(np.uint8(deckung * 255)).resize((breite, hoehe), Image.LANCZOS)
    rgba = Image.new('RGBA', (breite, hoehe), farbe)
    rgba.putalpha(alpha)
    pfad = ZIEL / f'{name}{nachsatz}.webp'
    rgba.save(pfad, 'WEBP', quality=30, alpha_quality=62, method=6)
    print(f'{pfad.name}: {breite}x{hoehe}, {pfad.stat().st_size // 1024} KB')


if __name__ == '__main__':
    ZIEL.mkdir(parents=True, exist_ok=True)
    for arbeit in ARBEITEN:
        drucke(*arbeit)
        name, datei, ausschnitt, breite, weite, gamma, farbe = arbeit
        # Eigene Fassung für schmale Bildschirme: feineres Raster statt verkleinerter Punkte.
        if breite >= 1400:
            drucke(name, datei, ausschnitt, 800, max(4.6, weite * 0.62), gamma, farbe, '-800')
