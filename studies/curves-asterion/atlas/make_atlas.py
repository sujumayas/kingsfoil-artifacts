#!/usr/bin/env python3
"""Build the Asterion atlas data and sprite sheet for the curves-asterion study.

Reads (never writes) the Asterion repo:
  content/creatures/*.yaml, content/items/*.yaml, content/spells/*.yaml, content/npcs/*.yaml,
  content/quests/*.yaml (boss objectives), client/assets/atlas.json (outfit id -> sprite slug),
  client/assets/sprites/*.png, client/assets/effects/<name>/*.png,
  maps/spawns.json, maps/world/**/*.json, maps/worlds/<world>/**/*.json, maps/imports/<world>.json.

Writes:
  <out>/data.json          one record per creature, item and spell (shape: notes/ATLAS-SPEC.md)
  <out>/data.summary.json  counts per kind / world / spell group, min and max of numeric fields,
                           sprite fallbacks, sheet size
  <sheet>                  the packed 64x64-cell RGBA sprite sheet, 26 columns

Optional input: <out>/intents.json, {"creature:<slug>" | "item:<slug>" | "spell:<slug>": "English gist"}.
The script keeps the Spanish first sentence of each entry's leading YAML comment in `intent_es`;
`intent` is filled from intents.json when a translation exists and is "" otherwise.

Run from the kingsfoil-artifacts repo root:
  .venv/bin/python studies/curves-asterion/atlas/make_atlas.py --repo ../../mmorpg
Same inputs give byte-identical outputs: keys and lists are sorted, `made` comes from the newest
content file mtime (or --date YYYY-MM-DD).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]  # kingsfoil-artifacts repo root
CELL = 64
COLS = 26
MAX_SHEET_BYTES = 900 * 1024
WORLDS = ["akron", "ingwen", "gorothland", "boggland"]
# Incantation syllables seen in spell slugs ("va_un", "za_tor_keth"); a slug made only of these is
# the spell's spoken words, other slugs ("campo_fuego", "crear_runa_blanca") are plain names.
WORD_SYLLABLES = {"va", "un", "za", "dor", "gel", "sil", "tor", "keth", "nox", "maug", "lig",
                  "umbra", "oc", "lum", "tempo"}


# ----------------------------------------------------------------------------- loading

def load_yaml_dir(folder: Path) -> list[tuple[Path, dict, str]]:
    """Return (path, data, comment) for every *.yaml in folder (ignores .DS_Store and friends)."""
    out = []
    for path in sorted(folder.glob("*.yaml")):
        text = path.read_text(encoding="utf-8")
        data = yaml.safe_load(text)
        if not isinstance(data, dict):
            continue  # a top-level list (content/outfits.yaml) is not an entry file
        out.append((path, data, leading_comment(text)))
    return out


def leading_comment(text: str) -> str:
    """First sentence of the first block of '#' lines (top of file first, else anywhere)."""
    lines = text.splitlines()
    blocks, cur = [], []
    for line in lines:
        s = line.strip()
        if s.startswith("#"):
            cur.append(s.lstrip("#").strip())
        else:
            if cur:
                blocks.append(cur)
                cur = []
    if cur:
        blocks.append(cur)
    if not blocks:
        return ""
    joined = re.sub(r"\s+", " ", " ".join(blocks[0])).strip()
    m = re.match(r"^(.*?[.!?])(\s|$)", joined)
    sentence = m.group(1) if m else joined
    return sentence[:240].strip()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def iter_json_files(folder: Path):
    for path in sorted(folder.rglob("*.json")):
        try:
            yield path, load_json(path)
        except (ValueError, UnicodeDecodeError):
            continue


def norm_name(name: str) -> str:
    return re.sub(r"\s+", " ", str(name)).strip().lower()


# ----------------------------------------------------------------------------- worlds

def collect_names(node, found: set) -> None:
    """Walk a JSON tree and collect creature names from spawns[].creature, zones[].species,
    swarm.creature, nests and the import's export-name -> our-name `creatures` map."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "creature" and isinstance(value, str):
                found.add(norm_name(value))
            elif key == "species" and isinstance(value, list):
                found.update(norm_name(v) for v in value if isinstance(v, str))
            elif key == "creatures" and isinstance(value, dict):
                found.update(norm_name(v) for v in value.values() if isinstance(v, str))
            elif key.startswith("_"):
                continue  # prose keys ("_creatures", "why") are not data
            else:
                collect_names(value, found)
    elif isinstance(node, list):
        for item in node:
            collect_names(item, found)


def world_creatures(repo: Path) -> dict[str, set[str]]:
    """World slug -> set of normalised creature names that spawn there."""
    out = {w: set() for w in WORLDS}
    maps = repo / "maps"
    akron = out["akron"]
    collect_names(load_json(maps / "spawns.json"), akron)
    for _, data in iter_json_files(maps / "world"):
        if isinstance(data, dict) and isinstance(data.get("spawns"), list):
            collect_names(data["spawns"], akron)
    for world in WORLDS[1:]:
        found = out[world]
        for _, data in iter_json_files(maps / "worlds" / world):
            if isinstance(data, dict) and isinstance(data.get("spawns"), list):
                collect_names(data["spawns"], found)
        recipe = maps / "imports" / f"{world}.json"
        if recipe.exists():
            data = load_json(recipe)
            for key in ("creatures", "populate", "spawns"):
                if key in data:
                    collect_names({key: data[key]}, found)
    return out


def quest_bosses(repo: Path) -> set[str]:
    """Creature names that are the target of a `kind: boss` quest objective."""
    bosses = set()

    def walk(node):
        if isinstance(node, dict):
            if node.get("kind") == "boss" and isinstance(node.get("creature"), str):
                bosses.add(norm_name(node["creature"]))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    for _, data, _ in load_yaml_dir(repo / "content" / "quests"):
        walk(data)
    return bosses


# ----------------------------------------------------------------------------- npcs

def npc_tables(repo: Path):
    """sold_by: item slug -> [{npc, price}]; taught_by: spell slug -> [{npc, price, needs}]."""
    sold_by: dict[str, list] = {}
    taught_by: dict[str, list] = {}
    for _, npc, _ in load_yaml_dir(repo / "content" / "npcs"):
        name = npc.get("name", "")
        sells = (npc.get("shop") or {}).get("sells") or {}
        for slug, price in sells.items():
            sold_by.setdefault(slug, []).append({"npc": name, "price": price})
        for row in npc.get("teaches") or []:
            if not isinstance(row, dict) or "spell" not in row:
                continue
            cond = row.get("condition") or {}
            needs = []
            if cond.get("knows"):
                needs.append(f"knows {cond['knows']}")
            if cond.get("consume_item"):
                needs.append(f"item {cond['consume_item']}")
            for key in ("min_level", "min_magic_level", "hp_below"):
                if key in cond:
                    needs.append(f"{key} {cond[key]}")
            taught_by.setdefault(row["spell"], []).append(
                {"npc": name, "price": int(cond.get("consume_gold", 0) or 0), "needs": sorted(needs)})
    for table in (sold_by, taught_by):
        for rows in table.values():
            rows.sort(key=lambda r: (r["npc"], r["price"]))
    return sold_by, taught_by


# ----------------------------------------------------------------------------- items

def item_kind(it: dict) -> str:
    """Derive the atlas `kind` of an item. Rule, first match wins:
    1. weapon.kind melee / distance / wand / ammo  -> weapon-melee / weapon-distance / weapon-wand / ammo
    2. slot shield -> shield; head / torso / legs / feet -> armor-head / armor-body / armor-legs / armor-feet
    3. light > 0 -> light (torches sit in the belt slot, so this goes before the worn-slot rule)
    4. slot container or capacity -> container
    5. slot amulet / ring / belt -> armor-other
    6. value (coin value) -> currency
    7. quest_item true -> quest
    8. heal_min or mana_min, or a slug starting pocion_ / elixir_ / antidoto -> potion
       (the three buff potions and the antidote carry no numeric field, so the name decides)
    9. edible > 0 -> food
    10. use fishing / temple_recall / scroll, or a rod: block -> tool
    11. use rune (rune_spell) -> other (the spec's kind list has no rune kind)
    12. text: and not a quest item -> other (letters, notes)
    13. no slot, stackable, worth > 0 -> material (loot products such as garra, pelaje, hueso)
    14. no slot, not stackable, worth > 0 -> tool (azada, pala, cuerda, cincel...)
    15. anything else -> other
    """
    weapon = it.get("weapon") or {}
    wk = weapon.get("kind") if isinstance(weapon, dict) else None
    if wk in ("melee", "distance", "wand"):
        return f"weapon-{wk}"
    if wk == "ammo":
        return "ammo"
    slot = it.get("slot")
    if slot == "shield":
        return "shield"
    if slot in ("head", "torso", "legs", "feet"):
        return {"head": "armor-head", "torso": "armor-body", "legs": "armor-legs", "feet": "armor-feet"}[slot]
    if (it.get("light") or 0) > 0:
        return "light"
    if slot == "container" or it.get("capacity"):
        return "container"
    if slot in ("amulet", "ring", "belt"):
        return "armor-other"
    if it.get("value"):
        return "currency"
    if it.get("quest_item"):
        return "quest"
    slug = it.get("slug", "")
    if it.get("heal_min") is not None or it.get("mana_min") is not None \
            or slug.startswith(("pocion_", "elixir_", "antidoto")):
        return "potion"
    if (it.get("edible") or 0) > 0:
        return "food"
    use = it.get("use")
    if use in ("fishing", "temple_recall", "scroll") or "rod" in it:
        return "tool"
    if use == "rune" or it.get("rune_spell"):
        return "other"
    if it.get("text"):
        return "other"
    worth = it.get("worth") or 0
    if slot is None and worth > 0:
        return "material" if it.get("stackable") else "tool"
    return "other"


def pair(a, b):
    return None if a is None and b is None else [a, b]


def build_items(repo: Path, sold_by, dropped_by, intents) -> list[dict]:
    out = []
    for _, it, comment in load_yaml_dir(repo / "content" / "items"):
        weapon = it.get("weapon") if isinstance(it.get("weapon"), dict) else {}
        slug = it["slug"]
        out.append({
            "id": it["id"], "slug": slug, "name": it.get("name", slug), "icon": it.get("icon"),
            "kind": item_kind(it), "slot": it.get("slot"),
            "attack": weapon.get("attack"), "range": weapon.get("range"),
            "weapon_element": weapon.get("element"), "ammo": weapon.get("ammo"),
            "weapon_mana": weapon.get("mana"),
            "defense": it.get("defense"), "armor": it.get("armor"), "speed": it.get("speed"),
            "min_level": it.get("min_level"), "min_magic_level": it.get("min_magic_level"),
            "worth": it.get("worth"), "value": it.get("value"), "capacity": it.get("capacity"),
            "light": it.get("light"), "stackable": bool(it.get("stackable")),
            "edible": it.get("edible") or 0,
            "heal": pair(it.get("heal_min"), it.get("heal_max")),
            "mana": pair(it.get("mana_min"), it.get("mana_max")),
            "quest_item": bool(it.get("quest_item")), "use": it.get("use"),
            "rune_spell": it.get("rune_spell"), "bane_tag": it.get("bane_tag"),
            "sold_by": sold_by.get(slug, []), "dropped_by": sorted(dropped_by.get(slug, set())),
            "intent_es": comment, "intent": intents.get(f"item:{slug}", ""),
        })
    out.sort(key=lambda r: r["id"])
    return out


# ----------------------------------------------------------------------------- creatures

def build_creatures(repo: Path, worlds, bosses, intents) -> tuple[list[dict], dict[str, set[str]]]:
    out, dropped_by = [], {}
    for path, c, comment in load_yaml_dir(repo / "content" / "creatures"):
        slug = path.stem
        name = c.get("name", slug)
        key = norm_name(name)
        in_worlds = [w for w in WORLDS if key in worlds[w]]
        dmg = c.get("damage") or {}
        loot = []
        for row in c.get("loot") or []:
            loot.append({"item": row.get("item"), "chance": row.get("chance"),
                         "min": row.get("min", 1), "max": row.get("max", row.get("min", 1))})
            dropped_by.setdefault(row.get("item"), set()).add(name)
        loot.sort(key=lambda r: (-(r["chance"] or 0), r["item"] or ""))
        abilities = [a.get("name") if isinstance(a, dict) else a for a in c.get("abilities") or []]
        out.append({
            "id": c["id"], "slug": slug, "name": name, "outfit": c.get("outfit"),
            "world": in_worlds[0] if in_worlds else "none", "worlds": in_worlds,
            "hp": c.get("hp"), "exp": c.get("exp"), "speed": c.get("speed"),
            "attack": c.get("attack"), "skill": c.get("skill"), "armor": c.get("armor"),
            "dmg": [dmg.get("min"), dmg.get("max")] if dmg else None,
            "behavior": c.get("behavior"), "aggro_range": c.get("aggro_range"),
            "flee_at": c.get("flee_at"), "range": c.get("attack_range", 1),
            "keep_distance": c.get("keep_distance"), "projectile": c.get("projectile"),
            "element": c.get("element"), "resist": c.get("resist") or {},
            "condition": c.get("condition"), "abilities": sorted(a for a in abilities if a),
            "tags": sorted(c.get("tags") or []), "farm_level": c.get("max_farm_level"),
            "boss": key in bosses, "loot": loot,
            "intent_es": comment, "intent": intents.get(f"creature:{slug}", ""),
        })
    out.sort(key=lambda r: r["id"])
    return out, dropped_by


# ----------------------------------------------------------------------------- spells

def spell_words(slug: str) -> str:
    parts = slug.split("_")
    return " ".join(parts) if all(p in WORD_SYLLABLES for p in parts) else ""


def build_spells(repo: Path, taught_by, intents) -> list[dict]:
    out = []
    for _, s, comment in load_yaml_dir(repo / "content" / "spells"):
        slug = s["slug"]
        out.append({
            "id": s["id"], "slug": slug, "name": s.get("name", slug), "words": spell_words(slug),
            "group": s.get("group"), "mana": s.get("mana"), "min_ml": s.get("min_magic_level", 0),
            "effect": s.get("effect"), "element": s.get("element"),
            "power": pair(s.get("power_min"), s.get("power_max")),
            "power_ml": pair(s.get("power_min_ml"), s.get("power_max_ml")),
            "range": s.get("range"), "radius": s.get("radius"), "length": s.get("length"),
            "duration_ms": s.get("duration_ms"), "tick_ms": s.get("tick_ms"),
            "cooldown_ms": s.get("cooldown_ms"), "cast_ms": s.get("cast_ms"),
            "creates": s.get("creates"), "create_count": s.get("create_count"),
            "reagent": s.get("reagent"), "rune_only": bool(s.get("rune_only")),
            "icon": s.get("icon"), "impact": s.get("impact"), "flight": s.get("flight"),
            "taught_by": taught_by.get(slug, []),
            "intent_es": comment, "intent": intents.get(f"spell:{slug}", ""),
        })
    out.sort(key=lambda r: r["id"])
    return out


# ----------------------------------------------------------------------------- sprites

def fit_sprite(img: Image.Image, upscale_small: bool) -> tuple[Image.Image, int]:
    """Return (cell-ready image, native px). <=64 px centred native; 96/128 px LANCZOS down to 64.
    With upscale_small, icons whose longest side is <=32 px go x2 NEAREST first (32 -> 64); a tall
    icon (32x48) that then overshoots the cell is LANCZOS-fitted back to 64 on its long side."""
    img = img.convert("RGBA")
    w, h = img.size
    native = max(w, h)
    if upscale_small and native <= 32:
        img = img.resize((w * 2, h * 2), Image.NEAREST)
        w, h = img.size
    if max(w, h) > CELL:
        scale = CELL / max(w, h)
        img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    return img, native


def first_effect_frame(repo: Path, name) -> Path | None:
    if not name:
        return None
    folder = repo / "client" / "assets" / "effects" / str(name)
    frames = sorted(folder.glob("*.png")) if folder.is_dir() else []
    return frames[0] if frames else None


def resolve_sources(repo: Path, creatures, items, spells, outfits) -> list[tuple[dict, Path | None, bool, str]]:
    """One (record, png path or None, upscale_small, fallback label) per cell, in sheet order."""
    sprites = repo / "client" / "assets" / "sprites"
    plan = []
    for c in creatures:
        entry = outfits.get(str(c.get("outfit")))
        path = sprites / f"outfit_{entry['name']}_s0.png" if entry else None
        ok = path is not None and path.exists()
        plan.append((c, path if ok else None, False, "" if ok else "blank"))
    for it in items:
        path = sprites / f"{it.get('icon')}.png"
        ok = path.exists()
        plan.append((it, path if ok else None, True, "" if ok else "blank"))
    for s in spells:
        path = sprites / f"spell_{s['slug']}.png"
        if path.exists():
            plan.append((s, path, True, ""))
            continue
        for key in ("impact", "flight"):
            frame = first_effect_frame(repo, s.get(key))
            if frame:
                plan.append((s, frame, True, f"effect:{s[key]}"))
                break
        else:
            plan.append((s, None, True, "blank"))
    return plan


def pack_sheet(plan, sheet_path: Path) -> dict:
    rows = (len(plan) + COLS - 1) // COLS
    sheet = Image.new("RGBA", (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    fallbacks = {"blank": 0, "effect": 0, "effect_names": {}}
    for i, (rec, path, upscale, fb) in enumerate(plan):
        col, row = i % COLS, i // COLS
        rec["sprite"] = [col, row]
        rec["sprite_fallback"] = fb
        if fb == "blank":
            fallbacks["blank"] += 1
        elif fb.startswith("effect:"):
            fallbacks["effect"] += 1
            fallbacks["effect_names"][fb[7:]] = fallbacks["effect_names"].get(fb[7:], 0) + 1
        if path is None:
            rec["sprite_px"] = 0
            continue
        with Image.open(path) as img:
            cell_img, native = fit_sprite(img, upscale)
        rec["sprite_px"] = native
        x = col * CELL + (CELL - cell_img.width) // 2
        y = row * CELL + (CELL - cell_img.height) // 2
        sheet.alpha_composite(cell_img, (x, y))
    sheet_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(sheet_path, "PNG", optimize=True)
    quantized = False
    if sheet_path.stat().st_size > MAX_SHEET_BYTES:
        sheet.quantize(256).save(sheet_path, "PNG", optimize=True)
        quantized = True
    return {"cells": len(plan), "rows": rows, "bytes": sheet_path.stat().st_size,
            "quantized": quantized, "fallbacks": fallbacks}


# ----------------------------------------------------------------------------- summary

def minmax(records: list[dict]) -> dict:
    out = {}
    for rec in records:
        for key, value in rec.items():
            values = value if isinstance(value, list) else [value]
            nums = [v for v in values if isinstance(v, (int, float)) and not isinstance(v, bool)]
            if not nums or (isinstance(value, list) and key not in ("dmg", "heal", "mana", "power", "power_ml")):
                continue
            cur = out.setdefault(key, [min(nums), max(nums)])
            cur[0], cur[1] = min(cur[0], min(nums)), max(cur[1], max(nums))
    return dict(sorted(out.items()))


def counts(records, key) -> dict:
    out = {}
    for rec in records:
        out[str(rec.get(key))] = out.get(str(rec.get(key)), 0) + 1
    return dict(sorted(out.items()))


def summarize(creatures, items, spells, sheet_info, repo: Path) -> dict:
    no_spawn = [c["slug"] for c in creatures if c["world"] == "none"]
    return {
        "counts": {"creatures": len(creatures), "items": len(items), "spells": len(spells)},
        "creatures_per_world": counts(creatures, "world"),
        "creatures_in_several_worlds": sorted(c["slug"] for c in creatures if len(c["worlds"]) > 1),
        "creatures_without_spawn": no_spawn,
        "creatures_without_spawn_count": len(no_spawn),
        "bosses": sorted(c["slug"] for c in creatures if c["boss"]),
        "items_per_kind": counts(items, "kind"),
        "items_sold_somewhere": sum(1 for i in items if i["sold_by"]),
        "items_dropped_somewhere": sum(1 for i in items if i["dropped_by"]),
        "spells_per_group": counts(spells, "group"),
        "spells_taught_somewhere": sum(1 for s in spells if s["taught_by"]),
        "intents_translated": sum(1 for r in creatures + items + spells if r["intent"]),
        "intents_missing_comment": sum(1 for r in creatures + items + spells if not r["intent_es"]),
        "minmax": {"creatures": minmax(creatures), "items": minmax(items), "spells": minmax(spells)},
        "sprite_px": {"creatures": counts(creatures, "sprite_px"), "items": counts(items, "sprite_px"),
                      "spells": counts(spells, "sprite_px")},
        "sheet": sheet_info,
    }


# ----------------------------------------------------------------------------- main

def newest_content_date(repo: Path) -> str:
    newest = max(p.stat().st_mtime for p in (repo / "content").rglob("*.yaml"))
    return dt.datetime.fromtimestamp(newest).date().isoformat()


def repo_commit(repo: Path) -> str:
    try:
        return subprocess.check_output(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
                                       text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def dump(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, sort_keys=True, indent=1) + "\n", encoding="utf-8")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=str((ROOT / ".." / ".." / "mmorpg").resolve()),
                    help="Asterion checkout (read only)")
    ap.add_argument("--out", default=str(HERE), help="folder for data.json and data.summary.json")
    ap.add_argument("--sheet", default=str(ROOT / "site" / "assets" / "curves-asterion-atlas.png"),
                    help="sprite sheet PNG path")
    ap.add_argument("--date", default=None, help="value for `made` (default: newest content file mtime)")
    args = ap.parse_args(argv)

    repo, out, sheet = Path(args.repo).resolve(), Path(args.out).resolve(), Path(args.sheet).resolve()
    if not (repo / "content" / "creatures").is_dir():
        print(f"not an Asterion checkout: {repo}", file=sys.stderr)
        return 2
    out.mkdir(parents=True, exist_ok=True)

    intents_path = out / "intents.json"
    intents = load_json(intents_path) if intents_path.exists() else {}
    outfits = load_json(repo / "client" / "assets" / "atlas.json").get("outfits", {})

    worlds = world_creatures(repo)
    bosses = quest_bosses(repo)
    sold_by, taught_by = npc_tables(repo)
    creatures, dropped_by = build_creatures(repo, worlds, bosses, intents)
    items = build_items(repo, sold_by, dropped_by, intents)
    spells = build_spells(repo, taught_by, intents)

    plan = resolve_sources(repo, creatures, items, spells, outfits)
    sheet_info = pack_sheet(plan, sheet)

    data = {"made": args.date or newest_content_date(repo), "repo_commit": repo_commit(repo),
            "cell": CELL, "cols": COLS, "rows": sheet_info["rows"],
            "creatures": creatures, "items": items, "spells": spells}
    dump(out / "data.json", data)
    summary = summarize(creatures, items, spells, sheet_info, repo)
    dump(out / "data.summary.json", summary)

    print(f"{len(creatures)} creatures, {len(items)} items, {len(spells)} spells -> {out / 'data.json'}")
    print(f"worlds {summary['creatures_per_world']}; no spawn: {len(summary['creatures_without_spawn'])}")
    print(f"kinds {summary['items_per_kind']}")
    print(f"groups {summary['spells_per_group']}")
    print(f"sheet {sheet} {sheet_info['bytes']} bytes, {sheet_info['rows']} rows, "
          f"quantized={sheet_info['quantized']}, fallbacks={sheet_info['fallbacks']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
