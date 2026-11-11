# Combat juice sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the report writer corrects it in the report and notes the change at the end of this file under "Changes from research"; the sandbox builder follows the corrected number. Numbers marked (start) are starting values the builder may use until research lands; keep them in one `TUNING` object at the top of the script so they are easy to change.

The study weighs four things together: FEEL AND PIXEL ART, MMO PROBLEMS, IMPLEMENTATION, RUNTIME COST. The sandbox must feel great to fight in, show the MMO problems live (latency, shared screen, crowds, PvP), and show what each layer costs.

## Page
- `studies/feel-combat-juice/sandbox.html`, one hand-written file, no external assets, fonts or images. All pixel art (tiles, sprites, effects, icons) and the bitmap font are drawn or encoded in code. Reuse the bitmap font and glyph atlas approach of `studies/feel-npc-dialog/sandbox.html` (copy the font data).
- Native canvas `<canvas id="c" width="320" height="180">`, scaled with `image-rendering: pixelated`, integer scale where it fits. Works at 390 px phone width, no horizontal overflow, no console errors. Touch: tap to target or move, on-screen skill buttons, drag from a skill button to aim.
- Copy page chrome, HUD style, control layout and keyboard handling from `studies/feel-npc-dialog/sandbox.html` (read it first).
- Title: "Combat Juice Sandbox". Links back to `feel-combat-juice-topdown-pixel.html` and `index.html`.

## World
- A small arena at 320x180 with 16x16 tiles (labelled as half of Asterion's 32 px): stone floor, a few pillars for cover, torches.
- The player character, 4-direction (8 if cheap) walking and attack animations with anticipation / active / recovery frames and a smear frame on melee swings.
- Enemies (PvE): training dummy (never dies, shows numbers), a pack of 3-5 melee mobs that chase, a ranged caster mob that telegraphs a ground circle and a line attack, and an elite with a big telegraphed slam.
- PvP mode: 1-3 simulated enemy players that strafe, dodge skillshots sometimes, use targeted and aimed skills on you, and get crowd-control diminishing returns.
- Crowd: "allied players" slider 0-30 who fight the mobs with their own effects (stress test for shared-screen juice).

## Hybrid combat (core of the study)
- **Targeted**: click or Tab to select a target (target ring under the sprite, target frame in the HUD with HP and cast bar). Auto-attack swings on a timer while in range (start 2000 ms, Tibia-like) or every 1 s (toggle). Targeted skills: a homing bolt (cannot miss once cast, travels to target) and an instant melee strike.
- **Aimed**: skills aimed at the mouse (or drag on touch): a line skillshot projectile that can miss, a cone, and a ground circle with a short delay. Aim preview while held (or quick cast toggle: fire on press at the cursor). Misses show a puff where the projectile ends; near misses show a small "whiff" cue.
- Hotbar 1-6 with cooldown sweeps; a global cooldown (start 1000 ms) and a spell queue window slider (0-400 ms, start 200): a press inside the window before the GCD ends fires on time; outside it is dropped. Show a small timeline of presses vs fires.
- Targeting mode toggle: tab-target only / click-target / soft lock (aimed skills snap to the nearest enemy inside a cone) / free aim only. Tab cycling order: nearest first within the view, then by angle.

## Layers (must match report §7, bottom to top; writer may rename but keep the count and order)
1. **Server combat truth.** Authoritative hit resolution, server tick (slider 50 / 100 / 600 ms), cooldowns and GCD, damage, deaths. Targeted hits resolve on the server at cast end; aimed hits are checked on the server against positions (with optional lag compensation rewind). Show a small server panel in the x-ray view.
2. **Input, targeting and action queue.** Target selection and cycling, aim, soft lock, input buffer and spell queue window.
3. **Client prediction and reconciliation.** Toggle: wait for server / predict animation only / predict animation + effects. Latency slider 0-400 ms. Damage numbers appear only on server confirm (toggle to predict them, and show the "phantom number" problem when a predicted hit is rejected).
4. **Animation.** Anticipation / active / recovery, smear frames, hit reaction pose, death animation and corpse.
5. **Impact feedback.** Per-entity hitstop (freeze the attacker and victim sprites only, never the world or the server) vs global hitstop (toggle, to show why it breaks a shared screen), white flash (start 2 frames), knockback (start 4 px over 6 frames; in PvP toggle server-driven vs cosmetic only), squash, hit sparks.
6. **Camera.** Trauma-based shake (shake = trauma²; decays per second) only for hits you deal or receive, with a cap; small directional kick on your own crits. Shake intensity slider including 0.
7. **Combat text and UI.** Damage numbers in the bitmap font with styles: rise and fade / arc pop / stacking columns / aggregate per target per 250 ms; crit emphasis (bigger, held a few frames, colour); your numbers vs other players' numbers (others' hidden or dimmed by default). Target frame, cast bars, telegraph decals (fill-up circle, line, cone) with lead time.
8. **Audio.** WebAudio synth hits (no samples): layered thump + click, random pitch ±(start 5%), voice limit (start 8) with priority to your own hits; off until first gesture.
9. **Crowd budget, PvP rules and accessibility.** Juice LOD for other players' effects (full / reduced / minimal), effect caps, PvE vs PvP rule set (PvP: no hitstop on the victim player, cosmetic-only or capped knockback, crowd-control DR, enemy player casts always readable), reduce flashing, reduce shake, colour-blind safe telegraph patterns.

## Master controls
- A "Juice" master slider 0-100% that scales all feedback together, plus per-effect toggles (hitstop, flash, knockback, shake, particles, numbers, sound, smear frames) so the reader can turn each off and feel the loss.
- Preset buttons: "No juice", "Tibia classic", "Modern ARPG", "Asterion recommended".

## Efficiency HUD (required)
- Per-layer timing in ms with performance.now(), smoothed: simulation, sprites + animation, effects/particles, combat text, camera + post, UI, total; frame budget bar against 16.7 ms.
- Counters: entities, particles alive, damage numbers alive, numbers merged by aggregation, sounds playing/dropped, blits per frame, server messages per second and bytes per second (illustrative sizes).

## Controls
- Walk WASD/arrows (or tap to move). Tab cycle target, click target. 1-6 skills (hold to aim if aimed, release to cast; quick-cast toggle). Space auto-attack toggle.
- Toggles listed above, mode PvE / PvP, views (x-ray): normal, server truth (ghosts at server positions, hit boxes), timeline (input / predicted / confirmed events), cost view.
- Reset, Pause, slow motion 0.25x (to study frames). Keyboard: V cycle views, P pause, M slow motion.

## Thumbnail
`study.yaml` grabs canvas `#c` after clicking `button[data-demo="showcase"]`: a frozen frame mid-fight, the player landing a crit on an elite (white flash, big crit number, hit sparks), a line skillshot in flight, an enemy telegraph circle filling, target ring and target frame visible, a few smaller numbers from allies dimmed.

## Changes from research
(report writer appends here)

### 2026-11-11, from report.md (values in sandbox pixels are half the Asterion values)
- Spell queue window: start 200 ms → **400 ms** (WoW default; slider stays 0 to 400). One slot, last press wins; a queued cast fires on an event at the ready time, not on the next tick.
- Damage number aggregation window: 250 ms per target → **400 ms** per target, per tier (mine / others) and per damage type (OTClient merge). Crits never merge. 250 ms is kept only as the stacking rule: a non-merged number whose predecessor is under 250 ms old starts `12 - 48 × age / 1000` px lower (sandbox: `6 - 24 × age / 1000`).
- Number caps: add 4 live numbers per target (drop the oldest) and 64 on screen.
- Number motion: 1000 ms life, rise 48 px Asterion (**24 px** sandbox), full alpha until 833 ms then linear fade. Crit numbers 1200 ms, larger digit set, 2x pop for 3 frames.
- White flash: 2 frames → **2 frames full white plus a 4-frame fade, 100 ms total** (Heroes of Hammerwatch's 100 ms).
- Knockback: 4 px over 6 frames → cosmetic recoil **4 px Asterion / 2 px sandbox** on normal hits and **8 px / 4 px** on crits, 3 frames out and 3 back. Server knockback 1 tile over 150 ms; on players 1 tile max, then 10 s knockback immunity.
- Voice limit: 8 → **16** total, at most 3 voices per sound id and 40 ms between starts of one id. Pitch ±5% is kept (within the report's ±1 semitone).
- Tab cycling: "nearest first, then by angle" → nearest by **Chebyshev tiles** within the view, ties by smallest **clockwise angle from facing**, then **lowest unit id**. In combat, only units in combat with you; in PvP mode, players before mobs. Auto-target keeps its pick unless another is at least 1 tile closer.
- Soft lock cone: aimed skills may snap their start direction by at most **15 degrees in PvE, 0 in PvP**; never curve after release.
- GCD 1000 ms and auto-attack 2000 ms kept. Add spell group cooldowns: attack 2000 ms, heal 1000 ms.
- Server tick slider 50 / 100 / 600 ms kept; default **100 ms**.
- Hitstop (new): per entity, only when the local player is attacker or target: normal 3 frames (50 ms), heavy 5, crit 6, kill 8, cap 8 (133 ms); 1 px sprite shake on the target; others' hits 0; PvP victim players 0.
- Trauma shake (new): shake = trauma², max **6 px Asterion / 3 px sandbox**, vertical half, whole pixels, no rotation, decay 1.5 per second, cap 1.0. Hit taken +0.2 + 0.3 × damage / max HP; own crit +0.3 and a 2 px (sandbox 1 px) kick opposite the aim; elite slam +0.6 at the centre, linear falloff over 6 tiles.
- Flinch (new): 2-frame (150 ms) hit reaction only when damage ≥ max HP / 16 or on crits; cosmetic on players.
- Telegraph lead (new): trash 500 ms, caster circle and line 1200 ms (elite level), elite slam 2500 ms, never under 400 ms. Resolve when the marker ends.
- Projectiles (new): fast line skillshot 12 tiles/s, slow orb 6 tiles/s, width 0.75 tile, range 8 tiles; targeted bolt flight `150 × sqrt(tiles)` ms; near-miss whiff within 0.5 tile, dodger and caster only; player hurt circle 14 px Asterion / 7 px sandbox.
- PvP rules (new): damage × 0.5; CC 100%, 50%, then immune, 20 s reset, 6 s cap.
- Death (new): 2-frame flash, squash to 1.2 × 0.8 with a dither fade, corpse at about 133 ms; corpse rot 120 + 120 + 30 s (sandbox may compress).
