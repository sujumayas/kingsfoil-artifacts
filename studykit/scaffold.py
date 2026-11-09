"""`studykit new` and `studykit register`.

new:      studies/<id>/ from a template study (its recipe + page chrome), a report skeleton that keeps the
          template's heading structure (the recipe parses those headings), placeholder sandbox/figures/demos,
          and a draft catalog entry (catalog-entry.json) pre-filled from the template's tags.
register: validates catalog-entry.json against taxonomy.json and merges it into site/catalog.json:
          adds the study + its sandbox, appends it to the series order, retires the matching "upcoming" card.
"""
import datetime, json, re, shutil, subprocess, sys
from . import REPO, SITE, STUDIES, catalog, load

ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)+$")


def new_study(sid, series, title, template="vfx-light", page=None):
    cat = catalog()
    ser = next((s for s in cat["series"] if s["id"] == series), None)
    if not ser: sys.exit(f"unknown series '{series}'. Known: {', '.join(s['id'] for s in cat['series'])} (add new series to catalog.json first)")
    if not ID_RE.match(sid) or not sid.startswith(series + "-"):
        sys.exit(f"id must follow {{series}}-{{concept}}[-{{qualifier}}], e.g. {series}-fire — got '{sid}'")
    d = STUDIES / sid
    if d.exists(): sys.exit(f"{d} already exists")
    t = load(template)
    if t.kind != "recipe": sys.exit(f"template '{template}' is not a recipe study")
    d.mkdir(parents=True); (d / "notes").mkdir()
    page = page or f"{sid}.html"
    sbx = page.replace(".html", "") .replace("-topdown-pixel", "") + "-sandbox.html"

    # recipe + page chrome from the template; template-only CSS becomes study.css
    recipe = (t.dir / "build.py").read_text()
    for css in re.findall(r"B / '([\w-]+\.css)'", recipe):
        if css != "style.css":
            recipe = recipe.replace(f"B / '{css}'", "B / 'study.css'")
    recipe = (f'"""Recipe for {title} — scaffolded from studies/{template}/build.py.\n'
              f"TODO: replace the template's study-specific parts: TOC / family lists, the figure→section map,\n"
              f"CTA and sandbox copy, the title and <meta> description, and the footer links.\n"
              f'Series nav comes from the catalog via S_.series_nav().\n"""\n') + recipe.split('"""', 2)[2].lstrip("\n")
    (d / "build.py").write_text(recipe)
    for f in ("style.css", "hero.html", "core.js"):
        if (t.dir / f).exists(): shutil.copyfile(t.dir / f, d / f)
    (d / "study.css").write_text(f"/* {title}: study-specific styles (theme overrides go in style.css :root) */\n")
    (d / "figs1.html").write_text("<!-- Figures: <!--FIG name-->…<!--/FIG--> blocks, mapped to sections in build.py -->\n")
    (d / "demos1.js").write_text(f"// {title}: demo registrations for figures (see core.js demo runner)\n")

    # report skeleton: the template's headings, no content
    heads = [l for l in t.report_text.splitlines() if l.startswith("#")]
    (d / "report.md").write_text(f"# {title}\n\n" + "\n\n".join(h + "\n\nTODO" for h in heads[1:]) + "\n")
    (d / "sandbox.html").write_text(f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Sandbox</title><style>html,body{{margin:0;background:#111;color:#ddd;font:14px system-ui}}canvas{{image-rendering:pixelated;width:100%;max-width:960px;display:block;margin:auto}}</style></head>
<body><canvas id="c" width="320" height="180"></canvas><p style="text-align:center">TODO: playable sandbox for {title}. <a href="index.html" style="color:#9cf">All artifacts</a></p></body></html>
""")
    (d / "study.yaml").write_text(f"""# Study config — read by studykit and by the recipe (build.py) via studykit.ctx(__file__).
id: {sid}   # must match the item id in site/catalog.json (run `python -m studykit register {sid}`)
kind: recipe
page: {page}
report: report.md
sandbox:
  page: {sbx}
  source: sandbox.html
qa:
  max_page_kb: 900
""")
    tmpl_item = t.item
    draft = {
        "id": sid, "type": "study", "path": "/" + page, "title": title, "short": "TODO short title", "nav": "TODO",
        "summary": "TODO one or two sentences for the homepage card.",
        "series": {"id": series, "number": len(ser["order"]) + 1}, "pair": sid + "-sandbox",
        "date": datetime.date.today().isoformat(), "updated": datetime.date.today().isoformat(),
        "thumb": f"/thumbs/{sid}.png",
        "tags": {**{k: v for k, v in tmpl_item["tags"].items() if k not in ("concept", "technique")}, "concept": [], "technique": []},
        "stats": {"words": 0, "techniques": 0, "figures": 0, "games": 0, "sources": 0},
        "_sandbox": {"title": f"{title.split(':')[0]} Sandbox (playable)", "path": "/" + sbx},
    }
    (d / "catalog-entry.json").write_text(json.dumps(draft, indent=1, ensure_ascii=False) + "\n")
    print(f"""created studies/{sid}/ from {template}
next:
  1. research → studies/{sid}/notes/, write studies/{sid}/report.md (keep the heading structure)
  2. fill studies/{sid}/catalog-entry.json: short, nav, summary, tags.concept, tags.technique (3–10, from taxonomy.json), stats
  3. python -m studykit register {sid}
  4. build the sandbox + figures + demos, adapt build.py, then: python -m studykit build {sid}
  5. python tools/thumbs.py {sid}  &&  python -m studykit index  &&  python -m studykit check""")


def register(sid):
    d = STUDIES / sid
    draft = json.loads((d / "catalog-entry.json").read_text())
    sbx = draft.pop("_sandbox", None)
    path = SITE / "catalog.json"; backup = path.read_text(); cat = json.loads(backup)
    if any(i["id"] == sid for i in cat["items"]): sys.exit(f"{sid} is already in catalog.json — edit it there")
    cat["items"].append(draft)
    if sbx:
        cat["items"].append({"id": draft["pair"], "type": "sandbox", "path": sbx["path"], "title": sbx["title"],
                             "short": draft["short"] + " sandbox", "summary": "Playable companion to the study.",
                             "pair": sid, "date": draft["date"], "updated": draft["updated"], "thumb": draft["thumb"],
                             "tags": draft["tags"], "maturity": "prototype"})
    ser = next(s for s in cat["series"] if s["id"] == draft["series"]["id"])
    ser["order"].append(sid)
    concept = sid.split("-", 1)[1].split("-")[0]
    ser["upcoming"] = [u for u in ser.get("upcoming", []) if not u["title"].lower().startswith(concept)]
    cat["updated"] = draft["updated"]
    path.write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    r = subprocess.run([sys.executable, str(REPO / "tools/build_index.py"), "--validate-only"], capture_output=True, text=True)
    if r.returncode:
        path.write_text(backup)
        sys.exit("catalog-entry.json rejected (catalog.json unchanged):\n" + r.stdout)
    print(f"registered {sid} in catalog.json (series {ser['id']} #{draft['series']['number']}). Older studies in the series get the new nav link on their next build.")
