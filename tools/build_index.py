"""Builds site/index.html from site/catalog.json + site/taxonomy.json, validates the data,
and refreshes the flat file inventory in site/manifest.json (used for safe full-site deploys)."""
import json, os, sys, html, glob, pathlib
SITE = str(pathlib.Path(__file__).resolve().parent.parent / "site")
CHECK = "--check" in sys.argv  # validate + verify index.html/manifest are up to date, write nothing
cat = json.load(open(f"{SITE}/catalog.json"))
tax = json.load(open(f"{SITE}/taxonomy.json"))
E = lambda s: html.escape(str(s), quote=True)

# ---------------- validation ----------------
facets = {f["id"]: f for f in tax["facets"]}
allowed = {f["id"]: {v["id"] for v in f["values"]} for f in tax["facets"]}
label = {(f["id"], v["id"]): v["label"] for f in tax["facets"] for v in f["values"]}
items = {i["id"]: i for i in cat["items"]}
errors = []
TAGS_ONLY = "--validate-only" in sys.argv  # used by `studykit register` before the page exists
REQ = ["genre", "perspective", "art-style", "domain", "concept", "technique", "engine", "project"]
for i in cat["items"]:
    if i["type"] not in allowed["type"]: errors.append(f"{i['id']}: bad type {i['type']}")
    if not TAGS_ONLY and not os.path.exists(SITE + i["path"]): errors.append(f"{i['id']}: missing file {i['path']}")
    if not TAGS_ONLY and i.get("thumb") and not os.path.exists(SITE + i["thumb"]): errors.append(f"{i['id']}: missing thumb {i['thumb']}")
    if i.get("pair") and i["pair"] not in items: errors.append(f"{i['id']}: pair {i['pair']} not found")
    for f, vs in i["tags"].items():
        if f not in allowed: errors.append(f"{i['id']}: unknown facet {f}"); continue
        for v in vs:
            if v not in allowed[f]: errors.append(f"{i['id']}: '{v}' not in taxonomy facet '{f}' (if it is a genuinely new value, add it to taxonomy.json with a label and desc)")
    if i["type"] == "study":
        for f in REQ:
            if not i["tags"].get(f): errors.append(f"{i['id']}: study missing required facet '{f}'")
        if len(i["tags"].get("domain", [])) != 1: errors.append(f"{i['id']}: study needs exactly one domain")
        n = len(i["tags"].get("technique", []))
        if not 3 <= n <= 10: errors.append(f"{i['id']}: needs 3–10 techniques (has {n})")
for s in cat["series"]:
    for sid in s["order"]:
        if sid not in items: errors.append(f"series {s['id']}: unknown item {sid}")
if errors:
    print("CATALOG INVALID:\n  " + "\n  ".join(errors)); sys.exit(1)
if "--validate-only" in sys.argv:
    print("catalog valid"); sys.exit(0)

studies = [i for i in cat["items"] if i["type"] == "study"]
def counts(facet, pool=studies):
    c = {}
    for i in pool:
        for v in i["tags"].get(facet, []): c[v] = c.get(v, 0) + 1
    return dict(sorted(c.items(), key=lambda kv: (-kv[1], label[(facet, kv[0])])))

def search_text(i):
    parts = [i["title"], i["short"], i["summary"]]
    for f, vs in i["tags"].items():
        parts += [label[(f, v)] for v in vs] + vs
    s = i.get("series")
    if s: parts.append(next(x["title"] for x in cat["series"] if x["id"] == s["id"]))
    return " ".join(parts).lower()

def tagattr(i):
    t = [f"{f}:{v}" for f, vs in i["tags"].items() for v in vs]
    if i.get("pair") and items[i["pair"]]["type"] == "sandbox" or i["type"] == "sandbox": t.append("has:playable")
    t.append(f"type:{i['type']}")
    return " ".join(t)

def series_title(sid): return next(x for x in cat["series"] if x["id"] == sid)

def card(i, featured=False):
    s = i.get("series"); sb = items.get(i.get("pair")) if i.get("pair") else None
    kicker = ""
    if s:
        st = series_title(s["id"]); kicker = f"{E(st['title'])} #{s['number']}"
    kicker += " · Study" + (" + playable" if sb else "")
    chips = []
    for f in ["genre", "perspective", "art-style", "project"]:
        for v in i["tags"].get(f, [])[:3]:
            chips.append(f'<li><button type="button" class="chip mini" data-facet="{f}" data-value="{v}">{E(label[(f, v)])}</button></li>')
    st = i.get("stats", {}); meta = []
    if st.get("words"): meta.append(f"{round(st['words']/1000)}k words")
    if st.get("techniques"): meta.append(f"{st['techniques']} techniques")
    if st.get("figures"): meta.append(f"{st['figures']} live figures")
    if st.get("games"): meta.append(f"~{st['games']} games")
    thumbcls = "px" if i["thumb"].endswith(".png") else ""
    play = f'<a class="btn play" href="{E(sb["path"])}">▶ Play sandbox</a>' if sb else ""
    return f'''<article class="card{' featured' if featured else ''}" data-id="{E(i['id'])}" data-tags="{E(tagattr(i) + (' ' + tagattr(sb) if sb else ''))}" data-search="{E(search_text(i))}">
  <a class="thumb" href="{E(i['path'])}" tabindex="-1" aria-hidden="true"><img class="{thumbcls}" src="{E(i['thumb'])}" alt="" width="320" height="180" loading="lazy"></a>
  <div class="body">
    <p class="kicker">{kicker}</p>
    <h3><a href="{E(i['path'])}">{E(i['short'])}</a></h3>
    <p class="full">{E(i['title'])}</p>
    <p class="sum">{E(i['summary'])}</p>
    <ul class="chips">{''.join(chips)}</ul>
    <p class="meta">{' · '.join(meta)} · <time datetime="{i['date']}">{i['date']}</time></p>
    <div class="actions"><a class="btn" href="{E(i['path'])}">Read study →</a>{play}</div>
  </div>
</article>'''

def ghost(u):
    return f'<article class="card ghost" aria-label="Upcoming: {E(u["title"])}"><div class="body"><p class="kicker">Upcoming</p><h3>{E(u["title"])}</h3><p class="sum">{E(u["blurb"])}</p></div></article>'

# ---------------- sections ----------------
start = items[cat["start"]["id"]]
shelves = []
for s in cat["series"]:
    cards = "".join(card(items[x]) for x in s["order"]) + "".join(ghost(u) for u in s.get("upcoming", []))
    n = len(s["order"]); np_ = sum(1 for x in s["order"] if items[x].get("pair"))
    shelves.append(f'''<section class="shelf" id="series-{s['id']}" data-series="{s['id']}">
  <header class="shelf-h"><div><h2>{E(s['title'])}</h2><p class="sub">{E(s['subtitle'])} — {E(s['blurb'])}</p></div><p class="count">{n} {"study" if n==1 else "studies"}{f" · {np_} playable" if np_ else ""}</p></header>
  <div class="grid">{cards}</div>
</section>''')

def chip_row(facet):
    c = counts(facet)
    if not c: return ""
    btns = "".join(f'<button type="button" class="chip" data-facet="{facet}" data-value="{v}" aria-pressed="false">{E(label[(facet, v)])}<span class="n">{n}</span></button>' for v, n in c.items())
    return f'<div class="facet" role="group" aria-label="{E(facets[facet]["label"])}"><span class="fl">{E(facets[facet]["label"])}</span>{btns}</div>'
filter_rows = "".join(chip_row(f["id"]) for f in tax["facets"] if f.get("filter"))

proj = counts("project")
proj_html = "".join(f'''<button type="button" class="proj" data-facet="project" data-value="{v}" aria-pressed="false"><b>{E(label[('project', v)])}</b><span>{E(next(x.get('desc','') for x in facets['project']['values'] if x['id']==v))}</span><em>{n} {"study" if n==1 else "studies"}</em></button>''' for v, n in proj.items())

tech = counts("technique")
tdesc = {v["id"]: v.get("desc", "") for v in facets["technique"]["values"]}
tech_html = "".join(f'<button type="button" class="chip tech{" hot" if n>1 else ""}" data-facet="technique" data-value="{v}" aria-pressed="false" title="{E(tdesc[v])}">{E(label[("technique", v)])}<span class="n">{n}</span></button>' for v, n in tech.items())

rows = []
for i in sorted(cat["items"], key=lambda x: (x["date"], x["type"] == "study"), reverse=True):
    s = i.get("series"); stitle = f"{series_title(s['id'])['title']} #{s['number']}" if s else "—"
    w = i.get("stats", {}).get("words", "")
    rows.append(f'<tr data-tags="{E(tagattr(i))}" data-search="{E(search_text(i))}"><td data-s="{E(i["title"].lower())}"><a href="{E(i["path"])}">{E(i["title"])}</a></td><td data-s="{i["type"]}">{"▶ Sandbox" if i["type"]=="sandbox" else "Study"}</td><td data-s="{E(stitle)}">{E(stitle)}</td><td data-s="{i["date"]}">{i["date"]}</td><td data-s="{w or 0}" class="num">{f"{w:,}" if w else ""}</td></tr>')

tot_words = sum(i.get("stats", {}).get("words", 0) for i in studies)
tot_tech = sum(i.get("stats", {}).get("techniques", 0) for i in studies)
tot_src = sum(i.get("stats", {}).get("sources", 0) for i in studies)
n_sb = sum(1 for i in cat["items"] if i["type"] == "sandbox")
stats = [(len(cat["series"]), "series"), (len(studies), "studies"), (n_sb, "playable sandboxes"), (f"{round(tot_words/1000)}k", "words of research"),
         (f"{tot_tech}+", "techniques profiled"), (f"{tot_src:,}+", "sources cited")]
stats_html = "".join(f"<li><b>{v}</b><span>{E(k)}</span></li>" for v, k in stats)

data_json = json.dumps({"labels": {f"{f}:{v}": l for (f, v), l in label.items()}}, ensure_ascii=False).replace("</", "<\\/")

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kingsfoil Artifacts — game research library</title>
<meta name="description" content="{E(cat['site']['intro'])}">
<meta property="og:title" content="Kingsfoil Artifacts — game research library">
<meta property="og:description" content="{E(cat['site']['intro'])}">
<meta property="og:image" content="https://kingsfoil-artifacts.netlify.app/thumbs/vfx-light.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{{--ink:#13212b;--ink-2:#182b37;--ink-3:#1e3443;--contour:#2b4555;--paper:#e9e3d2;--muted:#a7b4b6;--brass:#e2b453;--hero:#6cb8ff;--mob:#ff6e5a;--ok:#9ccc6a}}
*{{box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{margin:0;min-height:100vh;background:var(--ink);color:var(--paper);font:1rem/1.6 "IBM Plex Sans","Segoe UI",system-ui,sans-serif;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M0 60h120M60 0v120' stroke='%23ffffff' stroke-opacity='.025'/%3E%3C/svg%3E")}}
a{{color:inherit}}
.wrap{{max-width:76rem;margin:0 auto;padding:0 1.25rem}}
.top{{padding:3.5rem 0 1.2rem}}
.brand{{display:flex;gap:1rem;align-items:center;margin-bottom:.5rem}}
h1{{font:700 clamp(2rem,5.5vw,3rem)/1.05 "Chakra Petch","Bahnschrift",sans-serif;margin:0;color:#fff7e3}}
.intro{{color:var(--muted);margin:.4rem 0 1.2rem;max-width:46rem}}
.stats{{list-style:none;display:flex;flex-wrap:wrap;gap:.5rem 1.6rem;padding:0;margin:0 0 1.6rem}}
.stats li{{display:flex;flex-direction:column}} .stats b{{font:700 1.4rem/1.1 "Chakra Petch",sans-serif;color:var(--brass)}} .stats span{{font-size:.8rem;color:var(--muted)}}
/* filter bar */
.finder{{position:sticky;top:0;z-index:5;background:rgba(19,33,43,.94);backdrop-filter:blur(6px);border-block:1px solid var(--contour);padding:.8rem 0;margin-bottom:1.5rem}}
.no-js .finder{{display:none}}
.searchrow{{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}}
.search{{flex:1;min-width:14rem;display:flex;align-items:center;gap:.5rem;background:var(--ink-2);border:1px solid var(--contour);border-radius:.5rem;padding:.45rem .7rem}}
.search:focus-within{{border-color:var(--brass)}}
.search input{{flex:1;background:none;border:0;color:var(--paper);font:inherit;outline:none;min-width:0}}
.search kbd{{font:.75rem "IBM Plex Mono",monospace;color:var(--muted);border:1px solid var(--contour);border-radius:.25rem;padding:0 .3rem}}
.tog{{background:var(--ink-2);color:var(--paper);border:1px solid var(--contour);border-radius:.5rem;padding:.45rem .8rem;font:500 .9rem "IBM Plex Sans",sans-serif;cursor:pointer}}
.tog[aria-pressed=true]{{background:var(--brass);color:#1a1408;border-color:var(--brass)}}
.facets{{display:flex;flex-direction:column;gap:.35rem;margin-top:.6rem}}
.facets[hidden]{{display:none}}
.facet{{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}}
.fl{{font:600 .72rem "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);width:5.2rem}}
.chip{{background:transparent;color:var(--paper);border:1px solid var(--contour);border-radius:999px;padding:.12rem .6rem;font:500 .82rem "IBM Plex Sans",sans-serif;cursor:pointer;display:inline-flex;gap:.35rem;align-items:center}}
.chip:hover{{border-color:var(--brass)}} .chip[aria-pressed=true]{{background:var(--brass);color:#1a1408;border-color:var(--brass)}}
.chip .n{{font:.7rem "IBM Plex Mono",monospace;opacity:.7}}
.status{{display:flex;gap:.8rem;align-items:center;margin-top:.55rem;font-size:.85rem;color:var(--muted);flex-wrap:wrap}}
.status button{{background:none;border:0;color:var(--hero);cursor:pointer;font:inherit;text-decoration:underline;padding:0}}
.active-tags{{display:flex;flex-wrap:wrap;gap:.3rem}}
/* start */
.start{{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:1.4rem;align-items:center;background:linear-gradient(135deg,var(--ink-3),var(--ink-2));border:1px solid var(--contour);border-radius:.8rem;padding:1.2rem;margin-bottom:2.2rem}}
.start img{{width:100%;height:auto;border-radius:.5rem;image-rendering:pixelated;display:block}}
.start .k{{font:600 .75rem "IBM Plex Mono",monospace;color:var(--brass);text-transform:uppercase;letter-spacing:.1em;margin:0}}
.start h2{{font:700 1.7rem/1.15 "Chakra Petch",sans-serif;margin:.3rem 0 .5rem;color:#fff7e3}}
.start p{{margin:0 0 .9rem;color:var(--muted)}}
@media(max-width:760px){{.start{{grid-template-columns:1fr}}}}
/* shelves */
.shelf{{margin:0 0 2.4rem}}
.shelf-h{{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;border-bottom:1px solid var(--contour);padding-bottom:.5rem;margin-bottom:1rem;flex-wrap:wrap}}
.shelf h2,.sec h2{{font:700 1.45rem/1.2 "Chakra Petch",sans-serif;margin:0;color:#fff7e3}}
.sub{{margin:.2rem 0 0;color:var(--muted);font-size:.92rem;max-width:52rem}} .count{{margin:0;color:var(--muted);font:.8rem "IBM Plex Mono",monospace}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(16.5rem,1fr));gap:1rem}}
.card{{background:var(--ink-2);border:1px solid var(--contour);border-radius:.7rem;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s,transform .15s}}
.card:hover{{border-color:var(--brass);transform:translateY(-2px)}}
.card[hidden]{{display:none}}
.thumb{{display:block;aspect-ratio:16/9;background:#0b151c;overflow:hidden}}
.thumb img{{width:100%;height:100%;object-fit:cover;display:block}} img.px{{image-rendering:pixelated}}
.body{{padding:.8rem .9rem .9rem;display:flex;flex-direction:column;gap:.35rem;flex:1}}
.kicker{{margin:0;font:600 .7rem "IBM Plex Mono",monospace;color:var(--brass);text-transform:uppercase;letter-spacing:.06em}}
.card h3{{margin:0;font:700 1.2rem/1.2 "Chakra Petch",sans-serif;color:#fff7e3}} .card h3 a{{text-decoration:none}} .card h3 a:hover{{color:var(--brass)}}
.full{{margin:0;font-size:.82rem;color:var(--muted);font-style:italic}}
.sum{{margin:0;font-size:.9rem;color:#cfd6d3}}
.chips{{list-style:none;padding:0;margin:.15rem 0 0;display:flex;flex-wrap:wrap;gap:.3rem}}
.chip.mini{{font-size:.72rem;padding:.02rem .5rem}}
.meta{{margin:auto 0 0;padding-top:.3rem;font:.72rem "IBM Plex Mono",monospace;color:var(--muted)}}
.actions{{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem}}
.btn{{text-decoration:none;font:600 .85rem "IBM Plex Sans",sans-serif;border:1px solid var(--contour);border-radius:.4rem;padding:.35rem .7rem;background:var(--ink-3)}}
.btn:hover{{border-color:var(--brass);color:var(--brass)}} .btn.play{{background:var(--brass);color:#1a1408;border-color:var(--brass)}} .btn.play:hover{{color:#1a1408;filter:brightness(1.08)}}
.card.ghost{{background:transparent;border-style:dashed;opacity:.75}} .card.ghost:hover{{transform:none}}
.card.ghost .body{{justify-content:center;min-height:10rem}} .card.ghost .kicker{{color:var(--hero)}}
.filtering .card.ghost{{display:none}}
.shelf[hidden],.sec[hidden],.start[hidden]{{display:none}}
/* projects + techniques */
.sec{{margin:0 0 2.4rem}} .sec .sub{{margin-bottom:1rem}}
.projs{{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.8rem}}
.proj{{text-align:left;background:var(--ink-2);border:1px solid var(--contour);border-radius:.6rem;padding:.8rem .9rem;color:var(--paper);cursor:pointer;display:flex;flex-direction:column;gap:.1rem;font:inherit}}
.proj:hover{{border-color:var(--brass)}} .proj[aria-pressed=true]{{border-color:var(--brass);box-shadow:inset 0 0 0 1px var(--brass)}}
.proj b{{font:700 1.05rem "Chakra Petch",sans-serif}} .proj span{{font-size:.85rem;color:var(--muted)}} .proj em{{font:normal .75rem "IBM Plex Mono",monospace;color:var(--brass)}}
.techs{{display:flex;flex-wrap:wrap;gap:.4rem}} .chip.tech.hot{{border-color:#4f6c7f;background:rgba(108,184,255,.08)}}
/* table */
.tablewrap{{overflow-x:auto;border:1px solid var(--contour);border-radius:.6rem}}
table{{width:100%;border-collapse:collapse;font-size:.88rem;min-width:40rem}}
th,td{{padding:.55rem .7rem;text-align:left;border-bottom:1px solid var(--contour)}} tr:last-child td{{border-bottom:0}}
th{{font:600 .72rem "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--ink-2)}}
th button{{all:unset;cursor:pointer}} th button:hover{{color:var(--brass)}} td.num,th.num{{text-align:right}}
td a{{text-decoration:none}} td a:hover{{color:var(--brass)}} tr[hidden]{{display:none}}
.empty{{display:none;padding:2rem;text-align:center;color:var(--muted);border:1px dashed var(--contour);border-radius:.7rem;margin-bottom:2rem}}
.filtering.noresults .empty{{display:block}}
footer{{margin:3rem 0 3rem;color:var(--muted);font-size:.8rem;border-top:1px solid var(--contour);padding-top:1rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}}
footer a{{color:var(--hero)}}
@media(max-width:560px){{.fl{{width:100%}}.top{{padding-top:2.2rem}}}}
@media(prefers-reduced-motion:reduce){{.card{{transition:none}}.card:hover{{transform:none}}html{{scroll-behavior:auto}}}}
</style>
</head>
<body class="no-js">
<div class="wrap">
<header class="top">
  <div class="brand"><svg width="40" height="40" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9" fill="none" stroke="#e2b453" stroke-width="1.3"/><circle cx="11" cy="11" r="4" fill="none" stroke="#6cb8ff" stroke-width="1.3"/><circle cx="11" cy="11" r="1.2" fill="#e2b453"/></svg>
  <h1>Kingsfoil Artifacts</h1></div>
  <p class="intro">{E(cat['site']['intro'])}</p>
  <ul class="stats">{stats_html}</ul>
</header>
</div>
<div class="finder" id="finder"><div class="wrap">
  <div class="searchrow">
    <label class="search"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="#a7b4b6" stroke-width="1.6"/><path d="M11 11l4 4" stroke="#a7b4b6" stroke-width="1.6"/></svg>
      <input id="q" type="search" placeholder="Search studies, techniques, games… e.g. “boids”, “Tibia”, “shadow”" aria-label="Search the library" autocomplete="off"><kbd>/</kbd></label>
    <button type="button" class="tog" id="playable" data-facet="has" data-value="playable" aria-pressed="false">▶ Has playable sandbox</button>
    <button type="button" class="tog" id="morebtn" aria-expanded="false" aria-controls="facets">Filters</button>
  </div>
  <div class="facets" id="facets" hidden>{filter_rows}</div>
  <div class="status" aria-live="polite"><span id="count"></span><span class="active-tags" id="active"></span><button type="button" id="clear" hidden>Clear all</button></div>
</div></div>
<main class="wrap" id="lib">
  <section class="start" id="start" aria-label="Start here">
    <a href="{E(start['path'])}" tabindex="-1" aria-hidden="true"><img src="{E(start['thumb'])}" alt="" width="320" height="180"></a>
    <div><p class="k">★ Start here</p><h2>{E(series_title(start['series']['id'])['title'])}: #{start['series']['number']} {E(start['short'])}</h2>
      <p>{E(cat['start']['why'])}</p><div class="actions"><a class="btn" href="{E(start['path'])}">Read the snow study →</a><a class="btn play" href="{E(items[start['pair']]['path'])}">▶ Play the snow sandbox</a><a class="btn" href="#series-vfx">See the whole series</a></div></div>
  </section>
  <p class="empty">No artifacts match these filters yet. Maybe that's the next study to write. <button type="button" class="tog" id="clear2">Clear filters</button></p>
  {''.join(shelves)}
  <section class="sec" id="projects"><header class="shelf-h"><div><h2>By project</h2><p class="sub">Which studies feed which Kingsfoil game. Click one to filter the library.</p></div></header><div class="projs">{proj_html}</div></section>
  <section class="sec" id="techniques"><header class="shelf-h"><div><h2>Technique atlas</h2><p class="sub">Reusable algorithms tagged across studies. Highlighted ones appear in more than one study; click to see where.</p></div><p class="count">{len(tech)} techniques</p></header><div class="techs">{tech_html}</div></section>
  <section class="sec" id="all"><header class="shelf-h"><div><h2>All artifacts</h2><p class="sub">Every page on the site. Click a column to sort.</p></div><p class="count">{len(cat['items'])} pages</p></header>
    <div class="tablewrap"><table id="tbl"><thead><tr><th><button data-k="0">Title</button></th><th><button data-k="1">Type</button></th><th><button data-k="2">Series</button></th><th><button data-k="3">Date ↓</button></th><th class="num"><button data-k="4">Words</button></th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section>
  <footer><span>Kingsfoil Studios · Research library · updated {cat['updated']}</span><span>Data: <a href="/catalog.json">catalog.json</a> · <a href="/taxonomy.json">taxonomy.json</a></span></footer>
</main>
<script type="application/json" id="kfdata">{data_json}</script>
<script>
(()=>{{
"use strict";
document.body.classList.remove('no-js');
const LBL=JSON.parse(document.getElementById('kfdata').textContent).labels;
const lib=document.getElementById('lib'),q=document.getElementById('q'),facetsEl=document.getElementById('facets'),more=document.getElementById('morebtn');
const cards=[...document.querySelectorAll('.card:not(.ghost)')],rows=[...document.querySelectorAll('#tbl tbody tr')];
const sel={{}};// facet -> Set
const has=(el,f,v)=>(' '+el.dataset.tags+' ').includes(' '+f+':'+v+' ');
function matches(el,words){{for(const f in sel){{if(!sel[f].size)continue;let ok=false;for(const v of sel[f])if(has(el,f,v)){{ok=true;break;}}if(!ok)return false;}}
  const s=el.dataset.search;for(const w of words)if(!s.includes(w))return false;return true;}}
function apply(push=true){{const words=q.value.toLowerCase().split(/\\s+/).filter(Boolean);const active=Object.values(sel).some(s=>s.size)||words.length;
  let n=0;for(const c of cards){{const m=matches(c,words);c.hidden=!m;if(m)n++;}}
  for(const r of rows)r.hidden=!matches(r,words);
  document.querySelectorAll('.shelf').forEach(s=>{{s.hidden=active&&!s.querySelector('.card:not(.ghost):not([hidden])');}});
  document.getElementById('start').hidden=!!active;document.getElementById('projects').hidden=false;
  lib.classList.toggle('filtering',!!active);lib.classList.toggle('noresults',!!active&&n===0);
  document.getElementById('count').textContent=active?`${{n}} ${{n===1?'study':'studies'}} match`:`${{cards.length}} studies`;
  document.getElementById('clear').hidden=!active;
  document.querySelectorAll('[data-facet]').forEach(b=>{{const on=!!(sel[b.dataset.facet]&&sel[b.dataset.facet].has(b.dataset.value));if(b.hasAttribute('aria-pressed')||b.classList.contains('mini'))b.setAttribute('aria-pressed',on);}});
  const act=document.getElementById('active');act.innerHTML='';for(const f in sel)for(const v of sel[f]){{const b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed','true');b.dataset.facet=f;b.dataset.value=v;b.textContent=(f==='has'?'▶ Playable':(LBL[f+':'+v]||v))+' ×';act.appendChild(b);}}
  if(push){{const p=new URLSearchParams();if(q.value.trim())p.set('q',q.value.trim());for(const f in sel)if(sel[f].size)p.set(f,[...sel[f]].join(','));const s=p.toString();history.replaceState(null,'',s?'?'+s:location.pathname);}}}}
function toggle(f,v){{(sel[f]=sel[f]||new Set());sel[f].has(v)?sel[f].delete(v):sel[f].add(v);apply();}}
document.addEventListener('click',e=>{{const b=e.target.closest('[data-facet]');if(!b)return;e.preventDefault();toggle(b.dataset.facet,b.dataset.value);
  if(b.classList.contains('mini')||b.closest('#projects')||b.closest('#techniques'))document.getElementById('finder').scrollIntoView({{block:'start'}});}});
q.addEventListener('input',()=>apply());
const clearAll=()=>{{for(const f in sel)sel[f].clear();q.value='';apply();}};document.getElementById('clear').onclick=clearAll;document.getElementById('clear2').onclick=clearAll;
more.onclick=()=>{{const open=facetsEl.hidden;facetsEl.hidden=!open;more.setAttribute('aria-expanded',open);more.setAttribute('aria-pressed',open);}};
addEventListener('keydown',e=>{{if(e.key==='/'&&document.activeElement!==q){{e.preventDefault();q.focus();}}if(e.key==='Escape'&&document.activeElement===q){{q.value='';apply();q.blur();}}}});
// table sort
let sk=3,sd=-1;document.querySelectorAll('#tbl th button').forEach(b=>b.onclick=()=>{{const k=+b.dataset.k;sd=(k===sk)?-sd:(k===3||k===4?-1:1);sk=k;
  const tb=document.querySelector('#tbl tbody');const rs=[...tb.rows].sort((a,c)=>{{const x=a.cells[k].dataset.s,y=c.cells[k].dataset.s;const nx=+x,ny=+y;return (isNaN(nx)||isNaN(ny)?x.localeCompare(y):nx-ny)*sd;}});rs.forEach(r=>tb.appendChild(r));
  document.querySelectorAll('#tbl th button').forEach(x=>x.textContent=x.textContent.replace(/ [↑↓]$/,''));b.textContent+=sd<0?' ↓':' ↑';}});
// restore from URL
const P=new URLSearchParams(location.search);for(const [k,v] of P){{if(k==='q')q.value=v;else sel[k]=new Set(v.split(',').filter(Boolean));}}
if([...P.keys()].some(k=>k!=='q'&&k!=='has')){{facetsEl.hidden=false;more.setAttribute('aria-expanded','true');more.setAttribute('aria-pressed','true');}}
apply(false);
}})();
</script>
</body>
</html>
'''
if CHECK:
    if open(f"{SITE}/index.html").read() != page:
        print("STALE: site/index.html differs from catalog.json — run `python -m studykit index`"); sys.exit(1)
else:
    open(f"{SITE}/index.html", "w").write(page)

# ---------------- flat file inventory (safe-deploy manifest) ----------------
man = json.load(open(f"{SITE}/manifest.json"))
known = {e["path"]: e for e in man}
def upsert(path, title, desc, date):
    if path in known: known[path].update({"title": title, "description": desc, "date": date})
    else:
        e = {"path": path, "title": title, "description": desc, "date": date}; man.append(e); known[path] = e
upsert("/index.html", "Kingsfoil Artifacts", "Library homepage generated from catalog.json: series shelves, search, facet filters, technique atlas.", cat["updated"])
upsert("/catalog.json", "Catalog (v2)", "Rich data model: items, series, tags, stats, pairs. Source of truth for the homepage.", cat["updated"])
upsert("/taxonomy.json", "Taxonomy", "Controlled vocabulary of facets and tag values.", cat["updated"])
for f in sorted(glob.glob(f"{SITE}/thumbs/*")):
    upsert("/thumbs/" + os.path.basename(f), "Thumbnail " + os.path.basename(f), "Card thumbnail", cat["updated"])
for i in cat["items"]:  # new pages join the manifest; existing entries keep their text
    if i["path"] not in known and os.path.exists(SITE + i["path"]):
        upsert(i["path"], i["title"], i.get("summary", ""), i.get("date", cat["updated"]))
    if i["path"] not in known: errors.append("manifest missing " + i["path"])
missing = [e["path"] for e in man if not os.path.exists(SITE + e["path"])]
if missing: print("WARNING: manifest lists missing files:", missing)
new_man = json.dumps(man, indent=1, ensure_ascii=False)
if CHECK:
    if json.loads(open(f"{SITE}/manifest.json").read()) != man:
        print("STALE: site/manifest.json — run `python -m studykit index`"); sys.exit(1)
else:
    open(f"{SITE}/manifest.json", "w").write(new_man)
print(f"OK: {len(cat['items'])} items, {len(studies)} studies, {len(tech)} techniques; index.html {os.path.getsize(SITE + '/index.html'):,} bytes; manifest {len(man)} files")
