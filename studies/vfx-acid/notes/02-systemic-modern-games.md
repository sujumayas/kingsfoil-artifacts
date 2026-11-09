# 02 — Modern systemic games: acid / corrosion / goop / surfaces (and HOW they work)

Researcher angle: games that did something spectacular with acid-like surfaces, and the architecture behind it, filtered for what a TOP-DOWN PIXEL game in Godot 4 (Compatibility/WebGL2) can copy.
Date: 2026-11-08. About 33 tool calls. Some wikis (noita.wiki.gg/wiki/Acid) were blocked by the fetch allowlist; mirrors (fandom) were used instead and this is noted where it matters.

---

## Executive takeaways (for the final study)

1. **There are only 4 architectures, and all are cheap.** (a) *Per-pixel cellular sim + reaction table* (Noita). (b) *Sub-tile "goop" grid with element states* (Enter the Gungeon). (c) *Per-tile surface enum + combination rules* (DOS2, BG3, Into the Breach, CDDA "fields"). (d) *Spawned puddle entities / decals with a lifetime* (Isaac creep, RoR2 Acrid, Aliens FE). A top-down Tibia-like game should use (c) as the logical layer and draw it with the (b) look (sub-tile mask, smoothed edges), with (d) for short-lived splashes.
2. **Acid's design job is "the thing that eats the rules"**: it removes armor (DOS2 Acid removes physical armour; BG3 −2 AC; Into the Breach doubles weapon damage), destroys terrain (Noita, Qud gas damages walls far more than creatures), and damages containers and gear (Qud). Players love it because it **changes what is possible**, not because it does damage.
3. **Exceptions make acid readable.** Noita: glass, dense rock, great-tree wood, lava and magic liquids resist. Qud: only inorganic containers hold acid. ITB: buildings are immune. A short "resists acid" list (glass, gold, stone-dense, magic) is the most important table to design.
4. **Water is the universal counter** in nearly every game: ITB (water removes ACID but the water tile *becomes* acid), Pixel Dungeon caustic ooze washes off in water, Slime Rancher fresh water kills Tarr, Noita Toxic stain "washed off by liquids". Build water-dilutes-acid in from day one.
5. **Element combination tables are the "feels alive" multiplier.** DOS2's base x {blessed, cursed} x {frozen, electrified} grid generates dozens of surfaces from ~6 bases + 4 modifiers. Gungeon does the same with 12 goops x 3 states (ignited, frozen, electrified).
6. **Stains on the body** (Noita) are the cheapest "reactive world" feedback: a per-entity stain value with a timer, cleaned by water, tinting the sprite.

---

## Q1. Noita (Nolla Games, early access 2019, 1.0 Oct 2020)

**Takeaway:** The gold standard. Every pixel is a material cell; acid is a liquid with a reaction rule "acid + [tag] -> something" applied probabilistically when cells touch. Exceptions (glass, dense rock) make level design possible. Copy the *data model* (material table + tag-based reaction table + probability), not the full per-pixel sim.

**Cited findings**
- Acid: "Bright-green liquid" that flows down corroding materials; releases Flammable Gas as it evaporates; dissolves materials carrying the corrodible tag, which covers most materials. (fandom Acid page — https://noita.fandom.com/wiki/Acid)
- **Acid-resistant list:** Glass, Dense rock, Extremely dense rock, Wood of the great tree, Lava, Magical liquids. (https://noita.fandom.com/wiki/Acid)
- **Player damage:** contact damage (not a stain), **20 to 500 per second depending on how much of the entity touches the acid**; only Ambrosia and Stainless Armour reduce it. (https://noita.fandom.com/wiki/Acid)
- Acid kills yield double gold (wand kills); about 50% of a flask digs through the thinnest Holy Mountain wall; corroding Holy Mountain brickwork angers the gods (Stevari spawn). A single pixel digs a hole slightly narrower than the player; pools can "resume corroding" later. (https://noita.fandom.com/wiki/Acid)
- **Reaction system (materials.xml):** `<Reaction>` entries with `input_cell1/2`, `output_cell1/2(/3)`, `probability` (float x100 -> int, i.e. 2 decimal places), `fast_reaction`, `blob_radius1/2` (one input pixel produces more output pixels), `convert_all`, optional `entity`, `cosmetic_particle`, `ExplosionConfig`, `direction` (none/top/bottom/left/right). Inputs can be material tags like `[corrodible]`, which "allows Acid to burn through materials". Engine tags `[*]`, `[any_liquid]`, `[any_powder]`. (https://noita.wiki.gg/wiki/Documentation:_Reaction)
- Material properties: each pixel has an HP value in the materials file; explosions spend "ray energy" against it; durability is a threshold for what projectiles can break. Material families: solids (wood, brick, rock, meat, conductive, frozen), liquids (density decides layering), gases (flow upward), powders. (https://noita.wiki.gg/wiki/Material)
- **Sim architecture (GDC 2019, Petri Purho, "Exploring the Tech and Design of Noita"):** world split into **64x64 chunks** each with a **dirty rect**; pixels updated **bottom-up**; multithreaded in a **checkerboard, 4 passes**, a pixel may move within its chunk **plus 32 px** each way so threads need no locks; rigid bodies store body-id per pixel and re-split when pixels are destroyed; liquids check down then left/right with density swap; gases are inverted liquids; fire spreads in random directions; water + fire -> steam. (80.lv summary: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ ; talk: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design)
- **Stains:** Wet, Bloody, Oiled, Slimy (slows 15–40% by stain amount), Toxic (from Toxic Sludge: **2% max HP per tick**, cannot kill the player alone, washed off by liquids), Jarated (+20% crit vs target). Spell hits give **12 s** of a stain; effects stay full strength while at least "one second or one percent" remains; standing still retains stains longer. Acid is *not* a stain (contact damage only). (https://noita.wiki.gg/wiki/Stains)

**Inferences**
- "Damage scales with fraction of body touching acid" is a great cheap rule for top-down: sample N points of the character footprint against the acid mask -> damage x (hits/N).
- The probability field per reaction is what makes acid look like it "eats" irregularly rather than wiping a wall uniformly: do the same per tile/sub-cell with a per-material corrosion chance.
- Noita's acid emitting flammable gas is a great systemic hook (acid + fire = explosion) worth copying.

**Gaps**
- Exact acid reaction XML lines and probabilities not retrieved (wiki.gg Acid page blocked). Fandom says tag "[corrosive]" while the reaction docs say "[corrodible]"; game files are authoritative.
- Tick rate of the Toxic 2% (per second? per 0.x s) not stated.

**See it in action:** https://noita.fandom.com/wiki/Acid ; GDC talk https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design

---

## Q2. Enter the Gungeon (Dodge Roll, 2016) — GOOP

**Takeaway:** The best top-down reference for *readable* liquid surfaces. A small set of goop types, each with boolean capabilities (can ignite / freeze / electrify), and three whole-pool state changes that propagate through connected goop. This is the model to clone for a top-down pixel RPG.

**Cited findings** (https://enterthegungeon.wiki.gg/wiki/Goop)
- 12 goop types: Water, Oil, Napalm, Poison, Phase Web, Blobulon, Green Napalm, Cheese, Mimic Spit, Wine, Blood, Poopulon.
- Capability matrix: only Water freezes and electrifies; Oil, Napalm, Phase Web, Green Napalm, Wine ignite (Napalm/Green Napalm ignite immediately on spill; Wine self-ignites after a delay).
- **Poison goop** applies poison to enemies and fills the *player's poison meter*, which deals damage when full (a buildup-then-hit model, not per-tick).
- **State propagation:** fire "spreads quickly through the pool"; ice spreads until whole pool is frozen; electricity spreads **instantly** across the whole connected pool but does **not** reach goop spilled later.
- Electrified water: **10 DPS to enemies, half a heart** instant to players. Green fire: **120 s at 4 DPS**. Mimic Spit: −66% player move speed. Phase Web: halves player speed, fades faster when walked on. Poopulon fades "extremely quickly". Iron Coin blood never fades.
- Order rules: frozen goop cannot be electrified, but electrified water can be frozen (electrified ice). Burning players do not ignite goop; burning enemies do. Lanterns/sconces do not ignite goop (designer restraint so levels don't self-destruct).
- Internal class name in mods is `DeadlyDeadlyGoopManager` (search hits on ETGMod/modworkshop: https://github.com/KubeRoot/ETGMod) — implementation not read.

**Inferences**
- Goop clearly lives on a grid finer than the 16 px tile (pools have round, sub-tile edges). Design: per-tile 4x4 or 8x8 sub-cells holding {type, amount, state flags, age}. Flood-fill along connected cells of same type for "electrify whole pool" (instant) vs. cellular spread per frame for fire/ice (gradual) — two propagation speeds = two different feelings.
- "Poison meter fills then hurts" is a better feel for players than constant ticking: warns before punishing. Good candidate for acid on the player (an "acid exposure" meter).

**Gaps:** No official grid resolution, fade times, or dev notes found. The modding API source would answer it (not fetched).

**See it in action:** https://enterthegungeon.wiki.gg/wiki/Goop

---

## Q3. The Binding of Isaac (Rebirth/Repentance) — CREEP

**Takeaway:** The simplest possible acid floor: a spawned puddle sprite with a team, a color and one effect (damage or slow). One shared sprite recolored per type. Ideal for slime trails of creatures.

**Cited findings** (https://bindingofisaacrebirth.wiki.gg/wiki/Creep)
- Creep = liquid left by monsters/bosses or spawned by Isaac; appears as a glowing/"shiny" puddle or line. Creep that hurts Isaac **flickers rapidly** (danger tell).
- **Team-owned:** enemy-spawned red creep hurts Isaac not enemies; Isaac-spawned hurts walking enemies not Isaac.
- Types by color: Red (half heart), Green (poison style, faster for some Isaac sources), Yellow, Black/White (slow), Blue (Holy Water petrifies), Dark Blue/Brown (slide), Grey, Orange (slow), Static; friendly Brown boosts Isaac damage and tears.
- **All creep types share a single sprite base**, recolored per type.
- Enemy creep disappears quickly once the room is cleared; flight, Callus, Orphan Socks negate it.

**Inferences:** Team ownership + flicker tell is a must-copy for a multiplayer MMORPG (whose acid hurts whom). One grayscale puddle sprite + palette swap = all goop colors in a pixel game for nearly zero art cost.

**Gaps:** No per-tick rate or duration numbers on the page.

**See it in action:** https://bindingofisaacrebirth.wiki.gg/wiki/Creep

---

## Q4. Divinity: Original Sin 2 (Larian, 2017) — SURFACES

**Takeaway:** The canonical combination table. Acid here is not a base surface; it is **Cursed Poison** — a modifier applied to a base. This is a powerful pattern: acid = poison x curse; neutralize with bless.

**Cited findings**
- Base surfaces: Fire, Water, Blood, Oil, Poison, Web, Source; derived: Electrified Water/Blood, Frozen (Ice), Frozen Blood, steam/smoke clouds. Fire + Poison explodes; Fire + Oil ignites; Fire on Water -> Steam; Shock on Water -> Electrified; Ice on Water -> Frozen; Fire on ice -> water. (https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274)
- Every surface has Blessed and Cursed variants (Bless/Curse spells; Tornado removes). **Cursed Poison -> Acid status (removes physical armour each turn) + Poisoned.** Cursed Oil explodes on each step; Cursed Fire (Necrofire) cannot be put out by water. (same source)
- Acid status "destroys Physical armour"; once physical armour is gone it deals no further damage; prevents armour restoration smaller than the damage. Sources: cursed poison surface/cloud, Cursed Poison Flask, Acid Spores, Corrosive Touch, Corrosive Spray. Counter: Fortify, Mend Metal, Blessed Oil (Fortified), Physical Armour Potion. (https://dos2.wiki/wiki/Acid_(Status))

**Inferences:** "Acid strips armor first" maps directly to equipment corrosion in a Tibia-like RPG: acid damages armor durability/defense before HP. DOS2 surfaces in practice are drawn as decal-like blobs over the navmesh; for a pixel grid, store surface per tile (or sub-tile) with an enum + modifier bits (blessed/cursed, frozen, electrified).

**Gaps:** Durations and per-turn armour amounts not on the fetched pages. Larian's internal storage (grid vs. decal) not found.

**See it in action:** https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 ; https://dos2.wiki/wiki/Acid_(Status)

---

## Q5. Baldur's Gate 3 (Larian, 2023) — Acid surface

**Takeaway:** Acid as a *defense debuff while standing in it* (−2 AC). Simple, legible, tactical.

**Cited findings** (https://bg3.wiki/wiki/Acid_(surface))
- Acid surface: **decreases Armour Class by 2** when stepped on; condition lasts "Whilst on surface".
- Sources: Acid Barrel, Acid Vial, Arrow of Acid, Melf's Acid Arrow, Chromatic Orb: Acid, Corrosive Strike, Corrosive Phlegm, Acidic Regurgitation, Ochre Sputum, Sphere of Elemental Balance: Acid.
- Acid created on top of Blood surfaces does not apply the Acid condition (surface override/priority rule).

**Gaps:** Duration in turns, water/fire interactions not on page.

**See it in action:** https://bg3.wiki/wiki/Acid_(surface) ; https://baldursgate3.wiki.fextralife.com/Elemental+Surfaces

---

## Q6. Into the Breach (Subset Games, 2018) — A.C.I.D. (top-down pixel!)

**Takeaway:** The cleanest tile-based acid design in a pixel, grid, top-down game. Acid is a **damage multiplier**, not damage; it lives as a unit status, a one-shot pool, or a liquid tile; water both cures units and becomes acid.

**Cited findings** (https://www.ludo.guide/guide/into-the-breach/game-mechanics)
- ACID status **doubles weapon damage** taken (not Push/Block/Fire). Applied by ACID attack or ending a turn in an ACID pool/tile. Removed by Repair or moving into Water; NOT by fire or freezing.
- **ACID Pool:** applies ACID to the first unit that stops on it, then becomes Ground (consumed — self-limiting).
- **Units that die while ACID leave an ACID Pool** (contagion loop).
- **ACID Tile:** like Water but surviving units gain ACID instead of drowning; Cryo -> Frozen ACID; Fire on Frozen ACID -> Water; attacking frozen acid twice -> ACID tile.
- Water removes ACID from a unit, but **the water tile becomes an ACID tile** (acid conservation — great systemic beat).
- Buildings are immune to ACID.

**Inferences:** Perfect blueprint for a tile grid: `tile.liquid ∈ {none, water, acid, frozen_acid}`, `unit.status.acid`, plus 6 transition rules. Cheap, readable, and produces emergent combos.

**See it in action:** https://www.ludo.guide/guide/into-the-breach/game-mechanics ; https://intothebreach.gamepedia.com/Abilities_and_status_effects?oldid=4665

---

## Q7. Caves of Qud (Freehold Games) — acid liquid + corrosive gas

**Takeaway:** The deepest *material* model: liquids are volumes measured in drams; acid damages creatures, items and **containers**; heated acid becomes corrosive gas that destroys **walls** much faster than creatures.

**Cited findings**
- Covered/submerged creatures and objects take acid damage each turn scaled by volume (min 1–2). Organic containers (waterskins, hidden 30 HP) get a "sizzling" prefix and eventually break, splashing the owner. Only inorganic containers (canteens, glass bottles) hold acid safely. (https://wiki.cavesofqud.com/wiki/Acid)
- Any item is damaged if covered enough. Full acid resistance protects the creature but **not its equipment**: feet armor damaged when stepping in acid; body armor when swimming in pools >1,000 drams; organic armor especially vulnerable. Mixtures with acid become acidic. (same)
- Evaporation: heated to 350 -> corrosive gas with density = drams / 20; fuming-vent acid evaporates fast; collecting soon-to-evaporate acid fails with "It's fizzy." Drinking: 10d10 per dram. Infobox: evaporativity 1, fluidity 30. (same; note infobox vs text conflict 100 vs 350)
- **Corrosive gas:** seeps through walls and often destroys them. Creature damage = ceil(Density x Level / 200). Object/wall damage = ceil((0.75 x Level + 0.25) x Density). Example: level 1, density 50 -> creatures 1/round, walls 50. Gas moves between cells, dissipates, merges. Items (weapons/armor in loot) take no gas damage; chests break and drop contents. Corrosive Gas Generation mutation emits 100 density into adjacent cells/turn. (https://wiki.cavesofqud.com/wiki/Acid_gas)

**Inferences:** Qud's split — gas hurts structures, liquid hurts gear — is a great design lever: acid fumes as a "door/wall eater" for puzzle routes, acid pools as a "boots eater". Density-per-cell gas diffusion is cheap on a tile grid.

**See it in action:** https://wiki.cavesofqud.com/wiki/Acid ; https://wiki.cavesofqud.com/wiki/Acid_gas

---

## Q8. Cataclysm: DDA — acid fields

**Cited findings (thin):** Fields are per-tile effects (fire, smoke, acid) that affect items and creatures on/entering the tile; "All fields dissipate when their density is equal or below zero"; acid listed as an environmental hazard. (https://srgnis.github.io/cdda-wiki/cdda_wiki/Fields.html). Community threads discuss acid being very effective vs full-body suits (https://discourse.cataclysmdda.org/t/spitter-acid-is-way-too-effective-against-full-body-suits-like-rm13-combat-armor/7159). Acidic soldier ant page: https://srgnis.github.io/cdda-wiki/cdda_wiki/Acidic_soldier_ant.html (not fetched).
**Gaps:** Field intensity levels, half-life, per-material acid resistance and "corroded" item damage tiers not retrieved; ARMOR_BALANCE doc only mentions ACID_IMMUNE flag (https://docs.cataclysmdda.org/ARMOR_BALANCE_AND_DESIGN.html). Next step: read `data/json/field_type.json` and `materials.json` (acid_resist) on GitHub.

---

## Q9. (Shattered) Pixel Dungeon — caustic ooze / corrosion (top-down pixel)

**Cited findings:** Pixel Dungeon's **Caustic ooze** hero debuff: 1 or 5 damage per turn; from Goo (boss) or Rotting fist; **washes off in water**. (https://pixeldungeon.fandom.com/wiki/Debuffs). Brogue's caustic gas trap: https://brogue.fandom.com/wiki/Caustic_gas_trap (not fetched).
**Gaps:** SPD's Corrosion (escalating damage gas) numbers not verified — needs SPD source (`Corrosion.java`) on GitHub.
**Inference:** Goo boss = slime that applies ooze; ooze removed by stepping into water tiles → cheap, readable counterplay in a tile dungeon.

---

## Q10. Risk of Rain 2 — Acrid

**Cited findings** (https://riskofrain.wiki.gg/wiki/Acrid_(RoR2)): Caustic Leap leaves an acid pool (25% damage). Poison: **10% max HP over 10 s, 3 ticks/s**, cannot kill. Vicious Wounds 200%, every 3rd hit 400%.
**Inference:** "Poison/acid that cannot kill" (also Noita Toxic) avoids frustrating deaths; useful for player-side acid on a social MMO.
**Gaps:** pool duration and tick rate not on page; Blight not covered.

---

## Q11. Hollow Knight — acid water

**Cited findings:** Isma's Tear "allows the Knight to swim in acid without taking damage", gating Greenpath, Fog Canyon, Queen's Gardens, Kingdom's Edge, Isma's Grove. (https://hollowknight.wiki/w/Isma%27s_Tear)
**Inference:** Acid as a *traversal lock* (metroidvania key). In an RPG: acid-proof boots/charm as a progression item.
**Gaps:** damage value without the charm not on page.

---

## Q12. Slime Rancher — Tarr (slime-creature design)

**Cited findings** (https://slimerancher.gamepedia.com/The_Tarr): Tarr forms when a Largo eats a plort that isn't its own; eats fruit, veg and slimes; after eating a slime it plorts a new Tarr (exponential spread); killed by Slime Sea, Incinerator, or **fresh water, which "acts like poison to a Tarr"**; corrals hold them only temporarily.
**Inference:** Slime creature design = contagion + absorption + water weakness. Same logic as acid tiles (water neutralizes). Fits the "acid-like creatures share the acid sim" requirement.

---

## Q13. Half-Life 2: Episode Two — Antlion Worker

**Cited findings** (https://combineoverwiki.net/wiki/Antlion_Worker): spits physically simulated acid globs on arcs, **40–60 damage**; claw 2–10; **explodes on death into 40 splash acid damage**; described as luminous (glowing).
**Inference:** "Acid creature bursts into acid on death" is a recurring pattern (also ITB dead-ACID units, Aliens Burster). Telegraph with glow.

---

## Q14. Aliens: Fireteam Elite (2021) — acid blood

**Cited findings** (https://gamespot.com/articles/aliens-fireteam-elite-xenomorph-enemy-guide-every-type-and-how-to-kill-them/1100-6495612/): Runners leave an "acidic reminder" on death (minor damage); Bursters explode on death leaving a longer-lasting, more damaging acid puddle; Spitter globs that miss leave a temporary acid trap on the ground.
**Inference:** Tiered puddle lifetime/damage by enemy type = simple data row: {radius, dps, lifetime}. Kills create area denial, so killing position matters.
**Gaps:** No numbers. Alien: Isolation, Dark Descent, Dead Space, Metroid — not researched.

---

## Q15. Splatoon (Nintendo, 2015) — coverage map

**Cited findings:** Ink is multi-purpose: movement (swim), ammo refill, territory scoreboard, hiding. (https://sourcegaming.info/2016/08/26/holism-the-ink-of-splatoon/). Community UE approach to coverage counting: collision primitives on a regular grid over the painted surface (https://forums.unrealengine.com/t/splatoon-how-to-calculate-areas-covered-by-different-colors/85942) — this is a community suggestion, NOT Nintendo's implementation.
**Inference (for us):** In 2D top-down, an "acid coverage map" is trivially a low-res texture (e.g., 4 px per sub-cell) aligned to the tilemap; paint with stamps, read back counts on CPU from the same array. Splatoon's lesson is design: a surface that grants gameplay to its owner (slime-friendly creatures move faster on acid) is more interesting than pure hazard.
**Gaps:** Nintendo's actual ink storage resolution not found (CEDEC/GDC 2018 slides not retrieved).

---

## Q16. PixelJunk Shooter (Q-Games, 2009) — fluid types

**Cited findings** (https://gamedeveloper.com/programming/optimising-pixeljunk-shooter-and-giving-it-the-ultimate-look): particle fluid sim producing "an off-screen texture describing the fluids present at each pixel", then a **full-screen shading pass**; particles leave **fading trails** to smooth the look; a level-wide spatial grid whose cells hold a **mask of fluid types**; specialized shaders per combination (water-only, lava-only, water+lava); empty cells skip shading; ice stops heat propagation so its cell can sleep; lava + water -> steam; cooled lava -> rock. GDC talk: https://gdcvault.com/play/1012447/Go-With-the-Flow-Fluid ; SIGGRAPH 2011 Shooter 2 talk: https://history.siggraph.org/learning/fluid-dynamics-and-lighting-implementation-in-pixeljunk-shooter-2-by-kessler-carabaich-and-kinoshita
**Inference:** Exactly the pipeline for pixel acid: splat particles into a low-res density buffer, threshold + palette-map in one pass (metaball look), per-cell type mask to skip empty cells. Works in WebGL2.
**Gaps:** particle counts and ms timings not in article.

---

## Cross-game data table (for the final write-up)

| Game | Storage model | Acid effect | Counter / neutralizer | Self-limit |
|---|---|---|---|---|
| Noita | per-pixel cells, 64x64 chunks | 20–500 dmg/s by body fraction; dissolves corrodible | resistant mats: glass, dense rock, lava, magic | acid converts; evaporates to flammable gas |
| Gungeon | sub-tile goop grid (inferred) | poison meter fills -> damage | none for poison; water freezes/electrifies | fade over time |
| Isaac | spawned puddle entity | 0.5 heart / slow | flight, Callus | clears after room cleared |
| DOS2 | surface + bless/curse modifier | strips physical armour/turn | Bless, Fortify, Tornado | armour 0 -> no more dmg |
| BG3 | surface | −2 AC while standing | blood surface underneath | on-surface only |
| Into the Breach | tile liquid + unit status | x2 weapon damage | water/repair | pool consumed by first unit |
| Caves of Qud | liquid drams + gas density | dmg to creature, items, containers; gas eats walls | inorganic containers; resistance | evaporates, gas dissipates |
| RoR2 | pool entity + DoT | 10% HP/10 s, can't kill | — | timer |
| Hollow Knight | acid water volume | damage | Isma's Tear | — |
| Slime Rancher | creature | eats slimes, spreads | fresh water | corrals despawn |
| HL2 Ep2 | projectile + death burst | 40–60 spit, 40 burst | — | — |
| Aliens FE | death puddles | DoT puddle | avoid | temporary |
| PixelJunk Shooter | particles -> density texture | lava/water/ice reactions | water cools lava | ice sleeps cells |

## Gaps (honest)
- Noita exact acid reactions/probabilities (wiki.gg acid page blocked); toxic tick rate.
- Gungeon goop grid resolution and fade times (needs ETGMod / decompiled source).
- CDDA field intensities/half-life and acid_resist per material; "corroded" damage tiers.
- SPD Corrosion numbers (needs source); Brogue caustic gas.
- Terraria (Calamity's Sulphurous Sea is a mod, not vanilla), Oxygen Not Included, Rain World, Alien: Isolation, Dead Space, Metroid: not researched in this pass.
- Splatoon real ink resolution unknown.

## Sources
- https://noita.fandom.com/wiki/Acid
- https://noita.wiki.gg/wiki/Documentation:_Reaction
- https://noita.wiki.gg/wiki/Material
- https://noita.wiki.gg/wiki/Stains
- https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
- https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- https://enterthegungeon.wiki.gg/wiki/Goop
- https://github.com/KubeRoot/ETGMod
- https://bindingofisaacrebirth.wiki.gg/wiki/Creep
- https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274
- https://dos2.wiki/wiki/Acid_(Status)
- https://bg3.wiki/wiki/Acid_(surface)
- https://baldursgate3.wiki.fextralife.com/Elemental+Surfaces
- https://www.ludo.guide/guide/into-the-breach/game-mechanics
- https://intothebreach.gamepedia.com/Abilities_and_status_effects?oldid=4665
- https://wiki.cavesofqud.com/wiki/Acid
- https://wiki.cavesofqud.com/wiki/Acid_gas
- https://srgnis.github.io/cdda-wiki/cdda_wiki/Fields.html
- https://docs.cataclysmdda.org/ARMOR_BALANCE_AND_DESIGN.html
- https://discourse.cataclysmdda.org/t/spitter-acid-is-way-too-effective-against-full-body-suits-like-rm13-combat-armor/7159
- https://pixeldungeon.fandom.com/wiki/Debuffs
- https://brogue.fandom.com/wiki/Caustic_gas_trap
- https://riskofrain.wiki.gg/wiki/Acrid_(RoR2)
- https://hollowknight.wiki/w/Isma%27s_Tear
- https://slimerancher.gamepedia.com/The_Tarr
- https://combineoverwiki.net/wiki/Antlion_Worker
- https://gamespot.com/articles/aliens-fireteam-elite-xenomorph-enemy-guide-every-type-and-how-to-kill-them/1100-6495612/
- https://sourcegaming.info/2016/08/26/holism-the-ink-of-splatoon/
- https://forums.unrealengine.com/t/splatoon-how-to-calculate-areas-covered-by-different-colors/85942
- https://gamedeveloper.com/programming/optimising-pixeljunk-shooter-and-giving-it-the-ultimate-look
- https://gdcvault.com/play/1012447/Go-With-the-Flow-Fluid
- https://history.siggraph.org/learning/fluid-dynamics-and-lighting-implementation-in-pixeljunk-shooter-2-by-kessler-carabaich-and-kinoshita
