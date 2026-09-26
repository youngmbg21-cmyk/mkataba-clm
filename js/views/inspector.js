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
  const w = el ? el.clientWidth : 0;
  return w >= INS_MIN_W;
}

/* WHICH ROW IS SELECTED, per seat, per sitting, in memory. Stored would make
   two people's screens — or one person's two tabs — open on different
   contracts for no reason they could see. */
const _insSel = {};
function insSelected(seat){ return _insSel[seat] || null; }
function insSelect(seat, id){ _insSel[seat] = id ? String(id) : null; }
/* The selected id if it is still in the list on screen, else the first row.
   A filter that takes the chosen contract off the list must not leave the
   panel describing a contract the reader can no longer see. */
function insPick(seat, ids){
  const list = (ids || []).map(String).filter(Boolean);
  const cur = _insSel[seat];
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
  if (!c || !Array.isArray(c.audit)) return null;
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
function insFactsHtml(c){
  return `<dl class="ins-facts">${insFacts(c).map(f => {
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
function insReadsHtml(c){
  const rows = insReads(c);
  if (!rows.length) return '';
  const tick = (typeof icon === 'function') ? icon('check2', '', 2.4) : '';
  return insSecHtml(i18t('ins_read'), '', `<div class="ins-read">${rows.map(r => {
    const tone = INS_READ_TONE[r.state] || '';
    return `<i class="ins-dot${tone ? ' is-' + tone : ''}" aria-hidden="true">${tone === 'green' ? tick : ''}</i><span data-ins-read="${esc(r.k)}"><b>${esc(r.name)}</b> · ${esc(r.said)}</span>`;
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
/* The head: which contract, where it stands, and the page's own verbs. */
function insHeadHtml(c, o){
  let kind = ''; try { kind = (typeof cKind === 'function') ? cKind(c) : ''; } catch (_) { kind = ''; }
  let py = '', pyAll = '';
  try { if (typeof partiesLead === 'function'){ const L = partiesLead(c); if (L && L.more){ py = `+${L.more}`; pyAll = L.all.join(' · '); } } } catch (_) {}
  const cp = c.counterparty || '—';
  const title = String((c.name && c.name.trim()) || '');
  const status = (typeof contractStatusDotHtml === 'function') ? contractStatusDotHtml(c)
    : (typeof contractStatusChip === 'function' ? contractStatusChip(c) : esc(String(c.status || '')));
  const mv = o.moveSuffix ? (() => { const m = insMove(c);
    if (!m || m.k === 'clear') return '';
    return ` <span class="ins-mv is-${m.k}">· ${esc(i18t(m.k === 'you' ? 'ins_your_move' : 'ins_their_move'))}</span>`; })() : '';
  const acts = (o.acts || []).map(a => {
    const cls = a.kind === 'accent' ? 'ui-btn ui-btn-accent' : (a.kind === 'plain' ? 'ui-btn ui-btn-plain' : 'ui-btn');
    return `<button type="button" class="${cls}" data-ins-act="${esc(a.k)}"${a.title ? ` title="${esc(a.title)}"` : ''}>${
      a.icon && typeof icon === 'function' ? icon(a.icon, 'w-3.5 h-3.5') : ''}${esc(a.label)}</button>`;
  }).join('');
  const more = o.menuHtml ? `<span class="ins-more-wrap">
      <button type="button" class="ui-btn ui-btn-icon ins-more" data-ins-more aria-haspopup="true" aria-expanded="false"
        title="${esc(i18t('reg_more_actions'))}" aria-label="${esc(i18t('ins_more', { id: c.id }))}">${typeof icon === 'function' ? icon('more') : ''}</button>
      <div class="ins-menu" data-ins-menu hidden>${o.menuHtml}</div></span>` : '';
  return `<div class="ins-h">
    <div class="ins-eb"><span class="ins-ref">${esc(c.id)}</span>${kind ? ` · ${esc(kind)}` : ''}</div>
    <h2 class="ins-cp" title="${esc(pyAll || cp)}"><span class="ins-cp-n">${esc(cp)}</span>${py ? `<span class="reg-py-n" title="${esc(pyAll)}">${esc(py)}</span>` : ''}</h2>
    ${title ? `<div class="ins-sub" title="${esc(title)}">${esc(title)}</div>` : ''}
    <div class="ins-st">${status}${mv}</div>
    ${(acts || more) ? `<div class="ins-acts">${acts}${more}</div>` : ''}
  </div>`;
}
/* The whole panel. `o.order` names the sections after the head, in order:
   'lead' (a page's own section, handed in as HTML), 'table', 'facts',
   'reads', 'latest'. */
function insPanelHtml(c, o){
  const opt = o || {};
  const order = opt.order || ['facts', 'table', 'reads', 'latest'];
  const part = {
    lead: () => opt.lead || '',
    table: () => insTableHtml(c),
    facts: () => insFactsHtml(c),
    reads: () => insReadsHtml(c),
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
function insPaintPanel(o){
  const host = (typeof document !== 'undefined') ? document.getElementById('ins-panel') : null;
  if (!host) return;
  const opt = o || {};
  host._ins = opt;
  const c = opt.c || null;
  host.innerHTML = c ? insPanelHtml(c, opt) : insPanelEmptyHtml(opt.empty);
  if (c) host.setAttribute('data-ins-id', c.id); else host.removeAttribute('data-ins-id');
  if (!host.dataset.insBound){
    host.dataset.insBound = '1';
    host.addEventListener('click', e => {
      const cur = host._ins || {};
      const cc = cur.c;
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
      const act = e.target.closest && e.target.closest('[data-ins-act]');
      if (act && cc){
        const k = act.getAttribute('data-ins-act');
        const a = (cur.acts || []).find(x => x.k === k);
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
    document.addEventListener('click', e => {
      const h = document.getElementById('ins-panel');
      if (h && !(e.target.closest && e.target.closest('.ins-more-wrap'))) insCloseMenu(h);
    });
  }
  /* THE TRAIL IS NOT ON THE LIGHT LIST. The record is read once, and the
     panel repaints only if it is still showing the same contract when the
     answer lands — a reader who arrowed on in the meantime is not thrown
     back. A failure is SAID, never a silent empty "Latest". */
  if (c && insLatest(c) === null && !opt.latestState){
    const api = (typeof API_MODE === 'function') && API_MODE();
    if (!api || typeof ensureFull !== 'function'){ insRepaintLatest(host, c, 'none'); return; }
    const id = c.id;
    Promise.resolve().then(() => ensureFull(c)).then(() => {
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
      if (k === 'register' && typeof regRepaint === 'function') regRepaint();
      else if (k === 'approvals' && typeof renderApprovalsPage === 'function') renderApprovalsPage();
    } catch (err) { if (typeof console !== 'undefined') console.warn('inspector: repaint on resize failed', err); }
  };
  const later = () => { if (queued) return; queued = true;
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f => setTimeout(f, 16)))(check); };
  try { if (typeof ResizeObserver === 'function'){ new ResizeObserver(later).observe(el); return; } } catch (_) {}
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', later);
}

Object.assign(window, { INS_MIN_W, INS_ASKS_MAX, INS_LATEST, INS_READ_TONE,
  insForce, insFits, insSelected, insSelect, insPick, insFacts, insMove, insMoveCellHtml,
  insTable, insReads, insLatest, insSecHtml, insFactsHtml, insTableHtml, insReadsHtml, insLatestHtml,
  insHeadHtml, insPanelHtml, insPanelEmptyHtml, insPaintPanel, insCloseMenu, insMarkRow, insListWire,
  insListOff, insWatchWidth });
