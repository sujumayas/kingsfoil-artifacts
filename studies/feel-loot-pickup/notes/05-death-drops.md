# 05. Player death drops ("meaningful death" pillar)

Researcher angle: what a player loses on death, how the drop looks on screen, and who gets it and when. Seen from the dropper, the killer and bystanders.

Scratch files (source downloads used for grep) are in `notes/scratch-05/`: Canary `player.cpp`, `creature.cpp`, `blessing.lua`, `items.xml`, TFS `player.cpp`, OSRS wiki JSON.

---

## Q1. How does Tibia (Canary / TFS) decide what a dead player drops?

### Takeaway
Tibia drops a few random equipped slots plus, almost always, the whole backpack into the player's own corpse. Blessings cut the odds on a fixed table. Red and black skulls drop everything. The amulet of loss is a one-shot "drop nothing" consumable. The rules are tiny (about 40 lines of Lua) and fully data-driven, so they port to Godot easily.

### Cited findings
- Canary's blessing table maps blessing count to container drop chance and skill/xp reduction. Count 0 gives item 100, skill 0. Count 1 gives 70 / 8. Count 2 gives 45 / 16. Count 3 gives 25 / 24. Count 4 gives 10 / 32. Count 5 and up gives item 0, skill 40 to 56. https://github.com/opentibiabr/canary/blob/main/data/libs/systems/blessing.lua
- `Blessings.DropLoot` loops slots `CONST_SLOT_HEAD..CONST_SLOT_AMMO` (10 slots). A container uses the full chance, any other item uses chance / 10. So with 0 blessings the backpack drops 100% of the time and each equipped piece 10%. Dropped items are `moveTo(corpse)`, so they land inside the dead player's corpse, not on the floor. Same file.
- Red or black skull calls `DropLoot(player, corpse, 100, true)`, which moves every slot. An optional config `skulledDeathLoseStoreItem` also deletes the store inbox. Same file, and https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- The amulet of loss (AoL) skips the drop roll entirely when the player has no red/black skull. Canary checks `hasAol` and `#currBlessCount < 5`. Same file.
- Older TFS `drop_loot.lua` has the same shape. It rolls `math.random(item:isContainer() and 100 or 1000) <= lossPercent`. The AoL is removed on death unless the killer is a player and the victim has blessing 6 (Twist of Fate style). Players with no vocation drop nothing. If the backpack slot ends up empty the server gives a plain bag. https://github.com/otland/forgottenserver/blob/master/data/creaturescripts/scripts/drop_loot.lua
- TFS xp loss for level 25+ is `(L+50) * 50 * (L^2 - 5L + 8) / experience` percent. Promotion removes 30% of that, each blessing removes 8%. In PvP, an "unfair fight" reduction scales loss by victim level / summed attacker levels, floored at 20%. https://github.com/otland/forgottenserver/blob/master/src/player.cpp (lines ~2075-2125 and `getLostPercent` ~4085)
- A black-skull player respawns with 40 HP and 0 mana instead of full. Same TFS file, ~line 2166.
- Canary's free "adventurer's blessing" covers players up to level 21 (`adventurersBlessingLevel = 21`). `protectionLevel = 7` means players below level 7 cannot be attacked by players. https://github.com/opentibiabr/canary/blob/main/config.lua.dist

### Derived numbers (inference from the table above, 9 non-container slots)
| Blessings | Backpack drop | Each equipped piece | Chance to lose at least one piece | Expected pieces lost |
|---|---|---|---|---|
| 0 | 100% | 10% | 61% | 0.90 |
| 1 | 70% | 7% | 48% | 0.63 |
| 2 | 45% | 4.5% | 34% | 0.40 |
| 3 | 25% | 2.5% | 20% | 0.23 |
| 4 | 10% | 1% | 9% | 0.09 |
| 5+ | 0% | 0% | 0% | 0 |

The design is clever for feel. The backpack (supplies, the haul of the trip) is the predictable loss. The gear loss is a lottery, which keeps tension high even for blessed players.

### Inferences
- Canary seeds `math.randomseed(os.time())` inside every `DropLoot` call. Two players who die in the same second get identical roll sequences, and the seed is guessable. A port should use one server RNG seeded once.
- The loss lands in the victim's corpse, which is the same container players already know how to open. No new UI is needed for death loot.

### Gaps
- Exact current CipSoft live percentages for the 7 and 8 enhanced blessings were not verified against tibia.com. Canary is a reimplementation.

---

## Q2. Who may loot a dead Tibia player, and how long does the corpse stay?

### Takeaway
A Tibia player corpse has no owner. Anyone on screen can open it the moment it appears. That one rule makes the killer, the victim's friends and random bystanders race for it, which is where most of the PvP drama comes from.

### Cited findings
- Canary sets `CORPSEOWNER` only in `monster.cpp` (to the top damage dealer or their master). Player corpses go through `Creature::dropCorpse` with no owner. `Game` lets anyone open a corpse when `getCorpseOwner() == 0`; otherwise `Player::canOpenCorpse` checks owner id or party. https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp , https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp , https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp
- Canary `items.xml` player corpses: male 4240 and female 4247 are containers with `containersize 10`, `duration 1200` s, decaying to a second container stage (4241 / 4248) of another 1200 s, then to a non-container stage of 1200 s before vanishing. That is 40 minutes lootable plus 20 minutes of bones. https://github.com/opentibiabr/canary/blob/main/data/items/items.xml (ids 4240-4248)
- Note for the editor. CONTEXT.md says "player corpse first stage 10 s". In Canary's items.xml the 10 s value belongs to monster corpses such as 4239 "dead lizard templar". Player corpse stages are 1200 s.
- Canary skips the coloured "Loot of ..." server message for male/female player corpses (`disallowedCorpses` in `creature.cpp`). There is no killer loot broadcast.
- The corpse description names the killers. TFS writes "You recognize X. He was killed by Y" and adds "and others" past one or two killers. Canary does the same and resolves summons to their master. https://github.com/otland/forgottenserver/blob/master/src/player.cpp (`Player::getCorpse` ~line 2224)
- Skull and protection settings in Canary config. `pzLocked = 60000` ms (can't enter protection zone for 60 s after aggression). `whiteSkullTime = 15` min. Red skull after 3 unjust kills per day, 5 per week or 10 per month. `redSkullDuration = 1`, `blackSkullDuration = 3`, `orangeSkullDuration = 7` (days in Canary). TFS adds "Warning! The murder of X was not justified." https://github.com/opentibiabr/canary/blob/main/config.lua.dist , https://github.com/otland/forgottenserver/blob/master/src/player.cpp (`addUnjustifiedDead`)

### Inferences
- Because the corpse holds only 10 slots and the whole backpack is one item, the dropped loot reads as "one bag inside one body". On a 32 px tile that is legible. The examine line ("killed by Y") is the only killer announcement, and it works as a revenge prompt.
- An ownerless corpse rewards bystanders who did nothing. Albion (Q4) shows the fix most later games chose, a short priority window.

### Gaps
- Behaviour of items when a container corpse decays into the non-container stage (deleted or spilled) not confirmed in source.

---

## Q3. OSRS: items kept, gravestones and fees

### Takeaway
OSRS split death into two products. PvM death is a timed errand with a fee (the grave). PvP death is a transfer to the killer. The "keep 3 most valuable" rule is the key to the feel. Players always know their best stuff is safe unless they chose risk by getting skulled.

### Cited findings
- Unskulled players keep their 3 most valuable items. Protect Item prayer adds 1 more, even when skulled. Skulled players keep 0 (1 with Protect Item). High-risk worlds block Protect Item. https://oldschool.runescape.wiki/w/Items_Kept_on_Death , https://oldschool.runescape.wiki/w/Skull_(status)
- Skull lasts 30 min after attacking a player unprovoked, 10 min after leaving the Abyss. Retaliating does not skull you. A "PK Skull Prevention" setting blocks attacks that would skull you. https://oldschool.runescape.wiki/w/Skull_(status)
- PvM death puts lost items in a grave at the death tile (or outside the instance). The grave is shown on the minimap, can be looted from up to 7 tiles with line of sight, and lasts 15 minutes after respawn. The timer pauses while logged out, idle over 10 s, or with the grave interface open. Dying again refreshes the timer and merges into the old grave. Grave storage has 120 slots. https://oldschool.runescape.wiki/w/Grave
- Grave fees. Free under 100k per item, 1k per item for 100k to 1m, 10k for 1m to 10m, 100k at 10m and up, total capped at 500k. After 15 minutes items go to Death's Office with a 5% fee on items worth 100k+. Ironmen pay half. Some bosses discount fees 75% until N kills (Zulrah free until 50 kills). https://oldschool.runescape.wiki/w/Death/Item_Recovery_Fees , https://oldschool.runescape.wiki/w/Death%27s_Office
- Food and potions can drop as a "supply pile" for other players under your feet. https://oldschool.runescape.wiki/w/Items_Kept_on_Death
- Wilderness: below level 20 most untradeables go to the grave, everything else goes to the killer. Above 20, all non-protected items go to the killer and some untradeables break or convert to coins for the killer. Same page.
- History of the PvP ground timer. 2014: items on floor 30 min, visible only to the killer for 1 min. 2015: 60 min, killer-only 1 min then everyone for 59 min. June 2020: gravestones and Death's Office replaced ground drops for PvM. https://oldschool.runescape.wiki/w/Death (Changes section)
- Loot keys (Feb 2022). Killer pays 1m once to unlock. The victim's loot goes into a key in the killer's inventory instead of on the ground, max 5 keys, redeemed at the Ferox Enclave chest. A dropped key is pickable only by the killer. The skull icon changes to show how many keys a player holds, so other PKers can see a "loaded" target. https://oldschool.runescape.wiki/w/Loot_key
- Death announcement text is "Oh dear, you are dead!". Death animations are cosmetic overrides of 6 to 7 ticks (0.6 s per tick). https://oldschool.runescape.wiki/w/Death

### Inferences
- Loot keys solve two MMO problems at once. They remove ground clutter in crowded PK fights (no 28 items to click while being attacked) and they stop third parties sniping the pile. The skull-with-key-count is a strong readable signal at small sizes.
- The pausing timer is a direct answer to "I died, my internet dropped, I lost everything". Copy it.

### Gaps
- No measured data on how often players reclaim graves vs pay Death.

---

## Q4. Full-loot games: UO, Albion, EVE, Tarkov, Dark and Darker, Lineage II

### Takeaway
Full-loot games all keep something back. UO has insurance and blessed items, Tarkov has insurance and a secure container, EVE destroys part of the cargo, Albion destroys a share and gives the killer a 90 s priority window. Full loot without any safety valve only survives in niche games.

### Cited findings
- Ultima Online. Uninsured items stay on the corpse and can be looted by monsters, or by players in Felucca only. Insurance costs 10 to 800 gp per item (600 gp flat before Publish 64), auto-renew charges the bank on death. A killer of an insured player receives the insurance gold (100%, or 50% in Factions). Blessed items always return to the player. https://uoguide.com/Insure , https://uo.com/wiki/ultima-online-wiki/player/insurance/ , https://uo.com/wiki/ultima-online-wiki/player/bless-deeds/
- Albion Online. Blue and yellow zones knock you down with no gear loss and 5% durability damage. Red and black zones drop everything worn and carried. https://albionfreemarket.com/articles/view/albion-online-guide-to-zones-and-flagging . Into the Fray Patch 4 (11 Aug 2022) gave black-zone corpses a 90 s priority window for the killing blow player, the top damage dealer, their allies, and the victim's own allies. After 90 s anyone may loot. https://player.one/albion-online-fray-patch-4-implements-black-zone-loot-changes-and-more-149725 . Rogue Frontier Patch 1 set item destruction on death to 33% for both equipable (up from 30%) and non-equipable (down from 36%) items, as reported in search summaries of patch notes https://consolepcgaming.com/albion-onlines-rogue-frontier-patch-1-notes (not opened directly, treat as unverified).
- EVE Online. A destroyed ship leaves a wreck. Overview icons colour it white (yours, unopened), grey (opened), yellow (someone else's, looting it gives a 15 min suspect flag), blue (abandoned, free). Loot range 2,500 m. https://wiki.eveuniversity.org/Salvaging . Players report wrecks despawn after about 2 hours. https://forums.eveonline.com/t/wrecks-despawning-without-anything-around/248507 . The commonly quoted 50% per-item drop rule was not confirmed in sources I could open.
- Escape from Tarkov. Insured items come back only if nobody extracted with them. Guide sites give Prapor 24 to 36 h and Therapist 12 to 24 h return times (third-party, numbers conflict across sites). https://leprestore.com/guides/eft/escape-from-tarkov-insurance-explained/ , https://www.eft-ammo.com/wiki/escape-from-tarkov-insurance-guide
- Lineage II Classic. Non-chaotic characters never drop items. Chaotic characters with PK count 4+ may drop one or more items on death. https://www.lineage2.com/news/lineage-ii-classic-launch-patch-notes . PK debuffs at 4+ added 2020, item drop rule unchanged. https://devtrackers.gg/lineageii/p/f8182d0d-pk-system-changes-6-3-2020

### Inferences
- The two-sided insurance in UO (the killer gets the premium) is a neat trick. The victim keeps the item, the killer still gets a reward, and nobody has to click through a corpse.
- Albion's rule that the victim's allies share the priority window turns a death into a fight over the body. That is the "revenge" beat, built into the loot rules.

### Gaps
- Dark and Darker, Mortal Online 2, Rust and DayZ: no fetched sources. From general knowledge all are full loot of a body or bag with no owner timer, but I did not cite numbers.
- EVE 50% drop rule and Albion trash percentages need primary sources (CCP support, Albion forum patch notes).

---

## Q5. Design writing: what makes a death penalty "meaningful" rather than miserable?

### Takeaway
Raph Koster's point is that a penalty's feel depends on the systems around it. Fast travel back, a way to ask friends for help, cheap replacement gear and a readable corpse make a harsh drop feel fair. Remove those and the same penalty feels cruel.

### Cited findings
- Koster argues corpse runs are not a design error in themselves, since "features do not exist in isolation". In MUDs, quick travel, global chat and donation rooms made them bearable, and "corpse runs were a powerful social force". 3D games kept the penalty and lost the support systems. https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
- MassivelyOP and Engadget surveys of death penalties trace full-corpse loot to pre-Trammel UO and EverQuest. https://massivelyop.com/2018/09/26/perfect-ten-the-big-book-of-mmorpg-death-mechanics/ , https://www.engadget.com/2011-03-24-the-perfect-ten-death-penalties.html
- Contains Moderate Peril has a long series on death in MMOs. https://www.containsmoderateperil.com/blog/2019/3/1/death-in-mmos

### Inferences (the emotional curve, author judgement)
1. Before death, the risk must be visible. OSRS shows items kept on death in an interface and the skull above the head. Tibia shows blessings in the character window (and Canary's optional `inventoryGlowOnFiveBless`).
2. At death, the player should see exactly what fell. Tibia's message "You were downgraded from Level X to Level Y" is text only. A "lost on death" list on the respawn screen is cheap and kills confusion.
3. After death, give a goal and a clock. OSRS's 15 min grave with a minimap icon turns loss into a mission. Tibia's 40 min ownerless corpse turns it into a race.
4. For the killer, the reward should be instant and safe to collect. Loot keys and UO insurance payouts avoid the "I won but got killed while looting" problem.
5. Bystanders should be able to tell a fresh player corpse from a monster corpse, and see who it belonged to, without opening it.

---

## Q6. What transfers to Asterion Online (32 px top-down, Godot 4, server authoritative)

Recommendations are inferences unless marked.

1. **Base rule (Tibia-shaped).** Backpack drops at a blessing-scaled chance (100 / 70 / 45 / 25 / 10 / 0), each equipped slot at one tenth of that. Keep it as a data table, not code. Source table: Canary `blessing.lua` above.
2. **Keep a protected floor.** Borrow OSRS "keep N most valuable" for non-skulled players, at least for new characters, or Canary's free blessings below level 21. The pillar is "meaningful", not "ruinous".
3. **Skull = consent to full loot.** Red and black skulls drop everything (Tibia, OSRS). Show the skull clearly at 32 px; OSRS even encodes loot key count into it.
4. **Corpse owner window.** Use a priority window like Albion's 90 s for killer, top damage and the victim's party, then public. This fixes Tibia's bystander sniping while keeping the rescue race. Tibia itself has no window for player corpses.
5. **Corpse lifetime.** Tibia's 40 min lootable is long enough for a corpse run on a big map. Add an OSRS-style pause while the owner is logged out only if the corpse is not PvP loot.
6. **Readability on the tile.** Use a distinct player corpse sprite (Tibia uses "dead human" ids 4240/4247), a nameplate or examine line with "killed by", and a minimap marker for the owner only (OSRS grave icon). Do not broadcast the loot list to the server (Canary does not), but show it to the killer in their own chat.
7. **Killer collection.** Offer a single "loot all" on a player corpse, or a loot-key style container, so the winner is not stuck clicking 10 slots in a fight.
8. **Anti-griefing.** Protection level (Canary 7), 60 s PZ lock after aggression, unjust-kill counters (3 / 5 / 10 per day / week / month for red), and Tibia's unfair-fight xp reduction (floor 20%) for gank victims.
9. **Server RNG.** Do not reseed per death (Canary bug). Log every drop roll for support tickets.
10. **Dup safety.** Drop the items by moving ownership server-side in one transaction from inventory to corpse container, as `moveTo(corpse)` does. Never create copies then delete.

### Ratings (author judgement, 1 to 5)
| Technique | Clarity | Delight | MMO fit | Fairness | Speed |
|---|---|---|---|---|---|
| Tibia random slot drop into ownerless corpse | 3 | 3 | 4 | 2 | 5 |
| OSRS keep-3 + grave with paused timer | 5 | 3 | 5 | 5 | 5 |
| OSRS loot keys for PvP | 4 | 4 | 5 | 4 | 5 |
| Albion full loot + 90 s priority window | 4 | 4 | 4 | 4 | 4 |
| UO insurance (killer gets premium) | 4 | 2 | 4 | 4 | 5 |
| EVE coloured wreck ownership + suspect flag | 5 | 3 | 4 | 4 | 5 |

Speed is 5 for most because a corpse is one container entity. Cost scales with corpse count, not item count.

---

## Sources
- Canary blessing system: https://github.com/opentibiabr/canary/blob/main/data/libs/systems/blessing.lua
- Canary drop_loot event: https://github.com/opentibiabr/canary/blob/main/data-canary/scripts/creaturescripts/drop_loot.lua
- Canary config: https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- Canary creature.cpp (dropCorpse): https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp
- Canary monster.cpp (CORPSEOWNER): https://github.com/opentibiabr/canary/blob/main/src/creatures/monsters/monster.cpp
- Canary game.cpp and player.cpp (canOpenCorpse): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp , https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp
- Canary items.xml: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- TFS player.cpp: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- TFS drop_loot.lua: https://github.com/otland/forgottenserver/blob/master/data/creaturescripts/scripts/drop_loot.lua
- OSRS wiki: https://oldschool.runescape.wiki/w/Items_Kept_on_Death , https://oldschool.runescape.wiki/w/Grave , https://oldschool.runescape.wiki/w/Death%27s_Office , https://oldschool.runescape.wiki/w/Death/Item_Recovery_Fees , https://oldschool.runescape.wiki/w/Skull_(status) , https://oldschool.runescape.wiki/w/Loot_key , https://oldschool.runescape.wiki/w/Death
- Albion: https://albionfreemarket.com/articles/view/albion-online-guide-to-zones-and-flagging , https://player.one/albion-online-fray-patch-4-implements-black-zone-loot-changes-and-more-149725 , https://consolepcgaming.com/albion-onlines-rogue-frontier-patch-1-notes
- EVE: https://wiki.eveuniversity.org/Salvaging , https://forums.eveonline.com/t/wrecks-despawning-without-anything-around/248507
- UO: https://uoguide.com/Insure , https://uo.com/wiki/ultima-online-wiki/player/insurance/ , https://uo.com/wiki/ultima-online-wiki/player/bless-deeds/
- Tarkov (third-party guides): https://leprestore.com/guides/eft/escape-from-tarkov-insurance-explained/ , https://www.eft-ammo.com/wiki/escape-from-tarkov-insurance-guide
- Lineage II: https://www.lineage2.com/news/lineage-ii-classic-launch-patch-notes , https://devtrackers.gg/lineageii/p/f8182d0d-pk-system-changes-6-3-2020
- Raph Koster: https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
- Surveys: https://massivelyop.com/2018/09/26/perfect-ten-the-big-book-of-mmorpg-death-mechanics/ , https://www.engadget.com/2011-03-24-the-perfect-ten-death-penalties.html , https://www.containsmoderateperil.com/blog/2019/3/1/death-in-mmos
