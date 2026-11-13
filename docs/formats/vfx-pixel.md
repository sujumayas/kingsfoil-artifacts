# Format: vfx-pixel

Tiny VFX study with a playable sandbox. Registered in `formats.yaml`; template study `vfx-light`.
Used by every study in the `vfx` series.

## Pages

- Study page `{id}-topdown-pixel.html`, built by `build.py` from `report.md`, `figs*.html` and `demos*.js`.
- Sandbox `{id}-sandbox.html`, required: a single hand-written file (`sandbox.html`), no external assets
  (the one exception is the shared top bar: keep `<script src="nav.js" defer></script>` before `</body>`),
  a native canvas `#c` scaled with `image-rendering: pixelated`. The default canvas is 320×180. A study
  whose subject is art at a larger scale may use 640×360 (32 px tiles, characters about 24×32 px), as
  `vfx-snow-32px` does; it states the size in `notes/SANDBOX-SPEC.md` and in §8, and its showcase frame
  must still read on the homepage card at half size. It plays the recommended architecture from §7 and
  is described in §8. The homepage thumbnail is grabbed from this canvas
  (`thumb: from: sandbox` in `study.yaml`).

## Report

`report.md` is the text of the study page. The recipe (`build.py`) parses it with regular expressions, so
the layout below is a contract, not a style guide. When a heading or marker changes, the recipe must change with it.

Use `studies/vfx-light/report.md` as the worked example.

### Skeleton

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
## 7. Combinations: a layered architecture for <project> (<engine>)
## 8. Reference implementation: the <Name> Sandbox
## 9. Gem findings
## 10. Learnings and anti-patterns
## 11. "See it in action" index
## 12. What remains unverified (and corrections)
## 13. Prototype roadmap for <engine>
## 14. Sources
```

The recipe finds sections by the start of the heading (`## 4.`, `## Context`), so the numbers must stay
as they are. The words after the number may change.

### Evidence tags

Every claim carries a tag and, where it has one, a source: `[V, S12]`, `[I]`, `[U]`, `[K]`.
`[V, vendor]` and `[V, self-reported]` mark figures reported by their own authors. `[S#]` numbers point to §14.
§2 is a table with one row per tag, followed by bullets naming the 5 rating criteria.

### §3 Timeline

Generations are bold lines; events are bullets that start with a bold year.

```
**Gen 1: bytes, tables and palettes (1987–2002)**
- **1993** **DOOM**: sector byte, 16 levels [V, S7]; **1996** **Quake** light styles [V, S17].
- NetHack lit rooms (1987 onward) [V, S72].
```

Accepted year forms: `**1993**`, `**Nov 2025**`, `**≤1990**`, `**2000–01**`, or `(1987 onward)` in the text.

### §4 Technique profiles

An intro listing the families, then families and profiles as `###` headings:

```
### Family A: Classic roots

### A1. DOOM sector light, COLORMAP and Build shade tables

*In plain words.* One or two sentences.

*How it works (technical).* Bullets, code, numbers.

*Cost / performance.* ...

*Games that used it.*
- DOOM: https://doomwiki.org/wiki/Light_diminishing

*How it feels.* ...

*Risks.* ...

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2
```

- Family letters A–H only; profile ids are one letter plus one digit (A1–A9).
- The seven field markers must match exactly, each at the start of a line, in this order.
- The ratings line holds exactly five digits, in the criteria order from §2.

### §5 Scorecard

One row per profile, with the same ratings as the profile and their sum:

```
| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | DOOM sector light, COLORMAP, Build shades | 5 | 5 | 5 | 4 | 2 | 21 |
```

Then a paragraph starting `**Reading the table.**`.

### §7 Architecture

The layer list becomes the clickable stack figure:

```
**Layers, bottom to top.**
1. **Server light levels (gameplay).** One or two sentences.
2. **Client tile light texture.** ...
```

Then `**Pseudocode.**` and short code blocks.

### §9 Gems

The intro paragraph ends with the licence flags, then a 6-column table:

```
Licences were read from LICENSE files on <date>. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| libtcod | https://github.com/libtcod/libtcod | BSD-3 | v2.3.0, 90 tags | 7 FOV families in C | Low |
```

The Flag cell starts with `Low`, `LGPL`, `Copyleft` or `None`. Several URLs are separated by `;`.

### §11 See it in action

```
| # | Game | <Idea> | URL |
|---|---|---|---|
| 1 | DOOM | Sector light, colormap, fire flicker | https://doomwiki.org/wiki/Light_diminishing |
```

### §14 Sources

An intro line, then groups as bold lines with numbered entries. The number is the `[S#]` id.

```
**Series**
1. DOOM PSX fire (series reference): https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
```

### Study-specific parts of the recipe

Recipes also hard-code things that belong to one study, and these must be updated when the report changes:
- counts checked with `assert`: profiles, scorecard rows, generations, index rows, sources, layers
- table headers looked up in §6
- the figure-to-profile map
- quick-filter chips for the §11 index
- the sentence where the Context section is split around a figure

Parse problems print `missing <id> <field>` or fail an `assert` during `studykit build`.
