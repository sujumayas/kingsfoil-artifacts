# 09 Combat fire and lava (the thin areas)

Scope: burning status visuals on creatures, fireball and flamethrower anatomy, fire left on the ground, lava (look, crust, water reactions), embers and heat haze in Godot 2D on the web. Does not repeat DOOM fire, Tibia fire field numbers, CA spread, explosion basics or Stam fluids (see 01, 03, 06).

Session budget was about 25 tool calls. Several sources blocked me (Bulbapedia 403, poewiki Anubis wall, TibiaWiki fandom 402, OpenGameArt 403). Those gaps are listed per question.

## Q1. How do games show "this creature is burning"?

### Takeaway
Every game checked uses some mix of three cheap signals. A red tint on the sprite, a small flame overlay or particle emitter riding on the creature, and a damage tick that is frequent and small. Terraria ticks 1 HP every 0.25 s. That fast, small tick reads as "burning" better than a big hit every 2 s. Duration is the design knob, damage per second stays flat.

### Cited findings
- Terraria "On Fire!" (Buff ID 24) deals 4 HP per second, "shown as 1 damage every 0.25 seconds", and blocks health regeneration. Afflicted entities "emit fire particles and a small amount of light". https://terraria.wiki.gg/wiki/On_Fire!
- Terraria removes it by entering any liquid except lava (water, honey, shimmer). Obsidian Skin and full Molten armor negate it. Same URL.
- Terraria durations are short and vary by source. Wand of Sparking 1-4 s at 50% chance. Molotov 3-6 s at 100%. Flaming Arrow 3 s at 33.3%. Enemy fire scales by mode, for example Fire Imp 7 / 14 / 17.5 s (Normal / Expert / Master). Lava gives 7 / 14 / 17.5 s. Same URL.
- Terraria 1.4.4 moved most Hardmode fire to the stronger "Hellfire" debuff. That is a two-tier burn, a pattern Asterion could copy for low and high level fire. Same URL.
- Enter the Gungeon burn on enemies is mostly 4 DPS for 4 s. Outliers are 5, 6 and 10 DPS, and durations of 0.5, 1, 2.5, 10 and 60 s. "Burning enemies show flames on their sprite" and are "normally tinted red". A rare bug tints them blue. https://enterthegungeon.wiki.gg/wiki/Status_Effects
- Enter the Gungeon player burn uses a meter. It fills while on fire, drains on dodge roll, and deals one hit each time it fills. Same URL.
- Enter the Gungeon "Green Fire" is 4 DPS for 120 s, which the wiki calls "functionally infinite". A burning enemy ignites flammable goop beneath it. A burning player does not. https://enterthegungeon.wiki.gg/wiki/Status_Effects , https://enterthegungeon.wiki.gg/wiki/Goop
- Pokemon burn is 1/16 max HP per turn in Gen I and Gen VII onward, 1/8 in Gen II-VI, and halves physical damage. In Gen V burned Pokemon "glow red". https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition) (page 403 to my fetcher; figures from search snippets of that page)
- Minecraft sets an entity's fire timer to 300 ticks (15 s) in lava. After leaving, the entity burns "just under 15 seconds" and takes fire damage 14 times (about one hit per second). https://minecraft.wiki/w/Lava
- Dead Cells says burning enemies "have a visible flame effect emanating from them" (search snippet). https://deadcells.wiki.gg/wiki/Bleed

### Inferences
- Tint plus overlay is the floor. A red multiply tint costs nothing in a canvas_item shader (one uniform), and a 3-5 frame flame overlay sprite of 8x8 or 16x16 px placed at the creature's head covers the "on fire" read even at 320x180.
- For a server-authoritative MMO, send one "burning until tick N" flag per creature. The client then runs tint, overlay and particles locally. Damage numbers arrive as normal hits. Tibia already shows each burn tick as a hit with orange text (from 01, Q4), so Asterion can keep tick rate low (2 s server ticks) and still feel alive if the overlay animates at 8-12 fps.
- Terraria's 0.25 s ticks are too chatty for network floating numbers. Better to aggregate client side, for example float one number per second, or only flash the sprite white for 1 frame per server tick.
- Gungeon's dodge-roll meter is a nice idea for action RPG combat. Rolling or stepping into water is a player skill expression on top of DoT.

### Gaps
- No primary source for the exact Terraria On Fire dust code (dust type, spawn rate, scale). Decompiled source is not hosted on public web pages I could reach.
- Diablo II/IV, Hades, Hyper Light Drifter, Divinity burning visuals. Searches found nothing concrete beyond the general "flames on sprite". The 80.lv Hades VFX article excerpt had no fire details. https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades
- TibiaWiki burning page blocked (fandom 402). Tibia numbers are already in 01.

## Q2. What is the anatomy of a pixel fireball?

### Takeaway
Asset packs agree on a split into start (spawn), a looping travel head, and an end or impact set. Trails are either baked into the head frames (cheap, fixed direction count) or spawned as particles (rotates freely, costs per frame). For 8-direction or free-angle top-down projectiles, a small rotating head plus particle embers is the cheapest way to avoid drawing 8 or 16 directions.

### Cited findings
- One commercial pack lists fireball as travel (10 frames) plus impact plus shadow, 4 directions, 32x32 px. https://gamedevmarket.net/asset/super-pixel-projectiles-pack-2-pixel-art-animated-projectiles (search snippet)
- An OpenGameArt fireball has a start set of 8 frames, a travel loop and a dying set of 6 frames, plus a separate explosion. https://opengameart.org/content/animated-fireball (search snippet, page 403 to me)
- Another public-domain OpenGameArt sheet is used in 2 stages, first frame then an "active" loop of the rest. https://opengameart.org/content/fireball-projectile (search snippet, page 403 to me)
- A beginner guide states 8-12 fps is common for pixel art animation. https://neatforge.pages.dev/guides/beginners-guide-to-pixel-art-animation
- Terraria fire projectiles show the game's own fireball rules in numbers, see Q3 for the Flamethrower.

### Inferences
- Recommended head: 3-4 frame loop at 10-12 fps, 8x8 to 12x12 px at 320x180, palette white core, yellow, orange, red rim. Draw a shadow ellipse on the ground (2-3 px tall) under it so the 3/4 view reads height.
- Trail options ranked by cost. (a) Stretched sprite, scale X by speed, one draw call, looks smeared and can break pixel crispness if not snapped. (b) Afterimages, keep last 3-4 positions and draw the head smaller and darker at each, 3-4 draws, very crisp and very retro. (c) Particles, 20-40 embers/s with 0.3-0.6 s lifetime, about 6-24 live sprites per fireball, best for free angles.
- Impact: 1 white flash frame (from 06, Q3), then 5-7 frames of puff, then a scorch decal that fades over a few seconds.

### Gaps
- No artist-authored tutorial (Saint11, Slynyrd, MortMort) found in budget with fireball-specific frame counts.

## Q3. Flamethrowers, fire breath and fire left on the ground

### Takeaway
Flamethrowers in 2D are a stream of short-lived projectiles that grow and fade, not one long sprite. Terraria fires 5 bursts per use, each a spinning, expanding flame that pierces up to 3 targets. Ground fire is a separate "ground effect" entity with its own duration and DPS, distinct from the burning status, as in Path of Exile.

### Cited findings
- Terraria Flamethrower. Damage 35, useTime 6 and useAnimation 30, so "5 bursts per use". Velocity 21. 1 Gel per use. Pierces 3 enemies with 15% falloff each. Inflicts Hellfire for 20 s (since 1.4.4, was On Fire). https://terraria.wiki.gg/wiki/Flamethrower
- Its projectile "expands as it travels, forming a cone, then dissipates". Projectiles spin. Water, honey and shimmer stop the flames. 1.4.4 "Visuals and hitbox reworked". Same URL.
- Old-gen Terraria Flamethrower and Elf Melter applied On Fire for 20 s, much longer than any current player weapon. https://terraria.wiki.gg/wiki/On_Fire!
- Nuclear Throne flame pellets deal impact damage first and fire damage after, and pellets get a small impact bonus in their first couple of frames. https://nuclear-throne.fandom.com/wiki/File:Explosive.png (search snippet)
- Enter the Gungeon oil goop, once lit, "quickly spreads throughout the goop pool". Napalm ignites almost at once. Oil never ignites on its own. https://enterthegungeon.wiki.gg/wiki/Goop
- Path of Exile 1 burning ground is "not the same as applying the ignite status". Its DPS depends on source. Some sources set it to 20-26% of the strongest ignite DPS on the enemy, base duration 4 s. Only the highest-DPS effect of each type ticks. https://poewiki.net/wiki/Ground_fire , https://poewiki.net/wiki/Ground_Effect (search snippets, site behind an Anubis bot wall)
- Path of Exile 2 calls it "Ignited Ground". Base ignite magnitude is 20% of the hit's fire DPS. https://www.poe2wiki.net/wiki/Burning_ground (search snippet)

### Inferences
- Flamethrower recipe for Godot: spawn a projectile every 0.1 s (Terraria rate at 60 fps), lifetime 0.4-0.6 s, scale 0.5 to 2.0 over life, colour ramp white-yellow-orange-red-dark grey, random rotation. That is about 5 live sprites per flamer. Stop on water tiles.
- Ground fire as a tile entity fits Asterion's grid. It is the same object as a Tibia fire field with a shorter lifetime, so reuse the field system from 01 rather than making a new one.
- PoE's "only strongest ticks" rule is worth stealing for an MMO. It stops ten players stacking fire fields into instant death and keeps the server sum cheap.

### Gaps
- Enter the Gungeon flame weapons (Flame Hand, Hot Lead) per-projectile data and the burning goop lifetime were not on the wiki pages I read.
- Diablo burning ground (Fire Wall, Firestorm) numbers not checked.

## Q4. Lava: look, crust, and lava plus water

### Takeaway
Lava is slow fire in a liquid. Games give it light, opaque glow, slow flow, occasional pops and drips, and a fixed reaction with water that makes rock plus steam. A scrolling noise shader with a 3-colour gradient is the common Godot route. For pixel art you must quantise the result to the palette, or it looks like a smooth HD shader on top of crisp tiles.

### Cited findings
- Minecraft lava spreads one block per 30 ticks (1.5 s) over 3 blocks in the Overworld, and one per 10 ticks over 7 blocks in the Nether. It emits light level 15. It can ignite flammable blocks above or near it. https://minecraft.wiki/w/Lava
- Minecraft lava plus water makes stone, cobblestone or obsidian depending on how they meet, plays a fizz (Java volume 0.5, pitch 1.8-3.4) and spawns smoke particles. Lava pops randomly with bubble particles. Rain on lava makes black ember particles more often. Same URL.
- Minecraft lava deals 4 HP per tick on contact and sets the 15 s fire timer. Same URL.
- Terraria lava deals 80 damage to players (50 to NPCs) plus On Fire for 7 s (Normal). It "emits a medium, flickering light", is opaque and hides objects, and its colour does not change by biome. Lava plus water makes Obsidian. Lava plus honey makes Crispy Honey Block. Rain does not harden lava. Lava flows slower than water and evaporates after 50 tiles. https://terraria.wiki.gg/wiki/Lava
- Noita lava plus water (and Chilly or Fading Water) makes Mossy Rock and Steam. Lava plus blood makes Volcanic Rock and Steam. Lava ignites "burnable_fast" materials at rate 80 and "burnable" at rate 8. Contact damage ignores fire immunity. https://noita.wiki.gg/wiki/Lava
- Godot shader "Lava Shader" (port of nimitz's Shadertoy lava). canvas_item, 6-iteration gradient-warped noise flow, one uniform timeScaleFactor = 0.04, needs a seamless noise texture. No screen texture read. Licence defaults to CC BY-NC-SA 3.0 as a Shadertoy port, which blocks commercial use. https://godotshaders.com/shader/lava-shader/
- Godot shader "LAVA shader animated" by miwls. CC0. canvas_item, unshaded, Godot 4.x. Scrolling noise (scroll 0.30, 0.15), sine UV wobble, 3 colours (1, 0.133, 0), (1, 0.467, 0), (1, 0.933, 0), inner and outer glow. No screen texture read. Published 19 June 2026. https://godotshaders.com/shader/lava-shader-animated/
- Palette-cycled lava is in 08, Q6 (not repeated).

### Inferences
- Crust technique (no source found, my design). Use two noise reads. A slow, low-frequency noise picks "crust" where value > 0.55 and draws it in 2 dark palette entries. A faster scrolling noise fills the cracks with the 3-4 hot entries. Make the crust threshold breathe with sin(time * 0.3) so plates appear to drift and crack. Quantise with floor(v * N) / N and snap UV to the 320x180 pixel grid.
- Cheapest path still wins for Asterion. Palette cycling (08) on a hand-drawn 32x32 lava tile costs zero shader math and stays in palette. Use the noise shader only for hero lava pools.
- Lava plus water as a server rule: on contact, swap the lava tile to an obsidian or rock tile, spawn a 1-2 s steam puff client side, and play a hiss. It matches what players learned in Minecraft, Terraria and Noita.
- Rain on lava making black embers (Minecraft) is a cheap tie-in with the Rain study (#3).

### Gaps
- Tibia lava tile animation (frames, speed) and Zelda lava (ALttP, Minish Cap) not checked in budget.
- No Godot lava shader found that is pixel-art native (quantised, palette-locked) with a permissive licence.

## Q5. Embers, sparks and heat haze in Godot 2D on the web

### Takeaway
Ember numbers below are my recommendations, not cited. The cited part is heat haze. In Godot 4 Compatibility (the only web renderer), screen-reading shaders work but have open bugs that matter for pixel art. One web blur bug was fixed for 4.5. Several Compatibility issues are still open, including one where screen reads ignore "nearest" filtering. For pixel art haze, offsetting the sprite's own TEXTURE UVs, or the scanline trick from 08 Q5, is safer than SCREEN_TEXTURE.

### Cited findings
- 2D screen texture. The first node using hint_screen_texture triggers "a full-screen copy to a back-buffer". Later nodes reuse it. BackBufferCopy can limit the copy to a region. The docs give no cost figures. https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- godotengine/godot#91717 "Blur shader doesn't work in WebGL 2.0" (textureLod on screen texture). Browser errors about invalid mip level. Closed 12 March 2025, milestone 4.5. https://github.com/godotengine/godot/issues/91717
- Still open on GitHub when checked (10 Nov 2026). #106787 "Screen Reading Textures ignore 'nearest' filtering flag in compatibility render". #97943 "textureLod() bias does not work in web builds". #94863 colour mismatch in Compatibility screen reads. #79914 pink gridded lines with screen_texture in Compatibility. #119300 textureLod on screen texture in spatial shaders. https://github.com/godotengine/godot/issues/106787 , https://github.com/godotengine/godot/issues/97943 , https://github.com/godotengine/godot/issues/94863 , https://github.com/godotengine/godot/issues/79914 , https://github.com/godotengine/godot/issues/119300
- A Godot 4.3 user reports screen_texture output distorted in Compatibility but fine in Forward+, while sampling TEXTURE worked in both. No answer posted. https://forum.godotengine.org/t/screen-texture-behaves-strangely-with-gl-compatibility-renderer-but-works-fine-with-forward/93296

### Inferences
- Heat haze for pixel art. Put the fire and its surroundings in a SubViewport at 320x180, then offset UVs in a shader on the upscaled ViewportTexture by whole low-res pixels only (round to 1/320). Or apply the row-offset trick (08 Q5) to the area above a fire. Both avoid SCREEN_TEXTURE and keep pixels square. Because of #106787, a SCREEN_TEXTURE haze in Compatibility may come out linearly filtered and blur the pixel art. Test this in a real web export.
- Ember starting values for CPUParticles2D (my numbers, to test). Campfire 6-12 embers/s. Torch 2-4/s. Burning creature 8-15/s. Fireball trail 20-40/s. Lifetime 0.6-1.5 s. Initial velocity up 15-40 px/s with ±20 degrees spread. Gravity -10 to -20 px/s² (buoyant) for embers, +60 to +120 px/s² for sparks from impacts. Damping 5-15 px/s². 1x1 px particle, rarely 2x1.
- Ember colour by age, as a 4-step gradient with constant interpolation (no blending, stays in palette). 0-20% white or pale yellow, 20-50% yellow-orange, 50-85% red, 85-100% dark red then vanish. Optionally blink the last 15% on and off at 15 Hz instead of fading alpha, which keeps pixel art crisp.
- Use CPUParticles2D for web. The 02 note covers GPUParticles2D limits on Compatibility.

### Gaps
- No measured cost of SCREEN_TEXTURE on WebGL2 at 320x180 versus native resolution. Needs a test in the sandbox.
- No published ember parameter set from a shipped pixel game. Terraria's dust code would be the best source if the decompiled code can be read.

## Sources
- https://terraria.wiki.gg/wiki/On_Fire!
- https://terraria.wiki.gg/wiki/Flamethrower
- https://terraria.wiki.gg/wiki/Lava
- https://enterthegungeon.wiki.gg/wiki/Status_Effects
- https://enterthegungeon.wiki.gg/wiki/Goop
- https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition) (403, snippets only)
- https://deadcells.wiki.gg/wiki/Bleed (snippet)
- https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades
- https://minecraft.wiki/w/Lava
- https://noita.wiki.gg/wiki/Lava
- https://poewiki.net/wiki/Ground_fire , https://poewiki.net/wiki/Ground_Effect (bot wall, snippets only)
- https://www.poe2wiki.net/wiki/Burning_ground (snippet)
- https://nuclear-throne.fandom.com/wiki/File:Explosive.png (snippet)
- https://gamedevmarket.net/asset/super-pixel-projectiles-pack-2-pixel-art-animated-projectiles (snippet)
- https://opengameart.org/content/animated-fireball , https://opengameart.org/content/fireball-projectile (403, snippets only)
- https://neatforge.pages.dev/guides/beginners-guide-to-pixel-art-animation
- https://godotshaders.com/shader/lava-shader/
- https://godotshaders.com/shader/lava-shader-animated/
- https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- https://github.com/godotengine/godot/issues/91717
- https://github.com/godotengine/godot/issues/106787
- https://github.com/godotengine/godot/issues/97943
- https://github.com/godotengine/godot/issues/94863
- https://github.com/godotengine/godot/issues/79914
- https://github.com/godotengine/godot/issues/119300
- https://forum.godotengine.org/t/screen-texture-does-not-work-work-when-deploying-for-web/45261
- https://forum.godotengine.org/t/screen-texture-behaves-strangely-with-gl-compatibility-renderer-but-works-fine-with-forward/93296
