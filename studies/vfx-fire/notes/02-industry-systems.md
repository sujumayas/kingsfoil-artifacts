# 02 Mainstream industry architectures for fire and smoke

Angle: how shipped games build systemic fire and render fire and smoke, from developer write-ups, official docs and wikis. About 30 tool calls. Several wikis were blocked (see Gaps).

Short version: almost every shipped system splits fire into two layers. A cheap discrete simulation (grid cells with hitpoints, a block tick, a heat value, a surface type) decides what burns. A separate visual layer (particles, sprites, flipbooks) only reads that state. The simulation is never fluid physics. The visuals are capped by a budget, and the budget is enforced by limiting how far fire may spread, not by the renderer.

---

## Q1. How does a shipped spreading-fire simulation work?

### Takeaway
The Far Cry 2 model is the best fit for a tile game. Each cell has hitpoints and a burn lifetime. Burning cells damage edge neighbours each update. A wind dot product scales that damage. A "spreading points" pool caps the total. It maps straight onto a Tibia-style tile grid and a server tick.

### Cited findings

Far Cry 2 (Jean-Francois Levesque, the engineer who built it, blog 2012-12-06, https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/)
- Equally spaced grid. 2D for grass and terrain, 3D for objects and trees.
- Each cell has at least a world position, a radius and hitpoints.
- Grids are created on demand when a flammable entity first takes fire damage.
- Cells under water, a rock or a building are disabled, so fire cannot spread there.
- Ignition. Fire damage hits the cell nearest the source. A cell at 0 HP catches fire.
- Propagation. A burning cell damages its edge-sharing neighbours. They ignite at 0 HP.
- Material. Higher HP means harder to ignite and slower spread (used for wet jungle). Each cell has a finite burn lifetime ("energy"), so paper burns out faster than a log.
- Wind. Damage to each neighbour is scaled by dot(wind, dir_to_neighbour). Downwind takes more, upwind less. The author says this gives a bell-shaped front moving with the wind. Gravity (uphill spread) uses the same trick.
- Budget. A closed-loop "spreading points" pool. A Molotov gives a grass patch 60 points, each cell costs 8, so about 7 cells. Two Molotovs give 120 points, about 15 cells.
- Without the cap the author says fire could burn the map, exhaust memory or drop the framerate.
- Events. Burning cells broadcast damage and radius so AI, explosives and objects react. With thousands of cells, burning cells are grouped into merging AABBs and events go per group, spread over several frames.
- No timing figures (ms) or cell sizes in metres are given.

Far Cry 2 interview (Game Developer, 2008, https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads)
- Early scope was grass patches "no bigger than 10 meters by 10 meters".
- One gameplay programmer spent about 1.5 years on fire.
- Factors named: wind direction, uphill spread from hot gases, humidity (jungle resists), recent rain (must dry first), water only extinguishes the submerged part.
- Visual fidelity was cut to hold framerate because particles competed with AI, physics and streaming.
- A pre-release test set "miles of terrain" on fire in about 2 minutes, which is why spread was capped.
- See it: https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2

Minecraft fire block (https://minecraft.wiki/w/Fire)
- Java. Fire uses scheduled ticks every 30 to 40 game ticks (1.5 to 2 s), not random ticks. Bedrock uses random ticks and follows randomTickSpeed.
- Age 0 to 15. 1/3 chance to increase per block tick.
- Spread area. 3x3 horizontal, up to 4 blocks up and 1 down. Base values 100 (3x3x3), 200, 300, 400 as height goes up, so higher targets are less likely.
- Ignition degree is given as (max adjacent flammability + 7*difficulty + 40) / (age + 30). The wiki text was garbled. My reading of the formula is an inference, check the source.
- Humid biomes halve the degree (wiki says spread reduced 50%).
- Per-block values (ignite odds / burn odds): logs 5/5, planks 5/20, leaves and wool 30/60, bookshelf 30/20, hay 60/20, grass and flowers 60/100, vines and TNT 15/100.
- Rain. Spread blocked if rain hits the target or its 4 neighbours. Rain extinguish chance per block tick is 20% + 3% per age (20% to 65%).
- Burnout. Age > 3 with nothing flammable adjacent: goes out next tick. Age 15 without flammable floor: 1/4 chance per tick.
- Infiniburn blocks (netherrack, magma) keep fire forever unless put out by other means.
- Java has a game rule fire_spread_radius_around_player. At 0, fire never spreads. Spread needs a player within 8 chunks.

Don't Starve (Klei)
- Fire is a "propagator" component with flashpoint, currentheat, heatoutput, propagaterange, decayrate, damagerange (crash log fields: https://kleiforums.com/klei-bug-tracker/dont-starve-together/wormwood-crash-when-bulbous-lightbug-killed-by-fire-dart-r41934/).
- Burning things push heat into neighbours in range. A target reaching its flashpoint starts smouldering. Heat transfer then pauses (Klei forum analysis, https://forums.kleientertainment.com/forums/topic/132953-caculating-the-changed-heat-transfer-mechanism-and-smoldering-time/). Range comes in fixed tiers set in standardcomponents.lua.
- One mod's example values (not engine defaults): flashpoint 5 + random*5, decayrate 1, propagaterange 3, heatoutput 8, damagerange 2 (https://kleiforums.com/forums/topic/46257-help-please-custom-item-that-can-ignite-things/).
- Burning objects deal 8 to 12 HP/s to a player too close. Spring halves burn range in DST. Burnt structures return 1/4 materials. Flammable items become Ashes, burnt trees give Charcoal (https://dontstarve.wiki.gg/wiki/Fire).
- Smouldering can be put out by hand at a health cost, by an Ice Flingomatic, or by rain (chance not given).

RimWorld (https://rimworldwiki.com/wiki/Fire, page flagged as outdated after 1.5.4062)
- Spread three ways. Direct adjacency, embers that jump to tiles up to 2 away, and room heat.
- Indoors above about 235 C, flammables and pawns can ignite on their own. The room gets an orange haze.
- All burning objects lose HP at the same rate. Fire size depends on flammability.
- A burning pawn takes 2 heat damage per second regardless of flame size.
- Rain puts out fires on unroofed tiles. Large fires raise the chance of rain.
- Colonists stomp fires. Several can work on one fire.
- Foam turret range 20 tiles, firefoam popper 10 tiles.

Breath of the Wild "chemistry engine" (GDC 2017 "Change and Constant: Breaking Conventions with The Legend of Zelda: Breath of the Wild", Fujibayashi, Takizawa, Dohta. Report: https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies)
- Dohta frames physics as a rule-based movement calculator and chemistry as a rule-based state calculator.
- Elements have no constant state (fire, water, ice, electricity, wind). Materials are solid things (trees, rocks, the player).
- Three rules. Elements change the state of materials. Elements change each other. Materials cannot change each other.
- No grass spread rates, updraft numbers or rain rules were found in reports of the talk.

Divinity: Original Sin 2 surfaces (https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274)
- Fire surface applies Burning (damage each turn) and removes Wet.
- Water or Ice on fire removes it and creates Smoke.
- Fire on Water makes Steam. Fire on Poison explodes. Fire ignites Oil.
- Fire on Electrified Water makes an Electrified Steam cloud. Fire melts Frozen back to Water.
- Bless and Curse variants. Cursed Fire is Necrofire that water cannot put out.
- No turn durations or damage figures on that page.

Noita (Petri Purho, GDC 2019 "Exploring the Tech and Design of Noita", https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design, free video https://www.youtube.com/watch?v=prXuyMCgbTc. Summary: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/)
- World split into 64x64-pixel chunks. Each chunk keeps a dirty rect, so only changed pixels are iterated.
- Updates run bottom up.
- Multithreading. Four checkerboard rounds. Each chunk may write 32 px into neighbours, so active areas never overlap and need no locks.
- Gases (steam) are inverted liquids. They try up, then left and right.
- A burning pixel tries a random direction to ignite a neighbour. Oil burns, water does not. Fire on water makes steam. Wood burns for a set time, then is destroyed.
- No spread probability given.

Into the Breach, Terraria
- Into the Breach wiki was blocked (fandom 402).
- Terraria "On Fire!" deals 4 HP/s (1 damage every 0.25 s) and stops regeneration. Lava applies it for 7 s. Any liquid except lava removes it (https://terraria.wiki.gg/wiki/On_Fire!). Terraria has no terrain fire spread on that page.

### Inferences
- The common core is small. Per cell: fuel type, HP or heat, burn timer, state. Per tick: neighbours lose HP, scaled by material and wind. On burnout: become ash or charred.
- Minecraft and Far Cry 2 both cap spread. Minecraft uses player distance and rain. Far Cry 2 uses a points pool. A server-authoritative MMO needs a cap like this, or one griefer burns a forest for everyone.
- Minecraft's 1.5 to 2 s tick and Don't Starve's smoulder stage are both readable to players. A smoulder stage gives players a warning window and a chance to stamp it out. That suits a Tibia-like game where many players watch the same tile.
- The DOS2 surface table is a lookup of (surface, element) to new surface. It is cheap to replicate on a server and easy to show with tile sprites.

### Gaps
- No ms or cell-size numbers for Far Cry 2.
- BotW grass spread and updraft rules not found in primary sources.
- Dwarf Fortress wiki returned 429 twice, archive.org was not reachable. No DF temperature numbers here.
- Don't Starve engine default propagator values not verified. The GitHub script mirror path 404'd.
- Spelunky 2, Into the Breach, Hades, Diablo IV fire hazards not covered (wiki blocks and call budget).

---

## Q2. How do studios couple the CPU simulation with visuals?

### Takeaway
Visuals are placed on burning cells and pooled. When the pool runs short, make each particle bigger instead of spawning more. For a pixel game the same idea is a sprite per burning tile, with a fixed pool.

### Cited findings
- Far Cry 2 puts particle emitters on burning cells. Emitters behind the camera are teleported to where they are needed. Density is higher near the player. When emitters run out, particle size increases to fill screen space (https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/).
- The author expected the GPU to be the bottleneck before the CPU, since the simulation avoids heavy math (same source).
- Ignitement (Unity blog, https://unity.com/blog/real-time-fluid-simulation-fire-vfx-ignitement-breakdown) runs a GPU fluid sim with fragment-shader blits. Density 1024x1024 RGBA half, velocity 512x512 RG half, temperature 1024x1024 half, reaction 1024x1024 RGBA half. The domain follows the camera.
- Ignitement steps: emitters and obstacles to texture, diffusion, advection, extinguish (reaction becomes smoke density), vorticity confinement, pressure projection, advect embers.
- Fire is drawn from the reaction texture as a heightmap with parallax. Embers are the only particles.
- Ignitement reads a downsampled reaction texture back to the CPU (AsyncGPUReadback) to apply a burning debuff.
- Ignitement downsamples and blurs the reaction texture into a light map. Surfaces sample it with one lookup at position + normal * 4.0.
- The team chose fragment shaders over compute for compatibility. Cost was described only as about "a few post-processing effects".

### Inferences
- Ignitement's split (sim texture, read back low-res for gameplay) is the inverse of what a server MMO needs. The server must own the grid. The client only renders it. Far Cry 2's model fits better.
- The Ignitement light map trick (blur the fire grid, sample it) is the same idea as the acid study's block-sum glow. It can reuse that code at 320x180.
- Fragment-shader-only fluid sims can run on WebGL2 in principle. At 1024x1024 half floats they are far above a 320x180 game's needs. A 64x64 or 80x45 grid would be the matching scale (inference, not measured).

### Gaps
- No studio reported a fire budget in ms or a particle count. None of the sources found give one.

---

## Q3. What does Godot 4 give for fire and smoke particles, and what breaks on the web?

### Takeaway
On Compatibility (web default), GPUParticles2D works, but particle trails, SDF collision and emit_particle() are missing. Flipbooks, turbulence and sub-emitter settings are documented without Compatibility caveats. CPUParticles2D gets no new features. For pixel fire, use a flipbook on a CanvasItemMaterial and keep fixed_fps low.

### Cited findings
- Renderer table. Particle trails: Compatibility not supported. Particle SDF collision: Compatibility not supported. 2D HDR viewport: Compatibility not supported. Unlisted features are available in all renderers (https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html).
- Compatibility is the default on the web (https://docs.godotengine.org/en/4.4/tutorials/rendering/renderers.html).
- GPUParticles2D. emit_particle() works only on Forward+ and Mobile. 2D particles collide only with LightOccluder2D, not physics bodies. Collision shape is always a sphere. fixed_fps defaults to 30 and does not slow the simulation. interpolate defaults to true. Changing amount restarts the system, so use amount_ratio. Emission rate is amount * amount_ratio / lifetime per second. A node with sub_emitter set stops emitting on its own (https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html).
- ParticleProcessMaterial. Turbulence defaults: off, noise strength 1.0, noise scale 9.0, influence 0.1 to 0.1. Sub-emitter modes: constant, at end, at collision, at start. anim_speed 1 plays the flipbook once over lifetime. anim_offset picks the start frame (https://docs.godotengine.org/en/stable/classes/class_particleprocessmaterial.html).
- 2D particle tutorial. Flipbooks need a CanvasItemMaterial with Particle Animation and H/V Frames. Use Add blend for black-background sheets. CPUParticles2D has "near-feature parity" but no new features are planned. Godot 4.3 lacks physics interpolation for 2D particles (https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html).
- A forum report shows a lag spike the first time each GPUParticles2D fires on a web export, from shader compilation (https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170).

### Inferences
- Since SDF collision is not supported on Compatibility, the LightOccluder2D collision path is likely unavailable on web. Smoke cannot hit walls in the particle system there. Do wall checks against the tile grid instead.
- The first-fire shader stutter suggests pre-warming each fire effect off-screen at load.
- Set fixed_fps to 8 to 12 on pixel fire particles. It matches the 10 Hz flicker found in study #5 and hides sub-pixel motion. This is a taste call, not a cited number.

### Gaps
- No official max particle count or measured ms for GPUParticles2D on WebGL2 found.
- Turbulence cost on Compatibility not documented.

---

## Q4. How do shipped games and art leads render stylised fire and smoke?

### Takeaway
Flipbooks with power-of-two grids, short lifetimes, a bright flash early and mid values for the body. Readability beats spectacle. For pixel art the flipbook is just a hand-drawn loop. The Riot rules on value and timing transfer directly.

### Cited findings
- Flipbook sheets. Use power-of-two sizes (256 to 2048) and power-of-two row and column counts (2 to 32) to avoid mip problems. More frames mean less resolution per frame. A 150-frame explosion can be retimed to 32 frames. Frame blending and optical flow can cut frame counts (https://vfxdoc.readthedocs.io/en/latest/textures/flipbooks/).
- Unity VFX Graph Flipbook Player offers blending and clamp blending. Outputs have UV modes Flipbook, Flipbook Blend and Flipbook Motion Blend (https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.5/manual/Block-FlipbookPlayer.html). Unity's VFX Toolbox Image Sequencer builds flipbooks from DCC frames (https://gitee.com/mirrors_Unity-Technologies/VFXToolbox, mirror).
- League of Legends VFX Style Guide (Riot, 2017, PDF: https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf). Goals include clarity for gameplay and minimal clutter. Summary of its rules (https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips):
  - Split effects into primary (high value, sharp, opaque) and secondary (embers, mist, low value, soft).
  - Avoid pure black and pure white. Save the highest values for the instant primary flash.
  - Timing has three stages. Anticipation, an impact that peaks within the first quarter of the life, then a smooth fade.
  - Keep effects short. Lingering particles cost overdraw and hide silhouettes.
  - Avoid photo textures. Do not stack too many alpha layers.
  - Colour conventions include orange-red for gunpowder.
- GDC 2017 "Visual Effects Bootcamp: Artistic Principles of VFX", Jason Keyser (Riot) and Hadidjah Chamberlain (Blizzard) (https://www.gdcvault.com/play/1024439/Visual-Effects-Bootcamp-Artistic-Principles). Content not retrieved.
- GDC "Art Directing VFX for Stylized Games" exists (https://gdcvault.com/play/1024715/Art-Directing-VFX-for-Stylized). Content not retrieved.

### Inferences
- The Riot "peak in the first quarter" rule gives a direct frame plan for a pixel explosion. At 8 frames, frames 1 to 2 are the flash, then 6 frames of fireball and smoke fade.
- "No pure white" maps onto a palette ramp that stops one step short of white for the flame body, with white kept for impact frames.
- Riot's warning on alpha stacking supports dithered smoke over semi-transparent smoke at 320x180. It keeps edges crisp and avoids overdraw.

### Gaps
- No Overwatch-specific VFX talk was found. The Keyser/Chamberlain talk is the closest Blizzard source and its text was not reachable.
- No developer source found for Sea of Stars, Eastward or Hyper Light Drifter fire. Sea of Stars coverage only mentions dynamic lighting in previews (https://www.pcgamer.com/sea-of-stars-is-a-gorgeous-retro-rpg-from-the-makers-of-the-messenger).

---

## Recommendations for Kingsfoil (inferences, ranked by fit)

1. Server grid with Far Cry 2 rules. Per tile: fuel, HP, burn timer, state (fresh, smouldering, burning, ash). Each server tick (try 1.5 to 2 s like Minecraft), burning tiles damage 4 neighbours, scaled by 1 + k * dot(wind, dir). Clients get only state changes.
2. A spreading-points pool per ignition source (Far Cry 2: 60 points, 8 per cell). It is the simplest anti-grief cap for a shared MMO world.
3. Rain rule from Minecraft. Block spread under rain. Extinguish chance 20% + 3% per age step per tick.
4. A smoulder stage from Don't Starve. It gives a visible warning and a counterplay window.
5. A DOS2-style lookup table for fire against water (steam), oil (burst), ice (melt). Steam and smoke become short-lived tile overlays.
6. Client visuals. One hand-drawn loop per burning tile from a fixed sprite pool. Embers and smoke as GPUParticles2D with flipbooks, fixed_fps low, no trails or collision on web.

---

## Sources
- https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/
- https://forum.devtalk.com/t/far-cry-how-the-fire-burns-and-spreads-2012/5121
- https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads
- https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2
- https://minecraft.wiki/w/Fire
- https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies
- https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274
- https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- https://www.youtube.com/watch?v=prXuyMCgbTc
- https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
- https://dontstarve.wiki.gg/wiki/Fire
- https://forums.kleientertainment.com/forums/topic/132953-caculating-the-changed-heat-transfer-mechanism-and-smoldering-time/
- https://kleiforums.com/klei-bug-tracker/dont-starve-together/wormwood-crash-when-bulbous-lightbug-killed-by-fire-dart-r41934/
- https://kleiforums.com/forums/topic/46257-help-please-custom-item-that-can-ignite-things/
- https://rimworldwiki.com/wiki/Fire
- https://terraria.wiki.gg/wiki/On_Fire!
- https://unity.com/blog/real-time-fluid-simulation-fire-vfx-ignitement-breakdown
- https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html
- https://docs.godotengine.org/en/4.4/tutorials/rendering/renderers.html
- https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html
- https://docs.godotengine.org/en/stable/classes/class_particleprocessmaterial.html
- https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- https://vfxdoc.readthedocs.io/en/latest/textures/flipbooks/
- https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.5/manual/Block-FlipbookPlayer.html
- https://gitee.com/mirrors_Unity-Technologies/VFXToolbox
- https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
- https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- https://www.gdcvault.com/play/1024439/Visual-Effects-Bootcamp-Artistic-Principles
- https://gdcvault.com/play/1024715/Art-Directing-VFX-for-Stylized
- https://www.pcgamer.com/sea-of-stars-is-a-gorgeous-retro-rpg-from-the-makers-of-the-messenger

Blocked: dwarffortresswiki.org (429 twice), web.archive.org (unreachable), divinity.fandom.com and intothebreach.fandom.com (402), divinityoriginalsin2.wiki.fextralife.com (404), raw GitHub DST script mirror (404).
