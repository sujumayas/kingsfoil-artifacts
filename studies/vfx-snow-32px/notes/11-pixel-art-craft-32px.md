# 11. Pixel-art craft at 32 px (snow on 32x32 tiles, characters about 24x32)

Researcher angle: what pixel artists say and do at this size, and how it differs from 8 to 16 px art.
Date: 2026-11-12. 33 tool calls.

**Access notes (honest).**
- No artist tutorial on drawing snow tiles was found. Slynyrd (Raymond Schlitter) names snow and ice as a future tile topic in Pixelblog 43 and has not published it. saint11.art was not tried again (blocked in VFX #1). Pixel Logic is a paid book. No snow page from AdamCYounis, MortMort or Brandon James Greer came up in search.
- `lpc.opengameart.org` (LPC style guide) and `opengameart.org` pages returned HTTP 403.
- So most px numbers for snow edges, roof lips and flake sizes below are **inferences** built on general craft rules that are cited. They are marked. Treat them as starting values for the sandbox, to be judged by eye.
- Labels: **[C]** cited, **[I]** my inference, **[U]** recalled from memory with no URL fetched this session, verify before use.

---

## Q1. Snow ground tiles at 32 px

### Takeaway
At 32 px a tile holds a few deliberate clusters, a body colour and an edge treatment. Artists build a tile from a small set of repeated "key clusters" with empty space between them, in "a few colors". Nothing in the craft literature supports a rule-made speckle of single pixels. A snow ramp of 4 to 5 shades with value steps of about 10 to 16 points, saturation under 20%, and hue drifting from cyan-green through blue to violet as it darkens matches two well-used Lospec palettes. One of them has no pure white at all.

### Cited findings
- Tile size norms. Slynyrd calls 16x16 px "the most common" tile size and says anything above 32x32 px is "overkill for pixel art" [C]. So 32 px is the top of the range where pixel-art cluster rules still apply. https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
- Texture by key clusters (16 px tiles, top-down 3/4). Define key clusters and repeat them across tiles. Clusters "overlap the edges and loop around the tile" to hide seams. Key clusters should not touch edge to edge (corner contact is fine). Spread visual weight evenly. Use "a few colors". Too many colours blur the texture, and strong contrast inside a pattern makes noise. Do not put two busy textures side by side. Use negative space [C]. Same URL.
- Terrain edges. Side and corner variants come from trimming the base texture, which must loop on all four sides [C]. Sand uses long angled "S" shaped clusters with some irregularity. Water lines are "single pixel wide lines" with a shadow "a couple pixels down from the bright lines". Cast shadows "should not exceed a tile in length" and share one length [C]. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Snow as a planned topic. Pixelblog 43 lists snow, ice, lava and slime as later lessons [C]. None was found published by 12 Nov 2026. Same URL.
- Stray pixels are a named mistake. cure's Pixel Joint tutorial says independent pixels outside a cluster add noise and "expose the underlying grid". Allowed uses are specular highlights, stars, bubbles and tiny essential details [C]. https://pixeljoint.com/forum/forum_posts.asp?TID=11299
- Nothing 1 px thick. Derek Yu's "Chunky Pixels Rule" says to avoid rendering anything one pixel thick. He also names pillow shading and "naive coloring" (pure grey rocks) as mistakes [C]. https://www.derekyu.com/makegames/pixelart2.html
- Hue shift. cure's example bends highlights toward yellow and shadows toward blue. "The hue should logically follow its neighbors in the ramp" [C]. Same Pixel Joint URL. VFX #1 note 06 already cites saint11 for warm light and cold shadow, so it is not repeated here.
- Two named palettes, read as snow ramps (hex from the Lospec JSON, HSV computed by me):
  - Apollo, by AdamCYounis, 46 colours. Light neutral ramp `#ebede9` (V 93%, S 2%), `#c7cfcc` (V 81%, S 4%), `#a8b5b2` (V 71%, S 7%), `#819796` (V 59%, S 15%, hue 177), `#577277` (V 47%, S 27%, hue 189). The brightest colour in the whole palette is `#ebede9`. There is no `#ffffff` [C]. https://lospec.com/palette-list/apollo.json
  - Resurrect 64, by Kerrie Lake, 64 colours. Neutral ramp `#ffffff`, `#c7dcd0` (V 86%, S 10%, hue 146), `#9babb2` (V 70%, S 13%, hue 198), `#7f708a` (V 54%, S 19%, hue 275), `#625565` (V 40%, S 16%, hue 289). The ramp turns violet below V 60% [C]. https://lospec.com/palette-list/resurrect-64.json
- A 32 px top-down winter set exists under CC0 on OpenGameArt ("very basic 32x32 topdown snow tileset") [C for existence and size via search listing, licence not verified, page returned 403]. https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset
- Commercial 32x32 top-down winter packs to look at (not to copy): veih "Winter Land Pack" (32x32, house, igloo, trees, ice, snow, grass, from $5) https://veih.itch.io/winter-land-pack and Szadi art "RPG Worlds Snowy Lands" (32x32) https://szadiart.itch.io/rpg-worlds-snowy-lands [C, seller-reported].

### Inferences (starting values for 32x32 tiles, 640x360)
- **Snow ramp, 5 entries.** Highlight V 93 to 96%, S 2 to 4%, slightly warm. Body V 84 to 88%, S 4 to 10%, cool. Light shadow V 70%, S 10 to 13%, blue (hue about 200). Deep shadow V 54 to 59%, S 15 to 19%, blue-violet (hue 240 to 275). Sparkle `#ffffff`, single pixels only. Adjacent steps differ by 10 to 16 value points, which is what both palettes do.
- **Pure white share.** Apollo ships no pure white, Resurrect 64 has it as one top step. Keep `#ffffff` to sparkles. Target under 1% of snow pixels. Keep the highlight shade to about 10 to 15% of the snow area, the body to 60 to 70% and shadows to about 20%. No source gives these shares.
- **Marks per tile.** A full snow tile should carry about 3 to 6 marks (shallow dents, small drift arcs), each a cluster of 3 to 8 px in the light-shadow colour with 1 or 2 highlight pixels on its north-west side. Leave at least half of the tile as flat body colour. This is Slynyrd's "negative space" rule moved from 16 px to 32 px. A 32 px tile has 4 times the area but should not carry 4 times the marks.
- **Minimum cluster.** No snow patch smaller than 2x2 px, and prefer 3x2 or larger. A single snow pixel on grass is a stray pixel by cure's rule and a 1 px feature by Derek Yu's.
- **Edge against grass or dirt.** Light from the north-west. Highlight rim 1 px on north and west snow edges. Shadow line 1 px in deep-shadow colour on east edges and 2 px on south edges, because in a 3/4 view the south edge shows the snow's thickness. One more 1 px line of darkened ground under the south edge for deep snow. Edge wobble of 1 to 3 px with runs of unequal length. No straight run longer than 6 to 8 px, to avoid the banding cure describes when segments line up.
- **Partial cover and melt.** Draw thin snow as a small number of merged blobs that grow, not as a denser speckle. For a 32 px tile, 6 to 10 seed clusters that grow and merge read as patches. Melt should round patches off and split them, and leave the last snow in hollows and on the shadow side.
- **Three variants.** Give each threshold tile 2 to 3 variants picked by a position hash, plus mirroring (Slynyrd mirrors tiles for orientation variants), so the 32 px period does not show across 20 tiles.

### Gaps
- No artist source gives snow-edge widths, shade shares or mark counts for snow at any tile size.
- Mana Seed, LimeZu and Cup Nooble winter packs were not reached. Their tile sizes [U]: Mana Seed 16x16, LimeZu 16/32/48, Sprout Lands 16x16.
- The OpenGameArt CC0 licence needs a direct read of the page.

---

## Q2. Dithering at higher resolution

### Takeaway
Artists treat dither as a narrow transition between two close colours, not as a fill. Once a dithered area "becomes a field of its own" it reads as texture or noise. Low-density dither is the worst case. The VFX #1 dusting is exactly that case: at low depth a 4x4 Bayer threshold draws isolated single pixels at 6 to 25% density over whole tiles. At 8 px tiles the pattern period was half a tile and matched the art's grain. At 32 px tiles the same 4 px period repeats 8 times per tile and sits below the smallest hand-drawn cluster. Cluster the threshold pattern.

### Cited findings
- cure (Pixel Joint). Types are checkerboard (50/50), stylized, interlaced and random. Random dither adds single-pixel noise and is generally avoided. Dither is "often misused by inexperienced artists". If dither covers half the sprite, add a palette colour instead. It should mainly taper the edges of an opaque area. A 25% dither is called especially noisy. Lower contrast between the two colours gives a softer result [C]. https://pixeljoint.com/forum/forum_posts.asp?TID=11299
- Pixel Parmesan, "Dithering for Pixel Artists", 18 Jan 2021. "Extraneous dithering often creates visual noise or the unwanted illusion of texture." Transitional dither "generally works best when used sparingly". "some sprites are simply too small to dither". Character sprites that will be animated should not be dithered. Dithering "was largely not intended as a textural tool". Higher contrast needs more dither steps and more resolution. Patterns that look smooth at native size show when displayed larger. At 45 degrees a pattern disrupts an edge less. Closing advice: "Ask yourself if your pixel art really needs to be dithered." [C] https://pixelparmesan.com/dithering-for-pixel-artists
- Same article on size. Higher resolution weakens the softening harm of dither, and it finds dither most useful in relatively high-resolution, painterly work [C].
- Banding is a separate named mistake. cure defines it as neighbouring pixel runs ending at the same x or y, which exposes the grid. Types are hugging, fat pixels, skip-one, 45 degree and AA banding [C]. Same Pixel Joint URL.
- A 1:1 test. A vendor blog (Divoom, sells pixel displays) says to view at display size, and if the dithered area looks like TV static it is over-dithered [C, vendor]. https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- Motion. Slynyrd notes animation frames that change too fast look like noise [C]. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Dither on overlays. The only artist guidance found is to apply a pattern "as a mask or to a masked area of another layer" (Pixel Parmesan) [C].

### Inferences
- **Is ordered-dither coverage acceptable for thin snow at 32 px tiles? As a field, no.** It breaks three named rules at once: single pixels outside clusters, dither as a fill, and low-density dither. Density numbers for 4x4 Bayer: level 1/16 puts 64 isolated pixels on a 32 px tile, level 4/16 puts 256.
- **Where ordered dither is still fine.** A transition band 2 to 3 px wide at the edge of a solid snow patch, between two neighbouring ramp colours (body to light shadow, value gap about 15 points). Also the lamp-light palette blend from VFX #1, because the two palettes are close in value. Prefer the 50% checker over 25% patterns.
- **Clustered threshold.** Build the 32x32 threshold tile so that every coverage level is made of clusters of at least 2x2 px. Low thresholds seed 6 to 10 blobs in hollows. Mid thresholds grow and merge them. The top thresholds close the last gaps around tuft tips. This keeps "one byte of depth against a threshold" as the logic and makes every state look drawn.
- **Replace the 50% state with a colour.** cure's rule (add a colour instead of dithering half the area) suggests a "frost" colour: the ground ramp shifted toward pale blue. Thin snow then reads as frost-tinted ground with a few solid white clusters. That costs 1 to 2 palette entries per ground material.
- **Keep the pattern still.** Anchor the threshold in world space and never re-roll noise per frame. Coverage should change on a slow clock (seconds), so growth reads as weather and not as flicker.
- **Dither bands in snow shading.** Do not dither between snow shade bands across large areas. Use solid bands with hand-shaped borders. Reserve dither for the 2 to 3 px edge fade.

### Gaps
- No artist states a maximum dither area in px for any tile size. "Half the sprite" (cure) is the only bound found.
- No artist source on dither transparency for moving overlays or on Bayer against clustered-dot matrices by name. Pixel Parmesan does not name Bayer.

---

## Q3. Snow on objects in a 3/4 top-down view

### Takeaway
No tutorial with px numbers for roof snow, pine tiers, fences or lamp posts was found. The cited rules that apply are general: one light direction, shadows of one fixed length that stay under a tile, no 1 px thick forms, and clusters with a clear silhouette. The px values below are inferences for 32 px tiles.

### Cited findings
- Cast shadows "should not exceed a tile in length", share one length whatever the wall height, and fall on one or two wall faces [C]. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Avoid forms one pixel thick (Derek Yu) [C]. https://www.derekyu.com/makegames/pixelart2.html
- Pillow shading (bands that follow the outline and ignore the light) is a named mistake in both cure's and Derek Yu's tutorials [C].
- A common tile-tutorial convention is highlights on top-left edges and shadows on bottom-right edges [C, from a search summary of a general tile tutorial, weak]. https://pinnguaq.com/learn/pixel-art/pixel-art-3b-advanced-tiles-in-graphicsgale/

### Inferences (32 px tiles, 3/4 view, light from north-west)
- **Thickness scale.** In a 3/4 view a vertical height shows as rows on south-facing edges. Use 2 px for a dusting cap, 3 to 4 px for normal snow and 5 to 6 px for heavy snow. That is 1/16 to 3/16 of a tile. A 1 px cap breaks the chunky-pixel rule and vanishes next to a 1 px outline.
- **Roof.** Snow body in the body colour with a 1 px highlight line along the ridge and north-west edge. On the south eave draw a lip that hangs 1 to 2 px past the eave, with a thickness line 2 to 3 px tall in light shadow. Under the lip put 1 px of darkened wall or roof colour (2 px for heavy snow). Break the lip every 5 to 9 px with a 1 to 2 px scallop so it is not a ruler line. Leave 2 to 3 bare roof patches near the ridge and chimney at medium cover.
- **Pine (about 48 px wide, 64 to 80 px tall).** One cap per tier. Each cap follows the tier's upper silhouette, is 3 to 5 px thick at the centre and tapers to 2 px at the tips. Cover the top 40 to 60% of each tier and keep the dark underside visible. The value jump between snow and dark needles is what reads as "pine".
- **Fence.** A 2 px snow line on each rail (1 px highlight over 1 px body) and a 3x2 or 4x3 px cap on each post.
- **Rock.** A cap over the top third, 3 to 4 px thick, with a 1 px shadow under its south edge.
- **Lamp post.** A 2 to 3 px cap on the lantern top. Tint the cap warm on the lit side.
- **Outline.** Keep the object's 1 px dark outline under the snow lip. Do not outline the snow against the sky side with the dark colour. Use the deep-shadow blue-violet there, so the cap stays light.

### Gaps
- All px values in this section are inference. Measuring a few shipped winter tilesets at 32 px (RPG Maker VX Ace winter tiles, Tibia's Svargrond) by eye from their own pages would test them. This note did not open images.

---

## Q4. Characters about 24x32

### Takeaway
At 32 px tall the head takes a third to a half of the sprite, so legs are only 6 to 10 px. Common walk cycles are 3 drawn frames played as 4 steps (RPG Maker), 4 frames (Slynyrd 2019) and 6 frames (Mana Seed, Slynyrd 2025). Each has two contact frames per cycle, half a cycle apart. Footprints should be stamped there. With short legs, sinking must stay small: 8 px of clipping buries the whole leg of a chibi sprite.

### Cited findings
- Proportions. For small sprites "the head usually takes up a third to half of the total sprite". Realistic proportions "will result in a stick figure". The example sprite is "1 tile wide by 2 tiles tall" on 16 px tiles, so about 16x32 px [C]. https://www.slynyrd.com/blog/2019/10/21/pixelblog-22-top-down-character-sprites
- Frame counts, Slynyrd 2019. Walk 4 frames, run 8 frames. The walk reuses run frames and leaves out the full-stride frames. 4 directions, drawn as up, down and side with the side mirrored [C]. Same URL.
- Slynyrd 2025. Dummy sprite 26x32 px, which "roughly conforms to 1x2 16x16px tiles". 8 directions from 5 drawn views. Run cycle 6 frames. Vertical bob per stride is down 1 px, down 1 px, up 2 px. "the up movement is faster than the down movement". "one pixel can make a huge difference" [C]. https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation
- Mana Seed Character Base (Seliel the Shaper). Each frame sits in a 64x64 px cell on 512x512 sheets. The character is "around 32 pixels high". 4 directions. 6-frame walk, 6-frame run, 4-frame jump. Price $19.98. Proprietary licence, redistribution prohibited [C, seller-reported]. https://seliel-the-shaper.itch.io/character-base
- RPG Maker VX Ace. 32x32 px tiles (48x48 in MV and MZ). A character sheet is 3 columns by 4 rows per character, so 3 frames in 4 directions. Play order is middle, right, middle, left, and the middle frame is also the standing pose [C, community-reported, found through search results. The "3 frame animation limit" is confirmed on an asset page]. https://guttykreum.itch.io/jrpg-character-pack/devlog/134774/rpg-maker-vx-ace-compatibility-complete and https://himeworks.com/?p=3951
- Universal LPC spritesheet. Default frame 64x64 px. Animations include walk, run, slash, thrust, spellcast, shoot, hurt, climb, jump [C]. Walk is 9 frames and LPC tiles are 32x32 [U]. https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- Owlboy is drawn at 640x360 and Otus is 39 px tall [C, community-reported on a Steam forum]. https://steamcommunity.com/app/431730/discussions/0/3200369647710806615
- Dither on characters. Not recommended for animated character sprites (Pixel Parmesan) [C]. https://pixelparmesan.com/dithering-for-pixel-artists
- Cost of size. A vendor blog claims each doubling of sprite resolution roughly quadruples work per asset [C, author-reported, vendor]. https://bugnet.io/blog/choosing-a-pixel-art-resolution-for-your-game

### Inferences (24x32 px sprite on 32 px tiles)
- **Head.** 11 to 16 px tall. With a 12 px head, torso about 10 px and legs about 10 px. With a 16 px head (chibi), torso 9 px and legs 7 px.
- **Contact frames.**
  - 3 drawn frames (RPG Maker order 1, 2, 1, 0): columns 0 and 2 are the stride poses. Stamp on entering each of them.
  - 4 frames: contacts at frames 0 and 2, passing at 1 and 3. This matches the SANDBOX-SPEC choice.
  - 6 frames: contacts at 0 and 3. Slynyrd's bob (down 1, down 1, up 2) gives 3 frames per stride, with the lowest point on the frame after contact.
  - 8 frames: contacts at 0 and 4.
- **Stride and prints for tile steps.** One walk cycle per 32 px tile gives 2 prints per tile, 16 px apart along the path, left and right offset 3 px from the centre line. A print of 3x5 px (side travel 5x3) fits the chunky-pixel rule. Draw it as 1 px deep-shadow on the north-west inner edge, body-shadow fill, and a 1 px highlight rim on the south-east outer edge. A 2x2 dot at this scale is 1/16 of a tile wide and reads as a stray pixel.
- **Sink depth.** Boots on a 32 px sprite are about 3 px tall. Ankle 2 to 3 px, shin 4 to 5 px, knee 6 to 8 px. Cap clipping at 6 px for chibi proportions and 8 px for head-third proportions. SANDBOX-SPEC's cap of 8 px suits only the longer-leg build.
- **Front rim.** Draw the snow rim in front of the clipped feet as a 2 px tall, 10 to 14 px wide irregular band in body colour with a 1 px highlight on top. It must be at least 2 px so it does not read as an outline.
- **Shadow.** An ellipse about 14 to 16 px wide and 5 to 6 px tall under a sprite whose drawn body is 16 to 20 px wide, in the light-shadow snow colour as a solid shape. No dither, no alpha steps. Shrink it by 2 px when the character is sunk past the ankle.
- **Snow on the character.** A cap of 2 px on hat or hair (10 to 12 px wide) and 2x2 px on each shoulder. Grow it in 2 steps (1 px line, then 2 px cap) so it never appears as scattered single pixels.
- **Breath.** A 3 to 4 frame puff that grows from 2x2 to about 5x4 px, in the light-shadow colour, offset 2 to 3 px from the mouth in the facing direction.
- **Outline.** A 1 px dark outline matters more on snow than on grass, because the ground is now the lightest thing on screen. A coloured dark outline (deep blue-violet or dark brown) sits better on snow than pure black.

### Gaps
- No source gives drop-shadow sizes, outline colour practice at 24x32, or how artists draw a character standing in snow. The tall-grass method is documented in game code (see the games researchers' notes), not in artist tutorials.
- The official RPG Maker asset standards page was not fetched. LPC walk frame count and tile size are from memory.

---

## Q5. Falling snow as art

### Takeaway
The one shipped, readable-source reference with a known tile size is RPG Maker MV: one layer, a round flake 9 px wide on 48 px tiles (0.19 tile), at most 90 flakes, 63 to 86% opacity fading out in under a second. Scaled to 32 px tiles that is a 6 px flake, much larger than the 1 to 2 px flakes of VFX #1. Artists publish no flake-size rules. A mixed set of 1, 2 and 3 px flakes in three colour steps is my proposal.

### Cited findings
- RPG Maker MV `Weather.js` (48 px tiles). Snow bitmap is 9x9 px with a white circle of radius 4. Max sprites is `Math.floor(power * 10)`, so 90 at power 9. Opacity on spawn is 160 to 219 of 255. Each update moves a flake 3 px along a direction rotated π/16 (11.25 degrees) and subtracts 3 opacity. A flake respawns below opacity 40. Rain is 1x60 px and storm is 2x100 px. A grey dimmer overlay has opacity `power * 6` [C]. https://raw.githubusercontent.com/rpgtkoolmv/corescript/master/js/rpg_core/Weather.js
- Derived from that code. Lifetime is 40 to 60 updates. Travel is about 118 to 176 px, or 2.5 to 3.7 tiles of 48 px. If updates run at 60 Hz the fall speed is about 176 px/s, 3.7 tiles per second [C for the constants, the 60 Hz rate is U].
- Whole-pixel motion. With Godot's `viewport` stretch mode everything, including movement, snaps to art pixels [C]. https://ziva.sh/tools/pixel-perfect-resolution-calculator
- Loop pacing and density restraint are covered in VFX #1 note 06 (budgetpixel, Slime Rancher 2) and are not repeated.

### Inferences
- **Size by tile, not by pixel.** VFX #1 used 1 to 2 px on 8 px tiles (0.125 to 0.25 tile). MV uses 0.19 tile. The same share on 32 px tiles is 4 to 8 px, which is too heavy for a game where flakes must not hide players. A middle path for 640x360 with 32 px tiles:
  - far layer 1 px, deep-shadow or light-shadow blue, slow;
  - mid layer 2x2 px, body colour;
  - near layer 3 px plus shape (5 pixels in a 3x3 box) or 3x3 with corners cut, highlight colour, with a few 4 px flakes at most.
- **Other base resolutions (same 3 layers).** 320x180 with 16 px tiles: 1, 1 and 2 px. 480x270 with 16 to 24 px tiles: 1, 2 and 2 to 3 px. These are proportional guesses.
- **Depth by colour step, not alpha.** Use three ramp colours for far, mid and near so the flakes stay inside the palette. A far flake in pure white at 1 px is a stray bright pixel. In light-shadow blue it reads as depth.
- **Motion.** Move in whole pixels. Sway of 1 px for far, 1 to 2 px for mid, 2 to 3 px for near, with a period of 1 to 2 s. Fall speed in tiles per second should match across resolutions, so px speed is 4 times VFX #1's.
- **1 px flakes alone at 640x360** are 1/32 of a tile and read as sensor noise over hand-drawn tiles. Keep them only as the far layer.

### Gaps
- No artist tutorial with flake sizes for 320x180, 480x270 or 640x360 was found. RPG Maker VX Ace's snow bitmap (32 px tiles) would be the closest match and was not fetched. Flake sizes in Celeste, Stardew Valley and Pokémon belong to the games researchers.

---

## Q6. Choosing the base resolution

### Takeaway
640x360 is the right base for 32 px tiles and 24x32 characters. It shows 20 x 11.25 tiles, a character is 8.9% of screen height, and it scales by whole numbers to 720p (2x), 1080p (3x), 1440p (4x) and 4K (6x). 480x270 fails at 720p and 1440p. 320x180 scales everywhere but shows only 10 x 5.6 tiles.

### Cited findings
- 320x180 and 640x360 fill 1280x720, 1920x1080, 2560x1440 and 3840x2160 with whole-number scales and no bars. 384x216 and 480x270 fill 1080p and 4K but leave bars at 1440p [C]. https://ziva.sh/tools/pixel-perfect-resolution-calculator
- Godot 4 settings from the same page: viewport size set to the base, stretch mode `viewport`, aspect `keep` (bars) or `expand` (more world), `display/window/stretch/scale_mode = integer` (added in Godot 4.2), default texture filter Nearest. New 4.7 projects default to `canvas_items` and `expand`, so set these by hand [C].
- Slynyrd lists 320x180 (6x), 480x270 (4x) and 640x360 (3x) for a 1920x1080 target and finds 480x270 a good fit for his 16 px tile mockup [C]. https://www.slynyrd.com/blog/2019/10/21/pixelblog-22-top-down-character-sprites
- A Godot 4.4 pixel-art settings post uses a 640x360 viewport with a 1280x720 window override and integer scale mode [C, from a search summary]. https://itch.io/blog/806788/godot-44-settings-for-pixel-art
- Owlboy uses 640x360 with a 39 px tall hero [C, community-reported]. https://steamcommunity.com/app/431730/discussions/0/3200369647710806615
- Bugnet recommends 320x180 or 640x360 and warns against 4:3 bases on 16:9 screens [C, vendor blog, 10 Jun 2026]. https://bugnet.io/blog/choosing-a-pixel-art-resolution-for-your-game

### Computed table (my arithmetic)
| Base | 32 px tiles on screen | 24x32 character, share of height | 720p | 1080p | 1440p | 4K | Steam Deck 1280x800 |
|---|---|---|---|---|---|---|---|
| 320x180 | 10 x 5.63 | 17.8% | 4x | 6x | 8x | 12x | 4x, 40 px bars |
| 480x270 | 15 x 8.44 | 11.9% | 2.67x (no) | 4x | 5.33x (no) | 8x | 2x with wide bars |
| 640x360 | 20 x 11.25 | 8.9% | 2x | 3x | 4x | 6x | 2x, 40 px bars |

### Inferences
- Tibia's classic view is 15 x 11 tiles [U]. That is 480x352 px at 32 px tiles, which fits inside 640x360 with 160 px of width to spare and does not fit 480x270 in height.
- At 3x on 1080p one art pixel is 3 screen pixels. A 1 px flake or a Bayer speckle is then a clearly visible 3x3 square. Every stray pixel is easy to see, which raises the bar for cluster discipline compared with a phone at 1x.
- On a 390 px wide phone the canvas shows below 1x, so 1 px details drop out. Shapes of 2 px and larger survive. This is one more reason for the 2 px minimum.

### Gaps
- No artist source ties tile size to base resolution with a rule. The table is arithmetic.

---

## Q7. Palette

### Takeaway
A winter set at this size sits comfortably in 32 to 64 colours in total, with 4 to 5 for the snow ramp. Apollo (46) and Resurrect 64 (64) both carry a usable cool neutral ramp. Experienced artists set no colour limit but warn that large palettes are hard to control.

### Cited findings
- cure: there is no fixed colour limit. "If you can't make a good sprite in 4 colors, using 40 colors isn't going to help." With 200 colours, adjustments become much more work. Ramps often share their darkest and lightest colours [C]. https://pixeljoint.com/forum/forum_posts.asp?TID=11299
- Derek Yu: each colour needs a distinct role, or pixels "begin to blend together and get lost" [C]. https://www.derekyu.com/makegames/pixelart2.html
- Apollo, AdamCYounis, 46 colours, with a blue ramp `#253a5e`, `#3c5e8b`, `#4f8fba`, `#73bed3`, `#a4dddb` for ice and deep shadow [C]. https://lospec.com/palette-list/apollo
- Resurrect 64, Kerrie Lake, 64 colours, with a blue ramp `#484a77`, `#4d65b4`, `#4d9be6`, `#8fd3ff` [C]. https://lospec.com/palette-list/resurrect-64
- Lospec's winter tag (Snowflake 4, Winter Wonderland 8, Logcabin 11, Snowfall 19, Wintercode 36) is already listed in VFX #1 note 06.

### Inferences
- Budget for the sandbox and the game's winter set: snow 5 (4 ramp plus sparkle), packed snow 2, ice 3, frost-tinted ground 1 to 2 per ground material. VFX #1 used 58 base colours, which is inside the 46 to 64 range of the two palettes.
- Share the darkest snow shadow with the outline and night ramp (cure's shared-ends rule), so snow shadows tie into the rest of the scene.

### Gaps
- Lospec's licence terms for palettes were not read this session. Check before naming a palette in shipped credits.

---

## Gems

| Name | URL | Licence | Maturity evidence | What it saves |
|---|---|---|---|---|
| Lospec palette JSON endpoint | `https://lospec.com/palette-list/<slug>.json` | Site terms not read | Worked for 2 palettes on 12 Nov 2026 | Name, author and hex list for build scripts |
| Apollo palette | https://lospec.com/palette-list/apollo | Not verified | 46 colours, by AdamCYounis | A cool neutral snow ramp with no pure white |
| Resurrect 64 palette | https://lospec.com/palette-list/resurrect-64 | Not verified | 64 colours, by Kerrie Lake | A snow ramp that turns violet in shadow |
| Universal LPC Spritesheet Generator | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator | Art is a mix of CC0, CC-BY, CC-BY-SA, OGA-BY and GPL per asset. Credits must be shown in the app | Long-running community project, stars not checked | 64x64-frame characters for 32 px tile tests, with a credits file |
| "very basic 32x32 topdown snow tileset" | https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset | CC0 per search listing, page returned 403 | Not checked | An open 32 px snow set to study |
| Mana Seed Character Base (study only) | https://seliel-the-shaper.itch.io/character-base | Proprietary, no redistribution | Paid pack with a free demo | A reference for about 32 px tall characters with a 6-frame walk |
| Pixel-perfect resolution calculator | https://ziva.sh/tools/pixel-perfect-resolution-calculator | Web page, licence unknown | Covers Godot 4.2 to 4.7 settings | Scale factors and project settings for a base resolution |
| Aseprite Tiled Mode, Pyxel Edit | named in https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles | Commercial tools | Used by Slynyrd | Seam preview while painting a threshold tile |

## Suggested corrections for SANDBOX-SPEC (for the lead, I did not edit it)
1. Layer 4: the art threshold tile should guarantee clusters of at least 2x2 px at every level. Keep Bayer 4 and Bayer 8 as comparison styles only.
2. Layer 4: add a frost-tinted ground colour for the thinnest cover, so no state depends on a 25 to 50% dither.
3. Layer 6: cap sinking at 6 px if the sprite's head is half its height. 8 px suits a head of one third.
4. Layer 6: 4 frames with contacts at 0 and 2 agrees with Slynyrd. 6 frames (contacts at 0 and 3) is what Mana Seed and Slynyrd's 2025 template use.
5. Layer 7: default flakes of 1, 2 and 3 px in three ramp colours. Pure white only on the near layer.
6. Palette: no pure white in the snow body. Top highlight near V 93 to 96%.

## Sources
- https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
- https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- https://www.slynyrd.com/blog/2019/10/21/pixelblog-22-top-down-character-sprites
- https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation
- https://pixeljoint.com/forum/forum_posts.asp?TID=11299
- https://pixelparmesan.com/dithering-for-pixel-artists
- https://www.derekyu.com/makegames/pixelart2.html
- https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
- https://ziva.sh/tools/pixel-perfect-resolution-calculator
- https://bugnet.io/blog/choosing-a-pixel-art-resolution-for-your-game
- https://itch.io/blog/806788/godot-44-settings-for-pixel-art
- https://steamcommunity.com/app/431730/discussions/0/3200369647710806615
- https://raw.githubusercontent.com/rpgtkoolmv/corescript/master/js/rpg_core/Weather.js
- https://seliel-the-shaper.itch.io/character-base
- https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- https://guttykreum.itch.io/jrpg-character-pack/devlog/134774/rpg-maker-vx-ace-compatibility-complete
- https://himeworks.com/?p=3951
- https://lospec.com/palette-list/apollo.json
- https://lospec.com/palette-list/resurrect-64.json
- https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset (403, listing only)
- https://veih.itch.io/winter-land-pack
- https://szadiart.itch.io/rpg-worlds-snowy-lands
- https://pinnguaq.com/learn/pixel-art/pixel-art-3b-advanced-tiles-in-graphicsgale/ (search summary only)
- Blocked: https://lpc.opengameart.org/static/LPC-Style-Guide/build/styleguide.html (403)
- Earlier study, not repeated: `studies/vfx-snow/notes/06-design-feel-artists.md`
