# Adding a study

## 0. Pick the id and series

- id = `{series}-{concept}[-{qualifier}]`, e.g. `vfx-fire`, `ai-creature-behaviour`, `mmo-netcode-tile`.
- The series must already exist in `site/catalog.json` → `series`. To start a new series, add an entry there
  (`id`, `title`, `subtitle`, `blurb`, `nav_label`, `order: []`, `upcoming: []`).
- Page names: VFX studies keep the `-topdown-pixel` suffix (`vfx-fire-topdown-pixel.html`). Never rename a
  published page; if one must move, add a Netlify `_redirects` rule.

## 1. Scaffold

```bash
python -m studykit new vfx-fire --series vfx \
  --title "Top-down pixel fire: tiny algorithms for campfires, spreading fire and smoke" \
  --page vfx-fire-topdown-pixel.html
```

This creates `studies/vfx-fire/` from the newest recipe (`--from vfx-light` by default):
`build.py` (copied recipe, with a TODO header), `style.css`, `hero.html`, `core.js`, empty `study.css`,
`figs1.html`, `demos1.js`, a `report.md` skeleton that keeps the template's heading structure (the recipe
parses those headings), a placeholder `sandbox.html`, `study.yaml` and a draft `catalog-entry.json`.

## 2. Research and write

Notes and sources go in `notes/`; the report goes in `report.md`. Keep the section structure so the recipe
can find the profiles table, ratings, gem table and game index.

## 3. Register in the catalog

Fill `catalog-entry.json`: `short`, `nav` (the series-nav label, e.g. `Fire`), `summary`,
`tags.concept`, `tags.technique` (3–10 values), and `stats`. Values must exist in `site/taxonomy.json`;
a genuinely new value is added there first, with a `label` and a `desc`. Then:

```bash
python -m studykit register vfx-fire
```

This checks the tags, adds the study and its sandbox to `catalog.json`, appends the study to its series,
and retires the matching "upcoming" card. From now on every study in the series links to the new one the
next time it is built.

## 4. Build the sandbox, figures and demos

- `sandbox.html`: a single file, no external assets, 320×180 native canvas `#c`, scaled with `image-rendering: pixelated`.
- Figures: `<!--FIG name-->…<!--/FIG-->` blocks in `figs*.html`, demos in `demos*.js`, mapped in `build.py`.
- Adapt the TODO parts of `build.py` (TOC, family lists, figure→section map, CTA copy, title, meta).

```bash
python -m studykit build vfx-fire            # page + sandbox → site/
python -m studykit qa vfx-fire --shots       # look at .shots/ for both viewports
```

## 5. Rebuild the series, thumbnail, homepage

```bash
python -m studykit build --all               # older studies pick up the new series link
# add a `thumb:` block to study.yaml (copy one from vfx-light), then:
python tools/thumbs.py vfx-fire
python -m studykit index
python -m studykit check                     # must PASS
```

## 6. Ship

Commit everything (studies/vfx-fire, site/, catalog/taxonomy changes) on a branch, open a PR, let CI pass,
merge. Netlify publishes `site/` from `main`.
