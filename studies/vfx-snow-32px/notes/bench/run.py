# Runner for snowbench.html. Same method as studies/vfx-magic/notes/bench/run.py.
# python run.py gpu|swiftshader [throttle6] [mode=cpu|gpu|all] [only=<regex>] [tag=<suffix>] [samples=<n>]
#   gpu         = full Chromium, new headless, ANGLE on Metal (the real GPU)
#   swiftshader = chromium-headless-shell, software GL (SwiftShader), software canvas
#   throttle6   = DevTools CPU throttling 6x on the page's main thread (Emulation.setCPUThrottlingRate)
import json, sys, time, pathlib, platform
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "snowbench.html").as_uri()
cfg = sys.argv[1]
arg = lambda key, default=None: next((a[len(key) + 1:] for a in sys.argv if a.startswith(key + "=")), default)
mode, only, tag = arg("mode", "all"), arg("only"), arg("tag", "")
CONFIGS = {
    "swiftshader": dict(),
    "gpu": dict(channel="chromium", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]),
}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page()
    page.on("console", lambda m: (errors.append(m.text) if m.type in ("error", "warning") else None, print("console:", m.type, m.text, file=sys.stderr)))
    page.on("pageerror", lambda e: (errors.append(str(e)), print("pageerror:", e, file=sys.stderr)))
    page.goto(URL)
    thr = [a for a in sys.argv if a.startswith("throttle")]
    name = cfg
    if thr:
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": float(thr[0][8:])})
        name += "-" + thr[0]
    page.set_default_timeout(0)
    opts = {"only": only} if only else {}
    if arg("samples"):
        opts["bench"] = {"samples": int(arg("samples"))}
    opts = json.dumps(opts)
    res = {"config": name, "browser_version": b.version, "platform": platform.platform(), "machine": platform.machine(), "started": time.strftime("%Y-%m-%d %H:%M:%S")}
    t0 = time.time()
    if mode in ("cpu", "all"):
        res["cpu"] = page.evaluate(f"runCPU({opts})")
    if mode in ("gpu", "all"):
        res["gpu"] = page.evaluate(f"runGPU({opts})")
    res["seconds"] = round(time.time() - t0, 1)
    res["console_errors_and_warnings"] = errors
    suffix = ("-" + mode if mode != "all" else "") + tag
    (HERE / f"results-{name}{suffix}.json").write_text(json.dumps(res, indent=1))
    for part in ("cpu", "gpu"):
        if part not in res:
            continue
        print(json.dumps(res[part].get("info", {}), indent=1)[:1500])
        for r in res[part]["results"]:
            if "error" in r:
                print("ERROR", r["name"], r["error"][:300])
                continue
            print(f'{r.get("median_ms", "")!s:>10} {r.get("p95_ms", "")!s:>10} {r.get("js_ms", "")!s:>9} {r.get("timer_query_ms", "")!s:>9}  {r["name"]}' + (f'  {json.dumps(r["layers_ms"])}' if "layers_ms" in r else ""))
    print("seconds:", res["seconds"], "console errors/warnings:", len(errors))
    b.close()
