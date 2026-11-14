# 05. Natural experiments: a change, a reaction, a lesson

Agent 3 of the Asterion Curves study. A natural experiment here is a dated change (patch, version, server setting,
new mode) plus the measured or widely reported reaction. Every row carries a verification tag and an evidence grade
as defined in `CONTEXT.md`. Where the reaction is only "the system is still in place N years later" the grade is E3
at best. Vendor-reported figures are flagged "(vendor)".

Access notes: tibia.fandom.com returns HTTP 402 to the fetcher and web.archive.org is blocked; I read TibiaWiki
through the r.jina.ai text proxy (Death, Blessings, Dawnport, Exercise Weapons pages) and could not read the Prey
page (bot check), tibiawiki.com.br (403), strategywiki Tibia/Updates (403) or UESP (403). Items I could not fetch are
tagged [U] with the URL I would check.

## The table

| # | Game | When | Change | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Tibia | 8.4x, winter 2008/09 | Exp loss on death stops being a flat 10 % above level 23 and shrinks with level (3.8 % at 200) | Still live 17 years later; blessings became mandatory purchases | [V, E3] | Scale the penalty to the time it costs, not to the number |
| 2 | Tibia | Blessings (c. 2006/07 [U]); prices 2,000 gp to 200 × (L−20) | Pay gold before death to cut exp/skill loss 8 % each and item loss to 0 % with five | Blessings are the default state of any character above about 50 | [V, E3] | Let players prepay the penalty; it turns dread into a gold sink |
| 3 | Tibia | 8.62, Dec 2010 | Twist of Fate: a sixth blessing that protects the other five on PvP death only | Players treat it as a PvP tax, 8 Tibia Coins or gold | [V, E3] | Separate the PvE penalty from the PvP penalty |
| 4 | Tibia | 10.55, 15 Sep 2014 | Adventurer's Blessing: no PvP death cost until level 21 on Open PvP worlds | Shipped with Dawnport, still in place | [V, E3] | A free grace period for the first hours costs nothing in retention |
| 5 | Ultima Online | Renaissance, 4 May 2000 | Trammel facet: a PvE copy of the world beside Felucca | Subscribers 150 k (Feb 2000) to 250 k (Oct 2000); Felucca "ghost town" per veterans | [V, E1/E3] | Taking the open-PvP cost out of the default world grew the game and split the community |
| 6 | Ultima Online | Age of Shadows, 11 Feb 2003; Publish 18, May 2003 | Item insurance: pay 750 then 600 gp per item to keep it through death; Siege excluded | Peak of about 250 k accounts after AoS (vendor); Siege players refused the feature | [V, E1/E3] | Insurance only works if the penalty was real before it; keep one world without it for the purists |
| 7 | Ultima Online | GGS proposed Sep 2001, live Publish 16, 23 Jul 2002 | Guaranteed Gain System: a timer guarantees a skill tick for working near your level, replacing "power hour" | Power hour faded; GGS still in the game | [V, E2] | A guaranteed trickle beats a daily burst for casual players |
| 8 | RuneScape | 16 Oct 2007 and 10 Dec 2007 | One minute of hidden drops, then gravestones of 3 to 15 min | Gravestones outlived every later rework | [V, E3] | A short private window removes the humiliation of being looted by a bystander |
| 9 | RuneScape 3 | 26 May 2015 "Death Rework" | Death's Office holds items 24 h; reclaim fee 15 % of value down to 0.5 % for 10 M+ items | Fees cut to 0.1 % on 9 Jan 2023; sacrifice option removed | [V, E3] | A fee that is a percentage of wealth is the only penalty that scales with the economy |
| 10 | Old School RuneScape | 2013 to 2015 | Ground timer stretched: 3 min invisible (2013), 30 min (Oct 2014), 60 min (May 2015) | Jagex later called these changes "unpolled" and "temporary" | [V, E2] | Each softening becomes the new baseline |
| 11 | Old School RuneScape | 24 Jun 2020 | Gravestone 15 min, fee 1 k gp on a 100 k item to 100 k on a 10 M item; Death's Office 5 % above 100 k | Survey "mixed"; "many players supportive of a small increase in risk"; hotfixes within 2 days | [V, E2] | Players will vote for more risk if the risk is capped and legible |
| 12 | EverQuest | Sep 2002 patch | Levels 50 to 60 smoothed so 51, 54 and 59 stop being hell levels; same total exp | Hell levels remembered fondly by a minority, hated by most | [V, E2] | A plateau that costs the same total exp but shows no progress feels worse than a uniform grind |
| 13 | EverQuest | 7 Dec 2005 | Monster Mission exp uses hell-level modifiers "to smooth out the experience curve" at 30, 35, 40, 45 | Effectively ended hell levels; fan analysis says the base modifiers never changed | [V, E2] | You can remove a plateau with a multiplier instead of a new curve |
| 14 | Final Fantasy XI | 15 Apr 2005 | From level 25, death costs 8 % of exp to next level, capped at 2,400 exp | Raise II returns 75 %, Raise III 90 %; no loss at or below 30 | [V, E2] | Cap the loss in absolute exp so the cost in minutes stops growing |
| 15 | Black Desert | 1 Jun 2016 | Players with karma at or above 0 no longer lose exp when killed in PvP | Mein-MMO: many called it a "Gamebreaker" for PvP | [V, E3] | Removing a penalty is also a change to the PvP meta |
| 16 | Path of Exile 1 | since 2013, kept | Exp loss on death 5 % in late acts, 10 % in maps; never removed | Yearly forum campaigns; GGG keeps it | [U, E3] | A penalty that only bites at the endgame is tolerable because the early curve is free |
| 17 | Path of Exile 2 | Early Access, Dec 2024 to 2025 | 10 % exp loss from level 71 to 100, plus one map portal | Dozens of top forum threads; devs: loss "isn't punishment" | [V, E2/E3] | Stacking two penalties on one death multiplies the complaints |
| 18 | Valheim | Feb 2021 (EA launch) | 5 % of every skill lost on death, "No Skill Drain" buff for about 10 min after respawn | Buff present by 12 Feb 2021; death-penalty world modifier (1 % to 100 %) added later | [V, E3] | Make the second death free: the corpse run itself is the punishment |
| 19 | Dark Souls to Elden Ring | 2011 to 2022 | Souls dropped on death, recoverable once; Elden Ring drops humanity/hollowing costs and adds Stakes of Marika | Elden Ring sold 25 M+ (vendor) and is called the accessible Souls | [U, E3] | Recoverable currency plus a nearer respawn is the modern floor |
| 20 | Diablo II | 2000, LoD 2001 | Exp loss on Nightmare 5 % and Hell 10 % of current level, 75 % recoverable by touching the corpse | Design unchanged through Resurrected (2021) | [U, E3] | "Recover most of it at the corpse" is the oldest corpse-run mercy |
| 21 | World of Warcraft | Nov 2004 | Resurrection sickness (10 min, −75 % stats) only if you skip the corpse run; 10 % durability loss | Death became a time cost, not a progress cost; the genre followed | [U, E3] | A time penalty with a visible alternative is accepted where a progress penalty is not |
| 22 | World of Warcraft | 2004 beta to launch | Beta "fatigue" cut exp 50 % after hours of play; launch inverted it into rested exp +200 % | Beta revolt (Penny Arcade, 16 Apr 2004); rested exp became standard | [V, E2/E3] | The same curve framed as a bonus is loved and framed as a penalty is hated |
| 23 | World of Warcraft | Shadowlands, Oct 2020 | Level squish 120 to 50; new accounts 10 to 50 in one expansion; 50 to 70 % faster | Alpha speed-leveller reached 50 in under 7 h; backlash over "levels mean nothing" | [V, E3] | Compressing the curve helps newcomers and devalues veterans' numbers at once |
| 24 | Tibia | Summer 2011 (9.x) | Offline training: up to 12 h banked, regenerated 1 s per 1 s online; beds in autumn 2012 | Premium feature kept; OT servers reimplemented it within months | [V, E3] | Offline progress is the honest version of rested exp for a skill-by-use game |
| 25 | Tibia | 24 Apr 2018 | Exercise weapons: 500 charges, 16 min 40 s, 7.2 hits per charge, 25 TC or 347,222 gp | Durable (90 TC) and Lasting (720 TC) tiers added Winter 2020 | [V, E3] | Selling the grind as an item converts time into a cash shop line |
| 26 | Tibia | 10.55, 15 Sep 2014 | Dawnport replaces Rookgaard; leave at 8, forced out at 20; try each vocation on a pedestal | Rookgaard kept for old accounts; Dawnport later replaced by Newhaven (15.12) | [V, E3] | The tutorial island needs an exit level and a free class trial |
| 27 | RuneScape | 2002 to 2026 | Tutorial Island added 24 Sep 2002; replaced Jul 2008 and reverted in 2 months; replaced 2009, 2013; reinstated 14 May 2018 | Jagex swapped tutorials five times and ended up back on the island | [V, E2] | A tutorial you can explain in one sentence beats a cinematic one |
| 28 | Open Tibia servers | 2007 onward | Exp stages: a per-level-band multiplier (for example 50× to level 20, 5× by 100) | Standard on nearly every OT; low-rate "7.4" servers advertise 1× as a feature | [U, E3] | The multiplier table is the cheapest pacing knob a server has |
| 29 | Path of Exile | since 2013 | 3-month leagues: fresh economy and character, a finite curve inside an endless game | Steam concurrent peaks every league start, trough by month 3 | [U, E3] | A long curve needs a scheduled restart or players make their own |

## Write-ups by system

### Death penalty

**1. Tibia: exp loss shrinks with level (8.4x, winter 2008/09).** Before the change every death cost 10 % of total
experience, skill tries and spent mana at every level. TibiaWiki's Death page gives the current rule: levels 1 to
23 still lose 10 %; from level 24 the maximum loss is `((L+50)/100) × 50 × (L² − 5L + 8)` experience, which is
3.77 % of total exp at level 200 and 3.08 % at 2000. The page dates the change to version 8.41 ("introduced changes
to death penalties") without a calendar date; the brief's 2008 matches the 8.4 winter update. Each blessing cuts the
loss by a further 8 % and a promotion by 30 %. Reaction: no survey exists; the evidence is that the rule survived
17 years and that blessings became the expected state of a character, so the penalty is paid in gold in advance.
[V, E3] https://tibia.fandom.com/wiki/Death (read via r.jina.ai). Lesson for Asterion: Asterion's flat 10 % costs
10 min at level 4 and 52 min at level 8 by its own calibration test; Tibia hit the same wall and bent the curve
exactly where a death started costing hours.

**2. Tibia: blessings.** TibiaWiki gives prices: 2,000 gp at or below level 30, `200 × (L − 20)` from 31 to 119,
`20,000 + 75 × (L − 120)` from 120. Item loss falls from 100 % container / 10 % equipment with no blessing to
70/7, 45/4.5, 25/2.5, 10/1 and 0/0 with one to five. The Blessing of the Inquisition (Henricus) sells all five at
10 % extra. I could not fetch the introduction version (the fandom page omits it); the brief's "7.x" era is right
and the exact update is a gap. [V for prices and chances, U for the version, E3]
https://tibia.fandom.com/wiki/Blessings. Lesson: a prepaid, per-level gold cost converts the fear of dying into a
predictable sink, and the full-protection tier (five blessings) is the real "insurance".

**3. Tibia: Twist of Fate (8.62, Dec 2010).** A TibiaQA answer places the PvP blessing in 8.62; it protects the five
regular blessings when the killer is a player, and does nothing against monsters. Price 2,000 gp to 50,000 gp by
level or 8 Tibia Coins. [V, E3] https://www.tibiaqa.com/17944/how-does-twist-of-fate-bless-work-in-tibia and
https://tibia.fandom.com/wiki/Blessings. Lesson: split the penalty by cause of death before PvP ships.

**4. Tibia: Adventurer's Blessing (10.55, 2014).** New characters on Open PvP worlds cannot lose anything to player
killing until level 21 or their first attack on a player. [V, E3] https://tibia.fandom.com/wiki/Blessings.

**5. Ultima Online: Trammel (Renaissance, 4 May 2000).** The expansion mirrored the whole map into a facet where
PvP needed consent. Wikipedia's subscriber table: 150,000 (Feb 2000), 165,000 (Mar 2000), 250,000 (Oct 2000), so
roughly +100,000 in the eight months around the split; it does not attribute the growth. Veterans report Felucca
became a ghost town of reds and faction players (Reddit, anecdote) and "Trammelization" became industry shorthand
for leaving sandbox design. [V for numbers, E1 vendor-reported subscriptions; E3/E4 for the reaction]
https://en.wikipedia.org/wiki/Ultima_Online ,
https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html ,
https://www.wiki.ultimacodex.com/wiki/Trammel_(facet). Lesson: the death penalty's felt weight comes from who can
kill you; removing player killers changed more than any percentage ever did.

**6. Ultima Online: item insurance (Age of Shadows, 11 Feb 2003).** Insured items return to the bank on death for
a fee. Publish 18 (May 2003) cut the base fee from 750 to 600 gp per item and halved auto-renewal after a PvP death
to 300 gp. Siege Perilous and Mugen "will not be getting the Item Insurance feature, in any form". Wikipedia's AoS
row says accounts peaked above 250,000 after the release (vendor figure, and the article's peak dates conflict).
[V, E1 vendor / E2 publish notes] https://uo.com/?p=11298 , https://uoguide.com/Insure ,
https://uo.com/wiki/ultima-online-wiki/player/insurance/. Lesson: insurance arrived only when gear became
"vital"; Asterion's bag-always-drops rule is the pre-AoS state, and its 10 % per gear slot is already a soft form
of insurance.

**8. RuneScape: hidden minute and gravestones (Oct and Dec 2007).** On 16 Oct 2007 dropped items became invisible
to others for one minute and despawned after two. On 10 Dec 2007 gravestones replaced that: 3 to 15 min depending on
the stone bought, blessable to 60. [V, E3] https://runescape.wiki/w/Death_(mechanic) , https://runescape.wiki/w/Gravestone.

**9. RuneScape 3: Death's Office (26 May 2015) and the 2023 cut.** Items held 24 in-game hours; reclaim 15 % of
value for items up to 10,000 gp sliding to 0.5 % at 10 M+, or sacrifice other items at 4× value. On 9 Jan 2023 the
fee fell to 0.1 % (minimum 100 coins per stack), the sacrifice option and 24 h limit were removed and three items
stay free. [V, E3] https://runescape.wiki/w/Death_(mechanic). Lesson: RS3 moved from "time" to "a slice of wealth"
and then shaved that slice to almost nothing; each step was permanent.

**10 and 11. Old School RuneScape: the long softening and the 2020 rework.** Ground timers went from 3 min
invisible plus 1 min private (24 Oct 2013) to 30 min (16 Oct 2014) to 60 min (22 May 2015). Jagex's 24 Jun 2020
post calls those changes "unpolled" and "only ever meant to be temporary". The rework: three most valuable items
kept, the rest in a gravestone for 15 min (timer pauses offline, resets if you die again), food and potions on the
ground for 1 h, a gravestone fee of 1,000 gp on a 100,000 gp item rising to 100,000 gp on a 10 M item, Death's
Office 5 % of GE value above 100,000 and free below, 50 % off for Ironmen, Death's Coffer pays fees at 105 % of
sacrificed value. Jagex reported a survey where some wanted low risk, some the old harshness, and "many players
were supportive of a small increase in risk"; two hotfix rounds followed within 48 hours and a "Poll 71 and Death
Feedback Changes" update came in July 2020. [V, E2] https://oldschool.runescape.wiki/w/Update:Death_Changes ,
https://oldschool.runescape.wiki/w/Death. Lesson: OSRS is the only twin that asked its players first; they chose
more risk than the drift had left them with, as long as the fee was a table they could read.

**12 and 13. EverQuest: hell levels.** The Sep 2002 patch "smoothed out level progression from 50-60" to remove the
penalty effect at 51, 54 and 59 while keeping the total exp to 60 unchanged. On 7 Dec 2005 Monster Mission exp
began applying modifiers that "smooth out the experience curve to lessen the impact of the old hell levels (30, 35,
40, and 45)". An EQEmulator analysis says the hell modifiers themselves never changed and the levels were defused
in the Luclin era by bonus multipliers. [V, E2 for patch text, E3 for the analysis]
https://wiki.project1999.com/Experience_Modifier , https://www.redguides.com/community/threads/patch-message-december-7th-2005.7702/latest ,
https://www.eqemulator.org/forums/showthread.php?p=269802. On corpse runs themselves, Koster's 2008 post argues
corpse decay was what made EQ's run cruel. [V, E2] https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/.
Gap: Guild Lobby corpse summoner (Dragons of Norrath, 2005) not fetched; the fandom page is a stub.

**14. Final Fantasy XI (15 Apr 2005).** Square Enix: from level 25, exp lost on KO is 8 % of the exp needed for the
next level, never more than 2,400. Raise returns 50 %, Raise II 75 % and Raise III 90 % for level 51+. No loss at
level 30 or below (one wiki says 1 to 3; contested). [V, E2] https://www.bluegartr.com/threads/31997-An-Important-Notice-Regarding-Experience-System-Revisions ,
https://www.bg-wiki.com/bg/XP , https://classicffxi.fandom.com/wiki/K.O. Lesson: an absolute cap is the simplest
way to keep "about one session" true at every level; Asterion's percentage has no cap.

**15. Black Desert (1 Jun 2016).** Players at karma 0 or above stopped losing exp on PvP death; negative-karma
players still lose it. Mein-MMO (3 Jun 2016) reports many players calling it a "Gamebreaker" for open PvP. No
later date for a full removal was found; this is the change the brief asked about. [V, E3]
https://mein-mmo.de/en/black-desert-pvp-patch-karma-aenderungen,84434.

**16 and 17. Path of Exile and PoE 2.** PoE 1 keeps exp loss on death (5 % in the later acts, 10 % in maps; [U],
check https://www.poewiki.net/wiki/Experience). PoE 2 Early Access (Dec 2024) applies 10 % of the current level's
exp from level 71 to 100, on top of losing the map portal. Forum threads such as "Concerns About Death Penalty and
Progression in Endgame" and "Punishing Death Penalties and Repetitive Leveling..." run to hundreds of pages; Digital
Trends quotes the developers that the loss "isn't punishment" and signals that the player is in content above their
level. [V, E2/E3] https://www.pathofexile.com/forum/view-thread/3774790 ,
https://web.poecdn.com/forum/view-thread/3811414 , https://digitaltrends.com/?p=3828963 ,
https://mein-mmo.de/en/path-of-exile-2-punishes-players-too-harshly-preventing-them-from-taking-more-risks,1223404.
Lesson: GGG's defence is exactly Asterion's P2 argument. The complaint volume comes from two penalties stacking, not
from the 10 % alone.

**18. Valheim.** Default death: 5 % of every skill plus progress to the next tick; a "No Skill Drain" status for
about 10 minutes after respawn makes a second death free. Guides describing the buff are dated 12 Feb 2021, ten days
after Early Access, so it was a launch feature, not the patch 0.148.6 change the brief guessed (that patch was
campfires and harpoons). The Death penalty world modifier later let hosts choose 1 % to 100 %. [V for the buff and
percentages from guides, E3] https://gamertweak.com/valheim-no-skill-drain-buff-explained ,
https://help.freakhosting.com/games/valheim/configuring-skill-drain-on-death ,
https://gamespot.com/articles/valheim-update-0-148-6-patch-notes-campfire-changes-and-more/1100-6489173/.
Lesson: the grace buff is the cheapest anti-spiral rule in the genre; Asterion has none.

**19 to 21. Elden Ring, Diablo II, WoW.** Not fetched this round; well documented and stable. Dark Souls drops
souls and humanity, Elden Ring drops only runes and adds Stakes of Marika as near respawns [U]
https://eldenring.wiki.fextralife.com/Death. Diablo II: 5 % (Nightmare) and 10 % (Hell) of the exp of the current
level, 75 % recoverable at the corpse [U] https://diablo2.diablowiki.net/Experience. WoW: 10 % durability on any
death, resurrection sickness only if you take the spirit healer [U] https://warcraft.wiki.gg/wiki/Resurrection_Sickness.
Together they are the modern floor: a time cost, a recoverable deposit, no permanent loss.

### Skill by use and grinding

**7. Ultima Online: Guaranteed Gain System (Publish 16, 23 Jul 2002).** The Sep 2001 team comment proposed GGS "to
eliminate the need for power hour", citing "excessive power gaming potential" and "modest benefit to casual
players". GGS runs a timer off the server clock; working a skill near your level guarantees a gain when it expires,
and the old use-based roll stays as a backup so heavy users still gain faster. Example in the notes: crafting daggers
at 80.0 Blacksmithy gives no chance to gain. [V, E2] https://uo.stratics.com/content/interviews/evocare.shtml ,
https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/2002-2/2002-publish-16-part-2-23rd-july/ ,
https://uo.com/?p=6342. Lesson: Asterion's 1.08 geometric tries curve is pure use-based; a GGS-style timer at the
high rungs would protect a 45-minute player from a session with zero skill ticks.

**24. Tibia: offline training (summer 2011) and 25. exercise weapons (24 Apr 2018).** Offline training banks up to
12 hours of training time, regenerated one second per second online, used at a statue or (autumn 2012) a bed.
Exercise weapons: 500 charges at 2 s each (16 min 40 s), 7.2 melee hits per charge, 25 Tibia Coins or 347,222 gp;
Durable (1,800 charges, 90 TC) and Lasting (14,400 charges, 8 hours, 720 TC) followed in Winter 2020. Special dummies
are 10 % more efficient and single-user. The brief's 2019 date for exercise weapons is a year late. [V, E3]
https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/ ,
https://tibia.fandom.com/wiki/Exercise_Weapons (via r.jina.ai). Lesson: both features sell the same thing, skill
progress without attention. Asterion's anti-compulsion stance can keep offline training (progress waits for you)
and must reject the paid version.

**Oblivion to Skyrim (2006 to 2011).** Not fetched (UESP 403). Known shape: Oblivion levels on 10 major-skill ups
and rewards planned attribute spreads (+5 multipliers), so "efficient levelling" punished players who levelled
naturally; Skyrim (11 Nov 2011) levels on any skill and drops attributes. [U, E3] https://en.uesp.net/wiki/Oblivion:Leveling ,
https://en.uesp.net/wiki/Skyrim:Leveling. Lesson for a no-class game: never make the player optimise which skill
they practised before the level tick.

### Long-curve pacing

**22. WoW rested exp (2004).** The beta divided exp by half after a few hours of play; players revolted (the Penny
Arcade strip of 16 Apr 2004 is the usual reference) and Blizzard shipped the inverse, a +200 % bonus that fills while
logged out. The same curve, reframed as a bonus. [V, E2/E3] https://www.psychologyofgames.com/2010/03/framing-and-world-of-warcrafts-rest-system/ ,
https://warcraft.wiki.gg/wiki/Rested , https://www.penny-arcade.com/comic/2004/04/16.

**23. WoW level squish (Shadowlands, Oct 2020).** Cap 120 to 60, veterans squished to 50, new accounts run one
expansion from 10 to 50; MMOGames reports levelling "roughly 50-70% faster"; a Shadowlands alpha speed-leveller hit
50 in under 7 hours (Blizzard: subject to change). [V, E3] https://www.mmogames.com/articles/archives/wow-wednesday-how-shadowlands-fixes-leveling ,
https://www.denofgeek.com/games/world-of-warcraft-shadowlands-leveling/ ,
https://blizzardwatch.com/2019/11/01/level-squish-coming-wows-next-expansion-shadowlands-new-level-cap-60/.

**Tibia double exp, daily reward, prey (2016 to 2019).** Not fetched this round (Prey page returned a bot check).
Known: Prey (bonus damage, defence, exp or loot against a chosen creature) and the Daily Reward System came in the
11.x updates of 2017; the free Training Weapon with 50 charges is a daily reward item. [U, E3]
https://tibia.fandom.com/wiki/Prey , https://tibia.fandom.com/wiki/Daily_Reward_System. Asterion's vision rejects
daily rewards outright; the natural experiment to watch is not whether they retain, but what they do to a 5-friend
group where one logs in daily and the others weekly.

**28. Open Tibia exp stages.** OT servers configure a multiplier per level band (a typical "mid-rate" table: 50× to
level 20, 20× to 50, 5× to 100, 1× after). Low-rate 7.4 revivals advertise 1× as the feature. [U, E3]
https://otland.net/. Lesson: a stage table is one YAML file in Asterion's terms, and is the knob agent 0 should
model first.

### Onboarding

**26. Tibia: Dawnport (10.55, 15 Sep 2014).** Replaced Rookgaard as the beginner island; Rookgaard stayed open to
accounts with a mainland character. Leave at level 8; at level 20 you are teleported out after 5 minutes. Each
vocation is tried by stepping on its pedestal, and can be switched there. Later replaced by Newhaven (15.12).
[V, E3] https://tibia.fandom.com/wiki/Dawnport (via r.jina.ai). Lesson: Asterion has no vocations, so the one
thing Dawnport added that Rookgaard lacked, a reversible class trial, is free. The exit level is still worth copying.

**27. RuneScape: Tutorial Island, five swaps.** Added 24 Sep 2002. Replaced on 14 Jul 2008 by the quest-style
Learning the Ropes (Jagex: more "quest-like and exciting"), reverted 15 Sep 2008 after two months. Replaced by
Unstable Foundations 17 Sep 2009, removed from the map 28 Nov 2012, Ashdale tutorial 2013 to 2018, Tutorial Island
reinstated 14 May 2018, reworked 19 Oct 2026. [V, E2 for dates and the one stated reason] https://runescape.wiki/w/Tutorial_Island.
Lesson: the plain, skippable island won against three more cinematic tutorials. Asterion's optional censo chain is
already in that family.

### Session length

**29. Path of Exile leagues.** About three months each since 2013; Steam concurrent players peak at each launch and
fall through the league. [U, E3] https://www.poewiki.net/wiki/League , https://steamdb.info/app/238960/charts/.
Tibia mounts (9.1, 2011) and travel prices: not fetched. Lesson for Asterion: an endless game without a league
cycle needs another reason to come back on a Tuesday; the vision says "progress waits for you", which is the
opposite bet, and worth stating as a hypothesis to test with the ferry and session telemetry events.

## Recurring lessons

- Every twin that touched the death penalty only ever softened it, and each softening became the new floor (OSRS
  2013 to 2015, RS3 2015 to 2023, FFXI 2005, BDO 2016, Elden Ring). The one counter-example is OSRS 2020, where
  players polled for slightly more risk than the drift had left them, with a legible fee table.
- Penalties expressed as a fixed percentage of total progress fail at scale; the fixes were a shrinking curve
  (Tibia 8.4x), an absolute cap (FFXI 2,400 exp) or a slice of wealth instead of time (RS3, OSRS). Asterion's flat
  10 % is pre-2008 Tibia.
- Prepaid protection (Tibia blessings, UO insurance) turns dread into a routine gold sink, and only works where the
  underlying penalty is real. UO shipped insurance six years after launch, when gear had become the progression.
- Two penalties on one death (PoE 2's exp plus portal, EQ's exp plus corpse decay) draw the loudest reactions; the
  grace mechanics that calm them are cheap (Valheim's 10-minute No Skill Drain, Tibia's Adventurer's Blessing to 21).
- Who can kill you matters more than the number. Trammel added about 100,000 subscribers in eight months (vendor)
  and hollowed Felucca; BDO's karma rule changed the PvP meta more than the exp.
- The same curve framed as a bonus is welcomed and framed as a penalty is rejected (WoW fatigue to rested exp,
  2004). Offline training is the honest form for a skill-by-use game.
- Plateaus that cost the same total exp but show no progress (EQ hell levels) were removed with multipliers, not new
  curves. A stage table is enough.
- Onboarding reverts: Jagex tried three richer tutorials and came back to the plain island; CipSoft kept Rookgaard
  alive beside Dawnport. The skippable, one-sentence tutorial wins.

## Pattern cards found

**Shrinking death percentage**
- Lineage: Tibia 8.4x (2008/09) -> Path of Exile keeps a flat 10 % but only above level 70 -> FFXI caps the
  absolute loss (2005). Why: a flat percentage of a cubic exp curve costs hours by level 50.
- Feeling: Challenge with Submission (the loss stays felt but never ends a night).
- Mechanism: `loss(L) = min(10 %, f(L))` where f falls with level, or `loss = min(p × exp_to_next, cap)`.
- Works when exp per level grows faster than exp per hour. Breaks when levels stop meaning anything (WoW squish).
- Evidence: [V, E3] Tibia Death page; [V, E2] FFXI 2005 notice.
- Cost: S. Knobs: the level where it starts bending (Tibia 24), the floor percentage.
- Asterion: `deathExpLoss` is a constant; the calibration test already shows 10 min at level 4 and 52 min at level
  8, so the bend is needed by about level 12 if "one session" is the target.

**Prepaid protection (blessing / insurance)**
- Lineage: UO insurance (Feb 2003) -> Tibia blessings (c. 2006/07) -> Twist of Fate (2010) splits the PvP case.
- Feeling: Submission turned into Expression (choosing what to protect).
- Mechanism: a per-level gold price buys a reduction of the exp loss and the drop chance; consumed on death.
- Works where gold has a sink problem and death is frequent enough to make the purchase routine. Breaks when the
  price is trivial (it becomes a tax, not a choice) or when it covers everything (UO Siege players refused it).
- Evidence: [V, E2] uo.com Publish 18; [V, E3] TibiaWiki Blessings.
- Cost: S (one NPC, one price formula, one flag per blessing). Knobs: price slope, how many slots it covers,
  whether the bag is ever covered.
- Asterion: the bag always drops whole; a blessing that halves `gearDropChance` and leaves the bag untouched keeps
  the corpse run meaningful while giving the 45-minute player something to buy.

**Second-death grace**
- Lineage: Valheim No Skill Drain (2021) -> OSRS gravestone timer pauses offline and resets on re-death (2020).
- Feeling: Challenge without the death spiral.
- Mechanism: a 10-minute status after respawn during which a death costs no progress.
- Works for a corpse-run game, where the second death happens on the way back. Breaks if it can be farmed (needs
  "no gain during grace" or a trigger only on death).
- Evidence: [V, E3] Valheim guides, OSRS update post.
- Cost: S. Knobs: duration, whether it covers the bag.
- Asterion: the Heartstone is destroyed by death, so the walk back is the most dangerous moment; this card is the
  direct fix.

**Guaranteed gain timer (GGS)**
- Lineage: UO Publish 16 (2002) replacing power hour.
- Feeling: Discovery and Challenge preserved; the "zero-tick session" removed.
- Mechanism: a server-clock timer per skill; the first qualifying use after it expires is a guaranteed gain; the
  timer grows with skill level. Use-based rolls continue in parallel.
- Works at high rungs where tries per rung are in the thousands. Breaks if the timer is short enough to replace
  practice.
- Evidence: [V, E2] UO team comment and publish notes.
- Cost: S. Knobs: timer by rung, which skills.
- Asterion: at sword 100 a rung needs `50 × 1.08^90` tries, about 50,000 hits, or 28 hours at one attack per 2 s;
  a GGS timer of a few hours would guarantee one visible tick per session.

**Exp stage table**
- Lineage: Open Tibia `stages.xml` (2007+) -> WoW heirloom and squish multipliers -> EQ hell-level modifiers (2005).
- Feeling: Fellowship (friends can catch up) over Challenge.
- Mechanism: a per-level-band multiplier on exp gained.
- Works to compress the early curve and to let a new friend reach the group. Breaks when veterans see their
  numbers devalued (WoW 2020 backlash).
- Evidence: [U, E3] OTLand; [V, E3] WoW squish coverage.
- Cost: S. Knobs: band edges and multipliers.

## Glossary additions

- **Blessing** (Tibia): a prepaid, per-level gold purchase consumed on death that reduces exp, skill and item loss;
  five cover everything. https://tibia.fandom.com/wiki/Blessings
- **Item insurance** (UO): a per-item gold fee that returns the item to the bank on death; Age of Shadows, 2003.
  https://uoguide.com/Insure
- **Gravestone / Death's Office** (RuneScape): a timed container at the death spot, then a paid reclaim NPC.
  https://runescape.wiki/w/Death_(mechanic)
- **Hell level** (EverQuest): a level whose exp requirement jumped above the curve's trend, removed by multipliers.
  https://wiki.project1999.com/Experience_Modifier
- **Rested exp** (WoW): a bonus to exp gain that accrues while logged out, the inverted form of a fatigue penalty.
  https://warcraft.wiki.gg/wiki/Rested
- **Offline training** (Tibia): banked skill-training time spent while logged out, regenerated by online time.
  https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/
- **Exp stages** (Open Tibia): a per-level-band exp multiplier table. https://otland.net/
- **Second-death grace**: a short status after respawn during which dying again costs no progress (Valheim "No
  Skill Drain"). https://gamertweak.com/valheim-no-skill-drain-buff-explained
- **Trammelization**: industry shorthand for removing non-consensual PvP from the default world (UO, 2000).
  https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html

## Gaps

- Tibia: the exact update that introduced blessings, the calendar date of 8.41, and the Prey and Daily Reward
  versions were not fetched (fandom 402, bot check). The Tibia news archive at https://www.tibia.com/news/ is the
  next source.
- Albion Online: no dated knockdown or fame change found beyond the Cador update; the official patch archive is
  needed. https://forum.albiononline.com/
- EverQuest Guild Lobby corpse summoner (2005) and the corpse decay timeline: not fetched.
- PoE 1 exact percentages, Diablo II, Elden Ring, WoW resurrection sickness: cited from known wiki pages, [U].
- No twin published before-and-after telemetry for a death-penalty change; the only quantified reactions are UO
  subscriber tables (vendor) and the OSRS survey wording. Asterion's own telemetry (death, session, ferry events)
  would make it the first in this set with real numbers.

## Sources

1. TibiaWiki, Death. https://tibia.fandom.com/wiki/Death
2. TibiaWiki, Blessings. https://tibia.fandom.com/wiki/Blessings
3. TibiaQA, how does Twist of Fate work. https://www.tibiaqa.com/17944/how-does-twist-of-fate-bless-work-in-tibia
4. TibiaWiki, Dawnport. https://tibia.fandom.com/wiki/Dawnport
5. TibiaWiki, Exercise Weapons. https://tibia.fandom.com/wiki/Exercise_Weapons
6. OTLand, Teaser 2: Hone your skills offline (2011). https://otland.net/threads/teaser-2-hone-your-skills-offline.161140/
7. Wikipedia, Ultima Online (subscriber table, Renaissance, Age of Shadows). https://en.wikipedia.org/wiki/Ultima_Online
8. uo.com, Publish 18 (May 2003) insurance price. https://uo.com/?p=11298
9. UOGuide, Insure. https://uoguide.com/Insure
10. uo.com wiki, Insurance. https://uo.com/wiki/ultima-online-wiki/player/insurance/
11. UO Stratics, Team Comment on Skills and Stat Gain, 20 Sep 2001. https://uo.stratics.com/content/interviews/evocare.shtml
12. uo.com, Publish 16 part 2, 23 Jul 2002 (GGS). https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/2002-2/2002-publish-16-part-2-23rd-july/
13. uo.com, Guaranteed Gain System. https://uo.com/?p=6342
14. Engadget, Gordon Walton on how Trammel impacted classic UO (2015). https://www.engadget.com/2015-02-02-crowfalls-gordon-walton-on-how-trammel-impacted-classic-ultima.html
15. Ultima Codex wiki, Trammel (facet). https://www.wiki.ultimacodex.com/wiki/Trammel_(facet)
16. RuneScape Wiki, Death (mechanic). https://runescape.wiki/w/Death_(mechanic)
17. RuneScape Wiki, Gravestone. https://runescape.wiki/w/Gravestone
18. RuneScape Wiki, Tutorial Island. https://runescape.wiki/w/Tutorial_Island
19. OSRS Wiki, Update: Death Changes (24 Jun 2020). https://oldschool.runescape.wiki/w/Update:Death_Changes
20. OSRS Wiki, Death. https://oldschool.runescape.wiki/w/Death
21. Project 1999 wiki, Experience Modifier (Sep 2002 patch text). https://wiki.project1999.com/Experience_Modifier
22. RedGuides, EverQuest patch message 7 Dec 2005. https://www.redguides.com/community/threads/patch-message-december-7th-2005.7702/latest
23. EQEmulator forums, hell level analysis. https://www.eqemulator.org/forums/showthread.php?p=269802
24. Raph Koster, Why are corpse runs bad? (2008). https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
25. BlueGartr, FFXI notice regarding experience system revisions (Apr 2005). https://www.bluegartr.com/threads/31997-An-Important-Notice-Regarding-Experience-System-Revisions
26. BG Wiki, XP. https://www.bg-wiki.com/bg/XP
27. Classic FFXI wiki, K.O. https://classicffxi.fandom.com/wiki/K.O.
28. Mein-MMO, Black Desert karma patch (3 Jun 2016). https://mein-mmo.de/en/black-desert-pvp-patch-karma-aenderungen,84434
29. PoE forum, Punishing Death Penalties and Repetitive Leveling. https://www.pathofexile.com/forum/view-thread/3774790
30. PoE forum, Concerns About Death Penalty and Progression in Endgame. https://web.poecdn.com/forum/view-thread/3811414
31. Digital Trends, PoE 2 developers on the death penalty. https://digitaltrends.com/?p=3828963
32. Mein-MMO, Path of Exile 2 punishes players too harshly. https://mein-mmo.de/en/path-of-exile-2-punishes-players-too-harshly-preventing-them-from-taking-more-risks,1223404
33. Gamer Tweak, Valheim No Skill Drain buff explained (12 Feb 2021). https://gamertweak.com/valheim-no-skill-drain-buff-explained
34. Freakhosting, configuring skill drain on death (Valheim). https://help.freakhosting.com/games/valheim/configuring-skill-drain-on-death
35. GameSpot, Valheim 0.148.6 patch notes. https://gamespot.com/articles/valheim-update-0-148-6-patch-notes-campfire-changes-and-more/1100-6489173/
36. Psychology of Games, Framing and WoW's rest system (2010). https://www.psychologyofgames.com/2010/03/framing-and-world-of-warcrafts-rest-system/
37. Warcraft Wiki, Rested. https://warcraft.wiki.gg/wiki/Rested
38. Penny Arcade, 16 Apr 2004. https://www.penny-arcade.com/comic/2004/04/16
39. MMOGames, How Shadowlands fixes leveling. https://www.mmogames.com/articles/archives/wow-wednesday-how-shadowlands-fixes-leveling
40. Den of Geek, How Shadowlands will change leveling. https://www.denofgeek.com/games/world-of-warcraft-shadowlands-leveling/
41. Blizzard Watch, level squish coming in Shadowlands (1 Nov 2019). https://blizzardwatch.com/2019/11/01/level-squish-coming-wows-next-expansion-shadowlands-new-level-cap-60/
42. Fextralife, Elden Ring Death [U]. https://eldenring.wiki.fextralife.com/Death
43. Diablo Wiki, Diablo II Experience [U]. https://diablo2.diablowiki.net/Experience
44. Warcraft Wiki, Resurrection Sickness [U]. https://warcraft.wiki.gg/wiki/Resurrection_Sickness
45. PoE Wiki, League [U]. https://www.poewiki.net/wiki/League
46. UESP, Oblivion: Leveling [U]. https://en.uesp.net/wiki/Oblivion:Leveling
47. TibiaWiki, Prey [U]. https://tibia.fandom.com/wiki/Prey
