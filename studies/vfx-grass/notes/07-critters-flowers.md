# 07. Ground critters, flowers, pollen and seeds, ambient-life spawning

Researcher 07. Scope: rabbits, frogs, lizards, crickets, squirrels; flushing critters from grass; how games spawn, cap, cull and network ambient life; wildflower placement and daily/seasonal behaviour; drifting seeds and petals.

Unit notes used below.
- Stardew Valley world units are 64 px per tile (16 px art drawn at 4x). Updates run at 60 fps, so "6 px per update" is 360 world px/s, or 5.6 tiles/s.
- Don't Starve Together (DST) units. One turf tile is 4 units. Player walk 4, run 6 units/s (`tuning.lua`).
- Kingsfoil assumption (mine, not cited). One 32 px tile is roughly 1 m.

---

## Q1. How do shipped games make a ground critter flee? (the core algorithm)

### Takeaway
Every shipped example is tiny. A critter polls for a threat on a slow timer (200 ms in Stardew, 250 ms brain tick in DST), then switches to a one-way scripted run along a straight line and is deleted once it leaves the map or hides. Nobody runs pathfinding for ambient critters. The "alive" read comes from the idle loop (nibbles, croaks, random pauses) and the burst of the escape, not from smart steering.

### Cited findings

Stardew Valley 1.5 decompile (`veywrn/StardewValley`).
- Base class `Critter`. Gravity 0.25 px per update on a fake jump height `yJumpOffset`. The drop shadow scales with jump height, so a hop reads in top-down without moving the ground position. Critters return `true` (delete me) once 128 px outside the map. https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Critter.cs
- `Rabbit`. Checks every 200 ms. The trigger is "am I on screen" (`Utility.isOnScreen(position, -32)`), not a distance to the player. Then it runs sideways at 6 px/update (5.6 tiles/s) with a 6-frame loop of 40, 40, 40, 100, 70, 40 ms (330 ms per cycle; the long 100 ms frame is the airborne pose). If it passes a bush, it shakes the bush and deletes itself, so it "dives into cover". Winter uses a different sprite row. https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Rabbit.cs
- `Squirrel`. Idles by nibbling 2 to 7 times (200 ms per frame), then waits 0 to 2000 ms. Flees when any farmer or NPC is within 12 tiles, runs at 4 px/update, and if it reaches a tree it climbs for 700 ms, shakes the tree and disappears. https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Squirrel.cs
- `Frog`, two kinds. The "water leaper" sits by water with a 600 ms idle frame, croaks with 1% chance per 200 ms check, and leaps when someone is within 6 tiles. A leap sets `gravityAffectedDY = -6` and moves 4 px/update toward the water, then splashes and deletes itself. The "jumper" frog hops away from the player at 3 px/update with a 4-frame loop (60, 70, 140, 90 ms), and fades out after 1000 ms (alpha drops 0.001 per ms, so a 1 s fade). https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Frog.cs
  - Inference from those constants. A leap lasts 2 x 6 / 0.25 = 48 updates (0.8 s), peaks at 6^2 / (2 x 0.25) = 72 world px (18 art px, about 1.1 tiles high), and covers about 190 world px (3 tiles).
- Don't Starve Together rabbit brain. Priority tree ticked every 0.25 s: panic, run away if a "scarytoprey" entity is within 3 units (stop at 6), run away if within 5 units (stop at 10), go home at night or in spring, eat bait within 20 units, else wander within 20 units of its burrow. Rabbit run speed 5 units/s vs player run 6, so a running player can just catch up. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/brains/rabbitbrain.lua , speeds in https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/tuning.lua
- Minecraft rabbits hop instead of walking, avoid players within 8 blocks and wolves within 10, but approach a player holding carrots or dandelions within 8 blocks. Frogs jump "up to 8 blocks high" and prefer lily pads. https://minecraft.wiki/w/Rabbit , https://minecraft.wiki/w/Frog
- Terraria. Bunny, squirrel, frog and mouse share "Passive AI" (walks semi-randomly, jumps over holes). Grasshoppers use the Slime hopping AI but "flee from nearby players". https://terraria.wiki.gg/wiki/AI

### Inferences
- Two flee triggers exist. Distance-based (DST, Minecraft, Stardew frog and squirrel) and "on screen" (Stardew rabbit). The second is cheaper and guarantees the player sees the escape, which is the whole point of a cosmetic critter.
- The hysteresis pair (flee at 5, stop at 10) is what stops jitter at the edge of the radius. Keep it.
- For a 32 px tile game at 320x180 (10 x 5.6 tiles on screen), Stardew's 6 and 12 tile radii are roughly "half a screen" and "a full screen". A good default for Kingsfoil is a flee radius of 3 tiles and a stop radius of 6, with a 200 ms poll.

### Gaps
- No decompiled numbers for Pokémon SV / Legends Arceus wild-Pokémon alert and flee, BotW animal flee radii, or Animal Crossing bug flee speed. Fan wikis describe behaviour without constants.

---

## Q2. Real-animal numbers for tuning

### Takeaway
Real flee distances are huge compared with a pixel screen. A wild rabbit bolts at about 28 to 30 m, which would be off screen. Games compress this to 3 to 12 tiles. What is worth copying from biology is the ratio of flee distance to distance-to-cover, the jump shape, and the fact that shy animals stay closer to cover at night.

### Cited findings
- European rabbits, Australia. Mean flight initiation distance 30.37 m (SE 1.83, n = 172), day estimate 28.5 m, night 27.1 m, walker approaching at about 1 m/s from a mean 56.9 m. Distance to cover averaged 10.35 m, about 2.7 m by day and 7.25 m at night. Di Stefano et al. 2026, Behavioral Ecology 37(6) arag123. https://academic.oup.com/beheco/article/37/6/arag123/8931588
- Urban and suburban rabbits have shorter FIDs than rural ones (a habituation effect). https://bmcecol.biomedcentral.com/articles/10.1186/s12898-016-0083-y
- Lizards. Urosaurus ornatus mean FID 64.7 cm (SE 6.7, n = 50). Faster approaches raise FID across lizard species. https://oaj.fupress.net/index.php/ah/article/download/9843/10065 , meta-analysis https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Samia_etal_2013_BiolLett.pdf
- Grasshoppers. A 1 m horizontal jump needs a take-off speed of about 3 m/s, regardless of body size. https://st-andrews.ac.uk/~wjh/jumping/motion.html

### Inferences
- Grasshopper jump shape at 45 degrees and 3.1 m/s (my maths). Peak height v^2 sin^2(45)/2g = about 0.25 m, flight time about 0.45 s. In a 32 px tile game that is a 1 tile hop with an 8 px peak in about 27 frames. Draw the hop as a shadow that stays on the ground plus a sprite offset upward, exactly like Stardew's `yJumpOffset`.
- Lizard FID of about 0.65 m is under one tile. A lizard should let the player almost step on it, then dart 2 to 3 tiles in about 0.2 s. That contrast with the skittish rabbit gives species personality for free.
- Approach speed matters in every FID study. A running player should trigger flee at a larger radius than a walking or sneaking one. BotW cricket behaviour matches this (see Q3).

### Gaps
- No single paper with rabbit hop length in m found. No frog hop length data fetched.

---

## Q3. Flushing critters out of grass when trampled or cut

### Takeaway
The cheapest and most loved version is "cutting or trampling grass sometimes spawns a critter that hops away". It is a loot roll on an action the player already does, with no persistent entity until the roll succeeds.

### Cited findings
- Stardew. Cutting a weed has a 2% chance to spawn a jumper frog (`if (Game1.random.NextDouble() < 0.02) location.addJumperFrog(tileLocation)` in `Object.cutWeed`). The frog hops away from the player and fades within 2 s. https://github.com/veywrn/StardewValley/blob/master/StardewValley/Object.cs
- Terraria. Grasshoppers and gold grasshoppers are "found by breaking tall grass". Gold critters replace normal ones at 1/400. https://terraria.wiki.gg/wiki/Critters
- Breath of the Wild. Cutting grass can produce Restless Crickets, Hot-Footed Frogs, Hylian Rice and rarely fairies. An uncaught cricket hops a couple of times then flies off, unless Link is sneaking. https://zeldawiki.wiki/wiki/Grass , https://www.zeldawiki.wiki/wiki/Restless_Cricket (see it in action: https://www.zeldadungeon.net/wiki/Restless_Cricket)
- Stardew rabbits that reach a bush shake it and vanish, so cover reacts to the critter too. https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Rabbit.cs

### Inferences
- For Kingsfoil, roll on "player enters a tall-grass tile" with about 1 to 3% chance per tile entered, capped by a per-player cooldown of several seconds so running through a field does not spawn a swarm. Spawn a cricket or frog that does 2 to 3 hops away from the player, then despawns with a fade. This links naturally to the trampling interaction map in other notes.
- Make sneaking lower the flush chance and the flee radius. It rewards stealth and matches BotW.

### Gaps
- No found source for RDR2 or Ghost of Tsushima flushing birds from grass with numbers.

---

## Q4. Ambient-life spawning system design (spawn tables, caps, culling, networking)

### Takeaway
Stardew and DST show the two ends. Stardew spawns a batch of purely local critters when you enter a map and on each 10-minute clock tick, with a hard cap per location. DST runs a server-side per-player spawner with a radius cap and deletes critters when no player is near. For an MMO, cosmetic critters should be client-only with a deterministic seed per tile and time bucket. Only catchable or killable critters need to be server entities.

### Cited findings

Stardew `GameLocation.tryToAddCritters` (1.5). https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
- Base chance `clamp(mapArea / 15000, 0.15, 0.5)` where mapArea is tiles. Butterflies and birds get the base chance, bunnies and squirrels half, woodpeckers one eighth.
- No critters at all if it is raining. Owls only at night (1% per attempt).
- Hard cap. New critters are added only while the location holds 10 or fewer, or 20 or fewer in summer.
- Called on entering an outdoor location, and every 10 in-game minutes with `onlyIfOnScreen: true`. In that mode butterflies must spawn off screen and rabbits and squirrels are skipped, so nothing pops into view.
- Butterflies only before 15:00 in spring and summer. Summer nights spawn fireflies instead. Each butterfly has a 40% chance to bring another within 2 tiles, repeated, so they come in small clusters.
- Bunny placement. Pick a random bush, step 5 to 11 tiles sideways, require clear tiles, retry 3 times. The rabbit therefore always starts in open ground with cover behind it. Squirrels do the same from mature trees with 4 to 6 tiles. Not on the Farm or in the Desert.
- Frogs (water leapers) only when raining and not winter, placed on the first land tile next to water.
- `critters` is a plain `List<Critter>`, not a net field, and uses `Game1.random`. Critters are local to each player in multiplayer. The list is cleared every `DayUpdate`.

Don't Starve Together `butterflyspawner` component. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/components/butterflyspawner.lua
- One schedule per active player. Every 10 + rand(10) s (0.3 + rand(10) s on first spawn), if fewer than `MAX_BUTTERFLIES = 4` butterflies exist within 64 units, pick a random flower 6 to 25 units from the player and spawn a butterfly on it, homed to that flower.
- Active only by day and not in winter.
- When a butterfly's entity goes to sleep (out of every player's active range) the spawner removes it. This is despawn-on-cull.
- Butterflies pollinate. After visiting more than 5 flowers, a butterfly can plant a new flower if fewer than 4 flowers sit within 5 units (`pollinator.lua`). So life spreads flowers, which spawn more life. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/components/pollinator.lua
- Rabbit holes respawn a rabbit after `day_time * 4`, close in spring and at night, and the rabbit brain goes home at night. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/prefabs/rabbithole.lua

Terraria. Critters share the enemy spawn rules and cap, spawn faster when the player stands still, and appear from the screen sides. https://terraria.wiki.gg/wiki/Critters

Minecraft spawn tables. Rabbits in groups of 2 to 3 (2 to 6 in Meadow and Cherry Grove), weighted per biome (Desert 12/13). Frogs in groups of 2 to 5 in swamps, with the variant set by biome temperature. https://minecraft.wiki/w/Rabbit , https://minecraft.wiki/w/Frog

Client-only critters in practice. Minecraft mods such as World Alive describe themselves as particle-based and client-side, needing nothing on the server. https://modrinth.com/mod/world-alive . A Techtonica mod states "creatures won't sync". https://thunderstore.io/c/techtonica/p/CertiFried/AmbientLife . A Funcom forum post states the cost plainly, no two players see the same thing and no interaction is possible. https://forums.funcom.com/t/adding-birds-other-than-the-vultures/80257

RDR2. Rockstar gave a GDC 2020 talk (Alex O'Dwyer, animating the animals) and the game has over 200 species, but I found no public numbers on spawn density or pooling. https://gdconf.com/article/learn-how-rockstar-breathed-life-into-the-wildlife-of-red-dead-redemption-2-at-gdc/

### Inferences (recommended design for Asterion Online)
- Spawn table key. biome x season x hour band (dawn, day, dusk, night) x weather (clear, rain, snow, wind). Each row lists species, weight, group size, anchor type (flower, bush, water edge, tall grass) and max count. Stardew's hard "no critters when raining" plus "frogs only when raining" is a good template; weather swaps the cast instead of only removing it.
- Anchors, not random tiles. Every Stardew and DST spawn is anchored to a feature (bush, tree, flower, water edge). This is what makes placement look intentional. Precompute anchor lists per map chunk.
- Determinism. Seed each spawn from `hash(chunkX, chunkY, timeBucket, worldSeed)` with time buckets of about 30 to 60 s. Two players on the same screen then see the same butterfly appear on the same flower at nearly the same time, with zero bytes sent. Divergence only happens after a critter reacts to a player, and the flee trigger can use all visible players (positions the client already has), so even that mostly agrees.
- Budget. Stardew's cap of 10 to 20 per whole location is a sensible ceiling. For a 320x180 view, 4 to 8 visible ground critters plus about 4 flyers (DST's cap) is plenty. Pool by species with a fixed array, since all critters have the same tiny state (position, velocity, jump height, frame, timer).
- Spawn and despawn off screen only (Stardew's `onlyIfOnScreen` rule and Terraria's side spawning). Exceptions are flush spawns, which are triggered by the player and so are expected to pop in.
- Server entities only for critters that can be caught, killed, eaten or that drop loot. Everything else is client-only. Estimate. A server critter at about 10 position updates/s x 8 bytes x N players watching is real bandwidth across a busy field, while a client-only critter costs nothing.
- CPU estimate (not measured). One critter update is a timer decrement, a few distance checks against nearby players and an integer move. Even 100 critters is well under 0.1 ms per frame in GDScript on a phone. The cost that matters is draw calls, which y-sorted sprites from one atlas keep low.

### Gaps
- No public measured ms or bandwidth numbers for ambient life in any MMO. No talk with RDR2, Horizon or Ghost of Tsushima ambient-life spawn parameters was found.

---

## Q5. Wildflowers in fields (placement, season, day/night)

### Takeaway
Real wildflowers clump. Use Poisson-disc placement inside patches picked from low-frequency noise, not uniform random. Add a bloom window per species and a daily open/close cycle. Flowers that spread by a rule (Animal Crossing, DST pollinators) make a field change over days, which an MMO can store as plain tile items.

### Cited findings
- Bridson's fast Poisson-disc sampling runs in O(N) in any dimension and is the standard way to get "random but not touching" scatter. Libraries use k = 30 candidate attempts per active point (the paper's default value, I did not re-confirm in the PDF). https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf , https://docs.rs/poisson-diskus
- Animal Crossing New Horizons. Fan datamine guides report that a watered flower has about a 5% chance to reproduce overnight onto an adjacent empty tile, rising to 80% with 5 or more visitors watering. Guides disagree on the exact counter rule. https://aiterusawato.github.io/satogu/acnh/flowers/advanced.html , https://www.gamespot.com/amp-articles/animal-crossing-new-horizons-hybrid-flowers-guide-/1100-6475346/
- DST flowers spread through butterflies, capped at 4 flowers within 5 units (see Q4).
- Dandelion heads close each evening, often starting between 15:00 and 17:00, reopen in the morning, and may stay shut on cloudy or rainy days. https://biologyinsights.com/why-do-dandelions-close-at-night/
- Stardew stops spawning butterflies after 15:00 too, so flower life and butterfly life share an afternoon cut-off in that game. https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs

### Inferences
- Pixel recipe. A 2 or 3 frame flower sprite (open, half, closed) driven by the global hour and weather. Close at dusk, stay half-closed when raining. This is one integer per flower type, not per flower.
- Field layout. Threshold a low-res value noise at about 0.6 to choose patch areas, then Poisson-disc inside patches with radius 1 to 2 tiles for big blooms and 6 to 10 px for tiny dots baked into grass tile variants. Mix 2 or 3 species per patch with one dominant (about 70%).
- Phenology. Give each species a bloom window in days of season plus a per-tile hash offset of a few days, so a meadow fills in over a week instead of switching on in one frame. This mirrors the per-tile phenology offset idea in the seasons scope.
- Swaying heads. Reuse the tuft sway (whole-pixel offset of the top 2 to 4 px rows) with flowers 1 px stiffer than grass, so heads nod a beat later. Covered in the wind notes.

### Gaps
- No measured wildflower clump statistics (Ripley's K) collected. No pixel-artist source on flower density found within budget.

---

## Q6. Pollen, dandelion seeds and seasonal debris drifting on wind

### Takeaway
Use the Stardew `WeatherDebris` model. 16 to 63 screen-space particles that wrap around the viewport, drift with one global wind value, and occasionally get a "blowing" lift. It is the cheapest seasonal ambience in any shipped game. Real dandelion seeds fall at 0.39 m/s, slow enough that wind dominates, so a seed should mostly travel sideways and sink slowly.

### Cited findings
- Dandelion seed. Measured terminal velocity 39.1 cm/s (95% CI 34.9 to 43, 10 seeds), pappus projected area about 12.6 mm^2, weight about 6.2 uN. Flight is stabilised by a separated vortex ring above the porous pappus. Cummins et al. 2018, Nature 562:414-418. https://strathprints.strath.ac.uk/79669/1/Cummins_etal_Nature_2018_A_separated_vortex_ring_underlies_the_flight.pdf (the brief's ~0.3 m/s figure is low; use 0.39).
- Dispersal. More than 0.05% of dandelion seeds travel beyond 100 m, driven mainly by convective updrafts rather than horizontal wind. https://www.thieme-connect.com/products/ejournals/html/10.1055/s-2003-44789 . A modelling study gives a median dispersal distance of about 3.9 m. https://www.biorxiv.org/content/10.1101/542696v2.full-text
- Stardew `Game1.populateDebrisWeatherArray`. On a debris-weather day, create `random.Next(16, 64)` particles at random screen positions. Type by season, pink petals in spring, leaves in fall, snow in winter. https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs
- Stardew `WeatherDebris.update`. Position moves by `dx + globalWind` and `dy + 0.5` per update, with `globalWind = -0.25` by default. Particles wrap around the viewport, so the count never changes. Animation ticks every 100 ms plus a per-particle offset of -24 to +24 ms, so they never flutter in sync. A random "blowing" state (0.1% chance per update in spring and summer) pushes dy upward by 0.01 per update until it ends (0.6% chance per update, or dy below -2). Specific animation frames add small dx/dy kicks, which makes a petal look like it catches air as it tumbles. Drawn at 3x scale from a 16x16 cell. https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs
- Stardew fall gusts. With 0.1% chance per update, `windGust` starts at -0.02 to -0.09, grows by 2% per update up to -5, sets `globalWind = -0.5 + windGust`, plays a wind sound, and ends with 0.7% chance per update once past -0.2. https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs

### Inferences
- Scale for Kingsfoil (estimate). At 1 tile = 1 m = 32 px, seed fall is about 12 px/s. In top-down, show "fall" as the sprite sinking toward a 1 px shadow that drifts along the ground. A seed released at 1 m height lands in about 2.5 s, so at a 1 m/s breeze it lands about 2.5 tiles downwind. That matches the 3.9 m median, so a realistic look is also a readable one.
- Wind speed for drift should come from the same global (server) wind value as grass sway. Stardew wires the gust to both particles and a sound; do the same with the grass gust wave.
- Particle budget. 16 to 64 one-or-two-pixel sprites on a 320x180 view is trivial for Godot CPUParticles2D or a single MultiMesh (one draw call). Stardew's screen-space wraparound means no spawn or despawn cost at all. Pollen at 1 px, warm yellow, 10 to 30 alive, with alpha flicker is enough.
- Make long-distance outliers rare. One seed in a few hundred catching an updraft (rising and leaving the screen) is a nice nod to the 0.05% beyond 100 m figure.
- Risk. Screen-space wrap breaks world-lock, so particles slide with the camera. Fog study used world-locked dither for this reason. For seeds use world-space positions with a camera-relative wrap rectangle.

### Gaps
- No Ori, Journey or BotW particle counts for seeds or pollen found within budget.

---

## Starter parameter table for Kingsfoil (32 px tiles, 320x180)

| Critter | Trigger | Flee radius / stop | Move | Hop | Despawn |
|---|---|---|---|---|---|
| Rabbit | poll 200 ms, on-screen or within 4 tiles | 4 / 8 tiles | about 4 to 5 tiles/s straight line toward nearest bush | 330 ms loop, long airborne frame | dives into bush, or off map |
| Frog (water edge) | within 3 tiles | n/a | 1 to 2 hops into water | 0.8 s, peak about 1 tile (Stardew constants scaled) | splash and delete |
| Cricket (flushed) | 1 to 3% per tall-grass tile entered | runs from player | 2 to 3 hops | 1 tile long, about 8 px peak, about 0.45 s | fade over 1 s |
| Lizard | within 1 tile | 1 / 4 tiles | dart 2 to 3 tiles in about 0.2 s | none | hides under rock tile |
| Squirrel | within 6 tiles | n/a | to nearest tree | none | climbs 700 ms, shakes tree, deletes |

These are inferences scaled from the Stardew and DST constants above, not shipped values.

---

## Sources
- Stardew Valley 1.5 decompile. Critter.cs, Rabbit.cs, Frog.cs, Squirrel.cs, GameLocation.cs, Object.cs, WeatherDebris.cs, Game1.cs. https://github.com/veywrn/StardewValley
- Don't Starve Together scripts mirror. rabbitbrain.lua, butterflyspawner.lua, pollinator.lua, rabbithole.lua, tuning.lua. https://github.com/taichunmin/dont-starve-together-game-scripts
- Terraria AI styles. https://terraria.wiki.gg/wiki/AI
- Terraria critters. https://terraria.wiki.gg/wiki/Critters
- Minecraft rabbit. https://minecraft.wiki/w/Rabbit
- Minecraft frog. https://minecraft.wiki/w/Frog
- Zelda Wiki grass. https://zeldawiki.wiki/wiki/Grass
- Zelda Wiki Restless Cricket. https://www.zeldawiki.wiki/wiki/Restless_Cricket
- Zelda Dungeon Restless Cricket. https://www.zeldadungeon.net/wiki/Restless_Cricket
- Di Stefano et al. 2026, rabbit FID day and night. https://academic.oup.com/beheco/article/37/6/arag123/8931588
- Rabbit latrine study, urban FID. https://bmcecol.biomedcentral.com/articles/10.1186/s12898-016-0083-y
- Urosaurus ornatus FID. https://oaj.fupress.net/index.php/ah/article/download/9843/10065
- Samia et al. 2013 FID meta-analysis. https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Samia_etal_2013_BiolLett.pdf
- St Andrews jumping biomechanics. https://st-andrews.ac.uk/~wjh/jumping/motion.html
- Cummins et al. 2018, dandelion vortex ring. https://strathprints.strath.ac.uk/79669/1/Cummins_etal_Nature_2018_A_separated_vortex_ring_underlies_the_flight.pdf
- Tackenberg et al. 2003, dandelion long-distance dispersal. https://www.thieme-connect.com/products/ejournals/html/10.1055/s-2003-44789
- Dandelion dispersal modelling (bioRxiv). https://www.biorxiv.org/content/10.1101/542696v2.full-text
- Dandelion closing times. https://biologyinsights.com/why-do-dandelions-close-at-night/
- Bridson 2007 Poisson-disc. https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
- poisson-diskus crate (k = 30). https://docs.rs/poisson-diskus
- ACNH flower research guide. https://aiterusawato.github.io/satogu/acnh/flowers/advanced.html
- GameSpot ACNH hybrid guide. https://www.gamespot.com/amp-articles/animal-crossing-new-horizons-hybrid-flowers-guide-/1100-6475346/
- World Alive client-side mod. https://modrinth.com/mod/world-alive
- Techtonica AmbientLife mod. https://thunderstore.io/c/techtonica/p/CertiFried/AmbientLife
- Funcom forum on client-side critters. https://forums.funcom.com/t/adding-birds-other-than-the-vultures/80257
- GDC, RDR2 wildlife talk. https://gdconf.com/article/learn-how-rockstar-breathed-life-into-the-wildlife-of-red-dead-redemption-2-at-gdc/
