# 03 Pickup interaction UX

Researcher angle: how an item gets from the corpse or the ground into the bag. Click-to-loot, walk-over, auto-pickup, quick loot, AoE loot, magnets, pets, bag-full, mobile, accessibility.

Tile conversions. Asterion uses 32 px tiles. Minecraft uses 1 block, Stardew uses 64 px tiles, Terraria uses 16 px tiles. I convert everything to "tiles" so numbers compare.

Canary permalinks below point to commit `666a60f` (main, 2026-11-05).
`G` = https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp

---

## Q1. What does the Tibia lineage (Canary) actually do server-side for looting?

### Takeaway
Canary has four looting levels that stack on one server function. Manual open-and-drag. Quick loot one corpse (1 click). Loot all corpses on one tile (1 click, cap 30). Loot nearby corpses in the 3x3 around the player (1 key, cap 30). On top of that an optional autoloot runs on kill with zero clicks. All of them go through the same `playerQuickLootCorpse`, so one code path enforces ownership, capacity and container routing. This is the model to copy.

### Cited findings
- Quick loot on a corpse more than 1 tile away makes the server path the player there first, then retries the loot every 300 ms until adjacent. Range check is `areInRange<1,1,0>`, so pickup reach is 1 tile, same floor. [G#L6447-L6466](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6447-L6466)
- Quick loot respects the global action cooldown. If the player is still on cooldown the request is queued as a delayed task, not dropped. [G#L6434-L6445](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6434-L6445). Default `timeBetweenActions` is 200 ms, `timeBetweenExActions` 1000 ms. [configmanager.cpp L226, L255](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/config/configmanager.cpp#L226)
- "Loot all corpses" walks the item stack of one tile and quick-loots each corpse it may open, up to `quickLootMaxCorpses`, default 30. Corpses with action or unique IDs (quest corpses) are skipped. Then it prints "You looted N corpses." [G#L6575-L6620](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6575-L6620), [config.lua.dist L318](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/config.lua.dist#L318)
- `playerLootNearby` loops x and y from -1 to 1, so the 3x3 tiles around the player, and loots every corpse the player may open, same 30 cap. Feedback strings are "No lootable corpses nearby." and "You could not loot any nearby corpses." [G#L6766-L6820](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6766-L6820), [G#L6743-L6765](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6743)
- Autoloot on kill. When a monster dies the server runs a pathfind from the player to the corpse with `maxTargetDist = 1`, `clearSight = true`. If reachable and the player has autoloot on, it queues `playerQuickLootCorpse`. Reward bosses are excluded unless the player picked "all". [creature.cpp L798-L813](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/creatures/creature.cpp#L798), [auto_loot.lua](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/data/scripts/talkactions/player/auto_loot.lua)
- Autoloot is off by default (`autoLoot = false`) and can be VIP-only (`vipAutoLootVipOnly`). Quick loot of a remote corpse without walking needs premium in code ("You must be premium."). [config.lua.dist L307](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/config.lua.dist#L307), [G#L6468-L6471](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6468)
- Loot routing. Items go to "managed containers" by category. There are about 28 categories (armors, rings, runes, potions, valuables, creature products, gold, and a default "unassigned"). If no container is set, it falls back to the main backpack. [object_category.hpp](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/enums/object_category.hpp), [G#L3757-L3772](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L3757)
- Player filter. Each player has a skipped-loot list or an accepted-loot list (whitelist vs blacklist). [G#L3879-L3886](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L3879)
- Gold. `autoBank` sends monster coins straight to the bank. Gold pouch cap `lootPouchMaxLimit = 2000`. [config.lua.dist L292-L317](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/config.lua.dist#L292)
- Official Tibia history. Quick Looting came with the Winter Update 2017, and the default regular-controls binding is Shift + right click ([TibiaQA #34](https://www.tibiaqa.com/34/how-to-use-quick-loot-with-regular-controls)). The 30 stacked corpse limit came in Winter Update 2020, and CipSoft cited performance ([TibiaQA #969](https://www.tibiaqa.com/969/what-is-the-best-way-to-loot-when-monsters-get-stacked?show=22902)). CipSoft added "Quick Loot Nearby Corpses" and framed it partly around inflation ([TibiaVIP news](https://tibiavip.app/home/news?id=7536)). PCGamesN describes the Summer Update of 2024-07-08 as AoE looting ("vacuum up everything in one go") ([PCGamesN](https://www.pcgamesn.com/tibia/summer-update-2024)).

### Inferences
- Clicks per kill in the Tibia lineage (my count from the code paths): classic is 1 open plus 1 drag per item plus 1 close, so about 3 to 6 for a 2 to 4 item corpse. Quick loot is 1. Loot-all-on-tile is 1 for up to 30 corpses. Nearby is 1 key press for up to 30 corpses in a 3x3. Autoloot is 0.
- The walk-then-retry loop with a 300 ms retry is what makes Tibia quick loot feel forgiving on latency. The player clicks once and the server owns the rest.
- Excluding reward bosses from default autoloot keeps the big moment manual. That supports "meaningful" loot.

### Gaps
- The exact official Tibia hotkey name and date for "Quick Loot Nearby Corpses". tibia.com news was not fetched.
- OTClient client-side visuals for quick loot (any fly animation). Not checked.

---

## Q2. AoE loot in modern MMOs: radius, caps, merge rules

### Takeaway
WoW merges loot from all corpses in about 10 to 15 yards into one loot window. Private-server mods ship with 10 corpses per operation and 15 items per window. Tibia's equivalent is a 3x3 tile square with a 30 corpse cap. For a 32 px grid, 3x3 (radius 1 tile) is the honest translation. It also matches pickup reach, so no special rule is needed.

### Cited findings
- WoW Area Looting arrived in patch 5.0.4 (2012-08-28), unlocks at level 8 account-wide, radius "roughly 10-15 yards", and the window shows items from all nearby corpses you have loot rights to. Shift + right click autoloots a corpse except Bind on Pickup items, which need confirmation. Autoloot itself dates to patch 1.9.0. [Warcraft Wiki, Area Looting](https://warcraft.wiki.gg/wiki/Area_Looting)
- AzerothCore `mod-aoe-loot` defaults to 55 yards (allowed 5 to 100), processes at most 10 corpses per loot, shows at most 15 items per window, optionally mails overflow items when bags are full, and recommends near-instant decay of looted corpses. [mod-aoe-loot README](https://github.com/azerothcore/mod-aoe-loot)
- Lost Ark gives auto-loot to the pet, off by default, configured in the Pet interface (Alt+P). [ScreenRant](https://screenrant.com/how-to-auto-loot-lost-ark-guide/)

### Inferences
- The "mail overflow" option is a good bag-full answer for an MMO. Nothing is lost and nothing piles up on the ground.
- Clearing looted corpses fast reduces ground clutter and item count for area-of-interest updates. Asterion should shorten the rot timer of an emptied corpse.

### Gaps
- No official yard figure for WoW. New World and Black Desert pickup rules not found.

---

## Q3. Magnet radius and pull: the numbers

### Takeaway
Walk-over games put the base pickup radius between 1 and 2.6 tiles of their own grid, and items that extend it to 12 tiles or more feel like a power fantasy. Most add a short pickup delay after an item spawns (Minecraft 0.5 s) so the drop can be seen landing. For Asterion I suggest a base magnet of 1 tile for coins only, with a 300 to 500 ms grace delay after landing.

### Cited findings
| Game | Base radius | Extended | Delay | Source |
|---|---|---|---|---|
| Minecraft | pickup box = player hitbox +1 block horizontal, +0.5 vertical | none built in | 10 ticks (0.5 s) normal drop, 40 ticks (2 s) player-thrown | [Minecraft Wiki, Item (entity)](https://minecraft.wiki/w/Item_(entity)) |
| Terraria | 5.25x5.25 tile rectangle, so 2.625 tiles from centre | Treasure Magnet 12 tiles; Celestial Magnet stars 21.375; both 30.75 | not found | [Terraria wiki search results, Treasure Magnet / Celestial Cuffs](https://terraria.wiki.gg/Celestial_Cuffs) |
| Stardew | 128 px = 2 tiles of 64 px | Small Magnet Ring +1 tile, Magnet Ring +2 tiles, foods +32 or +64 units | not found | [biligame wiki 磁性](https://wiki.biligame.com/stardewvalley/%E7%A3%81%E6%80%A7), [Stardew wiki Magnetic Radius](https://stardewvalleywiki.com/Magnetic_Radius) |
| Vampire Survivors | base not found | Attractorb L1 x1.5, L5 x3.98 (wiki says max +300%) | none, gems wait for you | [VS wiki Attractorb](https://vampire.survivors.wiki/w/Attractorb) |
| MapleStory Classic pet | pickup box 25 px each side, 50 px above, 10 px below the pet | Auto Move search 125 px each side, 275 px expanded | retry after 3 s on failed grab | [meowdb pet formulas](https://meowdb.com/msclassic/formulas/pets) |

- Minecraft merging. Same stackable items merge inside a 0.5 x 0.25 x 0.5 box, checked every 40 ticks (2 s) or every 2 ticks when crossing block edges. Larger stack absorbs the smaller, keeps the longer despawn timer. Despawn 6000 ticks (5 min). A stack renders as 1 to 5 models (1, 2-16, 17-32, 33-48, 49+). [Minecraft Wiki](https://minecraft.wiki/w/Item_(entity))
- Terraria dropped items are 16x16 px. [Terraria wiki Items](https://terraria.wiki.gg/wiki/Items)

### Inferences
- Converted to Asterion tiles: Minecraft 1 tile, Stardew 2 tiles, Terraria 2.6 tiles (but its tiles are 16 px, so about 1.3 Asterion tiles in screen distance). The cross-game base range is 1 to 2 tiles of screen-relative space.
- Minecraft's 0.5 s normal delay and 2 s thrown delay is a pattern worth copying. The thrown delay stops a player from picking up what they just dropped, and it gives other players a window to react to a trade-by-drop.
- Minecraft's "stack shows 1 to 5 copies" is a cheap stack counter that reads at a glance without text. On a 32 px tile, 1 / 2 / 3 coin sprites for small / medium / large piles does the same job.
- Pull curve. No source gave a curve. The usual juicy pattern is ease-in acceleration toward the player (item starts slow, speeds up), then a pop on arrival. Estimate for 32 px: 1 tile in 150 to 250 ms. This is an estimate, not cited.
- On a server-authoritative MMO the magnet must be cosmetic. The server grants the item when the player is in range. The client then plays the pull from the item's last position to the player. If the server rejects (someone else got it), the item fades instead of flying.

### Gaps
- Vampire Survivors base Magnet value. Stardew and Terraria pull speeds. Hades auto-collect rules (searches found nothing).

---

## Q4. Pet looters and auto-loot settings

### Takeaway
Pet looters move auto-loot into the fiction and often into the shop. MapleStory and Lost Ark both did this, and MapleStory sold range upgrades. Diablo Immortal turned gold auto-pickup on by default and put gear auto-pickup behind a per-rarity toggle that is off by default. For an MMO with "meaningful death", per-rarity or per-category toggles beat a single on/off.

### Cited findings
- MapleStory pets take free drops plus drops owned by you or your party and skip what they cannot pick up. Auto Move (cash shop) makes the pet walk to the nearest drop. Expanded Auto Move more than doubles the search box (125 to 275 px per side). [meowdb](https://meowdb.com/msclassic/formulas/pets), [meowdb Auto Move Skill](https://meowdb.com/msclassic/item-db/1532)
- A 2023 notice says the Expired Pickup Skill leaves the Cash Shop in v.245. [Dexless](https://www.dexless.com/threads/important-changes-to-expired-item-pickup.3171)
- Diablo Immortal. Gold auto-picks up by default. "Auto Pick Up Items" has separate Normal, Magic, Rare toggles under Settings > General, off by default. [Ginx](https://ginx.tv/en/diablo/diablo-immortal-auto-pick-up-items-enable), [Icy Veins forum](https://www.icy-veins.com/forums/topic/66136-dont-forget-to-turn-on-auto-loot-in-diablo-immortal/)
- OSRS Bonecrusher. Crushes bones "dropped by monsters on death" if charged and in the inventory. 25 charges per ecto-token, 1 per bone, toggle via "Activity". It is an earned item that removes one pickup chore. [OSRS Wiki Bonecrusher](https://oldschool.runescape.wiki/w/Bonecrusher)
- Canary autoloot modes "on" (regular kills) and "all" (including bosses). [auto_loot.lua](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/data/scripts/talkactions/player/auto_loot.lua)

### Inferences
- OSRS gates auto-loot behind earned items, one chore at a time (bones, ashes). That keeps the reduction feeling like progress, not a menu default. It suits Asterion better than a cash-shop pet.
- A visible pet looter on a crowded 32 px screen adds sprites and pathing. A "loot satchel" item with no world sprite gives the same result for less cost.

### Gaps
- Torchlight pet loot rules, Black Desert pet loot rules not found.

---

## Q5. Click-to-pick vs pick-key vs auto: what players say

### Takeaway
Players hate clicking low-value drops one at a time. They also defend manual pickup when it is optional. The PoE thread is the clearest recent example. The shared ask is "currency automatic, gear filtered, toggle for purists."

### Cited findings
- PoE2 feedback thread "Picking things up by clicking isn't fun" (replies from 2026-02-20). OP asks for currency auto-pickup like gold: "Let me focus on killing things." Replies propose a magnet for nearby currency, a filter-driven pickup key, and a toggle. Others push back ("play idle afk games"). No GGG reply visible. [PoE forum 3912718](https://www.pathofexile.com/forum/view-thread/3912718)
- PoE2 already auto-collects gold. "Key Pickup" can be set to "Use Bound Key" so clicking stops picking up items. Z toggles ground item labels, Alt holds them visible. Some players report items "vanishing" when Always Highlight is off. [Game8](https://game8.co/games/Path-of-Exile-2/archives/488429), [PoE forum 3727210](https://www.pathofexile.com/forum/view-thread/3727210)
- WoW Area Looting page notes lag can leave a corpse stuck and unlootable, and some players find looting in combat rude. [Warcraft Wiki](https://warcraft.wiki.gg/wiki/Area_Looting)
- Diablo IV players reported crafting materials auto-collecting by proximity without patch-note mention (unverified blog). [blog](https://jadydengamenews.blogspot.com/2025/05/diablo-4-players-rejoice-over-silent.html)

### Inferences
- The "vanishing items when labels are off" complaint means hiding labels must never hide the item sprite. Keep sprites, toggle text.
- Separate the pickup input from the move input. Diablo-style click-to-move with click-to-pick creates misclicks in crowds. Tibia-style click-on-corpse is fine because the corpse is a clear, tile-sized target.

---

## Q6. Bag full: what happens to the item

### Takeaway
Three patterns. Leave it on the ground (Minecraft, Terraria without Void Bag). Send overflow to a secondary store (Terraria Void Bag, AzerothCore mail). Refuse and message loudly (Canary). In a shared-screen MMO, overflow left on the ground becomes everyone's loot when ownership expires, which is griefing fuel. Canary's approach (item stays in the corpse, loud message, 15 s throttle) is safest.

### Cited findings
- Canary quick loot leaves items in the corpse and shows "Attention! The loot you are trying to pick up is too heavy for you to carry." or "...the container assigned to category X is full." The message uses highlight style only if 15 s have passed since the last one, otherwise a quieter style. [G#L3735-L3755](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L3735)
- Terraria Void Bag catches items after the main inventory is full and shows purple pickup text. Encumbering Stone blocks all pickups. [Terraria wiki Void Bag](https://terraria.wiki.gg/Void_Bag), [Encumbering Stone](https://terraria.wiki.gg/Encumbering_Stone)
- AzerothCore AoE loot can mail items that do not fit, except unique items. [mod-aoe-loot](https://github.com/azerothcore/mod-aoe-loot)

### Inferences
- The 15 s throttle on the loud message is a detail worth copying. Spam-looting with a full bag would otherwise flood chat.
- Distinct pickup text colour for overflow (Terraria purple) tells the player something changed without a modal.
- Visual cue for refusal, estimated: the item hops up 4 to 6 px and drops back with a dull thud, plus a red-tinted bag icon flash. Not cited.

---

## Q7. Mobile and touch

### Takeaway
On phones, seeing drops is harder than picking them up. OSRS mobile players asked for ground item highlighting more than anything else. Long-press menus are the fallback when a tap has several meanings. Asterion should make the corpse tile a large tap target and offer a "loot nearby" button.

### Cited findings
- OSRS mobile 6th anniversary update. Ground Items and Loot Trackers were the most requested mobile feature, because drops are harder to see on a phone. An "Edit Ground Items" hotkey adds or removes filter entries with + and - for nearby items. [OSRS Wiki update page](https://oldschool.runescape.wiki/w/Update:OSRS_Mobile_-_6th_Anniversary_Celebration)
- OSRS mobile single-tap mode acts as desktop right-click. Without it, players touch and hold for options. [OSRS Wiki Mobile client](https://oldschool.runescape.wiki/w/Mobile_client)
- One OSRS mobile user reported freezes after ground items launched that stopped when the feature was off (anecdotal). [r/OSRSMobile via redlib](https://redlib.hbubli.cc/r/OSRSMobile/comments/1gkyrwq/with_new_mobile_update_am_i_missing_something)
- Diablo Immortal relies on default gold auto-pickup and opt-in gear auto-pickup on mobile. [Ginx](https://ginx.tv/en/diablo/diablo-immortal-auto-pick-up-items-enable)

### Inferences
- A 32 px tile on a phone at 2x to 3x scale is 64 to 96 css px. That clears the common 44 to 48 pt touch target guidance, so tapping a corpse tile is fine. Single items on a pile are not. Use a loot window or loot-all on touch, not per-item ground taps.
- The OSRS freeze anecdote is a reminder that label rendering is the cost, not the items. See the netcode and cost notes.

### Gaps
- Albion mobile loot UI specifics not found (only a "Use All" item button). Tap target guidance not cited here.

---

## Q8. Accessibility

### Takeaway
Spam-clicking corpses is repeated input. Game Accessibility Guidelines lists avoiding repeated inputs as an intermediate motor guideline. Quick loot, loot nearby and autoloot are the accessibility features, and they should not be paywalled (Canary's VIP or premium options gate them).

### Cited findings
- "Avoid repeated inputs", intermediate, motor. If unavoidable, offer a setting to simplify or skip. [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/avoid-repeated-inputs-button-mashing-quick-time-events/)
- Canary can gate autoloot to VIP and remote quick loot to premium. [config.lua.dist L645](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/config.lua.dist#L645), [G#L6468](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6468)

### Inferences
- Hold-to-loot (hold the key, loot nearby repeats every action tick while held) costs nothing extra on the server. Canary already queues to the next action time.
- Per-category routing (Canary managed containers) cuts the drag-and-drop of inventory sorting after the hunt, the second half of the click load.

---

## Q9. Fly-to-bag, inventory bump, stack counters

### Takeaway
I found no measured numbers for fly-to-bag animations in these sources. The pattern is client-only and cheap. Recommend it as cosmetic, triggered by the server's "item added" message, never by the click.

### Cited findings
- Minecraft stack visuals (1 to 5 models by count). [Minecraft Wiki](https://minecraft.wiki/w/Item_(entity))
- Terraria coloured pickup text (purple for Void Bag). [Terraria wiki Void Bag](https://terraria.wiki.gg/Void_Bag)
- Canary sends one summary line per loot action ("You looted N corpses.") rather than one per item. [G#L6608-L6615](https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp#L6608)

### Inferences (estimates for a 32 px game)
- Fly: item sprite lifts 8 px, then travels on a quad bezier to the bag icon in 250 to 350 ms, ease-in. Bag icon scales 1.0 to 1.15 to 1.0 over 120 ms on arrival. Batch: if more than 3 items arrive in one server message, fly 3 sprites and show "+N" floating text.
- Stack counters: floating "+12 gold" in the item colour above the player, merged if another arrives within 300 ms.
- Only the looting player sees the fly. Others see the corpse change (sprite update), which Canary already sends as `corpse->sendUpdateToClient(player)`.

### Gaps
- Measured fly-to-bag timings from shipped games. Hades and Dead Cells pickup timing.

---

## What transfers to Asterion (32 px, server-authoritative, crowded)

1. Keep the Tibia corpse-as-container. Layer four inputs on one server function. Open-and-drag, quick loot one corpse (1 click), loot nearby 3x3 (1 key, hold to repeat), opt-in autoloot on kill for regular monsters. Bosses stay manual by default.
2. Pickup reach = 1 tile (Chebyshev). AoE loot radius = the same 3x3. Cap 30 corpses per action, like Canary and CipSoft.
3. Clicking a far corpse auto-walks and retries every 300 ms until adjacent. One click, server owns the rest.
4. Gold: no world magnet needed if corpses hold the gold. If ground coins exist (player deaths, drops), use a 1 tile cosmetic magnet with 300 to 500 ms landing delay and 2 s delay for items the player threw.
5. Route by category into chosen containers, with a whitelist or blacklist per player.
6. Bag full: item stays in the corpse, loud message throttled to once per 15 s, bag icon flash. Never spill overflow onto the ground in a shared area.
7. Fly-to-bag and counters are client-only, triggered by the server's container update. Rejected grabs fade in place.
8. Touch: big corpse tap target, "loot nearby" button, long-press for item menu.
9. Do not paywall quick loot or nearby loot. They are accessibility features.

---

## Sources
- Canary game.cpp: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/game/game.cpp
- Canary creature.cpp: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/creatures/creature.cpp
- Canary configmanager.cpp: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/config/configmanager.cpp
- Canary config.lua.dist: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/config.lua.dist
- Canary object_category.hpp: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/enums/object_category.hpp
- Canary auto_loot.lua: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/data/scripts/talkactions/player/auto_loot.lua
- TibiaQA quick loot controls: https://www.tibiaqa.com/34/how-to-use-quick-loot-with-regular-controls
- TibiaQA stacked corpses: https://www.tibiaqa.com/969/what-is-the-best-way-to-loot-when-monsters-get-stacked?show=22902
- TibiaVIP news, Quick Loot Nearby Corpses: https://tibiavip.app/home/news?id=7536
- PCGamesN Tibia Summer Update 2024: https://www.pcgamesn.com/tibia/summer-update-2024
- Warcraft Wiki Area Looting: https://warcraft.wiki.gg/wiki/Area_Looting
- AzerothCore mod-aoe-loot: https://github.com/azerothcore/mod-aoe-loot
- Minecraft Wiki Item (entity): https://minecraft.wiki/w/Item_(entity)
- Terraria wiki Celestial Cuffs (pickup ranges): https://terraria.wiki.gg/Celestial_Cuffs
- Terraria wiki Items: https://terraria.wiki.gg/wiki/Items
- Terraria wiki Void Bag: https://terraria.wiki.gg/Void_Bag
- Terraria wiki Encumbering Stone: https://terraria.wiki.gg/Encumbering_Stone
- Stardew wiki Magnetic Radius: https://stardewvalleywiki.com/Magnetic_Radius
- Stardew biligame wiki 磁性: https://wiki.biligame.com/stardewvalley/%E7%A3%81%E6%80%A7
- Vampire Survivors wiki Attractorb: https://vampire.survivors.wiki/w/Attractorb
- meowdb MapleStory Classic pet formulas: https://meowdb.com/msclassic/formulas/pets
- meowdb Auto Move Skill: https://meowdb.com/msclassic/item-db/1532
- Dexless Expired Pickup notice: https://www.dexless.com/threads/important-changes-to-expired-item-pickup.3171
- ScreenRant Lost Ark auto loot: https://screenrant.com/how-to-auto-loot-lost-ark-guide/
- Ginx Diablo Immortal auto pickup: https://ginx.tv/en/diablo/diablo-immortal-auto-pick-up-items-enable
- Icy Veins forum Diablo Immortal auto loot: https://www.icy-veins.com/forums/topic/66136-dont-forget-to-turn-on-auto-loot-in-diablo-immortal/
- OSRS Wiki Bonecrusher: https://oldschool.runescape.wiki/w/Bonecrusher
- OSRS Wiki Drops: https://oldschool.runescape.wiki/w/Drops
- OSRS Wiki Mobile 6th anniversary: https://oldschool.runescape.wiki/w/Update:OSRS_Mobile_-_6th_Anniversary_Celebration
- OSRS Wiki Mobile client: https://oldschool.runescape.wiki/w/Mobile_client
- r/OSRSMobile freeze report: https://redlib.hbubli.cc/r/OSRSMobile/comments/1gkyrwq/with_new_mobile_update_am_i_missing_something
- PoE forum "Picking things up by clicking isn't fun": https://www.pathofexile.com/forum/view-thread/3912718
- PoE forum loot disappearance: https://www.pathofexile.com/forum/view-thread/3727210
- Game8 PoE2 controls: https://game8.co/games/Path-of-Exile-2/archives/488429
- Diablo IV material pickup blog (unverified): https://jadydengamenews.blogspot.com/2025/05/diablo-4-players-rejoice-over-silent.html
- Game Accessibility Guidelines, repeated inputs: https://gameaccessibilityguidelines.com/avoid-repeated-inputs-button-mashing-quick-time-events/
