# 04. Ownership and sharing rules, and how they feel

Researcher angle: who may loot, when, and what that does to the feel of a shared-screen MMO with open PvP.
Scratch files (wiki dumps, Canary sparse clone, rAthena pc.cpp) are in `notes/scratch-04/`.

Method note. Fan wikis were mostly skipped. Tibia rules come from the Canary server source (opentibiabr/canary, main branch, cloned 2026-11-11). Ragnarok rules come from rAthena source and config. OSRS, WoW, GW2 and PoE rules come from MediaWiki `api.php` wikitext dumps. Community reaction comes from news sites and official forums.

---

## Q1. Tibia: who owns a monster corpse, and for how long?

### Takeaway
In Canary, the top damage dealer (or the owner of the top-damage summon) owns the corpse. The ownership lives on the first corpse stage only, which lasts 10 s for ordinary monsters. When that stage decays into the next sprite, the owner attribute is wiped and the corpse is free for all. Party members of the owner may open it during those 10 s. Player corpses have no owner at all, so PvP kills are free to loot from frame one.

This corrects one line in study #2. The full dragon corpse timeline is 10 + 300 + 300 + 60 s = 670 s, not 300 + 300 + 60 s. The 10 s stage is the "fresh, owned" stage.

### Cited findings
- `Monster::getCorpse` sets `CORPSEOWNER` to `mostDamageCreature->getID()`, or to the master's ID if the top damage came from a summon. Last hit does not matter. https://github.com/opentibiabr/canary/blob/main/src/creatures/monsters/monster.cpp (around line 3305)
- `Item::setID` (called on every decay transform) runs `removeAttribute(CORPSEOWNER)` unless it is a reward corpse. So ownership ends at the first decay step. https://github.com/opentibiabr/canary/blob/main/src/items/item.cpp (around line 808)
- Dragon `monster.corpse = 5973`. Rat `monster.corpse = 5964`. https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/monster/dragons/dragon.lua , https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/monster/mammals/rat.lua
- Item 5973 "dead dragon": duration 10, decayTo 4025, containersize 12. 4025: 300 s, decays to 4026: 300 s, decays to 4027: 60 s, then gone. Same 10 s first stage for rat (5964), orc (5966), spider (5974). https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- `Player::canOpenCorpse(ownerId)` returns true if you are the owner or `m_party->canOpenCorpse(ownerId)`. `Party::canOpenCorpse` returns true if the owner is the leader or a member of the same party. It does not check shared-XP status or distance. https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp (line 1379), https://github.com/opentibiabr/canary/blob/main/src/creatures/players/grouping/party.cpp (line 735)
- A non-owner who tries to open gets `RETURNVALUE_YOUARENOTTHEOWNER` ("You are not the owner."). Quick loot on a non-owned corpse sends `RETURNVALUE_NOTPOSSIBLE`. https://github.com/opentibiabr/canary/blob/main/src/lua/creature/actions.cpp (line 366), https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (lines 6514, 6597)
- The loot highlight on a corpse only shows for players who may open it (`hasLootHighlight() && (owner == 0 || canOpenCorpse)`). Non-owners see a plain corpse. https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp (line 1334)
- `Player::getCorpse` builds the "You recognize X. He was killed by Y and Z." description but sets no owner. Player corpse "dead human" (id 111) has a 10 s first stage too, but no lock. https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp (line 4373), items.xml line 60
- Fans cite "about 10 seconds" for official Tibia, which matches the Canary data. https://www.tibiaqa.com/14771/if-i-dealt-damage-to-creature-will-get-loot-despite-of-how-long-has-passed . TibiaWiki says loot becomes free for all after the lock and that stealing a kill's loot is possible. https://tibia.fandom.com/wiki/Loot
- Older TFS 0.3.6 used a separate config `fieldOwnershipDuration = 5 * 1000`, and OT server owners asked how to add a timer because owners were "owner of this corpse forever". https://otland.net/threads/corpse-owner-duration.239132/
- Related PvP config defaults in Canary: `pzLocked = 60 * 1000` ms, `whiteSkullTime = 15 * 60 * 1000` ms, `loginProtectionTime = 10 * 1000` ms, red skull at 3 unjustified kills per day, 5 per week, 10 per month. https://github.com/opentibiabr/canary/blob/main/config.lua.dist

### Inferences
- The 10 s owned stage is long enough for a spam-clicker to open and quick-loot, and short enough that an abandoned corpse becomes public fast. It is a soft lock, not a guarantee.
- Because owner = top damage, a high-level player can "steal" a corpse by out-damaging the player who pulled. Last hit is irrelevant, so classic kill-stealing by last-hitting does not work in Tibia. Damage racing does.
- Tying ownership to the sprite stage is cheap. There is no extra timer object and no extra packet. The visual change (fresh corpse to older corpse) is also the "now public" signal, but only experienced players read it.

### Gaps
- No official CipSoft statement of the exact protection length.
- I did not verify whether official Tibia clears ownership at decay or on a separate timer.

---

## Q2. Tibia: party loot, shared XP and the hunt analyser

### Takeaway
Tibia has one party loot mode: everyone in the party can open any member's corpse, first come first served. There is no roll, no round robin. Fairness is handled socially, with the client's Party Hunt Analyser computing profit per player and community tools turning that into "who pays whom". Shared XP has strict rules (level range, 30 tile range, activity in the last 2 minutes). Loot sharing has none of them.

Bosses use a separate personal system. Each participant gets a private reward bag in the reward chest, scaled by a contribution score.

### Cited findings
- Shared XP status per member requires level >= `ceil(highestLevel / 1.5)`, within 30 x 30 tiles of the leader on the same floor, and activity within the last `2 * 60 * 1000` ms. https://github.com/opentibiabr/canary/blob/main/src/creatures/players/grouping/party.cpp (lines 625-699)
- `partyShareRangeMultiplier = 1.5`, `partyAutoShareExperience = true`, `partyListMaxDistance = 30`. https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- Quick loot limit `quickLootMaxCorpses = 30`, `autoLoot = false` by default. Same file.
- Boss reward score per player = (damageOut / totalDamageOut + damageIn / totalDamageIn + healing / totalHealing) / 3. Expected score = 1 / participants. Loot factor = (1 / participants^(1/3)) scaled up by how far the player beats the expected score. Unique items only roll for the top score. https://github.com/opentibiabr/canary/blob/main/data/scripts/systems/reward_chest.lua (lines 30-102), https://github.com/opentibiabr/canary/blob/main/data/libs/functions/monster.lua (line 207)
- Reward corpses keep their owner logic across decay (`!isRewardCorpse()` guard) and GMs cannot open them. actions.cpp line 355, item.cpp line 808.
- The Party Hunt Analyser has a global block (loot, supplies, balance) and a per-player block. https://tibiaqa.com/8200/how-does-the-party-hunt-analyser-works . TibiaMaps' splitter takes the pasted analyser output and returns the transfers to settle. https://tibiamaps.io/tools/loot

### Inferences
- Tibia's split is "pool everything, settle in gold later". It works because most loot is sold to NPCs and is fungible. It breaks for rare items, which is where party drama comes from.
- The boss reward chest is Tibia's admission that open looting fails for high-value shared kills.

### Gaps
- Reward chest expiry (fans say 7 days) not confirmed in code within budget.

---

## Q3. OSRS: private then public ground items

### Takeaway
OSRS drops loot on the ground, visible only to the top damage dealer for 60 s. After that, tradeable items are visible to everyone until 120 s. Untradeable items stay private and last 180 s. Other players do not see a greyed item. They see nothing. That makes "is this mine?" trivial: if you can see it, you can take it.

### Cited findings
- "Tradeable drops will remain on the ground for 200 game ticks (2 minutes or 120 seconds)." Untradeables last 300 ticks (180 s). "Invisible to other players for the first 100 game ticks (1 minute or 60 seconds)." Exception: non-food items a player drops by hand in the Wilderness are visible to others at once. https://oldschool.runescape.wiki/w/Drops
- The player who did the most damage sees the drop first. If the monster healed, a later attacker can end up with most damage. Same page.
- Large monsters always drop on their south-west tile. Same page.
- Death items history: items dropped on death in PvP were changed to be visible only to the killer for 1 minute and everyone else for the next 59 minutes. Earlier rules included 3 minutes invisible, then 1 minute owner only. https://oldschool.runescape.wiki/w/Death (patch history)
- One OSRS tick is 0.6 s (100 ticks = 60 s, per the Drops page).

### Inferences
- Hiding instead of greying saves bandwidth (no item packets to non-owners for 60 s) and removes temptation. But it can feel like the world is "empty" when several players fight together, and new players cannot learn that a teammate got a drop.
- The 60 s private window is six times Tibia's 10 s. OSRS has no corpse container, so it needs a longer window for the owner to walk over.

---

## Q4. Ragnarok Online: three priority tiers

### Takeaway
rAthena gives ground loot to the top three damage dealers in stages: 3 s top-1 only, then 2 s top-1 and top-2, then 2 s top-1 to top-3, then anyone. MVP bosses use 10 + 10 + 2 s. The first attacker gets a 30 % bonus to their damage for this ranking. Party members inherit their teammate's tier only when the party has item share on. Pickup reach is 2 cells. Floor items vanish at 60 s.

### Cited findings
- `item_first_get_time: 3000`, `item_second_get_time: 2000`, `item_third_get_time: 2000` ms. `mvp_item_first_get_time: 10000`, `mvp_item_second_get_time: 10000`, `mvp_item_third_get_time: 2000`. `first_attack_loot_bonus: 30` ("Officially 30% of the total damage... is added"). `flooritem_lifetime: 60000`. `item_auto_get: no`. https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf
- `pc_takeitem`: `check_distance_bl(fitem, sd, 2)` (2 cells). Top attacker waits 0. Second waits until `first_get_tick`. With party share on, a member gets the best tier any online party member holds. https://github.com/rathena/rathena/blob/master/src/map/pc.cpp (line 6189)
- Party options: `party_item_share_type` 0 to 3, mode 2 is round robin. `show_party_share_picker: yes` announces who got what. https://github.com/rathena/rathena/blob/master/conf/battle/party.conf

### Inferences
- The tiers say "you helped, you get second dibs". Short windows (7 s total) keep the screen moving in crowded fields. The first-attack bonus rewards the puller, which Tibia does not.

---

## Q5. WoW: tagging history

### Takeaway
WoW moved from "first party to hit owns it" to "up to five ungrouped players can share a tag" and "everyone gets credit on world bosses". The often-quoted "2014 Warlords open tagging" date does not match the wiki. The no-tap state appeared on the Timeless Isle (patch 5.4, 2013). General multi-tap for all creatures came in patch 7.0.3 (Legion pre-patch, July 2016).

### Cited findings
- Classic: one player taps by first damage, for their whole party. Retail: up to five non-grouped players tap with any hostile action. Greyed unit frames tell ineligible players the mob is taken. https://warcraft.wiki.gg/wiki/Tap
- Patch history: 3.0.8 aggro spells tap immediately. 5.1.0 world bosses tap-to-faction. 2014-04-07 hotfix, world bosses no longer tap-to-faction. 7.0.3 "All creatures and NPCs can now be tapped by up to 5 other characters." 8.0.1 world bosses tap-to-faction in War Mode. Same page.
- No-tap was "originally introduced in the Timeless Isle". Same page.
- The wiki calls it griefing to tap mobs to block others, or to rush a mob another player was about to pull. Same page.
- In Legion, outdoor content used Personal Loot regardless of the leader's loot setting. https://worldofwarcraft.blizzard.com/en-gb/news/20151961

### Inferences
- Greyed nameplates are the clearest "not yours" signal any game here uses. They show before the fight, not after the kill.

---

## Q6. Party loot modes: free for all, round robin, need/greed, master looter, personal

### Takeaway
WoW ran the full menu for 14 years, then cut it to personal loot only in 2018, then brought group loot back for raids in 2022. Each mode failed in a known way. Free for all rewards fast clickers. Round robin can be gamed by choosing kill order. Need/greed invites ninja needs. Master loot invites ninja masters. Personal loot removes all of that and also removes the social moment of handing out gear.

### Cited findings
- Old WoW modes: free for all, round robin ("a savvy player can manipulate the order that kills are made"), master loot, group loot with a quality threshold (default Uncommon), need before greed. Gold always split evenly. https://warcraft.wiki.gg/wiki/Loot
- Master loot: "gives the Master Looter a lot of power to abuse". Only the master looter at kill time can loot. If they leave, nobody can. https://warcraft.wiki.gg/wiki/Master_looter
- Need roll window: Need > Transmog (10.1.0) > Greed > Pass. Timing out counts as Pass. If everyone passes, the item becomes free to loot. Ties use a hidden second roll. Before patch 1.9 players typed "n" or "g" and /roll by hand, the usual ninja tactic. https://warcraft.wiki.gg/wiki/Need_Before_Greed
- Patch 1.7.0 added the Need/Greed/Pass roll window. 3.3.0 restricted Need to usable gear. 5.0.4 added AoE loot. 6.0.2 personal loot in all raid difficulties, and missed personal loot is mailed. 6.2.0 personal loot drop count tied to group size. 8.0.1 "The ability to change loot modes has been removed. Personal loot is now the sole option." 10.0.0 group loot re-added. https://warcraft.wiki.gg/wiki/Loot , https://warcraft.wiki.gg/wiki/Need_Before_Greed
- Trade window: BoP instance drops can be traded to group members "for up to two hours after they dropped" (7200 s). Enchanting or socketing ends it. Personal loot is tradeable only if it is not an item-level upgrade for the looter. https://warcraft.wiki.gg/wiki/Bind_on_Pickup , https://warcraft.wiki.gg/wiki/Loot
- 2018 reaction. Ion Hazzikostas announced master loot removal in a live Q&A. Stated goals were ending guild "split raids" and "issues of friction". Critics said it punished ordinary guilds. https://www.invenglobal.com/articles/6226/master-loots-removal-deals-another-blow-to-wows-dwindling-sense-of-community , https://mein-mmo.de/en/world-of-warcraft-removes-the-loot-master,217617/ , https://us.forums.blizzard.com/en/wow/t/remove-force-personal-loot-in-guild-raids/203941?page=7
- Dragonflight raids are group loot only. https://www.raider.io/news/460-group-loot-in-vault-of-the-incarnates-do-we-like-it
- FFXIV: players describe a 300 s Need/Greed/Pass window per item and ask for it to be shorter. https://forum.square-enix.com/ffxiv/threads/376344-Loot-Lockout (player reports, not official text)
- PoE: free for all, short allocation, permanent allocation. Allocation goes to a random nearby member and ends when they leave the area. Maps are always allocated. https://www.poewiki.net/wiki/Partying . Short allocation is reported at about 3 s (PoE1) and 5 s (PoE2), and permanent at about 5 min. https://ru.pathofexile.com/forum/view-thread/1301318 , https://steamcommunity.com/app/2694490/discussions/0/594008890765590489 (community reports)

### Inferences
- The 2018 to 2022 WoW swing says players want both: no ninja risk in pickup groups, and a way to give gear to the right person in trusted groups. The trade window is what makes personal loot bearable.
- A 300 s roll timer is far too long for a Tibia-paced hunt. Seconds matter more than fairness there.

---

## Q7. Instanced per-player loot vs shared world drops

### Takeaway
GW2 gives every contributor their own loot from the same corpse, with a contribution threshold of about 5 to 10 % of the enemy's health. FFXIV FATEs grade contribution into Gold, Silver and Bronze. Both remove competition between strangers. Both remove the drama and the "steal" story too.

### Cited findings
- GW2: each participant may loot the body. Full credit needs about 5 to 10 % of the enemy's health in damage. "The loot dropped is unique to the player." The same rare can drop for several players. Support actions (boons, condition removal, revives, heals) count as partial participation. A Jan 26 2016 update requires active attacking to block AFK aura farming. https://wiki.guildwars2.com/wiki/Loot
- GW2 corpses with loot sparkle and stay longer. Rare drops show as a wooden chest, exotic and ascended as a steel chest over the corpse. AoE loot radius = 900 units, once per second. Same page.
- FFXIV FATE medal comes from damage, hits taken and healing. Gold gets full rewards, some minions need Gold, Shared FATE progress counts only Gold. https://www.fandomspot.com/ffxiv-what-are-fates/ , https://www.destructoid.com/what-are-shared-fates-in-final-fantasy-xiv
- WoW world bosses and Legion outdoor content: personal loot and credit for everyone. https://warcraft.wiki.gg/wiki/Tap , https://worldofwarcraft.blizzard.com/en-gb/news/20151961

### Inferences
- Per-player loot doubles the item count to track per kill, but each client only receives its own. Bandwidth per viewer stays flat. Server memory grows with participants.
- Per-player loot clashes with a full-loot PvP economy. If every helper gets their own drop, items inflate. Tibia's boss reward chest scales loot down with participant count (`1 / n^(1/3)`) to counter that.

---

## Q8. Ninja looting, kill stealing and PvP corpse looting

### Takeaway
Griefing follows whatever the ownership rule rewards. First-tag rewards tag-racing (WoW Classic). Top damage rewards out-damaging the puller (Tibia, OSRS). Free for all rewards fast clickers. Rolls reward ninja needs. Short owner windows plus open PvP (Tibia) let the victim answer a thief with violence, and the skull system prices that violence.

### Cited findings
- WoW tap griefing examples: tapping to block quests, rushing a mob another player was about to engage. https://warcraft.wiki.gg/wiki/Tap
- OSRS: a player who did half the damage can lose the drop if the monster heals. https://oldschool.runescape.wiki/w/Drops
- Tibia: after the lock, "it's possible to steal the loot from a creature another player killed." https://tibia.fandom.com/wiki/Loot
- Tibia player corpses carry no owner in Canary (see Q1). PvP corpses are open to anyone at once. Killers carry `pzLocked` 60 s and white skull 15 min. https://github.com/opentibiabr/canary/blob/main/config.lua.dist
- OSRS PvP deaths show items to the killer for 1 min first. https://oldschool.runescape.wiki/w/Death
- WoW battleground corpse looting gives a little gold and removes the insignia, forcing the victim to the graveyard. https://warcraft.wiki.gg/wiki/Loot

### Inferences
- Tibia's PvP corpse is the one place where "anyone can loot right away" helps the pillar of meaningful death. A third party can swoop in, and that is part of the story.
- OSRS's "killer sees it first" for PvP is fairer to the winner and stops vultures. It also removes the third-party swoop.

---

## Q9. Visibility: hidden, greyed, or shared?

### Takeaway
Three designs exist. Hide other people's items (OSRS during the private window, GW2 personal loot). Show but mark as not yours (WoW grey tag, PoE allocated item names). Show everything and block the action (Tibia, where non-owners see the corpse but get "You are not the owner", and get no loot highlight). For a shared screen with 30 players, hiding wins on clarity and bandwidth. Show-and-block wins on drama and learning.

### Cited findings
- Canary loot highlight only for players allowed to open. https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp
- OSRS: drops invisible to others for 60 s. https://oldschool.runescape.wiki/w/Drops
- WoW: unit frames turn grey for players who cannot tap. https://warcraft.wiki.gg/wiki/Tap
- PoE: allocation shows on the label. A bug fix mentions an extra click when allocation changed under the cursor, which shows the allocation is visible and changes live. https://www.poewiki.net/wiki/Partying

---

## Comparison table for a Tibia-like 2D MMO with open PvP

Ratings are author judgement, 1 to 5. Timers are cited above.

| Rule | Owner window | Party | Clarity | Fairness | MMO fit | Speed (cost) | Notes |
|---|---|---|---|---|---|---|---|
| Tibia corpse owner (Canary) | 10 s, top damage, then public until 670 s | any member opens | 3 | 3 | 5 | 5 | Free, sprite stage is the timer |
| OSRS private then public | 60 s hidden, public to 120 s | none (no party share) | 5 | 4 | 4 | 5 | Hiding saves packets |
| rAthena 3 tiers | 3 + 2 + 2 s (MVP 10 + 10 + 2 s) | inherits tier if share on | 3 | 4 | 4 | 4 | Rewards helpers and puller |
| WoW multi-tap | up to 5 ungrouped share | personal or group | 5 | 4 | 3 | 3 | Grey nameplates before the fight |
| GW2 per-player | none needed | all contributors | 5 | 5 | 4 | 3 | Kills the "steal" story |
| Need/greed roll | until rolls end (FFXIV ~300 s) | party | 4 | 3 | 2 | 4 | Too slow for hunts |
| Master loot | until ML acts | party | 3 | 2 | 2 | 5 | Trust problem |
| Free for all | 0 s | party | 2 | 1 | 3 | 5 | Fast clicker wins |
| Tibia boss reward chest | private bag | scored per player | 5 | 4 | 4 | 4 | Score = mean of damage, tanking, healing shares |
| PvP corpse, no owner (Tibia) | 0 s | anyone | 4 | 2 | 4 | 5 | Pays off the meaningful-death pillar |
| PvP corpse, killer first (OSRS) | 60 s killer only | n/a | 4 | 4 | 4 | 5 | Stops vultures |

## Recommendation-ready summary for Asterion Online

Inferences, built from the cited data.

1. Keep the Tibia corpse container with top-damage ownership, and add the rAthena first-attack bonus (30 %). That way the puller is not out-damaged by a passing high level. Owner = top damage, last hit ignored.
2. Lengthen the owner window to 15 to 20 s with a visible cue, then make it public. Tibia's 10 s is tight on mobile and web latency. OSRS's 60 s is long for a spam-click corpse game. Show the lock with a tint or small padlock to non-owners, and the loot sparkle only to owners (Canary already does the second part).
3. Optional rAthena-style tier 2: anyone who did at least 10 to 20 % damage gets access after the owner window and before full public. This softens damage racing.
4. Party mode: keep Tibia's "any member opens" as the default. Add two leader options, free for all (default) and round robin for items above a rarity threshold. Skip need/greed rolls for normal mobs. A roll window that long breaks hunt pace.
5. Bosses: use a personal reward chest scored like Canary (damage, damage taken, healing, each as a share). Scale with `1 / n^(1/3)`. Add a WoW-style trade window of 2 h inside the party so people can fix bad luck.
6. PvP player corpses: start with OSRS "killer and their party see and open first for 30 to 60 s", then public. That rewards the winner and still lets a third party arrive late. If the team wants the full Tibia vulture feel, use 0 s. Decide that on the meaningful-death pillar, not on fairness alone.
7. Send loot messages to the party channel ("Loot of a dragon: ...") and build an in-game split helper modelled on Tibia's Party Hunt Analyser. Social fairness then rests on a number, not on trust.
8. Implementation cost: ownership is one owner ID plus one tier deadline per corpse. Change ownership on decay ticks you already run. Gate the loot highlight and the open action on the server, and send the lock state in the corpse packet. Do not send hidden per-player items to non-owners.

## Gaps
- Lost Ark loot rules: not found in budget.
- WoW "Warlords 2014 open tagging": no source found. The wiki puts open multi-tap at 7.0.3 (2016). The Timeless Isle no-tap came in 5.4 (2013).
- FFXIV 300 s roll timer is from player posts, not official docs.
- PoE allocation timers are community reports.
- Official Tibia protection length is unconfirmed beyond fan "about 10 s" and the matching Canary data.
- No measured performance numbers here. Ownership checks are integer compares, so cost is negligible (estimate).

## Sources
- https://github.com/opentibiabr/canary (monster.cpp, item.cpp, items.xml, player.cpp, party.cpp, actions.cpp, game.cpp, container.cpp, reward_chest.lua, monster.lua, config.lua.dist)
- https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/monster/dragons/dragon.lua
- https://otland.net/threads/corpse-owner-duration.239132/
- https://www.tibiaqa.com/14771/if-i-dealt-damage-to-creature-will-get-loot-despite-of-how-long-has-passed
- https://tibia.fandom.com/wiki/Loot
- https://tibiaqa.com/8200/how-does-the-party-hunt-analyser-works
- https://tibiamaps.io/tools/loot
- https://oldschool.runescape.wiki/w/Drops
- https://oldschool.runescape.wiki/w/Death
- https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf
- https://github.com/rathena/rathena/blob/master/conf/battle/party.conf
- https://github.com/rathena/rathena/blob/master/src/map/pc.cpp
- https://warcraft.wiki.gg/wiki/Tap
- https://warcraft.wiki.gg/wiki/Loot
- https://warcraft.wiki.gg/wiki/Master_looter
- https://warcraft.wiki.gg/wiki/Need_Before_Greed
- https://warcraft.wiki.gg/wiki/Bind_on_Pickup
- https://worldofwarcraft.blizzard.com/en-gb/news/20151961
- https://www.invenglobal.com/articles/6226/master-loots-removal-deals-another-blow-to-wows-dwindling-sense-of-community
- https://mein-mmo.de/en/world-of-warcraft-removes-the-loot-master,217617/
- https://us.forums.blizzard.com/en/wow/t/remove-force-personal-loot-in-guild-raids/203941?page=7
- https://www.raider.io/news/460-group-loot-in-vault-of-the-incarnates-do-we-like-it
- https://forum.square-enix.com/ffxiv/threads/376344-Loot-Lockout
- https://www.fandomspot.com/ffxiv-what-are-fates/
- https://www.destructoid.com/what-are-shared-fates-in-final-fantasy-xiv
- https://wiki.guildwars2.com/wiki/Loot
- https://www.poewiki.net/wiki/Partying
- https://ru.pathofexile.com/forum/view-thread/1301318
- https://steamcommunity.com/app/2694490/discussions/0/594008890765590489
