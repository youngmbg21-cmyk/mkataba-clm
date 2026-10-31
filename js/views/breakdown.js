/* ============================================================
   THE DEEP READ OF ONE CONTRACT — read once, kept, drawn on Clauses
   ============================================================
   Home's Breakdown face is GONE (owner, 13 Oct 2026: "You were also supposed
   to delete breakdown"); its one reading lives on, drawn by Stakes in Home's
   Document → Clauses list (stkDecorate below).

   ONE READING (POST /api/ai/breakdown, `bdRun`): the regions and the points
   that matter to the company, kept on the contract against the wording's hash
   (c.breakdown) — read again only when the words change. OPENING A CONTRACT'S
   CLAUSES IS THE PRESS (the owner's rule for the Breakdown, 11 Oct 2026:
   "Choosing the contract should be the only press needed"): a contract with
   no reading of these words is read once a sitting (`_bd.tried`), and a
   refusal is said with Try again, never retried in a loop. No score: counts
   and facts. Nothing is filed or sent.
   ============================================================ */
const _bd = { busy: false, err: '', runFor: null, tried: {} };
const _bdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function bdHash(c){ try { return (typeof triageWordingHash === 'function') ? String(triageWordingHash(c) || '') : ''; } catch (_){ return ''; } }
/* THE READING FOLLOWS THE READER (owner, 15 Oct 2026: "Make the deep dive
   answer in the reader's language"): Jambo writes it in the reader's language
   (the server's readLangOf), and the reading keeps that language — one made
   before carries none and was written in English */
function bdLang(){ try { return (typeof langId === 'function' && langId()) || 'en'; } catch (_){ return 'en'; } }
/* the kept reading, only while it is the reading of THESE words, in THIS reader's language */
function bdOf(c){
  const b = c && c.breakdown;
  return (b && b.ok && Array.isArray(b.regions) && b.hash === bdHash(c) && (b.lang || 'en') === bdLang()) ? b : null;
}
function bdStale(c){ const b = c && c.breakdown; return !!(b && b.ok && b.hash !== bdHash(c)); }
function bdText(c){
  if (!c) return '';
  if (typeof isUpload === 'function' && isUpload(c)) return (c.upload && c.upload.extractedText) || '';
  return (typeof contractPlainText === 'function') ? contractPlainText(c) : '';
}
/* THE ONE READ: kept against the wording; started by opening Clauses (stkAutoRun) or Try again */
async function bdRun(c){
  if (!c || _bd.busy) return;
  _bd.busy = true; _bd.err = '';
  try {
    if (c._light && !c._loaded && typeof ensureFull === 'function') await ensureFull(c);
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    const text = bdText(live);
    if (!text || text.length < 200) throw new Error(i18t('bd_too_short'));
    if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)) throw new Error(i18t('bd_no_key'));
    const r = await api('ai/breakdown', 'POST', { text }, { quiet: true });
    if (!r || !Array.isArray(r.regions) || !r.regions.length) throw new Error((r && r.error) || i18t('bd_failed'));
    live.breakdown = { ok: true, hash: bdHash(live), lang: r.lang || 'en', at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString(),
      head: r.head || '', sub: r.sub || '', regions: r.regions, links: Array.isArray(r.links) ? r.links : [],
      points: Array.isArray(r.points) ? r.points : [],
      dropped: Number(r.dropped) || 0, truncated: !!r.truncated };
    if (typeof persist === 'function') persist(live);
    /* the reading in one language replaced the other's: that language may read
       again on its next opening (a switch there and back in one sitting). By
       the contract, not the hash: a paper drawn from a template hashes
       differently in each language */
    const mine = stkKey(live), base = String(live.id) + ':';
    Object.keys(_bd.tried).forEach(k => { if (k !== mine && k.startsWith(base)) delete _bd.tried[k]; });
  } catch (e){
    _bd.err = (e && e.message) || i18t('bd_failed');
  }
  _bd.busy = false;
}
function bdChip(st){
  const cls = st === 'need' ? 'is-need' : st === 'look' ? 'is-look' : 'is-fine';
  return `<span class="bd-chip ${cls}">${_bdE(i18t('bd_st_' + st))}</span>`;
}

function bdBusyHtml(){ return window.busyHtml ? busyHtml(i18t('bd_reading')) : _bdE(i18t('bd_reading')); }

/* ============================================================
   STAKES — THE CLAUSES TAB CARRIES THE DEEP READ (owner picked it by name,
   13 Oct 2026, the artifact "Clauses and Breakdown, Joined", round 3)
   ============================================================
   Home's Clauses list (docThreadPaint on #pd-thread) keeps its joined beads
   and its paper. This adds, from the SAME kept reading (c.breakdown, one
   Jambo read per wording, spent only on a press):
     · a head: what the deal commits us to and what needs us, and the
       regions as one coloured ribbon;
     · under each clause a point touches, ONE company line — the risk and the
       money together, never split by department (owner: "one Overall Company
       view") — and a Deep dive door;
     · "Not in the contract", the points about what the wording never says;
     · THE DEEP DIVE: its own panel in the same place, with a way back.
   NO CONTRACT WORDING IS REPEATED IN THE PANEL (owner: "the paper is already
   on screen"): a point's words are lit on the paper instead (igQuoteGo).
   Nothing is filed or sent: "Start redlining with this ask" is Negotiate's
   own door, "Ask Jambo about this" only fills Jambo's ask box. */
/* `missShut`: the not-in-the-contract groups the reader has closed, this
   sitting, this contract (the group's own key — see stkDecorate) */
const _stk = { id: null, dive: -1, f: { reg: '', sev: '', by: '' }, more: false, rows: null, nums: null, diveBusy: {}, diveErr: {}, marking: {}, missShut: new Set() };
const STK_REGION_TONES = 10;
const stkOf = c => { const b = bdOf(c); return b && Array.isArray(b.points) ? b : null; };
const stkNum = s => { const m = /^\s*(?:clause\s+|§\s*)?(\d+(?:\.\d+)*)/i.exec(String(s || '')); return m ? m[1] : ''; };
/* the row a point sits on: the clause's own number, else the clause it is part of */
function stkRowFor(p, nums){
  const n = stkNum(p.clause); if (!n) return -1;
  let at = nums.indexOf(n);
  for (let k = n; at < 0 && k.includes('.'); ){ k = k.slice(0, k.lastIndexOf('.')); at = nums.indexOf(k); }
  /* a heading's number ("3") whose clauses are numbered beneath it ("3.1") */
  if (at < 0) at = nums.findIndex(x => x && x.startsWith(n + '.'));
  return at;
}
function stkTone(p){ return p && p.region ? ' stk-r' + (((p.region - 1) % STK_REGION_TONES) + 1) : ''; }
/* the reading this list owes: none of these words yet, or one made before the deep read */
const stkOwed = c => !stkOf(c);
const stkKey = c => String(c && c.id) + ':' + bdHash(c) + ':' + bdLang();
/* THE POINTS AND WHO FOUND THEM (owner, 13 Oct 2026, as drawn: Region ·
   Severity · Found by): Jambo's company read, and every standard this
   contract departs from or lacks, from the KEPT standards check (c.playbook,
   read RAW — nothing is run or spent here) */
const STK_BY = ['jambo', 'std', 'scan', 'brief'];
const STK_SEVS = ['need', 'look', 'note', 'fine'];
const STK_RANK = { need: 3, look: 2, note: 1, fine: 0 };
const _stkNorm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
/* the list's clause numbers, one per row (a section title has none) */
const stkNumsOf = rows => (rows || []).map(x => (typeof docThreadIsSec === 'function' && docThreadIsSec(x)) ? '' : stkNum(typeof docXrayLabel === 'function' ? docXrayLabel(x) : ''));
function stkStdPoints(c){
  const vs = (typeof stdDepartures === 'function') ? stdDepartures(c) : [];
  return vs.map(v => {
    const missing = v.status === 'missing', cat = String(v.category || ''), pos = String(v.position || '');
    return { by: 'std', status: v.escalate ? 'need' : 'look', missing, clause: '', region: 0, links: [],
      title: i18t(missing ? 'stk_std_miss_t' : 'stk_std_dev_t', { cat }),
      stake: missing ? i18t('stk_std_miss', { cat }) : (pos ? i18t('stk_std_dev_pos', { cat, pos }) : i18t('stk_std_dev', { cat })),
      theirs: missing ? '' : String(v.quote || ''), usual: pos, ask: String(v.redline || ''), quote: missing ? '' : String(v.quote || '') };
  });
}
/* A POINT'S SECTION (owner, 13 Oct 2026: "the Region which we should call
   Section"): the one Jambo named, else the section that holds its clause —
   read off the reading's own section lists, the clause's number or, for a
   standard, the row whose wording holds its quote */
function stkSectionOf(b, p, ctx){
  if (Number(p.region) >= 1 && (b.regions || [])[p.region - 1]) return Number(p.region);
  let n = p.by === 'std' ? '' : stkNum(p.clause);
  if (!n && p.by === 'std' && p.quote && ctx.rows && ctx.nums){ const at = stkRowForQuote(p.quote, ctx.rows); if (at >= 0) n = ctx.nums[at] || ''; }
  if (!n) return 0;
  const regs = b.regions || [];
  for (let k = n; k; k = k.includes('.') ? k.slice(0, k.lastIndexOf('.')) : ''){
    const ri = regs.findIndex(r => (r.items || []).some(it => stkNum(it.ref) === k));
    if (ri >= 0) return ri + 1;
  }
  return 0;
}
/* ---- EVERY COLOURED DOT EXPLAINS ITSELF (owner, 13 Oct 2026: "we have some
   worth a look but they have no explanation"; then "Yes, build it") ----
   A clause's dot also wears the marks the paper's other readings put on it
   — the risk scan's findings, the brief's watch-outs and its unusual terms
   (docXrayMarks, the same reading that colours the dot) — and those used to
   have nothing behind them on Home. Each is now a POINT under its clause, in
   the same shaded box, counted, filtered ("Found by": Risk scan · Brief) and
   walked by the deep dive. Placed on the row the mark was found on, so a mark
   that lands nowhere is never guessed onto a clause. A standards mark is the
   standards point already there, never said twice. Nothing is run here.
   Each carries the words it was placed by (`m.q`), so a twin of another
   finder's point is ONE point (stkMerge). */
const STK_MARK_BY = { scan: 'scan', brief: 'brief', odd: 'brief', pb: 'std' };
const STK_GRADE_SEV = { ruby: 'need', amber: 'look', steel: 'note' };
function stkMarkPoints(stdRows, ctx){
  const out = [];
  (ctx.rows || []).forEach((x, at) => {
    if (!x || !Array.isArray(x.marks) || (typeof docThreadIsSec === 'function' && docThreadIsSec(x))) return;
    x.marks.forEach(m => {
      if (!m || !STK_MARK_BY[m.k]) return;
      if (m.k === 'pb' && stdRows.has(at)) return;
      const lead = String(m.lead || '').trim(), say = String(m.say || '').trim(), why = String(m.why || '').trim();
      out.push({ by: STK_MARK_BY[m.k], status: STK_GRADE_SEV[m.grade] || 'look', missing: false, region: 0, links: [],
        clause: (ctx.nums || [])[at] || '', _at: at, title: lead || say || why, stake: [lead && say ? say : '', why].filter(Boolean).join(' ') || lead || say,
        what: why, theirs: '', usual: '', ask: '', quote: String(m.q || '') });
    });
  });
  return out;
}
/* every point, Jambo's first, as each finder said it */
function stkAll(c, b, ctx){
  if (!b) return [];
  ctx = ctx || { rows: _stk.rows, nums: _stk.nums };
  const std = stkStdPoints(c);
  const stdRows = new Set(std.map(p => p.quote && ctx.rows ? stkRowForQuote(p.quote, ctx.rows) : -1).filter(at => at >= 0));
  return b.points.map((p, i) => Object.assign({}, p, { by: 'jambo', _i: i })).concat(std, stkMarkPoints(stdRows, ctx))
    .map(p => Object.assign(p, { region: stkSectionOf(b, p, ctx) }));
}
/* ---- ONE SENTENCE, ONE POINT (owner said yes, 21 Oct 2026, "the Legora
   way"): two finders quoting the same sentence of one clause are ONE point —
   its worst verdict, both finders named ("Found by Jambo · Our standards").
   The first finder's words lead (Jambo before our standards before the marks);
   a standard's position rides along as "Our standard: …" and its redline as
   the ask Start redlining carries when Jambo's dive has none yet. ---- */
function stkMerge(list, ctx){
  const out = [];
  list.forEach((p, seq) => {
    const at = stkAt(p, ctx.nums || [], ctx.rows);
    const q = p.missing ? '' : _stkNorm(p.quote);
    const twin = q.length >= 12 ? out.find(m => m.at === at && m._q && (m._q === q || m._q.includes(q) || q.includes(m._q))) : null;
    if (twin){
      if (!twin.bys.includes(p.by)) twin.bys.push(p.by);
      if ((STK_RANK[p.status] || 0) > (STK_RANK[twin.status] || 0)) twin.status = p.status;
      if (p.by === 'std' && !twin.stdPos){ twin.stdPos = String(p.usual || ''); twin.stdAsk = String(p.ask || ''); }
      return;
    }
    out.push(Object.assign({}, p, { at, _q: q, _seq: seq, bys: [p.by],
      stdPos: p.by === 'std' ? String(p.usual || '') : '', stdAsk: p.by === 'std' ? String(p.ask || '') : '' }));
  });
  return out;
}
/* A POINT'S KEY: its clause and its quoted words, hashed — so a reading made
   again of the same wording keeps a person's "reviewed", and changed words
   make a new point (POST /api/contracts/:id/points/:key/review) */
function stkHashKey(s){
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++){ const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'p' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(6, '0');
}
function stkPointKey(p, nums){
  const n = p.missing ? 'm' + stkNum(p.after || '') : (p.at >= 0 ? ((nums || [])[p.at] || '') : stkNum(p.clause));
  return stkHashKey(n + '|' + (p._q || ('t:' + _stkNorm(p.title))));
}
/* where a point's words stand in its clause: paper order within a verdict */
function stkQuoteAt(p, ctx){
  const x = p.at >= 0 && ctx.rows ? ctx.rows[p.at] : null;
  if (!x || !x.row || !p._q) return 1e6;
  const i = _stkNorm((x.row.heading || '') + ' ' + (x.row.text || '')).indexOf(p._q.slice(0, 80));
  return i < 0 ? 1e6 : i;
}
/* ---- THE ONE READING OF CLAUSE REVIEW (21 Oct 2026) ----
   Every point once (stkMerge), with its key, its row (`at`, or for a point
   about what is missing the row it would follow, `afterAt`), whether a person
   marked it reviewed (`done`, c.pointReviews — the server's record), in the
   ONE order the list draws and the deep dive walks: by the paper, then WORST
   FIRST within a clause, then where its words stand. The list, the three
   counts, the Clauses tab's number and the dive all read this. RAW: nothing
   is run, spent or written. */
/* ---- A FIELD LEFT BLANK IS FILLED IN, NOT ARGUED (round 5 of the review, 28 Oct 2026: "does not filling in a field
   in the contract need a deep dive?") ----
   A point Jambo read as a clause that is in the contract with nothing under it (`blank`) is a missing fact, not a risk:
   its card carries ONE door, Fill it in (the contract's own fill-in box, pdFillOpen, free), never Deep dive or Start
   redlining; Mark reviewed stays for a blank left empty on purpose. Its boxes are the paper's own blanks
   (contractBlanks) under that clause's number, or named by the point's words; once every one is filled the point
   is gone from the one reading (stkReview), so the list and the number on the tab agree. No box found = it stays. */
function stkBlanksOf(c, p){
  if (!c || !p || !p.blank || typeof contractBlanks !== 'function') return [];
  let bl = []; try { bl = contractBlanks(c) || []; } catch (_){ bl = []; }
  const n = (String(p.clause || '').trim().match(/^[0-9]+(?:\.[0-9]+)*/) || [''])[0];
  const words = String(p.title || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3);
  return bl.filter(x => {
    const sn = (String(x.section || '').trim().match(/^[0-9]+(?:\.[0-9]+)*/) || [''])[0];
    if (n && sn && (sn === n || sn.startsWith(n + '.'))) return true;
    const lab = String(x.label || x.key || '').toLowerCase();
    return words.some(w => lab.includes(w));
  });
}
function stkBlankFilled(c, p){ const bl = stkBlanksOf(c, p); return bl.length > 0 && bl.every(x => String(x.value || '').trim()); }
function stkFillGo(c, p){
  const open = stkBlanksOf(c, p).find(x => !String(x.value || '').trim());
  if (typeof pdFillOpen === 'function') pdFillOpen(c.id, { key: open ? open.key : '' });
}
function stkReview(c, b, ctx){
  if (!b) return [];
  ctx = ctx || { rows: _stk.rows, nums: _stk.nums };
  const seen = (c && c.pointReviews && typeof c.pointReviews === 'object') ? c.pointReviews : {};
  const pts = stkMerge(stkAll(c, b, ctx), ctx).map(p => {
    p.key = stkPointKey(p, ctx.nums);
    p.done = seen[p.key] || null;
    p.afterAt = p.missing && p.after ? stkRowFor({ clause: p.after }, ctx.nums || []) : -1;
    p._place = p.at >= 0 ? p.at : p.afterAt >= 0 ? p.afterAt + 0.5 : 1e9;
    p._qat = stkQuoteAt(p, ctx);
    return p;
  }).filter(p => !(p.blank && stkBlankFilled(c, p)));
  return pts.sort((a, z) => (a._place - z._place) || ((STK_RANK[z.status] || 0) - (STK_RANK[a.status] || 0)) || (a._qat - z._qat) || (a._seq - z._seq));
}
/* the three counts: live points only — a reviewed one counts nowhere */
function stkCounts(list){
  const n = { need: 0, look: 0, note: 0 };
  (list || []).forEach(p => { if (!p.done && p.status in n) n[p.status]++; });
  return n;
}
/* THE NUMBER ON THE CLAUSES TAB (21 Oct 2026: "the number on the door
   matches the list behind it"): the points that need you, or null while there
   is no reading — the paper's own marks are then what the list shows */
function stkNeedCount(c){
  const b = stkOf(c); if (!b) return null;
  let ctx = null;
  if (_stk.id === String(c.id) && _stk.rows) ctx = { rows: _stk.rows, nums: _stk.nums };
  else {
    const cv = typeof document !== 'undefined' ? document.getElementById('ig-canvas') : null;
    const rows = (cv && typeof docXrayRows === 'function') ? (docXrayRows(c, cv) || []) : [];
    ctx = { rows, nums: stkNumsOf(rows) };
  }
  return stkCounts(stkReview(c, b, ctx)).need;
}
const stkKeep = (p, f) => (!f.reg || String(p.region || 0) === f.reg) && (!f.sev || (f.sev !== 'fine' && p.status === f.sev)) && (!f.by || (p.bys || [p.by]).includes(f.by));
const stkFiltering = () => !!(_stk.f.reg || _stk.f.sev || _stk.f.by);
/* what is on screen: the points the filters keep, in the list's order — the deep dive walks these */
function stkShown(c, b){ return stkReview(c, b).filter(p => stkKeep(p, _stk.f)); }
/* A CHOICE THAT GIVES NOTHING IS NOT LISTED (the owner's rule): each box offers
   only what this contract's points hold */
function stkFiltersHtml(b, all){
  const box = (k, label, opts) => `<label class="stk-flt"><span>${_bdE(i18t(label))}</span><select data-stk-f="${k}"><option value="">${_bdE(i18t('stk_f_all'))}</option>${opts.map(o => `<option value="${_bdE(o.v)}"${_stk.f[k] === o.v ? ' selected' : ''}>${_bdE(o.t)}</option>`).join('')}</select></label>`;
  const regs = [...new Set(all.map(p => Number(p.region) || 0).filter(r => r > 0 && (b.regions || [])[r - 1]))].sort((x, y) => x - y)
    .map(r => ({ v: String(r), t: b.regions[r - 1].name }));
  const sevs = STK_SEVS.filter(v => all.some(p => p.status === v)).map(v => ({ v, t: i18t('bd_st_' + v) }));
  const bys = STK_BY.filter(v => all.some(p => (p.bys || [p.by]).includes(v))).map(v => ({ v, t: i18t('stk_by_' + v) }));
  return `<div class="stk-flts">${box('reg', 'stk_f_region', regs)}${box('sev', 'stk_f_sev', sevs)}${box('by', 'stk_f_by', bys)}</div>`;
}
/* OPENING CLAUSES IS THE PRESS: read once a sitting per wording; a refusal
   is said and waits for Try again (the latch is raised before the read) */
function stkAutoRun(c){
  if (!c || _bd.busy || !stkOwed(c)) return;
  /* a private folder's contract waits for a person's press (jamboOnPress) */
  if (typeof jamboOnPress === 'function' && jamboOnPress(c)) return;
  if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)) return;
  const k = stkKey(c); if (_bd.tried[k]) return;
  _bd.tried[k] = true;
  setTimeout(() => stkRun(c), 0);
}
/* THE HEAD'S NAME (owner said yes to the rename, 21 Oct 2026): "Clause
   review", and in grey the ruling it keeps — one view for the whole company
   (owner, 13 Oct 2026: "It should be one Overall Company view") */
const stkViewHtml = extra => `<div class="stk-view"><b>${_bdE(i18t('stk_head'))}</b><span class="stk-view-sub">${_bdE(i18t('stk_view_sub'))}</span>${extra || ''}</div>`;
/* ---- THE THREE-COUNT LINE IS GONE (the owner, 21 Oct 2026: "remove the
   highlighted area as it is redundant") ----
   It sat under the title saying "1 needs you · 2 worth a look" and was a door
   onto the Severity filter — the same three the Severity box below it offers,
   so no act is lost and the head is one line shorter. `stkTallyHtml` and its
   `data-stk-sev` press are retired by not being drawn; `stk_tally_*` stay
   inert in both books. `stkCounts` lives on: the Clauses tab's own number
   reads it (stkNeedCount). */
function stkHeadHtml(c, b, all){
  const busy = _bd.busy && _bd.runFor === c.id;
  const err = _bd.err && _bd.runFor === c.id ? _bd.err : '';
  if (!b){
    const noKey = !(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured);
    const view = stkViewHtml();
    /* a private folder's contract is not read until somebody presses: said,
       with the same press and its cost (jamboOnPress) */
    const waits = !_bd.tried[stkKey(c)] && typeof jamboOnPress === 'function' && jamboOnPress(c);
    if (busy || (!err && !noKey && !waits && !_bd.tried[stkKey(c)])) return `<div class="stk-head is-empty">${view}<div class="stk-acts"><span class="stk-busy" role="status" aria-live="polite">${bdBusyHtml()}</span><span class="stk-cost">${_bdE(i18t('bd_cost'))}</span></div></div>`;
    /* NOTHING KEPT YET, SAID PLAINLY (Round 3, owner's yes 24 Oct 2026): "Not read yet. Plain English for each clause,
       and what to watch, in one reading." in grey; a reading that failed still says why, under it, never in red;
       the button says what it does — "Read the clauses" — and its cost beside it, "1 Jambo call" */
    const why = noKey ? i18t('bd_no_key') : waits ? i18t('jb_wait_line') : i18t('stk_not_read');
    return `<div class="stk-head is-empty">${view}${waits && !err ? `<span class="jb-state">${_bdE(i18t('jb_state_private'))}</span>` : ''}<p class="stk-sub" role="status">${_bdE(why)}</p>${err ? `<p class="stk-sub stk-why" role="status">${_bdE(err)}</p>` : ''}${noKey ? '' : `<div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm" data-stk-run>${_bdE(i18t(waits ? 'jb_read_now' : 'stk_read_clauses'))}</button><span class="stk-cost">${_bdE(i18t('bd_cost_call'))}</span></div>`}</div>`;
  }
  /* MARQUEE (owner picked it by name, 23 Oct 2026; the navigation kept as it was, the owner's own words):
     a serif headline — how many clauses need you — one sentence naming where to start, and the clauses
     as tabs with counts (All · Needs you · Worth a look · Fine) in place of the three filter boxes */
  all = all || stkReview(c, b);
  return `<div class="stk-head is-mq">
    ${stkMarqueeHtml(c, all, busy)}
    ${all.length ? '' : `<p class="stk-sub">${_bdE(i18t('stk_none'))}</p>`}
    ${b.truncated ? `<p class="stk-sub">${_bdE(i18t('stk_cut'))}</p>` : ''}
    ${err ? `<p class="stk-err" role="alert">${_bdE(err)}</p>` : ''}</div>`;
}
/* ---- MARQUEE'S HEAD FOR THE CLAUSES TAB ----
   Every count is of CLAUSES on the list (the rows that carry a number), read off the one reading
   (stkReview) as the rows' own words are: a clause needs you where a live point of its own, or one it
   leaves out, needs you; worth a look likewise; fine where nothing live stands on it. A tab whose
   count is 0 stays out unless it is the one chosen, as every list head's does. */
function stkClauseTally(all){
  const nums = _stk.nums || [], live = {};
  (all || []).forEach(p => { if (p.done || p.status === 'fine') return;
    const at = p.at >= 0 ? p.at : (p.missing && p.afterAt >= 0 ? p.afterAt : -1); if (at < 0) return;
    (live[at] = live[at] || new Set()).add(p.status); });
  const rows = nums.map((n, at) => n ? at : -1).filter(at => at >= 0);
  const t = { all: rows.length, need: 0, look: 0, fine: 0, live };
  rows.forEach(at => { const L = live[at]; if (!L || !L.size) t.fine++; else { if (L.has('need')) t.need++; if (L.has('look')) t.look++; } });
  return t;
}
/* the clause's name as its heading says it, the number left off */
function stkClauseName(at){
  const x = (_stk.rows || [])[at], h = String((x && x.row && (x.row.heading || x.row.title)) || '').trim();
  return h.replace(/^\s*(?:clause\s+|§\s*)?[0-9IVXLCivxlc]+(?:\.\d+)*[.)]?\s+/, '').trim() || h;
}
/* THE NEW LOOK'S HEAD (the contract round, the owner's "as drawn", 31 Oct 2026; reverses Marquee and The SAP Way on the
   new look only): "Clause review · one view for the whole company", no count, no tabs — each row says its own reading */
function stkNewLookOn(){ return typeof window.newLookOn === 'function' && !!window.newLookOn(); }
function stkMarqueeHtml(c, all, busy){
  const T = stkClauseTally(all), E = _bdE;
  if (stkNewLookOn()) return `${stkViewHtml()}${busy ? `<span class="stk-busy" role="status">${bdBusyHtml()}</span>` : ''}<div class="stk-all" data-stk-all></div>`;
  /* THE SAME HEAD AS REDLINES (owner picked "The SAP Way", 24 Oct 2026): the name in the serif, its count, then a
     grey line of what needs you — "Clauses 9 · 3 need you · 5 worth a look" — then the tabs */
  const said = [T.need ? i18t('stk_mq_need', { n: T.need }) : '', T.look ? i18t('stk_mq_look', { n: T.look }) : ''].filter(Boolean).join(' \u00b7 ');
  const title = `<span class="stk-mq-name">${E(i18t('pd_tab_clauses'))}</span>${T.all ? ` <i class="stk-mq-n">${T.all}</i>` : ''}${said ? `<span class="stk-mq-s">\u00b7 ${E(said)}</span>` : ''}`;
  /* SPINE ROUND (owner, 23 Oct 2026: "below '3 clauses need you', remove all the other supporting words"):
     the headline alone, then the tabs; stk_mq_read and stk_mq_start are inert */
  const tab = (k, word, n) => (n || k === '' || _stk.f.sev === k)
    ? `<button type="button" role="tab" class="stk-tab" data-stk-tab="${k}" aria-selected="${_stk.f.sev === k}">${E(word)}<span>${n}</span></button>` : '';
  return `<h3 class="stk-mq-t">${title}</h3>${busy ? `<span class="stk-busy" role="status">${bdBusyHtml()}</span>` : ''}`
    + `<div class="stk-tabs" role="tablist">${tab('', i18t('stk_f_all'), T.all)}${tab('need', i18t('bd_st_need'), T.need)}${tab('look', i18t('bd_st_look'), T.look)}${tab('fine', i18t('stk_tab_fine'), T.fine)}${stkMoreHtml(all)}</div>`
    + (stkMoreOpen() ? stkMoreBoxesHtml(all) : '');
}
/* SECTION AND FOUND BY, BEHIND THE TABS (the Marquee drawing's note: "would move behind the tabs"): a quiet
   "Filter" at the tabs' end opens the two boxes under them, and stays open while either is set; each box
   offers only what this contract's points hold (stkFiltersHtml's own rule) */
const stkMoreOpen = () => !!(_stk.more || _stk.f.reg || _stk.f.by);
function stkMoreHtml(all){
  if (!(all || []).length) return '';
  const on = stkMoreOpen(), n = (_stk.f.reg ? 1 : 0) + (_stk.f.by ? 1 : 0);
  return `<button type="button" class="stk-more" data-stk-more aria-expanded="${on}">${_bdE(i18t('lh_add'))}${n ? ` <span>${n}</span>` : ''}</button>`;
}
function stkMoreBoxesHtml(all){
  const b = { regions: (stkOf(stkContract()) || {}).regions || [] };
  const html = stkFiltersHtml(b, all || []);
  /* the Severity box is the tabs now: only Section and Found by stand here */
  return html.replace(/<label class="stk-flt"><span>[^<]*<\/span><select data-stk-f="sev">[\s\S]*?<\/select><\/label>/, '').replace('class="stk-flts"', 'class="stk-flts is-mq"');
}
/* the row a standard's finding sits on: the row whose wording holds its quote */
function stkRowForQuote(q, rows){
  const n = _stkNorm(q).slice(0, 80); if (n.length < 12) return -1;
  return (rows || []).findIndex(x => x && x.row && _stkNorm((x.row.heading || '') + ' ' + (x.row.text || '')).includes(n));
}
const stkAt = (p, nums, rows) => p.missing ? -1 : (p._at != null ? p._at : p.by === 'std' ? stkRowForQuote(p.quote, rows) : stkRowFor(p, nums));
/* WHY THIS READER MAY NOT MARK A POINT REVIEWED, or '' — the server's own
   wall (editors only), said before the press */
function stkReviewWhy(){ return (typeof canEdit === 'function' && !canEdit()) ? i18t('stk_review_viewer') : ''; }
/* ---- THE POINT CARD (owner said yes, 21 Oct 2026, "the Legora way"; dressed
   as The Brief draws a body — NOTHING BOXED: a 2px edge in the verdict's
   colour on the left, a hairline between cards, no wash) ----
   The verdict as a dot and a word, who found it; a short title; why it
   matters; our standard where one is in play; then Start redlining (the
   existing door, stkRedlineGo, greyed with its reason), Deep dive, and Mark
   reviewed (the server's record; struck and "Reviewed · <name>" once done,
   with Undo). */
function stkCardHtml(c, p, i, redWhy){
  const by = (p.bys || [p.by]).map(k => i18t('stk_by_' + k)).join(' · ');
  const markWhy = stkReviewWhy(), busy = !!_stk.marking[p.key];
  const dis = why => why ? ` disabled aria-disabled="true" title="${_bdE(why)}"` : '';
  const mark = p.done
    ? `<span class="stk-mk is-done"><i class="stk-ring is-on" aria-hidden="true"></i>${_bdE(i18t('stk_reviewed_by', { who: String(p.done.name || '').trim().split(/\s+/)[0] || i18t('stk_someone') }))}</span><button type="button" class="stk-a stk-undo" data-stk-unreview="${i}"${dis(markWhy)}${busy ? ' disabled' : ''}>${_bdE(i18t('stk_review_undo'))}</button>`
    : `<button type="button" class="stk-a stk-mk" data-stk-review="${i}"${dis(markWhy)}${busy ? ' disabled' : ''}><i class="stk-ring" aria-hidden="true"></i>${_bdE(i18t('stk_mark_reviewed'))}</button>`;
  const stake = String(p.stake || '').trim();
  /* MARQUEE (23 Oct 2026): the verdict is the dot's colour (its word and who found it are read aloud, not
     drawn). No quoted sentence under the point (owner, 23 Oct 2026: "Build the dot but without the quote"):
     NO WORDING IN THE PANEL (igQuoteGo) stands */
  return `<div class="stk-line stk-card is-mq is-${p.status}${p.done ? ' is-done' : ''}" data-stk-key="${_bdE(p.key)}">
    <div class="stk-c1 sr-only"><span class="stk-verd">${_bdE(i18t('bd_st_' + p.status))}</span><span class="stk-by">${_bdE(i18t('stk_found_by', { who: by }))}</span></div>
    <div class="stk-ct"><i class="stk-d8 is-${p.status}" aria-hidden="true"></i><span>${_bdE(p.title || stake)}</span></div>
    ${stake && stake !== p.title ? `<p class="stk-st">${_bdE(stake)}</p>` : ''}
    ${p.stdPos && p.by !== 'std' ? `<div class="stk-std" title="${_bdE(p.stdPos)}">${_bdE(i18t('stk_our_std', { pos: p.stdPos }))}</div>` : ''}
    <div class="stk-cacts">${p.blank
      ? `<button type="button" class="stk-a is-go is-link" data-stk-fill="${i}"${dis(typeof canEdit === 'function' && !canEdit() ? i18t('stk_review_viewer') : '')}>${_bdE(i18t('stk_fill_it'))}</button>`
      : `<button type="button" class="stk-a is-go is-link" data-stk-redline="${i}"${dis(redWhy)}>${_bdE(i18t('stk_start_red'))}</button><button type="button" class="stk-a is-link" data-stk-dive="${i}">${_bdE(i18t('stk_deep'))}</button>`}<span class="stk-mks">${mark}</span></div></div>`;
}
/* the words at a row's right: the worst live verdict and how many, in its ink */
function stkRowWords(live){
  if (!live.length) return null;
  const worst = live.reduce((a, p) => (STK_RANK[p.status] || 0) > (STK_RANK[a] || 0) ? p.status : a, '');
  if (worst === 'need' || worst === 'look') return { worst, html: _bdE(i18t('stk_row_' + worst, { n: live.length })) };
  if (worst === 'note') return { worst, html: _bdE(i18tn('stk_row_note', live.length, { n: live.length })) };
  return null;
}
/* painted after the list's own paint, on Home only */
function stkDecorate(c, card, rows){
  if (!c || !card) return;
  if (_stk.id !== String(c.id)){ _stk.id = String(c.id); _stk.dive = -1; _stk.f = { reg: '', sev: '', by: '' }; _stk.more = false; _stk.missShut = new Set(); }
  /* the new look draws no filter tabs: nothing narrows the list behind the reader's back */
  if (stkNewLookOn() && (_stk.f.sev || _stk.f.reg || _stk.f.by || _stk.more)){ _stk.f = { reg: '', sev: '', by: '' }; _stk.more = false; }
  const b = stkOf(c);
  _stk.rows = rows || null;
  _stk.nums = stkNumsOf(rows || []);
  const ctx = { rows: _stk.rows, nums: _stk.nums };
  const all = b ? stkReview(c, b, ctx) : [];
  const shown = all.filter(p => stkKeep(p, _stk.f));
  if (_stk.dive >= 0 && !shown[_stk.dive]) _stk.dive = -1;
  if (!b) stkAutoRun(c);
  let head = card.querySelector('.stk-head-slot');
  const top = card.querySelector('.doc-th-top');
  if (!head && top){ head = document.createElement('div'); head.className = 'stk-head-slot'; top.after(head); }
  if (head){ head.innerHTML = stkHeadHtml(c, b, all);
    /* the filters wear HaTi's own select face (the one dresser) */
    if (typeof selectFaceDress === 'function') try { selectFaceDress(head); } catch (_){} }
  card.querySelectorAll('.stk-line, .stk-miss, .stk-rsq, .stk-nomatch').forEach(el => el.remove());
  card.querySelectorAll('.stk-hide').forEach(el => el.classList.remove('stk-hide'));
  card.querySelectorAll('.stk-b-need, .stk-b-look, .stk-b-note, .stk-b-none, .stk-b-ok').forEach(el => el.classList.remove('stk-b-need', 'stk-b-look', 'stk-b-note', 'stk-b-none', 'stk-b-ok'));
  card.querySelectorAll('.stk-pre').forEach(el => el.remove());
  const list = card.querySelector('.doc-th-rows');
  if (b && list){
    const nums = _stk.nums;
    const byRow = {};
    shown.forEach((p, i) => { if (p.at >= 0) (byRow[p.at] = byRow[p.at] || []).push(i); });
    /* WHAT A CLAUSE LEAVES OUT IS THAT CLAUSE'S (owner, 22 Oct 2026: "build the first one"): a point
       missing after §N counts in §N's word and dot, and opens and closes with §N */
    const missByRow = {};
    shown.forEach((p, i) => { if (p.at < 0 && p.missing && p.afterAt >= 0) (missByRow[p.afterAt] = missByRow[p.afterAt] || []).push(i); });
    const redWhy = stkRedlineWhy(c);
    nums.forEach((n, at) => {
      const row = list.querySelector(`[data-th-row="${at}"]`); if (!row || !n) return;
      const mine = (byRow[at] || []).concat(missByRow[at] || []).map(i => shown[i]);
      /* THE DOT WEARS ITS CLAUSE'S WORST POINT STILL OPEN; none, or every one
         reviewed, is an empty ring (the old marks are points now, so the
         paper's own tone no longer outranks the reading) */
      const words = stkRowWords(mine.filter(p => !p.done && p.status !== 'fine'));
      row.classList.add('stk-b-' + (words ? words.worst : 'none'));
      /* THE ROW SAYS A WORD AND A COUNT ("Needs you · 2", "2 notes"), then
         its Plain English state after a separator ("· read") */
      const st = row.querySelector('[data-th-state]');
      if (st){
        st.querySelectorAll('.th-marks, .stk-n, .doc-th-dot').forEach(el => el.remove());
        const rest = [...st.children];
        rest.forEach(el => { if (el.classList.contains('is-read') && words){ el.classList.add('stk-read'); el.textContent = i18t('stk_read_after'); } });
        /* MARQUEE: a clause with nothing live on it says so ("Fine") */
        const fine = !words && !mine.some(p => !p.done && p.status !== 'fine');
        /* THE NEW LOOK, AS DRAWN: each row says its own short reading, the first point Jambo read on it, in its tone
           ("Three days to reject a load"; a clause read as fine says what it was read as, its dot green) */
        const say = stkNewLookOn() ? (mine.find(p => !p.done && p.status !== 'fine') || mine.find(p => p.status === 'fine') || null) : null;
        if (say && !words) row.classList.replace('stk-b-none', 'stk-b-ok');
        const parts = (say ? [`<span class="stk-n is-${words ? words.worst : 'fine'} is-say" title="${_bdE(say.stake || say.title)}">${_bdE(say.title)}</span>`]
          : words ? [`<span class="stk-n is-${words.worst}">${words.html}</span>`] : (fine && !stkNewLookOn()) ? [`<span class="stk-n is-fine">${_bdE(i18t('stk_row_fine'))}</span>`] : []).concat(rest.map(el => el.outerHTML));
        st.innerHTML = parts.join('<span class="doc-th-dot"> · </span>');
      }
      /* the open clause's cards, in the one order (stkReview), drawn once — UNDER its Plain English
         (owner, 23 Oct 2026: the reading "should be at the top before needs you and worth a look") */
      if (mine.length){ const h = row.querySelector('.doc-th-body') || row.querySelector('.doc-th-head');
        if (h) h.insertAdjacentHTML('afterend', (byRow[at] || []).map(i => stkCardHtml(c, shown[i], i, redWhy)).join('')); }
    });
    /* ---- WHAT THE CONTRACT DOES NOT SAY STANDS WHERE IT WOULD GO (owner
       said yes, 21 Oct 2026): a row "After §N — not in the contract" after the
       clause the point names; one that names no clause, and a point about a
       clause the list does not show, stand at the end under their own words —
       never dropped, never guessed ----
       NO DASHED BOX (the owner, 21 Oct 2026: "no dotted lines in the
       clauses") — the indent and the grey label carry it.
       AND IT FOLDS: the head is the group's own open/close, so nothing in the
       list is uncloseable; open unless the reader shut it this sitting.
       ONE PRESS (owner, 22 Oct 2026): a group after §N stands INSIDE §N's row and
       shows only while §N is open, so pressing the clause closes it too. */
    const groups = new Map();
    shown.forEach((p, i) => { if (p.at >= 0) return;
      const g = p.missing ? (p.afterAt >= 0 ? 'a' + p.afterAt : 'm') : 'o';
      if (!groups.has(g)) groups.set(g, []); groups.get(g).push(i); });
    groups.forEach((ids, g) => {
      const at = g[0] === 'a' ? Number(g.slice(1)) : -1;
      const h = at >= 0 ? i18t('stk_missing_after', { n: nums[at] || '' }) : g === 'm' ? i18t('stk_missing_end') : i18t('stk_other_h', { n: ids.length });
      const open = !_stk.missShut.has(g);
      const html = `<div class="stk-miss${g === 'o' ? ' is-other' : ''}${open ? ' is-open' : ''}" role="listitem"><button type="button" class="stk-miss-h" data-stk-miss-go="${_bdE(g)}"
        aria-expanded="${open ? 'true' : 'false'}" title="${_bdE(i18t(open ? 'stk_miss_fold' : 'stk_miss_unfold'))}"><span class="stk-miss-hw">${_bdE(h)}</span><span class="stk-miss-hn">${ids.length}</span>${typeof icon === 'function' ? icon('chevR', 'w-3.5 h-3.5 stk-miss-chev') : ''}</button>
        <div class="stk-miss-body">${ids.map(i => stkCardHtml(c, shown[i], i, redWhy)).join('')}</div></div>`;
      const row = at >= 0 ? list.querySelector(`.doc-th-row[data-th-row="${at}"]`) : null;
      /* inside its clause, after the clause's own reading: shown only while the clause is open */
      if (row) row.insertAdjacentHTML('beforeend', html); else list.insertAdjacentHTML('beforeend', html);
    });
    /* A FILTER NARROWS THE LIST: a row with nothing the filters keep steps
       aside, AN OPEN ONE TOO (owner, 13 Oct 2026: an open clause stayed in a
       "Worth a look" list with nothing worth a look under it); the paper's
       track is untouched */
    if (stkFiltering()){
      const fineTab = _stk.f.sev === 'fine', T = fineTab ? stkClauseTally(all) : null;
      list.querySelectorAll('.doc-th-row, .doc-th-sec').forEach(el => {
        const at = Number(el.getAttribute('data-th-row'));
        if (fineTab && el.classList.contains('doc-th-row') && nums[at] && !(T.live[at] && T.live[at].size)) return;
        if (el.classList.contains('doc-th-row') && (byRow[at] || missByRow[at])) return;
        el.classList.add('stk-hide');
      });
      if (!shown.length && !(fineTab && T.fine)) list.insertAdjacentHTML('beforeend', `<p class="stk-nomatch" role="status">${_bdE(i18t('stk_f_none'))}</p>`);
    }
  }
  /* THE OPEN CLAUSE AS DRAWN (new look): "What to watch:" before what is at stake, Deep dive's cost beside it; and on a
     contract's first sitting the clause that needs you opens first (the paper is not moved) */
  if (stkNewLookOn() && list){
    list.querySelectorAll('.stk-card.is-mq .stk-st').forEach(p => { if (!p.querySelector('.stk-watch')) p.insertAdjacentHTML('afterbegin', `<b class="stk-watch">${_bdE(i18t('stk_watch_lead'))}</b> `); });
    list.querySelectorAll('.stk-card.is-mq [data-stk-dive]').forEach(d => { if (!(d.nextElementSibling && d.nextElementSibling.classList.contains('stk-cost-n'))) d.insertAdjacentHTML('afterend', `<span class="stk-cost-n">${_bdE(i18tn('pd2_n_calls', 1, { n: 1 }))}</span>`); });
    if (b && _stk.firstOpen !== String(c.id)){
      _stk.firstOpen = String(c.id);
      const need = list.querySelector('.doc-th-row.stk-b-need, .doc-th-row.stk-b-look');
      const at = need ? Number(need.getAttribute('data-th-row')) : -1;
      if (at >= 0 && !need.classList.contains('is-open') && typeof window.docThreadOpen === 'function')
        setTimeout(() => { try { window.docThreadOpen(c, at); } catch (_){} setTimeout(() => { try { if (typeof window.pd2ClauseTint === 'function') window.pd2ClauseTint(); } catch (_){} }, 350); }, 0);
    }
    /* the paper's tint follows whichever clause is open, after the list is drawn */
    if (typeof window.pd2ClauseTint === 'function') setTimeout(() => { try { window.pd2ClauseTint(); } catch (_){} }, 30);
  }
  /* THE PREAMBLE AND ITS BLANKS, FIRST (the new look, as drawn): the paper's own blanks still open before the first clause,
     read off the paper (free), with the one door that fills them on the paper; a blank is filled, never redlined */
  if (stkNewLookOn() && list && typeof window.pd2FillBlanks === 'function'){
    let bl = []; try { bl = window.pd2FillBlanks(c).filter(x => x && !String(x.value || '').trim() && (!x.section || x.section === c.name)); } catch (_){ bl = []; }
    /* Mark reviewed: the existing review record (POST …/points/:key/review), one key for the preamble's blanks; a reviewed
       blank is still a blank — signing still waits on it being filled */
    const rv = (c.pointReviews || {})[STK_PRE_KEY], why = stkReviewWhy(), busy = !!_stk.marking[STK_PRE_KEY];
    const mark = rv ? `<span class="stk-pre-done">${_bdE(i18t('stk_pre_reviewed', { who: String(rv.name || '').split(' ')[0] || '' }))}</span> <button type="button" class="stk-a is-link" data-stk-pre-review="undo"${busy ? ' disabled' : ''}>${_bdE(i18t('stk_undo'))}</button>`
      : `<button type="button" class="stk-a is-link" data-stk-pre-review=""${why ? ` disabled aria-disabled="true" title="${_bdE(why)}"` : ''}${busy ? ' disabled' : ''}>${_bdE(i18t('stk_mark_reviewed'))}</button>`;
    if (bl.length) list.insertAdjacentHTML('afterbegin', `<div class="stk-pre${rv ? ' is-reviewed' : ''}" role="listitem"><div class="stk-pre-h"><i class="stk-pre-ring" aria-hidden="true"></i><b>${_bdE(i18t('pd2_fp_preamble').replace(/^./, ch => ch.toUpperCase()))}</b><span class="stk-pre-v">${_bdE(bl.map(x => String(x.label || x.key).toLowerCase()).join(' \u00b7 '))}</span></div><div class="stk-pre-a"><button type="button" class="stk-a is-link" data-stk-pre-fill="${_bdE(bl[0].key)}">${_bdE(i18t('stk_fill_it'))}</button>${mark}<span>${_bdE(i18t('stk_pre_never'))}</span></div></div>`);
  }
  stkSpineEnds(card);
  if (stkNewLookOn()) stkAllPaint(c, card);
  stkDivePaint(c, card);
  /* the tab's number is this reading's "need you" (pdTabCount → stkNeedCount) */
  if (typeof pdTabCountPaint === 'function') try { pdTabCountPaint('doc', c); } catch (_){}
}
/* THE SPINE ALWAYS ENDS ON A DOT (owner, 28 Oct 2026: "I want the spine to always end with a ball"): the
   thread marks its first and last bead over its OWN filter (docThreadStates), so a tab that hides rows
   (Needs you, Worth a look) left the line running past the dots it kept. Measured over the rows LEFT
   SHOWING: the first shown row's line starts at its bead, the last one's stops at it, and a title shown
   above the first bead or below the last draws no line of its own. */
function stkSpineEnds(card){
  const list = card && card.querySelector('.doc-th-rows'); if (!list) return;
  const els = [...list.querySelectorAll(':scope > .doc-th-row, :scope > .doc-th-sec')];
  els.forEach(el => el.classList.remove('stk-sp-first', 'stk-sp-last', 'stk-sp-off'));
  const shows = el => !el.hidden && !el.classList.contains('stk-hide');
  const rows = els.filter(el => el.classList.contains('doc-th-row') && shows(el));
  if (!rows.length) return;
  const first = els.indexOf(rows[0]), last = els.indexOf(rows[rows.length - 1]);
  rows[0].classList.add('stk-sp-first'); rows[rows.length - 1].classList.add('stk-sp-last');
  els.forEach((el, i) => { if (el.classList.contains('doc-th-sec') && (i < first || i > last)) el.classList.add('stk-sp-off'); });
}
/* TWO STEPS (owner, 13 Oct 2026): the list read leaves a point's deep dive
   for its own small read, asked on the press of Deep dive and kept on the
   reading (`_dove`). A reading made before carries its dive already. */
const stkDiveOwed = p => !!p && p.by === 'jambo' && !p._dove && !(p.what || p.usual || p.ask || (p.edge || []).length);
const stkDiveKey = (c, p) => String(c && c.id) + ':' + (bdOf(c) || {}).hash + ':' + (p && p._i);
async function stkDiveFetch(c, p){
  if (!c || !p || !stkDiveOwed(p)) return;
  const k = stkDiveKey(c, p);
  if (_stk.diveBusy[k]) return;
  if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)){ _stk.diveErr[k] = i18t('bd_no_key'); return; }
  _stk.diveBusy[k] = true; delete _stk.diveErr[k];
  try {
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    /* `blank`: the clause IS in the contract and says nothing (the route's own
       third state) — the dive is told so, or it would be asked about wording
       that is not there */
    const r = await api('ai/breakdown/point', 'POST', { text: bdText(live), point: { title: p.title, clause: p.clause, stake: p.stake, quote: p.quote, missing: !!p.missing, blank: !!p.blank, after: p.after || '' } }, { quiet: true });
    if (!r || r.error) throw new Error((r && r.error) || i18t('bd_failed'));
    const b = live.breakdown, at = b && Array.isArray(b.points) ? b.points[p._i] : null;
    /* kept only on the reading it was asked for: these words, and the language it came back in */
    if (at && b.hash === (bdOf(c) || {}).hash && (b.lang || 'en') === (r.lang || 'en')){
      ['what', 'theirs', 'usual', 'figure', 'how', 'push', 'ask'].forEach(f => { at[f] = String(r[f] || ''); });
      at.edge = Array.isArray(r.edge) ? r.edge : []; at.trade = Array.isArray(r.trade) ? r.trade : []; at._dove = true;
      if (typeof persist === 'function') persist(live);
    }
  } catch (e){ _stk.diveErr[k] = (e && e.message) || i18t('bd_failed'); }
  delete _stk.diveBusy[k];
  const cur = stkContract();
  if (cur && String(cur.id) === String(c.id) && _stk.dive >= 0) stkDivePaint(cur);
}
function stkDiveHtml(c, b, i){
  const shown = stkShown(c, b), p = shown[i], n = shown.length;
  const where = p.by === 'std'
    ? (p.quote ? `<button type="button" class="stk-lnk" data-stk-show="${i}">${_bdE(i18t('stk_show_paper'))}</button>` : `<span class="stk-src">${_bdE(i18t('stk_missing_any'))}</span>`)
    : p.missing || !p.clause
    ? `<span class="stk-src">${_bdE(p.after ? i18t('stk_missing_at', { n: p.after }) : i18t('stk_missing_any'))}</span>`
    : `<button type="button" class="stk-lnk" data-stk-show="${i}">${_bdE(i18t('stk_clause', { n: p.clause }))}</button>`;
  const sec = (h, body) => body ? `<section class="stk-sec"><h4>${_bdE(i18t(h))}</h4>${body}</section>` : '';
  const vs = p.theirs || p.usual ? `<table class="stk-vs"><tr class="is-theirs"><td>${_bdE(i18t('stk_this'))}</td><td>${_bdE(p.theirs || '—')}</td></tr><tr class="is-usual"><td>${_bdE(i18t('stk_usual'))}</td><td>${_bdE(p.usual || '—')}</td></tr></table>` : '';
  /* a "figure" with no number in it is a sentence (an older read kept one): no figure, its words go to how */
  const fig = /\d/.test(String(p.figure || '')) ? String(p.figure) : '', how = [fig ? '' : String(p.figure || ''), String(p.how || '')].filter(Boolean).join(' ');
  const cost = `<div class="stk-fig${fig ? '' : ' is-none'}">${_bdE(fig || i18t('stk_no_figure'))}</div>${how ? `<p class="stk-how">${_bdE(how)}</p>` : ''}`;
  /* a link names Jambo's point by its place in his read; it opens where that point stands on screen */
  const links = (p.links || []).map(k => shown.findIndex(q => q.by === 'jambo' && q._i === k - 1)).filter(at => at >= 0 && at !== i);
  /* the walk steps past a field left blank (it has no deep dive), and an arrow with nothing that way is greyed */
  let prevAt = -1, nextAt = -1;
  for (let j = i - 1; j >= 0; j--) if (shown[j] && !shown[j].blank){ prevAt = j; break; }
  for (let j = i + 1; j < shown.length; j++) if (shown[j] && !shown[j].blank){ nextAt = j; break; }
  return `<div class="stk-dv${stkTone(p)}">
    <div class="stk-dv-top"><button type="button" class="ui-btn ui-btn-sm" data-stk-back>‹ ${_bdE(i18t('stk_back'))}</button>
      <span class="stk-pg">${_bdE(i18t('stk_of', { k: i + 1, n }))}
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${prevAt}"${prevAt >= 0 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_prev'))}" title="${_bdE(i18t('stk_prev'))}">‹</button>
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${nextAt}"${nextAt >= 0 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_next'))}" title="${_bdE(i18t('stk_next'))}">›</button></span></div>
    <div class="stk-dv-scroll scroll-thin">
    <div class="stk-dv-head"><div class="stk-meta">${bdChip(p.status)}</div>
      <h3>${_bdE(p.title)}</h3><div class="stk-meta">${where}</div></div>
    <div class="stk-dv-body">
      ${stkDiveOwed(p) ? (_stk.diveErr[stkDiveKey(c, p)]
        ? `<p class="stk-err" role="alert">${_bdE(_stk.diveErr[stkDiveKey(c, p)])}</p><div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm" data-stk-dive-again="${i}">${_bdE(i18t('stk_again'))}</button><span class="stk-cost">${_bdE(i18t('stk_dive_cost'))}</span></div>`
        : `<div class="stk-acts"><span class="stk-busy" role="status" aria-live="polite">${window.busyHtml ? busyHtml(i18t('stk_dive_reading')) : _bdE(i18t('stk_dive_reading'))}</span><span class="stk-cost">${_bdE(i18t('stk_dive_cost'))}</span></div>`) : ''}
      ${sec('stk_h_what', p.what ? `<p>${_bdE(p.what)}</p>` : '')}
      ${p.by !== 'jambo' || stkDiveOwed(p) ? '' : sec('stk_h_cost', cost)}
      ${sec('stk_h_vs', vs)}
      ${sec('stk_h_push', p.push ? `<p class="stk-push">${_bdE(p.push)}</p>` : '')}
      ${sec('stk_h_edge', (p.edge || []).length ? `<ul class="stk-edge">${p.edge.map(e => `<li>${_bdE(e)}</li>`).join('')}</ul>` : '')}
      ${sec('stk_h_trade', (p.trade || []).length ? `<div class="stk-trade">${p.trade.map(t => `<div><span><em>${_bdE(i18t('stk_give'))}</em>${_bdE(t.give)}</span><span class="stk-arw" aria-hidden="true">→</span><span><em>${_bdE(i18t('stk_get'))}</em>${_bdE(t.get)}</span></div>`).join('')}</div>` : '')}
      ${p.ask ? `<div class="stk-ask"><span>${_bdE(i18t('stk_ask'))}</span><p>${_bdE(p.ask)}</p></div>` : ''}
      ${sec('stk_h_links', links.length ? `<div class="stk-links">${links.map(at => `<button type="button" data-stk-dive="${at}">${_bdE(shown[at].title)}</button>`).join('')}</div>` : '')}
      <div class="stk-acts">${(why => `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-stk-redline${why ? ` disabled aria-disabled="true" title="${_bdE(why)}"` : ''}>${_bdE(i18t('stk_redline'))}</button>`)(stkRedlineWhy(c))}
        <button type="button" class="ui-btn ui-btn-sm" data-stk-ask="${i}">${_bdE(i18t('stk_ask_jambo'))}</button></div>
    </div></div></div>`;
}
function stkDivePaint(c, card){
  card = card || document.getElementById('pd-thread'); if (!card) return;
  const b = stkOf(c);
  let dv = card.querySelector('.stk-dive');
  const on = !!(b && _stk.dive >= 0 && stkShown(c, b)[_stk.dive]);
  card.classList.toggle('is-stk-dive', on);
  if (!on){ if (dv) dv.remove(); return; }
  if (!dv){ dv = document.createElement('div'); dv.className = 'stk-dive'; card.appendChild(dv); }
  dv.innerHTML = stkDiveHtml(c, b, _stk.dive);
}
/* ---- "START REDLINING WITH THIS ASK" LANDS ON ITS CLAUSE (owner, 13 Oct
   2026: it opened Negotiate at the top of the paper, on another clause's
   card, with no way back) ----
   Through Negotiate's one door, carrying the point's clause and its ask:
   Negotiate opens that clause in Edit with Jambo, the ask ready to use and
   nothing filed or sent until a person presses. It remembers where the
   reader came from — this contract's deep dive, its point and its filters —
   so "‹ Back to clauses" returns to the same point (stkResume). */
/* ---- WHY THIS READER MAY NOT REDLINE IT, OR '' (owner, 20 Oct 2026: "it
   should be greyed out if you have no editing access or access to edit a
   particular contract") ----
   The house's own readings, in order: a viewer cannot edit at all (canEdit),
   the negotiation's desk seats its own redliners (deskMayRedline, its words
   deskBlockMessage), and a signature freezes the wording (negoWordingFrozen).
   Greyed with the reason; "Ask Jambo about this" then asks on Home's box. */
function stkRedlineWhy(c){
  if (!c) return '';
  if (typeof canEdit === 'function' && !canEdit()) return i18t('stk_redline_viewer');
  try { if (typeof deskMayRedline === 'function' && !deskMayRedline(c))
    return (typeof deskBlockMessage === 'function' && deskBlockMessage(c)) || i18t('dk_reading', { who: ((typeof deskLead === 'function' && deskLead(c)) || {}).name || '' }); } catch (_){}
  if (typeof negoWordingFrozen === 'function' && negoWordingFrozen(c)) return i18t('ce_wording_frozen');
  return '';
}
/* a card's own "Start redlining ›" passes its point (`opts.at`, the list's
   order); the deep dive's passes none and means the point it shows */
function stkRedlineGo(c, opts){
  if (stkRedlineWhy(c)) return;
  const at = opts && Number.isInteger(opts.at) ? opts.at : _stk.dive;
  const b = stkOf(c), p = b && at >= 0 ? stkShown(c, b)[at] : null;
  let clauseId = '';
  if (p && !p.missing && _stk.rows){
    const at = stkAt(p, _stk.nums || [], _stk.rows), x = at >= 0 ? _stk.rows[at] : null;
    if (x && typeof docXrayClauseId === 'function') clauseId = docXrayClauseId(x) || '';
  }
  if (typeof rlCameFromSet === 'function') rlCameFromSet({ id: String(c.id), dive: _stk.dive, f: { ..._stk.f } });
  if (typeof openRedlineWorkbench !== 'function') return;
  const q = opts && opts.question ? String(opts.question) : '';
  openRedlineWorkbench(c.id, { from: 'clauses', land: p && !p.missing ? { clauseId, quote: String(p.quote || ''), num: stkNum(p.clause) || ((_stk.nums || [])[p.at] || ''), ask: q ? '' : String(p.ask || p.stdAsk || ''), question: q } : null });
}
/* the way back puts the deep dive where the reader left it */
function stkResume(f){
  if (!f || !f.id) return;
  _stk.id = String(f.id); _stk.dive = Number.isInteger(f.dive) ? f.dive : -1;
  _stk.f = { reg: '', sev: '', by: '', ...(f.f || {}) };
}
/* ---- MARK REVIEWED: THE SERVER WRITES IT (flow rule 8; owner said yes,
   21 Oct 2026) ----
   One route, POST /api/contracts/:id/points/:key/review ({undo} takes it
   back): who and when on c.pointReviews, a line in the trail. The page only
   shows what came back. Without a server (the demo in one browser) the same
   record is kept on the contract here, with the same trail line. */
async function stkMarkReviewed(c, p, undo){
  if (!c || !p || !p.key || stkReviewWhy() || _stk.marking[p.key]) return;
  const live = (typeof getContract === 'function' && getContract(c.id)) || c;
  _stk.marking[p.key] = true; stkRepaint(live);
  try {
    if (typeof API_MODE === 'function' && API_MODE()){
      const r = await api('contracts/' + encodeURIComponent(live.id) + '/points/' + encodeURIComponent(p.key) + '/review', 'POST', { undo: !!undo, title: String(p.title || '') });
      live.pointReviews = (r && r.pointReviews && typeof r.pointReviews === 'object') ? r.pointReviews : {};
      if (r && r.line) live.audit = (Array.isArray(live.audit) ? live.audit : []).concat([r.line]);
    } else {
      const u = (typeof currentUser === 'function' && currentUser()) || {};
      const map = { ...(live.pointReviews || {}) };
      if (undo) delete map[p.key]; else map[p.key] = { id: String(u.id || ''), name: String(u.name || ''), at: new Date().toISOString() };
      live.pointReviews = map;
      live.audit = (Array.isArray(live.audit) ? live.audit : []).concat([{ at: new Date().toISOString(), user: String(u.name || ''), action: 'Clause review',
        detail: (undo ? 'Took back "reviewed" on: ' : 'Marked reviewed: ') + String(p.title || '') }]);
      if (typeof persist === 'function') persist(live);
    }
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || i18t('stk_review_failed'), 'err'); }
  delete _stk.marking[p.key];
  stkRepaint((typeof getContract === 'function' && getContract(c.id)) || live);
}
function stkContract(){ return _stk.id && typeof getContract === 'function' ? getContract(_stk.id) : null; }
/* light a point's words on the paper; a point with no words goes to its clause */
function stkShow(c, p, i){
  if (!c || !p) return;
  if (p.quote && typeof igQuoteGo === 'function'){ igQuoteGo(p.quote); return; }
  const card = document.getElementById('pd-thread');
  const b = stkOf(c); if (!b || !card) return;
  const at = [...card.querySelectorAll('.doc-th-row')].findIndex(el => el.querySelector(`[data-stk-dive="${i}"]`));
  const row = at >= 0 ? card.querySelectorAll('.doc-th-row')[at] : null;
  if (row && typeof docThreadGoTo === 'function') docThreadGoTo(typeof docThreadCur === 'function' ? docThreadCur(c) : c, Number(row.getAttribute('data-th-row')));
}
function stkRepaint(c){
  if (typeof docThreadPaint === 'function') try { docThreadPaint(c); } catch (_){}
}
async function stkRun(c){
  if (!c || _bd.busy) return;
  _bd.tried[stkKey(c)] = true;   // a press is a try: a refusal then says Try again
  _bd.runFor = c.id;
  const p = bdRun(c);
  stkRepaint(c);
  await p;
  stkRepaint((typeof getContract === 'function' && getContract(c.id)) || c);
}
function stkDiveOpen(c, i){
  const b = stkOf(c), shown = stkShown(c, b); if (!b || !shown[i]) return;
  /* a field left blank has no deep dive (round 5): the walk ‹ › steps past it, never spending a call on it */
  if (shown[i].blank){ const step = i < _stk.dive ? -1 : 1; let j = i; while (shown[j] && shown[j].blank) j += step; if (!shown[j]) return; i = j; }
  _stk.dive = i;
  stkDivePaint(c);
  const dv = document.querySelector('#pd-thread .stk-dv-scroll'); if (dv) dv.scrollTop = 0;
  stkShow(c, shown[i], i);
  if (stkDiveOwed(shown[i])) stkDiveFetch(c, shown[i]);
}
function stkDiveClose(c){
  _stk.dive = -1; stkDivePaint(c);
}
if (typeof document !== 'undefined' && !document._stkWired){
  document._stkWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#pd-thread')) return;
    const c = stkContract(); if (!c) return;
    if (t.closest('[data-stk-run]')){ stkRun(c); return; }
    if (t.closest('[data-stk-more]')){ e.preventDefault(); _stk.more = !stkMoreOpen(); if (!_stk.more){ _stk.f.reg = ''; _stk.f.by = ''; } stkRepaint(c);
      const again = document.querySelector('#pd-thread [data-stk-more]'); if (again) try { again.focus({ preventScroll: true }); } catch (_){}
      return; }
    /* MARQUEE'S TABS: one choice of clauses for the sitting; the list repaints, the tab keeps the hand */
    const tb = t.closest('[data-stk-tab]');
    if (tb){ e.preventDefault(); _stk.f.sev = tb.getAttribute('data-stk-tab') || ''; _stk.dive = -1; stkRepaint(c);
      const again = document.querySelector(`#pd-thread [data-stk-tab="${CSS.escape(_stk.f.sev)}"]`); if (again) try { again.focus({ preventScroll: true }); } catch (_){}
      return; }
    const da = t.closest('[data-stk-dive-again]');
    if (da){ const b0 = stkOf(c), p = b0 ? stkShown(c, b0)[Number(da.getAttribute('data-stk-dive-again'))] : null;
      if (p){ delete _stk.diveErr[stkDiveKey(c, p)]; stkDivePaint(c); stkDiveFetch(c, p); } return; }
    /* ---- WHAT THE CONTRACT DOES NOT SAY FOLDS LIKE EVERYTHING ELSE (21 Oct
       2026) ---- Its own head is the control: pressed it shuts the group,
       pressed again it opens it, and the choice is kept for this sitting so a
       repaint (a poll, a reading landing) does not undo it. Nothing in the
       list is uncloseable now. The list is NOT repainted: the class and the
       state go on the elements in front of the reader. */
    const mg = t.closest('[data-stk-miss-go]');
    if (mg){
      const k = String(mg.getAttribute('data-stk-miss-go') || ''), box = mg.closest('.stk-miss');
      if (box){
        const open = box.classList.toggle('is-open');
        if (open) _stk.missShut.delete(k); else _stk.missShut.add(k);
        mg.setAttribute('aria-expanded', open ? 'true' : 'false');
        mg.title = i18t(open ? 'stk_miss_fold' : 'stk_miss_unfold');
      }
      return;
    }
    const rv = t.closest('[data-stk-review], [data-stk-unreview]');
    if (rv){ if (rv.disabled) return; const b0 = stkOf(c), undo = rv.hasAttribute('data-stk-unreview');
      const p = b0 ? stkShown(c, b0)[Number(rv.getAttribute(undo ? 'data-stk-unreview' : 'data-stk-review'))] : null;
      if (p) stkMarkReviewed(c, p, undo); return; }
    const fl = t.closest('[data-stk-fill]');
    if (fl){ e.stopPropagation(); if (fl.disabled) return; const b0 = stkOf(c), p = b0 ? stkShown(c, b0)[Number(fl.getAttribute('data-stk-fill'))] : null; if (p) stkFillGo(c, p); return; }
    const dv = t.closest('[data-stk-dive]');
    if (dv){ e.stopPropagation(); if (dv.disabled) return; stkDiveOpen(c, Number(dv.getAttribute('data-stk-dive'))); return; }
    if (t.closest('[data-stk-back]')){ stkDiveClose(c); return; }
    const b = stkOf(c);
    const sh = t.closest('[data-stk-show]');
    if (sh && b){ const k = Number(sh.getAttribute('data-stk-show')); stkShow(c, stkShown(c, b)[k], k); return; }
    const rl = t.closest('[data-stk-redline]');
    if (rl){ if (rl.disabled) return; const v = rl.getAttribute('data-stk-redline'); stkRedlineGo(c, v ? { at: Number(v) } : undefined); return; }
    const ak = t.closest('[data-stk-ask]');
    if (ak && b){ const p = stkShown(c, b)[Number(ak.getAttribute('data-stk-ask'))];
      /* A WHOLE QUESTION, NOT A STUB (owner, 13 Oct 2026: "the question posed is
         terribly framed"): the clause by number, the point in plain words with
         no quote marks (Jambo read a quoted title as a finding to look up), and
         what we want back. The reader presses Ask, or edits it first. */
      if (p){
        const t = String(p.title || '').trim().replace(/[.\s]+$/, ''), n = stkNum(p.clause);
        const q = p.missing ? i18t('stk_ask_q_missing', { t }) : n ? i18t('stk_ask_q', { n, t }) : i18t('stk_ask_q_none', { t });
        /* TO JAMBO IN THE EDIT ROOM (owner, 13 Oct 2026: "ask jambo is supposed
           to take me to the jambo in the redline editing page"): the clause
           opens in Edit with Jambo, the question waiting in his ask box,
           unsent — he knows the contract and the clause there. A point about
           nothing in the contract, or a window too narrow for the editor,
           asks on Home as before. */
        const fits = typeof clauseEditorFits === 'function' && clauseEditorFits();
        if (!p.missing && fits && !stkRedlineWhy(c)) stkRedlineGo(c, { question: q });
        else if (typeof intelAskReady === 'function') intelAskReady(q);
      } }
  }, true);
  /* a filter's change repaints the list, and the box keeps the keyboard */
  document.addEventListener('change', e => {
    const sel = e.target && e.target.closest ? e.target.closest('#pd-thread [data-stk-f]') : null; if (!sel) return;
    const c = stkContract(); if (!c) return;
    const k = sel.getAttribute('data-stk-f');
    if (!(k in _stk.f)) return;
    _stk.f[k] = String(sel.value || '');
    _stk.dive = -1;
    stkRepaint(c);
    const again = document.querySelector(`#pd-thread [data-stk-f="${k}"]`); if (again) fieldFocus(again);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || _stk.dive < 0) return;
    const card = document.getElementById('pd-thread'); if (!card || !card.classList.contains('is-stk-dive')) return;
    const c = stkContract(); if (c){ e.preventDefault(); stkDiveClose(c); }
  });
}

Object.assign(window, { stkRedlineGo, stkResume, stkDecorate, stkOf, stkRun, stkDiveOpen, stkDiveClose, bdOf, bdStale, bdRun, stkReview, stkNeedCount, stkMarkReviewed, stkPointKey });
/* the Preamble row's Fill it in: the paper's blanks filled where they stand (the new look's one door for them) */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-stk-pre-fill]') : null; if (!b) return;
  e.preventDefault(); const c = stkContract(); if (c && typeof window.pd2FillStart === 'function') window.pd2FillStart(c.id, b.getAttribute('data-stk-pre-fill'));
});
/* ---- ALL N IN PLAIN ENGLISH, ONE AT A TIME (owner, 31 Oct 2026: "Reverse but you choose to translate one at a time";
   REVERSES 6 Oct's "there should never be an option to translate all clauses", on the new look) ----
   One press walks the clauses not yet read, one clause per reading, in order — each the same single-clause reading a
   row's own Plain English press asks (docReadRun({only:[i]}), the route's one-clause rule kept) — and says how far it has
   gone; Stop ends it after the clause in hand. Clauses already read cost nothing and are not read again. */
const STK_PRE_KEY = 'pblpreamble';
const _stkAll = { id: '', run: false, stop: false, done: 0, total: 0 };
function stkAllRows(card){
  const rows = [...card.querySelectorAll('.doc-th-rows .doc-th-row[data-th-row]')].filter(r => !r.hidden);
  const read = r => !!r.querySelector('[data-th-state] .is-read, [data-th-state] .stk-read');
  return { all: rows.map(r => Number(r.getAttribute('data-th-row'))), left: rows.filter(r => !read(r)).map(r => Number(r.getAttribute('data-th-row'))) };
}
function stkAllPaint(c, card){
  const slot = card && card.querySelector('[data-stk-all]'); if (!slot) return;
  const R = stkAllRows(card), n = R.all.length, k = R.left.length, E = _bdE;
  if (!n){ slot.innerHTML = ''; return; }
  const noAi = typeof window.docThreadNoAi === 'function' ? window.docThreadNoAi() : !(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured);
  const going = _stkAll.run && _stkAll.id === String(c.id);
  let html;
  if (going) html = `<button type="button" class="stk-all-b" data-stk-all-stop>${E(i18t('stk_all_stop'))}</button><span class="stk-cost-n">${E(i18t('stk_all_going', { k: _stkAll.done, n: _stkAll.total }))}</span>`;
  else if (!k) html = `<span class="stk-cost-n">${E(i18tn('stk_all_done', n, { n }))}</span>`;
  else html = `<button type="button" class="stk-all-b" data-stk-all-go${noAi ? ` disabled aria-disabled="true" title="${E(i18t('th_no_ai'))}"` : ''}>${E(i18tn('stk_all_go', n, { n }))}</button><span class="stk-cost-n">${E([i18tn('pd2_n_calls', k, { n: k }), n - k ? i18tn('stk_all_read', n - k, { n: n - k }) : ''].filter(Boolean).join(' · '))}</span>`;
  if (slot.innerHTML !== html) slot.innerHTML = html;
}
async function stkAllRun(c){
  const card = c && document.querySelector('#pd-thread'); if (!card || _stkAll.run || typeof window.docReadRun !== 'function') return;
  const left = stkAllRows(card).left; if (!left.length) return;
  Object.assign(_stkAll, { id: String(c.id), run: true, stop: false, done: 0, total: left.length });
  stkAllPaint(c, card);
  for (const i of left){
    if (_stkAll.stop || _stkAll.id !== String(c.id)) break;
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    try { await window.docReadRun(live, { only: [i], out: { asked: false, why: '' } }); } catch (_){}
    _stkAll.done++;
    const cur = (typeof getContract === 'function' && getContract(c.id)) || live;
    try { if (typeof window.docThreadPaint === 'function') window.docThreadPaint(cur); } catch (_){}
    const cd = document.querySelector('#pd-thread'); if (cd) stkAllPaint(cur, cd);
  }
  _stkAll.run = false;
  const cd = document.querySelector('#pd-thread'); if (cd) stkAllPaint((typeof getContract === 'function' && getContract(c.id)) || c, cd);
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  if (t.closest('[data-stk-all-go]')){ e.preventDefault(); const c = stkContract(); if (c) stkAllRun(c); return; }
  if (t.closest('[data-stk-all-stop]')){ e.preventDefault(); _stkAll.stop = true; return; }
  const pr = t.closest('[data-stk-pre-review]');
  if (pr){ e.preventDefault(); if (pr.disabled) return; const c = stkContract(); if (c) stkMarkReviewed(c, { key: STK_PRE_KEY, title: i18t('stk_pre_title') }, pr.getAttribute('data-stk-pre-review') === 'undo'); return; }
});
Object.assign(window, { stkAllRun, stkAllPaint, STK_PRE_KEY });
