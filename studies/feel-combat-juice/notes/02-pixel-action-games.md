# 02. Pixel and top-down action games with aimed combat

Researcher angle: Hammerwatch / Heroes of Hammerwatch, Hyper Light Drifter, Enter the Gungeon, Nuclear Throne, Hades, Vampire Survivors, Diablo I/II, Moonlighter, CrossCode, Children of Morta, Eastward, Sparklite, Titan Souls.

Honest summary of what was found. The best hard data came from shipped game scripts, not from talks. Heroes of Hammerwatch (Crackshell) ships its AngelScript gameplay code, and a public GitHub mirror has it. That gave exact hit flash, screen shake and damage number code. Nuclear Throne Together's modding reference gave variable names and a few values. Diablo II has decades of community frame data at 25 fps. For Hyper Light Drifter, Hades, CrossCode, Moonlighter, Children of Morta, Eastward, Sparklite and Titan Souls I found no primary frame numbers in this pass (see Gaps).

Source labels used below. [code] means read directly from shipped scripts. [doc] means modding docs or community wiki. [2nd] means a secondary summary I could not check against the original. [inf] means my inference.

---

## Q1. Concrete numbers per game

### Takeaway
- Heroes of Hammerwatch has no hitstop and no knockback in the enemy damage path. Its enemy hit read is a red overlay at 50% alpha that fades linearly over 100 ms, plus a per-unit hit effect and a floating number. That is a server-friendly recipe, since it is purely local and costs one uniform per sprite.
- Hammerwatch screen shake is positional. Each shake has a world position and a range, and amplitude falls off linearly with distance. This is the single most transferable piece of code in this study for a shared-screen MMO.
- Diablo II gates hit reactions by damage size. A hit only plays the "get hit" animation if damage passes a fraction of max life, and that animation is 3 to 13 frames at 25 fps (120 to 520 ms). This is a good rule for an MMO where many small hits land at once.
- Nuclear Throne splits weapon feel into three numbers per shot (weapon kick, camera shift, camera shake) and exposes both screenshake and freeze frames as player options.

### Cited findings

**Heroes of Hammerwatch (Crackshell, 2018), from shipped scripts** [code]
Source mirror: https://github.com/exp111/HeroesOfHammerwatch (unofficial mirror of the game's `assets/scripts`; the Hammerwatch II modding wiki at wiki.hammerwatch2.com now redirects to a domain parking page).

- Enemy hit flash. `CompositeActorBehavior.Damage` sets `m_dmgColor = 1.0` on any damaging hit. `Update` runs `m_dmgColor -= dt / 100.0`, with `dt` in ms, so the flash lasts 100 ms with linear fade. `GetOverlayColor` returns `vec4(1, 0, 0, 0.5 * m_dmgColor)`, a red tint at 50% peak alpha. An immortal (invulnerable) target flashes purple `vec4(160/255, 0, 1, ...)` instead, shows an "immortal" floating text and plays `m_immortalSound`. File: https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as (lines ~266-274, ~395-430, ~721).
- Hit effect is data-driven. Each unit reads a `hit-fx` string parameter from its unit XML and calls `PlayEffect(m_hitFx, pos)` at the hit position. Same file, line ~175 and ~410.
- No knockback on damage. The call `m_movement.OnDamaged(dmg)` is commented out in `Damage`. Knockback in HoH lives in specific skills and buffs, not in the generic hit path. Same file.
- No hitstop found anywhere in the damage path. [code, absence]
- Networking of hits. The attacker's machine calls `localPlayer.DamagedActor(...)`, then `NetDamage` and `UnitHandler::NetSendUnitDamaged(m_unit, dmgAmnt, pos, dir, attacker)`. The hit feedback (flash, effect) plays immediately where the damage is computed and is then broadcast. Same file.
- Screen shake. `BaseGameMode.ShakeScreen(int tm, float amount, vec3 pos, float range)` multiplies `amount` by the console var `g_screenshake` (default 1.0) and returns early if it is 0. Shakes are kept in an array and each is removed when its timer hits 0, so several shakes stack additively. https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/GameModes/BaseGameMode.as (lines ~220, ~484-498, ~561-565).
- Shake curve. `ScreenShake.GetCameraOffset` computes `shakeFactor` as a linear lerp from 1 to 0 over `m_time` ms. Offset is `x = sin(t * 2 * f) * amount * f`, `y = cos(t * 2 * f) * amount * f * 0.5`. Vertical amplitude is half the horizontal. If `range > 0`, the factor is multiplied by `(range - distance) / range`, so players outside the range feel nothing. It also drives gamepad rumble at `0.75 * factor`. Optional `m_casting` delay before the shake starts. https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Utils/ScreenShake.as
- Shake as a skill action. `ScreenShaker` is an `IAction` with XML params `time` (int ms), `amount` (default 1.0) and `range` (default -1, meaning global). It runs on both the local and the network path (`DoAction` and `NetDoAction`), so every client shakes based on its own distance to the source. https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actions/ScreenShaker.as
- Damage numbers. `FloatingText` jitters spawn position by `randi(8) - 4` px on x and y. It rises at a constant `FloatingTextSpeed` per ms and dies after `Tweak::FloatingTextTime` ms (constant values not found in the mirror). Numbers are culled at spawn if the position is off screen. The whole system is skipped when the `ui_txt` var is false. Each of 10 types (player hurt, player hurt magical, healed, armor, ammo, enemy hurt, enemy hurt "husk", enemy healed, immortal, pickup) has its own colour var such as `ui_txt_enemy_hurt`, and an empty colour disables that type. https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/FloatingText.as and BaseGameMode.as lines ~204-214.

**Nuclear Throne (Vlambeer, 2015), from the Nuclear Throne Together modding reference** [doc]
Source: https://yal.cc/r/17/ntt/objects (community docs, warns entries "may not always be 100% accurate").
- `spr_hurt` is a "3-frame sprite for taking damage". NT runs at 30 fps, so about 100 ms [inf on fps].
- `nexthurt` is the frame on which an instance's invincibility ends. Default offset not documented.
- Enemy contact damage at most once per second (`canmelee`).
- Projectile `force` "determines applied velocity on impact" (knockback impulse per bullet).
- Projectile `typ` 1 can be deflected by melee or shields, 2 is destroyed by them, other values cannot be deflected (lightning).
- `wkick` is the drawn weapon offset (recoil). `gunshine` drives the gun's shine frame.
- Player options `opt_shake` (normally 0..2) and `opt_freeze` (freeze frames, normally 0..1).
- Weapon modding API `weapon_post(wkick, cameraShift, cameraShake)`. Documented example call `weapon_post(6, -7, 5)` for a triple shot. Sources: search snippet from https://yal.cc/r/17/ntt/gml/ and the NTT Bitbucket wiki (page now 404).
- [2nd] RPS interview (Graham Smith, 21 Oct 2013) where Nijman breaks down one pistol shot: camera kicks back 6 px from the aim direction and the shot adds 4 to a screenshake value that decays fast. Original URL http://www.rockpapershotgun.com/2013/10/21/interview-jan-willem-nijman-on-nuclear-thrones-feel/ (not fetched; numbers quoted from a secondary blog via search). Thread pointing to it: https://makegamessa.com/discussion/1344/vlambeer-s-jn-talks-about-nuclear-throne-juice
- GDC 2014 talk on Nuclear Throne (design and marketing, not feel numbers): https://www.gdcvault.com/play/1020517/

**Enter the Gungeon (Dodge Roll, 2016)** [doc]
- Dodge roll lasts "about 0.7 seconds". The first half grants immunity to damage and projectiles. Base roll contact damage 3. Items change roll speed by +15% to +25%. https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move) (read through the MediaWiki `api.php?action=parse` endpoint).
- Long recovery at the end of the roll leaves the player exposed. A Steam player thread claims i-frames cover about 3/4 of the roll, which conflicts with the wiki's "first half". https://steamcommunity.com/app/311690/discussions/0/368542585858479737
- For the spin-off Exit the Gungeon, Dave Crooks says they shrank hitboxes to allow denser bullet patterns. https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-

**Diablo II (Blizzard North, 2000) and D2R** [doc]
Source: https://maxroll.gg/d2/resources/breakpoints-animations
- Game logic runs at 25 fps. Each breakpoint removes one frame (40 ms). D2R kept 25 fps logic under 60 fps rendering.
- Casts have three phases. Frames before the effect, an "Action Flag" frame when the spell fires, and recovery frames. Sorceress at 0 FCR is 13 frames total with the action on frame 7 (520 ms total, fires at 280 ms). At 37 FCR it is 10 frames, action on frame 6.
- Player hit recovery interrupts everything. Paladin (spear/staff) 0 FHR is 13 frames (520 ms), dropping to 9 frames at 20 FHR. Other classes run 9 frames down to 3 frames at 200 FHR.
- Block animation 5 frames at 0 FBR down to 2 frames at 86 FBR (Maxroll table, via search).
- Hit recovery trigger. No reaction if the hit kills, the target is frozen, damage is poison-only, or under 1. Otherwise trigger = max life / divisor (8, 16, 32 or 64 by hit class). Below trigger, no reaction. Below 2x, 50% roll. Below 4x, a further 75% roll. Above 4x, guaranteed. Some monsters are immune.

**Vampire Survivors (poncle, 2022)** [doc, player reports]
- Options to toggle damage numbers, flashing and screen shake. Family Gaming Database listing (403 to direct fetch, content via search): https://www.familygamingdatabase.com/accessibility/Vampire+Survivors
- One player estimates turning damage numbers off "can stop like 30-40% of lag" after 20-25 minutes. Player estimate, not measured. https://steamcommunity.com/app/1794680/discussions/0/3194745173775130766

**Hades / Hades II (Supergiant)** [doc]
- Hades II has Options > Accessibility > Screenshake and Options > Interface > Damage Numbers toggles. https://kotaku.com/hades-2-early-access-god-mode-autofire-timer-1851461987
- Hades (2020) has a no-screen-shake option covering both dramatic shake and hit shake. https://www.familygamingdatabase.com/accessibility/Hades

### Inferences
- [inf] The common thread in HoH and NT is short, local, cheap feedback (100 ms tint, 3-frame hurt sprite) instead of time manipulation. HoH is a 4-player online co-op game and has no hitstop at all, which suggests Crackshell already hit the shared-screen problem.
- [inf] D2's damage threshold for hit reactions is the right model for crowded MMO fights. Chip damage gets a flash and a number. Big hits get the full hurt animation.

### Gaps
- No primary numbers for hitstop, dash frames or attack frames in Hyper Light Drifter, Hades, CrossCode, Moonlighter, Children of Morta, Eastward, Sparklite or Titan Souls. Fan wikis (Fandom) returned 402. A blog claim that HLD dashes "pause ~4 frames on contact" is unsourced and excluded.
- HoH `Tweak::FloatingTextTime`, `FloatingTextSpeed` and typical `ScreenShaker` time/amount values in unit XML were not reached (GitHub code search hit its rate limit). Next step is to grep the mirror's `.unit` and `.sval` files for `ScreenShaker`.
- Player i-frames after hit in HoH and Gungeon not found.
- Projectile speeds in tiles/s not found for any of these games.

---

## Q2. Misses, dodges, near misses, bullets vs walls, telegraphs

### Takeaway
- In aimed-combat pixel games a miss is mostly shown by the projectile itself. It keeps flying and dies on a wall with a small impact effect. There is no "MISS" text. HoH and NT both reserve floating text for real damage and immunity.
- Hammerwatch shows "immune" differently from "missed". A hit on an immortal target gives a purple flash, an "immortal" text and a distinct sound. That is a third state between hit and miss, and an MMO needs it (blocked, absorbed, immune).
- Dodges read through the player's own animation plus i-frames, not through a popup. Gungeon's 0.7 s roll with invulnerability in the first half and a long exposed tail is the classic shape.
- Deflection is a feedback class of its own. NT tags each projectile with a `typ` that says whether melee deflects it, destroys it or ignores it.

### Cited findings
- HoH immortal hit path. Purple tint, `AddFloatingImmortal`, `m_immortalSound`. https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as
- HoH zero-damage hit calls `AddFloatingHurt(0)`, so a fully absorbed hit still prints a 0. Same file.
- NT projectile `typ` deflect rules. https://yal.cc/r/17/ntt/objects
- Gungeon roll timing and exposed recovery. https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move) and https://twinfinite.net/dodge-roll-games-enter-the-gungeon-e3/ (review language on recovery, via search).
- D2 cast "Action Flag" frame is effectively a wind-up telegraph. 6 frames (240 ms) of visible casting before a Sorceress 0 FCR spell leaves her hand. https://maxroll.gg/d2/resources/breakpoints-animations

### Inferences
- [inf] For an MMO skillshot, the caster's own client should show the projectile flying on and hitting the wall. Other players need only the projectile and the wall puff. A "miss" label is only useful on targeted attacks where there is no projectile path to read.
- [inf] Enemy bullets in Gungeon and NT use colours and shapes the player's bullets never use. I could not find a developer source for Gungeon's colour rules in this pass. Treat "enemy bullets are a reserved colour" as a convention to test, not a cited rule.

### Gaps
- No primary source on telegraph lead times (flash before attack, wind-up frames) for Gungeon, NT, Hades or HLD. NT enemies use alarm timers (`alarm0` etc.) for attack timing but durations are not documented on the reference page.
- No source on near-miss feedback (graze) in these games. None of them is known for it, unlike shmups.

---

## Q3. Attack animation craft in pixel art top-down

### Takeaway
- D2 is the most useful public reference for frame budgets because its frame counts are exact. A full cast is 10 to 13 frames at 25 fps, with the effect firing about halfway. Anticipation is about half of the animation.
- NT uses a 3-frame hurt sprite and moves the weapon sprite with `wkick` instead of drawing recoil frames. Code-driven offsets save art.
- HoH draws a single hit effect from data (`hit-fx`) at the hit point, so one sprite sheet serves many weapons.

### Cited findings
- D2 cast phases and frame tables. https://maxroll.gg/d2/resources/breakpoints-animations
- NT `spr_hurt` 3 frames, `wkick` recoil offset, `gunshine` frame. https://yal.cc/r/17/ntt/objects
- HoH `hit-fx` parameter. CompositeActorBehavior.as above.

### Inferences
- [inf] For 32 px sprites at a 600 ms-ish server tick, a D2-like 3-phase split (wind-up, action frame, recovery) maps cleanly onto server events. The action frame is the moment the server applies damage or spawns the projectile.
- [inf] Code-driven recoil (`wkick`) and tinted overlays scale to 8 directions without extra art. Drawn smears multiply art cost by the direction count.

### Gaps
- No cited data on 4 vs 8 direction choices, smear frames or weapon trails for HLD, CrossCode, Children of Morta or Eastward. These need sprite sheet analysis or artist interviews (Heart Machine, Dead Mage, Pixpil) in a later pass.

---

## Q4. Juice at scale and accessibility options

### Takeaway
- Every game checked that has big crowds gives the player switches. Vampire Survivors toggles damage numbers, flashes and shake. Hades toggles shake, and Hades II adds a damage number toggle. HoH has a shake scale var and per-type damage number colour vars, where empty means off.
- HoH culls damage numbers that would spawn off screen before allocating them. Cheap and obvious, worth copying.
- Damage numbers are the first suspect for late-game lag in Vampire Survivors, by player report.

### Cited findings
- HoH `g_screenshake` scale (0 disables), `ui_txt` master toggle, per-type colour vars, off-screen cull at spawn. BaseGameMode.as and FloatingText.as links above.
- Vampire Survivors toggles and the 30-40% lag estimate. FGDB and Steam links above.
- Hades II toggles. Kotaku link above. Supergiant added camera shake disable in response to accessibility feedback (via search snippet of a Game Developer piece, https://cur.at/Q1SvLFd?m=web).
- NT `opt_shake` 0..2 and `opt_freeze` 0..1 options. https://yal.cc/r/17/ntt/objects

### Inferences
- [inf] Shake options in these games are scalars, not on/off switches (NT 0..2, HoH float). Ship a slider.
- [inf] Per-type damage number toggles (HoH style) let an MMO player hide other players' numbers while keeping their own.

### Gaps
- No measured cost (ms per frame) for damage numbers or flashes in any of these games.
- No source for Gungeon bullet clarity settings or Hades effect density rules.

---

## Q5. What transfers to a server-authoritative top-down MMO

### Transfers well
- Local hit tint. HoH's 100 ms red overlay at 50% alpha is per-sprite and needs no time freeze. [code]
- Positional, range-limited shake. HoH's `ShakeScreen(time, amount, pos, range)` with linear distance falloff, run on each client from that client's camera. A boss slam shakes nearby players and not someone across the screen. [code]
- Additive shake stacking with linear time decay and a player scale. [code]
- Damage-threshold hit reactions. D2's rule (no hurt animation below max life / divisor, probabilistic up to 4x) keeps 30-player fights from turning into constant flinching. [doc]
- A distinct "immune/absorbed" state (purple flash, immortal text, sound) separate from "miss". [code]
- Per-type damage number colours and toggles, off-screen cull. [code]
- Per-projectile deflect class (NT `typ`). [doc]

### Does not transfer
- Global freeze frames or hitstop (NT `opt_freeze`). Freezing the world is impossible with other players on screen. At most, freeze only the attacker's and target's sprites locally, for the local player's own hits, for 1 to 3 frames. [inf]
- Unscaled global shake from other players' attacks. HoH `range = -1` is global. In an MMO, only the local player's own big hits and attacks on them should shake. [inf]
- Long i-frame dodge rolls in PvP at MMO latency. Gungeon's 0.35 s invulnerable window is shorter than many round trips plus a 600 ms tick. The server must judge the dodge, and the client will mispredict some. [inf]
- Camera kick per shot (NT 6 px [2nd]). Fine for the local player's own camera, never applied because of another player's shot. [inf]

### Inferences on implementation (Godot 4)
- [inf] HoH-style tint is one `modulate`-like shader uniform per sprite with a 100 ms tween. Cheap in the Compatibility renderer.
- [inf] HoH shake is a sum over a small array each frame. Port it as a `Camera2D.offset` driven by an autoload holding active shakes with `pos` and `range`.

---

## Sources
- Heroes of Hammerwatch script mirror: https://github.com/exp111/HeroesOfHammerwatch
  - https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actors/Enemies/CompositeActorBehavior.as
  - https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Utils/ScreenShake.as
  - https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/Behaviors/Actions/ScreenShaker.as
  - https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/GameModes/BaseGameMode.as
  - https://raw.githubusercontent.com/exp111/HeroesOfHammerwatch/master/assets/scripts/FloatingText.as
- HoH modding docs (Doxygen): https://github.com/kodfod/hohdocs
- Nuclear Throne Together objects reference: https://yal.cc/r/17/ntt/objects
- NTT GML cheat sheet: https://yal.cc/r/17/ntt/gml/
- RPS Nijman interview (not fetched): http://www.rockpapershotgun.com/2013/10/21/interview-jan-willem-nijman-on-nuclear-thrones-feel/
- makegamessa thread: https://makegamessa.com/discussion/1344/vlambeer-s-jn-talks-about-nuclear-throne-juice
- GDC Vault, Nuclear Throne talk: https://www.gdcvault.com/play/1020517/
- Gungeon dodge roll: https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move)
- Gungeon roll i-frames thread: https://steamcommunity.com/app/311690/discussions/0/368542585858479737
- Exit the Gungeon design: https://www.gamedeveloper.com/design/building-i-enter-the-gungeon-i-s-dungeon-climbing-spin-off-i-exit-the-gungeon-i-
- Diablo II breakpoints: https://maxroll.gg/d2/resources/breakpoints-animations
- Vampire Survivors accessibility: https://www.familygamingdatabase.com/accessibility/Vampire+Survivors
- Vampire Survivors Steam thread: https://steamcommunity.com/app/1794680/discussions/0/3194745173775130766
- Hades II settings: https://kotaku.com/hades-2-early-access-god-mode-autofire-timer-1851461987
- Hades accessibility: https://www.familygamingdatabase.com/accessibility/Hades
- Supergiant accessibility (search snippet): https://cur.at/Q1SvLFd?m=web

See it in action (video and wiki pages, not verified frame by frame)
- Gungeon dodge roll: https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move)
- D2 breakpoints and animations: https://maxroll.gg/d2/resources/breakpoints-animations
- HLD abilities (Fandom, blocked to fetch): https://hyperlightdrifter.fandom.com/wiki/Abilities_and_Upgrades
