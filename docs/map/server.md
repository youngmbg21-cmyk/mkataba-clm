# HaTi — server

*server routes, guards and outbound email*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## "SENT" MUST MEAN SENT (14 Aug 2026 — the re-audit's second pass, owner-asked: "fix the email")

THE FIRST AUDIT SAID IT HAD NOT COVERED REAL OUTBOUND EMAIL, and that absence was the finding. Every test ran with email OFF, so the OUTBOX branch was the only branch any of them had ever taken — nothing had executed the code that talks to a provider, reads its refusal, or reports what it said. `startMailStub` / `startHatiWithMail` (test/helpers.js) close it: RESEND_BASE_URL is overridable exactly as ANTHROPIC_BASE_URL is, so the whole live path runs for real against a stand-in that records what it was handed and can be told to refuse (`ok` / `refuse` / `dead`). Nothing fires at anybody's inbox.

THREE ROUTES ANSWERED `emailSent: EMAIL_ON()`, which is not "it went" — it is "a key is configured". With a key present and the provider refusing (an unverified sending domain, the commonest real mail failure there is), HaTi told an admin the welcome message with the temporary password had gone, told a counterparty their SIGNING CODE was on its way, and told somebody locked out of their account to check their inbox. Nothing arrived in any of the three and nothing anywhere said so. **This rulebook had already solved exactly this once**, for the internal review notice — "three ways nothing arrives looked identical from the requester's chair" — and these three simply never got it.
- `mailReport(r)` beside sendEmail is the ONE shape: `{emailSent, emailConfigured, outbox, emailError}`. `outbox` is the honest THIRD answer and is not a failure — with no provider the message queues where an admin can read it, which is what the product promises.
- `mailReportPublic(r)` is the same three outcomes for a PUBLIC reader. The counterparty must learn nothing arrived — otherwise they sit waiting for a code that is never coming — but the provider's words name our sending domain and our configuration. The FACT crosses; the DETAIL stays in the admin-only outbox. f205 asserts the diagnostic does NOT travel.
- THE PASSWORD RESET IS THE EXCEPTION AND IS ASSERTED BOTH WAYS. Its reply must stay byte-identical whether or not the address is on file, or the route becomes an account-existence oracle — so it reports nothing and the send is merely AWAITED, which is what puts the outbox row down before the request ends. The failure is a fact for the ADMIN, not one this response may carry.
- Seven sends were fire-and-forget; the three that report to a person are awaited now. `/api/users`, `/api/shares/:token/otp` and `/api/password/reset-request` all became `async`.

CONFIGURED IS NOT DELIVERING — a second reading, and until now nothing asked it. Both screens that report on email read `emailOff()` alone, so a workspace whose domain was never verified showed a green "Email configured" on Build & Launch while every message bounced. `emailHealth()` (server, beside the outbox route) reads the last EMAIL_HEALTH_WINDOW=10 attempts — one historic failure must not condemn a working provider, and a long tail of old successes must not hide one that has just started refusing. `emailFailing()` / `emailFailedCount()` (js/core.js) are the browser's readings; THREE STATES now, not two, on the go-live row, the mail panel's row and the outbox heading, which also prints the provider's own reason because "the domain is not verified" tells an admin exactly what to go and do. WITH NO PROVIDER NOTHING IS CALLED A FAILURE — that is emailOff()'s state, and two warnings on one state sends somebody hunting a fault that is not there. IT TRAVELS AT SIGN-IN (bootstrap) because an Editor about to press Send needs it as much as an admin does; `lastError` is admin-only, the same split as folderAccess.

Tests: f205 (5 — both providers, all three routes, the reset asserted both ways, the health reading, and the no-provider state), sim-e-email-live.audit.js (26).
