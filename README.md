# Kingsfoil Artifacts

Research studies and playable prototypes for Kingsfoil Studios' games (Asterion Online, Hero Defense, …),
published at **https://kingsfoil-artifacts.netlify.app**.

Every study is a single self-contained HTML page with live, playable figures, usually with a companion
sandbox. The homepage is a searchable library generated from `site/catalog.json`, with one tab per series.
Every study and sandbox carries the same top bar (home, series, previous/next, study/sandbox switch).

## Layout

```
site/                 the deployed website (committed, prebuilt). Netlify publishes this folder as-is.
  catalog.json        source of truth: every page, its series, tags, stats, thumbnail, sandbox pairing
  taxonomy.json       controlled vocabulary of facets and tag values
  manifest.json       flat file inventory (used to verify that a deploy never drops a page)
  index.html          homepage, generated from catalog.json, do not edit by hand
  browse.html         technique atlas + list of every page, generated the same way
  nav.json            per-page links for the top bar, generated the same way
  nav.js              the shared top bar and end-of-study links (hand-written; every page loads it)
formats.yaml          registered study formats: template recipe, sandbox rule, page names, format doc
studies/<id>/         one folder per study (id = catalog id)
  study.yaml          config: page names, report, sandbox, thumbnail recipe, QA budget
  report.md           the research report (the text of the page)
  build.py            the study's recipe: turns report + figures + demos into the page
  core.js demos*.js figs*.html hero.html *.css   page chrome, live figures, demos
  sandbox.html        hand-written playable sandbox, copied verbatim to site/
  notes/              raw research notes and sources
studykit/             shared toolkit: paths, catalog-driven series nav, build runner, browser QA, scaffolding
tools/                build_index.py (homepage), validate.py (CI), thumbs.py (card thumbnails)
docs/                 how-tos (ADDING-A-STUDY, RESEARCH, FORMATS), one doc per format in docs/formats/, roadmap
```

`ai-rts-enemy` and `procgen-characters` are **static** studies: their build pipelines were not preserved,
so `site/<page>.html` is the source and is edited in place.

## Everyday commands

```bash
pip install -r requirements.txt && python -m playwright install chromium

python -m studykit list                 # all studies, with series and format
python -m studykit formats              # registered study formats and who uses them
python -m studykit build vfx-rain       # rebuild one study page + publish its sandbox (or --all)
python -m studykit qa vfx-rain --shots  # browser QA on desktop + phone, screenshots in .shots/
python -m studykit index                # regenerate index.html, browse.html, nav.json + manifest.json from catalog.json
python -m studykit check                # the full validator (same as CI)
python tools/validate.py --no-browser   # fast static checks (~2 s)
```

## Adding a study

See [docs/ADDING-A-STUDY.md](docs/ADDING-A-STUDY.md), with [docs/RESEARCH.md](docs/RESEARCH.md) for the
research method and [docs/FORMATS.md](docs/FORMATS.md) for choosing (or adding) a series and a format. In short:
agree series + format → `studykit new` → research + report → `studykit register` → sandbox, figures, recipe → `studykit build` →
`tools/thumbs.py` → `studykit index` → `studykit check` → commit and push.

## Guarantees (checked by CI on every pull request)

- `catalog.json` uses only `taxonomy.json` values; studies have the required facets and 3–10 techniques
- every study declares a format from `formats.yaml` and follows its sandbox rule; legacy formats take no new studies
- `index.html`, `browse.html`, `nav.json` and `manifest.json` are up to date, and the manifest lists exactly the files in `site/`
- every study and sandbox loads the shared top bar (`<script src="nav.js" defer></script>` before `</body>`).
  `studykit build` adds the tag to recipe pages. Sandbox sources and static pages carry it themselves
- every recipe study rebuilds **byte-for-byte** from its sources, and every sandbox in `site/` equals its source
- no broken local links, no external images, page-weight budgets respected
- no console errors and no horizontal overflow on a 390 px phone, for the pages the PR changes (a manual run of the workflow checks every page)

## Deploying

Netlify is linked to this repo and publishes `site/` from `main` (no build step on Netlify).
Push to a branch, open a PR, let CI pass, then merge to `main`. CI runs on pull requests only, so a direct push to `main` is not validated.
