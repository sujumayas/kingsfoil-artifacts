# 04. Impacts, hit sparks, explosions, area effects and residue

Researcher 04, study VFX #10 "Magic and spell VFX". Date 2026-11-11.

How to read this file. "Cited" means I read the number in the linked source during this session, mostly in source code. "Inference" is my own reasoning or arithmetic. "Unverified" means I know it from memory or saw it only in a search snippet and did not open the page. Code line numbers refer to the master branch on the date above.

Tick conversions used below. Mindustry effects count in ticks at 60 per second (unverified in this session, standard for the engine), so 1 tick = 16.7 ms. Shattered Pixel Dungeon (SPD) uses seconds and a 16 px tile. Diablo 1 logic runs at 20 ticks per second (unverified), so 1 tick = 50 ms.

---

## 1. Anatomy and timing of a hit spark and an explosion

### Takeaway
A hit spark is 4 to 6 frames and lives 230 to 450 ms. An explosion is 8 to 12 frames and lives 330 to 900 ms. Both put the biggest, brightest shape in the first 1 or 2 frames, then shrink, darken and break apart. Build each from the same five layers, and let each layer have its own shorter or longer life inside the effect: ring 30% of the life, sparks 100%, smoke 100 to 200%.

### Cited findings
- Tibia plays every magic effect at a fixed 75 ms per frame. OTClient defines `EFFECT_TICKS_PER_FRAME = 75` in `effect.h` line 34, and the effect removes itself after `75 * animationPhases` ms. One effect (id 33) gets a 4x multiplier, so 300 ms per frame. https://github.com/edubart/otclient/blob/master/src/client/effect.h and https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- Slynyrd (Raymond Schlitter), Pixelblog 31. He blocks an explosion with circles that thin into rings as they grow, then turns the circles into fiery blobs. Expansion is fast at first and then slows. Colour runs from "white hot" to warm hues to gray smoke. After the largest frame the blobs rise and break up. The same ring guide becomes a shockwave. No frame counts or ms in the text. https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- Jason Tom Lee, slash FX tutorial. The readable shape is the climax and "only exists for 1-2 frames". Stray pixels hurt the motion read. https://jasontomlee.itch.io/slashfx/devlog/629732/tutorial-2-slash-shape-fundamentals
- Riot's League of Legends VFX style guide, as summarised by VFX Apprentice. Peak value and saturation arrive within the first quarter of the life. Avoid 0% black and 100% white for the body, and keep the highest values for the impact flash. An effect should not outlive its gameplay use. https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips (guide PDF: https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf)
- Mindustry builds the same anatomy in code, which gives exact layer timings (file `Fx.java`, https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java):
  - `hitBulletSmall`, 14 ticks (233 ms). Colour lerps white to light orange over the life. A ring grows from radius 0 to 5 units during the first 7 ticks only (117 ms), with stroke 1.5 down to 0.5. 5 spark lines fly out to 15 units, and each line shortens from 4 to 1 units.
  - `hitLancer` (lightning hit), 12 ticks (200 ms). All white. 8 lines out to 17 units on an ease-out curve (`finpow`). Stroke goes from 1.5 to 0.
  - `hitLaser`, 8 ticks (133 ms). One ring, radius 0 to 5, plus a light of radius 23 that fades from 0.7.
  - `flakExplosion`, 20 ticks (333 ms). Yellow ring for the first 6 ticks (100 ms), radius 3 to 13, stroke 3 to 0. 5 gray smoke discs out to 25 units, radius 3.5 shrinking to 0.5. 4 orange spark lines. A light of radius 50 at 0.8 fading out.
  - `blastExplosion`, 22 ticks (367 ms). Same recipe, ring to 18 units, smoke discs radius 4.5.
  - `massiveExplosion`, 30 ticks (500 ms). Ring for the first 7 ticks to radius 34. 8 smoke discs out to 32 units.
  - `dynamicExplosion` scales with an intensity value. Smoke life is `43 + 35 * intensity` ticks, fire and sparks life is `26 + 15 * intensity` ticks, and the ring lasts `5 + 2.5 * intensity` ticks. Particle counts are 4 smoke groups of `3 * intensity` discs and `9 * intensity` spark lines. At intensity 1 that is 12 smoke discs, 9 sparks, 1.3 s of smoke and 0.68 s of fire. Smoke uses `pow10Out` for position, so it reaches its final spot almost at once and then only shrinks.
- Shattered Pixel Dungeon bomb, the particle version of the same anatomy. 30 `BlastParticle` at the centre, each an 8 px square, colour `0xEE7722`, additive (`lightMode`), life random 0 to 1 s, launched upward at 32 to 64 px/s with gravity +50. Then 4 `SmokeParticle` on each affected cell, colour `0x222222`, life 0.6 to 1 s, drift at most 4 px/s sideways and 8 px/s vertically. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/BlastParticle.java and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/bombs/Bomb.java
- SPD `Splash` (blood and hit splash). 4 px shrinking squares, life 0.5 to 1.0 s, speed 40 to 80 px/s inside a cone, gravity +100. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Splash.java
- Vlambeer's "Art of Screenshake" talk lists "bigger explosions" and "more permanence (smoke)" as separate steps. Talk: https://www.youtube.com/watch?v=AJdEqssNZ-U. Breakdown of a recreation: https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects

### Inferences
Layer table for Kingsfoil. Times are a proposal built from the numbers above.

| Layer | Starts | Lasts | Shape and colour | Source of the number |
|---|---|---|---|---|
| Flash frame | 0 ms | 1 frame (50 to 75 ms) | Largest shape, pure highlight colour, no shading | LoL "peak in first quarter", Tibia 75 ms |
| Bright core | 0 ms | 100 to 150 ms | White-hot centre shrinking to element colour | Mindustry ring ends at 100 to 117 ms |
| Ring or shock line | 0 ms | 30% of life | 1 to 3 px stroke that thins as radius grows | Mindustry 6 of 20 ticks |
| Sparks and debris | 0 ms | 100% of life | 4 to 8 lines or pixels, ease-out distance | Mindustry 4 to 9, SPD 30 small |
| Smoke | 50 to 100 ms | 100 to 200% of life | 3 to 5 dark blobs that shrink in place and rise | Mindustry 5 to 12, SPD 4 per cell |
| Residue | at the end | seconds | Scorch decal, see section 5 | Mindustry 60 s |

- The 75 ms rule from the combat-juice study matches Tibia's fixed effect clock exactly. Keep one clock for all flipbooks. A 5 frame spark then lasts 375 ms and an 8 frame explosion 600 ms.
- "Hold the first frame". With a fixed 75 ms clock the first frame already holds for 4.5 display frames at 60 Hz. Do not hold longer than 2 clock frames (150 ms) or the spark lags behind the hitstop.
- "Start big, then shrink and darken" is the same rule in all four code bases. Mindustry does it with `fout()` on size and a colour lerp, SPD with `PixelParticle.Shrinking`, Slynyrd with white to warm to gray.
- Breaking up the shape. In a flipbook the artist cuts holes that grow from the centre, because the centre cools last in fire but clears first in a ring. In code the cheap version is an ordered-dither threshold that rises with `t`, so the sprite erodes without alpha.
- Value budget. Only the flash frame may use the palette's pure white. The body of the explosion sits one or two ramp steps lower. This keeps 30 stacked explosions from turning into one white blob.

### Gaps
- Pedro Medeiros (saint11) has Explosion, Impact, Smoke, Fire, Electric, LightMagic and DarkMagic tutorials, but they are GIF images with the advice drawn inside. I could not read them as text. Index: https://saint11.art/blog/pixel-art-tutorials/. Someone should view them by eye and note the frame counts.
- Slynyrd's dedicated "Pixelblog 84 Explosions" is referenced by an Aseprite forum post but I did not find the page. https://community.aseprite.org/t/wip-aerial-explosion/20902
- Penusbmic's "Understanding Explosions" is a paid video. https://penusbmic.itch.io/pixel-art-tutorial-understanding-explosions
- No numbers found from AdamCYounis, Sandy Gordon, BDragon1727 or CodeManu, and none from Dead Cells or Hyper Light Drifter write-ups. No fighting-game hit-spark frame data found.

---

## 2. Procedural impacts in code and the stateless pattern

### Takeaway
Mindustry's whole effect library is the pattern to copy. An effect is one function of `(id, time, lifetime, x, y, rotation, colour)`. It stores no particles. Each frame it reseeds a random generator with the effect's id and regenerates the same particle directions, then scales them by `fin` or `fout`. An impact costs one small struct in memory and 5 to 20 draw primitives.

### Cited findings
- `Effect.java`. An effect has a `lifetime` in ticks (default 50) and a `clip` size (default 50 units). `create()` returns at once if effects are disabled or if the camera rectangle does not overlap the clip box, so off-screen effects cost nothing. The live state is a pooled `EffectState` holding position, rotation, colour, time and a data pointer. https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java
- The interpolation idiom. `fin() = time / lifetime` (line 326). `fout()` is `1 - fin`. `finpow()` is an ease-out of `fin`. `e.scaled(n, ...)` runs a nested block with its own shorter lifetime `n` and skips it once `time > n`. That one helper is how a ring lives for 6 ticks inside a 20 tick explosion.
- `Angles.randLenVectors(seed, amount, length, callback)` calls `rand.setSeed(seed)` and then loops `amount` times, producing a vector with a random angle of 0 to 360 and a random length of 0 to `length`. Because the seed is the effect id, every frame yields the same vectors. Variants add a cone (`angle`, `range`) and pass per-particle `fin` and `fout`. https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/math/Angles.java (lines 109 to 156)
- Scale of the library. `Fx.java` has 267 `new Effect(` definitions and 130 calls to `randLenVectors`. Median lifetime is 30 ticks (500 ms). The 90th percentile is 100 ticks (1.67 s). The most common particle counts per call are 2, 4, 5 and 6. Only 8 calls use 20 or more. These counts come from my grep of the file and are approximate.
- SPD takes the stateful route. A pooled `Emitter` recycles particle objects with position, speed and acceleration. Typical values: `Speck` sprites are 7x7 px cells of one sheet. `ROCK` and `BONE` live 0.2 s. `STAR` lives 1 s with speed up to 128 px/s and gravity 128. Gas specks (`TOXIC`, `CORROSION`, `PARALYSIS`, `STORM`, `INFERNO`, `BLIZZARD`) live a random 1 to 3 s. `SMOKE` lives 1 to 1.5 s. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Speck.java
- SPD `MagicMissile` trails pour one particle every 0.01 s (100 per second) from a 4 px emitter for bolts, and every 0.03 s from a 10 px emitter for cone spells. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
- SPD `Flare` (holy or level-up star) is a triangle fan of `nRays` rays that spins at 180 degrees per second. With a duration set it scales and fades as one value. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Flare.java
- Cogmind defines each ASCII explosion as a script in an external text file. The dev reports 29 explosion styles and 29 hours spent on one batch of particle effects (developer-reported). https://www.moddb.com/news/ascii-particle-effects and https://www.moddb.com/news/more-ascii-particle-effects

### Inferences
- Stateless effects fit a server-authoritative MMO. The server sends `(effect id, tile, seed or tick)`. Every client draws the same sparks without syncing particles. A client that joins late or scrolls the effect into view can start mid-life because the effect is a pure function of time.
- Stateless effects cannot collide or react. Sparks that must bounce on walls need state. For impacts that live under 1 s nobody notices.
- In Godot the pattern maps to one `Node2D` with a `_draw()` that loops over all live effects, or to one `MultiMesh`. Avoid one `CPUParticles2D` node per impact for a 73 tile area.

### Pseudocode: stateless impact effect

```
# One live effect is 16 bytes: kind, x, y, t0, seed, dir
function draw_impact(e, now):
    t = (now - e.t0) / LIFE[e.kind]            # 0..1, fin
    if t >= 1: free(e); return
    fout = 1 - t
    ease = 1 - (1 - t)^3                        # finpow, fast then slow

    # 1. flash frame: first 60 ms only
    if now - e.t0 < 60:
        blit(FLASH_SPRITE[e.kind], e.x, e.y, color = WHITE)

    # 2. ring: first 30% of the life
    if t < 0.3:
        rt = t / 0.3
        ring(e.x, e.y, radius = 2 + rt * 10, thickness = round(3 * (1 - rt)))

    # 3. sparks: same directions every frame because the seed is fixed
    rng = seeded(e.seed)
    for i in 0 .. 5:
        ang = e.dir + rng.range(-0.9, 0.9)       # cone around the hit direction
        len = rng.range(6, 16) * ease
        px = round(e.x + cos(ang) * len)         # whole pixels only
        py = round(e.y + sin(ang) * len)
        line(px, py, ang, length = 1 + fout * 3,
             color = RAMP[e.kind][floor(t * RAMP_STEPS)])   # bright to dark by palette step

    # 4. smoke: reaches its place fast, then only shrinks and rises
    rng2 = seeded(e.seed + 1)
    for i in 0 .. 3:
        a = rng2.range(0, TAU); l = rng2.range(2, 10) * (1 - (1 - t)^6)
        disc(round(e.x + cos(a) * l), round(e.y + sin(a) * l - t * 4),
             radius = round(fout * 3), color = SMOKE_DARK)
```

### Gaps
- Noita and Brogue were not checked. Brogue is open source and its `flashes` and `lightFlash` code would give ASCII explosion timings.
- No measured frame cost for the stateless pattern in Godot Compatibility. It needs a test in the sandbox.

---

## 3. Area effects on a tile grid

### Takeaway
Tibia's area look is one small flipbook per tile over a 0/1 mask, all started in the same tick. It reads as one big spell because every tile runs the same animation in phase. It reads as a wave only when the server or client delays the tiles by distance from the centre. The delay per ring should be 50 to 60 ms, which is under one 75 ms effect frame, so neighbouring rings overlap in time.

### Cited findings
- The Forgotten Server defines areas as small matrices where 1 is a hit tile and 3 is the caster. `AREA_CIRCLE3X3` is a 7x7 matrix with 37 hit tiles. `AREA_CIRCLE5X5` is 11x11 with 73 hit tiles (rows 1, 5, 7, 9, 9, 11, 9, 9, 7, 5, 1). The file defines 18 area shapes. https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua
- Hell's Core ("exevo gran mas flam", a UE) is a combat with `COMBAT_PARAM_EFFECT = CONST_ME_FIREAREA` over `AREA_CIRCLE5X5`. The engine sends the same effect on all 73 tiles in one execution. Cooldown is 40 s. https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/hells_core.lua
- A boss UE in Canary uses a 13x13 mask with 101 tiles and calls `pos:sendMagicEffect(CONST_ME_FIREAREA)` per tile from a target-tile callback. https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/spells/monster/mawhawk_ue.lua
- Canary's chain spells schedule each hop with `delay = i * max(50, COMBAT_CHAIN_DELAY)` ms, so the floor is 50 ms per hop. https://github.com/opentibiabr/canary/blob/main/src/creatures/combat/combat.cpp (line 1439)
- Several Canary monster spells stagger effects with `addEvent` plus `sendMagicEffect`. Examples I listed but did not read line by line: `doctor_marrow_explosion.lua`, `gaz'haragoth_death.lua`. https://github.com/opentibiabr/canary/tree/main/data-otservbr-global/scripts/spells/monster
- The maintained OTClient fork has code that delays drawing a new effect when another effect is still young on the same tile. It sets `m_timeToStartDrawing` from the earlier effect's duration divided by 3, or by 1.5 when the client is in optimise mode. This is my reading of a few lines, not the whole function. https://github.com/mehah/otclient/blob/main/src/client/effect.cpp (lines 137 to 145)
- Mindustry's `shockwaveDust` is a ring-by-ring area in code. Rings are 12 units apart. Ring `i` fires after `i * 3.5` ticks (58 ms). Each ring places `circumference / 6` dust puffs and each puff appears with chance `0.7 - 0.02 * i`, so outer rings are sparser. https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java (line 269)
- Diablo 1 Nova is a ring of missiles. DevilutionX fires at 9 offsets on a quarter circle of radius 4 tiles, mirrored 4 ways, so 36 missile spawns with the 4 axis directions doubled, which gives 32 unique directions. The controller missile lives 1 tick. https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp (line 3280)
- Diablo 1 Fire Wall. Duration is `10 * (spell level + 1) * 16` ticks plus the dungeon level for traps. At spell level 1 that is 320 ticks. The flame has a start animation, a looping idle that begins on a random frame of 11, and the start animation played backward to end. A light ramps through 12 radius steps from 2 to 12. Same file, lines 1954 and 3060.
- Diablo 1 Flash lasts 19 ticks. Same file, line 2118.
- Diablo II Blizzard drops one shard every 4 frames and stops after 28 shards (unverified, from a search snippet, likely https://diablo2.diablowiki.net/Blizzard).
- League of Legends. Riot says gameplay clarity beats theme and that VFX updates first fix "inaccurate hitbox indicators". Indicator size must be identical across all skins of a spell. https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- In the LoL guide the primary element carries the hitbox. It gets high value, a clear silhouette and high opacity. Secondary elements get lower value and lower opacity. https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- Riot artists say the area of focus must be the part that communicates gameplay. For a missile that is the tip. https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-2-what-are-we-communicating-with-our-vfx/13062

### Inferences
- Why the Tibia UE reads as a wave even with zero delay. All tiles are in phase, the fire sprite itself grows from the tile centre, and the diamond-like mask has a clear outer edge. The eye groups 73 identical in-phase sprites as one event. Out-of-phase tiles would read as 73 small fires.
- Ring delay rule. Use Chebyshev distance for square waves and rounded Euclidean distance for circles. 55 ms per ring over 5 rings is 275 ms from centre to edge, then 600 ms of animation. Total 875 ms. Damage should land on the server tick, not on the ring arrival, so the delay is client-side decoration. For a spell where the wave is the gameplay (dodgeable), the server must own the ring timing.
- Matching the visual to the area. In a tile game the rule is easy to enforce. Draw the effect from the same mask the server uses and never let a tile sprite's bright pixels leave its 32x32 cell in the first frames. Soft parts such as smoke may cross the border. The bright core may not.
- Send the area as `(spell id, origin, direction)` and let the client expand the mask. 73 separate effect messages cost about 7 bytes each in the Tibia protocol (1 opcode, 5 position, 1 effect id, my estimate), so 511 bytes for one UE. One message with a mask id costs under 10 bytes.
- Do not draw 73 flipbook nodes. Draw one `MultiMesh` or one `_draw()` loop over the mask with a shared frame index plus the ring offset.
- Meteor-style spells need three beats. A target marker or growing shadow for the fall time, the impact with a flash and ring, then residue. The marker is the hitbox, so it follows the primary-element rule above.

### Pseudocode: ring-by-ring tile area

```
# mask: 2D array of 0/1, centre at (cx, cy) in mask space
# built once per spell; rings[d] = list of tile offsets at distance d
function build_rings(mask, cx, cy):
    for each (mx, my) where mask[my][mx] == 1:
        d = round(sqrt((mx - cx)^2 + (my - cy)^2))     # or max(|dx|, |dy|) for a square wave
        rings[d].append((mx - cx, my - cy))

RING_DELAY = 55 ms          # under one 75 ms effect frame
FRAME_MS   = 75
FRAMES     = 8

function draw_area(a, now):                  # a = {origin_tile, t0, rings, seed}
    done = true
    for d in 0 .. len(a.rings) - 1:
        local = now - a.t0 - d * RING_DELAY
        if local < 0: done = false; continue
        frame = floor(local / FRAME_MS)
        if frame >= FRAMES: continue
        done = false
        for (ox, oy) in a.rings[d]:
            tile = a.origin_tile + (ox, oy)
            if not on_screen(tile) or blocked(tile): continue
            flip = hash(a.seed, ox, oy) & 1          # mirror half the tiles so the grid is less obvious
            blit(SHEET, frame, tile * 32, flip_h = flip)
    if done: free(a)
```

### Gaps
- No Hades or Path of Exile ground-effect build notes found.
- Diablo II Nova and Frost Nova missile counts and Meteor delay were not confirmed. OpenDiablo2 or the `Missiles.txt` data would have them.
- I did not find a Canary script with an explicit ring-by-ring UE delay value. The 50 ms chain floor and Mindustry's 58 ms are the closest cited numbers.

---

## 4. Shockwave rings

### Takeaway
Draw the ring as geometry. A circle outline whose radius eases out and whose stroke thins to zero in 150 to 200 ms does the job, and it costs a few hundred pixels. A screen-distortion shader makes Godot copy the whole screen to a back buffer, so keep it for one boss spell at a time or skip it.

### Cited findings
- Mindustry `shockwave`. 10 ticks (167 ms). Radius grows linearly from 0 to 28 units, which is 3.5 of its 8 unit tiles (tile size unverified). Stroke goes from 2.2 to 0.2. Colour lerps white to light gray. `bigShockwave` reaches 50 units with stroke 3 to 0 in the same 10 ticks. `spawnShockwave` takes 20 ticks. `Fx.java` lines 1626 to 1648.
- Inside explosions the ring is shorter than the effect. 6 of 20 ticks in `flakExplosion`, 7 of 30 in `massiveExplosion`.
- SPD `BlastWave` is one sprite that scales from 0 to full size while alpha goes from 1 to 0 over `TIME_TO_FADE = 0.2` s. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfBlastWave.java
- Godot docs. In 2D, when a node with `hint_screen_texture` is about to draw, "Godot does a full-screen copy to a back-buffer". Later nodes reuse that copy, so overlapping distortions do not see each other. A `BackBufferCopy` node can copy a rectangle instead of the full screen. Reads outside the copied rectangle are undefined. https://docs.godotengine.org/en/4.4/tutorials/shaders/screen-reading_shaders.html
- Slynyrd derives the shockwave from the same thinning-ring guide as the explosion. https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design

### Inferences
- Cost of the distortion shader. One full-screen copy per frame while any shockwave is alive, plus one textured quad with a dependent texture read. If the game renders into a 320x180 SubViewport and the shader runs inside it, the copy is 57,600 pixels, which is small. If it runs on the upscaled 1280x720 canvas the copy is 921,600 pixels, 16 times more. Thirty shockwaves share one copy, but they cannot stack. No measured numbers found for WebGL2. Treat this as an estimate to test.
- Distortion also smears pixel art off the grid. Quantise the UV offset to whole source pixels or the ring looks like a blur from another game.
- Cheap fakes that stay on the palette:
  - A midpoint-circle outline drawn 1 to 3 px thick in a highlight colour.
  - A dithered ring. Draw the ring only where an ordered-dither threshold is below `fout`, so it breaks into dots as it dies.
  - A ring of 8 or 16 dust sprites that move outward (Mindustry `shockwaveDust`).
  - A tile-space ring. Brighten ground tiles at distance `d` for one frame each, using the ring table from section 3.
  - A 2 to 4 px radial displacement of nearby grass or props, reusing the trail map from the grass study.
- Thickness rule. Start at 3 px and drop one pixel at 40% and at 75% of the life. A ring that keeps its thickness reads as a solid object and not as a pressure wave.

### Pseudocode: expanding ring

```
function draw_ring(cx, cy, t):                 # t = 0..1 over 180 ms
    r     = round(R_MAX * (1 - (1 - t)^2))      # ease-out, fast then slow
    thick = t < 0.4 ? 3 : (t < 0.75 ? 2 : 1)
    color = t < 0.25 ? WHITE : (t < 0.6 ? LIGHT : MID)
    for k in 0 .. thick - 1:
        midpoint_circle(cx, cy, r - k, function (x, y):
            # dither break-up in the last 40%
            if t > 0.6 and BAYER4[y & 3][x & 3] / 16 < (t - 0.6) / 0.4: return
            put_pixel(x, y, color))

function midpoint_circle(cx, cy, r, plot):
    x = r; y = 0; err = 1 - r
    while x >= y:
        for (sx, sy) in 8 octant mirrors of (x, y): plot(cx + sx, cy + sy)
        y += 1
        if err < 0: err += 2 * y + 1
        else: x -= 1; err += 2 * (y - x) + 1
```

A ring of radius 48 px touches about 300 pixels per stroke pixel of thickness (circumference 2 * pi * 48). That is under 1,000 pixels for the thickest frame.

### Gaps
- No measured cost of `hint_screen_texture` or `BackBufferCopy` on WebGL2 or mobile found.
- No source found for a shipped pixel-art game that documents its shockwave shader settings.

---

## 5. Residue and lingering fields

### Takeaway
Two kinds of residue need two different rules. Cosmetic residue (scorch, frost, crater) should be dim, capped and gone in 10 to 60 s. Gameplay residue (damage fields) must stay as visible as a hostile telegraph for its whole life and must show how much life is left. Player complaints in PoE 2 and Diablo IV are all about the second kind being treated like the first.

### Cited findings
- Mindustry scorch decals live 3600 ticks (60 s). Alpha stays at 1 and drops only in the last 2% of the life (`1 - curve(fin, 0.98)`), which is 1.2 s. They draw on a dedicated `Layer.scorch` under units. Scorch sprites come in 10 sizes with 3 variants each and a random rotation in 90 degree steps. Decals are pooled and are not placed on tiles without a surface (such as deep water or space). They are not serialised or synced. https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/Effect.java (lines 230 to 256) and https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/entities/comp/DecalComp.java
- Tibia fire fields in The Forgotten Server decay in 3 stages. Item 1487 lasts 120 s and deals 20 on entry then 10 every 10 s for 7 ticks. It decays to 1488 (120 s, 10 damage ticks, no entry damage), which decays to 1489 (120 s, no damage listed), which decays to nothing. Total 360 s. Poison gas (1490) lasts 120 s. Energy field (1491) lasts 120 s with 30 on entry. Each stage is a different, smaller sprite. https://github.com/otland/forgottenserver/blob/master/data/items/items.xml (item ids 1487 to 1491)
- Path of Exile 2 forum threads report that dangerous ground effects are hard to see, that players cannot tell their own ground effects from enemy ones, and that cold ground looks like the player's own chill. Players ask for a thin ground border on the real hit area, green for allies and red for enemies, and for a transparency setting on allied effects. https://www.pathofexile.com/forum/view-thread/3626389 , https://www.pathofexile.com/forum/view-thread/3843075 , https://web.poecdn.com/forum/view-thread/3690131
- Diablo IV players ask for effect toggles and an opacity slider. The complaint centres on a class whose persistent ground effects hide the fight for everyone nearby. The article says the game already lowers visibility of some minions and traps for other players. https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/
- LoL guide. Effects should not persist past their mechanical use, and lingering particles add overdraw. https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- SPD gas clouds are made of specks that live 1 to 3 s and are re-emitted while the gas exists, so the cloud's density follows the gameplay state. `Speck.java`, link in section 2.

### Inferences
- Lifetime proposal for cosmetic decals in a crowded MMO. 8 to 15 s for hit scorch, 30 to 60 s for a UE crater. Mindustry's 60 s works there because buildings are sparse. With 30 casters at one UE per 40 s each, 60 s decals would cover the screen.
- Fade without alpha. Give each decal 3 or 4 palette steps toward the ground colour and switch steps at 50%, 75% and 90% of the life, or erase pixels with an ordered-dither threshold in the last 20%. Both are world-locked, as in the fog study.
- Cap. 64 live decals per screen is plenty. When full, recycle the oldest. If a new decal lands on a tile that already has one of the same kind, refresh the old one's timer and do not add a new one.
- Stamping. The cheapest decal layer is one low-res texture per screen chunk that decals are drawn into once. Fading then needs a redraw of that chunk, so stamp only decals that never fade until the chunk unloads (blood in Nuclear Throne style, unverified). For fading decals keep a ring buffer and draw them every frame in one batch.
- Gameplay fields follow Tibia. The sprite changes with the remaining life, and 3 stages are enough. The field always draws at full opacity for every viewer, even under the "others" effect tier. Give friend and foe fields a different border colour and shape, as the PoE players ask.
- Smoke should drift 4 to 8 px/s at most (SPD values) and live 0.6 to 1.5 s. Longer smoke hides the next telegraph.

### Pseudocode: decal layer with a cap

```
MAX_DECALS = 64
decals = ring buffer of {kind, tx, ty, t0, life, variant, rot}   # fixed array, head index

function add_decal(kind, tx, ty, now):
    if not ground_accepts_decals(tx, ty): return        # water, void, stairs
    for d in decals:                                    # merge on the same tile
        if d.kind == kind and d.tx == tx and d.ty == ty:
            d.t0 = now; return
    slot = decals[head]; head = (head + 1) % MAX_DECALS  # overwrites the oldest
    slot = {kind, tx, ty, t0 = now, life = LIFE[kind],
            variant = hash(tx, ty) % 3, rot = hash(ty, tx) % 4}

function draw_decals(now):                              # one batch, below characters
    for d in decals:
        t = (now - d.t0) / d.life
        if t >= 1 or not on_screen(d): continue
        step = t < 0.5 ? 0 : (t < 0.75 ? 1 : (t < 0.9 ? 2 : 3))   # palette steps toward ground
        blit(DECAL_SHEET[d.kind][d.variant], d.tx * 32, d.ty * 32,
             rot90 = d.rot, palette_row = step)

# Gameplay fields are NOT in this buffer. They are server entities with stages:
#   stage = floor(3 * elapsed / total)   -> big flame, small flame, embers
```

### Gaps
- Divinity: Original Sin surfaces were not researched.
- No official patch notes found that show GGG or Blizzard changing ground-effect visibility.
- No cited decal cap from a shipped 2D game. The 64 is my proposal.

---

## 6. Element-specific impacts

### Takeaway
Each element needs a different motion after the flash, so that a player who cannot see colour can still tell them apart. The cited code gives parameters for fire, lightning, poison gas and holy. Ice and dark are my proposals.

### Cited findings
- Fire. Burst then gravity. SPD `BlastParticle` uses orange `0xEE7722`, additive, 8 px, launched in the upper half circle at 32 to 64 px/s, life up to 1 s. Mindustry fire hits lerp from light flame to dark flame colour over 14 ticks with 2 sparks in a 50 degree cone along the hit direction (`hitFlameSmall`).
- Lightning. SPD `Lightning` lasts 0.3 s in total. Each arc is 2 segments with the midpoint moved by a random -4 to +4 px on both axes. Alpha is `life / DURATION`, a straight fade. Mindustry `hitLancer` is all white, 12 ticks, 8 lines. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java
- Poison and gas. SPD gas specks live 1 to 3 s and rotate slowly at 30 degrees per second. `BUBBLE` specks live 0.8 to 1.5 s. Tibia poison is a field for 120 s.
- Holy. SPD `Flare` is a ray fan spinning at 180 degrees per second that grows and fades in. `LIGHT` specks live 1 s and rotate at 90 degrees per second. `HEALING` specks live 1 s.
- Debris. SPD `ROCK` falls at 64 px/s for 0.2 s with random spin up to 360 degrees per second and scale 1 to 2. `BONE` flies out at 120 px/s for 0.2 s with gravity 128.
- Explosion colour order. White hot, then warm hues, then gray (Slynyrd, link in section 1).

### Inferences
Proposed vocabulary. Frames are at 75 ms.

| Element | Flash | Main motion | Tail | Residue |
|---|---|---|---|---|
| Fire | 1 frame white-yellow disc | Blobs expand fast then slow, 4 to 6 frames | 3 to 5 embers rise 8 to 16 px over 600 ms | Scorch decal, 10 to 15 s |
| Ice | 1 frame white star with 4 or 8 points | 5 to 7 angular shards fly out, fall and slide 4 to 8 px | Frost ring, 1 px, expands on the ground | Frost patch, 8 s, dither fade |
| Lightning | 2 or 3 frame strobe, white then element colour then white | Branching bolt redrawn with a new seed each frame | 2 to 4 sparks hop along the ground for 200 ms | Small scorch, or none |
| Poison | No white flash, a dull green pop | Blob splats flat, 4 frames | Bubbles rise and pop for 800 to 1500 ms, drips fall | Puddle field if the spell leaves one |
| Holy | 1 frame white vertical ray, 3 px wide | Ring expands on the ground, ray narrows to 1 px | 4 to 6 sparkles twinkle slowly for 1 s | None |
| Dark | Inverse flash, a dark disc with a bright rim | 6 to 8 particles move inward for 150 ms, then burst out for 150 ms | Wisps curl downward | Dark stain, 8 s |

- Lightning strobe and photosensitivity. 3 alternations in 225 ms is within the "3 flashes per second" limit only if the flashing area is small. Keep the strobe on the bolt and the hit tile. Never strobe the full screen. A reduce-flash setting should replace the strobe with a single held frame.
- Implosion in stateless code is the same spark loop with `len = L * (1 - ease)` for the first half and `len = L * ease` for the second half.
- Poison should skip the white flash on purpose. A hit without a flash reads as "soft and wet", and it leaves pure white free for fire, ice, lightning and holy.

### Gaps
- No artist source with frame counts per element found. The saint11 Electric, LightMagic and DarkMagic GIFs would help here. https://saint11.art/blog/pixel-art-tutorials/
- Ice shard behaviour and the dark implosion timing have no citation.

---

## 7. Cost

### Takeaway
Flipbook memory is small. Fill rate is the real cost. Thirty 64x64 explosions with 3 layers each cover more than 6 full 320x180 screens of pixels. Draw effects into the low-res buffer, keep the bright core small, and cap layers per tier.

### Cited findings
- Particle counts in shipped games. Mindustry uses 2 to 9 primitives per hit and about 21 for a standard explosion at intensity 1 (12 smoke, 9 sparks). SPD uses 30 small particles for a bomb plus 4 smoke per neighbouring cell, which is 30 + 36 = 66 for a 3x3 blast. SPD projectile trails emit 100 particles per second from one emitter.
- Mindustry culls an effect at creation if its clip box (default 50 units, up to 500 for big explosions) is off camera, and has a global `enableEffects` switch. `Effect.java` lines 140 to 148.
- Tibia sends one effect per tile. A UE is 73 flipbooks at once. A boss UE is 101.
- Godot copies the full screen for the first screen-reading shader in a frame. Link in section 4.
- LoL guide. Stacked alpha layers make silhouettes unreadable in team fights, and lingering particles cost overdraw. Link in section 1.

### Inferences (arithmetic)
Flipbook memory, uncompressed RGBA8 in VRAM.

| Sheet | Pixels | Bytes |
|---|---|---|
| 5 frames of 32x32 (hit spark) | 5,120 | 20 KB |
| 8 frames of 32x32 (tile effect) | 8,192 | 32 KB |
| 8 frames of 64x64 (explosion) | 32,768 | 128 KB |
| 12 frames of 96x96 (big explosion) | 110,592 | 432 KB |
| 1024x1024 atlas | 1,048,576 | 4 MB, holds 1,024 frames of 32x32 or 256 of 64x64 |

- 40 tile effects of 8 frames at 32x32 fit in one 1024x512 texture, 2 MB. Memory is not the limit. Use a palette-indexed sheet (1 byte per pixel plus a ramp row) to recolour one explosion for every element and cut it by 4.
- Overdraw. One 64x64 quad is 4,096 pixels. An explosion with core, sparks and smoke as 3 full quads is 12,288 pixels. 30 at once is 368,640 pixels, which is 6.4 times the 57,600 pixels of a 320x180 buffer. Drawn on a 1280x720 canvas the same effects cover 16 times more pixels, 5.9 million per frame.
- A 73 tile UE is 73 * 1,024 = 74,752 pixels per layer, 1.3 screens at 320x180. Thirty players casting UEs in the same frame is 39 screens of overdraw for one layer. This is the case that needs the "others" tier. Draw other players' area spells as the ring wave outline plus every second tile, and skip smoke.
- Budget proposal per impact. Own spells get up to 12 primitives plus a flipbook. Party gets 6. Others get the flipbook only, or 3 primitives. Hostile spells aimed at you get the full set. Global cap of 256 live stateless effects, 4 KB of state at 16 bytes each.
- Additive blending is unavailable or risky on a strict palette. A big additive explosion also saturates to white when stacked. Use the palette ramp and the value budget from section 1.

### Gaps
- No measured ms per frame for any of this on WebGL2. All overdraw figures are arithmetic. The sandbox should measure 30, 100 and 300 stateless effects and a 73 tile area at 320x180 and at 1280x720.
- Tibia effect sprite sizes and phase counts were not read from the data files. Most are 32x32 and some are 64x64 (unverified).

---

## See it in action

| Game or source | URL |
|---|---|
| Mindustry, all effects in one file | https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java |
| Mindustry, game page | https://mindustrygame.github.io/ |
| Shattered Pixel Dungeon, game page | https://shatteredpixel.com/shatteredpd/ |
| Shattered Pixel Dungeon, effects folder | https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects |
| Tibia, official site | https://www.tibia.com/ |
| Tibia UE in server data (Hell's Core) | https://github.com/opentibiabr/canary/blob/main/data/scripts/spells/attack/hells_core.lua |
| OTClient effect drawing | https://github.com/edubart/otclient/blob/master/src/client/effect.cpp |
| Diablo 1 via DevilutionX (Nova, Fire Wall, Flash) | https://github.com/diasurgical/devilutionX/blob/master/Source/missiles.cpp |
| League of Legends VFX style guide (PDF) | https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf |
| League of Legends VFX updates dev post | https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/ |
| Path of Exile 2 ground effect threads | https://www.pathofexile.com/forum/view-thread/3626389 |
| Diablo IV effect toggle requests | https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/ |
| Cogmind ASCII particle effects | https://www.moddb.com/news/ascii-particle-effects |
| Nuclear Throne and "The Art of Screenshake" | https://www.youtube.com/watch?v=AJdEqssNZ-U |
| saint11 tutorial index (Explosion, Impact, Smoke GIFs) | https://saint11.art/blog/pixel-art-tutorials/ |
| Slynyrd Pixelblog 31, explosions and projectiles | https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design |

## Sources

Code read in this session
- Mindustry `Fx.java`, `Effect.java`, `DecalComp.java`. https://github.com/Anuken/Mindustry
- Arc `Angles.java`. https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/math/Angles.java
- Shattered Pixel Dungeon `Speck.java`, `Flare.java`, `Splash.java`, `Lightning.java`, `MagicMissile.java`, `BlastParticle.java`, `SmokeParticle.java`, `Bomb.java`, `WandOfBlastWave.java`. https://github.com/00-Evan/shattered-pixel-dungeon
- OTClient `effect.h`, `effect.cpp`. https://github.com/edubart/otclient and fork https://github.com/mehah/otclient
- The Forgotten Server `data/scripts/lib/spells.lua`, `data/items/items.xml`. https://github.com/otland/forgottenserver
- Canary `hells_core.lua`, `mawhawk_ue.lua`, `combat.cpp`. https://github.com/opentibiabr/canary
- DevilutionX `Source/missiles.cpp`. https://github.com/diasurgical/devilutionX

Articles and docs read in this session
- Slynyrd Pixelblog 31. https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- Slynyrd Pixelblog 53 (hit frames held longer, no effect numbers). https://www.slynyrd.com/blog/2024/11/25/pixelblog-53-punches-and-kicks
- Jason Tom Lee slash tutorial. https://jasontomlee.itch.io/slashfx/devlog/629732/tutorial-2-slash-shape-fundamentals
- VFX Apprentice summary of the LoL guide (secondary source). https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- Godot screen-reading shaders. https://docs.godotengine.org/en/4.4/tutorials/shaders/screen-reading_shaders.html

Seen only as search snippets (unverified)
- Riot VFX updates post and realtimevfx missile anatomy thread.
- PoE forum threads and the Icy Veins Diablo IV article.
- Cogmind ModDB posts.
- Diablo II Blizzard shard timing.
- Vlambeer talk outline.

Blocked or unreadable
- saint11 tutorials (images only). PC Gamer "How great game explosions are made" (truncated). Reddit explosion breakdown and OpenGameArt pages (403). The nexus.leagueoflegends.com article (redirects to the home page).

Scratch files with the downloaded source are in `studies/vfx-magic/notes/scratch-04/dl/`.
