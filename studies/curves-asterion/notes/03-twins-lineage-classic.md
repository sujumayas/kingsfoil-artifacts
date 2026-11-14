# 03. Twins and lineage A: the classic twins (1996 to 2006)

Agent 1, Curves #3 Asterion. Tibia 7.x is excluded here (agent 8 owns it). Scope: the oldest structural twins
of a skill-by-use, death-penalty, corpse-run MMORPG and the patterns they started. Research date 2026-11-13.

Access notes. Fandom wikis (asheron, meridian59, camelotherald) answered HTTP 402, wiki.project1999.com and
uoguide.com answered 403, uo.stratics.com 403, and web.archive.org is unreachable from this tool. Mirrors used:
uo.com publish notes, loresraat.org (Asheron's Call handbook mirror), paullynch.org (EverQuest 2002-2003 guide),
runescape.wiki and classic.runescape.wiki, wurmpedia.com, maxroll.gg, raphkoster.com, eqemulator forum via search
snippets, allakhazam producer letter via search snippet. Where only a search snippet was readable the grade is E3
or E4 and the gap is listed.

---

## Q1. Which twins are kept, and how do they line up against Asterion

### Takeaway
Eight candidates survive, in two tiers. Tier 1 (share four or more conditions): Ultima Online (1997), EverQuest
(1999), RuneScape Classic and RuneScape 2 (2001, 2004). Tier 2 (share two or three, kept for one pattern each):
Asheron's Call (1999, vitae), Diablo II (2000, exp loss as a fraction of the next level, corpse recovery at 75 %),
Wurm Online (2006, slow skill by use), Meridian 59 (1996, the origin of item plus skill loss on death), Dark Age
of Camelot (2001, kept thin for the "soften the penalty by level" natural experiment). MUDs are covered through
Koster's 2008 essay rather than as a twin. No candidate was pruned outright, but Meridian 59 and DAoC carry weak
evidence and should not anchor a report claim alone.

### Structural-twin table
● same, ◐ partly, ○ different, against the Asterion row in CONTEXT.md.

| Twin | Input | Session | Randomness | Cost of failure | Social | Platform | Skill by use | Why kept |
|---|---|---|---|---|---|---|---|---|
| Ultima Online (1997) | ● click to move and target, no reflexes | ◐ persistent, no run; marathons common | ● low, dice per hit and per skill use | ◐ no exp; whole corpse lootable by anyone, ghost walk back | ◐ shared world, open PvP from day one, no group exp | ◐ desktop 2D isometric, text chat | ● all progression is 0 to 100 skills, 700 cap | The first use-based skill MMO at scale; GGS 2002 is the best documented anti-grind fix |
| EverQuest (1999) | ◐ click target, auto-attack, hotkeys; slow beat | ◐ persistent; sessions were hours | ● low | ● exp loss about 10 % of a level and naked corpse run | ● forced grouping, group exp bonus, 6-player groups | ○ 3D desktop | ○ levels only | Defined "corpse run" culture and hell levels; graduated penalty by level 10 |
| RuneScape Classic / RS2 (2001 / 2004) | ● click to move and target, 1 attack per beat | ● persistent; short browser sessions were the norm | ● low | ◐ no exp loss; keep 3 items, rest on the ground about 10 min | ◐ shared world, no group exp, wilderness PvP | ● browser 2D tile, pixel art, text chat | ● every skill by use on one exp table, cap 99 | Closest session and platform match; its 1.104 exp ratio is Asterion's skill curve shape |
| Asheron's Call (1999) | ◐ 3D but slow, click target | ◐ persistent | ● low | ● vitae debt plus half coins plus floor(L/10)+0 to 2 items, corpse 5 min per level | ◐ shared world, fellowships | ○ 3D desktop | ○ exp spent on skills (not by use) | Vitae is the first documented exp debt instead of exp loss |
| Diablo II (2000) | ◐ click, faster beat | ○ run-like acts, but persistent character | ◐ random loot, fixed maps | ● 5 % / 10 % of next level, corpse returns 75 % | ◐ 8-player games, no persistent world | ◐ desktop 2D isometric | ○ levels only | Cleanest formula for exp loss as a fraction of "next level" and recoverable share |
| Wurm Online (2006) | ◐ 3D, timed actions, no reflexes | ◐ persistent, long actions | ● low | ◐ items on corpse, skill loss (unverified) | ● small-group settlements, player economy | ○ 3D desktop | ● 1.0 to 100 skills, gain scaled by action time | The slowest skill-by-use curve ever shipped; sweet-spot rule is reusable |
| Meridian 59 (1996) | ◐ first-person 3D, slow | ◐ persistent | ● low | ● all items dropped, 1 max HP forever, 1 to 2 % of every skill | ◐ small shards, open PvP | ○ 3D desktop | ● skills by use (seven schools) | Origin of "skills shrink on death", the rule Tibia 7.x kept and Asterion dropped |
| Dark Age of Camelot (2001) | ◐ 3D, click target | ◐ persistent | ● low | ◐ exp loss plus constitution loss, gravestone prayer refunds part | ● groups, realm PvP | ○ 3D desktop | ○ levels only | 2001 patches 1.06 and 1.08 softened the penalty within two weeks of launch |

### Cited findings
- UO skill cap "700 total skill points for each character" at release, raised to 720 later. [V, E3] https://uoguide.com/Skill_Cap (search snippet; page blocked on fetch). Official 1999 publish note adds a skill-menu field to see "how close you are to the skill cap (700)". [V, E2] https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/1999-2/1999-publish-01-23rd-november/
- UO total stats capped at 225 for new accounts, 230 after 6 months. [V, E2] https://uo.com/wiki/ultima-online-wiki/player/stats/skills-stats-and-attributes/
- EverQuest: levels 10 and below lose no exp and respawn with gear; level 11 and up lose "typically 10 %" of the current level (range 5 to 10 %) and respawn naked. [V, E3] https://paullynch.org/Everquest/Death
- RuneScape Classic: keep the 3 most valuable items (4 with Protect Items, 0 skulled, 1 skulled with prayer); stackables always drop; the dead player has about 10.5 minutes to return. [V, E3] https://classic.runescape.wiki/w/Death
- Asheron's Call: under level 5 nothing lost; 6 to 10 half pyreals; 21 and up lose floor(level/10) + random 0 to 2 items; above 35 wielded items too; corpse lasts 5 minutes per level, 1 hour minimum. [V, E3] https://loresraat.org/wiki/Recovering_from_Death
- Diablo II: Nightmare 5 %, Hell 10 % of the exp needed for the next level; cannot drop a level; recovering the corpse returns 75 %. [V, E3] https://maxroll.gg/d2/resources/death
- Meridian 59 launched 27 September 1996; death costs 1 permanent max HP (of 150), 1 to 2 % of every skill (of 99 %), and all carried and equipped items. [U, E4] https://tropedia.fandom.com/wiki/Meridian_59 (search snippet only)
- Wurm: skills start at 1.0, free accounts capped at 20, titles at 50/70/90/100. [V, E3] https://www.wurmpedia.com/index.php/Skills
- DAoC 1.06 (11 Sep 2001): no more constitution and exp loss on PvP deaths; 1.08 (13 Sep 2001): exp loss per death reduced above level 30. [U, E3] https://www.scribd.com/doc/313688314/Patchnotes (third-party re-upload)

### Inferences
- Asterion's death penalty sits between EverQuest (exp loss, naked run) and RuneScape (items on the ground, no exp loss): it takes exp like EQ and drops the bag like RS, but never drops all worn gear like UO or Meridian 59. [I]
- RuneScape is the only classic twin that matches session and platform at the same time. Its design decisions about short sessions are the ones to copy; EverQuest's are the ones to learn penalty culture from. [I]

### Gaps
- UO death mechanics page (uoguide.com/Death) blocked; UO corpse decay minutes and the 2003 item insurance are from memory and left out of the table as claims.
- DAoC constitution loss and gravestone prayer percentages not found in a readable source.
- Meridian 59 numbers rest on one fan wiki snippet.

---

## Q2. Skill by use: formulas, caps, atrophy, time to cap, grinding behaviours

### Takeaway
Three generations of skill-by-use gain are documented. UO (1997): a dice roll per use, no difficulty rating at
first, fixed by hand-coded rate tables and then by the Guaranteed Gain System (Publish 16, 23 July 2002) that
awards 0.1 after a timer that grows with total skill. RuneScape (2001): a fixed exp table with a constant 10.4 %
growth per level (2^(1/7)), so "skill by use" is really "exp by action" on a geometric curve, exactly Asterion's
skill shape. Wurm (2006): gain chance from skill versus difficulty, gain size proportional to action time, with a
sweet spot at quality > 0.77 × skill + 23. Every one of them produced macroing or AFK training because gain per
action is small and uniform, and the fixes (GGS timers, UO 8×8 rule removal, Wurm's stamina requirement) are
rules about time, not about dice.

### Cited findings
**Ultima Online**
- Original mechanic: "each time you used a skill, it had a chance of going up"; no difficulty rating at first; watching others could grant gains; 700 cap; unused skills decayed. [V, E2] Koster, "Use-based systems", 18 July 2006. https://www.raphkoster.com/?p=592
- Problems Koster names: uneven use rates (swordsmanship fast, spirit speak slow), players macroing rare skills, RNG seeded by map chunk so failures repeated in place and players moved 8 tiles ("8×8 macroing"), hand-coded tables that "needed constant updates". [V, E2] same URL.
- Sept 2001 team comment proposed GGS to replace "power hour". [V, E2] https://uo.stratics.com/content/interviews/evocare.shtml (403 on fetch; search snippet)
- GGS, Publish 16, 23 July 2002: tracks successful uses only; if no 0.1 gain within the timer, award 0.1; timers run on the server clock so you need not be logged in; timers grow with total skill points; difficulty skills gain only when used "in or around your current skill level" (Magic Arrow at 90 Magery gives nothing). Stat gain limited to 1 per 30 minutes and 6 per day. Stated audience: "those who play infrequently" and the unlucky. [V, E2] https://uo.com/?p=11189
- GGS timer table (minutes to a guaranteed 0.1 at 700 total skill): 0 to 4.9 = 5 min, 20 to 24.9 = 57 min, 50 to 54.9 = 2.3 h, 70 to 74.9 = 9.0 h, 90 to 94.9 = 22.6 h, 95 to 99.9 = 27.0 h, 115 to 120 = 51 h. At 350 total skill the same rows are 1 min, 12 min, 27 min, 1.9 h, 4.6 h, 5.6 h, 10.3 h. [V, E2] https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/
- Stat atrophy "will now only happen when you reach the stat cap" (patch 10 Nov 1998). [V, E2] https://uo.com/?p=11102
- Skill locks: a skill set to Lock "will not change". [V, E2] https://uo.com/wiki/ultima-online-wiki/player/stats/skills-stats-and-attributes/
- Later aids: Accelerated Gains quests for new characters up to 50 skill in a training area; Scroll of Alacrity 15 min with 0.2 to 0.5 gain per check. [V, E2] https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/

**RuneScape**
- Exp for level L: xp(L) = floor(1/4 × Σ(n=1..L−1) floor(n + 300 × 2^(n/7))). Level 2 = 83, 10 = 1,154, 50 = 101,333, 92 = 6,517,253, 99 = 13,034,431. Gap between levels grows by 2^(1/7) ≈ 1.10409 (about 10.4 %). Exp per skill capped at 200,000,000 (32-bit storage). Exact exp shown in the stats menu since 13 August 2001. [V, E3] https://runescape.wiki/w/Experience
- First 99: Woodcutting by Everdred on 28 August 2001, about 7 months after the January 2001 launch. [V, E3] https://runescape.wiki/w/Skill_mastery
- No atrophy, no cap on total skills: every skill can reach 99 on one character. [I from the table; the wiki does not phrase it this way]

**Wurm Online**
- Each action has a gain chance from skill level, action difficulty and tool quality; gain amount scales with the action timer ("twice as long gives twice the gain"); max 1.00 per attempt including sleep bonus; failed actions can still give skill; no stamina means much lower gain; improving an item above quality 0.77 × skill + 23 doubles the gain; enemy players in local range reduce gain on PvP servers. [V, E3] https://www.wurmpedia.com/index.php/Skills

### Inferences
- Time to cap in UO, an upper bound from the GGS table alone (GGS is a floor on the gain rate, the dice are extra): summing 50 ticks of 0.1 per 5-point bracket from 0 to 99.9 gives about 1,336 hours of continuous successful use at 350 total skill and about 6,523 hours at 700 total skill. Real players reached 100 far faster because the dice dominate below 70. The table shows where the designers put the wall: the timer triples between 55 and 65 (33 min to 55 min at 350 total, 2.7 h to 4.4 h at 700). [I, computed from the uo.com table]
- RuneScape 92 is half of 99: 6,517,253 × 2 = 13,034,506, within 75 exp of the level 99 total. Players read this as "92 is halfway", which is the folk statement of a geometric curve. [I from the wiki table]
- Asterion's `tries = base × 1.08^(level−10)` is RuneScape's shape with a gentler ratio (1.08 against 1.104) and Tibia's for fishing (1.1). The 1.08 choice makes rung N+1 cost 8 % more, so the "halfway" point of any band sits about 9 rungs below the top instead of 7. [I, K]
- UO's GGS timers being server-clock based is the one classic rule built for infrequent players: a 45-minute session that uses a skill once successfully always banks 0.1 if the timer expired while offline. [I from the Publish 16 text]
- Grinding behaviours by cause: UO macroing came from small gain chance plus no difficulty check (Koster); RuneScape AFK training comes from a fixed exp per action with no failure, so a player who clicks every few minutes loses nothing; Wurm ties gain to action time, which converts AFK into waiting and makes queueing actions the exploit. [I]

### Gaps
- No readable primary source for UO's base gain chance formula (the dice before GGS). uoguide.com and UO Stratics were blocked.
- Hours to 99 in RuneScape by skill and era not fetched; the 1.104 ratio is confirmed, the hours are not.
- Wurm time to 90 or 100 in hours not found.

---

## Q3. Death penalty and corpse run

### Takeaway
The classic penalties split into three families. Exp loss with a naked corpse run (EverQuest: about 10 % of a
level, corpse lasts 30 minutes below level 10 and 7 days above, resurrection refunds 10 to 96 % by spell level).
Item loss with no exp loss (UO: whole corpse lootable; RuneScape: keep 3 items, the rest sits about 10 minutes;
Meridian 59: everything plus permanent HP and skill loss). Debt instead of loss (Asheron's Call vitae, worked off
by earning exp; Diablo II refunds 75 % if you reach the corpse). All three gated the penalty by level: EQ nothing
below 11, AC nothing below 5, Diablo II nothing on Normal. Asterion's rule set (10 % exp, bag always, 10 % per
slot, 30 minute corpse) is a hybrid of EQ and RuneScape with a Diablo-sized number.

### Cited findings
- EverQuest: exp loss typically 10 % of the current level at level 11+, can de-level; corpse decays in 30 minutes at low levels, 7 real days at higher levels, and stays rezzable for 3 played hours; casters lose memorised spells; low levels respawn with gear at the bind point, level 10+ respawn naked. Resurrection refunds: Reconstitution 10 % (cleric 19), Revive 35 % (29), Renewal 50 % (34), Resuscitate 60 % (39), Restoration 75 % (44), Resurrection 90 % (49), Reviviscence 96 % (56). Corpses can be dragged from 50 feet with /corpse; necromancers summon corpses with coffins (1 to 2 pp, 146 pp, 75 pp by tier). Culture: "clerics and paladins are expected to rez group members for free"; planned deaths used as a free teleport home. [V, E3] https://paullynch.org/Everquest/Death
- Koster on corpse runs (17 Nov 2008): "Corpse runs were a powerful social force" in MUDs; they were tolerable in text because travel back was quick, populations were small enough to ask for help, donation rooms existed, and gear was replaceable; 3D travel made the same rule tedious. His thought experiment: UO with instant return to the corpse and instant summoning of friends turns the run into revenge. [V, E2] https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
- Ultima Online: use-based system, no exp to lose; Koster confirms skills decayed at the 700 cap but does not describe skill loss on death. [V, E2] https://www.raphkoster.com/?p=592
- RuneScape Classic: 3 items kept, items visible to others immediately, about 10.5 minutes to recover, 1 extra minute in the Wilderness where the killer alone sees them for the first minute, timers shorten with more players online. [V, E3] https://classic.runescape.wiki/w/Death
- Asheron's Call: vitae reduces skills and max health, stamina and mana by the same percentage and is worked off by gaining exp; half pyreals from level 6; items lost = floor(level/10) + 0 to 2 from level 21; wielded items at risk above 35; corpse lasts 5 min per level (1 hour minimum) and then its items lie on the ground for anyone; 1 minute invulnerable on respawn; consent list of 20 for corpse looting. [V, E3] https://loresraat.org/wiki/Recovering_from_Death. The 5 % vitae per death figure appears in a 2004 Slashdot discussion only. [U, E4] https://games.slashdot.org/story/04/03/05/0356252/50-first-deaths---on-designing-mmo-respawning
- Diablo II: 5 % (Nightmare) or 10 % (Hell) of the exp needed for the next level, never a de-level; 75 % refunded by touching the corpse before Save and Exit; gold loss equals cLVL % below 21 and 20 % at 21+, taken from inventory first then stash in multiplayer; corpses follow you to the next game; after 15 unrecovered corpses the 16th death drops equipped items; Hardcore death is permanent. [V, E3] https://maxroll.gg/d2/resources/death
- Meridian 59: all carried and equipped items dropped, 1 max HP permanent, 1 to 2 % of every skill. [U, E4] https://tropedia.fandom.com/wiki/Meridian_59
- DAoC: PvP deaths stopped costing constitution and exp on 11 Sep 2001 (1.06); exp loss above level 30 reduced on 13 Sep 2001 (1.08). [U, E3] https://www.scribd.com/doc/313688314/Patchnotes

### Inferences
- Minutes lost. EverQuest at 10 % of a level is one to several hours at mid levels because levels took days; Asterion's 10 % of total exp costs about 52 minutes at level 8 by its own test, so Asterion is EQ-sized at low level and much harsher later, since 10 % of total exp grows cubically while EQ's 10 % of one level grows with the level's width only. [I, K] (CONTEXT.md `TestDeathPenaltyCalibration`)
- EQ's 7-day corpse and 3-hour rez window are the opposite of Asterion's 30 minutes: EQ made the corpse a long-term asset you could come back for tomorrow with friends; Asterion makes it a race inside the same session. With 30 to 60 minute sessions, a death in minute 40 cannot be recovered in that session unless the Heartstone and the walk fit in 20 minutes. [I]
- The three "level 10 gates" (EQ 11, AC 5 and 21, D2 Normal) are a cheap onboarding rule none of the modern twins dropped. Asterion has no such gate; its low cost at level 4 is emergent from the exp curve. [I]
- "Res kill" (UO) and gravestone camping (DAoC, treated as legitimate realm PvP by its harassment policy) show that a visible corpse and a known respawn point become PvP bait. Relevant only when Asterion ships PvP. [I] https://camelotherald.fandom.com/wiki/Harassment_Policy?oldid=4381 (snippet)

### Gaps
- UO corpse decay time, healer resurrection and the 2003 insurance change not fetched (uoguide blocked). Agent 2 covers modern UO if needed.
- No measured data (telemetry) on how corpse runs changed play; all effects are E3 culture descriptions.
- AC vitae cap (40 %) and per-death percent not confirmed by a readable primary source.

---

## Q4. The long curve: hours to cap, plateaus, pacing months

### Takeaway
The classics paced months in three ways. EverQuest made specific levels wider ("hell levels" 30, 35, 40, 45 at
double width, then multipliers 1.5 to 3.0 from 51 to 60) and then flattened them in September 2002. RuneScape used
one geometric table where each level costs 10.4 % more than the last, so the last 7 levels cost as much as the
first 92, and 99 became the social goal. UO capped total skill at 700 so the long curve ended in a horizontal
choice (which seven skills), with atrophy as the knob to retrain. Asterion's cubic exp plus 1.08 geometric skills
is RuneScape's table with EQ's level widening built in by the polynomial.

### Cited findings
- EverQuest hell levels: 30, 35, 40 and 45 required about twice a normal level; tier modifiers 1.1 (30 to 34), 1.2 (35 to 39), 1.3 (40 to 44), 1.4 (45 to 50); Kunark 51 to 60 at 1.5, 1.6, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 3.0, 3.0 (values for 55 to 60 disputed between sources). A September 2002 patch "smoothed out" 50 to 60. [V, E3] https://www.eqemulator.org/forums/showthread.php?p=269803 and https://wiki.project1999.com/Level (both via search snippets; direct fetch blocked)
- EverQuest kill exp: mob level squared × ZEM (75 baseline for most outdoor zones) × group bonus and other factors. [V, E3] same eqemulator thread (snippet)
- EQ race and class exp penalties existed (Troll, Iksar, hybrids); exact values not readable. [U, E3] https://wiki.project1999.com/Experience_penalty
- RuneScape: 99 = 13,034,431 exp; 92 = 6,517,253; per-level gap about 75 × 2^(L/7); 200 M cap. [V, E3] https://runescape.wiki/w/Experience
- RuneScape first 99 took about 7 months from launch (Woodcutting, 28 Aug 2001). [V, E3] https://runescape.wiki/w/Skill_mastery
- UO: 700 skill cap and atrophy at the cap (Koster); Scrolls of Power raised individual skills past 100 later. [V, E2] https://www.raphkoster.com/?p=592 and https://uo.com/wiki/ultima-online-wiki/items/scrolls-of-power/
- UO GGS timer wall: 55 to 59.9 = 33 min per 0.1, 60 to 64.9 = 55 min at 350 total. [V, E2] https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/

### Inferences
- Asterion's cubic exp already contains EQ-style widening: exp(L) grows about as L³, so each level is about 3/L wider than the last in relative terms (level 20 to 21 is about 15 % wider, level 100 to 101 about 3 %). It has no hell levels because the widening is smooth. EQ's players named hell levels because the jump was visible; a smooth cubic never earns a name, which is good for fairness and bad for landmarks. [I, K]
- RuneScape's "99 as a goal" works because the cap is visible and shared; Asterion has no cap, so the equivalent landmarks are the skill rungs and world gates (Ingwen at 35, Gorothland at 100). [I]
- UO's horizontal cap is the only classic answer to "no end": at 700 the curve stops going up and starts going sideways. Asterion's no-class, no-cap stance means its late curve goes up forever at 1.08 per rung; after sword 100 (about 707 hours stated) nothing changes shape. [I, K]

### Gaps
- Hours per EverQuest level in the classic era not found with a URL (culture says days per level at 50+; E4).
- RuneScape hours to 99 by skill not fetched.

---

## Q5. Sessions and groups

### Takeaway
Only RuneScape was built for the browser session; UO and EQ assumed hours. Group exp rules: EverQuest paid 2 % per
extra member (max 10 %) until January 2001, then 2/6/10/14/20 % for 2 to 6 members, then 20 to 80 % from May 2003
as the game emptied its lower zones. UO and RuneScape had no group exp at all; kills went to whoever did the
damage. EQ's level gaps between friends were policed by a level range on groups and by zones tuned for a level
band; UO had no levels so the gap was gear and skill, and RuneScape's combat level formula let a level 3 and a
level 60 fish next to each other without conflict.

### Cited findings
- EverQuest group bonus pre-2001: "an additional 2 % experience per group member, not counting the first one", max 10 %. January 2001 producer letter: 2-person 2 %, 3-person 6 %, 4-person 10 %, 5-person 14 %, 6-person 20 %, applied to the total before distribution. [V, E2] https://everquest.allakhazam.com/editorial/011401_EQ_Producers_letter.html (snippet)
- May 2003: group bonus raised from 2 to 20 % to 20 to 80 % for 2 to 6 members. [V, E2] https://everquest.allakhazam.com/story.html?story=1654 (snippet)
- EverQuest culture: groups should not wait long for a rez; rez order on raids; helping with corpse recovery expected. [V, E3] https://paullynch.org/Everquest/Death
- UO GGS designed for "those who play infrequently"; timers refresh offline. [V, E2] https://uo.com/?p=11189
- Koster: small populations made asking for corpse-run help in global chat practical. [V, E2] https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/

### Inferences
- What one hour buys. RuneScape low levels: several skill levels, since levels 1 to 10 cost 1,154 exp total and a tree gives 25. UO at 350 total skill with GGS: at least 60 × 0.1 / timer, so 6 to 12 points below skill 10 and about 2 points at skill 50 even with no lucky dice. EverQuest: an hour at level 30+ is a fraction of a level and one death can erase it, so the session unit was the camp, not the hour. [I, from the cited tables]
- Asterion's party rule (equal split among damage dealers plus a flat 20 %) is EQ's January 2001 rule at the 6-person value for any group size. EQ's 2003 jump to 80 % was a population fix; Asterion's 5 friends have no population problem, so 20 % is the right era to copy. [I, K]
- Friend level gaps: EQ's cubic-ish exp and group level range meant a friend 5 levels ahead out-earned you and locked you out of groups; RuneScape's per-skill exp meant friends shared a spot without sharing a level. Asterion's shared skills-by-use let a lower-level friend still gain sword next to a stronger one, which is RuneScape's property. [I]

### Gaps
- EQ group level range rule (the 2/3 rule) not fetched with a URL.
- No session-length data for any classic twin.

---

## Q6. Onboarding

### Takeaway
RuneScape's Tutorial Island (24 September 2002 to 2012, back since 14 May 2018) is the only classic onboarding
with a documented life cycle: a fixed island, 10 instructors, one skill action each, then Lumbridge. EverQuest and
Asheron's Call onboarded by rule rather than by place: no exp loss below level 11 (EQ) and nothing lost below
level 5 (AC). UO added Accelerated Gains quests later that run skills to 50 fast in a training area (New Haven,
not fetched). Asterion's censo chain is Tutorial Island as a quest chain; what it lacks is the rule-based gate.

### Cited findings
- Tutorial Island released 24 September 2002; taught Woodcutting, Firemaking, Fishing, Cooking, Mining, Smithing, melee against giant rats, banking, Prayer, Magic; replaced by Learning the Ropes (July 2008), restored September 2008, replaced by Unstable Foundations (September 2009), removed from the surface map 28 November 2012, Ashdale tutorial 2013 to 2018, Tutorial Island reinstated 14 May 2018. [V, E3] https://runescape.wiki/w/Tutorial_Island
- EverQuest: at level 10 and below "no exp lost, only the time to recover", respawn with gear. [V, E3] https://paullynch.org/Everquest/Death
- Asheron's Call: under level 5 nothing lost; 6 to 10 half pyreals only. [V, E3] https://loresraat.org/wiki/Recovering_from_Death
- UO: Accelerated Gains quests "for new characters and new skills", up to 50 skill in a training area. [V, E2] https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/
- Diablo II: no exp loss on Normal. [V, E3] https://maxroll.gg/d2/resources/death

### Inferences
- The classics agree on one thing Asterion does not do: the death penalty switches on after the first hours. A rule like "no exp loss below level 8" costs one line and removes the 10-minute loss at level 4 that the calibration test measures. [I, K]
- Tutorial Island's two removals and two returns (2008, 2009, 2018) say that a fixed tutorial place outlives tutorial quests: Jagex kept coming back to it. [I]

### Gaps
- UO Haven / New Haven dates and content not fetched. EQ newbie zone design (guards, newbie yards) not fetched.

---

## Pattern cards

### P1. Guaranteed gain on a clock
- Lineage: UO power hour (pre-2001) -> GGS, Publish 16, 23 July 2002 -> Tibia exercise weapons (agent 2) (why: dice-based gain punished infrequent and unlucky players and rewarded macroing).
- Feeling: Submission with a floor; the session always banks something.
- Mechanism: per skill, a timer T(skill, total) that grows with both; a successful use after T expires grants the minimum rung; timer runs on the server clock, offline included. UO table: 1 min at skill 0 to 27 h at skill 95 (700 total).
- Works: casual sessions, skills used rarely. Breaks: when the timer is the only gain (above 70 in UO the dice rarely hit), players feel the wall and complain the guarantee is fake.
- Evidence: [V, E2] https://uo.com/?p=11189; https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/; complaint thread [U, E4] https://forum.uo.com/discussion/comment/79136
- Cost S. Knobs: T per rung, whether offline time counts, difficulty gate.
- Asterion: `tries` is deterministic already (no dice), so the pattern is instead "one guaranteed try credit per session": the first N hits of a session count double, or a timer banks tries while offline. Cheap, testable with the `-skills` balance print.

### P2. Graduated death penalty by level
- Lineage: EverQuest 1999 (no exp loss at 1 to 10, gear kept) -> Asheron's Call 1999 (nothing under 5, coins only 6 to 10, items from 11) -> Diablo II 2000 (Normal free) -> DAoC 1.08 Sept 2001 (less loss above 30) (why: the first deaths are learning, not failure).
- Feeling: Challenge arrives after Discovery.
- Mechanism: penalty(level) = 0 below L0, then the full rule. Optionally a second step for the top band.
- Works: with a visible threshold players know when they graduate. Breaks: if the threshold is where the content gets hard (EQ level 10 was also where you left the newbie zone).
- Evidence: [V, E3] https://paullynch.org/Everquest/Death; https://loresraat.org/wiki/Recovering_from_Death; https://maxroll.gg/d2/resources/death
- Cost S. Knobs: L0, which components (exp, bag, gear) switch on at which level.
- Asterion: `deathExpLoss = 0` below level 8 and `gearDropChance = 0` below level 5 keeps the censo chain safe without touching the main rule.

### P3. Exp debt instead of exp loss (vitae)
- Lineage: Asheron's Call 1999 vitae -> WoW 2004 durability and rez sickness -> modern "exp debt" (agent 2) (why: loss of progress feels unfair; a tax on future progress feels like a chore you can see ending).
- Feeling: Submission; the debt is paid by playing normally.
- Mechanism: each death adds a percentage to a debt counter that scales skills and max HP down by the same percent; exp earned pays the debt before it pays the level. AC: half the coins lost too.
- Works: with group play, since a weakened player is still useful. Breaks: stacking deaths spiral (weaker means dying more); AC capped it (figure unverified).
- Evidence: [V, E3] https://loresraat.org/wiki/Recovering_from_Death; [U, E4] 5 % per death https://games.slashdot.org/story/04/03/05/0356252/50-first-deaths---on-designing-mmo-respawning
- Cost M. Knobs: percent per death, cap, payoff share of exp.
- Asterion: alternative to −10 % exp. A 10 % debt paid off at 50 % of earned exp costs the same minutes but never de-levels, which the vision's "one session of progress" wording allows.

### P4. Recoverable share at the corpse
- Lineage: EverQuest resurrection spells (10 to 96 % refund by spell tier) -> Diablo II 2000 (75 % refund by walking to the body) -> Dark Souls bloodstain (agent 2) (why: a run back needs a reward beyond the gear).
- Feeling: Challenge then Fellowship (EQ) or Challenge alone (D2).
- Mechanism: on death, store lost exp on the corpse; touching it, or a friend's spell, returns a fixed share.
- Works: when the walk is short enough to try in the same session. Breaks: when the corpse is in a place you cannot reach without dying again (chain death), unless friends can drag or summon it.
- Evidence: [V, E3] https://paullynch.org/Everquest/Death; https://maxroll.gg/d2/resources/death
- Cost S to M. Knobs: refund share, time window, whether a party member can trigger it.
- Asterion: the corpse already lasts 30 min and holds the bag; adding "touch your own corpse within 30 min to recover half the lost exp" turns the corpse run into the recovery mechanic the design wants and makes the Heartstone cooldown matter.

### P5. Visible exp table with a constant ratio
- Lineage: RuneScape 2001 (2^(1/7) per level, 99 cap) -> Tibia skill tries 1.1 -> Asterion 1.08 (why: a geometric table makes every level feel the same percent harder and gives a halfway landmark at a fixed offset from the top).
- Feeling: Submission with Challenge landmarks (92, 99).
- Mechanism: cost(L+1) = cost(L) × r. RuneScape r = 1.104, half of 99 at 92; Asterion r = 1.08, half of rung N at about N−9.
- Works: when the table is visible and the goal is named. Breaks: with no cap there is no 99 to aim at.
- Evidence: [V, E3] https://runescape.wiki/w/Experience; first 99 in 7 months https://runescape.wiki/w/Skill_mastery
- Cost S. Knobs: r, named milestone rungs (titles at Wurm's 50/70/90/100).
- Asterion: name rungs the way Wurm names titles; show "tries to next rung" the way RuneScape showed exp since 13 August 2001.

### P6. Horizontal cap (skill total cap with atrophy)
- Lineage: UO 1997 (700 total, 100 each, atrophy at cap, lock arrows) -> SWG 2003 (surrender a skill to learn another, Koster) (why: a use-based system with no cap ends in everyone having everything).
- Feeling: Expression; the build is a choice.
- Mechanism: Σ skills ≤ cap; at cap, a skill marked "down" loses what a skill marked "up" gains.
- Works: with many skills (UO 49+). Breaks: with 4 skills it is a template picker, not a build.
- Evidence: [V, E2] https://www.raphkoster.com/?p=592; https://uoguide.com/Skill_Cap (snippet); https://uo.com/wiki/ultima-online-wiki/player/stats/skills-stats-and-attributes/
- Cost M. Knobs: cap, atrophy rate, locks.
- Asterion: does not fit the no-cap pillar with four skills; recorded as the anti-twin that explains why Asterion's late curve has no horizontal turn.

### P7. Hell levels (deliberate width spikes)
- Lineage: EverQuest 1999 (30, 35, 40, 45 at 2×; 51 to 60 at 1.5 to 3.0) -> removed September 2002 (why: players noticed and named them; smoothing was the fix).
- Feeling: Challenge the players did not ask for; the named plateau.
- Mechanism: exp(L) × m(L) with m stepping at chosen levels.
- Works: as a shared landmark that groups rally around. Breaks: as soon as players can see the multiplier they resent it; Sony removed them.
- Evidence: [V, E3] https://www.eqemulator.org/forums/showthread.php?p=269803; https://wiki.project1999.com/Level (snippets)
- Cost S. Knobs: which levels, multiplier.
- Asterion: anti-pattern. The cubic already widens levels smoothly; do not add steps. The world gates (35, 100) are the landmarks instead.

### P8. Skill loss on death
- Lineage: Meridian 59 1996 (1 to 2 % of every skill plus 1 max HP) -> UO murderer penalties -> Tibia 7.x (skills and magic level drop on death) -> Asterion drops it deliberately (why: it punished the slowest curve the hardest and made the long curve reversible).
- Feeling: Challenge turned to dread; the loss touches months, not a session.
- Mechanism: skill_exp −= p % on death.
- Works: in permadeath-adjacent shards with small populations. Breaks: when skill-by-use already takes hundreds of hours.
- Evidence: [U, E4] https://tropedia.fandom.com/wiki/Meridian_59; Asterion decision [K] CONTEXT.md.
- Cost S. Knobs: p, which skills.
- Asterion: confirmed anti-pattern; the record shows the choice has 30 years of lineage behind it.

---

## Glossary additions
- Corpse run: the walk from the respawn point back to one's corpse to recover its items or stored exp inside a time window. Source: https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
- Skill atrophy: the loss of skill points from a skill marked to fall, or from disuse, used to free room under a total skill cap. Source: https://www.raphkoster.com/?p=592
- Guaranteed gain: a timer-based minimum skill gain granted after successful use without a dice gain. Source: https://uo.com/?p=11189
- Vitae (exp debt): a percentage penalty to skills and maximum vitals that shrinks as experience is earned, instead of removing experience. Source: https://loresraat.org/wiki/Recovering_from_Death
- Hell level: a level whose exp width is multiplied above its neighbours, visible enough that players named it. Source: https://www.eqemulator.org/forums/showthread.php?p=269803
- Group bonus: a percentage added to a kill's exp before splitting it among party members. Source: https://everquest.allakhazam.com/editorial/011401_EQ_Producers_letter.html

## See it in action
- Ultima Online: https://uo.com/?p=11189 (Publish 16 GGS notes)
- EverQuest: https://paullynch.org/Everquest/Death
- RuneScape Classic: https://classic.runescape.wiki/w/Death; RuneScape exp: https://runescape.wiki/w/Experience
- Asheron's Call: https://loresraat.org/wiki/Recovering_from_Death
- Diablo II: https://maxroll.gg/d2/resources/death
- Wurm Online: https://www.wurmpedia.com/index.php/Skills
- Meridian 59: https://massivelyop.com/2016/02/27/the-game-archaeologist-meridian-59/
- Dark Age of Camelot: https://www.scribd.com/doc/313688314/Patchnotes (third-party; camelotherald.fandom.com blocked)

## Sources
1. UO skill gain and GGS table. https://uo.com/wiki/ultima-online-wiki/skills/skill-gain/
2. UO Publish 16, 23 July 2002, Guaranteed Gain System. https://uo.com/?p=11189
3. UO Team Comment, skills and stat gain, 20 Sept 2001 (blocked; snippet). https://uo.stratics.com/content/interviews/evocare.shtml
4. UO Skill Cap (blocked; snippet). https://uoguide.com/Skill_Cap
5. UO Publish 1, 23 Nov 1999 (skill total field, cap 700). https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/1999-2/1999-publish-01-23rd-november/
6. UO Skills, Stats and Attributes (225 cap, locks). https://uo.com/wiki/ultima-online-wiki/player/stats/skills-stats-and-attributes/
7. UO patch 10 Nov 1998 (stat atrophy only at cap). https://uo.com/?p=11102
8. UO Scrolls of Power. https://uo.com/wiki/ultima-online-wiki/items/scrolls-of-power/
9. Koster, Use-based systems, 18 July 2006. https://www.raphkoster.com/?p=592
10. Koster, Why are corpse runs bad?, 17 Nov 2008. https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
11. EverQuest, On Death and Dying (2002-2003 guide). https://paullynch.org/Everquest/Death
12. EverQuest hell levels and exp formula, Torven treatise (snippet). https://www.eqemulator.org/forums/showthread.php?p=269803
13. Project 1999 wiki, Level (blocked; snippet). https://wiki.project1999.com/Level
14. Project 1999 wiki, Experience penalty (blocked). https://wiki.project1999.com/Experience_penalty
15. EverQuest producer letter, January 2001, group bonus (snippet). https://everquest.allakhazam.com/editorial/011401_EQ_Producers_letter.html
16. EverQuest, New Group Bonuses Being Tested, May 2003 (snippet). https://everquest.allakhazam.com/story.html?story=1654
17. RuneScape wiki, Experience. https://runescape.wiki/w/Experience
18. RuneScape wiki, Skill mastery (first 99s). https://runescape.wiki/w/Skill_mastery
19. RuneScape wiki, Tutorial Island. https://runescape.wiki/w/Tutorial_Island
20. RuneScape Classic wiki, Death. https://classic.runescape.wiki/w/Death
21. Asheron's Call handbook mirror, Recovering from Death. https://loresraat.org/wiki/Recovering_from_Death
22. Slashdot, 50 First Deaths, 5 March 2004 (vitae 5 %). https://games.slashdot.org/story/04/03/05/0356252/50-first-deaths---on-designing-mmo-respawning
23. Diablo II death, maxroll. https://maxroll.gg/d2/resources/death
24. Wurmpedia, Skills. https://www.wurmpedia.com/index.php/Skills
25. Meridian 59, Tropedia (snippet, E4). https://tropedia.fandom.com/wiki/Meridian_59
26. Meridian 59, Massively OP Game Archaeologist. https://massivelyop.com/2016/02/27/the-game-archaeologist-meridian-59/
27. DAoC patch notes 1.06 and 1.08, Sept 2001 (third-party re-upload). https://www.scribd.com/doc/313688314/Patchnotes
28. DAoC harassment policy (gravestone camping). https://camelotherald.fandom.com/wiki/Harassment_Policy?oldid=4381
29. UO forum, "Guaranteed" Gain System bugged? (E4). https://forum.uo.com/discussion/comment/79136
