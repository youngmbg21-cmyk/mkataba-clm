// HaTi — extracted module. Globals are window-attached on purpose (see js/ai.js).
/* ============================================================================
   RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD
   (Young picked "A pile to look at" and "Read in place" by name, 4 Oct 2026,
   and ruled the separate Risk scan panel away the same evening)
   ============================================================================
   *"i also think copilot scan is very much hidden … the scan would require you
   to read one by one and apply."*

   ONE READING, THREE SURFACES. riskItemsOf(c) is the one list of what is worth
   a look on a contract: the risk scan's findings and the brief's watchouts and
   unusual terms (the two sources Risk View already marks). It is read by
   · the Redlines column's "Risks to look at" list (rlRisksPileHtml), where a
     risk is read IN PLACE and either becomes an unsent redline or is dismissed;
   · Risk View on the Document tab, whose marks carry only "Add a note"
     (riskMarkFootHtml);
   · the Overview's "Risks found" tile and the room's Copilot count.
   Our standards are NOT in it: "Draft from our standards" (rlPrepareRedlines)
   already drafts every gap from those, all at once, as it always has.

   READING MUST NOT WRITE. riskItemsOf reads c.scan, c._brief and c.risks RAW;
   nothing here calls negoClauseList until a person PRESSES something.

   NOTHING IS FILED THAT A PERSON DID NOT READ, AND NOTHING IS SENT. Drafting
   asks Copilot once (copilotPropose, the clause editor's own call) and the
   wording waits in the editor's box. Only the editor's Save files it — through
   negoEditClause, negoReviseInsert or negoAddNamedClause, the funnel a
   person's own edit uses — and the change lands unsent like any other.

   ONE DOOR FOR EDITS (the owner's work order, Part 8, 4 Oct 2026). "Edit with
   Copilot" on a risk opens the Edit with Copilot window — the one the pencil
   opens — on the clause the risk is about, with the risk in the rail's Risks
   tab and Copilot's wording in the Suggested wording card, waiting for Apply
   (5 Oct 2026, the same screen as from a clause). Save, then the next risk, all
   inside the window (riskEditStart, the walk, riskLaneHtml). A risk that needs
   a brand-new clause opens the window holding that clause where it will go
   (Young chose to build it, 5 Oct 2026): "Where it goes" in the Risks tab,
   never at or after the signatures, its heading on the paper. The card itself
   drafts nothing any more.

   ALREADY COVERED. A risk on a topic Our standards checked, or on a clause we
   already redlined, is not listed and not counted (riskCoverOf): it waits in
   "Covered by your redlines", each line naming the redline that covers it, and
   comes back by itself when that redline is discarded — it is read live off
   c.changes and c.playbook, never stored.

   WHAT IS KEPT ON THE RECORD is c.risks = { dismissed:[key], drafted:{key:id} }.
   A scan finding's dismissal stays where it always was (c.scan.dismissed), so
   every reader of openFindings agrees with this list. c.risks never travels:
   buildSharePayload sends an allow-list and does not name it.
   ============================================================================ */

const RK_SEV_RANK = { high: 3, med: 2, low: 1 };
const _rkT = (k, v) => (typeof i18t === 'function' ? i18t(k, v) : k);
const _rkE = s => (typeof esc === 'function' ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])));
const _rkNorm = s => String(s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ').trim().toLowerCase();
function _rkHash(s){
  let h = 5381;
  const t = _rkNorm(s);
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
/* THE KEY OF A MARK, the same on every surface: a scan finding by its id, a
   brief line by its own words. */
const riskKeyOf = (src, idOrSay) => (src === 'scan' ? 's:' + String(idOrSay)
  : (src === 'odd' ? 'o:' : 'b:') + _rkHash(idOrSay));

function _rkStore(c){
  const r = c && c.risks && typeof c.risks === 'object' ? c.risks : null;
  return { dismissed: (r && Array.isArray(r.dismissed)) ? r.dismissed : [],
    drafted: (r && r.drafted && typeof r.drafted === 'object') ? r.drafted : {} };
}
function _rkStoreW(c){
  if (!c.risks || typeof c.risks !== 'object') c.risks = {};
  if (!Array.isArray(c.risks.dismissed)) c.risks.dismissed = [];
  if (!c.risks.drafted || typeof c.risks.drafted !== 'object') c.risks.drafted = {};
  return c.risks;
}
/* A FINDING ABOUT A BOX ON THE RECORD IS NOT A REDLINE. The scan's generic
   checks (g-*) and every finding anchored on the recital are about a blank —
   no counterparty, no value, no date, no material named — which is filled on
   the Overview, not argued over in wording. They stay in Risk View and on the
   sign check; they are not drafted here. */
const _rkDraftable = f => !!f && !/^g-/.test(String(f.id || '')) && String(f.anchor || '') !== 'recital';

/* A TOPIC, READ THE WAY THE STANDARDS READ A CLAUSE: the clause kinds Our
   standards already match on (js/clausemodel.js), asked of a risk's title or
   a redline's clause name. null where nothing matches — the safe direction:
   a risk of no known topic is never treated as covered. */
function _rkKind(text){
  const t = String(text || '').trim();
  if (!t || typeof clauseKind !== 'function') return null;
  try{ return clauseKind({ title: t }); }catch(_){ return null; }
}
const RK_PB_NOTE = /^Playbook — ([^:(]+)/;
/* What could cover a risk, read RAW once per list: our live redlines (with
   the clause each was filed on and, for a standards redline, the standard it
   enforces) and the standards the last check answered. */
function _rkCoverCtx(c){
  const mine = (Array.isArray(c.changes) ? c.changes : [])
    .filter(x => x && !x.withdrawn && x.status !== 'superseded' && x.authorSide === 'owner')
    .map(ch => {
      const m = RK_PB_NOTE.exec(String(ch.note || ''));
      return { ch, text: _rkNorm(ch.oldText), kind: _rkKind(ch.clauseLabel || ch.headingText), std: m ? m[1].trim() : '' };
    });
  const vs = (c.playbook && Array.isArray(c.playbook.verdicts)) ? c.playbook.verdicts : [];
  const verdicts = vs.filter(v => v && ['aligned', 'ok', 'deviation', 'missing'].includes(String(v.status || '')))
    .map(v => ({ v, kind: (typeof ruleKind === 'function') ? ruleKind(v.category) : null, quote: _rkNorm(v.quote) }));
  return { mine, verdicts };
}
/* IS THIS RISK ALREADY BEING HANDLED? (a) Our standards checked the same
   topic and their redline is on the record — the standard's own topic, or its
   finding's quote, meets the risk's; (b) a redline of ours on the clause the
   risk is about — its words hold the risk's quote, or its clause is of the
   risk's topic. Either way a REDLINE covers it, so discarding that redline
   brings the risk back by itself. Returns { id, clause, clauseId, std } or
   null. A risk's own redline is "drafted", not this. */
function riskCoverOf(it, ctx, ownId){
  if (!it || !ctx) return null;
  const q = _rkNorm(it.quote), kind = _rkKind(it.title);
  const near = (a, b) => !!(a && b && (a.includes(b) || (a.length > 40 && b.includes(a))));
  const out = m => ({ id: String(m.ch.id), clause: String(m.ch.clauseLabel || ''), clauseId: String(m.ch.clauseId || ''), std: m.std });
  for (const m of ctx.mine){
    if (!m.std || (ownId && String(m.ch.id) === String(ownId))) continue;
    const v = ctx.verdicts.find(x => _rkNorm(x.v.category) === _rkNorm(m.std));
    const sk = (typeof ruleKind === 'function') ? ruleKind(m.std) : null;
    if ((kind && sk === kind) || (v && (near(v.quote, q) || near(q, v.quote)))) return out(m);
  }
  for (const m of ctx.mine){
    if (ownId && String(m.ch.id) === String(ownId)) continue;
    if (near(m.text, q) || (kind && m.kind === kind)) return out(m);
  }
  return null;
}

/* THE ONE LIST. Worst first, then the order the sources gave. */
function riskItemsOf(c){
  if (!c) return [];
  const st = _rkStore(c);
  const out = [];
  const seenQ = new Set(), seenT = new Set();
  const take = it => {
    const q = _rkNorm(it.quote), t = _rkNorm(it.title);
    if ((q && seenQ.has(q)) || (t && seenT.has(t))) return;
    if (q) seenQ.add(q);
    if (t) seenT.add(t);
    out.push(it);
  };
  const scan = c.scan && Array.isArray(c.scan.findings) ? c.scan.findings : [];
  const dis = c.scan && Array.isArray(c.scan.dismissed) ? c.scan.dismissed : [];
  scan.filter(_rkDraftable).forEach(f => {
    const quote = (typeof findingQuote === 'function') ? findingQuote(f) : (f.quote || '');
    take({ key: riskKeyOf('scan', f.id), src: 'scan', id: f.id,
      sev: RK_SEV_RANK[f.sev] ? f.sev : 'med', title: String(f.title || ''),
      say: String(f.what || ''), why: String(f.why || ''), fix: String(f.fix || ''),
      quote, missing: f.kind === 'missing' && !quote, anchor: f.anchor || '',
      dismissed: dis.includes(f.id) });
  });
  const brief = (src, list, sev) => (list || []).forEach(w => {
    const key = riskKeyOf(src, w.say);
    take({ key, src, sev, title: w.say, say: '', why: w.why || '', fix: '', quote: w.quote || '',
      missing: false, anchor: '', dismissed: st.dismissed.includes(key) });
  });
  try{ if (typeof docXrayBriefWatch === 'function') brief('brief', docXrayBriefWatch(c), 'med'); }catch(_){}
  try{ if (typeof docXrayBriefOdd === 'function') brief('odd', docXrayBriefOdd(c), 'low'); }catch(_){}
  const live = new Set((Array.isArray(c.changes) ? c.changes : [])
    .filter(x => x && !x.withdrawn).map(x => String(x.id)));
  const ctx = _rkCoverCtx(c);
  out.forEach(it => {
    const id = st.drafted[it.key];
    it.drafted = id && live.has(String(id)) ? String(id) : '';
    it.covered = (it.drafted || it.dismissed) ? null : riskCoverOf(it, ctx, '');
  });
  return out.map((it, i) => ({ it, i }))
    .sort((a, b) => (RK_SEV_RANK[b.it.sev] - RK_SEV_RANK[a.it.sev]) || (a.i - b.i))
    .map(x => x.it);
}
/* WHAT IS STILL WAITING ON SOMEBODY: not dismissed, not already a redline,
   not covered by one — the one count for the list, the tile and the room. */
const riskOpenOf = c => riskItemsOf(c).filter(it => !it.dismissed && !it.drafted && !it.covered);
/* Whether a brief line someone dismissed here should still be marked in Risk
   View. Dismissing anywhere dismisses everywhere. */
const riskKeyDismissed = (c, key) => _rkStore(c).dismissed.includes(String(key));
/* A redline this list filed — the row's own small "from the risk scan". */
function riskFromScan(c, ch){
  if (!c || !ch) return false;
  const d = _rkStore(c).drafted;
  return Object.keys(d).some(k => String(d[k]) === String(ch.id));
}

function riskDismiss(c, key, back){
  if (!c || !key) return;
  const k = String(key);
  if (k.startsWith('s:')){
    const id = k.slice(2);
    if (!c.scan) return;
    if (!Array.isArray(c.scan.dismissed)) c.scan.dismissed = [];
    const has = c.scan.dismissed.findIndex(x => String(x) === id);
    if (back){ if (has >= 0) c.scan.dismissed.splice(has, 1); }
    else if (has < 0){
      const f = (c.scan.findings || []).find(x => x && String(x.id) === id);
      c.scan.dismissed.push(f ? f.id : id);
    }
  } else {
    const st = _rkStoreW(c);
    const has = st.dismissed.indexOf(k);
    if (back){ if (has >= 0) st.dismissed.splice(has, 1); }
    else if (has < 0) st.dismissed.push(k);
  }
  if (typeof persist === 'function') persist(c);
}

/* ================= THE SITTING STATE =================
   What the list and the walk are showing is a fact about this sitting, never
   about the record; a refresh starts fresh, which costs nothing because
   nothing here was filed. */
const _rk = { showDismissed: {}, showCovered: {}, opts: null, walk: null, words: {}, advice: {}, busy: '', err: {}, spent: {} };

/* WHERE A RISK'S WORDING WOULD GO, asked at the PRESS (negoClauseList may
   start a negotiation; a draw never calls this). A finding whose words are on
   the paper changes THAT clause; so does one about something "missing" when a
   clause of its topic is already there ("Missing governing law" with clause 33
   Governing Law changes clause 33 — never a second one). Only what no clause
   carries becomes a new clause, after the last clause ahead of the signatures
   — the playbook's own rule for a new clause. */
function _rkClauses(c){
  try{ return (typeof negoClauseList === 'function') ? (negoClauseList(c) || []) : []; }catch(_){ return []; }
}
/* THE SIGNATURES BEGIN HERE: a clause whose heading is Signatures, Execution,
   Signed by or In witness, or whose words are the execution block. Nothing new
   ever goes at or after it. */
const RK_SIGN_HEAD = /^\W*(?:\d+[.)]?\s*)?(?:signatures?|execution|signed by|in witness|signing|underskrifter)\b/i;
const _rkIsSigning = cl => RK_SIGN_HEAD.test(String((cl && (cl.headingText || cl.title)) || '').trim())
  || /\b(signed for|in witness|witnesseth)\b|signature:\s/i.test(String((cl && cl.text) || '') + ' ' + String((cl && cl.headingText) || ''));
function _rkLastTerm(clauses){
  const boiler = _rkIsSigning;
  let after = null;
  for (const cl of clauses){ if (boiler(cl)) break; after = cl.clauseId; }
  if (after == null && clauses.length) after = clauses[clauses.length - 1].clauseId;
  return after;
}
/* THE CLAUSE A RISK CHANGES, or null where it needs a new one: its quote's
   own clause, else the first clause of its topic. With it, our own pending
   redline on that clause, which the edit is written ON TOP of — one redline
   per clause, never two. */
function riskEditTarget(c, it){
  if (!c || !it) return null;
  const kind = _rkKind(it.title);
  const cat = (kind && typeof clauseKindByKey === 'function' && clauseKindByKey(kind)) ? clauseKindByKey(kind).category : '';
  let cl = null;
  if (it.quote && typeof rlPbFindClause === 'function'){ try{ cl = rlPbFindClause(c, it.quote, cat); }catch(_){ cl = null; } }
  if (!(cl && cl.clauseId) && kind && typeof clauseKind === 'function'){
    cl = _rkClauses(c).find(x => { try{ return !_rkIsSigning(x) && clauseKind(x) === kind; }catch(_){ return false; } }) || null;
  }
  if (!cl || !cl.clauseId){
    /* NOTHING OF ITS TOPIC IS THERE: a NEW clause, after the last clause
       ahead of the signatures, named from the risk (the reader may move it
       and rename it before saving). */
    const after = _rkLastTerm(_rkClauses(c));
    return after ? { newClause: true, afterClauseId: String(after), heading: _rkHeadingFrom(it), label: _rkHeadingFrom(it), clauseId: '', changeId: null } : null;
  }
  const ch = (Array.isArray(c.changes) ? c.changes : []).find(x => x && String(x.clauseId) === String(cl.clauseId)
    && x.authorSide === 'owner' && !x.withdrawn && x.status === 'pending');
  return { clauseId: String(cl.clauseId), label: _rkClauseName(cl), changeId: ch ? String(ch.id) : null };
}
const _rkClauseName = cl => {
  const raw = String((cl && (cl.headingText || cl.title)) || '').trim();
  return (typeof clauseNameShown === 'function' ? clauseNameShown(raw) : raw) || _rkT('ng_this_clause');
};
/* A sensible heading for a new clause, from the finding's own title — the
   reader can change it before adding. "No injunctive-relief clause" →
   "Injunctive relief". */
function _rkHeadingFrom(it){
  let t = String(it.title || '').trim()
    .replace(/^(no|missing|without)\s+/i, '').replace(/\s+(clause|provision|wording)\b.*$/i, '')
    .replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) t = String(it.title || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}
function _rkConcern(it){
  return [it.title, it.say, it.why ? 'Why it matters: ' + it.why : '', it.fix ? 'Suggested fix: ' + it.fix : '']
    .filter(Boolean).join('\n');
}

/* ================= A NOTE INSTEAD ================= */
function riskNote(c, key){
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it || !c) return false;
  let cl = null;
  if (it.quote && typeof rlPbFindClause === 'function'){ try{ cl = rlPbFindClause(c, it.quote, ''); }catch(_){ cl = null; } }
  if (cl && cl.clauseId && typeof rlNoteFromSelection === 'function'){
    if (rlNoteFromSelection(c, { clauseId: cl.clauseId, quote: it.quote })) return true;
  }
  /* No clause to pin it to: a note on the contract, with the risk's own words
     waiting in the box so the reader only has to add theirs. */
  if (typeof rlNotesPin === 'function' && typeof openNotesPanel === 'function'){
    rlNotesPin({ contractId: c.id, room: 'internal', drafts: { internal: it.title + ' — ', external: '' } });
    openNotesPanel(c.id, null, { force: true });
    return true;
  }
  return false;
}

/* ================= ONE DOOR FOR EDITS: THE WALK IN EDIT WITH COPILOT =================
   "Edit with Copilot" on a risk opens the Edit with Copilot window on the
   clause the risk is about (riskEditTarget), with the risk in the rail's Risks
   tab. The walk is a fact about this sitting: the open risks in list order
   when it began, where the reader is, what was saved and skipped. Covered,
   dismissed and drafted risks are passed over; a risk that needs a NEW clause
   opens the window holding it where it will go. */
const RK_ASKS = {
  firmer: 'Make it firmer for our side.',
  softer: 'Give a softer, more balanced version.',
  shorter: 'Make it shorter, with the same effect.',
  playbook: 'Rewrite it to match our playbook position for this kind of clause.',
};
const RK_ASK_WORD = { firmer: 'rk_ce_firmer', softer: 'rk_ce_softer', shorter: 'rk_ce_shorter', playbook: 'rk_ce_playbook' };
const _rkOpenNow = (c, key) => riskOpenOf(c).some(x => x.key === key);
function _rkWalkOf(c){ const w = _rk.walk; return (w && c && w.cid === String(c.id)) ? w : null; }
function _rkEditorOpen(c, key, t){
  const w = _rkWalkOf(c); if (!w) return false;
  w.key = key; w.isNew = !!t.newClause; w.clauseId = t.newClause ? String(window.CE_NEW_ID || 'cl_ce_new') : t.clauseId;
  w.label = t.label || ''; w.done = false;
  try{ if (typeof clauseEditorOpen === 'function' && clauseEditorOpen() && typeof rlCloseClauseEditor === 'function') rlCloseClauseEditor(); }catch(_){}
  if (typeof rlOpenClauseEditor !== 'function') return false;
  if (t.newClause) return rlOpenClauseEditor(c, null, { tab: 'risks', risk: key, newClause: { afterClauseId: t.afterClauseId, heading: t.heading } });
  return rlOpenClauseEditor(c, t.clauseId, { tab: 'risks', risk: key, ...(t.changeId ? { changeId: t.changeId } : {}) });
}
/* The first press: the window, on the clause the risk changes or holding the
   new clause it needs. */
function riskEditStart(c, key){
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!c || !it) return false;
  const t = riskEditTarget(c, it);
  if (!t){ if (typeof toast === 'function') toast(_rkT('ce_no_clause'), 'warn'); return false; }
  const keys = riskOpenOf(c).map(x => x.key);
  if (!keys.includes(key)) keys.unshift(key);
  _rk.walk = { cid: String(c.id), keys, at: keys.indexOf(key), saved: [], skipped: [], newcl: [], key: '', clauseId: '', done: false };
  return _rkEditorOpen(c, key, t);
}
/* Move along: 'next' after a save, 'skip' without one, 'prev' back. */
function riskWalkStep(c, how){
  const w = _rkWalkOf(c); if (!w) return false;
  if (how === 'skip' && w.key && !w.skipped.includes(w.key) && !w.saved.includes(w.key)) w.skipped.push(w.key);
  const dir = how === 'prev' ? -1 : 1;
  for (let i = w.at + dir; i >= 0 && i < w.keys.length; i += dir){
    const key = w.keys[i];
    if (!_rkOpenNow(c, key)) continue;
    const it = riskItemsOf(c).find(x => x.key === key);
    const t = riskEditTarget(c, it);
    if (!t){ if (!w.newcl.includes(key)) w.newcl.push(key); continue; }
    w.at = i;
    return _rkEditorOpen(c, key, t);
  }
  if (dir < 0) return false;
  /* THE LAST ONE: the window says so, in place. Nothing is sent. */
  w.done = true; w.at = w.keys.length;
  if (typeof ceRenderAll === 'function') ceRenderAll();
  return true;
}
function riskWalkEnd(c){
  _rk.walk = null;
  if (typeof rlCloseClauseEditor === 'function') rlCloseClauseEditor();
  if (c) rkRepaintAll(c);
}
/* What the window is holding: the risk, where it sits in the walk, and
   whether the clause on screen is the one it is about. */
function riskWalkInfo(c){
  const w = _rkWalkOf(c); if (!w) return null;
  const it = w.done ? null : riskItemsOf(c).find(x => x.key === w.key) || null;
  return { it, key: w.key, k: Math.min(w.at + 1, w.keys.length), n: w.keys.length, done: w.done, clauseId: w.clauseId,
    saved: w.saved.length, skipped: w.skipped.length, newcl: w.newcl.length };
}
/* A filing from the walk: the risk is drafted, and remembers it. */
function riskFiled(c, key, ch){
  if (!c || !key || !ch) return;
  const it = riskItemsOf(c).find(x => x.key === key);
  _rkStoreW(c).drafted[key] = String(ch.id);
  const w0 = _rkWalkOf(c); if (w0 && w0.key === key){ w0.clauseId = String(ch.clauseId || w0.clauseId); w0.isNew = false; }
  if (typeof logAudit === 'function') logAudit(c, 'Risk', `Redline drafted from the risk scan in Edit with Copilot — ${String((it && it.title) || '').slice(0, 160)} (${ch.id}, not sent)`);
  if (typeof persist === 'function') persist(c);
  const w = _rkWalkOf(c); if (w && !w.saved.includes(key)) w.saved.push(key);
  /* the column behind the window learns where the row came from now, not at
     the next repaint */
  try{ rkRepaintAll(c); }catch(_){}
}
/* PROVENANCE, NEVER A REASON — the same words the card's filing writes. */
const riskProvenance = it => 'Copilot — Risk scan: ' + String((it && it.title) || '').slice(0, 200);
/* THE SAFETY NET AT SAVE: a redline of ours already on this clause that this
   filing would NOT fold into (sent in an earlier round, or not pending) would
   make two. Asked at the press; null where saving makes one. */
function riskSecondRedline(c, clauseId){
  if (!c || !clauseId) return null;
  let round = null;
  try{ round = (typeof negoRound === 'function') ? negoRound(c) : null; }catch(_){ round = null; }
  return (Array.isArray(c.changes) ? c.changes : []).find(x => x && String(x.clauseId) === String(clauseId)
    && x.authorSide === 'owner' && !x.withdrawn && !['superseded', 'rejected'].includes(String(x.status))
    && !(x.status === 'pending' && (round == null || x.roundN === round))) || null;
}
/* ONE COPILOT CALL ON ARRIVAL, said; a quick ask or a typed one asks again.
   THE WORDING WAITS FOR APPLY (Young, 5 Oct 2026: "yes to waiting for
   Apply"): Copilot's answer is the editor's own Suggested wording card
   (riskAnswerOf → ceRiskAnswerHtml), exactly as it is from a clause, and only
   the card's Apply moves it into the box. Wording already written for a risk
   this sitting is shown again without asking. Nothing is filed until Save. */
async function riskEditorDraft(c, key, ask){
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!c || !it || typeof ceApply !== 'function') return false;
  if (!ask && _rk.words[key]){ if (typeof ceRenderLane === 'function') ceRenderLane(); return true; }
  if (!(typeof copilotAvailable === 'function' && copilotAvailable()) || typeof copilotPropose !== 'function'){
    _rk.err[key] = 'noai'; if (typeof ceRenderLane === 'function') ceRenderLane(); return false;
  }
  _rk.busy = key; _rk.err[key] = '';
  if (typeof ceRenderLane === 'function') ceRenderLane();
  const passage = (typeof ceBoxWords === 'function') ? ceBoxWords() : '';
  const clauseLabel = (_rkWalkOf(c) || {}).label || '';
  let res = null, err = null;
  try{
    const isNew = !!(_rkWalkOf(c) || {}).isNew;
    res = await copilotPropose({ ask: _rkT(isNew ? 'rk_prompt_add' : 'rk_prompt_edit'), passage: isNew && !ask ? '' : passage,
      instruction: _rkConcern(it) + (ask ? '\nAsked now: ' + ask : ''),
      clauseLabel: clauseLabel ? String(clauseLabel) : '',
      party: (typeof contractParty === 'function' ? contractParty(c) : '') || '',
      law: (typeof jxLaw === 'function') ? jxLaw() : '' });
  }catch(e){ err = e; }
  if (_rk.busy === key) _rk.busy = '';
  const words = String((res && res.proposedText) || '').trim();
  if (err || !words){ _rk.err[key] = err ? String((err && err.message) || err) : String((res && res.advice) || _rkT('ce_ask_nothing')); }
  else {
    _rk.words[key] = words; _rk.advice[key] = String((res && res.advice) || '').trim();
    _rk.spent[key] = (_rk.spent[key] || 0) + 1;
  }
  if (typeof ceRenderLane === 'function') ceRenderLane();
  return !!words;
}
function riskEditorArrive(c, key){
  const w = _rkWalkOf(c);
  if (!w || w.key !== key) return;
  riskEditorDraft(c, key, '');
}
/* WHAT COPILOT ANSWERED FOR THE RISK IN FRONT OF THE READER, read by the
   editor, which draws it with its own card (the clothes follow the builder). */
function riskAnswerOf(c){
  const w = _rkWalkOf(c);
  if (!w || !w.key || w.done || _rk.busy === w.key) return null;
  const words = _rk.words[w.key];
  return words ? { key: w.key, words, advice: _rk.advice[w.key] || '' } : null;
}
/* THE RISK'S QUICK ASKS, drawn in the rail's own chips row (the same row the
   clause's questions use), each one Copilot call. */
function riskChipsHtml(c){
  const w = _rkWalkOf(c);
  if (!w || !w.key || w.done) return '';
  const busy = _rk.busy === w.key, noai = _rk.err[w.key] === 'noai';
  return Object.keys(RK_ASK_WORD).map(k =>
    `<button type="button" data-ce-rk="ask-${k}" title="${_rkE(_rkT('rk_ce_each'))}"${busy || noai ? ' disabled' : ''}>${_rkE(_rkT(RK_ASK_WORD[k]))}</button>`).join('');
}
/* THE RISKS TAB, drawn by the window's rail. */
function riskLaneHtml(c){
  const info = riskWalkInfo(c);
  if (!info){
    const n = riskOpenOf(c).length;
    return n ? `<div class="rk-ce"><p class="rk-p">${_rkE(_rkT('rk_ce_start', { n }))}</p>
      <div class="rk-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ce-rk="start">${_rkE(_rkT('rk_ce_start_go'))}</button></div></div>`
      : `<p class="ce-scan-none">${_rkE(_rkT('rk_ce_none'))}</p>`;
  }
  if (info.done){
    const covered = riskItemsOf(c).filter(x => x.covered).length;
    return `<div class="rk-ce rk-ce-end" role="status"><b>${_rkE(_rkT('rk_ce_last'))}</b>
      <p class="rk-p">${_rkE(_rkT('rk_ce_tally', { saved: info.saved, skipped: info.skipped, covered }))}</p>
      ${info.newcl ? `<p class="rk-p">${_rkE(_rkT('rk_ce_newcl', { n: info.newcl }))}</p>` : ''}
      <div class="rk-acts" style="justify-content:flex-start"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ce-rk="back">${_rkE(_rkT('rk_ce_back'))}</button></div></div>`;
  }
  const it = info.it;
  if (!it) return `<p class="ce-scan-none">${_rkE(_rkT('rk_ce_none'))}</p>`;
  const dots = Array.from({ length: info.n }, (_, i) => `<i class="${i < info.k - 1 ? 'is-done' : i === info.k - 1 ? 'is-now' : ''}"></i>`).join('');
  const busy = _rk.busy === it.key, err = _rk.err[it.key];
  const say = busy ? `<div class="rk-busy" aria-busy="true"><span class="ob-spin" aria-hidden="true"></span>${_rkE(_rkT('rk_writing'))}</div>`
    : err === 'noai' ? `<p class="rk-p rk-quiet">${_rkE(_rkT('rk_ce_no_ai'))}</p>`
    : err ? `<div class="rk-err">${_rkE(_rkT('rk_failed', { why: err }))}</div>`
    : _rk.spent[it.key] ? `<p class="rk-cost">&#10022; ${_rkE(_rkT(_rk.spent[it.key] === 1 ? 'rk_ce_wrote' : 'rk_ce_wrote_n', { n: _rk.spent[it.key] }))}</p>` : '';
  return `<div class="rk-ce" data-rk-key="${_rkE(it.key)}">
    <div class="rk-ce-step"><span>${_rkE(_rkT('rk_ce_step', { k: info.k, n: info.n }))}</span><span class="rk-ce-dots" aria-hidden="true">${dots}</span></div>
    <div class="rk-ce-card">
      <div class="rk-top"><b class="rk-t">${_rkE(it.title)}</b>${_rkSevHtml(it.sev)}</div>
      <div class="rk-m">${_rkE(_rkT(RK_SRC_KEY[it.src]))}</div>
      ${it.say ? `<p class="rk-p">${_rkE(it.say)}</p>` : ''}
      ${it.why ? `<p class="rk-p"><b>${_rkE(_rkT('ai_why_matters'))}:</b> ${_rkE(it.why)}</p>` : ''}
      ${it.fix ? `<p class="rk-p"><b>${_rkE(_rkT('ai_suggested_fix'))}:</b> ${_rkE(it.fix)}</p>` : ''}
    </div>
    ${_rkWhereHtml(c)}
    ${say}
  </div>`;
}
/* WHERE A NEW CLAUSE GOES, while it is held and not yet filed: a clause to put
   it after, never at or after the signatures (the window holds the place; the
   select moves it — ceSetNewPlace). */
function _rkWhereHtml(c){
  const w = _rkWalkOf(c);
  if (!w || !w.isNew || typeof ceNewPlace !== 'function') return '';
  const now = ceNewPlace();
  const clauses = _rkClauses(c);
  const cut = clauses.findIndex(_rkIsSigning);
  const before = cut >= 0 ? clauses.slice(0, cut) : clauses;
  const opts = before.map(cl => `<option value="${_rkE(cl.clauseId)}"${String(cl.clauseId) === now ? ' selected' : ''}>${_rkE(_rkT('rk_after', { clause: _rkClauseName(cl) }))}</option>`).join('');
  const sign = cut >= 0 ? clauses[cut] : null;
  return `<label class="rk-where"><span class="rk-k">${_rkE(_rkT('rk_where'))}</span>
    <select class="rk-sel" data-ce-rk-where>${opts}</select>
    ${sign ? `<span class="rk-cost">${_rkE(_rkT('rk_ce_never_after', { clause: _rkClauseName(sign) }))}</span>` : ''}</label>`;
}
/* "Where it goes", for the editor's expanded view too (Young, 5 Oct 2026:
   "where it goes should also be on this panel so you can choose before you
   apply") — the same builder, so both say the same places. */
function riskWhereHtml(c){ return _rkWhereHtml(c); }
/* The presses the rail hands over (the window's own Save stays the window's). */
function riskWalkPress(c, act, typed){
  if (!c) return;
  if (act === 'start'){ const first = riskOpenOf(c)[0]; if (first) riskEditStart(c, first.key); return; }
  if (act === 'back'){ riskWalkEnd(c); return; }
  if (act === 'prev'){ riskWalkStep(c, 'prev'); return; }
  if (act === 'skip'){ riskWalkStep(c, 'skip'); return; }
  const w = _rkWalkOf(c); if (!w || !w.key) return;
  if (act === 'send'){
    const said = String(typed || '').trim();
    if (!said) return;
    riskEditorDraft(c, w.key, said); return;
  }
  const k = String(act).replace(/^ask-/, '');
  if (RK_ASKS[k]) riskEditorDraft(c, w.key, RK_ASKS[k]);
}

/* ================= WHO MAY ACT HERE =================
   Our seat, a live working copy, somebody who may edit, not a preview, not a
   reading, not a reviewer narrowed to the asks in front of them, and wording
   that can still change. Anywhere else the list is not drawn at all — a verb
   that cannot work is not drawn. */
function riskMayAct(c, opts = {}){
  if (!c) return false;
  if (opts.side === 'counterparty' || opts.preview || opts.readonly) return false;
  try{ const p = window.PORTAL_MODE; if (typeof p === 'function' ? p() : p) return false; }catch(_){}
  if (typeof canEdit === 'function' && !canEdit()) return false;
  if (typeof negoWordingFrozen === 'function' ? negoWordingFrozen(c) : (typeof negoExecuted === 'function' && negoExecuted(c))) return false;
  /* WHO MAY REDLINE, not who may send: a desk contributor proposes (the
     funnel stamps it a suggestion for the lead), a reviewer narrowed to the
     asks in front of them does not start new ones. */
  try{ if (typeof deskMayRedline === 'function' && !deskMayRedline(c)) return false; }catch(_){}
  try{ if (typeof reviewActorIsHeld === 'function' && reviewActorIsHeld(c)) return false; }catch(_){}
  return true;
}

/* ================= THE LIST IN THE REDLINES COLUMN ================= */
const RK_SRC_KEY = { scan: 'rk_src_scan', brief: 'rk_src_brief', odd: 'rk_src_odd' };
const _rkSev = s => (typeof SEV_META !== 'undefined' && SEV_META[s]) ? SEV_META[s] : null;
function _rkSevHtml(s){
  const m = _rkSev(s);
  return `<span class="rk-sev is-${_rkE(s)}">${_rkE(m ? m.label : s)}</span>`;
}
/* ONLY A NEW CLAUSE IS DRAFTED IN THE CARD (one door for edits): changing a
   clause on the paper is Edit with Copilot's. And never at or after the
   signatures. */
function _rkRowHtml(c, it){
  return `<div class="rk-row is-${_rkE(it.sev)}" data-rk-key="${_rkE(it.key)}">
    <div class="rk-top"><b class="rk-t">${_rkE(it.title)}</b>${_rkSevHtml(it.sev)}</div>
    <div class="rk-m">${_rkE(_rkT(RK_SRC_KEY[it.src]))}</div>
    <div class="rk-acts">
      <button type="button" class="ui-link" data-rk-act="note">${_rkE(_rkT('rk_note'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="dismiss">${_rkE(_rkT('rk_dismiss'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="edit-ce" title="${_rkE(_rkT('rk_edit_ce_title'))}">${_rkE(_rkT('rk_edit_ce'))}</button>
    </div></div>`;
}
/* COVERED BY YOUR REDLINES: the fold under the list, each line naming what
   covers it and going there. Counted nowhere. Per sitting, open or shut. */
function _rkCoveredHtml(c, list){
  if (!list.length) return '';
  const open = !!_rk.showCovered[String(c.id)];
  const line = it => {
    const cv = it.covered || {};
    const by = _rkT('rk_cov_by', { id: cv.id, clause: (typeof clauseNameShown === 'function' ? clauseNameShown(cv.clause) : cv.clause) || _rkT('ng_this_clause') })
      + (cv.std ? _rkT('rk_cov_from_std') : '');
    return `<div class="rk-row is-covered" data-rk-key="${_rkE(it.key)}">
      <div class="rk-top"><span class="rk-t">${_rkE(it.title)}</span><span class="rk-cov">${_rkE(_rkT('rk_covered'))}</span></div>
      <div class="rk-m">${_rkE(by)}</div>
      ${cv.clauseId ? `<div class="rk-acts"><button type="button" class="ui-link" data-rk-act="cov-go" data-rk-clause="${_rkE(cv.clauseId)}">${_rkE(_rkT('rk_cov_go', { id: cv.id }))}</button></div>` : ''}
    </div>`;
  };
  return `<button type="button" class="ui-link rk-cov-t" data-rk-act="covered" aria-expanded="${open}">${_rkE(_rkT('rk_covered_h', { n: list.length }))}<span aria-hidden="true">${open ? ' ▴' : ' ▾'}</span></button>
    ${open ? list.map(line).join('') : ''}`;
}
function rlRisksPileHtml(c, opts = {}){
  if (!riskMayAct(c, opts)) return '';
  /* A READING IS NOT A WORKING POSTURE: the Negotiate page's "proposed" or
     "agreed" reading draws no list, as it draws no verbs. */
  try{ if (typeof rlReadOnlyReading === 'function' && rlReadOnlyReading()) return ''; }catch(_){}
  _rk.opts = { side: opts.side, preview: opts.preview, readonly: opts.readonly };
  const all = riskItemsOf(c);
  const open = all.filter(it => !it.dismissed && !it.drafted && !it.covered);
  const covered = all.filter(it => it.covered);
  const gone = all.filter(it => it.dismissed);
  const showGone = !!_rk.showDismissed[String(c.id)];
  /* NO SCAN YET: one row that runs it — the scan is free (rule-based). */
  if (!c.scan){
    return `<div class="rk-pile" id="rl-risks">
      <div class="rk-h"><b>${_rkE(_rkT('rk_title'))}</b></div>
      <div class="rk-row is-none"><div class="rk-top"><span>${_rkE(_rkT('rk_none_run'))}</span>
        <button type="button" class="ui-btn ui-btn-sm" data-rk-act="run">${_rkE(_rkT('rk_run'))}</button></div></div>
    </div>`;
  }
  /* THE LIST GOES AWAY AT ZERO — unless something was dismissed, which keeps
     the one way back to it. */
  if (!open.length && !gone.length && !covered.length) return '';
  const when = c.scan.at ? `<span class="rk-when">${_rkE(_rkT('rk_scanned', { when: c.scan.at }))} · <button type="button" class="ui-link" data-rk-act="rescan">${_rkE(_rkT('rk_rescan'))}</button></span>` : '';
  return `<div class="rk-pile" id="rl-risks">
    <div class="rk-h"><b>${_rkE(_rkT('rk_head', { n: open.length }))}</b>${when}</div>
    ${open.map(it => _rkRowHtml(c, it)).join('')}
    ${_rkCoveredHtml(c, covered)}
    ${gone.length ? `<button type="button" class="ui-link rk-gone-t" data-rk-act="gone">${_rkE(showGone
      ? _rkT('rk_hide_dismissed') : _rkT('rk_show_dismissed', { n: gone.length }))}</button>` : ''}
    ${showGone ? gone.map(it => `<div class="rk-row is-gone" data-rk-key="${_rkE(it.key)}">
      <div class="rk-top"><span class="rk-t">${_rkE(it.title)}</span>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="back">${_rkE(_rkT('rk_bring_back'))}</button></div></div>`).join('') : ''}
  </div>`;
}

/* ================= RISK VIEW: THE ONE DOOR UNDER A MARK ================= */
function riskMarkFootHtml(c, m){
  if (!c || !m || !['scan', 'brief', 'odd'].includes(m.k)) return '';
  if (!riskMayAct(c, {})) return '';
  const key = m.k === 'scan' ? riskKeyOf('scan', m.id) : riskKeyOf(m.k, m.say);
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it || it.dismissed) return '';
  if (it.drafted) return `<span class="doc-xr-rk"><span class="rk-done">${_rkE(_rkT('rk_drafted'))}</span></span>`;
  /* ONE DOOR FOR EDITS: Risk View reads; editing happens on Negotiate, in
     Edit with Copilot. Its only act is the note. */
  return `<span class="doc-xr-rk">
    <button type="button" class="ui-link" data-rk-note="${_rkE(key)}">${_rkE(_rkT('rk_note'))}</button></span>`;
}

/* ================= THE DRESSING, PUBLISHED ONCE =================
   Tokens only: both homes (the Redlines column and Risk View) live inside the
   product's own page, where :root is defined. The paper is never touched —
   the list sits under the column's own rows and Risk View's marks. */
function rkEnsureStyle(){
  if (typeof document === 'undefined' || !document.head || document.getElementById('rk-style')) return;
  const st = document.createElement('style');
  st.id = 'rk-style';
  st.textContent = `
  .rk-pile{display:grid;gap:8px;margin:12px 16px 16px;padding-top:10px;border-top:1px solid var(--color-divider);
    font-family:var(--font-body);font-size:var(--t-meta);color:var(--color-text)}
  .rk-h{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px}
  .rk-h b{font-family:var(--font-heading);font-size:var(--t-label);font-weight:var(--w-strong);
    letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600)}
  .rk-when{font-size:var(--t-micro);color:var(--color-neutral-500)}
  .rk-row{display:grid;gap:4px;border:1px solid var(--color-divider);border-left:3px solid var(--st-amber-dot);
    border-radius:var(--radius);padding:8px 10px;background:var(--color-surface)}
  .rk-row.is-high{border-left-color:var(--st-ruby-dot)}
  .rk-row.is-low{border-left-color:var(--st-steel-dot)}
  .rk-row.is-none,.rk-row.is-gone{border-left-color:var(--color-divider)}
  .rk-row.is-gone .rk-t{color:var(--color-neutral-500)}
  .rk-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .rk-t{font-weight:var(--w-strong);min-width:0}
  .rk-sev{flex:none;font-size:var(--t-micro);font-weight:var(--w-strong);letter-spacing:.06em;text-transform:uppercase}
  .rk-sev.is-high{color:var(--st-ruby-fg)} .rk-sev.is-med{color:var(--st-amber-fg)} .rk-sev.is-low{color:var(--st-steel-fg)}
  .rk-m{font-size:var(--t-micro);color:var(--color-neutral-500);letter-spacing:.04em;text-transform:uppercase}
  .rk-p{margin:0;color:var(--color-neutral-700);line-height:1.5}
  .rk-quiet{color:var(--color-neutral-500)}
  .rk-k{display:block;font-size:var(--t-micro);font-weight:var(--w-strong);letter-spacing:.06em;
    text-transform:uppercase;color:var(--color-neutral-500);margin-top:4px}
  .rk-acts{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px}
  .rk-row .rk-acts .ui-link{margin-right:auto}
  .rk-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;margin-top:4px}
  .rk-cost{font-size:var(--t-micro);color:var(--color-neutral-500)}
  .rk-where{display:grid;gap:2px}
  .rk-sel,.rk-in{width:100%;min-width:0;height:var(--field-h, 28px);font:inherit;font-size:var(--t-meta);
    border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);
    color:var(--color-text);padding:0 6px}
  .rk-busy{display:flex;align-items:center;gap:8px;color:var(--color-neutral-600)}
  .rk-err{color:var(--st-ruby-fg)}
  .rk-gone-t{justify-self:start;font-size:var(--t-meta)}
  .rk-row.is-covered{border-left-color:var(--st-green-dot, var(--color-divider));background:var(--color-bg)}
  .rk-cov{flex:none;font-size:var(--t-micro);font-weight:var(--w-strong);color:var(--st-green-fg)}
  .rk-cov-t{justify-self:start;font-size:var(--t-meta)}
  .rk-ce{display:grid;gap:10px;font-family:var(--font-body);font-size:var(--t-meta);color:var(--color-text)}
  .rk-ce-step{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--t-micro);color:var(--color-neutral-500)}
  .rk-ce-dots{display:flex;flex-wrap:wrap;gap:3px}
  .rk-ce-dots i{width:14px;height:4px;border-radius:2px;background:var(--color-divider)}
  .rk-ce-dots i.is-done{background:var(--st-green-fg)} .rk-ce-dots i.is-now{background:var(--color-accent-600, var(--accent))}
  .rk-ce-card{display:grid;gap:4px;border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:10px 12px;background:var(--color-bg)}
  .rk-ce-end{border:1px solid var(--st-green-fg);border-radius:var(--radius-lg);padding:12px}
  .doc-xr-rk{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px}
  .doc-xr-rk .rk-done{font-size:var(--t-micro);font-weight:var(--w-strong);color:var(--st-green-fg)}
  `;
  document.head.appendChild(st);
}
rkEnsureStyle();

/* ================= PAINT AND PRESS ================= */
function _rkContract(){
  if (typeof getContract !== 'function' || typeof state === 'undefined') return null;
  const id = (typeof redlineHeldId === 'function' && redlineHeldId()) || state.activeId;
  return getContract(id) || null;
}
function rkRepaint(c){
  const host = document.getElementById('rl-risks');
  const cur = _rkContract();
  if (!host || !c || !cur || String(cur.id) !== String(c.id)) return;
  const html = rlRisksPileHtml(c, _rk.opts || {});
  if (!html){ host.remove(); return; }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  host.replaceWith(tmp.firstElementChild);
}
/* After a filing the column above the list has a new row, so the page
   repaints the way its own presses do. */
function rkRepaintAll(c){
  const host = document.getElementById('rl-risks');
  if (host && typeof rlRepaintFrom === 'function' && rlRepaintFrom(host)) return;
  if (typeof renderRedline === 'function' && document.querySelector('.redline-page')) { renderRedline(); return; }
  rkRepaint(c);
}
if (typeof document !== 'undefined' && document.addEventListener && !document._rkWired){
  document._rkWired = true;
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest) return;
    /* RISK VIEW'S ONE DOOR */
    const nt = t.closest('[data-rk-note]');
    if (nt){
      const c = (typeof getContract === 'function' && typeof state !== 'undefined') ? getContract(state.activeId) : null;
      if (!c) return;
      riskNote(c, nt.getAttribute('data-rk-note'));
      return;
    }
    const b = t.closest('[data-rk-act]');
    if (!b || b.disabled || !b.closest('#rl-risks')) return;
    const c = _rkContract();
    if (!c) return;
    const act = b.getAttribute('data-rk-act');
    const rowEl = b.closest('[data-rk-key]');
    const key = rowEl ? rowEl.getAttribute('data-rk-key') : '';
    if (act === 'run' || act === 'rescan'){
      if (typeof runScan !== 'function') return;
      runScan(c);
      const n = (typeof openFindings === 'function') ? openFindings(c).length : 0;
      if (typeof logAudit === 'function') logAudit(c, 'Scanned', `Copilot contract scan run — ${n} open finding${n === 1 ? '' : 's'}`);
      if (typeof persist === 'function') persist(c);
      if (typeof toast === 'function') toast(n ? _rkT('rk_scan_found', { n }) : _rkT('ai_scan_clean'), 'ok');
      rkRepaint(c); return;
    }
    if (act === 'gone'){ const k = String(c.id); _rk.showDismissed[k] = !_rk.showDismissed[k]; rkRepaint(c); return; }
    if (act === 'covered'){ const k = String(c.id); _rk.showCovered[k] = !_rk.showCovered[k]; rkRepaint(c); return; }
    if (act === 'cov-go'){ if (typeof rlJumpToClause === 'function') rlJumpToClause(b.getAttribute('data-rk-clause')); return; }
    if (!key) return;
    if (act === 'dismiss'){ riskDismiss(c, key); rkRepaint(c); return; }
    if (act === 'back'){ riskDismiss(c, key, true); rkRepaint(c); return; }
    if (act === 'note'){ riskNote(c, key); return; }
    if (act === 'edit-ce'){ riskEditStart(c, key); return; }
  });
  /* WHERE A NEW CLAUSE GOES, moved in the Risks tab before it is filed. */
  document.addEventListener('change', e => {
    const sel = e.target && e.target.closest && e.target.closest('#clause-editor [data-ce-rk-where]');
    if (sel && typeof ceSetNewPlace === 'function') ceSetNewPlace(sel.value);
  });
}

Object.assign(window, {
  riskItemsOf, riskOpenOf, riskKeyOf, riskKeyDismissed, riskFromScan, riskDismiss,
  riskNote, riskMayAct, rlRisksPileHtml, riskMarkFootHtml,
  riskCoverOf, riskEditTarget, riskEditStart, riskWalkStep, riskWalkEnd, riskWalkInfo, riskWalkPress, riskFiled,
  riskProvenance, riskSecondRedline, riskEditorDraft, riskEditorArrive, riskLaneHtml, riskAnswerOf, riskChipsHtml, riskWhereHtml,
});
