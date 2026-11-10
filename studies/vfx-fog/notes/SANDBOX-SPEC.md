# Fog Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file; the sandbox builder follows the corrected number.

The study has two equal goals: ARTISTIC QUALITY and RUNTIME EFFICIENCY. The sandbox must look beautiful and moody, and it must show what every layer costs, live.

## Page
- `studies/vfx-fog/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors.
- Style and controls like `studies/vfx-water/sandbox.html` (read it first and copy its page chrome, HUD style, control layout and keyboard handling).
- Title: "Fog Sandbox". A link back to `vfx-fog-topdown-pixel.html` and `index.html`.

## World
- A small top-down 3/4 highland at 320x180 with a clear height map: a valley with a stream and a marsh at the bottom, slopes with trees, a ridge with a stone watchtower, a village edge with 2-3 houses and lamp posts, a cave mouth, and an unexplored forest region off to one side.
- Grid: 8x8 px cells -> 40 x 23 cells (last row partial). Each cell: height (0-255), moisture (0-255, high near water and marsh), opaque flag (walls, tree trunks, tower), explored bit, visible count.

## Layers (must match report §7, bottom to top)
1. Server weather and vision truth (gameplay). A small weather state per region: fog density target (0-255), cloud cover (0-255), wind vector, on a slow server clock (time of day drives radiation fog: forms at night in low, moist cells, burns off after sunrise; labelled illustrative). Only these few bytes go on the network when they change. Vision: the server decides which entities each client may see (fog of war and smoke/fog blocking sight); hidden entities are never sent.
2. Fog density field (client). A coarse grid (40x23 cells, or 80x45 at 4 px) where each cell's fog = weather density x height factor (pools in low cells) x moisture, advected by the wind and lightly diffused, updated at a fixed low rate (e.g. 10 Hz, labelled illustrative) and interpolated between updates. Clearing masks subtract around the player and around lights.
3. Drifting fog texture. Two or three layers of a precomputed tileable noise table (no per-pixel procedural fbm at runtime), scrolled at different slow speeds and directions, multiplied by the density field (bilinear upsample), optionally domain-warped by a cheap offset from a second table. Toggle: "procedural fbm" vs "noise table" to compare cost and look.
4. Fog rendering pass. Density to colour: fog takes the ambient/sky colour of the time of day; render mode toggle (a) Bayer 4x4 ordered dither into the palette (no alpha, pixel-safe), (b) palette-mapped value compression (each scene colour moves N steps toward the fog colour in a lookup table, the "COLORMAP" idea from VFX #5), (c) plain alpha blend (the anti-pattern: off-palette colours, shown for comparison). Characters and lamp posts can be drawn above the fog with an outline or below it (toggle) for readability.
5. Clouds and cloud shadows. Cloud cover thresholds a scrolling noise table to make cloud shapes. Shadows: darkened palette step on the ground under the shape, offset by the sun direction, sliding with the wind. Overhead clouds: a parallax layer that drifts faster than the shadows and fades out (dithered) when it is near the camera centre or when the player is under it. Toggle each.
6. Atmosphere. Height/distance haze: cells far up the screen (the ridge) and high cells get a tint toward the sky colour. Light inside fog: lamp posts and torches draw a soft halo (dithered rings) whose size grows with local fog density, and clear a small hole in the fog. God rays: at dawn, a few pre-drawn slanted light shafts through the treeline/fog (additive or palette-step, not a radial blur), animated slowly; optional radial-blur comparison toggle with a sample count control to show its cost.
7. Fog of war. Per-cell states unknown / explored / visible. Visible = cells within the player's sight radius computed with shadowcasting against opaque cells (reuse VFX #5's algorithm; the sandbox may implement a compact recursive shadowcaster). Rendering: unknown = solid dark with a dithered edge; explored = remembered terrain drawn in a desaturated, darker palette (no live entities shown); visible = live. Soft edges by upscaling the per-cell state with bilinear interpolation and a Bayer threshold, plus a per-cell fade-in over ~0.3 s when a cell becomes visible (labelled illustrative). A few wandering creatures in the dark only appear when visible (server rule).
8. Magic fog and smoke. A tool to cast a fog cloud (spell / smoke bomb) that adds density to the field, blocks sight (cells over a density threshold count as opaque for the FOV), and decays over a few seconds.
9. Palette, time of day and accessibility. Dawn / day / dusk / night palettes; fog colour follows the time of day. A "reduce motion" toggle that freezes the drift (fog keeps its shape) and an "fog strength" slider for low-vision players.

## Efficiency HUD (required, this is half the study)
- Per-layer timing in ms, measured with performance.now() around each layer every frame, smoothed: density field update, fog texture, fog pass, clouds, atmosphere, fog of war (FOV + mask), total. Show a frame budget bar against 16.7 ms.
- Counters: fog field updates per second, FOV recomputes (only when the player changes cell or an opaque cell changes), cells revealed, network bytes for weather changes (illustrative sizes).
- A "cost view" (x-ray) that colours each layer's area by cost or shows which layers are on.

## Controls
- Tools: walk (default, arrows/WASD or tap-to-move), cast fog cloud, place/remove lamp, toggle a wall (opaque) cell.
- Toggles: fog render mode (dither / palette steps / alpha), noise source (table / procedural), clouds, cloud shadows, overhead clouds, haze, god rays (shafts / radial blur + samples), fog of war on/off, characters above/below fog, reduce motion.
- Time of day: auto (compressed day, e.g. 2 minutes, illustrative) or manual slider; weather presets: Clear, Morning valley fog, Coastal fog bank, Overcast, Night mist.
- Views (x-ray): normal, height map, fog density field, fog of war states, cost view.
- Reset button. Pause.
- Keyboard: tools 1-4, F cycle fog mode, T toggle auto time, V cycle views, Space pause, arrows/WASD move.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step: provide a button `button[data-demo="showcase"]` that sets a nice frame (dawn, valley filled with fog, lamps glowing in the fog, god rays through the trees, tower above the fog on the ridge, a bit of fog of war at one edge).
