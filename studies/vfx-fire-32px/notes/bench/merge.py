# Prints the markdown tables of 16-benchmarks.md from the three full-run JSON files. Usage: python merge.py
import json, pathlib, sys
B = pathlib.Path(__file__).parent.parent / "bench"
tag = sys.argv[1] if len(sys.argv) > 1 else ""
R = {k: json.loads((B / f"results-{k}{tag}.json").read_text()) for k in ["gpu", "swiftshader", "gpu-throttle6-cpu"]}
def idx(res, part):
    return {r["name"]: r for r in res.get(part, {}).get("results", [])}
G, S, T = idx(R["gpu"], "cpu"), idx(R["swiftshader"], "cpu"), idx(R["gpu-throttle6-cpu"], "cpu")
def f(v):
    if v is None: return "-"
    if v >= 10: return f"{v:.1f}"
    if v >= 1: return f"{v:.2f}"
    if v >= 0.1: return f"{v:.3f}"
    if v >= 0.01: return f"{v:.4f}"
    return f"{v:.5f}"
cur = None
for name, g in G.items():
    pre = name.split("/")[0]
    if pre != cur:
        cur = pre
        print(f"\n### {pre}\n\n| Row | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 | extra |\n|---|---:|---:|---:|---:|---:|---|")
    if "error" in g: print(f"| {name} | ERROR |"); continue
    s, t = S.get(name, {}), T.get(name, {})
    ex = {k: v for k, v in g.items() if k not in ("name", "median_ms", "p95_ms", "p10_ms", "p90_ms", "min_ms", "samples", "calls", "layers_ms")}
    print(f"| {name} | {f(g.get('median_ms'))} | {f(g.get('p95_ms'))} | {f(s.get('median_ms'))} | {f(t.get('median_ms'))} | {f(t.get('p95_ms'))} | {json.dumps(ex) if ex else ''} |")
print("\n### layers")
for name, g in G.items():
    if "layers_ms" in g:
        for lbl, src in (("GPU", g), ("SwiftShader", S.get(name, {})), ("6x", T.get(name, {}))):
            print(name, lbl, json.dumps(src.get("layers_ms")))
print("\n### gpu part\n\n| Row | GPU run wall median | GPU run wall p95 | GPU run js ms | GPU run timer query | SwiftShader wall median | SwiftShader js ms |\n|---|---:|---:|---:|---:|---:|---:|")
GG, SG = idx(R["gpu"], "gpu"), idx(R["swiftshader"], "gpu")
for name, g in GG.items():
    s = SG.get(name, {})
    print(f"| {name} | {f(g.get('median_ms'))} | {f(g.get('p95_ms'))} | {f(g.get('js_ms'))} | {f(g.get('timer_query_ms'))} | {f(s.get('median_ms'))} | {f(s.get('js_ms'))} |")
for k, r in R.items():
    print(k, r["browser_version"], r["started"], r["seconds"], "warnings:", len(r["console_errors_and_warnings"]), set(r["console_errors_and_warnings"]) if r["console_errors_and_warnings"] else "", r.get("gpu", {}).get("info", {}).get("renderer"))
    print("  errors:", [x["name"] for p in ("cpu", "gpu") for x in r.get(p, {}).get("results", []) if "error" in x])
