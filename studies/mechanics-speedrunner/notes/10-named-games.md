# 10. The nine named games, one dossier each

Research agent 10. Written 13 Nov 2026. Rules followed from `CONTEXT.md`: every cited claim has a numbered
source in the list at the end, inferences are marked, gaps are listed, vendor figures are flagged [vendor].
Items marked [memory] are facts I am confident about but could not fetch a page for inside the tool budget;
treat them as unverified until someone adds a URL.

Reading order for the report author: the "Transfers" block of each dossier is the part that matters for
SpeedRunner (a solo, side-view, restart-heavy time attack with an online leaderboard, see `01-current-build.md`).

---

## 1. Getting Over It with Bennett Foddy (2017, Bennett Foddy)

### Takeaway
A one-input physics game with no checkpoints and a continuous world. The design lesson is that the *cost of
failure* is the mechanic: the mountain never resets you, it just drops you to wherever you land, and the
narration frames that fall as the content. Almost none of this transfers to a 3.4 s-restart time attack except
the idea that the "feel" of a tool (hammer, katana) can carry a whole game, and the chatroom-at-the-top reward.

### Cited findings
- Release: 6 Oct 2017 (Windows, Humble Monthly), macOS and iOS 6 Dec 2017, Android 25 Apr 2018, Linux 2018.
  Built in Unity by Foddy alone [1].
- Core mechanic: Diogenes sits in a metal cauldron and swings a Yosemite hammer with the mouse or trackpad to
  hook and pull himself up a mountain. No checkpoints; any fall can cost "some or all" progress. Controllers
  are supported but make the game "considerably harder" [1].
- Narration: Foddy planned sarcastic narration, then made it "more or less totally encouraging" because
  players would already be frustrated. He said the "flavor of being sent back" had vanished from design [1].
- Foddy called the game "a choke machine", citing a Frank Lantz talk [2]. He has said the game forces players
  to focus on the emotion of failure (secondary paraphrase) [2].
- Reward: reaching the top sends you into space; the credits ask whether you are recording; if not, you join a
  chatroom of other finishers, hosted by Foddy (confirmed by Foddy at GDC 2019, "Put Your Name on Your Game"
  panel with Zach Gage) [1][3].
- Players: "over 2.7 million players" (Wikipedia, citing a Foddy statement) [vendor] [1].
- Lineage: Sexy Hiking (Jazzuo, 2002), which Foddy met around 2007 through Derek Yu and later called timeless;
  Foddy describes himself as a fan of "messy, realtime physics puzzle games" [1]. QWOP (2008) is Foddy's own
  earlier one-input physics game [memory].
- Successors named as "Foddian" or rage games: Jump King, Only Up!, A Difficult Game About Climbing; Trackmania
  "Deep Dip" community maps; Foddy's Baby Steps (2025) [1]. Pogostuck (2019) and Chained Together (2024) are
  commonly listed in the same lineage [memory].
- Awards: IGF 2018 Nuovo Award [1].
- Design writing: Game Developer pieces "Pain, difficulty and Getting Over It" [4], "Designer interview: the
  aesthetics of frustration in Getting Over It" [5], "How B-games influenced the design of Getting Over It" [6];
  Design Notes podcast episode with Foddy, 13 Mar 2018 [7].

### Inferences
- The difficulty curve is a single continuous surface, not levels. Progress is position, so a leaderboard
  is only possible on total time, which is exactly what the speedrun community did.
- Speedrun: the top any% times are around or just under one minute [uncited, aggregator pages list 59.885 s and
  1:02.703 and 1:09.717 as "world record" videos without category or date; speedrun.com returned 403]. The
  "snake" is the community name for the fast rhythmic hook-and-pull up vertical walls that skips the intended
  route [memory]. Treat the times as approximate until speedrun.com/goi is read.

### Gaps
- speedrun.com leaderboard (403). Current any% WR, runner, date, and whether "Glitchless" is a category.
- Exact wording of the "particular kind of failure" line the user remembers; it is not in the pages fetched.
- Steam concurrent peaks and sales figures beyond the 2.7 M players claim.

### Transfers to SpeedRunner
- Yes: a single verb that is deep (the hammer) and the chatroom reward for finishers (a cheap "finishers only"
  social space, or a finisher list per map, fits a leaderboard game).
- Yes, partly: encouraging narration on failure. A one-line "on death" message that is never sarcastic.
- No: no-checkpoint fall-back. SpeedRunner already restarts the map on death; the Foddy loss model needs a
  continuous world and long sessions.
- No: mouse-physics locomotion. It is incompatible with deterministic ghosts and split comparisons.

### See it in action
- https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy [1]
- https://www.pcgamer.com/if-you-finish-getting-over-it-a-very-awesome-ending-awaits (the ending) [8]
- https://designnotes.libsyn.com/bennett-foddy (Foddy on design, audio) [7]

---

## 2. Doodle Jump (2009, Lima Sky)

### Takeaway
Height is score. A one-axis tilt input, a wrapping screen, and a platform vocabulary where each new power-up is
paired with one new hazard. The "live score markers" on the side of the screen (other players' heights) are the
earliest mainstream asynchronous race UI and the single most transferable idea here.

### Cited findings
- Release: iOS March 2009 (Wikipedia says March; the pocketgamer making-of is dated 8 Sep 2009 and the App Store
  launch is commonly given as 6 Apr 2009 [memory]); Android and BlackBerry 2 Mar 2010; Windows Phone 7 1 Jun
  2011; iPad 1 Sep 2011; Xbox 360 Kinect 28 Jun 2013; 3DS 29 Oct 2013 [9].
- Studio: Igor and Marko Pusenjak, Lima Sky LLC, founded July 2008; Igor in New York, Marko in Croatia [9][10].
- Input: tilt steers on accelerometer devices; tap to shoot (first release shot straight up, directional aim
  added by request, with a setting to turn it off because it made the game harder) [9][10]. Left edge wraps
  to the right [9].
- Elements: power-ups are propeller hats, jetpacks, rockets, springs, trampolines, shields; monsters and UFOs can
  be avoided, shot or jumped on; death by falling, touching a monster, black hole, or UFO abduction [9].
  Platform types (green static, brown breakable, blue moving, white disappearing) [memory].
- Design rule: "each new power-up with one new obstacle" to keep difficulty constant [10].
- Igor: "easy to learn and hard to master"; cites the "perfection is when nothing more can be removed" idea.
  Marko on feel: "the rush you get when the jet pack shoots you up" [10].
- Social: real-time markers showing how far players worldwide have reached; the article claims it was the first
  game to use them [10].
- Development: about 2 months initial build; updates 1 to 2 weeks each; 10 days to fix the 3GS performance bug;
  price 99c [10].
- Numbers [vendor]: 1 M downloads by Dec 2009 and 3 M by early 2010, about 79,000 sold on Christmas Day 2009 [11];
  25,000 copies a day for four months [9]; 10 M sold (March 2011) [12]; 15 M paid downloads later [13];
  150 M total downloads across platforms (148Apps interview) [14]; "a quarter of a billion" downloads (Android
  Central, 2014) [15].
- "Doodle Jump effect": Pusenjak credited success to short sessions, "intuitive and precise tilt controls, one
  hand gameplay" [14].

### Inferences
- Score as height means the leaderboard is literally a vertical ruler. A horizontal time attack can draw the same
  thing as distance markers of other players' PB positions at the current elapsed time (a "pace line").
- Procedural rules are not published. From play: platform density thins with height and hazard rate rises;
  the single safe rule is "always one reachable platform in jump range".

### Gaps
- Published jump height in screens, platform spacing, or the exact generation rules. Not found.
- The 2009 App Store launch date (6 Apr) needs a URL.

### Transfers to SpeedRunner
- Yes: live markers of other players on the track (at time t, where was the WR holder and your friends).
- Yes: "one new element, one new hazard" as a content budgeting rule for new maps.
- No: tilt and endless generation. SpeedRunner is fixed maps with deterministic movers.

### See it in action
- https://en.wikipedia.org/wiki/Doodle_Jump [9]
- https://www.pocketgamer.biz/bouncing-ever-upwards-the-making-of-doodle-jump/ [10]
- https://androidcentral.com/doodle-jump-interview [15]

---

## 3. Jetpack Joyride (2011, Halfbrick)

### Takeaway
One button, three obstacle families with distinct warnings, vehicles as pace breakers, and a mission ladder
(3 visible missions, tiered by session length) that turns an endless runner into a progression game. The mission
tiering is the piece a time attack can borrow directly as "challenges" that do not touch the leaderboard.

### Cited findings
- Release: iOS 1 Sep 2011; Flash web 11 May 2012; Android 28 Sep 2012; PSP Nov 2012; PS3/Vita Dec 2012;
  PS4 26 Apr 2016. Developer Halfbrick Studios; development name "Machine Gun Jetpack" [16].
- Core: one-touch jetpack thrust. Collect coins and Spin Tokens, avoid zappers, missiles and lasers; tokens feed a
  slot machine at the end of each run (the Final Spin); rainbow gear boxes grant vehicles; missions award stars
  that raise the player level [16].
- Design (Luke Muscat, GDC 2012 "Depth in Simplicity: The Making of Jetpack Joyride"): one button because it
  "would appeal to even the most inexperienced players"; the "ad break play" model from Fruit Ninja and Monster
  Dash; depth for fans; 10 months of development; began as a "4 week game gone catastrophically wrong" (GDC
  Vault blurb) [17][18]. Companion talk "Iterating Design and Fighting Fires" (GDC 2012) covers post-launch
  updates [19].
- Mission system (Adrian Crook breakdown): short-term missions for 30 s to 2 min sessions, medium 2 to 10 min,
  long 10 to 30+ min; three-star tiering; "only the three missions on current display can be completed"; some
  missions require buying a store item; vehicles act as pace breakers; jetpacks are cosmetic and do not change
  physics; one character, one currency, no XP; one tap from title to play, one tap after death to replay [20].
- Awards: Apple Design Award 2012, Metacritic 90 (iOS) [16].

### Inferences
- The telegraphing grammar (zapper visible as static geometry, missile with a warning icon and siren, laser
  with a charge-up line) is the useful part for Elements. Each hazard has a different lead time, which is what
  lets one button suffice.
- Speed ramps with distance, which is what makes a run end; no published curve found.

### Gaps
- Download counts (the 350 M and 750 M figures circulate as Halfbrick statements but no page fetched confirms
  them), the speed-vs-distance curve, the exact Final Spin odds.

### Transfers to SpeedRunner
- Yes: a mission ladder off the leaderboard ("finish Rocky Mountain without rolling", "wall-jump 10 times"),
  tiered by how long a player will stay. Three visible at a time is a proven cap.
- Yes: the one tap from death to replay. SpeedRunner's 3 s countdown on every restart is the opposite of this.
- Yes: hazards with distinct lead times and warning signs.
- No: vehicles, cosmetic store as monetization, endless speed ramp.

### See it in action
- https://www.gdcvault.com/play/1015527/Depth-in-Simplicity-The-Making [18]
- https://www.gamedeveloper.com/design/video-depth-in-simplicity-the-making-of-i-jetpack-joyride-i- [17]
- https://adriancrook.com/?p=4709 [20]

---

## 4. Solipskier (2010, Mikengreg)

### Takeaway
The player draws the level under the skier in real time, so the finger is the level. Speed comes from downhill,
air from inclines, and the obstacles announce themselves on the right edge with required altitude and distance.
It is the clearest example of "feedback through audio when the game goes fast" (the headphones fly off and the
music drops to wind).

### Cited findings
- Release: Flash and iOS 29 Aug 2010, Android Nov 2010. Developers Mike Boxleiter and Greg Wohlwend (Mikengreg),
  published by Kongregate [21].
- Core: draw the slope; the skier rides through gates, tunnels and walls; inclines launch tricks, downhill adds
  speed; the skier gets faster over time; consecutive gate passes earn bonus points; upcoming obstacles appear on
  the right side with their required altitude and distance; endless until a crash [21].
- Feel: at high speed the skier loses the headphones and the music cuts to wind; big landings show "All Star Dunk
  Contest-like scorecards" [21].
- Origin: a brainstorm on parallax plus speed; Boxleiter proposed players could "paint the terrain" to control
  speed; prototype in hours; Wohlwend did grayscale mockups with crisp gate colours; no tutorial, the game
  starts on the first click [21].
- Numbers: about $70,000 in the first two months on iOS vs $15,000 from Flash; Metacritic 79; IGF 2011 Best
  Mobile Game runner-up [21].

### Inferences
- Gate colours: blue gates are the scoring slalom, red gates and the "tunnels" require the line to pass under or
  through, and the red cables are the kill hazard [memory]. Confirm before publishing.
- Time attack transfer is weak because the player authors the route; but the right-edge preview of the next
  obstacle with its height requirement is a readability pattern worth copying.

### Gaps
- No interview page with Boxleiter or Wohlwend was found in budget (one search returned nothing relevant).
  Candidate sources: Game Developer "Road to the IGF" 2011 series, Mikengreg devlog.
- Scoring formula.

### Transfers to SpeedRunner
- Yes: audio dropout as a speed signal (music ducks, wind rises above 90% of maxRun).
- Yes: preview the next hazard's required height on the right edge when the camera look-ahead is short.
- No: drawing the level.

### See it in action
- https://en.wikipedia.org/wiki/Solipskier [21]

---

## 5. LittleBigPlanet 1 to 3 (2008 to 2014, Media Molecule, then Sumo Digital)

### Takeaway
A fully physical platformer where "players' expectations" replaced rules, three depth layers, a grab-and-swing
verb, a physics toolkit for creators, and the Play, Create, Share loop that produced over 10 million levels.
The floaty jump was a community complaint for six years and was "addressed" in LBP3. For a time attack the
lesson is negative on feel and positive on sharing and race scoring.

### Cited findings
- LBP1 PS3 2008 [memory: 27 Oct 2008 EU], LBP2 PS3 Jan 2011 [memory], LBP3 PS4/PS3 18 Nov 2014 NA, developed by
  Sumo Digital, published by Sony [22].
- Layers: three playable layers in LBP1 and LBP2; LBP3 allows 16 [22][23]. A TV Tropes entry describes the
  three "fat" layers and four "thin" layers [memory, secondary].
- Levels: "at least 10 million online user-created levels" became inaccessible at server closure [22]. Pinnock
  (Sumo) in 2014: "over 8 million levels" [24].
- Servers: all LBP servers down 22 May 2021; PS4 back 13 Sep 2021, PS3 servers closed permanently; PS4 servers
  down 8 Jan 2024 after a malicious mod and closed permanently 19 Apr 2024 [22].
- Physics philosophy (David Smith, Media Molecule technical director, GDC 2009): physics exists to "make use of
  players' expectations"; the engine does not sleep off-screen objects and "doesn't cheat"; the main risk is
  losing control because players break levels; fixes were destroying troublesome objects, respawning Sackboy
  when buried, and longer levels; Mario-style air control has "no consistent physical way of describing this";
  advice "Don't go for the middle-ground" [25].
- Floaty jump: GamingBolt asked Sumo's Daimion Pinnock about complaints that jumping felt floaty; answer: "It
  has been addressed." LBP3 added climbing [24]. A GameSpot LBP2 hands-on notes Mm addressed the complaint that
  Sackboy was hard to control [26]. PlayStation LifeStyle's LBP3 review: not nearly as "floaty" as before [27].
- Media Molecule considered full 3D levels for LBP1 before settling on layers [28].

### Inferences
- The floaty jump is a direct consequence of the physics-first design: Sackboy is a ragdoll driven by forces,
  so the jump has a long time to apex and air control is damped. This is the opposite of the SpeedRunner kit
  (jump cut, apex hang, fall gravity x1.65).
- Race scoring [memory]: LBP race start gates and finish gates award points inversely to elapsed time; score
  bubbles are 10 points with a combo multiplier for fast chains; hearts on levels are the curation signal and
  "Mm Picks" are staff picks. I could not fetch an LBP wiki page (Fandom blocked) to confirm the formula.

### Gaps
- Numbers for the jump (time to apex, height in Sackboys). Race gate scoring formula. Hearts and Mm Picks
  counts. 4-player co-op x2/x4 door rules. LBP1 and LBP2 exact dates.

### Transfers to SpeedRunner
- Yes: hearts as a one-click curation signal if the user ever ships a map editor; staff picks as a second tier.
- Yes: race gate pair as an in-level mini time attack (a start gate and a finish gate with their own split).
- No: physics-driven character and floaty jump. Two separate sources show players asked for it to be fixed.
- No: three layers; a 2D time attack gains nothing from depth lanes.

### See it in action
- https://www.gamedeveloper.com/game-platforms/gdc-how-sackboy-learned-to-love-physics [25]
- https://en.wikipedia.org/wiki/LittleBigPlanet_3 [22]
- https://gamingbolt.com/littlebigplanet-3-interview-sackboy-is-back-but-this-time-he-is-not-alone [24]

---

## 6. Cat Mario / Syobon Action (2007, Chiku)

### Takeaway
A Super Mario Bros. parody whose entire design is the violation of learned platformer conventions. Every trap
works once. The design lesson for a time attack is that a trap that punishes prediction only has value on the
first attempt, and after that it is pure memorization, which flattens the skill curve to a lookup table.

### Cited findings
- Developer Chiku, freeware for Windows, February 2007 [29][30].
- Making: the first stage took three days and won a college cultural festival; a Niconico demo passed 1,000
  views, after which Chiku made three more stages in about two weeks (Wikipedia) or a month and a half (a
  Russian wiki mirror, conflicting) [29][30]. Inspired by "The Big Adventure of Owata's Life" posted on
  2channel a year earlier; chose a Mario spoof for recognition [29].
- Design: "harmless-looking objects that kill the player in unexpected ways"; borrows from Super Mario World;
  Ian Bogost: it "systematically disrupts every convention of 2D platform gameplay" [29].
- Meme: known as Cat Mario or Neko Mario; a Brazilian "Memes Mario" retexture with rage faces; fan sequels
  Syobon Action 2 and 3, New Cat Mario 3 [30]. Open Syobon Action (open-source clone) was downloaded over
  150,000 times on SourceForge, 2010 to 2020 [29].

### Inferences
- The specific tricks [memory, from play]: invisible blocks that appear mid-jump; clouds that drop when stood on;
  the goal pole that runs away or hides a hidden block; a "mushroom" that kills; piranha plants in the ground;
  fake blocks that fall; a second hidden exit. Each exploits a Mario prior ("? blocks are safe", "the flag ends
  the level").
- "Learned once, never again": with a death cost of a few seconds and 4 stages, the game is a memorization race.
  On a leaderboard the WR would converge within days to the deathless route and stay there; the only skill
  left is execution. This is why troll content belongs in a separate "trial" map, not the main maps.
- Why it became a video meme: the trap payoff is visible in 2 seconds, needs no context, and the viewer's own
  Mario priors are violated, so reactions are universal. This is the same reason Fall Guys clips spread.

### Gaps
- A Chiku statement (the 2010 GeoCities post is cited by Wikipedia but not quoted). Level count confirmation (4
  main stages plus a bonus). Death count telemetry does not exist.

### Transfers to SpeedRunner
- Yes, once: a single telegraphed-then-betrayed element in an expert map (SAMURAI TRIAL) teaches "do not trust the
  shape", but it must be consistent across attempts or ghosts and splits lose meaning.
- No: trolling as the main loop. It punishes the first-time player hardest and leaves no skill ceiling.

### See it in action
- https://en.wikipedia.org/wiki/Syobon_Action [29]
- https://knowyourmeme.com/memes/syobon-action-cat-mario [30]
- https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SyobonAction [31]

---

## 7. Fall Guys (2020, Mediatonic)

### Takeaway
A 60-player elimination game show whose ragdoll "is the comedy". Jump, dive and grab are deliberately imprecise;
the round pool is random; the design target is that losing feels like your own fault. The transferable parts
are the round pacing (60 s rounds), the qualifying cut as a shared clock, and the camera and readability rules,
not the physics.

### Cited findings
- Release: PS4 and Windows 4 Aug 2020 (Devolver Digital); Switch, PS5, Xbox 21 Jun 2022 with the free-to-play
  relaunch; Android and iOS 16 Aug 2024. Epic Games bought Mediatonic (Tonic Games Group) in March 2021 [32].
- Player count: cut from 100 to 60 during development; Season 3 lowered the maximum lobby to 40; current Classic
  and Knockout modes allow up to 32 [32]. Megan Ralph: designing for 60 vs 100 players differs, though the
  player experience barely changes [33].
- Round types: Course, Survival, Points, Team, Logic, Invisibeans, Final [32]. Named rounds [memory]: Door Dash
  (course), See Saw (course), Slime Climb (survival on a rising slime), Hex-A-Gone (final, hex tiles vanish
  underfoot), Fall Mountain (final race).
- Controls: jumping, diving, dive sliding, piggybacking, grabbing. Ragdoll physics were deliberate: losing the
  ragdoll quality "means losing the comedy"; falling over is funny, so ragdolls beat hyper-athletic characters
  [32].
- Design pillars (Anthony Pepper, senior designer) for every level concept [34]; Joe Walsh (lead designer):
  rounds must be "simple, replayable" and able to create "one-in-a-million moments"; ideal difficulty is when
  "you always feel like it was your fault that you failed" [35][36].
- Origins: pitched Jan 2018 by Joe Walsh, from Takeshi's Castle and Total Wipeout; pitched to 10 publishers at
  GDC 2018; Mediatonic had made about 130 games before [32][37][38].
- Numbers [vendor]: 7 M Steam copies by 26 Aug 2020; over 10 M Steam by Nov 2020; 11 M PC by Dec 2020; over 50 M
  players within two weeks of going free-to-play (21 Jun 2022) [32].
- Seasons: 6 seasons from 4 Aug 2020 to 30 Nov 2021; after F2P, Season 1 "Free for All" (21 Jun 2022) to Season
  4 "Creative Construction" (10 May 2023); seasonal content ended 16 Aug 2023 [32].
- A 2020 interview had Walsh saying "no plans" for free-to-play; it switched 22 months later [36].

### Inferences
- Qualifying counts per round [memory]: course rounds qualify roughly the first two thirds (for example 60 to 40,
  40 to 26, 26 to 16), finals qualify one. The exact numbers varied by season and were never published as a
  table; they were read from the in-round HUD.
- The jump is short (about 1 bean high) with a dive that adds about 1 bean of horizontal reach and a long
  face-down recovery; this makes every gap a "jump or jump-dive" decision and makes mistiming comic. Numbers
  are from play, not published.
- No GDC Vault talk by Mediatonic on Fall Guys was found after two searches; the design record is in
  interviews and dev diaries. Statements about "fairness through chaos" are a paraphrase of the GamesRadar
  headline "the perfect blend of chaos and skill" [33], not a quoted talk title.

### Gaps
- Camera design statements, qualifying table, jump and dive numbers, the "Creative Construction" editor limits.

### Transfers to SpeedRunner
- Yes: 60 s round length as the target for a map's first clear, and a visible "cut line" (the time you must
  beat to stay in the top N of a season) as a motivating qualifying bar.
- Yes: "simple, replayable, one-in-a-million moments" as a map-design test.
- Yes: ragdoll on death only. SpeedRunner's duel already uses a scripted body; a short ragdoll on spikes is cheap
  comedy without touching the run physics.
- No: imprecise jump and dive. A time attack needs the opposite.

### See it in action
- https://en.wikipedia.org/wiki/Fall_Guys [32]
- https://gamesradar.com/fall-guys-interview [33]
- https://gamespot.com/articles/fall-guys-heres-how-the-developers-make-its-levels/1100-6481433/ [39]

---

## 8. Super Mario Maker 1 and 2 (2015, 2019, Nintendo)

### Takeaway
The reference for level sharing in a platformer: clear your own course before upload, course IDs, clear rates,
likes and comments, world records and first clears per course, Endless difficulty tiers sorted by clear rate,
and a 120-course story mode that teaches the toolkit. Team 0% shows what a community does with a "cleared by
someone" bit: 41,113 uncleared Wii U courses in Feb 2023 became 0 by 15 Mar 2024, before the 8 Apr 2024 shutdown.

### Cited findings
- SMM1: Wii U, Sept 2015 [memory: 10 Sep 2015 JP, 11 Sep NA/EU]. Online services for Wii U and 3DS, including
  SMM1, closed 8 Apr 2024, announced Oct 2023 [40].
- SMM2: Switch, 28 Jun 2019. Styles: SMB, SMB3, SMW, NSMBU, plus the "extra" 3D World style that requires a
  reset to switch into. Story Mode: 120 official courses (the intro says "over 100"); up to three extra lives per
  job, lives reset to five per job; completing all jobs unlocks the Robot Cap and Suit. World Maker (22 Apr 2020
  update): up to six Super Worlds saved, one uploaded, five levels per world, eight worlds per Super World, 40
  levels. Ninji Speedruns (5 Dec 2019 update): race Ninji ghosts of other players' best times. Online needs
  Nintendo Switch Online. Sales 7.15 M by Mar 2021, 8.42 M by 31 Dec 2022 [vendor] [41][42]. April 2026: a wave of
  level removals reported [41].
- Clear Conditions can be added to a course (collect N coins, reach the goal as Super Mario) [42].
- Luigi Assist in story mode gives a limited set of parts to place when stuck; story courses can be rebuilt with
  the in-game parts, "we're hoping people will play those and find their own inspiration" (Nintendo developer
  interview) [43].
- Tezuka on design as play: the team wanted the DIY side to "feel like play" [44]; Tezuka's 5 tips for making
  courses (Nintendo Life, July 2019) [45]; Game Informer's 48 rapid-fire questions with Tezuka (June 2019) [46].
- Team 0% [40]: founded Dec 2017 from a Reddit spreadsheet of 2,015 courses with a 0% clear rate; goal: every
  course cleared by someone other than its uploader. Uncleared SMM1 courses: 41,113 (Feb 2023); under 25,000
  four weeks after the shutdown announcement (7,384 cleared in that span); 178 on 5 Mar 2024; "The Last Dance"
  cleared 15 Mar 2024 by Yamada_SMM2. "Trimming the Herbs": over 280,000 attempts, then revealed as uploaded
  with a tool-assisted clear, so excluded; cleared by Sanyx91smm2 on 5 Apr 2024 anyway. Rules: humanly possible,
  no cheats or external tools, no self-clears, courses depending on patched glitches excluded. SMM2 effort
  ongoing. Tezuka: "That's actually pretty cool."
- Endless difficulty: a no-skip Endless Expert blog reports expert courses with clear rates as low as about 2%
  and says the tier is only loosely tied to clear rate [47]. A March 2016 report says Nintendo made the 100
  Mario Challenge Expert easier when it introduced Super Expert [48]. Guinness tracks most 100 Mario Challenge
  Super Expert clears [49].

### Inferences
- Upload rules [memory]: you must clear your own course before upload (Clear Check); SMM2 upload cap rose from 32
  to 64 to 100 courses; course IDs are 9 alphanumeric characters (XXX-XXX-XXX); SMM1 caps rose with stars from
  10 to 100. Course World shows clear rate as clears/attempts, likes, boos (added in SMM2), comments placed on
  the course map, first clear and world record per course; death markers appear where other players died.
- Endless tiers [memory, community convention]: Easy roughly 40% and above, Normal 10 to 40%, Expert 2 to 10%,
  Super Expert under 2%, with the cut computed from clear rate and adjusted by Nintendo; never published.
- The "speedrun" community level style: a short course with a strict timer (often 10 to 30 s), pre-set momentum,
  on-off blocks and tracks synced to the timer, one intended line, usually 1-1 free of trolls. These levels
  are the closest existing analogue to a SpeedRunner map, and their conventions (a 3-second buffer at the goal,
  visual rhythm cues, no blind drops) are worth a profile.
- Yamamura's Dojo [memory]: a set of tutorial lessons by the pigeon Yamamura and Nina, teaching concepts such as
  "teach, then test", rhythm, enemy placement and reward placement, with example courses.

### Gaps
- Part counts by version (SMM1 about 60 parts, SMM2 over 100) were not confirmed from a fetched page; the Super
  Mario Wiki page is 407 KB and the fetched slice ended before "Course parts". Read offsets 100000 onward.
- Exact Endless clear-rate cutoffs (never published; community estimates only). Dojo lesson count.
- 2015 Tezuka interviews (Time, Nintendo Life Dec 2015) found but not read [50][51].

### Transfers to SpeedRunner
- Yes: clear your own map before upload; store clears and attempts per map (SpeedRunner's server sees only starts
  and finishes, so the clear rate is one division away); first clear and world record badges per map.
- Yes: death markers aggregated from other players (the server needs death positions; today it has none).
- Yes: a Team 0% bit per map ("has anyone finished SAMURAI TRIAL?") as a social goal.
- Yes: Ninji-style ghost races against sampled other-player ghosts.
- Partly: Endless tiers by clear rate when there are enough maps.
- No: full editor and part catalogue at this team size (a later study).

### See it in action
- https://en.wikipedia.org/wiki/Team_0%25 [40]
- https://en.wikipedia.org/wiki/Super_Mario_Maker_2 [41]
- https://www.nintendolife.com/news/2019/07/super_mario_maker_2_producer_takashi_tezuka_shares_5_tips_for_creating_courses [45]

---

## 9. Ultimate Chicken Horse (2016, Clever Endeavour Games)

### Takeaway
Each round every player places one piece, then everyone runs. Points go to finishing, to finishing alone, to
killing others with your trap, and to the coin; nothing is awarded when everyone or nobody finishes, which is the
rule that keeps the level in the "some can, some cannot" band. The level grows one piece per player per round, so
difficulty self-tunes to the group.

### Cited findings
- Release: Windows, Linux, Mac 4 Mar 2016; PS4 12 Dec 2017; Xbox One 15 Dec 2017; Switch 25 Sep 2018; built in
  Unity; music by Vibe Avenue; cross-play across PC, mobile, Switch, Xbox, PlayStation [52].
- Loop: build the platform one piece at a time, then race to a flag; place obstacles to hinder rivals while
  keeping your own route; each round lasts about a minute; a match ends at a target score or after a set number
  of rounds [52].
- Scoring rule: "If nobody reaches the goal, or everyone does, no one scores that round" [52]. The developer's
  rules page: Goal (reach the goal alive), Solo (only player to reach it), Postmortem (reach it after dying, with
  Respawn on), Trap (each time another player dies on your trap), Coin (reach the goal after collecting the
  coin), Comeback (reach the goal as an Underdog: no goal for 2 or more turns while others scored), First to
  Fourth (arrival order); each has a value and an "always award" toggle; also Points to Win, Length Limit in
  rounds or minutes, Placement Timer, Run Time Limit, Respawn, Party Box (one, two or none), Pieces per Round
  (Creative mode), Block Probability, and Modifiers (high gravity, multiple jumps, player collisions, dead hops,
  jetpacks, dance invincibility, faster projectiles, doomsday lava) [53].
- Default values (community wiki, flag as secondary): Goal 1, Solo 3/5, Postmortem 2/5, Trap 1/5, Coin 3/5,
  Comeback 4/5, First 1/5; default preset 5 points to win, 12 rounds, all blocks; Coin points are awarded even
  when the round is too easy or too hard [54].
- Origin: an October 2014 game jam while Richard Atlas was forming the studio (Gamasutra) [52][55]; Atlas on
  cooperative building producing camaraderie (Road to the IGF) [55]; Kyler Kelly-Tan left in June 2022 after
  about seven years [56]. GDC 2019: Atlas gave "Tough Questions to Improve Your Leadership" and a Montreal indie
  panel; no design postmortem title was found [57]. Spiritual successor Ultimate Sheep Raccoon, 9 Dec 2025 [52].
- Metacritic 79 (PS4) [52].

### Inferences
- The "no points if everyone or nobody finishes" rule is the whole engine. It makes the dominant placement
  strategy "a piece I can pass and at least one friend cannot", which is exactly the band where a level is
  interesting. Expected scoring per round for a 4-player game is therefore 1 to 2 goal points plus fractions.
- "Level grows as you play" works because each piece is authored by a player who just ran the level, so every
  addition is calibrated to the current skill of the table, and the memory of who placed what gives each death
  an author to blame.
- Player counts: no sales figure found; the studio says only "tons of active players across all platforms" [57].
- Level editor and sharing [memory]: Free Play lets a group build a level; Challenge mode (added 2017) shares
  levels by code with a leaderboard of attempts and times. Confirm before publishing.

### Gaps
- A GDC design talk by Clever Endeavour (searched twice: none found; the GDC 2019 sessions were leadership and a
  Montreal panel). Sales numbers. Exact block catalogue (about 40 to 50 pieces [memory]).

### Transfers to SpeedRunner (for a 5-friend collective)
- Yes: a weekly "add one piece" map where each friend places one element, then everyone runs for time; the
  "too easy or too hard means no points" rule maps to "a split only counts if at least one friend missed it".
- Yes: trap authorship on death ("killed by Ana's spikes") as a social death message.
- Yes: the Underdog comeback bonus as a leaderboard mechanic (bonus for beating your own PB after N failed runs).
- No: simultaneous local multiplayer. SpeedRunner is solo; asynchronous ghosts are the substitute.

### See it in action
- https://en.wikipedia.org/wiki/Ultimate_Chicken_Horse [52]
- https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets [53]
- https://www.cgmagonline.com/interviews/making-the-ultimate-party-game-an-interview-with-richard-atlas [58]

---

## Candidate technique profiles from these nine

| Profile | One line | Games | Key numbers |
|---|---|---|---|
| Pace line | Draw other players' positions at your current elapsed time | Doodle Jump markers, Ninji Speedruns | Doodle Jump "first to use" live markers [10] |
| Finisher room | A space only finishers see | Getting Over It chatroom | 2.7 M players [vendor] [1] |
| Mission ladder | 3 visible challenges tiered by session length, off the leaderboard | Jetpack Joyride | 30 s to 2 min, 2 to 10 min, 10 to 30+ min [20] |
| One tap to retry | Death to control in one input | Jetpack Joyride | one tap after death [20]; SpeedRunner today 3.4 s |
| Speed audio dropout | Music ducks and wind rises at top speed | Solipskier | headphones fly off [21] |
| Clear bit per map | Store clears and attempts; show clear rate, first clear, WR | Super Mario Maker, Team 0% | 41,113 to 0 uncleared in 13 months [40] |
| Clear before upload | Author must clear the map to publish | Super Mario Maker | [memory] |
| Community death markers | Aggregate deaths and draw them | Super Mario Maker | [memory] |
| Cut line | A visible time you must beat to qualify for the season board | Fall Guys qualifying | 60 to 40 players, Season 3 cap 40 [32] |
| Simple, replayable, one in a million | Map design test | Fall Guys | Walsh quote [36] |
| Add one piece | Friends extend a shared map one element per week | Ultimate Chicken Horse | 5 points, 12 rounds, no score if all or none finish [52][54] |
| Trap authorship | Death message names who placed the hazard | Ultimate Chicken Horse | Trap 1/5 point [54] |
| Betrayed shape, once | One convention-breaking element in an expert map | Syobon Action | first stage made in 3 days [29] |
| Expectation physics, avoided | Physics-first character control makes jumps floaty | LittleBigPlanet | 3 layers, "It has been addressed" [24] |

## Sources
1. https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
2. https://www.gfinityesports.com/article/beyond-the-sheer-anger-and-frustration-what-getting-over-it-taught-me-about-accepting-setbacks
3. https://scalar.case.edu/final-project/raymond-1 (reports the GDC 2019 "Put Your Name on Your Game" panel)
4. https://gamedeveloper.com/design/pain-difficulty-and-getting-over-it
5. https://gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
6. https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i-
7. https://designnotes.libsyn.com/bennett-foddy
8. https://pcgamer.com/if-you-finish-getting-over-it-a-very-awesome-ending-awaits
9. https://en.wikipedia.org/wiki/Doodle_Jump
10. https://www.pocketgamer.biz/bouncing-ever-upwards-the-making-of-doodle-jump/
11. https://www.pocketgamer.biz/doodle-jump-hits-3-million-on-app-store-claims-lima-sky/
12. https://www.pocketgamer.biz/two-years-on-lima-sky-says-10-million-seller-doodle-jump-has-angry-birds-potential
13. https://www.pocketgamer.biz/interview/51964/short-cuts-doodle-jump-creator-igor-pusenjak-on-the-business-of-building-a-global-brand/
14. https://148apps.com/news/app-store-insiders-igor-pusenjak-president-lima-sky-creators-doodle-jump
15. https://androidcentral.com/doodle-jump-interview
16. https://en.wikipedia.org/wiki/Jetpack_Joyride
17. https://www.gamedeveloper.com/design/video-depth-in-simplicity-the-making-of-i-jetpack-joyride-i-
18. https://www.gdcvault.com/play/1015527/Depth-in-Simplicity-The-Making
19. https://gdcvault.com/play/1015483/Iterating-Design-and-Fighting-Fires
20. https://adriancrook.com/?p=4709
21. https://en.wikipedia.org/wiki/Solipskier
22. https://en.wikipedia.org/wiki/LittleBigPlanet_3
23. https://en.wikipedia.org/wiki/LittleBigPlanet_(PlayStation_3)
24. https://gamingbolt.com/littlebigplanet-3-interview-sackboy-is-back-but-this-time-he-is-not-alone
25. https://www.gamedeveloper.com/game-platforms/gdc-how-sackboy-learned-to-love-physics
26. https://gamespot.com/articles/little-big-planet-2-hands-on/1100-6261823/
27. https://www.playstationlifestyle.net/2014/11/18/littlebigplanet-3-review-much-potential-ps4/
28. https://www.engadget.com/2010-08-19-media-molecule-toyed-with-full-3d-level-design-in-first-littlebi.html
29. https://en.wikipedia.org/wiki/Syobon_Action
30. https://knowyourmeme.com/memes/syobon-action-cat-mario
31. https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SyobonAction
32. https://en.wikipedia.org/wiki/Fall_Guys
33. https://gamesradar.com/fall-guys-interview
34. https://waytoomany.games/2020/08/18/interview-with-anthony-pepper-senior-designer-behind-fall-guys/
35. https://gamedeveloper.com/design/q-a-designing-for-seasons-in-bumbling-platform-royale-i-fall-guys-i-
36. https://gamespot.com/articles/fall-guys-has-plans-for-a-lot-of-new-content/1100-6481364/
37. https://www.pcgamer.com/mediatonic-made-around-130-games-before-it-struck-gold-with-fall-guys
38. https://www.pcgamesinsider.biz/feature/69833/how-mediatonic-made-the-takeshis-castle-of-video-games-in-fall-guys/
39. https://gamespot.com/articles/fall-guys-heres-how-the-developers-make-its-levels/1100-6481433/
40. https://en.wikipedia.org/wiki/Team_0%25
41. https://en.wikipedia.org/wiki/Super_Mario_Maker_2
42. https://www.mariowiki.com/Super_Mario_Maker_2
43. https://nintendoeverything.com/nintendo-on-how-long-super-mario-maker-2-has-been-in-the-works-koopa-troopa-car-origins-more/
44. https://infonews.ca/news/343779/nintendo-wants-diy-design-aspect-of-super-mario-maker-2-to-feel-like-play
45. https://www.nintendolife.com/news/2019/07/super_mario_maker_2_producer_takashi_tezuka_shares_5_tips_for_creating_courses
46. https://www.gameinformer.com/video-interview/2019/06/18/48-rapid-fire-questions-with-super-mario-maker-2s-takashi-tezuka
47. https://keithyipkw.github.io/blog/no_skip_smm
48. https://mynintendonews.com/2016/03/23/nintendo-made-the-expert-mode-in-super-mario-makers-100-mario-challenge-easier/
49. https://www.guinnessworldrecords.com/world-records/463326-most-%e2%80%9c100-mario-challenge%e2%80%9d-clears-in-super-mario-maker%e2%80%99s-super-expert-mode
50. https://time.com/4030885/super-mario-maker-nintendo-wii-u
51. https://www.nintendolife.com/news/2015/12/takashi_tezuka_on_the_importance_of_super_mario_maker_and_of_modernizing_mario
52. https://en.wikipedia.org/wiki/Ultimate_Chicken_Horse
53. https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
54. https://ultimate-chicken-horse.fandom.com/wiki/File:Rules_-_Modifiers.png (community wiki, default values)
55. https://gamedeveloper.com/design/road-to-the-igf-clever-endeavour-games-i-ultimate-chicken-horse-i-
56. https://cleverendeavourgames.com/blog/2022/6/30/kylers-departure-from-clever-endeavour
57. https://www.cleverendeavourgames.com/blog/2019/3/28/gdc-and-the-transformidable-patch
58. https://www.cgmagonline.com/interviews/making-the-ultimate-party-game-an-interview-with-richard-atlas
