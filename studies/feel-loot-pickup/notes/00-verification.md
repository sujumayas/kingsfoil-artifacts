# Lead's own checks and corrections (read before writing the report)

## Newest-year claims, checked by web search on 2026-11-11
- Diablo II: Resurrected native loot filter arrived with the Reign of the Warlock expansion (patch 3.0). Most sources give 11 Feb 2026; one gives 4 Mar 2026 as server go-live. It reads a plaintext Filter.d2lf file, rules are checked in order and the first match wins, with hot-swap added later. Sources are fan sites and press, with no official patch note found: https://www.diablobytes.com/d2-resurrected/news/patch-notes-3-0/ , https://www.icy-veins.com/d2/news/d2r-reign-of-the-warlock-loot-filter-stash-tabs/ , https://www.tweaktown.com/news/110129/diablo-2-gets-loot-filters-stash-tabs-and-built-in-holy-grail-tracker-in-new-25-expansion/index.html . Tag it [V] with the press sources and note "date varies by source".
- Diablo IV loot filter launched with the Lord of Hatred expansion on 28 Apr 2026 as a free update, according to one guide. It sits under Options > Gameplay and has a toggle hotkey to peek at hidden loot. I found no official patch note: https://www.icy-veins.com/d4/news/goodbye-screen-clutter-diablo-4-is-getting-a-loot-filter/ , https://www.diablobytes.com/diablo-iv/lord-of-hatred/loot-filter/ . Tag the date [U].

## Corrections to earlier studies and to the brief
- Combat juice (feel #2) said a Tibia "player corpse's first stage is 10 s". Notes 04 and 05 show that is the monster corpse's owned stage. A Canary monster corpse is owned for 10 s, then rots 300 + 300 + 60 s. Player corpses have no owner and stay lootable for 1200 + 1200 s, then 1200 s as bones. List this in §12.
- The brief (CONTEXT.md) said WoW opened mob tagging in 2014 (Warlords). Note 04 found the open-world shared tag for up to 5 ungrouped players arrived in patch 7.0.3 (2016), with earlier free-for-all mobs on the Timeless Isle (5.4). Use 7.0.3.
- TFS retries a walk-to-pickup after 400 ms and Canary quick loot after 300 ms. Both are right for their codebases.
- OSRS despawn: 60 s private + 120 s public = 180 s for tradeables. Untradeables stay private for 180 s. This settles the "2 or 3 minutes" wiki conflict in note 01.
