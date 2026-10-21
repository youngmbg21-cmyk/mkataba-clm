// HaTi — Jambo's prepared presses under an answer, and his standing watches.
/* ============================================================================
   ANSWERS THAT LAND YOU, A PREPARED PRESS, AND WATCHES FROM A SENTENCE
   (owner, 21 Oct 2026: "build the chatbot as recommended")
   ----------------------------------------------------------------------------
   ONE READING, ONE BUILDER, BOTH HOSTS (the side panel's conversation, js/ai.js
   renderAIFeed, and Home's, js/views/intelligence.js igMsgHTML):

   · SHOW ME › — an answer about ONE contract carries the press that lands on
     it through the house's own doors: the paper on Home lit (pdOpenOnHome →
     landOn), a clause the answer names lit on that paper, the work owed it
     speaks of (needsYouGo), its obligations (caGo 'oblig'). Derived from what
     the answer already holds — the contracts it cites — never a second call.
     An answer naming several draws the worklist door it already has
     (aiWorklistHtml); Home's own "Open on Paper" is its Show me (THE ONE DOOR).
   · ONE PREPARED PRESS — the next act, prepared up to the last safe step,
     through the existing doors: Chase › (obligationChase, which shows what goes
     and asks before anything leaves), else the contract's next step
     (caNextSteps: answer the redlines, name a signer, share → the letter on
     the send screen, never sent). Nothing acts by itself (flow rule 7).
   · WATCHES — "tell me when Siginon replies", "warn me if any contract renews
     within 60 days", "remind me Friday about the NDA" are read WITHOUT AI
     (watchRead); Jambo proposes the watch as a card and the person presses
     Start watching; the record is the server's (/api/me/watches, the person's
     own, a contract only inside their streams). The server's sweep fires each
     hit once: it reaches the bell (kind 'watch') and Home's Needs you here
     (watchesFired), and its press lands on the thing.
   Every press in a feed is bound to its own element as well as delegated, so
   it works in the popped-out window too (Picture-in-Picture), where no
   document listener of this page can hear it.
   ========================================================================== */
const _jpT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _jpE = s => (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _jpC = id => (id && typeof getContract === 'function') ? getContract(id) : null;
const _jpRef = c => (typeof contractRef === 'function') ? contractRef(c) : (c && (c.contractNo || c.id)) || '';
const _jpToday = () => (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
const _jpMay = () => (typeof canEdit !== 'function') || !!canEdit();
const _jpCap = s => { const t = String(s || '').trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; };

/* ---------------------------------------------------------------- presses */
/* the contracts an answer's cards name, in order (the cards are the answer's own) */
function jpIdsOf(cardsHtml){
  const out = []; const re = /data-ai-open="([^"]+)"/g; let m;
  while ((m = re.exec(String(cardsHtml || '')))) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}
/* WHAT THE QUESTION IS ABOUT, IN THE CHECKLIST'S OWN KINDS — read off the
   question's words; it only chooses which of the contract's owed rows Show me
   lands on, and only one that is really owed (needsYouOf) */
const JP_ABOUT = [
  ['renewal', /\b(renew\w*|notice|expir\w*|förnya\w*|uppsägning\w*|löper ut)\b/i],
  ['approval', /\b(approv\w*|godkän\w*)\b/i],
  ['sign', /\b(sign\w*|signer\w*|underteckn\w*)\b/i],
  ['quiet', /\b(redline\w*|change\w*|their asks?|ändring\w*)\b/i],
  ['details', /\b(details?|fill in|uppgifter)\b/i],
];
const JP_OBLIG_RE = /\b(obligations?|due|deliver\w*|åtagande\w*|förfall\w*)\b/i;
/* a clause the answer names by its heading, on a paper that carries clause ids */
function jpClauseIn(c, text){
  if (!c || typeof clauseSegment !== 'function') return null;
  const base = (c.negotiation && c.negotiation.baselineBody) || '';
  if (!base) return null;
  let list = []; try { list = clauseSegment(base).filter(k => k && k.clauseId); } catch (_){ list = []; }
  const plain = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  for (const k of list){
    const h = String(k.title || k.headingText || '').replace(/^\s*[\dIVXivx]+[.)]?\s*/, '').trim().toLowerCase();
    if (h.length >= 6 && plain.includes(h)) return { clauseId: String(k.clauseId), heading: h };
  }
  return null;
}
function jpShowOf(c, q, text){
  let owed = []; try { owed = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_){ owed = []; }
  const ask = String(q || '');
  for (const [kind, re] of JP_ABOUT) if (re.test(ask) && owed.some(it => it && it.kind === kind)) return { k: 'needs', kind, id: c.id };
  if (JP_OBLIG_RE.test(ask) && Array.isArray(c.obligations) && c.obligations.length) return { k: 'oblig', id: c.id };
  const cl = jpClauseIn(c, text);
  if (cl) return { k: 'clause', id: c.id, clauseId: cl.clauseId };
  return { k: 'contract', id: c.id };
}
/* an obligation of THEIRS that is late or due within the week, still open */
function jpChaseOf(c){
  if (!c || !_jpMay() || typeof obligationIsTheirs !== 'function') return null;
  const today = _jpToday(), week = (() => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + 7); return (typeof isoDay === 'function') ? isoDay(d) : d.toISOString().slice(0, 10); })();
  const due = o => String((typeof obligationDue === 'function' ? obligationDue(o) : o.due) || '').slice(0, 10);
  const list = (Array.isArray(c.obligations) ? c.obligations : []).filter(o => {
    if (!o || !o.id) return false;
    let done = false; try { done = (typeof obState === 'function' ? obState(o) : o.status) === 'done'; } catch (_){ done = false; }
    let theirs = false; try { theirs = !!obligationIsTheirs(o); } catch (_){ theirs = false; }
    const d = due(o);
    return !done && theirs && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= week;
  }).sort((a, b) => due(a).localeCompare(due(b)));
  return list[0] || null;
}
function jpActOf(c){
  if (!c) return null;
  const o = jpChaseOf(c);
  if (o) return { k: 'chase', id: c.id, ob: o.id, label: _jpT(o.chasedAt ? 'ob_wk_chase_again' : 'ob_chase') };
  let steps = []; try { steps = (typeof caNextSteps === 'function') ? (caNextSteps(c) || []) : []; } catch (_){ steps = []; }
  const k = steps[0]; if (!k) return null;
  const label = (typeof caNextLabel === 'function') ? caNextLabel(k) : k;
  return { k: 'next', id: c.id, step: k, label: _jpCap(label) };
}
/* THE ONE READING: an answer's presses, from what it holds. `noShow` where the
   host already draws its own door onto the contract (Home's Open on Paper). */
function jpPressOf(o){
  const x = o || {};
  const ids = (Array.isArray(x.ids) ? x.ids : []).filter(id => _jpC(id));
  if (ids.length !== 1) return null;
  const c = _jpC(ids[0]);
  if (!c || c._codeNamed) return null;
  const show = x.noShow ? null : jpShowOf(c, x.q, x.text);
  const act = jpActOf(c);
  return (show || act) ? { show, act } : null;
}
/* THE ONE BUILDER: Show me › and the one prepared press, links (.jb-chip), the
   press the owed lead's strong weight. `at` = "<host>:<turn>". */
function jpHtml(p, at){
  if (!p || (!p.show && !p.act)) return '';
  const show = p.show ? `<button type="button" class="jb-chip jp-show" data-jp="show" data-jp-at="${_jpE(at)}">${_jpE(_jpT('jp_show_me'))}</button>` : '';
  const act = p.act ? `<button type="button" class="jb-chip ca-chip-owed jp-act" data-jp="act" data-jp-at="${_jpE(at)}" title="${_jpE(_jpT(p.act.k === 'chase' ? 'jp_act_chase_tip' : 'jp_act_tip'))}">${_jpE(p.act.label)} ›</button>` : '';
  return `<div class="jp-row" data-jp-row>${act}${show}</div>`;
}
/* the turn a press was drawn under: the side panel's conversation or Home's */
function jpTurnOf(at){
  const m = /^(ai|ig):(\d+)$/.exec(String(at || '')); if (!m) return null;
  const H = m[1] === 'ai' ? ((typeof ai === 'object' && ai && ai.history) || []) : ((typeof intel === 'object' && intel && intel.history) || []);
  return { host: m[1], i: Number(m[2]), m: H[Number(m[2])] || null };
}
/* the side panel lies over the right of the page: put it away before landing there */
function jpClear(host){
  if (host !== 'ai') return;
  try { if (typeof aiPopped === 'function' && aiPopped()) return; } catch (_){}
  if (typeof closeAI === 'function') try { closeAI(); } catch (_){}
}
const JP_PAPER_LINE = '.ig-line-id';
function jpShowContract(id){
  const c = _jpC(id); if (!c) return false;
  if (typeof pdOpenOnHome === 'function' && pdOpenOnHome(c.id, 'plain')){
    if (typeof landOn === 'function') landOn(JP_PAPER_LINE, { focus: false, missing: _jpT('jp_show_gone') });
    return true;
  }
  if (typeof openWorkspace === 'function'){ openWorkspace(c.id); return true; }
  return false;
}
function jpShowRun(s){
  if (!s) return false;
  const c = _jpC(s.id);
  if (s.k === 'list'){ if (typeof regShowOnly !== 'function') return false; regShowOnly(s.ids || [], s.label || ''); return true; }
  if (!c) { if (typeof toast === 'function') toast(_jpT('jp_show_gone'), 'warn'); return false; }
  if (s.k === 'needs' && typeof needsYouGo === 'function') return !!needsYouGo(s.kind, c.id);
  if (s.k === 'oblig' && typeof caGo === 'function'){
    const ok = caGo({ kind: 'go', place: 'oblig', cid: c.id });
    if (ok && typeof landOn === 'function') landOn('#pd-obface, #ig-dock [data-pd-tab="oblig"], ' + JP_PAPER_LINE, { focus: false });
    return ok;
  }
  if (s.k === 'clause'){
    const ok = jpShowContract(c.id);
    const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(s.clauseId) : String(s.clauseId).replace(/["\\]/g, '\\$&');
    if (ok && typeof landOn === 'function') landOn(() => document.querySelector(`#ig-paper [data-clause="${q}"], #ig-paper [data-pz-clause="${q}"]`) || null,
      { block: 'center', focus: false, missing: _jpT('jp_clause_gone') });
    return ok;
  }
  return jpShowContract(c.id);
}
/* THE PREPARED PRESS: each through the act's own door, which shows or asks before anything leaves */
function jpActRun(a){
  if (!a) return false;
  const c = _jpC(a.id); if (!c) { if (typeof toast === 'function') toast(_jpT('jp_show_gone'), 'warn'); return false; }
  if (a.k === 'chase' && typeof obligationChase === 'function'){ obligationChase(c.id, a.ob); return true; }
  if (a.k !== 'next') return false;
  const k = a.step;
  if (k === 'share' && typeof openShareModal === 'function'){ openShareModal(c); return true; }
  if (Array.isArray(window.CA_NEXT_GO) && CA_NEXT_GO.includes(k) && typeof caNextRun === 'function') return !!caNextRun(c, k);
  if (typeof caGo === 'function') return !!caGo({ kind: 'go', place: k, cid: c.id });
  return false;
}
function jpPress(btn){
  if (!btn) return;
  const which = btn.getAttribute('data-jp');
  const T = jpTurnOf(btn.getAttribute('data-jp-at'));
  const p = T && T.m && T.m.press; if (!p) return;
  jpClear(T.host);
  if (which === 'show') jpShowRun(p.show); else jpActRun(p.act);
}

/* ---------------------------------------------------------------- watches */
const WT_KINDS = ['reply', 'renewal', 'remind', 'obligation'];
let _wt = { list: [], loaded: false, loading: null, max: 50, at: 0 };
const wtServer = () => typeof API_MODE === 'function' && API_MODE();
function watchLoad(force){
  if (!wtServer()) return Promise.resolve(_wt.list);
  if (_wt.loading && !force) return _wt.loading;
  _wt.loading = (async () => {
    try {
      const r = await api('me/watches');
      _wt.list = (r && Array.isArray(r.watches)) ? r.watches : [];
      if (r && r.max) _wt.max = r.max;
      _wt.loaded = true; _wt.at = Date.now();
    } catch (_){ /* the list stays as it was; nothing is guessed */ }
    _wt.loading = null;
    watchChanged();
    return _wt.list;
  })();
  return _wt.loading;
}
const watchesAll = () => _wt.list.slice();
const watchesLoaded = () => !!_wt.loaded;
const watchGet = id => _wt.list.find(w => String(w.id) === String(id)) || null;
/* FIRED AND NOT YET PRESSED: the bell's rows and Home's Needs you, one reading */
const watchesFired = () => _wt.list.filter(w => w && w.unseen && w.fired);
function watchPut(w){ const i = _wt.list.findIndex(x => String(x.id) === String(w.id)); if (i >= 0) _wt.list[i] = w; else _wt.list.unshift(w); }
async function watchCreate(spec){
  if (!wtServer()) throw new Error(_jpT('wt_no_server'));
  const r = await api('me/watches', 'POST', { kind: spec.kind, params: spec.params || {}, contractId: spec.contractId || null });
  if (!r || !r.watch) throw new Error(_jpT('wt_not_saved'));
  watchPut(r.watch); watchChanged();
  return r.watch;
}
async function watchPause(id, paused){
  const r = await api('me/watches/' + encodeURIComponent(id), 'PATCH', { paused: !!paused });
  if (r && r.watch) watchPut(r.watch);
  watchChanged();
  return r && r.watch;
}
async function watchSeen(id){
  const w = watchGet(id); if (w){ w.unseen = false; watchChanged(); }
  try { const r = await api('me/watches/' + encodeURIComponent(id), 'PATCH', { seen: true }); if (r && r.watch) watchPut(r.watch); } catch (_){}
  watchChanged();
}
async function watchDelete(id){
  await api('me/watches/' + encodeURIComponent(id), 'DELETE');
  _wt.list = _wt.list.filter(w => String(w.id) !== String(id));
  watchChanged();
}
/* what changed is drawn again where it shows: the bell, Home's Needs you, the conversations */
function watchChanged(){
  try { if (typeof updateAlertBadge === 'function') updateAlertBadge(); } catch (_){}
  try { if (typeof counterRepaint === 'function') counterRepaint(); } catch (_){}
  try {
    const H = (typeof ai === 'object' && ai && ai.history) || [];
    if (H.some(m => m && (m.watchAsk || m.watchList)) && typeof renderAIFeed === 'function') renderAIFeed();
    else if (typeof renderAISuggest === 'function') renderAISuggest();
  } catch (_){}
  try {
    const I = (typeof intel === 'object' && intel && intel.history) || [];
    if (I.some(m => m && (m.watchAsk || m.watchList)) && typeof renderIntelDock === 'function' && typeof state !== 'undefined' && state && state.view === 'dashboard') renderIntelDock();
  } catch (_){}
}

/* ---- A SENTENCE THAT ASKS FOR A WATCH, READ WITHOUT AI ---- */
const WT_ASK_RE = /^\s*(?:please\s+|jambo,?\s+|kan du\s+)?(?:tell me (?:when|if)|let me know (?:when|if)|warn me (?:when|if|about|before)|alert me (?:when|if)|notify me (?:when|if)|ping me (?:when|if)|remind me\b|watch for\b|keep an eye on\b|säg till (?:när|om)|meddela mig (?:när|om)|varna mig (?:när|om|för|innan)|påminn mig\b)/i;
const WT_REPLY_RE = /\b(repl(?:y|ies|ied)|respond(?:s|ed)?|answer(?:s|ed)?|gets? back|comes? back|signs?\b|svarar|återkommer|hör av sig)\b/i;
const WT_RENEW_RE = /\b(renew\w*|expir\w*|ends?|ending|notice|förnya\w*|löper ut|går ut|uppsägning\w*)\b/i;
const WT_OBLIG_RE = /\b(obligations?|åtagande\w*|åtaganden)\b/i;
const WT_SPAN_RE = /\b(?:within|in|the next|next|inom|inom de närmaste|de närmaste)\s+(\d{1,3})\s*(days?|d|weeks?|w|months?|dagar|dag|veckor|vecka|månader|månad)\b/i;
const WT_WEEKDAYS = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0, måndag: 1, tisdag: 2, onsdag: 3, torsdag: 4, fredag: 5, lördag: 6, söndag: 0 };
const WT_MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, maj: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11 };
const watchAsks = t => WT_ASK_RE.test(String(t || ''));
const _wtIso = d => (typeof isoDay === 'function') ? isoDay(d) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* a day the sentence names, read from today (the reader's own day), never guessed */
function watchDayOf(t){
  const s = String(t || '').toLowerCase();
  const today = new Date(_jpToday() + 'T00:00:00');
  let m;
  if ((m = /\b(\d{4}-\d{2}-\d{2})\b/.exec(s))) return { on: m[1], hit: m[0] };
  if ((m = /\b(today|idag|i dag)\b/.exec(s))) return { on: _wtIso(today), hit: m[0] };
  if ((m = /\b(tomorrow|imorgon|i morgon)\b/.exec(s))){ const d = new Date(today); d.setDate(d.getDate() + 1); return { on: _wtIso(d), hit: m[0] }; }
  if ((m = /\bin (\d{1,3}) (days?|weeks?)\b|\bom (\d{1,3}) (dagar|dag|veckor|vecka)\b/.exec(s))){
    const n = Number(m[1] || m[3]), unit = m[2] || m[4]; const d = new Date(today); d.setDate(d.getDate() + n * (/^(week|veck)/.test(unit) ? 7 : 1)); return { on: _wtIso(d), hit: m[0] }; }
  if ((m = /\b(?:on\s+|next\s+|this\s+|på\s+|nästa\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)\b/.exec(s))){
    const want = WT_WEEKDAYS[m[1]]; const d = new Date(today); let add = (want - d.getDay() + 7) % 7; if (!add) add = 7;
    d.setDate(d.getDate() + add); return { on: _wtIso(d), hit: m[0] }; }
  if ((m = /\b(?:on\s+|den\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|maj|jun|jul|aug|sep|oct|okt|nov|dec)[a-zä]*\b/.exec(s))){
    const d = new Date(today.getFullYear(), WT_MONTHS[m[2]], Number(m[1])); if (_wtIso(d) < _jpToday()) d.setFullYear(d.getFullYear() + 1);
    return { on: _wtIso(d), hit: m[0] }; }
  return null;
}
/* the contract a sentence names: its number (caContractOf), else a party or a title the book holds, the live one first */
function watchContractOf(t){
  const s = String(t || '');
  try {
    const r = (typeof caContractOf === 'function') ? caContractOf(s, { names: false }) : null;
    if (r && r.c) return { c: r.c };
    if (r && r.miss) return { miss: r.miss };
  } catch (_){}
  const book = ((typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : []).filter(c => c && !c.archived && !c._codeNamed);
  const low = s.toLowerCase();
  const word = n => { const w = String(n || '').trim(); if (w.length < 3) return false; const re = new RegExp('(?<![\\p{L}\\p{N}])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}])', 'iu'); return re.test(low); };
  const first = n => String(n || '').trim().split(/\s+/)[0] || '';
  let hits = book.filter(c => word(c.counterparty) || (first(c.counterparty).length >= 4 && word(first(c.counterparty))) || (String(c.name || '').length >= 6 && word(c.name)));
  if (!hits.length) return null;
  const live = c => !(c.status === 'Signed' || c.status === 'Declined' || (typeof negoExecuted === 'function' && negoExecuted(c)));
  const open = hits.filter(live);
  if (open.length) hits = open;
  hits.sort((a, b) => String(b.updatedAt || b.updated_at || '').localeCompare(String(a.updatedAt || a.updated_at || '')));
  return { c: hits[0], also: hits.length - 1 };
}
const WT_FILLER_RE = /^(?:about|of|on|to|that|regarding|for|om|att|för)\s+/i;
/* THE READING: { kind, params, contractId, c } — or { none, why } said back with what it can do */
function watchRead(text){
  const t = String(text || '').trim();
  if (!watchAsks(t)) return null;
  const body = t.replace(WT_ASK_RE, '').trim();
  const span = WT_SPAN_RE.exec(t);
  const days = span ? Math.min(365, Number(span[1]) * (/^(w|veck)/i.test(span[2]) ? 7 : /^(m|mån)/i.test(span[2]) ? 30 : 1)) : null;
  const named = watchContractOf(body);
  if (named && named.miss) return { none: true, why: _jpT('wt_why_miss', { ref: named.miss }) };
  const c = named && named.c;
  if (WT_OBLIG_RE.test(t)) return { kind: 'obligation', params: { days: days == null ? 7 : days }, contractId: c ? c.id : null, c };
  if (/^remind me\b|^påminn mig\b/i.test(t.replace(/^\s*(?:please\s+|jambo,?\s+)/i, ''))){
    const d = watchDayOf(body);
    if (!d) return { none: true, why: _jpT('wt_why_day') };
    let what = body.replace(d.hit, ' ').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < 3; i++) what = what.replace(WT_FILLER_RE, '').trim();
    what = what.replace(/[.?!]+$/, '').slice(0, 200);
    return { kind: 'remind', params: { on: d.on, what }, contractId: c ? c.id : null, c };
  }
  if (WT_RENEW_RE.test(body) && !WT_REPLY_RE.test(body)) return { kind: 'renewal', params: { days: days == null ? 60 : days }, contractId: c ? c.id : null, c };
  if (WT_REPLY_RE.test(body)){
    if (!c) return { none: true, why: _jpT('wt_why_which') };
    return { kind: 'reply', params: {}, contractId: c.id, c, also: named.also || 0 };
  }
  return { none: true, why: _jpT('wt_why_kind') };
}
/* ---- A WATCH IN WORDS (the card, the list, the bell, Needs you) ---- */
const _wtDay = iso => { const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return new Date(d + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { weekday: 'short', day: 'numeric', month: 'short' }); } catch (_){ return d; } };
function watchWords(w){
  const c = _jpC(w.contractId), ref = c ? _jpRef(c) : '', who = c ? (String(c.counterparty || '').trim() || _jpT('wt_them')) : '';
  const p = w.params || {};
  if (w.kind === 'reply') return _jpT('wt_say_reply', { who, ref });
  if (w.kind === 'renewal') return c ? _jpT('wt_say_renewal_one', { ref, n: p.days }) : _jpT('wt_say_renewal', { n: p.days });
  if (w.kind === 'obligation') return c ? _jpT('wt_say_oblig_one', { ref, n: p.days }) : _jpT('wt_say_oblig', { n: p.days });
  const what = String(p.what || '').trim();
  return what ? _jpT('wt_say_remind_what', { day: _wtDay(p.on), what }) : _jpT('wt_say_remind', { day: _wtDay(p.on) });
}
function watchFiredWords(w){
  const f = w.fired || {}, c = _jpC(f.cid || w.contractId), ref = c ? _jpRef(c) : '', who = c ? (String(c.counterparty || '').trim() || _jpT('wt_them')) : '';
  if (f.what === 'reply') return _jpT(f.how === 'note' ? 'wt_fired_note' : 'wt_fired_reply', { who, ref });
  if (f.what === 'renewal') return _jpT(f.said === 'notice' ? 'wt_fired_notice' : 'wt_fired_ends', { ref, day: _wtDay(f.day), n: f.days });
  if (f.what === 'obligation') return _jpT(f.late ? 'wt_fired_oblig_late' : 'wt_fired_oblig', { ref, day: _wtDay(f.due) });
  const what = String((w.params || {}).what || '').trim();
  return what ? _jpT('wt_fired_remind_what', { what }) : _jpT('wt_fired_remind');
}
/* THE BELL'S AND NEEDS YOU'S PRESS LANDS ON THE THING, and says it was seen */
function watchGo(id){
  const w = watchGet(id); if (!w) return false;
  watchSeen(w.id);
  const f = w.fired || {}, cid = f.cid || w.contractId, c = _jpC(cid);
  if (f.what === 'reply' && c) return (typeof needsYouGo === 'function') ? needsYouGo('quiet', c.id) : jpShowContract(c.id);
  if (f.what === 'renewal' && c) return (typeof needsYouGo === 'function') ? needsYouGo('renewal', c.id) : jpShowContract(c.id);
  if (f.what === 'obligation' && c) return jpShowRun({ k: 'oblig', id: c.id });
  if (c) return jpShowContract(c.id);
  return watchListOpen();
}
/* ---- THE CARD JAMBO PROPOSES, AND YOUR WATCHES ---- */
function watchAskHtml(m, at){
  const a = m.watchAsk || {};
  if (a.none) return `<div class="jp-watch"><div>${_jpE(a.why || _jpT('wt_why_kind'))}</div><div class="jp-sub">${_jpE(_jpT('wt_can_do'))}</div></div>`;
  const live = a.id ? watchGet(a.id) : null;
  const say = _jpT('wt_card', { what: watchWords(a) });
  const also = a.also ? `<div class="jp-sub">${_jpE(_jpTn('wt_also', a.also, { n: a.also, ref: _jpRef(_jpC(a.contractId)) }))}</div>` : '';
  if (live || a.id) return `<div class="jp-watch"><div>${_jpE(say)}</div><div class="jp-sub">${_jpE(live ? _jpT(live.paused ? 'wt_card_paused' : 'wt_card_on') : _jpT('wt_card_gone'))}</div><div class="jp-row"><button type="button" class="jb-chip" data-jp-wlist="${_jpE(String(at || '').split(':')[0] || 'ai')}">${_jpE(_jpT('wt_list_chip'))}</button></div></div>`;
  const off = !wtServer();
  return `<div class="jp-watch"><div>${_jpE(say)}</div>${also}<div class="jp-sub">${_jpE(_jpT(off ? 'wt_no_server' : 'wt_card_note'))}</div><div class="jp-row"><button type="button" class="jb-chip ca-chip-owed" data-jp-wstart="${_jpE(at)}"${off ? ' disabled' : ''}>${_jpE(_jpT('wt_start'))}</button></div></div>`;
}
const _jpTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : _jpT(k, v);
function watchListHtml(){
  const L = watchesAll();
  if (!wtServer()) return `<div class="jp-watch"><div>${_jpE(_jpT('wt_no_server'))}</div></div>`;
  if (!L.length) return `<div class="jp-watch"><div>${_jpE(_jpT('wt_list_none'))}</div><div class="jp-sub">${_jpE(_jpT('wt_can_do'))}</div></div>`;
  const rows = L.map(w => {
    const told = w.lastFiredAt ? _jpT('wt_told', { day: _wtDay(w.lastFiredAt) }) : '';
    const state = w.endedAt ? _jpT('wt_done') : w.paused ? _jpT('wt_paused') : _jpT('wt_on');
    const sub = [state, told].filter(Boolean).join(' · ');
    const acts = (w.endedAt ? '' : `<button type="button" class="jb-chip" data-jp-wpause="${_jpE(w.id)}" data-jp-paused="${w.paused ? '0' : '1'}">${_jpE(_jpT(w.paused ? 'wt_resume' : 'wt_pause'))}</button>`)
      + `<button type="button" class="jb-chip" data-jp-wdel="${_jpE(w.id)}">${_jpE(_jpT('wt_delete'))}</button>`;
    return `<li class="jp-wrow" data-jp-wrow="${_jpE(w.id)}"><div>${_jpE(_jpCap(watchWords(w)))}</div><div class="jp-sub">${_jpE(sub)}</div><div class="jp-row">${acts}</div></li>`;
  }).join('');
  return `<div class="jp-watch"><div class="jp-wt-head">${_jpE(_jpTn('wt_list_head', L.length, { n: L.length }))}</div><ul class="jp-wlist">${rows}</ul></div>`;
}
/* "Your watches" said in the conversation it was asked from (Home's, else the
   side panel's), drawn live from the store */
function watchListOpen(host){
  watchLoad(true);
  if (host === 'ig' && typeof intel === 'object' && intel && Array.isArray(intel.history) && typeof renderIntelDock === 'function'){
    intel.history.push({ role: 'assistant', text: '', watchList: true, free: true }); renderIntelDock(); return true; }
  if (typeof aiPush !== 'function' || typeof ai !== 'object' || !ai) return false;
  aiPush('assistant', { text: '', watchList: true, free: true });
  if (!ai.open && !(typeof aiPopped === 'function' && aiPopped()) && typeof openAI === 'function') openAI(null, { here: true, noFocus: true });
  if (typeof renderAIFeed === 'function') renderAIFeed();
  return true;
}
/* a watch sentence in a conversation: the card under the words (Copilot prepares) */
const WT_LIST_RE = /^\s*(?:show\s+(?:me\s+)?)?(?:my|your|mina|dina)\s+(?:watches|bevakningar)\s*[.?!]*\s*$/i;
function watchTurnFor(text){
  const t = String(text || '');
  if (WT_LIST_RE.test(t)) return { text: '', watchList: true, free: true };
  const r = watchRead(t); if (!r) return null;
  if (r.none) return { text: '', watchAsk: { none: true, why: r.why }, free: true };
  return { text: '', watchAsk: { kind: r.kind, params: r.params, contractId: r.contractId || null, also: r.also || 0 }, free: true };
}
/* the side panel and the list panel: said in the one conversation */
function watchAskHere(text){
  const turn = watchTurnFor(text); if (!turn) return false;
  if (typeof aiPush !== 'function') return false;
  if (turn.watchList) watchLoad(true);
  aiPush('user', { text: _jpE(text), raw: text });
  aiPush('assistant', turn);
  if (typeof renderAIFeed === 'function') renderAIFeed();
  return true;
}
async function watchStart(at, btn){
  const T = jpTurnOf(at); const a = T && T.m && T.m.watchAsk; if (!a || a.none || a.id) return;
  if (btn) btn.disabled = true;
  try {
    const w = await watchCreate(a);
    a.id = w.id;
    if (typeof toast === 'function') toast(_jpT('wt_started', { what: watchWords(w) }), 'ok');
  } catch (e){
    if (btn) btn.disabled = false;
    if (typeof toast === 'function') toast((e && e.message) || _jpT('wt_not_saved'), 'err');
  }
  watchChanged();
}
async function watchRowAct(btn){
  const del = btn.getAttribute('data-jp-wdel'), pause = btn.getAttribute('data-jp-wpause');
  btn.disabled = true;
  try {
    if (del){ await watchDelete(del); if (typeof toast === 'function') toast(_jpT('wt_deleted'), 'ok'); }
    else if (pause) await watchPause(pause, btn.getAttribute('data-jp-paused') === '1');
  } catch (e){ btn.disabled = false; if (typeof toast === 'function') toast((e && e.message) || _jpT('wt_not_saved'), 'err'); }
}
/* ONE HANDLER for every press this module draws */
function jpClick(e){
  const t = e.target; if (!t || !t.closest) return false;
  let b;
  if ((b = t.closest('[data-jp]'))){ e.preventDefault(); jpPress(b); return true; }
  if ((b = t.closest('[data-jp-wstart]'))){ e.preventDefault(); watchStart(b.getAttribute('data-jp-wstart'), b); return true; }
  if ((b = t.closest('[data-jp-wdel], [data-jp-wpause]'))){ e.preventDefault(); watchRowAct(b); return true; }
  if ((b = t.closest('[data-jp-wlist]'))){ e.preventDefault(); watchListOpen(b.getAttribute('data-jp-wlist')); return true; }
  return false;
}
/* bound to each element of a feed just painted (the popped-out window hears
   no listener of this page's document); the document delegate skips these */
function jpWire(root){
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('[data-jp], [data-jp-wstart], [data-jp-wdel], [data-jp-wpause], [data-jp-wlist]').forEach(b => {
    if (b.dataset.jpBound) return;
    b.dataset.jpBound = '1';
    b.addEventListener('click', e => { e.stopPropagation(); jpClick(e); });
  });
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._jpWired){
  document._jpWired = true;
  document.addEventListener('click', e => { const t = e.target; if (t && t.closest && t.closest('[data-jp-bound]')) return; jpClick(e); });
}
/* the server's sweep runs every five minutes: the list is read again on the same beat while the page is in view */
if (typeof window !== 'undefined' && typeof setInterval === 'function' && !window._wtPoll){
  window._wtPoll = setInterval(() => { try { if (wtServer() && _wt.loaded && !(typeof document !== 'undefined' && document.hidden)) watchLoad(true); } catch (_){} }, 5 * 60 * 1000);
}

Object.assign(window, { jpIdsOf, jpPressOf, jpShowOf, jpActOf, jpChaseOf, jpClauseIn, jpHtml, jpTurnOf, jpShowRun, jpActRun, jpShowContract, jpPress, jpWire, JP_PAPER_LINE,
  WT_KINDS, watchLoad, watchesAll, watchesLoaded, watchGet, watchesFired, watchCreate, watchPause, watchSeen, watchDelete, watchChanged,
  watchAsks, watchRead, watchDayOf, watchContractOf, watchWords, watchFiredWords, watchGo, watchAskHtml, watchListHtml, watchListOpen, watchTurnFor, watchAskHere, watchStart });
