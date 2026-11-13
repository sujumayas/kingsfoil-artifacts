# Format: mechanics-playable

Mechanics study of one Kingsfoil game, with a playable sandbox. Registered in `formats.yaml`; template study
`mechanics-speedrunner` (its recipe was cloned from `feel-loot-pickup`). Used by the `mechanics` series.
The layout is the feel-pixel layout ([feel-pixel.md](feel-pixel.md)) with the changes listed under
"Differences from feel-pixel". Everything feel-pixel says about markers, tags, the scorecard, gems, the
see-it index and sources applies here unchanged.

A Mechanics study answers one question: what made the mechanical kit of games like ours feel great, and
which of those techniques should our game adopt, in what order? It covers the whole kit of one game
(movement, animation, elements, enemies, map design, difficulty curve, social loops, and whatever else the
game needs), not one interaction.

## Pages

- Study page `{id}.html`, built by `build.py` from `report.md`, `figs*.html` and `demos*.js`.
- Sandbox `{id}-sandbox.html`, required: a single hand-written file (`sandbox.html`), no external assets
  (the one exception is the shared top bar: keep `<script src="nav.js" defer></script>` before `</body>`).
  A native canvas `#c`, by default 640x360, drawn in the game's own art style (SpeedRunner is flat vector ink
  on paper, so no `image-rendering: pixelated`; a pixel-art game would keep it). The reader plays a short
  level with the report's recommended architecture (§7) and can switch each technique on and off to feel
  the difference. A cost HUD shows per-layer ms next to the 16.7 ms frame budget, as in every library sandbox.
  The homepage thumbnail is grabbed from this canvas (`thumb: from: sandbox` in `study.yaml`).

## Starting a Mechanics study

Run `/game-research-site` with this prompt, filled in:

> Research the mechanics of **<game>** (<loop in 2-3 lines>, live at <URL>, Kingsfoil universe). Series
> `mechanics`, format `mechanics-playable`. Areas: <movement, animation, elements, enemies, maps, curve, social,
> plus any the game needs>. Reference games: <list>; confirm, prune and extend them.

## Research method

The generic split in [RESEARCH.md §2](../RESEARCH.md#2-research-with-parallel-agents) is replaced by one
agent per mechanical area the user named, plus:

0. **Current build** (`01-current-build.md`): the game's real constants from its source or its served
   bundle (every tuning number with its name), what each map teaches, what is instrumented, what is missing.
   Never the web. Can run before the others.
1..N. **One agent per area** (movement, animation, elements, enemies, map design, difficulty curve, social).
   Each collects techniques as profiles-in-waiting: what it is, how it works with numbers, which games used
   it (with a see-it URL), how it feels, where it breaks.
N+1. **Speedrun and race infrastructure** (always): timers, splits, ghosts, replays, instant restart,
   verification and anti-cheat, leaderboards, seasons. These are the social mechanics of a time-attack game.
N+2. **Gems** (always): field-validated open-source code, with licence and maturity evidence.

Every agent reads `notes/CONTEXT.md` first. The gap check greps the notes for every game and area the
user named.

## Report

Same skeleton as feel-pixel, 14 sections, same markers:

```
# <Title, same as the catalog title>

**Kingsfoil Studios · Research study · <Month Year>**

---

## Context
## 1. Executive summary
## 2. How to read this study
## 3. Generations: a timeline
## 4. Technique profiles
## 5. Comparison scorecard
## 6. Deep dives
## 7. Combinations: a layered architecture for <game> (<engine>)
## 8. Reference implementation: the <Name> Sandbox
## 9. Gem findings
## 10. Learnings and anti-patterns
## 11. "See it in action" index
## 12. What remains unverified (and corrections)
## 13. Prototype roadmap for <engine>
## 14. Sources
```

Profiles use the seven feel-pixel markers in this order: `*In plain words.*`, `*How it works (technical).*`,
`*Cost / performance.*`, `*Games that used it.*`, `*How it feels.*`, `*Risks.*`, `*Ratings 1–5 (author judgement):*`.
Families A–H, one letter plus one digit per profile. 30–40 profiles is the target for a whole kit.

### Differences from feel-pixel

- **Families are the game's mechanical areas.** One family per area the user named (movement, animation,
  elements, enemies, maps, curve, social) plus the areas the study adds (for SpeedRunner: the race
  infrastructure). Say the mapping in the §4 intro.
- **Rating criteria.** Default five: **Feel · Readability · Run fit · Cheapness · Evidence**. Feel is how good
  it is in the hands at 60 fps (or 120 Hz physics). Readability is how fast a player understands it on
  first sight. Run fit is how well it serves a restart-heavy, time-attack, leaderboard game. Cheapness is the
  cost for a small team in the game's engine. Evidence is how strong the sources are (telemetry or designer
  statement 5, community consensus 3, a single post 1). A study may rename them in §2 and in its recipe's `RLAB`.
- **§7 targets the game's own engine**, named in the heading, with the layer list and pseudocode in that
  engine's idiom. SpeedRunner is hand-written Canvas2D JavaScript with a fixed 1/120 s physics step.
- **§13 is a ranked backlog** for that engine: change, profiles it comes from, impact 1–5, cost S/M/L, score.
- **§6 deep dives compare numbers across games** (jump heights in body lengths, coyote frames, restart
  seconds, ghost sampling rates) in tables the figures read.
- **The sandbox is a level, not an arena.** Input-driven, keyboard and touch, with a restart key, a timer
  and a ghost, so the reader feels the race loop and not only the movement.

## Recipe settings

The recipe is cloned from `feel-loot-pickup/build.py`. The study-specific parts listed at the end of
[feel-pixel.md](feel-pixel.md) must be updated: asserted counts, §6 table headers, the figure-to-profile map,
index chips, the Context split sentence, title, meta, CTA and sandbox copy, byline month, `RLAB`.
