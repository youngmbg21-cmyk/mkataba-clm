# WORK ORDER — a staff directory everybody can read

**Raised by:** Young, 2026-08-14, reviewing what the admin-only settings page
closed off: "add B to the list".
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** CLOSED — built 14 Aug 2026 on Young's instruction ("complete the
rest of the work orders autonomously"), taking all three decisions as
recommended: it shows email addresses (D-1), it says who is an admin (D-2),
and a Viewer sees it (D-3).

One thing was built slightly larger than the order asked. It said "Phone: the
same list, in the phone's own row shape, under More" — and More is the list of
things the phone does NOT draw, every row of which ends at "open on a
computer". A staff directory is not desk work: it is four facts a row and it is
exactly what you want on a phone when you are trying to reach somebody. So its
row on More opens a REAL phone screen and carries a › rather than the computer
word. It decides nothing of its own — `dirPeople` is the desktop's own
ordering, so the two shells cannot disagree about the list.

Proof: f202 (25), people-directory-verify (25, browser — including the
ABSENCE as visible pixels on a real restricted member's page, and on a real
Viewer's), full suite 3582/3582, phone-verify 59/59.

The workspace RULES as a read-only page (option C) was NOT built, as this
order says. Every rule already explains itself where it bites.

---

## What was asked

Settings & Rules became admin-only in August 2026. A colleague can no longer
sit and read the roster in one place. This gives that back as a plain
read-only directory, without giving back anything that was closed on purpose.

---

## Correcting the record first

The overnight summary called this "the one real loss" for non-admins. That
overstated it. **What was lost is a PAGE, not the information.**

- Every signed-in member already receives the full roster at sign-in — name,
  email, role, job title — because the reviewer picker, the desk contributor
  picker and the approval rules all name colleagues.
- Every member already receives the workspace rules, because their own screens
  have to enforce them: an Editor still reads "needs an Admin's approval" on a
  contract and is still refused a send with the reason named.

So this is a screen, not a permission change. That is what makes it two hours
rather than two days.

---

## WHAT MUST NOT APPEAR ON IT — verified, not assumed

**Who can see which folders.** Tested on a real server as a member restricted
to Procurement: their browser receives their OWN scope and the field is
ABSENT on every colleague's record. The workspace-wide map is not in their
settings blob either, and `GET /api/settings` does not exist for them (404).

```
my own scope : ["proc"]
Amina Otieno         admin   folderAccess = NOT SENT
Restricted Legal     legal   folderAccess = ["proc"]   <- me
No Values Legal      legal   folderAccess = NOT SENT
Unrestricted Legal   legal   folderAccess = NOT SENT
```

That was the M-3 fix, done in two halves — stripped from the settings blob,
then stripped from the per-user records, because handing the same map back one
record at a time was the same disclosure more slowly. **This directory must
not undo either half.** It cannot accidentally: the data is not in the
browser. But a future change that put it back would silently widen this page,
so the test below asserts the absence rather than trusting it.

Also off the page: signing limits, who checks whose work, per-folder signing
rights, and the approval rules. All admin-only, all on Settings.

---

## THE BUILD

- A nav item, **People**, in the everyday group — visible to every role.
- One row per member: name, role, job title, email. Nothing pressable.
- Built from the roster the browser already holds. **No new route.**
- An admin sees no change: the editable People tab in Settings stays exactly
  where it is. Consider a line on this page pointing an admin there, so the
  two are not confused.
- Phone: the same list, in the phone's own row shape, under More.
- Both languages.

---

## DECISIONS

**D-1. Does it show email addresses?** Recommendation: **yes**. Everyone
already has them (they are in the pickers), and a directory without them is a
directory you cannot act on.

**D-2. Does it show who is an admin?** Recommendation: **yes**. Knowing who to
ask is the main reason to open it.

**D-3. Does a Viewer see it?** Recommendation: **yes** — reading who is in the
workspace is exactly the level of access a Viewer has.

---

## PROOF REQUIRED

- A real-server test signed in as a restricted member: the page lists every
  colleague and carries NO folder access, no signing limit, no review flag —
  asserted against the rendered page, not the intent.
- The nav item is drawn for a Viewer, and the admin's Settings People tab is
  unchanged.
- Full suite green.

---

## OUT OF SCOPE

- Any editing.
- The workspace rules as a read-only page (option C in the conversation) —
  deliberately not built. Every rule already explains itself where it bites,
  and a second copy of the rules is a second thing to keep true.
