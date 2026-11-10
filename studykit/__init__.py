"""studykit: the shared toolkit behind every Kingsfoil research study.

A study lives in studies/<id>/ and is described by studies/<id>/study.yaml.
Its build.py ("recipe") holds the study-specific page layout; everything that must be
consistent across studies comes from here: paths, series navigation (generated from
site/catalog.json, so older studies update themselves when a new one joins the series),
sandbox publishing, QA and scaffolding.

Recipes call `ctx(__file__)` to get their Study context.
"""
from __future__ import annotations
import json, pathlib, html as _html
from dataclasses import dataclass, field

import yaml

REPO = pathlib.Path(__file__).resolve().parent.parent
SITE = REPO / "site"
STUDIES = REPO / "studies"
_E = lambda s: _html.escape(str(s), quote=True)


def catalog() -> dict:
    return json.loads((SITE / "catalog.json").read_text())


def taxonomy() -> dict:
    return json.loads((SITE / "taxonomy.json").read_text())


def formats() -> dict:
    """The registered study formats (formats.yaml → formats), keyed by format id. See docs/FORMATS.md."""
    return yaml.safe_load((REPO / "formats.yaml").read_text())["formats"]


@dataclass
class Study:
    id: str                      # catalog id, e.g. "vfx-light"
    dir: pathlib.Path            # studies/<id>/
    cfg: dict = field(default_factory=dict)

    # ---- config ----
    @property
    def kind(self) -> str:        # "recipe" (built here) or "static" (page in site/ is the source)
        return self.cfg.get("kind", "recipe")

    @property
    def format(self) -> str | None:   # a formats.yaml id, e.g. "vfx-pixel"
        return self.cfg.get("format")

    @property
    def out_name(self) -> str:
        return self.cfg["page"]

    @property
    def out_path(self) -> pathlib.Path:
        return SITE / self.out_name

    @property
    def report_path(self) -> pathlib.Path:
        return self.dir / self.cfg.get("report", "report.md")

    @property
    def report_text(self) -> str:
        return self.report_path.read_text()

    @property
    def sandbox_name(self) -> str | None:
        return self.cfg.get("sandbox", {}).get("page")

    @property
    def sandbox_src(self) -> pathlib.Path | None:
        s = self.cfg.get("sandbox", {}).get("source")
        return self.dir / s if s else None

    @property
    def item(self) -> dict:
        for i in catalog()["items"]:
            if i["id"] == self.id:
                return i
        raise KeyError(f"{self.id} is not in site/catalog.json — add its catalog entry first")

    # ---- series navigation (generated from the catalog) ----
    def series_members(self):
        cat = catalog()
        s = self.item.get("series")
        if not s:
            return None, []
        ser = next(x for x in cat["series"] if x["id"] == s["id"])
        items = {i["id"]: i for i in cat["items"]}
        return ser, [items[x] for x in ser["order"]]

    def series_nav(self, style: str = "bar") -> str:
        """Series navigation for this study.

        style="bar":    <nav class="series-nav"> used in the hero and the table of contents.
        style="footer": a plain <p> line used by the first study's footer.
        Labels come from catalog items' "nav" (fallback "short"); the series label from "nav_label".
        """
        ser, members = self.series_members()
        if not ser:
            return ""
        label = ser.get("nav_label", ser["title"])
        name = lambda i: f'#{i["series"]["number"]} {i.get("nav", i["short"])}'
        if style == "bar":
            parts = [f'<b aria-current="page">{_E(name(i))}</b>' if i["id"] == self.id
                     else f'<a href="{_E(i["path"].lstrip("/"))}">{_E(name(i))}</a>' for i in members]
            return (f'<nav class="series-nav" aria-label="{_E(label)}"><span>{_E(label)}:</span> '
                    + ' <i>·</i> '.join(parts) + '</nav>')
        if style == "footer":
            parts = []
            for n, i in enumerate(members):
                last = n == len(members) - 1
                if i["id"] == self.id:
                    parts.append(_E(name(i)))
                else:
                    parts.append(f'<a href="{_E(i["path"].lstrip("/"))}">{_E(name(i))}{" →" if last else ""}</a>')
            return f'<p>{_E(label)}: ' + ' · '.join(parts) + '</p>'
        raise ValueError(style)


def load(study_id: str) -> Study:
    d = STUDIES / study_id
    cfg = yaml.safe_load((d / "study.yaml").read_text())
    return Study(id=cfg.get("id", study_id), dir=d, cfg=cfg)


def ctx(recipe_file: str) -> Study:
    """Called by a recipe: returns the Study for the folder the recipe lives in."""
    return load(pathlib.Path(recipe_file).resolve().parent.name)


def all_studies() -> list[Study]:
    return [load(p.parent.name) for p in sorted(STUDIES.glob("*/study.yaml"))]
