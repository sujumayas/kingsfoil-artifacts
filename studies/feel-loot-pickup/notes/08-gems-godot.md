# 08. Gems (field-tested open code and tools) and Godot 4 implementation

Researcher angle: open-source code and tools worth reusing or reading, plus concrete Godot 4 notes for Asterion Online (Compatibility renderer, web-first, 32 px tiles, server-authoritative).

All licences, star counts and push dates below were read on 2026-11-11 via the GitHub API (`gh api repos/<repo>` and `gh api repos/<repo>/license`) or the raw LICENSE file. "Pushed" means last commit push, not a release.

Licence flag key: Low = MIT/BSD/Apache/ISC/CC0. LGPL. Copyleft = GPL/AGPL/CC BY-SA. None = no usable licence, proprietary or source-available with commercial limits.

---

## Q1. Which Godot 4 inventory and loot addons are worth using?

### Takeaway
Use GLoot for the inventory model if you want a library. It is the most mature (993 stars, v3.0.2 on 2026-07-05, MIT). No Godot addon handles ground items, labels or loot presentation in a way that fits a server-authoritative MMO. Write the ground-item layer yourself and keep the client-side inventory a thin view of server state. Pandora is still alpha by its own README. Loot-table addons are tiny (126 stars or fewer) and a weighted roll is 20 lines of GDScript, and the roll belongs on the server anyway.

### Cited findings

| Gem | URL | Licence (read 2026-11-11) | Maturity | What it saves | Flag |
|---|---|---|---|---|---|
| GLoot | https://github.com/peter-kish/gloot | MIT | 993 stars, release v3.0.2 2026-07-05, pushed 2026-07-14. Godot 4.4+ | Item stacks, prototype trees in JSON, grid / weight / count constraints, item slots, UI controls, serialization | Low |
| Expresso Inventory System | https://github.com/expressobits/inventory-system | MIT | 741 stars, release addon-2.13.0 2026-03-21. C++ GDExtension core, C# branch | Stacks, dropped-item and pickup demos, "Multiplayer compatible (Including example)", loot system, hotbar, crafting | Low |
| Pandora | https://github.com/bitbrain/pandora | MIT | 1,133 stars, pushed 2026-08-20, no GitHub release. README says "STILL IN ALPHA AND NOT PRODUCTION-READY" | Editor UI for RPG data (items, monsters, loot tables) with property inheritance | Low |
| Wyvernbox | https://github.com/don-tnowe/godot-wyvernbox-inventory | MIT | 164 stars, pushed 2026-01-27, Asset Library v1.3.14 (asset 1919). Made for ARPGs | Grid / restricted / currency inventories, `ItemPattern` filters for ground and inventory items, Shift-click quick transfer, Double-click gather all of a type, Right-click split | Low |
| Lootie | https://github.com/sempitern0/Lootie (Asset Library 2923) | MIT | 126 stars, v1.0.2 2024-10-21, pushed 2025-03-04 | Loot table with Weight, RollTier, Percentage and combined modes | Low |
| Modular Inventory | https://codeberg.org/alvlp/modular-inventory (Asset Library 5186) | MIT (Asset Library listing) | v2.0.0 2026-06-30, stars unknown (Codeberg) | Drag and drop, Right-click drag one, scroll wheel to change drag amount, Shift-click quick move | Low |

Asset Library query: https://godotengine.org/asset-library/api/asset?filter=inventory&godot_version=4.3 returned 10 inventory addons, all MIT. `filter=loot` returned only Lootie plus two cloud-service SDKs (LootLocker, Lootfabriq).

GitHub search "godot loot table" sorted by stars tops out at 3 stars (PandaCommando/godot-loot-table, 2019). https://github.com/search?q=godot+loot+table

### Inferences
- GLoot's prototype tree in JSON maps well to a server that also needs item definitions. Both sides can read one JSON file. This is my inference, not a GLoot feature claim.
- Expresso's multiplayer example is worth reading for RPC shape, but it is first-person and 3D. Its pickup trust model was not checked.
- Wyvernbox's gestures (Shift-click, Double-click gather all, Right-click split) are the gesture set Tibia and Diablo players expect. Copy the gestures even if you skip the addon.

### Gaps
- No shipped commercial game list was found for any of these addons. Stars are the only maturity signal.
- I did not read Expresso's network code, so I cannot say whether pickups are server-validated.

---

## Q2. What can Tibia server and client code give us (TFS, Canary, OTClient)?

### Takeaway
Canary's quick loot is the best reference for MMO pickup rules. It has a 1-tile reach, auto-walk then a 300 ms retry, an owner check per corpse, up to 30 corpses per tile, and an accept/skip filter list. OTClient is MIT, so its container and quick loot UI code is safe to read and port. TFS and Canary are GPL-2.0, so read them for rules and numbers but do not copy code into a closed game.

### Cited findings

| Gem | URL | Licence (read 2026-11-11) | Maturity | What it saves | Flag |
|---|---|---|---|---|---|
| Canary (OpenTibiaBR server) | https://github.com/opentibiabr/canary | GPL-2.0 | 668 stars, pushed 2026-11-05. Runs many live OT servers | Quick loot, autoloot, loot pouch, corpse ownership, party loot rules | Copyleft |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars, pushed 2026-11-09 | Corpse containers, loot generation, decay | Copyleft |
| OTClient (Redemption fork) | https://github.com/opentibiabr/otclient | MIT (LICENSE file: "made available under the MIT License"). GitHub API shows NOASSERTION, the file is MIT | 542 stars, pushed 2026-11-09. Modules `game_containers`, `game_quickloot`, `game_lootsplitter`, `game_inventory` | Container windows, quick loot filter UI, loot splitter UI | Low |
| OTClient (original) | https://github.com/edubart/otclient | MIT (same LICENSE text) | 709 stars, pushed 2024-09-14 | Same, older | Low |

Canary quick loot rules, from `src/game/game.cpp` (`Game::playerQuickLoot`, about line 6428), https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp :
- Reach is 1 tile. The check is `Position::areInRange<1, 1, 0>(pos, player->getPosition())`.
- Out of range, the server queues an auto-walk and retries the loot in a task after 300 ms.
- If the player cannot act yet, the server reschedules the loot at `getNextActionTime()`. It does not drop the request.
- "Loot all corpses" walks the tile's item list and loots up to `maxQuickLootCorpses`, skipping corpses with a uniqueid or actionid.
- Each corpse is checked with `getCorpseOwner() != 0 && !player->canOpenCorpse(owner)`. Reward corpses (boss) skip the owner check.
- More than 1 corpse looted sends the chat line "You looted N corpses." as `MESSAGE_LOOT`.
- Quick loot without a position needs premium ("You must be premium.").
- The filter is a per-player list with two modes, `QUICKLOOTFILTER_SKIPPEDLOOT` (blacklist) and `QUICKLOOTFILTER_ACCEPTEDLOOT` (whitelist), around line 3882.

Canary config defaults, `config.lua.dist`, https://github.com/opentibiabr/canary/blob/main/config.lua.dist :
- `quickLootMaxCorpses = 30`, `lootPouchMaxLimit = 2000`, `autoLoot = false`, `autoBank = false` (when true, dropped coins go straight to the bank).
- `sortLootByChance = false`. The comment says it makes rarest items drop first so a full corpse does not lose them.
- `toggleGoldPouchQuickLootOnly`, `partyShareLootBoosts = false` with diminishing factor 0.7.

OTClient quick loot UI, https://github.com/opentibiabr/otclient/blob/main/modules/game_quickloot/quickloot.lua : it is gated on feature `GameThingQuickLoot`, sends `g_game.sendQuickLoot(2)` from a menu callback, and syncs the filter with `g_game.requestQuickLootBlackWhiteList(filter, items)`.

### Inferences
- The 300 ms retry after auto-walk is a server-side "intent buffer". The click is never lost, so spam-clicking a far corpse still works. Asterion should copy that rule, since Combat Juice notes players spam-click corpses.
- Canary keeps the whitelist/blacklist on the server. That is what makes autoloot cheat-proof. Copy the design, not the GPL code.

### Gaps
- I did not read TFS's party shared-loot or decay code in this pass. Other researchers cover corpse timers.

---

## Q3. What does RuneLite's ground items plugin teach about labels, tiers and timers?

### Takeaway
RuneLite's Ground Items plugin is BSD-2 and field-tested by a very large OSRS player base. Its label stacking is simple. One label per item, stacked 15 px upward per extra item on the same tile, tiers by value in 5 colours, a despawn timer pie of 10 px, and loot beams for top tiers. Asterion can port the whole design.

### Cited findings
- Repo: https://github.com/runelite/runelite , BSD-2-Clause (LICENSE read 2026-11-11, "Copyright (c) 2016-2017, Adam"). 5,526 stars, pushed 2026-11-10. Flag Low.
- Plugin folder: https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems (GroundItemsOverlay.java, GroundItemsConfig.java, GroundItemsPlugin.java, Lootbeam.java, ItemThreshold.java).
- `GroundItemsOverlay.java` constants: `STRING_GAP = 15` px between stacked labels, `OFFSET_Z = 20` label height above the tile, `RECTANGLE_SIZE = 8`, `TIMER_OVERLAY_DIAMETER = 10`, `MAX_DISTANCE = 2500` local units (about 19.5 tiles at 128 units per tile, my conversion).
- Stacking: an `offsetMap` keyed by world tile counts items on that tile. Each label is drawn at `textY - STRING_GAP * offset`. So labels on one tile never overlap, and labels on adjacent tiles may.
- Timer colours: public timer yellow, private timer green. Timer text shows seconds with one decimal, or ticks (`despawnTimeMillis / 600`, because one OSRS tick is 600 ms).
- Ownership filter: `OwnershipFilterMode` decides whether to draw items owned by others.
- Config defaults (`GroundItemsConfig.java`): default white, highlighted `#AA00FF`, hidden grey, low value `#66B2FF` at 20,000 gp, medium `#99FF99` at 100,000, high `#FF9600` at 1,000,000, insane `#FF66B2` at 10,000,000. Double-tap delay 250 ms. Options for a "Lootbeam tier", "Lootbeam style", "Notify tier", "Collapse ground item menu", "Despawn timer", "Text outline", "Hide under value".
- `Lootbeam.java` spawns a game model (ids 5809 / 43330) recoloured to the tier colour with an idle animation, two styles.
- Loot tracker plugin (also BSD-2): https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/loottracker . Not read in detail this pass.

### Inferences
- Port as data. A `LootTier` Resource holds colour, value threshold, beam on/off, notify on/off. A client-side "hide under value" filter costs nothing on the server.
- Tile-keyed stacking is cheap (one dictionary per frame) and fits a 32 px grid. With 15 px gap and a 32 px tile, two labels fit per tile height before they reach the next row.

### Gaps
- RuneLite labels never resolve overlap between adjacent tiles. For a dense boss pile, see the DevilutionX algorithm in Q5.

---

## Q4. What do PoE filter tools give us?

### Takeaway
NeverSink's filter is the best public data on how to tier loot presentation. It is MIT and has 7 strictness levels. In the PoE2 "Regular" file, font size runs from 18 (minimised) to 45 (top tier). The top tier gets a white background with red text, a red beam, a red star on the minimap and alert sound 6 at volume 300. FilterBlade is a closed web tool. Filtration is archived.

### Cited findings

| Gem | URL | Licence (read 2026-11-11) | Maturity | What it saves | Flag |
|---|---|---|---|---|---|
| NeverSink filter (PoE2) | https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2 | MIT | 2,851 stars, release 0.10.4a 2026-10-15 | A tier ladder already balanced by players: font size, colours, beam colour, minimap icon, sound per tier | Low |
| NeverSink filter (PoE1) | https://github.com/NeverSinkDev/NeverSink-Filter | MIT | 2,608 stars, pushed 2026-10-15 | Same for PoE1 | Low |
| FilterBlade | https://www.filterblade.xyz/ | No open source, web tool | Widely used by PoE players. No repo found | Visual editor that presents strictness levels | None |
| Filtration | https://github.com/ben-wallis/Filtration | GPL-2.0 | 261 stars, archived, last push 2022-10-11 | Desktop filter editor | Copyleft |

Counts from `NeverSink's filter 2 - 1-REGULAR.filter` (5,308 lines, 434 Show blocks, 18 Hide blocks), https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2/blob/main/NeverSink's%20filter%202%20-%201-REGULAR.filter :
- Font sizes used: 40 (131 blocks), 42 (121), 45 (49), 18 (48), 35 (29), 38 (25), 32 (7), 30 (3), 26 (2).
- Beam colours (`PlayEffect`): Blue 50, Red 41, Yellow 32, White Temp 18, Cyan 17, White 15, Purple Temp 14. "Temp" beams show only at drop time.
- Top currency block (line 3407, `$tier->s`): font 45, text `255 0 0`, border `255 0 0`, background `255 255 255 255`, `PlayAlertSound 6 300`, `PlayEffect Red`, `MinimapIcon 0 Red Star`.
- Low supply currency (line 3478): font 35, text `170 158 130`, no beam, no sound.
- Hidden currency (line 3484): font 18 with Hide. The item still exists but its label is minimised.

### Inferences
- The ladder has about 4 visual channels that rise together: size, colour inversion, beam and sound. Asterion's 32 px pixel art cannot scale font like PoE. Use a 2 to 3 step ladder instead. Small label, label plus outline, then label plus beam and sound.
- Players accept "minimise, don't delete". A Hide rule in PoE still lets the item be picked up. Asterion should hide labels, not items.
- "Temp" beams (on drop only) are a cheap way to flag mid tiers without a permanent glow cost.

### Gaps
- PoE font size units are game-internal. The pixel height at 1080p was not found.

---

## Q5. Label layout and declutter: what algorithms are proven?

### Takeaway
For a 2D top-down game, DevilutionX's item label pass is the right size. It is a greedy O(n^2) pass that moves labels sideways when rows overlap, about 30 lines of code. But DevilutionX's licence forbids commercial use, so reimplement it from the description. For larger counts, use a spatial index (rbush, MIT) or MapLibre's grid collision idea (BSD-3). Flare's rule of hiding loot labels when an entity stands within 3 tiles is a cheap declutter trick.

### Cited findings

| Gem | URL | Licence (read 2026-11-11) | Maturity | What it saves | Flag |
|---|---|---|---|---|---|
| DevilutionX item labels | https://github.com/diasurgical/DevilutionX/blob/master/Source/qol/itemlabels.cpp | "Sustainable Use License Version 1.0" (LICENSE.md). Use only "for non-commercial or personal use". GitHub API shows NOASSERTION | 10,003 stars, release 1.5.5 2025-10-30. Ports Diablo to many platforms | Reference label declutter for ground items | None (not OSI; no commercial use) |
| Flare engine | https://github.com/flareteam/flare-engine | GPL-3.0 | 1,308 stars, pushed 2026-11-11, tag v1.15 | Data-driven loot settings, label hide radius, autopickup | Copyleft |
| Flare game (data) | https://github.com/flareteam/flare-game | CC BY-SA 3.0 (LICENSE.txt) | 1,344 stars | Example data | Copyleft |
| MapLibre GL JS | https://github.com/maplibre/maplibre-gl-js | BSD-3 style (LICENSE.txt, "Copyright (c) 2023, MapLibre contributors") | 12,070 stars, pushed 2026-11-11 | Grid-based symbol collision and priority placement | Low |
| Mapbox GL JS v2+ | https://github.com/mapbox/mapbox-gl-js | Proprietary ("Mapbox Web SDK ... All rights reserved") | 12,493 stars | Do not use | None |
| rbush | https://github.com/mourner/rbush | MIT | 2,789 stars, pushed 2026-10-02 | R-tree for rectangle overlap queries (algorithm port to GDScript) | Low |
| labella.js | https://github.com/twitter/labella.js | Apache-2.0 | 3,867 stars, last push 2023-04-10 | Force-based 1D label placement | Low |

DevilutionX algorithm (described, not copied):
- Constants: `BorderX = 4` px min horizontal gap, `BorderY = 2` px min vertical gap, `MarginX = 2` px text padding. Label height is 11 px (small font) plus margins of -1 and 3, so 13 px. For a tall font it is 16 + 1 + 1 = 18 px.
- Labels queue in draw order. For each label i, compare against every earlier label j. If their y differs by less than label height + BorderY and their x ranges overlap, move i left or right by the other's width. A `usedX` set stops it bouncing back. Repeat until i overlaps nothing.
- Labels show while a highlight key is held, or always if the option is on (key press toggles the option inverse).
- A hovered label gets a solid blue fill. Others get a half-transparent rect.

Flare loot settings, data file https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt and parser https://github.com/flareteam/flare-engine/blob/master/src/EngineSettings.cpp (about line 1040):
- `autopickup_currency=1`, `autopickup_range=1` (tiles), `drop_radius=1` (tiles from origin), `drop_max=1`, `tooltip_margin=128`, `sfx_loot=soundfx/flying_loot.ogg`.
- `hide_radius` defaults to 3.0. The doc string says the label is hidden when an entity is within this radius "unless highlighted with the cursor".

### Inferences
- DevilutionX's pass is O(n^2) per frame on visible labels. At 50 labels that is 1,225 pair checks, trivial in GDScript. At 300 it is about 45,000, which may cost about 1 to 3 ms in GDScript on low-end web (estimate, not measured). Above about 100 labels, bucket labels by screen row (13 px bins) first, or only lay out on change, not every frame.
- For an MMO, only re-run layout when the set of visible items changes or the camera moves a full tile. Cache positions between.

### Gaps
- No measured GDScript cost for any label layout. Benchmark in the sandbox.

---

## Q6. Tween libraries and open games with good loot feel

### Takeaway
Godot's built-in Tween covers drop arcs and fly-to-bag. No library is needed. Godot Tween Suite (MIT) adds an editor for tweens if designers want one. Among open games, DevilutionX (Diablo item flip animations and labels) and Flare (data-driven loot) are the best to study. Veloren, Cataclysm, Flare data and TFS are copyleft, so read them only.

### Cited findings
- Godot `Tween` class: https://docs.godotengine.org/en/stable/classes/class_tween.html . Created only via `create_tween()`, since `Tween.new()` is invalid. Tweeners run in sequence unless `set_parallel()` or `parallel()`. `tween_method()` drives a custom callable. `bind_node()` ties it to a node's life. `set_process_mode()` picks idle or physics. To restart, keep a reference and `kill()` the old tween.
- Godot Tween Suite: https://github.com/KoBeWi/Godot-Tween-Suite , MIT, 136 stars, pushed 2026-07-19. Flag Low.
- tween.js: https://github.com/tweenjs/tween.js , MIT (LICENSE; easing equations by Robert Penner), 10,152 stars. Reference for easing only. Flag Low.
- Veloren: https://github.com/veloren/veloren , GPL-3.0, 7,691 stars, pushed 2026-11-10. 3D voxel, loot code not read. Flag Copyleft.
- Cataclysm DDA: https://github.com/CleverRaven/Cataclysm-DDA , CC BY-SA 3.0 (LICENSE.txt), 13,526 stars. Flag Copyleft.
- Godot demo projects (MIT, 9,783 stars): `networking/multiplayer_bomber`, `websocket_multiplayer`, `webrtc_signaling`. https://github.com/godotengine/godot-demo-projects/tree/master/networking . None has item entities, but bomber shows authority and spawn RPCs.

### Gaps
- I found no open-source Godot MMO with ground-item netcode worth citing.

---

## Q7. Godot 4 implementation notes (Compatibility renderer, web)

### Takeaway
Draw ground items as plain Sprite2D nodes sharing one atlas texture and no material. The Compatibility renderer batches those. Put glow on a few top-tier items only, through one shared ShaderMaterial and per-item instance uniforms (4.4+), which do not break batching. Draw labels from one node using `draw_string` with a pixel bitmap font, not one Label node per item. Do the magnet as a visual tween only. The server decides pickup by tile distance, so there are no per-item Area2Ds.

### Cited findings
- Batching: "Batching has been implemented in the Compatibility renderer since the release of 4.0." 4.4 added it to Forward+ and Mobile. https://godotengine.org/article/dev-snapshot-godot-4-4-beta-1/
- 2D shader instance uniforms (4.4) give a per-CanvasItem uniform value and "works without breaking batching". Same source.
- Material changes broke batches in the 3.x batcher: https://docs.godotengine.org/en/3.5/tutorials/performance/batching.html . A 4.x statement of the exact break rules was not found. Treat "different material or texture breaks the batch" as likely but not verified for 4.x Compatibility.
- MultiMeshInstance2D: https://docs.godotengine.org/en/stable/classes/class_multimeshinstance2d.html . Multimesh guide (3D-oriented): https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html
- Fonts: Godot supports BMFont `.fnt` bitmap fonts. Pixel-look fonts should use Nearest filtering and subpixel positioning Disabled. MSDF needs Pixel Range at least 2x outline size. https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- Label exposes `visible_characters` and `visible_ratio` for reveal effects. https://docs.godotengine.org/en/stable/classes/class_label.html

### Recipes and inferences (my own, mark as untested until the sandbox measures them)

1. Drop arc with Tween. Animate a logical `t` from 0 to 1 with `tween_method`. Set x and y linearly, and add a height offset `-4 * h * t * (1 - t)` on the sprite only (not the shadow). Use h = 12 to 20 px and 250 to 350 ms. Then add one bounce of 30% height over 100 ms with `TRANS_QUAD` and `EASE_OUT`. Snap the final position to the integer pixel so pixel art stays crisp. One Tween per item is cheap at tens of drops. For a 30-item boss spill, stagger starts by 30 to 50 ms with `tween_interval` so the drops read one by one. Parameters are estimates; the feel numbers come from other researchers.

2. Fly-to-bag. Convert the bag icon's screen position to world space with `get_viewport().get_canvas_transform().affine_inverse()`. Tween position with `TRANS_BACK` and `EASE_IN` over 200 to 300 ms, scale 1 to 0.5, then `queue_free` or return to a pool. Start it only after the server confirms the pickup. On reject, play a 2 px shake over 120 ms and leave the item.

3. AnimatedSprite2D vs shader glow. AnimatedSprite2D frames from the same atlas keep batching and cost only a texture region change per frame. A glow shader adds fragment work per pixel and may split batches if each item has its own material instance. Rule of thumb: bake 2 to 4 frame glow pulses into the sprite sheet for common tiers. Reserve one shared ShaderMaterial with instance uniforms (colour, phase) for the top 1 to 2 tiers. Never `duplicate()` a material per item.

4. Batching many item sprites. Keep all ground-item icons in one atlas, use no per-item material, same z_index and same parent. Under a y-sorted parent, interleaving with characters will break batches. Put ground items on their own CanvasLayer or a parent below the y-sort layer, since items lie flat on the floor. Use the Godot profiler's draw call count to confirm.

5. Label vs bitmap font. Each Label node is a Control with its own shaping and layout. A custom Node2D with `_draw()` calling `draw_string()` per visible label, using one BMFont pixel font, gives one node and one redraw for all labels. Call `queue_redraw()` only when labels change. Also run the Q5 declutter pass inside that node.

6. MultiMeshInstance2D for many ground items. Worth it above about 500 identical-looking static items, such as gold piles or arrows. Per-instance transform plus colour or custom data lets one draw call cover them all. The cost is that picking, hover and per-item animation move to your own code. For Asterion's likely count (tens to low hundreds on screen) batched Sprite2D is simpler. Inference.

7. Area2D magnet vs grid query. One Area2D per item adds a physics body and broadphase work per item. The server must own pickup anyway. Keep items in a `Dictionary` keyed by `Vector2i` tile, then check the player's tile and its 8 neighbours. For a magnet radius of r tiles that is (2r+1)^2 lookups, 25 for r = 2. The client may start the pull tween when the server sends "picked up by X". So it is visual only and avoids desync.

8. Data-driven tier presentation as Resources. One `LootTierStyle` Resource (`class_name`, `@export` fields): `label_color`, `outline_color`, `beam_enabled`, `beam_color`, `beam_temp_only`, `glow_frames: SpriteFrames`, `drop_sound: AudioStream`, `minimap_icon`, `min_value`, `label_hidden_by_default`. Items reference a tier id. The server sends only tier id and item id. Players get a local filter Resource that overrides `label_hidden_by_default`, like RuneLite "hide under value" and PoE Hide.

9. Item entities over the network. Avoid `MultiplayerSpawner` per ground item for crowds. Send compact events instead, e.g. `spawn(item_uid:u32, item_id:u16, tile:Vector2i, tier:u8, owner:u32, protect_until:u16)` of roughly 15 to 17 bytes (estimate) and `remove(item_uid)`. Filter by area of interest on the server, as Tibia does per visible map area.

### Gaps
- No measured Godot numbers for any of the above. The sandbox should measure draw calls and frame time for 100, 300 and 1,000 ground items in three forms: Sprite2D, Sprite2D plus a shared glow shader, and MultiMeshInstance2D. It should also measure the cost of 300 Labels vs one `_draw` node.

---

## Sources
- GLoot https://github.com/peter-kish/gloot
- Expresso Inventory System https://github.com/expressobits/inventory-system
- Pandora https://github.com/bitbrain/pandora
- Wyvernbox https://github.com/don-tnowe/godot-wyvernbox-inventory
- Lootie https://github.com/sempitern0/Lootie
- Modular Inventory https://codeberg.org/alvlp/modular-inventory
- Godot Asset Library API https://godotengine.org/asset-library/api/asset?filter=inventory&godot_version=4.3
- Canary https://github.com/opentibiabr/canary , game.cpp https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp , config https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- TFS https://github.com/otland/forgottenserver
- OTClient https://github.com/opentibiabr/otclient , quickloot https://github.com/opentibiabr/otclient/blob/main/modules/game_quickloot/quickloot.lua , https://github.com/edubart/otclient
- RuneLite https://github.com/runelite/runelite , ground items https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems , loot tracker https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/loottracker
- NeverSink PoE2 https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2 , PoE1 https://github.com/NeverSinkDev/NeverSink-Filter
- FilterBlade https://www.filterblade.xyz/
- Filtration https://github.com/ben-wallis/Filtration
- DevilutionX https://github.com/diasurgical/DevilutionX , itemlabels.cpp https://github.com/diasurgical/DevilutionX/blob/master/Source/qol/itemlabels.cpp
- Flare engine https://github.com/flareteam/flare-engine , EngineSettings.cpp https://github.com/flareteam/flare-engine/blob/master/src/EngineSettings.cpp , flare-game loot.txt https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt
- MapLibre GL JS https://github.com/maplibre/maplibre-gl-js ; Mapbox GL JS https://github.com/mapbox/mapbox-gl-js ; rbush https://github.com/mourner/rbush ; labella.js https://github.com/twitter/labella.js
- Godot Tween Suite https://github.com/KoBeWi/Godot-Tween-Suite ; tween.js https://github.com/tweenjs/tween.js
- Veloren https://github.com/veloren/veloren ; Cataclysm DDA https://github.com/CleverRaven/Cataclysm-DDA
- Godot demo projects https://github.com/godotengine/godot-demo-projects/tree/master/networking
- Godot 4.4 beta 1 (batching, instance uniforms) https://godotengine.org/article/dev-snapshot-godot-4-4-beta-1/
- Godot 3.5 batching doc https://docs.godotengine.org/en/3.5/tutorials/performance/batching.html
- Godot Tween https://docs.godotengine.org/en/stable/classes/class_tween.html
- Godot fonts https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- Godot Label https://docs.godotengine.org/en/stable/classes/class_label.html
- Godot MultiMeshInstance2D https://docs.godotengine.org/en/stable/classes/class_multimeshinstance2d.html ; multimesh guide https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html
