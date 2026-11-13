# 08. Social mechanics: leaderboards, ghosts, races, sharing, identity

Researcher 08. Scope is the design and player experience of the social layer for a time-attack game played by a
collective of about 5 friends on the web, with a per-map global board, seasons, a local ghost and a finish duel
against your own best. Agent 09 covers the timer, ghost formats and anti-cheat; I touch them only where the
social side depends on them. Facts about the current build are marked [K] and come from `01-current-build.md`.
Web facts carry a source number; "[vendor]" marks figures a publisher reported about itself.

## Q1. Leaderboard design that keeps a 5-player community alive

**Takeaway.** Big games never show one flat global board. Trackmania layers world, continent, country and
region ladders over every map and resets a campaign board every 3 months; Steam gives every title a free
"friends only" read filter; Neon White hides friend and medal times until you have run the level once. For a
board with 5 names, the global board is already a friends board, so the design problem flips. The rank number
stops mattering and what keeps people coming back is a reason to re-run (medals, a weekly map, a rival
notification) and a board that still looks alive when 4 of the 5 did not play this week.

**Cited findings.**
- Trackmania ranks every player in 10 categories from Unranked to "World 1", which holds the ten best players
  in the world. Points come from trophies, each with a fixed point value [1].
- Seasonal campaign: 25 maps split into 5 difficulty tiers (White, Green, Blue, Red, Black), 4 medals per map
  (Bronze, Silver, Gold, Author), 100 medals per campaign. Campaigns rotate every 3 months. Players compete on
  "worldwide & regionalized rankings". When the season ends the campaign records board is closed and a winner
  crowned, but the permanent per-map boards keep accepting records [2]. Summer 2020 was the first season; its
  winner (Hefest) was rewarded with a rare "Trophy 9" [3].
- Trackmania's official esport splits regional rankings into EMEA, APAC and NCSA [74]. The in-game zone ladders
  (world, continent, country, region) are exposed by the live leaderboards web service, which takes a zone id
  per request [11].
- Cup of the Day: a 10-minute Time Attack qualifier on the Track of the Day, then players are seeded into
  knockout divisions of up to 64; the first knockout round is a warm-up with no elimination; last player
  standing wins their division [4]. It launched at 19:00 CET once a day [5] and became 3 cups a day at 8-hour
  intervals in the 12 March 2021 update [6]. Cup of the Week documents the knockout counts: 4 players out per
  round from 64 down to 17, 2 per round from 16 to 9, 1 per round from 8 to 2 [7].
- Steamworks: up to 10,000 leaderboards per title, one entry per player, an int32 score plus up to 64 int32s
  of detail data, a "Friends" read setting ("the game can only read leaderboard scores for friends of the
  user"), KeepBest or ForceUpdate on upload, and "Trusted" writes that block client uploads [12].
- Neon White: completing a level "unlocks a leaderboard with your friends' times" and shows the time needed for
  the next medal [13]. Designer Russell Honor's rule, "only show players information that's helpful to them at
  the time". Friend times and medal times stay hidden until you have attempted the level [14]. Esposito says
  the game is "built from the ground up with replaying levels and competing for leaderboard times" [16].
- Spelunky daily challenge (Steam, 8 Aug 2013): one attempt per day, same seed for every player, and "each
  Daily has its own leaderboard" [33][35]. The seeds differ between Steam and PSN [35].
- Fall Guys shipped with 60 players per show instead of 100 [27]. Qualification per round reported as 40 of 60
  by one guide [28] and as 60 to 45 to 27 to 18 to a final of about 10 by another [29]. The free-to-play Season
  1 ran 21 June to 29 Aug 2021, about 10 weeks [31].
- Mirror's Edge (2008) Time Trials rank you by a star total. Achievements fire at 20, 35 and 50 stars, and the
  Pure Time Trials DLC at 90 [56]. The star total is a leaderboard for people who will never hold a record.
- Geometry Dash publishes its own leaderboard rules as a PDF [68]; levels earn stars only when RobTop rates
  them [65].

**Inferences.**
- With 5 players the per-map top list of 7 [K] never pages. The value of the board is as a feed, not a table.
  Show the date and the delta since the previous holder next to each row so the board reads as history.
- Steal Trackmania's split between a permanent per-map board and a closable season board. The current build
  wipes scores and local ghosts when `SEASON` changes [K]. Keeping the all-time board and only resetting a
  "this season" column keeps old PBs from vanishing, which hurts most when there are only 5 of them.
- Medals are the cheapest "board for the rest of us". Four medal times per map (bronze, silver, gold, author)
  cost a few numbers in the map data and give every player a next target that is not a friend's time.
- A daily or weekly map with its own board (Spelunky style, one seed per day) gives a 5-player group a reason to
  open the game on the same day, which is what a static board cannot do.
- Percentile ranks make sense only above about 50 players. Below that, show "2nd of 5" and the gap in ms.

**Gaps.** I did not find Nadeo's own documentation of the four zone ladders, only the API. No published figure
for how many Trackmania players a region board needs to feel alive. Neon White's exact friend notification text
was not found. Fall Guys qualification counts differ by source and era.

## Q2. Ghosts and shadows as social objects

**Takeaway.** Every mature time-attack game lets you pick which ghost you race, and the valued ones are the
ones you can name. Trackmania loads any leaderboard record as a ghost with one click; Mario Kart Wii turned the
staff ghost into an unlock gate and later let you download rival and friend ghosts; Mirror's Edge let you tap a
friend's time and race their ghost. SpeedRunner's duel against your own shadow is the right finish moment, and
the next step is letting that shadow belong to a friend.

**Cited findings.**
- Trackmania (2020): the in-game records widget shows an eye icon next to each record "to load its ghost into
  your session", and the ghost file of any record (including the world record) can be downloaded from the
  trackmania.io leaderboard [8]. Medal ghosts can be selected in the stock game except the author's; racing one
  specific player needs the Openplanet mod [9]. A community plugin turns a chosen player's PB into a medal target
  [10].
- Mario Kart Wii: beating a staff ghost unlocks its expert version; unlocking 4, 8, 12 and 24 expert ghosts
  unlocks Funky Kong, Baby Luigi, the Spear and the Sprinter, all 32 unlock Mii Outfit B. Rival, Champion and
  Friend ghosts were downloadable over Wi-Fi Connection. Mario Kart 8 Deluxe keeps separate 150cc and 200cc
  staff ghosts [57].
- Mirror's Edge (2008): "Extras > Leaderboards", tap a friend's time, race their ghost. The leaderboards were
  reported dead by December 2019 [56].
- Trials Evolution reached 500,000 players in its first month, with over a million entries on custom-track
  leaderboards and 800,000 UGC reviews in Track Central [54] [vendor]. Trials Fusion kept the Evolution
  framework and made it "easier than ever to track your rivals' progress" [55].
- Neon White: a friend's name and score appear on the end-of-level board after every level and work as
  motivation "to do a tiny bit better" [17]. The leaderboard exists because a friend sent back a list of best
  times an hour after receiving the prototype [13].
- Dustforce: console versions save replays locally and the PS3 version shared to YouTube [75]. The community
  leaderboard (Dustkid) ranks score runs by completion, score, finesse then time [76]. Speedrun rules note the
  replay function desyncs slightly and can run out of memory on long replays [77]. I could not confirm the
  claim that any leaderboard entry is watchable in-game, see Gaps.
- SpeedRunner today: the shadow is only your own fastest run, 30 Hz, 18 numbers per frame, about 100 KB per
  60 s run as JSON in localStorage, drawn at 10% alpha during the run and 37.5% in the duel; the duel is a
  3.7 s cutscene (tie 2.4 s) [K].

**Inferences.**
- The duel is already the "defeat the ghost" moment that Mario Kart gets from an unlock screen and Trackmania
  from a finish-line ghost. Its strength is that it converts a number (minus 0.4 s) into a picture (a head
  falls). Keep it, and make the loser visible to the winner's friends (see Q6).
- The cheapest social upgrade is a second shadow slot. Let the player pick "race: my best / friend X's best /
  WR / author". A friend's ghost at 100 KB is a single GET; agent 09 can shrink it (delta coding, fewer pose
  channels) but the design only needs one chosen ghost at a time.
- The duel against a friend's shadow should be opt-in on the friend's side (their ghost is public once they
  tick a box), which also doubles as the "verified tier" of Q7.
- Author ghost: for 4 hand-built maps, record the map author's run and ship it as the author medal time plus
  ghost. Trackmania treats the author medal as the top medal and withholds its ghost; for a 5-person collective
  the opposite works better, show it, because the author is a friend.

**Gaps.** Dustforce in-game replay browsing of any leaderboard entry is unverified. No Trackmania statement on
what the ghost finishing animation does. Mario Kart staff ghost unlock margins in seconds were not found.

## Q3. Asynchronous and live races

**Takeaway.** Live races need a lobby, a synced start and a shared clock; asynchronous races need only a seed
and a deadline. For 5 friends on the web, the cheapest fun is a weekly seeded map with a deadline and a
"ghost race" against a friend's run, then a 2-player live duel with a shared countdown. SpeedRunners proves a
screen-edge elimination works for 4, Fall Guys proves counts per round, Ultimate Chicken Horse proves a scoring
table that rewards being the only finisher.

**Cited findings.**
- SpeedRunners (DoubleDutch, Early Access 2013): 4 racers share one screen that follows the leader; a player
  pushed off the screen edge is eliminated; a limited boost meter lets trailing players catch up or lets the
  leader push stragglers off; the screen contracts to keep rounds short [19][20][21]. Casper van Est: Mario
  Kart "was obviously an influence on its design" [23]. tinyBuild's video interview on building the community
  exists [22].
- Super Mario Bros. 35: 35 players per match, released for the 35th anniversary in 2020 [36]. Mario Royale
  (InfernoPlus, June 2019) ran up to 75 players through the NES levels in a browser and was taken down by
  Nintendo the same month; it was rebranded DMCA Royale and then closed [37][38].
- Fall Guys: 60 players, rounds of about 40 to 45 qualifying from 60, down to a final of about 10 [27][28][29].
- Ultimate Chicken Horse scoring options: solo points (extra when you are the only finisher), postmortem points
  (finishing after dying), trap points (each player who dies on your trap), coin points, and a "Too Easy, No
  Points" rule, off by default, under which nobody scores if everyone finishes [24][25].
- racetime.gg: every entrant clicks Ready (and must be live on stream if the race requires it), then a countdown
  that "typically lasts for 15 seconds"; chat commands .ready, .unready, .done, .forfeit; LiveSplit can join
  the room and start on the countdown automatically [39][40].
- Trackmania Cup of the Day is the template for a live time attack with no simultaneous collision: 10 minutes of
  solo time attack, then knockout rounds where everyone starts together and the slowest are removed [4][7].

**Inferences.**
- Cheapest live format for 5 friends: a 2 to 5 player "room" where everyone presses Ready, a shared 3-2-1 from
  the server, and each client runs its own deterministic sim (the build already drives movers from run time
  [K]). Only positions need to be exchanged, at 10 to 15 Hz, to draw the others as shadows. No collisions, no
  rollback. This is Cup of the Day's knockout round, not SpeedRunners.
- Second cheapest: asynchronous "race against X's ghost live", which costs nothing beyond Q2's friend ghost.
- SpeedRunners' screen-edge elimination needs shared physics and a shared camera, so a web port is a networking
  project. The design lesson that does port is the catch-up tool and the shrinking window; in a ghost race the
  equivalent is the ghost fading when it is more than one screen ahead.
- UCH's "solo points" and "no points if everyone finishes" translate to a weekly map where a clear counts for
  points only if someone failed, which pushes a 5-player group to pick harder weekly maps.

**Gaps.** No DoubleDutch designer text on how the elimination threshold is computed. SRL's countdown length
was not confirmed. Jackbox-style phone racers were not researched.

## Q4. Level sharing and curation

**Takeaway.** The sharing rule that mattered most was Nintendo's "clear it before you upload it" (2015). The
discovery tools that mattered were course IDs, likes and clear rates, and an editorial pick list. Upload caps
were small (32 then 64 then 100 per maker). For a tiny team the minimum is a level encoded in a URL plus a daily
or weekly seed, with the author's own clear as the publish gate.

**Cited findings.**
- Super Mario Maker (Wii U, 2015) manual: "Before you can upload a course, you'll have to prove that you can
  clear it." Sample courses and other makers' courses cannot be uploaded [41]. Nintendo threatened to block
  online features for rule breakers in March 2016 [43] and clarified deletion guidance in April 2016 [73].
  Nintendo later froze new uploads, which let Team 0% finish clearing every course [42].
- Super Mario Maker 2: Course World opened with 32 upload slots per maker, 64 on 24 July 2019 [45], 100 on
  7 Jan 2020 to mark 10 million uploaded courses [44] [vendor]. Nintendo advertised a course by its ID
  (24Y-BMK-5JG) [45]. The World Maker update (v3.0, 22 Apr 2020, "final major update") lets a maker upload one
  Super World of linked courses [46].
- LittleBigPlanet level counts [vendor]: 1 million [47 and its predecessor], 2 million (2009) [47], 4 million
  (April 2011, LBP1 plus LBP2) [48], 6 million (Jan 2012) [49], 8 million across the series including Vita [50].
  The 10 million claim was not found. Mm Picks were staff-chosen levels the team found impressive that week
  [51]; an Mm Picks section was added to the website around the 2 million milestone [47]. "Feel the love"
  trophy: a published level hearted by 10 or more people [52]. The PS3 servers closed in September 2021 [53].
- Trials Evolution's Track Central collected over 800,000 UGC reviews in the first month [54] [vendor].
- Geometry Dash: only RobTop rates levels; in-game moderators can "send" a level to him; no number of sends
  guarantees a rating; lists are rated by RobTop alone via the moderator Discord [65][66]. Demon is a tier above
  10 stars [67].
- Trackmania Exchange hosts community maps outside the game [search results; see Sources 2 and 11 context].

**Inferences.**
- Minimum viable sharing for SpeedRunner: maps are already arrays of `[x, y, w, h, tag]` solids [K]. A map of
  a few hundred solids is a few KB; base64 of a compressed JSON fits in a URL hash. A "share" produces
  `?level=<code>`, and the server only needs to store the code against a short ID if URLs get long.
- Adopt the 2015 rule. A level publishes only with the author's clear attached, and that clear becomes the
  author medal and author ghost at zero extra cost.
- Curation at 5 players is "hearts" plus a pinned list the collective edits by hand. Clear rate per level
  (clears / starts) is the one statistic worth storing from day one, since the server already sees starts and
  submits [K].
- A seeded daily map (Spelunky style) is cheaper than sharing if the generator for THE DUNGEON [K] is reused
  with the date as seed.

**Gaps.** LBP 10 million level figure unverified. Ultimate Chicken Horse level sharing (whether and when it was
added) not verified. Mario Maker 2 like counts, clear-rate display and death markers not confirmed by a primary
source in this pass. Line Rider and Happy Wheels sharing not researched.

## Q5. Identity and cosmetics (short)

**Takeaway.** In a race, cosmetics are telemetry. You need to know whose ghost that is at a glance. The current
hat and kimono colours [K] are enough if the ghost keeps the owner's colours.

**Cited findings.**
- Fall Guys free-to-play Season 1 (21 June 2021): a 100-tier pass of costumes, emotes and celebrations; premium
  access 950 Show-Bucks; free track pays back 300 Show-Bucks, premium 1,200 [30][31]. Later passes dropped to
  70 tiers and were renamed Fame Pass [30][32].
- Trackmania ties seasonal "Prestige Skins" to medal counts in the campaign [2].
- Mario Kart Wii gave characters and vehicles for beating expert ghosts [57].
- Neon White, Celeste and Super Meat Boy races carry no cosmetic economy; Super Meat Boy's guest characters are
  unlocks, not purchases (not re-verified here).

**Inferences.**
- Give each named player a fixed colour pair (hat, kimono) and draw their ghost in those colours at ghost
  alpha. Unlock new colours from medals, Trackmania style, not from a shop.
- The duel cutscene gains meaning when the shadow wears the friend's colours.

**Gaps.** Fall Guys cosmetics share of revenue was not found and would be vendor data anyway. SpeedRunners
trails and character unlock rules not found.

## Q6. Streaming and spectating culture, shareable runs

**Takeaway.** The run becomes shareable when a stranger can read it in two seconds. On stream that is the
timer with splits (LiveSplit) and an input display; off stream it is a share card. Wordle's spoiler-free emoji
grid (16 Dec 2021) is the model for a text that shows the shape of a run without the video.

**Cited findings.**
- LiveSplit is the standard timer, added to OBS as a window capture and resizable [71][72]. Speedrun.com lists
  NohBoard ReWrite, GamepadViewer and RetroSpy as input viewers [63]. Some boards require an input display as
  proof below a threshold time, for example emulator runs under 4:57.000 in one community [search results, see
  Q7 verification posts].
- Trackmania replays and ghosts are downloadable files per record from trackmania.io [8].
- Wordle's share button, added 16 December 2021, copies a grid of coloured squares with no letters [69][70];
  one timeline reports players rising from about 12k in Dec 2021 to about 300k by 1 Jan 2022 [70, weak source].
- racetime.gg requires entrants to be live on stream before Ready when a race is stream-required [39].

**Inferences.**
- A SpeedRunner share text in Wordle's shape: map name, time, and one glyph per section coloured by delta
  against PB (green faster, red slower, grey new). Five sections, so five squares. Copy to clipboard, no video.
- A share card (PNG from the canvas) with the stick samurai pose, time, splits and the duel verdict costs one
  `canvas.toDataURL` and is the only asset friends will post.
- Replay export is the ghost file (Q2) plus the map ID; a replay link `?map=m2&ghost=<id>` that plays the
  ghost alone is cheap because the renderer already draws ghosts.
- Input display in-game (arrows that light up) is a few rectangles and doubles as a verification aid (Q7).

**Gaps.** GDQ layout conventions and Twitch clip statistics not found in this pass.

## Q7. Toxicity, cheating and trust at small scale

**Takeaway.** Every board that matters runs two tiers, a raw submitted list and a verified one, and the
verification is social (people watch the replay). Trackmania's 2021 sweep checked 400,000 records and found
most cheated ones came from 10 logins. For 5 friends the escape hatch is a friends-only board where trust is
assumed and the global board is "unverified until a friend has watched the ghost".

**Cited findings.**
- Trackmania, May 2021: Wirtual and donadigo exposed players slowing the game to 40 to 80 percent speed;
  Nordavind released riolu on 24 May 2021 [59][80][60]. Nadeo ran detection over more than 400,000 records and
  most cheated records came from just 10 logins [58]. Before the tooling, verification meant downloading a
  replay and guessing what the player did [60]. Nadeo documents a report-player flow [61].
- speedrun.com moderation rules: moderators may demand extra proof for highly competitive times, including
  "demonstration of skill over a period of time via streaming" [62]. Boards can require verification without
  video; many require video only under a threshold [64]. Queues can take 2 to 3 weeks [search results].
- Geometry Dash: moderators cannot rate, they send; RobTop rates [65][66].
- Super Mario Maker: Nintendo blocked online features for rule breakers (2016) [43].
- Mario Kart: ghost data is uploaded and the staff ghost system is server-side [57]; verification details not
  found.
- SpeedRunner today: a device token claims a name (3 to 16 chars, 409 when taken), a run id is issued at start
  and checked at submit, and a run is rejected under 6,000 ms or with invalid steps [K].

**Inferences.**
- Two-tier board: a row shows as "unverified" until its ghost has been uploaded and either replayed against the
  deterministic sim (agent 09) or watched by another player who taps "looks legit". With 5 players the second
  path is enough and takes one click.
- Name squatting at 5 players is solved by an allowlist the collective owns, not by code.
- Friends-only board as default view, global as a tab. The friends list is the collective, hard-coded or by
  invite code.
- Impossible times are easier to spot when the board shows the WR ghost; a 5-player community will watch it.

**Gaps.** Mario Kart's server-side ghost verification rules not found. No published false-positive rates for
any of these systems.

## Q8. Retention loops for a collective of 5

**Takeaway.** The loops that fit are already half built. The PB chase with split deltas exists; the medal chase
costs four numbers per map; the rival notification costs one push or one line on the title screen; the weekly
challenge costs a seed and a date. Trackmania shows the order of priority, a 3-month season, a daily track, and
medals on every map.

**Cited findings.**
- Trackmania: campaign every 3 months, 25 maps, 100 medals, Track of the Day every day, Cup of the Day 3 times
  a day since March 2021 [2][6].
- Spelunky: one attempt per day per daily, own board per day [33]. Game Developer framed dailies as "the 24-hour
  ticket" [34].
- Neon White: friend times unlock after your first attempt, and the next medal time is shown with them [13][14].
  Esposito on the origin, a friend who "sent back a list of their best times" an hour after getting the prototype
  [13].
- Fall Guys: a ~10-week season with a 100-tier pass [30][31].
- Mario Kart Wii: expert ghost unlocks at 4, 8, 12, 24 and 32 ghosts beaten [57].
- SpeedRunner: 4 checkpoints as splits with deltas against `pbSplits`, results per section, season wipe [K].

**Inferences.**
- Rival notification: on the title screen, "X beat your ROCKY MOUNTAIN by 0.42 s" with a "race their ghost"
  button. The server already knows the previous holder per map, so this is a diff on submit.
- Weekly challenge: one map (or one seed), one board, closes Sunday, winner's ghost becomes next week's author
  ghost. With 5 players a weekly cadence beats daily; a daily board with 2 entries looks dead.
- Medal chase: author time from the author's clear, gold at author plus 5%, silver plus 15%, bronze plus 40%
  (Trackmania does not publish its ratios; these are placeholders to tune from the collective's own times).
- Streaks: count weeks with at least one weekly-challenge finish per player, show it on the board row.
- Season: keep 3 months, do not wipe all-time PBs, archive the season board as a page.

**Gaps.** No telemetry on retention from any of these games is public. Neon White's exact unlock ordering for
friend times versus medal times is from one article [14].

## Candidate technique profiles

1. **Two-tier board (friends and global, verified and raw).** Trackmania zone ladders [1][11], Steam Friends
   read filter [12], speedrun.com verification [62]. Numbers: Steam 10,000 boards per title, 64 int32s of
   detail per entry; Nadeo swept 400,000 records, 10 logins [58].
2. **Season column over a permanent board.** Trackmania 25 maps, 100 medals, 3 months, permanent per-map boards
   survive the season close [2]. Fall Guys Season 1, 21 Jun to 29 Aug 2021 [31].
3. **Pickable ghost slot (mine, friend, WR, author).** Trackmania eye icon per record [8], Mirror's Edge
   friend ghost via leaderboard tap [56], Mario Kart Wii rival and friend ghosts [57]. SpeedRunner ghost 30 Hz,
   18 numbers, ~100 KB per 60 s [K].
4. **Defeat-the-ghost moment.** SpeedRunner duel 3.7 s, tie 2.4 s [K]; Mario Kart Wii unlock gates at 4, 8, 12,
   24, 32 expert ghosts [57].
5. **Medals as the board for everyone.** Trackmania 4 medals per map [2]; Mirror's Edge star total thresholds
   20, 35, 50, 90 [56]; Neon White next-medal time shown with friend times [13].
6. **Seeded daily or weekly map.** Spelunky one attempt, same seed, own board, 8 Aug 2013 [33][35]; Trackmania
   Track of the Day plus Cup of the Day 3 times a day [6].
7. **Knockout time attack room (synced start, no collisions).** Cup of the Day 10 min qualifier, divisions of 64,
   4/2/1 eliminated per round [4][7]; racetime.gg Ready plus 15 s countdown [39].
8. **Shared-screen elimination race (reference only, expensive on the web).** SpeedRunners 4 players, boost
   meter, screen-edge death [19][20][21].
9. **Only-finisher scoring.** Ultimate Chicken Horse solo, postmortem, trap points, "Too Easy, No Points" off by
   default [24][25].
10. **Clear-before-publish level code in URL.** Super Mario Maker 2015 rule [41], SMM2 upload caps 32/64/100
    [44][45], course IDs [45]. Maps are solid arrays [K].
11. **Wordle-style share text and share card.** Share button 16 Dec 2021 [69]; five section squares coloured
    by split delta; `canvas.toDataURL` card.
12. **Rival notification and streaks.** Neon White friend times after first attempt [14]; "X beat your time on
    Rocky Mountain" is a diff on submit against the previous holder.
13. **Owner colours on ghosts.** Fall Guys 100-tier cosmetic pass [30] as the opposite end; SpeedRunner hat and
    kimono colours [K] drawn on friend ghosts.

## Sources

1. Trackmania, "The ranking system in Trackmania". https://www.trackmania.com/news/1020?lang=en
2. Trackmania docs, "What is a seasonal campaign?". https://doc.trackmania.com/play/what-is-a-seasonal-campaign/
3. Trackmania blog, Fall 2020 campaign and Summer 2020 winner. https://blog.trackmania.com/?p=1223
4. Trackmania docs, "How to play Cup of the Day?". https://doc.trackmania.com/play/how-to-play-cotd/
5. Trackmania, "Cup of the Day arrives in Trackmania". https://www.trackmania.com/news/1814?lang=en
6. Trackmania 12 March 2021 update changelog (devtrackers mirror). https://devtrackers.gg/trackmania/p/344aa8e2-12-03-2021-new-update-changelog
7. Trackmania blog, "Cup Of The Week" (26 Jan 2026). https://blog.trackmania.com/2026/01/26/cup-of-the-week/
8. Trackmania docs, "Watch replays". https://doc.trackmania.com/play/watch-replays
9. Trackmania forum on spectating and ghost selection (devtrackers mirror). https://devtrackers.gg/trackmania/p/a6173a84-convoluted-and-bad-designed-spectating-function-it-is-just-bad-or-there-is-a-trick-to-use-it
10. Openplanet plugin "Player Medals". https://openplanet.dev/plugin/playermedals
11. Openplanet web services, live leaderboards (zone parameter). https://webservices.openplanet.dev/live/leaderboards
12. Steamworks documentation, Leaderboards. https://partner.steamgames.com/doc/features/leaderboards
13. GoNintendo, "Neon White dev discusses how the game's leaderboards came to be". https://www.gonintendo.com/contents/6282-neon-white-dev-discusses-how-the-game-s-leaderboards-came-to-be
14. Vice, "Neon White's developers being too good at their own game caused real problems". https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems
15. Vice, "Is a video game beef a beef if the other person doesn't know it's happening". https://www.vice.com/en/article/is-a-video-game-beef-a-beef-if-the-other-person-doesnt-know-its-happening
16. Game Developer, "Neon White and designing for player creativity". https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
17. AV Club, "Neon White will make you hate your friends". https://www.avclub.com/neon-white-will-make-you-hate-your-friends-in-all-the-b-1849095364
18. Sifter podcast, Ben Esposito on cheaters. https://sifter.com.au/post/neon-whites-ben-esposito-on-expanding-the-game-dealing-with-cheaters-and-aesthetic-inspirations
19. Wikipedia, SpeedRunners. https://en.wikipedia.org/wiki/SpeedRunners
20. tinyBuild, SpeedRunners page. https://www.tinybuild.com/speedrunners-1
21. PC Gamer, SpeedRunners Early Access review. https://www.pcgamer.com/speedrunners-review-early-access
22. Game Developer video interview, "Building a community the SpeedRunners way". https://gamedeveloper.com/business/video-interview-building-a-community-the-speedrunners-way
23. Thumbsticks, interview with Casper van Est. https://www.thumbsticks.com/interview-bringing-the-speedrunners-party-to-nintendo-switch/
24. Clever Endeavour support, "Custom rules and presets". https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
25. Clever Endeavour dev blog. https://www.cleverendeavourgames.com/blog/category/Dev+Blog
26. (unused)
27. PCGamesN, Fall Guys 60 players. https://www.pcgamesn.com/fall-guys/player-count
28. Gamepressure, Fall Guys game show guide. https://www.gamepressure.com/fall-guys-ultimate-knockout/game-show-battle-royale/z1d7ae
29. Red Bull, how to win Fall Guys. https://www.redbull.com/ie-en/how-to-win-fall-guys-ultimate-knockout-guide
30. GameSpot, "What's new in Fall Guys Season 1". https://gamespot.com/articles/whats-new-in-fall-guys-season-1-season-pass-show-bucks-and-more/1100-6504755/
31. GINX, Fall Guys free-to-play Season 1 rewards. https://www.ginx.tv/en/?p=32879
32. Epic Games help, Fall Guys Season Pass FAQ. https://www.epicgames.com/help/c-32551467/c-Trending_0/a26073019?lang=en-US
33. Game Developer, "Spelunky's new Daily Challenge destined to infuriate, engage players". https://gamedeveloper.com/business/-i-spelunky-i-s-new-daily-challenge-destined-to-infuriate-engage-players
34. Game Developer, "The 24-hour ticket: examining daily runs". https://gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
35. Spelunky Wiki, Daily Challenge Mode (HD). https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
36. TCRF, Super Mario Bros. 35. https://new.tcrf.net/Super_Mario_Bros._35
37. Nintendo Life, Mario Royale takedown (June 2019). https://nintendolife.com/news/2019/06/super_mario_battle_royale_game_receives_takedown_notice_from_nintendo
38. Techdirt, "Mario Royale becomes DMCA Royale". https://www.techdirt.com/articles/20190627/10152342486/nintendo-does-nintendo-mario-royale-fan-game-becomes-dmca-royale-is-now-dead.shtml
39. racetime.gg help. https://racetime.gg/about/help
40. racetime.gg LiveSplit integration. https://racetime.gg/about/livesplit
41. Nintendo, Super Mario Maker manual, uploading courses. https://microsite.nintendo-europe.com/super-mario-maker-manual/enGB/page_05.html
42. Wikipedia, Team 0%. https://en.wikipedia.org/wiki/Team_0%25
43. Nintendo Life, Nintendo warns rule breakers (March 2016). https://www.nintendolife.com/news/2016/03/nintendo_warns_itll_block_rule_breakers_access_to_super_mario_makers_online_features
44. Nintendo, SMM2 course upload limit increase to 100. https://supermariomaker.nintendo.com/news/course-upload-limit-increase
45. GameSpot, SMM2 upload limit to 64 (July 2019). https://www.gamespot.com/articles/super-mario-maker-2-now-lets-you-upload-a-lot-more/1100-6472553/
46. Super Mario Wiki, SMM2 update history. https://www.mariowiki.com/Super_Mario_Maker_2_update_history
47. PlayStation Blog, LBP "Two Million Levels" edition. https://blog.playstation.com/?p=25109
48. PlayStation Blog, LBP2 hits four million levels (April 2011). https://blog.playstation.com/2011/04/15/littlebigplanet-2-hits-four-million-levels/comment-page-1/
49. PlayStation Blog EU, over 6 million levels (Jan 2012). https://blog.eu.playstation.com/2012/01/31/littlebigplanet-now-has-over-6-million-user-generated-games-levels/
50. Softpedia, LBP 8 million community levels. https://games.softpedia.com/blog/Little-Big-Planet-Has-8-Million-Community-Created-Levels-364874.shtml
51. Media Molecule blog, Mm Picks (Dec 2009). https://www.mediamolecule.com/blog/article/mm_picks5
52. Gamepressure, LBP trophy list ("Feel the love"). https://www.gamepressure.com/littlebigplanet/achievement-list/z6196f
53. Wikipedia, LittleBigPlanet (2008). https://en.wikipedia.org/wiki/LittleBigPlanet_(video_game)
54. New Game Network, Trials Evolution half a million players in first month. https://www.newgamenetwork.com/news/4688/trials-evolution-reaches-half-a-million-players-in-the-first-month
55. PlayStation Blog EU, Trials Fusion leaderboards. https://blog.eu.playstation.com/2014/04/11/find-online-leaderboards-work-redlynxs-latest-stunt-bike-sim/
56. TrueAchievements, Mirror's Edge Time Trials walkthrough. https://www.trueachievements.com/game/Mirrors-Edge/walkthrough/4
57. Super Mario Wiki, Ghost (Mario Kart series). https://www.mariowiki.com/Ghost_(Mario_Kart_series)
58. PC Gamer, Trackmania dev analyses 15 years of records. https://www.pcgamer.com/trackmania-dev-analyses-15-years-worth-of-records-to-root-out-the-cheaters
59. PC Gamer, cheating allegations in Trackmania. https://pcgamer.com/cheating-allegations-catch-up-with-some-of-trackmanias-fastest-drivers
60. donadigo, TMX replay investigation. https://donadigo.com/tmx1
61. Trackmania docs, how to report a player. https://doc.trackmania.com/general/how-to-report-player/
62. speedrun.com, moderation rules. https://www.speedrun.com/support/learn/moderation-rules
63. speedrun.com, resources for speedrunners. https://www.speedrun.com/support/learn/resources-for-speedrunners
64. speedrun.com forum, "Why do some runs have no videos". https://www.speedrun.com/posts/hdosf
65. RobTop FAQ, levels and rating. https://www.robtopgames.com/faq/en/answers/level
66. RobTop FAQ, moderators. https://robtopgames.com/faq/en/answers/moderator
67. RobTop, GDRating.pdf. https://robtopgames.com/files/GDRating.pdf
68. RobTop, GDLeaderboards.pdf. https://robtopgames.com/files/GDLeaderboards.pdf
69. Know Your Meme, Wordle. https://knowyourmeme.com/memes/subcultures/wordle
70. CUNY Pressbooks, "The Wordle Effect". https://pressbooks.cuny.edu/inspire/part/the-wordle-effect-how-five-letters-changed-the-internet/
71. LiveSplit. https://livesplit.org
72. Streamlabs, adding a speedrun timer. https://support.streamlabs.com/hc/en-us/articles/7277782108571-How-to-Add-a-Speedrun-Timer-to-Streamlabs-Desktop
73. Nintendo Life, SMM level deletion guidance (April 2016). https://www.nintendolife.com/news/2016/04/nintendo_updates_its_guidance_on_super_mario_maker_level_deletions
74. Trackmania World Tour 2025 rulebook (regions). https://lab.toornament.com/trackmania/tmwt25-official-rulebook.pdf
75. Wikipedia, Dustforce. https://en.wikipedia.org/wiki/Dustforce
76. Dustkid plugins and leaderboard ordering. https://proxy.dustkid.com/plugins
77. speedrun.com Dustforce DX, replay desync note. https://www.speedrun.com/post/pcgcv
78. (unused)
79. Kotaku, "Trackmania cheating scandal is utterly fascinating". https://kotaku.com/trackmania-cheating-scandal-is-utterly-fascinating-1846960428
80. GGRecon, Nordavind's Bergie on riolu (May 2021). https://www.ggrecon.com/articles/nordavind-bergie-trackmania-interview/
