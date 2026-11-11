"""Run juicebench.html in Chromium via Playwright.

Usage: .venv/bin/python run.py <config> [throttle6] [frames=200] [sections=dmg,particles,...]
  config: metal       full Chromium, real GPU via ANGLE/Metal
          swiftshader forced software GL (Canvas2D and WebGL on the CPU)
  throttle6: CDP Emulation.setCPUThrottlingRate 6 (main thread only, GPU untouched)

The page is served over a local http server with COOP/COEP headers so the page is
crossOriginIsolated and performance.now() has 5 us resolution (file:// gives 100 us).
Audio plays through a master gain of 0.0001 and Chromium runs with --mute-audio.
"""
import json, sys, pathlib, threading, subprocess, platform
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
cfg = sys.argv[1] if len(sys.argv) > 1 else "metal"
frames = int(next((a[7:] for a in sys.argv if a.startswith("frames=")), "200"))
sections = next((a[9:].split(",") for a in sys.argv if a.startswith("sections=")), None)

COMMON = ["--autoplay-policy=no-user-gesture-required", "--mute-audio"]
CONFIGS = {
    "metal": dict(channel="chromium", args=COMMON + ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]),
    "swiftshader": dict(channel="chromium", args=COMMON + ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-rasterization"]),
}

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a): pass

def machine():
    sh = lambda c: subprocess.run(c, shell=True, capture_output=True, text=True).stdout.strip()
    return {"cpu": sh("sysctl -n machdep.cpu.brand_string"), "ncpu": sh("sysctl -n hw.ncpu"),
            "mem_gb": round(int(sh("sysctl -n hw.memsize") or 0) / 2**30, 1),
            "os": sh("sw_vers -productVersion") + " " + sh("sw_vers -buildVersion"), "platform": platform.platform()}

srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(H, directory=str(HERE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{srv.server_address[1]}/juicebench.html"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, **CONFIGS[cfg])
    page = b.new_page(viewport={"width": 1400, "height": 900})
    page.goto(URL)
    name = cfg
    thr = [a for a in sys.argv if a.startswith("throttle")]
    if thr:
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": float(thr[0][8:])})
        name += "-throttle" + thr[0][8:]
    page.on("console", lambda m: print("console:", m.text, file=sys.stderr))
    page.on("pageerror", lambda e: print("pageerror:", e, file=sys.stderr))
    opts = {"frames": frames}
    if sections: opts["sections"] = sections
    res = page.evaluate("o => runAll(o)", opts)
    res["browser_version"] = b.version
    res["config"] = name
    res["machine"] = machine()
    out = HERE / f"results-{name}.json"
    out.write_text(json.dumps(res, indent=1))
    print(json.dumps(res["info"], indent=1), json.dumps(res["audioInfo"]), "total_s", res["total_s"])
    for r in res["results"]:
        if "error" in r: print("ERROR", r); continue
        if "median_ms" in r:
            n = r.get("hits_alive", r.get("particles", r.get("sprites", r.get("decals", ""))))
            print(f'{r["median_ms"]:>9} {r["p95_ms"]:>9}  {r.get("target",""):<32} {r["name"]} n={n} agg={r.get("aggregated","")}')
        else:
            print(r)
    b.close()
srv.shutdown()
