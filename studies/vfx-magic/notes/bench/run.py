# Runner for magicbench.html. Same configs as studies/vfx-grass/notes/bench/run.py.
# python run.py cpu|gpu default|metal [throttle6] [only=<regex>] [tag=<suffix>]
import json, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "magicbench.html").as_uri()
mode = sys.argv[1]
cfg = sys.argv[2] if len(sys.argv) > 2 else "default"
only = next((a[5:] for a in sys.argv if a.startswith("only=")), None)
tag = next((a[4:] for a in sys.argv if a.startswith("tag=")), "")
CONFIGS = {
    "default": dict(),  # chromium-headless-shell, SwiftShader GL
    "metal": dict(channel="chromium", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]),
}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page()
    page.on("console", lambda m: (errors.append(m.text) if m.type in ("error", "warning") else None, print("console:", m.type, m.text, file=sys.stderr)))
    page.on("pageerror", lambda e: (errors.append(str(e)), print("pageerror:", e, file=sys.stderr)))
    page.goto(URL)
    thr = [a for a in sys.argv if a.startswith("throttle")]
    if thr:
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": float(thr[0][8:])})
        cfg += "-" + thr[0]
    page.set_default_timeout(0)
    opts = json.dumps({"only": only} if only else {})
    res = page.evaluate(f"runCPU({opts})" if mode == "cpu" else f"runGPU({opts})")
    res["browser_version"] = b.version
    res["config"] = cfg
    res["console_errors_and_warnings"] = errors
    (HERE / f"results-{mode}-{cfg}{tag}.json").write_text(json.dumps(res, indent=1))
    if "info" in res:
        print(json.dumps(res["info"], indent=1))
    for r in res["results"]:
        print(f'{r.get("median_ms", "")!s:>10} {r.get("p10_ms","")!s:>9} {r.get("p90_ms","")!s:>9} {r.get("timer_query_ms","")!s:>9}  {r["name"]}' + (f'  {json.dumps(r["layers"])}' if "layers" in r else ""))
    print("console errors/warnings:", len(errors))
    b.close()
