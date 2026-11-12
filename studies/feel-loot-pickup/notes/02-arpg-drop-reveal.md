# 02. Drop and reveal in ARPGs and loot games

Researcher angle: how items leave a dead monster and announce themselves. Pop arcs, landing sounds, scatter, rarity colours, beams, minimap pings, labels, loot filters. Then what transfers to a 32 px top-down MMO with many players on one screen.

Scope note: combat juice (study #2) ends at the corpse. This file starts at the first frame an item exists.

Tool budget used: about 30 calls. Several wikis (poewiki, Fandom, Icy Veins) returned 403 or Anubis blocks. Where possible I went to source data instead: devilutionX (Diablo I source port), blizzhackers/d2data (Diablo II item tables as JSON), the official PoE filter reference, and NeverSink's filter file on GitHub.

---

## Q1. How long is the pop, and when does the landing sound play?

### Takeaway
The two games with readable data agree on one thing. The drop is a pre-drawn "flip" animation of about 0.4 to 0.8 s, and the landing sound fires partway through it, not at the end. The sound is chosen by item type (sword, ring, potion, rune), not by value. Value is announced by colour, beam and filter sounds layered on top.

### Cited findings
- Diablo I (devilutionX source). `ItemAnimLs[]` gives the drop animation length per item graphic. Most are 13 frames. The range is 8 to 20 frames (one static entry is 1). Gold is 10 frames. Potions, books and scrolls are 16. https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp
- Diablo I plays the drop sound when `currentFrame == (numberOfFrames - 1) / 2`, the middle of the flip. Same file, around line 3795.
- Diablo I game tick: `gnTickDelay = 50` ms, so 20 ticks per second. https://github.com/diasurgical/devilutionX/blob/master/Source/diablo.cpp
- Drop animations run at 1 tick per frame (`setNewAnimation(sprite, numberOfFrames, 1)`), items.cpp around line 4819.
- Diablo I has a separate drop sound per item class in `ItemDropSnds[]`: ArmorFlip, AxeFlip, PotionFlip, BowFlip, Gold, CapFlip, SwordFlip, ShieldFlip, RingFlip, ScrollFlip, BookFlip, RockFlip, and more. 43 graphics map to about 20 sounds. items.cpp lines 322 to 366.
- Diablo II item tables (d2data JSON). Every item has a `dropsound` and a `dropsfxframe`, the frame of the "flippy" animation on which the sound plays. Of 306 weapons, 300 use frame 12. All 217 armours use frame 12. Misc items: 126 at frame 12, 37 at frame 14 (potions, body parts), 6 at frame 10 (scrolls). https://github.com/blizzhackers/d2data/tree/master/json (misc.json, weapons.json, armor.json)
- Diablo II logic runs at 25 frames per second. https://diablo2.diablowiki.net/FPS
- All 33 Diablo II runes share one sound, `item_rune`, on frame 12, with flippy file `flprun`. El (the cheapest) and Zod (the rarest) sound the same. misc.json in d2data.
- Diablo III's sound team called the loot pop the "flippy" sound and named it one of the game's most recognisable sounds. https://www.gamebanshee.com/kuucc
- Grim Dawn modder test: a custom loot beam "stays on the ground 5 seconds" in that setup, and a sound can be bound to drop or beam cast. https://forums.crateentertainment.com/t/loot-beam-anyone-attempt-it/33489

### Inferences (mine)
- Diablo I flip: 13 frames x 50 ms = 650 ms total, sound at frame 6, about 300 ms in. Range 400 ms (8 frames) to 1000 ms (20 frames).
- Diablo II flip: sound at frame 12 / 25 fps = 480 ms. Scrolls 400 ms, potions 560 ms.
- So both classics put the "clink" at roughly 300 to 500 ms after spawn. That is the moment the item reads as landed. Anything the player can do with the item before then feels early. Anything after feels like lag.
- The D2 "rune sound" is famous only because the sound is tied to the rune item type, and runes are rare as a class. Players learned a type cue as a value cue. A Tibia-like with many item types can get the same effect cheaply by giving a small set of high-value types (runes, gems, orbs) their own landing sound.
- For a server-authoritative MMO the flip is pure client presentation. The server can place the item on its tile at t=0 and the client plays the 400 to 650 ms flip. Study #2 said the corpse appears about 133 ms after the killing hit. A 500 ms flip on top of that puts "loot readable" at roughly 600 to 650 ms after the kill.

### Gaps
- No primary numbers for pop arc height in pixels for any game. Diablo I and II arcs are baked into sprite frames, so height is art, not code.
- No numbers for Diablo III, IV or PoE pop duration. They use 3D physics-like arcs with no public parameters.
- Bounce count: the classics do not bounce. The flip is one arc then rest. Bounces are a modern 3D thing I could not measure.

---

## Q2. Where do items land? Scatter around the corpse

### Takeaway
Diablo I is the cleanest grid example and it maps straight onto a 32 px tile game. One item per tile. If the tile is taken, search outward ring by ring. This spreads a big drop into a readable blob and stops items stacking under each other.

### Cited findings
- Diablo I `ItemSpaceOk()` rejects a tile if it is out of bounds, solid, already holds an item, or holds a monster or player. https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp (line 3061)
- `GetSuperItemSpace()` first calls `GetItemSpace()` near the drop point, then searches square rings from k = 2 to 49 around it and takes the first free tile. Same file, around line 3236.
- `GetSuperItemLoc()` uses `FindClosestValidPosition(ItemSpaceOk, position, 1, 50)`. Same file, line 3126.
- Diablo I monster drop odds in code: `GenerateRnd(100) > 40` returns no item, so about 40% of kills drop something, and of those about 75% is gold. Same file, around line 3258. (Economics is out of scope. I note it only because it sets how often the flip plays.)

### Inferences (mine)
- Tibia stacks many items in one corpse container, so this ring search matters only for the ground-spill option (death drops, boss explosions, PvP bags). For Asterion, one-item-per-tile with ring search is a good default for any ground spill. It keeps every item clickable at 32 px.
- Stagger between items: the classics spawn all items on the same tick. With identical flip lengths they land together and the sounds stack. A 30 to 60 ms stagger per item (estimate) would turn a stacked "clang" into a short roll. I found no cited value.

### Gaps
- No cited stagger value between items for any ARPG.

---

## Q3. Rarity tiers and colours

### Takeaway
Five to seven tiers is the norm. More tiers make neighbours look alike. Terraria's own wiki warns players confuse green and lime, and orange and light red. Hex values that are known and usable at 32 px are below.

### Cited findings

Terraria (wiki.gg, RGB from the Rarity page; hex is my conversion). https://terraria.wiki.gg/wiki/Rarity

| Tier | Name | Hex |
|---|---|---|
| -1 | Gray | #828282 |
| 0 | White | #FFFFFF |
| 1 | Blue | #9696FF |
| 2 | Green | #96FF96 |
| 3 | Orange | #FFC896 |
| 4 | Light Red | #FF9696 |
| 5 | Pink | #FF96FF |
| 6 | Light Purple | #D2A0FF |
| 7 | Lime | #96FF0A |
| 8 | Yellow | #FFFF0A |
| 9 | Cyan | #05C8FF |
| 10 | Red | #FF2864 |
| 11 | Purple | #B428FF |
| Quest | Amber | #FFAF00 |
| Expert | Rainbow (animated) | none |
| Master | Fiery Red (animated) | none |

- Terraria wiki notes certain colours "appear very similar" in-game: Green/Lime, Orange/Light Red. https://terraria.wiki.gg/wiki/Template:Rare
- Terraria uses animated colour cycling to mark the two top special tiers. Same Rarity page.
- Diablo II name colours: white normal, blue magic, yellow rare, orange crafted, green set, gold unique. Battle.net archive lists Magic, Rare, Crafted, Set, Unique as "Violet, Yellow, Orange, Green, and Gold". https://classic.battle.net/diablo2exp/items/magic.shtml
- Diablo II stores these as palette indices, not RGB: white 0x20, blue 0x97, yellow 0x6D, gold 0x53, green 0x84. https://wiki.projectdiablo2.com/wiki/Lootfilter
- D2R players complain the unique gold is hard to read on the ground. https://us.forums.blizzard.com/en/d2r/t/unique-item-color-is-hard-to-see-can-it-be-changed/90703
- Borderlands: white, green, blue, purple, orange (legendary). Higher tiers get a longer light beam on the ground. https://twinfinite.net/guides/borderlands-3-tips-and-tricks-for-beginners/2/
- Borderlands 3 dropped the rainbow "Pearlescent" tier. Borderlands 4 brought it back. https://mobalytics.gg/borderlands-4/guides/pearlescent-best-rolls
- Path of Exile 2 has four item rarities: Normal, Magic, Rare, Unique. https://www.poe2wiki.net/wiki/Item_rarity
- Diablo IV Mythic Uniques show a purple beam and purple tooltip text, per a guide (one other guide disagrees, calling it golden white). https://joshtronic.com/2024/06/09/diablo-iv-mythic-uniques/

### Inferences (mine)
- The white, green, blue, purple, orange order (Borderlands, WoW lineage) is close to a shared language. Players read it without a tutorial. I would not fight it.
- Terraria's pastel values (150 to 255 per channel) read well as text on dark backgrounds. At 32 px on a busy green or brown Tibia-style floor, pastels will wash out. A 1 px dark outline or a filled label background is needed. PoE top-tier filters do exactly this (see Q5).
- Animated colour (Terraria rainbow, Borderlands pearlescent) is a cheap way to add a top tier without inventing a new hue. On the GPU it is one uniform or a palette swap.
- For colour-blind safety, tiers should also differ in a second channel: beam height, icon shape, sound. PoE minimap icons pair colour with 12 shapes for that reason (Q5).

### Gaps
- PoE 1 rarity hex values: poewiki blocked by Anubis. Not verified here.
- Diablo III and IV exact hex values: not found in a primary source.

---

## Q4. Beams, glow, minimap pings and the legendary sound

### Takeaway
Diablo III set the template that every later game copies. A top-tier drop gets three cues at once: a loud distinct sound, a vertical beam of light in the tier colour, and a star on the minimap. Diablo IV kept the sound and beam but toned them down. Beams work because they are tall. They escape the clutter on the floor plane.

### Cited findings
- Diablo III legendaries "announce themselves" with a loud clang, an orange (set items: green) beam, and a star or asterisk on the minimap. https://di.diablowiki.net/Legendary
- PC Gamer described the D3 legendary CLANG cutting through battle noise. https://www.pcgamer.com/uk/diablo-3-1
- Diablo III Loot 2.0 (BlizzCon 2013) goals: "Less is more", items support builds, "Rarity equals power". Fewer drops, narrower affix ranges, a smart-drop system biased to your class. https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript
- Diablo IV legendary drops have a chime and a light pillar, "a bit toned down" from D3, per a guide. https://www.gamerguides.com/diablo-iv/guide/equipment/loot-drops
- Diablo IV Season 4 "Loot Reborn" (14 May 2024): fewer drops with higher odds of being valuable, rares with 2 affixes and legendaries with 3, to cut sorting time. https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/
- Diablo Immortal uses an orange beam for runes as well, and players mistake runes for legendaries. https://us.forums.blizzard.com/en/diablo-immortal/t/loot-bug-legendary-drop-vanishes-as-soon-as-they-come-able-to-see-orange-glow-for-few-seconds-no-legendary-drops-from-open-world/5811
- Path of Exile beams are filter-controlled: `PlayEffect <Colour> [Temp]`. With `Temp` the beam shows only while the item drops. Without it the beam stays. 11 colours. https://pathofexile.com/item-filter/about
- Grim Dawn: beams are set per rarity in the engine through particle files (`pfx_lootsparkle04.pfx` for the legendary beam in a mod). https://forums.crateentertainment.com/t/fx-pseditor-and-loot-beams/44356

### Inferences (mine)
- Two beam lifetimes exist: a short beam during the drop (PoE `Temp`, Grim Dawn test of 5 s) and a persistent beam (D3, PoE default). On a shared MMO screen, persistent beams from 10 other players' drops are noise. A short beam for everyone and a persistent beam only for the owner (if items are owned) is the obvious adaptation.
- Reusing a tier colour on a different item class (Immortal runes) breaks the cue. Keep one colour for one meaning.
- In a 3/4 top-down 32 px game the beam is a vertical sprite. A 1 x 3 tile (32 x 96 px) additive quad with a soft vertical gradient reads as a beam and costs one draw. Estimate, not measured.
- Diablo III's lesson for presentation is the inverse of clutter. Loot 2.0 made legendary beams rarer, so each one felt bigger. A beam that fires every few kills stops working.

### Gaps
- No measured beam height, pulse period or sound length for D3, D4, PoE 2 or Borderlands.
- Destiny exotic engram drop sound: found exotic weapon sound interviews only, nothing on the engram cue.
- Lost Ark, Torchlight, Titan Quest: no usable primary data found in budget.

---

## Q5. Loot filters: what they control and what the top filter actually does

### Takeaway
A PoE filter is a data-driven presentation table. Each rule sets font size, three colours, a sound, a beam, and a minimap icon. NeverSink's filter shows the real design choice: top tiers invert the label (bright filled background), use the max font size and max volume, and get a red beam plus a large red star on the minimap. Junk is shrunk to the minimum font with no border and no drop sound. That is a template Asterion can copy as a data file.

### Cited findings (official PoE syntax) https://pathofexile.com/item-filter/about
- `SetFontSize` 1 to 45. (A secondary source gives 18 to 45 with default 32. https://poedb.tw/cn/Item_Filter)
- `SetTextColor / SetBorderColor / SetBackgroundColor` R G B [A], 0 to 255. Default background alpha 240.
- `PlayAlertSound <Id 1-16> <Volume 0-300>`, default volume 50. `PlayAlertSoundPositional` plays at the item's location.
- `CustomAlertSound "file"` lets players use their own audio files.
- `MinimapIcon <Size 0-2> <Colour> <Shape>`. 11 colours, 12 shapes (Circle, Diamond, Hexagon, Square, Star, Triangle, Cross, Moon, Raindrop, Kite, Pentagon, UpsideDownHouse).
- `PlayEffect <Colour> [Temp]` for beams.
- `DisableDropSound` mutes the default landing sound. `Hide` removes the label.

### Cited findings (NeverSink 2-SEMI-STRICT, v8.20.2, counted by me) https://github.com/NeverSinkDev/NeverSink-Filter
- 10,890 lines. 753 Show blocks, 26 Hide blocks active in this strictness.
- Font sizes used: 45 (543 rules), 40 (128), 35 (24), 30 (1), 18 (10). So the filter uses four visible sizes plus a "nearly hidden" size.
- Alert sounds: all at volume 300 (the maximum). Six IDs used, most often 3 (237 rules), 2 (140), 1 (66).
- Beams: Blue 114, Red 91, Purple 79, Yellow 72, White 71, Grey 37, plus Temp variants.
- Top tier style example: `SetFontSize 45`, white text and border, background 240 90 35 (bright orange fill), `PlayAlertSound 1 300`, `PlayEffect Red`, `MinimapIcon 0 Red Star`. Lines 659 to 670.
- Junk style example: `SetFontSize 18`, border alpha 0, background 20 20 0 alpha 0, `DisableDropSound True`. Around line 3596.
- NeverSink ships seven strictness levels, each hiding more. https://www.pcgamer.com/games/rpg/psa-the-creator-of-poes-foremost-loot-filter-released-an-experimental-light-filter-for-path-of-exile-2-just-in-time-to-help-sort-all-the-freshly-buffed-loot-drops

### Cited findings (other games)
- Last Epoch native filter: up to 75 rules, conditions on affix, class, level, rarity, item type; actions show, hide, recolour. https://www.gameskinny.com/tips/how-to-use-loot-filters-in-last-epoch/
- Diablo II Resurrected got a native loot filter with the paid Reign of the Warlock expansion, February 2026, with JSON profile import. https://www.icy-veins.com/d2/loot-filter and https://www.tweaktown.com/news/110129/diablo-2-gets-loot-filters-stash-tabs-and-built-in-holy-grail-tracker-in-new-25-expansion/index.html
- Before that, D2R players relied on mods (D2RMM loot filters, `-mod lootfilter -txt` launch flag) for rune sounds and glows. https://nexusmods.com/diablo2resurrected/mods/408?tab=posts
- Path of Diablo sound packs scale sound length and intensity by value, and some replace high-rune sounds with a sped-up D3 legendary sound. https://pathofdiablo.com/wiki/Loot_SFX
- Grim Dawn has a built-in filter for colour and size. https://forums.crateentertainment.com/t/loot-beam-anyone-attempt-it/33489

### Inferences (mine)
- The filter is where presentation becomes data. For Godot this is a Resource per tier (font size, colours, sound id, beam colour, beam lifetime, minimap icon) and a rule list matched server-side or client-side. Server sends item id and tier. Client looks up the style. No style data on the wire.
- Filter dependence is the anti-pattern. PoE drops so much that a third-party filter is practically required. D3 and D4 both fixed the root cause by dropping less (Loot 2.0, Loot Reborn) rather than adding a filter. D2R took 25 years to ship a native one. For a Tibia-like, where loot sits inside a corpse container, the volume problem is smaller. A native, simple tier filter (hide grey, highlight top) is enough. No custom scripting language.
- Max volume on every alert (NeverSink) works in single player. On a shared screen, positional sounds and an "only my items" rule are needed, or 10 players' alerts become noise.

### Gaps
- FilterBlade internals and NeverSink's written philosophy: not read (forum pages and GitHub README not fetched in budget).
- D2R native filter feature list (sounds? icons?): Icy Veins news page returned 403.

---

## Q6. Labels: Alt to show, stacking, caps, overlap

### Takeaway
Text labels are the weak point everywhere. D2R caps ground labels at 32. PoE labels pile up and can become unclickable, and the label you click can pick up a different item underneath. Last Epoch players report labels overlaying each other. Nobody publishes their layout algorithm.

### Cited findings
- Diablo II: hold Alt to show labels for items on the ground, coloured by quality. https://classic.battle.net/diablo2exp/basics/controls.shtml
- D2R: ground labels are capped at 32, so important drops get "buried or missed entirely". https://us.forums.blizzard.com/en/d2r/t/why-is-it-so-impossible-to-at-least-increase-the-max-item-labels-on-ground/166302
- PoE: with a heavy pile, labels "brick" the pickup location. Clicking a label on top of another item's 3D object can pick up the object instead. Player reports. https://www.pathofexile.com/forum/view-thread/2910607 and https://vpn-erintek.duckdns.org/forum/view-thread/3620632
- PoE: a player thread blames label overlay redraws for hitches and disconnects on maps with many items. Player speculation, not a GGG statement. https://www.pathofexile.com/forum/view-thread/2928157
- Last Epoch: "Item labels on ground overlay each other after item drops" bug thread. https://forum.lastepoch.com/t/item-labels-on-ground-overlay-each-other-after-item-drops/22761 (404 at fetch time, title from search).

### Inferences (mine)
- For a 32 px MMO, always-on labels are wrong. Labels only for the owner, only on hover or on a hold key, and only for items above a tier. The icon on the tile is the primary read. Tibia does this already: items on the ground are sprites, with names only on look.
- If labels exist, cap them per player (D2R's 32) and sort the cap by tier so a cap never hides the best item. D2R's complaint shows the cap without priority is the bug, not the cap itself.
- Label layout: greedy vertical stacking in screen space (sort by tier then distance, place each label at its anchor, push up by label height while it overlaps a placed label) is cheap for under 50 labels. Estimate. Hit testing must use the label rectangle, not the sprite underneath, to avoid PoE's wrong-item pickup.

### Gaps
- No published label layout algorithm from Blizzard, GGG or EHG.
- No measured label render costs.

---

## Q7. Pixel games: reveal without labels

### Takeaway
Pixel roguelites skip labels and filters. They reveal through the container (chest colour, pedestal), through a held moment, or through colour alone. These map better onto a 32 px top-down game than ARPG text labels do.

### Cited findings
- Enter the Gungeon chest colour tells quality before opening: Brown D, Blue C, Green B, Red A, Black S. Rainbow chest 0.0333% chance, gives 8 items from B to S. Mimics have a subtle breathing animation as a tell. Some chests get a fuse and explode if not opened in time. https://enterthegungeon.wiki.gg/wiki/Chests
- Gungeon co-op: when one player is a ghost, every chest in the room turns into a yellow skull chest that revives instead of giving loot. Same page.
- Terraria coins auto-stack when close (since 1.2.0.3) and auto-convert 100 copper to 1 silver. The pickup sound has 5 variants (Coin 0 to Coin 4.wav). Dropped coins stopped emitting light in 1.4.0.1. https://terraria.wiki.gg/wiki/Coins

### Inferences (mine)
- Gungeon's chest colour is the corpse-as-container idea with a tier cue on the outside. For Asterion, a corpse could get a small coloured glint or outline matching the best item inside, visible only to players allowed to loot it. That keeps Tibia's container model and adds ARPG-style reveal without spilling items.
- Five sound variants on a common pickup (Terraria) is a cheap fix for repetition when players spam-loot.
- Terraria removing light from dropped coins hints that per-item lights got expensive or noisy. Inference only, the wiki gives no reason.

### Gaps
- Nuclear Throne, Hammerwatch, Dead Cells, Binding of Isaac, Spelunky: not researched in budget. No numbers.

---

## What transfers to Asterion (32 px, top-down, shared screen)

Inferences, built on the citations above.

1. Keep Tibia's corpse container as the default. Ground spill only for death drops and boss explosions. Use Diablo I's one-item-per-tile ring search for spills.
2. Pop: one flip arc, no bounce, 400 to 650 ms, landing sound at 300 to 480 ms (the D1 and D2 values). Client-only presentation. The server places the item at t=0.
3. Landing sound by item type, plus a short distinct sting for top tiers only. Make one or two high-value item types (runes, gems) audibly unique, like D2's rune sound.
4. Five tiers in the white, green, blue, purple, orange order, plus one animated top tier. Pair colour with icon shape and beam for colour-blind players.
5. Beams only for the top one or two tiers, short-lived for everyone, persistent only for the owner. One additive quad per beam.
6. Corpse glint in the colour of the best item inside, owner only. Gungeon-style reveal on a container.
7. No always-on text labels. Hold key or hover, owner only, capped and sorted by tier. Hit test the label rectangle.
8. A native data-driven tier style table (Godot Resource per tier), copying PoE filter fields: font size, text, border and background colours, sound id, beam colour and lifetime, minimap icon shape and colour. A simple hide/highlight toggle per tier for players. No scripting language.
9. Alerts must be positional and filtered to the local player's own loot. NeverSink's "max volume for top tier" only works when one player owns the screen.
10. Avoid the D3 Vanilla and PoE trap. Control volume at the source (fewer, better drops) instead of shipping a filter to fix clutter.

## Ratings (author judgement, 1 to 5)

| Technique | Clarity | Delight | MMO fit | Fairness | Speed |
|---|---|---|---|---|---|
| Sprite flip arc with mid-arc type sound (D1, D2) | 4 | 4 | 5 | n/a | 5 |
| Tier colour on name or outline (all) | 4 | 3 | 4 | n/a | 5 |
| Persistent beam per top-tier drop (D3, PoE) | 5 | 5 | 2 (noise from others' drops) | 3 | 4 |
| Short drop-only beam (PoE Temp) | 4 | 4 | 4 | 4 | 5 |
| Minimap star or shaped icon (D3, PoE) | 5 | 3 | 3 | 3 | 5 |
| Always-on ground text labels (D2 Alt, PoE) | 3 | 2 | 1 | 3 | 2 |
| Full scriptable filter (PoE) | 5 | 3 | 3 | 4 | 3 |
| Simple native tier filter (Last Epoch, D2R) | 4 | 3 | 4 | 4 | 4 |
| Container colour reveal (Gungeon chests) | 4 | 4 | 5 | 4 | 5 |

---

## Sources
- devilutionX items.cpp: https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp
- devilutionX diablo.cpp: https://github.com/diasurgical/devilutionX/blob/master/Source/diablo.cpp
- d2data JSON tables: https://github.com/blizzhackers/d2data/tree/master/json
- Diablo II FPS: https://diablo2.diablowiki.net/FPS
- Diablo II item colours: https://classic.battle.net/diablo2exp/items/magic.shtml
- Diablo II controls (Alt labels): https://classic.battle.net/diablo2exp/basics/controls.shtml
- PD2 filter palette codes: https://wiki.projectdiablo2.com/wiki/Lootfilter
- D2R unique colour complaint: https://us.forums.blizzard.com/en/d2r/t/unique-item-color-is-hard-to-see-can-it-be-changed/90703
- D2R 32 label cap: https://us.forums.blizzard.com/en/d2r/t/why-is-it-so-impossible-to-at-least-increase-the-max-item-labels-on-ground/166302
- D2R native loot filter: https://www.icy-veins.com/d2/loot-filter , https://www.tweaktown.com/news/110129/diablo-2-gets-loot-filters-stash-tabs-and-built-in-holy-grail-tracker-in-new-25-expansion/index.html
- D2R loot filter mods: https://nexusmods.com/diablo2resurrected/mods/408?tab=posts
- Path of Diablo loot SFX: https://pathofdiablo.com/wiki/Loot_SFX
- Diablo III sound interview: https://www.gamebanshee.com/kuucc
- Diablo III legendary cues: https://di.diablowiki.net/Legendary , https://www.pcgamer.com/uk/diablo-3-1
- BlizzCon 2013 Loot 2.0 transcript: https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript
- Diablo IV loot drops: https://www.gamerguides.com/diablo-iv/guide/equipment/loot-drops
- Diablo IV mythic beam: https://joshtronic.com/2024/06/09/diablo-iv-mythic-uniques/
- Diablo IV Loot Reborn: https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/
- Diablo Immortal rune beam confusion: https://us.forums.blizzard.com/en/diablo-immortal/t/loot-bug-legendary-drop-vanishes-as-soon-as-they-come-able-to-see-orange-glow-for-few-seconds-no-legendary-drops-from-open-world/5811
- PoE filter reference: https://pathofexile.com/item-filter/about
- poedb filter page: https://poedb.tw/cn/Item_Filter
- NeverSink filter: https://github.com/NeverSinkDev/NeverSink-Filter
- NeverSink PoE 2 filter article: https://www.pcgamer.com/games/rpg/psa-the-creator-of-poes-foremost-loot-filter-released-an-experimental-light-filter-for-path-of-exile-2-just-in-time-to-help-sort-all-the-freshly-buffed-loot-drops
- PoE label pile reports: https://www.pathofexile.com/forum/view-thread/2910607 , https://vpn-erintek.duckdns.org/forum/view-thread/3620632 , https://www.pathofexile.com/forum/view-thread/2928157
- PoE 2 rarity: https://www.poe2wiki.net/wiki/Item_rarity
- Last Epoch filter: https://www.gameskinny.com/tips/how-to-use-loot-filters-in-last-epoch/
- Last Epoch label overlap: https://forum.lastepoch.com/t/item-labels-on-ground-overlay-each-other-after-item-drops/22761
- Grim Dawn beams: https://forums.crateentertainment.com/t/loot-beam-anyone-attempt-it/33489 , https://forums.crateentertainment.com/t/fx-pseditor-and-loot-beams/44356
- Borderlands rarity and beams: https://twinfinite.net/guides/borderlands-3-tips-and-tricks-for-beginners/2/ , https://mobalytics.gg/borderlands-4/guides/pearlescent-best-rolls
- Terraria rarity: https://terraria.wiki.gg/wiki/Rarity , https://terraria.wiki.gg/wiki/Template:Rare
- Terraria coins: https://terraria.wiki.gg/wiki/Coins
- Enter the Gungeon chests: https://enterthegungeon.wiki.gg/wiki/Chests

## See it in action
- Diablo III legendary drop (beam, clang, minimap star): https://di.diablowiki.net/Legendary
- PoE filter preview (FilterBlade): https://www.filterblade.xyz/
- NeverSink filter repo with style examples: https://github.com/NeverSinkDev/NeverSink-Filter
- Terraria rarity colour table: https://terraria.wiki.gg/wiki/Rarity
- Enter the Gungeon chest tiers: https://enterthegungeon.wiki.gg/wiki/Chests
- Diablo I item drop code (flip and sound frame): https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp
