#!/usr/bin/env python3
"""Build the single-file study page from the markdown report + style.css + demos JS."""
import re, json, html, sys, pathlib
from markdown_it import MarkdownIt

import sys, pathlib as _pl
sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[2]))  # repo root, for studykit
import studykit
S_ = studykit.ctx(__file__)
B = S_.dir
SRC = S_.report_text
OUT = S_.out_path

md = MarkdownIt('commonmark', {'html': True}).enable('table')
URL_RE = re.compile(r'https?://[^\s<>"\')]+')

# ---------------------------------------------------------------- helpers
def split_code(h):
    """yield (is_code, chunk) so text transforms skip <pre>/<code>/<a>."""
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
    segs = inner.split(';')
    out = []
    for s in segs:
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

def linkify_games(h):
    def fix(p):
        return re.sub(r'(:\s*)?(https?://[^\s<>"\')]+)', lambda m: (' ' if m.group(1) else '') + see_link(m.group(2)), p)
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def linkify_plain(h, label=None):
    def fix(p):
        return URL_RE.sub(lambda m: see_link(m.group(0), label or short(m.group(0))), p)
    return ''.join(p if c else fix(p) for c, p in split_code(h))

def short(u):
    u = u.rstrip('.,;')
    d = re.sub(r'^https?://(www\.)?', '', u).split('/')[0]
    return d + ' ↗'

def hl_code(h):
    """light comment highlight inside <pre><code>"""
    def one(m):
        lang = m.group(1) or ''
        body = m.group(2)
        lines = body.split('\n')
        res = []
        for ln in lines:
            ci = ln.find('//')
            if lang in ('gdscript',) or ln.lstrip().startswith('# '):
                hi = ln.find('# ')
                if hi >= 0 and (lang == 'gdscript' or ln.lstrip().startswith('# ')):
                    ci = hi if ci < 0 else min(ci, hi)
            if ci >= 0:
                ln = ln[:ci] + '<span class="cm">' + ln[ci:] + '</span>'
            res.append(ln)
        cls = f' data-lang="{lang}"' if lang else ''
        return f'<pre class="code"{cls}><code>' + '\n'.join(res) + '</code></pre>'
    return re.sub(r'<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)</code></pre>', one, h)

def render(text, games=False):
    h = md.render(text)
    h = hl_code(h)
    h = tagify(h)
    h = linkify_games(h) if games else linkify_plain(h)
    h = re.sub(r'\(code mirror (<a class="see" [^>]*>)See it in action ↗</a>\)', r'(\1code mirror ↗</a>)', h)
    h = h.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')
    h = h.replace('<code>vfx-snow-sandbox.html</code>', '<a class="sbx" href="vfx-snow-sandbox.html"><code>vfx-snow-sandbox.html</code></a>')
    return h

def inline(text):
    h = md.renderInline(text)
    return linkify_plain(tagify(h))

# ---------------------------------------------------------------- split report
sections = {}
order = []
cur = None
for line in SRC.split('\n'):
    m = re.match(r'^## (.+)$', line)
    if m:
        cur = m.group(1).strip()
        order.append(cur)
        sections[cur] = []
        continue
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
fam_blocks = re.split(r'^### (Family [A-E]: .+)$', tech, flags=re.M)
families = []
for i in range(1, len(fam_blocks), 2):
    fname = fam_blocks[i]
    body = fam_blocks[i + 1]
    profs = re.split(r'^### ([A-E]\d)\. (.+)$', body, flags=re.M)
    plist = []
    for j in range(1, len(profs), 3):
        pid, ptitle, ptext = profs[j], profs[j + 1], profs[j + 2].strip().rstrip('-').strip()
        fields = {}
        keys = [('plain', r'\*In plain words\.\*'), ('tech', r'\*How it works \(technical\)\.\*'),
                ('cost', r'\*Cost / performance\.\*'), ('games', r'\*Games that used it\.\*'),
                ('feel', r'\*How it feels\.\*'), ('risks', r'\*Risks\.\*'), ('ratings', r'\*Ratings:\*')]
        pos = []
        for k, rx in keys:
            mm = re.search(r'^' + rx, ptext, flags=re.M)
            if not mm:
                print('missing', pid, k, file=sys.stderr)
                continue
            pos.append((mm.start(), mm.end(), k))
        pos.sort()
        for n, (a, e, k) in enumerate(pos):
            end = pos[n + 1][0] if n + 1 < len(pos) else len(ptext)
            fields[k] = ptext[e:end].strip()
        rat = [int(x) for x in re.findall(r'(\d)', fields['ratings'])][:5]
        plist.append({'id': pid, 'title': ptitle, 'f': fields, 'r': rat})
    families.append((fname, plist))
intro_fam = tech.split('### Family A')[0].strip()

# scorecard table
_, score = S('5.')
rows = []
for line in score.split('\n'):
    m = re.match(r'^\| ([A-E]\d) \| (.+?) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d+) \| (.+?) \|$', line)
    if m:
        rows.append({'id': m.group(1), 'name': m.group(2), 'r': [int(m.group(k)) for k in range(3, 8)],
                     'sum': int(m.group(8)), 'cost': m.group(9)})
assert len(rows) == 27, len(rows)
score_intro = score.split('|')[0].strip()
score_read = score[score.find('**Reading the table'):].strip()
# sanity: profile ratings == table
tmap = {r['id']: r for r in rows}
for fname, pl in families:
    for p in pl:
        assert tmap[p['id']]['r'] == p['r'], p['id']

FIGS = {}  # id -> html (filled from figs.html)
figsrc = (B / 'figs.html').read_text()
for m in re.finditer(r'<!--FIG (\w+)-->([\s\S]*?)<!--/FIG-->', figsrc):
    FIGS[m.group(1)] = m.group(2).strip()

AFTER_PROFILE = {
    'A1': ['lut'], 'A2': ['cycle'], 'A3': ['hashed', 'cost'], 'A4': ['zflake'],
    'B2': ['lfsr'], 'B4': ['tiledither'], 'B6': ['exposure'], 'B7': ['sandpile'], 'B8': ['caps'],
    'C2': ['footprint'], 'C3': ['trail'], 'C4': ['sink'], 'C6': ['paths'],
    'D2': ['ddf'], 'D3': ['melt'], 'D4': ['states'],
    'E1': ['ramp'], 'E2': ['bayer'], 'E3': ['emboss'], 'E4': ['daynight'],
}
FIELD_LABEL = [('plain', 'In plain words'), ('tech', 'How it works (technical)'), ('cost', 'Cost / performance'),
               ('games', 'Games that used it'), ('feel', 'How it feels'), ('risks', 'Risks')]
RLAB = ['Simplicity', 'Speed', 'Pixel taste', 'Aliveness', 'Interactivity']

def bars(r, big=False):
    cls = 'rbars big' if big else 'rbars'
    out = [f'<span class="{cls}" aria-label="Ratings: ' + ', '.join(f'{RLAB[i]} {v}' for i, v in enumerate(r)) + '">']
    for i, v in enumerate(r):
        out.append(f'<span class="rb" title="{RLAB[i]} {v}/5"><span style="--v:{v}"></span></span>')
    out.append('</span>')
    return ''.join(out)

def fig(name):
    if name not in FIGS:
        print('missing fig', name, file=sys.stderr)
        return ''
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
        body = render(f[k], games=(k == 'games'))
        parts.append(f'<section class="tp-f tp-{k}"><h4>{lab}</h4>{body}</section>')
    parts.append('<section class="tp-f tp-ratings"><h4>Ratings (author judgement, 1–5)</h4><ul class="rlist">')
    for i, v in enumerate(p['r']):
        parts.append(f'<li><span>{RLAB[i]}</span><span class="rbar"><span style="--v:{v}"></span></span><b>{v}</b></li>')
    parts.append('</ul></section></div></details>')
    after = ''.join(fig(n) for n in AFTER_PROFILE.get(p['id'], []))
    return ''.join(parts) + after

# ---------------------------------------------------------------- timeline data
_, tl = S('3.')
gens = []
for blk in re.split(r'^\*\*(Gen \d: .+?)\*\*\s*$', tl, flags=re.M)[1:]:
    pass
gparts = re.split(r'^\*\*(Gen \d): (.+?)\.?\*\*\s*$', tl, flags=re.M)
for i in range(1, len(gparts), 3):
    gid, gtitle, gbody = gparts[i], gparts[i + 1], gparts[i + 2]
    items = []
    curi = None
    for line in gbody.split('\n'):
        if re.match(r'^- ', line):
            curi = [line[2:].strip()]
            items.append(curi)
        elif re.match(r'^\s+- ', line) and curi is not None:
            curi.append(line.strip()[2:])
    ev = []
    for it in items:
        head = it[0]
        txt = head + (' ' + '; '.join(s.rstrip(';.') for s in it[1:]) if len(it) > 1 else '')
        txt = txt.replace(':;', ':').replace(': ;', ':')
        yrs = re.findall(r'\b(19[89]\d|20[0-2]\d)\b', head)
        yr = int(yrs[0]) if yrs else None
        mo = 0
        mm = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', head)
        if mm:
            mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].index(mm.group(1))
        h = tagify(md.renderInline(txt))
        h = re.sub(r'<strong>|</strong>', '', h)
        ev.append({'y': yr, 'm': mo, 'h': h})
    gens.append({'id': gid, 't': gtitle.strip(), 'ev': ev})

# ---------------------------------------------------------------- gems table
_, gem = S('9.')
gem_rows = []
for line in gem.split('\n'):
    if line.startswith('| ') and 'http' in line:
        c = [x.strip() for x in line.strip('|').split(' | ')]
        gem_rows.append(c)
gem_intro = gem.split('|')[0].strip()
gem_after = gem[gem.find('**Licence flags'):]

def gem_table():
    o = ['<div class="tbl"><table class="gems"><thead><tr><th>Name</th><th>Licence</th><th>Maturity evidence</th><th>Good for</th></tr></thead><tbody>']
    for name, url, lic, mat, good in gem_rows:
        risky = '**' in lic
        o.append(f'<tr><td><a href="{html.escape(url)}" target="_blank" rel="noopener">{inline(name)} ↗</a></td>'
                 f'<td class="{"lic-risk" if risky else "lic-ok"}">{inline(lic)}</td><td>{inline(mat)}</td><td>{inline(good)}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- see-it index
_, idx = S('11.')
idx_rows = []
for line in idx.split('\n'):
    m = re.match(r'^\| (\d+) \| (.+?) \| (.*?) \| (.+?) \| (.+?) \|$', line)
    if m:
        idx_rows.append(m.groups())

def idx_table():
    o = ['<div class="idx-tools"><label class="search"><span>Filter</span><input id="idxq" type="search" placeholder="Type a game or effect, e.g. footprints"></label><span id="idxn" class="mute"></span></div>',
         '<div class="tbl"><table class="idx" id="idxt"><thead><tr><th>#</th><th>Game / production</th><th>Year</th><th>What to look at</th><th>Link</th></tr></thead><tbody>']
    for n, game, yr, what, link in idx_rows:
        if link.startswith('http'):
            lk = see_link(link)
        else:
            lk = '<a class="see" href="vfx-snow-sandbox.html">Play the Snow Sandbox ↗</a>'
        o.append(f'<tr><td>{n}</td><td>{inline(game)}</td><td>{html.escape(yr)}</td><td>{inline(what)}</td><td>{lk}</td></tr>')
    o.append('</tbody></table></div>')
    return ''.join(o)

# ---------------------------------------------------------------- sources
_, srcs = S('14.')
src_html = []
src_intro = srcs.split('**')[0].strip()
for blk in re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)[1:]:
    pass
sp = re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)
for i in range(1, len(sp), 2):
    group = sp[i]
    lines = [l for l in sp[i + 1].split('\n') if re.match(r'^\d+\. ', l)]
    items = []
    for l in lines:
        n, rest = re.match(r'^(\d+)\. (.+)$', l).groups()
        urls = URL_RE.findall(rest)
        first = rest.find('http')
        title = rest[:first].rstrip(': ').rstrip() if first >= 0 else rest
        tail = rest
        links = []
        if urls:
            # keep parenthetical labels like (page 3: ...) by showing each url by domain
            for u in urls:
                links.append(f'<a href="{html.escape(u.rstrip(".,;"))}" target="_blank" rel="noopener">{html.escape(short(u))}</a>')
            extra = URL_RE.sub('', rest[first:])
            extra = re.sub(r'[\s;:()]+', ' ', extra).strip()
            # labels such as "page 3", "CG Channel", "AssetLib 5495", "also"
            extra_h = f' <span class="mute">({html.escape(extra)})</span>' if extra else ''
        else:
            extra_h = ''
            if n == '123':
                links.append('<a href="vfx-snow-sandbox.html">vfx-snow-sandbox.html ↗</a>')
        title_h = md.renderInline(title)
        if n == '123':
            title_h = md.renderInline(re.sub(r'\(`vfx-snow-sandbox.html`, ', '(', title))
        items.append(f'<li id="s{n}" value="{n}"><span class="sn">S{n}</span> {title_h} {" · ".join(links)}{extra_h}</li>')
    src_html.append(f'<h3>{html.escape(group)}</h3><ol class="src">' + ''.join(items) + '</ol>')

# ---------------------------------------------------------------- body sections
ctx_k, ctx = S('Context')
sum_k, summ = S('1.')
read_k, readm = S('2.')
deep_k, deep = S('6.')
arch_k, arch = S('7.')
sbx_k, sbx = S('8.')
learn_k, learn = S('10.')
unv_k, unv = S('12.')
road_k, road = S('13.')

# context: the series note is the first paragraph; split out bullets
ctx_html = render(ctx)

# deep dives: insert rates chart after worked example A table text
deep = deep.replace('These are toy speeds for a watchable demo.', '@@FIG:rates@@\n\nThese are toy speeds for a watchable demo.')
deep_html = render(deep)

# architecture: replace the ASCII box with the stack figure
arch_ascii = re.search(r'```\n┌[\s\S]*?```', arch).group(0)
arch = arch.replace(arch_ascii, '@@FIG:stack@@')
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
    o = ['<div class="legend">']
    names = {'V': 'Verified', 'I': 'Inference', 'U': 'Unverified', 'K': 'Known'}
    for k, txt in legend_rows:
        o.append(f'<div class="lg"><b class="tag {TAGCLS[k]} big">{k}</b><div><h4>{names[k]}</h4><p>{inline(txt)}</p></div></div>')
    o.append('</div>')
    return ''.join(o)

# ---------------------------------------------------------------- TOC
TOC = [('context', 'The DOOM fire, for snow'), ('summary', 'Executive summary'), ('how-to-read', 'How to read this study'),
       ('timeline', 'Timeline'), ('techniques', 'Technique profiles'), ('scorecard', 'Scorecard'),
       ('deep-dives', 'Deep dives'), ('architecture', 'Layered architecture'), ('sandbox', 'Reference implementation'),
       ('gems', 'Gem findings'), ('learnings', 'Learnings and anti-patterns'), ('see-it', 'See it in action index'),
       ('unverified', 'What remains unverified'), ('roadmap', 'Prototype roadmap'), ('sources', 'Sources')]
FAMSUB = [('fam-a', 'A · Falling snow'), ('fam-b', 'B · Coverage'), ('fam-c', 'C · Interaction'), ('fam-d', 'D · Time'), ('fam-e', 'E · Rendering')]

def toc_html():
    o = ['<nav class="toc" id="toc" aria-label="Contents"><div class="toc-in">',
         '<a class="toc-home" href="index.html">Kingsfoil artifacts</a>',
         '<p class="toc-h">Contents</p><ol>']
    for i, (a, t) in enumerate(TOC):
        o.append(f'<li><a href="#{a}" data-sec="{a}">{t}</a>')
        if a == 'techniques':
            o.append('<ol class="sub">' + ''.join(f'<li><a href="#{x}" data-sec="{x}">{y}</a></li>' for x, y in FAMSUB) + '</ol>')
        o.append('</li>')
    o.append('</ol><a class="btn warm toc-play" href="vfx-snow-sandbox.html">Play the Snow Sandbox ↗</a>')
    o.append('<button class="btn ghost" id="motionBtn" type="button" aria-pressed="false">Pause animations</button>')
    o.append('</div></nav>')
    return ''.join(o)

# ---------------------------------------------------------------- assemble
def section(id_, title, inner, num=None):
    n = f'<span class="secn">{num}</span>' if num else ''
    return f'<section class="sec" id="{id_}"><h2>{n}{html.escape(title)}</h2>{inner}</section>'

fam_ids = ['fam-a', 'fam-b', 'fam-c', 'fam-d', 'fam-e']
tech_html = [render(intro_fam.replace('The profiles fall into five families:', 'The profiles fall into five families. Open any card for the full profile; the figure after it lets you play with the algorithm.')),
             '<div class="tp-tools"><button class="btn ghost" type="button" data-openall>Open all profiles</button><button class="btn ghost" type="button" data-closeall>Close all</button></div>']
for (fname, pl), fid in zip(families, fam_ids):
    tech_html.append(f'<div class="fam" id="{fid}"><h3 class="famh"><span>{fname.split(":")[0].replace("Family ", "")}</span>{html.escape(fname.split(": ", 1)[1])}</h3>')
    for p in pl:
        tech_html.append(profile_html(p))
    tech_html.append('</div>')

score_html = (render(score_intro) + fig('score') + render(score_read))

title = 'Top-down pixel snow: tiny algorithms that make a winter world feel alive'
data_js = 'const SCORE=' + json.dumps(rows, ensure_ascii=False) + ';\nconst GENS=' + json.dumps(gens, ensure_ascii=False) + ';\n'

hero = (B / 'hero.html').read_text()
css = (B / 'style.css').read_text()
js = ''.join((B / f).read_text() for f in ['core.js', 'demos1.js', 'demos2.js', 'demos3.js', 'demos4.js'])

body = []
body.append(hero)
body.append('<div class="layout">' + toc_html() + '<main id="main">')
# context
ctx_note = ('<div class="series"><p><b>One concept per study.</b> This page is one study in a VFX series that hunts for old-school, '
            'very simple and very efficient algorithms. Each study is measured against the same reference: the '
            '<b>DOOM PSX fire</b>, a tiny cellular automaton over a buffer of palette indices.</p></div>')
body.append(section('context', 'The DOOM fire, translated into snow', ctx_note + fig('doom') + ctx_html))
body.append(section('summary', 'Executive summary', '<div class="exec">' + render(summ) + '</div>', '1'))
body.append(section('how-to-read', 'How to read this study', legend() + render(read_bullets), '2'))
body.append(section('timeline', 'Generations: a timeline', fig('timeline'), '3'))
body.append(section('techniques', 'Technique profiles', ''.join(tech_html), '4'))
body.append(section('scorecard', 'Comparison scorecard', score_html, '5'))
body.append(section('deep-dives', 'Deep dives', figs_in(deep_html), '6'))
body.append(section('architecture', 'Combinations: a layered architecture for Asterion Online (Godot 4, web)', figs_in(arch_html), '7'))
sbx_cta = ('<div class="cta"><div><p class="cta-t">The Snow Sandbox is the playable version of this study.</p>'
           '<p class="mute">Walk, shovel, change the weather and open the X-ray views of depth, exposure, sun shadow, packed and wet.</p></div>'
           '<a class="btn warm big" href="vfx-snow-sandbox.html">Play the Snow Sandbox ↗</a></div>')
body.append(section('sandbox', 'Reference implementation: the Snow Sandbox', sbx_cta + sbx_html, '8'))
body.append(section('gems', 'Gem findings', render(gem_intro) + gem_table() + render(gem_after), '9'))
body.append(section('learnings', 'Learnings and anti-patterns', render(learn), '10'))
body.append(section('see-it', '“See it in action” index', idx_table(), '11'))
body.append(section('unverified', 'What remains unverified (and corrections)', render(unv), '12'))
body.append(section('roadmap', 'Prototype roadmap for Godot (web)', '<div class="road">' + render(road) + '</div>', '13'))
body.append(section('sources', 'Sources', render(src_intro) + ''.join(src_html), '14'))
body.append('<footer class="foot"><p>Kingsfoil Studios · Research study · November 2026</p>' + S_.series_nav('footer') + '<p><a href="vfx-snow-sandbox.html">Play the Snow Sandbox ↗</a> · <a href="index.html">All Kingsfoil artifacts</a> · <a href="#top">Back to top</a></p></footer>')
body.append('</main></div>')

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="A graphical research study of tiny, efficient algorithms for top-down pixel-art snow: falling flakes, accumulation, footprints, melt and palette lighting, with live demos.">
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
print('wrote', OUT, len(page.encode()), 'bytes')
