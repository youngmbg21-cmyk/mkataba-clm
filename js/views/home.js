// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: DASHBOARD (lean — attention queue + folders, no giant table)
   ============================================================ */
function renderDashboard(){
  const cs=state.contracts;
  const m=metrics();
  const countAll = (state.serverStats && state.serverStats.total!=null) ? state.serverStats.total : cs.length;

  // ---- per-stage counts & values (design "Portfolio by stage") ----
  const STAGE_DEF=[
    {k:'Draft',        label:'Drafting',  color:'#9A9484'},
    {k:'Under Review', label:'In Review', color:'#C79A3E'},
    {k:'Signed',       label:'Executed',  color:'#086B54'},
    {k:'Declined',     label:'Closed',    color:'#B23A2E'},
  ];
  const valOf = arr => arr.reduce((s,c)=>s+Number(c.value||0),0);
  const stages = STAGE_DEF.map(s=>{ const list=cs.filter(c=>c.status===s.k); return {...s, n:list.length, val:valOf(list)}; });
  const stageTotal = stages.reduce((s,x)=>s+x.n,0)||1;

  // ---- attention slices ----
  const expiring = cs.filter(c=>c.expiry && c.status!=='Declined')
    .map(c=>({c, d:daysUntil(c.expiry)})).filter(x=>x.d>=0 && x.d<=90).sort((a,b)=>a.d-b.d);
  const highRisk = cs.map(c=>({c, o:openFindings(c).filter(f=>f.sev==='high').length, r:riskScore(c)}))
    .filter(x=>x.o>0).sort((a,b)=>b.r-a.r);
  const idleOf = c => Math.max(0, Math.floor((Date.now()-new Date(c.lastAction))/86400000));
  const waiting = cs.filter(c=>c.status==='Under Review')
    .map(c=>({c, idle:idleOf(c)})).sort((a,b)=>b.idle-a.idle);

  const kpis=[
    {label:'Contracts under management', val:Number(countAll).toLocaleString('en-KE'), ic:'file',  bg:'#EEF2F0', color:'#5B6B64', num:'#08211E', go:{stage:'all'}},
    {label:'Active portfolio value',     val:fmtKESshort(m.totalValue),               ic:'coins', bg:'#E4EFE7', color:'#086B54', num:'#086B54', go:{stage:'all',sort:'value'}},
    {label:'Awaiting counterparty',      val:Number(m.pending).toLocaleString('en-KE'),ic:'clock', bg:'#F0E6CF', color:'#8A5E1B', num:'#B0791F', go:{stage:'Under Review'}},
    {label:'Expiring within 90 days',    val:Number(expiring.length).toLocaleString('en-KE'), ic:'calendar', bg:'#F0E6CF', color:'#8A5E1B', num:'#B0791F', go:{stage:'Signed',sort:'expiry'}},
    {label:'High-risk open findings',    val:Number(highRisk.length).toLocaleString('en-KE'), ic:'alert', bg:'#F4E2DD', color:'#9A342A', num:'#C0392B', go:{stage:'all'}},
  ];
  const kpiHtml = kpis.map((k,i)=>`
    <button data-kpi="${i}" class="text-left bg-white rounded-2xl elev-2 lift px-4 py-3.5" style="animation:rowIn .45s var(--ease) both;animation-delay:${i*45}ms">
      <span class="h-[32px] w-[32px] grid place-items-center rounded-lg mb-2.5" style="background:${k.bg};color:${k.color}">${icon(k.ic,'w-[15px] h-[15px]')}</span>
      <div class="font-display font-800 text-[25px] tracking-[-0.035em] leading-none tnum" style="color:${k.num}">${k.val}</div>
      <div class="text-[11px] font-500 text-ink/70 mt-2">${k.label}</div>
    </button>`).join('');

  // segmented stage bar
  const segBar = stages.map(s=>`<span style="width:${(s.n/stageTotal*100).toFixed(2)}%;background:${s.color}" class="h-2.5 first:rounded-l-full last:rounded-r-full"></span>`).join('');
  const stageCards = stages.map(s=>`
    <button data-stage="${s.k}" class="group flex items-center justify-between gap-2 rounded-xl bg-white elev-2 lift px-4 py-3.5 text-left">
      <span class="min-w-0">
        <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full" style="background:${s.color}"></span><span class="text-sm font-medium text-brand-900">${s.label}</span></span>
        <span class="block mt-1 text-[11px] font-mono text-brand-800/70">${s.n.toLocaleString('en-KE')} · ${fmtKESshort(s.val)}</span>
      </span>
      <span class="text-brand-300 group-hover:text-brand-500 transition shrink-0">${icon('chevR')}</span>
    </button>`).join('');

  // donut: 88px conic-gradient ring with a white 11px-inset inner circle (per spec)
  const donut=(count,pct,color)=>{ const deg=(Math.min(100,Math.max(0,pct))*3.6).toFixed(1);
    return `<div class="relative shrink-0" style="width:88px;height:88px;border-radius:9999px;background:conic-gradient(${color} ${deg}deg,#E4DDD2 0deg)">
      <div class="absolute inset-[11px] rounded-full bg-white grid place-content-center text-center">
        <div class="font-display font-700 leading-none" style="font-size:22px;color:#08211E">${count}</div>
        <div class="font-mono font-600 mt-1" style="font-size:10px;color:${color}">${pct.toFixed(1)}%</div>
      </div>
    </div>`; };
  const snap=[
    {go:{stage:'Signed',sort:'expiry'}, donut:donut(expiring.length, countAll?expiring.length/countAll*100:0, '#B0791F'), title:'Expiring ≤ 90 days', sub:`${expiring.length} of ${Number(countAll).toLocaleString('en-KE')} contracts`},
    {go:{stage:'all'}, donut:donut(highRisk.length, countAll?highRisk.length/countAll*100:0, '#C0392B'), title:'High-risk findings', sub:`${highRisk.length} of ${Number(countAll).toLocaleString('en-KE')} contracts`},
    {go:{stage:'Under Review'}, donut:donut(m.pending, countAll?m.pending/countAll*100:0, '#086B54'), title:'Awaiting counterparty', sub:`${m.pending} of ${Number(countAll).toLocaleString('en-KE')} contracts`},
  ];
  const snapHtml = snap.map((s,i)=>`
    <button data-snap="${i}" class="text-left flex items-center gap-4 rounded-[14px] bg-white elev-2 lift px-4 py-4 transition">
      ${s.donut}
      <div class="min-w-0"><div class="text-sm font-600 text-ink">${s.title}</div><div class="text-[11px] text-ink/70 mt-0.5">${s.sub}</div></div>
    </button>`).join('');

  // attention column row (name + meta + right tag)
  const attnRow=(c,tag,tagColor)=>`
    <button data-open="${c.id}" class="w-full text-left group flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50/40 transition border-b border-brand-100/50 last:border-0">
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-brand-900 truncate group-hover:text-brand-600 transition">${c.name}</span>
        <span class="block text-[11px] font-mono text-brand-800/65 truncate">${c.id} · ${c.counterparty||'—'}${isMonetary(c)&&c.value?' · '+fmtKESshort(c.value):''}</span>
      </span>
      <span class="shrink-0 text-[11px] font-mono font-semibold whitespace-nowrap" style="color:${tagColor}">${tag}</span>
    </button>`;
  const emptyCol = msg => `<div class="px-4 py-8 text-center text-xs text-brand-800/65">${msg}</div>`;
  const col=(icon_,accent,title,total,rows,empty)=>`
    <section class="bg-white rounded-2xl elev-2 overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-brand-100/60">
        <div class="flex items-center gap-2"><span style="color:${accent}">${icon(icon_)}</span><h3 class="font-display font-600 text-sm text-brand-900">${title}</h3></div>
        <span class="text-[11px] font-mono text-brand-800/60">${total} total</span>
      </div>
      <div class="flex-1">${rows||empty}</div>
      <button data-view-intel class="text-[11px] font-medium text-brand-600 hover:text-brand-800 px-4 py-2.5 border-t border-brand-100/60 text-left transition">View all in Portfolio Intelligence →</button>
    </section>`;

  const expRows = expiring.slice(0,5).map(x=>attnRow(x.c, x.d===0?'today':'in '+x.d+'d', x.d<=14?'#9A342A':'#8A5E1B')).join('');
  const riskRows = highRisk.slice(0,5).map(x=>attnRow(x.c, x.o+' high', '#9A342A')).join('');
  const waitRows = waiting.slice(0,5).map(x=>attnRow(x.c, x.idle+'d idle', x.idle>=30?'#9A342A':'#8A5E1B')).join('');

  // New-contract menu (guided wizard + templates + upload), role-gated
  const creatable = (window.myCreatableTemplates?myCreatableTemplates():Object.values(TEMPLATES));
  const menuItems = creatable.map(t=>`
    <button data-new="${t.id}" class="w-full flex items-center gap-2.5 rounded-lg hover:bg-brand-50 px-2.5 py-2 transition text-left">
      <span class="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-brand-900 text-gold-400">${icon(t.ic)}</span>
      <span class="min-w-0"><span class="block text-xs font-medium text-brand-900 truncate">${t.name}</span><span class="block text-[10px] text-brand-800/65">Template ${t.id}</span></span>
    </button>`).join('');

  document.getElementById('content').innerHTML = `
  <div class="view-enter">
    <header class="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 flex items-center justify-between gap-4 max-w-[1280px] mx-auto w-full">
        <div>
          <h1 class="font-display font-700 text-[26px] tracking-tight text-ink">Portfolio</h1>
          <p class="text-[13px] text-ink/70"><span class="tnum">${Number(countAll).toLocaleString('en-KE')}</span> contracts under management · <span class="tnum">${fmtKESshort(m.totalValue)}</span> active</p>
        </div>
        <div class="flex items-center gap-3">
          <button id="topbar-ai" class="hidden md:flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-brand-800/70 w-72 hover:border-brand-300 transition text-left">
            ${icon('sparkle','w-4 h-4 text-gold-500')}<span class="flex-1 truncate">Search contracts, or ask AI…</span>
            <kbd class="text-[10px] font-mono bg-canvas border border-brand-100 rounded px-1.5 py-0.5 text-brand-800/60">/</kbd>
          </button>
          <div class="relative">
            <button id="folders-btn" class="flex items-center gap-2 rounded-xl border border-inputln bg-white px-3.5 py-2.5 text-sm font-medium text-ink/70 hover:border-brand-300 transition">${icon('folder','w-4 h-4 text-brand-500')} Folders ${icon('chevD','w-3.5 h-3.5')}</button>
            <div id="folders-menu" class="hidden absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-brand-100 shadow-xl shadow-brand-900/10 p-2 z-40">
              <div class="px-2 py-1.5 text-[10px] uppercase tracking-wider text-ink/65 font-semibold">Value streams</div>
              ${Object.values(FOLDERS).map(f=>`<button data-open-folder="${f.id}" class="w-full flex items-center gap-2.5 rounded-lg hover:bg-brand-50 px-2.5 py-2 transition text-left">
                <span class="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-600">${icon(f.ic,'w-4 h-4')}</span>
                <span class="min-w-0 flex-1 text-xs font-medium text-ink truncate">${f.name}</span>
                <span class="text-[11px] font-mono text-ink/40">${folderContracts(f.id).length}</span>
              </button>`).join('')}
            </div>
          </div>
          <div class="relative">
            <button id="new-contract-btn" class="flex items-center gap-2 rounded-xl bg-brand-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition shadow-sm">${icon('plus','w-4 h-4')} New contract</button>
            <div id="new-menu" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-brand-100 shadow-xl shadow-brand-900/10 p-2 z-40 max-h-[70vh] overflow-y-auto scroll-thin">
              <button id="menu-wizard" class="w-full flex items-center gap-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 px-2.5 py-2 transition text-left mb-1">
                <span class="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-brand-600 text-white">${icon('sparkle')}</span>
                <span class="min-w-0"><span class="block text-xs font-semibold text-brand-900">Guided setup</span><span class="block text-[10px] text-brand-800/65">Pick a template &amp; answer a few questions</span></span>
              </button>
              <div class="px-2 py-1.5 text-[10px] uppercase tracking-wider text-brand-800/65 font-semibold">Or generate directly</div>
              ${menuItems}
              <div class="mt-1 pt-1 border-t border-brand-100/60">
                <button id="menu-upload" class="w-full flex items-center gap-2.5 rounded-lg hover:bg-gold-500/10 px-2.5 py-2 transition text-left">
                  <span class="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-gold-500 text-brand-900">${icon('upload')}</span>
                  <span class="min-w-0"><span class="block text-xs font-semibold text-brand-900">Upload a received contract</span><span class="block text-[10px] text-brand-800/65">Their paper — review, scan &amp; sign</span></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="px-8 py-7 max-w-[1280px] mx-auto w-full space-y-7">
      <!-- KPI strip -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">${kpiHtml}</div>

      <!-- Portfolio by stage -->
      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-600 text-brand-900">Portfolio by stage</h2>
          <button data-open-register class="text-xs font-medium text-brand-600 hover:text-brand-800 transition">Open full register →</button>
        </div>
        <div class="flex w-full overflow-hidden rounded-full mb-4 bg-brand-100/40">${segBar}</div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${stageCards}</div>
      </section>

      <!-- Attention snapshot -->
      <section class="bg-white rounded-2xl elev-2 p-5">
        <h2 class="font-display font-600 text-brand-900">Attention snapshot</h2>
        <p class="text-xs text-brand-800/70 mt-0.5 mb-4">Share of the book that needs a closer look right now.</p>
        ${(()=>{ const od=overdueObligationCount(), rd=renewalDecisionsDue(30).length;
          const pbDev=state.contracts.reduce((s,c)=>{ const sm=window.deviationSummary?deviationSummary(c):null; return s+(sm?sm.dev+sm.miss:0); },0);
          if(!od&&!rd&&!pbDev) return '';
          return `<button data-goto-calendar class="w-full mb-4 flex items-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/8 px-4 py-2.5 text-left hover:bg-gold-500/12 transition">
            <span class="text-gold-600">${icon('calendar','w-4 h-4')}</span>
            <span class="text-[13px] text-ink/80">${[od?`<b class="text-rose-600">${od}</b> obligation${od===1?'':'s'} overdue`:'', rd?`<b class="text-gold-600">${rd}</b> renewal decision${rd===1?'':'s'} due in 30 days`:'', pbDev?`<b class="text-gold-600">${pbDev}</b> playbook deviation${pbDev===1?'':'s'}`:''].filter(Boolean).join(' · ')}</span>
            <span class="ml-auto text-[11px] font-600 text-brand-600">Open calendar →</span>
          </button>`; })()}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">${snapHtml}</div>
      </section>

      <!-- Three attention columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        ${col('history','#8A5E1B','Expiring soon',expiring.length,expRows,emptyCol('Nothing expiring in the next 90 days.'))}
        ${col('alert','#9A342A','Highest risk',highRisk.length,riskRows,emptyCol('No high-risk findings open.'))}
        ${col('clock','#086B54','Waiting longest',waiting.length,waitRows,emptyCol('Nothing waiting on a counterparty.'))}
      </div>
    </div>
  </div>`;

  wireOpens();
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>{ regState().stage=el.getAttribute('data-stage'); regState().type='all'; regState().sel={}; setView('register'); }));
  document.querySelectorAll('[data-open-register]').forEach(el=>el.addEventListener('click',()=>{ regState().stage='all'; regState().sel={}; setView('register'); }));
  const goReg=g=>{ const R=regState(); R.stage=g.stage||'all'; R.type='all'; if(g.sort) R.sort=g.sort; R.sel={}; setView('register'); };
  document.querySelectorAll('[data-kpi]').forEach(el=>el.addEventListener('click',()=>goReg(kpis[+el.getAttribute('data-kpi')].go)));
  document.querySelectorAll('[data-snap]').forEach(el=>el.addEventListener('click',()=>goReg(snap[+el.getAttribute('data-snap')].go)));
  document.querySelectorAll('[data-view-intel]').forEach(el=>el.addEventListener('click',()=>setView('intel')));
  document.querySelector('[data-goto-calendar]')?.addEventListener('click',()=>setView('calendar'));
  document.querySelectorAll('[data-new]').forEach(el=>el.addEventListener('click',()=>createFromTemplate(el.getAttribute('data-new'))));
  const nb=document.getElementById('new-contract-btn'), nm=document.getElementById('new-menu');
  nb.addEventListener('click',e=>{ e.stopPropagation(); nm.classList.toggle('hidden'); });
  document.addEventListener('click',e=>{ if(nm && !nm.classList.contains('hidden') && !nm.contains(e.target) && e.target!==nb) nm.classList.add('hidden'); });
  document.getElementById('menu-upload').addEventListener('click',openUploadModal);
  document.getElementById('menu-wizard')?.addEventListener('click',()=>openWizard());
  document.getElementById('topbar-ai').addEventListener('click',()=>openAI());
  const fb=document.getElementById('folders-btn'), fm=document.getElementById('folders-menu');
  fb.addEventListener('click',e=>{ e.stopPropagation(); fm.classList.toggle('hidden'); });
  document.addEventListener('click',e=>{ if(fm && !fm.classList.contains('hidden') && !fm.contains(e.target) && e.target!==fb) fm.classList.add('hidden'); });
  document.querySelectorAll('[data-open-folder]').forEach(el=>el.addEventListener('click',()=>openFolder(el.getAttribute('data-open-folder'))));
  setActiveNav('dashboard');
}

Object.assign(window,{renderDashboard});
