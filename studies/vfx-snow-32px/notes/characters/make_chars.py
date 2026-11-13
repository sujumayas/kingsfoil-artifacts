"""Turn the SpriteFusion frames in this folder into the packed character data of the 32 px sandboxes.

    python studies/vfx-snow-32px/notes/characters/make_chars.py studies/vfx-snow-32px/notes/characters /tmp/out

writes chars.js (CH_BODY, CH_HANDS and CH_SETS, pasted into both sandbox.html files before `const N=BASE.length`,
with CH_SETS mapped through C()) and chars-preview.png (every set, direction and frame). Needs Pillow only."""
import sys, os, json, base64, colorsys
from PIL import Image, ImageChops

DL = sys.argv[1]; OUT = sys.argv[2]  # DL: this folder. OUT: where chars.js and the preview go
def frames(path):
    im = Image.open(path).convert('RGBA'); return [im.crop((k*32, 0, k*32+32, 32)) for k in range(im.width // 32)]

BODIES = {b: {d: (f'{DL}/{name}-{d}-walk.png', f'{DL}/{name}-{d}-idle.png') for d in 'SNE'} for b, name in (('p', 'adventurer'), ('v', 'villager'))}

def hls(c):
    h, l, s = colorsys.rgb_to_hls(c[0]/255, c[1]/255, c[2]/255); return h*360, l, s

# role classifiers: (name, max shades, predicate(hue, L, S, y))
ROLES = {
 'p': [('outline', 1, lambda h,l,s,y: l < 0.085),
       ('skin',    2, lambda h,l,s,y: 8 <= h <= 36 and l > 0.5),
       ('scarf',   2, lambda h,l,s,y: (h >= 335 or h <= 12) and s > 0.45 and 0.15 < l < 0.55),
       ('coat',    3, lambda h,l,s,y: 60 <= h <= 180),
       ('pants',   1, lambda h,l,s,y: 190 <= h <= 270 and l < 0.3),
       ('hair',    3, lambda h,l,s,y: y < 14),
       ('leather', 2, lambda h,l,s,y: True)],
 'v': [('outline', 1, lambda h,l,s,y: l < 0.085),
       ('shawl',   2, lambda h,l,s,y: 290 <= h <= 350 and l < 0.3),
       ('skin',    2, lambda h,l,s,y: (0 <= h <= 36 or h >= 350) and l > 0.52 and s > 0.35),
       ('hair',    2, lambda h,l,s,y: s < 0.12 and 0.35 < l < 0.8),
       ('apron',   2, lambda h,l,s,y: l > 0.58),
       ('dress',   3, lambda h,l,s,y: 34 <= h <= 50 and s > 0.6),
       ('hat',     2, lambda h,l,s,y: y < 17),
       ('leather', 1, lambda h,l,s,y: True)]}

def role_of(body, c, y):
    h, l, s = hls(c)
    for name, k, pred in ROLES[body]:
        if pred(h, l, s, y): return name
    return 'leather'

def kmeans(pixels, k, iters=30):
    pts = sorted(set(pixels), key=lambda c: sum(c))
    if len(pts) <= k: return pts
    if k == 1: return [tuple(sum(c[t] for c in pixels)//len(pixels) for t in range(3))]
    cents = [pts[int(i * (len(pts) - 1) / (k - 1))] for i in range(k)]
    for _ in range(iters):
        groups = [[] for _ in cents]
        for c in pixels:
            j = min(range(k), key=lambda j: sum((c[t]-cents[j][t])**2 for t in range(3))); groups[j].append(c)
        new = [tuple(sum(g[t] for g in grp)//len(grp) for t in range(3)) if grp else cents[j] for j, grp in enumerate(groups)]
        if new == cents: break
        cents = new
    return sorted(cents, key=lambda c: sum(c))

def order_frames(fs):
    """contacts at 0 and 2: the two most different frames; the passing poses fill 1 and 3 so the loop is smooth"""
    d = [[sum(1 for p in ImageChops.difference(fs[i], fs[j]).getdata() if any(p)) for j in range(4)] for i in range(4)]
    a, b = max(((i, j) for i in range(4) for j in range(i+1, 4)), key=lambda ij: d[ij[0]][ij[1]])
    c, e = [i for i in range(4) if i not in (a, b)]
    cands = [[a, c, b, e], [a, e, b, c]]
    best = min(cands, key=lambda o: sum(d[o[i]][o[(i+1) % 4]] for i in range(4)))
    return [fs[i] for i in best], best

bodies_out = []
for body, dirs in BODIES.items():
    frameset = []  # 15 frames of 32x32 RGBA in engine order S,N,E x (4 walk + idle)
    for d in ('S', 'N', 'E'):
        walk, idle = dirs[d]
        fs, order = order_frames(frames(walk)); print(body, d, 'frame order', order)
        frameset += fs + frames(idle)[:1]
    # classify every opaque pixel, then pick shades per role
    byrole = {}
    for f in frameset:
        for y in range(32):
            for x in range(32):
                p = f.getpixel((x, y))
                if p[3] > 127: byrole.setdefault(role_of(body, p[:3], y), []).append(p[:3])
    palette = []  # (role, rgb)
    shades = {}
    for name, k, _ in ROLES[body]:
        if name not in byrole: continue
        cs = kmeans(byrole[name], k); shades[name] = cs
        for c in cs: palette.append((name, c))
    print(body, 'slots', len(palette), {n: len(c) for n, c in shades.items()})
    assert len(palette) <= 15
    slot_of = {}
    def slot(role, c):
        key = (role, c)
        if key not in slot_of:
            cs = shades[role]; best = min(cs, key=lambda q: sum((q[t]-c[t])**2 for t in range(3)))
            slot_of[key] = palette.index((role, best)) + 1
        return slot_of[key]
    # 24x32 crops (columns 4..27), nibble packed
    data = bytearray(); hands = []
    for fi, f in enumerate(frameset):
        px = []
        for y in range(32):
            for x in range(4, 28):
                p = f.getpixel((x, y))
                px.append(slot(role_of(body, p[:3], y), p[:3]) if p[3] > 127 else 0)
        for i in range(0, 768, 2): data.append(px[i] << 4 | px[i+1])
        if fi % 5 == 4:  # idle frame: hand anchors = centroid of hand pixels in rows 15..25, left and right halves
            hand_role = 'leather' if body == 'p' else 'skin'
            L = [(x, y) for y in range(15 if body == 'p' else 17, 26) for x in range(24) if px[y*24+x] and palette[px[y*24+x]-1][0] == hand_role and x < 12]
            R = [(x, y) for y in range(15 if body == 'p' else 17, 26) for x in range(24) if px[y*24+x] and palette[px[y*24+x]-1][0] == hand_role and x >= 12]
            cen = lambda P, dflt: [round(sum(p[0] for p in P)/len(P), 1), round(sum(p[1] for p in P)/len(P), 1)] if P else dflt
            hands.append([cen(L, [5, 22]), cen(R, [18, 22])])
    bodies_out.append({'id': body, 'palette': palette, 'data': base64.b64encode(bytes(data)).decode(), 'hands': hands, 'frames': frameset})
    print(body, 'hands S,N,E', hands)

# colour sets: 0 player, 1 villager, then crowd recolours by role
def recolor(c, rule):
    h, l, s = hls(c)
    if 'hue' in rule: h = rule['hue']
    if 'rot' in rule: h = (h + rule['rot']) % 360
    s = min(1, max(0, s * rule.get('sat', 1))); l = min(0.97, max(0.03, l * rule.get('lum', 1) + rule.get('dl', 0)))
    r, g, b = colorsys.hls_to_rgb(h/360, l, s); return (int(r*255+.5), int(g*255+.5), int(b*255+.5))
SETS = [
  ('p', {}), ('v', {}),
  ('p', {'coat': {'hue': 215, 'sat': 1.1}, 'scarf': {'hue': 46, 'sat': 1.2, 'dl': .08}, 'hair': {'lum': .55}}),
  ('v', {'dress': {'hue': 172, 'sat': .55}, 'shawl': {'hue': 358, 'sat': .9, 'dl': .08}, 'apron': {'sat': .2, 'dl': .04}, 'hat': {'hue': 30, 'lum': .75}}),
  ('p', {'coat': {'hue': 272, 'sat': .45, 'dl': .03}, 'scarf': {'sat': .15, 'lum': 1.0, 'dl': .4}, 'hair': {'hue': 42, 'sat': .9, 'dl': .24}}),
  ('v', {'dress': {'hue': 218, 'sat': .6}, 'shawl': {'hue': 125, 'sat': .5, 'dl': .06}, 'hair': {'dl': .18}, 'hat': {'hue': 20, 'lum': .6, 'sat': .5}}),
  ('p', {'coat': {'hue': 18, 'sat': .9, 'dl': .02}, 'scarf': {'hue': 140, 'sat': .5, 'lum': .8}, 'hair': {'hue': 2, 'sat': .55, 'lum': .85}})]
sets_js = []
for body, rules in SETS:
    B = next(b for b in bodies_out if b['id'] == body); bi = bodies_out.index(B)
    cols = []
    for role, c in B['palette']:
        cc = recolor(c, rules[role]) if role in rules else c
        cols.append('OUTL' if role == 'outline' else "'#%02x%02x%02x'" % cc)
    sets_js.append('[%d,[%s]]' % (bi, ','.join(cols)))

js = ("// SpriteFusion characters: 2 bodies x 3 directions (S, N, E; W is E flipped) x 5 frames (4 walk + idle), 24x32, 4 bits per pixel.\n"
      "// A set is a body plus its colours; sets 2..6 recolour the coat, scarf, dress, shawl and hair of the two bodies for the crowd.\n"
      "const CH_BODY=[" + ','.join("'%s'" % b['data'] for b in bodies_out) + "];\n"
      "const CH_HANDS=" + json.dumps([b['hands'] for b in bodies_out], separators=(',', ':')) + "; // per body and direction: [left hand, right hand] of the idle frame\n"
      "const CH_SETS=[" + ','.join(sets_js) + "];\n")
open(f'{OUT}/chars.js', 'w').write(js)
print('chars.js', len(js), 'bytes')

# preview: every set, every direction, every frame, at 6x
S = 6; nsets = len(SETS)
sheet = Image.new('RGBA', (15 * 26 * S, nsets * 34 * S), (90, 110, 90, 255))
for si, (body, rules) in enumerate(SETS):
    B = next(b for b in bodies_out if b['id'] == body); raw = base64.b64decode(B['data'])
    cols = []
    for role, c in B['palette']:
        cols.append((26, 20, 32) if role == 'outline' else (recolor(c, rules[role]) if role in rules else c))
    for fi in range(15):
        im = Image.new('RGBA', (24, 32), (0, 0, 0, 0))
        for i in range(768):
            b = raw[fi * 384 + i // 2]; v = (b >> 4) if i % 2 == 0 else (b & 15)
            if v: im.putpixel((i % 24, i // 24), cols[v-1] + (255,))
        big = im.resize((24 * S, 32 * S), Image.NEAREST); sheet.paste(big, (fi * 26 * S + S, si * 34 * S + S), big)
sheet.save(f'{OUT}/chars-preview.png')
