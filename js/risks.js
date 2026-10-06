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
/* ---- ONLY A RISK THAT NEEDS WORDING GOES IN THE REDLINES CARD (Young,
   5 Oct 2026) ----
   *"any risks that do not require an amendment to the contract or need
   additional language to contract should not be moved to the redline panel"*
   — which replaces the narrower ruling the same morning ("a risk that only
   advises is not a redline", RK_ADVICE_IDS, now STALE). EVERY fixed scan
   rule is marked once here: true where dealing with it means changing or
   adding contract wording; false where it is a step outside the contract
   (have counsel read it, pay the duty, attach the certificate), a box on the
   record or the paper to fill (counterparty, value, deposit, the recital's
   blanks), or simply a fact worth knowing ("Governing law: Sweden (found in
   text)" — your own law; payment terms of 45 days or less; the termination
   notice period). A rule whose meaning turns on its kind is keyed
   `<id>_<kind>`. f510 holds every rule a scanner can write to a mark here, so
   a new rule cannot arrive unmarked. Named by RULE rather than stamped by the
   scanner, because findings are stored as they were at scan time. An
   unmarked id (a retired rule on an old scan) is shown, never guessed away.
   Copilot's own watch-outs and unusual terms carry the same mark from the
   brief (`wording`); a brief written before it carries none and is shown.
   The scan's own list (openFindings) keeps every finding for every other
   reader — the Thread, Insights, the reports. */
const RK_NEEDS_WORDING = {
  'g-cp': false, 'g-val': false, 'g-date': false,
  'rm-mat': false, 'rm-kebs': true, 'rm-index': true, 'rm-sec': true,
  'pk-ip': true, 'pk-moq': true,
  'cm-fs': false, 'cm-recall': true, 'cm-ip': true,
  'eq-eq': false, 'eq-credit': true, 'eq-title': true,
  'wh-temp': true, 'wh-ins': true,
  'ff-reg': false, 'ff-otif': true, 'ff-ins': true,
  'da-credit': true, 'da-excl': true, 'da-perf': true,
  'rl-pay': true, 'rl-listing': true, 'rl-return': true,
  'mk-rebate': true, 'mk-ip': true, 'mk-appr': true,
  'nd-term': true, 'nd-inj': true,
  'le-dep': false, 'le-stamp': false, 'le-esc': true,
  'ps-cap': true, 'ps-indep': true,
  't-law_risk': true, 't-law_ambiguity': false, 't-law_missing': true,
  't-pay_risk': true, 't-pay_ambiguity': false,
  't-renew': true, 't-term': false, 't-liab': true, 't-stamp': true, 't-dp': true,
  'u-cp': false, 'u-val': false, 'u-ocr': false, 'u-noext': false,
  'u-law': false, 'u-liab': false, 'u-term': false, 'u-legal': false,
};
function riskNeedsWording(f){
  if (!f) return false;
  const id = String(f.id || ''), kind = String(f.kind || '');
  const byKind = RK_NEEDS_WORDING[id + '_' + kind];
  if (typeof byKind === 'boolean') return byKind;
  const byId = RK_NEEDS_WORDING[id];
  return typeof byId === 'boolean' ? byId : true;
}
const riskIsAdvice = f => !!f && !riskNeedsWording(f);
const _rkDraftable = f => !!f && !/^g-/.test(String(f.id || '')) && String(f.anchor || '') !== 'recital' && !riskIsAdvice(f);

/* A TOPIC, READ THE WAY THE STANDARDS READ A CLAUSE: the clause kinds Our
   standards already match on (js/clausemodel.js), asked of a risk's title or
   a redline's clause name. null where nothing matches — the safe direction:
   a risk of no known topic is never treated as covered. */
/* ---- AND A FEW MORE TOPICS, FOR RISKS ONLY (Young picked "Find the clause",
   5 Oct 2026) ----
   The six kinds above are Our standards' own and stay exactly as they are; a
   risk also needs to know a quality, insurance, warranty, delivery or
   intellectual-property clause when it sees one ("Product standard not cited"
   found no clause and was offered as a new one). Asked only AFTER the six, so
   nothing the standards already read changes. */
const RK_TOPICS = [
  { key: 'insurance', re: /\b(insur\w*)\b/i },
  { key: 'quality', re: /\b(quality|standards?|certificat\w*|food[- ]safety|inspect\w*|reject\w*|conformity)\b/i },
  { key: 'warranty', re: /\b(warrant(?:y|ies))\b/i },
  { key: 'delivery', re: /\b(deliver\w*|shipment\w*|dispatch\w*|lead[- ]times?|otif)\b/i },
  { key: 'ip', re: /\b(intellectual property|trade ?marks?|copyright|artwork)\b/i },
];
function _rkKind(text){
  const t = String(text || '').trim();
  if (!t) return null;
  let k = null;
  try{ k = (typeof clauseKind === 'function') ? clauseKind({ title: t }) : null; }catch(_){ k = null; }
  if (k) return k;
  const hit = RK_TOPICS.find(x => x.re.test(t));
  return hit ? hit.key : null;
}
const RK_PB_NOTE = /^Playbook — ([^:(]+)/;
/* WHAT A RISK IS ABOUT, ONE READER (Young, 5 Oct 2026, "Risk Card Titles"):
   a brief item now wears Copilot's short title on its card, but its topic,
   its de-duplication, its audit line and its provenance stay on the SENTENCE,
   exactly as before the title existed — a short title loses nothing. A scan
   finding's title was always its topic. */
const _rkTopicText = it => (it && it.src !== 'scan' && it.say) ? it.say : String((it && it.title) || '');
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
  const q = _rkNorm(it.quote), kind = _rkKind(_rkTopicText(it));
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
    const q = _rkNorm(it.quote), t = _rkNorm(_rkTopicText(it));
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
      sev: RK_SEV_RANK[f.sev] ? f.sev : 'med', title: String(f.title || ''), kind: String(f.kind || ''),
      say: String(f.what || ''), why: String(f.why || ''), fix: String(f.fix || ''),
      quote, missing: f.kind === 'missing' && !quote, anchor: f.anchor || '',
      dismissed: dis.includes(f.id) });
  });
  const brief = (src, list, sev) => (list || []).forEach(w => {
    if (w && w.wording === false) return;
    /* The KEY stays the sentence, so every discard, drafted mark and Risk
       View foot stored before titles existed keeps working. An untitled
       (older) brief item keeps today's shape: the sentence is the title. */
    const key = riskKeyOf(src, w.say);
    const name = String(w.title || '').trim();
    take({ key, src, sev, title: name || w.say, say: name ? w.say : '', why: w.why || '', fix: '', quote: w.quote || '',
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
const _rk = { showDismissed: {}, showCovered: {}, opts: null, walk: null, words: {}, advice: {}, explain: {}, busy: '', err: {}, say: {}, spent: {}, whyOpen: {} };

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
   own clause, else the template clause its rule names, else the first clause
   of its topic. With it, our own pending redline on that clause, which the
   edit is written ON TOP of — one redline per clause, never two.
   ---- AND WHERE HaTi CANNOT TELL, THE READER POINTS (Young picked "Find the
   clause" with "You point" behind it, 5 Oct 2026) ----
   A new clause is offered only where HaTi knows one is needed: the risk's
   topic has no clause here, or the scan says the thing is MISSING ("No
   injunctive-relief clause"). Anything else that finds no clause comes back
   `choose`: the window holds the new clause's place, "Which clause is this
   about?" offers every clause to change and every place for a new one, and
   Copilot is asked only once the reader has chosen — never sent off with an
   empty page, which is how "Product standard not cited" ended in a refusal. */
function riskEditTarget(c, it){
  if (!c || !it) return null;
  const cl = riskClauseOf(c, it);
  if (!cl || !cl.clauseId){
    /* NOTHING OF ITS TOPIC IS THERE: a NEW clause, after the last clause
       ahead of the signatures, named from the risk (the reader may move it
       and rename it before saving) — or, where HaTi cannot tell, the same
       place held while the reader chooses. */
    const after = _rkLastTerm(_rkClauses(c));
    if (!after) return null;
    const sure = !!_rkKind(_rkTopicText(it)) || String(it.kind || '') === 'missing';
    return { newClause: true, choose: !sure, afterClauseId: String(after), heading: _rkHeadingFrom(it), label: _rkHeadingFrom(it), clauseId: '', changeId: null };
  }
  return _rkOnClause(c, cl);
}
/* THE CLAUSE A RISK IS ABOUT, ONE READING (5 Oct 2026, "a risk card takes you
   to its clause"): the quote's own clause, else the template clause its rule
   names, else the first clause of its topic ahead of the signatures — or
   null. Edit (riskEditTarget) and the card's press (riskGoClause) both ask
   this, so they always agree. It reads negoClauseList: asked at a PRESS only,
   never while painting. */
function riskClauseOf(c, it){
  if (!c || !it) return null;
  const kind = _rkKind(_rkTopicText(it));
  const cat = (kind && typeof clauseKindByKey === 'function' && clauseKindByKey(kind)) ? clauseKindByKey(kind).category : '';
  let cl = null;
  if (it.quote && typeof rlPbFindClause === 'function'){ try{ cl = rlPbFindClause(c, it.quote, cat); }catch(_){ cl = null; } }
  if (!(cl && cl.clauseId)) cl = _rkAnchorClause(c, it.anchor);
  if (!(cl && cl.clauseId) && kind){
    cl = _rkClauses(c).find(x => { try{ return !_rkIsSigning(x) && _rkKind(x.title || x.headingText) === kind; }catch(_){ return false; } }) || null;
  }
  return (cl && cl.clauseId) ? cl : null;
}
/* The target for an existing clause: its name, and our own pending redline on
   it, which an edit is written on top of. */
function _rkOnClause(c, cl){
  const ch = (Array.isArray(c.changes) ? c.changes : []).find(x => x && String(x.clauseId) === String(cl.clauseId)
    && x.authorSide === 'owner' && !x.withdrawn && x.status === 'pending');
  return { clauseId: String(cl.clauseId), label: _rkClauseName(cl), changeId: ch ? String(ch.id) : null };
}
/* THE TEMPLATE CLAUSE A RULE NAMES (`c1`…`c4`, `s-…`), found by its title on
   the paper as it stands (templateClauseTitles reads the template's own
   tags). A title the negotiation renamed finds nothing — the reader points. */
const _rkHeadNorm = s => String(s || '').toLowerCase().replace(/&amp;/g, '&')
  .replace(/^\W*(?:\d+[.)]?\s*)+/, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
function _rkAnchorClause(c, anchor){
  const a = String(anchor || '');
  if (!/^(c\d+|s-[a-z]+)$/.test(a) || typeof templateClauseTitles !== 'function') return null;
  let titles = null;
  try{ titles = templateClauseTitles(c); }catch(_){ titles = null; }
  const want = _rkHeadNorm(titles && titles[a]);
  if (!want) return null;
  return _rkClauses(c).find(x => !_rkIsSigning(x) && _rkHeadNorm(x.title || x.headingText) === want) || null;
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
/* WAITING ON THE READER: a risk HaTi could not place (riskEditTarget's
   `choose`) until "Which clause is this about?" has been answered. Copilot is
   not asked while it waits. */
const _rkWaiting = (w, key) => !!(w && w.choose && w.choose[key] && !(w.picked && w.picked[key]));
function _rkForget(key){ delete _rk.words[key]; delete _rk.advice[key]; delete _rk.err[key]; delete _rk.say[key]; }
function _rkEditorOpen(c, key, t){
  const w = _rkWalkOf(c); if (!w) return false;
  if (!w.choose) w.choose = {};
  if (!w.picked) w.picked = {};
  if (t.choose){ w.choose[key] = true; w.picked[key] = false; _rkForget(key); }
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
  _rk.walk = { cid: String(c.id), keys, at: keys.indexOf(key), saved: [], skipped: [], newcl: [], key: '', clauseId: '', done: false, choose: {}, picked: {} };
  return _rkEditorOpen(c, key, t);
}
/* A PICK IN THE EDITOR'S DROPDOWN (Young, 6 Oct 2026): straight to that
   risk, the way its card's Edit goes; a walk not yet started starts on it. */
function riskWalkTo(c, key){
  const w = _rkWalkOf(c);
  if (!w || w.done) return riskEditStart(c, key);
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it) return false;
  const t = riskEditTarget(c, it);
  if (!t){ if (typeof toast === 'function') toast(_rkT('ce_no_clause'), 'warn'); return false; }
  if (!w.keys.includes(key)) w.keys.push(key);
  w.at = w.keys.indexOf(key);
  return _rkEditorOpen(c, key, t);
}
/* the severity's own word, as the card prints it */
const riskSevWord = s => { const m = _rkSev(s); return m ? m.label : String(s || ''); };
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
  if (typeof logAudit === 'function') logAudit(c, 'Risk', `Redline drafted from the risk scan in Edit with Copilot — ${_rkTopicText(it).slice(0, 160)} (${ch.id}, not sent)`);
  if (typeof persist === 'function') persist(c);
  const w = _rkWalkOf(c); if (w && !w.saved.includes(key)) w.saved.push(key);
  /* the column behind the window learns where the row came from now, not at
     the next repaint */
  try{ rkRepaintAll(c); }catch(_){}
}
/* PROVENANCE, NEVER A REASON — the same words the card's filing writes. */
const riskProvenance = it => 'Copilot — Risk scan: ' + _rkTopicText(it).slice(0, 200);
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
  if (_rkWaiting(_rkWalkOf(c), key)){ _rk.err[key] = 'pick'; if (typeof ceRenderLane === 'function') ceRenderLane(); return false; }
  if (!ask && _rk.words[key]){ if (typeof ceRenderLane === 'function') ceRenderLane(); return true; }
  if (!(typeof copilotAvailable === 'function' && copilotAvailable()) || typeof copilotPropose !== 'function'){
    _rk.err[key] = 'noai'; if (typeof ceRenderLane === 'function') ceRenderLane(); return false;
  }
  _rk.busy = key; _rk.err[key] = ''; _rk.say[key] = '';
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
  if (err) _rk.err[key] = String((err && err.message) || err);
  else if (!words){
    /* ---- COPILOT ANSWERED WITHOUT WORDING (Young, 5 Oct 2026) ----
       Not a failure to print in red: Copilot said why (usually that it cannot
       tell which wording to change). Its sentence is said quietly, with the
       way forward under it, and "Which clause is this about?" opens on the
       clause in front of the reader so they can point it elsewhere. */
    _rk.say[key] = String((res && res.advice) || _rkT('ce_ask_nothing'));
    const w = _rkWalkOf(c);
    if (w && w.key === key){ if (!w.choose) w.choose = {}; if (!w.picked) w.picked = {}; w.choose[key] = true; w.picked[key] = true; }
  }
  else {
    _rk.words[key] = words; _rk.advice[key] = String((res && res.advice) || '').trim(); _rk.explain[key] = (res && res.explain) || null;
    _rk.spent[key] = (_rk.spent[key] || 0) + 1;
  }
  if (typeof ceRenderLane === 'function') ceRenderLane();
  return !!words;
}
function riskEditorArrive(c, key){
  const w = _rkWalkOf(c);
  if (!w || w.key !== key) return;
  if (_rkWaiting(w, key)){
    /* NEVER SILENT: with no Copilot the choice will not bring one, so the
       window says so at once — the reader chooses the clause and writes. */
    if (!(typeof copilotAvailable === 'function' && copilotAvailable())){
      _rk.err[key] = 'noai'; if (typeof ceRenderLane === 'function') ceRenderLane();
    }
    return;
  }
  riskEditorDraft(c, key, '');
}
/* "WHICH CLAUSE IS THIS ABOUT?" ANSWERED: `chg:<id>` opens the window on that
   clause (on top of our own pending redline there); a clause id is the place a
   new clause goes after — moved in place where one is already held, held
   there otherwise. Then Copilot is asked, once, about the clause chosen. */
function riskWherePick(c, value){
  const w = _rkWalkOf(c);
  const v = String(value || '');
  if (!w || !w.key || !v) return false;
  const key = w.key;
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it) return false;
  const choosing = !!(w.choose && w.choose[key]);
  const first = choosing && !(w.picked && w.picked[key]);
  if (choosing) w.picked[key] = true;
  if (v.startsWith('chg:')){
    const cl = _rkClauses(c).find(x => String(x.clauseId) === v.slice(4));
    if (!cl) return false;
    _rkForget(key);
    return _rkEditorOpen(c, key, _rkOnClause(c, cl));
  }
  if (w.isNew && typeof ceSetNewPlace === 'function'){
    ceSetNewPlace(v);
    if (first){ _rkForget(key); riskEditorDraft(c, key, ''); }
    return true;
  }
  _rkForget(key);
  return _rkEditorOpen(c, key, { newClause: true, afterClauseId: v, heading: _rkHeadingFrom(it), label: _rkHeadingFrom(it), clauseId: '', changeId: null });
}
/* WHAT COPILOT ANSWERED FOR THE RISK IN FRONT OF THE READER, read by the
   editor, which draws it with its own card (the clothes follow the builder). */
function riskAnswerOf(c){
  const w = _rkWalkOf(c);
  if (!w || !w.key || w.done || _rk.busy === w.key) return null;
  const words = _rk.words[w.key];
  return words ? { key: w.key, words, advice: _rk.advice[w.key] || '', explain: _rk.explain[w.key] || null } : null;
}
/* THE RISK'S QUICK ASKS, drawn in the rail's own chips row (the same row the
   clause's questions use), each one Copilot call. */
function riskChipsHtml(c){
  const w = _rkWalkOf(c);
  if (!w || !w.key || w.done) return '';
  const busy = _rk.busy === w.key, noai = _rk.err[w.key] === 'noai', wait = _rkWaiting(w, w.key);
  return Object.keys(RK_ASK_WORD).map(k =>
    `<button type="button" data-ce-rk="ask-${k}" title="${_rkE(_rkT(wait ? 'rk_ce_pick_first' : 'rk_ce_each'))}"${busy || noai || wait ? ' disabled' : ''}>${_rkE(_rkT(RK_ASK_WORD[k]))}</button>`).join('');
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
    : err === 'pick' ? `<p class="rk-p rk-way"><b>${_rkE(_rkT('rk_ce_pick_first'))}</b></p>`
    : err ? `<div class="rk-err">${_rkE(_rkT('rk_failed', { why: err }))}</div>`
    : _rk.say[it.key] ? `<div class="rk-say"><p class="rk-p rk-quiet">${_rkE(_rkT('rk_failed', { why: _rk.say[it.key] }))}</p>`
      + `<p class="rk-p rk-way"><b>${_rkE(_rkT('rk_ce_refused_way'))}</b></p></div>`
    : _rk.spent[it.key] ? `<p class="rk-cost">&#10022; ${_rkE(_rkT(_rk.spent[it.key] === 1 ? 'rk_ce_wrote' : 'rk_ce_wrote_n', { n: _rk.spent[it.key] }))}</p>` : '';
  /* THE RISK'S HEADING, NO BOX (Young, 6 Oct 2026, "one Copilot editor"):
     the short title with the severity word on the right, lined up with the
     text under it; then Why it matters in plain words. The step count and its
     dots are gone — the dropdown above says which risk this is. The whole
     sentence stays on the title's hover. Copilot's two plain parts and the
     Suggested wording card follow (ceRiskAnswerHtml). */
  void dots;
  const why = riskWhyOf(it) || it.say;
  return `<div class="rk-ce" data-rk-key="${_rkE(it.key)}">
    <div class="rk-ce-head"><b class="rk-t" title="${_rkE(_rkTopicText(it))}">${_rkE(riskTitleOf(it))}</b>${_rkSevHtml(it.sev)}</div>
    ${why ? `<p class="rk-p rk-ce-why"><b>${_rkE(_rkT('ai_why_matters'))}</b> ${_rkE(why)}</p>` : ''}
    ${_rkWhereHtml(c)}
    ${say}
  </div>`;
}
/* WHERE A NEW CLAUSE GOES, while it is held and not yet filed: a clause to put
   it after, never at or after the signatures (the window holds the place; the
   select moves it — ceSetNewPlace).
   AND, WHERE HaTi COULD NOT TELL OR COPILOT WROTE NOTHING, "Which clause is
   this about?": the same box offers every clause to CHANGE (`chg:<id>`) and
   every place for a NEW one, with nothing chosen until the reader chooses
   (riskWherePick). Never at or after the signatures, either way. */
function _rkWhereHtml(c){
  const w = _rkWalkOf(c);
  if (!w || !w.key) return '';
  const choosing = !!(w.choose && w.choose[w.key]);
  if (!choosing && !w.isNew) return '';
  if (w.isNew && typeof ceNewPlace !== 'function') return '';
  const picked = !choosing || !!(w.picked && w.picked[w.key]);
  const now = w.isNew ? String(ceNewPlace() || '') : '';
  const clauses = _rkClauses(c);
  const cut = clauses.findIndex(_rkIsSigning);
  const before = cut >= 0 ? clauses.slice(0, cut) : clauses;
  const ph = choosing ? `<option value="" disabled${picked ? '' : ' selected'}>${_rkE(_rkT('rk_choose_ph'))}</option>` : '';
  const chg = choosing ? before.map(cl => `<option value="chg:${_rkE(cl.clauseId)}"${picked && !w.isNew && String(cl.clauseId) === String(w.clauseId) ? ' selected' : ''}>${_rkE(_rkT('rk_change', { clause: _rkClauseName(cl) }))}</option>`).join('') : '';
  const add = before.map(cl => `<option value="${_rkE(cl.clauseId)}"${picked && w.isNew && String(cl.clauseId) === now ? ' selected' : ''}>${_rkE(_rkT('rk_after', { clause: _rkClauseName(cl) }))}</option>`).join('');
  const sign = cut >= 0 ? clauses[cut] : null;
  return `<label class="rk-where"><span class="rk-k">${_rkE(_rkT(choosing ? 'rk_where_which' : 'rk_where'))}</span>
    <select class="rk-sel" data-ce-rk-where${choosing ? ' data-rk-choose="1"' : ''}>${ph}${chg}${add}</select>
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
  const why = riskWhyOf(it);
  /* A Copilot brief item's title IS its long sentence: on the card it is one
     line, and the whole sentence is read when the card opens. */
  const full = _rkTopicText(it), shown = riskTitleOf(it);
  const long = full.trim() !== shown;
  const open = !!_rk.whyOpen[it.key];
  const hasMore = !!(why || long);
  return `<div class="rk-row is-${_rkE(it.sev)}${open ? ' is-open' : ''}" data-rk-key="${_rkE(it.key)}">
    ${_rkHeadHtml(it, `<div class="rk-top"><b class="rk-t" title="${_rkE(full)}">${_rkE(shown)}</b>${_rkSevHtml(it.sev)}</div>
    <div class="rk-m">${_rkE(_rkT(RK_SRC_KEY[it.src]))}</div>`)}
    <div class="rk-verbs">
      <button type="button" class="rk-verb" data-rk-act="note">${_rkMark('chat')}${_rkE(_rkT('rk_note'))}</button>
      <button type="button" class="rk-verb is-no" data-rk-act="dismiss">${_rkMark('bin')}${_rkE(_rkT('ng_discard'))}</button>
      <button type="button" class="rk-verb is-ai" data-rk-act="edit-ce" title="${_rkE(_rkT('rk_edit_ce_title'))}">${_rkMark('edit')}${_rkE(_rkT('rk_edit_ce'))}</button>
      ${hasMore ? `<button type="button" class="rk-why-btn" data-rk-act="why" aria-expanded="${open}" title="${_rkE(_rkT('rk_why_title'))}">${_rkE(_rkT('rk_why_open'))}<svg class="rk-why-i" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></button>` : ''}
    </div>
    ${open && hasMore ? `<div class="rk-why">${long ? `<span class="rk-why-full">${_rkE(full)}</span>` : ''}${why ? `<b>${_rkE(_rkT('ai_why_matters'))}</b><span>${_rkE(why)}</span>` : ''}</div>` : ''}
  </div>`;
}
/* A CARD'S HEAD IS A DOOR TO ITS CLAUSE (Young, 5 Oct 2026: "where possible,
   when I click on a risk card it should take me to the clause being impacted,
   just like in redline cards"). The title line and the source line under it;
   never the verbs, never the opened Why. A risk about something the contract
   does not say has nothing on the paper to show, so its head is not a door. */
const _rkHeadHtml = (it, inner) => (it && it.missing)
  ? `<div class="rk-head">${inner}</div>`
  : `<div class="rk-head is-door" data-rk-act="go" role="button" tabindex="0">${inner}</div>`;
/* ---- WHY IT MATTERS, ALWAYS IN PLAIN ENGLISH (Young, 5 Oct 2026: "make sure
   the why is always in plain english") ----
   A risk-scan finding is a fixed rule whose reason was written for lawyers
   and is STORED with the scan, so an old scan keeps its old words. The card
   therefore reads the rule's plain sentence by its id (and kind, where one id
   has variants) from both books — rk_why_<id>[_<kind>] — and falls back to
   the stored sentence only for a rule the books do not know (f506 holds every
   rule to having one). A Copilot brief item's reason is already written
   plainly: the brief is told to, sentence by sentence. */
/* ---- ONE SHORT TITLE, EVERYWHERE (Young, 6 Oct 2026: "Topic and Problem",
   "Audit costs · could fall on us") ----
   The card, the editor's dropdown and the editor's heading all read this. A
   scan rule has a fixed short title in both books (rk_title_<id>[_<kind>]); a
   Copilot brief item wears Copilot's title, cut at RK_TITLE_WORDS words; an
   older brief with no title is named from the topic HaTi reads in it, with no
   new call. it.title is NOT changed: it stays the record's name (dedupe, cover,
   Edit's lookup, a new clause's heading), and the whole sentence stays on the
   hover and at the top of the opened Why. */
const RK_TITLE_WORDS = 6;
/* a word is a token with a letter or digit in it: the "·" between topic and
   problem is not one */
const _rkCut = t => {
  const w = String(t || '').trim().split(/\s+/).filter(Boolean);
  let n = 0, i = 0;
  for (; i < w.length; i++){ if (/[\p{L}\p{N}]/u.test(w[i])) n++; if (n > RK_TITLE_WORDS) break; }
  return i < w.length ? w.slice(0, i).join(' ') + '…' : w.join(' ');
};
function riskTitleOf(it){
  if (!it) return '';
  if (it.src === 'scan'){
    const base = 'rk_title_' + String(it.id || '').replace(/[^a-z0-9]+/gi, '_');
    for (const k of (it.kind ? [base + '_' + it.kind, base] : [base])){ const t = _rkT(k); if (t && t !== k) return t; }
    return _rkCut(it.title);
  }
  if (it.say) return _rkCut(it.title);
  const k = _rkKind(it.title);
  if (k){ const topic = _rkT('rk_topic_' + k); if (topic && topic !== 'rk_topic_' + k) return topic + ' · ' + _rkT(it.src === 'odd' ? 'rk_problem_odd' : 'rk_problem_watch'); }
  return _rkCut(it.title);
}
function riskWhyOf(it){
  if (!it) return '';
  if (it.src === 'scan'){
    const base = 'rk_why_' + String(it.id || '').replace(/[^a-z0-9]+/gi, '_');
    for (const k of (it.kind ? [base + '_' + it.kind, base] : [base])){
      const t = _rkT(k);
      if (t && t !== k) return t;
    }
  }
  return String(it.why || '').trim();
}
/* THE ROW'S VERBS WEAR THE REDLINES ROW'S CLOTHES (Young, 5 Oct 2026: "the
   risk to look at buttons should resemble the ones from the redlines
   above"): no box, the small rung, the shell's own hairline mark before the
   word, set from the left — the look rlFaceMark and .rl-card-face give
   "Edit" and "Ladder" a few rows up. The words and their order stay. */
const _rkMark = name => `<svg class="rk-verb-i" width="15" height="15" viewBox="0 0 16 16" fill="none"
  stroke="currentColor" stroke-width="1.2" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
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
      ${_rkHeadHtml(cv.clauseId ? it : { missing: true }, `<div class="rk-top"><span class="rk-t" title="${_rkE(_rkTopicText(it))}">${_rkE(riskTitleOf(it))}</span><span class="rk-cov">${_rkE(_rkT('rk_covered'))}</span></div>
      <div class="rk-m">${_rkE(by)}</div>`)}
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
      <div class="rk-top"><span class="rk-t" title="${_rkE(_rkTopicText(it))}">${_rkE(riskTitleOf(it))}</span>
      <button type="button" class="rk-verb" data-rk-act="back">${_rkMark('undo')}${_rkE(_rkT('rk_bring_back'))}</button></div></div>`).join('') : ''}
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
  /* THE CARD TAKES THE COLUMN'S WIDTH, NEVER ITS TITLE'S (Young, 5 Oct 2026,
     "Risk Card Titles"): an automatic grid column let the one-line title set
     the card's minimum width, so one long title stretched every card to
     985px in a 427px list and the column scrolled sideways. */
  .rk-row{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;border:1px solid var(--color-divider);border-left:3px solid var(--st-amber-dot);
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
  .rk-head{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;min-width:0;border-radius:var(--radius)}
  .rk-head.is-door{cursor:pointer}
  .rk-head.is-door:hover .rk-t{text-decoration:underline;text-underline-offset:2px}
  .rk-head.is-door:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
  /* the redline card's own faint ring (.rl-card.is-linked), and no line on the paper */
  .rk-row.is-linked{box-shadow:0 0 0 1px color-mix(in srgb, var(--accent-solid) 34%, transparent)}
  .rk-verbs{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:2px}
  /* EVERY CARD ONE SIZE (Young, 5 Oct 2026): the title on ONE line, its whole
     text on the hover and in the opened card; "Why" at the bottom right,
     under the severity, opens a short plain "Why it matters". */
  .rk-row .rk-top .rk-t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rk-why-btn{margin-left:auto;display:inline-flex;align-items:center;gap:3px;height:var(--ctl-h-sm);
    padding:0 var(--pad-ctl-x-sm);border:0;border-radius:var(--radius);background:transparent;font:inherit;
    font-size:var(--t-meta);font-weight:var(--w-label);line-height:1;color:var(--color-neutral-600);cursor:pointer;white-space:nowrap}
  .rk-why-btn:hover{background:var(--color-neutral-100);color:var(--color-text)}
  .rk-why-i{flex:none;transition:transform var(--dur-1, .15s)}
  .rk-why-btn[aria-expanded="true"] .rk-why-i{transform:rotate(180deg)}
  @media (prefers-reduced-motion:reduce){ .rk-why-i{transition:none} }
  .rk-why{display:grid;gap:2px;margin-top:2px;padding:7px 9px;border-radius:var(--radius);
    background:var(--color-neutral-100);font-size:var(--t-meta);line-height:1.5;color:var(--color-text)}
  .rk-why b{font-size:var(--t-micro);font-weight:var(--w-strong);letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600)}
  .rk-why-full{font-weight:var(--w-label);margin-bottom:3px}
  .rk-verb{display:inline-flex;align-items:center;gap:4px;height:var(--ctl-h-sm);padding:0 var(--pad-ctl-x-sm);
    border:0;border-radius:var(--radius);background:transparent;font:inherit;font-size:var(--t-meta);
    font-weight:var(--w-label);line-height:1;color:var(--accent-ink);cursor:pointer;white-space:nowrap}
  .rk-verb:hover{background:var(--color-accent-100)}
  /* The dismiss act wears the redline row's Discard: the word, the bin, the
     ruby (Young, 5 Oct 2026: "dismiss should actually say discard"). It still
     only sets the risk aside — Bring back returns it. */
  .rk-verb.is-no{color:var(--st-ruby-fg)}
  /* Copilot's own door wears Copilot's violet, as the redline row's Edit does
     (.rl-card-verbs .rl-verb-ai in negotiation-css.js, the same two values). */
  .rk-verb.is-ai{color:#6d28d9}
  html.dark .rk-verb.is-ai{color:#c4b5fd}
  .rk-verb.is-no:hover{background:var(--st-ruby-bg)}
  .rk-verb-i{flex:none;width:var(--btn-ic, 15px);height:var(--btn-ic, 15px)}
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
  .rk-ce-card{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:10px 12px;background:var(--color-bg)}
  .rk-ce-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
  .rk-ce-head .rk-t{min-width:0;font-size:var(--t-body);font-weight:var(--w-strong);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rk-ce-why b{display:block;font-size:var(--t-micro);font-weight:var(--w-strong);letter-spacing:.04em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:2px}
  .rk-ce-end{border:1px solid var(--st-green-fg);border-radius:var(--radius-lg);padding:12px}
  .doc-xr-rk{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px}
  .doc-xr-rk .rk-done{font-size:var(--t-micro);font-weight:var(--w-strong);color:var(--st-green-fg)}
  `;
  document.head.appendChild(st);
}
rkEnsureStyle();

/* ================= A RISK CARD GOES TO ITS CLAUSE =================
   The redline card's own press (rlLinkFocus): the clause comes to the middle
   of the paper, the card wears a faint ring, the paper draws no line. Where
   the risk quotes its words, those words come into view and flash for a
   moment, as "Go to the wording" does. A covered row goes where its own
   "Go to change" link goes. Where HaTi cannot tell, it says so — never a
   silent press. */
function riskGoClause(c, key){
  if (!c || !key || typeof document === 'undefined') return false;
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it || it.missing) return false;
  const page = document.getElementById('view-redline') || document.querySelector('.redline-page.rl-embed');
  let clauseId = (it.covered && it.covered.clauseId) ? String(it.covered.clauseId) : '';
  if (!clauseId){ const cl = riskClauseOf(c, it); clauseId = cl ? String(cl.clauseId) : ''; }
  const q = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
  const el = (page && clauseId) ? page.querySelector('#rl-doc [data-clause="' + q(clauseId) + '"]') : null;
  if (!el){
    if (typeof toast === 'function') toast(_rkT('rk_go_none'), 'warn');
    return false;
  }
  page.querySelectorAll('.is-linked').forEach(n => n.classList.remove('is-linked'));
  const row = document.querySelector('#rl-risks [data-rk-key="' + q(key) + '"]');
  if (row) row.classList.add('is-linked');
  let found = false;
  if (it.quote && typeof scrollToQuote === 'function'){ try{ found = !!scrollToQuote(it.quote, { root: el }); }catch(_){ found = false; } }
  if (!found && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return true;
}

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
    if (act === 'go'){ riskGoClause(c, key); return; }
    if (act === 'why'){ _rk.whyOpen[key] = !_rk.whyOpen[key]; rkRepaint(c); return; }
    if (act === 'dismiss'){ riskDismiss(c, key); rkRepaint(c); return; }
    if (act === 'back'){ riskDismiss(c, key, true); rkRepaint(c); return; }
    if (act === 'note'){ riskNote(c, key); return; }
    if (act === 'edit-ce'){ riskEditStart(c, key); return; }
  });
  /* The head is a door from the keyboard too: Enter and Space do what a
     press does. */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const h = e.target && e.target.closest && e.target.closest('#rl-risks [data-rk-act="go"]');
    if (!h || e.target !== h) return;
    e.preventDefault();
    h.click();
  });
  /* WHERE A NEW CLAUSE GOES, moved in the Risks tab before it is filed. */
  document.addEventListener('change', e => {
    const sel = e.target && e.target.closest && e.target.closest('#clause-editor [data-ce-rk-where]');
    if (!sel) return;
    const c = _rk.walk && typeof getContract === 'function' ? getContract(_rk.walk.cid) : null;
    if (c && riskWherePick(c, sel.value)) return;
    if (typeof ceSetNewPlace === 'function' && !/^chg:/.test(sel.value)) ceSetNewPlace(sel.value);
  });
}

Object.assign(window, { riskTitleOf, riskWalkTo, riskSevWord,
  riskItemsOf, riskOpenOf, riskKeyOf, riskKeyDismissed, riskFromScan, riskDismiss, riskIsAdvice, riskNeedsWording, RK_NEEDS_WORDING,
  riskNote, riskMayAct, rlRisksPileHtml, riskMarkFootHtml,
  riskCoverOf, riskEditTarget, riskClauseOf, riskGoClause, riskEditStart, riskWalkStep, riskWalkEnd, riskWalkInfo, riskWalkPress, riskFiled, riskWherePick,
  riskProvenance, riskSecondRedline, riskEditorDraft, riskEditorArrive, riskLaneHtml, riskAnswerOf, riskChipsHtml, riskWhereHtml, riskWhyOf,
});
