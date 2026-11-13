# 17. Gap research: artist sources on snow, and a fact-check of the Godot claims

Gap researcher 17, 12 Nov 2026. 36 tool calls.

Labels. **[C]** read this session from the page, file or API named. **[S]** from a search-result summary only, page not opened. **[I]** my inference. **[K]** from memory, not re-read.

Source files for the fact-check were fetched as text into `scratch-17/dl/` (Godot source at the `4.7-stable` tag and `master`, class reference XML, docs `.rst` on the `4.7` branch, GitHub API JSON). No images were opened or saved.

## What this note adds to note 11

| Gap in note 11 | Result | Where |
|---|---|---|
| saint11.art "not tried again" | The index page opens. It lists 80 tutorials by file name. None is named snow, footprints, tracks or winter. The nearest are Ice, Sand, Wind, Tiles, TopDownTricks and Top-Down-Houses. Their content is inside 512x512 GIFs, which I did not open | Q1 |
| Slynyrd snow lesson "not published" | Still true. The catalogue runs to Pixelblog 64 (25 Sep 2026) with no snow, ice, winter or season post | Q1 |
| No Lospec search | Lospec's tutorial tag "snow" has 2 entries: an image tutorial by Luke Sadface (2017) and a snowfall loop video by Ryan Hooley (2015). Neither gives text I could read | Q1 |
| Mana Seed winter pack "not reached" | Reached. 16 px tiles, 5 autotiled grounds, 3 tree types in 3 states each, 7 rock types with and without snow, tree wall built from 128x128 px supertiles. No footprints | Q2 |
| No evidence on how packs deliver ground snow | Two packs ship snow as a transparent overlay autotile that sits on any ground (Mana Seed Weather Effects, Cozy Farm) | Q2 |
| No evidence on intermediate snow states | Time Fantasy Winter ships 9 terrain pairs, with "SnowGrass" as a half-way ground and "DarkSnow" as a second snow tone | Q2 |
| Summer and winter atlas layout | finalbossblues ships winter tiles "in the exact same arrangement as the originals". That is the layout note 12's UV-offset shader needs | Q2, Q3 |
| OpenGameArt CC0 licence "needs a direct read" | Page opened (HTTP 200). It carries the CC0 mark. Posted 5 Jul 2019 | Q2 |
| 32 px native winter references | Not found. Every commercial set reached is drawn at 16 px. Franuka's 32 px and 48 px versions are labelled 200% and 300% | Q2 |
| Artist px numbers for roof lips, pine caps, flake sizes | Still none. Note 11's values stay inferences | Q1, Gaps |
| Extra dither sources | One Pixel Joint critique thread with four artists against dither on small pieces and on environments | Q4 |

## Fact-check verdicts

| # | Claim | Source opened | Verdict | Corrected wording, if any |
|---|---|---|---|---|
| A1 | Latest stable is 4.7.2, 18 Aug 2026 | GitHub releases API, godotengine/godot | Confirmed. Published 18 Aug 2026, 16:12 UTC. 4.7-stable is 18 Jun 2026, 4.7.1 is 14 Jul 2026 | None. VFX #1's "19 Jun 2026" for 4.7 should read 18 Jun |
| A2 | 4.8 is at beta 3, 9 Nov 2026 | GitHub releases API, godotengine/godot-builds | Confirmed. beta1 15 Oct, beta2 29 Oct, beta3 9 Nov 2026 (16:16 UTC). No release candidate yet | None |
| B1 | `DrawableTexture2D` arrived in 4.7 | Class XML at `4.6-stable` (HTTP 404) and `4.7-stable` (present). PR #105701 | Confirmed. PR #105701 "Implement DrawableTextures", by ColinSORourke, merged 30 Jan 2026, milestone 4.7 | Add the PR number and date |
| B2 | Still experimental | `DrawableTexture2D.xml` at `4.7-stable` | Confirmed. `blit_rect`, `blit_rect_multi` and `setup` carry `experimental=""` | None |
| B3 | Formats are RGBA8, RGBA8_SRGB, RGBAH, RGBAF, no single channel | Same XML | Confirmed. Enum values 0 to 3 | None |
| B4 | Works on Compatibility | `drivers/gles3/storage/texture_storage.cpp` at `4.7-stable` | Confirmed in source only. `texture_drawable_initialize` (line 1206) and `texture_drawable_blit_rect` (line 1371) exist in the GLES3 backend. The class page, the tutorial and the PR text make no statement about renderers. Not tested in a browser | "The GLES3 backend implements it. No doc states renderer support and nobody in this study ran it on WebGL2" |
| C1 | `ImageTexture.update()` on Compatibility re-uploads the whole image with `glTexImage2D` | Same file, `4.7-stable` and `master` | Confirmed. `texture_2d_update` calls `texture_set_data`, which calls `_texture_set_data`. For a plain 2D texture the loop calls `glTexImage2D(blit_target, i, internal_format, w, h, ...)` per mip (line 2072 at 4.7, 2111 on master). `glTexSubImage2D` does not appear anywhere in the file | Add the exception in C2 |
| C2 | No sub-rectangle update exists | Same file, proposal #13012, issue #65762 | Confirmed for rectangles. One nuance. On `master`, a layer of a 2D array texture is updated with `glTexSubImage3D` for the full layer, and storage is allocated only on first use. So "one layer per chunk" uploads one layer and does not re-create the array | "No rectangle update. A texture array can be updated one whole layer at a time (read on master only)" |
| C3 | Proposal #13012 is open | GitHub API | Confirmed. Open, created 17 Aug 2025, 6 comments, last activity 23 Oct 2025. Maintainers point to engine issue #65762 (`texture_2d_update_partial()` missing, open since 13 Sep 2022, 11 comments) and say PR #80164 needs a rebase | Cite #65762 next to #13012 |
| D1 | Note 14: `master` has 2D SDF particle collision code in the GLES3 particle shader | `drivers/gles3/shaders/particles.glsl` at 4.0, 4.1, 4.2, 4.3, 4.7 and master | Corrected. The code is real, and it is old. `COLLIDER_TYPE_2D_SDF` is in the file at `4.0-stable`. It came with PR #68426, "Add GPUParticles to the OpenGL3 renderer", merged 15 Nov 2022 | "Present since 4.0, not new on master" |
| D2 | VFX #1: "Compatibility has no particle SDF collision" | 4.7 renderers table, `particles_storage.cpp`, `rasterizer_canvas_gles3.cpp`, class XML, issue #112926 | Half right. The 4.7 docs table does say "Particle SDF collision: Not supported" for Compatibility. In source that is true for 3D SDF colliders (two explicit warnings). The 2D path against `LightOccluder2D` is wired up in GLES3. But issue #112926 (open) reports particles turning invisible on Compatibility when collision is on, reproduced up to 4.7.2 | See the wording under Q-D below |
| D3 | GPUParticles2D runs on Compatibility on web at all in 4.7 | Web export doc, PR #68426, `GPUParticles2D.xml` | Could not verify by test. The web export targets WebGL 2.0 through Compatibility, and GLES3 particles exist since 4.0. `emit_particle` is documented as not supported on Compatibility | Keep "test before use" |
| E | Measured cost of `ImageTexture.update()`, `set_pixel` loops, byte-array uploads | 2 web searches, 2 GitHub issue searches, #13012, #65762, discussion #4017, forum thread 131693 | Could not verify. No measured ms found anywhere. Only qualitative statements and one piece of arithmetic | Note 12's gap stands. The study must run its own bench |
| F1 | TileMapDual is MIT, 1,313 stars, last push 3 Sep 2026 | LICENSE file, GitHub API, `plugin.cfg` | Confirmed. "Copyright (c) 2024 Pablo Gila-Herranz (@GilaPixel)". 60 forks. Addition: the GitHub Releases list is empty. Versions are tags, the newest is `v5.0.3`, and `plugin.cfg` reads `v5.0.3`. The README states no minimum Godot version | "Pin to tag v5.0.3. No release builds" |
| F2 | jess::codes repo is MIT | LICENSE file, GitHub API | Confirmed. "Copyright (c) 2024 jess-hammer". 628 stars, 59 forks, last push 9 Feb 2026 | None |
| G | Pixel-perfect settings for a 640x360 base | `ProjectSettings.xml` at `4.7-stable`, `multiple_resolutions.rst` on the 4.7 docs branch | Confirmed. Names and values in the table under Q-G | One detail. The class-reference default for stretch mode is `disabled`. `canvas_items` and `expand` are defaults only for projects created in the 4.7 editor |

---

## Half 1. Art sources

## Q1. Pixel artists teaching snow

### Takeaway
After a second pass, there is still no artist tutorial with readable numbers for top-down snow tiles, roof snow, footprints or flake sizes. The two best-known tutorial series (saint11 with 80 entries, Slynyrd with 64 posts) have no snow lesson. What exists is locked inside images and videos I could not read.

### Cited findings
- saint11 (Pedro Medeiros). The index at https://saint11.art/blog/pixel-art-tutorials/ lists 80 entries, each a 512x512 px animated image, free to view [C]. File names include Ice, Sand, Wind, Water, Rock, Wood, Tiles, Vegetation (3), Shading, IlluminationTechniques, Outlines, Subpixel, TopDownTricks, TopDownWalkCycle, TopDownRun, TopDownAttack, Top-Down-Houses, SmokeSheet and RocketTrail [C, list produced by the fetch tool from the page's image names]. No entry is named snow, footprint, track, frost or winter [C].
- A 2022 itch.io topic says he has no plans to make more tutorials of that kind [S]. https://itch.io/post/2597020 and the bundle page https://studiominiboss.itch.io/pixel-art-tutorials
- VFX #1 already cites one saint11 article (report source 95, the Medium piece on colour). I add no overlap.
- Slynyrd. The catalogue at https://www.slynyrd.com/pixelblog-catalogue runs from 1 to 64. The newest is "64 - Ninja Platformer", dated 25 Sep 2026 in its URL [C]. No post covers snow, ice, winter or seasons. The posts near the topic are 10 Water in Motion, 13 Rocks, 20 and 43 Top Down Tiles, 21 Top Down Objects, 33 Wind Effects, 44 Top Down Trees and 62 Landscape Backgrounds [C].
- Lospec. The tag page https://lospec.com/pixel-art-tutorials/tags/snow lists 2 tutorials [C]:
  - "Snow Tutorial", Luke Sadface, 2017, an image posted at https://twitter.com/Sadface_RL/status/941042542895878145
  - "Let's Make a Snowfall Pixel Art Animation Loop - Photoshop Tutorial", Ryan Hooley, 2015, https://www.youtube.com/watch?v=9j5fwyqOQc4
- Other leads, titles only [S]:
  - Penusbmic, "Pixel Art Tutorial - Snowy Landscape Tutorial", a paid video with Aseprite files, drawn at phone-wallpaper size, not top-down tiles. https://penusbmic.itch.io/pixel-art-tutorial-snowy-landscape-tutorial
  - Mislav Majdandžić, Skillshare, "Pixel Art Mastery - Advanced Textures and Shading (Part 3)", which has a lesson titled "Snow". https://www.skillshare.com/en/classes/Pixel-Art-Master-Course-Beginner-to-ExpertFreelance-Textures-and-Shading-Part-3/622494873
  - SqdPxl, "TUTORIAL - SIMPLE PIXEL SNOW", Jan 2018, mirrored at https://art.cleberg.net/post/sqdpxl/TUTORIAL-SIMPLE-PIXEL-SNOW-725179057
- YouTube. Two searches for snow, winter or snowy tileset videos by AdamCYounis, MortMort, Pixel Pete, Brandon James Greer, Saultoons and Pixel Overload returned no video by any of them [C for the empty result]. The search tool indexes YouTube poorly, so this is weak evidence that none exists.

### Inferences
- The brief assumed saint11 has tutorials on snow and on footprints. His own index does not show either. If they exist they are Patreon-only or carry other names. The Ice and Sand tutorials are the ones to view by eye. Sand is the nearest material lesson for a granular ground that takes prints [I].
- With both big series silent on snow, shipped tilesets are the only artist evidence. That makes Q2 the more useful half [I].

### Gaps
- I did not open any GIF or image, by rule. Someone with eyes on the saint11 Ice, Sand, TopDownTricks and Top-Down-Houses GIFs and the Sadface snow image could pull shade counts and edge shapes from them in ten minutes.
- The Ryan Hooley video page (flake sizes and counts for a loop) was not fetched.
- Pixel Joint's tutorial list was not searched beyond the thread in Q4.

## Q2. Winter tilesets and what they contain

### Takeaway
Winter sets are sold as a second copy of the summer set plus a few snow terrains. Ground snow comes as an autotiled terrain, and in two packs as a transparent overlay autotile that works on any ground. Objects come in discrete states (bare, snow-covered). No pack lists footprints. All sets reached are drawn at 16 px, and the 32 px versions are 2x upscales.

### Cited findings

| Pack | Native tile | Snow content | Price and licence | URL |
|---|---|---|---|---|
| Mana Seed "Winter Forest" (Seliel the Shaper) | 16x16 | 5 autotiled grounds (grass, sunken grass, dirt, cobblestone, snow). A transparent autotiled fallen-leaf layer plus a snow-covered version. 3 leafless trees (chestnut, maple, birch), each in fallen-leaf, bare and snow-covered states. 4 plants from 1 tile to 2x2 tiles, dry or snow-covered. 7 rock types set in snow, grass, dirt or water, with and without snow. Tree wall autotile built from 8x8-tile supertiles (128x128 px). Snow clumps for building bases. 6-frame waterfall | $19.99. Mana Seed User License, linked from the page, not read. A 61 kB free winter sample exists | https://seliel-the-shaper.itch.io/winter-forest [C] |
| Mana Seed "Pixel Art Effects - Weather" | not stated | Version 1.1 (15 Apr 2021, a 16 kB zip) added the Winter Forest snow-on-ground autotile as a "terrain brush-style transparent overlay" for any tileset | $6 | https://seliel-the-shaper.itch.io/weather-effects/devlog/242870/snowfall-autotile-update [C] |
| Time Fantasy "Winter Tiles" (finalbossblues) | 16x16, with RPG Maker VX/Ace and MV formatted copies | 9 terrain pairs named in a caption: SnowGrass, SnowGrass-Dirt, SnowGrass-Stone, SnowGrass-Cobble, SnowGrass-SnowFloor, Snow-Dirt, Snow-Cobble, Snow-SnowFloor, Snow-DarkSnow. Animated water with several borders. Cliffs and ice caves. 3 object sheets (wilderness and snow cave, forest, snow town) | $5, 565 kB. Author says commercial use is fine. No formal licence text on the page | https://finalbossblues.itch.io/time-fantasy-winter [C] |
| Omega Modern "Snow-Mega Modern" update (finalbossblues) | not stated | Winter copies of the modern tilesets in a 288 kB file, 23 Dec 2022. Tiles are "in the exact same arrangement as the originals", so a map can be copied to a winter version | Free for owners | https://itch.io/devlog/467420/snow-mega-modern [C] |
| Franuka "RPG snow tileset" | 16x16, also 32x32 and 48x48, described as 100%, 200% and 300% | Snow terrain with hills and coastlines, vegetation, ice, houses, well, fences, snowmen. 9 animated character sprites in 4 directions | $7.50. Commercial use allowed, no redistribution, credit optional | https://franuka.itch.io/rpg-snow-tileset [C] |
| shubibubi "Cozy Farm" snow update | not stated | Devlog lists "snow transparent", snow dirt, snow soil, snow water, snow cliff | not read | https://shubibubi.itch.io/cozy-farm/devlog/288819/snow-tiles-crops-and-flowers [S] |
| ELV Games "Fantasy Dreamland Winter Village" | not stated | Over 1,200 tiles, over 100 animated | not read | https://elvgames.itch.io/fantasy-dreamland-winter-village [S] |
| "Very Basic 32x32 Topdown Snow Tileset" | 32x32 | not itemised | CC0 mark on the page, posted 5 Jul 2019 | https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset [C] |

- On the Winter Forest page a buyer asked for a grass-to-snow edge. The author's suggestion was to make a transparent snow autotile by deleting the dirt or grass from an existing transition [C, relayed by the fetch tool]. Same URL as row 1.
- No page reached lists footprints, tracks or trampled snow as tiles [C for the five pages opened].
- No page states snow thickness, lip height or shade count in px [C].

### Inferences
- **Ground snow as a transparent overlay is an artist-made pattern, not only an engine idea.** Seliel sells exactly that. It supports the cheap fallback in CONTEXT scope 2 (an autotile snow overlay driven by a per-tile level) and the dual-grid plan in note 12 [I].
- **Two snow tones on the ground are normal.** Time Fantasy has Snow, SnowFloor and DarkSnow as separate terrains. That maps to the study's fresh, packed and shaded snow, each as a flat body colour with its own edge set [I].
- **An intermediate "SnowGrass" terrain is the hand-drawn version of thin cover.** It backs note 11's "frost-tinted ground" proposal with a shipped example. Thin snow as its own drawn ground, not as a dither of white over green [I].
- **Objects swap, ground blends.** Mana Seed draws each tree in 3 states and each rock with and without snow. A run-time mask on tall objects has no precedent in these packs. Plan for 2 sprite states per object (bare, capped) and switch on the tile's snow band, with the mask reserved for ground [I].
- **The same-arrangement rule is a production convention.** If the winter atlas mirrors the summer atlas cell for cell, note 12's `UV + winter_offset` shader works with no lookup table [I, from the Omega Modern devlog].
- **Scale question for the user.** Every commercial winter set reached is 16 px art. Franuka's 32 px version is a 2x upscale, so its smallest feature is 2x2 screen-art pixels. If Asterion's 32 px tiles are native (1 px features), the study's 1:1 values apply. If they are 2x-upscaled 16 px art, the threshold tile, flakes and prints should be built on a 2 px grid so the snow matches the art's pixel size. One Pixel Joint critic calls mixed resolutions "not good" (Q4) [I].

### Gaps
- LimeZu (Modern Exteriors), Cup Nooble (Sprout Lands), Pita, Szadi art contents, Kenney and PixelLab winter sets were not reached in budget.
- Tile counts for the snow edge sets are not stated on any page. The free 61 kB Mana Seed winter sample would show the count, but opening it means opening an image.
- The Mana Seed User License text was not read.
- VX Ace (32 px) copies of Time Fantasy are, as far as I know, 2x upscales [K, not stated on the page].

## Q3. Blending summer and winter tilesets through a mask at run time

### Takeaway
Not found, again. Every source describes a whole-tileset swap or a second map. The closest shipped art practice is the transparent snow overlay autotile in Q2.

### Cited findings
- A Godot forum thread (Godot 4.2, a 4800x3600 map) changes each node's texture to the season's texture on a signal. The poster rules out colour modulation because sprites need different seasonal changes [S]. https://forum.godotengine.org/t/how-can-i-effectively-change-the-texture/65272
- Asset devlogs describe instant tile replacement per season with no map rework [S]. https://smallmak.itch.io/pixelated-pastures-farming-sim-tileset/devlog/1149238/pixel-harvest-devlog
- finalbossblues' same-arrangement winter atlas, meant for copying a map [C]. https://itch.io/devlog/467420/snow-mega-modern
- A Godot prototype named "Season Switch" mentions shader experiments, with no method given [S]. https://playinsightstudios.itch.io/season-switch/devlog/894172/first-upload
- Searches naming Fields of Mistria, Roots of Pacha, Sun Haven and Kynseed returned nothing on how those games change seasons [C for the empty result].

### Checked and not found
Web search for a 2D season transition shader (Godot or Unity). Web search for the four farming games' season code. The Godot forum thread above. Itch devlogs for season packs. Note 12 had already checked godotshaders.com's snow tag and found only falling-snow overlays.

### Not checked
godotshaders.com searched for "season" directly, GDQuest, Unity forums, Eastward and Chained Echoes devlogs.

### Inferences
- A per-pixel summer-to-winter mask blend looks like new ground for 2D pixel art. That is a reason to show it clearly in the sandbox, and a reason to keep the overlay autotile as the fallback with shipped precedent [I].

## Q4. Readability of dither and noise at larger sizes (sources not in note 11)

### Cited findings
- Pixel Joint WIP thread "Hai's big WIP - Game art, landscapes and sprites", Jan 2014 to Apr 2016 [C]. https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=17989
  - skeddles: "Avoid dithering on smaller pieces, it just adds noise where you could have detail."
  - skeddles: "Use 'clusters' of color to show detail."
  - HarveyDentMustDie: "Environment is very much destroyed by dithering."
  - jalonso: dither is "disliked by pixelartists nowadays", and animating it is hard to master.
  - HarveyDentMustDie on scale: mixing resolutions "is not good solution".
  - The artist's own later verdict on his early work: "too many colours, too many stray pixels, ugly clusters."
- A tool site's guide says dither gets muddled at 16x16 or below and works best at 32x32 and above [S, weak, vendor]. https://pixnote.net/en/learn/dithering

### Inferences
- These agree with cure and Pixel Parmesan in note 11. Nothing here reverses note 11's verdict that a low-density ordered dither is wrong as a field over 32 px tiles [I].
- The "mixing resolutions" remark bears on note 12. A coarse field (1:2 or 1:4) must never show its cells as 2 px or 4 px blocks next to 1 px art. Bilinear sampling plus an art-resolution threshold tile meets that. Nearest sampling does not [I].

### Gaps
- Still no artist source with a px bound on dither area by tile size.

---

## Half 2. Fact-check detail

## Q-A. Godot versions

### Cited findings
- `api.github.com/repos/godotengine/godot/releases` [C]: 4.7-stable 2026-06-18 12:06 UTC, 4.7.1-stable 2026-07-14, 4.7.2-stable 2026-08-18 16:12 UTC. 4.6.3 is 2026-05-20. 3.6.3 is 2026-08-22.
- `api.github.com/repos/godotengine/godot-builds/releases` [C]: 4.8-dev7 2026-10-01, beta1 10-15, beta2 10-29, beta3 2026-11-09 16:16 UTC. The beta3 note calls beta snapshots "feature-complete".

### Gaps
- I did not read the 4.8 change list for 2D or particles. Two 4.8 PRs touch this study's code paths: #124484 (a particle material UBO binding fix for GLES3, merged 15 Oct 2026, fixing a regression from #124336 on the 4.8 branch) and #121054 (drawable texture sRGB clamping, merged 15 Jul 2026) [C, GitHub API].

## Q-B. DrawableTexture2D

### Cited findings
- PR #105701 "Implement DrawableTextures", author ColinSORourke with help from clayjohn and BastiaanOlij, merged 30 Jan 2026, milestone 4.7. It implements reduz's proposal #7379. Polygon blits were left for a later PR [C]. https://github.com/godotengine/godot/pull/105701
- Follow-ups in 4.7: #118535 removed `set_width` and `set_height` because they did nothing (14 Apr 2026). #118242 fixed the `drawable_type` property (13 Apr 2026) [C, GitHub search API].
- `DrawableTexture2D.xml` at `4.7-stable`: brief text "A 2D texture that supports drawing to itself via Blit calls." Three methods flagged experimental. Four formats, all RGBA [C].
- The tutorial on the 4.7 docs branch has one limit that matters: premultiplied alpha blend mode is not supported [C]. https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/drawable_textures.rst
- clayjohn on proposal #13012, 25 Aug 2025: drawable textures are a different use case because "Images support formats that Drawable textures doesn't support at all" [C].

### Inferences
- That comment is the maintainers saying R8 fields belong on the `Image` path. A one-byte snow field has no drawable format. Using `DrawableTexture2D` for it costs 4 bytes per cell [I].

## Q-C. Texture upload on Compatibility

### Cited findings
- `texture_2d_update` body on master (lines 1307 to 1317) [C]: calls `texture_set_data(p_texture, p_image, p_layer)`, then `texture_resize_data` for memory accounting.
- `_texture_set_data` upload loop on master (lines 2090 to 2113) [C]:
  - plain 2D, uncompressed: `glTexImage2D(blit_target, i, internal_format, w, h, 0, format, type, &read[ofs])`
  - plain 2D, compressed: `glCompressedTexImage2D`
  - 2D array: `glTexImage3D` with a null pointer only when `p_initialize` is true, then `glTexSubImage3D(GL_TEXTURE_2D_ARRAY, i, 0, 0, p_layer, w, h, 1, ...)` for the one layer
- A text search of the whole file finds no `glTexSubImage2D` at `4.7-stable` or on master [C].
- Godot 3 had `VisualServer.texture_set_data_partial()`. Its absence in 4 is tracked in issue #65762, open since 13 Sep 2022 [C]. https://github.com/godotengine/godot/issues/65762

### Inferences
- A `Texture2DArray` with one layer per chunk is the only stock route to a partial upload on Compatibility. Each update still sends a full layer. `ImageTextureLayered.update_layer(image, layer)` is the script call [K, not re-read].
- The array path was read on master. Check the 4.7 tag before relying on it [I].

## Q-D. 2D particle collision on Compatibility

### Takeaway
VFX #1's design choice stands, but its stated reason is too broad, and note 14's "on master" is wrong about timing. The engine has had a 2D SDF collision path for Compatibility particles since 4.0. The docs table says particle SDF collision is unsupported on Compatibility without saying 2D or 3D. An open bug makes the 2D path unreliable through 4.7.2. Flakes should still compute their own landing.

### Cited findings
- Docs. The 4.7 renderers page, table "Other features": "Particle SDF collision" is "Not supported" under Compatibility and supported under Mobile and Forward+. "Particle trails" has the same row [C]. https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/renderers.rst (lines 368 to 370)
- That row came from godot-docs PR #11609 by Calinou, closed 15 Jan 2026. It was prompted by a user note on the 3D particle trails page [C]. https://github.com/godotengine/godot-docs/pull/11609 and https://github.com/godotengine/godot-docs-user-notes/discussions/512
- Source, 3D. `drivers/gles3/storage/particles_storage.cpp` at `4.7-stable` warns "SDF Particle Colliders are not available in the Compatibility renderer." (line 707) and that Compatibility "does not support SDF collisions in 3D particle shaders" (line 1419) [C].
- Source, 2D. The same file has `particles_set_canvas_sdf_collision` (line 516) and fills collider 0 as `COLLISION_TYPE_2D_SDF` (lines 585 to 626). `rasterizer_canvas_gles3.cpp` calls it with the render target's SDF texture (line 1227). `particles.glsl` reads the SDF and resolves the hit (lines 356 to 390) [C].
- History. `COLLIDER_TYPE_2D_SDF` is in `particles.glsl` at the 4.0, 4.1, 4.2 and 4.3 stable tags. PR #68426 "Add GPUParticles to the OpenGL3 renderer", by clayjohn, merged 15 Nov 2022 for 4.0 [C].
- Class reference at 4.7. `GPUParticles2D`: 2D particles "can optionally collide with LightOccluder2D", with no renderer caveat. `emit_particle` is "only supported on the Forward+ and Mobile rendering methods, not Compatibility". `LightOccluder2D.sdf_collision` defaults to true [C].
- Bug. Issue #112926, "GPUParticles2D are invisible when process material collision mode is enabled", opened 18 Nov 2025 on 4.5.1 with OpenGL 3 (Compatibility) on Windows and NVIDIA. Still open. Users reproduce it on 4.6, 4.7 and 4.7.2-stable (12 Oct 2026). One maintainer could not reproduce on AMD. A workaround is a `LightOccluder2D` with a valid polygon in the scene. The reporter posted a candidate fix for `float_to_vec4` in `canvas_sdf.glsl` on 13 Oct 2026. I found no merged PR [C]. https://github.com/godotengine/godot/issues/112926
- A second open issue, #92049, reports wrong offsets on collision when the `Camera2D` is rotated [C, title only].
- Web. "Godot 4 can only target WebGL 2.0 (using the Compatibility rendering" method) [C]. https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/export/exporting_for_web.rst

### Suggested wording for the report
"Godot's Compatibility renderer has no 3D particle SDF colliders. For 2D it has a collision path against LightOccluder2D since 4.0, but the 4.7 renderer table lists particle SDF collision as unsupported, and an open bug (#112926, reproduced on 4.7.2) hides particles when collision is on. We do not rely on it. Flakes compute their own landing."

### Inferences
- Even when it works, SDF collision answers "did this particle touch an occluder outline". Snow landing needs "did this flake reach ground height at this tile", which is a z test, not a 2D outline test. So the engine path would not replace the z-flake rule from VFX #1 [I].

### Gaps
- Nobody in this study has run `GPUParticles2D` with collision in a WebGL2 browser. I could not test.
- I did not read the docs' 2D particle pages for a collision section. The page I fetched (`particle_systems_2d.rst`) has no mention of collision.

## Q-E. Measured upload and pixel-loop costs

### Cited findings
- No measurement found. Searched: two web searches with sizes and "ms", GitHub issue search for "ImageTexture update slow" and "texture_2d_update performance", the comments on #13012 and #65762 [C for the empty result].
- Qualitative only. A forum answer on Godot 4.5.1 says `texture_2d_update()` "will still cause bottleneck" if called every frame [S]. https://forum.godotengine.org/t/how-to-make-a-decal-notice-that-its-texture-changed/131693
- Arithmetic only. Discussion #4017 gives a 128x128 patch of a 2048x2048 image as 256 times less data [S]. https://github.com/godotengine/godot-proposals/discussions/4017
- A forum thread on optimising constant changes to an `Image` exists and was not opened [S]. https://forum.godotengine.org/t/best-way-to-optimize-constant-changes-to-an-image/69286

### Gaps
- This is the largest open number in the study. A 20-line Godot test must time `ImageTexture.update()` for 160x90 R8, 320x180 R8, 640x360 R8 and 640x360 RGBA8 on the Compatibility renderer, in a browser, on the target laptop and phone. It should also time a GDScript loop writing 2,350 and 37,600 bytes into a `PackedByteArray`.

## Q-F. Dual-grid add-ons

### Cited findings
- TileMapDual, https://github.com/pablogila/TileMapDual [C]. LICENSE: MIT, "Copyright (c) 2024 Pablo Gila-Herranz (@GilaPixel)". 1,313 stars, 60 forks, default branch `main`, last push 3 Sep 2026, not archived. GitHub Releases: none. Tags: `v5.0.3`, `v5.0.2`, `v5.0.0rc2`, `v5.0.0rc1`, `v5.0.0a3`. `addons/TileMapDual/plugin.cfg` reads `version="v5.0.3"`. v5 is a full rewrite with square, isometric and hex grids, and a `TileMapDualLegacy` node keeps the v4.0.3 behaviour. Install by copying `addons/TileMapDual`.
- The README names no minimum Godot version [C]. The add-on is a custom `TileMapLayer`, a node that arrived in Godot 4.3 [K].
- The README also links a GDScript port of jess::codes' system (https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript) and a tool that builds the 15-tile set from 6 symmetric tiles (https://github.com/kleingeist37/godot-wang-converter) [C, links only, licences not read].
- jess-hammer/dual-grid-tilemap-system-godot [C]. LICENSE: MIT, "Copyright (c) 2024 jess-hammer". 628 stars, 59 forks, last push 9 Feb 2026.

### Gaps
- The date of tag `v5.0.3` was not read. Whether the add-on runs on 4.7.2 or the 4.8 betas is untested.

## Q-G. Pixel-perfect settings for 640x360 in Godot 4.7

### Cited findings
All from `doc/classes/ProjectSettings.xml` at `4.7-stable` unless noted [C].

| Setting | Type and class-reference default | Value for this project | Notes from the reference |
|---|---|---|---|
| `display/window/size/viewport_width` | int, 1152 | 640 | |
| `display/window/size/viewport_height` | int, 648 | 360 | |
| `display/window/stretch/mode` | String, `"disabled"`. Options `disabled`, `canvas_items`, `viewport` | `viewport` | `viewport` renders to a root viewport at the base size and then scales it, "Recommended for games that use a pixel art aesthetic". `canvas_items` renders at the target resolution, and 2D loses the 1:1 sprite-to-screen pixel match. `canvas_items` is the default for projects created in 4.7 |
| `display/window/stretch/aspect` | String, `"keep"`. Options `ignore`, `keep`, `keep_width`, `keep_height`, `expand` | `keep` for bars, `expand` to show more world | `expand` is the default for projects created in 4.7 |
| `display/window/stretch/scale_mode` | String, `"fractional"`. Options `fractional`, `integer` | `integer` | The factor is floored to a whole number. A window smaller than the base size clips, so set `Window.min_size` to the base size |
| `rendering/2d/snap/snap_2d_transforms_to_pixel` | bool, false | true if snapping is wanted | Read only at project start. At run time use `RenderingServer.viewport_set_snap_2d_transforms_to_pixel`. Not advised together with the vertex setting |
| `rendering/2d/snap/snap_2d_vertices_to_pixel` | bool, false | false | Same notes. The reference says to prefer the transform setting |
| `rendering/textures/canvas_textures/default_texture_filter` | int, 1 (keywords "nearest, linear") | 0, Nearest | Enum order 0 Nearest, 1 Linear is [K] |

- The 4.7 "Multiple resolutions" page, pixel-art list [C]: viewport sizes "between 256×224 and 640×480", 640×360 "is a good baseline", stretch mode `viewport`, scale mode `integer`. Its worked example is a 640×360 base in a 1366×768 window, shown at 1280×720 with `integer`. It also warns that plain fullscreen is 1 px short and can break the whole-number factor. https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/multiple_resolutions.rst

### Inferences
- With `viewport` stretch all 2D output is already on the 640x360 grid, so the two snap settings matter less than under `canvas_items`. They still stop sub-pixel sprite positions from shimmering when the camera moves [I].
- A project made in the 4.7 editor starts with `canvas_items` and `expand`. Both must be changed by hand, as note 11 says [C plus I].

---

## Suggested corrections (for the lead, I edited no other file)

1. VFX #1 report, lines 38, 277 and 1269. Replace "Compatibility has no particle SDF collision" with the wording in Q-D. The decision (compute landing in our own code) does not change.
2. Note 14, line 225. The GLES3 2D SDF code is not new on master. It dates from 4.0 (PR #68426, 15 Nov 2022). Add issue #112926.
3. Note 12, Q5. Add that a texture-array layer updates through `glTexSubImage3D` without re-creating the array (master). Add engine issue #65762 beside proposal #13012. Add PR #105701 and its merge date.
4. Note 12, gems. TileMapDual has no GitHub releases. Pin to tag `v5.0.3`.
5. Note 11, Q1 gap. The OpenGameArt 32 px snow set is CC0 on its page.
6. Note 11, access notes. saint11.art is reachable and has no snow or footprint tutorial in its index.
7. SANDBOX-SPEC. Consider a comparison mode "overlay autotile" beside the threshold-tile mode, since that is what shipped winter packs do (Q2). Consider a "pixel grid 2x" toggle for games whose 32 px tiles are upscaled 16 px art.

## Gems

| Name | URL | Licence | Maturity evidence | What it saves |
|---|---|---|---|---|
| TileMapDual | https://github.com/pablogila/TileMapDual | MIT (LICENSE file read) | 1,313 stars, tag v5.0.3, last push 3 Sep 2026, no release builds | Dual-grid `TileMapLayer` for a snow overlay with 15 tiles |
| godot-wang-converter | https://github.com/kleingeist37/godot-wang-converter | Not read | Linked from the TileMapDual README | Builds the 15-tile set from 6 drawn tiles |
| dual-grid GDScript port | https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript | Not read | Linked from the TileMapDual README | A GDScript reference for the 16 rules |
| Mana Seed winter sample (study only) | https://seliel-the-shaper.itch.io/winter-forest | Mana Seed User License, not read | Paid pack at version 4.3a with a free 61 kB sample | A reference for snow-covered object states at 16 px |
| "Very Basic 32x32 Topdown Snow Tileset" | https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset | CC0 (page read) | Posted 5 Jul 2019 | An open 32 px snow set for sandbox tests |
| saint11 tutorial index | https://saint11.art/blog/pixel-art-tutorials/ | Free to view, licence not stated | 80 tutorials, widely shared | Ice, Sand, TopDownTricks and Top-Down-Houses for the artist to view |

## Sources

Art
- https://saint11.art/blog/pixel-art-tutorials/
- https://www.slynyrd.com/pixelblog-catalogue
- https://lospec.com/pixel-art-tutorials/tags/snow
- https://twitter.com/Sadface_RL/status/941042542895878145 (listed by Lospec, not opened)
- https://www.youtube.com/watch?v=9j5fwyqOQc4 (listed by Lospec, not opened)
- https://penusbmic.itch.io/pixel-art-tutorial-snowy-landscape-tutorial (search summary)
- https://www.skillshare.com/en/classes/Pixel-Art-Master-Course-Beginner-to-ExpertFreelance-Textures-and-Shading-Part-3/622494873 (search summary)
- https://art.cleberg.net/post/sqdpxl/TUTORIAL-SIMPLE-PIXEL-SNOW-725179057 (search summary)
- https://itch.io/post/2597020 (search summary)
- https://seliel-the-shaper.itch.io/winter-forest
- https://seliel-the-shaper.itch.io/weather-effects/devlog/242870/snowfall-autotile-update
- https://finalbossblues.itch.io/time-fantasy-winter
- https://itch.io/devlog/467420/snow-mega-modern
- https://franuka.itch.io/rpg-snow-tileset
- https://shubibubi.itch.io/cozy-farm/devlog/288819/snow-tiles-crops-and-flowers (search summary)
- https://elvgames.itch.io/fantasy-dreamland-winter-village (search summary)
- https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset
- https://forum.godotengine.org/t/how-can-i-effectively-change-the-texture/65272 (search summary)
- https://smallmak.itch.io/pixelated-pastures-farming-sim-tileset/devlog/1149238/pixel-harvest-devlog (search summary)
- https://playinsightstudios.itch.io/season-switch/devlog/894172/first-upload (search summary)
- https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=17989
- https://pixnote.net/en/learn/dithering (search summary)

Godot
- https://api.github.com/repos/godotengine/godot/releases
- https://api.github.com/repos/godotengine/godot-builds/releases
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml (and the 404 at `4.6-stable`)
- https://github.com/godotengine/godot/pull/105701
- https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/drawable_textures.rst
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/texture_storage.cpp and the same path on `master`
- https://github.com/godotengine/godot-proposals/issues/13012
- https://github.com/godotengine/godot/issues/65762
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/shaders/particles.glsl (also at 4.0, 4.1, 4.2, 4.3 stable tags and `master`)
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/particles_storage.cpp
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
- https://github.com/godotengine/godot/pull/68426
- https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/renderers.rst
- https://github.com/godotengine/godot-docs/pull/11609
- https://github.com/godotengine/godot-docs-user-notes/discussions/512
- https://github.com/godotengine/godot/issues/112926
- https://github.com/godotengine/godot/issues/92049 (title only)
- https://github.com/godotengine/godot/pull/124484
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/GPUParticles2D.xml
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/LightOccluder2D.xml
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ParticleProcessMaterial.xml
- https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/export/exporting_for_web.rst
- https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ProjectSettings.xml
- https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/multiple_resolutions.rst
- https://forum.godotengine.org/t/how-to-make-a-decal-notice-that-its-texture-changed/131693 (search summary)
- https://github.com/godotengine/godot-proposals/discussions/4017 (search summary)
- https://github.com/pablogila/TileMapDual (LICENSE, README, `plugin.cfg`, API)
- https://github.com/jess-hammer/dual-grid-tilemap-system-godot (LICENSE, API)

Raw fetched text: `studies/vfx-snow-32px/notes/scratch-17/dl/`.
