#!/usr/bin/env python3
"""Site validator — what CI runs on every pull request.

  python tools/validate.py              all checks
  python tools/validate.py --no-browser skip the Playwright pass (fast, ~2 s)
  python tools/validate.py --rebuild    also rebuild every recipe study and fail if output changed
  python tools/validate.py --since=REF  browser pass only for site/*.html pages changed since REF (CI uses the PR base)

Checks
  1. catalog.json / taxonomy.json valid; index.html, browse.html, nav.json, manifest.json up to date   (tools/build_index.py --check)
  2. every study folder matches the catalog (ids, pages, reports, sandboxes); every page loads the shared site bar (nav.js);
     every study follows its format (formats.yaml)
  3. manifest.json lists exactly the files in site/
  4. every local link and image in every page resolves
  5. no external images (img/video/audio/source/CSS url) — pages must be self-contained
  6. page-weight budget (study.yaml qa.max_page_kb; sandboxes 600 KB; others 300 KB)
  7. browser: no console/page errors, no horizontal overflow at 390 px          (studykit.qa)
  8. --rebuild: recipes reproduce the committed pages byte-for-byte
"""
import sys, re, json, hashlib, subprocess, pathlib
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

REPO = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))
import studykit
from studykit import SITE

args = {a for a in sys.argv[1:] if not a.startswith("--since=")}
since = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--since=")), None)
fails, warns = [], []
def fail(m): fails.append(m)
def warn(m): warns.append(m)
def step(n): print(f"\n── {n}")

# 1 ────────────────────────────────────────────
step("1 catalog, taxonomy, index freshness")
r = subprocess.run([sys.executable, str(REPO / "tools/build_index.py"), "--check"], capture_output=True, text=True)
print(r.stdout.strip() or r.stderr.strip())
if r.returncode: fail("build_index --check failed:\n" + r.stdout + r.stderr)

# 2 ────────────────────────────────────────────
step("2 studies ↔ catalog")
cat = studykit.catalog(); items = {i["id"]: i for i in cat["items"]}
studies = studykit.all_studies(); sids = {s.id for s in studies}
for s in studies:
    if s.id not in items: fail(f"studies/{s.dir.name}: id '{s.id}' not in catalog.json"); continue
    if s.dir.name != s.id: fail(f"studies/{s.dir.name}: folder name must equal id '{s.id}'")
    if "/" + s.out_name != items[s.id]["path"]: fail(f"{s.id}: study.yaml page '{s.out_name}' ≠ catalog path '{items[s.id]['path']}'")
    if not s.out_path.exists(): fail(f"{s.id}: site/{s.out_name} missing")
    if s.kind == "recipe":
        for need in [s.dir / "build.py", s.report_path]:
            if not need.exists(): fail(f"{s.id}: missing {need.relative_to(REPO)}")
        if s.sandbox_name:
            pair = items[s.id].get("pair")
            if not pair or items[pair]["path"] != "/" + s.sandbox_name:
                fail(f"{s.id}: sandbox '{s.sandbox_name}' not paired in catalog")
            if not s.sandbox_src or not s.sandbox_src.exists(): fail(f"{s.id}: sandbox source missing")
            elif not (SITE / s.sandbox_name).exists(): fail(f"{s.id}: site/{s.sandbox_name} missing — run `python -m studykit build {s.id}`")
            elif s.sandbox_src.read_bytes() != (SITE / s.sandbox_name).read_bytes():
                fail(f"{s.id}: site/{s.sandbox_name} differs from {s.sandbox_src.relative_to(REPO)} — edit the source, then `python -m studykit build {s.id}`")
for i in cat["items"]:
    if i["type"] == "study" and i["id"] not in sids: fail(f"catalog study '{i['id']}' has no studies/{i['id']}/study.yaml")
for i in cat["items"]:
    if i["type"] == "sandbox" and i.get("pair") in items and i.get("series") != items[i["pair"]].get("series"):
        fail(f"sandbox '{i['id']}': series must match its study '{i['pair']}'")
for i in cat["items"]:
    pg = SITE / i["path"].lstrip("/")
    if pg.exists() and studykit.NAV_TAG not in pg.read_text():
        fail(f"{i['id']}: {pg.name} does not load the shared site bar. Add {studykit.NAV_TAG} before </body>"
             + (" in the sandbox source" if i["type"] == "sandbox" else " (recipe pages get it from `python -m studykit build`)"))
print(f"{len(studies)} studies checked")

# 2b ───────────────────────────────────────────
step("2b formats (formats.yaml, docs/FORMATS.md)")
fmts = studykit.formats(); by_id = {s.id: s for s in studies}
for fid, f in fmts.items():
    st, sb = f.get("status"), f.get("sandbox")
    if st not in ("active", "draft", "legacy"): fail(f"format {fid}: status must be active, draft or legacy"); continue
    if sb not in ("required", "optional", "none"): fail(f"format {fid}: sandbox must be required, optional or none")
    if f.get("doc") and not (REPO / f["doc"]).exists(): fail(f"format {fid}: doc {f['doc']} missing")
    if st == "legacy": continue
    for k in ("title", "use_for", "page", "doc") + (("sandbox_page",) if sb != "none" else ()):
        if not f.get(k): fail(f"format {fid}: missing '{k}'")
    if st == "active":
        t = by_id.get(f.get("template"))
        if not t or t.kind != "recipe" or t.format != fid:
            fail(f"format {fid}: template '{f.get('template')}' must be a recipe study whose study.yaml says format: {fid}")
    else:
        b = by_id.get(f.get("base"))
        if not b or b.kind != "recipe": fail(f"format {fid}: base '{f.get('base')}' must be a recipe study")
        warn(f"format {fid} is a draft: promote it once its first study ships (docs/FORMATS.md §3)")
for s in studies:
    f = fmts.get(s.format)
    if not f: fail(f"{s.id}: format '{s.format}' is not in formats.yaml"); continue
    if f["status"] == "legacy" and s.id not in f.get("studies", []):
        fail(f"{s.id}: format '{s.format}' is legacy and only allowed for {f.get('studies', [])}")
    if f["sandbox"] == "required" and not s.sandbox_name: fail(f"{s.id}: format '{s.format}' requires a sandbox")
    if f["sandbox"] == "none" and s.sandbox_name: fail(f"{s.id}: format '{s.format}' has no sandbox, but study.yaml declares one")
print(f"{len(fmts)} formats, {len(studies)} studies checked")

# 3 ────────────────────────────────────────────
step("3 manifest ↔ files")
man = {e["path"] for e in json.loads((SITE / "manifest.json").read_text())}
files = {"/" + str(p.relative_to(SITE)) for p in SITE.rglob("*") if p.is_file() and not any(x.startswith(".") for x in p.relative_to(SITE).parts)}
for p in sorted(files - man - {"/_headers", "/_redirects"}): fail(f"file not in manifest.json: {p}")
for p in sorted(man - files): fail(f"manifest.json lists missing file: {p}")
print(f"{len(files)} files, {len(man)} manifest entries")

# 4–6 ──────────────────────────────────────────
step("4–6 links, external images, page weight")
class Refs(HTMLParser):
    def __init__(s): super().__init__(); s.refs = []; s.ext_media = []; s.ids = set()
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if "id" in a: s.ids.add(a["id"])
        for k in ("href", "src", "poster"):
            v = a.get(k)
            if not v: continue
            if tag in ("img", "video", "audio", "source") or k == "poster":
                if re.match(r"(https?:)?//", v): s.ext_media.append(v)
            if tag == "link" and a.get("rel") in ("preconnect", "dns-prefetch"): continue
            s.refs.append((tag, v))
budget_for = {s.out_name: s.cfg.get("qa", {}).get("max_page_kb", 900) for s in studies}
pages = sorted(p for p in SITE.glob("*.html"))
for p in pages:
    txt = p.read_text(); rp = Refs(); rp.feed(txt)
    for tag, v in rp.refs:
        u = urlsplit(v)
        if u.scheme in ("http", "https", "mailto", "data", "javascript") or v.startswith("//"): continue
        if not u.path:
            if u.fragment and u.fragment not in rp.ids and tag == "a": warn(f"{p.name}: anchor #{u.fragment} not found")
            continue
        target = (SITE / unquote(u.path).lstrip("/")) if u.path.startswith("/") else (p.parent / unquote(u.path))
        if target.is_dir(): target = target / "index.html"
        if u.path.startswith("/.netlify/"):
            fail(f"{p.name}: contains a Netlify-injected tag ({v}) — this page was saved from the live site; remove it"); continue
        if not target.exists(): fail(f"{p.name}: broken local link {v}")
    for v in rp.ext_media: fail(f"{p.name}: external media {v}")
    for m in re.finditer(r"url\(\s*['\"]?(https?:[^'\")]+)", txt): fail(f"{p.name}: external CSS url {m.group(1)[:80]}")
    kb = p.stat().st_size / 1024
    budget = budget_for.get(p.name, 600 if "sandbox" in p.name else 300)
    if kb > budget: fail(f"{p.name}: {kb:.0f} KB exceeds budget {budget} KB")
    elif kb > budget * 0.85: warn(f"{p.name}: {kb:.0f} KB is within 15% of its {budget} KB budget")
print(f"{len(pages)} pages scanned")

# 8 (before the browser pass, so the browser sees rebuilt pages) ──
if "--rebuild" in args:
    step("8 reproducible builds")
    recipes = [s for s in studies if s.kind == "recipe"]
    outs = [s.out_path for s in recipes] + [SITE / s.sandbox_name for s in recipes if s.sandbox_name]
    before = {o: hashlib.sha256(o.read_bytes()).hexdigest() for o in outs if o.exists()}
    r = subprocess.run([sys.executable, "-m", "studykit", "build", "--all"], cwd=REPO, capture_output=True, text=True)
    if r.returncode: fail("studykit build failed:\n" + r.stderr[-2000:])
    for o in outs:
        if before.get(o) != hashlib.sha256(o.read_bytes()).hexdigest():
            fail(f"site/{o.name} is not reproducible from its source (rebuilt output differs) — run `python -m studykit build` and commit")
    print(f"{len(outs)} outputs rebuilt")

# 7 ────────────────────────────────────────────
browser_pages = [p.name for p in pages]
if since and "--no-browser" not in args:
    r = subprocess.run(["git", "diff", "--name-only", f"{since}...HEAD", "--", "site/"], cwd=REPO, capture_output=True, text=True)
    if r.returncode: fail(f"git diff against {since} failed: {r.stderr.strip()}")
    changed = {pathlib.PurePath(f).name for f in r.stdout.split()}
    browser_pages = [n for n in browser_pages if n in changed]
    if not browser_pages:
        step("7 browser: skipped, no pages changed since " + since)
if "--no-browser" not in args and browser_pages:
    step(f"7 browser (390 px phone): console errors, overflow — {len(browser_pages)} page(s)")
    from studykit.qa import browse
    res = browse(browser_pages)
    for page, issues in res.items():
        print(("  ✔ " if not issues else "  ✘ ") + page)
        for i in dict.fromkeys(issues): fail(f"{page}: {i}")

print("\n" + "═" * 60)
for w in warns: print("WARN ", w)
for f in fails: print("FAIL ", f)
print(f"{'PASS' if not fails else 'FAIL'} — {len(fails)} failures, {len(warns)} warnings")
sys.exit(1 if fails else 0)
