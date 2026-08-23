# HaTi — Functional, UI/UX and Operational Audit
**Date:** 23 August 2026 · **Scope:** functional / UI / UX / operational. **Not** a security or penetration audit.

> ### Revision — deeper sweeps completed
> The first pass of this report carried 14 findings I had personally reproduced. A twelve-dimension
> adversarial sweep (206 agents, every finding put to two independent skeptics) then completed and
> returned **85 confirmed findings — 10 critical, 47 major, 28 minor**, listed in the appendix.
> Three new criticals are added below and **one earlier finding is corrected**. The verdict moves
> from *Pass with minor fixes* to **Pass with fixes required**.

---

## 0. Corrections and additions

### Correction — the health report does **not** leak money
My earlier row 8 said "text hides money, charts show it." **That was wrong**, and the correction
matters because it changes what you would do about it. The value-bearing charts are built, but
`buildHealthReportHtml` re-gates every emission on the *correct* reading, so **no figure ever
reaches a restricted reader.** The cost is two Chart.js renders that are computed and thrown away.
It is worth fixing as hygiene — the guard that was meant to be the primary gate can never fire —
but it is **not a live disclosure**, and it should not be treated as urgent.

### Three new criticals, each measured

**C-1 · The Requests page freezes the browser tab in local (no-server) mode.**
`loadIntake()` returns early without setting `_intake.loaded` when there is no server, and
`renderIntake()` ends by calling `loadIntake().then(() => renderIntake())`. The flag never
becomes true, so the page re-renders itself through an unbounded microtask chain that starves
the event loop. **Measured from outside the page: responsive before, then completely
unresponsive — the tab stops answering at all.** `js/views/intake.js:262`

```js
// js/views/intake.js — the loop
if(!_intake.loaded) loadIntake().then(()=>{ if(state.view==='intake') renderIntake(); });

// js/views/intake.js:44 — why the flag never lands
async function loadIntake(){
  if(!(typeof API_MODE==='function'&&API_MODE())) return;   // ← no server: returns, flag untouched
  try{ …; _intake.loaded=true; } catch(e){ _intake.loaded=true; }
}
```
**Fix — set the flag on the one path that does not:**
```js
async function loadIntake(){
  if(!(typeof API_MODE==='function'&&API_MODE())){ _intake.loaded=true; return; }
  …
}
```

**C-2 · "Evidence pack" downloads once per tab you have visited.**
`wireActionBar` binds `#ws-evidence` and `#ws-next-action` with no guard, and it runs again on
every tab press — while those two buttons live in the room *head*, which a tab press does not
redraw. So the handlers stack on surviving elements. The function's own comment proves the author
knew it re-runs: `ws-to-nego` is deliberately *not* wired here for exactly this reason.
**Measured: the element survived six tab presses, and one click produced 8 downloads.**
`js/views/contract.js:2593`

```js
// BEFORE — stacks one handler per tab press
document.getElementById('ws-evidence')?.addEventListener('click',()=>downloadEvidence(c));
document.getElementById('ws-next-action')?.addEventListener('click',e=>{ … });

// AFTER — bind once per element, resolve the contract at press time
const ev=document.getElementById('ws-evidence');
if(ev && !ev.dataset.wsEvBound){ ev.dataset.wsEvBound='1';
  ev.addEventListener('click',()=>downloadEvidence(getContract(state.activeId)||c)); }
const na=document.getElementById('ws-next-action');
if(na && !na.dataset.wsNaBound){ na.dataset.wsNaBound='1';
  na.addEventListener('click',e=>{ /* …existing body, reading the contract fresh… */ }); }
```

**C-3 · The phone says "Executed" on a contract that is only partially signed.**
`contractStage()` correctly returns `'Partially signed'` / `'Expired'` / `'Ready to sign'`, but
`STATUS_META` holds only four keys — `Draft`, `Under Review`, `Signed`, `Declined`. `mPill`'s
defensive `|| STATUS_META[c.status]` fallback therefore discards the correct stage and reads the
raw status instead. The desktop escapes this because it uses `PARTIAL_META` / `EXPIRED_META`
explicitly. **Measured side by side on one record: stage `Partially signed` → desktop
"Partially signed" → phone "Executed".** In a contract product this is a trust failure: the phone
says a deal is done while it is still waiting on the counterparty's signature. The same fallback
hits `Expired` and `Ready to sign`. `js/mobile.js:640`

```js
// AFTER — the overlays carry their own meta, exactly as the desktop chip does
function mPill(c){
  const st = (typeof contractStage==='function' && contractStage(c)) || (c && c.status) || 'Draft';
  const OVERLAY = { 'Partially signed': (typeof PARTIAL_META!=='undefined') && PARTIAL_META,
                    'Expired':          (typeof EXPIRED_META!=='undefined') && EXPIRED_META,
                    'Ready to sign':    (typeof READY_META_SHORT!=='undefined') && READY_META_SHORT };
  const meta = OVERLAY[st] || (typeof STATUS_META==='object' && STATUS_META[st]) || null;
  …                                   // never fall back to STATUS_META[c.status]
}
```

---

## 1. Executive Functional Verdict

### **PASS WITH FIXES REQUIRED — five criticals, none of them a design decision.**

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


---

## Appendix — the full confirmed set

**85 findings survived adversarial verification** across twelve dimensions (10 critical · 47 major
· 28 minor). Each was put to two independent skeptics instructed to refute it; 12 further
candidates were refuted and are excluded. The findings in sections 1–3 above are the ones I
reproduced or measured personally; the remainder below are listed so nothing is lost, and should
be re-confirmed before anyone acts on them.

### Silent feedback  ·  11

- **CRITICAL** — Three model refusals draw a red box FOREVER from the background poller — the exact negoSignalReady fault CLAUDE.md claims is unique  
  `js/negotiation.js:1883`
- **CRITICAL** — Phone's green primary "Add signers" is a completely dead press — no branch, no toast, nothing  
  `js/mobile-contract.js:641`
- **MAJOR** — The one notice the code says must not be silent, is silent — an arriving counter sets aside your unsent draft with no word  
  `js/negotiation.js:1372`
- **MAJOR** — "Verify integrity" on a migrated contract does nothing at all — the one branch a real customer hits is the only silent one  
  `js/core.js:2263`
- **MAJOR** — Register row "Run scan" gives no feedback at all on a clean contract, and no progress feedback ever  
  `js/ai.js:260`
- **MAJOR** — Pressing a signature field in the document does nothing, on both the owner's and the counterparty's seat  
  `js/views/portal.js:4199`
- **MAJOR** — "Restore this version" is a dead press when the contract already reads like that version  
  `js/versioning.js:234`
- **MAJOR** — The locked and desk-only rows on the phone's ⋯ sheet explain themselves with a message that never prints  
  `js/mobile-contract.js:585`
- **MINOR** — "Stop after current" on a running import, and the metadata backfill's own outcome sentence, both print nothing  
  `js/views/migration.js:967`
- **MINOR** — Eleven of the twelve copy-to-clipboard buttons confirm silently; four have no other feedback whatsoever  
  `js/views/advice.js:141`
- **MINOR** — Wording refused because the contract is signed is recorded and reported as "does not match any clause"  
  `js/core.js:5224`

### Buttons & handlers  ·  5

- **CRITICAL** — "Fill from document" fires one paid Copilot extraction per Key-terms repaint — measured 3 calls for one press  
  `js/views/contract.js:6096`
- **MAJOR** — A successful round resend says nothing while a failed one shouts — three send buttons confirm with a bare toast, which prints nothing  
  `js/core.js:1932`
- **MINOR** — Publish Round and "Send all N" stay lit and do nothing while a round is in flight; the card's Send in the same state says "nothing to send", which is untrue  
  `js/views/negotiation.js:7261`
- **MINOR** — renderRegister adds an unguarded document-level click listener on every repaint, and the register repaints on every filter press  
  `js/views/register.js:1030`
- **MINOR** — Five handlers are bound to selectors no markup emits any more — half-finished retirements  
  `js/views/negotiation.js:7015`

### Listener lifecycle  ·  6

- **CRITICAL** — wireActionBar re-binds the room head's lead button on every tab press — one press of "Evidence pack" downloads the file twice or more  
  `js/views/contract.js:2593`
- **MAJOR** — wireKeyTerms stacks a handler on "Fill from document" per key-term edit — one press fires N billed Copilot calls and shows a red "Nothing new found" over a fill that worked  
  `js/views/contract.js:6096`
- **MINOR** — renderRegister arms a document click listener per repaint; a stale copy closes the search dropdown when you click back into the search box  
  `js/views/register.js:1030`
- **MINOR** — wireNegotiationTab arms two unguarded document listeners per paint — the negotiation page accumulates them for the life of the sitting  
  `js/views/negotiation.js:4369`
- **MINOR** — wireCalendar arms two unguarded document listeners per calendar render  
  `js/views/calendar.js:739`
- **MINOR** — renderIntel adds a permanent window pointermove listener each time the Insights map is drawn  
  `js/views/intelligence.js:868`

### Journeys & state  ·  8

- **CRITICAL** — The Requests page freezes the tab in local (no-server) mode — an unbounded microtask loop  
  `js/views/intake.js:262`
- **MAJOR** — A background repaint destroys an open clause editor and everything typed into it  
  `js/views/negotiation.js:7465`
- **MAJOR** — Two of the four default Home KPI cards are dead in server mode — they read c.audit, which the light list strips  
  `js/views/home.js:397`
- **MAJOR** — "Run Copilot scan" from a register row gives no feedback at all, start to finish  
  `js/ai.js:260`
- **MAJOR** — "Review vs Playbook" says nothing when the review finds nothing to propose  
  `js/views/negotiation.js:9562`
- **MAJOR** — Importing the counterparty's Word file closes the dialog and confirms nothing — including when nothing was filed  
  `js/core.js:5002`
- **MINOR** — A failing /api/templates puts the Templates page into a permanent re-render-and-re-fetch loop  
  `js/views/library.js:1486`
- **MINOR** — The register adds a new document-level click listener on every repaint, and the stale ones close the search dropdown  
  `js/views/register.js:1030`

### Server routes  ·  8

- **CRITICAL** — Dashboard "Avg turnaround time" KPI — a DEFAULT card — is permanently "—" in server mode  
  `js/views/home.js:416`
- **MAJOR** — "+N this week" on the Active-contracts KPI always reads "+0" in server mode  
  `js/views/home.js:397`
- **MAJOR** — Copilot's cycle-time chart tells the user their portfolio has no data, when the data was stripped by the list projection  
  `js/aichart.js:290`
- **MAJOR** — Signing cap: the browser exempts non-monetary contracts and the server does not — a live Sign button that 403s and loses the signature  
  `server/server.js:3001`
- **MAJOR** — /api/stats calls a contract expired from the raw expiry column, ignoring the family-aware term the rest of the product uses — the dashboard's Active-value headline under-reports  
  `server/server.js:2318`
- **MAJOR** — A Viewer's internal comment is drawn into the feed and then silently discarded — no save, no refusal, no message  
  `js/views/contract.js:5487`
- **MINOR** — The phone's Approvals card can never name who raised the contract in server mode  
  `js/mobile-screens.js:448`
- **MINOR** — Pressing Resend on a share link produces no confirmation, and the sent-vs-outbox distinction the route reports never reaches the user  
  `js/core.js:4895`

### The phone shell  ·  12

- **CRITICAL** — The phone never hydrates a light contract, so uploads, history and the brief are silently empty in production  
  `js/mobile.js:1070`
- **CRITICAL** — mPill loses all three status overlays — the phone says "Executed" on a partially-signed and on an expired contract  
  `js/mobile.js:640`
- **CRITICAL** — Typing in the phone's contract search doubles its own handler on every keystroke  
  `js/mobile-screens.js:600`
- **MAJOR** — The phone's share sheet mints a link and says nothing — including when nothing was emailed  
  `js/mobile-contract.js:700`
- **MAJOR** — "Name who signs" is a live primary button on the phone with no handler at all  
  `js/mobile-contract.js:641`
- **MAJOR** — The "Sign" button is dead on the phone in exactly the state that says signing is the only thing left  
  `js/mobile-contract.js:672`
- **MAJOR** — The greyed rows in the phone's overflow sheet refuse in silence — the explanation is built and discarded  
  `js/mobile-contract.js:586`
- **MAJOR** — The phone's tap-a-sentence Copilot gesture is dead, and every clause is still underlined to advertise it  
  `js/mobile-copilot.js:136`
- **MAJOR** — The counterparty's decision bar has no sticky treatment on a phone — all three selectors match nothing  
  `js/mobile-portal.js:83`
- **MAJOR** — The phone's Approvals card never names who asked, because it reads a field the light list strips  
  `js/mobile-screens.js:448`
- **MINOR** — mMoney is a second copy of the money rule and prints foreign amounts in a different format and locale from the rest of the app  
  `js/mobile.js:655`
- **MINOR** — Requests has no door on the phone, breaking M_DESK's own rule for the one page every role may press  
  `js/mobile.js:85`

### Copilot end-to-end  ·  6

- **CRITICAL** — A Copilot chat answer cut short at max_tokens is served as a complete answer — the truncation notice is dropped by both chat routes, and the streaming path never computes it at all  
  `server/server.js:5438`
- **MAJOR** — A truncated contract brief or renewal recommendation is written to the server-side cache and every later read serves it as complete, with no notice  
  `server/server.js:4310`
- **MAJOR** — The Intelligence dock feeds its own error bubbles back into the conversation history, the exact poisoning the main panel guards against  
  `js/views/intelligence.js:341`
- **MAJOR** — Copilot silently cuts every message to 4,000 characters, which defeats the documented guarantee that a highlighted passage reaches the model whole  
  `server/server.js:5386`
- **MAJOR** — There is no way to cancel a Copilot request, and closing the panel mid-request leaves ai.busy set — reopening gives a dead Send button with no typing indicator and no message  
  `js/ai.js:2840`
- **MINOR** — Every Save on the Copilot engine settings panel confirms with a bare toast(), which prints nothing — the presses look dead  
  `js/views/settings.js:2680`

### Email & dispatch  ·  5

- **MAJOR** — The monthly report says "sent to N recipients" without ever looking at what the provider did  
  `server/server.js:9288`
- **MAJOR** — The counterparty's signing-turn email is always English — signerTurnEmail's senderLang is never passed by any caller  
  `server/server.js:7054`
- **MAJOR** — Three share-email paths stamp sent_at even when the provider refused, and never write send_error  
  `server/server.js:7515`
- **MAJOR** — The counterparty's "code could not be sent" banner always blames configuration and is the one English sentence on a translated page  
  `js/views/portal.js:4312`
- **MAJOR** — The share panel's Resend press is silent, and calls a provider refusal "queued to the outbox"  
  `js/core.js:4895`

### Forms, modals & validation  ·  6

- **MAJOR** — Escape and backdrop click bypass a modal's own unsaved-work guard  
  `js/core.js:1991`
- **MAJOR** — confirmDialog's Escape leaks to the modal underneath, so "Keep editing" still destroys the editor  
  `js/core.js:2073`
- **MAJOR** — Editing an approval rule silently rewrites an orphaned named approver to "Any admin"  
  `js/views/settings.js:3186`
- **MAJOR** — Signing-route status badges have no fill and no colour — four undefined Tailwind utilities  
  `js/approvals.js:832`
- **MINOR** — "Go back to v3" is a dead button when the wording already matches that version  
  `js/versioning.js:234`
- **MINOR** — openModal dialogs are not announced as dialogs and never take focus  
  `js/core.js:1985`

### Bilingual coverage  ·  12

- **MAJOR** — confirmDialog and promptDialog default their buttons to English — 50 dialogs across both shells show "Cancel", including on the counterparty's page  
  `js/core.js:2047`
- **MAJOR** — The share dialog's first step is entirely hardcoded English under a translated heading  
  `js/core.js:2578`
- **MAJOR** — SHARE_PURPOSE_COPY: two members are plain English strings while their siblings are dictionary getters  
  `js/core.js:2536`
- **MAJOR** — The counterparty's deal-verb row draws two English buttons beside two Swedish ones — and po_ready_to_sign already exists, unused  
  `js/views/portal.js:1805`
- **MAJOR** — The counterparty's send outcome — success banner, spent button labels and the two send confirmations — is hardcoded English  
  `js/views/portal.js:3977`
- **MAJOR** — 306 server error strings are English and are printed verbatim, half of them glued to a translated prefix  
  `js/core.js:981`
- **MAJOR** — The forced password-change gate — the first screen an invited colleague sees — has an English body and English refusals inside a translated frame  
  `js/core.js:1563`
- **MAJOR** — The signing-code panel mixes Swedish and English inside one sentence, in a warning about who may sign  
  `js/views/portal.js:4311`
- **MINOR** — The Contracts page draws "+ New contract" in English while its own header button draws the same phrase in Swedish  
  `js/views/register.js:636`
- **MINOR** — The template-library paste report builds one sentence out of alternating Swedish and English fragments  
  `js/views/library.js:353`
- **MINOR** — Chart legend and axis labels are hardcoded English inside charts whose own buttons are translated  
  `js/aichart.js:168`
- **MINOR** — Four Copilot panel tooltips and the panel's live sub-line carry no data-i18n attribute in index.html  
  `index.html:3954`

### CSS that does not draw  ·  3

- **MAJOR** — `.rl-wall` is styled only under `.redline-page`, and js/views/portal.js draws it twice OUTSIDE that ancestor — both notices render as completely unstyled text  
  `js/views/portal.js:3323`
- **MINOR** — `.nego-readysig`'s green accent comes from `--n-accept`, which is undefined in the counterparty's alerts panel — the ✓ renders white-on-white and the left accent bar disappears  
  `js/views/negotiation-css.js:150`
- **MINOR** — The 22-Aug text-size stepper redesign is scoped `.redline-page .rl-type-step`, so three of `rlTypeStepHtml`'s five homes still draw the pre-redesign grey pill — including the counterparty's header, which the rule's own comment claims it covers  
  `js/views/negotiation-css.js:3578`

### Always-false guards  ·  3

- **MINOR** — Health report's chart builder reads kpiMoneyOk, which no module publishes — the guard is always false and falls back to "show money"  
  `js/views/healthreport.js:133`
- **MINOR** — contractReadiness's "no named signatory" warning is behind window.SIGN_ROUTE_ON, which nothing in the product ever sets — the check can never run, and the fields it reads are never written  
  `js/core.js:2463`
- **MINOR** — f232's window-read regex is lowercase-only, so no CamelCase or UPPER_CASE always-false guard can ever be caught by the test that exists to catch them  
  `test/f232-a-guard-that-is-always-false.test.js:106`

