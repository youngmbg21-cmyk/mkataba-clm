# WORK ORDER — two jobs

Owner-approved 12 Aug 2026. Two unrelated changes, in one order because they are
being handed over together.

**Do them in this order and commit them separately.** Task 1 is a live bug that
tells a customer something untrue on screen; Task 2 is a design change nobody is
currently being harmed by. Finish with **one** short plain-English summary
covering both.

Read before touching anything: `CLAUDE.md`, then the matching sections of
`docs/MAP-HISTORY.md`. The **Bug Fix Rules** at the top of CLAUDE.md apply to
both tasks — find every place the thing you are changing appears *before*
writing anything, fix them all, and verify in the browser (and on the phone
where the screen exists there), not just in the file you edited.

Line numbers below were verified 12 Aug 2026 and they drift. Confirm each with
grep; do not go exploring beyond them.

---

# TASK 1 — the share dialog reports a held signing link as a delivery failure

## The screen

The Share dialog, Email tab, after pressing **Send by email** for a counterparty
signer who is **not first** in the signing order.

## What was reported

An amber result box reading:

> **Not delivered** — the mail provider refused it. The link was created and is
> safe to send another way, but youngmbagaya@yahoo.com has not received anything.
> No reason was given.  `https://…/#share=t:2e686c…`

**Nothing was refused. Nothing was sent.** The link was bound to the *second*
signer on the route, and a bound signing link is deliberately held until its
turn — created, parked, and emailed automatically the moment the signer before
it finishes. That is exactly what happened: the email arrived when the first
signer signed. **The behaviour is right and only the sentence is wrong.**

### The proof that nothing was attempted, so nobody re-argues this

`sendEmail` always carries the provider's own sentence back on a refusal, and
falls back to `Resend rejected this message (<status>)` when the provider says
nothing at all. **A refusal can never come back blank.** "No reason was given"
can therefore only mean *no attempt was made*.

### And the fact is already on the wire

`POST /api/shares` returns **`heldForTurn`** in its reply. `doSend` never reads
it. The result box has four outcomes — sent, already sent, no mail provider, and
everything-else — and "everything else" is written as *the mail provider refused
it*. A held link falls into it.

## Where the code is

| File | ~line | What |
|---|---|---|
| `server/server.js` | 5269–5364 | `heldForTurn` is computed and returned |
| `server/server.js` | 5313 | the **reused-bound-link** branch — returns `alreadySentAt` **and** `heldForTurn` together |
| `js/core.js` | 3689 | `resultBox()` — writes into `qs-result` **or** `sh-result` |
| `js/core.js` | 3849 | the `alreadySentAt` branch |
| `js/core.js` | **3854–3855** | **the branch that lies** — `else if(r.emailConfigured)` |
| `js/core.js` | 3993–3995 | `reshareNotSentModal`'s final branch — same lie, second place |
| `js/core.js` | 3150–3160 | standing-link payload refresh — same response shape, drawn the same wrong way |
| `js/core.js` | 3223 | the phrase already in honest use: `link held until their turn` |
| `js/approvals.js` | 698, 710 | the signing-order card's honest wording: `LINK READY`, *link ready — it goes out when their turn arrives* |
| `js/mobile-contract.js` | 658 | the phone share sheet's sentence |

## What should be true when you are done

1. A link **held for its turn** gets its own outcome, in **neutral colours**,
   naming who we are waiting on and saying the email goes automatically when
   they sign.
2. It does **not** say "safe to send another way". That advice is actively
   wrong: a held link opens a dormant *waiting on an earlier signer* page, so a
   reader handed it early meets a holding screen and concludes the link is
   broken. **Decide what happens to the URL in that state** — dropped, or shown
   with the dormancy said out loud — and say which you chose and why.
3. "The mail provider refused it" is reserved for an **actual refusal**, which
   always carries a reason.
4. **Nothing about the server's hold behaviour changes.**

## Six things that will break quietly

- **Do not re-derive "is this held".** It is a field in the reply. A second
  computation in the browser is a second thing to keep in step with the route
  that actually decides.
- **Two response shapes carry it.** The fresh POST, and the reused-bound-link
  branch inside the same route, which *also* returns `alreadySentAt`.
  `alreadySentAt` is checked **before** the refusal branch today for a reason —
  a false "Not delivered" of 02 Aug 2026 — so **keep that ordering** and add the
  new branch without disturbing it.
- **The same lie has siblings.** `reshareNotSentModal`'s final branch blames the
  provider whenever a send did not happen; it already handles *the original was
  a copied link / WhatsApp* but not *held for its turn*. And the standing-link
  refresh (`PUT /api/shares/:token/payload`) correctly sends nothing when the
  original share's channel was not email, and returns the same
  `emailSent:false / emailError:null / emailConfigured:true` shape — which the
  share dialog also draws as "refused". **Walk all three; fix the ones that lie;
  say plainly if you leave one alone.**
- **The result box is shared with the quick-send flow** (`qs-result` or
  `sh-result`). A fix reaches both, so **verify both** rather than assuming.
- **The phone's share sheet** says *Link created for X — it was not emailed from
  here*, which is not a lie but says nothing about the hold either. Decide
  whether it should, and say which you chose.
- **The signing-order card already tells the truth** about this exact state —
  *LINK READY · link ready — it goes out when their turn arrives*. **Use those
  words.** One fact must not grow a second phrase; that is how two screens come
  to disagree.

## Also

- **Nothing false is written to the record today** — a held link stores no
  `send_error`, which is why the signing card stays honest. Keep it that way; a
  fix that starts stamping `send_error` would make the card start lying too.
- **Ask one question out loud:** since the server guarantees a reason on every
  real refusal, can *"No reason was given"* ever be true? If not, it is dead
  wording describing a state that cannot occur. Decide deliberately whether it
  stays.
- **Translation:** the existing sentence is a dictionary entry in EN and SV. Any
  new sentence needs both, through `i18t()` / `i18tn()` — never `t()`.

## Reproduce it before touching anything

A route with an **internal signer first and a counterparty second**. Issue the
counterparty's signing link before the internal signature is in, press **Send by
email**. The amber box is the bug. Then sign as the internal signer and watch
the email actually go — that is the behaviour being described wrongly, and **it
must still work when you are finished**.

## Tests

The held-link paths are covered by the signing-route files; the signer row's
states by the signature-progress file; resharing by the reshare files.

Add the claim that **a held link is never reported as a refusal**, and that **a
real refusal still is** — both, or the fix is half a fix.

**Put the pixels in a browser check.** This is a claim about what a box on a
screen *says*, and the box says the wrong thing while every node assertion about
the request passes.

---

# TASK 2 — the redline card pops out instead of expanding down

The drawings behind this are in `docs/design/card-opens-out.html` (open it in a
browser — it is a styled page, not a document to read as text). **This section is
complete on its own**; you should not need the HTML to build from.

Read first: `CLAUDE.md`, the sections "THE NEW DESIGN (Document + Negotiate)" and
the card rules under it — *CARDS ARE SHUT UNTIL SOMEBODY OPENS THEM* and *A SHUT
CARD IS TWO AREAS, NOT ONE*.

## The problem

A change card in the Tracked Changes column expands **downwards, in place**.
Three things go wrong: the column reflows so every card below it moves; the
reading matter (why they asked, the reviewer's note, the notes thread) is
squeezed into the narrowest space on the screen; and there is no way to scroll
one change on its own.

## What is true today

Two press targets, and one of them does two jobs:

| Press | Result today |
|---|---|
| `.rl-card-head` | Jumps the document to that clause (`rlLinkFocus`) **and** toggles the card |
| `[data-rl-caret]` | Toggles the card only — deliberately does **not** move the document |

The caret is `&#9662;` (▾) at **9px in neutral grey**, sitting between the origin
pill and the status pill. It reads as punctuation, not as a control. **That is
the fault.**

## What to build

1. **`.rl-card-head` keeps `rlLinkFocus(c, id, 'card')` and stops toggling.**
   Pressing a card means *take me to this clause* and nothing else.
2. **The caret becomes the pop-out door.** ~28px, outlined so it plainly is a
   button, moved to the card's **top-right corner after the status pill**,
   carrying an *open-out* mark — **not** a chevron. A downward chevron promising
   a floating panel is a lie. Its `title` and `aria-label` say it opens the
   change.
3. **A floating panel, anchored to its card.** ~420px wide, capped height, its
   **own internal scroll**, floating left over the document. It carries what
   `.rl-card-body` holds today — who filed it, on-behalf, revised-by, why they
   asked, the reviewer's note, the notes list and the composer — **plus the full
   proposed wording**, which the card only shows as two clamped lines.
4. **Closing:** the ✕, Escape, and a press outside it. It must flip or shift when
   the card sits near the top or bottom of the window, and follow or close when
   the column scrolls. **It must never open half off-screen.**
5. **Below the phone breakpoint it is a bottom sheet**, not a floating panel.

## Where the code is

`js/views/negotiation.js`, and only this file for the behaviour:

| ~line | What |
|---|---|
| 6255–6400 | the card's CSS, injected by `redlineLayoutCss()` |
| 8736 | `rlLinkFocus(c, changeId, source)` |
| 8913–8940 | the two click handlers — `.rl-card-head`, then `[data-rl-caret]` |
| 10828–10840 | the card builder in `redlineChangeCardsHtml` — `const caret`, `const body`, `const actionBar`, the `<article>` and `data-rl-open` |

## State: this REMOVES state, it does not add it

Per-card open/shut becomes **one value — which single change is popped out, or
none**. Trace every caller before deleting any of: `_rlCardChoice`,
`rlCardIsOpen`, `rlCardSetOpen`, `rlCardOpenState`, `rlCardStateKey`,
`data-rl-open`, `.rl-card-shut`.

## Must not break

Each of these is a standing rule with a test already behind it.

- **The verbs stay on the shut card.** `.rl-card-actions` is a sibling of the
  head and nothing folds it. A verb must be **visible pixels** (f180) —
  including inside the counterparty embed, where jsdom will happily "press" a
  hidden button.
- **`redlineChangeCardsHtml` is rendered by four surfaces**: the workbench, the
  phone (the desktop renderer under a back bar), the counterparty's portal embed
  (`redlineEmbed`), and redline-verify's harness. The panel must work **inside an
  embed** — check the containing block, not just the workbench.
- **`negoLiveCardsHtml` is a different renderer** (the contract tab's own card).
  Leave it alone, and say so in the summary.
- **`rlCardSort` / `rlCardRank` / `redlineCardIds` are untouched.** This is not a
  filter and not a sort; every chip count stays identical.
- **New classes go where the other `.rl-*` rules live** (`redlineLayoutCss`),
  never invented at the call site — see the `ui-input` lesson in CLAUDE.md.
- **Every new string goes through `i18t()` / `i18tn()`, in EN and SV.**

## Tests — rewrite the claims, do not delete them

- `test/chromium/card-collapse-verify.js` pins today's shut/open behaviour.
  Rewrite it for the pop-out: the card no longer grows, the panel opens as
  visible pixels with a real box, it scrolls internally, the card's own verbs
  stay pressable, and pressing the card body still jumps the document.
- Check and update: `f84`, `f89`, `f100b/e/f`,
  `test/chromium/redline-verify.js` (checks 14b, 14c), `parity-verify`,
  `phone-verify`.
- Add one browser check that the panel opens inside the counterparty's embed.

## Not in this change

The `‹ ›` previous/next stepper through the queue (Option B in the design page).
Note it as a follow-up; **do not build it.**

---

# Both tasks

**Run:** one file `node --test --test-reporter=dot test/<f>.test.js`; everything
`npm test` (~3m20s); browser checks `node test/chromium/<name>.js`. The full
suite and every browser check named above must pass before you commit.

**Commit each task separately**, on one branch, and push.

**Finish with one short plain-English summary for a non-developer** covering both
tasks: what was fixed, whether it is fixed everywhere it appears, anything you
deliberately left alone and why, and anything you were unsure about. No file
paths, no line numbers.
