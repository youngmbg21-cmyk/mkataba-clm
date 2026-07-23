// HaTi — Home / Portfolio view (Industry redesign).
// The global command bar (index.html) now owns the title/subtitle/search/new;
// this module renders only the portfolio body into #content.
/* ============================================================
   VIEW: DASHBOARD / PORTFOLIO
   ============================================================ */
function renderDashboard(){
  const cs=state.contracts;
  const m=metrics();
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:cs.length;
  const valOf=arr=>arr.reduce((s,c)=>s+Number(c.value||0),0);
  const dU=window.daysUntil||(iso=>Math.ceil((new Date(iso+'T00:00:00')-Date.now())/86400000));
  const idleOf=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:Math.max(0,Math.floor((Date.now()-t)/86400000)); };

  // ---- slices ----
  const STAGE_DEF=[
    {k:'Draft',        label:'Drafting',  color:'#98989b'},
    {k:'Under Review', label:'In Review', color:'#b8862b'},
    {k:'Signed',       label:'Executed',  color:'#2e8763'},
    {k:'Declined',     label:'Closed',    color:'#b0453c'},
  ];
  const stages=STAGE_DEF.map(s=>{ const list=cs.filter(c=>c.status===s.k); return {...s, n:list.length, val:valOf(list)}; });
  const stageTotal=stages.reduce((s,x)=>s+x.n,0)||1;

  const expiring=cs.filter(c=>c.expiry&&c.status!=='Declined').map(c=>({c,d:dU(c.expiry)})).filter(x=>x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  // renewal decisions due (expiry − notice period), within 90 days, live contracts only
  const rdd=window.renewalDecisionDate||(()=>null);
  const decisions=cs.filter(c=>c.status!=='Declined').map(c=>{ const dd=rdd(c); return dd?{c,dd,d:dU(dd)}:null; }).filter(x=>x&&x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
  const fmtDDay=iso=>{ const t=Date.parse((iso||'')+'T00:00:00'); return isNaN(t)?iso:new Date(t).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}); };
  const highRisk=cs.filter(c=>c.status!=='Declined').map(c=>({c,r:contractRisk(c)})).filter(x=>x.r>=60).sort((a,b)=>b.r-a.r);
  const waiting=cs.filter(c=>c.status==='Under Review').map(c=>({c,idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);
  const reviewByRisk=cs.filter(c=>c.status==='Under Review').map(c=>({c,r:contractRisk(c)})).sort((a,b)=>b.r-a.r);

  // ---- KPIs ----
  const newThisWeek=cs.filter(c=>(c.audit||[]).some(a=>/creat/i.test(a.action||'')&&(Date.now()-Date.parse(a.at||0))<7*864e5)).length;
  const stalled=waiting.filter(x=>x.idle>14).length;
  const onExecuted=highRisk.filter(x=>x.c.status==='Signed').length;
  const expValue=valOf(expiring.map(x=>x.c));
  // avg cycle draft→signed from audit where both stamps exist
  const cycles=cs.filter(c=>c.status==='Signed').map(c=>{
    const a=(c.audit||[]); const cr=a.find(x=>/creat/i.test(x.action||'')), sg=a.find(x=>/sign|execut|seal/i.test(x.action||''));
    if(cr&&sg){ const d=(Date.parse(sg.at)-Date.parse(cr.at))/864e5; return d>0?d:null; } return null;
  }).filter(x=>x!=null);
  const avgCycle=cycles.length?(cycles.reduce((s,x)=>s+x,0)/cycles.length).toFixed(1)+'d':'—';

  // Gradient hero cards — one semantic tone per KPI (steel / emerald / amber /
  // amber / ruby / emerald), white text + a 30px white icon tile on top.
  const G={steel:'var(--grad-steel)',green:'var(--grad-emerald)',amber:'var(--grad-amber)',ruby:'var(--grad-ruby)'};
  const kpis=[
    {label:'Under management', val:Number(countAll).toLocaleString('en-KE'), delta:`+${newThisWeek} this week`, grad:G.steel, ic:'building', go:{stage:'all'}},
    {label:'Active value', val:fmtKESshort(m.totalValue), delta:`${Number(m.signed||0).toLocaleString('en-KE')} executed`, grad:G.green, ic:'coins', go:{stage:'all',sort:'value'}},
    {label:'Awaiting counterparty', val:Number(m.pending).toLocaleString('en-KE'), delta:`${stalled} stalled > 14d`, grad:G.amber, ic:'clock', go:{stage:'Under Review'}},
    {label:'Expiring ≤ 90 days', val:Number(expiring.length).toLocaleString('en-KE'), delta:`${fmtKESshort(expValue)} exposure`, grad:G.amber, ic:'calendar', go:{stage:'Signed',sort:'expiry'}},
    {label:'High-risk findings', val:Number(highRisk.length).toLocaleString('en-KE'), delta:`${onExecuted} on executed paper`, grad:G.ruby, ic:'alert', go:{stage:'all',sort:'risk'}},
    {label:'Avg cycle · draft→signed', val:avgCycle, delta:cycles.length?`${cycles.length} signed sampled`:'—', grad:G.green, ic:'clock', go:{stage:'Signed'}},
  ];
  const kpiHtml=kpis.map((k,i)=>`
    <button data-kpi="${i}" style="position:relative;display:flex;flex-direction:column;gap:10px;align-items:flex-start;border:0;border-radius:10px;background:${k.grad};padding:15px 16px;font:inherit;color:#fff;cursor:pointer;text-align:left;box-shadow:var(--shadow-sm);transition:transform .2s var(--ease),box-shadow .2s var(--ease);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)'">
      <span style="display:flex;align-items:center;gap:9px;">
        <span style="width:30px;height:30px;flex:none;border-radius:7px;background:rgba(255,255,255,.22);display:grid;place-items:center;color:#fff;">${icon(k.ic,'w-4 h-4',1.7)}</span>
        <span style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.92);line-height:1.25;">${k.label}</span>
      </span>
      <span class="tnum" style="font-family:var(--font-mono);font-weight:600;font-size:25px;line-height:1.0;color:#fff;">${k.val}</span>
      <span style="font-size:10.5px;color:rgba(255,255,255,.85);font-weight:500;">${k.delta}</span>
    </button>`).join('');

  // ---- segmented stage bar + cards ----
  const segBar=stages.map((s,i)=>`<span style="width:${(s.n/stageTotal*100).toFixed(2)}%;background:${s.color};"></span>`).join('');
  const stageCards=stages.map(s=>`
    <button data-stage="${s.k}" style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;border:1px solid var(--color-divider);border-radius:8px;background:var(--color-bg);padding:10px 12px;font:inherit;color:inherit;cursor:pointer;text-align:left;" onmouseover="this.style.borderColor='var(--color-accent)';this.style.background='rgba(89,128,166,.05)'" onmouseout="this.style.borderColor='var(--color-divider)';this.style.background='var(--color-bg)'">
      <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;"><span style="width:8px;height:8px;border-radius:50%;background:${s.color};"></span>${s.label}</span>
      <span class="tnum" style="font-family:var(--font-mono);font-weight:600;font-size:19px;line-height:1.1;">${s.n.toLocaleString('en-KE')}</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600);">${s.n.toLocaleString('en-KE')} · ${fmtKESshort(s.val)}</span>
    </button>`).join('');

  // ---- needs your action ----
  const actionRows=reviewByRisk.slice(0,5).map(x=>{ const c=x.c;
    return `<button data-sel="${c.id}" style="display:flex;align-items:center;gap:9px;width:100%;padding:6px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.07);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-600);width:56px;flex:none;">${c.id}</span>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;font-weight:500;">${c.name}</span>
      <span style="font-size:11px;color:var(--color-neutral-600);width:110px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.counterparty||'—'}</span>
      ${riskChip(x.r)}
      ${statusChip(c.status)}
    </button>`; }).join('') || `<div style="font-size:11.5px;color:var(--color-neutral-600);padding:8px 4px;">Nothing waiting on your review.</div>`;

  // ---- renewal pipeline (6 mo) ----
  const now=new Date(); const months=[];
  for(let i=0;i<6;i++){ const d=new Date(now.getFullYear(),now.getMonth()+i,1); months.push({y:d.getFullYear(),mo:d.getMonth(),label:d.toLocaleDateString('en-KE',{month:'short'}),v:0}); }
  cs.forEach(c=>{ if(!c.expiry||c.status==='Declined') return; const t=Date.parse(c.expiry); if(isNaN(t)) return; const d=new Date(t); const b=months.find(x=>x.y===d.getFullYear()&&x.mo===d.getMonth()); if(b) b.v+=Number(c.value||0); });
  const pipeMax=Math.max(1,...months.map(x=>x.v));
  const pipeTotal=months.reduce((s,x)=>s+x.v,0);
  const pipeCount=cs.filter(c=>{ if(!c.expiry||c.status==='Declined') return false; const t=Date.parse(c.expiry); if(isNaN(t)) return false; const d=new Date(t); return months.some(x=>x.y===d.getFullYear()&&x.mo===d.getMonth()); }).length;
  const pipeBars=months.map(x=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-family:var(--font-mono);font-size:11px;width:44px;color:var(--color-neutral-700);">${x.label}</span>
      <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden;"><div style="width:${(x.v/pipeMax*100).toFixed(1)}%;height:100%;background:var(--color-accent);border-radius:999px;"></div></div>
      <span class="tnum" style="font-size:10.5px;width:66px;text-align:right;color:var(--color-neutral-700);">${x.v?fmtKESshort(x.v).replace('KES ',''):'—'}</span>
    </div>`).join('');

  // ---- approvals waiting ----
  const apprRows=waiting.slice(0,3).map((x,i)=>{ const c=x.c; const dotc=i===1?'#b0453c':'#b8862b';
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(29,31,32,.07);font-size:12px;">
      <span style="width:7px;height:7px;border-radius:50%;background:${dotc};flex:none;"></span>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.value>=(getApprovalCfg().threshold||0)?'CFO sign-off':'Legal review'} — ${c.counterparty||c.name}${isMonetary(c)&&c.value?` (${fmtKESshort(c.value)})`:''}</span>
      <span style="font-size:10.5px;color:var(--color-neutral-600);flex:none;">${x.idle}d</span>
    </div>`; }).join('') || `<div style="font-size:11.5px;color:var(--color-neutral-600);padding:6px 0;">No approvals pending.</div>`;

  // ---- attention columns ----
  const attnRow=(c,tag,tagColor)=>`
    <button data-sel="${c.id}" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 12px;border:0;border-bottom:1px solid rgba(29,31,32,.06);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.id} · ${c.counterparty||'—'}</span>
      </span>
      <span style="font-size:10.5px;font-weight:600;font-family:var(--font-mono);color:${tagColor};flex:none;">${tag}</span>
    </button>`;
  const attnCol=(title,dot,rows,total,wash)=>`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${wash};border-bottom:1px solid var(--color-divider);">
        <span style="display:flex;align-items:center;gap:7px;font-family:var(--font-mono);font-weight:600;font-size:14px;"><span style="width:8px;height:8px;border-radius:50%;background:${dot};"></span>${title}</span>
        <span style="font-size:10.5px;color:var(--color-neutral-600);">${total} shown</span>
      </div>
      ${rows||`<div style="padding:14px 12px;font-size:11.5px;color:var(--color-neutral-600);">Nothing to show.</div>`}
    </section>`;
  // ---- decisions due (leads the page: the thing you open HaTi to act on) ----
  const decisionRows=decisions.slice(0,6).map(x=>{ const c=x.c, urgent=x.d<=30;
    return `<div style="display:flex;align-items:center;gap:11px;padding:9px 4px;border-bottom:1px solid rgba(29,31,32,.07)">
      <span style="width:9px;height:9px;border-radius:50%;background:${urgent?'#b0453c':'#b8862b'};flex:none"></span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</span>
        <span style="display:block;font-size:11px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.counterparty||'—'} · decide by ${fmtDDay(x.dd)}</span>
      </span>
      <span style="font-size:11.5px;font-weight:600;font-family:var(--font-mono);color:${urgent?'#8f322b':'#7d5a14'};flex:none;white-space:nowrap">${x.d===0?'today':'in '+x.d+'d'}</span>
      <button data-act-decide="${c.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 13px;flex:none">Act</button>
    </div>`; }).join('');
  const decisionsSection=`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);border-left:3px solid var(--color-accent);box-shadow:var(--shadow-sm);border-radius:10px;padding:12px 14px">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:${decisions.length?'6px':'0'}">
        <h4 style="font-size:15px;margin:0;display:flex;align-items:center;gap:8px">Decisions due
          ${decisions.length?`<span style="font-size:11px;font-weight:600;font-family:var(--font-mono);color:var(--color-accent-700);background:var(--color-accent-100);border-radius:999px;padding:1px 8px">${decisions.length}</span>`:''}</h4>
        ${decisions.length>6?`<button data-open-decisions style="border:0;background:none;cursor:pointer;font-size:11px;color:var(--color-accent-700);font-weight:500;padding:0">See all in the calendar →</button>`:''}
      </div>
      ${decisions.length?decisionRows
        :`<div style="display:flex;align-items:center;gap:10px;padding:6px 2px;font-size:12.5px;color:var(--color-neutral-600)"><span style="color:#1e6b4d;display:inline-flex">${icon('check2','w-4 h-4')}</span>No renewal decisions due in the next 90 days — you're all caught up.</div>`}
    </section>`;
  // ---- out with counterparties (share dispatch traffic lights) ----
  const so=state.shareOverview||{}; const shCounts=so.counts||{}; const shItems=(so.items||[]).slice();
  const needAttn=(shCounts.changes||0)+(shCounts.declined||0);
  const shPri={changes:0,declined:1,opened:2,sent:3,signed:4,expired:5,revoked:6};
  shItems.sort((a,b)=>(shPri[a.state]??9)-(shPri[b.state]??9));
  const shCountChip=(st,n)=>{ if(!n) return ''; const m=SHARE_META[st];
    return `<span class="badge" style="background:${m.bg};color:${m.tx}"><span class="dot" style="background:${m.dot}"></span>${n} ${m.label.toLowerCase()}</span>`; };
  const sharesStrip=(API_MODE()&&shItems.length)?`
    <section style="background:var(--color-surface);border:1px solid var(--color-divider);${needAttn?'border-left:3px solid #b8862b;':''}box-shadow:var(--shadow-sm);border-radius:10px;padding:12px 14px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <h4 style="font-size:15px;margin:0">Out with counterparties</h4>
        ${needAttn?`<span style="font-size:11px;font-weight:600;font-family:var(--font-mono);color:#7d5a14;background:#fbf4e3;border-radius:999px;padding:1px 8px">${needAttn} need${needAttn===1?'s':''} your attention</span>`:''}
        <span style="flex:1"></span>
        ${['sent','opened','changes','signed','declined'].map(st=>shCountChip(st,shCounts[st])).join(' ')}
      </div>
      ${shItems.slice(0,5).map(it=>`
        <button data-share-open="${it.contractId}" style="display:flex;align-items:center;gap:10px;width:100%;padding:6px 4px;border:0;border-bottom:1px solid rgba(29,31,32,.07);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">
          ${shareChip(it.state)}
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.name}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.contractId} · with ${it.recipientName||it.recipientEmail||it.counterparty||'counterparty'} · via ${it.channel==='whatsapp'?'WhatsApp':it.channel==='email'?'email':'link'}</span>
          </span>
          <span style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);flex:none;white-space:nowrap">${fmtDT(it.at)}</span>
        </button>`).join('')}
    </section>`:'';
  const expRows=expiring.slice(0,5).map(x=>attnRow(x.c,'in '+x.d+'d',x.d<=30?'#8f322b':'#7d5a14')).join('');
  const riskRows=highRisk.slice(0,5).map(x=>attnRow(x.c,'R '+x.r,'#8f322b')).join('');
  const waitRows=waiting.slice(0,5).map(x=>attnRow(x.c,x.idle+'d idle',x.idle>=30?'#8f322b':'#7d5a14')).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="display:flex;flex-direction:column;gap:18px;padding:16px 18px 28px;">

    <!-- KPI ribbon — gradient hero cards -->
    <section style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;">
      ${kpiHtml}
    </section>

    <!-- Decisions due — leads with what needs acting on, not statistics -->
    ${decisionsSection}

    <!-- Share dispatch traffic lights -->
    ${sharesStrip}

    <!-- Stage + pipeline row -->
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;align-items:start;">
      <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;padding:12px 14px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:9px;">
          <h4 style="font-size:15px;margin:0;">Portfolio by stage</h4>
          <button data-open-register style="border:0;background:none;cursor:pointer;font-size:11px;color:var(--color-accent-700);font-weight:500;padding:0;">Open full register →</button>
        </div>
        <div style="display:flex;height:9px;overflow:hidden;margin-bottom:10px;border-radius:999px;">${segBar}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">${stageCards}</div>
        <div style="margin-top:12px;border-top:1px solid var(--color-divider);padding-top:10px;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
            <h6 style="margin:0;font-size:10.5px;color:var(--color-neutral-700);letter-spacing:.08em;text-transform:uppercase;">Needs your action</h6>
            <span style="font-size:10px;color:var(--color-neutral-600);">sorted by risk</span>
          </div>
          ${actionRows}
        </div>
      </section>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;padding:12px 14px;">
          <h4 style="font-size:15px;margin:0 0 8px;">Renewal pipeline · 6 mo</h4>
          ${pipeBars}
          <div style="font-size:10.5px;color:var(--color-neutral-600);margin-top:4px;">${fmtKESshort(pipeTotal)} in expiries · ${pipeCount} contract${pipeCount===1?'':'s'}</div>
        </section>
        <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;padding:12px 14px;">
          <h4 style="font-size:15px;margin:0 0 8px;">Approvals waiting</h4>
          ${apprRows}
        </section>
      </div>
    </div>

    <!-- Attention columns -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start;">
      ${attnCol('Expiring soon','#b8862b',expRows,expiring.length,'#fbf4e3')}
      ${attnCol('Highest risk','#b0453c',riskRows,highRisk.length,'#fdece9')}
      ${attnCol('Waiting longest','#2e8763',waitRows,waiting.length,'#e8f4ee')}
    </div>
  </div>`;

  // ---- wiring ----
  const goReg=g=>{ const R=regState(); R.stage=g.stage||'all'; R.type='all'; if(g.sort) R.sort=g.sort; R.sel={}; setView('register'); };
  document.querySelectorAll('[data-kpi]').forEach(el=>el.addEventListener('click',()=>goReg(kpis[+el.getAttribute('data-kpi')].go)));
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>{ const R=regState(); R.stage=el.getAttribute('data-stage'); R.type='all'; R.sel={}; setView('register'); }));
  document.querySelectorAll('[data-open-register]').forEach(el=>el.addEventListener('click',()=>{ const R=regState(); R.stage='all'; R.sel={}; setView('register'); }));
  document.querySelectorAll('[data-sel]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-sel'))));
  document.querySelectorAll('[data-act-decide]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-act-decide'))));
  document.querySelectorAll('[data-share-open]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-share-open'))));
  document.querySelectorAll('[data-open-decisions]').forEach(el=>el.addEventListener('click',()=>setView('calendar')));
  setActiveNav('dashboard');
}

Object.assign(window,{renderDashboard});
