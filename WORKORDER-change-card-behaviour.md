# WORK ORDER — the change card: Send/Sent, and collapsing on its own

**Raised by:** Young, from hands-on testing in the negotiation workbench
(Counterparty View and Internal View), 2026-07-31.
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Baseline:** `main` at `0c41ffc` — after the card-as-handle work (`368ec30`),
the stale open/shut choice fix (`671828f`) and the send-vs-turn fix (`0c41ffc`).
**Status:** BUILT — WO-2 landed; WO-1 confirmed already closed by `0c41ffc`.
Proof in f100e (new, 13 tests), f100b/f89 (updated), and a real-pointer drive in
Chromium. See BUGLOG.md.
**Scope:** the change cards in the Tracked Changes column
(`redlineChangeCardsHtml`, `js/views/negotiation.js`). Nothing else.

---

## What was asked for

> "If I have sent, the card should not have a send button, it should say Sent
> not Send. And there should only be two buttons: Edit and Sent."
>
> "When you have not clicked on that card and you hover out, or click on a
> different part of the screen, the card should collapse automatically."

Two items. The first is mostly already delivered and needs confirming; the
second is genuinely new behaviour and carries a real risk that has to be
designed around, not discovered later.

---

## WO-1 · A sent card must read Sent, with only Edit and Sent on it

### Current state of the code

This is already how the card is built, and it cannot drift:

| What the card shows | Condition | Where |
|---|---|---|
| `🔒 Draft` badge, and **Edit / Retract / Send** | `mineUnsent` | `js/views/negotiation.js:6656`, `:6721-6723` |
| `Sent` badge, and **Edit / Sent** (Sent disabled) | `mineSent` | `:6657`, `:6735` |

`mineUnsent` and `mineSent` are computed from the same `unsent` set
(`negoUnsentAsks`) and are mutually exclusive by construction, so the badge and
the buttons can never disagree. There is no state that shows a `Sent` badge
beside a live `Send` button.

### So why was it seen

Because the ask never registered as sent. Pressing Send from Counterparty View
returned **"It is already their turn"** and filed nothing — the turn and the
send were one fact, and a send was refused whenever the other side already held
the turn. The change therefore stayed in `negoUnsentAsks`, so the card went on
saying `Draft` with a live `Send`, correctly reporting a send that had not
happened.

Fixed in `0c41ffc` (`negoHandOver` now sends what is waiting even when the turn
is already theirs). Verified against the running server: unsent count 1 → 0.

### What is left to do

1. **Verify on the next deploy**, from Counterparty View: raise an ask, press
   Send, confirm the badge flips to `Sent` and the buttons become exactly
   **Edit** and **Sent** — nothing else, no Retract.
2. **Decide whether `Sent` should be a button at all.** It is currently a
   disabled `<button>` styled amber. It is a *state*, not a control — nobody can
   press it. Options:
   - keep as-is (it holds the Send button's position, so the column does not
     reflow after a send — this was deliberate);
   - render it as a chip/label instead, and let the card carry one button.

   The request says "two buttons of Edit and Sent", so **keep as-is** unless
   told otherwise. Raised only so the choice is on the record.
3. **Check the same holds on the counterparty's own portal page**, which mounts
   the same renderer with `side: 'counterparty'`. The verb rules are seat-
   relative and should already be right; it has not been checked since `0c41ffc`.

**Risk:** low. No behaviour change proposed; this is a verification item.

---

## WO-2 · A card the reader has not committed to should collapse itself

### Current state

- A card is **open** when it has something to press (a draft of yours, an
  incoming ask awaiting your decision), and a **line** when it has not.
- Clicking a collapsed card opens it *and* jumps to the change in the contract.
- It stays open until the caret (▾) is pressed.
- There is **no hover behaviour on cards at all** today — the only `:hover`
  rules in this area are on the verb buttons.

So a reader who opens three cards while working through a round ends up with
three open cards and has to close each one by hand.

### The behaviour asked for

A card you have merely *looked at* should close itself; a card you have
*committed to* should stay open. Proposed rule, stated precisely:

| Interaction | Result |
|---|---|
| Pointer enters a collapsed card | It expands — a **peek**, not a commitment |
| Pointer leaves a peeked card | It collapses again |
| Click the card | It **pins** open, and still jumps to the change (unchanged) |
| Click anywhere outside the cards column, or on another card | The pinned card unpins and collapses |
| Press the caret | Collapses immediately, pinned or not |
| The card **needs you** (Accept/Reject, Retract/Send, Undo, Withdraw) | **Never auto-collapses** — see the risk below |

Net effect: at most one card is expanded at a time, and it closes as soon as
your attention moves on.

### The risk that has to be designed around, not discovered

**A card must never fold away while the reader is reaching for a button on it.**

This is not hypothetical. We already shipped and fixed one bug in this exact
area (`671828f`): a card shut by hand stayed shut when the counterparty's answer
arrived carrying **Accept** and **Reject**, hiding live controls on a decision
waiting on the reader. Auto-collapse re-opens the same wound in a worse form —
the buttons would vanish *as the mouse travels toward them*.

Three consequences for the build:

- **Cards that need you are exempt.** A draft with Send on it, and an incoming
  ask with Accept/Reject on it, stay open on the existing rule. Only cards with
  nothing to press — sent asks, decided changes — take part in peek/collapse.
  This is the same "needs you" test the code already uses
  (`rlCardNeedsYou`, `js/views/negotiation.js:5820`), read off the verbs the
  card offers rather than a second list of statuses.
- **A close delay is required.** Collapsing on the raw `mouseleave` will fire
  when the pointer crosses a gap between the header and the buttons. Needs a
  short grace period (~150–250ms) that cancels if the pointer returns, and must
  not fire while the pointer is over any child of the card.
- **Keyboard and touch need their own answer.** There is no hover on a phone or
  tablet, and the cards are focusable (`tabindex="0"`). Proposal: focus behaves
  like hover (expands on focus, collapses on blur unless pinned), and on touch
  the first tap pins — i.e. touch keeps today's click behaviour exactly.

### Where the work lands

- `rlCardIsOpen` / `rlCardSetOpen` / `_rlCardChoice`
  (`js/views/negotiation.js:5829-5867`) — the stored choice becomes three-valued
  (peeked / pinned / shut) rather than two, and only *pinned* survives a repaint.
- The card click and caret handlers (`:5940` onward) — plus new pointer/focus
  handlers and a document-level click to unpin.
- `.rl-card` CSS (`:4400` onward) — the peek should not shift the cards below it
  jarringly; consider a height transition.

### Answers from the raiser (2026-07-31) — all three settled before building

1. **Does a peek jump the document?** **No.** Hovering expands the card and
   nothing else; the contract pane does not move. Clicking still navigates, as
   it always has. Pinned by a test that asserts nothing in the document lights
   up on `mouseenter`.
2. **Does a pin survive tabs or reload?** **No.** It lives in memory only,
   nothing writes it to storage, and it is dropped when the reader moves to
   another contract — otherwise a pin would open a card they have never seen.
   Pinned by a test that greps the state block for any persistence call.
3. **Are cards with live buttons exempt?** **Yes** — and the build takes it one
   step further, deliberately: such a card cannot be folded *by hand* either.
   Its caret is drawn faded and does nothing. A card that needs you is simply
   always open. That removes the entire class of "a live control the reader
   cannot see", rather than leaving a way to create it on purpose.

**Risk:** medium. Handled as follows.

- **Pointer gaps** — a 180ms grace (`RL_CARD_PEEK_MS`) that cancels if the
  pointer returns, so crossing from the head to the buttons does not slam the
  card shut mid-reach.
- **Repaints landing mid-hover** — a peek is a CLASS on the live node and never
  a repaint. Re-rendering the column on `mouseenter` would fight the pointer,
  drop the node the event came from, and disturb the Discussion panel beside it.
  This is why the body is now always in the DOM and hidden by CSS
  (`display:none`, so a hidden verb is out of the tab order and the
  accessibility tree too) rather than omitted from the markup.
- **Keyboard** — `focusin` peeks and `focusout` closes, with a focus moving
  *inside* the card (to Edit) correctly not counted as leaving it.
- **Touch** — a tap is a click, so it pins. Touch behaviour is exactly what it
  was before this change.
- **Hiding a live control** — impossible by construction: only cards marked
  `data-rl-peek` participate, and that flag is the negation of `rlCardNeedsYou`,
  the same single test the open/shut rule already reads off the verbs.

---

## What was built

1. **WO-1** — verified against the running server: after a send the badge reads
   `Sent` and the card carries exactly **Edit** and **Sent**. Closed by
   `0c41ffc`; no further code needed. The disabled-button-vs-label question was
   left as-is, per the request for "two buttons of Edit and Sent".
2. **WO-2** — peek / pin / unpin, with the exemption and the grace period in
   from the start. Driven with a real pointer in Chromium:

   | Step | Result |
   |---|---|
   | at rest | `open=0`, body hidden |
   | hover | body visible, record still `open=0` — a look is not a decision |
   | move away | body hidden again |
   | click | `open=1`, and the document scrolls to the change |
   | click elsewhere | `open=0` |

## What this work order does NOT cover

- The mixed toolbar in Counterparty View (owner's **Send All Redlines** and
  **Publish Round** still visible while previewing the counterparty's seat).
  Noticed during this investigation, not reported as a fault, not specified here.
- The older two-pane negotiation cards (`.nego-card`,
  `js/views/negotiation.js:1391`). Different screen, different markup, untouched
  by any of this work.
