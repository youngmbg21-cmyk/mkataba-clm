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
  const job = caReadJob(t); if (job) return job;
  const door = caReadDoor(t); if (door) return door;
  /* a place word reads only what no older reading takes ("show obligations"
     stays the list card; "obligations" alone goes there) */
  const go = caReadPlace(t); if (go) return go;
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
  if (CA_JOBS.includes(a.kind)) return caJobCardHtml(a, i);
  if (a.kind === 'door') return caDoorCardHtml(a, i);
  if (a.kind === 'go') return caGoCardHtml(a, i);
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
  else if (a.state === 'asked') foot = `<p class="ca-said is-warn">${_caE(_caT('ca_no_address', { who: a.person.name }))}</p>`;
  else if (a.state === 'mailfail') foot = `<p class="ca-said is-warn">${_caE(_caT('ca_mail_failed', { who: a.person.name, why: a.why || '' }))}</p>`;
  else if (a.state === 'failed') foot = `<p class="ca-said is-bad">${_caE(a.why || _caT('ca_failed'))}</p>`;
  else if (a.state === 'sending') acts = `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" disabled aria-disabled="true">${window.busyHtml?busyHtml(_caT('ca_sending')):_caE(_caT('ca_sending'))}</button>`;
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
  if (CA_JOBS.includes(a.kind)) return caJobPress(i, act, btn);
  if (a.kind === 'door') return caDoorPress(i, act);
  if (a.kind === 'go') return caGoPress(a, act);
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
  try { r = await api('contracts/' + encodeURIComponent(c.id) + '/pass', 'POST', { memberId: a.person.id, note: a.note || '', review: !!a.review }); }
  catch (e){ a.state = 'failed'; a.why = (e && e.message) || String(e); if (typeof renderIntelDock === 'function') renderIntelDock(); if (typeof toast === 'function') toast(a.why, 'err'); return; }
  /* A PASS IS A HAND-OFF, AND THE SERVER KEEPS ITS RECORD (8 Oct 2026, the
     nine flow rules 3 and 8): the route opened a `look` question for the
     colleague and wrote the History line itself, whether or not the email
     went. Nothing is written to the record here; what the server wrote is
     taken onto the copy on screen so the trail and the list show it now. */
  if (!r || !r.asked){ a.state = 'failed'; a.why = _caT('ca_failed', { who: a.person.name }); }
  else if (r.emailSent) a.state = 'sent';
  else if (!r.told) a.state = 'asked';
  else if (!r.emailConfigured) a.state = 'outbox';
  else { a.state = 'mailfail'; a.why = r.emailError || ''; }
  const live = (typeof getContract === 'function' && getContract(c.id)) || c;
  if (r && Array.isArray(r.asks)) live.asks = (typeof asksTakeServer === 'function') ? asksTakeServer(live.asks, r.asks) : r.asks;
  if (r && r.audit && Array.isArray(live.audit)) live.audit = live.audit.concat([r.audit]);
  const said = a.state === 'sent' ? _caT('ca_sent', { who: a.person.name })
    : a.state === 'asked' ? _caT('ca_no_address', { who: a.person.name })
    : a.state === 'outbox' ? _caT('ca_outbox', { who: a.person.name })
    : a.state === 'mailfail' ? _caT('ca_mail_failed', { who: a.person.name, why: a.why || '' })
    : a.why;
  if (typeof toast === 'function') toast(said, a.state === 'sent' ? 'ok' : a.state === 'failed' ? 'err' : 'warn');
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

/* ============================================================
   THE PAPER'S JOBS (Young, 7 Oct 2026 — the "one-stop shop" proposals)
   ============================================================
   Three jobs a person can ASK for on a contract — typed, or one press on the
   Paper's prepared asks — each answered with a CARD that names what it will do
   and carries the product's OWN act. Read here, no model call:
   - READY: "get it ready to sign" — signBlockers(c), the ONE list the Sign
     button reads, one row per gap with a door to where it is settled. Read
     LIVE at every paint, so a gap settled elsewhere leaves the card.
   - OBLIG: "find its obligations" — runFindObligations(c): a reading already
     made is offered, not paid for again; nothing is filed for the reader.
   - STD: "draft redlines from our standards" — rlPrepareRedlines(c) on the
     negotiation page, which asks first and sends nothing.
   The contract is a chosen #, a typed reference, or the paper that is up. */
const CA_JOBS = ['ready', 'oblig', 'std', 'obls', 'risks'];
const CA_JOB_RE = {
  ready: /\b(?:ready to sign|ready for signing|ready for signature|what(?:'s| is)? (?:left|stopping|blocking)\b.*\bsign)/i,
  oblig: /\b(?:find|read|pull out|extract)\s+(?:its|the|all|this contract'?s)?\s*obligations\b/i,
  std: /\b(?:draft|prepare|propose|make)\b.*\b(?:redlines?|changes)\b.*\b(?:standards?|playbook)\b|\bdraft from our standards\b/i,
  /* THE PAPER'S OWN LISTS, each row a door onto its words (Young, 8 Oct 2026) */
  obls: /^\s*(?:what|which|show|list|any)\b[^?]*\b(?:obligations?|duties)\b/i,
  risks: /^\s*(?:what|which|show|list|any|are there)\b[^?]*\b(?:risks?|watch[- ]?outs?|red flags?)\b/i,
};
/* A contract named in the ask (# or a reference), or the paper that is UP —
   not one left behind on the map (the lists answer about the paper in view). */
function caNamedOrUp(q){
  for (const [label, v] of _caChosen) if (v.kind === 'contract' && q.includes(label)) return caFindContract(q);
  if (/\b[A-Z]{2,4}-[A-Z0-9]+\b/.test(String(q))) return caFindContract(q);
  return (typeof igPaperUp === 'function' && igPaperUp()) ? caOpenContract() : null;
}
function caReadJob(q){
  const kind = CA_JOBS.find(k => CA_JOB_RE[k].test(q)); if (!kind) return null;
  if (kind === 'obls' || kind === 'risks'){
    const c = caNamedOrUp(q); if (!c) return null;
    return kind === 'risks' ? caRiskList(c) : caObligList(c);
  }
  /* NO CONTRACT, NO CARD: "find obligations due next week" on the Board is
     a question for the board, not a job — it goes on as before. */
  const c = caFindContract(q); if (!c) return null;
  return { kind, cid: c.id, state: 'ready' };
}
/* The rows of a list card and the passages they open: a row with words on
   the paper carries its passage's place in `quotes` (one per distinct passage). */
function caRowsWithQuotes(rows){
  const quotes = [], at = new Map();
  rows.forEach(r => { const t = String(r.quote || '').trim(); if (t.length < 6) { r.qk = -1; return; }
    if (!at.has(t)){ at.set(t, quotes.length); quotes.push({ text: t, ob: !!r.ob }); }
    r.qk = at.get(t); });
  return quotes;
}
/* RISKS: the ONE list (riskItemsOf), open ones first. Nothing recorded yet →
   null, and the question goes to Copilot, whose answer quotes the paper. */
function caRiskList(c){
  const all = (typeof riskItemsOf === 'function') ? riskItemsOf(c) : [];
  if (!all.length) return null;
  const open = all.filter(it => !it.dismissed && !it.drafted && !it.covered);
  const rows = (open.length ? open : all).map(it => ({
    title: (typeof riskTitleOf === 'function') ? riskTitleOf(it) : (it.title || ''),
    why: (typeof riskWhyOf === 'function') ? riskWhyOf(it) : (it.why || ''),
    sev: it.sev || 'med', quote: it.quote || '' }));
  return { kind: 'risks', cid: c.id, state: 'ready', rows, open: open.length, total: all.length, quotes: caRowsWithQuotes(rows) };
}
/* OBLIGATIONS: what is recorded on the contract. Nothing recorded → the find
   card (the existing reading, offered not paid for twice). */
function caObligList(c){
  const obs = Array.isArray(c.obligations) ? c.obligations.filter(Boolean) : [];
  if (!obs.length) return { kind: 'oblig', cid: c.id, state: 'ready' };
  const rows = obs.map(o => ({
    title: String(o.desc || o.title || ''),
    due: (() => { try { const d = (typeof obligationDueSay === 'function') ? obligationDueSay(o, c) : null;
      return d && typeof d === 'object' ? [d.day, d.sub].filter(Boolean).join(' · ') : String(o.due || ''); } catch (_){ return String(o.due || ''); } })(),
    theirs: o.party === 'theirs', done: (typeof obState === 'function' ? obState(o) : o.status) === 'done',
    quote: o.quote || '', ob: true }));
  return { kind: 'obls', cid: c.id, state: 'ready', rows, quotes: caRowsWithQuotes(rows) };
}
/* Where each gap is settled — the room's own tabs and pages, nothing new. */
function caReadyDoor(key){
  if (key === 'negotiation') return 'nego';
  if (key === 'form-fill' || key === 'ho-blanks') return 'contract';
  if (key === 'hold' || key === 'fields' || (typeof READINESS_FIELD_KEYS !== 'undefined' && READINESS_FIELD_KEYS.includes(key))) return 'terms';
  return 'sign';
}
function caJobCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  if (!c) return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_job_' + a.kind))}</div><p class="ca-why">${_caE(_caT('ca_send_which'))}</p></div>`;
  const head = `<dl class="ca-dl"><dt>${_caE(_caT('ca_l_contract'))}</dt><dd>${_caE(caRef(c) + ' · ' + (c.name || ''))}</dd></dl>`;
  if (a.kind === 'risks' || a.kind === 'obls') return caListCardHtml(a, i, c, head);
  if (a.kind === 'ready'){
    const done = /^(Signed|Executed|Active|Expired|Terminated)$/.test(String(c.status || ''));
    const bl = done ? [] : ((typeof signBlockers === 'function') ? signBlockers(c) : []);
    const rows = bl.map((b, k) => `<li class="ca-gap"><span>${_caE(b.label)}</span>${B('gap:' + k, _caT('ca_ready_go_' + caReadyDoor(b.key)), false)}</li>`).join('');
    const title = done ? _caT('ca_ready_signed') : bl.length ? _caT(bl.length === 1 ? 'ca_ready_n_one' : 'ca_ready_n_other', { n: bl.length }) : _caT('ca_ready_none');
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(title)}</div>${head}
      ${rows ? `<ul class="ca-gaps">${rows}</ul>` : ''}
      ${done ? '' : `<div class="ca-acts">${B('gap:sign', _caT('ca_ready_open_sign'), !bl.length)}</div>`}
      <p class="ca-foot">${_caE(_caT('ca_ready_foot'))}</p></div>`;
  }
  const lead = a.kind === 'oblig' ? 'ca_oblig_go' : 'ca_std_go';
  const frozen = a.kind === 'std' && typeof negoExecuted === 'function' && negoExecuted(c);
  return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_job_' + a.kind))}</div>${head}
    <p class="ca-foot" style="margin-top:0">${_caE(_caT(frozen ? 'ca_std_frozen' : 'ca_' + a.kind + '_says'))}</p>
    ${frozen || a.state === 'done' ? '' : `<div class="ca-acts">${B('run', _caT(lead), true)}</div>`}
    ${a.state === 'done' ? `<p class="ca-said is-ok">${_caE(_caT('ca_job_opened'))}</p>` : ''}</div>`;
}
/* A list whose rows are doors: a row with its words on the paper takes the
   reader there (data-ig-cite, the answer chips' own door); a row without says
   so on its hover. */
function caListCardHtml(a, i, c, head){
  const risks = a.kind === 'risks';
  const rows = (a.rows || []).map(r => {
    const door = r.qk >= 0 ? ` data-ig-cite="${i}:${r.qk}" tabindex="0" role="button" title="${_caE(_caT('ca_row_go'))}"` : ` title="${_caE(_caT('ca_row_no_words'))}"`;
    const tag = risks ? `<span class="ca-sev is-${_caE(r.sev)}">${_caE(_caT('ca_sev_' + (r.sev === 'high' ? 'high' : r.sev === 'low' ? 'low' : 'med')))}</span>`
      : `<span class="ca-sev ${r.theirs ? 'is-low' : 'is-med'}">${_caE(_caT(r.theirs ? 'ca_ob_theirs' : 'ca_ob_ours'))}</span>`;
    const sub = risks ? r.why : r.due;
    return `<li class="ca-row${r.qk >= 0 ? ' is-door' : ''}"${door}>${tag}<span class="ca-row-b"><b>${_caE(r.title)}</b>${sub ? `<small>${_caE(sub)}</small>` : ''}</span>${r.qk >= 0 ? '<span class="ca-row-go" aria-hidden="true">›</span>' : ''}</li>`;
  }).join('');
  const n = (a.rows || []).length;
  const title = risks ? _caT(n === 1 ? 'ca_risks_n_one' : 'ca_risks_n_other', { n }) : _caT(n === 1 ? 'ca_obls_n_one' : 'ca_obls_n_other', { n });
  const foot = risks && a.open === 0 ? _caT('ca_risks_all_handled') : _caT('ca_list_foot');
  return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(title)}</div>${head}<ul class="ca-rows">${rows}</ul><p class="ca-foot">${_caE(foot)}</p></div>`;
}
async function caJobPress(i, act, btn){
  const m = caTurn(i); const a = m && m.act; if (!a) return;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  if (a.kind === 'ready' && String(act).startsWith('gap:')){
    const k = act.slice(4);
    const bl = (typeof signBlockers === 'function') ? signBlockers(c) : [];
    const b = k === 'sign' ? null : bl[Number(k)];
    const door = b ? caReadyDoor(b.key) : 'sign';
    if (b && door === 'terms' && typeof openWorkspace === 'function' && typeof focusKeyTerms === 'function'){
      openWorkspace(c.id); try { focusKeyTerms(getContract(c.id), (b.fields && b.fields[0]) || b.key); } catch (_){}
      return;
    }
    if (typeof agGo === 'function') agGo(door, c.id);
    return;
  }
  if (act !== 'run') return;
  if (a.kind === 'oblig'){
    if (typeof runFindObligations !== 'function') return;
    await runFindObligations(c);
  } else if (a.kind === 'std'){
    if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(c.id);
    if (typeof rlPrepareRedlines === 'function'){ const cc = getContract(c.id); setTimeout(() => { try { rlPrepareRedlines(cc); } catch (_){} }, 0); }
  }
  a.state = 'done';
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* ============================================================
   MORE JOBS, EACH ENDING IN ITS OWN DOOR (step 5 of the Home-first build,
   Young 8 Oct 2026: "build all the steps")
   ============================================================
   Read from the words alone (no model, nothing spent). Each card names the
   contract and what ONE press will open; the press opens HaTi's own screen for
   that act — the send screen, the Signing tab's approval card, the hold
   question, the filing rows, the amendment dialog, the negotiation memo, the
   Paper's own tabs, the Negotiate page — and the person decides there (rule
   7). Copilot sends, holds, files and signs nothing by itself, and no second
   form is built for any of it (rule 2). A job that changes the wording or a
   lock opens the Negotiate page (Home first: wording stays there). */
const CA_DOORS = [
  ['sendback', /\b(?:send|hand)\b[^.?!]*\b(?:round|it|this|them|changes)\b[^.?!]*\bback\b|\bsend (?:what is|what's) waiting\b/i],
  ['signlink', /\b(?:send|share|issue)\b[^.?!]*\bfor sign(?:ing|ature)\b|\bsigning link\b/i],
  ['resend', /\b(?:re-?send|send again)\b[^.?!]*\blink\b|\bfresh link\b|\blink\b[^.?!]*\bexpired\b/i],
  ['adviser', /\b(?:share|send|show)\b[^.?!]*\b(?:lawyer|adviser|advisor|counsel)\b/i],
  ['word', /\bword (?:version|file|copy|document)\b|\btracked changes\b/i],
  ['approval', /\b(?:ask|request|get)\b[^.?!]*\bapproval\b|\bremind\b[^.?!]*\bapprov/i],
  ['chase', /^\s*(?:please\s+)?chase\b/i],
  ['done', /\bmark\b[^.?!]*\b(?:done|paid|complete|completed|delivered)\b/i],
  ['hold', /\b(?:put|place)\b[^.?!]*\bon hold\b/i],
  ['refile', /\b(?:move|re-?file)\b[^.?!]*\b(?:stream|folder)\b/i],
  ['amend', /\b(?:make|create|start|draft)\b[^.?!]*\bamendment\b|\bamend (?:it|this|the)\b/i],
  ['memo', /\bstatus (?:note|update|memo|report)\b|\bnegotiation memo\b/i],
  ['open', /\bwhat(?:'s| is)? (?:still )?open\b|\bwhere (?:does|do) (?:the deal|we|it) stand\b/i],
  ['minor', /\baccept\b[^.?!]*\b(?:small|minor|wording)\b/i],
  ['counter', /^\s*(?:please\s+)?counter\b/i],
  ['lock', /\b(?:hand|give|pass)\b[^.?!]*\block\b/i],
];
function caReadDoor(q){
  const hit = CA_DOORS.find(([, re]) => re.test(q)); if (!hit) return null;
  const c = caFindContract(q); if (!c) return null;
  return { kind: 'door', door: hit[0], cid: c.id, state: 'ready' };
}
/* the Signing tab's own approval card (#sa-card): asked and reminded there */
function caRoomSign(c){ if (typeof openWorkspace === 'function') openWorkspace(c.id); if (typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id) || c, 'sign'); } catch (_){} }
const CA_DOOR_GO = {
  sendback: c => (typeof pdSendWaiting === 'function') ? pdSendWaiting(c) : (typeof openRedlineWorkbench === 'function' && openRedlineWorkbench(c.id)),
  signlink: c => openShareModal(c, { purpose: 'sign' }),
  resend: c => openShareModal(c, { purpose: 'negotiate' }),
  adviser: c => openShareModal(c, { purpose: 'advise' }),
  word: c => openShareModal(c, { purpose: 'negotiate' }),
  approval: c => caRoomSign(c),
  chase: c => pdOpenOnHome(c.id, 'oblig'),
  done: c => pdOpenOnHome(c.id, 'oblig'),
  hold: async c => {
    if (typeof contractSetHold !== 'function' || typeof promptDialog !== 'function') return false;
    const why = await promptDialog({ title: _caT('hd_ask_title'), message: _caT('hd_ask_msg'), placeholder: _caT('hd_ask_ph'), confirmLabel: _caT('hd_hold'), multiline: true });
    if (why == null) return false;
    return contractSetHold(getContract(c.id) || c, true, why);
  },
  refile: c => { if (typeof openWorkspace === 'function') openWorkspace(c.id); if (typeof ovOpenFiling === 'function') ovOpenFiling(getContract(c.id) || c); },
  amend: c => openCreateAmendmentModal(getContract(c.id) || c),
  memo: c => openNegoMemo(getContract(c.id) || c),
  open: c => hbOpenView(c.id, 'deal'),
  minor: c => hbOpenView(c.id, 'deal'),
  counter: c => openRedlineWorkbench(c.id),
  lock: c => openRedlineWorkbench(c.id),
};
/* the function each door needs, so a stage that does not load it greys the card in words */
const CA_DOOR_NEEDS = { sendback: 'openRedlineWorkbench', signlink: 'openShareModal', resend: 'openShareModal', adviser: 'openShareModal', word: 'openShareModal',
  approval: 'openWorkspace', chase: 'pdOpenOnHome', done: 'pdOpenOnHome', hold: 'contractSetHold', refile: 'ovOpenFiling', amend: 'openCreateAmendmentModal',
  memo: 'openNegoMemo', open: 'hbOpenView', minor: 'hbOpenView', counter: 'openRedlineWorkbench', lock: 'openRedlineWorkbench' };
function caDoorCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  const head = c ? `<dl class="ca-dl"><dt>${_caE(_caT('ca_l_contract'))}</dt><dd>${_caE(caRef(c) + ' · ' + (c.name || ''))}</dd></dl>` : '';
  const may = !!(c && typeof window[CA_DOOR_NEEDS[a.door]] === 'function');
  return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_door_' + a.door))}</div>${head}
    <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_door_' + a.door + '_says'))}</p>
    ${a.state === 'done' ? `<p class="ca-said is-ok">${_caE(_caT('ca_job_opened'))}</p>`
      : may ? `<div class="ca-acts">${B('door', _caT('ca_door_' + a.door + '_go'), true)}</div>`
      : `<p class="ca-why">${_caE(_caT('ca_door_cannot'))}</p>`}</div>`;
}
async function caDoorPress(i, act){
  const m = caTurn(i); const a = m && m.act; if (!a || act !== 'door') return;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  const go = CA_DOOR_GO[a.door]; if (typeof go !== 'function') return;
  let r = null;
  try { r = await go(c); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
  if (r === false) return;
  a.state = 'done';
  if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
}

/* THE CHIPS ARE JAMBO'S WORDS (the one-page Home plan, stage 1; the owner
   picked "Chips" by name, 14 Oct 2026): on Home's Document they stand above
   the box at every turn, not only on an empty conversation, and say the next
   words for where THIS contract stands. The lead comes from the side panel's
   own checklist (needsYouOf), so the chip and the checklist cannot disagree:
   details owed → "fill in", their side waiting on us → "redline", your
   signature → "sign". The lead is amber because it is work owed. With
   nothing chosen (the wall of paper) they are the ways in. A press asks the
   word, so a chip and a typed word are one path (caReadPlace). */
const CA_CHIPS = ['redline', 'deal', 'sign', 'history'];
const CA_CHIPS_WALL = ['upload', 'draft', 'board', 'calendar'];
function caChipLead(c){
  let need = [];
  try { need = ((typeof needsYouOf === 'function') ? needsYouOf(c) : []).map(x => x && x.kind); } catch (_){ need = []; }
  if (need.includes('details')) return 'fill';
  if (need.includes('quiet') || need.includes('refused') || need.includes('suggest')) return 'redline';
  if (need.includes('sign')) return 'sign';
  return null;
}
function caPaperChips(){
  if (typeof igHomePaperFace !== 'function' || igHomePaperFace() !== true) return null;
  const c = caOpenContract();
  if (!c) return CA_CHIPS_WALL.map(k => ({ ask: _caT('ca_w_' + k), k }));
  const lead = caChipLead(c);
  const list = lead ? [lead].concat(CA_CHIPS.filter(k => k !== lead)).slice(0, CA_CHIPS.length) : CA_CHIPS;
  return list.map(k => ({ ask: _caT('ca_w_' + k), k, owed: k === lead }));
}
function caChipsHtml(){
  const L = caPaperChips(); if (!L) return '';
  return L.map(x => x.owed
    ? `<button type="button" data-igsug="${_caE(x.ask)}" data-ca-chip="${_caE(x.k)}" class="ca-chip-owed text-[10.5px] rounded-full px-2.5 py-1 transition text-left">${_caE(x.ask)}</button>`
    : x.fill
    ? `<button type="button" data-ca-fill="${_caE(x.fill)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${_caE(x.label)}</button>`
    : `<button type="button" data-igsug="${_caE(x.ask)}"${x.k ? ` data-ca-chip="${_caE(x.k)}"` : ''} class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${_caE(x.ask)}</button>`).join('');
}
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const r = e.target && e.target.closest ? e.target.closest('.ca-row[data-ig-cite]') : null; if (!r) return;
  e.preventDefault(); r.click();
});
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-ca-fill]') : null; if (!b) return;
  const inp = document.getElementById('igd-input'); if (!inp) return;
  inp.value = b.getAttribute('data-ca-fill');
  try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (_){}
  if (typeof chatFieldGrow === 'function') chatFieldGrow(inp);
  caPopRead(inp);
});

/* ============================================================
   A HIGHLIGHT ON THE PAPER (Home's Paper side)
   ============================================================
   The negotiation page's own menu (rlSelMenu, its markup, anchoring and
   one-at-a-time rule) with the Paper's four verbs:
   - Ask Copilot — the words go into the ask box, quoted; the reader asks.
   - Make it an obligation — the product's own obligation form, the words as
     its description and quote; Add is the reader's press (openObligationForm).
   - Mark a risk — a risk the READER names, kept in c.risks.marked (never
     travels, like the rest of c.risks) and counted by riskItemsOf like any other.
   - Comment — opens the Chat panel with the words pinned and Internal chosen
     (rlNoteFromSelection, the Negotiate page's own door); the note is written
     there (negoPostComment, the one writer). ca_note_on_* and ca_note_done
     are inert in both books.
   Never on an executed contract's wording? Reading and noting still are. */
const CA_SEL_ACTIONS = () => [
  { id: 'ask', label: _caT('ca_sel_ask') },
  { id: 'oblig', label: _caT('ca_sel_oblig') },
  { id: 'risk', label: _caT('ca_sel_risk') },
  { id: 'note', label: _caT('ca_sel_note') },
  /* MY NOTES (Young, 10 Oct 2026): the words into the person's private ledger */
  { id: 'mine', label: _caT('mn_add_to') },
];
function caSelKill(){ document.querySelectorAll('.nego-selmenu').forEach(n => n.remove()); }
function caSelClauseId(node){
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  const at = el && el.closest ? el.closest('[data-anchor]') : null;
  const id = at ? String(at.getAttribute('data-anchor') || '') : '';
  /* only a clause the record holds (read RAW, never initialised) */
  const p = (typeof intel === 'object' && intel) ? intel.paper : null;
  const c = p && typeof getContract === 'function' ? getContract(p.id) : null;
  let known = [];
  try { known = (c && c.negotiation && c.negotiation.baselineBody && typeof clauseSegment === 'function') ? clauseSegment(c.negotiation.baselineBody) : []; } catch (_){ known = []; }
  return id && known.some(x => x && String(x.id) === id) ? id : '';
}
function caSelOpen(){
  const sel = window.getSelection && window.getSelection();
  if (!sel || sel.isCollapsed){ caSelKill(); return; }
  const within = n => { const el = n && (n.nodeType === 1 ? n : n.parentElement); return !!(el && el.closest && el.closest('#ig-canvas')); };
  if (!within(sel.anchorNode) || !within(sel.focusNode)){ return; }
  const text = String(sel.toString()).replace(/\s+/g, ' ').trim();
  if (text.length < 3){ caSelKill(); return; }
  let rect; try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch (_){ return; }
  if (!rect || (!rect.width && !rect.height)) return;
  const p = (typeof intel === 'object' && intel) ? intel.paper : null;
  const c = p && typeof getContract === 'function' ? getContract(p.id) : null; if (!c) return;
  const clauseId = caSelClauseId(sel.anchorNode);
  if (typeof negoEnsureStyle === 'function') negoEnsureStyle();
  if (typeof rlSelMenu !== 'function') return;
  rlSelMenu({ text, rect, actions: CA_SEL_ACTIONS(), onPick: act => caSelPick(c, act, text, clauseId) });
}
async function caSelPick(c, act, text, clauseId){
  caSelKill();
  const quote = text.slice(0, 600);
  if (act.id === 'ask'){
    const inp = (typeof igAskBox === 'function') ? igAskBox() : document.getElementById('igd-input'); if (!inp) return;
    inp.value = _caT('ca_sel_ask_fill', { q: quote.length > 240 ? quote.slice(0, 240) + '…' : quote });
    try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (_){}
    if (typeof chatFieldGrow === 'function') chatFieldGrow(inp);
    return;
  }
  if (act.id === 'oblig'){
    if (typeof canEdit === 'function' && !canEdit()){ if (typeof toast === 'function') toast(_caT('ca_send_viewer'), 'err'); return; }
    if (typeof openObligationForm === 'function') openObligationForm(c, { desc: quote, due: '', recurring: 'none', assignee: '', quote, amount: '' });
    return;
  }
  /* a private note is anybody's to write, a viewer's too */
  if (act.id === 'mine'){ if (typeof myNotesNew === 'function') myNotesNew({ contractId: c.id, quote, clauseId }); return; }
  if (typeof canEdit === 'function' && !canEdit()){ if (typeof toast === 'function') toast(_caT('ca_send_viewer'), 'err'); return; }
  if (act.id === 'risk'){
    if (typeof promptDialog !== 'function') return;
    const v = await promptDialog({ title: _caT('ca_risk_title'), message: _caT('ca_risk_msg'), value: '' });
    if (v == null || !String(v).trim()) return;
    caRiskMark(c, String(v).trim(), quote);
    if (typeof toast === 'function') toast(_caT('ca_risk_done'), 'ok');
    return;
  }
  if (act.id === 'note'){
    /* THE NOTE IS WRITTEN IN CHAT (Young, 10 Oct 2026, the "HaTi Proposals"
       artifact, Part 2): no pop-up of its own. The Notes panel opens with the
       words pinned whole under their clause and Internal chosen — the same one
       door the Negotiate page's Comment uses (rlNoteFromSelection), so the
       note anchors to its clause and wears its mark on the paper. Where the
       Paper cannot say which clause the words sit in, the words are pinned to
       the contract instead, never glued onto the note's text. */
    if (clauseId && typeof rlNoteFromSelection === 'function' && rlNoteFromSelection(c, { clauseId, quote })) return;
    if (typeof rlNotesPin === 'function' && typeof openNotesPanel === 'function'){
      rlNotesPin({ contractId: c.id, room: 'internal', quote });
      openNotesPanel(c.id, null, { force: true });
      return;
    }
    if (typeof toast === 'function') toast(_caT('ca_failed'), 'err');
  }
}
/* THE ONE WRITER of a risk a person marks by hand. */
const CA_RISK_MAX = 120;
function caRiskMark(c, title, quote){
  if (!c) return null;
  if (!c.risks || typeof c.risks !== 'object') c.risks = {};
  if (!Array.isArray(c.risks.marked)) c.risks.marked = [];
  const me = (typeof currentUser === 'function' && currentUser()) || null;
  const row = { title: String(title).slice(0, CA_RISK_MAX), quote: String(quote || '').slice(0, 600), by: me ? me.name : '', at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString() };
  c.risks.marked.push(row);
  if (typeof logAudit === 'function') try { logAudit(c, 'Risk marked', row.title); } catch (_){}
  if (typeof persist === 'function') try { persist(c); } catch (_){}
  return row;
}
if (typeof document !== 'undefined' && !document._caSelArmed){
  document._caSelArmed = true;
  document.addEventListener('mouseup', e => {
    const t = e.target; if (!t || !t.closest || !t.closest('#ig-canvas')) return;
    if (t.closest('button, a, input, textarea, select, .nego-selmenu')) return;
    setTimeout(caSelOpen, 0);
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest || !e.target.closest('.nego-selmenu')) { if (document.querySelector('#ig-canvas') ) caSelKill(); } }, true);
  /* Esc closes it too (11 Oct 2026): the Document tab's highlight menu did, and
     with that tab gone Home's paper is where a reader highlights. */
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('#ig-canvas')) caSelKill(); });
}

/* A DRAFTED REPLY (step 6, 8 Oct 2026): the one Copilot call behind "Draft a
   reply" on a dropped thread. It writes words to show, files and sends
   nothing; a non-answer (the route's unfinished/empty marks) is never a draft.
   Returns { text } or { why: 'nokey' | 'empty' | 'failed', msg }. */
async function caDraftReply(prompt, cid){
  if (typeof copilotAsk !== 'function') return { why: 'failed' };
  try {
    const res = await copilotAsk([{ role: 'user', content: prompt }], { view: 'intel', activeContractId: cid }, null, { quiet: true });
    const text = String((res && (res.answer || res.reply || res.text)) || '').replace(/^\s*["“]|["”]\s*$/g, '').trim();
    if (!text || (res && (res.unfinished || res.empty))) return { why: 'empty' };
    return { text };
  } catch (e){
    return (e && e.needsKey) ? { why: 'nokey' } : { why: 'failed', msg: (e && e.message) || '' };
  }
}
Object.assign(window, { caDraftReply });
Object.assign(window, { CA_DOORS, caReadDoor, caRoomSign, CA_DOOR_GO, CA_DOOR_NEEDS, caDoorCardHtml, caDoorPress });
Object.assign(window, { CA_PICK_MAX, CA_NOTE_MAX, CA_SEND_RE, caPeople, caContracts, caOpenContract, caTokenAt, caMatches, caPopHtml, caPopClose, caPopRead, caChoose,
  caFindContract, caFindPerson, caNoteOf, caReadSend, caActOf, caSendBlock, caCardHtml, caCardPress,
  CA_DRAFT_RE, CA_DRAFT_NOUN, CA_DRAFT_OPTS, caReadDraft, caDraftScore, caDraftRank, caDraftRun, caDraftCardHtml, caDraftPress,
  CA_JOBS, CA_JOB_RE, caReadJob, caNamedOrUp, caRowsWithQuotes, caRiskList, caObligList, caListCardHtml, caReadyDoor, caJobCardHtml, caJobPress, caPaperChips, caChipsHtml,
  CA_SEL_ACTIONS, caSelKill, caSelClauseId, caSelOpen, caSelPick, CA_RISK_MAX, caRiskMark });

/* ============================================================
   JAMBO'S WORDS — A PLACE TAKES YOU THERE, WORK OPENS ITS DOOR
   (the one-page Home plan, stage 1: docs/PLAN-one-page-home.md; the owner
   agreed the plan on 14 Oct 2026 and picked "Chips" by name)
   ============================================================
   A WHOLE ask that is one known word — "redline", "sign", "board",
   "/history", "deal board MK-458", "gå till kalendern" — is read here with
   no model and opens TODAY's door for it. Anything longer is a question and
   goes on exactly as before: a word is matched whole, never found inside a
   sentence ("what does the board say about liability?" is a question).
   TYPING NEVER SIGNS, SENDS OR FILES: a word opens a page or a card, and the
   act is still a press there (the Sign button, the send screen's Send).
   THE WORDS ARE DATA IN BOTH LANGUAGES, never read back from the books and
   never a regex built from them (CLAUDE.md, two languages); the chips' and
   the "/" list's labels come from the books, and f672 pins that every label
   in both books is a word read here. */
const CA_PLACES = [
  { k: 'redline', need: 'one', w: ['redline', 'redlines', 'redlining', 'negotiate', 'negotiation', 'changes', 'förhandla', 'förhandlingen', 'ändringar', 'rödlinjer'] },
  { k: 'deal', need: 'one', w: ['deal board', 'dealboard', 'affärstavla', 'affärstavlan'] },
  { k: 'sign', need: 'one', w: ['sign', 'signing', 'before you sign', 'signera', 'signering', 'underteckna'] },
  { k: 'share', need: 'one', w: ['share', 'send', 'dela', 'skicka'] },
  { k: 'fill', need: 'one', w: ['fill', 'fill in', 'fill in the details', 'details', 'fyll i', 'uppgifter', 'detaljer'] },
  { k: 'oblig', need: 'any', w: ['obligations', 'duties', 'åtaganden', 'skyldigheter'] },
  { k: 'history', need: 'any', w: ['history', 'trail', 'historik', 'historiken'] },
  { k: 'board', w: ['board', 'tavla', 'tavlan'] },
  { k: 'document', w: ['document', 'paper', 'dokument', 'dokumentet', 'pappret'] },
  { k: 'calendar', w: ['calendar', 'kalender', 'kalendern'] },
  { k: 'explorer', w: ['explorer', 'utforskaren'] },
  { k: 'wall', w: ['another contract', 'all contracts', 'every contract', 'contracts', 'ett annat avtal', 'alla avtal', 'avtal'] },
  { k: 'upload', w: ['upload', 'ladda upp'] },
  { k: 'draft', w: ['draft', 'new agreement', 'nytt avtal', 'utkast'] },
  { k: 'back', w: ['back', 'go back', 'tillbaka'] },
  { k: 'help', w: ['help', 'what can you do', 'hjälp'] },
];
/* "go to", "open", "show me", "take me back to", "gå till", "öppna", "visa" */
const CA_PLACE_LEAD = /^(?:please\s+)?(?:(?:go|take me|bring me|jump|switch)\s+(?:back\s+)?to\s+|open\s+|show\s+(?:me\s+)?|gå\s+(?:tillbaka\s+)?till\s+|öppna\s+|visa\s+(?:mig\s+)?)/i;
const CA_PLACE_MAX = 60;          // longer than this is a sentence, never a word
const CA_PLACE_MIN_TYPED = 3;     // letters the top bar's search waits for before a place leads
function caPlaceOf(q){
  let t = String(q || '').trim(); if (!t || t.length > CA_PLACE_MAX) return null;
  const slash = t[0] === '/'; if (slash) t = t.slice(1);
  let cid = null;
  for (const [label, v] of _caChosen) if (v.kind === 'contract' && t.includes(label)){ cid = cid || v.id; t = t.split(label).join(' '); }
  /* a reference names the contract only when it IS one: "deal-board" is a word */
  t = t.replace(/#?\b([A-Za-z]{2,4}-[A-Za-z0-9]+)\b/g, (m0, ref) => {
    const c = caContracts().find(x => String(caRef(x)).toUpperCase() === ref.toUpperCase() || String(x.id).toUpperCase() === ref.toUpperCase());
    if (!c) return m0;
    cid = cid || c.id; return ' ';
  });
  t = t.toLowerCase().replace(/[?.!]+\s*$/, '').replace(/\s+/g, ' ').trim();
  t = (t + ' ').replace(CA_PLACE_LEAD, '').replace(/^(?:the|my|our)\s+/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  /* ON THE BOARD ITS OWN READER KEEPS ITS WORDS: "obligations" is its
     obligations panel, "MK-458" the contract's card, a saved view its name.
     Only a move between faces ("board", "explorer") is the same either way. */
  if (caOnBoard() && typeof hbParse === 'function'){ let r = null; try { r = hbParse(q); } catch (_){ r = null; } if (r && r.act !== 'face') return null; }
  /* a reference on its own ("MK-458", "open #MK-458") is that contract's paper */
  if (!t && cid) return { kind: 'go', place: 'document', cid, slash, state: 'ready' };
  const p = CA_PLACES.find(x => x.w.includes(t)); if (!p) return null;
  return { kind: 'go', place: p.k, cid, slash, state: 'ready' };
}
function caOnBoard(){ try { return typeof state !== 'undefined' && !!state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'board'; } catch (_){ return false; } }
/* The contract a word is about: the one it names, else the paper that is up.
   A word that needs one and has none is answered "which contract?" and the
   wall of paper is opened to choose from — never a guess. */
function caReadPlace(q){
  const a = caPlaceOf(q); if (!a) return null;
  const p = CA_PLACES.find(x => x.k === a.place);
  if (!a.cid && p.need){ const c = caOpenContract(); if (c) a.cid = c.id; }
  if (p.need === 'one' && !a.cid) a.missing = true;
  return a;
}

/* ---- THE PLACES YOU USE MOST, per person, in this browser ----
   Its own key, not LS.ui: LS.ui is written whole by the page store
   (app.js), which would drop a count kept beside it. */
const CA_USES_KEY = 'hati.v1.jamboUses';
function caUsesAll(){ try { return JSON.parse(localStorage.getItem(CA_USES_KEY) || '{}') || {}; } catch (_){ return {}; } }
function caUsesWho(){ const me = (typeof currentUser === 'function') ? currentUser() : null; return String((me && me.id) || 'me'); }
function caUses(){ const u = caUsesAll()[caUsesWho()]; return (u && typeof u === 'object') ? u : {}; }
function caUseBump(k){
  try { const all = caUsesAll(); const w = caUsesWho(); const u = (all[w] && typeof all[w] === 'object') ? all[w] : (all[w] = {});
    u[k] = (Number(u[k]) || 0) + 1; localStorage.setItem(CA_USES_KEY, JSON.stringify(all)); } catch (_){}
}
/* ---- "/" — THE PLACES, MOST USED FIRST ----
   Drawn by the Board's own list (hbAskPopRows), so there is one "/" list:
   these rows first, and on the Board its chart moves after them. Ties keep
   this order, which is the plan's order of a working day. */
const CA_SLASH = ['redline', 'sign', 'board', 'deal', 'document', 'share', 'oblig', 'history', 'fill', 'calendar', 'explorer', 'draft', 'upload'];
const CA_SLASH_MAX = 8;
function caSlashWord(k){ return String(_caT('ca_w_' + k)).trim().replace(/\s+/g, '-'); }
function caSlashRows(w, opts = {}){
  const u = caUses(); const q = String(w || '').toLowerCase();
  return CA_SLASH.map((k, i) => ({ k, i, word: caSlashWord(k), n: Number(u[k]) || 0 }))
    .filter(r => !q || r.word.toLowerCase().startsWith(q) || r.word.toLowerCase().split('-').some(x => x.startsWith(q)))
    .sort((a, b) => (b.n - a.n) || (a.i - b.i))
    .slice(0, opts.max || CA_SLASH_MAX)
    .map(r => ({ kind: 'place', k: r.k, word: '/' + r.word, sub: _caT('ca_sl_' + r.k), n: r.n }));
}

/* ---- THE WAY BACK (the plan: "the panel always offers ‹ Back to …") ----
   Every move a word makes leaves the place it left on a short trail; the
   panel's back row returns there. A place the reader has since gone back to
   by hand is dropped rather than offered as a door that goes nowhere. */
const CA_TRAIL_MAX = 12;
const _caTrail = [];
function caPlaceNow(){
  const view = (typeof state !== 'undefined' && state) ? state.view : '';
  const face = (view === 'dashboard' && typeof hbFace === 'function') ? hbFace() : null;
  const c = caOpenContract();
  /* off Home, a contract's page remembers its contract (Negotiate, the room) */
  const act = (typeof state !== 'undefined' && state) ? state.activeId : null;
  return { view, face, id: (face === 'paper' && c) ? c.id : (view === 'redline' || view === 'workspace') ? (act || null) : null };
}
const caSamePlace = (a, b) => !!(a && b && a.view === b.view && a.face === b.face && a.id === b.id);
function caTrailPush(){
  const n = caPlaceNow(); if (caSamePlace(_caTrail[_caTrail.length - 1], n)) return;
  _caTrail.push(n); if (_caTrail.length > CA_TRAIL_MAX) _caTrail.shift();
}
function caTrailTop(){
  const now = caPlaceNow();
  while (_caTrail.length && caSamePlace(_caTrail[_caTrail.length - 1], now)) _caTrail.pop();
  return _caTrail[_caTrail.length - 1] || null;
}
/* the name of a place on the trail: "the Board", "MK-458 on the paper" */
function caTrailLabel(p){
  if (!p) return '';
  if (p.view !== 'dashboard'){
    const pc = p.id && typeof getContract === 'function' ? getContract(p.id) : null;
    if (pc && (p.view === 'redline' || p.view === 'workspace')) return _caT(p.view === 'redline' ? 'ca_place_nego' : 'ca_place_room', { ref: caRef(pc) });
    return _caT('ca_place_page');
  }
  if (p.face === 'paper'){ const c = p.id && typeof getContract === 'function' ? getContract(p.id) : null;
    return c ? _caT('ca_place_paper', { ref: caRef(c) }) : _caT('ca_place_wall'); }
  return _caT('ca_place_' + (p.face || 'board'));
}
function caTrailBack(){
  const p = caTrailTop(); if (!p) return false;
  _caTrail.pop();
  if (p.view !== 'dashboard'){
    const pc = p.id && typeof getContract === 'function' ? getContract(p.id) : null;
    if (pc && p.view === 'redline' && typeof openRedlineWorkbench === 'function') openRedlineWorkbench(pc.id);
    else if (pc && p.view === 'workspace' && typeof openWorkspace === 'function') openWorkspace(pc.id);
    else if (typeof setView === 'function') setView(p.view || 'dashboard');
    return true;
  }
  if (p.face === 'paper'){
    if (p.id && typeof getContract === 'function' && getContract(p.id) && typeof pdOpenOnHome === 'function') pdOpenOnHome(p.id, 'copilot');
    else caHomeWall();
    return true;
  }
  caHomeFace(p.face || 'board'); return true;
}
function caBackRowHtml(){
  const p = caTrailTop(); if (!p) return '';
  return `<button type="button" class="ca-back" data-ca-back>${_caE('‹ ' + _caT('ca_back', { where: caTrailLabel(p) }))}</button>`;
}

/* ---- WHERE EACH WORD GOES TODAY (stage 1 opens today's doors; later
   stages bring the work into the panel, docs/PLAN-one-page-home.md §7) ---- */
function caHomeFace(f){
  if (typeof hbS !== 'function') return false;
  if (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof hbSetFace === 'function'){ hbSetFace(f); return true; }
  const s = hbS(); s.face = f; if (typeof hbSave === 'function') hbSave();
  if (typeof setView === 'function') setView('dashboard');
  return true;
}
function caHomeWall(){ caHomeFace('paper'); if (typeof igPickAgain === 'function') igPickAgain(); return true; }
function caRoomTab(c, k){ if (typeof openWorkspace === 'function') openWorkspace(c.id); if (typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id) || c, k); } catch (_){} return true; }
const CA_GO = {
  board: () => caHomeFace('board'),
  document: c => (c && typeof pdOpenOnHome === 'function') ? pdOpenOnHome(c.id, 'copilot') : caHomeFace('paper'),
  calendar: () => typeof hbOpenCalendar === 'function' && hbOpenCalendar(),
  explorer: () => typeof hbOpenExplorer === 'function' && hbOpenExplorer(),
  wall: () => caHomeWall(),
  /* beside the paper: Jambo's own Redlines face (stage 3), through the page's walls */
  redline: c => (typeof pdRedOpen === 'function') ? pdRedOpen(c.id) : openRedlineWorkbench(c.id),
  /* on the Board, for that contract (stage 4): the view, the Negotiate page's
     own board drawn a second time */
  deal: c => (typeof hbOpenView === 'function') ? hbOpenView(c.id, 'deal') : (openRedlineWorkbench(c.id) && typeof openDealBoard === 'function' && (openDealBoard(), true)),
  sign: c => caRoomSign(c),
  /* beside the paper: Jambo's own Fill in face (stage 2) */
  fill: c => (typeof pdFillOpen === 'function') ? pdFillOpen(c.id) : caRoomTab(c, 'details'),
  oblig: c => c ? pdOpenOnHome(c.id, 'oblig') : (typeof setView === 'function' && setView('obligations')),
  history: c => c ? ((typeof hbOpenView === 'function') ? hbOpenView(c.id, 'hist') : caRoomTab(c, 'history')) : (typeof openPanel === 'function' && openPanel('activity')),
  upload: () => typeof openUploadModal === 'function' && openUploadModal(),
  draft: () => typeof openNewDoors === 'function' && openNewDoors(),
};
/* what Jambo says as he goes — one line, no card (share and help are cards) */
function caGoSay(a){
  if (!a) return '';
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (a.missing) return _caT('ca_go_need', { word: _caT('ca_w_' + a.place) });
  if (a.place === 'back'){ const p = caTrailTop(); return p ? _caT('ca_go_back', { where: caTrailLabel(p) }) : _caT('ca_go_back_none'); }
  const p = CA_PLACES.find(x => x.k === a.place) || {};
  return _caT('ca_go_' + a.place + (p.need === 'any' && !c ? '_all' : ''), { ref: c ? caRef(c) : '' });
}
/* THE ONE PLACE A WORD MOVES THE READER: intelAsk calls it after the line is
   said; the top bar's search calls it with no conversation. */
function caGo(a){
  if (!a || a.kind !== 'go') return false;
  if (a.place === 'back'){ const ok = caTrailBack(); caGoRepaint(); return ok; }
  if (a.place === 'help') return true;
  caUseBump(a.place);
  if (a.place === 'share') return true;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  caTrailPush();
  if (a.missing){ caHomeWall(); caGoRepaint(); return true; }
  const go = CA_GO[a.place]; if (typeof go !== 'function') return false;
  try { go(c); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return false; }
  caGoRepaint();
  return true;
}
/* a move that stays on Home repaints the panel so its back row is current */
function caGoRepaint(){ setTimeout(() => { try { if (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof renderIntelDock === 'function') renderIntelDock(); } catch (_){} }, 0); }
/* the top bar's search: the same words, and the same move */
function caPlaceRows(q){
  const t = String(q || '').trim().toLowerCase().replace(/^\//, '');
  /* three letters before a place leads the search, so a name search ("Sa…")
     is not pushed down by "sign" and "share" */
  if (t.length < CA_PLACE_MIN_TYPED) return [];
  return CA_SLASH.filter(k => CA_PLACES.find(p => p.k === k).w.some(w => w.startsWith(t)) || caSlashWord(k).toLowerCase().startsWith(t))
    .slice(0, 3).map(k => ({ k, word: _caT('ca_w_' + k), sub: _caT('ca_sl_' + k) }));
}
function caPlaceRun(k){
  const word = _caT('ca_w_' + k);
  if (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof intelAsk === 'function') return intelAsk(word);
  const a = caReadPlace(word); if (!a) return false;
  if (a.place === 'share' || a.place === 'help'){ caUseBump(a.place); if (typeof setView === 'function') setView('dashboard'); setTimeout(() => { if (typeof intelAsk === 'function') intelAsk(word); }, 0); return true; }
  return caGo(a);
}

/* ---- THE TWO WORDS THAT ANSWER WITH A CARD ----
   SHARE: two choices, each the existing door (the send screen; a colleague
   through the pass Jambo already prepares). HELP: the words, said once. */
function caGoCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (a.place === 'share' && c && !a.missing){
    const them = String(c.counterparty || '').trim();
    const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_share_title', { ref: caRef(c) }))}</div>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_share_says'))}</p>
      <div class="ca-acts">${B('shareout', them ? _caT('ca_share_out', { who: them }) : _caT('ca_share_out_none'), true)}${B('sharein', _caT('ca_share_in'))}</div></div>`;
  }
  if (a.place === 'help'){
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_help_title'))}</div>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_help_places'))}</p>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_help_work'))}</p>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_help_rest'))}</p></div>`;
  }
  return '';
}
function caGoPress(a, act){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  if (act === 'shareout'){ if (typeof openShareModal === 'function') openShareModal(c); return; }
  if (act === 'sharein'){
    const inp = document.getElementById('igd-input'); if (!inp) return;
    inp.value = `${_caT('ca_chip_send_word')} #${caRef(c)} ${_caT('ca_chip_send_to')} @`;
    _caChosen.set('#' + caRef(c), { kind: 'contract', id: c.id, name: c.name || '' });
    try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (_){}
    caPopRead(inp);
  }
}
if (typeof document !== 'undefined' && !document._caBackWired){
  document._caBackWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-ca-back]') : null; if (!b) return;
    e.preventDefault(); caTrailBack(); caGoRepaint();
  });
}
Object.assign(window, { CA_PLACES, CA_PLACE_LEAD, CA_PLACE_MAX, CA_PLACE_MIN_TYPED, caPlaceOf, caOnBoard, caReadPlace, CA_USES_KEY, caUses, caUseBump, CA_SLASH, CA_SLASH_MAX, caSlashWord, caSlashRows,
  CA_TRAIL_MAX, caPlaceNow, caTrailPush, caTrailTop, caTrailLabel, caTrailBack, caBackRowHtml, caHomeFace, caHomeWall, caRoomTab, CA_GO, caGoSay, caGo, caGoRepaint,
  caPlaceRows, caPlaceRun, caGoCardHtml, caGoPress, CA_CHIPS, CA_CHIPS_WALL, caChipLead });
