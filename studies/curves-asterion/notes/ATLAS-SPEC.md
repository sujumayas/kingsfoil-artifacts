# Asterion Atlas: spec

A tab inside the study page (`site/curves-asterion.html`) with picture-led cards for **every creature, item and
spell** in Asterion, so a reader of the research can look up what "agallas rojas" or "va tor un" is. Text is in
English, in plain game-design terms (role, numbers, where it sits on the curve), never narrative.

## Files

```
studies/curves-asterion/atlas/
  make_atlas.py       extracts the data and packs the sprite sheet. Run by hand; its outputs are committed.
                      Usage: .venv/bin/python studies/curves-asterion/atlas/make_atlas.py --repo ../../mmorpg
  data.json           the extracted facts, one record per entry (committed; build.py reads it)
  roles.json          {id: "role line"} written by hand/agents after data.json exists (committed; build.py merges it)
site/assets/curves-asterion-atlas.png   the packed sprite sheet, 64x64 cells
```

`build.py` turns `data.json` + `roles.json` into static HTML cards (no runtime fetch, no JSON in the page beyond
what the cards need), so the page keeps rebuilding byte for byte. The sheet is referenced as a CSS background
(`assets/curves-asterion-atlas.png`), one `background-position` per card.

## Sources in the Asterion repo (`/Users/esenespinosa/Development/personal/games/mmorpg`, read only)

- `content/creatures/*.yaml` (240): id, name, description, outfit, hp, speed, exp, attack, skill, armor,
  damage {min,max}, behavior, aggro_range, flee_at, attack_range, projectile, keep_distance, element, abilities,
  tags, loot [{item, chance, min, max}], max_farm_level (authoring metadata), light. The leading YAML comment is
  the designer's intent in Spanish; keep its gist for the role line.
- `content/items/*.yaml` (369): id, slug, name, icon, stackable, edible, heal_min/max, mana restore fields,
  slot, armor, defense, weapon {kind: melee|distance|wand|ammo, attack, range, ammo, element, mana...}, speed,
  min_level, min_magic_level, worth, value (coins), capacity (containers), quest_item, status, bane_tag.
  Read `docs/systems/items-economy.md`, `inventory-equipment.md`, `combat-weapons.md`, `high-tier-items.md` for field meanings.
- `content/spells/*.yaml` (45): id, slug, name, group, mana, min_magic_level, effect, element, power_min/max,
  power_min_ml/max_ml, range, duration_ms, tick_ms, cooldown_ms, icon, impact, flight, description.
  Read `docs/systems/spells-abilities.md` (§6 teachers, §8 effects). Teachers and prices: `content/npcs/*.yaml` (`teaches:`).
- `content/outfits.yaml` and `client/assets/atlas.json` (`outfits`: id → {name: slug, frames}). Sprite file:
  `client/assets/sprites/outfit_<slug>_s0.png` (south, frame 0). Sizes 32, 48, 64, 96 or 128 px.
- Item icons: `client/assets/sprites/<icon>.png` (32 px). Spell icons: `client/assets/sprites/spell_<slug>.png`
  (32 of 45 exist; fall back to the spell's `impact`/`flight` effect frame 0 in `client/assets/effects/<name>/`, else a blank cell).
- Where a creature lives: `maps/spawns.json` (Akron surface, `spawns[]` with creature names and x,y,z),
  `maps/worlds/<world>/` and `maps/imports/<world>.json` (`populate` zones) for Ingwen, Gorothland, Boggland.
  Derive `world` (akron, ingwen, gorothland, boggland, none) and whether it has a spawn at all (quest mini-bosses have none).
- Shops: `content/npcs/*.yaml` → `shop.sells {slug: price}` gives "sold by X for N gold". Buy-back is 30 % of `worth` everywhere.
- Drop sources: invert creature loot into item → [creature names] (cap at 6 in the card, say "+N more").

## data.json shape

```json
{"made": "2026-11-13", "repo_commit": "8836106a", "cell": 64, "cols": 26,
 "creatures": [{"id": 118, "slug": "agallas_rojas", "name": "agallas rojas", "world": "gorothland",
   "hp": 690, "exp": 5357, "dmg": [100, 106], "armor": 24, "speed": 200, "behavior": "aggressive",
   "range": 4, "keep_distance": 3, "element": "poison", "abilities": [], "tags": [], "farm_level": 105,
   "boss": false, "loot": [{"item": "platino", "chance": 1.0, "min": 1, "max": 4}, ...],
   "intent": "one sentence, English, from the YAML comment", "sprite": [col, row], "sprite_px": 96}],
 "items": [{"id": 86, "slug": "alabarda", "name": "alabarda", "kind": "weapon-melee", "slot": "weapon",
   "attack": 27, "range": 1, "defense": null, "armor": null, "min_level": 24, "worth": 1600,
   "sold_by": [{"npc": "Berto", "price": 1600}], "dropped_by": ["gorm el ogro"], "stackable": false,
   "heal": null, "edible": 0, "intent": "...", "sprite": [col, row]}],
 "spells": [{"id": 31, "slug": "campo_fuego", "name": "Campo de fuego", "words": "...", "group": "attack",
   "mana": 60, "min_ml": 4, "effect": "field", "element": "fire", "power": [6, 10], "power_ml": [1, 1],
   "range": 5, "duration_ms": 60000, "tick_ms": 2000, "cooldown_ms": 4000, "taught_by": [{"npc": "Maera", "price": 0}],
   "intent": "...", "sprite": [col, row]}]}
```

`kind` for items, one of: weapon-melee, weapon-distance, weapon-wand, ammo, shield, armor-head, armor-body,
armor-legs, armor-feet, armor-other, potion, food, currency, container, tool, quest, material, light, other.
Derive it from slot/weapon/edible/heal/value/capacity/quest_item; say the rule in a comment in make_atlas.py.
Also emit `data.summary.json` beside it: counts per kind, per world, per spell group, min/max of every numeric field
(the report writer and figure builders read this).

## Sprite sheet

- 64×64 cells, 26 columns, rows as needed, PNG RGBA, packed in the order creatures, items, spells.
- Sprites ≤ 64 px are centred at native size (nearest). 96 and 128 px sprites are downscaled to 64 with LANCZOS.
  32 px item and spell icons are upscaled ×2 with NEAREST so every cell reads at the same scale.
- Keep the file under 900 KB (quantise to a palette with Pillow `quantize(256)` if needed, after compositing).
  Report the final size and the count of cells that fell back to blank.

## Role lines (roles.json, written after data.json exists)

One line per entry, at most 14 words, English, design terms: what it is for and where it sits on the curve.
Examples: creature "First aggressive melee chaser outside town; teaches kiting and the 2 s beat."
Item "Mid-tier melee weapon, level 24 gate; the ceiling of the Akron boss loot." Spell "Cheap single-target
heal; the first mana sink that trains magic level." No lore. Use the YAML comment's intent and the numbers.

## Cards (what build.py renders)

Sub-tabs **Creatures · Items · Spells**, a text filter, and sort buttons (by level band / exp, by kind / group).
Each card: sprite cell, name (Spanish, as in game), role line, a one-line stat strip, and a details line
(loot or sold-by/dropped-by or taught-by). Creature cards are grouped by world and sorted by exp. Item cards are
grouped by kind and sorted by min_level then worth. Spell cards are grouped by group and sorted by min_ml.
Deep link: `#atlas` opens the tab; `#atlas-<slug>` opens the tab and scrolls to the card.
