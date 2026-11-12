/* Kingsfoil Artifacts: shared site bar.
   Every study and sandbox includes this file with <script src="nav.js" defer></script>.
   It reads nav.json (generated from catalog.json by `python -m studykit index`) and adds
   a top bar (home, series, previous/next, study/sandbox switch) and, on studies, the
   end-of-page links. Both live in a shadow root, so page styles and bar styles never mix.
   Without JavaScript the pages keep their own static links. */
(() => {
  "use strict";
  const src = document.currentScript && document.currentScript.src;
  if (!src) return;
  let file = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  if (!file.endsWith(".html")) file += ".html";

  const CSS = `
:host{all:initial;display:block}
*{box-sizing:border-box}
nav{font:500 13px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#a7b4b6;background:#0e1820;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px}
a{color:#e9e3d2;text-decoration:none;white-space:nowrap}
a:hover{color:#e2b453}
a:focus-visible{outline:2px solid #e2b453;outline-offset:2px;border-radius:3px}
.bar{padding:8px 16px;border-bottom:1px solid #2b4555}
.home{font-weight:700;display:inline-flex;align-items:center;gap:6px}
.crumb{display:inline-flex;align-items:center;gap:8px;min-width:0}
.crumb b{color:#e2b453;font-weight:600;white-space:nowrap}
.sep{opacity:.5}
.grow{flex:1}
.right{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 14px}
.sw{display:inline-flex;border:1px solid #2b4555;border-radius:6px;overflow:hidden}
.sw a,.sw span{padding:3px 10px;white-space:nowrap}
.sw span{background:#e2b453;color:#1a1408;font-weight:600}
.pn{display:inline-flex;gap:12px}
.foot{padding:18px 16px;border-top:1px solid #2b4555;justify-content:center;gap:10px}
.foot a{border:1px solid #2b4555;border-radius:8px;padding:8px 14px;background:#182b37;display:inline-flex;flex-direction:column;gap:2px;min-width:9.5em}
.foot a:hover{border-color:#e2b453}
.foot small{font-size:11px;color:#a7b4b6;text-transform:uppercase;letter-spacing:.06em}
.foot .play{background:#e2b453;border-color:#e2b453;color:#1a1408}
.foot .play small{color:#1a1408;opacity:.75}
.foot .play:hover{color:#1a1408;filter:brightness(1.08)}
@media(max-width:560px){.bar{padding:8px 12px}.grow{display:none}.right{width:100%;justify-content:space-between}.foot{padding-bottom:64px}.foot a{flex:1 1 40%;min-width:0}}
`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LOGO = '<svg width="16" height="16" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9" fill="none" stroke="#e2b453" stroke-width="1.6"/><circle cx="11" cy="11" r="4" fill="none" stroke="#6cb8ff" stroke-width="1.6"/><circle cx="11" cy="11" r="1.2" fill="#e2b453"/></svg>';

  function mount(html, atEnd) {
    const host = document.createElement("div");
    host.className = "kf-sitenav";
    host.attachShadow({ mode: "open" }).innerHTML = "<style>" + CSS + "</style>" + html;
    if (atEnd) document.body.appendChild(host); else document.body.insertBefore(host, document.body.firstChild);
  }

  function render(nav) {
    const p = nav.pages[file], home = nav.home;
    if (!p) return;
    const study = p.kind === "study";
    let sw = "";
    if (p.pair) {
      sw = study
        ? `<span class="sw"><span aria-current="page">Study</span><a href="${esc(p.pair)}">▶ Sandbox</a></span>`
        : `<span class="sw"><a href="${esc(p.pair)}">Study</a><span aria-current="page">▶ Sandbox</span></span>`;
    }
    const pn = (p.prev ? `<a rel="prev" href="${esc(p.prev.href)}">← ${esc(p.prev.name)}</a>` : "")
             + (p.next ? `<a rel="next" href="${esc(p.next.href)}">${esc(p.next.name)} →</a>` : "");
    mount(`<nav class="bar" aria-label="Site">
<a class="home" href="${esc(home)}">${LOGO}Kingsfoil Artifacts</a>
<span class="crumb"><span class="sep">/</span><a href="${esc(home)}?series=${esc(p.series)}">${esc(p.label)}</a><span class="sep">/</span><b>${esc(p.name)}</b></span>
<span class="grow"></span>
<span class="right">${sw}${pn ? `<span class="pn">${pn}</span>` : ""}</span>
</nav>`, false);

    if (!study) return;
    mount(`<nav class="foot" aria-label="Continue">
${p.prev ? `<a rel="prev" href="${esc(p.prev.href)}"><small>← Previous study</small>${esc(p.prev.name)}</a>` : ""}
${p.pair ? `<a class="play" href="${esc(p.pair)}"><small>Playable</small>▶ ${esc(p.short)} sandbox</a>` : ""}
${p.next ? `<a rel="next" href="${esc(p.next.href)}"><small>Next study →</small>${esc(p.next.name)}</a>` : ""}
<a href="${esc(home)}?series=${esc(p.series)}"><small>Library</small>All of the ${esc(p.label)}</a>
</nav>`, true);
  }

  fetch(new URL("nav.json", src)).then(r => (r.ok ? r.json() : null)).then(n => n && render(n)).catch(() => {});
})();
