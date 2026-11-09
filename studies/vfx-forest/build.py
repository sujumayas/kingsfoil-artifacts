#!/usr/bin/env python3
"""Build the single-file forest study page (#4) from the markdown report + style.css + hero.html + figs.html + demos JS.
Recipe for studykit; run via `python -m studykit build vfx-forest` (rain study, #3)."""
import re, json, html, sys, pathlib
from markdown_it import MarkdownIt

import sys, pathlib as _pl
sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[2]))  # repo root, for studykit
import studykit
S_ = studykit.ctx(__file__)
B = S_.dir
SRC = S_.report_text
OUT = S_.out_path
SBX = S_.sandbox_name

md = MarkdownIt('commonmark', {'html': True}).enable('table')
URL_RE = re.compile(r'https?://[^\s<>"\')`]+')

# ---------------------------------------------------------------- helpers
def split_code(h):
    parts = re.split(r'(<pre[\s\S]*?</pre>|<code[\s\S]*?</code>|<a [\s\S]*?</a>)', h)
    for i, p in enumerate(parts):
        yield (i % 2 == 1), p

TAGCLS = {'V': 'tv', 'I': 'ti', 'U': 'tu', 'K': 'tk'}
TAGTITLE = {'V': 'Verified in a source our researchers read', 'I': 'Author inference or design proposal',
            'U': 'Unverified lead', 'K': 'Textbook or canonical-paper knowledge'}
CITE_RE = re.compile(r'\[([^\[\]<>]{1,90})\]')
LEAD_RE = re.compile(r'^\s*((?:V|I|U|K)(?:-secondary)?(?:/(?:V|I|U|K))?)(?=[\s,;]|$)')

def sref(t):
    return re.sub(r'\bS(\d{1,3})\b', lambda m: f'<a class="sref" href="#s{m.group(1)}">S{m.group(1)}</a>', t)

def cite_repl(m):
    inner = m.group(1)
    if not (LEAD_RE.match(inner) or re.match(r'^S\d', inner)):
        return m.group(0)
    out = []
    for s in inner.split(';'):
        lm = LEAD_RE.match(s)
        if lm:
            tag = lm.group(1)
            rest = s[lm.end():].lstrip(' ,')
            k = tag[0]
            label = tag.replace('-secondary', '·2')
            title = TAGTITLE[k] + (' (via a secondary source)' if 'secondary' in tag else '')
            piece = f'<b class="tag {TAGCLS[k]}" title="{title}">{label}</b>'
            if rest:
                piece += ' ' + sref(rest)
            out.append(piece)
        else:
            out.append(sref(s.strip()))
    return '<span class="cite">' + '<i>;</i> '.join(out) + '</span>'

def tagify(h):
    return ''.join(p if c else CITE_RE.sub(cite_repl, p) for c, p in split_code(h))

def see_link(u, label='See it in action ↗'):
    u = u.rstrip('.,;')
    return f'<a class="see" href="{html.escape(u)}" target="_blank" rel="noopener">{label}</a>'

def short(u):
    u = u.rstrip('.,;')
    d = re.sub(r'^https?://(www\.)?', '', u).split('/')[0]
    return d + ' ↗'

def linkify_games(h):
    def fix(p):
        return re.sub(r'(:\s*)?(https?://[^\s<>"\')]+)', lambda m: (' ' if m.group(1) else '') + see_link(m.group(2)), p)
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def linkify_plain(h, label=None):
    def fix(p):
        return URL_RE.sub(lambda m: see_link(m.group(0), label or short(m.group(0))), p)
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def hl_code(h):
    def one(m):
        lang = m.group(1) or ''
        res = []
        for ln in m.group(2).split('\n'):
            ci = ln.find('//')
            if ln.lstrip().startswith('# ') or (lang == 'gdscript' and '  # ' in ln):
                hi = ln.find('# ')
                ci = hi if ci < 0 else min(ci, hi)
            if ci >= 0:
                ln = ln[:ci] + '<span class="cm">' + ln[ci:] + '</span>'
            res.append(ln)
        cls = f' data-lang="{lang}"' if lang else ' data-lang="pseudocode"'
        return f'<pre class="code"{cls}><code>' + '\n'.join(res) + '</code></pre>'
    return re.sub(r'<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)</code></pre>', one, h)

def sbx_links(h):
    return h.replace(f'<code>{SBX}</code>', f'<a class="sbx" href="{SBX}"><code>{SBX}</code></a>')

def render(text, games=False):
    h = md.render(text)
    h = hl_code(h)
    h = tagify(h)
    h = linkify_games(h) if games else linkify_plain(h)
    h = h.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')
    return sbx_links(h)

def inline(text):
    h = md.renderInline(text)
    return sbx_links(linkify_plain(tagify(h)))

def cells(line):
    return [x.strip() for x in line.strip().strip('|').split(' | ')]

# ---------------------------------------------------------------- split report
sections, order, cur = {}, [], None
for line in SRC.split('\n'):
    m = re.match(r'^## (.+)$', line)
    if m:
        cur = m.group(1).strip(); order.append(cur); sections[cur] = []; continue
    if cur:
        sections[cur].append(line)
sec = {k: '\n'.join(v).strip().rstrip('-').strip() for k, v in sections.items()}
def S(prefix):
    for k in order:
        if k.startswith(prefix):
            return k, sec[k]
    raise KeyError(prefix)

# ---------------------------------------------------------------- technique profiles
_, tech = S('4.')
fam_blocks = re.split(r'^### (Family [A-G]: .+)$', tech, flags=re.M)
families = []
for i in range(1, len(fam_blocks), 2):
    fname, body = fam_blocks[i], fam_blocks[i + 1]
    profs = re.split(r'^### ([A-G]\d)\. (.+)$', body, flags=re.M)
    plist = []
    for j in range(1, len(profs), 3):
        pid, ptitle, ptext = profs[j], profs[j + 1], profs[j + 2].strip().rstrip('-').strip()
        keys = [('plain', r'\*In plain words\.\*'), ('tech', r'\*How it works \(technical\)\.\*'),
                ('cost', r'\*Cost / performance\.\*'), ('games', r'\*Games that used it\.\*'),
                ('feel', r'\*How it feels\.\*'), ('risks', r'\*Risks\.\*'), ('ratings', r'\*Ratings 1–5 \(author judgement\):\*')]
        pos = []
        for k, rx in keys:
            mm = re.search(r'^' + rx, ptext, flags=re.M)
            if not mm:
                print('missing', pid, k, file=sys.stderr); continue
            pos.append((mm.start(), mm.end(), k))
        pos.sort()
        fields = {}
        for n, (a, e, k) in enumerate(pos):
            end = pos[n + 1][0] if n + 1 < len(pos) else len(ptext)
            fields[k] = ptext[e:end].strip()
        rat = [int(x) for x in re.findall(r'(\d)', fields['ratings'])][:5]
        plist.append({'id': pid, 'title': ptitle, 'f': fields, 'r': rat})
    families.append((fname, plist))
intro_fam = tech.split('### Family A')[0].strip()
NPROF = sum(len(p) for _, p in families)
assert NPROF == 32, [len(p) for _, p in families]

# scorecard
_, score = S('5.')
rows = []
for line in score.split('\n'):
    m = re.match(r'^\| ([A-G]\d) \| (.+?) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d+) \|$', line)
    if m:
        rows.append({'id': m.group(1), 'name': m.group(2), 'r': [int(m.group(k)) for k in range(3, 8)], 'sum': int(m.group(8))})
assert len(rows) == 32, len(rows)
score_intro = score.split('|')[0].strip()
score_read = score[score.rfind('|') + 1:].strip()
tmap = {r['id']: r for r in rows}
for fname, pl in families:
    for p in pl:
        assert tmap[p['id']]['r'] == p['r'], p['id']
        assert sum(p['r']) == tmap[p['id']]['sum'], p['id']

FIGS = {}
for m in re.finditer(r'<!--FIG (\w+)-->([\s\S]*?)<!--/FIG-->', ''.join(p.read_text() for p in sorted(B.glob('figs*.html')))):
    FIGS[m.group(1)] = tagify(m.group(2).strip())

AFTER_PROFILE = {
    'A3': ['layers'], 'A4': ['treebuild'], 'B1': ['biome'], 'B2': ['groves'], 'B3': ['poisson'], 'B4': ['edges'], 'B5': ['growth'],
    'C1': ['lut'], 'C2': ['colormap'], 'C3': ['pheno'], 'C4': ['winter'], 'D2': ['sway'], 'D3': ['ferrari'],
    'E1': ['fade'], 'E5': ['shade'], 'E6': ['touch'], 'F1': ['flee'], 'G2': ['atlas'], 'G5': ['chunks'],
}
FIELD_LABEL = [('plain', 'In plain words'), ('tech', 'How it works (technical)'), ('cost', 'Cost / performance'),
               ('games', 'Games that used it'), ('feel', 'How it feels'), ('risks', 'Risks')]
RLAB = ['Simplicity', 'Speed', 'Pixel taste', 'Aliveness', 'Variety']

def bars(r):
    out = ['<span class="rbars" aria-label="Ratings: ' + ', '.join(f'{RLAB[i]} {v}' for i, v in enumerate(r)) + '">']
    for i, v in enumerate(r):
        out.append(f'<span class="rb" title="{RLAB[i]} {v}/5"><span style="--v:{v}"></span></span>')
    out.append('</span>')
    return ''.join(out)

USED = []
def fig(name):
    if name not in FIGS:
        print('missing fig', name, file=sys.stderr); return ''
    USED.append(name)
    return FIGS[name]

def profile_html(p):
    f = p['f']
    parts = [f'<details class="tp" id="t-{p["id"].lower()}">',
             f'<summary><span class="tp-id">{p["id"]}</span><span class="tp-t">{inline(p["title"])}</span>'
             f'{bars(p["r"])}<span class="tp-sum" title="Sum of the five ratings">{sum(p["r"])}</span></summary>',
             '<div class="tp-body">']
    for k, lab in FIELD_LABEL:
        if k not in f:
            continue
        parts.append(f'<section class="tp-f tp-{k}"><h4>{lab}</h4>{render(f[k], games=(k == "games"))}</section>')
    parts.append('<section class="tp-f tp-ratings"><h4>Ratings (author judgement, 1–5)</h4><ul class="rlist">')
    for i, v in enumerate(p['r']):
        parts.append(f'<li><span>{RLAB[i]}</span><span class="rbar"><span style="--v:{v}"></span></span><b>{v}</b></li>')
    parts.append('</ul></section></div></details>')
    return ''.join(parts) + ''.join(fig(n) for n in AFTER_PROFILE.get(p['id'], []))

# ---------------------------------------------------------------- timeline data
_, tl = S('3.')
gens = []
gparts = re.split(r'^\*\*(Gen \d): (.+?)\*\*\s*$', tl, flags=re.M)
MON = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11}
for i in range(1, len(gparts), 3):
    gid, gtitle, gbody = gparts[i], gparts[i + 1].rstrip('.'), gparts[i + 2]
    ev = []
    for line in gbody.split('\n'):
        if not line.startswith('- '):
            continue
        txt = line[2:].strip()
        segs = re.split(r'\*\*([^*]+?):\*\*', txt)
        for k in range(1, len(segs), 2):
            head, body = segs[k].strip(), segs[k + 1].strip().rstrip(';').strip()
            yrs = re.findall(r'\b(1[89]\d\d|20[0-2]\d)\b', head)
            yr = int(yrs[0]) if yrs else None
            mo = 0
            mm = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\b', head)
            if mm and yr:
                mo = MON[mm.group(1)[:3]] + .5
            h = tagify(md.renderInline(f'**{head}:** {body}'))
            ev.append({'y': yr, 'm': mo, 'h': h})
    gens.append({'id': gid, 't': gtitle.strip(), 'ev': ev})
assert len(gens) == 4, len(gens)

# ---------------------------------------------------------------- gems table
_, gem = S('9.')
lines = gem.split('\n')
ti = next(i for i, l in enumerate(lines) if l.startswith('| Name |'))
gem_rows = []
j = ti + 2
while j < len(lines) and lines[j].startswith('|'):
    gem_rows.append(cells(lines[j])); j += 1
gem_intro = '\n'.join(lines[:ti]).strip()
gem_after = '\n'.join(lines[j:]).strip()
gem_check = gem_intro.split('**Flags:**')[0].strip()
flag_lines = re.findall(r'\*\*(.+?)\*\* = ([^;.]+)', gem_intro.split('**Flags:**')[1])
LV = {'Low': 'ok', 'Attrib.': 'mid', 'SA': 'mid', 'Copyleft': 'hi', '?': 'unk'}

def flag_level(flag):
    m = re.match(r'^(Low|Attrib\.|SA|Copyleft|\?)', flag)
    f = m.group(1) if m else flag
    rest = flag[m.end():].strip() if m else ''
    return LV.get(f, 'unk'), f, rest

def gem_table():
    o = ['<p class="lic-h"><strong>Licence flags</strong> (badge colours: green permissive, amber credit or share-alike, red copyleft, violet not stated)</p><div class="lic-key">'
         + ''.join(f'<span class="lk"><span class="lic {LV.get(f, "unk")}">{html.escape(f)}</span> {inline(t)}</span>' for f, t in flag_lines) + '</div>',
         '<div class="tbl"><table class="gems"><thead><tr><th>Name</th><th>Flag</th><th>Licence</th><th>Maturity</th><th>Good for</th></tr></thead><tbody>']
    for name, url, lic, mat, good, flag in gem_rows:
        lv, lab, rest = flag_level(flag)
        urls = [u.strip() for u in url.split(';')]
        nm = f'<a href="{html.escape(urls[0])}" target="_blank" rel="noopener">{inline(name)} ↗</a>'
        if len(urls) > 1:
            nm += ' ' + ' '.join(f'<a href="{html.escape(u)}" target="_blank" rel="noopener" class="mute">{html.escape(short(u))}</a>' for u in urls[1:])
        o.append(f'<tr><td>{nm}</td><td><span class="lic {lv}" title="Licence flag: {html.escape(lab)}">{html.escape(lab)}</span>'
                 + (f' <small>{inline(rest)}</small>' if rest else '') + f'</td><td>{inline(lic)}</td><td>{inline(mat)}</td><td>{inline(good)}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- see-it index
_, idx = S('11.')
idx_rows = []
for line in idx.split('\n'):
    m = re.match(r'^\| (\d+) \| (.+?) \| (.*?) \| (.+?) \| (.+?) \|$', line)
    if m:
        idx_rows.append(m.groups())
assert len(idx_rows) == 47, len(idx_rows)
idx_after = idx[idx.rfind('|') + 1:].strip()
CHIPS = [('pokémon', 'Pokémon'), ('stardew', 'Stardew'), ("don't starve", "Don't Starve"), ('bird|boids|flock|bat', 'birds and flocks'),
         ('season|palette|colormap|fall|colour', 'seasons and colour'), ('overlay|cutaway|obscured|metatiles|priority|offsets', 'occlusion'),
         ('shake|tiers|resources|regrowth|trampled|harvest', 'resources and touch'), ('draw calls|biome|noise|stages|spacing', 'generation and performance'),
         ('dweet|pico-8|char', 'tiny code')]

def idx_table():
    o = ['<div class="idx-tools"><label class="search"><span>Filter</span><input id="idxq" type="search" placeholder="Type a game or effect, e.g. shake" aria-describedby="idxn"></label><span id="idxn" class="mute" aria-live="polite"></span></div>',
         '<div class="chips" data-idx role="group" aria-label="Quick filters">' + ''.join(f'<button type="button" data-q="{html.escape(q)}">{lab}</button>' for q, lab in CHIPS) + '</div>',
         '<div class="tbl"><table class="idx" id="idxt"><thead><tr><th>#</th><th>Game / production</th><th>Year</th><th>What to look at</th><th>Link</th></tr></thead><tbody>']
    for n, game, yr, what, link in idx_rows:
        lk = see_link(link) if link.startswith('http') else f'<a class="see" href="{SBX}">Play the Forest Sandbox ↗</a>'
        o.append(f'<tr><td>{n}</td><td>{inline(game)}</td><td>{html.escape(yr)}</td><td>{inline(what)}</td><td>{lk}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o) + render(idx_after)

# ---------------------------------------------------------------- sources
_, srcs = S('14.')
src_html = []
src_intro = srcs.split('**')[0].strip()
sp_ = re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)
NSRC = 0
for i in range(1, len(sp_), 2):
    group = sp_[i]
    items = []
    for l in [l for l in sp_[i + 1].split('\n') if re.match(r'^\d+\. ', l)]:
        n, rest = re.match(r'^(\d+)\. (.+)$', l).groups()
        NSRC += 1
        urls = URL_RE.findall(rest)
        first = rest.find('http')
        title = rest[:first].rstrip(': ').rstrip() if first >= 0 else rest
        links, extra_h = [], ''
        if urls:
            for u in urls:
                links.append(f'<a href="{html.escape(u.rstrip(".,;"))}" target="_blank" rel="noopener">{html.escape(short(u))}</a>')
            extra = re.sub(r'[\s;:()]+', ' ', URL_RE.sub('', rest[first:])).strip()
            extra_h = f' <span class="mute">({html.escape(extra)})</span>' if extra else ''
        series = {'2': 'vfx-snow-topdown-pixel.html', '3': 'vfx-acid-topdown-pixel.html', '4': 'vfx-rain-topdown-pixel.html'}
        if n in series:
            links.append(f'<a href="{series[n]}">{series[n]}</a>')
        if n == '5':
            title = 'Kingsfoil, Forest Sandbox (companion page to this study)'
            links.append(f'<a href="{SBX}">{SBX} ↗</a>')
        items.append(f'<li id="s{n}" value="{n}"><span class="sn">S{n}</span> {md.renderInline(title)} {" · ".join(links)}{extra_h}</li>')
    src_html.append(f'<h3>{html.escape(group)}</h3><ol class="src">' + ''.join(items) + '</ol>')
assert NSRC == 236, NSRC

# ---------------------------------------------------------------- body sections
_, ctx = S('Context')
_, summ = S('1.')
_, readm = S('2.')
_, deep = S('6.')
_, arch = S('7.')
_, sbx = S('8.')
_, learn = S('10.')
_, unv = S('12.')
_, road = S('13.')

cut = ctx.find('A forest is the opposite of weather')
assert cut > 0
ctx_html = render(ctx[:cut]) + fig('doom') + render(ctx[cut:])

def grab_table(text, head):
    m = re.search(r'^' + re.escape(head) + r'.*\n(?:\|.*\n?)+', text, flags=re.M)
    return m.group(0)

t6a = grab_table(deep, '| Forest type |')
t6b = grab_table(deep, '| Species |')
t6c = grab_table(deep, '| Game type |')
BIO_IDX = {'Boreal / taiga': 0, 'Mixed': 1, 'Birch grove': 2, 'Temperate deciduous': 3, 'Open oak woodland': 4, 'Tropical rainforest': 5, 'Savanna': 6, 'Dead / burnt': -1}
types = []
for line in t6a.strip().split('\n')[2:]:
    c = cells(line)
    nm = re.sub(r'\*\*', '', c[0])
    types.append({'n': nm, 'b': BIO_IDX[nm], 'c': [inline(x) for x in c[1:]]})
assert len(types) == 8
spec_rows = []
for line in t6b.strip().split('\n')[2:]:
    c = cells(line)
    nm = re.sub(r'\*\*', '', c[0])
    spec_rows.append({'n': nm, 'c': [inline(x) for x in c[1:]]})
assert len(spec_rows) == 12 and [s['n'] for s in spec_rows] == ['Oak', 'Maple', 'Birch', 'Cherry', 'Pine', 'Spruce', 'Palm', 'Kapok', 'Acacia', 'Snag', 'Shrub', 'Fern']
decide = []
for line in t6c.strip().split('\n')[2:]:
    c = cells(line)
    decide.append([inline(x) for x in c])
assert len(decide) == 6
deep = deep.replace(t6a, '@@FIG:types@@\n\n').replace(t6b, '@@FIG:species@@\n\n').replace(t6c, '@@FIG:decide@@\n\n')
deep = deep.replace('### 6e.', '@@FIG:boids@@\n\n### 6e.')
deep = deep.replace('The Canvas 2D Sandbox rendered frames', '@@FIG:budget@@\n\nThe Canvas 2D Sandbox rendered frames')
deep_html = render(deep)

# architecture: the layer table becomes the clickable stack
tarch = grab_table(arch, '| # | Layer |')
layers = [cells(l) for l in tarch.strip().split('\n')[2:]]
assert len(layers) == 8
arch = arch.replace(tarch, '@@FIG:stack@@\n\n')
net = re.search(r'\*\*Network\*\* \[I\]:\n((?:- .*\n)+)', arch).group(1)
def stack_fig():
    o = ['<figure class="fig" data-demo="stack" id="fig-stack"><div class="fig-h"><span class="fig-n">Fig. @N</span><h4 class="fig-t">The layered forest, from server deltas to pixels</h4><span class="illu">Design proposal [I]</span></div>',
         '<div class="stack"><div class="layers">',
         '<button type="button" class="layer srv" data-l="L-0"><b>0</b><span>Server: seed + per-chunk delta lists<small>never sends a forest; only changes travel</small></span></button>',
         '<div class="layer-arrow">▼ seed, season_t, {treeIndex, state, changedAt}</div>']
    tpl = ['<template id="L-0"><h4>Server</h4>' + render('**Network** [I]:\n' + net) + '</template>']
    for n, lay, node, cont, upd in layers:
        o.append(f'<button type="button" class="layer" data-l="L-{n}"><b>{n}</b><span>{inline(lay)}<small>{inline(node)}</small></span></button>')
        tpl.append(f'<template id="L-{n}"><h4>{n} · {inline(lay)}</h4><ul><li><b>Godot node:</b> {inline(node)}</li><li><b>Content:</b> {inline(cont)}</li><li><b>Update:</b> {inline(upd)}</li></ul></template>')
    o.append('</div><div class="ldet" aria-live="polite"></div></div>' + ''.join(tpl))
    o.append('<figcaption>Click a layer to see what it holds (the rows of the table in §7, plus the network rules as layer 0). Everything here is the study\'s design proposal; none of it has been tested in Godot yet <span class="cite"><b class="tag ti">I</b></span>.</figcaption></figure>')
    return ''.join(o)
FIGS['stack'] = stack_fig()
arch_html = render(arch)
sbx_html = render(sbx)

def figs_in(h):
    return re.sub(r'<p>@@FIG:(\w+)@@</p>', lambda m: fig(m.group(1)), h)

legend_rows = []
for line in readm.split('\n'):
    m = re.match(r'^\| \*\*\[(\w)\]\*\* \| (.+) \|$', line)
    if m:
        legend_rows.append(m.groups())
read_bullets = '\n'.join(l for l in readm.split('\n') if l.startswith('- '))

def legend():
    names = {'V': 'Verified', 'I': 'Inference', 'U': 'Unverified', 'K': 'Known'}
    o = ['<div class="legend">']
    for k, txt in legend_rows:
        o.append(f'<div class="lg"><b class="tag {TAGCLS[k]} big">{k}</b><div><h4>{names[k]}</h4><p>{inline(txt)}</p></div></div>')
    o.append('</div>')
    return ''.join(o)

# ---------------------------------------------------------------- TOC
TOC = [('context', 'A forest after the DOOM fire'), ('summary', 'Executive summary'), ('how-to-read', 'How to read this study'),
       ('timeline', 'Timeline'), ('techniques', 'Technique profiles'), ('scorecard', 'Scorecard'),
       ('deep-dives', 'Deep dives'), ('architecture', 'Layered architecture'), ('sandbox', 'Reference implementation'),
       ('gems', 'Gem findings'), ('learnings', 'Learnings and anti-patterns'), ('see-it', 'See it in action index'),
       ('unverified', 'What remains unverified'), ('roadmap', 'Prototype roadmap'), ('sources', 'Sources')]
FAMSUB = [('fam-a', 'A · Roots of tree drawing'), ('fam-b', 'B · Forest composition'), ('fam-c', 'C · Seasons and colour'), ('fam-d', 'D · Wind and life'),
          ('fam-e', 'E · Interaction'), ('fam-f', 'F · Birds'), ('fam-g', 'G · Performance')]
DEEPSUB = [('dd-types', '6a · Forest types'), ('dd-species', '6b · Species sheet'), ('dd-interact', '6c · Interaction'), ('dd-birds', '6d · Birds'), ('dd-budget', '6e · Budget')]
SERIES = S_.series_nav('bar')  # generated from site/catalog.json

def toc_html():
    o = ['<nav class="toc" id="toc" aria-label="Contents"><div class="toc-in">',
         '<a class="toc-home" href="index.html">Kingsfoil artifacts</a>', SERIES,
         f'<a class="btn warm toc-play top" href="{SBX}">Play the Forest Sandbox ↗</a>',
         '<p class="toc-h">Contents</p><ol>']
    for a, t in TOC:
        o.append(f'<li><a href="#{a}" data-sec="{a}">{t}</a>')
        if a == 'techniques':
            o.append('<ol class="sub">' + ''.join(f'<li><a href="#{x}" data-sec="{x}">{y}</a></li>' for x, y in FAMSUB) + '</ol>')
        if a == 'deep-dives':
            o.append('<ol class="sub">' + ''.join(f'<li><a href="#{x}" data-sec="{x}">{y}</a></li>' for x, y in DEEPSUB) + '</ol>')
        o.append('</li>')
    o.append('</ol>')
    o.append('<button class="btn ghost" id="motionBtn" type="button" aria-pressed="false">Pause animations</button>')
    o.append('</div></nav>')
    return ''.join(o)

# ---------------------------------------------------------------- assemble
def section(id_, title, inner, num=None):
    n = f'<span class="secn">{num}</span>' if num else ''
    return f'<section class="sec" id="{id_}"><h2>{n}{html.escape(title)}</h2>{inner}</section>'

fam_ids = [x for x, _ in FAMSUB]
tech_html = [render(intro_fam.replace('There are seven families:', 'There are seven families. Open any card for the full profile; the figure after a card lets you play with its algorithm.')),
             '<div class="tp-tools"><button class="btn ghost" type="button" data-openall>Open all 32 profiles</button><button class="btn ghost" type="button" data-closeall>Close all</button></div>']
for (fname, pl), fid in zip(families, fam_ids):
    tech_html.append(f'<div class="fam" id="{fid}"><h3 class="famh"><span>{fname.split(":")[0].replace("Family ", "")}</span>{html.escape(fname.split(": ", 1)[1])}</h3>')
    for p in pl:
        tech_html.append(profile_html(p))
    tech_html.append('</div>')

score_html = render(score_intro) + fig('score') + render(score_read)

title = 'Top-down pixel forests: tiny algorithms for thousands of living trees'
data_js = ('const SCORE=' + json.dumps(rows, ensure_ascii=False) + ';\nconst GENS=' + json.dumps(gens, ensure_ascii=False) +
           ';\nconst TYPES=' + json.dumps(types, ensure_ascii=False) + ';\nconst SPECROWS=' + json.dumps(spec_rows, ensure_ascii=False) +
           ';\nconst DECIDE=' + json.dumps(decide, ensure_ascii=False) + ';\n')

hero = (B / 'hero.html').read_text().replace('@@SERIES@@', SERIES)
css = (B / 'style.css').read_text() + '\n' + (B / 'forest.css').read_text()
JSF = ['core.js'] + sorted(p.name for p in B.glob('demos*.js'))
js = ''.join((B / f).read_text() + '\n' for f in JSF)

deep_html = figs_in(deep_html)
for hid, sid in [('6a', 'dd-types'), ('6b', 'dd-species'), ('6c', 'dd-interact'), ('6d', 'dd-birds'), ('6e', 'dd-budget')]:
    deep_html = re.sub(r'<h3>' + hid + r'\.', f'<h3 id="{sid}">{hid}.', deep_html, count=1)

body = [hero, '<div class="layout">' + toc_html() + '<main id="main">']
body.append(section('context', 'A forest, after the DOOM fire', ctx_html))
body.append(section('summary', 'Executive summary', '<div class="exec">' + render(summ) + '</div>', '1'))
body.append(section('how-to-read', 'How to read this study', legend() + render(read_bullets), '2'))
body.append(section('timeline', 'Generations: a timeline', fig('timeline'), '3'))
body.append(section('techniques', 'Technique profiles', ''.join(tech_html), '4'))
body.append(section('scorecard', 'Comparison scorecard', score_html, '5'))
body.append(section('deep-dives', 'Deep dives', deep_html, '6'))
body.append(section('architecture', 'Combinations: a layered architecture for Asterion Online (Godot 4, web)', figs_in(arch_html), '7'))
sbx_cta = ('<div class="cta"><div><p class="cta-t">The Forest Sandbox is the playable version of this study.</p>'
           '<p class="mute">Walk a 1280×960 px world of seven forest types, change the season or let the year run, push the wind, switch the occlusion mode, shake trees, chase birds and turn on the culling grid.</p></div>'
           f'<a class="btn warm big" href="{SBX}">Play the Forest Sandbox ↗</a></div>')
body.append(section('sandbox', 'Reference implementation: the Forest Sandbox', sbx_cta + sbx_html, '8'))
body.append(section('gems', 'Gem findings', render(gem_check) + gem_table() + render(gem_after), '9'))
body.append(section('learnings', 'Learnings and anti-patterns', render(learn), '10'))
body.append(section('see-it', '“See it in action” index', idx_table(), '11'))
body.append(section('unverified', 'What remains unverified (and corrections)', render(unv), '12'))
body.append(section('roadmap', 'Prototype roadmap for Godot (web)', '<div class="road">' + render(road) + '</div>', '13'))
body.append(section('sources', 'Sources', render(src_intro) + ''.join(src_html), '14'))
body.append('<footer class="foot"><p>Kingsfoil Studios · Research study · November 2026</p>'
            f'<p><a href="{SBX}">Play the Forest Sandbox ↗</a> · <a href="vfx-rain-topdown-pixel.html">Previous study: rain</a> · <a href="vfx-acid-topdown-pixel.html">Study #2: acid</a> · <a href="vfx-snow-topdown-pixel.html">Study #1: snow</a> · <a href="index.html">All Kingsfoil artifacts</a> · <a href="#top">Back to top</a></p></footer>')
body.append('</main></div>')
body_s = ''.join(body)

fig_ids = re.findall(r'<figure class="fig[^"]*"[^>]*id="fig-(\w+)"', body_s)
num = {}
for name in fig_ids:
    if name != 'hero':
        num[name] = len(num) + 1
cnt = iter(range(1, 1000))
body_s = re.sub(r'Fig\. @N', lambda m: f'Fig. {next(cnt)}', body_s)
def ref(m):
    n = m.group(1)
    if n not in num:
        print('bad ref', n, file=sys.stderr); return n
    return f'<a href="#fig-{n}">Fig. {num[n]}</a>'
body_s = re.sub(r'@REF:(\w+)', ref, body_s)
js = re.sub(r'@REFN:(\w+)', lambda m: str(num.get(m.group(1), '?')), js)
unused = set(FIGS) - set(USED) - {'hero'}
if unused:
    print('UNUSED FIGS', unused, file=sys.stderr)
left = re.findall(r'@@FIG:\w+@@', body_s)
if left:
    print('UNPLACED', left, file=sys.stderr)

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="A graphical research study of tiny, efficient algorithms for top-down pixel-art forests: two-layer tiles and Tibia's draw order, climate tables and blue-noise placement, palette seasons with per-tree phenology, whole-pixel wind sway, occlusion fades, shade and sunflecks, birds and boids, and batching for thousands of trees in web Godot, with live demos.">
<meta name="theme-color" content="#0d120c">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>
<button class="toc-btn" id="tocBtn" type="button" aria-controls="toc" aria-expanded="false">Contents</button>
<div class="toc-scrim" id="tocScrim" hidden></div>
{body_s}
<script>
{data_js}
{js}
</script>
</body>
</html>
'''
OUT.write_text(page)
print('wrote', OUT, len(page.encode()), 'bytes;', len(num), 'numbered figures; demos:', len(re.findall(r'data-demo="', page)))
