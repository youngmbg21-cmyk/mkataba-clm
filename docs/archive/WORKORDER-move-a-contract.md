# WORK ORDER — an admin can re-file a contract

**Raised by:** Young, 2026-08-14: "Admins should be able to move a contract to
a different folder."
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** CLOSED — built 14 Aug 2026 on Young's instruction ("complete the
rest of the work orders autonomously"), taking this order's own
recommendations for D-1, D-2 and D-3. M-1 to M-4 landed, and so did the
custom-folder honesty line in the rider.

M-4 was checked rather than assumed. Folder access and per-folder signing
rights read the folder id at request time and follow a move on their own; an
approval rule with a `folder` condition is rebuilt on every read, so a moved
contract picks up the new folder's rules and an already-approved step is left
alone, exactly as recommended; and **a live share link is unaffected** —
`buildSharePayload` never carries `folder` at all, and the portal supplies its
own default where the payload has none.

**Not taken, as this order asked:** bulk re-filing (D-3), and moving custom
folders to the server. No custom folder has ever been created in this
workspace, so the second is half a day's work for a problem nobody has; the
panel now states where a folder you create actually lives instead.

Proof: f200 (31), refile-a-contract-verify (26, browser), full suite
3528/3528.

---

## What was asked

A contract is filed into a folder when it is created and cannot be moved
afterwards. HaTi picks the folder automatically for most contracts, so it will
sometimes pick wrong, and there is currently no way to correct it. An admin
should be able to.

---

## THE HALF NOBODY ASKED FOR, WHICH IS THE MORE URGENT ONE

The ask is "let admins move a contract". Checking the server first turned up
the opposite problem: **anyone with edit rights can already move a contract,
today, and nothing stops them.**

`PUT /api/contracts/:id` asks two questions about folders
(server/server.js ~2016):

```js
if (existing && !inScope(scope, existing.folder)) return 404;   // can you see where it IS
if (!inScope(scope, contract.folder))            return 403;    // can you see where it is GOING
```

Both are scope questions. Neither asks whether the folder CHANGED. So an
Editor sending back a contract with a different `folder` has it re-filed, with
no refusal, no audit line and nobody told. The interface never offers the
control, which is the only reason this has not happened by accident.

**So this order is really: add the control for admins, and close the gap for
everybody else.** Building the first without the second would ship a feature
that says "admins only" over a rule that is not enforced.

---

## THE BUILD

### M-1. The server guard — asked as a difference

In `PUT /api/contracts/:id`, beside the other difference-guards (the signing
route, the review, the desk, the signing limit):

```
did this save CHANGE the folder, and is the caller an admin?
```

- A save that leaves the folder alone passes untouched. **This is the whole
  pattern on that route** — the question is never "may this person touch
  folders", because every ordinary save carries the folder unchanged.
- A change by a non-admin: **403, in words**, naming the folder it is in and
  saying an admin can move it.
- **Both scope checks stay exactly as they are.** They ask a different
  question and they are still the reason a contract cannot be moved somewhere
  invisible.
- The creation case must not be caught: a contract that did not exist a moment
  ago has no previous folder. Guard on `existing` being present, as the other
  difference-guards there do.

### M-2. The control

On the contract's **Key terms** panel, where the folder is already stated:
a picker, drawn only for an admin.

- Everyone else keeps seeing the folder as read-only text, exactly as now.
- The picker offers the folders **the admin can see** — `visibleFolders()`,
  which is the one reading every other folder list in the product uses. Do not
  build a second list.
- **Changing it is a real act, not a form field.** It writes an audit line —
  *"Re-filed from Marketing & Brand to Corporate & Compliance by Young
  Mbagaya"* — because a contract quietly changing drawer is exactly the kind
  of thing somebody needs to be able to reconstruct a year later.

### M-3. What moves with it

Re-filing a contract changes who can see it. That is the point and it is also
the risk, so it must be said before it happens, not discovered afterwards.

The confirm names the consequence in plain words: **how many people can see it
now, how many will be able to see it afterwards, and whether that number goes
up or down.** The count is the same reading the folders panel already prints
("N of M people can see it"), so there is no new arithmetic.

**Refuse nothing on that basis** — an admin moving a contract into a narrower
folder is a legitimate act, and often the point. Say what happens; do not
decide it for them.

### M-4. The things that follow the folder, checked not assumed

Before building, establish what else keys off `c.folder` and confirm each
still behaves after a move. Known so far:

- **Folder access** (who may open it) — follows automatically, it is read from
  the folder id at request time.
- **Per-folder signing rights** (August 2026) — same, follows automatically.
- **Approval rules with a `folder` condition** — the chain is rebuilt on every
  read (`buildApprovalChain`), so a moved contract picks up the new folder's
  rules. **Decide what happens to a step already APPROVED under the old
  folder's rule.** Recommendation: leave approved steps alone and let the new
  rule appear as an outstanding step — the same way `approvalDrift` already
  handles a contract that has changed since approval.
- **Anything that has already been SENT** — a share link carries a payload
  built at mint time. Establish whether a live link is affected at all;
  expected answer is no.

---

## DECISIONS TO TAKE BEFORE BUILDING

**D-1. Can a signed contract be moved?** Recommendation: **yes**. Filing is
housekeeping, not part of the agreement — nothing in the executed document
mentions the folder, and a mis-filed executed contract is precisely the one
you most want to be able to find. The audit line records it.

**D-2. Should it be possible to move a contract into a folder the admin cannot
see?** Recommendation: **no** — the existing scope check already refuses this
and should keep refusing. An admin holds every folder anyway, so it is
theoretical for them; it matters if this is ever widened past admins.

**D-3. Bulk move, or one at a time?** Recommendation: **one at a time, for
now**. A bulk re-file is a much larger blast radius and the ask was about
correcting mistakes, which are usually singular. Revisit if the back-catalogue
import turns out to file badly at scale.

---

## RIDER — the custom-folder honesty line

Established the same day: **no custom folders have ever been created in this
workspace**, so the browser-only storage problem is theoretical rather than
live.

The August 2026 settings work put a rename box and a delete button on custom
folders in the settings panel, which makes a browser-only list look like a
company setting. That is more confidence than the storage deserves.

**Smallest honest fix, to ship with this order:** one line on the Contract
folders panel saying a folder you create is saved in this browser, not shared
with colleagues. Both languages. No behaviour change.

**Not recommended right now:** moving custom folders to the server. It is
half a day's work to solve a problem nobody in this workspace has. Revisit the
day somebody creates one — and note that if that day comes, the folder
picker's "＋ Create new folder…" option is the door they will come through,
not the settings panel.

---

## PROOF REQUIRED

- A real-server test: an Editor's folder change is refused (403), an admin's
  lands, and a save that does not touch the folder passes for both.
- The audit line exists and names both folders and the person.
- A moved contract is visible to the right people afterwards and invisible to
  the wrong ones — asked of the server, with two members on different folder
  lists.
- The control is drawn for an admin and NOT for an Editor — as visible pixels,
  in a browser, since a control that is present and invisible passes every
  other kind of test.
- Full suite green.

---

## OUT OF SCOPE

- Bulk re-filing.
- Letting non-admins move contracts (this order deliberately narrows what is
  possible today).
- Custom folders becoming a workspace setting.
