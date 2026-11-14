"""Recipe for Asterion difficulty and learning curves: skill by use, the death penalty and the long curve of a Tibia-like MMORPG — scaffolded from studies/curves-matchrpg/build.py.
Study-specific copy lives in study.yaml (page_text, figs_after, index_chips, atlas), hero.html, figs*.html and demos*.js.
Series nav comes from the catalog via S_.series_nav().
Atlas tab (docs/formats/design-curves.md): when atlas/data.json exists, the page gets a tab strip under the hero,
the study panel (#study) and an atlas panel (#atlas) of static cards built from data.json plus every atlas/roles-*.json.
No timestamps, everything sorted, so two builds give the same bytes.
"""
import re, json, html, sys, pathlib
from markdown_it import MarkdownIt

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))  # repo root, for studykit
import studykit
S_ = studykit.ctx(__file__)
B = S_.dir
SRC = S_.report_text
OUT = S_.out_path
SBX = S_.sandbox_name
P = S_.cfg.get('page_text', {})
GAME = P['game']
LAB = P.get('lab_name', 'the curve lab')
ITEM = S_.item

md = MarkdownIt('commonmark', {'html': True}).enable('table')
URL_RE = re.compile(r'https?://[^\s<>"`|]+')
RLAB = ['Fun impact', 'Evidence', 'Cheapness', 'Fit', 'Testability']
RSHORT = ['Fun', 'Evid.', 'Cheap', 'Fit', 'Test']


def trim_url(u):
    u = u.rstrip('.,;:')
    while u.endswith(')') and u.count(')') > u.count('('):
        u = u[:-1]
    return u.rstrip('.,;:')


# ---------------------------------------------------------------- inline helpers
def split_code(h):
    parts = re.split(r'(<pre[\s\S]*?</pre>|<code[\s\S]*?</code>|<a [\s\S]*?</a>)', h)
    for i, p in enumerate(parts):
        yield (i % 2 == 1), p


TAGCLS = {'V': 'tv', 'I': 'ti', 'U': 'tu', 'K': 'tk'}
TAGTITLE = {'V': 'Verified in a source our researchers read', 'I': 'Author inference or design proposal',
            'U': 'Unverified lead', 'K': 'Kingsfoil fact, from the game repo or play logs'}
GRADETITLE = {'E1': 'Evidence grade E1: data or telemetry', 'E2': 'Evidence grade E2: designer statement',
              'E3': 'Evidence grade E3: community consensus', 'E4': 'Evidence grade E4: anecdote'}
CITE_RE = re.compile(r'\[([^\[\]<>]{1,120})\]')
LEAD_RE = re.compile(r'^\s*((?:V|I|U|K)(?:/(?:V|I|U|K))?)(?=[\s,;]|$)')
GRADE_RE = re.compile(r'\bE([1-4])\b')


def sref(t):
    t = GRADE_RE.sub(lambda m: f'<b class="grade g{m.group(1)}" title="{GRADETITLE["E" + m.group(1)]}">E{m.group(1)}</b>', t)
    return re.sub(r'\bS(\d{1,3})\b', lambda m: f'<a class="sref" href="#s{m.group(1)}">S{m.group(1)}</a>', t)


def cite_repl(m):
    inner = m.group(1)
    if not (LEAD_RE.match(inner) or re.match(r'^\s*(S\d|E[1-4]\b)', inner)):
        return m.group(0)
    out = []
    for s in inner.split(';'):
        lm = LEAD_RE.match(s)
        if lm:
            tag = lm.group(1)
            rest = s[lm.end():].lstrip(' ,')
            piece = f'<b class="tag {TAGCLS[tag[0]]}" title="{TAGTITLE[tag[0]]}">{tag}</b>'
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
    return re.sub(r'^https?://(www\.)?', '', trim_url(u)).split('/')[0] + ' ↗'


def linkify(h):
    def fix(p):
        return URL_RE.sub(lambda m: see_link(trim_url(m.group(0)), short(m.group(0))) + m.group(0)[len(trim_url(m.group(0))):], p)
    return ''.join(p if c else fix(p) for c, p in split_code(h))


def hl_code(h):
    def one(m):
        lang = m.group(1) or 'pseudocode'
        res = []
        for ln in m.group(2).split('\n'):
            ci = ln.find('//')
            hi = ln.find('# ') if ln.lstrip().startswith('# ') else (ln.find('  # ') + 2 if '  # ' in ln else -1)
            if hi >= 0:
                ci = hi if ci < 0 else min(ci, hi)
            if ci >= 0:
                ln = ln[:ci] + '<span class="cm">' + ln[ci:] + '</span>'
            res.append(ln)
        return f'<pre class="code" data-lang="{lang}"><code>' + '\n'.join(res) + '</code></pre>'
    return re.sub(r'<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)</code></pre>', one, h)


def sbx_links(h):
    return h.replace(f'<code>{SBX}</code>', f'<a class="sbx" href="{SBX}"><code>{SBX}</code></a>') if SBX else h


USED = []
FIGS = {}
for m in re.finditer(r'<!--FIG (\w+)-->([\s\S]*?)<!--/FIG-->', ''.join(p.read_text() for p in sorted(B.glob('figs*.html')))):
    FIGS[m.group(1)] = tagify(m.group(2).strip())


def fig(name):
    if name not in FIGS:
        sys.exit(f'missing fig {name}')
    USED.append(name)
    return FIGS[name]


def render(text):
    h = md.render(text)
    h = hl_code(h)
    h = tagify(h)
    h = linkify(h)
    h = h.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')
    h = re.sub(r'<p>@@FIG:(\w+)@@</p>', lambda m: fig(m.group(1)), h)
    return sbx_links(h)


def inline(text):
    return sbx_links(linkify(tagify(md.renderInline(text))))


def cells(line):
    return [x.strip() for x in line.strip().strip('|').split(' | ')]


def table(text, head):
    """Find the markdown table whose header starts with `head`; return (before, rows, after)."""
    lines = text.split('\n')
    ti = next((i for i, l in enumerate(lines) if l.startswith(head)), None)
    if ti is None:
        sys.exit(f'table "{head}" not found')
    j = ti + 2
    rows = []
    while j < len(lines) and lines[j].startswith('|'):
        rows.append(cells(lines[j])); j += 1
    return '\n'.join(lines[:ti]).strip(), rows, '\n'.join(lines[j:]).strip(), '\n'.join(lines[ti:j])


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
    sys.exit(f'section "{prefix}" not found')


def heading(prefix):
    k, _ = S(prefix)
    return re.sub(r'^\d+\.\s*', '', k)


# ---------------------------------------------------------------- §7 pattern cards
_, cards_md = S('7.')
fam_blocks = re.split(r'^### (Family [A-H]: .+)$', cards_md, flags=re.M)
KEYS = [('lineage', r'\*Lineage\.\*', 'Lineage'), ('feel', r'\*Feeling\.\*', 'Feeling it produces'),
        ('mech', r'\*Mechanism\.\*', 'Mechanism'), ('cond', r'\*Works when / breaks when\.\*', 'Works when / breaks when'),
        ('evid', r'\*Evidence\.\*', 'Evidence'), ('cost', r'\*Cost and knobs\.\*', 'Cost and knobs'),
        ('map', r'\*In ' + re.escape(GAME) + r'\.\*', f'In {GAME}'), ('ratings', r'\*Ratings 1–5 \(author judgement\):\*', None)]
families = []
for i in range(1, len(fam_blocks), 2):
    fname, body = fam_blocks[i], fam_blocks[i + 1]
    parts = re.split(r'^### ([A-H]\d)\. (.+)$', body, flags=re.M)
    plist = []
    for j in range(1, len(parts), 3):
        pid, ptitle, ptext = parts[j], parts[j + 1], parts[j + 2].strip().rstrip('-').strip()
        pos = []
        for k, rx, _ in KEYS:
            mm = re.search(r'^' + rx, ptext, flags=re.M)
            if not mm:
                sys.exit(f'card {pid}: missing field marker for {k}')
            pos.append((mm.start(), mm.end(), k))
        if [p[2] for p in sorted(pos)] != [k for k, _, _ in KEYS]:
            sys.exit(f'card {pid}: field markers out of order')
        fields = {}
        for n, (a, e, k) in enumerate(pos):
            end = pos[n + 1][0] if n + 1 < len(pos) else len(ptext)
            fields[k] = ptext[e:end].strip()
        rat = [int(x) for x in re.findall(r'(\d)', fields['ratings'])]
        if len(rat) != 5:
            sys.exit(f'card {pid}: ratings line needs exactly five digits')
        plist.append({'id': pid, 'title': ptitle, 'f': fields, 'r': rat})
    families.append((fname, plist))
cards_intro = cards_md.split('### Family A')[0].strip()
CARDS = [p for _, pl in families for p in pl]
NCARD = len(CARDS)
FIGS_AFTER = S_.cfg.get('figs_after', {}) or {}


def bars(r):
    o = ['<span class="rbars" aria-label="Ratings: ' + ', '.join(f'{RLAB[i]} {v}' for i, v in enumerate(r)) + '">']
    o += [f'<span class="rb" title="{RLAB[i]} {v}/5"><span style="--v:{v}"></span></span>' for i, v in enumerate(r)]
    return ''.join(o) + '</span>'


def card_html(p):
    f = p['f']
    o = [f'<details class="tp" id="t-{p["id"].lower()}">',
         f'<summary><span class="tp-id">{p["id"]}</span><span class="tp-t">{inline(p["title"])}</span>'
         f'{bars(p["r"])}<span class="tp-sum" title="Sum of the five ratings">{sum(p["r"])}</span></summary><div class="tp-body">']
    for k, _, lab in KEYS:
        if lab:
            o.append(f'<section class="tp-f tp-{k}"><h4>{html.escape(lab)}</h4>{render(f[k])}</section>')
    o.append('<section class="tp-f tp-ratings"><h4>Ratings (author judgement, 1–5)</h4><ul class="rlist">')
    o += [f'<li><span>{RLAB[i]}</span><span class="rbar"><span style="--v:{v}"></span></span><b>{v}</b></li>' for i, v in enumerate(p['r'])]
    o.append('</ul>')
    after = FIGS_AFTER.get(p['id'], [])
    o += [f'<p class="tp-fig">Try it: <a href="#fig-{n}">@REF:{n}</a> below the card.</p>' for n in after]
    o.append('</section></div></details>')
    return ''.join(o) + ''.join(fig(n) for n in after)


# ---------------------------------------------------------------- §8 scorecard
_, score = S('8.')
rows = []
for line in score.split('\n'):
    m = re.match(r'^\| ([A-H]\d) \| (.+?) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d) \| (\d+) \|$', line)
    if m:
        rows.append({'id': m.group(1), 'name': m.group(2), 'r': [int(m.group(k)) for k in range(3, 8)], 'sum': int(m.group(8))})
tmap = {r['id']: r for r in rows}
if set(tmap) != {p['id'] for p in CARDS}:
    sys.exit(f'scorecard rows {sorted(tmap)} do not match cards {[p["id"] for p in CARDS]}')
for p in CARDS:
    if tmap[p['id']]['r'] != p['r'] or tmap[p['id']]['sum'] != sum(p['r']):
        sys.exit(f'scorecard row {p["id"]} does not match its card ratings or sum')
score_intro = score.split('\n|')[0].strip()
score_read = score[score.rfind('|') + 1:].strip()
SEL0 = [r['id'] for r in sorted(rows, key=lambda r: -r['sum'])[:3]]

# ---------------------------------------------------------------- §6 timeline
_, tl = S('6.')
gens = []
gparts = re.split(r'^\*\*(Gen \d): (.+?)\*\*\s*$', tl, flags=re.M)
MON = {m: i for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
YEAR_HEAD = r'\*\*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?≤?\d{4}(?:–\d{2})?\*\*'
for i in range(1, len(gparts), 3):
    gid, gtitle, gbody = gparts[i], gparts[i + 1].rstrip('.'), gparts[i + 2]
    ev = []
    for line in gbody.split('\n'):
        if not line.startswith('- '):
            continue
        for ch in [c.strip().rstrip(';').rstrip('.').strip() for c in re.split(r'(?:;\s*|\.\s+)(?=' + YEAR_HEAD + ')', line[2:].strip()) if c.strip()]:
            m = re.match(r'\*\*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?≤?(\d{4})(?:–\d{2})?\*\*', ch)
            yr, mo = None, 0
            if m:
                yr = int(m.group(2)); mo = MON[m.group(1)] + .5 if m.group(1) else 0
            else:
                mm = re.search(r'\((\d{4}) onward\)', ch)
                yr = int(mm.group(1)) if mm else None
            ev.append({'y': yr, 'm': mo, 'h': tagify(md.renderInline(ch + '.'))})
    gens.append({'id': gid, 't': gtitle.strip(), 'ev': ev})
if not 2 <= len(gens) <= 6:
    sys.exit(f'timeline needs 2-6 generations, found {len(gens)}')
tl_intro = re.split(r'^\*\*Gen 1', tl, flags=re.M)[0].strip()

# ---------------------------------------------------------------- §5 twins
_, tw = S('5.')
tw_before, tw_rows, tw_after, tw_tbl = table(tw, '| Twin |')
COND = ['Input', 'Session', 'Randomness', 'Cost of failure', 'Social', 'Platform']
MARK = {'●': 2, '◐': 1, '○': 0}
twins = []
for r in tw_rows:
    if len(r) != 8:
        sys.exit(f'twin row needs 8 cells: {r[0]}')
    cs = []
    for c in r[1:7]:
        k = c[:1]
        if k not in MARK:
            sys.exit(f'twin {r[0]}: condition cell must start with ●, ◐ or ○: "{c}"')
        cs.append({'m': MARK[k], 't': inline(c[1:].strip())})
    twins.append({'n': inline(r[0]), 'c': cs, 'why': inline(r[7]), 'score': sum(x['m'] for x in cs)})


def twins_fig():
    o = ['<figure class="fig" data-demo="twins" id="fig-twins"><div class="fig-h"><span class="fig-n">Fig. @N</span>'
         f'<h4 class="fig-t">Structural twins: which conditions each game shares with {html.escape(GAME)}</h4></div>',
         '<div class="tbl"><table class="twins"><thead><tr><th data-s="n">Twin</th>'
         + ''.join(f'<th data-s="{i}">{c}</th>' for i, c in enumerate(COND)) + '<th data-s="score">Match</th></tr></thead><tbody></tbody></table></div>',
         '<div class="readout" data-ro aria-live="polite"></div>',
         f'<figcaption>Each cell is ● same as {html.escape(GAME)}, ◐ partly, or ○ different. Match counts ● as 2 and ◐ as 1, out of 12. '
         'Click a header to sort, click a row to read why the twin was chosen. Conditions come from §5; the match score is a reading aid, not evidence.</figcaption></figure>']
    return ''.join(o)


FIGS['twins'] = twins_fig()

# ---------------------------------------------------------------- §3 fun hypotheses, §9 experiments, §14 backlog
_, hyp = S('3.')
_, nexp = S('9.')
_, backlog_md = S('14.')
bl_before, bl_rows, bl_after, bl_tbl = table(backlog_md, '| Rank |')
COSTN = {'S': 1, 'M': 2, 'L': 3}
backlog = []
for r in bl_rows:
    rank, change, cards_c, imp, cost, scr, hy = r
    if cost not in COSTN:
        sys.exit(f'backlog rank {rank}: cost must be S, M or L')
    want = round(int(imp) / COSTN[cost], 1)
    if abs(float(scr) - want) > .05:
        sys.exit(f'backlog rank {rank}: score {scr} should be {want}')
    backlog.append({'rank': int(rank), 'change': inline(change), 'cards': cards_c, 'imp': int(imp), 'cost': cost, 'score': float(scr), 'hyp': hy})
if [b['score'] for b in backlog] != sorted([b['score'] for b in backlog], reverse=True):
    sys.exit('backlog rows must be sorted by score')


def backlog_fig():
    return ('<figure class="fig" data-demo="backlog" id="fig-backlog"><div class="fig-h"><span class="fig-n">Fig. @N</span>'
            '<h4 class="fig-t">The backlog on one chart: fun impact against cost</h4><span class="illu">Author judgement</span></div>'
            '<div class="duo wide-l"><div><svg class="chart" style="max-width:460px" role="img" aria-label="Backlog items plotted by fun impact and build cost"></svg></div>'
            '<div class="readout" data-ro aria-live="polite"></div></div>'
            '<figcaption>Each dot is a row of the §14 table. Up is more fun impact (1–5), left is cheaper (S, M, L). The top-left corner is where to start. '
            'Hover or tap a dot to read the change, its pattern cards and the hypothesis it tests.</figcaption></figure>')


FIGS['backlog'] = backlog_fig()

# ---------------------------------------------------------------- §11 Curve Spec stack
_, spec = S('11.')
lay_block = re.search(r'\*\*Layers, bottom to top\.\*\*\n((?:\d+\. .*\n?)+)', spec)
if not lay_block:
    sys.exit('§11 needs a "**Layers, bottom to top.**" numbered list')
layers = re.findall(r'^(\d+)\. \*\*(.+?)\*\* (.+)$', lay_block.group(1), flags=re.M)
spec = spec.replace(lay_block.group(0), '@@FIG:stack@@\n\n')


def stack_fig():
    o = ['<figure class="fig" data-demo="stack" id="fig-stack"><div class="fig-h"><span class="fig-n">Fig. @N</span>'
         f'<h4 class="fig-t">The Curve Spec for {html.escape(GAME)}, bottom to top</h4><span class="illu">Design proposal</span></div>',
         '<div class="stack"><div class="layers">']
    tpl = []
    for n, name, txt in reversed(layers):
        nm = name.rstrip('.')
        o.append(f'<button type="button" class="layer" data-l="L-{n}"><b>{n}</b><span>{inline(nm)}</span></button>')
        tpl.append(f'<template id="L-{n}"><h4>{n} · {inline(nm)}</h4><p>{inline(txt)}</p></template>')
    o.append('</div><div class="ldet" aria-live="polite"></div></div>' + ''.join(tpl))
    o.append('<figcaption>Click a layer to read its rule from §11. Lower layers set the frame the upper ones tune. The whole spec is a design proposal to test with the collective '
             '<span class="cite"><b class="tag ti">I</b></span>.</figcaption></figure>')
    return ''.join(o)


FIGS['stack'] = stack_fig()

# ---------------------------------------------------------------- §15 see-it index
_, idx = S('15.')
idx_rows = [m.groups() for m in (re.match(r'^\| (\d+) \| (.+?) \| (.+?) \| (\S+?) \|$', l) for l in idx.split('\n')) if m]
CHIPS = S_.cfg.get('index_chips', []) or []


def idx_table():
    o = ['<div class="idx-tools"><label class="search"><span>Filter</span><input id="idxq" type="search" placeholder="Type a game or idea, e.g. wave" aria-describedby="idxn"></label><span id="idxn" class="mute" aria-live="polite"></span></div>']
    if CHIPS:
        o.append('<div class="chips" data-idx role="group" aria-label="Quick filters">' + ''.join(f'<button type="button" data-q="{html.escape(c["q"])}">{html.escape(c["label"])}</button>' for c in CHIPS) + '</div>')
    o.append('<div class="tbl"><table class="idx" id="idxt"><thead><tr><th>#</th><th>Game</th><th>Curve idea</th><th>Link</th></tr></thead><tbody>')
    o += [f'<tr><td>{n}</td><td>{inline(g)}</td><td>{inline(w)}</td><td>{see_link(u)}</td></tr>' for n, g, w, u in idx_rows]
    o.append('</tbody></table></div>')
    if SBX:
        o.append(f'<p class="mute">Want to tune these curves instead of reading about them? <a href="{SBX}">Open {html.escape(LAB)} ↗</a></p>')
    return ''.join(o)


# ---------------------------------------------------------------- §17 sources
_, srcs = S('17.')
src_intro = srcs.split('\n**')[0].strip()
sp_ = re.split(r'^\*\*(.+?)\*\*\s*$', srcs, flags=re.M)
src_html, NSRC = [], 0
for i in range(1, len(sp_), 2):
    items = []
    for l in [l for l in sp_[i + 1].split('\n') if re.match(r'^\d+\. ', l)]:
        n, rest = re.match(r'^(\d+)\. (.+)$', l).groups()
        NSRC += 1
        urls = [trim_url(u) for u in URL_RE.findall(rest)]
        first = rest.find('http')
        title = rest[:first].rstrip(': ').rstrip() if first >= 0 else rest
        links = [f'<a href="{html.escape(u)}" target="_blank" rel="noopener">{html.escape(short(u))}</a>' for u in urls]
        items.append(f'<li id="s{n}" value="{n}"><span class="sn">S{n}</span> {tagify(md.renderInline(title))} {" · ".join(links)}</li>')
    src_html.append(f'<h3>{inline(sp_[i])}</h3><ol class="src">' + ''.join(items) + '</ol>')

# ---------------------------------------------------------------- §2 legend
_, readm = S('2.')
legend_rows = re.findall(r'^\| \*\*\[(\w)\]\*\* \| (.+) \|$', readm, flags=re.M)
grade_rows = re.findall(r'^\| \*\*(E[1-4])\*\* \| (.+) \|$', readm, flags=re.M)
read_rest = re.sub(r'^\|.*\n?', '', readm, flags=re.M).strip()


def legend():
    names = {'V': 'Verified', 'I': 'Inference', 'U': 'Unverified', 'K': 'Kingsfoil fact'}
    o = ['<div class="legend">']
    o += [f'<div class="lg"><b class="tag {TAGCLS[k]} big">{k}</b><div><h4>{names[k]}</h4><p>{inline(t)}</p></div></div>' for k, t in legend_rows]
    o.append('</div><div class="legend grades">')
    o += [f'<div class="lg"><b class="grade g{g[1]} big">{g}</b><div><p>{inline(t)}</p></div></div>' for g, t in grade_rows]
    o.append('</div>')
    return ''.join(o)


# ---------------------------------------------------------------- Atlas tab (optional; atlas/data.json + atlas/roles-*.json)
ATLAS = S_.cfg.get('atlas', {}) or {}
ATLAS_TITLE = ATLAS.get('title', f'{GAME} Atlas')
KIND_LABEL = {'weapon-melee': 'Melee weapons', 'weapon-distance': 'Distance weapons', 'weapon-wand': 'Wands', 'ammo': 'Ammunition',
              'shield': 'Shields', 'armor-head': 'Helmets', 'armor-body': 'Body armour', 'armor-legs': 'Legs', 'armor-feet': 'Boots',
              'armor-other': 'Other worn pieces', 'potion': 'Potions', 'food': 'Food and drink', 'currency': 'Currency', 'container': 'Containers',
              'tool': 'Tools', 'quest': 'Quest items', 'material': 'Materials', 'light': 'Lights', 'other': 'Other'}
KIND_ORDER = list(KIND_LABEL)
WORLD_LABEL = {'akron': ('Akron', 'the homeworld, levels 1 to 35'), 'ingwen': ('Ingwen', 'by boat from Akron, levels 35 to 100'),
               'gorothland': ('Gorothland', 'by boat from Ingwen, levels 100 and up'), 'boggland': ('Boggland', 'the far world, bands 75 to 175'),
               'none': ('No spawn', 'quest mini-bosses, escorts and training dummies that no spawn places')}
WORLD_ORDER = ['akron', 'ingwen', 'gorothland', 'boggland', 'none']
GROUP_LABEL = {'attack': ('Attack', 'damage, fields and runes that hurt'), 'healing': ('Healing', 'heals and cures'), 'support': ('Support', 'buffs, light, recall and rune crafting')}
GROUP_ORDER = ['attack', 'healing', 'support']


def _pct(x):
    v = round(x * 100, 1)
    return f'{int(v)} %' if v == int(v) else f'{v} %'


def _rng(a, b):
    return f'{a}' if a == b else f'{a}–{b}'


def _ms(ms):
    s = ms / 1000
    return f'{int(s)} s' if s == int(s) else f'{s:g} s'


def atlas_build():
    """Returns (tab strip html, atlas section html, card count) or ('', '', 0) when the study has no atlas."""
    dp = B / 'atlas' / 'data.json'
    if not dp.exists():
        return '', '', 0
    data = json.loads(dp.read_text())
    roles = {}
    for p in sorted((B / 'atlas').glob('roles-*.json')):
        roles.update(json.loads(p.read_text()))
    cell = data.get('cell', 64)
    E = html.escape
    C, I, SP = data['creatures'], data['items'], data['spells']
    known = {r['slug'] for r in C + I + SP}
    item_name = {i['slug']: i['name'] for i in I}
    creature_slug = {c['name']: c['slug'] for c in C}
    spell_name = {s['slug']: s['name'] for s in SP}

    def link(slug, name):
        return f'<a href="#atlas-{E(slug)}">{E(name)}</a>' if slug in known else E(name)

    def card(rec, kind, stat, det, badge=''):
        col, row = rec['sprite']
        role = roles.get(rec['slug']) or rec.get('intent') or ''
        o = [f'<article class="acard" id="atlas-{E(rec["slug"])}">',
             f'<i class="spr" style="--x:{col};--y:{row}"></i>',
             f'<h4>{E(rec["name"])}{badge}</h4>']
        if role:
            o.append(f'<p class="role">{E(role)}</p>')
        o.append('<p class="stat">' + ' · '.join(stat) + '</p>')
        if det:
            o.append('<p class="det">' + ' '.join(det) + '</p>')
        return ''.join(o) + '</article>'

    def creature_card(c):
        st = [f'<b>{c["hp"]:,}</b> HP', f'dmg <b>{_rng(*c["dmg"]) if c.get("dmg") else "none"}</b>', f'armor {c["armor"] or 0}', f'<b>{(c["exp"] or 0):,}</b> exp']
        st.append(f'band L{c["farm_level"]}' if c.get('farm_level') else 'no band')
        if c.get('behavior'):
            st.append(E(c['behavior']))
        if c.get('range') and c['range'] > 1:
            st.append(f'range {c["range"]}' + (f', keeps {c["keep_distance"]}' if c.get('keep_distance') else ''))
        if c.get('element'):
            st.append(E(c['element']))
        if c.get('abilities'):
            st.append('abilities: ' + E(', '.join(c['abilities'])))
        loot = ', '.join(f'{link(l["item"], item_name.get(l["item"], l["item"]))} ({_pct(l["chance"])}, {_rng(l["min"], l["max"])})' for l in c['loot'])
        det = ['Loot: ' + loot + '.'] if loot else ['No loot.']
        if len(c.get('worlds') or []) > 1:
            det.append('Also spawns in ' + E(', '.join(WORLD_LABEL[w][0] for w in c['worlds'] if w != c['world'])) + '.')
        return card(c, 'creature', st, det, ' <b class="badge">boss</b>' if c.get('boss') else '')

    def item_card(i):
        st = [E(i['kind'])]
        for k, lab in [('attack', 'attack'), ('defense', 'defense'), ('armor', 'armor'), ('capacity', 'capacity'), ('light', 'light'), ('speed', 'speed +')]:
            if i.get(k):
                st.append(f'{lab}{"" if lab.endswith("+") else " "}<b>{i[k]}</b>')
        if i.get('range') and i['range'] > 1:
            st.append(f'range {i["range"]}')
        if i.get('ammo'):
            st.append('ammo ' + link(i['ammo'], item_name.get(i['ammo'], i['ammo'])))
        if i.get('weapon_mana'):
            st.append(f'{i["weapon_mana"]} mana a shot' + (f', {E(i["weapon_element"])}' if i.get('weapon_element') else ''))
        if i.get('heal'):
            st.append(f'heals <b>{_rng(*i["heal"])}</b>')
        if i.get('mana'):
            st.append(f'mana <b>{_rng(*i["mana"])}</b>')
        if i.get('edible'):
            st.append(f'food {i["edible"]} ({i["edible"] * 12} s of regen)')
        if i.get('min_level'):
            st.append(f'<b>level {i["min_level"]}</b>')
        if i.get('min_magic_level'):
            st.append(f'<b>magic {i["min_magic_level"]}</b>')
        if i.get('value'):
            st.append(f'value {i["value"]:,}')
        if i.get('worth'):
            st.append(f'worth <b>{i["worth"]:,}</b>')
        if i.get('stackable'):
            st.append('stackable')
        if i.get('use'):
            st.append('use: ' + E(i['use'].replace('_', ' ')))
        if i.get('rune_spell'):
            st.append('casts ' + link(i['rune_spell'], spell_name.get(i['rune_spell'], i['rune_spell'])))
        det = []
        if i['sold_by']:
            by_price = {}
            for s in sorted(i['sold_by'], key=lambda s: (s['price'], s['npc'])):
                by_price.setdefault(s['price'], []).append(E(s['npc']))
            det.append('Sold by ' + '; '.join(f'{", ".join(n)} for {pr:,}' for pr, n in by_price.items()) + '.')
        if i['dropped_by']:
            names = sorted(i['dropped_by'])
            det.append('Dropped by ' + ', '.join(link(creature_slug.get(n, ''), n) for n in names[:6]) + (f' +{len(names) - 6} more' if len(names) > 6 else '') + '.')
        if i.get('quest_item'):
            det.append('Quest item: a reward that death destroys and shops refuse.')
        elif not i.get('worth') and not i.get('value'):
            det.append('Not for sale and worth nothing at a shop.')
        elif not i['sold_by']:
            det.append('No shop sells it; shopkeepers buy it back at 30 %.')
        return card(i, 'item', st, det)

    def spell_card(s):
        st = [E(s['group']), f'<b>{s["mana"]}</b> mana' if s['mana'] else 'no mana (rune)', f'<b>ML {s["min_ml"]}</b>']
        if s.get('power'):
            st.append(f'power {_rng(*s["power"])} +{_rng(*s["power_ml"])} per ML')
        if s.get('element'):
            st.append(E(s['element']))
        if s.get('range'):
            st.append(f'range {s["range"]}')
        if s.get('radius'):
            st.append(f'radius {s["radius"]}')
        if s.get('length'):
            st.append(f'length {s["length"]}')
        if s.get('duration_ms'):
            st.append(f'{_ms(s["duration_ms"])}' + (f' every {_ms(s["tick_ms"])}' if s.get('tick_ms') else ''))
        if s.get('cast_ms'):
            st.append(f'cast {_ms(s["cast_ms"])}')
        if s.get('cooldown_ms'):
            st.append(f'cooldown {_ms(s["cooldown_ms"])}')
        if s.get('words'):
            st.append(f'<q>{E(s["words"])}</q>')
        det = []
        if s['taught_by']:
            parts = []
            for t in sorted(s['taught_by'], key=lambda t: (t['npc'], t['price'])):
                p = f'{E(t["npc"])} ' + (f'for {t["price"]:,} gold' if t['price'] else 'for free')
                if t.get('needs'):
                    needs = []
                    for n in t['needs']:
                        w = n.split(' ', 1)
                        if len(w) == 2 and w[0] == 'knows':
                            needs.append('knows ' + link(w[1], spell_name.get(w[1], w[1])))
                        elif len(w) == 2 and w[0] == 'item':
                            needs.append('an item: ' + link(w[1], item_name.get(w[1], w[1])))
                        else:
                            needs.append(E(n))
                    p += ' (needs ' + ', '.join(needs) + ')'
                parts.append(p)
            det.append('Taught by ' + '; '.join(parts) + '.')
        else:
            det.append('No teacher: ' + ('rune only, cast from a stone.' if s.get('rune_only') else 'not taught by any NPC.'))
        if s.get('creates'):
            det.append('Creates ' + link(s['creates'], item_name.get(s['creates'], s['creates'])) + '.')
        if s.get('reagent'):
            det.append('Needs ' + link(s['reagent'], item_name.get(s['reagent'], s['reagent'])) + '.')
        return card(s, 'spell', st, det)

    def group(gid, label, note, cards, unit):
        return (f'<div class="agroup" id="atlas-g-{E(gid)}"><h3>{E(label)} <small>{len(cards)} {unit}</small></h3>'
                + (f'<p class="ag-note">{E(note)}</p>' if note else '') + '<div class="agrid">' + ''.join(cards) + '</div></div>')

    panels, tabs = [], []
    # creatures by world, sorted by exp then name
    g = []
    for w in WORLD_ORDER:
        cs = sorted([c for c in C if c['world'] == w], key=lambda c: (c['exp'], c['name']))
        if cs:
            lab, note = WORLD_LABEL[w]
            g.append(group('w-' + w, lab, note, [creature_card(c) for c in cs], 'creatures'))
    panels.append(f'<div class="apanel" data-t="creatures">{"".join(g)}</div>'); tabs.append(('creatures', f'Creatures · {len(C)}'))
    # items by kind, sorted by min_level then worth then name
    g = []
    for k in KIND_ORDER + sorted({i['kind'] for i in I} - set(KIND_ORDER)):
        its = sorted([i for i in I if i['kind'] == k], key=lambda i: (i.get('min_level') or 0, i.get('worth') or 0, i['name']))
        if its:
            g.append(group('k-' + k, KIND_LABEL.get(k, k), '', [item_card(i) for i in its], 'items'))
    panels.append(f'<div class="apanel" data-t="items">{"".join(g)}</div>'); tabs.append(('items', f'Items · {len(I)}'))
    # spells by group, sorted by min_ml then mana then name
    g = []
    for k in GROUP_ORDER + sorted({s['group'] for s in SP} - set(GROUP_ORDER)):
        ss = sorted([s for s in SP if s['group'] == k], key=lambda s: (s['min_ml'], s['mana'], s['name']))
        if ss:
            lab, note = GROUP_LABEL.get(k, (k, ''))
            g.append(group('s-' + k, lab, note, [spell_card(s) for s in ss], 'spells'))
    panels.append(f'<div class="apanel" data-t="spells">{"".join(g)}</div>'); tabs.append(('spells', f'Spells · {len(SP)}'))
    n = len(C) + len(I) + len(SP)
    strip = (f'<nav class="pagetabs" aria-label="Page"><a href="#study" class="on" aria-current="page">Study</a>'
             f'<a href="#atlas">{E(ATLAS_TITLE)} · {n} cards</a></nav>')
    intro = inline(ATLAS['intro']) if ATLAS.get('intro') else ''
    sec = [f'<section id="atlas" class="atlas" aria-labelledby="atlas-h"><h2 id="atlas-h">{E(ATLAS_TITLE)} <small>{n} cards · {len(C)} creatures, {len(I)} items, {len(SP)} spells</small></h2>']
    if intro:
        sec.append(f'<p class="atlas-intro">{intro}</p>')
    sec.append('<div class="atlas-tools"><div class="atabs" role="tablist" aria-label="Atlas section">'
               + ''.join(f'<button type="button" role="tab" data-t="{t}"{" class=on aria-selected=true" if i == 0 else " aria-selected=false"}>{E(lab)}</button>' for i, (t, lab) in enumerate(tabs))
               + '</div><label class="afilter"><span>Filter</span><input type="search" placeholder="name, role, loot, NPC"><output aria-live="polite"></output></label>'
               + '<a class="atlas-back" href="#study">Back to the study</a></div>')
    sec += panels
    sec.append(f'<p class="mute atlas-foot">Data: <code>atlas/data.json</code> from the game repo at commit {E(str(data.get("repo_commit", "")))}; '
               f'role lines from <code>atlas/roles-*.json</code>; sprites packed by <code>atlas/make_atlas.py</code> into one {cell} px sheet. '
               f'<a href="#study">Back to the study</a> · <a href="#top">Back to top</a></p></section>')
    return strip, ''.join(sec), n


# ---------------------------------------------------------------- assemble
def section(id_, title, inner, num=None):
    n = f'<span class="secn">{num}</span>' if num else ''
    return f'<section class="sec" id="{id_}"><h2>{n}{html.escape(title)}</h2>{inner}</section>'


SECS = [('context', 'Context', None), ('summary', '1.', '1'), ('how-to-read', '2.', '2'), ('hypotheses', '3.', '3'),
        ('current', '4.', '4'), ('twins', '5.', '5'), ('timeline', '6.', '6'), ('cards', '7.', '7'), ('scorecard', '8.', '8'),
        ('experiments', '9.', '9'), ('anti-patterns', '10.', '10'), ('spec', '11.', '11'), ('lab', '12.', '12'),
        ('protocol', '13.', '13'), ('backlog', '14.', '14'), ('see-it', '15.', '15'), ('unverified', '16.', '16'), ('sources', '17.', '17')]
TITLES = {sid: (P.get('context_title', 'Context') if pre == 'Context' else heading(pre)) for sid, pre, _ in SECS}
FAMSUB = [(f'fam-{f.split(":")[0][-1].lower()}', f'{f.split(":")[0][-1]} · {f.split(": ", 1)[1]}') for f, _ in families]
SERIES = S_.series_nav('bar')
LAB_BTN = f'<a class="btn warm toc-play top" href="{SBX}">Open {html.escape(LAB)} ↗</a>' if SBX else ''
ATLAS_STRIP, ATLAS_HTML, NATLAS = atlas_build()
ATLAS_TOC = f'<a class="toc-atlas" href="#atlas">{html.escape(ATLAS_TITLE)} · {NATLAS} cards</a>' if NATLAS else ''


def toc_html():
    o = ['<nav class="toc" id="toc" aria-label="Contents"><div class="toc-in">', '<a class="toc-home" href="index.html">Kingsfoil artifacts</a>',
         SERIES, ATLAS_TOC, LAB_BTN, '<p class="toc-h">Contents</p><ol>']
    for sid, _, _ in SECS:
        o.append(f'<li><a href="#{sid}" data-sec="{sid}">{html.escape(TITLES[sid])}</a>')
        if sid == 'cards':
            o.append('<ol class="sub">' + ''.join(f'<li><a href="#{x}" data-sec="{x}">{html.escape(y)}</a></li>' for x, y in FAMSUB) + '</ol>')
        o.append('</li>')
    o.append('</ol><button class="btn ghost" id="motionBtn" type="button" aria-pressed="false">Pause animations</button></div></nav>')
    return ''.join(o)


cards_html = [render(cards_intro),
              f'<div class="tp-tools"><button class="btn ghost" type="button" data-openall>Open all {NCARD} cards</button><button class="btn ghost" type="button" data-closeall>Close all</button></div>']
for (fname, pl), (fid, _) in zip(families, FAMSUB):
    cards_html.append(f'<div class="fam" id="{fid}"><h3 class="famh"><span>{fname.split(":")[0][-1]}</span>{html.escape(fname.split(": ", 1)[1])}</h3>')
    cards_html += [card_html(p) for p in pl]
    cards_html.append('</div>')

lab_html = render(S('12.')[1])
if SBX:
    lab_html = (f'<div class="cta"><div><p class="cta-t">{html.escape(LAB[0].upper() + LAB[1:])} plots the Curve Spec with live sliders.</p>'
                f'<p class="mute">{inline(P.get("lab_blurb", ""))}</p></div><a class="btn warm big" href="{SBX}">Open {html.escape(LAB)} ↗</a></div>') + lab_html

BODY = {
    'context': render(S('Context')[1]),
    'summary': '<div class="exec">' + render(S('1.')[1]) + '</div>',
    'how-to-read': legend() + render(read_rest),
    'hypotheses': render(hyp),
    'current': render(S('4.')[1]),
    'twins': render(tw_before) + fig('twins') + render(tw_after),
    'timeline': render(tl_intro) + fig('timeline'),
    'cards': ''.join(cards_html),
    'scorecard': render(score_intro) + fig('score') + render(score_read),
    'experiments': render(nexp),
    'anti-patterns': '<div class="learn">' + render(S('10.')[1]) + '</div>',
    'spec': render(spec),
    'lab': lab_html,
    'protocol': render(S('13.')[1]),
    'backlog': render(bl_before) + fig('backlog') + render(bl_tbl) + render(bl_after),
    'see-it': render(idx.split('\n|')[0].strip()) + idx_table(),
    'unverified': render(S('16.')[1]),
    'sources': render(src_intro) + ''.join(src_html),
}

title = ITEM['title']
hero = (B / 'hero.html').read_text().replace('@@SERIES@@', SERIES).replace('@@TITLE@@', html.escape(title))
body = [hero, ATLAS_STRIP, '<div class="layout" id="study">' + toc_html() + '<main id="main">']
body += [section(sid, TITLES[sid], BODY[sid], num) for sid, _, num in SECS]
body.append('<footer class="foot"><p>Kingsfoil Studios · Research study · ' + html.escape(P.get('byline_month', '')) + '</p><p>'
            + (f'<a href="{SBX}">Open {html.escape(LAB)} ↗</a> · ' if SBX else '')
            + (f'<a href="#atlas">{html.escape(ATLAS_TITLE)}</a> · ' if NATLAS else '')
            + '<a href="index.html">All Kingsfoil artifacts</a> · <a href="#top">Back to top</a></p></footer></main></div>')
body.append(ATLAS_HTML)
body_s = ''.join(body)

fig_ids = [n for n in re.findall(r'<figure class="fig[^"]*"[^>]*id="fig-(\w+)"', body_s) if n != 'hero']
num = {n: i + 1 for i, n in enumerate(fig_ids)}
cnt = iter(range(1, 1000))
body_s = re.sub(r'Fig\. @N', lambda m: f'Fig. {next(cnt)}', body_s)
body_s = re.sub(r'<a href="#fig-(\w+)">@REF:\1</a>', lambda m: f'<a href="#fig-{m.group(1)}">Fig. {num.get(m.group(1), "?")}</a>', body_s)
body_s = re.sub(r'@REF:(\w+)', lambda m: f'<a href="#fig-{m.group(1)}">Fig. {num.get(m.group(1), "?")}</a>', body_s)
css = (B / 'style.css').read_text() + '\n' + (B / 'study.css').read_text()
js = ''.join((B / f).read_text() + '\n' for f in ['core.js'] + sorted(p.name for p in B.glob('demos*.js')))
js = re.sub(r'@REFN:(\w+)', lambda m: str(num.get(m.group(1), '?')), js)
unused = set(FIGS) - set(USED) - {'hero'}
if unused:
    print('UNUSED FIGS', sorted(unused), file=sys.stderr)
for bad in re.findall(r'@@FIG:\w+@@|@REF:\w+', body_s):
    print('UNPLACED', bad, file=sys.stderr)

data_js = (f'const RLAB={json.dumps(RLAB)},RSHORT={json.dumps(RSHORT)},SEL0={json.dumps(SEL0)};\n'
           f'const SCORE={json.dumps(rows, ensure_ascii=False)};\nconst GENS={json.dumps(gens, ensure_ascii=False)};\n'
           f'const TWINS={json.dumps(twins, ensure_ascii=False)};\nconst BACKLOG={json.dumps(backlog, ensure_ascii=False)};\n'
           f'const COND={json.dumps(COND)};\n')

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(ITEM.get('summary', ''))}">
<meta name="theme-color" content="#0e0c12">
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
print('wrote', OUT, len(page.encode()), 'bytes;', NCARD, 'cards;', len(twins), 'twins;', NSRC, 'sources;', len(num), 'numbered figures; demos:', len(re.findall(r'data-demo="', page)), '; atlas cards:', NATLAS)
