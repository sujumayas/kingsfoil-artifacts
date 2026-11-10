# Water Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file; the sandbox builder follows the corrected number.

## Page
- `studies/vfx-water/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width with no horizontal overflow and no console errors.
- Style and controls like `studies/vfx-fire/sandbox.html` (read it first and copy its page chrome, HUD style, control layout and keyboard handling).
- Title: "Water Sandbox". A link back to `vfx-water-topdown-pixel.html` and `index.html`.

## World
- A small top-down 3/4 coast at 320x180: open sea on one side (deep band, shallow band, beach with wet sand), a river that comes down from a cliff as a waterfall, runs through a meadow under a wooden bridge and a ford, and enters the sea; a small pond or swamp corner with lily pads; a few trees and a hut near the water (so reflections have something to show); a pier.
- Grid: 8x8 px cells -> 40 x 23 cells (last row partial). Each cell: terrain height (0-255), water kind (none, shallow, deep, river, swamp, waterfall), flow vector (8 dirs + speed 0-3), distance-to-shore (BFS, in cells, signed: + in water, - on land).

## Layers (must match report §7, bottom to top)
1. Server water truth (gameplay). Static per map: tile flags walkable-shallow / blocking-deep / swim (optional), flow dir+speed for river tiles, fishable flag. A global tide level (0-255) on a slow server clock (period about 2 real minutes in the sandbox, labelled illustrative); tide moves the shoreline by comparing tile height against the level, so a few beach rows flip between wet and dry. Only the tide value is sent on the network (1 byte per change). Currents push entities by the flow vector each tick.
2. Distance and depth fields (client, computed once per tide change). Multi-source BFS from shore tiles gives distance-to-shore for every tile; depth band = clamp(distance, 0..3) mixed with height. Recompute cost shown in the HUD.
3. Base water colour by depth band. 4-5 colour ramp per body (sea, river, swamp) with hue shift from shallow (teal) to deep (navy). Ordered (Bayer 4x4) dither at band borders, no alpha.
4. Surface animation. Two styles, toggle: (a) palette cycling: 3-4 highlight colours rotate through reserved palette slots at about 8 Hz (Ferrari style), the tiles never redraw; (b) animated tiles: 4-frame loop at about 4-6 fps, with a per-tile phase offset from a hash of the tile coordinate (toggle "sync" to show the shimmer anti-pattern). Plus sparse sparkles/glints: hashed cells that flash 1-2 px white for a few frames.
5. Flow. River tiles scroll their highlight texture along the per-tile flow vector using two-phase flow-map blending (two samples half a cycle apart, triangle weights) so the texture never stretches; waterfall is a vertical scrolling strip with mist particles at the base.
6. Shoreline foam and waves. Foam band from distance-to-shore == 0/1, autotiled on the cell corners (marching squares / dual-grid style, 16 cases) so corners and diagonals look right. Waves lapping: a wave line travels up the beach with a period of about 4-6 s, foam pixels where it breaks, then it retreats and leaves a darker wet-sand band that dries over time. Tide shifts all of this.
7. Reflections and caustics. Trees, hut and characters near water draw a flipped, darkened copy below themselves, offset by a small sine wobble per row, clipped to water pixels. Shallow-water caustics: a cheap animated cell/Voronoi-like pattern, 1 px bright lines, on shallow tiles only, toggle.
8. Interaction. A walker the user drives (arrows/WASD or tap-to-move): on shallow water the sprite is clipped at the waterline, speed x0.6 (illustrative), and footstep rings spawn every step; on deep water it swims (only head shown, slower) or is blocked (toggle "deep water blocks", Tibia-like). Moving through water leaves a V-wake (Kelvin angle about 19.5 degrees each side) from a fixed pool of wake particles. Click/tap tools: drop a stone (splash: 4-6 frames of droplets + expanding rings), drop a log (floats, bobs with a sine of 1 px at about 0.5 Hz, drifts with the current and the river carries it to the sea), cast a fishing line (bobber bobs, a random bite after a few seconds makes the bobber dip with a ring; click again in time to catch). A small boat can be toggled on the sea and leaves a larger wake. Ripple rings live in a fixed ring pool (e.g. 64) drawn as pixel ellipses (squashed for 3/4 view), not a full heightfield; an optional coarse heightfield (Hugo Elias, link to VFX #3 Rain) runs only on the pond as a comparison toggle.
9. Palette and light pass: everything maps to one limited palette; day / dusk / night toggle that swaps the water ramp (night = darker ramp + moon glint column), reuse the palette-swap idea from earlier studies.

## Controls
- Tools: walk (default), stone, log, fishing rod, boat. Click or tap on the canvas.
- Toggles: surface style (palette cycle / animated tiles), tile phase sync (anti-pattern demo), caustics, reflections, deep water blocks vs swim, pond heightfield comparison, day/dusk/night, tide auto vs manual slider.
- Views (x-ray): normal, depth bands, distance-to-shore field, flow vectors, autotile cases.
- Reset button. Pause.
- HUD: tide level, ms per frame for water pass, active ripple rings / wake particles, BFS recompute ms, fish caught.
- Keyboard: tools 1-5, T toggle tide auto, V cycle views, Space pause, arrows/WASD move.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step: provide a button `button[data-demo="showcase"]` that sets a nice frame (day, walker wading near shore with a wake, a log on the river, waves on the beach).
