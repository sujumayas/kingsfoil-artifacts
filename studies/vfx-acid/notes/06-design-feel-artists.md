# 06 — Design, player experience and artist-validated taste (acid, corrosion, slimes in pixel art)

Researcher angle: what artists and designers say makes acid and goo read well, feel fair and feel alive. Each question has a Takeaway, Cited findings, Inferences and Gaps. Sources are at the end.
Tool budget: about 35 calls. Blocked: saint11.art, gameaccessibilityguidelines.com, the Gungeon/Tibia/Crawl fandom pages (fetched via wiki.gg or es.fandom instead), and crawl.chaosforge.org.

---

## Q1. Pixel-art artist guidance for liquids, goo, slime, bubbles and smoke

### Takeaway
Artist tutorials agree on a short list of rules:
- Slimes are round and "flubbery" with a stretched base.
- A bright rim or outline reads as translucency.
- Small highlight dabs carry the shine.
- An object inside the slime is a dark shadow with the highlight removed over it.
- Squash and stretch conserves volume.
- Liquids loop in short cycles (about 6 frames), with highlights tied to the light source.

Acid palettes usually run from ink-purple shadows to yellow-green or near-white highlights, with saturation dropping in the brightest tones.

### Cited findings
- **imonk, "Pixel Tutorial – Slimes" (itch.io, 16 Jun 2021):**
  - Make the slime "flubbery", not firm, with a base that stretches out.
  - Light from the top right.
  - Use a **bright outline to make it look translucent**.
  - Draw an object inside as a **dark shadow**, and **remove or reduce the highlight** over that area.
  - Squash and stretch: when one part stretches out, the mass squashes in. The crawling "slurk" adds drag at the base.
  - No frame counts given. https://itch.io/t/1471610/pixel-tutorial-slimes
- **imonk, "Pixel Tutorial – Slime Monster Design" (24 Jan 2023):**
  - Quote: "The basic ones are usually green."
  - Variants: elemental, frost (crystal shapes), bloody (bone shards), lava (rocks plus magma), cube, and Chu Chu at 32×32.
  - Material is read through **added shapes**, for example crystals or shards.
  - Key skill: "the little dabs of highlights."
  - Advanced translucency: light the front and lightly render the back.
  - Colour codes drops (green → magic jar, red → heart).
  - Recolour by hue/saturation shift in Aseprite, then fix each colour group. https://itch.io/t/2614553/pixel-tutorial-slime-monster-design
- **Slynyrd (Raymond Schlitter), Pixelblog 10 "Water in Motion" (12 Oct 2018):**
  - Sparkly surface is a **6-frame loop** ("This is also a 6 frame loop.").
  - Reflection ripples loop on a **2-second timeline**.
  - Highlights follow the sky or cloud highlights. The waterfall lip is the brightest area.
  - "Simple pulsing lines can be used to express directional river flow."
  - Wave crests are steeper than troughs.
  - Leave "plenty of extra transparent space" around the asset.
  - https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- **Kenney, "Drawing particle effect sprites":**
  - Smoke puff = 4 circles at **80/60/40/20 % opacity**, blurred into one cloud.
  - Retint the same sprite blue or red to reuse it for water or blood.
  - Use a solid black or transparent background.
  - https://www.kenney.nl/learn/drawing-particle-effect-sprites
- **Lospec "Eight Hues of Toxic Ooze" by Digi:**
  - 8 colours: `#d5ffcc #95ffcf #6dd4c3 #56a3b2 #407292 #2c4273 #281039 #0e0314`.
  - Inky purples shift through blue and cyan to yellow-green as brightness rises, and saturation drops in the highlights.
  - Quote: "perfect for creating interesting glow and lighting effects."
  - Related tag lists: /tag/toxic, /tag/poison, /tag/ooze. https://lospec.com/palette-list/eight-hues-of-toxic-ooze
- **Pedro Medeiros (saint11):** 80.lv lists his Patreon animation tutorials, but the tips are only images, with no text. https://80.lv/articles/pixel-animation-tutorial-by-pedro-medeiros
  - The saint11.art tutorial index was blocked.
  - The itch.io community for Studio Miniboss tutorials exists: https://studiominiboss.itch.io/pixel-art-tutorials/community

### Inferences (mine, not cited)
- **Acid hue:** yellow-green (about 75–95° hue, high saturation). Shadows hue-shift toward teal and purple, as in the Toxic Ooze ramp, so acid doesn't read as grass green. Poison or curse would then take purple or magenta, which keeps acid and poison apart (see Q2).
- **Puddle loop:** 4–6 frames at about 8–10 fps.
  - Make bubble pops one-shot overlays (3–4 frames: grow, grow, pop ring, gone) at random positions and intervals, not part of the loop. This avoids visible repetition. It follows the same short-loop logic as Slynyrd's 6-frame surface.
- **Outline:** keep puddles unoutlined or use a bright rim like imonk's translucency rule. Give the floor tile a 1-pixel darker "wet edge" or etch ring, so the pool separates by value, not just hue.

### Gaps
- No direct quotes from saint11 (site blocked), MortMort, AdamCYounis, Brandon James Greer, Pixel Parmesan or Cyangmou.
- No published frame counts from Dead Cells, Hyper Light Drifter, Celeste or Blasphemous VFX artists.

---

## Q2. Hazard readability and fairness

### Takeaway
- Telegraph before damage.
- Reuse colour meanings players already know (green = poison or heal, purple = corruption).
- Signal "this hurts you" with **motion**: flicker or pulse.
- Spend the attention budget only on high-impact effects.

Isaac's creep is the best top-down pixel example. Creep that hurts the player **flickers rapidly**. Harmless or friendly creep does not.

### Cited findings
- **Mighty Bear Games, "How UX design can help with VFX":**
  - Pre-cast VFX act as "a warning to other players."
  - Colour conventions: green = healing or poison, red = damage, blue = shield or magic, purple = corruption.
  - "Flying triangles usually indicate incoming damage." Circles around a character suggest safety.
  - Slow, steady pulses are less alarming than fast, chaotic ones.
  - Scale visual weight to gameplay impact.
  - https://medium.com/mighty-bear-games/how-ux-design-can-help-with-vfx-a0925f80e0f0
- **Binding of Isaac, Creep:**
  - Creep that affects Isaac **flickers rapidly** and shows as a glowing, shiny puddle or line.
  - Damage: half a heart (red, green, grey, static).
  - Black or white creep slows. Yellow creep from Isaac is the strongest of the player-made creeps.
  - Creep "will quickly disappear" once a room is cleared.
  - Flight or the Callus trinket negates it.
  - Colour is reused with the opposite meaning: green creep made by Isaac hurts enemies, and green creep made by enemies hurts Isaac. https://bindingofisaacrebirth.wiki.gg/wiki/Creep
- **Enter the Gungeon, Goop:**
  - Poison goop fills a **poison meter** while the player stands in it. When the meter is full, it resets and deals damage. This builds in a grace window.
  - Electrified water: 10 DPS to enemies, and half a heart of instant damage to players.
  - Fire ignites oil, napalm, web and wine.
  - Blood and Blobulon goop are cosmetic but can put out fuses or the Fireplace. https://enterthegungeon.wiki.gg/wiki/Goop
- **Baldur's Gate 3, Acid surface:** −2 AC only while standing on it ("decreases Armour Class by 2 when stepped on"). Acid on top of blood doesn't apply the condition. https://bg3.wiki/wiki/Acid_(surface)
- **Noita, Acid:**
  - Does 20–500 DPS, scaled by how much of the creature touches it. That is very lethal, but it reads as a clear "bright-green liquid material."
  - Only Ambrosia or Stainless Armour mitigate it. https://noita.fandom.com/wiki/Acid

### Inferences
- **Fair DoT recipe** (combines the Gungeon meter and Isaac flicker):
  1. Hostile pools pulse or flicker. Inert stains don't.
  2. Stepping in fills a short meter of about 0.5–1 s before the first tick. This is the grace window.
  3. Each tick plays a white or green hit-flash (1–2 frames), a sizzle SFX, a small rising steam puff and a damage number.
  4. Show a status icon with the stack count.
  5. No screen shake on DoT ticks. Save shake for bursts.
- **Colour-blind safety:** don't separate acid from poison by hue alone.
  - Acid: bubbles and rising steam, a sharp jagged edge or etch ring, and a fizz sound.
  - Poison: slow drifting skull or cloud motes, a soft edge, and a purple tint.
  - Shapes and motion should carry the meaning.

### Gaps
- gameaccessibilityguidelines.com was blocked, so there is no cited colour-blind prevalence figure or official guideline text.
- No cited time-to-kill benchmarks for DoT.

---

## Q3. Equipment damage: making corrosion fair and interesting

### Takeaway
Gear loss is the most-hated acid mechanic when it is **sudden, random, permanent and unwarned**. The well-liked versions share four traits:
- They show visible stages.
- They are capped and non-cumulative.
- They can be prevented or repaired (oil, grease, proofing).
- They are telegraphed, or they give the player agency.

BotW shows that durability can be framed as strategy, but it is still divisive.

### Cited findings
- **NetHack erosion:**
  - Four types: rust (iron), corrode (copper, iron; caused by acid potions, yellow dragon breath, green mold, ochre jelly, black pudding), burn and rot.
  - Three stages each: rusty → very rusty → thoroughly rusty.
  - Weapons lose −1 damage per level and armour loses −1 base AC per level. Enchantment is unaffected, and **the highest erosion level sets the penalty; stages don't stack across types.**
  - Prevention: grease blocks erosion (it may dissolve), and a cloak protects body armour.
  - Repair: dipping in a potion of oil removes one level, and a confused enchant scroll repairs.
  - Immune: silver, mithril, dragon scales.
  - NetHack 3.7 adds glass cracking in 3 stages, and the item is destroyed after the maximum. https://nethackwiki.com/wiki/Erosion
- **Dark Souls Acid Surge:** about 1 durability per second for **8 s** on equipped gear. PvP only, and it does not affect the caster's own gear. https://darksouls.wiki.fextralife.com/Acid+Surge
- **BotW, Aonuma (Nintendo Power Podcast, 21 Dec 2017):**
  - Breakage makes the player ask "When am I going to use it? What enemies…"
  - It made swinging "a bit more strategic, a bit more fun, a bit more in-depth."
  - https://www.zeldadungeon.net/wiki/Interview:Nintendo_Power_Podcast_December_21st_2017
- **Counterpoint, Game Informer opinion (16 May 2017):** weapons "all feel equally disposable." Quote: "Rewards that feel temporary or useless are bad rewards." https://gameinformer.com/b/features/archive/2017/05/16/opinion-why-breaking-weapons-are-ruining-my-zelda-experience
- **GiantITP thread, "gear-destroying monsters":**
  - Gnaeus: "kill my character, don't break my toys."
  - Curse: "Having agency seems to be an important part to me."
  - Twurps: negative events should be "sparse, and therefore impactfull."
  - Suggested fixes: warn in advance, offer interactive reactions, use temporary "Damaged/Broken" statuses, make repair cheap, compensate with loot, use these monsters sparingly.
  - https://forums.giantitp.com/archive/index.php/t-663703.html
- **Acid as a tool:**
  - In Noita a single acid pixel carves a passage. Digging the thinnest Holy Mountain wall takes about 50 % of a flask, and corroding the brickwork summons Stevari. https://noita.fandom.com/wiki/Acid
  - Hollow Knight's acid pools gate areas until Isma's Tear lets the Knight "swim in acid without taking damage." It unlocks Fog Canyon, Queen's Gardens, Shape of Unn and more. https://hollowknight.wiki/w/Isma%27s_Tear

### Inferences
- **Recommended stage model** for Asterion: Pristine → Pitted → Corroded → Holed.
  - Each stage gives −1 to the item's stat, capped at 3, as in NetHack.
  - Stages show on the item sprite as a palette swap with 1–3 pitting pixels.
  - Items never vanish outright, except a cheap "sacrificial" item class.
- **Preventive consumables:** oil or wax coating (absorbs N acid hits, shown as a sheen). Gold, glass and silver are immune, which teaches material logic.
- **Warning before loss:** a chat line ("Your boots hiss.") plus a sprite stage change, so the first contact never destroys anything.

### Gaps
- No primary MMO data on durability, such as Tibia item decay or WoW repair costs.
- No DCSS corrosion numbers (the wiki was blocked). DCSS corrosion is recalled as a temporary AC debuff, which is a good "temporary, not permanent" pattern, but this is unverified.

---

## Q4. Flesh interaction (tasteful)

### Takeaway
The cited games show acid on bodies through **status, numbers and environment**, not wounds:
- BG3 lowers AC.
- Isaac uses half-heart ticks.
- Noita uses contact-scaled DPS.

Armour comes before flesh in NetHack: a cloak protects the armour beneath it.

### Cited findings
- BG3: −2 AC while standing in acid. https://bg3.wiki/wiki/Acid_(surface)
- Noita: damage scales with how much of the body is in contact. https://noita.fandom.com/wiki/Acid
- NetHack: the outer layer protects the inner layers. https://nethackwiki.com/wiki/Erosion

### Inferences
- A tasteful kit:
  - A 1–2 frame green tint flash on hit.
  - 2–4 pixel steam puffs rising from the feet.
  - Small light-green "fizz" pixels on the sprite edge.
  - Optionally a 10–20 % slowdown while standing in acid.
  - A tick sound.
- No wound sprites. This keeps the content rating safe.
- Strip or corrode armour stages first, then apply DoT to flesh.

### Gaps
- No ESRB or PEGI wording on acid depictions was found.

---

## Q5. Slime and ooze creature design

### Takeaway
Slimes feel alive through:
- squash and stretch idles and hop anticipation;
- splitting or summoning;
- visible items inside;
- colour-coded elements;
- eating or absorbing;
- **death bursts into a puddle.**

Tibia, the closest reference for Asterion, already has slimes that summon more slimes and leave a slime pool on death.

### Cited findings
- **Tibia Slime (TibiaWiki ES):**
  - 150 HP, 160 XP, melee 0–107.
  - The original slime can summon 0–3 more and is marked by **blue sparkles**. Only the original summons.
  - Immune to earth, weak to fire and energy (+10 %).
  - Makes a "Blubb" sound and pushes items aside.
  - **No loot; it turns into a pool of slime.**
  - Tactic: kill the original first.
  - https://tibia.fandom.com/es/wiki/Slime_(Creature)
- **Terraria slimes:**
  - A bonus item is **visible inside the body** (5 % of spawned slimes).
  - Before a hop, they bob up and down rapidly. They float and move faster in water.
  - The Mother Slime spawns 3 Baby Slimes on death. The Corrupt Slime spawns 2–3 Slimelings.
  - Colour tiers by stats: Green 14 HP/6 dmg → Jungle 60/18.
  - https://terraria.wiki.gg/wiki/Slimes
- **Zelda ChuChus:**
  - Green ones flatten into a puddle to dodge.
  - In Skyward Sword they split when hit and **re-merge if left alone**.
  - BotW colours map to effects: red = fire, white = ice, yellow = electric. Jelly changes type when heated or shocked.
  - They drown in water.
  - https://www.zeldadungeon.net/wiki/ChuChu
- **Slime Rancher Tarr:**
  - A largo that eats a different plort becomes a Tarr.
  - Tarr eat slimes and **plort new Tarr**, so they spread exponentially.
  - Fresh water acts like poison to them and kills them after a few sprays.
  - Rainbow colouring.
  - https://slimerancher.gamepedia.com/The_Tarr
- **Enter the Gungeon:** Poisbulon and Poisbuloid are blob enemies that create poison goop. https://enterthegungeon.wiki.gg/wiki/Poisbulon , https://enterthegungeon.wiki.gg/wiki/Goop
- **imonk:** draw the inside object as a dark shadow and kill the highlight over it, which shows engulfed items. The cube is a valid silhouette. https://itch.io/t/1471610/pixel-tutorial-slimes

### Inferences
- Run one simulation for both the acid pool and the slime body (threshold field). A slime is then just a "pool with a heartbeat."
  - On death, its mass becomes a puddle cell.
  - When it moves, it leaves trail cells.
  - Split = divide mass.
  - Merge = small blobs drift together after N seconds.
- Mark the original or mother slime with a sparkle tell, as Tibia does, so the split mechanic is fair.

### Gaps
- No Dragon Quest primary source fetched (iconic teardrop slime with a face).
- No D&D or BG3 gelatinous cube page fetched.
- No Rain World data.

---

## Q6. Anti-patterns

### Takeaway
- **Green-on-green:** acid over grass or moss, with no value step and no motion.
- **Permanent, random, unwarned item loss.**
- **DoT with no tick feedback.**
- **Too much screen noise:** every pool bubbling in sync, or shake on every tick.

### Cited findings
- Gear-loss resentment and the fixes for it: GiantITP thread (Q3).
- Disposable rewards devalue loot: Game Informer (Q3).
- Attention budget: limit weight on frequent effects (Mighty Bear, Q2).
- Isaac's creep stops flickering when it is harmless, so it does not cry wolf (Q2).

### Inferences
- Desynchronise each pool's bubble timer with random phase.
- Cap simultaneous bubble pops on screen at about 6–10.
- Acid always gets a dark etch ring, so it separates from green floors.

---

## Game examples with "see it in action" pages

| # | Game | What to look at | URL |
|---|---|---|---|
| 1 | Noita | Pixel-sim acid that dissolves most materials; glass and dense rock immune; releases flammable gas | https://noita.fandom.com/wiki/Acid |
| 2 | Enter the Gungeon | Top-down pixel goop system: poison meter, ignite/electrify/freeze table | https://enterthegungeon.wiki.gg/wiki/Goop |
| 3 | Enter the Gungeon | Poisbulon, a slime enemy that leaves poison goop | https://enterthegungeon.wiki.gg/wiki/Poisbulon |
| 4 | Binding of Isaac | Colour-coded creep; flicker means it is hostile | https://bindingofisaacrebirth.wiki.gg/wiki/Creep |
| 5 | Tibia | Slime that summons more slimes and becomes a pool on death | https://tibia.fandom.com/es/wiki/Slime_(Creature) |
| 6 | Baldur's Gate 3 | Acid surface, −2 AC | https://bg3.wiki/wiki/Acid_(surface) |
| 7 | NetHack | 3-stage erosion, grease, oil repair, erodeproofing | https://nethackwiki.com/wiki/Erosion |
| 8 | Dark Souls | Acid Surge, about 1 durability/s for 8 s | https://darksouls.wiki.fextralife.com/Acid+Surge |
| 9 | Hollow Knight | Acid as a traversal gate (Isma's Tear) | https://hollowknight.wiki/w/Isma%27s_Tear |
| 10 | Slime Rancher | Tarr: contagious, slime-eating; water kills | https://slimerancher.gamepedia.com/The_Tarr |
| 11 | Zelda series | ChuChu colour = element; split and re-merge; puddle dodge | https://www.zeldadungeon.net/wiki/ChuChu |
| 12 | Terraria | Items visible inside slimes; mother slime splits; hop tell | https://terraria.wiki.gg/wiki/Slimes |
| 13 | Zelda BotW | Durability as strategy (design rationale) | https://www.zeldadungeon.net/wiki/Interview:Nintendo_Power_Podcast_December_21st_2017 |

## Short quotes (each under 15 words)

- "The basic ones are usually green." (imonk, itch.io)
- "the little dabs of highlights" (imonk, itch.io)
- "This is also a 6 frame loop." (Slynyrd)
- "Simple pulsing lines can be used to express directional river flow." (Slynyrd)
- "perfect for creating interesting glow and lighting effects." (Digi, Lospec)
- "Flying triangles usually indicate incoming damage." (Mighty Bear Games)
- "a bit more strategic, a bit more fun, a bit more in-depth" (Aonuma)
- "Rewards that feel temporary or useless are bad rewards." (Game Informer)
- "kill my character, don't break my toys." (Gnaeus, GiantITP)
- "Having agency seems to be an important part to me." (Curse, GiantITP)
- "bright-green liquid material" (Noita wiki)

## Sources
- https://itch.io/t/1471610/pixel-tutorial-slimes
- https://itch.io/t/2614553/pixel-tutorial-slime-monster-design
- https://itch.io/t/2118972/pixel-tutorial-drawing-slime-creatures (not fetched)
- https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- https://www.kenney.nl/learn/drawing-particle-effect-sprites
- https://lospec.com/palette-list/eight-hues-of-toxic-ooze
- https://lospec.com/palette-list/tag/poison (not fetched)
- https://80.lv/articles/pixel-animation-tutorial-by-pedro-medeiros
- https://medium.com/mighty-bear-games/how-ux-design-can-help-with-vfx-a0925f80e0f0
- https://nethackwiki.com/wiki/Erosion
- https://www.zeldadungeon.net/wiki/Interview:Nintendo_Power_Podcast_December_21st_2017
- https://gameinformer.com/b/features/archive/2017/05/16/opinion-why-breaking-weapons-are-ruining-my-zelda-experience
- https://forums.giantitp.com/archive/index.php/t-663703.html
- https://enterthegungeon.wiki.gg/wiki/Goop
- https://tibia.fandom.com/es/wiki/Slime_(Creature)
- https://bg3.wiki/wiki/Acid_(surface)
- https://noita.fandom.com/wiki/Acid
- https://hollowknight.wiki/w/Isma%27s_Tear
- https://darksouls.wiki.fextralife.com/Acid+Surge
- https://slimerancher.gamepedia.com/The_Tarr
- https://terraria.wiki.gg/wiki/Slimes
- https://bindingofisaacrebirth.wiki.gg/wiki/Creep
- https://www.zeldadungeon.net/wiki/ChuChu
