---
name: game-research-site
description: Research a game-design or game-tech question in depth and publish it as a study in the Kingsfoil Artifacts library (this repo, live at kingsfoil-artifacts.netlify.app). Use for /game-research-site, or when asked to research, add, update or publish a study.
---

# /game-research-site

Usage: `/game-research-site <research goal>`

This repo is the source of truth for how studies are researched, built and published. This skill only
says where to look. If anything here disagrees with the repo, the repo wins.

## Read before starting, every run

The docs change, so read them fresh:

1. `README.md`: layout, commands, CI guarantees, deploying.
2. `docs/RESEARCH.md`: scoping the request, research agents, gap check, writing, figures, checklist, report-back.
3. `docs/ADDING-A-STUDY.md`: id and series, scaffold, register, build, QA, thumbnail, index, ship.
4. `docs/FORMATS.md`: choosing or adding a series and a format. `python -m studykit formats` lists the formats.
5. `site/catalog.json` and `site/taxonomy.json`: existing series, studies and allowed tags.
6. Once the format is chosen, its doc in `docs/formats/`: pages, sandbox spec, report layout.

## Order of work

Scope, and confirm the series and format with the user (RESEARCH §1, FORMATS §1) → pick the id and scaffold (ADDING §0–1) → research, gap check, write (RESEARCH §2–4)
→ register, build, figures, QA, index, check (ADDING §3–5, RESEARCH §5–6) → ship (ADDING §6) → report back (RESEARCH §7).

Track these as tasks. Updating an existing study follows the same docs, skipping what already exists.

## Rules

- Publishing happens only through git: a branch, a PR, green CI, then a merge to `main`. Never deploy with
  a Netlify upload, CLI or MCP deploy; it bypasses the repo and the next merge would erase it.
- Ask the user before merging to `main`, unless they said to publish directly.
- If a doc turns out wrong, unclear or incomplete while you work, fix the doc in the same PR so the next run benefits.
