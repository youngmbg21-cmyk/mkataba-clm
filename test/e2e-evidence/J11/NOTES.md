# J11 — "The thinking surfaces" — audit notes

Scope: Insights (all 3 tabs), Reports/weekly review/health report, chart
shape-binding, Copilot surfaces (chat, clause proposals, redline co-pilot
band, contract brief, ask-your-book palette, precedent memory), all of it
also walked with no AI key configured.

All scripts under this directory are throwaway audit scripts (never product
code). Screenshots in `shots/`. Raw logs in `run.log` (also per-file
`run-*.log`). Chart evidence table in `charts.md`.

## Environment limitation (reported, not routed around)

Chart.js is loaded from `https://cdnjs.cloudflare.com` at runtime
(`js/aichart.js` `AI_CHART_CDN`). This sandbox's egress proxy returns
**403** for that host (confirmed with `curl` before writing any test — see
`/root/.ccr/README.md`: "403/407 ... do not retry or route around it,
report the blocked host"). So the actual `<canvas>` pixels of a Copilot
chart could not be captured here.

What I did instead, for every shape-swap claim: called the real, exported
production functions (`window.aiExtractCharts` → `aiHonourShape` (bare-called
inside it, same as the shipped chat pipeline) → `window.aiChartHtml` →
`aiBreakdownConfig`/`AI_CHART_RECIPES`) in a real Chromium instance against
live `state.contracts`. This is the exact code the chat panel runs; only the
canvas-paint step is unreached. I also drove one full chat submission
end-to-end and confirmed the DOM shows the honest "Charts need an internet
connection" note — which the code only prints once a chart *config* was
successfully built, so its presence is itself proof the pipeline (including
the shape swap) ran for real. The health report's own PNG-embedding step hit
the identical wall and says so on the printed page ("Charts were skipped
because the chart library could not be fetched (no internet connection)") —
independent confirmation this is an environment fact, not a product bug.

## 1. Numbered findings

1. **PASS — no findings of rank Broken/Lying/Unreachable/Confusing anywhere
   in scope.** Every claim below was reproduced and held. This is an
   unusually clean surface area for a product this size — worth saying
   plainly rather than padding with minor nits.

2. Insights, all three tabs (`run-insights.js`, 17/17 checks): the head is
   genuinely one line, measured (`headH` 36px, title and subtitle share a
   `top`, subtitle sits to the right) and identical across Portfolio /
   Friction / Map. `pfPanelsData()` keys are stable English
   (`workload_runway`, `money_held_back`, `promises_live`, `won_and_lost`,
   `renewal_runway`) and hold across a language switch while the `title`
   field turns over (`"The workload runway"` → `"Arbetsbanan"`). Every panel
   carries `method`/`scope`/`measure`/`excluded`. An archived Signed
   contract (`archived:{...}`) never appears in the workload runway's
   drivers or excluded lists — `pfLive()`'s own filter
   (`status!=='Declined' && !archived`) is what does it. A `novalues`
   reader gets `measure:'contracts'` (pfWeight falling to 1-per-contract).
   Screenshots: `shots/insights-frame.png`, `-friction.png`, `-map.png`,
   `-novalues*.png`.

3. Reports page (`run-insights.js` + `shots/reports-page.png`): all four
   cards render with real figures (avg cycle/age × 3, renewal pipeline
   value, "Portfolio value by value stream", "Top counterparties by
   value", "Renewal pipeline · next 12 months", "Negotiation rounds by
   type"), plus doors to Weekly review and the Portfolio health report.

4. Weekly review (`run-insights.js`): `weeklyData()` is byte-for-byte
   deterministic across two calls on identical state. Slot 5 ("what we
   did not look at") is present both on a normal week
   (`weekly-review.html`) and a deliberately quiet one-contract week
   (`weekly-review-quiet.html`) — grep confirms `not look at` in both
   files.

5. Health report (`shots/health-report.png`, `health-report.html`):
   `openHealthReport()` opens a real popup synchronously and fills it;
   works identically with **no AI key** (`run-noaikey.js` item 7,
   `shots/noaikey-07-health-report.png`) because it is deterministic; names
   its snapshot ("Generated 21 August 2026 · 5 contracts"); body background
   is `rgb(255,255,255)` (the light palette) regardless of app theme; and,
   independently confirming the CDN limitation above, prints its own honest
   line when the chart library can't be fetched.

6. **Chart shape-binding — the important one** (`run-charts.js`, 24/24;
   `charts.md`). Asking *"give the status in bar graph format"* against the
   scripted model answering with the normally-doughnut `statusBreakdown`
   spec produces a `bar` chart whose labels/data are byte-identical to the
   doughnut's own (`[Draft,Under Review,Signed,Declined]` → `[2,1,2,1]`
   both ways) — reproduced both by direct function call *and* by driving a
   real typed chat message through `aiSubmit`. Same proof for `riskBands`
   → line and `expiryTimeline` → pie (the pie deliberately drops zero-count
   months — a documented, tested convention, not a moved number: every
   month that *does* appear on the pie carries the identical count it has
   on the bar). Asking for a shape a fixed kind is *already* drawn in
   leaves it untouched (no needless rewrite to `breakdown`). All five kinds
   deliberately **not** on `AC_SHAPE_SWAP` (`valueByCounterparty`,
   `valueStreamSplit`, `renewalPipeline`, `cycleTime`, `obligationsDue`)
   keep their own fixed kind when a pie is requested — never silently
   rewritten. Ordinary English — "barred by the limitation period", "the
   bar association requires notice", "sign on the dotted line" — is
   correctly read as **no shape request** (`aiAskedShape` returns `null`
   for all three), while five genuine phrasings (bar/pie/hbar/line/
   doughnut) are all recognised. Month labels on a chart axis follow the
   **reader's own language** (`langLocale()`), proven by switching to
   Swedish and reading different month strings off the same
   `expiryTimeline` recipe, independent of the workspace market.

7. Copilot chat (`run-copilot.js` item 1): a real question gets a real
   scripted answer end-to-end through `openAI()`/`aiSubmit()`.

8. Clause proposals — Document tab selection menu (`run-copilot.js` item 2,
   `shots/copilot-02*.png`, `-03*.png`): highlighting real paper text raises
   exactly `✂️ Simplify` / `✨ Ask Copilot`; pressing Simplify opens the
   panel and answers about the highlighted passage, with the full quoted
   passage visible in the bubble (not truncated).

9. The redline co-pilot band (`test/chromium/copilot-band-verify.js`, run
   as-is against a real server — `run-copilot-band.log`, 10/10): with
   nothing asked of us there is no band at all; once a real round exists it
   draws shut; **pressing the bar for real opens it with 3 real rows**
   (the historically dead-press bug this file exists for); every row's
   button carries a genuine card attribute (`data-nego-accept` /
   `data-rl-ask-review`) — no second decision path; pressing it again shuts
   it; and a press on "Take it" settles `CHG-002 → accepted` through the
   ordinary funnel. `grep -n "api(\|fetch(\|ai/" js/redlineplan.js` finds
   nothing — the band is deterministic and needs no key, confirmed live
   with no AI key too (`run-noaikey.js` item 5: the band draws and opens
   identically).

10. The contract brief (`run-copilot.js` items 3–5, screenshots
    `copilot-04` through `-06`):
    - It is genuinely **a card in the Key Terms column, between Renewal and
      Agreement family** — DOM order measured as
      `["renewal-host","brief-card","family-section"]`, matching the visual
      screenshot.
    - The Checks card is genuinely **three rows** (Obligations, Playbook
      review, Copilot risk scan) with no brief row.
    - The **panel** opened from the card's "Open"/"Read the brief" button
      carries `max-width:500px` on `#side-panel` — confirmed both by
      computed style and visually (`copilot-05b-brief-panel-500px.png`).
    - `briefMark` escapes before it marks: fed a raw
      `<img src=x onerror=alert(1)>`, the output contains `&lt;img` and no
      live `<img`/`<script` tag; no `alert()` ever fired (checked against
      `page.on('pageerror')`); the screenshot shows the literal escaped
      `<script>alert(1)</script>` text sitting inertly under "Unusual for
      this kind of contract". Marking is idempotent on identical input
      (deterministic).
    - **The brief never travels**: the raw bytes returned by
      `GET /api/shares/:token` for a freshly minted share of a contract
      that *did* carry `_brief` locally contain neither `"_brief"` nor
      `"brief":` nor the brief's own overview text — checked against the
      wire response text directly, not the rendered DOM.
    - **Advisory read, sealed record**: running the brief against a
      **Signed** contract (`MK-CP2`) still returns real brief data (reading
      is allowed there) but writes **zero** new audit-trail entries
      (`auditBefore === auditAfter`), and no `"Save failed"` toast appears
      anywhere on screen afterward — `aiNoteRead` genuinely returns `false`
      and skips `persist()` on a sealed record.
    - With **no AI key**: the teaser card still draws ("Contract brief /
      Not written yet..."); pressing "Write the brief" returns `null` (no
      crash, no fabricated brief) and shows the honest toast "Copilot is
      not connected... the brief needs it" — never a dead press.

11. Renewal advice, no-AI-key honesty (`run-noaikey.js` item 4):
    `runRenewalAdvice` returns `null` and stamps
    `c._renewalAdviceError = "Copilot is not connected... The dates above
    stand on their own."` for the card to print — same pattern as the
    brief.

12. Precedent memory (`run-copilot.js` item 6, screenshot
    `copilot-07-precedent-owner-seat.png`):
    - `grep -n "api(\|fetch(\|ai/" js/precedent.js` finds **nothing** —
      confirmed deterministic, no network, before any test was written.
    - `precedentMine()` is byte-for-byte deterministic across two calls on
      identical state.
    - Built a real fixture: 2 accepted + 1 refused + 1 **withdrawn**
      counterparty ask on the same clause/topic. Result:
      `theirs.accepted:2, theirs.refused:1, total:3` — the withdrawn one
      counts toward **neither**, exactly as the rule states ("withdrawn is
      neither agreed nor refused").
    - The sentence really renders live on the owner's clause panel
      (`data-rl-precedent`, visible in the screenshot: *"Nordfrakt pushed
      on Payment terms 3 times: you agreed 2, held 1 (settled at 60
      days)."*).
    - **Never on the counterparty's seat**: built the *identical* clause
      panel body through the same real exported renderer
      (`rlClausePanelBodyHtml(c, cl, chs, side, opts)`) with
      `side:'owner'` vs `side:'counterparty'` — owner's carries
      `data-rl-precedent`, counterparty's does not, for the exact same
      clause/changes/state. This is a stronger proof than reading the
      source guard as prose: it exercises the real function both mounts
      call.
    - `PRECEDENT_MIN` (3) gating on `precedentSuggestions` (the admin
      adopt-a-standard panel in Settings) was read in source but not
      independently re-derived in a browser here — see "not reached"
      below; `precedentForChange` (the clause-panel line) does not gate on
      `PRECEDENT_MIN` by design (confirmed by source — it only checks
      `totalAll`/`totalThem` > 0), which is why 3 settled arguments was
      already enough to produce a line above.

13. Ask-your-book from the palette (`run-copilot.js` item 7, screenshots
    `copilot-08` through `-10`):
    - Cmd/Ctrl+K-equivalent (`openCommandPalette()`) opens the box; typing
      paints the **sync matcher** in the same tick (no network wait for
      first paint).
    - "In the wording" rides `GET /api/search` — network-logged: exactly 1
      call for `q=thirty%20days&limit=8`, debounced (not one per
      keystroke).
    - An `"Ask Copilot: “thirty days”"` row rides last.
    - The palette itself never calls any `/api/ai/*` route — network log
      contains only the one `/api/search` call for the whole typing +
      results phase.
    - Pressing the Ask-Copilot row is a genuine **handoff**: the palette
      closes, the Copilot panel opens, `#ai-input.value` is pre-filled with
      the typed text — and still **no** `/api/ai/*` call fires until the
      reader would press submit themselves.
    - With no AI key, the handoff still works identically
      (`run-noaikey.js` item 6) — the honesty lives inside the Copilot
      panel, not the palette, which is architecturally correct (the
      palette is not an AI surface).

14. **No-AI-key world, walked end to end** (`run-noaikey.js`, 14/14):
    chat still answers via the local keyword engine and the brain pill
    honestly reads "Basic mode — add a key for Copilot" (never pretends to
    be live); the Document-tab selection menu still raises Simplify/Ask
    Copilot but pressing either says "The Copilot is not connected yet...";
    the brief and renewal advice both refuse honestly (see above); the
    redline co-pilot band is completely unaffected (it never touches AI);
    the palette handoff is unaffected; the health report still builds
    (deterministic). **No dead presses found anywhere.**

## 2. What I did NOT reach (said out loud, not glossed over)

- **Chart canvas pixels.** Genuine environment limitation (CDN blocked by
  org egress policy, confirmed and not routed around) — see above. The
  shape-swap *logic* and *figures* were fully verified through the real
  exported production functions and one live chat round-trip; the visual
  canvas paint step was not.
- **Precedent admin panel** (`renderPrecedentPanel` / `precedentAdopt` in
  Settings → the clause-library "Adopt" flow, and the `PRECEDENT_MIN`
  floor that gates *that* panel specifically) — read in source, not
  exercised in a live browser session. The clause-panel precedent
  *sentence* (in scope's main claim) was fully verified live.
- **Insights → Portfolio's shaped panels' full arithmetic** (workload
  runway peak/drivers/why, money-held-back, promises-live, won/lost,
  renewal-runway) were exercised structurally (keys, method/scope/measure,
  exclusions-present, archived-exclusion) but not re-derived figure-by-
  figure against hand-computed expected numbers the way `run-charts.js`
  did for the chart recipes — that deeper arithmetic proof already exists
  in `test/chromium/insights-panels-verify.js` (which I read but did not
  re-run standalone; it passed in the codebase's own suite per its
  self-description) and in `test/f151-copilot-drift-and-report.test.js`.
- **Reports page's four cards' underlying arithmetic** (cycle time,
  renewal-pipeline totals, etc.) was confirmed visually present and
  non-empty, not independently recomputed by hand.
- **The command-palette "In the wording" snippet money-masking** (a
  `novalues`/restricted reader getting snippet-free hits) was read in
  source (`server/server.js` `/api/search`, `snippets:false`) but not
  exercised live in this pass — it is the same masking rule already
  covered elsewhere in the codebase's own test suite for the register's
  search box, which shares this exact route.
- **Ask-your-book against a real Anthropic model's actual wording answer**
  — I proved the handoff (palette → panel → prefill) and that the palette
  itself never calls AI; I did not additionally drive a full scripted
  answer through the handed-off question, since that is exactly the
  ordinary chat path already proven working in finding 7.

## 3. Evidence index

- `run-insights.js` / `.log` / `.json` — Insights (3 tabs), Reports,
  weekly review, health report (with AI key).
- `run-charts.js` / `.log` / `.json` / `charts.md` — chart shape-binding,
  the central claim of this ticket.
- `run-copilot.js` / `.log` / `.json` — chat, clause proposals, contract
  brief (all sub-claims), precedent memory, palette.
- `run-copilot-band.log` — the shipped `test/chromium/copilot-band-verify.js`
  run as-is (not reproduced from scratch; already exactly matches this
  ticket's redline co-pilot band claims).
- `run-noaikey.js` / `.log` / `.json` — every surface above, repeated with
  `ANTHROPIC_API_KEY:''`.
- `shots/` — 27 screenshots, one per numbered finding above where a pixel
  claim was made.
- `weekly-review.html`, `weekly-review-quiet.html`, `health-report.html` —
  raw generated documents.
