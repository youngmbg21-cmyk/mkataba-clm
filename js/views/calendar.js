// HaTi — E3 renewal calendar & obligations agenda. Globals window-attached.

let calState = { ym:null };   // {y, m} current month; null -> this month resolved at render

function calMonth(){ if(!calState.ym){ const d=new Date(); calState.ym={y:d.getFullYear(), m:d.getMonth()}; } return calState.ym; }
const CAL_EVENT = {
  expiry:     { dot:'#B23A2E', label:'Expiry' },
  renewal:    { dot:'#C79A3E', label:'Renewal decision' },
  obligation: { dot:'#086B54', label:'Obligation' },
};
/* Gather every lifecycle event as {date, type, cid, cname, note}. */
function calendarEvents(){
  const out=[];
  state.contracts.forEach(c=>{
    if(c.status!=='Declined'){
      const exp=(c.metadata&&c.metadata.expiryDate)||c.expiry;
      if(exp) out.push({ date:exp, type:'expiry', cid:c.id, cname:c.name, note:c.counterparty||'' });
      const dd=renewalDecisionDate(c);
      if(dd && dd!==exp) out.push({ date:dd, type:'renewal', cid:c.id, cname:c.name, note:'decide by' });
    }
    (c.obligations||[]).forEach(o=>{ if(o.due) out.push({ date:o.due, type:'obligation', cid:c.id, cname:c.name, note:o.desc, done:o.status==='done' }); });
  });
  return out;
}

function renderCalendar(){
  const {y,m}=calMonth();
  const first=new Date(y,m,1), start=first.getDay(), days=new Date(y,m+1,0).getDate();
  const monthName=first.toLocaleDateString('en-KE',{month:'long',year:'numeric'});
  const evs=calendarEvents();
  const byDay={}; evs.forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });
  const todayIso=new Date().toISOString().slice(0,10);
  const cell=(dnum)=>{
    if(dnum<1||dnum>days) return `<div class="min-h-[84px] rounded-lg bg-slate-50/40"></div>`;
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(dnum).padStart(2,'0')}`;
    const es=(byDay[iso]||[]).slice(0,3), more=(byDay[iso]||[]).length-es.length;
    return `<div class="min-h-[84px] rounded-lg border ${iso===todayIso?'border-brand-400 bg-brand-50/40':'border-line bg-white'} p-1.5 flex flex-col gap-1">
      <div class="text-[10px] font-mono ${iso===todayIso?'text-brand-700 font-700':'text-ink/50'}">${dnum}</div>
      ${es.map(e=>`<button data-cal-open="${e.cid}" title="${CAL_EVENT[e.type].label}: ${(e.note||'').replace(/"/g,'')}" class="flex items-center gap-1 text-left text-[9.5px] leading-tight rounded px-1 py-0.5 hover:bg-slate-50 ${e.done?'opacity-45 line-through':''}">
        <span class="h-1.5 w-1.5 rounded-full shrink-0" style="background:${CAL_EVENT[e.type].dot}"></span><span class="truncate">${(e.cname||'').replace(/</g,'&lt;')}</span></button>`).join('')}
      ${more>0?`<span class="text-[9px] text-ink/45 pl-1">+${more} more</span>`:''}
    </div>`;
  };
  const cells=[]; for(let i=0;i<42;i++) cells.push(cell(i-start+1));
  // agenda: upcoming events across the whole portfolio, next 60 days
  const agenda=evs.filter(e=>{ const d=daysUntil(e.date); return d>=-3 && d<=60 && !e.done; }).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,40);
  document.getElementById('content').innerHTML=`
  <div class="view-enter h-full flex flex-col">
    <header class="shrink-0 sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 max-w-[1240px] mx-auto w-full">
        <h1 class="font-display font-700 text-[26px] tracking-tight text-ink">Renewal Calendar</h1>
        <p class="text-[13px] text-ink/70 mt-0.5">Expiries, renewal decision deadlines and obligation due dates across the portfolio.</p>
      </div>
    </header>
    <div class="flex-1 min-h-0 overflow-auto scroll-thin px-8 py-6 max-w-[1240px] mx-auto w-full grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div class="bg-white rounded-2xl elev-2 p-4">
        <div class="flex items-center gap-3 mb-3">
          <button id="cal-prev" class="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-slate-50">${icon('arrowLeft','w-4 h-4')}</button>
          <h2 class="font-display font-600 text-ink text-lg flex-1 text-center">${monthName}</h2>
          <button id="cal-next" class="h-8 w-8 grid place-items-center rounded-lg border border-line hover:bg-slate-50 rotate-180">${icon('arrowLeft','w-4 h-4')}</button>
          <button id="cal-today" class="rounded-lg border border-line px-3 py-1.5 text-[11px] font-600 text-ink/70 hover:bg-slate-50">Today</button>
        </div>
        <div class="grid grid-cols-7 gap-1 mb-1 text-[10px] font-mono uppercase tracking-wide text-ink/45 text-center">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div>${d}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-1">${cells.join('')}</div>
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-hair text-[11px] text-ink/60">
          ${Object.entries(CAL_EVENT).map(([k,v])=>`<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full" style="background:${v.dot}"></span>${v.label}</span>`).join('')}
        </div>
      </div>
      <div class="bg-white rounded-2xl elev-2 p-4">
        <h2 class="font-display font-600 text-ink mb-3">Next 60 days</h2>
        ${agenda.length?`<div class="space-y-1.5">${agenda.map(e=>{ const d=daysUntil(e.date); return `
          <button data-cal-open="${e.cid}" class="w-full text-left flex items-center gap-2 rounded-lg border border-line bg-white hover:border-brand-300 px-2.5 py-2 transition">
            <span class="h-2 w-2 rounded-full shrink-0" style="background:${CAL_EVENT[e.type].dot}"></span>
            <span class="min-w-0 flex-1"><span class="block text-[12px] font-500 text-ink truncate">${(e.cname||'').replace(/</g,'&lt;')}</span>
            <span class="block text-[10px] text-ink/55 truncate">${CAL_EVENT[e.type].label}${e.note&&e.type==='obligation'?' · '+e.note.replace(/</g,'&lt;'):''}</span></span>
            <span class="shrink-0 text-[10px] font-mono ${d<0?'text-rose-600':d<=7?'text-gold-600':'text-ink/50'}">${d<0?Math.abs(d)+'d ago':d+'d'}</span>
          </button>`; }).join('')}</div>`
        :`<p class="text-[12px] text-ink/55">Nothing due in the next 60 days.</p>`}
      </div>
    </div>
  </div>`;
  document.getElementById('cal-prev').addEventListener('click',()=>{ let {y,m}=calMonth(); m--; if(m<0){m=11;y--;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-next').addEventListener('click',()=>{ let {y,m}=calMonth(); m++; if(m>11){m=0;y++;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-today').addEventListener('click',()=>{ calState.ym=null; renderCalendar(); });
  document.querySelectorAll('[data-cal-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-cal-open'))));
  setActiveNav('calendar');
}

Object.assign(window,{calState,calMonth,calendarEvents,renderCalendar});
