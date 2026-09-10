# HaTi — calendar

*the month grid, the twelve-month horizon, the agenda panel*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## A CALENDAR DAY IS A DOOR

Pressing ANYTHING in a day box goes to the register narrowed to that day's contracts; the document opens only when the day carries exactly ONE. It counts CONTRACTS, not events (renewalDecisionDate falls back to expiry and double-marks a day). THE CHIPS ARE NOT DOORS (owner-asked 2026-08-12, reversing 08-11): they were their own buttons, stopPropagation'd, opening their own contract however many the day held — and at 9.5px in a 90px column nine "Mutual Non-Discl…" chips are a guess between nine. They are SPANS now with no data-sel and no stopPropagation, falling through to openDay, which is the one place the count is asked. The cell keeps role="button", its tab stop and Enter/Space, and is the only focusable thing in the box. A chip carries the event tooltip only on a ONE-contract day (where the press still goes there); otherwise none, so the cell's own title shows. [data-sel] is the AGENDA's selector and nothing else — it is a list of EVENTS, not a day box, and a change scoped to that selector would break it. regShowOnly(ids, label) is the ONE door in; regState().only is applied FIRST (it is an ANSWER; every other filter is a question and narrows within it). Two safety properties: the chip SAYS what the list is narrowed to, and the way back is on the same chip. Cleared by its ✕, both Clear-all handlers, and the phone's. **THE CELLS FLEX SINCE 22 Aug 2026** (the calendar took the mock-up — see FIVE FIXES AND A CALENDAR): a day shows at most two chips and says "+N more" past that, because a row that must always fit six weeks cannot promise room for a third. Nothing is hidden silently and the press still lands on all of them. The phone draws no calendar (listed under More).

**AND THE PANEL BESIDE IT NAMED TWO DIFFERENT WINDOWS (found 23 Aug 2026, chasing an unrelated red).** It is headed `cal_next_30` ("Next 30 days"), it filters through `calUpcoming`, whose default window is 30 — and its empty state said "Nothing due in the next **60** days", in both languages. The one reader who ever sees that sentence is the one with nothing in the panel, and it told them a different number from the heading directly above it. Pinned as a RELATION in f148 rather than as a literal: the two strings must agree with each other AND with `calUpcoming`'s own default, so moving the window to 45 is one edit in the code and the test names the words that have to follow.

**THE FIXTURE FOR THIS SCREEN WAS DATE-DEPENDENT, AND IT IS THE f183 SHAPE AGAIN.** calendar-day-verify pinned its contracts to the 12th, 18th and 22nd of the CURRENT month. That is fine for the grid, which draws a whole month whether a day is past or future — every day-cell check passes on any date. It is fatal for the panel: MEASURED on 23 Aug 2026 those dates were 11, 5 and 1 days in the PAST, `calUpcoming` dropped all three, the panel drew its empty state, and the agenda check reported "no agenda rows to press". Green on the 1st to the 11th of a month, red for the rest of it. The agenda now gets a date of its OWN, offset from today rather than pinned to a day number, stepping past the three grid days so a sixth mark cannot turn "three contracts share a day" into four; it may fall in next month, which is correct, because the panel is not month-scoped and only the grid is. **SIMULATED OVER 730 DAYS: 0 failures.** Tests: calendar-day-verify (23, browser — the chips as spans, no focusable stop inside the box, the tooltip following the press, and the agenda row still opening its own contract), f148 (the panel's two windows, both languages).

## THE CALENDAR TAKES THE DESIGN, LIKE FOR LIKE (owner-ruled 24 Aug 2026)

Fourth page of the page-by-page pass, and the only one so far that RETIRES
features: **Month · Horizon**, with Quarter, List and Obligations gone.

**WHY THE TWO WENT, and it was put to the owner before it was built.** Quarter
drew the month grid three times, which answers no question Month does not. List
printed every date in the period in order, which the agenda beside the month
already does for the window a reader can act on. What replaced them each answers
something nothing in HaTi did: **when the book runs out**, and **what is owed**.
`calQuarterHtml` and `calListHtml` went with them. `calView()` still falls back
to 'month' for an unknown key, so a reader whose stored tab was 'list' lands on
the month rather than on a blank page.

**THE HORIZON IS A SHAPE, NOT A LIST.** Twelve months across, one row per
contract, and **the bar is time remaining** — the thing it exists to make
obvious is the cliff: four rows ending in the same column is a quarter with four
renewals in it, and no list of dates says that as fast. IT INVENTS NO DATES —
every row reads `effectiveExpiry` (family-aware, so a signed amendment moves the
bar) and `renewalDecisionDate`, the same two readings the month grid, the
reminder sweeps and the renewal card use. A contract with no expiry has no row:
an em-dash bar would be a lie. The gridlines are the TRACK'S OWN background —
one repeating gradient, so a row costs one box however many months it spans,
rather than twelve elements per row. Five ladder cards beneath count the whole
book, including rows past the ruler, because it is a count of the book rather
than of what is drawn.

**AND OBLIGATIONS LASTED ONE EVENING** (owner-ruled 24 Aug 2026, off a
screenshot: *"delete the obligations page"*). It was built the same day on the
same ruling that retired Quarter and List, as the one place the whole book's
obligations sat together; the owner looked at it and did not want it. **NOTHING
IS LOST, which is the condition on removing a surface**: an obligation is still
an event on the month grid and in the agenda beside it — the same
`calendarEvents` reading the table borrowed — which is where it sits next to the
date it falls on, and the contract's own page still lists its own. What went is
the third tab and the whole-book table behind it: `calObligationRows`,
`calObligationsHtml`, `calObLabel`, the `.cal-obt` block and every `cal_ob_*`
key in both languages. **DELETED RATHER THAN STUBBED, following Quarter and
List's own precedent on this page** — none of them was exported, so there is no
door a third caller could bring them back through. `calView()` still falls back
to `'month'` for an unknown key, so a reader whose stored tab was `obligations`
lands on the month rather than on a blank page.

**THE AGENDA IS THE MONTH'S COMPANION, NOT THE PAGE'S.** The design pairs "Next
14 days" with the month grid alone, and the other two need the width — MEASURED,
the obligations table was losing its Due, Cadence and Status columns to a panel
that was LISTING THE SAME OBLIGATIONS a few pixels to its right.

**AND THE MONTH PANEL TOOK THE DESIGN'S OWN GRID.** The rules are drawn by a 1px
GAP over a `--line` ground rather than by an inset shadow per cell — one pixel
per rule, no doubling at the corners, and an out-of-month cell can carry its own
tint without breaking the ruling. The numeral is a chip, so today's filled
square is the same shape as every other day. The stepper and the four-tone key
moved into the card's own toolbar: the key used to sit at the card's FOOT, as
far from the colours it explains as the card allows. ONE HOME, NOT TWO — the bar
draws for every view rather than here for Month and out on the page's control
bar for the others.

**THE AGENDA WINDOW IS ONE NAMED CONSTANT** (`CAL_AGENDA_DAYS`, 14 — the
design's own). The heading and the empty state used to spell a number each, and
this file has already been caught with a panel headed 30 whose empty state said
60; both take the window as a VALUE now, so they cannot disagree even in
principle. f148's claim moved up a level to match.

**FOUR FIXES OFF FIVE SCREENSHOTS THE NEXT MORNING (owner-reported 24 Aug
2026), and three of them are one fault: a value written for the place a thing
USED to sit.**

- **NO DATE IS WRITTEN ON A BAR** (*"you keep using fonts that are
  invisible"*). The horizon's notice date was placed INSIDE the bar whenever
  the bar was long enough to hold it — grey text on a saturated fill, and the
  longer the bar the worse it read. The design puts it below the bar every
  time, so the track is 56px, the bar sits at the top of it and the note has a
  line of its own beneath: **one rule, no branch**, and no bar length can make
  it disappear. `.in` / `.out` survive and now decide only which SIDE of the
  bar's end the date hangs from, so a bar ending near the right wall does not
  run its date off the ruler. **THE OLD RULE WAS A BRANCH, WHICH IS WHY THE
  FIXTURE HAD TO CHANGE TOO**: every seeded expiry was weeks away, every bar
  was short, and a check written against it passed on the broken build. The
  file now seeds one contract ten months out, counted from TODAY rather than
  typed (the f183 lesson), and sweeps EVERY row.
- **AND THE CARD BAR CARRIED A FAINT GREY LINE OVER ITS OWN WORDS** (*"remove
  the faint grey line above the words"*). `.cal-legend` carries an inset TOP
  rule from the days it sat at the card's FOOT and needed a line above it; the
  scoped toolbar rule cleared `border` and not `box-shadow`, which is what let
  it survive the move. **Clear the property that draws it, not the one that
  sounds like it.**
- **THE HORIZON SAYS WHAT IT IS**, in the design's own words: a 14px/700
  "Twelve-month expiry horizon" on the toolbar and an AGREEMENT head over the
  name column, which was an empty box.
- **THE OBLIGATION COLUMN IS A LABEL, NOT A SENTENCE** (*"make the obligation a
  bullet point not an entire sentence which congests the table"*). The design's
  rows read "Rebate reconciliation" — three words, weight 600, one line; HaTi's
  note is whatever Copilot read out of the wording, regularly a whole drafted
  paragraph. **TWO HALVES, and the second is the one that fixes the
  congestion.** `calObLabel` is a READING, not a rewrite: it collapses the
  whitespace and drops a trailing full stop, which is the whole of the
  difference between a sentence and a label, and the untouched text stays on the
  row's hover. Cutting at the first comma was considered and refused — "Within
  30 days of the end of each quarter, submit a volume report" would keep the
  TIMING and throw away the act. **The congestion itself was `table-layout`**:
  an auto table sizes a column to its content, so `max-width` on a cell was
  never honoured and one long note pushed the table wide and squeezed the five
  columns beside it. Fixed layout makes the stated widths bite — and the widths
  go on the HEAD row, because a fixed table reads them off the first row and a
  width stated only on a `td` is a width the table never sees.
- **THE SURPLUS GOES WHERE THE SENTENCE IS.** The obligation column states NO
  width at all: in a fixed layout the spare space lands on the columns that
  named none. Measured — a percentage there let Chrome spread it over every
  column and the design's 150 / 104 / 112 came back as 175 / 121 / 131.
- **AND FIXING A LAYOUT CAN HIDE A CONTROL.** With the widths finally biting,
  the status column at the design's 128px clipped its Done button away on eight
  rows: "This week" plus Done wants 137, and Swedish wants more again. It is
  160 — **HaTi's column carries a word AND a button where the design carries
  only the word**, because the design's three foot verbs (Reassign, Mark
  complete, Chase owner) do not exist in this product. A stated width has to fit
  what the column really carries, in both languages, or it has just moved the
  congestion somewhere quieter.

**AND THE HEAD IS ONE BAND, NOT TWO** (owner-reported 24 Aug 2026: *"remove
the line in the highlighted area"*). The title row and the control bar are two
elements, both white and touching, and **each carried its own bottom hairline**
— so a band meant to read as one card was ruled across the middle. The design
draws both rows inside one white box with a single rule under the tabs, which is
what the bar's own hairline already is; the head now draws none. **The claim is
written as a relation** — the head draws no bottom edge of any kind, the bar
still draws one, and the two are the same colour with no gap — so a later type
or palette pass costs no test edit.

Tests: f148 (strengthened — the constant, not two literals; `cal_ob_status`
retired with the column it headed), f83 unchanged,
calendar-redesign-verify (46 — its retired-views section now names all THREE
and asserts the tab row is exactly Month and Horizon, plus the claim the Horizon
exists for: the bars grow with the time left, soonest first; section 4a for the
invisible date; and the one-band claim above. **4 of them fail against the code
of an hour before**, one reporting `cal_v_obligations` as an untranslated tab
label), calendar-day unchanged.

**THE CALENDAR IS BUILT FROM THE MOCK-UP** (js/views/calendar.js, rewritten):
a one-line head carrying the title, how many decisions fall this week, the
period and its acts; a 44px control bar with Month / Quarter / List, All dates
| Mine and a period stepper; the month as a white card ruled by hairlines with
tinted chips and a four-tone legend along its bottom; and "Next 30 days" down
the right. `calendar` joined **PAGE_OWNS_HEADER** — two heads on one page is
what that list exists to prevent.

- **THE OWNER'S ONE CONSTRAINT** was "the calendar should fit with the page and
  not a need to scroll within the page". The render's day boxes are a fixed
  104px and six rows plus the head, bar and legend need more height than a
  laptop has; the old grid met the same wall and answered it with a clamp and
  two height media queries — a number kept true by hand. **THE ROWS FLEX**:
  `.cal-weeks` is six `1fr` rows inside a `flex:1` card, so the month always
  shows all six weeks and the CELLS give up height rather than the month giving
  up a week. What a short cell gives up is chips, and it says so with "+N more".
  Measured at 1500/1440/1366/1280: page scroll 0, grid scroll 0, six rows, no
  cell past the edge. The only two things that scroll inside themselves are
  LISTS — the panel's rows and the List view's — where there is no alternative.
- **THE TONES ARE HaTi'S OWN, DELIBERATELY.** Four legend entries, which is the
  feature; what was NOT taken is the render's hue assignment, which reds the
  renewal decision and ambers the expiry — expiry is ruby everywhere else in
  this product and re-pointing one screen's colours at a different meaning is
  how two screens come to disagree about urgency. **AND THE FOURTH TONE WAS
  WRONG FIRST TIME**: `--st-steel-dot` resolves to `var(--color-accent-500)`,
  the WORKSPACE ACCENT, so negotiation activity and obligations drew as two
  shades of one colour and the legend answered "green" twice — the pipeline
  card's recorded trap met again. It is `--st-gray` (#94a3b8), which is also
  the nearest thing this ramp has to the render's own #5C6B7F and holds when
  the accent moves. Measured: closest pair 126 apart in light, 60+ in dark.
- **NEGOTIATION ACTIVITY READS THE NEGOTIATION, NEVER THE AUDIT TRAIL.** In
  server mode `state.contracts` is the LIGHT list and HEAVY strips `audit` out
  of every row, so a calendar built on the trail would be full locally and
  empty in production — the fault this codebase has already paid for twice, on
  the dashboard's "Decisions due" and on Reports. `negotiation` survives the
  light projection by construction. Read RAW, never through `negoChanges`,
  which would start a negotiation on every contract on every repaint.
- **THREE VIEWS.** Month; Quarter (three months side by side, chips give way to
  dots because a cell a twenty-first of the page wide has no room for a word
  and a truncated word is worse than a dot); List (a row per date, grouped by
  month, scrolling inside its own card). `calPeriod()` is the ONE reading of
  what the screen is showing and the grid, the counts, the Export file and the
  Share summary all ask it — so what leaves the page is exactly what is on it.
- **"ADD KEY DATE" WAS RULED OUT AND IS NOT DRAWN.** The render carries one;
  the owner ruled it out the same day — every date here comes off a contract,
  and a date belonging to nothing needs a store of its own. Not drawn rather
  than drawn dead, and the browser file asserts its ABSENCE.
- **EXPORT IS A REAL .ics**, hand-written (a dozen lines against a dependency
  for a format unchanged since 1998), all-day events, escaped, a stable UID per
  event so a re-import corrects rather than duplicates. It carries exactly the
  period on screen and the scope in force.
- **SHARE MAILS A COLLEAGUE, AND THE SPLIT IS THE DESIGN.** The LINES are built
  in the browser by the same builder the panel draws from — the server already
  computes renewal dates for its reminder sweeps and a second copy behind this
  button is the recorded defect class. What the ROUTE owns is the half that
  must never be the browser's: **WHO is written to**. `POST /api/calendar/share`
  takes a member id and looks the address up itself; a body-supplied address is
  not read at all (the open-relay rule the review-request route states in the
  same words). `auth`, not `editor`: reading this calendar is open to every
  role including a Viewer, and mailing a list they could open themselves grants
  nothing. It answers with the same honest three-way shape every other mail
  here uses — went / outbox / refused-and-why.
- **TWO NEAR-MISSES ON "TODAY", both live at once.** `new Date().toISOString()`
  is UTC and puts today on yesterday's cell for every reader west of Greenwich
  after their afternoon; `todayStr()` READS like the answer and is a DISPLAY
  string ("22 Aug 2026") that matched no cell at all, so today was simply never
  marked. `calToday()` builds a local ISO the same way the cells are keyed.
- **THREE HISTORIC ANCHORS WERE KEPT RATHER THAN MOVED**: `id="cal-agenda"` on
  the panel's list (f83's four claims are all still true of it), `id="cal-grid"`
  on the month view's weeks (laptops-verify names it to make the reported
  defect's own claim — and only the MONTH view carries it, since three of them
  in Quarter would be three elements sharing one id), and `window.regDotDate`
  for the dotted date, read through window because a bare read of another
  module's name throws rather than falling through.

Tests: **pages-read-alike-verify** gained section 5 — every button in a head
row measured for one height, one baseline and one size on BOTH heads, with the
claims written as RELATIONS rather than numbers so the next type pass costs no
test edit, and a check that no height is a fraction of a pixel; 5 of its 7 new
checks fail against the code an hour before, reporting `[34, 32.19, 28]`.
**calendar-redesign-verify** (39, browser — the shape, the fit measured
at four window sizes, the four tones proved tellable apart as COMPUTED colours,
all three views, the scope switch, the ruled-out button proved absent, a real
.ics downloaded and read, and Share posted through to a real outbox row with
the reader's own dates in it), **pages-read-alike-verify** and
**calendar-day-verify** (two claims reversed in place: the chip cap is now a
cap that says so, and the one-contract tooltip rule restored), f89 and
redline-verify (the outline claim reversed in place on both sides — f89 keeps
what the stylesheet SAYS, redline-verify what DRAWS, and they name each other),
nego-redesign-verify (the page-measure claim rewritten as the RELATION it was
always about), f148 (`cal_three_months` is punctuation and joins SAME_IN_BOTH).

**THE COLOUR CENSUS WAS LEFT AT 36/40 AND IT IS RECORDED NOW (24 Aug 2026).**
This paragraph said the four failures were calendar and negotiate deliberately
owning their colours, and reported rather than re-recorded "because
re-recording is a palette-ownership act and is nobody's to do in passing". That
was right about the act and wrong about the outcome: **a half-red net catches
nothing, and by the next evening it was the only thing standing between a real
colour regression and nobody noticing.** Negotiate was re-recorded by somebody
else in the meantime; the calendar's two were still open.

**WHOSE THEY WERE WAS PROVED BEFORE THE BASELINE WAS TOUCHED**, which is the
only thing that makes re-recording legitimate. A worktree at `b20c3fb` — the
commit that landed this redesign, before any of the following evening's work —
scores the **identical 38/40, same two screens, same two values**. So the
evening's fixes neither caused it nor widened it.

**AUDITED AS A SET DIFFERENCE, and it is one swap**: `--color-text` at 2.5%
alpha GONE, `--color-neutral-100` ARRIVED, on `calendar--light`; the same
translucent value gone on `calendar--dark` with **nothing arriving**, because
the neutral resolves there to a value that row already held. That is
`.cal-dow`, the weekday header, re-pointed from a translucent text mix to the
token by this redesign. **No other screen moved and nothing unexplained
appeared.** 40/40, and it is a working net again.

## THE CALENDAR'S AGENDA WINDOW IS A CONTROL (owner-asked 31 Aug 2026, J-5.4)

*"the highlighted area that shows the next 14 days, change that to a filter
where you can look next 14, 30, 60, 90 days."*

**HALF OF IT WAS ALREADY BUILT:** `calUpcoming` has always taken a window and
every caller passed nothing, so the fortnight was simply the only value anybody
handed it. What was missing is the control.

- **THE HEADING IS THE CONTROL**, not a title beside a dropdown. A heading
  reading "Next 14 days" twelve pixels from a control set to *14 days* is one
  fact printed twice, and the second printing is the one that reads as
  furniture. The tracked-changes column settled the identical question the same
  way: **a narrowed list states its own narrowing by being set to it.**
- **ONE VALUE ANSWERS FOR THE READING, THE HEADING AND THE EMPTY STATE.** This
  panel has been caught once headed 30 with an empty state saying 60, and the
  correction was to make one number answer for all three. That property is the
  condition on making it a choice. `CAL_AGENDA_DAYS` survives as the DEFAULT.
- **PER SITTING, IN MEMORY**, on `calState` beside the tab and the scope. Note
  `days:null` rather than the constant: `calState` is built at load and the
  constant is declared below it — naming it there is a read inside its own
  temporal dead zone.
- **THE 40-ROW CAP STOPS BEING SILENT.** At a fortnight it is almost never
  reached; at ninety days it is reached constantly, and a list that quietly
  stops at 40 of 137 reads as a list of 40. Past it the panel says how many of
  how many; below it, nothing — a caveat that is always there is unread.
- **SHARE CARRIES THE WINDOW ON SCREEN.** `calSummaryLines` asked with no
  window, so a reader on ninety days would mail a colleague a fortnight.
- **EXPORT DELIBERATELY DOES NOT CHANGE**: the `.ics` carries the PERIOD — the
  month or the horizon on screen — which is a different question, and somebody
  exporting August expects August. Named so nobody "fixes" it.

**ONE STALE NAME, reported not fixed:** the heading's dictionary key is
`cal_next_30` and the panel says 14.

Tests: f261, amount-and-window-verify.
