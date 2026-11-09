# Kingsfoil Artifacts

Research studies and playable prototypes for Kingsfoil Studios' games (Asterion Online, Hero Defense, …),
published at **https://kingsfoil-artifacts.netlify.app**.

Every study is a single self-contained HTML page with live, playable figures, usually with a companion
sandbox. The homepage is a searchable library generated from `site/catalog.json`.

## Layout

```
site/                 the deployed website (committed, prebuilt). Netlify publishes this folder as-is.
  catalog.json        source of truth: every page, its series, tags, stats, thumbnail, sandbox pairing
  taxonomy.json       controlled vocabulary of facets and tag values
  manifest.json       flat file inventory (used to verify that a deploy never drops a page)
  index.html          generated from catalog.json, do not edit by hand
studies/<id>/         one folder per study (id = catalog id)
  study.yaml          config: page names, report, sandbox, thumbnail recipe, QA budget
  report.md           the research report (the text of the page)
  build.py            the study's recipe: turns report + figures + demos into the page
  core.js demos*.js figs*.html hero.html *.css   page chrome, live figures, demos
  sandbox.html        hand-written playable sandbox, copied verbatim to site/
  notes/              raw research notes and sources
studykit/             shared toolkit: paths, catalog-driven series nav, build runner, browser QA, scaffolding
tools/                build_index.py (homepage), validate.py (CI), thumbs.py (card thumbnails)
docs/                 roadmap and how-tos
```

`ai-rts-enemy` and `procgen-characters` are **static** studies: their build pipelines were not preserved,
so `site/<page>.html` is the source and is edited in place.

## Everyday commands

```bash
pip install -r requirements.txt && python -m playwright install chromium

python -m studykit list                 # all studies
python -m studykit build vfx-rain       # rebuild one study page + publish its sandbox (or --all)
python -m studykit qa vfx-rain --shots  # browser QA on desktop + phone, screenshots in .shots/
python -m studykit index                # regenerate index.html + manifest.json from catalog.json
python -m studykit check                # the full validator (same as CI)
python tools/validate.py --no-browser   # fast static checks (~2 s)
```

## Adding a study

See [docs/ADDING-A-STUDY.md](docs/ADDING-A-STUDY.md). In short:
`studykit new` → research + report → `studykit register` → sandbox, figures, recipe → `studykit build` →
`tools/thumbs.py` → `studykit index` → `studykit check` → commit and push.

## Guarantees (checked by CI on every push)

- `catalog.json` uses only `taxonomy.json` values; studies have the required facets and 3–10 techniques
- `index.html` and `manifest.json` are up to date, and the manifest lists exactly the files in `site/`
- every recipe study rebuilds **byte-for-byte** from its sources, and every sandbox in `site/` equals its source
- no broken local links, no external images, page-weight budgets respected
- no console errors and no horizontal overflow on a 390 px phone

## Deploying

Netlify is linked to this repo and publishes `site/` from `main` (no build step on Netlify).
Push to a branch, let CI pass, then merge to `main`.
