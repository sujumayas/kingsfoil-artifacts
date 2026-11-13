#!/usr/bin/env python3
"""Build the single-file "fire at 32 px" study page (VFX #12) from the markdown report + style.css + study.css + hero.html + figs*.html + JS.
Recipe for studykit; run via `python -m studykit build vfx-fire-32px`. Template: studies/vfx-snow-32px/build.py.
Series nav comes from the catalog via S_.series_nav().

Data handed to the demos (see data_js at the bottom): SCORE (the 33 scorecard rows), GENS (the 4 generations of section 3)
and T6, the tables of section 6 as arrays of cell strings. T6 keys: doom, loops, front, grid, smoke, light, upload, frame (6a),
6b, 6c, 6d, 6e. Empty cells stay empty strings.

Missing figures: while three agents build figs1-3 in parallel, a figure that is not written yet only prints
'missing fig <name>' and 'FIGS NOT PLACED YET'. For the final build set FINAL = True (or run with
KF_FINAL=1): then any missing figure, demo file or unplaced figure stops the build.
"""
import re, json, html, sys, pathlib, os
from markdown_it import MarkdownIt

import sys, pathlib as _pl
sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[2]))  # repo root, for studykit
import studykit
S_ = studykit.ctx(__file__)
B = S_.dir
SRC = S_.report_text
OUT = S_.out_path
SBX = S_.sandbox_name
FINAL = True  # the lead sets this to True for the final build
FINAL = FINAL or bool(os.environ.get('KF_FINAL'))

md = MarkdownIt('commonmark', {'html': True}).enable('table')
URL_RE = re.compile(r'https?://[^\s<>"`]+')

def trim_url(u):
    u = u.rstrip('.,;:')
    while u.endswith(')') and u.count(')') > u.count('('):
        u = u[:-1]
    return u.rstrip('.,;:')

# ---------------------------------------------------------------- helpers
def split_code(h):
    parts = re.split(r'(<pre[\s\S]*?</pre>|<code[\s\S]*?</code>|<a [\s\S]*?</a>)', h)
    for i, p in enumerate(parts):
        yield (i % 2 == 1), p

TAGCLS = {'V': 'tv', 'I': 'ti', 'U': 'tu', 'K': 'tk'}
TAGTITLE = {'V': 'Verified in a source our researchers read', 'I': 'Author inference or design proposal',
            'U': 'Unverified lead', 'K': 'Textbook or canonical knowledge'}
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
            title = TAGTITLE[k]
            piece = f'<b class="tag {TAGCLS[k]}" title="{title}">{tag}</b>'
            if rest:
                piece += ' ' + sref(rest)
            out.append(piece)
        else:
            out.append(sref(s.strip()))
    return '<span class="cite">' + '<i>;</i> '.join(out) + '</span>'

def tagify(h):
    return ''.join(p if c else CITE_RE.sub(cite_repl, p) for c, p in split_code(h))

def see_link(u, label='See it in action ↗'):
    u = trim_url(u)
    return f'<a class="see" href="{html.escape(u)}" target="_blank" rel="noopener">{label}</a>'

def short(u):
    u = trim_url(u)
    d = re.sub(r'^https?://(www\.)?', '', u).split('/')[0]
    return d + ' ↗'

def url_sub(p, fn):
    def rep(m):
        raw = m.group(0)
        u = trim_url(raw)
        return fn(u) + raw[len(u):]
    return URL_RE.sub(rep, p)

def linkify_games(h):
    def fix(p):
        p = re.sub(r':\s*(?=https?://)', ' ', p)
        return url_sub(p, lambda u: see_link(u))
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def linkify_plain(h, label=None):
    def fix(p):
        return url_sub(p, lambda u: see_link(u, label or short(u)))
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def hl_code(h):
    def one(m):
        lang = m.group(1) or ''
        res = []
        for ln in m.group(2).split('\n'):
            ci = ln.find('//')
            hi = -1
            if ln.lstrip().startswith('# '):
                hi = ln.find('# ')
            elif '  # ' in ln:
                hi = ln.find('  # ') + 2
            if hi >= 0:
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

def cells_e(line):
    """Like cells(), but keeps empty cells (the tables of section 6 have many). No cell there holds a pipe."""
    s = line.strip()
    assert s.startswith('|') and s.endswith('|'), line
    return [x.strip() for x in s[1:-1].split('|')]

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
fam_blocks = re.split(r'^### (Family [A-H]: .+)$', tech, flags=re.M)
families = []
for i in range(1, len(fam_blocks), 2):
    fname, body = fam_blocks[i], fam_blocks[i + 1]
    profs = re.split(r'^### ([A-H]\d)\. (.+)$', body, flags=re.M)
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
# eight families of unequal size: A1-A3, B1-B6, C1-C5, D1-D3, E1-E6, F1-F4, G1-G4, H1-H2
assert [len(p) for _, p in families] == [3, 6, 5, 3, 6, 4, 4, 2], [len(p) for _, p in families]
assert NPROF == 33

# scorecard
_, score = S('5.')
rows = []
for line in score.split('\n'):
    m = re.match(r'^\| ([A-H]\d) \| (.+?) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d+) \|$', line)
    if m:
        rows.append({'id': m.group(1), 'name': m.group(2), 'r': [int(m.group(k)) for k in range(3, 8)], 'sum': int(m.group(8))})
assert len(rows) == 33, len(rows)
assert '| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |' in score
score_intro = score.split('|')[0].strip()
score_read = score[score.rfind('|') + 1:].strip()
tmap = {r['id']: r for r in rows}
for fname, pl in families:
    for p in pl:
        assert tmap[p['id']]['r'] == p['r'], p['id']
        if sum(p['r']) != tmap[p['id']]['sum']:
            print('SUM MISMATCH', p['id'], sum(p['r']), tmap[p['id']]['sum'], file=sys.stderr)

FIGS = {}
FIGFILES = ['figs1.html', 'figs2.html', 'figs3.html']
for f in FIGFILES:
    if not (B / f).exists():
        print('missing', f, file=sys.stderr)
        assert not FINAL, f'FINAL build: {f} is missing'
for m in re.finditer(r'<!--FIG (\w+)-->([\s\S]*?)<!--/FIG-->', ''.join((B / f).read_text() for f in FIGFILES if (B / f).exists())):
    FIGS[m.group(1)] = tagify(m.group(2).strip())

AFTER_PROFILE = {
    # figs1 / demos1 (Agent R, recipe owner): resolution and fields, cost, frontier
    'A1': ['scale'], 'A2': ['spreadroll'], 'A3': ['fieldres'], 'G1': ['framecost'], 'G2': ['uploads'], 'G4': ['lights'],
    'H1': ['pingpong'], 'H2': ['maskseed'],
    # figs2 / demos2 (Agent F): flames, burn front, burnt world, lava
    'B1': ['loops'], 'B2': ['tibiafield'], 'B3': ['dying'], 'B4': ['doom32'], 'B5': ['noisefire'], 'B6': ['stacked'],
    'C1': ['burnmap'], 'C2': ['arrival'], 'C3': ['tileswap'], 'C4': ['tilestates'], 'C5': ['house'], 'F4': ['lava'],
    # figs3 / demos3 (Agent H): smoke, embers, characters, combat
    'D1': ['smokecluster'], 'D2': ['puffs'], 'D3': ['embers'], 'E1': ['burnchar'], 'E2': ['torchwalk'], 'E3': ['rimlight'],
    'E4': ['sootwalk'], 'E6': ['crowd'], 'F1': ['areas'], 'F2': ['missile'], 'F3': ['explode'],
    # section 3: timeline. section 5: score. 6a: costs. 6b: convert. 6c: tilesizes. 6d: spreadspeed. section 7: stack (generated below)
}
# profiles with no figure of their own point at the one that shows them
SEE_ALSO = {'E5': ['burnchar'], 'G3': ['embers']}
FIELD_LABEL = [('plain', 'In plain words'), ('tech', 'How it works (technical)'), ('cost', 'Cost / performance'),
               ('games', 'Games that used it'), ('feel', 'How it feels'), ('risks', 'Risks')]
RLAB = ['Simplicity', 'Speed', 'Pixel taste', 'Mood', 'Interactivity']

def bars(r):
    out = ['<span class="rbars" aria-label="Ratings: ' + ', '.join(f'{RLAB[i]} {v}' for i, v in enumerate(r)) + '">']
    for i, v in enumerate(r):
        out.append(f'<span class="rb" title="{RLAB[i]} {v}/5"><span style="--v:{v}"></span></span>')
    out.append('</span>')
    return ''.join(out)

USED = []
def fig(name):
    if name not in FIGS:
        print('missing fig', name, file=sys.stderr)
        assert not FINAL, f'FINAL build: figure {name} is missing'
        return ''
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
    figs_after = AFTER_PROFILE.get(p['id'], [])
    parts.append('<section class="tp-f tp-ratings"><h4>Ratings (author judgement, 1–5)</h4><ul class="rlist">')
    for i, v in enumerate(p['r']):
        parts.append(f'<li><span>{RLAB[i]}</span><span class="rbar"><span style="--v:{v}"></span></span><b>{v}</b></li>')
    parts.append('</ul>')
    if figs_after:
        parts.append(''.join(f'<p class="tp-fig">Try it: <a href="#fig-{n}">@REF:{n}</a> below the card.</p>' for n in figs_after))
    for n in SEE_ALSO.get(p['id'], []):
        parts.append(f'<p class="tp-fig">See also: <a href="#fig-{n}">@REF:{n}</a>.</p>')
    parts.append('</section></div></details>')
    return ''.join(parts) + ''.join(fig(n) for n in figs_after)

# ---------------------------------------------------------------- timeline data
_, tl = S('3.')
gens = []
gparts = re.split(r'^\*\*(Gen \d): (.+?)\*\*\s*$', tl, flags=re.M)
MON = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11}
YEAR_HEAD = r'\*\*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?≤?\d{4}(?:–\d{2})?\*\*'
for i in range(1, len(gparts), 3):
    gid, gtitle, gbody = gparts[i], gparts[i + 1].rstrip('.'), gparts[i + 2]
    ev = []
    for line in gbody.split('\n'):
        if not line.startswith('- '):
            continue
        txt = line[2:].strip()
        chunks = [c.strip().rstrip(';').rstrip('.').strip() for c in re.split(r'(?:;\s*|\.\s+)(?=' + YEAR_HEAD + ')', txt) if c.strip()]
        for ch in chunks:
            m = re.match(r'\*\*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?≤?(\d{4})(?:–\d{2})?\*\*', ch)
            yr, mo = None, 0
            if m:
                yr = int(m.group(2))
                if m.group(1):
                    mo = MON[m.group(1)] + .5
            else:
                mm = re.search(r'\((\d{4}) onward\)', ch)
                if mm:
                    yr = int(mm.group(1))
            h = tagify(md.renderInline(ch + '.'))
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
assert len(gem_rows) == 31 and all(len(r) == 6 for r in gem_rows), (len(gem_rows), [r[0] for r in gem_rows if len(r) != 6])
gem_intro = '\n'.join(lines[:ti]).strip()
gem_after = '\n'.join(lines[j:]).strip()
gem_check = gem_intro.split('**Flags:**')[0].strip()
flag_lines = re.findall(r'\*\*(.+?)\*\* = ([^;]+?)(?:;|\.\s*$)', gem_intro.split('**Flags:**')[1])
LV = {'Low': 'ok', 'LGPL': 'mid', 'Copyleft': 'hi', 'None': 'unk'}

def flag_level(flag):
    m = re.match(r'^(Low|LGPL|Copyleft|None)', flag)
    f = m.group(1) if m else flag
    rest = flag[m.end():].strip() if m else ''
    return LV.get(f, 'unk'), f, rest

def gem_table():
    o = ['<p class="lic-h"><strong>Licence flags</strong> (badge colours: green permissive, amber LGPL, red copyleft, violet no licence)</p><div class="lic-key">'
         + ''.join(f'<span class="lk"><span class="lic {LV.get(f, "unk")}">{html.escape(f)}</span> {inline(t)}</span>' for f, t in flag_lines) + '</div>',
         '<div class="tbl"><table class="gems"><thead><tr><th>Name</th><th>Flag</th><th>Licence</th><th>Maturity</th><th>Good for</th></tr></thead><tbody>']
    for name, url, lic, mat, good, flag in gem_rows:
        lv, lab, rest = flag_level(flag)
        urls = [u.strip() for u in url.split(';')]
        nm = f'<a href="{html.escape(urls[0])}" target="_blank" rel="noopener">{inline(name)} ↗</a>'
        o.append(f'<tr><td>{nm}</td><td><span class="lic {lv}" title="Licence flag: {html.escape(lab)}">{html.escape(lab)}</span>'
                 + (f' <small>{inline(rest)}</small>' if rest else '') + f'</td><td>{inline(lic)}</td><td>{inline(mat)}</td><td>{inline(good)}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- see-it index
_, idx = S('11.')
idx_rows = []
for line in idx.split('\n'):
    m = re.match(r'^\| (\d+) \| (.+?) \| (.+?) \| (\S+?)(?: \|)?\s*$', line)
    if m:
        idx_rows.append(m.groups())
assert len(idx_rows) == 45, len(idx_rows)
assert '| # | Game | Fire idea | URL |' in idx
CHIPS = [('tibia', 'Tibia'), ('stardew|rpg maker|pokémon|zelda', 'Stardew, RPG Maker and Nintendo'),
         ('rimworld|starve|minecraft|far cry|sigil|brogue|zomboid|dwarf|noita|spread', 'spreading fire'),
         ('stage|ash|tile swap|burnt|tile types', 'stages and ash'), ('smoke|dust|ember|campfire', 'smoke and campfires'),
         ('fireball|missile|effect|wall|bomb|damage|shake|burst', 'combat'), ('light|shadow|lava', 'light and lava'),
         ('doom|pico-8', 'DOOM fire')]

def idx_table():
    o = ['<div class="idx-tools"><label class="search"><span>Filter</span><input id="idxq" type="search" placeholder="Type a game or idea, e.g. campfire" aria-describedby="idxn"></label><span id="idxn" class="mute" aria-live="polite"></span></div>',
         '<div class="chips" data-idx role="group" aria-label="Quick filters">' + ''.join(f'<button type="button" data-q="{html.escape(q)}">{lab}</button>' for q, lab in CHIPS) + '</div>',
         '<div class="tbl"><table class="idx" id="idxt"><thead><tr><th>#</th><th>Game</th><th>Fire idea</th><th>Link</th></tr></thead><tbody>']
    for n, game, what, link in idx_rows:
        o.append(f'<tr><td>{n}</td><td>{inline(game)}</td><td>{inline(what)}</td><td>{see_link(link)}</td></tr>')
    o.append('</tbody></table></div>')
    o.append(f'<p class="mute">Want to try these ideas instead of reading about them? <a href="{SBX}">Play the Fire 32 Sandbox ↗</a></p>')
    return ''.join(o)

# ---------------------------------------------------------------- sources
_, srcs = S('14.')
src_html = []
src_intro = srcs.split('\n**')[0].strip()
sp_ = re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)
NSRC = 0
for i in range(1, len(sp_), 2):
    group = sp_[i]
    items = []
    for l in [l for l in sp_[i + 1].split('\n') if re.match(r'^\d+\. ', l)]:
        n, rest = re.match(r'^(\d+)\. (.+)$', l).groups()
        NSRC += 1
        urls = [trim_url(u) for u in URL_RE.findall(rest)]
        first = rest.find('http')
        title = rest[:first].rstrip(': ').rstrip() if first >= 0 else rest
        links, extra_h = [], ''
        if urls:
            for u in urls:
                links.append(f'<a href="{html.escape(u)}" target="_blank" rel="noopener">{html.escape(short(u))}</a>')
            tail = rest[first:]
            for u in urls:
                tail = tail.replace(u, ' ')
            extra = re.sub(r'[\s;:()]+', ' ', tail).strip()
            extra_h = f' <span class="mute">({html.escape(extra)})</span>' if extra else ''
        if n == '2':  # VFX #6 Fire, the study this one scales up
            links.append('<a href="vfx-fire-topdown-pixel.html">vfx-fire-topdown-pixel.html</a>')
        if n == '3':  # VFX #11 Snow at 32 px, the recipe this one follows
            links.append('<a href="vfx-snow-32px-topdown-pixel.html">vfx-snow-32px-topdown-pixel.html</a>')
        if n == '6':
            links.append(f'<a href="{SBX}">{SBX} ↗</a>')
        items.append(f'<li id="s{n}" value="{n}"><span class="sn">S{n}</span> {md.renderInline(title)} {" · ".join(links)}{extra_h}</li>')
    src_html.append(f'<h3>{inline(group)}</h3><ol class="src">' + ''.join(items) + '</ol>')
assert NSRC == 193, NSRC
assert len(src_html) == 10, len(src_html)

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

# Context split: the 'Two equal goals.' line starts a new block. No figure sits here in this study: the hero carries the scene,
# and the scale figure follows profile A1. Put a name in CTX_FIGS to place a figure between the two halves.
cut = ctx.find('**Two equal goals.**')
assert cut > 0
CTX_FIGS = []
ctx_html = render(ctx[:cut]) + ''.join(fig(n) for n in CTX_FIGS) + render(ctx[cut:])

def grab_table(text, head):
    m = re.search(r'^' + re.escape(head) + r'.*\n(?:\|.*\n?)+', text, flags=re.M)
    return m.group(0)

T6 = {}
T6HEADS = [('doom', '| Buffer, art px (cells) | GPU run median, ms | 6x throttle median, ms |', 10),
           ('loops', '| Flames | GPU run median, ms | 6x throttle median, ms |', 4),
           ('front', '| Burning share (GPU run median / 6x throttle median, ms) | Art burn-order map | Bayer 4 | Whole-tile swap |', 5),
           ('grid', '| Grid (GPU run median / 6x throttle median, ms per tick) | Mean burning | Per tick | Per second at equal px/s |', 6),
           ('smoke', '| Smoke (GPU run median / 6x throttle median, ms) | 4 px cells (160x90) | 8 px cells (80x45) | 16 px cells (40x23) |', 4),
           ('light', '| Light map (GPU run median / 6x throttle median, ms) | 32 px cells | 8 px cells | 4 px cells |', 4),
           ('upload', '| WebGL2 pass | Bytes or pixels | GPU run wall median, ms | GPU run timer (Metal), ms | SwiftShader wall median, ms |', 7),
           ('frame', '| Default frame, "Default at 640x360" and "at 320x180" rows | GPU run median, ms | SwiftShader median, ms | 6x throttle median, ms | Share of 16.7 ms, throttled |', 3),
           ('6b', '| VFX #6 value (8 px cells, 320x180) | At 32 px tiles, 640x360 | Follows | Note |', 30),
           ('6c', '| Game | Tile px | Flame or effect, px | Fraction of a tile | Frames x ms | Source |', 15),
           ('6d', '| Game | Rule | Tiles per second | Against a 2.5 tiles/s walk | Source |', 9),
           ('6e', '| Topic | What the source says | What it means at 32 px | Source |', 12)]
for key, head, n in T6HEADS:
    t = grab_table(deep, head)
    body_rows = [cells_e(l) for l in t.strip().split('\n')[2:]]
    assert len(body_rows) == n, (key, len(body_rows))
    assert all(len(r) == len(cells_e(head)) for r in body_rows), (key, [r[0] for r in body_rows if len(r) != len(cells_e(head))])
    T6[key] = body_rows
# five parts, 6a to 6e
assert re.findall(r'^### (6[a-z])\. ', deep, flags=re.M) == ['6a', '6b', '6c', '6d', '6e']
# the tables stay simple tables in place. The cost chart follows the 6a tables, the converter closes 6b, the tile-size chart
# closes 6c and the spread-speed chart closes 6d
assert deep.count('**What the tables say**') == 1 and deep.count('### 6c. ') == 1 and deep.count('### 6d. ') == 1 and deep.count('### 6e. ') == 1
deep = deep.replace('**What the tables say**', '@@FIG:costs@@\n\n**What the tables say**')
deep = deep.replace('### 6c. ', '@@FIG:convert@@\n\n### 6c. ')
deep = deep.replace('### 6d. ', '@@FIG:tilesizes@@\n\n### 6d. ')
deep = deep.replace('### 6e. ', '@@FIG:spreadspeed@@\n\n### 6e. ')
deep_html = render(deep)

# architecture: the numbered layer list becomes the clickable stack
lay_block = re.search(r'\*\*Layers, bottom to top\.\*\*\n((?:\d+\. .*\n)+)', arch)
layers = re.findall(r'^(\d+)\. \*\*(.+?)\*\* (.+)$', lay_block.group(1), flags=re.M)
assert len(layers) == 9, len(layers)
arch = arch.replace(lay_block.group(0), '@@FIG:stack@@\n\n')
SUBT = ['', '240 cells, 4 Hz tick, spread rolled once a second per tile', 'ignitions with tick and entry side, about 25 B/s',
        'painted burn-order map, 1 px ember line, 2 to 3 px scorch', 'loops sized by the tile, 64x64 overflow, 16 variants',
        'pool of 512, 2x2 embers, 1 px sparks', '80x45 byte field in 2x2 clusters, about 64 puffs',
        'Tibia timing, areas from 1-tile effects, fields, decals', 'torch in hand, 1 px rim, one shadow, soot prints',
        'palette indices, 8 px light map, 2 to 3 px dither band']
def stack_fig():
    o = ['<figure class="fig" data-demo="stack" id="fig-stack"><div class="fig-h"><span class="fig-n">Fig. @N</span><h4 class="fig-t">The layered fire stack for Asterion Online at 32 px, bottom to top</h4><span class="illu">Design proposal</span></div>',
         '<div class="stack"><div class="layers">']
    tpl = []
    for n, name, txt in reversed(layers):
        cls = ' srv' if n == '1' else ''
        nm = name.rstrip('.')
        o.append(f'<button type="button" class="layer{cls}" data-l="L-{n}"><b>{n}</b><span>{inline(nm)}<small>{SUBT[int(n)]}</small></span></button>')
        tpl.append(f'<template id="L-{n}"><h4>{n} · {inline(nm)}</h4><p>{inline(txt)}</p></template>')
    o.append('</div><div class="ldet" aria-live="polite"></div></div>' + ''.join(tpl))
    o.append('<figcaption>Click a layer to read its row from §7. Layer 1 (dashed) is the server truth. It keeps one fire cell per 32 px tile, 240 cells for a 640x360 view, and sends ignition and extinguish events of about 4 bytes each. Every layer above layer 2 is local and cosmetic, driven by the shared hash. Layers 3, 4 and 9 draw at art resolution, so they grow with the 4 times the pixels. The smoke field and the light map stay at 80x45 cells and the ember pool at 512. The whole stack is the study\'s design proposal, played by the Fire 32 Sandbox in JavaScript and not yet built in Godot <span class="cite"><b class="tag ti">I</b></span>.</figcaption></figure>')
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
CTX_TITLE = 'Fire, moved to 32 px tiles'
TOC = [('context', CTX_TITLE), ('summary', 'Executive summary'), ('how-to-read', 'How to read this study'),
       ('timeline', 'Timeline'), ('techniques', 'Technique profiles'), ('scorecard', 'Scorecard'),
       ('deep-dives', 'Deep dives'), ('architecture', 'Layered architecture'), ('sandbox', 'Reference implementation'),
       ('gems', 'Gem findings'), ('learnings', 'Learnings and anti-patterns'), ('see-it', 'See it in action index'),
       ('unverified', 'What remains unverified'), ('roadmap', 'Prototype roadmap'), ('sources', 'Sources')]
FAMSUB = [('fam-a', 'A · Resolution and fields'), ('fam-b', 'B · Flames at 32 px'), ('fam-c', 'C · Burn front and burnt world'),
          ('fam-d', 'D · Smoke, steam and embers'), ('fam-e', 'E · Characters at 24x32'), ('fam-f', 'F · Combat fire and lava'),
          ('fam-g', 'G · Cost and Godot'), ('fam-h', 'H · Frontier')]
DEEPSUB = [('dd-costs', '6a · Measured costs'), ('dd-convert', '6b · Conversion table'), ('dd-games', '6c · Games by tile size'),
           ('dd-speed', '6d · Spread speed'), ('dd-artists', '6e · What artists say')]
try:
    SERIES = S_.series_nav('bar')  # generated from site/catalog.json
except KeyError as e:  # not registered yet: build without the series bar
    print('WARNING', e, file=sys.stderr)
    SERIES = ''

def toc_html():
    o = ['<nav class="toc" id="toc" aria-label="Contents"><div class="toc-in">',
         '<a class="toc-home" href="index.html">Kingsfoil artifacts</a>', SERIES,
         f'<a class="btn warm toc-play top" href="{SBX}">Play the Fire 32 Sandbox ↗</a>',
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
assert len(families) == len(fam_ids) == 8 and [f.split(':')[0][-1] for f, _ in families] == list('ABCDEFGH')
assert 'There are eight families:' in intro_fam
tech_html = [render(intro_fam.replace('There are eight families:', 'There are eight families. Open any card for the full profile. The figure after a card lets you play with its technique.')),
             f'<div class="tp-tools"><button class="btn ghost" type="button" data-openall>Open all {NPROF} profiles</button><button class="btn ghost" type="button" data-closeall>Close all</button></div>']
for (fname, pl), fid in zip(families, fam_ids):
    tech_html.append(f'<div class="fam" id="{fid}"><h3 class="famh"><span>{fname.split(":")[0].replace("Family ", "")}</span>{html.escape(fname.split(": ", 1)[1])}</h3>')
    for p in pl:
        tech_html.append(profile_html(p))
    tech_html.append('</div>')

score_html = render(score_intro) + fig('score') + render(score_read)

title = 'Top-down pixel fire at 32 px: scaling the fire engine to 32x32 tiles and 24x32 characters'
assert SRC.startswith('# ' + title), 'title must match the report'
# The page script is data_js + core.js + demos1-3.js in one <script>. "use strict" has to be its first statement to count:
# core.js's own directive comes after the data and would be ignored. Without it, a function declared inside one demos
# block leaks to the global scope and replaces a core function of the same name (drawChar did in the snow study).
data_js = ('"use strict";\nconst SCORE=' + json.dumps(rows, ensure_ascii=False) + ';\nconst GENS=' + json.dumps(gens, ensure_ascii=False) +
           ';\nconst T6=' + json.dumps(T6, ensure_ascii=False) + ';\n')

hero = (B / 'hero.html').read_text().replace('@@SERIES@@', SERIES)
css = (B / 'style.css').read_text() + '\n' + (B / 'study.css').read_text()
JSF = ['core.js'] + [f for f in ('demos1.js', 'demos2.js', 'demos3.js') if (B / f).exists()]
for f in ('demos1.js', 'demos2.js', 'demos3.js'):
    if not (B / f).exists():
        print('missing', f, file=sys.stderr)
        assert not FINAL, f'FINAL build: {f} is missing'
js = ''.join((B / f).read_text() + '\n' for f in JSF)

deep_html = figs_in(deep_html)
DEEPIDS = [(lab.split(' ')[0], sid) for sid, lab in DEEPSUB]
assert [h for h, _ in DEEPIDS] == ['6a', '6b', '6c', '6d', '6e']
for hid, sid in DEEPIDS:
    assert f'<h3>{hid}.' in deep_html, hid
    deep_html = re.sub(r'<h3>' + hid + r'\.', f'<h3 id="{sid}">{hid}.', deep_html, count=1)

summary_html = '<div class="exec">' + render(summ) + '</div>'

body = [hero, '<div class="layout">' + toc_html() + '<main id="main">']
body.append(section('context', CTX_TITLE, ctx_html))
body.append(section('summary', 'Executive summary', summary_html, '1'))
body.append(section('how-to-read', 'How to read this study', legend() + render(read_bullets), '2'))
body.append(section('timeline', 'Generations: a timeline', fig('timeline'), '3'))
body.append(section('techniques', 'Technique profiles', ''.join(tech_html), '4'))
body.append(section('scorecard', 'Comparison scorecard', score_html, '5'))
body.append(section('deep-dives', 'Deep dives', deep_html, '6'))
body.append(section('architecture', 'Combinations: a layered architecture for Asterion Online (Godot 4, web)', figs_in(arch_html), '7'))
assert '## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)' in SRC and '## 8. Reference implementation: the Fire 32 Sandbox' in SRC and '## 13. Prototype roadmap for Godot 4.7 (web)' in SRC
sbx_cta = ('<div class="cta"><div><p class="cta-t">The Fire 32 Sandbox is the playable version of this study.</p>'
           '<p class="mute">Set fire to a village edge on a 640×360 canvas with 32 px tiles and 24×32 characters. '
           'The server grid keeps one cell per tile and rolls spread once a second, and the spread-grid control switches to 16 px or 8 px cells at the same px/s. '
           'Swap the painted burn-order front for Bayer 4 or a whole-tile swap, drawn flame loops for DOOM buffers at 1:1 or 1:2, '
           'smoke clusters for Bayer, 2x2 embers for 1 px, and the 8 px light map for 32 px or 4 px cells. '
           'Throw a fireball, lay a fire field or a wall, carry a torch through the meadow or add a crowd of 20. '
           'The VFX #6 settings button shows the old look at the new size, and each layer reports its own cost against a 16.7 ms bar.</p></div>'
           f'<a class="btn warm big" href="{SBX}">Play the Fire 32 Sandbox ↗</a></div>')
body.append(section('sandbox', 'Reference implementation: the Fire 32 Sandbox', sbx_cta + sbx_html, '8'))
body.append(section('gems', 'Gem findings', render(gem_check) + gem_table() + render(gem_after), '9'))
body.append(section('learnings', 'Learnings and anti-patterns', '<div class="learn">' + render(learn) + '</div>', '10'))
body.append(section('see-it', '“See it in action” index', idx_table(), '11'))
body.append(section('unverified', 'What remains unverified (and corrections)', render(unv), '12'))
body.append(section('roadmap', 'Prototype roadmap for Godot 4.7 (web)', '<div class="road">' + render(road) + '</div>', '13'))
body.append(section('sources', 'Sources', render(src_intro) + ''.join(src_html), '14'))
body.append('<footer class="foot"><p>Kingsfoil Studios · Research study · November 2026</p>'
            f'<p><a href="{SBX}">Play the Fire 32 Sandbox ↗</a> · <a href="vfx-fire-topdown-pixel.html">Study #6: fire, the engine this study scales</a> · <a href="vfx-snow-32px-topdown-pixel.html">Previous study: snow at 32 px</a> · <a href="vfx-magic-topdown-pixel.html">Study #10: magic</a> · <a href="vfx-grass-topdown-pixel.html">Study #9: grass</a> · <a href="vfx-fog-topdown-pixel.html">Study #8: fog</a> · <a href="vfx-water-topdown-pixel.html">Study #7: water</a> · <a href="vfx-light-topdown-pixel.html">Study #5: light</a> · <a href="vfx-forest-topdown-pixel.html">Study #4: forest</a> · <a href="vfx-rain-topdown-pixel.html">Study #3: rain</a> · <a href="vfx-acid-topdown-pixel.html">Study #2: acid</a> · <a href="vfx-snow-topdown-pixel.html">Study #1: snow</a> · <a href="index.html">All Kingsfoil artifacts</a> · <a href="#top">Back to top</a></p></footer>')
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
    return f'Fig. {num[n]}'
body_s = re.sub(r'<a href="#fig-(\w+)">@REF:\1</a>', lambda m: f'<a href="#fig-{m.group(1)}">Fig. {num.get(m.group(1), "?")}</a>', body_s)
body_s = re.sub(r'@REF:(\w+)', lambda m: f'<a href="#fig-{m.group(1)}">{ref(m)}</a>', body_s)
js = re.sub(r'@REFN:(\w+)', lambda m: str(num.get(m.group(1), '?')), js)
unused = set(FIGS) - set(USED) - {'hero'}
if unused:
    print('UNUSED FIGS', unused, file=sys.stderr)
EXPECTED = ['timeline', 'scale', 'spreadroll', 'fieldres', 'framecost', 'uploads', 'lights', 'pingpong', 'maskseed', 'convert', 'spreadspeed',  # figs1 (plus the hero)
            'loops', 'tibiafield', 'dying', 'doom32', 'noisefire', 'stacked', 'burnmap', 'arrival', 'tileswap', 'tilestates', 'house', 'lava',  # figs2
            'smokecluster', 'puffs', 'embers', 'burnchar', 'torchwalk', 'rimlight', 'sootwalk', 'crowd', 'areas', 'missile', 'explode',
            'costs', 'tilesizes', 'score',  # figs3
            'stack']
# 39 figures on the page: the hero plus the 38 numbered ones below (37 hand-built, and the stack generated from section 7)
assert len(EXPECTED) == 38 and len(set(EXPECTED)) == 38
placed = set(sum(AFTER_PROFILE.values(), [])) | {'timeline', 'score', 'costs', 'convert', 'tilesizes', 'spreadspeed', 'stack'} | set(CTX_FIGS)
assert placed == set(EXPECTED), (placed ^ set(EXPECTED))
assert all(n in EXPECTED for v in SEE_ALSO.values() for n in v)
notyet = [n for n in EXPECTED if n not in USED]
if notyet:
    print('FIGS NOT PLACED YET', notyet, file=sys.stderr)
left = re.findall(r'@@FIG:\w+@@', body_s)
if left:
    print('UNPLACED', left, file=sys.stderr)
if FINAL:
    assert not notyet and not left and not unused, ('FINAL build', notyet, left, unused)
    assert 'hero' in FIGS or 'data-demo="hero"' in hero, 'FINAL build: hero missing'

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="A graphical research study of what changes when a tile fire engine moves from 8 px cells to 32 px tiles, 24x32 characters and a 640x360 canvas: a spread grid that stays at one cell per tile and rolls once a second, a painted burn-order front, flame loops that overflow the tile like Tibia's, DOOM buffers smoothed before quantizing, smoke in 2x2 clusters, 2x2 embers, carried torches and rim light, combat areas built from 1-tile effects, and a baked light map, with measured costs at 640x360 and live demos.">
<meta name="theme-color" content="#110b09">
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
