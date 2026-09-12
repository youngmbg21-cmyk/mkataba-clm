# ONE COPILOT, ONE FIGURE — five fixes, in order

**WRITTEN 12 Sep 2026, morning. The owner's instruction: *"Add this to your list of fixes: align the copilot in insights with the regular copilot as well as they are still not on the same page."* Recorded below with the three fixes proposed the same morning; nothing here is coded until the owner says go.**

Measured against the code, not guessed. Line numbers are starting points.

## What the owner saw

- Home tile: 159 live agreements, SEK 833.01M "active value under management".
- Main Copilot ("what is the value of all the contracts under management?"): SEK 833,005,893 across 159 active (excluding 2 Declined); "4 additional contracts valued in KES have no exchange rate".
- Insights → Contract graph, same question a minute later: 851,005,893 SEK across 161 (including the 2 Declined); "excludes 1 contract with a missing exchange rate".
- Main Copilot ("list all the contracts inside hati"): "The Copilot engine could not be reached just now, so this is a basic answer" and a keyword match on "want, list, inside, hati"; then "I wasn't able to finish that".

## Why

1. **"Value under management" is not defined anywhere the model can read it.** The Home tile defines it in code (`hmDashSlices`: not archived, not Declined, converted through `fxHomeValue`, what has no rate counted). The chat brain's system line says only "161 contracts (47 Signed, 33 Under Review, 79 Draft, 2 Declined)" and hands the model `list_portfolio`, whose converted total is over WHATEVER filter the model chose; the Insights page also hands it `graphSays`' per-stream in/out/net table. So the model picks a definition each time — 159 once, 161 the next — and the left-out count comes from whichever table it read. The graph tab's map-command route (`/api/ai/graph`) got the one figure on 12 Sep (`graphPortfolioFigures`); the QUESTION path on the same panel (`intelChatAsk` → `copilotAsk`) is the main brain and did not.
2. **Five turns per question, forty rows a page** (`for (let step = 0; step < 5; step++)`, `copilotList`'s 40): a book of 161 needs five pages and a sixth turn to answer, so a plain "list everything" gives up with "I wasn't able to finish that".
3. **The fallback misleads**: when the engine call fails (provider error, per-person rate limit, or the daily spend cap — the browser cannot tell which), the browser answers with a keyword search dressed as an answer.
4. **No shape for a list**: the chat answers with prose and citation cards; a numbered two-column list has nowhere to land, and the Contracts page already is that list, with the count in its head.

## The fixes, in order

**PHASE 1 — ONE FIGURE, EVERY BRAIN.** `graphPortfolioFigures` (server) becomes `portfolioFigures(ctx)` and its sentence rides `buildCopilotSystem` (the chat brain's system block) exactly as it rides the graph route; the browser's local brain (`_localSystem`) carries the same sentence from `aiPortfolioSnapshot`, which already computes live/total the Home tile's way. The sentence DEFINES the term: "value under management = the live agreements (not declined, not archived), each converted to the workspace currency at the admin's rate; what has no rate is counted and said". Rule: quote it for any workspace-wide count or total; `list_portfolio` totals are for FILTERED sets. Walls: money only with canViewValues; the reader's own scope. Net: f299 (11) widened to the chat route; f305 pins the two hosts' sentences equal.

**PHASE 2 — A REQUEST FOR THE WHOLE BOOK IS A COUNT AND A DOOR.** One rule in both brains' HOW TO WORK: for "list all" / "how many" / "everything", call `list_portfolio` once, quote the true total, cite the first page, and say the Contracts page holds the full list (the answer card's existing "Open these in Contracts" door, `aiWorklistHtml`). Never page through the book to list it in chat.

**PHASE 3 — EIGHT TURNS.** The chat loop's ceiling 5 → 8 on both chat routes (streaming and plain), so a genuine multi-page read of a filtered set can finish. The 40-row page stays (the owner's wall).

**PHASE 4 — THE FALLBACK SAYS WHY.** The server's error carries a `kind` (provider · rateLimit · spendCap · noKey); the browser's stand-in answer names it in one sentence (`ai_engine_unavailable_*`), and for a listing question offers the Contracts door instead of a keyword match. The keyword search stays for a real outage.

**PHASE 5 — THE INSIGHTS PANEL IS THE SAME BRAIN, SAID OUT LOUD.** Its question path already is (`copilotAsk`); its map-command path (`/api/ai/graph`) stays a separate call for filter/group/highlight, and both now read the same figure (phase 1). Assert in f299 that the graph route's figures sentence and the chat brain's are one function's output.

**NOT IN SCOPE**: a reference-number range filter ("MK-101 to MK-397") — a new `where` key; the owner's call. A table answer type in chat — the Contracts page is the table.
