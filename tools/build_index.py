"""Builds site/index.html, site/browse.html and site/nav.json from site/catalog.json + site/taxonomy.json, validates the data,
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

def tab_label(s): return s.get("nav_label", s["title"]).removesuffix(" series")

def card(i):
    s = i.get("series"); sb = items.get(i.get("pair")) if i.get("pair") else None
    kicker = (f"#{s['number']} · " if s else "") + ("Study + sandbox" if sb else "Study")
    thumbcls = "px" if i["thumb"].endswith(".png") else ""
    play = f'<a class="btn play" href="{E(sb["path"].lstrip("/"))}">▶ Play</a>' if sb else ""
    href = E(i["path"].lstrip("/"))
    tags = tagattr(i) + (" " + tagattr(sb) if sb else "") + (f" series:{s['id']}" if s else "")
    return f'''<article class="card" data-id="{E(i['id'])}" data-tags="{E(tags)}" data-search="{E(search_text(i))}">
  <a class="thumb" href="{href}" tabindex="-1" aria-hidden="true"><img class="{thumbcls}" src="{E(i['thumb'].lstrip('/'))}" alt="" width="320" height="180" loading="lazy"></a>
  <div class="body">
    <p class="kicker">{kicker}</p>
    <h3><a href="{href}" title="{E(i['title'])}">{E(i['short'])}</a></h3>
    <p class="sum">{E(i['summary'])}</p>
    <div class="actions"><a class="btn" href="{href}">Read →</a>{play}</div>
  </div>
</article>'''

# ---------------- homepage sections ----------------
start = items[cat["start"]["id"]]
shelves = []
for s in cat["series"]:
    cards = "".join(card(items[x]) for x in s["order"])
    n = len(s["order"]); np_ = sum(1 for x in s["order"] if items[x].get("pair"))
    shelves.append(f'''<section class="shelf" id="series-{s['id']}" data-series="{s['id']}" style="--n:{min(n, 5)}">
  <header class="shelf-h"><div><h2>{E(s['title'])}</h2><p class="sub">{E(s['subtitle'])}. {E(s['blurb'])}</p></div><p class="count">{n} {"study" if n==1 else "studies"}{f" · {np_} playable" if np_ else ""}</p></header>
  <div class="grid">{cards}</div>
</section>''')

tabs = f'<button type="button" class="tab" data-facet="series" data-value="" data-single aria-pressed="true">All<span class="n">{len(studies)}</span></button>' + "".join(
    f'<button type="button" class="tab" data-facet="series" data-value="{s["id"]}" data-single aria-pressed="false" title="{E(s["title"])}">{E(tab_label(s))}<span class="n">{len(s["order"])}</span></button>'
    for s in cat["series"])
proj = counts("project")
proj_chips = "".join(f'<button type="button" class="chip" data-facet="project" data-value="{v}" data-single aria-pressed="false">{E(label[("project", v)])}<span class="n">{n}</span></button>' for v, n in proj.items())

upcoming = "".join(f'<li data-series="{s["id"]}"><span class="k">{E(tab_label(s))}</span><b>{E(u["title"])}</b><span>{E(u["blurb"])}</span></li>'
                   for s in cat["series"] for u in s.get("upcoming", []))
n_up = sum(len(s.get("upcoming", [])) for s in cat["series"])

tech = counts("technique")
tdesc = {v["id"]: v.get("desc", "") for v in facets["technique"]["values"]}
tech_html = "".join(f'<a class="chip tech{" hot" if n>1 else ""}" href="index.html?technique={v}" title="{E(tdesc[v])}">{E(label[("technique", v)])}<span class="n">{n}</span></a>' for v, n in tech.items())

rows = []
for i in sorted(cat["items"], key=lambda x: (x["date"], x["type"] == "study"), reverse=True):
    s = i.get("series"); stitle = f"{series_title(s['id'])['title']} #{s['number']}" if s else "—"
    w = i.get("stats", {}).get("words", "")
    rows.append(f'<tr><td data-s="{E(i["title"].lower())}"><a href="{E(i["path"].lstrip("/"))}">{E(i["title"])}</a></td><td data-s="{i["type"]}">{"▶ Sandbox" if i["type"]=="sandbox" else "Study"}</td><td data-s="{E(stitle)}">{E(stitle)}</td><td data-s="{i["date"]}">{i["date"]}</td><td data-s="{w or 0}" class="num">{f"{w:,}" if w else ""}</td></tr>')

tot_words = sum(i.get("stats", {}).get("words", 0) for i in studies)
tot_tech = sum(i.get("stats", {}).get("techniques", 0) for i in studies)
tot_src = sum(i.get("stats", {}).get("sources", 0) for i in studies)
n_sb = sum(1 for i in cat["items"] if i["type"] == "sandbox")
statline = " · ".join([f"<b>{len(studies)}</b> studies", f"<b>{n_sb}</b> playable sandboxes", f"<b>{round(tot_words/1000)}k</b> words",
                       f"<b>{tot_tech}+</b> techniques profiled", f"<b>{tot_src:,}+</b> sources cited"])

labels = {f"{f}:{v}": l for (f, v), l in label.items()}
labels.update({f"series:{s['id']}": tab_label(s) for s in cat["series"]})
data_json = json.dumps({"labels": labels}, ensure_ascii=False).replace("</", "<\\/")

LOGO = '<svg width="{0}" height="{0}" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9" fill="none" stroke="#e2b453" stroke-width="1.3"/><circle cx="11" cy="11" r="4" fill="none" stroke="#6cb8ff" stroke-width="1.3"/><circle cx="11" cy="11" r="1.2" fill="#e2b453"/></svg>'
FONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">'''

CSS = '''
:root{--ink:#13212b;--ink-2:#182b37;--ink-3:#1e3443;--contour:#2b4555;--paper:#e9e3d2;--muted:#a7b4b6;--brass:#e2b453;--hero:#6cb8ff;--mob:#ff6e5a;--ok:#9ccc6a}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--ink);color:var(--paper);font:1rem/1.6 "IBM Plex Sans","Segoe UI",system-ui,sans-serif;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M0 60h120M60 0v120' stroke='%23ffffff' stroke-opacity='.025'/%3E%3C/svg%3E")}
a{color:inherit}
.wrap{max-width:76rem;margin:0 auto;padding:0 1.25rem}
.top{padding:1.6rem 0 1rem}
.brand{display:flex;gap:.7rem;align-items:center;text-decoration:none}
h1{font:700 clamp(1.5rem,4.5vw,2rem)/1.05 "Chakra Petch","Bahnschrift",sans-serif;margin:0;color:#fff7e3}
.intro{color:var(--muted);margin:.5rem 0 .3rem;max-width:46rem}
.statline{margin:0;font-size:.85rem;color:var(--muted)} .statline b{color:var(--brass);font-weight:600}
.more{color:var(--hero);white-space:nowrap}
/* finder: search, series tabs, project chips */
.finder{background:rgba(19,33,43,.96);border-block:1px solid var(--contour);padding:.7rem 0 .55rem;margin-bottom:1.2rem}
@media(min-width:700px){.finder{position:sticky;top:0;z-index:5;backdrop-filter:blur(6px)}}
.no-js .finder{display:none}
.searchrow{display:flex;gap:.6rem;align-items:center}
.search{flex:1;min-width:0;display:flex;align-items:center;gap:.5rem;background:var(--ink-2);border:1px solid var(--contour);border-radius:.5rem;padding:.4rem .7rem}
.search:focus-within{border-color:var(--brass)}
.search input{flex:1;background:none;border:0;color:var(--paper);font:inherit;outline:none;min-width:0}
.search kbd{font:.75rem "IBM Plex Mono",monospace;color:var(--muted);border:1px solid var(--contour);border-radius:.25rem;padding:0 .3rem}
.tog{background:var(--ink-2);color:var(--paper);border:1px solid var(--contour);border-radius:.5rem;padding:.4rem .8rem;font:500 .9rem "IBM Plex Sans",sans-serif;cursor:pointer;white-space:nowrap}
.tog[aria-pressed=true]{background:var(--brass);color:#1a1408;border-color:var(--brass)}
.navrow{display:flex;gap:.4rem 1.4rem;flex-wrap:wrap;align-items:center;margin-top:.6rem}
.group{display:flex;gap:.35rem;align-items:center;min-width:0;max-width:100%;overflow-x:auto;scrollbar-width:none} .group::-webkit-scrollbar{display:none}
.fl{font:600 .7rem "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);flex:none}
.tab,.chip{flex:none;background:transparent;color:var(--paper);border:1px solid var(--contour);border-radius:999px;padding:.2rem .7rem;font:500 .85rem "IBM Plex Sans",sans-serif;cursor:pointer;display:inline-flex;gap:.35rem;align-items:center;text-decoration:none;white-space:nowrap}
.tab{border-radius:.45rem;padding:.3rem .75rem;font-weight:600;background:var(--ink-2)}
.tab:hover,.chip:hover{border-color:var(--brass)} .tab[aria-pressed=true],.chip[aria-pressed=true]{background:var(--brass);color:#1a1408;border-color:var(--brass)}
.tab .n,.chip .n{font:.7rem "IBM Plex Mono",monospace;opacity:.7}
.status{display:flex;gap:.8rem;align-items:center;margin-top:.5rem;font-size:.82rem;color:var(--muted);flex-wrap:wrap}
.status button:not(.chip){background:none;border:0;color:var(--hero);cursor:pointer;font:inherit;text-decoration:underline;padding:0}
.active-tags{display:flex;flex-wrap:wrap;gap:.3rem}
/* start-here banner */
.start{display:flex;gap:.5rem 1rem;align-items:center;flex-wrap:wrap;background:var(--ink-2);border:1px solid var(--contour);border-left:3px solid var(--brass);border-radius:.5rem;padding:.55rem .9rem;margin:0 0 1.6rem;font-size:.9rem;color:var(--muted)}
.start .k{font:600 .72rem "IBM Plex Mono",monospace;color:var(--brass);text-transform:uppercase;letter-spacing:.1em}
.start .why{flex:1;min-width:14rem} .start .why b{color:#fff7e3}
/* shelves */
.shelves{display:flex;flex-wrap:wrap;column-gap:.85rem}
.shelf{margin:0 0 1.8rem;scroll-margin-top:9rem;width:100%;display:flex;flex-direction:column}
.shelf .grid{margin-top:auto}
.shelf .sub{display:none} .one .shelf .sub{display:block}
/* wide screens: a 5-column card grid shared by all shelves, so short series sit side by side */
@media(min-width:1000px){.shelf{width:calc(var(--n)*(100% + .85rem)/5 - .85rem)}.shelf .grid{grid-template-columns:repeat(var(--n),minmax(0,1fr))}
  .shelf h2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shelf .shelf-h>div{min-width:0}.shelf .shelf-h{flex-wrap:nowrap}.count{white-space:nowrap}
  .one .shelf{width:100%}.one .shelf .grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.shelf-h{display:flex;justify-content:space-between;align-items:baseline;gap:.3rem 1rem;border-bottom:1px solid var(--contour);padding-bottom:.4rem;margin-bottom:.8rem;flex-wrap:wrap}
.shelf h2,.sec h2{font:700 1.25rem/1.2 "Chakra Petch",sans-serif;margin:0;color:#fff7e3}
.sub{margin:.15rem 0 0;color:var(--muted);font-size:.85rem;max-width:56rem} .count{margin:0;color:var(--muted);font:.78rem "IBM Plex Mono",monospace}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:.85rem}
.card{background:var(--ink-2);border:1px solid var(--contour);border-radius:.6rem;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s}
.card:hover{border-color:var(--brass)}
.card[hidden]{display:none}
.thumb{display:block;aspect-ratio:16/9;background:#0b151c;overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block} img.px{image-rendering:pixelated}
.body{padding:.6rem .75rem .75rem;display:flex;flex-direction:column;gap:.25rem;flex:1}
.kicker{margin:0;font:600 .68rem "IBM Plex Mono",monospace;color:var(--brass);text-transform:uppercase;letter-spacing:.06em}
.card h3{margin:0;font:700 1.08rem/1.2 "Chakra Petch",sans-serif;color:#fff7e3} .card h3 a{text-decoration:none} .card h3 a:hover{color:var(--brass)}
.sum{margin:0;font-size:.82rem;line-height:1.45;color:#cfd6d3;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.actions{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:auto;padding-top:.45rem}
.btn{text-decoration:none;font:600 .82rem "IBM Plex Sans",sans-serif;border:1px solid var(--contour);border-radius:.4rem;padding:.28rem .65rem;background:var(--ink-3);color:var(--paper);white-space:nowrap}
.btn:hover{border-color:var(--brass);color:var(--brass)} .btn.play{background:var(--brass);color:#1a1408;border-color:var(--brass)} .btn.play:hover{color:#1a1408;filter:brightness(1.08)}
.shelf[hidden],.sec[hidden],.start[hidden]{display:none}
/* coming next, techniques */
.sec{margin:0 0 2rem} .sec .sub{margin-bottom:.9rem}
.next{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(22rem,1fr));gap:.1rem 2rem;font-size:.86rem;color:var(--muted)}
.next li{padding:.35rem 0;border-bottom:1px dashed var(--contour)} .next li[hidden]{display:none} .next b{color:var(--paper);margin-right:.5rem}
.next .k{font:600 .66rem "IBM Plex Mono",monospace;color:var(--hero);text-transform:uppercase;letter-spacing:.06em;margin-right:.6rem}
.techs{display:flex;flex-wrap:wrap;gap:.4rem} .chip.tech.hot{border-color:#4f6c7f;background:rgba(108,184,255,.08)}
/* table */
.tablewrap{overflow-x:auto;border:1px solid var(--contour);border-radius:.6rem}
table{width:100%;border-collapse:collapse;font-size:.88rem;min-width:40rem}
th,td{padding:.5rem .7rem;text-align:left;border-bottom:1px solid var(--contour)} tr:last-child td{border-bottom:0}
th{font:600 .72rem "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--ink-2)}
th button{all:unset;cursor:pointer} th button:hover{color:var(--brass)} td.num,th.num{text-align:right}
td:nth-child(n+2){white-space:nowrap} td a{text-decoration:none} td a:hover{color:var(--brass)}
.empty{display:none;padding:2rem;text-align:center;color:var(--muted);border:1px dashed var(--contour);border-radius:.7rem;margin-bottom:2rem}
.noresults .empty{display:block}
footer{margin:2.5rem 0;color:var(--muted);font-size:.8rem;border-top:1px solid var(--contour);padding-top:1rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
footer a{color:var(--hero)}
@media(max-width:560px){.next{grid-template-columns:1fr}.grid{grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr));gap:.6rem}.sum{-webkit-line-clamp:2}.search kbd{display:none}}
@media(prefers-reduced-motion:reduce){.card{transition:none}}
'''

JS_HOME = r'''
(()=>{
"use strict";
document.body.classList.remove('no-js');
const LBL=JSON.parse(document.getElementById('kfdata').textContent).labels;
const lib=document.getElementById('lib'),q=document.getElementById('q'),finder=document.getElementById('finder'),up=document.getElementById('upcoming');
const cards=[...document.querySelectorAll('.card')];
const VISIBLE=new Set(['series','project','has']);// facets that have their own control in the finder
const sel={};// facet -> Set of values
const has=(el,f,v)=>(' '+el.dataset.tags+' ').includes(' '+f+':'+v+' ');
function matches(el,words){for(const f in sel){if(!sel[f].size)continue;let ok=false;for(const v of sel[f])if(has(el,f,v)){ok=true;break;}if(!ok)return false;}
  const s=el.dataset.search;for(const w of words)if(!s.includes(w))return false;return true;}
function apply(push=true){const words=q.value.toLowerCase().split(/\s+/).filter(Boolean);const active=Object.values(sel).some(s=>s.size)||words.length>0;
  let n=0;for(const c of cards){const m=matches(c,words);c.hidden=!m;if(m)n++;}
  document.querySelectorAll('.shelf').forEach(s=>{s.hidden=!s.querySelector('.card:not([hidden])');});
  document.getElementById('start').hidden=active;
  const ser=sel.series&&sel.series.size?[...sel.series][0]:'';const only=!words.length&&Object.keys(sel).every(f=>f==='series'||!sel[f].size);
  let u=0;up.querySelectorAll('li').forEach(li=>{li.hidden=!only||(ser&&li.dataset.series!==ser);if(!li.hidden)u++;});up.hidden=!u;
  lib.classList.toggle('noresults',n===0);lib.classList.toggle('one',!!ser);
  document.getElementById('count').textContent=active?`${n} of ${cards.length} studies`:`${cards.length} studies`;
  document.getElementById('clear').hidden=!active;
  document.querySelectorAll('[data-facet]').forEach(b=>{const s=sel[b.dataset.facet];b.setAttribute('aria-pressed',b.dataset.value===''?!(s&&s.size):!!(s&&s.has(b.dataset.value)));});
  const act=document.getElementById('active');act.innerHTML='';for(const f in sel){if(VISIBLE.has(f))continue;for(const v of sel[f]){const b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed','true');b.dataset.facet=f;b.dataset.value=v;b.textContent=(LBL[f+':'+v]||v)+' ×';act.appendChild(b);}}
  if(push){const p=new URLSearchParams();if(q.value.trim())p.set('q',q.value.trim());for(const f in sel)if(sel[f].size)p.set(f,[...sel[f]].join(','));const s=p.toString();history.replaceState(null,'',s?'?'+s:location.pathname);}}
function toggle(f,v,single){const s=(sel[f]=sel[f]||new Set());if(single){const on=s.has(v);s.clear();if(v&&!on)s.add(v);}else s.has(v)?s.delete(v):s.add(v);apply();
  const y=finder.getBoundingClientRect().top+scrollY;if(scrollY>y)scrollTo(0,y);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-facet]');if(!b)return;e.preventDefault();toggle(b.dataset.facet,b.dataset.value,b.hasAttribute('data-single'));});
q.addEventListener('input',()=>apply());
const clearAll=()=>{for(const f in sel)sel[f].clear();q.value='';apply();};document.getElementById('clear').onclick=clearAll;document.getElementById('clear2').onclick=clearAll;
addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==q){e.preventDefault();q.focus();}if(e.key==='Escape'&&document.activeElement===q){q.value='';apply();q.blur();}});
const P=new URLSearchParams(location.search);for(const [k,v] of P){if(k==='q')q.value=v;else sel[k]=new Set(v.split(',').filter(Boolean));}
apply(false);
})();
'''

JS_BROWSE = r'''
(()=>{
"use strict";
let sk=3,sd=-1;document.querySelectorAll('#tbl th button').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;sd=(k===sk)?-sd:(k===3||k===4?-1:1);sk=k;
  const tb=document.querySelector('#tbl tbody');const rs=[...tb.rows].sort((a,c)=>{const x=a.cells[k].dataset.s,y=c.cells[k].dataset.s;const nx=+x,ny=+y;return (isNaN(nx)||isNaN(ny)?x.localeCompare(y):nx-ny)*sd;});rs.forEach(r=>tb.appendChild(r));
  document.querySelectorAll('#tbl th button').forEach(x=>x.textContent=x.textContent.replace(/ [↑↓]$/,''));b.textContent+=sd<0?' ↓':' ↑';});
})();
'''

def head(title, desc):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:image" content="https://kingsfoil-artifacts.netlify.app/thumbs/vfx-light.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
{FONTS}
<style>{CSS}</style>
</head>'''

FOOT = f'''<footer><span>Kingsfoil Studios · Research library · updated {cat['updated']}</span><span><a href="index.html">Library</a> · <a href="browse.html">Techniques and all pages</a> · Data: <a href="catalog.json">catalog.json</a> · <a href="taxonomy.json">taxonomy.json</a></span></footer>'''
start_series = series_title(start["series"]["id"])

page = f'''{head("Kingsfoil Artifacts — game research library", cat['site']['intro'])}
<body class="no-js">
<div class="wrap">
<header class="top">
  <div class="brand">{LOGO.format(30)}<h1>Kingsfoil Artifacts</h1></div>
  <p class="intro">{E(cat['site']['intro'])}</p>
  <p class="statline">{statline} · <a class="more" href="browse.html">Techniques and all pages →</a></p>
</header>
</div>
<div class="finder" id="finder"><div class="wrap">
  <div class="searchrow">
    <label class="search"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="#a7b4b6" stroke-width="1.6"/><path d="M11 11l4 4" stroke="#a7b4b6" stroke-width="1.6"/></svg>
      <input id="q" type="search" placeholder="Search studies, techniques, games…" aria-label="Search the library" autocomplete="off"><kbd>/</kbd></label>
    <button type="button" class="tog" data-facet="has" data-value="playable" data-single aria-pressed="false">▶ Has sandbox</button>
  </div>
  <div class="navrow">
    <div class="group" role="group" aria-label="Series">{tabs}</div>
    <div class="group" role="group" aria-label="Project"><span class="fl">Project</span>{proj_chips}</div>
  </div>
  <div class="status" aria-live="polite"><span id="count"></span><span class="active-tags" id="active"></span><button type="button" id="clear" hidden>Clear all</button></div>
</div></div>
<main class="wrap" id="lib">
  <p class="start" id="start"><span class="k">★ Start here</span><span class="why"><b>{E(start_series['title'])} #{start['series']['number']} {E(start['short'])}.</b> {E(cat['start']['why'])}</span>
    <span class="actions"><a class="btn" href="{E(start['path'].lstrip('/'))}">Read →</a><a class="btn play" href="{E(items[start['pair']]['path'].lstrip('/'))}">▶ Play</a></span></p>
  <p class="empty">No studies match. Maybe that is the next study to write. <button type="button" class="tog" id="clear2">Clear filters</button></p>
  <div class="shelves">{''.join(shelves)}</div>
  <section class="sec" id="upcoming"><header class="shelf-h"><div><h2>Coming next</h2></div><p class="count">{n_up} planned</p></header><ul class="next">{upcoming}</ul></section>
  {FOOT}
</main>
<script type="application/json" id="kfdata">{data_json}</script>
<script>{JS_HOME}</script>
</body>
</html>
'''

browse = f'''{head("Techniques and all pages — Kingsfoil Artifacts", "Technique atlas and the full page list of the Kingsfoil Artifacts research library.")}
<body>
<div class="wrap">
<header class="top">
  <a class="brand" href="index.html">{LOGO.format(30)}<h1>Kingsfoil Artifacts</h1></a>
  <p class="statline"><a class="more" href="index.html">← Back to the library</a></p>
</header>
<main>
  <section class="sec" id="techniques"><header class="shelf-h"><div><h2>Technique atlas</h2><p class="sub">Reusable algorithms tagged across studies. Highlighted ones appear in more than one study. Click one to see its studies in the library.</p></div><p class="count">{len(tech)} techniques</p></header><div class="techs">{tech_html}</div></section>
  <section class="sec" id="all"><header class="shelf-h"><div><h2>All pages</h2><p class="sub">Every study and sandbox on the site. Click a column to sort.</p></div><p class="count">{len(cat['items'])} pages</p></header>
    <div class="tablewrap"><table id="tbl"><thead><tr><th><button data-k="0">Title</button></th><th><button data-k="1">Type</button></th><th><button data-k="2">Series</button></th><th><button data-k="3">Date ↓</button></th><th class="num"><button data-k="4">Words</button></th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section>
  {FOOT}
</main>
</div>
<script>{JS_BROWSE}</script>
</body>
</html>
'''

# ---------------- nav.json: data for the shared top bar (site/nav.js) ----------------
def nav_data():
    pages = {}
    for s in cat["series"]:
        members = [items[x] for x in s["order"]]
        for kind in ("study", "sandbox"):
            def target(m):  # the page of the same kind for a neighbour, or its study when it has no sandbox
                p = items[m["pair"]] if kind == "sandbox" and m.get("pair") else m
                return {"href": p["path"].lstrip("/"), "name": f'#{m["series"]["number"]} {m.get("nav", m["short"])}'}
            for n, m in enumerate(members):
                me = m if kind == "study" else items.get(m.get("pair"))
                if not me: continue
                other = items.get(m.get("pair")) if kind == "study" else m
                pages[me["path"].lstrip("/")] = {
                    "kind": kind, "series": s["id"], "label": s.get("nav_label", s["title"]),
                    "name": f'#{m["series"]["number"]} {m.get("nav", m["short"])}', "short": m.get("nav", m["short"]),
                    "pair": other["path"].lstrip("/") if other else None,
                    "prev": target(members[n - 1]) if n else None,
                    "next": target(members[n + 1]) if n < len(members) - 1 else None}
    return {"home": "index.html", "pages": pages}
nav_json = json.dumps(nav_data(), indent=1, ensure_ascii=False) + "\n"

outputs = {"index.html": page, "browse.html": browse, "nav.json": nav_json}
for name, text in outputs.items():
    path = f"{SITE}/{name}"
    if CHECK:
        if not os.path.exists(path) or open(path).read() != text:
            print(f"STALE: site/{name} differs from catalog.json — run `python -m studykit index`"); sys.exit(1)
    else:
        open(path, "w").write(text)

# ---------------- flat file inventory (safe-deploy manifest) ----------------
man = json.load(open(f"{SITE}/manifest.json"))
known = {e["path"]: e for e in man}
def upsert(path, title, desc, date):
    if path in known: known[path].update({"title": title, "description": desc, "date": date})
    else:
        e = {"path": path, "title": title, "description": desc, "date": date}; man.append(e); known[path] = e
upsert("/index.html", "Kingsfoil Artifacts", "Library homepage generated from catalog.json: series tabs, search, project filter, one shelf per series.", cat["updated"])
upsert("/browse.html", "Techniques and all pages", "Technique atlas and the sortable list of every page, generated from catalog.json.", cat["updated"])
upsert("/nav.json", "Navigation data", "Per-page series, previous/next and study/sandbox links, generated from catalog.json and read by nav.js.", cat["updated"])
upsert("/nav.js", "Shared top bar", "Adds the site bar (home, series, previous/next, study/sandbox switch) and the end-of-study links to every page.", cat["updated"])
upsert("/favicon.svg", "Favicon", "The Kingsfoil mark for the browser tab. Linked by index.html and browse.html, added to every other page by nav.js.", cat["updated"])
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
