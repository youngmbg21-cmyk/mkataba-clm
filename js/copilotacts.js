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
const CA_NOTE_MAX = 2000;         // the note the server keeps: the pass route's own cap, PASS_NOTE_MAX (js/sharemail.js)
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
/* WHO CAN OPEN IT (owner picked "The Send Screen", 20 Oct 2026: "People who
   can open MK-451", one who cannot greyed with the reason): a colleague whose
   streams leave the contract out is offered greyed, never hidden — the
   browser's reading (canAccessFolder) is cosmetics; the pass route refuses it
   too (no-access). `why` is the sentence; empty when they can. */
function caPeopleFor(c){
  const ref = c ? caRef(c) : '';
  return caPeople(c).map(p => {
    if (p.kind !== 'colleague' || !c || !c.folder || typeof canAccessFolder !== 'function' || typeof getUsers !== 'function') return p;
    let u = null; try { u = (getUsers() || []).find(x => x && String(x.id) === p.id) || null; } catch (_){ u = null; }
    let ok = true; try { ok = !u || canAccessFolder(c.folder, u); } catch (_){ ok = true; }
    if (ok) return p;
    /* a stream with no name of its own reads as a dash: the shorter sentence then */
    const stream = String((typeof streamLabel === 'function') ? streamLabel(c.folder) : '').replace(/^[\s—–-]+$/, '');
    return Object.assign({}, p, { why: _caT(stream ? 'ca_cannot_open_in' : 'ca_cannot_open', { ref, stream }) });
  });
}
function caContracts(){
  const cs = (typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(c => c && !c.archived && c.status !== 'Declined');
}
function caRef(c){ return (typeof contractRef === 'function') ? contractRef(c) : (c && c.id) || ''; }
/* A CONTRACT NUMBER IN ANY FORM (owner, 15 Oct 2026: "mk 450" was answered
   "no contract MK-450", though it exists): "mk 450", "mk450", "#MK-450" and
   "contract 450" are written as the contract's own reference, but only where a
   contract the reader can see carries it — "in 2026" stays words, and a number
   nobody can see is left as typed for the honest "not one you can see". The
   ONE normaliser, read by Jambo's words (caActOf) and the Board's (hbParse). */
/* A NUMBER WRITTEN WITH ITS ZEROS IS THE SAME NUMBER (owner, 19 Oct 2026:
   "do what the user asks in plain language"): "mk 377" is MK-0377 where the
   book numbers it so — the letters and the number, the zeros in front let go */
const caRefCanon = s => String(s || '').toUpperCase().replace(/-0+(?=\d)/, '-');
const caRefNum = s => String(s || '').replace(/^\D+/, '').replace(/^0+(?=\d)/, '');
function caRefFix(q){
  const cs = ((typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : []).filter(c => c && !c.archived);
  /* the zeros let go where the one rule is loaded (caRefCanon, caRefNum); the plain reading where it is not */
  const canon = (typeof caRefCanon === 'function') ? caRefCanon : (v => String(v || '').toUpperCase());
  const num = (typeof caRefNum === 'function') ? caRefNum : (v => String(v || '').replace(/^\D+/, ''));
  const find = cand => cs.find(x => String(caRef(x)).toUpperCase() === cand || String(x.id).toUpperCase() === cand)
    || cs.find(x => canon(caRef(x)) === canon(cand) || canon(x.id) === canon(cand));
  /* the letters may run into the number ("mkB2"): every split is tried */
  const fit = (a, b) => { const w = (a + b).toUpperCase(); for (const k of [a.length, 2, 3, 4]){ const c = k < w.length && find(w.slice(0, k) + '-' + w.slice(k)); if (c) return c; } return null; };
  let s = String(q || '').replace(/#?\b([A-Za-z]{2,4})([- ]?)([A-Za-z0-9]*\d[A-Za-z0-9]*)\b/g, (m0, a, sep, b) => {
    const c = fit(a, b); if (c) return caRef(c);
    /* "open mkB2": the word before is not the letters — the number may stand alone */
    const t = sep === ' ' && /^([A-Za-z]{2,4})([A-Za-z0-9]*\d[A-Za-z0-9]*)$/.exec(b); const c2 = t && fit(t[1], t[2]);
    return c2 ? a + sep + caRef(c2) : m0;
  });
  s = s.replace(/\b(?:contract|agreement|avtal(?:et)?)\s+(?:no\.?\s*|number\s+|nr\.?\s*)?#?(\d+)\b/gi, (m0, n) => {
    const hits = cs.filter(x => num(caRef(x)) === num(n));
    return hits.length === 1 ? caRef(hits[0]) : m0;
  });
  /* the number on its own ("352", the owner's iPad, 15 Oct 2026, drew a chart
     titled "352"): it is the one contract it numbers, when there is one */
  s = s.replace(/^\s*#?(\d+)\s*$/, (m0, n) => {
    const hits = cs.filter(x => num(caRef(x)) === num(n));
    return hits.length === 1 ? caRef(hits[0]) : m0;
  });
  return s;
}
/* EVERY NUMBER IN AN ANSWER IS A LINK (owner, 15 Oct 2026): after a feed is
   painted, a contract reference in an answer — drawn by refHtml or written as
   words by the model — becomes a press that opens that contract on Home
   (regOpenContract, the Contracts place's own door). Only a reference a
   contract the reader can see carries; the reader's own words stay words. */
const CA_REF_RE = /\b[A-Z]{2,4}-[A-Z0-9]*\d[A-Z0-9]*\b/g;
function caRefLinkPaint(root){
  if (!root || typeof document === 'undefined' || !root.querySelectorAll) return;
  const cs = ((typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : []).filter(c => c && !c.archived);
  if (!cs.length) return;
  const by = new Map(); cs.forEach(c => { by.set(String(caRef(c)).toUpperCase(), c.id); by.set(String(c.id).toUpperCase(), c.id); });
  const mark = (el, id) => { el.setAttribute('data-ref-open', id); el.setAttribute('role', 'link'); el.tabIndex = 0; el.classList.add('is-link'); };
  root.querySelectorAll('.hati-ref:not([data-ref-open])').forEach(el => { const id = by.get(el.textContent.trim().toUpperCase()); if (id) mark(el, id); });
  root.querySelectorAll('.ai-bub:not(.ig-bub-me)').forEach(bub => {
    const walk = document.createTreeWalker(bub, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && n.parentElement.closest('a, button, code, textarea, input, .hati-ref, [data-ref-open]')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; let n; while ((n = walk.nextNode())) if (CA_REF_RE.test(n.nodeValue)){ CA_REF_RE.lastIndex = 0; nodes.push(n); }
    nodes.forEach(t => {
      const txt = t.nodeValue; const frag = document.createDocumentFragment(); let at = 0, m, hit = false;
      CA_REF_RE.lastIndex = 0;
      while ((m = CA_REF_RE.exec(txt))){
        const id = by.get(m[0].toUpperCase()); if (!id) continue;
        hit = true; frag.appendChild(document.createTextNode(txt.slice(at, m.index)));
        const sp = document.createElement('span'); sp.className = 'hati-ref'; sp.textContent = m[0]; mark(sp, id); frag.appendChild(sp);
        at = m.index + m[0].length;
      }
      if (!hit) return;
      frag.appendChild(document.createTextNode(txt.slice(at)));
      t.parentNode.replaceChild(frag, t);
    });
  });
}
function caRefOpen(id){
  if (!id) return;
  if (typeof regOpenContract === 'function') return regOpenContract(id);
  if (typeof openWorkspace === 'function') openWorkspace(id);
}
if (typeof document !== 'undefined'){
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-ref-open]') : null; if (!el) return;
    e.preventDefault(); caRefOpen(el.getAttribute('data-ref-open'));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target && e.target.closest ? e.target.closest('[data-ref-open]') : null; if (!el) return;
    e.preventDefault(); caRefOpen(el.getAttribute('data-ref-open'));
  });
}
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
    const all = caPeopleFor(c);
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
/* ONE ROW FOR A PERSON, wherever a person is picked (Jambo's @ list, the
   send screen's "a colleague"): the clothes follow the builder. `attr` is the
   press's data attribute; a greyed row carries its reason and no press. */
function caPersonRowHtml(r, i, on, attr){
  const off = !!r.why;
  return `<div class="ca-opt${on ? ' on' : ''}${off ? ' is-off' : ''}" role="option" aria-selected="${on}"${off ? ' aria-disabled="true"' : ''} ${attr || 'data-ca-pick'}="${i}">
        <span class="av" aria-hidden="true">${_caE(r.name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase())}</span>
        <span class="who"><b>${_caE(r.name)}</b><small>${_caE(off ? r.why : [r.sub, r.email].filter(Boolean).join(' · '))}</small></span>
        <em>${_caE(off ? '' : _caT(r.kind === 'theirs' ? 'ca_on_contract' : 'ca_colleague'))}</em></div>`;
}
function caPopHtml(P){
  const rows = P.rows.slice(0, CA_PICK_MAX);
  const open = P.sigil === '@' ? caOpenContract() : null;
  const head = open ? _caT('ca_pop_people_on', { ref: caRef(open) }) : _caT(P.sigil === '@' ? 'ca_pop_people' : 'ca_pop_contracts', { q: P.q });
  const body = rows.length ? rows.map((r, i) => P.sigil === '@'
    ? caPersonRowHtml(r, i, i === P.on)
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
  /* the light starts on the first row that can be chosen (a greyed one cannot) */
  const first = rows.slice(0, CA_PICK_MAX).findIndex(r => !r.why);
  _caPop = { sigil: tok.sigil, q: tok.q, start: tok.start, rows, on: Math.max(0, first) };
  caPopPaint(inp);
}
/* A choice replaces "@Ja" with "@Jane Mwangi " and remembers who that is. */
const _caChosen = new Map();   // "@Jane Mwangi" / "#MK-447" -> { kind, id, name }
function caChoose(inp, i){
  const P = _caPop; if (!P) return;
  const r = P.rows[i]; if (!r || r.why) return;
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
  q = caRefFix(q);
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
/* "SEND THE ABOVE SUMMARY TO @YOUNG" (owner picked "The Send Screen", 20 Oct
   2026): what Jambo said last becomes the note, and the ONE send screen opens
   as "a colleague" with the person and the note filled in. Nothing is sent
   here; the screen's Send by email is the press (POST …/pass, caPassSend). */
const CA_SUMMARY_RE = /\b(?:summary|summari[sz]e|recap|the above|above|this answer|that answer|your answer|what you (?:said|wrote|found)|sammanfattning(?:en)?|ovan)\b/i;
function caSummaryText(before){
  let H = []; try { H = intel.history || []; } catch (_){ H = []; }
  const end = Number.isInteger(before) ? before : H.length;
  for (let k = end - 1; k >= 0; k--){
    const m = H[k];
    if (!m || m.role !== 'assistant' || m.err || m.act || !m.text) continue;
    if (typeof document === 'undefined') return String(m.text);
    const d = document.createElement('div'); d.innerHTML = String(m.text);
    d.querySelectorAll('li').forEach(li => { li.insertBefore(document.createTextNode('- '), li.firstChild); li.appendChild(document.createTextNode('\n')); });
    d.querySelectorAll('p, div, ul, ol, br').forEach(el => el.appendChild(document.createTextNode('\n')));
    const t = String(d.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (t) return t;
  }
  return '';
}
function caReadSend(q){
  if (!CA_SEND_RE.test(q) || !/@/.test(q)) return null;
  const person = caFindPerson(q);
  const c = caFindContract(q);
  const a = { kind: 'send', person, cid: c ? c.id : null, note: caNoteOf(q), review: /\breview\b/i.test(q), state: 'ready' };
  if (CA_SUMMARY_RE.test(q) && !a.note){
    a.screen = true; a.note = caSummaryText();
    if (person && person.kind === 'colleague' && c && a.note && !caSendBlock(a)) setTimeout(() => caSummaryOpen(a), 0);
  }
  return a;
}
/* the screen, opened on "a colleague" with Jambo's words as the note; the
   turn that asked is told what the press did (caScreenSent) */
function caSummaryOpen(a){
  const c = a && a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (!c || typeof openShareModal !== 'function') return false;
  openShareModal(c, { purpose: 'colleague', colleagues: [{ id: a.person.id, name: a.person.name }], note: a.note, fromJambo: true,
    onColleagueSent: r => caScreenSent(a, r) });
  /* AS DRAWN: beside the screen, Jambo's conversation stays in front (his
     line saying the screen is open); "Before you send" is one tab away */
  if (typeof pdTalkReopen === 'function') try { pdTalkReopen(); } catch (_){}
  return true;
}
function caScreenSent(a, r){
  if (!a || !r) return;
  a.state = r.state; a.why = r.why || ''; a.sentTo = r.names || (a.person ? a.person.name : '');
  try { a.at = new Date().toLocaleTimeString((typeof langLocale === 'function') ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' }); } catch (_){ a.at = ''; }
  /* AS DRAWN: the screen gone, his conversation is in front with what went */
  if (typeof pdTalkReopen === 'function') try { pdTalkReopen(); } catch (_){}
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* ONE PRESS, BOTH DOORS: Jambo's send card and the send screen's "a colleague"
   send through here — the pass route, the server's ask and History line taken
   onto the copy on screen, the outcome said in one word (sent · outbox ·
   asked · mailfail · failed) and one sentence. o = { review, fromJambo, door } */
async function caPassSend(c, person, note, o){
  const x = o || {};
  let r = null;
  try { r = await api('contracts/' + encodeURIComponent(c.id) + '/pass', 'POST', { memberId: person.id, note: note || '', review: !!x.review, fromJambo: !!x.fromJambo, door: x.door || 'jambo' }); }
  catch (e){ const why = (e && e.message) || String(e); return { state: 'failed', why, said: why }; }
  let state, why = '';
  if (!r || !r.asked){ state = 'failed'; why = _caT('ca_failed', { who: person.name }); }
  else if (r.emailSent) state = 'sent';
  else if (!r.told) state = 'asked';
  else if (!r.emailConfigured) state = 'outbox';
  else { state = 'mailfail'; why = r.emailError || ''; }
  const live = (typeof getContract === 'function' && getContract(c.id)) || c;
  if (r && Array.isArray(r.asks)) live.asks = (typeof asksTakeServer === 'function') ? asksTakeServer(live.asks, r.asks) : r.asks;
  if (r && r.audit && Array.isArray(live.audit)) live.audit = live.audit.concat([r.audit]);
  const said = state === 'sent' ? _caT('ca_sent', { who: person.name })
    : state === 'asked' ? _caT('ca_no_address', { who: person.name })
    : state === 'outbox' ? _caT('ca_outbox', { who: person.name })
    : state === 'mailfail' ? _caT('ca_mail_failed', { who: person.name, why })
    : why;
  return { state, why, said };
}
/* THE ONE ENTRY intelAsk calls before anything else: an act Copilot can
   prepare from the words alone, or null (and the question goes on as before). */
function caActOf(q){
  const t = caRefFix(String(q || '').trim()); if (!t) return null;
  const send = caReadSend(t); if (send) return send;
  const job = caReadJob(t); if (job) return job;
  const door = caReadDoor(t); if (door) return door;
  /* a place word reads only what no older reading takes ("show obligations"
     stays the list card; "obligations" alone goes there) */
  const go = caReadPlace(t); if (go) return go;
  const menu = caReadMenu(t); if (menu) return menu;
  if (typeof caReadDraft === 'function'){ const d = caReadDraft(t); if (d){ setTimeout(() => { caDraftRun(d); }, 0); return d; } }
  /* JAMBO'S MAP (18 Oct 2026, js/jambomap.js): last of all, a sentence in
     everyday words ("where are the contracts ending soon?") reaches the same
     doors as the exact words; what it does not know goes on to the model */
  if (typeof jmRead === 'function'){ const m = jmRead(t); if (m) return m; }
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
  if (a.kind === 'menu') return caMenuCardHtml(a, i);
  if (a.kind === 'go') return caGoCardHtml(a, i);
  if (a.kind === 'map') return (typeof jmCardHtml === 'function') ? jmCardHtml(a, i) : '';
  if (a.kind === 'here') return caHereCardHtml(a, i);
  if (a.kind === 'cpick') return caPickCardHtml(a, i);
  if (a.kind !== 'send') return '';
  if (a.screen) return caScreenCardHtml(a, i);
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
/* "SEND THE ABOVE SUMMARY TO @…": Jambo says the screen is open (or why it
   is not), and after the press what went — "Sent to Young Mbagaya at 14:02.
   Recorded in MK-451's history." with Show what was sent (the History page) */
function caScreenCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const B = (act, label, cls) => `<button type="button" class="ui-btn ui-btn-sm${cls === 'lead' ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  const blocked = a.person && a.person.kind === 'theirs' ? caSendBlock(a) : (!a.note ? { why: _caT('ca_summary_none'), fix: '' } : caSendBlock(a));
  if (blocked) return `<div class="ca-card is-said" data-ca-card="${i}"><p class="ca-why">${_caE(blocked.why)}</p>${blocked.fix === 'sendscreen' ? `<div class="ca-acts">${B('sendscreen', _caT('ca_a_sendscreen'), 'lead')}</div>` : ''}</div>`;
  const ref = c ? caRef(c) : '';
  const who = a.sentTo || (a.person ? a.person.name : '');
  if (a.state === 'sent' || a.state === 'outbox' || a.state === 'asked' || a.state === 'mailfail'){
    const k = a.state === 'sent' ? 'ca_scr_sent' : a.state === 'outbox' ? 'ca_scr_outbox' : a.state === 'asked' ? 'ca_scr_asked' : 'ca_scr_mailfail';
    return `<div class="ca-done${a.state === 'sent' ? '' : ' is-warn'}" data-ca-card="${i}"><span class="ca-tick" aria-hidden="true">${a.state === 'sent' ? '✓' : '!'}</span><span>${_caE(_caT(k, { who, at: a.at || '', ref, why: a.why || '' }))} <button type="button" class="ui-link" data-ca-act="history" data-ca-turn="${i}">${_caE(_caT('ca_scr_show'))}</button></span></div>`;
  }
  if (a.state === 'failed') return `<div class="ca-card is-said" data-ca-card="${i}"><p class="ca-said is-bad">${_caE(a.why || _caT('ca_failed', { who }))}</p><div class="ca-acts">${B('reopen', _caT('ca_scr_reopen'), 'lead')}</div></div>`;
  return `<div class="ca-card is-said" data-ca-card="${i}"><p>${_caE(_caT('ca_scr_open', { who }))}</p><div class="ca-acts">${B('reopen', _caT('ca_scr_reopen'), '')}</div></div>`;
}
function caTurn(i){ try { return intel.history[i] || null; } catch (_){ return null; } }
async function caCardPress(i, act, btn){
  const m = caTurn(i); const a = m && m.act; if (!a) return;
  if (a.kind === 'draft' && typeof caDraftPress === 'function') return caDraftPress(i, act, btn);
  if (CA_JOBS.includes(a.kind)) return caJobPress(i, act, btn);
  if (a.kind === 'door') return caDoorPress(i, act);
  if (a.kind === 'menu') return caMenuPress(i, act);
  if (a.kind === 'go') return caGoPress(a, act);
  if (a.kind === 'map') return (typeof jmCardPress === 'function') ? jmCardPress(i, act) : undefined;
  if (a.kind === 'here') return caHerePress(a, act);
  if (a.kind === 'cpick') return caPickPress(i, act);
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (a.screen && act === 'reopen'){ caSummaryOpen(a); return; }
  if (a.screen && act === 'history'){ if (c && typeof hbStripBring === 'function') hbStripBring(c.id, 'hist'); return; }
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
  const out = await caPassSend(c, a.person, a.note, { review: a.review });
  a.state = out.state; a.why = out.why;
  /* A PASS IS A HAND-OFF, AND THE SERVER KEEPS ITS RECORD (8 Oct 2026, the
     nine flow rules 3 and 8): the route opened a `look` question for the
     colleague and wrote the History line itself, whether or not the email
     went (caPassSend takes both onto the copy on screen). */
  const said = out.said;
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
/* BOTH BOOKS (the overnight fix round, 15 Oct 2026): the Draft card's own
   example is a sentence Jambo reads, in English and in Svenska — "skriv ett
   NDA med Volvo" was read as a question. The verb ends at a space or the
   sentence's end (an ASCII \b does not end "gör"). */
const CA_DRAFT_RE = /^\s*(?:please\s+|snälla\s+|vänligen\s+)?(?:draft|create|write|prepare|make|start|set up|draw up|skriv|skapa|upprätta|förbered|gör|ta fram|starta|utforma|sätt upp)(?=[\s.,!?:]|$)/i;
const CA_DRAFT_NOUN = /\b(agreement|contract|nda|non-?disclosure|lease|licen[cs]e|mou|memorandum|terms|deed|order|sow|statement of work|addendum|amendment)\b|avtal|kontrakt|överenskommelse|tillägg|beställning|licens/i;
const CA_DRAFT_OPTS = 3;
/* A SENTENCE WITHOUT A VERB STARTS A DRAFT TOO (owner's yes on round 4, 17
   Oct 2026: "NDA with Volvo Cars for a pilot"): it opens on one agreement's
   name — a or an, new, mutual, one-way … allowed before it, never "the" (that
   is a question about one already here) — and names who it is with; a
   question (a "?" or a question word first) is never a draft. */
const CA_DRAFT_BARE = /^\s*(?!(?:the|this|that|these|those|our|their|my|its|den|det|dessa|vårt|vår|våra|deras|mitt|min)\s)(?:(?:an?|new|ett|en|nytt?)\s+)?(?:[\p{L}-]+\s+){0,2}?(?:agreement|contract|nda|non-?disclosure agreement|lease|licen[cs]e|mou|sow|statement of work|addendum|amendment|avtal|kontrakt|sekretessavtal|hyresavtal|licensavtal|tillägg)(?=[\s.,!:]|$)/iu;
const CA_DRAFT_ASKING = /\?|^\s*(?:what|which|who|whom|whose|how|when|where|why|show|list|find|open|are|is|do|does|can|vad|vilka|vilket|vilken|vem|hur|när|var|varför|visa|lista|hitta|öppna|finns)(?=[\s.,!:]|$)/i;
function caIsDraftAsk(q){
  const t = String(q || '');
  if (CA_DRAFT_RE.test(t) && CA_DRAFT_NOUN.test(t)) return true;
  return !CA_DRAFT_ASKING.test(t) && CA_DRAFT_BARE.test(t) && !!caDraftWith(t);
}
function caReadDraft(q){
  if (!caIsDraftAsk(q)) return null;
  if (typeof draftCandidates !== 'function') return null;
  return { kind: 'draft', sentence: String(q).slice(0, (typeof DRAFT_SENTENCE_MAX === 'number') ? DRAFT_SENTENCE_MAX : 2000), state: 'reading', options: null, prefill: {}, why: '', ai: false };
}
/* How many of the sentence's words a candidate's name and purpose share. */
const caDraftWords = s => String(s || '').toLowerCase().split(/[^a-z0-9à-ÿ]+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'agreement', 'contract'].includes(w));
function caDraftScore(sentence, cand){
  const said = new Set(caDraftWords(sentence));
  return caDraftWords(cand.name + ' ' + cand.blurb).reduce((n, w) => n + (said.has(w) ? 1 : 0), 0);
}
/* WHICH WORDS THEY SHARE — the same reading as the score, said once each in
   the candidate's own spelling ("NDA", not "nda"): what a request's panel
   names when it says why a paper fits (round 20, Requests as drawn) */
function caDraftShared(sentence, cand){
  const said = new Set(caDraftWords(sentence));
  const out = [], seen = new Set();
  for (const raw of String((cand && cand.name) || '' ).concat(' ', (cand && cand.blurb) || '').split(/[^A-Za-z0-9À-ÿ]+/)){
    const w = raw.toLowerCase();
    if (!w || seen.has(w) || !said.has(w) || !caDraftWords(raw).length) continue;
    seen.add(w); out.push(raw);
  }
  return out;
}
/* THE THREE CLOSEST, ALWAYS (the gaps, round 4 "One sheet", 18 Oct 2026: "the
   three closest on our paper · nothing is picked for you"): the papers that
   share the most words with the sentence first; where fewer than three share
   one, the next by shelf — company standards, then saved, then HaTi's own
   (draftCandidates' order). A reading, never a pick: the reader still chooses. */
function caDraftRank(sentence, cands, bestId){
  const scored = cands.map((c, i) => ({ c, i, n: caDraftScore(sentence, c) }));
  scored.sort((a, b) => (b.c.id === bestId) - (a.c.id === bestId) || b.n - a.n || a.i - b.i);
  return scored.slice(0, CA_DRAFT_OPTS).map(x => x.c);
}
async function caDraftRun(a){
  const paint = () => { if (typeof renderIntelDock === 'function') renderIntelDock(); };
  try { if (typeof tplLibReady === 'function') await tplLibReady(); } catch (_){}
  let cands = [];
  try { cands = draftCandidates() || []; } catch (_){ cands = []; }
  if (!cands.length){ a.state = 'none'; a.why = _caT('wz_no_templates_role'); paint(); return; }
  a.all = cands;
  /* READ WITHOUT AI (owner picked "One sheet" by name, round 4, 17 Oct 2026):
     the sentence is matched against our paper's names and its "with …" read
     from the words; Jambo spends only on the form's own press, "Let Jambo fill
     the form", its cost said on it. */
  a.options = caDraftRank(a.sentence, cands, null);
  a.bestId = null;
  /* ASKING BRINGS THE PAGE: the one form comes straight to the desk; the
     panel says what was read, in a line, with the way back to the form */
  if (a.options.length && caDraftForm(a)){ a.state = 'opened'; caDraftOneExchange(a); }
  else a.state = a.options.length ? 'ready' : 'none';
  paint();
}
/* ONE SHEET, ONE EXCHANGE (the gaps, round 4, 18 Oct 2026: the panel shows
   only the exchange of the sheet on the desk): a sheet opened from a new
   sentence puts away the exchanges of the sheets before it — their sheet is
   gone, and "Nothing is created until you press Create" would speak of a form
   nobody can press any more. What is not a draft is left exactly as it was. */
function caDraftOneExchange(a){
  const h = (typeof intel === 'object' && intel && Array.isArray(intel.history)) ? intel.history : null; if (!h) return 0;
  const at = h.findIndex(m => m && m.act === a); if (at < 0) return 0;
  let n = 0;
  for (let i = at - 1; i >= 0; i--){
    const m = h[i];
    if (!(m && m.role === 'assistant' && m.act && m.act.kind === 'draft' && m.act !== a)) continue;
    const ask = (i > 0 && h[i - 1] && h[i - 1].role === 'user') ? 1 : 0;
    h.splice(i - ask, 1 + ask); n++; i -= ask;
  }
  return n;
}
/* ---- THE NEW AGREEMENT CARD (the overnight work order, step 3; the owner's
   "Go" on the demo, 14 Oct 2026) ----
   A sentence is answered with ONE card, as the demo draws it: What · From ·
   With · Stream, "Not created yet", Open the form and Change the ask. It
   replaces the three option cards and their Use this (the form beside it has
   its own search of Our paper, so a second list in the panel was a second way
   to one choice). WHAT and FROM are the closest of our own paper — the
   model's pick where Jambo is connected, else the one whose name shares the
   most words with the sentence, and none when nothing shares a word (never a
   guess dressed as a match). WITH is the counterparty the sentence names
   (caDraftWith, a reading of the words, no model), else the model's; none is
   said in amber, because the form will ask it. The STREAM is always the
   form's to ask. NOTHING IS MINTED HERE: Open the form opens the ONE form
   (openNewAgreement, never the two-door menu) with these already in it, and
   Create is still the person's press there (f270's rule). */
/* "with Volvo", "med Volvo": the words after it, up to a mark or a word that
   starts the next thought ("for", "to", "about", "starting" …), or the
   sentence's end. A READING, NEVER A GUESS (the fix round, 15 Oct 2026):
   "with a two-year term", "with mutual confidentiality" and "with payment
   terms of 30 days" name no party, so a reading that opens on an article or
   a number, or carries a word of the deal's terms, is refused — the card
   then says "Not said yet" in amber and the form asks. */
const CA_DRAFT_WITH = /(?:^|\s)(?:with|med)\s+(.+?)(?:\s+(?:for|about|on|regarding|covering|starting|from|by|under|to|that|which|who|including|in|at|until|so|om|för|angående|från|gällande|som|till|i|på|under|tills|inklusive)(?=[\s.,!?]|$).*)?[\s.!?]*$/i;
const CA_DRAFT_WITH_MAX = 120;
const CA_DRAFT_NOT_PARTY = /^(?:a|an|some|any|our|their|its|no|mutual|one|two|three|en|ett|några|vår|vårt|våra|deras|ömsesidig|ömsesidigt|\d.*)$/i;
const CA_DRAFT_TERM_WORD = /(?:^|\s)(?:terms?|clauses?|confidentiality|payments?|days?|weeks?|months?|years?|liability|notice|renewal|exclusivity|warrant(?:y|ies)|indemnit(?:y|ies)|price|pricing|fees?|rates?|cap|deposit|discount|penalt(?:y|ies)|obligations?|conditions?|options?|provisions?|interest|vat|tax|villkor|klausul(?:er)?|sekretess|betalning(?:ar)?|dagar|veckor|månader|år|ansvar|uppsägning|förnyelse|pris|avgift(?:er)?|ränta|moms|skatt)(?=[\s.,!?]|$)/i;
function caDraftWith(sentence){
  const m = CA_DRAFT_WITH.exec(String(sentence || '').trim()); if (!m) return '';
  /* a mark ends the name: "with volvo, for a promotion" names Volvo */
  let who = m[1].split(/[,;:()\[\]]/)[0].replace(/^["“'‘]+|["”'’.!?]+$/g, '').replace(/\s+/g, ' ').trim().slice(0, CA_DRAFT_WITH_MAX);
  /* "with us", "with them" names nobody */
  if (!who || /^(?:us|them|me|you|oss|dem|mig|er)$/i.test(who)) return '';
  /* not a party: an article or a number first, or a word of the terms */
  if (CA_DRAFT_NOT_PARTY.test(who.split(' ')[0])) return '';
  /* "with the Kenya Revenue Authority": the sentence's article is grammar, a name's own "The" is kept */
  who = who.replace(/^the\s+(?=\S)/, '');
  if (CA_DRAFT_TERM_WORD.test(who)) return '';
  /* typed all in small letters, a name is given its capitals; typed with its own ("IKEA", "de Beers") it keeps them */
  if (who === who.toLowerCase()) who = who.replace(/(^|[\s-])(\p{L})/gu, (_, p, ch) => p + ch.toUpperCase());
  return who;
}
/* WHAT THE SENTENCE ASKS FOR, IN ITS OWN WORDS (the gaps, round 4: "with what
   I read: an NDA, with Volvo Cars"): the words before "with", the verb and a
   "please" left off — read, never guessed; too long to be a name of an
   agreement, nothing. English gives it its article ("an NDA", "a supply
   agreement"); the other book takes the words as they were typed. */
const CA_DRAFT_WHAT_MAX = 6;
/* the words themselves, before any article is given them ('' where none name an agreement) */
function caDraftWhatRaw(sentence){
  let t = String(sentence || '').trim();
  const m = /^(.*?)\s+(?:with|med)\s+\S/i.exec(t); if (!m) return '';
  t = m[1].replace(CA_DRAFT_RE, '').replace(/^\s*(?:please|snälla|vänligen)\s+/i, '').trim();
  if (!t || t.split(/\s+/).length > CA_DRAFT_WHAT_MAX || !CA_DRAFT_NOUN.test(t)) return '';
  return t;
}
function caDraftWhatOf(sentence){
  const t = caDraftWhatRaw(sentence); if (!t) return '';
  let lang = 'en'; try { lang = (typeof langId === 'function') ? (langId() || 'en') : 'en'; } catch (_){ lang = 'en'; }
  if (lang !== 'en' || /^(?:a|an|the)\s/i.test(t)) return t;
  const first = t.split(/\s+/)[0];
  const acronym = first.length > 1 && first === first.toUpperCase() && /^[A-Z]/.test(first);
  const an = acronym ? /^[AEFHILMNORSX]/.test(first) : /^[aeiou]/i.test(first);
  return (an ? 'an ' : 'a ') + t;
}
/* THE KIND OF AGREEMENT THE WORDS ASK FOR, for the sheet's "What" (the gaps,
   round 4, 18 Oct 2026: "What · A non-disclosure agreement" — the kind asked
   for, never the closest paper's title, which is step 1's to offer): a short
   name the house knows is written out in the reader's language (CA_DRAFT_KINDS,
   both books); any other is the words as asked, its first letter raised. */
const CA_DRAFT_KINDS = { nda: 'ca_kind_nda', 'non-disclosure agreement': 'ca_kind_nda', 'non disclosure agreement': 'ca_kind_nda', 'nondisclosure agreement': 'ca_kind_nda',
  sla: 'ca_kind_sla', msa: 'ca_kind_msa', dpa: 'ca_kind_dpa', sow: 'ca_kind_sow', 'statement of work': 'ca_kind_sow', mou: 'ca_kind_mou', loi: 'ca_kind_loi' };
function caDraftKindOf(sentence){
  const raw = caDraftWhatRaw(sentence); if (!raw) return '';
  const bare = raw.replace(/^(?:a|an|the|en|ett)\s+/i, '').trim();
  const k = CA_DRAFT_KINDS[bare.toLowerCase()];
  if (k) return _caT(k);
  const t = caDraftWhatOf(sentence) || raw;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
/* WHAT IT IS FOR, READ FROM THE WORDS (the gaps, round 4): "… with Volvo Cars
   for a pilot" — the words after the party's "for", read as "with" is read,
   never guessed: a term ("for two years", "for 30 days") is no purpose, and a
   sentence that does not say is "Not read yet" */
const CA_DRAFT_FOR = /(?:^|\s)(?:with|med)\s+.+?\s(?:for|för)\s+(.+?)[\s.!?]*$/i;
const CA_DRAFT_FOR_MAX = 8;
function caDraftForOf(sentence){
  const m = CA_DRAFT_FOR.exec(String(sentence || '').trim()); if (!m) return '';
  const t = m[1].split(/[,;:()\[\]]/)[0].replace(/^["“'‘]+|["”'’.!?]+$/g, '').replace(/\s+/g, ' ').trim();
  if (!t || t.split(/\s+/).length > CA_DRAFT_FOR_MAX || /\d/.test(t) || CA_DRAFT_TERM_WORD.test(' ' + t)) return '';
  return t;
}
/* the paper the card names: the model's pick, else a name that shares a word with the sentence, else none */
function caDraftBest(a){
  const opts = (a && a.options) || [];
  if (a && a.bestId) return opts.find(o => o.id === a.bestId) || null;
  const o = opts[0];
  return (o && caDraftScore(a.sentence, o) > 0) ? o : null;
}
/* THE MODEL'S READING FIRST where Jambo answered one (it read the whole
   sentence); the words after "with" only where it did not */
/* a HaTi template's document title (TEMPLATES[id].name); our own paper's name is its title */
function caDraftTitleOf(o){
  if (!o) return '';
  if (o.kind === 'builtin' && typeof TEMPLATES === 'object' && TEMPLATES && TEMPLATES[o.id]) return String(TEMPLATES[o.id].name || '');
  return String(o.name || '');
}
function caDraftWho(a){ return String((a && a.prefill && a.prefill.counterparty) || '').trim() || caDraftWith(a && a.sentence); }
/* THE ONE FORM, with what the card read already in it. The values reach only
   the boxes the chosen paper declares (draftApplyPrefill's wall); the
   counterparty is a box every one of the three forms declares, so it waits in
   the form until a template is picked when none was named. */
function caDraftForm(a){
  if (typeof openNewAgreement !== 'function') return false;
  /* THE STREAM IS ASKED, NOT TAKEN (the fix round, 15 Oct 2026; the work
     order and its demo: "Create greyed with its reason until a template and
     a stream are chosen"): opened from Jambo's cards the form's stream box
     starts on none (streamAsk), and the person's choice is the stream */
  if (!a){ openNewAgreement({ streamAsk: true }); return true; }
  const best = caDraftBest(a);
  const prefill = Object.assign({}, (best && typeof draftPrefillFor === 'function') ? draftPrefillFor(best.fields, a.prefill || {}) : {});
  const who = caDraftWho(a); if (who) prefill.counterparty = who;
  /* what it is for, read from the words: it reaches a paper's own purpose box, where one is declared */
  const purpose = caDraftForOf(a.sentence); if (purpose && !prefill.purpose) prefill.purpose = purpose;
  /* ONE SHEET (round 4): NOTHING IS PICKED FOR THE READER — the closest of
     our paper are offered at the top of the form, the best marked; what was
     read from the words is the form's first section */
  const key = o => ({ kind: o.kind === 'builtin' ? 'tid' : o.kind, id: o.id });
  const norm = x => String(x || '').trim().toLowerCase();
  const known = !!who && ((typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : []).some(c => c && norm(c.counterparty) === norm(who));
  openNewAgreement({ pick: null, prefill, asked: a.sentence, streamAsk: true,
    closest: (a.options || []).map(key), best: best ? key(best) : null,
    words: { what: caDraftKindOf(a.sentence) || (best ? (caDraftTitleOf(best) || best.name) : ''), who, known, purpose } });
  return true;
}
function caDraftCardHtml(a, i){
  const B = (act, label, lead, extra) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}"${extra || ''}>${_caE(label)}</button>`;
  if (a.state === 'reading') return `<div class="ca-card"><p class="ca-foot" style="margin:0">${(typeof busyHtml === 'function') ? busyHtml(_caT('ca_draft_reading')) : _caE(_caT('ca_draft_reading'))}</p></div>`;
  /* no paper on any shelf this person may draft from: said, with the request as the way forward */
  if (a.state === 'none' && !(a.options || []).length){
    const req = (typeof openIntakeForm === 'function') ? `<div class="ca-acts">${B('request', _caT('ca_draft_request'), true)}</div>` : '';
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_draft_nothing'))}</div>${a.why ? `<p class="ca-why">${_caE(a.why)}</p>` : ''}${req}</div>`;
  }
  const best = caDraftBest(a), who = caDraftWho(a);
  /* THE FORM IS ON THE DESK (round 4, "One sheet"): no card — what was read,
     in his own words, and the form one press away should it have been closed */
  if (a.state === 'opened'){
    /* as drawn: what was read — the agreement the words name, and with whom */
    const what = caDraftWhatOf(a.sentence);
    /* AS DRAWN, THE PARTY AND THE PAPER IN BOLD ("with **Volvo Cars** … our
       **Mutual NDA**"): marked before the line is escaped, made bold after */
    const bo = t => '\u0001' + t + '\u0002';
    const read = what && who ? _caT('ca_dr_opened_what_with', { what, who: bo(who) }) : what ? _caT('ca_dr_opened_what', { what })
      : who ? _caT('ca_dr_opened_with', { who: bo(who) }) : _caT('ca_dr_opened');
    const said = [read, best ? _caT('ca_dr_opened_best', { name: bo(best.name) }) : '', _caT('ca_dr_opened_tail')].filter(Boolean).join(' ');
    const html = _caE(said).replace(/\u0001/g, '<b>').replace(/\u0002/g, '</b>');
    return `<div class="ca-card ca-dr-said" data-ca-card="${i}"><p class="ca-say">${html}</p><div class="ca-acts">${B('form', _caT('ca_dr_open_again'), false)}${B('ask', _caT('ca_dr_change'), false)}</div></div>`;
  }
  const may = (typeof canEdit !== 'function') || canEdit();
  /* AS THE DEMO DRAWS IT: WHAT is the agreement the paper makes (a HaTi
     template's own title, "Mutual Non-Disclosure Agreement"), FROM is the
     paper it starts from — its name where that is not the title already,
     then its shelf */
  const what = best ? (caDraftTitleOf(best) || best.name) : _caT('ca_dr_what_none');
  const shelf = best ? ((typeof draftBucketLabel === 'function' && draftBucketLabel(best.kind)) || '') : '';
  const from = best ? [best.name !== what ? best.name : '', shelf].filter(Boolean).join(' · ') : _caT('ca_dr_from_none');
  const rows = [
    [_caT('ca_dr_what'), _caE(what)],
    [_caT('ca_dr_from'), _caE(from)],
    [_caT('ca_dr_with'), who ? _caE(who) : `<span class="ca-dr-owed">${_caE(_caT('ca_dr_with_none'))}</span>`],
    [_caT('ca_dr_stream'), `<span class="ca-dr-quiet">${_caE(_caT('ca_dr_stream_form'))}</span>`],
  ];
  const dl = `<dl class="ca-dl">${rows.map(([k, v]) => `<dt>${_caE(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  /* A DEAD BUTTON SAYS WHY: a viewer may not create, and the card says so where HaTi knows it */
  const no = _caT('wz_viewers_no_create');
  const open = may ? B('form', _caT('ca_dr_open'), true)
    : `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" disabled aria-disabled="true" title="${_caE(no)}">${_caE(_caT('ca_dr_open'))}</button>`;
  /* NO SILENT FAILURE: with no model, or a model that failed, the card says how it matched */
  const note = a.aiError ? `<p class="ca-foot">${_caE(a.aiError)}</p>` : !a.ai ? `<p class="ca-foot">${_caE(_caT('ca_dr_no_ai'))}</p>` : '';
  return `<div class="ca-card ca-dr" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_dr_new'))}<span class="ca-dr-sp"></span><span class="pd-pill is-quiet"><i></i>${_caE(_caT('ca_dr_not_yet'))}</span></div>
    ${dl}${may ? '' : `<p class="ca-why">${_caE(no)}</p>`}<div class="ca-acts">${open}${B('ask', _caT('ca_dr_change'), false)}</div>${note}</div>`;
}
function caDraftPress(i, act, btn){
  const m = caTurn(i); const a = m && m.act; if (!a) return;
  if (act === 'request'){ if (typeof openIntakeForm === 'function') openIntakeForm({ need: a.sentence, title: (typeof intakeTitleFrom === 'function') ? intakeTitleFrom(a.sentence) : '' }); return; }
  if (act === 'form'){ caDraftForm(a); return; }
  /* CHANGE THE ASK: the sentence goes back into the box, to be said again */
  if (act === 'ask'){
    const inp = (typeof document !== 'undefined') ? document.getElementById('igd-input') : null; if (!inp) return;
    inp.value = a.sentence || '';
    try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (_){}
    if (typeof chatFieldGrow === 'function') chatFieldGrow(inp);
  }
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
  ['amend', /\b(?:make|create|start|draft)\b[^.?!]*\bamendment\b|\bamend (?:it|this|the)\b|^\s*(?:please\s+)?(?:amend|an? amendment|amendments?|ändra avtalet|tillägg)\s*[.!?]?\s*$/i],
  ['memo', /\bstatus (?:note|update|memo|report)\b|\bnegotiation memo\b/i],
  ['open', /\bwhat(?:'s| is)? (?:still )?open\b|\bwhere (?:does|do) (?:the deal|we|it) stand\b/i],
  ['minor', /\baccept\b[^.?!]*\b(?:small|minor|wording)\b/i],
  ['counter', /^\s*(?:please\s+)?counter\b/i],
  ['lock', /\b(?:hand|give|pass)\b[^.?!]*\block\b/i],
];
/* THE WORD DOOR SENDS A WORD COPY OUT (owner, 18 Oct 2026: "Fix the Word
   file door misread next"): "add a word file", "upload a word file", "we got
   a word copy", "import the word file" bring one in, and "download a word
   copy" keeps one here — none of them is a copy for the other side, unless
   the words also send it ("send them the word file"). */
const CA_DOOR_NOT = {
  word: t => !CA_FILE_OUT.test(t) && (CA_MENU_INBOUND.test(t) || CA_FILE_KEEP.test(t)),
};
function caReadDoor(q){
  const hit = CA_DOORS.find(([k, re]) => re.test(q) && !(CA_DOOR_NOT[k] && CA_DOOR_NOT[k](q))); if (!hit) return null;
  const c = caFindContract(q); if (!c) return null;
  return { kind: 'door', door: hit[0], cid: c.id, state: 'ready' };
}
/* the Signing tab's own approval card (#sa-card): asked and reminded there */
/* since stage 5 of the one-page Home plan, Jambo's Before you sign face on
   Home (pdSignOpen); the phone keeps the room's own */
function caRoomSign(c){
  if (typeof pdSignOpen === 'function' && !(typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 768) && pdSignOpen(c.id)) return;
  if (typeof openWorkspace === 'function') openWorkspace(c.id); if (typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id) || c, 'sign'); } catch (_){} }
const CA_DOOR_GO = {
  sendback: c => (typeof pdSendWaiting === 'function') ? pdSendWaiting(c) : (typeof openRedlineWorkbench === 'function' && openRedlineWorkbench(c.id)),
  signlink: c => openShareModal(c, { purpose: 'sign' }),
  resend: c => openShareModal(c, { purpose: 'negotiate' }),
  adviser: c => openShareModal(c, { purpose: 'advise' }),
  word: c => openShareModal(c, { purpose: 'negotiate' }),
  approval: c => caRoomSign(c),
  chase: c => pdOpenOnHome(c.id, 'oblig'),
  done: c => pdOpenOnHome(c.id, 'oblig'),
  /* the one end-or-pause door, its hold answer chosen (owner picked "One question", 15 Oct 2026) */
  hold: c => (typeof endOrPauseOpen === 'function') ? endOrPauseOpen(getContract(c.id) || c, { pick: 'hold' }) : false,
  refile: c => { if (typeof openWorkspace === 'function') openWorkspace(c.id); if (typeof ovOpenFiling === 'function') ovOpenFiling(getContract(c.id) || c); },
  /* the Amend face beside the signed paper (owner, 15 Oct 2026); the dialog where Home has no paper */
  amend: c => ((typeof pdAmendOpen === 'function' && pdAmendOpen(c.id)) ? true : openCreateAmendmentModal(getContract(c.id) || c)),
  memo: c => openNegoMemo(getContract(c.id) || c),
  /* the Board's deal board view went (owner, 15 Oct 2026): a point opens on Jambo's Redlines face */
  open: c => (typeof pdRedOpen === 'function') ? pdRedOpen(c.id) : openRedlineWorkbench(c.id),
  minor: c => (typeof pdRedOpen === 'function') ? pdRedOpen(c.id) : openRedlineWorkbench(c.id),
  counter: c => openRedlineWorkbench(c.id),
  lock: c => openRedlineWorkbench(c.id),
};
/* the function each door needs, so a stage that does not load it greys the card in words */
/* A DOOR THIS CONTRACT HAS SHUT SAYS WHY, AND OFFERS NO BUTTON (owner, 15 Oct
   2026: "a button that will not take you anywhere is a waste — simply give a
   reason"): the door's own answer, never a second rule */
const CA_DOOR_SHUT = { amend: c => (typeof amendmentShutWhy === 'function') ? amendmentShutWhy(c) : '' };
const CA_DOOR_NEEDS = { sendback: 'openRedlineWorkbench', signlink: 'openShareModal', resend: 'openShareModal', adviser: 'openShareModal', word: 'openShareModal',
  approval: 'openWorkspace', chase: 'pdOpenOnHome', done: 'pdOpenOnHome', hold: 'contractSetHold', refile: 'ovOpenFiling', amend: 'openCreateAmendmentModal',
  memo: 'openNegoMemo', open: 'openRedlineWorkbench', minor: 'openRedlineWorkbench', counter: 'openRedlineWorkbench', lock: 'openRedlineWorkbench' };
function caDoorCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  const head = c ? `<dl class="ca-dl"><dt>${_caE(_caT('ca_l_contract'))}</dt><dd>${_caE(caRef(c) + ' · ' + (c.name || ''))}</dd></dl>` : '';
  const may = !!(c && typeof window[CA_DOOR_NEEDS[a.door]] === 'function');
  const shut = c && CA_DOOR_SHUT[a.door] ? CA_DOOR_SHUT[a.door](c) : '';
  return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_door_' + a.door))}</div>${head}
    <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_door_' + a.door + '_says'))}</p>
    ${a.state === 'done' ? `<p class="ca-said is-ok">${_caE(_caT('ca_job_opened'))}</p>`
      : shut ? `<p class="ca-why">${_caE(shut)}</p>`
      : may ? `<div class="ca-acts">${B('door', _caT('ca_door_' + a.door + '_go'), true)}</div>`
      : `<p class="ca-why">${_caE(_caT('ca_door_cannot'))}</p>`}</div>`;
}
async function caDoorPress(i, act){
  const m = caTurn(i); const a = m && m.act; if (!a || act !== 'door') return;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  if (CA_DOOR_SHUT[a.door] && CA_DOOR_SHUT[a.door](c)) return;
  const go = CA_DOOR_GO[a.door]; if (typeof go !== 'function') return;
  let r = null;
  try { r = await go(c); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
  if (r === false) return;
  a.state = 'done';
  if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
}

/* ---- ASK JAMBO FOR ANY MENU ROW (owner, 15 Oct 2026: "You can ask jambo for
   share or, negotiate or export, add a signed document or ask adviser etc. You
   can ask in short or in full and the button comes up on hati in an instant") ----
   Read from the words alone (no model, nothing spent). The card's button IS the
   Menu tab's own row (pdMenuGroups, the ⋯ menu's builder), with its own label
   and, where it is grey, its own reason; a press opens the Menu tab on that
   contract and presses that row (pdMenuPress), so the card and the row are one
   act (rule 2) and nothing happens until the person presses (rule 7). Older
   readings keep their words: share, negotiate, sign and fill are places, the
   adviser link, the memo and an amendment are doors. */
const CA_MENU = [
  ['export', /^\s*(?:please\s+)?(?:export|download|print|exportera|ladda ner|skriv ut)\b(?![^.?!]*\b(?:pdf|word)\b)/i, ['#ws-pdf', '#ws-word', '#ws-pdf-record']],
  ['pdf', /\bpdf\b|\bclean copy\b|\bren kopia\b/i, ['#ws-pdf']],
  ['wordx', /\b(?:export|download|save|exportera|ladda ner|spara)\b[^.?!]*\bword\b|\b(?:as|in|to|till|som) (?:an? |en )?word\b/i, ['#ws-word']],
  ['record', /\b(?:sealed|audit)\s+(?:record|copy|trail)\b/i, ['#ws-pdf-record']],
  ['signed', /\b(?:add|attach|link|upload|lägg till|bifoga)\b[^.?!]*\b(?:signed|undertecknat)\b|\bsigned (?:document|copy|agreement)\b/i, ['#ws-m-link']],
  ['adviser', /\b(?:ask|consult|get|fråga)\b[^.?!]*\b(?:adviser|advisor|lawyer|counsel|rådgivare|jurist)\b|^\s*(?:an? )?(?:adviser|advisor|rådgivare)\s*$/i, ['#ws-advice']],
  ['import', /\bimport\b|\bimportera\b|\btheir (?:word )?(?:file|response|markup)\b/i, ['#ws-import']],
  ['compare', /\bcompare\b|\bjämför\b/i, ['#ws-compare']],
  ['signers', /\bsigners?\b|\bsignerare\b/i, ['#ws-m-signers']],
  ['filing', /\bfiling\b|\barkivering\b|\bstream\b/i, ['#ws-filing']],
  ['mynote', /\bmy notes?\b|\bprivate note\b|\bmina anteckningar\b/i, ['#ws-mynote']],
  /* the way back keeps its own rows; ending or pausing is the one door (End or pause, 15 Oct 2026) */
  ['restore', /\bunarchive\b|\brestore\b|\båterställ\b/i, ['#ws-archive']],
  ['release', /\brelease\b|\bsläpp\b|\bunfreeze\b/i, ['#ws-hold']],
  ['end', /\barchive\b|\barkivera\b|\bhold\b|\bpausa\b|\bfreeze\b|\bfrys\b|\bdecline\b|\bavböj\b|\bend or pause\b|\bclose (?:this|it|the deal|the contract)\b|\bstäng (?:det|avtalet|affären)\b/i, ['#ws-end']],
  ['reopen', /\bre-?open\b|\böppna igen\b/i, ['#ws-reopen']],
  ['delete', /\bdelete\b|\bradera\b|\bta bort utkastet\b/i, ['#ws-delete']],
  ['review', /\b(?:ask for|internal|request a?)\s*review\b|\bgranskning\b/i, ['[data-ig-review]']],
  ['playbook', /\bplaybook\b|\bcheck\b[^.?!]*\bstandards\b/i, ['[data-ig-pbreview]']],
  ['prepare', /\bdraft from (?:our )?standards\b|\bprepare (?:the )?redlines\b/i, ['[data-rl-prepare]']],
  ['addclause', /\badd (?:a |new |another )?clause\b|\blägg till (?:en )?klausul\b/i, ['[data-rl-add-clause]']],
  ['editclause', /\bedit (?:a |the |this )?clause\b|\bredigera (?:en )?klausul\b/i, ['[data-rl-edit-clause]']],
];
const CA_MENU_MAX = 140;
/* a question about the thing ("who are the signers?") is for Jambo to answer, not a press */
const CA_MENU_ASKS = /^\s*(?:what|who|whom|why|how|when|which|where|vad|vem|varför|hur|när|vilken|vilka)\b/i;   // a longer question is a question for the model, not a press
/* TWO ROWS THAT MISREAD A FILE COMING IN (owner, 18 Oct 2026: "Fix the Menu
   reader's pdf and import misreads"). The PDF row is a copy going OUT: "I want
   to upload a pdf", "add a signed pdf", "we got a pdf" bring a file in, so the
   row is not read and the words go on to the doors that bring one in (the
   signed-document row, the upload). The import row brings in THEIR file — the
   other side's Word response — so it is read only where the words say whose:
   "import from excel" and "import our old contracts" are the Import page's. */
const CA_MENU_INBOUND = /(?<!\p{L})(?:upload\p{L}*|attach\p{L}*|scan\p{L}*|drop\p{L}*|add(?:s|ed|ing)?|receiv\p{L}*|got|bring(?:ing)? in|import\p{L}*|ladda(?:r|de)? upp|bifoga\p{L}*|lägg(?:a|er)? (?:in|till)|skanna\p{L}*|fått|fick)(?!\p{L})/iu;
const CA_MENU_THEIR_FILE = /(?<!\p{L})(?:their|them|the other side|counterparty|response|reply|markup|mark-up|redlines?|changes|word|deras|motparten|svar(?:et)?|ändringar(?:na)?)(?!\p{L})/iu;
/* words that send a copy OUT to someone, and words that keep one HERE (the Word door, above) */
const CA_FILE_OUT = /(?<!\p{L})(?:send|sending|share|sharing|e-?mail|mail|forward|skicka|dela|mejla|maila)(?!\p{L})/iu;
const CA_FILE_KEEP = /(?<!\p{L})(?:download\p{L}*|export\p{L}*|save|print|exportera|ladda ner|spara|skriv ut)(?!\p{L})/iu;
const CA_MENU_NOT = {
  pdf: t => CA_MENU_INBOUND.test(t),
  import: t => !CA_MENU_THEIR_FILE.test(t),
  /* the Word download is a copy going out too: "upload it as word" is not it (18 Oct 2026) */
  wordx: t => CA_MENU_INBOUND.test(t) && !CA_FILE_OUT.test(t),
};
function caReadMenu(q){
  const t = String(q || ''); if (t.length > CA_MENU_MAX || CA_MENU_ASKS.test(t)) return null;
  const hit = CA_MENU.find(([k, re]) => re.test(t) && !(CA_MENU_NOT[k] && CA_MENU_NOT[k](t))); if (!hit) return null;
  const c = caFindContract(t); if (!c) return null;
  return { kind: 'menu', menu: hit[0], sels: hit[2], cid: c.id, state: 'ready' };
}
/* the Menu tab's rows as drawn for this contract, by selector (a row the
   contract does not offer is absent; a grey one keeps its reason) */
function caMenuRows(c, sels){
  if (typeof document === 'undefined' || typeof pdMenuGroups !== 'function') return [];
  const box = document.createElement('div');
  try { box.innerHTML = pdMenuGroups(c).map(g => g.rows.join('')).join(''); } catch (_){ return []; }
  return sels.map(sel => {
    const b = box.querySelector(sel); if (!b) return null;
    const x = b.cloneNode(true); x.querySelectorAll('[aria-hidden="true"], svg, .mnote').forEach(n => n.remove());
    return { sel, word: x.textContent.replace(/\s+/g, ' ').trim(), off: !!b.disabled, why: b.disabled ? (b.getAttribute('title') || '') : '' };
  }).filter(Boolean);
}
function caMenuCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  const rows = c ? caMenuRows(c, a.sels || []) : [];
  const head = c ? `<dl class="ca-dl"><dt>${_caE(_caT('ca_l_contract'))}</dt><dd>${_caE(caRef(c) + ' · ' + (c.name || ''))}</dd></dl>` : '';
  const live = rows.filter(r => !r.off);
  const btns = rows.map((r, k) => `<button type="button" class="ui-btn ui-btn-sm${!r.off && r === live[0] ? ' ui-btn-primary' : ''}" data-ca-act="menu:${k}" data-ca-turn="${i}"${r.off ? ` disabled aria-disabled="true" title="${_caE(r.why)}"` : ''}>${_caE(r.word)}</button>`).join('');
  const why = rows.length && !live.length ? rows.map(r => r.why).filter(Boolean)[0] || '' : '';
  return `<div class="ca-card" data-ca-card="${i}" data-ca-menu="${_caE(a.menu)}"><div class="ca-ct">${_caE(_caT('ca_menu_title'))}</div>${head}
    ${a.state === 'done' ? `<p class="ca-said is-ok">${_caE(_caT('ca_job_opened'))}</p>`
      : rows.length ? `<div class="ca-acts">${btns}</div>${why ? `<p class="ca-why">${_caE(why)}</p>` : `<p class="ca-foot">${_caE(_caT('ca_menu_foot'))}</p>`}`
      : `<p class="ca-why">${_caE(_caT('ca_menu_none'))}</p>`}</div>`;
}
function caMenuPress(i, act){
  const m = caTurn(i); const a = m && m.act; if (!a || !String(act).startsWith('menu:')) return;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  const r = caMenuRows(c, a.sels || [])[Number(String(act).slice(5))];
  if (!r || r.off || typeof pdMenuPress !== 'function') return;
  if (pdMenuPress(c.id, r.sel) === false) return;
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
const CA_CHIPS = ['redline', 'sign', 'history'];
const CA_CHIPS_WALL = ['upload', 'draft', 'board', 'calendar'];
/* ON THE WALL THE TWO WAYS IN ARE SAID IN FULL (the overnight work order,
   steps 3 and 4): "upload a document" first, "draft a new agreement" — words
   Jambo reads (CA_PLACES), so the chip and the typed word are one path */
const CA_CHIP_WALL_WORD = { upload: 'ca_wall_upload', draft: 'ca_wall_draft' };
function caChipLead(c){
  let need = [];
  try { need = ((typeof needsYouOf === 'function') ? needsYouOf(c) : []).map(x => x && x.kind); } catch (_){ need = []; }
  if (need.includes('details')) return 'fill';
  if (need.includes('quiet') || need.includes('refused') || need.includes('suggest')) return 'redline';
  if (need.includes('sign')) return 'sign';
  return null;
}
/* A CHIP IS A DOOR THAT OPENS (the one-page Home plan, stage 6, 14 Oct 2026):
   a word whose door is shut for THIS contract — the redlines of a signed, held,
   handed-over or archived one, negoMayStart's own answer — is not offered (the
   owner's rule for a choice that cannot give a result, 10 Oct 2026), and the
   next useful word takes its place. Typed, the word still meets the door's
   own reason. */
const CA_CHIPS_MORE = ['oblig', 'share'];
function caChipShut(c, k){
  if (k === 'redline' || k === 'answer') return typeof negoMayStart === 'function' && !negoMayStart(c).ok;
  /* NO BUTTON THAT TAKES YOU NOWHERE (owner, 15 Oct 2026): nothing is left to
     sign on an executed or expired agreement; an amendment asks its own one
     answer (amendmentShutWhy); "edit a clause" only where the Edit a clause
     row itself is live */
  if (k === 'sign') return !!((typeof negoExecuted === 'function' && negoExecuted(c)) || (typeof contractExpired === 'function' && contractExpired(c)));
  if (k === 'amend') return !(typeof pdAmendMay === 'function' && pdAmendMay(c));
  if (k === 'edit') return !caEditChipBtn(c);
  if (k === 'fill') return caChipLead(c) !== 'fill';
  return false;
}
/* THE EDIT A CLAUSE ROW, AS ITS OWN BUILDER DRAWS IT (rlEditClauseBtnHtml): the
   chip is offered only on Jambo's Redlines face, where the row opens the
   clause editor, and only when that row is live (not frozen, a wide enough
   window, someone who may edit) */
function caEditChipBtn(c){
  if (!c || typeof document === 'undefined' || typeof rlEditClauseBtnHtml !== 'function' || typeof rlEditClausePress !== 'function') return null;
  if (!(typeof pdRedShows === 'function' && pdRedShows())) return null;
  if (typeof canEdit === 'function' && !canEdit()) return null;
  /* the empty column already shows its own Edit a clause: no second button for it */
  if (document.querySelector && document.querySelector('#pd-redface [data-rl-edit-first]')) return null;
  const box = document.createElement('div');
  try { box.innerHTML = rlEditClauseBtnHtml(c, { side: 'owner', cpPanel: false }, 'owner', ''); } catch (_){ return null; }
  const b = box.querySelector('[data-rl-edit-clause="editor"]');
  return b && !b.disabled ? b : null;
}
/* ---- WHAT COMES NEXT (owner, 15 Oct 2026: "there is no point of having the
   redline button ... because you are already looking at it, so it should
   transition to ... the next natural step") ----
   The ONE reading the chips and Jambo's "what's next?" card both draw, so they
   cannot disagree:
   - work owed leads (caChipLead, the side panel's own checklist);
   - then the next stage of the contract's journey: on Redlines, editing a
     clause and then Before you sign; before signing, redlines → share → sign;
     once signed, obligations → amend → history;
   - never the face that is open now (fill · redlines · before you sign ·
     amend), and never a door this contract has shut (caChipShut).
   Read live, spends nothing, writes nothing. */
const CA_NEXT_FACE = { fill: 'fill', red: 'redline', signing: 'sign', amend: 'amend' };
/* FOUR, AS ROUND 3 DRAWS THEM ("answer the redlines · name a signer · share ·
   history"; the owner's "build all the gaps", 18 Oct 2026) */
const CA_NEXT_MAX = 4;
/* ---- WHAT IS OWED HERE, FIRST (round 3 as drawn) ----
   The checklist's lead (caChipLead) and the two owed facts the glance says
   beside the paper: their asks waiting on us (negoNeedsYouIds, RAW) — the
   redline chip then says "answer the redlines" and opens them — and nobody
   named to sign while signing is ahead (signBlockers' own 'signers') — "name
   a signer", the route editor's own door. Read live; writes nothing. */
function caOwedSteps(c){
  const out = []; if (!c) return out;
  const lead = caChipLead(c);
  let asks = 0; try { asks = (typeof negoNeedsYouIds === 'function') ? negoNeedsYouIds(c).length : 0; } catch (_){ asks = 0; }
  if (lead && !(lead === 'redline' && asks)) out.push(lead);
  if (asks) out.push('answer');
  let nobody = false;
  try { nobody = (typeof pdSignAhead !== 'function' || pdSignAhead(c)) && typeof signBlockers === 'function' && signBlockers(c).some(b => b && b.key === 'signers'); } catch (_){ nobody = false; }
  if (nobody) out.push('signer');
  return out;
}
/* the owed step that stands for a ladder step: answering is redlining, naming a signer is the way to signing */
const CA_OWED_FOR = { answer: 'redline', signer: 'sign' };
function caNextSteps(c){
  if (!c) return [];
  const face = (typeof pdFaceNow === 'function') ? pdFaceNow() : '';
  const here = CA_NEXT_FACE[face] || '';
  const executed = !!(typeof negoExecuted === 'function' && negoExecuted(c));
  const ladder = executed ? ['oblig', 'amend', 'history']
    : face === 'red' ? ['edit', 'sign', 'share']
    : ['redline', 'share', 'sign'];
  const owed = executed ? [] : caOwedSteps(c);
  const covered = new Set(owed.map(k => CA_OWED_FOR[k]).filter(Boolean));
  return owed.concat(ladder, ['history', 'oblig', 'share'])
    .filter((k, i, all) => all.indexOf(k) === i && k !== here && CA_OWED_FOR[k] !== here && !covered.has(k) && !caChipShut(c, k))
    .slice(0, CA_NEXT_MAX);
}
/* a step's words: a place word Jambo reads (ca_w_*), or the ones that press
   their own row (edit a clause, amend) or door (answer the redlines → the
   Redlines face; name a signer → the route editor) */
const CA_NEXT_GO = ['edit', 'amend', 'answer', 'signer'];
function caNextLabel(k){ return CA_NEXT_GO.includes(k) ? _caT('ca_next_' + k) : _caT('ca_w_' + k); }
/* a step pressed: a place is asked as its word (one path with typing,
   caReadPlace); edit and amend press the act their row presses */
function caNextRun(c, k){
  if (!c) return false;
  if (k === 'edit'){ const b = caEditChipBtn(c); return b ? rlEditClausePress(getContract(c.id) || c, b) : false; }
  if (k === 'amend') return (typeof pdAmendOpen === 'function') ? pdAmendOpen(c.id) : false;
  if (k === 'answer') return CA_GO.redline(c);
  if (k === 'signer') return (typeof openSignerPlanEditor === 'function') ? (openSignerPlanEditor(getContract(c.id) || c), true) : CA_GO.sign(c);
  if (typeof intelAsk === 'function') return intelAsk(_caT('ca_w_' + k));
  return false;
}
/* who may bring a contract in: an editor (a viewer's upload is refused at the creator too) */
function caMayAdd(){ return (typeof canEdit !== 'function') || !!canEdit(); }
function caPaperChips(){
  if (typeof igHomePaperFace !== 'function' || igHomePaperFace() !== true) return null;
  const c = caOpenContract();
  /* a viewer adds nothing: the upload chip steps aside, as a shut door's chip does on a paper (caChipShut) */
  if (!c) return CA_CHIPS_WALL.filter(k => k !== 'upload' || caMayAdd()).map(k => ({ ask: _caT(CA_CHIP_WALL_WORD[k] || ('ca_w_' + k)), k }));
  /* work owed leads, in the accent's outline (the first owed step; round 3 as drawn) */
  const lead = (caOwedSteps(c)[0]) || caChipLead(c);
  return caNextSteps(c).map(k => CA_NEXT_GO.includes(k) ? { go: k, label: caNextLabel(k), k, owed: k === lead } : { ask: _caT('ca_w_' + k), k, owed: k === lead });
}
function caChipsHtml(){
  /* the person turned Jambo's suggestions off (You · How you like to work) */
  if (typeof jamboChipsOn === 'function' && !jamboChipsOn()) return '';
  const L = caPaperChips(); if (!L) return '';
  return L.map(x => x.go
    ? (x.owed ? `<button type="button" data-ca-next="${_caE(x.go)}" data-ca-chip="${_caE(x.k)}" class="ca-chip-owed text-[10.5px] rounded-full bg-canvas hover:bg-brand-50 px-2.5 py-1 transition text-left">${_caE(x.label)}</button>`
      : `<button type="button" data-ca-next="${_caE(x.go)}" data-ca-chip="${_caE(x.k)}" class="text-[10.5px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition text-left">${_caE(x.label)}</button>`)
    : x.owed
    ? `<button type="button" data-igsug="${_caE(x.ask)}" data-ca-chip="${_caE(x.k)}" class="ca-chip-owed text-[10.5px] rounded-full bg-canvas hover:bg-brand-50 px-2.5 py-1 transition text-left">${_caE(x.ask)}</button>`
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
  const b = e.target && e.target.closest ? e.target.closest('#ig-dock [data-ca-next]') : null; if (!b) return;
  caNextRun(caOpenContract(), b.getAttribute('data-ca-next'));
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
  /* NOT NEGOTIATED YET (owner, 15 Oct 2026: a highlight's Comment lost its
     words): with no baseline on the record the paper as drawn is the only
     reading of which clause the words sit in, so its own clause id carries the
     note — read RAW, nothing initialised. Once negotiated, only a clause the
     baseline holds. */
  if (id && !(c && c.negotiation && c.negotiation.baselineBody)) return id;
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
Object.assign(window, { caRefFix, CA_REF_RE, caRefLinkPaint, caRefOpen, CA_MENU, CA_MENU_INBOUND, CA_MENU_THEIR_FILE, CA_FILE_OUT, CA_FILE_KEEP, CA_MENU_NOT, caReadMenu, caMenuRows, caMenuCardHtml, caMenuPress, CA_DOORS, CA_DOOR_NOT, caReadDoor, caRoomSign, CA_DOOR_GO, CA_DOOR_SHUT, CA_DOOR_NEEDS, caDoorCardHtml, caDoorPress });
Object.assign(window, { CA_SUMMARY_RE, caSummaryText, caSummaryOpen, caScreenSent, caPassSend, caPeopleFor, caPersonRowHtml, caScreenCardHtml });
Object.assign(window, { CA_PICK_MAX, CA_NOTE_MAX, CA_SEND_RE, caPeople, caContracts, caOpenContract, caTokenAt, caMatches, caPopHtml, caPopClose, caPopRead, caChoose,
  caFindContract, caFindPerson, caNoteOf, caReadSend, caActOf, caSendBlock, caCardHtml, caCardPress,
  CA_DRAFT_RE, CA_DRAFT_NOUN, CA_DRAFT_OPTS, CA_DRAFT_BARE, CA_DRAFT_ASKING, caIsDraftAsk, caReadDraft, caDraftWords, caDraftScore, caDraftShared, caDraftRank, caDraftRun, caDraftCardHtml, caDraftPress, CA_DRAFT_WITH, CA_DRAFT_WITH_MAX, caDraftWith, CA_DRAFT_NOT_PARTY, CA_DRAFT_TERM_WORD, caDraftBest, caDraftTitleOf, caDraftWho, caDraftForm, CA_DRAFT_WHAT_MAX, caDraftWhatRaw, caDraftWhatOf, CA_DRAFT_KINDS, caDraftKindOf, CA_DRAFT_FOR, CA_DRAFT_FOR_MAX, caDraftForOf, caDraftOneExchange,
  CA_JOBS, CA_JOB_RE, caReadJob, caNamedOrUp, caRowsWithQuotes, caRiskList, caObligList, caListCardHtml, caReadyDoor, caJobCardHtml, caJobPress, caMayAdd, caPaperChips, caChipsHtml, caNextSteps, caNextRun, caChipShut, caNextLabel, caEditChipBtn, CA_NEXT_FACE, CA_NEXT_MAX, CA_NEXT_GO, caOwedSteps, CA_OWED_FOR,
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
  { k: 'sign', need: 'one', w: ['sign', 'signing', 'before you sign', 'signera', 'signering', 'underteckna', 'innan du signerar'] },
  { k: 'share', need: 'one', w: ['share', 'send', 'dela', 'skicka'] },
  { k: 'fill', need: 'one', w: ['fill', 'fill in', 'fill in the details', 'details', 'fyll i', 'fyll i uppgifterna', 'uppgifter', 'detaljer'] },
  { k: 'oblig', need: 'any', w: ['obligations', 'duties', 'åtaganden', 'skyldigheter'] },
  { k: 'history', need: 'any', w: ['history', 'trail', 'historik', 'historiken'] },
  /* A CONTRACT'S BRIEF (owner, 19 Oct 2026: "briefing for contracts mk 345"):
     the paper's own "Read the brief" door (caBriefOpen → openCheckPanel), a
     kept brief free, none kept says Write the brief and its cost */
  { k: 'brief', need: 'one', w: ['brief', 'briefing', 'the brief', 'its brief', 'read the brief', 'summary', 'summarise', 'summarize', 'sammanfattning', 'sammanfattningen', 'sammanfatta', 'briefen', 'läs sammanfattningen'] },
  { k: 'board', w: ['board', 'tavla', 'tavlan'] },
  /* "needs me" (Jambo's note, 15 Oct 2026): the Board's Needs you card, every item */
  { k: 'needs', w: ['needs me', 'what needs me', 'needs you', 'what needs you', 'waiting on me', 'what is waiting on me', "what's waiting on me", 'väntar på mig', 'vad väntar på mig', 'behöver mig', 'vad behöver mig'] },
  /* the tab is called Workspace since 15 Oct 2026 (owner): its name opens it, and the old words still do */
  { k: 'document', w: ['workspace', 'the workspace', 'arbetsyta', 'arbetsytan', 'document', 'paper', 'dokument', 'dokumentet', 'papperet', 'pappret'] },
  { k: 'calendar', w: ['calendar', 'kalender', 'kalendern'] },
  { k: 'explorer', w: ['explorer', 'utforskaren'] },
  /* THE CONTRACTS PLACE (the overnight work order, step 7): "contracts" opens
     the place as it was last looked at; "wall" and "list" switch its view */
  { k: 'contracts', w: ['contracts', 'all contracts', 'every contract', 'another contract', 'my contracts', 'avtal', 'alla avtal', 'avtalen', 'ett annat avtal', 'mina avtal'] },
  { k: 'wall', w: ['wall', 'the wall', 'wall of paper', 'wall of papers', 'vägg', 'väggen', 'som vägg'] },
  { k: 'list', w: ['list', 'the list', 'as a list', 'lista', 'listan', 'som lista', 'som en lista'] },
  /* the wall's chips say them in full (ca_wall_upload, ca_wall_draft; step 3 and 4 of the overnight work order) */
  { k: 'upload', w: ['upload', 'upload a document', 'upload a file', 'ladda upp', 'ladda upp ett dokument', 'ladda upp en fil'] },
  { k: 'draft', w: ['draft', 'new agreement', 'draft a new agreement', 'a new agreement', 'nytt avtal', 'utkast', 'skriv ett nytt avtal', 'ett nytt avtal'] },
  { k: 'back', w: ['back', 'go back', 'tillbaka'] },
  { k: 'help', w: ['help', 'what can you do', 'hjälp'] },
  /* "what's next?" answers with the chips' own steps on a card (caNextSteps) */
  /* THE LEFT MENU'S PAGES (the owner picked "Desk tabs", 17 Oct 2026): on a
     computer the menu is gone, so every page it held is a place Jambo opens,
     and "/" lists them; the page lands on the desk as a tab (js/views/counter.js) */
  /* not "counter": that word is a counter-offer to him (CA_DOORS) */
  { k: 'counter', w: ['home', 'start', 'start page', 'hem', 'startsidan'] },
  { k: 'work', w: ["jambo's work", 'his work', 'prepared', 'prepared work', 'jambos arbete', 'förberett'] },
  { k: 'negotiations', w: ['negotiations', 'all negotiations', 'förhandlingar', 'alla förhandlingar'] },
  { k: 'approvals', w: ['approvals', 'approvals and signing', 'approvals & signing', 'godkännanden', 'godkännanden och signering', 'godkännanden & signering'] },
  { k: 'requests', w: ['requests', 'request', 'my requests', 'förfrågningar', 'förfrågan', 'mina förfrågningar'] },
  { k: 'parties', w: ['parties', 'party', 'counterparties', 'customers', 'suppliers', 'parter', 'motparter', 'kunder', 'leverantörer'] },
  { k: 'people', w: ['people', 'directory', 'colleagues', 'contacts', 'personer', 'katalog', 'katalogen', 'kollegor', 'kontakter'] },
  { k: 'ourpaper', w: ['our paper', 'templates', 'template', 'standards', 'our standards', 'playbook', 'vårt papper', 'mallar', 'mall', 'standarder', 'våra standarder'] },
  { k: 'import', w: ['import', 'imports', 'import contracts', 'importera', 'importera avtal'] },
  { k: 'mynotes', w: ['my notes', 'notes', 'mina anteckningar', 'anteckningar'] },
  { k: 'insights', w: ['insights', 'insikter'] },
  { k: 'house', w: ["jambo's agents", 'agents', "jambo's house", 'house', 'jambos agenter', 'agenter', 'jambos hus'] },
  { k: 'settings', w: ['settings', 'settings and rules', 'setup', 'inställningar'] },
  { k: 'brain', w: ['brain', 'hjärnan', 'hjärna'] },
  /* THE RIGHT-HAND PANEL'S TABS (owner, 20 Oct 2026: "when i ask jambo to show
     me the guide or activitiy and so on, it should do so"): Guide, Alerts and
     Activity open the panel on that tab (caPanelShow); "notes" stays My notes */
  { k: 'guide', w: ['guide', 'the guide', 'user guide', 'guiden', 'vägledning', 'vägledningen'] },
  { k: 'alerts', w: ['alerts', 'alert', 'my alerts', 'notifications', 'my notifications', 'the bell', 'aviseringar', 'mina aviseringar', 'notiser', 'notifieringar', 'varningar'] },
  { k: 'activity', w: ['activity', 'recent activity', 'activity feed', 'aktivitet', 'aktiviteter', 'senaste aktivitet'] },
  { k: 'next', need: 'one', w: ['next', 'next step', 'next steps', "what's next", 'whats next', 'what is next', 'what next', 'what now', 'nästa', 'nästa steg', 'vad är nästa steg', 'vad händer nu', 'vad nu'] },
];
/* "go to", "open", "show me", "take me back to", "gå till", "öppna", "visa" */
const CA_PLACE_LEAD = /^(?:please\s+)?(?:(?:go|take me|bring me|jump|switch)\s+(?:back\s+)?to\s+|open\s+|show\s+(?:me\s+)?|gå\s+(?:tillbaka\s+)?till\s+|öppna\s+|visa\s+(?:mig\s+)?)/i;
const CA_PLACE_MAX = 60;          // longer than this is a sentence, never a word
const CA_PLACE_MIN_TYPED = 3;     // letters the top bar's search waits for before a place leads
function caPlaceOf(q){
  let t = String(q || '').trim(); if (!t || t.length > CA_PLACE_MAX) return null;
  const slash = t[0] === '/'; if (slash) t = t.slice(1);
  /* THE ONE NORMALISER FIRST (19 Oct 2026): "open mk 345", "mk345" and
     "contract 345" name MK-345 here as on Home's box (caRefFix) */
  if (typeof caRefFix === 'function'){ try { t = caRefFix(t); } catch (_){ /* the words as typed */ } }
  let cid = null;
  for (const [label, v] of _caChosen) if (v.kind === 'contract' && t.includes(label)){ cid = cid || v.id; t = t.split(label).join(' '); }
  /* a reference names the contract only when it IS one: "deal-board" is a word */
  t = t.replace(/#?\b([A-Za-z]{2,4}-[A-Za-z0-9]+)\b/g, (m0, ref) => {
    const c = caContracts().find(x => String(caRef(x)).toUpperCase() === ref.toUpperCase() || String(x.id).toUpperCase() === ref.toUpperCase());
    if (!c) return m0;
    cid = cid || c.id; return ' ';
  });
  t = t.toLowerCase().replace(/[’‘]/g, "'").replace(/[?.!]+\s*$/, '').replace(/\s+/g, ' ').trim();
  /* "please", "now", "for me" at the end ask for nothing (19 Oct 2026: "go to explorer please") */
  t = t.replace(/(?:[\s,]+(?:please|now|for me|thanks|thank you|tack|snälla|nu))+\s*$/, '').trim();
  /* a place whose own name starts "our" or "the" ("our paper") is read before those are let go */
  const whole = (t + ' ').replace(CA_PLACE_LEAD, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  t = (t + ' ').replace(CA_PLACE_LEAD, '').replace(/^(?:the|my|our)\s+/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  /* ON THE BOARD ITS OWN READER KEEPS ITS WORDS: "obligations" is its
     obligations panel, "MK-458" the contract's card, a saved view its name.
     Only a move between faces ("board", "explorer") is the same either way. */
  if (caOnBoard() && typeof hbParse === 'function'){ let r = null; try { r = hbParse(q); } catch (_){ r = null; } if (r && r.act !== 'face') return null; }
  /* a reference on its own ("MK-458", "open #MK-458") is that contract's paper */
  if (!t && cid) return { kind: 'go', place: 'document', cid, slash, state: 'ready' };
  const p = CA_PLACES.find(x => x.w.includes(whole)) || CA_PLACES.find(x => x.w.includes(t)); if (!p) return null;
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
const CA_SLASH = ['redline', 'needs', 'sign', 'board', 'document', 'share', 'oblig', 'history', 'fill', 'calendar', 'explorer', 'draft', 'upload',
  'work', 'negotiations', 'approvals', 'requests', 'parties', 'people', 'ourpaper', 'mynotes', 'insights', 'import', 'house', 'settings', 'brain', 'counter', 'guide', 'alerts', 'activity'];
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
  needs: () => (typeof hbNeedsOpen === 'function') ? hbNeedsOpen() : caHomeFace('board'),
  document: c => (c && typeof pdOpenOnHome === 'function') ? pdOpenOnHome(c.id, 'copilot') : caHomeFace('paper'),
  calendar: () => typeof hbOpenCalendar === 'function' && hbOpenCalendar(),
  explorer: () => typeof hbOpenExplorer === 'function' && hbOpenExplorer(),
  /* "contracts", "all contracts": the Contracts place, EVERY contract, as he
     says ("Every contract is here") — a set another screen sent it (Parties'
     Open party, a number on the Board) is let go (step 2, 14 Oct 2026), and
     so are the tab, the filters and the search, as any door lands on fresh
     filters (regGoFiltered's rule; the checkers of step 7 caught him saying
     "every" over a remembered Executed tab); Wall or List stays */
  contracts: () => {
    if (typeof regPlaceSet === 'function'){ const R = regPlaceSet({ only: null });
      if (typeof regFiltersAtRest === 'function') regFiltersAtRest(R);
      if (typeof regSearchBoxClear === 'function') regSearchBoxClear(); }
    return caHomeWall(); },
  /* "wall", "list": the same place, drawn the other way (step 7) */
  wall: () => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'wall' }); return caHomeWall(); },
  list: () => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); return caHomeWall(); },
  /* beside the paper: Jambo's own Redlines face (stage 3), through the page's walls */
  redline: c => (typeof pdRedOpen === 'function') ? pdRedOpen(c.id) : openRedlineWorkbench(c.id),
  sign: c => caRoomSign(c),
  /* beside the paper: Jambo's own Fill in face (stage 2) */
  fill: c => (typeof pdFillOpen === 'function') ? pdFillOpen(c.id) : caRoomTab(c, 'details'),
  oblig: c => c ? pdOpenOnHome(c.id, 'oblig') : (typeof setView === 'function' && setView('obligations')),
  history: c => c ? ((typeof hbOpenView === 'function') ? hbOpenView(c.id, 'hist') : caRoomTab(c, 'history')) : (typeof openPanel === 'function' && openPanel('activity')),
  /* the contract on Home, then its brief through the paper's own door */
  brief: c => caBriefOpen(c),
  /* LAND ON IT (owner, 18 Oct 2026: "upload document … should take you to
     contracts page" with the place to go lit): on a computer the word lands
     on Jambo's drop area, lit, Choose files ready — it presses nothing, so
     the picker no longer opens by itself; the phone keeps the picker */
  upload: () => !caMayAdd() ? false : (typeof pdDropDoor === 'function' && pdDropDoor()) ? true
    : (typeof pdDropPick === 'function') ? pdDropPick() : (typeof openUploadModal === 'function' && openUploadModal()),
  /* THE ONE FORM, never the two-door menu (step 3) — a word answers with the
     Draft card (caGoCardHtml); this is for a caller that moves straight on */
  draft: () => caDraftForm(null),
  /* the left menu's pages, each through the door the menu pressed (Round 2) */
  counter: () => typeof setView === 'function' && setView('counter'),
  work: () => typeof hbOpenAgent === 'function' && hbOpenAgent(),
  negotiations: () => (typeof openNegotiations === 'function') ? openNegotiations({ list: true }) : setView('redline'),
  approvals: () => setView('approvals'),
  guide: () => caPanelShow('guide'),
  alerts: () => caPanelShow('alerts'),
  activity: () => caPanelShow('activity'),
  requests: () => setView('intake'),
  parties: () => setView('customers'),
  people: () => setView('directory'),
  ourpaper: () => setView('templates'),
  import: () => !caMayAdd() ? false : setView('migration'),
  mynotes: () => setView('mynotes'),
  insights: () => setView('intel'),
  house: () => setView('jambo'),
  settings: () => setView('team'),
  brain: () => setView('brain'),
};
/* what Jambo says as he goes — one line, no card (share and help are cards) */
function caGoSay(a){
  if (!a) return '';
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (a.missing) return _caT('ca_go_need', { word: _caT('ca_w_' + a.place) });
  /* a task of Jambo's map that lands on a narrowed list or a Settings section says where (js/jambomap.js) */
  if (a.say) return _caT(a.say);
  /* a place and a narrowing, a party's contracts (caUnderstand): what was read, counted as the place applies it */
  if (a.narrow) return caNarrowSay(a);
  /* a brief kept is shown free; none kept, its Write the brief says the cost */
  if (a.place === 'brief' && c) return _caT(caBriefKept(c) ? 'ca_go_brief' : 'ca_go_brief_none', { ref: caRef(c) });
  if (a.place === 'back'){ const p = caTrailTop(); return p ? _caT('ca_go_back', { where: caTrailLabel(p) }) : _caT('ca_go_back_none'); }
  /* a viewer's "upload" is answered with the refusal, once, where they look — not a toast beside it */
  if ((a.place === 'upload' || a.place === 'import') && !caMayAdd()) return _caT('ct_viewers_no_add');
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
  /* share and draft answer with a card in the panel (caGoCardHtml) and move nothing */
  if (a.place !== 'help' && CA_CARD_WORDS.includes(a.place)) return true;
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  /* A CODE-NAMED DEAL STAYS SHUT for somebody outside its list: the door
     asks first and says why (codeNameStop), whoever's words reached it */
  if (c && typeof codeNameStop === 'function' && codeNameStop(c)) return false;
  /* a page that cannot narrow as asked answers with its card (caGoCardHtml) */
  if (a.narrowOff) return true;
  caTrailPush();
  if (a.missing){ caHomeWall(); caGoRepaint(); return true; }
  /* A PLACE AND A NARROWING (19 Oct 2026): the place, then its own applier */
  if (a.narrow){ let ok = false; try { ok = caGoNarrowed(a); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return false; } caGoRepaint(); return ok; }
  /* JAMBO'S MAP (js/jambomap.js) reaches two doors no single word had: the
     Contracts place narrowed, as Home's tiles open it (regGoFiltered), and a
     Settings section, as the Settings finder opens it (stFindGo) */
  const door = a.reg ? (typeof regGoFiltered === 'function' ? () => regGoFiltered(a.reg) : null)
    : a.st ? (typeof stFindGo === 'function' ? () => stFindGo(a.st) : null) : undefined;
  if (door !== undefined){
    if (!door) return false;
    try { door(); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return false; }
    caGoRepaint(); return true;
  }
  const go = CA_GO[a.place]; if (typeof go !== 'function') return false;
  try { go(c); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return false; }
  caGoRepaint();
  return true;
}
/* the right-hand panel on one tab: opened there, never closed by the ask
   (openPanel closes a panel pressed open on the same tab) */
function caPanelShow(face){
  if (typeof openPanel !== 'function') return false;
  const shown = typeof state !== 'undefined' && state && state.panelOpen && typeof panelFace === 'function' && panelFace() === face;
  if (!shown) openPanel(face);
  return true;
}
/* a move that stays on Home repaints the panel so its back row is current.
   A "GO TO" ASK TAKES YOU THERE (owner, 19 Oct 2026): the place lands on its
   own panel — the conversation view Home's panel had turned to closes */
function caGoRepaint(){ try {
    /* the go's own words were said on the page left behind (the view may
       already be another, so pdTalkShows reads false there): Home's panel
       counts them as heard, and the destination lands fresh (19 Oct 2026) */
    const k = (typeof jamboTalkKey === 'function') ? String(jamboTalkKey() || '') : '';
    if (((typeof pdTalkShows === 'function' && pdTalkShows()) || k.indexOf('dock:') === 0) && typeof pdTalkClose === 'function') pdTalkClose(); } catch (_){}
  setTimeout(() => { try { if (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof renderIntelDock === 'function') renderIntelDock(); } catch (_){} }, 0); }
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
  /* a pressed row names the page: it goes there, even where the screen in
     front could show the same contracts ("negotiations" on Explorer) — said
     as "/" says it (caHereRead leaves a "/" word to the page) */
  if (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof intelAsk === 'function') return intelAsk(caHereRead(word) ? '/' + caSlashWord(k) : word);
  const a = caReadPlace(word); if (!a) return false;
  if (CA_CARD_WORDS.includes(a.place)){ caUseBump(a.place); return caHandHome(word, a); }
  return caGo(a);
}

/* ---- JAMBO, THE SAME ON EVERY PAGE (owner, 18 Oct 2026: "In the calendar I
   can't use jambo to move to another page as it is only there to support the
   calendar … Jambo should work with the same powers as the jambo in the home
   page") ----
   EVERY Jambo box reads what was typed through the ONE reader Home's box uses
   first, before its own page's job: a place word, a page's name or a contract
   number moves the reader there (caGo, the one mover); a word Home's Jambo
   answers with a card (CA_CARD_WORDS) or an act he prepares from the words
   alone (send, a job, a door, a Menu row, a draft sentence) is asked of Home's
   Jambo, beside the Board — the Counter's own way. Answers whether it took the
   words; only then does a page's own job run (the Calendar plans time,
   Settings finds a setting, the window answers a question). Spends nothing:
   no reader here calls a model. */
const CA_CARD_WORDS = ['share', 'draft', 'help', 'next'];
function caTakesWords(t){
  try { if (caReadSend(t) || caReadJob(t) || caReadDoor(t) || caReadMenu(t)) return true; } catch (_){}
  try { if (typeof caIsDraftAsk === 'function' && caIsDraftAsk(t)) return true; } catch (_){}
  return false;
}
/* hand the words to Home's Jambo: drafting is the wall's, the rest the Board's */
function caHandHome(t, a){
  if (typeof hbS !== 'function' || typeof setView !== 'function') return false;
  const toWall = !!(a && a.place === 'draft') || (typeof caIsDraftAsk === 'function' && caIsDraftAsk(t));
  if (toWall && typeof hbOpenContracts === 'function') hbOpenContracts();
  else { const s = hbS(); s.face = 'board'; if (typeof hbSave === 'function') hbSave(); setView('dashboard'); }
  let tries = 0;
  const ask = () => {
    if (document.getElementById('igd-input') && typeof intelAsk === 'function'){ try { intelAsk(t); } catch (_){} return; }
    if (++tries < 30) setTimeout(ask, 100);
  };
  setTimeout(ask, 0);
  return true;
}
/* ---- ANSWER WHERE YOU STAND — ONE RULE, EVERY SCREEN (owner, 18 Oct 2026:
   the imports trial; then "why do you have to code such a rule in
   isolation? It should be a simple rule or code to show in your page unless
   it is not possible or you are instructed to go to another page"; "Yes") ----
   A request to SEE a group of contracts is tried on the screen in front
   FIRST, with that screen's own reader — Explorer's map and the Contracts
   place's list both read words through igConditions. When the reader
   understands ALL of the words (every condition read, nothing left but
   everyday words, igLeftover), or the words ask for every contract, it is
   answered there, and the page that also holds them is a door under the
   answer, never pressed. Jambo moves only when the page is named outright
   ("open the import page", "go to contracts", a "/" row), when the words ask
   for an act another page does ("import old contracts"), or when the
   screen cannot read them all (a contract's number, "draft…", a fact the
   reader does not know) — then everything goes on as before. Spends nothing.
   A screen that shows contracts joins with a line in caHereScreen and its
   reader; a fact the reader learns is learned once, for every screen.
   CA_HERE_FACTS is the ONE list of the page that also holds a fact (the
   door); `imported` keeps its words here too, and the reader reads them
   from here (igConditions → caHereFact), as the AI's map filter carries the
   same fact (GRAPH_WHERE_KEYS `imported`, both hosts). */
const CA_HERE_FACTS = [
  /* brought in through Import: c.migration, written by the Import page alone */
  { k: 'imported', page: 'import', also: 'ca_here_also_imported', none: 'ca_here_none_imported', of: c => !!(c && c.migration),
    re: /(?<!\p{L})(?:imports|imported|migrated|(?:did|have|had)\s+(?:we|i)\s+import|importerade|migrerade|importer|importerna|importerat)(?!\p{L})/iu },
  /* a live negotiation, whose move it is, stalled: the Negotiations list holds them by whose move */
  { k: 'nego', page: 'negotiations', also: 'ca_here_also_negotiations' },
  { k: 'move', page: 'negotiations', also: 'ca_here_also_negotiations' },
  { k: 'stalled', page: 'negotiations', also: 'ca_here_also_negotiations' },
  /* suppliers or customers: Parties holds one row per party */
  { k: 'side', page: 'parties', also: 'ca_here_also_parties' },
  /* late obligations: the Obligations page holds each one, who owes it, when */
  { k: 'overdue', page: 'oblig', also: 'ca_here_also_oblig' },
];
/* on the map, any other set is also the Contracts place's list, narrowed the same (and every contract, the list at rest) */
const CA_HERE_LIST = { k: '', page: 'contracts', also: 'ca_here_also_contracts' };
/* the page itself is asked for: its name with "page", "go to", "open", or a "/" row */
const CA_HERE_PAGE_RE = /^\s*\/|(?<!\p{L})(?:page|screen|sidan|sida|vyn)(?!\p{L})|^\s*(?:please\s+)?(?:(?:go|take me|bring me|jump|switch)\s+(?:back\s+)?to|open|gå\s+(?:tillbaka\s+)?till|öppna|ta mig till)(?!\p{L})/iu;
/* an act another page does: a verb first ("draft a contract", "review all",
   "import old contracts"), even where the verb is also a stage's word */
const CA_HERE_ACT_RE = /^\s*(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:import|importera|bulk|upload|migrate|bring in|load|ladda upp|flytta in|ta in|draft|write|create|make|prepare|start|sign|review|send|share|redline|negotiate|amend|renew|book|schedule|fill|edit|change|delete|archive|export|download|print|skriv|skapa|upprätta|signera|granska|skicka|dela|förhandla|ändra|förnya|boka|fyll|radera|arkivera|exportera|ladda ner)(?!\p{L})|(?<!\p{L})(?:how (?:do|can|should) (?:i|we)|i want to|we want to|we need to|help me|let me|jag vill|vi vill|hur (?:gör|kan) (?:jag|vi))\s+(?:import|upload|migrate|bring in|importera|ladda upp|flytta in)(?!\p{L})/iu;
/* the words that ask to see, read away before the reader's leftover is measured */
const CA_HERE_SEE_RE = /^\s*(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:show|see|list|which|what|find|filter|highlight|display|only|just|give me|get me|bring up|how many|where|visa|vilka|vilket|vilken|vad|hitta|lista|filtrera|markera|hur många|var|ge mig)(?!\p{L})/iu;
/* every contract: "show me all contracts", "every contract", "contracts", "alla avtal" */
const CA_HERE_ALL_RE = /^\s*(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:(?:show|list|see|display|give|get|bring up)(?:\s+(?:me|us))?\s+|(?:visa|lista)(?:\s+(?:mig|oss))?\s+)?(?:(?:all|every)(?:\s+(?:of\s+)?(?:the\s+|our\s+)?(?:contracts?|agreements?))?|everything|(?:the\s+)?(?:contracts|agreements)|all of them|the whole (?:book|map)|alla(?:\s+(?:våra\s+)?avtal(?:en)?)?|allt|avtal(?:en)?|hela (?:boken|kartan))(?:\s+(?:again|here|igen|här))?\s*[.!?]*\s*$/iu;
/* a word for a page that is not a group of contracts ("draft", "list", "sign")
   is that page's; the pages that ARE a group of contracts the screen in front
   may answer instead ("contracts", "negotiations", "suppliers", "imports") */
const CA_HERE_GROUP_PLACES = ['contracts', 'negotiations', 'parties', 'import'];
/* other things than contracts, asked for without a contract word: the page that holds them ("overdue obligations") */
const CA_HERE_OTHER_RE = /(?<!\p{L})(?:obligations?|duties|duty|åtaganden?|skyldigheter|approvals?|godkännanden?|requests?|förfrågningar|förfrågan|notes?|anteckningar|templates?|mallar|people|personer|clauses?|klausuler|risks?|risker)(?!\p{L})/iu;
const CA_HERE_CONTRACT_RE = /(?<!\p{L})(?:contracts?|agreements?|deals?|avtal(?:en|et)?)(?!\p{L})/iu;
/* everyday words the map's own leftover keeps that ask for nothing ("where are the …", "de importerade";
   its filler misses the Swedish ones with å, ä or ö: "hur många", "är") */
const CA_HERE_EXTRA_RE = /(?<!\p{L})(?:where|ones?|de|den|det|dem|en|ett|var|är|många|för|värde|värda|åtaganden?)(?!\p{L})/giu;
const CA_HERE_MAX = 160;
/* which screen in front can show a group of contracts: Explorer's map, or the Contracts place's list */
function caHereScreen(){
  try {
    if (typeof state === 'undefined' || !state || state.view !== 'dashboard' || typeof hbFace !== 'function') return '';
    const f = hbFace();
    if (f === 'explorer') return 'explorer';
    if (f === 'paper' && typeof document !== 'undefined' && document.getElementById('ct-place') && !(typeof igPaperUp === 'function' && igPaperUp())) return 'contracts';
  } catch (_){}
  return '';
}
function caHereFact(k){ return CA_HERE_FACTS.find(f => f.k === k) || null; }
/* THE RULE: { kind:'here', screen, all, fact, page, also, what } when the
   screen in front answers the words, else null and they go on as before */
function caHereRead(q){
  const t = String(q || '').trim(); if (!t || t.length > CA_HERE_MAX) return null;
  const screen = caHereScreen(); if (!screen) return null;
  if (CA_HERE_PAGE_RE.test(t) || CA_HERE_ACT_RE.test(t)) return null;
  if (CA_HERE_OTHER_RE.test(t) && !CA_HERE_CONTRACT_RE.test(t)) return null;
  let pl = null; try { pl = caReadPlace(t); } catch (_){ pl = null; }
  if (pl && !CA_HERE_GROUP_PLACES.includes(pl.place)) return null;
  const door = d => ({ fact: d ? d.k : '', page: d ? d.page : '', also: d ? d.also : '' });
  if (CA_HERE_ALL_RE.test(t)) return Object.assign({ kind: 'here', screen, all: true, what: '' }, door(screen === 'explorer' ? CA_HERE_LIST : null));
  if (typeof igConditions !== 'function' || typeof igLeftover !== 'function') return null;
  let conds = []; try { conds = igConditions(t) || []; } catch (_){ conds = []; }
  if (!conds.length) return null;
  let left = 'x'; try { left = String(igLeftover(t.replace(CA_HERE_SEE_RE, ' '), conds) || ''); } catch (_){ left = 'x'; }
  if (left.replace(CA_HERE_EXTRA_RE, ' ').trim()) return null;
  /* on Explorer the map's own recipe answers, so it must read them as a set
     to show (a narrowing), not a question back ("suppliers": arrange by what?) */
  if (screen === 'explorer' && typeof igRecipeParse === 'function'){
    let p = null; try { p = igRecipeParse(t); } catch (_){ p = null; }
    const acts = (p && p.acts) || [];
    if (!acts.some(x => x.narrow) || acts.some(x => x.ask || x.unknownFact)) return null;
  }
  const d = conds.map(c => caHereFact(c.field)).find(Boolean) || (screen === 'explorer' ? CA_HERE_LIST : null);
  return Object.assign({ kind: 'here', screen, all: false, what: conds.map(c => c.label).join(' · ') }, door(d));
}
/* THE CONTRACTS PLACE: its list narrowed by the reader's own reading of the
   same words (igConditions → igIdsWhere), so "imported contracts expiring
   this year" keeps both; none found is said, the list left whole */
function caHereOnList(here, q){
  let conds = []; try { conds = (typeof igConditions === 'function') ? igConditions(q) : []; } catch (_){ conds = []; }
  if (!conds.length) return null;
  let ids = []; try { ids = (typeof igIdsWhere === 'function') ? igIdsWhere(conds, caContracts()) : []; } catch (_){ ids = []; }
  const what = conds.map(c => c.label).join(' · ');
  if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, what);
  const f = here.fact ? caHereFact(here.fact) : null;
  const none = !ids.length && !!(f && f.none && f.of) && !caContracts().some(c => f.of(c));
  return Object.assign({}, here, { n: ids.length, what, say: ids.length ? _caT('ca_here_list', { n: ids.length, what })
    : none ? _caT(f.none) : _caT('ca_here_none_match', { what }) });
}
function caHereCardHtml(a, i){
  if (!a || !a.page) return '';
  const B = (act, label) => `<button type="button" class="ui-btn ui-btn-sm" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
  return `<div class="ca-card ca-here" data-ca-card="${i}"><p class="ca-foot" style="margin-top:0">${_caE(_caT(a.also))}</p>
    <div class="ca-acts">${B('herepage', _caT('ca_here_open_' + a.page))}</div></div>`;
}
/* the door: the page, through the one mover — the Contracts place narrowed to
   the set the map shows (caGo's `reg`, the doors' own regGoFiltered) */
function caHerePress(a, act){
  if (act !== 'herepage') return;
  if (a.page === 'contracts' && Array.isArray(a.ids) && a.ids.length) return caGo({ kind: 'go', place: 'contracts', reg: { only: { ids: a.ids.slice(), label: String(a.what || '') } }, state: 'ready' });
  return caGo({ kind: 'go', place: a.page, state: 'ready' });
}
/* ============================================================
   ONE READER FOR EVERY JAMBO BOX (owner, 19 Oct 2026: "I want hati to do
   what the user asks in plain language supported by Minisearch without any
   constraints apart from the limitations set by the settings")
   ============================================================
   caUnderstand(q, {box}) is the ONE reading every Jambo box asks FIRST —
   Home's own box (intelAsk) and every other box (caAskAnywhere: the Home
   page, Settings, the Calendar, the panel beside the lists and Import, the
   window, the builder and the clause editor) — before its own job. It spends
   nothing and writes nothing, and answers only when it is SURE:
   - A PLACE AND A NARROWING: "go to explorer and show me the drafts", "draft
     contracts on the map", "gå till utforskaren och visa utkasten" — the
     place a lead verb or in / on / at names, the rest read WHOLE by the map's
     own word reader (igConditions, igLeftover); caGo moves there and the
     place's own applier narrows it (caGoNarrowed);
   - A CONTRACT NAMED (caContractOf: its number in any form, its title, its
     party) and what is asked of it — open, its brief, history, redlines,
     signing, obligations, details, share, amend — through the doors that
     already exist; a question about its wording is asked OF it (kind 'ask');
   - CONTRACTS NARROWED with no place named ("nordfrakt contracts", "the
     signed ones"): the screen in front answers them where it can read them
     whole (the Board, Explorer, the Contracts place — `here`), else the
     Contracts place, narrowed;
   - A PLACE NAMED with a lead verb ("go to negotiations", "go to explorer
     please") — on the Board too, where the Board's own panel kept it.
   What it does not read whole goes on to the box's own job exactly as
   before. WHAT ONLY SETTINGS MAY STOP is checked at the door, never here:
   the book it reads is the reader's own (state.contracts, already cut by the
   server's folderScopeFor and code-name masked), a code-named deal stays
   shut (caGo → codeNameStop), an admin's task is offered to an admin only
   (jmRead), a viewer may not add (CA_GO.upload / import). */
const CA_GO_LEAD = /^\s*(?:(?:please|ok|okay|now|jambo)[\s,]+)*(?:(?:can|could|would|will)\s+you\s+)?(?:please\s+)?(?:(?:go|take me|bring me|jump|switch|navigate|head|move)\s+(?:back\s+|over\s+|straight\s+)?to|open(?:\s+up)?|gå\s+(?:tillbaka\s+)?till|ta\s+mig\s+till|öppna)\s+/iu;
/* the words that join a place to what to show there ("and", "with", "och") */
const CA_AND_JOIN = /^(?:,\s*)?(?:and(?:\s+then|\s+only)?|then|with|where|showing|to\s+see|so\s+(?:that\s+)?(?:i|we)\s+can\s+see|och(?:\s+sedan)?|sedan|med|där)(?=\s|$)\s*/iu;
/* a place named after "in", "on", "at" at the end ("drafts on the map") */
const CA_AND_TAIL = /\s(?:in|on|at|inside|within|i|på)\s+/giu;
/* the places that hold contracts and may be named with a narrowing, and the other words for them */
const CA_AND_PLACES = ['explorer', 'contracts', 'list', 'wall', 'board', 'negotiations', 'oblig', 'parties', 'approvals', 'requests', 'import', 'calendar', 'people', 'mynotes', 'ourpaper', 'insights', 'counter', 'work', 'needs', 'house', 'settings', 'brain'];
const CA_AND_WORDS = [['map', 'explorer'], ['the map', 'explorer'], ['contract map', 'explorer'], ['kartan', 'explorer'], ['karta', 'explorer'], ['avtalskartan', 'explorer'],
  ['contracts page', 'contracts'], ['contracts list', 'contracts'], ['contract list', 'contracts'], ['the contracts', 'contracts'], ['workspace', 'contracts'], ['the workspace', 'contracts'], ['arbetsytan', 'contracts'], ['avtalen', 'contracts'],
  ['dashboard', 'board'], ['the board', 'board'], ['obligations page', 'oblig'], ['negotiations page', 'negotiations']];
/* the places whose own applier narrows; any other says so and offers the Contracts place narrowed */
const CA_AND_NARROWS = ['explorer', 'contracts', 'list', 'wall', 'board', 'negotiations', 'oblig'];
const CA_AND_SAY_MAX = 60;   // a narrowing named longer than this is cut, and the cut is shown (…)
let _caAndList = null;
function caAndList(){
  if (_caAndList) return _caAndList;
  const out = [];
  CA_PLACES.filter(p => CA_AND_PLACES.includes(p.k)).forEach(p => p.w.forEach(w => out.push([w, p.k])));
  CA_AND_WORDS.forEach(x => out.push(x));
  _caAndList = out.sort((a, b) => b[0].length - a[0].length);
  return _caAndList;
}
const caAndNorm = s => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.]+\s*$/, '').replace(/\s+/g, ' ').trim();
/* the place a stretch of words names, whole or at its start: { k, len } */
function caAndPlaceAt(s, whole){
  const t = s.replace(/^(?:the|my|our|den|det|mina|våra)\s+/, ''), cut = s.length - t.length;
  for (const [w, k] of caAndList()){
    if (whole ? (t === w || new RegExp('^' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(?:page|tab|view|screen|sidan|fliken|vyn)$').test(t))
      : (t === w || t.startsWith(w + ' ') || t.startsWith(w + ','))) return { k, len: cut + w.length };
  }
  return null;
}
/* THE REST, READ WHOLE: the conditions the map's own reader finds, with
   nothing left but everyday words — or every contract — or null */
function caNarrowOf(rest, place){
  const r = String(rest || '').trim(); if (!r) return null;
  const seeRe = (typeof CA_HERE_SEE_RE !== 'undefined') ? CA_HERE_SEE_RE : /^$/;
  if (typeof CA_HERE_ALL_RE !== 'undefined' && CA_HERE_ALL_RE.test(r)) return { rest: r, all: true, what: '', ids: null, n: null };
  if (typeof igConditions !== 'function' || typeof igLeftover !== 'function') return null;
  let conds = []; try { conds = igConditions(r) || []; } catch (_){ conds = []; }
  let left = 'x';
  if (conds.length){ try { left = String(igLeftover(r.replace(seeRe, ' '), conds) || ''); } catch (_){ left = 'x'; }
    if (typeof CA_HERE_EXTRA_RE !== 'undefined') left = left.replace(CA_HERE_EXTRA_RE, ' '); left = left.trim(); }
  if (conds.length && !left){
    const book = ((typeof state !== 'undefined' && state && state.contracts) || []).filter(c => c && !c.archived);
    let ids = []; try { ids = (typeof igIdsWhere === 'function') ? igIdsWhere(conds, book) : []; } catch (_){ ids = []; }
    return { rest: r, what: conds.map(c => c.label).join(' · '), ids, n: ids.length };
  }
  /* on the map its own recipe reads more than a narrowing ("group by stream", "top 10 by value") */
  if (place === 'explorer' && typeof igRecipeParse === 'function'){
    let p = null; try { p = igRecipeParse(r); } catch (_){ p = null; }
    const acts = (p && p.acts) || [];
    if (acts.length && !p.rest && !acts.some(x => x.ask || x.unknownFact || x.undo || x.save != null || x.open)) return { rest: r, recipe: true, what: caSayCut(r), ids: null, n: null };
  }
  /* on the Board its own reader reads what lands on the Board (a figure, a chart) */
  if (place === 'board' && typeof hbParse === 'function'){
    let b = null; try { b = hbParse(r); } catch (_){ b = null; }
    if (b && ['dig', 'lens', 'panel'].includes(b.act)) return { rest: r, board: true, what: caSayCut(r), ids: null, n: null };
  }
  return null;
}
function caSayCut(s){ const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > CA_AND_SAY_MAX ? t.slice(0, CA_AND_SAY_MAX - 1).trimEnd() + '…' : t; }
/* A PLACE AND A NARROWING, anywhere in the sentence: "go to <place> and
   <narrowing>", "take me to <place> with <narrowing>", "<narrowing> in / on
   <place>"; no length limit for this form (it is a sentence by nature) */
function caReadPlaceAnd(q){
  const s = caAndNorm(q); if (!s) return null;
  let place = null, rest = '';
  const lead = s.match(CA_GO_LEAD);
  if (lead){
    const after = s.slice(lead[0].length);
    const hit = caAndPlaceAt(after, false);
    if (hit){
      let tail = after.slice(hit.len).trim().replace(/^(?:page|tab|view|screen|sidan|fliken|vyn)(?=\s|,|$)\s*/, '');
      const j = tail.match(CA_AND_JOIN);
      if (j && tail.slice(j[0].length).trim()){ place = hit.k; rest = tail.slice(j[0].length).trim(); }
    }
  }
  if (!place){
    const cuts = []; let m; CA_AND_TAIL.lastIndex = 0;
    while ((m = CA_AND_TAIL.exec(s))) cuts.push([m.index, m.index + m[0].length]);
    for (const [a0, a1] of cuts.reverse()){
      const hit = caAndPlaceAt(s.slice(a1), true);
      if (hit){ place = hit.k; rest = s.slice(0, a0).trim(); break; }
    }
    /* "take me to <narrowing> in explorer" carries its lead too */
    if (place && lead && rest.startsWith(lead[0].trim())) rest = rest.slice(lead[0].trim().length).trim();
  }
  if (!place || !rest) return null;
  const N = caNarrowOf(rest, place); if (!N) return null;
  /* every contract asked for at a place is that place at rest */
  if (N.all) return { kind: 'go', place, state: 'ready', all: true };
  const off = !CA_AND_NARROWS.includes(place) || ((N.recipe && place !== 'explorer') || (N.board && place !== 'board'));
  return Object.assign({ kind: 'go', place, narrow: N, state: 'ready' }, off ? { narrowOff: true } : {});
}
/* A PLACE NAMED WITH A LEAD VERB, whole ("go to explorer please"): read
   before the Board's own reader, which kept "go to negotiations" as its panel */
function caReadGoPlace(q){
  const s = caAndNorm(q); const lead = s.match(CA_GO_LEAD); if (!lead) return null;
  const after = s.slice(lead[0].length).replace(/(?:[\s,]+(?:please|now|for me|thanks|thank you|tack|snälla|nu))+\s*$/, '').trim();
  const hit = caAndPlaceAt(after, true); if (hit) return { kind: 'go', place: hit.k, state: 'ready' };
  return null;
}

/* ---- THE ONE CONTRACT FINDER (caContractOf) ----
   A contract named in any words: its number in any form (caRefFix: "MK-345",
   "mk 345", "mk345", "#MK-345", "contract 345", "345" alone, "mk 377" for
   MK-0377), else its title or its party in a free sentence ("open the
   warehousing agreement", "take me to the nordfrakt contract"), matched by
   MiniSearch (jmLib, js/jambomap.js) over the contracts THIS READER can see —
   state.contracts as the server sent it: cut by folderScopeFor, private
   streams included only where granted, a code-named deal carrying its code
   name alone. Answers { c, hit }, { miss: ref } for a number nobody here can
   see, { party, ids } for one party's several contracts, { picks } for two
   or three close ones, or null. Never a guess, never the paper that is up. */
const CA_FIND_PICKS = 3;          // a "which contract?" card offers at most this many
const CA_FIND_TERMS_MAX = 3;      // a title is a few words; more than this is a sentence for its reader
const CA_FIND_NOUN = /(?<!\p{L})(?:contracts?|agreements?|deals?|leases?|ndas?|avtal(?:et|en)?|kontrakt(?:et|en)?)(?!\p{L})/iu;
const CA_FIND_MANY = /(?<!\p{L})(?:contracts|agreements|deals|ndas|avtalen|kontrakten|all|every|alla)(?!\p{L})/iu;
const CA_FIND_LEAD = /^\s*(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?(?:show(?:\s+me)?|find|bring\s+up|pull\s+up|look\s+at|visa(?:\s+mig)?|hitta|ta\s+fram)\s+/iu;
/* the words a title is never matched on: the ask's frame, the places, the acts, the stages */
const CA_FIND_SKIP = new Set(('open show see view find bring pull look take go read get give let want need like would could can please brief briefing summary summarise summarize '
  + 'history trail redline redlines redlining changes change negotiate negotiation sign signing signature obligations obligation duties details detail fill share send amend amendment '
  + 'draft drafts drafting signed executed active review reviewing declined closed live overdue expired expiring renewing renewal '
  + 'say says said about mean means what which who whom whose why when where how does did done has have had is are was were there tell explain question questions '
  + 'map explorer board page tab screen list wall workspace document paper copy version '
  + 'sammanfattning sammanfattningen sammanfatta briefen historik signera underteckna åtaganden uppgifter dela skicka visa öppna hitta utkast signerade '
  + 'vad vilken vilka vem varför när var hur säger står finns').split(/\s+/).filter(Boolean));
let _caBookIx = null, _caBookSig = '';
function caBookRows(){ return caContracts(); }
function caBookIndex(){
  const MS = (typeof jmLibNow === 'function') ? jmLibNow() : null; if (!MS) return null;
  const cs = caBookRows();
  const sig = cs.length + '|' + cs.map(c => c.id + '\u0001' + (c.name || '') + '\u0001' + (c.counterparty || '') + '\u0001' + (c.codeName || '')).join('\u0002');
  if (_caBookIx && sig === _caBookSig) return _caBookIx;
  const tok = s => String(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 2);
  const ix = new MS({ fields: ['name', 'party', 'code'], storeFields: ['id'], tokenize: tok, processTerm: t => (t.length >= 2 ? t : null),
    searchOptions: { tokenize: tok, combineWith: 'AND', prefix: t => t.length >= 4, fuzzy: t => (t.length >= 6 ? 0.2 : false) } });
  ix.addAll(cs.map(c => ({ id: c.id, name: String(c.name || ''),
    /* every party on it: the outside party's name and any other on the record (contractParties) */
    party: [c.counterparty].concat((() => { try { return (typeof contractParties === 'function' ? (contractParties(c) || []) : []).map(p => p && (p.name || p.label)); } catch (_){ return []; } })()).filter(Boolean).join(' '),
    /* an insider's record may carry the deal's code name beside the real one; a stub carries the code name as its name */
    code: String(c.codeName || '') })));
  _caBookIx = ix; _caBookSig = sig;
  return ix;
}
/* the words a title or a party could be: what is left of the sentence once
   its frame, its acts, its places, its stages and its read conditions are gone */
function caFindTerms(t){
  let s = ' ' + String(t || '').toLowerCase().replace(/[’‘]/g, "'") + ' ';
  /* a condition the map's reader reads (a stage, a side, a window) is not a name — its party is */
  try { (typeof igConditions === 'function' ? igConditions(t) : []).forEach(x => { if (x.field !== 'counterparty' && x.hit) s = s.split(' ' + String(x.hit).toLowerCase() + ' ').join(' '); }); } catch (_){}
  const stop = w => CA_FIND_SKIP.has(w) || (typeof JM_STOP !== 'undefined' && JM_STOP.has(w)) || (typeof JM_SOFT !== 'undefined' && JM_SOFT.has(w))
    || CA_FIND_NOUN.test(w) || /^\d+$/.test(w) || w.length < 3;
  return [...new Set(s.split(/[^\p{L}\p{N}'-]+/u).map(w => w.replace(/^'+|'+$/g, '')).filter(w => w && !stop(w)))];
}
function caContractOf(q, opts = {}){
  const raw = String(q || '').trim(); if (!raw) return null;
  let t = raw; try { t = caRefFix(raw); } catch (_){ t = raw; }
  /* a contract chosen from the # list */
  for (const [label, v] of _caChosen) if (v.kind === 'contract' && t.includes(label)){ const c = (typeof getContract === 'function') ? getContract(v.id) : null; if (c) return { c, hit: label, how: 'chosen' }; }
  const book = ((typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : []).filter(c => c && !c.archived);
  /* its number, anywhere in the words */
  const refRe = /#?\b([A-Za-z]{2,4}-[A-Za-z0-9]*\d[A-Za-z0-9]*)\b/g; let m;
  while ((m = refRe.exec(t))){
    const want = caRefCanon(m[1]);
    const c = book.find(x => caRefCanon(caRef(x)) === want || caRefCanon(x.id) === want);
    if (c) return { c, hit: m[0], how: 'ref', said: t };
  }
  /* a number in the book's own letters that nobody here can see is said so, never guessed */
  const prefixes = [...new Set(book.map(c => (String(caRef(c)).match(/^([A-Za-z]{2,4})-/) || [])[1]).filter(Boolean).map(p => p.toUpperCase()).concat(['MK', 'RL']))];
  const miss = new RegExp('(?<![\\p{L}\\p{N}])#?(' + prefixes.join('|') + ')[- ]?(\\d+)(?![\\p{L}\\p{N}])', 'iu').exec(t);
  if (miss) return { miss: miss[1].toUpperCase() + '-' + miss[2] };
  if (opts.names === false) return null;
  /* a title or a party, said in a sentence that asks for a contract */
  const asks = CA_GO_LEAD.test(t) || CA_FIND_LEAD.test(t) || CA_FIND_NOUN.test(t) || !!caContractActOf(t);
  if (!asks) return null;
  const terms = caFindTerms(t);
  if (!terms.length || terms.length > CA_FIND_TERMS_MAX) return null;
  const ix = caBookIndex(); if (!ix) return null;
  let hits = []; try { hits = ix.search(terms.join(' ')); } catch (_){ hits = []; }
  const cs = hits.map(h => (typeof getContract === 'function') ? getContract(h.id) : null).filter(Boolean);
  if (!cs.length) return null;
  if (cs.length === 1) return { c: cs[0], hit: terms, how: 'name', said: t };
  const parties = [...new Set(cs.map(c => String(c.counterparty || '').trim()))];
  const many = CA_FIND_MANY.test(t);
  if (parties.length === 1 && parties[0] && (many || cs.length > CA_FIND_PICKS)) return { party: parties[0], ids: cs.map(c => c.id), hit: terms };
  /* several parties asked for in the plural ("all Juno contracts") is a
     narrowing for the box's own reader (the Board, the map), never a pick */
  if (many) return null;
  if (cs.length <= CA_FIND_PICKS) return { picks: cs.map(c => c.id), hit: terms, said: t };
  return null;
}
/* WHAT IS ASKED OF A NAMED CONTRACT, in the words left once it is named:
   each the door HaTi already has for it (a CA_PLACES word, or the amend door) */
const CA_CONTRACT_ACTS = [
  ['brief', /(?<!\p{L})(?:brief(?:ing|en)?|summar(?:y|ies|i[sz]e)|sammanfatt\p{L}*|what(?:'s| is) it about|vad handlar det om)(?!\p{L})/iu],
  ['history', /(?<!\p{L})(?:history|trail|audit trail|activity log|historik(?:en)?)(?!\p{L})/iu],
  ['redline', /(?<!\p{L})(?:redlines?|redlining|changes|negotiat\p{L}*|mark-?up|förhandl\p{L}*|ändringar(?:na)?|rödlinjer(?:na)?)(?!\p{L})/iu],
  ['sign', /(?<!\p{L})(?:sign|signing|signature|signera|signering|underteckna)(?!\p{L})/iu],
  ['oblig', /(?<!\p{L})(?:obligations?|duties|duty|åtaganden(?:a)?|skyldigheter(?:na)?)(?!\p{L})/iu],
  ['fill', /(?<!\p{L})(?:details|fill(?:\s+in)?|uppgifter(?:na)?|fyll\s+i)(?!\p{L})/iu],
  ['share', /(?<!\p{L})(?:share|send|dela|skicka)(?!\p{L})/iu],
  ['amend', /(?<!\p{L})(?:amend|amendment|ändra avtalet|tillägg)(?!\p{L})/iu],
];
function caContractActOf(s){ const hit = CA_CONTRACT_ACTS.find(([, re]) => re.test(String(s || ''))); return hit ? hit[0] : null; }
/* the words that only frame an ask about a named contract ("show me", "for", "the") */
const CA_CONTRACT_FRAME = /(?<!\p{L})(?:please|can|could|would|will|you|i|we|me|my|our|us|the|a|an|this|that|its|it|of|for|on|in|about|to|from|with|show|see|view|open|bring|take|go|get|give|read|let|want|need|like|just|look|at|up|contract|contracts|agreement|agreements|deal|no|number|nr|för|på|i|om|till|av|med|visa|öppna|se|läs|ta|mig|gå|avtal|avtalet|avtalen|kontrakt|kontraktet|den|det|dess|vill|jag|kan|du|tack|snälla|now|thanks)(?!\p{L})/giu;
/* a question about what a contract SAYS: asked of that contract, never dropped */
const CA_CONTRACT_ASKS = /^\s*(?:what|which|who|whom|whose|why|when|where|how|is|are|was|were|does|do|did|has|have|can|could|should|would|will|tell me|explain|vad|vilken|vilka|vem|varför|när|var|hur|är|finns|har|kan|ska|förklara)(?!\p{L})/iu;
/* "bring up MK-…" is the Board's strip (hbBringOf), its own door */
const CA_CONTRACT_BRING = /^\s*(?:(?:can|could|would)\s+you\s+|please\s+)*(?:bring\s+up|pull\s+up|ta\s+fram)(?!\p{L})/iu;
function caReadContract(q, opts = {}){
  const f = caContractOf(q); if (!f) return null;
  if (f.miss) return { kind: 'noref', ref: f.miss, state: 'ready' };
  const act0 = caContractActOf(q);
  if (f.picks) return { kind: 'cpick', picks: f.picks, then: act0 || 'document', state: 'ready' };
  if (f.party){
    const book = (f.ids || []).slice();
    return { kind: 'go', place: 'contracts', narrow: { rest: String(q), what: f.party, ids: book, n: book.length, party: true }, here: true, state: 'ready' };
  }
  const c = f.c;
  /* what is left of the words once the contract is named */
  let left = ' ' + String(f.said || q) + ' ';
  if (f.how === 'name') (f.hit || []).forEach(w => { left = left.replace(new RegExp('(?<![\\p{L}\\p{N}])' + String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\p{L}*(?![\\p{L}\\p{N}])', 'giu'), ' '); });
  else left = left.split(f.hit).join(' ');
  left = left.replace(/\s+/g, ' ').trim();
  if (CA_CONTRACT_BRING.test(left)) return { kind: 'hand', cid: c.id, state: 'ready' };
  const act = caContractActOf(left);
  const actRe = act ? (CA_CONTRACT_ACTS.find(x => x[0] === act) || [])[1] : null;
  const bare = left.replace(actRe ? new RegExp(actRe.source, 'giu') : /$^/, ' ').replace(new RegExp(CA_FIND_NOUN.source, 'giu'), ' ').replace(CA_CONTRACT_FRAME, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const asks = CA_CONTRACT_ASKS.test(left);
  /* a question with words of its own is asked of the contract ("what does it say about termination") */
  const words = bare.replace(CA_CONTRACT_ASKS, ' ').replace(/(?<!\p{L})(?:what|which|who|why|when|where|how|is|are|does|do|did|there|vad|vilka|vem|hur|är|finns|about|om)(?!\p{L})/giu, ' ').trim();
  if (asks && words) return { kind: 'ask', cid: c.id, q: String(q), state: 'ready' };
  if (bare) return null;              // words HaTi does not read: the box's own job
  if (asks && !act) return null;      // "what about mk-4?" names it and asks nothing: the Board's card
  if (act === 'amend') return { kind: 'door', door: 'amend', cid: c.id, state: 'ready' };
  return { kind: 'go', place: act || 'document', cid: c.id, state: 'ready' };
}
/* CONTRACTS NARROWED, NO PLACE NAMED ("the signed ones", "nordfrakt
   contracts"): read whole by the map's own reader; the screen in front keeps
   them where it can read them (`here`), else the Contracts place */
/* a fact whose own page holds it (CA_HERE_FACTS: imported, a negotiation's
   move, a side, a late duty) is that page's: the map's tasks and the box keep it */
function caReadNarrowOnly(q){
  const N = caNarrowOf(q, 'contracts'); if (!N || N.all || !N.ids) return null;
  let conds = []; try { conds = (typeof igConditions === 'function') ? (igConditions(q) || []) : []; } catch (_){ conds = []; }
  if (!conds.length || conds.some(c => !!caHereFact(c.field))) return null;
  return { kind: 'go', place: 'contracts', narrow: N, here: true, state: 'ready' };
}
/* THE ONE READING. opts.box names the box: 'home' (Home's own box, which
   keeps "bring up" for the Board's strip), 'cal' (the Calendar keeps its
   booking words), 'settings', 'list', 'window', 'counter', 'editor',
   'builder', 'bar'. */
function caUnderstand(q, opts = {}){
  const t0 = String(q || '').trim(); if (!t0) return null;
  let t = t0; try { t = caRefFix(t0); } catch (_){ t = t0; }
  /* booking or finding time is the Calendar's Jambo's (igBookAsk → calHandOff) */
  try { if (typeof igBookAsk === 'function' && igBookAsk(t)) return null; } catch (_){}
  const box = opts.box || '';
  /* a place named with what to show there is read first: it is the most the words can say */
  const and = caReadPlaceAnd(t); if (and) return and;
  /* a send, a job, a door, a Menu row, a draft are read as they always were (caActOf's readers) */
  try { if (caTakesWords(t)) return null; } catch (_){}
  /* ON THE BOARD, A CONTRACT BROUGHT UP IS ITS STRIP CARD (f447 (3),
     board-says-it-plain 2a/2b): "show me MK-1", "bring up <name>" stay the
     Board's own reading; a named act (brief, history, redlines…) still moves */
  let boardCard = false;
  try { boardCard = box === 'home' && typeof caOnBoard === 'function' && caOnBoard() && typeof hbParse === 'function' && (hbParse(t) || {}).act === 'card'; } catch (_){ boardCard = false; }
  const ct = caReadContract(t, opts);
  if (boardCard && (!ct || ct.kind !== 'go' || ct.place === 'document' || ct.narrow)) return null;
  if (ct){
    if (ct.kind === 'hand' && box === 'home') return null;
    /* a question the map's tasks read ("how do I get them to sign MK-B2" is
       the sign-link task) is the map's: the earlier reader wins its own words */
    if (ct.kind === 'ask' && typeof jmRead === 'function'){ let m = null; try { m = jmRead(t); } catch (_){ m = null; } if (m) return null; }
    return ct;
  }
  const go = caReadGoPlace(t); if (go) return go;
  /* A NARROWING THAT NAMES NO PLACE ("which contracts end this year", "draft",
     a party's name) is not the reader's: the box's own reader answers it as
     before (the Board, the map, the draft door, the chat). caReadNarrowOnly
     stays for a caller that asks for it by name. */
  return null;
}
/* A PAGE THAT KEEPS WORK (the clause editor, the builder) is left only for a
   SURE place or contract: one named with "go to", "open", "take me to", or a
   contract's number — never a bare narrowing or a title alone, which are as
   likely to be words for the work itself ("NDA for a supplier") */
function caLeavesFor(q, box){
  let u = null; try { u = caUnderstand(q, { box: box || 'editor' }); } catch (_){ u = null; }
  if (!u || u.kind !== 'go' || u.missing || u.narrowOff || u.here || CA_CARD_WORDS.includes(u.place)) return null;
  let t = String(q || ''); try { t = caRefFix(t); } catch (_){}
  return (CA_GO_LEAD.test(t) || /#?\b[A-Za-z]{2,4}-[A-Za-z0-9]*\d/.test(t)) ? u : null;
}
/* the line Jambo says for what he read (caGoSay for a move; the rest here) */
function caUnderstandSay(a){
  if (!a) return '';
  if (a.kind === 'go') return caGoSay(a);
  if (a.kind === 'noref') return _caT('hb_no_ref', { ref: a.ref });
  if (a.kind === 'cpick') return _caT('ca_cpick_title');
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  if (a.kind === 'ask') return c ? _caT('ca_ask_of', { ref: caRef(c) }) : '';
  if (a.kind === 'door') return _caT('ca_intro_job');
  return '';
}
/* THE PLACE, THEN ITS OWN APPLIER (caGo with a.narrow) */
function caGoNarrowed(a){
  const N = a.narrow || {}, rest = String(N.rest || '');
  const ids = Array.isArray(N.ids) ? N.ids.slice() : null;
  const onHome = typeof state !== 'undefined' && state && state.view === 'dashboard';
  if (a.place === 'explorer'){
    if (onHome && typeof hbSetFace === 'function'){ if (typeof hbFace !== 'function' || hbFace() !== 'explorer') hbSetFace('explorer'); }
    else if (typeof hbOpenExplorer === 'function') hbOpenExplorer();
    else return false;
    caMapNarrow(a);
    return true;
  }
  if (a.place === 'contracts' || a.place === 'list' || a.place === 'wall'){
    if (a.place !== 'contracts' && typeof regPlaceSet === 'function') regPlaceSet({ show: a.place });
    if (ids && ids.length && typeof regShowOnly === 'function'){ regShowOnly(ids, N.what || '', N.party ? { party: true } : undefined); return true; }
    return CA_GO.contracts();
  }
  if (a.place === 'board'){
    caHomeFace('board');
    if (rest && typeof hbAsk === 'function') setTimeout(() => { try { hbAsk(rest); } catch (_){} }, 0);
    return true;
  }
  if (a.place === 'negotiations'){
    /* the Negotiations seat's own named set, through the register's one door */
    if (ids && ids.length && typeof regGoFiltered === 'function'){ regGoFiltered({ only: { ids, label: String(N.what || '') } }, { scope: 'negotiations' }); return true; }
    return CA_GO.negotiations();
  }
  if (a.place === 'oblig'){
    /* the Obligations page's own `only` chip, keyed its own way (obKeyOf) */
    if (ids && ids.length && typeof obwGoFiltered === 'function' && typeof obKeyOf === 'function'){
      const keys = [];
      ids.forEach(id => { const c = typeof getContract === 'function' ? getContract(id) : null; ((c && c.obligations) || []).forEach((o, i) => { if (o) keys.push(obKeyOf(c.id, o, i)); }); });
      obwGoFiltered({ only: { keys, label: String(N.what || '') } }); return true;
    }
    return typeof setView === 'function' && (setView('obligations'), true);
  }
  return false;
}
/* the map's own narrowing (its recipe), said in the one line Jambo already said */
function caMapNarrow(a){
  const N = a.narrow || {};
  if (typeof igRecipeRun !== 'function') return false;
  let parsed = null;
  if (N.recipe && typeof igRecipeParse === 'function'){ try { parsed = igRecipeParse(N.rest); } catch (_){ parsed = null; } }
  else if (typeof igConditions === 'function'){
    let conds = []; try { conds = igConditions(N.rest) || []; } catch (_){ conds = []; }
    /* none of them on the map: the map stays whole, as the line says */
    if (conds.length && !(N.ids && !N.ids.length)) parsed = { acts: [{ narrow: { conds, mode: 'only' } }], rest: '' };
  }
  if (!parsed) return false;
  try { igRecipeRun(parsed, { report: true, quiet: true }); } catch (_){ return false; }
  return true;
}
/* WHAT JAMBO SAYS FOR A NARROWING — counted off the same reading the place applies */
function caNarrowSay(a){
  const N = a.narrow || {};
  const page = _caT('ca_w_' + a.place);
  if (a.narrowOff) return _caT('ca_and_off', { page: page.charAt(0).toUpperCase() + page.slice(1), what: N.what || '' });
  if (N.party) return _caT('ca_and_party', { who: N.what, n: N.n });
  if (N.ids && !N.ids.length) return _caT('ca_and_none', { what: N.what, page });
  if (a.place === 'explorer') return N.n != null ? _caT('ca_and_explorer', { what: N.what, n: N.n }) : _caT('ca_and_explorer_recipe', { what: N.what });
  if (a.place === 'contracts' || a.place === 'list' || a.place === 'wall') return _caT('ca_and_contracts', { what: N.what, n: N.n });
  if (a.place === 'board') return _caT('ca_and_board', { what: N.what });
  if (a.place === 'negotiations') return _caT('ca_and_negotiations', { what: N.what });
  if (a.place === 'oblig') return _caT('ca_and_oblig', { what: N.what });
  return caGoSay(Object.assign({}, a, { narrow: null }));
}
/* IS THE BRIEF KEPT? The light list carries the fact (_hasBrief); the whole record the brief */
function caBriefKept(c){ return !!(c && (c._brief || c._hasBrief || (c.brief && typeof c.brief === 'object'))); }
/* THE BRIEF'S ONE DOOR, ASKED FROM WORDS: the contract on Home, then the
   paper's own "Read the brief" (openCheckPanel, after ensureFull, as the
   paper's button does). A kept brief is shown free; none kept, the panel
   offers Write the brief with its cost — the words never spend */
function caBriefOpen(c){
  if (!c) return false;
  if (typeof pdOpenOnHome === 'function') pdOpenOnHome(c.id, 'copilot');
  else if (typeof openWorkspace === 'function') openWorkspace(c.id);
  let tries = 0;
  const show = async () => {
    const on = typeof intel !== 'undefined' && intel && intel.paper && String(intel.paper.id) === String(c.id);
    if (!on && ++tries < 40){ setTimeout(show, 100); return; }
    const cc = (typeof getContract === 'function' && getContract(c.id)) || c;
    try { if (cc._light && !cc._loaded && typeof ensureFull === 'function') await ensureFull(cc); } catch (_){}
    if (typeof openCheckPanel === 'function') openCheckPanel((typeof getContract === 'function' && getContract(c.id)) || cc, 'brief');
  };
  setTimeout(show, 0);
  return true;
}
function caAskAnywhere(text, opts = {}){
  const t = String(text || '').trim(); if (!t) return false;
  /* A REQUEST TO BOOK OR FIND TIME, OR A QUESTION ABOUT ONE'S OWN CALENDAR
     (owner, 18 Oct 2026: "fix all four"), is the Calendar's Jambo's from every
     box — the one Jambo who reads a person's events and plans time (igBookAsk
     → calHandOff). Answers 'cal' so a box can say so in its own words; the
     Calendar's own box (opts.cal) plans it itself. */
  if (!opts.cal && typeof igBookAsk === 'function' && typeof calHandOff === 'function'){
    let b = false; try { b = igBookAsk(t); } catch (_){ b = false; }
    if (b && calHandOff(t)) return 'cal';
  }
  /* the Calendar's own box keeps its booking and planning words (opts.cal) */
  if (opts.cal){ let b = false; try { b = typeof igBookAsk === 'function' && !!igBookAsk(t); } catch (_){ b = false; } if (b) return false; }
  /* THE ONE READER (owner, 19 Oct 2026: "do what the user asks in plain
     language"), the same reading whatever the box (caUnderstand) */
  const box = opts.box || (opts.cal ? 'cal' : opts.all ? 'counter' : 'page');
  let u = null; try { u = caUnderstand(t, { box }); } catch (_){ u = null; }
  /* a question asked OF a contract is Home's box's (the held ask); in a box
     that chats (the window, a list's panel, Settings, the Calendar) the box's
     own Jambo answers it, as it always did */
  if (u && u.kind === 'ask' && box !== 'counter') u = null;
  /* on Home his own box is the reader already */
  if (typeof document !== 'undefined' && document.getElementById('igd-input') && typeof intelAsk === 'function'
    && typeof state !== 'undefined' && state && state.view === 'dashboard'){
    /* …and a request to see what the screen in front shows is answered there (caHereRead) */
    if (!opts.all && !u && !caReadPlace(t) && !caTakesWords(t) && !caHereRead(t)) return false; intelAsk(t); return true; }
  if (u){
    /* a number nobody here can see is said where it was asked, when the box can say it */
    if (u.kind === 'noref' && typeof opts.say === 'function'){ opts.say(caUnderstandSay(u)); return 'said'; }
    if (u.kind === 'go' && !u.missing && !u.narrowOff && !CA_CARD_WORDS.includes(u.place) && caGo(u)) return true;
    /* a card, a question asked of a contract, "which contract?": Jambo's, beside the Board */
    return caHandHome(t, u);
  }
  let a = null; try { a = caReadPlace(t); } catch (_){ a = null; }
  if (a && a.kind === 'go' && !CA_CARD_WORDS.includes(a.place) && caGo(a)) return true;
  /* JAMBO'S MAP (js/jambomap.js) IN EVERY BOX (19 Oct 2026; was Home's box
     only): everyday words for a page open it as a place word does. What a box
     is FOR stays its own: a Settings section asked in Settings is the
     Settings finder's answer, the Calendar asked in the Calendar its own. */
  if (!a && typeof jmRead === 'function'){ let m = null; try { m = jmRead(t); } catch (_){ m = null; }
    const own = !!m && ((box === 'settings' && (!!m.st || m.place === 'settings')) || (box === 'cal' && m.place === 'calendar')
      /* the Portfolio Health Report asked by name is the chat's own document (aiWantsHealthReport → openHealthReport) */
      || (box !== 'counter' && typeof aiWantsHealthReport === 'function' && aiWantsHealthReport(t)));
    if (m && !own && m.kind === 'go' && !m.missing && !CA_CARD_WORDS.includes(m.place) && caGo(m)) return true; }
  if ((a && a.kind === 'go') || caTakesWords(t) || opts.all) return caHandHome(t, a);
  return false;
}

/* ---- "/" IN EVERY JAMBO BOX ----
   A box marked data-ca-slash lists the places, most used first, the moment it
   starts with "/" — the same rows Home's and the Counter's lists draw
   (caSlashRows), less the words that need a contract where none is open. A
   row is the place's own run (caPlaceRun). Painted fixed above the box, so a
   panel's own scroller never clips it. */
const CA_SL_MAX = 40;
const CA_SL_TALL = 360;   // the Counter's list is as tall; the rest scrolls inside it
let _caSl = null;   // { inp, rows, on }
function caSlRead(inp){
  const m = /^\s*\/([\w\-åäöÅÄÖ'’]*)$/.exec(String(inp.value || ''));
  if (!m){ caSlClose(); return; }
  const one = caOpenContract() ? new Set() : new Set(CA_PLACES.filter(p => p.need === 'one').map(p => p.k));
  const rows = caSlashRows(m[1].toLowerCase(), { max: 99 }).filter(r => !one.has(r.k)).slice(0, CA_SL_MAX);
  if (!rows.length){ caSlClose(); return; }
  _caSl = { inp, rows, on: Math.min((_caSl && _caSl.on) || 0, rows.length - 1) };
  caSlPaint();
}
function caSlPaint(){
  if (!_caSl) return;
  let el = document.getElementById('ca-slash');
  if (!el){ el = document.createElement('div'); el.id = 'ca-slash'; el.className = 'ca-pop ca-slash'; document.body.appendChild(el); }
  el.innerHTML = `<h5>${_caE(_caT('hb_pop_places'))}</h5><div role="listbox">${_caSl.rows.map((r, i) =>
    `<div class="ca-opt${i === _caSl.on ? ' on' : ''}" role="option" aria-selected="${i === _caSl.on}" data-ca-sl="${i}"><span class="who"><b>${_caE(r.word)}</b>${r.sub ? `<small>${_caE(r.sub)}</small>` : ''}</span></div>`).join('')}</div><p class="ca-hint">${_caE(_caT('hb_pop_keys'))}</p>`;
  const r = _caSl.inp.getBoundingClientRect();
  el.style.left = Math.max(8, r.left) + 'px';
  el.style.width = Math.max(260, r.width) + 'px';
  el.style.bottom = Math.max(8, innerHeight - r.top + 6) + 'px';
  el.style.maxHeight = Math.max(160, Math.min(CA_SL_TALL, r.top - 16)) + 'px';
  const on = el.querySelector('.ca-opt.on'); if (on && on.scrollIntoView) try { on.scrollIntoView({ block: 'nearest' }); } catch (_){}
}
function caSlClose(){ _caSl = null; const el = document.getElementById('ca-slash'); if (el) el.remove(); }
function caSlTake(i){
  const P = _caSl; const r = P && P.rows[i]; if (!r) return;
  P.inp.value = ''; caSlClose();
  /* A PAGE THAT KEEPS WORK leaves through its own way out (the template
     builder's tbLeave keeps what was typed): the box names it, `_caLeave` */
  const leave = P.inp && typeof P.inp._caLeave === 'function' ? P.inp._caLeave : null;
  if (leave) leave(() => caPlaceRun(r.k)); else caPlaceRun(r.k);
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._caSlWired){
  document._caSlWired = true;
  document.addEventListener('input', e => { const t = e.target; if (t && t.matches && t.matches('[data-ca-slash]')) caSlRead(t); });
  document.addEventListener('keydown', e => {
    const t = e.target; if (!_caSl || !t || t !== _caSl.inp) return;
    const n = _caSl.rows.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); e.stopPropagation(); _caSl.on = (_caSl.on + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; caSlPaint(); return; }
    if (e.key === 'Enter' || e.key === 'Tab'){ e.preventDefault(); e.stopPropagation(); caSlTake(_caSl.on); return; }
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); caSlClose(); }
  }, true);
  document.addEventListener('mousedown', e => {
    const o = e.target && e.target.closest ? e.target.closest('[data-ca-sl]') : null;
    if (o){ e.preventDefault(); caSlTake(Number(o.getAttribute('data-ca-sl'))); return; }
    if (_caSl && !(e.target && e.target.closest && e.target.closest('#ca-slash, [data-ca-slash]'))) caSlClose();
  });
}

/* ---- THE TWO WORDS THAT ANSWER WITH A CARD ----
   SHARE: two choices, each the existing door (the send screen; a colleague
   through the pass Jambo already prepares). HELP: the words, said once. */
function caGoCardHtml(a, i){
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null;
  /* A PAGE THAT CANNOT NARROW AS ASKED says so in the line above, and offers
     both ways on: the Contracts place narrowed (when any match), or the page */
  if (a.narrowOff && a.narrow){
    const N = a.narrow, any = Array.isArray(N.ids) && N.ids.length > 0, page = String(_caT('ca_w_' + a.place));
    const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
    return `<div class="ca-card" data-ca-card="${i}" data-ca-and><div class="ca-acts">${any ? B('andlist', _caT('ca_and_on_contracts', { n: N.n }), true) : ''}${B('andpage', _caT('ca_and_open_page', { page: page.charAt(0).toUpperCase() + page.slice(1) }), !any)}</div></div>`;
  }
  if (a.place === 'share' && c && !a.missing){
    const them = String(c.counterparty || '').trim();
    const B = (act, label, lead) => `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`;
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_share_title', { ref: caRef(c) }))}</div>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_share_says'))}</p>
      <div class="ca-acts">${B('shareout', them ? _caT('ca_share_out', { who: them }) : _caT('ca_share_out_none'), true)}${B('sharein', _caT('ca_share_in'))}</div></div>`;
  }
  /* DRAFT A NEW AGREEMENT (step 3, as the demo draws it): one sentence, and
     the one form. OUR PAPER OR THEIRS (owner, 15 Oct 2026: "you do not have
     an option to choose between that and an uploaded paper"): the card asks
     which, and each answer is the existing door — the form (caDraftForm) or
     the file picker the wall's "upload" uses (CA_GO.upload) */
  if (a.place === 'draft'){
    const may = (typeof canEdit !== 'function') || canEdit(), no = _caT('wz_viewers_no_create');
    const B = (act, label, lead) => may ? `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" data-ca-act="${act}" data-ca-turn="${i}">${_caE(label)}</button>`
      : `<button type="button" class="ui-btn ui-btn-sm${lead ? ' ui-btn-primary' : ''}" disabled aria-disabled="true" title="${_caE(no)}">${_caE(label)}</button>`;
    return `<div class="ca-card ca-dr" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_dr_title'))}</div>
      <p class="ca-foot" style="margin-top:0">${_caE(_caT('ca_dr_says'))}</p>${may ? '' : `<p class="ca-why">${_caE(no)}</p>`}
      <div class="ca-acts">${B('draftform', _caT('ca_dr_ours'), true)}${B('draftupload', _caT('ca_dr_theirs'), false)}</div></div>`;
  }
  /* WHAT COMES NEXT: the chips' own steps, each the chip's own press; with none, said */
  if (a.place === 'next' && c && !a.missing){
    const L = caNextSteps(c);
    const btns = L.map((k, n) => `<button type="button" class="ui-btn ui-btn-sm${n === 0 ? ' ui-btn-primary' : ''}" data-ca-act="next:${_caE(k)}" data-ca-turn="${i}">${_caE(caNextLabel(k))}</button>`).join('');
    return `<div class="ca-card" data-ca-card="${i}"><div class="ca-ct">${_caE(_caT('ca_next_title', { ref: caRef(c) }))}</div>
      ${L.length ? `<div class="ca-acts">${btns}</div>` : `<p class="ca-why">${_caE(_caT('ca_next_none'))}</p>`}</div>`;
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
  /* "Upload their paper" is the reader's own press: the picker itself */
  if (a.place === 'draft'){ if (act === 'draftform') caDraftForm(null); else if (act === 'draftupload'){ if (!caMayAdd()) return; if (typeof pdDropPick === 'function') pdDropPick(); else CA_GO.upload(); } return; }
  /* a page that cannot narrow as asked: the Contracts place narrowed, or the page itself */
  if (a.narrowOff && a.narrow){
    if (act === 'andlist') return caGo({ kind: 'go', place: 'contracts', narrow: Object.assign({}, a.narrow), state: 'ready' });
    if (act === 'andpage') return caGo({ kind: 'go', place: a.place, state: 'ready' });
    return;
  }
  const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return;
  if (String(act).startsWith('next:')){ caNextRun(c, String(act).slice(5)); return; }
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

/* ---- "WHICH CONTRACT DID YOU MEAN?" — two or three named alike ----
   Drawn as Jambo's other cards (.ca-card, .ca-acts), one press each, each
   button the contract's number and name; the press is what was asked of it
   (its paper, its brief, its history…), moved by caGo. Never a guess. */
function caPickCardHtml(a, i){
  if (!a || a.kind !== 'cpick') return '';
  const title = `<div class="ca-ct">${_caE(_caT('ca_cpick_title'))}</div>`;
  if (a.state === 'done'){
    const c = a.chose && typeof getContract === 'function' ? getContract(a.chose) : null;
    return `<div class="ca-card" data-ca-card="${i}" data-ca-cpick>${title}<p class="ca-said is-ok">${_caE(_caT('ca_cpick_done', { ref: c ? caRef(c) : '' }))}</p></div>`;
  }
  const btns = (a.picks || []).map((id, n) => { const c = typeof getContract === 'function' ? getContract(id) : null; if (!c) return '';
    return `<button type="button" class="ui-btn ui-btn-sm${n === 0 ? ' ui-btn-primary' : ''}" data-ca-act="cpick:${_caE(id)}" data-ca-turn="${i}">${_caE(caRef(c) + ' · ' + (c.name || ''))}</button>`; }).join('');
  return `<div class="ca-card" data-ca-card="${i}" data-ca-cpick>${title}<div class="ca-acts">${btns}</div></div>`;
}
function caPickPress(i, act){
  const m = caTurn(i); const a = m && m.act; if (!a || a.kind !== 'cpick' || a.state !== 'ready' || !String(act).startsWith('cpick:')) return;
  const id = String(act).slice(6); if (!(a.picks || []).includes(id)) return;
  const then = a.then === 'amend' ? 'document' : (CA_PLACES.some(p => p.k === a.then) ? a.then : 'document');
  const go = { kind: 'go', place: then, cid: id, state: 'ready' };
  a.state = 'done'; a.chose = id;
  try { intel.history.push({ role: 'assistant', text: _caE(caGoSay(go)), act: go }); } catch (_){}
  if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
  caGo(go);
}
/* ---- ON HOME, WHAT THE ONE READER READ IS DONE IN JAMBO'S PANEL ----
   intelAsk asks this first, before the screen in front's own reader: a move
   is said in one line and made (caGo); a card waits for its press; a number
   nobody here can see is said so; a question about a named contract is
   asked OF that contract — its paper opened on Home and the question put to
   Jambo with its wording (igPaperAsk, the held ask's own path), the box's
   Ask press being the press and its cost the box's own line. Answers whether
   it took the words; "bring up" is the Board's (it answers false). */
function caHomeRun(q, a){
  if (!a || typeof intel === 'undefined' || !intel || !Array.isArray(intel.history)) return false;
  const paint = () => { if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){} };
  const land = at => { if (typeof landOn === 'function') try { landOn(() => document.querySelector(`#ig-dock [data-ca-card="${at}"]`)); } catch (_){} };
  if (a.kind === 'hand') return false;
  if (a.kind === 'noref'){ intel.history.push({ role: 'user', text: q }, { role: 'assistant', text: _caE(caUnderstandSay(a)) }); paint(); return true; }
  if (a.kind === 'cpick' || a.kind === 'door'){
    intel.history.push({ role: 'user', text: q }, { role: 'assistant', text: a.kind === 'door' ? _caE(_caT('ca_intro_job')) : '', act: a });
    paint(); land(intel.history.length - 1); return true;
  }
  if (a.kind === 'ask'){
    const c = a.cid && typeof getContract === 'function' ? getContract(a.cid) : null; if (!c) return false;
    if (typeof codeNameStop === 'function' && codeNameStop(c)) return true;
    /* the paper up IS this contract: the box's own path asks it (igPaperAsk) */
    if (typeof igPaperUp === 'function' && igPaperUp() && intel.paper && String(intel.paper.id) === String(c.id)) return false;
    if (typeof igPaperAsk !== 'function') return false;
    if (typeof pdOpenOnHome === 'function') try { pdOpenOnHome(c.id, 'copilot'); } catch (_){}
    intel.history.push({ role: 'user', text: q });
    intel.busy = true; paint();
    Promise.resolve().then(() => igPaperAsk(q, c.id))
      .catch(e => { intel.history.push({ role: 'assistant', err: true, text: _caE((e && e.message) || String(e)) }); })
      .then(() => { intel.busy = false; paint(); });
    return true;
  }
  if (a.kind !== 'go') return false;
  const card = (CA_CARD_WORDS.includes(a.place) || !!a.narrowOff) && !a.missing;
  intel.history.push({ role: 'user', text: q }, { role: 'assistant', text: _caE(caGoSay(a)), act: a });
  paint();
  caGo(a);
  if (card) land(intel.history.length - 1);
  return true;
}
Object.assign(window, { CA_GO_LEAD, CA_AND_JOIN, CA_AND_TAIL, CA_AND_PLACES, CA_AND_WORDS, CA_AND_NARROWS, CA_AND_SAY_MAX, caAndPlaceAt, caNarrowOf, caSayCut, caReadPlaceAnd, caReadGoPlace,
  caRefCanon, caRefNum, CA_FIND_PICKS, CA_FIND_TERMS_MAX, CA_FIND_NOUN, CA_FIND_MANY, CA_FIND_LEAD, CA_FIND_SKIP, caBookIndex, caFindTerms, caContractOf, CA_CONTRACT_ACTS, caContractActOf, CA_CONTRACT_FRAME, CA_CONTRACT_ASKS, CA_CONTRACT_BRING,
  caReadContract, caReadNarrowOnly, caUnderstand, caLeavesFor, caUnderstandSay, caGoNarrowed, caMapNarrow, caNarrowSay, caBriefKept, caBriefOpen, caPickCardHtml, caPickPress, caHomeRun });
Object.assign(window, { CA_PLACES, CA_PLACE_LEAD, CA_PLACE_MAX, CA_PLACE_MIN_TYPED, caPlaceOf, caOnBoard, caReadPlace, CA_USES_KEY, caUses, caUseBump, CA_SLASH, CA_SLASH_MAX, caSlashWord, caSlashRows,
  CA_TRAIL_MAX, caPlaceNow, caTrailPush, caTrailTop, caTrailLabel, caTrailBack, caBackRowHtml, caHomeFace, caHomeWall, caRoomTab, CA_GO, caGoSay, caGo, caGoRepaint,
  caPlaceRows, caPlaceRun, CA_CARD_WORDS, caTakesWords, caHandHome, caAskAnywhere, CA_SL_MAX, CA_SL_TALL, caSlRead, caSlPaint, caSlClose, caSlTake, caGoCardHtml, caGoPress, CA_CHIPS, CA_CHIPS_WALL, CA_CHIP_WALL_WORD, caChipLead });
/* ANSWER WHERE YOU STAND (the imports trial): published after its definitions */
Object.assign(window, { CA_HERE_FACTS, CA_HERE_LIST, CA_HERE_PAGE_RE, CA_HERE_ACT_RE, CA_HERE_SEE_RE, CA_HERE_ALL_RE, CA_HERE_EXTRA_RE, CA_HERE_GROUP_PLACES, CA_HERE_OTHER_RE, CA_HERE_CONTRACT_RE, CA_HERE_MAX, caHereScreen, caHereFact, caHereRead, caHereOnList, caHereCardHtml, caHerePress });
