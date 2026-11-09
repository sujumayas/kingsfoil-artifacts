"""Browser QA shared by `studykit qa ID` and tools/validate.py.

For each page: load it from a local static server, scroll through it (so lazy figures and demos start),
open collapsed <details>, then collect console errors / page errors, horizontal overflow on a phone
viewport, and missing local links/images. Generalises the per-study test.py scripts used so far.
"""
from __future__ import annotations
import asyncio, contextlib, functools, http.server, socketserver, threading, pathlib
from . import SITE, REPO

PHONE = (390, 844)
DESKTOP = (1280, 900)


@contextlib.contextmanager
def serve(root: pathlib.Path = SITE):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(root))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        t = threading.Thread(target=httpd.serve_forever, daemon=True); t.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}"
        finally:
            httpd.shutdown()


async def _check_page(browser, base, page_name, viewport, scroll=True, shots_dir=None, settle_ms=900):
    issues = []
    ctx = await browser.new_context(viewport={"width": viewport[0], "height": viewport[1]})
    pg = await ctx.new_page()
    pg.on("console", lambda m: issues.append(f"console.{m.type}: {m.text[:200]}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: issues.append(f"pageerror: {str(e)[:200]}"))
    pg.on("requestfailed", lambda r: issues.append(f"request failed: {r.url}") if r.url.startswith(base) else None)
    await pg.goto(f"{base}/{page_name}", wait_until="load")
    await pg.wait_for_timeout(settle_ms)
    if shots_dir:
        await pg.screenshot(path=str(shots_dir / f"{page_name}_{viewport[0]}_top.png"))
    if scroll:
        h, y = await pg.evaluate("document.documentElement.scrollHeight"), 0
        while y < h:
            await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(90)
            y += int(viewport[1] * 0.85); h = await pg.evaluate("document.documentElement.scrollHeight")
        await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        await pg.wait_for_timeout(300)
    sw = await pg.evaluate("document.documentElement.scrollWidth")
    if sw > viewport[0] + 1:
        culprits = await pg.evaluate(f"""[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>{viewport[0]}+1 && getComputedStyle(e).position!=='fixed')
            .slice(0,3).map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''))""")
        issues.append(f"horizontal overflow at {viewport[0]}px: scrollWidth={sw} ({', '.join(culprits)})")
    if shots_dir:
        await pg.screenshot(path=str(shots_dir / f"{page_name}_{viewport[0]}_full.png"), full_page=True)
    await ctx.close()
    return issues


async def _run(pages, viewports, shots_dir):
    from playwright.async_api import async_playwright
    out = {}
    with serve() as base:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            for name in pages:
                is_sandbox = "sandbox" in name
                for vp in viewports:
                    # sandboxes are full-screen apps: check they boot cleanly without scrolling
                    iss = await _check_page(browser, base, name, vp, scroll=not is_sandbox, shots_dir=shots_dir,
                                            settle_ms=1600 if is_sandbox else 900)
                    out.setdefault(name, []).extend(iss)
            await browser.close()
    return out


def browse(pages, viewports=(PHONE,), shots=False):
    shots_dir = None
    if shots:
        shots_dir = REPO / ".shots"; shots_dir.mkdir(exist_ok=True)
    return asyncio.run(_run(list(pages), list(viewports), shots_dir))


def qa_study(study, shots=False) -> bool:
    pages = [study.out_name] + ([study.sandbox_name] if study.sandbox_name else [])
    res = browse(pages, viewports=(DESKTOP, PHONE), shots=shots)
    ok = True
    for page, issues in res.items():
        print(("✔ " if not issues else "✘ ") + page)
        for i in dict.fromkeys(issues):
            print("   ", i); ok = False
    if shots:
        print(f"screenshots in {REPO / '.shots'}")
    return ok
