# WORK ORDER — the company's legal details live with the company, not with the design

**Raised by:** Young, 2026-08-14, going through the overnight list: "C, and B
now".
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** **CLOSED.** B was built on the morning of 2026-08-14 (full suite
3451/3451, settings-tabs-verify 48/48). **C was built the same day** on
Young's instruction ("complete the rest of the work orders autonomously"),
taking this order's recommendations for D-1, D-2 and D-3.

Proof: f201 (27), f194 (10, with its company-design claim re-pointed at the
design half and the identity closure added beside it), settings-tabs-verify
(54, browser), designstep-verify (28), full suite 3557/3557.

---

## ONE THING IN THIS ORDER WAS WRONG, AND IT IS CD-2

CD-2 below says `passwordCurrent` means "changing the company's registered
details asks for your password before it saves", and that the Company & market
panel would therefore need a password prompt it does not have. **It does not
mean that.** `passwordCurrent` refuses anybody who is still on a temporary
password — *"Set your own password before making changes"* — a first-login
gate, not a per-save credential check. Nothing in HaTi has ever prompted for a
password to save branding; grep the client for it and there is nothing.

So there was no prompt to move, none to drop, and nothing to keep off the
market dropdown — which is `admin`, and `admin` itself calls the very same
`passwordCurrent`, so the two already agreed. The protection travels because
the ROUTE is unchanged, and f201 proves it still refuses (a member on a
temporary password gets 403 and nothing is written) rather than assuming it.

The instinct behind CD-2 was still right, and it is the reason that half of the
work was done first: this was the part that could go wrong quietly.

## AND ONE THING THE ORDER DID NOT SEE

`PUT /api/org/branding` writes its row with `ON CONFLICT DO UPDATE`, so every
field a request did not carry was stored as **null**. That was harmless while
ONE screen owned the whole row — the design step always sent every key, filling
the ones it was not editing from the stored record. It stops being harmless the
moment two screens write it, which is exactly what this move creates: a save
from either would have wiped what the other owns.

So the route now leaves alone any key a request does not carry. **Absent is not
null** — sending `logoUrl: null` still clears the logo. `saveOrgBranding` does
the same merge for the no-server mode. This is the same shape as
`PUT /api/settings` preserving a stored `signFolders.by` (the H-3 split).

---

## What was asked

Your company's legal name, registration number and registered address are
edited inside the **Company design** step, as four unlabelled boxes underneath
the logo upload and the accent-colour picker. They should live on **Company &
market**, where somebody would actually look for them.

A legal name is not a design decision. It is the same kind of fact as the
market and the currency — something true about the company, which happens to
get printed on paper.

---

## B — THE SMALL FIX (BUILT 2026-08-14, no behaviour change)

The Company & market panel states the legal name and registration number over
a button reading **"Edit design"**. Nothing says the fields are behind it, so
an admin looking for the registered name has no reason to press it and would
reasonably conclude there is nowhere to enter one.

Three changes, none of which moves a field — signposting only. The fields are
still edited in the same place, saved through the same route, with the same
password protection:

- the registered **address** joins the two facts already stated;
- the button reads **"Edit company details & design"** rather than "Edit
  design";
- a line under it says where the fields are, and that changing them asks for
  your password.

Both languages. This makes the current arrangement findable; C is what fixes
it. **B was worth doing even if C is never built** — it is most of the benefit
of C for a fraction of the risk, which is why it went first.

---

## THE BUILD (C)

### CD-1. The fields move to Company & market

Legal name, registration number, registered address and footer text become
real labelled fields on the **Company & market** panel, beside the market
dropdown.

- **The design step stops owning them and starts reading them.** Its preview
  still shows the registered name on the paper; it simply no longer offers
  boxes to type it in. Two places to type one fact is the fault this codebase
  is built to avoid, so this is a MOVE, not a copy.
- The writer stays `PUT /api/org/branding` — the same route, the same stored
  record, the same fields. **No new storage and no migration.**

### CD-2. The password prompt travels with them

`PUT /api/org/branding` is guarded by `passwordCurrent` — changing the
company's registered details asks for your password before it saves. That is
deliberate: this is the name that appears on executed contracts.

**That protection must move with the fields**, which means the Company &
market panel gains a password prompt it does not have today. Do not quietly
drop it to keep the panel simple. Do not put the password prompt on the market
dropdown, which shares the panel but not the route — the market is
`PUT /api/org/jurisdiction` and is admin-gated without a password, and it must
stay that way or a routine change starts asking for a credential.

**This is the one part of this job that can go wrong quietly**, so it needs a
server test that the route still refuses without the password after the move.

### CD-3. Who may change them

`PUT /api/org/branding` is `templateManager` — admin OR Editor. The Company &
market panel is inside the admin-only settings page, so after the move an
Editor could no longer reach these fields, even though the server would still
permit it.

**Decide this deliberately** — see D-1. Whichever way it goes, the browser and
the server must agree afterwards; a route that permits what no screen offers
is how a capability becomes invisible rather than removed.

### CD-4. The row's summary line

The Company & market row on Platform settings states the legal name, the
market and the currency without being opened. That reading is already correct
and should not change.

---

## DECISIONS TO TAKE BEFORE BUILDING

**D-1. After the move, may an Editor still change the company's legal name?**
Recommendation: **no — narrow the route to admin**. The registered name is
what appears on executed paper; it belongs with the market and the currency,
which are admin-only. An Editor keeps the design step (logo, colour, layout),
which is what that permission was for. **If this is taken, it is a real
closure and must be named in the release note**, the way the August 2026
settings closures were.

**D-2. Does the footer text move too?** Recommendation: **no — leave it on the
design step**. Unlike the other three it genuinely is a design choice about
what prints at the bottom of a page.

**D-3. What happens to a workspace that has never filled these in?**
Recommendation: **nothing changes and nothing is invented**. The panel already
says "Not set", and the go-live checklist already has a row for the legal
entity. The org name typed at setup is a fallback for display only and must
not be silently promoted into the legal name field.

---

## PROOF REQUIRED

- The fields are on Company & market as visible pixels, and are GONE from the
  design step — asserted both ways, so a copy cannot pass as a move.
- Saving from the new home writes the same record the design step wrote:
  same route, same fields, read back unchanged.
- **The password guard still refuses**, asked of the server directly.
- The market dropdown does NOT ask for a password.
- Whatever D-1 decides, an Editor's experience matches the server's answer.
- Full suite green, plus the settings browser check extended.

---

## OUT OF SCOPE

- Any new field about the company (VAT number, trading name, and so on).
- Changing what the document prints.
- The org name typed at workspace setup.
