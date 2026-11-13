# 11. Pixel-art craft for fire at 32 px (32x32 tiles, characters about 24x32)

Researcher angle: what pixel artists, tutorials and asset packs say about drawing flames, smoke, embers, explosions, burnt ground and warm light at this size, and how it differs from 8 to 16 px art.
Date: 2026-11-13. About 43 tool calls (over the 35 budget because many asset pages carry no numbers).

**Access notes (honest).**
- Saint11 (Pedro Medeiros) fire, smoke and explosion tutorials are still GIF-only. saint11.org now redirects to saint11.art. Lospec's fire tag lists seven fire tutorials and all of them are tweets, GIFs or videos with no text numbers (Brullov parts 1 and 2 from 2018, Saint11 2016, Gogli 2019, Solar Lune torch 2011) [cited] https://lospec.com/pixel-art-tutorials/tags/fire. I did not download images, so their frame counts are not here.
- Slynyrd has no fire, smoke or burn post up to Pixelblog 64 (25 Sep 2026). The only related posts are 6 (light and shadow), 31 (explosions, already used by VFX #6) and 33 (wind effects) [cited] https://www.slynyrd.com/pixelblog-catalogue
- No MortMort, Brandon James Greer or AdamCYounis fire page surfaced in search. Penusbmic sells a paid explosion video tutorial with Aseprite files ($3, 188 MB) whose content I could not read [cited] https://penusbmic.itch.io/pixel-art-tutorial-understanding-explosions
- opengameart.org returned HTTP 403 to WebFetch. A curl retry was refused by the permission system as bot-check circumvention, so I stopped. OGA facts below come only from search-result summaries and are flagged **[search summary]**.
- Many itch.io pack pages list size and frame count but not ms per frame or tone count.
- Labels used: **[cited]** read on the page this session, **[search summary]** only from a search engine summary of the page, **[inference]** mine. Earlier notes are referenced by path instead of re-cited.

---

## Q1. Flame loops by size at 32 px tiles

### Takeaway
Shipped 32 px fire assets sit between 4 and 10 frames per loop. Small fires stay at 4 to 6 frames, campfire-sized loops at 6 to 8, and big pieces rarely go past 10. Frame counts rise only a little with size. Pixel size grows a lot more. The base stays put, "flamelets" or tongues rise around a moving core and break off at the top, and the hottest, widest part sits at the fuel. Tone count rises from 3 to 4 at 8 to 16 px to about 5 at 32 px, plus a shared dark edge colour. Nobody publishes a rule for this, so the tone count is an inference from palettes and packs.

### Cited findings
- Brullov "Fire Animation" pack has five fire sprites at 24x32, 20x24, 15x24, 10x24 and 8x8 px, 355 frames in total, each split into "burning start, burning loop, burning end" parts. Released 5 Dec 2019, rated 4.9 from 53 ratings, $2, commercial use allowed, no resale [cited]. https://brullov.itch.io/fire-animation
  - The sizes are a ready-made size ladder for a 32 px tile. 8x8 is a candle, 10x24 and 15x24 are torch or brazier flames, 24x32 is a campfire that fills most of a tile [inference].
- Minifantasy "Raided Village" (8 px base grid, by Krishna Palacio) ships fire at 8x8 (2 variants), 16x16 (2) and 32x32 (6), and smoke columns at 8x24, 16x48, 32x48 and 32x96 px. It has a scorched grass tileset and "broken and decayed variations" of houses and props. Credit required, no redistribution [cited]. https://krishna-palacio.itch.io/minifantasy-raided-village
  - Smoke columns here are always 3 times the fire width in height (8x24, 16x48, 32x96), except one 32x48 [inference from the cited sizes].
- Idylwild "Chromatic Campfires" uses 4 frames per animation, drawn for 16 px tiles and said to fit a 32 px grid. It has torches and campfires in 5 colours, smoke in 2 colours, and unlit and burnt variants. Licence CC0 [cited]. https://idylwild.itch.io/campfires
- urais "Pixel Art Animated Torches" are 32x32 px per sprite, 2 torches, free for commercial use, credit optional [cited]. Frame count not stated. https://urais.itch.io/animatedtorches
- Silas Games "Pixel Campfire FX" is a large 172x192 px campfire in only 7 frames, hand-drawn with a 46-colour palette, royalty-free [cited]. https://silasgamedev.itch.io/pixel-campfire
- VFX #6 note 06 already cites a 48x48 fire at 10 frames x 100 ms (toldigames), a 9-frame fire at 16, 32 and 64 px (OGA), and 6 to 10 frames per loop (stealthix). See `studies/vfx-fire/notes/06-design-feel.md` Q1.
- A free 32x32 animated torch on OGA uses 6 frames and ships an Aseprite file [search summary]. https://opengameart.org/content/animated-pixel-torch
- An OGA 32x32 campfire (CC-BY-SA 3.0) has an author note that an earlier, blurrier version did not look like true pixel art, so the flames were re-pixelled [search summary]. https://opengameart.org/content/camp-fire-animation
- Pixel Joint "Busy Flames" plays at 10 fps with 16 colours. The artist animated "bubbles" first, then many "flamelets" moving up and around them for the outline, then shaded. A commenter notes purple on the outer edge. The artist says more frames are smoother but "less punchy" [cited]. https://pixeljoint.com/pixelart/161988.htm
- Pixel Joint candle thread. Treat a flame as an emitter with sideways start velocity and upward acceleration (NancyGold). The hottest part next to the wick is the brightest and the widest. The flame should not cool evenly in every direction. Upper parts should not curve over empty space unless wind pushes them. Wax is translucent, so the flame lights the candle near it (eishiya) [cited]. https://pixeljoint.com/forum/forum_posts.asp?TID=25996
- Slynyrd (wind effects, Pixelblog 33): a small tree sway plays at 0.2 s per frame, a moderate breeze in foliage takes about 4 frames, and flat colour suits "most small sprites" [cited]. https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects
- A Unity pixel game team keeps "4-6 per sprite" colours [cited]. https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- General rules carried from the snow note (not re-fetched): Derek Yu's rule against anything one pixel thick, cure's rule that stray single pixels "expose the underlying grid", Slynyrd's remark that above 32 px is "overkill". See `studies/vfx-snow-32px/notes/11-pixel-art-craft-32px.md` Q1.

### Fire ramps in named palettes (hex from Lospec JSON, HSV computed by me)
| Palette (author, colours) | Ramp, dark to hot | Hue path | Source |
|---|---|---|---|
| Endesga 32 (ENDESGA, 32) | `#3e2731` `#a22633` `#e43b44` `#f77622` `#feae34` `#fee761` `#ffffff` | 334, 354, 357, 24, 36, 51, white | https://lospec.com/palette-list/endesga-32.json |
| Resurrect 64 (Kerrie Lake, 64) | `#6e2727` `#b33831` `#ea4f36` `#fb6b1d` `#f79617` `#f9c22b` `#fbff86` `#ffffff` | 0, 3, 8, 21, 34, 44, 62, white | https://lospec.com/palette-list/resurrect-64.json |
| Apollo (AdamCYounis, 46) | `#411d31` `#752438` `#a53030` `#cf573c` `#da863e` `#e8c170` `#ebede9` | 327, 345, 0, 11, 28, 40, near-white | https://lospec.com/palette-list/apollo.json |
| Sweetie 16 (author field empty in the JSON, 16) | `#5d275d` `#b13e53` `#ef7d57` `#ffcd75` `#f4f4f4` | 300, 349, 15, 38, near-white | https://lospec.com/palette-list/sweetie-16.json |

Hex values are [cited] from the JSON. Picking these as "fire ramps" and the hue paths are [inference]. All four ramps bend hue the same way, from magenta or purple in the darkest step through red and orange to yellow, with value rising about 15 to 25 points per step and saturation dropping in the hottest step. That matches the purple outer edge on "Busy Flames" above.

### Inferences
- **Tone count by size.** At 8 to 16 px, 3 flame tones plus a hot core fit (Idylwild 4 frames, Stardew 4 x 100 ms in VFX #6). At 32 px a flame body of 10 to 24 px wide has room for 5 distinct bands: dark red edge, red, orange, yellow, pale core. A 6th, magenta-purple step works only as the outermost edge on flames 16 px or wider, or as the shared colour with smoke. More than 6 makes bands thinner than 2 px and breaks Derek Yu's rule.
- **Frame count by size.** Data points in this note: 16 px at 4 frames, 32 px torches at 6, 32 to 48 px fires at 6 to 10, 172x192 at 7. Frames go up about 1.5x from 16 px to 32 px art, then flatten. Bigger fire gets slower ms per frame (VFX #6 puff rate), not more frames.
- **Outline.** None of the packs read here describe a black outline on flames. Flames read better with a dark-red or purple edge pixel from the ramp than with a neutral outline, so they glow against the ground.
- **Held base.** Keep the bottom 2 to 3 px rows of a 32 px flame identical or nearly identical across frames. At 8 px, VFX #6 held one row.
- **Detached licks.** On a 6-frame torch, one tongue pinches off around frame 3 and rises 2 to 3 px per frame as a 2x2 or 2x3 blob, shrinking to 1x2 before vanishing. That is the "flamelet" from Busy Flames and the emitter model from the candle thread.
- **Sub-pixel motion.** At 32 px a 2-tone swap on the edge of a tongue (orange to red) reads as a half-pixel shift without moving the silhouette. Use it on the core to keep the base still while the fire seems to breathe.
- **Not a metronome.** Seed the start frame per tile (VFX #6). Add a second, independent layer with a different length (for example a 6-frame body and a 7-frame tongue layer) so the full pattern repeats only every 42 frames, about 4.2 s at 100 ms. Spawn detached tongues and embers from a hash at random intervals instead of baking them into the loop.

### Gaps
- No artist text gives tone counts or frame counts per flame size. All size-to-tone rules above are inference.
- ms per frame is missing on most 32 px pack pages. Only toldigames (100 ms, VFX #6), Busy Flames (10 fps) and pimen (70 ms, see Q4) state it.
- Saint11 and Brullov fire tutorials (the most cited fire references) are image-only.

---

## Q2. Smoke and steam at 32 px

### Takeaway
32 px smoke packs use 6 to 10 frames and 2 to 3 colours, at puff canvases of 16 to 64 px. Dither in smoke is drawn larger than one pixel when it is used at all. A smoke column above a 32 px fire is about 3 tiles tall in the one pack that sizes it.

### Cited findings
- pimen "Smoke n Dust 04": 64x64 at 9 frames, 64x32 at 6, 48x48 at 8, 64x32 at 7, 64x32 at 8, 64x64 at 10, 96x96 at 10, 16x16 at 7, 48x16 at 7. All run at "70m/s", read as 70 ms per frame. Commercial use allowed, no resale, Aseprite sources included [cited]. https://pimen.itch.io/smoke-n-dust-04
- Minifantasy smoke columns 8x24, 16x48, 32x48, 32x96 px for fires of 8, 16 and 32 px [cited]. https://krishna-palacio.itch.io/minifantasy-raided-village
- Idylwild ships smoke in 2 colours over 4 frames [cited]. https://idylwild.itch.io/campfires
- Nano Combat (2 Colors Game Jam) draws smoke from a density buffer through 5 dither textures, one per density band (0 to 0.2 and so on), and scales the dither so it is "not as small as a pixel" [cited]. https://itch.io/post/477565
- Some smoke packs draw each animation in only 2 colours [search summary, pack not identified]. https://virtualgodgames.itch.io/sfxp1
- VFX #6 already covers grey, white and black smoke, the Stardew puff (0.5 px per frame, about 6 s) and smoke going from fire to black to gone. See `studies/vfx-fire/notes/10-pixel-games-smoke.md` Q1 and Q8.

### Inferences
- **Puff sizes at 32 px.** A puff leaves the flame at about the width of the flame tip (4 to 6 px for a torch, 8 px for a campfire), grows to 12 to 16 px, and fades. At 32 px a puff under 4 px reads as an ember, not smoke.
- **Tones.** 2 tones (lit top, shaded bottom) per puff plus the edge treatment. A 3rd tone only on puffs 16 px or larger.
- **Reading as transparent.** Three craft options, best first for 32 px art. (1) Solid clusters with a low-contrast colour close to the ground value, so the shape reads and the ground does not show through. (2) Shrink and break the puff into 2x2 chunks as it fades. (3) Dither, but in 2x2 checker blocks only in a 2 px edge band, matching the snow study's art threshold map. A 1 px checker over a whole puff reads as noise at 3x scale.
- **Column.** Torch 1 to 1.5 tiles, campfire 2 to 3 tiles (Minifantasy 32x96), burning house 4 tiles or more, leaning with wind.
- **Steam.** Same puff shapes, near-white, fewer frames, and faster fade (half the life of smoke).

### Gaps
- No tutorial with text numbers for smoke puff sizes at 32 px was found.

---

## Q3. Embers and sparks

### Takeaway
At 32 px, 2x2 px is the base particle size in Slynyrd's particle method. 1 px is fine only for a spark that lives a few frames. 3x3 is a small burning chunk.

### Cited findings
- Slynyrd builds wind particles from a "2x2px particle", moves it 1 px per frame along a path, and makes it flutter by cutting the top half every other frame [cited]. https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects
- cure allows lone pixels only for highlights, stars, bubbles and tiny details (from the snow note, `studies/vfx-snow-32px/notes/11-pixel-art-craft-32px.md`).
- VFX #11 found 1 px particles too thin at 32 px and scaled sizes 1, 2, 3 px far to near (CONTEXT.md).

### Inferences
- Sparks: 1x1 or 1x2 px, the two hottest tones, 3 to 8 frames of life. Embers: 2x2 (or 2x1 while turning), coloured by age from yellow to red to the dark ramp end, 0.5 to 1.5 s. Chunks: 3x3 only from explosions or collapsing roofs.
- Counts alive at once: torch 1 to 3, campfire 4 to 8, bonfire 10 to 20, burning house 20 to 40. These are judgement values for the sandbox.

### Gaps
- No cited ember count per fire size from an artist.

---

## Q4. Explosions at 32, 64 and 96 px

### Takeaway
32 px explosions in packs run 9 to 13 frames, 48 px run 7 to 14, 64 px run 10 to 18. At pimen's 70 ms that is about 0.6 to 0.9 s for a 32 px blast and up to 1.26 s for a 64 px one. Frame count grows slowly with size.

### Cited findings
- pimen "Explosion Effect" (30 effects, all at "70m/s"): 32x32 effects have 9, 9, 9, 13, 9, 12, 9, 10, 12, 13, 9 frames. 48x48 have 11, 13, 10, 14, 11, 7, 10, 9 frames. 64x64 have 12, 18, 10, 10. 16x16 have 10 and 12. 64x32 have 14 and 10. Commercial use allowed, no resale [cited]. https://pimen.itch.io/explosion-effect
- Reactorcore minipack: 8 sheets of 32x32 frames and 2 of 64x64, 16 frames each in a 4x4 grid, CC0 per the author's comment [cited]. https://reactorcore.itch.io/explosion-spriteanim-sheet-minipack
- Matt Walkden: four 15-frame explosions at 16, 32, 48 and 64 px [search summary]. https://mattwalkden.itch.io/explosion-pack
- Sentient Dream Games: three 64x64 explosions at 10 to 12 frames [search summary]. https://sentient-dream-games.itch.io/pixel-effects-explosions-pack-01
- RS Pixel Store: 64x64 at 12 fps [search summary]. https://rs-pixel-store.itch.io/pixel-explosion-vfx-pack
- 96x96 at 12 frames (OGA) and Slynyrd's ring-to-blob construction are in VFX #6 note 06 Q3.

### Inferences
- Anatomy at 70 to 80 ms per frame for a 64 px blast on 32 px tiles: frame 1 white flash at 50 to 60% of final size, frames 2 to 4 fireball grows to full size, frames 5 to 8 edges turn red then dark, frames 9 to 12 smoke puffs rise and break into 2x2 chunks. Debris as 4 to 8 particles of 2x2 px.
- Size against the tile: 32 px for a hit spark or small spell, 64 px (2x2 tiles) for a firebomb centre, 96 px (3x3 tiles) for the Tibia 3x3 area, built as one centre blast plus 32 px blasts on the outer tiles. Combat timing belongs to note 14.

### Gaps
- No pack states colour counts. No written source for the flash frame (same gap as VFX #6).

---

## Q5. Burnt world art

### Takeaway
Packs that ship burnt states draw few of them. Idylwild has lit, unlit and burnt. Minifantasy has a scorched grass tileset and broken house variants. No 32 px top-down tileset found here ships a full burnt variant of grass, trees and houses. The glowing burn edge in shader form is a band of about 0.04 to 0.05 of the noise range, which works out to 1 to 2 px on a 32 px tile.

### Cited findings
- Idylwild: unlit and burnt torches and campfires beside the lit ones, CC0 [cited]. https://idylwild.itch.io/campfires
- Minifantasy Raided Village: scorched grass tileset, scorched corpses, broken bricks and planks, "broken and decayed" house variants [cited]. https://krishna-palacio.itch.io/minifantasy-raided-village
- Isotile Universe "Burnt Forest Set 01": 8 burnt forest and burnt grass tiles, isometric at 64x128, $2.50 [search summary]. https://isotileuniverse.itch.io/isometrictiles-burntforest-set-01
- Pixeowl Basic 32x32 tileset (4 grounds, 18 variants, 5 trees, 26 variants) lists no burnt variant [search summary]. https://pixeowl.itch.io/pixeowl-basic-tileset
- godotshaders "2D dissolve with burn edge" by mreliptik: `burn_size` with 0.04 suggested, `burn_color`, `dissolve_value`, a NoiseTexture2D. Output is `mix(burn_color, texture, border)`. Two `step()` calls zero the band at 0 and 1 so no stray burn dot remains. Code CC0 [cited]. https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
- A "Pixelated burn" shader snaps UVs with `floor(UV / pixel_size) * pixel_size` to fit pixel art [search summary]. https://godotshaders.com/?p=13632
- Bevy's sprite material example uses an edge width default of 0.05 with an orange edge [search summary]. https://bevy.org/examples/shaders/sprite-material/

### Inferences
- **Edge width in px.** On a painted burn-order map that ramps 0 to 1 across one 32 px tile, a band of 0.04 is 1.3 px and 0.05 is 1.6 px. Round to whole pixels. A 2 px band (1 px bright orange or yellow next to the unburnt side, 1 px dark red next to the char) reads at 3x scale. 3 px only on big fronts seen from far.
- **States to draw.** Ground: normal, scorched (darkened, grass tips gone), charred (black with dark red embers in 2x2 spots), ash (grey, low contrast). Trees: healthy, burning, burnt trunk with stubby limbs, stump. Houses: intact, burning, roof gone with black beams, rubble. Four states each matches the VFX #6 cell states (igniting, burning, embers, ash).
- **Char colour.** Use the ramp's darkest warm-purple (Endesga `#3e2731`, Apollo `#411d31`) for char instead of pure black, so burnt ground ties into the fire palette.
- **Ash.** 2 tones of warm grey with 2x2 lighter flecks, no single-pixel speckle (cure's rule).

### Gaps
- No artist text on burn edge width in px. No 32 px top-down burnt tileset with trees and houses confirmed. The Minifantasy pack is on an 8 px grid, so its 32 px pieces are multi-cell art.

---

## Q6. Warm light on characters and ground (art rules only)

### Takeaway
No pixel-art source gives a rim light width for fire light. A shipped approach lights only the outermost pixels of a sprite, which is a 1 px rim. Illustration advice warns that warm rim plus warm main light looks flat.

### Cited findings
- Pixel Beef (xDasher) lights the "outmost pixels" of each sprite with a rim shader based on received light, and keeps 4 to 6 colours per sprite [cited]. https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- Slynyrd puts the main light top right or top left, and notes haze softens shadow edges [cited]. https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
- An illustration guide says a warm rim with a warm main light "simply looks flat" [search summary]. https://www.oleanderstudios.com/edge-lighting-how-to-add-interest-to-your-character-art/

### Inferences
- On a 24x32 character, a 1 px rim in one warm tone on the side facing the fire, within about 2 tiles. A 2nd tone (2 px total) only when standing next to a bonfire. Keep the far side's cool shadow so the rim contrasts.
- Ground light pool: 2 warm tones over the ground, in clusters of at least 2x2 with a 2 to 3 px dithered edge band (snow study rule). Light map scale belongs to note 12.

### Gaps
- No pixel-art source with a measured rim width.

---

## Rules for the sandbox (numbers to sign off)

All values assume 32x32 tiles and 24x32 characters. They come from the cited packs above plus my inference, so treat them as starting values for eye tests.

| Item | Size (W x H px) | Frames | ms per frame | Tones | Basis |
|---|---|---|---|---|---|
| Candle flame | 4 x 8 | 4 | 100 | 3 + white core | brullov 8x8, Idylwild 4 frames |
| Torch flame | 10 x 16 | 6 | 100 | 5 | brullov 10x24, OGA 32 px torch 6 frames |
| Brazier flame | 16 x 20 | 6 | 110 | 5 | brullov 15x24 / 20x24 |
| Campfire flame | 24 x 28 (on a 32 px tile) | 8 | 100 to 120 | 5 + purple edge | brullov 24x32, Minifantasy 32x32, toldigames 10 x 100 ms |
| Bonfire | 32 x 48 | 8 | 130 | 6 | inference, slower when bigger (VFX #6) |
| Burning tree | 2 to 3 offset campfire loops over a 32 x 48 to 64 x 64 canopy | 8 each | 120 | 6 | inference |
| Burning house | 4 to 6 loops of 24 to 32 px across the roof, 32 x 96 smoke column | 8 each | 130 | 6 | Minifantasy 32x96 smoke |
| Held base | bottom 2 to 3 rows unchanged | | | | inference |
| Detached tongue | 2x2 to 2x3, rises 2 to 3 px per frame | | | | Busy Flames flamelets |
| Smoke puff | starts 4 to 8, grows to 12 to 16 | 6 to 10 | 70 to 100 | 2 (3 if 16 px+) | pimen 6 to 10 frames at 70 ms |
| Smoke dither | 2x2 blocks, 2 px edge band only | | | | Nano Combat, VFX #11 |
| Spark | 1x1 or 1x2, 3 to 8 frames life | | | 2 hottest | cure |
| Ember | 2x2, 0.5 to 1.5 s life, 4 to 8 per campfire | | | by age | Slynyrd 2x2 particle |
| Explosion 32 px | 32 x 32 | 9 to 13 | 70 | 5 + smoke greys | pimen |
| Explosion 64 px | 64 x 64 | 10 to 12 | 70 to 80 | 5 + smoke greys | pimen, Sentient Dream |
| Burn edge band | 2 px (1 glow, 1 dark red) | | | 2 | godotshaders 0.04 on a 32 px ramp |
| Burnt states | 4 per material (scorched, burning, charred, ash) | | | | Idylwild, Minifantasy, VFX #6 states |
| Rim light | 1 px, 1 warm tone, 2 px next to a bonfire | | | 1 to 2 | Pixel Beef outmost-pixel rim |

---

## Gems

| Name | URL | Licence | Maturity evidence | What it saves |
|---|---|---|---|---|
| Idylwild Chromatic Campfires | https://idylwild.itch.io/campfires | CC0 (page) | Free pack with source file | Lit, unlit and burnt campfire and torch states plus smoke to study or ship |
| Reactorcore explosion minipack | https://reactorcore.itch.io/explosion-spriteanim-sheet-minipack | CC0 (author comment) | 10 sheets | 32 and 64 px explosion references with 16 frames each |
| 2D dissolve with burn edge (mreliptik) | https://godotshaders.com/shader/2d-dissolve-with-burn-edge/ | CC0 code (page) | Godot shader library entry | Burn-edge band code to port to a pixel-snapped burn map |
| pimen Explosion Effect / Smoke n Dust 04 | https://pimen.itch.io/explosion-effect | Use and modify, no resale (page) | 30 + 9 effects with Aseprite files | A frame-count and timing reference at 16 to 96 px (study, not ship) |
| brullov Fire Animation | https://brullov.itch.io/fire-animation | Use in games, no resale (page) | 4.9 from 53 ratings, since 2019 | A size ladder (8x8 to 24x32) with start, loop and end parts |
| Lospec palette JSON | https://lospec.com/palette-list/endesga-32.json | Site terms not read | Worked for 4 palettes on 13 Nov 2026 | Exact fire ramp hex for build scripts |

---

## Sources
- https://lospec.com/pixel-art-tutorials/tags/fire
- https://www.slynyrd.com/pixelblog-catalogue
- https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects
- https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
- https://brullov.itch.io/fire-animation
- https://krishna-palacio.itch.io/minifantasy-raided-village
- https://idylwild.itch.io/campfires
- https://urais.itch.io/animatedtorches
- https://silasgamedev.itch.io/pixel-campfire
- https://pixeljoint.com/pixelart/161988.htm
- https://pixeljoint.com/forum/forum_posts.asp?TID=25996
- https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- https://pimen.itch.io/smoke-n-dust-04
- https://pimen.itch.io/explosion-effect
- https://reactorcore.itch.io/explosion-spriteanim-sheet-minipack
- https://itch.io/post/477565
- https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
- https://penusbmic.itch.io/pixel-art-tutorial-understanding-explosions
- https://lospec.com/palette-list/endesga-32.json, https://lospec.com/palette-list/resurrect-64.json, https://lospec.com/palette-list/apollo.json, https://lospec.com/palette-list/sweetie-16.json
- Search summaries only: https://opengameart.org/content/animated-pixel-torch, https://opengameart.org/content/camp-fire-animation, https://mattwalkden.itch.io/explosion-pack, https://sentient-dream-games.itch.io/pixel-effects-explosions-pack-01, https://rs-pixel-store.itch.io/pixel-explosion-vfx-pack, https://isotileuniverse.itch.io/isometrictiles-burntforest-set-01, https://pixeowl.itch.io/pixeowl-basic-tileset, https://godotshaders.com/?p=13632, https://bevy.org/examples/shaders/sprite-material/, https://virtualgodgames.itch.io/sfxp1, https://www.oleanderstudios.com/edge-lighting-how-to-add-interest-to-your-character-art/
- Earlier notes: `studies/vfx-fire/notes/06-design-feel.md`, `studies/vfx-fire/notes/10-pixel-games-smoke.md`, `studies/vfx-snow-32px/notes/11-pixel-art-craft-32px.md`
