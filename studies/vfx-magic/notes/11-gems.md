# 11. Gems for spell VFX (code, tools, free packs)

Researcher 11, VFX #10 Magic and spell VFX. All checks ran on 2026-11-11.

## How I verified

- GitHub repos. I queried the GitHub API with `gh` for stars, last push, latest release and archive state, then decoded the licence file itself and read its first lines. "LICENSE read" in the table means that. Scripts are in `scratch-11/`.
- Web pages (itch.io, kenney.nl, godotshaders.com, torcado.com, trace.umd.edu). I opened each page and took the licence wording from it. itch.io packs have no licence file, so the wording on the page is all there is.
- Flags. Low = MIT, BSD, Apache, CC0. Copyleft = GPL, AGPL, CC BY-SA (study and re-implement). None = no licence found (study only). Custom = the author's own terms, read them before shipping. Paid = commercial tool.
- Compatibility renderer notes are my inference unless I say "read". No repo here publishes a Compatibility or web test matrix.

## Key question 1. Which gems exist and what are their terms?

### Takeaway

Permissive code exists for almost every piece Asterion needs. The best reference code for a Tibia-like is MIT (OTClient). The best effect-code libraries to read are GPL (Mindustry, Shattered Pixel Dungeon), so read them for ideas and write fresh code. Free pixel spell packs on itch.io mostly use custom "no resale" terms, and only Kenney and Foozle are clean CC0.

### Table A. Godot 4 resources

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| GDQuest godot-shaders | https://github.com/gdquest-demos/godot-shaders | LICENSE read. Code and shaders MIT, art assets CC BY-NC-SA 4.0 | 4,202 stars, pushed 2026-05-16, release 1.0.0 (2024-09-15) | `PalettSwap2D`, `dissolve2D`, `dissolve2D_mask`, `outline2D_inner`, `outline2D_outer`, `outline2D_inner_outer`, `shockwave`, `baked_sprite_glow`, `force_field` in `godot/Shaders/` (directory listed) | Low for shaders. Do not ship the textures |
| GDQuest godot-visual-effects | https://github.com/gdquest-demos/godot-visual-effects | LICENSE read. Same dual licence | 1,348 stars, pushed 2026-05-16, no release | Worked VFX scenes from the VFX Secrets course | Low for code |
| GDQuest godot-4-VFX-assets | https://github.com/gdquest-demos/godot-4-VFX-assets | LICENSE read. Same dual licence | 137 stars, pushed 2026-05-16 | Godot 4 particle examples | Low for code |
| Godot demo projects | https://github.com/godotengine/godot-demo-projects | LICENSE.md read. MIT | 9,786 stars, pushed 2026-10-08, release 4.7 (2026-07-07) | `2d/particles`, `2d/glow`, `2d/screen_space_shaders`, `2d/sprite_shaders`, `2d/bullet_shower`, `2d/custom_drawing` (directory listed) | Low |
| haowg GODOT-VFX-LIBRARY | https://github.com/haowg/GODOT-VFX-LIBRARY | LICENSE read. MIT | 358 stars, pushed 2026-01-25. README names a production game, Land of Oblivion (Steam app 2457740) | 35+ particle effects and 17+ shaders, VFX manager with auto-cleanup of one-shots | Low |
| RPicster particle and VFX textures | https://github.com/RPicster/Godot-particle-and-vfx-textures | LICENSE read. CC0 1.0 | 379 stars, last push 2020-12-02 (finished, not abandoned code) | Soft glow, flare and particle textures to downsample or threshold | Low |
| GodotRetro | https://github.com/ahopness/GodotRetro | LICENSE read. CC0 1.0. README badge says "CC0 & MIT" | 809 stars, pushed 2026-07-07 | Dither, palette-limit and other retro shaders | Low |
| cleanEdge (torcado) | https://torcado.com/cleanEdge/ and https://gist.github.com/torcado194/e2794f5a4b22049ac0a41f972d14c329 | Read in the gist header. MIT, copyright 2022 torcado | Gist updated 2026-10-20, 13 comments. Ships `cleanEdge.gdshader` and a Shadertoy GLSL file | Rotating missile sprites at run time without jumbled pixels. `CLEANUP` define should be off for rotation only, per the source comment | Low |
| Godot Aseprite Wizard | https://github.com/viniciusgerevini/godot-aseprite-wizard | LICENSE read. MIT | 1,403 stars, pushed 2026-11-11, release v9.8.0-4 (2026-03-03) | Aseprite flipbooks to AnimatedSprite2D or AnimationPlayer | Low |
| Importality | https://github.com/nklbdev/godot-4-importality | LICENSE read. MIT | 548 stars, pushed 2026-03-21 | Imports Aseprite, Pixelorama and other formats as animations | Low |
| Smooth pixel camera demo | https://github.com/voithos/godot-smooth-pixel-camera-demo | MIT-LICENSE.txt read. MIT | 26 stars, pushed 2023-11-02 | Smooth camera with pixel-perfect rendering in Godot 4 | Low |
| BulletUpHell | https://github.com/Dark-Peace/BulletUpHell | LICENSE.md read. MIT | 371 stars, pushed 2026-05-13, Godot 3 and 4 | Pooled projectiles and pattern data. Read for pooling, do not adopt whole | Low |
| godot-object-pool | https://github.com/godot-addons/godot-object-pool | LICENSE read. MIT (2016) | 49 stars, pushed 2024-01-31 | Small pool pattern. Likely needs porting to Godot 4 (inference from dates) | Low |
| GPUTrail | https://github.com/celyk/GPUTrail | LICENSE read. MIT | 314 stars, pushed 2026-09-27 | GPU trail for Godot 4. Built on 3D particles, so read the idea only | Low |
| Godot-Trail-System | https://github.com/OBKF/Godot-Trail-System | LICENSE read. MIT | 369 stars, last push 2021-05-29 (Godot 3 era) | Ribbon trail maths | Low |
| godot_trail_2d | https://github.com/Arnklit/godot_trail_2d | MIT per GitHub API field, licence file not opened | 1 star, pushed 2024-11-11 | Line2D-based Trail2D node. Too small to trust, 30 lines to rewrite | Low |
| Godot Shaders site | https://godotshaders.com/license/ | Page read. Each shader is CC0, MIT or GPL v3, chosen by its author. No default stated | Community site, licence shown per shader | Outline, dissolve, shockwave, beam, magic circle picks. Check each page | Per shader |
| "2D lightning" shader | https://godotshaders.com/shader/2d-lightning/ | Page read. MIT | Published 2021-07-06. Godot 3 syntax (`hint_color`), a commenter reports a compile error on 4.3 | Procedural lightning in a `canvas_item` shader, no screen read | Low |

### Table B. Authoring tools

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Effekseer | https://github.com/effekseer/Effekseer | LICENSE read. MIT | 2,064 stars, release 1808 on 2026-10-30 | Particle editor. Use it to render flipbooks, not as a runtime | Low |
| EffekseerForGodot4 | https://github.com/effekseer/EffekseerForGodot4 | LICENSE read. MIT | 119 stars, release 1.80.5.1 (2026-07-10), fixed a Godot 4.7 script error | Runtime plugin. README build targets are Windows, macOS, iOS, Android, Linux. Web is not mentioned | Low, but see gaps |
| Material Maker | https://github.com/RodZill4/material-maker | LICENSE.md read. MIT | 6,253 stars, release 1.8 (2026-10-25) | Procedural noise, rings and rune-like shapes to export as textures | Low |
| Pixel Composer | https://github.com/Ttanasart-pt/Pixel-Composer | LICENSE read. MIT | 1,442 stars, release 1.21.0 (2026-04-28) | Node-based VFX editor made for pixel art | Low |
| Pixelorama | https://github.com/Orama-Interactive/Pixelorama | LICENSE read. MIT | 11,074 stars, release v1.2.4 (2026-11-03) | Free pixel editor built on Godot, flipbook drawing | Low |
| Pixel FX Designer (CodeManu) | https://codemanu.itch.io/particle-fx-designer | Commercial. Page states no terms for exported output | $19.95 list, 127 ratings at 4.7, devlog v1.1.8.0 on 2024-04-26, Windows and macOS | Particle sim that exports pixelated PNG sheets and GIFs | Paid |
| Juice FX (CodeManu) | https://codemanu.itch.io/juicefx | Commercial | $19.95 list, 103 ratings at 4.7, last devlog v1.3.2.0 on 2022-09-16, Windows only | Squash, flash, shake and outline baked into sheets up to 512x512 | Paid |
| PixelOver | https://pixelover.io/ | Commercial | $19.99 one-time, Windows, macOS, Linux. Devlog 0.19 is the latest listed | 3D or HD to pixel art, palette indexing, dithering, colour cycling, 2D and 3D particles, sheet export | Paid |
| LibreSprite | https://github.com/LibreSprite/LibreSprite | LICENSE.txt read. GPL v2 | 8,781 stars, pushed 2026-10-30 | Free Aseprite fork. Has a RotSprite rotation | Copyleft as code, fine as a tool |
| Aseprite source | https://github.com/aseprite/aseprite | EULA.txt read. Proprietary EULA, source visible | 40,873 stars, pushed 2026-11-10 | `src/doc/algorithm/rotsprite.cpp` exists (directory listed). Read only | None (study only) |

### Table C. Free packs

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Kenney Particle Pack | https://kenney.nl/assets/particle-pack | Page read. "Creative Commons CC0" | 80 files, version 1.0, released 2018 | Base shapes for particles and flashes | Low |
| Foozle Pixel Magic Effects | https://foozlecc.itch.io/pixel-magic-sprite-effects | Page read. CC0 1.0, "Attribution not required" | 12 ratings at 4.9 | 10 spell effects with icons at 32x32, matches the tile size | Low |
| CodeManu Pixelart Effect Pack | https://codemanu.itch.io/pixelart-effect-pack | Page read. Text says "public domain asset", licence field says CC BY 4.0. They conflict | 69 ratings at 4.9 | 20 effects at 100x100 | Custom. Credit the author to be safe |
| Pimen spell effects | https://pimen.itch.io/ and https://pimen.itch.io/fire-spell | Page read. Personal and commercial use and edits allowed, "cannot resell or redistribute" | 15 element packs. Fire pack has 15 ratings at 4.9 | Per-element sets with useful frame counts. Firebolt is 4 loop + 6 impact frames, fire breath 3 start + 4 loop + 7 end | Custom |
| XYEzawr Free Pixel Effects | https://xyezawr.itch.io/ and https://xyezawr.itch.io/free-pixel-effects-pack-13-fireballs | Page read. Free and commercial use, edits allowed, credit optional, no redistribution or resale | 21 free packs. Fireballs pack has 13 ratings at 4.9 | 64x64 sprites authored for 30 and 60 fps | Custom |
| BDragon1727 effects | https://bdragon1727.itch.io/free-effect-bullet-impact-explosion-32x32 | Page read. Free for non-commercial games, commercial use "please contribute (any value)", no resale | 49 ratings at 4.9 | 45 impact and explosion animations at 32x32 in 5 colours | Custom, with a risk. A commenter says some are ripped from SNES games, unconfirmed |
| unTied Games (Will) | https://untiedgames.itch.io/five-free-pixel-explosions | Page read. "Attribution + no reselling the asset itself", commercial use OK | 24 ratings at 4.8 | Five explosions authored at 60 fps | Custom, attribution required |

### Table D. Open-source games worth reading

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| OTClient (edubart) | https://github.com/edubart/otclient | LICENSE read. MIT | 709 stars, last push 2024-09-14 | `src/client/effect.cpp`, `missile.cpp`, `animatedtext.cpp`, `animator.cpp` (listed) | Low |
| OTClient Redemption | https://github.com/opentibiabr/otclient (old name mehah/otclient redirects) | LICENSE read. MIT | 542 stars, release 4.2 on 2026-11-02 | Adds `attachedeffect.cpp`, `attachedeffectmanager.cpp`, `lightview.cpp` (listed). Best model for auras attached to creatures | Low |
| The Forgotten Server | https://github.com/otland/forgottenserver | LICENSE read. GPL v2 | 1,844 stars, pushed 2026-11-09, release v1.6 (2024-06-05) | Server side of effect and missile packets, area masks | Copyleft |
| Canary | https://github.com/opentibiabr/canary | LICENSE read. GPL v2 | 668 stars, release v3.6.1 (2026-07-01) | Same, for current protocol 15.25 | Copyleft |
| Mindustry | https://github.com/Anuken/Mindustry | LICENSE read. GPL v3 | 29,772 stars, release v160.7 (2026-10-08), shipped on Steam and mobile | `content/Fx.java`, `entities/Effect.java`, `entities/Lightning.java`, `graphics/Trail.java`, `entities/effect/` with `WaveEffect`, `ExplosionEffect`, `ParticleEffect`, `MultiEffect` (listed) | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | LICENSE.txt read. GPL v3 | 6,786 stars, release v4.0.2 (2026-10-07), shipped | `effects/` has `Lightning`, `MagicMissile`, `Beam`, `Chains`, `ShieldHalo`, `Speck`, `Splash`, `Flare`, `Fireball`, `Enchanting`, `CircleArc`, plus `particles/` (listed) | Copyleft |
| ClassicUO | https://github.com/ClassicUO/ClassicUO | LICENSE.md read. BSD 2-Clause | 742 stars, pushed 2026-10-16 | `GameObjects/` has `MovingEffect.cs`, `FixedEffect.cs`, `LightningEffect.cs`, `DragEffect.cs` (listed). Permissive MMO client | Low |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | LICENSE read. GPL v3 | 450 stars, pushed 2026-11-12 | `src/Renderer/Effects/` has `CastCircle`, `CastCone`, `CastRing`, `MagicRing`, `MagicTarget`, `GroundAura`, `BoltRain`, `IceSpikes`, `BezierArcThrow`, `LockOnTarget` (listed). JS, so closest to the sandbox | Copyleft |
| Veloren | https://github.com/veloren/veloren (mirror of GitLab) | LICENSE read. GPL v3 | 7,693 stars, pushed 2026-11-10 | `voxygen/src/scene/particle.rs` (listed) | Copyleft |
| Flare engine | https://github.com/flareteam/flare-engine | COPYING read. GPL v3 | 1,309 stars, pushed 2026-11-11 | Data-driven powers as text files | Copyleft |
| Flare game | https://github.com/flareteam/flare-game | LICENSE.txt read. CC BY-SA 3.0 | 1,344 stars, release v1.15 (2026-05-08) | `mods/fantasycore/animations/powers/` has 41 definitions such as `fireball.txt`, `lightning.txt`, `runes.txt`, `shield.txt`, `channel.txt`, `status_freeze.txt` (listed) | Copyleft |
| pokeemerald | https://github.com/pret/pokeemerald | No licence file in the repo root (root listed). Nintendo IP | 3,684 stars, pushed 2026-10-01 | 26 `src/battle_anim_*.c` files by element, including `battle_anim_status_effects.c` | None (study only) |
| Luanti | https://github.com/luanti-org/luanti | LICENSE.txt read. Opens with CC BY-SA 3.0 for textures and sounds. Engine code terms sit further down the file, I did not read that far | 13,849 stars, release 5.18.0 (2026-10-29) | `src/client/particles.cpp`, `src/particles.cpp`, `src/script/lua_api/l_particles.cpp` (found by code search). Server-defined particle spawners | Copyleft, treat as LGPL-or-stricter until read |
| Brogue CE | https://github.com/tmewett/BrogueCE | LICENSE.txt read. AGPL v3 | 1,527 stars, pushed 2026-11-06 | `src/brogue/Light.c`, colour flashes and bolts on a grid | Copyleft |
| Cataclysm DDA | https://github.com/CleverRaven/Cataclysm-DDA | LICENSE.txt read. CC BY-SA 3.0 | 13,527 stars, pushed 2026-11-11 | Field effects on tiles. Low value for VFX | Copyleft |
| DevilutionX | https://github.com/diasurgical/DevilutionX | LICENSE.md read. "Sustainable Use License" v1.0, limits use to internal business or non-commercial purposes | 10,009 stars, release 1.5.5 (2025-10-30) | Missile tables and 16-direction missile sprites. Read only | None-equivalent (source-available) |
| OpenDiablo2 | https://github.com/OpenDiablo2/OpenDiablo2 | LICENSE read. GPL v3 | 11,107 stars, archived, last push 2021-10-21 | Low value now | Copyleft |
| T-Engine4 mirror | https://github.com/pakoito/ToME---t-engine4 | GPL v3 per GitHub API field, licence file not opened | 13 stars, stale (2014) | Lua particle definitions. Old copy | Copyleft |

### Table E. JS and canvas libraries

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| canvascycle (Joe Huckaby) | https://github.com/jhuckaby/canvascycle | LICENSE.md read. MIT, copyright 2010-2024 | 428 stars, pushed 2024-02-04 | Palette cycling with blended shifts on canvas | Low |
| Javascript-Lightning-Effect | https://github.com/diwsi/Javascript-Lightning-Effect | LICENSE read. MIT | 57 stars, pushed 2020-08-06 | Small canvas lightning to compare with our generator | Low |
| tsParticles | https://github.com/tsparticles/tsparticles | LICENSE read. MIT | 9,084 stars, release v4.4.0 (2026-08-31) | Reference for emitter options. Too big for the sandbox | Low |
| Proton | https://github.com/drawcall/Proton | LICENSE read. MIT | 2,479 stars, pushed 2026-03-06 | Behaviour-based particle design | Low |
| PixiJS particle-emitter | https://github.com/pixijs-userland/particle-emitter | LICENSE read. MIT | 853 stars, pushed 2026-01-09 | Emitter config format as data | Low |
| Dust | https://github.com/kittykatattack/dust | LICENSE.txt read. MIT | 93 stars, last push 2017 | Tiny particle lib, readable in one sitting | Low |
| rotsprite-webgl | https://github.com/adnanlah/rotsprite-webgl | LICENSE read. MIT | 12 stars, pushed 2023-02-25, self-described as rough | RotSprite on canvas | Low |
| rotsprite-js | https://github.com/spuuntries/rotsprite-js | LICENSE read. Apache 2.0 | 0 stars, 2022 | Second RotSprite reference | Low |
| magical-circle-generator | https://github.com/inajob/magical-circle-generator | LICENSE read. MIT | 7 stars, last push 2019 | Magic circle as SVG from rules | Low |

### Table F. Accessibility and reference

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| EA IRIS | https://github.com/electronicarts/IRIS | LICENSE.txt read. BSD 3-Clause, copyright 2023 EA | 241 stars, release 1.1.0 (2024-04-21), last push 2025-01-14 | Flash and pattern analysis of captured video | Low |
| PEAT | https://trace.umd.edu/peat/ | Page read. Free, but the page bars use on commercial games | Version 1.6, file dated 2017-02-15, Windows only | Not usable for Asterion. Use IRIS | None for games |
| godot-colorblindness | https://github.com/paulloz/godot-colorblindness | LICENSE read. MIT | 129 stars, release v1.6 (2026-05-12) | Simulation overlay in a CanvasLayer. README says it breaks with "2D without Sampling" framebuffer | Low |
| DaltonLens-Python | https://github.com/DaltonLens/DaltonLens-Python | LICENSE read. MIT | 44 stars, last push 2021 | Reference simulation matrices | Low |
| jsColorblindSimulator | https://github.com/MaPePeR/jsColorblindSimulator | No licence file, none in README | 120 stars, pushed 2024-08-04 | Browser tool to test screenshots | None (use as a tool only) |
| Game Accessibility Guidelines, flicker page | https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/ | No licence statement on the page | Long-running reference site | Thresholds. More than 3 flashes in one second over 25% of the screen, sequences over 5 s, moving patterns over 25%, static over 40% | Reference |
| Riot VFX style guide thread | https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392 | Riot copyright, read only | Posted 2017-10-26 | Entry point to the guide. See gaps for the dead original | Reference |
| VFX Apprentice summary | https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips | Site copyright | Site advertises "10+ hours" of free courses | Ten rules. Peak in the first quarter of the lifespan, brightest value saved for the impact flash | Reference |
| saint11 tutorials | https://saint11.art/blog/pixel-art-tutorials/ | Page read. "free to access", copyright 2025 Pedro Medeiros, no reuse licence | About 80 entries (my count of thumbnails) | Fire, Explosion, SmokeSheet, Electric, DarkMagic, LightMagic, Impact, RocketTrail | Reference, do not redistribute |

### Cited findings worth repeating

- GDQuest repos split their licence. Shaders and scripts are MIT, textures are CC BY-NC-SA 4.0, so the art cannot ship in a commercial game (LICENSE in https://github.com/gdquest-demos/godot-shaders).
- The official Godot `2d/particles` demo sets `renderer/rendering_method="mobile"` in its `project.godot` (read from https://github.com/godotengine/godot-demo-projects). It was not authored for Compatibility.
- haowg's library sets `config/features` to "4.5", "Forward Plus" (read from its `project.godot`).
- PEAT's own page forbids assessing commercially produced games and points to Harding FPA (https://trace.umd.edu/peat/).
- DevilutionX now ships a "Sustainable Use License" that limits use to internal or non-commercial purposes (LICENSE.md, https://github.com/diasurgical/DevilutionX). Older write-ups call it Unlicense. Recheck before citing it as public domain.

### Inferences

- Compatibility support. `canvas_item` shaders that do not read the screen (outline, palette swap, dissolve, the lightning shader) should run on WebGL2. Shockwave and force-field shaders read the screen texture, which costs a full-screen copy per frame on web. I did not test any of them.
- The haowg and Godot demo particle scenes use GPUParticles2D in non-Compatibility projects. Expect to convert emitters to CPUParticles2D or flipbooks for web.
- Authoring at 60 fps (unTied, XYEzawr) means dropping frames for our 75 to 100 ms per frame flipbooks. The art will need a manual pick of keyframes.
- OTClient Redemption's attached effects are the closest permissive model for auras and status overlays on a Tibia-like. I listed the files but did not read them in this pass.

### Gaps

- Effekseer on web. The EffekseerForGodot4 README lists five native platforms and says nothing about Web, Compatibility or 2D. One open issue (#11) mentions Godot 4.7. It is a GDExtension, so a web build would need a wasm build of the extension. Treat web support as unproven.
- Luanti engine code licence. I read only the top of LICENSE.txt.
- I did not read any godotshaders.com shader beyond "2D lightning".

## Key question 2. Top 8 for Asterion

1. OTClient and OTClient Redemption (MIT). The effect, missile and attached-effect classes are the exact model for a Tibia-like, and MIT lets us port logic directly.
2. GDQuest godot-shaders (MIT shaders). Outline, palette swap and dissolve cover status tints, friend or foe colouring and despawn, all without a screen read.
3. cleanEdge (MIT, has a `.gdshader`). It settles the 8 or 16 direction sprite question with a third option, one missile sprite rotated cleanly.
4. Shattered Pixel Dungeon `effects/` (GPL v3, study). Around 35 small classes show how few pixels a readable lightning, beam, halo or speck needs.
5. Mindustry `Fx.java`, `Trail.java`, `Lightning.java` (GPL v3, study). Effects as short lambdas over a 0 to 1 lifetime. That is the cheapest data-driven effect format I know and it maps to canvas and to `_draw()`.
6. roBrowser Legacy `Renderer/Effects` (GPL v3, study). An MMO in JavaScript with cast circles, cones, rings and ground auras as separate files. Best source for cast telegraph structure.
7. EA IRIS (BSD 3-Clause). The only free flash analyser we may use on a commercial game, since PEAT forbids it.
8. Kenney Particle Pack plus Foozle Pixel Magic Effects (both CC0). Placeholder art with zero licence bookkeeping. Foozle's 32x32 frames match the tile grid.

Runner-up. Pixel Composer (MIT) if the team wants a free node editor for flipbooks before paying for Pixel FX Designer.

## Key question 3. Looked for and did not find

- A Godot 4 lightning addon for 2D. `gh search` for "godot lightning 2d" returned nothing. Only the Godot 3 era shader on godotshaders.com turned up.
- A mature 2D trail addon. `godot_trail_2d` has 1 star. GPUTrail and Godot-Trail-System target 3D.
- A Bitlytic pixel-art shader repo. `Bitlytic/Pixel-Art-Shaders` does not exist and I found no other.
- A `torcado194/cleanEdge` repo. The source lives in the gist only.
- A colour-blind correction (daltonize) shader for Godot. I found the simulator only.
- Riot's original guide. https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/ now redirects (301) to the League home page, and a forum reply says Riot took the PDF down. I did not open the PDF.
- OpenGameArt pages. https://opengameart.org/content/pixel-art-spells returned 403. Search results describe several CC0 spell sheets there (Pixel Art Spells by DevWizard, Gothicvania Magic Pack 9 by ansimuz) but I could not open them, so they are not in the table.
- ToME licence page. https://te4.org/faq returned 404. Only a stale 2014 mirror is listed.
- EffectTextureMaker terms. https://mebiusbox.github.io/contents/EffectTextureMaker/ loads (three.js r174) but shows no licence for the tool or its output. The site repo has no licence file though GitHub tags it MIT.
- Not checked for lack of budget. Hammerwatch mod base files, Blender to pixel flipbook pipelines, Aseprite VFX scripts, a Bayer dither snippet with a licence, Real-Time VFX resource lists beyond the one thread.

## Sources

- GitHub API and licence files for every repo in the tables, read 2026-11-11
- https://kenney.nl/assets/particle-pack
- https://godotshaders.com/license/ and https://godotshaders.com/shader/2d-lightning/
- https://torcado.com/cleanEdge/ and https://gist.github.com/torcado194/e2794f5a4b22049ac0a41f972d14c329
- https://raw.githubusercontent.com/effekseer/EffekseerForGodot4/main/README.md
- https://codemanu.itch.io/pixelart-effect-pack, https://codemanu.itch.io/particle-fx-designer, https://codemanu.itch.io/juicefx
- https://bdragon1727.itch.io/ and https://bdragon1727.itch.io/free-effect-bullet-impact-explosion-32x32
- https://pimen.itch.io/ and https://pimen.itch.io/fire-spell
- https://xyezawr.itch.io/ and https://xyezawr.itch.io/free-pixel-effects-pack-13-fireballs
- https://untiedgames.itch.io/ and https://untiedgames.itch.io/five-free-pixel-explosions
- https://foozlecc.itch.io/pixel-magic-sprite-effects
- https://pixelover.io/
- https://mebiusbox.github.io/contents/EffectTextureMaker/
- https://trace.umd.edu/peat/
- https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
- https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392
- https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- https://saint11.art/blog/pixel-art-tutorials/
