import json, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "fogbench.html").as_uri()
mode = sys.argv[1]  # cpu | gpu
cfg = sys.argv[2] if len(sys.argv) > 2 else "default"

CONFIGS = {
    # Playwright default: chromium-headless-shell
    "default": dict(),
    # full Chromium in new headless mode, asking for the real GPU via ANGLE/Metal
    "metal": dict(channel="chromium", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]),
    "swiftshader": dict(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page()
    page.goto(URL)
    thr = [a for a in sys.argv if a.startswith("throttle")]
    if thr:
        rate = float(thr[0][8:]); cdp = page.context.new_cdp_session(page); cdp.send("Emulation.setCPUThrottlingRate", {"rate": rate}); cfg = cfg + "-throttle" + thr[0][8:]
    page.on("console", lambda m: print("console:", m.text, file=sys.stderr))
    blend = "opaque" not in sys.argv
    res = page.evaluate("runCPU()" if mode == "cpu" else f"runGPU({{blend: {str(blend).lower()}}})")
    res["browser_version"] = b.version
    res["config"] = cfg
    out = HERE / f"results-{mode}-{cfg}.json"
    out.write_text(json.dumps(res, indent=1))
    if "info" in res:
        print(json.dumps(res["info"], indent=1))
    for r in res["results"]:
        print(f'{r.get("median_ms", r.get("ok"))!s:>10} {r.get("timer_query_ms","")!s:>9}  {r["name"]}  {"" if "K" not in r else "K=%d" % r["K"]}')
    b.close()
