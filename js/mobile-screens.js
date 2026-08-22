/* ============================================================================
   THE PHONE — Home, Contracts, Approvals, Portfolio.

   Read js/mobile.js first: it owns the breakpoint, the shell and the rule that
   nothing in the phone computes anything for itself. This file is the four
   tabbed screens, and it keeps that rule strictly:

     · every figure on Home comes from hmDashSlices(), the same function the
       desktop dashboard reads
     · every row on Contracts comes from regFiltered(), the same function the
       desktop register reads, driven through the same regState() the desktop
       filters write to — so a stream filtered on the phone is still filtered
       when the window is widened
     · every approval comes from approvalState() and is decided by
       approveContract() / rejectApprovalStep(), which is where the rules about
       who may approve what actually live

   The one thing assembled here rather than upstream is the "Needs you" list,
   and it is assembled from slices that already exist — it decides nothing about
   what belongs on it beyond the order they are read in.
   ============================================================================ */

/* Slices, fetched once per paint. Wrapped because a phone can be looking at
   the app before the session has finished arriving, and a dashboard figure
   that throws should cost a card, not the whole screen. */
function mSlices(){
  try{ return (typeof hmDashSlices==='function') ? hmDashSlices() : null; }
  catch(e){ try{ console.error('[hati] phone could not read the dashboard figures', e); }catch(_){} return null; }
}

/* ------------------------------------------------------------------ HOME ---*/

/* WHAT NEEDS YOU, in the order a person would ask.

   Five kinds, each already computed by the dashboard for its own cards:
   approvals sitting on you, counterparties waiting on your answer, paper they
   declined, renewal decisions coming due, and reviews that have stopped moving.
   Nothing here decides what qualifies — each slice arrives already decided. */
function mNeedsYou(D){
  if(!D) return [];
  const out = [];
  const seen = new Set();
  const push = (c, dot, reason, tone) => {
    if(!c || seen.has(c.id)) return;
    seen.add(c.id);
    out.push({ c, dot, reason, tone });
  };

  (D.myApprovals||[]).filter(x=>x.mine).forEach(x=>{
    const who = (x.c.audit||[]).find(a=>/creat/i.test(a.action||''));
    push(x.c, 'var(--st-amber-dot)',
      i18t('m_waiting_your_approval') + (who&&who.user?i18t('m_requested_by',{who:who.user}):''), 'var(--st-amber-fg)');
  });

  /* The counterparty is waiting on an answer. wsNextAction is the authority on
     whether that is true — the same authority the desktop's own action bar
     uses — so the phone cannot come to a different conclusion about whose turn
     it is than the contract page does. */
  (D.cs||[]).forEach(c=>{
    if(c.status==='Signed'||c.status==='Declined') return;
    let na=null; try{ na = (typeof wsNextAction==='function') ? wsNextAction(c) : null; }catch(_){ na=null; }
    if(na && na.kind==='review-changes') push(c,'var(--st-amber-dot)', na.guide, 'var(--st-amber-fg)');
    else if(na && (na.kind==='sign'||na.kind==='sign-scroll')) push(c,'var(--st-green-dot)', na.guide, 'var(--st-green-fg)');
  });

  (D.cs||[]).filter(c=>c.status==='Declined').forEach(c=>{
    push(c,'var(--st-ruby-dot)',i18t('m_declined_read_reason'),'var(--st-ruby-fg)');
  });

  (D.decisions||[]).forEach(x=>{
    push(x.c,'var(--st-green-dot)',
      x.d===0?i18t('m_renewal_due_today'):i18tn('m_renewal_due_in',x.d,{n:x.d}), 'var(--color-neutral-600)');
  });

  (D.waitingLongest||[]).filter(x=>x.idle>14).forEach(x=>{
    push(x.c,'var(--st-amber-dot)',i18tn('m_in_review_no_movement',x.idle,{n:x.idle}),'var(--color-neutral-600)');
  });

  return out;
}

/* The four-to-eleven metric tiles, two across.

   THE READER'S OWN CHOICE, NOT A FIXED FOUR. The design this screen was drawn
   from shows exactly four tiles, hard-coded. The desktop lets you pick from
   eleven and remembers the pick per person — and a phone that ignored that pick
   would be a phone showing you somebody else's dashboard. So it reads
   currentKpiSel(), the same preference, from the same place, and the gear opens
   the same catalogue as a sheet. Two across at 320px, so the figure and its
   caption both fit; the list simply runs on down the page past four. */
function mKpiHtml(D){
  if(!D) return '';
  const sel = (typeof currentKpiSel==='function' ? currentKpiSel() : []).filter(id=>D.KPI_CATALOG[id]);
  if(!sel.length) return '';
  const TONE = { 'var(--grad-emerald)':'var(--tile-emerald-fg)', 'var(--grad-amber)':'var(--tile-amber-fg)',
    'var(--grad-ruby)':'var(--tile-ruby-fg)', 'var(--grad-steel)':'var(--tile-steel-fg)' };
  const cards = sel.map(id=>{
    const k = D.KPI_CATALOG[id];
    const fg = TONE[k.grad] || 'var(--tile-steel-fg)';
    return `<button class="m-kpi" data-m-kpi="${id}">
      <span class="m-kpi-label">${mEsc(k.label)}</span>
      <span class="m-kpi-val" style="color:${fg}">${k.val}</span>
      <span class="m-kpi-sub">${k.delta}</span>
    </button>`;
  }).join('');
  return `<div class="m-kpi-grid">${cards}</div>`;
}

function mHomeHtml(){
  const D = mSlices();
  const org = (typeof getOrg==='function' && getOrg()) || null;
  const cs = (D && D.cs) || (state.contracts||[]);
  const agreements = (typeof agreementsIn==='function') ? agreementsIn(cs).length : cs.length;
  const value = (D && typeof fmtMoneyShort==='function' && D.money) ? fmtMoneyShort(D.m.totalValue) : '';
  const subline = i18tn('m_sub_agreements',agreements,{n:agreements.toLocaleString(jxLocale())})
    + ' · ' + i18tn('m_sub_documents',cs.length,{n:cs.length.toLocaleString(jxLocale())})
    + (value?i18t('m_sub_active_value',{v:value}):'');

  const needs = mNeedsYou(D);
  const expiring = (D && D.expiring) || [];

  const needsHtml = needs.length ? `
    <div class="m-lbl" style="margin:0 16px 6px">${i18t('m_needs_you',{n:needs.length})}</div>
    <div class="m-card m-list" style="margin:0 16px">
      ${needs.map(n=>`
        <button class="m-row" data-m-open="${mEsc(n.c.id)}" style="align-items:flex-start">
          <span style="width:10px;height:10px;border-radius:50%;flex:none;margin-top:6px;background:${n.dot}"></span>
          <span style="flex:1;min-width:0">
            <span class="m-row-name">${mEsc(n.c.name||n.c.id)}</span>
            <span class="m-row-sub">${mEsc((typeof cParty==='function'?cParty(n.c):n.c.counterparty)||'No counterparty yet')}</span>
            <span style="display:block;font-size:15px;margin-top:5px;line-height:1.45;color:${n.tone}">${mEsc(n.reason)}</span>
          </span>
          <span style="flex:none;margin-top:12px">${M_CHEV}</span>
        </button>`).join('')}
    </div>` : `
    <div class="m-card" style="margin:0 16px;padding:30px 20px;text-align:center">
      <div style="width:44px;height:44px;border-radius:50%;background:var(--st-green-bg);color:var(--st-green-fg);display:grid;place-items:center;margin:0 auto 10px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <div style="font-size:18px;font-weight:600">${i18t('m_nothing_needs_you')}</div>
      <div class="m-note" style="margin-top:4px">${i18t('m_nothing_needs_sub')}</div>
    </div>`;

  const expHtml = expiring.length ? `
    <div class="m-lbl" style="margin:14px 16px 6px">${i18t('m_expiring_next')}</div>
    <div class="m-card m-list" style="margin:0 16px">
      ${expiring.slice(0,6).map(x=>`
        <button class="m-row" data-m-open="${mEsc(x.c.id)}">
          <span style="flex:1;min-width:0">
            <span class="m-row-name" style="font-weight:400">${mEsc(x.c.name||x.c.id)}</span>
            <span class="m-row-sub">${mEsc((typeof cParty==='function'?cParty(x.c):x.c.counterparty)||'—')}</span>
          </span>
          <span style="flex:none;font-size:15px;color:var(--color-neutral-600);white-space:nowrap">${mEsc(x.d===0?'today':'in '+x.d+'d')}</span>
        </button>`).join('')}
    </div>` : '';

  return `
    <div class="m-pagehead">
      <div class="m-eyebrow">${mEsc((org&&org.name)||'Your workspace')}</div>
      <div class="m-title">${i18t('m_portfolio')}</div>
      <div class="m-sub">${mEsc(subline)}</div>
    </div>
    <div class="m-scroll">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:16px 16px 6px">
        <span class="m-lbl">${i18t('m_your_metrics')}</span>
        <button class="m-kpi-gear" data-m-act="kpis" aria-label="${i18t('m_choose_metrics')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>
        </button>
      </div>
      ${mKpiHtml(D)}
      ${needsHtml}
      ${expHtml}
      <div class="m-card m-list" style="margin:14px 16px 24px">
        <button class="m-row" data-m-act="portfolio">
          <span style="flex:1;font-size:16px;font-weight:400;color:var(--color-accent-700)">${i18t('m_portfolio')}</span>
          <span style="font-size:15px;color:var(--color-neutral-600)">${i18t('m_figures_streams')}</span>
          ${M_CHEV}
        </button>
        <button class="m-row" data-m-act="more">
          <span style="flex:1;font-size:16px;font-weight:400;color:var(--color-accent-700)">${i18t('m_more')}</span>
          <span style="font-size:15px;color:var(--color-neutral-600)">${i18t('m_more_sub')}</span>
          ${M_CHEV}
        </button>
      </div>
    </div>`;
}

/* The metric catalogue as a sheet. Same eleven metrics, same one-must-stay
   floor, SAME CEILING OF FOUR, same saved preference as the desktop popover —
   it is the same functions underneath, wearing a shape a thumb can hit. The
   ceiling is KPI_MAX and is read, never repeated: a second copy of the number
   is a second thing to change. */
function mKpiSheetHtml(){
  const sel = (typeof currentKpiSel==='function') ? currentKpiSel() : [];
  const all = (typeof kpiCatalogOrder==='function') ? kpiCatalogOrder() : [];
  const max = (typeof KPI_MAX==='number') ? KPI_MAX : 4;
  const full = sel.length >= max;
  const rows = all.map(id=>{
    const on = sel.includes(id), shut = full && !on;
    /* A row that cannot be turned on goes quiet rather than staying bright and
       refusing on the tap — the same statement the desktop rows make. */
    return `<button class="m-row" data-m-kpi-toggle="${id}"${shut?' style="opacity:.45"':''}>
      <span style="flex:1;min-width:0"><span class="m-row-name" style="font-weight:400">${mEsc(KPI_META[id]||id)}</span></span>
      <span style="flex:none;width:22px;height:22px;border-radius:0;display:grid;place-items:center;border:1.5px solid ${on?'var(--accent-solid)':'var(--color-divider)'};background:${on?'var(--accent-solid)':'transparent'};color:#fff">
        ${on?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`:''}
      </span>
    </button>`;
  }).join('');
  return `
    <div class="m-grab"></div>
    <div class="m-sheet-title">${i18t('m_show_metrics')}</div>
    <div class="m-sheet-note">${full?mEsc(i18t('m_max_metrics',{max})):i18t('m_same_choice')}</div>
    <div class="m-sheet-note" style="font-weight:700">${i18t('home_metrics_count',{n:sel.length,max})}</div>
    <div class="m-card m-list">${rows}</div>
    <button class="m-btn m-btn-quiet" style="margin-top:12px" data-m-act="kpi-reset">${i18t('m_reset_four')}</button>
    <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="close-sheet">${i18t('m_done')}</button>`;
}

/* ------------------------------------------------------------- CONTRACTS ---
   The register, filtered by the same state the desktop filters by. The chips
   are three groups on one scrolling line, hairline-separated: the four
   statuses, then the categories present in the book, then the value streams.
   Statuses write regState().stage, categories .category and streams .type —
   exactly what the desktop's own dropdowns write.

   Categories come BEFORE streams deliberately. Appended last they sat ten
   chips along, past every status and every folder, which is further than a
   thumb travels. */
function mContractsHtml(){
  const R = (typeof regState==='function') ? regState() : { query:'', stage:'all', type:'all' };
  let rows = [];
  try{ rows = (typeof regFiltered==='function') ? regFiltered() : (state.contracts||[]); }
  catch(e){ rows = state.contracts||[]; }

  const STATUS_CHIPS = [
    { k:'all', get label(){ return i18t('m_all'); } },
    /* Getters like the 'all' chip above it: this table is rebuilt on every
       paint, but a plain string would still freeze the language of whichever
       paint happened to run first after a switch. */
    { k:'Draft', get label(){ return i18t('m_chip_drafting'); } },
    { k:'Under Review', get label(){ return i18t('m_chip_in_review'); } },
    { k:'Signed', get label(){ return i18t('m_chip_executed'); } },
    { k:'Declined', get label(){ return i18t('m_chip_closed'); } },
  ];
  /* The same filter the desktop register applies to its stream tabs. The rows
     below already come from regFiltered(), which drops out-of-reach streams —
     without this the phone offered chips that could only ever return nothing. */
  const streams = (typeof visibleFolders==='function')
    ? visibleFolders().map(f=>f.id)
    : Object.keys((typeof FOLDERS==='object'&&FOLDERS)||{});
  const statusChips = STATUS_CHIPS.map(c=>`
    <button class="m-chip${R.stage===c.k?' on':''}" data-m-stage="${mEsc(c.k)}">${mEsc(c.label)}</button>`).join('');
  const streamChips = streams.map(f=>`
    <button class="m-chip${R.type===f?' on':''}" data-m-stream="${mEsc(f)}">
      <span class="m-chip-dot" style="background:${(typeof folderColor==='function')?folderColor(f):'var(--color-neutral-400)'}"></span>${mEsc(FOLDERS[f].name)}
    </button>`).join('');
  /* Category chips, but only the ones this book actually contains. The desktop
     can afford to list all eight in a dropdown; eight more chips on a phone,
     six of them matching nothing, is a row nobody scrolls. One category is not
     a filter either — it selects everything — so the group only appears once
     there is a choice to make. */
  const present = [];
  (state.contracts||[]).forEach(c=>{ const k=(c.metadata&&c.metadata.category)||'';
    if(k && present.indexOf(k)<0) present.push(k); });
  const catOrder = (typeof regCategories==='function') ? regCategories() : [];
  present.sort((a,b)=>catOrder.indexOf(a)-catOrder.indexOf(b));
  const catChips = present.length>1 ? present.map(k=>`
    <button class="m-chip${R.category===k?' on':''}" data-m-cat="${mEsc(k)}">${mEsc(
      (typeof regCatLabel==='function')?regCatLabel(k):k)}</button>`).join('') : '';

  const total = (state.contracts||[]).length;
  const list = rows.length ? `
    <div class="m-card m-list" style="margin:16px">
      ${rows.map(c=>`
        <button class="m-reg-row" data-m-open="${mEsc(c.id)}">
          <span class="m-stripe" style="background:${(typeof folderColor==='function')?folderColor(c):'var(--color-neutral-300)'}"></span>
          <span style="display:flex;align-items:flex-start;gap:8px">
            <span style="flex:1;min-width:0;font-size:16px;font-weight:600;line-height:1.3">${mEsc(c.name||c.id)}</span>
            ${mPill(c)}
          </span>
          <span class="m-row-sub">${mEsc((typeof cParty==='function'?cParty(c):c.counterparty)||'No counterparty yet')}</span>
          <span style="display:flex;gap:10px;margin-top:5px;font-size:15px">
            <span style="font-weight:600">${mEsc(mMoney(c))}</span>
            <span style="color:var(--color-neutral-600)">${mEsc(mExpiry(c))}</span>
          </span>
        </button>`).join('')}
    </div>
    <div style="padding:0 16px 24px;text-align:center;font-size:15px;color:var(--color-neutral-600)">
      ${rows.length===total ? i18t('m_showing_all',{n:total}) : i18t('m_n_of_total_match',{n:rows.length,total})}
    </div>`
  : `
    <div class="m-card" style="margin:16px;padding:34px 20px;text-align:center">
      <div style="font-size:16px;font-weight:600">${total?'No contracts match these filters':'No contracts yet'}</div>
      <div class="m-note" style="margin-top:4px">${total?'Widen the filters, or clear them to see everything.':'Start one from a company standard template with the + button.'}</div>
      ${total?`<button class="m-btn m-btn-quiet" style="margin-top:14px" data-m-act="clear-filters">${i18t('m_clear_all_filters')}</button>`:''}
    </div>`;

  return `
    <div class="m-pagehead" style="padding-bottom:0">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px">
        <div style="flex:1;min-width:0">
          <div class="m-title" style="margin-top:0">${i18t('m_contracts')}</div>
          <div class="m-sub">${i18t('m_filter_and_act')}</div>
        </div>
        <button class="m-new" data-m-act="new" aria-label="${i18t('m_new_contract')}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="m-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-600)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="m-reg-q" value="${mEsc(R.query||'')}" placeholder="${i18t('m_search_contracts')}" autocomplete="off">
      </div>
      <div class="m-chips" style="margin:0 -16px">${statusChips}${catChips?'<span class="m-chip-sep"></span>'+catChips:''}<span class="m-chip-sep"></span>${streamChips}</div>
    </div>
    <div class="m-scroll">${list}</div>`;
}

/* ---------------------------------------------------------- NEGOTIATIONS ---
   The same page as the desktop's, in the phone's own row shape. Everything that
   DECIDES anything is the desktop's: regFiltered() (already scoped to live
   negotiations by mRender before this runs), NEGO_BANDS for the three groups
   and their order, negWhoseMove / negoMovePillHtml for the pill. This file
   contributes markup and nothing else — the same division of labour the
   Contracts screen above already keeps.

   NO FILTER BAR HERE, and that is not the desktop's rule being dropped: the
   phone's Contracts screen carries its chips because a register of 145 needs
   them, and the handful being argued over right now does not. The search box
   goes with them. What the phone must keep is the GROUPING and the PILL, which
   are what make this page a negotiations page rather than a short register. */
function mNegotiationsHtml(){
  let rows = [];
  try{ rows = (typeof regFiltered==='function') ? regFiltered() : []; }
  catch(e){ rows = []; }
  const live = (typeof negoLiveList==='function') ? negoLiveList().length : rows.length;

  if(!rows.length) return `
    <div class="m-pagehead">
      <div class="m-title">${i18t('ng_door_title')}</div>
    </div>
    <div class="m-scroll">
      <div class="m-card" style="margin:16px;padding:30px 20px;text-align:center">
        <div style="font-size:16px;font-weight:600">${mEsc(i18t('ng_door_none'))}</div>
        <div class="m-note" style="margin-top:5px;line-height:1.5">${mEsc(i18t('ng_door_none_how'))}</div>
        <button class="m-btn m-btn-quiet" style="margin-top:14px" data-m-tab="contracts">${mEsc(i18t('ng_open_register'))}</button>
      </div>
    </div>`;

  const bands = (typeof NEGO_BANDS!=='undefined') ? NEGO_BANDS : [];
  const dot = (typeof NEGO_BAND_DOT!=='undefined') ? NEGO_BAND_DOT : {};
  const counts = (typeof negoBandCounts==='function') ? negoBandCounts(rows) : {};
  const card = c => `
    <button class="m-reg-row" data-m-nego="${mEsc(c.id)}">
      <span class="m-stripe" style="background:${(typeof folderColor==='function')?folderColor(c):'var(--color-neutral-300)'}"></span>
      <span style="display:flex;align-items:flex-start;gap:8px">
        <span style="flex:1;min-width:0;font-size:16px;font-weight:600;line-height:1.3">${mEsc(c.name||c.id)}</span>
      </span>
      <span class="m-row-sub">${mEsc(c.counterparty||i18t('ng_door_them'))}</span>
      <span style="display:flex;gap:8px;margin-top:7px;align-items:center">
        ${(typeof negoMovePillHtml==='function')?negoMovePillHtml(c):''}
      </span>
    </button>`;
  /* One section per band, in the fixed order, each with its NAME and its COUNT
     beside its colour — so this reads in grey-scale exactly as the desktop's
     does. An empty group still prints, for the same reason: "Waiting on you ·
     0" is worth reading. */
  const groups = bands.map(b => {
    const mine = rows.filter(c => c._ngBand === b.k);
    return `
      <div class="m-ngband">
        <span class="m-ngband-dot" style="background:${dot[b.tone]||'var(--color-neutral-400)'}"></span>
        <span class="m-ngband-k">${mEsc(b.label)}</span>
        <span class="m-ngband-n">${counts[b.k]||0}</span>
      </div>
      ${mine.length ? `<div class="m-card m-list" style="margin:0 16px 14px">${mine.map(card).join('')}</div>` : ''}`;
  }).join('');

  return `
    <div class="m-pagehead">
      <div class="m-title">${i18t('ng_door_title')}</div>
      <div class="m-sub">${mEsc(i18tn('ngl_n_live', live, { n: live }))}</div>
    </div>
    <div class="m-scroll"><div style="padding-top:14px">${groups}</div></div>`;
}

/* The New-contract sheet: the three ways paper gets in, and nothing else.
   Every route calls the same function the desktop's + menu calls.

   IT USED TO LIST THE COMPANY STANDARDS ABOVE THEM, and they are gone for the
   reason the desktop menu's list went (Young, 09 Aug 2026): each of those rows
   is the first route, "Draft from a template", opened one level down — and
   openWizard's picker leads with the same standards. A sheet that answers "how
   does a contract get in here" with a scrolling column of contract names is
   answering a different question. The footnote counting the built-in templates
   went with them: a count of a list you cannot see, on a panel whose whole
   point is now three doors.

   The [data-m-newlib] wiring below stays — it costs nothing with no row
   carrying it, and it is what a future row would need. */
function mNewSheetHtml(){
  const routes = `
    <button class="m-row" data-m-act="new-wizard">
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${i18t('m_draft_from_template')}</span>
        <span class="m-row-sub">${i18t('m_hati_standard')}</span>
      </span>${M_CHEV}
    </button>
    <button class="m-row" data-m-act="new-upload">
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${i18t('m_upload_received')}</span>
        <span class="m-row-sub">${i18t('m_their_word_pdf')}</span>
      </span>${M_CHEV}
    </button>
    <button class="m-row" data-m-act="new-import">
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${i18t('m_import_many')}</span>
        <span class="m-row-sub">${i18t('m_import_many_sub')}</span>
      </span>
      <span style="flex:none;font-size:15px;color:var(--color-neutral-600)">${i18t('m_computer')}</span>
    </button>`;
  return `
    <div class="m-grab"></div>
    <div class="m-sheet-title" style="margin-bottom:10px">${i18t('m_new_contract')}</div>
    ${''/* No caption above them. "Other ways in" was true while the standards
           sat on top and is a heading about nothing now that they do not. */}
    <div class="m-card m-list" style="background:var(--color-bg)">${routes}</div>
    <button class="m-btn m-btn-quiet" style="margin-top:12px" data-m-act="close-sheet">${i18t('act_cancel')}</button>`;
}

/* ------------------------------------------------------------- APPROVALS ---
   The reader's own queue. Same list the dashboard's approvals card shows —
   contracts with an incomplete chain where this person is an eligible approver
   on a pending step — and the two verbs are the two the rules already expose.
   A rejection cannot be sent without a reason, because the reason is what goes
   back to the person who asked. */
function mApprovalItems(){
  const D = mSlices();
  return ((D && D.myApprovals) || []).filter(x=>x.mine);
}

function mApprovalsHtml(){
  const items = mApprovalItems();
  const s = mS();
  const cards = items.map(x=>{
    const c = x.c;
    const open = s.apprOpen===c.id;
    const rejecting = s.apprReject===c.id;
    const requested = (c.audit||[]).find(a=>/creat/i.test(a.action||''));
    return `
    <div class="m-card" style="margin-bottom:12px">
      <button class="m-row" data-m-appr="${mEsc(c.id)}" style="align-items:flex-start;padding:14px">
        <span style="flex:1;min-width:0">
          <span class="m-row-name">${mEsc(c.name||c.id)}</span>
          <span class="m-row-sub">${mEsc((typeof cParty==='function'?cParty(c):c.counterparty)||'—')}</span>
        </span>
        ${mPill(c)}
      </button>
      ${open?`
      <div style="border-top:1px solid var(--color-divider);padding:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 14px">
          <div><div class="m-note">${i18t('m_counterparty')}</div><div style="font-size:16px;font-weight:400;margin-top:1px">${mEsc((typeof cParty==='function'?cParty(c):c.counterparty)||'—')}</div></div>
          <div><div class="m-note">${i18t('m_value')}</div><div style="font-size:16px;font-weight:600;margin-top:1px">${mEsc(mMoney(c))}</div></div>
          <div style="grid-column:1 / -1"><div class="m-note">${requested&&requested.user?'Requested by':'Waiting'}</div><div style="font-size:16px;font-weight:400;margin-top:1px">${
            [requested&&requested.user ? mEsc(requested.user) : '',
             x.idle ? `${x.idle} day${x.idle===1?'':'s'} ago` : 'since today'].filter(Boolean).join(' · ')}</div></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="m-btn m-btn-primary" style="flex:1.4" data-m-approve="${mEsc(c.id)}">${i18t('m_approve')}</button>
          <button class="m-btn" style="flex:1;border-color:var(--st-ruby-line);color:var(--st-ruby-fg)" data-m-reject="${mEsc(c.id)}">${i18t('m_reject')}</button>
        </div>
        ${rejecting?`
        <div style="margin-top:12px">
          <div style="font-size:15px;font-weight:600;margin-bottom:5px">${i18t('m_why_rejecting')}</div>
          <textarea class="m-area" id="m-reject-why" rows="3" placeholder="${i18t('m_reason_goes_back')}"${s.apprErr?' style="border-color:var(--danger)"':''}>${mEsc(s.apprWhy||'')}</textarea>
          ${s.apprErr?`<div class="m-err">${i18t('m_give_reason')}</div>`:''}
          <button class="m-btn m-btn-danger" style="margin-top:10px" data-m-reject-send="${mEsc(c.id)}">${i18t('m_reject_send_back')}</button>
        </div>`:''}
      </div>`:''}
    </div>`;
  }).join('');

  return `
    <div class="m-pagehead">
      <div class="m-title">${i18t('m_approvals')}</div>
      <div class="m-sub">${items.length?`${items.length} contract${items.length===1?'':'s'} waiting on your sign-off`:'All caught up'}</div>
    </div>
    <div class="m-scroll">
      <div style="margin:16px">
        ${items.length?cards:`
        <div class="m-card" style="padding:24px;text-align:center">
          <div style="font-size:16px;font-weight:600">${i18t('m_no_approvals')}</div>
          <div class="m-note" style="margin-top:3px">${i18t('m_new_requests_here')}</div>
        </div>`}
      </div>
    </div>`;
}

/* ------------------------------------------------------------- PORTFOLIO ---
   The figures, plainly, and an honest line about where the rest of them are.
   Every number is read from the same slices the dashboard prints. */
function mPortfolioHtml(){
  const D = mSlices();
  const stages = (D && D.stages) || [];
  const money = !!(D && D.money);
  const rows = [];
  if(money && D) rows.push({ get label(){ return i18t('m_total_value'); }, value: fmtMoneyShort(D.m.totalValue) });
  if(D) rows.push({ get label(){ return i18t('m_agreements'); }, value: String((typeof agreementsIn==='function'?agreementsIn(D.cs):D.cs).length) });
  stages.forEach(s=>rows.push({ label:s.label, value:String(s.n) }));
  if(D) rows.push({ get label(){ return i18t('m_expiring_90'); }, value:String((D.exp90||[]).length) });
  if(D) rows.push({ get label(){ return i18t('m_high_risk'); }, value:String((D.highRisk||[]).length) });

  return `
    <div class="m-pagehead" style="display:flex;align-items:center;gap:4px;padding:8px 8px">
      <button class="m-head-btn" data-m-act="back" aria-label="${i18t('m_back')}" style="color:var(--color-accent-700)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <div style="font-size:19px;font-weight:600;font-family:var(--font-heading,inherit)">${i18t('m_portfolio')}</div>
    </div>
    <div class="m-scroll">
      <div class="m-card m-list" style="margin:16px">
        ${rows.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px">
          <span style="font-size:15px;color:var(--color-neutral-600)">${mEsc(r.label)}</span>
          <span style="font-size:16px;font-weight:600">${mEsc(r.value)}</span>
        </div>`).join('')}
      </div>
      <div class="m-note" style="margin:0 16px 24px">${i18t('m_reports_desk_work')}</div>
    </div>`;
}

/* ------------------------------------------------------- SCREEN BEHAVIOUR ---
   mScreenAct handles the named actions the shell hands down; mWireScreen wires
   the things that are not a data-m-act button (the search field, the rows). */
function mScreenAct(k, btn){
  const s = mS();
  if(typeof mCopilotAct==='function' && mCopilotAct(k)) return;
  if(k==='portfolio'){ mGo('portfolio'); return; }
  if(k==='more'){ mGo('more'); return; }
  if(k==='new'){ mOpenSheet('new'); return; }
  if(k==='kpis'){ mOpenSheet('kpis'); return; }
  if(k==='kpi-reset'){
    if(typeof setKpiSel==='function' && typeof DEFAULT_KPI_SEL!=='undefined') setKpiSel(DEFAULT_KPI_SEL.slice());
    mRender(); return;
  }
  if(k==='clear-filters'){
    const R = (typeof regState==='function') ? regState() : null;
    /* `only` too — a set sent to the register from another screen is a filter
       like any other, and the phone builds no calendar to have sent one, so
       this is the only door it has out of one inherited across a resize. */
    if(R){ R.query=''; R.stage='all'; R.type='all'; R.category='all'; R.view=null; R.only=null; R.page=1; }
    mRender(); return;
  }
  if(k==='new-wizard'){ mCloseSheet(); if(window.openWizard) openWizard(); return; }
  if(k==='new-upload'){ mCloseSheet(); if(window.openUploadModal) openUploadModal(); return; }
  if(k==='new-import'){ mGo('handoff',{ deskView:'migration' }); return; }
  if(typeof mContractAct==='function') mContractAct(k, btn);
}

function mWireScreen(root){
  const s = mS();

  /* Open a contract. state.activeId is the desktop's own idea of "the contract
     you are looking at", so setting it here means the two shells agree. */
  root.querySelectorAll('[data-m-open]').forEach(b=>b.addEventListener('click',()=>{
    const id = b.getAttribute('data-m-open');
    state.activeId = id; state.selId = id;
    mGo('contract',{ tab:'doc' });
  }));

  /* A row on the Negotiations screen opens the NEGOTIATION, not the contract
     page — the same destination the desktop table's row press has. */
  root.querySelectorAll('[data-m-nego]').forEach(b=>b.addEventListener('click',()=>{
    const id = b.getAttribute('data-m-nego');
    if(window.openRedlineWorkbench) openRedlineWorkbench(id);
    else { state.activeId = id; state.selId = id; mGo('contract',{ tab:'doc' }); }
  }));

  /* The register's chip groups write straight into regState(). */
  root.querySelectorAll('[data-m-stage]').forEach(b=>b.addEventListener('click',()=>{
    const R = regState(); R.stage = b.getAttribute('data-m-stage'); R.page = 1; mRender();
  }));
  root.querySelectorAll('[data-m-stream]').forEach(b=>b.addEventListener('click',()=>{
    const R = regState(); const k = b.getAttribute('data-m-stream');
    R.type = (R.type===k) ? 'all' : k; R.page = 1; mRender();
  }));
  root.querySelectorAll('[data-m-cat]').forEach(b=>b.addEventListener('click',()=>{
    const R = regState(); const k = b.getAttribute('data-m-cat');
    R.category = (R.category===k) ? 'all' : k; R.page = 1; mRender();
  }));

  /* Search: repaint the list only, and put the caret back where it was. A full
     repaint on every keystroke would otherwise take the keyboard down. */
  const q = root.querySelector('#m-reg-q');
  if(q) q.addEventListener('input', ()=>{
    const R = regState(); R.query = q.value; R.page = 1;
    const host = root.querySelector('.m-scroll');
    if(host){
      const tmp = document.createElement('div');
      tmp.innerHTML = mContractsHtml();
      const fresh = tmp.querySelector('.m-scroll');
      if(fresh){ host.innerHTML = fresh.innerHTML; mWireScreen(root); }
    }
  });

  root.querySelectorAll('[data-m-kpi]').forEach(b=>b.addEventListener('click',()=>{
    /* A metric tile is a question about a slice of the register, so it opens
       the register already asking it — the same drill-through the desktop card
       performs, through the same filter state. */
    const D = mSlices(); const id = b.getAttribute('data-m-kpi');
    const go = D && D.KPI_CATALOG[id] && D.KPI_CATALOG[id].go;
    const R = (typeof regState==='function') ? regState() : null;
    if(R && go){ R.stage = go.stage||'all'; R.view = go.view||null; if(go.sort) R.sort=go.sort; R.page=1; }
    mGo('contracts');
  }));

  root.querySelectorAll('[data-m-kpi-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const id = b.getAttribute('data-m-kpi-toggle');
    let cur = currentKpiSel().slice();
    const max = (typeof KPI_MAX==='number') ? KPI_MAX : 4;
    if(cur.includes(id)){
      if(cur.length<=1){ if(window.toast) toast(i18t('m_keep_one_metric'),'err'); return; }
      cur = cur.filter(x=>x!==id);
    } else {
      /* The ceiling, refused in words on this shell too. The dimmed row says it
         first; this is the rule behind the row. */
      if(cur.length>=max){ if(window.toast) toast(i18t('m_max_metrics',{max}),'err'); return; }
      cur.push(id);
    }
    setKpiSel(cur);
    mRender();
  }));

  root.querySelectorAll('[data-m-newlib]').forEach(b=>b.addEventListener('click',()=>{
    mCloseSheet();
    if(window.tplLibNewContract) tplLibNewContract(b.getAttribute('data-m-newlib'));
  }));

  /* ---- approvals ---- */
  root.querySelectorAll('[data-m-appr]').forEach(b=>b.addEventListener('click',()=>{
    const id = b.getAttribute('data-m-appr');
    s.apprOpen = (s.apprOpen===id) ? null : id;
    s.apprReject = null; s.apprWhy=''; s.apprErr=false;
    mRender();
  }));
  root.querySelectorAll('[data-m-approve]').forEach(b=>b.addEventListener('click',()=>{
    const c = getContract(b.getAttribute('data-m-approve'));
    if(!c) return;
    try{ approveContract(c); }catch(e){ if(window.toast) toast(e.message||'Could not approve','err'); }
    s.apprOpen=null; mRender();
  }));
  root.querySelectorAll('[data-m-reject]').forEach(b=>b.addEventListener('click',()=>{
    s.apprReject = b.getAttribute('data-m-reject'); s.apprErr=false; mRender();
  }));
  root.querySelectorAll('[data-m-reject-send]').forEach(b=>b.addEventListener('click',()=>{
    const why = (root.querySelector('#m-reject-why')||{}).value || '';
    if(!String(why).trim()){ s.apprWhy=''; s.apprErr=true; mRender(); return; }
    const c = getContract(b.getAttribute('data-m-reject-send'));
    if(!c) return;
    try{ rejectApprovalStep(c, String(why).trim()); }
    catch(e){ if(window.toast) toast(e.message||'Could not reject','err'); }
    s.apprReject=null; s.apprOpen=null; s.apprWhy=''; s.apprErr=false;
    mRender();
  }));
  const why = root.querySelector('#m-reject-why');
  if(why) why.addEventListener('input',()=>{ s.apprWhy = why.value; });

  if(typeof mWireContract==='function') mWireContract(root);
}

Object.assign(window,{ mHomeHtml, mContractsHtml, mNegotiationsHtml, mApprovalsHtml, mPortfolioHtml,
  mKpiSheetHtml, mNewSheetHtml, mNeedsYou, mApprovalItems, mSlices, mScreenAct, mWireScreen });
