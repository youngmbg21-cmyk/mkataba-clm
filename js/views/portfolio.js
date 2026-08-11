/* ============================================================================
   HaTi — THE UNIVERSAL FRAME. Six panels every business gets, whatever it does.

   They answer the six questions that do not depend on what kind of business is
   asking: what have we got, where is it concentrated, where is it difficult,
   who are the big names, what do the numbers say, and what needs doing. A
   roofing contractor, a law firm and a hotel all need those, which is why this
   is the frame and not a feature.

   WHAT IT COUNTS, AND WHY THAT EXACT SET. Live contracts — everything except
   Declined. That is the same definition the Copilot snapshot and the Portfolio
   Health Report use (js/ai.js, aiPortfolioSnapshot). Three surfaces that count
   the same book differently is how a customer stops believing any of them, and
   f151 exists to keep them level.

   EVERY FIGURE IS ARITHMETIC OVER state.contracts. Nothing here is written by
   a model, estimated, benchmarked or fetched. Values, dates and categories are
   read off the contract record; rounds and findings are HaTi's own filing and
   scanning record. Where a figure cannot be honest it is not drawn.

   VALUES CAN BE HIDDEN. A member whose account cannot see contract values gets
   the same six panels ranked by NUMBER of contracts instead, and the page says
   so. Silently drawing empty bars for them would be worse than saying it.

   TWO FILTERS CROSS THE WHOLE PAGE: a category and a counterparty. Each panel
   is filtered by every dimension EXCEPT its own, so the control you clicked
   keeps its full axis with your choice highlighted while everything else
   narrows. That is what makes it a dashboard rather than a poster.
   ========================================================================= */

const PF_MAX_ROWS = 8;          // the leaderboard shows the largest eight
const PF_MAX_FINDINGS = 6;      // six at most; a long list is a list nobody reads
const PF_SOON_DAYS = 90;        // "ends soon" — the same window the register's saved view uses

function pfState(){ if(!state.pf) state.pf={cat:null, cp:null}; return state.pf; }
const pfEsc = s => String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* The book this frame reads. Declined contracts are not live — the same rule
   the Copilot snapshot applies, deliberately. */
const pfLive = () => (state.contracts||[]).filter(c=>c.status!=='Declined');

const pfMoneyOk = () => (typeof canViewValues!=='function') || canViewValues();
/* One place decides what a contract is "worth" for ranking. When values are
   hidden from this member it is 1 per contract, so every panel ranks by count
   and none of them has to know that it is doing so. */
const pfWeight = c => {
  if(!pfMoneyOk()) return 1;
  if(typeof isMonetary==='function' && !isMonetary(c)) return 0;
  return Number(c.value||0);
};
const pfSum = cs => cs.reduce((a,c)=>a+pfWeight(c),0);
const pfMoney = n => pfMoneyOk()
  ? (typeof fmtMoneyShort==='function' ? fmtMoneyShort(n) : String(n))
  : String(n);
const pfPct = (a,b) => b ? Math.round(a/b*100) : 0;
/* A category holding real money must never print 0%. Rounded down it reads
   as nothing there, which is a different claim from a small share. */
const pfShare = (a,b) => (a>0 && pfPct(a,b)===0) ? '&lt;1%' : pfPct(a,b)+'%';
/* Counted nouns go through the dictionary like every other word. Built as
   n + ' contract' + (n===1?'':'s') they printed English inside a Swedish
   sentence — and a half-English screen is still a well-formed screen, so
   nothing would ever have failed over it. */
const pfN = (n, kind) => (typeof i18tn==='function')
  ? i18tn('pf_n_'+kind, n, {n})
  : n+' '+kind+(n===1?'':'s');

const pfCategoryOf = c => (c.metadata&&c.metadata.category)||'';
const pfCatLabel = k => k
  ? ((typeof metaOptLabel==='function') ? metaOptLabel(k) : k)
  : i18t('reg_uncategorised');
const pfExpiry = c => (typeof effectiveExpiry==='function'?effectiveExpiry(c):c.expiry)||null;
const pfDaysTo = iso => (typeof daysUntil==='function') ? daysUntil(iso) : null;
const pfFindingsOf = c => (typeof openFindings==='function' && c.scan) ? openFindings(c) : [];
const pfRounds = c => (c.rounds||[]).length;

/* Cross-filtering. `exclude` names the dimension a panel owns, so that panel
   keeps its whole axis while the rest of the page narrows around it. */
function pfRows(exclude){
  const F=pfState();
  return pfLive().filter(c=>{
    if(exclude!=='cat' && F.cat!=null && pfCategoryOf(c)!==F.cat) return false;
    if(exclude!=='cp'  && F.cp  && (c.counterparty||'')!==F.cp) return false;
    return true;
  });
}

/* ---------------------------------------------------------------- chrome --- */
const PF_CARD='background:var(--color-surface);border:1px solid var(--color-divider);border-radius:8px;padding:13px 15px;display:flex;flex-direction:column;min-width:0';
const PF_H='display:flex;align-items:baseline;gap:8px;margin-bottom:9px;flex-wrap:wrap';
const PF_TITLE='font-size:13px;font-weight:700;letter-spacing:-.01em';
const PF_HINT='font-size:11px;color:var(--color-neutral-600)';
const PF_FOOT='margin-top:auto;padding-top:10px;font-size:10.5px;line-height:1.5;color:var(--color-neutral-600)';
const pfCard=(title,hint,body,foot)=>`<div style="${PF_CARD}">
  <div style="${PF_H}"><span style="${PF_TITLE}">${title}</span>${hint?`<span style="${PF_HINT}">${hint}</span>`:''}</div>
  <div style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center">${body}</div>
  ${foot?`<div style="${PF_FOOT}">${foot}</div>`:''}</div>`;

function pfChipsHtml(){
  const F=pfState(); const chips=[];
  if(F.cat!=null) chips.push({k:'cat', l:pfCatLabel(F.cat)});
  if(F.cp) chips.push({k:'cp', l:F.cp});
  if(!chips.length) return '';
  return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
    <span style="font-size:10.5px;color:var(--color-neutral-600)">${i18t('pf_focused_on')}</span>
    ${chips.map(c=>`<button data-pf-unfilter="${c.k}" style="display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:3px 10px;font:inherit;font-size:11px;font-weight:700;cursor:pointer;background:var(--color-accent);color:#fff">${pfEsc(c.l)} ✕</button>`).join('')}
    <button data-pf-clear style="border:0;background:none;cursor:pointer;font:inherit;font-size:11px;font-weight:600;color:var(--color-accent-700);text-decoration:underline">${i18t('reg_clear')}</button>
  </div>`;
}

/* ---------------------------------------------- 1. WHAT IT IS WORTH -------- */
/* Four figures. The first is always the book's value; the other three are the
   first three candidates that have something to say, so a workspace with no
   auto-renewals never sees a zero staring back at it. */
function pfFigures(){
  const rs=pfRows(null), all=pfLive(), F=pfState();
  const focused = F.cat!=null || !!F.cp;
  const soon=rs.filter(c=>{ const e=pfExpiry(c); if(!e) return false; const d=pfDaysTo(e); return d!=null&&d>=0&&d<=PF_SOON_DAYS; });
  const flagged=rs.filter(c=>pfFindingsOf(c).length>0);
  const awaiting=rs.filter(c=>{ const s=state.shareByContract&&state.shareByContract[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); });
  const auto=rs.filter(c=>(c.metadata&&c.metadata.renewalType)==='auto-renew');
  const uncat=rs.filter(c=>!pfCategoryOf(c));

  const cand=[];
  if(soon.length) cand.push({k:i18t('pf_ends_soon'), v:pfMoney(pfSum(soon)),
    d:`${pfN(soon.length,'contracts')} — ${i18t('pf_near_horizon')}`});
  if(awaiting.length) cand.push({k:i18t('pf_out_with_them'), v:pfMoney(pfSum(awaiting)),
    d:`${pfN(awaiting.length,'contracts')} ${i18t('pf_sent_not_back')}`});
  if(auto.length) cand.push({k:i18t('pf_renews_itself'), v:String(auto.length),
    d:i18t('pf_no_decision_point')});
  if(flagged.length) cand.push({k:i18t('pf_carrying_finding'), v:String(flagged.length),
    d:`${i18t('pf_of')} ${rs.length} ${i18t('pf_in_focus')}`});
  if(uncat.length) cand.push({k:i18t('reg_uncategorised'), v:String(uncat.length),
    d:i18t('pf_cannot_be_grouped')});
  /* Nothing to say is itself worth one tile rather than a blank column. */
  if(!cand.length) cand.push({k:i18t('pf_carrying_finding'), v:'0', d:i18t('pf_nothing_flagged')});

  const tile=(k,v,d,hero)=>`<div style="${PF_CARD};padding:12px 14px;gap:1px${hero?';background:var(--brand-hero,var(--color-accent-700));border-color:transparent;color:#fff':''}">
    <div style="font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${hero?'var(--brand-hero-sub,#bde7e1)':'var(--color-neutral-600)'}">${k}</div>
    <div style="font-family:var(--font-heading);font-size:22px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.2">${v}</div>
    <div style="font-size:10.5px;color:${hero?'var(--brand-hero-sub,#bde7e1)':'var(--color-neutral-600)'}">${d}</div></div>`;

  const heroLabel = pfMoneyOk() ? i18t('pf_contracted_value') : i18t('pf_contracts_live');
  const heroValue = pfMoneyOk() ? pfMoney(pfSum(rs)) : String(rs.length);
  const heroNote = focused
    ? `${rs.length} ${i18t('pf_of')} ${all.length} ${i18t('pf_in_focus')}`
    : pfN(all.length,'live');
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px" class="pf-figs">
    ${tile(heroLabel, heroValue, heroNote, true)}
    ${cand.slice(0,3).map(c=>tile(c.k,c.v,c.d,false)).join('')}</div>`;
}

/* ------------------------------------------- 2. WHERE THE VALUE SITS ------- */
function pfWhereValueSits(){
  const rs=pfRows('cat'), F=pfState();
  const per=new Map();
  rs.forEach(c=>{ const k=pfCategoryOf(c);
    const e=per.get(k)||{v:0,n:0}; e.v+=pfWeight(c); e.n++; per.set(k,e); });
  const keys=[...per.keys()].sort((a,b)=>per.get(b).v-per.get(a).v);
  if(!keys.length) return pfCard(i18t('pf_where_value'),'',
    `<div style="font-size:12px;color:var(--color-neutral-600);padding:10px 0">${i18t('pf_nothing_here')}</div>`,'');
  const max=per.get(keys[0]).v||1, total=keys.reduce((a,k)=>a+per.get(k).v,0)||1;
  const dense=keys.length>=4;
  const rows=keys.map(k=>{
    const e=per.get(k), sel=F.cat===k, dim=F.cat!=null&&!sel;
    return `<button data-pf-cat="${pfEsc(k)}" style="display:grid;grid-template-columns:1fr 92px;gap:9px;align-items:center;width:100%;text-align:left;border:0;background:${sel?'color-mix(in srgb,var(--color-accent) 10%,transparent)':'none'};border-radius:7px;cursor:pointer;font:inherit;padding:${dense?'6px':'8px 6px'};border-bottom:1px solid var(--color-divider);opacity:${dim?'.42':'1'}">
      <span style="min-width:0">
        <span style="font-size:${dense?'12px':'12.5px'};font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pfEsc(pfCatLabel(k))}</span>
        <span style="font-size:10px;color:var(--color-neutral-600)">${pfN(e.n,'contracts')} · ${pfShare(e.v,total)}</span>
        <span style="display:block;height:${dense?'6px':'7px'};margin-top:5px;border-radius:4px;background:var(--color-neutral-100);overflow:hidden">
          <span style="display:block;height:100%;width:${Math.max(2,Math.round(e.v/max*100))}%;border-radius:4px;background:var(--accent-solid,var(--color-accent))"></span></span>
      </span>
      <span style="text-align:right;font-family:var(--font-heading);font-size:${dense?'14px':'16px'};font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${pfMoneyOk()?pfEsc(pfMoney(e.v)):e.n}</span>
    </button>`;
  }).join('');
  const foot = pfMoneyOk()
    ? i18t('pf_where_foot')
    : `<b>${i18t('pf_values_hidden')}</b> ${i18t('pf_ranked_by_count')}`;
  return pfCard(i18t('pf_where_value'),'',`<div>${rows}</div>`,foot);
}

/* -------------------------------------------------- 3. THE RISK MAP -------- */
/* Contracted value against how many negotiation rounds a contract took. The
   left-hand edge is not "easy" — it is "nothing recorded yet", which is a
   different and sometimes more interesting thing, and the axis says so. */
function pfRiskMap(){
  const rs=pfRows('cp').filter(c=>pfWeight(c)>0);
  if(rs.length<2) return pfCard(i18t('pf_risk_map'), i18t('pf_risk_map_hint'),
    `<div style="font-size:12px;color:var(--color-neutral-600);padding:16px 0">${i18t('pf_need_two')}</div>`,'');
  const F=pfState();
  /* pl is wide enough for a full money label — "KES 97.75M" anchored at pl-8
     ran off the left edge of the chart. And the axis is labelled with the
     LARGEST CONTRACT, not with a padded scale maximum: headroom belongs in the
     geometry, not on the axis, or the top gridline claims a value no contract
     has. */
  const W=560, H=rs.length<=6?214:rs.length<=12?252:290, pl=82, pb=38;
  const vmax=Math.max(...rs.map(pfWeight))||1;
  const rmax=Math.max(3, ...rs.map(pfRounds));
  const pts=rs.map(c=>{
    const risk=(typeof contractRisk==='function')?contractRisk(c):0;
    const band=(typeof riskBand==='function')?riskBand(risk):'green';
    return { c, band, risk,
      x: pl + (pfRounds(c)/rmax)*(W-pl-18),
      y: (H-pb) - (pfWeight(c)/vmax)*(H-pb-30) };
  });
  /* Labels are placed after every dot is drawn and nudged clear of both the
     dots and each other — an SVG paints in document order, so a label declared
     early is covered by any dot declared later however carefully it was put. */
  const placed=[], labels=[], named=new Set();
  const dots=pts.map(p=>{
    const sel=F.cp===(p.c.counterparty||'');
    const pal=(typeof riskPal==='function')?riskPal(p.risk):{dot:'var(--color-accent)'};
    const name=(p.c.counterparty||p.c.name||'').slice(0,34);
    /* one label per NAME. Two contracts with the same counterparty printed the
       same name twice, a few pixels apart, which reads as a rendering fault. */
    if((pfWeight(p.c)>=vmax*0.42 || sel) && !named.has(name)){
      named.add(name);
      const anchor = p.x>W*0.58 ? 'end':'start';
      const w=name.length*5.4;
      let ly=p.y+3.5, guard=0;
      const lx = anchor==='end' ? p.x-12 : p.x+12;
      const left = anchor==='end' ? lx-w : lx;
      const hits=()=>placed.some(q=>Math.abs(q.y-ly)<11 && Math.abs(q.x-lx)<240)
        || pts.some(q=>q!==p && Math.abs(q.y-(ly-3.5))<9 && q.x>left-8 && q.x<left+w+8);
      while(guard++<14 && hits()) ly+=12;
      placed.push({x:lx,y:ly});
      labels.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="10" font-weight="700" fill="var(--color-text)" stroke="var(--color-surface)" stroke-width="3" paint-order="stroke">${pfEsc(name)}</text>`);
    }
    return `<g data-pf-cp="${pfEsc(p.c.counterparty||'')}" style="cursor:pointer">
      <title>${pfEsc(p.c.name)} — ${pfEsc(pfMoney(pfWeight(p.c)))} · ${pfN(pfRounds(p.c),'rounds')}</title>
      <circle cx="${p.x}" cy="${p.y}" r="${sel?9.5:7}" fill="${pal.dot}" stroke="var(--color-surface)" stroke-width="2"${F.cp&&!sel?' opacity=".35"':''}/></g>`;
  }).join('');
  const axis='font-size="9.5" fill="var(--color-neutral-600)"';
  const body=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${pfEsc(i18t('pf_risk_map_aria'))}">
    <g stroke="var(--color-divider)" stroke-width="1">
      <line x1="${pl}" y1="${H-pb}" x2="${W-10}" y2="${H-pb}"/>
      <line x1="${pl}" y1="14" x2="${pl}" y2="${H-pb}"/></g>
    <text x="${pl-8}" y="${H-pb-(H-pb-30)+4}" text-anchor="end" ${axis}>${pfEsc(pfMoney(vmax))}</text>
    <text x="${pl-8}" y="${H-pb+3}" text-anchor="end" ${axis}>0</text>
    <text x="${pl}" y="${H-10}" ${axis}>${i18t('pf_no_rounds_yet')}</text>
    <text x="${W-10}" y="${H-10}" text-anchor="end" ${axis}>${rmax} ${i18t('pf_rounds')} →</text>
    ${dots}<g style="pointer-events:none">${labels.join('')}</g></svg>`;
  const key=(col,txt)=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:9px;height:9px;border-radius:50%;background:${col};display:inline-block"></i>${txt}</span>`;
  const foot=`<div style="display:flex;gap:13px;flex-wrap:wrap;align-items:center">
    ${key('var(--st-ruby-dot)',i18t('pf_risk_high'))}
    ${key('var(--st-amber-dot)',i18t('pf_risk_med'))}
    ${key('var(--st-green-dot)',i18t('pf_risk_low'))}
    <span style="margin-left:auto">${i18t('pf_click_a_dot')}</span></div>`;
  return pfCard(i18t('pf_risk_map'), i18t('pf_risk_map_hint'), body, foot);
}

/* --------------------------------------- 4. BIGGEST BY CONTRACTED VALUE ---- */
function pfBiggest(){
  const rs=pfRows('cp'), F=pfState();
  const per=new Map();
  rs.forEach(c=>{ const k=(c.counterparty||'').trim()||i18t('pf_no_counterparty');
    const e=per.get(k)||{v:0,n:0,find:0,cat:pfCategoryOf(c)};
    e.v+=pfWeight(c); e.n++; e.find+=pfFindingsOf(c).length; per.set(k,e); });
  const keys=[...per.keys()].sort((a,b)=>per.get(b).v-per.get(a).v).slice(0,PF_MAX_ROWS);
  if(!keys.length) return pfCard(i18t('pf_biggest'),'',
    `<div style="font-size:12px;color:var(--color-neutral-600);padding:10px 0">${i18t('pf_nothing_here')}</div>`,'');
  const max=per.get(keys[0]).v||1;
  const th='text-align:left;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-600);padding:5px 8px;border-bottom:1px solid var(--color-divider);white-space:nowrap';
  const td='padding:7px 8px;border-bottom:1px solid var(--color-divider);vertical-align:middle';
  const rows=keys.map(k=>{
    const e=per.get(k), sel=F.cp===k;
    return `<tr data-pf-cp="${pfEsc(k)}" style="cursor:pointer;${sel?'background:color-mix(in srgb,var(--color-accent) 10%,transparent)':''}">
      <td style="${td};font-weight:600">${pfEsc(k)}
        <div style="font-size:10px;color:var(--color-neutral-600);font-weight:500">${pfEsc(pfCatLabel(e.cat))}${e.n>1?' · '+pfN(e.n,'contracts'):''}</div></td>
      <td style="${td};width:30%"><span style="display:block;height:7px;border-radius:4px;background:var(--accent-solid,var(--color-accent));width:${Math.max(2,Math.round(e.v/max*100))}%"></span></td>
      <td style="${td};text-align:right;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap">${pfMoneyOk()?pfEsc(pfMoney(e.v)):e.n}</td>
      <td style="${td};text-align:right;white-space:nowrap">${e.find
        ? `<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;background:var(--st-amber-bg);color:var(--st-amber-fg)">${e.find}</span>`
        : `<span style="font-size:10.5px;color:var(--color-neutral-500)">—</span>`}</td></tr>`;
  }).join('');
  return pfCard(i18t('pf_biggest'),'',
    `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr><th style="${th}">${i18t('pf_counterparty')}</th><th style="${th};width:30%">${pfMoneyOk()?i18t('pf_value'):i18t('pf_contracts')}</th>
      <th style="${th};text-align:right">${pfMoneyOk()?jxCurrency():'#'}</th><th style="${th};text-align:right">${i18t('pf_findings')}</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`,
    `${i18t('pf_largest')} ${keys.length} ${i18t('pf_of')} ${per.size} ${i18t('pf_in_focus')}. ${i18t('pf_click_a_row')}`);
}

/* ------------------------------------------- 5. WHAT THIS SLICE SAYS ------- */
/* Sentences, computed. Not a model's summary — every one of these is arithmetic
   over the contracts in focus, and only the ones that are true get written. */
function pfSentences(){
  const rs=pfRows(null), L=[];
  if(!rs.length) return L;
  const total=pfSum(rs)||1;
  const B=s=>`<b>${s}</b>`;

  const soon=rs.filter(c=>{ const e=pfExpiry(c); if(!e) return false; const d=pfDaysTo(e); return d!=null&&d>=0&&d<=PF_SOON_DAYS; });
  if(soon.length){
    const next=soon.slice().sort((a,b)=>String(pfExpiry(a)).localeCompare(String(pfExpiry(b))))[0];
    L.push({tone:'warn', t:`${B(pfMoney(pfSum(soon)))} ${i18t('pf_s_ends_within')} ${PF_SOON_DAYS} ${i18t('pf_s_days')} — ${pfN(soon.length,'contracts')}, ${i18t('pf_s_nearest')} ${B(pfEsc(next.name))}.`});
  }
  const expired=rs.filter(c=>{ const e=pfExpiry(c); if(!e) return false; const d=pfDaysTo(e); return d!=null&&d<0; });
  if(expired.length)
    L.push({tone:'bad', t:`${B(pfN(expired.length,'contracts'))} ${i18tn('pf_s_past_term', expired.length, {n:expired.length})}`});

  const auto=rs.filter(c=>(c.metadata&&c.metadata.renewalType)==='auto-renew');
  if(auto.length)
    L.push({tone:'warn', t:`${B(String(auto.length))} ${i18t('pf_s_renew_themselves')} — ${auto.slice(0,3).map(c=>pfEsc(c.counterparty||c.name)).join(', ')}${auto.length>3?' '+i18t('pf_s_and_more'):''}.`});

  const flagged=rs.filter(c=>pfFindingsOf(c).length>0);
  const high=flagged.filter(c=>pfFindingsOf(c).some(f=>f.sev==='high'));
  if(high.length)
    L.push({tone:'bad', t:`${B(String(high.length))} ${i18t('pf_s_carry_serious')} — ${high.slice(0,3).map(c=>pfEsc(c.name)).join(', ')}${high.length>3?' '+i18t('pf_s_and_more'):''}.`});

  const uncat=rs.filter(c=>!pfCategoryOf(c));
  if(uncat.length)
    L.push({tone:'', t:`${B(String(uncat.length))} ${i18t('pf_s_uncategorised')} ${pfPct(uncat.length,rs.length)}% ${i18t('pf_s_of_the_book')}`});

  const slow=rs.slice().sort((a,b)=>pfRounds(b)-pfRounds(a))[0];
  if(slow && pfRounds(slow)>=2)
    L.push({tone:'', t:`${i18t('pf_s_slowest')} ${B(pfEsc(slow.counterparty||slow.name))} ${i18t('pf_s_at')} ${B(pfN(pfRounds(slow),'rounds'))}.`});

  const ranked=rs.slice().filter(c=>pfWeight(c)>0).sort((a,b)=>pfWeight(b)-pfWeight(a));
  if(ranked.length){
    L.push({tone:'', t:`${i18t('pf_s_largest_is')} ${B(pfEsc(ranked[0].name))} ${i18t('pf_s_at')} ${B(pfMoney(pfWeight(ranked[0])))} — ${pfPct(pfWeight(ranked[0]),total)}% ${i18t('pf_s_of_this_slice')}`});
    if(ranked.length>=5){
      const top3=ranked.slice(0,3).reduce((a,c)=>a+pfWeight(c),0);
      const share=pfPct(top3,total);
      L.push({tone:share>=60?'warn':'', t:`${i18t('pf_s_top_three')} ${B(share+'%')} ${i18t('pf_s_of_focus')}${share>=60?' — '+i18t('pf_s_would_be_felt'):', '+i18t('pf_s_no_single_name')}`});
    }
  }
  return L;
}
function pfReadout(){
  const rs=pfRows(null);
  const L=pfSentences();
  const dot=t=>t==='bad'?'var(--st-ruby-dot)':t==='warn'?'var(--st-amber-dot)':'var(--color-accent)';
  const body = L.length
    ? `<div style="display:flex;flex-direction:column;gap:8px">${L.slice(0,6).map(l=>
        `<div style="display:flex;gap:9px;align-items:flex-start;font-size:12.5px;line-height:1.6">
          <span style="flex:none;width:6px;height:6px;border-radius:50%;margin-top:7px;background:${dot(l.tone)}"></span>
          <span style="min-width:0">${l.t}</span></div>`).join('')}</div>`
    : `<div style="font-size:12px;color:var(--color-neutral-600);padding:10px 0">${i18t('pf_nothing_to_say')}</div>`;
  return pfCard(i18t('pf_says'),
    `${i18t('pf_recomputed_from')} ${pfN(rs.length,'contracts')} ${i18t('pf_in_focus')}`,
    body, i18t('pf_says_foot'));
}

/* --------------------------------------- 6. WHAT NEEDS ATTENTION ----------- */
const PF_SEV_RANK={high:0, med:1, low:2};
function pfFindings(){
  const rs=pfRows(null);
  const items=[];
  rs.forEach(c=>pfFindingsOf(c).forEach(f=>items.push({c, f})));
  items.sort((a,b)=>(PF_SEV_RANK[a.f.sev]??3)-(PF_SEV_RANK[b.f.sev]??3) || pfWeight(b.c)-pfWeight(a.c));
  const scanned=rs.filter(c=>!!c.scan).length;
  if(!items.length){
    const body=`<div style="font-size:12.5px;color:var(--color-neutral-600);padding:10px 0;line-height:1.6">${
      scanned ? i18t('pf_clean_corner') : i18t('pf_none_reviewed')}</div>`;
    return pfCard(i18t('pf_needs_attention'),'',body,
      `${scanned} ${i18t('pf_of')} ${pfN(rs.length,'contracts')} ${i18t('pf_have_been_read')}`);
  }
  const tone=s=>s==='high'?{bg:'var(--st-ruby-bg)',fg:'var(--st-ruby-fg)'}
    :s==='med'?{bg:'var(--st-amber-bg)',fg:'var(--st-amber-fg)'}
    :{bg:'var(--color-neutral-100)',fg:'var(--color-neutral-700)'};
  const shown=items.slice(0,PF_MAX_FINDINGS);
  const body=`<div style="display:flex;flex-direction:column">${shown.map(({c,f})=>{
    const t=tone(f.sev);
    return `<button data-pf-open="${pfEsc(c.id)}" style="display:flex;gap:9px;align-items:flex-start;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;padding:8px 2px;border-bottom:1px dashed var(--color-divider)">
      <span style="flex:none;margin-top:2px;font-size:9.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:${t.bg};color:${t.fg};text-transform:uppercase;letter-spacing:.04em">${pfEsc(f.sev||'low')}</span>
      <span style="min-width:0;flex:1">
        <b style="display:block;font-size:12px;font-weight:700">${pfEsc(f.title||i18t('pf_a_finding'))}</b>
        <span style="font-size:11px;color:var(--color-neutral-600)">${pfEsc(c.name)}${pfWeight(c)>0?' · '+pfEsc(pfMoney(pfWeight(c))):''}</span></span>
      <span style="flex:none;font-size:11px;font-weight:700;color:var(--color-accent-700)">${i18t('pf_open_arrow')}</span></button>`;
  }).join('')}</div>`;
  const more=items.length-shown.length;
  return pfCard(i18t('pf_needs_attention'), `${items.length} ${i18t('pf_open_findings')}`, body,
    `${more>0?`<b>${more} ${i18t('pf_more_here')}</b> `:''}${i18t('pf_findings_foot')}`);
}

/* ------------------------------------------------------- the whole frame --- */
function portfolioFrameHtml(){
  if(!pfLive().length) return `<div style="max-width:520px;margin:44px auto;text-align:center;color:var(--color-neutral-600);font-size:13px;line-height:1.65">
    <b style="color:var(--color-text)">${i18t('pf_empty_title')}</b><br/>${i18t('pf_empty_body')}</div>`;
  /* THE SHAPED FILL, added only where the shape is present. A row is skipped
     outright rather than drawn empty — the panels themselves already refuse to
     render when they have nothing to say, so an empty string here means there
     was genuinely nothing, and a row of one card takes the full width. */
  const hasProject = typeof wsHas!=='function' || wsHas('project');
  const hasStanding = typeof wsHas!=='function' || wsHas('standing');
  const row = (cards, cls) => { const live=cards.filter(Boolean);
    return live.length ? `<div class="pf-grid ${live.length>1?(cls||'pf-6-6'):''}">${live.join('')}</div>` : ''; };
  const runway = hasProject ? pfWorkloadRunway() : '';
  const wonlost = hasProject ? pfWonLost() : '';
  const tail = hasProject ? [pfMoneyHeld(), pfPromisesLive()] : [];
  const renewal = hasStanding ? pfRenewalRunway() : '';

  /* THE PILE NOBODY CAN COUNT. Contracts filed before the category existed
     group under nothing, so they quietly fall out of every figure that groups.
     A number with no route to fixing it is a complaint; this one carries the
     route. */
  const uncounted = pfLive().filter(c=>!pfCategoryOf(c));
  const nudge = uncounted.length ? `
    <div style="display:flex;gap:11px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px;padding:10px 13px;border-radius:8px;background:var(--st-amber-bg);border:1px solid var(--st-amber-line);color:var(--st-amber-fg);font-size:12px;line-height:1.55">
      <span style="flex:1;min-width:220px"><b>${i18t('pf_uncounted_head',{n:uncounted.length})}</b> ${i18t('pf_uncounted_body')}</span>
      ${(typeof canEdit!=='function'||canEdit())?`<button data-pf-fixcats style="flex:none;border:1px solid currentColor;background:none;color:inherit;border-radius:6px;padding:5px 11px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer">${i18t('pf_uncounted_fix')}</button>`:''}
    </div>` : '';

  return `<style>
    .pf-grid{display:grid;gap:10px;align-items:stretch;margin-bottom:10px}
    .pf-6-6{grid-template-columns:1fr 1fr}
    .pf-8-4{grid-template-columns:8fr 4fr}
    @media (max-width:1080px){ .pf-6-6,.pf-8-4{grid-template-columns:1fr} .pf-figs{grid-template-columns:repeat(2,1fr)!important} }
    .pf-scroll [data-pf-cat]:hover,.pf-scroll [data-pf-cp]:hover,.pf-scroll [data-pf-open]:hover{background:var(--color-neutral-100)!important}
  </style>
  <div style="max-width:1280px;margin:0 auto">
    ${nudge}
    ${pfChipsHtml()}
    ${pfFigures()}
    ${row([runway, wonlost],'pf-8-4')}
    ${row([renewal])}
    <div class="pf-grid pf-6-6">${pfRiskMap()}${pfWhereValueSits()}</div>
    ${row(tail)}
    <div class="pf-grid">${pfBiggest()}</div>
    <div class="pf-grid pf-6-6">${pfReadout()}${pfFindings()}</div>
    <div style="margin-top:2px;padding:9px 13px;border-radius:7px;background:var(--color-neutral-100);font-size:10.5px;line-height:1.55;color:var(--color-neutral-600)">
      ${i18t('pf_honesty_note')}
    </div>
  </div>`;
}

/* Every control on the page, wired once. Clicking a thing you have already
   chosen releases it — the same gesture in and out, so nobody has to find a
   different control to undo a choice. */
function wirePortfolioFrame(rerender){
  const F=pfState();
  const again=()=>{ if(typeof rerender==='function') rerender(); };
  document.querySelectorAll('[data-pf-cat]').forEach(el=>el.addEventListener('click',()=>{
    const k=el.getAttribute('data-pf-cat'); F.cat = F.cat===k ? null : k; again(); }));
  document.querySelectorAll('[data-pf-cp]').forEach(el=>el.addEventListener('click',()=>{
    const k=el.getAttribute('data-pf-cp'); if(!k) return; F.cp = F.cp===k ? null : k; again(); }));
  document.querySelectorAll('[data-pf-unfilter]').forEach(el=>el.addEventListener('click',()=>{
    F[el.getAttribute('data-pf-unfilter')]=null; again(); }));
  document.querySelector('[data-pf-clear]')?.addEventListener('click',()=>{ F.cat=null; F.cp=null; again(); });
  document.querySelector('[data-pf-fixcats]')?.addEventListener('click',()=>{
    if(typeof runMetaBackfill==='function') runMetaBackfill({missingCategory:true});
  });
  document.querySelectorAll('[data-pf-open]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.getAttribute('data-pf-open');
    if(typeof openWorkspace==='function') openWorkspace(id);
    else { state.activeId=id; if(typeof setView==='function') setView('workspace'); } }));
}

Object.assign(window,{PF_SOON_DAYS,PF_MAX_ROWS,PF_MAX_FINDINGS,pfState,pfLive,pfRows,pfSum,pfWeight,pfN,pfMoneyOk,
  pfPct,pfShare,pfCategoryOf,pfCatLabel,pfFindingsOf,pfRounds,pfSentences,pfFigures,pfWhereValueSits,pfRiskMap,pfBiggest,
  pfReadout,pfFindings,portfolioFrameHtml,wirePortfolioFrame});

/* ============================================================================
   THE SHAPED FILL. Panels that appear only when a business has that shape of
   agreement, named with that business's own word for a piece of work.

   Nothing here is a second implementation of the frame. They read the same
   live book, obey the same two cross-filters, and are drawn with the same card
   as the six — the only difference is that they can be absent.
   ========================================================================= */

/* Months are counted from the current one, so "0" is this month on every
   screen that draws a runway. The names come from the reader's own locale,
   which is why no month name appears in the dictionary. */
const pfMonth0 = () => { const d=new Date(); return d.getFullYear()*12 + d.getMonth(); };
function pfMonthOf(iso){
  const t=Date.parse(String(iso||'')+'T00:00:00'); if(isNaN(t)) return null;
  const d=new Date(t); return d.getFullYear()*12 + d.getMonth() - pfMonth0();
}
/* A MONTH IS NAMED WITH ITS WHOLE YEAR. This read "Jan 27" — a two-digit year
   beside a month name, which in a product that also prints day-level dates is
   read as the twenty-seventh of January. Reported off the renewal runway
   against the calendar beside it (Young, 11 Aug 2026): the bar was January
   2027 and the calendar's 27th was empty, so the two surfaces looked as though
   they disagreed when they were both right. Four characters of axis buys the
   reader never having to work out which reading is meant. */
function pfMonthLabel(off){
  const abs=pfMonth0()+off, d=new Date(Math.floor(abs/12), abs%12, 1);
  try{ return d.toLocaleDateString(jxLocale(),{month:'short',year:'numeric'}); }
  catch(e){ return String(abs%12+1)+'/'+Math.floor(abs/12); }
}
/* A date the way this reader writes dates. A raw 2026-02-12 in the middle of a
   sentence is the machine's format leaking onto the screen. */
function pfDate(iso){
  const t=Date.parse(String(iso||'')+'T00:00:00'); if(isNaN(t)) return String(iso||'');
  try{ return new Date(t).toLocaleDateString(jxLocale(),{day:'2-digit',month:'short',year:'numeric'}); }
  catch(e){ return String(iso); }
}
const pfAddDays = (iso,n) => { const t=Date.parse(String(iso||'')+'T00:00:00');
  if(isNaN(t)) return null; return new Date(t+n*864e5).toISOString().slice(0,10); };

/* Guarded like every cross-module read in this codebase: a test world (and a
   browser that failed to load one script) stages these views without the
   modules they read, and an unguarded call takes the whole screen down. */
const _wsOne   = () => (typeof wsOne==='function') ? wsOne() : i18t('ww_project');
const _wsMany  = () => (typeof wsMany==='function') ? wsMany() : i18t('ww_project_pl');
const _wsTitle = () => (typeof wsTitle==='function') ? wsTitle() : i18t('ww_project_title');
const _wsCount = n => (typeof wsCount==='function') ? wsCount(n) : pfN(n,'contracts');
const _wsStart = c => (typeof wsStartOf==='function') ? wsStartOf(c)
  : ((c.metadata&&c.metadata.effectiveDate) || null);
const _wsEnd   = c => (typeof wsEndOf==='function') ? wsEndOf(c) : pfExpiry(c);

/* A piece of work, by the one rule the Settings card also reads. */
const pfJobs = ex => pfRows(ex).filter(c=>typeof wsIsProject==='function' && wsIsProject(c));

/* ---- WHAT COUNTS AS WON, LOST, AND STILL OUT ----
   Settled from the statuses HaTi already keeps rather than by inventing a
   quote state, because a state nobody sets is a state that stays empty:
     WON      Signed — an agreement exists, the work is yours.
     LOST     Declined — somebody closed it without a signature.
     STILL OUT Under Review, or a draft with a live share the other side has
              been sent. A draft sitting in your own folder is not awaiting an
              answer; it is awaiting you.
   HaTi knows nothing about WHY one was lost, and the panel says so. */
const pfIsWon  = c => c.status==='Signed';
const pfIsLost = c => c.status==='Declined';
function pfIsOut(c){
  if(c.status==='Under Review') return true;
  const s=state.shareByContract&&state.shareByContract[c.id];
  return c.status==='Draft' && !!s && (s.state==='sent'||s.state==='opened');
}

/* ------------------------------------------------- THE WORKLOAD RUNWAY ----- */
/* A piece of work OCCUPIES the months it runs, so its contracted value is
   spread evenly across them. That is the difference between this and a renewal
   runway, where a contract lands on one month and is gone. */
const PF_RUN_BACK = 3, PF_RUN_FWD = 14;
function pfWorkloadRunway(){
  const jobs=pfJobs('month').filter(c=>!pfIsLost(c));
  const placed=[], unplaced=[];
  jobs.forEach(c=>{
    const a=pfMonthOf(_wsStart(c)), b=pfMonthOf(_wsEnd(c));
    if(a==null||b==null||b<a) unplaced.push(c); else placed.push({c,a,b});
  });
  if(!placed.length) return '';
  const m0=-PF_RUN_BACK, m1=PF_RUN_FWD, N=m1-m0+1;
  const per=[];
  for(let i=0;i<N;i++){
    const m=m0+i; let won=0, out=0, n=0;
    placed.forEach(({c,a,b})=>{ if(a<=m&&m<=b){
      const slice=pfWeight(c)/(b-a+1);
      if(pfIsWon(c)) won+=slice; else out+=slice; n++; } });
    per.push({m,won,out,n});
  }
  const peak=Math.max(...per.map(p=>p.won+p.out))||1;
  const W=920,H=196,px=64,pb=32,bw=(W-px-12)/N;
  const bars=per.map(p=>{
    const x=px+(p.m-m0)*bw+3, past=p.m<0;
    const hW=Math.round((H-pb-18)*p.won/peak), hO=Math.round((H-pb-18)*p.out/peak);
    let y=H-pb, g=`<g><title>${pfEsc(pfMonthLabel(p.m))} — ${pfN(p.n,'contracts')} · ${pfEsc(pfMoney(p.won+p.out))}</title>`;
    if(p.won+p.out===0) g+=`<rect x="${x}" y="${H-pb-3}" width="${bw-6}" height="3" rx="1.5" fill="var(--color-divider)"/>`;
    else{
      if(p.won>0){ y-=hW; g+=`<rect x="${x}" y="${y}" width="${bw-6}" height="${Math.max(hW,3)}" rx="3" fill="var(--accent-solid,var(--color-accent))"${past?' opacity=".45"':''}/>`; }
      if(p.out>0){ y-=hO; g+=`<rect x="${x}" y="${y}" width="${bw-6}" height="${Math.max(hO,3)}" rx="3" fill="var(--color-neutral-400)"${past?' opacity=".45"':''}/>`; }
    }
    if((p.m-m0)%3===0) g+=`<text x="${x+(bw-6)/2}" y="${H-pb+15}" text-anchor="middle" font-size="9.5" fill="var(--color-neutral-600)">${pfMonthLabel(p.m)}</text>`;
    return g+'</g>';
  }).join('');
  const nowX=px+(0-m0)*bw;
  const booked=per.filter(p=>p.m>=0&&p.m<6&&p.won>0).length;
  const body=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${pfEsc(i18t('pf_runway_aria'))}">
    <g stroke="var(--color-divider)" stroke-width="1"><line x1="${px}" y1="${H-pb}" x2="${W-8}" y2="${H-pb}"/></g>
    <line x1="${nowX}" y1="12" x2="${nowX}" y2="${H-pb}" stroke="var(--color-neutral-400)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="${nowX+4}" y="19" font-size="9.5" font-weight="700" fill="var(--color-neutral-500)">${i18t('pf_today')}</text>
    <text x="${px-8}" y="22" text-anchor="end" font-size="9.5" fill="var(--color-neutral-600)">${pfEsc(pfMoney(peak))}</text>
    <text x="${px-8}" y="${H-pb+3}" text-anchor="end" font-size="9.5" fill="var(--color-neutral-600)">0</text>
    ${bars}</svg>`;
  const key=(col,txt)=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${col};display:inline-block"></i>${txt}</span>`;
  const foot=`<div style="display:flex;gap:13px;flex-wrap:wrap;align-items:center">
    ${key('var(--accent-solid,var(--color-accent))',i18t('pf_work_won'))}
    ${key('var(--color-neutral-400)',i18t('pf_work_out'))}
    <span style="margin-left:auto">${i18t('pf_months_booked',{n:booked})}</span></div>
    <div style="margin-top:5px">${i18t('pf_runway_foot',{w:_wsOne()})}${unplaced.length
      ? ' '+i18t('pf_runway_unplaced',{n:unplaced.length}) : ''}</div>`;
  return pfCard(i18t('pf_workload_runway'), i18t('pf_workload_hint',{w:_wsOne()}), body, foot);
}

/* ------------------------------------------------------- MONEY HELD BACK --- */
const pfRetVal = c => { const p=Number((c.metadata||{}).retentionPct)||0;
  return p>0 ? pfWeight(c)*p/100 : 0; };
const pfRetDue = c => { const d=Number((c.metadata||{}).retentionReleaseDays);
  const end=_wsEnd(c); if(!end) return null;
  return Number.isFinite(d)&&d>0 ? pfAddDays(end,d) : end; };
function pfMoneyHeld(){
  const held=pfJobs(null).filter(c=>pfRetVal(c)>0 && !pfIsLost(c));
  if(!held.length) return '';
  const rows=held.slice().sort((a,b)=>String(pfRetDue(a)||'').localeCompare(String(pfRetDue(b)||'')));
  const total=rows.reduce((a,c)=>a+pfRetVal(c),0);
  const late=rows.filter(c=>{ const d=pfRetDue(c); const n=d?pfDaysTo(d):null; return n!=null&&n<0; });
  const td='padding:7px 8px;border-bottom:1px solid var(--color-divider);vertical-align:middle';
  const body=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><tbody>${
    rows.slice(0,5).map(c=>{
      const due=pfRetDue(c), n=due?pfDaysTo(due):null;
      const st=(n!=null&&n<0)?{c:'ruby',t:i18t('pf_ret_overdue')}
        :(n!=null&&n<=60)?{c:'amber',t:i18t('pf_ret_due_soon')}:{c:'gray',t:i18t('pf_ret_held')};
      const pal=st.c==='ruby'?{bg:'var(--st-ruby-bg)',fg:'var(--st-ruby-fg)'}
        :st.c==='amber'?{bg:'var(--st-amber-bg)',fg:'var(--st-amber-fg)'}
        :{bg:'var(--color-neutral-100)',fg:'var(--color-neutral-700)'};
      return `<tr data-pf-open="${pfEsc(c.id)}" style="cursor:pointer">
        <td style="${td};font-weight:600">${pfEsc(c.name)}
          <div style="font-size:10px;color:var(--color-neutral-600);font-weight:500">${(c.metadata||{}).retentionPct}% ${i18t('pf_ret_held_lc')}${due?' · '+i18t('pf_ret_due_back')+' '+pfEsc(pfDate(due)):''}</div></td>
        <td style="${td};text-align:right;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap">${pfEsc(pfMoney(pfRetVal(c)))}</td>
        <td style="${td};width:1%"><span style="font-size:9.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:${pal.bg};color:${pal.fg};white-space:nowrap">${st.t}</span></td></tr>`;
    }).join('')}</tbody></table></div>`;
  const head=`<div style="display:flex;align-items:baseline;gap:8px;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:6px">
    <span>${i18t('pf_on_n_jobs',{n:_wsCount(rows.length)})}</span>
    <span style="margin-left:auto;font-size:12px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--color-text);font-variant-numeric:tabular-nums">${pfEsc(pfMoney(total))}</span></div>`;
  return pfCard(i18t('pf_money_held'), i18t('pf_money_held_hint'), head+body,
    `${rows.length>5?`<b>${i18t('pf_more_beyond',{n:rows.length-5})}</b> `:''}${i18t('pf_money_held_foot')}${late.length?' '+i18t('pf_money_held_late'):''}`);
}

/* ------------------------------------------------------ PROMISES STILL LIVE */
const pfWarrantyEnd = c => { const m=Number((c.metadata||{}).warrantyMonths)||0;
  const end=_wsEnd(c); if(!m||!end) return null; return pfAddDays(end, Math.round(m*30.4)); };
function pfPromisesLive(){
  const live=pfJobs(null).filter(c=>{
    if(pfIsLost(c)) return false;
    const end=_wsEnd(c), w=pfWarrantyEnd(c);
    if(!end||!w) return false;
    const done=pfDaysTo(end), left=pfDaysTo(w);
    return done!=null&&done<0 && left!=null&&left>=0;      // finished, still carried
  }).sort((a,b)=>String(pfWarrantyEnd(a)).localeCompare(String(pfWarrantyEnd(b))));
  if(!live.length) return '';
  const t0=Math.min(...live.map(c=>pfMonthOf(_wsEnd(c))));
  const t1=Math.max(...live.map(c=>pfMonthOf(pfWarrantyEnd(c))));
  const span=Math.max(t1-t0,1), at=m=>(m-t0)/span*100;
  const body=`<div>${live.slice(0,5).map(c=>{
    const a=pfMonthOf(_wsEnd(c)), b=pfMonthOf(pfWarrantyEnd(c));
    return `<button data-pf-open="${pfEsc(c.id)}" style="display:grid;grid-template-columns:1fr 104px;gap:9px;align-items:center;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;padding:5px 3px;border-radius:7px">
      <span style="min-width:0"><span style="display:block;font-size:11.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pfEsc(c.name)}</span>
        <span style="display:block;position:relative;height:10px;margin-top:4px">
          <span style="position:absolute;left:${at(a)}%;width:${Math.max(at(b)-at(a),2)}%;top:2px;height:6px;border-radius:3px;background:var(--color-accent-500,var(--color-accent))"></span>
          <span style="position:absolute;left:${at(0)}%;top:-2px;height:14px;border-left:1px dashed var(--color-neutral-400)"></span></span></span>
      <span style="text-align:right;font-size:10.5px;color:var(--color-neutral-600);font-variant-numeric:tabular-nums">${i18t('pf_yours_to')} ${pfEsc(pfMonthLabel(b))}</span></button>`;
  }).join('')}</div>`;
  const head=`<div style="display:flex;align-items:baseline;gap:8px;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:6px">
    <span>${i18t('pf_finished_carried')}</span>
    <span style="margin-left:auto;font-size:12px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--color-text)">${_wsCount(live.length)}</span></div>`;
  return pfCard(i18t('pf_promises_live'), i18t('pf_promises_hint'), head+body,
    i18t('pf_promises_foot',{a:pfMonthLabel(t0),b:pfMonthLabel(t1)}));
}

/* ------------------------------------------------------ WON AND LOST ------- */
function pfWonLost(){
  /* THE ONE PANEL THAT LOOKS PAST THE LIVE BOOK. Everywhere else "live" means
     everything except Declined, because a declined contract is not part of
     what you hold. But a LOST piece of work IS a declined contract, so a
     conversion rate computed over the live book can only ever say 100%. */
  const F=pfState();
  const jobs=(state.contracts||[]).filter(c=>{
    if(!(typeof wsIsProject==='function' && wsIsProject(c))) return false;
    if(F.cat!=null && pfCategoryOf(c)!==F.cat) return false;
    if(F.cp && (c.counterparty||'')!==F.cp) return false;
    return true;
  });
  const won=jobs.filter(pfIsWon), lost=jobs.filter(pfIsLost), out=jobs.filter(pfIsOut);
  if(!won.length&&!lost.length&&!out.length) return '';
  const wv=pfSum(won), lv=pfSum(lost), ov=pfSum(out), tot=wv+lv+ov||1;
  const decided=won.length+lost.length;
  const byCount=decided?pfPct(won.length,decided):0;
  const byValue=(wv+lv)?pfPct(wv,wv+lv):0;
  const seg=(v,col)=>`<span style="display:block;height:100%;width:${v/tot*100}%;background:${col}"></span>`;
  const stat=(k,v,d,col)=>`<div style="background:var(--color-neutral-100);border-left:3px solid ${col};border-radius:7px;padding:7px 10px">
    <div style="font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600)">${k}</div>
    <div style="font-family:var(--font-heading);font-size:15px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${v}</div>
    <div style="font-size:10px;color:var(--color-neutral-600)">${d}</div></div>`;
  const body=`<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid var(--color-divider);margin-bottom:9px">
      ${seg(wv,'var(--accent-solid,var(--color-accent))')}${seg(ov,'var(--color-neutral-400)')}${seg(lv,'var(--color-neutral-300)')}</div>
    <div style="display:grid;gap:7px">
      ${stat(i18t('pf_won'),pfMoney(wv),_wsCount(won.length),'var(--accent-solid,var(--color-accent))')}
      ${stat(i18t('pf_awaiting'),pfMoney(ov),_wsCount(out.length),'var(--color-neutral-400)')}
      ${stat(i18t('pf_lost'),pfMoney(lv),_wsCount(lost.length),'var(--color-neutral-300)')}
    </div>
    ${decided?`<div style="margin-top:10px;font-size:12px;line-height:1.6;color:var(--color-neutral-700)">
      ${i18t('pf_won_pct',{c:byCount,v:byValue})} ${byValue<byCount?i18t('pf_winning_smaller'):byValue>byCount?i18t('pf_winning_bigger'):''}</div>`:''}`;
  return pfCard(i18t('pf_won_lost',{W:_wsTitle()}), '', body, i18t('pf_won_lost_foot',{w:_wsOne()}));
}

/* ------------------------------------------------------ RENEWAL RUNWAY ----- */
/* The standing shape's own panel: what ends when, and whether anybody has
   decided. "Decided" is the platform's own renewal decision — the obligation
   HaTi raises for a contract that is about to end — so this panel and the
   Approvals queue never disagree about what has been dealt with. */
function pfRenewalDecided(c){
  const obs=(typeof allObligations==='function')?allObligations():[];
  const mine=obs.filter(o=>o&&o.cid===c.id&&/renew/i.test(String(o.desc||'')));
  if(!mine.length) return false;
  const st=(typeof obState==='function')?obState:(o=>o&&o.status==='done'?'done':'open');
  return mine.some(o=>st(o)==='done');
}
function pfRenewalRunway(){
  const rs=pfRows('month').filter(c=>!(typeof wsIsProject==='function'&&wsIsProject(c)));
  const N=18, per=[];
  let openEnded=0;
  rs.forEach(c=>{ if(!_wsEnd(c)) openEnded++; });
  for(let i=0;i<N;i++){
    const inM=rs.filter(c=>pfMonthOf(_wsEnd(c))===i);
    per.push({ m:i, n:inM.length,
      dec:pfSum(inM.filter(pfRenewalDecided)),
      und:pfSum(inM.filter(c=>!pfRenewalDecided(c))) });
  }
  if(!per.some(p=>p.n)) return '';
  const peak=Math.max(...per.map(p=>p.dec+p.und))||1;
  /* Wider viewBox than the workload chart because this one is drawn full
     width: the height scales with the width, and 920 units across a 1700px
     card made a 390px-tall chart that was mostly empty sky. */
  const W=1400,H=230,px=70,pb=32,bw=(W-px-12)/N;
  const bars=per.map(p=>{
    const x=px+p.m*bw+3, tot=p.dec+p.und;
    const hD=Math.round((H-pb-18)*p.dec/peak), hU=Math.round((H-pb-18)*p.und/peak);
    let y=H-pb, g=`<g><title>${pfEsc(pfMonthLabel(p.m))} — ${pfN(p.n,'contracts')} · ${pfEsc(pfMoney(tot))}</title>`;
    if(tot===0) g+=`<rect x="${x}" y="${H-pb-3}" width="${bw-6}" height="3" rx="1.5" fill="var(--color-divider)"/>`;
    else{
      if(p.dec>0){ y-=hD; g+=`<rect x="${x}" y="${y}" width="${bw-6}" height="${Math.max(hD,3)}" rx="3" fill="var(--accent-solid,var(--color-accent))"/>`; }
      if(p.und>0){ y-=hU; g+=`<rect x="${x}" y="${y}" width="${bw-6}" height="${Math.max(hU,3)}" rx="3" fill="var(--st-amber-dot)"/>`; }
    }
    if(p.m%3===0) g+=`<text x="${x+(bw-6)/2}" y="${H-pb+15}" text-anchor="middle" font-size="9.5" fill="var(--color-neutral-600)">${pfMonthLabel(p.m)}</text>`;
    return g+'</g>';
  }).join('');
  const half=per.slice(0,6).reduce((a,p)=>a+p.dec+p.und,0);
  const body=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${pfEsc(i18t('pf_renewal_aria'))}">
    <g stroke="var(--color-divider)" stroke-width="1"><line x1="${px}" y1="${H-pb}" x2="${W-8}" y2="${H-pb}"/></g>
    <text x="${px-8}" y="22" text-anchor="end" font-size="9.5" fill="var(--color-neutral-600)">${pfEsc(pfMoney(peak))}</text>
    <text x="${px-8}" y="${H-pb+3}" text-anchor="end" font-size="9.5" fill="var(--color-neutral-600)">0</text>
    ${bars}</svg>`;
  const key=(col,txt)=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${col};display:inline-block"></i>${txt}</span>`;
  const foot=`<div style="display:flex;gap:13px;flex-wrap:wrap;align-items:center">
    ${key('var(--accent-solid,var(--color-accent))',i18t('pf_decided'))}
    ${key('var(--st-amber-dot)',i18t('pf_nothing_filed'))}
    <span style="margin-left:auto">${i18t('pf_lands_six',{v:pfMoney(half)})}</span></div>
    ${openEnded?`<div style="margin-top:5px">${i18t('pf_open_ended',{n:openEnded})}</div>`:''}`;
  return pfCard(i18t('pf_renewal_runway'), i18t('pf_renewal_hint'), body, foot);
}

Object.assign(window,{pfMonthOf,pfMonthLabel,pfDate,pfJobs,pfIsWon,pfIsLost,pfIsOut,pfRetVal,pfRetDue,
  pfWarrantyEnd,pfWorkloadRunway,pfMoneyHeld,pfPromisesLive,pfWonLost,pfRenewalRunway,pfRenewalDecided});
