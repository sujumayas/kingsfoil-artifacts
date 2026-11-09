# 06 — Artist-validated taste & design for light in pixel art (colour, personality, mood, readability, gameplay)

Researcher angle: what artists and designers say makes 2D/pixel light look good and play well. Notes follow CONTEXT-LIGHT rules: per question -> Takeaway / Cited findings / Inferences / Gaps. Quotes are under 15 words. "[INF]" marks my own inference.

Fetch status: Slynyrd Pixelblog 6, Pixel Grimoire #4 and #6 (Pedro Medeiros), Pixel Parmesan colour theory, Terraria wiki.gg Light source, Don't Starve wiki.gg (Night guide, Torch/DST), Darkwood fandom Flashlight, Hollow Knight wiki, TibiaVault, Minibia, W3C WCAG 2.2, Alan Zucconi (Quake lightstyles), Diablo wiki, blakecrosley.com pixel-light article, Robert Yang GDC 2018 blog, Everdream devlog, xDasher devlog, Game Developer (Thief), Megavisions (Sea of Stars).
Blocked or failed: tibia.fandom.com (client error and allowlist), tibia.com library (robots), dontstarve.fandom.com and terraria.wiki.gg/Shine_Potion (allowlist; used wiki.gg pages from search instead). Not reached (budget): saint11 glow/fire GIF tutorials, MortMort, Brandon James Greer, AdamCYounis, Lospec palettes, Valheim, Minecraft, Zelda, Pokémon Flash wiki pages.

---

## Q1. Pixel-art lighting rules (artist-validated)

**Takeaway.** Pick one consistent key light direction first (top-left or top-right). Shift hue across the ramp instead of only changing value: warm, more saturated lights; cool, less saturated shadows, or the reverse under a cool light. Shadows should be deep blues and purples, never black. Keep the terminator sharp to avoid banding. Use few value steps. Keep cast shadows short and subtle in top-down views. Use rim light and bounce light as secondary accents.

**Cited findings**
- Light direction comes first. Slynyrd (Raymond Schlitter) usually puts the main light top-right or top-left, which he finds balanced yet dynamic. Quote: "Light can come from any combination of sources, directions and intensities." Atmosphere sets shadow hardness: "clear atmosphere keeps the light hard and makes crisp dark shadows." Cast shadows are a key finishing step for depth. https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
- Slynyrd on top-down cast shadows (as summarised by blakecrosley.com): keep them "subtle", not long in one direction, and on their own layer; for walls, no longer than one tile. https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Koichi Ishii (Seiken Densetsu 3) used "deep blues and purples instead of shades of black" for shadows (quoted via blakecrosley.com, secondary). https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Pedro Medeiros (Pixel Grimoire #4) gives the vocabulary: terminator, volume shadow, projected shadow, specular, rim light (a dimmer secondary light behind the subject), bounce light (a slightly brighter spot inside the shadow). Quote: "In pixel art we favor sharp transitions to avoid banding." He lists pillow shading (darkening edges with no clear light source) as a mistake. His order of work: base colours, light/shadow, projected shadows, details, then AA and outlines. https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-4-f57f51dcfa02
- Pixel Grimoire #6 on hue shifting: shadows move toward cooler, less saturated hues and lights toward warmer, more saturated ones. Quotes: "a hot light and cold shadows" and "avoid using 100% saturation in colors." Also: "Pure gray is usually perceived as slightly cold." https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
- Pixel Parmesan says hue shifting is "actually not a distinct concept or technique": it follows from light colour times local colour. A warm light makes shadows read cooler; a cool light makes them read warmer. Saturation peaks in the midtones, so "the least saturated tone may not always be the darkest tone." Blue has the lowest luminance and yellow the highest, which is why yellow suits highlights. Real light-to-shadow spans about 5 steps on a 1–10 scale, and pixel art often compresses that. Keep accents to about 10–20% of the image. https://pixelparmesan.com/color-theory-for-pixel-artists-its-all-relative/
- In-engine rim light (xDasher devlog): a shader finds each sprite's outermost pixels and recolours them by the light they receive, giving a moving glowing edge. Drop shadows plus painted-in shading count as "an efficient way to light a 2D game." Point lights placed high above sprites, with lower falloff, avoid blown-out sprites. https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- Pokémon Emerald (via blakecrosley.com): character drop shadows are a flat ellipse, single colour, 5 px tall, in 4 sizes. A hand-made top-down wall shadow darkens the 4 pixel rows at the wall foot by one step; an eave shadow covers 3 rows under the roof. Kiradex runner shadow: colour (18,17,23) at alpha 153, 12×4 px. https://blakecrosley.com/de/blog/pixel-art-light-weather-time

**Inferences**
- [INF] For Asterion, make the shadow colour a saturated dark indigo or purple (around #1E1830–#2A2340) instead of black, and use a light ramp from cream to amber. That matches both the Ishii quote and the Kiradex (18,17,23) shadow colour.
- [INF] One global sun direction (top-left, as in Tibia's tile perspective) should drive every baked sprite highlight. Dynamic lights should only add rim or tint, so they never contradict painted shading.

**Gaps.** saint11's glow, fire and "light and shadow" GIF tutorials were not reached. I found no primary artist source for "glow without alpha", which in practice means concentric palette rings around the source, dithered at the boundaries. The demo study #2 (Acid) covers this technically.

---

## Q2. Glow, halos and night scenes

**Takeaway.** Draw night scenes as palette swaps that keep about half the day brightness and shift toward blue-violet. Let light sources and windows stay untinted (full brightness) so they pop. Pools of light should only add light: "never darkens what it lies on."

**Cited findings**
- Pokémon Crystal night palettes keep on average about 0.51 of day luma (range 0.41–0.68). The shared brightest night colour is (15,14,24) in 5-bit, about #7B73C5 (blue-violet); the brightest day colour is about #DEFFDE. The exception is the YELLOW palette, which stays at luma 0.90 at night so windows remain lit. Morning changes only 5 of 32 colours. Palettes swap in one frame with no fade. Character palettes are not tinted. https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Kiradex tint multipliers (from its source code, via blakecrosley.com): morning (1, .96, .86) ≈ #FFF5DB; day (1,1,1); evening (1, .78, .6) ≈ #FFC799; night (.5, .58, .9) ≈ #8094E6. Lamp cone tint (.7, .52, .24) ≈ #B3853D, added additively over 56 px; window spill (.5, .38, .17) over 40×28 px; lit windows drawn untinted at luma 0.90 against 0.56 for the brightest tinted night pixel. Code comment quote: "black adds nothing, and a pool of light never darkens what it lies on". Same source.
- Moonlighter developers: "There is no dynamic lighting". Night uses a sprite overlay instead (via blakecrosley.com). Same source.
- Celeste: "the lights needed to actually hit walls" (via blakecrosley.com, secondary). Same source.
- Stardew Valley: 0.7 real seconds per in-game minute; nightfall at 18:00 in winter, 19:00 in autumn, 20:00 in spring and summer; screen "gradually becomes darker over time." Same source (Stardew wiki data).

**Inferences**
- [INF] Use a two-layer night look: (a) a palette/LUT shift of the world toward about 0.5 luma with a blue-violet cast; (b) light sources and windows exempt from that shift, plus additive warm pools (#B3853D-ish). That costs almost nothing on WebGL2 and matches the Crystal and Kiradex practice.
- [INF] For torch glow halos, use 2–3 dithered rings with a checkerboard at each boundary, quantised to palette. That fits "sharp transitions to avoid banding" better than a smooth alpha gradient.

**Gaps.** No Lospec "night/torchlit" palette was checked. No primary saint11 or Slynyrd glow source was read.

---

## Q3. Personality of light sources (flicker, colour, radius, pulse)

**Takeaway.** Flicker is a brightness pattern played back at a fixed rate. Quake's 10 Hz letter strings remain the cheapest and best-tested "personality" system, still used in Half-Life: Alyx. Give each source class its own string, colour and radius. Terraria shows a full colour vocabulary in hex.

**Cited findings**
- Quake/Half-Life lightstyles: each letter is a brightness, a = 0, m = normal, z = double; the value is (letter − 'a') × 22, so z = 550. Playback is 10 steps per second, looping. https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
  - Flicker A (1): `mmnmmommommnonmmonqnmmo` — a subtle fire or torch wobble around m.
  - Flicker B (6): `nmonqnmomnmomomno`
  - Candle A (3): `mmmmmaaaaammmmmaaaaaabcdefgabcdefg`; Candle B (7): `mmmaaaabcdefgmmmmaaaammmaamm`; Candle C (8): `mmmaaammmaaammmabcdefaaaammmmabcdefmmmaaaa`
  - Fluorescent (10): `mmamammmmammamamaaamammma` — suits electric or broken lights.
  - Slow strong pulse (2): `abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba` (5.1 s cycle); Gentle pulse (5): `jklmnopqrstuvwxyzyxwvutsrqponmlkj` — suits magic crystals and runes.
  - Slow pulse without black (11): `abcdefghijklmnopqrrqponmlkjihgfedcba`; Fast strobe (4): `mamamamamama` (5 flashes/s, fails WCAG, see Q7); Slow strobe (9): `aaaaaaaazzzzzzzz`.
  - PC Gamer confirms Half-Life: Alyx reuses these: https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later
- Terraria light colours (hex, brightness), from https://terraria.wiki.gg/wiki/Light_source :
  - Torch #FFF2CC (100%); Ice #899BFF; Ultrabright #80E6FF; Cursed #9FFF50 (waterproof); Ichor #FFFF80; Desert #FF9B64; Crimson #FF805B; Corrupt #AD49FF; Bone #BA93FF; Jungle #84FF9E; Mushroom #40A6FF (76%); Hallowed #FF7AF5.
  - Fully saturated colours are deliberately dim: Blue #0014FF at 46.67%, Red #FF1A1A at 40%, Green #00FF1A at 36.67%.
  - Shine Potion #CCF2FF (cool white), 10 min.
  - Cycling torches: Demon alternates #FF4D80 and #804DFF; Rainbow cycles 6 hues; Aether alternates #BF80FF and #BF76FF (a near-imperceptible shimmer).
  - Range: about 42–47 tiles through air, about 7 through solid blocks. Rule of thumb: "halve the ranges and multiply by luminance."

**Inferences**
- [INF] Suggested personality table for Asterion (to tune by eye):

| Source | Colour (hex) | Pattern @10 Hz | Radius (tiles) | Notes |
|---|---|---|---|---|
| Torch (wall/held) | #FFC27A core, #B3853D pool | Flicker A + ±1 px radius jitter | 4–5 | warm, lively |
| Candle | #FFE3A8 | Candle B, amplitude ×0.3 | 1.5–2 | small, gentle |
| Campfire/brazier | #FF9B4A | Flicker B + slow 0.3 Hz breathe | 6–7 | biggest warm source, emits sparks |
| Lantern (glass) | #FFE9B0 | m with rare dips | 4 | steady = "safe" |
| Magic crystal | #80E6FF / #AD49FF | Gentle pulse (5), ~3.3 s | 3 | cool, rhythmic = "alien" |
| Electric/arcane | #DDF3FF | Fluorescent (10) but ≤3 dips/s | 3 | tension |
| Moon | #8094E6 global tint | none | global | |
| Fireflies | #CCFF66 | random 1–3 s blinks | 0.5 | ambient life |

- [INF] Do not use pure-hue lights at full intensity. Terraria's choice to dim pure RGB torches to 37–47% is the artist-validated version of "avoid 100% saturation."

**Gaps.** No primary Kelvin-to-hex chart for game artists was fetched. Commonly cited approximations, unverified here: candle 1900 K ≈ #FF8912, tungsten 2700 K ≈ #FFA757, moonlight about 4100 K but perceived bluish (Purkinje effect).

---

## Q4. Light for gameplay: safe vs dangerous, guidance, landmarks

**Takeaway.** Light is the cheapest wayfinding tool. Glowing means "interact", lit means "safe", dark means "unknown". Keep the lighting language consistent so players learn it.

**Cited findings**
- Robert Yang, GDC 2018 "How to Light a Level": use lights for hierarchy and contrast to mark exits and the critical path; a main entrance should be more prominent than a side route. Keep lighting language consistent across the same object types. Use rim and background lights to separate silhouettes in combat spaces. Quote: "think critically about what your light is doing." https://www.blog.radiator.debacle.us/2018/03/gdc-2018-how-to-light-level-slides-and.html
- The Everdream devlog: "We typically make something glow if we want a player to interact with it." Also: "lit areas are perceived as safe from danger"; the well-lit Cathedral has few or no enemies; a dim opening cave pushes players to seek light, which means safety and an exit. https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light
- Don't Starve: darkness is lethal. Charlie attacks after a warning ("After 5 seconds the player is attacked") for 100 HP and 20 sanity, then again 10 s later. Sanity drain is 50/min in the dark and 5/min near light [Verified on the wiki]. Fire Pit lasts up to 6 min, and its light area "shrinks as the fire weakens." https://dontstarve.wiki.gg/wiki/Guides/All_About_Night
- Pokémon Crystal keeps windows bright at night through the YELLOW palette exception, so lit windows signal life (blakecrosley.com). Stardew: window light shows only by day when it isn't raining (same source). https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Hollow Knight: Lumafly Lantern (1800 Geo, from Sly) is required for the toll gate between Forgotten Crossroads and Crystal Peak and for the No Eyes fight. Shop text: "he'll light your way through the thickest darkness." https://hollowknight.wiki/w/Lumafly_Lantern

**Inferences**
- [INF] Asterion grammar: steady warm light = town or safe (lanterns, windows); flickering warm = wilderness campfire (temporary safety); pulsing cool = magic, loot, shrines; red or green sickly = danger (monster lairs, cursed altars). Lights act as landmarks visible beyond the view radius (a lighthouse or temple brazier) so players can navigate at night.

**Gaps.** I did not reach a primary design source on Hollow Knight's darkness rendering or lumafly street lamps.

---

## Q5. Carried light (torch, lantern, light spells): radius, fuel, reveal vs stealth

**Takeaway.** Carried light is a resource and a trade-off. A bigger radius means more vision but also detection (Diablo I, Thief), and it costs fuel or time (DST 75 s torch, Darkwood 120 s flashlight, Tibia 10 min spells, Terraria Shine 10 min). Cones give focus and tension (Darkwood); circles give safety (DST, Tibia).

**Cited findings**
- Tibia light spells, two sources that disagree on levels (different game eras):
  - Minibia (7.6 era): Light `utevo lux` level 1, 20 mana; Great Light `utevo gran lux` level 3, 60 mana; Ultimate Light `utevo vis lux` level 12, 140 mana, Sorcerer and Druid only. https://minibia.com/blog/complete-spell-list-tibia-76
  - TibiaVault (modern): Light level 8, 20 mana, 10 min, "Small"; Great Light level 13, 60 mana, 10 min, "Medium"; Ultimate Light level 26, 140 mana, "Strongest light spell, large radius." https://tibiavault.com/spells/
  - Ultimate Light duration and exact light-level numbers are unverified (TibiaWiki blocked).
- Don't Starve Together torch: 2 Cut Grass + 2 Twigs; 75 s equipped burn time; skill Torch Longevity I–III gives 90/110/150 s; Torch Range I–III raises radius to 1.5/2/2.5 tiles; rain burns it up to 150% faster, unless under trees. https://dontstarve.wiki.gg/wiki/Torch/DST
- Don't Starve Miner Hat: about 4–5 nights of night-only use; refuel costs 1 Gold + 1 Firefly; "Large" light. Torch in DS single-player has a "Small" light area. https://dontstarve.wiki.gg/wiki/Guides/All_About_Night
- Darkwood Flashlight: "a tight cone" for scouting; 120 s on 9V batteries; usable when Shadows are present, unlike the Torch and Lantern; no weapon while held. https://darkwood.fandom.com/wiki/Flashlight
- Diablo I/II light radius: items raise or lower it; a larger radius shows more of the screen and also sets how close monsters get before they react. In Diablo I, low-light gear let players sneak up. Diablo III dropped light radius for coloured mood lighting. https://di.diablowiki.net/Light_radius
- Thief light gem: an on-screen gem plus an audio cue shows visibility. Paul Neurath: "The light gem gets brighter or dimmer depending on how visibly hidden you are." https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
- Terraria Shine Potion: #CCF2FF personal light, 10 min, waterproof. https://terraria.wiki.gg/wiki/Light_source

**Inferences**
- [INF] For a Tibia-like MMORPG, keep Tibia's spell tiers (radius small, medium, large; about 10 min) as a mana sink. Add a light-is-visible-to-monsters trade-off only in specific zones (crypts), so it doesn't punish normal play.
- [INF] Held-light animation: offset the light centre by the hand position per walk frame (±1 px vertical bob in sync with the step), apply the Flicker A pattern, and render a 1-frame-delayed radius to feel organic. The carrier should cast a short shadow away from the light, which is cheap as a stretched drop-shadow ellipse rotated away from the source.

**Gaps.** Valheim torch durability, Minecraft light levels (0–15; torch 14, by memory, unverified) and dynamic-light mods, Zelda Lamp, and Pokémon Flash radius were not fetched. Blakecrosley notes only that Flash in Crystal swaps the dark palette set for the night set.

---

## Q6. Object interaction from a design view (nature, decorations, buildings)

**Cited findings**
- Kiradex: window spill is a 40×28 px warm additive cone, lamp pools 56 px, and lit windows stay untinted. Gap noted there: buildings do not yet cast ground shadows. https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Pokémon Crystal: roofs have their own day/night palette table, with night luma about 0.56 of day. Same source.
- xDasher: spotlights through "cookie" textures project window frames onto the floor. https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- Celeste: lights must hit walls, so occlusion matters for credibility. https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Sea of Stars: dynamic lighting with coloured highlights on characters and scenery; day and night can be switched at will; animated lights. https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/

**Inferences**
- [INF] Cheap decoration set: braziers on temple steps, lanterns on fence posts every 4–6 tiles (a rhythm reads as a road at night), string lights as 1-px dots with staggered Candle-pattern phases, fireflies near water and grass, glowing mushrooms with Gentle pulse at desynchronised phases.
- [INF] Moon reflection on water: a vertical streak of 1–2 px highlights jittered per row.

**Gaps.** No primary artist source on moon reflections or firefly design was found.

---

## Q7. Accessibility and readability

**Cited findings**
- WCAG 2.2 SC 2.3.1: no more than three flashes in any one-second period, unless below thresholds. A general flash is an opposing luminance change of 10% or more of max where the darker state is below 0.80. Area limit: a combined 0.006 sr within a 10° field, roughly a 341×256 px rectangle at 1024×768. Red flash: R/(R+G+B) ≥ 0.8 with a chromaticity difference above 0.2. https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Thief: when visibility drives gameplay, show it explicitly. Neurath: "Showing that in a very clear way is important." https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
- Pokémon Crystal keeps night at about 0.41–0.68 of day luma, never pitch black, and leaves characters untinted so they stay readable. https://blakecrosley.com/de/blog/pixel-art-light-weather-time

**Inferences**
- [INF] Checks for flicker:
  - Large lights (lightning, area flashes): amplitude ≤10% luminance, or ≤3 dips per second.
  - Quake "Fast strobe" (5 Hz, a↔m): only for very small sources, well under 341×256 px at that resolution.
  - Lightning: at most 3 flashes per second (study #3).
- [INF] Minimum ambient: never below about 0.4 of day luma for walkable terrain; keep the player, enemies and loot on an untinted or rim-lit layer.
- [INF] Colour-blind safety: don't rely on red vs green alone for danger vs safe. Pair hue with pattern (pulse vs steady) and shape.
- [INF] Add an option to reduce flicker amplitude or turn it off.

---

## Q8. Anti-patterns (what artists warn against)

- Pure black shadows. Use deep blues and purples instead (Ishii, via blakecrosley). https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- 100% saturated colours and all-saturated scenes. https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
- Pillow shading, soft faces and flat light, i.e. no clear light source. https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-4-f57f51dcfa02
- Smooth gradients that band, where sharp transitions are preferred. Same source.
- Value-only ramps that turn "dull and muddy". https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
- Blown-out sprites from lights placed too close or too intense. https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- Lights that ignore walls (Celeste) and pools that darken what they lie on (Kiradex). https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Inconsistent lighting language, and lighting as an afterthought (Robert Yang). https://www.blog.radiator.debacle.us/2018/03/gdc-2018-how-to-light-level-slides-and.html
- Long cast shadows in top-down views. Keep wall shadows at or under 1 tile (Slynyrd via blakecrosley).
- [INF] All lights the same colour (Terraria's 20+ torch hues show the opposite), noisy uniform-random flicker instead of authored patterns, and full-screen day/night multiply tints that crush the palette. Use palette swaps or LUTs instead (Crystal).

---

## Game examples ("see it in action")

| # | Game | Light idea | URL |
|---|---|---|---|
| 1 | Terraria | 20+ hex-coloured torches, tile-range light, Shine potion | https://terraria.wiki.gg/wiki/Light_source |
| 2 | Don't Starve (Together) | lethal darkness (Charlie), fuel-limited torch 75 s, shrinking fire radius | https://dontstarve.wiki.gg/wiki/Guides/All_About_Night , https://dontstarve.wiki.gg/wiki/Torch/DST |
| 3 | Darkwood | tight-cone flashlight, 120 s battery | https://darkwood.fandom.com/wiki/Flashlight |
| 4 | Hollow Knight | Lumafly Lantern gates dark zones | https://hollowknight.wiki/w/Lumafly_Lantern |
| 5 | Thief: The Dark Project | light gem, light equals detection | https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system |
| 6 | Diablo I/II | light radius affix = vision and aggro range | https://di.diablowiki.net/Light_radius |
| 7 | Tibia | Light/Great Light/Ultimate Light spell tiers | https://tibiavault.com/spells/ |
| 8 | Pokémon Crystal | night palette swap at about 0.5 luma, lit windows exempt, Flash | https://blakecrosley.com/de/blog/pixel-art-light-weather-time |
| 9 | Pokémon Emerald | ellipse drop shadows, rain darkening to 13/16 | same |
| 10 | Stardew Valley | gradual darkening, seasonal nightfall times | same |
| 11 | Celeste | lights must hit walls | same |
| 12 | Moonlighter | no dynamic lights, sprite overlay at night | same |
| 13 | Seiken Densetsu 3 | blue and purple shadows, no black | same |
| 14 | Quake | 10 Hz lightstyle flicker strings | https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/ |
| 15 | Half-Life: Alyx | same Quake strings 25 years later | https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later |
| 16 | Sea of Stars | dynamic coloured light on 16-bit-style pixels, switchable day/night | https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/ |
| 17 | The Everdream | glow = interact, lit = safe | https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light |
| 18 | xDasher | rim-light shader, cookie window light, drop shadows | https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game |
| 19 | Idle Monster Frontier | rim light shifting perceived colour | https://pixelparmesan.com/color-theory-for-pixel-artists-its-all-relative/ |
| 20 | Eastward | warm pixel lighting, link only, not read | https://80.lv/articles/eastward-charming-chinese-pixel-art-adventure |

## Quote bank (<15 words)
- "Light can come from any combination of sources, directions and intensities." — Raymond Schlitter (Slynyrd)
- "clear atmosphere keeps the light hard and makes crisp dark shadows." — Slynyrd
- "In pixel art we favor sharp transitions to avoid banding." — Pedro Medeiros
- "a hot light and cold shadows" — Pixel Grimoire #6
- "avoid using 100% saturation in colors" — Pixel Grimoire #6
- "this is actually not a distinct concept or technique" (hue shifting) — Pixel Parmesan
- "deep blues and purples instead of shades of black" — Koichi Ishii (secondary)
- "black adds nothing, and a pool of light never darkens what it lies on" — Kiradex source comment (secondary)
- "the lights needed to actually hit walls." — Celeste dev (secondary)
- "We typically make something glow if we want a player to interact with it." — The Everdream
- "think critically about what your light is doing." — Robert Yang
- "The light gem gets brighter or dimmer depending on how visibly hidden you are." — Paul Neurath

## Overall gaps
- No primary saint11, MortMort, Brandon James Greer or AdamCYounis material. Lospec palettes not surveyed.
- Tibia exact light levels and Ultimate Light duration unverified. Tibia spell levels differ by era (1/3/12 vs 8/13/26).
- Valheim, Minecraft, Zelda Lamp and Pokémon Flash numbers not fetched.
- Several quotes (Ishii, Celeste, Moonlighter, Kiradex) come through one secondary aggregator (blakecrosley.com). Treat them as secondary.

## Sources
- https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
- https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-4-f57f51dcfa02
- https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
- https://pixelparmesan.com/color-theory-for-pixel-artists-its-all-relative/
- https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
- https://terraria.wiki.gg/wiki/Light_source
- https://dontstarve.wiki.gg/wiki/Guides/All_About_Night
- https://dontstarve.wiki.gg/wiki/Torch/DST
- https://darkwood.fandom.com/wiki/Flashlight
- https://hollowknight.wiki/w/Lumafly_Lantern
- https://minibia.com/blog/complete-spell-list-tibia-76
- https://tibiavault.com/spells/
- https://di.diablowiki.net/Light_radius
- https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
- https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
- https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later
- https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- https://www.blog.radiator.debacle.us/2018/03/gdc-2018-how-to-light-level-slides-and.html
- https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light
- https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
- https://80.lv/articles/eastward-charming-chinese-pixel-art-adventure (not read)
