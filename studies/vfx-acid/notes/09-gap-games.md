# 09 — Gap: more real game examples of acid / corrosion / slime (not covered in 01–08)

Scope: new examples only. Metroid acid and Dark Souls *Acid Surge* (8 s, about 1 durability/s) are already in 01 and 06, so they are not repeated here.
Confirmed with URL and numbers: **10** (XCOM 2, Factorio, Elden Ring Scarlet Rot, Don't Starve Together Acid Rain, Zelda Like Like, Stardew Valley slimes, Minecraft slimes, Path of Exile Caustic Ground, Monster Hunter World Acidic Glavenus, Dragon Quest Slime). Partial: Dark Souls 2 Corrosive Egg Crawlers.

---

## Q1. Which games have acid that *stays on the tiles* (pools, trails, splashes) and how long does it stay?

**Takeaway:** The best grid and top-down games treat acid as a **ground decal with a short, fixed lifetime** (3 turns, or 3–6 s, or 32 s). It deals damage per turn or second, and sometimes slows. Bigger sources give the same lifetime but more damage per second.

**Cited findings**
- **XCOM 2 (2016), turn-based grid**
  - Acid Burn deals **1–3 damage per turn**, at the start of the unit's turn, for **2 turns**.
  - Sources: Acid Grenade or Bomb, the Andromedon's Acid Bomb, the acid trail of an Andromedon Shell, exploding acid containers, and walking on an acid-polluted tile.
  - Cured by Medikit or Medical Protocol. Hazmat Vest gives immunity. https://xcom.fandom.com/wiki/Acid_Burn
  - Acid splashes left on the ground **last 3 turns** and burn any non-immune unit that moves through them.
  - The grenade does not destroy cover at once, but "the leftover acid may destroy cover on the following turns." https://xcom.fandom.com/wiki/Acid_Grenade_(XCOM_2)
  - Acid Grenade: **3–4 dmg, radius 3, shred 2**. Acid Bomb: **5–6 dmg, radius 3, shred 4**, the highest shred of any grenade.
  - For comparison, Incendiary Grenade shreds 1 and Gas Grenade shreds 1. All have range 10. https://www.gamepressure.com/xcom2/grenades-and-explosives/z985e7
  - Andromedon (the alien's own Acid Bomb): **5–7 dmg, shred 3**, plus Acid Burn. HP is 12/15/18/21 depending on difficulty, with 4 armor.
  - After the pilot dies, the empty suit (the Shell) keeps walking, "trailing acidic coolant all over the ground as it moves." It also loses its armor pips. https://temp.ufopaedia.org/Andromedon_(XCOM2)
- **Factorio (real-time, top-down)**
  - Spitters fire at **0.6 attacks/s**.
  - The acid lands as a **puddle that lasts 32 s** for every size, and slows the player or vehicle for 2 s. https://wiki.factorio.com/Spitters

  | Spitter | Range | Hit damage | Splash size | Puddle damage | Slow |
  |---|---|---|---|---|---|
  | Small | 13 | 12 acid | 1 | 7.2/s | 60% |
  | Medium | 14 | 24 | 1.25 | 28.8/s | 50% |
  | Big | 15 | 36 | 1.35 | 130/s | 40% |
  | Behemoth | 16 | 60 | 1.75 | 360/s | 30% |

  The wiki says "both the stream and the puddle of acid deal damage over time and slow down." Spitters lead their shots, so changing direction suddenly dodges them.
- **Path of Exile, Caustic Ground**
  - A chaos-damage ground effect. It is made by Caustic Arrow on impact, by Vaal Caustic Arrow as a trail, by monsters with an on-death modifier, by the "Contaminated" chest prefix, and by Siegebreaker minions on death.
  - Siegebreaker minions deal **20% of their max Life per second** as chaos damage.
  - On-death clouds last **3000 ms (radius 12) or 6000 ms (radius 16)**.
  - The base stat is stored as "chaos damage taken per minute." https://poedb.tw/us/Caustic_ground

**Inferences**
- Two lifetimes work well: **3 turns** on a turn-based grid, and **about 30 s** in real time. Both are long enough to deny an area and short enough not to clutter the map.
- The Factorio table is a ready-made **tier ladder**. The puddle footprint grows slowly (1 → 1.75), damage per second grows quickly (7 → 360), and the slow gets weaker (60% → 30%).
- The XCOM Andromedon Shell is the "creature = acid" link the study needs: its **death leaves an acid source that keeps moving**. A slime boss's husk could do the same and keep leaking.
- XCOM's delayed cover destruction ("may destroy cover on the following turns") works like a slow per-tile structure-HP drain. It maps directly onto a corrosion-stage counter per tile.

**Gaps:** XCOM's chance per turn that cover is destroyed by acid was not found. The base duration for Caustic Arrow was not found (poewiki.net was blocked by bot protection).

---

## Q2. Acid that attacks ARMOR rather than HP

**Takeaway:** "Shred" (permanently removes armor points) and "Defense Down" (a temporary multiplier) are the two well-known ways to make acid hit armor. XCOM's shred is the clearest and has the best numbers.

**Cited findings**
- **XCOM 2:** Acid is the best shredding element, at 2 (grenade) or 4 (bomb) points, compared with 1–2 for fire or gas. Acid-immune units still take the blast damage and the shred. https://www.gamepressure.com/xcom2/grenades-and-explosives/z985e7 ; https://xcom.fandom.com/wiki/Acid_Grenade_(XCOM_2)
- **Monster Hunter World: Iceborne, Acidic Glavenus (2019):**
  - Its tail is "coated with sulphur that can melt through thick armor."
  - Touching it, or stepping in the **acid pools left by its tail slams**, causes **Defense Down**. The guide recommends Adamant Seeds as the counter. https://samurai-gamers.com/monsterhunterworld/acidic-glavenus-monster-guide/
  - Defense Down comes in (S) "lowers" and (L) "significantly lowers" versions. It has a fixed duration and is cured by any defense-buff item. https://mhworld.kiranico.com/guide/status
- **Don't Starve Together, Acid Rain:** Acid rain wears down equipped water-resistant gear. Armor loses 3 HP per tick (e.g. Football Helmet) and clothing loses 3 s of durability. Details in Q4. https://dontstarve.wiki.gg/wiki/Acid_rain

**Inferences**
- For a Tibia-like game: acid on armor could be (a) a timed **–X armor debuff** (cheap, MH-style) plus (b) a small **permanent durability loss** (DST/XCOM-style). The visible corrosion stage on the sprite could come from (b).

**Gaps:** The exact Defense Down percentages and durations in MHW were not found. Kiranico gives them only as words. The Fextralife page was not reachable.

---

## Q3. Swamps, coatings and washing off: terrain acid that follows you

**Takeaway:** Elden Ring's Scarlet Rot shows a cheap rule players remember: **standing in the swamp builds up the status, rolling in it leaves a coating that keeps building after you leave, and clean water, rain or soap removes the coating at once.** This is the acid "+ water = neutralise" combo built into the terrain.

**Cited findings**
- **Elden Ring (2022), Scarlet Rot.**
  - Buildup works on a threshold and is resisted by Immunity.
  - Swamps build rot continuously while you stand in them.
  - "Rolling in the sludge leaves a coating" that keeps building rot after you leave. The coating is removed at once by **rain, rolling in clean water, or Soap**.
  - Swamp locations: Lake of Rot, Swamp of Aeonia, Caelid caves and catacombs, Elphael.
  - Buildup per source: Rot Pot +300; Rot Grease +63 (60 s); Scarlet Aeonia +150 on the first burst and +50 lingering (4.2 s).
  - Cures: Preserving Boluses, Flame Cleanse Me (14 FP). https://eldenring.wiki.gg/wiki/Scarlet_Rot
- Damage while rotting (Fextralife):

  | Source | Damage per second | Duration |
  |---|---|---|
  | Weapons | 0.18% max HP + 15 | 90 s |
  | Rot breath | 0.33% + 13 | 90 s |
  | Swamp of Aeonia | 2% + 8 | 180 s |
  | Lake of Rot | 2% + 30 | 180 s |
  | Malenia | 3.3% + 26 | 300 s |

  User-reported numbers in the page comments differ (e.g. about 59 dmg/s on 1450 HP in the Lake of Rot), and these are unverified. https://eldenring.wiki.fextralife.com/scarlet+rot

**Inferences**
- The formula is **flat + % max HP per second**, which scales with any HP pool. That suits an MMO where HP ranges widely.
- The "coating" is a **per-entity status that is a copy of the tile's status**, and water tiles or rain clear it. It is cheap to build: one float per entity, set to zero when the entity enters a water tile or when it rains. It also gives clean water a gameplay purpose.
- Visually, a swamp the colour of rot or acid works as a **"don't walk here" palette** that players learn from Caelid at once.

---

## Q4. Weather or ambient acid that wears down equipment

**Cited findings**
- **Don't Starve Together, Acid Rain** (added in the *Terrors Below* update; the date was not on the page).
  - It replaces normal rain in the Caves during Shadow Rift activity.
  - It deals **up to 3 damage every 1.5 s**, scaled by rain strength. 100% water resistance negates it.
  - Perishables in the inventory lose **0.07% freshness per tick**. A backpack prevents this.
  - Equipped water-resistant armor loses **3 HP**, and clothing loses **3 s of durability**.
  - Mushtrees collect acid on their caps, so the mushrooms they drop are partly spoiled.
  - Underground ponds become covered in Nitre and can't be fished until it is removed.
  - Rock Lobsters **shrink when damaged and slowly regrow after the rain stops**.
  - The Umbralla gives full protection and repairs itself while held. https://dontstarve.wiki.gg/wiki/Acid_rain

**Inferences**
- DST shows acid as a world event that changes the **ecology**, not just the damage: food spoils, ponds crust over, creatures shrink. For "the world feels alive", a few cheap tile and entity flags that react to an acid-rain event are worth a lot. For example, ponds could get a crust and slimes could swell.
- The "acid → mineral crust on water" result (Nitre) is a nice touch: a **salt or residue tile left behind** that the player has to clear.

---

## Q5. Creatures that eat your gear (Like Like) — the classic item-loss slime

**Takeaway:** The Like Like (Zelda, 1986 onward) is the reference design for a **slime that swallows and keeps equipment**. How harsh it is varies by game, and players remember it as a pain, not as a cool trick.

**Cited findings** (Zelda Universe species overview, https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/)

| Game | What it takes | Is the item lost? | Extra mechanic |
|---|---|---|---|
| *Zelda* (1986) | The Magical Shield only | Not stated | Swallows Link; slash quickly to escape |
| *Link's Awakening* (1993) | Shield, only if equipped; Mirror Shield immune | Not stated | Break free quickly |
| *Ocarina of Time* (1998) / *Majora's Mask* | Shield or tunic | Tunics can be rebought | Break free quickly |
| *Oracle* games (2001) | Any shield, even if not equipped | **Permanent**; buy a new one | Shield taken as soon as Link is trapped |
| *A Link to the Past* (GBA) / *Minish Cap* | Any shield | **Recoverable** if killed before it escapes ("not digested") | — |
| *Phantom Hourglass* / *Spirit Tracks* | Shield | Recoverable after it is destroyed | Mouth pulls Link in like a vacuum; in *Spirit Tracks* they hide in pots and chests |
| *A Link Between Worlds* (2013) | Any shield except the Mirror Shield | **Permanent** | — |

- Player reception: the article calls it "a source of aggravation for many gamers for decades." The trait "has generated groans from players instead of praise."

**Inferences**
- The good version is "**kill it before it digests**": a short timer (a few seconds or turns) during which the item can still be recovered. It can show visibly *inside* the translucent slime, using the same threshold-field slime renderer. After the timer it is eaten, or dropped corroded one stage lower. This keeps the drama and avoids the "groans".
- Immunity on a top-tier item (the Mirror Shield) is a satisfying reward for progression. It works like "gold and glass resist acid" in the material table.

**Gaps:** The Wind Waker and *Tears of the Kingdom* versions were not checked. zeldawiki.wiki, zeldadungeon.net and breezewiki were blocked or errored.

---

## Q6. Slimes as a family: splitting, colour, size tiers, items inside

**Cited findings**
- **Minecraft:** Slimes come in small, medium and large sizes with **1, 4 and 16 HP**. Contact damage is **0, 2 and 4**.
  - Below Y 40 they spawn only in "slime chunks", which are about **1 in 10 chunks**.
  - In swamps they spawn at Y 51–69 at light level 7 or lower. https://wikily.gg/minecraft/mobs/slime
  - The number of smaller slimes spawned on death was not covered by that page; the minecraft.wiki page was blocked.
- **Stardew Valley:** Slime colour follows the depth of the mines: green on floors 1–29, blue (Frost Jelly) on 41–79, red on 81–119, purple in Skull Cavern.

  | Slime | HP | Damage |
  |---|---|---|
  | Green | 24 | 5 |
  | Blue | 106 | 7 |
  | Red | 205 | 16 |
  | Purple | 410 | 16 |
  | Tiger | 415 | 23 |

  - A killed Big Slime has a **75% chance to split into 2–4 smaller slimes**.
  - During some special orders, Big Purple Sludges **hold extra drops and look semi-transparent when they do**, so you can see an item inside a translucent slime.
  - Copper and Iron slimes drop ore.
  - Slime Hutch breeding mixes the **R, G and B components separately**: 25% from the male parent's value (±25%), 25% from the female's (±25%), and 50% the higher of the two or their average.
  - The Slime Charmer Ring (reward for 1,000 slime kills) blocks all slime damage and the "Slimed" debuff. https://stardewvalleywiki.com/Slimes
- **Dragon Quest Slime (1986):** It is the first and weakest enemy. Horii took the idea from *Wizardry*, where it was "a pile of goo". Akira Toriyama's **teardrop** design made it the series mascot.
  - The Metal Slime variant has low HP, high speed and evasion, a high chance to flee, and gives a lot of XP. https://en.wikipedia.org/wiki/Slime_(Dragon_Quest) ; https://www.engadget.com/2010/07/10/yuji-horii-explains-the-dragon-quest-slimes-origin/

**Inferences**
- Slime colour can be a **palette index tied to depth or biome**, as in Stardew. In palette-swap pixel art it costs nothing, and it matches the palette-ramp approach of the snow study.
- Stardew's breeding rule (inherit each RGB channel separately, with ±25% jitter) can be reused as is for **colours of slimes that mix or merge** when two slimes combine in the metaball renderer.
- The "visible item inside a semi-transparent slime" in Stardew, together with the Like Like, confirms the **"absorbing or digesting items" idea for creatures** in the context file.
- The Dragon Quest lesson: a readable, friendly silhouette (a teardrop with eyes) makes slimes iconic even when they are weak. Danger can come from the **acid variant's ground pools**, not from the sprite.

---

## Q7. Others checked (partial)
- **Dark Souls 2, Corrosive Egg Crawlers:** "Capable of emitting particles that damage equipment durability." They have 400 HP on NG and respawn. Found in Shulva, Dragon's Sanctum and the Gutter. No durability numbers. https://darksouls2.wiki.fextralife.com/Corrosive+Egg+Crawlers . The "Corrosive Urn" consumable exists (https://darksouls2.wiki.fextralife.com/Corrosive+Urn) but was not fetched.
- **Not researched (budget):** Darkest Dungeon blight, Spelunky 2, Dead Cells Toxic Sewers, Pathfinder WotR acid, Terraria Calamity Sulphurous Sea, Oxygen Not Included, Rain World, Metroid Dread.

---

## Summary table (new examples)

| # | Game | What is memorable | Key numbers | URL |
|---|---|---|---|---|
| 1 | XCOM 2 | Acid shreds armor; ground splashes; leftover acid eats cover; empty suit leaks acid | Burn 1–3/turn × 2 turns; pools 3 turns; shred 2/4 | https://xcom.fandom.com/wiki/Acid_Burn |
| 2 | Factorio | Spitter acid puddles that slow, with a clean tier table | 0.6 atk/s; puddle 32 s; 7.2 → 360 dmg/s; slow 60 → 30% | https://wiki.factorio.com/Spitters |
| 3 | Elden Ring | Rot swamps, a coating that keeps building after you leave, washed off by water, rain or soap | 0.18% + 15/s × 90 s; Lake of Rot 2% + 30/s × 180 s | https://eldenring.wiki.gg/wiki/Scarlet_Rot |
| 4 | Don't Starve Together | Acid rain wears down gear, spoils food, crusts ponds, shrinks creatures | 3 dmg / 1.5 s; armor –3 per tick; food –0.07% per tick | https://dontstarve.wiki.gg/wiki/Acid_rain |
| 5 | Zelda (Like Like) | A slime that eats your shield | Permanent or recoverable, depending on the game | https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/ |
| 6 | Stardew Valley | Slime colour by depth, splitting, visible items inside, RGB breeding | 75% split into 2–4; HP 24 → 410 | https://stardewvalleywiki.com/Slimes |
| 7 | Minecraft | Three size tiers, 4× HP per tier | 1/4/16 HP; 1 in 10 slime chunks | https://wikily.gg/minecraft/mobs/slime |
| 8 | Path of Exile | Caustic ground on death or impact | Clouds 3 s (r12) or 6 s (r16); 20% of life per second (Siegebreaker) | https://poedb.tw/us/Caustic_ground |
| 9 | Monster Hunter World: Iceborne | Acid tail pools give Defense Down | Only qualitative (S/L) | https://samurai-gamers.com/monsterhunterworld/acidic-glavenus-monster-guide/ |
| 10 | Dragon Quest | The iconic teardrop slime; Metal Slime flees | First enemy (1986) | https://en.wikipedia.org/wiki/Slime_(Dragon_Quest) |
| 11 (partial) | Dark Souls 2 | Egg crawlers that corrode gear durability | 400 HP; no durability numbers | https://darksouls2.wiki.fextralife.com/Corrosive+Egg+Crawlers |

## Sources
- https://xcom.fandom.com/wiki/Acid_Burn
- https://xcom.fandom.com/wiki/Acid_Grenade_(XCOM_2)
- https://www.gamepressure.com/xcom2/grenades-and-explosives/z985e7
- https://temp.ufopaedia.org/Andromedon_(XCOM2)
- https://xcom2.wiki.fextralife.com/Andromedon
- https://wiki.factorio.com/Spitters
- https://eldenring.wiki.gg/wiki/Scarlet_Rot
- https://eldenring.wiki.fextralife.com/scarlet+rot
- https://dontstarve.wiki.gg/wiki/Acid_rain
- https://zeldauniverse.net/2020/06/02/zeldas-study-like-like-species-overview/
- https://stardewvalleywiki.com/Slimes
- https://wikily.gg/minecraft/mobs/slime
- https://poedb.tw/us/Caustic_ground
- https://samurai-gamers.com/monsterhunterworld/acidic-glavenus-monster-guide/
- https://mhworld.kiranico.com/guide/status
- https://en.wikipedia.org/wiki/Slime_(Dragon_Quest)
- https://www.engadget.com/2010/07/10/yuji-horii-explains-the-dragon-quest-slimes-origin/
- https://darksouls2.wiki.fextralife.com/Corrosive+Egg+Crawlers

Blocked or failed: xcom.fandom.com/wiki/Acid_(XCOM_2) (not on allowlist), zeldawiki.wiki (client error), zeldadungeon.net (not on allowlist / client error), breezewiki (Anubis), minecraft.wiki (not on allowlist), poewiki.net (Anubis), monsterhunterworld.wiki.fextralife.com (not on allowlist).
