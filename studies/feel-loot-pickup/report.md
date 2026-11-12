# Loot and pickup in a top-down pixel MMORPG: drops, reveals, pickup, sharing and death

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #3 of the **Game feel** series in our library [S1], after NPCs and dialog [S2] and combat juice [S3]. Combat juice ends with a corpse about 133 ms after the killing hit [V, S3]. This study follows the item from the next frame into the bag: the drop, the reveal, the pickup, who may take it, the netcode, and what a player loses on death. Drop rates, balance, affixes, crafting and trading are out of scope.

The reference is Tibia. A Tibia monster dies into a corpse container that already holds its loot, the server prints "Loot of a dragon: ..." in chat, and only the top damage dealer and their party may open it during the corpse's first 10 s stage [V, S6, S10, S11, S12]. Nothing pops, glows or flies. Players spam-click corpses, so any animation in front of the loot window feels like lag [V, S3]. The ARPGs went the other way, with items that flip out of the body, ring when they land and throw a beam of light for the rare ones [V, S84, S95]. Both break when 30 players share a screen. A stranger's beam is noise, and a corpse that hides everything gives no thrill. Every profile says what transfers to a 32 px server game and what does not.

**Four equal priorities.**
- **Feel and pixel art.** Timing in frames and ms, readability at 32 px, what players praise and hate.
- **MMO problems.** Shared screen, server authority, latency, races, crowds, PvP fairness and griefing.
- **Implementation.** Godot 4 (GDScript, web export), data-driven tier styles.
- **Runtime cost.** Hundreds of ground items, glows, beams and labels at once on low-end web. Every cost is measured or labelled as an estimate.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2), plus mobile and desktop.
- Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**, server-authoritative, PvE and PvP, with a "meaningful death" pillar.
- Phones and old laptops.

**Sources.** Ten research notes, a verification note, our **Loot and Pickup Sandbox** [S4] and our loot benchmark [S5]. Most hard numbers come from source code: Canary, TFS, OTClient, RuneLite, rAthena, Cosmic, ServUO, devilutionX, Shattered Pixel Dungeon and Flare. Emulator numbers are the community's best match to the official servers. The benchmark ran on an Apple M4 Pro in Chromium 153. **No phone and no Godot build were measured.**

---

## 1. Executive summary

**Feel and pixel art.**

1. **The drop lasts about 400 ms and the sound marks the landing.** Shattered Pixel Dungeon lands an item in 400 ms with a 10 px apex on 16 px tiles [V, S125]. Diablo I flips most items in 650 ms and plays the sound halfway; Diablo II plays it 480 ms in [V, S84, S86]. None of them bounce. Asterion uses 400 ms, a 20 px apex, a floor shadow and the sound on landing [I].
2. **Five tiers in the order players know, each with a shape.** White, green, blue, purple and orange is the Borderlands and WoW lineage [V, S110]. Terraria's wiki warns its green and lime look alike, and D2R players cannot see unique gold on the ground [V, S131, S91]. Every colour gets an outline shape and a sound [I].
3. **Effect size follows value, and the tell never lies.** Feedback tied to success raised competence and curiosity in 1,699 players, while blanket amplification lowered them [V, S143]. Near misses feel worse than misses yet raise the urge to continue [V, S141]. A rat gets a thud, a legendary a beam, a sting and a ping [I].

**MMO problems.**

4. **Ownership is a short window, then public.** Tibia's top damage dealer owns a corpse only during its first 10 s stage [V, S10, S11, S12]. rAthena stages priority 3 + 2 + 2 s for the top three [V, S65]. Asterion owns monster corpses for 15 s, then opens them to helpers and the public [I].
5. **Ownership travels with the item.** OSRS sends both timers and an ownership type with every ground item [V, S64]. Canary sends the loot highlight only to eligible viewers [V, S7]. That removes most rejections before the click [I].
6. **The server decides races in a fair order.** Tibia takes the first packet [V, S22, S30]. OSRS batches 600 ms ticks and orders players by an ID that reshuffles every 60 to 90 s [V, S51, S52]. Asterion batches 100 ms ticks with a rotating rank, so ping does not decide [I].
7. **Predict the press, confirm the pickup.** Path of Exile's predictive mode ended in a lockstep mode against desync in 2015 [V, S107, S108]. Asterion plays a tick and a 4 px hop at once and flies the item to the bag only on the server's answer [I].
8. **Dupes come from two stores saved apart.** TFS keys items by slot with no item ID [V, S31]. New World shut all wealth transfers over a gold dupe in November 2021 [V, S122]. Every Asterion item gets a GUID and every move is one guarded transaction [I].

**Implementation.**

9. **One server function for every way of looting.** Canary routes quick loot, loot nearby in the 3x3 and autoloot through one path with a 1 tile reach, a 300 ms walk-then-retry, a 30 corpse cap and exact messages [V, S8, S9].
10. **Presentation is a data table.** A PoE filter rule sets size, colours, sound, beam and minimap icon [V, S103], and NeverSink's ladder runs from font 18 junk to font 45 with a red beam and volume 300 [V, S105]. In Godot that is one `LootTierStyle` Resource per tier; the wire carries an item ID and a tier [I].
11. **Death drops reuse the corpse.** Canary drops the backpack at 100, 70, 45, 25, 10 or 0% by blessings and each worn piece at a tenth of that, into the victim's corpse [V, S16]. OSRS keeps the 3 most valuable items and holds the rest in a grave whose 15 minute timer pauses offline [V, S54, S55].

**Runtime cost.**

12. **Glow as a sprite, never as a blur.** 200 halo sprites cost about 0.4 ms on the M4 GPU; Canvas `shadowBlur` cost 20.1 ms for the same items [V, S5].
13. **Cache labels once.** 200 labels from a shared atlas cost 0.18 ms; glyph by glyph 2.15 ms; `fillText` 0.45 ms on the GPU but 26.7 ms in software GL [V, S5]. A grid solver handled 3,000 candidates in 0.18 ms, and only about 120 labels fit on a 320x180 screen [V, S5].
14. **Clarity caps the item count before cost does.** A 200-item boss drop with 30 players cost 1.14 ms on the cheap path and 4.85 ms on the naive one; in software GL the cheap path hit 16.27 ms [V, S5]. Plan for about 200 visible ground items per screen [V, S5; I].

**Recommendation for Asterion** [I]. Monster corpses stay containers, full on arrival, with a loot line and a tier glint only for eligible looters. Bosses and deaths spill on a ring pattern with 400 ms arcs and a 40 ms stagger. Five tiers with shapes and sounds, beams for legendaries only. Labels on a hold key, capped at 32 by tier. One quick loot key over the 3x3, a 1 tile gold magnet after 400 ms, fly to bag on the server's answer. Top damage owns corpses for 15 s with the puller weighted 1.3; bosses use personal chests; player deaths use a blessing table and a 60 s priority window for the killer's group and the victim's party. §7 has the layers, §8 the Sandbox.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, wiki or article, or our own measurement [S5]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a single secondary source, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (release years, frame rates). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1 to 5) are author judgement, in this order: **Clarity · Delight · MMO fit · Fairness · Speed**.
- **Clarity** is how fast a player reads what dropped and whether it is theirs. **Delight** covers pixel art, motion, sound and anticipation. **MMO fit** is how it holds up with many players on one screen, a server and latency. **Fairness** is whether ownership, races and PvP stay honest and hard to grief. **Speed** is runtime cost on low-end web.
- **Speed follows the measurements** [S5]. 5 is server logic or cached blits; 4 needs care in crowds; 1 to 3 means per-frame text or blur.
- **Measured numbers are desktop Canvas2D numbers.** Trust ratios over milliseconds.
- Tiles are Asterion's 32 px unless stated. SPD, Terraria and the Sandbox use 16 px tiles, so Sandbox pixel sizes are half. Frames are 60 fps.

---

## 3. Generations: a timeline

**Gen 1: corpses, piles and ticks (1996–2003)**
- **1996** Diablo flips items in 13 frames at 20 Hz and puts one item per tile [K; V, S84]. **1997** Tibia and Ultima Online launch with corpse containers; ServUO corpses decay at 7 min [K; V, S74].
- **2000** Diablo II gives every item a drop sound on frame 12 and shows labels on Alt [K; V, S86, S89]. **2001** RuneScape runs on a 600 ms tick [K; V, S51].
- **2002** Ragnarok Online stages loot priority for the top three damage dealers [K; V, S65]. **2003** MapleStory drops belong to the killer for 15 s [K; V, S71].

**Gen 2: rolls, tags and personal loot (2004–2012)**
- **2004** World of Warcraft launches with free for all, round robin, master and group loot [K; V, S113]. **2005** Patch 1.7.0 adds the Need, Greed and Pass window [V, S115].
- **2009** Near misses light up the brain's win regions in fMRI [V, S141]. **2010** Realm of the Mad God colours its bags by the best item inside [K; V, S75]. **2012** WoW 5.0.4 adds area looting [V, S116]; Guild Wars 2 gives each contributor their own loot [K; V, S120]; "Juice it or lose it" at GDC Europe [V, S145].

**Gen 3: fewer, better drops (2013–2017)**
- **2013** BlizzCon presents Diablo III's Loot 2.0, "Less is more" [V, S96]; WoW's Timeless Isle (5.4) introduces untapped mobs [V, S112].
- **2014** OSRS PvP death piles show to the killer first for 1 min [V, S53]. **2015** Path of Exile 2.0.0 ships Lockstep against desync [V, S107, S108].
- **2016** WoW 7.0.3 lets up to 5 ungrouped players share a tag [V, S112]. **2017** Tibia's Winter Update brings Quick Looting [V, S40].

**Gen 4: personal rules, graves and keys (2018–2024)**
- **2018** WoW 8.0.1 makes personal loot the only mode [V, S113]. **2019** The Minecraft book dupe exploits a chunk that fails to save [V, S124].
- **2020** OSRS replaces PvM death piles with graves and Death's Office [V, S53]; Tibia caps stacked corpse looting at 30 [V, S41]. **Nov 2021** New World disables wealth transfers over a gold dupe [V, S122].
- **Jan 2022** OSRS ships loot beam models for RuneLite [V, S50]. **Feb 2022** OSRS loot keys [V, S57]. **Aug 2022** Albion gives black-zone corpses a 90 s priority window [V, S76]. **Sep 2022** Tibia gets sound after 25 years [V, S47].
- **May 2024** Diablo IV's Loot Reborn cuts drop volume [V, S97]. **Jul 2024** Tibia's Summer Update adds area looting [V, S42] and Dark and Darker slows enemy corpse looting [V, S83]. **2024** Kao and colleagues test juicy feedback on 1,699 players [V, S143].

**Gen 5: native filters and measured costs (2025–2026)**
- **Sep 2025** Diablo IV's design director says the smart pre-filter approach has hit its limit [V, S100]. **Feb 2026** Diablo II: Resurrected ships a native loot filter, date varies by source [V, S92, S93, S94].
- **Apr 2026** Diablo IV's loot filter arrives with Lord of Hatred [U, S98, S99]. **Jul 2026** GLoot 3.0.2 for Godot 4.4 [V, S151].
- **Nov 2026** Our loot benchmark [V, S5].

---
## 4. Technique profiles

There are eight families:

- **A.** Drop containers and spill styles
- **B.** Drop motion
- **C.** Rarity signalling
- **D.** Labels, filters and messages
- **E.** Pickup interaction
- **F.** Ownership and party rules
- **G.** Netcode and crowds
- **H.** Death drops

Each profile ends with ratings for **Clarity · Delight · MMO fit · Fairness · Speed** (1 = poor, 5 = excellent; author judgement). A to D are how a drop looks and sounds, E how it reaches the bag, F and G who may take it and how the server keeps that honest, and H what a player loses. Measured figures come from our benchmark [S5].

### Family A: Drop containers and spill styles

### A1. Corpse as container: one entity, full on arrival, a loot line in chat

*In plain words.* The monster's body is a bag. It arrives already holding the loot, the server prints what was inside, and the player opens it with a click.

*How it works (technical).*
- Canary's death order runs in one server step: blood splash, corpse added to the tile, `dropLoot()` fills it, `startDecaying()`, then the "Loot of X" message [V, S6]. A client never sees an empty corpse fill up.
- The message format is `"Loot of {}: {}"`. Clients above protocol 1200 get item names as `{itemId|name}` so they can colour them [V, S6, S7].
- Canary sends the loot line to every party member, not only the owner [V, S13]. Player corpses skip the line [V, S6].
- Map to Asterion [I]. Monster corpses stay containers. The server sends one corpse entity with a per-viewer "lootable" flag and a best-tier byte, which drives the glint in A3.

*Cost / performance.* One entity per kill. A Tibia ground add is 10 bytes of payload [V, S27]. Loot contents go only to the player who opens the corpse [V, S35]. Rendering is one sprite.

*Games that used it.*
- Tibia (Canary death order): https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp
- Ultima Online (ServUO corpse): https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs

*How it feels.* Calm in a crowd, but without a tier cue a legendary looks exactly like a rat.

*Risks.* No anticipation on screen. Spam-clicking a corpse that has not arrived yet feels like lag, so the corpse must appear at once [V, S3].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 5 · Fairness 4 · Speed 5

### A2. Ground spill on a fixed pattern: RO's cycle, MapleStory's row, Diablo's ring search

*In plain words.* Items jump out of the body and land on nearby tiles in a pattern the player learns, so a big drop spreads into a readable blob.

*How it works (technical).*
- rAthena puts the first item on the death cell, then cycles SE, W, N for the rest [V, S66]. Blocked cells fall back to a free cell within 1 cell [V, S67]. Each item gets a sub-cell jitter of 3, 6, 9 or 12 on a 16-step grid, so stacked items do not overlap exactly [V, S67].
- Cosmic MapleStory alternates right and left in 25 px steps from the mob (40 px for "explosive" mobs) and snaps each drop to a foothold [V, S70].
- Diablo I allows one item per tile. If the tile holds an item, a wall, a monster or a player, it searches square rings outward up to radius 49 [V, S84].
- Map to Asterion [I]. Use Diablo's one-item-per-tile ring search for boss drops and death piles, so every item stays clickable at 32 px. Stackables merge on the same tile (G5).

*Cost / performance.* One entity per item, so bytes and draws grow with drop size. A 12-item spill costs about 180 B per viewer against about 17 B for one corpse [I, note 06]. In our benchmark 200 static items cost 0.17 ms over baseline on the M4 GPU and 3.2 ms in software GL [V, S5].

*Games that used it.*
- Ragnarok Online (rAthena scatter): https://github.com/rathena/rathena/blob/master/src/map/mob.cpp
- Diablo I (devilutionX ring search): https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp

*How it feels.* The best "explosion" in the genre; every item is a small event.

*Risks.* Every spilled item is a separate thing to own, label, cap, race for and despawn.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 3 · Fairness 3 · Speed 3

### A3. One bag, one colour: RotMG bags, Gungeon chests and a corpse glint

*In plain words.* A single container on the ground whose colour already tells you the best thing inside.

*How it works (technical).*
- Realm of the Mad God bag colours rank by best content, low to high: brown (public), pink, purple, cyan, then red and white at the top, with boosted bags above all [V, S75]. Each bag lasts 60 s and adding or removing items does not reset it [V, S75].
- Enter the Gungeon chests show quality before opening: brown D, blue C, green B, red A, black S [V, S137]. Guild Wars 2 puts a wooden chest over a corpse for rare drops and a steel chest for exotic and ascended [V, S120].
- Canary already sends a per-viewer `LootHighlight` byte when a corpse is non-empty and the viewer may open it [V, S7].
- Map to Asterion [I]. Extend the highlight into a 2-frame glint in the colour of the best item's tier, drawn only for players allowed to loot. Others see a plain corpse.

*Cost / performance.* One sprite swap and one byte. A halo sprite costs about 2 µs per item on the M4 GPU [V, S5].

*Games that used it.*
- Realm of the Mad God: https://www.realmeye.com/wiki/loot-bag-types-and-contents/162
- Enter the Gungeon: https://enterthegungeon.wiki.gg/wiki/Chests

*How it feels.* The "purple bag" moment. Players name bags by colour, and RotMG and OSRS slang both turned a colour into a word for joy [V, S75; U, note 01].

*Risks.* One colour hides the rest of the haul. Reusing a tier colour for another meaning breaks it, as Diablo Immortal's orange rune beams did [V, S101].

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 4 · MMO fit 5 · Fairness 4 · Speed 5

### A4. Direct to bag: autobank, toasts and when skipping the world is right

*In plain words.* No object appears. The item goes straight into the inventory and a short toast or chat line says so.

*How it works (technical).*
- Canary's `autoBank` sends dropped coins straight to the bank; the loot pouch holds up to 2,000 items [V, S9].
- Canary's autoloot runs on kill only when the corpse is reachable by path within 1 tile, and reward bosses are excluded unless the player picks "all" [V, S6, S19].
- Diablo Immortal picks up gold automatically by default [V, S102]. Terraria merges nearby coins and converts 100 copper to 1 silver [V, S132].
- Map to Asterion [I]. Use direct-to-bag for gold the player owns and for quest items. Keep the corpse in the world so others still see a kill happened, and play the fly-to-bag (E4) from the corpse.

*Cost / performance.* Zero world entities, one inventory update. The cheapest option for crowds.

*Games that used it.*
- Tibia lineage (Canary autoloot): https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/data/scripts/talkactions/player/auto_loot.lua
- Diablo Immortal: https://ginx.tv/en/diablo/diablo-immortal-auto-pick-up-items-enable

*How it feels.* Smooth and forgettable. Nobody remembers a toast.

*Risks.* It removes the moment entirely if used for everything. With a full bag it needs a fallback (E5).

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 2 · MMO fit 5 · Fairness 4 · Speed 5

### Family B: Drop motion

### B1. The pop arc: 400 ms, a 20 px apex and the sound on landing

*In plain words.* The item leaves the body, rises a little and lands, all in under half a second.

*How it works (technical).*
- Shattered Pixel Dungeon: `DROP_INTERVAL = 0.4f`, start speed 100 px/s up, gravity 500 px/s², so the apex is 10 px at 200 ms on a 16 px tile [V, S125]. On a 32 px tile that is 20 px [I].
- Diablo I: most flips are 13 frames at one 50 ms tick each (650 ms), gold 10 frames, the longest 20 [V, S84]. The drop sound plays at frame `(n - 1) / 2`, about 300 ms in [V, S84]. Items cannot be clicked during the flip [V, S84].
- Diablo II: 300 of 306 weapons and all 217 armours play their sound on frame 12, potions on 14 and scrolls on 10, at 25 fps [V, S86, S87]. That is 480 ms [I].
- Map to Asterion [I]. 400 ms, apex 20 px, height `4 * h * t * (1 - t)` on the sprite only. The server places the item at t = 0, so the arc is pure presentation. Unlike Diablo, accept a pickup at any point and cut the arc short, because players spam-click [V, S3].

*Cost / performance.* Math is free next to the blit. A pop arc with a ground shadow is two blits: 1,000 arcing items cost 2.26 ms over baseline on the M4 GPU, 8.14 ms throttled and 31.6 ms in software GL [V, S5].

*Games that used it.*
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java
- Flare: https://github.com/flareteam/flare-game/tree/master/mods/fantasycore/animations/loot

*How it feels.* A small hop says "this came out of that". At 400 ms the drop is a beat of the kill, not a wait [I].

*Risks.* A long arc in front of a spam-click becomes input lag. Terraria's physics toss reaches 2.5 tiles of height, which suits a side view and scatters items too far top-down [I, note 10].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 5 · MMO fit 5 · Fairness 4 · Speed 5

### B2. Shadow and landing: a floor shadow, a material sound and no bounce

*In plain words.* A dark oval stays on the floor while the item rises, so the eye reads height. When it lands, it makes the sound of what it is.

*How it works (technical).*
- SPD draws the shadow as a separate quad 1.0 x 0.25 of the sprite at 60% black and keeps it on the floor during the arc [V, S125].
- Diablo I has about 20 drop sounds for 43 item graphics (armour, axe, potion, ring, scroll, gold) [V, S84]. Diablo II gives all 33 runes one sound, so El and Zod sound the same [V, S86].
- No source in this study uses a bounce [V, S125, S84, S129]. Bounce count, restitution and landing squash remain uncited [I, note 10].
- Map to Asterion [I]. Shadow always. Sound by material, pitch jitter 0.9 to 1.1. Bounce off by default, with an optional single 4 px hop under 120 ms for the top two tiers only.

*Cost / performance.* The shadow is the second blit counted in B1. Resting items can bake the shadow into the sprite, so only fresh drops pay it [I, note 09].

*Games that used it.*
- Diablo II (d2data drop sound frames): https://github.com/blizzhackers/d2data/tree/master/json
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java

*How it feels.* The material is audible before the label is read. D2's rune sound became famous because a type cue turned into a value cue [I, note 02].

*Risks.* Many items landing on one tick stack into one clang. B3 spreads them.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 5 · Fairness 4 · Speed 5

### B3. Big drops: stagger, scatter order and stack-size sprites

*In plain words.* A boss drop comes out one item after another, best item last, and bigger piles of coins look bigger.

*How it works (technical).*
- No source gave a stagger value [I, notes 02 and 10]. Diablo drops one item per call and Flare one per tile [V, S84, S127].
- Flare picks a different flip animation by stack size, so 5, 25 and 100 coins each look different [V, S128]. Minecraft draws 1 to 5 copies of a stack: 1, 2 to 16, 17 to 32, 33 to 48, 49 and up [V, S134].
- Map to Asterion [I]. 40 ms between items, capped so the whole sequence lasts at most 600 ms. Order the sequence by tier ascending so the best item lands last and its sting closes the drop. Coins use 3 sprites (1, few, pile). Sounds merge per tick, so 20 coins on one tick play one heavier cluster sound (C3).

*Cost / performance.* No extra draws. It spreads the arc cost over time. Our boss scene pops items over 40 frames and keeps 200 items at 1.14 ms per frame on the GPU [V, S5].

*Games that used it.*
- Flare (stack-size flips): https://github.com/flareteam/flare-engine/blob/master/src/LootManager.cpp
- Minecraft (stack copies): https://minecraft.wiki/w/Item_(entity)

*How it feels.* A short roll instead of one clang, ending on the best item [V, S150; I].

*Risks.* A 30-item sequence at 40 ms is 1.2 s, too long for a crowd, hence the 600 ms cap. Tier ordering leaks the best item's position to watchers, which is harmless if they cannot take it.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 3 · Fairness 4 · Speed 4

### Family C: Rarity signalling

### C1. Five tiers in the shared colour order, readable on grass

*In plain words.* Common, uncommon, rare, epic, legendary, in colours players already read without a tutorial, plus a second cue for each.

*How it works (technical).*
- Borderlands: white, green, blue, purple, orange [V, S110]. Diablo II: white normal, blue magic, yellow rare, orange crafted, green set, gold unique [V, S88].
- Terraria lists 16 rarities with hex values, from grey `#828282` and white `#FFFFFF` to purple `#B428FF`, and its wiki warns that green and lime, and orange and light red, look alike [V, S131].
- D2R players report the unique gold is hard to see on the ground [V, S91].
- Map to Asterion [I]. Common `#E8E8E8`, uncommon `#4CE04C`, rare `#4C9BFF`, epic `#B45CFF`, legendary `#FF9A1F`, all with a 1 px dark outline. Shape ladder: common none, uncommon corner pixels, rare full outline, epic outline plus sparkle, legendary beam. These hex values are our picks for green and brown floors.

*Cost / performance.* A palette swap or a second atlas row. Free.

*Games that used it.*
- Terraria: https://terraria.wiki.gg/wiki/Rarity
- Diablo II: https://classic.battle.net/diablo2exp/items/magic.shtml

*How it feels.* Instant. Players expect orange to mean "drop everything".

*Risks.* Pastels wash out on green floors at 32 px. More than about 6 tiers make neighbours look alike [V, S131].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 3 · MMO fit 4 · Fairness 4 · Speed 5

### C2. Glow, beams and pings: short for everyone, persistent for the owner

*In plain words.* A column of light over a great drop, and a mark on the minimap, so it is found from across the screen.

*How it works (technical).*
- Diablo III legendaries arrive with a loud clang, an orange beam (green for sets) and a star on the minimap [V, S95].
- PoE's `PlayEffect <colour> [Temp]` shows a beam only while the item drops, and `MinimapIcon` pairs 11 colours with 12 shapes [V, S103].
- OSRS shipped four loot beam models in January 2022 for RuneLite; the official client does not use them, and RuneLite draws beams only for its high tier and up, off by default [V, S50, S60, S63].
- Idle glow, cheaper cousin of the beam. SPD pulses a 60% tint on a 2 s triangle wave as a vertex colour, not a shader [V, S125]. Minecraft gives each item a random bob phase so piles never move in lockstep [V, S134].
- Map to Asterion [I]. A halo-sprite pulse for rare and up, 2 s cycle, phase from the item ID. Beams for legendary only, a 1 x 3 tile additive sprite (32 x 96 px). Strangers see it for 2 s after landing. The owner sees it until pickup, plus an edge-of-screen chip if it lands off screen.

*Cost / performance.* A halo sprite costs about 0.4 ms per 200 items on the M4 GPU; `shadowBlur` glow cost 20.1 ms for the same 200, the largest trap in this study [V, S5]. 300 beams cost 0.35 to 0.47 ms by every method; a fresh gradient per frame doubled the cost under throttle (1.41 against 0.65 ms) [V, S5]. A busy screen shows under 20 [I, note 09].

*Games that used it.*
- Diablo III: https://di.diablowiki.net/Legendary
- Old School RuneScape: https://oldschool.runescape.wiki/w/Loot_beam

*How it feels.* The biggest cue in the genre, because a tall beam escapes floor clutter.

*Risks.* Persistent beams from 10 other players' drops are noise. Beams that fire every few kills stop meaning anything, which is why Loot 2.0 made legendaries rarer [V, S96].

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 5 · MMO fit 3 · Fairness 4 · Speed 5

### C3. Tier sounds: type sounds, value stings and voice caps

*In plain words.* Every item lands with the sound of its material. Only the great ones add a sting, and only your own.

*How it works (technical).*
- PoE filters offer `PlayAlertSound <id 1-16> <volume 0-300>` (default 50), a positional variant, custom files and `DisableDropSound` [V, S103]. NeverSink plays every alert at 300 [V, S104]. Players report 300 as too loud and drop to 100 [U, note 07].
- Tibia had no sound from 1997 until client 13.00 in September 2022, and the chat line did the job [V, S47, S46].
- Godot web export defaults to Sample playback, which drops audio effects [V, S153]. `pitch_scale` is a rate change and still works [I, note 07].
- Map to Asterion [I]. Landing sound per material, 80 to 200 ms. A sting per tier for rare and up, own loot only, 400 to 900 ms. Party loot at -6 dB, strangers silent except legendary at -12 dB. An 8-voice loot pool, priority mine, party, others, then tier, oldest low-tier voice killed first. Duck the loot bus 6 dB for 300 ms on a legendary sting, in code.

*Cost / performance.* Not measured here. The combat juice benchmark measured 128 hit sounds per second at 3.6% of a core [V, S3].

*Games that used it.*
- Path of Exile: https://www.pathofexile.com/item-filter/about
- Diablo III: https://www.pcworld.com/article/465972/scoring_sanctuary_the_sound_design_of_diablo_iii.html

*How it feels.* A legendary sting through a busy fight is the best moment in the genre [V, S95]. Juicy audio works because designers save it "for the special moments" [V, S144].

*Risks.* 30 players' alerts at full volume. Sound must never be the only channel, since Tibia players looted silently for 25 years [V, S46].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 5 · MMO fit 3 · Fairness 4 · Speed 5

### C4. Honest tells: effect size follows tier, no fake near misses

*In plain words.* The bigger the reward, the bigger the show, and the show never lies about what landed.

*How it works (technical).*
- Kao and colleagues (CHI 2024, n = 1,699) found that success-dependent feedback raised effectance, competence and curiosity; amplification alone reduced them; curiosity was the only predictor of playtime [V, S143].
- In Larche and colleagues' study a 2 s shake raised skin conductance before the reveal, rarer boxes gave larger responses, and the pause after the reveal grew from 4.91 s for rare to 5.70 s for legendary [V, S140].
- Clark and colleagues (2009, 15 volunteers) found that near misses activated reward regions, felt worse than misses and raised the desire to play [V, S141]. Zagal and colleagues class such designs as dark patterns [V, S142].
- "The Reward for Luck" (CHI 2022, 35 systems, 14 players) found that the effort spent sets how players expect a reward to be presented [V, S146].
- Map to Asterion [I]. Each tier gets a fixed effect budget: common a thud, uncommon a pitch-up, rare glow, epic glow plus sting, legendary beam plus sting plus ping. A tier tell is never wrong. No reels, no rare flash before a common lands. Leave about 1 s for the player's own pause on a great drop; do not auto-close windows during a sting.

*Cost / performance.* It lowers cost, because most drops get the cheapest presentation.

*Games that used it.*
- Diablo III Loot 2.0: https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript
- Genshin Impact and Wuthering Waves colour tells: https://samurai-gamers.com/wuthering-waves/wuwa-wish-rarity-indicator-guide/

*How it feels.* Trustworthy. The player learns that a beam always means something.

*Risks.* Designers love juice and add it to everything. Kao's data says that hurts [V, S143].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 5 · Fairness 5 · Speed 5

### Family D: Labels, filters and messages

### D1. The loot message and the party log

*In plain words.* A chat line lists what dropped. In a party everyone sees it, and a tracker turns a hunt into numbers.

*How it works (technical).*
- Canary: "Loot of a dragon: ..." with coloured item names for new clients, sent to the whole party [V, S6, S13].
- Quick loot summarises: "You looted N corpses.", "You looted 120 gold", "...but you only looted some of the items" [V, S8].
- Tibia's Party Hunt Analyser shows loot, supplies and balance per player, and TibiaMaps turns the pasted output into who pays whom [V, S44, S45].
- Map to Asterion [I]. One line per kill in a Loot tab, item names in tier colour, the party sees party kills, and a session tracker with a "split" button.

*Cost / performance.* Text in a log. The line is built client-side from item IDs, so the wire carries IDs only [I].

*Games that used it.*
- Tibia (Canary message): https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp
- Tibia (loot splitter): https://tibiamaps.io/tools/loot

*How it feels.* Quiet, but Tibia players found their joy there for 25 years [I].

*Risks.* Chat spam in a fast hunt. Merge consecutive lines from the same monster type.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 2 · MMO fit 5 · Fairness 4 · Speed 5

### D2. Labels on demand: a hold key, owner first, a cap sorted by tier

*In plain words.* Item names appear only when the player asks, and when too many compete, the best ones win.

*How it works (technical).*
- Diablo II shows ground labels while Alt is held [V, S89]. D2R caps ground labels at 32, and players say important drops get buried [V, S90].
- PoE2 toggles labels with Z and holds them with Alt [V, S111]. Players report items "vanishing" when highlighting is off [U, note 03].
- PoE players report labels piling up until a click on one label picks up a different item underneath [U, S106].
- Map to Asterion [I]. No always-on labels. Hold a key (or a touch toggle) to show labels for items you may take, capped at 32 and sorted by tier, then own, then distance. Hide labels, never sprites. Hit-test the label rectangle, not the sprite under it.

*Cost / performance.* Labels cost more than items. 200 labels drawn glyph by glyph cost 2.15 ms over baseline on the M4 GPU and 30.3 ms in software GL; a shared label atlas cost 0.18 and 3.1 ms; `fillText` cost 0.45 and 26.7 ms [V, S5]. DOM spans cost 1.8 to 3.0 ms of main thread at 200 labels and double the canvas path from 1,000 up [V, S5].

*Games that used it.*
- Diablo II: https://classic.battle.net/diablo2exp/basics/controls.shtml
- Path of Exile 2: https://game8.co/games/Path-of-Exile-2/archives/488429

*How it feels.* Clean by default, informative on demand. Text at 32 px is the main source of clutter.

*Risks.* A cap without priority is the D2R bug. Hiding items along with labels is the PoE2 complaint.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 4 · Fairness 4 · Speed 4

### D3. Label declutter: tile stacks, a sideways push and a spatial grid

*In plain words.* When labels collide, move them up or sideways, and hide the losers.

*How it works (technical).*
- RuneLite stacks labels on the same tile 15 px apart, 20 units above the ground, and culls past about 19.5 tiles; labels on adjacent tiles may still overlap [V, S61].
- DevilutionX moves a label sideways by the other's width while their rows overlap, with a 4 px horizontal and 2 px vertical border and a 13 px label height [V, S85]. Its licence forbids commercial use, so reimplement from the description [V, S85].
- Our solver sorts by tier, tries the natural spot and up to 7 steps of 10 px upward, then hides; a grid of 32 x 16 px cells cut overlap checks 12 times [V, S5].
- Map to Asterion [I]. Greedy vertical stacking on a grid, priority tier, then own, then distance. Run every frame. Show "+N" over a tile when labels were hidden.

*Cost / performance.* With 3,000 candidates the grid solver took 0.18 ms on the M4 and 1.16 ms throttled; the naive version took 0.93 and 5.65 ms [V, S5]. Only 118 of 3,000 labels fit on a 320x180 screen, so above about 100 candidates the solver is already a filter [V, S5].

*Games that used it.*
- Old School RuneScape (RuneLite): https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsOverlay.java
- Diablo (devilutionX labels): https://github.com/diasurgical/DevilutionX/blob/master/Source/qol/itemlabels.cpp

*How it feels.* Invisible when it works. When it fails, the player clicks the wrong item.

*Risks.* Labels that jump between frames.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 4 · Fairness 4 · Speed 4

### D4. A tier style table and a simple native filter

*In plain words.* All loot presentation lives in one table the designers edit, and players get a few switches to hide junk.

*How it works (technical).*
- A PoE rule sets font size 1 to 45, text, border and background colours, an alert sound, a beam and a minimap icon, or `Hide` [V, S103].
- NeverSink's PoE2 regular filter has 5,308 lines, 434 Show and 18 Hide blocks, and font sizes from 18 (minimised) to 45 [V, S105]. Its top currency style is font 45, red text on a white fill, alert 6 at 300, a red beam and a red star [V, S105]. Hidden items keep a font-18 label and stay pickable [V, S105].
- D2R's native filter reads a plaintext `Filter.d2lf`, checks rules in order and takes the first match [V, S92, S93]. Diablo IV's filter launched with Lord of Hatred, reportedly with a peek hotkey [U, S98, S99].
- Map to Asterion [I]. One `LootTierStyle` Resource per tier: colours, outline, glow, beam and its lifetime, sound, minimap icon, label default. The server sends item ID and tier. Players get three presets (show all, hide junk, rare and up) plus "minimum tier for sound, label and beam". No scripting language.

*Cost / performance.* A lookup per item. A Hide rule removes the label and its blit, and the item sprite stays (D2).

*Games that used it.*
- Path of Exile (NeverSink): https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2
- Diablo II: Resurrected: https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/

*How it feels.* Players feel in control. A good default makes the filter invisible.

*Risks.* A filter that is required is a symptom of too many drops. Diablo III and IV cut volume first [V, S96, S97].

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 3 · MMO fit 4 · Fairness 4 · Speed 5

### Family E: Pickup interaction

### E1. Click, open, drag: a 1 tile reach and walk then retry

*In plain words.* Click a corpse or item. If it is far, your character walks there and the grab happens on arrival, with no second click.

*How it works (technical).*
- TFS `playerMoveItem` checks the action cooldown, re-resolves the item at its position, compares its sprite ID, checks reach within 1 tile, then moves it [V, S22]. Out of reach, the server pathfinds, auto-walks and retries after `RANGE_MOVE_ITEM_INTERVAL = 400` ms; with no path the player reads "There is no way." [V, S22, S23].
- Canary quick loot uses `areInRange<1, 1, 0>` and retries after 300 ms [V, S8]. Both values are right for their codebases.
- A request during the 200 ms action cooldown is rescheduled for the next action time, not dropped [V, S20, S22].
- Map to Asterion [I]. Reach 1 tile (Chebyshev). Walk then retry 300 ms. Queue presses during cooldown. Touch gets the same path from a tap.

*Cost / performance.* Server logic only. A container move sends remove and add to spectators within 1 tile of the open container, at most 9 players [V, S35].

*Games that used it.*
- Tibia (TFS move order): https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- Ragnarok Online (rAthena reach): https://github.com/rathena/rathena/blob/master/src/map/pc.cpp

*How it feels.* Forgiving. One click from range always works, so spam-clicking is never punished [I, note 08].

*Risks.* Dragging items one by one is the click load that quick loot exists to remove.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 5 · Fairness 5 · Speed 5

### E2. Quick loot and loot nearby: one key, 3x3 tiles, 30 corpses

*In plain words.* One key loots every corpse you may open in the tiles around you, into the right bags, and tells you what it left.

*How it works (technical).*
- Canary has four levels on one function: quick loot one corpse, loot all corpses on a tile, loot nearby in the 3x3 around the player, and autoloot on kill, each capped at `quickLootMaxCorpses = 30` [V, S8, S9]. Quest corpses with action or unique IDs are skipped [V, S8].
- Items route to about 28 managed categories, falling back to the main backpack [V, S18, S8]. Each player keeps a whitelist or a skip list on the server [V, S8].
- OSRS mobile players asked for ground item highlighting more than anything else [V, S59]. Game Accessibility Guidelines list "avoid repeated inputs" as an intermediate motor guideline [V, S148]. Canary can gate autoloot behind VIP and remote quick loot behind premium [V, S9, S8].
- Autoloot on kill is off by default in Canary and skips reward bosses [V, S9, S19]. OSRS's Bonecrusher removes one chore as an earned item [V, S58]. MapleStory sells pet range upgrades from 125 to 275 px per side [V, S73].
- Map to Asterion [I]. E loots nearby (3x3, cap 30). Holding E repeats at the action rate. Autoloot is an option for regular monsters, bosses stay manual, and helpers are earned items, not pets that path through crowds. On touch, a big loot button. Never paywall it.

*Cost / performance.* One request per press instead of one per item. The 3x3 reach matches pickup reach, so no new rule [I, note 03].

*Games that used it.*
- Tibia (Canary quick loot): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
- World of Warcraft: https://warcraft.wiki.gg/wiki/Area_Looting

*How it feels.* Huge relief in a box hunt. Pair it with the loot line and glint so the "did it drop?" moment survives (A3, D1).

*Risks.* Looting in combat can feel rude in WoW [V, S116]. The 30 cap must report what it skipped.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 3 · MMO fit 5 · Fairness 5 · Speed 5

### E3. Magnet and walk-over pickup for currency

*In plain words.* Coins near you slide into you after a short beat. Walking over them works too.

*How it works (technical).*
- Flare auto-picks only currency, within 1 tile, never items the hero dropped, never mid-flight [V, S127, S128].
- Minecraft's pickup box reaches 1 block, with a 500 ms delay on normal drops and 2 s on thrown ones [V, S134].
- Terraria grows the player rectangle by 42 px (2.6 of its 16 px tiles) and pulls at 0.45 px per tick² up to 4 px per tick, 240 px/s [V, S133]. Stardew's base is 2 of its 64 px tiles [V, S135].
- Enter the Gungeon pulls money only out of combat [V, S138].
- Map to Asterion [I]. Gold only, owner only, 1 tile, starting 400 ms after landing, never during PvP combat. The server grants it on its tick, then the client pulls the coin to the player over 150 ms with ease-in. Rejected grabs fade in place.

*Cost / performance.* Not a client cost. Brute force against 30 players took 0.10 ms for 3,000 items on the M4; a grid halved it [V, S5]. On a server it is about 90,000 checks per tick per screen at that extreme [I, note 09].

*Games that used it.*
- Flare: https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt
- Terraria (tModLoader grab range): https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/Player.cs.patch

*How it feels.* The roguelite hoover is pure pleasure. The 400 ms beat lets the coin be seen landing first.

*Risks.* A magnet that pulls across a fight steals focus and breaks PvP fairness. A client-side magnet desyncs, so it must follow the server.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 5 · MMO fit 3 · Fairness 3 · Speed 5

### E4. Fly to bag, a bag bump, counters and coin streak pitch

*In plain words.* After a pickup, the item flies to the bag icon, the bag nods, a "+12" floats up, and each coin in a streak sounds a little higher.

*How it works (technical).*
- SPD flies picked items to the toolbar in 500 ms on a straight line, shrinking by `sqrt(p)` [V, S126]. SPD shows "+N" gold over the hero [V, S125].
- Mindustry's item transfer lasts 12 ticks (200 ms) with cubic easing and a sideways swing up to 10 px with a random sign, so parallel transfers fan out [V, S130].
- A Godot 4 snippet steps coin pitch by 0.07 per pickup up to 14 steps and resets after 1,200 ms, with 4 round-robin voices [V, S149].
- Map to Asterion [I]. 250 ms ease in-out with a ±16 px side curve, started by the server's "added" message. Bag icon 1.0 to 1.15 to 1.0 over 120 ms. More than 3 items in one message fly 3 sprites and show "+N". Coin pitch rises 1 semitone (rate x1.0595) per pickup inside 1.2 s, capped at 8 steps, ±0.3 semitone jitter.

*Cost / performance.* 1,000 fly tweens cost 1.03 ms over baseline on the M4 GPU, the same as static blits [V, S5]. Only the looter sees the fly, so crowds pay nothing [I].

*Games that used it.*
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/ui/Toolbar.java
- Mindustry: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java

*How it feels.* The item visibly lands where it went. The pitch climb turns a pile of coins into a little tune.

*Risks.* 500 ms flights feel slow in bursts. A fly started on the click that later bounces back reads as a dupe (G3).

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 5 · MMO fit 4 · Fairness 4 · Speed 5

### E5. Bag full and partial loot: the item stays, the message is exact

*In plain words.* If it does not fit, it stays where it was, and you are told exactly why and what was left.

*How it works (technical).*
- Canary leaves items in the corpse and prints "Attention! The container for {category} is full." or "...too heavy for you to carry." [V, S8].
- The loud style shows only if the last warning was over 15,000 ms ago; repeats go to a quieter line [V, S8].
- Terraria's Void Bag catches overflow with purple pickup text [V, S139]. AzerothCore can mail overflow, except unique items [V, S119].
- Map to Asterion [I]. Item stays in the corpse or on its tile. Red flash on the bag icon, a dull thud, a 4 px hop and settle on the item, and the exact message with the 15 s throttle. Never spill overflow onto a shared tile, where it becomes public.

*Cost / performance.* Server logic and one message.

*Games that used it.*
- Tibia (Canary messages): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
- Terraria: https://terraria.wiki.gg/Void_Bag

*How it feels.* Honest. The player never wonders where something went.

*Risks.* Ground overflow in a shared area is griefing fuel.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 2 · MMO fit 5 · Fairness 5 · Speed 5

### Family F: Ownership and party rules

### F1. Top damage owns, for a short window

*In plain words.* Whoever did the most damage owns the corpse for a few seconds, together with their party. Then anyone may take it.

*How it works (technical).*
- Canary and TFS set the corpse owner to the top damage dealer, or the master of a top-damage summon; last hit does not matter [V, S10, S25].
- The owner lives on the first corpse stage only. `Item::setID` removes it on every decay transform except reward corpses [V, S11, S26]. That stage is 10 s for dragon, rat, orc and spider corpses [V, S12].
- rAthena adds 30% of total damage to the first attacker's ranking, "Officially" per its comment [V, S65].
- rAthena stages ground loot 3 s for the top dealer, 2 s more adding the second, 2 s more adding the third; MVPs 10 + 10 + 2 s [V, S65]. With item share on, party members inherit the best online rank [V, S68].
- Map to Asterion [I]. Top damage with the first attacker's damage weighted 1.3. Owner window 15 s for monster corpses, separate from the rot timer, then anyone with 10% of the damage until 20 s, then public. Non-owners see a padlock with "opens to you in 4 s".

*Cost / performance.* One owner ID and one deadline per corpse. An integer compare [I, note 04].

*Games that used it.*
- Tibia (Canary owner): https://github.com/opentibiabr/canary/blob/main/src/creatures/monsters/monster.cpp
- World of Warcraft (tagging): https://warcraft.wiki.gg/wiki/Tap

*How it feels.* Fair enough in Tibia, where 10 s is a soft lock. On web and mobile latency 10 s is tight, hence 15 s [I, note 04].

*Risks.* Top damage lets a high level out-damage the puller. The first-attack weight answers that.

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 2 · MMO fit 5 · Fairness 3 · Speed 5

### F2. Private then public: hide, grey, or show and block

*In plain words.* For a while only the owner can see or take the drop. Then it opens to everyone, and the timer is visible.

*How it works (technical).*
- OSRS hides drops from others for 100 ticks (60 s). Tradeables then show to everyone for 120 s more, 180 s in all; untradeables stay private for 180 s [V, S48, S49].
- The OSRS item packet carries `timeUntilPublic`, `timeUntilDespawn` and an ownership type [V, S64]. RuneLite reads these and draws the pie [V, S62, S61].
- Canary shows non-owners a plain corpse and blocks the open [V, S7, S21]. Cosmic MapleStory sends the owner ID so the client can grey items [V, S71].
- Map to Asterion [I]. Show and mark, never hide, for monster corpses. A grey "taken" corpse teaches players what others got. For spilled ground items, 60 s private, then public until 180 s, with the timers in the add packet.

*Cost / performance.* Hiding saves packets to non-owners during the window [I, note 04]. Two 16-bit timers add 4 bytes per item [I, note 01].

*Games that used it.*
- Old School RuneScape: https://oldschool.runescape.wiki/w/Drops
- Old School RuneScape (RuneLite pie): https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsPlugin.java

*How it feels.* "If I can see it, I can take it" is the clearest rule in this study. Hiding can make a group fight feel empty [I, note 04].

*Risks.* Players without the timer cannot tell private from public and blame the game.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 2 · MMO fit 4 · Fairness 4 · Speed 5

### F3. Party loot modes, and why WoW cycled through them

*In plain words.* Who in a group gets what: anyone, turns, rolls, a leader, or each their own.

*How it works (technical).*
- Classic WoW: free for all, round robin ("a savvy player can manipulate the order"), master loot, group loot with an Uncommon threshold, need before greed; gold always splits evenly [V, S113].
- Master loot "gives the Master Looter a lot of power to abuse" [V, S114]. Before patch 1.9 players typed /roll by hand, the classic ninja tactic [V, S115].
- WoW cut to personal loot only in 8.0.1 (2018) and brought group loot back in 10.0.0 [V, S113]. Critics said the removal hurt guilds [V, S118].
- FFXIV players describe a 300 s Need, Greed and Pass window per item [U, S121]. rAthena has a round robin share mode [V, S69]. Tibia has one mode, where any member opens any member's corpse [V, S14].
- Map to Asterion [I]. Default Tibia's shared open. A leader option of round robin for items rare and up. No rolls on normal mobs; a roll window breaks hunt pace.

*Cost / performance.* Server rules. Round robin needs one counter per party.

*Games that used it.*
- World of Warcraft: https://warcraft.wiki.gg/wiki/Loot
- World of Warcraft (master looter): https://warcraft.wiki.gg/wiki/Master_looter

*How it feels.* Each mode fails in a known way, rewarding fast clickers, ninja needs or ninja masters.

*Risks.* A 300 s roll timer in a Tibia-paced hunt. Mode complexity in the UI.

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 3 · MMO fit 3 · Fairness 3 · Speed 5

### F4. Personal loot and boss reward chests

*In plain words.* For a big shared kill, every contributor gets their own private loot, scaled by what they did.

*How it works (technical).*
- Guild Wars 2: each participant loots the body; full credit needs about 5 to 10% of the enemy's health; the loot "is unique to the player" [V, S120].
- Canary scores each boss participant as the mean of their share of damage dealt, damage taken and healing. The loot factor is `1 / n^(1/3)` scaled by how far the player beats the expected `1 / n`; unique items roll only for the top score [V, S15].
- Reward corpses keep their owner logic across decay [V, S11]. Each scored player gets a personal container, even offline [V, S15].
- WoW lets group members trade bind-on-pickup instance drops for 2 hours [V, S117].
- Map to Asterion [I]. Personal reward chests for bosses with Canary's score, a 2 hour trade window inside the party, and a 600 ms reveal per chest (the boss earned a ceremony [V, S146]).

*Cost / performance.* Bandwidth per viewer stays flat, since each client sees only its own chest; server memory grows with participants [I, note 04].

*Games that used it.*
- Guild Wars 2: https://wiki.guildwars2.com/wiki/Loot
- Tibia (Canary reward chest): https://github.com/opentibiabr/canary/blob/main/data/scripts/systems/reward_chest.lua

*How it feels.* No ninjas, no races, no drama. Also no "steal" story, which is the right trade for bosses.

*Risks.* Item inflation, answered by the `1 / n^(1/3)` factor. Personal loot everywhere would gut the PvP economy.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 3 · MMO fit 4 · Fairness 5 · Speed 4

### Family G: Netcode and crowds

### G1. One authoritative move: request, re-resolve, check, move, broadcast

*In plain words.* The client asks. The server finds the item again, checks every rule, moves it, then tells everyone who can see it.

*How it works (technical).*
- TFS runs every item move on one dispatcher thread [V, S30]. It re-resolves the thing at the position, rejects it if the sprite ID differs (so a stale click cannot grab whatever slid into that slot), checks reach and line of sight, then calls `internalMoveItem` [V, S22].
- Ownership is checked when the corpse is opened [V, S24]. Canary re-checks owner rights per corpse at execution time and holds a per-player lock during quick loot [V, S8].
- Ground changes go only to players who can see the tile: add `0x6A`, update `0x6B`, remove `0x6C` [V, S27]. OTClient has no rollback; it applies what the server sends [V, S36].
- Failures go back as a status line such as "Sorry, not possible." [V, S22].
- Map to Asterion [I]. Address items by server GUID, not stack slot. Check, in order: exists and still on the ground, may this player loot it now, reach, fits the bag. Then commit the move, reply, broadcast.

*Cost / performance.* One request and one broadcast per pickup. Server logic only.

*Games that used it.*
- Tibia (TFS): https://github.com/otland/forgottenserver/blob/master/src/game.cpp
- Tibia (OTClient apply): https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp

*How it feels.* Slow but honest in Tibia. Every visible change is real.

*Risks.* Checking ownership after the move, or broadcasting before the commit, creates ghosts and dupes. §7 orders the steps.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 5 · Fairness 5 · Speed 5

### G2. Races: first packet wins, or tick batches with a rotating order

*In plain words.* Two players grab the same coin. The server picks one by a rule, and the rule should not favour low ping.

*How it works (technical).*
- TFS takes the first request that reaches its single logic thread; the loser fails the re-resolve and gets "Sorry, not possible." [V, S22, S30].
- OSRS collects actions per 600 ms tick and processes players by PID, lowest first; the lower PID wins a same-tick grab, and PIDs reshuffle every 100 to 150 ticks (60 to 90 s), faster on PvP worlds [V, S51, S52].
- Map to Asterion [I]. Collect pickup requests for one 100 ms tick. Order them by a rank that rotates every 60 s. Owner windows (F1, F2) remove most races before they start, because only public items can race.

*Cost / performance.* At most 100 ms added to a pickup. One sort per tick.

*Games that used it.*
- Old School RuneScape: https://oldschool.runescape.wiki/w/Player_identification_number
- MapleStory (Cosmic item lock): https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java

*How it feels.* Invisible when owners are clear. First packet wins hands every race to the best connection, never a phone.

*Risks.* A visible rotating rank could be gamed. Keep it server-side.

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 1 · MMO fit 5 · Fairness 5 · Speed 5

### G3. Cosmetic prediction, confirm on ack, honest rejection

*In plain words.* The click is heard and seen at once. The item leaves the ground only when the server says yes. If it says no, the item settles back with a reason.

*How it works (technical).*
- Tibia and OSRS do not predict pickups [V, S36; I, note 06].
- Path of Exile's predictive mode applied actions at once and predicted results; desync complaints led to Lockstep in 2.0.0 and an Auto mode that switches near 150 ms ping [V, S107, S108].
- Success-dependent feedback works and lying feedback hurts [V, S143]. A confirm that plays and then bounces back is a lie [I, note 07].
- Sending ownership and timers with the item lets the client refuse a click it knows will fail [V, S64; I].
- Map to Asterion [I]. On click, a soft tick and a 4 px hop while the item stays. On `PICK_OK`, fly to bag and confirm sound. On `PICK_FAIL`, settle with a 2 px shake over 120 ms and the reason. Others' pickups arrive as removes with the picker's ID and fly toward that player.

*Cost / performance.* One round trip of delay on the fly, typically 50 to 150 ms [I, note 07].

*Games that used it.*
- Path of Exile: https://poewiki.net/wiki/Desync
- Tibia (no prediction): https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp

*How it feels.* Snappy, because the press answers in 0 ms. Honest, because nothing ever comes back out of the bag.

*Risks.* Full prediction that fails reads as a dupe or a bug. The Sandbox shows both modes side by side.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 5 · Fairness 5 · Speed 5

### G4. Dupe-proof moves: item GUIDs and one transaction

*In plain words.* Every item has a serial number, and moving it changes one row in one step, so a crash cannot leave it in two places.

*How it works (technical).*
- TFS stores player items keyed by player, parent and slot, with no item ID [V, S31]. Player and house saves run as separate transactions [V, S22]. Canary saves hourly by default [V, S9].
- OTLand users report that a server crash between a house save and a player save clones items [U, S39].
- Diablo II dupes paired lag with a timed crash so some characters saved and others did not; Blizzard later scanned for duplicates, and earlier said there was generally "no way to tell" [V, S123].
- New World disabled wealth transfers in November 2021 over a gold dupe tied to lag during a trade; the fix caused a refund exploit [V, S122].
- Map to Asterion [I]. A 64-bit GUID per non-stackable item and per stack. One items table where ground, corpse, bag and house are container IDs. A move is one `UPDATE ... WHERE guid = ? AND container = ?`; 0 rows means someone else won. Journal cross-owner moves before replying. A nightly unique-GUID check.

*Cost / performance.* 8 bytes per item in storage. A journal append per cross-owner move.

*Games that used it.*
- New World (wealth transfer shutdown): https://www.pcgamer.com/amazon-disables-new-world-wealth-transfers-to-fight-gold-dupe-exploit
- Diablo II (duplicate scans): https://diablo2.diablowiki.net/Blizzard_vs._Hacked_Items

*How it feels.* Invisible until an economy collapses.

*Risks.* Refunds without checking the debit (New World). Batching saves across owners.

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 1 · MMO fit 5 · Fairness 5 · Speed 5

### G5. Area of interest, per-tile caps, merging and despawn heaps

*In plain words.* Send items only to players who can see them, cap what one tile shows, merge identical coins, and clean up by timer.

*How it works (technical).*
- Tibia's view is 18 x 14 tiles; the server's spectator range is 11 tiles [V, S29, S27]. Above ground it sends 8 floors [V, S27].
- `MAX_STACKPOS = 10`: a client gets at most 10 things per tile, though the server tile holds up to 65,535 [V, S23, S34, S37].
- Canary keeps a timestamp-sorted map with one wake-up [V, S23, S17]. TFS map cleans only dirty tiles [V, S29].
- Nuclear Throne blinks every pickup for a fixed 2 s before it vanishes [V, S136]. RuneLite draws a 10 px despawn pie, green while private and yellow once public [V, S61].
- Map to Asterion [I]. Area of interest by visible chunks. Send the top 10 per tile by tier. Merge stackables on the same tile at drop time. A per-zone cap that evicts the cheapest first, as OSRS does by value [V, S49]. Despawn from a timestamp heap, with a 10 s blink.

*Cost / performance.* A Tibia add is 10 bytes, a remove 7 [V, S27]. The server flushes each client's batch every 10 ms [V, S28]. Our proposed add is 20 bytes (§6c) [I].

*Games that used it.*
- Tibia (TFS viewport and stack cap): https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
- Minecraft (merging): https://minecraft.wiki/w/Item_(entity)

*How it feels.* A pile stays a pile. Hourly map cleans make items vanish without warning [I, note 06].

*Risks.* A cap that hides the best item. Evict by value, display by tier.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 2 · MMO fit 5 · Fairness 4 · Speed 5

### G6. Crowd LOD: own, party and others, measured

*In plain words.* Your loot gets the full show, your party's a quieter one, strangers' loot almost none.

*How it works (technical).*
- WoW's Spell Density and FFXIV's battle effects split own, party and others [V, S3]. Canary already sends the loot highlight only to eligible viewers [V, S7].
- Our boss scene put 30 players around one corpse with up to 600 items popping, resting 4 s, then pulled and flown [V, S5]. The cheap path used halo sprites, beam sprites, atlas labels and the grid solver. The naive path used `shadowBlur`, per-frame gradients, `fillText` and the naive solver [V, S5].
- Map to Asterion [I]. Three tiers. Own: arcs, glow, beam, sting, labels. Party: arcs, glow, no sting, labels on hold. Others: no arc (items appear landed), no glow, beams only for legendary for 2 s, no labels, no sound.

*Cost / performance.* Cheap path at 200 items: 1.14 / 3.62 / 16.27 ms (M4 GPU / 6x throttle / software GL); naive 4.85 / 7.63 / 29.45 ms [V, S5]. At 600 items cheap 2.46 / 7.73 / 30.09 ms against naive 13.38 / 20.66 / 60.91 ms [V, S5].

*Games that used it.*
- Tibia (per-viewer highlight): https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp
- Old School RuneScape (ownership filter): https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsConfig.java

*How it feels.* Your drops stand out because nobody else's compete.

*Risks.* New players cannot learn that a teammate got a great drop. Keep the party loot line (D1).

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 3 · MMO fit 5 · Fairness 4 · Speed 5

### Family H: Death drops

### H1. Tibia death: the backpack and random slots into your own corpse

*In plain words.* When you die, your backpack almost surely drops and each piece of gear might, into your own corpse. Blessings lower the odds.

*How it works (technical).*
- Canary's `LossPercent` table maps blessings to backpack drop chance and a skill-loss reduction in percent: 0 gives 100 / 0, 1 gives 70 / 8, 2 gives 45 / 16, 3 gives 25 / 24, 4 gives 10 / 32, 5 gives 0 / 40, and 7 or more gives 0 / 56 [V, S16].
- `DropLoot` loops 10 slots; a container uses the full chance and any other item a tenth, and items `moveTo(corpse)` [V, S16]. With 0 blessings that is a 61% chance to lose at least one of 9 pieces [I, note 05].
- Red and black skulls drop everything; an amulet of loss skips the roll unless skulled [V, S16, S33].
- Player corpses are 10-slot containers lootable for 1,200 + 1,200 s, then 1,200 s as bones [V, S12]. They have no owner [V, S10, S6].
- Canary seeds `math.randomseed(os.time())` inside every `DropLoot` call, so two deaths in one second share rolls [V, S16; I, note 05].
- Map to Asterion [I]. Keep the table as data. One server RNG seeded once. The move into the corpse is one transaction (G4).

*Cost / performance.* One container entity. Cost grows with corpse count, not item count [I, note 05].

*Games that used it.*
- Tibia (Canary blessings): https://github.com/opentibiabr/canary/blob/main/data/libs/systems/blessing.lua
- Tibia (TFS drop_loot): https://github.com/otland/forgottenserver/blob/master/data/creaturescripts/scripts/drop_loot.lua

*How it feels.* Tense in a good way. The backpack is the predictable loss and the gear is a lottery, so blessed players still feel the risk [I, note 05].

*Risks.* Ownerless corpses reward bystanders who did nothing (H4).

*Ratings 1–5 (author judgement):* Clarity 3 · Delight 3 · MMO fit 4 · Fairness 2 · Speed 5

### H2. A protected floor: keep 3, blessings, insurance and destruction

*In plain words.* Every full-loot game keeps something back, so a death hurts without ruining a player.

*How it works (technical).*
- OSRS keeps the 3 most valuable items unskulled, plus 1 with Protect Item; skulled players keep 0 (1 with the prayer) [V, S54]. A skull lasts 30 min after an unprovoked attack [V, S56].
- Ultima Online insurance costs 10 to 800 gp per item, and the killer of an insured player receives the premium [V, S80]. Blessed items always return [V, S81].
- Albion drops everything in red and black zones [V, S77]; a reported 33% of dropped items are destroyed [U, S78]. Tarkov insurance returns items nobody extracted with, in 12 to 36 h by trader per guides [U, S82].
- Map to Asterion [I]. Keep 3 most valuable for unskulled players, plus Canary's free blessing to level 21. Skull means consent to full loot.

*Cost / performance.* A sort of equipped items by value at death.

*Games that used it.*
- Old School RuneScape: https://oldschool.runescape.wiki/w/Items_Kept_on_Death
- Ultima Online: https://uoguide.com/Insure

*How it feels.* Players always know their best gear is safe unless they chose risk. That is "meaningful", not "ruinous".

*Risks.* Too much protection removes the pillar. Keep 3, not 10.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 2 · MMO fit 5 · Fairness 5 · Speed 5

### H3. Graves, paused timers and the corpse run

*In plain words.* What you lost waits for you at a marked spot for a while, and the clock stops if you disconnect.

*How it works (technical).*
- OSRS graves hold up to 120 slots at the death tile, show on the minimap, can be looted from 7 tiles with line of sight, and last 15 minutes after respawn; the timer pauses while offline, idle over 10 s or in the grave window, and a second death merges and refreshes [V, S55].
- Koster argues corpse runs worked in MUDs because quick travel, global chat and donation rooms surrounded them, and that they "were a powerful social force" [V, S147].
- Map to Asterion [I]. PvE deaths: the corpse is the grave, a minimap marker for the owner only, 1,200 s lootable with a pause while the owner is offline. PvP corpses do not pause.

*Cost / performance.* One timer that pauses. Minimal.

*Games that used it.*
- Old School RuneScape: https://oldschool.runescape.wiki/w/Grave
- Old School RuneScape (Death's Office): https://oldschool.runescape.wiki/w/Death%27s_Office

*How it feels.* Loss becomes a mission with a clock. The pause answers "my internet dropped and I lost everything".

*Risks.* Fees that feel like a tax. Long timers fill the world with corpses.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 3 · MMO fit 5 · Fairness 5 · Speed 5

### H4. Who loots a player corpse: nobody first, the killer first, or a key

*In plain words.* After a PvP kill, does anyone race for the body, does the winner get first pick, or does the loot skip the ground entirely?

*How it works (technical).*
- Tibia player corpses have no owner, so anyone on screen may open them at once [V, S10, S6].
- Albion's Into the Fray Patch 4 (11 August 2022) gave black-zone corpses a 90 s priority window for the killing blow, the top damage dealer, their allies and the victim's allies [V, S76].
- OSRS loot keys (February 2022) cost the killer 1m once; the victim's loot goes into a key in the killer's inventory, at most 5, pickable only by the killer, and the skull shows the key count [V, S57].
- Thieves pay in other games. ServUO flags a looter of an innocent's corpse criminal for 2 min [V, S74]. EVE gives a 15 min suspect flag for looting someone else's wreck [V, S79]. Dark and Darker added search time to enemy corpses only [V, S83].
- Map to Asterion [I]. 60 s priority window for the killer's group and the victim's party, then public. The victim's friends can win the body back, so a death becomes a fight. A one-click "loot all" for the priority group. After the window, outsiders loot through a 1.5 s channel that damage interrupts, and wear a yellow name for 2 min.

*Cost / performance.* One group list and one deadline per player corpse.

*Games that used it.*
- Albion Online: https://player.one/albion-online-fray-patch-4-implements-black-zone-loot-changes-and-more-149725
- Old School RuneScape: https://oldschool.runescape.wiki/w/Loot_key

*How it feels.* Albion's shared window builds revenge into the rules; Tibia's vulture race pays bystanders.

*Risks.* 0 s windows reward vultures. Keys remove the third-party swoop entirely, which may be too safe for Asterion.

*Ratings 1–5 (author judgement):* Clarity 4 · Delight 4 · MMO fit 4 · Fairness 4 · Speed 5

### H5. Reading a player corpse, and the death recap

*In plain words.* Bystanders can tell whose body this is and who killed them. The dead player sees exactly what they lost.

*How it works (technical).*
- TFS and Canary describe a player corpse as "You recognize X. He was killed by Y" and add "and others" past two killers [V, S32, S13].
- Canary skips the "Loot of" line for player corpses [V, S6]. OSRS shows the grave on the minimap [V, S55] and opens with "Oh dear, you are dead!" [V, S53].
- Map to Asterion [I]. A distinct player corpse sprite with a name tag on hover. A death recap on respawn listing lost items in tier colours and the killers. The killer sees the contents in their own chat; no server-wide broadcast.

*Cost / performance.* One message to the victim and one to the killer.

*Games that used it.*
- Tibia (TFS corpse text): https://github.com/otland/forgottenserver/blob/master/src/player.cpp
- Old School RuneScape: https://oldschool.runescape.wiki/w/Death

*How it feels.* Clear loss is bearable. Confusing loss feels like a bug.

*Risks.* A broadcast of rich corpses invites hunting.

*Ratings 1–5 (author judgement):* Clarity 5 · Delight 3 · MMO fit 5 · Fairness 4 · Speed 5

## 5. Comparison scorecard

Author judgement, copied from the profiles: Clarity · Delight · MMO fit · Fairness · Speed.

| # | Technique | Clarity | Delight | MMO fit | Fairness | Speed | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Corpse as container | 4 | 2 | 5 | 4 | 5 | 20 |
| A2 | Ground spill on a fixed pattern | 4 | 4 | 3 | 3 | 3 | 17 |
| A3 | One bag, one colour, corpse glint | 5 | 4 | 5 | 4 | 5 | 23 |
| A4 | Direct to bag | 3 | 2 | 5 | 4 | 5 | 19 |
| B1 | Pop arc, 400 ms, sound on landing | 4 | 5 | 5 | 4 | 5 | 23 |
| B2 | Floor shadow, material sound, no bounce | 4 | 4 | 5 | 4 | 5 | 22 |
| B3 | Stagger, scatter order, stack sprites | 4 | 4 | 3 | 4 | 4 | 19 |
| C1 | Five tiers, colour plus shape | 4 | 3 | 4 | 4 | 5 | 20 |
| C2 | Glow, beams and pings | 5 | 5 | 3 | 4 | 5 | 22 |
| C3 | Tier sounds and voice caps | 4 | 5 | 3 | 4 | 5 | 21 |
| C4 | Honest tells, effect follows tier | 4 | 4 | 5 | 5 | 5 | 23 |
| D1 | Loot message and party log | 5 | 2 | 5 | 4 | 5 | 21 |
| D2 | Labels on demand, sorted cap | 4 | 2 | 4 | 4 | 4 | 18 |
| D3 | Label declutter on a grid | 4 | 2 | 4 | 4 | 4 | 18 |
| D4 | Tier style table and simple filter | 4 | 3 | 4 | 4 | 5 | 20 |
| E1 | Click, reach 1, walk then retry | 4 | 2 | 5 | 5 | 5 | 21 |
| E2 | Quick loot nearby, 3x3, cap 30 | 5 | 3 | 5 | 5 | 5 | 23 |
| E3 | Currency magnet | 4 | 5 | 3 | 3 | 5 | 20 |
| E4 | Fly to bag, bump, coin pitch | 4 | 5 | 4 | 4 | 5 | 22 |
| E5 | Bag full and partial loot | 5 | 2 | 5 | 5 | 5 | 22 |
| F1 | Top damage owns, short window | 3 | 2 | 5 | 3 | 5 | 18 |
| F2 | Private then public, timers shown | 5 | 2 | 4 | 4 | 5 | 20 |
| F3 | Party loot modes | 3 | 3 | 3 | 3 | 5 | 17 |
| F4 | Personal loot and boss chests | 5 | 3 | 4 | 5 | 4 | 21 |
| G1 | One authoritative move | 4 | 2 | 5 | 5 | 5 | 21 |
| G2 | Tick batches, rotating order | 3 | 1 | 5 | 5 | 5 | 19 |
| G3 | Cosmetic prediction, confirm on ack | 4 | 4 | 5 | 5 | 5 | 23 |
| G4 | Item GUIDs and one transaction | 3 | 1 | 5 | 5 | 5 | 19 |
| G5 | AOI, tile caps, merging, despawn | 4 | 2 | 5 | 4 | 5 | 20 |
| G6 | Crowd LOD by owner | 5 | 3 | 5 | 4 | 5 | 22 |
| H1 | Tibia death drop into own corpse | 3 | 3 | 4 | 2 | 5 | 17 |
| H2 | Protected floor | 5 | 2 | 5 | 5 | 5 | 22 |
| H3 | Graves and paused timers | 5 | 3 | 5 | 5 | 5 | 23 |
| H4 | Killer-first window or keys | 4 | 4 | 4 | 4 | 5 | 21 |
| H5 | Readable corpse and death recap | 5 | 3 | 5 | 4 | 5 | 22 |

**Reading the table.** Speed separates little, because loot is mostly server logic and a few blits, and every row below 5 has a cheap path in §6d [V, S5]. Delight and Fairness pull against each other. The most delightful rows (beams, sounds, the magnet) are the worst on a shared screen, and the fairest rows (GUIDs, races) are invisible. Six rows tie at 23: the bag colour and corpse glint (A3), the 400 ms arc (B1), honest tells (C4), quick loot nearby (E2), cosmetic prediction (G3) and graves (H3). Each is clear and cheap for everyone at once. The ground spill (A2), party modes (F3) and the raw Tibia death drop (H1) score lowest at 17, for crowd cost, griefing and rewarding bystanders [I].

---

## 6. Deep dives

### 6a. Drop motion across games

| Game | Arc duration | Apex | Landing sound | Bounce | Source |
|---|---|---|---|---|---|
| Shattered Pixel Dungeon | 400 ms | 10 px on 16 px tiles (0.625 tile) | On landing, pitch 1.16 to 1.25 | None | [V, S125] |
| Diablo I | 650 ms typical, 500 to 1000 ms | Drawn in frames | Mid flip, about 300 ms | None | [V, S84] |
| Diablo II | Flippy at 25 fps | Drawn in frames | Frame 12, 480 ms | None | [V, S86, S87] |
| Flare | 600 ms, 6 frames | Drawn in frames | Loot sound on flip | None | [V, S129, S127] |
| Asterion proposal | 400 ms, 40 ms stagger, sequence ≤ 600 ms | 20 px | On landing, by material | None; legendary 4 px hop < 120 ms | [I] |

**What the table says.** Shipped games land items in 400 to 650 ms with no bounce [V, S84, S125]. Asterion takes the short end because the corpse already took 133 ms [V, S3; I].

### 6b. Ownership timers compared

| Game | Owner | Private window | Then | Party | Source |
|---|---|---|---|---|---|
| Tibia (Canary) | Top damage or summon's master | First corpse stage, 10 s | Public until rot, 670 s total for a dragon | Any member or leader opens | [V, S10, S11, S12, S14] |
| Old School RuneScape | Top damage | 60 s hidden | Public 120 s; untradeables private 180 s | None | [V, S48, S49] |
| Ragnarok (rAthena) | Top 3 damage, first attacker +30% | 3 + 2 + 2 s; MVP 10 + 10 + 2 s | Public, gone at 60 s | Inherits rank with share on | [V, S65, S68] |
| MapleStory (Cosmic) | Killer or killer's party | 15 s | Free for all; map cap 200, expiry 180 s | Sticky party ownership | [V, S71, S72] |
| Guild Wars 2 | Every contributor (5 to 10% health) | Personal | n/a | All | [V, S120] |
| Asterion proposal | Top damage, first attacker x1.3 | 15 s owner and party | Helpers ≥ 10% to 20 s, then public | Shared open | [I] |

**What the table says.** Corpse games use 3 to 22 s; OSRS needs 60 s because players must walk to ground items [V, S48; I, note 04].

### 6c. Races, prediction and bytes

**What to predict and what to confirm.**

| Event | When it shows | Why | Source |
|---|---|---|---|
| Click tick, 4 px hop, item stays | At once | Cosmetic, nothing to undo | [I, note 07] |
| Padlock on items you may not take | At once, from the add packet | Server data the client already holds | [V, S64; I] |
| Drop arc and landing | On item add, client only | The server placed the item at t = 0 | [I, note 02] |
| Fly to bag and confirm sound | On `PICK_OK`, one RTT plus up to one tick | Server truth | [V, S36; I] |
| Settle back with the reason | On `PICK_FAIL` | Server truth | [V, S22] |
| Gold magnet pull | On the server's grant | Avoids desync | [I, note 03] |
| Someone else's pickup | On item remove with picker ID | Fly toward the picker | [I] |

**Bytes per item event**, before framing.

| Message | Layout | Bytes | Source |
|---|---|---|---|
| Tibia ground add `0x6A` | op 1, pos 5, stackpos 1, id 2, count 1 | 10 | [V, S27] |
| Tibia ground remove `0x6C` | op 1, pos 5, stackpos 1 | 7 | [V, S27] |
| Proposed `item_add` | op 1, guid 4, id 2, x 2, y 2, z 1, count 2, tier 1, owner flag 1, public in 2, despawn in 2 | 20 | [I] |
| Proposed `item_remove` | op 1, guid 4, picker 4 | 9 | [I] |
| 15-item boss spill, 30 viewers | 15 × 20 B × 30 | 9 KB burst | [I] |

The owner flag is per viewer, so no player IDs leak [I]. TCP headers add 40 bytes per frame, so the 10 ms batch flush matters more than the payload [V, S28; I, note 06]. A corpse with 1 tile reach has room for 8 looters [I, note 06].

### 6d. Runtime cost: what loot really costs

Whole frames including a 1 px readback, median ms [V, S5]. Subtract the baseline in the same column for the effect alone. Canvas2D draws into 320x180 and upscales x4. Compare software GL rows only within that column.

| Test (320x180 Canvas2D, x4 upscale) | M4 GPU | M4, 6x CPU throttle | SwiftShader (software) | Profiles |
|---|---|---|---|---|
| Baseline, floor only | 0.58 | 1.47 | 7.79 | n/a |
| 200 items, static blit | 0.75 | 2.01 | 10.99 | A2 |
| 1000 items, pop arc and shadow | 2.84 | 9.61 | 39.38 | B1, B2 |
| 200 glows, pre-baked halo sprite | 0.94 | 3.19 | 14.16 | C2 |
| 200 glows, `shadowBlur` 6 | 20.68 | 23.57 | 60.49 | C2 |
| 300 beams, sprite / gradient per frame | 0.94 / 1.05 | 2.63 / 2.88 | 12.52 / 11.93 | C2 |
| 200 labels, atlas / `fillText` / glyph blits | 0.76 / 1.03 / 2.73 | 1.93 / 2.67 / 8.60 | 10.93 / 34.44 / 38.10 | D2 |
| 1000 labels, atlas / glyph blits | 1.50 / 11.45 | 5.03 / 43.06 | 23.34 / 161.63 | D2 |
| Solver, 3000 candidates, grid / naive (CPU only) | 0.18 / 0.93 | 1.16 / 5.65 | 0.18 / 1.00 | D3 |
| Magnet, 3000 items, 30 players, grid / brute (CPU only) | 0.05 / 0.10 | 0.05 / 0.31 | 0.05 / 0.10 | E3 |
| 1000 fly-to-bag tweens | 1.61 | 5.26 | 23.62 | E4 |
| Boss drop, 30 players, 200 items, cheap / naive | 1.14 / 4.85 | 3.62 / 7.63 | 16.27 / 29.45 | G6 |
| Boss drop, 30 players, 600 items, cheap / naive | 2.46 / 13.38 | 7.73 / 20.66 | 30.09 / 60.91 | G6 |

**Machine.** Apple M4 Pro, macOS 26.5.1, Chromium 153 under Playwright, 5 µs timers. ANGLE Metal, Metal with a 6x main-thread throttle, and SwiftShader. 30 warm-up frames, then 100 to 200 timed frames. A 1280x720 run put 200 blurred items at 25.38 ms against 0.80 ms for halos [V, S5]. No phone and no Godot build were measured [V, S5].

**What it means.**
- **Count blits, not effects.** One item blit costs about 1.1 µs on the GPU, 4 µs throttled and 16 µs in software, so a software client affords about 550 per frame [V, S5; I, note 09].
- **Never blur.** `shadowBlur` costs 30 to 100 times a halo sprite on the M4 GPU and passes the budget at 200 items there. The gap is about 13x with a 6x CPU throttle and 8x in software, where everything is slow [V, S5]. In Godot the matching trap is a blur shader or the 2D glow post-process, untested [I, note 09].
- **Cache every label once.** The atlas was cheapest in every condition, 12 times cheaper than glyph blits [V, S5].
- **Clarity caps the count before cost does.** Only about 120 labels fit on a 320x180 screen, and a 200-item boss screenshot is unreadable [V, S5]. Design for about 200 visible ground items per screen, the most a software client can draw in budget [V, S5; I].
- **Godot.** One atlas for items, halos, beams and labels should batch on Compatibility, and 4.4 instance uniforms keep per-item colour without breaking batches [V, S152; I, note 09].

### 6e. Death penalties compared

| Game | What drops | Protection | Who loots first | Timer | Source |
|---|---|---|---|---|---|
| Tibia (Canary) | Backpack 100% and each slot 10% at 0 blessings | Blessings, amulet of loss | Anyone at once | 1,200 + 1,200 s lootable, 1,200 s bones | [V, S16, S12] |
| OSRS, PvM | All but kept items, to a grave | Keep 3, Protect Item | Owner only | 15 min, pauses offline | [V, S54, S55] |
| OSRS, PvP | All but kept items, to the killer | Keep 3 unskulled | Killer by loot key | Key held by the killer | [V, S57] |
| Albion, black zone | Everything; about 33% destroyed | None | Killer, top damage and both sides' allies | 90 s, then public | [V, S76; U, S78] |
| Ultima Online | Uninsured items | Insurance, blessed items | Anyone in Felucca | Corpse decay | [V, S80, S81] |
| Asterion proposal | Tibia table, skull drops all | Keep 3 unskulled, free blessing to level 21 | Killer's group and victim's party | 60 s priority, 1,200 s lootable, PvE pauses offline | [I] |

**What the table says.** Every full-loot game keeps a valve, whether insurance, kept items, destruction or a priority window [I, note 05]. Harsh drops feel fair when travel back and help are near [V, S147].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Loot and Pickup Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server loot truth.** The server rolls drops, mints GUIDs, owns positions, counts and timers, resolves pickups per 100 ms tick in a rotating order, and commits each move as one guarded transaction (G1, G2, G4).
2. **Ownership, party and death rules.** Top damage (first attacker x1.3) and party own a corpse for 15 s, 10% helpers join until 20 s, then public. Spills are private 60 s and public to 180 s. Bosses use personal chests. Deaths drop by the blessing table with a 60 s priority window (F1 to F4, H1 to H4).
3. **Replication and area of interest.** 20-byte adds and 9-byte removes to players who see the chunk, with a per-viewer owner flag and timers. Stacks merge per tile, 10 shown per tile, a value-ranked cap, despawn from a heap (G5).
4. **Client prediction and reconciliation of pickup.** A click plays a tick and a 4 px hop at once; the item leaves the ground only on `PICK_OK`; `PICK_FAIL` settles it with a reason; known-locked items refuse locally (G3).
5. **Drop presentation.** Corpse containers for monsters with a tier glint. Ground spills on a ring search for bosses and death piles, 400 ms arcs with a 20 px apex, a floor shadow, a 40 ms stagger in tier order, no bounce (A1 to A3, B1 to B3).
6. **Rarity signalling.** Five tiers with colour, outline shape and sound. Glow pulse from rare up as a halo sprite. Legendary beams, 2 s for strangers and persistent for the owner, plus an edge chip. Stings for your own loot only (C1 to C4).
7. **Labels and filters.** Labels on a hold key, owner first, capped at 32 by tier, from one cached atlas, stacked by a grid solver. A tier style table and three filter presets. A loot log with party lines (D1 to D4).
8. **Pickup interaction.** Click with walk then retry, quick loot nearby over the 3x3 capped at 30, a 1 tile gold magnet after 400 ms, 250 ms fly to bag with a bump and a "+N", coin pitch streaks, exact bag-full messages (E1 to E5).
9. **Crowd budget and accessibility.** Own, party and others tiers, about 200 visible ground items, caps on glows and labels, an 8-voice pool, reduce motion, shapes next to colours, nothing paywalled (G6, C1, E2).

**Recommended preset.** Starting values at 32 px tiles and 60 fps. "Estimate" means no source gave the number; tune in the Sandbox. Sandbox pixel values are half.

| Setting | Asterion value | Source |
|---|---|---|
| Server tick for pickups | 100 ms, rotating order every 60 s | Estimate; OSRS PID rotation [V, S52] |
| Pickup reach | 1 tile, walk then retry 300 ms | Canary [V, S8] |
| Monster corpse owner | Top damage, first attacker x1.3, 15 s, party shares | Tibia 10 s [V, S12]; rAthena 30% [V, S65]; 15 s estimate |
| Spilled item timers | 60 s private, public to 180 s | OSRS [V, S48] |
| Drop arc | 400 ms, apex 20 px, shadow 60% black | SPD [V, S125] |
| Stagger | 40 ms per item, sequence ≤ 600 ms, tier ascending | Estimate |
| Beam | Legendary, 32 x 96 px, strangers 2 s, owner until pickup | Estimate; PoE Temp [V, S103] |
| Gold magnet | 1 tile, owner only, 400 ms after landing, not in PvP combat | Flare, Minecraft [V, S127, S134]; delay estimate |
| Fly to bag | 250 ms ease in-out, ±16 px curve, bag 1.15x over 120 ms | Mindustry 200 ms [V, S130]; rest estimate |
| Death drop | Backpack 100 / 70 / 45 / 25 / 10 / 0% by blessings, slots a tenth | Canary [V, S16] |
| PvP corpse priority | 60 s killer's group and victim's party | Between OSRS 60 s and Albion 90 s [V, S53, S76] |
| Player corpse | 1,200 s lootable, PvE pauses offline, then bones | Tibia [V, S12]; OSRS pause [V, S55] |

**Pseudocode.**

Server pickup, resolved per tick (G1, G2, G4, F1, F2). GDScript-like; times in ms, tiles in tiles:
```
const TICK_MS := 100
var pending: Array[PickReq] = []

func on_pick_request(p: Player, guid: int) -> void:
    pending.append(PickReq.new(p, guid))          # never act on arrival: the tick decides races

func tick(now: int) -> void:
    var epoch := now / 60000                      # the order rotates every 60 s
    pending.sort_custom(func(a, b): return rank(a.p.id, epoch) < rank(b.p.id, epoch))
    for r in pending:
        var it: Item = items.get(r.guid)
        if it == null or it.container != GROUND:
            reply(r.p, PICK_FAIL, r.guid, GONE); continue
        if not may_loot(r.p, it, now):            # ownership BEFORE anything moves, at execution time
            reply(r.p, PICK_FAIL, r.guid, NOT_YOURS); continue
        if chebyshev(r.p.tile, it.tile) > 1:
            walk_then_retry(r, 300); continue     # re-enters pending later; every check runs again
        if not r.p.bag.fits(it):
            reply(r.p, PICK_FAIL, r.guid, BAG_FULL); continue   # item stays where it is
        if not store.move(it.guid, GROUND, r.p.bag_id):         # UPDATE ... WHERE guid AND container = GROUND
            reply(r.p, PICK_FAIL, r.guid, GONE); continue
        it.container = r.p.bag_id                 # memory follows the committed row
        reply(r.p, PICK_OK, it.guid, r.p.bag.slot_of(it))
        broadcast_aoi(it.tile, ITEM_REMOVE, it.guid, r.p.id)    # after the commit, never before
    pending.clear()

func rank(id: int, epoch: int) -> int:
    return hash([id, epoch])                      # server secret; clients never see it

func may_loot(p: Player, it: Item, now: int) -> bool:
    if it.personal_for != 0: return it.personal_for == p.id
    if now >= it.public_at: return true
    if it.owner == p.id or same_party(p.id, it.owner): return true
    return now >= it.helpers_at and it.helpers.has(p.id)
```
Two players who click the same coin in one tick both land in `pending`; the first in rank order commits, and the second finds `container != GROUND` and gets `GONE`. Ownership is read with the tick's `now`, so a non-owner request sent at 14.95 s fails if the tick runs before 15 s. `store.move` journals the row before `reply`, so a crash after the reply cannot undo a pickup the player saw.

On a monster's death the server picks the owner with the puller's damage weighted 1.3 (rAthena's rule) and writes the owner and both deadlines before it fills the corpse. It broadcasts only after the fill commits, so nobody opens an empty or unowned corpse.

Client pickup with cosmetic prediction (G3, E4):
```
func on_click_item(guid: int) -> void:
    var v: ItemView = view.items.get(guid)
    if v == null: return
    if not v.may_loot_now(Time.get_ticks_msec()):  # from owner flag and timers in the add packet
        v.show_padlock(); return
    play_ui(TICK_SOFT); v.hop(4); v.pending = true # the item stays on the ground
    net.send(PICK, guid)

func on_pick_ok(guid: int, slot: int) -> void:
    var v: ItemView = view.items.get(guid)
    if v: v.pending = false; fly_to_bag(v, slot, 250); view.items.erase(guid)
    play_loot(CONFIRM, MINE)

func on_pick_fail(guid: int, reason: int) -> void:
    var v: ItemView = view.items.get(guid)
    if v: v.pending = false; v.settle_shake(2, 120)
    status_line(REASON_TEXT[reason])

func on_item_remove(guid: int, picker: int) -> void:
    if picker == my_id: return                     # PICK_OK already drove our fly
    var v: ItemView = view.items.get(guid)
    if v: fly_to_actor(v, picker, 250); view.items.erase(guid)   # or fade if the picker is off screen
```
The server sends `PICK_OK` before the broadcast on the same ordered stream, so our own remove always arrives second and is ignored. The fly starts one round trip after the click; the 0 ms tick and hop cover that gap.

Drop arc and stagger on the client (B1 to B3):
```
const ARC_MS := 400.0; const APEX_PX := 20.0; const STAGGER_MS := 40.0; const SEQ_MAX_MS := 600.0

func play_spill(items: Array, origin: Vector2) -> void:
    items.sort_custom(func(a, b): return a.tier < b.tier)     # best lands last
    var step := minf(STAGGER_MS, SEQ_MAX_MS / maxf(1.0, items.size() - 1))
    for i in items.size():
        var v: ItemView = items[i]
        v.start_ms = now_ms() + i * step; v.from = origin       # v.to is the server tile

func update_arc(v: ItemView, now: float) -> void:
    var t := clampf((now - v.start_ms) / ARC_MS, 0.0, 1.0)
    var ground := v.from.lerp(v.to, t)
    v.sprite.position = (ground - Vector2(0, 4.0 * APEX_PX * t * (1.0 - t))).round()
    v.shadow.position = ground.round()                          # shadow stays on the floor
    if t >= 1.0 and not v.landed: v.landed = true; play_loot(land_sound(v), v.owner_tier)
```
A 15-item boss drop gets a 40 ms step and lasts 560 + 400 = 960 ms; a 30-item drop shrinks the step to 20.7 ms. Pickups are accepted during the arc and cut it short.

Death drop into the corpse (H1, H2, H4):
```
const BLESS := [100, 70, 45, 25, 10, 0]           # backpack chance by blessing count

func on_player_death(v: Player, killer: Player, now: int) -> void:
    var c := Corpse.new(v)
    c.owner_group = group_of(killer) + party_of(v) if killer else []
    c.public_at = now + (60000 if killer else 0)  # set before any item moves in
    var chance := 100 if v.skull in [RED, BLACK] else BLESS[mini(v.blessings, 5)]
    if v.has_aol and not (v.skull in [RED, BLACK]): chance = 0; v.consume_aol()
    var keep := [] if v.skull else v.most_valuable(3)
    var moves := []
    for slot in SLOTS:
        var it = v.slot(slot)
        if it == null or it in keep: continue
        var c_pct := chance if it.is_container() else chance / 10.0
        if server_rng.randf() * 100.0 < c_pct: moves.append(it.guid)   # one RNG, seeded once
    store.move_many(moves, c.guid)                # one transaction: inventory to corpse
    broadcast_aoi(c.tile, CORPSE_ADD, c.guid)     # only after the commit
    send_to(v, DEATH_RECAP, moves, killers_of(v))
```

---

## 8. Reference implementation: the Loot and Pickup Sandbox

`feel-loot-pickup-sandbox.html` [S4] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering at an integer scale where it fits. It plays the nine layers of §7 and shows each layer's cost live. Its design choices are ours [I], every number is illustrative, and it loads no external assets; the bitmap font, HUD and controls come from the Combat Juice Sandbox [S3].

**The field.** Grass, a path, rocks and bushes on 16x16 px tiles, so pixel sizes are half the Asterion values (a 10 px apex, a 16 px magnet, a 48 px beam). The player kills 4 to 6 weak mobs, an elite and, on a button, a boss that drops 10 to 20 items. About 16 item icons in five tiers, drawn in code.

**Drop styles.** Corpse container with a loot window and a chat line, ground spill with arcs and labels, a RotMG-style bag in the best tier's colour, and direct to bag with a toast. Presets "Tibia classic", "Classic ARPG", "Roguelite" and "Asterion recommended".

**The MMO problems, live.** 0 to 30 simulated allies who loot and, with the ninja toggle, try for yours. Party modes free for all, round robin and personal. Server tick 50, 100 or 600 ms and latency 0 to 400 ms. Prediction modes "wait for server", cosmetic, and full prediction, which pops items back on rejection to show why we reject it. A same-tick race demo. PvP with "Die here", the blessing table and a 60 s priority window.

**Controls.** Click to pick up or open, E loots nearby (3x3, cap 30), R loots all in the open window, hold Alt (a toggle on touch) for labels, Space attacks. A juice master slider with per-effect toggles. Views cycle with V: normal, server truth (GUIDs, owner dots, timers, predicted against confirmed), ownership tiles and cost. P pauses, M plays at 0.25x.

**The efficiency HUD.** Smoothed per-layer timings against a 16.7 ms bar, and counters for items, labels drawn and hidden, glows, beams, merges, predicted and rejected pickups, and server bytes per second. "Rain 200 items" and "Rain 1000 items" stress labels and glow.

**Thumbnail.** The `data-demo="showcase"` button freezes a boss spill mid-arc with a legendary beam, tier labels stacked without overlap, gold flying to the player, the bag bumping and a dimmed item owned by someone else.

**Simplifications (honest list)** [I]. Canvas 2D on the CPU, so HUD times compare with §6d, not Godot. "Server" and "client" share one page; latency is a timer and bytes are counted, not sent. Bots follow scripts.

---

## 9. Gem findings

Licences were read from the GitHub API and LICENSE files on 2026-11-11 [V, note 08]. No Godot addon handles ground items, labels or server-validated pickup. Watch three traps. devilutionX's "Sustainable Use License" bans commercial use, so read its label pass and reimplement from the description. TFS and Canary are GPL-2.0, so read them for rules and write our own code. OTClient's LICENSE file is MIT even though the GitHub API reports NOASSERTION. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence or no commercial use, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| GLoot | https://github.com/peter-kish/gloot | MIT | v3.0.2 (2026-07-05), 993 stars, Godot 4.4+ | Stacks, JSON prototypes, grid and weight constraints, slots, inventory UI | Low |
| Expresso Inventory System | https://github.com/expressobits/inventory-system | MIT | addon-2.13.0 (2026-03-21), 741 stars, C++ core | Dropped-item and pickup demos, a multiplayer example (trust model unchecked) | Low |
| Wyvernbox | https://github.com/don-tnowe/godot-wyvernbox-inventory | MIT | 164 stars, Asset Library v1.3.14 | ARPG gestures: Shift-click transfer, double-click gather, right-click split; ground item filters | Low |
| Lootie | https://github.com/sempitern0/Lootie | MIT | v1.0.2, 126 stars | Weighted and tiered loot tables, server-side reference | Low |
| OTClient (Redemption, original) | https://github.com/opentibiabr/otclient ; https://github.com/edubart/otclient | MIT (LICENSE file; API says NOASSERTION) | 542 and 709 stars | Container windows, quick loot filter UI, loot splitter UI | Low |
| RuneLite ground items and loot tracker | https://github.com/runelite/runelite | BSD-2 | 5,526 stars, pushed 2026-11-10 | Value tiers, 15 px label stacks, despawn pie, beams, ownership filter | Low |
| NeverSink filters (PoE1, PoE2) | https://github.com/NeverSinkDev/NeverSink-Filter ; https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2 | MIT | 2,608 and 2,851 stars, PoE2 0.10.4a | A player-tuned tier ladder of size, colour, beam, icon and sound | Low |
| MapLibre GL JS | https://github.com/maplibre/maplibre-gl-js | BSD-3 | 12,070 stars | Grid symbol collision with priority, for label placement ideas | Low |
| rbush | https://github.com/mourner/rbush | MIT | 2,789 stars | R-tree for rectangle overlap, portable to GDScript | Low |
| Canary | https://github.com/opentibiabr/canary | GPL-2.0 | 668 stars, pushed 2026-11-05 | Quick loot, autoloot, owners, reward chests, blessings, decay heap | Copyleft |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars | Move order, packet sizes, viewport, corpses, decay | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 | Shipped game | Drop arc, shadow, glow pulse, fly to toolbar | Copyleft |
| Flare engine | https://github.com/flareteam/flare-engine | GPL-3.0 | 1,308 stars, v1.15 | Data-driven loot, label hide radius, currency autopickup | Copyleft |
| devilutionX | https://github.com/diasurgical/DevilutionX | Sustainable Use License 1.0, non-commercial only | 10,003 stars, 1.5.5 | Flip frames, drop sound timing, sideways label push | None (no commercial use) |

**Picks.** GLoot for the client inventory view, with the server as the only truth. Our own ground item manager with a `Dictionary` keyed by tile, batched `Sprite2D`s on one atlas and atlas labels in one `_draw()` node [I, note 08]. Canary and TFS for rules only.

---

## 10. Learnings and anti-patterns

**Learnings.**
1. **Land in 400 ms and ring on landing** [V, S125, S84].
2. **Show the tier at landing, honestly, with colour, shape and sound** [V, S140, S143; I].
3. **Your loot is loud, others' loot is quiet** [V, S7, S5; I].
4. **One loot key over the 3x3, never paywalled** [V, S8, S148].
5. **Ownership travels with the item** [V, S64, S7].
6. **The tick decides races, in a rotating order** [V, S52; I].
7. **The press is predicted, the pickup is confirmed** [V, S107; I].
8. **Every item has a GUID and every move is one transaction** [V, S31, S122; I].
9. **Cache labels and glow as sprites** [V, S5].
10. **Death keeps a valve and gives a clock** [V, S54, S55, S76].

**Anti-patterns.**
1. **`shadowBlur` or blur-shader glow on items**, 20.7 ms for 200 [V, S5].
2. **Labels drawn glyph by glyph every frame**, 12 times the atlas [V, S5].
3. **Always-on labels with an unsorted cap** [V, S90].
4. **Persistent beams for everyone's drops** [I, note 02].
5. **Full pickup prediction that pops items back** [V, S107; I].
6. **First packet wins** on web and phone clients [I, note 06].
7. **Two stores saved apart** [V, S123, S124; U, S39].
8. **Overflow spilled onto a shared tile** [I, note 03].
9. **Reseeding the RNG per death** [V, S16].
10. **Fake near misses and tier tells that downgrade** [V, S141, S142].

---

## 11. "See it in action" index

| # | Game | Loot idea | URL |
|---|---|---|---|
| 1 | Tibia | Corpse filled on arrival, "Loot of" line | https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp |
| 2 | Tibia | Quick loot nearby, 3x3, 30 corpses, exact messages | https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp |
| 3 | Tibia | Corpse owner until the first rot stage | https://github.com/opentibiabr/canary/blob/main/src/items/item.cpp |
| 4 | Tibia | Blessings and the backpack drop | https://github.com/opentibiabr/canary/blob/main/data/libs/systems/blessing.lua |
| 5 | Tibia | Party Hunt Analyser loot split | https://tibiamaps.io/tools/loot |
| 6 | Old School RuneScape | 60 s private, then public drops | https://oldschool.runescape.wiki/w/Drops |
| 7 | Old School RuneScape | Loot beams in four colours | https://oldschool.runescape.wiki/w/Loot_beam |
| 8 | Old School RuneScape | Graves with a paused 15 min timer | https://oldschool.runescape.wiki/w/Grave |
| 9 | Old School RuneScape | Loot keys for PvP kills | https://oldschool.runescape.wiki/w/Loot_key |
| 10 | Old School RuneScape | Same-tick grabs decided by PID | https://oldschool.runescape.wiki/w/Player_identification_number |
| 11 | Ragnarok Online | Scatter cycle and 3-tier priority | https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf |
| 12 | MapleStory | Drops in a 25 px row, 15 s owner | https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapleMap.java |
| 13 | Ultima Online | Criminal flag for corpse looting | https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs |
| 14 | Realm of the Mad God | Bag colour shows the best item | https://www.realmeye.com/wiki/loot-bag-types-and-contents/162 |
| 15 | Albion Online | 90 s priority window on corpses | https://player.one/albion-online-fray-patch-4-implements-black-zone-loot-changes-and-more-149725 |
| 16 | EVE Online | Wreck colours and suspect flag | https://wiki.eveuniversity.org/Salvaging |
| 17 | Diablo | 13-frame flip, sound mid flip | https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp |
| 18 | Diablo II | Drop sound frames per item | https://github.com/blizzhackers/d2data/tree/master/json |
| 19 | Diablo II: Resurrected | Native loot filter, first match wins | https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/ |
| 20 | Diablo III | Legendary clang, beam and minimap star | https://di.diablowiki.net/Legendary |
| 21 | Diablo IV | Loot Reborn cuts drop volume | https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/ |
| 22 | Path of Exile | Filter rules for size, colour, beam, icon, sound | https://www.pathofexile.com/item-filter/about |
| 23 | Path of Exile 2 | NeverSink's tier ladder | https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2 |
| 24 | World of Warcraft | Area looting | https://warcraft.wiki.gg/wiki/Area_Looting |
| 25 | World of Warcraft | Need, Greed and Pass history | https://warcraft.wiki.gg/wiki/Need_Before_Greed |
| 26 | Guild Wars 2 | Personal loot and chests over corpses | https://wiki.guildwars2.com/wiki/Loot |
| 27 | Shattered Pixel Dungeon | 400 ms arc, floor shadow, glow pulse | https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java |
| 28 | Flare | 600 ms flips and currency autopickup | https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt |
| 29 | Terraria | Rarity colours and coin merging | https://terraria.wiki.gg/wiki/Rarity |
| 30 | Minecraft | Pickup delay, merging, stack copies | https://minecraft.wiki/w/Item_(entity) |
| 31 | Enter the Gungeon | Chest colour before opening | https://enterthegungeon.wiki.gg/wiki/Chests |
| 32 | Vampire Survivors | Vacuum pulls every gem | https://vampire.survivors.wiki/w/Vacuum |
| 33 | Nuclear Throne | Fixed 2 s despawn blink | https://idntg.pages.dev/pickups |
| 34 | Mindustry | 200 ms item transfer with a side swing | https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java |

---

## 12. What remains unverified (and corrections)

**Corrections made during research** (checked in the verification note)
1. **Combat juice corpse timer.** Combat juice (feel #2) said a Tibia player corpse's first stage is 10 s [S3]. That is the monster corpse's owned stage. A Canary monster corpse is owned for 10 s, then rots 300 + 300 + 60 s, so a dragon corpse lasts 670 s, and ownership ends when the 10 s stage decays [V, S11, S12]. Player corpses have no owner and stay lootable for 1,200 + 1,200 s, then 1,200 s as bones [V, S12, S10].
2. **WoW open tagging.** The brief dated it to 2014 (Warlords). The shared tag for up to 5 ungrouped players arrived in patch 7.0.3 (2016); untapped mobs appeared earlier on the Timeless Isle (5.4) [V, S112].
3. **OSRS despawn.** 60 s private plus 120 s public is 180 s for tradeables; untradeables stay private for 180 s. [V, S48, S49].
4. **Walk-then-retry.** TFS retries after 400 ms and Canary quick loot after 300 ms; both are right for their codebases [V, S23, S8].
5. **OTClient licence.** Combat juice flagged it "None until the LICENSE is checked". The LICENSE file is MIT; only the GitHub API reports NOASSERTION [V, S38].
6. **Diablo II: Resurrected filter date.** Most sources give 11 February 2026 and one gives 4 March 2026 as server go-live; no official patch note was found [V, S92, S93, S94].
7. **Sandbox spec.** This report changes several spec numbers; the list is at the end of `SANDBOX-SPEC.md`.

**Single-source and derived values.** Tibia, MapleStory and Ragnarok numbers come from emulators (Canary, TFS, Cosmic, rAthena). RotMG bag colours came from RealmEye snippets [U, S75]. The SPD apex, Diablo flip milliseconds, Tibia loss odds and byte sizes are our arithmetic [I].

**Still unverified [U]**
- Diablo IV's loot filter date (28 April 2026) and its peek hotkey, from guides only [U, S98, S99].
- Albion's 33% item destruction, from search summaries of patch notes [U, S78].
- PoE allocation timers of 3 to 5 s, community reports [U, S109].
- FFXIV's 300 s roll window, player posts [U, S121].
- Dark and Darker container search times; the wiki tables are empty [U, S154].
- Official CipSoft owner duration beyond fan "about 10 seconds" [U, S43].
- Bounce, landing squash, landing dust, stagger, bag bump and counter roll-up: no source gave a number [I, notes 02, 03 and 10].
- No Godot build, phone or Chromebook was measured; the benchmark is Chromium Canvas2D [V, S5].

---

## 13. Prototype roadmap for Godot 4 (web, Compatibility)

1. **Measure first.** Run `lootbench.html` [S5] on a low-end Android phone and an older iPhone, then a 320x180 Compatibility export with 200, 600 and 1,000 atlas `Sprite2D` items, halos and `_draw()` labels, reading `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`.
2. **Server core.** Item GUIDs, one items table, the guarded move, pickups per 100 ms tick with the rotating rank, 20-byte adds over area of interest, and 0 to 300 ms of artificial latency from day one.
3. **Rules.** Owners with the 1.3 first-attack weight, the 15 s and 20 s stages, party open, quick loot nearby with Canary's messages, bag-full handling, boss reward chests.
4. **Presentation.** `LootTierStyle` Resources, corpse glint, ring-search spills, 400 ms arcs with shadows and stagger, halos, legendary beams, the label atlas and grid solver, fly to bag on `PICK_OK`.
5. **Audio and crowds.** An 8-voice loot pool, coin pitch streaks with `pitch_scale` in Web Sample mode, own, party and others tiers, then a 30-player boss test at 150 ms with LOD on and off.
6. **Death.** The blessing table, keep 3, the 60 s priority window, the death recap, flags and the player corpse channel, played in PvP tests before any tuning of drop chances.

---

## 14. Sources

Numbered for [S#] references, all from research notes 01 to 10 and the lead's verification note. "Snippet" or "search summary" means the page was not read in full. Code was read at branch heads on 2026-11-11.

**Series and our own work**
1. Kingsfoil Artifacts library: https://kingsfoil-artifacts.netlify.app
2. Game feel #1, NPCs and dialog: https://kingsfoil-artifacts.netlify.app/feel-npc-dialog-topdown-pixel.html
3. Game feel #2, Combat juice: https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel.html
4. Loot and Pickup Sandbox: `feel-loot-pickup-sandbox.html` (companion page)
5. Kingsfoil loot benchmark, our own measurement (November 2026): `studies/feel-loot-pickup/notes/bench/lootbench.html`, with `run.py`, `runall.sh`, `summarize.py`, `results-*.json`, `summary-table.md`, note `09-benchmarks.md` and `scratch-09/native_blur.py`. Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1, Chromium 153.0.8010.12 under Playwright; ANGLE Metal, Metal with a 6x CPU throttle, and SwiftShader. No phone was measured.

**Tibia: Canary, TFS and OTClient**
6. Canary `creature.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/creature.cpp
7. Canary `container.cpp`: https://github.com/opentibiabr/canary/blob/main/src/items/containers/container.cpp
8. Canary `game.cpp` (quick loot): https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
9. Canary `config.lua.dist`: https://github.com/opentibiabr/canary/blob/main/config.lua.dist
10. Canary `monster.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/monsters/monster.cpp
11. Canary `item.cpp`: https://github.com/opentibiabr/canary/blob/main/src/items/item.cpp
12. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
13. Canary `player.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/players/player.cpp
14. Canary `party.cpp`: https://github.com/opentibiabr/canary/blob/main/src/creatures/players/grouping/party.cpp
15. Canary `reward_chest.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/systems/reward_chest.lua
16. Canary `blessing.lua`: https://github.com/opentibiabr/canary/blob/main/data/libs/systems/blessing.lua
17. Canary `decay.cpp`: https://github.com/opentibiabr/canary/blob/main/src/items/decay/decay.cpp
18. Canary `object_category.hpp`: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/enums/object_category.hpp
19. Canary `auto_loot.lua`: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/data/scripts/talkactions/player/auto_loot.lua
20. Canary `configmanager.cpp`: https://github.com/opentibiabr/canary/blob/666a60f6fef803b043cbaf1c7b5fab219da9bfa9/src/config/configmanager.cpp
21. Canary `actions.cpp`: https://github.com/opentibiabr/canary/blob/main/src/lua/creature/actions.cpp
22. TFS `game.cpp`: https://github.com/otland/forgottenserver/blob/master/src/game.cpp
23. TFS `game.h`: https://github.com/otland/forgottenserver/blob/master/src/game.h
24. TFS `actions.cpp`: https://github.com/otland/forgottenserver/blob/master/src/actions.cpp
25. TFS `monster.cpp`: https://github.com/otland/forgottenserver/blob/master/src/monster.cpp
26. TFS `item.cpp`: https://github.com/otland/forgottenserver/blob/master/src/item.cpp
27. TFS `protocolgame.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
28. TFS `outputmessage.cpp`: https://github.com/otland/forgottenserver/blob/master/src/outputmessage.cpp
29. TFS `map.h` and `map.cpp`: https://github.com/otland/forgottenserver/blob/master/src/map.h
30. TFS `tasks.h`: https://github.com/otland/forgottenserver/blob/master/src/tasks.h
31. TFS `schema.sql`: https://github.com/otland/forgottenserver/blob/master/schema.sql
32. TFS `player.cpp`: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
33. TFS `drop_loot.lua`: https://github.com/otland/forgottenserver/blob/master/data/creaturescripts/scripts/drop_loot.lua
34. TFS `tile.cpp`: https://github.com/otland/forgottenserver/blob/master/src/tile.cpp
35. TFS `container.cpp`: https://github.com/otland/forgottenserver/blob/master/src/container.cpp
36. OTClient `protocolgameparse.cpp`: https://github.com/edubart/otclient/blob/master/src/client/protocolgameparse.cpp
37. OTClient `tile.h`: https://github.com/edubart/otclient/blob/master/src/client/tile.h
38. OTClient Redemption `quickloot.lua` and LICENSE: https://github.com/opentibiabr/otclient/blob/main/modules/game_quickloot/quickloot.lua
39. OTLand, clone items in TFS 1.2 (community report): https://otland.net/threads/urgent-clone-items-tfs-1-2.283122/post-2710745

**Tibia community and news**
40. TibiaQA, quick loot with regular controls: https://www.tibiaqa.com/34/how-to-use-quick-loot-with-regular-controls
41. TibiaQA, stacked corpses: https://www.tibiaqa.com/969/what-is-the-best-way-to-loot-when-monsters-get-stacked?show=22902
42. PCGamesN, Tibia Summer Update 2024: https://www.pcgamesn.com/tibia/summer-update-2024
43. TibiaQA, loot ownership about 10 s: https://www.tibiaqa.com/14771/if-i-dealt-damage-to-creature-will-get-loot-despite-of-how-long-has-passed
44. TibiaQA, Party Hunt Analyser: https://tibiaqa.com/8200/how-does-the-party-hunt-analyser-works
45. TibiaMaps loot splitter: https://tibiamaps.io/tools/loot
46. Vice, why Tibia took 25 years to get sound: https://www.vice.com/en/article/why-it-took-25-years-for-the-video-game-tibia-to-get-sound
47. TibiaWiki, Version 13 updates: https://tibia.fandom.com/wiki/Version_13_Updates

**Old School RuneScape and RuneLite**
48. OSRS Wiki, Drops: https://oldschool.runescape.wiki/w/Drops
49. OSRS Wiki, Items: https://oldschool.runescape.wiki/w/Items
50. OSRS Wiki, Loot beam: https://oldschool.runescape.wiki/w/Loot_beam
51. OSRS Wiki, Game tick: https://oldschool.runescape.wiki/w/Game_tick
52. OSRS Wiki, Player identification number: https://oldschool.runescape.wiki/w/Player_identification_number
53. OSRS Wiki, Death: https://oldschool.runescape.wiki/w/Death
54. OSRS Wiki, Items Kept on Death: https://oldschool.runescape.wiki/w/Items_Kept_on_Death
55. OSRS Wiki, Grave: https://oldschool.runescape.wiki/w/Grave
56. OSRS Wiki, Skull: https://oldschool.runescape.wiki/w/Skull_(status)
57. OSRS Wiki, Loot key: https://oldschool.runescape.wiki/w/Loot_key
58. OSRS Wiki, Bonecrusher: https://oldschool.runescape.wiki/w/Bonecrusher
59. OSRS Wiki, Mobile 6th Anniversary update: https://oldschool.runescape.wiki/w/Update:OSRS_Mobile_-_6th_Anniversary_Celebration
60. RuneLite `GroundItemsConfig.java`: https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsConfig.java
61. RuneLite `GroundItemsOverlay.java`: https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsOverlay.java
62. RuneLite `GroundItemsPlugin.java`: https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/GroundItemsPlugin.java
63. RuneLite `Lootbeam.java`: https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/grounditems/Lootbeam.java
64. rsprot `ObjAdd`: https://github.com/blurite/rsprot

**Ragnarok, MapleStory, Ultima Online, RotMG, Albion, EVE and other full loot**
65. rAthena `drops.conf`: https://github.com/rathena/rathena/blob/master/conf/battle/drops.conf
66. rAthena `mob.cpp`: https://github.com/rathena/rathena/blob/master/src/map/mob.cpp
67. rAthena `map.cpp`: https://github.com/rathena/rathena/blob/master/src/map/map.cpp
68. rAthena `pc.cpp`: https://github.com/rathena/rathena/blob/master/src/map/pc.cpp
69. rAthena `party.conf`: https://github.com/rathena/rathena/blob/master/conf/battle/party.conf
70. Cosmic `MapleMap.java`: https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapleMap.java
71. Cosmic `MapItem.java`: https://github.com/P0nk/Cosmic/blob/master/src/main/java/server/maps/MapItem.java
72. Cosmic `config.yaml`: https://github.com/P0nk/Cosmic/blob/master/config.yaml
73. meowdb, MapleStory Classic pet formulas: https://meowdb.com/msclassic/formulas/pets
74. ServUO `Corpse.cs`: https://github.com/ServUO/ServUO/blob/master/Scripts/Items/Corpses/Corpse.cs
75. RealmEye, loot bag types revision 162 (snippets): https://www.realmeye.com/wiki/loot-bag-types-and-contents/162
76. Player.One, Albion Into the Fray Patch 4: https://player.one/albion-online-fray-patch-4-implements-black-zone-loot-changes-and-more-149725
77. Albion Free Market, zones and flagging: https://albionfreemarket.com/articles/view/albion-online-guide-to-zones-and-flagging
78. ConsolePCGaming, Albion Rogue Frontier Patch 1 (search summary): https://consolepcgaming.com/albion-onlines-rogue-frontier-patch-1-notes
79. EVE University, Salvaging: https://wiki.eveuniversity.org/Salvaging
80. UOGuide, Insure: https://uoguide.com/Insure
81. UO.com, bless deeds: https://uo.com/wiki/ultima-online-wiki/player/bless-deeds/
82. EFT Ammo, Tarkov insurance guide: https://www.eft-ammo.com/wiki/escape-from-tarkov-insurance-guide
83. ConsolePCGaming, Dark and Darker Hotfix 55: https://consolepcgaming.com/dark-and-darker-hotfix-55-patch-notes

**Diablo, Path of Exile and other ARPGs**
84. devilutionX `items.cpp`: https://github.com/diasurgical/devilutionX/blob/master/Source/items.cpp
85. devilutionX `itemlabels.cpp` and LICENSE: https://github.com/diasurgical/DevilutionX/blob/master/Source/qol/itemlabels.cpp
86. d2data item tables: https://github.com/blizzhackers/d2data/tree/master/json
87. Diablo II FPS: https://diablo2.diablowiki.net/FPS
88. Battle.net, Diablo II magic items: https://classic.battle.net/diablo2exp/items/magic.shtml
89. Battle.net, Diablo II controls: https://classic.battle.net/diablo2exp/basics/controls.shtml
90. Blizzard forums, D2R label cap: https://us.forums.blizzard.com/en/d2r/t/why-is-it-so-impossible-to-at-least-increase-the-max-item-labels-on-ground/166302
91. Blizzard forums, D2R unique colour: https://us.forums.blizzard.com/en/d2r/t/unique-item-color-is-hard-to-see-can-it-be-changed/90703
92. Diablo Bytes, D2R patch 3.0 notes: https://www.diablobytes.com/d2-resurrected/news/patch-notes-3-0/
93. Icy Veins, D2R loot filter and stash tabs: https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/
94. TweakTown, Diablo 2 loot filters: https://www.tweaktown.com/news/110129/diablo-2-gets-loot-filters-stash-tabs-and-built-in-holy-grail-tracker-in-new-25-expansion/index.html
95. Diablo Wiki, Legendary (Diablo III): https://di.diablowiki.net/Legendary
96. BlizzCon 2013 Diablo III systems panel transcript: https://blizzplanet.substack.com/p/blizzcon-2013-diablo-iii-gameplay-systems-crusader-panel-transcript
97. Icy Veins, Diablo IV Loot Reborn preview: https://www.icy-veins.com/d4/news/diablo-4-season-4-loot-reborn-official-preview/
98. Icy Veins, Diablo IV loot filter: https://www.icy-veins.com/d4/news/goodbye-screen-clutter-diablo-4-is-getting-a-loot-filter/
99. Diablo Bytes, Lord of Hatred loot filter: https://www.diablobytes.com/diablo-iv/lord-of-hatred/loot-filter/
100. Mein-MMO, Diablo IV pre-filter limit: https://mein-mmo.de/en/blizzard-says-they-talk-about-loot-filter-in-diablo-4-admit-their-current-system-is-slowly-failing,1524278
101. Blizzard forums, Diablo Immortal rune beam confusion: https://us.forums.blizzard.com/en/diablo-immortal/t/loot-bug-legendary-drop-vanishes-as-soon-as-they-come-able-to-see-orange-glow-for-few-seconds-no-legendary-drops-from-open-world/5811
102. Ginx, Diablo Immortal auto pickup: https://ginx.tv/en/diablo/diablo-immortal-auto-pick-up-items-enable
103. Path of Exile item filter reference: https://www.pathofexile.com/item-filter/about
104. NeverSink filter, PoE1: https://github.com/NeverSinkDev/NeverSink-Filter
105. NeverSink filter, PoE2: https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2
106. PoE forum, label piles: https://www.pathofexile.com/forum/view-thread/2910607
107. PoE Wiki, Desync: https://poewiki.net/wiki/Desync
108. PoE forum, Lockstep: https://ru.pathofexile.com/forum/view-thread/1262596
109. PoE Wiki, Partying: https://www.poewiki.net/wiki/Partying
110. Twinfinite, Borderlands 3 tips: https://twinfinite.net/guides/borderlands-3-tips-and-tricks-for-beginners/2/
111. Game8, PoE2 controls: https://game8.co/games/Path-of-Exile-2/archives/488429

**Modern MMOs and dupes**
112. Warcraft Wiki, Tap: https://warcraft.wiki.gg/wiki/Tap
113. Warcraft Wiki, Loot: https://warcraft.wiki.gg/wiki/Loot
114. Warcraft Wiki, Master looter: https://warcraft.wiki.gg/wiki/Master_looter
115. Warcraft Wiki, Need Before Greed: https://warcraft.wiki.gg/wiki/Need_Before_Greed
116. Warcraft Wiki, Area Looting: https://warcraft.wiki.gg/wiki/Area_Looting
117. Warcraft Wiki, Bind on Pickup: https://warcraft.wiki.gg/wiki/Bind_on_Pickup
118. Inven Global, master loot removal: https://www.invenglobal.com/articles/6226/master-loots-removal-deals-another-blow-to-wows-dwindling-sense-of-community
119. AzerothCore `mod-aoe-loot`: https://github.com/azerothcore/mod-aoe-loot
120. Guild Wars 2 Wiki, Loot: https://wiki.guildwars2.com/wiki/Loot
121. FFXIV forum, Loot Lockout: https://forum.square-enix.com/ffxiv/threads/376344-Loot-Lockout
122. PC Gamer, New World wealth transfers disabled: https://www.pcgamer.com/amazon-disables-new-world-wealth-transfers-to-fight-gold-dupe-exploit
123. Diablo Wiki, Blizzard vs hacked items: https://diablo2.diablowiki.net/Blizzard_vs._Hacked_Items
124. 2b2t Wiki, duplication glitch: https://2b2t.miraheze.org/wiki/Duplication_glitch

**Pixel games and roguelites**
125. Shattered Pixel Dungeon `ItemSprite.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/ItemSprite.java
126. Shattered Pixel Dungeon `Toolbar.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/ui/Toolbar.java
127. Flare `loot.txt`: https://github.com/flareteam/flare-game/blob/master/mods/fantasycore/engine/loot.txt
128. Flare `LootManager.cpp`: https://github.com/flareteam/flare-engine/blob/master/src/LootManager.cpp
129. Flare loot animations: https://github.com/flareteam/flare-game/tree/master/mods/fantasycore/animations/loot
130. Mindustry `Fx.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Fx.java
131. Terraria Wiki, Rarity: https://terraria.wiki.gg/wiki/Rarity
132. Terraria Wiki, Coins: https://terraria.wiki.gg/wiki/Coins
133. tModLoader `Player.cs.patch`: https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/Player.cs.patch
134. Minecraft Wiki, Item (entity): https://minecraft.wiki/w/Item_(entity)
135. Stardew Valley Wiki, Magnetic Radius: https://stardewvalleywiki.com/Magnetic_Radius
136. Nuclear Throne pickups guide (fan): https://idntg.pages.dev/pickups
137. Enter the Gungeon Wiki, Chests: https://enterthegungeon.wiki.gg/wiki/Chests
138. Enter the Gungeon Wiki, Money: https://enterthegungeon.wiki.gg/wiki/Money
139. Terraria Wiki, Void Bag: https://terraria.wiki.gg/Void_Bag

**Research and design writing**
140. Larche et al., loot box opening and arousal: https://pmc.ncbi.nlm.nih.gov/articles/PMC7882574
141. Clark et al. (2009), near misses: https://www.eurekalert.org/news-releases/653015
142. Zagal, Björk and Lewis (2013), Dark Patterns in the Design of Games: https://research.chalmers.se/en/publication/177148
143. Kao et al. (CHI 2024), How does juicy game feedback motivate?: https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d
144. Hicks et al. (CHI PLAY 2024), Juicy Audio: https://eprints.staffs.ac.uk/8527/1/3677084.pdf
145. Jonasson and Purho (GDC Europe 2012), Juice it or lose it: https://gdcvault.com/play/1016789/Juice-It-or-Lose
146. The Reward for Luck (CHI 2022): https://www.robertxiao.ca/research/reward-for-luck/
147. Raph Koster, why are corpse runs bad?: https://www.raphkoster.com/2008/11/17/why-are-corpse-runs-bad/
148. Game Accessibility Guidelines, avoid repeated inputs: https://gameaccessibilityguidelines.com/avoid-repeated-inputs-button-mashing-quick-time-events/
149. Vinzius, coin pickup sound in Godot 4: https://www.vinzius.com/snippets/coin-pickup-sound-effect-godot-4/
150. HostedGG, gacha pull colour tells: https://hostedgg.com/blog/gacha-pull-reveal-color-culture

**Godot and gems**
151. GLoot: https://github.com/peter-kish/gloot
152. Godot 4.4 beta 1 (batching, 2D instance uniforms): https://godotengine.org/article/dev-snapshot-godot-4-4-beta-1/
153. Godot web export progress report (4.3): https://godotengine.org/article/progress-report-web-export-in-4-3/
154. Dark and Darker Wiki, containers (tables empty): https://darkanddarker.wiki.spellsandguns.com/Containers-Ruins
