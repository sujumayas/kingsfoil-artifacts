# 08. Katana, attack and time verbs

Research agent 08 for study `mechanics-speedrunner-verbs`. Builds on #1's D4 (one-button slash, settled: 2-step
wind-up, 4 active steps, 100 ms cadence, 50x40 u hitbox, vx untouched, jump cancels) and D3 (stomp bounce settled
at a full jumpVel of 830 u/s). Nothing from those profiles is repeated here; they are cited as [S4 D3] and [S4 D4].

Tags: [V] cited finding, [U] recalled or unverified, [I] inference, [K] Kingsfoil build fact (notes/01-current-build.md).
Units: 1 step = 1/120 s = 8.33 ms. 1 BL = 46 u. maxRun 420 u/s = 3.5 u per step.

Access note: speedrun.com (guides, rules, the IGT thread), hollowknight.wiki, ghostrunner.fandom.com, old.reddit.com
and zeldawiki all returned 402/403 on 13 Nov 2026. Where a number below rests only on search snippets of those
pages it is marked [V-snippet]; where it rests on memory it is [U]. The gaps list at the end is long on purpose.

---

## 1. Katana ZERO (Askiisoft, 2019): slash, roll, slow time, deflect, restart

**Takeaway.** Katana ZERO puts three verbs on three buttons (attack, roll, slow-mo) and folds the fourth, bullet
deflection, into the slash hitbox with no separate timing window. Death is instant and restart is instant, framed as
precognition. The speedrun board times in-game and lets runners switch hitpause and screenshake to 0%, which says
the community reads hitstop as a tax on the clock.

**Cited findings.**
- Core kit: run, jump, wall-kick, pick up and throw items, katana attack, dodge. Slow motion is "limited by a meter
  that refills gradually". Every enemy but bosses dies in one hit; any damage kills Zero and the level restarts from
  the last checkpoint. Attempts are framed as scenarios Zero foresaw [V, S1].
- The wiki.gg character page: a "quick slash with his katana"; iaijutsu, unsheathe, strike and sheathe "in less than a
  second"; "deflect bullets with a single katana swing"; dodging "represented in-game by a roll or jump off a wall";
  Chronos lets him "rewind time upon death" [V, S2].
- Default PC keys: Roll on Enter, Slow-Motion on Shift [V, S3]. A deflected bullet ricochets back at the shooter;
  slow motion makes it easier "though you can do it without it". Against shotgun SWAT the guide says roll past rather
  than reflect [V, S4]. A 2019 preview: deflecting at full speed, invulnerable roll [V, S5] (already in [S4 D4]).
- Designer statements (Justin Stander): he made dying easy because many modern games were "too forgiving"; the game
  should be "difficult but fair"; "I really mess with the player"; "Everything needs to feel like an extension of the
  player". He credits Samurai Gunn, not Hotline Miami, as the bigger influence on one-hit kills [V, S1]. Co-developer
  statement in TechRaptor: the loop grew from "very short levels with extremely punishing, instant-death level design"
  in Tower of Heaven and Pause Ahead [V, S6].
- Hard mode (new enemy types, reworked bosses) and Speedrun mode (finish every level fast, options to modify enemy
  behaviour and skip cutscenes) came in the "significant update" announced for the end of May 2019 [V, S1, S7].
- speedrun.com: the leaderboard is in-game time, so runs with or without speedrun mode share one board; categories
  All Stages, Golden Ending, Psychotherapy, filters Normal/Hard and Katana/Lab Swords; pausing never invalidates a
  run. Gold-medal guides recommend screenshake 0%, hitpause 0%, response time x1 and Skip Rewind on; another guide
  says mashing and option selects make those unnecessary but keeps response time x1 and text speed x2 [V-snippet, S8,
  S9, S10].

**Inferences.**
- "Hitpause 0%" is the single most useful number for the sandbox: the world-freeze on a hit is a slider in Katana ZERO,
  and runners zero it. A time attack should not freeze the simulation on a hit; a hero-only flash is free [I].
- Deflect in Katana ZERO is not a parry with its own window. Any bullet that enters the slash hitbox during its active
  frames turns around. The effective window is therefore active frames plus hitbox length divided by bullet speed.
  This is the model to copy (see section 6) [I].
- "Skip Rewind on" means the death replay (the tape rewind) is a cost runners remove; the instant-restart engineering
  in [S4 H4] is the same lesson [I].

**Gaps.** Slash startup/active/recovery frames, roll duration and i-frames, roll distance, slow-mo time scale, meter
seconds and refill rate. The community frame data (speedrun.com guides) is behind a 403. Recall says the roll is about
0.3 s and fully invulnerable to bullets and melee, and slow-mo runs the world near a quarter speed [U]; do not quote.

---

## 2. Ghostrunner (One More Level, 2020): dash, sensory boost, one hit, grapple, Blink and Tempest

**Takeaway.** Ghostrunner is the clean statement of "attack as traversal": one hit kills in both directions, the
dash is also the dodge, and Blink (a dash through a line of enemies that kills them) is the dash-slash the proposal
asks about. The developers added time and death counters to the demo because show-floor players replayed it for
records.

**Cited findings.**
- Game director Radosław Ratuszni: after Gamescom 2019 "we noticed we had huge potential for speedruners"; demo
  players were "playing for 30 hours in the first three days" chasing records; the team added "gameplay counters like
  time and death counters" to the May 2020 demo; "of course we are going to support this" [V, S11].
- Reviews: levels are "miniature speedrun courses" of wall-running, sliding, time slowing and hook swinging; there is
  no sprint button [V, S12]. speedrun.com categories: Any%, CAKE, All Kills and Boost; 8 community guides; the
  Ghostrunner 2 $10k Any% challenge (26 Oct to 9 Nov) dropped the best time from about 1.5 h to under an hour
  [V-snippet, S13, S14].

**Recalled, unverified [U].** Sensory Boost slows the world while Jack is airborne and lets him strafe sideways to
dodge; its meter drains while held and refills on the ground. Dash on the ground is a short burst with a HUD cooldown;
in the air it is one dash per airtime. Blink kills every enemy on a line of 4 to 5 body lengths after a short charge;
Tempest is a shockwave that pushes enemies and reflects projectiles; Surge and Overlord round out the four abilities,
all drawing on one charge bar filled by kills. Deflecting bullets by a timed block is Ghostrunner 2 (2023), not the
first game; in the first game bullets are dodged, not reflected. The grapple pulls Jack to a fixed point at a set
speed, no swing.

**Inferences.**
- Blink is the proof that a kill-on-the-way dash reads fine at speed when the line of travel is drawn before release
  (a charge pose plus a ground line). The read is in the telegraph, not in the frames [I].
- Ghostrunner's slow time only works in the air, which makes it a dodge aid and never a route shortcut. That is a
  cheap guard against "hold slow-mo forever" [I].

**Gaps.** Every Ghostrunner number (dash length, Sensory Boost time scale and meter, Blink range, Tempest cooldown).
The fandom wiki returned 402 and the speedrun.com guide 403.

---

## 3. Dustforce (Hitbox Team, 2012): attacks that keep momentum, cancels, combo as time currency

**Takeaway.** Dustforce makes the attack a movement tool twice over: hitting an enemy refreshes the dash and double
jump (already in [S4 D3]), and the heavy attack's long recovery is cancelable into dash, jump, wall grab or ceiling
run. Attack direction is independent of momentum [S4 D4]. The combo meter is a timer that resets on each cleaned
patch and dies if you take a hit or go too slowly: speed and attack share one currency.

**Cited findings.**
- Heavy attacks can be cancelled with a dash (grounded, aerial or wall, not downdash), a jump, a wall grab or climb
  (air only), or a ceiling grab or run (air only). Jump cancels can be buffered by holding jump through the heavy;
  dash cancels must be timed. "Heavy cancel" is listed as cancelling the heavy's cooldown [V-snippet, S15].
- Default keys: light J, medium K, heavy L, in the community guide doc [V-snippet, S16].
- Combo meter: stays active "for a short period of time", resets for each patch cleaned; each patch scores fixed
  points times the meter and adds 1; the meter resets if the player takes a hit or proceeds too slowly [V, S17, S18].

**Inferences.**
- Two attack strengths with asymmetric recovery is a readability device: the light is the "free" one, the heavy is the
  one you commit to and then cancel out of. On one button, hold duration can stand in for the second button [I].
- "Jump cancel buffered, dash cancel timed" is a precise forgiveness rule worth copying: the common escape (jump) is
  forgiving, the expert escape (dash) is not [I].

**Gaps.** Light and heavy startup/active/recovery frames; dash-attack specifics; whether the attack adds any forward
speed (the reddit wiki says "barely", per [S4 D4]).

---

## 4. The lineage: deflect windows, pogos, dash-slashes, one-hit duels

### 4a. Sekiro's deflect window
- The Fextralife Deflection page: "12 frames by default (0.2 seconds before the attack hits)". Each recent Guard press
  shrinks the window, "as little as 4 frames, even 0 frames if you spam it too fast". The penalty clears "after a
  period of time (30 frames)" and immediately after a successful deflect. Pressing too early guards instead of
  deflecting; advice is to press early rather than late. Another page on the same wiki quotes 30 frames (half a
  second) shrinking to 7 after a recent release, so the sources disagree [V, S19, S20].
- Inference: at 120 Hz Sekiro's default is 24 steps and its spam floor 8 steps. The shrink-on-spam rule is the
  anti-mash device; a time attack cannot afford a 0.5 s penalty clock, so a whiff penalty must be the attack's own
  recovery, not an extra timer [I].

### 4b. Hollow Knight's nail bounce (pogo)
- The wiki: jumping and slashing downward on enemies, spikes and some environmental objects bounces the Knight;
  purple mushrooms in the Fungal Wastes bounce higher than usual; Quick Slash raises nail attack speed by 32%
  [V-snippet, S21]. A Silksong page quotes a bounce at 80% of a fresh jump and a 12-frame window; other sources
  conflict and the page is about Silksong, so treat it as unverified [U, S22].
- Recall: the nail attack cooldown is about 0.41 s, 0.25 s with Quick Slash; the pogo sets vy to a fixed value
  (the HeroController bounce velocity) regardless of fall speed [U].
- Inference: the pogo's two readability rules are (1) spikes are pogo-able, which turns the deadliest tile into a
  step, and (2) the bounce is a fixed velocity, so every bounce is the same height and the player can plan the chain
  by eye [I].

### 4c. Shovel Knight's shovel drop
- Yacht Club: "Shovel Knight can jump ~4.5 tiles high" and "can bounce off certain objects getting an additional
  height of ~4.5 tiles"; "Everything in Shovel Knight was built on a grid! The levels were tuned to his mobility!"
  [V, S23]. Frustration-free invulnerability on the drop is in [S4 D3].
- Inference: bounce height equals jump height is the readable rule (the player already knows what 4.5 tiles looks
  like). SpeedRunner's D3 stomp already uses the same rule (830 u/s, 3.0 BL apex); the pogo should reuse it [I].

### 4d. Zelda II's down thrust, Mega Man Zero's dash-slash, Ninja Gaiden
- Zelda II: Downthrust is learned from the wise man in Mido and is performed with Down in the air; the wiki
  fetch returned 403, so bounce behaviour is unverified [U]. Recall: the thrust gives a small hop off enemies and
  Link can chain it over Deelers and Moas [U].
- Mega Man Zero: "While dashing, press the attack button to perform a forward-moving slash attack with the Z-Saber"
  (dash slash), an aerial downward thrust on attack in mid-air, dash jump as B then held L, wall jump by pressing
  away [V, S24]. Mega Man ZX Advent's A-Trans dash "is a damaging slash" and its wall kick launches away with such
  force you cannot return to the same wall [V, S25]. Recall: Zero's saber combo is three slashes, the third with the
  longest recovery, and the dash-slash keeps dash speed through the swing [U].
- Ninja Gaiden II (NES), SDA mechanics page: "Slashing your sword has a 20 frame cooldown time"; slashing on the ground
  "forces you to stand still for the duration of the cooldown"; Ryu runs at 1.5 px per frame and climbs at 1 px per
  frame; a slash-climb gains 2 to 3 px per use, saving 2 to 3 frames; damage gives invulnerability until landing plus
  1 s; a Boost Grab can cling from about 16 px off a wall [V, S26]. The first game's wall cling (stick to any wall,
  jump off, no climb) is from memory [U].
- Inference: Ninja Gaiden's grounded slash is the canonical stop sign: 20 frames at 60 Hz (333 ms) rooted, which is
  exactly what [S4 D4] forbids. The air slash keeps momentum, so NES players already slash from the air to keep
  moving; the lesson is 35 years old [I].

### 4e. Samurai Gunn, Nidhogg, Hyper Light Drifter
- Samurai Gunn: each samurai carries a sword and three bullets per life; swords and bullets are deflected "with
  precise timing"; a match is players defeating each other with one hit [V, S27, S28]. Beau Blyth liked one-hit
  kills because they force every action to be meaningful, and avoided online play because he cares about "each
  single frame" (secondhand, from another developer's interview) [V, S29]. Sclash's designer, citing Samurai Gunn and
  Nidhogg: with one-hit death "we couldn't make the attack that fast" [V, S30].
- Nidhogg: swords are held low, middle or high and "automatically block all attacks made at the same height"; a hit
  kills; the dead player respawns a few seconds later; actions are move, jump, raise or lower sword, lunge, dive kick,
  throw the sword; the killer advances the tug-of-war [V, S31]. Feint timing is not documented in the source.
- Hyper Light Drifter: the chain-dash gap is "less than a second" and forum players say it can only be described in
  frames; lag changes the chain timing; a dash practice room exists; some players use controller templates that
  auto-repeat dash when held [V, S32, S33]. Recall: the window is about 10 frames at 60 Hz after the dash ends [U].
- Inference: one-hit duels show the trade. A fast attack plus one-hit death leaves no room to react, so Samurai Gunn
  gives a timed deflect and Nidhogg gives an automatic height block. Nidhogg's rule is the readable one for a
  spectator: you can see the heights. A time attack has no opponent, so the "deflect" only has to be readable against
  a turret shot, which is a stationary line of travel [I].

---

## 5. Time verbs: slow motion, Superhot, Braid, and what a slowed clock does to boards

**Takeaway.** Superhot already ran the experiment: it ships two timed boards, game-time (ticks only when you move) and
real-time, and runners of the real-time board "ignore the game's primary mechanic". A time attack must pick which
clock it counts before building slow motion, or the fastest line is "hold slow-mo always".

**Cited findings.**
- Superhot: game time advances only with movement or firing; turning the head or small twitches do not advance it. It
  has one challenge timed in game-time and a companion timed in real time. The speedrun.com forum describes the IGT as
  counting only when the character moves and notes the overlay is lost on replays, forcing manual verification per IL
  [V, S34, S35].
- Katana ZERO's board is in-game time; speedrun mode and normal share it [V-snippet, S8].
- Katana ZERO's slow-mo is a meter that refills gradually [V, S1]; the death "rewind" is a presentation that runners
  skip [V-snippet, S10].

**Inferences on determinism.**
- A slowed world is still deterministic if slow-mo is a per-step world time-scale applied inside the fixed 1/120 s
  step (world dt = 0.3 x DT, hero dt = DT or 0.3 x DT by design). The replay records the slow-mo button like any other
  input; the state machine replays bit-identically. There is nothing in slow-mo that threatens [S4 H3] [I].
- The board question is which clock ranks. Three options: (a) real steps (120 per wall second): slow-mo costs time, so
  it is only worth it where it saves more than it costs; good runners rarely use it; (b) world steps: slow-mo is free,
  so the fastest line holds it permanently, and the board measures meter management, not running (Superhot's
  real-time board shows runners drop the mechanic when it does not pay); (c) two boards, Superhot's answer, which
  splits a five-friend board in half [I].
- Braid: rewind as a verb cannot exist on a ranked clock unless the clock keeps counting through the rewind (otherwise
  every mistake is free). Braid's speedrun timing conventions were not reachable (speedrun.com 403) [U, gap].
- Recommendation: do not build slow time for the ranked run. If the sandbox wants it as a study toggle, use the
  Ghostrunner rule (air only) at 0.3x world speed with a 1.0 s meter that refills at 1 s per 3 s on the ground, and
  rank on real steps. That keeps it a dodge aid, never a route tool [I].

---

## 6. The proposal, evaluated at 120 Hz

Reference: the settled D4 slash is 2 startup, 4 active, 6 recovery steps (12 steps = 100 ms cadence), 50x40 u
(1.09 x 0.87 BL) in front of the chest, vx untouched, jump cancels, air usable [S4 D4].

### 6a. Dash-slash (a dash that kills on the way)
- **Input.** SpeedRunner has no dash button, and the budget is two or three buttons. The dash-slash should not be a
  fourth button. Make it the release of the iai hold (6d), so the only inputs stay Move, Jump, Katana [I].
- **Frames (start here).** 2 startup (17 ms, the sheathe flash), 12 active (100 ms), 6 recovery (50 ms, air control
  locked like `wallLock`). Total 20 steps = 167 ms [I].
- **Speed and distance.** 840 u/s during active (2.0 x maxRun, 7 u per step) = 84 u = 1.8 BL. Exit at 546 u/s, the
  roll-jump hyper's speed from [S4 A5], so the 500 u/s² overspeed decay and every gap in E4 stay valid. Celeste's dash is
  2.67 x run speed for 0.15 s [S4 A5]; 2.0x for 0.10 s is the conservative start [I].
- **Hitbox.** The swept strip: body (20 u) plus travel (84 u) plus blade (50 u) = 154 u long, 40 u tall, centred on the
  chest, tested each active step as a 50x40 box ahead of the hero (so the sweep is 12 overlapping boxes, same code as
  D4). 3.3 BL of kill line, which is the Blink read [I; U for Blink].
- **I-frames.** Projectile-only invulnerability during the 12 active steps; none against spikes or the fall line
  (Katana ZERO's roll is invulnerable [S5]; Shovel Knight's drop is "frustration-free" [S4 D3]) [I].
- **Cancels.** Jump cancels the recovery, not the active (Dustforce: jump cancel buffered, dash cancel timed [S15]); a
  wall touch ends it into a wall slide [I].
- **Resource.** One per airtime, refreshed on landing, on a kill, and on a pogo bounce (Dustforce refresh rule
  [S4 D3]). No meter [I].
- **Read.** A one-frame white smear the full 154 u, hero flat in a horizontal lunge, 10 dust at launch, afterimage
  ghost at 2-step intervals. No world hitstop (Katana ZERO runners set hitpause 0% [S9]). Sound: the duel's sheathe
  synth on arm, a 40 ms noise burst with a 1.2 to 2.4 kHz sweep on release, a short 1.8 kHz ping per kill [I; K].
- **Routing.** A free 1.8 BL at 2x speed every airtime, refunded by kills, puts enemies on the fast line exactly as D3
  wants. Skill ceiling: chaining kill refunds through a corridor of enemies, Ghostrunner All Kills style [I].

### 6b. Pogo slash (Down + Katana in the air)
- **Input.** Down held plus Katana press while airborne. Holding Katana keeps the blade down (Shovel Knight's held
  drop [U]); release or landing ends it [I].
- **Frames.** 2 startup, active while held up to 24 steps (200 ms), then 12-step re-press cadence like D4. The bounce
  consumes the active state [I].
- **Hitbox.** D4's box rotated: 40 u wide x 50 u tall below the feet (0.87 x 1.09 BL). Spikes are 16 u tall, inset 4 u
  [K], so the blade reaches a spike top 34 u before the feet would [I].
- **Bounce.** vy = -830 u/s, the settled D3 stomp value: apex 138 u = 3.0 BL, equal to a full jump (Shovel Knight: bounce
  height equals jump height [S23]; Hollow Knight: fixed bounce regardless of fall speed [U]). Jump held during the
  bounce enables the apex band; jump cut applies. vx untouched [I].
- **Targets.** Enemies, spike-capped blocks, and spike strips (Hollow Knight pogos spikes [S21]). Map m3 has 9 spike
  strips, 4 on ceilings [K]; ceiling spikes stay deadly, floor spikes become steps. Springs and movers are not targets
  (they already act) [I].
- **I-frames.** None. A pogo on a spike strip works only because the blade box hits first [I].
- **Refund.** Resets the dash-slash and `wallJumpSameY` (330 back to 790) [I; K].
- **Read.** Hero in a vertical stab pose, blade down, a 1-frame vertical smear, 6 dust at the bounce, the jump
  triangle synth one octave lower (210 to 380 Hz, 90 ms) so a pogo sounds like a deep jump [I; K].
- **Routing.** Pogo chains over a spike floor beat the walk-around; a pogo at the end of a fall replaces the roll
  (no 230 u roll trigger needed) [I].

### 6c. Parry (120 ms window reflecting a turret shot, 300 ms recovery on a miss)
- **Evaluation: reject as a separate verb; the slash already is the parry.** The D4 slash hitbox is 50 u deep and
  active 4 steps. A turret shot at 600 u/s (5 u per step) needs 10 steps to cross the box, so the effective deflect
  window is 10 + 4 = 14 steps = 117 ms, the 120 ms the proposal asks for, with no new input and no new state
  (Katana ZERO's model [S2, S4]). At 900 u/s the window is 11 steps (89 ms); at 450 u/s it is 17 steps (144 ms). Put
  bullet speed on a slider; the window follows [I].
- **The 300 ms miss recovery is a stop sign.** 36 steps at 420 u/s is 126 u = 2.7 BL without control, worse than
  Ninja Gaiden's rooted 20-frame slash [S26]. Sekiro's whiff penalty is a shrinking window, not a lockout, and even
  that clears after 30 frames [S19]. Keep the miss cost at D4's 6 recovery steps (50 ms) [I].
- **Reflected shot.** Returns along its line at 1.5x speed and kills the turret; the ping sound; a 2-step hero-only
  flash. No parry stance, no hold [I].
- **If a true parry is still wanted later:** it would be Katana held with no direction on the ground, 14-step window,
  whiff recovery 12 steps, and it should be an unranked-sandbox experiment first [I].

### 6d. Sheathe / iai stance (hold Katana to charge a longer dash-slash)
- **Input.** Tap fires the D4 slash at once (zero added latency). If the button is still held 24 steps (200 ms) after
  the press, the hero sheathes (arm). Full charge at 36 steps (300 ms). Release fires the dash-slash of 6a; a release
  before arming does nothing more than the tap already did [I].
- **Charge scaling.** Active steps 12 at arm to 18 at full (100 to 150 ms); travel 84 to 126 u (1.8 to 2.7 BL); speed
  fixed at 840 u/s so the read is "longer", never "faster" [I].
- **While charging.** Run, jump and wall kit all work; vx untouched (the katana never clamps speed). The charge holds
  through a wall jump. Lose the charge on a hit [I].
- **Read.** Sheathe pose with the hand on the hilt (the duel already has a "stance" frame at 0.75 s [K]), a 2-step white
  flash at arm and a second at full, the sheathe synth. The arm threshold must be visible and audible or the player
  will release early [I].
- **Katana ZERO's iai** is "less than a second" [S2]; Jump King's charge jump and Celeste's dash both cap the hold
  under 0.5 s in practice, so 300 ms to full is the usual range [I].

### 6e. Speedrun categories this creates
- Katana ZERO splits by difficulty and sword type and uses IGT [S8]; Ghostrunner has Any%, CAKE, All Kills, Boost
  [S13]; Superhot splits by clock [S34]. Proposal: "Any%" (all katana verbs), "No Katana" (today's kit, the current
  board), and later "All Kills". One clock: real steps [I].

---

## 7. Answers

### How many katana verbs on one button keep a time attack readable?
Three, plus deflect as a property of the slash rather than a verb:
1. Tap: slash (D4). It also reflects any shot that enters the box (6c).
2. Down + tap in the air: pogo (6b).
3. Hold 200 ms, release: iai dash-slash (6d and 6a).

The evidence: Katana ZERO uses three verbs on three buttons and folds deflect into the slash [S1, S2]; Mega Man Zero
puts dash-slash, air slash and down thrust on one attack button with state as the modifier [S24]; Dustforce's light
and heavy are two buttons, but its heavy-cancel rule shows the second strength is really "the one with a longer
commitment", which hold duration expresses on one button [S15]. A fourth verb (a standalone parry with a lockout) is
where readability breaks: it adds a stance the spectator cannot see and a whiff penalty the runner feels as a wall
(Sekiro [S19], Ninja Gaiden [S26]). Slow time is not a katana verb and should stay out of the ranked run (section 5).

### Which frame numbers to start with at 120 Hz
| Verb | Startup | Active | Recovery | Cadence or hold | Hitbox (u) | Speed, distance, bounce |
|---|---|---|---|---|---|---|
| Slash (D4) | 2 | 4 | 6 | 12-step cadence (100 ms) | 50x40 ahead | vx untouched |
| Deflect (emergent) | 0 | 14-step effective window at 600 u/s shots (10 crossing + 4 active) | 6 (same as slash) | none | same box | shot returns at 1.5x |
| Pogo | 2 | up to 24 while held | 0 | 12-step re-press | 40x50 below feet | vy = -830 (3.0 BL), refunds dash |
| Iai arm | 24 steps held to arm, 36 to full | | | tap still fires slash at step 0 | | |
| Dash-slash | 2 | 12 (arm) to 18 (full) | 6, air control locked | 1 per airtime, refunded by kill or pogo | 50x40 swept = 154 to 196 x 40 | 840 u/s, 84 to 126 u (1.8 to 2.7 BL), exit 546 u/s |
| Hitstop | 0 world steps; 2-step hero-only flash | | | | | Katana ZERO runners: hitpause 0% |
| Slow time (sandbox only) | | 0.3x world, air only | | 1.0 s meter, refill 1 s per 3 s grounded | | clock counts real steps |

All proposal values are [I]; the anchors are D4's 2/4/6, D3's 830 u/s bounce, A5's 546 u/s exit, Sekiro's 12-frame
default (24 steps) as the ceiling for any timed window, and Ninja Gaiden's rooted 20 frames (40 steps) as the floor
nobody should touch.

---

## Candidate technique profiles for the report
- **V-K1. The slash is the parry.** Deflect window = active steps + hitbox depth / bullet speed; 14 steps at 600 u/s.
  Katana ZERO, Samurai Gunn. No new input, no lockout.
- **V-K2. Pogo on spikes.** Down + slash in the air, 40x50 u below the feet, fixed bounce 830 u/s = 3 BL, refunds the
  dash. Hollow Knight, Shovel Knight (4.5 tiles = its jump), Zelda II.
- **V-K3. Iai dash-slash.** Hold 200 ms to arm, 300 ms full; 840 u/s for 12 to 18 steps, swept 154 to 196 u kill line,
  projectile i-frames, exit 546 u/s, one per airtime, kill refresh. Ghostrunner Blink, Mega Man Zero dash-slash,
  Katana ZERO iai.
- **V-K4. Hitstop is a tax.** 0 world steps; hero-only flash. Katana ZERO hitpause 0% in speedrun guides.
- **V-K5. Which clock ranks.** Real steps, one board; slow time as an unranked air-only toggle at 0.3x with a 1 s meter.
  Superhot's two boards, Katana ZERO IGT.
- **V-K6. Cancel asymmetry.** Jump cancel buffered, dash cancel timed (Dustforce); recovery cancelable, active not.

## Gaps (honest list)
- Katana ZERO frame data (slash, roll i-frames and distance, slow-mo scale and meter): speedrun.com 403, wiki.gg has
  no numbers.
- Ghostrunner numbers (dash, Sensory Boost scale, Blink range, Tempest): fandom 402, speedrun.com 403.
- Dustforce light/heavy frames: reddit 403; only cancel rules recovered from snippets.
- Hollow Knight pogo velocity and attack cooldown: hollowknight.wiki 403; Quick Slash 32% is a snippet.
- Zelda II Downthrust bounce, Ninja Gaiden 1 wall cling, Samurai Gunn and Nidhogg frame timings, Hyper Light Drifter
  chain window, Braid timing rules: not reached or not documented in reachable sources.
- Whether Katana ZERO's IGT counts slowed seconds as real seconds: the thread was 403.

## Sources
1. Wikipedia, Katana Zero. https://en.wikipedia.org/wiki/Katana_Zero
2. Katana ZERO wiki.gg, Zero. https://katanazero.wiki.gg/wiki/Zero
3. MagicGameWorld, Katana ZERO PC keyboard controls. https://www.magicgameworld.com/?p=32394
4. ludo.guide, Katana Zero enemies. https://www.ludo.guide/guide/katana-zero/enemies
5. Prima Games / Bleeding Cool, Katana ZERO preview. https://primagames.com/featured/katana-zero-preview-bleeding-cool
6. TechRaptor, Indie interview: Katana ZERO. https://techraptor.net/content/indie-interview-katana-zero
7. PC Gamer, Katana Zero adds hard mode, speedrun mode. https://www.pcgamer.com/katana-zero-adds-hard-mode-speedrun-mode-in-latest-update
8. speedrun.com, Katana ZERO board and "Why isn't this game measured in-game time?" https://www.speedrun.com/katana_zero and https://www.speedrun.com/post/rjao9
9. speedrun.com, A Comprehensive Guide to Golden Ending Speedruns in Katana ZERO. https://speedrun.com/katana_zero/guide/xgaqg
10. speedrun.com, Beginner's Guide to Psychboss Individual Level Speedruns. https://www.speedrun.com/katana_zero/guide/h16x7
11. Shacknews, Ghostrunner devs plan to offer more support and modes for speedrunners (13 Jun 2020). https://shacknews.com/article/118609/ghostrunner-devs-plan-to-offer-more-support-and-modes-for-speedrunners
12. God is a Geek, Ghostrunner review. https://godisageek.com/reviews/ghostrunner-review
13. speedrun.com, Ghostrunner board and beginner guide. https://www.speedrun.com/ghostrunner and https://www.speedrun.com/ghostrunner/guide/ht63j
14. speedrun.com news, Ghostrunner 2 $10k Challenge highlights. https://speedrun.com/news/wo831evm-ghostrunner-2-10k-challenge-highlights
15. r/dustforce wiki, Mechanics, Tricks and Terminology (redlib mirror). https://axebps-redlib.hf.space/r/dustforce/wiki/terms
16. Dustforce community guide (Google Doc). https://docs.google.com/document/d/1IhWcJsBZcrZM71CLpb8WMrbaP4cyXqlBgrd2MKhNOS4/export?format=pdf
17. Wikipedia, Dustforce. https://en.wikipedia.org/wiki/Dustforce
18. Capcom Database, Dustforce. https://capcom.fandom.com/wiki/Dustforce
19. Fextralife Sekiro wiki, Deflection. https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection
20. Fextralife Sekiro wiki, Combat. https://sekiroshadowsdietwice.wiki.fextralife.com/Combat
21. Hollow Knight Wiki, Nail and Nail-bouncing. https://hollowknight.wiki/w/Nail and https://hollowknight.wiki/w/Nail-bouncing
22. LootLore, Downstrike and pogo mechanic in Silksong (unverified figures). https://lootlore-d2ce2.web.app/en/hollow-knight-silksong/mechanics/downstrike-pogo-mechanic-silksong
23. Yacht Club Games, Plague Knight mobility design. https://yachtclubgames.com/blog/plague-knight-mobility-design
24. Almar's Guides, Mega Man Zero controls. https://almarsguides.com/retro/walkthroughs/GBA/games/MegamanZero/Misc/Controls/
25. StrategyWiki, Mega Man ZX Advent A-Trans forms. https://strategywiki.org/wiki/Mega_Man_ZX_Advent/A-Trans_Forms
26. Speed Demos Archive KB, Ninja Gaiden II game mechanics. https://kb.speeddemosarchive.com/Ninja_Gaiden_II:_The_Dark_Sword_of_Chaos/Game_Mechanics
27. PC Gamer, Samurai Gunn review. https://pcgamer.com/samurai-gunn-review
28. Wikipedia, Samurai Gunn. https://en.wikipedia.org/wiki/Samurai_Gunn
29. Medium (Subpixel Films), Beau Blyth on Samurai Gunn and Hyper Light Drifter. https://medium.com/subpixelfilms-com/big-stakes-and-small-details-beau-blyth-on-samurai-gunn-hyper-light-drifter-and-the-joys-and-7c6f51cbb8fa
30. Games Horizon, Sclash designer Bastien Bernand interview. https://gameshorizon.com/gh-picks/sclash-game-designer-bastien-bernand-exclusive-interview/
31. Mechanics of Magic, Mechanics and Dynamics of Nidhogg. https://mechanicsofmagic.com/?p=173
32. Steam Community, Hyper Light Drifter chain dash discussion. https://steamcommunity.com/app/257850/discussions/0/133257324789037486
33. Hyper Light Drifter bug list (Scribd). https://www.scribd.com/document/419725909/Hyper-Light-Drifter-Bug-List
34. Wikipedia, Superhot. https://en.wikipedia.org/wiki/Superhot
35. speedrun.com Superhot forum, IGT discussion. https://www.speedrun.com/superhot/forums/az93t
36. Red Bull, Katana Zero developer Justin Stander interview (fetched empty). https://www.redbull.com/int-en/katana-zero-developer-justin-stander-interview
37. Kingsfoil, Mechanics #1 report, profiles A5, D3, D4, H3, H4. studies/mechanics-speedrunner/report.md
