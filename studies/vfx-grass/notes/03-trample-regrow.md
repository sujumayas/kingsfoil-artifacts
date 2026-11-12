# 03. Trampling, interaction, cutting, burning, grazing and regrowth

Researcher 03. Angle: these behaviours as systems with numbers, and what an MMO server must store and send.
Source code was read directly where possible (Luanti minetest_game, TFS, GDQuest godot-shaders). Arithmetic on cited constants is marked "(derived)". Pure guesses are marked "(estimate)".

---

## Q1. Interaction / trail maps. How big, how fast do they fade, how does grass read them?

### Takeaway
A trail map is a small texture laid over the ground. Walkers stamp into it, nothing clears it, and grass samples it to bend or flatten. Real implementations are tiny. GDQuest uses 128x128 for a 16x16 m plane. The Kodeco UE4 tutorial uses 256x256 for about 20x20 m. For a 2D tile game the natural choice is 1 to 4 texels per tile over the visible area plus a margin. That is a few KB, cheap enough to update on the CPU and upload every frame.

### Cited findings
- GDQuest Interactive Snow (Godot 4). The SubViewport is `size = Vector2i(128, 128)` with `render_target_clear_mode = 1` (never clear) and `transparent_bg = true`. The mapped world size is `Vector2(16, 16)`, so 8 texels per metre. The trail is never erased because the viewport never clears. https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/InteractiveSnowDemo.tscn
- In the same demo the footprint sprite's alpha equals the distance moved since last frame, so "standing still not disturb the snow" (code comment). https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/InteractiveSnow/InteractiveSnowViewport.gd
- Kodeco "Creating Snow Trails in UE4". Render target 256x256, orthographic capture width 2048 units (about 20x20 m), 1 texel per 8x8 world units. The author says low render target resolutions are best. https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=2
- Kodeco "Creating Interactive Grass in UE4". Particles emitted from the player draw "direction brushes" into a vector field. Directions are stored as colour remapped by `*0.5+0.5`. A scene capture records only those particles. Grass reads the field in World Position Offset. Trails are "semi-persistent" because particles outlive the capture area. No resolution or lifetime numbers given. https://www.kodeco.com/6314-creating-interactive-grass-in-unreal-engine-4?page=1
- Unity practice. A second orthographic camera renders into a render texture with clear flags set to none, so trails persist. Commenters note the resolution trade-off (chunky vs costly) and that a compute shader writing directly is simpler. https://reddit.birdcat.cafe/r/Unity3D/comments/1jyvh86/finally_nailed_snowboard_trails_by_making_a/mn26pkf/?context=3 , ortho + white baseline setup https://hackmd.io/xbL5X2oNRNu3EPjjUj9y6A
- Ghost of Tsushima used "particle grass displacement tech" for pushing grass as player and horse run through. No numbers published in the blog. https://blog.playstation.com/?p=345372 , talk: https://gdcvault.com/play/1027214/contactUs
- Godot forum warning. A user could not make a particle wake persist in a SubViewport once the ship moved. A moving window needs re-centring logic. https://forum.godotengine.org/t/rendering-gpuparticles2d-onto-a-3d-plane/81460

### Inferences for Kingsfoil (2D, Compatibility renderer)
- Skip the SubViewport. Decay needs a ping-pong feedback pass, which costs a second viewport and a blit in WebGL2. A `PackedByteArray` of one byte per tile (or per 8x8 px cell) on the CPU, decremented each frame and uploaded with `ImageTexture.update()`, does the same job. Size (estimate): visible 320x180 px plus a 2-tile margin at 16 px cells is about 24x16 = 384 bytes. At 8 px cells it is about 48x30 = 1.4 KB. Upload cost for under 2 KB R8 is negligible (estimate, not measured).
- Encoding: R = flatten amount (0..255), optionally G = push direction (signed, remapped like Kodeco). Grass tuft shader reads R to pick a flattened frame or to shear 1 to 2 px away from the stamp. Keep shear in whole pixels.
- Recovery numbers (estimate, to tune in the demo). Stamp to 255 on contact. Decay linearly 255 to 0 over 2 to 4 s (about 1 to 2 units per frame at 60 fps). Grass shows three states from that byte: flat (>170), half up (>60), upright. Three discrete pose steps look more pixel-honest than a smooth lerp.
- World-locked indexing (tile x mod W, tile y mod H) avoids the re-centring bug. Entries scrolling out of view just decay as usual.
- This map is cosmetic and per client. Every client stamps from the creature positions it already receives. No network traffic.

### Gaps
- No public per-frame decay constant found in any of the tutorials. Ghost of Tsushima, Journey sand trail numbers not found. Minions Art and Harry Alisavakis posts were not reachable (Patreon 403).

---

## Q2. Persistent wear and desire paths. Do any games form paths from walking, with constants?

### Takeaway
Yes. Foundation (Polymorph) builds its whole road network this way. Dwarf Fortress wears grass by a per-creature trample value. Minecraft mods publish clean thresholds. The pattern is a per-tile step counter, a few stage thresholds, and a slow idle timer that reverts unused paths.

### Cited findings
- Foundation. Players do not place roads. Villager traffic wears grass into dirt paths, and paths feed back into where villagers choose to live. https://www.pcgamer.com/you-dont-have-to-place-roads-in-this-medieval-city-builder-thanks-to-your-citizens-feet , https://www.pcgamesn.com:443/foundation/roads-desire-paths-city-builders . No thresholds published.
- Dwarf Fortress. Each creature has a `[GRASSTRAMPLE]` chance of eroding grass to soil per step. Example values from the older wiki are elves 0, dwarves 5 (default), dragons 50. Grazing erodes grass "as though it were trampled". Outdoor high-traffic designations keep vegetation from being trampled needlessly. https://dwarffortresswiki.org/index.php/v0.31:Grass , https://dwarffortresswiki.org/index.php/v0.31:Traffic . A 2011 bug report says grazed grass never grew back (old, may be fixed). https://dwarffortressbugtracker.com/view.php?id=4164
- Minecraft "Step Erosion" plugin config defaults. Grass to dirt after 20 player steps. Dirt to path after 50 steps. Steps count inside a sliding window of `step-window-ticks: 1728000`. A path idle for `recovery-window-ticks: 5184000` reverts to dirt. Grass overgrowing a block resets its counter. https://modrinth.com/mod/step-erosion
- Minecraft "Living Paths" mod. Stages Grass, Dirt Path, Coarse Dirt, Gravel, Cobblestone, Stone, Smooth Stone. Driven by player and creature movement. Unused paths slowly recover. https://www.curseforge.com/minecraft/mc-mods/living-paths (source https://github.com/KohakuD/MCLivingPaths)
- Godot forum thread on making roads form from people walking. https://forum.godotengine.org/t/creating-roads-manually-and-by-people-walking/140104

### Derived
- Step Erosion windows at 20 ticks/s: 1,728,000 ticks = 86,400 s = 24 real hours. 5,184,000 ticks = 72 real hours. (derived)
- Stardew Valley shows the inverse. Grass gives a -1 speed penalty, so players avoid fields and naturally keep lanes clear. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json

### Inferences for Asterion Online
- Three visual stages fit a 32x32 tile game: lush, worn (a few dirt specks, flattened tufts), path (dirt with grass edges via the existing autotile). A fourth "hard-packed" stage is optional.
- A threshold of 20 to 50 steps per stage is too fast for an MMO town square with hundreds of walkers. Scale it by expected traffic, or count unique walkers per hour instead of raw steps (estimate).
- Idle reversion of 1 to 3 real days matches the Minecraft mods and makes paths reflect actual current habits.

### Gaps
- Banished, Planet Coaster, Ostriv, Farthest Frontier, RimWorld path-wear constants not found in this pass. RCT path wear not confirmed.

---

## Q3. Regrowth and spread rules. What constants do real games use?

### Takeaway
Two families exist. Random-tick systems (Minecraft, Luanti, Terraria) pick random tiles and roll odds, which gives organic edges and a cost that scales with loaded area, not with grass count. Timer systems (Tibia/TFS, Don't Starve, Stardew's daily update) attach a countdown or a daily roll to each changed object. For an MMO, timers on changed tiles only are the cheaper choice because untouched grass costs nothing.

### Cited findings

Minecraft (Java)
- `randomTickSpeed` defaults to 3. Three blocks per 16x16x16 subchunk (4096 blocks) per game tick. A given block gets a random tick every 68.27 s on average, median 47.30 s. https://minecraft.wiki/w/Tick
- Grass block on a random tick picks 4 positions in a 3x5x3 box (1 block up, 3 down) and converts dirt there. Source needs light 9 or more above it. Grass dies to dirt when covered by an opaque block, or when light above drops to 4 or below. https://minecraft.wiki/w/Grass_Block

Luanti / minetest_game (source)
- ABM "Grass spread" on `default:dirt`: `interval = 6`, `chance = 50`, needs light 13 or more above, copies a neighbouring spreading-dirt type within radius 1. https://github.com/luanti-org/minetest_game/blob/master/mods/default/functions.lua
- ABM "Grass covered": `interval = 8`, `chance = 50`, turns grass back to dirt when the node above blocks light.
- Engine defaults `abm_interval 1.0`, `abm_time_budget 0.2`, `active_block_range 4`. https://github.com/luanti-org/luanti/blob/master/builtin/settingtypes.txt

Terraria
- Random tile updates per tick = world width x height x update rate x time rate. Surface rate 3e-5, underground 1.5e-5. About 152 surface updates per tick in a small world, 605 in a large one. Rain raises surface updates by 50%. Grass spreads only to the 8 neighbours, not into fully enclosed blocks, not next to lava. Mowed grass (Lawn Mower) is a separate tile that does not spread underground. https://terraria.wiki.gg/wiki/Plants , https://terraria.wiki.gg/wiki/Grasses

Stardew Valley (decompile-cited wiki)
- A full tile holds 4 tufts. Each day each grass tile grows 1 to 3 tufts. Each tile also has a 65% growth check. A full tile that passes checks its 4 neighbours and spreads 1 to 2 tufts with 25% chance each, only onto tillable soil. Paths, fences and furniture block spread. 40 growth iterations run on spring 1 of year 2+. Grass is dormant in winter since 1.6. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json

Don't Starve Together
- Picked tufts regrow 3 days later, faster in rain. Replanted tufts need fertilizer again after 20 harvests. Tufts wither in summer and do not grow in winter. https://dontstarve.wiki.gg/wiki/Grass/DST . Regrow time is `TUNING.GRASS_REGROW_TIME` in the pickable component. https://forums.kleientertainment.com/forums/topic/8890-modding-grass-drops/
- World regrowth of destroyed tufts. One spawn point is checked every 30 to 60 s. The check is skipped if a player is within 240 units (60 tiles). It spawns only if no grass-group prefab exists within 60 units (15 tiles). It is placed on plantable ground, not on roads. https://dontstarve.wiki.gg/wiki/Regrowth

Tibia / TFS (source)
- Jungle grass cut by machete: `target:transform(grass)` then `target:decay()`. Item 2782 becomes 2781, which has `decayTo 2782, duration 300` (seconds). It regrows in 5 minutes. Same for 3985/3984. https://github.com/otland/forgottenserver/blob/master/data/actions/lib/actions.lua , https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- Wheat cut by scythe: 2739 becomes 2737 and drops a bunch of wheat (2694). 2737 decays to 2738 after 240 s, 2738 to 2739 after 240 s. Two visible growth stages, 8 minutes total.
- Decay engine. `EVENT_DECAYINTERVAL = 250` ms, `EVENT_DECAY_BUCKETS = 4`. Each pass walks one bucket, so every decaying item is touched once per 1000 ms. https://github.com/otland/forgottenserver/blob/master/src/game.h , loop in https://github.com/otland/forgottenserver/blob/master/src/game.cpp (`Game::checkDecay`)

### Derived
- Luanti mean time for an eligible dirt node to turn green is about interval x chance = 6 x 50 = 300 s. Darkness kill is about 8 x 50 = 400 s. (derived, ignores the 1.0 s ABM scheduler granularity)
- Minecraft: one attempt hits a specific block in the 45-block box with p = 1/45, so 4 attempts give about 0.088 per tick. With one grass neighbour, mean time is about 68.27 / 0.088, roughly 13 minutes. Many grass neighbours shorten it. (derived)
- Terraria small world surface: 152 updates per tick at 60 ticks/s is about 9,100 tile updates per second over the whole map. (derived)
- Stardew: an empty tillable tile next to one full grass tile gets grass with p = 0.65 x 0.25 = about 16% per day. So a 1-tile bare strip closes in about 6 days on average. (derived)

### Inferences for Kingsfoil
- Server-side, prefer TFS-style timers on changed tiles only. A flattened, cut or burnt tile gets a "regrow at" timestamp. Untouched grass costs nothing.
- Even cheaper is lazy evaluation. Store `changed_at` and compute the current stage when a client loads the area. No scheduler entry is needed until a visible state change must be broadcast.
- Use random-tick spread only for slow cosmetic creep at edges (grass reclaiming a path), at Luanti-like odds (one chance in 50 per 6 s window per edge tile), and only in active areas.

### Gaps
- Exact `GRASS_REGROW_TIME` value not read from DST scripts (wiki says 3 days). Cataclysm DDA grass rules not checked. Terraria per-attempt spread chance not found.

---

## Q4. Cutting. Drops, stubble state, area.

### Takeaway
Cutting swaps the tile or item to a short "stubble" variant with its own regrow timer, and optionally rolls a drop. Tibia does exactly this with a transform plus a decay timer.

### Cited findings
- Tibia/TFS machete transforms jungle grass to its cut variant, which regrows in 300 s. Scythe on ripe wheat transforms it to stubble and spawns 1 bunch of wheat. Wild growth (a magic wall-like blocker) is removed outright with a puff effect. https://github.com/otland/forgottenserver/blob/master/data/actions/lib/actions.lua
- Stardew. Scythe, sword or dagger cut grass. With a silo, Scythe gives hay 50%, Golden Scythe 75%, Iridium 100%. Winter cuts 67% off those chances. Blue grass gives 2 hay. Swords and daggers never give hay. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Terraria's Lawn Mower converts grass to a "mowed" tile variant. https://terraria.wiki.gg/wiki/Grasses
- Don't Starve. Picking a tuft yields 1 Cut Grass and can rarely turn the tuft into a Grass Gekko, a creature. https://dontstarve.wiki.gg/wiki/Grass/DST

### Inferences
- Pixel art needs one extra stubble sprite per grass type plus a 2 to 4 frame burst of clippings (estimate). A Grass Gekko style "the grass was alive" surprise is a cheap delight hook for small life.

### Gaps
- Scythe arc sizes (Stardew tool swing area, Zelda sword arc) not verified from source.

---

## Q5. Burning grass.

### Takeaway
Grass is the main fuel and fire carrier in both BotW and Don't Starve. BotW adds an updraft over burning grass that players use for gliding. The Fire study (#6) already covers grid spread with fuel, moisture and wind. Grass only needs a fuel value and a "burnt" state that then regrows on the regular timer.

### Cited findings
- BotW. Fire arrows or a fire rod on grass make it burn and create an updraft. Wind carries fire across dry fields. https://twinfinite.net/?p=264104 , https://gamewith.net/zelda-botw/article/show/38837
- BotW chemistry engine. Fire ignites grass and water extinguishes fire, as element-material rules. Grass, enemies and wooden weapons all burn (GDC 2017). https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
- Don't Starve Together. Burning a tuft leaves 1 Ash and no replantable tuft. Tightly planted tufts are a lightning hazard in heavy rain. https://dontstarve.wiki.gg/wiki/Grass/DST
- Tibia/TFS. Scythe on burning sugar cane (5465) turns it to 5464 and starts decay. https://github.com/otland/forgottenserver/blob/master/data/actions/lib/actions.lua
- Fire study: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel

### Inferences
- Burnt grass should be a ground tile stage (charred), regrowing through charred, sprout, short and full on the same timer chain as cut grass. Tibia's chained decay (2737 to 2738 to 2739) is the exact pattern.

### Gaps
- BotW burnt-grass regrowth rules (Blood Moon reset or area reload) not confirmed from a primary source.

---

## Q6. Grazing.

### Takeaway
Grazers are walking cutters. Minecraft sheep turn grass blocks to dirt and need grass to regrow wool. Stardew animals eat tufts. Dwarf Fortress grazing erodes grass like trampling. Grazing gives grass regrowth a gameplay meaning.

### Cited findings
- Minecraft sheep. Adults have a 1/500 chance every other tick to graze, babies 1/25. Grazing turns a grass block to dirt and removes short grass. Sheared sheep regrow wool only after grazing. Babies mature 1 minute faster per graze. https://minecraft.wiki/w/Sheep
- Stardew. Coop animals eat 2 tufts, barn animals 4 tufts (half for blue grass). Blue grass gives 16 friendship instead of 8. Fencing grass stops animals eating it, and fenced source patches reseed the pasture. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Dwarf Fortress. Grazing erodes grass as trampling does, denuding small pastures. https://dwarffortresswiki.org/index.php/v0.31:Grass

### Derived
- Minecraft adult sheep mean time between grazes is 2 x 500 = 1000 ticks = 50 s. Babies graze every 2.5 s. (derived)

---

## Q7. MMO angle. What does the server store and send?

### Takeaway
Split the work in two. Short-lived bending and flattening (seconds) is client-only cosmetic, driven by positions every client already receives. Long-lived state (cut, burnt, worn path, regrowing) is server-authoritative, stored sparsely only for changed tiles, and broadcast only when a visible stage changes. Steps themselves never go on the wire.

### Cited findings
- TFS sends a tile item change as opcode `0x6B` + position (`uint16 x, uint16 y, uint8 z`) + `stackpos` byte + item. https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp , https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
- `sendUpdateTileItem` returns early if `!canSee(pos)`, so only players in view range get it. Same file.
- TFS decay touches every decaying item once per second through 4 buckets at 250 ms. https://github.com/otland/forgottenserver/blob/master/src/game.h
- Tibia regrowable vegetation is modelled as items with `decayTo` and `duration`, so the existing decay system handles it (jungle grass 300 s, wheat 2 x 240 s). https://github.com/otland/forgottenserver/blob/master/data/items/items.xml

### Derived and estimates
- Tile update payload. 1 opcode + 5 position + 1 stackpos + 2 item id = 9 bytes before framing (derived, for non-stackable items without extra attributes). TFS framing adds length, checksum or sequence, and XTEA padding to 8 bytes, but many updates share one packet per flush (estimate).
- Per-tile persistent record (estimate). Changed tiles only, in a hash map keyed by packed tile position. `wear` u8 (step count or unique-walker score), `stage` u4, `kind` u4 (trampled, cut, burnt, grazed), `changed_at` u32 seconds. That is about 6 bytes plus map overhead, so about 16 to 32 bytes per changed tile in practice. A 256x256 field fully worn would need about 1 to 2 MB at worst. Real fields with a few paths would need tens of KB.
- Bandwidth when 100 players cross a field (estimate). At about 2 to 3 tiles per second each, the server sees 200 to 300 step events per second. It only increments counters, and no packet goes out per step. With a 20-step stage threshold and lazy decay, stage changes are at most about 10 to 15 per second at first. They drop to near zero once paths reach their final stage. At 9 bytes x 15 changes x 50 viewers that is about 6.75 KB/s across all viewers, about 135 B/s per viewer. Brief bursts only.
- Wrong design for comparison (estimate). Syncing a per-tile flatten value each frame would be 100 walkers x 9 bytes x 10 Hz x 50 viewers, about 450 KB/s. Cosmetic trampling must stay client-side.
- Regrowth scheduling. Lazy evaluation with `changed_at` needs no scheduler. Stage advances are computed when a chunk is sent to a client. When a stage boundary passes while players watch, a coarse sweep every 10 to 60 s over changed tiles in active areas emits the update (estimate). TFS's 1 s decay pass is fine for a few thousand items but wasteful for a field of tiles.
- Desync tolerance. Clients already see each walker's position, so they can also predict wear locally for instant feedback. The server's stage change then confirms it. A brief mismatch on a cosmetic tile is harmless.

### Gaps
- No measured numbers for OT servers with many decaying items. No public MMO (UO, OSRS, Albion) found with persistent trampled grass. OSRS and UO grass is static, as far as this pass found, but this was not verified.

---

## Quick numbers table

| System | Constant | Source |
|---|---|---|
| GDQuest trail map | 128x128, 16x16 m, never cleared | gdquest godot-shaders |
| UE4 snow trail RT | 256x256 over 2048 units, 8 units per texel | Kodeco |
| Minecraft random tick | 3 per subchunk per tick, mean 68.27 s per block | minecraft.wiki Tick |
| Minecraft grass spread | 4 tries in 3x5x3 box, light 9+ | minecraft.wiki Grass Block |
| Luanti grass spread | interval 6 s, chance 50, light 13+ (mean about 300 s) | minetest_game functions.lua |
| Luanti grass death | interval 8 s, chance 50 (mean about 400 s) | same |
| Terraria tile updates | 3e-5 per tile per tick surface, +50% in rain | terraria.wiki.gg Plants |
| Stardew spread | 65% check, 25% per neighbour, daily | Stardew wiki (decompile refs) |
| DST tuft | regrow 3 days, 20 harvests then fertilize | dontstarve.wiki.gg |
| DST world regrowth | 1 check per 30-60 s, skip if player within 60 tiles | dontstarve.wiki.gg Regrowth |
| TFS jungle grass | regrows 300 s after machete | TFS items.xml |
| TFS wheat | 240 s + 240 s after scythe | TFS items.xml |
| TFS decay loop | 250 ms x 4 buckets, 1 s per item | TFS game.h |
| TFS tile update packet | about 9 bytes payload | TFS protocolgame.cpp (derived) |
| Step Erosion mod | 20 steps grass to dirt, 50 to path, revert after 72 h idle | modrinth |
| DF trample | GRASSTRAMPLE dwarf 5, elf 0, dragon 50 | DF wiki v0.31 |
| Minecraft sheep | adult 1/500 per 2 ticks (about 50 s), baby 1/25 | minecraft.wiki Sheep |

---

## Sources
- https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/InteractiveSnowDemo.tscn
- https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/InteractiveSnow/InteractiveSnowViewport.gd
- https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=2
- https://www.kodeco.com/6314-creating-interactive-grass-in-unreal-engine-4?page=1
- https://reddit.birdcat.cafe/r/Unity3D/comments/1jyvh86/finally_nailed_snowboard_trails_by_making_a/mn26pkf/?context=3
- https://hackmd.io/xbL5X2oNRNu3EPjjUj9y6A
- https://blog.playstation.com/?p=345372
- https://gdcvault.com/play/1027214/contactUs
- https://forum.godotengine.org/t/rendering-gpuparticles2d-onto-a-3d-plane/81460
- https://www.pcgamer.com/you-dont-have-to-place-roads-in-this-medieval-city-builder-thanks-to-your-citizens-feet
- https://www.pcgamesn.com:443/foundation/roads-desire-paths-city-builders
- https://dwarffortresswiki.org/index.php/v0.31:Grass
- https://dwarffortresswiki.org/index.php/v0.31:Traffic
- https://dwarffortressbugtracker.com/view.php?id=4164
- https://modrinth.com/mod/step-erosion
- https://www.curseforge.com/minecraft/mc-mods/living-paths
- https://forum.godotengine.org/t/creating-roads-manually-and-by-people-walking/140104
- https://minecraft.wiki/w/Tick
- https://minecraft.wiki/w/Grass_Block
- https://minecraft.wiki/w/Sheep
- https://github.com/luanti-org/minetest_game/blob/master/mods/default/functions.lua
- https://github.com/luanti-org/luanti/blob/master/builtin/settingtypes.txt
- https://terraria.wiki.gg/wiki/Plants
- https://terraria.wiki.gg/wiki/Grasses
- https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- https://dontstarve.wiki.gg/wiki/Grass/DST
- https://dontstarve.wiki.gg/wiki/Regrowth
- https://forums.kleientertainment.com/forums/topic/8890-modding-grass-drops/
- https://github.com/otland/forgottenserver/blob/master/data/actions/lib/actions.lua
- https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- https://github.com/otland/forgottenserver/blob/master/src/game.h
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/networkmessage.cpp
- https://twinfinite.net/?p=264104
- https://gamewith.net/zelda-botw/article/show/38837
- https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
- https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
