# 06 — Design, gameplay and artist-validated taste for rain (top-down pixel)

Researcher angle: how a top-down pixel game is *affected* by rain: art rules, gameplay numbers, NPC behaviour, mood, accessibility, anti-patterns.
Date: 2026-11-08. Each claim has a URL. **[INF]** marks my inferences. **[MEM]** marks facts from general knowledge that I could not verify with a fetch in this session (verify before publishing).

---

## Q1. Pixel-art rules for rain, splashes, ripples, puddles, wet surfaces

### Takeaway
The pixel-art consensus I could verify: a **4-frame loop**, **1-px streaks at one shared slope (e.g. 2:1)**, about **10–15 streaks per frame** in a small scene, each moving **4–6 px per frame**, and wrapped at a *different X* when they leave the screen. A ground splash is a **4-frame sequence: 2-px line → 4×1 hollow ring → 2 outward dots → nothing**. Puddle ripples are a **±1-px horizontal row shift on alternate frames**. Puddle reflections are **darker and more muted** copies of the light sources above them. Water-loop pros (Slynyrd) add: loop the splash **in sync** with the flow, keep ripple speed and amplitude **low**, put bright reflections **where the sky highlights are**, and make reflections slightly **shorter** than their source.

### Cited findings
- BudgetPixel (@pikpoo, Aug 2026), "Rain and Reflections in 4 Frames": https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
  - 4-frame loop. Quote: "A 4-frame loop is the gold standard for retro game art".
  - Streaks are 1 px wide, light gray or semi-transparent light blue, at **one consistent angle (2:1 pixel slope)**, with **10–15 streaks** on frame 1.
  - Each frame moves a streak **4–6 px down** and shifts it sideways along the wind. A streak that leaves the bottom wraps to the top **at a slightly different X**, so the loop doesn't visibly repeat.
  - Splash: F1 a 2-px horizontal line at the tip; F2 a **4-px-wide, 1-px-high hollow ring**; F3 two isolated dots moving outward; F4 empty.
  - Puddles: paint darker, muted versions of the lights overhead (lamps, neon). On frames 2 and 4, shift the puddle's pixel rows **1 px left/right**; frames 1 and 3 return them to rest.
  - Quote: "Raindrops move too fast for the human eye to track" (so draw streaks, not dots).
- Slynyrd (Raymond Schlitter), Pixelblog 10 "Water in Motion": https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
  - It has no rain rules, but its water rules transfer:
    - "The splash is the fun part." The splash must "loop in sync with the flow."
    - "One of the most important settings is where you place the ripple source." Keep wave speed, width and height low for subtle motion.
    - Example loops: a sparkle "6 frame loop", a reflection on a "2 second timeline".
    - Reflections: flip the image and add highlights. The reflection is often slightly shorter than the source. Light reflective areas line up with the cloud highlights.
- Disco Elysium devblog "Weather duty" (Siim Raidma, 2016), technique-level art direction: https://discoelysium.com/devblog/2016/02/10/weather-duty
  - "I misuse a shadow map to mask whatever comes down from sky." Anything in the "shadow" of a top-down projection stays dry, and rotating the caster gives wind slant.
  - Wet areas are added to the specular map. Wetting is **spot by spot, not uniform**. **Edge detection** places splashes under eaves and along object edges. The sun's shadow map makes surfaces **dry at different rates**.
  - Weather rule thresholds: rain if precipitation > 0 and temp > 0; **lightning if precipitation > 1.5 and temp > 2**; snow if precipitation > 0 and temp < 0; cloudiness from clear to gloomy over precipitation −1…1.
- 80.lv "How rain works in video games" (Gloria Levine): https://80.lv/articles/how-rain-works-in-video-games
  - Particles alone rarely sell rain; splashes on the ground are needed (cites Capcom's *Ghouls 'n Ghosts*).
  - Puddles need enough gloss to read as water, but: "Just don't overdo it."
  - Darken the lighting when it rains. Wetness should change gradually, because puddles, clothes and hair take time to dry.
  - Engine programmer Amandine Coget: splashes need "code to calculate where the ground is".
- PC Gamer "How developers make perfect rain": https://www.pcgamer.com/how-developers-make-perfect-rain-in-games
  - David Stark (*Airships: Conquer the Skies*): "Each raindrop is a randomly placed vertical gray line."
  - 2D recycling: spawn drops above the screen and reuse them when they exit the bottom, with random size, speed and alpha.
  - Aaron Miller (Fireblade, *Abandon Ship*): "We spawned an insanely high amount of rain particles", then baked the extra density into a texture. Hundreds of particles read as thousands, "without it impacting the framerate". The rain angle shifts with wind strength.

### Inferences [INF]
- **Rule set for low-res top-down**, combining the sources:
  - **Layers:** use 2–3 depth layers with longer, brighter, faster streaks near the camera, and shorter, dimmer, slower ones far away (the same parallax idea as Abandon Ship's distant sheets + near particles).
  - **Angle:** use one slope per layer, all driven by the same wind value.
  - **Splash timing:** 3 visible frames + 1 blank frame, at about 8–12 fps of animation.
  - **Ripples:** use 2–3 frames of expanding 1-px rings. Ripple *density*, not size, should scale with intensity.
- **Wet = darker + highlight:** shift the albedo 1 palette step darker and add sparse 1-px specular highlights facing the light/sky. The specular-map approach in Disco Elysium is the painterly equivalent. In a palette-indexed renderer this is a "wet" LUT row, the same trick as the "melt"/"stage colour" rows in the snow and acid studies.
- **Top-down puddle reflection:** you can't reflect the sky geometry in true top-down. Reflect **light sources and sky tone** (lamps, a lighter strip toward the light side, as pikpoo describes) and wobble the rows by 1 px.
- **Overcast shift:** darken by about 1 value step, desaturate, and push the hue cool. This is consistent with the 80.lv advice to darken the lighting and with Animal Crossing's "heavy rain darkens the sky more" (Q4).

### Gaps
- **Not verified this session:** saint11 (Pedro Medeiros) rain/splash tutorial content. Searches only hit aggregators (80.lv collection https://80.lv/articles/an-ultimate-collection-of-pixel-art-guides, OpenGameArt list https://opengameart.org/forumtopic/pixel-art-tutorials-by-sadfacerl). The Medium/Patreon pages weren't reached.
- **Not found:** MortMort, Brandon James Greer, AdamCYounis, Pixel Parmesan or Lospec rain-palette specifics.
- **Unfetchable:** a streamer's "Pixel Art Rain in 5 mins" mirror (https://old.fbpe.org/pixel-art-tutorial-how-to-animate-water.html) had no extractable content, and the penusbmic tutorial page (https://penusbmic.itch.io/pixel-art-tutorial-sci-fi-landscape-with-animated-rain) failed to load.
- **Lightning flash frames:** no artist source found. See Q5 for the accessibility limits.

---

## Q2. Gameplay effects of rain (with numbers)

### Takeaway
Rain is a strong systemic **multiplier and verb-changer**, and the best designs give it **2–4 crisp effects**:
- **elemental:** water ↑, fire ↓, electricity ↑ on wet targets
- **fire extinguishing**
- **a wetness accumulator** with a dry-off path (shelter, fire)
- **one economy benefit:** crops watered, rare fish or bugs, faster fishing
- **one tactical penalty:** vision −1, movement cost +1, slippery climbing
- **one stealth effect:** footsteps masked, but squelching boots

Don't Starve's **moisture accumulator** and Valheim's **resettable Wet timer** are directly reusable designs.

### Cited findings (game → numbers → "see it in action")

1. **Don't Starve / DST: Rain**. https://dontstarve.fandom.com/wiki/Rain
   - Wetness gain is up to **1/s**, scaling with precipitation.
   - Precipitation follows a **sine-like curve**: light at the start and end, heaviest in the middle. This is a built-in crescendo.
   - Fire fuel burns faster in rain: Fire Pit **+200%**, Campfire **+250%**, Torch **+150%**, Willow's Lighter **+100%**.
   - Birds spawn **4×** as often. Crops grow **+300%** (single player). Picked mushrooms regrow.
   - Sanity drops by up to **−5/min** (single player). An Umbrella prevents it.
   - DST **moisture model:** a world moisture value rises toward a ceiling. Spring: max gain **3.75/s**, ceiling **2640–5280**, peak precipitation **5–10**, floor multiplier **0.0625**. Rain then consumes **1…peak** moisture per second and stops at **floor × ceiling × (1–3)**.
   - Known bug to avoid: endless drizzle that keeps wetness at 1.
2. **DST: Wetness** (https://dontstarve.wiki.gg/wiki/Wetness/DST). Max **100**.
   - At **≥35**, held tools turn slippery and may drop, worn items drain **−6 sanity/min each**, and the body chills (at half wetness the temperature feels **15° lower**).
   - Wet mobs take **2.5×** instead of 1.5× from electric weapons. Soggy food spoils **30%** faster. Wet fuel burns **75%** as long.
   - Many hats give **20%** waterproofing, and 100% total prevents wetness.
3. **Valheim: Wet** (https://valheim.fandom.com/wiki/Wet).
   - Lasts **120 s** and resets on re-exposure. It doesn't tick down while you're in rain or waist-deep water.
   - Cleared by a roof. Burning removes **60 s per second**, and standing near fire removes **10 s per second** (not while in rain).
   - Debuffs health, stamina and eitr regen (the page gives no % for these). Blocks resting and beds, and increases Frost damage taken.
4. **Divinity: Original Sin 2: Wet status** (https://dos2.wiki/wiki/Wet_(Status)).
   - Water resistance **−10%**, Air resistance **−20%**, Fire resistance **+10%**.
   - Applied regardless of armour or immunities. Burning turns Wet into "Warm".
   - The **Rain skill** (https://dos2.wiki/wiki/Rain) has cooldown **6 turns**, range **8 m**, radius **10 m**, and applies Wet for 1 turn. It creates a puddle that expands over time and "douses fires", and enemies can **electrify the water**. The area *Stonegarden* "rains most of the time".
5. **Minecraft: Rain** (https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Rain; canonical https://minecraft.wiki/w/Rain).
   - Sunlight drops by **3**, to level 12.
   - Puts out fires and flaming arrows, but not campfires.
   - Daylight-burning undead (zombies, skeletons, phantoms) are protected while it rains. **Endermen take 1 HP every 0.5 s** and teleport to a dry spot.
   - Fishing waits are shorter. Farmland hydrates, cauldrons fill, and Riptide tridents work on land.
   - Sound: rain volume **0.2**, **0.1** for "rain.above" (when you're under cover).
   - Rain lasts **0.5–1 day**, with **0.5–7.5 days** between rains. No rain in deserts or savannas.
6. **Stardew Valley: Rain/Storm** (https://stardewvalleywiki.com/Rain, https://stardewvalleywiki.com/Weather).
   - Weather changes which fish can be caught and how villagers talk and behave. A storm always includes rain.
   - Lightning can strike **every 10 in-game minutes**. It destroys crops and trees and can turn fruit trees into coal trees. Lightning rods have a "good chance" to intercept strikes. Chests are never hit.
   - **Summer 13 and 26 are always stormy.** Ginger Island rains **24%** of days.
   - Green Rain: saplings have a **50%** chance to jump to stage 4, and most villagers stay indoors.
   - [MEM] Rain waters crops automatically; frogs appear in rain (Stardew 1.6). The fetched pages didn't state either.
7. **Animal Crossing: Rain** (https://nookipedia.com/wiki/Rain).
   - The **Coelacanth** appears only in rain, and the **Snail** only in rain. Rain suppresses butterflies and many beetles.
   - Villagers carry **umbrellas**. **Frog villagers don't**, because they're amphibious. In New Horizons villagers wear rain clothes instead.
   - Rain waters wilted flowers.
   - A **rainbow** appears when the sky clears suddenly after hours of heavy rain. It peaks at about **30 min** and is gone within the hour, and the chance of finding Bells in trees rises.
   - New Horizons (Feb 25–Mar 31): rain **24%** + heavy rain **12%**.
   - Rain music variants. In City Folk you can hear **rain on the roof indoors**.
8. **Zelda: Breath of the Wild / Tears of the Kingdom** (https://zelda.fandom.com/wiki/Weather).
   - Link **slips while climbing in rain**, which costs stamina. Rain puts out exposed fires.
   - In thunderstorms, lightning is **attracted to metal equipment**.
   - Weather changes every **4 in-game hours**.
   - [MEM] Static sparks warn before a strike.
9. **RimWorld** (https://www.rimworldwiki.com/wiki/Rain → Environment page).
   - Rain puts out **unroofed** fires (not guaranteed), and large fires raise the chance of rain. Rain can short-circuit electronics.
   - Each weather type has accuracy, movement and wind modifiers. Exact values weren't extracted (gap).
10. **Advance Wars** (https://advancewars.fandom.com/wiki/Rain).
    - With Fog of War, rain gives **vision −1** for all units. In *Days of Ruin*, unit vision drops to **1** and building vision to **0**.
    - In AW1 and AW2, land vehicles pay **+1 movement cost** on plains and woods.
    - In Dual Strike and Days of Ruin, **rain turns Fog of War on** automatically.
11. **Fire Emblem: The Blazing Blade** (https://www.fireemblemwiki.org/wiki/Rain).
    - On outdoor plains, foot units pay **2** movement and mounted units pay **3**. **Indoor, forest and mountain tiles are unaffected.**
    - Rain can stop and start mid-battle, and characters announce it.
    - In Binding Blade and Awakening, rain is cosmetic only.
12. **Cataclysm: DDA** (forum, 2015: https://discourse.cataclysmdda.org/t/wetness-mechanics/9038).
    - Wetness is tracked **per body part**. Drizzle gives up to **30 − protection** saturation, heavy rain up to **60 − protection**, and protection ≥ 60 means immunity.
    - The morale penalty is up to **saturation/2**.
    - Rainproof items block rain **99%** of the time (rolled each turn).
    - An umbrella keeps the head, torso and arms dry, so only the legs get wet.
    - Water-friendly clothing turns the morale penalty into a bonus.
13. **Pokémon: Rain** [MEM] (Bulbapedia fetch failed; verify at https://bulbapedia.bulbagarden.net/wiki/Rain, mirror https://m.bulbapedia.bulbagarden.net/wiki/Rain).
    - Water moves **×1.5**, Fire moves **×0.5**. **Thunder and Hurricane hit 100%** of the time. Solar Beam power is halved.
    - Swift Swim doubles Speed. Rain lasts **5 turns** (**8** with Damp Rock).
14. **Hunt: Showdown, "Behind the Storm"** (https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown).
    - "rain masks footsteps" and "naturally muffles players' ability to pinpoint sounds". Balanced by squelching boots that improve enemy detection.
    - Fog rolls in as the storm intensifies.
    - Rain audio is raycast from the sky, so per-material drip emitters spawn where the rays hit.
    - Interiors get *richer* ambience, so sheltering isn't an unfair audio advantage.
    - Rule: ambience must never "obscure critical audio cues".
15. **Abandon Ship** (PC Gamer link above). Rain had to look thick enough to *visibly* put out fires, so the gameplay effect has to be readable.
16. **Stereophyta** (PC Gamer). Clouds pick one of 4 directions and a tempo, and raindrops hitting plants trigger music. Quote: "I wanted this version to be rhythmic" (Kas Ghobadi).
17. **NEO Scavenger** (PC Gamer). Precipitation, cloud cover and seasonal temperature come from NOAA data.

### Inferences [INF]
- **For Asterion (Tibia-like MMO), a tight effect table:**
  - **Wet**: a 0–100 accumulator in DST style. +Electric damage taken (DST ×2.5 vs ×1.5 for electric weapons), −Fire damage taken (DOS2 +10% fire resistance), cleared by a roof or by fire (Valheim 60 s/s burning, 10 s/s near fire).
  - **Fires**: open fires die. Torches burn fuel faster (DST +150%).
  - **Vision**: −1 tile light radius at night (Advance Wars).
  - **Movement**: +1 cost on mud and dirt only, not on roads or indoors (Fire Emblem's indoor exemption is a great readability rule).
  - **Stealth**: footstep hearing radius ×0.5, but mud leaves visible prints (Hunt's balance).
  - **Economy**: crops and flowers auto-watered, rain-only fish and creatures (Coelacanth/Snail pattern).
  - **Storms**: lightning prefers metal and high tiles, with a telegraph tile 1–2 s before (BotW-style warning).
- Use the DST **sine-shaped precipitation curve** as the default intensity envelope. It gives anticipation, crescendo and taper for free.

### Gaps
- Not covered this session: Into the Breach, XCOM, Hades, Hyper Light Drifter, Tibia, Ultima Online.
- Not verified: Thief, MGS and Dishonored rain-masking specifics. Hunt is the solid cited example.
- Missing numbers: RimWorld per-weather accuracy and movement values, Stardew rain chance per season.

---

## Q3. NPC / creature behaviour in rain & environmental storytelling

### Takeaway
Cheap, high-value rules:
- NPCs **go indoors or open umbrellas**.
- **Amphibians ignore rain** (AC frog villagers), a nice characterization joke.
- **Rain-only creatures appear**: snails, frogs, coelacanth.
- **Fair-weather creatures hide**: butterflies, beetles.
- **Birds change**: DST birds spawn 4×.
- **Some monsters become stronger or weaker**: Minecraft undead no longer burn, endermen flee to dry spots.

### Cited findings
- **Animal Crossing:** umbrellas; frogs without umbrellas; snail and coelacanth only in rain; butterflies and beetles suppressed; cicadas still catchable but make no noise. https://nookipedia.com/wiki/Rain
- **Stardew Green Rain:** most villagers stay indoors all day except Demetrius, Leah and Linus. Weather changes villager behaviour and dialogue. https://stardewvalleywiki.com/Rain
- **Minecraft:** endermen take damage and teleport until dry; undead are protected from sunlight. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Rain
- **DST:** birds spawn 4×. https://dontstarve.fandom.com/wiki/Rain
- **Fire Emblem (Blazing Blade):** Lyn or Hannah comment on when rain will start or stop, so dialogue telegraphs the weather. https://www.fireemblemwiki.org/wiki/Rain

### Inferences [INF]
- NPC schedule hook: `if rain>0.3 and npc.outdoor: goto nearest shelter or equip umbrella sprite`, with exceptions for fishermen, guards (they wear hoods) and frogfolk.
- Leave props as storytelling: an abandoned chair under an awning, a cat on a porch, laundry taken in.
- The snail/frog spawn table is the cheapest "the world is alive" signal.

### Gaps
- No source on animals seeking shelter as an AI pattern beyond these wikis.

---

## Q4. Feel / mood: anticipation, crescendo, aftermath, audio, readability, accessibility

### Takeaway
- **Envelope:** dark clouds → light start → peak → taper (DST sine curve).
- **Aftermath:** a sudden clear after a long heavy rain can trigger a **rainbow** (~30 min peak in AC). Surfaces dry **non-uniformly**, with sunny spots first (Disco Elysium).
- **Audio:** layered by intensity. Under-roof sound is different and quieter (Minecraft "rain.above" 0.1 vs 0.2), and you can hear rain on the roof indoors (City Folk).
- **Readability:** rain must never hide critical cues (Hunt).
- **Lightning flashes** must respect WCAG 2.3.1: **≤3 flashes per second**, or keep the flash area under the threshold.

### Cited findings
- **AC:** dark, thick clouds signal rain; heavy rain darkens the sky more; rainbow rules as in Q2; rain music variants; rain heard on the roof indoors. https://nookipedia.com/wiki/Rain
- **DST:** precipitation is light at the start and end and heaviest in the middle. https://dontstarve.fandom.com/wiki/Rain
- **Disco Elysium:** drying rates follow the sun's shadow map; wetting is spot by spot. https://discoelysium.com/devblog/2016/02/10/weather-duty
- **Hunt:** the soundscape scales from light shower to full rainstorm; distant thunder layer; fog grows with the storm (a **rain–fog interaction**); interiors get richer ambience. https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown
- **Minecraft:** rain sound volumes are 0.2 outdoors and 0.1 for "rain.above" when sheltered, with attenuation 16. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Rain
- **WCAG 2.3.1:**
  - Nothing should flash "more than three times in any one second period", unless it's below the general and red flash thresholds.
  - A general flash is a pair of opposing luminance changes of **≥10%** of max relative luminance, where the darker state is **< 0.80**.
  - Area limit: **0.006 sr** in any 10° visual field (about 25%), roughly **341 × 256 px at 1024 × 768**.
  - Saturated-red transitions are a separate red-flash rule.
  - https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html

### Inferences [INF]
- **Lightning recipe:**
  - The flash is **1 bright frame + 2–3 decay frames** (a palette shift, not white-out).
  - Separate strikes by at least **1 s**, with no more than **2 flashes inside any 1 s** (margin under WCAG).
  - Cap the luminance jump or the flashed area. A full-screen white flash on a phone covers far more than 25% of the 10° field.
  - Offer a "reduce flashes" toggle that replaces the flash with a sky tint.
  - Thunder delay ≈ distance / 343 m/s, about 3 s per km (physics; no URL fetched).
- **Anticipation:** wind rises → sky palette shifts → first sparse drops plus a few dark wet spots on stone → full rain.
- **Aftermath:** drips from eaves and trees for 30–90 s, puddles shrinking, steam or ground mist on sunlit warm tiles. This is the rain↔mist interaction, consistent with Hunt's fog-with-storm idea.
- **Opacity cap:** keep rain streaks in the low-contrast part of the palette. Never draw them over UI or over character outlines at full alpha.

### Gaps
- No artist source for a specific streak opacity cap.
- No sourced data on lightning-to-thunder delay in games.

---

## Q5. Anti-patterns

### Cited
- **No ground response.** Particles without splashes or ground interaction (80.lv: https://80.lv/articles/how-rain-works-in-video-games).
- **Overdone gloss on puddles.** "Just don't overdo it." (same source)
- **Rendering drops the player can't see** (same source).
- **Rain over interiors.** Fire Emblem exempts indoor tiles (https://www.fireemblemwiki.org/wiki/Rain). Disco Elysium masks rain by an overhead "shadow" (devblog). Minecraft switches to the quieter "rain.above" sound under cover.
- **Endless drizzle that never resolves.** A DST bug kept wetness at 1 and stopped meat from drying (https://dontstarve.fandom.com/wiki/Rain).
- **Weather that hides critical cues** (Hunt).
- **Flash epilepsy risk** (WCAG 2.3.1).
- **Uniform wetting and drying** (Disco Elysium uses spot-by-spot wetting and shadow-dependent drying).

### Inferences [INF]
- Uniform screen-space rain with no slant and no wind.
- Constant maximum intensity.
- Puddles that never dry.
- Wet/dry state flipping with no transition. 80.lv notes gradual drying.

---

## Q6. Wind design

### Takeaway / cited
- The rain angle should shift with wind strength (Abandon Ship, PC Gamer).
- Disco Elysium rotates the rain-mask caster to simulate wind direction.
- RimWorld wind ranges from **0–150%**.
- Stereophyta clouds move in 4 directions.
- pikpoo: sideways shift along the wind angle per frame.

### Inferences [INF]
- **Gust model:** base wind plus a gust impulse every 4–12 s with ~1 s attack and 2–3 s release. Drive streak slope, grass and tree sway offset, and cloth frames from the **same** wind value, so they move in sync.
- **Rain curtains:** bands of higher density drifting with the wind across the map, readable from top-down as moving darker stripes.
- **Rain shadow:** the lee side of walls gets fewer drops, reusing the wind-lee rays from snow study #1.

### Gaps
- No cited gust timing numbers from shipped games.

---

## Game examples with "see it in action" URLs (≥15)

| # | Game | What rain does | URL |
|---|---|---|---|
| 1 | Don't Starve / DST | Moisture accumulator, wetness 0–100, fire fuel, sanity | https://dontstarve.fandom.com/wiki/Rain · https://dontstarve.wiki.gg/wiki/Wetness/DST |
| 2 | Stardew Valley | Fish table, villagers, lightning every 10 min, Green Rain | https://stardewvalleywiki.com/Rain |
| 3 | Animal Crossing | Rain-only fish and bugs, umbrellas, frog villagers, rainbow | https://nookipedia.com/wiki/Rain |
| 4 | Divinity: OS2 | Wet status, Rain spell puddle, electrify water | https://dos2.wiki/wiki/Rain |
| 5 | Zelda BotW/TotK | Slippery climbing, fires out, lightning on metal | https://zelda.fandom.com/wiki/Weather |
| 6 | Minecraft | Fire out, undead protected, endermen, fishing, sounds | https://minecraft.wiki/w/Rain |
| 7 | Valheim | Wet 120 s debuff, fire dries | https://valheim.fandom.com/wiki/Wet |
| 8 | RimWorld | Puts out unroofed fires, short circuits, wind | https://www.rimworldwiki.com/wiki/Rain |
| 9 | Cataclysm: DDA | Per-body-part wetness, morale | https://discourse.cataclysmdda.org/t/wetness-mechanics/9038 |
| 10 | Advance Wars | Vision −1, +1 movement cost, forces Fog of War | https://advancewars.fandom.com/wiki/Rain |
| 11 | Fire Emblem: Blazing Blade | Movement 2/3 on plains, indoor exempt | https://www.fireemblemwiki.org/wiki/Rain |
| 12 | Pokémon | Water ×1.5 / Fire ×0.5, Thunder 100% [MEM] | https://m.bulbapedia.bulbagarden.net/wiki/Rain |
| 13 | Hunt: Showdown | Footstep masking vs squelch, raycast drips, fog | https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown |
| 14 | Disco Elysium | Shadow-map rain mask, wet specular, drying | https://discoelysium.com/devblog/2016/02/10/weather-duty |
| 15 | Abandon Ship | Baked dense rain, rain puts out fires, wind angle | https://www.pcgamer.com/how-developers-make-perfect-rain-in-games |
| 16 | Airships: Conquer the Skies | Random vertical gray lines, 2D | same PC Gamer article |
| 17 | Stereophyta | Rhythmic rain triggers music | same PC Gamer article |
| 18 | NEO Scavenger | NOAA-driven precipitation | same PC Gamer article |
| 19 | Ghouls 'n Ghosts | Ground splashes cited as essential | https://80.lv/articles/how-rain-works-in-video-games |
| 20 | Slime Rancher 2 (not fetched) | Weather deep dive | https://www.gamedeveloper.com/programming/the-art-and-science-of-creating-weather-in-slime-rancher-2 |
| 21 | Croakwood (not fetched) | Water devlog | https://www.texelraptor.com/blog/croakwood-devlog-5 |

## Artist / developer quotes (<15 words)
- "A 4-frame loop is the gold standard for retro game art" (@pikpoo, BudgetPixel)
- "Raindrops move too fast for the human eye to track" (@pikpoo, BudgetPixel)
- "The splash is the fun part." (Raymond Schlitter / Slynyrd, Pixelblog 10)
- "One of the most important settings is where you place the ripple source." (Slynyrd)
- "I misuse a shadow map to mask whatever comes down from sky." (Siim Raidma, ZA/UM)
- "Each raindrop is a randomly placed vertical gray line." (David Stark, Airships, via PC Gamer)
- "We spawned an insanely high amount of rain particles" (Aaron Miller, Fireblade, via PC Gamer)
- "Just don't overdo it." (Gloria Levine, 80.lv, on puddle reflections)
- "rain masks footsteps" (Crytek, Hunt: Showdown blog)
- "I wanted this version to be rhythmic" (Kas Ghobadi, Stereophyta, via PC Gamer)

## Sources
- https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
- https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- https://discoelysium.com/devblog/2016/02/10/weather-duty
- https://80.lv/articles/how-rain-works-in-video-games
- https://www.pcgamer.com/how-developers-make-perfect-rain-in-games
- https://dontstarve.fandom.com/wiki/Rain
- https://dontstarve.wiki.gg/wiki/Wetness/DST
- https://stardewvalleywiki.com/Rain
- https://stardewvalleywiki.com/Weather
- https://nookipedia.com/wiki/Rain
- https://dos2.wiki/wiki/Wet_(Status)
- https://dos2.wiki/wiki/Rain
- https://zelda.fandom.com/wiki/Weather
- https://www.rimworldwiki.com/wiki/Rain
- https://valheim.fandom.com/wiki/Wet
- https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Rain
- https://advancewars.fandom.com/wiki/Rain
- https://www.fireemblemwiki.org/wiki/Rain
- https://discourse.cataclysmdda.org/t/wetness-mechanics/9038
- https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown
- https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Blocked or unfetched: bulbapedia.bulbagarden.net (not on allowlist / client error); penusbmic.itch.io (client error); saint11 Medium/Patreon (not reached).
