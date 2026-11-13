# WORK ORDER — The Fill in form, The Legora Way, drawn properly

**Status: WRITTEN 13 Nov 2026. BUILT 13 Nov 2026** (owner: *"build it"*), on the recommended answers to the open questions: the paper's own names in sentence case, addresses on one line. Not yet merged; the side-by-side waits for the owner's yes.

**The picture the owner chose:** artifact "Fill in form options",
https://claude.ai/artifact/WFHJXh5RyHLw9okRmgp71B. A copy is saved beside this
file as `docs/WORKORDER-fill-in-form-legora.html`. Press **The Legora Way** at
the top. That drawing is the picture; this file is the list of jobs.

**The owner's words, in order (13 Nov 2026):**

1. *"this page is a very ugly page. First and foremost, in plan short english, if the paper is where you fill in the details, what is this page for?"*
2. *"okay, now provide me with much better proposals of how it should look like as it is very ugly at the moment"*
3. *"Create a job order for the legora way"*

The Legora Way was picked by name over **The SAP Way** (a grouped form, two
across) and **One at a time** (one question on the screen). Both were drawn and
turned down.

**Where this page is:** the form that opens in the middle from "Fill in" on the
Dossier (CLAUDE.md, THE DETAILS TAB, "THE FORM"; `pdFormHtml`, `pd2FormRegroup`,
`pd2FormChipsPaint` in js/paperdesk.js). The Legora Way was first picked for it
on 12 Nov 2026. This order does not change the idea. It finishes it.

---

## WHAT IS WRONG TODAY (the owner's screenshot, MK-469)

- Every name is the paper's placeholder in capitals: "Landlord Principal Place Of Business Address".
- The right column says "On the paper COMMERCIAL LEASE AGREEMENT" on row after row. It is a heading, not the sentence the blank sits in, so it tells the reader nothing.
- The boxes are of different kinds and heights (some with a drag corner), so the rows do not line up.
- There is a wide empty gap between a name and its box.
- The head line is crowded: "17 needed · 5 ready · nothing is saved until Save".

---

## THE JOBS

### 1. One row shape for every detail
- Each row reads left to right: a small dot · the name with its source line under it · the answer · a tick.
- The dot is amber while the detail is owed and green once it has an answer. The tick shows only when it has one.
- The answer column is ONE fixed width on every row, so every underline starts and ends at the same place.
- Every typed answer is one line high with an underline that darkens when typed in. No box, no ring, no drag corner (the standing rule, f1028). An address is one line too.
- A date and a choice keep HaTi's own date picker and dropdown, dressed to the same height and underline.
- Where a detail has a unit the PAPER states (sq ft, days, years, a currency), it stands quietly after the underline. A unit is never guessed.

### 2. The source line shows the sentence, not the heading
- Under the name: the § in the furniture's type, then the paper's own sentence around the blank in the paper's type, in quotes, cut at words.
- The blank inside the quoted sentence is drawn as a short amber gap.
- While the reader types, the words appear inside that gap, so they read the finished sentence. This is drawing only. Nothing is stored until Save.
- Where HaTi cannot lift a sentence for a blank, the row shows the section's name in sentence case, never capitals, and no quote. It never shows an invented sentence.
- A detail that is not on the paper keeps its existing words (`pd2_fm_src_none`).

### 3. Names a person can read
- The name is shown in sentence case: "Landlord principal place of business address", not every word capitalised.
- See OPEN QUESTION 1 for the shorter plain names in the drawing ("Landlord's address").

### 4. The head and the chips
- Head: "Fill in the contract", then one quiet line: the contract's name · "17 needed" in amber · "5 on record".
- "Nothing is saved until Save" is said once, in the foot beside the count, and leaves the head line.
- Chips stay as they are: All · Needed · the third chip. The third chip's words become "On record" where it lists what already stands. A chip that would show nothing is not listed (standing rule).

### 5. What already stands
- Under the owed rows, one quiet line "On record, nothing to do", then the known details in the SAME row shape: green dot, name, where it was read (§ and quote, or "Filed by you" / "On the signing route"), the value as plain words, the tick.
- That line is a label inside the list, not a band or a notice.

### 6. The foot
- Left: "0 of 17 filled · nothing is saved until Save". Right: Save (the one black button), then Discard last.
- Enter in a row moves to the next row's answer, as today.

### 7. Both languages, the handbook, the checks
- Every new or changed label in both books (js/i18n.js). A retired label is left inert in both.
- The handbook chapter that covers filling in a contract is re-read and corrected in the same change (rule 9d). Its picture recipe must still find its targets; pictures are not re-taken.
- The area's tests in docs/MAP-TESTS.md under THE DETAILS TAB are run. A new check must fail on main before the change.
- Photos at the owner's three screens (1440×780, 1536×730, 1366×950), new look on, with a fit check at the shortest.
- Before merging: a side-by-side, drawn against built, every part ticked or named. The merge waits for the owner's yes.

---

## LEFT ALONE, ON PURPOSE

- Jambo's panel beside the form, and his one-sentence fill. The drawing shows a simplified panel only so the page is true to size.
- Filling in on the paper itself. Nothing there changes.
- The phone.
- What Save stores, and who may save. Only the look changes.
- The signer row's search box keeps its behaviour and takes the new row shape.

---

## OPEN QUESTIONS — to be answered BEFORE building

These are parts of the drawing that may not be buildable as drawn. Under the
rule "the picked design is the agreement", each one stops the round until the
owner answers.

**1. The short plain names.** The drawing says "Landlord's address" and
"Monthly rent". HaTi does not have those words. The name comes from the paper's
own placeholder ("Landlord Principal Place of Business Address"). HaTi may not
guess a shorter name. Choices:
   - (a) The paper's own words in sentence case. No AI, always true to the paper. **Recommended.**
   - (b) Jambo writes a short name for each. This spends on a read and can be wrong.

**2. The sentence around each blank.** The sentences in the drawing are
examples written for the picture. Before building, check on real contracts
(an upload, a company standard, our own paper) how often HaTi can lift the real
sentence around a blank, and report the count to the owner. Job 2 already says
what a row shows when it cannot.

**3. Addresses on one line.** Today an address is a tall box. The drawing has
one line. A long address will scroll inside its line. If the owner wants two
lines for addresses, say so and the rows with addresses will be taller than
the rest.
