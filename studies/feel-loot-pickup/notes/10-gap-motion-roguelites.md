# 10. Gap research: motion numbers, roguelite pickup feel, modern MMO reveal

Researcher 10. Fills gaps left by notes 01-08. Main sources are read-only source code: Shattered Pixel Dungeon (GPLv3), devilutionX (read only, its licence bans commercial use, so numbers only, no code reuse), Flare engine and flare-game data, Mindustry, a decompiled Terraria console port, and the tModLoader patch files. Wikis fill the rest. Every derived number shows its arithmetic so it can be checked.

Unit note. SPD and Terraria use 16 px tiles. Minecraft uses 1 block. Asterion uses 32 px tiles, so I give a "x2" conversion where it helps.

---

## Q1. Item pop arc: height, duration, landing

### Takeaway
Two shipped pixel games put the whole drop arc between 400 ms and 650 ms. SPD rises only 10 px on a 16 px tile (0.625 tile) and has no bounce. Diablo 1 plays a 13-frame flip at 20 Hz and fires the landing sound halfway through. Terraria is the outlier with a physics toss of up to about 2.5 tiles, which suits a side view, not top-down. For a 32 px top-down MMO, 16 to 20 px of apex and 400 to 500 ms total is the cited range.

### Cited findings

Shattered Pixel Dungeon, `sprites/ItemSprite.java` ([source](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java))
- `DROP_INTERVAL = 0.4f`. The arc lasts 400 ms.
- `speed.set(0, -100)` and `acc.set(0, -speed.y / DROP_INTERVAL * 2)`. So the start speed is 100 px/s up and gravity is 500 px/s².
- Derived. Apex at t = 100/500 = 0.2 s. Height = 100 x 0.2 - 0.5 x 500 x 0.2² = 10 px. Tile `SIZE = 16` ([DungeonTilemap.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/tiles/DungeonTilemap.java)), so apex = 0.625 tile. On a 32 px tile that is 20 px.
- `drop(int from)` adds horizontal speed `(px - x) / DROP_INTERVAL`, so an item thrown from a neighbour cell travels linearly across the tile in the same 400 ms.
- The shadow is a separate quad (width 1.0, height 0.25 of the sprite, 60% black). During the arc `shadowOffset -= speed.y * Game.elapsed * 0.8f`, so the shadow stays on the floor while the sprite rises. On landing `shadowOffset = 0.25f`.
- No bounce, no squash. On landing it plays a terrain sound. Volume 0.8, pitch random 1.16 to 1.25 (grass, stone, step) or 1.0 to 1.45 on water, plus a water ripple.
- Gold drop also bursts 5 coin specks and plays the gold sound with pitch 0.9 to 1.1.
- Comment in the code says heaps of more than 1 item can "sail up into the air" if the player keeps tapping. The dev kept it on purpose as "an amusing visual bug/feature".

devilutionX, `Source/items.cpp` ([source](https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp))
- `ItemAnimLs[]` gives flip frame counts per item class. Most are 13. Gold is 10, one class 15, one 16, one 20.
- `setNewAnimation(sprite, numberOfFrames, 1, ...)` means 1 game tick per frame. `gnTickDelay = 50` ms in `diablo.cpp`, so the game runs at 20 Hz.
- Derived. A 13-frame flip is 650 ms. Gold is 500 ms. The longest is 1000 ms.
- `ProcessItems()` plays the drop sound when `currentFrame == (numberOfFrames - 1) / 2`. For 13 frames that is frame 6, about 300 ms in. The sound marks the landing, not the start.
- While flipping, `selectionRegion = SelectionRegion::None`. The item cannot be clicked until the flip ends. After it ends the region becomes `Bottom`.
- Sounds are per class ("ItemArmorFlip", "ItemAxeFlip", "ItemPotionFlip", "ItemGold"). The material is audible before the label is read.

Flare engine and flare-game data
- Every loot flip animation file is `frames=6`, `duration=600ms`, `type=play_once`. Checked `coins25.txt` and `greatsword.txt` in [flare-game animations/loot](https://github.com/flareteam/flare-game/tree/master/mods/fantasycore/animations/loot).
- `engine/loot.txt`: `sfx_loot=soundfx/flying_loot.ogg`, `drop_radius=1` tile, `drop_max=1` ([flare-game loot.txt](https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt)).
- Flare picks the animation by stack size ranges (`loot_animation[i].low/high` in [LootManager.cpp](https://github.com/flareteam/flare-engine/blob/master/src/LootManager.cpp)). So 5, 25 and 100 coins each have their own flip. Bigger piles look bigger.

Terraria, decompiled console port `Item.cs` ([TerrariaOGC](https://github.com/PPrism/TerrariaOGC/blob/HEAD/TerrariaOGC/Terraria/Item.cs)). Version flag: this is the 1.2-era console code, not PC 1.4.
- `NewItem`: `Velocity.X = Rand.Next(-30, 31) * 0.1f` and `Velocity.Y = Rand.Next(-40, -15) * 0.1f`. So vx is -3.0 to +3.0 px/tick and vy is -4.0 to -1.6 px/tick.
- `UpdateItem`: gravity 0.1 px/tick², terminal 7 px/tick (in water 0.08 and 5). Horizontal drag x0.95 per tick, snapped to 0 under 0.1. The position step uses half the velocity (`ItemVelocity *= 0.5f`).
- Derived (continuous approximation, 60 ticks/s). Rise time v/g = 16 to 40 ticks (267 to 667 ms). Apex = 0.5 x v²/(2g) = 6.4 px to 40 px, which is 0.4 to 2.5 tiles of 16 px. Horizontal travel about 0.5 x vx / 0.05 = up to 30 px (1.9 tiles).

Minecraft item entity ([Entity motion table](https://minecraft.wiki/w/Entity), [Item entity](https://minecraft.wiki/w/Item_(entity)))
- Gravity 0.04 blocks/tick², drag 0.98 per tick on both axes, terminal 1.96 blocks/tick.
- Idle bob is a sine with period π s (3.14 s), Y offset 0.0625 to 0.2625 blocks. Spin is 1 rad/s (one turn in 6.28 s). Bob and spin share a random phase, so a pile never moves in lockstep.
- A stack renders 1 to 5 copies: 1 item one model, 2-16 two, 17-32 three, 33-48 four, 49+ five.
- Initial drop velocity is not on either page.

### Inferences
- The cited top-down number is SPD: 0.625 tile up and 400 ms. Diablo's 650 ms is slower but it is isometric with bigger sprites.
- No source in this set uses a bounce. Bounce count, restitution and landing squash remain uncited. If added, keep it under 120 ms so the total stays near 500 ms (estimate).
- Diablo's pickup lock during the flip clashes with the "players spam-click corpses" finding in combat juice. In an MMO the server should accept the pickup at once and the client should cut the arc short.
- SPD's 60% shadow on the floor during the arc is what sells height at 16 px. It is one extra quad per item.
- Minecraft's random phase per item is a cheap way to stop 30 items bobbing in sync. Use a per-item seed from the item id.

### Gaps
- Bounce count, restitution, landing squash, landing dust size: no source found.
- Stagger between items of a big drop: no source found. Diablo drops one item per kill call, and Flare `drop_max=1` per tile.
- Terraria PC 1.4 values not checked against the console port.

---

## Q2. Idle glow pulse, beams, fly-to-bag, icon bump, counters

### Takeaway
SPD's glow is a triangle wave with a 1 s half period (2 s per cycle) and a 60% tint ceiling. Fly-to-bag is 500 ms linear in SPD and 200 ms with cubic easing in Mindustry. No source gave beam height, inventory icon bump or a coin roll-up.

### Cited findings
- SPD `Glowing(color)` defaults to `period = 1f`. `update()` ramps `phase` up for one period and down for one period. The tint is `phase / period * 0.6`, so colour reaches 60% at peak ([ItemSprite.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java)). It is a vertex colour change, not a shader.
- SPD fly-to-toolbar, `Toolbar.PickedUpItem` ([Toolbar.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/ui/Toolbar.java)). `DURATION = 0.5f`. Position is linear from the world cell to the slot. Scale shrinks as `sqrt(p)`, so it shrinks slowly first and fast at the end.
- SPD gold pickup shows floating "+N" text with a gold icon over the hero (`showStatusWithIcon`, [Gold.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/Gold.java)). No HUD counter roll-up.
- SPD coin speck ([Speck.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Speck.java)). Launch 48 to 96 px/s in an upward cone (0.3π to 0.7π), gravity 256 px/s², life = 2vy/g (up to about 0.7 s). Spin is faked by `scale.x = cos(left * 5)`, a flip period of 1.26 s, with brightness tied to the flip. Fades over the last 10% of life.
- SPD `TIME_TO_PICK_UP = 1.0f` game turn ([Item.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/Item.java)).
- Mindustry `Fx.itemTransfer` ([Fx.java](https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java)). Lifetime 12 ticks (200 ms at 60 ticks/s). Path uses `Interp.pow3` (cubic ease in-out). It swings sideways up to 10 px x `fslope()` with a random sign per effect, so parallel transfers fan out. The dot grows to 3 px radius at mid flight and shrinks back.

### Inferences
- SPD's 500 ms linear flight feels slow when many items arrive. Mindustry's 200 ms cubic with a random side curve reads better for bursts. Use 200 to 300 ms with ease in-out and a ±10 px curve (on 32 px tiles, ±16 px).
- A 2 s glow cycle with a 60% colour cap keeps the sprite readable. Godot can do this with `modulate` on a CanvasItem and no shader (estimate, no measurement).

### Gaps
- Beam height and fade: covered only for OSRS in note 01. No pixel-game number found here.
- Inventory icon bump scale and duration, coin counter roll-up speed: not found in any source read.

---

## Q3. Magnet, auto-pickup and pull speed

### Takeaway
Cited ranges run from 1 tile (Flare, Minecraft) to 2.6 tiles (Terraria). Terraria pulls with 0.45 px/tick² up to 4 px/tick (240 px/s). Flare auto-picks only currency, never items the hero dropped, and never mid-flight. That Flare rule set fits an MMO well.

### Cited findings
- Terraria (tModLoader 1.4.4 `Player.cs.patch`, [source](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/Player.cs.patch)): `defaultItemGrabRange = 42` px, `itemGrabSpeed = 0.45f`, `itemGrabSpeedMax = 4f`. The grab box is the player rect grown by 42 px on each side. 42 px is 2.6 tiles of 16 px. Note 08 already gave the 5.25-tile rectangle; this is the source constant behind it.
- Flare `engine/loot.txt`: `autopickup_currency=1`, `autopickup_range=1` tile ([flare-game](https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt)). In `LootManager.cpp` the check is `!it->dropped_by_hero && calcDist < autopickup_range && !it->isFlying()` and only for `currency_id`. Engine default `interact_range = 3` tiles ([EngineSettings.cpp](https://github.com/flareteam/flare-engine/blob/master/src/EngineSettings.cpp)).
- Minecraft: pickup box reaches 1 block horizontally and 0.5 vertically. Pickup delay is 10 ticks (500 ms) for normal drops and 40 ticks (2 s) for thrown items ([Item entity](https://minecraft.wiki/w/Item_(entity))).
- Vampire Survivors: Magnet base value 30, unit not stated. Multipliers stack: PowerUp x1.25 per rank (x1.5625 max), Attractorb x1.5 at L1 to x3.98 at L5. No upper limit ([Magnet](https://vampire.survivors.wiki/w/Magnet), [Attractorb](https://vampire.survivors.wiki/w/Attractorb)).
- Vampire Survivors Vacuum pulls every gem on the map. The wiki notes "it takes time for all gems to reach the player" ([Vacuum](https://vampire.survivors.wiki/w/Vacuum)).
- Enter the Gungeon: money moves to the player "so long as the player is not in combat". Money spilled by Loot Bag on a hit does not move and vanishes after 6 s ([Money](https://enterthegungeon.wiki.gg/wiki/Money)).
- Nuclear Throne: cursed ammo "will never be attracted to the player" ([fan guide](https://idntg.pages.dev/pickups)). Plutonium Hunger widens the pull ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/NuclearThrone)). No radius number found.
- Black Desert pets loot on an interval. Tier 1 about 3.6 to 4.4 s, tier 4 about 2.3 to 2.8 s, by speed setting. Pack Leader cuts 15% ([Black Desert Foundry pets guide](https://www.blackdesertfoundry.com/pets-guide/), [Garmoth](https://garmoth.com/guides/post/bdo-basics-pets)). Community guides, not official.
- Lost Ark: auto loot is the pet's job and filters by item tier ([Screen Rant](https://screenrant.com/how-to-auto-loot-lost-ark-guide/)). No range found.

### Inferences
- Minecraft's 500 ms pickup delay and Diablo's flip lock both exist so the drop is seen before it vanishes into the bag. In an MMO a short owner-only auto-pickup delay of 300 to 500 ms gives the same read (estimate).
- Gungeon's "pull only out of combat" rule matches an MMO with PvP. Coins should not fly across a fight (inference).
- Black Desert's 2 to 4 s interval shows a server-friendly pet loot model. One pickup per pet per interval is a fixed rate the server can budget for.

### Gaps
- Vampire Survivors gem pull speed and the unit of Magnet 30.
- Dead Cells gold radius. One search snippet says gold is lost once the player leaves the room. Not verified.
- Hades obol and Darkness pickup rules, Isaac pickup physics, Hammerwatch gold pickup, Moonlighter, Spelunky: no numbers found in budget.

---

## Q4. Despawn warning blink and item caps

### Takeaway
Nuclear Throne blinks for a fixed 2 s before any pickup vanishes, whatever the loop. Vampire Survivors and Terraria both cap ground drops at 400. VS merges overflow into one red gem. Terraria deletes the oldest.

### Cited findings
- Nuclear Throne lifetimes, total including the 2 s blink ([fan guide](https://idntg.pages.dev/pickups)). Rads 2 + (X x 4)/(4 + loop) with X 5 to 6, so 7 to 8 s before loop. Ammo and HP 2 + (X x 5)/(5 + loop) with X 6.7 to 7.7, so 8.7 to 9.7 s. Crown of Haste divides by 3. The blink is "always 2 seconds regardless of loop".
- Minecraft: 6000 ticks (5 min) despawn. No blink is mentioned ([Item entity](https://minecraft.wiki/w/Item_(entity))). A mod called FadingLoot exists to add one ([CurseForge](https://www.curseforge.com/minecraft/mc-mods/fadingloot)), which suggests vanilla has none (inference).
- Terraria: above 400 dropped items, the oldest may vanish as new ones drop. Items also vanish when you leave the world ([Stack](https://terraria.wiki.gg/wiki/Stack)). No blink found.
- Vampire Survivors: above 400 gems on the ground, new XP goes into one red gem ([Experience Gem](https://vampire.survivors.wiki/w/Experience_Gem)). Gem colour shows value: blue up to 2 XP, green up to 9, red above.
- Minecraft merges same-type items within a small box, checked every 40 ticks ([Item entity](https://minecraft.wiki/w/Item_(entity))).

### Inferences
- A fixed-length blink tells the player "this is the last chance" without a number. For MMO ground items that live minutes, a 10 s blink at the end is a scaled guess, not cited.
- Merging overflow into one bigger pile (VS) is kinder than deleting the oldest (Terraria). It also helps note 06's crowd budget.

### Gaps
- Blink frequency (Hz) for Nuclear Throne not found. Terraria coin despawn "12 minutes" came only from a low-quality guide.

---

## Q5. Modern MMO and extraction reveal

### Takeaway
Few numbers are public. Dark and Darker made looting an enemy corpse slower on purpose so it becomes a combat risk, and kept ally corpses unchanged. Destiny moved exotic engrams from instant reveal to a stored item you decode later.

### Cited findings
- Dark and Darker Hotfix 55 (July 2024) added interaction time to looting an enemy player's corpse. Ally corpses stay "the same as before". No seconds given ([ConsolePCGaming](https://consolepcgaming.com/dark-and-darker-hotfix-55-patch-notes), [ComicBook](https://comicbook.com/gaming/news/dark-and-darker-update-55-patch-notes)). Hotfix 62 fixed the timer wrongly applying to teammate kills.
- Dark and Darker wiki snippets list a 4 s open time for a Small Reinforced Chest and 30 s for a Treasure Hoard. The page now shows empty tables and a work-in-progress notice ([Containers-Ruins](https://darkanddarker.wiki.spellsandguns.com/Containers-Ruins)). Treat as unverified.
- Destiny 2: exotic engrams are yellow. Since Season 21 they "no longer auto-decrypt" and sit in the engram inventory. Focused decoding can target a specific exotic ([Blueberries](https://www.blueberries.gg/weapons/destiny-2-exotic-engrams/), [Destinypedia](https://www.destinypedia.com/Engram)).
- Tibia quick loot works on up to 30 corpses on one tile ([TibiaQA](https://www.tibiaqa.com/21952/how-does-quick-looting-extension-work-when-used?show=21957)).

### Inferences
- A search timer on enemy player corpses (not on monsters) is a "meaningful death" lever. The killer pays seconds of exposure. Monster corpses stay instant so spam-clicking is not punished.

### Gaps
- Margonem and Medivia: searches returned nothing usable. Needs Polish forum sources or a player.
- New World, Lost Ark loot range and pull speed, Destiny engram sound: not found.
- Dark and Darker exact corpse seconds.

---

## What transfers to a 32 px top-down server MMO

Cited ranges first, then a proposed starting point. Every proposed number is an inference to test in the sandbox.

| Parameter | Cited range | Proposed for Asterion |
|---|---|---|
| Pop arc apex | SPD 10 px on 16 px tile (0.625 tile). Terraria 0.4 to 2.5 tiles | 16 to 20 px |
| Arc duration | SPD 400 ms, Flare 600 ms, Diablo 500 to 1000 ms (650 typical) | 400 ms |
| Landing sound | Diablo at mid flip, SPD at landing, pitch random ±5 to 10% | at landing, per material, pitch jitter 0.9 to 1.1 |
| Shadow | SPD 1.0 x 0.25 sprite, 60% black, stays on floor | same |
| Bounce, squash | none in any source | none, or one 4 px hop under 120 ms (untested) |
| Glow pulse | SPD 2 s cycle, 60% tint cap | 2 s cycle, rarity colour, `modulate` only |
| Idle bob, spin | Minecraft bob π s, spin 6.28 s, random phase | no spin at 32 px, bob 1 to 2 px optional with per-item phase |
| Fly to bag | SPD 500 ms linear, Mindustry 200 ms cubic ±10 px | 250 ms ease in-out, ±16 px side curve |
| Auto-pickup | Flare 1 tile, currency only, not own drops, not mid-flight. Minecraft 500 ms delay | gold only, 1 tile, owner only, 300 to 500 ms after landing, never in PvP combat |
| Magnet pull | Terraria 0.45 px/tick² to 240 px/s | accelerate to about 8 tiles/s (scaled, untested) |
| Despawn warning | Nuclear Throne fixed 2 s blink | last 10 s blink (scaled guess) |
| Ground cap | VS and Terraria 400 | merge overflow into one pile per tile |
| Pet loot | BDO one pickup per 2.3 to 4.4 s | if pets exist, fixed interval, server-side |
| Corpse search timer | Dark and Darker longer for enemy players only | 0 s for monsters, a short channel for player corpses (PvP) |

Runtime cost (estimates, none measured here). Each of these effects is one tween or a few floats per item plus one shadow quad. SPD draws the shadow as a second quad on the same texture. Diablo and Flare use pre-drawn flip frames, which cost atlas space but no per-frame maths. None of them use shaders for glow.

---

## See it in action
- SPD item drop and pickup code: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java
- Flare loot flip data: https://github.com/flareteam/flare-game/tree/master/mods/fantasycore/animations/loot
- Minecraft item entity page with bob and spin: https://minecraft.wiki/w/Item_(entity)
- Vampire Survivors Vacuum (animated gif on page): https://vampire.survivors.wiki/w/Vacuum
- Nuclear Throne pickups guide: https://idntg.pages.dev/pickups
- Gungeon money: https://enterthegungeon.wiki.gg/wiki/Money

## Sources
- https://github.com/00-Evan/shattered-pixel-dungeon (ItemSprite.java, Toolbar.java, Speck.java, Item.java, Gold.java, DungeonTilemap.java)
- https://github.com/diasurgical/devilutionX (Source/items.cpp, Source/diablo.cpp). Read only.
- https://github.com/flareteam/flare-engine (src/LootManager.cpp, src/EngineSettings.cpp)
- https://github.com/flareteam/flare-game (mods/fantasycore/engine/loot.txt, animations/loot/*.txt)
- https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java
- https://github.com/PPrism/TerrariaOGC/blob/HEAD/TerrariaOGC/Terraria/Item.cs
- https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/Player.cs.patch
- https://minecraft.wiki/w/Item_(entity)
- https://minecraft.wiki/w/Entity
- https://www.curseforge.com/minecraft/mc-mods/fadingloot
- https://terraria.wiki.gg/wiki/Stack
- https://vampire.survivors.wiki/w/Magnet
- https://vampire.survivors.wiki/w/Attractorb
- https://vampire.survivors.wiki/w/Vacuum
- https://vampire.survivors.wiki/w/Experience_Gem
- https://idntg.pages.dev/pickups
- https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/NuclearThrone
- https://enterthegungeon.wiki.gg/wiki/Money
- https://www.blackdesertfoundry.com/pets-guide/
- https://garmoth.com/guides/post/bdo-basics-pets
- https://screenrant.com/how-to-auto-loot-lost-ark-guide/
- https://consolepcgaming.com/dark-and-darker-hotfix-55-patch-notes
- https://comicbook.com/gaming/news/dark-and-darker-update-55-patch-notes
- https://darkanddarker.wiki.spellsandguns.com/Containers-Ruins
- https://www.blueberries.gg/weapons/destiny-2-exotic-engrams/
- https://www.destinypedia.com/Engram
- https://www.tibiaqa.com/21952/how-does-quick-looting-extension-work-when-used?show=21957
