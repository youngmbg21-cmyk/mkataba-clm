/* ============================================================
   AUTO-TRIAGE ON UPLOAD (owner-approved design, 9 Sep 2026)
   ============================================================
   A received contract lands and, until now, waited for four separate presses
   on three different screens: write the brief, check it against Our standards,
   scan it for risk, find the obligations. Every one of those is a button that
   already exists. What this adds is that they happen TOGETHER, at the moment
   the document is filed, and say what they found in one place.

   NOTHING NEW BECOMES POSSIBLE. This file runs no reading of its own — it
   presses the product's own four, in order, and records what came back. A
   second copy of any of them is how two screens come to disagree about what a
   contract says, so f273 greps this file for the api calls it must never make.

   IT SPENDS, AND THAT IS WHY IT IS ASKED FOR. Three of the four readings cost
   a Copilot call (the risk scan is deterministic rule-matching and costs
   nothing). Today NOTHING in HaTi spends unless a person presses a button, so
   this is asked for on the upload screen with a tick-box the reader can clear —
   the one moment somebody is already standing there confirming what was read
   off the document.

   OBLIGATIONS ARE PROPOSED, NEVER FILED. The scan's list is HELD on the triage
   record and a person still ticks it in the ordinary review dialog. A
   commitment must not reach the record unread, and that guard is not an option
   this feature offers.

   NO VIEW, NO ROUTE, NO NEW STORE BEYOND `c.triage` — the shelf js/precedent.js,
   js/payterms.js and js/standards.js already sit on. Its own file because TWO
   surfaces read it (the upload path and Home) and, written inside either, the
   other would reach it through `window` on a stage that does not carry that
   view, get undefined, and quietly do nothing — the rlPaperFootHtml family. */

/* The four readings, in the order they run. RISK FIRST AND DELIBERATELY: it is
   the only one that costs nothing and answers instantly, so the contract's own
   Checks card has something on it before the paid readings have come back. */
const TRIAGE_STEPS = ['risk', 'brief', 'playbook', 'oblig'];

/* Only a received document is triaged. A contract HaTi drafted was written
   here, against this playbook, from this workspace's own wording — there is
   nothing to discover in it, and reading it back would be paying to be told
   what we already said. */
const triageApplies = c => !!(c && c.source === 'upload');

/* WHAT THE READINGS ARE READ FROM, and it is the record rather than a fresh
   run: each of the four already stores its answer where its own screen reads
   it, so this is a summary of facts that exist and never a second reading.
   Returns null where triage never ran, which is every contract filed before
   this and every one whose reader cleared the tick-box. */
const triageOf = c => (c && c.triage && typeof c.triage === 'object') ? c.triage : null;

/* Has the reader dealt with this card? Stamped by an ACT — pressing the card
   or one of its verbs — never by a render. A card that cleared itself the
   moment Home drew it would be a reading that writes, and one that cleared on
   the contract being opened would be the same fault one screen along. */
const triageSeen = c => { const t = triageOf(c); return !!(t && t.seenAt); };

/* THE CARD'S OWN POPULATION: what has been read and not yet acknowledged.
   Archived and declined contracts are off it by construction — a card about a
   contract nobody is going to act on is furniture. */
function triageCards(list){
  const cs = Array.isArray(list) ? list
    : ((typeof window !== 'undefined' && window.state && Array.isArray(state.contracts)) ? state.contracts : []);
  return cs.filter(c => c && !c.archived && c.status !== 'Declined'
    && triageOf(c) && !triageSeen(c));
}

/* ---- WHAT THE CARD SAYS ABOUT EACH READING ----
   COUNTING IS NOT DRAWING (the Insights panels' rule): this returns plain data
   and no markup, and js/views/home.js draws it. A step that did not run says
   so with its own reason; a step that ran says what it found. */
/* THE THREE STATES A TILE CAN BE IN, and the third is the one that was
   missing (owner-reported 9 Sep 2026, off a strip caught mid-run: "No brief ·
   Standards not checked · Obligations not read" on a contract whose brief
   arrived a minute later). A step that has not been ATTEMPTED yet is simply
   absent from `t.steps` — and read as `!ok` that is indistinguishable from one
   that was attempted and failed, so every tile accused the reading of failing
   while it was still working, with no reason under it because there was none.
   ONE TABLE, THREE HEADS PER READING, so a caller cannot forget the third. */
const TRIAGE_HEADS = {
  brief:    { ok: 'tri_t_brief',  no: 'tri_t_brief_no',  ing: 'tri_t_brief_ing' },
  playbook: { ok: 'tri_t_std',    no: 'tri_t_std_no',    ing: 'tri_t_std_ing' },
  oblig:    { ok: 'tri_t_oblig',  no: 'tri_t_oblig_no',  ing: 'tri_t_oblig_ing' },
  filed:    { ok: 'tri_t_filed',  no: 'tri_t_filed',     ing: 'tri_t_filed' },
};
/* IS IT STILL READING? `_triaging` is set for the life of the run and deleted
   in its `finally`, so this is true exactly while a reading could still land.
   It is in memory and dies with the sitting, which is right: a run cannot
   survive a reload, so a step still absent afterwards really has not run. */
const triageBusy = c => !!(c && c._triaging);

function triageTiles(c){
  const t = triageOf(c); if (!t) return [];
  const s = t.steps || {};
  const out = [];
  /* A CAP IS SAID ON THE TILE IT HAPPENED TO. It used to be a red box over the
     whole page reading "Try again, or narrow what you asked for" — written for
     somebody who ASKED, and nobody asked for this. Appended rather than
     replacing the detail, because what WAS read is still worth reading. */
  /* `okLive` IS THE ANSWER READ OFF THE RECORD RATHER THAN OFF THE NOTE, and
     only the brief passes one. A note is DURABLE and the reading it describes
     may not be — see the brief's own block below — so where a tile can ask
     the thing itself it asks the thing itself. Absent, the note decides,
     which is every other tile and is unchanged.
     THE BUSY STATE STILL WINS, and by construction rather than by care: the
     head takes `ing` first, the strip's tone and mark both branch on
     `working` before they look at `ok`, and the detail and the count are
     suppressed while it is true. So a re-run over a contract that already
     carries a brief reads as working, not as done. */
  const add = (key, detail, count, live) => {
    const st = s[key];
    const working = key !== 'filed' && !st && triageBusy(c);
    const ok = key === 'filed' ? true : (live ? !!live.ok : !!(st && st.ok));
    /* THE CAP RIDES THE READING IT HAPPENED TO, so a tile reading a live
       store has to say whether the cap belongs to what it is looking at —
       otherwise a brief somebody wrote later wears the old run's warning,
       which is this section's own fault one size smaller. */
    const cut = ok && (live ? live.cut : (st || {}).cut)
      ? ((typeof i18t === 'function') ? i18t('tri_cut') : '') : '';
    const d = working ? '' : [detail || '', cut].filter(Boolean).join(' — ');
    out.push({ key, ok, working,
      headKey: TRIAGE_HEADS[key][working ? 'ing' : (ok ? 'ok' : 'no')],
      detail: d, count: (working || count == null) ? null : count });
  };

  /* ---- THE TILE ASKS THE BRIEF, NOT A NOTE ABOUT IT (owner-reported
     10 Sep 2026) ----
     *"The Key terms strip and the Contract brief card contradict each other."*
     The strip said "Brief written" and the card four inches below said "Not
     written yet", on one contract, at the same moment.

     BOTH WERE RIGHT ABOUT DIFFERENT THINGS, which is what made it look like a
     broken card rather than a stale note. The CARD reads the brief itself, so
     it was right. The STRIP read a note WRITTEN ONCE at upload and never
     repaired — and the 10 Sep fix below, which records a cut-short brief as
     not-done, changed how a NEW run records that step and cannot reach a note
     already on file. Every contract read before that commit carries
     `{ ok:true, line, cut }` for ever. So that fix was right and incomplete.

     THE REMEDY IS A READING, NOT A REPAIR. The tile asks whether there IS a
     brief, live, and falls back to the note only where there is nothing to
     look at — so an old wrong note is simply not read, nothing has to be
     migrated, and a brief a person writes later turns the tile green by
     itself, which it could never do before.

     BOTH FIELDS, AND THAT PAIR IS THE TRAP. `_brief` is transport that rides
     the SINGLE contract's GET; `_hasBrief` is the boolean the LIST route
     attaches. Read `_brief` alone and this is right locally and wrong in
     server mode on a light row — this codebase's recorded defect class, twice
     paid for (the dashboard's raised-by-me, Reports' cycle time).
     js/views/home.js reads the same pair for the same reason. */
  const b = s.brief || {};
  const brief = (c && c._brief) || null;
  const hasBrief = !!(c && (c._brief || c._hasBrief));
  add('brief',
    /* THE LINE COMES FROM THE BRIEF TOO — `triageBriefLine` is the one reading,
       so the tile can never say something the panel behind it does not. On a
       light row there is a brief and nothing to draw a line from: say nothing
       rather than reach for a stored line that may describe an older one. */
    hasBrief ? (brief ? triageBriefLine(brief) : '')
      /* WITH NO BRIEF the reason is the record's own where it has one — a
         cut-short answer already says so, in the words that name what to do
         about it — and otherwise the plain fact that there is none to open. */
      : (b.why || ((typeof i18t === 'function') ? i18t('tri_brief_none') : '')),
    null,
    /* ---- THE CUT IS THE BRIEF'S OWN FACT WHERE IT CARRIES ONE ---- (10 Sep 2026)
       A cut-short brief is KEPT now, marked with its own `truncated` flag, so
       the exact answer is on the thing being read rather than inferred from a
       note beside it. That flag is asked first.

       THE NOTE'S CAP SURVIVES AS THE FALLBACK, for a brief written before the
       flag was persisted — and it is drawn only over the brief the note
       DESCRIBED, which is the same brief when it yields the same line: a
       comparison rather than a guess, and cheap. Rewrite the brief and the line
       moves, so the old run's warning does not follow it. */
    { ok: hasBrief,
      cut: !!(hasBrief && brief && (brief.truncated
        || (b.ok && b.cut && b.line && b.line === triageBriefLine(brief)))) });

  const p = s.playbook || {};
  add('playbook', p.ok ? (p.cats && p.cats.length ? p.cats.join(', ') : '') : (p.why || ''),
    p.ok ? (p.dev || 0) + (p.miss || 0) : null);

  const o = s.oblig || {};
  const found = Array.isArray(o.found) ? o.found : [];
  add('oblig',
    /* `desc` IS THE FIELD, and it is the product's own: the server's schema
       requires it, the heuristic writes it, and the review dialog and every
       obligation surface read it. Written as `text` this tile printed a count
       with nothing under it — a number the reader cannot act on. */
    o.ok ? found.map(x => x && x.desc).filter(Boolean).slice(0, 3).join(' · ') : (o.why || ''),
    o.ok ? found.length : null);

  /* FILED reports facts already on the record — the stream somebody picked on
     the upload screen and the owner HaTi stamps at creation. It proposes
     nothing, which is why it costs nothing and why it is here at all. */
  add('filed', triageFiledLine(c));
  return out;
}

function triageFiledLine(c){
  const f = (typeof FOLDERS === 'object' && FOLDERS && c && FOLDERS[c.folder]) ? FOLDERS[c.folder].name : '';
  const who = (c && c.owner && c.owner.name) ? c.owner.name : '';
  return [f, who].filter(Boolean).join(' · ');
}

/* The one-line summary the collapsed row and the register both read. Built from
   the SAME step record the tiles are, so the two can never disagree about what
   was found. */
function triageLine(c){
  const t = triageOf(c); if (!t) return '';
  const s = t.steps || {}, bits = [];
  const T = (k, n, o) => (typeof i18tn === 'function') ? i18tn(k, n, o)
    : (typeof i18t === 'function' ? i18t(k + '_other', o) : '');
  if (s.playbook && s.playbook.ok){
    const bad = (s.playbook.dev || 0) + (s.playbook.miss || 0);
    /* THE PRODUCT'S OWN PHRASE FOR THIS NUMBER. checkVerdict has called
       deviations-plus-missing "N to look at" since the Checks card was built,
       and it is the honest one: a standard the contract is SILENT about has
       not been deviated from, it is absent. The approved drawing said
       "deviations", and the tile beside this still names the categories, which
       is what tells the two apart. */
    bits.push(bad ? T('tri_n_look', bad, { n: bad })
      : (typeof i18t === 'function' ? i18t('tri_n_clean') : ''));
  }
  if (s.oblig && s.oblig.ok){
    const n = (s.oblig.found || []).length;
    bits.push(T('tri_n_oblig', n, { n }));
  }
  if (!bits.length && t.error) bits.push(t.error);
  return bits.join(' · ');
}

/* Did anything at all come back? The card's own tone reads this: a triage that
   read the contract is teal (it arrived, nothing is wrong), one that could not
   read it is amber (something needs you). */
const triageReadAnything = c => {
  const t = triageOf(c); if (!t) return false;
  const s = t.steps || {};
  return TRIAGE_STEPS.some(k => s[k] && s[k].ok);
};

/* ---- THE RUN ----
   SEQUENTIAL, NEVER PARALLEL. This codebase already records what concurrent
   AI calls cost — "a few key-term edits produced NINE concurrent POST
   /api/ai/extract calls" — and three at once would race the budget guard on
   the hot path of the thing it is measuring.

   IT PRESSES THE PRODUCT'S OWN READINGS and stores what they store, in the
   places their own screens read: c.scan, c.playbook, the server-side brief
   cache. The only thing it keeps for itself is the SUMMARY and the held
   obligation proposals. */
async function triageRun(c, opts = {}){
  if (!c) return null;
  if (typeof canEdit === 'function' && !canEdit()) return null;
  /* Not twice at once. A second press while the first is in flight would pay
     for every reading again and race two writers onto one record. */
  if (c._triaging) return null;
  c._triaging = true;
  const paint = () => { try{ if (opts.onStep) opts.onStep(c); }catch(_){ } };
  const t = { at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString(),
    by: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : '',
    steps: {}, seenAt: null };
  c.triage = t;
  /* ---- IS THERE A DOCUMENT TO READ AT ALL? ----
     A scanned lease whose text never came out of the file is the commonest
     shape this feature meets, and on it the risk scan — which is rule-matching
     over a string — "succeeds" by finding nothing in nothing. Left there the
     card would report a contract as read and clean when not one word of it had
     been seen, which is the exact wrong answer wearing a right one's clothes.

     THIS IS NOT A READER'S OWN READABILITY FLOOR AND MUST NOT BECOME ONE.
     Each reader applies its own — OBLIG_TEXT_MIN for the obligations scan, the
     standards check its own — and a copy of either here is how they would come
     to disagree about what "readable" means. What is asked here is strictly
     weaker and obviously true: is there any text at all. A short document
     still goes to the readers and still gets each one's own refusal. */
  const docText = (() => {
    try{
      if (typeof isUpload === 'function' && isUpload(c)) return (c.upload && c.upload.extractedText) || '';
      return (typeof contractPlainText === 'function') ? contractPlainText(c) || '' : '';
    }catch(_){ return ''; }
  })();
  if (!String(docText).trim()){
    for (const k of TRIAGE_STEPS) t.steps[k] = { ok: false, why: triageNoText() };
    t.error = triageNoText();
    if (typeof logAudit === 'function') logAudit(c, 'Read', 'Auto-triage: no text could be read from the document');
    if (typeof persist === 'function') persist(c);
    delete c._triaging;
    paint();
    return t;
  }
  try{
    /* 1 — RISK. Deterministic rule-matching, no model, no spend. */
    try{
      if (typeof runScan !== 'function') t.steps.risk = { ok: false, why: triageAbsent() };
      else {
        runScan(c);
        const n = (typeof openFindings === 'function') ? openFindings(c).length : 0;
        t.steps.risk = { ok: true, open: n };
      }
    }catch(e){ t.steps.risk = { ok: false, why: String(e && e.message || e) }; }
    paint();

    /* 2 — THE BRIEF. Quiet: its refusal is printed on the card, not toasted. */
    try{
      /* `o` IS THE OUT-PARAM, and that is this product's own shape for these
         three readings rather than a new one: each already writes its refusal
         onto the options bag it was handed, and a cap it had to make now rides
         back the same way. api() no longer toasts one for a quiet caller — see
         its own note — so carrying it here is what stops a suppressed box
         becoming a silent trim. */
      const o = { quiet: true };
      const r = (typeof runContractBrief === 'function')
        ? await runContractBrief(c, o) : { error: triageAbsent() };
      if (r && r.error) t.steps.brief = { ok: false, why: r.error };
      /* ---- A READING THAT WAS NOT KEPT IS NOT RECORDED AS DONE ----
         (owner-reported 10 Sep 2026: "contract brief in the top highlight says
         brief written but as you can see on the bottom highlighted area on the
         contract brief, I had to click write brief for a second time. This
         should not be the case if it was already written before.")

         REPRODUCED, and both halves were telling the truth about different
         things. A brief the provider CUT SHORT is deliberately not written to
         the briefs table — the route's own note says why, in its own words:
         "the reader is told, and the next press asks again rather than being
         handed a permanent half-answer." So it existed in memory for that one
         sitting and was gone the moment the contract was read back. This record
         is DURABLE, though, so the strip went on saying the brief was written
         for ever while the card beside it correctly said there was none.

         AND THE PREMISE UNDER IT IS GONE — REVERSED IN PLACE 10 Sep 2026.
         Owner-ruled that a written brief must survive a refresh, so the route
         KEEPS a cut-short brief now, marked with its own flag. A step recorded
         "not done" over a brief the record really holds would be the same
         contradiction pointing the other way — the note and the thing it
         describes disagreeing about one brief.

         SO IT IS RECORDED AS DONE, PARTIALLY: the line off the brief that
         exists, and the cap said beside it. `tri_brief_cut` is STALE and is
         left inert in both books. The tile does not depend on any of this —
         since 10 Sep it asks the brief itself and falls back to the note only
         where there is nothing to look at, which is what makes a note that
         goes wrong harmless rather than load-bearing. */
      else if (r) t.steps.brief = { ok: true, line: triageBriefLine(r),
        cut: o.notice || (r.truncated
          ? ((typeof i18t === 'function') ? i18t('tri_cut') : '') : '') };
      else t.steps.brief = { ok: false, why: (typeof i18t === 'function') ? i18t('tri_no_answer') : '' };
    }catch(e){ t.steps.brief = { ok: false, why: String(e && e.message || e) }; }
    paint();

    /* 3 — OUR STANDARDS. Stored on c.playbook exactly as the Checks card's own
       press stores it, with the same audit line, so the two paths leave the
       record in one shape. */
    try{
      const o = { quiet: true };
      const r = (typeof runPlaybookReview === 'function')
        ? await runPlaybookReview(c, o) : { error: triageAbsent() };
      if (r && r.error) t.steps.playbook = { ok: false, why: r.error };
      else if (r && r.verdicts){
        c.playbook = r;
        const sum = (typeof deviationSummary === 'function') ? deviationSummary(c) : { dev: 0, miss: 0 };
        const cats = (r.verdicts || []).filter(v => v.status === 'deviation' || v.status === 'missing')
          .map(v => v.category).filter(Boolean);
        t.steps.playbook = { ok: true, dev: sum.dev || 0, miss: sum.miss || 0,
          cats: cats.slice(0, 4), cut: o.notice || '' };
        if (typeof logAudit === 'function')
          logAudit(c, 'Playbook', `Reviewed against ${r.label} — ${sum.dev} deviation(s), ${sum.miss} missing`);
      } else t.steps.playbook = { ok: false, why: (typeof i18t === 'function') ? i18t('tri_no_answer') : '' };
    }catch(e){ t.steps.playbook = { ok: false, why: String(e && e.message || e) }; }
    paint();

    /* 4 — OBLIGATIONS. PROPOSED AND HELD. runFindObligations is deliberately
       NOT the door used here: it ends by throwing its review dialog up, which
       is right for somebody who pressed a button and wrong for a reading that
       ran because a file landed. The list waits on the card. */
    try{
      const o = { quiet: true };
      if (typeof extractObligations !== 'function') o.error = triageAbsent();
      const found = o.error ? [] : (await extractObligations(c, o) || []);
      if (o.error) t.steps.oblig = { ok: false, why: o.error };
      else{
        t.steps.oblig = { ok: true, found, cut: o.notice || '' };
        /* THE CONTRACT REMEMBERS IT WAS READ, by the same stamp the manual
           scan writes and on the same NAMED floor it asks — OBLIG_TEXT_MIN,
           never a number typed again here. Where that name cannot be reached
           the stamp is WITHHELD rather than guessed: a stamp claims a reading
           happened, and the quiet direction is to claim nothing. */
        if (typeof obligationsReadStamp === 'function'){
          const txt = (typeof isUpload === 'function' && isUpload(c))
            ? (c.upload && c.upload.extractedText) || ''
            : (typeof contractPlainText === 'function' ? contractPlainText(c) : '');
          const floor = (typeof OBLIG_TEXT_MIN === 'number') ? OBLIG_TEXT_MIN : Infinity;
          if (txt && txt.length >= floor) obligationsReadStamp(c, txt);
        }
      }
    }catch(e){ t.steps.oblig = { ok: false, why: String(e && e.message || e) }; }

    /* THE ONE AUDIT LINE, and it says what was read rather than what was
       found — the findings are on the record and have their own lines. */
    if (typeof logAudit === 'function')
      logAudit(c, 'Read', `Auto-triage: ${TRIAGE_STEPS.filter(k => t.steps[k] && t.steps[k].ok).length} of ${TRIAGE_STEPS.length} readings completed`);
    if (typeof persist === 'function') persist(c);
  } finally {
    delete c._triaging;
  }
  paint();
  return t;
}

/* A READING THAT IS NOT ON THIS STAGE SAYS SO RATHER THAN VANISHING. Left
   unrecorded, a missing module produced a tile that simply was not drawn — the
   card silently claiming three readings where four were owed, which is the
   silence this whole feature is written against. */
const triageNoText = () => (typeof i18t === 'function') ? i18t('tri_no_text') : 'no text';
const triageAbsent = () => (typeof i18t === 'function') ? i18t('tri_not_available') : 'unavailable';

/* One short sentence off the brief, for the tile. The brief's own summary
   where it has one; never composed here, because prose about a legal document
   is not this file's to write. */
/* THE BRIEF'S OWN SHAPE, AND IT IS ONE LEVEL DOWN (owner-reported 9 Sep 2026:
   the tile drew its tick with nothing under it). The route answers
   { v, at, by, inputHash, truncated, data } and every field a reader ever sees
   lives under `data` — renderBriefSection reads exactly that. Written against a
   `summary` and a `headline` that no brief has ever carried, this returned ''
   on every contract in the product.

   THE SAME CLASS AS THE OBLIGATIONS TILE READING `text` WHERE THE FIELD IS
   `desc`, which was caught before it shipped and this was not: a tile reading a
   field that does not exist fails as an EMPTY LINE rather than as an error, so
   nothing anywhere says so. Both were found by dumping what a real run actually
   renders. Read the answer, not the schema you remember.

   THE FIRST SENTENCE OF `overview`, because that field is two to four of them
   and a tile holds one line — and because it is the brief's OWN answer to what
   this contract is, so the tile can never say something the panel behind it
   does not. A very short opener ("This is a supply agreement.") tells nobody
   anything, so there the whole overview is clamped instead. */
function triageBriefLine(b){
  const d = (b && b.data) || {};
  const s = String(d.overview || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const first = (s.match(/^[^.!?]+[.!?]/) || [s])[0].trim();
  const flat = first.length < 40 ? s : first;
  return flat.length > 120 ? flat.slice(0, 119).replace(/\s+\S*$/, '') + '…' : flat;
}

/* ---- THE READING IS OFFERED, NEVER MADE TWICE (owner-reported 9 Sep 2026)
   ----
   *"although it ran the obligations in image 1, there are not there in image 2
   meaning I have to run obligations again."* The strip said "20 obligations
   found" and the Checks card beside it said "Run →", because the owner's own
   fourth ruling is that auto-triage PROPOSES obligations and files none — a
   person still ticks. Both were telling the truth and the pair read as a
   product that had lost its own answer, and pressing Run spent Copilot money a
   second time for a list already on the record.

   THIS IS WHAT IS STILL WAITING TO BE TICKED: the proposals triage made, less
   anything now on the contract. `obligationAlreadyOn` is the product's own
   dedupe — the same reading the review dialog unticks a duplicate with — so
   once they are ticked this empties by itself and the ordinary scan comes back.
   RULING 4 IS UNTOUCHED: nothing here files anything. */
function triageHeldObligations(c){
  const t = triageOf(c); if (!t) return [];
  const o = (t.steps || {}).oblig;
  const found = (o && o.ok && Array.isArray(o.found)) ? o.found : [];
  if (!found.length) return [];
  if (typeof obligationAlreadyOn !== 'function') return found;
  return found.filter(x => x && !obligationAlreadyOn(c, x));
}

/* ---- ACKNOWLEDGING IT ----
   An ACT, never a render: the card clears because somebody pressed it. */
function triageAck(c){
  const t = triageOf(c); if (!t || t.seenAt) return false;
  t.seenAt = (typeof nowISO === 'function') ? nowISO() : new Date().toISOString();
  if (typeof persist === 'function') persist(c);
  return true;
}

Object.assign(window, { TRIAGE_STEPS, TRIAGE_HEADS, triageBusy, triageAbsent, triageNoText, triageApplies, triageOf, triageSeen, triageCards,
  triageTiles, triageFiledLine, triageLine, triageReadAnything, triageRun, triageBriefLine,
  triageHeldObligations,
  triageAck });
