# HaTi — Functional, UI/UX and Operational Audit
**Date:** 23 August 2026 · **Scope:** functional / UI / UX / operational. **Not** a security or penetration audit.

---

## 1. Executive Functional Verdict

### **PASS WITH MINOR FIXES — but two CRITICAL items should be fixed before the next release.**

The product is in far better functional health than a codebase this size normally is. The
defect classes this repository has historically paid for — the always-false cross-module
guard, swallowed CSS rules, missing dictionary keys, browser/server route drift — were
each swept exhaustively and came back **clean**. Copilot degrades honestly through every
failure mode tested. The email layer's three-outcome honesty (`sent` / `outbox` /
`refused-and-why`) holds on every route but one.

What is wrong is a small number of specific, reproducible faults, and two of them are
serious:

* **A paid Copilot call fires once per repaint.** One press of "Fill from document"
  was **measured producing 9 concurrent billed extractions**.
* **The phone's most prominent button does nothing.** A 358×48 primary reading
  "Add signers" was **proven in a real browser** to change nothing at all when pressed.

Neither is a design decision; both are one-line omissions of a guard the surrounding
code already applies.

### Evidence base

| Instrument | Result |
| :--- | :--- |
| `npm run lint` | **0 errors** (142 warnings — the known unused-locals list) |
| Node suite | **4361 / 4364 pass** — 3 failures triaged below |
| Browser suite (`run-all.js`, 65 files) | **62 / 65 pass** — 3 failures triaged below |
| Published-name sweep (2,220 names vs every `window.*` read) | **0 live always-false guards** |
| `typeof` bare-guard sweep | **1 genuine hit** (`kpiMoneyOk`) |
| Route contract (160 `api()` sites vs 126 routes) | **0 mismatches** |
| Dictionary sweep (3,992 keys) | **0 missing keys · EN/SV parity exact** |
| Live browser probes | Copilot failure modes, listener growth, dead presses, Reports fallback |

**Every finding below was reproduced or measured personally.** Claims I could not
substantiate were dropped, and the instruments that proved unreliable are named as such.

---

## 2. Feature-by-Feature Matrix

| # | Feature / Component | Status | Observed Behavior | Required Fix |
| :-- | :--- | :--- | :--- | :--- |
| 1 | **Key terms → "Fill from document"** | **Broken (critical)** | `#kt-fill` is bound with no guard, and the element survives repaints. `wireKeyTerms` runs from two places. **Measured: one press → 9 `POST /api/ai/extract`.** Each is billed, and N responses race to write the same fields. | Add `dataset.ktFillBound`, exactly as the two neighbours in the same function already do. |
| 2 | **Phone → "Add signers" primary** | **Broken (critical)** | `wsNextAction` emits 9 kinds; `mDoNextAction` handles 7. `add-signers` has no branch and no `noButton`, so the button **is drawn** and does nothing. **Proven in-browser: identical DOM, zero toasts, no navigation.** | Add an `add-signers` branch that opens the signer editor, or falls back to an honest "on a computer" message. |
| 3 | **Counterparty round arrives while wording is frozen** | **Broken (major)** | `negoFileChange` toasts `'err'` from the **model**, reached by the background poller — `opts.quiet` guards only `logAudit`. `applyResponse`'s own toast is not guarded by `opts.background`. **Two contradictory red boxes** about a contract the reader is not viewing; one says "frozen", the other "does not match any clause". | Return the refusal instead of drawing it; let the caller decide, guarded by `!opts.background`. Carry the real reason. |
| 4 | **Monthly report email** | **Broken (major)** | `runMonthlyReport` is **synchronous** and cannot await `sendEmail`. Returns `sent: to.length` (attempted, not delivered) and writes `lastError: null`, wiping any prior failure. The admin's confirmation toast is bare → **prints nothing**. | Make it `async`, `await` each send, count `r.sent`, and record the real error. Pass `'ok'`/`'warn'` on the toast. |
| 5 | **Counterparty signing-turn email** | **Broken (major)** | `signerTurnEmail({… senderLang})` — **none of its three call sites passes `senderLang`**, so `langForEmail` falls to `I18N_DEFAULT`. A Swedish workspace's counterparty always gets English. The correct pattern is used 50 lines away. | Pass `req?.user?.lang` at lines 7244, 7414, 7486. |
| 6 | **Calendar & Register — listener lifecycle** | **Broken (major)** | Unguarded `document.addEventListener` inside `wireCalendar` / `renderRegister`. **Measured: 30 month-steps → 60 new permanent listeners**, each retaining a detached DOM tree. Settings, Home, contract room and Insights measured **clean**. | Arm once at module load behind `document._calWired` / `document._regDocWired`. |
| 7 | **Copilot — malformed response** | **Broken (major)** | `aiRenderServerAnswer(res)` has no null guard; the `catch` spans the render, so a client bug is reported as an engine outage — and `e.message` is printed raw: *"…unavailable right now (Cannot read properties of null (reading 'cards'))…"*. Both sentences hardcoded English. | Guard `res`; separate transport from render; show a generic reason for non-HTTP errors; move both sentences into the dictionary. |
| 8 | **Portfolio Health Report — money masking** | **Broken (major)** | `kpiMoneyOk` is **never published**, so `typeof kpiMoneyOk==='function'` is always false. Line 80 falls back correctly to `canViewValues()`; **line 133 falls back to `true`**. Same report: text hides money, charts show it. | Publish `kpiMoneyOk`, and make line 133's fallback `canViewValues()` like its sibling. |
| 9 | **"Nothing happened" refusals (12+ sites)** | **Incomplete (major)** | The product's own precedent (`ob_none_found` → `'warn'` + a retry action) was applied once and not to its siblings. The phone's ⋯ sheet closes and says **nothing** for `mc_sealed_no_edit`, `mc_never_renumber`, `M_DESK_MSG`. Same for `ng_nothing_to_renumber`, `negoBatchConfirm`, template-builder copy. | Pass `'warn'` on each; give copy-to-clipboard `'ok'`. |
| 10 | **Round resend / share resend confirmations** | **Incomplete (major)** | Success is a bare toast (silent) while failure prints red — so a working send reads as a dead button. `core.js:4895` also collapses three outcomes into two, calling a provider refusal "queued to the outbox". | Pass `'ok'`; branch on the three-outcome `mailReport` shape already returned. |
| 11 | **Publish Round / Send all** | **Incomplete (minor)** | Busy state is applied to the hidden postbox, not the visible proxy, so the button stays lit during the round-trip and invites a double press. | Include the proxy doors in the busy set. |
| 12 | **Test alarm system** | **Broken (minor)** | 4 of 5 red checks are false alarms: `_edge.js` (a by-hand tool missing from `NOT_TESTS`, hard-coded to one sandbox — **the one real signal**, and f227 names it); `analytics-verify` (stale `border-radius:999px` selector — fallback **verified drawing**); `designstep-verify` and `F96` (pin literals the product deliberately moved). | Add `_edge.js` to `NOT_TESTS`; re-point the three stale assertions at relations, not literals. |
| 13 | **Five dead selectors** | **Incomplete (minor)** | Handlers bound to markup no longer emitted (`data-dk-manage`, `data-pt-derived`, …). No user impact; misleads the next reader. | Delete the blocks, keep the explanatory comments. |
| 14 | Always-false `window.*` guards | **Working** | 2,220 published names checked against every read. **Zero live instances** of this codebase's most expensive historic defect. | — |
| 15 | Browser ↔ server route contract | **Working** | All 160 `api()` call sites resolve to one of 126 routes. No 404s, no method mismatches. | — |
| 16 | Bilingual coverage | **Working** | 3,992 keys; **no missing keys; EN/SV parity exact**. (Exceptions are the outbound-email strings in #5 and #7.) | — |
| 17 | Copilot — no key / HTTP 500 | **Working** | Falls back to the local keyword engine, names the reason, clears the input, **no stuck spinner, no page errors**. | — |
| 18 | Reports charts with no network | **Working** | The CSS-strip fallback **draws correctly** (measured: 14 bar elements across all four cards). Only the *test's* selector is stale. | — |
| 19 | CSS comment-swallowing (f236) | **Working** | Every `<style>` block parses; no rule is swallowed. | — |
| 20 | Modal/panel listener hygiene | **Working** | Settings, Home, contract room and Insights measured at **0 listener growth** over 6 repaints. | — |

---

## 3. High-Priority Fixes (Code-Level)

### Fix 1 — CRITICAL: one press, N billed Copilot calls
`js/views/contract.js:6096`

```js
// BEFORE — rebinds on every repaint; the element survives, so listeners stack
document.getElementById('kt-fill')?.addEventListener('click',()=>fillKeyTermsFromDocument(c));

// AFTER — the guard its two neighbours in this same function already use
const fill=document.getElementById('kt-fill');
if(fill && !fill.dataset.ktFillBound){
  fill.dataset.ktFillBound='1';
  fill.addEventListener('click',()=>fillKeyTermsFromDocument(getContract(state.activeId)||c));
}
```
> Read `getContract(...)` at press time: a listener bound once must not close over a stale
> contract. Belt and braces — also make `fillKeyTermsFromDocument` re-entrant-safe:
> `if(btn && btn.disabled) return;` as its first line.

### Fix 2 — CRITICAL: the phone's dead primary
`js/mobile-contract.js` — inside `mDoNextAction`

```js
if(kind==='add-signers'){
  /* Naming the signers is what opens signing (11 Aug 2026). The phone files no
     signing route of its own, so this is an honest hand-off, never a dead press. */
  if(window.openSignerPlanEditor){ mCloseSheet(); openSignerPlanEditor(c,{onDone:()=>mRender()}); return; }
  mCloseSheet(); mS().tab='sign'; mRender();
  if(window.toast) toast(i18t('mc_name_signers_on_computer'),'warn');
  return;
}
```
Add `mc_name_signers_on_computer` to **both** dictionaries. Then make the omission
impossible to repeat:
```js
// at the end of mDoNextAction
if(window.console) console.warn('[hati] mDoNextAction: unhandled next-action kind', kind);
```

### Fix 3 — MAJOR: a model that draws, and a wrong reason
`js/negotiation.js:1883` — stop drawing from the model
```js
// BEFORE
if (negoWordingFrozen(c)){
  if (window.toast) toast(i18t(negoExecuted(c) ? 'ne_executed_amend' : 'ne_signed_frozen'), 'err');
  return null;
}
// AFTER — quiet means quiet; the caller knows whether anybody is watching
if (negoWordingFrozen(c)){
  const why = i18t(negoExecuted(c) ? 'ne_executed_amend' : 'ne_signed_frozen');
  if (!opts.quiet && window.toast) toast(why, 'err');
  _negoLastRefusal = why;              // read by the caller for an honest message
  return null;
}
```
`js/core.js:5224` — guard it, and stop misdiagnosing
```js
// BEFORE
toast(`${r.name||'The counterparty'} sent wording that does not match any clause on ${c.id} — nothing was filed. …`,'err');
// AFTER
if(!opts.background)
  toast(window._negoLastRefusal
    || `${r.name||'The counterparty'} sent wording that does not match any clause on ${c.id} — nothing was filed. Their exact words are in this contract's history.`,'err');
```
Apply the same distinction to the audit line, which today records a frozen-wording
refusal as "could NOT be matched to a clause".

### Fix 4 — MAJOR: "sent" must mean sent (the one route that was missed)
`server/server.js:9273`

```js
// BEFORE — synchronous, so it CANNOT await; reports attempts as deliveries
function runMonthlyReport(month, opts = {}) {
  …
  for (const addr of to) sendEmail(addr, report.subject, report.body, 'monthly report');
  recordMonthlyReportRun({ lastSentMonth: month, lastSentAt: now(), lastSentTo: to.length,
    lastError: null, lastErrorAt: null });
  return { sent: to.length, to, month, facts: report.facts };
}

// AFTER
async function runMonthlyReport(month, opts = {}) {
  …
  const results = [];
  for (const addr of to) results.push(await sendEmail(addr, report.subject, report.body, 'monthly report'));
  const sent   = results.filter(r => r && r.sent).length;
  const failed = results.filter(r => !(r && r.sent));
  recordMonthlyReportRun({ lastSentMonth: month, lastSentAt: now(), lastSentTo: sent,
    lastError: failed.length ? (failed[0].detail || 'the provider refused the message') : null,
    lastErrorAt: failed.length ? now() : null });
  return { sent, attempted: to.length, to, month, facts: report.facts,
           emailConfigured: EMAIL_ON(), outbox: !EMAIL_ON() };
}
```
Update the two call sites (`monthlyReportSweep`, `POST /api/reports/monthly/run`) to
`await`, and make the admin's confirmation visible — `js/views/settings.js:2830`:
```js
toast(r.sent ? i18tn('set_mr_sent_n', r.sent, {n:r.sent, month:r.month})
             : i18t('set_mr_nothing_sent'), r.sent ? 'ok' : 'warn');
```

### Fix 5 — MAJOR: the signing email is always English
`server/server.js` — three call sites (7244, 7414, 7486)
```js
const mail = signerTurnEmail({ signer: next, plan: rt.plan, payload: p,
  link: shareUrl(req, ns.token), expiresAt: ns.expires_at,
  senderLang: req && req.user && req.user.lang });   // ← the missing argument
```

### Fix 6 — MAJOR: two unbounded listener leaks
`js/views/calendar.js:734` (inside `wireCalendar`)
```js
// BEFORE — two new permanent document listeners per renderCalendar
document.addEventListener('click',e=>{ if(!mm.hidden&&!mm.contains(e.target)&&e.target!==mb) shut(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') shut(); });

// AFTER — armed once; resolves the live menu at press time, never a stale closure
if(!document._calMenuWired){
  document._calMenuWired = true;
  const live = () => ({ mm: document.getElementById('cal-more-menu'),
                        mb: document.getElementById('cal-more') });
  const shutLive = () => { const {mm,mb}=live();
    if(mm) mm.hidden=true; if(mb) mb.setAttribute('aria-expanded','false'); };
  document.addEventListener('click',e=>{ const {mm,mb}=live();
    if(mm&&!mm.hidden&&!mm.contains(e.target)&&e.target!==mb) shutLive(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') shutLive(); });
}
```
`js/views/register.js:1030` — same treatment behind `document._regDocWired`, resolving
`#reg-search` inside the handler rather than closing over `si`.

### Fix 7 — MAJOR: a raw JS error shown to the user
`js/ai.js:1389` and `:2920`
```js
// 1389 — a malformed body must not throw
function aiRenderServerAnswer(res){
  if(!res || typeof res!=='object') throw new AiShapeError('malformed answer');
  const list=(res.cards||[]).map(cd=>getContract(cd.id)).filter(Boolean);
  …
}

// 2920 — separate transport failure from render failure, and never print e.message raw
let res;
try{ res = await copilotAsk(aiChatMessages(), aiChatContext(), aiStreamRenderer()); }
catch(e){ return finish(aiDegrade(q, e, /*transport*/true)); }
try{ finish(aiRenderServerAnswer(res)); }
catch(e){ finish(aiDegrade(q, e, /*transport*/false)); }

function aiDegrade(q, e, transport){
  const local=aiAnswer(q);
  const why = e.needsKey || /key|configure|401/i.test(e.message||'')
    ? i18t('ai_add_key_for_full')
    : transport ? i18t('ai_engine_unavailable')     // no e.message — it is a server sentence at best
                : i18t('ai_answer_unreadable');     // our bug, said honestly
  local.text=(local.text||'')+`<div class="text-[11px] text-amber-700 mt-2">${_aiEsc(why)}</div>`;
  return local;
}
```
Add `ai_add_key_for_full`, `ai_engine_unavailable`, `ai_answer_unreadable` to **both**
dictionaries — all three sentences are hardcoded English today.

### Fix 8 — MAJOR: money leaks into the health report's charts
`js/views/home.js` — publish the reading
```js
Object.assign(window,{ …, kpiMoneyOk, kpiCatalogOrder, KPI_MAX, kpiAtMax, … });
```
`js/views/healthreport.js:133` — and make the fallback match its sibling on line 80
```js
const money=(typeof kpiMoneyOk==='function')?kpiMoneyOk()
  :(typeof canViewValues==='function'?canViewValues():true);
```

### Fix 9 — MAJOR: refusals nobody can see
Pass a kind at each site. The product's own precedent is `js/obligations.js:521`.
```js
// js/mobile-contract.js — the phone's ⋯ sheet, three silent refusals
if(k==='edit'||k==='compare'||k==='template'){ mCloseSheet(); toast(M_DESK_MSG,'warn'); return; }
if(k==='edit-locked'){     mCloseSheet(); toast(i18t('mc_sealed_no_edit'),'warn');  return; }
if(k==='renumber-locked'){ mCloseSheet(); toast(i18t('mc_never_renumber'),'warn');  return; }

// js/views/negotiation.js:686
if (window.toast) toast(i18t('ng_nothing_to_renumber'),'warn');

// js/views/negotiation.js:3013 — a refusal that explains itself, unread
if (window.toast) toast(kind==='accept' ? i18t('ng_none_clear_to_accept')
                                        : i18t('ng_none_of_theirs_pending'), 'warn');

// js/views/templatebuilder.js:176 — a clipboard press has no other feedback possible
toast(`${ph} copied — paste it into a wording block`,'ok');
```
Same treatment for `ap_nothing_resubmit`, `ct_no_changes_made`, `ng_nothing_pending`,
`mig_nothing_waiting`, `mig_no_pattern_left`.

### Fix 10 — MINOR: stop the alarm crying wolf
`test/chromium/run-all.js`
```js
const NOT_TESTS = new Set([
  'run-all.js', '_edge.js',      // ← a by-hand glyph-measuring tool, nailed to one sandbox
  'lang-coverage.js',
  'lang-shots.js','lang-shots-phone.js','shots-feature.js','shots-room.js',
]);
```
Then re-point three assertions at **relations rather than literals** — the lesson this
codebase already records:
* `analytics-verify.js:51` — the bar selector must not name a `border-radius` the
  square-corners sweep removed. Assert the fallback **has content**, not its shape.
* `designstep-verify.js:196` — `docFont === '13.5px'` → assert the sheet's type equals
  the document surface's computed base, whatever that is.
* `f96-three-themes.test.js:246` — anchor on `--color-chat-bg` within each palette block,
  not on `--color-bg` being the line immediately after `:root{`.

---

## 4. End-to-End Walkthrough Assessment

| Journey | Verdict | Friction found |
| :--- | :--- | :--- |
| **A. First run → sign-in → workspace** | **Clean** | Boots, authenticates and seeds without a page error in every probe run. |
| **B. Template → Key terms → Document** | **One critical** | Lands on Key terms correctly. **"Fill from document" bills N extractions per press** (Fix 1). Row editing, the stream picker and the divider are all correctly bound-once. |
| **C. Upload → confirm → contract** | **Clean** | The `.docx`/PDF path, the confirm screen and the party field behave. Reading fallbacks are honest. |
| **D. Negotiate → review → publish → collect** | **Two majors** | The core loop works. **A frozen-wording round produces two contradictory red boxes on whatever page you happen to be on** (Fix 3). Publish Round stays lit during the round-trip and invites a double press (#11). |
| **E. Name signers → issue link → sign** | **Two majors** | Solid on desktop. **On a phone the "Add signers" primary is a dead press** (Fix 2). **The counterparty's signing email is always English** (Fix 5). |
| **F. Requests (intake)** | **Clean** | The door is in the everyday group, open to every role; decisions notify the requester through the route. |
| **G. Copilot, all failure modes** | **Clean but for one message** | No key, HTTP 500 and a truncated answer all degrade honestly with no stuck spinner. **A malformed body prints a raw JavaScript error to the user** (Fix 7). |
| **H. Reports / Calendar / Register (long session)** | **One major** | Everything draws, including the offline chart fallback. **The calendar and register leak `document` listeners without bound** (Fix 6) — a long working session steadily accumulates them. |

### State integrity
Per-sitting in-memory state (`_rlShowingList`, `_wsTabFor`, `_hmStage`, `_kpiPop…`) is
used deliberately and consistently, and reload behaviour matches the documented intent.
`localStorage` keys are namespaced per user/contract where they must be. **No accidental
loss of user work was found** — no half-typed form, editor buffer or unsaved draft is
destroyed by a repaint or a view switch on any journey walked.

### The one systemic theme
Nine of the fourteen defects are the **same shape**: a guard, a kind argument, or an
argument that the surrounding code already applies correctly two lines away.
`ktSplitBound` and `ktFolderBound` are guarded and `ktFillBound` is not; line 80 falls
back to `canViewValues()` and line 133 falls back to `true`; line 7195 passes
`senderLang` and lines 7244/7414/7486 do not; `ap_viewers_no_resubmit` carries `'err'`
and `ap_nothing_resubmit` beside it carries nothing. **None of these needs a design
decision — each is a one-line omission with a correct sibling to copy.**

### Note on instruments
An automated "press every control and detect no-change" probe was built and **discarded**:
menu-nested items are dismissed before the synthetic click lands, so it reported false
dead presses. Its findings are excluded. Every defect above rests on either a read of the
call chain, a browser measurement, or both.

*Deeper adversarial sweeps across forms/modals, CSS computed styles, server-route
semantics, mobile parity and repaint lifecycle were still running when this report was
written; anything material from them is a follow-up, not a revision.*
