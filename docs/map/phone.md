# HaTi — phone

*the phone shell below 768px*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## THE PHONE

Below 768px the desktop shell hides and js/mobile*.js draws instead. NOT a fork: it reads hmDashSlices(), regFiltered()/regState(), wsNextAction(), negoTimeline()/negoIntegrityReport(), negoRenumberPlan()/negoRenumberApply(), buildSharePayload() + POST /api/shares. It files NO changes of its own — deliberate; grep the mobile files for changes.push / negoFileChange and find nothing.

DUPLICATION WARNING extended: ask whether the thing you change is drawn on the phone too (contract screen, register, dashboard figures, Copilot panel, counterparty pages all are). A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not. The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — never add a second proposal path for touch; the negotiations list reuses renderNegotiationsList the same way.

Bottom bar: Home / Contracts / Negotiate / Approvals. Labels are floored at 14px and phone-verify measures every one of them — a fifth item, or a longer word, has to be paid for out of the WORD, never out of the type.
