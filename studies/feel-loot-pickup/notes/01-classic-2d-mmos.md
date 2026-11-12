# 01. Classic 2D MMOs: loot and pickup, from source code

Researcher angle: Tibia (TFS, Canary), OSRS (wiki + RuneLite ground items), Ragnarok Online (rAthena), MapleStory (Cosmic v83 emulator), Ultima Online (ServUO), Realm of the Mad God, Albion. Margonem and Medivia were not reached (see Gaps).

Source snapshots read on 2026-11-11 (sparse clones in `notes/scratch-01/`):

| Repo | Commit | Date |
|---|---|---|
| otland/forgottenserver (TFS) | 1561fa91d0 | 2026-09-29 |
| opentibiabr/canary | 666a60f6fe | 2026-11-05 |
| rathena/rathena | 1ca3e77009 | 2026-11-10 |
| runelite/runelite | bb0fa42b3d | 2026-11-10 |
| P0nk/Cosmic (MapleStory v83) | fec53bc771 | 2026-02-03 |
| ServUO/ServUO | d76bf4443c | 2026-08-04 |

Emulator caveat. TFS, Canary, rAthena, Cosmic and ServUO are fan reimplementations. Their numbers are the community's best match to the official servers, not leaked official code. rAthena and ServUO comment where they follow "official" behaviour; I flag that below.

---

## Q1. Corpse-as-container vs ground spill: how each game reveals loot

### Takeaway
Two families. Tibia and UO put loot inside a corpse container that the player opens. RO, MapleStory and OSRS spill items as separate ground objects in a fixed pattern around the death tile. RotMG is in between: one bag object whose colour tells you the best item inside. For a 32 px top-down MMO with crowds, the corpse container is the cheapest to render and network (one object per kill), and a coloured bag or corpse highlight recovers most of the clarity that a ground spill gives.

### Cited findings

Tibia (Canary / TFS)
- Death order in Canary `Creature::onDeath -> dropCorpse`: blood splash added, then corpse added to the tile, then `dropLoot()` fills it, then `startDecaying()`, then the "Loot of X" message goes out. All in one server step, so the corpse arrives already full. [canary src/creatures/creature.cpp L777-L800](https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp)
- Loot message format: `"Loot of {}: {}"` + optional suffix + ".". Clients newer than protocol 1200 get item names wrapped as `{itemId|name}` so the client can colour them. [canary creature.cpp L789-L795](https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp), [container.cpp L295-L312](https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp)
- Corpse loot highlight. Canary sends a per-player `ContainerSpecial_t::LootHighlight` byte when a corpse is non-empty and the viewer may open it. It clears when the corpse empties or quick loot takes everything the filter wants. Only viewers allowed to loot see it. [container.cpp L1191, L1334](https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp), [protocolgame.cpp L819](https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp)
- `sortLootByChance = false` by default. The config comment says it exists so rare items are placed first when "the corpse size is less than the total of loots". That confirms overflow drops are lost when a corpse container is full. [canary config.lua.dist L557-L562](https://github.com/opentibiabr/canary/blob/main/config.lua.dist)

Ragnarok Online (rAthena)
- Drops appear 500 ms after death when `delay_battle_damage` is off (0 ms when on). [rathena src/map/mob.cpp L3428-L3434](https://github.com/rathena/rathena/blob/master/src/map/mob.cpp)
- Scatter pattern. First item lands on the death cell, then the next items cycle SE, W, N, SE, W, N. Items stolen by a looter mob start at N. Comment in code says "loops between three locations". [mob.cpp L2531-L2553](https://github.com/rathena/rathena/blob/master/src/map/mob.cpp)
- If the target cell is blocked, the item goes to a free cell within 1 cell (2 with flag). [map.cpp L2018-L2025](https://github.com/rathena/rathena/blob/master/src/map/map.cpp)
- Sub-cell jitter: `subx = rnd(1,4)*3`, `suby = rnd(1,4)*3`, so 3, 6, 9 or 12 on RO's 16-step sub-cell grid. Several items on one cell do not overlap exactly. [map.cpp L2062-L2063](https://github.com/rathena/rathena/blob/master/src/map/map.cpp)

MapleStory (Cosmic)
- Items spread horizontally from the mob x: alternate right/left with 25 px steps. Integer maths gives offsets 0, 0, +25, -25, +50, -50 for drops 0-5, so the first two drops share the mob x. "Explosive reward" mobs use 40 px steps. [Cosmic MapleMap.java L670-L674](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapleMap.java)
- Final position snaps to the nearest foothold via `calcDropPos` (binary search over platforms). The pop arc itself is drawn by the client from `dropper.getPosition()` to `dropPos` in the `dropItemFromMapObject` packet. [MapleMap.java L564-L575, L1074](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapleMap.java)
- Map cap 200 items, items expire after 180 s, expiry sweep every 10 s. [Cosmic config.yaml L316-L323](https://github.com/P0nk/Cosmic/blob/master/config.yaml)

OSRS
- Loot beams ship as four scenery models (green, red, purple, yellow; ids 43032-43035), added 19 January 2022 for RuneLite to use. The official client does not use them. [OSRS wiki: Loot beam](https://oldschool.runescape.wiki/w/Loot_beam)

RotMG
- Bag colours by best content, priority low to high: brown (public), pink (weapon/armor T1-6), purple (T7-9), cyan (T10-12 weapons, T10-13 armour), red (top tier, soulbound), white (untiered, rarest); boosted bags outrank all. Tier ranges changed between versions; sources disagree on whether white or red is top today. [RealmEye loot bag types rev 162](https://www.realmeye.com/wiki/loot-bag-types-and-contents/162), [RealmEye loot containers](https://realmeye.com/wiki/loot-containers)
- Each bag lasts 60 s; adding or removing items does not reset it. [RealmEye rev 162](https://www.realmeye.com/wiki/loot-bag-types-and-contents/162)

### Inferences
- RO's fixed SE/W/N cycle is a deliberate readability choice. Three neighbour cells plus the centre keep a 4-item drop inside a 2x2 tile area, and the 3 px sub-cell jitter stops a stack of items reading as one. On a 32 px grid this maps to about 6/12/18/24 px offsets inside the tile.
- RotMG's bag colour is the cheapest rarity signal possible: one sprite swap, zero labels. It fits a server that sends one entity per kill.

### Gaps
- No frame-level numbers for the MapleStory pop arc (height, ms). It lives in the client, not the server. The `mod` byte in the drop packet selects animated vs static spawn.
- OTClient corpse highlight rendering (colour, pulse) not read.

---

## Q2. Ownership and protection timers

### Takeaway
Every classic 2D MMO uses a short private window, then free for all. The windows cluster at 3-15 s for normal mobs and 10-60 s for bosses or OSRS. The owner is almost always top damage, with party members sharing the owner's rights. Tibia's window is not a timer at all: it ends when the corpse rots to its next stage.

### Cited findings

| Game | Owner | Private window | Then |
|---|---|---|---|
| Tibia (TFS/Canary) | Most-damage player, or master of the most-damage summon | Until the corpse's first decay transform (owner attribute removed in `Item::transform`) | Anyone can open |
| RO (rAthena) | Top 3 damage dealers, first attacker gets +30% damage bonus for ranking | 1st only 3000 ms, then 1st+2nd 2000 ms, then 1st-3rd 2000 ms (7 s total). Boss/MVP: 10000 + 10000 + 2000 ms (22 s) | Anyone |
| MapleStory (Cosmic) | Killer, or killer's party (drop type 1) | 15 s | FFA. Drop types 2 (FFA mob) and 3 (explosive) are FFA from the start |
| OSRS | Player who did most damage | 60 s (100 ticks) invisible to others | Visible and takeable if tradeable. Untradeables never shown to others |
| UO (ServUO) | Damage-ranked aggressors get instanced items | 3 min `InstancedCorpseTime`; 2 min `MonsterLootRightSacrifice` | Corpse decays at 7 min |
| RotMG | Players above a per-item damage threshold (fraction of max HP) | Soulbound bags are only ever visible to you | Bag despawns at 60 s |
| Albion | Most damage (forum, unconfirmed) | Black zone player corpses: protected, then open after 90 s (2021 patch) | Anyone |

Sources per row:
- Tibia owner set: [TFS monster.cpp L1878-L1893](https://github.com/otland/forgottenserver/blob/master/src/monster.cpp). Owner cleared on decay transform: [TFS item.cpp L248](https://github.com/otland/forgottenserver/blob/master/src/item.cpp). Open check returns "You are not the owner": [TFS actions.cpp L219-L222](https://github.com/otland/forgottenserver/blob/master/src/actions.cpp). Party rule: [TFS party.cpp L466-L471](https://github.com/otland/forgottenserver/blob/master/src/party.cpp). Combat juice study already gives rat and dragon first stage as 300 s.
- RO: [rathena conf/battle/drops.conf L14-L52](https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf), timers built in [map.cpp L2040-L2058](https://github.com/rathena/rathena/blob/master/src/map/map.cpp). The conf comments say the 30% first-attacker bonus is "Officially" so.
- MapleStory: [Cosmic MapItem.java hasExpiredOwnershipTime, canBePickedBy](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java), drop type choice [MapleMap.java L739](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapleMap.java).
- OSRS: [OSRS wiki Drops](https://oldschool.runescape.wiki/w/Drops) ("invisible to other players for the first 100 game ticks"), [OSRS wiki Items](https://oldschool.runescape.wiki/w/Items) (table: visible after 60 s).
- UO: [ServUO Corpse.cs L118-L132, L421](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs).
- RotMG threshold: [RealmEye forum loot guide](https://www.realmeye.com/forum/t/guide-to-loot-and-drop-rates/60740) (0.1 threshold on 1000 HP = 100 damage; extra damage past threshold adds nothing).
- Albion: [mmos.com Into the Fray patch 4](https://mmos.com/news/albion-online-into-the-fray-patch-4), [Steam forum, mob reward owner](https://steamcommunity.com/app/761890/discussions/0/3825284575366298273).

Party details from source
- Tibia: anyone in the owner's party, or the leader, may open. Canary also sends the "Loot of X" line to every party member, not only the owner. [canary player.cpp L12847-L12860](https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp)
- RO: with party item share on, members inherit the rank of their best-ranked online party member. Only if that top attacker is still online. [rathena pc.cpp pc_takeitem](https://github.com/rathena/rathena/blob/master/src/map/pc.cpp)
- MapleStory: party ownership is sticky. If a party member of the owner picks up a solo drop, the item's party id is set to that party. [MapItem.java canBePickedBy](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java)
- UO: stackables split evenly across aggressors, remainder and unstackables assigned randomly. Cursed items skip assignment. [Corpse.cs L226-L300](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs)

### Inferences
- Tibia's "owner until first rot stage" is long (minutes) because Tibia corpses are the loot window. It works in Tibia because corpses are opened by click and kill stealing is solved by top damage. For Asterion a separate, shorter owner timer (RO and MapleStory sit at 7-22 s and 15 s) would let a corpse stay visible for minutes while loot becomes public sooner. That keeps "meaningful death" corpses on screen without locking loot.
- RO's three-tier cascade is the only design that rewards the 2nd and 3rd damage dealers with a head start. Cheap to implement (three ticks per item) and it softens kill-steal fights in crowded spawns.
- UO's instanced split is the ancestor of personal loot. It avoids races at the cost of the corpse looking different per viewer.

### Gaps
- Official Tibia (CipSoft) owner duration not verified against official sources; only emulator code.
- Albion mob-drop ownership window not found in an official source.

---

## Q3. Pickup interaction, reach, quick loot, auto loot

### Takeaway
Tibia's modern answer to corpse-clicking fatigue is quick loot: one action loots every allowed corpse in the 3x3 tiles around you into category containers, with clear partial-success messages. RO and MapleStory keep per-item clicks with a 2-cell reach, and solve volume with pets and autoloot. Pickup reach is 1 tile (Tibia corpse) to 2 cells (RO).

### Cited findings
- Canary quick loot on a far corpse auto-walks to within 1 tile, then retries after 300 ms. [canary game.cpp playerQuickLoot ~L6444-L6460](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- Loot around: scans the 3x3 tiles around the player (`x,y in -1..1`), up to `quickLootMaxCorpses = 30` corpses. [game.cpp ~L6788-L6800](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp), [config.lua.dist L318](https://github.com/opentibiabr/canary/blob/main/config.lua.dist)
- Filters: whitelist ("listed") or skip list (`QUICKLOOTFILTER_SKIPPEDLOOT`). Items route to per-category "managed" containers (`internalCollectManagedItems`). Gold and items are counted separately. [game.cpp L3596-L3650](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- Result messages distinguish every case: "You looted 120 gold", "You looted the complete X gold and all dropped items", "...but you only looted some of the items", "...but none of the dropped gold". Bag-full: "Attention! The container for {category} is full." Overweight: "...too heavy for you to carry." [game.cpp L3676-L3720, ~L6520](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- Repeat warnings are throttled. A full-bag warning shows as a highlighted message only if the last one was more than 15000 ms ago, otherwise as a quieter line. [game.cpp ~L6527](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- Auto loot on kill (`autoLoot = false` by default, VIP option exists) runs only when the corpse is reachable by path within 1 tile of the player. [creature.cpp L797-L810](https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp), [config.lua.dist L307, L645](https://github.com/opentibiabr/canary/blob/main/config.lua.dist)
- Optional `autoBank`: dropped coins go straight to the bank. Loot pouch cap 2000 items. [config.lua.dist L289-L317](https://github.com/opentibiabr/canary/blob/main/config.lua.dist)
- RO pickup reach: 2 cells (`check_distance_bl(fitem, sd, 2)`), unless using the Greed skill. [rathena pc.cpp pc_takeitem](https://github.com/rathena/rathena/blob/master/src/map/pc.cpp). `item_auto_get: no` by default, autoloot has its own distance check `AUTOLOOT_DISTANCE`. [drops.conf L11](https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf), [mob.cpp L2598](https://github.com/rathena/rathena/blob/master/src/map/mob.cpp)
- Item stacks: Canary default `stackSize = 100`. [canary items.hpp L335](https://github.com/opentibiabr/canary/blob/main/src/items/items.hpp)

### Inferences
- Quick loot's 3x3 radius matches Tibia melee range. For Asterion, a "loot around me" key over the 8 neighbours plus own tile covers the usual pile of 3-6 corpses in a box hunt without a magnet effect.
- The message taxonomy is the best part. It tells the player exactly what was left behind, which matters more than animation when the server rejects part of a loot.

### Gaps
- Tibia official quick loot timings and UI (OTClient side) not read.
- MapleStory pet loot range and interval: not in the files I pulled.

---

## Q4. Ground item limits, despawn and decluttering

### Cited findings
- OSRS tradeable drops: invisible to others 60 s, despawn at 3 min total per the Items page. The Drops page says tradeable drops last 200 ticks (120 s) and untradeables 300 ticks (180 s). The two wiki pages conflict. [Items](https://oldschool.runescape.wiki/w/Items), [Drops](https://oldschool.runescape.wiki/w/Drops)
- OSRS cap: about 129 tradeable stacks per 8x8 chunk. Past that, new drops replace the lowest Grand Exchange value items first; stacks count by total value. Mod Ash tweets cited on the wiki. Instances often use 180 min despawn. Wilderness drops are public at once. [Items](https://oldschool.runescape.wiki/w/Items)
- MapleStory: 200 items per map, 180 s expiry. [Cosmic config.yaml](https://github.com/P0nk/Cosmic/blob/master/config.yaml)
- RO: floor items vanish after 60000 ms. [drops.conf L14](https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf)
- Tibia/TFS: per-tile hard limit is 65535 items (`items->size() >= 0xFFFF`), and corpse drops bypass normal limits with `FLAG_NOLIMIT`. In practice decay is the only cleanup. [TFS tile.cpp L618](https://github.com/otland/forgottenserver/blob/master/src/tile.cpp), [creature.cpp L566](https://github.com/otland/forgottenserver/blob/master/src/creature.cpp)
- UO corpse decay 7 min. [Corpse.cs L421](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs)

### RuneLite ground items plugin (defaults from source)
- Value tiers by price: low 20,000 gp `#66B2FF`, medium 100,000 `#99FF99`, high 1,000,000 `#FF9600`, insane 10,000,000 `#FF66B2`. Default text white, highlighted list `#AA00FF`, hidden grey. [GroundItemsConfig.java L240-L363](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsConfig.java)
- Labels on the same tile stack upward 15 px each (`STRING_GAP = 15`), drawn 20 units above the ground. Labels are culled past 2500 local units (about 19.5 tiles at 128 units/tile). [GroundItemsOverlay.java L66-L73, L284-L289](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsOverlay.java)
- Despawn timer modes OFF (default), PIE, TICKS, SECONDS. Pie is 10 px. Green while private, yellow once public. Seconds format ` - %.1f`; ticks are ms/600. [GroundItemsOverlay.java L74-L76, L355-L367, L418-L438](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsOverlay.java), [DespawnTimerMode.java](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/config/DespawnTimerMode.java)
- The client API now exposes per-item `despawnTime`, `visibleTime`, `ownership` (self, other, group) and `isPrivate`. The game server sends the timers; the plugin does not guess them. [GroundItemsPlugin.java L395-L418](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsPlugin.java)
- Loot beams off by default; when on, shown for tier HIGH and up, style MODERN (model 43330, recoloured). [GroundItemsConfig.java](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsConfig.java), [Lootbeam.java L50-L75](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/Lootbeam.java)
- Other defaults: hide-under-value 0, double-tap hotkey 250 ms, collapse duplicate entries off. [GroundItemsConfig.java](https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsConfig.java)

### Inferences
- The 15 px label step on a 32 px tile means two labels per tile height. Asterion should cap visible labels per tile (show "+3 more") or stack labels only on hover/hotkey, as RuneLite does with its hold-to-show hotkey.
- OSRS's value-ranked chunk cap is a good model for a server-side ground cap: evict cheapest first, never a rare item.
- Sending `visibleAt` and `despawnAt` timestamps with each ground item costs 8 bytes and lets any client draw the green/yellow pie with no extra packets.

---

## Q5. PvP corpse looting and griefing rules

### Cited findings
- UO: looting a corpse whose notoriety is innocent flags the looter criminal (`CriminalAction`), unless a party member with `CanLoot` set. Lifting or using any item triggers it. Criminal status lasts 2 min by default. [Corpse.cs L1002-L1105](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs), [ServUO Mobile.cs L1962](https://github.com/ServUO/ServUO/blob/master/Server/Mobile.cs)
- UO records every looter on the corpse (`m_Looters`), and anyone who lifts an item is revealed if hidden. [Corpse.cs L1077-L1105](https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs)
- OSRS Wilderness: drops public immediately (anti-safe-drop), except food and potions which are never shown to others there. [Items](https://oldschool.runescape.wiki/w/Items)
- Albion black zone: player loot opens to everyone after 90 s (2021). [mmos.com](https://mmos.com/news/albion-online-into-the-fray-patch-4), [MassivelyOP](https://massivelyop.com/?p=400169)
- Tibia/Canary: player corpses (male/female ids) skip the "Loot of" message. [creature.cpp L782](https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp)

### Inferences
- UO's criminal flag turns ninja looting into a social signal visible to everyone (grey name) instead of a hard block. That fits "meaningful death": looting is allowed but costs you.

---

## Q6. Netcode and races

### Cited findings
- MapleStory (Cosmic) puts a lock on each map item (`lockItem`/`unlockItem`) and a `pickedUp` flag, so the second of two simultaneous pickups sees `pickedUp = true` and fails. [MapItem.java](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java)
- Canary takes a per-player lock (`Player::PlayerLock`) before quick loot and re-checks owner rights on every corpse at execution time, not at request time. [game.cpp ~L6466-L6505](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- Canary quick loot requests during the action cooldown are queued as a delayed task (`getNextActionTime`), not rejected. [game.cpp ~L6433-L6442](https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp)
- MapleStory client owner id: the server sends the party id when one exists, else the char id (`getClientsideOwnerId`), so the client can grey out items you cannot take. A comment credits a fix for "an issue with collecting party items". [MapItem.java L115-L120](https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java)

### Inferences
- Queueing rather than rejecting a spam-click hides cooldown latency, which matches the combat juice finding that spam-clicked corpses must not feel laggy.
- Sending owner info to the client lets it predict "not yours" locally, so the only server rejection a player sees is a lost race.

---

## What transfers to Asterion (32 px, top-down, server-authoritative)

1. Corpse container plus per-viewer highlight (Canary LootHighlight). One entity per kill, and the highlight answers "is this mine and is anything left".
2. Separate owner timer from corpse decay. Take 10 s normal, 20-30 s boss as a starting point (RO 7/22 s, MapleStory 15 s). Party shares rights.
3. Optional RO-style 3-rank cascade for 2nd/3rd damage dealers (2 s steps).
4. Quick loot over 3x3 tiles, cap 30 corpses, with Canary's partial-result messages and a 15 s throttle on "bag full" highlights.
5. Rarity read through one sprite or tint change (RotMG bag colour), plus RuneLite-style value tiers for labels. Hex starting set `#FFFFFF #66B2FF #99FF99 #FF9600 #FF66B2`.
6. Server-sent `visibleAt`/`despawnAt` per ground item, drawn as a 10 px pie: green private, yellow public.
7. Ground cap per area with cheapest-first eviction (OSRS 129 per 8x8 chunk).
8. If items spill to the ground, use RO's fixed centre, SE, W, N cycle with 3-12 px jitter.
9. PvP corpse looting allowed but flags the looter for 2 min (UO).

## Ratings (author judgement, 1-5)

| Technique | Clarity | Delight | MMO fit | Fairness | Speed |
|---|---|---|---|---|---|
| Tibia corpse + loot message + quick loot | 4 | 2 | 5 | 4 | 5 |
| RO ground spill + 3-tier priority | 4 | 3 | 3 | 5 | 3 |
| MapleStory arc + 15 s owner | 4 | 5 | 3 | 4 | 3 |
| OSRS private 60 s + RuneLite tiers/pie | 5 | 3 | 4 | 4 | 3 |
| RotMG coloured soulbound bags | 5 | 4 | 5 | 5 | 5 |
| UO instanced corpse + criminal looting | 3 | 2 | 4 | 4 | 4 |

## How players report the feel (limited, see gaps)
- RotMG: bag colour is the drop moment; "purple bag" and white bag are community slang, and on the OSRS side "purple" means a raid unique because of the purple beam. [OSRS wiki slang dictionary/P](https://oldschool.runescape.wiki/w/Slang_dictionary/P)
- RotMG players debate whether overdamage helps; the RealmEye guide says it does not past the threshold. [RealmEye forum](https://www.realmeye.com/forum/t/overdamage-is-a-myth/61146/13)

## Gaps (honest)
- Margonem and Medivia: not researched. Out of budget.
- Albion: only patch-note level, no corpse despawn timer.
- RotMG: RealmEye pages blocked to direct fetch; numbers from search snippets of revisions 162 and 89.
- No measured rendering or bandwidth costs in this file.
- MapleStory pop arc timing and pet loot interval: client-side, not found.
- OSRS 2 vs 3 minute tradeable despawn: wiki pages disagree.

## See it in action
- OSRS loot beams gallery: https://oldschool.runescape.wiki/w/Loot_beam
- RuneLite ground items plugin source: https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems
- RotMG bag types: https://www.realmeye.com/wiki/loot-bag-types-and-contents/162

## Sources
- https://github.com/otland/forgottenserver (src/monster.cpp, item.cpp, actions.cpp, party.cpp, player.cpp, tile.cpp, creature.cpp)
- https://github.com/opentibiabr/canary (config.lua.dist, src/creatures/creature.cpp, src/game/game.cpp, src/items/containers/container.cpp, src/items/items.hpp, src/creatures/players/player.cpp, src/server/network/protocol/protocolgame.cpp)
- https://github.com/rathena/rathena (conf/battle/drops.conf, src/map/map.cpp, mob.cpp, pc.cpp)
- https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems
- https://github.com/P0nk/Cosmic (config.yaml, server/maps/MapleMap.java, MapItem.java)
- https://github.com/ServUO/ServUO (Scripts/Items/Corpses/Corpse.cs, Server/Mobile.cs)
- https://oldschool.runescape.wiki/w/Items
- https://oldschool.runescape.wiki/w/Drops
- https://oldschool.runescape.wiki/w/Loot_beam
- https://www.realmeye.com/wiki/loot-bag-types-and-contents/162
- https://realmeye.com/wiki/loot-containers
- https://www.realmeye.com/forum/t/guide-to-loot-and-drop-rates/60740
- https://mmos.com/news/albion-online-into-the-fray-patch-4
- https://massivelyop.com/?p=400169
- https://steamcommunity.com/app/761890/discussions/0/3825284575366298273
