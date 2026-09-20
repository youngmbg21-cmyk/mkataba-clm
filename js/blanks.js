/* ============================================================
   THE OPEN BLANKS OF A DRAFTED CONTRACT (Young ruled 17 Sep 2026)
   ============================================================
   *"When it lands in overview the open fields have to be pre-filled by
   copilot ... All contracts should have the possibility to fill in from the
   right hand side panel like in image 4."*

   TWO ASKS, ONE READING UNDER BOTH. A contract drafted from a built-in
   template carries its blanks IN THE PAPER — `<input data-field="payDays">`
   inside clause 2 — and nothing anywhere declared the SET of them: the
   drafting writes `N('forecastWeeks',8)` by hand, per template, and the
   registered field list (builtinTemplateFields) knows about seven of them.
   So neither a panel beside the paper nor a reading that fills them in could
   be written without first asking one question properly: what blanks does
   THIS contract actually have?

   THE PAPER IS THE ANSWER, and it is read off the paper rather than off any
   list. This is the Plain English edition's own rule — THE WALK IS THE
   SHEET'S OWN — and it is the only shape that cannot drift: a template whose
   drafting gains a blank tomorrow gains it here in the same breath, and a
   list somebody forgets to update cannot make the panel disagree with the
   page beside it. The declared field list is asked for LABELS and nothing
   else, because a label is the one thing markup does not carry.

   NO ROUTE, NO STORE, NO FIELD. Every value here already lives on `c.fields`,
   `c.counterparty` or `c.value` — the places the paper's own handler writes.
   This file adds one WRITER so that the paper and the panel are two doors
   onto one act rather than two acts (THE ONE DOOR, and the owner's ask for a
   second door is why the writer had to exist before the door did).

   ITS OWN FILE because three surfaces read it — the contract room's document
   column, the arrival reading, and the tests — and written inside any one of
   them the others would reach it through `window` on a stage that does not
   carry that view, get undefined, and quietly do nothing. That is the
   rlPaperFootHtml family and this rulebook names it four times.
   ============================================================ */

/* How many past contracts must agree before "what you usually put here" is
   allowed to speak. PRECEDENT_MIN is 3 and is about NEGOTIATED positions —
   what the other side accepted — which is a heavier claim than "the last two
   packaging contracts both said PET preforms". Two is the floor here and it
   is deliberately its own number, read nowhere else. */
const BLANK_USUAL_MIN = 2;
/* A blank is a blank whatever the paper is; a panel that listed sixty of them
   would be a form nobody finishes. Counted and said where it bites. */
const BLANK_MAX = 40;

/* ---- WHICH CONTRACTS HAVE BLANKS AT ALL ----
   The three shapes a drafted contract comes in, and only the first has
   blanks a person can still type into:

     · a BUILT-IN template — the drafting is rebuilt on every paint from
       `c.fields`, so its blanks are live inputs for as long as the contract
       is a draft. This is the one this file is about.
     · a LIBRARY/standard template — carries `templateForm`, a declared field
       list, and has had its own right-hand panel since the day it shipped
       (renderTemplateFormSection). Untouched here, and refused by name so the
       two panels can never both draw.
     · a SAVED CUSTOM template — its wording was written out ONCE at creation
       with the answers baked in, so there is no blank left to read. Said out
       loud rather than half-handled: filling one afterwards would mean
       re-drafting the contract from a template that may have been revised
       since, which is the one thing templateProvenanceHtml promises does not
       happen.

   AND STORED WORDING ENDS IT. The moment a contract carries `redlineText` the
   wording is the negotiation's, and a blank typed into a page is not how it
   changes — see docFillable, which draws the same line for the same reason. */
function contractHasBlanks(c){
  if(!c) return false;
  if(c.templateForm) return false;                        // the library form's own
  /* ---- AND A FOURTH SHAPE SINCE 20 SEP 2026: A DOCUMENT SOMEBODY SENT US ----
     (Young: "build it", item 9.) An upload's blanks are WORDS rather than
     boxes — `[Insert Company Name]`, `________` — and this line used to refuse
     every one of them, so the panel never drew on the one kind of contract
     whose blanks nobody in this workspace wrote. js/uploadblanks.js is the
     reading; `uploadBlanksLive` is its gate and carries all four walls
     (an upload, not sealed, an editor, and nobody has edited the wording).
     Asked BEFORE `redlineText`, deliberately: a structured upload stores its
     wording, so the line below would still refuse it.

     IT IS ASKED THROUGH `window`, so a stage without that file answers
     exactly what every test written before it asserts. */
  try{
    if(typeof isUpload==='function' && isUpload(c))
      return !!(typeof uploadBlanksLive==='function' && uploadBlanksLive(c));
  }catch(_){ return false; }
  if(c.redlineText) return false;                         // stored wording — see above
  return !!(typeof TEMPLATES!=='undefined' && TEMPLATES[c.template]);
}

/* ════════ WHY A CONTRACT HAS NO BLANKS TO FILL ════════
   (Young reported it 20 Sep 2026: "make sure the Field actually Field the
   contracts correctly.")

   MEASURED: the arrival tile read "Open fields filled in &#10003;" with nothing
   under it, on a contract with placeholders still open. Nothing was filled —
   zero boxes. `contractHasBlanks` is false for FOUR kinds of contract, so
   `contractBlanksOpen` answered `[]`, `fillBlanksFromRecord` answered
   `{filled:[],left:[]}`, and the step recorded `ok:true` with an empty list.
   The tick meant "I found no boxes to fill" and the words said "I filled them
   in", and those are not the same sentence.

   THE REMEDY IS THE REASON, NOT A FOURTH BOOLEAN. A tile that knows only
   whether there were blanks can still only say two things; what a reader needs
   is WHY there were none, because "this is in negotiation" and "every box is
   already answered" are opposite pieces of news. One reading, four answers,
   and null where there really is something to fill.

   IT DECIDES NOTHING AND WRITES NOTHING. `contractHasBlanks` is still the one
   gate on whether the blanks PANEL draws — widening this could never make two
   panels draw on one contract, which is the trap paintContractForm exists to
   avoid. */
const BLANK_NONE_REASONS = ['form', 'upload', 'nego', 'none'];
function contractBlanksNone(c){
  if(!c) return 'none';
  /* A COMPANY-STANDARD CONTRACT IS NOT "NOTHING TO FILL" — it declares its own
     field list and draws its own right-hand panel, and `tplFormOpenCount` is
     how that panel already counts what is still open. Asking it here is the
     whole of item 7: the tile stops reporting silence on the one kind of
     contract that could always answer. Through `window` because js/blanks.js
     loads on stages js/views/contract.js does not. */
  if(c.templateForm){
    let open = null;
    try{ open = (typeof tplFormOpenCount === 'function') ? tplFormOpenCount(c) : null; }catch(_){ open = null; }
    /* BOTH ANSWERS ARE REASONS, and neither is a tick. A company-standard
       contract with fields STILL OPEN is not "filled in" — it is filled from
       its own right-hand panel, which is what `tri_fill_form` says. Returning
       null here (the first build did) left the tile falling through to the
       `ok` branch with an empty list, which draws the very tick this whole
       reading exists to retire. Found by driving the page. */
    if(open == null) return 'form';
    return open > 0 ? 'form' : 'none';
  }
  /* AN UPLOAD IS NO LONGER ALWAYS A REASON. Since item 9 its placeholders are
     readable, so the honest answer is the same one every other contract gets:
     null where something is still open, 'none' where it looked and found
     nothing. `upload` survives for the uploads this cannot reach — a sealed
     record, a Viewer, one the workspace has already redlined — because there
     the wording really is not ours to fill in. */
  try{
    if(typeof isUpload === 'function' && isUpload(c)){
      if(!contractHasBlanks(c)) return 'upload';
      return contractBlanksOpen(c).length ? null : 'none';
    }
  }catch(_){ return 'upload'; }
  if(c.redlineText) return 'nego';
  if(!contractHasBlanks(c)) return 'none';
  /* It looked, and every blank is answered. The honest "none". */
  return contractBlanksOpen(c).length ? null : 'none';
}

/* A blank's LABEL. The declared field list answers where it declares the key
   — that label is translated, carries the workspace's own currency and is
   what the wizard asked in the first place, so the panel and the wizard use
   one word for one box. Where it does not, the key is turned into words:
   `forecastWeeks` reads "Forecast weeks", which is honest, and inventing a
   prettier sentence for a key nobody declared would be this file guessing. */
function blankLabel(key, declared){
  const d = (declared||[]).find(f => f && f.key === key);
  if(d && d.label) return String(d.label);
  /* SENTENCE CASE, because every declared label beside it is written that way
     ("Payment terms (days)", "Start date") and a panel mixing "Forecast Weeks"
     with "Payment terms (days)" reads as two lists. */
  const s = String(key||'').replace(/([a-z0-9])([A-Z])/g, (m,a,b) => a + ' ' + b.toLowerCase())
    .replace(/[_-]+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : String(key||'');
}

/* ---- THE WALK ----
   `docBody(c)` is asked for the markup rather than the live page, so this
   answers identically at creation — before anything is mounted — and on a
   tab the reader is looking at. A reading that only worked once the document
   was on screen could not be the one the arrival reading asks.

   READING MUST NOT WRITE: docBody composes from the record and stamps
   nothing. The detached div is thrown away.

   Each blank carries its CLAUSE, taken from the enclosing `[data-anchor]`'s
   own heading, so the panel can group its boxes the way the page groups them
   and a reader can see which sentence they are answering. A blank in the
   recital has no anchor and is grouped first under no heading, which is what
   the page does with it too. */
function contractBlanks(c){
  if(!contractHasBlanks(c)) return [];
  /* AN UPLOAD'S BLANKS ARE IN ITS OWN WORDING and are read there — off the
     stored text rather than off this tab, so the answer is the same at
     creation, in Node and on a page the reader is looking at. Same shape, so
     the panel, the count and the arrival tile below need no branch of their
     own; the `kind` is what tells them apart where it matters. */
  try{
    if(typeof isUpload === 'function' && isUpload(c) && typeof uploadBlanksRead === 'function')
      return uploadBlanksRead(c);
  }catch(_){ return []; }
  if(typeof document === 'undefined' || typeof docBody !== 'function') return [];
  let host;
  try{
    host = document.createElement('div');
    host.innerHTML = docBody(c);
  }catch(_){ return []; }
  let declared = [];
  try{ declared = (typeof builtinTemplateFields==='function') ? builtinTemplateFields(c.template) : []; }catch(_){ declared = []; }
  const out = [];
  const seen = new Set();
  host.querySelectorAll('input[data-field],input[data-sync]').forEach(inp => {
    if(out.length >= BLANK_MAX) return;
    const sync = inp.getAttribute('data-sync');
    const key = sync || inp.getAttribute('data-field');
    if(!key || seen.has(key)) return;             // one box per fact; the first wins
    seen.add(key);
    const wrap = inp.closest('[data-anchor]');
    const head = wrap ? wrap.querySelector('h4') : null;
    out.push({
      key,
      /* WHERE THE ANSWER IS FILED, and it is the difference that matters most
         in this file: a `field` blank is the contract's own drafting and is
         this file's to write; a `sync` blank IS the record — the register,
         the calendar, every report and every money reading run off it — and
         is never written by a reading. See fillBlanksFromRecord. */
      kind: sync ? 'sync' : 'field',
      type: inp.getAttribute('type') || 'text',
      money: inp.hasAttribute('data-money'),
      label: blankLabel(key, declared),
      ph: inp.getAttribute('placeholder') || '',
      value: inp.getAttribute('value') || '',
      section: head ? (head.textContent||'').trim() : '',
      declared: !!(declared||[]).find(f => f && f.key === key),
    });
  });
  return out;
}

/* Which of them are still OPEN — the panel's count, the reading's worklist,
   and the one arithmetic behind both so they cannot report different numbers.
   A blank carrying the drafting's own inline default (`N('payDays',30)` draws
   30) is NOT open: the page states a figure and the reader has it. */
const contractBlanksOpen = c => contractBlanks(c).filter(b => !String(b.value||'').trim());

/* ---- THE ONE WRITER ----
   The paper's own `[data-field]` handler calls this, and so does the panel,
   so the two are two DOORS onto one ACT. Written the other way — a panel with
   its own save — the two would drift about what "changing a blank" means, and
   two screens disagreeing about what the product does is this codebase's most
   expensive fault class.

   IT REFUSES A `sync` KEY. `counterparty` and `value` are the RECORD, and
   they already have a writer with a repaint, a status check and an audit line
   of their own (wireDocumentSync). A second one here would be the fault this
   function exists to prevent, one field along. */
function contractBlankSet(c, key, value, opts){
  const o = opts || {};
  if(!c || !key) return false;
  if(key === 'counterparty' || key === 'value') return false;
  c.fields = c.fields || {};
  const was = c.fields[key];
  const now = value == null ? '' : String(value);
  if(String(was == null ? '' : was) === now) return false;   // nothing changed is not an edit
  c.fields[key] = now;
  if(typeof todayStr === 'function') c.lastAction = todayStr();
  /* Copilot's own fills are audited by the reading that made them, in one
     line naming all of them — forty lines saying "Updated field" would bury
     the trail the day the feature shipped. A person's keystroke is audited
     here, exactly as it was before this function existed. */
  if(!o.quiet && typeof logAudit === 'function') logAudit(c, 'Edited', `Updated field "${key}"`);
  if(!o.hold && typeof persist === 'function') persist(c);
  return true;
}

/* ---- WHAT THIS WORKSPACE USUALLY PUTS HERE ----
   Read off the book, never off a model: every past contract drafted from the
   SAME built-in template, the value it carries in this very blank, and the
   answer that appears most often — where at least BLANK_USUAL_MIN of them
   agree. Below the floor there is no usual value and this says so by
   answering null, because "the one other packaging contract said 6 weeks" is
   not a house position.

   Seeded demo contracts are excluded by construction: builtinUsageRows is the
   ONE reading of "which contracts came from this template" and drops them
   already. A second filter written here is how two screens come to disagree
   about which contracts came from one template — its own note says so. */
function contractBlankUsual(c, key){
  if(!c || !key || typeof builtinUsageRows !== 'function') return null;
  let rows = [];
  try{ rows = builtinUsageRows(c.template) || []; }catch(_){ return null; }
  const tally = new Map();
  for(const r of rows){
    if(!r || r.id === c.id) continue;
    const v = String((r.fields||{})[key] == null ? '' : (r.fields||{})[key]).trim();
    if(!v) continue;
    tally.set(v, (tally.get(v)||0) + 1);
  }
  let best = null;
  for(const [v, n] of tally) if(!best || n > best.n) best = { v, n };
  return (best && best.n >= BLANK_USUAL_MIN) ? best : null;
}

/* ---- THE RECORD ANSWERS FIRST ----
   Every blank this workspace can answer WITHOUT asking anybody: our own legal
   identity, the counterparty the record already names, the day, and what we
   usually put in this box. Deterministic, free, and incapable of inventing a
   figure — which is why it runs before the model and why the model is only
   ever shown what is left.

   THIS IS THIS CODEBASE'S OWN RULE, not a shortcut: precedent has no route,
   payment terms has no route, the risk scan costs nothing. A reading that can
   be deterministic must be, and paying a model to choose between "the last
   four said 45 days" and silence is paying for a coin flip.

   WHAT IT WILL NOT TOUCH, and each refusal is a decision:
     · `counterparty` and `value` — the record itself. Every money reading,
       the register, the calendar and every report run off them; a figure put
       there by a reading is a number this product invented and then reported
       as fact. contractBlankSet refuses them and this never offers them.
     · `termYears` — the paper's own term blank, whose `change` handler FILLS
       `c.expiry` from it. A date moved by a reading is the same fault wearing
       a different name.
     · a blank the page already answers. `value` here is the ATTRIBUTE the
       paper drew, so a drafting default counts as answered and is left alone.

   Returns what it filled and what it could not, by key: the caller says so on
   the page, and "it filled these three and left these two" is the only shape
   in which a reader can check it. */
const BLANK_NEVER_FILLED = ['counterparty', 'value', 'termYears'];

function fillBlanksFromRecord(c, opts){
  const o = opts || {};
  /* `kind === 'field'` IS ALSO WHAT KEEPS AN UPLOAD'S PLACEHOLDERS OUT OF
     THIS, and that is a decision rather than a side effect: we did not draft
     the document, so we do not know whose side `[Company Name]` names in it,
     and a reading that answered it with OUR entity would be this product
     inventing a fact and then reporting it. A person types those. */
  const open = contractBlanksOpen(c).filter(b => b.kind === 'field' && !BLANK_NEVER_FILLED.includes(b.key));
  if(!open.length) return { filled: [], left: [] };
  let br = null;
  try{ br = (typeof resolveDocBranding==='function') ? resolveDocBranding(c) : null; }catch(_){ br = null; }
  const ours = (() => { try{ return (typeof contractParty==='function') ? contractParty(c) : ''; }catch(_){ return ''; } })();
  const today = (typeof todayStr==='function') ? todayStr() : new Date().toISOString().slice(0,10);
  const meta = c.metadata || {};

  /* ONE ANSWER PER KEY, and the order inside it is the order of certainty:
     a fact this workspace has recorded about itself beats a fact worked out
     from its history. A key with no answer returns '' and stays open. */
  const fromRecord = b => {
    const k = b.key;
    if(k === 'party')   return ours || (br && br.companyName) || '';
    if(k === 'effDate') return String(meta.effectiveDate || '').slice(0,10) || today;
    if(k === 'expiry')  return String(c.expiry || meta.expiryDate || '').slice(0,10);
    /* An address blank is answered by the address this workspace filed under
       Company & market, and by nothing else — there is no second place a
       registered address lives, so there is nothing to disagree with. */
    if(/address|principal place|premises address|registered/i.test(b.label) && br && br.address) return br.address;
    if(/^(company|our)\s*name$/i.test(b.label) && (ours || (br && br.companyName))) return ours || br.companyName;
    return '';
  };

  const filled = [], left = [];
  for(const b of open){
    let v = fromRecord(b);
    let why = v ? 'record' : '';
    if(!v){
      const u = contractBlankUsual(c, b.key);
      if(u){ v = u.v; why = 'usual'; }
    }
    if(!v){ left.push(b); continue; }
    if(contractBlankSet(c, b.key, v, { quiet: true, hold: true })) filled.push({ key: b.key, label: b.label, why });
  }
  if(filled.length && !o.hold && typeof persist === 'function') persist(c);
  return { filled, left };
}

/* Everything the model may be shown and the wall it is measured against: the
   blanks still open after the record has had its turn, each with the label the
   page prints and what this workspace usually puts there. The value is NOT
   sent — it is empty, that being what "still open" means. */
function blanksAskPayload(c, left){
  return (left||[]).slice(0, BLANK_MAX).map(b => {
    const u = contractBlankUsual(c, b.key);
    return { key: b.key, asks: b.label, type: b.money ? 'num' : (b.type || 'text'),
      clause: b.section || '', ...(b.ph ? { example: b.ph } : {}), ...(u ? { usually: u.v, usually_seen: u.n } : {}) };
  });
}

if(typeof window !== 'undefined') Object.assign(window, {
  BLANK_USUAL_MIN, BLANK_MAX, BLANK_NEVER_FILLED,
  contractHasBlanks, contractBlanks, contractBlanksOpen, blankLabel,
  BLANK_NONE_REASONS, contractBlanksNone,
  contractBlankSet, contractBlankUsual, fillBlanksFromRecord, blanksAskPayload,
});
