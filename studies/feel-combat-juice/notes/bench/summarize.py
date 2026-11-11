"""Print markdown tables (median / p95 ms per frame) across results-*.json."""
import json, pathlib
HERE = pathlib.Path(__file__).parent
ORDER = ["metal", "metal-throttle6", "swiftshader"]
runs = {}
for k in ORDER:
    f = HERE / f"results-{k}.json"
    if f.exists(): runs[k] = json.loads(f.read_text())

print("# Combat juice bench, full tables\n")
for k, r in runs.items():
    m = r.get("machine", {})
    print(f"- {k}: Chromium {r['browser_version']}, WebGL `{r['info'].get('renderer')}`, {m.get('cpu')} {m.get('ncpu')} cores {m.get('mem_gb')} GB, macOS {m.get('os')}, crossOriginIsolated={r['info'].get('crossOriginIsolated')}, total {r['total_s']} s")
print("\nCells are median / p95 ms per frame, including clear, upscale blit and a 1-pixel readback that forces the GPU to finish. Subtract the baseline row of the same target for the effect alone.\n")

def key(r): return (r["name"], r.get("target"), r.get("hits_alive", r.get("particles", r.get("sprites", r.get("decals", "")))), r.get("aggregated", ""))
first = runs[ORDER[0]] if ORDER[0] in runs else next(iter(runs.values()))
frame_rows = [r for r in first["results"] if "median_ms" in r and r.get("section") != "shake_raf"]
print("| test | target | n | " + " | ".join(runs) + " |")
print("|" + "---|" * (3 + len(runs)))
for r in frame_rows:
    cells = []
    for run in runs.values():
        m = next((x for x in run["results"] if "median_ms" in x and key(x) == key(r)), None)
        cells.append(f'{m["median_ms"]:.2f} / {m["p95_ms"]:.2f}' + (f' ({m["frames"]}f)' if m["frames"] < 50 else '') if m else "-")
    n = key(r)[2]
    if r.get("aggregated"): n = f"{n} hits -> {r['numbers_drawn']} agg"
    print(f'| {r["name"]} | {r["target"].replace("canvas2d_", "c2d_")} | {n} | ' + " | ".join(cells) + " |")

print("\n## Damage number cache stats (metal, lowres)\n")
print("| hits alive | aggregated | entries | hit rate | builds | build ms total | cache KB |")
print("|---|---|---|---|---|---|---|")
for r in first["results"]:
    if r["name"] == "dmg_cached_number_sprites" and "lowres" in r["target"]:
        print(f'| {r["hits_alive"]} | {r["aggregated"]} | {r["cache_entries"]} | {r["cache_hit_rate"]} | {r["cache_builds"]} | {r["cache_build_ms_total"]} | {r["cache_bytes_est"]//1024} |')

print("\n## rAF shake test (120 frames, lowres scene)\n")
print("| mode | " + " | ".join(f"{k} work med/p95, rAF p95, frames>20ms" for k in runs) + " |")
print("|" + "---|" * (1 + len(runs)))
for mode in ["none", "setTransform", "css"]:
    cells = []
    for run in runs.values():
        m = next((x for x in run["results"] if x["name"] == "shake_raf_" + mode), None)
        cells.append(f'{m["median_ms"]:.2f}/{m["p95_ms"]:.2f}, {m["raf_interval_p95_ms"]:.1f}, {m["frames_over_20ms"]}' if m else "-")
    print(f"| {mode} | " + " | ".join(cells) + " |")

print("\n## Audio\n")
for k, run in runs.items():
    print(f"- {k} audioInfo: `{json.dumps(run.get('audioInfo'))}`")
print("\n| test | hits/s | " + " | ".join(runs) + " |")
print("|" + "---|" * (2 + len(runs)))
arows = [r for r in first["results"] if r.get("section") == "audio"]
for r in arows:
    cells = []
    for run in runs.values():
        m = next((x for x in run["results"] if x["name"] == r["name"] and x.get("hits_per_s") == r.get("hits_per_s")), None)
        if not m: cells.append("-"); continue
        if "offline" in r["name"]:
            cells.append(f'{m["render_ms_per_audio_s"]} ms/audio-s ({m["audio_thread_load_pct"]}% core), sched {m["schedule_ms_per_trigger"]} ms/trig')
        else:
            sa = m.get("stats_after") or {}; sb = m.get("stats_before") or {}
            und = (sa.get("underrunEvents", 0) - sb.get("underrunEvents", 0)) if sa else "n/a"
            cells.append(f'trig {m["trigger_js_median_ms"]}/{m["trigger_js_p95_ms"]} ms, clock {m["audio_clock_vs_wall"]}, underruns {und}, avgLat {round(sa.get("averageLatency", 0)*1000, 1) if sa else "n/a"} ms')
    print(f'| {r["name"]} | {r["hits_per_s"]} | ' + " | ".join(cells) + " |")
