# 00 Verification: lead checks, conflicts and corrections for the writer

Checks done by the lead while the researchers ran. Where this file disagrees with a note, this file wins.

## Settled
- **Missile flight time.** The brief and the first sandbox spec said 150 ms per tile. OTClient computes `150 ms x sqrt(tile distance)` (notes 01 and 03, both from source). Use the square-root form everywhere.
- **UE mask size.** The benchmark brief said 37 tiles. `AREA_CIRCLE5X5` in TFS `spells.lua` has 73 hit tiles (rows 1, 5, 7, 9, 9, 11, 9, 9, 7, 5, 1; counted by the lead in `scratch-04/dl/tfs_spells.lua`). `AREA_CIRCLE3X3` has 37. A Canary boss UE has 101.
- **Bytes per Tibia magic effect.** Note 04 estimated 7 bytes, note 07 read 9 from TFS. Note 01 settles it from source: 7 bytes in the old protocol, 9 to 11 from protocol 12.03 on. Missile: 12 bytes old, 11 to 13 new. Quote both with the protocol version. A 73-tile UE is 511 bytes (old) to 730 (new) per spectator per cast.
- **Flash safe area in tiles.** Note 07 maps the WCAG small-area exemption (2.8% of the screen, about 1,600 px at 320x180) to "roughly 1.5 tiles". That is for 32 px tiles. The sandbox uses 16 px tiles, where it is about 6 tiles.
- **Effect frame clock.** 75 ms per frame, `EFFECT_TICKS_PER_FRAME = 75` in OTClient (notes 01 and 04). Agrees with Combat juice B4.

- **Riot VFX style guide, read in full by note 13 (Wayback copy; the live link is dead).** CONFIRMED: avoid 100% or 0% values, for both value and saturation. NOT in the PDF, so do not attribute to Riot: the "peak brightness within the first 25% of the effect's life" rule (it is VFX Apprentice's summary; cite it to them), a "tertiary" tier, and the damage / crowd control / dodgeability / impact ranking. The guide's real importance scale is: idle, basic attack, defensive, damage, game changer, ultimate. It has no shields section. Note 13 wins over note 06 here.
- **Shields.** Note 05 had no shipped-game source. Note 13 found: Tibia draws no bubble for Magic Shield (only CONST_ME_LOSEENERGY and a blue number per hit); Diablo II Energy Shield is an 8-frame ball plus 8 directional 9-frame hit overlays; Bone Armor is a 12-frame cast and 24-frame front and back loops; Shattered Pixel Dungeon's halo break scales 1x to 2x over 1 s.
- **Hit-spark frame counts.** MUGEN stock `fightfx.air`: light 6 frames / 200 ms, medium 5 / 167 ms, strong 10 entries / 217 ms (five 1-tick frames first, slower tail), guard 217 ms. Ikemen GO: 14 frames / 233 ms, very strong 17 / 283 ms. The ms assume 60 ticks per second. No Capcom or Arc System Works primary data was found; say so.
- **Screen feedback strengths.** Luanti red damage flash capped at 50% alpha for 0.25 to 0.33 s; Quake damage blend 12 to 59% for 0.2 to 1.0 s; Veloren low-health pulse under 10% HP at 0.23 to 0.53 Hz.

## Fact-check verdicts (note 14, against primary sources)
- **Diablo II Overlay.txt PreDraw.** 1 = drawn behind the unit. In `overlay.json`, 36 of 37 "back" overlays have 1 and 24 of 26 "front" overlays have 0. Phrozen Keep agrees; the D2R data guide line is wrong.
- **Diablo tick rates.** DevilutionX defaults to 20 ticks per second (adjustable), Diablo II runs 25 frames per second. Note 02's ms durations hold.
- **Godot.** Current stable is 4.7.2 (2026-08-18); 4.8 is in beta. Glow works in Compatibility. HDR 2D is implemented in the 4.7.2 source although the docs feature table still says "Not supported": state both and tell the reader to test. 2D instance uniforms shipped in 4.4. GPUParticles2D trails and sub-emitters are unsupported in Compatibility.
- **Terraria.** maxDust 6000, maxProjectiles 1000, maxGore 600: confirmed.
- **WCAG 2.3.1.** 3 flashes per second, 10% luminance, red ratio 0.8: confirmed. The 21,824 px figure (341 x 256 at 1024x768) is in technique G176, not the Understanding page; cite G176.
- **OTClient constants.** edubart/otclient: `150 * sqrt(distance)` in missile.cpp L75, `EFFECT_TICKS_PER_FRAME = 75` in effect.h L34 (pinned links in note 14). In mehah/otclient both are config defaults of 75 and 150 in setup.otml, so they are tunable there.
- **Dead links.** Both nexus.leagueoflegends.com links are dead and Riot's guide page redirects to the League home page. Use the Wayback copy from note 13 and the VFX Apprentice summary. Four URLs return 403 to scripts only (two tibia.fandom pages, AWN, Epic); the Xbox guideline moved (new URL in note 14). Use note 14's table for every "see it in action" link from notes 01 and 06.
- **Tibia effect options.** A Tibia teaser of 2025-10-22 shows spell opacity sliders for own spells, other players and monsters, 0 to 100%. Note 07 had this as not found.

## Still open (say so in §12)
- No developer statements found for Wizard of Legend, Enter the Gungeon or Nuclear Throne on effect authoring or bullet readability.
- No official effect settings found for Lost Ark, Albion or New World.
- No Capcom or Arc System Works primary hit-spark data, no Metal Slug data, no Dota art guide text.
- The element hue / shape / motion table is author judgement.
- Stardew `GameLocation.explode` was not read.

## Found while building figures
- **Emerald darkening.** `BlendPalette` takes a coefficient toward the target colour, so "darken to 6 of 16" means 10/16 brightness left, and 7 means 9/16. The lead's relay to the sandbox builder read it as brightness left, and the sandbox dimmed to 7/16. Fixed in the sandbox (now coefficient 7), the spec and report A7.
- **Homing circle.** At Tibia-clock speeds (about 21 tiles/s on a 10-tile shot) the turning circle at 3.5 degrees per frame is about 5.7 tiles. Added to B3; it is why the blend onto the direct path is needed.
