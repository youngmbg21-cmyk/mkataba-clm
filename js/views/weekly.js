/* ============================================================================
   HaTi — THE WEEKLY REVIEW.

   A page you read once a week and then put down. That sentence is the whole
   specification, and it is the reason this file is mostly restraint.

   FIVE SLOTS THAT NEVER GROW. Not "sections we add to" — five, always the same
   five, in the same order:

     1  Where things stand      one paragraph on the whole book
     2  Dates that matter       what lands before you read this again
     3  Worth an hour           at most THREE things, ranked
     4  What got better         movement since the last review
     5  What we did not look at printed on purpose

   Thirty-nine open findings read once a week is zero findings read. So the cap
   is structural rather than editorial: slot 3 takes three and says how many it
   left, and a quiet week prints "nothing this week" instead of padding itself
   with whatever ranked fourth. A report that is sometimes short is a report
   people believe when it is long.

   SLOT 5 IS THE ONE NOBODY BUILDS. Every figure in here comes off the contract
   records, so anything the records cannot see is invisible — and a reader who
   does not know that will read silence as safety. It is printed every week,
   in the same place, whether or not there is anything else to say.

   THREE SIZES, ONE DOCUMENT. Skinny is the five slots. Control tower adds what
   the book is exposed to. The 360 adds negotiation and the shape of the
   portfolio. The slots do not change between them — the sizes add pages after
   the five, never inside them.

   DETERMINISTIC. No model writes a word of this. It is arithmetic over
   state.contracts, the same live book (everything except Declined) the
   Portfolio frame and the Copilot snapshot read, printed into a tab.
   ========================================================================= */

const WK_TIERS = ['skinny', 'tower', 'full'];
const WK_TIER_KEY = 'hati.v1.weeklyTier';
const WK_SNAP_KEY = 'hati.v1.weeklySnaps';
const WK_MAX_ACTIONS = 3;          // slot 3 never grows
const WK_HORIZON = 7;              // "before you read this again"

const _wkLsGet = k => { try{ return (typeof lsGet==='function')?lsGet(k):JSON.parse(localStorage.getItem(k)); }catch(_){ return null; } };
const _wkLsSet = (k,v) => { try{ if(typeof lsSet==='function') lsSet(k,v); else localStorage.setItem(k,JSON.stringify(v)); }catch(_){} };
const _wkEsc = s => String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function wkTier(){ const v=_wkLsGet(WK_TIER_KEY); return WK_TIERS.indexOf(v)>=0 ? v : 'tower'; }
function wkSetTier(t){ if(WK_TIERS.indexOf(t)>=0) _wkLsSet(WK_TIER_KEY,t); return wkTier(); }

/* ---- the week this is, and the one before it ----
   ISO-ish week key so two reviews in the same week compare against the same
   baseline rather than against each other. */
function wkKey(d){
  const x = d ? new Date(d) : new Date();
  const day = (x.getDay()+6)%7;                 // Monday = 0
  x.setDate(x.getDate()-day);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}
function wkSnapshots(){ const v=_wkLsGet(WK_SNAP_KEY); return Array.isArray(v)?v:[]; }
/* Recorded once per week, the first time a review is opened that week. The
   comparison in slot 4 is against the LAST DIFFERENT week, never against a
   snapshot taken minutes ago, which would always report no movement. */
function wkRecordSnapshot(){
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  if(!cs.length) return null;
  const live=cs.filter(c=>c.status!=='Declined'&&!c.archived);
  const find=c=>(c.scan&&typeof openFindings==='function')?openFindings(c).length:0;
  const snap={ week:wkKey(), at:new Date().toISOString(),
    contracts:live.length, value:live.reduce((a,c)=>a+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0),
    findings:live.reduce((a,c)=>a+find(c),0),
    uncategorised:live.filter(c=>!((c.metadata||{}).category)).length,
    expiringSoon:live.filter(c=>{ const e=(typeof effectiveExpiry==='function'?effectiveExpiry(c):c.expiry);
      const d=e&&typeof daysUntil==='function'?daysUntil(e):null; return d!=null&&d>=0&&d<=30; }).length };
  const all=wkSnapshots().filter(s=>s.week!==snap.week);
  all.push(snap);
  _wkLsSet(WK_SNAP_KEY, all.slice(-26));        // half a year is plenty to hold
  return snap;
}
const wkPrevSnapshot = () => { const k=wkKey();
  return wkSnapshots().filter(s=>s.week!==k).sort((a,b)=>String(a.week).localeCompare(b.week)).pop()||null; };

/* ---------------------------------------------------------- the figures --- */
function weeklyData(){
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  const live=cs.filter(c=>c.status!=='Declined'&&!c.archived);
  const money=n=>(typeof fmtMoneyShort==='function')?fmtMoneyShort(n):String(n);
  const canSee=(typeof canViewValues!=='function')||canViewValues();
  const val=c=>canSee?(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)):0;
  const exp=c=>(typeof effectiveExpiry==='function'?effectiveExpiry(c):null)||(c.metadata&&c.metadata.expiryDate)||c.expiry||null;
  const dTo=iso=>(iso&&typeof daysUntil==='function')?daysUntil(iso):null;
  const finds=c=>(c.scan&&typeof openFindings==='function')?openFindings(c):[];

  /* SLOT 2 — what lands before the next review, then what lands this month. */
  const landing=live.map(c=>({c, e:exp(c), d:dTo(exp(c))}))
    .filter(x=>x.d!=null && x.d>=0 && x.d<=30)
    .sort((a,b)=>a.d-b.d);

  /* SLOT 3 — worth an hour. Ranked by what it would cost to be wrong: a
     serious finding on a large contract outranks a small one that is merely
     late. Everything that does not make the top three is COUNTED, not hidden. */
  const actions=[];
  live.forEach(c=>{
    const v=val(c), d=dTo(exp(c));
    finds(c).forEach(f=>actions.push({ c, kind:'finding',
      w:(f.sev==='high'?900:f.sev==='med'?400:150)+Math.min(v/1e6,300),
      title:f.title||'', why:'finding' }));
    if(d!=null&&d<0) actions.push({ c, kind:'expired', w:700+Math.min(v/1e6,300),
      title:'', why:'expired' });
    else if(d!=null&&d<=WK_HORIZON) actions.push({ c, kind:'ending', w:500+Math.min(v/1e6,300),
      title:'', why:'ending' });
    if((c.metadata||{}).renewalType==='auto-renew' && d!=null && d>=0 && d<=60)
      actions.push({ c, kind:'autorenew', w:450+Math.min(v/1e6,300), title:'', why:'autorenew' });
    const ret=Number((c.metadata||{}).retentionPct)||0;
    if(ret>0 && exp(c)){
      const rel=Number((c.metadata||{}).retentionReleaseDays)||0;
      const due=new Date(Date.parse(exp(c)+'T00:00:00')+rel*864e5).toISOString().slice(0,10);
      if(dTo(due)!=null && dTo(due)<0) actions.push({ c, kind:'retention',
        w:800+Math.min(v*ret/100/1e6,300), title:'', why:'retention', amount:v*ret/100 });
    }
  });
  actions.sort((a,b)=>b.w-a.w);

  /* SLOT 4 — movement, against the last DIFFERENT week. */
  const prev=wkPrevSnapshot();
  const now={ contracts:live.length, value:live.reduce((a,c)=>a+val(c),0),
    findings:live.reduce((a,c)=>a+finds(c).length,0),
    uncategorised:live.filter(c=>!((c.metadata||{}).category)).length };
  const better=[];
  if(prev){
    if(now.findings<prev.findings) better.push({k:'findings', n:prev.findings-now.findings});
    if(now.uncategorised<prev.uncategorised) better.push({k:'filed', n:prev.uncategorised-now.uncategorised});
    if(now.contracts>prev.contracts) better.push({k:'added', n:now.contracts-prev.contracts});
  }

  /* SLOT 5 — what nothing here can see. Two of these are facts about this
     workspace, not generic caveats: how many contracts have never been read
     for risk, and how many carry no category. */
  const unscanned=live.filter(c=>!c.scan).length;
  return { live, cs, canSee, money, exp, dTo, finds, val,
    landing, actions, prev, now, better, unscanned,
    valueTotal:now.value, tier:wkTier() };
}

/* ------------------------------------------------------------- the page --- */
const WK_CSS=`
  *{box-sizing:border-box}
  body{margin:0;background:#f5f7f9;color:#1f2933;font:15px/1.6 Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}
  .wrap{max-width:820px;margin:0 auto;padding:34px 22px 70px}
  header{margin-bottom:22px}
  h1{margin:0;font-size:25px;letter-spacing:-.02em}
  .sub{color:#64748b;font-size:13px;margin-top:4px}
  .slot{background:#fff;border:1px solid #e3e8ee;border-radius:0;padding:17px 20px;margin-bottom:13px}
  .slot h2{margin:0 0 3px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#7c8794}
  .slot .lead{font-size:15px;line-height:1.65}
  .row{display:flex;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px solid #eef1f5}
  .row:last-child{border-bottom:0}
  .row .when{flex:none;min-width:88px;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px}
  .row .what{flex:1;min-width:0;font-size:14px}
  .row .val{flex:none;font-variant-numeric:tabular-nums;color:#64748b;font-size:13px}
  .act{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid #eef1f5}
  .act:last-child{border-bottom:0}
  .act .n{flex:none;width:22px;height:22px;border-radius:50%;background:#0d9488;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}
  .act b{display:block;font-size:15px}
  .act span{color:#64748b;font-size:13px}
  .quiet{color:#64748b;font-size:14px}
  .left{background:#f8fafc;border:1px dashed #cbd5e1;color:#475569;font-size:13px;line-height:1.65}
  .left li{margin:4px 0}
  .more{margin-top:9px;font-size:13px;color:#64748b}
  .extra h2{color:#0f766e}
  table{width:100%;border-collapse:collapse;font-size:13.5px}
  th{text-align:left;font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:#7c8794;padding:5px 7px;border-bottom:1px solid #e3e8ee}
  td{padding:7px;border-bottom:1px solid #eef1f5}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  footer{margin-top:20px;color:#7c8794;font-size:12px;line-height:1.65}
  @media print{ body{background:#fff} .slot{break-inside:avoid} }
`;

function buildWeeklyHtml(d){
  const T=k=>i18t(k);
  const money=d.money;
  const dateOf=iso=>{ const t=Date.parse(String(iso||'')+'T00:00:00');
    if(isNaN(t)) return String(iso||'');
    try{ return new Date(t).toLocaleDateString(langLocale(),{day:'2-digit',month:'short'}); }catch(e){ return String(iso); } };

  /* ---- 1 ---- */
  const s1=`<div class="slot"><h2>${T('wk_s1')}</h2><div class="lead">${
    d.live.length
      ? i18t('wk_s1_body',{ n:d.live.length,
          v:d.canSee?money(d.valueTotal):i18t('wk_values_hidden'),
          f:d.now.findings, e:d.landing.length })
      : T('wk_s1_empty')}</div></div>`;

  /* ---- 2 ---- */
  const soon=d.landing.filter(x=>x.d<=WK_HORIZON), rest=d.landing.filter(x=>x.d>WK_HORIZON);
  const rowOf=x=>`<div class="row"><span class="when">${x.d===0?T('wk_today'):i18tn('wk_in_days',x.d,{n:x.d})}</span>
    <span class="what">${_wkEsc(x.c.name)}<br><span style="color:#7c8794;font-size:12.5px">${_wkEsc(x.c.counterparty||'')} · ${dateOf(x.e)}</span></span>
    <span class="val">${d.canSee?_wkEsc(money(d.val(x.c))):''}</span></div>`;
  const s2=`<div class="slot"><h2>${T('wk_s2')}</h2>${
    d.landing.length
      ? (soon.length?`<div>${soon.map(rowOf).join('')}</div>`:`<div class="quiet">${T('wk_s2_none_week')}</div>`)
        + (rest.length?`<div class="more">${i18tn('wk_s2_rest',rest.length,{n:rest.length})}</div>`:'')
      : `<div class="quiet">${T('wk_s2_none')}</div>`}</div>`;

  /* ---- 3 ---- */
  const shown=d.actions.slice(0,WK_MAX_ACTIONS);
  const line=a=>{
    const nm=_wkEsc(a.c.name), cp=_wkEsc(a.c.counterparty||'');
    if(a.why==='finding') return { b:_wkEsc(a.title), s:i18t('wk_a_finding',{c:nm}) };
    if(a.why==='expired') return { b:i18t('wk_a_expired_t'), s:i18t('wk_a_expired',{c:nm,p:cp}) };
    if(a.why==='ending')  return { b:i18t('wk_a_ending_t'), s:i18t('wk_a_ending',{c:nm,p:cp}) };
    if(a.why==='autorenew') return { b:i18t('wk_a_auto_t'), s:i18t('wk_a_auto',{c:nm}) };
    return { b:i18t('wk_a_ret_t'), s:i18t('wk_a_ret',{c:nm,v:d.canSee?money(a.amount||0):''}) };
  };
  const s3=`<div class="slot"><h2>${T('wk_s3')}</h2>${
    shown.length
      ? `<div>${shown.map((a,i)=>{ const l=line(a);
          return `<div class="act"><span class="n">${i+1}</span><span><b>${l.b}</b><span>${l.s}</span></span></div>`; }).join('')}</div>`
        + (d.actions.length>shown.length?`<div class="more">${i18t('wk_s3_more',{n:d.actions.length-shown.length})}</div>`:'')
      : `<div class="quiet">${T('wk_s3_none')}</div>`}</div>`;

  /* ---- 4 ---- */
  const words={ findings:'wk_b_findings', filed:'wk_b_filed', added:'wk_b_added' };
  const s4=`<div class="slot"><h2>${T('wk_s4')}</h2>${
    !d.prev ? `<div class="quiet">${T('wk_s4_first')}</div>`
    : d.better.length ? `<div>${d.better.map(b=>`<div class="row"><span class="what">${i18t(words[b.k],{n:b.n})}</span></div>`).join('')}</div>`
    : `<div class="quiet">${T('wk_s4_none')}</div>`}</div>`;

  /* ---- 5 ---- */
  const notLooked=[T('wk_s5_money'), T('wk_s5_delivery')];
  if(d.unscanned) notLooked.unshift(i18tn('wk_s5_unscanned',d.unscanned,{n:d.unscanned}));
  if(d.now.uncategorised) notLooked.unshift(i18tn('wk_s5_uncategorised',d.now.uncategorised,{n:d.now.uncategorised}));
  const s5=`<div class="slot left"><h2>${T('wk_s5')}</h2>
    <ul style="margin:6px 0 0;padding-left:18px">${notLooked.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;

  /* ---- the sizes: pages AFTER the five, never inside them ---- */
  let extra='';
  if(d.tier==='tower'||d.tier==='full'){
    const byCat=new Map();
    d.live.forEach(c=>{ const k=(c.metadata||{}).category||'';
      const e=byCat.get(k)||{v:0,n:0}; e.v+=d.val(c); e.n++; byCat.set(k,e); });
    const keys=[...byCat.keys()].sort((a,b)=>byCat.get(b).v-byCat.get(a).v);
    const uncapped=d.live.filter(c=>(c.metadata||{}).liabilityCapped==='uncapped');
    const openPrice=d.live.filter(c=>(c.metadata||{}).priceReview==='open');
    extra+=`<div class="slot extra"><h2>${T('wk_x_exposure')}</h2>
      <table><thead><tr><th>${T('wk_x_category')}</th><th class="n">${T('wk_x_count')}</th>${d.canSee?`<th class="n">${jxCurrency()}</th>`:''}</tr></thead>
      <tbody>${keys.map(k=>`<tr><td>${_wkEsc(k?((typeof metaOptLabel==='function')?metaOptLabel(k):k):i18t('reg_uncategorised'))}</td>
        <td class="n">${byCat.get(k).n}</td>${d.canSee?`<td class="n">${_wkEsc(money(byCat.get(k).v))}</td>`:''}</tr>`).join('')}</tbody></table>
      ${(uncapped.length||openPrice.length)?`<div class="more">${[
        uncapped.length?i18tn('wk_x_uncapped',uncapped.length,{n:uncapped.length}):'',
        openPrice.length?i18tn('wk_x_openprice',openPrice.length,{n:openPrice.length}):''
      ].filter(Boolean).join(' ')}</div>`:''}</div>`;
  }
  if(d.tier==='full'){
    const rounds=d.live.map(c=>(c.rounds||[]).length).filter(n=>n>0);
    const avg=rounds.length?(rounds.reduce((a,b)=>a+b,0)/rounds.length):0;
    const slowest=d.live.slice().sort((a,b)=>(b.rounds||[]).length-(a.rounds||[]).length)[0];
    extra+=`<div class="slot extra"><h2>${T('wk_x_nego')}</h2>
      <div class="lead">${rounds.length
        ? i18t('wk_x_nego_body',{a:avg.toFixed(1), c:_wkEsc(slowest?slowest.counterparty||slowest.name:''), n:(slowest&&(slowest.rounds||[]).length)||0})
        : T('wk_x_nego_none')}</div></div>`;
    const top=d.live.slice().filter(c=>d.val(c)>0).sort((a,b)=>d.val(b)-d.val(a)).slice(0,5);
    extra+=`<div class="slot extra"><h2>${T('wk_x_shape')}</h2>
      ${top.length?`<table><thead><tr><th>${T('wk_x_contract')}</th><th>${T('wk_x_party')}</th><th class="n">${jxCurrency()}</th></tr></thead>
        <tbody>${top.map(c=>`<tr><td>${_wkEsc(c.name)}</td><td>${_wkEsc(c.counterparty||'')}</td><td class="n">${_wkEsc(money(d.val(c)))}</td></tr>`).join('')}</tbody></table>`
      :`<div class="quiet">${T('wk_x_shape_none')}</div>`}
      <div class="more">${i18t('wk_x_shape_note',{n:d.live.length})}</div></div>`;
  }

  const when=(()=>{ try{ return new Date().toLocaleDateString(langLocale(),{day:'2-digit',month:'long',year:'numeric'}); }catch(e){ return ''; } })();
  const org=(typeof getOrg==='function'&&getOrg()&&getOrg().name)||'';
  return `<!doctype html><html lang="${(typeof langId==='function')?langId():'en'}"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${_wkEsc(i18t('wk_title'))}</title><style>${WK_CSS}</style></head>
    <body><div class="wrap">
      <header><h1>${_wkEsc(i18t('wk_title'))}</h1>
        <div class="sub">${_wkEsc(org)}${org?' · ':''}${_wkEsc(when)} · ${_wkEsc(i18t('wk_tier_'+d.tier))}</div></header>
      ${s1}${s2}${s3}${s4}${s5}${extra}
      <footer>${i18t('wk_footer')}</footer>
    </div></body></html>`;
}

/* Opened the way the Health Report is: the tab first, synchronously, because a
   popup opened later is a popup the browser blocks. */
function openWeeklyReview(){
  try{ wkRecordSnapshot(); }catch(_){}
  let w=null;
  try{ w=window.open('','_blank'); }catch(_){ w=null; }
  if(!w){ if(typeof toast==='function') toast(i18t('hr_popup_blocked'),'err'); return false; }
  let html='';
  try{ html=buildWeeklyHtml(weeklyData()); }
  catch(e){ html=`<!doctype html><body style="font:15px Inter,-apple-system,Arial;padding:40px;color:#374151">${_wkEsc(i18t('wk_failed'))}</body>`; }
  try{ w.document.open(); w.document.write(html); w.document.close(); }catch(_){}
  return true;
}

Object.assign(window,{WK_TIERS,WK_MAX_ACTIONS,WK_HORIZON,wkTier,wkSetTier,wkKey,wkSnapshots,
  wkRecordSnapshot,wkPrevSnapshot,weeklyData,buildWeeklyHtml,openWeeklyReview});
