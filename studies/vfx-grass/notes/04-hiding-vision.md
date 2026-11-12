# 04. Hiding in tall grass, vision and readability

Researcher 04. Angle is stealth and sight blocking in grass, how to draw a hidden character, and what a server-authoritative tile MMO (Asterion Online, 32x32 tiles, TFS-like) must do so hidden players are not leaked.

Short version. Every game that does grass hiding well picks one of three rule shapes and states it clearly to the player.
- Tile blocks sight across it (roguelikes: Shattered Pixel Dungeon, Brogue). The grass is a wall for the FOV algorithm, and stepping in tramples it.
- Patch hides whoever is inside it from anyone outside it (MOBAs: League brush, Pokémon Unite grass, Brawl Stars bushes). Reveal by being in the same patch, by being close, by a ward, or by attacking.
- Tile hides you from anyone not adjacent (Cataclysm DDA `HIDE_PLACE`). This is the simplest rule for a tile MMO.

The MMO part matters more than the art. Riot's rule is "the server withholds enemy positions until a client needs to display it". TFS today does the opposite for invisible players (it still sends them, with an empty outfit), so the TFS invisibility code is a model of what not to copy for grass.

---

## Q1. What rule decides who sees whom in grass?

### Takeaway
For a tile MMO, use a patch-or-adjacency rule, not a line-of-sight rule. A hidden creature is visible to viewers that stand in the same grass patch, or within 1 tile (Chebyshev), or that hold a reveal effect. Attacking or casting from grass breaks hiding for a short time. This is a cheap per-pair check and needs no FOV raycast on the server.

### Cited findings
- League of Legends brush. Units inside are hidden from enemies until someone has sight of that brush. The wiki says it is "not a form of stealth". Skillshots and other untargeted effects still hit hidden units. A ward must be inside the brush to see into it. A ward in a brush stops enemies from using it to hide. Targeted attacks or abilities from brush reveal a 300-unit radius around the champion for 2 seconds. Summoner's Rift has 39 brush patches, Howling Abyss has 5. Minions do not aggro on units they cannot see. https://wiki.leagueoflegends.com/en-us/Brush
- Pokémon Unite tall grass. Players outside cannot see Pokémon in it. Entering the same grass reveals them. https://gamewith.net/pokemon-unite/article/show/29470 . Targeted moves cannot pick a hidden Pokémon, area moves still hit. https://bulbapedia.bulbagarden.net/wiki/Long_grass . One guide claims you stay hidden from outside even while attacking. https://www.thegamer.com/pokemon-unite-useful-hidden-map-mechanics/ (sources disagree on attack reveal, see Gaps).
- Brawl Stars bushes. Opponents see you only when they come close or you shoot. Hidden characters become transparent for their own team, and "your team mates will see you everywhere". https://www.gamepressure.com/brawl-stars/how-can-i-hide/zfc615 . Bo's Circling Eagle star power spots bush enemies from 150% longer distance than normal (fan wiki via search, page itself returns 402). https://brawlstars.fandom.com/wiki/Sapphire_Plains . Players use "3 tiles away from the bush" as a safe heuristic, not an official value. Leon's invisibility is separate, enemies within about 4 tiles see him. https://trophycoach.com/brawl-stars/guides/how-to-counter-leon
- Cataclysm DDA. The `HIDE_PLACE` flag means "creatures on this tile can't be seen by creatures not standing on adjacent tiles". https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON/JSON_FLAGS.md . Its grass ladder is `t_grass` (ankle high), `t_grass_long` (shin high, move_cost 3, `SMALL_HIDE` so only rat-sized monsters hide in it), `t_grass_tall` (head high, move_cost 5, coverage 50, `looks_like: t_shrub`). Each one `transforms_into` the next shorter one when cut or grazed. https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-flora.json
- Mark of the Ninja. Light and dark are binary with no visibility meter. Guards have 3 awareness levels. https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules

### Inferences
- MOBA reveal on attack (300 units for 2 s in League) maps to a tile game as "attacking from grass sets `revealedUntil = now + 2000 ms`" and optionally a 2 to 3 tile reveal radius. 300 League units is about 3 tiles if you take a champion as about 100 units across (estimate).
- Pick one rule and teach it with the visuals in Q3. Players forgive almost any rule if the screen shows it. Mark of the Ninja's binary rule is the precedent.
- The "same patch" rule needs a patch id per tile (flood-fill connected tall grass at map load, store a uint16 per tile). The adjacency rule needs nothing extra. Adjacency alone has a flaw, a big field becomes a place where two players 2 tiles apart are both blind. That is fine for PvE ambience and bad for PvP ganking. Combining both (same patch OR adjacent) fixes it.

### Gaps
- Exact Brawl Stars bush reveal distance in tiles not found (fan wiki blocked, 402). Pokémon Unite attack-reveal duration not found.

---

## Q2. Roguelike rule. Grass as a line-of-sight blocker

### Takeaway
In Shattered Pixel Dungeon and Brogue, tall grass is just a `losBlocking` flag fed to the same shadowcasting as walls. Stepping in tramples it to short grass, so the grass hides what is behind it, never the player standing in it. Cheap, readable, and great for ambushes in single-player. Less suited to an MMO with many walkers, because every step changes FOV for everyone nearby.

### Cited findings
- SPD `Terrain.java`. `GRASS = PASSABLE | FLAMABLE`. `HIGH_GRASS = PASSABLE | LOS_BLOCKING | FLAMABLE`. `FURROWED_GRASS` copies HIGH_GRASS flags. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Terrain.java
- SPD `Level.java`. `losBlocking[i] = (flags & Terrain.LOS_BLOCKING) != 0` per cell, then `ShadowCaster.castShadow(...)` with `MAX_DISTANCE = 20`. Stepping on HIGH_GRASS or FURROWED_GRASS calls `HighGrass.trample`. The Warden subclass and two bosses copy the blocking array and clear grass cells, so they see through grass. Smoke Screen works the other way and adds blocking cells for non-allies. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Level.java and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/mechanics/ShadowCaster.java
- SPD `HighGrass.trample`. Grass becomes `Terrain.GRASS` (the Huntress with a talent leaves FURROWED_GRASS). Drops on trample are seed chance `1/(25 - 4*naturalism)` (1/25 base) and dew `1/(6 - naturalism/2)` (1/6 base, halved on grassy floors). 4 leaf particles burst. FOV is recomputed only if the cell is in hero view (`if (Dungeon.level.heroFOV[pos]) Dungeon.observe()`). The Camouflage armor glyph gives Invisibility for `3 + level/2` turns on trample. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java and .../items/armor/glyphs/Camouflage.java
- Brogue CE `FOLIAGE` ("dense foliage") has `T_OBSTRUCTS_VISION | T_IS_FLAMMABLE` and `TM_PROMOTES_ON_STEP`, so stepping turns it into `TRAMPLED_FOLIAGE`, which does not block vision. Trampled foliage has `promoteChance = 100` and regrows via `DF_FOLIAGE_REGROW`. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c . `Time.c` rolls `rand_range(0, 10000) < promoteChance`, so 100 means 1% per turn, mean regrowth about 100 turns. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c

### Inferences
- Note the gameplay consequence of trample-to-see. In SPD you cannot hide inside grass, you hide behind it. The ambush comes from the monster on the far side. That is a good rule for the Kingsfoil single-player RPG.
- For the MMO, a per-viewer FOV raycast on every grass tile is the expensive path. TFS has no per-tile LOS for visibility today (Q5), only a rectangle. Adding shadowcasting per player per move on the server is an estimated O(r^2) per walker with r = 8 to 11 tiles. That is affordable for one shard but it is new code and it multiplies with trampling traffic.

---

## Q3. How to draw the hidden character, to its owner and to others

### Takeaway
To the owner and allies, keep the character fully readable and change one cue (transparency or a dark silhouette) so the "I am hidden" state is obvious. To enemies, draw nothing, because the server sent nothing. Never use partial alpha on enemies as a hint, because that is a client-side decision a hacked client can undo.

### Cited findings
- League. Units inside brush have transparent character models. https://wiki.leagueoflegends.com/en-us/Brush
- Brawl Stars. "your character will become transparent", teammates still see you. https://www.gamepressure.com/brawl-stars/how-can-i-hide/zfc615
- Mark of the Ninja. Concealed, the character is "in black with red highlights", in light "fully colored". https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules . Noise is "a spreading blue ring" in the playfield. https://www.gamedeveloper.com/design/reinventing-stealth-in-2d-with-i-mark-of-the-ninja-i-
- Pokémon Emerald tall grass. Each object that steps on tall grass spawns its own 16x16 grass field-effect sprite at the tile (`SetSpritePosToOffsetMapCoords(&x,&y,8,8)`), animated as a rustle, kept alive while the object stays, stopped when it moves off and the anim ends. Its subpriority is recomputed against nearby objects every frame (`UpdateGrassFieldEffectSubpriority`). https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c . Walker sprites use subsprite tables that split 16x16 into a top 16x8 at priority 2 and a bottom 16x8 at priority 3, so the lower half can sort behind a BG layer. https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h

### Inferences (art recipes for 32x32 tiles at 320x180)
- Lower-body cover, the cheap 3/4 trick. Draw a "grass front" overlay per tall-grass tile, the bottom 10 to 14 px of a 32 px tile, with y-sort origin at the tile's bottom edge. A walker on that tile has its origin a few px higher, so the overlay draws in front of its legs. No shader. This is how Emerald gets the look with one extra 16x16 sprite per occupied tile. Godot version is a Sprite2D child of the grass TileMap cell or an extra TileMap layer with `y_sort_enabled`, plus a 1 to 2 px sway (link to Forest D1).
- Owner view when hidden. Two options I would test. (a) 50% ordered dither of the sprite (checkerboard alpha, world-locked like the Fog study's dither), which stays crisp in pixel art where real alpha muddies the palette. (b) MotN-style palette swap to 2 dark colours plus a 1 px outline in a team colour. Both are a one-uniform shader toggle. Avoid smooth alpha below about 0.6, it smears into the grass at 320x180.
- Allies. Same treatment as owner so the team reads "hidden" the same way.
- Enemy view. Nothing, plus a cosmetic grass rustle on a tile only when the server chooses to send a "rustle" event (see Q5). A rustle that the server sends for every hidden step leaks the path.
- Readability of visible enemies standing in grass. Keep the top half of the sprite above the grass-front overlay always (max overlay height about 40% of the character), and keep name plates and health bars above the grass. Don't let grass hide a monster that the player is allowed to see.

### Anti-patterns
- Grass hiding loot. SPD drops seeds and dew on trample, but items land on short grass afterwards, so they stay visible. A tall-grass overlay drawn over items makes loot invisible. Draw items above the grass-front layer, or flatten grass on tiles holding items. (inference from the SPD code above plus the Loot study's readability rules)
- Random encounters with no tell. Emerald's grass rate for Route 101 is 20, multiplied by 16, compared to `Random() % 2880`, so about 11% per step. https://github.com/pret/pokeemerald/blob/master/src/wild_encounter.c and https://github.com/pret/pokeemerald/blob/master/src/data/wild_encounters.json . That works because grass is the only place it happens. An MMO ambush rule should be just as legible (only tall grass, always the same overlay).
- Hidden enemies that can be hit but not seen with no feedback. League and Unite both let area attacks hit hidden units. Show hit sparks at the hidden target's tile, or players will think the game is broken. (inference)

---

## Q4. Server rule. Never send hidden entities

### Takeaway
Vision is decided on the server, per viewer, and a hidden creature is removed from that viewer's known set. Send a remove, then send nothing until it is revealed, then send a fresh add with current position. Add a small look-ahead so the reveal does not pop in late.

### Cited findings
- Riot. League's fog works because the server "withholds information about the positions of enemies until a client needs to display it". VALORANT copied this. Their first prototype doubled frame time and dropped the server from 128 to 64 tick. The shipped version uses less than 2% of server frame time, down from 50%. They use precomputed visibility cells, keep actors relevant for a short time after they stop being visible, and let attached actors inherit their parent's visibility. They pad each actor's box by velocity times a look-ahead larger than expected ping. https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war (mirror of https://technology.riotgames.com/node/108)
- Riot, League fog rendering. The visibility data is a 128x128 grid over the whole map. 256x256 would have quadrupled CPU cost. The client upscales to 512x512 (4x) with 16 antialias patterns per cell and blurs it. https://www.riotgames.com/en/news/story-fog-and-war (mirror of https://technology.riotgames.com/node/39)
- Riot "net visibility" decides whether packets for a unit are shared with a player. https://technology.riotgames.com/node/107

### Inferences (Asterion design)
- Per-viewer check, all integer, no raycast.
  ```
  canSee(viewer, target):
    if viewer == target or sameParty(viewer, target): return true
    if not target.hiddenInGrass or now < target.revealedUntil: return inRect(viewer, target)
    if chebyshev(viewer.pos, target.pos) <= 1: return true
    if viewer.tile.patchId != 0 and viewer.tile.patchId == target.tile.patchId: return true
    if viewer has reveal effect covering target.pos: return true
    return false
  ```
- `hiddenInGrass` is true when the target stands on a tall-grass tile that is not trampled. Trampled grass (another researcher's topic) should stop hiding, as in SPD and Brogue.
- Reveal triggers. Attack, cast, take damage, pick up, use item, say in chat. Set `revealedUntil = now + 2000 ms` (League's 2 s).
- Hysteresis. When a target becomes hidden, delay the remove by 300 to 500 ms so a player stepping between two grass tiles does not flicker out and in. VALORANT keeps actors relevant briefly for the same reason.
- Look-ahead on reveal. Send the add when the viewer is about to be adjacent (distance 2 and closing), so a 100 to 200 ms ping does not make a monster appear already on top of you.
- Bandwidth. Hiding saves bytes. A hidden walker produces zero move packets for viewers who cannot see it. Each hide or reveal costs one remove or add message (TFS creature add is roughly 40 to 60 bytes with outfit, estimate from `AddCreature` field list).
- Targeting. The server must refuse targeted attacks on creatures the attacker cannot see (TFS already drops `attackedCreature` when `!canSeeCreature`, see Q5). Area spells still hit by tile, like League skillshots.
- Monsters. Use the same `canSee` for monster AI so a player hiding in grass loses aggro unless adjacent. TFS monsters already use `canSeeCreature` for follow and attack targets.

---

## Q5. Tibia/TFS invisibility as the analogue

### Takeaway
TFS already has the hook (`canSeeCreature`) that gates what each client receives. But invisible players are still sent to other players, with a blank outfit, so position, movement and name leak. For grass hiding in Asterion, extend `canSeeCreature` with the Q4 rule and let it apply to players too.

### Cited findings (otland/forgottenserver master)
- `Creature::canSee(myPos, pos, rx, ry)` is a rectangle check plus floor rules (above ground sees floors 7 to 0, underground sees plus or minus 2 floors). No line of sight. https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
- `Map::maxViewportX = 11`, `maxViewportY = 11`, `maxClientViewportX = 8`, `maxClientViewportY = 6` (client view is 17x13 tiles plus a margin). https://github.com/otland/forgottenserver/blob/master/src/map.h
- `Creature::canSeeCreature` returns false for ghost mode or `isInvisible()` unless the viewer can see invisibility. `isInvisible()` means the creature has `CONDITION_INVISIBLE`. https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
- `Player::canSeeCreature` has `if (!creature->getPlayer() && ... creature->isInvisible()) return false`. So players always see invisible players. Only invisible monsters are filtered. https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- `ProtocolGame::AddCreature` sends an empty `Outfit_t` when the creature is invisible or in ghost mode, and real outfit otherwise. https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- `ProtocolGame::canSee(creature)` and the tile description loop skip creatures that fail `player->canSeeCreature`, so a false there really stops the data. `Game::internalCreatureChangeOutfit` skips broadcasting outfit changes while invisible. https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp and https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- Creatures drop their follow or attack target when `!canSeeCreature(target)`. https://github.com/otland/forgottenserver/blob/master/src/creature.cpp (lines near `followCreature && master != followCreature && !canSeeCreature`)

### Inferences
- Cheating risk with the TFS model. A modded client can draw the blank-outfit creature, read its name from the creature packet, or render it with a different look. Any rule that relies on the client to hide something is a maphack waiting to happen. Grass hiding must use the "not sent" path, which ghost mode already uses for GMs.
- One subtle leak. TFS sends spectators of a tile when an item is moved or an effect plays there. A grass "rustle" magic effect or a footstep sound sent to all spectators on every hidden step reveals the path. Send rustle only to viewers that pass `canSee`, or send it rate-limited with a random delay as a deliberate soft tell.
- Another leak. Creature IDs in the known-creature cache (`checkCreatureAsKnown`) persist across hide and reveal. A client can notice that ID 0x1234 "came back" at a new tile. Fine for gameplay, but don't issue a new ID per reveal or the cache churns.
- Server cost estimate. The Q4 check is a few integer compares per spectator pair. TFS already iterates spectators per move (`map.getSpectators`), so adding the check costs nothing measurable compared with sending the packet. Precompute `patchId` per tile at map load (flood fill, uint16, 2 bytes per tile; a 2048x2048 map is 8 MB, so store it only for tall-grass areas in a hash map instead).

---

## Q6. Other references (lighter)

### Cited findings
- Pokémon Emerald encounter math, see Q3 anti-patterns. Max rate constant `MAX_ENCOUNTER_RATE 2880`, rate multiplied by 16 and doubled by some abilities or items, capped at 2880. https://github.com/pret/pokeemerald/blob/master/src/wild_encounter.c
- Cataclysm DDA grazing and cutting ladder (tall to long to short to grazed), see Q1. Coverage 50 on tall grass.

### Gaps
- Dota 2 tree vision numbers (Liquipedia 403, Fandom 402). Known from play that trees block ground vision and flying vision ignores them, but not cited here.
- DCSS and Hyper Light Drifter, Metal Gear grass crawl, Hitman, Zelda hiding not researched within the tool budget.
- No measured client cost for dithered vs alpha hidden-player shaders. Both are one texture sample plus a compare, so the cost difference should be negligible (estimate).
- CDDA `coverage` semantics assumed to be percent chance to block ranged attacks, not verified in the docs.
- I did not confirm in pokeemerald which layer actually covers the lower half (BG top layer of the metatile vs the field-effect sprite). The subsprite priority split and the per-object grass sprite are confirmed in code.

---

## Recommendations for Asterion (inference)
1. Rule. Hidden in untrampled tall grass. Visible to same-patch, adjacent (Chebyshev 1), party, or reveal effects. Attack or cast reveals for 2000 ms. 300 to 500 ms hide delay.
2. Server. Put the rule in `canSeeCreature` for players and monsters, so hidden creatures are never sent. Send rustle events only to viewers who pass the check.
3. Client art. Grass-front overlay per tall-grass tile (bottom 10 to 14 px of 32), drawn by y-sort. Owner and allies get a 50% world-locked dither or a dark 2-colour palette swap plus a team outline. Items and name plates always draw above grass.
4. Single-player RPG. Use the SPD rule instead. Tall grass blocks LOS and tramples on step, regrows by a Brogue-style 1% per turn roll.

## Sources
- https://wiki.leagueoflegends.com/en-us/Brush
- https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
- https://technology.riotgames.com/node/108
- https://www.riotgames.com/en/news/story-fog-and-war
- https://technology.riotgames.com/node/39
- https://technology.riotgames.com/node/107
- https://www.gamepressure.com/brawl-stars/how-can-i-hide/zfc615
- https://brawlstars.fandom.com/wiki/Sapphire_Plains
- https://trophycoach.com/brawl-stars/guides/how-to-counter-leon
- https://gamewith.net/pokemon-unite/article/show/29470
- https://bulbapedia.bulbagarden.net/wiki/Long_grass
- https://www.thegamer.com/pokemon-unite-useful-hidden-map-mechanics/
- https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules
- https://www.gamedeveloper.com/design/reinventing-stealth-in-2d-with-i-mark-of-the-ninja-i-
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Terrain.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Level.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/mechanics/ShadowCaster.java
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/armor/glyphs/Camouflage.java
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Rogue.h
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-flora.json
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON/JSON_FLAGS.md
- https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h
- https://github.com/pret/pokeemerald/blob/master/src/wild_encounter.c
- https://github.com/pret/pokeemerald/blob/master/src/data/wild_encounters.json
- https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
- https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- https://github.com/otland/forgottenserver/blob/master/src/map.h
