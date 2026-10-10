# WORK ORDER — The Brain's fifth view: "Stack"

Owner: Young · Written 10 Oct 2026 · Status: **approved design, not built**
Design picked: **Journey** (from three options: Floors, Journey, Answer card), then the trips moved into the Brain's right-hand panel (owner, 10 Oct 2026: *"you should probably have the navigation of you ask copilot and the rest sitting on the right of the dashboard to make it align"*).
Mock-up the build must match: https://claude.ai/artifact/BDTEi4xPVqMM3dFkw6z177 (version 3).

---

## Part A — In plain English (for the owner)

**What we are adding.** A new view on the Brain page called **Stack**, beside Brain, Wiring, Floors and Lanes. It explains what HaTi is built from: the programming language, the server, the database, the hosting company, the AI and email services, and how code is tested and goes live. A developer can ask you any of these things, and this page gives you the answer.

**How it works.**
- **Left (the dark stage):** a glowing parcel travels along a path from stop to stop, such as "Your browser" → "The internet" → "The engine" → "The memory" → "Claude AI" → "Back to you". Press a circle to jump to that stop.
- **Right (the white panel), laid out like the Brain's "Process flows" panel:**
  1. **Trips through the stack.** There are four: *You ask Copilot*, *You send for signing*, *While you sleep*, *A change goes live*.
  2. **The stops of the chosen trip.** The current stop opens and shows:
     - a plain explanation;
     - a "Picture it" comparison with an office;
     - a "Tell me more" list;
     - a gold box headed "Say this to a developer".
  3. **The stack at a glance:** the eight answers developers ask for first.
  4. **Words you will hear:** a short dictionary of technical words in plain English.
- **The bottom bar** works as it does in the other views: Play/Pause, Replay and speed.

**The numbers stay true.** Some facts are counts: the database tables (41 today), the server routes (about 180), the test files (about 619 + 288) and the lines of code (about 244,000). These are **counted from the code each time the page opens**, the same way the Brain already reads its parts. When the code grows, the page updates by itself.

**What you will see when it is done:** a fifth button, **Stack 5**, in the Brain's bottom bar. Press it (or the key 5) to open the view. It works in English and Swedish. Nothing else in HaTi changes.

---

## Part B — Build instructions (for Claude Code)

Read CLAUDE.md first. This work order obeys it; where they seem to differ, CLAUDE.md wins and you ask the owner.

### B1. Where it lives

- `js/views/brain.js` — add the view. Today: `BRAIN_VIEWS = ['brain','wiring','floors']`, `BR_VIEW_KEYS = BRAIN_VIEWS.concat('lanes')`, `BRAIN_LANES_VIEW = 3`. Add `BRAIN_STACK_VIEW = 4` and append `'stack'` to `BR_VIEW_KEYS`, so the bar draws **Stack 5** and key 5 opens it. Check `brKeys` (it reads `BR_VIEW_KEYS.length`) and `brSetView`.
- Follow the Lanes pattern: an absolutely placed host over the stage (`.br-stack`, hidden unless the view is on), and add `.br-root.is-stack …` rules that hide the canvas, `#br-rot`, `.br-zoom` and `.br-tip` exactly as `.is-lanes` does. Stack draws in **SVG**, not on the canvas.
- When Stack is on, the right panel (`#br-panel`) shows the Stack sections **instead of** Process flows / steps / updates. **Do not** draw a second panel. Swap the panel's contents on `brSetView` and put the old contents back when leaving.
- If the trip data grows past about 300 lines, move it into a new file `js/brainstack.js`. That file then needs everything in B6.

### B2. The stage (left)

- The same stage card, the same radial background, the same top-left title (`.br-ov-tl`: "Stack · <trip>" plus the stops joined by →) and the same bottom-left caption (`.br-cap`: "Stop k of n · <stop>" plus the "Picture it" line).
- Six stops per trip, drawn as rings 30px in radius with a short code inside (JS, N, DB, AI…). Under each ring: the stop's name, and a small mono-font subtitle under that.
- A path joins the rings: a quiet line, plus a gold marching dashed line on top of it. A gold "parcel" (an envelope shape) moves along the path with `getPointAtLength`. It holds at each stop for about 6 s × speed, then moves on. The current stop pulses with a halo. Passed stops are lit; later stops are dimmed (opacity .62, as Lanes does).
- Labels at the edges must not be clipped: give the drawing enough room in its viewBox.
- **Reuse the Brain's controls**: `#br-play`, `#br-replay` and the speed segment (`data-br-speed`) drive the parcel. ← → move one stop. Do **not** add new buttons to the bar.
- `prefers-reduced-motion`: no marching line and no halo. The parcel jumps from stop to stop and does not play by itself.

### B3. The panel (right) — reuse the Brain's own classes

1. `.br-psec` + `.br-ph` "Trips through the stack" / "4 trips"; one `.br-flow` per trip (coloured dot, name, `small` subtitle, "6 stops"), with `aria-pressed` on the chosen one.
2. `.br-psec` + `.br-fh` (trip name / "6 stops") + `.br-flead` + `ol.br-steps` of `.br-st` rows (`is-done`, `is-now`). Only the `is-now` row opens, showing:
   - the plain text;
   - **Picture it:** …;
   - `<details>` **Tell me more** — opening it pauses the parcel;
   - the gold **Say this to a developer** box.
3. `.br-ph` "The stack at a glance" / "Read from the code" — eight rows: Language, Screens, Server, Database, Hosting, AI, Email, Code and tests.
4. `.br-ph` "Words you will hear" — the word list. A word with a dotted underline in the stop text shows its meaning on hover and on keyboard focus. Use the existing `.br-tip` look; it must be focusable, not hover-only.

Colours, type and spacing come from the Brain's existing rules and HaTi's tokens. **No new colours outside the stage's existing palette** (`BRAIN_REG_COLOR`, `BRAIN_GOLD`). The gold "say" box uses the `--st-amber-*` tokens so it works in light and dark mode.

### B4. The four trips — the content

Use the mock-up's wording (version 3) as the source text for every stop: title, plain text, Picture it, Tell me more and Say this to a developer. Summary of the stops:

| Trip | Stops |
|---|---|
| You ask Copilot | Your browser → The internet (HTTPS · Render) → The engine (Node.js 22 · Express 4) → The memory (SQLite · N tables) → Claude AI (Anthropic API) → Back to you (streamed live) |
| You send for signing | You press Send → The engine checks (rules on the server) → A link is made (shares table · token) → Email goes out (Resend) → They open it (their page) → Signed and sealed (fingerprint) |
| While you sleep | The clock → Every 5 minutes (Copilot agents) → Every hour (snapshot) → Every 12 hours (reminders) → Monthly report (checked every 6 h) → Email out (Resend) |
| A change goes live | A change is written → GitHub → Robots test it (GitHub Actions) → Render builds it → Health check (/api/status) → Your data stays |

Every sentence goes through `i18t` with keys in **both** books of `js/i18n.js` (English and Swedish). Suggested key shape: `brn_stk_<trip>_<n>_t`, `_p`, `_like`, `_say`, `_f<k>`. The "Say this to a developer" sentences stay in technical English in both books, because a developer needs the real names. All other text is translated. Retire nothing.

### B5. Facts are READ, never typed in

The Brain's rule is that it reads from the code. Extend the server's `brainNow()` (server/server.js, next to `brainCodeFiles`) so `GET /api/brain` also answers `stack: {…}`, computed **once per boot** together with the brain map:

| Field | Read from |
|---|---|
| `tables` | count of distinct `CREATE TABLE IF NOT EXISTS <name>` in server/server.js (41 on 10 Oct 2026) |
| `routes` | count of `app.get/post/put/patch/delete(` in server/server.js (about 182) |
| `deps` | `dependencies` keys in package.json (today: `express`) and its version range |
| `node` | `engines.node` in package.json (today `>=22.5`) and `process.version` (the version actually running) |
| `host` | render.yaml: `plan`, `disk.sizeGB`, `disk.mountPath`, `healthCheckPath` (read it as text; **add no new package to parse YAML**) |
| `tests` | number of `test/*.test.js` and `test/chromium/*.js` files |
| `lines` | total lines in `server/*.js`, `js/**/*.js` and `index.html` |
| `models` | the keys of the AI price list near `'claude-opus-5'` |
| `languages` | `LANGUAGES` in js/i18n.js (English, Swedish) |

- Read files only. Never print secrets: no environment variable **values**, only whether `RESEND_API_KEY` and an AI key are **set** (true/false). The route stays behind `auth`.
- A file that is missing (for example render.yaml on a different host) gives `null`. The page then says "not found on this server". **Never guess a number.**
- The browser shows these numbers in the stop texts and in "at a glance" through placeholders (`{tables}`, `{routes}`…). Fixed facts (Render, Resend, Anthropic, SQLite, scrypt, two-step sign-in, WAL) stay as wording, but each one is checked by a test (B7).
- **Do not claim** that Render redeploys automatically on every push. That setting lives in the Render dashboard, not in the code. The wording says "whether this happens by itself is set in the Render dashboard".

### B6. Rule 9 and 9b — the Brain must know about itself

- Name the new view and the new route field in `BRAIN_PARTS` (js/brainmap.js), give any new file a `BRAIN_FILE_REGION` line, and join it to a flow step **in the same change**. f561 fails otherwise.
- If no flow step or hand-off is added or moved, the Lanes data (`BRAIN_LANE_OF`, `BRAIN_FLOW_STAGES`) needs nothing; check it with f564 anyway.
- A new js/ file must also be added to the browser test harnesses (test/chromium/*.html, test/world.js) and to index.html. Run f232 and f48 (ES-module publishing rules).
- **Remember the place**: the chosen view is already part of what the Brain keeps. Make sure that a refresh while on Stack comes back to Stack, on the same trip and the same stop. Add a pair to `PLACE_PARTS` only if the Brain is not already covered.

### B7. Tests

Test economy: run only the files below until they pass, then the full suite **once** at the end. Run `npm run lint` first; it must show zero errors.

- **New node test `test/f6xx-the-brain-shows-its-stack.test.js`:**
  1. `GET /api/brain` returns `stack.tables` equal to a count the test makes itself from server/server.js, and the same for `routes` and `tests` (pin the relation, not the number).
  2. `stack` holds no secret value: no string from `process.env` longer than 8 characters appears in the JSON.
  3. Each fixed fact named in the wording is still true in the code:
     - `node:sqlite` is required;
     - `scryptSync` is used;
     - `api.anthropic.com` and `api.resend.com` are present;
     - `journal_mode = WAL` is set;
     - render.yaml says `runtime: node`;
     - the four `setInterval` periods match the wording (5 min, 1 h, 12 h, 6 h).
  4. Every `brn_stk_*` key exists in both books.
- **Existing tests to run:** f400, f458, f561, f564, f232, f48.
- **Browser:** extend `test/chromium/brain-page-verify.js` (or add `brain-stack-verify.js`) to check that:
  1. **Stack 5** is in the bar and key 5 opens it;
  2. the canvas is hidden and the stack SVG is painted (`elementFromPoint` on a ring);
  3. the right panel shows 4 trips and the open stop's gold box;
  4. pressing the second trip changes the stage title;
  5. pressing ring 3 sets that stop `is-now` in the panel;
  6. no label is clipped at 1280 px or 1440 px wide (every node's text sits inside the stage);
  7. a refresh comes back to Stack, on the same trip.

  Wait for states, never fixed pauses.
- Run each new check once against unmodified `main` and confirm it **fails** there.

### B8. Out of scope — do NOT do these

- No change to the Brain, Wiring, Floors or Lanes views.
- No new band, notice, banner or tip anywhere (CLAUDE.md, "No new bands").
- No new npm package.
- No live health monitor (server uptime, memory use, error rates). That would be a separate request.
- Nothing on the phone layout: the Brain is a desktop page. If it currently shows on phones, Stack follows whatever the Brain already does.
- Anything else you notice gets **one line** in BUGLOG.md under "Noticed, not fixed", appended with `cat >> ./BUGLOG.md <<'EOF' … EOF`.

### B9. Done means

- [ ] Stack 5 is in the Brain's bar, key 5 opens it, and the Brain's other views work exactly as before.
- [ ] The four trips play on the stage, and the parcel stops at each of the six stops.
- [ ] The right panel matches the mock-up: trips, stops (open stop with Picture it / Tell me more / Say this to a developer), at a glance, words.
- [ ] Every count comes from `GET /api/brain` → `stack`. Nothing is typed in by hand, and nothing is guessed.
- [ ] Works in English and Swedish, and in light and dark mode (the panel); the stage stays dark as it does today.
- [ ] Reduced motion respected; keyboard works (← →, Tab to words, Enter on a ring).
- [ ] Lint is clean; the new and listed tests pass; the full suite runs once, green apart from tests that were already red.
- [ ] The CLAUDE.md MAP section for THE BRAIN gets at most four lines naming the new parts; the story goes to MAP-HISTORY.md.
- [ ] The final summary to the owner is short and in plain English: what was built, whether it works everywhere, and anything left alone.
