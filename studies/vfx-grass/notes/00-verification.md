# Lead verification and writer guidance (vfx-grass)

Claims the lead flagged for checking, and corrections. The writer reads this before the notes.

## To verify
- Note 04: TFS `Player::canSeeCreature` filters only invisible monsters. Invisible players are still sent with an empty outfit, which leaks their position. Check this in the TFS source before the report relies on it.
- Notes 01 and 03 both give the Tibia regrowth timers (300 s for jungle grass, 2 x 240 s for wheat). Two notes agree, but both should be checked against the items.xml decayTo/duration entries.

## Results
- CONFIRMED (lead, 2026-11-11, TFS master): `Player::canSeeCreature` (src/player.cpp ~line 723) returns false for invisible creatures only when `!creature->getPlayer()`, so invisible players pass. `ProtocolGame::AddCreature` (src/protocolgame.cpp ~line 3431) sends an empty outfit for invisible or ghost creatures, but position, direction and light still go out. Only ghost mode is filtered by `canSeeGhostMode`. Source: https://github.com/otland/forgottenserver/blob/master/src/player.cpp . Tag [V] in the report, and use it as the anti-pattern for grass hiding.
- SETTLED (lead): Emerald tall grass rustle. Note 01 says 4 frames x 10 ticks (0.67 s), note 10 says 5 frames x 10 ticks (0.84 s). Source `src/data/field_effects/field_effect_objects.h` `sAnim_TallGrass`: frames 1,2,3,4 then 0, each 10 ticks, then END. So 4 motion frames plus the resting frame 0, 50 ticks total = 0.83 s at 59.73 fps. Use "4 frames then rest, 50 ticks (~0.83 s)". https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- CONFIRMED (lead): TFS data/items/items.xml. Wheat 2737 -> 2738 -> 2739, duration 240 s each. Jungle grass 2781 (cut) -> 2782, duration 300 s. https://github.com/otland/forgottenserver/blob/master/data/items/items.xml

## Labels the writer must apply
- Note 06: P. pyralis 5.9 s interflash interval is Lloyd 1966 via a secondary source; flash length 0.3-0.75 s spans secondary sources. Tag accordingly.
- Note 07: the flee/hop table scaled to 32 px tiles is the researcher's scaling [I], not shipped values.
- Note 08: 5 colours per grass ramp is the researcher's proposal [I].
- Note 10: Dynamic 2D Grass (mlaass) is young (10 stars, v1.0.2 2026-04-19). Boids addon timing (2,000 boids at 11 ms on Ryzen 5600) is self-reported.
- Stardew decompiles have no licence (study only). Shattered Pixel Dungeon is GPL, Luanti media CC BY-SA: copyleft, re-implement.
- Stardew butterfly flap: 4 or 6 frames of 45-80 ms per flap plus 200 ms rest (note 05) gives roughly 2-5.6 flaps per second; note 10 says 3-5.6 Hz. Real cabbage white is 11.8 Hz. The game rate is far below the real one, and that is the readable choice at low res [I].

## Newest-product dates (lead web check, 2026-11-11)
- Godot 4.7 stable: 19 June 2026 (https://godotengine.org/releases/4.7/ ; https://gamingonlinux.com/2026/06/godot-engine-4-7-is-out-bringing-a-new-asset-store-hdr-support-steam-frame-support). DrawableTexture2D ships in 4.7; blit methods marked Experimental per note 09; no web ms data [U].
- Tiny Glade: Steam launch 23 September 2024 (https://www.gamingonlinux.com/2024/08/chilled-castle-doodling-game-tiny-glade-releases-september-23-and-the-demo-is-back/page=1/). Note 09's date is correct.
- Minecraft Java 1.21.5 "Spring to Life": 25 March 2025; firefly bush particles at light level 13 or lower, bush emits light 2 (https://feedback.minecraft.net/hc/en-us/articles/35298208390797-Minecraft-Java-Edition-1-21-5-Spring-to-Life).

## Post-report corrections (lead)
- §7 pseudocode: `on_tool` now sets `rec.sent` so `sweep()` does not resend a tile it just broadcast.
- Agent H found 8 profiles citing 0.015 ms for 2,000 instanced tufts while §6a says 0.012. Note 11 row reads "Metal wall slope / Metal timer / SwiftShader" = 0.015 / 0.012 / 27.4; §6a uses the timer column. Profiles changed to 0.012 ms.
- Agent F: D3 2D-port sentence claimed "flat 4 s then snap"; eq. 3 gives gradual recovery. Rewritten. F2 loop (fly 1-3 s, sit 2-6 s) contradicted the cited 2 s median; changed to fly 0.5-1 s, sit 1-2.5 s, matching the sandbox. Halo numbers (0.052 vs 0.19 ms at N=200; 0.22 vs 0.89 at N=1000) are both from note 11 and consistent; no change.
