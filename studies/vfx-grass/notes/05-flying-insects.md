# 05. Butterflies and flying insects: biology numbers and game algorithms

Researcher 05, study #9 (grass, wind and small life). Birds were covered in Forest F1/F2. This file covers insects only.

Unit note for Kingsfoil. A 32 px tile is treated as about 1 m of ground. That is an assumption used to turn biology speeds into px/s, not a cited figure. Sandbox is 320x180 at 60 fps.

---

## Q1. How fast do butterflies flap and fly, and what makes the path erratic?

### Takeaway
A real butterfly flaps at 9 to 12 Hz and cruises at 1 to 2.4 m/s. Its zigzag comes from high turning acceleration (5 to 8 m/s²) with a turn radius of about 1 m. At 60 fps you cannot show 11 Hz flapping honestly (it aliases), so games slow the visible flap to 2 to 5 cycles per second and fake the rest with an up-hop per flap.

### Cited findings
- Cabbage white (Pieris rapae). Speed 2.37 ± 0.44 m/s, wingbeat 11.8 ± 2.1 Hz, linear acceleration 8.5 m/s², turning acceleration 7.6 m/s², radius of curvature 1.17 m. Gypsy moth 1.57 m/s, 26.8 Hz, radius 0.43 m. Jantzen & Eisner 2008, PNAS. https://pmc.ncbi.nlm.nih.gov/articles/PMC2575472
- Removing hindwings cut speed by about 25% but did not change turn radius much (1.17 to 0.99 m). The insects still zigzag, only slower. The authors call agility the "chief adaptive asset" of big hindwings. Same source.
- The paper defines evasive flight as flying "quickly, at varying speed and direction". Same source.
- Neotropical butterflies cruise at about 11 Hz, stroke about 103°, forward speed above 1 m/s. Dudley 1990, J. Exp. Biol. 150:37. https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf
- Migrating monarchs can drop to about 3 Hz to save energy (cited in a 2024 robotics paper). https://www.arxiv.org/pdf/2404.16985
- Palatable butterflies fly fast and erratically. That makes the path hard for predators to predict. https://pmc.ncbi.nlm.nih.gov/articles/PMC4590450

### Inferences
- In Kingsfoil units, 1 to 2.4 m/s is about 32 to 77 px/s. A believable game butterfly cruises at 25 to 50 px/s. That is a bit slower than life, because the screen is small and the player needs to track it.
- A 1 m turn radius is about one tile. Heading changes should happen on a scale of one tile, not every few pixels. Sub-tile jitter reads as noise.
- An 11 Hz flap at 60 fps means about 5.5 frames per wingbeat. With a 3 or 4 frame sprite cycle you get strobing. Stardew's 45 to 80 ms per frame (Q5) gives 2 to 5.5 visible cycles per second, which reads as "flapping" without aliasing.

### Gaps
- No cited figure for how long butterflies glide between flap bursts. Large species (swallowtails, monarchs) glide visibly. Small whites barely glide.
- No measured landing approach data (speed, hover time before touchdown).

---

## Q2. Bees: wingbeat, hover and flower-to-flower hops

### Takeaway
Bees beat too fast to see (about 230 Hz), so in pixel art the wings are a blur frame or a 2-frame flicker. The readable behaviour is the rhythm. A bee hops between flowers in about 2 s, then sits on a flower for longer than it flew.

### Cited findings
- Honeybees hover with about 90° stroke amplitude at about 230 Hz. Altshuler et al. 2005, PNAS 102(50). https://pmc.ncbi.nlm.nih.gov/articles/PMC1312389
- Bumblebees in a natural meadow. Flights between flowers of the same species had a median of about 2 s. Switching to another species took 3 to 6 s. Chittka et al. 1997, Behavioral Ecology 8(3). https://academic.oup.com/beheco/article/8/3/239/187553
- Lab work found flower constancy saves only about 1 s per visit. https://cris.huji.ac.il/en/publications/flight-durations-in-bumblebees-under-manipulation-of-feeding-choi/
- Time in flight was small next to time on the flower (grid study). https://psych.mcmaster.ca/dukas/Durisko%20et%20al%202011.pdf
- Bees that follow repeat routes (traplines) raised their travel speed by 154% with experience. https://link.springer.com/content/pdf/10.1038/s41598-017-04919-8.pdf

### Game reference: Minecraft bee (cited from minecraft.wiki)
https://minecraft.wiki/w/Bee
- Forage range up to 22 blocks from the hive.
- A bee must circle a flower for more than 400 ticks (20 s) to collect nectar.
- About 5% chance per tick to try pollinating a crop, about 10 crops per load. The bee hovers 1 to 2 blocks above the crop.
- Bees go home when it rains and at night. They stay in for at least 2400 ticks (2 min).
- Hive holds up to 3 bees. Movement speed attribute 0.6. Bees "hover like bats and parrots".

### Inferences
- A good bee loop for Kingsfoil. Pick a flower within 3 to 5 tiles. Fly there in 1 to 3 s with a small sinusoidal bob (1 px, 4 to 6 Hz). Sit 2 to 6 s with a 2-frame wing blur. Repeat 3 to 8 times, then leave the screen.
- Minecraft's 20 s per flower is a game-economy number, not biology. Do not copy it for ambience.
- Bees going home in rain matches Stardew's and Terraria's "no critters in rain" rule (Q7).

### Gaps
- No measured bee hover-jitter amplitude. The 1 px bob above is a guess.

---

## Q3. Dragonflies: dart, hover, patrol over water

### Takeaway
Dragonflies alternate long holds (hover or perch) with very short, very fast darts. That contrast is the whole look. Hover is under 0.25 m/s, patrol about 1.6 m/s, chase about 2.7 m/s, and take-off reaches 15 to 20 m/s² in one or two wingbeats.

### Cited findings
- Predation strikes. Peak acceleration 15 to 20 m/s² within 1 to 2 wingbeats of take-off. Dragonfly speed tracks prey speed plus about 1 m/s. Combes et al., SICB abstract. https://sicb.org/?p=17126
- Territorial males fly about 50 cm above water. "Hovering" includes forward flight under 0.25 m/s. May 1987 (Tetragoneuria). https://natuurtijdschriften.nl/pub/593064/AOIOS1987003001007.pdf
- Patrolling males hover often. Net patrol speed about 1.62 m/s. Chases average 2.75 ± 0.65 m/s. Hovering costs more than forward flight. https://natuurtijdschriften.nl/pub/592070/OJIOS1994023001006.pdf
- Patrol is "slow circling flight close to water" (Dunham 1994, cited in the same search). https://natuurtijdschriften.nl/pub/591603/OJIOS1983012001005.pdf

### Game reference: Terraria dragonflies
https://terraria.wiki.gg/wiki/Dragonflies
- Code in `AI_114_Dragonflies()` (Desktop 1.4.4.9).
- Spawns only by day, wind under 20 mph, surface, and only if a cattail is within a 61x41 tile box. It appears on the cattail, so it can pop in on screen.
- Colour by biome. Black, orange and yellow near sand. Blue, green and red near grass.
- On approach it flies a short distance up and away. Its speed builds over time up to 82 mph in game units.

### Inferences
- Dart-and-hover state machine. HOVER 0.8 to 3 s with 0 to 1 px drift. DART 0.1 to 0.25 s to a point 1 to 3 tiles away, eased with a sharp start and a soft stop. Then HOVER again. Every 3 to 6 darts, return near a home point over water (territory radius 3 to 5 tiles).
- Snap rotation to 8 directions, because a dragonfly reads by body angle. Do not rotate a pixel sprite freely.
- Anchor spawns to a "perch" prop (reeds, cattails) like Terraria. Then dragonflies only exist where water plants are, which teaches the player where water is.

### Gaps
- No pixel-art frame counts for dragonfly wings from a shipped game.

---

## Q4. Gnats and midges: swarms over a marker

### Takeaway
A midge swarm has no shared heading. Each midge flies fast on its own and is pulled back toward the swarm centre by a force that grows with distance, like a spring. That one rule gives the classic "cloud that holds its shape over a spot" look, and it is cheaper than boids.

### Cited findings (Kelley & Ouellette 2013, Scientific Reports 3:1073)
https://pmc.ncbi.nlm.nih.gov/articles/PMC3545223
- Lab swarms of Chironomus riparius. 12 to 111 midges per frame. Swarms "typically 20 to 30 cm on edge".
- Mean radius scales as N^(1/3), so the volume per midge stays about constant.
- Polarisation p ≤ 0.09 for all swarms. The swarm has no net direction.
- Motion is ballistic (straight) for about 0.5 s, then it turns.
- Mean acceleration toward the centre "increases linearly" with distance. The authors call this an elastic potential well. The well gets softer as swarms grow, and it is stiffer horizontally than vertically.
- Swarms form over a black marker that stands in for river edges.
- Other lab work: an average swarm of about 10 midges, swarms start with a few males, and it can take up to 20 min for numbers to stabilise. Swarm diameter about 50 cm over a 30x30 cm marker. https://pmc.ncbi.nlm.nih.gov/articles/PMC4233756
- Only males swarm in C. riparius. Same source.

### Inferences
- Algorithm per midge, at 30 Hz or even 15 Hz:
  ```
  a = -k * (p - centre) + random_unit() * jitter   // spring + noise
  v = (v + a*dt) * damping                          // damping ~0.96 per tick
  p += v*dt
  draw 1 px at round(p)
  ```
  Use k_y about 0.5 * k_x, because the paper found swarms stiffer horizontally. In top-down this makes the cloud bob taller than wide. Size the spring so the swarm radius is 6 to 12 px. Mark k and jitter as tuning values. The paper gives no numbers for k in the text.
- 8 to 30 single pixels, one dark palette colour, is enough. Cost is trivial (30 points x 3 adds).
- The marker matters for art direction. Put swarms over a bush top, a fence post or a pond edge. The swarm then explains itself.
- Let the centre drift slowly with the global wind vector (link Fog's wind field) and snap back.

### Gaps
- No field swarm height above marker found (Campbell 1974 thesis has a table but the excerpt had no values). https://www.gnatwork.ac.uk/sites/gnatwork/files/content/attachments/2021-02-24/Thesis_Campbell%201974.pdf

---

## Q5. Moths and lights

### Takeaway
Moths are not pulled toward lamps. They tilt their back toward the brightest thing, which near a lamp makes them fly sideways around it. Three motifs show up. Orbiting (circling at steady speed), stalling (climbing until they stop) and inverting (flipping over and diving when above the light). For a game, an orbit around the lamp with occasional stalls and dives is both correct and cheap.

### Cited findings (Fabian, Sondhi, Allen, Theobald & Lin 2024, Nature Communications 15:689)
https://doi.org/10.1038/s41467-024-44785-3 (PDF used: https://par.nsf.gov/servlets/purl/10503365)
- 477 stereo field recordings, median 1.7 s each. Insects under 2 cm from 13 families in 6 orders.
- Insects "do not steer directly toward the light". They turn the dorsum (back) to it, which produces flight perpendicular to the source.
- Orbiting has sustained speed with the body banked toward the light. Stalling is a steep climb that loses speed until progress stops. Inverting happens when the insect passes over the light, and it can end in a crash.
- These motifs were rare (<2%) in videos of insects in the dark.
- Motion capture in a 2 m arena. Common darter dragonflies (n = 12), migrant hawkers (n = 2), Noctua moths, Atlas moths (n = 3). The dorsal-axis-to-light index was 0.79 to 0.84 under light and 0.17 in darkness.
- Insects swapped orbit direction in 25 of 37 trials when the light source was toggled.
- A guidance model with dorsal tilt alone reproduced orbiting, stalling and inverting. Random parameter runs (300 x 5 s) did not match real tracks.
- Popular summaries: https://news.mongabay.com/2024/02/like-a-moth-to-a-flame-science-finally-explains-why-insects-flock-to-artificial-lights/ and https://physicstoday.aip.org/news/why-insects-orbit-light-at-night

### Inferences
- Top-down moth controller (a cheap stand-in for the paper's model, not their code):
  ```
  to_light = lamp - p; r = |to_light|
  tangent  = perp(to_light / r) * orbit_dir      // fly sideways, back to light
  radial   = (to_light / r) * (r - r_orbit) * k  // keep a loose ring
  v = lerp(v, tangent*speed + radial, 0.1) + noise
  every 2-6 s: chance to STALL (speed -> 0 over 0.4 s, sprite shrinks 1 px)
              or DIVE (cross the lamp centre, flip orbit_dir)
  ```
  Ring radius 6 to 16 px around a lamp sprite. 2 to 6 moths per lamp. The orbit-direction flip is backed by the 25-of-37 observation.
- In top-down 3/4 view, the "height" axis can be a y-offset with a 1 px shadow, as Stardew's critter base class does (Q6).
- Use the moth near Light study's lamps and campfires. https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel

### Gaps
- Behaviour beyond a few metres from the light is unresolved in the paper.

---

## Q6. Stardew Valley critters: real code

### Takeaway
Stardew's butterfly is a "flap-hop" with gravity. Each flap kicks it upward and nudges its sideways speed. Gravity pulls it down between flaps, and a decaying multiplier slows it. The result reads as a fluttering arc with almost no code. The firefly is a 1-pixel random walk with a light attached.

Source: decompile of Stardew Valley 1.5.x, https://github.com/veywrn/StardewValley (files under `StardewValley/BellsAndWhistles/`). Coordinates are world pixels at 4x zoom (64 px per tile, 16 source px per tile). Update runs once per frame with no dt in the position step, so speeds are per 60 fps frame.

### Butterfly.cs (cited code, summarised)
https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Butterfly.cs
- `flapSpeed = Random(45, 80)` ms per animation frame, chosen once per butterfly.
- Spring butterflies use a 4-frame flap (frames 1,2,1,0). Summer and island ones use 6 frames (1,2,3,2,1,0). One flap cycle is 180 to 480 ms.
- After each flap, `flapTimer = 200 ± 5` ms of rest before the next flap.
- On each flap:
  ```csharp
  motion.X += Random(-80, 81) / 100f;          // nudge sideways ±0.8
  motion.Y = (Random() + 0.25) * -3f / 2f;     // kick up 0.375..1.875 px/frame
  clamp |motion.X| to 1.5
  motionMultiplier = 1f;
  ```
- Every frame:
  ```csharp
  position += motion * motionMultiplier;
  motion.Y += 0.005f * elapsedMs;              // gravity ~0.083 px/frame²
  motionMultiplier -= 0.0005f * elapsedMs;     // fades to 0 in 2 s
  ```
- `maxSpeed = 3f` is declared. The 1.5 px/frame sideways cap is about 90 world px/s, which is 1.4 tiles/s.
- Butterflies draw in `drawAboveFrontLayer`, so they are always on top of trees and buildings. `draw()` is empty, so they have no shadow.
- `checkForLandingSpotTimer` and `landedTimer` are declared but unused in this decompile. In 1.5.x butterflies do not land and do not flee.
- `stayInbounds` mode (greenhouse) bounces them off map edges.

### Firefly.cs (cited code)
https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Firefly.cs
- Velocity random walk. Each frame `motion += Random(-1..1) * 0.1`, clamped to ±1 px/frame.
- A `LightSource` of radius 0.4 to 0.5, `Color.Purple * 0.8`, follows it. Stardew's light map is subtractive, so the purple value likely renders as a warm glow (inference).
- Drawn as one source pixel (`staminaRect` scaled 4x).
- `glowing` is always true in this version, so there is no blink.

### Critter.cs base
https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Critter.cs
- Gravity 0.25 per frame on a separate `yJumpOffset` for hops. A shadow is drawn under ground critters and scales with height.
- A critter is removed once it leaves the map by 128 px. That is the only culling.

### Inferences
- The flap-hop model is the most useful find here. One random number per flap, one gravity add per frame. It gives arcs with a natural rhythm because motion is tied to the flap frames. The sprite and the movement agree, which is a big part of why it reads as alive.
- The visible flap rate (2 to 5.5 per second) is far below real 9 to 12 Hz (Q1). Nobody complains. Players read the rhythm, not the frequency.
- For Kingsfoil at 32 px tiles, halve Stardew's world numbers (its tile is 64 world px). Side cap about 0.75 px/frame (45 px/s), up-kick 0.2 to 0.9 px/frame, gravity about 0.04 px/frame². Round the drawn position to whole pixels.

---

## Q7. Spawn rules by season, hour, weather and wind

### Takeaway
Shipped games agree. No flying insects in rain. Butterflies by day in warm seasons, fireflies and moths at night. Spawn off screen in small clusters, cap the total, and top up on a slow timer.

### Stardew Valley (cited code, GameLocation.cs)
https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
- `tryToAddCritters` returns right away if it is raining here. No critters spawn at all in rain.
- Base chance `= clamp(mapArea / 15000, 0.15, 0.5)` where mapArea is width x height in tiles.
- Butterflies use `min(0.8, chance * 1.5)`. Bunnies and squirrels use chance / 2. Woodpeckers use chance / 8.
- Total critter cap per location is 20 in summer and 10 in other seasons.
- Butterflies only in spring and summer (or the island), and only before 15:00. In summer after dark, the same call spawns fireflies instead.
- Spawn loop. `while (rand < chance)` spawn a group at a random tile. Each group adds extra members with `while (rand < 0.4)` within ±2 tiles. Expected group size is 1 / (1 - 0.4) = 1.67 (inference from the code).
- When topping up during play (every 10 game minutes, about 7 real seconds), it skips tiles that are on screen, so nothing pops in where you can see it.
- On entering a location it spawns the full set once.
- Owls have a 1% chance per call when it is dark.

### Terraria
https://terraria.wiki.gg/wiki/Butterfly
- Butterflies spawn only by day, not in rain, and only with wind below 20 mph. Forest and Hallow surface only. Not in a graveyard.
- A daily roll at dusk or world load. 1/3 chance butterflies are off for the day, otherwise `butterflyChance` is 1 to 20 with a further 1/5 chance to disable. Overall 7/15 (46.7%) chance of no butterflies that day.
- Groups of 1 to 3 (two independent 1/4 rolls for extras). Gold butterfly 1/400.
- Since 1.4.0.1, butterflies try to avoid nearby enemies.
- AI: `AI_065_Butterflies()` (wiki label "Butterfly AI", slow flight in any direction). Firefly AI is style 64, "flying slowly... occasionally glowing". https://terraria.wiki.gg/wiki/AI_IDs
- The daily on/off roll is a smart idea. Some days are butterfly days. It makes the world feel like it has weather of its own.

### Animal Crossing
- New Horizons moth. Flies near light sources, 19:00 to 04:00, all year, any weather except rain. https://nookipedia.com/wiki/Moth
- GameCube Animal Crossing, June. Common, yellow and tiger butterflies "any except rain". Firefly 19:00 to 04:00 near water, except rain. https://nookipedia.com/wiki/Bug/Animal_Crossing/June
- New Horizons common butterfly 04:00 to 19:00, Sep to Jun (northern). Monarch 04:00 to 17:00, Sep to Nov. https://www.nintendolife.com/guides/animal-crossing-new-horizons-bugs-complete-bug-list-times-locations-prices-how-to-catch-tips

### Rain World
- Cosmetic insects are a separate system from creatures. `InsectCoordinator` holds `allInsects` and `swarms`, spawns per room effect with `SpeciesDensity(type)` and `TileLegalForInsect`, and has `NowViewed()` / `NoLongerViewed()` hooks for culling when the room is off screen. https://rwmodding.github.io/api/Global.InsectCoordinator.html
- 11 cosmetic types: Ant, Beetle, FireFly, GrassHopper, Moth, RedSwarmer, RockFlea, StandardFly, TinyDragonFly, Wasp, WaterGlowworm. https://rwmodding.github.io/api/Global.CosmeticInsect.Type.html
- The useful pattern is that level designers paint an insect "effect" with an amount, and the coordinator turns that into density. Kingsfoil could do the same with a per-biome or per-tile insect density map.

### Inferences for Kingsfoil (an MMO with server weather)
- Keep all flying insects client-side and cosmetic. The server already sends weather, wind and time. Each client derives insects from those plus a seed of (tile chunk, day). Zero bandwidth.
- Rules: rain = 0 butterflies, bees, dragonflies, midges, moths. Wind above a threshold = no butterflies (Terraria's 20 mph). Butterflies 06:00 to 15:00 spring and summer, bees 08:00 to 17:00, dragonflies by day near reeds, midges at dawn and dusk over markers, moths and fireflies at night near lamps and water.
- Cap total insects at about 10 to 20 on screen, Stardew's numbers. Spawn off screen. Despawn when more than one screen away.

---

## Q8. Procedural flutter algorithms compared

### Takeaway
Pure per-frame random steering looks twitchy. Every good method keeps state between frames so turns are sustained. Reynolds wander, a random walk on velocity (Stardew firefly), a flap-impulse model (Stardew butterfly), or a noise-sampled heading all do this. Pick by species.

### Cited findings
- Reynolds wander. The steering target sits on a sphere "located slightly ahead of the character". Each frame adds a small random displacement to the previous target. Fresh random forces each frame are "twitchy" and give "no sustained turns". https://www.red3d.com/cwr/steer/gdc99/
- Fruit flies search in a scale-free, intermittent way, benchmarked against Lévy flights with μ = 2. Reynolds & Frye 2007, PLoS ONE 2(4):e354. https://pmc.ncbi.nlm.nih.gov/articles/PMC1831497
- Unity tutorial for 2D butterflies. Particle system with max 10 particles, texture sheet at 10 to 15 fps with the frames played forward then back, and the Noise module for motion. https://anchitsh.github.io/butterflies.html
- Pixel art guides. 8 to 12 fps is standard and 3 to 6 frames are enough for effects. https://pixnote.net/en/learn/animation . A commercial butterfly icon pack uses 3 flap frames. https://coffeeguy-pixelart.itch.io/butterfly-pixel-art-icon

### Inferences: which method for which insect
| Insect | Method | Key params (Kingsfoil, estimates) |
|---|---|---|
| Butterfly | Stardew flap-hop + wander on X | 3 to 4 frames, 60 to 80 ms each, 200 ms rest, cruise 25 to 50 px/s |
| Bee | Target flower, ease in, sit | flight 1 to 3 s, sit 2 to 6 s, 1 px bob, 2-frame blur at 30 to 50 ms |
| Dragonfly | HOVER/DART state machine | hover 0.8 to 3 s, dart 0.1 to 0.25 s over 1 to 3 tiles, 8-dir sprite |
| Midge | Spring to centre + jitter | 8 to 30 pixels, radius 6 to 12 px, update at 15 to 30 Hz |
| Moth | Tangent orbit + stall/dive | ring 6 to 16 px, 2 to 6 per lamp, flip direction on dive |
| Firefly | Velocity random walk (Stardew) | ±0.1 px/frame² steps, cap 1 px/frame. Blink is researcher-specific (see fireflies notes) |

- Lévy flight is right for search over large areas but too jumpy for on-screen ambience. Use it for the long "relocate" leg of a bee or butterfly (pick the next target distance from a heavy-tailed distribution), not per frame.
- Perlin or value noise sampled by (id, time) gives smooth headings with no state. It is handy for GPU or MultiMesh instancing, but it ignores the flap rhythm. Add the flap-hop on top if you use it for butterflies.

---

## Q9. What reads as alive versus random noise

### Takeaway
"Alive" comes from three things working together, plus restraint. Motion is tied to the animation (each flap moves the body). Behaviour has a goal (a flower, a lamp, a marker, a perch). The insect reacts to the player. Random paths with no goal and no reaction read as particles.

### Cited findings
- Reynolds names twitchiness and no sustained turns as the failure mode of naive randomness. https://www.red3d.com/cwr/steer/gdc99/
- BotW bugs flee unless the player crouches and sneaks up, so catching them becomes a stealth mini-game. https://twinfinite.net/guides/zelda-breath-of-the-wild-bugs-lizards-how-to-catch/
- Terraria dragonflies flee "up and away" on approach, and butterflies avoid enemies since 1.4.0.1. https://terraria.wiki.gg/wiki/Dragonflies , https://terraria.wiki.gg/wiki/Butterfly
- Ghost of Tsushima's lead systems designer said ambient animals help a world feel alive and give biomes identity. https://www.gamesradar.com/video-game-animals-stray-ghost-of-tsushima
- GDC 2023 "Living in Procedural" covers making procedural wildlife "feel alive". https://gdcvault.com/play/1028813/AI-Summit-Living-in-Procedural

### Inferences
- Tie motion to frames. Stardew's butterfly only moves up on a flap. Do the same for dragonfly darts (dart starts on a wing-down frame).
- Give each species one target. Butterflies to flowers, bees to flowers with a sit, dragonflies to reeds, midges to a marker, moths to lamps. Insects without a target should leave the screen.
- React to the player at 1.5 to 3 tiles. Butterflies veer and climb, dragonflies dart away, bees ignore you (contrast is good), midges part and re-form.
- Restraint. Stardew caps all critters at 10 to 20 per location. Two or three butterflies on screen read better than twenty.
- Vary per individual. Stardew rolls `flapSpeed` once per butterfly (45 to 80 ms), so a group never flaps in sync.
- Keep sprites on whole pixels. Sub-pixel drift on a 320x180 buffer smears.

---

## Cost notes (estimates unless stated)
- Stardew updates every critter every frame on the CPU with plain objects and a list cap of 10 to 20 (cited code). That is the scale that works.
- All controllers above are a few float ops per insect per frame. 50 insects is negligible in GDScript on mobile (estimate). Draw cost is one sprite each. In Godot, put them all in one node with `_draw()` or a MultiMesh to keep draw calls to one (link Forest's MultiMesh notes).
- Midges and fireflies can be single pixels drawn with `draw_rect`. No textures.
- Moth lamps already exist in the Light study. Fireflies add a light each in Stardew. In Godot Compatibility, 2D lights are limited, so draw firefly glow as an additive sprite or into the low-res light map from Light study, not as Light2D nodes (estimate).
- Network: zero if derived client-side from server weather, time and a chunk seed.

## Overall gaps
- No shipped-game numbers for Hollow Knight, Ori, Spiritfarer or BotW insect motion. Only player-facing behaviour found.
- No Terraria source for `AI_065_Butterflies` was read, only the wiki summary.
- Stardew 1.6 may have changed butterflies (landing). The decompile read here is 1.5.x and has the landing fields unused.
- No midge swarm height above a field marker. No butterfly glide-phase duration.
- No measured ms cost for insects in any web game.

## Sources
- Jantzen & Eisner 2008, hindwings and evasive flight. https://pmc.ncbi.nlm.nih.gov/articles/PMC2575472
- Dudley 1990, Neotropical butterfly kinematics. https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf
- Butterfly robot perception (monarch 3 Hz). https://www.arxiv.org/pdf/2404.16985
- Papilio polytes erratic flight. https://pmc.ncbi.nlm.nih.gov/articles/PMC4590450
- Altshuler et al. 2005, honeybee 230 Hz. https://pmc.ncbi.nlm.nih.gov/articles/PMC1312389
- Chittka et al. 1997, bumblebee flight durations. https://academic.oup.com/beheco/article/8/3/239/187553
- Flight durations under feeding choices. https://cris.huji.ac.il/en/publications/flight-durations-in-bumblebees-under-manipulation-of-feeding-choi/
- Durisko et al. 2011. https://psych.mcmaster.ca/dukas/Durisko%20et%20al%202011.pdf
- Traplining bumblebees 2017. https://link.springer.com/content/pdf/10.1038/s41598-017-04919-8.pdf
- Combes et al., dragonfly strikes. https://sicb.org/?p=17126
- May 1987, dragonfly hovering. https://natuurtijdschriften.nl/pub/593064/AOIOS1987003001007.pdf
- Dragonfly patrol and chase speeds. https://natuurtijdschriften.nl/pub/592070/OJIOS1994023001006.pdf
- Odonata behaviour. https://natuurtijdschriften.nl/pub/591603/OJIOS1983012001005.pdf
- Kelley & Ouellette 2013, midge swarms. https://pmc.ncbi.nlm.nih.gov/articles/PMC3545223
- Midge swarm size and marker. https://pmc.ncbi.nlm.nih.gov/articles/PMC4233756
- Campbell 1974 thesis. https://www.gnatwork.ac.uk/sites/gnatwork/files/content/attachments/2021-02-24/Thesis_Campbell%201974.pdf
- Fabian et al. 2024, insects at artificial light. https://doi.org/10.1038/s41467-024-44785-3 , https://par.nsf.gov/servlets/purl/10503365
- Mongabay summary. https://news.mongabay.com/2024/02/like-a-moth-to-a-flame-science-finally-explains-why-insects-flock-to-artificial-lights/
- Physics Today summary. https://physicstoday.aip.org/news/why-insects-orbit-light-at-night
- Stardew decompile. https://github.com/veywrn/StardewValley
- Terraria butterfly. https://terraria.wiki.gg/wiki/Butterfly
- Terraria dragonflies. https://terraria.wiki.gg/wiki/Dragonflies
- Terraria AI IDs. https://terraria.wiki.gg/wiki/AI_IDs
- Minecraft bee. https://minecraft.wiki/w/Bee
- Nookipedia moth. https://nookipedia.com/wiki/Moth
- Nookipedia June bugs (GameCube). https://nookipedia.com/wiki/Bug/Animal_Crossing/June
- Nintendo Life ACNH bug list. https://www.nintendolife.com/guides/animal-crossing-new-horizons-bugs-complete-bug-list-times-locations-prices-how-to-catch-tips
- Rain World InsectCoordinator. https://rwmodding.github.io/api/Global.InsectCoordinator.html
- Rain World CosmeticInsect.Type. https://rwmodding.github.io/api/Global.CosmeticInsect.Type.html
- Reynolds steering behaviours. https://www.red3d.com/cwr/steer/gdc99/
- Reynolds & Frye 2007, Drosophila search. https://pmc.ncbi.nlm.nih.gov/articles/PMC1831497
- Unity 2D butterflies. https://anchitsh.github.io/butterflies.html
- Pixel art animation basics. https://pixnote.net/en/learn/animation
- Butterfly icon pack (3 frames). https://coffeeguy-pixelart.itch.io/butterfly-pixel-art-icon
- BotW bug catching. https://twinfinite.net/guides/zelda-breath-of-the-wild-bugs-lizards-how-to-catch/
- Ghost of Tsushima animals. https://www.gamesradar.com/video-game-animals-stray-ghost-of-tsushima
- GDC "Living in Procedural". https://gdcvault.com/play/1028813/AI-Summit-Living-in-Procedural
