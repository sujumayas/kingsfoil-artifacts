# 00. Verification of recent-product claims (lead author, 13 Nov 2026)

Spot checks of the newest claims in the research notes, done with fresh web searches after the agents finished.
The report writer must apply these.

| Claim in notes | Check | Verdict for the report |
|---|---|---|
| "PartyKit hosted platform shut down 23 Oct 2026" (11-gems) | No shutdown notice found. PartyKit docs still describe the hosted platform; Cloudflare acquired PartyKit and said existing projects keep working (blog.partykit.io/posts/partykit-is-joining-cloudflare, blog.cloudflare.com/cloudflare-acquires-partykit). Other 2026 shutdowns exist (Unity Multiplay 31 Mar 2026, Hathora wind-down, Zeabur from 1 Dec 2026) and may have been conflated. | Write "[U]: a shutdown was reported by one note and could not be confirmed; PartyKit code is MIT and runs on Cloudflare". Do not state the shutdown as fact. |
| "Vercel WebSockets available on all plans (docs 2026-08-10)" (09-race-infrastructure) | Vercel docs (vercel.com/docs/functions/websockets, updated 6 Jul 2026) and changelog describe WebSocket support in Vercel Functions as **public beta**; it requires Fluid Compute (default for projects created on or after 23 Apr 2025); connections close when the function hits its max duration; Python support added 23 Jul 2026. One third-party site says GA. | Write "public beta as of July 2026, needs Fluid Compute, a connection ends at the function's max duration". Tag [V, vendor]. |
| "Trackmania Weekly Shorts author time capped at 20 s" (06-map-design) | Confirmed: doc.trackmania.com/create/map-review/weekly-shorts-guidelines and the news post (trackmania.com/news/8560) set 20 s, down from a 10 to 35 s range, with "Too Long" and "Hard AT" review labels, in effect 10 Mar 2025. | Keep, [V]. |
| "Ultimate Chicken Horse 1.13.13 (19 May 2026) adds blocks" (04-elements) | The 10th anniversary "Annifursary" update (v1.13.13, reported 21 May 2026 by Game*Spark) added Fox and Platypus, Space Station and Picture Frame levels, and new blocks including a falling block (cleverendeavourgames.com/changelog, /annifursary-update). The sequel Ultimate Sheep Raccoon (2026) is a different game: v1.3 Feb 2026 and v1.6 Jul 2026 added its own blocks. | Keep, date it "May 2026", and never mix in Ultimate Sheep Raccoon numbers. |

Still unverified after the gap round (keep as [U] in §12): Dustforce in-game replay browsing of any leaderboard entry;
the "10 million LBP levels" figure (8 million is the best verified; Wikipedia says "over 10 million" at shutdown);
Celeste Seeker and Badeline chaser speeds (recalled from decompiled code); Sonic camera window sizes (Sonic Retro
pages were behind a bot wall); the "fun at 70% completion" claim (no primary source).
