# Work order: one door to a new agreement, and the Track's press (owner, 24 Oct 2026)

Agreed with the owner in chat, 24 Oct 2026.

**BUILT, 24 Oct 2026.** Build 2 (the Track's press) first; Build 1 after the
owner picked "The Legora way" by name ("go with the Legora way, build both"),
with "Pick it when clear" and "Free reader". Waiting on the owner's yes to the
drawn-against-built side-by-side before it merges.

Run the Six Questions and the Nine Flow Rules on each build, as CLAUDE.md asks.

---

## 1. One door to a new agreement

The owner: *"When i want a contract i get 2 different doors. Why is this"* and
*"This is all over the place. Create a flow of how the one door should look
like … and then we will delete the rest after we agree on the way forward."*

**Today there are four first screens for one wish:**

- Typing "draft", "new agreement" or "draft a new agreement" gives the chat card
  "Draft a new agreement · Use our template · Upload their paper"
  (`CA_PLACES` key `draft` → `caDraftCardHtml` place `draft`).
- Any other sentence ("Draft a contract", "create a new agreement") opens the
  "From your words" sheet (`caIsDraftAsk` → `caDraftForm` → `openNewAgreement`,
  `na-one`). Once it opened with no Jambo beside it.
- "Use our template" on that card opens the older form: template list on the
  left, "Or describe what you need", Skip the questions
  (`openNewAgreement({door:true})`, not `na-one`).
- "+ Draft new agreement" opens the drop-down "Draft from HaTi · Upload a
  contract" (`openNewDoors`), then the older form.

**Options drawn:** The SAP way · The Legora way · The paper fills itself.
Claude recommended The Legora way. **The owner picked The Legora way, 24 Oct 2026.**

**Already decided by the owner, whichever option is picked:**

- **Every way in ends on the one screen**: the + button, any words to Jambo,
  Templates "Use this", Requests "Start the draft", a customer's "New contract",
  and a file dropped on Jambo.
- **Always beside Jambo** on a computer. The phone keeps its own screens.
- **Our paper or theirs is chosen on that screen**, never on a chat card or a
  drop-down before it (keeps the 15 Oct 2026 ruling that their paper can always
  be chosen).
- **Write it to Jambo, land filled in** (owner: *"i should be able to simply
  write the type of contract i want with the details in the jambo side panel and
  it drops me in step 2 with the details filled in"*). From any page, the
  contract type plus details typed in Jambo's side panel lands on the screen
  past the questions already answered, every detail filled. No card, menu or
  our/theirs question in between: "they sent" or a dropped file means their
  paper, anything else ours.
- **Once created it drops into the Workspace with the Dossier** (owner: *"one
  created it should drop in the workspace window with dossier"*). The form
  closes, Home's Workspace tab shows the new paper, the Dossier opens beside it
  on Fill in, and Jambo's reading shows under Read with its cost. Nothing else
  opens.

**Deleted once the owner picks:** the chat card, the older form, the drop-down,
and any path that opens the form without Jambo. Kept: the upload reader, the
template builder, Requests, the phone's screens.

## 2. A press on the Track opens the clause in Clauses; it asks Jambo nothing

The owner, on the marks down the left of the paper (the Track): *"when you click
on clause 5 [it] immediately writes a question to jambo asking what could be the
implications. at the same time, the answer is on the clauses tab … Simply stop
asking the question and move me to where image 2 is so i can read there and
deepdive. Update the tooltip as well."*

**Today:** a press on a Track mark (`igStrandPress`) writes a question into
Jambo's box (`igStrandQuestion`, `int_strip_q`) under every tab except Clauses.
The tooltip says "Press to go there and ask Jambo" (`int_strip_go`).

**Build:**

- A press on a Track mark switches the panel to the **Clauses** tab, opens that
  clause's row there (its Plain English and its cards, with Start redlining,
  Deep dive and Mark reviewed) and lands on it with `landOn`. It writes nothing
  into Jambo's box and presses nothing.
- The paper still scrolls to the clause, as today.
- **The tooltip** says where the press goes, e.g. "Press to open it in Clauses",
  in both books (Swedish too). Retire the old sentence by not calling it.
- **Every place the Track is drawn** gets the same press (Rule 2): Home's paper
  under every tab, and any other paper that draws the Track (`igTrackHostHome`
  and its other hosts).
- If Clauses cannot show the clause (no reading yet), say why on the Clauses tab
  with its way forward, never a silent press.
- MAP: update the Track line in CLAUDE.md, and the story in MAP-HISTORY.
