# HaTi's process flows

The journeys the process flow check runs, and the ones still to be built.

You don't need to remember this list. Just ask Claude:
- "Which flows are on the list?"
- "Run a process flow check": runs every flow marked ✅.
- "Build the next flow on the list": builds the first ⬜.
- "Add … to the list", "Move … to the top" or "Take … off the list".

✅ = built: a saved check runs it whenever you ask for a process flow check
⬜ = not built yet

Most important first. This order is a first draft; change it any time by telling Claude.

1. ✅ **Sign up → create a contract → send it for signature**
   A new company signs up, drafts an NDA from HaTi's templates, names who signs on each side and sends it for signature by email. It then checks the email really reached the other side, and that the link in it opens the agreement ready to sign.

2. ✅ **Both sides sign → the contract is sealed as signed**
   Their signer signs on her own page with a code HaTi emails her; our signer settles what HaTi asks before a signature (Copilot's readings, the brief) and signs inside HaTi. The contract reads Executed, its seal names both signatures, and both sides are emailed the signed PDF. Carries one known problem (see the report).

3. ✅ **A negotiation round**
   We change three clauses and send them. The other side accepts one, turns one down with a reason and counters the third on their page, and their answers reach us.

4. ✅ **Review before sending**
   We add a colleague and ask him to review two changes; he clears one and holds the other back. Only the cleared change reaches the other side. Carries two known problems (see the report).

5. ✅ **Approval before signing**
   An admin rules that her contracts need a named colleague's yes. Sending for signature is refused until he approves; then it goes. Carries one known problem (see the report).

6. ✅ **Upload a contract the other side sent → Copilot reads it**
   We upload a supply agreement they sent. The first screen shows what Copilot read out of it; once filed, HaTi reads the whole contract (a brief, a check against Our standards, the promises it makes) and we add those promises to its obligations. Carries one known problem (see the report).

7. ✅ **Company standard template**
   We paste our own consulting agreement into the template builder, make its three fill-in places blanks, file it and publish it; then draft a contract from it and fill its blanks. Carries one known problem (see the report).

8. ⬜ **Add a colleague and control which contracts they can see**

9. ⬜ **Obligations**
   Add one, mark it done, and chase the other side.

10. ⬜ **Requests**
    Someone asks for a contract; legal accepts it and drafts it.
