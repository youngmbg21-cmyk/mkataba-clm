// HaTi — extracted module. Globals are window-attached on purpose: the app is
// written against a single global scope (inline onclick handlers, cross-module
// calls); modules give file isolation for editing, not scope isolation.
/* ============================================================
   INSPECTOR — THE LIST, AND ONE CONTRACT'S FACTS BESIDE IT
   (Young picked it by name, 26 Sep 2026, off the "Contract List Options"
   page — option 3 — and asked for it on Approvals & signing as well)
   ============================================================
   A press on a row SELECTS it, and the panel on the right says what that
   contract is: its stage and whose move, its facts, what is on the table,
   what Copilot has read and the latest lines on its trail. OPENING TAKES A
   SECOND PRESS — the panel's own button, Enter, or a double-click — and the
   arrow keys move the selection. That trade is the design; the drawing named
   it under its costs and the owner chose it knowing so.

   THE PANEL COUNTS NOTHING OF ITS OWN. The drawing's own cost line was "the
   panel repeats facts the Overview shows, so both must always read from one
   place", so every section borrows a reading the product already makes: the
   Overview's readings table (ktReadingsRows), the register's day printer and
   stream name, whose move (negoMoveSay), the desk's own standard.

   READING MUST NOT WRITE. The table is read off c.changes RAW and the trail
   off c.audit RAW. negoTimeline is deliberately NOT asked — it runs negoInit,
   which would start a negotiation on every contract a reader merely looked
   at — and the move and the table are only asked where a negotiation already
   exists, the register's own guard (regMoveWord).

   ONE BUILDER, THREE PAGES. Contracts, Negotiations and Approvals & signing
   each hand it the contract and their own verbs; the shape, the dressing
   (.ins-* in index.html) and the keyboard are written once, here.

   NOT ON THE PHONE, AND NOT BELOW INS_MIN_W. There the page draws the full
   table it always drew, because a panel squeezed beside a list too narrow for
   its columns cuts both. The answer is asked at every paint, and a width that
   crosses the line repaints the page (insWatchWidth).
   ============================================================ */

/* The width of #content below which the page keeps its full table. The panel
   takes at least 340px (--ins-panel-w's floor), the gap 14 and the page's own
   padding 32, which leaves a list of about 650 — MEASURED as the narrowest
   that holds a reference, a counterparty, a stage and a value side by side AND
   keeps the filter row on its one line (at 940 the row wrapped and the
   counterparty column was cut to 150px). On a laptop's floating rail that is
   any window from about 1104 wide. */
const INS_MIN_W = 1040;
/* How many asks "On the table" lists before it counts the rest — a cap is a
   fact, never a silent trim. */
const INS_ASKS_MAX = 5;
/* How many lines of the trail "Latest" prints. The History tab has them all. */
const INS_LATEST = 3;

/* A stage may force the answer (the browser files, a node stage with no
   layout). null means "measure". Never stored. */
let _insForce = null;
function insForce(v){ _insForce = (v === true || v === false) ? v : null; }
function insFits(){
  if (_insForce !== null) return _insForce;
  const el = (typeof document !== 'undefined') ? document.getElementById('content') : null;
  /* JAMBO'S PANEL STANDS OUTSIDE THE PAGE (18 Oct 2026): at the window's right
     edge, the page beside it narrowed by its width — so the room the list and
     its panel share is the page's width plus the column the panel took, the
     same measure as before it moved (else the panel would take itself away). */
  const w = el ? el.clientWidth + jlReserved() : 0;
  return w >= INS_MIN_W;
}

/* WHICH ROW IS SELECTED, per seat, per sitting, in memory. Stored would make
   two people's screens — or one person's two tabs — open on different
   contracts for no reason they could see. */
const _insSel = {};
/* LET GO (Jambo's panel, 18 Oct 2026): "‹ Jambo", his tab, or a question
   asked in the box puts the chosen row down and the panel says Jambo's own
   words — until a row is pressed again. Per seat, per sitting. */
const _insGone = {};
function insSelected(seat){ return _insSel[seat] || null; }
function insSelect(seat, id){ _insSel[seat] = id ? String(id) : null; if (id) _insGone[seat] = false; }
function insLetGo(seat){ if (!seat) return; _insGone[seat] = true; _insSel[seat] = null; }
function insLetGone(seat){ return !!_insGone[seat]; }
/* The selected id if it is still in the list on screen, else the first row.
   A filter that takes the chosen contract off the list must not leave the
   panel describing a contract the reader can no longer see. A seat let go
   stays let go; a page that ARRIVES with nothing chosen (`o.none` — round 16's
   "Your week") chooses nothing until a row is pressed. */
let _insLastSeat = null;
function insPick(seat, ids, o){
  _insLastSeat = seat || null;
  const list = (ids || []).map(String).filter(Boolean);
  if (_insGone[seat]){ _insSel[seat] = null; return null; }
  const cur = _insSel[seat];
  if (o && o.none && !(cur && list.includes(cur))){ _insSel[seat] = null; return null; }
  const id = (cur && list.includes(cur)) ? cur : (list[0] || null);
  _insSel[seat] = id;
  return id;
}

/* ---- small readings ---- */
function _insDaysSince(iso, now){
  const t = Date.parse(String(iso || ''));
  if (!isFinite(t)) return null;
  return Math.max(0, Math.floor(((now || Date.now()) - t) / 86400000));
}
function _insDaysWord(n){
  return n === 0 ? i18t('ins_days_today') : i18tn('ins_days', n, { n });
}
function _insDay(iso){
  const s = String(iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  return (typeof regDotDate === 'function') ? regDotDate(s) : s;
}
/* ---- THE FACTS: six, each one borrowed ---- */
function insFacts(c){
  const out = [];
  /* MONEY ONLY WHERE THE READER MAY SEE IT — and then the row is not drawn at
     all, never drawn as a dash, which would claim there is no value. */
  if (!(typeof canViewValues === 'function' && !canViewValues())){
    const mon = (typeof isMonetary === 'function') ? isMonetary(c) : true;
    out.push({ k: 'value', label: i18t('ins_f_value'),
      /* IN THE CONTRACT'S OWN CURRENCY (W2-1) — fmtMoneyShortOf, never the
         workspace's: a figure about one contract states its own code, and only
         a figure that ADDS contracts converts. No fallback to the workspace
         print, which would be the one wrong answer. */
      v: !mon ? i18t('reg_non_monetary_word')
        : ((c.value && typeof fmtMoneyShortOf === 'function') ? fmtMoneyShortOf(c) : '') });
  }
  let owner = ''; try { owner = (typeof contractOwnerName === 'function' && contractOwnerName(c)) || ''; } catch (_) { owner = ''; }
  out.push({ k: 'owner', label: i18t('ins_f_owner'), v: owner });
  let stream = ''; try { stream = (typeof regStreamName === 'function') ? regStreamName(c) : ''; } catch (_) { stream = ''; }
  out.push({ k: 'stream', label: i18t('ins_f_stream'), v: stream });
  let kind = ''; try { kind = (typeof cKind === 'function') ? cKind(c) : ''; } catch (_) { kind = ''; }
  out.push({ k: 'type', label: i18t('ins_f_type'), v: kind });
  let signed = ''; try { signed = (typeof regSignedOn === 'function') ? (regSignedOn(c) || '') : ''; } catch (_) { signed = ''; }
  out.push({ k: 'signed', label: i18t('ins_f_signed'), v: signed ? _insDay(signed) : '' });
  let eff = ''; try { eff = (typeof effectiveExpiry === 'function') ? (effectiveExpiry(c) || '') : (c.expiry || ''); } catch (_) { eff = ''; }
  /* The register's own Ends reading (regEndsSay), so the panel and the
     column say a term's end in the same words. */
  let ends = null;
  if (eff){ try { ends = (typeof regEndsSay === 'function') ? regEndsSay(eff) : { day: _insDay(eff), sub: '', tone: '' }; } catch (_) { ends = null; } }
  out.push({ k: 'ends', label: i18t('ins_f_ends'), v: ends ? ends.day : '',
    sub: ends ? (ends.sub || ends.far || '') : '', tone: ends ? ends.tone : '' });
  return out;
}

/* ---- WHOSE MOVE, AS THE NEGOTIATIONS LIST SAYS IT ----
   The one-word reading (negoMoveSay) with the fact behind it: how many
   changes wait on you, that yours are not sent, or how long it has been with
   them. Null where no negotiation has started. */
function insMove(c){
  if (!(c && c.negotiation && Array.isArray(c.changes))) return null;
  let m = null;
  try { m = (typeof negoMoveSay === 'function') ? negoMoveSay(c) : null; } catch (_) { m = null; }
  if (!m) return null;
  if (m.k === 'you'){
    const word = m.why === 'unsent' ? i18t('ins_yours_unsent')
      : m.why === 'nocopy' ? i18t('ins_yours_nocopy')
      : m.why === 'decided' ? i18t('ins_yours_decided')
      : i18tn('ins_yours_n', m.n || 0, { n: m.n || 0 });
    return { k: 'you', word, say: m.say };
  }
  if (m.k === 'them'){
    const d = _insDaysSince(c.negotiation && c.negotiation.turnAt);
    const word = d == null ? i18t('ngl_move_theirs')
      : d === 0 ? i18t('ins_theirs_today') : i18tn('ins_theirs_days', d, { n: d });
    return { k: 'them', word, say: m.say };
  }
  return { k: 'clear', word: i18t('ngl_move_none'), say: m.say };
}
function insMoveCellHtml(c){
  const m = insMove(c);
  if (!m) return '<span class="reg-dash">—</span>';
  return `<span class="ngl-w ngl-w-${m.k}"${m.say && m.say !== m.word ? ` title="${esc(m.say)}"` : ''}>${esc(m.word)}</span>`;
}

/* ---- ON THE TABLE ----
   The pending asks, read RAW: theirs first (the ones waiting on this reader,
   oldest first), then ours not sent, then ours with them. Theirs carry the
   desk's own standard — "past your five working-day standard" — because a
   quiet ask of theirs is the one wait that is this side's to end. */
function insTable(c){
  if (!(c && c.negotiation && Array.isArray(c.changes))) return null;
  const pend = c.changes.filter(x => x && x.status === 'pending' && !x.withdrawn);
  if (!pend.length) return null;
  let unsent = new Set();
  try { unsent = new Set(((typeof negoUnsentAsks === 'function') ? negoUnsentAsks(c) : []).map(x => x && x.id)); } catch (_) { unsent = new Set(); }
  const theirs = pend.filter(x => x.authorSide === 'counterparty')
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  const ourUnsent = pend.filter(x => x.authorSide !== 'counterparty' && unsent.has(x.id));
  const ourSent = pend.filter(x => x.authorSide !== 'counterparty' && !unsent.has(x.id));
  let std = 0;
  try { std = (typeof deskCfg === 'function') ? Number(deskCfg().staleDays || 0) : 0; } catch (_) { std = 0; }
  const nowIso = new Date().toISOString();
  const name = ch => {
    const raw = ch.clauseLabel || ch.headingText || ch.clauseId || '';
    return (typeof negoClauseName === 'function') ? negoClauseName(raw) : String(raw);
  };
  const turnAt = c.negotiation.turnAt || '';
  const items = [
    ...theirs.map(ch => {
      const d = _insDaysSince(ch.createdAt);
      let over = false;
      if (std > 0 && ch.createdAt && typeof deskWorkingDaysBetween === 'function'){
        try { over = deskWorkingDaysBetween(ch.createdAt, nowIso) >= std; } catch (_) { over = false; }
      }
      return { id: ch.id, clause: name(ch), summary: ch.summary || '', who: 'theirs', days: d, over, std };
    }),
    ...ourUnsent.map(ch => ({ id: ch.id, clause: name(ch), summary: ch.summary || '', who: 'unsent', days: null })),
    ...ourSent.map(ch => ({ id: ch.id, clause: name(ch), summary: ch.summary || '', who: 'sent',
      days: _insDaysSince(turnAt || ch.createdAt) })),
  ];
  return { round: c.negotiation.round || 1, n: pend.length,
    items: items.slice(0, INS_ASKS_MAX), more: Math.max(0, items.length - INS_ASKS_MAX) };
}

/* ---- WHAT COPILOT READ: the Overview's own rows, never a second tally ---- */
function insReads(c){
  try { return ((typeof ktReadingsRows === 'function') ? ktReadingsRows(c) : []) || []; }
  catch (_) { return []; }
}

/* ---- LATEST: the newest lines of the trail, read RAW ----
   Null — not an empty list — where the record has no trail on it yet: the
   light list strips `audit`, and "nothing has happened" is a claim this
   panel may only make once it has read the record. */
function insLatest(c){
  /* A LIGHT ROW IS NOT AN EMPTY TRAIL (26 Sep 2026, the overnight clean-up):
     migrateContract gives every row an `audit: []` to stand on, so asking only
     "is it an array" answered "nothing recorded yet" for every contract the
     list had not loaded — and never loaded it (measured). */
  if (!c || !Array.isArray(c.audit) || (c._light && !c._loaded)) return null;
  return c.audit.filter(Boolean).slice()
    .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
    .slice(0, INS_LATEST)
    .map(a => ({ text: `${a.action || ''}${a.detail ? ' — ' + a.detail : ''}`, who: a.user || '', at: a.at || '' }));
}
function _insWhen(at){
  if (!at) return '';
  try { if (typeof histWhen === 'function'){ const w = histWhen(at); return w && w.day ? w.day : ''; } } catch (_) {}
  return _insDay(at);
}

/* ---- THE DRAWING ---- */
const INS_READ_TONE = { yes: 'green', no: '', stale: 'amber', look: 'amber', bad: 'ruby' };
function insSecHtml(title, n, body, cls){
  return `<section class="ins-sec${cls ? ' ' + cls : ''}"><h3>${esc(title)}${n != null && n !== '' ? `<span class="n">${esc(String(n))}</span>` : ''}</h3>${body}</section>`;
}
/* `keys` draws only the named facts, in the reading's own order — a page
   showing the drawing's four (SAP benchmark, 9 Oct 2026) asks for those. */
function insFactsHtml(c, keys){
  const list = Array.isArray(keys) ? insFacts(c).filter(f => keys.includes(f.k)) : insFacts(c);
  return `<dl class="ins-facts">${list.map(f => {
    const none = !f.v;
    return `<div data-ins-fact="${f.k}"><dt>${esc(f.label)}</dt><dd${none ? ' class="none"' : ''}${f.v ? ` title="${esc(f.v + (f.sub ? ' · ' + f.sub : ''))}"` : ''}>${
      none ? '—' : esc(f.v)}${f.sub ? ` <span class="sub${f.tone ? ' is-' + f.tone : ''}">· ${esc(f.sub)}</span>` : ''}</dd></div>`;
  }).join('')}</dl>`;
}
function insTableHtml(c){
  const t = insTable(c);
  if (!t) return '';
  const cp = (c.counterparty || i18t('ng_door_them'));
  const rows = t.items.map(it => {
    let line;
    if (it.who === 'theirs'){
      const days = it.days == null ? '' : _insDaysWord(it.days);
      line = esc(i18t('ins_from', { who: cp, days })) + (it.over
        ? ` <span class="over">${esc(i18t('ins_over', { n: it.std }))}</span>` : '');
    } else if (it.who === 'unsent'){
      line = esc(i18t('ins_yours_unsent_row'));
    } else {
      line = esc(i18t('ins_sent_to', { who: cp, days: it.days == null ? '' : _insDaysWord(it.days) }));
    }
    return `<div class="ins-ask" data-ins-ask="${esc(String(it.id || ''))}"><b title="${esc(it.clause)}">${esc(it.clause || '—')}</b>${
      it.summary ? `<span title="${esc(it.summary)}">${esc(it.summary)}</span>` : ''}<em>${line}</em></div>`;
  }).join('');
  const more = t.more ? `<p class="ins-note">${esc(i18tn('ins_more_asks', t.more, { n: t.more }))}</p>` : '';
  return insSecHtml(i18t('ins_table'), i18t('ins_table_n', { round: t.round, n: t.n }), rows + more, 'ins-table');
}
/* WHAT JAMBO READ, AS HIS PANEL DRAWS IT (rounds 14 and 15): the four
   readings in the drawing's order — The brief · Playbook pass · Risk scan ·
   Obligations — a full dot where it was read, a ring where not, amber where a
   reading wants a look; the words only where they say something ("· 2 risks",
   "· 1 departure", "· not read yet"). The reading is the Overview's own
   (ktReadingsRows), never a second tally; the risks are its open findings. */
const JL_READ_ORDER = ['brief', 'playbook', 'scan', 'oblig'];
function jlReadSaid(c, r){
  if (r.state === 'no') return i18t('jl_read_none');
  if (r.state === 'stale') return i18t('ov_r_before_round');
  if (r.k === 'brief') return r.state === 'look' ? r.said : '';
  if (r.k === 'playbook'){
    const n = Number((/\d+/.exec(String(r.said || '')) || [0])[0]) || 0;
    return n ? i18tn('ov_r_departures', n, { n }) : '';
  }
  if (r.k === 'scan'){
    let open = 0; try { open = ((typeof openFindings === 'function' ? openFindings(c) : []) || []).length; } catch (_){ open = 0; }
    return open ? i18tn('jl_read_risks', open, { n: open }) : '';
  }
  if (r.k === 'oblig'){
    const n = Number((/\d+/.exec(String(r.said || '')) || [0])[0]) || 0;
    return n ? r.said : '';
  }
  return r.said || '';
}
function jlReadsHtml(c){
  const all = insReads(c);
  const rows = JL_READ_ORDER.map(k => all.find(r => r && r.k === k)).filter(Boolean);
  if (!rows.length) return '';
  return insSecHtml(i18t('ins_read'), '', `<div class="ins-read jl-read">${rows.map(r => {
    const tone = r.state === 'yes' ? 'green' : (r.state === 'look' || r.state === 'stale') ? 'amber' : r.state === 'bad' ? 'ruby' : '';
    const said = jlReadSaid(c, r);
    return `<div class="jl-rr${tone ? ' is-' + tone : ''}" data-jl-read="${esc(r.k)}"><i class="jl-dot${tone ? ' is-' + tone : ''}" aria-hidden="true"></i><span data-ins-read="${esc(r.k)}">${esc(r.name)}${said ? ` <em>· ${esc(said)}</em>` : ''}</span></div>`;
  }).join('')}</div>`, 'ins-reads');
}
function insReadsHtml(c, jl){
  if (jl) return jlReadsHtml(c);
  const rows = insReads(c);
  if (!rows.length) return '';
  const tick = (typeof icon === 'function') ? icon('check2', '', 2.4) : '';
  return insSecHtml(i18t('ins_read'), '', `<div class="ins-read">${rows.map(r => {
    const tone = INS_READ_TONE[r.state] || '';
    /* A READING THAT WANTS A LOOK IS ITS OWN TINTED ROW (Young, 7 Oct 2026, off
       the HaTi Platform mockup): the amber or ruby wash behind the line, a "!"
       in its dot, the finding in the tone's ink. A clear reading stays plain. */
    const mark = tone === 'green' ? tick : (tone === 'amber' || tone === 'ruby') ? '!' : '';
    return `<div class="ins-rr${tone ? ' is-' + tone : ''}"><i class="ins-dot${tone ? ' is-' + tone : ''}" aria-hidden="true">${mark}</i><span data-ins-read="${esc(r.k)}"><b>${esc(r.name)}</b> <em>· ${esc(r.said)}</em></span></div>`;
  }).join('')}</div>`, 'ins-reads');
}
function insLatestHtml(c, st){
  const L = insLatest(c);
  let body;
  if (L === null){
    body = `<p class="ins-note">${esc(i18t(st === 'failed' ? 'ins_latest_failed' : (st === 'none' ? 'ins_latest_none' : 'ins_latest_loading')))}</p>`;
  } else if (!L.length){
    body = `<p class="ins-note">${esc(i18t('ins_latest_none'))}</p>`;
  } else {
    body = `<ul class="ins-log">${L.map(l => `<li><span class="t" title="${esc(l.text)}">${esc(l.text)}</span><span class="w">${esc(_insWhen(l.at))}</span></li>`).join('')}</ul>`;
  }
  return insSecHtml(i18t('ins_latest'), '', body, 'ins-latest');
}
/* THE PAGE'S OWN VERBS AND ITS ⋯, as one row. Lifted out of the contract's
   head (26 Sep 2026) so a panel describing something that is not a contract —
   an obligation, a standard, a book, a request — carries the SAME buttons in
   the same row: one builder, so the clothes cannot drift. The markup is the
   head's own, byte for byte. An act may be drawn DEAD with its reason on the
   hover (`disabled` + `title`): a verb that cannot work today still says why,
   the product's own rule for what it can know before the press. */
/* ---- THREE DOORS, ONE ROW, EVERY LIST (owner, 12 Oct 2026) ----
   "these panels on the right ... should always have door to the overview
   page"; the words drop "Open" and keep the name and its mark: Document
   (Home's Document, on Jambo), Negotiation (Jambo's Redlines face beside
   Home's paper), Workspace (Home again: Fill in while details are owed, else
   the paper on Jambo — roomHomeLand; never the room, step 2, 14 Oct 2026).
   Contracts, Negotiations, Approvals & signing, Obligations and Requests all
   draw them from here.
   `lead` names the page's own door (filled) — omitted where the page already
   has a filled verb of its own (Approve, Mark done), one filled button per
   area. Negotiation is never a dead button in live clothes: no negotiation
   yet, or a contract nobody may negotiate, greys it with the reason.
   `doc` swaps the Document door's landing (Obligations lands on its tab).
   Every door acts on ITS contract: a request's or an obligation's panel hands
   the press its own item, not the contract. */
function insNegoDoorState(c){
  let may = { ok: true };
  try { if (typeof negoMayStart === 'function') may = negoMayStart(c) || { ok: true }; } catch (_){ may = { ok: true }; }
  if (!may.ok){
    let why = ''; try { why = (typeof negoMayStartLine === 'function') ? negoMayStartLine(c) : ''; } catch (_){ why = ''; }
    return { ok: false, why: why || i18t('ins_door_nego_none') };
  }
  /* STARTED MEANS A CHANGE IS ON IT (regInsActs' own reading, 26 Sep 2026):
     opening a contract can leave an empty negotiation object behind. */
  const started = !!(c && c.negotiation && Array.isArray(c.changes) && c.changes.length);
  if (!started || typeof openRedlineWorkbench !== 'function') return { ok: false, why: i18t('ins_door_nego_none') };
  return { ok: true, why: '' };
}
function insDoorActs(c, opt){
  if (!c) return [];
  const o = opt || {};
  const ns = insNegoDoorState(c);
  /* THE DOCUMENT DOOR IS GONE (owner, 15 Oct 2026: "we have 2 buttons to the
     same page so document will simply need to be deleted"): it and Workspace
     both landed on Home's paper. Two doors stay: Negotiation · Workspace. */
  /* THE DOORS WEAR WORDS ONLY (rounds 14 and 19 as drawn, owner's "build all
     the gaps", 18 Oct 2026): "Negotiation · Workspace", no mark before them */
  const nego = { k: 'door-nego', door: true, label: i18t('ins_door_nego'),
    disabled: !ns.ok, title: ns.ok ? '' : ns.why, run: () => { if (insNegoDoorState(c).ok) openRedlineWorkbench(c.id, { face: true }); } };   /* Jambo's Redlines face beside Home's paper (stage 3) */
  const ws = { k: 'door-ws', door: true, label: i18t('ins_door_ws'),
    /* THE WORKSPACE OPENS HOME (the overnight work order, step 2, 14 Oct
       2026; was the room, on Details while owed, 12 Oct): Fill in beside the
       paper while anything is owed, else the paper on Jambo's tab — the one
       landing every Workspace door shares (roomHomeLand). The phone, where
       Home has no paper, keeps the room. */
    run: () => { if (typeof roomHomeLand === 'function' && roomHomeLand(c.id)) return;
      openWorkspace(c.id); try { const live = getContract(c.id) || c;
      let left = 0; try { left = (typeof detailsOf === 'function') ? detailsOf(live).left : 0; } catch (_){ left = 0; }
      if (typeof roomGoTab === 'function') roomGoTab(live, left ? 'details' : 'terms'); } catch (_){} } };
  const all = { nego, ws };
  /* the lead door goes first and is filled; the rest keep the drawn order */
  if (o.lead && all[o.lead] && !(o.lead === 'nego' && !ns.ok)) all[o.lead].kind = 'accent';
  const order = o.lead === 'ws' ? ['ws', 'nego'] : ['nego', 'ws'];
  return order.map(k => all[k]);
}
function insActsHtml(list, menuHtml, moreAria){
  /* An act marked `inSub` is drawn in the head's sub line instead (insHeadHtml). */
  const btn = a => {
    /* THE PANEL'S LEAD ACT IS FILLED (Young, 7 Oct 2026, off the HaTi Platform
       mockup: "Open contract" solid, the other doors outlined) — on every
       page this panel is drawn, because the builder is one. `iconEnd` draws
       its mark after the word (the mockup's "Open contract ›"). */
    const cls = a.kind === 'accent' ? 'ui-btn ui-btn-primary ins-lead' : (a.kind === 'plain' ? 'ui-btn ui-btn-plain' : 'ui-btn');
    const ic = n => (n && typeof icon === 'function') ? icon(n, 'w-3.5 h-3.5') : '';
    return `<button type="button" class="${cls}" data-ins-act="${esc(a.k)}"${a.title ? ` title="${esc(a.title)}"` : ''}${a.disabled ? ' disabled' : ''}${a.attrs ? ' ' + a.attrs : ''}>${
      ic(a.icon)}${esc(a.label)}${ic(a.iconEnd)}</button>`;
  };
  /* the page's own verbs, then the three doors in a row of their own
     (insDoorActs) — the ⋯ ends the last row drawn. An act marked `inBody` is
     drawn by the page inside its own section (insActBtnHtml) — Approvals'
     "Your answer" — and is still this panel's to press. */
  const shown = (list || []).filter(a => a && !a.inSub && !a.inBody);
  const acts = shown.filter(a => !a.door).map(btn).join('');
  const doors = shown.filter(a => a.door).map(btn).join('');
  const more = menuHtml ? `<span class="ins-more-wrap">
      <button type="button" class="ui-btn ui-btn-icon ins-more" data-ins-more aria-haspopup="true" aria-expanded="false"
        title="${esc(i18t('reg_more_actions'))}" aria-label="${esc(moreAria || i18t('reg_more_actions'))}">${typeof icon === 'function' ? icon('more') : ''}</button>
      <div class="ins-menu" data-ins-menu hidden>${menuHtml}</div></span>` : '';
  if (doors) return (acts ? `<div class="ins-acts">${acts}</div>` : '') + `<div class="ins-acts ins-doors">${doors}${more}</div>`;
  return (acts || more) ? `<div class="ins-acts">${acts}${more}</div>` : '';
}
/* One act's button, the head's own markup — for a page that draws an act
   inside a section of its own (an act marked `inBody`). */
function insActBtnHtml(a){
  if (!a) return '';
  const cls = a.kind === 'accent' ? 'ui-btn ui-btn-primary ins-lead' : (a.kind === 'plain' ? 'ui-btn ui-btn-plain' : 'ui-btn');
  const ic = n => (n && typeof icon === 'function') ? icon(n, 'w-3.5 h-3.5') : '';
  return `<button type="button" class="${cls}" data-ins-act="${esc(a.k)}"${a.title ? ` title="${esc(a.title)}"` : ''}${a.disabled ? ' disabled' : ''}${a.attrs ? ' ' + a.attrs : ''}>${
    ic(a.icon)}${esc(a.label)}${ic(a.iconEnd)}</button>`;
}
/* One row of the ⋯ menu, in the row menu's own markup (regRowActsHtml), so
   the menus on every page are one menu. `ruby` marks the act that throws
   something away; `says` rides the hover. */
function insMenuItemHtml(a){
  return `<button type="button" data-act="${esc(a.k)}"${a.says ? ` title="${esc(a.says)}"` : ''} class="reg-act${a.ruby ? ' danger' : ''}" style="display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;font:inherit;font-size:var(--t-meta);text-align:left;padding:6px 9px;border-radius:var(--radius);cursor:pointer;color:${a.ruby ? 'var(--st-ruby-fg)' : 'inherit'}">${
    a.icon && typeof icon === 'function' ? icon(a.icon, 'w-3.5 h-3.5') : ''}${esc(a.label)}</button>`;
}
/* ---- EVERY PARTY BUT OURS, LISTED (Young ruled it 26 Sep 2026) ----
   "For contracts that have multiple parties, all the parties apart from the
   owner should be listed on the right panels." The head printed the first
   outside party with a "+1" beside it and kept the rest on the hover, so a
   guarantor or a third signatory never reached the panel a reader was looking
   at — the one screen whose job is to say what a contract is.

   THE READING IS js/parties.js's OWN: partiesTheirs, the list every "which
   party" control in the product offers, and our own side is never on it. It is
   asked only where there IS more than one outside party (partiesMulti, the
   multi-party build's own rule for every control it added), so an ordinary
   two-party contract draws exactly the markup it drew yesterday. EMPTY MEANS
   "draw the counterparty as before", never "there is nobody". */
function insParties(c){
  try {
    if (typeof partiesMulti !== 'function' || typeof partiesTheirs !== 'function' || !partiesMulti(c)) return [];
    return partiesTheirs(c).filter(p => p && p.name);
  } catch (_) { return []; }
}
/* ONE LINE PER PARTY, and the word the paper calls them beside it where one is
   recorded (partyLine's own content — a name and a role and no more). No cap:
   a contract holds at most PARTY_MAX parties and the panel scrolls, and a list
   that stopped short would be the same silence this fixes. Both panels that
   describe a contract draw it — the list's own head here, and Our standards'
   departures panel under the contract's name. */
function insPartiesHtml(list){
  return (list || []).map(p => {
    const line = (typeof partyLine === 'function') ? partyLine(p) : (p.role ? p.name + ' · ' + p.role : p.name);
    return `<span class="ins-cp-p" data-ins-party title="${esc(line)}"><span class="ins-cp-n">${esc(p.name)}</span>${
      p.role ? `<span class="ins-cp-r">${esc(p.role)}</span>` : ''}</span>`;
  }).join('');
}
/* ---- WHAT THIS CONTRACT NEEDS FROM YOU — THE CHECKLIST (Young picked
   "Checklist" by name, 27 Sep 2026, off the "Attention Banner Options" page) ----
   *"a nicely designed banner in the contract's inspector side panel that
   explains what attention is needed. It would sit right under the party names
   and in color."* THE OWNER ASKED FOR THIS BAND BY NAME, and it passes both
   halves of the test the rulebook asks of one: it says what the screen does
   not (the status line says whose move it is, never what the move is or how
   late), and every row is work owed by this reader with the press that does
   it. NOTHING OWED DRAWS NOTHING — the panel is then exactly what it was.

   THE READING IS HOME'S (needsYouOf, js/views/home.js) and so is every door
   (needsYouGo); this draws and decides nothing. It sits under the name block
   — the party names AND the agreement's own name, so the name is never split
   — and above the status line. `skip` names kinds a page already says in its
   own words: the Approvals & signing page's signing panel leads with what
   stands before signing, so its checklist leaves the signature out.

   The row's colour is its urgency (ruby late, amber owed), the frame takes the
   worst row's, and a button wears the platform's one light edge (26 Sep 2026)
   with the row's colour on its word. */
const INS_NEED_VERB = { quiet: 'home_verb_answer', review: 'home_verb_review', look: 'ins_need_v_look', approval: 'ins_need_v_approval', refused: 'ins_need_v_refused', join: 'home_verb_answer',
  note: 'home_verb_answer', suggest: 'home_verb_answer', details: 'det_need_verb', sign: 'home_verb_sign', renewal: 'home_verb_decide' };
const INS_NEED_GO = { quiet: 'ins_need_go_nego', review: 'ins_need_go_nego', look: 'ins_need_go_look', approval: 'ins_need_go_approval', refused: 'ins_need_go_refused', join: 'ins_need_go_desk',
  note: 'ins_need_go_notes', suggest: 'ins_need_go_nego', details: 'det_need_go', sign: 'ins_need_go_sign', renewal: 'ins_need_go_terms' };
/* One row's words: a title, and a line under it as HTML (`sub`) with the same
   words plain on its hover (`plain`) — the line is cut to one line, never the
   fact. Every number is a reading the panel already prints elsewhere: the
   days an ask has waited are the asks table's own count (_insDaysSince), the
   standard is the desk's, what stands before signing is the Signing tab's own
   list and names (signReadiness, signRowTitle). */
function insNeedWords(c, it){
  const late = s => `<span class="late">${esc(s)}</span>`;
  /* A part marked `hover` is said on the hover only: the line under a row is
     one line, and what does not fit is the fact's detail, never the fact. */
  const lineOf = parts => parts.filter(p => p && p.plain).reduce((acc, p) => ({
    sub: p.hover ? acc.sub : (acc.sub ? acc.sub + ' · ' + p.html : p.html),
    plain: acc.plain ? acc.plain + ' · ' + p.plain : p.plain }), { sub: '', plain: '' });
  const bit = (text, isLate, hover) => ({ html: isLate ? late(text) : esc(text), plain: text, hover: !!hover });
  const cp = c.counterparty || i18t('ng_door_them');
  if (it.kind === 'look'){
    const d = _insDaysSince(it.at);
    return Object.assign({ title: i18t(it.review ? 'ins_need_look_review' : 'ins_need_look', { who: it.who || '' }) },
      lineOf([it.note ? bit('\u201c' + it.note + '\u201d', false) : null,
        d == null ? null : bit(i18t('ins_need_waiting', { days: _insDaysWord(d) }), !!it.urgent)]));
  }
  if (it.kind === 'approval') return Object.assign({ title: i18t('ins_need_approval') }, lineOf([bit(i18t('ins_need_approval_sub'))]));
  if (it.kind === 'refused') return Object.assign({ title: i18t('ins_need_refused', { who: it.who || '' }) },
    lineOf([it.why ? bit('\u201c' + it.why + '\u201d', true) : null]));
  if (it.kind === 'quiet'){
    const d = _insDaysSince(it.since);
    let std = 0; try { std = (typeof deskCfg === 'function') ? Number(deskCfg().staleDays || 0) : 0; } catch (_) { std = 0; }
    return Object.assign({ title: i18tn('ins_need_quiet', it.n || 1, { n: it.n || 1, who: cp }) },
      lineOf([d == null ? null : bit(i18t('ins_need_waiting', { days: _insDaysWord(d) }), true),
        std > 0 ? bit(i18t('ins_over', { n: std }), false, true) : null]));
  }
  if (it.kind === 'review'){
    const day = _insDay(it.due);
    return Object.assign({ title: it.n > 0 ? i18tn('ins_need_review', it.n, { n: it.n, who: it.who }) : i18t('ins_need_review_plain', { who: it.who }) },
      lineOf([day ? bit(i18t(it.urgent ? 'ins_need_was_due' : 'ins_need_due', { day }), it.urgent) : bit(i18t('ins_need_no_due'))]));
  }
  if (it.kind === 'join'){
    const when = _insWhen(it.at);
    return Object.assign({ title: i18t('ins_need_join', { who: it.who }) },
      lineOf([it.why ? bit('“' + it.why + '”') : (when ? bit(i18t('ins_need_asked', { day: when })) : null)]));
  }
  if (it.kind === 'note'){
    const day = _insDay(it.due);
    return Object.assign({ title: i18tn('ins_need_note', it.n || 1, { n: it.n || 1, who: it.who }) },
      lineOf([day ? bit(i18t(it.urgent ? 'ins_need_was_due' : 'ins_need_due', { day }), it.urgent)
        : bit(i18t('ins_need_no_due'))]));
  }
  /* A colleague's suggestion (the seat decides, 4 Oct 2026). The count is the
     title and the colleague is the line, because a lead with three of these
     wants the number first and the name second — the shape every row here
     keeps. Never urgent: a suggestion waits on a person, not on a date. */
  if (it.kind === 'suggest'){
    return Object.assign({ title: i18tn('dk_sg_held', it.n || 1) },
      lineOf([it.who ? bit(i18t('dk_sg_theirs', { who: it.who })) : null]));
  }
  if (it.kind === 'details')
    return Object.assign({ title: i18tn('det_to_fill', it.n || 1, { n: it.n || 1 }) }, lineOf([bit(i18t('det_need_sub'))]));
  if (it.kind === 'sign'){
    if (!it.n) return Object.assign({ title: i18t('ins_need_sign_ready') }, lineOf([bit(i18t('ins_need_sign_clear'))]));
    let first = '';
    try {
      const rd = (typeof signReadiness === 'function') ? signReadiness(c, { light: !!(c._light && !c._loaded) }) : null;
      const row = rd && (rd.holds || [])[0];
      if (row) first = (typeof signRowTitle === 'function') ? String(signRowTitle(c, row) || '') : String(row.short || row.label || '');
    } catch (_) { first = ''; }
    return Object.assign({ title: i18tn('ins_need_sign', it.n, { n: it.n }) },
      lineOf([first ? bit(first) : null, first && it.n > 1 ? bit(i18tn('ins_more_asks', it.n - 1, { n: it.n - 1 })) : null]));
  }
  if (it.kind === 'renewal'){
    const day = _insDay(it.dd);
    const inN = it.d === 0 ? i18t('ins_days_today') : i18tn('ins_need_in', it.d, { n: it.d });
    return Object.assign({ title: i18t('ins_need_renew') },
      lineOf([day ? bit(i18t('ins_need_decide_by', { day }), it.urgent) : null, bit(inN, it.urgent)]));
  }
  return { title: '', sub: '', plain: '' };
}
function insNeedsHtml(c, skip){
  if (!c) return '';
  let items = [];
  try { items = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_) { items = []; }
  const leave = new Set(skip || []);
  items = items.filter(x => x && INS_NEED_VERB[x.kind] && !leave.has(x.kind));
  if (!items.length) return '';
  const tone = items.some(x => x.urgent) ? 'ruby' : 'amber';
  const head = i18tn('ins_need_head', items.length, { n: items.length });
  const rows = items.map(it => {
    const w = insNeedWords(c, it);
    return `<div class="ins-need-r is-${it.urgent ? 'ruby' : 'amber'}" data-ins-need-row="${esc(it.kind)}"><i class="ins-need-dot" aria-hidden="true"></i>${typeof icon === 'function' ? icon('alert', 'ins-need-ic') : ''}<div class="ins-need-b"><div class="ins-need-t" title="${esc(w.title)}">${esc(w.title)}</div>${
      w.sub ? `<div class="ins-need-s" title="${esc(w.plain)}">${w.sub}</div>` : ''}</div><button type="button" class="ui-btn ui-btn-sm ins-need-go" data-ins-need="${esc(it.kind)}" title="${esc(i18t(INS_NEED_GO[it.kind]))}">${
      esc(i18t(INS_NEED_VERB[it.kind]))}</button></div>`;
  }).join('');
  return `<section class="ins-need is-${tone}" aria-label="${esc(i18t('ins_need_label'))}"><div class="ins-need-h"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><use href="#i-flag"/></svg><span>${
    esc(head)}</span></div>${rows}</section>`;
}
/* ---- ONE LINE SAYS WHAT IS ASKED (SAP benchmark, owner-approved 9 Oct 2026) ----
   The Approvals page's head: the same reading as the checklist (needsYouOf,
   insNeedWords), said as one sentence with no buttons of its own — the
   panel's acts right under it act on the first thing named. */
function insNeedsLineHtml(c, skip){
  if (!c) return '';
  let items = [];
  try { items = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_) { items = []; }
  const leave = new Set(skip || []);
  items = items.filter(x => x && INS_NEED_VERB[x.kind] && !leave.has(x.kind));
  if (!items.length) return '';
  const words = items.map(it => insNeedWords(c, it));
  const stop = t => /[.?!]$/.test(t) ? t : t + '.';
  /* THE DRAWING'S SENTENCE (SAP benchmark, 9 Oct 2026): "Renew or exit is also
     due by 17 Nov 2026." — the date where the item has one, else just its name. */
  const rest = items.slice(1).map((it, i) => { const w = words[i + 1]; const day = it.dd ? _insDay(it.dd) : '';
    return day ? i18t('ins_need_also_due', { what: w.title, day }) : i18t('ins_need_also_wait', { what: w.title }); }).filter(Boolean);
  const tone = items.some(x => x.urgent) ? 'ruby' : 'amber';
  return `<p class="ins-need-line is-${tone}" data-ins-need-line aria-label="${esc(i18t('ins_need_label'))}">${typeof icon === 'function' ? icon('alert', 'ins-need-line-ic') : ''}<span><b>${
    esc(stop(words[0].title))}</b>${rest.length ? ' ' + esc(rest.join(' ')) : ''}</span></p>`;
}
/* The head: which contract, where it stands, and the page's own verbs. */
function insHeadHtml(c, o){
  let kind = ''; try { kind = (typeof cKind === 'function') ? cKind(c) : ''; } catch (_) { kind = ''; }
  const many = insParties(c);
  const cp = c.counterparty || '—';
  const title = String((c.name && c.name.trim()) || '');
  const status = (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c)
    : (typeof contractStatusChip === 'function' ? contractStatusChip(c) : esc(String(c.status || '')));
  const mv = o.moveSuffix ? (() => { const m = insMove(c);
    if (!m || m.k === 'clear') return '';
    return ` <span class="ins-mv is-${m.k}">· ${esc(i18t(m.k === 'you' ? 'ins_your_move' : 'ins_their_move'))}</span>`; })() : '';
  /* THE SAP BENCHMARK'S HEAD (owner-approved 9 Oct 2026): the counterparty's
     initials beside its name, as on every list row (regAvatarHtml, the one
     builder); a page may draw the stage BESIDE the name (`statusBeside`), hand
     in its own stage (`statusHtml`) or its own "needs you" (`needsHtml`), and
     put one act as a link on the sub line (an act with `inSub`). */
  /* JAMBO'S PANEL (rounds 14 and 15): the eyebrow is the reference and the
     agreement's own name, the party under it with its pill beside it — no
     initials, and the name is not said twice on a sub line. Owed work is its
     own section further down ('needs'), not a band under the name. */
  const jl = !!o._jl;
  const av = (!jl && !many.length && typeof window.regAvatarHtml === 'function') ? window.regAvatarHtml(cp) : '';
  const st = o.statusHtml != null ? o.statusHtml : status;
  const beside = !!o.statusBeside;
  const subAct = (o.acts || []).find(a => a && a.inSub);
  const subLink = subAct ? `<button type="button" class="ui-link ins-sub-act" data-ins-act="${esc(subAct.k)}"${subAct.title ? ` title="${esc(subAct.title)}"` : ''}>${esc(subAct.label)}</button>` : '';
  if (jl) return `<div class="ins-h jl-h">
    <div class="ins-eb"><span class="ins-ref">${esc(window.contractRef ? contractRef(c) : c.id)}</span>${title ? ` · <span title="${esc(title)}">${esc(title)}</span>` : (kind ? ` · ${esc(kind)}` : '')}</div>
    ${many.length
      ? `<h2 class="ins-cp is-many">${insPartiesHtml(many)}</h2>${beside ? `<div class="ins-st">${st}</div>` : ''}`
      : `<h2 class="ins-cp" title="${esc(cp)}"><span class="ins-cp-n">${esc(cp)}</span>${beside && st ? `<span class="ins-st-side jl-st-side">${st}</span>` : ''}</h2>`}
    ${subLink ? `<div class="ins-sub">${subLink}</div>` : ''}
    ${o.needsHtml != null ? o.needsHtml : ''}
    ${beside ? '' : `<div class="ins-st">${st}</div>`}
    ${insActsHtml(o.acts, o.menuHtml, i18t('ins_more', { id: (window.contractRef ? contractRef(c) : c.id) }))}
  </div>`;
  return `<div class="ins-h">
    <div class="ins-eb"><span class="ins-ref">${esc(window.contractRef ? contractRef(c) : c.id)}</span>${kind ? ` · ${esc(kind)}` : ''}</div>
    ${many.length
      ? `<h2 class="ins-cp is-many">${insPartiesHtml(many)}</h2>`
      : `<h2 class="ins-cp${av ? ' has-av' : ''}" title="${esc(cp)}">${av}<span class="ins-cp-n">${esc(cp)}</span>${beside ? `<span class="ins-st-side">${st}</span>` : ''}</h2>`}
    ${many.length && beside ? `<div class="ins-st">${st}</div>` : ''}
    ${(title || subLink) ? `<div class="ins-sub"${title ? ` title="${esc(title)}"` : ''}>${esc(title)}${title && subLink ? ' · ' : ''}${subLink}</div>` : ''}
    ${o.needsHtml != null ? o.needsHtml : insNeedsHtml(c, o.needsSkip)}
    ${beside ? '' : `<div class="ins-st">${st}${mv}</div>`}
    ${insActsHtml(o.acts, o.menuHtml, i18t('ins_more', { id: (window.contractRef ? contractRef(c) : c.id) }))}
  </div>`;
}
/* ---- THE HEAD FOR ANYTHING THAT IS NOT A CONTRACT (26 Sep 2026) ----
   The same five rows in the same classes: what it is (the eyebrow), its name,
   one line about it, where it stands (a dot in its own tone and the words),
   and the verbs. THE TITLE WRAPS TO TWO LINES (`is-item`): an obligation or a
   standard is named in a sentence, and a one-line cut would hide the half
   that says what it is. Every argument but the title is caller-built HTML —
   the caller escapes, because each needs its own mono reference or ruby
   word inside the line. */
const INS_TONE = ['ruby', 'amber', 'steel', 'green', 'gray'];
function insItemHeadHtml(o){
  const opt = o || {};
  const tone = INS_TONE.includes(opt.tone) ? opt.tone : '';
  /* A FACE BESIDE THE NAME (round 19, the person's panel): initials in a
     circle, the name and one line under it, the doors below */
  if (opt.av) return `<div class="ins-h jl-h has-face">
    ${opt.eyebrow ? `<div class="ins-eb">${opt.eyebrow}</div>` : ''}
    <div class="jl-face-row">${opt.av}<div class="jl-face-w"><h2 class="ins-cp is-item" title="${esc(opt.title || '')}">${esc(opt.title || '—')}${opt.pill ? ` <span class="jl-st-side">${opt.pill}</span>` : ''}</h2>${opt.sub ? `<div class="ins-sub is-item">${opt.sub}</div>` : ''}</div></div>
    ${insActsHtml(opt.acts, opt.menuHtml, opt.moreAria)}
  </div>`;
  return `<div class="ins-h">
    ${opt.eyebrow ? `<div class="ins-eb">${opt.eyebrow}</div>` : ''}
    ${opt.statusBeside && opt.status
      ? `<div class="ins-item-row"><h2 class="ins-cp is-item" title="${esc(opt.title || '')}">${esc(opt.title || '—')}</h2><span class="ins-st-side"><span class="reg-stg ins-pill${tone ? ' is-' + tone : ''}"><i aria-hidden="true"></i>${opt.statusShort || opt.status}</span></span></div>`
      : `<h2 class="ins-cp is-item" title="${esc(opt.title || '')}">${esc(opt.title || '—')}</h2>`}
    ${opt.sub ? `<div class="ins-sub is-item">${opt.sub}</div>` : ''}
    ${opt.pill ? `<div class="ins-pill-row"><span class="reg-stg ins-pill${INS_TONE.includes(opt.pillTone) ? ' is-' + opt.pillTone : ''}"><i aria-hidden="true"></i>${opt.pill}</span></div>` : ''}
    ${opt.status && !opt.statusBeside ? `<div class="ins-st">${tone ? `<i class="ins-dot2 is-${tone}" aria-hidden="true"></i>` : ''}<span class="ins-st-t">${opt.status}</span></div>` : ''}
    ${insActsHtml(opt.acts, opt.menuHtml, opt.moreAria)}
  </div>`;
}
/* ---- ONE FILTER CHIP, THE CONTRACTS PAGE'S OWN (26 Sep 2026) ----
   The same markup the register's chips wear — the word, the chosen value
   beside it where it is narrowing, and an invisible <select> across the whole
   chip — so the clothes under `.reg-filterbar` dress it on every page and
   selectMenuSweep draws HaTi's own list for it. `attr`/`key` name the data
   attribute the page's own listener reads. */
function insChipHtml(o){
  const on = String(o.cur) !== String(o.def);
  const pick = ((o.opts || []).find(x => String(x[0]) === String(o.cur)) || [])[1] || '';
  const face = (on && pick) ? `${esc(o.label)} <b>${esc(pick)}</b>` : esc(o.label);
  return `<label class="reg-f reg-chip${on ? ' on' : ''}" title="${esc(o.title || o.label)}"><span class="reg-f-l">${face}</span><select class="reg-chip-sel" ${o.attr}="${esc(o.key)}" title="${esc(o.title || o.label)}">${
    (o.opts || []).map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(o.cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
}
/* ---- THE VIEW TABS, THE CONTRACTS PAGE'S OWN ROW ----
   `.reg-views` / `.reg-vtab`, the count in its pill, a view with nothing in
   it quiet and uncounted — one control on every page. */
function insViewTabsHtml(o){
  return `<div class="reg-views" role="tablist"${o.label ? ` aria-label="${esc(o.label)}"` : ''}>${(o.views || []).map(v => {
    const on = String(v.k) === String(o.cur);
    return `<button type="button" role="tab" class="reg-vtab${on ? ' on' : ''}${!v.n && !on ? ' is-zero' : ''}" ${o.attr}="${esc(v.k)}" aria-selected="${on ? 'true' : 'false'}">${
      esc(v.label)}${v.n ? `<span class="n">${esc(String(v.n))}</span>` : ''}</button>`; }).join('')}</div>`;
}
/* A FACTS GRID FOR ANYTHING: label over value, an em-dash for silence, a
   `wide` fact takes the whole row and may wrap. The contract's own grid
   (insFactsHtml) is this shape with its own six readings. */
function insKvHtml(facts){
  return `<dl class="ins-facts">${(facts || []).filter(Boolean).map(f => {
    const none = !f.v && f.v !== 0;
    return `<div${f.wide ? ' class="wide"' : ''}${f.k ? ` data-ins-fact="${esc(f.k)}"` : ''}><dt>${esc(f.label)}</dt><dd${none ? ' class="none"' : ''}${
      !none && f.plain ? ` title="${esc(f.plain)}"` : ''}>${none ? '—' : f.v}</dd></div>`;
  }).join('')}</dl>`;
}
/* FACTS AS ROWS, THE LABEL ON THE LEFT (rounds 15 and 19: the approval's
   "Why it waits · Asked by · Value · Since last look", the person's "Email ·
   In HaTi · Streams · Named on · Away"): one hairline between rows, a value
   may wrap. Caller-built HTML in `v`, as insKvHtml's. */
function insRowsHtml(facts, cls){
  const list = (facts || []).filter(Boolean);
  if (!list.length) return '';
  return `<dl class="jl-rows${cls ? ' ' + cls : ''}">${list.map(f => {
    const none = !f.v && f.v !== 0;
    return `<div${f.k ? ` data-ins-fact="${esc(f.k)}"` : ''}><dt>${esc(f.label)}</dt><dd${none ? ' class="none"' : (f.tone ? ` class="is-${esc(f.tone)}"` : '')}${
      !none && f.plain ? ` title="${esc(f.plain)}"` : ''}>${none ? '—' : f.v}</dd></div>`;
  }).join('')}</dl>`;
}
/* The whole panel. `o.order` names the sections after the head, in order:
   'lead' (a page's own section, handed in as HTML), 'table', 'facts',
   'reads', 'latest'. */
function insPanelHtml(c, o){
  const opt = o || {};
  /* A CONFIDENTIAL DEAL, TO SOMEBODY OUTSIDE ITS LIST (piece 11): its code
     name, stream and stage — nothing more reached this browser */
  if (c && c._codeNamed) return insHeadHtml(c, opt) + `<div class="ins-sec"><p class="ins-note">${esc(i18t('cn_panel_note'))}</p></div>`
    + insKvHtml([{ k: 'party', label: i18t('cn_panel_party'), v: esc(i18t('cn_panel_party_v')), wide: true }, { k: 'stage', label: i18t('cn_panel_stage'), v: esc(String(c.status || '')) }]);
  let order = opt.order || ['facts', 'table', 'reads', 'latest'];
  /* Jambo's panel says what is owed as its own section, before what he read */
  if (opt._jl && !order.includes('needs')){
    const at = order.indexOf('reads');
    order = at < 0 ? order.concat('needs') : [...order.slice(0, at), 'needs', ...order.slice(at)];
  }
  const part = {
    lead: () => opt.lead || '',
    table: () => insTableHtml(c),
    facts: () => (Array.isArray(opt.facts) ? insKvHtml(opt.facts) : insFactsHtml(c, opt.factKeys)),
    needs: () => jlNeedsHtml(c, opt),
    reads: () => insReadsHtml(c, !!opt._jl),
    latest: () => insLatestHtml(c, opt.latestState),
  };
  return insHeadHtml(c, opt) + order.map(k => (part[k] ? part[k]() : '')).join('');
}
function insPanelEmptyHtml(msg){
  return `<div class="ins-sec ins-empty"><p class="ins-note">${esc(msg || i18t('ins_none'))}</p></div>`;
}

/* ---- PAINTING, AND THE ONE DELEGATED LISTENER ----
   The panel element survives a body repaint and is rebuilt on a full one, so
   the listener is bound once PER ELEMENT and reads what to do off the element
   at press time (_ins) — a listener that captured a contract would act on the
   one that was selected when it was bound. */
/* ---- A PANEL FOR ANY ITEM (26 Sep 2026) ----
   `o.item` beside `o.c`: an obligation, a standard, a book or a request, with
   its head (`o.head`, insItemHeadHtml's options) and its body (`o.body`, the
   sections, caller-built) handed in whole. The listener is the same one: an
   act presses `run(item)` and the ⋯ presses `onMenu(act, item.id)`. `o.host`
   names a panel element other than #ins-panel — the contract's Obligations
   tab draws its panel inside the room, beside the room's own chrome. */
function insPaintPanel(o){
  const opt = o || {};
  const host = (typeof document !== 'undefined') ? document.getElementById(opt.host || 'ins-panel') : null;
  if (!host) return;
  host._ins = opt;
  const c = opt.c || null;
  const item = c ? null : (opt.item || null);
  /* JAMBO'S PANEL (18 Oct 2026): the page's list panel is dressed as his —
     the room's own panels (Obligations tab, Our standards' three) are not */
  const jl = host.id === 'ins-panel' && !opt.plain;
  opt._jl = jl;
  const body = jl ? jlFrame(host, opt) : host;
  if (jl) jlHeadPaint(host, opt, !!(c || item));
  body.innerHTML = c ? insPanelHtml(c, opt)
    : item ? (insItemHeadHtml(opt.head || {}) + (opt.body || ''))
    : jl ? jlWordsHtml(opt) : insPanelEmptyHtml(opt.empty);
  /* his conversation, where it was asked here, is said under his words */
  if (jl && !c && !item && typeof renderAIFeed === 'function' && typeof ai !== 'undefined' && ai && Array.isArray(ai.history) && ai.history.length){
    try { renderAIFeed(!!ai.busy); if (ai.unread){ ai.unread = false; if (typeof updateAIBadge === 'function') updateAIBadge(); } } catch (_){}
  }
  const selId = c ? c.id : (item ? String(item.id == null ? '' : item.id) : '');
  if (selId) host.setAttribute('data-ins-id', selId); else host.removeAttribute('data-ins-id');
  if (!host.dataset.insBound){
    host.dataset.insBound = '1';
    host.addEventListener('click', e => {
      const cur = host._ins || {};
      const cc = cur.c || cur.item;
      const moreBtn = e.target.closest && e.target.closest('[data-ins-more]');
      if (moreBtn){
        e.stopPropagation();
        const menu = host.querySelector('[data-ins-menu]');
        if (!menu) return;
        const open = menu.hidden;
        menu.hidden = !open;
        moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open){ const first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true }); }
        return;
      }
      const inMenu = e.target.closest && e.target.closest('[data-ins-menu] [data-act]');
      if (inMenu && cc){
        e.stopPropagation();
        insCloseMenu(host);
        if (typeof cur.onMenu === 'function') cur.onMenu(inMenu.getAttribute('data-act'), cc.id);
        return;
      }
      /* A CHECKLIST ROW'S BUTTON is the item's own door (needsYouGo), the
         same one for every page that draws the panel. */
      const need = e.target.closest && e.target.closest('[data-ins-need]');
      if (need && cur.c){
        if (typeof needsYouGo === 'function') needsYouGo(need.getAttribute('data-ins-need'), cur.c.id);
        return;
      }
      const act = e.target.closest && e.target.closest('[data-ins-act]');
      if (act && cc){
        const k = act.getAttribute('data-ins-act');
        /* an item panel draws its acts in its head (insItemHeadHtml): they are
           its buttons too (owner's screenshot, 10 Oct 2026 — the Customers
           panel's Open customer and Open on Explorer were drawn and dead) */
        const a = (cur.acts || (cur.head && cur.head.acts) || []).find(x => x.k === k);
        if (a && typeof a.run === 'function') a.run(cc);
      }
    });
    host.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const menu = host.querySelector('[data-ins-menu]');
      if (menu && !menu.hidden){ e.stopPropagation(); insCloseMenu(host);
        const b = host.querySelector('[data-ins-more]'); if (b) b.focus({ preventScroll: true }); }
    });
  }
  if (typeof document !== 'undefined' && !document._insOutsideWired){
    document._insOutsideWired = true;
    /* EVERY PANEL ON THE PAGE, not only #ins-panel: the contract's
       Obligations tab paints its own (26 Sep 2026). */
    document.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('.ins-more-wrap')) return;
      document.querySelectorAll('.ins-panel').forEach(h => insCloseMenu(h));
    });
  }
  /* THE TRAIL IS NOT ON THE LIGHT LIST. The record is read once, and the
     panel repaints only if it is still showing the same contract when the
     answer lands — a reader who arrowed on in the meantime is not thrown
     back. A failure is SAID, never a silent empty "Latest". */
  if (c && insLatest(c) === null && !opt.latestState){
    const api = (typeof API_MODE === 'function') && API_MODE();
    /* ONLY WHAT THE LIST LEFT OUT (26 Sep 2026, the overnight clean-up):
       ensureFull copies the server's whole record over this one, which also
       overwrites any change still waiting to be saved — measured: a category
       set a moment before was gone the instant the panel asked for its trail.
       restoreHeavyFields is the product's own inverse of the list's stripper
       and leaves everything already changed alone. */
    const load = (typeof restoreHeavyFields === 'function') ? restoreHeavyFields
      : (typeof ensureFull === 'function') ? ensureFull : null;
    if (!api || !load){ insRepaintLatest(host, c, 'none'); return; }
    const id = c.id;
    Promise.resolve().then(() => load(c)).then(() => {
      if (!host.isConnected || !host._ins || !host._ins.c || host._ins.c.id !== id) return;
      insRepaintLatest(host, c, insLatest(c) === null ? 'none' : null);
    }).catch(() => {
      if (!host.isConnected || !host._ins || !host._ins.c || host._ins.c.id !== id) return;
      insRepaintLatest(host, c, 'failed');
    });
  }
}
/* Only the Latest section moves when the trail lands, so the reader's place
   in the panel — and a menu they have open — is not disturbed. */
function insRepaintLatest(host, c, st){
  const sec = host.querySelector('.ins-latest');
  if (!sec) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = insLatestHtml(c, st);
  const next = wrap.firstElementChild;
  if (next) sec.replaceWith(next);
}
function insCloseMenu(host){
  const h = host || ((typeof document !== 'undefined') ? document.getElementById('ins-panel') : null);
  if (!h) return;
  const menu = h.querySelector('[data-ins-menu]');
  if (menu && !menu.hidden) menu.hidden = true;
  const b = h.querySelector('[data-ins-more]');
  if (b) b.setAttribute('aria-expanded', 'false');
}

/* ---- THE LIST SIDE: one set of hands for every page that draws a panel ----
   A press selects, a double-click opens, Enter and Space open, the arrows,
   Home and End move the selection. BOUND ONCE PER TBODY and delegated, so a
   body repaint (a page turn, a sort) keeps it; what to do is read off the
   element at press time (_insList), and `data-ins-on` says whether the page
   is in the inspector's shape at all — the register's own handlers stand
   down on the same flag, so a press is answered once. */
function insMarkRow(tbody, rowSel, idOf, id){
  if (!tbody) return;
  tbody.querySelectorAll(rowSel).forEach(r => {
    const on = String(idOf(r)) === String(id);
    r.classList.toggle('is-sel', on);
    if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
    r.setAttribute('tabindex', on ? '0' : '-1');
  });
}
function insListWire(tbody, o){
  if (!tbody) return;
  tbody._insList = o;
  tbody.setAttribute('data-ins-on', '1');
  if (tbody.dataset.insWired) return;
  tbody.dataset.insWired = '1';
  const live = () => (tbody.getAttribute('data-ins-on') === '1') ? tbody._insList : null;
  const rowOf = (L, t) => { const r = t && t.closest && t.closest(L.rowSel); return (r && tbody.contains(r)) ? r : null; };
  /* A control inside the row owns its own press — the family toggle is a
     real button and must not also select the row behind it. */
  const onControl = (row, t) => { const b = t.closest && t.closest('button,a,input,select,textarea,label'); return !!(b && b !== row && row.contains(b)); };
  tbody.addEventListener('click', e => {
    const L = live(); if (!L) return;
    const row = rowOf(L, e.target); if (!row || onControl(row, e.target)) return;
    row.focus({ preventScroll: true });
    L.onSelect(String(L.idOf(row)), row);
  });
  tbody.addEventListener('dblclick', e => {
    const L = live(); if (!L) return;
    const row = rowOf(L, e.target); if (!row || onControl(row, e.target)) return;
    L.onOpen(String(L.idOf(row)), row);
  });
  tbody.addEventListener('keydown', e => {
    const L = live(); if (!L) return;
    const row = rowOf(L, e.target); if (!row) return;
    if (e.target !== row && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const rows = [...tbody.querySelectorAll(L.rowSel)];
    const i = rows.indexOf(row);
    let to = -1;
    if (e.key === 'ArrowDown') to = Math.min(i + 1, rows.length - 1);
    else if (e.key === 'ArrowUp') to = Math.max(i - 1, 0);
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = rows.length - 1;
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); L.onOpen(String(L.idOf(row)), row); return; }
    else return;
    e.preventDefault();
    const next = rows[to];
    if (!next || next === row) return;
    next.focus({ preventScroll: true });
    if (typeof next.scrollIntoView === 'function') next.scrollIntoView({ block: 'nearest' });
    L.onSelect(String(L.idOf(next)), next);
  });
}
/* The page is not in the inspector's shape: the delegated hands stand down. */
function insListOff(tbody){ if (tbody) tbody.setAttribute('data-ins-on', '0'); }

/* ---- A WIDTH THAT CROSSES THE LINE REPAINTS THE PAGE ----
   Observed, not polled: #content changes width when the window does and when
   the side rail folds or floats, and only the first of those fires a resize.
   The page records which shape it painted (data-ins); a repaint happens only
   when the answer now differs, so an ordinary resize costs nothing. */
/* WHICH PAINTER EACH PAGE ANSWERS TO, by name — ONE LIST, so a page that
   takes the Inspector joins it here rather than growing another branch. The
   names are asked through window at the moment of the resize, because not
   every page's module is on every stage. The contract's Obligations tab lives
   inside the room and repaints for whichever contract the room holds. */
const INS_PAGE_REPAINT = {
  register: 'regRepaint',
  approvals: 'renderApprovalsPage',
  customers: 'renderCustomers',
  /* the Directory's wall of faces takes the inspector where it fits (13 Oct 2026) */
  directory: 'renderDirectory',
  obligations: 'obwRepaint',
  intake: 'renderIntake',
  /* Not an inspector: the Advice tab of Requests, whose frame follows this
     line so its tab row sits where the Contracts tab's does (gap F). */
  advice: 'renderAdviceDesk',
  playbook: 'renderPlaybookPage',
  /* the Templates list takes the inspector where it fits (SAP benchmark, batch 2) */
  templates: 'renderTemplatesPage',
  /* the host says its contract and is repainted where it stands: the room's
     pane, or Home's Board drawing the same tab (stage 4, 14 Oct 2026) */
  oblig: page => { const own = page && page.getAttribute('data-ins-cid');
    const c = (typeof getContract === 'function' && typeof state !== 'undefined') ? getContract(own || state.activeId) : null;
    if (c && typeof roomPaintObligations === 'function') roomPaintObligations(c, page && page.id !== 'ws-obligations-pane' ? page : null); },
};
function insWatchWidth(){
  if (typeof document === 'undefined' || document._insWidthWired) return;
  const el = document.getElementById('content');
  if (!el) return;
  document._insWidthWired = true;
  let queued = false;
  const check = () => {
    queued = false;
    const page = document.querySelector('[data-ins-page]');
    if (!page) return;
    const was = page.getAttribute('data-ins') === '1';
    if (insFits() === was) return;
    const k = page.getAttribute('data-ins-page');
    try {
      const p = INS_PAGE_REPAINT[k];
      if (typeof p === 'function') p(page);
      else if (p && typeof window[p] === 'function') window[p]();
    } catch (err) { if (typeof console !== 'undefined') console.warn('inspector: repaint on resize failed', err); }
  };
  const later = () => { if (queued) return; queued = true;
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f => setTimeout(f, 16)))(check); };
  try { if (typeof ResizeObserver === 'function'){ new ResizeObserver(later).observe(el); return; } } catch (_) {}
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', later);
}

/* ═══ JAMBO'S PANEL BESIDE THE LISTS (owner's yes, 18 Oct 2026: "build all the
   gaps" — rounds 14, 15, 16, 19, 20 and 21 of the redesign draw it beside
   every list) ═════════════════════════════════════════════════════════════
   The list inspector, dressed as Jambo's panel. THE CLOTHES FOLLOW THE
   BUILDER: every page that draws #ins-panel gets it at once.
   · THE HEAD: his face on his tab (the Counter's count on it, as beside a
     paper), a word for what the panel holds ("Negotiation", "Approval",
     "Person"…), "‹ Jambo" back to his own words while it holds a row, and
     "›" folding it to the window's edge (pressed again it opens).
   · THE BODY: the chosen row's panel, as each page builds it; with nothing
     chosen (let go by ‹ Jambo, his tab or a question; or a page that arrives
     so) Jambo says the page in words from the page's OWN counts — no AI call,
     said so — with chips that are the page's own doors; under them his
     conversation, when one was asked here (ai.js says it in #jl-feed).
   · THE FOOT: the ask box and the hint line (jamboHintHtml). Words read the
     way the Counter's box reads them (one reading: a place word or Jambo's
     map opens its page at once; a card is his; anything else is a question
     for Jambo, said here) — what a question costs rides the box's hover.
   · WHERE IT STANDS: at the window's right edge from under the desk tabs to
     the foot — Home's panel's own place and width (IG_DOCK_W0) — and the page
     beside it takes the rest (index.html, ".ins-panel.is-jambo"). */
const JL_W = 380, JL_FOLDED = 46;
const JL_FOLD_KEY = 'hati.v1.jlFold';
let _jlFold = null;
function jlFolded(){
  if (_jlFold === null){ try { _jlFold = localStorage.getItem(JL_FOLD_KEY) === '1'; } catch (_){ _jlFold = false; } }
  return !!_jlFold;
}
function jlFoldSet(on){
  _jlFold = !!on;
  try { if (on) localStorage.setItem(JL_FOLD_KEY, '1'); else localStorage.removeItem(JL_FOLD_KEY); } catch (_){}
  const host = jlHost(); if (host) host.classList.toggle('is-folded', !!on);
  jlLayout();
}
/* the dressed panel on screen, or null */
function jlHost(){
  if (typeof document === 'undefined') return null;
  const h = document.getElementById('ins-panel');
  return (h && h.isConnected && h.classList.contains('is-jambo')) ? h : null;
}
/* JAMBO'S BOX ON SCREEN: the panel (or Import's) that holds #jl-q, only
   while the reader can see it — folded counts (its strip is his door), a
   panel in a hidden tab does not (Our paper's Templates tab sits hidden
   under the book): the bar's Jambo door and every openAI(prefill) ask this,
   so a press never lands in a box nobody can see */
function jlOnScreen(){
  if (typeof document === 'undefined') return null;
  const shown = host => {
    if (!host || (typeof host.closest === 'function' && host.closest('[hidden]'))) return false;
    try { return typeof host.getClientRects !== 'function' || !!host.getClientRects().length; } catch (_){ return false; }
  };
  for (const q of Array.from(document.querySelectorAll('#jl-q'))){
    const host = q.isConnected ? (q.closest('.ins-panel.is-jambo') || q.closest('#mig-side')) : null;
    if (shown(host)) return host;
  }
  return null;
}
/* the column the panel takes from the page — 0 where it is not drawn */
function jlReserved(){
  const h = jlHost(); if (!h) return 0;
  /* a panel in a hidden tab takes nothing (Our paper's Templates tab) */
  if (typeof h.closest === 'function' && h.closest('[hidden]')) return 0;
  return h.classList.contains('is-folded') ? JL_FOLDED : JL_W;
}
/* the panel's top is the page head's top: under the bar and the desk tabs */
function jlLayout(){
  const h = jlHost(); if (!h) return;
  const ph = document.getElementById('page-head');
  let top = 0; try { top = ph ? Math.round(ph.getBoundingClientRect().top) : 0; } catch (_){ top = 0; }
  if (top > 0) h.style.setProperty('--jl-top', top + 'px');
}
/* HIS COUNT, the Counter's own number (what needs you), read at most once a
   second — the walk is the book's, and a panel repaints on every row press */
let _jlCnt = { at: 0, n: 0 };
function jlCount(){
  const now = Date.now();
  if (now - _jlCnt.at > 1500){ let n = 0; try { n = (typeof counterNeedsCount === 'function') ? Number(counterNeedsCount()) || 0 : 0; } catch (_){ n = 0; } _jlCnt = { at: now, n }; }
  return _jlCnt.n;
}
function jlHeadHtml(){
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 20, 'pd-tab-face').replace('<img', '<img data-ink-exempt') : '';
  const name = i18t('pd_tab_copilot');
  const back = i18t('pd_back_jambo');
  const fold = i18t('int_collapse_panel');
  return `<div class="jl-head">
    <button type="button" class="pd-tab on jl-tab" data-jl-home title="${esc(name)}"><span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${face}</span><span class="pd-tab-n is-warn" data-jl-n hidden></span></span><span class="pd-tab-w">${esc(name)}</span></button>
    <span class="jl-word" data-jl-word></span>
    <span class="jl-sp"></span>
    <button type="button" class="pd-back jl-back" data-jl-back title="${esc(back)}" aria-label="${esc(back)}" hidden><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg>${esc(name)}</button>
    <button type="button" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon jl-fold" data-jl-fold title="${esc(fold)}" aria-label="${esc(fold)}">${typeof icon === 'function' ? icon('chevR') : '›'}</button>
  </div>`;
}
/* the folded strip: his face, his count, his name — and it opens */
function jlDoorHtml(){
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 28, 'igd-door-face').replace('<img', '<img data-ink-exempt') : '';
  const open = i18t('int_open_panel');
  return `<button type="button" class="igd-door jl-door" data-jl-door title="${esc(open)}" aria-label="${esc(open)}"><span class="igd-door-i">${face}<span class="pd-tab-n is-warn" data-jl-n hidden></span></span><span class="igd-door-w">${esc(i18t('pd_tab_copilot'))}</span><svg class="igd-door-o" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg></button>`;
}
/* THE ASK BOX AND ITS HINT — one builder for the panel beside a list and for
   Import's (#mig-side). One box per page, so its ids are fixed. */
function jlAskHtml(o){
  const opt = o || {};
  const ph = opt.placeholder || i18t('jl_ph_any');
  const cost = i18t('jl_ask_cost');
  return `<div class="jl-foot">
    <form class="jl-ask" data-jl-ask autocomplete="off" title="${esc(cost)}">
      <div class="ca-pop jl-pop" data-jl-pop hidden></div>
      <div class="jl-box"><input id="jl-q" type="text" maxlength="400" spellcheck="false" placeholder="${esc(ph)}" aria-label="${esc(ph)}"><button type="submit" class="ui-btn ui-btn-primary ui-btn-sm jl-send" data-jl-send title="${esc(cost)}">${esc(i18t('int_ask'))}</button></div>
    </form>
    ${typeof jamboHintHtml === 'function' ? jamboHintHtml() : ''}
  </div>`;
}
/* The frame is built ONCE per panel element, so the words in the box and its
   caret survive every row press; only the body and the head's word move. */
function jlFrame(host, opt){
  host.classList.add('is-jambo');
  host.classList.toggle('is-folded', jlFolded());
  let body = host.querySelector(':scope > .jl-body');
  if (!body){
    host.innerHTML = `${jlDoorHtml()}${jlHeadHtml()}<div class="jl-body" data-jl-body></div>${jlAskHtml({ placeholder: opt.jlPh })}`;
    body = host.querySelector(':scope > .jl-body');
  }
  const inp = host.querySelector('#jl-q');
  const ph = opt.jlPh || i18t('jl_ph_any');
  if (inp && inp.getAttribute('placeholder') !== ph){ inp.setAttribute('placeholder', ph); inp.setAttribute('aria-label', ph); }
  jlLayout();
  return body;
}
function jlHeadPaint(host, opt, holds){
  const w = host.querySelector('[data-jl-word]');
  const word = holds ? (opt.jlWord || i18t(opt.c ? 'jl_w_contract' : 'jl_w_item')) : (opt.jlHome || jlPageWord());
  if (w){ w.textContent = word; w.setAttribute('title', word); }
  const b = host.querySelector('[data-jl-back]'); if (b) b.hidden = !holds;
  const n = jlCount();
  host.querySelectorAll('[data-jl-n]').forEach(el => { el.hidden = !n; el.textContent = n > 99 ? '99+' : String(n); });
}
/* A DAY SAID THE WAY A PERSON SAYS IT (rounds 15 and 19: "back Friday",
   "away until Fri"): the weekday within the coming week, else the date */
function jlDayWord(iso, short){
  const s = String(iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(s + 'T12:00:00'), t = new Date(); t.setHours(12, 0, 0, 0);
  const days = Math.round((d - t) / 864e5);
  if (days >= 0 && days <= 6){
    try { return d.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { weekday: short ? 'short' : 'long' }); } catch (_){}
  }
  return (typeof regDotDate === 'function') ? regDotDate(s) : s;
}
/* "16–23 Oct" — a span of days said once: the month and year only where they change */
function jlDayRange(from, to){
  const a = new Date(String(from || '').slice(0, 10) + 'T12:00:00'), b = new Date(String(to || '').slice(0, 10) + 'T12:00:00');
  if (isNaN(a) || isNaN(b)) return [from, to].filter(Boolean).join('–');
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  const fmt = (d, o) => { try { return d.toLocaleDateString(loc, o); } catch (_){ return d.toISOString().slice(0, 10); } };
  const yr = new Date().getFullYear();
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth())
    return `${a.getDate()}–${fmt(b, Object.assign({ day: 'numeric', month: 'short' }, b.getFullYear() !== yr ? { year: 'numeric' } : {}))}`;
  const y = (a.getFullYear() !== b.getFullYear() || b.getFullYear() !== yr) ? { year: 'numeric' } : {};
  return `${fmt(a, Object.assign({ day: 'numeric', month: 'short' }, y))}–${fmt(b, Object.assign({ day: 'numeric', month: 'short' }, y))}`;
}
/* the away rule the reader may see for a colleague: their own, or one the
   reader stands in for (state.away — the server sends no one else's) */
function jlAwayOf(personId){
  if (personId == null || personId === '' || typeof state === 'undefined' || !state || !state.away) return null;
  const a = state.away, me = (typeof currentUser === 'function') ? currentUser() : null;
  if (me && String(me.id) === String(personId)) return a.mine || null;
  return (Array.isArray(a.covering) ? a.covering : []).find(r => r && String(r.userId) === String(personId)) || null;
}
/* the page's own name, for the head while Jambo speaks */
function jlPageWord(){
  /* the name the bar gives the page (deskPageName, main's "‹ · HA · the
     page's name"), then the page's own title — never his own name twice */
  try { const d = (typeof deskPageName === 'function') ? String(deskPageName() || '').trim() : ''; if (d) return d; } catch (_){}
  try { const v = (typeof state !== 'undefined' && state) ? state.view : '';
    const m = (typeof commandMeta === 'function') ? commandMeta(v) : null; if (m && m[0]) return String(m[0]); } catch (_){}
  return i18t('pd_tab_copilot');
}
/* how many rows the list beside the panel shows — the default words' count */
function jlRowCount(){
  if (typeof document === 'undefined') return 0;
  const tb = document.querySelector('[data-ins-on="1"]');
  const L = tb && tb._insList;
  try { return (tb && L && L.rowSel) ? tb.querySelectorAll(L.rowSel).length : 0; } catch (_){ return 0; }
}
/* ---- JAMBO'S OWN WORDS: the page said from its own counts ----
   `opt.jlSay()` → { lines: [html | {html, src}], src, chips: [{label, run}] };
   a page that says nothing of its own gets the list's count. The lines are
   the caller's escaped HTML. */
let _jlChips = [];
function jlWordsHtml(opt){
  let say = null; try { say = (typeof opt.jlSay === 'function') ? opt.jlSay() : null; } catch (_){ say = null; }
  if (!say || !Array.isArray(say.lines) || !say.lines.length){
    const n = jlRowCount();
    /* "Counted from the list" only under a count: the page's own "choose
       one" words were counted from nothing (check A1 #2) */
    say = Object.assign({}, say || {}, { lines: [esc(n ? i18tn('jl_say_rows', n, { n }) : (opt.empty || i18t('ins_none')))] }, n ? {} : { src: false });
  }
  _jlChips = Array.isArray(say.chips) ? say.chips.filter(c => c && c.label && typeof c.run === 'function') : [];
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 24, 'jl-say-face').replace('<img', '<img data-ink-exempt') : '';
  const src = say.src === false ? '' : (say.src || i18t('jl_src_list'));
  const lines = say.lines.map((l, i) => {
    const html = typeof l === 'string' ? l : (l && l.html) || '';
    const under = (l && typeof l === 'object' && l.src) ? l.src : (i === 0 ? src : '');
    return `<div class="jl-say">${face}<div class="jl-bub">${html}</div></div>${under ? `<p class="jl-src">${esc(under)}</p>` : ''}`;
  }).join('');
  /* `say.after`: the caller's own escaped HTML under the chips — round 16's
     "Jambo may change my calendar", the Calendar's own setting */
  return `<div class="jl-words" data-jl-words>${lines}${_jlChips.length ? `<div class="jl-chips">${_jlChips.map((c, i) =>
    `<button type="button" class="jl-chip" data-jl-chip="${i}"${c.title ? ` title="${esc(c.title)}"` : ''}>${esc(c.label)}</button>`).join('')}</div>` : ''}${say.after || ''}</div>
    <div id="jl-feed" class="jl-feed" aria-live="polite"></div>`;
}
/* ---- NEEDS YOU, AS ITS OWN SECTION (round 14: "Answer 2 redlines · Clause 7
   Liability cap · clause 11 Payment terms · Answer") ----
   The page's own rows first (`opt.jlNeedRows(c)`: {k, title, sub, plain,
   verb, urgent, run, skips}), then the checklist's (needsYouOf, said by
   insNeedWords, pressed through needsYouGo) less what a page row already says. */
let _jlNeedRuns = {};
function jlNeedsHtml(c, opt){
  const o = opt || {};
  let rows = []; try { rows = (typeof o.jlNeedRows === 'function') ? (o.jlNeedRows(c) || []) : []; } catch (_){ rows = []; }
  rows = rows.filter(r => r && r.title);
  let items = []; try { items = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_){ items = []; }
  const leave = new Set([...(o.needsSkip || []), ...rows.flatMap(r => r.skips || [])]);
  items = items.filter(x => x && INS_NEED_VERB[x.kind] && !leave.has(x.kind));
  _jlNeedRuns = {};
  if (!rows.length && !items.length) return '';
  const row = (attr, tone, title, sub, plain, btn) => `<div class="jl-need-r is-${tone}" ${attr}><i class="jl-need-dot" aria-hidden="true"></i><div class="jl-need-b"><div class="jl-need-t" title="${esc(title)}">${esc(title)}</div>${
    sub ? `<div class="jl-need-s" title="${esc(plain || '')}">${sub}</div>` : ''}</div>${btn}</div>`;
  const html = rows.map(r => {
    _jlNeedRuns[r.k] = r.run;
    return row(`data-jl-need-row="${esc(r.k)}"`, r.urgent ? 'ruby' : 'amber', r.title, r.sub || '', r.plain || '',
      `<button type="button" class="ui-btn ui-btn-sm jl-need-go" data-jl-need="${esc(r.k)}"${r.go ? ` title="${esc(r.go)}"` : ''}>${esc(r.verb || i18t('home_verb_answer'))}</button>`);
  }).concat(items.map(it => {
    const w = insNeedWords(c, it);
    return row(`data-ins-need-row="${esc(it.kind)}"`, it.urgent ? 'ruby' : 'amber', w.title, w.sub, w.plain,
      `<button type="button" class="ui-btn ui-btn-sm jl-need-go" data-ins-need="${esc(it.kind)}" title="${esc(i18t(INS_NEED_GO[it.kind]))}">${esc(i18t(INS_NEED_VERB[it.kind]))}</button>`);
  })).join('');
  return insSecHtml(i18t('jl_need_head'), '', `<div class="jl-need">${html}</div>`, 'jl-needs');
}
/* ---- LAND ON IT (main, 18 Oct 2026): every door Jambo's panel beside a
   list adds names ONE target and arrives on it through the one lander
   (landOn) — opened, in view, lit, its main button ready, nothing pressed.
   The target is read at press time, after the door has opened its page. */
const JL_LAND = {
  /* a row of the page in front, by its id */
  row: id => () => { const q = String(id || ''); if (!q) return null;
    return [...document.querySelectorAll('[data-ap-row],[data-row],[data-ins-row],[data-ik-row],[data-ob-key]')]
      .find(r => [r.getAttribute('data-ap-row'), r.getAttribute('data-row'), r.getAttribute('data-ins-row'), r.getAttribute('data-ik-row'), r.getAttribute('data-ob-key')].includes(q)) || null; },
  /* the list's first row, after a chip narrowed it */
  first: () => document.querySelector('#reg-tbody tr[data-row], .ap-table tr[data-ap-row], #content tbody tr[data-ins-row]:not([hidden])'),
  /* Redlines beside the paper: the first card (what waits on you leads) */
  redlines: '#pd-redface [data-nego-card]',
  /* Before you sign: an approval's card, else the Sign button, else the stop
     on the road where it stands */
  sign: () => document.querySelector('#pd-signface #sa-card') || document.querySelector('#pd-signface #sign-btn')
    || document.querySelector('#pd-signface .pd-road-stop.is-now') || document.querySelector('#sa-card'),
  /* the road's stop where it stands (who signs next) */
  road: () => document.querySelector('#pd-signface .pd-road-stop.is-now') || document.querySelector('#pd-signface [data-pd-road]'),
  /* Home's paper: its line names the contract */
  paper: '.ig-line-id',
  /* the Contracts place narrowed: its first paper or row */
  list: () => document.querySelector('#ct-place .igw-card, #ct-place tr[data-row], #reg-tbody tr[data-row]'),
};
function jlLand(k, arg){
  const t = JL_LAND[k]; if (!t || typeof landOn !== 'function') return null;
  return landOn(typeof t === 'function' && t.length ? t(arg) : t, { block: 'nearest' });
}
/* ---- LET THE ROW GO: Jambo's own words ---- */
function jlToWords(){
  const host = jlHost(); if (!host || !host._ins) return false;
  const cur = host._ins;
  /* the seat the page's list chose by (a page that paints without naming it) */
  const seat = cur.seat || _insLastSeat;
  if (seat) insLetGo(seat);
  document.querySelectorAll('[data-ins-on="1"]').forEach(tb => tb.querySelectorAll('.is-sel').forEach(r => { r.classList.remove('is-sel'); r.removeAttribute('aria-current'); }));
  insPaintPanel(Object.assign({}, cur, { c: null, item: null }));
  return true;
}
/* the contract the panel holds, where it holds one */
function jlHeldContract(){
  const host = jlHost(); const cur = host && host._ins;
  if (cur && cur.c) return cur.c;
  if (cur && cur.jlCid && typeof getContract === 'function') return getContract(cur.jlCid) || null;
  return null;
}
/* ---- THE ASK: ONE READING, THE COUNTER'S ----
   0 a word that needs one contract ("redline", "sign", "share"…) takes the
     row the panel holds;
   1 THE ONE READER every Jambo box asks first (caAskAnywhere, MAIN 18 Oct
     2026): a place word opens its page; a draft from a sentence opens the
     one form; a send, a job, a booking go where they are done — all free;
   2 Jambo's map (jmRead): a page at once; "which did you mean?" is his card,
     said here; an act that waits for a press goes where his cards live;
   3 THE COUNTER'S FREE READINGS (check A1 #2): what the Board's own reader
     answers free — a figure, a party or contract by name, "ending in 90
     days" — is handed to the Board, as the Counter's box hands it
     (jlBoardReads → caHandHome), never a call;
   4 anything else is a question for Jambo, said here (aiAskWords, one call,
     its cost on the box's hover before the press). */
function jlBoardReads(t){
  if (typeof hbAskReadingOf !== 'function') return false;
  let A = null; try { A = hbAskReadingOf(t, 'board'); } catch (_){ A = null; }
  return !!(A && A.road === 'free');
}
function jlAsk(text){
  const t = String(text || '').trim(); if (!t) return false;
  const cards = (typeof JM_CARD_PLACES !== 'undefined') ? JM_CARD_PLACES : ['share', 'draft', 'help', 'next'];
  let a = null; try { a = (typeof caReadPlace === 'function') ? caReadPlace(t) : null; } catch (_){ a = null; }
  if (a && a.kind === 'go' && a.missing){
    const held = jlHeldContract();
    if (held){
      a.cid = held.id; a.missing = false;
      if (!cards.includes(a.place) && typeof caGo === 'function' && caGo(a)) return 'go';
      if (typeof jmRunAct === 'function' && jmRunAct(a, t)) return 'card';
    }
  }
  let took = false; try { took = (typeof caAskAnywhere === 'function') ? caAskAnywhere(t) : false; } catch (_){ took = false; }
  if (took) return took === 'cal' ? 'cal' : 'go';
  if (!a){
    let m = null; try { m = (typeof jmRead === 'function') ? jmRead(t) : null; } catch (_){ m = null; }
    if (m && m.kind === 'map'){ jlMapCard(t, m); return 'card'; }
    if (m && m.kind === 'go' && !m.missing && !cards.includes(m.place) && typeof caGo === 'function' && caGo(m)) return 'go';
    if (m && typeof jmRunAct === 'function' && jmRunAct(m, t)) return 'card';
  }
  if (jlBoardReads(t) && typeof caHandHome === 'function' && caHandHome(t, null)) return 'board';
  jlToWords();
  if (typeof aiAskWords === 'function'){ aiAskWords(t); return 'model'; }
  if (typeof openAI === 'function'){ openAI(t); return 'model'; }
  return false;
}
/* "Which of these did you mean?" — the map's own card (jm_pick_title, the
   tasks' own names), said in the one conversation; a press is the task's act */
function jlMapCard(q, m){
  jlToWords();
  if (typeof aiPush !== 'function' || typeof renderAIFeed !== 'function') return;
  const btns = (m.picks || []).map((k, n) => `<button type="button" class="ui-btn ui-btn-sm${n === 0 ? ' ui-btn-primary' : ''}" data-jl-pick="${esc(k)}" data-jl-q="${esc(q)}">${esc(i18t('jm_t_' + k))}</button>`).join('');
  aiPush('user', { text: esc(q), raw: q });
  aiPush('assistant', { text: `<div>${esc(i18t('jm_pick_title'))}</div>`, cards: `<div class="ca-card jl-card" data-jm-card><div class="ca-acts">${btns}</div></div>` });
  renderAIFeed();
}
/* the bar's Jambo door beside a list: the panel opens, the words are put ready */
function jlFocus(prefill){
  const host = jlOnScreen();
  if (!host) return false;
  if (host.classList.contains('is-folded')) jlFoldSet(false);
  const inp = host.querySelector('#jl-q'); if (!inp) return false;
  if (prefill){ inp.value = String(prefill); }
  try { inp.focus({ preventScroll: true }); const n = inp.value.length; inp.setSelectionRange(n, n); } catch (_){}
  return true;
}
/* ---- "/" — THE PLACES, MOST USED FIRST (the Counter's own list) ---- */
let _jlPop = null;
function jlPopRead(inp){
  const m = /^\s*\/([\w\-åäöÅÄÖ'’]*)$/.exec(String(inp.value || ''));
  if (!m || typeof caSlashRows !== 'function'){ jlPopClose(); return; }
  const held = !!jlHeldContract();
  const one = new Set((typeof CA_PLACES !== 'undefined' ? CA_PLACES : []).filter(p => p.need === 'one').map(p => p.k));
  const rows = caSlashRows(m[1].toLowerCase(), { max: 99 }).filter(r => held || !one.has(r.k)).slice(0, 8);
  if (!rows.length){ jlPopClose(); return; }
  _jlPop = { rows, on: Math.min((_jlPop && _jlPop.on) || 0, rows.length - 1) };
  jlPopPaint();
}
function jlPopPaint(){
  const el = document.querySelector('[data-jl-pop]'); if (!el || !_jlPop) return;
  el.innerHTML = `<h5>${esc(i18t('hb_pop_places'))}</h5><div role="listbox">${_jlPop.rows.map((r, i) =>
    `<div class="ca-opt${i === _jlPop.on ? ' on' : ''}" role="option" aria-selected="${i === _jlPop.on}" data-jl-pop-row="${i}"><span class="who"><b>${esc(r.word)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span></div>`).join('')}</div><p class="ca-hint">${esc(i18t('hb_pop_keys'))}</p>`;
  el.hidden = false;
}
function jlPopClose(){ _jlPop = null; const el = document.querySelector('[data-jl-pop]'); if (el){ el.hidden = true; el.innerHTML = ''; } }
function jlPopTake(i){
  const r = _jlPop && _jlPop.rows[i]; if (!r) return;
  const q = document.getElementById('jl-q'); if (q) q.value = '';
  jlPopClose(); jlAsk(r.word);
}
/* ---- PRESSES, ONE LISTENER EACH, ARMED ONCE AT LOAD; each reads the live
   panel at press time ---- */
if (typeof document !== 'undefined' && typeof window !== 'undefined' && !window._jlWired){
  window._jlWired = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    let el;
    if ((el = t.closest('[data-jl-pop-row]'))){ jlPopTake(Number(el.getAttribute('data-jl-pop-row'))); return; }
    if (_jlPop && !t.closest('.jl-ask')) jlPopClose();
    if ((el = t.closest('[data-jl-pick]'))){
      const k = el.getAttribute('data-jl-pick'), q = el.getAttribute('data-jl-q') || '';
      const card = el.closest('[data-jm-card]'); if (card) card.querySelectorAll('button').forEach(b => { b.disabled = true; });
      const act = (typeof jmActOf === 'function') ? jmActOf(k, q) : null;
      if (act && typeof jmRunAct === 'function') jmRunAct(act, q);
      return;
    }
    const host = t.closest('.ins-panel.is-jambo');
    if (!host) return;
    if ((el = t.closest('[data-jl-fold]'))){ jlFoldSet(true); return; }
    if ((el = t.closest('[data-jl-door]'))){ jlFoldSet(false); return; }
    if ((el = t.closest('[data-jl-back]')) || (el = t.closest('[data-jl-home]'))){
      const cur = host._ins || {};
      if (cur.c || cur.item) jlToWords(); else { const q = host.querySelector('#jl-q'); if (q) try { q.focus({ preventScroll: true }); } catch (_){} }
      return;
    }
    if ((el = t.closest('[data-jl-chip]'))){ const ch = _jlChips[Number(el.getAttribute('data-jl-chip'))]; if (ch) ch.run(); return; }
    if ((el = t.closest('[data-jl-need]'))){ const run = _jlNeedRuns[el.getAttribute('data-jl-need')]; if (typeof run === 'function') run(); return; }
  });
  document.addEventListener('submit', e => {
    const f = e.target && e.target.closest ? e.target.closest('[data-jl-ask]') : null; if (!f) return;
    e.preventDefault();
    const q = f.querySelector('#jl-q'); if (!q) return;
    if (_jlPop){ jlPopTake(_jlPop.on); return; }
    const v = q.value; if (!String(v || '').trim()) return;
    q.value = ''; jlPopClose(); jlAsk(v);
  });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'jl-q') jlPopRead(e.target); });
  document.addEventListener('keydown', e => {
    if (!e.target || e.target.id !== 'jl-q' || !_jlPop) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault();
      const n = _jlPop.rows.length; _jlPop.on = (_jlPop.on + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; jlPopPaint(); return; }
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); jlPopClose(); }
  });
  window.addEventListener('resize', () => { try { jlLayout(); } catch (_){} });
}

Object.assign(window, { INS_MIN_W, INS_ASKS_MAX, INS_LATEST, INS_READ_TONE,
  insForce, insFits, insSelected, insSelect, insPick, insFacts, insMove, insMoveCellHtml,
  insTable, insReads, insLatest, insSecHtml, insFactsHtml, insTableHtml, insReadsHtml, insLatestHtml,
  insHeadHtml, insParties, insPartiesHtml, insNeedsHtml, insNeedsLineHtml, insNeedWords, INS_NEED_VERB, INS_NEED_GO, insPanelHtml, insPanelEmptyHtml, insPaintPanel, insCloseMenu, insMarkRow, insListWire,
  insListOff, insWatchWidth, insActsHtml, insDoorActs, insNegoDoorState, insMenuItemHtml, insItemHeadHtml, INS_TONE, insKvHtml, insChipHtml, insViewTabsHtml,
  INS_PAGE_REPAINT, insLetGo, insLetGone, insActBtnHtml, insRowsHtml, JL_READ_ORDER, jlReadsHtml, jlReadSaid,
  JL_W, JL_FOLDED, jlFolded, jlFoldSet, jlHost, jlOnScreen, jlReserved, jlLayout, jlCount, jlAskHtml, jlFrame, jlWordsHtml, jlNeedsHtml,
  JL_LAND, jlLand, jlPageWord, jlToWords, jlHeldContract, jlBoardReads, jlAsk, jlMapCard, jlFocus, jlPopRead, jlPopClose, jlPopTake, jlDayWord, jlDayRange, jlAwayOf });
