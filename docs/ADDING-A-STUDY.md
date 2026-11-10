# Adding a study

## 0. Categorize: series, format, id

- Agree the **series** and **format** with the user first: [FORMATS.md](FORMATS.md). A new series or a new
  format is added there before scaffolding. `python -m studykit formats` lists the formats.
- id = `{series}-{concept}[-{qualifier}]`, e.g. `vfx-fire`, `ai-creature-behaviour`, `mmo-netcode-tile`.
- Page names come from the format (`page` in `formats.yaml`). Never rename a published page; if one must
  move, add a Netlify `_redirects` rule.

## 1. Scaffold

```bash
python -m studykit new vfx-fire --series vfx \
  --title "Top-down pixel fire: tiny algorithms for campfires, spreading fire and smoke"
```

`--format` defaults to the format of the series' newest study; pass it for a new series or a new format.
`--no-sandbox` skips the sandbox where the format makes it optional.

This creates `studies/vfx-fire/` from the format's template recipe: `build.py` (copied recipe, with a TODO
header), `style.css`, `hero.html`, `core.js`, empty `study.css`, `figs1.html`, `demos1.js`, a `report.md`
skeleton that keeps the template's heading structure, a placeholder `sandbox.html` if the format has a
sandbox, `study.yaml` (with its `format`) and a draft `catalog-entry.json`.

## 2. Research and write

Follow [RESEARCH.md](RESEARCH.md): scope the request, write `notes/CONTEXT.md`, run the research agents
into `notes/`, gap-check, then write `report.md` in the layout from the format doc (`docs/formats/<format>.md`).
The scaffolded skeleton keeps only the headings; the markers the recipe parses are in the format doc.

## 3. Register in the catalog

Fill `catalog-entry.json`: `short`, `nav` (the series-nav label, e.g. `Fire`), `summary`,
`tags.concept`, `tags.technique` (3–10 values), and `stats`. Values must exist in `site/taxonomy.json`;
a genuinely new value is added there first, with a `label` and a `desc`. Then:

```bash
python -m studykit register vfx-fire
```

This checks the tags, adds the study (and its sandbox, if any) to `catalog.json`, appends the study to its
series, and retires the matching "upcoming" card. From now on every study in the series links to the new
one the next time it is built.

## 4. Build the figures, demos and sandbox

- Sandbox, if the format has one: follow the spec in the format doc.
- Figures: `<!--FIG name-->…<!--/FIG-->` blocks in `figs*.html`, demos in `demos*.js`, mapped in `build.py`.
- Adapt the TODO parts of `build.py` (TOC, family lists, figure→section map, CTA copy, title, meta, the
  byline month, and the study-specific parts listed at the end of the format doc). The byline also sits in `hero.html`.
- Content rules for figures (how many, what kind, no screenshots): [RESEARCH.md §5](RESEARCH.md#5-figures-and-sandbox).

```bash
python -m studykit build vfx-fire            # page (+ sandbox) → site/
python -m studykit qa vfx-fire --shots       # look at .shots/ for both viewports
```

## 5. Rebuild the series, thumbnail, homepage

```bash
python -m studykit build --all               # older studies pick up the new series link
# add a `thumb:` block to study.yaml (from: sandbox like vfx-light, or from: page like ai-rts-enemy), then:
python tools/thumbs.py vfx-fire
python -m studykit index
python -m studykit check                     # must PASS
```

If this study created a draft format, promote it now ([FORMATS.md §3](FORMATS.md#3-adding-a-format)).

## 6. Ship

Commit everything (studies/vfx-fire, site/, catalog, taxonomy and format changes) on a branch, open a PR,
let CI pass, merge. Netlify publishes `site/` from `main`.
