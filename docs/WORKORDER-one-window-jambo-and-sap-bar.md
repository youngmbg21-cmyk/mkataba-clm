# WORK ORDER — One window for Jambo where there is nothing else to show, and the SAP-way top bar

**Status: AGREED, NOT BUILT (owner, 24 Oct 2026: "SAP way. add it to the job order but do not implement yet, just summarize what is to be built").**
Nothing here is built until the owner says so in the chat. Pushing and opening a pull request each need the owner's yes (CLAUDE.md, Scope rules).

Two parts. Each is the owner's yes to what is written here; anything beyond it goes to the owner first.

---

## Part A · One window for Jambo where the panel's front page is only his words

**The owner's words (24 Oct 2026):** "logically it makes no sense to have a window that is empty which you ask a question it takes you to another window that is jambo. If the window has information like the dossier page then that is excusable but otherwise it makes no sense." Then: "settings has no information either", "even requests has no information in the overview", and "yes, go ahead" to the list below.

**Reverses (for these panels only):** the owner's pick of 19 Oct 2026, "A Jambo tab" (JAMBO AS A TAB YOU FLIP TO, AND BACK). Replace the CLAUDE.md MAP line in the same change; the story goes to MAP-HISTORY.

### The rule
- A right-hand panel whose front page is ONLY Jambo talking (a greeting, a line or two from the page's counts, suggested questions) is ONE window: the conversation. His greeting is its first message; the reader's questions and his answers follow under it.
- A panel whose front page holds REAL INFORMATION (as the Dossier does) keeps its two tabs, Overview and Jambo, as today.

### Which panels (measured in the browser, 24 Oct 2026)
One window (only his words):
- Home: the **Board** face, the **Explorer** face, the **Contracts** place with no contract chosen, the **Calendar** face.
- The list panel with NO row chosen: **Approvals & signing**, **Obligations** (it opened the week's panel), **Requests**, **Import**, **My notes**.
- **Settings** (You and Company).

Keeps two tabs (real information):
- A contract's **Dossier** and its faces (Redlines, Before you sign, Send, the middle).
- **Our standards**, **Templates**, **People**, **Parties** (each shows the chosen item's facts).
- Any list panel WITH a row chosen (its contract's facts and what it needs).

To check before building, and ask the owner if either does not fit:
- **Negotiations**: the measuring script did not find its side panel.
- A list panel with a row chosen on **Contracts, Approvals, Obligations, Requests**: the test workspace had no rows on most of them, so the "real information" side was not seen.

### What changes on a one-window panel
1. No Overview / Jambo tabs.
2. No page-name word beside them ("Board", "Your settings", "Requests"…): it looks like a tab and nothing is behind it.
3. No trail line ("‹ Overview  Overview / Jambo"): there is nowhere to go back to.
4. His greeting, the page's counts and the suggested questions are drawn as his first message at the top of the conversation; the reader's turns follow; the box stays at the foot.
5. Asking a question never switches views: the answer simply lands under the question.
6. When a list row is chosen the panel becomes the two-tab kind; letting the row go makes it one window again. The conversation is the same one either way (ONE CONVERSATION, `ai.history`).
7. The ✦ window rule stays: while it is open the conversation is drawn only there, and the panel says so with "Bring it back" (`jb_in_window`).

### Names this touches (grep, never trust a line number)
- One record and builder: js/components.js `jamboTalkLand`/`Open`/`Close`/`Back`/`Up`, `jamboTalkShows`, `jamboTrailHtml`, `jamboTalkTrailHtml`, `jamboTalkTabInner`.
- Home's panel: js/paperdesk.js `pdTalkKey`, `pdTalkSync`, `pdTalkBack`, `pdTalkHas`, `pdTalkReopen`, `pdTalkTabHtml`; js/views/intelligence.js `renderIntelDock` (the head's word `.igd-head-w`); js/views/homeboard.js the Board's greeting (`hb-jb-hello`).
- The list panel and Import's: js/views/inspector.js `jlFrame`, `jlHeadHtml`, `jlHeadPaint`, `jlWordsHtml`, `jlTalkHtml`, `jlTalkPaint`, `jlTalkOpen`, `jlTalkSync`, `jlTalkBack`; js/views/migration.js (its `jlFrame` call).
- Settings: js/views/settings.js `stTalkReopen`, `stTalkBack`, `stJbTurnAdd`.
- Calendar: js/views/calendar.js `calTalkBack`.
- One predicate per host says "the front page is only his words", in one place, so a page that later gains real information moves to two tabs by itself.

### Tests to update or add
- Re-pin: jambo-tab-and-back-verify (its 1j–1l, 4d–4f, 5d–5f, 6a–6c describe the tab on these panels), f840, board-as-drawn-verify 5a ("Board" beside his tab) and 5e, every-jambo-box-verify, jambo-box-every-panel-verify, jambo-one-conversation-verify, import-jambo-panel-verify.
- New browser check, red at the parent: on each one-window panel no tabs, no page word, no trail; the greeting first, a question's answer under it with no switch; on the Dossier and a chosen row the two tabs remain.
- Photographs at the owner's three screens (1440×780, 1536×730, 1366×950); the tidy sweep stays green.

---

## Part B · The top bar in colour, "The SAP way"

**The owner's words (24 Oct 2026):** "i believe the page is too white. We need the top bar on the page to add some color." Picked **"The SAP way"** by name from "HaTi Top Bar Colour" (https://claude.ai/artifact/LHRtqJHjdPsorNDMf5Q8uG). Not picked, do not build: "The Legora way" (pale green wash), "Brand band" (gradient).

**Reverses:** Chambers' white bar with one hairline (owner, 20 Oct 2026), kept by the Legora look (`#top-header{--bar-bg:rgba(255,255,255,.78)…}` in index.html's "THE LEGORA LOOK" block). It brings back, in the new look, the September ruling "the bar wears the workspace's own colour" (21 Sep 2026). Replace the CLAUDE.md lines that say the bar is white; the story goes to MAP-HISTORY.

### What is built, as drawn
- The bar at the top of every computer page (`#top-header`) is a solid **deep green #0B3B36**.
- Its words and icons are **white**: ‹ back, the HaTi name, the page's name and its ▾, the ✦, the bell, the clock, the sign-out mark. Quiet icons at about 78% white, hover a light white wash.
- The search box is a **lighter well inside the bar** (white at about 14%), its words and placeholder white; the ⌘K hint a slightly lighter pill.
- Your initials: a white-outlined circle, white letters.
- The bell's count stays the dark badge it is today (it read clearly on the green in the drawing).
- Nothing else on the page changes: the ground, the cards, the paper, Jambo's panel.

### How (THE LOOK RULES)
- Through the bar's own tokens only (`--bar-bg`, `--bar-ink`, `--bar-ink-2`, `--bar-well`, `--bar-line`, `--bar-hover`, `--bar-edge`) in the "THE LEGORA LOOK" block that closes HaTi's sheet. One new token for the deep green, defined once on `:root`.
- No `!important`; no backdrop filter (it traps the bar's menus).
- Never touch the generated Tailwind blob.
- The menus that open from the bar (Recent under the page's name, the ⌘K search list, the bell's panel, your initials' menu) keep their white cards: only the bar itself turns green. Check each opens with readable words.
- Pages that dress the bar their own way: check each still reads (the room crumb `#shell-title .room-crumb-back`, Home's ‹ greyed with why, the shell title's `.in-crumb`), and Explorer and the Brain, which stay dark under the bar.
- The phone keeps its own bar (js/mobile*.js); unchanged unless the owner asks.

### Tests to add
- A browser check, red at the parent: the bar's computed background is the deep green on Home, a list page, Settings and a contract; every word and icon in it measures at least 4.5:1 against it; each menu opened from the bar shows its words readable on white.
- Photographs at the owner's three screens; the tidy sweep stays green.

---

## Before either part merges
The owner gets a side-by-side, drawn against built, every part ticked or named, with photographs at the three screens; the merge waits for their yes (THE PICKED DESIGN IS THE AGREEMENT).
