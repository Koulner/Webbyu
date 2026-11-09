"""Physikalisch beleuchtetes Rendering von Fall 14 aus den Maßen von drawings.mjs.

Kleiner Pfadtracer in NumPy, keine Fremdassets. Das Ergebnis ist eine
Entwurfsvisualisierung eines erfundenen Möbels, kein Foto.

Aufruf: python render.py <geometrie.json> <oak.webp> <ziel.webp> [--view front|detail] [--w 1000] [--spp 64]
"""
import argparse
import json
import multiprocessing as mp
import numpy as np
from PIL import Image

EPS = 2e-4
SUN = np.array([-0.78, 0.34, 0.40], dtype=np.float32)
SUN /= np.linalg.norm(SUN)
SUN_L = np.array([7.2, 6.2, 5.1], dtype=np.float32)
WIN = dict(x=-2.0, y0=0.75, y1=2.95, z0=0.55, z1=2.65)
SKY_L = np.array([3.3, 3.5, 3.8], dtype=np.float32)


def rgb(*c):
    return np.array(c, dtype=np.float32)


# Material: (Art, Farbe, Parameter)
MATS = {
    'putz': ('plaster', rgb(.66, .65, .62), {}),
    'decke': ('plaster', rgb(.72, .71, .68), {}),
    'lack': ('diff', rgb(.74, .73, .70), {}),
    'boden': ('floor', rgb(.42, .30, .20), {}),
    'korpus': ('diff', rgb(.05, .035, .025), {}),
    'griff': ('diff', rgb(.03, .025, .02), {}),
    'haken': ('diff', rgb(.025, .025, .028), {}),
    'stoff': ('diff', rgb(.20, .24, .27), {}),
    'stoff2': ('diff', rgb(.48, .44, .36), {}),
    'tuer_l': ('oak', rgb(1, 1, 1), dict(rot=False, off=(.13, .21), board=.145)),
    'tuer_r': ('oak', rgb(1, 1, 1), dict(rot=False, off=(.71, .55), board=.145)),
    'lade_l': ('oak', rgb(1, 1, 1), dict(rot=True, off=(.37, .08), board=.12)),
    'lade_r': ('oak', rgb(1, 1, 1), dict(rot=True, off=(.91, .47), board=.12)),
    'bank': ('oak', rgb(.95, .94, .92), dict(rot=True, off=(.52, .33), board=.11)),
    'seite': ('oak', rgb(.97, .96, .95), dict(rot=False, off=(.27, .62), board=.16)),
    'ruecken': ('oak', rgb(.92, .90, .87), dict(rot=False, off=(.05, .81), board=.30)),
    'blende': ('oak', rgb(1, 1, 1), dict(rot=False, off=(.44, .17), board=1.0)),
    'leiste_l': ('oak', rgb(1, 1, 1), dict(rot=False, off=(.63, .29), board=1.0)),
    'leiste_r': ('oak', rgb(1, 1, 1), dict(rot=False, off=(.83, .71), board=1.0)),
    'quer': ('oak', rgb(1, 1, 1), dict(rot=True, off=(.19, .39), board=1.0)),
}
NAMES = list(MATS)
ID = {n: i for i, n in enumerate(NAMES)}


def build(g):
    """Alles in Metern. x nach rechts, y nach oben, z zum Betrachter. Wandvorderkante z=0."""
    b = g['bottom'] / 1000
    hl = g['left'] / 1000
    x0, x1 = g['x0'] / 1000, g['x1'] / 1000
    lean, lean_r = g['lean'] / 1000, g['leanRight'] / 1000
    y0 = hl - .018            # Oberkante Korpus
    y1 = y0 - g['height'] / 1000
    w = x1 - x0
    mid = (x0 + x1) / 2
    upper, bench, seat, sock, bw = .56, .50, .044, .07, .12
    yu, yb = y0 - upper, y1 + bench
    fz = .02                  # Fronten stehen 20 mm vor der Wand
    gap = .0018
    boxes, tris, spheres = [], [], []
    B = lambda a, c, m: boxes.append((*a, *c, ID[m]))

    # Flur: 3,20 m hoch wie im Altbau
    H = 3.2
    B((-3, -1, -1), (5, 0, 5), 'boden')
    B((-3, H, -1), (5, H + 1, 5), 'decke')
    B((-3, -1, -1), (WIN['x'], H + 1, 5), 'putz')
    B((3.4, -1, -1), (5, H + 1, 5), 'putz')
    B((-3, -1, 3.8), (5, H + 1, 5), 'putz')
    # Wand mit Nischenöffnung
    B((-3, -1, -1), (0, H + 1, 0), 'putz')
    B((b, -1, -1), (5, H + 1, 0), 'putz')
    B((0, hl, -1), (b, H + 1, 0), 'putz')
    B((-3, -1, -1), (5, H + 1, -.36), 'putz')
    # Fußleiste und Deckenprofil
    for a, c in (((-3, 0), (0, .22)), ((b, 0), (5, .22))):
        B((a[0], 0, 0), (c[0], .22, .024), 'lack')
        B((a[0], .22, 0), (c[0], .238, .012), 'lack')
    B((-3, H - .11, 0), (5, H, .07), 'lack')
    B((-3, H - .15, 0), (5, H - .11, .03), 'lack')

    # Korpus: dunkler Kern, sichtbar nur in den Fugen
    B((x0, y1 + sock, -.32), (x1, yb, 0), 'korpus')
    B((x0, yu, -.32), (x1, y0, 0), 'korpus')
    B((x0, y1, -.30), (x1, y1 + sock, -.02), 'korpus')
    # Seiten, Boden unter dem Oberschrank, Rückwand
    B((x0, yb, -.32), (x0 + .024, yu, fz), 'seite')
    B((x0, yu - .024, -.32), (x1, yu, fz), 'quer')
    B((x0, yb, -.32), (x1, yu, -.30), 'ruecken')
    B((x1 - bw, yb, -.32), (x1, yu, fz), 'blende')
    # Türen
    B((x0 + gap, yu + gap, 0), (mid - gap, y0 - gap, fz), 'tuer_l')
    B((mid + gap, yu + gap, 0), (x1 - gap, y0 - gap, fz), 'tuer_r')
    B((mid - .012, yu + .05, fz), (mid - gap, yu + .17, fz + .0005), 'griff')
    B((mid + gap, yu + .05, fz), (mid + .012, yu + .17, fz + .0005), 'griff')
    # Bank und Schubkästen
    B((x0, yb - seat, -.32), (x1, yb, fz + .006), 'bank')
    tl, bl = yb - seat - gap, y1 + sock + gap
    B((x0 + gap, bl, 0), (mid - gap, tl, fz), 'lade_l')
    B((mid + gap, bl, 0), (x1 - gap, tl, fz), 'lade_r')
    for cx in (x0 + w / 4, x0 + 3 * w / 4):
        B((cx - .06, tl - .07, fz), (cx + .06, tl - .046, fz + .0005), 'griff')
    # Hakenleiste und Haken
    hy = yu - .34
    B((x0 + .024, hy - .038, -.30), (x1 - bw, hy + .038, -.278), 'quer')
    for i in range(5):
        hx = x0 + .024 + (w - bw - .024) * (i + .5) / 5
        spheres.append((hx, hy, -.252, .017, ID['haken']))
    # Gefaltete Wolldecken auf der Bank, damit der Maßstab lesbar wird
    B((x0 + .08, yb, -.29), (x0 + .50, yb + .045, -.05), 'stoff')
    B((x0 + .10, yb + .045, -.28), (x0 + .48, yb + .085, -.07), 'stoff2')

    # Oberer und unterer Abschluss
    B((x0, y0, -.02), (x1, hl, fz), 'quer')
    B((x0, 0, -.02), (x1, y1, fz), 'quer')

    def quad(p, m):
        tris.append((*p[0], *p[1], *p[2], ID[m]))
        tris.append((*p[0], *p[2], *p[3], ID[m]))

    # Passleisten: echte Keilform aus Fall 14 (Boden x=0 bzw. b, Decke x=lean bzw. b-lean_r)
    quad([(0, 0, fz), (x0, 0, fz), (x0, hl, fz), (lean, hl, fz)], 'leiste_l')
    quad([(0, 0, 0), (0, 0, fz), (lean, hl, fz), (lean, hl, 0)], 'leiste_l')
    quad([(x1, 0, fz), (b, 0, fz), (b - lean_r, hl, fz), (x1, hl, fz)], 'leiste_r')
    quad([(b, 0, fz), (b, 0, 0), (b - lean_r, hl, 0), (b - lean_r, hl, fz)], 'leiste_r')
    # Wandstücke, die den Keil zwischen Lot und schiefer Wand schließen
    tris.append((0, 0, .0004, lean, hl, .0004, 0, hl, .0004, ID['putz']))
    tris.append((b, 0, .0004, b, hl, .0004, b - lean_r, hl, .0004, ID['putz']))
    return (np.array(boxes, dtype=np.float32), np.array(tris, dtype=np.float32), np.array(spheres, dtype=np.float32))


class Scene:
    def __init__(self, geo, oak_path):
        self.bx, tr, sp = build(geo)
        self.bmin, self.bmax, self.bmat = self.bx[:, :3], self.bx[:, 3:6], self.bx[:, 6].astype(int)
        self.v0, self.e1, self.e2 = tr[:, 0:3], tr[:, 3:6] - tr[:, 0:3], tr[:, 6:9] - tr[:, 0:3]
        self.tmat = tr[:, 9].astype(int)
        n = np.cross(self.e1, self.e2)
        self.tn = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        self.sc, self.sr, self.smat = sp[:, :3], sp[:, 3], sp[:, 4].astype(int)
        oak = np.asarray(Image.open(oak_path).convert('RGB'), dtype=np.float32) / 255
        self.oak = oak ** 2.2
        rng = np.random.default_rng(7)
        # Putz: grobe Wolken und feine Körnung, kachelbar
        coarse = np.asarray(Image.fromarray((rng.random((24, 24)) * 255).astype(np.uint8)).resize((512, 512), Image.BICUBIC), dtype=np.float32) / 255
        fine = rng.random((512, 512)).astype(np.float32)
        self.noise = .10 * (coarse - .5) + .025 * (fine - .5)

    def intersect(self, o, d, tmax=None, any_hit=False):
        """o, d: (R,3). Liefert t, Materialindex und Normale der nächsten Treffer."""
        R = len(o)
        best = np.full(R, np.inf if tmax is None else 0, dtype=np.float32)
        if tmax is not None:
            best[:] = tmax
        mat = np.full(R, -1, dtype=np.int32)
        nor = np.zeros((R, 3), dtype=np.float32)
        with np.errstate(divide='ignore', invalid='ignore'):
            inv = 1 / d
        t1 = (self.bmin[None] - o[:, None]) * inv[:, None]
        t2 = (self.bmax[None] - o[:, None]) * inv[:, None]
        t1 = np.nan_to_num(t1, nan=-np.inf)
        t2 = np.nan_to_num(t2, nan=np.inf)
        lo = np.minimum(t1, t2)
        tn = lo.max(axis=2)
        tf = np.maximum(t1, t2).min(axis=2)
        ok = (tf >= tn) & (tn > EPS)
        tn = np.where(ok, tn, np.inf)
        idx = tn.argmin(axis=1)
        ti = tn[np.arange(R), idx]
        hit = ti < best
        best[hit] = ti[hit]
        mat[hit] = self.bmat[idx[hit]]
        if not any_hit and hit.any():
            ax = lo[hit, idx[hit]].argmax(axis=1)
            rows = np.nonzero(hit)[0]
            nor[rows, ax] = -np.sign(d[rows, ax])
        # Dreiecke
        if len(self.v0):
            p = np.cross(d[:, None], self.e2[None])
            det = (p * self.e1[None]).sum(2)
            with np.errstate(divide='ignore', invalid='ignore'):
                f = 1 / det
                s = o[:, None] - self.v0[None]
                u = f * (s * p).sum(2)
                q = np.cross(s, self.e1[None])
                v = f * (d[:, None] * q).sum(2)
                t = f * (q * self.e2[None]).sum(2)
            good = (np.abs(det) > 1e-9) & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > EPS)
            t = np.where(good, t, np.inf)
            i = t.argmin(1)
            ti = t[np.arange(R), i]
            h = ti < best
            best[h] = ti[h]
            mat[h] = self.tmat[i[h]]
            if not any_hit and h.any():
                n = self.tn[i[h]]
                nor[h] = n * -np.sign((n * d[h]).sum(1, keepdims=True))
        # Kugeln
        if len(self.sc):
            oc = o[:, None] - self.sc[None]
            bq = (oc * d[:, None]).sum(2)
            cq = (oc * oc).sum(2) - self.sr[None] ** 2
            disc = bq * bq - cq
            with np.errstate(invalid='ignore'):
                t = -bq - np.sqrt(disc)
            t = np.where((disc > 0) & (t > EPS), t, np.inf)
            i = t.argmin(1)
            ti = t[np.arange(R), i]
            h = ti < best
            best[h] = ti[h]
            mat[h] = self.smat[i[h]]
            if not any_hit and h.any():
                pos = o[h] + d[h] * ti[h, None]
                nv = pos - self.sc[i[h]]
                nor[h] = nv / np.linalg.norm(nv, axis=1, keepdims=True)
        return best, mat, nor

    def occluded(self, o, d, tmax):
        _, m, _ = self.intersect(o, d, tmax=tmax - 2e-3, any_hit=True)
        return m >= 0

    def albedo(self, m, p, n):
        out = np.ones((len(m), 3), dtype=np.float32)
        for i in np.unique(m):
            sel = m == i
            kind, col, par = MATS[NAMES[i]]
            pos, nor = p[sel], n[sel]
            if kind == 'diff':
                out[sel] = col
            elif kind == 'plaster':
                a = np.abs(nor)
                uvx = np.where(a[:, 0] > .5, pos[:, 2], pos[:, 0])
                uvy = np.where(a[:, 1] > .5, pos[:, 2], pos[:, 1])
                nz = self.noise[((uvy * 260).astype(int)) % 512, ((uvx * 260).astype(int)) % 512]
                out[sel] = col * (1 + nz[:, None])
            elif kind == 'floor':
                width = .19
                board = np.floor(pos[:, 0] / width)
                h = np.mod(board * 12.9898, 1.0)
                u = (pos[:, 0] / .9 + h * 3.1) % 1
                v = (pos[:, 2] / 1.8 + h * 5.7) % 1
                tx = self.oak[(v * 1999).astype(int), (u * 999).astype(int)]
                gapm = np.abs((pos[:, 0] % width) - width / 2) > width / 2 - .0022
                tone = (.82 + .3 * h)[:, None]
                out[sel] = tx * rgb(.72, .60, .50) * tone * np.where(gapm[:, None], .12, 1)
            else:  # oak
                a = np.abs(nor)
                # Flächenkoordinaten: Faser läuft in v
                s = np.where(a[:, 0] > .5, pos[:, 2], pos[:, 0])
                t = np.where(a[:, 1] > .5, pos[:, 2], pos[:, 1])
                if par['rot']:
                    s, t = t, s
                ou, ov = par['off']
                bw_ = par['board']
                board = np.floor(s / bw_)
                h = np.mod((board + ou * 37) * 7.13, 1.0)
                u = (s / .62 + ou + h * 2.7) % 1
                v = (t / 1.24 + ov + h * 4.3) % 1
                tx = self.oak[(v * 1999).astype(int), (u * 999).astype(int)]
                tone = (.90 + .17 * h)[:, None]
                out[sel] = tx * col * tone * rgb(.97, .94, .92)
        return out

    def direct(self, p, n, alb, rng):
        """Sonne durch das Fenster und Himmelslicht aus dem Fenster, je ein Schattenstrahl."""
        R = len(p)
        q = p + n * 4e-4
        L = np.zeros((R, 3), dtype=np.float32)
        # Sonne mit weicher Kante
        j = rng.normal(0, .006, (R, 3)).astype(np.float32)
        s = SUN + j
        s /= np.linalg.norm(s, axis=1, keepdims=True)
        cs = (n * s).sum(1)
        t = (WIN['x'] - q[:, 0]) / s[:, 0]
        hy = q[:, 1] + s[:, 1] * t
        hz = q[:, 2] + s[:, 2] * t
        inw = (hy > WIN['y0']) & (hy < WIN['y1']) & (hz > WIN['z0']) & (hz < WIN['z1'])
        bars = (np.mod(hy - WIN['y0'], .62) < .05) | (np.mod(hz - WIN['z0'], .70) < .06)
        lit = np.nonzero(inw & ~bars & (cs > 0) & (t > 0))[0]
        if len(lit):
            occ = self.occluded(q[lit], s[lit], t[lit])
            keep = lit[~occ]
            L[keep] += SUN_L * cs[keep, None] * alb[keep] / np.pi
        # Fensterfläche
        ty = rng.random(R).astype(np.float32)
        tz = rng.random(R).astype(np.float32)
        pw = np.stack([np.full(R, WIN['x'] + .01, dtype=np.float32), WIN['y0'] + ty * (WIN['y1'] - WIN['y0']), WIN['z0'] + tz * (WIN['z1'] - WIN['z0'])], 1)
        dv = pw - q
        r2 = (dv * dv).sum(1)
        r = np.sqrt(r2)
        dv = dv / r[:, None]
        cp = (n * dv).sum(1)
        cw = np.maximum(-dv[:, 0], 0)
        area = (WIN['y1'] - WIN['y0']) * (WIN['z1'] - WIN['z0'])
        vis = np.nonzero((cp > 0) & (cw > 0))[0]
        if len(vis):
            occ = self.occluded(q[vis], dv[vis], r[vis])
            keep = vis[~occ]
            L[keep] += SKY_L * (cp[keep] * cw[keep] * area / r2[keep])[:, None] * alb[keep] / np.pi
        return L


def camera(view):
    if view == 'detail':
        # Nah an der rechten Leiste, schräg von rechts
        return dict(eye=np.array([1.62, .62, .62], np.float32), kind='look', target=np.array([1.17, .40, 0], np.float32), fov=.34)
    if view == 'breit':
        # Querformat für Vorschaukarten: Möbel rechts der Mitte, links Platz für Text
        return dict(eye=np.array([.55, 1.25, 3.7], np.float32), kind='plane', xr=(-2.45, 2.35), yr=(-.38, 2.62))
    if view == 'halb':
        return dict(eye=np.array([1.9, 1.2, 3.1], np.float32), kind='plane', xr=(-.62, 2.0), yr=(-.42, 2.86))
    # Shift-Objektiv: Senkrechte bleiben senkrecht, wie in der Architekturfotografie
    return dict(eye=np.array([.82, 1.22, 3.3], np.float32), kind='plane', xr=(-.62, 1.98), yr=(-.40, 2.85))


def primary(cam, xs, ys, W, H, rng):
    n = len(xs)
    sx = (xs + rng.random(n)) / W
    sy = (ys + rng.random(n)) / H
    if cam['kind'] == 'plane':
        px = cam['xr'][0] + sx * (cam['xr'][1] - cam['xr'][0])
        py = cam['yr'][1] - sy * (cam['yr'][1] - cam['yr'][0])
        d = np.stack([px, py, np.zeros(n)], 1).astype(np.float32) - cam['eye']
    else:
        f = cam['target'] - cam['eye']
        f = f / np.linalg.norm(f)
        r = np.cross(f, np.array([0, 1, 0], np.float32))
        r /= np.linalg.norm(r)
        u = np.cross(r, f)
        a = H / W
        k = np.tan(cam['fov'])
        d = f[None] + r[None] * ((sx - .5) * 2 * k)[:, None] + u[None] * ((.5 - sy) * 2 * k * a)[:, None]
        d = d.astype(np.float32)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    return np.repeat(cam['eye'][None], n, 0).astype(np.float32), d


def trace(sc, o, d, rng, bounces=4):
    R = len(o)
    col = np.zeros((R, 3), dtype=np.float32)
    thr = np.ones((R, 3), dtype=np.float32)
    alive = np.arange(R)
    for depth in range(bounces + 1):
        t, m, n = sc.intersect(o, d)
        hit = m >= 0
        if not hit.any():
            break
        alive, o, d, t, m, n = alive[hit], o[hit], d[hit], t[hit], m[hit], n[hit]
        p = o + d * t[:, None]
        alb = sc.albedo(m, p, n)
        # Geölte Dielen spiegeln streifend
        is_floor = m == ID['boden']
        cosi = np.maximum(-(d * n).sum(1), 0)
        fres = np.where(is_floor, .05 + .55 * (1 - cosi) ** 5, 0)
        mirror = rng.random(len(p)) < fres
        L = sc.direct(p, n, alb, rng)
        L[mirror] = 0
        col[alive] += thr[alive] * L
        # Nächste Richtung: kosinusverteilt, Spiegelung für die Dielen
        u1, u2 = rng.random(len(p)).astype(np.float32), rng.random(len(p)).astype(np.float32)
        ph = 2 * np.pi * u1
        r = np.sqrt(u2)
        w = n
        a = np.where(np.abs(w[:, 0:1]) > .9, np.array([[0, 1, 0]], np.float32), np.array([[1, 0, 0]], np.float32))
        tv = np.cross(a, w)
        tv /= np.linalg.norm(tv, axis=1, keepdims=True)
        bv = np.cross(w, tv)
        nd = tv * (r * np.cos(ph))[:, None] + bv * (r * np.sin(ph))[:, None] + w * np.sqrt(np.maximum(1 - u2, 0))[:, None]
        if mirror.any():
            rf = d[mirror] - 2 * (d[mirror] * n[mirror]).sum(1, keepdims=True) * n[mirror]
            rf = rf + rng.normal(0, .012, rf.shape).astype(np.float32)
            nd[mirror] = rf / np.linalg.norm(rf, axis=1, keepdims=True)
        tint = np.where(mirror[:, None], 1, alb)
        thr[alive] = thr[alive] * tint
        o = p + n * 4e-4
        d = nd.astype(np.float32)
    return col


_scene = None


def _init(geo, oak):
    global _scene
    _scene = Scene(geo, oak)


def _row_block(args):
    y0, y1, W, H, spp, seed, view = args
    rng = np.random.default_rng(seed + y0)
    cam = camera(view)
    img = np.zeros((y1 - y0, W, 3), dtype=np.float32)
    ys, xs = np.mgrid[y0:y1, 0:W]
    xs, ys = xs.ravel(), ys.ravel()
    for _ in range(spp):
        o, d = primary(cam, xs, ys, W, H, rng)
        out = np.zeros((len(o), 3), dtype=np.float32)
        for s in range(0, len(o), 6000):
            out[s:s + 6000] = trace(_scene, o[s:s + 6000], d[s:s + 6000], rng)
        # Einzelne Ausreißer dämpfen
        out = np.minimum(out, 12)
        img += out.reshape(y1 - y0, W, 3)
    return y0, img / spp


def tonemap(hdr, exposure):
    x = hdr * exposure
    x = (x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14)  # ACES-Näherung
    x = np.clip(x, 0, 1)
    return np.where(x < .0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - .055)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('geo')
    ap.add_argument('oak')
    ap.add_argument('out')
    ap.add_argument('--view', default='front')
    ap.add_argument('--w', type=int, default=1000)
    ap.add_argument('--h', type=int, default=0)
    ap.add_argument('--spp', type=int, default=64)
    ap.add_argument('--exp', type=float, default=.62)
    ap.add_argument('--procs', type=int, default=10)
    a = ap.parse_args()
    geo = json.load(open(a.geo, encoding='utf-8'))
    cam = camera(a.view)
    H = a.h or (round(a.w * (cam['yr'][1] - cam['yr'][0]) / (cam['xr'][1] - cam['xr'][0])) if cam['kind'] == 'plane' else round(a.w * 1.25))
    step = 24
    jobs = [(y, min(y + step, H), a.w, H, a.spp, 1234, a.view) for y in range(0, H, step)]
    hdr = np.zeros((H, a.w, 3), dtype=np.float32)
    with mp.Pool(a.procs, initializer=_init, initargs=(geo, a.oak)) as pool:
        for y0, part in pool.imap_unordered(_row_block, jobs):
            hdr[y0:y0 + part.shape[0]] = part
    img = (tonemap(hdr, a.exp) * 255 + .5).astype(np.uint8)
    Image.fromarray(img).save(a.out, 'WEBP', quality=86, method=6)
    print('gerendert', a.out, a.w, H, 'spp', a.spp)
