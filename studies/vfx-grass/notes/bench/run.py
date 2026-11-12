# Runner for grassbench.html. Same configs as studies/vfx-fog/notes/bench/run.py.
# python run.py cpu|gpu default|metal [throttle6]
import json, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "grassbench.html").as_uri()
mode = sys.argv[1]
cfg = sys.argv[2] if len(sys.argv) > 2 else "default"
CONFIGS = {
    "default": dict(),  # chromium-headless-shell, SwiftShader GL
    "metal": dict(channel="chromium", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]),
}
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page()
    page.goto(URL)
    thr = [a for a in sys.argv if a.startswith("throttle")]
    if thr:
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": float(thr[0][8:])})
        cfg += "-" + thr[0]
    page.on("console", lambda m: print("console:", m.text, file=sys.stderr))
    page.set_default_timeout(0)
    res = page.evaluate("runCPU()" if mode == "cpu" else "runGPU()")
    res["browser_version"] = b.version
    res["config"] = cfg
    (HERE / f"results-{mode}-{cfg}.json").write_text(json.dumps(res, indent=1))
    if "info" in res:
        print(json.dumps(res["info"], indent=1))
    for r in res["results"]:
        print(f'{r.get("median_ms", r.get("ok"))!s:>10} {r.get("p10_ms","")!s:>9} {r.get("p90_ms","")!s:>9} {r.get("timer_query_ms","")!s:>9}  {r["name"]}')
    b.close()
