# Format: design-curves

Difficulty and learning curve study for one Kingsfoil game. Registered in `formats.yaml`. Used by the `curves`
series, one game per study. Template study: `curves-hearthguard`.

A Curves study answers one question: what made curves fun in past games that share this game's conditions,
and what is the smallest set of rules that recreates that feeling here? It is grounded in research, built on
what worked before, and judged by taste. The method below replaces the generic agent split in
[RESEARCH.md §2](../RESEARCH.md#2-research-with-parallel-agents). Everything else in RESEARCH.md still applies.

## Pages

- Study page `{id}.html`, built by `build.py` from `report.md`, `figs*.html` and `demos*.js`.
- Curve lab `{id}-lab.html`, optional: a single hand-written file (`sandbox.html`), no external assets
  (the one exception is the shared top bar: keep `<script src="nav.js" defer></script>` before `</body>`). It
  plots the study's Curve Spec (§11) with sliders for the tuning knobs, so the team can tune by feel before
  touching the game. Thumbnail: `thumb: from: page` or `from: sandbox` with the lab's main canvas.

## Starting a Curves study

Run `/game-research-site` with this prompt, filled in:

> Research difficulty and learning curves for **<game>** (<loop and progression in 3-4 lines>, live at <URL>,
> repo <path>, Kingsfoil universe). Series `curves`, format `design-curves`.
> Structural conditions: <input, session length, randomness, cost of failure, solo/social, platform>.
> Twin candidates: <list>; confirm, prune and extend them.
> Follow `docs/formats/design-curves.md`: its research method, evidence grades, glossary and report layout.

The study's sections map to the study template: design intent and fun hypotheses (§3), our current build at
minute 5 / 30 / 120 (§4), twins (§5), lineage (§6), pattern cards and anti-patterns (§7, §10), natural experiments
(§9), the Curve Spec (§11), instrumentation and playtest protocol (§13), and the backlog (§14).

## Research method

### Principles

1. **Structural twins, not genre lists.** Pick reference games by shared conditions: input type, session
   length, source of randomness, cost of failure, solo or social, platform. Say why each twin was chosen.
2. **Trace the lineage of each pattern.** Where it first appeared, how later games refined it, and why.
   Past games ran the experiments; we study the results.
3. **Natural experiments are the best evidence.** Patch notes plus player reaction, difficulty reworks, mode
   additions, published telemetry, postmortems, GDC talks, designer interviews.
4. **Theory is a lens, not filler.** Use flow, Koster, Juul, MDA, DDA papers or skill atoms only where they
   explain a case. The glossary below fixes the words.
5. **Efficiency.** The minimum rule, formula or table that produces the feeling. Prefer patterns that are cheap
   to build, tune and test with 5 players.
6. **Record taste.** Every study states fun hypotheses and anti-patterns.

### Evidence grades

Keep the library's verification tags ([V], [I], [U], [K], see the vfx-pixel doc) and add a strength grade:

| Grade | Means | Examples |
|---|---|---|
| **E1** | Data or telemetry | Published numbers, stats sites, A/B results, our own play logs |
| **E2** | Designer statement | Postmortem, GDC talk, interview, the rationale in an official patch note |
| **E3** | Community consensus | Wikis, large forum threads, review aggregates |
| **E4** | Anecdote | One post, one video |

Write both inside one bracket: `[V, E2, S14]`. A natural experiment is a change (patch, rework, new mode) plus
the reaction to it, with the date, the version and the before and after numbers when known.

### Agent split (6-8 agents, one message)

Write `notes/CONTEXT.md` first ([RESEARCH.md §1](../RESEARCH.md#1-scope-the-request)), including the game's
structural conditions, the twin candidates, the principles and the evidence grades. Then:

0. **Current build** (`01-current-build.md`). Reads our game's repo, play logs and bot runs, never the web.
   Curve tables from the real constants, friction and fun at minute 5 / 30 / 120, what is not instrumented,
   and every tuning knob with its file and line. Can start before the others.
0b. **Player telemetry** (`02-telemetry.md` plus `telemetry-aggregates.json`), when the game has real player runs
   (Curves #2 MatchRPG did). Funnel and hazard by stage, learning by lifetime run, death types, version comparisons,
   with player-weighted numbers next to run-weighted ones. Raw data stays out of the repo: notes and the page carry
   aggregates only, no player ids, no cell under 3 players. Figures read the aggregates file.
1. **Twin selection and lineage A**: the oldest twins and the patterns they started.
2. **Twin lineage B**: the modern twins and how they refined those patterns.
3. **Natural experiments**: patch notes, difficulty reworks, mode additions, published telemetry, with player reaction.
4. **Designer sources**: postmortems, GDC talks, interviews about curves in the twins.
5. **Theory and papers**, only where they explain a case in the twins: DDA, player modelling, learnability,
   failure research. Newest year included.
6. **Co-op, social and session conditions** specific to the game (for example scaling for 1-3 players, or
   MMO population effects).
7. **Measurement**: how twins and researchers measured curves, and what a 5-player collective can measure.

Every agent writes pattern cards in its notes and adds missing terms under "Glossary additions".
The gap check ([RESEARCH.md §3](../RESEARCH.md#3-gap-check-one-round)) also greps for every twin and every pattern named in `CONTEXT.md`.

## Glossary

The series vocabulary. Every Curves study uses these words with these meanings and does not redefine them.
A study that needs a new term adds it here in the same PR. Researched in `studies/curves-hearthguard/notes/00a-glossary-theory.md`
and `00b-glossary-practice.md`.

Terms marked *(qualify)* are in use but carry a caution. Sources are named by author and year; full citations
and URLs are in the two notes files.

**Curves**

| Term | Meaning in this series | Source |
|---|---|---|
| Difficulty curve | The challenge the game presents over time or progress, apart from player power. | Schreiber 2010; series |
| Power curve | The player's means over time: levels, talents, gear, upgrades. Plot it with the difficulty curve. | series |
| Felt difficulty | Difficulty against power against skill. The only curve players experience. | series |
| Learning curve | What the player can do and understand over time. Never write "steep" without naming the axes. | Linehan et al. 2014 |
| Interest curve | Player interest across a session: hook, rising peaks with rests, a climax. Playtesters draw it, not designers. | Schell 2008 |
| Ramp | A steady rise in challenge. A pure ramp feels grindy without relief beats. | practice |
| Sawtooth | Challenge rises inside a set, drops when the next set starts, and each peak is higher. Always name the set (wave, chapter, world, round). | Linehan et al. 2014; practice |
| Spike / plateau | A sudden jump in challenge / a stretch with no rise. Found with win rate by stage. | practice |
| Cadence | How often a beat repeats (an elite every N waves). | series |
| Tempo | How fast the player must act inside a beat. | series |

**Pacing**

| Term | Meaning in this series | Source |
|---|---|---|
| Intensity | A per-player number raised by damage and danger, decaying when nothing engages. | Booth 2009 (Left 4 Dead) |
| Build up, peak, relax | Full threat until intensity peaks, hold 3-5 s, fade, then 30-45 s of low threat. The measured form of tension and release. | Booth 2009 |
| Relief beat | A planned low-threat stretch after a peak. | Booth 2009; practice |
| Pacing director | A system that changes when and how many threats arrive, never their stats. Not DDA. | Booth 2009 |
| Mow | A planned beat where enemies die faster than they arrive. The series' word for a power-fantasy beat. | Kingsfoil |
| Difficulty over time | Difficulty that rises with real minutes, not only progress. | Risk of Rain 2 |

**Adapting difficulty**

| Term | Meaning in this series | Source |
|---|---|---|
| DDA *(qualify)* | Automatic change to challenge from measured player performance during play. Always say which kind: stat, supply or pacing. | Hunicke 2005; Zohaib 2018 |
| Supply DDA | Changing the flow of health, items or gold when the player keeps falling short. | Hunicke & Chapman 2004 (Hamlet) |
| Player-steered difficulty | Difficulty the player changes through choices inside play. Preferred over hidden DDA. | Chen 2007 |
| Rubber banding *(qualify)* | Hidden adjustment that pulls the leader back or the trailing player forward. Resented when noticed. | practice |
| Catch-up mechanic | A visible tool that helps whoever is behind. | Schreiber 2010 |
| DDA paradox *(qualify)* | Adjustment helps while unnoticed and hurts autonomy once noticed. Our name; the evidence is three small studies. | series |
| Placebo difficulty | Players feel a game adapts when told it does, even when it does not. Framing is a free knob. | Denisova & Cairns 2015 |
| Player modelling | Detecting and predicting player traits or states from play data. | Yannakakis & Togelius 2018 |

**Choosing difficulty**

| Term | Meaning in this series | Source |
|---|---|---|
| Difficulty mode | A preset bundle of settings chosen up front. Cheap but coarse. | practice |
| Assist mode | Separate, named, player-chosen tweaks (speed, damage taken, skips). | Celeste 2018 |
| Stacking assist | An assist that grows with each failure, with a cap. | Hades God Mode |
| Ascension ladder | An opt-in numbered ladder of stacking modifiers, replayed after a first clear. | Slay the Spire, Hades, Deep Rock Galactic |

**Failure**

| Term | Meaning in this series | Source |
|---|---|---|
| Cost of failure | What a failure takes away: time, items, XP, run progress. Always record minutes lost. | practice |
| Energy / life / setback / termination punishment | Losing health / losing a life or retry / losing progress and replaying / the run ends. | Juul 2009 |
| Death penalty | The specific loss on death (XP, items, souls). | practice |
| Time to retry | Seconds from failure to regaining control. | practice (Super Meat Boy) |
| Checkpoint | A saved restart point inside an attempt. | practice |
| Run-based / persistent progression | Power resets each attempt / power carries over. Meta-progression is persistent unlocks over run-based play. | practice |
| Failure as information | Failure that shows what to change. Players rate games higher when they blame themselves and fail some before winning. | Juul 2009 |
| Paradox of failure | We avoid failure, games make us fail, and we seek them anyway. Framing only. | Juul 2013 |

**Learning**

| Term | Meaning in this series | Source |
|---|---|---|
| Skill atom | Act, the game updates, feedback, the player updates a mental model. The smallest unit of a learning curve. | Cook 2007 |
| Skill chain | A graph of skill atoms where later skills build on earlier ones. | Cook 2007 |
| Skill burnout | A learned skill stops being useful, so players drop it. Not player fatigue. | Cook 2007 |
| Introduce, practise, combine | Each new skill enters alone and simply, then combines with older ones. | Linehan et al. 2014 |
| Teach, test, twist | Introduce, develop, twist and conclude a mechanic inside one level. | GMTK 2015 (Super Mario 3D World) |
| Onboarding | The first-session path from launch to first success. Measured as a funnel. | Fan 2012 (Plants vs. Zombies) |
| Gating | Holding a mechanic back until the earlier ones are learned. | Fan 2012 |
| Cognitive load | How many things the player must track at once. | practice |
| Telegraph | Showing enemy intent before the hit lands. | practice; ai-rts-enemy study |
| Skill floor / ceiling | The skill needed to progress / the point where more skill stops helping. | practice |
| Grok | Knowing a pattern so well it is automatic. | Koster 2004 |

**Feelings and needs**

| Term | Meaning in this series | Source |
|---|---|---|
| MDA | Mechanics produce dynamics, which produce aesthetics (feelings). The default lens. | Hunicke, LeBlanc & Zubek 2004 |
| MDA aesthetics | Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission. Name one instead of "fun". | Hunicke et al. 2004 |
| Flow *(qualify)* | Deep absorption with matched challenge and skill, clear goals, direct feedback. A state, not a synonym for fun. | Csikszentmihalyi 1990; Chen 2007 |
| Flow channel | The band between anxiety (too hard) and boredom (too easy). Planned spikes outside it can be good. | Csikszentmihalyi 1990 |
| Fun as learning *(qualify)* | Games are fun while players learn their patterns, and boring once mastered. | Koster 2004 |
| Fiero | Triumph after beating a hard obstacle. | Lazzaro 2004 |
| Four keys *(qualify)* | Hard fun, easy fun, altered states, people factor. Qualitative, 30 players. | Lazzaro 2004 |
| SDT needs | Competence, autonomy, relatedness. Meeting them predicts enjoyment and continued play. | Ryan, Rigby & Przybylski 2006 |
| PENS | A survey of competence, autonomy, relatedness, presence and intuitive controls. Use in playtests. | Ryan et al. 2006 |
| Challenge types | Performative, cognitive, emotional, decision-making (the CORGIS scale, 30 items, 1-7). Use in playtest surveys. | Denisova, Cairns, Guckelsberger & Zendle 2020 |
| Perceived / actual difficulty | How hard players feel it is / measured challenge. Measure both. | Juul 2009; Denisova & Cairns 2015 |

**Measuring**

| Term | Meaning in this series | Source |
|---|---|---|
| Funnel / churn point | Share of players reaching each step / a step with an outsized drop. | practice |
| Win rate by stage | Share of attempts that clear a stage. Attempts are the denominator, not players. | practice |
| Time to kill / time to die | Seconds to kill a target / to be killed. | practice |
| Death heatmap | A map of where players die. | practice |
| Completion rate | Share of starters who finish. Steam counts owners, not starters. | practice |
| D1 / D7 retention | Share of new players back on day 1 / day 7. Vendor benchmarks only. | GameAnalytics (vendor) |

**Don't use:** a bare "fun" (name the aesthetic), Yerkes-Dodson (designers use it loosely), "steep learning curve" without axes.

## Report

`report.md` is the text of the study page. The recipe (`build.py`) parses it with regular expressions, so the
layout below is a contract, not a style guide. Counts (cards, twins, sources) are read from the report, not fixed.

### Skeleton

```
# <Title, same as the catalog title>

**Kingsfoil Studios · Research study · <Month Year>**

---

## Context
## 1. Executive summary
## 2. How to read this study
## 3. Design intent and fun hypotheses
## 4. Our current build: minute 5, 30 and 120
## 5. Structural twins
## 6. Lineage: a timeline
## 7. Pattern cards
## 8. Comparison scorecard
## 9. Natural experiments
## 10. Anti-patterns
## 11. Curve Spec for <game>
## 12. The curve lab
## 13. Instrumentation and playtest protocol
## 14. Backlog: ranked by fun impact ÷ cost
## 15. "See it in action" index
## 16. What remains unverified (and corrections)
## 17. Sources
```

The recipe finds sections by the start of the heading (`## 7.`, `## Context`). Keep the numbers; the words after
them may change. A study without a curve lab keeps §12 and uses it for "how to tune without a lab".

### §2 How to read

Two tables and a bullet list. Tag rows: `| **[V]** | text |`. Grade rows: `| **E1** | text |`. Then one bullet per
rating criterion, in the order the ratings use. The series criteria are **Fun impact · Evidence · Cheapness · Fit · Testability**.

### §3 Fun hypotheses

```
| # | Players should feel | When | Because of | How we test it |
|---|---|---|---|---|
| H1 | Relief and power: the horde melts | End of each chapter, minute ~3 of 3.5 | B2 sawtooth power ratio | Kill rate per second in the last wave vs the first |
```

Ids `H1`, `H2`, … The "Because of" cell names pattern card ids.

### §5 Structural twins

```
| Twin | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| Kingdom Rush (2011) | ◐ mouse, towers not a hero | ● 10-20 min a level | ● fixed waves | ◐ level restart | ○ solo | ● browser, mobile | Wave pacing and stars |
```

Each condition cell starts with `●` (same as our game), `◐` (partly) or `○` (different). The figure counts them.

### §6 Timeline

Same as vfx-pixel §3: generations are bold lines `**Gen 1: title (years)**`, events are bullets starting with a bold year.

### §7 Pattern cards

An intro, then families and cards as `###` headings:

```
### Family A: Pacing and waves

### A1. Build-up, peak, relax

*Lineage.* Left 4 Dead (2008) → Vermintide → … (why).

*Feeling.* Tension that releases before it tires.

*Mechanism.* The minimal rule, formula or table. Code blocks are fine.

*Works when / breaks when.* ...

*Evidence.* Graded claims with sources: [V, E2, S14].

*Cost and knobs.* S, M or L, then the knobs.

*In <game>.* How it maps, with [K] facts from the repo.

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 4
```

- Family letters A–H; card ids are one letter plus one digit (A1–A9). 8–15 cards per study is the target.
- The eight field markers must match exactly, each at the start of a line, in this order.
- `*In <game>.*` uses the game's short name, for example `*In Hearthguard.*`.
- The ratings line holds exactly five digits, in the criteria order from §2.

### §8 Scorecard

```
| # | Pattern | Fun | Evid. | Cheap | Fit | Test | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Build-up, peak, relax | 5 | 4 | 4 | 5 | 4 | 22 |
```

Then a paragraph starting `**Reading the table.**`.

### §9 Natural experiments

```
| # | Game | When | Change | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Celeste | Jan 2018 | Assist mode at launch | ... | E2 | ... |
```

Text before and after the table is free.

### §11 Curve Spec

The layer list becomes the clickable stack figure, then formulas, then the knob table:

```
**Layers, bottom to top.**
1. **Run length and chapter budget.** One or two sentences.
2. ...

**Formulas.**

    mob_hp(c, w) = base_hp × HP_SCALE[c] × (1 + WAVE_STEP × w)

| Knob | Where | Now | Proposed | Range | Moves |
|---|---|---|---|---|---|
| HP_SCALE | scripts/data/chapter_defs.gd:20 | 1.0, 2.3, 4.6, 8.0, 13.0 | ... | ... | The chapter sawtooth |
```

### §14 Backlog

```
| Rank | Change | Cards | Fun impact | Cost | Score | Hypothesis |
|---|---|---|---|---|---|---|
| 1 | Show the Hearth's HP loss per wave | C2 | 4 | S | 4.0 | H3 |
```

Fun impact 1–5; cost S, M or L counts as 1, 2 or 3; Score = impact ÷ cost, one decimal. Rows sorted by score.

### §15 See it in action

```
| # | Game | Curve idea | URL |
|---|---|---|---|
| 1 | Left 4 Dead | AI director build-up, peak, relax | https://left4dead.fandom.com/wiki/The_Director |
```

### §17 Sources

Same as vfx-pixel §14: an intro line, groups as bold lines, numbered entries. The number is the `[S#]` id.

## Recipe settings

The format's `build.py` is generic. A new Curves study copies it unchanged and sets these in `study.yaml`:

```yaml
page_text:
  game: MatchRPG            # must match the "*In <game>.*" card marker
  lab_name: the curve lab   # omit the sandbox block in study.yaml to build without a lab
  lab_blurb: One sentence for the lab call-to-action.
  context_title: Context
  byline_month: December 2026
figs_after: {B2: [director]}      # figures shown right after a pattern card
index_chips: [{q: 'wc3|warcraft', label: 'Warcraft III maps'}]
```

Title and meta description come from the catalog entry. The hero (`hero.html`) uses `@@TITLE@@` and `@@SERIES@@`.
`studykit new` copies the template's `hero.html` with its copy and lab link but not its hero demo: rewrite the deck,
the caption and the link, and register a `hero` demo. Demo files that wrap their code in a block must export shared
helpers (Curves #2 uses `globalThis.MR`) for later demo files.
Place a hand-made figure anywhere outside §7 by writing `@@FIG:name@@` on its own line in `report.md`.
The build fails with a message when a card misses a marker, a scorecard row disagrees with its card, a twin cell lacks
its ●/◐/○ mark, or a backlog score is wrong or out of order.

## Figures

At least 15, mostly interactive, built from the report's numbers. The recipe generates five from the report:
twin match matrix (§5), timeline (§6), scorecard with radar (§8), Curve Spec stack (§11) and backlog impact vs
cost (§14). The rest are hand-made in `figs*.html` and `demos*.js`. Good Curves figures plot the game's real
constants (from `01-current-build.md`) next to a twin's curve, with sliders on the knobs.
