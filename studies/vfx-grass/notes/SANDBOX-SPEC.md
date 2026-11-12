# Grass Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file; the sandbox builder follows the corrected number. Numbers marked (illustrative) are placeholders until research replaces them.

The study has two equal goals: ARTISTIC QUALITY and RUNTIME EFFICIENCY. The sandbox must look alive and beautiful, and it must show what every layer costs, live.

## Page
- `studies/vfx-grass/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors.
- Page chrome, HUD style, control layout, explainer cards and keyboard handling copied from `studies/vfx-fog/sandbox.html` (read it first).
- Title: "Grass Sandbox". A link back to `vfx-grass-topdown-pixel.html` and `index.html`.

## World
- A small top-down 3/4 countryside at 320x180: a meadow of tall grass and wildflowers, a wheat or long-grass field where gust waves read clearly, a dirt road and a few worn footpaths, a pond with reeds, a hedge and two or three trees (reuse the Forest look), a cottage with a lamp post, a fenced pasture with a grazing sheep or two.
- Grid: 8x8 px cells -> 40 x 23 cells (last row partial). Each cell: ground type (grass / tall grass / wheat / flowers / dirt / water / reeds), grass height (0-255), wear (0-255, how trampled over time), moisture, season offset (phenology jitter).

## Layers (must match report §7, bottom to top)
1. Server grass truth (gameplay). Per tile: a few bits of state (tall / trampled / cut / burnt / regrowing) and a regrowth timer; global wind vector and season/weather on a slow server clock. Only changes go on the network (illustrative byte sizes). Tall grass hides entities: the server decides who can see a player standing in tall grass (owner sees self with a dithered/outlined look; others do not receive the entity unless adjacent, illustrative rule) and sends nothing for hidden players.
2. Ground tiles. Grass base tiles with variation (several variants picked by a position hash, no visible grid), autotile edges grass-to-dirt and grass-to-water, a wear layer that blends grass toward a dirt path palette step where wear is high (desire paths that form where the player walks a lot, and fade back slowly).
3. Tufts and blades. Tall grass, wheat and flowers drawn as many small tufts (sprites built in code), y-sorted with characters so tall grass hides the lower body of whoever stands in it. Toggle: "per-tuft sprites" vs "one field layer" (a single pass per row band) to compare cost and look.
4. Wind. A global wind direction and strength plus travelling gust waves (a scrolling 1D/2D noise or a moving band) that shear each tuft by whole pixels (top rows move most, root fixed). Per-type stiffness (wheat sways more, short grass less, flowers bob). Toggle "pixel-snapped shear" vs "smooth sub-pixel" (the anti-pattern: smears and shimmers at low res).
5. Interaction map. A low-res trail texture (e.g. 80x45 at 4 px, illustrative) where every walker (player, NPCs, sheep, the rabbit) stamps a value; tufts bend away from the stamp direction and lie flat, then recover over a few seconds (decay rate illustrative). Rustle: a few leaf/seed particles and a short shake when someone enters tall grass. Long-term wear accumulates from the same stamps at a much slower rate.
6. Cut, burn, graze and regrow. Tools: cut grass (scythe arc that turns tall grass into stubble and drops a clipping particle), burn (small fire front that turns grass to burnt ground; reuse the Fire study's grid rule, compact), sheep graze nearby cells. Regrowth: a random-tick rule (each tick N random cells advance one growth stage, spreading from neighbours) with a speed control.
7. Small life (cosmetic, client-side, pooled). Spawned by biome, time of day, season and weather from a spawn table:
   - Butterflies: fluttering path (smooth wander plus vertical bob and flap frames at a few Hz), land on flowers, flee from the player.
   - Bees: hop between flowers in short straight hops with hover pauses.
   - Dragonflies over the pond: dart and hover.
   - Gnat swarm: a small cloud of 1 px dots orbiting a point near the pond at dusk.
   - Moths circling the lamp at night.
   - Fireflies at dusk/night over the meadow: drift slowly and blink (a short flash every few seconds); option "synchronous" where nearby fireflies nudge their phase toward each other (Kuramoto-style) until the field flashes together; glow drawn as a tiny pre-made halo sprite, not a per-pixel light.
   - Ground critters: a rabbit and a frog that idle, then hop away when the player comes within a flee radius; crickets that pop out of tall grass with a short hop when trampled.
   - Pollen and dandelion seeds drifting with the wind.
   Each kind has a pool size, a cull region (only simulate on screen plus a margin) and a counter in the HUD.
8. Seasons, weather and time of day. Spring / summer / autumn / winter palettes via a palette/LUT swap with per-cell phenology offsets so the field turns gradually; dry vs wet grass (after rain darker and shinier); snow cover in winter (grass tips poke through); dawn / day / dusk / night palettes. Spawn table follows the season and time (no butterflies at night, fireflies only in summer nights, etc.).
9. Accessibility. "Reduce motion" (wind sway amplitude to near zero, creatures still move slowly) and a "creature density" slider.

## Efficiency HUD (required, this is half the study)
- Per-layer timing in ms, measured with performance.now() around each layer every frame, smoothed: ground tiles, tufts + wind, interaction map, regrowth tick, small life update, small life draw, total. Frame budget bar against 16.7 ms.
- Counters: tufts drawn, creatures alive / pooled per kind, interaction stamps per second, regrowth cells updated per tick, network bytes for tile changes (illustrative sizes).
- A "cost view" (x-ray) that colours each region by cost or shows which layers are on.

## Controls
- Tools: walk (default, arrows/WASD or tap-to-move), cut, burn, plant/regrow, place lamp.
- Toggles: per-tuft vs field layer, pixel-snapped vs smooth sway, gusts, interaction map, wear/desire paths, each creature kind, synchronous fireflies, reduce motion.
- Wind: direction and strength sliders (or presets Calm / Breeze / Gusty / Storm).
- Season: Spring / Summer / Autumn / Winter. Time of day: auto (compressed day, e.g. 2 minutes, illustrative) or a manual slider. Weather: clear / after rain.
- Views (x-ray): normal, interaction map, wear map, wind field, grass state (tall / trampled / cut / burnt / regrowing), cost view.
- A "stress" control that multiplies tuft count and creature count to show where the budget breaks.
- Reset button. Pause.
- Keyboard: tools 1-5, S cycle season, T toggle auto time, V cycle views, Space pause, arrows/WASD move.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step: provide a button `button[data-demo="showcase"]` that sets a nice frame (summer dusk, a gust wave crossing the field, the player half hidden in tall grass with a trampled trail behind, butterflies over flowers, the first fireflies blinking, the lamp lit).

## Corrections from the report
- Layer 7, fireflies: use pulse coupling (Nicky Case shape), not Kuramoto. Each fly's phase rises at 1/period (period about 5 s, varied ±10%); at 1 it flashes and resets, and every neighbour within 48 px gets `phase += phase * 0.035`. Work happens only on flash frames. If a continuous model is kept, use a per-cell mean field (benchmark: 0.067 ms for 1,000 flies against 1.14 ms naive). Flash rises in 1 frame and falls over about 0.4 s across 4 halo frames.
- Layer 1, hiding rule: a player in untrampled tall grass is visible to party, adjacent (Chebyshev 1) and same-patch viewers. Attacking or casting reveals for 2,000 ms. Delay the hide by 300 to 500 ms against flicker.
- Layer 5, interaction map: 80x45 at 4 px is confirmed (0.0023 ms CPU with 10 walkers). Decay before stamping each frame, only moving walkers stamp, recovery about 3 s with three poses (flat above 170, half above 60, upright).
- Layer 3, CPU draw path: write tufts into one pixel buffer (0.051 ms for 2,000) rather than one `drawImage` per tuft (1.62 ms) or per-row slicing (12 ms).
- Tile change bytes: use 9 bytes per change for the HUD counter.
