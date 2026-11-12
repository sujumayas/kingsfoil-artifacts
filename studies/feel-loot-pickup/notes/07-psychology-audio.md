# 07 Feel theory, psychology, academic work and loot audio

Researcher angle: why a drop feels good, what the research says about anticipation and reveal, how big games mix loot sound, and the ethics line. Everything is filtered for Asterion Online (32 px top-down, many players on one screen, Godot 4 web export).

Legend: "Cited" means a URL backs it. "Inference" means my judgement. "Estimate" means a number I made up as a starting value, not measured.

---

## Q1. Anticipation and the reveal pause. How long should a drop make you wait?

### Takeaway
A short tell before the full reveal raises arousal, and rarer outcomes raise it more. The one lab study that timed a loot reveal used a 2 s build, a colour tell at 2 s and the full reveal at 5 s. That is a menu ceremony. In an MMO where players spam-click corpses (combat juice study), the tell must ride on the drop itself (colour, sound, beam) and cost close to zero wait. Put the "pause" in the item's flight, not in front of the loot window.

### Cited findings
- Larche, Chini, Lee, Dixon, Fernandes (J. Gambling Studies, 2019/2021). Exp. 2 had 47 participants watch 49 real Overwatch box openings, each 15 s long. The box shakes for 0 to 2 s. At 2 s it throws four coloured coins whose colour already shows the rarity. The full item reveal comes at 5 s. https://pmc.ncbi.nlm.nih.gov/articles/PMC7882574 (full text read via Europe PMC: https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7882574/fullTextXML)
  - Skin conductance level rose during the 2 s shake versus the 2 s baseline (slope .0002 vs -.00002, t(39) = -3.88, p ≤ .001). The authors call it "a ramping up" of arousal before the reveal.
  - Rarer boxes gave larger skin conductance responses and harder clicks on a force-sensing mouse.
  - Post-reinforcement pause (time from coin reveal to clicking "next") grew with tier. Rare 4.91 s, epic 5.40 s, legendary 5.70 s (all pairs p ≤ .001, partial eta squared .35). Players linger about 0.8 s longer on a legendary than on a rare.
  - Rarer loot was rated more arousing, more positive and raised the urge to open more.
- Fiorillo, Tobler, Schultz (Science 299, 2003). Monkey dopamine neurons show a sustained ramp between cue and reward that peaks when reward probability is 0.5, the point of maximum uncertainty. The cue-to-reward delay was 2 s. https://pubmed.ncbi.nlm.nih.gov/12649484/ , PDF https://www.pdn.cam.ac.uk/system/files/documents/2003-fiorillo-science.pdf
- Overwatch's designer framed the box animation as "all about building the anticipation" (quoted in search summary of PC Gamer piece, https://www.pcgamer.com/behind-the-addictive-psychology-and-seductive-art-of-loot-boxes/ , page body did not load for me, quote unverified).
- Gacha games use an early colour tell. Genshin's wish shows a streaking star whose colour is the tell, and only the rare pull gets the full cinematic. https://hostedgg.com/blog/gacha-pull-reveal-color-culture . Wuthering Waves documents that the wish animation colour fixes the max rarity. https://samurai-gamers.com/wuthering-waves/wuwa-wish-rarity-indicator-guide/ . The same article notes heavy players end up mashing skip through multi-pulls.

### Inferences for Asterion
- The reward is in the uncertainty window, not in the length of the wait. A 300 to 600 ms item flight with a tier-coloured trail and a tier sound on landing is the MMO version of Overwatch's "coloured coins". The player knows the tier at landing and reads the exact item on hover or in the loot message.
- Scale ceremony by tier, never by default. Common items get no pause at all. Only top tiers earn a longer arc, a beam, a unique sting. This matches Genshin (full cinematic only for the rare pull) and keeps spam-looting fast.
- The post-reinforcement pause numbers suggest players will stop by themselves for about a second on a great drop. You do not need to force that stop with UI. Leave room for it: do not auto-close the loot window or auto-route the item before the sting finishes.
- Tibia corpses hide contents until opened. That creates a 0.5 probability-like window every kill ("did it drop?"). Canary quick loot removes that window. A loot message or a tier-tinted corpse sparkle keeps the window's payoff without the click.

### Gaps
- No study timed a reveal inside a real-time action loop. All lab data is menu-style video.
- I could not find the Overwatch shake duration in any developer source. The 2 s comes from the paper.

---

## Q2. Variable ratio schedules and near misses. What to use and what to refuse

### Takeaway
Random drops are a variable ratio schedule by nature, so loot already carries the strongest reinforcement pattern known. Presentation should make the outcome clear and fast. Do not fake near misses. Near misses feel worse than full misses yet raise the urge to continue, which is the textbook dark pattern.

### Cited findings
- Clark, Lawrence, Astley-Jones, Gray (Neuron 61:481-490, 2009). 15 volunteers in fMRI. Near misses on a slot machine activated ventral striatum and anterior insula, the same regions as wins. Near misses were rated less pleasant than full misses but raised the desire to play. The effect depended on personal control. https://www.eurekalert.org/news-releases/653015 , dataset record https://www.omicsdi.org/dataset/biostudies-literature/S-EPMC2658737
- Chase and Clark (J. Neuroscience, 2010). Problem gamblers show a stronger midbrain response to near misses. https://www.sfn.org/publications/latest-news/2010/05/04/problem-gamblers-provoked-by-near-misses-to-gamble-more
- CS:GO style case reels pick the result before the reel spins. The strip is decorative and guides describe stops one slot from a knife. https://www.exitlag.com/blog/csgo-cases/ (secondary, no Valve source, no timing found).
- Zagal, Björk, Lewis, "Dark Patterns in the Design of Games", FDG 2013, pp. 39-46. Defines dark patterns as design used against the player's interest. https://research.chalmers.se/en/publication/177148 . Counterpoint: Deterding, Stenros, Montola, "Against Dark Game Design Patterns", DiGRA 2020. https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf

### Inferences for Asterion
- Refuse: "almost dropped" visuals, a rare item flashing before a common one lands, reels, or corpse-open animations that fake a tier and then downgrade it.
- Allow: an honest tier tell that is never wrong. If the trail is gold, a gold item lands.
- Asterion has no paid loot, which removes the legal and ethical weight of loot boxes. The pattern still matters for long session health, but the stakes are lower than gacha.

### Gaps
- No near-miss study on ground loot in an action game.

---

## Q3. Juice research. Does more feedback make loot feel better?

### Takeaway
Up to a point. The best controlled study found that tying feedback to success helps, and that blanket amplification hurts. For loot this means the effect size must track the value of the drop. A crate of bones with fireworks teaches the player to ignore fireworks.

### Cited findings
- Kao, Ballou, Gerling, Breitsohl, Deterding, "How does juicy game feedback motivate?", CHI 2024. N = 1,699, pre-registered, 2x2 plus control in an action RPG. Success-dependent feedback raised effectance, competence and curiosity. Amplification by itself reduced those motives, possibly by weakening agency. Curiosity was the strongest predictor of enjoyment and the only predictor of playtime. https://www.universityxp.com/research/2026/7/19/how-does-juicy-game-feedback-motivate-testing-curiosity-competence-and-effectance , https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d
- Kao (earlier RPG study, cited in Hicks et al. 2024): no juice and too much juice both hurt experience, playtime and performance. Medium and high levels helped. https://eprints.staffs.ac.uk/8527/1/3677084.pdf
- Hicks, Dickinson, Holopainen, Gerling, "Good Game Feel: An Empirically Grounded Framework for Juicy Design", DiGRA 2018. Survey of 17 developers plus affinity diagram. https://dl.digra.org/index.php/dl/article/view/936
- Hicks, Rogers, Gerling, Nacke, "Juicy Audio", CHI PLAY 2024. Interviews with 12 game audio designers. Three key factors: emphasis/augmentation, cohesion/coherence, synesthesia. Designers save juicy audio "for the special moments" and say sparing use is what makes it feel rewarding. They vary sounds to avoid repetition, and let rarer sounds be more unique. https://eprints.staffs.ac.uk/8527/1/3677084.pdf
- Smets and van der Spek (cited in the same paper). Juicier versions of 8 sound effects (pitch shift, reverb, layers, longer duration) gave n = 61 players higher immersion and sensory fidelity, medium effect size. Same source.
- Jonasson and Purho, "Juice It or Lose It", GDC Europe 2012, free on GDC Vault. https://gdcvault.com/play/1016789/Juice-It-or-Lose . Counterpoint talk by Folmer Kelly, GDC Europe 2014, on lost immersion. https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-

### Inferences for Asterion
- Make every loot effect a function of tier. Tier 0 (junk) gets a soft thud and no sparkle. Tier 1 adds a pitch-up. Top tiers get a beam and a unique sting. This is "success-dependent" in Kao's terms.
- Curiosity drives playtime. A sealed corpse or a tier tell with the exact item still hidden on the ground is a curiosity hook that costs nothing to render.

### Gaps
- No juice study measured loot specifically.

---

## Q4. Loot fatigue and feel inflation

### Takeaway
Every major looter of the last decade has cut drop volume or added filters because too many drops wreck the feel of each drop. Since 2025 both Diablo II: Resurrected and Diablo IV shipped native filters. For an MMO with shared screens, clutter is worse because other players' drops add to yours.

### Cited findings
- Diablo III Loot 2.0 (patch 2.0.1, 2014): goal stated at BlizzCon 2013 was fewer, better, more epic legendaries, plus smart loot skewed to your class. Panel with Travis Day, Josh Mosqueira, Steve Shimizu. https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript , https://di.diablowiki.net/Loot_2.0 . I found no GDC talk by Day on this.
- Diablo IV Season 4 "Loot Reborn", 14 May 2024: fewer drops with higher odds of value, rares 2 affixes, legendaries 3, so players spend more time fighting and less sorting. https://news.blizzard.com/en-us/article/24077223 , https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/
- 8 Sept 2025: D4 design director Dan Tanguay said their smart pre-filter approach had hit its limit. https://mein-mmo.de/en/blizzard-says-they-talk-about-loot-filter-in-diablo-4-admit-their-current-system-is-slowly-failing,1524278 . Players complained of "legendary loot overload". https://dexerto.com/diablo/diablo-4-legendary-loot-overload-2867981
- Diablo IV loot filter shipped free with Lord of Hatred, 28 April 2026. Reported up to 25 custom rules, coloured ground labels, sound alerts, hide rules. Fan and secondary sources only. https://www.diablobytes.com/diablo-iv/lord-of-hatred/loot-filter/ , https://www.pulse.bot/gaming/news/how-to-use-loot-filter-in-diablo-4-0b276d8a-0687-414c-b8d0-daacd7360643/
- Diablo II: Resurrected native loot filter in Reign of the Warlock, reported 11 Feb 2026, JSON import from clipboard, per-character profiles. https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/
- Borderlands 4: Gearbox said it overhauled drop rates to make rarity matter again and admitted Borderlands 3 legendaries dropped too often. https://www.gamesradar.com/games/borderlands/with-borderlands-4-gearbox-says-weve-overhauled-our-drop-rates-and-loot-across-the-game-and-admits-that-in-borderlands-3-legendaries-dropped-too-often
- Borderlands 2 signalled rarity by beam colour only, which failed colourblind players. Gearbox later added colourblind recolours and had to account for split screen. https://gearboxsoftware.com/?p=10220 (page reset on fetch, claim from search summary).

### Inferences for Asterion
- Item drop counts are economy, out of scope. But presentation must assume many drops. Give a "minimum tier for sound" and "minimum tier for label" setting from day one, like D4's old drop sound threshold. It is cheaper than a full filter and solves half the clutter.
- Never use colour alone. Pair each tier with a shape (beam, sparkle, outline) and a sound so colourblind players and muted players both read it.

---

## Q5. Loot audio. Tier sounds, coin streaks, pickup confirms, mixing many at once

### Takeaway
Three sound layers do most of the work: a landing sound per tier, a short pickup confirm, and a coin sound whose pitch climbs on a streak. With 30 players around a boss, the mixer must cap voices per sound type and prefer your own loot over others'. Godot web export runs audio as Web Audio samples by default, so bus effects are off on web. Plan pitch and volume tricks that work without effects.

### Cited findings: per-tier drop sounds and filters
- Path of Exile filter syntax: `PlayAlertSound <Id 1-16> <Volume 0-300, default 50>`, `PlayAlertSoundPositional` (same ranges, plays at the item's position), `CustomAlertSound "<file>" <0-300, default 100>` with semicolon lists picking one at random, `DisableDropSound` turns off the landing sound, `PlayEffect <colour> [Temp]` beam (Temp shows only during the drop), `MinimapIcon <0-2> <colour> <shape>`, `SetFontSize 1-45`. https://www.pathofexile.com/item-filter/about
- PoE players report volume 300 too loud for some sounds and lowered to 100. Uniques also play a special sound on first drop. https://www.pathofexile.com/forum/view-thread/2516329 , https://www.pathofexile.com/forum/view-thread/1246208/page/382
- Community filters use spoken currency names as custom sounds. https://www.pathofexile.com/forum/view-thread/3080356
- Diablo IV had a "minimum quality for item drop sounds" setting before filters, used as a pseudo-filter. https://game8.co/games/Diablo-4/archives/417336
- Diablo III kept the Diablo II item drop sound ("fwip-fwip-fwip"), made a new gold drop sound, and kept the health globe drain sound so returning players would recognise it (supervising sound designer Joseph Lawrence, PCWorld). Repost: https://peelsering.blogspot.com/2022/01/scoring-sanctuary-sound-design-of.html , original: https://www.pcworld.com/article/465972/scoring_sanctuary_the_sound_design_of_diablo_iii.html . Attribution to Matt Uelmen or Scott Peterson is uncertain in the source.
- Matt Uelmen on Diablo audio teams and tools: https://gamedeveloper.com/audio/audio-content-for-i-diablo-i-and-i-diablo-2-i-tools-teams-and-products
- Diablo III patch 2.6.4 focused on celebrating Primal Legendary drops. Players earlier asked for a distinct Primal sound. https://us.diablo3.com/blog/22863534
- Diablo III removed the Keystone beam in 2.1.1 and kept minimap icon plus sound as the tell. https://gameranx.com/?p=24316

### Cited findings: coin streak pitch
- A Godot 4 snippet: `PITCH_STEP = 0.07` per pickup, `MAX_COMBO = 14` (pitch caps at 1.98), `RESET_MS = 1200`, 4 round-robin `AudioStreamPlayer` voices, `volume_db = -5`, 0.14 s sound, base 1245 Hz plus a fifth, 4 ms attack, 15 ms haptic. https://www.vinzius.com/snippets/coin-pickup-sound-effect-godot-4/
  - 0.07 is a rate multiplier, about 1.2 semitones per step at the start. 14 steps reach nearly an octave.
- Roblox thread: increment a counter if the last coin came within a window (about 5 s in the example) and loop a pitch table so long streaks do not climb forever. https://devforum.roblox.com/t/coin-sound-effect-should-get-a-bit-faster-if-you-collect-multiple-in-a-straight-row/2128658
- A coin cue that is too bright cuts through the mix and turns harsh, and a late one feels detached. https://morphic.com/resources/sounds/coin-sound-effects

### Cited findings: mixing many at once
- Godot `AudioStreamPlayer2D`: `max_polyphony` default 1, extra plays cut the oldest. `max_distance` default 2000 px, `attenuation` exponent 1.0. https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html
- Godot 4.3+ web export defaults to "Sample" playback through Web Audio for low latency without threads. AudioEffects are not supported in Sample mode. Stream mode restores effects at the cost of latency. https://godotengine.org/article/progress-report-web-export-in-4-3/ , https://notabug.org/godotengine/godot-docs/src/4.3/tutorials/export/exporting_for_web.rst . Users report pitch shift effects and crackling issues in web builds. https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949
- Wwise practice: non-looping sounds that lose priority should be killed, loops go virtual. Cull with playback limits per actor-mixer, bus or global, and offset priority by distance so far and quiet voices drop first. https://www.audiokinetic.com/en/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1 , https://audiokinetic.com/qa/8540/emitters-sorting-priority-distance-global-playback-reached
- CRI ADX2 voice limit groups can prefer newer or older requests. https://blog.criware.com/index.php/2021/01/19/voice-limiting-in-atom-craft/

### Cited findings: Tibia and sound
- Tibia had no sound from January 1997 until client 13.00.12529 on 27 Sept 2022. https://tibia.fandom.com/wiki/Version_13_Updates , https://www.gamesradar.com/this-ancient-mmo-is-getting-sound-25-years-after-launch
- No technical reason; the team prioritised other features, and players did not miss it. Sound is optional. Ambience uses random clips to avoid repeats. No footsteps because characters move too fast. The team tested with dozens of players and monsters and did not think large battles would be too loud. No loot or pickup sounds mentioned. https://www.vice.com/en/article/why-it-took-25-years-for-the-video-game-tibia-to-get-sound
- At launch footsteps, critical hits, levers, doors and mounts still had no sound. https://tibiavip.app/home/news?id=2493
- Sound and music mute separately. https://tibiaqa.com/31500/how-does-sound-work-in-tibia

### Inferences for Asterion (all numbers are estimates)
- Loot sound budget, top to bottom:
  1. Top-tier drop sting, only for loot you own. Unique per tier, 400 to 900 ms, never voice-limited below 1. Plays even if the item is off screen within your area of interest, like PoE positional alerts.
  2. Landing sound per tier for your own loot, 80 to 200 ms. Max 3 voices per tier.
  3. Pickup confirm, 60 to 120 ms, plays on server ack, not on click (see Q6).
  4. Coin streak: step +1 semitone (rate x1.0595) per pickup inside a 1.0 to 1.2 s window, cap at 7 to 12 steps (a fifth to an octave), then hold or loop a pentatonic table. Add a random plus or minus 0.3 semitone jitter. Use `pitch_scale` on the player, which is a playback rate change and works in Web Sample mode, unlike the PitchShift effect.
  5. Other players' loot: one shared "someone else's drop" sound at -12 dB or silent, top tiers only. Tibia's own sound team leaned on randomised, optional sound for crowds.
- Voice caps: set `max_polyphony` 2 to 4 per loot player node, and route all loot through a small pool (8 voices total is a safe start) with priority mine > party > others and tier high > low. Kill the oldest low-tier voice first. That is the Wwise rule rebuilt in GDScript.
- Ducking: Web Sample mode has no compressor effect, so duck in code. On a top-tier sting, drop the loot bus by 6 dB for 300 ms and suppress new low-tier landing sounds for 150 ms.
- Merge rapid identical events. If 20 coins land in one tick, play one heavier coin cluster sound, not 20 plays. Cheaper and clearer.
- Tibia players lived 25 years with silent loot. The loot message in chat did the job. So sound must never be the only channel. Every tier tell needs a visual twin.

### Gaps
- No public numbers for Diablo II or Destiny drop sound durations or tier mapping. I found no source on a Destiny exotic engram chime.
- No measured CPU cost of Godot web audio voices.

---

## Q6. Pickup confirm under server authority. When should the sound play?

### Takeaway
Play a soft local sound on click and the real confirm on server ack. The research on success-dependent feedback (Kao 2024) says feedback that lies about success hurts. A confirm that plays and then the item bounces back is a lie.

### Cited findings
- Success-dependent feedback raised competence and curiosity, amplification alone did not. https://www.universityxp.com/research/2026/7/19/how-does-juicy-game-feedback-motivate-testing-curiosity-competence-and-effectance
- Audio designers stress predictable responses to player actions. "Expected mechanical action" coded in 9% of statements. https://eprints.staffs.ac.uk/8527/1/3677084.pdf

### Inferences
- Two-part pickup sound: a quiet tick on input (0 ms) and the "into bag" confirm on ack (one round trip, about 50 to 150 ms on decent links, estimate). On reject, a dull thud and the item settles back. Netcode details belong to the netcode researcher.

---

## Q7. Hades and "known reward" design

### Cited findings
- Hades shows the reward symbol over each exit door, so the player picks the reward before the fight. https://blog.hyperx.com/article/6894/what-do-the-door-symbols-mean-in-hades . In Hades II the reward type comes from a bag and the god is chosen after the type. https://hades2.game-vault.net/wiki/Doors
- The CHI '22 paper "The Reward for Luck" analysed 35 random reward systems and interviewed 14 players. The resources spent and the reward's relative value set how players expect it to be presented. https://www.robertxiao.ca/research/reward-for-luck/

### Inferences
- Presentation should match the cost. A boss that took 30 players 10 minutes earns a long reveal. A rat earns none. That is "The Reward for Luck" in one rule.
- Hades shows that a known reward can still feel good if the choice is the payoff. Boss chests that show the tier first and the item on open fit that.

---

## Draft rules for Asterion (inference)
1. Effect size follows tier and effort. Common loot is quiet and fast.
2. The tier tell is honest and early (at landing), and has colour, shape and sound.
3. No forced wait before looting. Ceremony lives in the item flight, 300 to 600 ms, top tiers up to about 1 s.
4. Own loot loud, party loot soft, strangers' loot near silent.
5. Cap voices per tier and in total, merge same-tick coins, duck in code on web.
6. Coin streaks climb about 1 semitone per pickup inside a 1.2 s window and cap under an octave.
7. Confirm sound on server ack.
8. Ship "minimum tier for sound/label/beam" settings at launch.

---

## Sources
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7882574
- https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7882574/fullTextXML
- https://pubmed.ncbi.nlm.nih.gov/12649484/
- https://www.pdn.cam.ac.uk/system/files/documents/2003-fiorillo-science.pdf
- https://www.pcgamer.com/behind-the-addictive-psychology-and-seductive-art-of-loot-boxes/
- https://hostedgg.com/blog/gacha-pull-reveal-color-culture
- https://samurai-gamers.com/wuthering-waves/wuwa-wish-rarity-indicator-guide/
- https://www.eurekalert.org/news-releases/653015
- https://www.omicsdi.org/dataset/biostudies-literature/S-EPMC2658737
- https://www.sfn.org/publications/latest-news/2010/05/04/problem-gamblers-provoked-by-near-misses-to-gamble-more
- https://www.exitlag.com/blog/csgo-cases/
- https://research.chalmers.se/en/publication/177148
- https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf
- https://www.universityxp.com/research/2026/7/19/how-does-juicy-game-feedback-motivate-testing-curiosity-competence-and-effectance
- https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d
- https://eprints.staffs.ac.uk/8527/1/3677084.pdf
- https://dl.digra.org/index.php/dl/article/view/936
- https://gdcvault.com/play/1016789/Juice-It-or-Lose
- https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-
- https://www.robertxiao.ca/research/reward-for-luck/
- https://arxiv.org/abs/2507.04906 (2025 EDA loot box study, abstract only, no results read)
- https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript
- https://di.diablowiki.net/Loot_2.0
- https://news.blizzard.com/en-us/article/24077223
- https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/
- https://mein-mmo.de/en/blizzard-says-they-talk-about-loot-filter-in-diablo-4-admit-their-current-system-is-slowly-failing,1524278
- https://dexerto.com/diablo/diablo-4-legendary-loot-overload-2867981
- https://www.diablobytes.com/diablo-iv/lord-of-hatred/loot-filter/
- https://www.pulse.bot/gaming/news/how-to-use-loot-filter-in-diablo-4-0b276d8a-0687-414c-b8d0-daacd7360643/
- https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/
- https://www.gamesradar.com/games/borderlands/with-borderlands-4-gearbox-says-weve-overhauled-our-drop-rates-and-loot-across-the-game-and-admits-that-in-borderlands-3-legendaries-dropped-too-often
- https://gearboxsoftware.com/?p=10220
- https://www.pathofexile.com/item-filter/about
- https://www.pathofexile.com/forum/view-thread/2516329
- https://www.pathofexile.com/forum/view-thread/1246208/page/382
- https://www.pathofexile.com/forum/view-thread/3080356
- https://game8.co/games/Diablo-4/archives/417336
- https://peelsering.blogspot.com/2022/01/scoring-sanctuary-sound-design-of.html
- https://www.pcworld.com/article/465972/scoring_sanctuary_the_sound_design_of_diablo_iii.html
- https://gamedeveloper.com/audio/audio-content-for-i-diablo-i-and-i-diablo-2-i-tools-teams-and-products
- https://us.diablo3.com/blog/22863534
- https://gameranx.com/?p=24316
- https://www.vinzius.com/snippets/coin-pickup-sound-effect-godot-4/
- https://devforum.roblox.com/t/coin-sound-effect-should-get-a-bit-faster-if-you-collect-multiple-in-a-straight-row/2128658
- https://morphic.com/resources/sounds/coin-sound-effects
- https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html
- https://godotengine.org/article/progress-report-web-export-in-4-3/
- https://notabug.org/godotengine/godot-docs/src/4.3/tutorials/export/exporting_for_web.rst
- https://forum.godotengine.org/t/pitchshift-doesnt-work-in-web-build/139949
- https://www.audiokinetic.com/en/how-to-get-a-hold-on-your-voices-optimizing-for-cpu-part-1
- https://audiokinetic.com/qa/8540/emitters-sorting-priority-distance-global-playback-reached
- https://blog.criware.com/index.php/2021/01/19/voice-limiting-in-atom-craft/
- https://tibia.fandom.com/wiki/Version_13_Updates
- https://www.gamesradar.com/this-ancient-mmo-is-getting-sound-25-years-after-launch
- https://www.vice.com/en/article/why-it-took-25-years-for-the-video-game-tibia-to-get-sound
- https://tibiavip.app/home/news?id=2493
- https://tibiaqa.com/31500/how-does-sound-work-in-tibia
- https://blog.hyperx.com/article/6894/what-do-the-door-symbols-mean-in-hades
- https://hades2.game-vault.net/wiki/Doors

## Overall gaps
- No GDC talk by Travis Day on Loot 2.0 found. BlizzCon 2013 panel is the primary source.
- No Diablo II drop sound anecdote with numbers. No Destiny engram sound source.
- PC Gamer loot box article and Gearbox colourblind post did not load. Claims from them come from search summaries.
- No measured runtime cost for many simultaneous Web Audio voices in Godot.
- 2025 arXiv EDA loot box study (Tedeschi et al.) read as abstract only.
