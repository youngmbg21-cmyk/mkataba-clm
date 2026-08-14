# WORK ORDER — what Copilot costs, per person

**Raised by:** Young, 2026-08-14: "work order for visibility first".
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** **PHASE 1 BUILT** 14 Aug 2026, on Young's instruction ("complete
the rest of the work orders autonomously"). **PHASE 2 IS DELIBERATELY NOT
BUILT** — that is this order's own instruction and f203 enforces it, failing
if `copilotCap` appears anywhere. Nothing is capped and nothing is refused.

The thirteenth-site test was written first, as the order asked, and it failed
on all eleven sites before any of the code existed.

**The two sites this order marked "check — no explicit feature" both have
one.** Line ~3101 is `ocr` and line ~8732 is `template_convert`. There was no
pre-existing hole in the by-feature breakdown to fix in the same pass.

**One thing the order did not anticipate.** `aiSpendToday()` is called by
`aiBudgetGuard` on every single Copilot request, so reading the per-person
ledger with a name lookup per row would have put N+1 queries on the hot path of
the feature it exists to measure. It is one query with a LEFT JOIN.

**A chat turn is a tool loop**, so one question is often several calls into
Anthropic — the per-person figure counts calls, not questions, exactly as the
by-feature one always has. Worth knowing before reading the numbers.

Proof: f203 (22), settings-tabs-verify (59, browser — the breakdown on screen
under the by-feature one, its sentence, and no cost column on the roster),
full suite 3604/3604.

---

## What was asked

Two phases, and the order matters.

**Phase 1 — SHOW IT.** An admin can see what Copilot cost today broken down by
person, beside the breakdown by feature that already exists. Nothing is
refused, nothing is capped, nobody is blocked.

**Phase 2 — CAP IT, later and only if wanted.** A per-person daily ceiling,
smaller-of-the-two-wins against the workspace ceiling, behind a switch that is
off by default.

Phase 1 first is the whole point of this order: most workspaces find the spend
is lopsided in a way they would rather have a conversation about than block,
and a cap designed before anybody has seen the numbers is a cap set to the
wrong figure.

---

## Correcting the record

The overnight summary said this "needs a new ledger wired through every
Copilot route". That was wrong, and wrong in the expensive direction — it made
a day's work sound like a week's.

What is actually true:

- **ONE recorder.** `recordAiSpend(feature, model, usage, opts)`
  (server/server.js ~1375) books every real Anthropic call. There are two
  places that call it, both inside the two functions that talk to Anthropic.
- **ONE guard.** `aiBudgetGuard` (~1431) already runs as middleware on every
  Copilot route, already reads the daily ceiling, and already has the request
  — so it already knows who is asking.
- **The gap is in the middle.** The recorder sits deep inside the call to
  Anthropic and does not know who asked. Twelve call sites hand it a small tag
  saying which FEATURE this is (`{ feature: 'chat' }`); none of them says which
  PERSON.

So the work is not plumbing a new path through every route. It is adding one
field to a tag that already travels, in twelve places.

---

## What already exists to build on

1. **A per-feature ledger with the right shape.** `ai_spend`, keyed
   `(day, feature)`, upserted through one prepared statement (~1362), read by
   `aiSpendToday()`, drawn on the Copilot engine panel as
   `#ai-spend-breakdown`. A per-person ledger is the same table with a
   different key.
2. **A per-person record of chat already exists.** `copilot_log` (~150)
   carries `user_id` and `user_email` on every completed chat turn, with the
   model and the question. The product already knows WHO is chatting; it does
   not price it. Worth reading before building — it may answer half the
   question for chat alone, though it covers no other feature.
3. **The three-state per-person setting pattern**, built in August 2026 for
   the signing limit: `signCapOf(u)` → `{answered, limit}`, an admin-only
   grant on `PATCH /api/users/:id`, a live sentence in the person drawer, a
   default-OFF workspace switch. Phase 2 should be that pattern again, not a
   new one.

---

## PHASE 1 — SHOW IT

### V-1. The person travels with the meter

The twelve metered call sites each pass a `meter` object. They need one more
field: who asked.

Sites, by line at the time of writing (re-grep for
`anthropicMessages(` / `anthropicMessagesStream(` — the numbers will drift):

| ~line | feature |
|---|---|
| 1955 | `search` |
| 2935 | `graph` |
| 3005 | (check — no explicit feature; lands in `other`) |
| 3062 | `template` |
| 3156 | `extract` |
| 3212 | `blanks` |
| 3254 | `obligations` |
| 3295 | `playbook` |
| 3853 | `chat` |
| 4131 | `chat`, streaming |
| 8620 | (check — likely `template_convert`) |

**A MISSED SITE IS SPENDING THAT COUNTS AGAINST NOBODY**, which is worse than
not having the feature: the per-person total would be quietly short and an
admin would be reading a number that does not add up to the workspace total.
So this needs a test that fails on the thirteenth site somebody adds — the
same shape as f170's CREATORS list, which already does exactly this for
contract creation. **Write that test first.**

Two of the sites above are marked "check": they exist and their feature tag
was not visible in the grep. Establish what they are before building, and if
either genuinely has no feature, that is a pre-existing hole in the by-feature
breakdown worth fixing in the same pass.

### V-2. The ledger

`ai_spend_user (day, user_id, requests, calls, input_tokens, output_tokens,
cost)`, keyed `(day, user_id)`, upserted beside the existing statement in the
same `recordAiSpend` call.

- **A second small table rather than a new column on `ai_spend`.** Adding
  `user_id` to that table's primary key would multiply its rows by the number
  of members and change what every existing reader gets back. A separate
  ledger leaves the by-feature numbers byte-identical.
- **Where there is no person, book nothing.** Scheduled sweeps and anything
  running without a signed-in request have no owner; they still count toward
  the workspace total, which is what the existing table is for.
- The two totals will therefore NOT always agree. **Say so on the screen** —
  "$0.40 not attributed to a person" — rather than letting an admin discover
  the gap by subtracting.

### V-3. The screen

A second breakdown on the Copilot engine panel, under the existing per-feature
one: person, requests, cost, largest first. Read-only.

- It is on **Build & launch → Copilot engine**, where the money already lives.
- **Not on the People tab.** A per-person cost column on the roster turns a
  list about permissions into a league table, and that is a different product
  decision from showing an admin where the money went.

### V-4. Honesty about what it measures

The figure is what Anthropic charged for calls this person triggered. It is
not "value delivered" and it is not a performance measure. One line on the
panel saying so, in the product's own voice, because somebody will use it as
one otherwise.

---

## PHASE 2 — CAP IT (only after Phase 1 has run for a while)

Follow the signing-limit pattern exactly:

- `copilotCap` on the member record, THREE states — absent (nobody decided),
  `'none'` (decided, no cap), a number.
- An admin grant on `PATCH /api/users/:id`; never self-service.
- A workspace switch, **OFF by default**.
- The check goes in `aiBudgetGuard`, which already refuses on the workspace
  ceiling — **one guard, not a second one**. Smaller of the two wins.
- Server is the wall; the browser's copy is cosmetics.

### DECISIONS TO TAKE BEFORE PHASE 2

**C-1. What happens at the ceiling — silence or fallback?**
Recommendation: **fall back to the built-in keyword mode**, which is what
Copilot already does when there is no key at all. The person keeps working,
less cleverly, and is told why. A flat refusal on the one tool somebody uses
all day makes them stop using the product rather than stop spending.

**C-2. Is an admin exempt?** Recommendation: **yes**, the same as the signing
limit and for the same reason — the admin is who raises it, and a workspace
whose only admin has capped themselves out of Copilot cannot fix itself.

**C-3. Does the cap count OCR and migration?** Recommendation: **no** — those
already draw on the onboarding allowance, which is its own budget with its own
refusal. Two ceilings on one act is two refusals to keep in step.

**C-4. Daily, or monthly?** Recommendation: **daily**, matching the workspace
ceiling. A monthly cap means somebody spends their month in three days and is
mute for four weeks.

---

## PROOF REQUIRED

- **Phase 1:** a test that walks the metered call sites and fails on an
  unattributed one; a real-server test that two members' calls land under two
  people; that the unattributed remainder is shown rather than hidden; that
  the existing by-feature numbers are unchanged.
- **Phase 2:** off by default blocks nothing; on, the smaller ceiling wins and
  refuses in words; an admin is unaffected; the server refuses directly, not
  just the browser.

---

## OUT OF SCOPE

- Any per-person figure on the People tab or the register.
- Charging or billing of any kind.
- Changing what the workspace ceiling does today.
