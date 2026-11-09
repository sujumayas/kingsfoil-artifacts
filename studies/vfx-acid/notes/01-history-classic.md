# 01 — History & Classic Era of Acid in Games (1980s – early 2000s)

Researcher angle: simplest-first history. Acid floors/pools -> item corrosion (roguelikes/RPGs, the richest vein) -> ooze/slime creatures (splitting, engulfing, item-eating).
Access notes: nethackwiki.com, doomwiki.org, crawl.develz.org, brogue.fandom.com, zeldadungeon.net, wiki.ultimacodex.com, dandwiki.com, angband.readthedocs.io, wiki.angband.live, android.googlesource.com fetched OK. Direct fetch of crawl.chaosforge.org (CrawlWiki) was **blocked by allowlist**; breezewiki Quake mirror returned a bot wall; Debian sources viewer needs JS; Doom Wiki radsuit page errored. Gaps listed per section.

---

## Q1. Acid / slime / nukage FLOORS and pools — how they worked and were animated

### Takeaway
The classic acid floor is two independent, dirt-cheap systems glued to a tile/sector: (a) a **looping 3–4 frame texture animation** (or a UV sine warp in Quake) for the look, and (b) a **fixed damage tick on a global clock** for the gameplay, with a timed "suit/boots" item as the counter. The look never decided the damage — a flag on the floor did. This maps 1:1 onto a top-down tilemap: an animated tile + a per-tile `hazard` byte.

### Cited findings
- **DOOM damaging sector types** ([Doom Wiki – Damaging floor](https://doomwiki.org/wiki/Damaging_floor)):
  - Type 7 = 5% (nukage); type 5 = 10% (hellslime); type 16 = 20% (super hellslime); type 4 = 20% + lights blink every 0.5 s; type 11 = 20% but health can't drop below 1%, level ends below 11%.
  - Skill 1 halves damage (rounded down).
  - Damage applied every **32 gametics (~0.91 s)**, checked against *global level time* — so crossing a pool quickly can take 0 or 1 hit.
  - Radiation suit protects for **60 s**; types 4 and 16 still **leak 6/256 (~2.3%) per check**; type 11 ignores the suit.
  - "The flat's appearance doesn't determine whether a floor damages"; the sector type does. Blue water / sludge flats usually non-damaging.
- **DOOM animated flats** ([Doom Wiki – Animated flat](https://doomwiki.org/wiki/Animated_flat); [Nukage](https://doomwiki.org/wiki/Nukage)):
  - NUKAGE1–3 = **3 frames** (green slime, all versions); FWATER1–4 = 4; LAVA1–4 = 4; BLOOD1–3 = 3; SLIME01–04 brown water, SLIME05–08 brown slime, SLIME09–12 small molten rock (Doom II only, 4 frames each).
  - Engine links first..last lump at init; swaps "about three times a second" and wraps. Names hardcoded in the EXE; PWAD replacements must supply all frames.
- **Quake liquid warp** (water/slime/lava share it):
  - The texture coordinate is offset by a lookup `turbsin[(int)((coord*0.125 + realtime) * TURBSCALE) & 255]`, scaled by 1/64 ([QuakeSrc tutorial 10, gl_warp.c](https://www.quakewiki.net/quakesrc/10.html)).
  - `turbsin` is a **256-entry table = 8·sin(2π·i/256)**, range −8..+8 ([gl_warp_sin.h, AOSP Quake port](https://android.googlesource.com/platform/gdk/+/jb-release/samples/quake/jni/gl_warp_sin.h)).
  - Same tutorial adds optional vertex ripple: `z += amp * sin(x*0.05 + t) * sin(z*0.05 + t)`, default amp 2 (cvar clamped 0–10). Mod feature, not stock Quake.
- **Duke Nukem 3D** ([ludo.guide – environmental damage](https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources)):
  - Acid/lava/electric floors drain health over time. Counters: Protective Boots (they "don't last forever"), Jetpack, Steroids dash, bunny-hopping.
  - Episode 4 adds **Hyper Acid**, a purple acid that the jetpack can't cross. It erodes boots, armor and health faster.
  - No numbers on the page. Engine hook reference: [EDuke32 EVENT_CHECKFLOORDAMAGE](https://wiki.eduke32.com/wiki/EVENT_CHECKFLOORDAMAGE).
- **Metroid series** ([Metroid Wiki (Fandom) – Acid](https://metroid.fandom.com/wiki/Acid)):
  - Acid "damages Samus Aran's Power Suit at a rapid pace" and slows movement.
  - Varia Suit (Zero Mission) gives immunity; Gravity Suit negates all acid effects.
  - Kraid's Lair has **fake acid pools** that vanish on contact.
  - Crateria acid rain is too weak to hurt.
  - **Beta Acid** (Zero Mission/Fusion) is teal/green, corrodes even the Gravity Suit, and has *no bubbling surface*, unlike normal acid.
  - Super Smash Bros. Zebes stages have rising/falling acid tides. No damage numbers on the page.

### Inferences (mine, not cited)
- 35 tic/s Doom clock → "about three times a second" ≈ one frame per ~8 tics. Consistent with source ports, but **not stated** on the fetched page.
- TURBSCALE is conventionally `256/(2π)`, so the index is phase in radians. That is consistent with the 8·sin table, but **I did not see the define in a fetched source**.
- The Quake warp is a *per-texel UV sine offset*. In pixel art it can be done as a per-row/column integer pixel shift (`dx = round(A·sin(y*f + t))`). That preserves the palette, and a Godot Compatibility shader handles it trivially.
- The "global clock" damage tick (Doom) is the cheapest fair design. It avoids per-entity timers and makes dash/hop across a pool a real skill choice.
- "Fake acid" (Metroid) and "leaky suit" (Doom 2.3%) are cheap tension tricks worth reusing.

### Gaps
- Half-Life green acid/slime damage values (trigger_hurt dmg/sec, HEV behavior) — not fetched.
- Quake 1 slime damage per second and Biosuit duration — the mirror was bot-walled. Commonly quoted values are 4 dmg per 0.2 s for slime and 30 s for the Biosuit, but **unverified**.
- Contra, classic 2D top-down acid pools (e.g., Zelda 1 has none; Blaster Master, Gauntlet) — not researched.
- Duke 3D floor damage numbers / boots capacity.

---

## Q2. ITEM CORROSION in roguelikes & RPGs (richest vein)

### Takeaway
Three classic models, from simplest to richest:
1. **Erosion level 0–3 per damage type**, with −1 per level to damage or AC and a "proof" flag (NetHack).
2. **Enchantment drain**: each acid event does −1 enchant, with a protected-item flag (Brogue). D&D 5e uses a cumulative −1 that destroys the item at −5 / AC 10.
3. **Inventory destruction + armor-takes-the-hit** (Angband).

Modern DCSS moved from permanent damage to a **temporary, stacking Corrosion status**, a design lesson that permanent loss frustrates players. Material tables (iron/copper corrode; wood/leather/cloth burn/rot; silver/mithril/dragon hide immune) are the standard way to make acid *material-aware*.

### Cited findings — NetHack ([Rust/Erosion](https://nethackwiki.com/wiki/Rust), [Acid](https://nethackwiki.com/wiki/Acid))
- **Four erosion types, each 3 levels:**
  - Rust (iron): rusty / very rusty / thoroughly rusty.
  - Corrosion (copper, iron): corroded / very corroded / thoroughly corroded.
  - Burning (wood, leather, cloth, plastic).
  - Rotting (wood, leather, cloth).
  - 3.7 adds glass: cracked / very / thoroughly cracked.
  - An item can carry one level of each applicable type, but **only the highest applies** (penalties don't stack).
- **Effects:**
  - Weapons: −1 damage per level (min 0), doubled vs monsters the weapon already doubles against. Eroded digging tools dig slower; eroded blades break more often when forcing locks.
  - Armor: −1 base AC per level (min 0); enchantment still counts.
- **Destruction:**
  - Vanilla: thoroughly eroded items just stop eroding.
  - 3.7: thoroughly cracked glass breaks on any further damage. Glass damage chance raised 5% → 10%.
  - EvilHack: at 3 levels, another hit of the same type destroys the item.
- **Proofing and repair:**
  - Confused non-cursed enchant weapon/armor proofs and repairs.
  - Wishes can give "erodeproof".
  - Inherently proof: silver, "metal", dragon hide.
  - Grease blocks erosion but wears off. Potion of oil removes one rust/corrosion level. Prayer can fix the wielded weapon.
  - Blessed items get a luck-based resist chance.
  - Words: rustproof / corrodeproof / fireproof / rotproof.
- **Corrosion sources:**
  - Thrown or dipped potion of acid; yellow dragon breath.
  - Passive acid of green mold, spotted jelly and ochre jelly; ochre jelly engulf.
  - Black pudding bite and passive. Gray ooze bite rusts; rust monster touch rusts.
- **Golems:** iron golems hit by rust lose current HP; wood golems hit by rot lose current HP.
- **Passive splash odds** (acid blob, green mold, ochre jelly pages):
  - Passive triggers **1/2** of melee hits (even on a killing blow).
  - Worn armor corrodes **1/30**.
  - The weapon/glove/boot used to strike corrodes **1/6**.
- **Acid damage:**
  - Potion of acid when quaffed: 1–16 damage ("This burns!") and abuses CON.
  - Acidic corpse: 1d15 when eaten; tins are safe.
  - Both **cure stoning**, the classic "acid as a cure" twist.
  - Acid resistance only from polymorph, alchemy smock or yellow dragon scales.
- Acidic creatures **dissolve webs** instead of getting stuck ([Acid](https://nethackwiki.com/wiki/Acid)).
- Monsters listed as acidic: acid blob, gelatinous cube, spotted jelly, ochre jelly, yellow dragons, green mold, black nagas, gray ooze, brown pudding, black pudding, green slime, Juiblex.

### Cited findings — Dungeon Crawl Stone Soup
- **Corrosion is a status on player or monsters.** It temporarily lowers weapon bonuses and AC, multiple instances stack, and it "eventually fades away" ([TV Tropes – Dungeon Crawl](https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl)).
- The Iron City of Dis corrodes equipment for −8 AC and slaying.
- Slime Pits walls corrode adjacent players; Jiyva followers are immune and can coat walls in slime.
- Oklob plants spit acid, and their surroundings are flagged as hazard. Yellow draconian acid spit splashes onto adjacent enemies.
- **Jellies used to dissolve items on the ground**, and older versions healed by eating them, including ammunition fired at them. Now only Jiyva's followers' slimes eat non-artifact items (same source).
- Royal Jelly (Slime Pits boss) spawns lesser slimes when damaged.
- Slime creatures merge into bigger forms when they find a target, then split apart again.
- Design-forum proposal (player, not shipped; [Tavern "Acidic Dissolution Expansion"](https://crawl.develz.org/tavern/viewtopic.php?p=175376)):
  - Acid Splash is resisted by the number of filled equipment slots ("cloaks block more than half") and ignores AC.
  - Item corrosion chance = base × (5+ench)/14 × rCorr factor (1 or 0.15); items stop at −5.
  - Acid pool lasts 35–100 aut; rAcid multipliers 150/100/70/45/20%.
  - Treat these as **proposal numbers, not game data**.
- Entropy weavers are "heavily corroding their enemies' equipment" (trunk 7 Apr 2015, [crawl.develz.org blog p9](https://crawl.develz.org/wordpress/blog/page/9)).

### Cited findings — Angband ([Attacking monsters manual](https://angband.readthedocs.io/en/latest/attack.html), [wiki Elements](https://wiki.angband.live/index.php/Elements))
- **Armor absorbs acid:** body armor reduces acid damage "but the armor may be damaged instead", lowering the to-AC bonus of equipped armor. The wiki says armour halves acid damage, making it the least deadly base element.
- **Inventory destruction:** acid destroys scrolls, staves, chests, ammo and most *unequipped* wearables. Each item gets a saving throw. **Floor items get no save.**
- **Resistance:**
  - Resist = 1/3 damage; permanent + temporary = 1/9.
  - Vulnerability = +1/3 damage.
  - Immunity is "EXTREMELY rare" and protects both HP and gear.
- **Acid-proof gear:** Resist Acid armor, Robes of Permanence, Dragon Scale Mail, Mithril Chain/Plate, Adamantite Plate. The material-based immunity pattern again.
- **Acid brand:** ×3 base damage vs non-resistant monsters. Digging tools are acid-branded.
- Base-element breath cap 1600 before resistance; breath damage = monster HP / divisor.

### Cited findings — Brogue ([Acid Mound](https://brogue.fandom.com/wiki/Talk:Acid_Mound/@comment-103.101.153.224-20180612020244/@comment-27418381-20180615033649?oldid=9262), [Acid Turret](https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205))
- **Acid mound stats:** HP 15, Def 10, Acc 70, Dmg 1–3, depth 6 (packs 9).
- **Degradation:**
  - Hitting it costs your weapon **−1 enchant per hit**.
  - Its hits cost your armor −1 enchant ("+0 becomes −1").
  - Protected items show `}` instead of `)` in inventory.
  - The game warns before an attack with an unprotected weapon (unless the mound is unseen).
- **Player tactics the design invites:**
  - Fight bare-handed after removing armor, or use ranged attacks or allies (immune).
  - Negation removes the mound's acid and resets items to +0.
  - Before 1.7.4, axes and spears could hit a mound in the sweep with no warning.
- **Acid turret:** HP 35, Acc 250, Dmg 1–2, attack delay 250, depth 15. Wall-mounted, degrades armor at range. It's safe to hit with an unprotected weapon, and tunnelling kills it instantly.

### Cited findings — D&D 5e SRD ([Oozes](https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html), [Rust Monster](https://dandwiki.com/wiki/5e_SRD:Rust_Monster))
- **Black pudding** (AC 7, HP 85):
  - Pseudopod 1d6+3 bludgeoning + 4d8 acid.
  - Nonmagical armor hit takes a cumulative −1 AC and is destroyed at AC 10.
  - Corrosive Form: touching it deals 1d8 acid. Metal or wood weapons get a cumulative −1 damage, "destroyed" at −5.
- **Gray ooze** (HP 22):
  - Pseudopod 1d6+1 + 2d6 acid. Metal armor −1 AC each hit.
  - Corrode Metal: weapons −1 per hit, destroyed at −5. Metal ammo is destroyed on hit.
  - Eats through 2-inch metal in 1 round. **Wood is unaffected** (material-selective).
- **Rust monster** (CR 1/2, HP 27):
  - Rust Metal: a metal weapon that hits it takes a cumulative −1 damage, destroyed at −5; ammo is destroyed.
  - Antennae: an unworn ferrous object loses a 1-ft cube. Worn metal armor takes a cumulative −1 AC (destroyed at AC 10); a shield is destroyed at +0. DC 11 Dex save if carried.
  - Iron Scent: smells ferrous metal within 30 ft.

### Inferences
- For Asterion: a **`erosion[type] : 0..3` per item, with only the max applied**, maps directly onto 3 sprite overlay stages (pitted → patchy → holed). NetHack proves the design reads well in text, and the visual analog is trivial.
- **Material table as data**: e.g., iron/steel→corrode, copper/bronze→corrode (NetHack pudding hits iron+bronze), wood→unaffected by ooze but burns/rots, leather/cloth→rot/burn, gold/silver/glass/mithril→immune. That drives both gameplay and which overlay sprite to use.
- Odds templates worth stealing: **1/2 passive trigger, 1/6 weapon, 1/30 worn armor** (NetHack). These give rare, memorable losses rather than constant attrition.
- DCSS's shift (permanent → temporary stacking status) plus Brogue's pre-attack warning are the main *player-respect* lessons: telegraph, warn, allow protection or repair.

### Gaps
- Exact current DCSS Corrosion numbers (AC per stack, duration). The CrawlWiki fetch was blocked, and I won't guess.
- ADOM, Moria (beyond Angband lineage), Diablo/D2 (poison/acid), Final Fantasy/Dragon Quest item corrosion — not fetched.
- NetHack potion-of-acid dipping/iron-bars interactions — the page didn't cover them.

---

## Q3. Classic ooze / slime creature behaviors

### Takeaway
Four reusable verbs recur across 40 years:
1. **SPLIT on hit**: HP halves, size steps down.
2. **ENGULF**: an inside-the-body state with visible contents, which takes damage per turn.
3. **EAT ITEMS**: organics digested and heal the ooze; inorganics carried and dropped on death.
4. **PASSIVE SPLASH**: punishes melee and corrodes the striking item.

All four are cheap state machines, and all are expressible with one "ooze field" render (metaballs/threshold), so a split is just two blobs drifting apart.

### Cited findings
- **NetHack black pudding** ([page](https://nethackwiki.com/wiki/Black_pudding)):
  - Divides only when hit non-lethally by an **iron/metal melee weapon** and HP > 1. Current HP is halved (rounded up); the clone gets the rest and keeps the max HP and name.
  - Bite 3d8 corrosive; passive corrodes the weapon, boots or gloves that hit it; affects iron and bronze.
  - Kicking a sink has a 1/15 chance to spawn a pudding.
  - 3.6+ drops "globs" instead of corpses. Pre-3.6 "pudding farming" was a known exploit, a warning about splitting + loot.
- **NetHack ochre jelly** ([page](https://nethackwiki.com/wiki/Ochre_jelly)):
  - Engulf 3d6 acid; engulfing itself doesn't corrode, but attacking from inside risks corrosion.
  - Passive 3d6 acid on a 1/2 chance.
  - A wand or spell of digging frees you and drops the jelly to 1 HP.
- **NetHack gelatinous cube** ([page](https://nethackwiki.com/wiki/gelatinous_cube)):
  - Touch 2d4 with a 1/3 chance to paralyze up to 10 turns.
  - Passive paralysis on a 2/3 chance, up to 4 turns, only if the cube survives.
  - **Engulfs floor items 19/20 of the time** (1/20 for artifacts).
  - **Eats organic items one stack per move** when nobody is adjacent, healing up to the item's weight in HP.
  - Inorganic, bone and dragon hide items are carried, not eaten.
  - It avoids statues and boulders.
- **NetHack acid blob** ([page](https://nethackwiki.com/wiki/acid_blob)):
  - Level 1, speed 3; passive 1d8 acid on a 1/2 chance; corrodes on 1/30 (worn) and 1/6 (striking item).
  - Its corpse grants temporary acid/stone resistance for 3–18 turns.
  - Confused create monster spawns 13+ blobs.
- **NetHack green mold** ([page](https://nethackwiki.com/wiki/Green_mold)): speed 0, sessile. Passive acid scales with attacker level, same 1/2, 1/30 and 1/6 odds. The classic "don't melee the stationary blob" newbie trap.
- **D&D 5e black pudding / ochre jelly Split** ([SRD Oozes](https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html)):
  - Lightning or slashing on a Medium+ ooze with HP ≥ 10 splits it. Each half gets half the HP (rounded down) and is **one size smaller**.
  - Ochre jelly is *immune* to slashing and lightning, so those only make more jellies.
- **D&D 5e gelatinous cube:**
  - Engulf: DC 12 Dex save, 3d6 acid on engulf plus 6d6 at the start of each of the cube's turns. Escape is a DC 12 Str check; pulling someone out costs the rescuer 3d6.
  - "Creatures inside the cube can be seen but have total cover."
  - Holds 1 Large or 4 Medium creatures. Transparent: DC 15 Perception to spot when still.
- **The Legend of Zelda (NES) Zol → Gel** ([Zelda Dungeon – Zol](https://www.zeldadungeon.net/wiki/Zol), [Gel](https://zeldadungeon.net/wiki/Gel)):
  - Zelda 1: a hit with the first sword or stronger splits a Zol into 2 Gels; weaker hits kill it.
  - A Link to the Past: no split; contact deals 2 hearts.
  - Link's Awakening / Oracles: Red Zol splits on a weak-weapon hit, and touching it **slows Link and blocks weapon use** (no damage). Green Zols ambush from floor tiles.
- **Ultima slimes** ([Ultima Codex – Slime](https://wiki.ultimacodex.com/wiki/Slime)):
  - U5: a struck slime "is apt to split into two healthy, hostile slimes."
  - U6: "Constantly dividing and recombining."
  - U7 Part Two: division can be "initiated by opponents' blows".
  - U7: grows by absorbing other slimes.
- **DCSS:** slimes merge on finding a target and split later; the Royal Jelly spawns slimes when damaged ([TV Tropes](https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl)).

### Inferences
- **Split rule template**: `if hit && hp >= splitMin && damageType in splitTypes → hp_each = hp/2, size -= 1`. D&D and NetHack converge on halving HP, and D&D adds size steps. That's perfect for a metaball renderer: the radius follows size, and the two halves spawn with opposite velocity.
- **Merge/absorb** (Ultima 7, DCSS) is the inverse and solves "split spam". Re-merge if two blobs touch and the sum ≤ max size.
- **Visible engulfed contents** (D&D cube "can be seen", NetHack cube inventory) is a strong, cheap pixel-art hook: draw carried item sprites inside the translucent cube, palette-tinted, slowly bobbing. Organic items shrink per digest tick.
- The Zelda "Gel sticks and slows" verb is a non-damage acid-creature interaction suitable for an all-ages MMO.

### Gaps
- Dragon Quest Slime / Metal Slime (flee behavior, metal immunity) and Final Fantasy flans (physical-immune, element-weak) — not fetched.
- Gauntlet "acid puddle" floor monsters, Diablo slimes — not researched.
- Half-Life headcrab/bullsquid acid spit — not researched.

---

## Game examples collected (with "see it in action" reference URLs)
1. **DOOM (1993)**: nukage sectors (5/10/20%), NUKAGE1–3 flats, radsuit — https://doomwiki.org/wiki/Damaging_floor , https://doomwiki.org/wiki/Animated_flat
2. **DOOM II (1994)**: SLIME01–12 flat families — https://doomwiki.org/wiki/Animated_flat
3. **Quake (1996)**: turbsin UV warp on slime/water/lava — https://www.quakewiki.net/quakesrc/10.html
4. **Duke Nukem 3D (1996)**: acid floors, Protective Boots, Hyper Acid (Ep. 4) — https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources
5. **Metroid series (1986– )**: acid pools, fake acid, Varia/Gravity immunity, Beta Acid — https://metroid.fandom.com/wiki/Acid
6. **Metroid Prime 3 (2007)**: acid rain needing the Hazard Shield (same page; post-classic, for contrast)
7. **Super Smash Bros. (Zebes stage)**: rising/falling acid — https://metroid.fandom.com/wiki/Acid
8. **The Legend of Zelda (1986)**: Zol splits into Gels — https://www.zeldadungeon.net/wiki/Zol
9. **Zelda: Link's Awakening / Oracle games**: Red Zol slow-and-disarm, Green Zol floor ambush — https://www.zeldadungeon.net/wiki/Zol
10. **Zelda: A Link to the Past**: non-splitting Zol, 2-heart contact — https://www.zeldadungeon.net/wiki/Zol
11. **NetHack (1987– )**: erosion system — https://nethackwiki.com/wiki/Rust ; acid — https://nethackwiki.com/wiki/Acid
12. **NetHack**: acid blob / green mold passive corrosion — https://nethackwiki.com/wiki/acid_blob , https://nethackwiki.com/wiki/Green_mold
13. **NetHack**: black pudding division by iron — https://nethackwiki.com/wiki/Black_pudding
14. **NetHack**: gelatinous cube engulfs and eats items — https://nethackwiki.com/wiki/gelatinous_cube
15. **NetHack**: ochre jelly engulf/passive — https://nethackwiki.com/wiki/Ochre_jelly
16. **EvilHack / NetHack 3.7**: items destroyed at max erosion; glass cracking — https://nethackwiki.com/wiki/Rust
17. **Angband (1990– )**: acid destroys inventory, damages armor, mithril immune — https://angband.readthedocs.io/en/latest/attack.html , https://wiki.angband.live/index.php/Elements
18. **Dungeon Crawl Stone Soup**: Corrosion status, Slime Pits, Jiyva item-eating, Royal Jelly — https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl , https://crawl.develz.org/tavern/viewtopic.php?p=175376
19. **Brogue**: acid mound −1 enchant per hit, acid turret, `}` protected glyph — https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205
20. **D&D 5e SRD**: black pudding, gelatinous cube, gray ooze, ochre jelly — https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html ; rust monster — https://dandwiki.com/wiki/5e_SRD:Rust_Monster
21. **Ultima V / VI / VII**: splitting/recombining slimes — https://wiki.ultimacodex.com/wiki/Slime

## Data table (quick reference, all cited above)
| Game | Mechanic | Number |
|---|---|---|
| DOOM | Nukage / hellslime / super | 5% / 10% / 20% per 32 tics (~0.91 s) |
| DOOM | Radsuit | 60 s; leak 6/256 on 20% floors |
| DOOM | Flat anim | 3–4 frames, ~3 swaps/s |
| Quake | turbsin | 256 entries, 8·sin, idx `(c*0.125+t)*TURBSCALE & 255`, ×1/64 |
| NetHack | Erosion | 3 levels/type, −1 dmg or −1 AC per level, max only |
| NetHack | Passive acid | 1/2 trigger; 1/6 striking item; 1/30 worn armor |
| NetHack | Acid blob passive | 1d8; ochre jelly 3d6; pudding bite 3d8 |
| NetHack | Potion of acid / acidic corpse | 1–16 / 1d15, cures stoning |
| NetHack | Gel. cube | engulf items 19/20; paralysis 1/3 ≤10 turns |
| Angband | Resist acid | 1/3 dmg; 1/9 double; vuln +1/3 |
| Brogue | Acid mound | HP 15, −1 enchant per weapon hit / per armor hit |
| Brogue | Acid turret | HP 35, Acc 250, dmg 1–2, depth 15 |
| D&D 5e | Corrode weapon | −1 dmg cumulative, destroyed at −5 |
| D&D 5e | Corrode armor | −1 AC cumulative, destroyed at AC 10 |
| D&D 5e | Split | HP ≥10, Medium+, slashing/lightning → 2× half HP, size −1 |
| D&D 5e | Gel. cube engulf | DC 12, 3d6 + 6d6/turn |

## Sources
- https://doomwiki.org/wiki/Damaging_floor
- https://doomwiki.org/wiki/Animated_flat
- https://doomwiki.org/wiki/Nukage
- https://www.quakewiki.net/quakesrc/10.html
- https://android.googlesource.com/platform/gdk/+/jb-release/samples/quake/jni/gl_warp_sin.h
- https://www.ludo.guide/guide/duke-nukem-3d/02-04-11-environmental-damage-sources
- https://wiki.eduke32.com/wiki/EVENT_CHECKFLOORDAMAGE
- https://metroid.fandom.com/wiki/Acid
- https://www.zeldadungeon.net/wiki/Zol
- https://zeldadungeon.net/wiki/Gel
- https://nethackwiki.com/wiki/Rust
- https://nethackwiki.com/wiki/Acid
- https://nethackwiki.com/wiki/acid_blob
- https://nethackwiki.com/wiki/Green_mold
- https://nethackwiki.com/wiki/Ochre_jelly
- https://nethackwiki.com/wiki/Black_pudding
- https://nethackwiki.com/wiki/gelatinous_cube
- https://angband.readthedocs.io/en/latest/attack.html
- https://wiki.angband.live/index.php/Elements
- https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/DungeonCrawl
- https://crawl.develz.org/tavern/viewtopic.php?p=175376
- https://crawl.develz.org/wordpress/blog/page/9
- https://brogue.fandom.com/wiki/Talk:Acid_Mound/@comment-103.101.153.224-20180612020244/@comment-27418381-20180615033649?oldid=9262
- https://brogue.fandom.com/wiki/Acid_Turret?oldid=8205
- https://dnd-srd-sphinx.readthedocs.io/en/latest/monster/oozes.html
- https://dandwiki.com/wiki/5e_SRD:Rust_Monster
- https://wiki.ultimacodex.com/wiki/Slime
