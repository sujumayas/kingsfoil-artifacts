"""Print a side-by-side table of median / p95 ms across results-*.json files."""
import json, pathlib
HERE = pathlib.Path(__file__).parent
files = sorted(HERE.glob("results-*.json"))
runs = {f.stem[8:]: json.loads(f.read_text()) for f in files}
for k, r in runs.items():
    print(k, r["browser_version"], r["info"].get("renderer"), "total_s", r["total_s"])
first = next(iter(runs.values()))
def key(r): return (r["name"], r["target"], r.get("glyphs", r.get("glyphs_max", "")), r.get("bubbles", ""))
print("| test | target | n | " + " | ".join(f"{k} mean/p95" for k in runs) + " |")
print("|" + "---|" * (3 + len(runs)))
for r in first["results"]:
    cells = []
    for run in runs.values():
        m = next((x for x in run["results"] if key(x) == key(r)), None)
        cells.append(f'{m["mean_ms"]:.2f} / {m["p95_ms"]:.1f}' if m else "-")
    n = f'{r.get("bubbles","")} bub, {r.get("glyphs","")} gl' if "bubbles" in r else str(r.get("glyphs", r.get("glyphs_max", "")))
    print(f'| {r["name"]} | {r["target"][:7]} | {n} | ' + " | ".join(cells) + " |")
