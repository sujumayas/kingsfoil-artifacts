#!/usr/bin/env python3
"""Card thumbnails for the homepage, driven by each study's `thumb:` block in study.yaml.

  python tools/thumbs.py            all studies
  python tools/thumbs.py vfx-fire   one study

from: sandbox  → run `steps` (click / fill / wait) in the sandbox, save the canvas at native resolution (.png, pixel-perfect)
from: page     → screenshot the study page at 1440x900 and crop `crop` [x0, y0, x1, y1] (.webp, 480x270)
Output path = the item's "thumb" in catalog.json.
"""
import asyncio, base64, io, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from PIL import Image
from playwright.async_api import async_playwright
import studykit
from studykit import SITE
from studykit.qa import serve


async def one(pg, base, s):
    t = s.cfg.get("thumb")
    if not t: print(f"· {s.id}: no thumb block"); return
    out = SITE / s.item["thumb"].lstrip("/")
    if t.get("from") == "sandbox":
        await pg.goto(f"{base}/{s.sandbox_name}")
        for st in t.get("steps", []):
            if "click" in st: await pg.click(st["click"])
            if "fill" in st: await pg.fill(st["fill"][0], st["fill"][1]); await pg.dispatch_event(st["fill"][0], "input")
            if "wait" in st: await pg.wait_for_timeout(st["wait"])
        d = await pg.evaluate(f"document.querySelector({t.get('canvas', '#c')!r}).toDataURL('image/png')")
        Image.open(io.BytesIO(base64.b64decode(d.split(",")[1]))).save(out)
    else:
        await pg.goto(f"{base}/{s.out_name}"); await pg.wait_for_timeout(t.get("wait", 2500))
        png = await pg.screenshot(clip={"x": 0, "y": 0, "width": 1440, "height": 900})
        im = Image.open(io.BytesIO(png)).convert("RGB")
        if t.get("crop"): im = im.crop(tuple(t["crop"]))
        im.resize((480, 270), Image.LANCZOS).save(out, quality=84)
    print(f"✔ {s.id} → site/{out.relative_to(SITE)}")


async def main(ids):
    studies = [studykit.load(i) for i in ids] if ids else studykit.all_studies()
    with serve() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1440, "height": 900})
            for s in studies: await one(pg, base, s)
            await b.close()

asyncio.run(main(sys.argv[1:]))
