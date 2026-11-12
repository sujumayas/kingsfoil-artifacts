# 06. Netcode and crowds for loot

Researcher angle: server-authoritative pickup, races, prediction and rejection, duplication bugs, area of interest for ground items, packet sizes, item caps, merging, despawn, crowds at a boss corpse, bandwidth.

Method. I cloned TFS (otland/forgottenserver, master), Canary (opentibiabr/canary, main), OTClient (edubart/otclient, master) and RuneLite (master) on 2026-11-11 and read the code. Line numbers below refer to those checkouts. OSRS and Minecraft facts come from their MediaWiki `api.php` wikitext. Dupe history comes from press and forum posts, which are weaker sources and are marked as such.

Repo roots used in citations:
- TFS: https://github.com/otland/forgottenserver/blob/master/
- Canary: https://github.com/opentibiabr/canary/blob/main/
- OTClient: https://github.com/edubart/otclient/blob/master/
- RuneLite: https://github.com/runelite/runelite/blob/master/

---

## Q1. What does a server-authoritative pickup look like end to end?

### Takeaway
Tibia servers run every item move on one game-logic thread in four steps. The client sends a request naming (position, stack position, sprite id). The server re-resolves the item, checks it, moves it, then broadcasts the result. There is no client prediction at all. The client only changes the world when the server says so. Reach is 1 tile (the 3x3 ring). If the player is farther away, the server pathfinds, auto-walks and retries the move 400 ms later (TFS) or 300 ms later (Canary quick loot).

### Cited findings
- TFS `Game::playerMoveItem` (src/game.cpp around lines 892-1060) does these checks in order:
  1. Action cooldown. If `!player->canDoAction()`, the move is rescheduled for `getNextActionTime()` instead of being dropped. The cooldown is `timeBetweenActions = 200` ms, and "ex actions" (use-with) take 1000 ms (config.lua.dist lines 65-66; src/configmanager.cpp line 277).
  2. Re-resolve the thing at `fromPos`/stackpos with `internalGetThing(..., STACKPOS_MOVE)`. Missing thing returns `RETURNVALUE_NOTPOSSIBLE`.
  3. `if (item->getClientID() != spriteId)` returns NOTPOSSIBLE. This one check stops a stale click from grabbing whatever item slid into that stack slot.
  4. Movable and not a unique-id item, same floor, then reach `playerPos.isInRange(mapFromPos, 1, 1)`.
  5. Out of reach means `getPathTo`, auto-walk, then a retry task after `RANGE_MOVE_ITEM_INTERVAL = 400` ms (src/game.h line 52). If there is no path, the player gets "There is no way."
  6. Throw range and line of sight to the destination (`canThrowObjectTo`), then `internalMoveItem`.
- Corpse ownership is checked when the corpse is opened. src/actions.cpp lines 219-221 return `RETURNVALUE_YOUARENOTTHEOWNER` if `corpseOwner != 0 && !player->canOpenCorpse(corpseOwner)`. `canOpenCorpse` is "owner, or same party as owner" (src/player.cpp line 694, src/party.cpp line 466). The owner is set to the top damage dealer, or that creature's master for summons (src/monster.cpp lines 1884-1888). It is cleared when the corpse changes to its next decay stage (`removeAttribute(ITEM_ATTRIBUTE_CORPSEOWNER)` in `Item::startDecaying`/transform path, src/item.cpp line 248). So the owner window equals the first rot stage.
- Canary quick loot (`Game::playerQuickLoot`, src/game/game.cpp lines 6440-6560) uses the same pattern. Reach is `Position::areInRange<1, 1, 0>`, else auto-walk and retry after 300 ms. It re-checks `canOpenCorpse` and replies with a chat line built from the result, "You looted N gold." / "Attention! The loot you are trying to pick up is too heavy for you to carry." The big highlight message is rate-limited to once per 15000 ms (`lastQuickLootNotification + 15000`), and later ones go to a smaller channel.
- Broadcast. Ground changes are sent only to players who `canSee(pos)`. Add is opcode 0x6A, update 0x6B, remove 0x6C (TFS src/protocolgame.cpp lines 2609-2645, 3604-3613). Container changes (an open corpse) are sent to spectators within 1 tile of the container: `getSpectators(spectators, getPosition(), false, true, 1, 1, 1, 1)` (src/container.cpp lines 191, 209, 227).
- OTClient applies 0x6C by looking up the thing at (pos, stackpos) and removing it (src/client/protocolgameparse.cpp lines 855-865). It has no rollback or predicted state.

### Inferences
- The "request, re-resolve, verify sprite, check reach, move, broadcast" order is a good template for Asterion. Keep the sprite-id check, but address items by a server item id, not by stack slot (see Q4).
- Reach 1 plus "server walks you there, then retries" makes a click from range feel responsive without trusting the client. The retry delay sets the pace. 300 to 400 ms after arrival is what both Tibia servers use.

### Gaps
- I did not measure the real end-to-end latency of a Tibia pickup. It is one RTT plus up to 10 ms output batching (Q6) plus the 200 ms action gate if the player clicked recently.

---

## Q2. Two players grab the same item. Who wins and what does the loser see?

### Takeaway
Every server I checked resolves races by processing order on a single logic thread, not by timestamps. Tibia works first packet first. The second request finds a different item (or nothing) at that slot and gets "Sorry, not possible." OSRS batches actions into 600 ms ticks and processes players in PID order. The lower PID wins a same-tick grab, and PIDs reshuffle every 60 to 90 s so nobody keeps the edge.

### Cited findings
- TFS: the dispatcher is one thread (`class Dispatcher : public ThreadHolder<Dispatcher>`, src/tasks.h line 47). All `playerMoveItem` calls run there in arrival order. The loser fails at the `internalGetThing` or `getClientID() != spriteId` check and gets `RETURNVALUE_NOTPOSSIBLE` (src/game.cpp lines 917-930).
- Canary keeps game logic on its dispatcher but adds a thread pool for other work (src/game/scheduling/dispatcher.hpp line 112). Quick loot also takes a per-player lock, `Player::PlayerLock lock(player)` (src/game/game.cpp around line 6474).
- OSRS: one game tick is 0.6 s. "Each action registered within one tick will start to take place by the beginning of the next tick." Ticks run 0.606 to 0.618 s on busy worlds (https://oldschool.runescape.wiki/w/Game_tick).
- OSRS PID: lower PIDs are processed first, and this "affects which player gets an item if two or more players pick it up at the same time." PID re-randomises every 100 to 150 ticks (60 to 90 s), and every 40 to 60 ticks on PvP and Bounty Hunter worlds (https://oldschool.runescape.wiki/w/Player_identification_number).

### Inferences
- For Asterion, pick one rule and make it visible. Option A is "first request wins" (Tibia). It rewards low ping, which hurts web and mobile players. Option B is tick batching with a fair, rotating order (OSRS). A 100 ms collect window with a random or rotating tie-break removes most of the ping advantage and adds at most 100 ms to every pickup.
- Ownership timers (topic 3) remove most races before they start. Only free-for-all items can race.

### Gaps
- No public data on how often races happen in Tibia or OSRS.

---

## Q3. Client prediction of a pickup, and how a rejection looks

### Takeaway
Tibia and OSRS do not predict pickups. They wait for the server, and pickups feel "slow but honest". Path of Exile shipped a predictive model, and its desync complaints ended in a lockstep mode in 2.0.0 (2015). A safe middle path for Asterion is cosmetic prediction only. Play the press feedback (sound, a small hop of the sprite) at once. Move the item to the bag only on server confirm. On rejection, drop the item back with a short shake and a reason line.

### Cited findings
- OTClient has no predicted state for items. It only applies server packets, for example `parseTileRemoveThing` (src/client/protocolgameparse.cpp lines 855-865).
- TFS reports every failure with `player->sendCancelMessage(ReturnValue)`, which shows as a status line such as "Sorry, not possible." or "You are not the owner." (src/game.cpp lines 920-1000; src/actions.cpp line 221).
- Path of Exile: predictive mode applies actions on the client right away and predicts the results. Lockstep requires server confirmation for every action. Auto mode switches at about 150 ms ping (https://poewiki.net/wiki/Desync). Wilson called desync "a game-killing problem" (https://pcgamer.com/the-making-of-path-of-exile). GGG staff wrote that lockstep removes desync in theory, but only if gameplay code is bug-free (https://ru.pathofexile.com/forum/view-thread/1262596).
- RuneLite reads per-item `ownership`, `despawnTime` and `visibleTime` from the client (GroundItemsPlugin.java lines 402-418), so OSRS sends the timers with the item. The rsprot `ObjAdd` model lists `timeUntilPublic`, `timeUntilDespawn` and `ownershipType` (0 none, 1 self, 2 other, 3 group ironman) (https://github.com/blurite/rsprot, ObjAdd.kt).

### Inferences
- A full pickup prediction that fails is worse than none. The item vanishes into the bag and then pops back out, which reads like a dupe or a bug. Cosmetic-only prediction keeps the click snappy (0 ms feedback) and keeps truth on the server.
- Sending ownership and timers with the item (OSRS style) lets the client grey out items you cannot take. That prevents most rejections before the click.

### Gaps
- No measured data on rejection rates or player reaction to rejections.

---

## Q4. Item duplication. Why it happens and how to design it out

### Takeaway
Most public MMO dupes share one root cause. Two stores that must change together get saved at different times, and a crash, disconnect or lag spike lands in between. TFS and Canary store items without a persistent unique id, so the server cannot detect a copy afterward. Asterion should give every non-stackable item a GUID. It should make every move one database transaction that touches both sides, and it should never save "source" and "destination" in separate jobs.

### Cited findings
- TFS schema `player_items` keys rows by (player_id, pid, sid) with `itemtype`, `count` and an `attributes` blob. It has no item GUID column (schema.sql lines 320-329).
- TFS wraps a player save in one `DBTransaction` (src/iologindata.cpp line 737), and house items in separate transactions (src/iomapserialize.cpp lines 57, 287, 362). Player and house are separate save jobs.
- Canary saves on an interval. `toggleSaveInterval = true`, `saveIntervalType = "hour"`, `saveIntervalTime = 1` (config.lua.dist lines 359-362).
- OTLand forum reports (community, unverified): moving an item from a house into the inventory and then crashing the server before both sides save leaves it in both places. The same is reported for depot items. The suggested fix is to save houses on every item move (https://otland.net/threads/urgent-clone-items-tfs-1-2.283122/post-2710745, https://otland.net/threads/ppl-cloning-items.134922/).
- Diablo II realms: dupes paired lag with a timed server crash so some characters saved and others did not (forum archive https://www.battleforums.com/threads/the-duping-archive-old-new-private.114293). Blizzard said realms "now scan characters for duplicate items" and delete extras (https://diablo2.diablowiki.net/Blizzard_vs._Hacked_Items). In a Q&A Blizzard said there was generally "no way to tell if an item is a dupe" (https://gamespy-archives.quaddicted.com/sites/www.planetdiablo.com/features/articles/dupeqa/index.html).
- New World, Nov 2021: Amazon disabled all wealth transfers (trade, guild treasury, trading post) over a gold dupe. Reports tie it to lag and a forced reconnect during a trade. Disabling treasuries then caused a second exploit, town projects that failed and refunded gold never spent (https://www.pcgamer.com/amazon-disables-new-world-wealth-transfers-to-fight-gold-dupe-exploit, https://www.nme.com/news/new-world-gold-cheat-fix-causes-another-gold-cheat-3086260). Trading was back by Nov 2 (https://wccftech.com/new-world-trading-temporarily-disabled-due-to-new-exploit/amp/).
- Diablo 4: Blizzard disabled trading three times in one year over dupes (https://pcgamer.com/games/rpg/blizzard-disables-trading-in-diablo-4-for-the-third-time-in-a-year-as-another-dupe-bug-wreaks-havoc-on-its-economy). Diablo III gold dupe was fixed in May 2013 with no rollback (https://www.engadget.com/2013-05-08-diablo-iii-gold-dupe-bug-fixed-with-no-rollback.html).
- Minecraft book dupe (Feb 2019): oversized written books pushed a chunk past about 1 MB so it failed to save, while player data saved. Items ended up in both the chest and the player (https://2b2t.miraheze.org/wiki/Duplication_glitch, https://forums.minecraftforge.net/topic/70018-book-duplication-bug-chunk-overload).
- WoW: I found only 2005 forum rumours of a dupe and rollback, with Blizzard calling the rollback a rumour (https://www.gosugamers.net/wow/news/2736-duping-in-world-of-warcraft). There is no solid case.

### Inferences
- Dupe recipe in one line: two stores, saved apart, a crash in between. Every case above fits that, except the client-trusting hacks.
- Design rules for Asterion:
  1. Every non-stackable item gets a 64-bit GUID minted by the server. Stacks get a GUID per stack, and splits mint new ones.
  2. Ground, corpse, bag, depot and house are all just "container ids" in one items table. A move is one `UPDATE items SET container=?, slot=? WHERE guid=? AND container=?` inside one transaction. The `AND container=?` guard makes a replayed or raced move affect 0 rows.
  3. Write-ahead log of moves, or save the item immediately on any cross-owner move (trade, house, depot, mail, player corpse loot). Batch only moves inside one player's own bags.
  4. A nightly unique-GUID check catches anything that slips through. D2 had to guess, and Asterion would know.
  5. Never refund on failure without checking that the debit happened (the New World treasury bug).

### Gaps
- No primary postmortems with code for any of these dupes. Treat the mechanisms as community reports.
- RuneScape and Tibia (CipSoft) official dupe postmortems were not found.

---

## Q5. Area of interest for ground items

### Takeaway
Tibia's area of interest is the client viewport. That is 18x14 tiles (8 tiles left of the player, 9 right, 6 up, 7 down), plus the floors above when on the surface. Items outside it are never sent. Items enter view as part of map slices when you walk and leave by being cut off at the edge. OTClient keeps at most 10 things per tile. OSRS sends ground items per 8x8 zone with ownership and timers attached.

### Cited findings
- TFS `Map::maxClientViewportX = 8`, `maxClientViewportY = 6`. The server-side spectator range is `maxViewportX/Y = 11` (src/map.h lines 159-162). The full map packet 0x64 covers `(8*2)+2 = 18` by `(6*2)+2 = 14` tiles (src/protocolgame.cpp around line 2604).
- Floors: above ground the server sends floors 7 down to 0 (8 floors). Underground it sends z-2 to z+2 (5 floors). Empty tiles are run-length skipped with `skip, 0xFF` pairs (src/protocolgame.cpp lines 858-903).
- `MAX_STACKPOS = 10` (src/game.h line 61). The tile description stops at 10 things (src/protocolgame.cpp line 825). OTClient `Tile::MAX_THINGS = 10` drops the 11th (src/client/tile.h line 60, tile.cpp lines 212-213). The server tile itself holds up to 0xFFFF items (src/tile.cpp line 618).
- Godot 4: `MultiplayerSynchronizer` has `public_visibility` (default true), `add_visibility_filter(Callable)`, `set_visibility_for(peer, bool)` and `update_visibility()`. A spawned node is "spawned and despawned based on the synchronizer's visibility options" (https://docs.godotengine.org/en/stable/classes/class_multiplayersynchronizer.html). `MultiplayerSpawner.spawn_limit` defaults to 0, no limit (https://docs.godotengine.org/en/stable/classes/class_multiplayerspawner.html).

### Inferences
- The 10-thing cap is a free crowd control. A loot pile can hold hundreds of items server-side, but each client gets the top 10, so bandwidth and draw calls per tile are bounded.
- For Godot, one MultiplayerSpawner node per ground item gives you visibility filtering for free, but it costs a scene instance plus a synchronizer per item. For hundreds of items, a single "ground items" manager node that sends compact RPCs per chunk will be cheaper. That is an estimate. I did not benchmark it.
- Web export can only use WebSocket or WebRTC peers, so TCP-like head-of-line blocking applies on the web, as it does in Tibia.

### Gaps
- I did not decode OSRS zone packets byte by byte. Only the rsprot field list was read.

---

## Q6. Packet sizes per item and bandwidth for 30 players around a boss

### Takeaway
A Tibia ground item add is 10 bytes of payload and a remove is 7. The server batches all messages for one client and flushes every 10 ms. Thirty players around one boss corpse is cheap in bandwidth. The real limits are reach (only about 8 players can stand next to a corpse) and contention for the one container. Canary avoids both for bosses with a personal reward container per participant.

### Cited findings
- 0x6A add = opcode 1 + position 5 (u16 x, u16 y, u8 z) + stackpos 1 + item (u16 client id, plus 1 count byte for stackables) = 9 or 10 bytes (src/protocolgame.cpp lines 2609-2621; src/networkmessage.cpp lines 83-133). Items with charges or duration add 5 bytes.
- 0x6C remove = 1 + 5 + 1 = 7 bytes (src/protocolgame.cpp lines 3604-3613).
- Container packets: 0x70 add (slot u16 + item), 0x71 update, 0x72 remove (src/protocolgame.cpp lines 2905-2931). 0x6E opens a container with name string and item list (lines 1903-1922).
- Frame overhead: 2-byte length + 4-byte checksum or sequence + 2-byte inner length (`INITIAL_BUFFER_POSITION = 8`), body padded to 8-byte XTEA blocks (src/networkmessage.h lines 23-38; src/protocol.cpp lines 17-20). Max message 24590 bytes (src/const.h line 7).
- Output batching: `OUTPUTMESSAGE_AUTOSEND_DELAY{10}` ms (src/outputmessage.cpp line 17).
- OSRS `ObjAdd` fields: id u16, quantity int, coord in zone, op flags, timeUntilPublic u16, timeUntilDespawn u16, ownershipType u8 (rsprot ObjAdd.kt). About 13 to 14 bytes before framing. That is my sum of field widths, not a measured wire size.
- Canary boss rewards: `corpse:registerReward()`, then each participant's score = (damage out share + damage in share + healing share) / 3, and each player with score > 0 gets `player:getReward(rewardId, true)`, a personal container, even offline (data/scripts/systems/reward_chest.lua lines 1-80). Quick loot reads from the reward container per player (src/game/game.cpp around line 6560).

### Inferences (estimates, not measured)
- **Tibia-style corpse.** Boss dies with 30 viewers. Each viewer gets creature remove (7 B) plus corpse add (10 B) plus effects, about 32 B after framing and padding. 30 x 32 B is about 1 KB total. Loot is sent only to whoever opens it. Each loot move then costs 0x72 + 0x70 to everyone with the container open within 1 tile (at most 9), plus an inventory update to the looter. That is about 20 to 40 B per viewer per move.
- **OSRS-style ground spill of 12 items.** About 12 x 15 B = 180 B per viewer, about 5.4 KB burst for 30 viewers, spread over one tick. Each pickup is one remove to each viewer, about 8 B x 30 = 240 B.
- **TCP/IP headers dominate small messages.** 40 B of IPv4 TCP header on a 16 B Tibia frame is 70% overhead. The 10 ms batching is what keeps it sane. WebSocket adds 2 to 6 B per frame on top.
- **Per-player loot instancing** (Canary reward chest, personal loot) makes the race and contention problems disappear for bosses. Bandwidth is the same, and only the picker sees the contents.
- **Physical crowding.** With reach 1, only the 8 tiles around a corpse plus the corpse tile can loot at once. In Tibia, players cannot stack on a tile outside protection zones. That is a hard cap of about 8 to 9 concurrent looters on a shared corpse.

### Gaps
- No packet capture of a real Tibia boss kill. All bandwidth numbers are arithmetic from the code.
- No size measured for the full 0x64 map packet. It depends on the map.

---

## Q7. Ground item caps, merging and despawn

### Takeaway
Caps come in three styles. Tibia sends only the top 10 per tile. OSRS caps a tile at 128 distinct items, with stacks counting as one. Minecraft merges identical stacks within a small box. Despawn timers are short in OSRS (60 s private, then 120 s public) and Minecraft (5 min). Tibia leaves non-decaying items until a map clean, which Canary runs hourly by default. Cleanup should be scheduled by expiry time, not by sweeping the whole map.

### Cited findings
- OSRS: 128 different items per tile, with coins and noted items counting as one. Tradeables appear to others after 60 s and vanish 120 s later. Untradeables vanish after 180 s. Wilderness consumables vanish after 15 s. Clue scrolls last 61 min (https://oldschool.runescape.wiki/w/Drop).
- Minecraft: stackable items merge if within a `0.5×0.25×0.5` box and the merged stack fits. They try every 40 game ticks (2 s), or every 2 ticks when moving across block boundaries. Despawn is 6000 ticks (5 min), and a merge keeps the longer timer. The pickup delay is 10 ticks (0.5 s), or 40 ticks (2 s) if thrown by a player (https://minecraft.wiki/w/Item_(entity)).
- Spigot `merge-radius.item` default is reported as 2.5 in older guides and 0.5 in newer ones. SPIGOT-5779 says Spigot added the radius to the hitbox, so the vanilla-matching value is 0.5 (https://hub.spigotmc.org/jira/browse/SPIGOT-5779, https://docs.papermc.io/paper/reference/spigot-configuration). `item-despawn-rate` default is 6000 ticks.
- TFS decay: `EVENT_DECAYINTERVAL = 250` ms with `EVENT_DECAY_BUCKETS = 4`, so each decaying item is checked about once per second (src/game.h lines 47-48).
- Canary decay: a timestamp-sorted `decayMap` with one scheduled wake-up at the earliest expiry, run on the `Maintenance` dispatcher lane (src/items/decay/decay.cpp lines 49-65, 118-152). No sweep.
- TFS map clean: iterates only `getTilesToClean()` (tiles touched since last clean), removes items where `!loadedFromMap && canRemove() && isPickupable()` and that have no unique or action id. The game goes into `GAME_STATE_MAINTAIN` during the clean (src/map.cpp lines 1025-1062; src/item.h line 902).
- Canary `toggleSaveIntervalCleanMap = true` with a 1-hour save interval (config.lua.dist lines 356-362).

### Inferences
- For Asterion, take Canary's decay design (timestamp heap, single timer) and TFS's dirty-tile list. Cleanup cost then scales with items actually dropped, not with map size.
- Merge identical stackables on the same tile at drop time (gold, arrows, potions). On a 32 px grid, "same tile" is the natural merge radius, and it removes Minecraft's per-tick proximity checks.
- Owner and despawn timers should travel in the add packet (OSRS style) so the client can draw "yours / theirs / public" and a despawn blink without extra messages.
- Hourly map cleans are a hard cut. Players see a pile vanish without warning. A per-item timer with a short blink before despawn reads better.

### Gaps
- No Tibia (CipSoft) official ground item timer found. TibiaWiki was not reachable per CONTEXT.md.

---

## Key numbers

| Item | Value | Source |
|---|---|---|
| Tibia pickup reach | 1 tile (3x3) | TFS game.cpp `isInRange(...,1,1)` |
| Walk-then-retry delay | 400 ms TFS, 300 ms Canary quick loot | TFS game.h:52, Canary game.cpp ~6455 |
| Action cooldown | 200 ms (ex-actions 1000 ms) | TFS config.lua.dist:65-66 |
| Ground add / remove payload | 10 B / 7 B | TFS protocolgame.cpp |
| Output flush | every 10 ms | TFS outputmessage.cpp:17 |
| Client viewport | 18x14 tiles, 8 floors above ground | TFS map.h, protocolgame.cpp |
| Things sent per tile | 10 | TFS game.h:61, OTClient tile.h:60 |
| OSRS tick and race rule | 600 ms, lower PID wins, reshuffled every 60-90 s | OSRS wiki |
| OSRS per-tile cap | 128 distinct items | OSRS wiki Drop |
| OSRS ground timers | 60 s private, +120 s public; 180 s untradeable | OSRS wiki Drop |
| Minecraft merge and despawn | 0.5x0.25x0.5 box, every 40 ticks; 6000 ticks | Minecraft wiki |
| Canary map clean | hourly | Canary config.lua.dist:359-362 |
| PoE auto net mode switch | about 150 ms ping | poewiki |

---

## Sources

Code (cloned 2026-11-11):
- https://github.com/otland/forgottenserver (src/game.cpp, src/game.h, src/map.h, src/map.cpp, src/protocolgame.cpp, src/networkmessage.cpp, src/networkmessage.h, src/protocol.cpp, src/outputmessage.cpp, src/actions.cpp, src/player.cpp, src/party.cpp, src/monster.cpp, src/item.cpp, src/item.h, src/container.cpp, src/tile.cpp, src/tasks.h, src/iologindata.cpp, src/iomapserialize.cpp, schema.sql, config.lua.dist)
- https://github.com/opentibiabr/canary (src/game/game.cpp, src/items/decay/decay.cpp, src/game/scheduling/dispatcher.hpp, data/scripts/systems/reward_chest.lua, config.lua.dist)
- https://github.com/edubart/otclient (src/client/protocolgameparse.cpp, src/client/tile.h, src/client/tile.cpp)
- https://github.com/runelite/runelite (runelite-client/.../plugins/grounditems/GroundItemsPlugin.java)
- https://github.com/blurite/rsprot (ObjAdd.kt)

Docs and wikis:
- https://oldschool.runescape.wiki/w/Game_tick
- https://oldschool.runescape.wiki/w/Player_identification_number
- https://oldschool.runescape.wiki/w/Drop
- https://minecraft.wiki/w/Item_(entity)
- https://hub.spigotmc.org/jira/browse/SPIGOT-5779
- https://docs.papermc.io/paper/reference/spigot-configuration
- https://docs.godotengine.org/en/stable/classes/class_multiplayersynchronizer.html
- https://docs.godotengine.org/en/stable/classes/class_multiplayerspawner.html
- https://poewiki.net/wiki/Desync

Press and forums (weaker):
- https://pcgamer.com/the-making-of-path-of-exile
- https://ru.pathofexile.com/forum/view-thread/1262596
- https://www.pcgamer.com/amazon-disables-new-world-wealth-transfers-to-fight-gold-dupe-exploit
- https://www.nme.com/news/new-world-gold-cheat-fix-causes-another-gold-cheat-3086260
- https://wccftech.com/new-world-trading-temporarily-disabled-due-to-new-exploit/amp/
- https://pcgamer.com/games/rpg/blizzard-disables-trading-in-diablo-4-for-the-third-time-in-a-year-as-another-dupe-bug-wreaks-havoc-on-its-economy
- https://www.engadget.com/2013-05-08-diablo-iii-gold-dupe-bug-fixed-with-no-rollback.html
- https://diablo2.diablowiki.net/Blizzard_vs._Hacked_Items
- https://gamespy-archives.quaddicted.com/sites/www.planetdiablo.com/features/articles/dupeqa/index.html
- https://www.battleforums.com/threads/the-duping-archive-old-new-private.114293
- https://2b2t.miraheze.org/wiki/Duplication_glitch
- https://forums.minecraftforge.net/topic/70018-book-duplication-bug-chunk-overload
- https://otland.net/threads/urgent-clone-items-tfs-1-2.283122/post-2710745
- https://otland.net/threads/ppl-cloning-items.134922/
- https://www.gosugamers.net/wow/news/2736-duping-in-world-of-warcraft
