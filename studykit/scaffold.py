"""`studykit new` and `studykit register`.

new:      studies/<id>/ for a registered format (formats.yaml): the format's template recipe + page chrome,
          a report skeleton that keeps the template's heading structure (the recipe parses those headings),
          placeholder figures/demos, a sandbox only if the format has one, and a draft catalog entry
          (catalog-entry.json) pre-filled from the template's tags. See docs/FORMATS.md.
register: validates catalog-entry.json against taxonomy.json and merges it into site/catalog.json:
          adds the study + its sandbox, appends it to the series order, retires the matching "upcoming" card.
"""
import datetime, json, re, shutil, subprocess, sys
from . import REPO, SITE, STUDIES, catalog, formats, load

ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)+$")


def _format_menu(fmts):
    return "\n".join(f"  {k:16} {v['status']:7} sandbox {v['sandbox']:8} {v.get('use_for', '')}"
                     for k, v in fmts.items() if v["status"] != "legacy")


def new_study(sid, series, title, fmt=None, page=None, no_sandbox=False):
    cat = catalog()
    ser = next((s for s in cat["series"] if s["id"] == series), None)
    if not ser: sys.exit(f"unknown series '{series}'. Known: {', '.join(s['id'] for s in cat['series'])} (add new series to catalog.json first, see docs/FORMATS.md)")
    if not ID_RE.match(sid) or not sid.startswith(series + "-"):
        sys.exit(f"id must follow {{series}}-{{concept}}[-{{qualifier}}], e.g. {series}-fire — got '{sid}'")
    d = STUDIES / sid
    if d.exists(): sys.exit(f"{d} already exists")

    # format: explicit, or the one the series' newest study uses
    fmts = formats()
    if not fmt:
        used = [load(x).format for x in ser["order"] if (STUDIES / x / "study.yaml").exists()]
        fmt = next((f for f in reversed(used) if f and fmts.get(f, {}).get("status") != "legacy"), None)
        if not fmt:
            sys.exit(f"series '{series}' has no study in an active format yet; pass --format. Formats:\n{_format_menu(fmts)}\n"
                     "None fits? Add a draft format first (docs/FORMATS.md §3).")
        print(f"format: {fmt} (from series '{series}')")
    f = fmts.get(fmt)
    if not f: sys.exit(f"unknown format '{fmt}'. Formats:\n{_format_menu(fmts)}")
    if f["status"] == "legacy": sys.exit(f"format '{fmt}' is legacy and cannot be used for new studies")
    template = f["template"] if f["status"] == "active" else f["base"]
    has_sbx = f["sandbox"] == "required" or (f["sandbox"] == "optional" and not no_sandbox)
    if no_sandbox and f["sandbox"] == "required": sys.exit(f"format '{fmt}' requires a sandbox")
    t = load(template)
    if t.kind != "recipe": sys.exit(f"template '{template}' of format '{fmt}' is not a recipe study")
    d.mkdir(parents=True); (d / "notes").mkdir()
    page = page or f["page"].format(id=sid)
    sbx = f["sandbox_page"].format(id=sid) if has_sbx else None

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
    for fn in ("style.css", "hero.html", "core.js"):
        if (t.dir / fn).exists(): shutil.copyfile(t.dir / fn, d / fn)
    (d / "study.css").write_text(f"/* {title}: study-specific styles (theme overrides go in style.css :root) */\n")
    (d / "figs1.html").write_text("<!-- Figures: <!--FIG name-->…<!--/FIG--> blocks, mapped to sections in build.py -->\n")
    (d / "demos1.js").write_text(f"// {title}: demo registrations for figures (see core.js demo runner)\n")

    # report skeleton: the template's headings, no content
    heads = [l for l in t.report_text.splitlines() if l.startswith("#")]
    (d / "report.md").write_text(f"# {title}\n\n" + "\n\n".join(h + "\n\nTODO" for h in heads[1:]) + "\n")
    if sbx: (d / "sandbox.html").write_text(f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Sandbox</title><style>html,body{{margin:0;background:#111;color:#ddd;font:14px system-ui}}canvas{{image-rendering:pixelated;width:100%;max-width:960px;display:block;margin:auto}}</style></head>
<body><canvas id="c" width="320" height="180"></canvas><p style="text-align:center">TODO: playable sandbox for {title}. <a href="index.html" style="color:#9cf">All artifacts</a></p></body></html>
""")
    sbx_cfg = f"sandbox:\n  page: {sbx}\n  source: sandbox.html\n" if sbx else ""
    (d / "study.yaml").write_text(f"""# Study config — read by studykit and by the recipe (build.py) via studykit.ctx(__file__).
id: {sid}   # must match the item id in site/catalog.json (run `python -m studykit register {sid}`)
format: {fmt}   # formats.yaml; layout and rules in {f.get("doc", "docs/FORMATS.md")}
kind: recipe
page: {page}
report: report.md
{sbx_cfg}qa:
  max_page_kb: 900
""")
    tmpl_item = t.item
    draft = {
        "id": sid, "type": "study", "path": "/" + page, "title": title, "short": "TODO short title", "nav": "TODO",
        "summary": "TODO one or two sentences for the homepage card.",
        "series": {"id": series, "number": len(ser["order"]) + 1},
        "date": datetime.date.today().isoformat(), "updated": datetime.date.today().isoformat(),
        "thumb": f"/thumbs/{sid}.{'png' if sbx else 'webp'}",
        "tags": {**{k: v for k, v in tmpl_item["tags"].items() if k not in ("concept", "technique")}, "concept": [], "technique": []},
        "stats": {"words": 0, "techniques": 0, "figures": 0, "games": 0, "sources": 0},
    }
    if sbx:
        draft["pair"] = sid + "-sandbox"
        draft["_sandbox"] = {"title": f"{title.split(':')[0]} Sandbox (playable)", "path": "/" + sbx}
    (d / "catalog-entry.json").write_text(json.dumps(draft, indent=1, ensure_ascii=False) + "\n")
    print(f"""created studies/{sid}/ in format {fmt} (cloned from {template}){"" if sbx else ", no sandbox"}
next:
  1. research (docs/RESEARCH.md) → studies/{sid}/notes/, write studies/{sid}/report.md in the layout of {f.get("doc", "the format doc")}
  2. fill studies/{sid}/catalog-entry.json: short, nav, summary, tags.concept, tags.technique (3–10, from taxonomy.json), stats
  3. python -m studykit register {sid}
  4. build {"the sandbox + " if sbx else ""}figures + demos, adapt build.py, then: python -m studykit build {sid}
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
                             "series": draft["series"],
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
