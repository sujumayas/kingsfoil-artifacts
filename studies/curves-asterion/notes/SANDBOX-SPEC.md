# Asterion curve lab: spec (`sandbox.html` → `site/curves-asterion-lab.html`)

A single hand-written HTML file, no external assets except `<script src="nav.js" defer></script>` before `</body>`.
Same look and structure as `studies/curves-matchrpg/sandbox.html` (dark palette, knobs column sticky on the left,
panels on the right, summary cards on top, "Watch:" lines under each chart, a "Now / Proposed / Reset" per knob).
Under 600 KB. No console errors, no horizontal overflow at 390 px.

It plots the Curve Spec of the study (§11 of report.md) with one slider per knob. The lab is a model of the
game's constants and of the balance harness's exp/h ladder, not the game. Every "Now" value must match
`notes/01-current-build.md` (file:line). Where this spec and that note disagree, the note wins; tell the lead.

## Knobs (the §11 table; "Now" from the repo, "Proposed" from §11)

Group "Level curve"
- `EXP_SCALE` multiplier on the cubic `exp(L) = (((L−6)·L + 17)·L − 12) / 6 × 100` (now 1.0, range 0.5–2.0)
- `EXP_STAGES` toggle plus a 4-row table (level band → exp multiplier), default off; proposed values from §11 if any
- `HP_PER_LEVEL` (now 5, range 3–10), `MANA_PER_LEVEL` (now 10, range 5–20) (informational: feeds the death-risk panel)

Group "Skills by use"
- `SKILL_MULT` (now 1.08, range 1.04–1.20; Tibia 1.1 and 1.2 marked), `SKILL_BASE` sword/distance/shielding (now 50/30/100)
- `SWING_DUTY` share of session time swinging (now 0.5, range 0.2–0.9), `SWINGS_PER_MIN` (30: one swing per 2 s)
- `ML_MULT` (now 1.4, range 1.1–4.0; Tibia knight 3.0, paladin 1.4, mage 1.1 marked), `MANA_PER_HOUR` spent (range 0–20000)

Group "Death"
- `DEATH_EXP_LOSS` (now 0.10, range 0–0.25), optional "Tibia 8.x level-scaled loss" toggle that uses the formula in notes/02-tibia-lineage.md
- `GEAR_DROP` per slot (now 0.10, range 0–0.5), `BAG_DROPS` toggle (now on)
- `CORPSE_MIN` (now 30, range 5–60), `WALK_MS_PER_TILE` by level (derived, read only), `HEARTSTONE_CD_MIN` (now 5)
- `BLESSING_COST` as a proposed knob only if §11 proposes blessings (default: hidden)

Group "Session and group"
- `SESSION_MIN` (now 45, range 20–180), `SESSIONS_PER_WEEK` (3, range 1–14)
- `PARTY_SIZE` (1–5), `PARTY_BONUS` (now 0.20, range 0–0.5), `SHARE_RANGE` level-gap rule if §11 proposes one
- `EXP_PER_HOUR` ladder: a small editable table by level band (from the balance harness, 01-current-build.md), with a
  "hunting at the best target for my level" default

## Panels (each: title, legend, SVG chart, caption with model vs measured, a "Watch:" line)

1. **Summary cards**: hours to level 20 / 50 / 100 at the ladder; sessions to those levels; death cost in minutes at
   level 8, 30, 60; sword skill after 100 hours; magic level after 100 hours.
2. **The long curve**: x = hours of play (log or linear toggle, 0–2000 h), three lines: level (cubic ÷ ladder), sword
   skill (tries ladder ÷ swings/h), magic level (mana ladder ÷ mana/h). Dashed: Tibia 7.x values (mult 1.1, ML by vocation).
   Marks for the walk-beat levels 10, 20, 34, 51 and the item gates (wands 10/15/20 ML; min_level bands).
3. **Death cost**: x = level, y = minutes of hunting lost by one death (exp loss ÷ exp/h at that level), plus the
   corpse-run walk (tiles × ms per tile at that level, both ways) and the share of worn gear expected to drop
   (1 − 0.9^9, with the bag). Dashed: Tibia 8.x level-scaled loss. A band for the vision's target "about one session".
4. **A session at level L**: slider L; stacked bar of a `SESSION_MIN` session: walk out, hunt, walk back, buffer for
   a death; exp gained as share of the level; skill tries gained; expected deaths at the harness's death risk.
5. **Corpse run odds**: distance from temple (tiles) vs the 30-minute window at the player's walk speed, with the
   heartstone rule (destroyed by death) and a friend's walk if `PARTY_SIZE` > 1; success region shaded.
6. **Party share**: exp per member per hour for 1–5 members at the same target, with the 20 % bonus; the lines
   split when a `SHARE_RANGE` rule is on and the level gap grows.
7. **Exp stages (if §11 proposes them)**: the long-curve line with and without stages.

Buttons: "Now" (repo values), "Proposed" (§11), "Tibia 7.x" (a preset for the twin), "Reset". A status line names
what the last change moved. Keep all math in a few pure functions at the top of the script
(`expForLevel`, `skillTries`, `manaForML`, `speedForLevel`, `stepMs`, `deathCostMin`), ported literally from the
repo's Go code as quoted in 01-current-build.md, and unit-check them against the test values the note lists
(L2 = 100, L8 = 4200; rat hunting death at level ≤ 4 ≈ 10 min, level 8 ≈ 52 min).
