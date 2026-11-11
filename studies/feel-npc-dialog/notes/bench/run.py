"""Run textbench.html in Chromium via Playwright.

Usage: python run.py <config> [throttle6] [frames=300]
  config: default (headless shell, which falls back to SwiftShader on this Mac)
          metal   (full Chromium, real GPU via ANGLE/Metal)
          swiftshader (forced software GL)
"""
import json, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "textbench.html").as_uri()
cfg = sys.argv[1] if len(sys.argv) > 1 else "metal"
frames = int(next((a[7:] for a in sys.argv if a.startswith("frames=")), "300"))

CONFIGS = {
    "default": dict(),
    "metal": dict(channel="chromium", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]),
    "swiftshader": dict(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page(viewport={"width": 1400, "height": 900})
    page.goto(URL)
    name = cfg
    thr = [a for a in sys.argv if a.startswith("throttle")]
    if thr:
        rate = float(thr[0][8:])
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": rate})
        name += "-throttle" + thr[0][8:]
    page.on("console", lambda m: print("console:", m.text, file=sys.stderr))
    res = page.evaluate(f"runAll({{frames: {frames}}})")
    res["browser_version"] = b.version
    res["config"] = name
    out = HERE / f"results-{name}.json"
    out.write_text(json.dumps(res, indent=1))
    print(json.dumps(res["info"], indent=1), "total_s", res["total_s"])
    for r in res["results"]:
        k = r.get("glyphs", r.get("bubbles", r.get("glyphs_max", "")))
        print(f'{r["median_ms"]:>9} {r["mean_ms"]:>9} {r["p95_ms"]:>9}  {r["target"]:<24} {r["name"]} n={k} bub={r.get("bubbles","")}')
    b.close()
