// HaTi — Renewal calendar & obligations agenda. Globals window-attached.

let calState = { ym:null };   // {y, m} current month; null -> this month resolved at render

function calMonth(){ if(!calState.ym){ const d=new Date(); calState.ym={y:d.getFullYear(), m:d.getMonth()}; } return calState.ym; }
const CAL_EVENT = {
  expiry:     { dot:'#b0453c', fg:'#8f322b', label:'Expiry',           tint:'rgba(176,69,60,.13)' },
  renewal:    { dot:'#b8862b', fg:'#7d5a14', label:'Renewal decision', tint:'rgba(184,134,43,.15)' },
  obligation: { dot:'#2e8763', fg:'#1e6b4d', label:'Obligation',       tint:'rgba(46,135,99,.13)' },
};
// priority when a day carries more than one kind of event (drives its tint)
const CAL_PRIORITY = ['expiry','renewal','obligation'];
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

const _esc=s=>String(s||'').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const _dot=(color,px)=>`<span style="width:${px}px;height:${px}px;border-radius:50%;background:${color};flex:none"></span>`;

function renderCalendar(){
  const {y,m}=calMonth();
  const first=new Date(y,m,1), start=first.getDay(), days=new Date(y,m+1,0).getDate();
  const monthName=first.toLocaleDateString('en-KE',{month:'long',year:'numeric'});
  const evs=calendarEvents();
  const byDay={}; evs.forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });
  const todayIso=new Date().toISOString().slice(0,10);

  const cell=(dnum)=>{
    const inMonth=dnum>=1&&dnum<=days;
    if(!inMonth) return `<div style="min-height:62px;background:transparent;border:1px solid transparent"></div>`;
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(dnum).padStart(2,'0')}`;
    const today=iso===todayIso;
    const list=byDay[iso]||[], es=list.slice(0,3), more=list.length-es.length;
    // dominant event kind drives the cell tint + border so days with an
    // expiry / renewal / obligation read as coloured boxes at a glance
    const kind=CAL_PRIORITY.find(t=>list.some(e=>e.type===t&&!e.done)) || CAL_PRIORITY.find(t=>list.some(e=>e.type===t));
    const ev=kind?CAL_EVENT[kind]:null;
    const bg=today?'rgba(89,128,166,.1)':(ev?ev.tint:'var(--color-bg)');
    const bd=today?'var(--color-accent)':(ev?ev.dot:'var(--color-divider)');
    const cellStyle=`min-height:62px;padding:4px 5px;display:flex;flex-direction:column;gap:2px;cursor:default;`+
      `background:${bg};border:1px solid ${bd}`;
    const numStyle=`font-family:var(--font-mono);font-size:10px;color:${today?'var(--color-accent-800)':(ev?ev.fg:'var(--color-neutral-500)')};font-weight:${today||ev?700:400}`;
    const chips=es.map(e=>{
      const ev=CAL_EVENT[e.type];
      return `<button data-sel="${e.cid}" title="${ev.label}: ${_esc(e.note)}" style="display:flex;align-items:center;gap:4px;width:100%;padding:0;border:0;background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;font-size:9.5px;line-height:1.25;overflow:hidden;${e.done?'opacity:.45;text-decoration:line-through':''}">`+
        _dot(ev.dot,6)+`<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.cname)}</span></button>`;
    }).join('');
    const moreLine=more>0?`<span style="font-size:9px;color:var(--color-neutral-500);padding-left:2px">+${more} more</span>`:'';
    return `<div class="cal-day" style="${cellStyle}"><span style="${numStyle}">${dnum}</span>${chips}${moreLine}</div>`;
  };
  const cells=[]; for(let i=0;i<42;i++) cells.push(cell(i-start+1));

  // agenda: upcoming events across the whole portfolio, next 60 days
  const agenda=evs.filter(e=>{ const d=daysUntil(e.date); return d>=-3 && d<=60 && !e.done; }).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,40);

  const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div>${d}</div>`).join('');

  const agendaRows=agenda.length?agenda.map(e=>{
    const ev=CAL_EVENT[e.type], d=daysUntil(e.date);
    const inTxt=d<0?Math.abs(d)+'d ago':d+'d';
    const kind=ev.label+' · '+_esc(e.cid);
    return `<button data-sel="${e.cid}" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 2px;border:0;border-bottom:1px solid rgba(29,31,32,.07);background:none;cursor:pointer;font:inherit;text-align:left;color:inherit" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">`+
      _dot(ev.dot,7)+
      `<span style="flex:1;min-width:0">`+
        `<span style="display:block;font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.cname)}</span>`+
        `<span style="display:block;font-size:10px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${kind}</span>`+
      `</span>`+
      `<span style="font-size:10px;font-weight:600;font-family:var(--font-mono);color:${ev.fg};flex:none">${inTxt}</span>`+
    `</button>`;
  }).join(''):`<p style="font-size:11.5px;color:var(--color-neutral-600);margin:2px 0 0">Nothing due in the next 60 days.</p>`;

  const btnBase='width:26px;height:26px;display:grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;cursor:pointer;font-size:13px;color:var(--color-neutral-700);line-height:1';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:14px 16px 28px">
    <style>
      .cal-day{transition:box-shadow .14s ease,border-color .14s ease;position:relative}
      .cal-day:hover{border-color:var(--color-accent)!important;box-shadow:0 0 0 2px rgba(89,128,166,.32),0 4px 14px rgba(43,43,45,.16);z-index:2}
    </style>
    <div style="display:grid;grid-template-columns:1fr 280px;gap:14px;align-items:start">
      <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px;padding:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <h4 style="margin:0;font-family:var(--font-heading);font-size:16px;color:var(--color-text)">${monthName}</h4>
          <div style="display:flex;gap:4px">
            <button id="cal-prev" style="${btnBase}">‹</button>
            <button id="cal-next" style="${btnBase}">›</button>
            <button id="cal-today" style="height:26px;padding:0 9px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;color:var(--color-neutral-700)">Today</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-600);text-align:center;margin-bottom:3px">
          ${weekdays}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells.join('')}</div>
        <div style="display:flex;gap:14px;margin-top:9px;padding-top:8px;border-top:1px solid var(--color-divider);font-size:10.5px;color:var(--color-neutral-700)">
          ${Object.values(CAL_EVENT).map(v=>`<span style="display:flex;align-items:center;gap:5px">${_dot(v.dot,7)}${v.label}</span>`).join('')}
        </div>
      </section>
      <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px;padding:12px">
        <h4 style="font-family:var(--font-heading);font-size:14px;margin:0 0 8px;color:var(--color-text)">Next 60 days</h4>
        ${agendaRows}
      </section>
    </div>
  </div>`;

  document.getElementById('cal-prev').addEventListener('click',()=>{ let {y,m}=calMonth(); m--; if(m<0){m=11;y--;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-next').addEventListener('click',()=>{ let {y,m}=calMonth(); m++; if(m>11){m=0;y++;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-today').addEventListener('click',()=>{ calState.ym=null; renderCalendar(); });
  document.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>selectContract(b.getAttribute('data-sel'))));
  setActiveNav('calendar');
}

Object.assign(window,{calState,calMonth,calendarEvents,renderCalendar});
