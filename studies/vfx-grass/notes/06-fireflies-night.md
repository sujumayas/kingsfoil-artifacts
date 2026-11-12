# 06 Fireflies and glowing night life

Researcher 06, VFX #9 (grass, wind and small life). Angle: fireflies, synchronous flashing, cheap glow in pixel art, other night life.

Related studies:
- Light (#5) covers the Tibia light model, the low-res light map and glow. This note reuses it and does not repeat it: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- Acid (#2) covers glow by block-sum blur plus palette select: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
- Fog (#8) covers the world-locked dither and the wind field that can push drifting fireflies: https://kingsfoil-artifacts.netlify.app/vfx-fog-topdown-pixel
- Moths at lamps and other flying insects belong to researcher 05 (file `05-*.md` in this folder, not yet written when this note was saved).

---

## Q1. Biology: what does a real firefly flash look like in numbers?

### Takeaway
Two species give two very different presets. Photinus pyralis is slow and solo: one long flash (roughly 0.3 to 0.75 s) every 5 to 7 s, flown at waist height in open fields, about one hour after dusk. Photinus carolinus is fast and social: bursts of 5 to 8 short flashes (100 to 150 ms each, about 0.5 s apart), then 8 to 10 s of darkness, the whole area in step, in a layer about 1 m above ground, for about 3 hours after full dark. Both run faster when warm.

### Cited findings
Photinus pyralis (common eastern firefly, "big dipper"):
- Male flies upward while flashing, "often in a J shape". Starts about 8:30 pm, usually done by 9:30 pm, open areas. https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
- Flash interval 5.9 ± 0.6 s (Lloyd 1966, as cited by a modelling page). The same page uses a 0.5 s pulse with steep rise and slower fall, which is a model input, not a measurement. https://kjordahl.codeberg.page/ffbehavior.html
- Other sources give "about ¾ of a second" flashes repeated every 5 to 6 s (secondary source, found via search snippet); one paper on the sibling P. concisus measured flashes of 0.3 to 0.4 s at 74 °F and calls the two species' flash lengths similar. https://archive.org/download/biostor-9033/biostor-9033.pdf
- Female answers after a 1 to 2 s delay; males flash every 5 to 7 s. https://thebiofiles.com/info/4177
- Temperature: a Texas field guide lists about one flash every 4 s at 87 °F. https://firefly.org/field-guides/texas-fireflies
- Long, yellow, J-shaped flashes "at waist height" through open areas. https://www.lsuagcenter.com/profiles/bneely/articles/page1587050468972

Photinus carolinus (synchronous firefly, Great Smoky Mountains):
- NPS: "5-8 flashes" in unison, then 8 to 10 s of darkness. Starts about 9:30 pm, runs until about midnight. https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
- NPS synchronous page: five to eight flashes then an eight-second pause. https://www.nps.gov/grsm/learn/nature/fireflies.htm
- Sarfati, Hayes, Peleg 2021 (Science Advances, 3D stereo tracking in the park): flashes of 100 to 150 ms, repeated up to eight times, every ~0.5 s (text says 0.55 s); bursts repeat every ~12 s; fireflies sit in "a thin layer about 1 m above ground"; activity about 3 hours per night for about 2 weeks in early summer; median distance between flashes 3 to 10 m; bursts spread across the swarm at about 0.5 m/s (fits of 0.48, 0.58, 0.49 m/s on 11 to 13 June). https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
- Sarfati, Hayes, Sarfati, Peleg 2020 (J. R. Soc. Interface): small groups synchronise, but periodic bursts appear only in groups above 15 males; flash timing correlates over several metres; early flashers move more and flash longer than followers. https://pmc.ncbi.nlm.nih.gov/articles/PMC7536049
- Older field description: 4 to 8 flashes at 0.5 s intervals, then 6 to 9 s dark, "both time intervals being temperature dependent". https://bioone.org/journals/florida-entomologist/volume-93/issue-2/024.093.0210/Natural-History-and-Flash-Repertoire-of-the-Synchronous-Firefly-Photinus/10.1653/024.093.0210.full
- Moiseff and Copeland (2010): females shown out-of-sync LED groups responded 10 percent of the time or less, which suggests synchrony helps females pick the species signal out of clutter. https://www.scientificamerican.com/blog/observations/firefly-mating-could-reveal-clues-about-how-the-brain-is-wired/ and https://today.uconn.edu/?p=39950
- A later review cites Faust (2010) and Moiseff and Copeland (2010) for a temperature-dependent burst period "generally around 12 s". https://pmc.ncbi.nlm.nih.gov/articles/PMC12629593

Other species worth a preset:
- Photinus macdermotti: double flash 1.5 to 2 s apart, then 4 to 5 s pause. Phausis reticulata ("blue ghost"): steady blue-green glow, no flashing, 30 to 40 s displays. Photinus brimleyi: single flashes 10 s or more apart. Photuris: white single flashes, mimics Photinus females to eat males. https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
- Photuris frontalis ("snappies", Congaree): continuous synchrony with period between 0.5 and 1 s, falling as temperature rises; swarms show "chimera states" where synced and unsynced groups coexist. Sarfati et al. 2022. https://www.biorxiv.org/content/10.1101/2022.05.12.491720v1.full.pdf and https://phys.org/news/2022-11-synchrony-chaos-firefly-swarm-embody.pdf
- Pteroptyx malaccae (Southeast Asian tree swarms): period about 560 ± 6 ms at 28 °C (Buck 1988, Q. Rev. Biol. 63:265-289). https://www.journals.uchicago.edu/doi/10.1086/394562

Density:
- No per square metre density found. Field surveys count flashes per minute instead (three 1-minute counts at sunset, +1 h, +2 h in a meadow with P. pyralis and Photuris versicolor). https://springerlink.bibliotecabuap.elogim.com/10.1007/s00442-016-3723-1
- Grazed farmland can hold some of the highest densities (Firefly Watch, 24,000+ surveys). https://www.sciencedaily.com/releases/2024/04/240429201930.htm

### Inferences
- Duty cycle sets how many dots are lit at any moment. P. pyralis at 0.5 s on per 5.9 s is about 8 % lit. P. carolinus inside a burst is about 22 % lit (0.12 s per 0.55 s), then 0 % for 8 to 10 s.
- In game frames at 60 fps, a P. carolinus flash is 6 to 9 frames and a P. pyralis flash is 18 to 45 frames. At a 12 fps sprite animation, a carolinus flash is 1 to 2 frames.
- At 32 px per tile and treating a tile as roughly 1 m, the measured 0.5 m/s burst wave is about 16 px/s across the field. That is slow enough for players to see a wave roll across a meadow.
- The ">15 males" threshold is a nice game rule: let sync emerge only where enough flies are in range, so sparse edges stay random and the dense core pulses.

### Gaps
- No primary measurement of P. pyralis flash duration in ms was opened (Lloyd 1966 not accessible). Treat 0.3 to 0.75 s as a range from secondary sources.
- No formula for period vs temperature found for these species.
- No per area density for a meadow.

---

## Q2. Synchronisation models and what they cost

### Takeaway
Use a pulse-coupled "integrate and fire" clock, the Mirollo-Strogatz idea, in the exact form Nicky Case ships. Each fly has a phase 0..1 that rises at a fixed rate. At 1 it flashes and resets. When a neighbour flashes, bump your own phase forward by a small amount proportional to your phase. Neighbour search is O(n) per flash, so O(n²/period) per second. At game counts (20 to 300) that is nothing. Add a coarse grid only past a few hundred flies.

### Cited findings
- Nicky Case "Fireflies" source (`js/index.js`, gh-pages branch), exact defaults (https://github.com/ncase/fireflies and https://ncase.me/fireflies/):
  - `NUM_FIREFLIES` = 150 per 1280x600 screen, minimum 100.
  - `FLY_CLOCK_SPEED = 0.3` cycles per second, so the period is 3.33 s. Clock starts random 0..1.
  - `FLY_RADIUS = 200` px neighbour radius.
  - `FLY_PULL = 0.035`. On a flash, each neighbour gets `ff.clock += ff.clock * FLY_PULL`, clamped to 1. The phase-proportional nudge is commented "to prevent double-pulling".
  - Flash alpha is set to 1 and multiplied by 0.9 every frame, a fast attack and exponential decay.
  - Fly motion is constant speed 0.5 to 1.5 px/frame on a heading that turns by a small "swerve" (±0.05 rad/frame), re-rolled with 5 % chance per frame; screen wraps.
  - Mouse "chaos" adds up to 0.15 random phase to flies within 200 px, which breaks sync locally so the player can watch it heal.
  - The check is a full O(n) loop over all flies for every flash.
- Mirollo and Strogatz 1990 (SIAM J. Appl. Math.): pulse-coupled oscillators whose state rises along a concave-down curve to threshold, fire, and kick others by ε; with all-to-all coupling they synchronise for almost all starting conditions. https://www.iasi.cnr.it/~vbonifaci/semcn/Mirollo1990.pdf
- Later work argues synchrony also occurs for linear and some concave-up rise functions, so the exact curve matters less than the paper suggests. https://arxiv.org/pdf/cond-mat/9503079
- Ermentrout 1991 (J. Math. Biol. 29:571-585): adds adaptation of each fly's free-running period, which gives perfect synchrony with zero phase lag, matching Pteroptyx malaccae. Some species can only advance their phase, never delay it. https://dx.doi.org/10.1007%2FBF00164052
- Kuramoto-style models couple continuous phases through sin(θj − θi); the 2022 Photuris frontalis work describes chimera states, which are a known Kuramoto-family behaviour. https://phys.org/news/2022-11-synchrony-chaos-firefly-swarm-embody.pdf

### Inferences (cost)
- Distance checks per second = flashes per second × n = (n / period) × n. Nicky Case defaults with 150 flies and a 3.33 s period: 45 flashes/s × 150 = 6,750 checks/s. Estimate, under 0.1 ms per frame in GDScript at 60 fps.
- 1,000 flies at the same period: 300 flashes/s × 1,000 = 300,000 checks/s, about 5,000 per frame. Still likely under 1 ms in GDScript (estimate, not measured). A uniform grid with cell size = radius drops this to about 9 cells of neighbours per flash.
- Kuramoto with all-pairs sin() every frame costs n² per frame, not per flash. For 150 flies that is 22,500 sin() calls per frame. Pulse coupling is far cheaper because it only does work when someone flashes.
- Scaling to the sandbox: 150 per 1280x600 is about 11 flies on 320x180. A 200 px radius on a 1280 px screen is about 50 px at 320 width, roughly 1.5 tiles.
- For the P. carolinus look, give each fly a two-level clock. The outer clock (period ~12 s) triggers a burst. The inner clock fires 5 to 8 flashes 0.5 s apart. Couple only the outer clock. Neighbour bumps travel at about 16 px/s if each fly delays its reaction by a small random amount.
- Determinism for an MMO: firefly phase can come from a hash of tile coords plus server time, so every client sees the same pulse without any network traffic. Sync then becomes a pure function of time, and the "emergence" is faked. Run the real coupling only in a local showpiece meadow.

### Gaps
- Did not read the full Mirollo-Strogatz proof or Ermentrout's parameter values.

---

## Q3. Rendering glow cheaply in pixel art (Godot Compatibility)

### Takeaway
Do not give each firefly a PointLight2D. In Godot 4 Compatibility each canvas item takes at most 15 lights, the frame takes 256 (or 64 on GPUs with small uniform buffers), and every light adds fragment work over its rect. Draw fireflies as tiny sprites with 2 to 4 pre-drawn palette halo frames in one batch, and if the scene needs them to light the grass, stamp a 1 texel dot per firefly into the low-res light map from Light study #5.

### Cited findings
- Godot 4.5 GLES3 canvas renderer source: `MAX_LIGHTS_PER_ITEM = 16`, `DEFAULT_MAX_LIGHTS_PER_RENDER = 256`. The per-item loop breaks at `max_lights_per_item - 1`, so an item can receive 15 lights. If `max_uniform_buffer_size < 65536`, max lights per render drops to 64. Whether lighting is on or off is a shader specialization, so lit and unlit items split batches. https://github.com/godotengine/godot/blob/4.5-stable/drivers/gles3/rasterizer_canvas_gles3.cpp and https://github.com/godotengine/godot/blob/4.5-stable/drivers/gles3/rasterizer_canvas_gles3.h
- The 3D Compatibility docs state a similar per-mesh cap (8 omni + 8 spot) and that lights "pop in and out" past the limit. https://docs.godotengine.org/en/4.2/tutorials/3d/lights_and_shadows.html
- Stardew Valley's lighting (1.6 decompile): lights are drawn into a lightmap at screen size divided by `lightingQuality / 2` (default quality 8, so quarter resolution). The lightmap is applied with `BlendFunction.ReverseSubtract`. https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley/Game1.cs
- Pixel art practice: glow can be sold "without using any kind of halo" by putting a warm source against cool surroundings; big halos are built with stepped gradients or dithering. https://pixeljoint.com/pixelart/103437.htm
- Dither everywhere reads as noise, so keep it to the halo edge. https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- Bloom-style glow picks pixels above a brightness threshold, so the palette needs one or two colours brighter than everything else. https://studioaaa.com/?p=227924

### Inferences (recipe)
- Sprite: 1 px core in the brightest palette entry (pale yellow-green), plus a plus-shaped 3x3 halo one palette step down, plus an optional 5x5 diamond with a 50 % checker dither two steps down. Four frames: off (body only, 1 dark px or nothing), dim core, bright core + 3x3, bright core + 3x3 + 5x5. A 4x8 px strip in an atlas.
- Envelope: map the flash curve (fast rise, slow fall) to the four frames. P. pyralis at 12 fps: 1 frame rise, 2 frames peak, 3 frames fall. P. carolinus: 1 frame peak, 1 frame fall.
- Additive blending vs palette steps. Additive (`blend_add` in a CanvasItem shader) is one line and looks soft, but two halos overlapping create colours outside the palette and wash to white. Palette steps with normal alpha keep colours legal. A middle path is to draw halos into a separate low-res buffer with "max" logic, then palette-map once, which is the Acid #2 trick.
- CanvasModulate for night darkens everything by multiplication, including the firefly. Put fireflies on a CanvasLayer above the modulated world, or mark their material `unshaded`, or the glow turns grey.
- Light map stamping: if the light map is 1 texel per tile (Light #5), a firefly is a ±1 brightness bump on one tile. Cheap, but coarse. At 1 texel per 8 px it gives a soft local pool. A cap of 32 stamped fireflies per screen keeps it under one small draw call.
- Batching: 20 to 300 fireflies as one MultiMeshInstance2D or one `_draw()` call with `draw_texture_rect_region` is 1 draw call. 300 PointLight2D nodes would exceed the 256 per-render cap and the 15 per-item cap on any large ground TileMapLayer chunk.

### Gaps
- No measured ms for PointLight2D count vs frame time on WebGL2. Needs a sandbox bench.
- WebGL2 guarantees only a 16 KB uniform block (spec minimum, verify per browser), which would trigger the 64-light path; not confirmed on real devices. https://registry.khronos.org/webgl/specs/latest/2.0/

---

## Q4. How games do it

### Takeaway
Most games cheat hard. Stardew's fireflies never blink. They are a single 1 px dot with a soft light, drifting by a random walk on velocity. Terraria varies the whole night: some nights are full of fireflies, a third of nights have none. Minecraft (2025) made fireflies particles of a bush, not mobs. Nobody shipped real synchrony. That is an opening.

### Cited findings
Stardew Valley (1.6 decompile, `StardewValley.BellsAndWhistles/Firefly.cs`):
- Spawn only when season is summer and `Game1.isDarkOut`, through `addButterflies(chance)`. Groups spawn while `random < chance` (chance capped at 0.8); each group adds extra flies while `random < 0.4`, placed within ±2 tiles. https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley/GameLocation.cs
- Motion: velocity starts random in [-1, 1] world px per tick on each axis, gets ±0.1 added per tick, clamped to ±1. https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.BellsAndWhistles/Firefly.cs
- Glow: one `LightSource` per firefly, texture 4 (`sconceLight`), radius 0.4 to 0.5, colour `Color.Purple * 0.8`. `glowing` is set true and never cleared, so there is no blinking. Drawn as `staminaRect` (a 1x1 white texture) scaled by 4, so 1 art pixel. Removed when it leaves the map.
- Ginger Island East spawns 5 fireflies in a fixed 16x12 tile rect on load. https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.Locations/IslandEast.cs
- See it: https://stardewvalleywiki.com/Summer

Terraria (wiki.gg API, Firefly page):
- Night only, surface grass, wind below 20 mph, not in houses or Graveyards. Rates are re-rolled at dusk (7:30 PM) or world load. 1/9 of nights: fireFlyChance 5 to 9, near-town 1 to 3, group extra 3 to 7. Otherwise 1/3 chance all set to 999999 (no fireflies). Otherwise chance 10 to 59. Groups of 1 to 5 from four extra 1/fireFlyMultiple rolls. Lightning Bug is the Hallow variant. Gives off "a tiny amount of light". https://terraria.wiki.gg/api.php?action=parse&page=Firefly&prop=wikitext&format=json
- See it: https://terraria.wiki.gg/wiki/Firefly

Minecraft:
- Fireflies were cut from 1.19 (May 2022) because real fireflies are toxic to frogs and frogs ate them in game. https://www.pcgamer.com/minecraft-ditched-fireflies-in-the-119-update-so-kids-real-pet-frogs-wont-croak and https://www.gamesradar.com/minecraft-had-to-remove-fireflies-after-players-realised-theyd-be-poisonous-to-frogs
- Firefly Bush added in Java 25w05a (1.21.5, Spring to Life drop, 2025). Block light level 2. 70 % chance per tick to emit a particle when the internal light level is 13 or lower. Particles live 200 to 300 ticks (10 to 15 s), spawn within 5 blocks up and 5 horizontal (10 in Bedrock), fade transparent to opaque pale yellow and back, move erratically, collide with blocks, do not light their surroundings. Buzzing between ticks 12600 and 23400. 25w15a (1.21.6) raised particle output. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Firefly (Minecraft Wiki mirror)
- Steady state per bush (inference): 0.7 × 20 ticks/s × 12.5 s ≈ 175 particles if every roll succeeds; real counts are lower when the "block is air" check fails. Treat as an upper bound.

Animal Crossing New Horizons:
- Firefly in June only (December south), 7 PM to 4 AM, near rivers, sells for 300 Bells. https://game8.co/games/Animal-Crossing-New-Horizons/archives/284909 and https://www.nintendolife.com/guides/animal-crossing-new-horizons-bugs-complete-bug-list-times-locations-prices-how-to-catch-tips

Zelda Breath of the Wild:
- Sunset Firefly appears at night in forests and around Hopper Pond and Kakariko; respawns every night; cooked into a stealth elixir; side quest "By Firefly's Light" asks for 5. https://zeldawiki.wiki/wiki/Sunset_Firefly and https://zeldadungeon.net/wiki/By_Firefly's_Light

Hollow Knight:
- Lumafly Lantern, sold by Sly for 1,800 Geo, lights dark areas around the Knight; early name "Glow Bug Lamp". The bugs are a light source, not ambient life. https://hollowknight.wiki/w/Lumafly_Lantern

### Inferences
- Stardew's colour: the lightmap is subtracted from the scene, so a purple light removes red and blue darkness and leaves a green tint. That probably explains the green-yellow firefly glow from a "Purple" constant. Read from code, not confirmed in game.
- Stardew's speed: 1 world px per tick at 60 ticks/s and 64 world px per tile is at most about 0.94 tiles/s, or about 15 art px/s at 16 px tiles.
- Terraria's per-night re-roll is a pacing tool worth copying. Rare "firefly nights" feel special because most nights are not.

### Gaps
- Not verified with sources: Ori, Okami, Spiritfarer, Sea of Stars night scenes, Hollow Knight ambient lumafly particles. No rendering details found for any of them.
- Terraria light values come from vanilla source, which was not opened.

---

## Q5. Other glowing night life

### Takeaway
Use the same halo atlas and light map stamp for every glowing thing, and vary only rhythm. Fireflies flash. Glowing mushrooms breathe slowly. Blue ghost fireflies glow steadily. Will-o-wisps drift and fade out when approached.

### Cited findings
- Phausis reticulata glows steadily for 30 to 40 s with no flashing, starting at full dark. A real "always on" preset that looks like a wisp. https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
- Minecraft particles fade in and out over 10 to 15 s, a slow breathing glow rather than a blink. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Firefly

### Inferences
- Mushrooms: static tile decoration with a 2-frame halo on a 3 to 6 s sine, phase from tile hash. Zero CPU if driven by `TIME` in a shared shader.
- Will-o-wisp: one P. reticulata style glow that keeps a fixed distance ahead of the player and fades when the player gets within 2 tiles.
- Moths at lamps: see researcher 05. They should be dark silhouettes against lamp halos, not glowing.
- Predator mimicry (Photuris) can be a gameplay hook. A "wrong rhythm" firefly in a synced meadow is a monster tell.

### Gaps
- No game sources gathered for mushrooms or wisps in this pass.

---

## Q6. What makes a firefly field feel magical and not noisy

### Takeaway
Low duty cycle, slow drift, soft fall-off, and a field that slowly falls into step. Keep blinks rare (each fly lit about 5 to 20 % of the time), add more flies before adding faster blinks, and let nights differ.

### Cited findings
- Real flies light about 8 % of the time (pyralis) and go fully dark between bursts (carolinus). https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm and https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
- The Nicky Case demo reads as calm with 150 flies on a 1280x600 screen, a 3.3 s period and a 0.9 per frame decay. https://github.com/ncase/fireflies
- Females ignore unsynced flashing, suggesting that random blinking at high density is visual clutter even to fireflies. https://today.uconn.edu/?p=39950

### Inferences (starting parameters for the sandbox, 320x180)
- Count: 8 to 15 flies per screen for a normal summer night, 30 to 40 on a rare "firefly night" (Terraria style re-roll, about 1 night in 9).
- Period: 4 to 6 s for solo (pyralis), 12 s burst cycle with 6 flashes 0.5 s apart for sync (carolinus).
- Flash: rise 1 frame, fall over 0.3 to 0.5 s at 12 fps. The fall is what reads as "glow"; a square blink reads as a UI cursor.
- J-stroke: raise the sprite 2 to 3 px during the flash (altitude), so each flash is a small upward curve.
- Speed: 4 to 10 px/s drift with velocity random walk (Stardew style), heading turns under 0.05 rad per frame. Fast flies read as gnats.
- Height: draw above tall grass tops, about 1 m (one tile) above ground, never y-sorted with the player.
- Sync: start random at dusk, couple with Nicky Case pull 0.035 and radius 1.5 tiles. Sync emerges over about 20 to 60 s, which gives the night an arc. Player movement adds phase noise within 2 tiles, so walking through the field breaks the pulse and it heals behind you.
- Hours: appear 30 min after in-game dusk, peak in the first hour, thin out by midnight.
- Noisy signs: more than 25 % of flies lit at once, square on/off blinks, white additive halos overlapping into blobs, flies faster than about 20 px/s.

### Gaps
- All parameters above are design estimates. None comes from a player test.

---

## Sources
- https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
- https://www.nps.gov/grsm/learn/nature/fireflies.htm
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7536049
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12629593
- https://bioone.org/journals/florida-entomologist/volume-93/issue-2/024.093.0210/Natural-History-and-Flash-Repertoire-of-the-Synchronous-Firefly-Photinus/10.1653/024.093.0210.full
- https://www.scientificamerican.com/blog/observations/firefly-mating-could-reveal-clues-about-how-the-brain-is-wired/
- https://today.uconn.edu/?p=39950
- https://kjordahl.codeberg.page/ffbehavior.html
- https://archive.org/download/biostor-9033/biostor-9033.pdf
- https://thebiofiles.com/info/4177
- https://firefly.org/field-guides/texas-fireflies
- https://www.lsuagcenter.com/profiles/bneely/articles/page1587050468972
- https://www.biorxiv.org/content/10.1101/2022.05.12.491720v1.full.pdf
- https://phys.org/news/2022-11-synchrony-chaos-firefly-swarm-embody.pdf
- https://www.journals.uchicago.edu/doi/10.1086/394562
- https://springerlink.bibliotecabuap.elogim.com/10.1007/s00442-016-3723-1
- https://www.sciencedaily.com/releases/2024/04/240429201930.htm
- https://ncase.me/fireflies/
- https://github.com/ncase/fireflies
- https://www.iasi.cnr.it/~vbonifaci/semcn/Mirollo1990.pdf
- https://arxiv.org/pdf/cond-mat/9503079
- https://dx.doi.org/10.1007%2FBF00164052
- https://github.com/godotengine/godot/blob/4.5-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
- https://github.com/godotengine/godot/blob/4.5-stable/drivers/gles3/rasterizer_canvas_gles3.h
- https://docs.godotengine.org/en/4.2/tutorials/3d/lights_and_shadows.html
- https://registry.khronos.org/webgl/specs/latest/2.0/
- https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.BellsAndWhistles/Firefly.cs
- https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley/GameLocation.cs
- https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley/Game1.cs
- https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.Locations/IslandEast.cs
- https://stardewvalleywiki.com/Summer
- https://terraria.wiki.gg/api.php?action=parse&page=Firefly&prop=wikitext&format=json
- https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Firefly
- https://www.pcgamer.com/minecraft-ditched-fireflies-in-the-119-update-so-kids-real-pet-frogs-wont-croak
- https://www.gamesradar.com/minecraft-had-to-remove-fireflies-after-players-realised-theyd-be-poisonous-to-frogs
- https://game8.co/games/Animal-Crossing-New-Horizons/archives/284909
- https://www.nintendolife.com/guides/animal-crossing-new-horizons-bugs-complete-bug-list-times-locations-prices-how-to-catch-tips
- https://zeldawiki.wiki/wiki/Sunset_Firefly
- https://zeldadungeon.net/wiki/By_Firefly's_Light
- https://hollowknight.wiki/w/Lumafly_Lantern
- https://pixeljoint.com/pixelart/103437.htm
- https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- https://studioaaa.com/?p=227924
- https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
- https://kingsfoil-artifacts.netlify.app/vfx-fog-topdown-pixel
