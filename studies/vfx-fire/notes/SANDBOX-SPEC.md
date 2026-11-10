# Fire Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.

## Page
- `studies/vfx-fire/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors.
- Style and controls like `studies/vfx-light/sandbox.html` (read it first and copy its page chrome, HUD style, control layout and keyboard handling).
- Title: "Fire Sandbox". A link back to `vfx-fire-topdown-pixel.html` and `index.html`.

## World
- A small top-down 3/4 village edge at 320x180: meadow of grass and dry grass, a patch of trees, 3-4 wooden houses (one with a chimney that always smokes), a stone road, a pond, a small lava pool or forge, a campfire and some torches on posts.
- Simulation grid: 8x8 px cells -> 40 x 22 cells (last row partial). Each cell: material (grass, dry grass, tree, wood wall, stone, water, lava, oil, ash), fuel (0-255), moisture (0-255), state (none, igniting, burning, embers, ash), heat.

## Layers (must match report §7, bottom to top)
1. Server fire grid (gameplay truth). Fixed 4 Hz tick. Active list of burning cells only. Seeded deterministic RNG: rand(cellX, cellY, tick, seed) as an integer hash, so every client computes the same fire. Ignition chance per tick per burning neighbour = base(material) x (1 - moisture) x wind factor (dot product with wind, Alexandridis-style e^(c1 V) e^(V c2 (cos θ - 1)) or a simple 1 + k·dot), diagonal neighbours x 0.7. Burning cells consume fuel, then become embers, then ash. Rain raises moisture and extinguishes (Minecraft-like chance per tick). Water cells never burn; fire next to water makes steam. A global budget cap (Far Cry 2 style) is optional and toggled.
2. Network events. The HUD counts bytes per tick for two encodings: full burning-set diff vs ignition/extinguish events only. Illustrative byte sizes (label them so).
3. Cosmetic flames per cell. Two styles, toggle: (a) hand-drawn style 4-frame flame loop drawn procedurally from a 4-tone ramp (near-white, yellow, orange, deep red), 10 fps, phase seeded from the cell coordinates so neighbours never sync, bigger fires (houses) loop slower; (b) DOOM fire mini-buffers: a heat buffer at 1 px resolution where burning cells feed the bottom of their column, spread with the DOOM rule (random 0-1 decay, random sideways shift for wind), rendered through a fire palette.
4. Particles: embers and sparks from a fixed pool (e.g. 256), colour from age through the fire ramp, gravity up (heat) and drag, wind push.
5. Smoke and steam field: a low-res scalar field (e.g. 80 x 45, 4 px cells) advected by wind plus upward drift (screen-up = rising), with decay; rendered with a 4x4 Bayer threshold (no alpha blending), grey for smoke, white for steam, darker for burning oil. Chimney emits Stardew-style puffs (rise 0.5 px/frame, grow, drift, fade).
6. Combat fire: a fireball tool (projectile with trail, then explosion: 1-2 white flash frames, expanding ring, smoke) that leaves a 3x3 fire field (Tibia-style stages that weaken and fade). A dummy creature walks around; when it touches fire it gets a burning status (flame overlay, red tint flash, small damage numbers each tick, burn stacks decrease by 1 per tick, water/pond clears it).
7. Light hookup: a cheap additive warm glow per burning cluster with flicker (reuse the idea from VFX #5 Light); day/night toggle so fires read at night.
8. Palette and dither pass: everything maps to one limited palette; optional heat haze over big fires by sine row offsets.

## Controls
- Tools: ignite (torch), water bucket, fireball, oil, plant grass/regrow. Click or tap on the canvas.
- Toggles: rain, wind direction (8 dirs) and strength slider, flame style (sprite loop / DOOM buffer), day/night, budget cap, heat haze.
- Views (x-ray): normal, fuel/moisture, heat, smoke field, active cells + tick.
- Reset and Seed buttons. Pause and step-one-tick.
- HUD: tick number, active burning cells, ms per sim tick, bytes per tick for both encodings, particle count.
- Keyboard shortcuts for tools 1-5, R rain, W wind rotate, V cycle views, Space pause.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step: provide a button `button[data-demo="blaze"]` that sets the scene on fire for a nice frame (houses burning, smoke column, night off).
