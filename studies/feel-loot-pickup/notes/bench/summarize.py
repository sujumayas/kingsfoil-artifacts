"""Print markdown tables (median / p95 ms per frame) across results-*.json."""
import json, pathlib
HERE = pathlib.Path(__file__).parent
ORDER = ["metal", "metal-throttle6", "swiftshader"]
runs = {k: json.loads((HERE / f"results-{k}.json").read_text()) for k in ORDER if (HERE / f"results-{k}.json").exists()}

print("# Loot bench, full tables\n")
for k, r in runs.items():
    m = r.get("machine", {})
    print(f"- {k}: Chromium {r['browser_version']}, {m.get('cpu')} {m.get('ncpu')} cores {m.get('mem_gb')} GB, macOS {m.get('os')}, crossOriginIsolated={r['info'].get('crossOriginIsolated')}, total {r['total_s']} s")
print("\nCanvas rows: median / p95 ms per frame for the whole frame (clear, 240 floor tiles, the test, x4 upscale blit, 1-pixel readback that forces the GPU to finish). "
      "Subtract `baseline_floor_only` for the effect alone. `cpu_only` rows time the JS function alone. (20f) marks a case cut to 20 frames because a warm-up frame took > 40 ms. "
      "Budget is 16.7 ms per frame at 60 fps.\n")
key = lambda r: (r["name"], r.get("n"))
first = next(iter(runs.values()))
sec_title = {"items": "Items, motion, glow, fly-to-bag", "beams": "Light beams (n = beams)", "labels": "Labels (all n labels drawn, no declutter)",
             "solver": "Label overlap solver (CPU only, 320x180 screen)", "magnet": "Magnet pull, 30 players (CPU only, 640x360 world, radius 64 px)", "boss": "Boss drop, 30 players (n = items in the drop pool)"}
def cell(run, r):
    m = next((x for x in run["results"] if key(x) == key(r) and "median_ms" in x and x.get("section") == r.get("section")), None)
    if not m: return "-"
    s = f'{m["median_ms"]:.2f} / {m["p95_ms"]:.2f}' + (" (20f)" if m["frames"] < 50 else "")
    if m["median_ms"] > 16.7: s = f"**{s}**"
    return s
for sec, title in sec_title.items():
    rows = [r for r in first["results"] if r.get("section") == sec]
    if not rows: continue
    print(f"\n## {title}\n")
    extra = {"solver": ["labels_placed", "overlap_checks"], "boss": ["labels_candidates", "labels_placed"]}.get(sec, [])
    print("| test | n | " + " | ".join(runs) + "".join(f" | {e}" for e in extra) + " |")
    print("|" + "---|" * (2 + len(runs) + len(extra)))
    for r in rows:
        print(f'| {r["name"]} | {r.get("n")} | ' + " | ".join(cell(run, r) for run in runs.values()) + "".join(f" | {r.get(e)}" for e in extra) + " |")

print("\n## DOM labels vs canvas atlas labels (rAF loop, 120 frames, labels bob every frame)\n")
print("Work = JS time inside the rAF callback (median / p95). Main = CDP Performance.getMetrics TaskDuration per frame, which adds style recalc, layout and main-thread paint. Compositor and GPU raster are not counted.\n")
print("| test | n | " + " | ".join(f"{k} work / main / style ms, frames>20ms" for k in runs) + " |")
print("|" + "---|" * (2 + len(runs)))
for r in [x for x in first["results"] if x.get("section") == "raf"]:
    cells = []
    for run in runs.values():
        m = next((x for x in run["results"] if x.get("section") == "raf" and key(x) == key(r)), None)
        cells.append(f'{m["median_ms"]:.2f}/{m["p95_ms"]:.2f} / {m.get("main_TaskDuration_ms_per_frame")} / {m.get("main_RecalcStyleDuration_ms_per_frame")}, {m["frames_over_20ms"]}' if m else "-")
    print(f'| {r["name"]} | {r["n"]} | ' + " | ".join(cells) + " |")
