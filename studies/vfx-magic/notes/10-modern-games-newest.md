# 10. Modern pixel and top-down action games, and what is new (mid-2025 to Nov 2026)

Researcher 10, VFX #10 Magic and spell VFX. Written 2026-11-11.

Read this first. About 34 tool calls went into this file. Open-source code gave the best numbers (Mindustry, Shattered Pixel Dungeon, tModLoader). Many of the commercial games on the brief have no fetched developer source in this session. Those rows are marked UNVERIFIED and come from my memory, so treat them as leads to check, not as findings. Three wikis returned 403 (Stardew) or had no public docs in search results (Hammerwatch, Noita shader files).

Labels used below:
- CITED = I fetched the source this session.
- SEARCH = seen only in a search result summary, not the page itself.
- UNVERIFIED = from memory, no source fetched.
- INFERENCE = my own reasoning or arithmetic.

---

## Q1. How do open-source games declare an effect in a few lines?

### Takeaway
An effect can be one lifetime number plus one draw function of normalised time. No particle objects, no stored random state. Mindustry ships about 300 effects this way. Shattered Pixel Dungeon ships its whole spell look with 34 effect classes and pooled emitters. This is the cheapest authoring model I found, and it fits a Godot `_draw()` loop or a canvas demo.

### Cited findings

Mindustry (`Fx.java`, `Effect.java`)
- Declaration form is `new Effect(lifetime, [clipSize], renderer)`. Lifetime is in ticks. The lambda draws from `e.fin()` and `e.fout()` (0 to 1 progress and its inverse). CITED: https://raw.githubusercontent.com/Anuken/Mindustry/master/core/src/mindustry/content/Fx.java
- `hitBulletSmall = new Effect(14, e -> {`. 14 ticks, 5 sparks via `randLenVectors(e.id, 5, ...)`, colour lerp white to light orange over `e.fin()`. CITED, same file.
- `explosion = new Effect(30, e -> {`. 30 ticks, 6 debris plus 8 sparks, colour ramp of four stops (lighter orange, light orange, gray). CITED, same file.
- `shockwave = new Effect(10f, 80f, e -> {`. 10 ticks, clip 80, a `Lines.circle` with radius `e.fin() * 28f`, white to light gray. CITED, same file.
- About 300 `new Effect(` declarations in the file (the fetch tool's estimate, not an exact count). CITED, same file.
- Lifetime bands: hit sparks 8-20 ticks, explosions and puffs 20-60, smoke and trails 50-140, long clouds 180-400. CITED, same file.
- Clip sizes run 80 to 500 world units. CITED, same file.
- Defaults: `lifetime = 50f`, clip 50 in the two-argument constructor, `followParent = true`. CITED: https://raw.githubusercontent.com/Anuken/Mindustry/master/core/src/mindustry/entities/Effect.java
- Culling happens at creation. `create()` tests the camera bounds against a box of size `clip`, and an effect outside the view is never created. CITED, same file.
- One global switch disables all effects: `shouldCreate()` returns `!headless && this != Fx.none && Vars.renderer.enableEffects`. The server (headless) never creates any. CITED, same file.
- No max-count cap in `Effect.java`. CITED, same file.
- Screen shake falls off with distance: `clamp(1 / (distance² / 10000)) * intensity`. CITED, same file.

Shattered Pixel Dungeon (`effects/`)
- 34 Java files in `effects/` plus a `particles/` subfolder. Names include Beam, Chains, Lightning, MagicMissile, ShieldHalo, Flare, Speck, Splash, Ripple, Wound, FloatingText, TargetedCell. CITED: https://api.github.com/repos/00-Evan/shattered-pixel-dungeon/contents/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects
- `MagicMissile` is an emitter that flies from A to B at `SPEED = 200f` (pixels per second), then fires a callback. It has no missile sprite. The particle stream is the missile. CITED: https://raw.githubusercontent.com/00-Evan/shattered-pixel-dungeon/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
- 18 bolt types (ids 0-17: magic, frost, fire, corrosion, foliage, force, beacon, shadow, rainbow, earth, ward, four shaman colours, elmo, poison, light) and 14 cone types (ids 100-114). One class covers all of them. CITED, same file.
- Emission: `pour(factory, 0.01f)` for most bolts, `0.03f` for cones, `0.02f` for force cone and specks. CITED, same file.
- Emitter box size: 4 px for most bolts, 3 for corrosion and poison, 2 for shaman bolts, 10 for cones. CITED, same file.
- Particle lifespans are 0.4-0.6 s. MagicParticle 0.5 s, colour `0x88CCFF`, shrinks from size 4 to 1. WhiteParticle 0.4 s, size 3 to 0. EarthParticle 0.5 s with gravity `+40`. ForceParticle size 8. CITED, same file.
- Glowing types return `lightMode() = true` (magic, white, slow, force, ward, elmo). Earth and the red, blue and purple shaman particles use normal blending. CITED, same file.
- Particles and missiles come from `recycle()` pools and `revive()`. CITED, same file.
- Lightning: `DURATION = 0.3f`. Each arc is two stretched sprite halves joined at one midpoint. The midpoint is re-rolled every frame at `±4` px on each axis. Alpha is `life / DURATION`. Drawn in light (additive) mode. CITED: https://raw.githubusercontent.com/00-Evan/shattered-pixel-dungeon/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java

### Inferences
- Mindustry runs 60 ticks per second (UNVERIFIED, from memory). Then a hit spark lasts 233 ms, the shockwave 167 ms, an explosion 500 ms. These sit close to the 75 ms per frame, 3-4 frame hit spark rule from the combat juice study.
- SPD tiles are 16 px (UNVERIFIED). 200 px/s is then 12.5 tiles per second, or 80 ms per tile. On a 32 px grid the same feel is 400 px/s.
- If `pour` interval means seconds between particles, a bolt emits 100 particles per second and holds about 50 live particles at a 0.5 s lifespan. A cone at 0.03 s holds about 17 per emitter. The `Emitter` source was not read, so this is an estimate.
- The Mindustry trick that matters is `randLenVectors(e.id, n, ...)`. The effect id seeds the random stream, so each frame recomputes the same n spark directions. An effect instance stores position, rotation, time and id. For a server-authoritative game this means the server sends one id and every client draws the same sparks.
- SPD's lightning needs two quads and one random pair per frame. That is the cheapest believable bolt I know. Chain lightning is the same thing between successive targets.

### Gaps
- Mindustry's `EffectState` pooling code was not read.
- SPD's `Emitter.java` and `Blending.java` were not read, so "light mode = additive" is an inference from the name.
- No frame-time measurements exist in either codebase.

---

## Q2. Terraria Dust, a capped decorative particle pool

### Takeaway
Terraria treats dust as decoration the engine may refuse to spawn. That one rule is what makes a hard cap safe. Copy the rule before copying the system.

### Cited findings
- Dust is visual only and "should never be used as a gameplay element". The reason given is that spawn amount depends on the computer. CITED: https://raw.githubusercontent.com/wiki/tModLoader/tModLoader/Basic-Dust.md
- "Dust count limits are imposed by the game" and dust "are not guaranteed to spawn". CITED: https://docs.tmodloader.net/docs/stable/class_dust.html
- Vanilla dust sheets are 10x30 px strips with 3 frames. The class docs say a random 8x8 frame from 3 options. CITED, both pages above.
- `NewDust(position, width, height, type, speedX, speedY, alpha, color, scale)` spawns at a random point in a rectangle and returns an index into `Main.dust`. `NewDustPerfect` skips the random offset. CITED: Basic-Dust page.
- `NewDust` multiplies scale by a random 80% to 120%. CITED: class docs.
- Alpha is 0-255 where 255 is fully transparent. Many dust types use scale to decide when to die. CITED: class docs.
- `noGravity` and `noLight` default to false. Dust emits light unless `noLight` is set, depending on type. CITED: class docs.
- The update loop calls `Lighting.AddLight` from the dust position, and deactivates dust when scale exceeds 10 or falls below a per-type minimum. A static `dCount` counter is incremented per live dust. CITED: https://raw.githubusercontent.com/tModLoader/tModLoader/stable/patches/tModLoader/Terraria/Dust.cs.patch
- A full teleport effect (Magic Mirror) is a 70-dust loop at alpha 150, scale 1.5. CITED: Basic-Dust page.

### Inferences and unverified
- The 6000 cap. UNVERIFIED this session. From memory, `Main.maxDust` is 6000, `Main.dust` has 6001 slots, and `NewDust` returns index 6000 (a dummy slot) when it declines to spawn. Neither the wiki page, the class docs nor the patch file states the number. Check the decompiled `Dust.cs` before quoting it in the study.
- From memory (UNVERIFIED), `NewDust` also returns early when the spawn point is outside the screen plus a margin, and uses `dCount` to thin spawns as the pool fills.
- 70 dust for the biggest personal effect against a 6000 pool means about 85 such effects at once before the cap bites. For 30 casters on a 320x180 view I would cap far lower, around 300-600 particles in total, because the screen is about 20 times smaller than Terraria's.
- Dust as light source is the cheap glow. Each bright dust adds a small value to the tile light grid. This matches our VFX #5 low-res light map.

### Gaps
- No Re-Logic statement on the cost of 6000 dust.

---

## Q3. Stardew Valley TemporaryAnimatedSprite, one struct for every effect

### Takeaway
Stardew draws explosions, spell hits, sparkles and smoke with one struct that holds a source rect, a frame interval, a frame count, a loop count and a few per-frame deltas. Worth copying as the base record for flipbook effects. I could not fetch the field list.

### Cited findings
- The wiki page that documents the data-driven fields returned HTTP 403 on both the page and the `api.php` route. Not retrieved: https://stardewvalleywiki.com/Modding:Common_data_field_types
- Search results confirm a `temporaryanimatedsprite` event command was documented in the 1.6 migration page, and that mod frameworks share "TAS" handling code. SEARCH: https://stardewvalleywiki.com/Modding:Migrate_to_Stardew_Valley_1.6

### Unverified (from memory)
- The 1.6 data model exposes these fields: Texture, SourceRect, Interval (ms per frame), Frames, Loops, PositionOffset, Flicker, Flip, SortOffset, AlphaFade, Scale, ScaleChange, Rotation, RotationChange, Color. The C# class adds motion, acceleration, a delay before start, an optional light with radius, and an end callback.
- Typical vanilla interval values are 50-100 ms per frame, with 4-8 frames.

### Inference
- A spell phase record for Kingsfoil can be the same shape: `{sheet, rect, frames, ms_per_frame, loops, offset, layer, alpha_fade, scale, scale_change, rot, rot_change, tint, delay, light_radius}`. That is about 15 numbers, all serialisable, and it covers cast, impact and linger flipbooks.

### Gaps
- Field defaults and the exact light fields need a source. The decompiled class is the place to look.

---

## Q4. Per-game teardowns

### Dead Cells (3D to pixel pipeline). CITED
Source: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
- One artist (Thomas Vasseur) built 3D models in 3DS Max and exported FBX. A home-made tool rendered them tiny "without antialiasing".
- Each frame exports as a PNG plus a normal map. A basic toon shader gives volume in game.
- The character is 50 px tall in game.
- Animation is keyframes first. Extra frames go before or after keys, never between.
- Attacks are close to pose-to-pose. The article says VFX supply the sense of motion, impact and strength.
- Frame sequences are exported so blend modes can be layered.
- Flickering pixels stayed unsolved by choice, to keep the workflow fast.
- Retiming an attack means moving keyframes. Two retakes took less time than making the article's GIFs.
- Gap: the article does not say how the VFX themselves are made, and gives no frame counts.
- Lesson for us: snappy poses plus an effect smear read as power. The effect carries the motion, so the character animation can stay short.

### Halls of Torment (Godot, pre-rendered). SEARCH only
- A 50-minute GodotFest talk dated 2025-11-11 by Paul Lawitzki covers project structure, profiling and compiling a custom Godot editor. The abstract has no numbers. https://media.ccc.de/v/godotfest2025-a-peek-under-the-hood-technical-learnings-from-halls-of-torment
- This is the best-matched Godot source for crowd performance. Someone should watch it. I did not.

### Vampire Survivors (engine port). SEARCH only
- Built on Phaser, ported to Unity in version 1.6 (August 2023) for performance. Poncle called it the same game "with increased performance and compatibility". https://www.gamingonlinux.com/2023/08/vampire-survivors-co-op-and-new-game-engine-upgrade-is-live
- PC Gamer mentions a "5-8 frames" figure for the old engine in heavy late-game moments. The writer speculates on the context, so this is not a developer measurement. https://www.pcgamer.com/vampire-survivors-set-for-hefty-fps-boost-as-its-new-engine-finally-gets-a-release-date-its-like-a-completely-different-game
- No projectile cap found in sources.
- Lesson: a JS/WebGL sprite engine fell over in the hundreds-of-projectiles case and the fix was a native engine. Our web target has the same ceiling, so caps are a design decision and not a late fix.

### Wizard of Legend 1 and 2. SEARCH only
- WoL 1 is by Contingent99, two people, built in Unity 5. Bundy Kim did art and programming. https://wizardoflegend.com/press
- Design article: the team borrowed from fighting games and hand-tuned several variables per spell. https://gamedeveloper.com/design/designing-i-wizard-of-legend-i-s-fighting-game-inspired-spell-combos (not fetched, worth a read by whoever covers cast timing)
- WoL 2 is by Dead Mage with Contingent99 advising. Early access 2024-10-03. Version 1.0 on 2025-06-12 for PC, PS5 and Xbox. Switch on 2025-11-25. https://www.gematsu.com/2025/05/wizard-of-legend-ii-launches-june-12-for-ps5-xbox-series-and-pc and https://www.gematsu.com/2025/11/wizard-of-legend-ii-for-switch-launches-november-25
- 1.0 reportedly added 12 Chaos arcana. The search summary flags this count as reported, not confirmed.
- UNVERIFIED: WoL 2 moved to 3D models with a top-down camera, so it is no longer a pixel reference. WoL 1 stays the reference for pixel arcana.
- Gap: no developer source on how WoL 1 effects are authored, their frame counts or sizes.

### Noita. SEARCH only
- GDC 2019 talk by Petri Purho, "Exploring the Tech and Design of Noita". https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design and video https://www.youtube.com/watch?v=prXuyMCgbTc (link from a search result, not opened)
- Chapters cover the falling-sand simulation, rigid bodies, the multithreading problem and its solution, and a continuous big world.
- UNVERIFIED: the world updates in 64x64 chunks with a checkerboard update pattern across threads. Materials carry a glow value and a post-process shader blurs bright pixels into a glow buffer. My search for the shader docs found nothing.
- Lesson: per-pixel emissive plus a blurred low-res buffer is the same idea as our VFX #2 block-sum glow. Noita is a desktop game with a full-screen post pass, so the web cost needs our own measurement.

### Sea of Stars. SEARCH only
- A custom render pipeline provides full dynamic lighting on pixel art. https://ensigame.com/games/sea-of-stars
- No Sabotage devlog on normals or shadow method turned up.
- Related: an 80.lv article on lit pixel art says normal maps were painted by hand and hidden geometry cast the shadows. https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting
- Lesson: spell light on the environment is the expensive, impressive part. For us a spell adds a blob to the VFX #5 light map and stops there.

### Path of Exile 2 (clarity patches). SEARCH only
- 0.1.1 (January 2025): enemy ability and hazard visuals adjusted "to make it clearer" where not to stand. Exploding corpses, Volatile Plants and Chaos Pustules made easier to see. Some damage areas resized to match their visuals. https://www.pathofexile.com/forum/view-thread/3695606
- 0.3.1 (October 2025): ground effects from the "of Ice", "of Lightning" and "of Flames" map modifiers cover 75% less of the map on tier 1-5 waystones. https://www.poe2wiki.net/wiki/Version_0.3.1
- A 0.5.4b patch exists (https://patchbot.io/games/path-of-exile-2/articles/726-054b-patch-notes), so the game was still in 0.x versions in 2026. I did not read its notes.
- Lesson: the two fixes GGG reached for were (1) make the hitbox equal the drawn shape and (2) cut ground-effect coverage. Both are free for us.

### Hades II. SEARCH only
- Patch 11 (July 2025) was the last early access patch. Its art notes include VFX adjustments "to improve visual clarity in combat". https://finalweapon.net/2025/07/23/hades-ii-releases-final-early-access-patch/
- 1.0 launched September 2025. A hotfix followed on 2025-10-01 and Post-Launch Patch 1 in late October 2025 with quality-of-life settings. https://kotaku.com/hades-2-1-0-release-patch-notes-true-ending-2000628834
- No effect opacity slider found in the results.

### Riot, League of Legends VFX style guide. SEARCH only (older, still the standard text)
- Published October 2017 by Jin Ho Yang. Three parts: gameplay focus areas, value, colour. https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/
- Rule: avoid 100% or 0% value, and per a summary also 100% or 0% saturation, so effects do not read as UI or terrain. https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- Rule: value, contrast, saturation and shape make the gameplay area the primary element. https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-2-what-are-we-communicating-with-our-vfx/13062
- Rule: visual importance matches gameplay importance. https://www.leagueoflegends.com/en-au/news/dev/clarity-in-league/
- Note for pixel art: "no pure white" conflicts with the white-hot core other researchers will recommend. My reading is that the core may hit the palette's brightest colour for 1-2 frames only, and the sustained body stays below it.

### Games not covered by any fetched source
Hyper Light Drifter, Enter the Gungeon, Nuclear Throne, Children of Morta, Moonlighter, CrossCode, Eastward, Octopath Traveler, Hades 1, Hammerwatch 1/2, Core Keeper, Brotato, Magicka, Realm of the Mad God, Soulstone Survivors, Tiny Rogues, Ravendawn, Tibia, Eterspire, Soulbound, BitCraft, Brighter Shores, Elin, Diablo IV, Fellowship. The table in Q7 gives my UNVERIFIED recollection for the best known of them. I ran out of call budget before reaching these.
- Hammerwatch: the brief said to read its modding docs. Two searches found only the Hammerwatch 2 modding page, which covers resource packaging and not effect files. https://wiki.hammerwatch2.com/Modding . From memory (UNVERIFIED) Heroes of Hammerwatch defines effects in XML `.effect` files as lists of sprite frames with a time per frame, plus per-effect light and blend parameters. The open asset dump on GitHub would settle it.

---

## Q5. What is new since mid-2025

### Takeaway
Nothing changed the craft. The useful news is practical: Godot 4.5 and 4.6 made 2D on weak hardware faster, Pixel Composer keeps shipping, and the big ARPGs spent 2025 removing visual noise instead of adding it.

### Cited or search-level findings

Engine
- Godot 4.5 adds WebAssembly SIMD for web exports. The release page says web games run "a bit more smoothly" and gives no number. CITED: https://godotengine.org/releases/4.5/
- Godot 4.5 adds a shader baker. The page reports a "20× decrease in load times" on one demo with Metal and D3D12. That is for the RenderingDevice back ends, so it does not help a WebGL2 export. CITED, same page.
- Godot 4.5 adds stencil buffer support, shown for 3D meshes. CITED, same page.
- Godot 4.5 merges TileMapLayer collision cells into larger shapes. CITED, same page.
- The page text was truncated before the 2D and Compatibility sections. 4.5.2 downloads are dated 2026-03-19. CITED, same page.
- Godot 4.6 released late January 2026. SEARCH: https://godotengine.org/releases/4.6/
- A 4.6 dev5 report describes a 2D renderer batching rework with speedups of "roughly 1.1 to 7 times", aimed at older hardware. This is a dev-build figure from a news site. SEARCH: https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts
- Action for the study: re-run the VFX #8 and #9 measurements on 4.6 before publishing new cost numbers. Any figure taken on 4.3 or 4.4 may be pessimistic.

Tools
- Pixel Composer (node-based pixel VFX compositor, MakhamDev). 1.0 in December 2022. Betas 1.20.1 (December 2025), 1.20.4 (2026-01-08), 1.20.7 (2026-02-19). Still marked in development. SEARCH: https://makham.itch.io/pixel-composer and https://store.steampowered.com/app/2299600
- Pixel FX Designer, PixelOver, Effekseer, Aseprite: my one search returned nothing on them. No 2025-2026 status verified.

AI flipbook generators (honest state)
- PixelLab offers text-driven animation, skeleton animation, keyframe interpolation, 4 and 8 direction rotation and an Aseprite plugin. Its terms say users keep ownership of output. SEARCH: https://www.pixellab.ai/termsofservice
- Retro Diffusion lists visual effects and animation among its outputs. The maker says output is usable commercially. A third-party review calls the free-tier wording unclear. SEARCH: https://astropulse.itch.io/retrodiffusion and https://dupple.com/learn/best-free-ai-pixel-art-generators
- I found no hands-on test of AI explosion or spell flipbooks. I cannot say they are usable. The project already has a PixelLab skill with measured limits, which is better evidence than any review I found.
- INFERENCE: effect flipbooks need frame-to-frame coherence and a strict palette ramp. Character-focused tools are not built for that. A 6-frame explosion takes an artist under an hour, so the saving is small either way.

Games
- Wizard of Legend II 1.0 on 2025-06-12, Switch 2025-11-25 (see Q4).
- Hades II 1.0 in September 2025 with a clarity pass in the last early access patch (see Q4).
- Path of Exile 2 clarity changes in 0.1.1 and 0.3.1 (see Q4).
- No information gathered on Tibia effect updates, Ravendawn, Eterspire, Soulbound, BitCraft, Brighter Shores, Elin, Diablo IV or Fellowship.

Talks
- "Attention Overload: Creating Readable VFX", Hanno Hinkelbein, Rocksteady. On GDC Vault. Year not confirmed by my search. SEARCH: https://gdcvault.com/play/1034360/Attention-Overload-Creating-Readable-VFX
- "Controlled Chaos: 12 Principles of Design for VFX", on the GDC Festival of Gaming schedule (the renamed GDC, so likely 2026). SEARCH: https://schedule.gdconf.com/session/controlled-chaos-12-principles-of-design-for-vfx/914747
- GodotFest 2025 Halls of Torment talk, 2025-11-11 (see Q4).
- Neither GDC talk was opened. Titles alone show that readability is still the live topic in VFX.

### Gaps
- Godot 4.5/4.6 changes specific to the Compatibility renderer and CPUParticles2D.
- Aseprite, Effekseer, PixelOver and Pixel FX Designer release status.
- Any measured comparison of AI flipbooks against hand-drawn ones.

---

## Q6. Cross-cutting patterns (inference from the above)

1. Two authoring families exist. Code-drawn effects (Mindustry, SPD, Terraria dust) are a function of time plus a seeded random stream. Flipbook effects (Stardew, and by memory most hand-pixelled games) are a sprite strip plus a small record of deltas. A small team wants both, with one shared runtime record.
2. Lifetimes cluster tightly. Hit sparks 130-330 ms. Explosions 330 ms-1 s. Lightning 300 ms. Trail particles 400-600 ms. Smoke up to 2 s and beyond.
3. Counts per effect are small. 5 sparks for a hit. 14 pieces for an explosion. 2 quads for a lightning arc. 70 dust for a showpiece.
4. Decorative particles are droppable by rule. Terraria says so in its modding docs. Mindustry skips creation off screen and on the server.
5. Additive blending is chosen per particle type. SPD marks magic, force and ward as light mode and keeps earth and poison opaque. That doubles as element language: energy glows, matter does not.
6. The big studios' 2025 clarity work was subtractive. Smaller ground coverage, hitbox equal to visual, quieter player strikes.

---

## Q7. Table of games

Frames and glow columns marked (U) are UNVERIFIED memory. Rows without (U) rest on sources in this file.

| Game | Authoring method | Typical frames or lifetime | Glow method | Clarity device | See it in action |
|---|---|---|---|---|---|
| Mindustry | Code lambda per effect, about 300 effects | Hit 14 ticks, explosion 30, shockwave 10 | Colour lerp from white, bloom is optional (U) | Off-screen effects never created, global effects toggle | https://github.com/Anuken/Mindustry |
| Shattered Pixel Dungeon | Pooled particle emitters, 34 effect classes | Particles 0.4-0.6 s, lightning 0.3 s | Per-type "light mode" blending | Bolt is a thin 2-4 px stream, cones use sparser emission | https://github.com/00-Evan/shattered-pixel-dungeon |
| Terraria | Dust pool, 3-frame 8x8 or 10x10 cells | Showpiece effect is 70 dust | Dust adds light to the tile light grid | Dust may be dropped, never gameplay. Cap 6000 (U) | https://github.com/tModLoader/tModLoader/wiki/Basic-Dust |
| Stardew Valley | One struct flipbook (TemporaryAnimatedSprite) | 4-8 frames at 50-100 ms (U) | Optional light per sprite (U) | Short, small, single layer | https://stardewvalleywiki.com/Modding:Migrate_to_Stardew_Valley_1.6 |
| Dead Cells | 3D render to small sprites plus normal map, layered blend modes | Not stated | Toon shader plus normal-mapped lights | Pose-to-pose attacks, VFX carry the motion | https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i- |
| Wizard of Legend 1 | Hand-pixelled flipbooks in Unity (U) | Unknown | Additive sprites, light halos (U) | One colour family per element, hand-tuned per spell | https://wizardoflegend.com/press |
| Wizard of Legend 2 | 3D, not pixel (U) | Unknown | Engine bloom (U) | n/a | https://www.gematsu.com/2025/05/wizard-of-legend-ii-launches-june-12-for-ps5-xbox-series-and-pc |
| Noita | Simulated pixels, each a material | Simulation, no flipbook | Emissive materials plus blurred glow pass (U) | Dark caves make every emissive pixel read (U) | https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design |
| Vampire Survivors | Sprites, ported Phaser to Unity in 1.6 | Unknown | Little or none (U) | Damage numbers and enemy flash over spell detail (U) | https://www.gamingonlinux.com/2023/08/vampire-survivors-co-op-and-new-game-engine-upgrade-is-live |
| Halls of Torment | Pre-rendered sprites in Godot (U) | Unknown | Unknown | Muted ground, bright effects (U) | https://media.ccc.de/v/godotfest2025-a-peek-under-the-hood-technical-learnings-from-halls-of-torment |
| Sea of Stars | Hand pixel art plus custom lit render pipeline | Unknown | Dynamic lights, bloom (U) | Turn-based, one effect at a time (U) | https://ensigame.com/games/sea-of-stars |
| Path of Exile 2 | 3D particles | n/a | Engine bloom | Hitbox equals visual, 75% less ground-effect coverage | https://www.poe2wiki.net/wiki/Version_0.3.1 |
| Hades II | Hand-painted 2D flipbooks (U) | Unknown | Additive layers (U) | 2025 pass that quietened strike VFX | https://finalweapon.net/2025/07/23/hades-ii-releases-final-early-access-patch/ |
| League of Legends | 3D particles, style guide | n/a | Controlled value, never 0% or 100% | Primary, secondary, tertiary element hierarchy | https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/ |
| Hyper Light Drifter | Hand-drawn flipbooks, GameMaker, 480x270 (U) | Unknown | Additive plus soft gradient overlays (U) | Magenta and cyan reserved for danger and player (U) | none collected |
| Nuclear Throne | Hand-drawn, 320x240 at 30 fps (U) | 2-4 frame muzzle flashes and big first-frame explosions (U) | None, flat colours (U) | Oversized bullets, bright enemy bullets (U) | none collected |
| Enter the Gungeon | Hand-drawn flipbooks in Unity (U) | Unknown | Light halos on bullets (U) | Enemy bullets one red-orange family with a rim (U) | none collected |
| Octopath Traveler | Pixel sprites in UE4 with 3D particles and post (U) | n/a | Bloom, depth of field, point lights (U) | Turn-based staging (U) | none collected |

---

## Q8. Ideas worth stealing, ranked by value for a tiny team

1. Effect as `lifetime + draw(t, seed)` (Mindustry). One function per effect, no particle objects, seeded by effect id so every client draws identical sparks from one small network message. About 300 effects fit in one file. Cost is a handful of draw calls per live effect.
2. Decorative particles may be refused (Terraria). Put it in the design rules: a particle never carries gameplay. Then a hard pool cap, off-screen skip and "others' spells at half count" are all safe.
3. Cull at creation, not at draw (Mindustry). Test the camera box plus a clip radius when the event arrives. An off-screen spell costs nothing after that.
4. The missile is its trail (SPD). A 2-4 px emitter flying at 200 px/s with 0.5 s particles that shrink 4 to 1 px. No directional sprites, no rotation artefacts, 18 elements from one class by swapping colour and particle behaviour.
5. Two-quad jitter lightning (SPD). One midpoint, re-rolled ±4 px each frame, 0.3 s linear fade, additive. Chain it target to target.
6. One flipbook record for everything (Stardew). Rect, frames, ms per frame, loops, plus alpha, scale and rotation deltas and an optional light. Cast, impact and linger phases are three such records.
7. Additive only for energy (SPD). Fire, arcane, holy and lightning glow. Earth, poison and physical stay opaque. Cheaper overdraw and a free element cue.
8. Hitbox equals drawn shape, and cut ground coverage (PoE 2 0.1.1 and 0.3.1). Lingering fields should cover as little floor as the mechanic allows. GGG cut theirs by 75% at low tiers.
9. Lifetime bands as a style rule. Hit 130-330 ms, explosion 330-1000 ms, lightning 300 ms, trail mote 400-600 ms. Write them into the spell data schema as defaults.
10. Light from particles into the low-res light map (Terraria). A spell's glow on the ground is a light-map write, not a shader.
11. Distance falloff on screen shake (Mindustry, `1 / (d² / 10000)`). Thirty casters do not shake everyone's screen.
12. Poses plus effect smear (Dead Cells). Keep cast animations to 2-3 strong poses and let the effect supply the motion. Retiming a spell is then a data change.

---

## Sources

Fetched this session (CITED)
- https://raw.githubusercontent.com/Anuken/Mindustry/master/core/src/mindustry/content/Fx.java
- https://raw.githubusercontent.com/Anuken/Mindustry/master/core/src/mindustry/entities/Effect.java
- https://raw.githubusercontent.com/00-Evan/shattered-pixel-dungeon/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/MagicMissile.java
- https://raw.githubusercontent.com/00-Evan/shattered-pixel-dungeon/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/Lightning.java
- https://api.github.com/repos/00-Evan/shattered-pixel-dungeon/contents/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects
- https://raw.githubusercontent.com/wiki/tModLoader/tModLoader/Basic-Dust.md
- https://docs.tmodloader.net/docs/stable/class_dust.html
- https://raw.githubusercontent.com/tModLoader/tModLoader/stable/patches/tModLoader/Terraria/Dust.cs.patch
- https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
- https://media.ccc.de/v/godotfest2025-a-peek-under-the-hood-technical-learnings-from-halls-of-torment (abstract only)
- https://godotengine.org/releases/4.5/ (first 100,000 characters)

Seen in search summaries only (SEARCH)
- https://www.gematsu.com/2025/05/wizard-of-legend-ii-launches-june-12-for-ps5-xbox-series-and-pc
- https://www.gematsu.com/2025/11/wizard-of-legend-ii-for-switch-launches-november-25
- https://wizardoflegend.com/press
- https://gamedeveloper.com/design/designing-i-wizard-of-legend-i-s-fighting-game-inspired-spell-combos
- https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- https://www.gamingonlinux.com/2023/08/vampire-survivors-co-op-and-new-game-engine-upgrade-is-live
- https://www.pcgamer.com/vampire-survivors-set-for-hefty-fps-boost-as-its-new-engine-finally-gets-a-release-date-its-like-a-completely-different-game
- https://www.pathofexile.com/forum/view-thread/3695606
- https://www.poe2wiki.net/wiki/Version_0.3.1
- https://finalweapon.net/2025/07/23/hades-ii-releases-final-early-access-patch/
- https://kotaku.com/hades-2-1-0-release-patch-notes-true-ending-2000628834
- https://godotengine.org/releases/4.6/
- https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts
- https://makham.itch.io/pixel-composer
- https://www.pixellab.ai/termsofservice
- https://astropulse.itch.io/retrodiffusion
- https://dupple.com/learn/best-free-ai-pixel-art-generators
- https://gdcvault.com/play/1034360/Attention-Overload-Creating-Readable-VFX
- https://schedule.gdconf.com/session/controlled-chaos-12-principles-of-design-for-vfx/914747
- https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/
- https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-2-what-are-we-communicating-with-our-vfx/13062
- https://ensigame.com/games/sea-of-stars
- https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting
- https://wiki.hammerwatch2.com/Modding

Failed
- https://stardewvalleywiki.com/Modding:Common_data_field_types (403, also via api.php)
- https://www.jikguard.com/news/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-dead-cells (served a blog index)
