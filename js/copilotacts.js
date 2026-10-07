/* ============================================================
   COPILOT DOES THE WORK — "COPILOT PREPARES, YOU PRESS"
   (Young, 7 Oct 2026: "Create a proposal for agents doing work like sending
   contracts to colleagues ... by just asking copilot"; then "I should be able
   to type @ and names of people begin to appear and then I can choose a
   person and say send this contract number and add a note"; then "You should
   be able to draft a contract from here as well. Just say what you want and
   the suitable options appear"; then "Build all the ideas".)
   ============================================================
   The Copilot ask box (#igd-input, on the Board and on the Paper) gains:
   - @ — a list of people that narrows as you type; # — the same for contracts.
     A chosen one becomes a name in the box that Copilot never has to guess.
   - SEND: "send #MK-447 to @Jane Mwangi … note: …" answers with a CARD in the
     panel — the contract, the person, the note — and ONE Send button. The
     press is POST /api/contracts/:id/pass (the address is the person's own,
     resolved by the server, never typed); what happened is said honestly
     (sent / in the outbox / refused, with why); a real send writes a History
     line "(asked Copilot)".
   - DRAFT: "draft a supply agreement with Bidco …" answers with what Copilot
     understood and the suitable starting points (see caDraft*).
   READING NEVER SPENDS: both are read here, with no model call. Anything else
   in the box goes on to Copilot exactly as before.
   NOTHING LEAVES THE BUILDING WITHOUT A PRESS: the card prepares; Send sends.
   ============================================================ */

const CA_PICK_MAX = 6;            // rows the @ / # list draws; the rest are narrowed by typing
const CA_NOTE_MAX = 600;          // the note the server keeps (the pass route's own cap)
const CA_SEND_RE = /^\s*(?:please\s+)?(?:send|share|pass|forward|give)\b/i;
const CA_NOTE_RE = /\b(?:note|message|saying|and say|tell (?:him|her|them))\s*[:\-–—]?\s*/i;

/* ---- WHO MAY BE CHOSEN ----
   Colleagues are the workspace's own people (getUsers — the same list the
   negotiation notes tag from), less the reader; the person on the open
   contract's other side is offered too and marked, because sending to the
   other side has its own door (the send screen) — choosing them says so. */
function caPeople(c){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  let users = [];
  try { users = (typeof getUsers === 'function' ? getUsers() : []) || []; } catch (_){ users = []; }
  const out = users.filter(u => u && u.name && (!me || String(u.id) !== String(me.id)))
    .map(u => ({ kind: 'colleague', id: String(u.id), name: String(u.name), email: String(u.email || ''),
      sub: [u.title || u.jobTitle || '', u.role ? ((typeof roleName === 'function') ? roleName(u.role) : u.role) : ''].filter(Boolean)[0] || '' }));
  const cp = c && String(c.counterpartyName || c.counterpartyContact || '').trim();
  if (cp && !out.some(p => p.name.toLowerCase() === cp.toLowerCase()))
    out.push({ kind: 'theirs', id: '', name: cp, email: String(c.counterpartyEmail || ''), sub: String(c.counterparty || '') });
  return out;
}
function caContracts(){
  const cs = (typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(c => c && !c.archived && c.status !== 'Declined');
}
function caRef(c){ return (typeof contractRef === 'function') ? contractRef(c) : (c && c.id) || ''; }
/* The contract the panel is ABOUT, when there is one: the paper that is up. */
function caOpenContract(){
  try {
    const p = (typeof intel !== 'undefined' && intel) ? intel.paper : null;
    return p && typeof getContract === 'function' ? getContract(p.id) || null : null;
  } catch (_){ return null; }
}
const _caE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _caT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;

/* ---- WHAT IS BEING TYPED AFTER @ OR # ----
   The word from the last @ or # before the caret, up to the caret; a name has
   spaces in it, so the query runs to the caret (at most 40 letters). */
function caTokenAt(text, caret){
  const t = String(text || '').slice(0, caret == null ? undefined : caret);
  const m = t.match(/(^|\s)([@#])([^@#\n]{0,40})$/);
  if (!m) return null;
  return { sigil: m[2], q: m[3], start: t.length - m[3].length - 1 };
}
function caMatches(sigil, q, c){
  const t = String(q || '').trim().toLowerCase();
  if (sigil === '@'){
    const all = caPeople(c);
    return all.filter(p => !t || p.name.toLowerCase().split(/\s+/).some(w => w.startsWith(t)) || p.name.toLowerCase().startsWith(t));
  }
  const open = caOpenContract();
  const all = caContracts();
  const hit = all.filter(x => !t || [caRef(x), x.name, x.counterparty].some(v => String(v || '').toLowerCase().includes(t)));
  /* on the Paper, # starts on the contract that is open */
  if (open) hit.sort((a, b) => (b.id === open.id) - (a.id === open.id));
  return hit;
}

/* ---- THE LIST ABOVE THE BOX ---- */
let _caPop = null;   // { sigil, q, start, rows, on }
function caPopHtml(P){
  const rows = P.rows.slice(0, CA_PICK_MAX);
  const head = _caT(P.sigil === '@' ? 'ca_pop_people' : 'ca_pop_contracts', { q: P.q });
  const body = rows.length ? rows.map((r, i) => P.sigil === '@'
    ? `<div class="ca-opt${i === P.on ? ' on' : ''}" role="option" aria-selected="${i === P.on}" data-ca-pick="${i}">
        <span class="av" aria-hidden="true">${_caE(r.name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase())}</span>
        <span class="who"><b>${_caE(r.name)}</b><small>${_caE([r.sub, r.email].filter(Boolean).join(' · '))}</small></span>
        <em>${_caE(_caT(r.kind === 'theirs' ? 'ca_on_contract' : 'ca_colleague'))}</em></div>`
    : `<div class="ca-opt${i === P.on ? ' on' : ''}" role="option" aria-selected="${i === P.on}" data-ca-pick="${i}">
        <span class="ref hati-ref">${_caE(caRef(r))}</span>
        <span class="who"><b>${_caE(r.name || '')}</b><small>${_caE([r.counterparty, (typeof statusLabel === 'function') ? statusLabel(r.status) : r.status].filter(Boolean).join(' · '))}</small></span><em></em></div>`).join('')
    : `<p class="ca-none">${_caE(_caT('ca_pop_none'))}</p>`;
  const more = P.rows.length > rows.length ? `<p class="ca-hint">${_caE(_caT('ca_pop_more', { k: rows.length, n: P.rows.length }))}</p>` : '';
  return `<h5>${_caE(head)}</h5><div role="listbox">${body}</div>${more}<p class="ca-hint">${_caE(_caT('ca_pop_keys'))}</p>`;
}
function caPopClose(){
  _caPop = null;
  const el = document.getElementById('ca-pop'); if (el) el.remove();
}
function caPopPaint(inp){
  const dock = document.getElementById('ig-dock'); if (!dock || !_caPop) return;
  let el = document.getElementById('ca-pop');
  if (!el){ el = document.createElement('div'); el.id = 'ca-pop'; el.className = 'ca-pop'; dock.appendChild(el); }
  el.innerHTML = caPopHtml(_caPop);
  /* it sits just above the box, inside the panel, never over the paper */
  const box = inp && inp.parentElement;
  if (box){ const r = box.getBoundingClientRect(), d = dock.getBoundingClientRect(); el.style.bottom = Math.max(8, d.bottom - r.top + 6) + 'px'; }
}
function caPopRead(inp){
  const tok = caTokenAt(inp.value, inp.selectionStart);
  if (!tok){ caPopClose(); return; }
  const rows = caMatches(tok.sigil, tok.q, caOpenContract());
  _caPop = { sigil: tok.sigil, q: tok.q, start: tok.start, rows, on: 0 };
  caPopPaint(inp);
}
/* A choice replaces "@Ja" with "@Jane Mwangi " and remembers who that is. */
const _caChosen = new Map();   // "@Jane Mwangi" / "#MK-447" -> { kind, id, name }
function caChoose(inp, i){
  const P = _caPop; if (!P) return;
  const r = P.rows[i]; if (!r) return;
  const label = P.sigil === '@' ? '@' + r.name : '#' + caRef(r);
  _caChosen.set(label, P.sigil === '@' ? { kind: r.kind, id: r.id, name: r.name } : { kind: 'contract', id: r.id, name: caRef(r) });
  const v = inp.value, caret = inp.selectionStart;
  inp.value = v.slice(0, P.start) + label + ' ' + v.slice(caret);
  const at = P.start + label.length + 1;
  try { inp.setSelectionRange(at, at); inp.focus(); } catch (_){}
  if (typeof chatFieldGrow === 'function') try { chatFieldGrow(inp); } catch (_){}
  caPopClose();
}

/* ---- THE BOX'S KEYS AND WORDS, delegated at module load (the dock is
   rebuilt on every answer; a listener armed once resolves the LIVE box). The
   keydown is CAPTURED so Enter chooses from the list instead of asking. */
if (typeof document !== 'undefined' && !document._caWired){
  document._caWired = true;
  document.addEventListener('input', e => {
    const t = e.target; if (!t || t.id !== 'igd-input') return;
    if (!String(t.value || '').trim()) _caChosen.clear();
    caPopRead(t);
  });
  document.addEventListener('keydown', e => {
    const t = e.target; if (!t || t.id !== 'igd-input' || !_caPop) return;
    const n = Math.min(_caPop.rows.length, CA_PICK_MAX);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      if (!n) return;
      e.preventDefault(); e.stopPropagation();
      _caPop.on = (_caPop.on + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; caPopPaint(t); return;
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && n){ e.preventDefault(); e.stopPropagation(); caChoose(t, _caPop.on); return; }
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); caPopClose(); }
  }, true);
  document.addEventListener('mousedown', e => {
    const o = e.target && e.target.closest ? e.target.closest('[data-ca-pick]') : null;
    if (o){ e.preventDefault(); const inp = document.getElementById('igd-input'); if (inp) caChoose(inp, Number(o.getAttribute('data-ca-pick'))); return; }
    if (_caPop && !(e.target && e.target.closest && e.target.closest('#ca-pop, #igd-input'))) caPopClose();
  });
  /* the card's presses, read off the element at press time */
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-ca-act]') : null; if (!b) return;
    e.preventDefault();
    caCardPress(Number(b.getAttribute('data-ca-turn')), b.getAttribute('data-ca-act'), b);
  });
}

/* ---- READING WHAT WAS ASKED (no model) ----
   SEND: a send verb, a chosen colleague, and a contract (a chosen #, a typed
   reference, or the paper that is up). The note is what follows "note:" (or
   "saying", "message"); "for review" is kept as the purpose. */
function caFindContract(q){
  for (const [label, v] of _caChosen) if (v.kind === 'contract' && q.includes(label)){ const c = (typeof getContract === 'function') ? getContract(v.id) : null; if (c) return c; }
  const m = String(q).match(/\b([A-Z]{2,4}-[A-Z0-9]+)\b/);
  if (m){ const c = caContracts().find(x => caRef(x).toUpperCase() === m[1].toUpperCase() || String(x.id).toUpperCase() === m[1].toUpperCase()); if (c) return c; }
  return caOpenContract();
}
function caFindPerson(q){
  for (const [label, v] of _caChosen) if ((v.kind === 'colleague' || v.kind === 'theirs') && q.includes(label)) return v;
  /* an @Name typed in full without choosing it from the list still counts —
     but only when it names exactly one person */
  const m = String(q).match(/@([A-Za-zÀ-ÿ'’.\- ]{2,40})/);
  if (!m) return null;
  const words = m[1].trim().toLowerCase();
  const hits = caPeople(caOpenContract()).filter(p => words.startsWith(p.name.toLowerCase()) || p.name.toLowerCase() === words);
  return hits.length === 1 ? { kind: hits[0].kind, id: hits[0].id, name: hits[0].name } : null;
}
function caNoteOf(q){
  const m = String(q).match(CA_NOTE_RE);
  if (!m) return '';
  return String(q).slice(m.index + m[0].length).trim().replace(/^["“]|["”]$/g, '').slice(0, CA_NOTE_MAX);
}
function caReadSend(q){
  if (!CA_SEND_RE.test(q) || !/@/.test(q)) return null;
  const person = caFindPerson(q);
  const c = caFindContract(q);
  return { kind: 'send', person, cid: c ? c.id : null, note: caNoteOf(q), review: /\breview\b/i.test(q), state: 'ready' };
}
/* THE ONE ENTRY intelAsk calls before anything else: an act Copilot can
   prepare from the words alone, or null (and the question goes on as before). */
function caActOf(q){
  const t = String(q || '').trim(); if (!t) return null;
  const send = caReadSend(t); if (send) return send;
  if (typeof caReadDraft === 'function'){ const d = caReadDraft(t); if (d){ setTimeout(() => { caDraftRun(d); }, 0); return d; } }
  return null;
}

/* ---- THE SEND CARD ---- */
function caSendBlock(a){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (!a.person) return { why: _caT('ca_send_who'), fix: '' };
  if (!c) return { why: _caT('ca_send_which'), fix: '' };
  if (a.person.kind === 'theirs') return { why: _caT('ca_send_theirs', { who: a.person.name }), fix: 'sendscreen' };
  if (typeof canEdit === 'function' && !canEdit()) return { why: _caT('ca_send_viewer'), fix: '' };
  return null;
}
function caCardHtml(a, i){
  if (!a || !Number.isInteger(i)) return '';
  if (a.kind === 'draft' && typeof caDraftCardHtml === 'function') return caDraftCardHtml(a, i);
  if (a.kind !== 'send') return '';
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const B = (act, label, cls) => `<button type="button" class="ui-btn ui-btn-sm${cls === 'lead' ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  const blocked = caSendBlock(a);
  const rows = [
    c ? [_caT('ca_l_contract'), `${caRef(c)} · ${c.name || ''}`] : null,
    a.person ? [_caT('ca_l_to'), a.person.name] : null,
    [_caT('ca_l_note'), a.note ? `“${a.note}”` : _caT('ca_no_note')],
    (!blocked && a.person && a.person.kind === 'colleague') ? [_caT('ca_l_gets'), _caT('ca_gets')] : null,
  ].filter(Boolean);
  const dl = `<dl class="ca-dl">${rows.map(([k, v]) => `<dt>${_caE(k)}</dt><dd>${_caE(v)}</dd>`).join('')}</dl>`;
  const title = _caT(a.review ? 'ca_send_title_review' : 'ca_send_title');
  let foot = '', acts = '';
  if (a.state === 'sent') foot = `<p class="ca-said is-ok">${_caE(_caT('ca_sent', { who: a.person.name }))}</p>`;
  else if (a.state === 'outbox') foot = `<p class="ca-said is-warn">${_caE(_caT('ca_outbox', { who: a.person.name }))}</p>`;
  else if (a.state === 'failed') foot = `<p class="ca-said is-bad">${_caE(a.why || _caT('ca_failed'))}</p>`;
  else if (a.state === 'sending') acts = `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" disabled aria-disabled="true">${_caE(_caT('ca_sending'))}</button>`;
  else if (blocked){
    foot = `<p class="ca-why">${_caE(blocked.why)}</p>`;
    acts = blocked.fix === 'sendscreen' ? B('sendscreen', _caT('ca_a_sendscreen'), 'lead') : '';
  } else acts = B('send', _caT('ca_a_send'), 'lead') + B('note', _caT(a.note ? 'ca_a_note_change' : 'ca_a_note_add'), '')
    + (c ? B('sendscreen', _caT('ca_a_sendscreen'), '') : '');
  return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(title)}${blocked && a.state === 'ready' ? ` <span class="hb-chip is-warn">${_caE(_caT('ca_cannot_yet'))}</span>` : ''}</div>
    ${dl}${acts ? `<div class="ca-acts">${acts}</div>` : ''}${foot}
    ${a.state === 'ready' && !blocked ? `<p class="ca-foot">${_caE(_caT('ca_send_foot'))}</p>` : ''}</div>`;
}
function caTurn(i){ try { return intel.history[i] || null; } catch (_){ return null; } }
async function caCardPress(i, act, btn){
  const m = caTurn(i); const a = m && m.act; if (!a) return;
  if (a.kind === 'draft' && typeof caDraftPress === 'function') return caDraftPress(i, act, btn);
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (act === 'sendscreen'){ if (c && typeof openShareModal === 'function') openShareModal(c); return; }
  if (act === 'note'){
    if (typeof promptDialog !== 'function') return;
    const v = await promptDialog({ title: _caT('ca_note_title'), message: _caT('ca_note_msg', { who: a.person ? a.person.name : '' }), value: a.note || '', multiline: true });
    if (v == null) return;
    a.note = String(v).trim().slice(0, CA_NOTE_MAX);
    if (typeof renderIntelDock === 'function') renderIntelDock();
    return;
  }
  if (act !== 'send' || a.state !== 'ready' || caSendBlock(a) || !c) return;
  a.state = 'sending'; if (typeof renderIntelDock === 'function') renderIntelDock();
  let r = null;
  try { r = await api('contracts/' + encodeURIComponent(c.id) + '/pass', 'POST', { memberId: a.person.id, note: a.note || '' }); }
  catch (e){ a.state = 'failed'; a.why = (e && e.message) || String(e); if (typeof renderIntelDock === 'function') renderIntelDock(); if (typeof toast === 'function') toast(a.why, 'err'); return; }
  if (!r || !r.told){ a.state = 'failed'; a.why = _caT(r && r.why === 'no-address' ? 'ca_no_address' : 'ca_failed', { who: a.person.name }); }
  else if (r.emailSent){ a.state = 'sent'; }
  else { a.state = r.emailConfigured ? 'failed' : 'outbox'; if (r.emailConfigured) a.why = r.emailError || _caT('ca_failed'); }
  /* A REAL SEND IS WRITTEN IN THE CONTRACT'S HISTORY, and says it was asked of
     Copilot; a refused one writes nothing. The outbox is a real send that is
     waiting for email to be set up, so it is written too. */
  if ((a.state === 'sent' || a.state === 'outbox') && typeof logAudit === 'function'){
    logAudit(c, 'Sent to a colleague', _caT('ca_audit', { who: a.person.name, note: a.note ? ` — “${a.note}”` : '' }));
    if (typeof persist === 'function') try { persist(c); } catch (_){}
  }
  if (typeof toast === 'function') toast(a.state === 'sent' ? _caT('ca_sent', { who: a.person.name }) : a.state === 'outbox' ? _caT('ca_outbox', { who: a.person.name }) : a.why, a.state === 'sent' ? 'ok' : a.state === 'outbox' ? 'warn' : 'err');
  if (typeof renderIntelDock === 'function') renderIntelDock();
}

/* ============================================================
   DRAFT FROM THE ASK BOX (Young, 7 Oct 2026: "You should be able to draft a
   contract from here as well. Just say what you want and the suitable
   options appear")
   ============================================================
   THE ONE DRAFT DOOR, ASKED FROM HERE: draftCandidates (company standards
   first, then saved, then HaTi's own — DRAFT_BUCKETS), POST /api/ai/draft for
   the best fit and the boxes the sentence answers, and draftHandOff, which
   opens the existing creation form pre-filled. NOTHING IS MINTED HERE: Create
   is still the person's press on the product's own form (f270's rule).
   THE OTHER OPTIONS are the next-closest of our own paper by the words they
   share with the sentence — a reading, not a guess — and "None of these" sends
   the sentence to Requests as its own record. No key: the options are matched
   by name alone and the card says so. */
const CA_DRAFT_RE = /^\s*(?:please\s+)?(?:draft|create|write|prepare|make|start|set up|draw up)\b/i;
const CA_DRAFT_NOUN = /\b(agreement|contract|nda|non-?disclosure|lease|licen[cs]e|mou|memorandum|terms|deed|order|sow|statement of work|addendum|amendment)\b/i;
const CA_DRAFT_OPTS = 3;
function caReadDraft(q){
  if (!CA_DRAFT_RE.test(q) || !CA_DRAFT_NOUN.test(q)) return null;
  if (typeof draftCandidates !== 'function') return null;
  return { kind: 'draft', sentence: String(q).slice(0, (typeof DRAFT_SENTENCE_MAX === 'number') ? DRAFT_SENTENCE_MAX : 2000), state: 'reading', options: null, prefill: {}, why: '', ai: false };
}
/* How many of the sentence's words a candidate's name and purpose share. */
function caDraftScore(sentence, cand){
  const words = s => String(s || '').toLowerCase().split(/[^a-z0-9à-ÿ]+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'agreement', 'contract'].includes(w));
  const said = new Set(words(sentence));
  return words(cand.name + ' ' + cand.blurb).reduce((n, w) => n + (said.has(w) ? 1 : 0), 0);
}
function caDraftRank(sentence, cands, bestId){
  const scored = cands.map((c, i) => ({ c, i, n: caDraftScore(sentence, c) }));
  scored.sort((a, b) => (b.c.id === bestId) - (a.c.id === bestId) || b.n - a.n || a.i - b.i);
  return scored.filter((x, k) => k === 0 || x.n > 0 || x.c.id === bestId).slice(0, CA_DRAFT_OPTS).map(x => x.c);
}
async function caDraftRun(a){
  const paint = () => { if (typeof renderIntelDock === 'function') renderIntelDock(); };
  try { if (typeof tplLibReady === 'function') await tplLibReady(); } catch (_){}
  let cands = [];
  try { cands = draftCandidates() || []; } catch (_){ cands = []; }
  if (!cands.length){ a.state = 'none'; a.why = _caT('wz_no_templates_role'); paint(); return; }
  a.all = cands;
  let best = null;
  if (typeof draftAiReady === 'function' && draftAiReady() && typeof api === 'function'){
    try {
      const r = await api('ai/draft', 'POST', { sentence: a.sentence, candidates: cands.map(c => ({ id: c.id, name: c.name, blurb: c.blurb, fields: c.fields, kind: c.kind })) });
      best = cands.find(c => c.id === (r && r.templateId)) || null;
      a.ai = true;
      a.why = String((r && r.why) || '');
      if (best){
        const keys = new Set(best.fields.map(f => f.key));
        for (const f of (Array.isArray(r.fields) ? r.fields : []))
          if (f && keys.has(f.key) && String(f.value || '').trim()) a.prefill[f.key] = String(f.value).trim();
      }
    } catch (e){ a.aiError = (e && e.message) ? String(e.message) : _caT('dr_failed'); }
  }
  a.options = caDraftRank(a.sentence, cands, best ? best.id : null);
  a.bestId = best ? best.id : null;
  a.state = a.options.length ? 'ready' : 'none';
  paint();
}
function caDraftCardHtml(a, i){
  const B = (act, label, lead, extra) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}"${extra || ''}>${_caE(label)}</button>`;
  if (a.state === 'reading') return `<div class="ca-card"><p class="ca-foot" style="margin:0">${_caE(_caT('ca_draft_reading'))}</p></div>`;
  const best = (a.options || []).find(o => o.id === a.bestId) || null;
  const understood = best ? best.fields.filter(f => a.prefill[f.key]).map(f => [String(f.label || f.key), a.prefill[f.key]]) : [];
  const und = understood.length
    ? `<div class="ca-ct">${_caE(_caT('ca_draft_understood'))}</div><dl class="ca-dl">${understood.map(([k, v]) => `<dt>${_caE(k)}</dt><dd>${_caE(v)}</dd>`).join('')}</dl>`
    : '';
  const opts = (a.options || []).map((o, k) => `<div class="ca-opt-card${o.id === a.bestId ? ' is-best' : ''}">
      <div class="ca-oc-h"><b>${_caE(o.name)}</b>${o.id === a.bestId ? ` <span class="hb-chip">${_caE(_caT('ca_draft_best'))}</span>` : ''}</div>
      ${o.blurb ? `<p>${_caE(o.blurb)}</p>` : ''}
      <div class="ca-oc-f"><small>${_caE((typeof draftBucketLabel === 'function' ? draftBucketLabel(o.kind) : '') || '')}</small>${B('use', _caT('ca_draft_use'), o.id === a.bestId || (!a.bestId && k === 0), ` data-ca-opt="${_caE(o.id)}"`)}</div></div>`).join('');
  const note = !a.ai ? `<p class="ca-foot">${_caE(a.aiError || _caT('ca_draft_no_ai'))}</p>`
    : (a.why ? `<p class="ca-foot">${_caE(a.why)}</p>` : '');
  const none = (typeof openIntakeForm === 'function') ? `<p class="ca-foot">${_caE(_caT('ca_draft_none_fit'))} ${B('request', _caT('ca_draft_request'), false)}</p>` : '';
  return `<div class="ca-card" data-ca-card="${i}">${und}
    <div class="ca-ct">${_caE(_caT(a.state === 'none' ? 'ca_draft_nothing' : 'ca_draft_options'))}</div>${opts}${note}${none}
    <p class="ca-foot">${_caE(_caT('ca_draft_foot'))}</p></div>`;
}
function caDraftPress(i, act, btn){
  const m = caTurn(i); const a = m && m.act; if (!a) return;
  if (act === 'request'){ if (typeof openIntakeForm === 'function') openIntakeForm({ need: a.sentence, title: (typeof intakeTitleFrom === 'function') ? intakeTitleFrom(a.sentence) : '' }); return; }
  if (act !== 'use') return;
  const id = btn && btn.getAttribute('data-ca-opt');
  const pick = (a.options || []).find(o => o.id === id); if (!pick) return;
  /* the values only reach boxes the chosen paper declares (draftApplyPrefill's wall) */
  const prefill = pick.id === a.bestId && typeof draftPrefillFor === 'function' ? draftPrefillFor(pick.fields, a.prefill) : {};
  if (typeof draftHandOff === 'function') draftHandOff(pick, prefill);
}

Object.assign(window, { CA_PICK_MAX, CA_NOTE_MAX, CA_SEND_RE, caPeople, caContracts, caOpenContract, caTokenAt, caMatches, caPopHtml, caPopClose, caPopRead, caChoose,
  caFindContract, caFindPerson, caNoteOf, caReadSend, caActOf, caSendBlock, caCardHtml, caCardPress,
  CA_DRAFT_RE, CA_DRAFT_NOUN, CA_DRAFT_OPTS, caReadDraft, caDraftScore, caDraftRank, caDraftRun, caDraftCardHtml, caDraftPress });
