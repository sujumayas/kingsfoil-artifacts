#!/usr/bin/env python3
"""Build the single-file acid study page from the markdown report + style.css + figs.html + demos JS.
Recipe for studykit; run via `python -m studykit build vfx-acid` (snow study)."""
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
            'U': 'Unverified lead', 'K': 'Established textbook knowledge'}
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
            title = TAGTITLE[k] + (' (via a secondary summary)' if 'secondary' in tag else '')
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
    """light comment highlight inside <pre><code>"""
    def one(m):
        lang = m.group(1) or ''
        res = []
        for ln in m.group(2).split('\n'):
            ci = ln.find('//')
            if ln.lstrip().startswith('# '):
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
fam_blocks = re.split(r'^### (Family [A-F]: .+)$', tech, flags=re.M)
families = []
for i in range(1, len(fam_blocks), 2):
    fname, body = fam_blocks[i], fam_blocks[i + 1]
    profs = re.split(r'^### ([A-F]\d)\. (.+)$', body, flags=re.M)
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
assert sum(len(p) for _, p in families) == 29, [len(p) for _, p in families]

# scorecard
_, score = S('5.')
rows = []
for line in score.split('\n'):
    m = re.match(r'^\| ([A-F]\d) \| (.+?) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d+) \| (.+?) \|$', line)
    if m:
        rows.append({'id': m.group(1), 'name': m.group(2), 'r': [int(m.group(k)) for k in range(3, 8)],
                     'sum': int(m.group(8)), 'cost': m.group(9)})
assert len(rows) == 29, len(rows)
score_intro = score.split('|')[0].strip()
score_read = score[score.find('**Reading the table'):].strip()
tmap = {r['id']: r for r in rows}
for fname, pl in families:
    for p in pl:
        assert tmap[p['id']]['r'] == p['r'], p['id']
        assert sum(p['r']) == tmap[p['id']]['sum'], p['id']

FIGS = {}
for m in re.finditer(r'<!--FIG (\w+)-->([\s\S]*?)<!--/FIG-->', (B / 'figs.html').read_text()):
    FIGS[m.group(1)] = m.group(2).strip()

AFTER_PROFILE = {
    'A1': ['floor'], 'A2': ['zerosim'], 'A3': ['flow', 'pipes'], 'A4': ['goop'], 'A6': ['ripple'],
    'B2': ['react'], 'B3': ['stages'], 'B5': ['fronts'], 'B6': ['dissolve'],
    'C4': ['armour'], 'C5': ['dot'],
    'D1': ['field'], 'D2': ['split'], 'D3': ['engulf'],
    'E1': ['fumes'], 'E3': ['ring'],
    'F2': ['glow'], 'F3': ['ramp'],
}
FIELD_LABEL = [('plain', 'In plain words'), ('tech', 'How it works (technical)'), ('cost', 'Cost / performance'),
               ('games', 'Games that used it'), ('feel', 'How it feels'), ('risks', 'Risks')]
RLAB = ['Simplicity', 'Speed', 'Pixel taste', 'Reactivity', 'Fairness']

def bars(r):
    out = ['<span class="rbars" aria-label="Ratings: ' + ', '.join(f'{RLAB[i]} {v}' for i, v in enumerate(r)) + '">']
    for i, v in enumerate(r):
        out.append(f'<span class="rb" title="{RLAB[i]} {v}/5"><span style="--v:{v}"></span></span>')
    out.append('</span>')
    return ''.join(out)

def fig(name):
    if name not in FIGS:
        print('missing fig', name, file=sys.stderr); return ''
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
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
for i in range(1, len(gparts), 3):
    gid, gtitle, gbody = gparts[i], gparts[i + 1].rstrip('.'), gparts[i + 2]
    ev = []
    for line in gbody.split('\n'):
        if not line.startswith('- '):
            continue
        txt = line[2:].strip()
        head = txt.split(':')[0]
        yrs = re.findall(r'\b(19[89]\d|20[0-2]\d)\b', head)
        yr = int(yrs[0]) if yrs else None
        mo = 0
        mm = re.search(r'\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (20\d\d)\b', head)
        if mm and yr and int(mm.group(3)) == yr:
            mo = MON.index(mm.group(2)) + int(mm.group(1)) / 31
        h = tagify(md.renderInline(txt))
        h = re.sub(r'<strong>|</strong>', '', h)
        ev.append({'y': yr, 'm': mo, 'h': h})
    gens.append({'id': gid, 't': gtitle.strip(), 'ev': ev})
assert len(gens) == 7, len(gens)

# ---------------------------------------------------------------- gems table
_, gem = S('9.')
gem_rows = []
for line in gem.split('\n'):
    if line.startswith('| ') and 'http' in line:
        gem_rows.append([x.strip() for x in line.strip().strip('|').split(' | ')])
gem_intro = gem.split('|')[0].strip()
gem_after = gem[gem.find('**Licence flags'):]

def lic_level(lic):
    l = lic.lower()
    if 'agpl' in l: return ('hi', 'Highest risk')
    if 'all rights reserved' in l: return ('hi', 'No reuse')
    if 'gpl' in l or 'ngpl' in l or 'by-sa' in l: return ('mid', 'Copyleft')
    if 'check' in l or 'no code licence' in l: return ('unk', 'Unclear')
    if 'mit' in l or 'cc0' in l: return ('ok', 'Permissive')
    return ('unk', 'Unclear')

def gem_table():
    o = ['<div class="lic-key"><span class="lic ok">Permissive</span><span class="lic mid">Copyleft: study only</span><span class="lic hi">Highest risk / no reuse</span><span class="lic unk">Unclear: check</span></div>',
         '<div class="tbl"><table class="gems"><thead><tr><th>Name</th><th>Licence</th><th>Maturity evidence</th><th>Good for</th></tr></thead><tbody>']
    for name, url, lic, mat, good in gem_rows:
        lv, lab = lic_level(lic)
        o.append(f'<tr><td><a href="{html.escape(url)}" target="_blank" rel="noopener">{inline(name)} ↗</a></td>'
                 f'<td><span class="lic {lv}" title="Licence risk: {lab}">{lab}</span> {inline(lic)}</td><td>{inline(mat)}</td><td>{inline(good)}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- see-it index
_, idx = S('11.')
idx_rows = []
for line in idx.split('\n'):
    m = re.match(r'^\| (\d+) \| (.+?) \| (.*?) \| (.+?) \| (.+?) \|$', line)
    if m:
        idx_rows.append(m.groups())
assert len(idx_rows) == 55, len(idx_rows)
CHIPS = [('slime', 'slime'), ('corrode|erosion|durability|armour|gear|shield', 'gear'), ('puddle|pool|creep|goop|surface|tile', 'pools'),
         ('gas|cloud|rain', 'gas and rain'), ('palette|warp|fizzle|flat|texture', 'rendering'), ('noita|powder|sandspiel|sand slide|sandboxels', 'falling sand')]

def idx_table():
    o = ['<div class="idx-tools"><label class="search"><span>Filter</span><input id="idxq" type="search" placeholder="Type a game or effect, e.g. slime" aria-describedby="idxn"></label><span id="idxn" class="mute" aria-live="polite"></span></div>',
         '<div class="chips" role="group" aria-label="Quick filters">' + ''.join(f'<button type="button" data-q="{html.escape(q)}">{lab}</button>' for q, lab in CHIPS) + '</div>',
         '<div class="tbl"><table class="idx" id="idxt"><thead><tr><th>#</th><th>Game / production</th><th>Year</th><th>What to look at</th><th>Link</th></tr></thead><tbody>']
    for n, game, yr, what, link in idx_rows:
        lk = see_link(link) if link.startswith('http') else f'<a class="see" href="{SBX}">Play the Acid Sandbox ↗</a>'
        o.append(f'<tr><td>{n}</td><td>{inline(game)}</td><td>{html.escape(yr)}</td><td>{inline(what)}</td><td>{lk}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- sources
_, srcs = S('14.')
src_html = []
src_intro = srcs.split('**')[0].strip()
sp = re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)
for i in range(1, len(sp), 2):
    group = sp[i]
    items = []
    for l in [l for l in sp[i + 1].split('\n') if re.match(r'^\d+\. ', l)]:
        n, rest = re.match(r'^(\d+)\. (.+)$', l).groups()
        urls = URL_RE.findall(rest)
        first = rest.find('http')
        title = rest[:first].rstrip(': ').rstrip() if first >= 0 else rest
        links, extra_h = [], ''
        if urls:
            for u in urls:
                links.append(f'<a href="{html.escape(u.rstrip(".,;"))}" target="_blank" rel="noopener">{html.escape(short(u))}</a>')
            extra = re.sub(r'[\s;:()]+', ' ', URL_RE.sub('', rest[first:])).strip()
            extra_h = f' <span class="mute">({html.escape(extra)})</span>' if extra else ''
        if n == '2':
            links.append('<a href="vfx-snow-topdown-pixel.html">vfx-snow-topdown-pixel.html</a>')
        if n == '3':
            title = 'Kingsfoil, Acid Sandbox'
            links.append(f'<a href="{SBX}">{SBX} ↗</a>')
        items.append(f'<li id="s{n}" value="{n}"><span class="sn">S{n}</span> {md.renderInline(title)} {" · ".join(links)}{extra_h}</li>')
    src_html.append(f'<h3>{html.escape(group)}</h3><ol class="src">' + ''.join(items) + '</ol>')

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

ctx_html = render(ctx)

# deep dives: 6a table -> interactive matrix figure; 6b models -> equipment chart; 6d -> time chart
t6a = re.search(r'\| Material \|[\s\S]*?\n\n', deep).group(0)
deep = deep.replace(t6a, '@@FIG:materials@@\n\n')
deep = deep.replace('**Per slot [I, from the table and the Sandbox].**', '@@FIG:equip@@\n\n**Per slot [I, from the table and the Sandbox].**')
deep = deep.replace('**Timeline**: seconds of fizz', '@@FIG:timex@@\n\n**Timeline**: seconds of fizz')
deep_html = render(deep)
# a data copy of the 6a table for the figure
mat_rows = []
for line in t6a.strip().split('\n')[2:]:
    c = [x.strip() for x in line.strip().strip('|').split(' | ')]
    mat_rows.append({'m': c[0], 'rate': inline(c[1]), 'prop': inline(c[2]), 'stages': inline(c[3]), 'cue': inline(c[4]), 'hook': inline(c[5])})
assert len(mat_rows) == 9

arch = arch.replace('**Pseudocode [I].**', '@@FIG:stack@@\n\n**Pseudocode [I].**')
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
TOC = [('context', 'The DOOM fire, for acid'), ('summary', 'Executive summary'), ('how-to-read', 'How to read this study'),
       ('timeline', 'Timeline'), ('techniques', 'Technique profiles'), ('scorecard', 'Scorecard'),
       ('deep-dives', 'Deep dives'), ('architecture', 'Layered architecture'), ('sandbox', 'Reference implementation'),
       ('gems', 'Gem findings'), ('learnings', 'Learnings and anti-patterns'), ('see-it', 'See it in action index'),
       ('unverified', 'What remains unverified'), ('roadmap', 'Prototype roadmap'), ('sources', 'Sources')]
FAMSUB = [('fam-a', 'A · Liquid and surface'), ('fam-b', 'B · Material corrosion'), ('fam-c', 'C · Equipment and flesh'),
          ('fam-d', 'D · Creatures'), ('fam-e', 'E · Time and chemistry'), ('fam-f', 'F · Rendering and taste')]
SERIES = S_.series_nav('bar')  # generated from site/catalog.json

def toc_html():
    o = ['<nav class="toc" id="toc" aria-label="Contents"><div class="toc-in">',
         '<a class="toc-home" href="index.html">Kingsfoil artifacts</a>', SERIES,
         '<p class="toc-h">Contents</p><ol>']
    for a, t in TOC:
        o.append(f'<li><a href="#{a}" data-sec="{a}">{t}</a>')
        if a == 'techniques':
            o.append('<ol class="sub">' + ''.join(f'<li><a href="#{x}" data-sec="{x}">{y}</a></li>' for x, y in FAMSUB) + '</ol>')
        o.append('</li>')
    o.append(f'</ol><a class="btn warm toc-play" href="{SBX}">Play the Acid Sandbox ↗</a>')
    o.append('<button class="btn ghost" id="motionBtn" type="button" aria-pressed="false">Pause animations</button>')
    o.append('</div></nav>')
    return ''.join(o)

# ---------------------------------------------------------------- assemble
def section(id_, title, inner, num=None):
    n = f'<span class="secn">{num}</span>' if num else ''
    return f'<section class="sec" id="{id_}"><h2>{n}{html.escape(title)}</h2>{inner}</section>'

fam_ids = ['fam-a', 'fam-b', 'fam-c', 'fam-d', 'fam-e', 'fam-f']
tech_html = [render(intro_fam.replace('The profiles fall into six families:', 'The profiles fall into six families. Open any card for the full profile; the figure after it lets you play with the algorithm.')),
             '<div class="tp-tools"><button class="btn ghost" type="button" data-openall>Open all profiles</button><button class="btn ghost" type="button" data-closeall>Close all</button></div>']
for (fname, pl), fid in zip(families, fam_ids):
    tech_html.append(f'<div class="fam" id="{fid}"><h3 class="famh"><span>{fname.split(":")[0].replace("Family ", "")}</span>{html.escape(fname.split(": ", 1)[1])}</h3>')
    for p in pl:
        tech_html.append(profile_html(p))
    tech_html.append('</div>')

score_html = render(score_intro) + fig('score') + render(score_read)

title = 'Top-down pixel acid: tiny algorithms for liquids that eat the world'
data_js = ('const SCORE=' + json.dumps(rows, ensure_ascii=False) + ';\nconst GENS=' + json.dumps(gens, ensure_ascii=False) +
           ';\nconst MATROWS=' + json.dumps(mat_rows, ensure_ascii=False) + ';\n')

hero = (B / 'hero.html').read_text().replace('@@SERIES@@', SERIES)
css = (B / 'style.css').read_text()
js = ''.join((B / f).read_text() for f in ['core.js', 'demos1.js', 'demos2.js', 'demos3.js', 'demos4.js', 'demos5.js'])

body = [hero, '<div class="layout">' + toc_html() + '<main id="main">']
ctx_note = ('<div class="series"><p><b>One concept per study.</b> This page is study #2 in a VFX series that hunts for old-school, '
            'very simple and very efficient algorithms. Study #1 was <a href="vfx-snow-topdown-pixel.html">top-down pixel snow</a>. '
            'Each study is measured against the same reference: the <b>DOOM PSX fire</b>, a tiny cellular automaton over a buffer of palette indices.</p></div>')
body.append(section('context', 'The DOOM fire, translated into acid', ctx_note + fig('doom') + ctx_html))
body.append(section('summary', 'Executive summary', '<div class="exec">' + render(summ) + '</div>', '1'))
body.append(section('how-to-read', 'How to read this study', legend() + render(read_bullets), '2'))
body.append(section('timeline', 'Generations: a timeline', fig('timeline'), '3'))
body.append(section('techniques', 'Technique profiles', ''.join(tech_html), '4'))
body.append(section('scorecard', 'Comparison scorecard', score_html, '5'))
body.append(section('deep-dives', 'Deep dives', figs_in(deep_html), '6'))
body.append(section('architecture', 'Combinations: a layered architecture for Asterion Online (Godot 4, web)', figs_in(arch_html), '7'))
sbx_cta = ('<div class="cta"><div><p class="cta-t">The Acid Sandbox is the playable version of this study.</p>'
           '<p class="mute">Pour acid, throw lime, spawn slimes, drop items and open the X-ray views of acid, integrity, fumes, stain, rust and glow.</p></div>'
           f'<a class="btn warm big" href="{SBX}">Play the Acid Sandbox ↗</a></div>')
body.append(section('sandbox', 'Reference implementation: the Acid Sandbox', sbx_cta + sbx_html, '8'))
body.append(section('gems', 'Gem findings', render(gem_intro) + gem_table() + render(gem_after), '9'))
body.append(section('learnings', 'Learnings and anti-patterns', render(learn), '10'))
body.append(section('see-it', '“See it in action” index', idx_table(), '11'))
body.append(section('unverified', 'What remains unverified (and corrections)', render(unv), '12'))
body.append(section('roadmap', 'Prototype roadmap for Godot (web)', '<div class="road">' + render(road) + '</div>', '13'))
body.append(section('sources', 'Sources', render(src_intro) + ''.join(src_html), '14'))
body.append('<footer class="foot"><p>Kingsfoil Studios · Research study · November 2026</p>'
            f'<p><a href="{SBX}">Play the Acid Sandbox ↗</a> · <a href="vfx-snow-topdown-pixel.html">Previous study: snow</a> · <a href="index.html">All Kingsfoil artifacts</a> · <a href="#top">Back to top</a></p></footer>')
body.append('</main></div>')

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="A graphical research study of tiny, efficient algorithms for top-down pixel-art acid: flow with a film threshold, material corrosion stages, fair equipment wear, slimes made of the same field, fumes, stains and rust, with live demos.">
<meta name="theme-color" content="#0c0f0a">
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
{''.join(body)}
<script>
{data_js}
{js}
</script>
</body>
</html>
'''
OUT.write_text(page)
nfig = len(re.findall(r'<figure class="fig', page))
print('wrote', OUT, len(page.encode()), 'bytes;', nfig, 'figures')
