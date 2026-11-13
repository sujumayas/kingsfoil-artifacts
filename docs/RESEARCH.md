# Researching a study

How to turn a research goal into a report that meets the library's quality bar. This covers scoping,
research, writing and figures. The mechanics of ids, scaffolding, building and shipping live in
[ADDING-A-STUDY.md](ADDING-A-STUDY.md); series and formats in [FORMATS.md](FORMATS.md); the exact report
layout in the format doc, `docs/formats/<format>.md`.

The quality bar is the newest recipe study (today `vfx-snow-32px` for `vfx-pixel`; the format template stays `vfx-light`, so replace a scaffold's `build.py` and `core.js` with the newest study's). Read its `report.md`, its
`notes/CONTEXT.md` and one of its notes before starting.

## 1. Scope the request

A study needs these answers. Take them from the request first, then from `site/catalog.json` and
`site/taxonomy.json`. Ask the user only for what is still missing, in one round of at most 4 questions.

- **Genre and reference games.** Never assume; the games vary a lot.
- **The design question or system**: enemy AI, procedural maps, economy, combat feel, netcode, and so on.
- **Project constraints**: which Kingsfoil project (taxonomy `project`), engine and renderer, team size,
  single or multiplayer (lockstep determinism?), target hardware, simple-and-reliable versus experimental.
- **Series and format.** Always ask, even when the answer looks obvious: recommend a series and a format
  and let the user confirm or change them. How to choose, and how to add a new one: [FORMATS.md](FORMATS.md).
- **Angle and language.** Default: how it feels to play with or against it, plus technical depth, in English
  (the library language) unless the user asks otherwise.

Also:
- **Unknown terms** (product names, acronyms): search the web before interpreting them. In the RTS study,
  "JEV" turned out to be TypeSafe's Jev decision model, not JEPA.
- **Lists the user attaches** (for example a list of techniques from another AI): every item is required
  coverage. Check that each one exists; such lists can contain invented names or numbers.
- **Unattended runs**: take the most reasonable reading, write it down in the report's Context section, and continue.
- **A study that builds on an earlier one** (the same concept at another scale, engine or genre, as
  `vfx-snow-32px` builds on `vfx-snow`): do not research the concept again. Put "what the earlier study
  settled" in `CONTEXT.md`, split the research only over what changes (for a scale change: games at that size,
  art craft at that size, which buffers must grow, characters, measured costs), and have the report give a
  conversion table from the earlier study's numbers. 5 researchers, a benchmark agent and 2 gap agents were enough.

Write the answers to `studies/<id>/notes/CONTEXT.md`: the user and project, the series and what earlier
studies already covered (with URLs), the scope, the goal, and the researcher rules from §2. Every researcher reads this file.

## 2. Research with parallel agents

Split the goal into 6–8 non-overlapping research agents and launch them in one message. Adapt the angles
to the topic. A format doc can replace this split with its own method; `design-curves` does. The default split:

1. **History and classic era**: the oldest and simplest approaches, the games that defined them,
   community and modding knowledge (wikis, forums, data-mining), the numbers players notice.
2. **Mainstream industry architectures**: what studios ship, from primary sources (GDC talks, Game AI Pro,
   GPU Gems, Game Programming Patterns, postmortems, developer blogs).
3. **Systems- or spatial-specific techniques** for the topic, with performance figures.
4. **Academic and rare publications**: surveys, competitions, AIIDE/CIG/FDG/CHI PLAY papers, theses,
   overlooked but influential papers, and what their results mean in practice.
5. **Newest developments (last ~18 months)**: shipped versus research-only, inference cost, honest
   viability. Always search for what is new this year.
6. **Design and player experience**: what makes it feel good, fair, readable; mechanics from shipped
   games; anti-patterns.
7. **Gems (always)**: field-validated open-source code and tools. Real adoption (stars, shipped games,
   maintenance), licence, reference implementations by paper authors, engine plugins, datasets. For each:
   URL, licence, maturity evidence, what it saves the developer.
8. Optional: one agent per extra game, entity or sub-question the user named.

Researcher rules (copy them into `CONTEXT.md`):
- Cite a URL for every claim. Give concrete numbers: ms, counts, ranges, dates, versions.
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported figures.
- Never copy or download images. Collect a "see it in action" URL (wiki, article, devlog or video page) for every game example.
- Quotes under 15 words.
- If a site is blocked, say so and try mirrors (archive.org, author pages, GitHub READMEs, liquipedia, aiandgames.com).
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. End with Sources.
- Save to `studies/<id>/notes/NN-topic.md` (for example `04-academic-rare.md`). Stop at about 25–35 tool
  calls, then reply with a summary of at most 200 words.

Wait for every agent to finish before moving on. Never predict their results.

## 3. Gap check (one round)

1. Read the agents' summaries, not the notes, to keep context small.
2. Grep the notes for every item the user named and every technique you expect (`grep -ciE term notes/*.md`).
3. If critical gaps remain, especially where the user put emphasis, launch at most 2 extra agents. Then move on.
4. Verify claims about the newest products yourself with a few web searches: release dates, sizes, latencies, licences.

## 4. Write the report

One writer agent reads all notes, the format doc (`docs/formats/<format>.md`) and the template study's
`report.md`, and writes `studies/<id>/report.md`: 10k–20k words, every claim tagged [V]/[I]/[U]/[K] with an [S#] source.

- Pick 5 rating criteria that fit the goal (the VFX series uses Simplicity · Speed · Pixel taste · Mood · Interactivity).
  Label ratings as author judgement.
- The architecture section proposes a layered design for the user's actual project, with short pseudocode.
- If the user supplied a list, grep the report for each item at the end and cover anything missing.

## 5. Figures and sandbox

The recipe and the validator enforce the mechanics. These are the content rules:

- **At least 15 figures, ideally 20–25**, mostly interactive or animated, each explaining an algorithm or
  idea: state diagrams with animated highlights, tree or planner tick-throughs, sliders driving live curves,
  small live simulations, draggable fields or heatmaps, log-scale cost charts with a budget line (16.7 ms
  frame), the sortable scorecard with a radar, the clickable architecture stack, the timeline.
- Figures use only facts from the report. Label illustrative numbers as illustrative.
- No game screenshots, logos or copyrighted art. Each game gets a "See it in action ↗" link; original abstract illustrations are fine.
- Animations use `requestAnimationFrame` and pause offscreen (IntersectionObserver).
- The sandbox, when the study has one, is a playable version of the report's recommended architecture.

- **Parallel builders need a shared contract.** Before the report is written, put the sandbox spec in
  `notes/SANDBOX-SPEC.md` (including the §7 layer list, so §7, §8 and the sandbox agree). Once the report exists, put
  the fixed figure names and their file owners in `notes/FIGURES-PLAN.md`. Then the report writer, the sandbox
  builder and two figure builders can run at the same time. Give one of the figure builders sole ownership of
  `build.py` and `core.js`. `vfx-fire` was built this way. Give each agent its own scratch folder: in
  `feel-npc-dialog` two figure agents shared one and overwrote each other's font files. If the report writer
  changes numbers in `SANDBOX-SPEC.md` while the sandbox builder runs, message the builder.

After `studykit qa <id> --shots`, look at the screenshots yourself: the top of the page and two or three figures.

## 6. Quality checklist

- [ ] Every item the user named is covered, or marked as not found.
- [ ] At least 25 real game examples with reference links, where the topic allows.
- [ ] Academic, rare and newest-year sources, with dates.
- [ ] A gems table of validated open-source code and tools, with licence flags.
- [ ] Vendor-reported and unverified figures labelled.
- [ ] 15+ working figures; `studykit check` passes.

## 7. Report back

A short message to the user: the PR and the live URL once merged, the 3–5 headline conclusions, anything
found while scoping (misread terms, invented items in a supplied list), the main unverified caveats, and
one natural next study. Cite sources for factual claims.
