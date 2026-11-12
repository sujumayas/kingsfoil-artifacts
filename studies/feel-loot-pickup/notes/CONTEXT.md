# Shared context for all LOOT AND PICKUP researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (Compatibility/WebGL2 renderer), also mobile and desktop. Small team. Must run on low-end hardware.
- Target: "Asterion Online", a Tibia-like MMORPG. Top-down 3/4 pixel art, 32x32 tile grid, server-authoritative, many players share the same screen. PvE and PvP. Design pillar: "meaningful death".
- This is study #3 of the **Game feel** series (`feel`).
  - #1 NPCs and dialog: https://kingsfoil-artifacts.netlify.app/feel-npc-dialog-topdown-pixel.html
  - #2 Combat juice: https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel.html . It already covered the kill moment: death flash and squash, corpse appears about 133 ms after the killing hit, Tibia corpses owned by the top damage dealer, corpse rot stages (Canary rat and dragon 300 + 300 + 60 s; combat juice also said "player corpse first stage 10 s", but researchers 04 and 05 found that is a monster corpse value (a Canary monster corpse starts with a 10 s owned stage before 300 + 300 + 60 s, so a dragon corpse lasts 670 s; ownership is erased when that stage decays): Canary player corpses have no owner and stay lootable 1200 + 1200 s, then 1200 s as bones. The report's §12 must list this correction), "players spam-click corpses, so a long animation before loot feels like lag". Do not redo combat feedback; start where combat juice stops, at the corpse.
  - Earlier VFX studies (light, fire, water, fog, ...) cover particles and lighting recipes; link to them instead of repeating.

## THIS study: loot and pickup, constrained to feel, UX, rules and cost
Out of scope: drop-rate economics, item balance, itemization design (affixes), crafting, auction houses. In scope: everything a player sees, hears, decides and feels from the moment a monster or player dies until the item sits in their bag.

## Scope the user picked (all of it)
1. **Drop and reveal**: corpse-as-container (Tibia) vs ground spill (Diablo, OSRS) vs loot bag (RotMG) vs direct-to-bag. Item pop arcs, bounce, spin, landing dust, rarity tiers shown by colour, glow, beams, sound, minimap pings; item labels, label overlap and decluttering, loot filters (PoE, Last Epoch, Diablo II mods, RuneLite ground items), loot messages in chat (Tibia "Loot of a dragon: ...").
2. **Pickup interaction**: click to open corpse, loot window, drag to inventory, walk-over pickup, auto-pickup of gold, magnet pull and its radius, loot-all, AoE loot (WoW, Lost Ark), quick loot hotkeys (Tibia quick loot, Canary autoloot), pet looters (MapleStory, Diablo Immortal), bag-full feedback, stacking, "fly to bag" animation, mobile and touch patterns.
3. **Ownership and sharing**: who may loot and when. Top-damage owner, tagging (WoW tagging changes), owner protection timers then public (Tibia, OSRS ground items visible to others after 60 s, Ragnarok 3 priority tiers), party loot modes (free for all, round robin, need/greed, master looter, personal loot), instanced vs shared loot, ninja looting and kill stealing, PvP corpse looting.
4. **Netcode, crowds, cost**: server-authoritative pickup, two players grabbing the same item, client prediction of a grab and how a rejection looks, item duplication bugs and why they happen, 30 players around one boss corpse, hundreds of ground items and labels on screen, area of interest for items, ground item merging and despawn, bandwidth per item. MEASURED rendering costs where possible.
5. **Death penalty side (user said yes)**: what a player drops on death and how it looks and feels. Tibia (bag loss, blessings, Amulet of Loss, skulls, PvP looting of player corpses), OSRS (items kept on death, gravestones, Death's Office), Ultima Online, Albion full loot, EVE, Escape from Tarkov, Dark and Darker, Lineage II. Corpse runs, how a dropped bag reads on screen, timers, who can loot it, how it feels to lose and to win it.

## The user's priorities (weigh together)
1. **Feel and pixel art**: timing in frames and ms, readability at 32 px, what players praise and hate.
2. **MMO-specific problems**: shared screen, server authority, latency, crowds, PvP fairness, griefing.
3. **Implementation**: Godot 4 (GDScript, web export), data-driven loot presentation.
4. **Runtime cost**: many ground items, glows, labels and pickup effects at once on low-end web. MEASURED numbers where they exist; mark estimates as estimates.

## Reference games (adapt each to 2D top-down MMO)
- 2D MMOs: Tibia (OTClient / TFS / Canary source), RuneScape and OSRS (RuneLite ground items, loot beams, loot tracker), Ragnarok Online (rAthena), MapleStory, Ultima Online, Realm of the Mad God, Albion Online, Margonem, Medivia.
- ARPGs: Diablo I/II/III/IV, Path of Exile 1/2, Grim Dawn, Last Epoch, Torchlight, Lost Ark, Titan Quest.
- Pixel action and roguelites: Hammerwatch I/II, Enter the Gungeon, Nuclear Throne, Vampire Survivors, Moonlighter, Stardew Valley, Terraria, Minecraft (item merging and magnet), Hades, Dead Cells, Spelunky, Binding of Isaac.
- Modern MMOs: WoW (loot window, AoE loot, personal loot history), FFXIV (need/greed), GW2 (personal loot, auto-loot), Black Desert, New World, Lost Ark, Destiny (engrams, exotic drop sound), Borderlands (rarity colours and beams).
- Extraction and full loot: Escape from Tarkov, Dark and Darker, Albion, EVE.
- Theory: reward and anticipation psychology, variable ratio schedules, GDC talks on loot (Diablo III Loot 2.0, Borderlands loot, PoE filter design), "juice" talks.

## Rating criteria for this study (author judgement, 1 to 5)
**Clarity** (how fast a player reads what dropped and whether it is theirs) · **Delight** (pixel art, motion, sound, anticipation) · **MMO fit** (many players, a server, latency) · **Fairness** (ownership, griefing, PvP) · **Speed** (runtime cost on low-end web).

## Report shape (so you know what to collect)
Technique profiles with "In plain words", "How it works (technical)", "Cost / performance", "Games that used it" (URL), "How it feels", "Risks", ratings. Collect concrete parameters: drop arc height and duration in ms or frames, bounce counts, beam heights, glow pulse periods, rarity colour hex values, label sizes and overlap rules, magnet radius in tiles and pull speed, pickup reach in tiles, loot window sizes, owner timers in seconds, despawn timers, party loot rules, server tick, packet sizes, death drop percentages and blessing rules, item caps, ms costs.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (ms, frames, px, tiles, seconds, counts, dates, versions).
- Separate cited findings from inferences. List gaps honestly. Flag vendor-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Fan wikis (TibiaWiki, Fandom) often return 402/403 and archive.org may be blocked. Go to open-source code instead: TFS / Canary (Tibia server, Lua and C++ for corpses, loot, party shared loot, quick loot), OTClient (containers, item rendering), 2009scape / RuneLite (ground items plugin, loot beams, despawn timers), rAthena (Ragnarok item drop priority), Hammerwatch modding docs, decompilations, Godot plugin repos, GitHub READMEs, author pages, GDC Vault pages. Some MediaWiki wikis answer through `api.php?action=parse&prop=wikitext&page=...` (the OSRS wiki and Stardew wiki do).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Use your own scratch folder if you need one: `studies/feel-loot-pickup/notes/scratch-<your-file-number>/`. Never write outside your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words) that lists your 8-12 most important numbers.
