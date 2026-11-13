# 07. Build, place and sabotage verbs

Research agent 07 for the SPEEDRUNNER VERBS study. Scope: the player as builder or saboteur, inside a run or
between runs. Mechanics #1 already covered the element catalogues, UCH's scoring rules and block changelog, the
SMM upload gate and Team 0%, and the maker file formats (studies/mechanics-speedrunner/notes/04-elements.md and
10-named-games.md, cited here as [S4]). This note extends those; it does not repeat them.

Tags: [C] cited, [I] inference, [memory] from the author's memory and unverified, [K] Kingsfoil build fact,
[vendor] vendor-reported.

---

## Q1. Ultimate Chicken Horse: placing as a verb

### Takeaway
Placing in UCH is a timed, simultaneous, one-piece verb. Every round a Party Box opens, each player grabs one
piece, then everyone places at the same time under one clock (community wiki: Placement Timer 5 to 60 s or None),
and then everyone runs. Most pieces rotate and flip (since 1.6.040). The placed piece is then a timing problem for
every runner, including its author. Free Play removes the clock, the rules and death and is the build mode;
Challenge mode is the solo time attack on shared levels, keyed by an 8-digit code with a cross-platform
leaderboard of fastest times.

### Cited findings
- The Rules menu (official support article) has four tabs. Game Rules: Points to Win, Length Limit (rounds or
  minutes), Placement Timer ("How long you have to place items"), Run Time Limit (time to run the level each
  turn), Respawn (extra attempts after dying), Party Box (one, two or none in Party mode), Pieces per Round
  (Creative mode). Point Settings: Goal, Solo, Postmortem, Trap, Coin, Comeback, First to Fourth, each with an
  "always award" toggle. Block Probability: per-block likelihood of appearing in the Party Box, or disable.
  Modifiers: high gravity, multiple jumps, player collisions, dead hops, jetpacks, dance invincibility, faster
  projectiles, doomsday lava. No defaults are printed. [1]
- Placement Timer range 5 to 60 s, or None for unlimited (UCH fan wiki via search snippet; community source). [2]
- Party Box modes Standard, Disabled, Auto-Pick; Double Party Box for any player count; in two-player games each
  player gets an extra party box per round; "most blocks rotate and flip" from 1.6.040 (4 Mar 2019); Paintbrush
  recolour tool same version; True Random Party Box rule in 1.13.13 (19 May 2026). [S4 source 5]
- Free Play (announced 27 Oct 2016 by Richard Atlas): build "without time limits, rules, points, winning, or
  dying", online with friends or strangers. Snapshot sharing: pausing in any mode produces a shareable code;
  levels can be saved locally, renamed, and a friend's code can be loaded to play, modify or build on. [3]
- Custom levels get a unique 8-digit code; codes can be entered directly, including for levels not published to
  LevelNET; the level browser terminal shows Challenge-mode fastest-time leaderboards, host only; most custom
  levels are built in Free Play from custom level parts in a blank level (fan wiki via search snippet). Global
  best times on Challenge levels across all platforms (store text via search). [4][5]
- The studio quotes the common description of the game as "4-person versus Mario Maker" and its own developer
  built an SMM2 course (742-F3Y-RFF) to imitate rounds of the Rooftops level, adding an element after each round
  (22 Aug 2019 blog). [6]
- Scoring, trap authorship and the "nobody or everybody finishes means no points" rule: see [S4] 10-named-games
  section 9. Not repeated.

### Inferences
- [I] The placement verb has four inputs: pick (one of the Party Box offers, first come first served), move
  (free cursor over the level), rotate and flip (since 2019), confirm. The clock is shared, so the verb has a
  social cost: dithering shows the table where you plan to put it.
- [I] Why a placed trap is a timing verb for everyone. UCH traps are periodic or triggered (saw on a path,
  pressure spikes, cannons, flamethrowers, dance mover). Once placed they are part of the level clock, so the
  author must also time them. This is the same contract as SpeedRunner's movers (driven by run time), so a
  placed trap in SpeedRunner would be deterministic by construction. [K]
- [I] The Party Box as random draw with per-block probabilities is a weighted deck. For a 5-friend table the
  equivalent is a small weighted list of SpeedRunner element tags with a seed per round.
- [memory, verify] The lobby is a treehouse where players walk around, pick characters by walking to them, and
  the host picks the level and rules from objects in the room; the "dance" input (a taunt) exists in-run and is
  the trigger for the "dance invincibility" modifier. The party box offers more pieces than there are players.
  There is a rule that a piece cannot be placed over the start or the goal flag. None of this was fetched.

### Gaps
- Default Placement Timer and Run Time Limit (the support page prints none). Rotation step (90 degrees assumed)
  and the grid or snap unit. The "cannot cover the goal" rule. Number of pieces the Party Box offers per player
  count. Treehouse lobby text. UCH fandom pages return HTTP 402.

### See it in action
- https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets [1]
- https://cleverendeavourgames.com/blog/2016/10/27/free-play-mode-snapshot-sharing-more [3]
- https://cleverendeavourgames.com/blog/2019/8/19/ultimate-mario-maker-chicken-horse [6]

---

## Q2. Super Mario Maker: making as a verb, and the in-run verbs it adds

### Takeaway
Nintendo's stated rule for the maker was "making feels like playing" (Tezuka, 2019) and Miyamoto called SMM1 "a
game about creative play as much as anything" (2015). The input is the touchscreen first; the stick is "far
slower" (GameSpot). The upload gate (Clear Check) is settled in [S4]. The in-run verbs Mario Maker adds that fit
a time attack are the P Switch (a timed state change, about 10 s series-wide), the ON/OFF Switch (a global
red/blue toggle the runner hits on purpose), keys (follow the player, 8 max, door opens on contact) and the Clear
Pipe (enter with the stick, routing choice). The Twister is a lift element, not a verb.

### Cited findings
- Tezuka (Canadian Press, 2019): "so long as we ensure that making feels like playing, anything goes." New styles
  or themes are hard because they must be "compatible with the game and its controls." [7]
- Miyamoto (TIME, interview June 2015, published 11 Sep 2015): "a game about creative play as much as anything";
  "we drew all of the levels on graph paper" (the SMB1 design process). Tezuka: "Originally we wanted to make a
  Mario Paint game, using the Wii U GamePad"; the tool "lowered the hurdle for everyone being able to design". [8]
- Inputs: SMM2 supports controller and touchscreen; GameSpot says placing terrain with the control stick "is far
  slower than tapping the touchscreen" and recommends a stylus. Edge: handheld mode is the practical choice,
  TV-screen pointer control is worse, and building is "not as precise or fast" as on the Wii U GamePad. GamesBeat:
  a stylus "isn't necessary" after building a course in handheld mode. Game Informer: Switch is capacitive, Wii U
  was resistive, which changes which stylus works. [9][10][11][12]
- P Switch (SMM1 and 2): turns Brick Blocks into coins and back, affects Rotating Blocks, stops Conveyor Belts (as
  in SMB3), can be carried in every style except SMB; blue P Warp Doors (update 21 Dec 2015) work only while a P
  Switch is active; SMM2 adds P Blocks (dotted-line to solid), ceiling placement, light radius at night. Series
  duration "approximately 10 seconds" (not stated for Maker specifically). [13]
- ON/OFF Switch (SMM2): "When hit" it changes Y-shaped track junctions, toggles red/blue Dotted-Line Blocks,
  reverses red/blue Conveyor Belts, changes night light radius; in 3D World style it flips red/blue Spike Blocks
  and ON/OFF Trampolines. The page does not state the trigger set or that it is course-global. [14]
- Clear Pipe (SMM2, 3D World style): vertical pipes "require the Left Stick to enter" (3D World entered them
  automatically); can be placed "in any shape"; fireballs and enemies travel inside; if both ends are blocked
  while inside, the player is trapped and loses a life. [15]
- Twister (SMM2, all five styles): spins and lifts players and enemies; turns at edges; dissipates when its white
  centre is crushed; a Kamek tip says pressing B as you enter throws you higher (unconfirmed as a rule). [16]
- Key (SMM1 and 2): placed in blocks or held by enemies; Pink Coins reveal a key when all are collected; keys
  follow Mario (Yoshi's Island style), 8 at once max; SMM2 multiplayer: stomp a key holder to take it, a defeated
  holder's key bubbles; Cursed Keys spawn a Phanto in SMB style. [17]
- Making tools as upload gate, course IDs, clear rate, Team 0%: [S4] section 8.

### Inferences
- [I] In-run verbs ranked for a 2D time attack. ON/OFF Switch first: a global toggle hit on purpose, zero
  randomness, readable as colour, and the runner chooses when to hit it. P Switch second: it adds a timer to the
  run (about 10 s) and a "do the next section before it expires" pressure, which is exactly a speedrun constraint.
  Key third: a fetch that changes the route (door opens on contact, no input). Clear Pipe fourth: the entry input
  is a stick press and the junction choice is a routing decision. Twister: a lift, not a player verb.
- [I] SMM's "speedrun" community courses sync ON/OFF blocks and tracks to the course timer [S4]; a SpeedRunner
  ON/OFF would instead be keyed to the player's hit, so the only clock is the mover clock already in the build.

### Gaps
- Exact P Switch duration in SMM2 (frames), the trigger set of the ON/OFF Switch (jump on, hit from below,
  shell), Clear Pipe travel speed and junction input. The mariowiki pages are 100 to 660 KB and were read only
  to offset 100000. Nintendo's own talk on "making as play" beyond interview quotes was not found.

### See it in action
- https://time.com/4030885/super-mario-maker-nintendo-wii-u [8]
- https://www.mariowiki.com/ON/OFF_Switch [14]
- https://www.mariowiki.com/Clear_Pipe [15]

---

## Q3. LittleBigPlanet: Create mode verbs and in-level creative verbs

### Takeaway
LBP's creation verb is the Popit, a menu that pops above Sackboy's head on Square and holds the cursor, the
Goodies Bag (materials and objects) and the Tools Bag (logic, hazards, lighting, triggers). Create mode is the
same character in the same physics, so making is literally playing. The in-level creative verbs are the
Paintinator (a paintball gun, MGS DLC for LBP1), the Creatinator (LBP2 hat that fires any configured object), the
Grabinators (pick up and throw grabbable objects) and the Controlinator (remap any input to level logic).
Stickers are both decoration and switch triggers (sticker switch).

### Cited findings
- Popit: "press the Square button and it will literally 'pop' into the air above your SackPerson's head"; the
  Goodies Bag appears only in Create mode and holds materials and objects; the Tools Bag covers hazards, music,
  lighting, scenario effects and "triggered events"; the Popit Cursor handles selection, placement, resizing,
  copying and deleting; Material Changer and UV Tool are in the Tools Bag Functions menu. In story mode the popit
  only reaches stickers and costume. (Fan wiki, Prima eGuide and PlayStation Blog via search snippets.) [18][19]
- LBP2 (NA 18 Jan 2011): Controlinator assigns button or Sixaxis input to level parts and can drive Sackboy;
  Creatinator is "a hat worn by Sackboy that the creator can configure to fire any object"; Grabinators pick up
  and throw grabbable objects; Grappling Hook new; Sackbots with weak points and AI routines; level linking;
  music sequencer, cutscene and camera tools. The MGS paintball gun was DLC for LBP1. Sharing via LBP.me, one URL
  per level, offline since 23 Nov 2020. Over 3 M LBP1 levels playable in LBP2; almost 8 M levels across both PS3
  games by June 2013. Alex Evans: "expand the game without partitioning the audience". [20]

### Inferences
- [I] LBP's lesson is one input (Square) that switches the player from runner to builder without a mode change
  of camera or body. For SpeedRunner the equivalent is one key (say E) that opens a small placement cursor over
  the paused run, in the same Canvas2D view, no editor screen.
- [I] Stickers as switch triggers are "place a thing to toggle a thing": the sticker is a placed verb with a
  logic effect. The minimal SpeedRunner version is a placed block whose tag carries a `link` to a door.
- [memory] The Paintinator fires paint that triggers Paint Switches; the Creatinator fires any object including
  bounce pads and water. Not fetched.

### Gaps
- Paintinator and sticker switch pages (Fandom blocked). Popit Academy lesson count. LBP3 Create mode additions.

### See it in action
- https://en.wikipedia.org/wiki/LittleBigPlanet_2 [20]
- https://primagames.com/eguides/little-big-planet-3-signature-series-strategy-guide/welcome-to-the-popit-academy/popit-cursor [19]

---

## Q4. Trackmania and Geometry Dash: players build the time attack

### Takeaway
Trackmania is the time-attack version of "players build the levels". Nadeo curates one community map a day as
Track of the Day at 19:00 CE(S)T, with a 24-hour records board, and feeds it into the Cup of the Day knockout.
Selection is manual, from the in-game Map Review ratings. The published author rules are a time-attack design
brief: respawnable from every checkpoint, no hard speed checks, readable for beginners. Weekly Shorts formalise it
further (five maps a week, Author Medal of at most 20 s). Geometry Dash shows the other end: RobTop or a small
group of Elder Moderators hand-rate levels into Rated, Featured, Epic, Legendary and Mythic, 1 to 10 stars, 1 to 5
creator points; no official pipeline, moderators scout.

### Cited findings
- TOTD: daily at 19:00 CE(S)T; curated by Ubisoft Nadeo; needs Standard or Club Access; each TOTD has a records
  leaderboard open 24 hours; best time is "Track of the Day winner"; featured in the daily Cup of the Day knockout.
  Author requirements: fully respawnable from every checkpoint; avoid unnecessarily difficult speed checks;
  readable for Beginner and Intermediate players with good signage. Trophies from Top 1 (1x Trophy 7, value
  1,000,000) down to Top 100,000 (1x Trophy 3, value 100). [21]
- Map Review (via search): ratings from the in-game map review are seen by Nadeo map selectors and "based on the
  amount of reviews" decide TOTD or Royal qualification; a developer reply says the process "is a manual process"
  meant to be automated later. [22][23]
- Weekly Shorts guidelines: five maps a week in five style slots (1 Wide, 2 Slow, 3 Puzzle, 4 Fast, 5 LOL); track
  name must start with the slot number ("4 - TrackName"); "Track length should not be longer than an Author Medal
  of 20 seconds"; default Checkpoints and Finish, not hidden; must be respawnable or "cannot be selected"; Author
  Time attainable for beginners; review labels Hard AT, Too Long, Respawn Issues, Confusing Path, Naming Issue,
  WIP, Speedcheck, Wrong Style, Too Intense. [24]
- Geometry Dash: RobTop's FAQ says he picks which levels are rated; Featured, Epic, Legendary and Mythic all sit
  on the Featured tab, ordered manually by recency, playability and optimisation; Creator Points 1 (Rated) to 5
  (Mythic); stars 1 to 10. A community guide: Easy 1 to 2 stars, Normal 3, Hard 4 to 5, Harder 6 to 7, Insane 8 to
  9, Demon 10 with five community sub-tiers; nominated levels queue for "RobTop himself or a select group of
  trusted Elder Moderators"; criteria originality, decoration, music sync, flow, bug-free; a full unedited
  playthrough is recommended as proof. [25][26][27]
- Trackmania checkpoint and respawn contract: settled in [S4] Q5.

### Inferences
- [I] Trackmania's pipeline is a filter in three stages: anyone builds; the community rates in Map Review; a
  human picks one a day. The 24-hour board is the social clock. For five friends the same shape is "one map of
  the week", picked by whoever did not build it, board open seven days.
- [I] The author rules (respawnable, no speed checks, readable) are the ruleset for a SpeedRunner map editor's
  publish check, cheaper than SMM's Clear Check because the author's replay already proves respawnability if the
  checkpoint splits are recorded.
- [I] Geometry Dash's hand curation does not scale and fails the "no budget" rule; its only transferable bit is
  the 1 to 10 star scale set by the curator, not the author.

### Gaps
- Cup of the Day phases and player counts (page not fetched). Trackmania editor specifics (block grid 32 m [memory],
  item mode, validation lap required before saving [memory]). Geometry Dash editor object limit (community
  figures 40,000 then 80,000 [memory]).

### See it in action
- https://doc.trackmania.com/play/what-is-totd/ [21]
- https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/ [24]
- https://www.robtopgames.com/faq/en/answers/level [25]

---

## Q5. Sabotage and interference verbs in races

### Takeaway
Live races use items as catch-up and as story generators. SpeedRunners has eight pickups, each an interference
verb aimed at the leader (Golden Hook swaps places). Mario Kart 8 draws from ten distance bands (400 to 26,000
units from the frontrunner), so the item deck itself is the catch-up. SMB35 lets the player aim sent enemies with
four target modes. Mario Royale had no direct contact at all: 75 ghosts competing for shared items, with
indirect sabotage through broken blocks and kicked shells. Fall Guys kept the grab because it was "funnier".
Solo time attacks avoid all of this for two reasons: determinism (a replay must re-simulate) and comparability
(a board compares equal courses). The only sabotage that survives both is asynchronous and recorded: one trap,
placed by the previous player, that becomes part of the next player's course hash.

### Cited findings
- SpeedRunners pickups (wiki, 8): Golden Hook (hooks an opponent in front and swaps positions; dodge by sliding;
  blocked by crates, shockwaves, terrain), Homing Missile (chases, stuns on blast, slow turning), Crates (drop one
  to three, one at a time, at any moment; slow and stun anyone including the user), Time Bomb (place, then a
  Button pickup detonates; pushes, no stun, can boost the user, triggers switches), InvinciDrill (rare; speed and
  invulnerability, destroys crates), Shockwave (radial push, destroys crates, hooks and missiles, deflects
  Fireballs), Freeze Ray (straight beam "a few seconds"; frozen players slide), Fireball (rolling boulder, stuns
  and flings). No speeds, ranges or durations are published. Distribution unstated. [28]
- Mario Kart 8 (Grand Prix, human drivers): the distribution is chosen by distance from the frontrunner when the
  Item Box opens; 10 bands with thresholds 400, 1000, 2000, 3300, 5500, 8000, 13000, 26000 units and two sentinel
  rows; each row sums to 200 (doubled percentages). MK8 Deluxe uses different, un-ripped tables (talk page). [29]
- SMB35: four target modes, Random (default), Lowest Time, Most Coins, Attackers, switched with the right stick;
  the left stick picks a specific opponent; Attackers is "actually a defensive option"; sent enemies can be sent
  back; feeding enemies to a low-time player helps them because kills give time. [30][31]
- Mario Royale (InfernoPlus, 15 Jun 2019): up to 75 players (launched at 100), semi-transparent ghosts, no direct
  interaction; limited Mushrooms, Fire Flowers and Stars (taking one removes it for everyone); indirect
  elimination by breaking blocks or kicking Koopa shells; first three to the end win; over 1,000 concurrent
  players within days; cease and desist about 21 Jun 2019, renamed Infringio Royale then DMCA Royale. [32]
- Fall Guys: Mediatonic "realised that it was funnier to keep in the grab mechanic"; Joe Walsh names "how the grab
  mechanic works" as the first thing they built around; Anthony Pepper: whether a character can grab or punch
  "radiates out into the design of the larger world"; hold grab while jumping to climb a ledge; Shift on PC. [33][34][35]
- Duck Game (Ouya 13 May 2014, PC 4 Jun 2015, PS4 22 Aug 2017, Switch May 2019): "players die in one hit, and the
  last player standing wins the round"; pick up, throw and fire weapons; Steam Workshop; the designer added guns
  on a friend's suggestion to a James Pond 3-style platformer. Weapon count not stated. [36]
- Items as catch-up and the "no items in solo" argument: [S4] Q4.

### Inferences
- [I] Three interference families. Projectile (missile, fireball, freeze ray, SMB35 enemies): aimed, dodgeable,
  needs a target in view. Field (crate, time bomb, shockwave, Fall Guys grab, UCH trap): placed in the course,
  hurts whoever arrives, including the author. Swap (Golden Hook): rewrites standings, no physics. Only the field
  family survives in a solo time attack, because a field left in the course is just a map edit.
- [I] Ghost traps for SpeedRunner. After a finished run the player may place one trap (from a weighted deck of
  2 or 3 tags) anywhere except within 200 u of start, a checkpoint or the finish. The trap is appended to the
  map's element list and the map hash changes. The next runner races the changed map, sees the author's name on
  death ("Ana's saw"), and may place one more after finishing. The chain is a shared, growing level like UCH but
  asynchronous, and every state of the chain is a separate board key, so records stay comparable within a state.
  Cap the chain (12 traps, like UCH's 12 rounds) and reset weekly.
- [I] Mario Royale is the proof that sabotage can be indirect and still read: resource denial (take the item) and
  level alteration (break the block). Resource denial needs live play; level alteration does not.
- [I] SMB35's targeting is a real player verb (right stick) with a strategy layer. In an async model its analogue
  is "whose course do I trap?" which only matters with more than two players in the chain.

### Gaps
- SpeedRunners item roll (position-based or not), speeds and durations. MK8 per-item values (table flattened in
  the fetch). Fall Guys grab hold duration (community figure about 2 s with a stamina break [memory]). Duck Game
  weapon count (over 50 [memory]). Stick Fight: not reached; its weapons spawn from the ceiling on a timer [memory].

### See it in action
- https://speedrunners.wiki.gg/wiki/Pickups [28]
- https://www.mariowiki.com/Mario_Kart_8_item_probability_distributions [29]
- https://en.wikipedia.org/wiki/Mario_Royale [32]

---

## Q6. Cat Mario's anti-affordances (short list)

Mechanics #1 covered the troll vocabulary and the "betrayed shape, once" rule [S4]. TV Tropes returned 403 here, so
the list below is [memory] from the opening stages of Syobon Action (2007) and should be checked against the
#1 note before publishing.

| Anti-affordance | Convention it breaks |
|---|---|
| Flying cloud that drops on you | Clouds are background, not hazards |
| Hidden block over a gap you must jump | Empty air above a gap is safe |
| Fake goal pole that attacks | The goal is the end of danger |
| Floor tile that falls when stepped on | Ground is solid |
| ? block that spawns an enemy | Reward blocks give rewards |
| Enemy that charges when you approach | Patrollers keep their pace |
| Pipe that shoots you into spikes | Pipes are shortcuts |
| Invisible wall before the exit | Clear space is passable |

[I] Each line is a placed element with the wrong rule attached to a familiar shape. In a build mode this is the
one thing to forbid by default (no trap may use a safe element's sprite), unless a "troll" ruleset is chosen on
purpose. The upload-gate reason: SMM's Clear Check proves possibility, not fairness; UCH's "someone must finish
and someone must not" rule proves fairness at the table. A SpeedRunner build mode needs both.

---

## Q7. Design question for SpeedRunner: party placement, map editor, or nothing

### Takeaway
Recommendation: build the per-session "place one block then race" mode first, as an asynchronous chain on the
existing `[x, y, w, h, tag]` arrays, and defer a full editor. It costs one placement cursor, one weighted tag
deck, one more entry in the input log, and a map hash in the board key; all four are small against the existing
build. A course-code editor is a second step that reuses the same data path. "Nothing" leaves five friends with
four maps and no way to make the fifth.

### Cited findings and build facts
- Solids are `[x, y, w, h, tag]`, ground top at y 600; movers and wheels are driven by run time; the run is
  registered at start and submitted with a run id; `ms > 6000 && game.validSteps` validates; the leaderboard is
  per map (`/api/lb?map=`); ghosts are 30 Hz pose samples, about 100 KB per 60 s. [K]
- Content-hash board keys are settled in Mechanics #1 (validation and leaderboards notes). [S4]
- UCH: 8-digit level codes, snapshot code on pause, Placement Timer 5 to 60 s. [2][3][4]
- SMM1 stores 2,600 objects at 32 bytes each; SMM2 courses gzip about 8:1. [S4 Q8]
- Trackmania author rules (respawnable, no speed checks, readable). [21][24]

### Inferences: the three options

| Option | Cost | What it buys | Risk |
|---|---|---|---|
| A. Place one block then race (async chain) | cursor, deck of 3 tags, 1 log entry, hash key | UCH's "level grows with the table", trap authorship, a reason to replay a cleared map | chain states fragment the board; needs a cap and a reset |
| B. Map editor with course codes | A plus a save/load UI, publish check, code resolver | SMM-style sharing, unlimited maps | authoring quality falls on the players; needs Clear Check and a report flow |
| C. Nothing | 0 | records stay pure | four maps; the collective has nothing to build |

- [I] A is the party mode UCH proves at a table, converted to async. The session rule: after any finished run on
  a map state, the finisher may place one piece from a deck of three offered tags (`spike` 16 u strip, `solid`
  40x40, `mover` with period 3 s) under a 15 s timer (UCH's range is 5 to 60 s, mid-range). Forbidden zones: 200 u
  around start, every checkpoint and the finish, and no overlap with a solid (UCH's rule set, plus Cat Mario's
  lesson). Snapping: 20 u (the hero's width) so a piece is always a whole hero-width; 40x40 is one 2x2 cell.
- [I] Minimal data format. Append to the map's element list an element with two extra slots: `[x, y, w, h, tag,
  {author, t}]` where `author` is the 3 to 16 char name already claimed and `t` is the server time. The base map
  stays a constant; a map state is `base + placed[]`. The hash is `sha256(JSON(base) + JSON(placed))` truncated to
  12 hex chars, the board key is `map:hash`. A 12-trap chain adds at most 12 x about 60 characters, under 1 KB.
- [I] How a placed block enters the input log and the replay. Placement is not a run input; it happens between
  runs. So the input log stays as it is and the replay header gains the map hash (12 chars) and, for self-contained
  replays, the `placed[]` array itself. A replay then rebuilds `base + placed` before re-simulating. Nothing about
  the 1/120 s step changes because the placed piece is static or run-time driven, like the movers already are.
- [I] Board on the map hash. Each state has its own board; the UI shows the current state's board plus "all
  states" sorted by time with the state's trap count as a column. The UCH scoring idea maps to "a split counts for
  trap points only if at least one friend missed it", which needs the per-section splits already recorded.
- [I] Party-mode validation. The server already issues a run id at start; add the map hash to `start` and refuse
  `submit` when the hash does not match a known state. The placing player must finish the new state once before
  it becomes the live state (SMM's Clear Check, UCH's "author also runs"). That proves possibility; fairness comes
  from the "someone missed it" scoring rule.
- [I] B later. Once `placed[]` exists, an editor is a longer placed list with the same hash and a code. Codes:
  8 characters base32 (UCH uses 8 digits, SMM 9 alphanumerics) resolving to a stored `placed[]`. The publish check
  is Trackmania's list: finish from every checkpoint, no section that only the author can pass (require a second
  finisher before the map enters the public list).

### Gaps
- No telemetry on how often the five friends replay a cleared map, which is the case for A. No data on how many
  trap placements a friend group tolerates before a chain feels unfair (UCH's 12 rounds is the only anchor).

---

## Candidate technique profiles

| Profile | One line | Games | Key numbers |
|---|---|---|---|
| Timed simultaneous placement | All players place one piece under one clock, then run | UCH | timer 5 to 60 s or None [2]; rotate and flip since 1.6.040 [S4] |
| Weighted party deck | Offer N tags from a per-tag probability table with a seed | UCH Block Probability | per-block probability or disable [1] |
| Ghost trap chain (async) | Finisher places one trap; next runner races the new state | UCH, Mario Royale indirect sabotage | cap 12, reset weekly, 200 u safe zones [I] |
| Map state hash key | Board key is `map:sha256(base+placed)[0:12]` | SMM course IDs, UCH 8-digit codes | 9 alnum (SMM), 8 digits (UCH) [4][S4] |
| Author on death | Death message names the trap's author | UCH trap points | Trap 1/5 point [S4] |
| Author must run it | A placed piece goes live only after its author finishes the new state | SMM Clear Check, UCH | [S4] |
| ON/OFF switch | Global red/blue toggle the runner hits on purpose | SMM2 | toggles dotted blocks, conveyors, track junctions [14] |
| P Switch run | Timed state change about 10 s, do the next section before it ends | SMM | about 10 s series-wide [13] |
| Key fetch | Key follows the player, door opens on contact | SMM | 8 keys max [17] |
| One-key builder | One input opens a placement cursor in the same view | LBP Popit | Square [18] |
| Author brief as publish check | Respawnable from every checkpoint, no speed checks, readable | Trackmania TOTD, Weekly Shorts | Author Medal at most 20 s, 5 maps a week [21][24] |
| Curator stars | A curator, not the author, sets the difficulty number | Geometry Dash | 1 to 10 stars, 1 to 5 creator points [25][26] |
| Distance-banded deck | Item odds by distance from the leader | Mario Kart 8 | 10 bands, 400 to 26,000 units [29] |
| Target mode | Pick whom your interference hits | SMB35 | 4 modes on the right stick [30] |

---

## Sources
1. Clever Endeavour Games support, Custom rules and presets. https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
2. Ultimate Chicken Horse fan wiki, Rules (Modifiers image page; HTTP 402 on fetch, read via search snippet). https://ultimate-chicken-horse.fandom.com/wiki/File:Rules_-_Modifiers.png
3. Clever Endeavour Games blog, Free Play mode, snapshot sharing, more (27 Oct 2016). https://cleverendeavourgames.com/blog/2016/10/27/free-play-mode-snapshot-sharing-more
4. Ultimate Chicken Horse fan wiki, Custom Levels (HTTP 402 on fetch, read via search snippet). https://ultimate-chicken-horse.fandom.com/wiki/Custom_Levels
5. Clever Endeavour Games support, How do I get my level on the Featured tab. https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028928-how-do-i-get-my-level-on-the-featured-tab-
6. Clever Endeavour Games blog, Ultimate Mario Maker Chicken Horse (Aug 2019). https://cleverendeavourgames.com/blog/2019/8/19/ultimate-mario-maker-chicken-horse
7. Canadian Press via iNFOnews, Nintendo wants DIY design aspect of Super Mario Maker 2 to feel like play (2019). https://infonews.ca/news/343779/nintendo-wants-diy-design-aspect-of-super-mario-maker-2-to-feel-like-play
8. TIME, Matt Peckham, Super Mario Maker interview with Miyamoto and Tezuka (11 Sep 2015). https://time.com/4030885/super-mario-maker-nintendo-wii-u
9. GameSpot, Super Mario Maker 2 feels like it can last forever. https://www.gamespot.com/articles/super-mario-maker-2-feels-like-it-can-last-forever/1100-6467183/
10. Edge via Magzter, Super Mario Maker 2 review. https://www.magzter.com/es/stories/Entertainment/Edge/Super-Mario-Maker-2
11. GamesBeat, I made a Super Mario Maker 2 course on Switch, here's what I learned. https://gamesbeat.com/i-made-a-super-mario-maker-2-course-on-switch-heres-what-i-learned/
12. Game Informer, Make sure you get the right kind of stylus for Super Mario Maker 2 (29 Jun 2019). https://www.gameinformer.com/psa/2019/06/29/make-sure-you-get-the-right-kind-of-stylus-for-super-mario-maker-2
13. Super Mario Wiki, P Switch. https://www.mariowiki.com/P_Switch
14. Super Mario Wiki, ON/OFF Switch. https://www.mariowiki.com/ON/OFF_Switch
15. Super Mario Wiki, Clear Pipe. https://www.mariowiki.com/Clear_Pipe
16. Super Mario Wiki, Twister. https://www.mariowiki.com/Twister
17. Super Mario Wiki, Key. https://www.mariowiki.com/Key
18. LittleBigPlanet fan wiki, Popit Menu (search snippet). https://littlebigplanet.fandom.com/wiki/Popit_Menu?oldid=7302
19. Prima Games, LittleBigPlanet 3 guide, Popit Academy, Popit cursor. https://primagames.com/eguides/little-big-planet-3-signature-series-strategy-guide/welcome-to-the-popit-academy/popit-cursor
20. Wikipedia, LittleBigPlanet 2. https://en.wikipedia.org/wiki/LittleBigPlanet_2
21. Trackmania documentation, What is a Track Of The Day. https://doc.trackmania.com/play/what-is-totd/
22. Trackmania documentation, Map review, Play others' maps (404 on fetch, search snippet). https://doc.trackmania.com/create/map-review/play-others-maps/
23. DevTrackers, Trackmania, Criteria for map of the day (developer reply). https://devtrackers.gg/trackmania/p/5c47061d-criteria-for-map-of-the-day
24. Trackmania documentation, Weekly Shorts guidelines. https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
25. RobTop Games FAQ, Levels. https://www.robtopgames.com/faq/en/answers/level
26. RobTop Games, Geometry Dash Rating System (PDF, text not extractable; tiers from search snippet). https://robtopgames.com/files/GDRating.pdf
27. Ludo.guide, Geometry Dash level rating system (community guide). https://www.ludo.guide/guide/geometry-dash/community-online-levels/level-rating-system
28. SpeedRunners Wiki (wiki.gg), Pickups. https://speedrunners.wiki.gg/wiki/Pickups
29. Super Mario Wiki, Mario Kart 8 item probability distributions (and its talk page on Deluxe). https://www.mariowiki.com/Mario_Kart_8_item_probability_distributions
30. Nintendo Life, Super Mario Bros. 35 guide, how to win and top tips (Oct 2020). https://www.nintendolife.com/news/2020/10/guide_super_mario_bros_35_-_how_to_win_and_top_tips_for_marios_switch_battle_royale
31. Pocket Gamer, Super Mario Bros. 35 battle royale, all rules explained. https://www.pocketgamer.com/super-mario-bros-35/super-mario-bros-35-battle-royale-all-rules-explained-and-how-to-win
32. Wikipedia, Mario Royale. https://en.wikipedia.org/wiki/Mario_Royale
33. GamesRadar, King of the castle, the story behind Fall Guys. https://gamesradar.com/king-of-the-castle-the-story-behind-the-server-smashing-success-of-fall-guys
34. Wccftech, Fall Guys interview with Joe Walsh. https://wccftech.com/fall-guys-interview-with-joe-walsh-bloodless-battle-royale-incoming/
35. WayTooManyGames, Interview with Anthony Pepper, senior designer, Fall Guys (18 Aug 2020). https://waytoomany.games/2020/08/18/interview-with-anthony-pepper-senior-designer-behind-fall-guys/
36. Wikipedia, Duck Game. https://en.wikipedia.org/wiki/Duck_Game
S4. Mechanics #1 notes: studies/mechanics-speedrunner/notes/04-elements.md (Q1, Q4, Q8) and 10-named-games.md (sections 8 and 9).
