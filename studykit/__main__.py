"""studykit CLI — run from the repo root.

  python -m studykit build [ID ...|--all]   build study pages (recipes) and publish their sandboxes
  python -m studykit index                  rebuild site/index.html + manifest from catalog.json
  python -m studykit qa ID [--shots]        browser QA for one study (console errors, overflow, links)
  python -m studykit new ID --series S --title "..." [--format F] [--no-sandbox] [--page NAME.html]   scaffold a new study
  python -m studykit formats                registered study formats (formats.yaml) and the studies using them
  python -m studykit register ID             validate studies/ID/catalog-entry.json and add it to catalog.json
  python -m studykit check                  full validator (what CI runs)
  python -m studykit list                   list studies with series and format
"""
import argparse, runpy, shutil, subprocess, sys
from . import REPO, SITE, load, all_studies, formats, catalog


def build(ids):
    studies = all_studies() if not ids else [load(i) for i in ids]
    failed = []
    for s in studies:
        if s.kind != "recipe":
            print(f"· {s.id}: static page, nothing to build"); continue
        print(f"▶ {s.id}")
        if s.sandbox_src and s.sandbox_src.exists():
            shutil.copyfile(s.sandbox_src, SITE / s.sandbox_name)
            print(f"  published sandbox → site/{s.sandbox_name}")
        try:
            runpy.run_path(str(s.dir / "build.py"), run_name="__main__")
        except Exception as e:  # keep building the others; report at the end
            import traceback; traceback.print_exc(limit=-2)
            failed.append(f"{s.id}: {type(e).__name__}: {e}")
    if failed:
        print("\nRECIPE FAILURES (a scaffolded study fails until its report.md has real content):\n  " + "\n  ".join(failed))
        sys.exit(1)


def main(argv=None):
    ap = argparse.ArgumentParser(prog="studykit", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build"); b.add_argument("ids", nargs="*"); b.add_argument("--all", action="store_true")
    sub.add_parser("index")
    q = sub.add_parser("qa"); q.add_argument("id"); q.add_argument("--shots", action="store_true")
    n = sub.add_parser("new"); n.add_argument("id"); n.add_argument("--series", required=True); n.add_argument("--title", required=True)
    n.add_argument("--format", dest="fmt", help="formats.yaml id; default: the format of the series' newest study")
    n.add_argument("--no-sandbox", action="store_true", help="skip the sandbox (formats where it is optional)"); n.add_argument("--page")
    rg = sub.add_parser("register"); rg.add_argument("id")
    sub.add_parser("check")
    sub.add_parser("list")
    sub.add_parser("formats")
    a = ap.parse_args(argv)
    if a.cmd == "build":
        build(a.ids)
    elif a.cmd == "index":
        sys.exit(subprocess.call([sys.executable, str(REPO / "tools/build_index.py")]))
    elif a.cmd == "qa":
        from .qa import qa_study
        sys.exit(0 if qa_study(load(a.id), shots=a.shots) else 1)
    elif a.cmd == "new":
        from .scaffold import new_study
        new_study(a.id, a.series, a.title, a.fmt, a.page, a.no_sandbox)
    elif a.cmd == "register":
        from .scaffold import register
        register(a.id)
    elif a.cmd == "check":
        sys.exit(subprocess.call([sys.executable, str(REPO / "tools/validate.py")]))
    elif a.cmd == "list":
        series = {i["id"]: i.get("series", {}).get("id", "-") for i in catalog()["items"]}
        for s in all_studies():
            print(f"{s.id:22} {series.get(s.id, '-'):8} {s.format or '-':14} {s.kind:7} site/{s.out_name}"
                  + (f"  + site/{s.sandbox_name}" if s.sandbox_name else ""))
    elif a.cmd == "formats":
        used = {}
        for s in all_studies(): used.setdefault(s.format, []).append(s.id)
        for fid, f in formats().items():
            src = f"template {f['template']}" if f.get("template") else f"base {f['base']}" if f.get("base") else ""
            print(f"{fid}  [{f['status']}]  sandbox {f['sandbox']}  {src}\n  {f['title']}\n  use for: {f.get('use_for', '')}"
                  + (f"\n  doc: {f['doc']}" if f.get("doc") else "") + f"\n  studies: {', '.join(used.get(fid, [])) or 'none yet'}\n")


if __name__ == "__main__":
    main()
