# 09 · Atmosphere details and a game catalogue (gap fill)

Researcher 09. Two parts. Part A covers atmosphere and gameplay fog that notes 01-07 skip: lights inside fog, glow sprites, dust motes, cave and swamp mist, and fog clouds that block vision as a game rule. Part B is a catalogue of 31 games with year, what is documented, and a "see it in action" URL.

Already covered elsewhere, so only linked here. The halo formula `mix(fog, light, light_map * density * k)` is in 02 Q8. God-ray post-process is in 02 Q7 and 05 Q2. Fog-of-war data models are in 03. Graveyard Keeper, Dead Cells, Hollow Knight, Children of Morta and Sea of Stars rows are in 02 Q10. Smoke advection and smoke blocking sight are in study #6 (Fire).

Years in the catalogue are release years from general knowledge, not from a cited page. Treat them as context.

---

# Part A. Atmosphere and gameplay fog

## A1. How should lights read inside fog? Glow sprites or Light2D?

### Takeaway
Use pre-drawn additive glow sprites for lamps inside fog, not PointLight2D. Godot's own docs say additive sprites are "much faster" because they skip the light pipeline. Size the halo by the fog density under the lamp. Keep real Light2D for the handful of lights that must cast shadows. In Compatibility, a sprite reportedly ignores lights past about 15, so many lamps in one fog bank need the sprite route anyway.

### Cited findings
- Godot 2D lights doc. Light2D blend modes are Add (default), Subtract ("not physically accurate"), and Mix (lerp, needs alpha). Larger lights cost more because "they affect more pixels on screen". PCF13 shadow filtering "should only be used for a few lights at once". https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- Same doc. A fake light is a Sprite2D with a CanvasItemMaterial set to Blend Mode Add. Limits: no shadows, ignores normal maps, and cannot light areas that are fully dark. https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- Godot forum. An additive sprite tinted the scene but did not brighten it, and did not work with CanvasModulate. https://forum.godotengine.org/t/creating-fake-light-that-works-with-canvas-modulate-optimizing-lighting-in-2d/142438
- Godot 2D light cap. Forum users report a cap of 15 (or 16) lights per object, after which extra lights are ignored. A proposals discussion says the 2D limit is hardcoded. Community reports, version not pinned. https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311 , https://github.com/godotengine/godot-proposals/discussions/9336
- Compatibility 3D cap for comparison. 8 omni plus 8 spot lights per mesh, tunable under Rendering > Limits > OpenGL. Not confirmed to apply to 2D. https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html
- Prime31 SpriteLightKit. A sprite light costs far less than a real light, and their count matters little. https://prime31.github.io/SpriteLightKit
- One itch.io developer reported negligible cost after replacing GLES3 lights with glow sprites on low-end mobile. Anecdotal. https://itch.io/post/2069770
- Counter-report. A Construct 3 developer saw a large FPS drop on mobile from additive glow sprites. Anecdotal, likely overdraw from big sprites. https://www.construct.net/en/forum/construct-3/how-do-i-8/graphic-effect-mobile-game-157585
- Additive and normal blends with premultiplied alpha can batch into one draw call (Spine forum). https://fr.esotericsoftware.com/forum/d/14954-is-blending-good-for-game-optimization
- Pixel-art halo practice. An RPG Maker lighting tutorial adds a small halo around each light, then a larger, softer one. https://eeveeexpo.com/resources/710
- Dithered light falloff. A Godot shader bands the falloff with an ordered Bayer pattern, then adds a coloured glow. It also handles fog of war. https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/

### Inferences
- Halo sizing rule [estimate]. Light scatters more in thicker fog, so the glow should get wider and dimmer as density rises. A cheap mapping is `halo_radius = r0 * (1 + 2 * density)` and `halo_alpha = a0 * density`, where density is the fog value sampled at the lamp's tile. In clear air the halo shrinks to the bulb and the ground pool from study #5 takes over. In heavy fog the pool fades and the halo carries the light.
- Two-ring halo for pixel art. Draw one 3-5 px tight core ring and one 12-20 px soft ring in 2-3 palette steps, with Bayer dither between steps. That matches the "small then larger softer halo" practice above and the dithered lamp pools in study #1 (Snow).
- Cost model [estimate]. A 32x32 additive sprite at 320x180 touches 1,024 pixels, about 1.8% of the screen. Twenty lamps in fog is about 36% of one full-screen pass. That is cheaper than one full-screen noise pass with 2-3 fetches per pixel. The Construct report shows the risk is large sprites, so keep halo textures small and scale them.
- Order matters. Draw the halo after the fog layer. If the fog draws over the halo, the lamp looks smothered instead of glowing.

### Gaps
- No official Godot number for the 2D light cap in Compatibility. Test it in the sandbox.
- No measured ms for additive sprites vs PointLight2D in Godot web export.

---

## A2. Light shafts and dust motes

### Takeaway
Pre-drawn shaft sprites (a tapered quad with a soft gradient, additive) plus a few slow dust motes inside them give most of the look. A panning dust texture on the shaft is cheaper than particles. No source gives hard mote counts. My estimate is 8-20 motes per shaft at 320x180, drifting at 2-6 px/s.

### Cited findings
- Unreal forum. A panning dust texture on the god-ray mesh adds shader cost but is cheaper than particles. Fading the shaft's edge opacity sells the effect. The idea carries over to a 2D shaft sprite. https://forums.unrealengine.com/t/stylized-fake-animated-light-shafts-with-fireflies/1941111
- Unreal forum thread on particles seen only inside sun shafts. https://forums.unrealengine.com/t/is-there-any-way-to-make-particles-seen-only-in-sun-light-shafts/303681
- Godot particle docs describe GPUParticles2D and CPUParticles2D, and an emission mask whose texture colour particles can inherit. That means motes can pick up the shaft colour. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- Tunic. Wireframe notes flecks of light shimmering along the ground as part of the lighting mood. No technical detail. https://wireframe.raspberrypi.com/articles/wireframe-cover-star-tunic-and-the-art-of-keeping-a-secret
- Tunic's lighting (Unity GDC write-up). Andrew Shouldice relied on precomputed GI more than point lights, because deferred rendering does not work with orthographic cameras. He built shaders in Shader Forge and used batching to cut draw calls. The article title is "Smoke, mirrors and scrolling textures". https://blog.unity.com/games/smoke-mirrors-and-scrolling-textures-behind-the-scenes-of-tunic (now 404s, title and summary from search index)

### Inferences
- Motes in Godot Compatibility. Use CPUParticles2D. GPUParticles2D in Compatibility runs through transform feedback, and for under 50 particles the CPU path is simpler [inference]. 20 motes × 4 vertices is trivial.
- Motes only inside the shaft. Either spawn them in the shaft polygon and fade by lifetime, or draw them everywhere and multiply by the shaft mask. The first is cheaper.
- Speed [estimate]. Dust should move slower than the fog drift, which notes 06 Q3 puts at a few px/s. Make motes 1 px, 2 palette colours, with a slow sine wobble of ±1 px over 2-4 s. Faster motes read as snow or sparks.
- Sync with time of day. Window shafts make sense only when the sun is up. Fade shaft alpha with the day/night ramp from study #5.

### Gaps
- No shipped 2D game gives a mote count or speed. These numbers are mine.

---

## A3. Cave mist, swamp haze and indoor steam

### Takeaway
None of these has a documented technique in a shipped 2D game that I could find. The patterns that do exist are full-screen tints or overlays with a vision radius (Don't Starve Hamlet), a lighting meter that drives darkness as a rule (Darkest Dungeon), and opacity sliders that modders add (Stardew Cave Weather, see 06). Build them as presets of the same fog system with different colour, height, speed and spawn rules.

### Cited findings
- Don't Starve: Hamlet Heavy Fog. A 1-3 minute outdoor event in Humid Season, followed by 1-3 minutes of heavy rain. Fog covers the whole screen and leaves "a small radius around the player". Wetness rises at 40% less than in rain. Worn items slow movement by 40-60% during the fog. https://dontstarve.wiki.gg/wiki/Heavy_Fog
- Don't Starve colour cubes are applied as post-processing in the colourcube component, added in forest.lua (modder answer). https://forums.kleientertainment.com/forums/topic/137865-adding-overlay/
- Darkest Dungeon torch. Light runs from 0 to 100 and is split into tiers (one guide: Radiant above 76, Dim 51-75, Shadowy 26-50). Forum posts put the breaks at 0, 25, 50 and 75. https://www.gamepressure.com/darkestdungeon/light-level-and-its-influence/z28424 , https://steamcommunity.com/app/262060/discussions/0/594020645016182064
- Darkest Dungeon surprise table. At 75+ light, about 0% chance to be surprised and 25% to surprise. At 0-25 light, 25% to be surprised and 5% to surprise. The cap is 65% both ways. https://darkestdungeon.wiki.gg/wiki/Surprise
- Quest Girl (Godot). The developer found WorldEnvironment fog lacking and judged a custom fog shader too costly. They used a depth-based shader filter in front of the camera, "simple, effective, and convenient". https://liangzi82.itch.io/quest-girl/devlog/722727/-the-fog-atmosphere-effect-in-quest-girl
- Haze colour by biome (grey-green over swamps) is in 06 Q1. Swamp haze as a weather row is in 04 Q6.

### Inferences (presets for one fog system)
| Preset | Colour (palette idea) | Height / where | Motion | Extras |
|---|---|---|---|---|
| Cave mist | desaturated blue-grey, 2 steps darker than floor | pools in low tiles via the 04 Q7 height threshold | very slow, 1-2 px/s, little wind | lamps get bigger halos (A1). Dripping-water tiles spawn short-lived puffs |
| Dungeon haze | warm grey near torches, cold grey away | full-screen thin layer, alpha ≤ 25% | static or slow breathing (alpha ±5% over 6-10 s) | ties to a light meter like Darkest Dungeon if it is a rule |
| Swamp haze | grey-green or yellow-green | low-lying, 1-2 tiles tall in 3/4 view, thickest on water tiles | slow drift plus rising bubbles | bubble sprites: 2-4 frame pop, 1 per few water tiles per few seconds. Thicker at night (04 Q6) |
| Indoor steam | near-white, warm tint | local plumes over baths, kitchens, forges | rises 8-15 px/s, fades in 1-2 s | reuse the steam particles from study #6 |
| Magic mist | off-palette hue (purple, teal) | event-driven, bounded area | swirl or pulse | Albion's Mists use purple landscapes as identity (catalogue B) |

- Swamp bubbles and steam are particles, not fog. Keep them as sprites so the fog layer stays one cheap pass.
- A full-screen "small radius around the player" fog, as in Hamlet, is the cheapest event fog. It is one vignette texture centred on the player, which costs one fetch per pixel. For an MMO, it hides other players fairly because everyone gets the same radius.

### Gaps
- No devlog for a 2D game's swamp or cave mist technique. Hollow Knight and Blasphemous have fog sprites per 02, but no breakdown exists.

---

## A4. Fog clouds and smoke bombs as gameplay rules

### Takeaway
Games that let players make fog all use a short-lived, bounded area with a binary rule inside it. Durations run 4 s to 45 s in real time, or 1-10 turns in turn-based games. Radii are small (200 LoL units, 4.5-5 m in BG3). The rule is one of a few kinds: "you are hidden", "you see less", "you cannot attack", or "no ranged attacks through". The visual is a dense opaque cloud with a clear edge, because players must read where the rule ends. For a tile MMO, the rule maps to a set of tiles with an expiry tick, which the server already tracks.

### Cited findings (rules and numbers)
| Game | Effect | Duration | Size | Rule | Source |
|---|---|---|---|---|---|
| Dota 2, Smoke of Deceit | team invisibility, +15% move speed | 45 s | 1200 cast radius. Breaks within 1025 of an enemy hero or tower | cannot be seen by Sentry Wards or Gem of True Sight | https://dotacoach.gg/en/items/smoke-of-deceit , https://www.dota2protips.com/items/smoke_of_deceit |
| League of Legends, Graves Smoke Screen | nearsight on enemies inside, reapplied every 0.25 s | 4 s | 200 radius, cast range 950 | sight reduced (wiki lists 250). Leaving removes it at once | https://wiki.leagueoflegends.com/en-us/Graves , https://www.riftpatchnotes.com/lol/champion/graves |
| Baldur's Gate 3, Fog Cloud | Heavily Obscured and Blinded inside | 10 turns, concentration | 4.5 m radius at level 1, range 18 m. Upcast radius sources disagree | creatures inside are blinded. Those outside cannot see in | https://bg3.wiki/wiki/Fog_Cloud |
| Baldur's Gate 3, Darkness | Heavily Obscured and Blinded | 10 turns, concentration | 5 m radius, no upcast gain | "cannot make ranged attacks into or out of" it. Blinded reach drops to 3 m. Devil's Sight sees through | https://bg3.wiki/wiki/Darkness |
| Divinity: Original Sin 2, smoke clouds | blocks visibility | Smoke Cover lasts 1 turn. Blessed smoke reportedly 2 turns | surface-sized | forms from fire, or water/blood turned to steam. Outside units cannot see past it. AoE still hits through (forum) | https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 , https://divinityoriginalsin2.wiki.fextralife.com/Smoke+Cover |
| Path of Exile, Smoke Mine | smoke cloud that blinds | Blind base 4 s. Mine lasts 8 s | poedb lists AoE radius 10 (unclear which part) | Blind: 20% less accuracy and evasion | https://www.poewiki.net/wiki/Smoke_Mine , https://poedb.tw/us/Smoke_Mine , https://pathofexile.fandom.com/wiki/Blind |
| Into the Breach, smoke tile | units in smoke cannot attack or repair | until cleared | 1 tile | a Vek ending in smoke loses its queued attack. Electric Smoke also deals 1 damage to non-mechs | https://www.ludo.guide/guide/into-the-breach/game-mechanics , https://www.gamepressure.com/into-the-breach/combat/z1aa78 |
| Don't Starve: Hamlet, Heavy Fog | world event | 1-3 min | whole screen, small clear radius around player | movement penalty with gear | https://dontstarve.wiki.gg/wiki/Heavy_Fog |

- Tibia fields are damage tiles, not vision blockers. Energy Field reportedly lasts 1 min 40 s (30 damage on entry, 25 on leaving). Fire Field does 20, then about 10 per tick for about 7 ticks. Poison Field in a 7.4-era server lasts 248 s. Fields do no damage on non-PvP servers and can be removed with Destroy Field. Community Q&A, older versions. https://www.tibiaqa.com/13634/what-type-of-elemental-fields-is-there-and-what-damage-do-they-produce , https://tibiantis-notes.github.io/poison
- I found no reliable source on whether Tibia fields block movement or sight.

### Inferences
- Visual language. All the clouds above read as one dense blob with a clear rim, not wispy fog. Wispy edges blur where the rule stops, and players notice. For Asterion, draw the cloud as a dithered fill over exactly the affected tiles, with a 1-2 px brighter rim and a slow churn texture inside. A marching-squares edge (03 Q3) on the tile set gives a rounded outline at almost no cost.
- Server model for a tile MMO [design]. A smoke cloud is `{tiles: set, expires_at_tick, owner, rule}`. The server already filters what each client sees (03 Q9), so "hidden inside smoke" means "do not send creature updates for creatures on smoke tiles to clients outside". That is safe from maphacks, unlike a client-side overlay. Network cost is one event at cast and one at expiry. Clients animate the churn locally.
- Durations for a real-time MMO. 4 s (LoL) is a dodge tool. 45 s (Dota) is a strategic tool. A 10-20 s cloud with a 3x3 to 5x5 tile footprint sits between them [estimate]. That is about one Tibia field's footprint.
- Reuse study #6 smoke-blocks-sight. The FOV pass from #5 can treat smoke tiles as opaque for anyone outside and as "radius 1" for anyone inside (BG3's 3 m blinded reach is the same idea).
- Hades. I found no source on fog as a rule in Hades. It is listed in the brief but stays a gap.

---

# Part B. Catalogue of games and their fog

Legend for "Source": strong = developer or engine-maker write-up, medium = interview or official press, weak = wiki or forum, none = only the visual.

| # | Game (year) | View | What their fog, mist, clouds or fog of war look like and how they are built | Source | See it in action |
|---|---|---|---|---|---|
| 1 | Hyper Light Drifter (2016) | top-down pixel | Per-area palettes to mark landmarks. Heavy dark colours for an unreal mood. Preston prioritises colour and silhouette for readability at low resolution. No fog breakdown found | medium | https://www.gamedeveloper.com/business/the-ultra-modern-stylings-of-hyper-light-drifter , https://automaton-media.com/articles/interviewsjp/20170525-47328/ |
| 2 | Children of Morta (2019) | top-down pixel | Lighting at higher resolution than the sprites, sprites scaled to full HD (see 02) | medium | https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta |
| 3 | Eastward (2021) | top-down pixel | Custom engine, shader textures and lighting for weather and time (see 02) | weak | https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures |
| 4 | Sea of Stars (2023) | 3/4 pixel | Custom render pipeline for full dynamic 2D lighting. Players switch day and night at will with the Solstice powers | medium | https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle , https://sabotagestudio.com/presskits/sea-of-stars |
| 5 | Chained Echoes (2022) | 3/4 pixel | No technical source found | none | https://www.youtube.com/results?search_query=chained+echoes+fog |
| 6 | CrossCode (2018) | 3/4 pixel | No weather or fog source found (search turned up nothing) | none | https://www.youtube.com/results?search_query=crosscode+autumns+fall+weather |
| 7 | Death's Door (2021) | 3D, isometric camera | Naturally lit areas set against a subtle toon shader on characters (Frits Olsen art direction). Tilt-shift feel per a fan wiki | medium | https://byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game , https://blog.unity.com/games/crafting-intricate-environments-deaths-door |
| 8 | Tunic (2022) | 3D, orthographic | Precomputed GI over point lights, because deferred rendering does not work with ortho cameras. Shader Forge shaders. "Scrolling textures" in the talk title | medium | https://blog.unity.com/games/smoke-mirrors-and-scrolling-textures-behind-the-scenes-of-tunic |
| 9 | Dead Cells (2018) | side pixel | Normal-mapped 3D lighting. Nothing on fog (02) | medium | https://80.lv/articles/interview-with-the-developers-of-dead-cells |
| 10 | Blasphemous (2019) | side pixel | Nothing technical on fog found (02) | none | https://www.youtube.com/results?search_query=blasphemous+fog+area |
| 11 | Hollow Knight (2017) | side, 2D in 3D | Layers in 3D space, soft transparent light shapes, dedicated fog and haze objects (02) | weak to medium | https://unity.com/madewith/hollow-knight |
| 12 | Ori and the Blind Forest (2015), contrast case | side, painterly | Light fog behind the central gameplay layer, added mainly for readability. Ground tiles brightened on top. A developer mentions a custom fog blended over depth plus non-linear depth of field | medium (Edge) / weak (forum) | https://www.pressreader.com/australia/edge/20161013/283407716237477 , https://polycount.com/discussion/comment/2267931 |
| 13 | Stardew Valley (2016) | top-down pixel | No vanilla fog overlay. Mods add mine fog with 0-255 opacity (06) | weak | https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events |
| 14 | Graveyard Keeper (2018) | 3/4 pixel | Fog from many horizontal cloud sprites, 10 time-of-day LUTs, up to 4 shadows per object (02) | strong | https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made |
| 15 | Octopath Traveler (2018) | HD-2D | Pixel sprites in 3D UE4 scenes. Tilt-shift, depth of field, bloom, volumetric light and fog, particles. Asano pushed light and shadow on pixel surfaces | medium (secondary summary) | https://en.wikipedia.org/wiki/HD-2D , https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style |
| 16 | Triangle Strategy (2022) | HD-2D tactics | Same HD-2D post stack as Octopath. No fog-specific source | weak | https://en.wikipedia.org/wiki/HD-2D |
| 17 | Darkest Dungeon (2016) | side, hand-drawn | Darkness as a rule. Torch 0-100 changes surprise odds (0-25% to be surprised), stress and loot. Visual darkening follows the meter | weak (wikis) | https://darkestdungeon.wiki.gg/wiki/Surprise , https://www.gamepressure.com/darkestdungeon/light-level-and-its-influence/z28424 |
| 18 | Don't Starve: Hamlet (2018) | 3/4 hand-drawn | Heavy Fog event, 1-3 min, full-screen fog with a small clear radius. Seasons tinted by colour-cube post-process | weak | https://dontstarve.wiki.gg/wiki/Heavy_Fog |
| 19 | RimWorld (2018) | top-down | Fog grid of unrevealed cells, unfogged through `FogGrid.UnfogWorker`. Mods hook it alongside the roof grid. Vanilla shows no explored-but-not-visible state [inference from play, not cited] | weak | https://steamcommunity.com/workshop/filedetails/discussion/1235181370/570371033831388288 |
| 20 | Factorio (2020) | top-down | Chunk charting by radar (see 03) | strong (03) | see 03-fog-of-war.md |
| 21 | Northgard (2018) | RTS, zones | Map split into tiles (zones) revealed by exploring with scouts. No detail on visibility states | weak | https://www.gamepressure.com/northgard-game-guide/starting-tips/z6aaca |
| 22 | Into the Breach (2018) | isometric tactics | Smoke tiles from damaged sand. Units in smoke cannot attack or repair | weak | https://www.ludo.guide/guide/into-the-breach/game-mechanics |
| 23 | Wargroove (2019) | top-down tactics | Fog of war. Forest and reef hide units unless an enemy stands adjacent. Walls, mountains, forests and reefs block ground sight. Air sees over but not into. Dogs ignore terrain. Vision 2-3 tiles. Structures stay visible | weak (fan wiki, detailed) | https://wargroovewiki.com/Fog_of_War , https://wargroovewiki.com/Rules_(Codex) |
| 24 | Fire Emblem fog maps (from The Binding Blade, 2002) | top-down tactics | Thieves get about double vision. Torch item adds 4 tiles (GBA to Path of Radiance) or 5 (Radiant Dawn, Shadow Dragon). Torch staff lights a remote spot. Engage torch lights a 7-tile radius | weak | https://fireemblemwiki.org/wiki/Vision , https://www.fireemblemwiki.org/wiki/Torch_(item) |
| 25 | Diablo II (2000) | isometric | Light radius around every character and some monsters. Negative light radius allowed stealthier approach in Diablo I. Automap fills in with icons per tile as you walk | weak | https://di.diablowiki.net/Light_radius |
| 26 | Path of Exile (2013) | isometric | Smoke clouds blind (4 s base). In PoE2, light radius also sets how much minimap fog clears | weak | https://www.poewiki.net/wiki/Smoke_Mine , https://poe2wiki.net/wiki/Light_radius |
| 27 | Albion Online (2017) | isometric MMO | The Mists (Beyond the Veil, Nov 2022). A solo/duo zone reached by following Will o' Wisps, with purple landscapes. Zones close after a lifetime and wisps guide players out | medium (press) | https://mmos.com/news/albion-online-the-mists-dev-update , https://www.albiondatabase.com/guides/mists |
| 28 | Dota 2 (2013) | top-down MOBA | Smoke of Deceit: 45 s team invisibility, breaks within 1025 of enemy heroes | weak | https://dotacoach.gg/en/items/smoke-of-deceit |
| 29 | League of Legends (2009) | top-down MOBA | Graves Smoke Screen: 4 s cloud, 200 radius, nearsight | weak | https://wiki.leagueoflegends.com/en-us/Graves |
| 30 | Divinity: Original Sin 2 (2017) | isometric | Smoke clouds from fire or steam block sight. Clouds combine with other surfaces | weak | https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 |
| 31 | Baldur's Gate 3 (2023) | isometric | Fog Cloud (4.5 m, 10 turns) and Darkness (5 m, no ranged in or out) | weak (detailed wiki) | https://bg3.wiki/wiki/Fog_Cloud , https://bg3.wiki/wiki/Darkness |
| 32 | Quest Girl (indie, Godot) | 3/4 | Depth-based fog filter in front of the camera, chosen over WorldEnvironment fog and over a costlier custom shader | medium (dev) | https://liangzi82.itch.io/quest-girl/devlog/722727/-the-fog-atmosphere-effect-in-quest-girl |

SNES/GBA classics (Secret of Mana, FF6, Chrono Trigger, Minish Cap, ALttP Lost Woods), Tibia, Ultima Online and OSRS are covered in 01 Q3, Q4, Q7 and Q8. I did not repeat them.

### Inferences from the catalogue
- Strong technical sources are rare. Only Graveyard Keeper and Factorio (from earlier notes) have a developer write-up that explains fog in detail. Most rows are visual only.
- Two families. Mood fog (Ori, Graveyard Keeper, HD-2D, Hollow Knight) is layered sprites or post-process, tuned for readability. Rule fog (Wargroove, Fire Emblem, Darkest Dungeon, Into the Breach, BG3, Dota) is a binary per-tile or per-area state with simple numbers. Asterion needs both, and they should be separate systems that share a palette.
- Ori's detail is the best artist lesson here. Fog goes behind the gameplay layer to separate it, not over it. In top-down 3/4 view, fog under or behind characters (ground fog drawn before sprites) keeps them readable. That matches 06 Q4.
- Wargroove's "hidden in forest unless adjacent" rule fits a Tibia-like tile game well. It costs one adjacency check per creature on a cover tile, which the server can run in its visibility filter.
- Fire Emblem's torch (+4 or +5 tiles, decays by turn) is a ready-made item design for dark or foggy maps in the RPG.

### Gaps
- No technical fog source for Hyper Light Drifter, Eastward, Sea of Stars, Chained Echoes, CrossCode, Blasphemous, Death's Door, Hades, Northgard or Triangle Strategy.
- The Unity blog pages on Tunic and Death's Door now 404 (the redirect target is missing). Content is from the search index only.
- Fan wikis were used for game rules (Wargroove, Fire Emblem, BG3, Dota, LoL, PoE). The numbers change with patches.

---

## Sources
- https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html
- https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- https://forum.godotengine.org/t/creating-fake-light-that-works-with-canvas-modulate-optimizing-lighting-in-2d/142438
- https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311
- https://github.com/godotengine/godot-proposals/discussions/9336
- https://prime31.github.io/SpriteLightKit
- https://itch.io/post/2069770
- https://www.construct.net/en/forum/construct-3/how-do-i-8/graphic-effect-mobile-game-157585
- https://fr.esotericsoftware.com/forum/d/14954-is-blending-good-for-game-optimization
- https://eeveeexpo.com/resources/710
- https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
- https://forums.unrealengine.com/t/stylized-fake-animated-light-shafts-with-fireflies/1941111
- https://forums.unrealengine.com/t/is-there-any-way-to-make-particles-seen-only-in-sun-light-shafts/303681
- https://wireframe.raspberrypi.com/articles/wireframe-cover-star-tunic-and-the-art-of-keeping-a-secret
- https://blog.unity.com/games/smoke-mirrors-and-scrolling-textures-behind-the-scenes-of-tunic
- https://blog.unity.com/games/crafting-intricate-environments-deaths-door
- https://byteside.com/2021/08/deaths-door-developer-acid-nerve-on-how-it-made-its-sword-wielding-crow-game
- https://dontstarve.wiki.gg/wiki/Heavy_Fog
- https://forums.kleientertainment.com/forums/topic/137865-adding-overlay/
- https://www.gamepressure.com/darkestdungeon/light-level-and-its-influence/z28424
- https://steamcommunity.com/app/262060/discussions/0/594020645016182064
- https://darkestdungeon.wiki.gg/wiki/Surprise
- https://liangzi82.itch.io/quest-girl/devlog/722727/-the-fog-atmosphere-effect-in-quest-girl
- https://dotacoach.gg/en/items/smoke-of-deceit
- https://www.dota2protips.com/items/smoke_of_deceit
- https://wiki.leagueoflegends.com/en-us/Graves
- https://www.riftpatchnotes.com/lol/champion/graves
- https://bg3.wiki/wiki/Fog_Cloud
- https://bg3.wiki/wiki/Darkness
- https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275
- https://divinityoriginalsin2.wiki.fextralife.com/Smoke+Cover
- https://www.poewiki.net/wiki/Smoke_Mine
- https://poedb.tw/us/Smoke_Mine
- https://pathofexile.fandom.com/wiki/Blind
- https://poe2wiki.net/wiki/Light_radius
- https://www.ludo.guide/guide/into-the-breach/game-mechanics
- https://www.gamepressure.com/into-the-breach/combat/z1aa78
- https://www.tibiaqa.com/13634/what-type-of-elemental-fields-is-there-and-what-damage-do-they-produce
- https://tibiantis-notes.github.io/poison
- https://www.gamedeveloper.com/business/the-ultra-modern-stylings-of-hyper-light-drifter
- https://automaton-media.com/articles/interviewsjp/20170525-47328/
- https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta
- https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle
- https://sabotagestudio.com/presskits/sea-of-stars
- https://80.lv/articles/interview-with-the-developers-of-dead-cells
- https://unity.com/madewith/hollow-knight
- https://www.pressreader.com/australia/edge/20161013/283407716237477
- https://polycount.com/discussion/comment/2267931
- https://www.curseforge.com/stardewvalley/mods/cave-weather-dynamic-mine-events
- https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- https://en.wikipedia.org/wiki/HD-2D
- https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style
- https://steamcommunity.com/workshop/filedetails/discussion/1235181370/570371033831388288
- https://www.gamepressure.com/northgard-game-guide/starting-tips/z6aaca
- https://wargroovewiki.com/Fog_of_War
- https://wargroovewiki.com/Rules_(Codex)
- https://fireemblemwiki.org/wiki/Vision
- https://www.fireemblemwiki.org/wiki/Torch_(item)
- https://di.diablowiki.net/Light_radius
- https://mmos.com/news/albion-online-the-mists-dev-update
- https://www.albiondatabase.com/guides/mists
