# Spell Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file; the sandbox builder follows the corrected number. Numbers marked (illustrative) are placeholders until research replaces them.

The study has two equal goals: ARTISTIC QUALITY and RUNTIME EFFICIENCY. The spells must look good and stay readable, and the sandbox must show what every layer costs, live.

## Page
- `studies/vfx-magic/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors.
- Page chrome, HUD style, control layout, explainer cards and keyboard handling copied from `studies/vfx-grass/sandbox.html` (read it first). Keep `<script src="nav.js" defer></script>` before `</body>`.
- Title: "Spell Sandbox". A link back to `vfx-magic-topdown-pixel.html` and `index.html`.

## World
- A small top-down 3/4 arena at 320x180: a ruined courtyard with stone floor, grass edges, a few pillars and braziers, deliberately busy ground so readability is a real test. Grid of 16x16 px tiles (20 x 11, last row partial); treat one tile as one Tibia square.
- Actors, all sprites built in code: the player mage (walks with arrows/WASD or tap), one party healer NPC, 3 training dummies with health bars, 2 wandering monsters that cast at the player, and a "crowd" of 0-30 other players who stand around the arena and cast at the dummies and at each other.

## Layers (must match report §7, bottom to top)
1. Server spell events (gameplay truth). The server decides hits and conditions and sends only small events: cast start (caster, spell id), missile (from tile, to tile, missile id), effect (tile, effect id), area (origin, area mask id, effect id), condition on/off (entity, condition id). All visuals are client-side and cosmetic. An event log with byte sizes (illustrative: 5 to 9 bytes per event).
2. Spell definitions as data. Each spell is a small table of phases: cast → travel → impact → linger, each phase naming an effect recipe, a duration, and an element. Elements own a colour ramp (4 to 5 steps, white-hot core to dark edge) and a shape language (fire = rising tongues, ice = shards and straight lines, energy = jagged bolts, poison = slow bubbles, holy = rays and rings, arcane = orbits and sigils).
3. Cast and charge. A ground magic circle under the caster (procedural rune ring that draws in during the cast), particles gathering toward the hands, a charge glow. Drawn under the character.
4. Projectiles. Missile kinds: straight bolt, homing missile, lobbed arc with a ground shadow, beam/channel, chain lightning (midpoint displacement with branches, redrawn every few frames). Missile sprites in 8 directions (toggle: 16 directions, or run-time rotation, the anti-pattern at low res). Trails: ring-buffer ribbon, afterimages, particle wake (toggle between them). Whole-pixel positions. Flight time per tile (illustrative 150 ms per tile).
5. Impacts and areas. Hit spark flipbook (flash frame, core, sparks, smoke; illustrative 5 frames at 75 ms), area spells as one effect per tile over a tile mask with a ring-by-ring delay, a shockwave ring, and residue: scorch or frost decals that fade, and lingering fields (fire, poison, energy) that animate on their tile.
6. Auras and status. Effects split into a back half drawn before the character and a front half drawn after it (y-sorted), orbiting motes, a shield bubble that flashes on hit, status looks (burning, poisoned, frozen, shocked) as palette tints plus a small overlay, haste afterimages, heal sparkles rising, a level-up burst.
7. Glow and blending. Toggle between additive blending, palette-ramp glow (no alpha, the pixel-art way), and a low-res glow buffer (block-sum, as in the Acid study). Spells add to a small light map so they light the floor at night (toggle day/night).
8. Screen feedback. A short screen-edge tint for big hits on the player, a low-health pulse, a full-screen flash for the ultimate spell. A flash limiter caps flashes at 3 per second and caps flash area; "reduce flashing" replaces flashes with a border.
9. Clarity manager (budget and tiers). Every effect has an owner tier: own, party, others, hostile-to-me. Per-tier particle count, opacity and layer rules (others' spells drawn with fewer particles, lower opacity, no glow, no screen feedback; hostile telegraphs and impacts on me always full). A global cap on live effects and particles with priority eviction. Options: effects for others = full / reduced / minimal; colour-blind palette with shape redundancy; reduce motion.

## Spells on the hotbar (keys 1-8, or tap the buttons; click or tap a tile to aim, dummies can be targeted)
1. Fire bolt (targeted missile, impact explosion, scorch decal, burning status).
2. Ice shard (aimed straight skillshot, can miss, frost decal, frozen status).
3. Chain lightning (jumps between up to 4 targets, shocked status).
4. Poison cloud (lobbed arc, lingering field on a 3x3 mask, poisoned status).
5. Heal (targeted on self or party, rising sparkles, ring).
6. Mana shield (aura bubble around the player, flashes when hit).
7. Arcane beam (channel while held, line to target).
8. Meteor storm, the "ultimate" (area mask around the caster expanding ring by ring, screen flash, shockwave).

## Efficiency HUD (required, this is half the study)
- Per-layer timing in ms, measured with performance.now() around each layer every frame, smoothed: cast, projectiles + trails, impacts + areas, auras + status, glow, screen feedback, clarity manager, total. Frame budget bar against 16.7 ms.
- Counters: live effects, live particles (and pooled), effects evicted by the cap, events and bytes per second from the server log, flashes per second.
- A "cost view" (x-ray) that shows overdraw: how many effect pixels were written per screen pixel.

## Controls
- Toggles: trails kind, 8 / 16 directions / rotation, glow mode, residue, auras, screen feedback, reduce flashing, reduce motion, colour-blind palette, day/night.
- Effects for others: full / reduced / minimal. Crowd size slider 0-30. Monsters on/off.
- Views (x-ray): normal, tiers (each effect tinted by owner tier), effect bounds, overdraw / cost view, glow buffer, server event log.
- A "stress" control that multiplies the crowd's cast rate to show where the budget breaks, with the clarity manager on and off.
- Reset. Pause. Slow motion (0.25x) to study frames.
- Keyboard: 1-8 spells, V cycle views, G cycle glow mode, N day/night, Space pause, arrows/WASD move.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step: provide a button `button[data-demo="showcase"]` that sets a nice frame (dusk, the mage mid-cast on a rune circle with the shield up, a fire bolt in flight with its trail, chain lightning between two dummies, a poison field lingering, a heal rising on the party member, glow on).

## Corrections from the report
These came from the research and are already built into `sandbox.html`. The report's §7 and §8 follow them.
- Layer 1, bytes: effect 9 bytes and missile 11 bytes (Tibia 12+ sizes read from TFS; the old protocol used 7 and 12). Cast start 8, area-as-mask 11 and condition 6 bytes are illustrative. The cast event carries element and cast time (Ragnarok), and area events carry a delay field (Old School RuneScape).
- Layer 4, flight time: `150 ms x sqrt(tiles)` (OTClient), not 150 ms per tile. Default is 8 pre-drawn directions from a 3x3 sheet, never rotated. Homing turns 3.5 degrees per frame with fixed speed and eases onto the target over the last 40% of the flight so it lands on the server's clock. Ribbon trail 8 points; afterimages 5; particle wake in three layers of 0.1, 0.6 and 1.4 s (Noita). Chain lightning: 5 generations, 32 segments, two branches, re-rolled every 3 frames, life 300 ms.
- Layer 5: sparks are 5 frames at 75 ms (OTClient clock), with a "front-loaded" option of 33, 33, 50, 83 and 134 ms (shape from MUGEN sparks; the split is illustrative). The meteor storm uses the 37-tile `AREA_CIRCLE3X3` so it fits the arena (Tibia's real UE is the 73-tile `AREA_CIRCLE5X5`), ring by ring at 55 ms per ring or all tiles in phase as Tibia does. Shockwave 200 ms. Residue is compressed: scorch 12 s, fields 3 stages of 4 s animated at 500 ms per frame.
- Layer 6: four overlay slots per state (back, front, start, end) as in Diablo II; status is one cached multiply tint, one tint shown by priority; the shield is a rim-only bubble with a directional hit flash and a break ring; marker pulse 2.5 Hz, shocked blink 3 Hz.
- Layer 7: the ultimate blends the floor 7/16 of the way to black, leaving 9/16 brightness (Pokémon Emerald Ice Beam uses `coeff` 7; Thunderbolt uses 6). An earlier draft read the coefficient as the brightness left.
- Layer 8: edge tint 50% for 0.3 s, low-health pulse 0.5 Hz, limiter at 3 flashes per second, flashes under 1,600 px exempt (shown in the HUD, not enforced separately), other players' flashes held to 25% of the screen.
- Layer 9: others reduced = 40% opacity by ordered dither, 50% of particles, no white first frame, every second area tile, no glow, no decals; party loses 30% of particles and all screen feedback; cap 96 live effects with eviction order own, hostile, party, others; same-tile merge inside 150 ms; particle cap 1,200 (illustrative); three opacity sliders (own, others, monsters) as Tibia announced in October 2025.
- The sandbox has 8 hotbar spells plus Haste and Level up as buttons (10 spell tables).
- Not built: DOOM-fire aura, fizzlefade, 73-tile mask, per-facing aura offsets.
