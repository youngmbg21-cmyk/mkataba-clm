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
   · Risk View on the Document tab, whose marks carry "Draft a redline" and
     "Add a note instead" (riskMarkFootHtml) — the draft opens HERE;
   · the Overview's "Risks found" tile and the room's Copilot count.
   Our standards are NOT in it: "Draft from our standards" (rlPrepareRedlines)
   already drafts every gap from those, all at once, as it always has.

   READING MUST NOT WRITE. riskItemsOf reads c.scan, c._brief and c.risks RAW;
   nothing here calls negoClauseList until a person PRESSES something.

   NOTHING IS FILED THAT A PERSON DID NOT READ, AND NOTHING IS SENT. Drafting
   asks Copilot once (copilotPropose, the clause editor's own call) and the
   wording waits in the row. Only "Add to redlines" files it — through
   negoEditClause or negoAddNamedClause, the funnel a person's own edit uses —
   and the change lands unsent like any other.

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
  out.forEach(it => {
    const id = st.drafted[it.key];
    it.drafted = id && live.has(String(id)) ? String(id) : '';
  });
  return out.map((it, i) => ({ it, i }))
    .sort((a, b) => (RK_SEV_RANK[b.it.sev] - RK_SEV_RANK[a.it.sev]) || (a.i - b.i))
    .map(x => x.it);
}
/* WHAT IS STILL WAITING ON SOMEBODY: not dismissed, not already a redline. */
const riskOpenOf = c => riskItemsOf(c).filter(it => !it.dismissed && !it.drafted);
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

/* ================= THE ROW'S SITTING STATE =================
   What a row is showing — open, drafting, the wording Copilot wrote, where it
   would go — is a fact about this sitting, never about the record. Kept per
   contract and per risk; a refresh starts fresh, which costs nothing because
   nothing here was filed. */
const _rk = { rows: {}, showDismissed: {}, want: null, opts: null };
const _rkRow = (c, key) => {
  const k = String(c.id) + '|' + key;
  return _rk.rows[k] || (_rk.rows[k] = { open: false });
};
const _rkForget = (c, key) => { delete _rk.rows[String(c.id) + '|' + key]; };

/* WHERE A RISK'S WORDING WOULD GO, asked at the PRESS (negoClauseList may
   start a negotiation; a draw never calls this). A finding whose words are on
   the paper changes THAT clause; a finding about something missing, or one
   that cannot be placed, becomes a new clause after the last clause ahead of
   the signatures — the playbook's own rule for a new clause. */
function _rkClauses(c){
  try{ return (typeof negoClauseList === 'function') ? (negoClauseList(c) || []) : []; }catch(_){ return []; }
}
function _rkLastTerm(clauses){
  const boiler = cl => /\b(signed for|in witness|witnesseth)\b|signature:\s/i
    .test(String((cl && cl.text) || '') + ' ' + String((cl && cl.headingText) || ''));
  let after = null;
  for (const cl of clauses){ if (boiler(cl)) break; after = cl.clauseId; }
  if (after == null && clauses.length) after = clauses[clauses.length - 1].clauseId;
  return after;
}
function _rkDefaultTarget(c, it){
  const clauses = _rkClauses(c);
  if (it.quote && !it.missing && typeof rlPbFindClause === 'function'){
    try{ const cl = rlPbFindClause(c, it.quote, ''); if (cl && cl.clauseId) return 'e:' + cl.clauseId; }catch(_){}
  }
  const after = _rkLastTerm(clauses);
  return after ? 'a:' + after : 'a:';
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

/* ================= DRAFTING — ONE COPILOT CALL, ON A PRESS ================= */
async function riskDraft(c, key){
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it) return;
  const row = _rkRow(c, key);
  row.open = true;
  if (!row.target) row.target = _rkDefaultTarget(c, it);
  if (row.heading == null) row.heading = _rkHeadingFrom(it);
  row.err = ''; row.editing = false;
  /* NO KEY IS SAID, NEVER SILENT: the row opens on a box to write in. */
  if (!(typeof copilotAvailable === 'function' && copilotAvailable()) || typeof copilotPropose !== 'function'){
    row.noAi = true; row.editing = true; row.words = row.words || ''; row.draftFor = row.target;
    rkRepaint(c); return;
  }
  row.noAi = false;
  row.busy = true;
  rkRepaint(c);
  const target = row.target;
  const editId = target.startsWith('e:') ? target.slice(2) : '';
  let cl = null;
  if (editId){ try{ cl = (typeof negoClauseNowById === 'function') ? negoClauseNowById(c, editId) : null; }catch(_){ cl = null; } }
  let res = null, err = null;
  try{
    res = await copilotPropose({
      ask: _rkT(cl ? 'rk_prompt_edit' : 'rk_prompt_add'),
      passage: cl ? String(cl.text || '') : '',
      instruction: _rkConcern(it),
      clauseLabel: cl ? _rkClauseName(cl) : '',
      party: (typeof contractParty === 'function' ? contractParty(c) : '') || '',
      law: (typeof jxLaw === 'function') ? jxLaw() : '',
    });
  }catch(e){ err = e; }
  row.busy = false;
  const words = String((res && res.proposedText) || '').trim();
  if (err || !words){
    row.err = err ? String((err && err.message) || err) : String((res && res.advice) || _rkT('ce_ask_nothing'));
  } else {
    row.words = words; row.draftFor = target; row.spent = true;
  }
  rkRepaint(c);
}

/* ================= ADD TO REDLINES — THE FUNNEL, AND NOTHING ELSE ================= */
async function riskFile(c, key){
  const it = riskItemsOf(c).find(x => x.key === key);
  const row = _rkRow(c, key);
  if (!it || row.busy) return null;
  const words = String(row.words || '').trim();
  if (!words){ if (typeof toast === 'function') toast(_rkT('rk_empty_words'), 'warn'); return null; }
  if (row.draftFor && row.draftFor !== row.target && !row.editing){
    if (typeof toast === 'function') toast(_rkT('rk_redraft_first'), 'warn'); return null;
  }
  const author = (typeof currentUser === 'function' && currentUser() && currentUser().name) || 'This workspace';
  /* PROVENANCE, NEVER A REASON: "Copilot — …" is what negoReasonOf reads as
     machinery, so the other side is not shown it as "why we asked". */
  const note = 'Copilot — Risk scan: ' + String(it.title || '').slice(0, 200);
  let ch = null;
  const bag = { side: 'owner', author, note };
  try{
    if (row.target.startsWith('e:') && typeof negoEditClause === 'function'){
      const body = (typeof negoRichFromLines === 'function') ? negoRichFromLines(words) : `<p>${_rkE(words)}</p>`;
      ch = await negoEditClause(c, row.target.slice(2), body, bag);
    } else {
      const clauses = _rkClauses(c);
      const after = row.target.slice(2) || _rkLastTerm(clauses) || null;
      const typed = String(row.heading || '').trim() || _rkHeadingFrom(it);
      const heading = (typeof clauseHeadingFor === 'function') ? clauseHeadingFor(typed, clauses) : typed;
      const body = (typeof textToRich === 'function') ? textToRich(words) : `<p>${_rkE(words)}</p>`;
      bag.summary = 'Clause added from the risk scan — ' + String(it.title || '').slice(0, 120);
      ch = (typeof negoAddNamedClause === 'function')
        ? await negoAddNamedClause(c, { headingText: heading, bodyHtml: body, afterClauseId: after }, bag)
        : await negoInsertClause(c, after, { headingText: heading, bodyHtml: body }, bag);
      if (!ch && bag.refused && typeof toast === 'function') toast(bag.refused.message || String(bag.refused), 'err');
    }
  }catch(e){
    if (typeof toast === 'function') toast(String((e && e.message) || e), 'err');
    ch = null;
  }
  if (!ch) return null;
  _rkStoreW(c).drafted[key] = String(ch.id);
  if (typeof logAudit === 'function') logAudit(c, 'Risk', `Redline drafted from the risk scan — ${String(it.title || '').slice(0, 160)} (${ch.id}, not sent)`);
  if (typeof persist === 'function') persist(c);
  _rkForget(c, key);
  if (typeof toast === 'function') toast(_rkT('rk_added'), 'ok');
  rkRepaintAll(c);
  return ch;
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

/* ================= FROM RISK VIEW: GO AND DRAFT IT HERE ================= */
function riskGoDraft(c, key){
  if (!c || !key) return;
  _rk.want = { id: String(c.id), key: String(key) };
  if (typeof roomGoTab === 'function') roomGoTab(c, 'redline');
}
/* Called by the Negotiate page after it paints: a risk somebody pressed in
   Risk View is opened and drafted, and scrolled into view. */
function riskAfterPaint(c){
  const w = _rk.want;
  if (!c || !w || w.id !== String(c.id)) return;
  _rk.want = null;
  const host = document.getElementById('rl-risks');
  if (!host) return;
  const row = _rkRow(c, w.key);
  if (!row.open && !row.words) riskDraft(c, w.key);
  setTimeout(() => {
    const el = document.querySelector(`#rl-risks [data-rk-key="${CSS.escape(w.key)}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, 0);
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
function _rkTargetOptions(c, row){
  const clauses = _rkClauses(c);
  const opt = (v, label) => `<option value="${_rkE(v)}"${row.target === v ? ' selected' : ''}>${_rkE(label)}</option>`;
  const edits = clauses.map(cl => opt('e:' + cl.clauseId, _rkT('rk_change', { clause: _rkClauseName(cl) })));
  const adds = clauses.map(cl => opt('a:' + cl.clauseId, _rkT('rk_after', { clause: _rkClauseName(cl) })));
  return `<optgroup label="${_rkE(_rkT('rk_group_new'))}">${adds.join('')}</optgroup>`
    + `<optgroup label="${_rkE(_rkT('rk_group_change'))}">${edits.join('')}</optgroup>`;
}
function _rkPreviewHtml(c, row){
  const words = String(row.words || '');
  if (row.target && row.target.startsWith('e:')){
    let cl = null;
    try{ cl = (typeof negoClauseNowById === 'function') ? negoClauseNowById(c, row.target.slice(2)) : null; }catch(_){ cl = null; }
    if (cl && typeof redlineOps === 'function' && typeof redlineOpsHtml === 'function'){
      try{ return redlineOpsHtml(redlineOps(String(cl.text || ''), words)); }catch(_){}
    }
    return _rkE(words);
  }
  return `<ins class="hati-ins nego-ins">${_rkE(words)}</ins>`;
}
function _rkOpenRowHtml(c, it, row){
  const isAdd = !String(row.target || '').startsWith('e:');
  const stale = !!(row.words && row.draftFor && row.draftFor !== row.target && !row.editing);
  const detail = [
    it.say ? `<p class="rk-p">${_rkE(it.say)}</p>` : '',
    it.why ? `<p class="rk-p"><b>${_rkE(_rkT('ai_why_matters'))}:</b> ${_rkE(it.why)}</p>` : '',
    it.fix ? `<p class="rk-p"><b>${_rkE(_rkT('ai_suggested_fix'))}:</b> ${_rkE(it.fix)}</p>` : '',
  ].join('');
  let body;
  if (row.busy){
    body = `<div class="rk-busy" aria-busy="true"><span class="ob-spin" aria-hidden="true"></span>${_rkE(_rkT('rk_writing'))}</div>`;
  } else if (row.err){
    body = `<div class="rk-err">${_rkE(_rkT('rk_failed', { why: row.err }))}</div>
      <div class="rk-acts"><button type="button" class="ui-btn ui-btn-sm" data-rk-act="write">${_rkE(_rkT('rk_write_myself'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="draft" title="${_rkE(_rkT('rk_draft_title'))}">${_rkE(_rkT('rk_try_again'))}</button></div>`;
  } else {
    const box = row.editing
      ? `<textarea class="rk-box" data-rk-words rows="6" aria-label="${_rkE(_rkT('rk_your_words'))}">${_rkE(row.words || '')}</textarea>`
      : `<div class="rk-draft">${_rkPreviewHtml(c, row)}</div>`;
    body = `${row.noAi ? `<p class="rk-p rk-quiet">${_rkE(_rkT('rk_no_ai'))}</p>` : ''}
      <div class="rk-k">${_rkE(_rkT(row.editing ? 'rk_your_words' : 'rk_words'))}</div>
      ${box}
      ${stale ? `<div class="rk-acts"><button type="button" class="ui-btn ui-btn-sm" data-rk-act="draft">${_rkE(_rkT('rk_redraft'))}</button></div>` : ''}
      <div class="rk-foot"><span class="rk-cost">${row.spent ? _rkE(_rkT('rk_cost')) : _rkE(_rkT('rk_nothing_sent'))}</span>
        <span class="rk-acts">
          <button type="button" class="ui-btn ui-btn-sm" data-rk-act="close">${_rkE(_rkT('rk_discard'))}</button>
          ${row.noAi ? '' : `<button type="button" class="ui-btn ui-btn-sm" data-rk-act="edit">${_rkE(_rkT(row.editing ? 'rk_show_changes' : 'rk_change_words'))}</button>`}
          <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-rk-act="add"${stale ? ' disabled aria-disabled="true"' : ''}>${_rkE(_rkT('rk_add'))}</button>
        </span></div>`;
  }
  return `<div class="rk-row is-open is-${_rkE(it.sev)}" data-rk-key="${_rkE(it.key)}">
    <div class="rk-top"><b class="rk-t">${_rkE(it.title)}</b>${_rkSevHtml(it.sev)}</div>
    <div class="rk-m">${_rkE(_rkT(RK_SRC_KEY[it.src]))}</div>
    ${detail}
    <label class="rk-where"><span class="rk-k">${_rkE(_rkT('rk_where'))}</span>
      <select class="rk-sel" data-rk-target>${_rkTargetOptions(c, row)}</select></label>
    ${isAdd ? `<label class="rk-where"><span class="rk-k">${_rkE(_rkT('rk_heading'))}</span>
      <input class="rk-in" type="text" data-rk-heading value="${_rkE(row.heading || '')}"></label>` : ''}
    ${body}
  </div>`;
}
function _rkRowHtml(c, it){
  const row = _rkRow(c, it.key);
  if (row.open) return _rkOpenRowHtml(c, it, row);
  return `<div class="rk-row is-${_rkE(it.sev)}" data-rk-key="${_rkE(it.key)}">
    <div class="rk-top"><b class="rk-t">${_rkE(it.title)}</b>${_rkSevHtml(it.sev)}</div>
    <div class="rk-m">${_rkE(_rkT(RK_SRC_KEY[it.src]))}</div>
    <div class="rk-acts">
      <button type="button" class="ui-link" data-rk-act="note">${_rkE(_rkT('rk_note'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="dismiss">${_rkE(_rkT('rk_dismiss'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="draft" title="${_rkE(_rkT('rk_draft_title'))}">${_rkE(_rkT('rk_draft'))}</button>
    </div></div>`;
}
function rlRisksPileHtml(c, opts = {}){
  if (!riskMayAct(c, opts)) return '';
  /* A READING IS NOT A WORKING POSTURE: the Negotiate page's "proposed" or
     "agreed" reading draws no list, as it draws no verbs. */
  try{ if (typeof rlReadOnlyReading === 'function' && rlReadOnlyReading()) return ''; }catch(_){}
  _rk.opts = { side: opts.side, preview: opts.preview, readonly: opts.readonly };
  const all = riskItemsOf(c);
  const open = all.filter(it => !it.dismissed && !it.drafted);
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
  if (!open.length && !gone.length) return '';
  const when = c.scan.at ? `<span class="rk-when">${_rkE(_rkT('rk_scanned', { when: c.scan.at }))} · <button type="button" class="ui-link" data-rk-act="rescan">${_rkE(_rkT('rk_rescan'))}</button></span>` : '';
  return `<div class="rk-pile" id="rl-risks">
    <div class="rk-h"><b>${_rkE(_rkT('rk_head', { n: open.length }))}</b>${when}</div>
    ${open.map(it => _rkRowHtml(c, it)).join('')}
    ${gone.length ? `<button type="button" class="ui-link rk-gone-t" data-rk-act="gone">${_rkE(showGone
      ? _rkT('rk_hide_dismissed') : _rkT('rk_show_dismissed', { n: gone.length }))}</button>` : ''}
    ${showGone ? gone.map(it => `<div class="rk-row is-gone" data-rk-key="${_rkE(it.key)}">
      <div class="rk-top"><span class="rk-t">${_rkE(it.title)}</span>
      <button type="button" class="ui-btn ui-btn-sm" data-rk-act="back">${_rkE(_rkT('rk_bring_back'))}</button></div></div>`).join('') : ''}
  </div>`;
}

/* ================= RISK VIEW: THE TWO DOORS UNDER A MARK ================= */
function riskMarkFootHtml(c, m){
  if (!c || !m || !['scan', 'brief', 'odd'].includes(m.k)) return '';
  if (!riskMayAct(c, {})) return '';
  const key = m.k === 'scan' ? riskKeyOf('scan', m.id) : riskKeyOf(m.k, m.say);
  const it = riskItemsOf(c).find(x => x.key === key);
  if (!it || it.dismissed) return '';
  if (it.drafted) return `<span class="doc-xr-rk"><span class="rk-done">${_rkE(_rkT('rk_drafted'))}</span></span>`;
  return `<span class="doc-xr-rk">
    <button type="button" class="ui-link" data-rk-note="${_rkE(key)}">${_rkE(_rkT('rk_note'))}</button>
    <button type="button" class="ui-btn ui-btn-sm" data-rk-go="${_rkE(key)}" title="${_rkE(_rkT('rk_go_title'))}">${_rkE(_rkT('rk_draft'))}</button></span>`;
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
  .rk-row.is-open{border-color:var(--color-accent-300);box-shadow:0 0 0 2px var(--color-accent-100)}
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
  .rk-draft,.rk-box{font-family:var(--font-doc);font-size:var(--t-body);line-height:1.6;color:var(--color-text);
    border:1px dashed var(--color-accent-300);border-radius:var(--radius);background:var(--color-bg);
    padding:8px 10px;white-space:pre-wrap;overflow-wrap:anywhere}
  .rk-box{width:100%;min-height:120px;resize:vertical;border-style:solid}
  .rk-busy{display:flex;align-items:center;gap:8px;color:var(--color-neutral-600)}
  .rk-err{color:var(--st-ruby-fg)}
  .rk-gone-t{justify-self:start;font-size:var(--t-meta)}
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
function _rkKeep(c, el){
  const rowEl = el && el.closest && el.closest('[data-rk-key]');
  if (!rowEl) return;
  const row = _rkRow(c, rowEl.getAttribute('data-rk-key'));
  const ta = rowEl.querySelector('[data-rk-words]');
  if (ta) row.words = ta.value;
  const h = rowEl.querySelector('[data-rk-heading]');
  if (h) row.heading = h.value;
}
if (typeof document !== 'undefined' && document.addEventListener && !document._rkWired){
  document._rkWired = true;
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest) return;
    /* RISK VIEW'S TWO DOORS */
    const go = t.closest('[data-rk-go]');
    const nt = t.closest('[data-rk-note]');
    if (go || nt){
      const c = (typeof getContract === 'function' && typeof state !== 'undefined') ? getContract(state.activeId) : null;
      if (!c) return;
      if (go) riskGoDraft(c, go.getAttribute('data-rk-go'));
      else riskNote(c, nt.getAttribute('data-rk-note'));
      return;
    }
    const b = t.closest('[data-rk-act]');
    if (!b || b.disabled || !b.closest('#rl-risks')) return;
    const c = _rkContract();
    if (!c) return;
    const act = b.getAttribute('data-rk-act');
    const rowEl = b.closest('[data-rk-key]');
    const key = rowEl ? rowEl.getAttribute('data-rk-key') : '';
    _rkKeep(c, b);
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
    if (!key) return;
    if (act === 'dismiss'){ _rkForget(c, key); riskDismiss(c, key); rkRepaint(c); return; }
    if (act === 'back'){ riskDismiss(c, key, true); rkRepaint(c); return; }
    if (act === 'note'){ riskNote(c, key); return; }
    if (act === 'draft'){ riskDraft(c, key); return; }
    if (act === 'write'){ const row = _rkRow(c, key); row.err = ''; row.editing = true; row.draftFor = row.target; rkRepaint(c); return; }
    if (act === 'close'){ _rkForget(c, key); rkRepaint(c); return; }
    if (act === 'edit'){ const row = _rkRow(c, key); row.editing = !row.editing; if (row.editing) row.draftFor = row.target; rkRepaint(c); return; }
    if (act === 'add'){ riskFile(c, key); return; }
  });
  document.addEventListener('change', e => {
    const sel = e.target && e.target.closest && e.target.closest('#rl-risks [data-rk-target]');
    if (!sel) return;
    const c = _rkContract(); if (!c) return;
    _rkKeep(c, sel);
    const rowEl = sel.closest('[data-rk-key]');
    const row = _rkRow(c, rowEl.getAttribute('data-rk-key'));
    row.target = sel.value;
    /* Written by hand, the words follow wherever they are put; Copilot's
       wording was written for one place and asks again for another. */
    if (row.editing) row.draftFor = row.target;
    rkRepaint(c);
  });
}

Object.assign(window, {
  riskItemsOf, riskOpenOf, riskKeyOf, riskKeyDismissed, riskFromScan, riskDismiss, riskDraft, riskFile,
  riskNote, riskGoDraft, riskAfterPaint, riskMayAct, rlRisksPileHtml, riskMarkFootHtml,
});
