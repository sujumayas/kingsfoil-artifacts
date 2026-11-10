# 08 Interaction systems and gameplay rules for water

Angle: what happens when things touch water, and the rules behind it, with numbers. Covers wakes, ripples, splashes, wading and swimming states, breath, fishing, boats, bobbing, server rules, and element reactions.

Source quality note. Many fan wikis (tibia.fandom, stardewvalleywiki, bulbapedia, tibiawiki.com.br) returned 402/403 to the fetcher, and web.archive.org is blocked. I went to code instead where I could. Two code sources carry most of the hard numbers here.
- Stardew Valley decompiled source (community fork, 1.5-era): https://github.com/veywrn/StardewValley . This is decompiled code, not official. Numbers are exact for that build and may differ in 1.6.
- The Forgotten Server (TFS), the open-source Tibia server emulator: https://github.com/otland/forgottenserver . TFS copies real Tibia behaviour closely but is not CipSoft code. Treat it as "how Tibia-likes do it", not as Tibia ground truth.

---

## Q1. Ripple rings and wakes behind walkers, swimmers and boats

### Takeaway
For pixel art, a pool of ring sprites spawned on a timer beats a simulated heightfield. Stardew does every water ring in the game (swimming, bobber, debris) with one 8-frame, 64x64 ring animation at 150 ms per frame, spawned every 800 ms while the swimmer is idle. A boat V-wake is just the same idea with rings or foam dots spawned along the hull, and the arms should sit at 19.47 degrees from the path. Keep the Hugo Elias heightfield from study #3 (Rain) for small enclosed puddles or a single "hero" pond.

### Cited findings
- Stardew swimming ring. While swimming and standing still, `swimTimer` counts down from 800 ms. At 400 ms and at 0 ms it spawns a `TemporaryAnimatedSprite` from `TileSheets\animations`, source rect (0,0,64,64), 8 frames, frame time `150 - (|xVel|+|yVel|)*3` ms, alpha 1, alpha fade 0.003 per tick. Then it plays the "slosh" sound. So an idle swimmer emits 2 rings per 800 ms, each ring lasting about 1.2 s. Source: Farmer.cs lines ~7551-7570, https://github.com/veywrn/StardewValley/blob/master/StardewValley/Farmer.cs
- Rings are broadcast to other players with `Game1.multiplayer.broadcastSprites`, so in co-op the ring is a fire-and-forget network event, not synced state. Same file.
- While a swimmer moves, the same timer restarts at 100 ms and heals +1 stamina and +1 health per tick instead of spawning rings. Same file. (Swimming in the Stardew bathhouse is a regen zone.)
- Stardew swimmer bob. `yOffset = cos(t_ms / 2000) * 4`. That is a 4 px amplitude (at the game's 4x zoom, about 1 art pixel) and a period of 2*pi*2 s, about 12.6 s. Same file.
- Kelvin wake. For a slow source each wake arm sits at about arcsin(1/3) = 19.47 degrees from the path, independent of speed. https://en.wikipedia.org/wiki/Kelvin_wake_pattern . Physics World reports that above a hull-length-limited speed the visible angle narrows with speed. https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/
- The two-buffer (Hugo Elias) ripple, ring decals and puddle reflections are already covered in study #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
- A Godot forum user tried a particle trail rendered to a plane and could not get the wake to persist as the ship moved, the classic problem with a camera-local render target. https://forum.godotengine.org/t/rendering-gpuparticles2d-onto-a-3d-plane/81460

### Inferences (mine, not cited)
- Ring decal pool vs coarse heightfield at lake scale. The sandbox is 320x180. A heightfield at 1 cell per 4 px is 80x45 = 3,600 cells, which is about 7,200 reads per step on the CPU and cheap in GDScript. A heightfield gives true interference, but it needs a world-anchored buffer that scrolls with the camera (the persistence problem above) and it shows up as smooth gradients that fight a limited palette. Ring sprites need no buffer, live in world space, and survive camera moves. Use a fixed pool of 32-64 rings and recycle the oldest. For an MMO view of 15x11 tiles (Tibia size) with 20 swimmers, that is at most about 50 live rings.
- V-wake recipe for a top-down boat. Every N px travelled (N about 6-8 px at 320x180), spawn two foam dots or tiny ring sprites behind the stern, offset sideways by distance_behind * tan(19.47 deg), about 0.35 px per px behind. Let each dot expand and fade over 0.8-1.2 s. Spawning by distance, not time, keeps the arm spacing constant at any speed, which matches the Kelvin "same shape at any speed" rule.
- Walker in shallow water. One ring per footstep frame (2 per walk cycle) reads well. In Tibia terms a step is a whole tile, so 1 ring per tile step at the destination tile, plus a 2-3 frame splash puff.
- Spawn rule for rings at 0.75 alpha and 1.2 s life (Stardew values) gives the rings a soft, calm feel. Shorter (0.6 s) reads as rain or splashing.

### Gaps
- No primary devlog found that documents a shipped top-down boat wake (decal or trail texture) with numbers.
- Zelda Wind Waker wake details not researched (out of scope per brief).

---

## Q2. Splashes when things fall in, and what happens to the item

### Takeaway
Splashes are short. Stardew uses 2-4 frames at 100-300 ms per frame. Both Stardew and Tibia delete items thrown into water instead of floating them. Floating debris is a choice you add for mood, not a default.

### Cited findings
- Stardew `sinkDebris`. Debris chunks landing in water play "quickSlosh" and spawn the ring sheet for only 3 frames at 150 ms (450 ms). Other items spawn sprite row 28, 2 frames at 300 ms, 1 loop, and play "dropItemInWater". Then the debris is removed. GameLocation.cs line ~10270, https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
- Stardew pool entry. Jumping into the bathhouse pool sets swimming on, moves the player 16 px down, sets yVelocity -8, plays "pullItemFromWater", and spawns sprite row 27, 4 frames at 100 ms, with downward motion 2 px per tick. Movement is locked for 500 ms (`noMovementPause = 500`). GameLocation.cs line ~2469.
- Tibia/TFS. Every water and swamp ground item is `type="trashholder"` with `effect="bluebubble"` (swamp uses `greenbubble`, lava uses `fire`). An item thrown on it is destroyed and a bubble effect plays. items.xml ids 493, 4608-4666, 4691-4755, https://github.com/otland/forgottenserver/blob/master/data/items/items.xml

### Inferences
- For Asterion, trashholder water is the right server default. It is one flag on the tile, no item physics, no sync cost. Make floating items a visual-only client effect for specific props (logs, barrels, bottles) if wanted.

### Gaps
- No frame counts found for Zelda or Pokémon splashes.

---

## Q3. Wading and swimming states and speed multipliers

### Takeaway
Two patterns dominate. Tile games with a 2D grid treat deep water as a wall and shallow water as a slower floor (Tibia, RimWorld). Action games add a swim state with its own sprite, often with a perk (healing in Stardew, fire/poison removal in Tibia). Tibia's "swim" is just an outfit swap triggered on step-in, which is the cheapest swim state possible.

### Cited findings
- Tibia step time. StepTime = roundup(TerrainFactor / Speed * DiagonalFactor, 0.05 s). Terrain factors range 70 (sandstone) to 200 (snow). Grass 150, sand 160, mud 120-200. Diagonal steps cost 3x. Shortest step 0.05 s. https://tibiantis-notes.github.io/speed (this is a 7.4-era fan server reference)
- Tibia shallow water, bog water and muddy water have ground speed 200 per the fan wiki tile table, about 1.33x slower than grass. https://tibia.fandom.com/wiki/Tiles (fetched only via search snippet, page returned 402). TibiaQA gives the formula as speed relative to the tile value: https://www.tibiaqa.com/1043
- Tibia/TFS swimming. Ground ids 4620-4625 and 4820-4825 are "shallow water (Swimmable)". StepIn runs `swimming.lua`, which applies an infinite outfit condition `lookType = 267` (swimmer sprite) and removes poison, fire, energy, paralyze, drunk, drown, freezing, dazzled, cursed and bleeding conditions. StepOut removes the outfit. https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml and https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/swimming.lua
- RimWorld (wiki table). Shallow water, shallow moving water, shallow ocean and marsh have path cost 30. Chest-deep moving water has path cost 42. Mud 14. Deep water and deep ocean are 300, impassable. Water triples item deterioration. Shallow types make pawns "Soaking wet". Undrafted pawns perceive water as cost 180, drafted as 18. https://rimworldwiki.com/wiki/Terrain
- Minecraft. A current pushes entities at about 1.39 m/s. Depth Strider adds one third water movement efficiency. Mining underwater is 5x slower, 25x when not on the ground. https://minecraft.wiki/w/Water
- Pokémon Surf speed equals walking in Gen I-II and Diamond/Pearl, and equals running in Gen III and Platinum onward. https://bulbapedia.bulbagarden.net/wiki/Surf_(move) (fetched via search snippet, page returned 403)
- Stardew. Wearing bathing clothes forces walking (speed 2) instead of running (speed 5), so movement in the bathhouse is 0.4x of a run. Farmer.cs line ~8785. Swimming state in water heals +1 HP and +1 stamina per 100 ms while moving, see Q1.
- Terraria. Feet in water slows movement "noticeably". No number on the wiki. https://terraria.wiki.gg/wiki/Water
- Zelda Minish Cap. With Flippers, Link swims faster holding A and dives with B. Shallow water keeps weapons usable, bombs fizzle in deeper water. https://zeldawiki.wiki/wiki/Swimming and https://zeldawiki.wiki/wiki/Water_(Terrain)

### Inferences
- Suggested Asterion tile flags. WATER_SHALLOW (walkable, ground speed about 200 vs grass 150, wading sprite clip, ring per step), WATER_SWIM (walkable, outfit swap, no weapons), WATER_DEEP (blocks, boats only), WATER_UNDER (drown condition unless helmet). All server-side checks are a flag lookup on the destination tile during the normal walk validation.
- Wading look (client only). Clip the sprite at the waterline, about 8-10 px up a 32 px character, and draw a 1-2 px lighter line plus a ring at the feet. No server cost.

### Gaps
- Exact Gen III frames per tile (I believe 16 walking, 8 running at 60 fps) is not verified.
- Don't Starve has no swimming. DST drowning and boat details only partly covered below. Ultima Online swimming not confirmed by a source (I believe it has none, water blocks).
- Terraria water slowdown number not found.

---

## Q4. Drowning and breath meters

### Takeaway
Two models. A breath pool that drains then damages (Terraria 23.3 s, Minecraft 15 s) suits action games. A flat periodic damage condition tied to the tile (Tibia, 20 HP every 2 s) suits a server tick model and needs no meter UI.

### Cited findings
- Tibia/TFS drowning. Underwater tile ids (5405-5410, 5427-5438, 5743-5744, 5763-5764, 9671-9673) apply CONDITION_DROWN on StepIn with periodic damage -20 every 2000 ms, infinite duration, removed on StepOut. https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/drowning.lua
- Tibia live game. Helmet of the Deep is needed to walk underwater in Calassa and the Frozen Trench, rented from Captain Max. https://tibia.fandom.com/wiki/Calassa (snippet). A TibiaQA user reports 5 x 20 drowning damage after about 4 s standing, unverified. https://www.tibiaqa.com/10030/what-happen-if-i-go-underwater-without-helmet-of-the-deep
- Terraria. Breath starts at 200. While submerged a counter ticks each frame. Breath drops 1 per limit. Base duration is 23.33 s, which matches 200 x 7 ticks at 60 fps. Breathing Reed halves drowning HP loss. https://terraria.wiki.gg/wiki/Breath_meter and https://terraria.wiki.gg/Breathing_Reed
- Minecraft. 15 s of breath (about 300 ticks). Then 2 HP per second. Each Respiration level adds 15 s. https://minecraft.wiki/w/Water

### Inferences
- For Asterion, copy the TFS tile condition. It already fits the server's condition system and survives lag because damage ticks on the server.

---

## Q5. Fishing with numbers

### Takeaway
Fishing is a timer plus a roll. Tibia is pure server roll (one try per click, 10-50% chance, tile goes empty for 20 min). Stardew is a client timer with a nibble window and visible bobber bobs. Animal Crossing's 0-4 fake nibbles before the real bite is the best tension trick and costs only a counter.

### Cited findings
- Tibia/TFS fishing.lua. Valid targets are water ids 493, 4608-4625, 7236, 10499, 15401, 15402. Ids 493 and 15402 give nothing. Other tiles give 1 skill try per use before the roll. Chance % = 10 + (fishing - 10) * 0.597, clamped to 10..50, rolled on d100. A success consumes 1 worm (id 3976), no worms means no catch. Desert water adds a 3% bonus roll. https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua
- The chance cap is reached around skill 77 by that formula (10 + 67*0.597 = 50). Fan research (Gorak 2011) fits normal fishing as min(10 + 0.6*L', 50)%, ice fishing min(5 + L'/2, 50)%, mechanical fish min(4 + L'/18, 8.33)%. L' = skill - 10. https://www.tibiaqa.com/34346/how-does-the-fishing-skill-work
- Tibia/TFS fish depletion. "Shallow water" ids 4608-4616 say "You see the silvery movement of fish". Ids 4617-4619 decay back to 4608-4610 after duration 1200 (TFS durations are in seconds, so 20 min). items.xml, https://github.com/otland/forgottenserver/blob/master/data/items/items.xml . A 7.70 file analysis says a caught tile turns into an id that gives no fish and no skill try but still splashes. https://www.tibiaqa.com/34346/how-does-the-fishing-skill-work
- Stardew bite time (FishingRod.cs line 609). `random(600, 30000 - 250*FishingLevel - spinner)` ms. Spinner -5000, Dressed Spinner -10000. First cast x0.75. Any bait x0.5, Wild Bait a further x0.75. Floor 500 ms. Fish pond with fish returns a fixed time. https://github.com/veywrn/StardewValley/blob/master/StardewValley/Tools/FishingRod.cs
- Stardew nibble window. `maxTimeToNibble = 800` ms. Miss it and a new bite time is rolled. Bite plays a chime and rumble 0.75 for 250 ms. Same file.
- Stardew bubble spots divide the remaining bite time by 2, or 4 during a frenzy. https://forums.stardewvalley.net/threads/difference-in-fishing-bubble-region-check-between-catch-rate-and-depth.47463/latest
- Stardew bobber idle. Bobber bobs every 1500-3500 ms (then 350-750 ms for the return bob). Each idle bob spawns the 8-frame ring at 150 ms, alpha 0.75. While nibbling, bobs every 25-75 ms with ±5 px jitter and ±0.2 scale jitter. An extra `0.1 * sin(t/250)` px drift per tick runs underneath. Clear water distance (tiles to land) feeds fish quality and choice. FishingRod.cs lines ~435, 1100-1120, 1828.
- Animal Crossing New Horizons. Fan guides agree a fish nibbles up to 4 times and the 5th approach is always a bite. Reeling on a nibble scares the fish. https://nintendowire.com/guides/animal-crossing-new-horizons/fishing/ and https://game8.co/games/Animal-Crossing-New-Horizons/archives/284505 . Not confirmed by Nintendo.
- OSRS (Sailing, released 19 November 2025). Deep sea trawling uses a net over a moving shoal, gather rate cut from 4 to 3 ticks on 20 May 2026, baited shoals +20% catch. https://oldschool.runescape.wiki/w/Sailing

### Inferences
- Asterion fishing as a server action. Click water tile, server checks range and tile flag FISHABLE, rolls TFS formula, swaps tile to a FISHED variant with a 20 min decay. The client shows the bobber, rings and a splash on result. The bobber and nibble tension (AC 0-4 fake dips, Stardew 800 ms window) can be client theatre over a server roll that was already decided, if latency matters. If reaction skill should matter, the server must own the window and allow about 150-250 ms extra for round trip.

---

## Q6. Boats and rafts

### Takeaway
Tibia uses teleport travel. Pay a captain NPC, appear at the destination dock. No boats on the sea, no sync. UO and OSRS Sailing have real player boats, which is a large multiplayer cost. For Asterion, NPC travel first, a visual-only ship at the dock for mood.

### Cited findings
- Tibia captains. Venore's Captain Fearless has 15 destinations, Thais' Captain Bluebear 11, Carlin's Captain Greyhound 7. https://www.tibiaqa.com/12291/what-boat-npc-takes-you-to-the-most-cities and https://www.tibiaqa.com/12294/what-boat-npc-takes-you-to-the-least-amount-of-cities . Fare list not verified (fan wikis blocked).
- Ultima Online. Boats are steered by commands to a tillerman. "Forward slow" is half speed. Superb Sails add a temporary boost. https://uo.com/wiki/ultima-online-wiki/gameplay/ships-guide/
- OSRS Sailing. Raft 1x3 tiles (level 1, 1,000 gp), Skiff 2x5 (level 15, 15,000 gp), Sloop 3x10 (level 50, 200,000 gp). Wind gusts trimmed within 12 s give a speed boost. Capsizing returns the player to the last gangplank and keeps inventory. Hazard seas (rapids, fetid water, kelp, icy seas) need boat upgrades. https://oldschool.runescape.wiki/w/Sailing . Sea depth splits into shallow, open and deep, and boat size limits which a vessel can enter. https://gamer-guides.com/osrs/beginners-guide-to-sailing/
- Don't Starve Together. Boat leaks drain the boat meter by 0.5/s (small) or 1/s (large) until patched. Standing on a leak raises wetness even at 100% protection. https://dontstarve.fandom.com/wiki/Boat
- A Godot 4 add-on in development uses an authored bathymetry depth map read by both renderer and gameplay, so boats run aground where the visuals show shallows. https://forum.godotengine.org/t/top-down-water-2d-for-godot-seafloor-depth-you-can-see-and-boats-that-run-aground/144236

### Inferences
- If player boats come later, model a boat as a multi-tile creature moving on the server tick, with tile flag WATER_DEEP as its floor. Depth-limited boats (OSRS) map cleanly to the shallow/deep flags.
- The bathymetry idea is worth copying. One depth value per tile drives colour bands (#3 lakes topic), walkability and boat draft.

---

## Q7. Floating, drifting and bobbing

### Takeaway
Bobbing is a sine on Y with 1 art pixel of amplitude. Stardew's swimmer uses a very slow period (about 12.6 s). Snap to whole pixels so bobs read as 1 px steps.

### Cited findings
- Stardew swimmer `cos(t/2000)*4` (1 art px, about 12.6 s period). Bobber drift `0.1*sin(t/250)` per tick (about 1.6 s period). Farmer.cs and FishingRod.cs, see Q1 and Q5.
- Terraria slimes float on the water surface. https://terraria.wiki.gg/wiki/Water
- Minecraft items and experience orbs float (since 18w07a and 18w19a). Currents push entities at about 1.39 m/s. https://minecraft.wiki/w/Water

### Inferences
- Suggested values at 320x180. Amplitude 1 px. Period 1.5-2.5 s for small floating items, 3-4 s for logs and boats, desync by giving each object a random phase. Drift with the tile's flow vector (see the rivers notes) at 4-8 px/s. Rotate nothing, pixel art reads better with a vertical bob only.

### Gaps
- No shipped top-down pixel game found that documents float amplitude and period beyond Stardew.

---

## Q8. Creatures surfacing and diving

### Takeaway
No hard numbers found. The cheap pattern is a three-state loop (submerged shadow, surfaced sprite, dive splash) with a ring at each transition.

### Cited findings
- Minish Cap Link dives with B in deep water. https://zeldawiki.wiki/wiki/Swimming
- Stardew bubble spots on fishable water are fish signals that speed bites, see Q5.

### Inferences
- Surfacing loop. Shadow sprite drifts 2-4 s, then one ring plus 3-frame splash, then surfaced sprite 1-3 s, then dive with a 2-frame splash and a ring. Server sends only the state change event, the client plays the rest.

### Gaps
- Tibia water elemental and quara surfacing animations not researched. No frame counts found for any game.

---

## Q9. Server-authoritative water for an MMO

### Takeaway
Water should be data on the tile, and everything the server cares about is a flag lookup. Animation, rings, wakes and bobbing are client-only and never synced. Tibia/TFS proves this works for a large MMO.

### Cited findings
- TFS keeps water as ground items with attributes. `trashholder` destroys thrown items, `effect` picks the bubble effect, `fluidSource="water"` lets players fill containers, `allowpickupable`, `decayTo` + `duration` for fished tiles. https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- State changes are movement events (StepIn/StepOut) bound to ground id ranges. Swimming and drowning are both implemented this way. https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
- Tile walk speed is a ground attribute read in the step time formula. https://tibiantis-notes.github.io/speed
- Stardew multiplayer broadcasts ring sprites as one-shot events (`broadcastSprites`). Farmer.cs.

### Inferences
- Moving water. Do not sync animation frames. Derive them on each client from a shared clock (server time sent at login) so all players see the same frame, which matters for tides or a visible current. Currents that push players must be server-side moves, about one forced step per N ticks on a FLOW tile, same as a conveyor.
- Tides, if used, are a server-wide integer level that flips a set of tiles between WATER_SHALLOW and SAND on a schedule. Broadcast the level, not the tiles.

---

## Q10. Water and other elements

### Takeaway
DOS2 is the reference rule table. Water + fire makes steam, water + ice makes ice, water + shock makes electrified water that stuns. Minecraft and Terraria add water + lava makes rock. In a tile game each of these is a tile swap plus an optional cloud tile with a timer.

### Cited findings
- DOS2. Ice on a water surface makes a Frozen surface. Fire on water makes a Steam Cloud. Shock on a steam cloud makes an electrified steam cloud that deals air damage and applies Shocked then Stunned. https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 and https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 . Cursed electrified water stuns on contact unless the target has magic armour. https://dos2.wiki/wiki/Stunned_(Status)
- Oil can be ignited, frozen or shocked by other elements per a DOS2 guide. https://www.gamepressure.com/originalsinii/the-basic-effects-in-the-game/zda273 . Players report shock on plain water sometimes does nothing, so the rule set is not fully consistent. https://steamcommunity.com/app/435150/discussions/0/1630790506929643660
- Minecraft. Water source + lava source makes obsidian. Flowing water + flowing lava makes cobblestone. Lava flowing onto water makes stone. Water sources under open sky in snowy biomes may freeze, ice melts back near bright light. Water spreads 7 blocks at one block per 5 ticks. https://minecraft.wiki/w/Water
- Terraria. Water + lava makes obsidian, water + honey makes honey block. https://terraria.wiki.gg/wiki/Water
- RimWorld. All water terrain extinguishes fire. https://rimworldwiki.com/wiki/Terrain
- TFS swim tiles remove fire, poison, energy and freezing conditions on step-in. swimming.lua, see Q3.
- Steam where water meets fire and lava is covered in study #6: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel

### Inferences
- Asterion rule table, all server tile swaps. Ice spell on WATER_SHALLOW makes ICE (walkable, ground speed 110 like Tibia ice, decays back after a timer). Fire on water makes a STEAM field tile (visual from study #6, blocks sight, no damage or light damage). Energy on water makes an ELECTRIFIED field over the water tiles in a flood fill limited to 3-5 tiles, ticks energy damage. Oil field on water spreads with the flow vector and burns on fire contact. Each is one field item with a duration, the same as Tibia's fire/energy/poison fields.

### Gaps
- No official DOS2 duration or radius numbers collected (fextralife pages 404).

---

## Sources
- Stardew decompiled FishingRod.cs: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Tools/FishingRod.cs
- Stardew decompiled Farmer.cs: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Farmer.cs
- Stardew decompiled GameLocation.cs: https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
- Stardew bubble spot code: https://forums.stardewvalley.net/threads/difference-in-fishing-bubble-region-check-between-catch-rate-and-depth.47463/latest
- TFS fishing.lua: https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua
- TFS items.xml: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- TFS movements.xml: https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
- TFS swimming.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/swimming.lua
- TFS drowning.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/drowning.lua
- Tibia fishing formulas: https://www.tibiaqa.com/34346/how-does-the-fishing-skill-work
- Tibia speed: https://tibiantis-notes.github.io/speed , https://www.tibiaqa.com/1043 , https://tibia.fandom.com/wiki/Tiles
- Tibia underwater: https://tibia.fandom.com/wiki/Calassa , https://www.tibiaqa.com/10030/what-happen-if-i-go-underwater-without-helmet-of-the-deep
- Tibia boats: https://www.tibiaqa.com/12291/what-boat-npc-takes-you-to-the-most-cities , https://www.tibiaqa.com/12294/what-boat-npc-takes-you-to-the-least-amount-of-cities
- RimWorld terrain: https://rimworldwiki.com/wiki/Terrain
- Terraria: https://terraria.wiki.gg/wiki/Water , https://terraria.wiki.gg/wiki/Breath_meter , https://terraria.wiki.gg/Breathing_Reed
- Minecraft: https://minecraft.wiki/w/Water
- Pokémon Surf: https://bulbapedia.bulbagarden.net/wiki/Surf_(move)
- Zelda: https://zeldawiki.wiki/wiki/Swimming , https://zeldawiki.wiki/wiki/Water_(Terrain)
- Animal Crossing: https://nintendowire.com/guides/animal-crossing-new-horizons/fishing/ , https://game8.co/games/Animal-Crossing-New-Horizons/archives/284505
- OSRS Sailing: https://oldschool.runescape.wiki/w/Sailing , https://gamer-guides.com/osrs/beginners-guide-to-sailing/
- Ultima Online ships: https://uo.com/wiki/ultima-online-wiki/gameplay/ships-guide/
- Don't Starve boat: https://dontstarve.fandom.com/wiki/Boat
- Kelvin wake: https://en.wikipedia.org/wiki/Kelvin_wake_pattern , https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/
- Godot wake persistence thread: https://forum.godotengine.org/t/rendering-gpuparticles2d-onto-a-3d-plane/81460
- Godot top-down water with bathymetry: https://forum.godotengine.org/t/top-down-water-2d-for-godot-seafloor-depth-you-can-see-and-boats-that-run-aground/144236
- DOS2: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 , https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 , https://www.gamepressure.com/originalsinii/the-basic-effects-in-the-game/zda273 , https://dos2.wiki/wiki/Stunned_(Status) , https://steamcommunity.com/app/435150/discussions/0/1630790506929643660
- Prior studies: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel , https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
