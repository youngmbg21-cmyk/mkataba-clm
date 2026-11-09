/* ============================================================
   THE CONTRACT'S READINGS AND WRITERS, AND THE DOOR THAT BRINGS A CONTRACT UP
   (js/views/boardstrip.js — THE LIFELINE STRIP IS GONE, owner, 9 Nov 2026:
   "delete this page". The card a contract was brought up on — Needs you,
   The deal, Key terms, What Jambo read, its ⋯ pages and its Keep · Ask why ·
   Let it go foot — is no longer drawn anywhere. The story is in
   docs/MAP-HISTORY.md under this file's heading.)
   ============================================================
   WHAT STAYS, because the rest of HaTi reads it:
     hbStripBring(id, page)  THE ONE DOOR every caller still presses: it lands
                             on the paper with its Dossier (roomHomeLand); 'where'
                             opens Where we are in the middle (pd2StandsOpen),
                             'hist' opens History in the middle (pd2HistOpen).
     roomRetiredLand         the router behind setView('workspace') and the old
                             room's tabs; it ends in hbStripBring.
     bsObRows, bsFamRows, bsPrivateOf / bsPrivatePillHtml, bsShortName, bsDay,
     the pay readers and the ONE writer paySet, the pay editor (payEditOpen →
     pd2PayOpen, in the middle beside the paper), the NDA readers and the ONE
     writer ndaSet, ndaEditOpen, bsReadWait, bsGo.
   EVERYTHING IS READ, NOTHING IS INVENTED: every figure comes off a reading
   the rest of HaTi already makes; a fact the record does not hold is said.
   ============================================================ */
let _bsDone = new Set();   /* …and answered: the waiting ring stops even where the read came back partial */
const bsE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const bsT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const bsTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;
const _bsDay0 = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
const _bsDD = 86400000;
function bsToday(){ return (typeof todayISO === 'function') ? todayISO() : ''; }
/* a day as a person says it, in their language: "1 Jan 2027" */
function bsDay(d){
  const x = (d instanceof Date) ? d : _bsDay0(d);
  if (!x || isNaN(x)) return '';
  try { return x.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  catch (_){ return x.toISOString().slice(0, 10); }
}
function bsContract(id){ try { return (typeof getContract === 'function') ? getContract(id) : null; } catch (_){ return null; } }
function bsRef(c){ return (typeof contractRef === 'function') ? contractRef(c) : String((c && c.id) || ''); }
function bsPhone(){ return typeof window !== 'undefined' && ((window.mPhone && mPhone()) || (window.innerWidth && window.innerWidth < 768)); }

/* ---- BRING IT UP (the one door) ----
   THE STRIP IS GONE (owner, 9 Nov 2026). The door stays, because the Board's
   rows, "Bring up MK-…", ⌘K, the family line, the Approvals panel, the
   Parties table and the old room's tabs all press it; it lands where the
   one-page Home plan lands everything: the paper with its Dossier. A page
   named lands in the middle beside the paper. False on the phone (it keeps
   its own contract screens) and where Home is not loaded (the harnesses):
   the caller opens the room as before. */
function hbStripBring(id, page){
  const c = bsContract(id); if (!c) return false;
  if (typeof window.codeNameStop === 'function' && codeNameStop(c)) return false;
  if (bsPhone() || typeof roomHomeLand !== 'function') return false;
  /* THE CONTRACT IN HAND: the one brought up is the one every door names next (the room's door set it so) */
  if (window.state){ state.activeId = c.id; state.selId = c.id; }
  const mid = page === 'where' ? 'pd2StandsOpen' : page === 'hist' ? 'pd2HistOpen' : null;
  const onIt = () => { try { const pc = (typeof pdContract === 'function') ? pdContract() : null;
    return !!(pc && String(pc.id) === String(c.id) && typeof pdOnPaper === 'function' && pdOnPaper()); } catch (_){ return false; } };
  if (mid && typeof window[mid] === 'function' && onIt() && window[mid](c.id)) return true;
  if (roomHomeLand(c.id) === false) return false;
  if (mid && typeof window[mid] === 'function') setTimeout(() => { try { window[mid](c.id); } catch (_){} }, 400);
  return true;
}
/* ---- THE ROOM RETIRES (step 8) ----
   Every door that opened the contract room lands on the paper with its
   Dossier; Where we are when the door named 'stands', History when it named
   'history'. False on the phone and where Home is not loaded. */
function roomRetiredLand(id, tab){
  if (bsPhone()) return false;
  if (typeof hbS !== 'function' || typeof hbPaintBoard !== 'function') return false;
  const page = tab === 'stands' ? 'where' : tab === 'history' ? 'hist' : 'ov';
  /* RETIRE THE OLD ROOM (Round 5, owner's yes 24 Oct 2026): a door that opened the room lands on the paper with
     its Dossier (roomHomeLand, the one landing); Where we are and History keep their own pages */
  if (page === 'ov' && typeof roomHomeLand === 'function'){ const r = roomHomeLand(id); if (r !== false) return true; }
  return hbStripBring(id, page);
}
/* the Dossier beside the paper is drawn again when a reading here moved (the strip's repaint, before) */
function bsDossierRepaint(){ try { if (typeof pdGlanceRepaint === 'function') pdGlanceRepaint(); } catch (_){} }

/* ============================================================
   THE READINGS — counting is not drawing (the Insights panels' rule)
   ============================================================ */
/* ============================================================
   THE READINGS — counting is not drawing (the Insights panels' rule)
   ============================================================ */
function bsMoneyOk(){ return (typeof canViewValues !== 'function') || !!canViewValues(); }
function bsOwedKeys(c){
  let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
  return new Set(((d && d.items) || []).filter(x => x.open).map(x => x.key));
}
/* the obligations, next first: open ones by their due day (a day missing
   last), then the done ones */
function bsObRows(c){
  const today = bsToday();
  const list = Array.isArray(c && c.obligations) ? c.obligations.filter(o => o && (o.desc || o.title)) : [];
  const due = o => (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
  const state0 = o => (typeof obState === 'function') ? obState(o) : (o.status === 'done' ? 'done' : 'open');
  const theirs = o => (typeof obligationParty === 'function') ? obligationParty(o) === 'theirs' : o.party === 'theirs';
  const rows = list.map(o => ({ o, due: due(o), st: state0(o), theirs: theirs(o), what: String(o.desc || o.title || '').trim() }));
  const key = r => (r.st === 'done' ? '2' : '1') + (r.due || '9999-99-99');
  rows.sort((a, b) => key(a).localeCompare(key(b)));
  const next = rows.find(r => r.st !== 'done') || null;
  return { rows, next, ours: rows.filter(r => !r.theirs).length, theirs: rows.filter(r => r.theirs).length, today };
}
/* ---- PAY IS NOT DEAL VALUE (owner picked "Pay section — the SAP way",
   17 Oct 2026) ----
   An employment contract (fxIsPay, the record's own category) reads as a
   job: its tiles say the role, the start, when probation ends and the notice
   period, and its pay is a table of parts — base pay (the record's value,
   where every gate already reads it) and whatever else c.pay holds
   (allowances, a bonus), each with how often and from when. Nothing here
   adds it to anything (fxCounted answers nothing for pay). */
function bsIsPay(c){ return typeof fxIsPay === 'function' && !!fxIsPay(c); }
function _bsAddMonths(d, n){
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last)));
}
/* How often, in the reader's words; '' where it is not recorded */
function bsPayEvery(k){ return (typeof PAY_EVERY !== 'undefined' && PAY_EVERY.includes(k)) ? bsT('pay_ev_' + k) : ''; }
/* an amount in the contract's own currency, written out (the long print) */
function bsPayMoney(c, n){
  const cur = (typeof contractCurrency === 'function') ? contractCurrency(c) : '';
  let s = String(n); try { s = Number(n).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined); } catch (_){ s = String(n); }
  return `${cur} ${s}`.trim();
}
/* THE BASE PAY IN ONE LINE — "KES 420,000 · Monthly" — the reading the
   Overview's Pay cell and the phone borrow; '' where none is recorded */
function payBaseLine(c, base){
  if (!bsIsPay(c) || typeof payPartsOf !== 'function') return '';
  const b = (payPartsOf(c, base) || []).find(r => r.kind === 'base');
  if (!b || !(b.amount > 0)) return '';
  return [bsPayMoney(c, b.amount), bsPayEvery(b.every)].filter(Boolean).join(' · ');
}
/* who may change pay, and why not: a person who may edit and see money, on a
   contract nobody has signed yet (a pay rise after signing is an amendment) */
function bsPayLock(c){
  const signed = (typeof negoExecuted === 'function' && negoExecuted(c)) || c.status === 'Signed'
    || (typeof negoAnySignature === 'function' && negoAnySignature(c));
  return signed ? bsT('bs_pay_locked') : '';
}
function bsPayMay(c){ return bsMoneyOk() && (typeof canEdit !== 'function' || !!canEdit()) && !bsPayLock(c); }
/* THE ONE WRITER OF PAY. The base amount is the record's value; how often
   and from when, and every other part, are c.pay (payClean's shape, the
   shape the server keeps). Refuses, with the way forward, a base that is not
   a number and a part with an amount but no name. Writes nothing when
   nothing moved; the trail line names no figure. */
function payAmountRead(s){
  const t = String(s == null ? '' : s).trim();
  if (!t) return { empty: true };
  const n = t.replace(/[\s,  ]/g, '');
  return /^\d+(?:\.\d+)?$/.test(n) ? { n: Number(n) } : { words: t.slice(0, 60) };
}
function paySet(c, rows){
  if (!c || !Array.isArray(rows)) return { changed: false };
  if (!bsPayMay(c)) return { err: bsPayLock(c) || bsT('bs_pay_no_right') };
  const base = rows.find(r => r && r.kind === 'base') || {};
  const ba = payAmountRead(base.amount);
  if (ba.words) return { err: bsT('bs_pay_base_num') };
  const parts = [];
  for (const r of rows.filter(x => x && x.kind === 'part')){
    const label = String(r.label || '').trim(), am = payAmountRead(r.amount);
    if (!label && am.empty && !r.from) continue;            // a blank row added and left: nothing to keep
    if (!label) return { err: bsT('bs_pay_part_name') };
    parts.push({ id: r.id, label, every: r.every || '', amount: am.n != null ? am.n : null, words: am.words || '', from: r.from || '' });
  }
  if (parts.length > PAY_PARTS_MAX) return { err: bsT('bs_pay_cap', { n: PAY_PARTS_MAX }) };
  const pay = payClean({ every: base.every || '', from: base.from || '', parts });
  const v = ba.n != null && ba.n > 0 ? ba.n : 0;
  const was = JSON.stringify([Number(c.value) || 0, payClean(c.pay)]);
  if (was === JSON.stringify([v, pay])) return { changed: false };
  c.value = v;
  if (v > 0 && c.valueType === 'none') c.valueType = 'estimated';
  if (pay) c.pay = pay; else delete c.pay;
  if (typeof todayStr === 'function') c.lastAction = todayStr();
  if (typeof logAudit === 'function') logAudit(c, 'Edited', `Updated the pay (${parts.length + (v > 0 ? 1 : 0)} part${parts.length + (v > 0 ? 1 : 0) === 1 ? '' : 's'})`);
  if (typeof persist === 'function') persist(c);
  return { changed: true };
}
/* THE EDIT IN HAND — one at a time, this sitting only; a draft of rows */
let _bsPay = null;
function bsPayDraft(c){
  const rows = (typeof payPartsOf === 'function' ? payPartsOf(c) : []).map(r => ({ kind: r.kind, id: r.id, label: r.label || '', every: r.every || '',
    amount: r.amount != null ? String(r.amount) : (r.words || ''), from: r.from || '' }));
  if (!rows.some(r => r.kind === 'base')) rows.unshift({ kind: 'base', id: 'base', label: '', every: '', amount: '', from: '' });
  return { id: String(c.id), rows, n: rows.length };
}
/* THE ONE DOOR ONTO PAY: the pay editor in the middle beside the paper (pd2PayOpen); the Overview's Pay cell,
   the Fill-in face's "Edit pay" and the Dossier's owed row all come here. The paper comes up first where it is not. */
function payEditOpen(id){
  const c = bsContract(id); if (!c || !bsPayMay(c)) return false;
  if (bsPhone() || typeof window.pd2PayOpen !== 'function') return false;
  _bsPay = bsPayDraft(c);
  const onIt = (() => { try { const pc = (typeof pdContract === 'function') ? pdContract() : null;
    return !!(pc && String(pc.id) === String(c.id) && typeof pdOnPaper === 'function' && pdOnPaper()); } catch (_){ return false; } })();
  /* the box takes the focus a beat after the page opens: the pop-up's own focus lands first */
  if (onIt){ if (!window.pd2PayOpen(c.id)){ _bsPay = null; return false; } setTimeout(() => bsPayFocus(id), 80); return true; }
  if (typeof roomHomeLand !== 'function' || roomHomeLand(c.id) === false){ _bsPay = null; return false; }
  setTimeout(() => { try { if (window.pd2PayOpen(c.id)) setTimeout(() => bsPayFocus(id), 80); } catch (_){} }, 400);
  return true;
}
function bsPayFocus(id){
  const host = bsPayHost(id); if (!host) return;
  const f = host.querySelector('[data-bs-pay-f="amount"]');
  if (f && typeof fieldFocus === 'function') fieldFocus(f, { preventScroll: true });
}
function bsPayHost(id){ return document.querySelector(`[data-bs-host="pay"][data-bs-cid="${(typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(id)) : id}"]`); }
function bsPayPaint(id, force){ const host = bsPayHost(id), c = bsContract(id); if (host && c) bsPaintPay(host, c, force); }

/* ---- AN NDA'S TWO FACTS ON ITS PANEL (owner picked "The tail on the life
   line", 17 Oct 2026; piece 4 of the sensitive contracts plan) ----
   The Value tile reads "Secret until", the facts line says who keeps it
   secret, and the life line draws the sharing period and then a striped
   "kept secret" tail with the reminder on it. ONE reading (ndaOf, js/nda.js),
   ONE writer (ndaSet), ONE door (ndaEditOpen): the tile's "confirm" mark, the
   section's own link and the Overview's two cells all come here. A signed NDA
   is confirmed too: the facts are our reading of the paper, like its
   obligations, and the server lets them move after signature. */
function bsIsNda(c){ return typeof ndaIs === 'function' && !!ndaIs(c); }
function bsNda(c){ return (bsIsNda(c) && typeof ndaOf === 'function') ? ndaOf(c) : null; }
function ndaMay(c){ return !!c && !(typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE) && ((typeof canEdit !== 'function') || !!canEdit()); }
/* "Both sides (mutual)", "One-way: they keep ours secret" — '' when not said */
function ndaDirWords(dir){ return dir ? bsT('nda_dir_' + dir) : ''; }
/* until when, as the end of a sentence: "until 31 Jul 2030", "for good" */
function ndaUntilWords(N){
  if (!N) return '';
  if (N.forGood) return bsT('nda_for_good_lc');
  return N.ends ? bsT(N.latest ? 'nda_until_latest' : 'nda_until', { d: bsDay(N.ends) }) : '';
}
/* the reminder this NDA carries (minted by ndaSet) */
function ndaReminderOf(c){
  const id = c && c.nda && c.nda.ob;
  return id ? ((Array.isArray(c.obligations) ? c.obligations : []).find(o => o && String(o.id) === String(id)) || null) : null;
}
/* the reminder's line is a RECORD (an obligation's description is stored,
   like a template's own), so it keeps English: "Secrecy ends 31 Jul 2030" */
function ndaReminderDesc(ends){
  const d = _bsDay0(ends); if (!d) return '';
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Secrecy ends ${d.getUTCDate()} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
/* THE ONE WRITER of an NDA's facts: what a person confirmed or set (c.nda),
   and the reminder that rides it — an ordinary obligation, ours, the owner's,
   a month before secrecy ends (ndaRemindDay: none once it has ended, none for
   good). Saving what the reading found IS confirming it. Refuses an empty
   answer with the way forward; writes nothing when nothing moved. */
function ndaSet(c, v){
  if (!c || !v || typeof ndaClean !== 'function') return { changed: false };
  if (!ndaMay(c)) return { err: bsT('nda_no_right') };
  const was = ndaClean(c.nda);
  const me = (typeof currentUser === 'function' && currentUser()) ? String(currentUser().name || '') : '';
  const n = ndaClean({ dir: v.dir, ends: v.forGood ? '' : v.ends, forGood: !!v.forGood, trade: !!v.trade, clause: v.clause,
    who: me || (was && was.who), at: (typeof nowISO === 'function') ? nowISO() : '', ob: was && was.ob });
  if (v.ends && !v.forGood && !(n && n.ends)) return { err: bsT('nda_bad_day') };
  if (!n) return { err: bsT('nda_need') };
  if (was && JSON.stringify(ndaFacts(was)) === JSON.stringify(ndaFacts(n))) return { changed: false };
  c.nda = n;
  c.obligations = Array.isArray(c.obligations) ? c.obligations : [];
  const due = (typeof ndaRemindDay === 'function') ? ndaRemindDay(n.ends, bsToday()) : '';
  const i = n.ob ? c.obligations.findIndex(o => o && String(o.id) === String(n.ob)) : -1;
  if (!due){
    if (i >= 0 && c.obligations[i].status !== 'done') c.obligations.splice(i, 1);
    delete n.ob;
  } else if (i >= 0){
    const o = c.obligations[i];
    o.due = due; o.desc = ndaReminderDesc(n.ends);
    if (o.status === 'done') o.status = 'open';
  } else {
    const o = { id: 'ob_nda' + Math.random().toString(36).slice(2, 8), desc: ndaReminderDesc(n.ends), due, recurring: 'none', party: 'ours',
      assignee: (typeof contractOwnerName === 'function' ? contractOwnerName(c) : '') || '', status: 'open', quote: '', origin: 'nda' };
    c.obligations.push(o); n.ob = o.id;
  }
  if (typeof todayStr === 'function') c.lastAction = todayStr();
  const dirRec = { mutual: 'mutual', ours: 'one-way, we share', theirs: 'one-way, they share' }[n.dir] || 'who keeps it secret not said';
  if (typeof logAudit === 'function') logAudit(c, 'Edited', `Confirmed the confidentiality: ${dirRec}; secret ${n.forGood ? 'for good' : (n.ends ? 'until ' + n.ends : 'until a day not said')}${due ? '; reminder on ' + due : ''}`);
  if (typeof persist === 'function') persist(c);
  return { changed: true };
}
/* THE ONE DOOR ONTO AN NDA'S FACTS: answered beside the paper (the Overview's two cells and
   the tile's mark come here); the phone keeps its own screens */
function ndaEditOpen(id){
  const c = bsContract(id); if (!c || !bsIsNda(c) || !ndaMay(c)) return false;
  /* THE BOARD READS (owner, 20 Oct 2026, the Legora way): an NDA's facts are
     answered beside the paper — the grid's row while one is owed, else its
     line under Key terms, open for changing. (The phone keeps its own.) */
  if (!bsPhone() && typeof pdFillOpen === 'function' && typeof pdKtOpen === 'function'){
    let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
    const owed = ((d && d.items) || []).find(x => x && x.open && x.kind === 'nda');
    return owed ? pdFillOpen(c.id, { key: owed.key }) !== false : pdKtOpen(c.id, 'ndaDir') !== false;
  }
  return false;
}
/* ---- JAMBO BEHIND THE WALL: THE ONE PRESS (owner picked "One press — the
   SAP way", 17 Oct 2026; decision 2) ----
   A private folder's contract is read only when one of its people asks. Its
   "What Jambo read" section says so in its head — not read, or not read since
   the last change — and carries the one press, Read it now, with its cost
   beside it: the same reading the upload's own box starts (triageAndPaint,
   `asked`). Null for every other contract, and once it is read. */
const _bsReading = new Set();
function bsReadWait(c){
  if (!(c && typeof jamboOnPress === 'function' && jamboOnPress(c))) return null;
  if (_bsReading.has(String(c.id)) || (typeof triageBusy === 'function' && triageBusy(c))) return { busy: true };
  const need = (typeof triageNeedsRead === 'function') ? triageNeedsRead(c) : !(c && c.triage);
  if (!need) return null;
  return { stale: !!(typeof triageOf === 'function' && triageOf(c)) };
}
const _bsX = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
/* ---- A PRIVATE CONTRACT SAYS SO IN ITS HEAD (round 7 as drawn, pass 4:
   "[Draft] [🔒 Private · Board]") ----
   ONE reading of the private stream a contract is kept in and who is named on
   it (privateStreamsMap / privateStreamIds, the wall's own record), and ONE
   pill drawn from it, on the page's head and Jambo's glance. A code-named
   deal adds nothing to what its stand-in says. */
function bsPrivateOf(c){
  if (!c || c._codeNamed || typeof streamIsPrivate !== 'function' || !streamIsPrivate(c.folder)) return null;
  const fid = String(c.folder || '');
  let stream = ''; try { stream = (typeof regStreamName === 'function') ? regStreamName(c) : ''; } catch (_){ stream = ''; }
  if (!stream) stream = ((typeof FOLDERS === 'object' && FOLDERS && FOLDERS[fid]) || {}).name || fid;
  const p = (typeof privateStreamsMap === 'function') ? (privateStreamsMap()[fid] || {}) : {};
  const ids = (typeof privateStreamIds === 'function') ? privateStreamIds(p) : [];
  const users = (typeof getUsers === 'function') ? (getUsers() || []) : [];
  const people = Array.isArray(p.people) ? p.people : [];
  const names = ids.map(id => { const u = users.find(x => x && String(x.id) === id) || people.find(x => x && String(x.id) === id);
    return String((u && u.name) || '').trim(); }).filter(Boolean);
  return { fid, stream, names, first: names.map(n => n.split(/\s+/)[0]) };
}
function bsPrivatePillHtml(c, o){
  const P = bsPrivateOf(c); if (!P) return '';
  /* beside the stream's own name (Details' Filing) it says only "Private" */
  const word = (o && o.short) ? bsT('bs_private_pill_short') : bsT('bs_private_pill', { s: P.stream });
  return `<span class="bs-lockp" title="${bsE(bsT('igw_private_title', { s: P.stream }))}">${(typeof icon === 'function') ? icon('lock', 'w-3 h-3') : ''}${bsE(word)}</span>`;
}
/* ---- THE AGREEMENT FAMILY (owner picked "Family line" by name, 16 Oct
   2026): a contract tied to an amendment says so on its card, and so does
   the amendment — one row under the head naming the whole family in order,
   the original first, then each child numbered per kind as the paper numbers
   it (amendmentOrdinal's rule), the open card lit. Every other member is a
   door: it brings that contract's card up (hbStripBring, the one door). A
   READING of familyOf, nothing filed; a contract with no family draws nothing. */
function bsFamRows(c){
  if (typeof familyOf !== 'function') return [];
  const fam = familyOf(c) || [];
  if (fam.length < 2) return [];
  const head = fam[0];
  const when = x => String(x.createdAt || x._raisedAt || '');
  const kids = fam.slice(1).filter(Boolean).sort((a, b) => when(a).localeCompare(when(b)) || String(a.id).localeCompare(String(b.id)));
  const seen = {};
  const R = (typeof RELATION_LABEL === 'object' && RELATION_LABEL) || {};
  return [{ c: head, label: bsT('bs_fam_original') }].concat(kids.map(k => {
    const rel = k.relation || 'amendment';
    seen[rel] = (seen[rel] || 0) + 1;
    return { c: k, label: bsT('bs_fam_nth', { word: R[rel] || R.amendment || 'Amendment', n: seen[rel] }) };
  }));
}
/* the title without the party it ends in: the paper's line and this head say
   the party once (a READING; the stored name is never rewritten) */
function bsShortName(c){
  const n = String((c && c.name) || '').trim(), cp = String((c && c.counterparty) || '').trim();
  if (!n) return bsRef(c);
  if (cp){ const m = n.match(/^(.*\S)\s+[—–-]\s+(.+)$/); if (m && m[2].trim().toLowerCase() === cp.toLowerCase()) return m[1]; }
  return n;
}
/* ---- THE PAY SECTION: a table at rest, the same table as boxes in Edit ----
   Drawn again when what it shows moved, never while the reader is typing in
   one of its boxes (the Details host's rule); a press of its own (add a part,
   take one away, save, cancel) paints it at once. */
function bsPaySig(c, ed){
  try { return JSON.stringify([String(c.id), c.value, c.pay || null, (c.metadata || {}).category, c.status, c.valueType,
    bsMoneyOk(), (typeof canEdit !== 'function') || !!canEdit(), bsPayLock(c), ed ? ed.rows : null, (typeof langId === 'function') ? langId() : '']); }
  catch (_){ return String(Math.random()); }
}
function bsPaintPay(host, c, force){
  const ed = (_bsPay && _bsPay.id === String(c.id)) ? _bsPay : null;
  const a = document.activeElement;
  if (!force && host.firstChild && a && host.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  const sig = bsPaySig(c, ed);
  if (!force && host._bsSig === sig && host.firstChild) return;
  host._bsSig = sig;
  host.innerHTML = bsPayHtml(c, ed);
  if (ed && typeof popupControlsDress === 'function') try { popupControlsDress(host); } catch (_){}
}
function bsPayHtml(c, ed){
  const id = bsE(c.id);
  const head = right => `<div class="bs-sec-h"><h5>${bsE(bsT('bs_pay'))}</h5><span class="bs-note">${bsE(bsT('bs_pay_note'))}</span><span class="hb-grow"></span>${right}</div>`;
  if (!bsMoneyOk()) return head('') + `<p class="bs-pay-say">${bsE(bsT('bs_pay_hidden'))}</p>`;
  if (ed && bsPayMay(c)) return head('') + bsPayEdHtml(c, ed);
  const lock = bsPayLock(c);
  const may = (typeof canEdit !== 'function') || !!canEdit();
  /* a signed contract says why it does not open, where the button would be */
  const right = !may ? '' : lock ? `<span class="bs-note">${bsE(lock)}</span>`
    : `<button type="button" class="hb-link" data-bs-pay-edit="${id}">${bsE(bsT('bs_pay_edit'))}</button>`;
  /* the base as amended, where a signed amendment set it (the Value tile's own reading) */
  let ev = { v: Number(c.value) || 0, from: null };
  try { if (typeof effectiveTerm === 'function'){ const e = effectiveTerm(c, 'value'); if (e && e.from && Number(e.v) > 0) ev = { v: Number(e.v), from: e.from }; } } catch (_){ ev = { v: Number(c.value) || 0, from: null }; }
  const rows = (typeof payPartsOf === 'function') ? payPartsOf(c, ev.v) : [];
  if (!rows.length){
    const owed = bsOwedKeys(c).has('value');
    return head(right) + `<p class="bs-pay-say${owed ? ' is-owed' : ''}">${bsE(bsT(owed ? 'bs_pay_owed' : 'bs_pay_none'))}</p>`;
  }
  let start = ''; try { const M = (typeof ov2Model === 'function') ? ov2Model(c) : null; start = M && M.start ? bsDay(M.start) : ''; } catch (_){ start = ''; }
  const tr = r => {
    const base = r.kind === 'base';
    const amt = r.amount > 0 ? bsE(bsPayMoney(c, r.amount)) + (base && ev.from ? ` <span class="bs-pay-am">${bsE(bsT('bs_k_value_amended', { ref: bsRef(ev.from) }))}</span>` : '')
      : (r.words ? bsE(r.words) : '—');
    const from = r.from ? bsDay(r.from) : (start || '—');
    return `<tr${base ? ' class="is-base"' : ''}><td>${base ? `<b>${bsE(bsT('bs_pay_base'))}</b>` : bsE(r.label)}</td><td>${bsE(bsPayEvery(r.every) || '—')}</td><td class="bs-pay-n">${amt}</td><td>${bsE(from)}</td></tr>`;
  };
  return head(right) + `<div class="bs-pay-wrap"><table class="bs-pay-t"><thead><tr><th>${bsE(bsT('bs_pay_col_part'))}</th><th>${bsE(bsT('bs_pay_col_every'))}</th><th class="bs-pay-n">${bsE(bsT('bs_pay_col_amount'))}</th><th>${bsE(bsT('bs_pay_col_from'))}</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table></div>`;
}
function bsPayEdHtml(c, ed){
  const id = bsE(c.id);
  const every = (i, v) => `<select class="bs-pay-in" data-bs-pay-f="every" data-bs-pay-i="${i}" aria-label="${bsE(bsT('bs_pay_col_every'))}"><option value=""${v ? '' : ' selected'}>—</option>${(typeof PAY_EVERY !== 'undefined' ? PAY_EVERY : []).map(k => `<option value="${k}"${v === k ? ' selected' : ''}>${bsE(bsPayEvery(k))}</option>`).join('')}</select>`;
  const box = (i, f, v, extra) => `<input class="bs-pay-in" data-bs-pay-f="${f}" data-bs-pay-i="${i}" value="${bsE(v)}" ${extra || ''}/>`;
  const rows = ed.rows.map((r, i) => {
    const base = r.kind === 'base';
    return `<tr${base ? ' class="is-base"' : ''}>
      <td>${base ? `<b>${bsE(bsT('bs_pay_base'))}</b>` : box(i, 'label', r.label, `type="text" maxlength="60" placeholder="${bsE(bsT('bs_pay_part_ph'))}" aria-label="${bsE(bsT('bs_pay_col_part'))}"`)}</td>
      <td>${every(i, r.every)}</td>
      <td class="bs-pay-n">${box(i, 'amount', r.amount, `type="text" ${base ? 'inputmode="decimal" placeholder="0"' : `placeholder="${bsE(bsT('bs_pay_amount_ph'))}"`} maxlength="60" aria-label="${bsE(bsT('bs_pay_col_amount'))}"`)}</td>
      <td>${box(i, 'from', r.from, `type="date" aria-label="${bsE(bsT('bs_pay_col_from'))}"`)}</td>
      <td class="bs-pay-x">${base ? '' : `<button type="button" class="hb-ib" data-bs-pay-rm="${i}" data-bs-id="${id}" aria-label="${bsE(bsT('bs_pay_rm', { what: r.label || bsT('bs_pay_part') }))}" title="${bsE(bsT('bs_pay_rm', { what: r.label || bsT('bs_pay_part') }))}">${_bsX}</button>`}</td></tr>`;
  }).join('');
  const parts = ed.rows.filter(r => r.kind === 'part').length;
  const full = parts >= PAY_PARTS_MAX;
  const add = full ? `<span class="bs-note">${bsE(bsT('bs_pay_cap', { n: PAY_PARTS_MAX }))}</span>`
    : `<button type="button" class="hb-link" data-bs-pay-add="${id}">${bsE(bsT('bs_pay_add'))}</button>`;
  return `<div class="bs-pay-ed"><div class="bs-pay-wrap"><table class="bs-pay-t"><thead><tr><th>${bsE(bsT('bs_pay_col_part'))}</th><th>${bsE(bsT('bs_pay_col_every'))}</th><th class="bs-pay-n">${bsE(bsT('bs_pay_col_amount'))}</th><th>${bsE(bsT('bs_pay_col_from'))}</th><th><span class="sr-only">${bsE(bsT('bs_pay_rm_col'))}</span></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="bs-pay-acts">${add}<span class="hb-grow"></span><button type="button" class="hb-btn is-sm is-primary" data-bs-pay-save="${id}">${bsE(bsT('act_save'))}</button><button type="button" class="hb-btn is-sm" data-bs-pay-cancel="${id}">${bsE(bsT('act_cancel'))}</button></div></div>`;
}
function bsPayAct(kind, id, i){
  const c = bsContract(id); if (!c) return;
  if (kind === 'edit'){ payEditOpen(id); return; }
  if (!_bsPay || _bsPay.id !== String(id)) return;
  if (kind === 'cancel'){ _bsPay = null; bsPayPaint(id, true); return; }
  if (kind === 'add'){
    if (_bsPay.rows.filter(r => r.kind === 'part').length >= PAY_PARTS_MAX) return;
    _bsPay.rows.push({ kind: 'part', id: 'p' + (++_bsPay.n), label: '', every: '', amount: '', from: '' });
    bsPayPaint(id, true);
    const host = bsPayHost(id), boxes = host ? host.querySelectorAll('[data-bs-pay-f="label"]') : [];
    if (boxes.length && typeof fieldFocus === 'function') fieldFocus(boxes[boxes.length - 1], { preventScroll: true });
    return;
  }
  if (kind === 'rm'){ const n = Number(i); if (_bsPay.rows[n] && _bsPay.rows[n].kind === 'part') _bsPay.rows.splice(n, 1); bsPayPaint(id, true); return; }
  if (kind === 'save'){
    const r = paySet(c, _bsPay.rows);
    if (r.err){ if (typeof toast === 'function') toast(r.err, 'warn'); return; }
    _bsPay = null;
    if (r.changed && typeof toast === 'function') toast(bsT('bs_pay_saved'), 'ok');
    bsPayPaint(id, true); bsDossierRepaint();
  }
}
function bsGo(kind, id, key){
  const c = bsContract(id); if (!c) return;
  if (kind === 'risks'){ if (typeof riskViewOpen === 'function') riskViewOpen(c); return; }
  /* the brief on file, in its own panel; pressed again, the panel shuts. The
     side panel names the contract it was opened ON (state.activeId) — on the
     Board that is whichever strip came up last — so it is named for THIS one,
     or a second press on an older strip's button reopened instead of shutting */
  if (kind === 'brief'){
    if (typeof briefPanelToggle !== 'function'){ if (typeof openCheckPanel === 'function') openCheckPanel(c, 'brief'); return; }
    if (briefPanelToggle(c)){ const sp = document.getElementById('side-panel'); if (sp) sp.dataset.cid = String(c.id); }
    return; }
  /* the STORED standards reading, read only: a "See" door never runs a check,
     never spends and never writes (the cell is drawn only over a check that ran) */
  if (kind === 'std'){ if (typeof openCheckPanel === 'function') openCheckPanel(bsContract(c.id) || c, 'playbook'); return; }
  if (kind === 'fill'){ if (typeof pdFillOpen === 'function') pdFillOpen(c.id, key ? { key } : undefined); return; }
  /* their asks and our unsent changes: the dossier beside the paper presses its own door there */
  if (kind === 'redline' || kind === 'share'){
    if (typeof pdOpenOnHome === 'function' && pdOpenOnHome(c.id, 'copilot') === false) return;
    const row = (typeof PD_GLANCE === 'object' && PD_GLANCE) ? PD_GLANCE[kind] : null;
    if (row && typeof intelAsk === 'function') intelAsk(bsT(row[2]));
    return; }
  /* READ IT NOW: the person's press a private contract waits for — the whole
     record first, then the one arrival reading, asked; the ring turns until
     it lands */
  if (kind === 'read'){
    const id0 = String(c.id);
    if (_bsReading.has(id0) || !((typeof canEdit !== 'function') || canEdit())) return;
    _bsReading.add(id0); bsDossierRepaint();
    Promise.resolve((c._light && !c._loaded && typeof ensureFull === 'function') ? ensureFull(c) : null).catch(() => {})
      .then(() => { const live = bsContract(id0) || c; return (typeof triageAndPaint === 'function') ? triageAndPaint(live, { asked: true }) : null; })
      .catch(() => {})
      .then(() => { _bsReading.delete(id0); bsDossierRepaint(); });
    return;
  }
  if (kind === 'oblig'){ if (typeof hbOpenView === 'function') hbOpenView(c.id, 'oblig'); return; }
  /* 4b: the Board reviews, the Workspace acts — each lands beside the paper */
  /* nobody named yet: the paper's grid row, both signers asked on it (the Legora way) */
  if (kind === 'signers'){
    let row = false; try { row = typeof pdOgFacts === 'function' && pdOgFacts(c).some(f => f.key === 'signers'); } catch (_){ row = false; }
    if (row && typeof pdFillOpen === 'function'){ pdFillOpen(c.id, { key: 'signers' }); return; }
    if (typeof pdOpenOnHome === 'function') pdOpenOnHome(c.id, 'signing'); return; }
  if (kind === 'oblreview'){
    Promise.resolve((c._light && !c._loaded && typeof ensureFull === 'function') ? ensureFull(c) : null).catch(() => {}).then(() => {
      const full = bsContract(c.id) || c;
      let found = []; try { found = (typeof triageHeldObligations === 'function') ? triageHeldObligations(full) : []; } catch (_){ found = []; }
      if (found.length && typeof openObligationsReview === 'function') openObligationsReview(full, found, () => bsDossierRepaint());
    });
    return; }
}

/* ============================================================
   THE PRESSES, delegated once at load (a repaint never strands one): the pay
   editor's own — Edit pay, add a part, take one away, Save, Cancel — and its
   boxes, which write the draft, never the record, and never repaint.
   ============================================================ */
if (typeof document !== 'undefined' && !document._bsWired){
  document._bsWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    const take = () => { e.preventDefault(); e.stopPropagation(); };
    if ((el = t.closest('[data-bs-pay-edit]'))){ take(); bsPayAct('edit', el.getAttribute('data-bs-pay-edit')); return; }
    if ((el = t.closest('[data-bs-pay-add]'))){ take(); bsPayAct('add', el.getAttribute('data-bs-pay-add')); return; }
    if ((el = t.closest('[data-bs-pay-rm]'))){ take(); bsPayAct('rm', el.getAttribute('data-bs-id'), el.getAttribute('data-bs-pay-rm')); return; }
    if ((el = t.closest('[data-bs-pay-save]'))){ take(); bsPayAct('save', el.getAttribute('data-bs-pay-save')); return; }
    if ((el = t.closest('[data-bs-pay-cancel]'))){ take(); bsPayAct('cancel', el.getAttribute('data-bs-pay-cancel')); return; }
    /* an NDA's facts: the tile's mark opens them beside the paper */
    if ((el = t.closest('[data-bs-kt-open]'))){ take(); if (typeof pdKtOpen === 'function') pdKtOpen(el.getAttribute('data-bs-kt-open')); return; }
    if ((el = t.closest('[data-bs-nda-edit]'))){ take(); ndaEditOpen(el.getAttribute('data-bs-nda-edit')); return; }
  }, true);
  const payType = e => {
    const f = e.target && e.target.closest ? e.target.closest('[data-bs-pay-f]') : null;
    if (!f || !_bsPay) return;
    const row = _bsPay.rows[Number(f.getAttribute('data-bs-pay-i'))];
    const k = f.getAttribute('data-bs-pay-f');
    if (row && ['label', 'every', 'amount', 'from'].includes(k)) row[k] = String(f.value == null ? '' : f.value);
  };
  document.addEventListener('input', payType, true);
  document.addEventListener('change', payType, true);
}

if (typeof window !== 'undefined') Object.assign(window, { bsPrivateOf, bsPrivatePillHtml, bsFamRows,
  bsPayEvery, bsPayMoney, bsReadWait, bsGo, payBaseLine, bsPayLock, bsPayMay, payAmountRead, paySet, payEditOpen, bsPayHtml, bsPaintPay,
  bsIsNda, bsNda, ndaMay, ndaDirWords, ndaUntilWords, ndaReminderOf, ndaSet, ndaEditOpen,
  hbStripBring, roomRetiredLand, bsDossierRepaint, bsShortName, bsObRows, bsDay,
});
