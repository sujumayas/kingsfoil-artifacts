# Categorizing a study: series and format

Every study has two placements, and the user confirms both before anything is scaffolded.

- **Series** (`site/catalog.json` → `series`): the topic shelf on the homepage and the series nav. Examples: `vfx`, `ai`, `procgen`.
- **Format** (`formats.yaml`): the page structure. It decides the template recipe, whether there is a
  sandbox, the page names and the report layout. Each format has a doc in `docs/formats/<id>.md`.

They are independent. A series usually keeps one format, but a format can serve several series.

```bash
python -m studykit formats     # formats, their status, sandbox rule, template, and which studies use them
python -m studykit list        # studies with their series and format
```

## 1. Ask the user

Before `studykit new`, propose a placement and ask the user to confirm it, in the same question round as
the rest of the scoping ([RESEARCH.md §1](RESEARCH.md#1-scope-the-request)):

- **Series**: recommend the existing series that fits best, or a new one with a proposed id and title.
- **Format**: recommend an `active` format whose `use_for` fits, or a new format with a one-line reason
  why no active format fits. The series' current format is the default.
- **Sandbox**: only when the format makes it `optional`.

Prefer what exists. A new series or format is right when forcing the study into an existing one would
bend the study: a different page structure, a different kind of demo, a different audience.

## 2. Adding a series

Add an entry to `site/catalog.json` → `series`: `id` (short, kebab-case, becomes the id prefix of its
studies), `title`, `subtitle`, `blurb`, `nav_label`, `order: []`, `upcoming: []`. Then `studykit new` accepts it.

## 3. Adding a format

A format grows out of its first study:

1. **Register it as a draft** in `formats.yaml`:
   ```yaml
   ai-systems:
     status: draft
     title: Game AI study with interactive decision figures
     use_for: One AI system for a genre, compared technique by technique, no sandbox
     base: vfx-light            # the shipped recipe study the first study is cloned from
     sandbox: none              # required | optional | none
     page: "{id}.html"
     sandbox_page: "{id}-sandbox.html"   # only if sandbox is not none
     doc: docs/formats/ai-systems.md
     differs: What changes from the base and why (sections, figures, sandbox).
   ```
2. **Write `docs/formats/<id>.md`** starting from the base format's doc: pages, sandbox spec, and the report
   layout the recipe will parse. Keep the shared skeleton (evidence tags, technique profiles, scorecard,
   gems, see-it index, sources) unless the study has a reason to drop it, and say why in `differs`.
3. **Scaffold** with `studykit new <id> --series <s> --format <format> --title "..."`. It clones `base`.
   Adapt `build.py` and the page chrome to the new layout while building the study.
4. **Promote** in the same PR, once the study builds and `studykit check` passes: set `status: active`,
   replace `base` with `template: <the new study id>`, and drop `differs`. From then on the format
   scaffolds from its own recipe.

The validator warns about draft formats, so a half-made format stays visible until it is promoted.

## 4. Retiring a format

Set `status: legacy` and list its remaining studies under `studies:`. Legacy formats cannot be used by `studykit new`.

## Rules the validator enforces

- every `study.yaml` declares a `format` that exists in `formats.yaml`
- the study's sandbox matches the format (`required` needs one, `none` forbids one)
- an `active` format's `template` is a recipe study of that format; a `draft` has a `base` recipe study
- a `legacy` format is used only by the studies it lists
- every format with a `doc` has that file
