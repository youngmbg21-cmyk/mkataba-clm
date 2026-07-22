// HaTi — E3 obligations + renewal decisions. Globals window-attached.

const OBLIG_RECUR = [['none','One-off'],['monthly','Monthly'],['quarterly','Quarterly'],['annual','Annual']];

/* The date by which a renewal decision must be made: expiry minus the notice
   period (from E1 metadata). Null when we don't know both. */
function renewalDecisionDate(c){
  const expiry = (c.metadata&&c.metadata.expiryDate) || c.expiry;
  const notice = c.metadata&&Number(c.metadata.noticePeriodDays)||0;
  if(!expiry) return null;
  if(!notice) return expiry;                 // no notice period known — decide by expiry
  const d = new Date(expiry+'T00:00:00'); d.setDate(d.getDate()-notice);
  return d.toISOString().slice(0,10);
}
function obState(o){
  if(o.status==='done') return 'done';
  if(o.due && daysUntil(o.due)<0) return 'overdue';
  return 'open';
}
function contractObligations(c){ return (c.obligations||[]); }
function allObligations(){
  const out=[];
  state.contracts.forEach(c=>{ (c.obligations||[]).forEach(o=>out.push({...o, cid:c.id, cname:c.name})); });
  return out;
}
function overdueObligationCount(){ return allObligations().filter(o=>obState(o)==='overdue').length; }
function renewalDecisionsDue(withinDays=30){
  const out=[];
  state.contracts.forEach(c=>{ if(c.status==='Declined'||c.status==='Signed'&&!c.metadata) {/*keep signed w/ renewal*/}
    const dd=renewalDecisionDate(c); if(dd){ const d=daysUntil(dd); if(d>=0&&d<=withinDays) out.push({cid:c.id, cname:c.name, decideBy:dd, days:d}); } });
  return out.sort((a,b)=>a.days-b.days);
}

/* ---- heuristic obligation finder (no key): payment/notice/reporting cues ---- */
function heuristicObligations(text, c){
  const t=String(text||''); const out=[];
  const add=(desc,quote)=>{ if(out.length<8) out.push({desc, quote:quote?quote.slice(0,160):'', due:'', recurring:'none'}); };
  const sent = t.split(/(?<=[.;])\s+/);
  sent.forEach(s=>{
    if(/\bshall\s+(pay|remit|invoice)\b/i.test(s) && out.every(o=>!/pay/i.test(o.desc))) add('Payment obligation', s);
    else if(/\b(\d{1,3})\s+days'?\s+(?:written\s+)?notice\b/i.test(s)) add('Notice / termination obligation', s);
    else if(/\b(monthly|quarterly|annual|annually|weekly)\b[^.]*\b(report|statement|forecast|return)\b/i.test(s) || /\b(report|statement|forecast)\b[^.]*\b(monthly|quarterly|annually)\b/i.test(s)) add('Reporting obligation', s);
    else if(/\b(deliver|supply|provide)\b.*\bwithin\b/i.test(s) && out.every(o=>!/deliver/i.test(o.desc))) add('Delivery obligation', s);
    else if(/\b(insurance|indemnif|maintain\s+cover)\b/i.test(s) && out.every(o=>!/insurance/i.test(o.desc))) add('Insurance / indemnity obligation', s);
  });
  return out;
}
async function extractObligations(c){
  const text = isUpload(c) ? (c.upload&&c.upload.extractedText)||'' : (window.contractPlainText?contractPlainText(c):'');
  if(!text || text.length<120){ toast('No readable clause text to scan for obligations','err'); return []; }
  if(API_MODE() && state.aiConfigured){
    try{ const r=await api('ai/obligations','POST',{ text:text.slice(0,20000) }); return r.obligations||[]; }
    catch(e){ toast('AI obligation scan unavailable — using a basic scan','err'); }
  }
  return heuristicObligations(text, c);
}

/* ---- workspace obligations section ---- */
function renderObligationsSection(c){
  const host=document.getElementById('obligations-section'); if(!host) return;
  const obs=c.obligations||[];
  const editable=canEdit()&&c.status!=='Signed';
  const dd=renewalDecisionDate(c);
  if(!obs.length && !editable && !dd){ host.innerHTML=''; return; }   // nothing to show; empty:hidden collapses it
  const chip=st=>st==='overdue'?'bg-rose-50 text-rose-600 border-rose-200':st==='done'?'bg-brand-50 text-brand-600 border-brand-200':'bg-gold-500/10 text-gold-600 border-gold-500/25';
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-brand-500">${icon('calendar')}</span>
        <h3 class="text-sm font-display font-600 text-ink">Obligations</h3>
        <span class="ml-auto text-[10px] font-mono text-ink/60">${obs.length}</span>
      </div>
      ${dd?`<div class="mb-3 rounded-lg border ${daysUntil(dd)<0?'border-rose-200 bg-rose-50':'border-gold-500/25 bg-gold-500/8'} px-3 py-2 text-[11px]">
        <span class="font-600 text-ink">Renewal decision by ${dd}</span> <span class="text-ink/60">· ${daysUntil(dd)<0?'passed':daysUntil(dd)+' days'}${c.metadata&&c.metadata.noticePeriodDays?` (expiry ${(c.metadata.expiryDate||c.expiry)} − ${c.metadata.noticePeriodDays}d notice)`:''}</span></div>`:''}
      ${obs.length?`<div class="space-y-1.5 mb-2">${obs.map((o,i)=>{ const st=obState(o); return `
        <div class="rounded-lg border border-line bg-white px-3 py-2">
          <div class="flex items-center gap-2 text-[12px]">
            <span class="inline-block rounded-full border ${chip(st)} px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide">${st}</span>
            <span class="text-ink font-500 truncate">${(o.desc||'').replace(/</g,'&lt;')}</span>
            <span class="ml-auto shrink-0 text-[10px] font-mono text-ink/55">${o.due||'no date'}</span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-[10px] text-ink/55">
            ${o.recurring&&o.recurring!=='none'?`<span>${(OBLIG_RECUR.find(r=>r[0]===o.recurring)||[])[1]}</span>·`:''}
            <span>${o.assignee||'unassigned'}</span>
            ${editable?`<span class="ml-auto flex gap-2">
              <button data-ob-toggle="${i}" class="text-brand-600 hover:text-brand-800 font-600">${o.status==='done'?'reopen':'done'}</button>
              <button data-ob-del="${i}" class="text-rose-500 hover:text-rose-700">remove</button></span>`:''}
          </div>
          ${o.quote?`<div class="mt-1 text-[10px] text-ink/50 italic border-l-2 border-line pl-2">“${o.quote.replace(/</g,'&lt;')}”</div>`:''}
        </div>`; }).join('')}</div>`
      :`<p class="text-[11px] text-ink/60 mb-2">No obligations tracked yet.</p>`}
      ${editable?`<div class="flex flex-wrap gap-2">
        <button id="ob-add" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-600 hover:bg-brand-50 transition">${icon('plus','w-3 h-3')} Add obligation</button>
        <button id="ob-find" class="flex items-center gap-1.5 rounded-lg border border-gold-500/30 text-gold-600 px-3 py-1.5 text-[11px] font-600 hover:bg-gold-500/10 transition">${icon('sparkle','w-3 h-3')} Find obligations</button>
      </div>`:''}
    </div>`;
  host.querySelectorAll('[data-ob-toggle]').forEach(b=>b.addEventListener('click',()=>{ const o=obs[Number(b.getAttribute('data-ob-toggle'))]; o.status=o.status==='done'?'open':'done'; logAudit(c,'Obligation',`${o.status==='done'?'Completed':'Reopened'}: ${o.desc}`); persist(c); renderObligationsSection(c); }));
  host.querySelectorAll('[data-ob-del]').forEach(b=>b.addEventListener('click',()=>{ obs.splice(Number(b.getAttribute('data-ob-del')),1); persist(c); renderObligationsSection(c); }));
  document.getElementById('ob-add')?.addEventListener('click',()=>openObligationForm(c));
  document.getElementById('ob-find')?.addEventListener('click',()=>runFindObligations(c));
}
function openObligationForm(c, seed){
  seed=seed||{desc:'',due:'',recurring:'none',assignee:'',quote:''};
  const members=(getUsers()||[]).map(u=>u.name);
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-3">${seed._i!=null?'Edit':'Add'} obligation</h3>
      <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">Description</span>
        <input id="of-desc" value="${(seed.desc||'').replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
      <div class="grid grid-cols-2 gap-3 mb-2.5">
        <label class="block"><span class="text-[11px] font-600 text-ink/70">Due date</span>
          <input id="of-due" type="date" value="${seed.due||''}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
        <label class="block"><span class="text-[11px] font-600 text-ink/70">Recurring</span>
          <select id="of-recur" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${OBLIG_RECUR.map(([k,l])=>`<option value="${k}" ${seed.recurring===k?'selected':''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="block mb-4"><span class="text-[11px] font-600 text-ink/70">Assign to</span>
        <input id="of-assignee" list="of-members" value="${(seed.assignee||'').replace(/"/g,'&quot;')}" placeholder="Team member" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
        <datalist id="of-members">${members.map(m=>`<option value="${m}">`).join('')}</datalist></label>
      <div class="flex justify-end gap-2">
        <button id="of-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
        <button id="of-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save</button>
      </div>
    </div>`);
  document.getElementById('of-cancel').addEventListener('click',closeModal);
  document.getElementById('of-save').addEventListener('click',()=>{
    const o={ id:seed.id||('ob_'+Math.abs((Date.parse(nowISO())+(c.obligations||[]).length)).toString(36)),
      desc:document.getElementById('of-desc').value.trim(), due:document.getElementById('of-due').value,
      recurring:document.getElementById('of-recur').value, assignee:document.getElementById('of-assignee').value.trim(),
      status:seed.status||'open', quote:seed.quote||'' };
    if(!o.desc){ toast('Enter a description','err'); return; }
    c.obligations=c.obligations||[];
    if(seed._i!=null) c.obligations[seed._i]=o; else c.obligations.push(o);
    logAudit(c,'Obligation',`Added: ${o.desc}${o.due?` (due ${o.due})`:''}`);
    persist(c); closeModal(); renderObligationsSection(c);
  });
}
async function runFindObligations(c){
  const btn=document.getElementById('ob-find'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Scanning…</span>'; }
  const found=await extractObligations(c);
  if(btn){ btn.disabled=false; }
  renderObligationsSection(c);
  if(!found.length){ toast('No obligations detected'); return; }
  openObligationsReview(c, found);
}
function openObligationsReview(c, found){
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">Proposed obligations</h3></div>
      <p class="text-xs text-ink/60 mb-3">Tick the ones to add. You can edit dates and assignees after adding. Nothing is saved until you confirm.</p>
      <div class="space-y-2 max-h-[45vh] overflow-y-auto scroll-thin mb-4">
        ${found.map((o,i)=>`<label class="flex gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 cursor-pointer">
          <input type="checkbox" data-ob-pick="${i}" checked class="mt-0.5 h-4 w-4 rounded border-brand-200 accent-brand-700"/>
          <span class="min-w-0"><span class="block text-[12.5px] font-500 text-ink">${(o.desc||'').replace(/</g,'&lt;')}</span>
          ${o.quote?`<span class="block text-[10px] text-ink/50 italic mt-0.5">“${o.quote.replace(/</g,'&lt;')}”</span>`:''}</span></label>`).join('')}
      </div>
      <div class="flex justify-end gap-2">
        <button id="or-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
        <button id="or-add" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Add selected</button>
      </div>
    </div>`);
  document.getElementById('or-cancel').addEventListener('click',closeModal);
  document.getElementById('or-add').addEventListener('click',()=>{
    c.obligations=c.obligations||[];
    let n=0;
    document.querySelectorAll('[data-ob-pick]').forEach(cb=>{ if(cb.checked){ const o=found[Number(cb.getAttribute('data-ob-pick'))];
      c.obligations.push({ id:'ob_'+Math.random().toString(36).slice(2,8), desc:o.desc, due:o.due||'', recurring:o.recurring||'none', assignee:'', status:'open', quote:o.quote||'' }); n++; } });
    logAudit(c,'Obligation',`Added ${n} obligation${n===1?'':'s'} from AI scan`);
    persist(c); closeModal(); renderObligationsSection(c);
    toast(`Added ${n} obligation${n===1?'':'s'}`);
  });
}

Object.assign(window,{OBLIG_RECUR,renewalDecisionDate,obState,contractObligations,allObligations,overdueObligationCount,renewalDecisionsDue,heuristicObligations,extractObligations,renderObligationsSection,openObligationForm,runFindObligations,openObligationsReview});
